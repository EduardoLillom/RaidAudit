import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDatabase } from '../database/database.js';

// ─── IMPORTACIÓN DE TUS SERVICIOS REALES ───
// Tus servicios están en src/database/services
import { guildService } from '../database/services/guildService.js';
import { playerService } from '../database/services/playerService.js';
import { raidService } from '../database/services/raidService.js'; // Cambiado de raidSessionService a raidService

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
const isDev = !app.isPackaged;
const devServerURL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

function createWindow() {
    let preloadPath = isDev 
        ? path.join(__dirname, '../preload/preload.cjs')
        : path.join(app.getAppPath(), 'src', 'preload', 'preload.cjs');
    
    console.log('[Main] isDev:', isDev);
    console.log('[Main] App path:', app.getAppPath());
    console.log('[Main] Preload path:', preloadPath);
    
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 1000,
        minWidth: 1200,
        minHeight: 800,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    mainWindow.setMenu(null);
    if (isDev) {
        mainWindow.loadURL(devServerURL);
        mainWindow.webContents.openDevTools();
    } else {
        const indexPath = path.join(__dirname, '../../dist/index.html');
        console.log('Loading index.html from:', indexPath);
        mainWindow.loadFile(indexPath).catch(err => {
            console.error('Error loading index.html:', err);
        });
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    try {
        initDatabase();
    } catch (error) {
        console.error('Error inicializando la base de datos:', error);
        process.stderr.write(`[DB ERROR] ${error.message}\n`);
    }

    createWindow();
    
    // Handler para reportar errores desde el renderer
    ipcMain.handle('log-error', (event, errorMsg) => {
        console.error('[RENDERER ERROR]', errorMsg);
        return { logged: true };
    });
    
    // ─────────────────────────────────────────────────────────────────
    //       IPC HANDLERS CONECTADOS A TUS SERVICIOS DEFINITIVOS
    // ─────────────────────────────────────────────────────────────────

    // Hermandades (guildService)
    ipcMain.handle('db:getAllGuildsActive', () => guildService.getAllGuildsActive());
    ipcMain.handle('db:getAllGuildsWithStatus', () => guildService.getAllGuildsWithStatus());
    ipcMain.handle('db:createGuild', (event, name) => guildService.createGuild(name));
    ipcMain.handle('db:updateGuildStatus', (event, guildId, isActive) => guildService.updateGuildStatus(guildId, isActive));

    // Jugadores y Notas (playerService)
    ipcMain.handle('db:getPlayerProfile', (event, playerId, raiderId) => playerService.getPlayerProfile(playerId, raiderId));
    ipcMain.handle('db:getRaiderStatus', (event, name, rclass) => playerService.getRaiderStatus(name, rclass));
    ipcMain.handle('db:searchPlayers', (event, query, sessionId) => playerService.searchPlayers(query, sessionId));
    ipcMain.handle('db:linkRaiders', (event, raiderId1, raiderId2) => playerService.linkRaiders(raiderId1, raiderId2));
    ipcMain.handle('db:bulkImportPlayers', (event, playersList) => playerService.bulkImportPlayers(playersList));
    
    // El método interno de playerService se llama 'addRaiderNota' según tu declaración
    ipcMain.handle('db:addRaiderNota', (event, raiderId, sessionId, noteText, severity) => playerService.addRaiderNota(raiderId, sessionId, noteText, severity));
    ipcMain.handle('db:deleteNote', (event, noteId) => playerService.deleteNote(noteId));
    ipcMain.handle('db:updateNote', (event, noteId, newText, newSeverity) => playerService.updateNote(noteId, newText, newSeverity));

    // Sesiones e Historial de Raids (raidService)
    ipcMain.handle('db:getAllSessionsHistory', () => raidService.getSessionsHistory());
    ipcMain.handle('db:getGuildHistory', (event, guildId) => raidService.getGuildHistory(guildId));
    ipcMain.handle('db:insertRaidSession', (event, data) => raidService.insertRaidSession(data));
    ipcMain.handle('db:endRaidSession', (event, sessionId, endTime) => raidService.endRaidSession(sessionId, endTime));
    ipcMain.handle('db:markRaidSessionIncomplete', (event, sessionId, endTime) => raidService.markRaidSessionIncomplete(sessionId, endTime));
    ipcMain.handle('db:getActiveSession', () => raidService.getActiveSession());
    ipcMain.handle('db:getSessionRaiders', (event, sessionId) => raidService.getSessionRaiders(sessionId));
    
    // Gestión de integrantes en la Raid activa
    ipcMain.handle('db:addRaiderToSession', (event, sessionId, name, cls, subgroup) => raidService.addRaiderToSession(sessionId, name, cls, subgroup));
    ipcMain.handle('db:removeRaiderFromSession', (event, sessionId, raiderId) => raidService.removeRaiderFromSession(sessionId, raiderId));
    ipcMain.handle('db:reemplazarRaider', (event, sessionId, raiderOutId, raiderInId, noteText, subgroup) => raidService.reemplazarRaider(sessionId, raiderOutId, raiderInId, noteText, subgroup));

    // Handler para abrir URLs en el navegador del sistema operativo
    ipcMain.handle('open-external-url', async (event, url) => {
        try {
            await shell.openExternal(url);
            return { success: true };
        } catch (error) {
            console.error('Error abriendo enlace externo:', error);
            return { success: false, error: error.message };
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) createWindow();
});