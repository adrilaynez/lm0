"use client";

import React from "react";

import { Lightbulb } from "lucide-react";

interface KeyTakeawayProps {
    children: React.ReactNode;
    accent?: "emerald" | "amber" | "rose" | "violet" | "cyan";
}

const ACCENT_STYLES = {
    emerald: {
        border: "border-emerald-500/20",
        iconBg: "bg-emerald-500/15",
        iconColor: "text-emerald-400",
        labelColor: "text-emerald-400/70",
        barColor: "bg-emerald-400/40",
        glowRgb: "52,211,153",
    },
    amber: {
        border: "border-amber-500/20",
        iconBg: "bg-amber-500/15",
        iconColor: "text-amber-400",
        labelColor: "text-amber-400/70",
        barColor: "bg-amber-400/40",
        glowRgb: "251,191,36",
    },
    rose: {
        border: "border-rose-500/20",
        iconBg: "bg-rose-500/15",
        iconColor: "text-rose-400",
        labelColor: "text-rose-400/70",
        barColor: "bg-rose-400/40",
        glowRgb: "244,63,94",
    },
    violet: {
        border: "border-violet-500/20",
        iconBg: "bg-violet-500/15",
        iconColor: "text-violet-400",
        labelColor: "text-violet-400/70",
        barColor: "bg-violet-400/40",
        glowRgb: "139,92,246",
    },
    cyan: {
        border: "border-cyan-500/20",
        iconBg: "bg-cyan-500/15",
        iconColor: "text-cyan-400",
        labelColor: "text-cyan-400/70",
        barColor: "bg-cyan-400/40",
        glowRgb: "34,211,238",
    },
};

export function KeyTakeaway({ children, accent = "emerald" }: KeyTakeawayProps) {
    const s = ACCENT_STYLES[accent];

    return (
        <div
            className={`my-10 rounded-2xl border ${s.border} p-5 sm:p-6 relative overflow-hidden`}
            style={{
                background: `linear-gradient(135deg, rgba(${s.glowRgb},0.04), rgba(${s.glowRgb},0.01), var(--lab-viz-bg, rgba(255,255,255,0.03)))`,
                boxShadow: `0 0 60px -20px rgba(${s.glowRgb},0.08)`,
            }}
        >
            {/* Accent bar left */}
            <div
                className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full ${s.barColor}`}
            />

            {/* Corner glow */}
            <div
                className="absolute -top-8 -left-8 w-32 h-32 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, rgba(${s.glowRgb},0.06), transparent 70%)` }}
            />

            <div className="relative flex gap-4 pl-2">
                <div className={`flex-shrink-0 p-2.5 rounded-xl ${s.iconBg} h-fit`}>
                    <Lightbulb className={`w-5 h-5 ${s.iconColor}`} />
                </div>
                <div>
                    <div className={`text-[10px] font-mono uppercase tracking-widest ${s.labelColor} mb-2.5`}>
                        Key Takeaway
                    </div>
                    <div className="text-sm sm:text-[15px] text-white/75 leading-relaxed">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
