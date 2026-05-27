import React from 'react';

export default function SessionConfigForm({
    guilds,
    selectedGuild,
    setSelectedGuild,
    raidType,
    setRaidType,
    raidNotes,
    setRaidNotes,
    jsonText,
    setJsonText,
    handleProcesar,
    datosRaidTemporal,
    handleStartSession,
    loading
}) {
    // Validaciones de estado para los botones
    const canStart = Boolean(datosRaidTemporal) && Boolean(selectedGuild);
    const canAnalyze = Boolean(jsonText && jsonText.trim());

    return (
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
            <div className="grid grid-cols-1 gap-2">
                <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[#565f89] font-bold uppercase">Hermandad</label>
                    <select
                        value={selectedGuild}
                        onChange={(e) => setSelectedGuild(e.target.value)}
                        className="bg-[#24283b] border border-[#414868] text-xs text-[#9ece6a] p-2 rounded outline-none cursor-pointer focus:border-[#9ece6a]"
                    >
                        <option value="">-- Seleccionar guild --</option>
                        {guilds?.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-[#565f89] font-bold uppercase">Tipo de raid</label>
                        <select
                            value={raidType}
                            onChange={(e) => setRaidType(e.target.value)}
                            className="bg-[#24283b] border border-[#414868] text-xs text-[#9ece6a] p-2 rounded outline-none focus:border-[#9ece6a]"
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
                        <label className="text-[9px] text-[#565f89] font-bold uppercase">Notas de sesión</label>
                        <input
                            type="text"
                            value={raidNotes}
                            onChange={(e) => setRaidNotes(e.target.value)}
                            className="bg-[#24283b] border border-[#414868] text-xs text-white p-2 rounded outline-none placeholder-[#565f89] focus:border-[#bb9af7]"
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col flex-1 gap-1 overflow-hidden">
                <label className="text-[9px] text-[#565f89] font-bold uppercase">JSON del roster</label>
                <textarea
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    className="w-full flex-1 p-3 bg-[#24283b] border border-[#414868] rounded-lg text-xs text-[#9ece6a] outline-none resize-none focus:border-[#41a6b5] font-mono"
                    placeholder='[&#10;  { "name": "Mograine", "class": "PALADIN", "subgroup": 1 }&#10]'
                ></textarea>
            </div>

            <div className="flex flex-col gap-2 mt-1">
                <button
                    onClick={handleProcesar}
                    disabled={loading || !canAnalyze}
                    className="w-full bg-[#bb9af7] text-[#1a1b26] font-extrabold py-2 rounded-lg text-xs hover:bg-[#c0caf5] transition-all shadow-md cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    {loading ? 'ANALIZANDO...' : 'ANALIZAR ROSTER'}
                </button>

                <button
                    onClick={handleStartSession}
                    disabled={loading || !canStart}
                    className="w-full bg-[#9ece6a] text-[#1a1b26] font-extrabold py-2.5 rounded-lg text-xs hover:bg-[#73daca] transition-all shadow-md cursor-pointer uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#9ece6a]"
                >
                    {loading ? 'INICIANDO SESIÓN...' : 'CONFIRMAR SESIÓN'}
                </button>
            </div>
        </div>
    );
}