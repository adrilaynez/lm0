"use client";

import { useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  WhyQKMattersViz v4 — Centered morphing matrix, NO arrows panel

  ONE centered matrix. Toggle morphs all cells:
  - Diagonal cells deflate (lose amber glow)
  - Off-diagonal winners inflate (gain cyan glow)
  - Below: top changes summary + insight text
  - No arrow panel — that belongs in QueryKeyRelationsViz
*/

const WORDS = ["king", "wore", "the", "golden", "crown"];

const RAW: number[][] = [
    [0.97, 0.41, 0.10, 0.38, 0.92],
    [0.41, 0.65, 0.54, 0.50, 0.48],
    [0.10, 0.54, 0.53, 0.42, 0.19],
    [0.38, 0.50, 0.42, 0.61, 0.35],
    [0.92, 0.48, 0.19, 0.35, 0.89],
];

const QK: number[][] = [
    [0.15, 0.42, -0.18, 0.55, 0.88],
    [0.35, 0.12, 0.28, 0.60, 0.40],
    [-0.10, 0.22, 0.08, 0.30, 0.15],
    [0.48, 0.55, 0.10, 0.20, 0.72],
    [0.85, 0.38, -0.12, 0.65, 0.18],
];

/* Precompute top changes */
const CHANGES = WORDS.flatMap((rw, r) =>
    WORDS.map((cw, c) => ({
        rw, cw, raw: RAW[r][c], qk: QK[r][c],
        delta: QK[r][c] - RAW[r][c],
    }))
).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
const TOP_CHANGES = CHANGES.slice(0, 4);

type Mode = "raw" | "qk";

function rowMax(row: number[]): number {
    let mi = 0;
    row.forEach((v, i) => { if (v > row[mi]) mi = i; });
    return mi;
}

const CW = 56, CH = 48, RL = 62;

export function WhyQKMattersViz() {
    const [mode, setMode] = useState<Mode>("raw");

    const isQK = mode === "qk";
    const scores = isQK ? QK : RAW;
    const maxVal = isQK ? 0.88 : 0.97;
    const accent = isQK ? "#22d3ee" : "#fbbf24";

    const winners = useMemo(() => scores.map(rowMax), [scores]);
    const diagWins = useMemo(() => {
        let count = 0;
        winners.forEach((w, r) => { if (w === r) count++; });
        return count;
    }, [winners]);

    const toggle = () => setMode(m => m === "raw" ? "qk" : "raw");

    /* Cell styling */
    const cellStyle = (r: number, c: number) => {
        const val = scores[r][c];
        const norm = Math.max(0, val / maxVal);
        const isDiag = r === c;
        const isWin = winners[r] === c;

        const rgb = isQK ? "34,211,238" : "251,191,36";
        const bg = val < 0
            ? `rgba(244,63,94,${Math.abs(val / maxVal) * 0.3})`
            : `rgba(${rgb},${norm * 0.45})`;

        const border = isWin
            ? `1.5px solid ${accent}80`
            : isDiag && !isQK
                ? "1px solid rgba(251,191,36,0.2)"
                : "1px solid rgba(255,255,255,0.03)";

        const shadow = isWin
            ? `0 0 10px -3px ${accent}40`
            : isDiag && !isQK
                ? "0 0 6px -3px rgba(251,191,36,0.12)"
                : "none";

        const color = val < 0
            ? "rgba(251,113,133,0.7)"
            : norm > 0.7
                ? (isQK ? "rgba(165,243,252,0.9)" : "rgba(253,224,71,0.9)")
                : norm > 0.35
                    ? "rgba(255,255,255,0.55)"
                    : "rgba(255,255,255,0.25)";

        return { bg, border, shadow, color };
    };

    return (
        <div className="py-6 sm:py-10 px-2 sm:px-4 space-y-5" style={{ minHeight: 300 }}>
            {/* Toggle button */}
            <div className="flex justify-center">
                <motion.button
                    onClick={toggle}
                    className="relative rounded-full px-5 py-2 text-[12px] sm:text-[13px] font-semibold cursor-pointer"
                    style={{
                        background: isQK
                            ? "linear-gradient(90deg, rgba(34,211,238,0.08), rgba(52,211,153,0.05))"
                            : "linear-gradient(90deg, rgba(251,191,36,0.08), rgba(251,191,36,0.04))",
                        border: `1px solid ${isQK ? "rgba(34,211,238,0.2)" : "rgba(251,191,36,0.2)"}`,
                        color: isQK ? "rgba(34,211,238,0.7)" : "rgba(251,191,36,0.7)",
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                >
                    {isQK ? "← Show Raw Embeddings" : "Show Q × K Projections →"}
                </motion.button>
            </div>

            {/* Matrix — centered */}
            <div className="flex justify-center">
                <div className="inline-block">
                    {/* Col headers */}
                    <div className="flex mb-1" style={{ marginLeft: RL }}>
                        {WORDS.map((word, c) => (
                            <div key={c} className="text-center" style={{ width: CW, minWidth: CW }}>
                                <span className="text-[9px] sm:text-[10px] font-medium text-white/25">{word}</span>
                            </div>
                        ))}
                    </div>

                    {/* Rows */}
                    {WORDS.map((rowWord, r) => (
                        <div key={r} className="flex items-center">
                            <span className="text-[10px] sm:text-[11px] font-semibold text-right pr-2.5 shrink-0"
                                style={{
                                    width: RL,
                                    color: winners[r] === r && !isQK ? "rgba(251,191,36,0.5)" : "rgba(255,255,255,0.3)",
                                }}>
                                {rowWord}
                            </span>
                            {WORDS.map((_, c) => {
                                const val = scores[r][c];
                                const st = cellStyle(r, c);
                                return (
                                    <motion.div
                                        key={`${r}-${c}`}
                                        className="flex items-center justify-center"
                                        style={{
                                            width: CW - 2, height: CH - 2, minWidth: CW - 2,
                                            margin: 1, borderRadius: 8,
                                        }}
                                        animate={{
                                            background: st.bg,
                                            border: st.border,
                                            boxShadow: st.shadow,
                                        }}
                                        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                                    >
                                        <AnimatePresence mode="wait">
                                            <motion.span
                                                key={`${mode}-${r}-${c}`}
                                                className="text-[11px] sm:text-xs font-mono font-bold"
                                                style={{ color: st.color }}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{ duration: 0.25, delay: r * 0.02 + c * 0.02 }}
                                            >
                                                {val.toFixed(2)}
                                            </motion.span>
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Insight + changes */}
            <AnimatePresence mode="wait">
                {isQK ? (
                    <motion.div
                        key="qk-info"
                        className="space-y-3"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                        transition={{ delay: 0.25, duration: 0.3 }}
                    >
                        {/* Insight */}
                        <p className="text-center text-[12px] sm:text-[13px] leading-relaxed" style={{ color: "rgba(34,211,238,0.55)" }}>
                            <strong>Diagonal broken</strong> — {diagWins}/5 words still attend to themselves.
                            {diagWins === 0 && " Every word now listens to something more relevant."}
                        </p>

                        {/* Top changes */}
                        <div className="max-w-xs mx-auto space-y-1">
                            <p className="text-[9px] text-white/15 text-center uppercase tracking-[0.15em] font-semibold mb-1.5">
                                Biggest changes
                            </p>
                            {TOP_CHANGES.map(({ rw, cw, raw, qk, delta }, i) => {
                                const up = delta > 0;
                                return (
                                    <motion.div key={i}
                                        className="flex items-center justify-center gap-2 text-[10px] sm:text-[11px]"
                                        initial={{ opacity: 0, x: -6 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + i * 0.06 }}>
                                        <span className="font-semibold text-white/30 w-24 text-right truncate">
                                            {rw} → {cw}
                                        </span>
                                        <span className="font-mono text-amber-300/35 w-9 text-right">{raw.toFixed(2)}</span>
                                        <span className="text-white/15">→</span>
                                        <span className="font-mono w-9" style={{
                                            color: up ? "rgba(34,211,238,0.6)" : "rgba(244,63,94,0.5)"
                                        }}>{qk.toFixed(2)}</span>
                                        <span className="font-mono text-[9px] w-12" style={{
                                            color: up ? "rgba(52,211,153,0.5)" : "rgba(244,63,94,0.4)"
                                        }}>
                                            {up ? "+" : ""}{delta.toFixed(2)}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                ) : (
                    <motion.p
                        key="raw-hint"
                        className="text-center text-[11px] sm:text-[12px] text-white/20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    >
                        Notice: the <span className="text-amber-300/40">diagonal</span> dominates — every word attends most to itself.
                        <br />
                        <span className="text-white/12">Toggle to Q×K to see what changes.</span>
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
