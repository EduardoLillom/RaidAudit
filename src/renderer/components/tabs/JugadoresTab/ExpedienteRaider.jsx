import React from 'react';
import ExpedienteHeader from './ExpedienteHeader';
import HistorialSanciones from './HistorialSanciones';
import ListaAltersVinculados from './ListaAltersVinculados';
import HistorialAsistencias from './HistorialAsistencias';

export default function ExpedienteRaider({
    loadingProfile,
    profile,
    selectedRaider,
    onOpenLinkModal,
    onOpenNotesModal,
    onEditNote,
    onDeleteNote
}) {
    if (loadingProfile) {
        return (
            <div className="flex-1 bg-tokyo-main/40 p-5 rounded-xl border border-tokyo-border h-full flex items-center justify-center text-xs text-[#7aa2f7] animate-pulse">
                [ ACCEDIENDO A LOS REGISTROS DEL RAIDER... ]
            </div>
        );
    }

    if (!profile || !selectedRaider) {
        return (
            <div className="flex-1 bg-tokyo-main/40 p-5 rounded-xl border border-tokyo-border h-full flex items-center justify-center text-xs text-tokyo-comment italic">
                [ SELECCIONA UN PERSONAJE DE LA IZQUIERDA PARA VER SU EXPEDIENTE ]
            </div>
        );
    }

    return (
        <div className="flex-1 bg-tokyo-main/40 p-5 rounded-xl border border-tokyo-border overflow-y-auto h-full mb-0">
            <div className="space-y-6">
                
                {/* Cabecera y Gravedad */}
                <ExpedienteHeader 
                    profile={profile} 
                    selectedRaider={selectedRaider} 
                />

                {/* Historial de Notas/Sanciones */}
                <HistorialSanciones 
                    profile={profile} 
                    nickname={selectedRaider.nickname} 
                    onOpenNotesModal={onOpenNotesModal}
                    onEditNote={onEditNote}
                    onDeleteNote={onDeleteNote}
                />

                {/* Gestión de Alters */}
                <ListaAltersVinculados 
                    profile={profile} 
                    onOpenLinkModal={onOpenLinkModal} 
                />

                {/* Registro de Asistencias a Raids */}
                <HistorialAsistencias 
                    profile={profile} 
                    nickname={selectedRaider.nickname} 
                />

            </div>
        </div>
    );
}