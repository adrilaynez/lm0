"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Eye, Zap } from "lucide-react";

/*
  EmbeddingTableBridge — Redesigned
  Makes the "each number = a learned feature" concept crystal clear.
  - Named, color-coded feature columns with intuitive labels
  - Visual magnitude bars alongside numbers
  - Hover/click to highlight patterns (vowels share similar patterns)
  - Side-by-side comparison mode
  - Beginner-friendly explanations throughout
*/

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

// Curated embedding values where features map to intuitive concepts
// D=4: vowel-ness | frequency | mouth-open | voiced
const FEATURES = [
    { key: "vowelness", label: "Vowel?", color: "#a78bfa", desc: "How vowel-like" },
    { key: "frequency", label: "Common?", color: "#60a5fa", desc: "How often it appears" },
    { key: "open", label: "Open?", color: "#f59e0b", desc: "Open vs closed mouth" },
    { key: "voiced", label: "Voiced?", color: "#34d399", desc: "Vocal cords vibrate?" },
];

const EMBEDDINGS: Record<string, number[]> = {
    a: [0.92, 0.85, 0.88, 0.95],
    e: [0.89, 0.91, 0.72, 0.92],
    i: [0.85, 0.72, 0.35, 0.88],
    t: [-0.48, 0.88, -0.52, -0.68],
    n: [-0.38, 0.78, -0.22, 0.82],
    z: [-0.72, 0.08, -0.55, 0.65],
    ".": [-0.90, -0.15, -0.88, -0.92],
};

const DISPLAY_CHARS = Object.keys(EMBEDDINGS);

function ValueBar({ value, color, highlight }: { value: number; color: string; highlight: boolean }) {
    const width = Math.abs(value) * 100;
    const isPositive = value >= 0;
    return (
        <div className="flex items-center gap-1.5 w-full">
            <div className="w-12 h-4 rounded-sm overflow-hidden bg-white/[0.04] relative flex items-center">
                {/* Center line */}
                <div className="absolute left-1/2 w-px h-full bg-white/10" />
                {/* Bar */}
                <motion.div
                    className="absolute h-3 rounded-sm"
                    style={{
                        backgroundColor: highlight ? color + "60" : (isPositive ? color + "30" : "rgba(244,63,94,0.2)"),
                        left: isPositive ? "50%" : undefined,
                        right: !isPositive ? "50%" : undefined,
                    }}
                    animate={{ width: `${width / 2}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>
            <span className={`text-[10px] font-mono tabular-nums w-10 text-right ${highlight ? "font-bold" : ""
                }`} style={{ color: highlight ? color : "rgba(255,255,255,0.35)" }}>
                {value >= 0 ? "+" : ""}{value.toFixed(2)}
            </span>
        </div>
    );
}

export function EmbeddingTableBridge() {
    const [selectedChar, setSelectedChar] = useState<string | null>(null);
    const [compareChar, setCompareChar] = useState<string | null>(null);
    const [showPatterns, setShowPatterns] = useState(false);

    const handleClick = (ch: string) => {
        if (selectedChar && selectedChar !== ch && !compareChar) {
            setCompareChar(ch);
        } else if (compareChar === ch || selectedChar === ch) {
            setSelectedChar(null);
            setCompareChar(null);
        } else {
            setSelectedChar(ch);
            setCompareChar(null);
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-4">
            {/* Header with toggle */}
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-mono text-white/35">
                    {!selectedChar
                        ? "Click a letter to see its features"
                        : !compareChar
                            ? "Click another letter to compare"
                            : "Comparing two characters"
                    }
                </p>
                <button
                    onClick={() => setShowPatterns(!showPatterns)}
                    className={`flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1.5 rounded-lg border transition-all ${showPatterns
                        ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                        : "border-white/[0.08] text-white/30 hover:text-white/50"
                        }`}
                >
                    <Eye className="w-3 h-3" />
                    {showPatterns ? "Patterns on" : "Show patterns"}
                </button>
            </div>

            {/* Feature column headers */}
            <div className="grid gap-1" style={{ gridTemplateColumns: "48px repeat(4, 1fr)" }}>
                <div />
                {FEATURES.map(f => (
                    <div key={f.key} className="text-center">
                        <span className="text-[10px] font-mono font-bold" style={{ color: f.color + "90" }}>
                            {f.label}
                        </span>
                        <p className="text-[7px] font-mono text-white/15">{f.desc}</p>
                    </div>
                ))}
            </div>

            {/* Table rows */}
            <div className="space-y-0.5">
                {DISPLAY_CHARS.map(ch => {
                    const isSelected = selectedChar === ch;
                    const isCompare = compareChar === ch;
                    const isVowel = VOWELS.has(ch);
                    const isHighlighted = isSelected || isCompare;
                    const vals = EMBEDDINGS[ch];

                    return (
                        <motion.div
                            key={ch}
                            onClick={() => handleClick(ch)}
                            className="grid gap-1 items-center rounded-lg px-2 py-1.5 cursor-pointer transition-all"
                            style={{
                                gridTemplateColumns: "48px repeat(4, 1fr)",
                                backgroundColor: isSelected
                                    ? "rgba(167,139,250,0.1)"
                                    : isCompare
                                        ? "rgba(52,211,153,0.08)"
                                        : showPatterns && isVowel
                                            ? "rgba(167,139,250,0.04)"
                                            : "transparent",
                                borderWidth: 1,
                                borderColor: isHighlighted ? (isSelected ? "#a78bfa30" : "#34d39930") : "transparent",
                            }}
                            whileHover={{ backgroundColor: isHighlighted ? undefined : "rgba(255,255,255,0.03)" }}
                            animate={isHighlighted ? { scale: [1, 1.005, 1] } : {}}
                        >
                            {/* Character label */}
                            <div className="flex items-center gap-1.5">
                                <span className={`text-base font-mono font-bold ${isVowel ? "text-violet-400" : ch === "." ? "text-amber-400" : "text-white/50"
                                    }`}>
                                    {ch}
                                </span>
                                {showPatterns && isVowel && (
                                    <span className="text-[7px] font-mono text-violet-400/40">V</span>
                                )}
                            </div>

                            {/* Feature values with bars */}
                            {vals.map((v, fi) => (
                                <ValueBar
                                    key={fi}
                                    value={v}
                                    color={FEATURES[fi].color}
                                    highlight={isHighlighted}
                                />
                            ))}
                        </motion.div>
                    );
                })}
            </div>

            {/* Comparison panel */}
            <AnimatePresence mode="wait">
                {selectedChar && (
                    <motion.div
                        key={`${selectedChar}-${compareChar}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="rounded-xl border border-violet-500/15 bg-gradient-to-br from-violet-500/[0.06] to-transparent p-4 sm:p-5"
                    >
                        {!compareChar ? (
                            // Single character view
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-2xl font-mono font-bold text-violet-400">{selectedChar}</span>
                                    <span className="text-[10px] font-mono text-white/25">=</span>
                                    <div className="flex items-center gap-0.5 font-mono text-sm">
                                        <span className="text-white/20">[</span>
                                        {EMBEDDINGS[selectedChar].map((v, i) => (
                                            <motion.span
                                                key={i}
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.08 }}
                                                className="px-1.5 py-0.5 rounded text-[11px] font-bold"
                                                style={{
                                                    color: FEATURES[i].color,
                                                    backgroundColor: FEATURES[i].color + "15",
                                                }}
                                            >
                                                {v >= 0 ? "+" : ""}{v.toFixed(2)}
                                            </motion.span>
                                        ))}
                                        <span className="text-white/20">]</span>
                                    </div>
                                </div>
                                <p className="text-xs text-white/40 leading-relaxed">
                                    {VOWELS.has(selectedChar)
                                        ? <>This is a <strong className="text-violet-300/70">vowel</strong> — notice the high &quot;Vowel?&quot; and &quot;Voiced?&quot; scores. Click another letter to compare.</>
                                        : selectedChar === "."
                                            ? <>The period is <strong className="text-amber-300/70">very different</strong> from all letters — negative across most features. Click a letter to compare.</>
                                            : <>This is a <strong className="text-blue-300/70">consonant</strong> — low &quot;Vowel?&quot; score. Click a vowel to see the contrast.</>
                                    }
                                </p>
                            </div>
                        ) : (
                            // Comparison view
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-2xl font-mono font-bold text-violet-400">{selectedChar}</span>
                                    <span className="text-white/20 text-sm">vs</span>
                                    <span className="text-2xl font-mono font-bold text-emerald-400">{compareChar}</span>
                                </div>
                                <div className="space-y-2">
                                    {FEATURES.map((f, fi) => {
                                        const vA = EMBEDDINGS[selectedChar][fi];
                                        const vB = EMBEDDINGS[compareChar!][fi];
                                        const diff = Math.abs(vA - vB);
                                        const similar = diff < 0.3;
                                        return (
                                            <div key={f.key} className="flex items-center gap-2">
                                                <span className="text-[9px] font-mono w-14 shrink-0" style={{ color: f.color + "80" }}>{f.label}</span>
                                                <div className="flex items-center gap-2 flex-1">
                                                    <span className="text-[10px] font-mono font-bold text-violet-300 w-10 text-right tabular-nums">
                                                        {vA >= 0 ? "+" : ""}{vA.toFixed(2)}
                                                    </span>
                                                    <div className="flex-1 h-3 rounded bg-white/[0.04] relative overflow-hidden">
                                                        <motion.div
                                                            className="absolute h-full rounded"
                                                            style={{ backgroundColor: "#a78bfa40", left: 0 }}
                                                            animate={{ width: `${((vA + 1) / 2) * 100}%` }}
                                                        />
                                                        <motion.div
                                                            className="absolute h-1 rounded top-1"
                                                            style={{ backgroundColor: "#34d39960", left: 0 }}
                                                            animate={{ width: `${((vB + 1) / 2) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-mono font-bold text-emerald-300 w-10 tabular-nums">
                                                        {vB >= 0 ? "+" : ""}{vB.toFixed(2)}
                                                    </span>
                                                </div>
                                                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${similar ? "bg-emerald-500/10 text-emerald-400/60" : "bg-rose-500/10 text-rose-400/60"
                                                    }`}>
                                                    {similar ? "similar" : "different"}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="text-[10px] text-white/30 mt-3 font-mono">
                                    {VOWELS.has(selectedChar) && VOWELS.has(compareChar!)
                                        ? "Both vowels — their feature patterns are very similar!"
                                        : VOWELS.has(selectedChar) !== VOWELS.has(compareChar!)
                                            ? "A vowel and a consonant — notice how different their patterns are."
                                            : "Both consonants — they share some features but differ in others."
                                    }
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom insight */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 flex items-start gap-2.5">
                <Zap className="w-3.5 h-3.5 text-violet-400/50 mt-0.5 shrink-0" />
                <p className="text-[10px] font-mono text-white/35 leading-relaxed">
                    Each column is a <strong className="text-white/55">feature the network learned on its own</strong>.
                    We gave them names to help you see the patterns, but the network just discovers
                    &quot;numbers that help predict the next letter.&quot;
                </p>
            </div>
        </div>
    );
}
