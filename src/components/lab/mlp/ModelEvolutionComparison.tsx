"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  ModelEvolutionComparison
  4-panel comparison: Bigram → N-gram → Neural Net → MLP+Embeddings.
  Shows loss, parameter count, text quality progression,
  and a progress journey bar.
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
        strengths: ["Simple counting", "Instant to build"],
        weaknesses: ["No context at all", "Random-looking output"],
        innovation: "Count transitions between characters",
        recap: "We started by counting: given one letter, what comes next? Pure frequency tables — no learning.",
    },
    {
        id: "ngram",
        label: "N-gram (N=4)",
        context: 3,
        params: "~18M",
        loss: 2.35,
        sample: "the king of then we",
        color: "rgb(245,158,11)",
        strengths: ["Some context", "Real word fragments"],
        weaknesses: ["Table explodes with N", "Sparse data problem"],
        innovation: "Look at multiple characters at once",
        recap: "More context helped — but the table size exploded exponentially. We needed a smarter approach.",
    },
    {
        id: "nn",
        label: "Neural Net",
        context: 1,
        params: "~2K",
        loss: 2.50,
        sample: "thend and the whe an",
        color: "rgb(16,185,129)",
        strengths: ["Learns patterns", "Generalizes"],
        weaknesses: ["Still no context", "Limited capacity"],
        innovation: "Replace counting with learning",
        recap: "We replaced lookup tables with learned weights — the network could generalize to unseen patterns. But still just one character.",
    },
    {
        id: "mlp",
        label: "MLP + Embeddings",
        context: 8,
        params: "~50K",
        loss: 1.95,
        sample: "the throne of the ki",
        color: "rgb(139,92,246)",
        strengths: ["Context + embeddings", "Compact + powerful", "Best loss"],
        weaknesses: ["Fixed window", "No long-range memory"],
        innovation: "Learned representations + multiple layers",
        recap: "Embeddings gave characters meaning. Multiple layers detected hierarchical patterns. The MLP is where language modeling became truly neural.",
    },
];

export function ModelEvolutionComparison() {
    const [selected, setSelected] = useState(3);
    const model = MODELS[selected];

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* ── Journey progress bar ── */}
            <div className="relative">
                {/* Connecting line */}
                <div className="absolute top-4 left-[12.5%] right-[12.5%] h-px bg-white/[0.06]" />
                <motion.div
                    className="absolute top-4 left-[12.5%] h-px"
                    style={{ backgroundColor: model.color }}
                    animate={{ width: `${(selected / 3) * 75}%` }}
                    transition={{ duration: 0.4 }}
                />
                {/* Nodes */}
                <div className="relative flex justify-between">
                    {MODELS.map((m, i) => {
                        const isActive = i === selected;
                        const isPast = i <= selected;
                        return (
                            <button
                                key={m.id}
                                onClick={() => setSelected(i)}
                                className="flex flex-col items-center gap-1.5 w-[25%] group"
                            >
                                <motion.div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-mono font-bold border-2 transition-colors z-10"
                                    animate={{
                                        backgroundColor: isActive ? `${m.color}25` : isPast ? `${m.color}10` : "rgba(255,255,255,0.02)",
                                        borderColor: isActive ? m.color : isPast ? `${m.color}40` : "rgba(255,255,255,0.06)",
                                        color: isActive ? m.color : isPast ? `${m.color}90` : "rgba(255,255,255,0.15)",
                                        scale: isActive ? 1.15 : 1,
                                    }}
                                    transition={{ duration: 0.25 }}
                                >
                                    {i + 1}
                                </motion.div>
                                <span className={`text-[8px] font-mono text-center leading-tight ${isActive ? "font-bold" : "text-white/20"}`}
                                    style={isActive ? { color: m.color } : {}}>
                                    {m.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <motion.div key={selected} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-3">
                {/* Innovation banner */}
                <div className="rounded-lg border px-3 py-2 text-center" style={{ borderColor: `${model.color}20`, backgroundColor: `${model.color}08` }}>
                    <p className="text-[8px] font-mono uppercase tracking-wider" style={{ color: `${model.color}70` }}>Key innovation</p>
                    <p className="text-[11px] font-mono font-bold" style={{ color: model.color }}>{model.innovation}</p>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                    <Stat label="Context" value={`${model.context} char${model.context > 1 ? "s" : ""}`} color={model.color} />
                    <Stat label="Parameters" value={model.params} color={model.color} />
                    <Stat label="Loss" value={model.loss.toFixed(2)} color={model.color} />
                </div>

                {/* Loss bar comparison */}
                <div className="space-y-1">
                    {MODELS.map((m, i) => (
                        <div key={m.id} className="flex items-center gap-2">
                            <span className="text-[7px] font-mono w-16 text-right truncate" style={{ color: i === selected ? m.color : "rgba(255,255,255,0.12)" }}>{m.label}</span>
                            <div className="flex-1 h-3.5 rounded-full bg-white/[0.02] overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: i === selected ? `${m.color}60` : `${m.color}15` }}
                                    animate={{ width: `${((3.3 - m.loss) / 1.5) * 100}%` }}
                                    transition={{ duration: 0.4 }}
                                />
                            </div>
                            <span className="text-[8px] font-mono w-8" style={{ color: i === selected ? m.color : "rgba(255,255,255,0.1)" }}>
                                {m.loss.toFixed(2)}
                            </span>
                        </div>
                    ))}
                    <p className="text-[7px] font-mono text-white/10 text-right">← lower is better</p>
                </div>

                {/* Sample text */}
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-[7px] font-mono text-white/12 mb-1.5 uppercase tracking-wider">Sample output</p>
                    <p className="text-sm font-mono leading-relaxed" style={{ color: model.color }}>&quot;{model.sample}&quot;</p>
                </div>

                {/* Strengths / Weaknesses */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-emerald-500/[0.04] border border-emerald-500/10 p-2.5">
                        <p className="text-[7px] font-mono text-emerald-400/60 mb-1 uppercase tracking-wider">Strengths</p>
                        {model.strengths.map(s => <p key={s} className="text-[9px] text-white/30 leading-relaxed">• {s}</p>)}
                    </div>
                    <div className="rounded-lg bg-rose-500/[0.04] border border-rose-500/10 p-2.5">
                        <p className="text-[7px] font-mono text-rose-400/60 mb-1 uppercase tracking-wider">Weaknesses</p>
                        {model.weaknesses.map(w => <p key={w} className="text-[9px] text-white/30 leading-relaxed">• {w}</p>)}
                    </div>
                </div>

                {/* Journey recap */}
                <div className="rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2">
                    <p className="text-[10px] text-white/30 leading-relaxed italic">{model.recap}</p>
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
