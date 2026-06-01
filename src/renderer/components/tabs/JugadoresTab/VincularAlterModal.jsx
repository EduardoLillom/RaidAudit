import React from 'react';

export default function VincularAlterModal({
    isOpen,
    onClose,
    selectedRaider,
    alterSearchTerm,
    setAlterSearchTerm,
    alterResults,
    loadingAlters,
    onExecuteLink
}) {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 bg-[#15161e]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-[#1f2335] border border-tokyo-border w-full max-w-md rounded-xl p-5 shadow-2xl flex flex-col gap-4">
                
                <div className="flex justify-between items-center border-b border-tokyo-border/40 pb-2">
                    <h4 className="text-xs font-bold text-tokyo-purple uppercase tracking-wider">
                        Vincular Alter a {selectedRaider?.nickname}
                    </h4>
                    <button 
                        onClick={onClose}
                        className="text-xs text-[#f7768e] hover:text-[#f7768e]/80 font-bold px-1"
                    >
                        [ Cerrar ]
                    </button>
                </div>

                <div>
                    <label className="text-[10px] uppercase text-tokyo-comment block mb-1 font-bold">
                        Buscar el Alter en la Base de Datos
                    </label>
                    <input 
                        type="text"
                        placeholder="Escribe el nombre del alter..."
                        value={alterSearchTerm}
                        onChange={(e) => setAlterSearchTerm(e.target.value)}
                        className="w-full bg-tokyo-main border border-tokyo-border rounded px-3 py-2 text-xs text-slate-300 placeholder-tokyo-comment focus:outline-none focus:border-tokyo-purple"
                        autoFocus
                    />
                </div>

                {/* Resultados del buscador secundario */}
                <div className="flex-1 max-h-[200px] overflow-y-auto space-y-1.5 pr-1">
                    {loadingAlters ? (
                        <div className="text-[11px] text-[#7aa2f7] italic text-center py-4">Buscando personajes...</div>
                    ) : alterResults.length > 0 ? (
                        alterResults.map(alt => (
                            <div 
                                key={alt.raider_id || alt.id}
                                className="bg-tokyo-main/60 border border-tokyo-border/40 p-2.5 rounded flex justify-between items-center text-xs hover:border-[#9ece6a] transition-all"
                            >
                                <div>
                                    <span className="font-bold text-slate-300">{alt.nickname}</span>
                                    <span className="text-[9px] text-tokyo-comment block">
                                        {Number(alt.id) === 0 ? "⚠️ PUG (Sin dueño)" : `Dueño: ${alt.owner_name}`}
                                    </span>
                                </div>
                                <button
                                    onClick={() => onExecuteLink(alt)}
                                    className="bg-[#9ece6a]/10 hover:bg-[#9ece6a]/20 border border-[#9ece6a]/40 text-[#9ece6a] text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-tighter"
                                >
                                    Vincular
                                </button>
                            </div>
                        ))
                    ) : alterSearchTerm.trim() !== '' ? (
                        <div className="text-[11px] text-tokyo-comment italic text-center py-4">
                            No se encontraron personajes para vincular.
                        </div>
                    ) : (
                        <div className="text-[10px] text-tokyo-comment italic text-center py-4 px-4 bg-tokyo-main/20 rounded border border-tokyo-border/10">
                            Escribe el nombre del alter arriba para desplegar opciones disponibles.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}