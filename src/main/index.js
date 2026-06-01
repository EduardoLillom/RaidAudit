import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDatabase } from '../database/database.js';

// ─── OPTIMIZACIONES DE CHROMIUM (SWITCHES) ───
app.commandLine.appendSwitch('mute-audio');
app.commandLine.appendSwitch('disable-extensions');
app.commandLine.appendSwitch('disable-component-update');
app.commandLine.appendSwitch('disable-breakpad');
app.commandLine.appendSwitch('disable-report-upload');
app.commandLine.appendSwitch('disable-features', 'Translate,BlinkGenPropertyTrees');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('no-proxy-server');
app.commandLine.appendSwitch('disable-dns-prefetch');
app.commandLine.appendSwitch('disable-gpu-process-crash-limit');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let splashWindow; 

const isDev = !app.isPackaged;
const devServerURL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

// 💡 OPTIMIZADO: Carga instantánea desde memoria, evita leer el disco en el arranque frío
function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 450,
        height: 350,
        frame: false,         
        transparent: true,    
        alwaysOnTop: true,    
        resizable: false,
        center: true,
        show: false, // Evita el parpadeo blanco nativo de Windows antes de renderizar
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    // HTML e inyección de estilos directo en memoria para velocidad máxima
    const inlineSplashHTML = `
    data:text/html;charset=utf-8,
    <html>
    <head>
        <style>
            body {
                background: %231e1e24;
                color: white;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                font-family: system-ui, -apple-system, sans-serif;
                margin: 0;
                overflow: hidden;
                border-radius: 10px;
            }
            .loader {
                border: 3px solid %23333;
                border-top: 3px solid %23ff9f1c;
                border-radius: 50%;
                width: 35px;
                height: 35px;
                animation: spin 0.8s linear infinite;
                margin-top: 20px;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
    </head>
    <body>
        <h2 style="margin:0; font-weight: 500; font-size: 22px;">Iniciando Aplicación</h2>
        <p style="color: %23a0a0a5; margin: 8px 0 0 0; font-size: 14px;">Cargando módulos y base de datos...</p>
        <div class="loader"></div>
    </body>
    </html>
    `;

    splashWindow.loadURL(inlineSplashHTML);

    splashWindow.once('ready-to-show', () => {
        splashWindow.show();
    });
}

function createWindow() {
    let preloadPath = isDev 
        ? path.join(__dirname, '../preload/preload.cjs')
        : path.join(app.getAppPath(), 'src', 'preload', 'preload.cjs');
    
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 1000,
        minWidth: 1200,
        minHeight: 800,
        show: false, 
        backgroundColor: '#1e1e24', 
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    mainWindow.setMenu(null);

    mainWindow.once('ready-to-show', () => {
        if (splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.destroy(); 
        }
        mainWindow.show(); 
    });

    if (isDev) {
        mainWindow.loadURL(devServerURL);
        mainWindow.webContents.openDevTools();
    } else {
        const indexPath = path.join(__dirname, '../../dist/index.html');
        mainWindow.loadFile(indexPath).catch(err => {
            console.error('Error loading index.html:', err);
        });
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function registerIpcHandlers() {
    ipcMain.handle('log-error', (event, errorMsg) => {
        console.error('[RENDERER ERROR]', errorMsg);
        return { logged: true };
    });

    // ─── LAZY LOADING DE SERVICIOS INDIVIDUALES ───
    ipcMain.handle('db:getAllGuildsActive', async () => {
        const { guildService } = await import('../database/services/guildService.js');
        return guildService.getAllGuildsActive();
    });
    ipcMain.handle('db:getAllGuildsWithStatus', async () => {
        const { guildService } = await import('../database/services/guildService.js');
        return guildService.getAllGuildsWithStatus();
    });
    ipcMain.handle('db:createGuild', async (event, name) => {
        const { guildService } = await import('../database/services/guildService.js');
        return guildService.createGuild(name);
    });
    ipcMain.handle('db:updateGuildStatus', async (event, guildId, isActive) => {
        const { guildService } = await import('../database/services/guildService.js');
        return guildService.updateGuildStatus(guildId, isActive);
    });
    ipcMain.handle('db:getPlayerProfile', async (event, playerId, raiderId) => {
        const { playerService } = await import('../database/services/playerService.js');
        return playerService.getPlayerProfile(playerId, raiderId);
    });
    ipcMain.handle('db:getRaiderStatus', async (event, name, rclass) => {
        const { playerService } = await import('../database/services/playerService.js');
        return playerService.getRaiderStatus(name, rclass);
    });
    ipcMain.handle('db:searchPlayers', async (event, query, sessionId) => {
        const { playerService } = await import('../database/services/playerService.js');
        return playerService.searchPlayers(query, sessionId);
    });
    ipcMain.handle('db:linkRaiders', async (event, raiderId1, raiderId2) => {
        const { playerService } = await import('../database/services/playerService.js');
        return playerService.linkRaiders(raiderId1, raiderId2);
    });
    ipcMain.handle('db:bulkImportPlayers', async (event, playersList) => {
        const { playerService } = await import('../database/services/playerService.js');
        return playerService.bulkImportPlayers(playersList);
    });
    ipcMain.handle('db:addRaiderNota', async (event, raiderId, sessionId, noteText, severity) => {
        const { playerService } = await import('../database/services/playerService.js');
        return playerService.addRaiderNota(raiderId, sessionId, noteText, severity);
    });
    ipcMain.handle('db:deleteNote', async (event, noteId) => {
        const { playerService } = await import('../database/services/playerService.js');
        return playerService.deleteNote(noteId);
    });
    ipcMain.handle('db:updateNote', async (event, noteId, newText, newSeverity) => {
        const { playerService } = await import('../database/services/playerService.js');
        return playerService.updateNote(noteId, newText, newSeverity);
    });
    ipcMain.handle('db:getAllSessionsHistory', async () => {
        const { raidService } = await import('../database/services/raidService.js');
        return raidService.getSessionsHistory();
    });
    ipcMain.handle('db:getGuildHistory', async (event, guildId) => {
        const { raidService } = await import('../database/services/raidService.js');
        return raidService.getGuildHistory(guildId);
    });
    ipcMain.handle('db:insertRaidSession', async (event, data) => {
        const { raidService } = await import('../database/services/raidService.js');
        return raidService.insertRaidSession(data);
    });
    ipcMain.handle('db:endRaidSession', async (event, sessionId, endTime) => {
        const { raidService } = await import('../database/services/raidService.js');
        return raidService.endRaidSession(sessionId, endTime);
    });
    ipcMain.handle('db:markRaidSessionIncomplete', async (event, sessionId, endTime) => {
        const { raidService } = await import('../database/services/raidService.js');
        return raidService.markRaidSessionIncomplete(sessionId, endTime);
    });
    ipcMain.handle('db:getActiveSession', async () => {
        const { raidService } = await import('../database/services/raidService.js');
        return raidService.getActiveSession();
    });
    ipcMain.handle('db:getSessionRaiders', async (event, sessionId) => {
        const { raidService } = await import('../database/services/raidService.js');
        return raidService.getSessionRaiders(sessionId);
    });
    ipcMain.handle('db:addRaiderToSession', async (event, sessionId, name, cls, subgroup) => {
        const { raidService } = await import('../database/services/raidService.js');
        return raidService.addRaiderToSession(sessionId, name, cls, subgroup);
    });
    ipcMain.handle('db:removeRaiderFromSession', async (event, sessionId, raiderId) => {
        const { raidService } = await import('../database/services/raidService.js');
        return raidService.removeRaiderFromSession(sessionId, raiderId);
    });
    ipcMain.handle('db:reemplazarRaider', async (event, sessionId, raiderOutId, raiderInId, noteText, subgroup) => {
        const { raidService } = await import('../database/services/raidService.js');
        return raidService.reemplazarRaider(sessionId, raiderOutId, raiderInId, noteText, subgroup);
    });

    ipcMain.handle('open-external-url', async (event, url) => {
        try {
            await shell.openExternal(url);
            return { success: true };
        } catch (error) {
            console.error('Error abriendo enlace externo:', error);
            return { success: false, error: error.message };
        }
    });
}

// 💡 OPTIMIZADO: Reordenamiento asíncrono estricto del ciclo de vida
app.whenReady().then(() => {
    // 1. Descorchar la interfaz visual inmediatamente (Prioridad 1)
    createSplashWindow(); 
    
    // 2. Postergar el registro de IPCs al siguiente ciclo libre de la CPU
    setImmediate(() => {
        registerIpcHandlers();
    });

    // 3. Comenzar a levantar Chromium para la UI pesada en segundo plano
    setImmediate(() => {
        createWindow();
    });
    
    // 4. Inicializar la base de datos de manera aislada para no congelar la animación del loader
    setTimeout(async () => {
        try {
            await initDatabase();
        } catch (error) {
            console.error('Error inicializando la base de datos:', error);
        }
    }, 150); 
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) createWindow();
});