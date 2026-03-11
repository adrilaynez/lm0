"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  ArchitectureIdentityViz — §10

  ONE architecture diagram. Toggle between "Your Model" and "GPT-4".
  The diagram stays EXACTLY the same — only the scale numbers change.
  THAT is the insight: same engine, different scale.

  Each layer gets a ✓ checkmark after appearing, confirming
  "you learned this". More dramatic and celebratory.

  Premium, typography-driven, calm, confident.
*/

/* ── Architecture layers ── */
interface Layer {
    label: string;
    section: string;
    rgb: string;
}

const LAYERS: Layer[] = [
    { label: "Token Embedding", section: "§03", rgb: "167,139,250" },
    { label: "Positional Encoding", section: "§06", rgb: "245,158,11" },
    { label: "Multi-Head Attention", section: "§04", rgb: "34,211,238" },
    { label: "Add & Normalize", section: "§07", rgb: "52,211,153" },
    { label: "Feed-Forward Network", section: "§07", rgb: "251,146,60" },
    { label: "Add & Normalize", section: "§07", rgb: "52,211,153" },
    { label: "Linear → Softmax", section: "§08", rgb: "244,114,182" },
];

/* ── Scale profiles ── */
interface ScaleProfile {
    name: string;
    color: string;
    rgb: string;
    specs: string;
}

const PROFILES: ScaleProfile[] = [
    {
        name: "Your Model",
        color: "#22d3ee",
        rgb: "34,211,238",
        specs: "4 blocks · 128 dimensions · 96 characters",
    },
    {
        name: "GPT-4",
        color: "#fbbf24",
        rgb: "251,191,36",
        specs: "96 blocks · 12,288 dimensions · 100k tokens",
    },
];

export function ArchitectureIdentityViz() {
    const [activeIdx, setActiveIdx] = useState(0);
    const [hasToggled, setHasToggled] = useState(false);
    const [checksRevealed, setChecksRevealed] = useState(false);
    const timer = useRef<number>(0);
    const profile = PROFILES[activeIdx];

    /* Reveal checkmarks after layers appear, then auto-toggle */
    useEffect(() => {
        const t1 = window.setTimeout(() => setChecksRevealed(true), 900);
        timer.current = window.setTimeout(() => {
            setActiveIdx(1);
            setHasToggled(true);
        }, 3200);
        return () => {
            window.clearTimeout(t1);
            window.clearTimeout(timer.current);
        };
    }, []);

    const toggle = () => {
        setActiveIdx(i => (i + 1) % 2);
        setHasToggled(true);
    };

    return (
        <div className="w-full max-w-sm mx-auto py-6 px-2">

            {/* ── Model selector ── */}
            <div className="flex justify-center mb-6">
                <button onClick={toggle} className="cursor-pointer group">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeIdx}
                            className="text-center"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.25 }}
                        >
                            <p className="text-[15px] font-bold tracking-tight"
                                style={{ color: profile.color }}>
                                {profile.name}
                            </p>
                            <p className="text-[10px] font-mono mt-1"
                                style={{ color: `rgba(${profile.rgb},0.35)` }}>
                                {profile.specs}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                    <p className="text-[9px] text-white/10 mt-2 group-hover:text-white/20 transition-colors">
                        tap to switch
                    </p>
                </button>
            </div>

            {/* ── Architecture layers (NEVER changes) ── */}
            <div className="flex flex-col items-center gap-[5px]">
                {LAYERS.map((layer, i) => (
                    <motion.div
                        key={layer.label + i}
                        className="w-full max-w-[280px] relative"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.08, duration: 0.35 }}
                    >
                        <div className="flex items-center gap-3 py-[5px] px-3">
                            {/* Checkmark (replaces dot after reveal) */}
                            <div className="w-[14px] shrink-0 flex justify-center">
                                <AnimatePresence mode="wait">
                                    {checksRevealed ? (
                                        <motion.span
                                            key="check"
                                            className="text-[10px] font-bold"
                                            style={{ color: `rgba(${layer.rgb},0.5)` }}
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{
                                                delay: i * 0.07,
                                                type: "spring",
                                                stiffness: 400,
                                                damping: 15,
                                            }}
                                        >
                                            ✓
                                        </motion.span>
                                    ) : (
                                        <motion.div
                                            key="dot"
                                            className="w-[5px] h-[5px] rounded-full"
                                            style={{ background: `rgba(${layer.rgb},0.3)` }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Label */}
                            <span className="text-[11px] font-medium flex-1"
                                style={{ color: `rgba(${layer.rgb},0.55)` }}>
                                {layer.label}
                            </span>

                            {/* Section ref */}
                            <span className="text-[9px] font-mono"
                                style={{ color: `rgba(${layer.rgb},0.2)` }}>
                                {layer.section}
                            </span>
                        </div>

                        {/* Connector line */}
                        {i < LAYERS.length - 1 && (
                            <div className="flex justify-center">
                                <div className="w-[1px] h-[5px]"
                                    style={{ background: "rgba(255,255,255,0.04)" }} />
                            </div>
                        )}

                        {/* Block bracket */}
                        {i === 5 && (
                            <div className="absolute -right-4 flex items-center"
                                style={{ top: -58, height: 72 }}>
                                <div className="w-[1px] h-full"
                                    style={{ background: `rgba(${profile.rgb},0.12)` }} />
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={activeIdx}
                                        className="text-[9px] font-mono ml-1.5"
                                        style={{ color: `rgba(${profile.rgb},0.3)` }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {activeIdx === 0 ? "×4" : "×96"}
                                    </motion.span>
                                </AnimatePresence>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* ── "You know every piece" confirmation ── */}
            <AnimatePresence>
                {checksRevealed && !hasToggled && (
                    <motion.p
                        className="text-center text-[10px] text-white/12 mt-6 font-medium"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.6, duration: 0.3 }}
                    >
                        You know every piece.
                    </motion.p>
                )}
            </AnimatePresence>

            {/* ── Insight line ── */}
            <AnimatePresence>
                {hasToggled && (
                    <motion.p
                        className="text-center text-[11px] text-white/15 mt-8 font-medium"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                    >
                        The diagram didn&apos;t change. Only the numbers did.
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
