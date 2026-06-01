import React, { useEffect, useMemo, useState } from 'react';
// Importamos tu componente RaiderGrid
import RaiderGrid from '../../shared/RaiderGrid';

function calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return '--:--';
    try {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        let startTotalMin = startHour * 60 + startMin;
        let endTotalMin = endHour * 60 + endMin;
        if (endTotalMin < startTotalMin) endTotalMin += 24 * 60;
        const diffMin = endTotalMin - startTotalMin;
        return `${Math.floor(diffMin / 60)}h ${diffMin % 60}m`;
    } catch {
        return '--:--';
    }
}

function getDurationInMinutes(startTime, endTime) {
    if (!startTime || !endTime) return null;
    try {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        let startTotalMin = startHour * 60 + startMin;
        let endTotalMin = endHour * 60 + endMin;
        if (endTotalMin < startTotalMin) endTotalMin += 24 * 60;
        return endTotalMin - startTotalMin;
    } catch {
        return null;
    }
}

function getStatusStyles(status) {
    const s = String(status || 'completed').toLowerCase();
    if (s === 'active') return 'bg-amber-500/10 text-amber-300 border border-amber-500/30';
    if (s === 'incomplete') return 'bg-rose-500/10 text-rose-200 border border-rose-500/30';
    return 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/30';
}

export default function GuildsTab() {
    const [guilds, setGuilds] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [selectedGuild, setSelectedGuild] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [minDuration, setMinDuration] = useState('');
    const [maxDuration, setMaxDuration] = useState('');
    const [raidType, setRaidType] = useState('all');
    const [newGuildName, setNewGuildName] = useState('');
    const [feedback, setFeedback] = useState({ type: 'idle', message: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [isCreatingGuild, setIsCreatingGuild] = useState(false);
    const [showFiltersPanel, setShowFiltersPanel] = useState(false);

    // ── ESTADOS PARA EL MODAL DE DETALLES DE RAID ───────────────────
    const [selectedSessionDetails, setSelectedSessionDetails] = useState(null);
    const [modalRaiders, setModalRaiders] = useState([]);
    const [isLoadingModal, setIsLoadingModal] = useState(false);

    useEffect(() => {
        loadGuilds();
        loadSessions();
    }, []);

    async function loadGuilds() {
        try {
            const data = await window.apiDB.getAllGuildsWithStatus();
            setGuilds(data);
        } catch (error) {
            console.error('Error loading guilds:', error);
        }
    }

    async function loadSessions() {
        setIsLoading(true);
        try {
            const data = await window.apiDB.getAllSessionsHistory();
            setSessions(data);
        } catch (error) {
            console.error('Error loading guild history:', error);
            setFeedback({ type: 'error', message: 'No se pudo cargar el historial de raids.' });
        } finally {
            setIsLoading(false);
        }
    }

    // ── MANEJADOR PARA ABRIR EL MODAL Y CARGAR SU ROSTER ──────────
    async function handleRowClick(session) {
        setSelectedSessionDetails(session);
        setIsLoadingModal(true);
        setModalRaiders([]);
        try {
            // Usamos el método real expuesto en tu preload: getSessionRaiders
            if (window.apiDB?.getSessionRaiders) {
                const raidersData = await window.apiDB.getSessionRaiders(session.id);
                setModalRaiders(raidersData);
            } else {
                console.warn('El método window.apiDB.getSessionRaiders no está disponible.');
            }
        } catch (error) {
            console.error('Error loading session raiders:', error);
        } finally {
            setIsLoadingModal(false);
        }
    }

    function handleCloseModal() {
        setSelectedSessionDetails(null);
        setModalRaiders([]);
    }

    const filteredSessions = useMemo(() => {
        return sessions.filter((session) => {
            const sessionDate = String(session.date || '').slice(0, 10);
            if (selectedGuild !== 'all' && String(session.guild_id) !== selectedGuild) return false;
            if (dateFrom && sessionDate < dateFrom) return false;
            if (dateTo && sessionDate > dateTo) return false;
            const dur = getDurationInMinutes(session.start_time, session.end_time);
            if (minDuration && (dur === null || dur < Number(minDuration))) return false;
            if (maxDuration && (dur === null || dur > Number(maxDuration))) return false;
            if (raidType !== 'all' && String(session.instance || '').toLowerCase() !== raidType.toLowerCase()) return false;
            return true;
        });
    }, [sessions, selectedGuild, dateFrom, dateTo, minDuration, maxDuration, raidType]);

    const activeFilters = useMemo(() => {
        const f = [];
        if (selectedGuild !== 'all') f.push(`Guild: ${guilds.find((g) => String(g.id) === selectedGuild)?.name || 'Seleccionada'}`);
        if (dateFrom) f.push(`Desde: ${dateFrom}`);
        if (dateTo) f.push(`Hasta: ${dateTo}`);
        if (minDuration) f.push(`Min: ${minDuration}min`);
        if (maxDuration) f.push(`Max: ${maxDuration}min`);
        if (raidType !== 'all') f.push(`Raid: ${raidType}`);
        return f;
    }, [selectedGuild, dateFrom, dateTo, minDuration, maxDuration, raidType, guilds]);

    async function handleCreateGuild(event) {
        event.preventDefault();
        const trimmedName = newGuildName.trim();
        if (!trimmedName) {
            setFeedback({ type: 'error', message: 'Ingresa el nombre de la guild para continuar.' });
            return;
        }
        setIsCreatingGuild(true);
        setFeedback({ type: 'idle', message: '' });
        try {
            const guild = await window.apiDB.createGuild(trimmedName);
            await loadGuilds();
            setSelectedGuild(String(guild.id));
            setNewGuildName('');
            setFeedback({ type: 'success', message: `Guild creada: ${guild.name}` });
        } catch (error) {
            console.error('Error creating guild:', error);
            setFeedback({ type: 'error', message: error?.message || 'No se pudo crear la guild.' });
        } finally {
            setIsCreatingGuild(false);
        }
    }

    function clearFilters() {
        setSelectedGuild('all');
        setRaidType('all');
        setDateFrom('');
        setDateTo('');
        setMinDuration('');
        setMaxDuration('');
    }

    return (
        <div className="flex-1 flex min-h-0 flex-col gap-2 overflow-hidden relative">

            {/* ── BARRA COMPACTA SIEMPRE VISIBLE ─────────────────────── */}
            <div className="flex-shrink-0 rounded-xl border border-tokyo-border bg-tokyo-main/80 px-4 py-2 shadow-lg">
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Título + conteo */}
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-tokyo-cyan">
                            // Historial
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-tokyo-border bg-[#11131d]/80 px-2.5 py-0.5 text-xs">
                            <span className="font-bold text-[#9ece6a]">{filteredSessions.length}</span>
                            <span className="text-tokyo-comment">/ {sessions.length} raids</span>
                        </span>
                    </div>

                    {/* Tags de filtros activos */}
                    <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0">
                        {activeFilters.length === 0 ? (
                            <span className="text-[10px] text-[#414868] italic">Sin filtros activos</span>
                        ) : (
                            activeFilters.map((f) => (
                                <span
                                    key={f}
                                    className="inline-flex items-center rounded-full border border-tokyo-cyan/30 bg-[#41a6b5]/10 px-2 py-0.5 text-[9px] font-semibold text-[#9ce4ff]"
                                >
                                    {f}
                                </span>
                            ))
                        )}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                        {activeFilters.length > 0 && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="rounded-full border border-[#f7768e]/40 bg-[#f7768e]/10 px-2.5 py-1 text-[10px] font-bold text-[#f7768e] transition hover:bg-[#f7768e]/20 hover:border-[#f7768e]/60 cursor-pointer"
                            >
                                ✕ Limpiar
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setShowFiltersPanel((v) => !v)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition cursor-pointer ${
                                showFiltersPanel
                                    ? 'border-tokyo-purple/60 bg-tokyo-purple/15 text-tokyo-purple'
                                    : 'border-tokyo-border bg-[#11131d] text-slate-300 hover:border-tokyo-purple/50 hover:text-tokyo-purple'
                            }`}
                        >
                            <span>{showFiltersPanel ? '▲' : '▼'}</span>
                            {showFiltersPanel ? 'Ocultar filtros' : 'Filtros'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── PANEL DESPLEGABLE DE FILTROS ───────────────────────── */}
            {showFiltersPanel && (
                <div className="flex-shrink-0 rounded-xl border border-tokyo-border/70 bg-tokyo-main/60 p-3">
                    <div className="grid grid-cols-1 xl:grid-cols-[1fr,0.65fr] gap-3">
                        {/* Filtros avanzados */}
                        <div className="rounded-xl border border-[#2a3145] bg-gradient-to-br from-[#161a27] via-[#1a1f31] to-[#222a3f] p-3">
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-tokyo-cyan mb-3">Filtros avanzados</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                <label className="flex flex-col gap-1 text-[9px] font-bold uppercase tracking-[0.12em] text-tokyo-comment">
                                    <span>Guild</span>
                                    <select
                                        value={selectedGuild}
                                        onChange={(e) => setSelectedGuild(e.target.value)}
                                        className="rounded-lg border border-[#313b54] bg-[#1a1f31] px-2 py-1.5 text-xs text-[#e8eeff] outline-none transition focus:border-[#9ece6a]"
                                    >
                                        <option value="all">Todas</option>
                                        {guilds.map((g) => (
                                            <option key={g.id} value={String(g.id)}>{g.name}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="flex flex-col gap-1 text-[9px] font-bold uppercase tracking-[0.12em] text-tokyo-comment">
                                    <span>Tipo de Raid</span>
                                    <select
                                        value={raidType}
                                        onChange={(e) => setRaidType(e.target.value)}
                                        className="rounded-lg border border-[#313b54] bg-[#1a1f31] px-2 py-1.5 text-xs text-[#e8eeff] outline-none transition focus:border-[#9ece6a]"
                                    >
                                        <option value="all">Todas</option>
                                        <option value="ICC">ICC</option>
                                        <option value="RS">RS</option>
                                        <option value="TOC">TOC</option>
                                        <option value="ULDUAR">ULDUAR</option>
                                        <option value="NAXX">NAXX</option>
                                        <option value="OTHER">OTHER</option>
                                    </select>
                                </label>

                                <label className="flex flex-col gap-1 text-[9px] font-bold uppercase tracking-[0.12em] text-tokyo-comment">
                                    <span>Desde</span>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="rounded-lg border border-[#313b54] bg-[#1a1f31] px-2 py-1.5 text-xs text-[#e8eeff] outline-none transition focus:border-tokyo-cyan"
                                    />
                                </label>

                                <label className="flex flex-col gap-1 text-[9px] font-bold uppercase tracking-[0.12em] text-tokyo-comment">
                                    <span>Hasta</span>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="rounded-lg border border-[#313b54] bg-[#1a1f31] px-2 py-1.5 text-xs text-[#e8eeff] outline-none transition focus:border-tokyo-cyan"
                                    />
                                </label>

                                <label className="flex flex-col gap-1 text-[9px] font-bold uppercase tracking-[0.12em] text-tokyo-comment">
                                    <span>Dur. mín. (min)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={minDuration}
                                        onChange={(e) => setMinDuration(e.target.value)}
                                        placeholder="ej. 60"
                                        className="rounded-lg border border-[#313b54] bg-[#1a1f31] px-2 py-1.5 text-xs text-[#e8eeff] outline-none transition focus:border-[#9ece6a]"
                                    />
                                </label>

                                <label className="flex flex-col gap-1 text-[9px] font-bold uppercase tracking-[0.12em] text-tokyo-comment">
                                    <span>Dur. máx. (min)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={maxDuration}
                                        onChange={(e) => setMaxDuration(e.target.value)}
                                        placeholder="ej. 180"
                                        className="rounded-lg border border-[#313b54] bg-[#1a1f31] px-2 py-1.5 text-xs text-[#e8eeff] outline-none transition focus:border-[#9ece6a]"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Agregar Guild */}
                        <div className="rounded-xl border border-[#2a3145] bg-gradient-to-br from-[#151924] via-[#1b2030] to-[#232b43] p-3">
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-tokyo-cyan mb-1">Nueva guild</p>
                            <p className="text-[10px] text-tokyo-comment mb-3">Añade una hermandad para raids futuros.</p>
                            <form onSubmit={handleCreateGuild} className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    value={newGuildName}
                                    onChange={(e) => setNewGuildName(e.target.value)}
                                    placeholder="Ej. Frostmourne"
                                    className="w-full rounded-lg border border-[#313b54] bg-[#11131d] px-2.5 py-1.5 text-xs text-[#e8eeff] outline-none transition focus:border-[#9ece6a]"
                                />
                                <button
                                    type="submit"
                                    disabled={isCreatingGuild}
                                    className="w-full rounded-lg bg-gradient-to-r from-[#9ece6a] to-[#b9e48d] px-2.5 py-1.5 text-xs font-bold text-[#10131c] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                                >
                                    {isCreatingGuild ? 'Guardando...' : '+ Agregar guild'}
                                </button>
                            </form>
                            {feedback.message && (
                                <p className={`mt-2 rounded-lg border px-2.5 py-1.5 text-[10px] ${
                                    feedback.type === 'error'
                                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                }`}>
                                    {feedback.message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── TABLA DE RESULTADOS ─────────────────────────────────── */}
            <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-tokyo-border bg-tokyo-main/60">
                <div className="h-full overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 z-10 bg-tokyo-main">
                            <tr className="border-b border-tokyo-border text-tokyo-comment uppercase tracking-wider text-[9px]">
                                <th className="py-2.5 font-bold pl-4 pr-2">ID</th>
                                <th className="py-2.5 font-bold pr-2">Guild</th>
                                <th className="py-2.5 font-bold pr-2">Instancia</th>
                                <th className="py-2.5 font-bold pr-2">Fecha</th>
                                <th className="py-2.5 font-bold pr-2">Notas</th>
                                <th className="py-2.5 font-bold pr-2">Inicio</th>
                                <th className="py-2.5 font-bold pr-2">Fin</th>
                                <th className="py-2.5 font-bold pr-2">Duración</th>
                                <th className="py-2.5 font-bold pr-4">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#414868]/20">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="9" className="py-20 text-center text-tokyo-comment text-xs">
                                        Cargando historial...
                                    </td>
                                </tr>
                            ) : filteredSessions.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="py-20 text-center text-tokyo-comment text-xs">
                                        No hay raids que coincidan con los filtros actuales.
                                    </td>
                                </tr>
                            ) : (
                                filteredSessions.map((session) => (
                                    <tr 
                                        key={session.id} 
                                        onClick={() => handleRowClick(session)}
                                        className="hover:bg-[#1f2335]/70 transition-colors cursor-pointer group"
                                    >
                                        <td className="py-2.5 pl-4 pr-2 font-bold text-tokyo-cyan font-mono text-[10px] group-hover:text-[#7aa2f7]">
                                            #{session.id}
                                        </td>
                                        <td className="py-2.5 pr-2 text-slate-300">{session.guild_name || '--'}</td>
                                        <td className="py-2.5 pr-2">
                                            <span className="inline-flex items-center rounded border border-tokyo-purple/30 bg-tokyo-purple/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-tokyo-purple">
                                                {session.instance || '--'}
                                            </span>
                                        </td>
                                        <td className="py-2.5 pr-2 text-slate-300 font-mono text-[10px]">{String(session.date || '--').slice(0, 10)}</td>
                                        <td className="py-2.5 pr-2 text-tokyo-comment text-[10px] max-w-[140px] truncate" title={session.notes}>{session.notes || '--'}</td>
                                        <td className="py-2.5 pr-2 text-slate-300 font-mono text-[10px]">{session.start_time || '--:--'}</td>
                                        <td className="py-2.5 pr-2 text-slate-300 font-mono text-[10px]">{session.end_time || '--:--'}</td>
                                        <td className="py-2.5 pr-2 text-[#9ece6a] font-bold font-mono text-[10px]">{calculateDuration(session.start_time, session.end_time)}</td>
                                        <td className="py-2.5 pr-4">
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${getStatusStyles(session.status)}`}>
                                                {session.status || 'completed'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── MODAL INYECTADO: DETALLES DEL ROSTER DE LA RAID ───────── */}
            {selectedSessionDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111216]/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-6xl rounded-2xl border border-tokyo-border bg-tokyo-main shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        
                        {/* Header del Modal */}
                        <div className="flex items-center justify-between border-b border-tokyo-border bg-[#11131d] px-6 py-4">
                            <div className="flex items-center gap-3">
                                <span className="rounded border border-tokyo-purple/40 bg-tokyo-purple/10 px-2 py-0.5 text-xs font-bold uppercase text-tokyo-purple">
                                    {selectedSessionDetails.instance || 'Raid'}
                                </span>
                                <div>
                                    <h3 className="text-sm font-bold text-[#e8eeff]">
                                        Roster del Historial — {selectedSessionDetails.guild_name || 'Sin Guild'}
                                    </h3>
                                    <p className="text-[11px] text-tokyo-comment font-mono mt-0.5">
                                        ID: #{selectedSessionDetails.id} | Fecha: {String(selectedSessionDetails.date || '').slice(0, 10)} | Duración: {calculateDuration(selectedSessionDetails.start_time, selectedSessionDetails.end_time)}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="rounded-lg border border-tokyo-border bg-tokyo-main p-1.5 text-xs text-slate-300 hover:text-[#f7768e] hover:border-[#f7768e]/40 transition cursor-pointer"
                            >
                                ✕ Cerrar
                            </button>
                        </div>

                        {/* Cuerpo del Modal */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-[#1a1b26] to-[#161722]">
                            {isLoadingModal ? (
                                <div className="py-32 text-center text-tokyo-comment text-xs font-mono uppercase tracking-widest animate-pulse">
                                    [ Cargando Roster desde la Base de Datos... ]
                                </div>
                            ) : (
                                <RaiderGrid 
                                    raiders={modalRaiders} 
                                    activeSession={null} // Pasamos null porque es historial, deshabilita drag-and-drop y reemplazos automáticos
                                    onReorderRaiders={null}
                                    onLiveReplacement={null}
                                    onSelectRaider={(raider) => console.log('Raider consultado:', raider)}
                                    onNoteSaved={async () => {
                                        // Recarga los integrantes si añades notas en el modal histórico
                                        if (window.apiDB?.getRaidersBySession) {
                                            const r = await window.apiDB.getRaidersBySession(selectedSessionDetails.id);
                                            setModalRaiders(r);
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}