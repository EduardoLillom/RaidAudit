import { app, BrowserWindow, ipcMain, shell } from 'electron'; // 1. Agregado 'shell' aquí
import path from 'path';
import { fileURLToPath } from 'url';
import { dbmanager } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
const isDev = !app.isPackaged;
const devServerURL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 1000,
        minWidth: 1200,
        minHeight: 800,
        webPreferences: {
            preload: path.join(__dirname, '../preload/preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    
    mainWindow.setMenu(null);
    if (isDev) {
        mainWindow.loadURL(devServerURL);
        mainWindow.webContents.openDevTools();
    } else {
        // Carga el archivo index.html
        mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    try {
        dbmanager.initDatabase();
    } catch (error) {
        console.error('Error inicializando la base de datos:', error);
    }

    createWindow();
    
    // IPC Handlers de la Base de Datos
    ipcMain.handle('db:getAllGuilds', () => dbmanager.getAllGuilds());
    ipcMain.handle('db:getAllGuildsWithStatus', () => dbmanager.getAllGuildsWithStatus());
    ipcMain.handle('db:createGuild', (event, name) => dbmanager.createGuild(name));
    ipcMain.handle('db:updateGuildStatus', (event, guildId, isActive) => dbmanager.updateGuildStatus(guildId, isActive));
    ipcMain.handle('db:getAllSessionsHistory', () => dbmanager.getAllSessionsHistory());
    ipcMain.handle('db:getGuildHistory', (event, guildId) => dbmanager.getGuildHistory(guildId));
    ipcMain.handle('db:getPlayerProfile', (event, playerId, raiderId) => dbmanager.getPlayerProfile(playerId, raiderId));
    ipcMain.handle('db:getRaiderStatus', (event, name) => dbmanager.getRaiderStatus(name));
    ipcMain.handle('db:insertRaidSession', (event, data) => dbmanager.insertRaidSession(data));
    ipcMain.handle('db:endRaidSession', (event, sessionId, endTime) => dbmanager.endRaidSession(sessionId, endTime));
    ipcMain.handle('db:markRaidSessionIncomplete', (event, sessionId, endTime) => dbmanager.markRaidSessionIncomplete(sessionId, endTime));
    ipcMain.handle('db:addRaiderToSession', (event, sessionId, name, cls, subgroup) => dbmanager.addRaiderToSession(sessionId, name, cls, subgroup));
    ipcMain.handle('db:removeRaiderFromSession', (event, sessionId, raiderId) => dbmanager.removeRaiderFromSession(sessionId, raiderId));
    ipcMain.handle('db:getActiveSession', () => dbmanager.getActiveSession());
    ipcMain.handle('db:getSessionRaiders', (event, sessionId) => dbmanager.getSessionRaiders(sessionId));
    ipcMain.handle('db:addRaiderNota', (event, raiderId, sessionId, noteText, severity) => dbmanager.addRaiderNota(raiderId, sessionId, noteText, severity));
    ipcMain.handle('db:searchPlayers', (event, query, sessionId) => dbmanager.searchPlayers(query, sessionId));
    ipcMain.handle('db:linkRaiders', (event, raiderId1, raiderId2) => dbmanager.linkRaiders(raiderId1, raiderId2));
    ipcMain.handle('db:deleteNote', (event, noteId) => dbmanager.deleteNote(noteId));
    ipcMain.handle('db:updateNote', (event, noteId, newText, newSeverity) => dbmanager.updateNote(noteId, newText, newSeverity));
    ipcMain.handle('db:reemplazarRaider', (event, sessionId, raiderOutId, raiderInId, noteText, subgroup) => dbmanager.reemplazarRaider(sessionId, raiderOutId, raiderInId, noteText, subgroup));
    ipcMain.handle('db:bulkImportPlayers', (event, playersList) => dbmanager.bulkImportPlayers(playersList));

    // 2. NUEVO: Handler dedicado para abrir URLs en el navegador del sistema operativo
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
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});