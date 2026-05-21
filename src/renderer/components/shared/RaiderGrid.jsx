import React, { useState } from 'react';
import RaiderCard from './RaiderCard';
import RaiderNotesModal from './RaiderNotesModal';

// CORREGIDO: Agregamos 'activeSession' en las props de entrada
export default function RaiderGrid({ raiders, activeSession }) {
    const slots = Array.from({ length: 25 }, (_, i) => raiders[i] || null);

    // Estado para capturar el objeto completo del raider que se va a editar
    const [activeRaider, setActiveRaider] = useState(null);

    const handleSaveNote = async (raiderId, text, severity) => {
        try {
            // CORREGIDO: 'activeSession' ahora sí existe gracias a las props superiores
            const currentSessionId = activeSession?.id || null; 

            console.log(`Enviando a BD -> Raider ID: ${raiderId}, Sesión ID: ${currentSessionId}, Nota: ${text}, Severidad: ${severity}`);

            if (window.apiDB?.addRaiderNota) {
                // Ejecutamos la consulta síncrona en Electron pasándole los 4 parámetros exactos
                await window.apiDB.addRaiderNota(raiderId, currentSessionId, text, severity);
            }

            // Refrescar los datos locales según el contexto donde estés parado
            if (currentSessionId) {
                // Si tienes una función para volver a pedir los raiders actualizados a la BD, la ejecutas aquí:
                // fetchSessionRaiders(currentSessionId);
            } else {
                // Lógica de refresco para paneles administrativos fuera de raid
            }

            // Cerramos el modal limpiamente
            setActiveRaider(null);
        } catch (error) {
            console.error("Error en el Front al guardar la nota:", error);
        }
    };

    if (slots.every(slot => slot === null)) {
        return (
            <div className="flex-1 min-h-[450px] flex items-center justify-center border border-dashed border-[#414868]/30 rounded-lg bg-[#1a1b26]/40 m-1">
                <div className="text-sm text-[#565f89] font-mono uppercase tracking-widest animate-pulse">[ Esperando volcado JSON ]</div>
            </div>
        );
    }

    return (
        <div className="flex-1 relative">
            {/* Cuadrícula de la Banda */}
            <div className="grid grid-cols-5 gap-2.5 p-1 overflow-y-auto max-h-[calc(100vh-180px)]">
                {slots.map((raider, index) => (
                    <div key={index} className="h-full">
                        {raider ? (
                            <RaiderCard raider={raider} onOpenNotes={setActiveRaider} />
                        ) : (
                            <div className="rounded border border-dashed border-[#24283b] flex flex-col items-center justify-center bg-[#1f2335]/20 h-full min-h-[80px] opacity-40">
                                <span className="text-[10px] font-mono text-[#565f89]">G{Math.floor(index / 5) + 1}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal Condicional */}
            <RaiderNotesModal 
                raider={activeRaider} 
                onClose={() => setActiveRaider(null)} 
                onSave={handleSaveNote} 
            />
        </div>
    );
}