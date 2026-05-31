// src/main/database/repositories/guildRepository.js
import { getDB } from '../database.js';

export const guildRepository = {
    findAllActive() {
        return getDB().prepare('SELECT * FROM guilds WHERE is_active = 1 ORDER BY name ASC').all();
    },
    findAll() {
        return getDB().prepare('SELECT * FROM guilds WHERE id != 1 ORDER BY name ASC').all();
    },
    findByName(name) {
        return getDB().prepare('SELECT id, name FROM guilds WHERE LOWER(name) = LOWER(?)').get(name);
    },
    create(name) {
        const result = getDB().prepare('INSERT INTO guilds (name) VALUES (?)').run(name);
        return result.lastInsertRowid;
    },
    updateStatus(id, isActive) {
        return getDB().prepare('UPDATE guilds SET is_active = ? WHERE id = ?').run(isActive ? 1 : 0, id);
    }  
};