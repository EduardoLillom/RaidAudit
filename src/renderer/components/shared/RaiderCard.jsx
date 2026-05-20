import React from 'react';

const classColors = {
    PALADIN: { border: 'border-t-[#f58cba]', text: 'text-[#f58cba]', bg: 'bg-[#f58cba]/5' },
    MAGE: { border: 'border-t-[#3fc7eb]', text: 'text-[#3fc7eb]', bg: 'bg-[#3fc7eb]/5' },
    WARRIOR: { border: 'border-t-[#c69b6d]', text: 'text-[#c69b6d]', bg: 'bg-[#c69b6d]/5' },
    ROGUE: { border: 'border-t-[#fff468]', text: 'text-[#fff468]', bg: 'bg-[#fff468]/5' },
    PRIEST: { border: 'border-t-[#ffffff]', text: 'text-[#ffffff]', bg: 'bg-[#ffffff]/5' },
    DRUID: { border: 'border-t-[#ff7d0a]', text: 'text-[#ff7d0a]', bg: 'bg-[#ff7d0a]/5' },
    HUNTER: { border: 'border-t-[#abd473]', text: 'text-[#abd473]', bg: 'bg-[#abd473]/5' },
    SHAMAN: { border: 'border-t-[#0070de]', text: 'text-[#0070de]', bg: 'bg-[#0070de]/5' },
    WARLOCK: { border: 'border-t-[#9482c9]', text: 'text-[#9482c9]', bg: 'bg-[#9482c9]/5' },
    DEATHKNIGHT: { border: 'border-t-[#c41f3b]', text: 'text-[#c41f3b]', bg: 'bg-[#c41f3b]/5' }
};

export default function RaiderCard({ raider }) {
    const classKey = raider.class ? raider.class.toUpperCase().replace(/\s+/g, '') : '';
    const classStyle = classColors[classKey] || { 
        border: 'border-t-[#414868]', 
        text: 'text-white', 
        bg: 'bg-[#414868]/10' 
    };

    const lows = raider.lows || 0;
    const mediums = raider.mediums || 0;
    const highs = raider.highs || 0;
    const gravityTotal = raider.gravedad_total || 0;

    let cardBackground = 'bg-[#1a1b26]/90';
    let alertBadge = '';
    let textStyle = classStyle.text;

    // Lógica del semáforo de gravedad
    if (highs > 0) {
        cardBackground = 'bg-[#c41f3b]/15 border-[#c41f3b]/40';
        textStyle = 'text-[#c41f3b] font-black';
        alertBadge = <span className="bg-[#c41f3b] text-white text-[8px] px-1.5 py-0.5 rounded font-mono font-bold animate-pulse uppercase tracking-wider">!! HIGH !!</span>;
    } else if (mediums > 0) {
        cardBackground = 'bg-[#e0af68]/10 border-[#e0af68]/30';
        textStyle = 'text-[#e0af68]';
        alertBadge = <span className="bg-[#e0af68] text-[#1a1b26] text-[8px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">MEDIUM</span>;
    } else if (lows > 0) {
        cardBackground = 'bg-[#7dcfff]/5 border-[#7dcfff]/20';
        textStyle = 'text-[#7dcfff]';
        alertBadge = <span className="bg-[#7dcfff] text-[#1a1b26] text-[8px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">LOW</span>;
    }

    return (
        <div className={`rounded-lg flex flex-col justify-between p-2 min-h-[72px] transition-all duration-200 border border-[#414868] border-t-2 ${cardBackground} shadow-sm ${classStyle.border} ${textStyle}`}>
            <div>
                <div className="flex justify-between items-start gap-1 mb-1">
                    <div className="font-bold text-[11px] text-gray-100 truncate">{raider.name}</div>
                    {alertBadge}
                </div>
                <div className="text-[8px] uppercase opacity-60 tracking-wider font-mono">{raider.class}</div>
            </div>
            
            <div className="flex gap-1 text-[7px] font-mono my-1.5 text-gray-400">
                <span className={`bg-[#1f2335] px-1.5 py-0.5 rounded border border-[#414868]/30 ${lows > 0 ? 'text-[#7dcfff] border-[#7dcfff]/50 font-bold bg-[#7dcfff]/5' : ''}`}>
                    L:{lows}
                </span>
                <span className={`bg-[#1f2335] px-1.5 py-0.5 rounded border border-[#414868]/30 ${mediums > 0 ? 'text-[#e0af68] border-[#e0af68]/50 font-bold bg-[#e0af68]/5' : ''}`}>
                    M:{mediums}
                </span>
                <span className={`bg-[#1f2335] px-1.5 py-0.5 rounded border border-[#414868]/30 ${highs > 0 ? 'text-[#c41f3b] border-[#c41f3b]/50 font-bold bg-[#c41f3b]/5' : ''}`}>
                    H:{highs}
                </span>
                
                {gravityTotal > 0 && (
                    <span className="ml-auto text-[8px] text-gray-500 font-bold">
                        SCORE: {gravityTotal}
                    </span>
                )}
            </div>
        </div>
    );
}
