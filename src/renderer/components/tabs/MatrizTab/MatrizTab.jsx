import React, { useState, useEffect } from 'react';
import RaiderGrid from '../../shared/RaiderGrid';
import SessionConfigForm from './SessionConfigForm';
import ActiveManagementPanel from './ActiveManagementPanel';
import RaiderCard from '../../shared/RaiderCard';

export default function MatrizTab({ onSelectRaider }) {
    const [guilds, setGuilds] = useState([]);
    const [selectedGuild, setSelectedGuild] = useState('');
    const [raidType, setRaidType] = useState('ICC');
    const [raidNotes, setRaidNotes] = useState('');
    const [jsonText, setJsonText] = useState('');
    const [raiders, setRaiders] = useState([]);
    const [status, setStatus] = useState('WAITING_FOR_LOG (AUDIT_ACTIVE)');
    const [datosRaidTemporal, setDatosRaidTemporal] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeSession, setActiveSession] = useState(null);
    const [sessionRaiders, setSessionRaiders] = useState([]);

    useEffect(() => {
        loadGuilds();
        loadActiveSession();
    }, []);

    async function loadGuilds() {
        try {
            const data = await window.apiDB.getAllGuilds();
            setGuilds(data);
        } catch (error) {
            console.error('Error loading guilds:', error);
        }
    }

    async function loadActiveSession() {
        try {
            const session = await window.apiDB.getActiveSession();
            if (session) {
                setActiveSession(session);
                const raiders = await window.apiDB.getSessionRaiders(session.id);
                setSessionRaiders(raiders);
                setStatus('SESSION_ACTIVE');
            } else {
                setActiveSession(null);
                setSessionRaiders([]);
                setStatus('WAITING_FOR_LOG (AUDIT_ACTIVE)');
            }
        } catch (error) {
            console.error('Error loading active session:', error);
        }
    }

    async function handleStartSession() {
        let datosAEnviar = datosRaidTemporal;

        if (!datosAEnviar) {
            try {
                const raidersParsed = JSON.parse(jsonText);
                const formatted = raidersParsed.map((r, idx) => ({
                    ...r,
                    slot: idx < 25 ? idx : null
                }));
                const soloTitulares = formatted.filter(raider => raider.slot !== null);

                datosAEnviar = {
                    guildId: Number(selectedGuild),
                    instance: raidType,
                    notes: raidNotes,
                    currentTime: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                    raiders: soloTitulares
                };
            } catch (error) {
                alert('El formato del JSON es inválido. Revísalo bien antes de enviarlo.');
                console.error(error);
                return;
            }
        } else {
            const soloTitulares = raiders.filter(raider => raider.slot !== null);

            datosAEnviar = {
                ...datosRaidTemporal,
                raiders: soloTitulares
            };
        }

        try {
            setLoading(true);
            await window.apiDB.insertRaidSession(datosAEnviar);

            setStatus('✓ SESIÓN INICIADA');
            setJsonText('');
            setRaiders([]);
            setDatosRaidTemporal(null);
            setRaidType('ICC');
            setRaidNotes('');
            await loadActiveSession();
        } catch (err) {
            alert('Error al iniciar la sesión en la base de datos local SQLite.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleProcesar() {
        // 1. Ahora SOLO exigimos que el texto del JSON no esté vacío
        if (!jsonText.trim()) {
            alert('Por favor, rellena el log JSON antes de analizar.');
            return;
        }

        setLoading(true);

        try {
            let raidersData = JSON.parse(jsonText);
            raidersData.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

            const processedRaiders = [];
            const groupCounters = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

            for (let r of raidersData) {
                const dbStatus = await window.apiDB.getRaiderStatus(r.name);
                const g = Number(r.subgroup);
                let assignedSlot = null;

                if (g >= 1 && g <= 5 && groupCounters[g] < 5) {
                    assignedSlot = (g - 1) * 5 + groupCounters[g];
                    groupCounters[g]++;
                }

                processedRaiders.push({
                    ...r,
                    id: dbStatus.id,
                    lows: dbStatus.lows,
                    mediums: dbStatus.mediums,
                    highs: dbStatus.highs,
                    gravedad_total: dbStatus.gravity_total,
                    slot: assignedSlot
                });
            }

            setRaiders(processedRaiders);
            
            // Guardamos los datos temporales. 
            // Si 'selectedGuild' está vacío, se guardará como 0 o NaN temporalmente, 
            // pero no importa porque se actualizará al darle a Confirmar Sesión.
            setDatosRaidTemporal({
                guildId: Number(selectedGuild) || null, 
                instance: raidType,
                notes: raidNotes,
                currentTime: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                raiders: processedRaiders
            });

            setStatus('◈ ROSTER ACOMODADO Y ORDENADO ALFABÉTICAMENTE');
        } catch (err) {
            alert('Error crítico al leer el JSON: Asegúrate de que el formato sea correcto.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handleReorderRaiders = (raiderName, targetSlot) => {
        setRaiders(prevRaiders => {
            const updated = prevRaiders.map(raider => {
                if (raider.name === raiderName) {
                    return { ...raider, slot: targetSlot };
                }
                if (targetSlot !== null && raider.slot === targetSlot) {
                    return { ...raider, slot: null };
                }
                return raider;
            });

            setDatosRaidTemporal(prev => prev ? { ...prev, raiders: updated } : null);
            return updated;
        });
    };

    async function handleEndSession(sessionId) {
        try {
            setLoading(true);
            const endTime = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            await window.apiDB.endRaidSession(sessionId, endTime);
            setActiveSession(null);
            setSessionRaiders([]);
            setStatus('SESSION_ENDED');
        } catch (err) {
            alert('Error al terminar la SESIÓN activa.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleLiveReplacement({ slotIndex, raiderOutId, raiderInId, newName, newClass, note }) {
        if (!activeSession) return;

        try {
            setLoading(true);
            const subgroup = Math.max(1, Math.floor(slotIndex / 5) + 1);
            const cleanName = String(newName || '').trim();
            const cleanNote = String(note || '').trim();

            if (!cleanName) {
                throw new Error('El nombre del reemplazo es obligatorio.');
            }

            let finalRaiderId = Number(raiderInId || 0);

            if (raiderOutId != null) {
                if (!finalRaiderId) {
                    finalRaiderId = await window.apiDB.addRaiderToSession(activeSession.id, cleanName, newClass || 'PALADIN', subgroup);
                }

                if (cleanNote) {
                    await window.apiDB.addRaiderNota(finalRaiderId, activeSession.id, cleanNote, 'LOW');
                }

                await window.apiDB.reemplazarRaider(
                    activeSession.id,
                    Number(raiderOutId),
                    Number(finalRaiderId),
                    cleanNote || `Reemplazo en vivo: ${cleanName}`,
                    subgroup
                );
            } else {
                finalRaiderId = await window.apiDB.addRaiderToSession(activeSession.id, cleanName, newClass || 'PALADIN', subgroup);
                if (cleanNote) {
                    await window.apiDB.addRaiderNota(finalRaiderId, activeSession.id, cleanNote, 'LOW');
                }
            }

            const updatedRaiders = await window.apiDB.getSessionRaiders(activeSession.id);
            setSessionRaiders(updatedRaiders);
        } catch (err) {
            alert('Error al aplicar el reemplazo en vivo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleMarkIncomplete() {
        if (!activeSession) return;

        try {
            setLoading(true);
            const endTime = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            await window.apiDB.markRaidSessionIncomplete(activeSession.id, endTime);
            setActiveSession(null);
            setSessionRaiders([]);
            setStatus('⚠ RAID INCOMPLETA');
        } catch (err) {
            alert('Error al marcar la raid como incompleta.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const [modalRaiderBanca, setModalRaiderBanca] = useState(null);

    return (
        <div className="flex-1 flex overflow-hidden gap-6">
            <div className="w-[30%] flex flex-col gap-4">
                <div className="bg-[#1a1b26] p-4 rounded-xl border border-[#414868] flex flex-col flex-1 gap-3 overflow-hidden">
                    <span className="text-[10px] font-bold text-[#41a6b5] uppercase tracking-wider">// CONFIG_SESION</span>

                    {!activeSession ? (
                        <SessionConfigForm
                            guilds={guilds}
                            selectedGuild={selectedGuild}
                            setSelectedGuild={setSelectedGuild}
                            raidType={raidType}
                            setRaidType={setRaidType}
                            raidNotes={raidNotes}
                            setRaidNotes={setRaidNotes}
                            jsonText={jsonText}
                            setJsonText={setJsonText}
                            handleProcesar={handleProcesar}
                            datosRaidTemporal={datosRaidTemporal}
                            handleStartSession={handleStartSession}
                            loading={loading}
                        />
                    ) : (
                        <ActiveManagementPanel
                            activeSession={activeSession}
                            handleEndSession={handleEndSession}
                            handleMarkIncomplete={handleMarkIncomplete}
                            loading={loading}
                        />
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden gap-4">
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center border-b border-[#414868] pb-2 mb-3">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-[#bb9af7]">MATRIZ RELACIONAL ACTIVA (GRUPOS 1 - 5)</h2>
                        <div className="text-[10px] text-[#565f89]">ESTADO: <span className="text-gray-500 italic">{status}</span></div>
                    </div>

                    <RaiderGrid
                        raiders={activeSession ? sessionRaiders : raiders}
                        activeSession={activeSession}
                        onReorderRaiders={handleReorderRaiders}
                        onLiveReplacement={handleLiveReplacement}
                        onSelectRaider={onSelectRaider}
                    />
                </div>

                {!activeSession && raiders.length > 0 && (
                    <div className="h-[220px] flex flex-col border border-dashed border-[#414868]/50 bg-[#16161e]/40 rounded-xl p-3 overflow-hidden">
                        <span className="text-[10px] font-bold text-[#e0af68] uppercase tracking-wider mb-2">
                            // POOL DE SETEO Y RESERVA ({raiders.filter(r => r.slot === null).length} JUGADORES)
                        </span>

                        <div
                            className="flex-1 overflow-y-auto grid grid-cols-5 gap-2.5 p-1.5 bg-[#1a1b26]/60 rounded-lg border border-[#24283b]"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const name = e.dataTransfer.getData('text/plain');
                                handleReorderRaiders(name, null);
                            }}
                        >
                            {raiders.filter(r => r.slot === null).map((raider) => (
                                <div
                                    key={raider.name}
                                    draggable
                                    onDragStart={(e) => e.dataTransfer.setData('text/plain', raider.name)}
                                    className="cursor-grab active:cursor-grabbing transition-transform duration-150 hover:scale-[1.02]"
                                >
                                    <RaiderCard
                                        raider={raider}
                                        onOpenNotes={setModalRaiderBanca}
                                        onSelectRaider={onSelectRaider}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}