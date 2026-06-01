import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import MatrizTab from './components/tabs/MatrizTab/MatrizTab';
import JugadoresTab from './components/tabs/JugadoresTab/JugadoresTab';
import GuildsTab from './components/tabs/GuildTab/GuildTab';
import GestionTab from './components/tabs/GestionTab/GestionTab';
import MoreOptionsTab from './components/tabs/MoreOptionsTab/MoreOptionsTab';

export default function App() {
    const [activeTab, setActiveTab] = useState('matriz');
    const [pendingRaiderSelection, setPendingRaiderSelection] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Verificar que la API está disponible
        if (!window.apiDB) {
            const msg = 'Error: API no disponible. El preload no se cargó correctamente.';
            console.error(msg);
            setError(msg);
            window.apiDB?.logError?.(msg);
            return;
        }

        // Intentar cargar los guilds para verificar que la BD funciona
        window.apiDB.getAllGuildsActive()
            .catch(err => {
                const msg = `Error conectando a la base de datos: ${err.message}`;
                console.error(msg, err);
                setError(msg);
            });
    }, []);

    const tabs = [
        { id: 'matriz', label: '[01] Analizador Raid', color: 'bg-[#41a6b5]' },
        { id: 'jugadores', label: '[02] Expedientes', color: 'bg-tokyo-purple' },
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
        <div className="h-screen flex flex-col overflow-hidden select-none bg-tokyo-main">
            {error && (
                <div className="bg-red-900 border border-red-700 p-4 m-4 rounded text-red-100">
                    <p className="font-bold">Error de inicialización:</p>
                    <p>{error}</p>
                </div>
            )}
            <Header tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <div className="flex-1 p-6 overflow-hidden">
                <div className="w-full h-full bg-tokyo-panel rounded-xl border border-tokyo-border p-5 flex flex-col overflow-hidden shadow-2xl">
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
