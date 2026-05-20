import React from 'react';

export default function SessionConfigForm({
    guilds,
    selectedGuild,
    setSelectedGuild,
    sessionName,
    setSessionName,
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
    return (
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
            <div className="flex flex-col gap-1">
                <label className="text-[9px] text-[#565f89] font-bold">HERMANDAD:</label>
                <select 
                    value={selectedGuild}
                    onChange={(e) => setSelectedGuild(e.target.value)}
                    className="bg-[#24283b] border border-[#414868] text-xs text-[#9ece6a] p-2 rounded outline-none cursor-pointer"
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
                />
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[#565f89] font-bold">TIPO DE RAID:</label>
                    <select
                        value={raidType}
                        onChange={(e) => setRaidType(e.target.value)}
                        className="bg-[#24283b] border border-[#414868] text-xs text-[#9ece6a] p-2 rounded outline-none"
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
                    />
                </div>
            </div>

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
    );
}