"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  DepthGenerationGallery
  Side-by-side text samples from models with 1, 2, and 3 hidden layers.
  Uses illustrative pre-generated samples.
*/

const SAMPLES = [
    {
        layers: 1,
        text: "the mand of she he was the re of the be and the s",
        loss: 2.12,
        label: "1 Layer",
    },
    {
        layers: 2,
        text: "the morning of the said and there was a little mo",
        loss: 1.98,
        label: "2 Layers",
    },
    {
        layers: 3,
        text: "ther ting he sthe and the whe the the he ther sth",
        loss: 2.15,
        label: "3 Layers",
    },
];

export function DepthGenerationGallery() {
    const [highlighted, setHighlighted] = useState<number | null>(null);

    return (
        <div className="p-5 sm:p-6 space-y-3">
            <p className="text-[9px] font-mono uppercase tracking-widest text-white/25">Generated text by model depth (seed: &quot;the &quot;)</p>
            <div className="space-y-3">
                {SAMPLES.map((sample, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onMouseEnter={() => setHighlighted(i)}
                        onMouseLeave={() => setHighlighted(null)}
                        className={`rounded-xl border p-4 transition-all ${
                            highlighted === i
                                ? "border-violet-500/30 bg-violet-500/5"
                                : "border-white/[0.06] bg-white/[0.02]"
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono font-bold text-violet-400">{sample.label}</span>
                            <span className="text-[9px] font-mono text-white/20">loss: {sample.loss.toFixed(2)}</span>
                        </div>
                        <p className="font-mono text-sm text-white/60 leading-relaxed tracking-wide">
                            <span className="text-violet-400/60">the </span>
                            {sample.text.slice(4)}
                        </p>
                    </motion.div>
                ))}
            </div>
            <p className="text-[10px] text-white/20 text-center">
                The 2-layer model produces the most coherent text. The 3-layer model regresses — its training was unstable.
            </p>
        </div>
    );
}
