import React from 'react';
import RaiderCard from './RaiderCard';

export default function RaiderGrid({ raiders }) {
    // Forzar exactamente un formato de 25 slots de banda (5 grupos de 5)
    const slots = Array.from({ length: 25 }, (_, i) => raiders[i] || null);

    if (slots.every(slot => slot === null)) {
        return (
            <div className="flex-1 min-h-[450px] flex items-center justify-center border border-dashed border-[#414868]/30 rounded-lg bg-[#1a1b26]/40 m-1">
                <div className="text-sm text-[#565f89] font-mono uppercase tracking-widest animate-pulse">
                    [ Esperando volcado JSON de la Raid ]
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 grid grid-cols-5 gap-2.5 p-1 overflow-y-auto max-h-[calc(100vh-180px)]">
            {slots.map((raider, index) => (
                <div key={index} className="h-full">
                    {raider ? (
                        <RaiderCard raider={raider} />
                    ) : (
                        <div className="rounded border border-dashed border-[#24283b] flex flex-col items-center justify-center bg-[#1f2335]/20 h-full min-h-[80px] opacity-40 hover:opacity-60 transition-opacity">
                            <span className="text-[10px] font-mono text-[#565f89] tracking-wider">G{Math.floor(index / 5) + 1}</span>
                            <span className="text-[8px] font-mono text-[#414868]">SLOT {index + 1}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}