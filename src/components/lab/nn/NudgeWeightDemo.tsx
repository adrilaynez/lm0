"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { Slider } from "@/components/ui/slider";
import { NN_COLORS } from "./visualizer-theme";

/*
  Challenge question before reveal: "Predict how much output changes if w₁ goes up by 1."
  Progressive naming: first call it "sensitivity", then reveal "derivative".
  Formal ∂/∂w notation only in the Expandable at the bottom.
  Inputs: x₁=1, x₂=2. Target=3. Starting weights w₁=4, w₂=3.
*/

const X1 = 1;
const X2 = 2;
const TARGET = 3;

export function NudgeWeightDemo() {
    const { t } = useI18n();
    const shouldReduceMotion = useReducedMotion();
    const [w1, setW1] = useState(4.0);
    const [w2, setW2] = useState(3.0);
    const [guessW1, setGuessW1] = useState<number | null>(null);
    const [guessW2, setGuessW2] = useState<number | null>(null);
    const [showFormal, setShowFormal] = useState(false);

    const output = w1 * X1 + w2 * X2;
    const error = output - TARGET;
    const absError = Math.abs(error);
    const isPerfect = absError < 0.05;
    const isClose = absError < 0.5;

    const sensW1 = X1; // 1
    const sensW2 = X2; // 2

    const spring = shouldReduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 26 };

    function GuessButton({ value, correct, onSelect, selected }: {
        value: number; correct: number; onSelect: () => void; selected: boolean;
    }) {
        const isRight = value === correct;
        const revealed = selected;
        return (
            <button
                onClick={onSelect}
                className="rounded-lg px-3 py-1.5 text-xs font-mono font-bold border transition-all"
                style={{
                    background: revealed
                        ? isRight ? NN_COLORS.output.hex + "20" : NN_COLORS.error.hex + "15"
                        : "rgba(255,255,255,0.03)",
                    borderColor: revealed
                        ? isRight ? NN_COLORS.output.hex + "60" : NN_COLORS.error.hex + "40"
                        : "rgba(255,255,255,0.08)",
                    color: revealed
                        ? isRight ? NN_COLORS.output.hex : NN_COLORS.error.hex
                        : "rgba(255,255,255,0.5)",
                }}
            >
                {value}
            </button>
        );
    }

    return (
        <div className="p-5 sm:p-6 space-y-4">
            <p className="text-xs font-mono uppercase tracking-widest text-white/30">
                {t("neuralNetworkNarrative.howItLearns.nudge.title")}
            </p>

            {/* Compact formula */}
            <div className="rounded-xl bg-black/20 border border-white/[0.06] px-4 py-3">
                <div className="flex items-center justify-center gap-2 flex-wrap font-mono text-sm">
                    <span className="font-bold" style={{ color: NN_COLORS.weight.hex }}>{w1.toFixed(1)}</span>
                    <span className="text-white/30">×</span>
                    <span style={{ color: NN_COLORS.input.hex }}>{X1}</span>
                    <span className="text-white/30">+</span>
                    <span className="font-bold" style={{ color: NN_COLORS.weight.hex }}>{w2.toFixed(1)}</span>
                    <span className="text-white/30">×</span>
                    <span style={{ color: NN_COLORS.target.hex }}>{X2}</span>
                    <span className="text-white/30">=</span>
                    <span className="text-xl font-bold" style={{ color: isPerfect ? NN_COLORS.output.hex : "rgba(255,255,255,0.85)" }}>
                        {output.toFixed(1)}
                    </span>
                    <span className="text-white/20 mx-1">|</span>
                    <span className="text-xs" style={{ color: NN_COLORS.output.hex + "80" }}>target = {TARGET}</span>
                </div>
            </div>

            {/* Challenge: predict sensitivity before reveal */}
            <div className="space-y-3">
                {/* w₁ challenge */}
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold" style={{ color: NN_COLORS.weight.hex }}>
                            w₁ <span className="text-white/30 font-normal text-[10px]">(× x₁ = {X1})</span>
                        </span>
                        <span className="text-sm font-mono font-bold" style={{ color: NN_COLORS.weight.hex }}>{w1.toFixed(1)}</span>
                    </div>
                    <Slider min={-2} max={8} step={0.1} value={[w1]} onValueChange={([v]) => setW1(v)} trackColor={NN_COLORS.weight.hex} thumbColor={NN_COLORS.weight.hex} />

                    {/* Challenge question */}
                    <div className="mt-3 rounded-lg bg-indigo-500/[0.05] border border-indigo-500/15 px-3 py-2">
                        <p className="text-[10px] text-indigo-300/60 mb-2">
                            {t("neuralNetworkNarrative.howItLearns.nudge.challengeW1")}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                            {[1, 2, 3, 5].map((v) => (
                                <GuessButton
                                    key={v} value={v} correct={sensW1}
                                    onSelect={() => setGuessW1(v)}
                                    selected={guessW1 === v}
                                />
                            ))}
                        </div>
                        <AnimatePresence>
                            {guessW1 !== null && (
                                <motion.p
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-[10px] mt-2 font-semibold"
                                    style={{ color: guessW1 === sensW1 ? NN_COLORS.output.hex : NN_COLORS.error.hex }}
                                >
                                    {guessW1 === sensW1
                                        ? t("neuralNetworkNarrative.howItLearns.nudge.guessCorrect").replace("{n}", String(sensW1))
                                        : t("neuralNetworkNarrative.howItLearns.nudge.guessWrong").replace("{n}", String(sensW1))}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* w₂ challenge */}
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold" style={{ color: NN_COLORS.weight.hex }}>
                            w₂ <span className="text-white/30 font-normal text-[10px]">(× x₂ = {X2})</span>
                        </span>
                        <span className="text-sm font-mono font-bold" style={{ color: NN_COLORS.weight.hex }}>{w2.toFixed(1)}</span>
                    </div>
                    <Slider min={-2} max={8} step={0.1} value={[w2]} onValueChange={([v]) => setW2(v)} trackColor={NN_COLORS.weight.hex} thumbColor={NN_COLORS.weight.hex} />

                    <div className="mt-3 rounded-lg bg-indigo-500/[0.05] border border-indigo-500/15 px-3 py-2">
                        <p className="text-[10px] text-indigo-300/60 mb-2">
                            {t("neuralNetworkNarrative.howItLearns.nudge.challengeW2")}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                            {[1, 2, 3, 5].map((v) => (
                                <GuessButton
                                    key={v} value={v} correct={sensW2}
                                    onSelect={() => setGuessW2(v)}
                                    selected={guessW2 === v}
                                />
                            ))}
                        </div>
                        <AnimatePresence>
                            {guessW2 !== null && (
                                <motion.p
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-[10px] mt-2 font-semibold"
                                    style={{ color: guessW2 === sensW2 ? NN_COLORS.output.hex : NN_COLORS.error.hex }}
                                >
                                    {guessW2 === sensW2
                                        ? t("neuralNetworkNarrative.howItLearns.nudge.guessCorrect").replace("{n}", String(sensW2))
                                        : t("neuralNetworkNarrative.howItLearns.nudge.guessWrong").replace("{n}", String(sensW2))}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Progressive naming: sensitivity → derivative */}
            <div className="rounded-xl bg-violet-500/[0.04] border border-violet-500/15 px-4 py-3">
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="text-center">
                        <p className="text-[9px] font-mono text-sky-400/50 mb-0.5">{t("neuralNetworkNarrative.howItLearns.nudge.effectOfW1")}</p>
                        <p className="text-xl font-mono font-bold" style={{ color: NN_COLORS.input.hex }}>{sensW1}</p>
                        <p className="text-[9px] text-white/25">{t("neuralNetworkNarrative.howItLearns.nudge.perUnit")}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[9px] font-mono text-amber-400/50 mb-0.5">{t("neuralNetworkNarrative.howItLearns.nudge.effectOfW2")}</p>
                        <p className="text-xl font-mono font-bold" style={{ color: NN_COLORS.target.hex }}>{sensW2}</p>
                        <p className="text-[9px] text-white/25">{t("neuralNetworkNarrative.howItLearns.nudge.perUnit")}</p>
                    </div>
                </div>
                <p className="text-[11px] text-white/40 text-center">
                    {t("neuralNetworkNarrative.howItLearns.nudge.sensitivityNaming")}
                </p>
            </div>

            {/* Error readout */}
            <div className={`rounded-xl p-4 border text-center ${isPerfect
                ? "bg-emerald-500/[0.08] border-emerald-500/30"
                : isClose
                    ? "bg-amber-500/[0.06] border-amber-500/20"
                    : "bg-rose-500/[0.04] border-rose-500/20"
                }`}
            >
                <span className="text-[10px] font-mono block mb-1"
                    style={{ color: isPerfect ? NN_COLORS.output.hex : isClose ? NN_COLORS.target.hex : NN_COLORS.error.hex }}>
                    {t("neuralNetworkNarrative.howItLearns.predictionError.error")}
                </span>
                <span className="text-2xl font-mono font-bold block"
                    style={{ color: isPerfect ? NN_COLORS.output.hex : isClose ? NN_COLORS.target.hex : NN_COLORS.error.hex }}>
                    {error > 0 ? "+" : ""}{error.toFixed(1)}
                </span>
                {isPerfect
                    ? <p className="text-xs font-semibold mt-2" style={{ color: NN_COLORS.output.hex }}>{t("neuralNetworkNarrative.howItLearns.nudge.perfect")}</p>
                    : <p className="text-[11px] text-white/30 mt-2">{t("neuralNetworkNarrative.howItLearns.nudge.keepTrying")}</p>
                }
            </div>

            {/* Formal notation — Expandable */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
                <button
                    onClick={() => setShowFormal(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/[0.02] transition-colors"
                >
                    <span className="text-[10px] font-mono text-white/30">
                        {t("neuralNetworkNarrative.howItLearns.nudge.formalTitle")}
                    </span>
                    <motion.span
                        animate={{ rotate: showFormal ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-white/20 text-xs"
                    >▾</motion.span>
                </button>
                <AnimatePresence>
                    {showFormal && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="px-4 pb-4 pt-1 border-t border-white/[0.05] space-y-2">
                                <p className="text-[11px] text-white/40 leading-relaxed">
                                    {t("neuralNetworkNarrative.howItLearns.nudge.formalText")}
                                </p>
                                <div className="rounded-lg bg-black/30 px-3 py-2 font-mono text-sm text-center space-y-1">
                                    <p style={{ color: NN_COLORS.input.hex }}>∂output/∂w₁ = x₁ = {X1}</p>
                                    <p style={{ color: NN_COLORS.target.hex }}>∂output/∂w₂ = x₂ = {X2}</p>
                                </div>
                                <p className="text-[10px] text-white/30 italic">
                                    {t("neuralNetworkNarrative.howItLearns.nudge.formalNote")}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
