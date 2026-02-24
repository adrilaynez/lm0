"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/i18n/context";

type Op = "add" | "multiply" | "weightedSum";

const OP_COLORS: Record<Op, { bg: string; border: string; text: string; glow: string }> = {
    add: { bg: "bg-sky-500/10", border: "border-sky-500/25", text: "text-sky-400", glow: "shadow-[0_0_24px_-6px_rgba(56,189,248,0.25)]" },
    multiply: { bg: "bg-violet-500/10", border: "border-violet-500/25", text: "text-violet-400", glow: "shadow-[0_0_24px_-6px_rgba(139,92,246,0.25)]" },
    weightedSum: { bg: "bg-rose-500/10", border: "border-rose-500/25", text: "text-rose-400", glow: "shadow-[0_0_24px_-6px_rgba(251,113,133,0.25)]" },
};

export function OperationExplorer() {
    const { t } = useI18n();
    const [op, setOp] = useState<Op>("add");

    const x1 = 8;
    const x2 = 3;

    const w1 = 1;
    const w2 = 1;

    const result =
        op === "add" ? x1 + x2
            : op === "multiply" ? x1 * x2
                : w1 * x1 + w2 * x2;

    const c = OP_COLORS[op];

    const ops: { key: Op; label: string; icon: string }[] = [
        { key: "add", label: t("neuralNetworkNarrative.discovery.operations.addBtn"), icon: "+" },
        { key: "multiply", label: t("neuralNetworkNarrative.discovery.operations.multiplyBtn"), icon: "×" },
        { key: "weightedSum", label: t("neuralNetworkNarrative.discovery.operations.weightedSumBtn"), icon: "Σ" },
    ];

    return (
        <div className="rounded-2xl border border-amber-500/[0.12] bg-gradient-to-br from-amber-500/[0.03] via-transparent to-rose-500/[0.02] shadow-[inset_0_1px_0_0_rgba(251,191,36,0.06)] p-6">
            <p className="text-xs font-mono uppercase tracking-widest text-amber-400/50 mb-5">
                {t("neuralNetworkNarrative.discovery.operations.title")}
            </p>

            {/* Operation buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
                {ops.map(({ key, label, icon }) => {
                    const oc = OP_COLORS[key];
                    return (
                        <button
                            key={key}
                            onClick={() => setOp(key)}
                            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border flex items-center gap-2 ${op === key
                                ? `${oc.bg} ${oc.border} ${oc.text}`
                                : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/60 hover:border-white/[0.12]"
                                }`}
                        >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${op === key ? `${oc.bg} ${oc.text}` : "bg-white/[0.05] text-white/30"}`}>
                                {icon}
                            </span>
                            {label}
                        </button>
                    );
                })}
            </div>

            {/* Fixed inputs (example) */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-sky-400/80">x₁</span>
                        <span className="text-sm font-mono font-bold text-sky-400">{x1}</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-white/[0.06] overflow-hidden border border-white/[0.08]">
                        <div className="absolute inset-y-0 left-0 bg-sky-400/60" style={{ width: "80%" }} />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-amber-400/80">x₂</span>
                        <span className="text-sm font-mono font-bold text-amber-400">{x2}</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-white/[0.06] overflow-hidden border border-white/[0.08]">
                        <div className="absolute inset-y-0 left-0 bg-amber-400/60" style={{ width: "30%" }} />
                    </div>
                </div>
            </div>

            {/* Visual flow: inputs → operation → result */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${op}-${x1}-${x2}`}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center justify-center gap-3 flex-wrap"
                >
                    {/* Input nodes */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-14 h-14 rounded-xl bg-sky-500/10 border border-sky-500/25 flex flex-col items-center justify-center">
                            <span className="text-[9px] text-sky-400/60 font-mono">x₁</span>
                            <span className="text-base font-mono font-bold text-sky-400">{x1}</span>
                        </div>
                        <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col items-center justify-center">
                            <span className="text-[9px] text-amber-400/60 font-mono">x₂</span>
                            <span className="text-base font-mono font-bold text-amber-400">{x2}</span>
                        </div>
                    </div>

                    {/* Connecting arrow */}
                    <div className="flex flex-col items-center gap-1">
                        <motion.div
                            animate={{ x: [0, 4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className={`text-lg ${c.text}`}
                        >
                            →
                        </motion.div>
                    </div>

                    {/* Operation node */}
                    <div className={`w-16 h-16 rounded-2xl ${c.bg} border ${c.border} ${c.glow} flex flex-col items-center justify-center transition-all`}>
                        <span className={`text-xl font-bold ${c.text}`}>
                            {op === "add" ? "+" : op === "multiply" ? "×" : "Σ"}
                        </span>
                        <span className={`text-[8px] ${c.text} opacity-60 font-mono`}>
                            {op === "add" ? "add" : op === "multiply" ? "mul" : "w·x"}
                        </span>
                    </div>

                    {/* Arrow to result */}
                    <div className="flex flex-col items-center gap-1">
                        <motion.div
                            animate={{ x: [0, 4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                            className={`text-lg ${c.text}`}
                        >
                            →
                        </motion.div>
                    </div>

                    {/* Result node */}
                    <motion.div
                        key={result}
                        initial={{ scale: 0.85 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className={`w-20 h-20 rounded-2xl ${c.bg} border-2 ${c.border} ${c.glow} flex flex-col items-center justify-center transition-all`}
                    >
                        <span className={`text-[9px] ${c.text} opacity-50 font-mono`}>{t("neuralNetworkNarrative.discovery.operations.resultPrefix")}</span>
                        <span className={`text-2xl font-mono font-bold ${c.text}`}>{result}</span>
                    </motion.div>
                </motion.div>
            </AnimatePresence>

            {/* Expression breakdown */}
            <div className={`mt-5 rounded-xl ${c.bg} border ${c.border} p-3 text-center`}>
                <span className={`text-sm font-mono ${c.text}`}>
                    {op === "add" && <>{x1} + {x2} = <strong>{result}</strong></>}
                    {op === "multiply" && <>{x1} × {x2} = <strong>{result}</strong></>}
                    {op === "weightedSum" && <>w₁·x₁ + w₂·x₂ = {w1}·{x1} + {w2}·{x2} = <strong>{result}</strong></>}
                </span>
            </div>

            {op === "weightedSum" && (
                <p className="mt-3 text-[11px] text-white/25 italic">
                    {t("neuralNetworkNarrative.discovery.operations.weightNote")}
                </p>
            )}
        </div>
    );
}
