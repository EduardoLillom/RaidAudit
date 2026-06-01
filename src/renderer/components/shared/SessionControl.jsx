import React from 'react';

export default function SessionControl({ session, onEnd }) {
    return (
        <div className="bg-[#1f2335]/80 p-4 rounded-xl border border-tokyo-border mb-4">
            <div className="flex flex-col gap-2">
                <div className="text-[10px] uppercase text-tokyo-comment tracking-wider">Sesión Activa</div>
                <div className="flex justify-between items-center gap-2">
                    <div>
                        <p className="text-xs font-bold text-tokyo-purple">{session.name}</p>
                        <p className="text-[10px] text-[#9ece6a]">Tipo: {session.instance || 'ICC'}</p>
                        {session.notes ? (
                            <p className="text-[10px] text-slate-300">Notas: {session.notes}</p>
                        ) : null}
                        <p className="text-[10px] text-[#9ece6a]">Iniciada en: {session.start_time || '---'}</p>
                    </div>
                    <button
                        onClick={() => onEnd(session.id)}
                        className="bg-[#c41f3b] text-white text-[10px] uppercase font-bold px-3 py-2 rounded-lg hover:bg-[#a81a2d] transition-all"
                    >
                        TERMINAR SESIÓN
                    </button>
                </div>
            </div>
        </div>
    );
}
