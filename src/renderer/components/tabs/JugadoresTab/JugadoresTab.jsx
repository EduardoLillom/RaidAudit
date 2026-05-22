import React, { useState, useEffect } from 'react';

export default function JugadoresTab() {
    const [searchTerm, setSearchTerm] = useState('');
    const [raiders, setRaiders] = useState([]); // Lista de personajes obtenidos de la DB
    const [selectedRaider, setSelectedRaider] = useState(null); // Personaje seleccionado actual
    const [profile, setProfile] = useState(null); // Historial y notas exclusivas del personaje
    const [loadingList, setLoadingList] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(false);

    // 🔍 ACCIÓN: Ejecuta la consulta de búsqueda en la DB
    async function ejecutarBusqueda(termino) {
        setLoadingList(true);
        try {
            // Pasamos el término sanitizado directamente para evitar problemas de sincronía con el estado
            const results = await window.apiDB.searchPlayers(termino);
            setRaiders(results || []);
        } catch (error) {
            console.error("Error al buscar raiders:", error);
        } finally {
            setLoadingList(false);
        }
    }

    // ⚡ CONTROLADOR UNIFICADO: Carga inicial y Debounce reactivo
    useEffect(() => {
        // Caso A: Si está vacío, cargamos los 15 por defecto inmediatamente sin retrasos
        if (searchTerm.trim() === '') {
            setLoadingList(true);
            window.apiDB.searchPlayers('')
                .then(iniciales => {
                    setRaiders(iniciales || []);
                })
                .catch(err => console.error("Error en carga base:", err))
                .finally(() => setLoadingList(false));
            return;
        }

        // Caso B: Si hay texto escrito, esperamos 350ms para no saturar SQLite
        const delayDebounceFn = setTimeout(() => {
            ejecutarBusqueda(searchTerm);
        }, 350);

        // Limpieza del temporizador si el usuario sigue escribiendo
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // Soporte para buscar instantáneamente presionando la tecla Enter
    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            ejecutarBusqueda(searchTerm);
        }
    }

    // 📂 SELECCIÓN: Carga las notas y asistencias exclusivas de ese personaje específico
    async function handleSelectRaider(raider) {
        if (!raider) return;

        // 1. Forzamos la captura del ID del personaje
        const rId = raider.raider_id || raider.id; 
        
        // 2. Capturamos la ID del dueño de la cuenta (0 si viene como NULL o PUG)
        const pId = raider.player_id || raider.owner_id || 0;

        // Guardamos el raider seleccionado en el estado para iluminar la tarjeta en la izquierda
        setSelectedRaider(raider);
        setLoadingProfile(true);
        
        try {
            // 3. Enviamos las variables locales que acabamos de definir arriba (rId y pId)
            console.log(`[React IPC] Enviando -> Player ID: ${pId}, Raider ID: ${rId}`);
            
            const data = await window.apiDB.getPlayerProfile(Number(pId), Number(rId));
            setProfile(data);
        } catch (error) {
            console.error('Error al cargar expediente del Raider:', error);
            setProfile(null);
        } finally {
            setLoadingProfile(false);
        }
    }

    return (
        <div className="flex-1 gap-6 overflow-hidden flex h-full">
            
            {/* PANEL IZQUIERDO: BUSCADOR E ÍNDICE DE PERSONAJES */}
            <div id="list-players" className="w-1/4 border-r border-[#414868]/40 pr-4 flex flex-col gap-3 h-full">
                
                {/* Cuadro de búsqueda */}
                <div>
                    <span className="text-[10px] uppercase text-[#565f89] block mb-1 font-bold tracking-wider">Buscar Raider (Personaje)</span>
                    <div className="flex gap-1.5">
                        <input 
                            type="text"
                            placeholder="Ej: Fracks, Xexu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 bg-[#1a1b26]/60 border border-[#414868] rounded px-3 py-2 text-xs text-[#a9b1d6] placeholder-[#565f89] focus:outline-none focus:border-[#bb9af7] transition-all"
                        />
                        <button
                            onClick={() => ejecutarBusqueda(searchTerm)}
                            disabled={loadingList}
                            className="bg-[#24283b] hover:bg-[#41a6b5]/20 border border-[#414868] hover:border-[#41a6b5] rounded px-3 py-2 text-[10px] text-[#41a6b5] font-bold uppercase tracking-wider transition-all disabled:opacity-50 min-w-[70px]"
                        >
                            {loadingList ? '...' : 'Buscar'}
                        </button>
                    </div>
                </div>

                {/* Lista de Resultados */}
                <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
                    {raiders.length > 0 ? (
                        raiders.map(r => (
                            <div
                                key={r.raider_id}
                                onClick={() => handleSelectRaider(r)}
                                className={`p-3 rounded border cursor-pointer transition-all ${
                                    selectedRaider?.raider_id === r.raider_id
                                        ? 'bg-[#1a1b26] border-[#41a6b5] shadow-sm'
                                        : 'bg-[#1f2335]/30 border-[#414868]/60 hover:border-[#bb9af7]'
                                }`}
                            >
                                <div className="font-bold text-[#a9b1d6] flex justify-between items-center">
                                    <span>{r.nickname}</span>
                                    {r.gravity_total > 0 && (
                                        <span className="text-[10px] text-[#f7768e] bg-[#f7768e]/10 px-1.5 py-0.5 rounded font-mono">
                                            G: {r.gravity_total}
                                        </span>
                                    )}
                                </div>
                                <div className="text-[9px] text-[#565f89] mt-1 flex justify-between">
                                    <span>ID PJ: #{r.raider_id}</span>
                                    <span className={Number(r.id) === 0 ? "text-[#e0af68] font-bold" : "text-[#7aa2f7]"}>
                                        {Number(r.id) === 0 ? '[ SIN ASIGNAR ]' : `Dueño: ${r.owner_name}`}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-[11px] text-[#565f89] italic text-center pt-8 px-2">
                            {loadingList ? 'Buscando en los registros...' : 'No se encontraron personajes registrados con ese nombre.'}
                        </div>
                    )}
                </div>
            </div>

            {/* PANEL DERECHO: EXPEDIENTE EXCLUSIVO DEL PERSONAJE */}
            <div className="flex-1 bg-[#1a1b26]/40 p-5 rounded-xl border border-[#414868] overflow-y-auto h-full">
                {loadingProfile ? (
                    <div className="h-full flex items-center justify-center text-xs text-[#7aa2f7] animate-pulse">
                        [ ACCEDIENDO A LOS REGISTROS DEL RAIDER... ]
                    </div>
                ) : !profile || !selectedRaider ? (
                    <div className="h-full flex items-center justify-center text-xs text-[#565f89] italic">
                        [ SELECCIONA UN PERSONAJE DE LA IZQUIERDA PARA VER SU EXPEDIENTE ]
                    </div>
                ) : (
                    <div className="space-y-6">
                        
                        {/* Cabecera del Perfil */}
                        <div className="flex justify-between items-start border-b border-[#414868]/30 pb-4">
                            <div>
                                <h3 className="text-xs font-bold text-[#e0af68] uppercase tracking-wider flex items-center gap-2">
                                    <span>// EXPEDIENTE INDIVIDUAL: {selectedRaider.nickname.toUpperCase()}</span>
                                    {profile.unassigned && (
                                        <span className="text-[9px] bg-[#e0af68]/10 text-[#e0af68] border border-[#e0af68]/30 px-1.5 py-0.5 rounded">
                                            SIN CUENTA MAESTRA
                                        </span>
                                    )}
                                </h3>
                                <p className="text-[10px] text-[#565f89] mt-1">
                                    {profile.unassigned 
                                        ? "Este personaje está operando como PUG independiente (sin dueño asignado)."
                                        : `Personaje vinculado a la cuenta de: ${selectedRaider.owner_name}`}
                                </p>
                            </div>
                            
                            {/* Marcador de Gravedad Individual */}
                            <div className="bg-[#1f2335] border border-[#414868] rounded-lg px-4 py-2 flex gap-4 text-center">
                                <div>
                                    <span className="text-[9px] block text-[#7aa2f7] font-bold">BAJAS</span>
                                    <span className="text-xs text-gray-300">{profile.summary?.lows || 0}</span>
                                </div>
                                <div className="border-l border-[#414868]/60 pl-4">
                                    <span className="text-[9px] block text-[#e0af68] font-bold">MEDIAS</span>
                                    <span className="text-xs text-gray-300">{profile.summary?.mediums || 0}</span>
                                </div>
                                <div className="border-l border-[#414868]/60 pl-4">
                                    <span className="text-[9px] block text-[#f7768e] font-bold">ALTAS</span>
                                    <span className="text-xs text-gray-300">{profile.summary?.highs || 0}</span>
                                </div>
                                <div className="border-l border-[#414868] pl-4 bg-[#f7768e]/5 px-2 rounded">
                                    <span className="text-[9px] block text-[#f7768e] font-black">GRAVEDAD</span>
                                    <span className="text-xs text-[#f7768e] font-bold">{profile.summary?.gravity_total || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Bloque 1: Notas de Sanción Exclusivas */}
                        <div>
                            <span className="text-[10px] uppercase text-[#565f89] font-bold block mb-2 tracking-wider">
                                Historial de Sanciones de {selectedRaider.nickname}
                            </span>
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                {profile.notes && profile.notes.length > 0 ? (
                                    profile.notes.map((n, idx) => {
                                        const severidadLimpia = String(n.severity || 'LOW').toUpperCase();
                                        return (
                                            <div key={`${n.id}-${idx}`} className="bg-[#1a1b26] p-3 rounded border border-[#414868] flex flex-col gap-1">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-[#7aa2f7] font-mono text-[10px]">
                                                        Raid: {n.instance || 'Nota General'}
                                                    </span>
                                                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                                                        severidadLimpia === 'HIGH' ? 'bg-[#f7768e]/10 border-[#f7768e]/30 text-[#f7768e]' :
                                                        severidadLimpia === 'MEDIUM' ? 'bg-[#e0af68]/10 border-[#e0af68]/30 text-[#e0af68]' :
                                                        'bg-[#7aa2f7]/10 border-[#7aa2f7]/30 text-[#7aa2f7]'
                                                    }`}>
                                                        {severidadLimpia}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-300 bg-[#1f2335]/40 p-2 rounded border border-[#414868]/30 mt-1 font-mono">
                                                    {n.note_text}
                                                </p>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-xs text-[#565f89] italic bg-[#1f2335]/20 p-3 rounded border border-[#414868]/20">
                                        [ Este personaje está completamente limpio de alertas ]
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Bloque 2: Personajes Secundarios (Alters) */}
                        {!profile.unassigned && (
                            <div>
                                <span className="text-[10px] uppercase text-[#565f89] font-bold block mb-2 tracking-wider">Otros personajes vinculados a este mismo usuario</span>
                                <div className="flex flex-wrap gap-2">
                                    {profile.characters && profile.characters.length > 0 ? (
                                        profile.characters.map(c => (
                                            <span key={c.id} className="text-xs bg-[#24283b]/60 border border-[#414868]/60 px-3 py-1.5 rounded flex items-center gap-2 opacity-70">
                                                <span className="text-gray-400 font-medium">{c.name}</span>
                                                <span className="text-[10px] text-[#41a6b5]">({c.class})</span>
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-xs text-[#565f89] italic">[ No se detectaron otros alters asignados a esta cuenta ]</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Bloque 3: Asistencias Exclusivas */}
                        <div>
                            <span className="text-[10px] uppercase text-[#565f89] font-bold block mb-2 tracking-wider">Asistencias a Bandas de {selectedRaider.nickname}</span>
                            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                                {profile.history && profile.history.length > 0 ? (
                                    profile.history.map((h, idx) => (
                                        <div key={idx} className="bg-[#1a1b26] p-3 rounded border border-[#414868] flex justify-between items-center text-xs">
                                            <div>
                                                <span className="text-white font-bold">{h.raid_name}</span>
                                                <span className="text-[10px] text-[#565f89] ml-4 font-mono">{h.date}</span>
                                            </div>
                                            <span className="text-[#9ece6a] bg-[#9ece6a]/5 border border-[#9ece6a]/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                                {h.guild_name}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-[#565f89] italic bg-[#1f2335]/20 p-3 rounded border border-[#414868]/20">
                                        [ Sin registros de asistencia con este personaje ]
                                    </p>
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}