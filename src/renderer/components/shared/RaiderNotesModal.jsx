import React, { useState, useEffect } from 'react';

export default function RaiderNotesModal({ raider, onClose, onSave }) {
    // Estados internos para la nota y la severidad seleccionada
    const [noteText, setNoteText] = useState('');
    const [severity, setSeverity] = useState('LOW'); // Por defecto Leve
    const [isSaving, setIsSaving] = useState(false);

    // Sincronizar los datos cuando se abre el modal para un raider específico
    useEffect(() => {
        if (raider) {
            setNoteText(raider.notes || '');
            // Si pasamos una severidad por defecto desde la tarjeta, la toma; si no, inicia en LOW
            setSeverity(raider.defaultSeverity || 'LOW');
        }
    }, [raider]);

    if (!raider) return null;

    const handleConfirmSave = async () => {
        setIsSaving(true);
        // Le enviamos al padre el identificador, el texto de la nota y la severidad elegida
        await onSave(raider.id || raider.name, noteText, severity);
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-tokyo-main border-2 border-tokyo-border rounded-lg shadow-2xl w-full max-w-md overflow-hidden font-mono text-sm text-gray-200">
                
                {/* Cabecera del Modal */}
                <div className="bg-[#1f2335] p-3 border-b border-tokyo-panel flex justify-between items-center">
                    <h3 className="font-bold tracking-wide">
                        REGISTRAR INCIDENTE: <span className="text-[#7dcfff] uppercase">{raider.name}</span>
                    </h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-white font-black px-1"
                        disabled={isSaving}
                    >
                        ✕
                    </button>
                </div>

                {/* Cuerpo del Modal */}
                <div className="p-4 flex flex-col gap-4">
                    
                    {/* SECCIÓN DE SEVERIDAD (Tabs de selección rápida) */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] text-tokyo-comment uppercase tracking-wider font-bold">
                            Nivel de Severidad (Severity):
                        </label>
                        <div className="grid grid-cols-3 gap-2 bg-[#1f2335]/60 p-1 rounded border border-tokyo-panel">
                            <button
                                type="button"
                                onClick={() => setSeverity('LOW')}
                                className={`py-1.5 text-xs font-bold rounded transition-all ${
                                    severity === 'LOW'
                                        ? 'bg-[#7dcfff]/20 text-[#7dcfff] border border-[#7dcfff]/40'
                                        : 'text-gray-400 hover:text-white border border-transparent'
                                }`}
                            >
                                LEVE (LOW)
                            </button>
                            <button
                                type="button"
                                onClick={() => setSeverity('MEDIUM')}
                                className={`py-1.5 text-xs font-bold rounded transition-all ${
                                    severity === 'MEDIUM'
                                        ? 'bg-tokyo-orange/20 text-tokyo-orange border border-tokyo-orange/40'
                                        : 'text-gray-400 hover:text-white border border-transparent'
                                }`}
                            >
                                MEDIA (MEDIUM)
                            </button>
                            <button
                                type="button"
                                onClick={() => setSeverity('HIGH')}
                                className={`py-1.5 text-xs font-bold rounded transition-all ${
                                    severity === 'HIGH'
                                        ? 'bg-[#c41f3b]/20 text-[#c41f3b] border border-[#c41f3b]/40 animate-pulse'
                                        : 'text-gray-400 hover:text-white border border-transparent'
                                }`}
                            >
                                GRAVE (HIGH)
                            </button>
                        </div>
                    </div>

                    {/* CAJA DE TEXTO PARA LA NOTA */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] text-tokyo-comment uppercase tracking-wider font-bold">
                            Descripción del Suceso / Motivo:
                        </label>
                        <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Ej: Falló la entrega de esporas / Ausente sin avisar en pull..."
                            rows="4"
                            className="w-full bg-[#1f2335] border border-tokyo-panel rounded p-2 text-xs text-gray-100 outline-none resize-none focus:border-tokyo-border transition-colors placeholder:text-gray-600"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Pie del Modal / Acciones */}
                <div className="bg-tokyo-panel/50 p-3 border-t border-tokyo-panel flex justify-end gap-2 text-xs">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-3 py-1.5 rounded bg-tokyo-panel text-gray-300 hover:bg-tokyo-border transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirmSave}
                        disabled={isSaving}
                        className="px-4 py-1.5 rounded bg-[#9ece6a] text-tokyo-main font-bold hover:bg-[#9ece6a]/80 disabled:opacity-50 transition-colors"
                    >
                        {isSaving ? 'Guardando...' : 'Aplicar Sanción'}
                    </button>
                </div>

            </div>
        </div>
    );
}