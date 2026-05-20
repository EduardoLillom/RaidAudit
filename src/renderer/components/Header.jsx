import React from 'react';

export default function Header({ tabs, activeTab, setActiveTab }) {
    return (
        <header className="bg-[#24283b] border-b border-[#414868] px-6 py-3 flex justify-between items-center shadow-lg">
            <div>
                <h1 className="text-xs font-bold tracking-widest text-[#41a6b5] uppercase">// ACOLYTES_CORE_ENGINE v4.0</h1>
                <p className="text-[10px] text-[#565f89]">ELECTRON NATIVE BRIDGE + REACT VITE</p>
            </div>
            
            <div className="flex gap-1 text-[11px] bg-[#1f2335] p-1 rounded border border-[#414868]">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-1.5 rounded font-bold transition-all ${
                            activeTab === tab.id 
                                ? `${tab.color} text-[#1a1b26]` 
                                : 'text-[#a9b1d6] hover:text-white'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </header>
    );
}
