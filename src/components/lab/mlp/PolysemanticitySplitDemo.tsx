"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

/*
  PolysemanticitySplitDemo — v2 (Activation Bar Chart)
  For each neuron, shows the top input patterns that make it fire strongest,
  color-coded by category. The user sees that ONE neuron fires for inputs
  from MULTIPLE categories — that's polysemanticity made visible.
*/

interface ActivationEntry {
    input: string;
    activation: number; // 0-1 normalized
    category: string;
    color: string;
}

interface NeuronData {
    neuronId: number;
    activations: ActivationEntry[];
    insight: string;
    categories: { name: string; color: string }[];
}

const NEURONS: NeuronData[] = [
    {
        neuronId: 0,
        categories: [
            { name: "Vowel pairs", color: "#ec4899" },
            { name: "Common digraphs", color: "#3b82f6" },
        ],
        activations: [
            { input: "ea_", activation: 0.95, category: "Vowel pairs", color: "#ec4899" },
            { input: "th_", activation: 0.91, category: "Common digraphs", color: "#3b82f6" },
            { input: "ou_", activation: 0.87, category: "Vowel pairs", color: "#ec4899" },
            { input: "sh_", activation: 0.82, category: "Common digraphs", color: "#3b82f6" },
            { input: "ai_", activation: 0.78, category: "Vowel pairs", color: "#ec4899" },
            { input: "ch_", activation: 0.74, category: "Common digraphs", color: "#3b82f6" },
            { input: "ie_", activation: 0.65, category: "Vowel pairs", color: "#ec4899" },
            { input: "wh_", activation: 0.60, category: "Common digraphs", color: "#3b82f6" },
            { input: "he_", activation: 0.55, category: "Vowel pairs", color: "#ec4899" },
            { input: "bo_", activation: 0.12, category: "Vowel pairs", color: "#ec4899" },
        ],
        insight: "This neuron fires strongly for BOTH vowel pairs AND consonant digraphs. Why? Both predict similar next characters (consonants like n, r, s). It learned the output pattern, not the input category.",
    },
    {
        neuronId: 1,
        categories: [
            { name: "Word endings", color: "#10b981" },
            { name: "High-frequency", color: "#f59e0b" },
        ],
        activations: [
            { input: "ed_", activation: 0.97, category: "Word endings", color: "#10b981" },
            { input: "the", activation: 0.93, category: "High-frequency", color: "#f59e0b" },
            { input: "ng_", activation: 0.88, category: "Word endings", color: "#10b981" },
            { input: "and", activation: 0.85, category: "High-frequency", color: "#f59e0b" },
            { input: "ly_", activation: 0.80, category: "Word endings", color: "#10b981" },
            { input: "of_", activation: 0.72, category: "High-frequency", color: "#f59e0b" },
            { input: "er_", activation: 0.68, category: "Word endings", color: "#10b981" },
            { input: "is_", activation: 0.61, category: "High-frequency", color: "#f59e0b" },
            { input: "to_", activation: 0.55, category: "High-frequency", color: "#f59e0b" },
            { input: "xyz", activation: 0.08, category: "Word endings", color: "#10b981" },
        ],
        insight: "Word endings AND high-frequency words both predict SPACE as the next character. This neuron is really a 'space predictor' — two categories, one job.",
    },
    {
        neuronId: 3,
        categories: [
            { name: "After punctuation", color: "#a855f7" },
            { name: "Word starters", color: "#06b6d4" },
        ],
        activations: [
            { input: ". _", activation: 0.96, category: "After punctuation", color: "#a855f7" },
            { input: "_th", activation: 0.92, category: "Word starters", color: "#06b6d4" },
            { input: ", _", activation: 0.86, category: "After punctuation", color: "#a855f7" },
            { input: "_an", activation: 0.83, category: "Word starters", color: "#06b6d4" },
            { input: "! _", activation: 0.77, category: "After punctuation", color: "#a855f7" },
            { input: "_in", activation: 0.73, category: "Word starters", color: "#06b6d4" },
            { input: "_he", activation: 0.68, category: "Word starters", color: "#06b6d4" },
            { input: "? _", activation: 0.62, category: "After punctuation", color: "#a855f7" },
            { input: "_wh", activation: 0.55, category: "Word starters", color: "#06b6d4" },
            { input: "abc", activation: 0.10, category: "Word starters", color: "#06b6d4" },
        ],
        insight: "After punctuation and word-starting patterns are really the SAME thing: sentence boundaries. The neuron learned 'transition between thoughts' as a single concept.",
    },
    {
        neuronId: 5,
        categories: [
            { name: "Double letters", color: "#10b981" },
            { name: "Consonant clusters", color: "#8b5cf6" },
        ],
        activations: [
            { input: "ll_", activation: 0.94, category: "Double letters", color: "#10b981" },
            { input: "str", activation: 0.90, category: "Consonant clusters", color: "#8b5cf6" },
            { input: "ss_", activation: 0.85, category: "Double letters", color: "#10b981" },
            { input: "thr", activation: 0.81, category: "Consonant clusters", color: "#8b5cf6" },
            { input: "tt_", activation: 0.76, category: "Double letters", color: "#10b981" },
            { input: "spr", activation: 0.71, category: "Consonant clusters", color: "#8b5cf6" },
            { input: "ee_", activation: 0.66, category: "Double letters", color: "#10b981" },
            { input: "scr", activation: 0.60, category: "Consonant clusters", color: "#8b5cf6" },
            { input: "oo_", activation: 0.53, category: "Double letters", color: "#10b981" },
            { input: "a_b", activation: 0.09, category: "Double letters", color: "#10b981" },
        ],
        insight: "Doubles (ll, ss) and clusters (str, thr) both signal 'a VOWEL comes next'. The neuron detects consonant-heavy sequences that need a vowel to continue — one prediction, two patterns.",
    },
];

export function PolysemanticitySplitDemo() {
    const [selected, setSelected] = useState(0);
    const neuron = NEURONS[selected];

    return (
        <div className="space-y-4">
            {/* Illustrative data disclaimer */}
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-mono text-amber-400/70 leading-relaxed">
                    <strong>Illustrative examples.</strong> These activation patterns are designed to show polysemanticity clearly. Real neurons can respond to dozens of unrelated patterns — this is simplified for clarity.
                </p>
            </div>

            {/* Neuron selector */}
            <div className="flex flex-wrap gap-2 justify-center">
                {NEURONS.map((n, i) => (
                    <button
                        key={n.neuronId}
                        onClick={() => setSelected(i)}
                        className={`w-10 h-9 rounded-lg text-xs font-bold border transition-all ${selected === i
                            ? "border-violet-500 bg-violet-500/20 text-violet-300"
                            : "border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:text-white/60"
                            }`}
                    >
                        #{n.neuronId}
                    </button>
                ))}
            </div>

            {/* Activation bar chart */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={selected}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3"
                >
                    {/* Legend */}
                    <div className="flex items-center justify-between">
                        <div className="flex gap-3">
                            {neuron.categories.map(c => (
                                <span key={c.name} className="flex items-center gap-1.5 text-[10px] font-mono">
                                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c.color }} />
                                    <span style={{ color: c.color }}>{c.name}</span>
                                </span>
                            ))}
                        </div>
                        <span className="text-[9px] font-mono text-white/15">
                            Neuron #{neuron.neuronId} · top activations
                        </span>
                    </div>

                    {/* Bars */}
                    <div className="space-y-1">
                        {neuron.activations.map((a, i) => (
                            <div key={a.input} className="flex items-center gap-2">
                                <span
                                    className="w-8 text-right text-[10px] font-mono font-bold shrink-0"
                                    style={{ color: a.color }}
                                >
                                    {a.input}
                                </span>
                                <div className="flex-1 h-5 relative rounded bg-white/[0.02]">
                                    <motion.div
                                        className="absolute top-0.5 bottom-0.5 left-0 rounded-sm"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${a.activation * 100}%` }}
                                        transition={{ duration: 0.4, delay: i * 0.03 }}
                                        style={{ backgroundColor: a.color, opacity: 0.6 }}
                                    />
                                    <span
                                        className="absolute right-1.5 top-0.5 text-[8px] font-mono font-bold"
                                        style={{ color: a.color + "90" }}
                                    >
                                        {(a.activation * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <span
                                    className="w-3 text-[7px] font-mono shrink-0 rounded-sm text-center"
                                    style={{
                                        backgroundColor: a.color + "20",
                                        color: a.color,
                                    }}
                                >
                                    {neuron.categories.findIndex(c => c.name === a.category) === 0 ? "A" : "B"}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Key observation callout */}
                    <div className="flex gap-2 p-3 rounded-lg border" style={{
                        borderColor: "#8b5cf620",
                        background: "linear-gradient(135deg, rgba(139,92,246,0.06), transparent)",
                    }}>
                        <span className="text-violet-400 text-sm shrink-0">💡</span>
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                                Why does one neuron fire for both?
                            </p>
                            <p className="text-xs text-violet-200/70 leading-relaxed">
                                {neuron.insight}
                            </p>
                        </div>
                    </div>

                    {/* Visual emphasis: the alternating colors ARE the point */}
                    <p className="text-[9px] font-mono text-white/20 text-center">
                        Notice the alternating colors in the bars — one neuron, two categories, mixed together. That&apos;s polysemanticity.
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
