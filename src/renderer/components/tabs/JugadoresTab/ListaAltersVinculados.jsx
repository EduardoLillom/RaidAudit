import React from 'react';

const classColors = {
    PALADIN: { text: 'text-[#f58cba]', border: 'border-[#f58cba]/30', bg: 'bg-gradient-to-r from-[#f58cba]/10 to-[#f58cba]/5' },
    MAGE: { text: 'text-[#3fc7eb]', border: 'border-[#3fc7eb]/30', bg: 'bg-gradient-to-r from-[#3fc7eb]/10 to-[#3fc7eb]/5' },
    WARRIOR: { text: 'text-[#c69b6d]', border: 'border-[#c69b6d]/30', bg: 'bg-gradient-to-r from-[#c69b6d]/10 to-[#c69b6d]/5' },
    ROGUE: { text: 'text-[#fff468]', border: 'border-[#fff468]/30', bg: 'bg-gradient-to-r from-[#fff468]/10 to-[#fff468]/5' },
    PRIEST: { text: 'text-[#ffffff]', border: 'border-[#ffffff]/30', bg: 'bg-gradient-to-r from-[#ffffff]/10 to-[#ffffff]/5' },
    DRUID: { text: 'text-[#ff7d0a]', border: 'border-[#ff7d0a]/30', bg: 'bg-gradient-to-r from-[#ff7d0a]/10 to-[#ff7d0a]/5' },
    HUNTER: { text: 'text-[#abd473]', border: 'border-[#abd473]/30', bg: 'bg-gradient-to-r from-[#abd473]/10 to-[#abd473]/5' },
    SHAMAN: { text: 'text-[#0070de]', border: 'border-[#0070de]/30', bg: 'bg-gradient-to-r from-[#0070de]/10 to-[#0070de]/5' },
    WARLOCK: { text: 'text-[#9482c9]', border: 'border-[#9482c9]/30', bg: 'bg-gradient-to-r from-[#9482c9]/10 to-[#9482c9]/5' },
    DEATHKNIGHT: { text: 'text-[#c41f3b]', border: 'border-[#c41f3b]/30', bg: 'bg-gradient-to-r from-[#c41f3b]/10 to-[#c41f3b]/5' }
};

// Estilo por defecto si la clase no coincide o no está definida
const DEFAULT_COLOR = { text: 'text-[#41a6b5]', border: 'border-[#414868]/60', bg: 'bg-[#24283b]/60' };

export default function ListaAltersVinculados({ profile, onOpenLinkModal }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase text-[#565f89] font-bold block tracking-wider">
                    Otros personajes vinculados a este mismo usuario
                </span>
                <button
                    onClick={onOpenLinkModal}
                    className="text-[9px] bg-[#bb9af7]/10 hover:bg-[#bb9af7]/20 border border-[#bb9af7]/40 hover:border-[#bb9af7] text-[#bb9af7] font-bold px-2 py-1 rounded transition-all uppercase tracking-tight cursor-pointer"
                >
                    + Vincular Alter
                </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
                {profile?.characters && profile.characters.length > 0 ? (
                    profile.characters.map(c => {
                        // Convertimos a mayúsculas para asegurar que haga match con el diccionario
                        const classKey = c.class ? c.class.toUpperCase() : '';
                        const colors = classColors[classKey] || DEFAULT_COLOR;

                        return (
                            <span 
                                key={c.id} 
                                className={`text-xs ${colors.bg} border ${colors.border} px-3 py-1.5 rounded flex items-center gap-2 font-medium backdrop-blur-sm`}
                            >
                                {/* Cambio aquí: Ahora el nombre adopta el color de la clase */}
                                <span className={`${colors.text} font-bold`}>{c.name}</span>
                                
                                <span className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase opacity-60">
                                    ({c.class || 'PJ'})
                                </span>
                            </span>
                        );
                    })
                ) : (
                    <p className="text-xs text-[#565f89] italic bg-[#1f2335]/10 w-full p-2.5 rounded border border-[#414868]/20">
                        [ No se detectaron otros alters asignados a esta cuenta ]
                    </p>
                )}
            </div>
        </div>
    );
}