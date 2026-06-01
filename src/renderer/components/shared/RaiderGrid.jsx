import React, { useState } from 'react';
import RaiderCard from './RaiderCard';
import RaiderNotesModal from './RaiderNotesModal';
import QuickReplaceModal from './QuickReplaceModal';

export default function RaiderGrid({ 
        raiders, 
        activeSession, 
        onReorderRaiders, 
        onLiveReplacement, 
        onSelectRaider,
        onNoteSaved
    }) {

    // ── PROCESAMIENTO INTELIGENTE DE SLOTS ──────────────────────────
    const slots = Array.from({ length: 25 }, (_, i) => {
        if (activeSession) {
            // Sesión Activa: Mapeo directo por índice de array (Gestión en vivo)
            return raiders[i] || null;
        }

        // FASE DE EDICIÓN (Antes de iniciar la raid):
        
        // 1. Prioridad Absoluta: Ver si un jugador ya fue asignado a este slot por Drag & Drop
        const raiderInSlot = raiders.find(r => r.slot === i);
        if (raiderInSlot) return raiderInSlot;

        // 2. Si el slot está vacío, calculamos qué jugador del JSON original debería ir aquí por su .subgroup
        const targetGroup = Math.floor(i / 5) + 1; // Grupo (1 al 5)
        const indexInGroup = i % 5;                 // Posición interna (0 al 4)

        // Filtramos los raiders de este grupo que AÚN no tienen un slot asignado manualmente en otro lado
        const raidersInThisGroup = raiders.filter(r => 
            Number(r.subgroup) === targetGroup && 
            (r.slot === null || r.slot === undefined)
        );

        // Retornamos el jugador que calza en la posición o null si ya se movieron o no hay más
        return raidersInThisGroup[indexInGroup] || null;
    });

    const [activeRaider, setActiveRaider] = useState(null);
    const [replaceTarget, setReplaceTarget] = useState(null);

    const handleSaveNote = async (raiderId, text, severity) => {
        try {
            const currentSessionId = activeSession?.id || null;
            if (window.apiDB?.addRaiderNota) {
                await window.apiDB.addRaiderNota(raiderId, currentSessionId, text, severity);
            }
            if (onNoteSaved && activeRaider) {
                await onNoteSaved(activeRaider);
            }
            setActiveRaider(null);
        } catch (error) {
            console.error('Error en el Front al guardar la nota:', error);
        }
    };

    if (!activeSession && raiders.length === 0) {
        return (
            <div className="flex-1 min-h-100 flex items-center justify-center border border-dashed border-tokyo-border/30 rounded-lg bg-tokyo-main/40 m-1">
                <div className="text-sm text-tokyo-comment font-mono uppercase tracking-widest animate-pulse">[ Esperando volcado JSON ]</div>
            </div>
        );
    }

    return (
        <div className="flex-1 relative">
            <div className="grid grid-cols-5 gap-2.5 p-1 overflow-y-auto max-h-[calc(100vh-320px)]">
            {slots.map((raider, index) => (
                <div
                    key={index}
                    className="h-full relative group"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        const raiderName = e.dataTransfer.getData('text/plain');
                        // Solo se ejecuta si NO hay sesión activa
                        if (!activeSession && onReorderRaiders && raiderName) {
                            onReorderRaiders(raiderName, index);
                        }
                    }}
                >
                    {raider ? (
                        <div
                            draggable={!activeSession} // Bloqueado automáticamente en sesión activa
                            onDragStart={(e) => e.dataTransfer.setData('text/plain', raider.name)}
                            className={`${!activeSession ? 'cursor-grab active:cursor-grabbing' : ''} h-full transition-transform duration-150`}
                        >
                            <RaiderCard
                                raider={raider}
                                onOpenNotes={setActiveRaider}
                                activeSession={activeSession}
                                onReplaceTrigger={() => setReplaceTarget({
                                    slotIndex: index,
                                    raiderOutId: raider.id || raider.raider_id,
                                    nameOut: raider.name
                                })}
                                onSelectRaider={onSelectRaider}
                            />
                        </div>
                    ) : (
                            <div
                                onClick={() => activeSession && setReplaceTarget({ slotIndex: index, raiderOutId: null, nameOut: 'Slot Vacío' })}
                                className={`rounded border border-dashed border-tokyo-panel flex flex-col items-center justify-center bg-[#1f2335]/20 h-full min-h-21.25 transition-all duration-200 ${
                                    activeSession
                                        ? 'hover:bg-[#9ece6a]/5 hover:border-[#9ece6a] opacity-60 hover:opacity-100 cursor-pointer'
                                        : 'opacity-40'
                                }`}
                            >
                                <span className="text-[10px] font-mono text-tokyo-comment">G{Math.floor(index / 5) + 1}</span>
                                {activeSession && (
                                    <span className="text-[9px] text-[#9ece6a] mt-1 font-mono font-bold tracking-wider animate-pulse">
                                        [ + LIBRE ]
                                    </span>
                                )}
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

            {replaceTarget && (
                <QuickReplaceModal
                    target={replaceTarget}
                    sessionId={activeSession?.id || null}
                    currentRoster={raiders}
                    onClose={() => setReplaceTarget(null)}
                    onConfirm={async (data) => {
                        if (onLiveReplacement) {
                            await onLiveReplacement({
                                slotIndex: replaceTarget.slotIndex,
                                raiderOutId: replaceTarget.raiderOutId,
                                raiderInId: data.raiderInId,
                                newName: data.name,
                                newClass: data.class,
                                note: data.note
                            });
                        }
                        setReplaceTarget(null);
                    }}
                />
            )}
        </div>
    );
}