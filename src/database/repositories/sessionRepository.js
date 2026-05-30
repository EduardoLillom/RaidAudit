// src/main/database/repositories/sessionRepository.js
import { getDB } from '../database.js';

export const sessionRepository = {
    findAllHistory() {
        return getDB().prepare(`
            SELECT s.id, s.instance, s.notes, s.date, s.start_time, s.end_time, s.status, s.guild_id, g.name AS guild_name
            FROM sessions s
            JOIN guilds g ON g.id = s.guild_id
            ORDER BY s.date DESC, s.id DESC
        `).all();
    },
    findFilteredHistory(whereSql, params) {
        return getDB().prepare(`
            SELECT id, name, instance, notes, date, start_time, end_time, status
            FROM sessions
            WHERE ${whereSql}
            ORDER BY date DESC
        `).all(...params);
    },
    findActive() {
        return getDB().prepare('SELECT id, instance, notes, guild_id, date, start_time, end_time, status FROM sessions WHERE status = ? ORDER BY date DESC LIMIT 1').get('active');
    },
    create(instance, notes, currentTime, guildId) {
        const result = getDB().prepare(
            `INSERT INTO sessions (instance, notes, date, start_time, guild_id) VALUES (?, ?, datetime('now'), ?, ?)`
        ).run(instance, notes, currentTime, guildId);
        return result.lastInsertRowid;
    },
    updateStatus(sessionId, endTime, status) {
        getDB().prepare('UPDATE sessions SET end_time = ?, status = ? WHERE id = ?').run(endTime, status, sessionId);
    },
    addRaider(sessionId, raiderId, subgroup) {
        getDB().prepare('INSERT OR IGNORE INTO session_raiders (session_id, raider_id, subgroup) VALUES (?, ?, ?)').run(sessionId, raiderId, subgroup);
    },
    removeRaider(sessionId, raiderId) {
        getDB().prepare('DELETE FROM session_raiders WHERE session_id = ? AND raider_id = ?').run(sessionId, raiderId);
    },
    getActiveRaidersBySession(sessionId) {
        return getDB().prepare(`
            SELECT sr.raider_id AS id, r.name, r.class, sr.subgroup,
                (SELECT note_text FROM raider_notes WHERE raider_id = r.id ORDER BY id DESC LIMIT 1) AS last_note,
                TOTAL(CASE WHEN rn.severity = 'LOW' THEN 1 END) AS lows,
                TOTAL(CASE WHEN rn.severity = 'MEDIUM' THEN 1 END) AS mediums,
                TOTAL(CASE WHEN rn.severity = 'HIGH' THEN 1 END) AS highs,
                TOTAL(CASE WHEN rn.severity = 'LOW' THEN 1 WHEN rn.severity = 'MEDIUM' THEN 3 WHEN rn.severity = 'HIGH' THEN 5 ELSE 0 END) AS gravedad_total
            FROM session_raiders sr 
            JOIN raiders r ON sr.raider_id = r.id 
            LEFT JOIN raider_notes rn ON r.id = rn.raider_id
            WHERE sr.session_id = ? AND sr.status = 'ACTIVE'
            GROUP BY r.id
            ORDER BY sr.subgroup ASC, r.name ASC
        `).all(sessionId);
    },
    closeRaiderCycle(sessionId, raiderId, replacedById, noteText) {
        getDB().prepare(`
            UPDATE session_raiders 
            SET status = 'REPLACED', replaced_by_id = ?, change_note = ?, left_time = time('now')
            WHERE session_id = ? AND raider_id = ? AND status = 'ACTIVE'
        `).run(replacedById, noteText, sessionId, raiderId);
    },
    openRaiderCycle(sessionId, raiderId, subgroup, noteText) {
        getDB().prepare(`
            INSERT INTO session_raiders (session_id, raider_id, subgroup, status, change_note, joined_time) 
            VALUES (?, ?, ?, 'ACTIVE', ?, time('now'))
        `).run(sessionId, raiderId, subgroup, noteText);
    },
    isRaiderActiveInSession(sessionId, raiderId) {
        const res = getDB().prepare("SELECT 1 FROM session_raiders WHERE session_id = ? AND raider_id = ? AND status = 'ACTIVE'").get(sessionId, raiderId);
        return !!res;
    }
};