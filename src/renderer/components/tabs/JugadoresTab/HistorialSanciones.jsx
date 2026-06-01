import React, { useState } from 'react';

export default function HistorialSanciones({ profile, nickname, onOpenNotesModal, onEditNote, onDeleteNote }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase text-tokyo-comment font-bold block tracking-wider">
                    Historial de Sanciones de {nickname}
                </span>
                <button
                    onClick={onOpenNotesModal}
                    className="text-[9px] bg-[#f7768e]/10 hover:bg-[#f7768e]/20 border border-[#f7768e]/40 hover:border-[#f7768e] text-[#f7768e] font-bold px-2 py-1 rounded transition-all uppercase tracking-tight"
                >
                    + Añadir Nota / Alerta
                </button>
            </div>

            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {profile.notes && profile.notes.length > 0 ? (
                    profile.notes.map((n, idx) => (
                        <TarjetaNota 
                            key={`${n.id}-${idx}`} 
                            nota={n} 
                            onEditNote={onEditNote} 
                            onDeleteNote={onDeleteNote} 
                        />
                    ))
                ) : (
                    <p className="text-xs text-tokyo-comment italic bg-[#1f2335]/20 p-3 rounded border border-tokyo-border/20">
                        [ Este personaje está completamente limpio de alertas ]
                    </p>
                )}
            </div>
        </div>
    );
}

// 🛡️ SUBCOMPONENTE ATÓMICO: Tarjeta de Nota con Edición Inline
function TarjetaNota({ nota, onEditNote, onDeleteNote }) {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(nota.note_text);
    const [severity, setSeverity] = useState(nota.severity || 'LOW');

    const severidadLimpia = String(severity).toUpperCase();

    // Guardar los cambios locales e informar al contenedor padre
    const handleLocalSave = async () => {
        if (!text.trim()) return;
        await onEditNote(nota.id, text, severity);
        setIsEditing(false);
    };

    // Cancelar y restaurar valores originales
    const handleCancel = () => {
        setText(nota.note_text);
        setSeverity(nota.severity || 'LOW');
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="bg-tokyo-main p-3 rounded border border-tokyo-purple flex flex-col gap-2 animate-fadeIn font-mono">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] text-[#7aa2f7]">Raid: {nota.instance || 'Nota General'}</span>
                    
                    {/* Selector de Severidad Inline */}
                    <div className="flex gap-1 text-[9px]">
                        {['LOW', 'MEDIUM', 'HIGH'].map((sev) => (
                            <button
                                key={sev}
                                onClick={() => setSeverity(sev)}
                                className={`px-1.5 py-0.5 rounded border transition-all ${
                                    severity === sev
                                        ? sev === 'HIGH' ? 'bg-[#f7768e]/20 border-[#f7768e] text-[#f7768e]' :
                                          sev === 'MEDIUM' ? 'bg-tokyo-orange/20 border-tokyo-orange text-tokyo-orange' :
                                          'bg-[#7aa2f7]/20 border-[#7aa2f7] text-[#7aa2f7]'
                                        : 'bg-transparent border-tokyo-border text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                {sev}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Área de texto editable */}
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full bg-[#1f2335] border border-tokyo-border rounded p-1.5 text-xs text-gray-200 outline-none resize-none focus:border-[#7aa2f7]"
                    rows="2"
                />

                {/* Acciones de Edición */}
                <div className="flex justify-end gap-2 text-[10px]">
                    <button onClick={handleCancel} className="text-gray-400 hover:text-white">[CANCELAR]</button>
                    <button onClick={handleLocalSave} className="text-[#9ece6a] font-bold hover:underline">[GUARDAR]</button>
                </div>
            </div>
        );
    }

    // --- MODO VISTA NORMAL ---
    return (
        <div className="bg-tokyo-main p-3 rounded border border-tokyo-border flex flex-col gap-1 relative group font-mono">
            <div className="flex justify-between items-center text-xs">
                <span className="text-[#7aa2f7] text-[10px]">
                    Raid: {nota.instance || 'Nota General'}
                </span>
                
                <div className="flex items-center gap-2">
                    {/* Botones de acción contextuales del Staff */}
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="text-[9px] text-tokyo-orange opacity-60 hover:opacity-100 transition-opacity"
                    >
                        [EDITAR]
                    </button>
                    <button 
                        onClick={() => onDeleteNote(nota.id)}
                        className="text-[9px] text-[#f7768e] opacity-60 hover:opacity-100 transition-opacity"
                    >
                        [BORRAR]
                    </button>

                    <span className={`text-[9px] px-2 py-0.5 rounded border ml-1 ${
                        severidadLimpia === 'HIGH' ? 'bg-[#f7768e]/10 border-[#f7768e]/30 text-[#f7768e]' :
                        severidadLimpia === 'MEDIUM' ? 'bg-tokyo-orange/10 border-tokyo-orange/30 text-tokyo-orange' :
                        'bg-[#7aa2f7]/10 border-[#7aa2f7]/30 text-[#7aa2f7]'
                    }`}>
                        {severidadLimpia}
                    </span>
                </div>
            </div>
            
            <p className="text-xs text-gray-300 bg-[#1f2335]/40 p-2 rounded border border-tokyo-border/30 mt-1 break-words">
                {nota.note_text}
            </p>
        </div>
    );
}