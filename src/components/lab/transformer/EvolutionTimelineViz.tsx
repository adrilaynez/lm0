"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  EvolutionTimelineViz — VIZ 15  ⭐⭐⭐⭐

  GRAND FINALE. Complete journey from bigram to deep Transformer.
  Five models, each more capable. Emotional closure.

  Horizontal timeline with 5 nodes:
  Bigram → N-gram → MLP → Transformer 1B → Transformer 4B

  Click node: expands to show sample text + stats + quality meter.
  Line draws left→right with gradient. Nodes pop in with stagger.
*/

interface ModelNode {
    id: string;
    label: string;
    era: string;
    color: string;
    rgb: string;
    description: string;
    sample: string;
    stats: string;
    params: string;
    qualityPct: number; /* 0–100 */
}

const MODELS: ModelNode[] = [
    {
        id: "bigram",
        label: "Bigram",
        era: "Bigram",
        color: "#34d399",
        rgb: "52,211,153",
        description: "Counted pairs. No context beyond the previous character.",
        sample: "theng an thi whe ous t orand",
        stats: "1-char context",
        params: "~700",
        qualityPct: 8,
    },
    {
        id: "ngram",
        label: "N-gram",
        era: "N-gram",
        color: "#f59e0b",
        rgb: "245,158,11",
        description: "Counted longer patterns. Fixed window, exponential table.",
        sample: "the king was in the great hall and",
        stats: "4-char context",
        params: "~50K",
        qualityPct: 22,
    },
    {
        id: "mlp",
        label: "MLP",
        era: "MLP",
        color: "#a78bfa",
        rgb: "167,139,250",
        description: "Learned patterns. Embeddings compress the input. First neural approach.",
        sample: "and the shall not be the same of it",
        stats: "8-char context",
        params: "~300K",
        qualityPct: 38,
    },
    {
        id: "t1b",
        label: "Transformer 1B",
        era: "Transformer",
        color: "#22d3ee",
        rgb: "34,211,238",
        description: "Attention. Full context. Every position sees every other \u2014 in one pass.",
        sample: "they neithers a special have good in work that is",
        stats: "full context, 1 block",
        params: "227K",
        qualityPct: 55,
    },
    {
        id: "t4b",
        label: "Transformer 4B",
        era: "Transformer",
        color: "#10b981",
        rgb: "16,185,129",
        description: "Deep attention. Multiple passes refine understanding. The breakthrough.",
        sample: "evolve was starting in the two interests a project that could",
        stats: "full context, 4 blocks",
        params: "836K",
        qualityPct: 78,
    },
];

/* SVG timeline dimensions */
const TW = 640;
const TH = 56;
const nodeX = (i: number) => 48 + (i / (MODELS.length - 1)) * (TW - 96);
const NODE_R = 18;

export function EvolutionTimelineViz() {
    const [selected, setSelected] = useState<number | null>(null);
    const [drawn, setDrawn] = useState(false);
    const [visibleNodes, setVisibleNodes] = useState<number>(0);
    const animRef = useRef(false);

    /* Stagger animation: line draws, then nodes pop in one by one */
    useEffect(() => {
        if (animRef.current) return;
        animRef.current = true;

        const timers: ReturnType<typeof setTimeout>[] = [];
        timers.push(setTimeout(() => setDrawn(true), 300));
        MODELS.forEach((_, i) => {
            timers.push(setTimeout(() => setVisibleNodes(i + 1), 700 + i * 250));
        });
        return () => timers.forEach(clearTimeout);
    }, []);

    const sel = selected !== null ? MODELS[selected] : null;

    /* Build gradient line path */
    const linePath = MODELS.map((_, i) =>
        `${i === 0 ? "M" : "L"}${nodeX(i)},${TH / 2}`
    ).join(" ");

    return (
        <div className="flex flex-col items-center gap-4 w-full py-5 px-2 max-w-[680px] mx-auto">
            {/* ── SVG Timeline ── */}
            <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
                <svg viewBox={`0 0 ${TW} ${TH}`} className="w-full" style={{ minWidth: 480 }}>
                    <defs>
                        <linearGradient id="evo-line-grad" x1="0" x2="1" y1="0" y2="0">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="25%" stopColor="#f59e0b" />
                            <stop offset="50%" stopColor="#a78bfa" />
                            <stop offset="75%" stopColor="#22d3ee" />
                            <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                    </defs>

                    {/* Line */}
                    <motion.path
                        d={linePath}
                        fill="none"
                        stroke="url(#evo-line-grad)"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeDasharray={600}
                        initial={{ strokeDashoffset: 600 }}
                        animate={{ strokeDashoffset: drawn ? 0 : 600 }}
                        transition={{ duration: 1.2, ease: "easeInOut" }}
                        style={{ filter: "drop-shadow(0 0 4px rgba(34,211,238,0.15))" }}
                    />

                    {/* Nodes */}
                    {MODELS.map((m, i) => {
                        const visible = i < visibleNodes;
                        const isSelected = selected === i;

                        return (
                            <g key={m.id}
                                onClick={() => setSelected(selected === i ? null : i)}
                                style={{ cursor: "pointer" }}>
                                {/* Outer glow ring on selected */}
                                {isSelected && (
                                    <motion.circle
                                        cx={nodeX(i)} cy={TH / 2} r={NODE_R + 4}
                                        fill="none" stroke={m.color} strokeWidth={1.5}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 0.4, scale: 1 }}
                                        style={{ filter: `drop-shadow(0 0 6px ${m.color})` }}
                                    />
                                )}

                                {/* Node circle */}
                                <motion.circle
                                    cx={nodeX(i)} cy={TH / 2} r={NODE_R}
                                    fill={visible ? `rgba(${m.rgb},0.12)` : "rgba(255,255,255,0.02)"}
                                    stroke={visible ? m.color : "rgba(255,255,255,0.06)"}
                                    strokeWidth={isSelected ? 2 : 1.5}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: visible ? 1 : 0 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    style={visible ? {
                                        filter: `drop-shadow(0 0 ${isSelected ? 8 : 3}px rgba(${m.rgb},${isSelected ? 0.4 : 0.15}))`,
                                    } : {}}
                                />

                                {/* Icon / number */}
                                {visible && (
                                    <motion.text
                                        x={nodeX(i)} y={TH / 2 + 1}
                                        textAnchor="middle" dominantBaseline="middle"
                                        fontSize={11} fontWeight={800} fontFamily="monospace"
                                        fill={m.color}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.8 }}
                                        transition={{ delay: 0.15 }}
                                    >
                                        {i + 1}
                                    </motion.text>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* ── Node labels (below timeline) ── */}
            <div className="flex w-full justify-between px-2" style={{ maxWidth: TW }}>
                {MODELS.map((m, i) => {
                    const visible = i < visibleNodes;
                    const isSelected = selected === i;
                    return (
                        <motion.button key={m.id}
                            onClick={() => setSelected(selected === i ? null : i)}
                            className="flex flex-col items-center cursor-pointer"
                            style={{ width: 90 }}
                            animate={{ opacity: visible ? 1 : 0 }}
                        >
                            <span className="text-[10px] sm:text-[11px] font-bold text-center leading-tight"
                                style={{ color: isSelected ? m.color : visible ? `rgba(${m.rgb},0.5)` : "rgba(255,255,255,0.1)" }}>
                                {m.label}
                            </span>
                            <span className="text-[8px] text-white/15 mt-0.5">{m.era}</span>
                        </motion.button>
                    );
                })}
            </div>

            {/* ── Expanded card ── */}
            <AnimatePresence mode="wait">
                {sel && selected !== null && (
                    <motion.div
                        key={sel.id}
                        className="w-full max-w-md rounded-xl overflow-hidden"
                        style={{
                            background: "rgba(255,255,255,0.015)",
                            border: `1.5px solid rgba(${sel.rgb},0.2)`,
                        }}
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.25 }}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 py-2.5"
                            style={{ borderBottom: `1px solid rgba(${sel.rgb},0.08)` }}>
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold font-mono"
                                style={{
                                    background: `rgba(${sel.rgb},0.12)`,
                                    color: sel.color,
                                    border: `1.5px solid rgba(${sel.rgb},0.3)`,
                                }}>
                                {selected + 1}
                            </div>
                            <div>
                                <div className="text-[13px] font-bold" style={{ color: sel.color }}>
                                    {sel.label}
                                </div>
                                <div className="text-[10px] text-white/20">{sel.era}</div>
                            </div>
                            <div className="ml-auto text-right">
                                <div className="text-[10px] font-mono text-white/20">{sel.stats}</div>
                                <div className="text-[10px] font-mono text-white/15">{sel.params} params</div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="px-4 py-2">
                            <p className="text-[12px] leading-relaxed" style={{ color: `rgba(${sel.rgb},0.55)` }}>
                                {sel.description}
                            </p>
                        </div>

                        {/* Sample output */}
                        <div className="px-4 py-2.5 mx-3 mb-2 rounded-lg"
                            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)" }}>
                            <div className="text-[9px] text-white/15 font-semibold uppercase tracking-wider mb-1">
                                Sample output
                            </div>
                            <p className="text-[12px] font-mono leading-relaxed text-white/45 italic">
                                {"\u201C"}{sel.sample}{"\u201D"}
                            </p>
                        </div>

                        {/* Quality meter */}
                        <div className="px-4 py-2.5">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-white/20 font-semibold">Quality</span>
                                <span className="text-[12px] font-bold font-mono tabular-nums"
                                    style={{ color: sel.color }}>
                                    {sel.qualityPct}%
                                </span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden"
                                style={{ background: "rgba(255,255,255,0.03)" }}>
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{
                                        background: `linear-gradient(90deg, rgba(${sel.rgb},0.3), rgba(${sel.rgb},0.7))`,
                                        boxShadow: sel.qualityPct > 50
                                            ? `0 0 8px rgba(${sel.rgb},0.3)`
                                            : "none",
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${sel.qualityPct}%` }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── No selection hint ── */}
            {selected === null && visibleNodes >= MODELS.length && (
                <motion.p
                    className="text-[11px] text-white/15 italic"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    Click any model to explore its capabilities
                </motion.p>
            )}

            {/* ── Final caption ── */}
            {visibleNodes >= MODELS.length && (
                <motion.div
                    className="max-w-md text-center mt-2"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.0 }}
                >
                    <p className="text-[12px] text-white/20 leading-relaxed">
                        From counting pairs to understanding context.
                        Each step added a new capability {"\u2014"} and each capability
                        was built on the ideas that came before.
                    </p>
                    <p className="text-[11px] mt-2 font-semibold"
                        style={{
                            background: "linear-gradient(90deg, #34d399, #f59e0b, #a78bfa, #22d3ee, #10b981)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            opacity: 0.6,
                        }}>
                        Bigram {"\u2192"} N-gram {"\u2192"} MLP {"\u2192"} Transformer {"\u2192"} Deep Transformer
                    </p>
                </motion.div>
            )}
        </div>
    );
}
