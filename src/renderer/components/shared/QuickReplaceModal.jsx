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
    const [name, setName] = useState('');
    const [selectedClass, setSelectedClass] = useState('PALADIN');
    const [note, setNote] = useState('');
    
    // 🔍 Estados para el buscador en vivo
    const [searchResults, setSearchResults] = useState([]);
    const [selectedRaiderData, setSelectedRaiderData] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);

    // Efecto de búsqueda reactiva con Debounce (300ms)
    useEffect(() => {
        if (!name.trim()) {
            setSearchResults([]);
            setSelectedRaiderData(null);
            return;
        }

        // Si el usuario escribió exactamente lo mismo que el raider seleccionado, no busques de nuevo
        if (selectedRaiderData && name === selectedRaiderData.nickname) return;

        const delayDebounce = setTimeout(async () => {
            if (window.apiDB?.searchPlayers) {
                // Pasamos el sessionId para que la DB filtre automáticamente los que ya están dentro
                const list = await window.apiDB.searchPlayers(name, sessionId);
                setSearchResults(list || []);
                setShowDropdown(list.length > 0);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [name, sessionId, selectedRaiderData]);

    const handleSelectResult = (raider) => {
        setName(raider.nickname);
        setSelectedRaiderData(raider); // Guardamos la info completa (raider_id, etc.)
        setShowDropdown(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const cleanName = name.trim();
        if (!cleanName) return;

        // 🛡️ CANDADO DE SEGURIDAD INTERNO: Evitar duplicados por escritura manual directa
        const yaEstaEnRaid = currentRoster.some(
            (r) => r && r.name && r.name.toLowerCase() === cleanName.toLowerCase()
        );

        if (yaEstaEnRaid) {
            alert(`❌ Error: El personaje "${cleanName}" ya se encuentra activo en esta raid.`);
            return;
        }

        // Enviamos los datos estructurados al Front original
        onConfirm({
            name: cleanName,
            class: selectedRaiderData ? selectedRaiderData.class : selectedClass,
            raiderInId: selectedRaiderData ? selectedRaiderData.raider_id : 0, // 0 le dice a la DB que es nuevo
            note: note.trim()
        });
    };

    return (
        <div className="fixed inset-0 bg-[#16161e]/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn font-mono">
            <div className="bg-[#1a1b26] border border-[#bb9af7] rounded-xl p-5 w-[380px] shadow-2xl flex flex-col gap-4 relative">
                
                <div>
                    <div className="text-[10px] uppercase text-[#bb9af7] font-bold tracking-widest">// RE relevo_en_vivo</div>
                    <h3 className="text-sm font-bold text-white mt-1">
                        Sustituir: <span className="text-gray-400 font-normal">{target.nameOut}</span>
                    </h3>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* INPUT CON BUSCADOR EN TIEMPO REAL */}
                    <div className="flex flex-col gap-1.5 relative">
                        <label className="text-[9px] uppercase text-[#565f89] font-bold">Nombre del Entrante</label>
                        <input 
                            type="text"
                            autoFocus
                            placeholder="Ej: Arthaspro"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (selectedRaiderData) setSelectedRaiderData(null); // Resetea si vuelve a escribir
                            }}
                            className="bg-[#24283b] border border-[#414868] text-sm text-white p-2.5 rounded-lg outline-none focus:border-[#bb9af7] transition-all w-full"
                        />

                        {/* LISTA DESPLEGABLE DE COINCIDENCIAS */}
                        {showDropdown && searchResults.length > 0 && (
                            <ul className="absolute top-[62px] left-0 w-full bg-[#1f2335] border border-[#414868] rounded-lg shadow-2xl max-h-[160px] overflow-y-auto z-50 divide-y divide-[#24283b]">
                                {searchResults.map((r) => (
                                    <li
                                        key={r.raider_id}
                                        onClick={() => handleSelectResult(r)}
                                        className="px-3 py-2 hover:bg-[#2e3440] cursor-pointer flex justify-between items-center text-xs text-[#a9b1d6] transition-colors border-b border-[#24283b]/60 last:border-none"
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

                    {/* SELECTOR DE CLASE: Solo visible si el personaje NO existe en la base de datos */}
                    {!selectedRaiderData && name.trim() !== '' && (
                        <div className="flex flex-col gap-1.5 border border-[#343b58] p-2.5 rounded-lg bg-[#24283b]/20 animate-fadeIn">
                            <div className="text-[9px] text-[#e0af68] font-bold uppercase mb-1">
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
                                            className="p-2 rounded text-left text-xs font-bold transition-all flex items-center gap-2 border bg-[#24283b]/50 hover:bg-[#24283b]"
                                        >
                                            <span 
                                                className="w-2 h-2 rounded-full shrink-0" 
                                                style={{ backgroundColor: cls.color }}
                                            />
                                            <span style={{ color: isSelected ? cls.color : '#a9b1d6' }}>
                                                {cls.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* AVISO DE PERSONAJE IMPORTADO */}
                    {selectedRaiderData && (
                        <div className="p-3 rounded-lg border border-[#9ece6a]/40 bg-[#9ece6a]/10 text-xs text-[#9ece6a] font-medium animate-fadeIn">
                            ✓ Personaje histórico detectado. Se utilizarán sus datos de auditoría sin duplicar filas.
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] uppercase text-[#565f89] font-bold">Nota del reemplazo (opcional)</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Ej: baja el tanque, cambia de grupo, descanso"
                            className="bg-[#24283b] border border-[#414868] text-sm text-white p-2.5 rounded-lg outline-none focus:border-[#bb9af7] transition-all w-full min-h-[80px] resize-none"
                        />
                    </div>

                    {/* Botones de Acción Inferiores */}
                    <div className="flex gap-2 mt-2 pt-2 border-t border-[#414868]/40">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-[#24283b] text-gray-400 hover:text-white py-2 rounded-lg text-xs font-bold transition-all"
                        >
                            CANCELAR
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="flex-1 bg-[#bb9af7] disabled:opacity-40 text-[#1a1b26] py-2 rounded-lg text-xs font-black transition-all uppercase"
                        >
                            {selectedRaiderData ? 'REEMPLAZAR' : 'CREAR Y REEMPLAZAR'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}