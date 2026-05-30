// src/main/database/repositories/raiderRepository.js
import { getDB } from '../database.js';

export const raiderRepository = {
    findByName(name) {
        return getDB().prepare('SELECT id, player_id, class FROM raiders WHERE LOWER(name) = LOWER(?)').get(name.trim());
    },
    findByNameUpper(name) {
        return getDB().prepare('SELECT id FROM raiders WHERE UPPER(name) = UPPER(?)').get(name.trim());
    },
    findById(id) {
        return getDB().prepare('SELECT id, name, player_id, class FROM raiders WHERE id = ?').get(id);
    },
    create(name, rClass, playerId = null) {
        return getDB().prepare('INSERT INTO raiders (name, class, player_id) VALUES (?, ?, ?)').run(name, rClass, playerId);
    },
    createIgnore(name, rClass) {
        getDB().prepare('INSERT OR IGNORE INTO raiders (name, class) VALUES (?, ?)').run(name, rClass);
    },
    updateClassAndPlayer(id, rClass, playerId) {
        getDB().prepare('UPDATE raiders SET class = ?, player_id = ? WHERE id = ?').run(rClass, playerId, id);
    },
    updatePlayerOnly(id, playerId) {
        getDB().prepare('UPDATE raiders SET player_id = ? WHERE id = ?').run(playerId, id);
    },
    updatePlayerGroup(newPlayerId, oldPlayerId) {
        getDB().prepare('UPDATE raiders SET player_id = ? WHERE player_id = ?').run(newPlayerId, oldPlayerId);
    },
    findPlayerByName(nickname) {
        return getDB().prepare('SELECT id FROM players WHERE LOWER(nickname) = LOWER(?)').get(nickname.trim());
    },
    createPlayer(nickname) {
        return getDB().prepare('INSERT INTO players (nickname) VALUES (?)').run(nickname.trim());
    },
    deletePlayer(id) {
        getDB().prepare('DELETE FROM players WHERE id = ?').run(id);
    },
    getNotesByRaider(raiderId) {
        return getDB().prepare(`
            SELECT rn.id, r.name AS character_name, COALESCE(s.instance, 'Nota General') AS instance, rn.note_text, rn.severity
            FROM raider_notes rn
            JOIN raiders r ON rn.raider_id = r.id
            LEFT JOIN sessions s ON rn.session_id = s.id
            WHERE rn.raider_id = ? ORDER BY rn.id DESC
        `).all(raiderId);
    },
    getStatsSummary(raiderId) {
        return getDB().prepare(`
            SELECT TOTAL(CASE WHEN severity = 'LOW' THEN 1 END) AS lows,
                   TOTAL(CASE WHEN severity = 'MEDIUM' THEN 1 END) AS mediums,
                   TOTAL(CASE WHEN severity = 'HIGH' THEN 1 END) AS highs,
                   TOTAL(CASE WHEN severity = 'LOW' THEN 1 WHEN severity = 'MEDIUM' THEN 3 WHEN severity = 'HIGH' THEN 5 ELSE 0 END) AS gravity_total
            FROM raider_notes WHERE raider_id = ?
        `).get(raiderId);
    },
    getAttendanceHistory(raiderId) {
        return getDB().prepare(`
            SELECT r.name AS character_name, s.instance AS raid_name, s.notes, s.date, g.name AS guild_name 
            FROM raiders r
            JOIN session_raiders sr ON r.id = sr.raider_id
            JOIN sessions s ON sr.session_id = s.id
            JOIN guilds g ON s.guild_id = g.id
            WHERE r.id = ? ORDER BY s.date DESC
        `).all(raiderId);
    },
    getAlters(playerId, excludeRaiderId) {
        return getDB().prepare('SELECT id, name, class FROM raiders WHERE player_id = ? AND id != ? ORDER BY name ASC').all(playerId, excludeRaiderId);
    },
    searchUnfiltered(sessionId) {
        const sId = Number(sessionId || 0);
        
        return getDB().prepare(`
            SELECT 
                COALESCE(p.id, 0) AS id, 
                r.id AS raider_id, 
                r.player_id, 
                r.name AS nickname, 
                r.class,
                COALESCE(p.nickname, '[ SIN ASIGNAR ]') AS owner_name, 
                TOTAL(CASE WHEN rn.severity = 'LOW' THEN 1 WHEN rn.severity = 'MEDIUM' THEN 3 WHEN rn.severity = 'HIGH' THEN 5 ELSE 0 END) AS gravity_total,
                COUNT(DISTINCT sr.session_id) AS total_asistencias
            FROM raiders r
            LEFT JOIN players p ON r.player_id = p.id     
            LEFT JOIN raider_notes rn ON r.id = rn.raider_id
            LEFT JOIN session_raiders sr ON r.id = sr.raider_id
            WHERE (? = 0 OR r.id NOT IN (SELECT raider_id FROM session_raiders WHERE session_id = ? AND status = 'ACTIVE'))
            GROUP BY r.id, r.player_id, r.name, r.class, p.id, p.nickname
            ORDER BY total_asistencias DESC, gravity_total DESC, r.name ASC
            LIMIT 15
        `.trim()).all(sId, sId); // Pasamos sId dos veces para cubrir ambos '?'
    },
    searchFiltered(term, sessionId) {
        return getDB().prepare(`
            SELECT 
                COALESCE(p.id, 0) AS id, 
                r.id AS raider_id, 
                r.player_id, 
                r.name AS nickname, 
                r.class, 
                COALESCE(p.nickname, '[ SIN ASIGNAR ]') AS owner_name,
                TOTAL(CASE WHEN rn.severity = 'LOW' THEN 1 WHEN rn.severity = 'MEDIUM' THEN 3 WHEN rn.severity = 'HIGH' THEN 5 ELSE 0 END) AS gravity_total
            FROM raiders r
            LEFT JOIN players p ON r.player_id = p.id
            LEFT JOIN raider_notes rn ON r.id = rn.raider_id
            WHERE r.name LIKE ? AND r.id NOT IN (SELECT raider_id FROM session_raiders WHERE session_id = ? AND status = 'ACTIVE')
            GROUP BY r.id, r.player_id, r.name, r.class, p.id, p.nickname
            ORDER BY r.name ASC 
            LIMIT 15
        `.trim()).all(term, sessionId);
    },
    createNote(raiderId, sessionId, noteText, severity) {
        const validRaiderId = Number(raiderId);
        if (!Number.isInteger(validRaiderId) || validRaiderId <= 0) {
            throw new Error(`raiderRepository.createNote requiere un raiderId válido. Valor recibido: ${raiderId}`);
        }

        const validSessionId = sessionId !== undefined && sessionId !== null && sessionId !== ''
            ? Number(sessionId)
            : null;

        return getDB().prepare('INSERT INTO raider_notes (raider_id, session_id, note_text, severity) VALUES (?, ?, ?, ?)').run(validRaiderId, validSessionId, noteText, severity);
    },
    deleteNote(noteId) {
        getDB().prepare('DELETE FROM raider_notes WHERE id = ?').run(noteId);
    },
    updateNote(noteId, text, severity) {
        getDB().prepare('UPDATE raider_notes SET note_text = ?, severity = ? WHERE id = ?').run(text, severity, noteId);
    }
};