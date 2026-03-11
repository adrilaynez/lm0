"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  V32 — MultiHeadArchitectureViz ★ FLAGSHIP (v2)
  Complete multi-head attention pipeline visualization.
  Quality bar: bbycroft.net/llm level. All font sizes ≥ 13px HTML / 9px+ SVG.
  Glass-morphism cards. Auto/Step modes. Animated particles.
*/

type PlaySpeed = "slow" | "normal" | "fast";
const SPEED_MS: Record<PlaySpeed, number> = { slow: 2800, normal: 1600, fast: 800 };

/* ═══════════════════════════════════════════════════════════
   §1 — CONSTANTS & DATA MODEL
   ═══════════════════════════════════════════════════════════ */

const SENTENCE = ["The", "professor", "published", "the", "paper"];
const D_MODEL = 8;
const N_HEADS = 4;
const D_HEAD = D_MODEL / N_HEADS; // 2

const HEAD_COLORS = ["#22d3ee", "#34d399", "#fbbf24", "#a78bfa"];
const HEAD_NAMES = ["Syntax", "Meaning", "Position", "Identity"];
const WORD_COLORS = ["#94a3b8", "#67e8f9", "#f472b6", "#94a3b8", "#fbbf24"];

/* Feature group labels for embedding dimensions */
const FEATURE_GROUPS = [
    { label: "syntax", dims: [0, 1], color: "#22d3ee" },
    { label: "meaning", dims: [2, 3], color: "#34d399" },
    { label: "position", dims: [4, 5], color: "#fbbf24" },
    { label: "form", dims: [6, 7], color: "#a78bfa" },
];

/* Fake embeddings (d_model=8 per word) */
const EMBEDDINGS: number[][] = [
    [0.12, -0.05, 0.03, 0.01, 0.90, 0.02, 0.45, 0.11],  // The
    [0.85, 0.72, 0.91, 0.68, 0.15, 0.88, 0.34, 0.62],  // professor
    [0.78, 0.45, 0.22, 0.55, 0.32, 0.71, 0.88, 0.19],  // published
    [0.12, -0.05, 0.03, 0.01, 0.55, 0.42, 0.45, 0.11],  // the
    [0.41, 0.33, 0.82, 0.76, 0.48, 0.55, 0.22, 0.67],  // paper
];

/*
  Attention weights[headIdx][queryIdx][keyIdx]
  Each row sums to ~1.0
*/
const ATTN_WEIGHTS: number[][][] = [
    /* Head 0 — Syntax (subject→verb) */
    [
        [0.35, 0.05, 0.30, 0.20, 0.10],
        [0.03, 0.07, 0.52, 0.03, 0.35],
        [0.05, 0.40, 0.10, 0.05, 0.40],
        [0.30, 0.05, 0.05, 0.35, 0.25],
        [0.05, 0.35, 0.40, 0.05, 0.15],
    ],
    /* Head 1 — Meaning (noun→related) */
    [
        [0.40, 0.15, 0.10, 0.25, 0.10],
        [0.04, 0.10, 0.06, 0.02, 0.78],
        [0.05, 0.55, 0.08, 0.02, 0.30],
        [0.25, 0.10, 0.10, 0.40, 0.15],
        [0.03, 0.65, 0.15, 0.02, 0.15],
    ],
    /* Head 2 — Position (nearby) */
    [
        [0.40, 0.35, 0.15, 0.06, 0.04],
        [0.25, 0.30, 0.28, 0.10, 0.07],
        [0.08, 0.30, 0.25, 0.25, 0.12],
        [0.05, 0.10, 0.30, 0.30, 0.25],
        [0.04, 0.06, 0.12, 0.35, 0.43],
    ],
    /* Head 3 — Identity (self+broad) */
    [
        [0.50, 0.12, 0.10, 0.15, 0.13],
        [0.08, 0.45, 0.12, 0.15, 0.20],
        [0.10, 0.15, 0.40, 0.15, 0.20],
        [0.15, 0.12, 0.13, 0.45, 0.15],
        [0.12, 0.18, 0.15, 0.12, 0.43],
    ],
];

/* Pre-computed head outputs (d_head=2 per head per word) */
const HEAD_OUTPUTS: number[][][] = [
    /* Head 0 */[[0.42, -0.11], [0.82, 0.35], [0.55, 0.62], [0.38, -0.08], [0.71, 0.48]],
    /* Head 1 */[[0.15, 0.22], [0.78, 0.71], [0.65, 0.45], [0.18, 0.19], [0.72, 0.68]],
    /* Head 2 */[[0.31, 0.08], [0.58, 0.42], [0.52, 0.55], [0.45, 0.38], [0.41, 0.52]],
    /* Head 3 */[[0.22, 0.15], [0.55, 0.48], [0.48, 0.42], [0.38, 0.35], [0.45, 0.41]],
];

/* Final projected outputs (d_model=8 per word) */
const FINAL_OUTPUTS: number[][] = [
    [0.28, 0.08, 0.15, 0.22, 0.31, 0.08, 0.22, 0.15],
    [0.72, 0.49, 0.78, 0.71, 0.58, 0.42, 0.55, 0.48],
    [0.55, 0.51, 0.65, 0.45, 0.52, 0.55, 0.48, 0.42],
    [0.35, 0.11, 0.18, 0.19, 0.45, 0.38, 0.38, 0.35],
    [0.57, 0.54, 0.72, 0.68, 0.41, 0.52, 0.45, 0.41],
];

/* Pipeline stages */
const STAGES = [
    { id: "embed", label: "Embedding", icon: "1", color: "#94a3b8" },
    { id: "heads", label: "Attention Heads", icon: "2", color: "#22d3ee" },
    { id: "flow", label: "Attention Flow", icon: "3", color: "#f472b6" },
    { id: "output", label: "Head Outputs", icon: "4", color: "#fbbf24" },
    { id: "concat", label: "Concat + Project", icon: "5", color: "#34d399" },
    { id: "final", label: "New Meaning", icon: "6", color: "#f472b6" },
] as const;

/* Helper: clamp */
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

/* Helper: format number */
function fmt(v: number) { return v >= 0 ? ` ${v.toFixed(2)}` : v.toFixed(2); }

/* ═══════════════════════════════════════════════════════════
   §2 — SUBCOMPONENTS
   ═══════════════════════════════════════════════════════════ */

/* ── Word Selector ── */
function WordSelector({ selected, onSelect }: { selected: number; onSelect: (i: number) => void }) {
    return (
        <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-[13px] text-white/25 mr-1 font-semibold">Query word:</span>
            {SENTENCE.map((w, i) => {
                const active = i === selected;
                const c = WORD_COLORS[i];
                return (
                    <motion.button
                        key={i}
                        onClick={() => onSelect(i)}
                        className="px-3 py-1.5 rounded-xl text-[14px] font-bold border transition-all"
                        style={{
                            backgroundColor: active ? `${c}15` : "rgba(255,255,255,0.02)",
                            borderColor: active ? `${c}50` : "rgba(255,255,255,0.06)",
                            color: active ? c : "rgba(255,255,255,0.3)",
                            boxShadow: active ? `0 0 24px -4px ${c}40, inset 0 0 12px ${c}08` : "none",
                        }}
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        {w}
                    </motion.button>
                );
            })}
        </div>
    );
}

/* ── Head Selector ── */
function HeadSelector({ selected, onSelect }: { selected: number; onSelect: (i: number) => void }) {
    return (
        <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-[13px] text-white/25 mr-1 font-semibold">Focus head:</span>
            {HEAD_NAMES.map((name, i) => {
                const active = i === selected;
                const c = HEAD_COLORS[i];
                return (
                    <motion.button
                        key={i}
                        onClick={() => onSelect(i)}
                        className="px-2.5 py-1.5 rounded-xl text-[13px] font-bold border transition-all"
                        style={{
                            backgroundColor: active ? `${c}15` : "rgba(255,255,255,0.02)",
                            borderColor: active ? `${c}45` : "rgba(255,255,255,0.06)",
                            color: active ? c : "rgba(255,255,255,0.25)",
                            boxShadow: active ? `0 0 18px -4px ${c}35` : "none",
                        }}
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style={{ background: c, boxShadow: active ? `0 0 6px ${c}60` : "none" }} />
                        {name}
                    </motion.button>
                );
            })}
        </div>
    );
}

/* ── Stage Navigator ── */
function StageNav({ current, onSelect }: { current: number; onSelect: (i: number) => void }) {
    return (
        <div className="flex items-center justify-center gap-0.5 flex-wrap">
            {STAGES.map((s, i) => {
                const isCurrent = i === current;
                const isPast = i < current;
                const c = s.color;
                return (
                    <div key={s.id} className="flex items-center">
                        {i > 0 && (
                            <div
                                className="w-2 sm:w-4 h-px shrink-0"
                                style={{ background: isPast || isCurrent ? `${c}40` : "rgba(255,255,255,0.04)" }}
                            />
                        )}
                        <button
                            onClick={() => onSelect(i)}
                            className="px-2 sm:px-3 py-1 rounded-full text-[13px] font-bold whitespace-nowrap transition-all"
                            style={{
                                background: isCurrent
                                    ? `linear-gradient(135deg, ${c}25, ${c}0a)`
                                    : isPast ? `${c}0c` : "rgba(255,255,255,0.015)",
                                border: `1.5px solid ${isCurrent ? `${c}60` : isPast ? `${c}20` : "rgba(255,255,255,0.04)"}`,
                                color: isCurrent || isPast ? c : "rgba(255,255,255,0.15)",
                                boxShadow: isCurrent ? `0 0 16px -3px ${c}35` : "none",
                            }}
                        >
                            {s.label}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

/* ── Embedding Display ── */
function EmbeddingDisplay({ wordIdx }: { wordIdx: number }) {
    const emb = EMBEDDINGS[wordIdx];
    const word = SENTENCE[wordIdx];
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-[15px] font-semibold" style={{ color: WORD_COLORS[wordIdx] }}>
                    &quot;{word}&quot; → {D_MODEL}-dimensional embedding
                </p>
                <span className="text-[13px] text-white/20 font-mono">d_model = {D_MODEL}</span>
            </div>
            {/* Full vector */}
            <div className="flex items-center justify-center gap-1 flex-wrap">
                {emb.map((v, d) => {
                    const group = FEATURE_GROUPS.find(g => g.dims.includes(d))!;
                    return (
                        <motion.span
                            key={d}
                            className="px-2 py-1.5 rounded-md text-[13px] font-mono font-bold"
                            style={{
                                background: `${group.color}12`,
                                border: `1px solid ${group.color}25`,
                                color: group.color,
                            }}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: d * 0.04 }}
                        >
                            {fmt(v)}
                        </motion.span>
                    );
                })}
            </div>
            {/* Feature group legend */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
                {FEATURE_GROUPS.map(g => (
                    <div key={g.label} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: g.color }} />
                        <span className="text-[13px] font-semibold" style={{ color: `${g.color}80` }}>
                            {g.label} [d{g.dims[0]}-d{g.dims[1]}]
                        </span>
                    </div>
                ))}
            </div>
            <p className="text-[13px] text-white/25 text-center leading-relaxed">
                Each word becomes a list of numbers. Different dimensions encode different aspects of the word.
            </p>
        </div>
    );
}

/* ── Head Split Display ── */
function HeadSplitDisplay({ wordIdx, activeHead }: { wordIdx: number; activeHead: number }) {
    const emb = EMBEDDINGS[wordIdx];
    return (
        <div className="space-y-3">
            <p className="text-[15px] font-semibold text-white/50">
                Split embedding into {N_HEADS} heads — each gets {D_HEAD} dimensions
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Array.from({ length: N_HEADS }, (_, hi) => {
                    const isActive = hi === activeHead;
                    const c = HEAD_COLORS[hi];
                    const dims = [hi * D_HEAD, hi * D_HEAD + 1];
                    const vals = dims.map(d => emb[d]);
                    return (
                        <motion.div
                            key={hi}
                            className="rounded-xl p-3 text-center"
                            style={{
                                background: isActive ? `${c}10` : "rgba(255,255,255,0.02)",
                                border: isActive ? `1.5px solid ${c}40` : "1.5px solid rgba(255,255,255,0.05)",
                                boxShadow: isActive ? `0 0 24px -6px ${c}30` : "none",
                                backdropFilter: "blur(6px)",
                            }}
                            animate={{ scale: isActive ? 1.02 : 1 }}
                        >
                            <div className="flex items-center justify-center gap-1.5 mb-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: c, boxShadow: isActive ? `0 0 6px ${c}60` : "none" }} />
                                <span className="text-[13px] font-bold" style={{ color: c }}>
                                    Head {hi + 1}
                                </span>
                            </div>
                            <p className="text-[13px] text-white/25 mb-1.5">{HEAD_NAMES[hi]}</p>
                            <div className="flex justify-center gap-1">
                                {vals.map((v, j) => (
                                    <span key={j} className="px-2 py-1 rounded-md text-[13px] font-mono font-bold"
                                        style={{ background: `${c}15`, color: c }}>
                                        {fmt(v)}
                                    </span>
                                ))}
                            </div>
                            <p className="text-[11px] text-white/15 mt-1.5">
                                Q{hi + 1}, K{hi + 1}, V{hi + 1} × d_head={D_HEAD}
                            </p>
                        </motion.div>
                    );
                })}
            </div>
            <p className="text-[13px] text-white/25 text-center leading-relaxed">
                Each head transforms its slice through its own Q, K, V weight matrices — learning different projections.
            </p>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   §3 — ATTENTION FLOW SVG (BertViz-inspired)
   ═══════════════════════════════════════════════════════════ */

const FLOW_W = 560;
const FLOW_H = 260;
const WORD_Y_START = 35;
const WORD_SPACING = 44;
const LEFT_X = 65;
const RIGHT_X = 490;

function AttentionFlowSVG({ wordIdx, headIdx }: { wordIdx: number; headIdx: number }) {
    const weights = ATTN_WEIGHTS[headIdx][wordIdx];
    const maxW = Math.max(...weights);
    const headColor = HEAD_COLORS[headIdx];

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-[15px] font-semibold" style={{ color: headColor }}>
                    Head {headIdx + 1} ({HEAD_NAMES[headIdx]}) — attention from &quot;{SENTENCE[wordIdx]}&quot;
                </p>
                <span className="text-[13px] text-white/20 font-mono">
                    Q·Kᵀ / √d_k → softmax
                </span>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden p-2" style={{ backdropFilter: "blur(6px)" }}>
                <svg viewBox={`0 0 ${FLOW_W} ${FLOW_H}`} className="w-full" style={{ minHeight: 180 }}>
                    <defs>
                        <filter id={`flow-glow-${headIdx}`}>
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    </defs>

                    {/* Left column: Query word (highlighted) + other words */}
                    {SENTENCE.map((w, i) => {
                        const y = WORD_Y_START + i * WORD_SPACING;
                        const isQuery = i === wordIdx;
                        return (
                            <g key={`left-${i}`}>
                                <motion.rect
                                    x={10} y={y - 14} width={100} height={28} rx={7}
                                    fill={isQuery ? headColor : "white"}
                                    stroke={isQuery ? headColor : "white"}
                                    strokeWidth={isQuery ? 1.5 : 0.5}
                                    animate={{
                                        fillOpacity: isQuery ? 0.15 : 0.02,
                                        strokeOpacity: isQuery ? 0.5 : 0.05,
                                    }}
                                />
                                <text
                                    x={60} y={y + 5}
                                    textAnchor="middle" fontSize={12}
                                    fontFamily="ui-monospace, monospace" fontWeight={isQuery ? "bold" : "normal"}
                                    fill={isQuery ? headColor : "white"}
                                    fillOpacity={isQuery ? 0.95 : 0.3}
                                >
                                    {w}
                                </text>
                                {isQuery && (
                                    <text x={60} y={y + 18} textAnchor="middle" fontSize={9}
                                        fill={headColor} fillOpacity={0.45}
                                        fontFamily="ui-monospace, monospace">
                                        Query
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Right column: Key words */}
                    {SENTENCE.map((w, i) => {
                        const y = WORD_Y_START + i * WORD_SPACING;
                        const weight = weights[i];
                        const isStrong = weight >= maxW * 0.6;
                        return (
                            <g key={`right-${i}`}>
                                <motion.rect
                                    x={RIGHT_X - 50} y={y - 14} width={100} height={28} rx={7}
                                    fill={headColor} stroke={headColor}
                                    strokeWidth={isStrong ? 1.5 : 0.5}
                                    animate={{
                                        fillOpacity: isStrong ? 0.14 : 0.03,
                                        strokeOpacity: isStrong ? 0.45 : 0.06,
                                    }}
                                />
                                <text
                                    x={RIGHT_X} y={y + 5}
                                    textAnchor="middle" fontSize={12}
                                    fontFamily="ui-monospace, monospace"
                                    fontWeight={isStrong ? "bold" : "normal"}
                                    fill={isStrong ? headColor : "white"}
                                    fillOpacity={isStrong ? 0.9 : 0.25}
                                >
                                    {w}
                                </text>
                                {/* Weight percentage */}
                                <text
                                    x={RIGHT_X + 60} y={y + 5}
                                    textAnchor="start" fontSize={11}
                                    fontFamily="ui-monospace, monospace" fontWeight="bold"
                                    fill={headColor}
                                    fillOpacity={isStrong ? 0.8 : 0.2}
                                >
                                    {Math.round(weight * 100)}%
                                </text>
                            </g>
                        );
                    })}

                    {/* BertViz-style curved attention lines + animated particles */}
                    {SENTENCE.map((_, ki) => {
                        const qy = WORD_Y_START + wordIdx * WORD_SPACING;
                        const ky = WORD_Y_START + ki * WORD_SPACING;
                        const weight = weights[ki];
                        const thickness = clamp(weight * 14, 0.5, 10);
                        const opacity = clamp(weight * 0.85, 0.03, 0.65);
                        const midX = (LEFT_X + 55 + RIGHT_X - 50) / 2;
                        const cpOffset = (ki - wordIdx) * 10;
                        const pathD = `M ${LEFT_X + 55} ${qy} C ${midX + cpOffset} ${qy}, ${midX - cpOffset} ${ky}, ${RIGHT_X - 50} ${ky}`;

                        return (
                            <g key={`line-${ki}`}>
                                <motion.path
                                    d={pathD}
                                    fill="none"
                                    stroke={headColor}
                                    strokeWidth={thickness}
                                    strokeLinecap="round"
                                    filter={weight > 0.25 ? `url(#flow-glow-${headIdx})` : undefined}
                                    initial={{ strokeOpacity: 0, pathLength: 0 }}
                                    animate={{ strokeOpacity: opacity, pathLength: 1 }}
                                    transition={{ duration: 0.5, delay: ki * 0.08 }}
                                />
                                {/* Animated particle pulse */}
                                {weight > 0.08 && (
                                    <motion.circle
                                        r={Math.max(2, (weight / maxW) * 5)}
                                        fill={headColor}
                                        initial={{ offsetDistance: "0%", opacity: 0.8 }}
                                        animate={{ offsetDistance: "100%", opacity: 0 }}
                                        transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.8, delay: ki * 0.2 }}
                                        style={{ offsetPath: `path("${pathD}")` } as React.CSSProperties}
                                    />
                                )}
                            </g>
                        );
                    })}

                    {/* Column labels */}
                    <text x={60} y={FLOW_H - 6} textAnchor="middle" fontSize={9}
                        fontFamily="ui-monospace, monospace" fill="white" fillOpacity={0.15}>
                        Query (Q)
                    </text>
                    <text x={RIGHT_X} y={FLOW_H - 6} textAnchor="middle" fontSize={9}
                        fontFamily="ui-monospace, monospace" fill="white" fillOpacity={0.15}>
                        Keys (K)
                    </text>
                </svg>
            </div>
            <p className="text-[13px] text-white/25 text-center">
                Line thickness = attention weight. &quot;{SENTENCE[wordIdx]}&quot; attends most to{" "}
                <strong style={{ color: headColor }}>
                    &quot;{SENTENCE[weights.indexOf(maxW)]}&quot; ({Math.round(maxW * 100)}%)
                </strong>
            </p>
        </div>
    );
}

/* ── All Heads Mini Flow (4 mini BertViz panels) ── */
function AllHeadsFlowGrid({ wordIdx, activeHead, onSelectHead }: {
    wordIdx: number; activeHead: number; onSelectHead: (h: number) => void;
}) {
    return (
        <div className="space-y-2">
            <p className="text-[13px] text-white/30 text-center font-medium">
                All 4 heads — each sees different relationships. Click to focus.
            </p>
            <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: N_HEADS }, (_, hi) => {
                    const weights = ATTN_WEIGHTS[hi][wordIdx];
                    const maxW = Math.max(...weights);
                    const isActive = hi === activeHead;
                    const color = HEAD_COLORS[hi];
                    return (
                        <motion.button
                            key={hi}
                            onClick={() => onSelectHead(hi)}
                            className="rounded-xl p-3 text-left transition-all"
                            style={{
                                background: isActive
                                    ? `linear-gradient(135deg, ${color}10, ${color}06)`
                                    : "rgba(255,255,255,0.015)",
                                border: isActive
                                    ? `1.5px solid ${color}40`
                                    : "1.5px solid rgba(255,255,255,0.04)",
                                boxShadow: isActive ? `0 0 24px -6px ${color}25` : "none",
                                backdropFilter: "blur(6px)",
                            }}
                            whileTap={{ scale: 0.98 }}
                            whileHover={{ scale: 1.01 }}
                        >
                            <div className="flex items-center gap-1.5 mb-2">
                                <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ background: color, boxShadow: isActive ? `0 0 8px ${color}60` : "none" }}
                                />
                                <span className="text-[13px] font-bold" style={{ color }}>
                                    H{hi + 1} — {HEAD_NAMES[hi]}
                                </span>
                            </div>
                            {/* Mini BertViz — wider viewBox for full word labels */}
                            <svg viewBox="0 0 200 90" className="w-full" style={{ minHeight: 60 }}>
                                <defs>
                                    <filter id={`mini-glow-${hi}`}>
                                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                    </filter>
                                </defs>
                                {/* Bezier curves */}
                                {SENTENCE.map((_, ki) => {
                                    const qy = 10 + wordIdx * 16;
                                    const ky = 10 + ki * 16;
                                    const weight = weights[ki];
                                    const thick = clamp(weight * 8, 0.4, 6);
                                    const op = clamp(weight * 0.8, 0.03, 0.6);
                                    const midX = 100;
                                    const cpOff = (ki - wordIdx) * 6;
                                    return (
                                        <motion.path
                                            key={ki}
                                            d={`M 52 ${qy} C ${midX + cpOff} ${qy}, ${midX - cpOff} ${ky}, 148 ${ky}`}
                                            fill="none"
                                            stroke={color}
                                            strokeWidth={thick}
                                            strokeLinecap="round"
                                            filter={weight > 0.3 ? `url(#mini-glow-${hi})` : undefined}
                                            initial={{ strokeOpacity: 0 }}
                                            animate={{ strokeOpacity: op }}
                                            transition={{ delay: ki * 0.04 }}
                                        />
                                    );
                                })}
                                {/* Word labels */}
                                {SENTENCE.map((w, i) => (
                                    <g key={`lbl-${i}`}>
                                        <text x={48} y={13 + i * 16} textAnchor="end" fontSize={9}
                                            fontFamily="ui-monospace, monospace"
                                            fontWeight={i === wordIdx ? "bold" : "normal"}
                                            fill={i === wordIdx ? color : "white"}
                                            fillOpacity={i === wordIdx ? 0.85 : 0.2}>
                                            {w}
                                        </text>
                                        <text x={152} y={13 + i * 16} textAnchor="start" fontSize={9}
                                            fontFamily="ui-monospace, monospace"
                                            fontWeight={weights[i] >= maxW * 0.6 ? "bold" : "normal"}
                                            fill={weights[i] >= maxW * 0.6 ? color : "white"}
                                            fillOpacity={weights[i] >= maxW * 0.6 ? 0.85 : 0.2}>
                                            {w}
                                        </text>
                                    </g>
                                ))}
                            </svg>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

/* ── Head Output Display ── */
function HeadOutputDisplay({ wordIdx, activeHead }: { wordIdx: number; activeHead: number }) {
    return (
        <div className="space-y-3">
            <p className="text-[15px] font-semibold text-white/50">
                Each head produces a {D_HEAD}-dim output for &quot;{SENTENCE[wordIdx]}&quot;
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Array.from({ length: N_HEADS }, (_, hi) => {
                    const isActive = hi === activeHead;
                    const c = HEAD_COLORS[hi];
                    const out = HEAD_OUTPUTS[hi][wordIdx];
                    const weights = ATTN_WEIGHTS[hi][wordIdx];
                    const topIdx = weights.indexOf(Math.max(...weights));
                    return (
                        <motion.div
                            key={hi}
                            className="rounded-xl p-3"
                            style={{
                                background: isActive ? `${c}10` : "rgba(255,255,255,0.02)",
                                border: isActive ? `1.5px solid ${c}40` : "1.5px solid rgba(255,255,255,0.04)",
                                boxShadow: isActive ? `0 0 20px -6px ${c}25` : "none",
                                backdropFilter: "blur(6px)",
                            }}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: hi * 0.08 }}
                        >
                            <div className="flex items-center gap-1.5 mb-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: c, boxShadow: isActive ? `0 0 6px ${c}60` : "none" }} />
                                <span className="text-[13px] font-bold" style={{ color: c }}>
                                    H{hi + 1}
                                </span>
                            </div>
                            <div className="flex justify-center gap-1 mb-1.5">
                                {out.map((v, j) => (
                                    <span key={j} className="px-2 py-1 rounded-md text-[13px] font-mono font-bold"
                                        style={{ background: `${c}15`, color: c }}>
                                        {fmt(v)}
                                    </span>
                                ))}
                            </div>
                            <p className="text-[13px] text-white/20 text-center">
                                Focused on &quot;{SENTENCE[topIdx]}&quot;
                            </p>
                        </motion.div>
                    );
                })}
            </div>
            <p className="text-[13px] text-white/25 text-center leading-relaxed">
                Each output is a weighted blend of value vectors, shaped by that head&apos;s attention pattern.
            </p>
        </div>
    );
}

/* ── Concat + Project Display ── */
function ConcatProjectDisplay({ wordIdx }: { wordIdx: number }) {
    const concat = HEAD_OUTPUTS.flatMap(h => h[wordIdx]);
    const final = FINAL_OUTPUTS[wordIdx];
    return (
        <div className="space-y-4">
            <p className="text-[15px] font-semibold text-amber-400/70">
                Concatenate all head outputs → project back to d_model
            </p>
            {/* Concat vector */}
            <div className="space-y-1.5">
                <p className="text-[13px] text-white/25 text-center font-mono">
                    Concat: [{N_HEADS} heads × {D_HEAD} dim = {N_HEADS * D_HEAD} values]
                </p>
                <div className="flex items-center justify-center gap-1 flex-wrap">
                    {concat.map((v, i) => {
                        const hi = Math.floor(i / D_HEAD);
                        return (
                            <motion.span
                                key={i}
                                className="px-2 py-1 rounded-md text-[13px] font-mono font-bold"
                                style={{
                                    background: `${HEAD_COLORS[hi]}12`,
                                    border: `1px solid ${HEAD_COLORS[hi]}25`,
                                    color: HEAD_COLORS[hi],
                                }}
                                initial={{ opacity: 0, y: -6 - hi * 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03, type: "spring" }}
                            >
                                {v.toFixed(2)}
                            </motion.span>
                        );
                    })}
                </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center gap-2">
                <motion.span
                    className="text-emerald-400/50 text-[14px] font-bold font-mono"
                    animate={{ opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    × W_O →
                </motion.span>
            </div>

            {/* Final projected */}
            <div className="space-y-1.5">
                <p className="text-[13px] text-white/25 text-center font-mono">
                    Output: [d_model = {D_MODEL}]
                </p>
                <div className="flex items-center justify-center gap-1 flex-wrap">
                    {final.map((v, d) => {
                        const group = FEATURE_GROUPS.find(g => g.dims.includes(d))!;
                        return (
                            <motion.span
                                key={d}
                                className="px-2 py-1.5 rounded-md text-[13px] font-mono font-bold"
                                style={{
                                    background: `${group.color}15`,
                                    border: `1px solid ${group.color}30`,
                                    color: group.color,
                                }}
                                initial={{ opacity: 0, scale: 0.7 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 + d * 0.05, type: "spring" }}
                            >
                                {fmt(v)}
                            </motion.span>
                        );
                    })}
                </div>
            </div>

            <p className="text-[13px] text-white/25 text-center leading-relaxed">
                W_O learns which combinations of head outputs are most useful — compressing {N_HEADS * D_HEAD} dims back to {D_MODEL}.
            </p>
        </div>
    );
}

/* ── Final Output Comparison ── */
function FinalComparisonDisplay({ wordIdx }: { wordIdx: number }) {
    const before = EMBEDDINGS[wordIdx];
    const after = FINAL_OUTPUTS[wordIdx];
    const word = SENTENCE[wordIdx];
    const wc = WORD_COLORS[wordIdx];

    /* Compute which dimensions changed most */
    const diffs = before.map((v, i) => Math.abs(after[i] - v));
    const maxDiff = Math.max(...diffs);

    return (
        <div className="space-y-4">
            <p className="text-[15px] font-semibold text-pink-400/70">
                &quot;{word}&quot; before vs after multi-head attention
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Before */}
                <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(6px)" }}>
                    <p className="text-[13px] text-white/30 font-semibold mb-2.5 text-center">Before (raw embedding)</p>
                    <div className="flex flex-wrap justify-center gap-1">
                        {before.map((v, d) => {
                            const group = FEATURE_GROUPS.find(g => g.dims.includes(d))!;
                            return (
                                <span key={d} className="px-1.5 py-1 rounded-md text-[13px] font-mono"
                                    style={{ background: `${group.color}08`, color: `${group.color}60` }}>
                                    {fmt(v)}
                                </span>
                            );
                        })}
                    </div>
                </div>
                {/* After — with celebration glow */}
                <div className="relative rounded-xl p-4 overflow-hidden" style={{ background: "rgba(244,114,182,0.05)", border: "1.5px solid rgba(244,114,182,0.2)", backdropFilter: "blur(6px)" }}>
                    {/* Pulsing glow */}
                    <motion.div
                        className="absolute inset-0 rounded-xl"
                        style={{ background: `radial-gradient(circle at center, ${wc}10, transparent 70%)` }}
                        animate={{ opacity: [0.2, 0.5, 0.2] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <p className="relative text-[13px] text-pink-400/60 font-semibold mb-2.5 text-center">After (contextualized)</p>
                    <div className="relative flex flex-wrap justify-center gap-1">
                        {after.map((v, d) => {
                            const group = FEATURE_GROUPS.find(g => g.dims.includes(d))!;
                            const changePct = diffs[d] / (maxDiff || 1);
                            return (
                                <motion.span
                                    key={d}
                                    className="px-1.5 py-1 rounded-md text-[13px] font-mono font-bold"
                                    style={{
                                        background: `${group.color}${changePct > 0.5 ? "20" : "10"}`,
                                        color: group.color,
                                        border: changePct > 0.5 ? `1px solid ${group.color}40` : `1px solid ${group.color}15`,
                                        boxShadow: changePct > 0.7 ? `0 0 8px ${group.color}20` : "none",
                                    }}
                                    initial={{ opacity: 0, scale: 0.85 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: d * 0.06, type: "spring" }}
                                >
                                    {fmt(v)}
                                </motion.span>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Change bars */}
            <div className="space-y-1.5 max-w-md mx-auto">
                <p className="text-[13px] text-white/25 text-center font-semibold">Dimension changes</p>
                {FEATURE_GROUPS.map(g => {
                    const avgChange = g.dims.reduce((s, d) => s + diffs[d], 0) / g.dims.length;
                    const barW = (avgChange / (maxDiff || 1)) * 100;
                    return (
                        <div key={g.label} className="flex items-center gap-2">
                            <span className="text-[13px] font-mono w-16 text-right font-semibold" style={{ color: `${g.color}70` }}>
                                {g.label}
                            </span>
                            <div className="flex-1 h-3 rounded-sm bg-white/[0.03] overflow-hidden">
                                <motion.div
                                    className="h-full rounded-sm"
                                    style={{ background: g.color }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${barW}%`, opacity: 0.5 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                />
                            </div>
                            <span className="text-[13px] font-mono w-10" style={{ color: `${g.color}60` }}>
                                {(avgChange * 100).toFixed(0)}%
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Verdict with gradient text */}
            <motion.p
                className="text-[15px] font-bold text-center mt-2"
                style={{
                    background: `linear-gradient(90deg, ${wc}, #f472b6, #34d399)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, type: "spring" }}
            >
                &quot;{word}&quot; is now contextualized — enriched by what every head discovered.
            </motion.p>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   §4 — HERO PIPELINE: Compact CSS-based architecture overview
   ═══════════════════════════════════════════════════════════ */

const PIPELINE_NODES = [
    { id: "embed", label: "Embed", sub: "d₈", stageIdx: 0, color: "#94a3b8" },
    { id: "heads", label: "×4 Heads", sub: "Q·K·V", stageIdx: 1, color: "#22d3ee" },
    { id: "attn", label: "Attention", sub: "softmax", stageIdx: 2, color: "#f472b6" },
    { id: "output", label: "Outputs", sub: "4×d₂", stageIdx: 3, color: "#fbbf24" },
    { id: "concat", label: "Concat", sub: "→ W_O", stageIdx: 4, color: "#34d399" },
    { id: "final", label: "Output", sub: "d₈", stageIdx: 5, color: "#f472b6" },
];

function HeroPipeline({ stage, wordIdx, headIdx }: {
    stage: number; wordIdx: number; headIdx: number;
}) {
    return (
        <div
            className="rounded-2xl p-4 sm:p-5"
            style={{
                background: "linear-gradient(90deg, rgba(255,255,255,0.01), rgba(255,255,255,0.025), rgba(255,255,255,0.01))",
                border: "1px solid rgba(255,255,255,0.05)",
                backdropFilter: "blur(8px)",
            }}
        >
            {/* Word chip */}
            <div className="flex items-center justify-center mb-4">
                <motion.div
                    className="px-4 py-1.5 rounded-full text-[14px] font-bold font-mono"
                    style={{
                        background: `${WORD_COLORS[wordIdx]}12`,
                        border: `1.5px solid ${WORD_COLORS[wordIdx]}35`,
                        color: WORD_COLORS[wordIdx],
                        boxShadow: `0 0 24px -4px ${WORD_COLORS[wordIdx]}25`,
                    }}
                    key={wordIdx}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                >
                    &quot;{SENTENCE[wordIdx]}&quot;
                </motion.div>
            </div>

            {/* Pipeline strip */}
            <div className="flex items-center justify-center gap-0">
                {PIPELINE_NODES.map((node, ni) => {
                    const isActive = stage >= node.stageIdx;
                    const isCurrent = stage === node.stageIdx;
                    const c = node.color;

                    /* For the heads node, show 4 mini dots */
                    const isHeadsNode = node.stageIdx === 1 || node.stageIdx === 2 || node.stageIdx === 3;

                    return (
                        <div key={node.id} className="flex items-center">
                            {/* Connector line */}
                            {ni > 0 && (
                                <motion.div
                                    className="h-px w-3 sm:w-6"
                                    animate={{
                                        background: isActive
                                            ? `linear-gradient(90deg, ${PIPELINE_NODES[ni - 1].color}45, ${c}45)`
                                            : "rgba(255,255,255,0.04)",
                                    }}
                                    transition={{ duration: 0.3 }}
                                />
                            )}

                            {/* Node */}
                            <motion.div
                                className="relative flex flex-col items-center"
                                animate={{ y: isCurrent ? -3 : 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            >
                                {/* Glow ring */}
                                {isCurrent && (
                                    <motion.div
                                        className="absolute -inset-2 rounded-xl"
                                        style={{ border: `1px solid ${c}40`, boxShadow: `0 0 24px -4px ${c}50` }}
                                        animate={{ opacity: [0.15, 0.4, 0.15] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                )}
                                <div
                                    className="relative px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl flex flex-col items-center min-w-[48px] sm:min-w-[68px]"
                                    style={{
                                        background: isActive
                                            ? `linear-gradient(135deg, ${c}${isCurrent ? "1c" : "0a"}, ${c}${isCurrent ? "10" : "04"})`
                                            : "rgba(255,255,255,0.015)",
                                        border: `1.5px solid ${isActive ? `${c}${isCurrent ? "45" : "1a"}` : "rgba(255,255,255,0.04)"}`,
                                    }}
                                >
                                    {/* Head dots for head-related stages */}
                                    {isHeadsNode && isActive && (
                                        <div className="flex gap-1 mb-1">
                                            {HEAD_COLORS.map((hc, hi) => (
                                                <motion.div
                                                    key={hi}
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ background: hc }}
                                                    animate={{
                                                        opacity: (stage >= 1 && stage <= 3 && hi === headIdx) ? 1 : 0.3,
                                                        scale: (stage >= 1 && stage <= 3 && hi === headIdx) ? 1.4 : 1,
                                                    }}
                                                    transition={{ type: "spring", stiffness: 400 }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                    <span
                                        className="text-[11px] sm:text-[13px] font-bold leading-none"
                                        style={{ color: isActive ? c : "rgba(255,255,255,0.15)" }}
                                    >
                                        {node.label}
                                    </span>
                                    <span
                                        className="text-[9px] leading-none mt-1 font-mono"
                                        style={{ color: isActive ? `${c}65` : "rgba(255,255,255,0.06)" }}
                                    >
                                        {node.sub}
                                    </span>
                                </div>
                            </motion.div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   §5 — MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function MultiHeadArchitectureViz() {
    const [stage, setStage] = useState(0);
    const [wordIdx, setWordIdx] = useState(1); // "professor"
    const [headIdx, setHeadIdx] = useState(0);
    const [autoPlay, setAutoPlay] = useState(false);
    const [speed, setSpeed] = useState<PlaySpeed>("normal");
    const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleNext = useCallback(() => setStage(s => Math.min(s + 1, STAGES.length - 1)), []);
    const handleReset = useCallback(() => { setStage(0); setAutoPlay(false); }, []);

    /* Auto-play logic */
    useEffect(() => {
        if (autoRef.current) clearTimeout(autoRef.current);
        if (!autoPlay) return;
        if (stage >= STAGES.length - 1) { setAutoPlay(false); return; }
        autoRef.current = setTimeout(() => handleNext(), SPEED_MS[speed]);
        return () => { if (autoRef.current) clearTimeout(autoRef.current); };
    }, [autoPlay, stage, speed, handleNext]);

    const toggleAuto = useCallback(() => {
        if (autoPlay) { setAutoPlay(false); }
        else { if (stage >= STAGES.length - 1) { setStage(0); } setAutoPlay(true); }
    }, [autoPlay, stage]);

    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{
                background: "linear-gradient(135deg, rgba(34,211,238,0.03), rgba(139,92,246,0.02))",
                border: "1px solid rgba(255,255,255,0.06)",
                minHeight: 600,
            }}
        >
            {/* ═══ Premium header bar ═══ */}
            <div
                className="px-5 py-3 flex items-center gap-3 flex-wrap"
                style={{
                    background: "linear-gradient(90deg, rgba(34,211,238,0.06), rgba(139,92,246,0.03))",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
            >
                <div className="w-2 h-2 rounded-full bg-cyan-400" style={{ boxShadow: "0 0 8px rgba(34,211,238,0.5)" }} />
                <span className="text-[13px] font-semibold text-white/50">Multi-Head Attention Architecture</span>
                <span className="text-[13px] font-mono text-white/15 ml-auto">⭐ flagship</span>
            </div>

            <div className="py-5 sm:py-6 px-3 sm:px-5 space-y-4">
                {/* ═══ Controls ═══ */}
                <div className="space-y-2">
                    <WordSelector selected={wordIdx} onSelect={setWordIdx} />
                    {stage >= 1 && stage <= 3 && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                            <HeadSelector selected={headIdx} onSelect={setHeadIdx} />
                        </motion.div>
                    )}
                </div>

                {/* Stage navigator + Auto/Speed */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <StageNav current={stage} onSelect={(i) => { setAutoPlay(false); setStage(i); }} />

                    <div className="flex items-center gap-2">
                        <motion.button
                            onClick={toggleAuto}
                            whileTap={{ scale: 0.95 }}
                            className="px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all"
                            style={{
                                background: autoPlay
                                    ? "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(34,211,238,0.05))"
                                    : "rgba(255,255,255,0.03)",
                                color: autoPlay ? "#22d3ee" : "rgba(255,255,255,0.3)",
                                border: `1.5px solid ${autoPlay ? "rgba(34,211,238,0.3)" : "rgba(255,255,255,0.06)"}`,
                            }}
                        >
                            {autoPlay ? "⏸ Pause" : "▶ Auto"}
                        </motion.button>
                        <div className="flex items-center gap-0.5">
                            {(["slow", "normal", "fast"] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setSpeed(s)}
                                    className="px-2 py-1 rounded-md text-[13px] font-semibold transition-all"
                                    style={{
                                        background: speed === s ? "rgba(255,255,255,0.06)" : "transparent",
                                        color: speed === s ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)",
                                    }}
                                >
                                    {s === "slow" ? "🐢" : s === "normal" ? "🚶" : "⚡"}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Hero pipeline overview */}
                <HeroPipeline stage={stage} wordIdx={wordIdx} headIdx={headIdx} />

                {/* Detail panel — glass-morphism */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${stage}-${wordIdx}-${headIdx}`}
                        className="rounded-2xl p-4 sm:p-5"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            minHeight: 200,
                            background: "linear-gradient(135deg, rgba(255,255,255,0.025), rgba(255,255,255,0.008))",
                            border: "1px solid rgba(255,255,255,0.06)",
                            backdropFilter: "blur(8px)",
                        }}
                    >
                        {stage === 0 && <EmbeddingDisplay wordIdx={wordIdx} />}
                        {stage === 1 && <HeadSplitDisplay wordIdx={wordIdx} activeHead={headIdx} />}
                        {stage === 2 && (
                            <div className="space-y-4">
                                <AttentionFlowSVG wordIdx={wordIdx} headIdx={headIdx} />
                                <AllHeadsFlowGrid wordIdx={wordIdx} activeHead={headIdx} onSelectHead={setHeadIdx} />
                            </div>
                        )}
                        {stage === 3 && <HeadOutputDisplay wordIdx={wordIdx} activeHead={headIdx} />}
                        {stage === 4 && <ConcatProjectDisplay wordIdx={wordIdx} />}
                        {stage === 5 && <FinalComparisonDisplay wordIdx={wordIdx} />}
                    </motion.div>
                </AnimatePresence>

                {/* ═══ Navigation ═══ */}
                <div className="flex items-center justify-between pt-2">
                    <button onClick={handleReset}
                        className="text-[13px] text-white/20 hover:text-white/40 transition-colors font-mono">
                        ↻ Reset
                    </button>
                    <div className="flex gap-1.5">
                        {STAGES.map((s, i) => (
                            <motion.div key={i}
                                className="rounded-full cursor-pointer"
                                style={{
                                    width: i === stage ? 20 : 8,
                                    height: 8,
                                    background: i === stage ? s.color : i < stage ? `${s.color}50` : "rgba(255,255,255,0.06)",
                                    boxShadow: i === stage ? `0 0 8px ${s.color}40` : "none",
                                }}
                                layout
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                onClick={() => { setAutoPlay(false); setStage(i); }}
                            />
                        ))}
                    </div>
                    <div className="flex gap-2">
                        {stage > 0 && (
                            <motion.button
                                onClick={() => { setAutoPlay(false); setStage(s => Math.max(s - 1, 0)); }}
                                className="px-4 py-2 rounded-xl text-[13px] font-bold border bg-white/[0.02] border-white/[0.08] text-white/30 hover:text-white/50 hover:border-white/15 transition-all"
                                whileTap={{ scale: 0.95 }}
                                whileHover={{ scale: 1.02 }}
                            >
                                ← Back
                            </motion.button>
                        )}
                        {stage < STAGES.length - 1 ? (
                            <motion.button
                                onClick={() => { setAutoPlay(false); handleNext(); }}
                                className="px-4 py-2 rounded-xl text-[13px] font-bold border transition-all"
                                style={{
                                    background: `linear-gradient(135deg, ${STAGES[stage + 1].color}18, ${STAGES[stage + 1].color}08)`,
                                    borderColor: `${STAGES[stage + 1].color}40`,
                                    color: STAGES[stage + 1].color,
                                    boxShadow: `0 0 16px -4px ${STAGES[stage + 1].color}30`,
                                }}
                                whileTap={{ scale: 0.95 }}
                                whileHover={{ scale: 1.02 }}
                            >
                                Next →
                            </motion.button>
                        ) : (
                            <motion.button
                                onClick={handleReset}
                                className="px-4 py-2 rounded-xl text-[13px] font-bold border transition-all"
                                style={{
                                    background: "linear-gradient(135deg, rgba(244,114,182,0.15), rgba(244,114,182,0.05))",
                                    borderColor: "rgba(244,114,182,0.4)",
                                    color: "#f472b6",
                                    boxShadow: "0 0 16px -4px rgba(244,114,182,0.3)",
                                }}
                                whileTap={{ scale: 0.95 }}
                                whileHover={{ scale: 1.02 }}
                            >
                                ↻ Explore Again
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* ═══ Legend ═══ */}
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
                    {HEAD_COLORS.map((c, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                            <span className="text-[13px] font-semibold" style={{ color: `${c}60` }}>
                                H{i + 1} {HEAD_NAMES[i]}
                            </span>
                        </div>
                    ))}
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-[13px] font-semibold text-emerald-400/50">Concat</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-pink-400" />
                        <span className="text-[13px] font-semibold text-pink-400/50">Output</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
