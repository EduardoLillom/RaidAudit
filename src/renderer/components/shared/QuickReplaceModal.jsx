import React, { useState, useEffect } from 'react';

const CLASS_OPTIONS = [
    { id: 'PALADIN', color: '#f58cba', label: 'Paladín' },
    { id: 'MAGE', color: '#3fc7eb', label: 'Mago' },
    { id: 'WARRIOR', color: '#c69b6d', label: 'Guerrero' },
    { id: 'ROGUE', color: '#fff468', label: 'Pícaro' },
    { id: 'PRIEST', color: '#ffffff', label: 'Sacerdote' },
    { id: 'DRUID', color: '#ff7d0a', label: 'Druida' },
    { id: 'HUNTER', color: '#abd473', label: 'Cazador' },
    { id: 'SHAMAN', color: '#0070de', label: 'Chamán' },
    { id: 'WARLOCK', color: '#9482c9', label: 'Brujo' },
    { id: 'DEATHKNIGHT', color: '#c41f3b', label: 'DK' }
];

export default function QuickReplaceModal({ target, sessionId, currentRoster = [], onClose, onConfirm }) {
    // 🔀 Modo del modal: 'REPLACE' (Sustituir) o 'REMOVE' (Quitar/Vaciar)
    const [mode, setMode] = useState('REPLACE'); 
    
    const [name, setName] = useState('');
    const [selectedClass, setSelectedClass] = useState('PALADIN');
    const [note, setNote] = useState('');
    
    // 🔍 Estados para el buscador en vivo
    const [searchResults, setSearchResults] = useState([]);
    const [selectedRaiderData, setSelectedRaiderData] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);

    // Efecto de búsqueda reactiva con Debounce (300ms)
    useEffect(() => {
        if (mode !== 'REPLACE' || !name.trim()) {
            setSearchResults([]);
            setSelectedRaiderData(null);
            return;
        }

        if (selectedRaiderData && name === selectedRaiderData.nickname) return;

        const delayDebounce = setTimeout(async () => {
            if (window.apiDB?.searchPlayers) {
                const list = await window.apiDB.searchPlayers(name, sessionId);
                setSearchResults(list || []);
                setShowDropdown(list.length > 0);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [name, sessionId, selectedRaiderData, mode]);

    const handleSelectResult = (raider) => {
        setName(raider.nickname);
        setSelectedRaiderData(raider); 
        setShowDropdown(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // ❌ MODO REMOVER (Quitar de la raid y dejar slot vacío)
        if (mode === 'REMOVE') {
            onConfirm({
                name: null,
                class: null,
                raiderInId: null, // Pasamos null explícito para que el backend limpie el slot
                note: note.trim() || 'Retirado de la raid'
            });
            return;
        }

        // 🔄 MODO REEMPLAZAR (Sustituir por otro raider)
        const cleanName = name.trim();
        if (!cleanName) return;

        const yaEstaEnRaid = currentRoster.some(
            (r) => r && r.name && r.name.toLowerCase() === cleanName.toLowerCase()
        );

        if (yaEstaEnRaid) {
            alert(`❌ Error: El personaje "${cleanName}" ya se encuentra activo en esta raid.`);
            return;
        }

        onConfirm({
            name: cleanName,
            class: selectedRaiderData ? selectedRaiderData.class : selectedClass,
            raiderInId: selectedRaiderData ? selectedRaiderData.raider_id : 0, 
            note: note.trim()
        });
    };

    const isSubmitDisabled = mode === 'REPLACE' && !name.trim();

    return (
        <div className="fixed inset-0 bg-tokyo-dark/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn font-mono">
            <div className="bg-tokyo-main border border-tokyo-purple rounded-xl p-5 w-95 shadow-2xl flex flex-col gap-4 relative">
                
                <div>
                    <div className="text-[10px] uppercase text-tokyo-purple font-bold tracking-widest">// RE relevo_en_vivo</div>
                    <h3 className="text-sm font-bold text-white mt-1">
                        Gestionar Slot: <span className="text-[#ff9e64]">{target.nameOut}</span>
                    </h3>
                </div>

                {/* SELECTOR DE ACCIÓN (Pestañas) */}
                {target.raiderOutId && (
                    <div className="flex bg-tokyo-panel p-1 rounded-lg border border-tokyo-border/40">
                        <button
                            type="button"
                            onClick={() => setMode('REPLACE')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${
                                mode === 'REPLACE' 
                                    ? 'bg-tokyo-purple text-tokyo-main' 
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            🔄 SUSTITUIR
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('REMOVE')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${
                                mode === 'REMOVE' 
                                    ? 'bg-[#f7768e] text-white' 
                                    : 'text-gray-400 hover:text-[#f7768e]'
                            }`}
                        >
                            ❌ QUITAR DE RAID
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    
                    {/* INTERFAZ DINÁMICA SEGÚN EL MODO */}
                    {mode === 'REPLACE' ? (
                        <>
                            {/* INPUT CON BUSCADOR EN TIEMPO REAL */}
                            <div className="flex flex-col gap-1.5 relative">
                                <label className="text-[9px] uppercase text-tokyo-comment font-bold">Nombre del Entrante</label>
                                <input 
                                    type="text"
                                    autoFocus
                                    placeholder="Ej: Arthaspro"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (selectedRaiderData) setSelectedRaiderData(null);
                                    }}
                                    className="bg-tokyo-panel border border-tokyo-border text-sm text-white p-2.5 rounded-lg outline-none focus:border-tokyo-purple transition-all w-full"
                                />

                                {/* LISTA DESPLEGABLE */}
                                {showDropdown && searchResults.length > 0 && (
                                    <ul className="absolute top-15.5 left-0 w-full bg-[#1f2335] border border-tokyo-border rounded-lg shadow-2xl max-h-40 overflow-y-auto z-50 divide-y divide-tokyo-panel">
                                        {searchResults.map((r) => (
                                            <li
                                                key={r.raider_id}
                                                onClick={() => handleSelectResult(r)}
                                                className="px-3 py-2 hover:bg-[#2e3440] cursor-pointer flex justify-between items-center text-xs text-slate-300 transition-colors"
                                            >
                                                <span className="font-bold text-white">{r.nickname}</span>
                                                <span className="text-[10px] text-[#7aa2f7] bg-[#3d59a1]/30 px-1.5 py-0.5 rounded">
                                                    Gravedad: {r.gravity_total}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* SELECTOR DE CLASE */}
                            {!selectedRaiderData && name.trim() !== '' && (
                                <div className="flex flex-col gap-1.5 border border-[#343b58] p-2.5 rounded-lg bg-tokyo-panel/20 animate-fadeIn">
                                    <div className="text-[9px] text-tokyo-orange font-bold uppercase mb-1">
                                        ⚠️ Personaje nuevo detectado. Elige su clase:
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {CLASS_OPTIONS.map((cls) => {
                                            const isSelected = selectedClass === cls.id;
                                            return (
                                                <button
                                                    key={cls.id}
                                                    type="button"
                                                    onClick={() => setSelectedClass(cls.id)}
                                                    style={{ borderColor: isSelected ? cls.color : '#414868' }}
                                                    className="p-2 rounded text-left text-xs font-bold transition-all flex items-center gap-2 border bg-tokyo-panel/50"
                                                >
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cls.color }} />
                                                    <span style={{ color: isSelected ? cls.color : '#a9b1d6' }}>{cls.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* AVISO IMPORTADO */}
                            {selectedRaiderData && (
                                <div className="p-3 rounded-lg border border-[#9ece6a]/40 bg-[#9ece6a]/10 text-xs text-[#9ece6a] font-medium animate-fadeIn">
                                    ✓ Personaje histórico detectado. Se utilizarán sus datos sin duplicar.
                                </div>
                            )}
                        </>
                    ) : (
                        /* VISTA MODO REMOVE */
                        <div className="p-3 rounded-lg border border-[#f7768e]/30 bg-[#f7768e]/5 text-xs text-tokyo-orange font-medium animate-fadeIn leading-relaxed">
                            ⚠️ El slot pasará a estar <span className="text-white font-bold">[ VACÍO ]</span>. El jugador de este casillero será removido del roster activo.
                        </div>
                    )}

                    {/* CAMPO DE NOTAS ADAPTATIVO */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] uppercase text-tokyo-comment font-bold">
                            {mode === 'REPLACE' ? 'Nota del reemplazo (opcional)' : 'Razón del retiro / Observación'}
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={mode === 'REPLACE' ? "Ej: baja el tanque, cambia de grupo" : "Ej: Desconectado, bajo rendimiento, se tuvo que ir"}
                            className="bg-tokyo-panel border border-tokyo-border text-sm text-white p-2.5 rounded-lg outline-none focus:border-tokyo-purple transition-all w-full min-h-20 resize-none"
                        />
                    </div>

                    {/* BOTONES DE CONTROL DE CIERRE */}
                    <div className="flex gap-2 mt-2 pt-2 border-t border-tokyo-border/40">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-tokyo-panel text-gray-400 hover:text-white py-2 rounded-lg text-xs font-bold transition-all"
                        >
                            CANCELAR
                        </button>
                        
                        <button
                            type="submit"
                            disabled={isSubmitDisabled}
                            style={{
                                backgroundColor: mode === 'REPLACE' ? '#bb9af7' : '#f7768e'
                            }}
                            className="flex-1 disabled:opacity-40 text-tokyo-main disabled:text-tokyo-main py-2 rounded-lg text-xs font-black transition-all uppercase"
                        >
                            {mode === 'REMOVE' 
                                ? 'RETIRAR JUGADOR' 
                                : (selectedRaiderData ? 'REEMPLAZAR' : 'CREAR Y REEMPLAZAR')
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}