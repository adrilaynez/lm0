"use client";

import React from "react";

import { Lightbulb } from "lucide-react";

interface KeyTakeawayProps {
    children: React.ReactNode;
    accent?: "emerald" | "amber" | "rose" | "violet" | "cyan" | "bigram" | "ngram";
}

interface LiteralAccent {
    border: string;
    iconBg: string;
    iconColor: string;
    labelColor: string;
    barColor: string;
    glowRgb: string;
}

const ACCENT_STYLES: Record<Exclude<KeyTakeawayProps["accent"], "bigram" | "ngram" | undefined>, LiteralAccent> = {
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

/**
 * Bigram (editorial-green, v8) takeaway — the SAGE "editorial insight" voice.
 * Distinct from the interactive emerald accent: a paler, airier green.
 * Every value is a --bigram-* token so it follows the [data-bigram-theme]
 * scope (dark + light) and never touches another chapter's accent.
 * Mirrors the `.takeaway` rule in styles-v8.css.
 */
function BigramTakeaway({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="my-10 rounded-[var(--bigram-r-lg)] p-6 sm:p-7 relative"
            style={{
                background:
                    "linear-gradient(135deg, var(--bigram-sage-soft), transparent 82%)",
                border: "1px solid color-mix(in oklab, var(--bigram-sage) 32%, transparent)",
            }}
        >
            <div className="relative flex gap-4">
                <div
                    className="flex-shrink-0 grid place-items-center w-9 h-9 rounded-[var(--bigram-r-sm)]"
                    style={{
                        background: "var(--bigram-sage-soft)",
                        color: "var(--bigram-sage)",
                    }}
                >
                    <Lightbulb className="w-[18px] h-[18px]" />
                </div>
                <div>
                    <div
                        className="font-mono text-[10.5px] uppercase tracking-[0.18em] mb-2.5"
                        style={{ color: "var(--bigram-sage)" }}
                    >
                        Key Takeaway
                    </div>
                    <div
                        className="font-serif text-[19px] leading-relaxed"
                        style={{ color: "var(--bigram-ink)" }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * N-gram (editorial-amber) takeaway — the SAGE "editorial insight" voice, amber sibling of
 * BigramTakeaway. Every value is a --ngram-* token under the [data-ngram-theme] scope.
 */
function NgramTakeaway({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="my-10 rounded-[var(--ngram-r-lg)] p-6 sm:p-7 relative"
            style={{
                background:
                    "linear-gradient(135deg, var(--ngram-sage-soft), transparent 82%)",
                border: "1px solid color-mix(in oklab, var(--ngram-sage) 32%, transparent)",
            }}
        >
            <div className="relative flex gap-4">
                <div
                    className="flex-shrink-0 grid place-items-center w-9 h-9 rounded-[var(--ngram-r-sm)]"
                    style={{
                        background: "var(--ngram-sage-soft)",
                        color: "var(--ngram-sage)",
                    }}
                >
                    <Lightbulb className="w-[18px] h-[18px]" />
                </div>
                <div>
                    <div
                        className="font-mono text-[10.5px] uppercase tracking-[0.18em] mb-2.5"
                        style={{ color: "var(--ngram-sage)" }}
                    >
                        Key Takeaway
                    </div>
                    <div
                        className="font-serif text-[19px] leading-relaxed"
                        style={{ color: "var(--ngram-ink)" }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function KeyTakeaway({ children, accent = "emerald" }: KeyTakeawayProps) {
    // Bigram / n-gram opt into the SAGE editorial voice; all other chapters keep
    // their original literal Tailwind accents untouched.
    if (accent === "bigram") {
        return <BigramTakeaway>{children}</BigramTakeaway>;
    }
    if (accent === "ngram") {
        return <NgramTakeaway>{children}</NgramTakeaway>;
    }

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
