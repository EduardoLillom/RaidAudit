import React, { useState, useEffect } from 'react';

function calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return '--:--';
    
    try {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        let startTotalMin = startHour * 60 + startMin;
        let endTotalMin = endHour * 60 + endMin;
        
        if (endTotalMin < startTotalMin) {
            endTotalMin += 24 * 60;
        }
        
        const diffMin = endTotalMin - startTotalMin;
        const hours = Math.floor(diffMin / 60);
        const minutes = diffMin % 60;
        
        return `${hours}h ${minutes}m`;
    } catch (e) {
        return '--:--';
    }
}

export default function GuildsTab() {
    const [guilds, setGuilds] = useState([]);
    const [selectedGuild, setSelectedGuild] = useState('');
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        loadGuilds();
    }, []);

    async function loadGuilds() {
        try {
            const data = await window.apiDB.getAllGuilds();
            setGuilds(data);
        } catch (error) {
            console.error('Error loading guilds:', error);
        }
    }

    async function handleSelectGuild(e) {
        const guildId = e.target.value;
        setSelectedGuild(guildId);
        setSessions([]);

        if (!guildId) return;

        try {
            const data = await window.apiDB.getGuildHistory(Number(guildId));
            setSessions(data);
        } catch (error) {
            console.error('Error loading guild history:', error);
        }
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex gap-3 items-center mb-5 bg-[#1a1b26]/40 p-3 rounded-lg border border-[#414868]">
                <span className="text-xs text-[#41a6b5] font-bold uppercase">// INDEX_FILTRO_GUILD:</span>
                <select 
                    value={selectedGuild}
                    onChange={handleSelectGuild}
                    className="bg-[#1a1b26] border border-[#414868] text-xs text-[#9ece6a] px-3 py-1.5 rounded outline-none cursor-pointer focus:border-[#9ece6a]"
                >
                    <option value="">-- SELECCIONAR HERMANDAD REGISTRADA --</option>
                    {guilds.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                </select>
            </div>
            <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr className="border-b border-[#414868] text-[#565f89] uppercase tracking-wider text-[10px]">
                            <th className="pb-2 font-bold pl-2">ID_SESS</th>
                            <th className="pb-2 font-bold">RAID / INSTANCIA</th>
                            <th className="pb-2 font-bold">TIPO</th>
                            <th className="pb-2 font-bold">NOTAS</th>
                            <th className="pb-2 font-bold">INICIO</th>
                            <th className="pb-2 font-bold">FIN</th>
                            <th className="pb-2 font-bold">DURACIÓN</th>
                            <th className="pb-2 font-bold">STATUS SQL</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#414868]/20">
                        {sessions.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="py-8 text-center text-[#565f89] italic">
                                    [ No existen registros de bandas para esta hermandad ]
                                </td>
                            </tr>
                        ) : (
                            sessions.map(s => {
                                const duracion = s.start_time && s.end_time 
                                    ? calculateDuration(s.start_time, s.end_time)
                                    : '--:--';
                                
                                return (
                                    <tr key={s.id} className="hover:bg-[#1f2335]/30 transition-all">
                                        <td className="py-3 font-bold text-[#41a6b5] pl-2">#{s.id}</td>
                                        <td className="py-3 text-gray-200 font-bold">{s.name}</td>
                                        <td className="py-3 text-[#9ece6a]">{s.instance || '--'}</td>
                                        <td className="py-3 text-[#a9b1d6]">{s.notes || '--'}</td>
                                        <td className="py-3 text-[#a9b1d6]">{s.start_time || '--:--'}</td>
                                        <td className="py-3 text-[#a9b1d6]">{s.end_time || '--:--'}</td>
                                        <td className="py-3 text-[#9ece6a] font-bold">{duracion}</td>
                                        <td className="py-3">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-[#9ece6a] border border-green-500/20 uppercase">
                                                {s.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
