import React, { useState } from 'react';
import RaiderCard from './RaiderCard';
import RaiderNotesModal from './RaiderNotesModal';

export default function RaiderGrid({ raiders, activeSession, onReorderRaiders }) {
    // 🛠️ CORREGIDO: Buscamos qué raider pertenece a qué slot del 0 al 24
    const slots = Array.from({ length: 25 }, (_, i) => {
        if (activeSession) {
            // Si la sesión ya inició en BD, tu array viene indexado del 0 al 24 secuencialmente
            return raiders[i] || null;
        }
        // Si estamos previsualizando, buscamos por la propiedad explicita .slot
        return raiders.find(r => r.slot === i) || null;
    });

    const [activeRaider, setActiveRaider] = useState(null);

    const handleSaveNote = async (raiderId, text, severity) => {
        try {
            const currentSessionId = activeSession?.id || null; 

            if (window.apiDB?.addRaiderNota) {
                await window.apiDB.addRaiderNota(raiderId, currentSessionId, text, severity);
            }
            setActiveRaider(null);
        } catch (error) {
            console.error("Error en el Front al guardar la nota:", error);
        }
    };

    // Si no hay datos analizados ni sesión activa, mostramos el panel vacío original
    if (!activeSession && raiders.length === 0) {
        return (
            <div className="flex-1 min-h-[400px] flex items-center justify-center border border-dashed border-[#414868]/30 rounded-lg bg-[#1a1b26]/40 m-1">
                <div className="text-sm text-[#565f89] font-mono uppercase tracking-widest animate-pulse">[ Esperando volcado JSON ]</div>
            </div>
        );
    }

    return (
        <div className="flex-1 relative">
            <div className="grid grid-cols-5 gap-2.5 p-1 overflow-y-auto max-h-[calc(100vh-320px)]">
                {slots.map((raider, index) => (
                    <div 
                        key={index} 
                        className="h-full"
                        onDragOver={(e) => e.preventDefault()} // Permitir Drop
                        onDrop={(e) => {
                            e.preventDefault();
                            const raiderName = e.dataTransfer.getData("text/plain");
                            if (!activeSession && onReorderRaiders) {
                                onReorderRaiders(raiderName, index); // Mueve al slot i de la raid
                            }
                        }}
                    >
                        {raider ? (
                            <div 
                                draggable={!activeSession} // Bloqueado si la raid ya empezó
                                onDragStart={(e) => e.dataTransfer.setData("text/plain", raider.name)}
                                className={`${!activeSession ? 'cursor-grab active:cursor-grabbing' : ''} h-full transition-transform duration-150`}
                            >
                                <RaiderCard raider={raider} onOpenNotes={setActiveRaider} />
                            </div>
                        ) : (
                            <div className="rounded border border-dashed border-[#24283b] flex flex-col items-center justify-center bg-[#1f2335]/20 h-full min-h-[80px] opacity-40 transition-colors hover:bg-[#1f2335]/40">
                                <span className="text-[10px] font-mono text-[#565f89]">G{Math.floor(index / 5) + 1}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <RaiderNotesModal 
                raider={activeRaider} 
                onClose={() => setActiveRaider(null)} 
                onSave={handleSaveNote} 
            />
        </div>
    );
}