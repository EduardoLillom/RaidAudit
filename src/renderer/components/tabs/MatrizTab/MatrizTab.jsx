import React, { useState, useEffect } from 'react';
import RaiderGrid from '../../shared/RaiderGrid';
import SessionConfigForm from './SessionConfigForm';
import ActiveManagementPanel from './ActiveManagementPanel';
import RaiderCard from '../../shared/RaiderCard'; // Asegúrate de que la ruta sea correcta

export default function MatrizTab() {
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

    async function handleStartSession() {
        let datosAEnviar = datosRaidTemporal;

        // CASO A: Si el usuario NO usó el botón de analizar y guardó directo desde el texto JSON
        if (!datosAEnviar) {
            try {
                const raidersParsed = JSON.parse(jsonText);
                
                // Estructuramos igual, asignando slots iniciales automáticos del 0 al 24
                const formatted = raidersParsed.map((r, idx) => ({ 
                    ...r, 
                    slot: idx < 25 ? idx : null 
                }));

                // 🛠️ FILTRO: Solo dejamos los que tengan un slot numérico asignado (0 al 24)
                const soloTitulares = formatted.filter(raider => raider.slot !== null);

                datosAEnviar = {
                    guildId: Number(selectedGuild),
                    instance: raidType,
                    notes: raidNotes,
                    currentTime: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                    raiders: soloTitulares // 👈 Enviamos solo el roster limpio de 25 o menos
                };
            } catch (error) {
                alert("El formato del JSON es inválido. Revísalo bien antes de enviarlo.");
                console.error(error);
                return;
            }
        } else {
            // CASO B: Si el usuario SÍ analizó el JSON y movió gente usando el Drag and Drop
            // 🛠️ FILTRO: Tomamos los raiders actuales del estado y removemos a cualquiera cuyo slot sea 'null' (banca)
            const soloTitulares = raiders.filter(raider => raider.slot !== null);

            datosAEnviar = {
                ...datosRaidTemporal,
                raiders: soloTitulares // 👈 Reemplazamos la lista temporal por la lista filtrada de puros titulares
            };
        }

        // Bloque de inserción final en SQLite (Permanece igual, pero ahora lleva la lista limpia)
        try {
            setLoading(true);
            await window.apiDB.insertRaidSession(datosAEnviar);
            
            setStatus('✓ SESIÓN INICIADA');
            setJsonText('');
            setRaiders([]);
            setDatosRaidTemporal(null);
            setRaidType('ICC');
            setRaidNotes('');
            await loadActiveSession(); // Carga la sesión iniciada con los raiders limpios
        } catch (err) {
            alert('Error al iniciar la sesión en la base de datos local SQLite.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleProcesar() {
        setLoading(true);

        if (!selectedGuild || selectedGuild === "" || !jsonText.trim()) {
            alert('Asigna una Guild y rellena el log JSON antes de analizar.');
            setLoading(false);
            return;
        }

        try {
            let raidersData = JSON.parse(jsonText);
            
            // 1. 🛠️ NUEVO: Ordenamos alfabéticamente por nombre antes de asignar slots
            raidersData.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

            const processedRaiders = [];
            
            // Contadores para controlar los espacios libres de cada subgrupo (máximo 5 por grupo)
            const groupCounters = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            
            for (let r of raidersData) {
                const dbStatus = await window.apiDB.getRaiderStatus(r.name);
                
                const g = Number(r.subgroup);
                let assignedSlot = null;

                // Si pertenece a un grupo del 1 al 5 y el grupo no está lleno (más de 5 personas)
                if (g >= 1 && g <= 5 && groupCounters[g] < 5) {
                    // Al estar la lista ordenada por nombre, el contador asegura que se asignen
                    // secuencialmente dentro del rango de su grupo (ej: G1 ocupa del slot 0 al 4)
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
                    slot: assignedSlot // Si no entra en el top 5 o es grupo > 5, va a la banca (null)
                });
            }

            setRaiders(processedRaiders);
            setDatosRaidTemporal({
                guildId: Number(selectedGuild),
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

    // 🛠️ NUEVA FUNCIÓN: Intercambia posiciones basándose en el nombre único del personaje
    const handleReorderRaiders = (raiderName, targetSlot) => {
        setRaiders(prevRaiders => {
            const updated = prevRaiders.map(raider => {
                // El que estamos arrastrando toma el slot destino (puede ser número o null)
                if (raider.name === raiderName) {
                    return { ...raider, slot: targetSlot };
                }
                // Si el slot destino ya tenía dueño, mandamos al dueño anterior a la banca (null)
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

    // Modal de notas rápido para el pool inferior de banca
    const [modalRaiderBanca, setModalRaiderBanca] = useState(null);

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

            {/* PANEL DER_ MATRIZ RELACIONAL DIVIDIDO (RAID ARRIBA / SETEO ABAJO) */}
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
                    />
                </div>

                {/* POOL INFERIOR: BANCA Y SETEO (Solo se muestra antes de iniciar la sesión) */}
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
                                const name = e.dataTransfer.getData("text/plain");
                                handleReorderRaiders(name, null); // Mover de vuelta a la banca
                            }}
                        >
                            {raiders.filter(r => r.slot === null).map((raider) => (
                                <div
                                    key={raider.name}
                                    draggable
                                    onDragStart={(e) => e.dataTransfer.setData("text/plain", raider.name)}
                                    className="cursor-grab active:cursor-grabbing transition-transform duration-150 hover:scale-[1.02]"
                                >
                                    <RaiderCard raider={raider} onOpenNotes={setModalRaiderBanca} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}