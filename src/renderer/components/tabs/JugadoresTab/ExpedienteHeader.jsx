import React from 'react';

export default function ExpedienteHeader({ profile, selectedRaider }) {
    const REALM = 'Icecrown';
    
    // Corrección: Usamos selectedRaider en lugar de raider. 
    // Añadimos un fallback (selectedRaider?.nickname o name) para evitar crashes si no viene el dato.
    const raiderName = selectedRaider?.nickname || selectedRaider?.name || '';
    const armoryUrl = `https://armory.warmane.com/character/${encodeURIComponent(raiderName)}/${REALM}/summary`;

    const handleNameClick = (e) => {
        e.preventDefault();
        if (!raiderName) return; // Evita abrir URLs vacías

        if (window.apiDB?.openExternalLink) {
            window.apiDB.openExternalLink(armoryUrl);
        } else {
            window.open(armoryUrl, '_blank');
        }
    };
    
    return (
        <div className="flex justify-between items-start border-b border-tokyo-border/30 pb-4">
            <div>
                <h3 className="text-xs font-bold text-tokyo-orange uppercase tracking-wider flex items-center gap-2">
                    {/* Convertimos el texto en un enlace/botón interactivo */}
                    <button 
                        onClick={handleNameClick} 
                        className="hover:underline cursor-pointer text-left transition-all hover:text-[#ff9e3b]"
                        title="Ver armería en Warmane"
                    >
                        // EXPEDIENTE INDIVIDUAL: {raiderName.toUpperCase()}
                    </button>
                    
                    {profile.unassigned && (
                        <span className="text-[9px] bg-tokyo-orange/10 text-tokyo-orange border border-tokyo-orange/30 px-1.5 py-0.5 rounded">
                            SIN CUENTA MAESTRA
                        </span>
                    )}
                </h3>
                <p className="text-[10px] text-tokyo-comment mt-1">
                    {profile.unassigned 
                        ? "Este personaje está operando como PUG independiente (sin dueño asignado)."
                        : `Personaje vinculado a la cuenta de: ${selectedRaider?.owner_name || 'Desconocido'}`}
                </p>
            </div>
            
            {/* Marcador de Gravedad Individual */}
            <div className="bg-[#1f2335] border border-tokyo-border rounded-lg px-4 py-2 flex gap-4 text-center">
                <div>
                    <span className="text-[9px] block text-[#7aa2f7] font-bold">BAJAS</span>
                    <span className="text-xs text-gray-300">{profile.summary?.lows || 0}</span>
                </div>
                <div className="border-l border-tokyo-border/60 pl-4">
                    <span className="text-[9px] block text-tokyo-orange font-bold">MEDIAS</span>
                    <span className="text-xs text-gray-300">{profile.summary?.mediums || 0}</span>
                </div>
                <div className="border-l border-tokyo-border/60 pl-4">
                    <span className="text-[9px] block text-[#f7768e] font-bold">ALTAS</span>
                    <span className="text-xs text-gray-300">{profile.summary?.highs || 0}</span>
                </div>
                <div className="border-l border-tokyo-border pl-4 bg-[#f7768e]/5 px-2 rounded">
                    <span className="text-[9px] block text-[#f7768e] font-black">GRAVEDAD</span>
                    <span className="text-xs text-[#f7768e] font-bold">{profile.summary?.gravity_total || 0}</span>
                </div>
            </div>
        </div>
    );
}