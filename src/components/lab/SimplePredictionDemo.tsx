"use client";

import { useState } from "react";

import { AnimatePresence,motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

import { useI18n } from "@/i18n/context";

const BIGRAMS: Record<string, { char: string; prob: number; color: string }[]> = {
    t: [{ char: "h", prob: 0.52, color: "emerald" }, { char: "e", prob: 0.19, color: "teal" }, { char: "i", prob: 0.10, color: "cyan" }],
    h: [{ char: "e", prob: 0.49, color: "emerald" }, { char: "i", prob: 0.21, color: "teal" }, { char: "a", prob: 0.14, color: "cyan" }],
    e: [{ char: " ", prob: 0.37, color: "emerald" }, { char: "r", prob: 0.20, color: "teal" }, { char: "n", prob: 0.13, color: "cyan" }],
    a: [{ char: "n", prob: 0.31, color: "emerald" }, { char: "r", prob: 0.18, color: "teal" }, { char: "t", prob: 0.15, color: "cyan" }],
    s: [{ char: " ", prob: 0.29, color: "emerald" }, { char: "t", prob: 0.22, color: "teal" }, { char: "e", prob: 0.18, color: "cyan" }],
    " ": [{ char: "t", prob: 0.18, color: "emerald" }, { char: "a", prob: 0.14, color: "teal" }, { char: "s", prob: 0.11, color: "cyan" }],
};

const CHARS = Object.keys(BIGRAMS);

const colorMap = {
    emerald: { bar: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" },
    teal: { bar: "bg-teal-500", text: "text-teal-400", border: "border-teal-500/30", bg: "bg-teal-500/10" },
    cyan: { bar: "bg-cyan-500", text: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500/10" },
};

export function SimplePredictionDemo() {
    const { t } = useI18n();
    const [selected, setSelected] = useState("t");
    const [step, setStep] = useState(0);
    const preds = BIGRAMS[selected];

    const handleSelect = (char: string) => {
        setSelected(char);
        setStep(0);
        setTimeout(() => setStep(1), 300);
        setTimeout(() => setStep(2), 800);
        setTimeout(() => setStep(3), 1400);
    };

    return (
        <div className="space-y-6">
            {/* Character picker */}
            <div>
                <p className="text-xs font-mono uppercase tracking-widest text-white/30 mb-3">
                    {t("bigramNarrative.predictionExample.step1")}
                </p>
                <div className="flex flex-wrap gap-2">
                    {CHARS.map((ch) => (
                        <button
                            key={ch}
                            onClick={() => handleSelect(ch)}
                            className={`w-11 h-11 rounded-lg font-mono text-lg font-bold border transition-all duration-200 ${
                                selected === ch
                                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 scale-110"
                                    : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:bg-white/[0.08] hover:text-white/80"
                            }`}
                        >
                            {ch === " " ? "·" : ch}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3-step flow */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-2">

                {/* Step 1: Input */}
                <motion.div
                    key={`input-${selected}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: step >= 0 ? 1 : 0, scale: step >= 0 ? 1 : 0.9 }}
                    className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-6 py-4 text-center min-w-[90px]"
                >
                    <p className="text-[9px] font-mono uppercase tracking-widest text-emerald-400/50 mb-1">
                        {t("bigramNarrative.predictionExample.inputLabel")}
                    </p>
                    <span className="text-3xl font-mono font-bold text-white">
                        {selected === " " ? "·" : selected}
                    </span>
                </motion.div>

                <ChevronRight className="w-4 h-4 text-white/20 shrink-0 hidden sm:block" />

                {/* Step 2: Model lookup */}
                <AnimatePresence>
                    {step >= 1 && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-4 text-center min-w-[140px]"
                        >
                            <p className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-1">
                                {t("bigramNarrative.predictionExample.lookupLabel")}
                            </p>
                            <p className="text-xs text-white/50 leading-snug">
                                {t("bigramNarrative.predictionExample.step2").replace("{char}", selected === " " ? "·" : selected)}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <ChevronRight className="w-4 h-4 text-white/20 shrink-0 hidden sm:block" />

                {/* Step 3: Predictions */}
                <AnimatePresence>
                    {step >= 2 && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.35 }}
                            className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 min-w-[180px]"
                        >
                            <p className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-3">
                                {t("bigramNarrative.predictionExample.step3")}
                            </p>
                            <div className="space-y-2.5">
                                {preds.map(({ char, prob, color }, i) => {
                                    const c = colorMap[color as keyof typeof colorMap];
                                    return (
                                        <motion.div
                                            key={char}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.12 }}
                                            className="flex items-center gap-3"
                                        >
                                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-sm font-bold border ${c.bg} ${c.border} ${c.text}`}>
                                                {char === " " ? "·" : char}
                                            </span>
                                            <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${prob * 100}%` }}
                                                    transition={{ delay: i * 0.12 + 0.1, duration: 0.5, ease: "easeOut" }}
                                                    className={`h-full rounded-full ${c.bar}`}
                                                />
                                            </div>
                                            <span className={`w-9 text-right font-mono text-xs font-semibold ${c.text}`}>
                                                {Math.round(prob * 100)}%
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {step === 0 && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-white/25 italic text-center"
                >
                    {t("bigramNarrative.predictionExample.hint")}
                </motion.p>
            )}
        </div>
    );
}
