import React from 'react';
import RaiderCard from './RaiderCard';

export default function RaiderGrid({ raiders }) {
    // Crear 25 slots (5x5)
    const slots = Array.from({ length: 25 }, (_, i) => raiders[i] || null);

    if (slots.every(slot => slot === null)) {
        return (
            <div className="flex-1 grid grid-cols-5 grid-rows-5 gap-2 overflow-y-auto pr-1">
                <div className="h-full w-full flex items-center justify-center text-xs text-[#565f89] italic col-span-5 row-span-5">
                    [ Esperando carga de JSON ]
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 grid grid-cols-5 grid-rows-5 gap-2 overflow-y-auto pr-1">
            {slots.map((raider, index) => (
                <div key={index}>
                    {raider ? (
                        <RaiderCard raider={raider} />
                    ) : (
                        <div className="rounded-lg border border-dashed border-[#414868]/20 flex items-center justify-center bg-[#1f2335]/5 h-full min-h-[72px]">
                            <span className="text-[8px] text-[#565f89]/30">[VACÍO]</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
