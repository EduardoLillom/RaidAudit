import React from 'react';

export default function Header({ tabs, activeTab, setActiveTab }) {
    return (
        <header className="bg-[#24283b] border-b border-[#414868] px-6 py-3 flex justify-between items-center shadow-lg gap-4">
            <div>
                <h1 className="text-xs font-bold tracking-widest text-[#41a6b5] uppercase">// RAIDERVIEW OPERATIONS</h1>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex gap-1 text-[11px] bg-[#1f2335] p-1 rounded border border-[#414868]">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            aria-pressed={activeTab === tab.id}
                            className={`px-4 py-1.5 rounded font-bold transition-all ${
                                activeTab === tab.id
                                    ? `${tab.color} text-[#1a1b26] shadow-sm`
                                    : 'text-[#a9b1d6] hover:text-white hover:bg-[#24283b]'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
        </header>
    );
}
