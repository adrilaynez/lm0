"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  CharacterSimilarityBlindness — Redesigned
  Compact visualizer showing CONCRETE word-logic failures caused by
  one-hot encoding's blindness to character similarity.
  No spoiler "ideal" view — just the problem, viscerally demonstrated.
  
  Shows 3 interactive examples where the model fails because it
  treats all characters as equally distant.
*/

interface BlindnessExample {
    context: string;
    blank: number; // position of the blank
    good: { char: string; word: string }[];
    bad: { char: string; word: string }[];
    insight: string;
}

const EXAMPLES: BlindnessExample[] = [
    {
        context: "b_t",
        blank: 1,
        good: [
            { char: "a", word: "bat" },
            { char: "u", word: "but" },
            { char: "i", word: "bit" },
            { char: "e", word: "bet" },
            { char: "o", word: "bot" },
        ],
        bad: [
            { char: "z", word: "bzt" },
            { char: "x", word: "bxt" },
            { char: "q", word: "bqt" },
        ],
        insight: "All 5 vowels make real words here. But to the monster, 'a' is just as far from 'e' as 'z' is. It can't use what it learns about 'bat' to help predict 'bet'.",
    },
    {
        context: "th_",
        blank: 2,
        good: [
            { char: "e", word: "the" },
            { char: "a", word: "tha" },
            { char: "i", word: "thi" },
            { char: "o", word: "tho" },
        ],
        bad: [
            { char: "q", word: "thq" },
            { char: "z", word: "thz" },
            { char: "x", word: "thx" },
        ],
        insight: "'th' is almost always followed by a vowel. But the monster sees no connection between 'e', 'a', 'i', 'o' — it has to learn each one from scratch.",
    },
    {
        context: "_ight",
        blank: 0,
        good: [
            { char: "l", word: "light" },
            { char: "r", word: "right" },
            { char: "n", word: "night" },
            { char: "s", word: "sight" },
            { char: "f", word: "fight" },
            { char: "m", word: "might" },
            { char: "t", word: "tight" },
        ],
        bad: [
            { char: "z", word: "zight" },
            { char: "q", word: "qight" },
        ],
        insight: "Many consonants work before '-ight'. Knowledge that 'l' works should hint that 'r' and 'n' might too — they're all common consonants. But the monster treats them as strangers.",
    },
];

function DistanceBar({ label, isEqual }: { label: string; isEqual: boolean }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-white/30 w-6 text-right shrink-0">{label}</span>
            <div className="flex-1 h-2 bg-white/[0.03] rounded-full overflow-hidden">
                <motion.div
                    className={`h-full rounded-full ${isEqual ? "bg-rose-500/40" : "bg-rose-500/40"}`}
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.4 }}
                />
            </div>
            <span className="text-[9px] font-mono text-rose-400/60 w-8 shrink-0">√2</span>
        </div>
    );
}

export function CharacterSimilarityBlindness() {
    const [exIdx, setExIdx] = useState(0);
    const [showDistances, setShowDistances] = useState(false);
    const ex = EXAMPLES[exIdx];

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Example selector */}
            <div className="flex gap-2 flex-wrap">
                {EXAMPLES.map((e, i) => (
                    <button
                        key={i}
                        onClick={() => { setExIdx(i); setShowDistances(false); }}
                        className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all border ${exIdx === i
                                ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                                : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/60"
                            }`}
                    >
                        {e.context}
                    </button>
                ))}
            </div>

            {/* Word pattern display */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={exIdx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-3"
                >
                    {/* Good completions */}
                    <div>
                        <p className="text-[9px] font-mono text-emerald-400/60 uppercase tracking-widest mb-2">
                            Real words ✓
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {ex.good.map(({ char, word }) => (
                                <motion.div
                                    key={char}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="px-2.5 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06]"
                                >
                                    <span className="font-mono text-sm">
                                        {word.split("").map((ch, ci) => (
                                            <span
                                                key={ci}
                                                className={ci === ex.blank ? "text-emerald-400 font-bold" : "text-white/60"}
                                            >
                                                {ch}
                                            </span>
                                        ))}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Bad completions */}
                    <div>
                        <p className="text-[9px] font-mono text-rose-400/60 uppercase tracking-widest mb-2">
                            Nonsense ✗
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {ex.bad.map(({ char, word }) => (
                                <motion.div
                                    key={char}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="px-2.5 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/[0.06]"
                                >
                                    <span className="font-mono text-sm">
                                        {word.split("").map((ch, ci) => (
                                            <span
                                                key={ci}
                                                className={ci === ex.blank ? "text-rose-400 font-bold" : "text-white/60"}
                                            >
                                                {ch}
                                            </span>
                                        ))}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* "Show what the monster sees" button */}
                    {!showDistances && (
                        <button
                            onClick={() => setShowDistances(true)}
                            className="text-[10px] font-mono text-rose-400/60 hover:text-rose-400 transition-colors underline underline-offset-2"
                        >
                            What does the monster see? →
                        </button>
                    )}

                    {/* Distance comparison — the punchline */}
                    <AnimatePresence>
                        {showDistances && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="rounded-lg border border-rose-500/20 bg-rose-500/[0.03] p-3 space-y-1.5 overflow-hidden"
                            >
                                <p className="text-[9px] font-mono text-rose-400/80 uppercase tracking-widest mb-1">
                                    Distance from &apos;{ex.good[0].char}&apos; (one-hot)
                                </p>
                                {/* Show distances to a few good and bad chars */}
                                {[...ex.good.slice(1, 3), ...ex.bad.slice(0, 2)].map(({ char }) => (
                                    <DistanceBar key={char} label={char} isEqual={true} />
                                ))}
                                <p className="text-[10px] text-rose-300/60 mt-2 leading-relaxed">
                                    Every bar is the same length. &apos;{ex.good[0].char}&apos; → &apos;{ex.good[1].char}&apos; = √2.
                                    {" "}&apos;{ex.good[0].char}&apos; → &apos;{ex.bad[0].char}&apos; = √2.
                                    {" "}The monster literally cannot tell the difference.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Insight */}
                    <p className="text-[11px] text-white/40 leading-relaxed italic">
                        {ex.insight}
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
