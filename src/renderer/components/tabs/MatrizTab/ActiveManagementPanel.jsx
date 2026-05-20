import React from 'react';
import SessionControl from '../../shared/SessionControl';

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

export default function ActiveManagementPanel({
    activeSession,
    handleEndSession,
    newRaiderName,
    setNewRaiderName,
    newRaiderClass,
    setNewRaiderClass,
    newRaiderSubgroup,
    setNewRaiderSubgroup,
    handleAddRaider,
    sessionRaiders,
    handleRemoveRaider,
    loading
}) {
    return (
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
                                        <div className="text-[9px] text-[#9ece6a]">
                                            {r.class} - G{r.subgroup}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveRaider(r.raider_id)}
                                        disabled={loading}
                                        className="bg-[#c41f3b] text-white text-[9px] uppercase px-2 py-1 rounded hover:bg-[#a81a2d] transition-all"
                                    >
                                        X
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}