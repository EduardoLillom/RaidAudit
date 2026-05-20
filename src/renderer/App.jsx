import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import MatrizTab from './components/tabs/MatrizTab/MatrizTab';
import JugadoresTab from './components/tabs/JugadoresTab/JugadoresTab';
import GuildsTab from './components/tabs/GuildTab/GuildTab';

export default function App() {
    const [activeTab, setActiveTab] = useState('matriz');

    const tabs = [
        { id: 'matriz', label: '[01] Analizador Raid', color: 'bg-[#41a6b5]' },
        { id: 'jugadores', label: '[02] Expedientes', color: 'bg-[#bb9af7]' },
        { id: 'guilds', label: '[03] Archivo Guilds', color: 'bg-[#9ece6a]' }
    ];

    return (
        <div className="h-screen flex flex-col overflow-hidden select-none bg-[#1a1b26]">
            <Header tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <div className="flex-1 p-6 overflow-hidden">
                <div className="w-full h-full bg-[#24283b] rounded-xl border border-[#414868] p-5 flex flex-col overflow-hidden shadow-2xl">
                    {activeTab === 'matriz' && <MatrizTab />}
                    {activeTab === 'jugadores' && <JugadoresTab />}
                    {activeTab === 'guilds' && <GuildsTab />}
                </div>
            </div>
        </div>
    );
}
