// src/main/services/raidService.js
import { getDB } from '../database.js';
import { sessionRepository } from '../repositories/sessionRepository.js';
import { raiderRepository } from '../repositories/raiderRepository.js';

export const raidService = {
    getSessionsHistory() {
        return sessionRepository.findAllHistory();
    },
    getGuildHistory(guildId, filters = {}) {
        const normalizedFilters = filters || {};
        const whereClauses = ['guild_id = ?'];
        const params = [guildId];

        if (normalizedFilters.dateFrom) {
            whereClauses.push('date >= ?');
            params.push(String(normalizedFilters.dateFrom));
        }
        if (normalizedFilters.dateTo) {
            whereClauses.push('date <= ?');
            params.push(String(normalizedFilters.dateTo));
        }

        const durationFormula = `
            CASE
                WHEN start_time IS NULL OR end_time IS NULL THEN NULL
                ELSE ((CAST(substr(end_time, 1, 2) AS INTEGER) * 60 + CAST(substr(end_time, 4, 2) AS INTEGER))
                    - (CAST(substr(start_time, 1, 2) AS INTEGER) * 60 + CAST(substr(start_time, 4, 2) AS INTEGER)))
                    + CASE WHEN (CAST(substr(end_time, 1, 2) AS INTEGER) * 60 + CAST(substr(end_time, 4, 2) AS INTEGER)) < (CAST(substr(start_time, 1, 2) AS INTEGER) * 60 + CAST(substr(start_time, 4, 2) AS INTEGER)) THEN 1440 ELSE 0 END
            END
        `;

        if (normalizedFilters.minDuration !== undefined && normalizedFilters.minDuration !== '' && normalizedFilters.minDuration !== null) {
            whereClauses.push(`${durationFormula} >= ?`);
            params.push(Number(normalizedFilters.minDuration));
        }
        if (normalizedFilters.maxDuration !== undefined && normalizedFilters.maxDuration !== '' && normalizedFilters.maxDuration !== null) {
            whereClauses.push(`${durationFormula} <= ?`);
            params.push(Number(normalizedFilters.maxDuration));
        }

        return sessionRepository.findFilteredHistory(whereClauses.join(' AND '), params);
    },
    getActiveSession() {
        return sessionRepository.findActive();
    },
    insertRaidSession(data) {
        const db = getDB();
        db.exec('BEGIN TRANSACTION;');
        try {
            const sessionId = sessionRepository.create(
                data.instance || 'ICC',
                data.notes || '',
                data.currentTime,
                data.guildId
            );

            for (const r of data.raiders) {
                raiderRepository.createIgnore(r.name, r.class);
                const dbRaider = raiderRepository.findByName(r.name);
                sessionRepository.addRaider(sessionId, dbRaider.id, r.subgroup || 1);
            }

            db.exec('COMMIT;');
            return sessionId;
        } catch (error) {
            db.exec('ROLLBACK;');
            throw error;
        }
    },
    endRaidSession(sessionId, endTime) {
        sessionRepository.updateStatus(sessionId, endTime, 'completed');
        return sessionId;
    },
    markRaidSessionIncomplete(sessionId, endTime) {
        sessionRepository.updateStatus(sessionId, endTime, 'incomplete');
        return sessionId;
    },
    addRaiderToSession(sessionId, raiderName, raiderClass, subgroup = 1) {
        const safeName = String(raiderName || '').trim();
        const safeClass = String(raiderClass || 'PALADIN').trim() || 'PALADIN';
        if (!safeName) throw new Error('El nombre del raider es obligatorio.');

        const db = getDB();
        db.exec('BEGIN TRANSACTION;');
        try {
            raiderRepository.createIgnore(safeName, safeClass);
            const dbRaider = raiderRepository.findByName(safeName);
            sessionRepository.addRaider(Number(sessionId), dbRaider.id, Number(subgroup) || 1);
            db.exec('COMMIT;');
            return dbRaider.id;
        } catch (error) {
            db.exec('ROLLBACK;');
            throw error;
        }
    },
    removeRaiderFromSession(sessionId, raiderId) {
        sessionRepository.removeRaider(sessionId, raiderId);
    },
    getSessionRaiders(sessionId) {
        return sessionRepository.getActiveRaidersBySession(sessionId);
    },
    reemplazarRaider(sessionId, raiderOutId, raiderInId, noteText, subgroup) {
        const db = getDB();
        db.exec('BEGIN TRANSACTION;');
        try {
            // Evaluamos si realmente está entrando un raider válido
            const hasIncomingRaider = raiderInId && Number(raiderInId) !== 0;

            if (hasIncomingRaider) {
                // 🔄 CASO A: REEMPLAZO NORMAL (Jugador entra por otro)
                // Cierra ciclo del raider saliente
                sessionRepository.closeRaiderCycle(Number(sessionId), Number(raiderOutId), Number(raiderInId), noteText || 'Reemplazado');
                // Abre ciclo del entrante
                sessionRepository.openRaiderCycle(Number(sessionId), Number(raiderInId), Number(subgroup || 1), `Entra a cubrir a un compañero. Nota: ${noteText || ''}`);
            } else {
                // ❌ CASO B: EL JUGADOR SE VA (El slot queda libre)
                // Congelamos el registro del jugador actual en la tabla intermedia session_raiders
                // Nota: Si cambiaste el CHECK de tu DB a 'REMOVED' úsalo aquí. Si no, usa 'REPLACED' para no romper el constraint.
                const query = `
                    UPDATE session_raiders 
                    SET status = 'REMOVED', 
                        change_note = ?, 
                        left_time = time('now')
                    WHERE session_id = ? AND raider_id = ? AND status = 'ACTIVE';
                `;
                db.prepare(query).run(
                    noteText || 'Retirado de la raid / Baja', 
                    Number(sessionId), 
                    Number(raiderOutId)
                );
            }
            
            db.exec('COMMIT;');
            return true;
        } catch (error) {
            db.exec('ROLLBACK;');
            throw error;
        }
    }
};