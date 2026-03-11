"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  V48 — DepthVsQualityViz
  Slider: 1-12 blocks. Shows generated text quality + loss metric.
  Demonstrates how more blocks = better language understanding.
*/

const SAMPLES: { blocks: number; loss: number; text: string; quality: string }[] = [
    { blocks: 1, loss: 4.8, text: "The cat the the sat the on", quality: "Gibberish" },
    { blocks: 2, loss: 3.9, text: "The cat sat on mat and the", quality: "Fragments" },
    { blocks: 3, loss: 3.2, text: "The cat sat on the mat and", quality: "Basic grammar" },
    { blocks: 4, loss: 2.8, text: "The cat sat on the warm mat.", quality: "Simple sentences" },
    { blocks: 6, loss: 2.3, text: "The cat sat on the warm mat and purred softly.", quality: "Decent prose" },
    { blocks: 8, loss: 1.9, text: "The cat sat on the warm mat, purring softly as the sun set behind the hills.", quality: "Good prose" },
    { blocks: 12, loss: 1.4, text: "The old cat sat on the warm mat, purring softly as golden light streamed through the window, casting long shadows across the wooden floor.", quality: "Rich prose" },
];

function getSample(blocks: number) {
    let best = SAMPLES[0];
    for (const s of SAMPLES) {
        if (s.blocks <= blocks) best = s;
    }
    return best;
}

const QUALITY_COLORS: Record<string, string> = {
    "Gibberish": "#f43f5e",
    "Fragments": "#fb923c",
    "Basic grammar": "#fbbf24",
    "Simple sentences": "#a3e635",
    "Decent prose": "#34d399",
    "Good prose": "#22d3ee",
    "Rich prose": "#a78bfa",
};

export function DepthVsQualityViz() {
    const [blocks, setBlocks] = useState(4);
    const sample = getSample(blocks);
    const qualityColor = QUALITY_COLORS[sample.quality] || "#22d3ee";
    const maxLoss = 5;

    return (
        <div className="py-5 px-4 sm:px-6">
            {/* Slider */}
            <div className="flex items-center justify-center gap-3 mb-5">
                <span className="text-[12px] text-white/20 font-semibold">Blocks:</span>
                <input
                    type="range"
                    min={1}
                    max={12}
                    value={blocks}
                    onChange={(e) => setBlocks(Number(e.target.value))}
                    className="w-40 accent-cyan-400"
                />
                <motion.span
                    className="text-[18px] font-bold font-mono"
                    style={{ color: qualityColor }}
                    key={blocks}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                >
                    {blocks}
                </motion.span>
            </div>

            {/* Tower visual */}
            <div className="flex items-end justify-center gap-1 mb-5" style={{ height: 120 }}>
                {Array.from({ length: blocks }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="rounded-md"
                        style={{
                            width: 20,
                            background: `linear-gradient(180deg, ${qualityColor}60, ${qualityColor}20)`,
                            border: `1px solid ${qualityColor}30`,
                        }}
                        initial={{ height: 0 }}
                        animate={{ height: 8 + (i + 1) * (100 / blocks) * 0.8 }}
                        transition={{ delay: i * 0.04, type: "spring", stiffness: 150, damping: 12 }}
                    />
                ))}
            </div>

            {/* Quality + Loss */}
            <div className="flex items-center justify-center gap-6 mb-4">
                <div className="text-center">
                    <p className="text-[11px] text-white/20 mb-1">Quality</p>
                    <motion.p
                        className="text-[14px] font-bold"
                        style={{ color: qualityColor }}
                        key={sample.quality}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {sample.quality}
                    </motion.p>
                </div>
                <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="text-center">
                    <p className="text-[11px] text-white/20 mb-1">Loss</p>
                    <div className="flex items-center gap-2">
                        <div className="w-20 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                            <motion.div
                                className="h-full rounded-full"
                                style={{ background: qualityColor }}
                                animate={{ width: `${((maxLoss - sample.loss) / maxLoss) * 100}%` }}
                                transition={{ type: "spring", stiffness: 100, damping: 14 }}
                            />
                        </div>
                        <span className="text-[13px] font-mono font-bold" style={{ color: qualityColor }}>
                            {sample.loss.toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Generated text */}
            <motion.div
                className="rounded-xl px-5 py-4"
                style={{ background: `${qualityColor}06`, border: `1px solid ${qualityColor}12` }}
                key={sample.text}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <p className="text-[11px] font-semibold mb-2" style={{ color: `${qualityColor}60` }}>
                    Generated text ({blocks} blocks):
                </p>
                <p className="text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                    &ldquo;{sample.text}&rdquo;
                </p>
            </motion.div>

            {/* Real-world reference */}
            <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-white/15">
                <span>GPT-2: <strong className="text-white/30">12</strong> blocks</span>
                <span>·</span>
                <span>GPT-3: <strong className="text-white/30">96</strong> blocks</span>
                <span>·</span>
                <span>GPT-4: <strong className="text-white/30">~120</strong> blocks</span>
            </div>
        </div>
    );
}
