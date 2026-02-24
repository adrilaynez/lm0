"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/context";

/*
  Simple conceptual demo: three interactive scenarios showing
  "output too high → derivative positive → decrease weight"
  "output too low → derivative negative → increase weight"
  Connected to the running example: w₁×1 + w₂×2, target = 3.
*/

interface Scenario {
    w1: number;
    w2: number;
    output: number;
    status: "too_high" | "too_low" | "correct";
    derivativeSign: "positive" | "negative" | "zero";
    action: string;
}

export function GradientDirectionDemo() {
    const { t } = useI18n();
    const [selected, setSelected] = useState(0);

    const x1 = 1, x2 = 2, target = 3;

    const scenarios: Scenario[] = [
        {
            w1: 4, w2: 3,
            output: 4 * 1 + 3 * 2,
            status: "too_high",
            derivativeSign: "positive",
            action: "decrease",
        },
        {
            w1: -1, w2: 0,
            output: -1 * 1 + 0 * 2,
            status: "too_low",
            derivativeSign: "negative",
            action: "increase",
        },
        {
            w1: 1, w2: 1,
            output: 1 * 1 + 1 * 2,
            status: "correct",
            derivativeSign: "zero",
            action: "nothing",
        },
    ];

    const s = scenarios[selected];
    const error = s.output - target;

    return (
        <div className="rounded-2xl border border-violet-500/[0.12] bg-gradient-to-br from-violet-500/[0.04] to-transparent p-6">
            <p className="text-xs font-mono uppercase tracking-widest text-violet-400/50 mb-5">
                {t("neuralNetworkNarrative.howItLearns.gradientDir.title")}
            </p>

            {/* Scenario buttons */}
            <div className="flex gap-2 mb-5 flex-wrap">
                {scenarios.map((sc, i) => (
                    <button
                        key={i}
                        onClick={() => setSelected(i)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${selected === i
                            ? sc.status === "too_high"
                                ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                                : sc.status === "too_low"
                                    ? "bg-sky-500/15 border-sky-500/30 text-sky-400"
                                    : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                            : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/60"
                            }`}
                    >
                        {sc.status === "too_high" ? t("neuralNetworkNarrative.howItLearns.gradientDir.tooHigh")
                            : sc.status === "too_low" ? t("neuralNetworkNarrative.howItLearns.gradientDir.tooLow")
                                : t("neuralNetworkNarrative.howItLearns.gradientDir.justRight")}
                    </button>
                ))}
            </div>

            {/* The computation */}
            <div className="rounded-xl bg-black/30 border border-white/[0.05] p-5 mb-5">
                <div className="flex items-center justify-center gap-2 flex-wrap font-mono text-sm">
                    <span className="text-rose-400 font-bold">{s.w1}</span>
                    <span className="text-white/30">×</span>
                    <span className="text-sky-400">{x1}</span>
                    <span className="text-white/30">+</span>
                    <span className="text-rose-400 font-bold">{s.w2}</span>
                    <span className="text-white/30">×</span>
                    <span className="text-amber-400">{x2}</span>
                    <span className="text-white/30">=</span>
                    <motion.span
                        key={selected}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className={`text-xl font-bold ${s.status === "correct" ? "text-emerald-400" : "text-white/80"
                            }`}
                    >
                        {s.output}
                    </motion.span>
                </div>
                <p className="text-center text-xs font-mono text-white/30 mt-2">
                    target = <span className="text-emerald-400">{target}</span>
                    {error !== 0 && <> · error = <span className={error > 0 ? "text-rose-400" : "text-sky-400"}>{error > 0 ? "+" : ""}{error}</span></>}
                </p>
            </div>

            {/* The logic chain */}
            <motion.div
                key={selected}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3 mb-5"
            >
                {s.status !== "correct" ? (
                    <>
                        {/* Step 1: Output is wrong */}
                        <div className={`rounded-lg p-4 border ${s.status === "too_high" ? "bg-rose-500/[0.04] border-rose-500/15" : "bg-sky-500/[0.04] border-sky-500/15"}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${s.status === "too_high" ? "bg-rose-500/20 text-rose-400" : "bg-sky-500/20 text-sky-400"}`}>1</div>
                                <div>
                                    <p className={`text-sm font-semibold ${s.status === "too_high" ? "text-rose-400" : "text-sky-400"}`}>
                                        {s.status === "too_high"
                                            ? t("neuralNetworkNarrative.howItLearns.gradientDir.outputTooHigh").replace("{output}", String(s.output)).replace("{target}", String(target))
                                            : t("neuralNetworkNarrative.howItLearns.gradientDir.outputTooLow").replace("{output}", String(s.output)).replace("{target}", String(target))
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Derivative tells us direction */}
                        <div className="rounded-lg p-4 border bg-violet-500/[0.04] border-violet-500/15">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400">2</div>
                                <div>
                                    <p className="text-sm font-semibold text-violet-400">
                                        {t("neuralNetworkNarrative.howItLearns.gradientDir.derivativeIs")} {s.derivativeSign === "positive" ? t("neuralNetworkNarrative.howItLearns.gradientDir.positive") : t("neuralNetworkNarrative.howItLearns.gradientDir.negative")}
                                    </p>
                                    <p className="text-xs text-white/40 mt-1">
                                        {s.derivativeSign === "positive"
                                            ? t("neuralNetworkNarrative.howItLearns.gradientDir.posExplain")
                                            : t("neuralNetworkNarrative.howItLearns.gradientDir.negExplain")
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Step 3: Action */}
                        <div className="rounded-lg p-4 border bg-emerald-500/[0.04] border-emerald-500/15">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">3</div>
                                <div>
                                    <p className="text-sm font-semibold text-emerald-400">
                                        {s.action === "decrease"
                                            ? t("neuralNetworkNarrative.howItLearns.gradientDir.soDecrease")
                                            : t("neuralNetworkNarrative.howItLearns.gradientDir.soIncrease")
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="rounded-lg p-5 border bg-emerald-500/[0.06] border-emerald-500/25 text-center">
                        <p className="text-sm font-semibold text-emerald-400 mb-1">
                            {t("neuralNetworkNarrative.howItLearns.gradientDir.perfect")}
                        </p>
                        <p className="text-xs text-white/40">
                            {t("neuralNetworkNarrative.howItLearns.gradientDir.perfectExplain")}
                        </p>
                    </div>
                )}
            </motion.div>

            {/* The rule */}
            <div className="rounded-xl bg-emerald-500/[0.04] border border-emerald-500/15 p-4 text-center">
                <p className="text-xs text-emerald-400/80 font-semibold">
                    {t("neuralNetworkNarrative.howItLearns.gradientDir.rule")}
                </p>
            </div>
        </div>
    );
}
