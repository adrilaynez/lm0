"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  CharacterFeatureScoring
  Shows that each character can be described by a set of numerical features.
  User picks a character, sees a radar/bar chart of feature scores.
  Bridges the gap between categorical grouping (CharacterFeatureExplorer)
  and the 2D numeric embedding (ManualEmbeddingBuilder).
*/

interface CharFeatures {
    vowelness: number;
    frequency: number;
    tallness: number;
    roundness: number;
    voicing: number;
}

const FEATURES: { key: keyof CharFeatures; label: string; color: string; description: string }[] = [
    { key: "vowelness", label: "Vowelness", color: "#a78bfa", description: "How vowel-like is this character?" },
    { key: "frequency", label: "Frequency", color: "#f59e0b", description: "How often does it appear in English?" },
    { key: "tallness", label: "Tallness", color: "#34d399", description: "Does it have ascenders (b,d,h) or descenders (g,p,y)?" },
    { key: "roundness", label: "Roundness", color: "#60a5fa", description: "Does its shape contain curves (o,c) or only lines (k,v)?" },
    { key: "voicing", label: "Voicing", color: "#f472b6", description: "Is the sound voiced (b,d,g) or unvoiced (p,t,k)?" },
];

const CHAR_DATA: Record<string, CharFeatures> = {
    a: { vowelness: 1.0, frequency: 0.82, tallness: 0.0, roundness: 0.7, voicing: 1.0 },
    b: { vowelness: 0.0, frequency: 0.15, tallness: 0.8, roundness: 0.6, voicing: 1.0 },
    c: { vowelness: 0.0, frequency: 0.28, tallness: 0.0, roundness: 0.8, voicing: 0.0 },
    d: { vowelness: 0.0, frequency: 0.43, tallness: 0.8, roundness: 0.6, voicing: 1.0 },
    e: { vowelness: 1.0, frequency: 1.0, tallness: 0.0, roundness: 0.5, voicing: 1.0 },
    f: { vowelness: 0.0, frequency: 0.22, tallness: 0.8, roundness: 0.1, voicing: 0.0 },
    g: { vowelness: 0.0, frequency: 0.20, tallness: -0.8, roundness: 0.7, voicing: 1.0 },
    h: { vowelness: 0.0, frequency: 0.61, tallness: 0.8, roundness: 0.1, voicing: 0.0 },
    i: { vowelness: 1.0, frequency: 0.70, tallness: 0.3, roundness: 0.1, voicing: 1.0 },
    j: { vowelness: 0.0, frequency: 0.02, tallness: -0.5, roundness: 0.3, voicing: 1.0 },
    k: { vowelness: 0.0, frequency: 0.08, tallness: 0.8, roundness: 0.0, voicing: 0.0 },
    l: { vowelness: 0.3, frequency: 0.40, tallness: 0.8, roundness: 0.0, voicing: 1.0 },
    m: { vowelness: 0.0, frequency: 0.24, tallness: 0.0, roundness: 0.3, voicing: 1.0 },
    n: { vowelness: 0.0, frequency: 0.67, tallness: 0.0, roundness: 0.3, voicing: 1.0 },
    o: { vowelness: 1.0, frequency: 0.75, tallness: 0.0, roundness: 1.0, voicing: 1.0 },
    p: { vowelness: 0.0, frequency: 0.19, tallness: -0.8, roundness: 0.6, voicing: 0.0 },
    q: { vowelness: 0.0, frequency: 0.01, tallness: -0.8, roundness: 0.7, voicing: 0.0 },
    r: { vowelness: 0.2, frequency: 0.60, tallness: 0.0, roundness: 0.3, voicing: 1.0 },
    s: { vowelness: 0.0, frequency: 0.63, tallness: 0.0, roundness: 0.8, voicing: 0.0 },
    t: { vowelness: 0.0, frequency: 0.91, tallness: 0.8, roundness: 0.1, voicing: 0.0 },
    u: { vowelness: 1.0, frequency: 0.28, tallness: 0.0, roundness: 0.7, voicing: 1.0 },
    v: { vowelness: 0.0, frequency: 0.10, tallness: 0.0, roundness: 0.0, voicing: 1.0 },
    w: { vowelness: 0.1, frequency: 0.24, tallness: 0.0, roundness: 0.1, voicing: 1.0 },
    x: { vowelness: 0.0, frequency: 0.02, tallness: 0.0, roundness: 0.0, voicing: 0.0 },
    y: { vowelness: 0.5, frequency: 0.20, tallness: -0.8, roundness: 0.2, voicing: 1.0 },
    z: { vowelness: 0.0, frequency: 0.01, tallness: 0.0, roundness: 0.2, voicing: 1.0 },
};

const ALPHABET = Object.keys(CHAR_DATA);

// Groups to compare
const COMPARE_GROUPS = [
    { label: "Vowels", chars: ["a", "e", "i", "o", "u"], color: "#a78bfa" },
    { label: "Stops", chars: ["p", "t", "k", "b", "d", "g"], color: "#f59e0b" },
    { label: "Rare", chars: ["q", "x", "z", "j"], color: "#f43f5e" },
];

export function CharacterFeatureScoring() {
    const [selected, setSelected] = useState<string>("e");
    const [compareMode, setCompareMode] = useState(false);

    const features = CHAR_DATA[selected];

    return (
        <div className="space-y-4">
            {/* Character picker */}
            <div className="flex flex-wrap gap-1 justify-center">
                {ALPHABET.map((ch) => (
                    <button
                        key={ch}
                        onClick={() => { setSelected(ch); setCompareMode(false); }}
                        className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all border ${
                            selected === ch && !compareMode
                                ? "bg-violet-500/20 border-violet-500/50 text-violet-300 scale-110"
                                : "bg-white/[0.03] border-white/10 text-white/40 hover:border-violet-400/30 hover:text-violet-300"
                        }`}
                    >
                        {ch}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {!compareMode && (
                    <motion.div
                        key={selected}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-xl font-mono font-bold text-violet-300">
                                {selected}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white/80">
                                    Character &apos;{selected}&apos; — Feature Vector
                                </p>
                                <p className="text-[10px] font-mono text-white/30">
                                    [{FEATURES.map(f => features[f.key].toFixed(1)).join(", ")}]
                                </p>
                            </div>
                        </div>

                        {/* Feature bars */}
                        <div className="space-y-3">
                            {FEATURES.map((f) => {
                                const val = features[f.key];
                                const absVal = Math.abs(val);
                                return (
                                    <div key={f.key} className="group">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />
                                                <span className="text-[10px] font-mono font-bold" style={{ color: f.color }}>
                                                    {f.label}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-mono text-white/40 tabular-nums">
                                                {val >= 0 ? "+" : ""}{val.toFixed(1)}
                                            </span>
                                        </div>
                                        <div className="h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
                                            <motion.div
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: f.color + "80" }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${absVal * 100}%` }}
                                                transition={{ duration: 0.4, ease: "easeOut" }}
                                            />
                                        </div>
                                        <p className="text-[8px] text-white/20 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {f.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Insight */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mt-4 px-3 py-2 rounded-lg bg-violet-500/[0.06] border border-violet-500/15"
                        >
                            <p className="text-[10px] text-violet-300/70 leading-relaxed">
                                Each number describes one aspect of the character. Together, these {FEATURES.length} numbers form a <strong className="text-violet-300">feature vector</strong> — a list of numbers that IS the character&apos;s identity to the network.
                            </p>
                        </motion.div>
                    </motion.div>
                )}

                {compareMode && (
                    <motion.div
                        key="compare"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5"
                    >
                        <p className="text-xs font-bold text-white/60 mb-3">Group Feature Comparison</p>
                        <div className="space-y-4">
                            {COMPARE_GROUPS.map((group) => {
                                // Average features for the group
                                const avg: CharFeatures = { vowelness: 0, frequency: 0, tallness: 0, roundness: 0, voicing: 0 };
                                for (const ch of group.chars) {
                                    const d = CHAR_DATA[ch];
                                    for (const f of FEATURES) avg[f.key] += d[f.key];
                                }
                                for (const f of FEATURES) avg[f.key] /= group.chars.length;

                                return (
                                    <div key={group.label}>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-[10px] font-mono font-bold" style={{ color: group.color }}>
                                                {group.label}
                                            </span>
                                            <span className="text-[8px] font-mono text-white/20">
                                                ({group.chars.join(", ")})
                                            </span>
                                        </div>
                                        <div className="flex gap-1.5">
                                            {FEATURES.map((f) => (
                                                <div key={f.key} className="flex-1 flex flex-col items-center gap-0.5">
                                                    <div className="w-full h-16 rounded bg-white/[0.03] relative overflow-hidden">
                                                        <motion.div
                                                            className="absolute bottom-0 left-0 right-0 rounded"
                                                            style={{ backgroundColor: group.color + "40" }}
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${Math.abs(avg[f.key]) * 100}%` }}
                                                            transition={{ duration: 0.5 }}
                                                        />
                                                        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono text-white/40">
                                                            {avg[f.key].toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <span className="text-[7px] font-mono text-white/20 truncate w-full text-center">
                                                        {f.label.slice(0, 4)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-[9px] text-white/25 mt-3 text-center">
                            Similar characters have similar feature vectors — that&apos;s the whole idea behind embeddings.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle compare */}
            <div className="flex justify-center">
                <button
                    onClick={() => setCompareMode(!compareMode)}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-mono border transition-all"
                    style={{
                        backgroundColor: compareMode ? "#a78bfa15" : "rgba(255,255,255,0.02)",
                        borderColor: compareMode ? "#a78bfa35" : "rgba(255,255,255,0.08)",
                        color: compareMode ? "#a78bfa" : "rgba(255,255,255,0.3)",
                    }}
                >
                    {compareMode ? "← Back to Single Character" : "Compare Groups →"}
                </button>
            </div>
        </div>
    );
}
