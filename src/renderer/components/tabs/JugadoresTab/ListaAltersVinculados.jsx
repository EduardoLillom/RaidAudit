import React from 'react';

export default function ListaAltersVinculados({ profile, onOpenLinkModal }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase text-[#565f89] font-bold block tracking-wider">
                    Otros personajes vinculados a este mismo usuario
                </span>
                <button
                    onClick={onOpenLinkModal}
                    className="text-[9px] bg-[#bb9af7]/10 hover:bg-[#bb9af7]/20 border border-[#bb9af7]/40 hover:border-[#bb9af7] text-[#bb9af7] font-bold px-2 py-1 rounded transition-all uppercase tracking-tight"
                >
                    + Vincular Alter
                </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
                {profile.characters && profile.characters.length > 0 ? (
                    profile.characters.map(c => (
                        <span key={c.id} className="text-xs bg-[#24283b]/60 border border-[#414868]/60 px-3 py-1.5 rounded flex items-center gap-2 opacity-90">
                            <span className="text-gray-300 font-medium">{c.name}</span>
                            <span className="text-[10px] text-[#41a6b5]">({c.class || 'PJ'})</span>
                        </span>
                    ))
                ) : (
                    <p className="text-xs text-[#565f89] italic bg-[#1f2335]/10 w-full p-2.5 rounded border border-[#414868]/20">
                        [ No se detectaron otros alters asignados a esta cuenta ]
                    </p>
                )}
            </div>
        </div>
    );
}