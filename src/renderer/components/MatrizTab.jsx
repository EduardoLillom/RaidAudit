import React, { useState, useEffect } from 'react';
import RaiderGrid from './RaiderGrid';
import SessionControl from './SessionControl';

const classColors = {
    PALADIN: 'bg-[#f58cba]/5 border-t-[#f58cba] text-[#f58cba]',
    MAGE: 'bg-[#3fc7eb]/5 border-t-[#3fc7eb] text-[#3fc7eb]',
    WARRIOR: 'bg-[#c69b6d]/5 border-t-[#c69b6d] text-[#c69b6d]',
    ROGUE: 'bg-[#fff468]/5 border-t-[#fff468] text-[#fff468]',
    PRIEST: 'bg-[#ffffff]/5 border-t-[#ffffff] text-[#ffffff]',
    DRUID: 'bg-[#ff7d0a]/5 border-t-[#ff7d0a] text-[#ff7d0a]',
    HUNTER: 'bg-[#abd473]/5 border-t-[#abd473] text-[#abd473]',
    SHAMAN: 'bg-[#0070de]/5 border-t-[#0070de] text-[#0070de]',
    WARLOCK: 'bg-[#9482c9]/5 border-t-[#9482c9] text-[#9482c9]',
    DEATHKNIGHT: 'bg-[#c41f3b]/5 border-t-[#c41f3b] text-[#c41f3b]'
};

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
        if (!selectedGuild || !sessionName || !jsonText.trim()) {
            alert('Asigna una Guild, un nombre de sesión y rellena el log JSON antes de analizar.');
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
            await window.apiDB.removeRaiderFromSession(activeSession.id, raiderId);
            const raiders = await window.apiDB.getSessionRaiders(activeSession.id);
            setSessionRaiders(raiders);
        } catch (err) {
            alert('Error al remover el raider de la sesión.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const renderActiveManagement = () => (
        <div className="bg-[#1f2335]/50 p-4 rounded-xl border border-[#414868] flex flex-col gap-4 flex-1 overflow-y-auto">
            <SessionControl session={activeSession} onEnd={handleEndSession} />

            <div className="bg-[#24283b] p-4 rounded-xl border border-[#414868]">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <div className="text-[10px] uppercase text-[#565f89] tracking-wider">Gestión de reemplazos</div>
                        <div className="text-[9px] text-[#9ece6a]">Agrega o elimina raiders mientras la raid está activa.</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <div className="grid grid-cols-3 gap-2">
                        <input
                            type="text"
                            value={newRaiderName}
                            onChange={(e) => setNewRaiderName(e.target.value)}
                            placeholder="Nombre"
                            className="bg-[#1a1b26] border border-[#414868] text-xs text-white p-2 rounded outline-none"
                        />
                        <select
                            value={newRaiderClass}
                            onChange={(e) => setNewRaiderClass(e.target.value)}
                            className="bg-[#1a1b26] border border-[#414868] text-xs text-[#9ece6a] p-2 rounded outline-none"
                        >
                            {Object.keys(classColors).map(cls => (
                                <option key={cls} value={cls}>{cls}</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={newRaiderSubgroup}
                            onChange={(e) => setNewRaiderSubgroup(e.target.value)}
                            className="bg-[#1a1b26] border border-[#414868] text-xs text-white p-2 rounded outline-none"
                            placeholder="Grup"
                        />
                    </div>
                    <button
                        onClick={handleAddRaider}
                        disabled={loading || !newRaiderName.trim()}
                        className="bg-[#9ece6a] text-[#1a1b26] font-extrabold py-2 rounded-lg text-xs hover:bg-[#73daca] transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                        {loading ? 'AGREGANDO...' : 'AGREGAR RAIDER A SESIÓN'}
                    </button>
                </div>

                <div className="mt-4 space-y-2">
                    <div className="text-[10px] uppercase text-[#565f89] tracking-wider mb-2">Raiders en sesión</div>
                    {sessionRaiders.length === 0 ? (
                        <div className="text-[10px] text-[#565f89] italic">[ No hay raiders registrados ]</div>
                    ) : (
                        <div className="grid gap-2 max-h-[160px] overflow-y-auto pr-1">
                            {sessionRaiders.map(r => (
                                <div key={r.raider_id} className="bg-[#1a1b26] rounded-lg border border-[#414868] p-2 flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-xs font-bold text-white">{r.name}</div>
                                        <div className="text-[9px] text-[#9ece6a]">{r.class} - G{r.subgroup}</div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveRaider(r.raider_id)}
                                        disabled={loading}
                                        className="bg-[#c41f3b] text-white text-[9px] uppercase px-2 py-1 rounded hover:bg-[#a81a2d] transition-all"
                                    >X</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex-1 flex overflow-hidden gap-6">
            {/* PANEL IZQUIERDO DE CONFIGURACIÓN / GESTIÓN */}
            <div className="w-[30%] flex flex-col gap-4">
                <div className="bg-[#1a1b26] p-4 rounded-xl border border-[#414868] flex flex-col flex-1 gap-3 overflow-hidden">
                    <span className="text-[10px] font-bold text-[#41a6b5] uppercase tracking-wider">// CONFIG_SESION</span>
                    
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-[#565f89] font-bold">HERMANDAD:</label>
                        <select 
                            value={selectedGuild}
                            onChange={(e) => setSelectedGuild(e.target.value)}
                            className="bg-[#24283b] border border-[#414868] text-xs text-[#9ece6a] p-2 rounded outline-none cursor-pointer"
                            disabled={Boolean(activeSession)}
                        >
                            <option value="">-- Seleccionar Guild --</option>
                            {guilds.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-[#565f89] font-bold">IDENTIFICADOR DE RAID:</label>
                        <input 
                            type="text" 
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                            placeholder="Ej: ICC 25 Core Principal" 
                            className="bg-[#24283b] border border-[#414868] text-xs text-white p-2 rounded outline-none placeholder-[#565f89]"
                            disabled={Boolean(activeSession)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-[#565f89] font-bold">TIPO DE RAID:</label>
                            <select
                                value={raidType}
                                onChange={(e) => setRaidType(e.target.value)}
                                className="bg-[#24283b] border border-[#414868] text-xs text-[#9ece6a] p-2 rounded outline-none"
                                disabled={Boolean(activeSession)}
                            >
                                <option value="ICC">ICC</option>
                                <option value="RS">RS</option>
                                <option value="TOC">TOC</option>
                                <option value="ULDUAR">ULDUAR</option>
                                <option value="NAXX">NAXX</option>
                                <option value="OTHER">OTHER</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-[#565f89] font-bold">NOTAS DE SESIÓN:</label>
                            <input
                                type="text"
                                value={raidNotes}
                                onChange={(e) => setRaidNotes(e.target.value)}
                                placeholder="Ej: 8/12, Dynamic Progress"
                                className="bg-[#24283b] border border-[#414868] text-xs text-white p-2 rounded outline-none placeholder-[#565f89]"
                                disabled={Boolean(activeSession)}
                            />
                        </div>
                    </div>

                    {/* RENDERIZADO CONDICIONAL: SI NO HAY SESIÓN, MUESTRA EL CUADRO DE TEXTO JSON ORIGINAL */}
                    {!activeSession ? (
                        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                            <div className="flex flex-col flex-1 gap-1 overflow-hidden">
                                <label className="text-[9px] text-[#565f89] font-bold">BLOQUE LOG JSON:</label>
                                <textarea 
                                    value={jsonText}
                                    onChange={(e) => setJsonText(e.target.value)}
                                    className="w-full flex-1 p-3 bg-[#24283b] border border-[#414868] rounded-lg text-xs text-[#9ece6a] outline-none resize-none focus:border-[#41a6b5] font-mono" 
                                    placeholder='[&#10;  { "name": "Mograine", "class": "PALADIN", "subgroup": 1 }&#10;]'
                                ></textarea>
                            </div>

                            <div className="flex flex-col gap-2 mt-2">
                                <button 
                                    onClick={handleProcesar}
                                    className="w-full bg-[#bb9af7] text-[#1a1b26] font-extrabold py-2 rounded-lg text-xs hover:bg-[#c0caf5] transition-all shadow-md cursor-pointer"
                                >
                                    ANALYZE_JSON_ROSTER()
                                </button>

                                {datosRaidTemporal && (
                                    <button 
                                        onClick={handleStartSession}
                                        disabled={loading}
                                        className="w-full bg-[#9ece6a] text-[#1a1b26] font-extrabold py-2.5 rounded-lg text-xs hover:bg-[#73daca] transition-all shadow-md cursor-pointer uppercase tracking-wider disabled:opacity-50"
                                    >
                                        {loading ? 'INICIANDO SESIÓN...' : '==> EXEC_COMMIT_SQLITE() <=='}
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* SI LA SESIÓN SÍ ESTÁ ACTIVA, MUESTRA EL PANEL DE TIEMPOS Y REEMPLAZOS */
                        renderActiveManagement()
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