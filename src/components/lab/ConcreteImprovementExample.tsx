"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { TrendingUp } from "lucide-react";
import { useI18n } from "@/i18n/context";

const STEPS = [
    {
        n: 1, context: "h", next: "e", pct: 32, label: "Bigram",
        topCandidates: [
            { ch: "e", pct: 32 }, { ch: "a", pct: 19 }, { ch: "i", pct: 12 },
            { ch: "o", pct: 9 }, { ch: "u", pct: 5 },
        ],
        hint: "After just \"h\", many vowels and consonants are plausible. The model spreads probability thinly.",
        color: "from-red-500/60 to-orange-500/50",
        badgeColor: "text-red-400/70 border-red-500/25 bg-red-500/10",
    },
    {
        n: 2, context: "th", next: "e", pct: 85, label: "Trigram",
        topCandidates: [
            { ch: "e", pct: 85 }, { ch: "a", pct: 6 }, { ch: "i", pct: 4 },
            { ch: "o", pct: 2 }, { ch: "r", pct: 1 },
        ],
        hint: "\"th\" is a powerful signal — in English, \"the\" is the most common word. Confidence jumps dramatically.",
        color: "from-amber-500/60 to-amber-400/60",
        badgeColor: "text-amber-400/70 border-amber-500/25 bg-amber-500/10",
    },
    {
        n: 3, context: "the", next: " ", pct: 91, label: "3-gram",
        topCandidates: [
            { ch: "␣", pct: 91 }, { ch: "r", pct: 3 }, { ch: "n", pct: 2 },
            { ch: "m", pct: 1 }, { ch: "s", pct: 1 },
        ],
        hint: "\"the\" almost always ends with a space. The model is now 91% sure — very little ambiguity remains.",
        color: "from-emerald-500/60 to-emerald-400/60",
        badgeColor: "text-emerald-400/70 border-emerald-500/25 bg-emerald-500/10",
    },
];

export function ConcreteImprovementExample() {
    const { t } = useI18n();
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-80px" });
    const [expanded, setExpanded] = useState<number | null>(null);

    return (
        <div ref={ref} className="p-4 sm:p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/15">
                    <TrendingUp className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">
                        {t("ngram.widgets.confidenceImprovement.title")}
                    </h4>
                    <p className="text-[10px] text-white/40">
                        {t("ngram.widgets.confidenceImprovement.subtitle")}
                    </p>
                </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
                {STEPS.map((step, i) => {
                    const isOpen = expanded === i;
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -16 }}
                            animate={isInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ delay: i * 0.3, duration: 0.4 }}
                        >
                            <button
                                onClick={() => setExpanded(isOpen ? null : i)}
                                className={`w-full text-left rounded-xl border p-4 transition-colors ${isOpen
                                    ? "border-amber-500/20 bg-amber-500/[0.04]"
                                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12]"
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${step.badgeColor}`}>
                                        N={step.n}
                                    </span>
                                    <span className="text-xs text-white/50 font-mono">
                                        {t("ngram.widgets.confidenceImprovement.after")} <span className="text-amber-300/80 font-bold">&ldquo;{step.context}&rdquo;</span>
                                        <span className="text-white/25 mx-1.5">→</span>
                                        <span className="text-white/70 font-bold">&ldquo;{step.next === " " ? "␣" : step.next}&rdquo;</span>
                                    </span>
                                    <span className="ml-auto font-mono font-black tabular-nums text-lg text-amber-300">
                                        {step.pct}%
                                    </span>
                                </div>

                                {/* Confidence bar */}
                                <div className="h-2.5 rounded-full bg-white/[0.05] overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={isInView ? { width: `${step.pct}%` } : {}}
                                        transition={{ delay: i * 0.3 + 0.2, duration: 0.7, ease: "easeOut" }}
                                        className={`h-full rounded-full bg-gradient-to-r ${step.color}`}
                                    />
                                </div>
                            </button>

                            {/* Expanded detail */}
                            {isOpen && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    transition={{ duration: 0.25 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-2 ml-4 mr-2 p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] space-y-3">
                                        {/* Mini bar chart of all candidates */}
                                        <div className="space-y-1.5">
                                            {step.topCandidates.map((c) => (
                                                <div key={c.ch} className="flex items-center gap-3">
                                                    <span className={`font-mono text-xs w-5 text-center ${c.ch === (step.next === " " ? "␣" : step.next) ? "text-amber-300 font-bold" : "text-white/40"}`}>
                                                        {c.ch}
                                                    </span>
                                                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${c.pct}%` }}
                                                            transition={{ duration: 0.4, ease: "easeOut" }}
                                                            className={`h-full rounded-full ${c.ch === (step.next === " " ? "␣" : step.next) ? `bg-gradient-to-r ${step.color}` : "bg-white/15"}`}
                                                        />
                                                    </div>
                                                    <span className="font-mono text-[10px] text-white/30 w-8 text-right tabular-nums">
                                                        {c.pct}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-white/30 leading-relaxed italic">
                                            {step.hint}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Summary insight */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 1.2 }}
                className="flex items-center justify-center gap-3 pt-2"
            >
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-500/15" />
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400/40 font-bold">
                    {t("ngram.widgets.confidenceImprovement.summary")}
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-500/15" />
            </motion.div>
        </div>
    );
}
