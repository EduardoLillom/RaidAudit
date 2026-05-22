import React from 'react';

export default function HistorialAsistencias({ profile, nickname }) {
    return (
        <div>
            <span className="text-[10px] uppercase text-[#565f89] font-bold block mb-2 tracking-wider">
                Asistencias a Bandas de {nickname}
            </span>
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {profile.history && profile.history.length > 0 ? (
                    profile.history.map((h, idx) => (
                        <div key={idx} className="bg-[#1a1b26] p-3 rounded border border-[#414868] flex justify-between items-center text-xs">
                            <div>
                                <span className="text-white font-bold">{h.raid_name}</span>
                                <span className="text-[10px] text-[#565f89] ml-4 font-mono">{h.date}</span>
                            </div>
                            <span className="text-[#9ece6a] bg-[#9ece6a]/5 border border-[#9ece6a]/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                {h.guild_name}
                              </span>
                        </div>
                    ))
                ) : (
                    <p className="text-xs text-[#565f89] italic bg-[#1f2335]/20 p-3 rounded border border-[#414868]/20">
                        [ Sin registros de asistencia con este personaje ]
                    </p>
                )}
            </div>
        </div>
    );
}