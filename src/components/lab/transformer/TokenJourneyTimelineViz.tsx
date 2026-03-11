"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

/*
  TokenJourneyTimelineViz — NEW-05
  §04d, right before FullScoringPipelineViz.
  
  Horizontal pipeline with 6 stages showing one token's full transformation.
  Click each stage or auto-play. Each stage has a one-line first-person label.
*/

interface Stage {
    id: number;
    title: string;
    label: string;
    color: string;
    features: number[];
}

const STAGES: Stage[] = [
    {
        id: 0,
        title: "Raw Embedding",
        label: "I start as a generic word.",
        color: "#94a3b8",
        features: [0.70, 0.25, 0.60, 0.15, 0.20],
    },
    {
        id: 1,
        title: "Q / K / V Split",
        label: "I split into three roles: what I need, what I offer, what I share.",
        color: "#a78bfa",
        features: [0.70, 0.25, 0.60, 0.15, 0.20],
    },
    {
        id: 2,
        title: "Q · K Scoring",
        label: "My Query checks every Key.",
        color: "#f472b6",
        features: [0.70, 0.25, 0.60, 0.15, 0.20],
    },
    {
        id: 3,
        title: "Softmax",
        label: "Scores become a recipe — percentages that sum to 100%.",
        color: "#fb923c",
        features: [0.70, 0.25, 0.60, 0.15, 0.20],
    },
    {
        id: 4,
        title: "Value Blending",
        label: "I gather everyone's Values according to the recipe.",
        color: "#fbbf24",
        features: [0.78, 0.42, 0.72, 0.35, 0.55],
    },
    {
        id: 5,
        title: "Contextual Output",
        label: "I become a new, context-aware version of myself.",
        color: "#34d399",
        features: [0.92, 0.58, 0.85, 0.65, 0.80],
    },
];

const FEATURE_NAMES = ["royalty", "action", "person", "object", "context"];

export function TokenJourneyTimelineViz() {
    const [activeStage, setActiveStage] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const advance = useCallback(() => {
        setActiveStage(prev => {
            if (prev >= STAGES.length - 1) {
                setIsPlaying(false);
                return prev;
            }
            return prev + 1;
        });
    }, []);

    useEffect(() => {
        if (!isPlaying) return;
        const interval = setInterval(advance, 1800);
        return () => clearInterval(interval);
    }, [isPlaying, advance]);

    const handlePlay = () => {
        setActiveStage(0);
        setIsPlaying(true);
    };

    const handleStageClick = (idx: number) => {
        setIsPlaying(false);
        setActiveStage(idx);
    };

    const current = STAGES[activeStage];

    return (
        <div className="py-8 sm:py-10 px-3 sm:px-6 space-y-6">

            {/* Title */}
            <div className="text-center">
                <p className="text-[11px] uppercase tracking-widest font-semibold text-white/25 mb-1">
                    One token&apos;s journey
                </p>
                <p className="text-base sm:text-lg font-semibold text-white/50">
                    &ldquo;king&rdquo; — from frozen to contextual
                </p>
            </div>

            {/* Timeline dots */}
            <div className="flex items-center justify-center gap-0 max-w-lg mx-auto">
                {STAGES.map((stage, i) => {
                    const isActive = i === activeStage;
                    const isPast = i < activeStage;
                    const dotColor = isActive ? stage.color : isPast ? stage.color : "rgba(255,255,255,0.12)";

                    return (
                        <div key={i} className="flex items-center">
                            {/* Connector line (not before first) */}
                            {i > 0 && (
                                <motion.div
                                    className="h-[2px] rounded-full"
                                    style={{ width: "clamp(16px, 4vw, 40px)" }}
                                    animate={{
                                        background: isPast || isActive
                                            ? `linear-gradient(90deg, ${STAGES[i - 1].color}50, ${stage.color}50)`
                                            : "rgba(255,255,255,0.06)",
                                    }}
                                    transition={{ duration: 0.4 }}
                                />
                            )}

                            {/* Stage dot */}
                            <button
                                onClick={() => handleStageClick(i)}
                                className="relative flex flex-col items-center cursor-pointer group"
                            >
                                <motion.div
                                    className="rounded-full z-10 relative"
                                    animate={{
                                        width: isActive ? 16 : 10,
                                        height: isActive ? 16 : 10,
                                        background: dotColor,
                                        boxShadow: isActive ? `0 0 12px ${stage.color}60` : "none",
                                    }}
                                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                />

                                {/* Stage number */}
                                <span
                                    className="absolute -bottom-5 text-[8px] font-mono tabular-nums transition-colors duration-200"
                                    style={{ color: isActive ? `${stage.color}80` : "rgba(255,255,255,0.15)" }}
                                >
                                    {i + 1}
                                </span>
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Stage content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeStage}
                    className="text-center space-y-4 pt-2"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Stage title */}
                    <div>
                        <p className="text-[13px] sm:text-sm font-semibold" style={{ color: `${current.color}bb` }}>
                            {current.title}
                        </p>
                        <p className="text-[12px] text-white/30 italic mt-0.5 max-w-sm mx-auto">
                            {current.label}
                        </p>
                    </div>

                    {/* Mini feature bars */}
                    <div className="max-w-[220px] mx-auto space-y-1">
                        {FEATURE_NAMES.map((feat, fi) => {
                            const val = current.features[fi];
                            return (
                                <div key={fi} className="flex items-center gap-2">
                                    <span className="text-[9px] font-medium text-white/20 w-12 text-right shrink-0">
                                        {feat}
                                    </span>
                                    <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                                        <motion.div
                                            className="h-full rounded-full"
                                            initial={{ width: `${STAGES[Math.max(0, activeStage - 1)].features[fi] * 100}%` }}
                                            animate={{ width: `${val * 100}%` }}
                                            transition={{ type: "spring", stiffness: 80, damping: 14, delay: fi * 0.04 }}
                                            style={{
                                                background: `linear-gradient(90deg, ${current.color}40, ${current.color}80)`,
                                            }}
                                        />
                                    </div>
                                    <span className="text-[8px] font-mono text-white/15 w-6 text-right tabular-nums">
                                        {Math.round(val * 100)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Stage-specific visuals */}
                    {activeStage === 1 && (
                        <div className="flex items-center justify-center gap-4">
                            {[
                                { label: "Q", color: "#f472b6" },
                                { label: "K", color: "#fbbf24" },
                                { label: "V", color: "#34d399" },
                            ].map((role, ri) => (
                                <motion.div
                                    key={role.label}
                                    className="flex items-center gap-1.5"
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: ri * 0.15 + 0.2 }}
                                >
                                    <div className="w-2 h-2 rounded-full" style={{ background: `${role.color}70` }} />
                                    <span className="text-[11px] font-mono font-bold" style={{ color: `${role.color}70` }}>
                                        {role.label}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {activeStage === 3 && (
                        <div className="flex items-center justify-center gap-3">
                            {["crown 30%", "golden 25%", "wore 20%", "ruled 15%"].map((s, i) => (
                                <motion.span
                                    key={i}
                                    className="text-[10px] font-mono text-white/20 tabular-nums"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.1 + 0.2 }}
                                >
                                    {s}
                                </motion.span>
                            ))}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
                <button
                    onClick={handlePlay}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer"
                    style={{
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)",
                        color: "rgba(255,255,255,0.35)",
                    }}
                >
                    {isPlaying ? "⏸ Playing..." : "▶ Auto-play"}
                </button>
                {activeStage === STAGES.length - 1 && !isPlaying && (
                    <motion.span
                        className="text-[11px] font-medium text-emerald-400/40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        Journey complete ✓
                    </motion.span>
                )}
            </div>
        </div>
    );
}
