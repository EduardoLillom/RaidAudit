// CAMBIADO: Usamos require en lugar de import
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('apiDB', {
    getAllGuilds: () => ipcRenderer.invoke('db:getAllGuilds'),
    getGuildHistory: (guildId) => ipcRenderer.invoke('db:getGuildHistory', guildId),
    getPlayerProfile: (playerId, raiderId) => ipcRenderer.invoke('db:getPlayerProfile', playerId, raiderId),
    getRaiderStatus: (name) => ipcRenderer.invoke('db:getRaiderStatus', name),
    insertRaidSession: (data) => ipcRenderer.invoke('db:insertRaidSession', data),
    endRaidSession: (sessionId, endTime) => ipcRenderer.invoke('db:endRaidSession', sessionId, endTime),
    addRaiderToSession: (sessionId, name, cls, subgroup) => ipcRenderer.invoke('db:addRaiderToSession', sessionId, name, cls, subgroup),
    removeRaiderFromSession: (sessionId, raiderId) => ipcRenderer.invoke('db:removeRaiderFromSession', sessionId, raiderId),
    getActiveSession: () => ipcRenderer.invoke('db:getActiveSession'),
    getSessionRaiders: (sessionId) => ipcRenderer.invoke('db:getSessionRaiders', sessionId),
    addRaiderNota: (raiderId, sessionId, noteText, severity) => ipcRenderer.invoke('db:addRaiderNota', raiderId, sessionId, noteText, severity),
    searchPlayers: (query) => ipcRenderer.invoke('db:searchPlayers', query),
    openExternalLink: (url) => ipcRenderer.invoke('open-external-url', url),
    linkRaiders: (raiderId1, raiderId2) => ipcRenderer.invoke('db:linkRaiders', raiderId1, raiderId2),
});