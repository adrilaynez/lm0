"use client";

import { useState } from "react";

import { BookOpen, ChevronDown } from "lucide-react";

import type { HistoricalContext } from "@/types/lmLab";

interface HistoricalContextPanelProps {
    data?: HistoricalContext;
    collapsible?: boolean;
}

export function HistoricalContextPanel({ data, collapsible = false }: HistoricalContextPanelProps) {
    const [isOpen, setIsOpen] = useState(!collapsible);

    if (!data) return null;

    const content = (
        <div className="p-6 space-y-6">
            <div>
                <h4 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-2">
                    Description
                </h4>
                <p className="text-white/80 leading-relaxed">
                    {data.description}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-3">
                        Key Limitations
                    </h4>
                    <ul className="space-y-2">
                        {data.limitations.map((lim, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                                {lim}
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h4 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-3">
                        Evolution to Modern AI
                    </h4>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-sm text-emerald-100/80 leading-relaxed">
                        {data.modern_evolution}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm mb-8">
            <button
                type="button"
                onClick={collapsible ? () => setIsOpen(o => !o) : undefined}
                className={`w-full bg-white/5 px-6 py-4 flex items-center gap-2 border-b border-white/5 ${collapsible ? "cursor-pointer hover:bg-white/[0.07] transition-colors" : "cursor-default"}`}
            >
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-white">Historical Significance & Context</h3>
                {collapsible && (
                    <>
                        <span className="ml-1 text-xs text-white/30 font-mono uppercase tracking-widest">Learn More</span>
                        <ChevronDown className={`ml-auto w-4 h-4 text-white/40 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </>
                )}
            </button>

            {isOpen && content}
        </div>
    );
}
