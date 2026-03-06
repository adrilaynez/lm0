"use client";

import { useState, useCallback } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  GenerationGallery v2
  Side-by-side text generation samples from all four model types.
  Richer cards with quality bars, typewriter reveal, gradient accents.
*/

const SAMPLES = [
    {
        model: "Bigram",
        context: 1,
        loss: 2.85,
        quality: 15,
        seeds: [
            { seed: "the", text: "the s an t whe ris outhend" },
            { seed: "kin", text: "king t s ouf then ald whe" },
            { seed: "of ", text: "of the s an whe t ris ald" },
        ],
        color: "#9ca3af",
        verdict: "Random soup — no patterns beyond single characters",
    },
    {
        model: "N-gram (N=4)",
        context: 3,
        loss: 2.35,
        quality: 45,
        seeds: [
            { seed: "the", text: "the king of the land and" },
            { seed: "kin", text: "king was not the one who" },
            { seed: "of ", text: "of the great hall where" },
        ],
        color: "#f59e0b",
        verdict: "Real words appear — but the table lookup memorizes, doesn't learn",
    },
    {
        model: "Neural Net",
        context: 1,
        loss: 2.50,
        quality: 30,
        seeds: [
            { seed: "the", text: "thend and whe the king o" },
            { seed: "kin", text: "kinge the whan of ther a" },
            { seed: "of ", text: "of the ster and whing th" },
        ],
        color: "#10b981",
        verdict: "Learns patterns but still only 1 char context — invents plausible nonsense",
    },
    {
        model: "MLP + Embeddings",
        context: 8,
        loss: 1.46,
        quality: 75,
        seeds: [
            { seed: "the", text: "the throne of the kingdom" },
            { seed: "kin", text: "king arthur rode through" },
            { seed: "of ", text: "of the northern provinces" },
        ],
        color: "#8b5cf6",
        verdict: "Context + learned representations = coherent phrases for the first time",
    },
];

const SEEDS = ["the", "kin", "of "];

export function GenerationGallery() {
    const [seedIdx, setSeedIdx] = useState(0);
    const [revealedIdx, setRevealedIdx] = useState<number | null>(null);

    const cycleSeed = useCallback(() => {
        setSeedIdx(p => (p + 1) % SEEDS.length);
        setRevealedIdx(null);
    }, []);

    return (
        <div className="space-y-5">
            {/* Seed selector */}
            <div className="flex items-center justify-center gap-3">
                <span className="text-[8px] font-mono text-white/20 uppercase tracking-wider">Seed:</span>
                <div className="flex gap-1.5">
                    {SEEDS.map((seed, i) => (
                        <button
                            key={seed}
                            onClick={() => { setSeedIdx(i); setRevealedIdx(null); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${i === seedIdx
                                ? "bg-violet-500/15 border-violet-500/30 text-violet-400"
                                : "bg-white/[0.02] border-white/[0.06] text-white/20 hover:bg-white/[0.04]"
                                }`}
                        >
                            &quot;{seed.trim()}&quot;
                        </button>
                    ))}
                </div>
                <button onClick={cycleSeed} className="text-[9px] font-mono text-white/15 hover:text-white/30 transition-colors">
                    shuffle →
                </button>
            </div>

            {/* Generation cards */}
            <div className="space-y-2">
                <AnimatePresence mode="wait">
                    {SAMPLES.map((s, i) => {
                        const sample = s.seeds[seedIdx];
                        const isRevealed = revealedIdx === i;
                        return (
                            <motion.div
                                key={`${s.model}-${seedIdx}`}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="rounded-xl border overflow-hidden cursor-pointer group"
                                style={{ borderColor: `${s.color}15` }}
                                onClick={() => setRevealedIdx(isRevealed ? null : i)}
                            >
                                <div className="flex items-stretch">
                                    {/* Color accent bar */}
                                    <div className="w-1 flex-shrink-0" style={{ backgroundColor: `${s.color}30` }} />

                                    <div className="flex-1 p-3 sm:p-4 space-y-2">
                                        {/* Header */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                                <span className="text-[10px] font-mono font-bold" style={{ color: s.color }}>{s.model}</span>
                                                <span className="text-[8px] font-mono text-white/15">ctx={s.context}</span>
                                            </div>
                                            <span className="text-[9px] font-mono text-white/20">loss={s.loss.toFixed(2)}</span>
                                        </div>

                                        {/* Generated text */}
                                        <div className="rounded-lg bg-black/30 border border-white/[0.04] px-3 py-2">
                                            <p className="text-sm font-mono leading-relaxed text-white/50">
                                                <span className="font-bold" style={{ color: s.color }}>{sample.seed}</span>
                                                <motion.span
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: i * 0.08 + 0.1, duration: 0.4 }}
                                                >
                                                    {sample.text.slice(sample.seed.length)}
                                                </motion.span>
                                                <motion.span
                                                    className="inline-block w-[2px] h-3.5 ml-0.5 align-middle"
                                                    style={{ backgroundColor: s.color }}
                                                    animate={{ opacity: [1, 1, 0, 0] }}
                                                    transition={{ duration: 1, repeat: Infinity, times: [0, 0.49, 0.5, 1] }}
                                                />
                                            </p>
                                        </div>

                                        {/* Quality bar */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[7px] font-mono text-white/15 w-10 flex-shrink-0">Quality</span>
                                            <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                                                <motion.div
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: s.color }}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${s.quality}%` }}
                                                    transition={{ delay: i * 0.1, duration: 0.6 }}
                                                />
                                            </div>
                                            <span className="text-[7px] font-mono" style={{ color: `${s.color}80` }}>{s.quality}%</span>
                                        </div>

                                        {/* Verdict (expand on click) */}
                                        <AnimatePresence>
                                            {isRevealed && (
                                                <motion.p
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="text-[9px] font-mono leading-relaxed overflow-hidden"
                                                    style={{ color: `${s.color}80` }}
                                                >
                                                    {s.verdict}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            <p className="text-[8px] text-white/15 text-center font-mono">
                Illustrative samples · Click a card for analysis · The MLP produces the first truly coherent text
            </p>
        </div>
    );
}
