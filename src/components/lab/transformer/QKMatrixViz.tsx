"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  QKMatrixViz — Interactive matrix multiplication visualizer
  Shows embedding × W matrix = Query or Key.
  Redesign: visible 2×2 matrix grid, horizontal flow,
  clickable cells with sliders, real-model dimension note.
*/

/* ─── Data ─── */
const WORDS = [
    { word: "king", embedding: [0.9, 0.3] as [number, number], color: "#22d3ee" },
    { word: "crown", embedding: [0.85, 0.1] as [number, number], color: "#fbbf24" },
    { word: "ruled", embedding: [0.4, 0.9] as [number, number], color: "#34d399" },
    { word: "golden", embedding: [0.6, 0.05] as [number, number], color: "#f472b6" },
];

const FEAT = ["royalty", "action"] as const;

const DEFAULT_WQ: [[number, number], [number, number]] = [[0.1, 0.9], [0.8, 0.2]];
const DEFAULT_WK: [[number, number], [number, number]] = [[0.95, 0.05], [0.1, 0.9]];

function compute(m: number[][], v: number[]): [number, number] {
    return [
        Math.max(0, Math.min(1.2, m[0][0] * v[0] + m[0][1] * v[1])),
        Math.max(0, Math.min(1.2, m[1][0] * v[0] + m[1][1] * v[1])),
    ];
}

/* ─── Editable matrix cell ─── */
function MatrixCell({
    value,
    onChange,
    accent,
    editing,
    onStartEdit,
    hint,
}: {
    value: number;
    onChange: (v: number) => void;
    accent: string;
    editing: boolean;
    onStartEdit: () => void;
    hint?: boolean;
}) {
    const intensity = Math.abs(value);
    return (
        <div className="flex flex-col items-center gap-1">
            <motion.button
                onClick={onStartEdit}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center cursor-pointer font-mono text-sm sm:text-base font-bold tabular-nums transition-colors"
                style={{
                    background: intensity > 0.5
                        ? `${accent}${Math.round(intensity * 25).toString(16).padStart(2, "0")}`
                        : "rgba(255,255,255,0.03)",
                    border: editing
                        ? `2px solid ${accent}80`
                        : `1px solid ${intensity > 0.4 ? `${accent}30` : "rgba(255,255,255,0.08)"}`,
                    color: intensity > 0.4 ? accent : "rgba(255,255,255,0.45)",
                    boxShadow: editing ? `0 0 12px -3px ${accent}30` : "none",
                }}
                whileHover={{ scale: 1.06, borderColor: `${accent}50` }}
                whileTap={{ scale: 0.97 }}
                animate={hint ? {
                    borderColor: [`${accent}15`, `${accent}50`, `${accent}15`],
                } : undefined}
                transition={hint ? {
                    borderColor: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                } : undefined}
                layout
            >
                {value.toFixed(2)}
            </motion.button>
            {editing && (
                <motion.input
                    type="range"
                    min={-0.5}
                    max={1.0}
                    step={0.05}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="w-16 sm:w-20 h-1 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: accent }}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                />
            )}
        </div>
    );
}

/* ─── Component ─── */
export function QKMatrixViz() {
    const [wordIdx, setWordIdx] = useState(0);
    const [mode, setMode] = useState<"query" | "key">("query");
    const [editCell, setEditCell] = useState<string | null>(null);
    const [wq, setWq] = useState<[[number, number], [number, number]]>([
        [...DEFAULT_WQ[0]], [...DEFAULT_WQ[1]],
    ]);
    const [wk, setWk] = useState<[[number, number], [number, number]]>([
        [...DEFAULT_WK[0]], [...DEFAULT_WK[1]],
    ]);

    const word = WORDS[wordIdx];
    const matrix = mode === "query" ? wq : wk;
    const accent = mode === "query" ? "#22d3ee" : "#34d399";
    const output = useMemo(() => compute(matrix, word.embedding), [matrix, word.embedding]);

    const updateCell = useCallback(
        (row: number, col: number, val: number) => {
            const setter = mode === "query" ? setWq : setWk;
            setter((prev) => {
                const next: [[number, number], [number, number]] = [[...prev[0]], [...prev[1]]];
                next[row][col] = val;
                return next;
            });
        },
        [mode],
    );

    const resetMatrix = useCallback(() => {
        if (mode === "query") setWq([[...DEFAULT_WQ[0]], [...DEFAULT_WQ[1]]]);
        else setWk([[...DEFAULT_WK[0]], [...DEFAULT_WK[1]]]);
        setEditCell(null);
    }, [mode]);

    const isDefault = useMemo(() => {
        const def = mode === "query" ? DEFAULT_WQ : DEFAULT_WK;
        return matrix.every((row, r) => row.every((v, c) => v === def[r][c]));
    }, [matrix, mode]);

    return (
        <div className="py-6 sm:py-8 px-2 sm:px-4 max-w-2xl mx-auto">
            {/* ── Word selector ── */}
            <div className="flex items-center justify-center gap-5 sm:gap-7 mb-4">
                {WORDS.map((w, i) => (
                    <motion.button
                        key={w.word}
                        onClick={() => { setWordIdx(i); setEditCell(null); }}
                        className="relative pb-1 text-[13px] sm:text-sm font-semibold cursor-pointer"
                        style={{ color: i === wordIdx ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)" }}
                        whileHover={{ color: "rgba(255,255,255,0.6)" }}
                    >
                        {w.word}
                        {i === wordIdx && (
                            <motion.span
                                className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full"
                                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
                                layoutId="qkmatrix-tab"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                    </motion.button>
                ))}
            </div>

            {/* ── Mode toggle ── */}
            <div className="flex items-center justify-center gap-2 mb-6">
                {(["query", "key"] as const).map((m) => {
                    const active = mode === m;
                    const c = m === "query" ? "#22d3ee" : "#34d399";
                    return (
                        <button
                            key={m}
                            onClick={() => { setMode(m); setEditCell(null); }}
                            className="px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold cursor-pointer transition-all"
                            style={{
                                background: active ? `${c}18` : "transparent",
                                border: `1px solid ${active ? `${c}40` : "rgba(255,255,255,0.06)"}`,
                                color: active ? c : "rgba(255,255,255,0.25)",
                            }}
                        >
                            {m === "query" ? "🔍 W_Q" : "🔑 W_K"}
                        </button>
                    );
                })}
                {!isDefault && (
                    <motion.button
                        onClick={resetMatrix}
                        className="px-2.5 py-1.5 rounded-full text-[10px] font-medium cursor-pointer text-white/30 hover:text-white/50 transition-colors border border-white/6 hover:border-white/12"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        Reset
                    </motion.button>
                )}
            </div>

            {/* ── Main: Embedding × Matrix = Output ── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${wordIdx}-${mode}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.08 } }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center gap-3 sm:gap-5 flex-wrap sm:flex-nowrap"
                >
                    {/* ── Embedding vector ── */}
                    <div className="shrink-0">
                        <p className="text-[8px] uppercase tracking-[0.15em] font-semibold text-center mb-2" style={{ color: `${word.color}70` }}>
                            Embedding
                        </p>
                        <div className="flex flex-col items-center gap-1.5">
                            {FEAT.map((f, fi) => (
                                <div
                                    key={f}
                                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex flex-col items-center justify-center"
                                    style={{
                                        background: `${word.color}08`,
                                        border: `1px solid ${word.color}20`,
                                    }}
                                >
                                    <span className="text-[8px] uppercase tracking-wider" style={{ color: `${word.color}60` }}>{f}</span>
                                    <span className="font-mono text-sm font-bold" style={{ color: word.color }}>
                                        {word.embedding[fi].toFixed(1)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── × symbol ── */}
                    <span className="text-white/20 text-lg font-light select-none">×</span>

                    {/* ── Matrix grid ── */}
                    <div className="shrink-0">
                        <p className="text-[8px] uppercase tracking-[0.15em] font-semibold text-center mb-2" style={{ color: `${accent}70` }}>
                            W<sub>{mode === "query" ? "Q" : "K"}</sub> Matrix
                        </p>
                        <div
                            className="rounded-xl p-2 sm:p-2.5"
                            style={{
                                background: `linear-gradient(145deg, ${accent}06, transparent 80%)`,
                                border: `1px solid ${accent}15`,
                            }}
                        >
                            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                                {[0, 1].map((row) =>
                                    [0, 1].map((col) => {
                                        const cellId = `${row}-${col}`;
                                        return (
                                            <MatrixCell
                                                key={cellId}
                                                value={matrix[row][col]}
                                                onChange={(v) => updateCell(row, col, v)}
                                                accent={accent}
                                                editing={editCell === cellId}
                                                onStartEdit={() => setEditCell(editCell === cellId ? null : cellId)}
                                                hint={editCell === null && row === 0 && col === 0}
                                            />
                                        );
                                    }),
                                )}
                            </div>
                        </div>
                        <p className="text-[9px] text-center mt-1.5" style={{ color: `${accent}40` }}>
                            {editCell ? "Drag slider to change" : "\u2191 Click any cell to adjust"}
                        </p>
                    </div>

                    {/* ── = symbol ── */}
                    <span className="text-white/20 text-lg font-light select-none">=</span>

                    {/* ── Output vector ── */}
                    <div className="shrink-0">
                        <p className="text-[8px] uppercase tracking-[0.15em] font-semibold text-center mb-2" style={{ color: `${accent}70` }}>
                            {mode === "query" ? "Query" : "Key"}
                        </p>
                        <div className="flex flex-col items-center gap-1.5">
                            {FEAT.map((f, fi) => (
                                <motion.div
                                    key={f}
                                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex flex-col items-center justify-center"
                                    style={{
                                        background: output[fi] > 0.5 ? `${accent}12` : `${accent}05`,
                                        border: `1px solid ${output[fi] > 0.5 ? `${accent}30` : `${accent}10`}`,
                                        boxShadow: output[fi] > 0.7 ? `0 0 12px -4px ${accent}30` : "none",
                                    }}
                                    layout
                                >
                                    <span className="text-[8px] uppercase tracking-wider" style={{ color: `${accent}60` }}>{f}</span>
                                    <motion.span
                                        className="font-mono text-sm font-bold tabular-nums"
                                        style={{ color: output[fi] > 0.4 ? accent : "rgba(255,255,255,0.3)" }}
                                        key={output[fi].toFixed(2)}
                                    >
                                        {output[fi].toFixed(2)}
                                    </motion.span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* ── Computation detail ── */}
            <div className="mt-5 max-w-md mx-auto space-y-1">
                {[0, 1].map((row) => {
                    const raw = matrix[row][0] * word.embedding[0] + matrix[row][1] * word.embedding[1];
                    return (
                        <p key={row} className="text-[10px] font-mono text-white/25 text-center">
                            <span style={{ color: `${accent}50` }}>{FEAT[row]}</span>
                            {" = "}
                            {matrix[row][0].toFixed(2)}×{word.embedding[0].toFixed(1)}
                            {" + "}
                            {matrix[row][1].toFixed(2)}×{word.embedding[1].toFixed(1)}
                            {" = "}
                            <span style={{ color: `${accent}80` }}>{raw.toFixed(2)}</span>
                        </p>
                    );
                })}
            </div>

            {/* ── Challenge / Insight ── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${wordIdx}-${mode}-${output[0].toFixed(1)}-${output[1].toFixed(1)}`}
                    className="text-center max-w-sm mx-auto mt-4 space-y-2"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <p className="text-[11px] sm:text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {(() => {
                            const dominant = output[0] > output[1] ? FEAT[0] : FEAT[1];
                            const ratio = Math.max(...output) / Math.max(0.01, Math.min(...output));
                            if (mode === "query") {
                                if (ratio > 3) return `"${word.word}" is focused on searching for ${dominant}.`;
                                if (ratio > 1.5) return `"${word.word}" mainly searches for ${dominant}, with some interest in the other.`;
                                return `"${word.word}" searches for both features roughly equally.`;
                            }
                            if (ratio > 3) return `"${word.word}" strongly advertises its ${dominant}.`;
                            if (ratio > 1.5) return `"${word.word}" mainly offers ${dominant} to other words.`;
                            return `"${word.word}" advertises both features roughly equally.`;
                        })()}
                    </p>
                    {isDefault && (
                        <p className="text-[10px] italic" style={{ color: `${accent}45` }}>
                            {mode === "query"
                                ? `\uD83C\uDFAF Try it: can you make "${word.word}" search only for action?`
                                : `\uD83C\uDFAF Try it: can you make "${word.word}" advertise only royalty?`}
                        </p>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
