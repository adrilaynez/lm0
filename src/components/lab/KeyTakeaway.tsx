"use client";

import React from "react";
import { Lightbulb } from "lucide-react";

interface KeyTakeawayProps {
    children: React.ReactNode;
    accent?: "emerald" | "amber" | "rose" | "violet";
}

const ACCENT_STYLES = {
    emerald: {
        border: "border-emerald-500/25",
        iconBg: "bg-emerald-500/15",
        iconColor: "text-emerald-400",
        labelColor: "text-emerald-400/70",
    },
    amber: {
        border: "border-amber-500/25",
        iconBg: "bg-amber-500/15",
        iconColor: "text-amber-400",
        labelColor: "text-amber-400/70",
    },
    rose: {
        border: "border-rose-500/25",
        iconBg: "bg-rose-500/15",
        iconColor: "text-rose-400",
        labelColor: "text-rose-400/70",
    },
    violet: {
        border: "border-violet-500/25",
        iconBg: "bg-violet-500/15",
        iconColor: "text-violet-400",
        labelColor: "text-violet-400/70",
    },
};

export function KeyTakeaway({ children, accent = "emerald" }: KeyTakeawayProps) {
    const s = ACCENT_STYLES[accent];

    return (
        <div className={`my-8 rounded-xl border ${s.border} bg-[var(--lab-viz-bg)] p-5 relative overflow-hidden`}>
            {/* Subtle glow */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-current to-transparent opacity-[0.03] pointer-events-none" />

            <div className="relative flex gap-4">
                <div className={`flex-shrink-0 p-2 rounded-lg ${s.iconBg} h-fit`}>
                    <Lightbulb className={`w-4 h-4 ${s.iconColor}`} />
                </div>
                <div>
                    <div className={`text-[10px] font-mono uppercase tracking-widest ${s.labelColor} mb-2`}>
                        Key Takeaway
                    </div>
                    <div className="text-sm text-white/70 leading-relaxed">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
