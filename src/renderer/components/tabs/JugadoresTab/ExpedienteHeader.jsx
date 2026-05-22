import React from 'react';

export default function ExpedienteHeader({ profile, selectedRaider }) {
    return (
        <div className="flex justify-between items-start border-b border-[#414868]/30 pb-4">
            <div>
                <h3 className="text-xs font-bold text-[#e0af68] uppercase tracking-wider flex items-center gap-2">
                    <span>// EXPEDIENTE INDIVIDUAL: {selectedRaider.nickname.toUpperCase()}</span>
                    {profile.unassigned && (
                        <span className="text-[9px] bg-[#e0af68]/10 text-[#e0af68] border border-[#e0af68]/30 px-1.5 py-0.5 rounded">
                            SIN CUENTA MAESTRA
                        </span>
                    )}
                </h3>
                <p className="text-[10px] text-[#565f89] mt-1">
                    {profile.unassigned 
                        ? "Este personaje está operando como PUG independiente (sin dueño asignado)."
                        : `Personaje vinculado a la cuenta de: ${selectedRaider.owner_name || 'Desconocido'}`}
                </p>
            </div>
            
            {/* Marcador de Gravedad Individual */}
            <div className="bg-[#1f2335] border border-[#414868] rounded-lg px-4 py-2 flex gap-4 text-center">
                <div>
                    <span className="text-[9px] block text-[#7aa2f7] font-bold">BAJAS</span>
                    <span className="text-xs text-gray-300">{profile.summary?.lows || 0}</span>
                </div>
                <div className="border-l border-[#414868]/60 pl-4">
                    <span className="text-[9px] block text-[#e0af68] font-bold">MEDIAS</span>
                    <span className="text-xs text-gray-300">{profile.summary?.mediums || 0}</span>
                </div>
                <div className="border-l border-[#414868]/60 pl-4">
                    <span className="text-[9px] block text-[#f7768e] font-bold">ALTAS</span>
                    <span className="text-xs text-gray-300">{profile.summary?.highs || 0}</span>
                </div>
                <div className="border-l border-[#414868] pl-4 bg-[#f7768e]/5 px-2 rounded">
                    <span className="text-[9px] block text-[#f7768e] font-black">GRAVEDAD</span>
                    <span className="text-xs text-[#f7768e] font-bold">{profile.summary?.gravity_total || 0}</span>
                </div>
            </div>
        </div>
    );
}