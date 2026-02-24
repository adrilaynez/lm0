"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FAMILY_STYLES, type VisualizerFamily } from "./visualizer-theme";

/* ─────────────────────────────────────────────
   VisualizerFrame — drop-in replacement for FigureWrapper
   with 4 visual families
   ───────────────────────────────────────────── */

interface VisualizerFrameProps {
    family: VisualizerFamily;
    label: string;
    hint?: string;
    children: React.ReactNode;
}

export function VisualizerFrame({ family, label, hint, children }: VisualizerFrameProps) {
    const s = FAMILY_STYLES[family];
    const shouldReduceMotion = useReducedMotion();
    const [pulsing, setPulsing] = useState(false);

    const isNeuron = family === "neuron";

    const handleInteraction = () => {
        if (isNeuron && !shouldReduceMotion) {
            setPulsing(true);
            setTimeout(() => setPulsing(false), 600);
        }
    };

    return (
        <div
            className={`my-8 -mx-2 sm:mx-0 rounded-2xl border ${s.border} overflow-hidden relative bg-[var(--lab-viz-bg)]`}
            onMouseEnter={handleInteraction}
        >
            {/* Neuron family: radial rose glow + pulse ring */}
            {isNeuron && (
                <>
                    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(244,63,94,0.06),transparent_70%)]" />
                    {pulsing && !shouldReduceMotion && (
                        <motion.div
                            className="absolute inset-0 pointer-events-none rounded-2xl border border-rose-400/30"
                            initial={{ opacity: 0.8, scale: 1 }}
                            animate={{ opacity: 0, scale: 1.02 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                    )}
                </>
            )}

            {/* Function family: grid hint bg */}
            {family === "function" && (
                <div className="absolute inset-0 pointer-events-none opacity-100"
                    style={{
                        backgroundImage: "linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                    }}
                />
            )}

            {/* Dashboard family: raised shadow effect */}
            {family === "dashboard" && (
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-amber-950/20 via-transparent to-transparent" />
            )}

            {/* Top label bar */}
            <div className={`flex items-center justify-between px-4 py-2.5 border-b ${s.bar} relative`}>
                <p className={`text-[10px] ${s.labelFont} uppercase tracking-widest ${s.labelText} font-semibold`}>
                    {label}
                </p>
                {family === "neuron" && (
                    <span className="text-[9px] font-mono uppercase tracking-widest text-rose-400/30">
                        🧠 neuron
                    </span>
                )}
                {family === "function" && (
                    <span className="text-[9px] font-mono uppercase tracking-widest text-indigo-400/30">
                        📊 function
                    </span>
                )}
                {family === "dashboard" && (
                    <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400/30">
                        🎛️ dashboard
                    </span>
                )}
                {family === "comparison" && (
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/20">
                        ⚔️ comparison
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="relative">
                {children}
            </div>

            {/* Hint footer */}
            {hint && (
                <div className={`px-4 py-2 border-t ${s.bar}`}>
                    <p className={`text-[11px] ${s.accentText} leading-relaxed`}>{hint}</p>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────
   HiddenSection (N15) — Enhanced Expandable
   with category icon, description, difficulty dots
   ───────────────────────────────────────────── */

export type HiddenSectionCategory = "math" | "advanced" | "historical" | "supplementary";

const CATEGORY_META: Record<HiddenSectionCategory, { icon: string; label: string; color: string }> = {
    math: { icon: "📐", label: "Math", color: "text-indigo-400/60" },
    advanced: { icon: "🔬", label: "Advanced", color: "text-rose-400/60" },
    historical: { icon: "📖", label: "Historical", color: "text-amber-400/60" },
    supplementary: { icon: "🧪", label: "Supplementary", color: "text-emerald-400/60" },
};

interface HiddenSectionProps {
    category: HiddenSectionCategory;
    title: string;
    description: string;
    difficulty?: 1 | 2 | 3;
    children: React.ReactNode;
}

export function HiddenSection({ category, title, description, difficulty = 1, children }: HiddenSectionProps) {
    const [open, setOpen] = useState(false);
    const shouldReduceMotion = useReducedMotion();
    const meta = CATEGORY_META[category];

    return (
        <div className="my-6 rounded-xl border border-white/[0.07] bg-[var(--lab-viz-bg)] overflow-hidden">
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors group"
                aria-expanded={open}
            >
                {/* Category icon */}
                <span className="text-base shrink-0 mt-0.5">{meta.icon}</span>

                <div className="flex-1 min-w-0">
                    {/* Category label + difficulty */}
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[9px] font-mono uppercase tracking-widest font-bold ${meta.color}`}>
                            {meta.label}
                        </span>
                        <span className="flex gap-0.5" aria-label={`Difficulty ${difficulty} of 3`}>
                            {[1, 2, 3].map((d) => (
                                <span
                                    key={d}
                                    className={`w-1.5 h-1.5 rounded-full ${d <= difficulty ? "bg-white/40" : "bg-white/10"}`}
                                />
                            ))}
                        </span>
                    </div>

                    {/* Title */}
                    <p className="text-sm font-semibold text-white/70 group-hover:text-white/85 transition-colors leading-snug">
                        {title}
                    </p>

                    {/* 1-line description */}
                    {!open && (
                        <p className="text-xs text-white/30 mt-0.5 leading-relaxed truncate">{description}</p>
                    )}
                </div>

                {/* Chevron */}
                <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
                    className="shrink-0 text-white/20 mt-1 text-xs"
                >
                    ▾
                </motion.span>
            </button>

            {/* Expandable body */}
            <motion.div
                initial={false}
                animate={open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
            >
                <div className="px-4 pb-4 pt-1 border-t border-white/[0.05] space-y-3 text-sm text-white/50 leading-relaxed">
                    {children}
                </div>
            </motion.div>
        </div>
    );
}
