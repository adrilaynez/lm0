"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  V26 — FullScoringPipelineViz ⭐⭐⭐ (v4 — FLAGSHIP)

  THE visual centerpiece of the Transformer chapter.
  Complete single-head attention pipeline:
  Input → Embedding → Q/K/V → Q·Kᵀ → ÷√d → Softmax → ×V → Σ Output

  Quality bar: bbycroft.net/llm level. Must provoke "wow."
  All font sizes ≥ 13px. Glass-morphism cards. Auto/Step modes.
*/

type PlaySpeed = "slow" | "normal" | "fast";
const SPEED_MS: Record<PlaySpeed, number> = { slow: 2800, normal: 1600, fast: 800 };

/* ═══════════════════════════════════════════════════════════
   DATA MODEL — pre-computed embeddings, Q, K, V, scores
   ═══════════════════════════════════════════════════════════ */

const SENTENCE = ["The", "king", "wore", "the", "golden", "crown"];
/* Muted word colors — selected word gets full brightness, others stay subtle */
const WORD_COLORS = ["#94a3b8", "#22d3ee", "#a78bfa", "#94a3b8", "#fbbf24", "#f472b6"];
const WORD_MUTED = "rgba(255,255,255,0.3)";
function wordColor(i: number, selected: number): string {
    return i === selected ? WORD_COLORS[i] : WORD_MUTED;
}
const FEAT_NAMES = ["royalty", "color", "action", "object"];
const DIM = 4;
const SQRT_DIM = 2; // √4

/* Embeddings (4D each) */
const EMBEDDINGS: number[][] = [
    [0.1, 0.0, 0.1, 0.2],  // The
    [0.9, 0.2, 0.3, 0.1],  // king
    [0.1, 0.1, 0.9, 0.3],  // wore
    [0.1, 0.0, 0.1, 0.2],  // the
    [0.3, 0.9, 0.1, 0.2],  // golden
    [0.8, 0.3, 0.1, 0.9],  // crown
];

/* Learned W_Q, W_K, W_V matrices (4×4) — pre-computed projections */
const Q_VECS: number[][] = [
    [0.05, 0.12, 0.08, 0.15],  // The → Q
    [0.72, 0.35, 0.68, 0.22],  // king → Q (looks for verbs, objects)
    [0.18, 0.25, 0.55, 0.42],  // wore → Q
    [0.05, 0.12, 0.08, 0.15],  // the → Q
    [0.28, 0.65, 0.15, 0.38],  // golden → Q
    [0.62, 0.42, 0.20, 0.75],  // crown → Q
];

const K_VECS: number[][] = [
    [0.10, 0.05, 0.12, 0.08],  // The → K
    [0.80, 0.15, 0.25, 0.18],  // king → K (offers royalty)
    [0.15, 0.10, 0.82, 0.35],  // wore → K (offers action)
    [0.10, 0.05, 0.12, 0.08],  // the → K
    [0.22, 0.85, 0.08, 0.30],  // golden → K (offers color)
    [0.75, 0.28, 0.12, 0.88],  // crown → K (offers royalty+object)
];

const V_VECS: number[][] = [
    [0.08, 0.05, 0.10, 0.12],  // The → V
    [0.85, 0.18, 0.20, 0.15],  // king → V
    [0.12, 0.08, 0.88, 0.28],  // wore → V
    [0.08, 0.05, 0.10, 0.12],  // the → V
    [0.20, 0.90, 0.05, 0.22],  // golden → V
    [0.82, 0.25, 0.08, 0.92],  // crown → V
];

/* ── Helper functions ── */
function dot(a: number[], b: number[]): number {
    return a.reduce((s, v, i) => s + v * b[i], 0);
}

function softmax(scores: number[]): number[] {
    const max = Math.max(...scores);
    const exps = scores.map(s => Math.exp(s - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
}

function vecScale(v: number[], s: number): number[] {
    return v.map(x => x * s);
}

function vecAdd(a: number[], b: number[]): number[] {
    return a.map((x, i) => x + b[i]);
}

/* Compute full pipeline for a given query word index */
function computePipeline(queryIdx: number) {
    const q = Q_VECS[queryIdx];
    const rawScores = SENTENCE.map((_, i) => +(dot(q, K_VECS[i])).toFixed(3));
    const scaledScores = rawScores.map(s => +(s / SQRT_DIM).toFixed(3));
    const weights = softmax(scaledScores).map(w => +w.toFixed(4));
    const scaledValues = SENTENCE.map((_, i) => vecScale(V_VECS[i], weights[i]).map(x => +x.toFixed(4)));
    const output = scaledValues.reduce((acc, sv) => vecAdd(acc, sv), [0, 0, 0, 0]).map(x => +x.toFixed(3));
    return { rawScores, scaledScores, weights, scaledValues, output };
}

/* ── Pipeline stages ── */
const STAGES = [
    { id: "embed", label: "Embedding", short: "Embed", color: "rgba(255,255,255,0.4)" },
    { id: "qkv", label: "Q / K / V", short: "Q K V", color: "rgba(255,255,255,0.4)" },
    { id: "dot", label: "Q · Kᵀ", short: "Q·K", color: "#22d3ee" },
    { id: "scale", label: "÷ √d", short: "÷√d", color: "#22d3ee" },
    { id: "softmax", label: "Softmax", short: "Soft", color: "#22d3ee" },
    { id: "blend", label: "× Value", short: "×V", color: "#fbbf24" },
    { id: "output", label: "Σ Output", short: "Σ", color: "#34d399" },
] as const;

type StageId = typeof STAGES[number]["id"];

/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════ */

/* ── Word Selector: editorial tabs ── */
function WordSelector({ words, selected, onSelect }: {
    words: string[]; selected: number; onSelect: (i: number) => void;
}) {
    return (
        <div className="flex items-center justify-center gap-5 sm:gap-7">
            <span className="text-[10px] text-white/15 uppercase tracking-widest font-semibold">Query</span>
            {words.map((w, i) => {
                const isActive = selected === i;
                return (
                    <motion.button
                        key={i}
                        onClick={() => onSelect(i)}
                        className="relative pb-1.5 text-[13px] sm:text-sm font-semibold transition-colors duration-300 cursor-pointer"
                        style={{ color: isActive ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.25)" }}
                    >
                        {w}
                        {isActive && (
                            <motion.span
                                className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full"
                                style={{ background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent)" }}
                                layoutId="fsp-word-tab"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
}

/* ── Stage Selector: minimal editorial steps ── */
function StageSelector({ stage, onSelect }: {
    stage: number; onSelect: (i: number) => void;
}) {
    return (
        <div className="flex items-center justify-center gap-1.5">
            {STAGES.map((s, i) => {
                const isCurrent = i === stage;
                const isPast = i < stage;
                return (
                    <div key={s.id} className="flex items-center gap-1.5">
                        {i > 0 && (
                            <div
                                className="w-4 sm:w-6 h-px"
                                style={{ background: isPast ? "rgba(34,211,238,0.2)" : "rgba(255,255,255,0.05)" }}
                            />
                        )}
                        <button
                            onClick={() => onSelect(i)}
                            className="px-2 sm:px-2.5 py-1 rounded text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer"
                            style={{
                                background: isCurrent ? "rgba(34,211,238,0.06)" : "transparent",
                                border: isCurrent ? "1px solid rgba(34,211,238,0.2)" : "1px solid transparent",
                                color: isCurrent ? "rgba(165,243,252,0.9)" : isPast ? "rgba(34,211,238,0.4)" : "rgba(255,255,255,0.18)",
                            }}
                        >
                            {s.short}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   FULL ARCHITECTURE FLOW — BertViz-inspired hero SVG
   Shows the complete attention pipeline in one horizontal view
   ═══════════════════════════════════════════════════════════ */

const FLOW_W = 960;
const FLOW_H = 420;
const wordY = (i: number) => 65 + i * 56;

const COL = {
    word: 50,       // Input word labels
    embed: 115,     // Embedding mini bars
    qkv: 185,       // Q/K/V branch point
    q: 230,         // Q column
    k: 230,         // K column (same x, different side)
    flowL: 260,     // BertViz curves start
    flowR: 490,     // BertViz curves end
    weight: 560,    // Attention weight bars
    vblend: 700,    // Value blend
    output: 850,    // Output word
};

/* Column labels at top */
const COL_LABELS: { x: number; label: string; color: string; minStage: number }[] = [
    { x: COL.word, label: "Input", color: "#94a3b8", minStage: 0 },
    { x: COL.embed, label: "Embedding", color: "#94a3b8", minStage: 0 },
    { x: COL.qkv, label: "Q · K · V", color: "#a78bfa", minStage: 1 },
    { x: (COL.flowL + COL.flowR) / 2, label: "Attention Flow", color: "#22d3ee", minStage: 2 },
    { x: COL.weight, label: "Weights", color: "#34d399", minStage: 4 },
    { x: COL.vblend, label: "× Value", color: "#fbbf24", minStage: 5 },
    { x: COL.output, label: "Output", color: "#f472b6", minStage: 6 },
];

function FullArchitectureFlow({ stage, selectedWord, pipeline, onSelectWord }: {
    stage: number;
    selectedWord: number;
    pipeline: ReturnType<typeof computePipeline>;
    onSelectWord: (i: number) => void;
}) {
    const { weights, output } = pipeline;
    const maxWeight = Math.max(...weights);

    return (
        <svg viewBox={`0 0 ${FLOW_W} ${FLOW_H}`} className="w-full" style={{ minHeight: 280, maxHeight: 480 }}>
            {/* SVG defs for gradients and filters */}
            <defs>
                {WORD_COLORS.map((c, i) => (
                    <linearGradient key={`grad-${i}`} id={`flow-grad-${i}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={c} stopOpacity={0.6} />
                        <stop offset="100%" stopColor={c} stopOpacity={0.15} />
                    </linearGradient>
                ))}
            </defs>

            {/* ── Background section boxes ── */}
            {stage >= 2 && (
                <motion.rect
                    x={COL.flowL - 12} y={20} width={COL.flowR - COL.flowL + 24}
                    height={FLOW_H - 40} rx={12}
                    fill="rgba(34,211,238,0.008)"
                    stroke="rgba(34,211,238,0.03)"
                    strokeWidth={0.5}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                />
            )}

            {/* ── Column labels at top ── */}
            {COL_LABELS.map((cl, i) => (
                <motion.text
                    key={i}
                    x={cl.x} y={22}
                    textAnchor="middle" fontSize={10}
                    fontFamily="ui-monospace, monospace" fontWeight="bold"
                    fill={cl.color}
                    animate={{ fillOpacity: stage >= cl.minStage ? 0.5 : 0.08 }}
                    transition={{ duration: 0.3 }}
                >
                    {cl.label}
                </motion.text>
            ))}

            {/* ── Input words (left column) ── */}
            {SENTENCE.map((word, i) => {
                const y = wordY(i);
                const isSelected = i === selectedWord;
                const color = WORD_COLORS[i];
                return (
                    <g key={`word-${i}`} style={{ cursor: "pointer" }} onClick={() => onSelectWord(i)}>
                        {/* Selection highlight */}
                        {isSelected && (
                            <>
                                <motion.rect
                                    x={COL.word - 34} y={y - 16}
                                    width={68} height={32} rx={8}
                                    fill={color} fillOpacity={0.1}
                                    stroke={color} strokeOpacity={0.3} strokeWidth={1.5}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    layoutId="word-highlight"
                                />
                            </>
                        )}
                        <text
                            x={COL.word} y={y + 5}
                            textAnchor="middle" fontSize={13}
                            fontFamily="ui-monospace, monospace" fontWeight="bold"
                            fill={color} fillOpacity={isSelected ? 1 : 0.35}
                        >
                            {word}
                        </text>
                    </g>
                );
            })}

            {/* ── Embedding mini bars ── */}
            {stage >= 0 && SENTENCE.map((_, i) => {
                const y = wordY(i);
                const isSelected = i === selectedWord;
                const color = WORD_COLORS[i];
                const emb = EMBEDDINGS[i];
                const barW = 8;
                const maxEmb = 1;
                return (
                    <g key={`emb-${i}`}>
                        {emb.map((v, fi) => (
                            <motion.rect
                                key={fi}
                                x={COL.embed - 16 + fi * (barW + 1)} y={y - 8}
                                width={barW} height={16}
                                rx={2}
                                fill={color}
                                initial={{ fillOpacity: 0 }}
                                animate={{ fillOpacity: isSelected ? v * 0.5 + 0.05 : v * 0.12 + 0.02 }}
                                transition={{ duration: 0.3 }}
                            />
                        ))}
                        {/* Embedding → QKV connector */}
                        {stage >= 1 && (
                            <motion.line
                                x1={COL.embed + 20} y1={y}
                                x2={COL.qkv - 8} y2={y}
                                stroke={color}
                                strokeWidth={isSelected ? 1.5 : 0.5}
                                strokeDasharray={isSelected ? "none" : "2 2"}
                                initial={{ strokeOpacity: 0 }}
                                animate={{ strokeOpacity: isSelected ? 0.3 : 0.06 }}
                                transition={{ duration: 0.3 }}
                            />
                        )}
                    </g>
                );
            })}

            {/* ── Q/K/V markers ── */}
            {stage >= 1 && SENTENCE.map((_, i) => {
                const y = wordY(i);
                const isSelected = i === selectedWord;
                const qkvItems = [
                    { letter: "Q", color: "#22d3ee", dy: -12 },
                    { letter: "K", color: "#34d399", dy: 0 },
                    { letter: "V", color: "#fbbf24", dy: 12 },
                ];
                return (
                    <g key={`qkv-${i}`}>
                        {qkvItems.map(({ letter, color, dy }) => (
                            <g key={letter}>
                                <motion.circle
                                    cx={COL.qkv} cy={y + dy} r={8}
                                    fill={color}
                                    initial={{ fillOpacity: 0, scale: 0 }}
                                    animate={{
                                        fillOpacity: isSelected ? 0.25 : 0.06,
                                        scale: 1,
                                    }}
                                    transition={{ delay: 0.1, type: "spring" }}
                                />
                                <motion.text
                                    x={COL.qkv} y={y + dy + 4}
                                    textAnchor="middle" fontSize={9}
                                    fontFamily="ui-monospace, monospace" fontWeight="bold"
                                    fill={color}
                                    initial={{ fillOpacity: 0 }}
                                    animate={{ fillOpacity: isSelected ? 0.9 : 0.2 }}
                                    transition={{ delay: 0.15 }}
                                >
                                    {letter}
                                </motion.text>
                            </g>
                        ))}
                    </g>
                );
            })}

            {/* ══════════════════════════════════════════
                 BERTVIZ FLOW CURVES — THE HERO VISUAL
                 ══════════════════════════════════════════ */}
            {stage >= 2 && SENTENCE.map((_, i) => {
                const fromY = wordY(selectedWord) - 12; // From Q position
                const toY = wordY(i); // To K position
                const w = stage >= 4 ? weights[i] : Math.max(0.05, Math.abs(pipeline.rawScores[i]) / Math.max(...pipeline.rawScores.map(Math.abs)));
                const thickness = Math.max(0.4, (w / maxWeight) * 3.5);
                const opacity = Math.max(0.04, (w / maxWeight) * 0.55);
                const color = WORD_COLORS[i];
                const isSoftmax = stage >= 4;

                // Control points for smooth Bezier curves
                const midX = (COL.flowL + COL.flowR) / 2;
                const cpOffset = Math.abs(fromY - toY) * 0.3;

                return (
                    <g key={`flow-${i}`}>
                        {/* Main curve */}
                        <motion.path
                            d={`M ${COL.flowL} ${fromY} C ${midX - cpOffset} ${fromY}, ${midX + cpOffset} ${toY}, ${COL.flowR} ${toY}`}
                            fill="none"
                            stroke={color}
                            strokeWidth={isSoftmax ? thickness : Math.max(0.3, thickness * 0.25)}
                            strokeDasharray={isSoftmax ? "none" : "4 3"}
                            initial={{ strokeOpacity: 0, pathLength: 0 }}
                            animate={{ strokeOpacity: opacity, pathLength: 1 }}
                            transition={{ duration: 0.7, delay: i * 0.05 }}
                        />
                        {/* Q→K label on curve */}
                        {isSoftmax && i === selectedWord && (
                            <motion.text
                                x={midX} y={Math.min(fromY, toY) - 10}
                                textAnchor="middle" fontSize={9}
                                fontFamily="ui-monospace, monospace" fontWeight="bold"
                                fill="#22d3ee"
                                initial={{ fillOpacity: 0 }}
                                animate={{ fillOpacity: 0.4 }}
                                transition={{ delay: 0.8 }}
                            >
                                Q · K
                            </motion.text>
                        )}
                    </g>
                );
            })}

            {/* ── Attention weight bars (right of flow) ── */}
            {stage >= 4 && SENTENCE.map((word, i) => {
                const y = wordY(i);
                const w = weights[i];
                const barW = Math.max(3, (w / maxWeight) * 80);
                const pct = Math.round(w * 100);
                const color = WORD_COLORS[i];
                const isStrong = w >= maxWeight * 0.5;
                return (
                    <g key={`weight-${i}`}>
                        {/* Bar background */}
                        <rect
                            x={COL.weight - 5} y={y - 8}
                            width={80} height={16} rx={4}
                            fill="white" fillOpacity={0.02}
                            stroke="white" strokeOpacity={0.03} strokeWidth={0.5}
                        />
                        {/* Bar fill */}
                        <motion.rect
                            x={COL.weight - 5} y={y - 8}
                            width={80} height={16} rx={4}
                            fill={color}
                            initial={{ fillOpacity: 0, width: 0 }}
                            animate={{ fillOpacity: isStrong ? 0.25 : 0.1, width: barW }}
                            transition={{ duration: 0.5, delay: i * 0.06 }}
                        />
                        {/* Percentage label — larger and bolder */}
                        <motion.text
                            x={COL.weight + 88} y={y + 5}
                            textAnchor="start" fontSize={isStrong ? 13 : 11}
                            fontFamily="ui-monospace, monospace" fontWeight="bold"
                            fill={color}
                            initial={{ fillOpacity: 0 }}
                            animate={{ fillOpacity: isStrong ? 0.9 : 0.5 }}
                            transition={{ delay: 0.3 + i * 0.06 }}
                        >
                            {pct}%
                        </motion.text>
                        {/* Word label */}
                        <motion.text
                            x={COL.weight - 12} y={y + 5}
                            textAnchor="end" fontSize={11}
                            fontFamily="ui-monospace, monospace"
                            fontWeight={isStrong ? "bold" : "normal"}
                            fill={color}
                            initial={{ fillOpacity: 0 }}
                            animate={{ fillOpacity: isStrong ? 0.8 : 0.35 }}
                            transition={{ delay: 0.2 + i * 0.06 }}
                        >
                            {word}
                        </motion.text>
                    </g>
                );
            })}

            {/* ── Value blend indicators ── */}
            {stage >= 5 && SENTENCE.map((_, i) => {
                const y = wordY(i);
                const w = weights[i];
                const color = WORD_COLORS[i];
                // Lines from weights to blend zone
                return (
                    <g key={`vblend-${i}`}>
                        <motion.line
                            x1={COL.weight + 90} y1={y}
                            x2={COL.vblend - 10} y2={wordY(selectedWord)}
                            stroke={color}
                            strokeWidth={Math.max(0.5, w * 5)}
                            strokeDasharray="2 2"
                            initial={{ strokeOpacity: 0 }}
                            animate={{ strokeOpacity: w * 0.4 }}
                            transition={{ delay: 0.3 + i * 0.05 }}
                        />
                    </g>
                );
            })}
            {stage >= 5 && (
                <g>
                    {/* Value blend result box */}
                    <motion.rect
                        x={COL.vblend - 18} y={wordY(selectedWord) - 16}
                        width={36} height={32} rx={6}
                        fill="#fbbf24" stroke="#fbbf24"
                        initial={{ fillOpacity: 0, strokeOpacity: 0 }}
                        animate={{ fillOpacity: 0.06, strokeOpacity: 0.2 }}
                        transition={{ delay: 0.5 }}
                    />
                    <motion.text
                        x={COL.vblend} y={wordY(selectedWord) + 4}
                        textAnchor="middle" fontSize={10}
                        fontFamily="ui-monospace, monospace" fontWeight="bold"
                        fill="#fbbf24"
                        initial={{ fillOpacity: 0 }}
                        animate={{ fillOpacity: 0.8 }}
                        transition={{ delay: 0.6 }}
                    >
                        Σ(w·V)
                    </motion.text>
                </g>
            )}

            {/* ── Output embedding ── */}
            {stage >= 6 && (
                <g>
                    {/* Connector from blend to output */}
                    <motion.line
                        x1={COL.vblend + 20} y1={wordY(selectedWord)}
                        x2={COL.output - 28} y2={wordY(selectedWord)}
                        stroke="#f472b6"
                        strokeWidth={2}
                        initial={{ strokeOpacity: 0 }}
                        animate={{ strokeOpacity: 0.3 }}
                        transition={{ delay: 0.3 }}
                    />
                    <motion.polygon
                        points={`${COL.output - 30},${wordY(selectedWord) - 3} ${COL.output - 25},${wordY(selectedWord)} ${COL.output - 30},${wordY(selectedWord) + 3}`}
                        fill="#f472b6"
                        initial={{ fillOpacity: 0 }}
                        animate={{ fillOpacity: 0.4 }}
                        transition={{ delay: 0.35 }}
                    />

                    <motion.rect
                        x={COL.output - 22} y={wordY(selectedWord) - 18}
                        width={44} height={36} rx={6}
                        fill="#f472b6" stroke="#f472b6"
                        strokeWidth={0.8}
                        initial={{ fillOpacity: 0, strokeOpacity: 0, scale: 0.9 }}
                        animate={{ fillOpacity: 0.06, strokeOpacity: 0.2, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                    />
                    {/* Output mini bars */}
                    {output.map((v, fi) => (
                        <motion.rect
                            key={fi}
                            x={COL.output - 14 + fi * 10} y={wordY(selectedWord) - 10}
                            width={8} height={20} rx={2}
                            fill="#f472b6"
                            initial={{ fillOpacity: 0, height: 0 }}
                            animate={{ fillOpacity: Math.max(0.15, v * 0.5), height: Math.max(4, v * 20) }}
                            transition={{ delay: 0.5 + fi * 0.08 }}
                        />
                    ))}
                    {/* Output word label */}
                    <motion.text
                        x={COL.output} y={wordY(selectedWord) + 34}
                        textAnchor="middle" fontSize={12}
                        fontFamily="ui-monospace, monospace" fontWeight="bold"
                        fill="#f472b6"
                        initial={{ fillOpacity: 0 }}
                        animate={{ fillOpacity: 0.8 }}
                        transition={{ delay: 0.7 }}
                    >
                        {SENTENCE[selectedWord]}′
                    </motion.text>
                    <motion.text
                        x={COL.output} y={wordY(selectedWord) + 46}
                        textAnchor="middle" fontSize={8}
                        fontFamily="ui-monospace, monospace"
                        fill="white"
                        initial={{ fillOpacity: 0 }}
                        animate={{ fillOpacity: 0.25 }}
                        transition={{ delay: 0.8 }}
                    >
                        contextual
                    </motion.text>
                </g>
            )}

            {/* ── Vertical divider lines between sections ── */}
            {[COL.embed - 25, COL.qkv - 15, COL.flowL - 12, COL.flowR + 10, COL.weight - 15, COL.vblend - 25, COL.output - 35].map((x, i) => (
                <line
                    key={`div-${i}`}
                    x1={x} y1={28} x2={x} y2={FLOW_H - 12}
                    stroke="white" strokeOpacity={0.03}
                    strokeDasharray="2 4"
                />
            ))}
        </svg>
    );
}

/* ── Attention Flow Lines (BertViz-style) ── */
function AttentionFlowLines({ weights, selectedWord, colors }: {
    weights: number[]; selectedWord: number; colors: string[];
}) {
    const maxW = Math.max(...weights);
    return (
        <div className="relative" style={{ height: SENTENCE.length * 32 + 16 }}>
            <svg
                viewBox={`0 0 200 ${SENTENCE.length * 32 + 16}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="none"
            >
                {SENTENCE.map((_, i) => {
                    const w = weights[i];
                    const thickness = Math.max(1, (w / maxW) * 8);
                    const opacity = Math.max(0.05, (w / maxW) * 0.6);
                    const fromY = selectedWord * 32 + 20;
                    const toY = i * 32 + 20;
                    return (
                        <motion.path
                            key={i}
                            d={`M 30 ${fromY} C 100 ${fromY}, 100 ${toY}, 170 ${toY}`}
                            fill="none"
                            stroke={colors[i]}
                            strokeWidth={thickness}
                            initial={{ strokeOpacity: 0, pathLength: 0 }}
                            animate={{ strokeOpacity: opacity, pathLength: 1 }}
                            transition={{ duration: 0.6, delay: i * 0.05 }}
                        />
                    );
                })}
            </svg>
            {/* Left labels (query) */}
            <div className="absolute left-0 top-0" style={{ width: 30 }}>
                {SENTENCE.map((w, i) => (
                    <div
                        key={i}
                        className="h-8 flex items-center justify-end pr-1"
                        style={{ opacity: i === selectedWord ? 1 : 0.15 }}
                    >
                        <span className="text-[11px] font-mono font-bold" style={{ color: colors[i] }}>
                            {i === selectedWord ? "Q" : ""}
                        </span>
                    </div>
                ))}
            </div>
            {/* Right labels (keys) */}
            <div className="absolute right-0 top-0" style={{ width: 30 }}>
                {SENTENCE.map((w, i) => (
                    <div key={i} className="h-8 flex items-center pl-1">
                        <span
                            className="text-[11px] font-mono font-bold"
                            style={{ color: colors[i], opacity: weights[i] > 0.1 ? 0.8 : 0.2 }}
                        >
                            {Math.round(weights[i] * 100)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Mini Attention Heatmap ── */
function AttentionHeatmap({ selectedWord, onSelectWord }: {
    selectedWord: number; onSelectWord: (i: number) => void;
}) {
    const allWeights = useMemo(() => {
        return SENTENCE.map((_, qi) => computePipeline(qi).weights);
    }, []);

    return (
        <div className="space-y-1">
            <p className="text-[13px] text-white/25 text-center font-semibold uppercase tracking-wider">
                Attention Matrix
            </p>
            {/* Column headers */}
            <div className="flex items-end gap-0" style={{ marginLeft: 36 }}>
                {SENTENCE.map((w, i) => (
                    <div key={i} className="flex-1 text-center">
                        <span className="text-[11px] font-mono font-semibold" style={{ color: WORD_COLORS[i] + "70" }}>
                            {w.slice(0, 3)}
                        </span>
                    </div>
                ))}
            </div>
            {/* Rows */}
            {SENTENCE.map((word, qi) => (
                <div
                    key={qi}
                    className="flex items-center gap-0 cursor-pointer group"
                    onClick={() => onSelectWord(qi)}
                >
                    <span
                        className="text-[11px] font-mono font-bold text-right pr-1.5 shrink-0"
                        style={{ width: 48, color: qi === selectedWord ? WORD_COLORS[qi] : WORD_COLORS[qi] + "50" }}
                    >
                        {word}
                    </span>
                    {allWeights[qi].map((w, ki) => {
                        const intensity = Math.max(0.03, w);
                        const isSelected = qi === selectedWord;
                        return (
                            <motion.div
                                key={ki}
                                className="flex-1 aspect-square rounded-[2px] mx-[0.5px]"
                                style={{
                                    background: isSelected
                                        ? `rgba(34,211,238,${intensity})`
                                        : `rgba(255,255,255,${intensity * 0.4})`,
                                    border: isSelected && ki === selectedWord
                                        ? "1px solid rgba(34,211,238,0.4)"
                                        : "1px solid transparent",
                                }}
                                animate={{ opacity: isSelected ? 1 : 0.5 }}
                                whileHover={{ opacity: 1 }}
                                title={`${word}→${SENTENCE[ki]}: ${Math.round(w * 100)}%`}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

/* ── Number Chip ── */
function NumChip({ value, color, label, delay = 0, small = false }: {
    value: number; color: string; label?: string; delay?: number; small?: boolean;
}) {
    return (
        <motion.div
            className="flex flex-col items-center gap-0.5"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, type: "spring", stiffness: 150 }}
        >
            <div
                className={`${small ? "px-1.5 py-0.5" : "px-2 py-1"} rounded-md font-mono font-bold`}
                style={{
                    fontSize: small ? 13 : 14,
                    background: color + "12",
                    border: `1px solid ${color}30`,
                    color,
                }}
            >
                {value.toFixed(small ? 2 : 2)}
            </div>
            {label && <span className="text-[12px] text-white/25">{label}</span>}
        </motion.div>
    );
}

/* ── Vector Display ── */
function VecDisplay({ values, color, labels, delay = 0 }: {
    values: number[]; color: string; labels?: string[]; delay?: number;
}) {
    return (
        <div className="flex items-end gap-0.5">
            {values.map((v, i) => (
                <NumChip
                    key={i}
                    value={v}
                    color={color}
                    label={labels?.[i]}
                    delay={delay + i * 0.04}
                    small
                />
            ))}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   STAGE DETAIL PANELS
   ═══════════════════════════════════════════════════════════ */

/* Stage 0: Embedding */
function StageEmbed({ selectedWord }: { selectedWord: number }) {
    const emb = EMBEDDINGS[selectedWord];
    const word = SENTENCE[selectedWord];
    const color = WORD_COLORS[selectedWord];
    return (
        <div className="space-y-3">
            <p className="text-[15px] font-semibold" style={{ color: "#94a3b8" }}>
                Embedding: convert &quot;{word}&quot; into a feature list
            </p>
            <p className="text-[13px] text-white/30 leading-relaxed">
                Each word becomes a list of {DIM} numbers — features the model learned during training.
            </p>
            <div className="flex items-center justify-center gap-3">
                <motion.span
                    className="text-lg font-bold px-3 py-1.5 rounded-lg"
                    style={{ color, background: color + "12", border: `1.5px solid ${color}30` }}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                >
                    {word}
                </motion.span>
                <motion.span
                    className="text-white/20 text-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    →
                </motion.span>
                <div className="flex items-center gap-1">
                    <span className="text-white/10 text-sm">[</span>
                    <VecDisplay values={emb} color={color} labels={FEAT_NAMES} delay={0.3} />
                    <span className="text-white/10 text-sm">]</span>
                </div>
            </div>
            {/* All words' embeddings */}
            <div className="mt-4 space-y-1 max-w-md mx-auto">
                <p className="text-[13px] text-white/20 text-center mb-2">All word embeddings:</p>
                {SENTENCE.map((w, i) => (
                    <motion.div
                        key={i}
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.04 }}
                        style={{ opacity: i === selectedWord ? 1 : 0.4 }}
                    >
                        <span className="text-[13px] font-semibold w-14 text-right" style={{ color: WORD_COLORS[i] }}>
                            {w}
                        </span>
                        <div className="flex gap-1">
                            {EMBEDDINGS[i].map((v, fi) => (
                                <span
                                    key={fi}
                                    className="px-1.5 py-0.5 rounded text-[13px] font-mono"
                                    style={{
                                        background: `${WORD_COLORS[i]}08`,
                                        color: WORD_COLORS[i] + (i === selectedWord ? "cc" : "44"),
                                    }}
                                >
                                    {v.toFixed(1)}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

/* Stage 1: Q/K/V Split */
function StageQKV({ selectedWord }: { selectedWord: number }) {
    const word = SENTENCE[selectedWord];
    const color = WORD_COLORS[selectedWord];
    const q = Q_VECS[selectedWord];
    const k = K_VECS[selectedWord];
    const v = V_VECS[selectedWord];

    const roles = [
        { label: "Query", short: "Q", vec: q, color: "#22d3ee", desc: "What am I looking for?" },
        { label: "Key", short: "K", vec: k, color: "#34d399", desc: "What do I offer?" },
        { label: "Value", short: "V", vec: v, color: "#fbbf24", desc: "What information do I carry?" },
    ];

    return (
        <div className="space-y-3">
            <p className="text-[15px] font-semibold text-purple-400/80">
                Project &quot;{word}&quot; into three roles: Q, K, V
            </p>
            <p className="text-[13px] text-white/30 leading-relaxed">
                Three learned matrices transform the embedding into different versions — one for asking, one for advertising, one for carrying information.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch justify-center gap-2 max-w-xl mx-auto">
                {roles.map((r, ri) => (
                    <motion.div
                        key={r.short}
                        className="flex-1 p-3 text-center"
                        style={{
                            background: `${r.color}06`,
                            borderLeft: `2px solid ${r.color}30`,
                        }}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: ri * 0.1 }}
                    >
                        <p className="text-[15px] font-bold mb-0.5" style={{ color: r.color }}>
                            {r.short}
                        </p>
                        <p className="text-[13px] text-white/25 italic mb-2">{r.desc}</p>
                        <div className="flex items-center justify-center gap-1">
                            {r.vec.map((val, vi) => (
                                <motion.span
                                    key={vi}
                                    className="px-1.5 py-0.5 rounded text-[13px] font-mono font-bold"
                                    style={{ background: r.color + "15", color: r.color }}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2 + ri * 0.1 + vi * 0.04 }}
                                >
                                    {val.toFixed(2)}
                                </motion.span>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
            <p className="text-[13px] text-white/20 text-center">
                W_Q × embedding = Query &nbsp;|&nbsp; W_K × embedding = Key &nbsp;|&nbsp; W_V × embedding = Value
            </p>
        </div>
    );
}

/* Stage 2: Q · Kᵀ dot products */
function StageDot({ selectedWord, rawScores }: { selectedWord: number; rawScores: number[] }) {
    const word = SENTENCE[selectedWord];
    const maxScore = Math.max(...rawScores.map(Math.abs));

    return (
        <div className="space-y-3">
            <p className="text-[15px] font-semibold text-cyan-400/80">
                Q · Kᵀ — how much does each word match &quot;{word}&quot;?
            </p>
            <p className="text-[13px] text-white/30 leading-relaxed">
                The Query of &quot;{word}&quot; is dot-producted with every word&apos;s Key.
                Higher score → more relevant.
            </p>
            <div className="space-y-1.5 max-w-md mx-auto">
                {SENTENCE.map((w, i) => {
                    const score = rawScores[i];
                    const barW = Math.max(2, (Math.abs(score) / maxScore) * 100);
                    const isNeg = score < 0;
                    return (
                        <motion.div
                            key={i}
                            className="flex items-center gap-2"
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                        >
                            <span className="text-[13px] font-semibold w-16 text-right shrink-0" style={{ color: WORD_COLORS[i] }}>
                                {w}
                            </span>
                            <div className="flex-1 h-6 rounded-md bg-white/[0.02] overflow-hidden">
                                <motion.div
                                    className="h-full rounded-md"
                                    style={{
                                        background: isNeg
                                            ? "linear-gradient(90deg, rgba(248,113,113,0.3), rgba(248,113,113,0.05))"
                                            : `linear-gradient(90deg, ${WORD_COLORS[i]}50, ${WORD_COLORS[i]}10)`,
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${barW}%` }}
                                    transition={{ duration: 0.5, delay: i * 0.06 }}
                                />
                            </div>
                            <span
                                className="text-[13px] font-mono font-bold w-12 text-right shrink-0"
                                style={{ color: isNeg ? "#f87171" : "#22d3ee" }}
                            >
                                {score.toFixed(2)}
                            </span>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

/* Stage 3: Scale */
function StageScale({ rawScores, scaledScores }: { rawScores: number[]; scaledScores: number[] }) {
    return (
        <div className="space-y-3">
            <p className="text-[15px] font-semibold text-indigo-400/80">
                Divide by √{DIM} = {SQRT_DIM} to prevent extreme scores
            </p>
            <p className="text-[13px] text-white/30 leading-relaxed">
                Without scaling, high-dimensional dot products create huge numbers that make softmax spiky.
            </p>
            <div className="space-y-1.5 max-w-sm mx-auto">
                {SENTENCE.map((w, i) => (
                    <motion.div
                        key={i}
                        className="flex items-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <span className="text-[13px] font-semibold w-14 text-right shrink-0" style={{ color: WORD_COLORS[i] }}>
                            {w}
                        </span>
                        <span className="text-[13px] font-mono text-white/25 w-12 text-right shrink-0">
                            {rawScores[i].toFixed(2)}
                        </span>
                        <motion.span
                            className="text-white/20 text-[13px]"
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            ÷{SQRT_DIM} →
                        </motion.span>
                        <motion.span
                            className="text-[14px] font-mono font-bold"
                            style={{ color: "#818cf8" }}
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + i * 0.05 }}
                        >
                            {scaledScores[i].toFixed(2)}
                        </motion.span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

/* Stage 4: Softmax */
function StageSoftmax({ weights }: { weights: number[] }) {
    const maxW = Math.max(...weights);
    return (
        <div className="space-y-3">
            <p className="text-[15px] font-semibold text-emerald-400/80">
                Softmax → percentages that sum to 100%
            </p>
            <p className="text-[13px] text-white/30 leading-relaxed">
                Exponentiate, then normalize. Now we have attention weights — a probability distribution.
            </p>
            <div className="space-y-1.5 max-w-md mx-auto">
                {SENTENCE.map((w, i) => {
                    const pct = Math.round(weights[i] * 100);
                    const barW = (weights[i] / maxW) * 100;
                    return (
                        <motion.div
                            key={i}
                            className="flex items-center gap-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <span className="text-[13px] font-semibold w-16 text-right shrink-0" style={{ color: WORD_COLORS[i] }}>
                                {w}
                            </span>
                            <div className="flex-1 h-6 rounded-md bg-white/[0.02] overflow-hidden">
                                <motion.div
                                    className="h-full rounded-md"
                                    style={{ background: `linear-gradient(90deg, ${WORD_COLORS[i]}60, ${WORD_COLORS[i]}10)` }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${barW}%` }}
                                    transition={{ duration: 0.5, delay: i * 0.05 }}
                                />
                            </div>
                            <span className="text-[13px] font-mono font-bold w-12 text-right shrink-0" style={{ color: WORD_COLORS[i] }}>
                                {pct}%
                            </span>
                        </motion.div>
                    );
                })}
            </div>
            <motion.p
                className="text-[13px] text-emerald-400/30 text-center font-semibold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                ✓ {weights.map(w => Math.round(w * 100)).join("% + ")}% = {weights.reduce((s, w) => s + Math.round(w * 100), 0)}%
            </motion.p>
        </div>
    );
}

/* Stage 5: × Value blend */
function StageBlend({ weights, scaledValues }: { weights: number[]; scaledValues: number[][] }) {
    return (
        <div className="space-y-3">
            <p className="text-[15px] font-semibold text-amber-400/80">
                Multiply each Value by its attention weight
            </p>
            <p className="text-[13px] text-white/30 leading-relaxed">
                Each word carries a Value vector. Scale it by how much attention it received.
            </p>
            <div className="space-y-2 max-w-lg mx-auto">
                {SENTENCE.map((w, i) => {
                    const pct = Math.round(weights[i] * 100);
                    return (
                        <motion.div
                            key={i}
                            className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                        >
                            <span className="text-[13px] font-bold w-20 text-right shrink-0" style={{ color: WORD_COLORS[i] }}>
                                {pct}% {w}
                            </span>
                            <div className="flex gap-1 shrink-0">
                                {V_VECS[i].map((v, fi) => (
                                    <span key={fi} className="px-1.5 py-0.5 rounded text-[13px] font-mono"
                                        style={{ background: "#fbbf2410", color: "#fbbf24" }}>
                                        {v.toFixed(2)}
                                    </span>
                                ))}
                            </div>
                            <span className="text-white/15 text-[13px]">→</span>
                            <div className="flex gap-1 shrink-0">
                                {scaledValues[i].map((sv, fi) => (
                                    <motion.span key={fi}
                                        className="px-1.5 py-0.5 rounded text-[13px] font-mono font-bold"
                                        style={{ background: "#a78bfa10", color: "#a78bfa" }}
                                        initial={{ scale: 0.7, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.2 + i * 0.06 + fi * 0.03 }}
                                    >
                                        {sv.toFixed(3)}
                                    </motion.span>
                                ))}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

/* Stage 6: Σ Output */
function StageOutput({ selectedWord, output, weights }: {
    selectedWord: number; output: number[]; weights: number[];
}) {
    const word = SENTENCE[selectedWord];
    const color = WORD_COLORS[selectedWord];
    return (
        <div className="space-y-4">
            <p className="text-[15px] font-semibold text-pink-400/80">
                Sum all scaled Values → new contextual &quot;{word}&quot;
            </p>
            <p className="text-[13px] text-white/30 leading-relaxed">
                The weighted sum creates a new representation that carries context from every relevant word.
            </p>

            {/* Celebration card */}
            <div className="relative max-w-md mx-auto">
                <motion.div
                    className="relative rounded-xl px-6 py-5 text-center"
                    style={{
                        background: `linear-gradient(135deg, ${color}08, ${color}03)`,
                        border: `1px solid ${color}25`,
                    }}
                    initial={{ opacity: 0, scale: 0.85, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 80, damping: 15 }}
                >
                    <motion.p
                        className="text-[14px] uppercase tracking-widest font-bold mb-4"
                        style={{ color: color + "90" }}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        ✨ New &quot;{word}&quot; — shaped by context
                    </motion.p>
                    <div className="flex items-center justify-center gap-3 sm:gap-4">
                        {output.map((v, fi) => (
                            <motion.div
                                key={fi}
                                className="flex flex-col items-center gap-1.5"
                                initial={{ opacity: 0, y: 12, scale: 0.7 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: 0.3 + fi * 0.12, type: "spring", stiffness: 120 }}
                            >
                                <div
                                    className="min-w-[48px] h-12 rounded-lg flex items-center justify-center px-2"
                                    style={{
                                        background: `${color}${Math.round(Math.max(15, v * 40)).toString(16)}`,
                                        border: `1.5px solid ${color}45`,
                                        boxShadow: `0 0 12px ${color}15`,
                                    }}
                                >
                                    <span className="text-[14px] font-mono font-bold" style={{ color }}>
                                        {v.toFixed(3)}
                                    </span>
                                </div>
                                <span className="text-[12px] text-white/30 font-medium">{FEAT_NAMES[fi]}</span>
                            </motion.div>
                        ))}
                    </div>
                    <motion.p
                        className="text-[13px] text-white/20 mt-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        = {SENTENCE.map((w, i) => `${Math.round(weights[i] * 100)}% ${w}`).join(" + ")}
                    </motion.p>
                    <motion.p
                        className="text-[15px] font-bold mt-3"
                        style={{
                            background: `linear-gradient(90deg, ${color}, #34d399)`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, type: "spring" }}
                    >
                        A meaning built from context. This is attention!
                    </motion.p>
                </motion.div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function FullScoringPipelineViz() {
    const [selectedWord, setSelectedWord] = useState(1); // "king"
    const [stage, setStage] = useState(0);
    const [showFlow, setShowFlow] = useState(false);
    const [autoPlay, setAutoPlay] = useState(false);
    const [speed, setSpeed] = useState<PlaySpeed>("normal");
    const containerRef = useRef<HTMLDivElement>(null);
    const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const pipeline = useMemo(() => computePipeline(selectedWord), [selectedWord]);

    const advance = useCallback(() => {
        setStage(prev => {
            const next = Math.min(prev + 1, STAGES.length - 1);
            if (next >= 4) setShowFlow(true);
            return next;
        });
    }, []);

    const reset = useCallback(() => {
        setStage(0);
        setShowFlow(false);
    }, []);

    const handleWordSelect = useCallback((i: number) => {
        setSelectedWord(i);
        setShowFlow(stage >= 4);
    }, [stage]);

    /* Auto-play logic */
    useEffect(() => {
        if (autoRef.current) clearTimeout(autoRef.current);
        if (!autoPlay) return;
        if (stage >= STAGES.length - 1) {
            setAutoPlay(false);
            return;
        }
        autoRef.current = setTimeout(() => {
            advance();
        }, SPEED_MS[speed]);
        return () => { if (autoRef.current) clearTimeout(autoRef.current); };
    }, [autoPlay, stage, speed, advance]);

    const toggleAuto = useCallback(() => {
        if (autoPlay) {
            setAutoPlay(false);
        } else {
            if (stage >= STAGES.length - 1) reset();
            setAutoPlay(true);
        }
    }, [autoPlay, stage, reset]);

    return (
        <div
            ref={containerRef}
            className="overflow-hidden"
            style={{ minHeight: 600 }}
        >
            <div className="px-5 pt-5 pb-1">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/20 font-semibold">The Complete Attention Head</p>
            </div>

            <div className="py-5 sm:py-6 px-3 sm:px-5 space-y-4">
                {/* ═══ Controls row ═══ */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    {/* Word selector */}
                    <WordSelector
                        words={SENTENCE}
                        selected={selectedWord}
                        onSelect={handleWordSelect}
                    />
                </div>

                {/* Stage selector + Auto/Speed controls */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <StageSelector stage={stage} onSelect={(i) => { setAutoPlay(false); setStage(i); }} />

                    <div className="flex items-center gap-2">
                        {/* Auto play toggle */}
                        <motion.button
                            onClick={toggleAuto}
                            whileTap={{ scale: 0.95 }}
                            className="px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer"
                            style={{
                                background: autoPlay ? "rgba(34,211,238,0.08)" : "transparent",
                                color: autoPlay ? "#22d3ee" : "rgba(255,255,255,0.3)",
                                border: `1px solid ${autoPlay ? "rgba(34,211,238,0.2)" : "rgba(255,255,255,0.06)"}`,
                            }}
                        >
                            {autoPlay ? "⏸ Pause" : "▶ Auto"}
                        </motion.button>

                        {/* Speed selector */}
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

                {/* ★ HERO: Full Architecture Flow (BertViz-inspired) */}
                <div className="overflow-hidden">
                    <FullArchitectureFlow
                        stage={stage}
                        selectedWord={selectedWord}
                        pipeline={pipeline}
                        onSelectWord={handleWordSelect}
                    />
                </div>

                {/* Detail + Heatmap area */}
                <div className="flex flex-col lg:flex-row gap-3">
                    {/* Detail panel (left/main) — glass-morphism */}
                    <div className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${selectedWord}-${stage}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                                className="rounded-xl p-4 sm:p-5"
                                style={{
                                    minHeight: 200,
                                    background: "rgba(255,255,255,0.012)",
                                    border: "1px solid rgba(255,255,255,0.04)",
                                }}
                            >
                                {stage === 0 && <StageEmbed selectedWord={selectedWord} />}
                                {stage === 1 && <StageQKV selectedWord={selectedWord} />}
                                {stage === 2 && <StageDot selectedWord={selectedWord} rawScores={pipeline.rawScores} />}
                                {stage === 3 && <StageScale rawScores={pipeline.rawScores} scaledScores={pipeline.scaledScores} />}
                                {stage === 4 && <StageSoftmax weights={pipeline.weights} />}
                                {stage === 5 && <StageBlend weights={pipeline.weights} scaledValues={pipeline.scaledValues} />}
                                {stage === 6 && <StageOutput selectedWord={selectedWord} output={pipeline.output} weights={pipeline.weights} />}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Side panel: heatmap (visible from stage 2+) — glass-morphism */}
                    <AnimatePresence>
                        {stage >= 2 && (
                            <motion.div
                                className="w-full lg:w-64 shrink-0"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="p-4">
                                    <AttentionHeatmap
                                        selectedWord={selectedWord}
                                        onSelectWord={handleWordSelect}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ═══ Navigation ═══ */}
                <div className="flex justify-between items-center pt-2">
                    <button
                        onClick={reset}
                        className="text-[13px] text-white/20 hover:text-white/40 transition-colors font-mono"
                    >
                        ↻ Reset
                    </button>

                    {/* Progress dots */}
                    <div className="flex gap-1.5">
                        {STAGES.map((s, i) => (
                            <motion.div
                                key={i}
                                className="rounded-full cursor-pointer"
                                style={{
                                    width: i === stage ? 20 : 8,
                                    height: 8,
                                    background: i === stage ? s.color : i < stage ? s.color + "50" : "rgba(255,255,255,0.06)",
                                    boxShadow: "none",
                                }}
                                layout
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                onClick={() => { setAutoPlay(false); setStage(i); }}
                            />
                        ))}
                    </div>

                    {stage < STAGES.length - 1 ? (
                        <motion.button
                            onClick={() => { setAutoPlay(false); advance(); }}
                            className="px-4 py-2 rounded-lg text-[13px] font-bold transition-all cursor-pointer"
                            style={{
                                background: `${STAGES[stage + 1].color}10`,
                                border: `1px solid ${STAGES[stage + 1].color}30`,
                                color: STAGES[stage + 1].color,
                            }}
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.02 }}
                        >
                            Next Step →
                        </motion.button>
                    ) : (
                        <motion.button
                            onClick={reset}
                            className="px-4 py-2 rounded-lg text-[13px] font-bold transition-all cursor-pointer"
                            style={{
                                background: "rgba(244,114,182,0.08)",
                                border: "1px solid rgba(244,114,182,0.25)",
                                color: "#f472b6",
                            }}
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.02 }}
                        >
                            ↻ Replay
                        </motion.button>
                    )}
                </div>
            </div>
        </div>
    );
}
