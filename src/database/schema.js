// src/main/database/schema.js
export const DATABASE_SCHEMA = `
    CREATE TABLE IF NOT EXISTS guilds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nickname TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS raiders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        class TEXT NOT NULL,
        player_id INTEGER,
        FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        instance TEXT NOT NULL DEFAULT 'ICC',
        notes TEXT DEFAULT '',
        date DATETIME NOT NULL,
        start_time TEXT,
        end_time TEXT,
        guild_id INTEGER NOT NULL,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (guild_id) REFERENCES guilds (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS session_raiders (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        session_id INTEGER NOT NULL,
        raider_id INTEGER NOT NULL,
        subgroup INTEGER DEFAULT 1,
        status TEXT CHECK(status IN ('ACTIVE', 'REPLACED')) DEFAULT 'ACTIVE',
        replaced_by_id INTEGER,
        change_note TEXT DEFAULT NULL,
        joined_time TEXT NOT NULL DEFAULT (time('now')),
        left_time TEXT DEFAULT NULL, 
        FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE,
        FOREIGN KEY (raider_id) REFERENCES raiders (id) ON DELETE CASCADE,
        FOREIGN KEY (replaced_by_id) REFERENCES raiders (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS raider_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        raider_id INTEGER NOT NULL,
        session_id INTEGER,
        note_text TEXT NOT NULL,
        severity TEXT CHECK(severity IN ('LOW', 'MEDIUM', 'HIGH')) NOT NULL,
        FOREIGN KEY (raider_id) REFERENCES raiders (id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
    );
`;