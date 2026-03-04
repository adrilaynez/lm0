"use client";

import { useState } from "react";

import { motion, AnimatePresence } from "framer-motion";

/*
  JourneyBreadcrumb
  Interactive progress breadcrumb showing the model evolution:
  Bigram → N-gram → Neural Net → MLP.
  Each node shows key ability + limitation.
  The MLP node pulses, indicating "we're building this now".
  Clicking previous nodes shows a mini-recap tooltip.
*/

interface ModelStep {
    id: string;
    label: string;
    ability: string;
    limitation: string;
    color: string;
    glow: string;
}

const STEPS: ModelStep[] = [
    {
        id: "bigram",
        label: "Bigram",
        ability: "Counts letter pairs",
        limitation: "Only sees 1 letter back",
        color: "bg-amber-500",
        glow: "shadow-amber-500/30",
    },
    {
        id: "ngram",
        label: "N-gram",
        ability: "Sees N letters of context",
        limitation: "Tables explode exponentially",
        color: "bg-orange-500",
        glow: "shadow-orange-500/30",
    },
    {
        id: "nn",
        label: "Neural Net",
        ability: "Learns patterns from data",
        limitation: "Still only sees 1 letter",
        color: "bg-rose-500",
        glow: "shadow-rose-500/30",
    },
    {
        id: "mlp",
        label: "MLP",
        ability: "Learns + sees N letters",
        limitation: "Building it now…",
        color: "bg-violet-500",
        glow: "shadow-violet-500/40",
    },
];

export function JourneyBreadcrumb() {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    return (
        <div className="my-8 md:my-10">
            <div className="flex items-center justify-center gap-1 sm:gap-2">
                {STEPS.map((step, i) => {
                    const isMLP = i === STEPS.length - 1;
                    const isHovered = hoveredIdx === i;

                    return (
                        <div key={step.id} className="flex items-center gap-1 sm:gap-2">
                            {/* Node */}
                            <div className="relative">
                                <motion.button
                                    onMouseEnter={() => setHoveredIdx(i)}
                                    onMouseLeave={() => setHoveredIdx(null)}
                                    onClick={() => setHoveredIdx(prev => prev === i ? null : i)}
                                    className={`
                                        relative flex flex-col items-center gap-1 px-3 py-2 sm:px-4 sm:py-2.5
                                        rounded-xl border transition-all cursor-pointer
                                        ${isMLP
                                            ? "border-violet-500/40 bg-violet-500/10"
                                            : isHovered
                                                ? "border-white/20 bg-white/[0.06]"
                                                : "border-white/[0.08] bg-white/[0.02]"
                                        }
                                    `}
                                    animate={isMLP ? {
                                        boxShadow: [
                                            "0 0 0 0 rgba(139,92,246,0)",
                                            "0 0 12px 2px rgba(139,92,246,0.15)",
                                            "0 0 0 0 rgba(139,92,246,0)",
                                        ],
                                    } : undefined}
                                    transition={isMLP ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" } : undefined}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full ${step.color} ${isMLP ? "animate-pulse" : ""}`} />
                                        <span className={`text-[11px] sm:text-xs font-mono font-bold ${isMLP ? "text-violet-300" : "text-white/60"}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                </motion.button>

                                {/* Tooltip */}
                                <AnimatePresence>
                                    {isHovered && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 4, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-20 w-48 sm:w-56"
                                        >
                                            <div className="rounded-lg border border-white/10 bg-[#1a1a2e] p-3 shadow-xl">
                                                <p className="text-[10px] font-mono text-emerald-400/70 mb-1">
                                                    ✓ {step.ability}
                                                </p>
                                                <p className="text-[10px] font-mono text-rose-400/70">
                                                    ✗ {step.limitation}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Arrow connector */}
                            {i < STEPS.length - 1 && (
                                <svg width="20" height="12" viewBox="0 0 20 12" className="shrink-0 text-white/15">
                                    <path d="M0 6 L14 6 M10 2 L16 6 L10 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Subtitle */}
            <p className="text-center text-[10px] font-mono text-white/25 mt-3">
                Hover or tap to see what each model can and can&apos;t do
            </p>
        </div>
    );
}
