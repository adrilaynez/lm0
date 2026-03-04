"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Mock neuron data ─── */
interface NeuronData {
    id: number;
    label: string;
    emoji: string;
    description: string;
    insight: string;
    topPositive: { pattern: string; activation: number }[];
    topNegative: { pattern: string; activation: number }[];
}

const NEURONS: NeuronData[] = [
    {
        id: 0, label: "Vowel Pairs", emoji: "🔤",
        description: "Fires strongly when two vowels appear together",
        insight: "This neuron learned that vowel pairs often predict specific continuations — 'ea' usually leads to 'd', 't', or 'r' (read, eat, ear). It suppresses consonant clusters because they signal a completely different continuation pattern.",
        topPositive: [
            { pattern: "ea_", activation: 0.94 }, { pattern: "ou_", activation: 0.91 },
            { pattern: "ai_", activation: 0.87 }, { pattern: "io_", activation: 0.83 },
            { pattern: "ue_", activation: 0.79 },
        ],
        topNegative: [
            { pattern: "str", activation: -0.88 }, { pattern: "ngl", activation: -0.82 },
            { pattern: "thr", activation: -0.76 }, { pattern: "scr", activation: -0.71 },
            { pattern: "spl", activation: -0.65 },
        ],
    },
    {
        id: 1, label: "Word Endings", emoji: "📍",
        description: "Detects common word-ending patterns",
        insight: "This neuron detects suffixes — the structural endings of words. When it fires, the model knows a space is likely coming. It suppresses word-beginning digraphs because those signal we're mid-word.",
        topPositive: [
            { pattern: "ing", activation: 0.96 }, { pattern: "tion", activation: 0.92 },
            { pattern: "ent", activation: 0.85 }, { pattern: "ous", activation: 0.81 },
            { pattern: "ble", activation: 0.77 },
        ],
        topNegative: [
            { pattern: "qu_", activation: -0.84 }, { pattern: "wh_", activation: -0.79 },
            { pattern: "kn_", activation: -0.72 }, { pattern: "wr_", activation: -0.68 },
            { pattern: "ph_", activation: -0.61 },
        ],
    },
    {
        id: 2, label: "Consonant Clusters", emoji: "🧱",
        description: "Responds to dense consonant sequences",
        insight: "English has specific rules about which consonants can cluster. This neuron learned 'str', 'thr', 'spr' are legal onsets — they strongly predict a vowel is coming next. Pure vowel sequences suppress it.",
        topPositive: [
            { pattern: "str", activation: 0.93 }, { pattern: "thr", activation: 0.89 },
            { pattern: "spr", activation: 0.84 }, { pattern: "chr", activation: 0.80 },
            { pattern: "scr", activation: 0.76 },
        ],
        topNegative: [
            { pattern: "aei", activation: -0.91 }, { pattern: "oui", activation: -0.85 },
            { pattern: "eau", activation: -0.78 }, { pattern: "iou", activation: -0.73 },
            { pattern: "aou", activation: -0.67 },
        ],
    },
    {
        id: 3, label: "th- Detector", emoji: "🎯",
        description: "Specialized for 'th' digraph patterns",
        insight: "'th' is the most common digraph in English. This neuron became a specialist — it fires for ANY 'th' pattern and predicts 'e', 'a', 'i' as likely continuations (the, that, this). Rare digraphs strongly suppress it.",
        topPositive: [
            { pattern: "th_", activation: 0.97 }, { pattern: "the", activation: 0.95 },
            { pattern: "tha", activation: 0.90 }, { pattern: "thi", activation: 0.86 },
            { pattern: "tho", activation: 0.82 },
        ],
        topNegative: [
            { pattern: "zz_", activation: -0.83 }, { pattern: "qq_", activation: -0.79 },
            { pattern: "xx_", activation: -0.74 }, { pattern: "jj_", activation: -0.68 },
            { pattern: "vv_", activation: -0.63 },
        ],
    },
    {
        id: 4, label: "Space Predictor", emoji: "⬜",
        description: "Fires when a space/word boundary is likely next",
        insight: "Word boundaries are critical for language. This neuron learned common word endings ('ed', 'ly', 'er') that almost always precede a space. It suppresses word-initial patterns because those mean we're inside a word.",
        topPositive: [
            { pattern: "ed_", activation: 0.95 }, { pattern: "ly_", activation: 0.91 },
            { pattern: "er_", activation: 0.87 }, { pattern: "nd_", activation: 0.84 },
            { pattern: "of_", activation: 0.80 },
        ],
        topNegative: [
            { pattern: "_th", activation: -0.90 }, { pattern: "_wh", activation: -0.85 },
            { pattern: "_sh", activation: -0.79 }, { pattern: "_ch", activation: -0.74 },
            { pattern: "_st", activation: -0.69 },
        ],
    },
    {
        id: 5, label: "Double Letters", emoji: "👯",
        description: "Detects repeated characters",
        insight: "Letter doubling follows specific rules in English — 'll', 'ss', 'tt' are common, but 'qq' or 'xx' almost never appear. This neuron learned which doublings are legitimate and predicts accordingly.",
        topPositive: [
            { pattern: "ll_", activation: 0.94 }, { pattern: "ss_", activation: 0.90 },
            { pattern: "tt_", activation: 0.86 }, { pattern: "ee_", activation: 0.83 },
            { pattern: "oo_", activation: 0.79 },
        ],
        topNegative: [
            { pattern: "qua", activation: -0.82 }, { pattern: "xyl", activation: -0.77 },
            { pattern: "zea", activation: -0.71 }, { pattern: "jux", activation: -0.66 },
            { pattern: "vex", activation: -0.60 },
        ],
    },
    {
        id: 6, label: "Vowel-Consonant", emoji: "🔄",
        description: "Responds to alternating vowel-consonant rhythm",
        insight: "Many common English words follow a CVCV pattern (like 'data', 'item'). This neuron detects that rhythm. Consonant clusters break the rhythm and suppress it — they signal a different word structure.",
        topPositive: [
            { pattern: "ata", activation: 0.92 }, { pattern: "ete", activation: 0.88 },
            { pattern: "iti", activation: 0.84 }, { pattern: "ovo", activation: 0.80 },
            { pattern: "unu", activation: 0.76 },
        ],
        topNegative: [
            { pattern: "ght", activation: -0.87 }, { pattern: "nch", activation: -0.82 },
            { pattern: "rld", activation: -0.76 }, { pattern: "mpt", activation: -0.71 },
            { pattern: "lph", activation: -0.65 },
        ],
    },
    {
        id: 7, label: "Common vs Rare", emoji: "📊",
        description: "Responds to common trigrams, inhibits rare ones",
        insight: "This neuron acts as a 'normality detector'. Common patterns like 'the', 'and', 'for' fire it strongly — the model uses this signal to stay in 'common English' mode. Rare sequences like 'qx' suppress it, signaling something unusual.",
        topPositive: [
            { pattern: "and", activation: 0.91 }, { pattern: "the", activation: 0.88 },
            { pattern: "for", activation: 0.84 }, { pattern: "her", activation: 0.80 },
            { pattern: "was", activation: 0.76 },
        ],
        topNegative: [
            { pattern: "qx_", activation: -0.95 }, { pattern: "zj_", activation: -0.90 },
            { pattern: "xq_", activation: -0.86 }, { pattern: "jz_", activation: -0.81 },
            { pattern: "qz_", activation: -0.77 },
        ],
    },
];

// Simulate activation for arbitrary input
function simulateActivation(neuronId: number, input: string): number {
    const n = NEURONS[neuronId];
    let best = 0;
    for (const p of n.topPositive) {
        if (input.includes(p.pattern.replace("_", " "))) return p.activation * 0.95;
        if (input.includes(p.pattern.replace("_", ""))) best = Math.max(best, p.activation * 0.6);
    }
    for (const p of n.topNegative) {
        if (input.includes(p.pattern.replace("_", " "))) return p.activation * 0.95;
        if (input.includes(p.pattern.replace("_", ""))) best = Math.min(best, p.activation * 0.6);
    }
    // Random-ish fallback based on hash
    if (best === 0) {
        let h = 0;
        for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i) + neuronId * 7) | 0;
        best = ((h % 100) / 100) * 0.4 - 0.2;
    }
    return best;
}

function ActivationBar({ value, max, delay = 0 }: { value: number; max: number; delay?: number }) {
    const width = Math.abs(value / max) * 100;
    const isPositive = value >= 0;
    return (
        <div className="flex items-center gap-2 h-6">
            <span className="text-[10px] font-mono text-white/40 w-10 text-right shrink-0 tabular-nums">
                {value > 0 ? "+" : ""}{value.toFixed(2)}
            </span>
            <div className="flex-1 h-2.5 bg-white/[0.04] rounded-full overflow-hidden relative">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 0.5, delay, ease: "easeOut" }}
                    className={`h-full rounded-full ${isPositive ? "bg-gradient-to-r from-violet-500/50 to-violet-400/70" : "bg-gradient-to-r from-rose-500/50 to-rose-400/70"}`}
                />
            </div>
        </div>
    );
}

function MiniSparkline({ values }: { values: number[] }) {
    const h = 20;
    const w = 40;
    const mid = h / 2;
    const points = values.map((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = mid - (v / 1) * (mid - 2);
        return `${x},${y}`;
    }).join(" ");
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-10 h-5">
            <line x1={0} y1={mid} x2={w} y2={mid} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
            <polyline points={points} fill="none" stroke="rgba(167,139,250,0.5)" strokeWidth={1.2} strokeLinejoin="round" />
        </svg>
    );
}

export function NeuronActivationExplorer() {
    const [selected, setSelected] = useState<number | null>(null);
    const [testInput, setTestInput] = useState("the");
    const neuron = selected !== null ? NEURONS[selected] : null;

    const testActivations = useMemo(() => {
        if (!testInput.trim()) return NEURONS.map(() => 0);
        return NEURONS.map((_, i) => simulateActivation(i, testInput.toLowerCase()));
    }, [testInput]);

    return (
        <div className="flex flex-col gap-5">
            {/* Test input */}
            <div className="flex items-center gap-3 px-1">
                <span className="text-[10px] font-mono text-white/30 shrink-0">Test input:</span>
                <input
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value.slice(0, 8))}
                    className="flex-1 max-w-[200px] px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-sm font-mono text-white/70 focus:border-violet-500/40 focus:outline-none transition-colors"
                    placeholder="type 3 chars..."
                    maxLength={8}
                />
                <span className="text-[9px] font-mono text-white/20">See which neurons fire</span>
            </div>

            {/* Neuron grid — 2 rows of 4 */}
            <div className="grid grid-cols-4 gap-2.5">
                {NEURONS.map((n) => {
                    const act = testActivations[n.id];
                    const isActive = selected === n.id;
                    const absAct = Math.abs(act);
                    const actColor = act >= 0 ? "#a78bfa" : "#f43f5e";
                    return (
                        <button
                            key={n.id}
                            onClick={() => setSelected(isActive ? null : n.id)}
                            className={`group relative flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${isActive
                                    ? "bg-violet-500/15 border-violet-500/40 scale-[1.03] shadow-lg shadow-violet-500/5"
                                    : "bg-white/[0.02] border-white/[0.08] hover:border-violet-400/25 hover:bg-violet-500/[0.03]"
                                }`}
                        >
                            {/* Activation glow ring */}
                            <div className="relative">
                                <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all"
                                    style={{
                                        backgroundColor: isActive ? actColor + "25" : `rgba(255,255,255,${0.04 + absAct * 0.12})`,
                                        color: isActive ? actColor : `rgba(255,255,255,${0.3 + absAct * 0.4})`,
                                        boxShadow: absAct > 0.5 ? `0 0 ${absAct * 12}px ${actColor}20` : "none",
                                    }}
                                >
                                    {n.emoji}
                                </div>
                                {/* Mini activation indicator */}
                                <div
                                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-[3px] rounded-full transition-all"
                                    style={{
                                        width: `${Math.max(4, absAct * 28)}px`,
                                        backgroundColor: actColor + (absAct > 0.3 ? "90" : "40"),
                                    }}
                                />
                            </div>
                            <span className={`text-[8px] font-mono leading-tight text-center transition-colors ${isActive ? "text-violet-300" : "text-white/35"
                                }`}>
                                {n.label}
                            </span>
                            <span className="text-[8px] font-mono tabular-nums" style={{ color: actColor + "90" }}>
                                {act >= 0 ? "+" : ""}{act.toFixed(2)}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Detail panel */}
            <AnimatePresence mode="wait">
                {neuron && (
                    <motion.div
                        key={neuron.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="rounded-xl border border-violet-500/20 bg-gradient-to-b from-violet-500/[0.06] to-transparent p-4 sm:p-5 space-y-4"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-lg">
                                {neuron.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-violet-200">h{neuron.id}: {neuron.label}</h4>
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-violet-500/15 text-violet-400/70 border border-violet-500/20">
                                        tanh(w·x + b)
                                    </span>
                                </div>
                                <p className="text-[11px] text-white/40">{neuron.description}</p>
                            </div>
                        </div>

                        {/* Insight */}
                        <div className="px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                            <p className="text-[10px] text-white/50 leading-relaxed">{neuron.insight}</p>
                        </div>

                        {/* Activation bars — side by side */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <h5 className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-violet-400/70 mb-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                                    Fires most strongly
                                </h5>
                                <div className="space-y-1">
                                    {neuron.topPositive.map((p, i) => (
                                        <div key={p.pattern} className="flex items-center gap-2">
                                            <code className="text-[11px] font-mono text-violet-200 bg-violet-500/10 px-1.5 py-0.5 rounded w-12 text-center shrink-0 border border-violet-500/10">
                                                {p.pattern}
                                            </code>
                                            <ActivationBar value={p.activation} max={1} delay={i * 0.05} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h5 className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-rose-400/70 mb-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                    Most suppressed
                                </h5>
                                <div className="space-y-1">
                                    {neuron.topNegative.map((p, i) => (
                                        <div key={p.pattern} className="flex items-center gap-2">
                                            <code className="text-[11px] font-mono text-rose-200 bg-rose-500/10 px-1.5 py-0.5 rounded w-12 text-center shrink-0 border border-rose-500/10">
                                                {p.pattern}
                                            </code>
                                            <ActivationBar value={p.activation} max={1} delay={i * 0.05} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Current test result */}
                        {testInput.trim() && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                            >
                                <span className="text-[10px] font-mono text-white/30">
                                    For input &quot;{testInput}&quot;:
                                </span>
                                <span className="text-sm font-mono font-bold" style={{
                                    color: testActivations[neuron.id] >= 0 ? "#a78bfa" : "#f43f5e"
                                }}>
                                    {testActivations[neuron.id] >= 0 ? "+" : ""}{testActivations[neuron.id].toFixed(3)}
                                </span>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {!neuron && (
                <div className="text-center py-4 space-y-1">
                    <p className="text-xs text-white/30 italic">Click any neuron to explore what it detects</p>
                    <p className="text-[9px] text-white/15">Each neuron learned a different pattern — none of this was programmed</p>
                </div>
            )}
        </div>
    );
}
