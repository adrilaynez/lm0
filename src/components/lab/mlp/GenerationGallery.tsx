"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  GenerationGallery
  Side-by-side text generation samples from all four model types.
  Illustrative samples showing quality progression.
*/

const SAMPLES = [
    {
        model: "Bigram",
        seeds: [
            { seed: "the", text: "the s an t whe ris outhend" },
            { seed: "kin", text: "king t s ouf then ald whe" },
            { seed: "of ", text: "of the s an whe t ris ald" },
        ],
        color: "rgb(156,163,175)",
    },
    {
        model: "N-gram",
        seeds: [
            { seed: "the", text: "the king of the land and" },
            { seed: "kin", text: "king was not the one who" },
            { seed: "of ", text: "of the great hall where" },
        ],
        color: "rgb(245,158,11)",
    },
    {
        model: "Neural Net",
        seeds: [
            { seed: "the", text: "thend and whe the king o" },
            { seed: "kin", text: "kinge the whan of ther a" },
            { seed: "of ", text: "of the ster and whing th" },
        ],
        color: "rgb(16,185,129)",
    },
    {
        model: "MLP+Emb",
        seeds: [
            { seed: "the", text: "the throne of the kingdom" },
            { seed: "kin", text: "king arthur rode through" },
            { seed: "of ", text: "of the northern provinces" },
        ],
        color: "rgb(139,92,246)",
    },
];

export function GenerationGallery() {
    const [seedIdx, setSeedIdx] = useState(0);

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Seed selector */}
            <div className="flex gap-2 justify-center">
                {["the", "kin", "of "].map((seed, i) => (
                    <button
                        key={seed}
                        onClick={() => setSeedIdx(i)}
                        className={`px-4 py-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            i === seedIdx
                                ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                                : "bg-white/[0.02] border-white/[0.06] text-white/20 hover:bg-white/[0.04]"
                        }`}
                    >
                        &quot;{seed.trim()}&quot;
                    </button>
                ))}
            </div>

            {/* Generation cards */}
            <div className="grid gap-2">
                {SAMPLES.map((s, i) => (
                    <motion.div
                        key={`${s.model}-${seedIdx}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 flex items-start gap-3"
                    >
                        <span
                            className="text-[9px] font-mono font-bold w-16 flex-shrink-0 mt-0.5"
                            style={{ color: s.color }}
                        >
                            {s.model}
                        </span>
                        <p className="text-sm font-mono text-white/50 leading-relaxed">
                            <span style={{ color: s.color }}>{s.seeds[seedIdx].seed}</span>
                            {s.seeds[seedIdx].text.slice(s.seeds[seedIdx].seed.length)}
                        </p>
                    </motion.div>
                ))}
            </div>

            <p className="text-[10px] text-white/20 text-center">
                Illustrative samples showing quality progression. The MLP produces the most coherent text thanks to learned embeddings and multi-character context.
            </p>
        </div>
    );
}
