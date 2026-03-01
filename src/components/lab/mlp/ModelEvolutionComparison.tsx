"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  ModelEvolutionComparison
  4-panel comparison: Bigram → N-gram → Neural Net → MLP+Embeddings.
  Shows loss, parameter count, and text quality progression.
*/

const MODELS = [
    {
        id: "bigram",
        label: "Bigram",
        context: 1,
        params: "~700",
        loss: 2.85,
        sample: "theng an thi whe the",
        color: "rgb(156,163,175)",
        strengths: ["Simple", "Fast"],
        weaknesses: ["No context", "Random-looking output"],
    },
    {
        id: "ngram",
        label: "N-gram (N=4)",
        context: 3,
        params: "~18M",
        loss: 2.35,
        sample: "the king of then we",
        color: "rgb(245,158,11)",
        strengths: ["Some context", "Real patterns"],
        weaknesses: ["Table explodes", "Sparse data"],
    },
    {
        id: "nn",
        label: "Neural Net",
        context: 1,
        params: "~2K",
        loss: 2.50,
        sample: "thend and the whe an",
        color: "rgb(16,185,129)",
        strengths: ["Learns features", "Generalizes"],
        weaknesses: ["No context", "Limited capacity"],
    },
    {
        id: "mlp",
        label: "MLP + Embeddings",
        context: 8,
        params: "~50K",
        loss: 1.95,
        sample: "the throne of the ki",
        color: "rgb(139,92,246)",
        strengths: ["Context + embeddings", "Compact", "Best loss"],
        weaknesses: ["Fixed window", "No memory"],
    },
];

export function ModelEvolutionComparison() {
    const [selected, setSelected] = useState(3);
    const model = MODELS[selected];

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Model selector */}
            <div className="grid grid-cols-4 gap-2">
                {MODELS.map((m, i) => (
                    <button
                        key={m.id}
                        onClick={() => setSelected(i)}
                        className={`py-2.5 rounded-lg text-center transition-all border ${
                            i === selected
                                ? "bg-white/[0.04] border-white/[0.12]"
                                : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                        }`}
                        style={i === selected ? { borderColor: `${m.color}40`, color: m.color } : {}}
                    >
                        <p className={`text-[10px] font-mono font-bold ${i !== selected ? "text-white/25" : ""}`}>{m.label}</p>
                    </button>
                ))}
            </div>

            <motion.div key={selected} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                    <Stat label="Context" value={`${model.context} char${model.context > 1 ? "s" : ""}`} color={model.color} />
                    <Stat label="Parameters" value={model.params} color={model.color} />
                    <Stat label="Loss" value={model.loss.toFixed(2)} color={model.color} />
                </div>

                {/* Loss bar comparison */}
                <div className="space-y-1.5">
                    {MODELS.map((m, i) => (
                        <div key={m.id} className="flex items-center gap-2">
                            <span className="text-[8px] font-mono text-white/15 w-20 text-right truncate">{m.label}</span>
                            <div className="flex-1 h-3 rounded-full bg-white/[0.03] overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: `${m.color}50` }}
                                    animate={{ width: `${((3.3 - m.loss) / 1.5) * 100}%` }}
                                    transition={{ duration: 0.4 }}
                                />
                            </div>
                            <span className="text-[8px] font-mono w-8" style={{ color: i === selected ? m.color : "rgba(255,255,255,0.15)" }}>
                                {m.loss.toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Sample text */}
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-[8px] font-mono text-white/15 mb-1">SAMPLE OUTPUT</p>
                    <p className="text-sm font-mono" style={{ color: model.color }}>&quot;{model.sample}&quot;</p>
                </div>

                {/* Strengths / Weaknesses */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-2">
                        <p className="text-[8px] font-mono text-emerald-400 mb-1">STRENGTHS</p>
                        {model.strengths.map(s => <p key={s} className="text-[9px] text-white/30">• {s}</p>)}
                    </div>
                    <div className="rounded-lg bg-rose-500/5 border border-rose-500/10 p-2">
                        <p className="text-[8px] font-mono text-rose-400 mb-1">WEAKNESSES</p>
                        {model.weaknesses.map(w => <p key={w} className="text-[9px] text-white/30">• {w}</p>)}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-center">
            <p className="text-[7px] font-mono text-white/15 uppercase">{label}</p>
            <p className="text-sm font-mono font-bold" style={{ color }}>{value}</p>
        </div>
    );
}
