import React from 'react';

const classColors = {
    PALADIN: { text: 'text-[#f58cba]', bg: 'from-[#f58cba]/10 to-[#f58cba]/5' },
    MAGE: { text: 'text-[#3fc7eb]', bg: 'from-[#3fc7eb]/10 to-[#3fc7eb]/5' },
    WARRIOR: { text: 'text-[#c69b6d]', bg: 'from-[#c69b6d]/10 to-[#c69b6d]/5' },
    ROGUE: { text: 'text-[#fff468]', bg: 'from-[#fff468]/10 to-[#fff468]/5' },
    PRIEST: { text: 'text-[#ffffff]', bg: 'from-[#ffffff]/10 to-[#ffffff]/5' },
    DRUID: { text: 'text-[#ff7d0a]', bg: 'from-[#ff7d0a]/10 to-[#ff7d0a]/5' },
    HUNTER: { text: 'text-[#abd473]', bg: 'from-[#abd473]/10 to-[#abd473]/5' },
    SHAMAN: { text: 'text-[#0070de]', bg: 'from-[#0070de]/10 to-[#0070de]/5' },
    WARLOCK: { text: 'text-[#9482c9]', bg: 'from-[#9482c9]/10 to-[#9482c9]/5' },
    DEATHKNIGHT: { text: 'text-[#c41f3b]', bg: 'from-[#c41f3b]/10 to-[#c41f3b]/5' }
};

export default function RaiderCard({ raider, onOpenNotes, activeSession, onReplaceTrigger }) {
    const classKey = raider.class ? raider.class.toUpperCase().replace(/\s+/g, '') : '';
    const classStyle = classColors[classKey] || {
        text: 'text-gray-200',
        bg: 'from-[#414868]/10 to-[#1a1b26]/40'
    };

    const lows = raider.lows || 0;
    const mediums = raider.mediums || 0;
    const highs = raider.highs || 0;
    const gravityTotal = raider.gravedad_total || 0;

    const REALM = 'Icecrown';
    const armoryUrl = `https://armory.warmane.com/character/${encodeURIComponent(raider.name)}/${REALM}/summary`;

    const handleNameClick = (e) => {
        e.preventDefault();
        if (window.apiDB?.openExternalLink) {
            window.apiDB.openExternalLink(armoryUrl);
        } else {
            window.open(armoryUrl, '_blank');
        }
    };

    let alertBorder = 'border-l-[#414868]';
    let alertBadge = null;

    if (highs > 0) {
        alertBorder = 'border-l-[#c41f3b]';
        alertBadge = <span className="bg-[#c41f3b]/20 text-[#c41f3b] border border-[#c41f3b]/40 text-[9px] px-1 rounded font-mono font-bold uppercase tracking-wider animate-pulse">Peligro</span>;
    } else if (mediums > 0) {
        alertBorder = 'border-l-[#e0af68]';
        alertBadge = <span className="bg-[#e0af68]/15 text-[#e0af68] border border-[#e0af68]/40 text-[9px] px-1 rounded font-mono font-bold uppercase tracking-wider">Alerta</span>;
    } else if (lows > 0) {
        alertBorder = 'border-l-[#7dcfff]';
        alertBadge = <span className="bg-[#7dcfff]/15 text-[#7dcfff] border border-[#7dcfff]/40 text-[9px] px-1 rounded font-mono font-bold uppercase tracking-wider">Leve</span>;
    }

    return (
        <div className={`rounded bg-gradient-to-br ${classStyle.bg} flex flex-col justify-between p-2.5 h-full min-h-[85px] border border-[#24283b] border-l-4 ${alertBorder} shadow-md group relative select-none`}>
            {activeSession && onReplaceTrigger && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onReplaceTrigger();
                    }}
                    title="Reemplazar Raider en este slot"
                    className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 bg-[#bb9af7] hover:bg-[#ff007f] text-[#1a1b26] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer z-30 transform hover:scale-110"
                >
                    🔄
                </button>
            )}

            <div>
                <div className="flex justify-between items-center gap-1 mb-0.5">
                    <button
                        onClick={handleNameClick}
                        className={`font-bold text-[12px] truncate text-left ${classStyle.text} hover:underline cursor-pointer z-10 relative`}
                    >
                        {raider.name}
                    </button>
                    {alertBadge}
                </div>

                <div className="flex justify-between items-center mt-1">
                    <span className="text-[9px] uppercase text-[#565f89] tracking-widest font-semibold font-mono">
                        {raider.class}
                    </span>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenNotes(raider);
                        }}
                        className="text-[9px] bg-[#1f2335] border border-[#414868]/60 text-gray-400 hover:text-white hover:border-[#7dcfff] px-1.5 py-0.5 rounded font-mono transition-all opacity-40 group-hover:opacity-100 z-10 relative"
                    >
                        📝 NOTA
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-center mt-1.5 pt-1 border-t border-[#24283b]/40 text-[10px] font-mono text-[#565f89]">
                <div className="flex gap-1.5">
                    <span>L:<span className={lows > 0 ? 'text-[#7dcfff] font-bold' : ''}>{lows}</span></span>
                    <span>M:<span className={mediums > 0 ? 'text-[#e0af68] font-bold' : ''}>{mediums}</span></span>
                    <span>H:<span className={highs > 0 ? 'text-[#c41f3b] font-bold' : ''}>{highs}</span></span>
                </div>
                {gravityTotal > 0 && (
                    <span className="text-[9px] bg-[#24283b] px-1 rounded text-gray-400">
                        {gravityTotal} pts
                    </span>
                )}
            </div>
        </div>
    );
}