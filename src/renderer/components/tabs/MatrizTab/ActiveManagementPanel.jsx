import React from 'react';
import SessionControl from '../../shared/SessionControl';

export default function ActiveManagementPanel({
    activeSession,
    handleEndSession,
    handleMarkIncomplete,
    loading
}) {
    return (
        <div className="bg-[#1f2335]/50 p-4 rounded-xl border border-[#414868] flex flex-col gap-4 flex-1 overflow-y-auto">
            <SessionControl session={activeSession} onEnd={handleEndSession} />

            <div className="bg-[#24283b] p-4 rounded-xl border border-[#414868] flex flex-col gap-3">
                <div>
                    <div className="text-[10px] uppercase text-[#565f89] tracking-wider">Raid incompleta</div>
                    <div className="text-[10px] text-[#a9b1d6] mt-1">
                        Marca la sesión como incompleta si necesitas cerrar el avance sin dejarla como completada.
                    </div>
                </div>

                <button
                    onClick={handleMarkIncomplete}
                    disabled={loading}
                    className="bg-[#e0af68] text-[#1a1b26] font-extrabold py-2 rounded-lg text-xs hover:bg-[#f6c177] transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                    {loading ? 'MARCANDO...' : 'DEJAR RAID INCOMPLETA'}
                </button>
            </div>
        </div>
    );
}