import React from 'react';

export default function SidebarPlayers({
    searchTerm,
    setSearchTerm,
    raiders,
    selectedRaider,
    loadingList,
    onSearch,
    onSelectRaider
}) {
    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            onSearch(searchTerm);
        }
    }

    return (
        <div id="list-players" className="w-1/4 border-r border-[#414868]/40 pr-4 flex flex-col gap-3 h-full">
            <div className="bg-[#1a1b26]/40 rounded-xl border border-[#414868] p-3">
                <div className="text-[10px] uppercase text-[#565f89] font-bold tracking-wider">
                    Índice de expedientes
                </div>
                <div className="mt-2 text-[10px] text-[#a9b1d6]">
                    {selectedRaider
                        ? `Seleccionado: ${selectedRaider.nickname}`
                        : 'Elige un personaje para ver su historial completo.'}
                </div>
                <div className="mt-2 flex gap-1.5">
                    <input
                        type="text"
                        placeholder="Buscar por nombre"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-[#1f2335] border border-[#414868] rounded px-3 py-2 text-xs text-[#a9b1d6] placeholder-[#565f89] focus:outline-none focus:border-[#bb9af7] transition-all"
                    />
                    <button
                        onClick={() => onSearch(searchTerm)}
                        disabled={loadingList}
                        className="bg-[#24283b] hover:bg-[#41a6b5]/20 border border-[#414868] hover:border-[#41a6b5] rounded px-3 py-2 text-[10px] text-[#41a6b5] font-bold uppercase tracking-wider transition-all disabled:opacity-50 min-w-[70px]"
                    >
                        {loadingList ? '...' : 'Buscar'}
                    </button>
                </div>
                <div className="mt-2 text-[10px] text-[#565f89]">
                    {loadingList ? 'Buscando registros...' : `${raiders.length} resultados visibles`}
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
                {raiders.length > 0 ? (
                    raiders.map(r => (
                        <div
                            key={r.raider_id}
                            onClick={() => onSelectRaider(r)}
                            className={`p-3 rounded border cursor-pointer transition-all ${
                                selectedRaider?.raider_id === r.raider_id
                                    ? 'bg-[#1a1b26] border-[#41a6b5] shadow-sm'
                                    : 'bg-[#1f2335]/30 border-[#414868]/60 hover:border-[#bb9af7]'
                            }`}
                        >
                            <div className="font-bold text-[#a9b1d6] flex justify-between items-center gap-2">
                                <span className="truncate">{r.nickname}</span>
                                {r.gravity_total > 0 && (
                                    <span className="text-[10px] text-[#f7768e] bg-[#f7768e]/10 px-1.5 py-0.5 rounded font-mono shrink-0">
                                        G: {r.gravity_total}
                                    </span>
                                )}
                            </div>
                            <div className="text-[9px] text-[#565f89] mt-1 flex justify-between gap-2">
                                <span>ID PJ: #{r.raider_id}</span>
                                <span className={Number(r.id) === 0 ? 'text-[#e0af68] font-bold' : 'text-[#7aa2f7]'}>
                                    {Number(r.id) === 0 ? '[ SIN ASIGNAR ]' : `Dueño: ${r.owner_name}`}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-[11px] text-[#565f89] italic text-center pt-8 px-2">
                        {loadingList ? 'Buscando en los registros...' : 'No se encontraron personajes registrados con ese nombre.'}
                    </div>
                )}
            </div>
        </div>
    );
}