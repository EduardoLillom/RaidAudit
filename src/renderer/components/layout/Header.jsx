import React from 'react';

export default function Header({ tabs, activeTab, setActiveTab }) {
    return (
        <header className="bg-tokyo-panel border-b border-tokyo-border px-6 py-3 flex justify-between items-center shadow-lg gap-4">
            <div>
                <h1 className="text-xs font-bold tracking-widest text-tokyo-cyan uppercase">// RAIDERVIEW OPERATIONS</h1>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex gap-1 text-[11px] bg-[#1f2335] p-1 rounded border border-tokyo-border">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            aria-pressed={activeTab === tab.id}
                            className={`px-4 py-1.5 rounded font-bold transition-all ${
                                activeTab === tab.id
                                    ? `${tab.color} text-tokyo-main shadow-sm`
                                    : 'text-slate-300 hover:text-white hover:bg-tokyo-panel'
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
