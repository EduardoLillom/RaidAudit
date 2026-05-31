// src/preload/preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);

contextBridge.exposeInMainWorld('apiDB', {
    logError: (msg) => invoke('log-error', msg),
    openExternalUrl: (url) => invoke('open-external-url', url),
    openExternalLink: (url) => invoke('open-external-url', url),

    getAllGuildsActive: () => invoke('db:getAllGuildsActive'),
    getAllGuildsWithStatus: () => invoke('db:getAllGuildsWithStatus'),
    createGuild: (name) => invoke('db:createGuild', name),
    updateGuildStatus: (guildId, isActive) => invoke('db:updateGuildStatus', guildId, isActive),

    getAllSessionsHistory: () => invoke('db:getAllSessionsHistory'),
    getGuildHistory: (guildId) => invoke('db:getGuildHistory', guildId),
    getPlayerProfile: (playerId, raiderId) => invoke('db:getPlayerProfile', playerId, raiderId),
    getRaiderStatus: (name, rclass) => invoke('db:getRaiderStatus', name, rclass),

    insertRaidSession: (data) => invoke('db:insertRaidSession', data),
    endRaidSession: (sessionId, endTime) => invoke('db:endRaidSession', sessionId, endTime),
    markRaidSessionIncomplete: (sessionId, endTime) => invoke('db:markRaidSessionIncomplete', sessionId, endTime),
    getActiveSession: () => invoke('db:getActiveSession'),
    getSessionRaiders: (sessionId) => invoke('db:getSessionRaiders', sessionId),

    addRaiderToSession: (sessionId, name, cls, subgroup) => invoke('db:addRaiderToSession', sessionId, name, cls, subgroup),
    removeRaiderFromSession: (sessionId, raiderId) => invoke('db:removeRaiderFromSession', sessionId, raiderId),
    reemplazarRaider: (sessionId, raiderOutId, raiderInId, noteText, subgroup) => invoke('db:reemplazarRaider', sessionId, raiderOutId, raiderInId, noteText, subgroup),

    addRaiderNota: (raiderId, sessionId, noteText, severity) => invoke('db:addRaiderNota', raiderId, sessionId, noteText, severity),
    deleteNote: (noteId) => invoke('db:deleteNote', noteId),
    updateNote: (noteId, newText, newSeverity) => invoke('db:updateNote', noteId, newText, newSeverity),

    searchPlayers: (query, sessionId) => invoke('db:searchPlayers', query, sessionId),
    linkRaiders: (raiderId1, raiderId2) => invoke('db:linkRaiders', raiderId1, raiderId2),
    bulkImportPlayers: (playersList) => invoke('db:bulkImportPlayers', playersList),

    db: {
        getAllGuilds: () => ipcRenderer.invoke('db:getAllGuilds'),
        getAllGuildsWithStatus: () => ipcRenderer.invoke('db:getAllGuildsWithStatus'),
        createGuild: (name) => ipcRenderer.invoke('db:createGuild', name),
        updateGuildStatus: (guildId, isActive) => ipcRenderer.invoke('db:updateGuildStatus', guildId, isActive),
        
        getAllSessionsHistory: () => ipcRenderer.invoke('db:getAllSessionsHistory'),
        getGuildHistory: (guildId) => ipcRenderer.invoke('db:getGuildHistory', guildId),
        getPlayerProfile: (playerId, raiderId) => ipcRenderer.invoke('db:getPlayerProfile', playerId, raiderId),
        getRaiderStatus: (name) => ipcRenderer.invoke('db:getRaiderStatus', name),
        
        insertRaidSession: (data) => ipcRenderer.invoke('db:insertRaidSession', data),
        endRaidSession: (sessionId, endTime) => ipcRenderer.invoke('db:endRaidSession', sessionId, endTime),
        markRaidSessionIncomplete: (sessionId, endTime) => ipcRenderer.invoke('db:markRaidSessionIncomplete', sessionId, endTime),
        getActiveSession: () => ipcRenderer.invoke('db:getActiveSession'),
        getSessionRaiders: (sessionId) => ipcRenderer.invoke('db:getSessionRaiders', sessionId),
        
        addRaiderToSession: (sessionId, name, cls, subgroup) => ipcRenderer.invoke('db:addRaiderToSession', sessionId, name, cls, subgroup),
        removeRaiderFromSession: (sessionId, raiderId) => ipcRenderer.invoke('db:removeRaiderFromSession', sessionId, raiderId),
        reemplazarRaider: (sessionId, raiderOutId, raiderInId, noteText, subgroup) => ipcRenderer.invoke('db:reemplazarRaider', sessionId, raiderOutId, raiderInId, noteText, subgroup),
        
        addRaiderNota: (raiderId, sessionId, noteText, severity) => ipcRenderer.invoke('db:addRaiderNota', raiderId, sessionId, noteText, severity),
        deleteNote: (noteId) => ipcRenderer.invoke('db:deleteNote', noteId),
        updateNote: (noteId, newText, newSeverity) => ipcRenderer.invoke('db:updateNote', noteId, newText, newSeverity),
        
        searchPlayers: (query, sessionId) => ipcRenderer.invoke('db:searchPlayers', query, sessionId),
        linkRaiders: (raiderId1, raiderId2) => ipcRenderer.invoke('db:linkRaiders', raiderId1, raiderId2),
        bulkImportPlayers: (playersList) => ipcRenderer.invoke('db:bulkImportPlayers', playersList)
    }
});