"use client";

import { useState } from "react";

import { motion, AnimatePresence } from "framer-motion";

/*
  ModelOutputTeaser
  Shows side-by-side outputs from Bigram → NN → "???" (MLP)
  to tease the next chapter. Uses fake but realistic text samples.
*/

const MODELS = [
    {
        id: "bigram",
        label: "Bigram",
        desc: "1 letter of context, counting",
        sample: "theng an thi whe the sor an ofo",
        color: "#9ca3af",
        quality: 15,
    },
    {
        id: "nn",
        label: "Neural Network",
        desc: "1 letter of context, learning",
        sample: "then is the wand sor an of the",
        color: "#f97316",
        quality: 18,
    },
    {
        id: "mlp",
        label: "???",
        desc: "Multiple letters, learned representations",
        sample: "the king ordered his soldiers to march through the valley at dawn",
        color: "#8b5cf6",
        quality: 85,
    },
];

export function ModelOutputTeaser() {
    const [revealed, setRevealed] = useState(false);

    return (
        <div className="p-4 sm:p-5 space-y-3">
            {MODELS.map((model, i) => {
                const isMystery = model.id === "mlp" && !revealed;
                return (
                    <motion.div
                        key={model.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15 }}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3 sm:p-4"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <span
                                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
                                style={{
                                    color: isMystery ? "rgba(255,255,255,0.2)" : model.color,
                                    borderColor: isMystery ? "rgba(255,255,255,0.06)" : `${model.color}30`,
                                    backgroundColor: isMystery ? "rgba(255,255,255,0.02)" : `${model.color}10`,
                                }}
                            >
                                {model.label}
                            </span>
                            <span className="text-[9px] font-mono text-white/15">
                                {isMystery ? "???" : model.desc}
                            </span>
                        </div>

                        {/* Quality bar */}
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 h-1.5 rounded-full bg-white/[0.03] overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: isMystery ? "rgba(255,255,255,0.05)" : `${model.color}40` }}
                                    initial={{ width: 0 }}
                                    animate={{ width: isMystery ? "0%" : `${model.quality}%` }}
                                    transition={{ delay: i * 0.15 + 0.3, duration: 0.6 }}
                                />
                            </div>
                        </div>

                        {/* Sample text */}
                        <div className="rounded-lg bg-black/20 border border-white/[0.04] px-3 py-2">
                            {isMystery ? (
                                <button
                                    onClick={() => setRevealed(true)}
                                    className="w-full text-center py-2 group"
                                >
                                    <span className="text-[11px] font-mono text-violet-400/40 group-hover:text-violet-400/70 transition-colors">
                                        Click to see what&apos;s possible →
                                    </span>
                                </button>
                            ) : (
                                <AnimatePresence mode="wait">
                                    <motion.p
                                        key={model.id + (model.id === "mlp" ? "-revealed" : "")}
                                        initial={model.id === "mlp" ? { opacity: 0, filter: "blur(4px)" } : false}
                                        animate={{ opacity: 1, filter: "blur(0px)" }}
                                        className={`text-[11px] font-mono leading-relaxed ${
                                            model.id === "mlp" ? "text-violet-300/60" : "text-white/25"
                                        }`}
                                    >
                                        &quot;{model.sample}&quot;
                                    </motion.p>
                                </AnimatePresence>
                            )}
                        </div>
                    </motion.div>
                );
            })}

            {revealed && (
                <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[9px] font-mono text-violet-400/40 text-center pt-1"
                >
                    Same training data. Same characters. The difference is architecture.
                </motion.p>
            )}
        </div>
    );
}
