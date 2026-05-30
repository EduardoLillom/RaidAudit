// src/main/database/database.js
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { app } from 'electron';
import { DATABASE_SCHEMA } from './schema.js';

let db = null;

export function initDatabase() {
    if (db) return db;

    const dbPath = app.isPackaged 
        ? path.join(process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(app.getPath('exe')), 'azeroth_data_local.db')
        : path.join(app.getPath('userData'), 'azeroth_data_local.db');

    db = new DatabaseSync(dbPath);
    
    // Configurar restricciones de integridad
    db.exec('PRAGMA foreign_keys = ON;');
    
    // Crear tablas
    db.exec(DATABASE_SCHEMA);

    // Semilla inicial (Seed)
    const checkGuilds = db.prepare('SELECT COUNT(*) as count FROM guilds').get();
    if (checkGuilds.count === 0) {
        db.exec('BEGIN TRANSACTION;');
        try {
            db.prepare('INSERT INTO guilds (name) VALUES (?)').run('Global / Pug');
            db.exec('COMMIT;');
            console.log("// BASE DE DATOS INICIALIZADA: SE AGREGÓ 'Global / Pug'.");
        } catch (e) {
            db.exec('ROLLBACK;');
            console.error('Fallo al insertar la guild por defecto:', e);
        }
    }

    return db;
}

/**
 * Helper para obtener la instancia activa de la base de datos de forma segura
 */
export function getDB() {
    if (!db) {
        return initDatabase();
    }
    return db;
}