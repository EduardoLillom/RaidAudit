import React from 'react';

export default function HistorialSanciones({ profile, nickname, onOpenNotesModal }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase text-[#565f89] font-bold block tracking-wider">
                    Historial de Sanciones de {nickname}
                </span>
                <button
                    onClick={onOpenNotesModal}
                    className="text-[9px] bg-[#f7768e]/10 hover:bg-[#f7768e]/20 border border-[#f7768e]/40 hover:border-[#f7768e] text-[#f7768e] font-bold px-2 py-1 rounded transition-all uppercase tracking-tight"
                >
                    + Añadir Nota / Alerta
                </button>
            </div>
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
    );
}