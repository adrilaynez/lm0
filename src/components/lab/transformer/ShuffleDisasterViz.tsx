"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

/*
  V33 — ShuffleDisasterViz
  Bigger text (min 13px), bigger cells, more vibrant cyan fills,
  brighter labels. Grid-like cell borders for clarity.
*/

const SENTENCE_A = ["The", "dog", "bit", "the", "man"];
const SENTENCE_B = ["The", "man", "bit", "the", "dog"];

function computeAttention(words: string[]): number[][] {
    const embeds: Record<string, number[]> = {
        The: [0.1, 0.2, -0.1, 0.3], the: [0.1, 0.2, -0.1, 0.3],
        dog: [0.9, -0.3, 0.7, 0.1], man: [0.8, -0.2, 0.5, 0.4],
        bit: [-0.1, 0.8, 0.3, -0.5],
    };
    const vecs = words.map((w) => embeds[w] || embeds[w.toLowerCase()] || [0, 0, 0, 0]);
    const n = vecs.length;
    const scores: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        const row = vecs.map((_, j) => vecs[i].reduce((s, v, d) => s + v * vecs[j][d], 0));
        const max = Math.max(...row);
        const exps = row.map((v) => Math.exp(v - max));
        const sum = exps.reduce((a, b) => a + b, 0);
        scores[i] = exps.map((e) => e / sum);
    }
    return scores;
}

function MiniHeatmap({ words, label }: { words: string[]; label: string }) {
    const attn = useMemo(() => computeAttention(words), [words]);
    const cell = 46;
    const pad = 56;
    const size = pad + cell * words.length;

    return (
        <div className="flex flex-col items-center gap-2.5">
            <p className="text-[14px] font-medium text-white/60 italic">
                {label}
            </p>
            <div className="flex gap-1.5 mb-0.5">
                {words.map((w, i) => (
                    <span
                        key={`${w}-${i}`}
                        className="px-2 py-0.5 rounded text-[14px] font-mono font-bold text-white/70"
                    >
                        {w}
                    </span>
                ))}
            </div>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Row labels */}
                {words.map((w, i) => (
                    <text
                        key={`rl-${i}`}
                        x={pad - 8} y={pad + i * cell + cell / 2 + 5}
                        textAnchor="end" fontSize={13}
                        fontFamily="ui-monospace, monospace"
                        fontWeight="600"
                        fill="white" fillOpacity={0.65}
                    >{w}</text>
                ))}
                {/* Column labels */}
                {words.map((w, j) => (
                    <text
                        key={`cl-${j}`}
                        x={pad + j * cell + cell / 2} y={pad - 10}
                        textAnchor="middle" fontSize={13}
                        fontFamily="ui-monospace, monospace"
                        fontWeight="600"
                        fill="white" fillOpacity={0.65}
                    >{w}</text>
                ))}
                {/* Cells */}
                {attn.map((row, i) =>
                    row.map((val, j) => {
                        /* 
                           Color mapping: low values → dark teal, high values → vivid cyan.
                           Using two-tone fill: cyan base + extra bright for high values.
                        */
                        const intensity = Math.min(1, val * 1.05);
                        const isHigh = val > 0.20;

                        return (
                            <g key={`${i}-${j}`}>
                                {/* Cell background border */}
                                <rect
                                    x={pad + j * cell} y={pad + i * cell}
                                    width={cell} height={cell} rx={0}
                                    fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1}
                                />
                                {/* Colored fill */}
                                <motion.rect
                                    x={pad + j * cell + 1.5} y={pad + i * cell + 1.5}
                                    width={cell - 3} height={cell - 3} rx={5}
                                    fill="#22d3ee"
                                    initial={{ fillOpacity: 0 }}
                                    animate={{ fillOpacity: intensity }}
                                    transition={{ duration: 0.5, delay: (i * words.length + j) * 0.02 }}
                                />
                                {/* Extra glow for high-value cells */}
                                {isHigh && (
                                    <rect
                                        x={pad + j * cell + 1.5} y={pad + i * cell + 1.5}
                                        width={cell - 3} height={cell - 3} rx={5}
                                        fill="rgba(34,211,238,0.12)"
                                        style={{ filter: "blur(3px)" }}
                                    />
                                )}
                                {/* Number */}
                                <text
                                    x={pad + j * cell + cell / 2} y={pad + i * cell + cell / 2 + 5}
                                    textAnchor="middle" fontSize={13}
                                    fontFamily="ui-monospace, monospace" fontWeight="bold"
                                    fill="white" fillOpacity={isHigh ? 0.95 : 0.45}
                                >{Math.round(val * 100)}</text>
                            </g>
                        );
                    })
                )}
            </svg>
        </div>
    );
}

export function ShuffleDisasterViz() {
    return (
        <div className="py-6 sm:py-8 px-3 sm:px-4" style={{ minHeight: 300 }}>
            <div className="flex flex-col md:flex-row items-start justify-center gap-6 md:gap-10">
                <MiniHeatmap words={SENTENCE_A} label={`"${SENTENCE_A.join(" ")}"`} />
                <div className="hidden md:flex flex-col items-center justify-center self-center gap-2">
                    <div className="w-px h-14 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                    <span className="text-[15px] font-bold text-amber-400/80">=</span>
                    <div className="w-px h-14 bg-gradient-to-b from-transparent via-white/12 to-transparent" />
                </div>
                <div className="md:hidden flex items-center justify-center w-full gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/12 to-transparent" />
                    <span className="text-[15px] font-bold text-amber-400/80">=</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/12 to-transparent" />
                </div>
                <MiniHeatmap words={SENTENCE_B} label={`"${SENTENCE_B.join(" ")}"`} />
            </div>

            <motion.div
                className="mt-6 text-center"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
            >
                <div
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full"
                    style={{
                        background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.06))",
                        border: "1px solid rgba(251,191,36,0.3)",
                    }}
                >
                    <span className="text-[14px] font-semibold text-amber-400">
                        Different stories, same attention weights. Order is invisible.
                    </span>
                </div>
            </motion.div>
        </div>
    );
}
