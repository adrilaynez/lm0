"use client";

import { useCallback, useMemo, useState } from "react";

import { motion } from "framer-motion";

/*
  ManualEmbeddingBuilder
  User assigns 2 numeric features to letters. Platform plots them in 2D.
  Vowels cluster! Consonants cluster! Builds the core embedding intuition.
*/

interface CharFeature {
    char: string;
    x: number;
    y: number;
}

const CHARS_TO_PLOT = "aeioutnsrhldcmpfgbywkvjxqz.".split("");

const PRESET_FEATURES: Record<string, [number, number]> = {
    a: [0.9, 0.8], e: [0.85, 0.9], i: [0.8, 0.7], o: [0.88, 0.6], u: [0.82, 0.5],
    t: [0.3, 0.9], n: [0.35, 0.85], s: [0.4, 0.8], r: [0.25, 0.7], h: [0.3, 0.65],
    l: [0.35, 0.6], d: [0.4, 0.55], c: [0.45, 0.5], m: [0.28, 0.45], p: [0.5, 0.4],
    f: [0.55, 0.35], g: [0.48, 0.3], b: [0.52, 0.25], y: [0.6, 0.75], w: [0.58, 0.65],
    k: [0.15, 0.2], v: [0.18, 0.15], j: [0.1, 0.1], x: [0.08, 0.18], q: [0.05, 0.08],
    z: [0.12, 0.05], ".": [0.5, 0.05],
};

const COLORS: Record<string, string> = {};
for (const ch of CHARS_TO_PLOT) {
    if ("aeiou".includes(ch)) COLORS[ch] = "#a78bfa";
    else if ("tnrshl".includes(ch)) COLORS[ch] = "#60a5fa";
    else if ("kvjxqz".includes(ch)) COLORS[ch] = "#f59e0b";
    else COLORS[ch] = "#6b7280";
}

export function ManualEmbeddingBuilder() {
    const [mode, setMode] = useState<"manual" | "preset">("preset");
    const [features, setFeatures] = useState<Record<string, [number, number]>>(() => {
        const init: Record<string, [number, number]> = {};
        for (const ch of CHARS_TO_PLOT) {
            init[ch] = PRESET_FEATURES[ch] || [Math.random(), Math.random()];
        }
        return init;
    });
    const [selectedChar, setSelectedChar] = useState<string | null>(null);
    const [hoveredChar, setHoveredChar] = useState<string | null>(null);

    const randomize = useCallback(() => {
        const next: Record<string, [number, number]> = {};
        for (const ch of CHARS_TO_PLOT) {
            next[ch] = [Math.random(), Math.random()];
        }
        setFeatures(next);
        setMode("manual");
    }, []);

    const usePreset = useCallback(() => {
        setFeatures({ ...PRESET_FEATURES });
        setMode("preset");
    }, []);

    const updateFeature = useCallback((char: string, dim: 0 | 1, value: number) => {
        setFeatures(prev => ({
            ...prev,
            [char]: dim === 0 ? [value, prev[char][1]] : [prev[char][0], value],
        }));
        setMode("manual");
    }, []);

    const points: CharFeature[] = useMemo(() =>
        CHARS_TO_PLOT.map(ch => ({
            char: ch,
            x: features[ch]?.[0] ?? 0.5,
            y: features[ch]?.[1] ?? 0.5,
        })),
        [features]
    );

    const W = 320;
    const H = 280;
    const PAD = 30;

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Controls */}
            <div className="flex items-center gap-3 flex-wrap">
                <button
                    onClick={usePreset}
                    className={`text-[10px] font-mono px-3 py-1.5 rounded-lg border transition-colors ${
                        mode === "preset"
                            ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                            : "border-white/[0.08] text-white/30 hover:text-white/50"
                    }`}
                >
                    Meaningful features
                </button>
                <button
                    onClick={randomize}
                    className={`text-[10px] font-mono px-3 py-1.5 rounded-lg border transition-colors ${
                        mode === "manual"
                            ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                            : "border-white/[0.08] text-white/30 hover:text-white/50"
                    }`}
                >
                    Random features
                </button>
                <div className="flex gap-3 ml-auto">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-violet-400/60" />
                        <span className="text-[9px] font-mono text-white/25">vowels</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-400/60" />
                        <span className="text-[9px] font-mono text-white/25">common</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-amber-400/60" />
                        <span className="text-[9px] font-mono text-white/25">rare</span>
                    </div>
                </div>
            </div>

            {/* 2D scatter plot */}
            <div className="flex justify-center">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md" style={{ minHeight: 240 }}>
                    {/* Axes */}
                    <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
                    <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
                    <text x={W / 2} y={H - 6} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="monospace">
                        Feature 1
                    </text>
                    <text x={8} y={H / 2} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="monospace"
                        transform={`rotate(-90, 8, ${H / 2})`}>
                        Feature 2
                    </text>

                    {/* Grid lines */}
                    {[0.25, 0.5, 0.75].map(v => (
                        <g key={v}>
                            <line
                                x1={PAD + v * (W - 2 * PAD)}
                                y1={PAD}
                                x2={PAD + v * (W - 2 * PAD)}
                                y2={H - PAD}
                                stroke="rgba(255,255,255,0.03)"
                                strokeWidth={1}
                            />
                            <line
                                x1={PAD}
                                y1={PAD + v * (H - 2 * PAD)}
                                x2={W - PAD}
                                y2={PAD + v * (H - 2 * PAD)}
                                stroke="rgba(255,255,255,0.03)"
                                strokeWidth={1}
                            />
                        </g>
                    ))}

                    {/* Points */}
                    {points.map(p => {
                        const cx = PAD + p.x * (W - 2 * PAD);
                        const cy = H - PAD - p.y * (H - 2 * PAD);
                        const color = COLORS[p.char] || "#6b7280";
                        const isSelected = selectedChar === p.char;
                        const isHovered = hoveredChar === p.char;

                        return (
                            <g key={p.char}>
                                <motion.circle
                                    cx={cx}
                                    cy={cy}
                                    r={isSelected || isHovered ? 8 : 5}
                                    fill={color + "40"}
                                    stroke={color}
                                    strokeWidth={isSelected ? 2 : 1}
                                    animate={{ cx, cy }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    style={{ cursor: "pointer" }}
                                    onMouseEnter={() => setHoveredChar(p.char)}
                                    onMouseLeave={() => setHoveredChar(null)}
                                    onClick={() => setSelectedChar(selectedChar === p.char ? null : p.char)}
                                />
                                <motion.text
                                    x={cx}
                                    y={cy - (isSelected || isHovered ? 11 : 8)}
                                    textAnchor="middle"
                                    fill={color}
                                    fontSize={isSelected || isHovered ? "11" : "9"}
                                    fontFamily="monospace"
                                    fontWeight="bold"
                                    animate={{ x: cx, y: cy - (isSelected || isHovered ? 11 : 8) }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    style={{ pointerEvents: "none" }}
                                >
                                    {p.char === "." ? "·" : p.char}
                                </motion.text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Selected char editor */}
            {selectedChar && (
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3 space-y-2"
                >
                    <p className="text-[10px] font-mono text-white/40">
                        Editing <span className="text-white/70 font-bold">&apos;{selectedChar}&apos;</span>
                    </p>
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] font-mono text-white/25 w-16">Feature 1</span>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={features[selectedChar]?.[0] ?? 0.5}
                            onChange={e => updateFeature(selectedChar, 0, Number(e.target.value))}
                            className="flex-1 accent-violet-500"
                        />
                        <span className="text-[9px] font-mono text-white/30 w-8 tabular-nums">
                            {(features[selectedChar]?.[0] ?? 0).toFixed(2)}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] font-mono text-white/25 w-16">Feature 2</span>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={features[selectedChar]?.[1] ?? 0.5}
                            onChange={e => updateFeature(selectedChar, 1, Number(e.target.value))}
                            className="flex-1 accent-violet-500"
                        />
                        <span className="text-[9px] font-mono text-white/30 w-8 tabular-nums">
                            {(features[selectedChar]?.[1] ?? 0).toFixed(2)}
                        </span>
                    </div>
                </motion.div>
            )}

            {/* Insight */}
            {mode === "preset" && (
                <div className="rounded-lg border border-emerald-500/[0.15] bg-emerald-500/[0.04] p-3">
                    <p className="text-[10px] text-emerald-400/60 font-mono uppercase tracking-widest mb-1">Notice</p>
                    <p className="text-xs text-white/50 leading-relaxed">
                        With meaningful features, vowels naturally cluster together (top-right), and rare consonants cluster apart (bottom-left).
                        Click &quot;Random features&quot; to see what happens when features are meaningless — the structure disappears.
                        <strong className="text-white/70"> Embeddings learn features like these automatically.</strong>
                    </p>
                </div>
            )}
        </div>
    );
}
