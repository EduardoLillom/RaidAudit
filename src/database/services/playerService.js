// src/database/services/playerService.js
import { getDB } from '../database.js';
import { raiderRepository } from '../repositories/raiderRepository.js';

export const playerService = {
    getPlayerProfile(playerId, raiderId) {
        const pId = Number(playerId);
        const rId = Number(raiderId);
        if (rId === 0) return { characters: [], history: [], summary: { lows:0, mediums:0, highs:0, gravity_total:0 }, notes: [], unassigned: true };

        return {
            notes: raiderRepository.getNotesByRaider(rId),
            summary: raiderRepository.getStatsSummary(rId),
            history: raiderRepository.getAttendanceHistory(rId),
            characters: pId > 0 ? raiderRepository.getAlters(pId, rId) : [],
            unassigned: pId === 0
        };
    },
    searchPlayers(term, sessionId = null) {
        const cleanTerm = String(term || '').trim();
        const safeSessionId = sessionId ? Number(sessionId) : 0;

        if (cleanTerm === '') {
            return raiderRepository.searchUnfiltered(safeSessionId);
        }
        
        return raiderRepository.searchFiltered(`${cleanTerm}%`, safeSessionId);
    },
    getRaiderStatus(name, rClass) {
        const raider = raiderRepository.findByName(name);
        let raiderId;

        if (!raider) {
            const result = raiderRepository.create(name, rClass);
            raiderId = result.lastInsertRowid;
        } else {
            raiderId = raider.id;
        }

        const stats = raiderRepository.getStatsSummary(raiderId ? raiderId : 0);
        return {
            id: raiderId,
            lows: stats.lows,
            mediums: stats.mediums,
            highs: stats.highs,
            gravity_total: stats.gravity_total
        };
    },
    addRaiderNota(raiderId, sessionId, noteText, severity) {
        const validRaiderId = Number(raiderId);
        if (!Number.isInteger(validRaiderId) || validRaiderId <= 0) {
            throw new Error(`No se puede guardar una nota sin un ID de Raider válido. Valor recibido: ${raiderId}`);
        }

        const validSessionId = sessionId !== undefined && sessionId !== null && sessionId !== ''
            ? Number(sessionId)
            : null;
        if (validSessionId !== null && (!Number.isInteger(validSessionId) || validSessionId <= 0)) {
            throw new Error(`El sessionId proporcionado no es válido: ${sessionId}`);
        }

        const db = getDB();
        db.exec('BEGIN TRANSACTION;');
        try {
            const result = raiderRepository.createNote(validRaiderId, validSessionId, String(noteText || ''), String(severity || 'LOW'));
            db.exec('COMMIT;');
            return result.lastInsertRowid;
        } catch (error) {
            db.exec('ROLLBACK;');
            throw error;
        }
    },
    deleteNote(noteId) {
        raiderRepository.deleteNote(noteId);
    },
    updateNote(noteId, text, severity) {
        raiderRepository.updateNote(noteId, text, severity);
    },
    linkRaiders(raiderIdA, raiderIdB) {
        const rIdA = Number(raiderIdA);
        const rIdB = Number(raiderIdB);
        if (rIdA === rIdB) throw new Error("No puedes enlazar un personaje consigo mismo.");

        const db = getDB();
        db.exec('BEGIN TRANSACTION;');
        try {
            const raiderA = raiderRepository.findById(rIdA);
            const raiderB = raiderRepository.findById(rIdB);
            if (!raiderA || !raiderB) throw new Error("Uno o ambos personajes no existen.");

            let pIdA = raiderA.player_id;
            let pIdB = raiderB.player_id;

            if (!pIdA && !pIdB) {
                const newPlayer = raiderRepository.createPlayer(`Cuenta_${raiderA.name}`);
                const newPlayerId = newPlayer.lastInsertRowid;
                raiderRepository.updatePlayerOnly(rIdA, newPlayerId);
                raiderRepository.updatePlayerOnly(rIdB, newPlayerId);
            } else if (!pIdA && pIdB) {
                raiderRepository.updatePlayerOnly(rIdA, pIdB);
            } else if (pIdA && !pIdB) {
                raiderRepository.updatePlayerOnly(rIdB, pIdA);
            } else if (pIdA !== pIdB) {
                raiderRepository.updatePlayerGroup(pIdA, pIdB);
                raiderRepository.deletePlayer(pIdB);
            }

            db.exec('COMMIT;');
            return { success: true, message: "Personajes enlazados correctamente." };
        } catch (error) {
            db.exec('ROLLBACK;');
            throw error;
        }
    },
    bulkImportPlayers(playersList) {
        if (!Array.isArray(playersList)) throw new Error('Los datos proporcionados deben ser una lista.');

        const db = getDB();
        db.exec('BEGIN TRANSACTION;');
        try {
            let createdRaiders = 0, updatedRaiders = 0, createdPlayers = 0;

            // FASE 1: Registro Directo
            for (const item of playersList) {
                const charName = String(item.name || item.nickname || item.character || item.character_name || '').trim();
                const charClass = String(item.class || item.character_class || item.spec || 'PALADIN').toUpperCase().trim();
                if (!charName) continue;

                const ownerNameInput = item.player || item.owner || item.player_name || item.owner_name || item.nickname_player || item.cuenta || '';
                let ownerName = String(ownerNameInput).trim();
                if (!ownerName && !item.main) ownerName = charName;

                let playerId = null;
                if (ownerName && ownerName.toLowerCase() !== '[ sin asignar ]') {
                    const dbPlayer = raiderRepository.findPlayerByName(ownerName);
                    if (!dbPlayer) {
                        const insertPlayerRes = raiderRepository.createPlayer(ownerName);
                        playerId = Number(insertPlayerRes.lastInsertRowid);
                        createdPlayers++;
                    } else {
                        playerId = Number(dbPlayer.id);
                    }
                }

                const dbRaider = raiderRepository.findByName(charName);
                if (!dbRaider) {
                    raiderRepository.create(charName, charClass, playerId);
                    createdRaiders++;
                } else {
                    let shouldUpdate = false;
                    let finalPlayerId = dbRaider.player_id;
                    let finalClass = dbRaider.class;

                    if (dbRaider.class !== charClass) { finalClass = charClass; shouldUpdate = true; }
                    if (playerId !== null && dbRaider.player_id !== playerId) { finalPlayerId = playerId; shouldUpdate = true; }

                    if (shouldUpdate) {
                        raiderRepository.updateClassAndPlayer(dbRaider.id, finalClass, finalPlayerId);
                        updatedRaiders++;
                    }
                }
            }

            // FASE 2: Relaciones de Mains / Alters alternos
            for (const item of playersList) {
                const charName = String(item.name || item.nickname || item.character || item.character_name || '').trim();
                const mainName = item.main ? String(item.main).trim() : null;
                if (!charName || !mainName) continue;

                const dbAlter = raiderRepository.findByName(charName);
                const dbMain = raiderRepository.findByName(mainName);

                if (dbAlter && dbMain && dbMain.player_id && dbAlter.player_id !== dbMain.player_id) {
                    raiderRepository.updatePlayerOnly(dbAlter.id, dbMain.player_id);
                    if (dbAlter.class === String(item.class || '').toUpperCase().trim()) {
                        updatedRaiders++;
                    }
                }
            }

            db.exec('COMMIT;');
            return {
                success: true,
                createdRaiders, updatedRaiders, createdPlayers,
                message: `Importación completada: ${createdRaiders} creados, ${updatedRaiders} actualizados.`
            };
        } catch (error) {
            db.exec('ROLLBACK;');
            throw error;
        }
    }
};