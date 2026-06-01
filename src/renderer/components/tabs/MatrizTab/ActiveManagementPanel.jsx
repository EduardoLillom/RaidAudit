import React from 'react';
import SessionControl from '../../shared/SessionControl';

export default function ActiveManagementPanel({
    activeSession,
    handleEndSession,
    handleMarkIncomplete,
    loading
}) {
    return (
        <div className="bg-tokyo-panel/50 p-4 rounded-xl border border-tokyo-border flex flex-col gap-4 flex-1 overflow-y-auto">
            <SessionControl session={activeSession} onEnd={handleEndSession} />

            <div className="bg-tokyo-panel p-4 rounded-xl border border-tokyo-border flex flex-col gap-3">
                <div>
                    <div className="text-[10px] uppercase text-tokyo-comment tracking-wider">Raid incompleta</div>
                    <div className="text-[10px] text-slate-300 mt-1">
                        Marca la sesión como incompleta si necesitas cerrar el avance sin dejarla como completada.
                    </div>
                </div>

                <button
                    onClick={handleMarkIncomplete}
                    disabled={loading}
                    className="bg-tokyo-orange text-tokyo-main font-extrabold py-2 rounded-lg text-xs hover:bg-tokyo-orange/80 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                    {loading ? 'MARCANDO...' : 'DEJAR RAID INCOMPLETA'}
                </button>
            </div>
        </div>
    );
}