import React, { useState, useEffect } from 'react';

export default function GestionTab() {
    // Sub-tab activa: 'importar' o 'guilds'
    const [activeSubTab, setActiveSubTab] = useState('importar');

    // ========== ESTADO: IMPORTAR JUGADORES ==========
    const [jsonText, setJsonText] = useState('');
    const [importError, setImportError] = useState(null);
    const [isValidJson, setIsValidJson] = useState(false);
    const [parsedList, setParsedList] = useState([]);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [showImportSuccess, setShowImportSuccess] = useState(false);

    // ========== ESTADO: GESTIONAR GUILDS ==========
    const [guilds, setGuilds] = useState([]);
    const [newGuildName, setNewGuildName] = useState('');
    const [guildFeedback, setGuildFeedback] = useState({ type: 'idle', message: '' });
    const [isCreatingGuild, setIsCreatingGuild] = useState(false);
    const [isLoadingGuilds, setIsLoadingGuilds] = useState(false);

    useEffect(() => { loadGuilds(); }, []);

    async function loadGuilds() {
        setIsLoadingGuilds(true);
        try {
            const data = await window.apiDB.getAllGuildsWithStatus();
            setGuilds(data);
        } catch (error) {
            setGuildFeedback({ type: 'error', message: 'No se pudieron cargar las guilds.' });
        } finally { setIsLoadingGuilds(false); }
    }

    useEffect(() => {
        const text = jsonText.trim();
        if (!text) {
            setImportError(null); setIsValidJson(false); setParsedList([]); return;
        }
        try {
            const parsed = JSON.parse(text);
            if (!Array.isArray(parsed)) {
                setImportError('El elemento principal debe ser un array [ ... ]');
                setIsValidJson(false); setParsedList([]); return;
            }
            const count = parsed.length;
            if (count === 0) {
                setImportError('La lista JSON está vacía.');
                setIsValidJson(false); setParsedList([]); return;
            }
            const invalidItem = parsed.find(item => {
                const name = item.name || item.nickname || item.character || item.character_name;
                return !name || typeof name !== 'string' || name.trim() === '';
            });
            if (invalidItem) {
                setImportError('Todos los jugadores deben tener la propiedad "name" o "nickname".');
                setIsValidJson(false); setParsedList([]); return;
            }
            setImportError(null); setIsValidJson(true); setParsedList(parsed);
        } catch (e) {
            setImportError(`Error de formato JSON: ${e.message}`);
            setIsValidJson(false); setParsedList([]);
        }
    }, [jsonText]);

    const handleImport = async () => {
        if (!isValidJson || parsedList.length === 0) return;
        setIsImporting(true); setImportResult(null);
        try {
            const result = await window.apiDB.bulkImportPlayers(parsedList);
            setImportResult(result); setShowImportSuccess(true); setJsonText('');
            setTimeout(() => setShowImportSuccess(false), 5000);
        } catch (err) {
            setImportError(`Error al importar: ${err.message}`);
        } finally { setIsImporting(false); }
    };

    async function handleCreateGuild(event) {
        event.preventDefault();
        const trimmedName = newGuildName.trim();
        if (!trimmedName) return;
        setIsCreatingGuild(true);
        try {
            await window.apiDB.createGuild(trimmedName);
            await loadGuilds();
            setNewGuildName('');
            setGuildFeedback({ type: 'success', message: `Guild creada: ${trimmedName}` });
        } catch (error) {
            setGuildFeedback({ type: 'error', message: error?.message || 'Error al crear guild.' });
        } finally { setIsCreatingGuild(false); }
    }

    async function toggleGuildStatus(guild) {
        try {
            await window.apiDB.updateGuildStatus(guild.id, !guild.is_active);
            await loadGuilds();
        } catch (error) {
            setGuildFeedback({ type: 'error', message: 'No se pudo actualizar la guild.' });
        }
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-tokyo-main/40 rounded-2xl border border-tokyo-border/40 overflow-hidden text-slate-300">
            
            {/* SUB-MENÚ DE NAVEGACIÓN INTERNA */}
            <div className="flex items-center bg-tokyo-dark border-b border-tokyo-border/50 px-4 h-12 flex-shrink-0 gap-2">
                <button
                    onClick={() => setActiveSubTab('importar')}
                    className={`px-4 h-full text-xs font-bold tracking-wider uppercase transition-all relative ${
                        activeSubTab === 'importar' ? 'text-tokyo-purple' : 'text-tokyo-comment hover:text-slate-300'
                    }`}
                >
                    📥 Importar Datos
                    {activeSubTab === 'importar' && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-tokyo-purple" />
                    )}
                </button>
                <button
                    onClick={() => setActiveSubTab('guilds')}
                    className={`px-4 h-full text-xs font-bold tracking-wider uppercase transition-all relative flex items-center gap-2 ${
                        activeSubTab === 'guilds' ? 'text-tokyo-cyan' : 'text-tokyo-comment hover:text-slate-300'
                    }`}
                >
                    ⚙️ Control de Guilds
                    <span className="bg-tokyo-panel text-[#7aa2f7] px-1.5 py-0.5 rounded-md text-[9px] font-mono">{guilds.length}</span>
                    {activeSubTab === 'guilds' && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#41a6b5]" />
                    )}
                </button>
            </div>

            {/* CONTENIDO DINÁMICO */}
            <div className="flex-1 flex flex-col min-h-0 p-6 overflow-hidden">
                
                {/* VISTA: IMPORTACIÓN */}
                {activeSubTab === 'importar' && (
                    <div className="flex-1 flex flex-col gap-4 min-h-0 animate-fadeIn">
                        <div className="flex flex-col">
                            <h2 className="text-sm font-black text-white uppercase tracking-wider">Carga masiva a través de búfer JSON</h2>
                            <p className="text-xs text-tokyo-comment mt-0.5">El sistema mapeará automáticamente las cuentas maestras y los personajes incluidos.</p>
                        </div>

                        <div className="flex-1 flex flex-col min-h-0 bg-tokyo-panel/50 border border-tokyo-border/60 rounded-xl overflow-hidden focus-within:border-tokyo-purple/60 transition-all">
                            <div className="bg-tokyo-dark/80 px-4 py-2 border-b border-tokyo-border/40 flex justify-between text-[10px] font-mono text-tokyo-comment">
                                <span>BUFFER_INPUT</span>
                                {isValidJson && <span className="text-[#9ece6a]">READY</span>}
                            </div>
                            <textarea
                                value={jsonText}
                                onChange={(e) => setJsonText(e.target.value)}
                                placeholder='Ej: [ { "name": "Zelmar", "class": "Mage" } ]'
                                className="flex-1 bg-transparent p-4 text-xs text-[#9ece6a] placeholder-tokyo-comment focus:outline-none font-mono resize-none leading-relaxed"
                            />
                        </div>

                        {importError && (
                            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300 font-mono">
                                ✕ {importError}
                            </div>
                        )}

                        {isValidJson && !importError && (
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300 font-mono">
                                ✓ Estructura analizada con éxito: {parsedList.length} registros listos.
                            </div>
                        )}

                        {showImportSuccess && importResult && (
                            <div className="rounded-xl border border-[#9ece6a]/20 bg-[#9ece6a]/10 p-3 text-xs text-[#9ece6a] font-mono">
                                🚀 Importación finalizada. Creados: {importResult.createdRaiders ?? 0} | Actualizados: {importResult.updatedRaiders ?? 0}
                            </div>
                        )}

                        <button
                            onClick={handleImport}
                            disabled={!isValidJson || isImporting}
                            className="bg-gradient-to-r from-[#bb9af7] to-[#9d7cd8] px-4 py-3 text-xs font-bold text-[#10131c] rounded-xl transition-all uppercase tracking-wider disabled:opacity-30"
                        >
                            {isImporting ? 'Procesando consulta masiva...' : 'Confirmar Importación'}
                        </button>
                    </div>
                )}

                {/* VISTA: CONFIGURACIÓN DE GUILDS */}
                {activeSubTab === 'guilds' && (
                    <div className="flex-1 flex gap-6 min-h-0 animate-fadeIn">
                        {/* Formulario lateral izquierdo */}
                        <div className="w-72 flex flex-col gap-4">
                            <div className="flex flex-col">
                                <h2 className="text-sm font-black text-white uppercase tracking-wider">Nueva Conexión</h2>
                                <p className="text-xs text-tokyo-comment mt-0.5">Agrega un nodo de hermandad a la base de datos.</p>
                            </div>
                            <form onSubmit={handleCreateGuild} className="flex flex-col gap-2 bg-tokyo-dark p-4 rounded-xl border border-tokyo-border/40">
                                <input
                                    type="text"
                                    value={newGuildName}
                                    onChange={(e) => setNewGuildName(e.target.value)}
                                    placeholder="Nombre de la Hermandad"
                                    className="w-full rounded-lg border border-[#313b54] bg-[#1f2335] px-3 py-2 text-xs text-white outline-none focus:border-tokyo-cyan transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={isCreatingGuild}
                                    className="w-full bg-[#41a6b5] hover:bg-[#4cbcd3] text-[#10131c] rounded-lg py-2 text-xs font-bold transition-all"
                                >
                                    + Registrar Nodo
                                </button>
                            </form>
                            {guildFeedback.message && (
                                <div className={`p-3 rounded-lg text-xs font-mono border ${
                                    guildFeedback.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                }`}>
                                    {guildFeedback.message}
                                </div>
                            )}
                        </div>

                        {/* Listado en cuadrícula o filas a la derecha */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-tokyo-comment mb-2 font-mono">// NODOS_ACTIVOS</span>
                            
                            <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 pr-2 content-start custom-scrollbar">
                                {isLoadingGuilds ? (
                                    <div className="col-span-2 text-center text-xs text-tokyo-comment py-12 font-mono">Leyendo clúster de bases de datos...</div>
                                ) : guilds.length === 0 ? (
                                    <div className="col-span-2 text-center text-xs text-tokyo-comment py-12 border border-dashed border-tokyo-border/40 rounded-xl">No hay registros guardados.</div>
                                ) : (
                                    guilds.map((guild) => (
                                        <div
                                            key={guild.id}
                                            className={`rounded-xl border p-4 flex items-center justify-between gap-4 transition-all duration-300 ${
                                                guild.is_active ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'
                                            }`}
                                        >
                                            <div className="min-w-0">
                                                <h4 className="text-xs font-bold text-tokyo-orange truncate">{guild.name}</h4>
                                                <span className="text-[10px] font-mono text-tokyo-comment">ID: #{guild.id}</span>
                                            </div>
                                            <button
                                                onClick={() => toggleGuildStatus(guild)}
                                                className={`px-3 py-1 text-[9px] font-mono font-bold rounded-full border uppercase tracking-wider transition-all cursor-pointer ${
                                                    guild.is_active ? 'border-emerald-500/40 bg-emerald-500/20 text-[#9ece6a]' : 'border-rose-500/40 bg-rose-500/20 text-[#f7768e]'
                                                }`}
                                            >
                                                {guild.is_active ? '● Online' : '○ Offline'}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}