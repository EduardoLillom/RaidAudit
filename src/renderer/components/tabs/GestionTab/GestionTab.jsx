import React, { useState, useEffect } from 'react';

export default function GestionTab() {
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

    useEffect(() => {
        loadGuilds();
    }, []);

    // ========== CARGAR GUILDS ==========
    async function loadGuilds() {
        setIsLoadingGuilds(true);
        try {
            const data = await window.apiDB.getAllGuildsWithStatus();
            setGuilds(data);
        } catch (error) {
            console.error('Error cargando guilds:', error);
            setGuildFeedback({ type: 'error', message: 'No se pudieron cargar las guilds.' });
        } finally {
            setIsLoadingGuilds(false);
        }
    }

    // ========== VALIDACIÓN JSON EN TIEMPO REAL ==========
    useEffect(() => {
        const text = jsonText.trim();
        if (!text) {
            setImportError(null);
            setIsValidJson(false);
            setParsedList([]);
            return;
        }

        try {
            const parsed = JSON.parse(text);
            if (!Array.isArray(parsed)) {
                setImportError('El elemento principal debe ser una lista (array) de objetos [ ... ]');
                setIsValidJson(false);
                setParsedList([]);
                return;
            }

            const count = parsed.length;
            if (count === 0) {
                setImportError('La lista JSON está vacía.');
                setIsValidJson(false);
                setParsedList([]);
                return;
            }

            const invalidItem = parsed.find(item => {
                const name = item.name || item.nickname || item.character || item.character_name;
                return !name || typeof name !== 'string' || name.trim() === '';
            });

            if (invalidItem) {
                setImportError('Todos los jugadores deben tener la propiedad "name" o "nickname" de tipo texto.');
                setIsValidJson(false);
                setParsedList([]);
                return;
            }

            setImportError(null);
            setIsValidJson(true);
            setParsedList(parsed);
        } catch (e) {
            setImportError(`Error de formato JSON: ${e.message}`);
            setIsValidJson(false);
            setParsedList([]);
        }
    }, [jsonText]);

    // ========== IMPORTAR JUGADORES ==========
    const handleImport = async () => {
        if (!isValidJson || parsedList.length === 0) return;

        setIsImporting(true);
        setImportResult(null);
        try {
            const result = await window.apiDB.bulkImportPlayers(parsedList);
            setImportResult(result);
            setShowImportSuccess(true);
            setJsonText('');
            setTimeout(() => setShowImportSuccess(false), 5000);
        } catch (err) {
            setImportError(`Error al importar: ${err.message}`);
        } finally {
            setIsImporting(false);
        }
    };

    // ========== CREAR GUILD ==========
    async function handleCreateGuild(event) {
        event.preventDefault();
        const trimmedName = newGuildName.trim();
        if (!trimmedName) {
            setGuildFeedback({ type: 'error', message: 'Ingresa el nombre de la guild.' });
            return;
        }
        setIsCreatingGuild(true);
        setGuildFeedback({ type: 'idle', message: '' });
        try {
            await window.apiDB.createGuild(trimmedName);
            await loadGuilds();
            setNewGuildName('');
            setGuildFeedback({ type: 'success', message: `Guild creada: ${trimmedName}` });
        } catch (error) {
            console.error('Error creating guild:', error);
            setGuildFeedback({ type: 'error', message: error?.message || 'No se pudo crear la guild.' });
        } finally {
            setIsCreatingGuild(false);
        }
    }

    // ========== CAMBIAR ESTADO DE GUILD ==========
    async function toggleGuildStatus(guild) {
        try {
            await window.apiDB.updateGuildStatus(guild.id, !guild.is_active);
            await loadGuilds();
            const statusText = guild.is_active ? 'desactivada' : 'activada';
            setGuildFeedback({ type: 'success', message: `Guild ${guild.name} ${statusText}` });
        } catch (error) {
            console.error('Error actualizando guild:', error);
            setGuildFeedback({ type: 'error', message: 'No se pudo actualizar el estado de la guild.' });
        }
    }

    return (
        <div className="flex-1 flex min-h-0 gap-6 overflow-hidden p-1 text-[#a9b1d6]">
            {/* ========== SECCIÓN 1: IMPORTAR JUGADORES ========== */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <div className="bg-[#1a1b26]/90 border border-[#414868] rounded-xl p-4 shadow-xl backdrop-blur-md flex-shrink-0">
                    <h3 className="text-sm font-bold text-[#bb9af7] uppercase tracking-wider flex items-center gap-2">
                        <span>📥</span> Importar Jugadores en Masa
                    </h3>
                    <p className="text-xs text-[#565f89] mt-1">
                        Pega un arreglo JSON con los datos de los personajes para guardarlos directamente en el sistema.
                    </p>
                </div>

                {/* Área de texto interactiva con diseño de consola */}
                <div className="flex-1 flex flex-col min-h-0 bg-[#1f2335]/60 border border-[#414868] rounded-xl overflow-hidden focus-within:border-[#bb9af7]/70 transition-all duration-300 shadow-inner">
                    <div className="bg-[#16161e] px-4 py-2 border-b border-[#414868]/50 flex justify-between items-center text-[11px] text-[#565f89] font-mono select-none">
                        <span>DATA_STREAM_INPUT</span>
                        {isValidJson && <span className="text-[#9ece6a] font-bold animate-pulse">VALID</span>}
                    </div>
                    <textarea
                        value={jsonText}
                        onChange={(e) => setJsonText(e.target.value)}
                        placeholder='Ej: [{ "name": "Zelmar", "class": "Mage" }, { "name": "Veintidosf", "class": "Rogue" }]'
                        className="flex-1 bg-transparent p-4 text-xs text-[#9ece6a] placeholder-[#565f89] focus:outline-none font-mono resize-none leading-relaxed"
                    />
                </div>

                {/* Retroalimentación de Validación */}
                {importError && (
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300 font-mono animate-fadeIn flex items-start gap-2">
                        <span>✕</span> <p className="flex-1">{importError}</p>
                    </div>
                )}

                {isValidJson && !importError && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300 font-mono animate-fadeIn flex items-center gap-2">
                        <span>✓</span> <p>JSON estructurado correctamente: <b>{parsedList.length}</b> registros listos.</p>
                    </div>
                )}

                {/* Reporte de éxito detallado al importar */}
                {showImportSuccess && importResult && (
                    <div className="rounded-xl border border-[#9ece6a]/30 bg-[#9ece6a]/15 p-3 text-xs text-[#9ece6a] font-mono animate-fadeIn shadow-lg">
                        <div className="font-bold flex items-center gap-1.5 mb-1">
                            <span>🚀</span> ¡Base de datos actualizada!
                        </div>
                        <p className="text-[11px] text-[#a9b1d6]">
                            Creados: <b>{importResult.createdRaiders ?? 0}</b> | Actualizados: <b>{importResult.updatedRaiders ?? 0}</b> | Cuentas: <b>{importResult.createdPlayers ?? 0}</b>
                        </p>
                    </div>
                )}

                {/* Botón de envío principal */}
                <button
                    onClick={handleImport}
                    disabled={!isValidJson || isImporting}
                    className="w-full bg-gradient-to-r from-[#bb9af7] to-[#9d7cd8] hover:from-[#c4a8fd] hover:to-[#b490fc] px-4 py-3 text-xs font-bold text-[#10131c] rounded-xl shadow-lg transition-all transform active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none uppercase tracking-wider flex justify-center items-center gap-2"
                >
                    {isImporting ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-[#10131c]" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Escribiendo registros masivos...
                        </>
                    ) : '📂 Procesar Importación Masiva'}
                </button>
            </div>

            {/* ========== SECCIÓN 2: GESTIONAR GUILDS ========== */}
            <div className="w-80 flex flex-col gap-4 overflow-hidden border-l border-[#414868]/40 pl-6">
                <div className="bg-[#1a1b26]/90 border border-[#414868] rounded-xl p-4 shadow-xl backdrop-blur-md flex-shrink-0">
                    <h3 className="text-sm font-bold text-[#41a6b5] uppercase tracking-wider flex items-center gap-2">
                        <span>⚙️</span> Gestionar Guilds
                    </h3>
                    <p className="text-xs text-[#565f89] mt-0.5">
                        Registra, activa o desactiva las hermandades conectadas.
                    </p>
                </div>

                {/* Crear nueva guild */}
                <div className="bg-[#1a1b26]/40 border border-[#414868]/50 rounded-xl p-3 shadow-inner flex-shrink-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#41a6b5] mb-2 font-mono">// Agregar Nueva</p>
                    <form onSubmit={handleCreateGuild} className="flex flex-col gap-2">
                        <input
                            type="text"
                            value={newGuildName}
                            onChange={(e) => setNewGuildName(e.target.value)}
                            placeholder="Nombre de la guild"
                            className="w-full rounded-lg border border-[#313b54] bg-[#16161e] px-3 py-2 text-xs text-[#e8eeff] placeholder-[#565f89] outline-none transition duration-200 focus:border-[#41a6b5]"
                        />
                        <button
                            type="submit"
                            disabled={isCreatingGuild}
                            className="w-full rounded-lg bg-gradient-to-r from-[#41a6b5] to-[#39919e] hover:brightness-110 px-3 py-2 text-xs font-bold text-[#10131c] transition-all disabled:opacity-50"
                        >
                            {isCreatingGuild ? 'Guardando...' : '+ Crear Guild'}
                        </button>
                    </form>
                    {guildFeedback.message && (
                        <p className={`mt-2 rounded-lg border px-2.5 py-1.5 text-[10px] font-mono ${
                            guildFeedback.type === 'error'
                                ? 'border-rose-500/20 bg-rose-500/10 text-rose-300'
                                : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                        }`}>
                            {guildFeedback.type === 'error' ? '⚠ ' : '✓ '} {guildFeedback.message}
                        </p>
                    )}
                </div>

                {/* Lista de guilds */}
                <div className="flex-1 min-h-0 flex flex-col">
                    <div className="flex justify-between items-center px-1 pb-2 flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-[#565f89]">
                        <span>Servidores Activos</span>
                        <span className="bg-[#24283b] text-[#7aa2f7] px-2 py-0.5 rounded-full font-mono">{guilds.length}</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 custom-scrollbar">
                        {isLoadingGuilds ? (
                            <div className="text-center text-xs text-[#565f89] py-8 font-mono animate-pulse">
                                Sincronizando shards...
                            </div>
                        ) : guilds.length === 0 ? (
                            <div className="text-center text-[11px] text-[#565f89] py-8 border border-dashed border-[#414868]/40 rounded-xl">
                                No hay guilds registradas en el núcleo.
                            </div>
                        ) : (
                            guilds.map((guild) => (
                                <div
                                    key={guild.id}
                                    className={`rounded-xl border p-3 transition-all duration-300 hover:translate-x-0.5 ${
                                        guild.is_active
                                            ? 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10'
                                            : 'border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-[#e0af68] truncate">
                                                {guild.name}
                                            </div>
                                            <div className="text-[10px] font-mono text-[#565f89] mt-0.5">
                                                ID: #{guild.id}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleGuildStatus(guild)}
                                            className={`flex-shrink-0 px-3 py-1 text-[9px] font-mono uppercase tracking-wider font-bold rounded-full border transition-all duration-200 cursor-pointer ${
                                                guild.is_active
                                                    ? 'border-emerald-500/40 bg-emerald-500/20 text-[#9ece6a] hover:bg-emerald-500/30'
                                                    : 'border-rose-500/40 bg-rose-500/20 text-[#f7768e] hover:bg-rose-500/30'
                                            }`}
                                        >
                                            {guild.is_active ? '● Activa' : '○ Inactiva'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}