import React, { useState, useEffect } from 'react';

export default function JugadoresTab() {
    const [players, setPlayers] = useState([
        { id: 1, nickname: 'Fracks' },
        { id: 2, nickname: 'Xexu' }
    ]);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [profile, setProfile] = useState(null);

    async function handleSelectPlayer(player, element) {
        setSelectedPlayer(player);
        
        try {
            const data = await window.apiDB.getPlayerProfile(player.id);
            setProfile(data);
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    return (
        <div className="flex-1 gap-6 overflow-hidden flex">
            <div id="list-players" className="w-1/4 border-r border-[#414868]/40 pr-4 flex flex-col gap-2 overflow-y-auto">
                {players.map(p => (
                    <div
                        key={p.id}
                        onClick={() => handleSelectPlayer(p)}
                        className={`p-3 rounded border cursor-pointer transition-all ${
                            selectedPlayer?.id === p.id
                                ? 'bg-[#1a1b26] border-[#41a6b5]'
                                : 'bg-[#1f2335]/30 border-[#414868]/60 hover:border-[#bb9af7]'
                        }`}
                    >
                        <div className="font-bold text-[#a9b1d6]">{p.nickname}</div>
                        <div className="text-[9px] text-[#565f89] mt-1">ID MAESTRO: #{p.id}</div>
                    </div>
                ))}
            </div>

            <div className="flex-1 bg-[#1a1b26]/40 p-5 rounded-xl border border-[#414868] overflow-y-auto">
                {!profile ? (
                    <div className="h-full flex items-center justify-center text-xs text-[#565f89] italic">
                        [ SELECCIONA UN EXPEDIENTE DE JUGADOR DE LA IZQUIERDA ]
                    </div>
                ) : (
                    <div>
                        <h3 className="text-xs font-bold text-[#e0af68] uppercase tracking-wider mb-5">
                            // EXPEDIENTE CENTRAL: {selectedPlayer.nickname.toUpperCase()}_(ID_{selectedPlayer.id})
                        </h3>
                        <div className="mb-6">
                            <span className="text-[10px] uppercase text-[#565f89] block mb-2">Personajes Registrados (Alters)</span>
                            <div className="flex flex-wrap gap-2">
                                {profile.characters.length > 0 ? (
                                    profile.characters.map(c => (
                                        <span key={c.id} className="text-xs bg-[#24283b] border border-[#414868] px-3 py-1.5 rounded flex items-center gap-2">
                                            <span className="font-bold text-gray-200">{c.name}</span>
                                            <span className="text-[10px] opacity-60 text-[#41a6b5]">({c.class})</span>
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-xs text-[#565f89] italic">[ Ningún PJ asignado ]</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase text-[#565f89] block mb-2">Historial Colectivo de Asistencia</span>
                            <div className="space-y-2">
                                {profile.history.length > 0 ? (
                                    profile.history.map((h, idx) => (
                                        <div key={idx} className="bg-[#1a1b26] p-3 rounded border border-[#414868] flex justify-between items-center text-xs">
                                            <div>
                                                <span className="text-white font-bold">{h.raid_name}</span>
                                                <span className="text-[10px] text-[#565f89] ml-4">{h.date}</span>
                                                <span className="text-[10px] text-[#9ece6a] ml-4 font-bold">[{h.guild_name}]</span>
                                            </div>
                                            <span className="text-[#41a6b5] bg-[#41a6b5]/5 border border-[#414868]/20 px-2 py-0.5 rounded text-[10px]">
                                                Con: {h.character_name}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-[#565f89] italic">[ Sin registros de asistencia ]</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
