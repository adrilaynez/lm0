"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/i18n/context";

/*
  Simple return to the running example: output=10, target=3, error=7.
  Shows the problem with raw errors (can cancel out), then squares it.
  Connected to the story — not abstract.
*/

export function LossFormulaMotivation() {
    const { t } = useI18n();

    // Our running example
    const output = 10;
    const target = 3;
    const rawError = output - target; // +7
    const squaredError = rawError * rawError; // 49

    // Counter-example: what if the error were negative?
    const output2 = -4;
    const target2 = 3;
    const rawError2 = output2 - target2; // -7
    const squaredError2 = rawError2 * rawError2; // 49

    return (
        <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.02] to-transparent p-6">
            <p className="text-xs font-mono uppercase tracking-widest text-white/30 mb-5">
                {t("neuralNetworkNarrative.howItLearns.lossMotive.title")}
            </p>

            {/* Step 1: Our example */}
            <div className="rounded-xl bg-black/30 border border-white/[0.05] p-5 mb-5">
                <p className="text-xs text-white/40 mb-3">{t("neuralNetworkNarrative.howItLearns.lossMotive.ourExample")}</p>
                <div className="flex items-center justify-center gap-3 flex-wrap font-mono">
                    <span className="text-white/60">{output}</span>
                    <span className="text-white/30">−</span>
                    <span className="text-emerald-400">{target}</span>
                    <span className="text-white/30">=</span>
                    <span className="text-rose-400 text-xl font-bold">+{rawError}</span>
                </div>
            </div>

            {/* Step 2: The problem with raw errors */}
            <div className="rounded-xl bg-amber-500/[0.04] border border-amber-500/20 p-5 mb-5">
                <p className="text-xs text-amber-400/80 font-semibold mb-3">{t("neuralNetworkNarrative.howItLearns.lossMotive.problem")}</p>
                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="rounded-lg bg-black/20 p-3 text-center">
                        <span className="text-[9px] text-white/30 block font-mono mb-1">{t("neuralNetworkNarrative.howItLearns.lossMotive.example1")}</span>
                        <span className="text-xs font-mono text-white/40">10 − 3 = </span>
                        <span className="text-lg font-mono font-bold text-rose-400">+7</span>
                    </div>
                    <div className="rounded-lg bg-black/20 p-3 text-center">
                        <span className="text-[9px] text-white/30 block font-mono mb-1">{t("neuralNetworkNarrative.howItLearns.lossMotive.example2")}</span>
                        <span className="text-xs font-mono text-white/40">−4 − 3 = </span>
                        <span className="text-lg font-mono font-bold text-sky-400">−7</span>
                    </div>
                </div>
                <div className="text-center">
                    <span className="text-xs text-white/40">{t("neuralNetworkNarrative.howItLearns.lossMotive.sumRaw")}: </span>
                    <span className="text-sm font-mono text-white/40">+7 + (−7) = </span>
                    <span className="text-lg font-mono font-bold text-amber-400">0</span>
                </div>
                <p className="text-[11px] text-amber-400/60 text-center mt-2">
                    {t("neuralNetworkNarrative.howItLearns.lossMotive.cancelOut")}
                </p>
            </div>

            {/* Step 3: The solution — squaring */}
            <div className="rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 p-5 mb-4">
                <p className="text-xs text-emerald-400/80 font-semibold mb-3">{t("neuralNetworkNarrative.howItLearns.lossMotive.solution")}</p>
                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="rounded-lg bg-black/20 p-3 text-center">
                        <span className="text-xs font-mono text-white/40">(+7)² = </span>
                        <span className="text-lg font-mono font-bold text-rose-400">{squaredError}</span>
                    </div>
                    <div className="rounded-lg bg-black/20 p-3 text-center">
                        <span className="text-xs font-mono text-white/40">(−7)² = </span>
                        <span className="text-lg font-mono font-bold text-rose-400">{squaredError2}</span>
                    </div>
                </div>
                <p className="text-[11px] text-white/40 text-center">
                    {t("neuralNetworkNarrative.howItLearns.lossMotive.squaringFix")}
                </p>
            </div>

            {/* The loss for our example */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl bg-rose-500/[0.06] border border-rose-500/25 p-5 text-center"
            >
                <span className="text-[10px] text-rose-400/60 block font-mono uppercase tracking-widest mb-2">{t("neuralNetworkNarrative.howItLearns.lossMotive.lossLabel")}</span>
                <div className="flex items-center justify-center gap-2 font-mono">
                    <span className="text-sm text-white/40">({output} − {target})² =</span>
                    <span className="text-sm text-white/40">{rawError}² =</span>
                    <motion.span
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                        className="text-3xl font-bold text-rose-400"
                    >
                        {squaredError}
                    </motion.span>
                </div>
                <p className="text-xs text-white/30 mt-3">
                    {t("neuralNetworkNarrative.howItLearns.lossMotive.lossExplain")}
                </p>
            </motion.div>

            {/* N8: Loss alternatives comparison */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.01] mt-5">
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/25 px-4 pt-4 mb-3">
                    {t("neuralNetworkNarrative.howItLearns.lossMotive.alternativesTitle")}
                </p>
                <div className="px-4 pb-4 space-y-2">
                    {/* MSE */}
                    <div className="grid grid-cols-[80px_1fr_100px] items-center gap-3 rounded-lg bg-rose-500/[0.04] border border-rose-500/15 p-2.5">
                        <span className="text-[10px] font-mono font-bold text-rose-400">MSE</span>
                        <span className="text-[10px] text-white/40">{t("neuralNetworkNarrative.howItLearns.lossMotive.mseDesc")}</span>
                        <span className="text-xs font-mono text-white/50 text-right">(ŷ − y)² = {squaredError}</span>
                    </div>
                    {/* MAE */}
                    <div className="grid grid-cols-[80px_1fr_100px] items-center gap-3 rounded-lg bg-amber-500/[0.04] border border-amber-500/15 p-2.5">
                        <span className="text-[10px] font-mono font-bold text-amber-400">MAE</span>
                        <span className="text-[10px] text-white/40">{t("neuralNetworkNarrative.howItLearns.lossMotive.maeDesc")}</span>
                        <span className="text-xs font-mono text-white/50 text-right">|ŷ − y| = {Math.abs(rawError)}</span>
                    </div>
                    {/* Raw */}
                    <div className="grid grid-cols-[80px_1fr_100px] items-center gap-3 rounded-lg bg-white/[0.02] border border-white/[0.06] p-2.5">
                        <span className="text-[10px] font-mono font-bold text-white/40">Raw</span>
                        <span className="text-[10px] text-white/40">{t("neuralNetworkNarrative.howItLearns.lossMotive.rawDesc")}</span>
                        <span className="text-xs font-mono text-white/50 text-right">ŷ − y = +{rawError}</span>
                    </div>
                </div>
                <p className="text-[10px] text-white/25 px-4 pb-4 italic">
                    {t("neuralNetworkNarrative.howItLearns.lossMotive.alternativesNote")}
                </p>
            </div>
        </div>
    );
}
