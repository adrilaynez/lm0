"use client";

import { useCallback, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, RotateCcw } from "lucide-react";

/*
  MLPForwardPassAnimator — Cinematic Redesign
  Persistent SVG network diagram as base with 6 animated steps:
  1. Input: "h", "e", "l" as colored circles
  2. One-Hot: each letter expands into one-hot vector
  3. Embed: one-hot × E matrix = embedding vectors with feature labels
  4. Concatenate: embeddings slide together into one long vector
  5. Hidden: W₁x + b₁ → tanh, neurons light up
  6. Output: softmax → probability bars
  Each step highlights the corresponding layer in the network diagram.
*/

const STEPS = [
    { id: "input", label: "Input", color: "#f59e0b", hex: "#f59e0b" },
    { id: "onehot", label: "One-Hot", color: "#fb923c", hex: "#fb923c" },
    { id: "embed", label: "Embed", color: "#a78bfa", hex: "#a78bfa" },
    { id: "concat", label: "Concat", color: "#60a5fa", hex: "#60a5fa" },
    { id: "hidden", label: "Hidden", color: "#34d399", hex: "#34d399" },
    { id: "output", label: "Softmax", color: "#f43f5e", hex: "#f43f5e" },
] as const;

const CHARS = ["h", "e", "l"] as const;
const TOKEN_IDS = [8, 5, 12];
const FEATURE_LABELS = ["freq", "vowel", "shape", "pos"];
const EMBEDDINGS = [
    [0.42, -0.15, 0.78, 0.11],
    [-0.33, 0.91, 0.05, -0.62],
    [0.67, 0.23, -0.44, 0.55],
];
const HIDDEN_VALS = [0.82, -0.14, 0.67, 0.03, -0.91, 0.45];
const TOP_PREDS = [
    { char: "l", prob: 0.42 },
    { char: "p", prob: 0.11 },
    { char: "o", prob: 0.09 },
    { char: "i", prob: 0.07 },
    { char: "e", prob: 0.05 },
];

// Network diagram layer positions — evenly spread across SVG width
const LAYER_X = [55, 155, 265, 370, 475, 585];
const LAYER_COLORS = STEPS.map(s => s.hex);

// SVG constants
const SVG_W = 640;
const SVG_H = 180;
const SVG_CY = 95; // vertical center for nodes

function layerOpacity(layerIdx: number, step: number): number {
    if (layerIdx === step) return 1;
    if (layerIdx < step) return 0.4;
    return 0.12;
}

export function MLPForwardPassAnimator() {
    const [step, setStep] = useState(0);

    const advance = useCallback(() => {
        setStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }, []);

    const reset = useCallback(() => setStep(0), []);

    // Network diagram node positions
    const layers = useMemo(() => [
        { x: LAYER_X[0], nodes: 3, labels: ["h", "e", "l"], title: "Input" },
        { x: LAYER_X[1], nodes: 3, labels: ["27", "27", "27"], title: "One-Hot" },
        { x: LAYER_X[2], nodes: 3, labels: ["4d", "4d", "4d"], title: "Embed" },
        { x: LAYER_X[3], nodes: 1, labels: ["12d"], title: "Concat" },
        { x: LAYER_X[4], nodes: 6, labels: Array.from({ length: 6 }, (_, i) => `h${i}`), title: "Hidden" },
        { x: LAYER_X[5], nodes: 4, labels: ["P(a)", "P(b)", "…", "P(z)"], title: "Output" },
    ], []);

    return (
        <div className="p-4 sm:p-6 space-y-3">
            {/* Step selector */}
            <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto pb-1">
                {STEPS.map((s, i) => (
                    <button
                        key={s.id}
                        onClick={() => setStep(i)}
                        className="flex items-center gap-0.5 px-2 sm:px-2.5 py-1.5 rounded-md text-[9px] sm:text-[10px] font-mono font-bold transition-all border whitespace-nowrap"
                        style={{
                            backgroundColor: i <= step ? s.hex + "18" : "rgba(255,255,255,0.02)",
                            borderColor: i <= step ? s.hex + "40" : "rgba(255,255,255,0.06)",
                            color: i <= step ? s.hex : "rgba(255,255,255,0.2)",
                        }}
                    >
                        {s.label}
                        {i < STEPS.length - 1 && <ChevronRight className="w-2.5 h-2.5 opacity-30 ml-0.5" />}
                    </button>
                ))}
            </div>

            {/* Persistent network diagram */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ minHeight: 100 }}>
                    {/* Connection lines between layers */}
                    {layers.map((layer, li) => {
                        if (li === 0) return null;
                        const prev = layers[li - 1];
                        const prevSpacing = prev.nodes > 1 ? 90 / Math.max(prev.nodes - 1, 1) : 0;
                        const curSpacing = layer.nodes > 1 ? 90 / Math.max(layer.nodes - 1, 1) : 0;
                        const lines: React.ReactNode[] = [];
                        for (let p = 0; p < prev.nodes; p++) {
                            for (let c = 0; c < layer.nodes; c++) {
                                const py = SVG_CY + (p - (prev.nodes - 1) / 2) * prevSpacing;
                                const cy = SVG_CY + (c - (layer.nodes - 1) / 2) * curSpacing;
                                const active = li <= step;
                                lines.push(
                                    <motion.line
                                        key={`${li}-${p}-${c}`}
                                        x1={prev.x} y1={py} x2={layer.x} y2={cy}
                                        stroke={active ? LAYER_COLORS[li] : "white"}
                                        initial={{ strokeOpacity: 0.02 }}
                                        animate={{ strokeOpacity: active ? 0.12 : 0.02 }}
                                        strokeWidth={0.8}
                                    />
                                );
                            }
                        }
                        return <g key={li}>{lines}</g>;
                    })}

                    {/* Nodes per layer */}
                    {layers.map((layer, li) => {
                        const spacing = layer.nodes > 1 ? 90 / Math.max(layer.nodes - 1, 1) : 0;
                        const op = layerOpacity(li, step);
                        return (
                            <g key={li}>
                                {/* Layer title */}
                                <motion.text
                                    x={layer.x} y={12}
                                    textAnchor="middle" fontSize={8} fontFamily="monospace" fontWeight="bold"
                                    fill={LAYER_COLORS[li]}
                                    animate={{ fillOpacity: op }}
                                >
                                    {layer.title}
                                </motion.text>
                                {/* Nodes */}
                                {Array.from({ length: layer.nodes }, (_, ni) => {
                                    const ny = SVG_CY + (ni - (layer.nodes - 1) / 2) * spacing;
                                    return (
                                        <g key={ni}>
                                            <motion.circle
                                                cx={layer.x} cy={ny} r={10}
                                                fill={LAYER_COLORS[li]}
                                                stroke={LAYER_COLORS[li]}
                                                strokeWidth={li === step ? 2 : 1}
                                                animate={{
                                                    fillOpacity: li === step ? 0.25 : op * 0.12,
                                                    strokeOpacity: op * 0.5,
                                                    scale: li === step ? 1.1 : 1,
                                                }}
                                                transition={{ duration: 0.3 }}
                                            />
                                            <motion.text
                                                x={layer.x} y={ny + 3}
                                                textAnchor="middle" fontSize={7} fontFamily="monospace" fontWeight="bold"
                                                fill="white"
                                                animate={{ fillOpacity: op * 0.7 }}
                                            >
                                                {layer.labels[ni]}
                                            </motion.text>
                                        </g>
                                    );
                                })}
                            </g>
                        );
                    })}

                    {/* Animated data pulse on active connections */}
                    {step > 0 && (
                        <motion.circle
                            cx={LAYER_X[step - 1]}
                            cy={SVG_CY}
                            r={3}
                            fill={LAYER_COLORS[step]}
                            initial={{ cx: LAYER_X[step - 1], opacity: 0.8 }}
                            animate={{ cx: LAYER_X[step], opacity: 0 }}
                            transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1.5 }}
                        />
                    )}
                </svg>
            </div>

            {/* Detail panel — step-specific content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5 min-h-[220px]"
                >
                    {/* Step 0: Input characters */}
                    {step === 0 && (
                        <div className="space-y-4">
                            <p className="text-[11px] font-mono text-white/40">Step 1 · Input: 3 characters of context</p>
                            <div className="flex gap-3 justify-center items-end">
                                {CHARS.map((ch, i) => (
                                    <motion.div
                                        key={ch}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: i * 0.15, type: "spring", stiffness: 200 }}
                                        className="flex flex-col items-center gap-1.5"
                                    >
                                        <span className="w-14 h-14 rounded-xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-2xl font-mono font-bold text-amber-400 shadow-lg shadow-amber-500/10">
                                            {ch}
                                        </span>
                                        <span className="text-[9px] font-mono text-white/20">position {i}</span>
                                    </motion.div>
                                ))}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.5, type: "spring" }}
                                    className="flex flex-col items-center gap-1.5"
                                >
                                    <span className="w-14 h-14 rounded-xl bg-white/[0.03] border-2 border-dashed border-white/10 flex items-center justify-center text-2xl font-mono font-bold text-white/15">?</span>
                                    <span className="text-[9px] font-mono text-white/15">predict</span>
                                </motion.div>
                            </div>
                            <p className="text-center text-[10px] text-white/25 font-mono">What comes after &quot;hel&quot;?</p>
                        </div>
                    )}

                    {/* Step 1: One-Hot encoding */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <p className="text-[11px] font-mono text-white/40">Step 2 · Each character → 27-dim one-hot vector (only 1 is non-zero)</p>
                            <div className="space-y-3">
                                {CHARS.map((ch, ci) => (
                                    <motion.div
                                        key={ch}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: ci * 0.2 }}
                                        className="flex items-center gap-2"
                                    >
                                        <span className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-sm font-mono font-bold text-amber-400 shrink-0">{ch}</span>
                                        <span className="text-white/15 text-xs">→</span>
                                        <div className="flex gap-[2px] flex-wrap">
                                            {Array.from({ length: 27 }, (_, j) => {
                                                const isActive = j === TOKEN_IDS[ci];
                                                return (
                                                    <motion.span
                                                        key={j}
                                                        className="w-3.5 h-5 rounded-[2px] flex items-center justify-center text-[7px] font-mono font-bold"
                                                        style={{
                                                            backgroundColor: isActive ? "#fb923c40" : "rgba(255,255,255,0.03)",
                                                            border: isActive ? "1px solid #fb923c60" : "1px solid rgba(255,255,255,0.04)",
                                                            color: isActive ? "#fb923c" : "rgba(255,255,255,0.1)",
                                                        }}
                                                        initial={{ scaleY: 0 }}
                                                        animate={{ scaleY: 1 }}
                                                        transition={{ delay: ci * 0.2 + j * 0.008 }}
                                                    >
                                                        {isActive ? "1" : "0"}
                                                    </motion.span>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <p className="text-[9px] text-white/20 font-mono text-center">Position of the 1 = alphabet index: h→{TOKEN_IDS[0]}, e→{TOKEN_IDS[1]}, l→{TOKEN_IDS[2]}</p>
                        </div>
                    )}

                    {/* Step 2: Embedding lookup */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <p className="text-[11px] font-mono text-white/40">Step 3 · One-hot × Embedding matrix E → dense vector per character</p>
                            <div className="space-y-3">
                                {CHARS.map((ch, ci) => (
                                    <motion.div
                                        key={ch}
                                        initial={{ opacity: 0, x: -15 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: ci * 0.25 }}
                                        className="flex items-center gap-2"
                                    >
                                        <span className="text-[10px] font-mono text-white/30 w-14 shrink-0">E[{TOKEN_IDS[ci]}] →</span>
                                        <div className="flex gap-1.5">
                                            {EMBEDDINGS[ci].map((v, j) => (
                                                <motion.div
                                                    key={j}
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ delay: ci * 0.25 + j * 0.08, type: "spring", stiffness: 200 }}
                                                    className="flex flex-col items-center gap-0.5"
                                                >
                                                    <span className="px-2 py-1.5 rounded-md text-[10px] font-mono font-bold bg-violet-500/15 border border-violet-500/25 text-violet-400 tabular-nums">
                                                        {v.toFixed(2)}
                                                    </span>
                                                    <span className="text-[7px] font-mono text-violet-400/30">{FEATURE_LABELS[j]}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <p className="text-[9px] text-white/20 font-mono text-center">Each row of E is a learned 4D representation — the network decides what these features mean</p>
                        </div>
                    )}

                    {/* Step 3: Concatenation */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <p className="text-[11px] font-mono text-white/40">Step 4 · Concatenate 3 embeddings → single vector (3 × 4 = 12 dims)</p>
                            <div className="flex gap-[3px] flex-wrap justify-center">
                                {CHARS.map((ch, ci) => (
                                    EMBEDDINGS[ci].map((v, j) => {
                                        const globalIdx = ci * 4 + j;
                                        const charColors = ["#f59e0b", "#a78bfa", "#60a5fa"];
                                        return (
                                            <motion.span
                                                key={globalIdx}
                                                initial={{ opacity: 0, y: -10 - ci * 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: globalIdx * 0.04, type: "spring", stiffness: 150 }}
                                                className="px-2 py-1.5 rounded-md text-[9px] font-mono font-bold tabular-nums border"
                                                style={{
                                                    backgroundColor: charColors[ci] + "15",
                                                    borderColor: charColors[ci] + "30",
                                                    color: charColors[ci],
                                                }}
                                            >
                                                {v.toFixed(2)}
                                            </motion.span>
                                        );
                                    })
                                ))}
                            </div>
                            <div className="flex justify-center gap-6 text-[8px] font-mono text-white/20">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500/30" /> h</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-violet-500/30" /> e</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500/30" /> l</span>
                            </div>
                            <p className="text-center text-[10px] text-white/20 font-mono">x ∈ ℝ¹² — the full input to the hidden layer</p>
                        </div>
                    )}

                    {/* Step 4: Hidden layer */}
                    {step === 4 && (
                        <div className="space-y-4">
                            <p className="text-[11px] font-mono text-white/40">Step 5 · h = tanh(W₁x + b₁) — 6 pattern-detecting neurons</p>
                            <div className="flex gap-2 justify-center">
                                {HIDDEN_VALS.map((v, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: i * 0.1, type: "spring", stiffness: 180 }}
                                        className="flex flex-col items-center gap-1"
                                    >
                                        <motion.div
                                            className="w-11 h-11 rounded-xl border-2 flex items-center justify-center text-[11px] font-mono font-bold"
                                            style={{ borderColor: "#34d39960" }}
                                            animate={{
                                                backgroundColor: `rgba(16, 185, 129, ${Math.abs(v) * 0.25})`,
                                                boxShadow: Math.abs(v) > 0.5 ? `0 0 12px rgba(16, 185, 129, ${Math.abs(v) * 0.3})` : "none",
                                            }}
                                            transition={{ duration: 0.4, delay: i * 0.1 + 0.3 }}
                                        >
                                            <span style={{ color: v > 0 ? "#6ee7b7" : "#fca5a5" }}>{v.toFixed(2)}</span>
                                        </motion.div>
                                        <span className="text-[8px] text-white/15 font-mono">h{i}</span>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-white/20">
                                <span>W₁<span className="text-white/10">(6×12)</span></span>
                                <span>·</span>
                                <span className="text-blue-400/50">x</span>
                                <span>+</span>
                                <span>b₁</span>
                                <span className="text-white/10">→</span>
                                <span className="text-emerald-400/50">tanh</span>
                                <span className="text-white/10">→</span>
                                <span className="text-emerald-400/60">h</span>
                            </div>
                            <p className="text-[9px] text-white/20 font-mono text-center">Bright neurons = strong activation · Red = negative · tanh squashes to [-1, +1]</p>
                        </div>
                    )}

                    {/* Step 5: Output + Softmax */}
                    {step === 5 && (
                        <div className="space-y-4">
                            <p className="text-[11px] font-mono text-white/40">Step 6 · softmax(W₂h + b₂) → probability for each of 27 characters</p>
                            <div className="space-y-1.5">
                                {TOP_PREDS.map((pred, i) => (
                                    <motion.div
                                        key={pred.char}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.08 }}
                                        className="flex items-center gap-3"
                                    >
                                        <span
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-mono font-bold border"
                                            style={{
                                                backgroundColor: i === 0 ? "#f43f5e25" : "rgba(255,255,255,0.02)",
                                                borderColor: i === 0 ? "#f43f5e50" : "rgba(255,255,255,0.06)",
                                                color: i === 0 ? "#f43f5e" : "rgba(255,255,255,0.3)",
                                            }}
                                        >
                                            {pred.char}
                                        </span>
                                        <div className="flex-1 h-3 rounded-full bg-white/[0.04] overflow-hidden">
                                            <motion.div
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: i === 0 ? "#f43f5e80" : "rgba(255,255,255,0.08)" }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pred.prob * 100 * 2.2}%` }}
                                                transition={{ duration: 0.5, delay: i * 0.08 }}
                                            />
                                        </div>
                                        <span className="text-[11px] font-mono tabular-nums w-12 text-right" style={{ color: i === 0 ? "#f43f5e" : "rgba(255,255,255,0.25)" }}>
                                            {(pred.prob * 100).toFixed(1)}%
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="text-center text-[11px] text-emerald-400/70 font-mono font-bold mt-2"
                            >
                                ✓ Top prediction: &apos;l&apos; (42.0%) — correct!
                            </motion.p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="flex justify-between items-center">
                <button onClick={reset} className="flex items-center gap-1.5 text-[10px] font-mono text-white/30 hover:text-white/50 transition-colors">
                    <RotateCcw className="w-3 h-3" /> Reset
                </button>
                {step < STEPS.length - 1 ? (
                    <button
                        onClick={advance}
                        className="px-4 py-2 rounded-lg text-xs font-mono font-bold transition-colors"
                        style={{
                            backgroundColor: STEPS[step + 1].hex + "18",
                            borderColor: STEPS[step + 1].hex + "40",
                            color: STEPS[step + 1].hex,
                            border: "1px solid",
                        }}
                    >
                        Next Step →
                    </button>
                ) : (
                    <button
                        onClick={reset}
                        className="px-4 py-2 rounded-lg text-xs font-mono font-bold transition-colors bg-violet-500/15 border border-violet-500/30 text-violet-400 hover:bg-violet-500/25"
                    >
                        <span className="flex items-center gap-1.5"><RotateCcw className="w-3 h-3" /> Replay</span>
                    </button>
                )}
            </div>
        </div>
    );
}
