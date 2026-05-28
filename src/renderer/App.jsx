import React, { useState } from 'react';
import Header from './components/layout/Header';
import MatrizTab from './components/tabs/MatrizTab/MatrizTab';
import JugadoresTab from './components/tabs/JugadoresTab/JugadoresTab';
import GuildsTab from './components/tabs/GuildTab/GuildTab';
import GestionTab from './components/tabs/GestionTab/GestionTab';
import MoreOptionsTab from './components/tabs/MoreOptionsTab/MoreOptionsTab';

export default function App() {
    const [activeTab, setActiveTab] = useState('matriz');
    const [pendingRaiderSelection, setPendingRaiderSelection] = useState(null);

    const tabs = [
        { id: 'matriz', label: '[01] Analizador Raid', color: 'bg-[#41a6b5]' },
        { id: 'jugadores', label: '[02] Expedientes', color: 'bg-[#bb9af7]' },
        { id: 'guilds', label: '[03] Archivo Guilds', color: 'bg-[#41a6b5]' },
        { id: 'gestion', label: '[04] Importación & Gestión', color: 'bg-[#9ece6a]' },
        { id: 'more options', label: '[05] Más opciones', color: 'bg-[#f7768e]' }
    ];

    const handleSelectRaider = (raider) => {
        if (!raider) return;
        setPendingRaiderSelection(raider);
        setActiveTab('jugadores');
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden select-none bg-[#1a1b26]">
            <Header tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <div className="flex-1 p-6 overflow-hidden">
                <div className="w-full h-full bg-[#24283b] rounded-xl border border-[#414868] p-5 flex flex-col overflow-hidden shadow-2xl">
                    {activeTab === 'matriz' && <MatrizTab onSelectRaider={handleSelectRaider} />}
                    {activeTab === 'jugadores' && (
                        <JugadoresTab
                            targetRaider={pendingRaiderSelection}
                            onTargetHandled={() => setPendingRaiderSelection(null)}
                        />
                    )}
                    {activeTab === 'guilds' && <GuildsTab />}
                    {activeTab === 'gestion' && <GestionTab />}
                    {activeTab === 'more options' && <MoreOptionsTab />} 
                </div>
            </div>
        </div>
    );
}
