import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { app } from 'electron';

let db;
let dbPath;

function initDatabase() {
    if (!db) {
        dbPath = path.join(app.getPath('userData'), 'azeroth_data_local.db');
        db = new DatabaseSync(dbPath);
        db.exec('PRAGMA foreign_keys = ON;');
    }

    db.exec(`
        CREATE TABLE IF NOT EXISTS guilds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
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
            session_id INTEGER,
            raider_id INTEGER,
            subgroup INTEGER DEFAULT 1,
            PRIMARY KEY (session_id, raider_id),
            FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE,
            FOREIGN KEY (raider_id) REFERENCES raiders (id) ON DELETE CASCADE
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
    `);

    // CORREGIDO: Usamos db.prepare().get()
    const checkGuilds = db.prepare('SELECT COUNT(*) as count FROM guilds').get();
    
    if (checkGuilds.count === 0) {
        db.exec('BEGIN TRANSACTION;');
        try {
            // CORREGIDO: Usamos db.prepare().run()
            db.prepare('INSERT INTO guilds (name) VALUES (?)').run('Global / Pug');
            db.exec('COMMIT;');
            console.log("// BASE DE DATOS INICIALIZADA: SE AGREGÓ 'Global / Pug'.");
        } catch (e) {
            db.exec('ROLLBACK;');
            console.error('Fallo al insertar la guild por defecto:', e);
        }
    }
}

function getAllGuilds() {
    // CORREGIDO: .prepare().all()
    return db.prepare('SELECT * FROM guilds ORDER BY name ASC').all();
}

function getGuildHistory(guildId) {
    // CORREGIDO: .prepare().all()
    return db.prepare('SELECT id, name, instance, notes, date, start_time, end_time, status FROM sessions WHERE guild_id = ? ORDER BY date DESC').all(guildId);
}

function getActiveSession() {
    // CORREGIDO: .prepare().get()
    return db.prepare('SELECT id, instance, notes, guild_id, date, start_time, end_time, status FROM sessions WHERE status = ? ORDER BY date DESC LIMIT 1').get('active');
}

function getPlayerProfile(playerId, raiderId) {
    const pId = Number(playerId);
    const rId = Number(raiderId);

    if (rId === 0) {
        return { characters: [], history: [], summary: { lows:0, mediums:0, highs:0, gravity_total:0 }, notes: [], unassigned: true };
    }

    // 1. NOTAS EXCLUSIVAS de este personaje seleccionado
    const notes = db.prepare(`
    SELECT 
        rn.id AS id, 
        r.name AS character_name, 
        COALESCE(s.instance, 'Nota General') AS instance, 
        rn.note_text AS note_text, 
        rn.severity AS severity
    FROM raider_notes rn
    JOIN raiders r ON rn.raider_id = r.id
    LEFT JOIN sessions s ON rn.session_id = s.id
    WHERE rn.raider_id = ?
    ORDER BY rn.id DESC
    `).all(rId);

    // 2. SCOREBOARD EXCLUSIVO de este personaje seleccionado
    const summary = db.prepare(`
        SELECT 
            TOTAL(CASE WHEN severity = 'LOW' THEN 1 END) AS lows,
            TOTAL(CASE WHEN severity = 'MEDIUM' THEN 1 END) AS mediums,
            TOTAL(CASE WHEN severity = 'HIGH' THEN 1 END) AS highs,
            TOTAL(
                CASE 
                    WHEN severity = 'LOW' THEN 1 
                    WHEN severity = 'MEDIUM' THEN 3 
                    WHEN severity = 'HIGH' THEN 5 
                    ELSE 0 
                END
            ) AS gravity_total
        FROM raider_notes 
        WHERE raider_id = ?
    `).get(rId);

    // 3. HISTORIAL DE ASISTENCIA exclusivo de este personaje
    const history = db.prepare(`
        SELECT r.name AS character_name, s.instance AS raid_name, s.notes, s.date, g.name AS guild_name 
        FROM raiders r
        JOIN session_raiders sr ON r.id = sr.raider_id
        JOIN sessions s ON sr.session_id = s.id
        JOIN guilds g ON s.guild_id = g.id
        WHERE r.id = ?
        ORDER BY s.date DESC
    `).all(rId);

    // 4. ALTERS VINCULADOS (Si pId > 0, buscamos sus "hermanos", si no, lista vacía)
    let characters = [];
    if (pId > 0) {
        characters = db.prepare(`
            SELECT id, name, class 
            FROM raiders 
            WHERE player_id = ? AND id != ? 
            ORDER BY name ASC
        `).all(pId, rId); // Excluimos al personaje actual de la lista de alters para no duplicarlo
    }

    return { 
        characters, 
        history, 
        summary, 
        notes, 
        unassigned: pId === 0 
    };
}

function searchPlayers(term) {
    // CASO A: Si el término de búsqueda viene vacío, cargamos una lista rápida inicial (los últimos 15 creados)
    if (!term || term.trim() === '') {
        const defaultQuery = `
            SELECT 
                COALESCE(p.id, 0) AS id,                  -- ID Maestro (0 si es NULL)
                r.id AS raider_id,                        -- ID Único del Personaje
                r.player_id AS player_id,
                r.name AS nickname,                       -- Nombre del Raider
                COALESCE(p.nickname, '[ SIN ASIGNAR ]') AS owner_name, -- Dueño de la Cuenta
                TOTAL(
                    CASE 
                        WHEN rn.severity = 'LOW' THEN 1
                        WHEN rn.severity = 'MEDIUM' THEN 3
                        WHEN rn.severity = 'HIGH' THEN 5
                        ELSE 0
                    END
                ) AS gravity_total
            FROM raiders r
            LEFT JOIN players p ON r.player_id = p.id     
            LEFT JOIN raider_notes rn ON r.id = rn.raider_id
            GROUP BY r.id
            ORDER BY r.id DESC 
            LIMIT 15;
        `;
        return db.prepare(defaultQuery).all();
    }

    // CASO B: Si el usuario escribió un término en la barra, filtramos usando LIKE
    const query = `
        SELECT 
            COALESCE(p.id, 0) AS id,                  
            r.id AS raider_id,
            r.player_id AS player_id,                        
            r.name AS nickname,                       
            COALESCE(p.nickname, '[ SIN ASIGNAR ]') AS owner_name,
            TOTAL(
                CASE 
                    WHEN rn.severity = 'LOW' THEN 1
                    WHEN rn.severity = 'MEDIUM' THEN 3
                    WHEN rn.severity = 'HIGH' THEN 5
                    ELSE 0
                END
            ) AS gravity_total
        FROM raiders r
        LEFT JOIN players p ON r.player_id = p.id     
        LEFT JOIN raider_notes rn ON r.id = rn.raider_id
        WHERE r.name LIKE ?
        GROUP BY r.id
        ORDER BY r.name ASC
        LIMIT 15;
    `;

    // Buscamos cualquier nombre de raider que empiece con el término escrito
    return db.prepare(query).all(`${term.trim()}%`);
}

function getRaiderStatus(name) {
    // Buscamos al raider. Si no existe, podemos retornarlo vacío o crearlo aquí.
    const raider = db.prepare('SELECT id FROM raiders WHERE UPPER(name) = UPPER(?)').get(name.trim());
    
    // Tu consulta actual que cuenta lows, mediums, highs...
    const stats = db.prepare(`
        SELECT 
            TOTAL(CASE WHEN severity = 'LOW' THEN 1 END) AS lows,
            TOTAL(CASE WHEN severity = 'MEDIUM' THEN 1 END) AS mediums,
            TOTAL(CASE WHEN severity = 'HIGH' THEN 1 END) AS highs,
            TOTAL(CASE WHEN severity = 'LOW' THEN 1 WHEN severity = 'MEDIUM' THEN 3 WHEN severity = 'HIGH' THEN 5 ELSE 0 END) AS gravity_total
        FROM raider_notes 
        WHERE raider_id = ?
    `).get(raider ? raider.id : 0);

    return {
        id: raider ? raider.id : null, // 👈 ¡Retornamos la ID real de la BD!
        lows: stats.lows,
        mediums: stats.mediums,
        highs: stats.highs,
        gravity_total: stats.gravity_total
    };
}

function insertRaidSession(data) {
    db.exec('BEGIN TRANSACTION;');
    try {
        // CORREGIDO: .prepare().run() y se usa lastInsertRowid en lugar de lastID
        const result = db.prepare(
            `INSERT INTO sessions (instance, notes, date, start_time, guild_id) VALUES (?, ?, datetime('now'), ?, ?)`
        ).run(
            data.instance || 'ICC',
            data.notes || '',
            data.currentTime,
            data.guildId
        );

        const sessionId = result.lastInsertRowid;

        const insertRaiderStmt = db.prepare('INSERT OR IGNORE INTO raiders (name, class) VALUES (?, ?)');
        const getRaiderStmt = db.prepare('SELECT id FROM raiders WHERE name = ?');
        const insertSessionRaiderStmt = db.prepare('INSERT INTO session_raiders (session_id, raider_id, subgroup) VALUES (?, ?, ?)');

        for (const r of data.raiders) {
            insertRaiderStmt.run(r.name, r.class);
            const dbRaider = getRaiderStmt.get(r.name);
            insertSessionRaiderStmt.run(sessionId, dbRaider.id, r.subgroup || 1);
        }

        db.exec('COMMIT;');
        return sessionId;
    } catch (error) {
        db.exec('ROLLBACK;');
        throw error;
    }
}

function endRaidSession(sessionId, endTime) {
    // CORREGIDO: .prepare().run()
    db.prepare('UPDATE sessions SET end_time = ?, status = ? WHERE id = ?').run(endTime, 'completed', sessionId);
    return sessionId;
}

function addRaiderToSession(sessionId, raiderName, raiderClass, subgroup = 1) {
    db.exec('BEGIN TRANSACTION;');
    try {
        // CORREGIDO: Preparando declaraciones síncronas
        db.prepare('INSERT OR IGNORE INTO raiders (name, class) VALUES (?, ?)').run(raiderName, rClass);
        const dbRaider = db.prepare('SELECT id FROM raiders WHERE name = ?').get(raiderName);
        db.prepare('INSERT OR IGNORE INTO session_raiders (session_id, raider_id, subgroup) VALUES (?, ?, ?)').run(sessionId, dbRaider.id, subgroup);
        
        db.exec('COMMIT;');
        return dbRaider.id;
    } catch (error) {
        db.exec('ROLLBACK;');
        throw error;
    }
}

function addRaiderNota(raiderId, sessionId, noteText, severity) {
    // El raiderId SÍ es obligatorio siempre
    if (!raiderId) {
        throw new Error('No se puede guardar una nota sin especificar el ID del Raider.');
    }

    db.exec('BEGIN TRANSACTION;');
    try {
        const result = db.prepare(`
            INSERT INTO raider_notes (raider_id, session_id, note_text, severity) 
            VALUES (?, ?, ?, ?)
        `).run(
            Number(raiderId),
            sessionId ? Number(sessionId) : null, // 👈 SI es null, guarda NULL en SQLite limpiamente
            String(noteText || ''),
            String(severity || 'LOW')
        );

        db.exec('COMMIT;');
        return result.lastInsertRowid; 
    } catch (error) {
        db.exec('ROLLBACK;');
        console.error('Error al insertar la nota del raider:', error);
        throw error;
    }
}

function removeRaiderFromSession(sessionId, raiderId) {
    // CORREGIDO: .prepare().run()
    db.prepare('DELETE FROM session_raiders WHERE session_id = ? AND raider_id = ?').run(sessionId, raiderId);
}

function getSessionRaiders(sessionId) {
    const query = `
        SELECT 
            sr.raider_id AS id, 
            r.name, 
            r.class, 
            sr.subgroup,
            (SELECT note_text FROM raider_notes WHERE raider_id = r.id ORDER BY id DESC LIMIT 1) AS last_note,
            TOTAL(CASE WHEN rn.severity = 'LOW' THEN 1 END) AS lows,
            TOTAL(CASE WHEN rn.severity = 'MEDIUM' THEN 1 END) AS mediums,
            TOTAL(CASE WHEN rn.severity = 'HIGH' THEN 1 END) AS highs,
            TOTAL(
                CASE 
                    WHEN rn.severity = 'LOW' THEN 1
                    WHEN rn.severity = 'MEDIUM' THEN 3
                    WHEN rn.severity = 'HIGH' THEN 5
                    ELSE 0
                END
            ) AS gravedad_total
        FROM session_raiders sr 
        JOIN raiders r ON sr.raider_id = r.id 
        LEFT JOIN raider_notes rn ON r.id = rn.raider_id
        WHERE sr.session_id = ? 
        GROUP BY r.id
        ORDER BY sr.subgroup ASC, r.name ASC
    `;

    return db.prepare(query).all(sessionId);
}

function linkRaiders(raiderIdA, raiderIdB) {
    const rIdA = Number(raiderIdA);
    const rIdB = Number(raiderIdB);

    if (rIdA === rIdB) throw new Error("No puedes enlazar un personaje consigo mismo.");

    db.exec('BEGIN TRANSACTION;');
    try {
        // 1. Obtener la información actual de ambos raiders
        const raiderA = db.prepare('SELECT player_id FROM raiders WHERE id = ?').get(rIdA);
        const raiderB = db.prepare('SELECT player_id FROM raiders WHERE id = ?').get(rIdB);

        if (!raiderA || !raiderB) {
            throw new Error("Uno o ambos personajes no existen en la base de datos.");
        }

        let pIdA = raiderA.player_id;
        let pIdB = raiderB.player_id;

        // CASO 1: Ambos son PUGs (No tienen cuenta maestra creada)
        if (!pIdA && !pIdB) {
            // Creamos una cuenta maestra genérica usando el nombre de uno de ellos temporalmente
            const raiderData = db.prepare('SELECT name FROM raiders WHERE id = ?').get(rIdA);
            const newPlayer = db.prepare('INSERT INTO players (nickname) VALUES (?)').run(`Cuenta_${raiderData.name}`);
            const newPlayerId = newPlayer.lastInsertRowid;

            // Asignamos ambos al nuevo ID maestro
            db.prepare('UPDATE raiders SET player_id = ? WHERE id IN (?, ?)').run(newPlayerId, rIdA, rIdB);
        }
        
        // CASO 2: El Raider A es PUG, pero el Raider B ya tiene una cuenta asignada
        else if (!pIdA && pIdB) {
            db.prepare('UPDATE raiders SET player_id = ? WHERE id = ?').run(pIdB, rIdA);
        }

        // CASO 3: El Raider B es PUG, pero el Raider A ya tiene una cuenta asignada
        else if (pIdA && !pIdB) {
            db.prepare('UPDATE raiders SET player_id = ? WHERE id = ?').run(pIdA, rIdB);
        }

        // CASO 4: Ambos ya tenían cuentas maestras diferentes (FUSIÓN / EVITA BUCLES)
        else if (pIdA !== pIdB) {
            // Migramos TODOS los alters que apuntaban a la cuenta B hacia la cuenta A
            db.prepare('UPDATE raiders SET player_id = ? WHERE player_id = ?').run(pIdA, pIdB);

            // Opcional: Eliminamos la cuenta maestra B que quedó huérfana y vacía
            db.prepare('DELETE FROM players WHERE id = ?').run(pIdB);
        }

        db.exec('COMMIT;');
        return { success: true, message: "Personajes enlazados correctamente." };
    } catch (error) {
        db.exec('ROLLBACK;');
        console.error("Error en la fusión de personajes:", error);
        throw error;
    }
}

const dbmanager = {
    initDatabase,
    getAllGuilds,
    getGuildHistory,
    getPlayerProfile,
    getRaiderStatus,
    insertRaidSession,
    endRaidSession,
    addRaiderToSession,
    removeRaiderFromSession,
    getActiveSession,
    getSessionRaiders,
    addRaiderNota,
    searchPlayers,
    linkRaiders,
};

export { dbmanager };