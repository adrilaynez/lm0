"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  HiddenSizeExplorer
  Compare train vs val loss for different hidden layer sizes.
  Shows overfitting gap growing with larger hidden sizes.
*/

const CONFIGS = [
    { hidden: 16, trainLoss: 2.35, valLoss: 2.38, gap: 0.03, label: "Underfitting" },
    { hidden: 64, trainLoss: 2.05, valLoss: 2.10, gap: 0.05, label: "Good fit" },
    { hidden: 128, trainLoss: 1.90, valLoss: 2.08, gap: 0.18, label: "Slight overfit" },
    { hidden: 256, trainLoss: 1.70, valLoss: 2.15, gap: 0.45, label: "Overfitting" },
];

export function HiddenSizeExplorer() {
    const [selected, setSelected] = useState(1);
    const config = CONFIGS[selected];

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Size selector */}
            <div className="flex gap-2">
                {CONFIGS.map((c, i) => (
                    <button
                        key={c.hidden}
                        onClick={() => setSelected(i)}
                        className={`flex-1 py-3 rounded-xl border text-center transition-all ${
                            i === selected
                                ? "bg-violet-500/10 border-violet-500/30"
                                : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                        }`}
                    >
                        <p className={`text-lg font-mono font-bold ${i === selected ? "text-violet-400" : "text-white/30"}`}>{c.hidden}</p>
                        <p className="text-[8px] font-mono text-white/20">neurons</p>
                    </button>
                ))}
            </div>

            {/* Train vs Val bars */}
            <motion.div
                key={selected}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
            >
                <div className="space-y-2">
                    <LossBar label="Train Loss" value={config.trainLoss} color="emerald" max={2.5} />
                    <LossBar label="Val Loss" value={config.valLoss} color="violet" max={2.5} />
                </div>

                {/* Gap indicator */}
                <div className={`rounded-lg border p-3 text-center ${
                    config.gap > 0.2 ? "border-rose-500/20 bg-rose-500/5" :
                    config.gap > 0.1 ? "border-amber-500/20 bg-amber-500/5" :
                    "border-emerald-500/20 bg-emerald-500/5"
                }`}>
                    <div className="flex items-center justify-center gap-4">
                        <div>
                            <p className="text-[8px] font-mono text-white/20">GENERALIZATION GAP</p>
                            <p className={`text-xl font-mono font-bold ${
                                config.gap > 0.2 ? "text-rose-400" : config.gap > 0.1 ? "text-amber-400" : "text-emerald-400"
                            }`}>{config.gap.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-mono text-white/20">DIAGNOSIS</p>
                            <p className={`text-sm font-mono font-bold ${
                                config.gap > 0.2 ? "text-rose-400" : config.gap > 0.1 ? "text-amber-400" : "text-emerald-400"
                            }`}>{config.label}</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <p className="text-[10px] text-white/20 text-center">
                H=64 gives the best trade-off: low loss without significant overfitting. H=256 memorizes training data but generalizes poorly.
            </p>
        </div>
    );
}

function LossBar({ label, value, color, max }: { label: string; value: number; color: "emerald" | "violet"; max: number }) {
    const pct = (value / max) * 100;
    return (
        <div className="flex items-center gap-3">
            <span className="text-[9px] font-mono text-white/30 w-16">{label}</span>
            <div className="flex-1 h-4 rounded-full bg-white/[0.04] overflow-hidden">
                <motion.div
                    className={`h-full rounded-full ${color === "emerald" ? "bg-emerald-500/40" : "bg-violet-500/40"}`}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4 }}
                />
            </div>
            <span className={`text-sm font-mono font-bold w-12 text-right ${color === "emerald" ? "text-emerald-400" : "text-violet-400"}`}>
                {value.toFixed(2)}
            </span>
        </div>
    );
}
