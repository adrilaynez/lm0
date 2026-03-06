"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────
   DepthMotivationViz
   Shows famous language models and their depth
   to motivate "why go deeper?" before revealing
   that our naive attempt fails catastrophically.
   ───────────────────────────────────────────── */

interface FamousModel {
    name: string;
    year: number;
    layers: number;
    params: string;
    description: string;
    color: string;
}

const MODELS: FamousModel[] = [
    { name: "Our Monster", year: 2024, layers: 1, params: "9K", description: "One hidden layer, trained on Shakespeare", color: "#a78bfa" },
    { name: "GPT-1", year: 2018, layers: 12, params: "117M", description: "First GPT — proved depth works for language", color: "#60a5fa" },
    { name: "GPT-2", year: 2019, layers: 48, params: "1.5B", description: "Generated text so good they delayed release", color: "#34d399" },
    { name: "GPT-3", year: 2020, layers: 96, params: "175B", description: "Few-shot learning from sheer scale", color: "#fbbf24" },
    { name: "LLaMA 2", year: 2023, layers: 80, params: "70B", description: "Open-source, competitive with GPT-3.5", color: "#f472b6" },
    { name: "GPT-4", year: 2023, layers: 120, params: "~1.8T", description: "Multimodal reasoning, unprecedented capability", color: "#ef4444" },
];

const MAX_LAYERS = 130;

export function DepthMotivationViz() {
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const selected = selectedIdx !== null ? MODELS[selectedIdx] : null;

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* ── Layer count bars ── */}
            <div className="space-y-2">
                {MODELS.map((m, i) => {
                    const barPct = Math.max(2, (m.layers / MAX_LAYERS) * 100);
                    const isOurs = i === 0;
                    const isSelected = selectedIdx === i;

                    return (
                        <motion.div
                            key={m.name}
                            className="cursor-pointer group"
                            onClick={() => setSelectedIdx(isSelected ? null : i)}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-20 sm:w-24 text-right shrink-0">
                                    <span className={`text-[9px] font-mono font-bold ${isOurs ? "text-violet-400" : "text-white/30"}`}>
                                        {m.name}
                                    </span>
                                </div>
                                <div className="flex-1 h-6 rounded-md bg-white/[0.03] overflow-hidden relative">
                                    <motion.div
                                        className="h-full rounded-md"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${barPct}%` }}
                                        transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                                        style={{
                                            backgroundColor: m.color,
                                            opacity: isSelected ? 0.7 : isOurs ? 0.5 : 0.3,
                                        }}
                                    />
                                    {isOurs && (
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[7px] font-mono text-violet-300/70">
                                            ← us
                                        </span>
                                    )}
                                </div>
                                <div className="w-16 sm:w-20 shrink-0 text-right">
                                    <span className="text-[10px] font-mono font-bold" style={{ color: m.color }}>
                                        {m.layers} layers
                                    </span>
                                </div>
                                <div className="w-12 sm:w-16 shrink-0 text-right">
                                    <span className="text-[8px] font-mono text-white/20">
                                        {m.params}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* ── Selected model detail ── */}
            <AnimatePresence mode="wait">
                {selected && (
                    <motion.div
                        key={selected.name}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="rounded-xl border p-3 space-y-1"
                        style={{ borderColor: selected.color + "30", backgroundColor: selected.color + "08" }}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold" style={{ color: selected.color }}>{selected.name}</span>
                            <span className="text-[8px] font-mono text-white/20">{selected.year}</span>
                        </div>
                        <p className="text-[9px] font-mono text-white/30">{selected.description}</p>
                        <div className="flex gap-4 pt-1">
                            <div>
                                <span className="text-[7px] font-mono text-white/15 uppercase">Layers</span>
                                <div className="text-sm font-mono font-black" style={{ color: selected.color }}>{selected.layers}</div>
                            </div>
                            <div>
                                <span className="text-[7px] font-mono text-white/15 uppercase">Parameters</span>
                                <div className="text-sm font-mono font-black" style={{ color: selected.color }}>{selected.params}</div>
                            </div>
                            <div>
                                <span className="text-[7px] font-mono text-white/15 uppercase">vs Our Monster</span>
                                <div className="text-sm font-mono font-black text-white/40">{selected.layers}× deeper</div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── The question ── */}
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/[0.04] p-3 text-center">
                <p className="text-[10px] font-mono text-violet-300/60 leading-relaxed">
                    Every breakthrough in language AI came from going deeper. GPT-1 had 12 layers.
                    GPT-4 has 120+. Our monster has <span className="font-bold text-violet-400">just 1</span>.
                    <br />
                    <span className="font-bold text-violet-300/80">What if we stacked more layers?</span>
                </p>
            </div>
        </div>
    );
}
