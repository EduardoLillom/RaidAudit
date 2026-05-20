import React, { useState, useEffect } from 'react';
import RaiderGrid from '../../shared/RaiderGrid';
import SessionConfigForm from './SessionConfigForm';
import ActiveManagementPanel from './ActiveManagementPanel';

export default function MatrizTab() {
    const [guilds, setGuilds] = useState([]);
    const [selectedGuild, setSelectedGuild] = useState('');
    const [sessionName, setSessionName] = useState('');
    const [raidType, setRaidType] = useState('ICC');
    const [raidNotes, setRaidNotes] = useState('');
    const [jsonText, setJsonText] = useState('');
    const [raiders, setRaiders] = useState([]);
    const [status, setStatus] = useState('WAITING_FOR_LOG (AUDIT_ACTIVE)');
    const [datosRaidTemporal, setDatosRaidTemporal] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeSession, setActiveSession] = useState(null);
    const [sessionRaiders, setSessionRaiders] = useState([]);
    const [newRaiderName, setNewRaiderName] = useState('');
    const [newRaiderClass, setNewRaiderClass] = useState('PALADIN');
    const [newRaiderSubgroup, setNewRaiderSubgroup] = useState(1);

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

    async function handleProcesar() {

        setLoading(true);

        if (!selectedGuild || !sessionName || !jsonText.trim()) {
            alert('Asigna una Guild, un nombre de sesión y rellena el log JSON antes de analizar.');
            setLoading(false);
            return;
        }

        try {
            const raidersData = JSON.parse(jsonText);
            
            for (let r of raidersData) {
                const status = await window.apiDB.getRaiderStatus(r.name);
                r.lows = status.lows;
                r.mediums = status.mediums;
                r.highs = status.highs;
                r.gravedad_total = status.gravity_total;
            }

            setRaiders(raidersData);
            setDatosRaidTemporal({
                guildId: Number(selectedGuild),
                sessionName: sessionName,
                instance: raidType,
                notes: raidNotes,
                currentTime: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                raiders: raidersData
            });
            setStatus('◈ PREVISUALIZANDO_ROSTER (AUDITORÍA DE FALTAS ACTIVA)');
        } catch (err) {
            alert('Error crítico al leer el JSON: Asegúrate de que el formato sea correcto.');
            console.error(err);
        }
    }

    async function handleStartSession() {
        if (!datosRaidTemporal) return;

        try {
            setLoading(true);
            await window.apiDB.insertRaidSession(datosRaidTemporal);
            setStatus('✓ SESIÓN INICIADA');
            setJsonText('');
            setRaiders([]);
            setDatosRaidTemporal(null);
            setSessionName('');
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

    async function handleEndSession(sessionId) {
        try {
            setLoading(true);
            const endTime = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            await window.apiDB.endRaidSession(sessionId, endTime);
            setActiveSession(null);
            setSessionRaiders([]);
            setStatus('SESSION_ENDED');
        } catch (err) {
            alert('Error al terminar la sesión activa.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddRaider() {
        if (!activeSession || !newRaiderName.trim()) return;

        try {
            setLoading(true);
            await window.apiDB.addRaiderToSession(activeSession.id, newRaiderName.trim(), newRaiderClass, Number(newRaiderSubgroup));
            const raiders = await window.apiDB.getSessionRaiders(activeSession.id);
            setSessionRaiders(raiders);
            setNewRaiderName('');
        } catch (err) {
            alert('Error al agregar el raider a la sesión.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleRemoveRaider(raiderId) {
        if (!activeSession) return;

        try {
            setLoading(true);
            await window.apiDB.removeRaiderFromSession(activeSession.id, raderId);
            const raiders = await window.apiDB.getSessionRaiders(activeSession.id);
            setSessionRaiders(raiders);
        } catch (err) {
            alert('Error al remover el raider de la sesión.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex-1 flex overflow-hidden gap-6">
            {/* PANEL IZQUIERDO DE CONFIGURACIÓN / GESTIÓN */}
            <div className="w-[30%] flex flex-col gap-4">
                <div className="bg-[#1a1b26] p-4 rounded-xl border border-[#414868] flex flex-col flex-1 gap-3 overflow-hidden">
                    <span className="text-[10px] font-bold text-[#41a6b5] uppercase tracking-wider">// CONFIG_SESION</span>
                    
                    {!activeSession ? (
                        <SessionConfigForm 
                            guilds={guilds}
                            selectedGuild={selectedGuild}
                            setSelectedGuild={setSelectedGuild}
                            sessionName={sessionName}
                            setSessionName={setSessionName}
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
                            newRaiderName={newRaiderName}
                            setNewRaiderName={setNewRaiderName}
                            newRaiderClass={newRaiderClass}
                            setNewRaiderClass={setNewRaiderClass}
                            newRaiderSubgroup={newRaiderSubgroup}
                            setNewRaiderSubgroup={setNewRaiderSubgroup}
                            handleAddRaider={handleAddRaider}
                            sessionRaiders={sessionRaiders}
                            handleRemoveRaider={handleRemoveRaider}
                            loading={loading}
                        />
                    )}
                </div>
            </div>

            {/* PANEL DER_ MATRIZ RELACIONAL */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center border-b border-[#414868] pb-2 mb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#bb9af7]">MATRIZ RELACIONAL ACTIVA</h2>
                    <div className="text-[10px] text-[#565f89]">ESTADO: <span className="text-gray-500 italic">{status}</span></div>
                </div>
                
                <RaiderGrid raiders={activeSession ? sessionRaiders : raiders} />
            </div>
        </div>
    );
}