"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { NN_COLORS } from "./visualizer-theme";

/*
  Complete training step visualizer with SVG neuron diagram.
  Commute values: distance=5, traffic=7, target=30, starting w₁=8, w₂=3, b=5 → predicted=66
  5 phases: forward → loss → gradient (backward animation) → update → verify
  "Train again" button for multiple iterations.
*/

const X1 = 5, X2 = 7, TARGET = 30;
const INIT_W1 = 8, INIT_W2 = 3, INIT_B = 5;
const LR = 0.002;

function trainStep(w1: number, w2: number, b: number) {
    const output = w1 * X1 + w2 * X2 + b;
    const error = output - TARGET;
    const loss = error * error;
    const dLdw1 = 2 * error * X1;
    const dLdw2 = 2 * error * X2;
    const dLdb = 2 * error;
    const w1New = +(w1 - LR * dLdw1).toFixed(4);
    const w2New = +(w2 - LR * dLdw2).toFixed(4);
    const bNew = +(b - LR * dLdb).toFixed(4);
    const outputNew = w1New * X1 + w2New * X2 + bNew;
    const lossNew = (outputNew - TARGET) ** 2;
    return { output: +output.toFixed(2), error: +error.toFixed(2), loss: +loss.toFixed(1), dLdw1: +dLdw1.toFixed(2), dLdw2: +dLdw2.toFixed(2), dLdb: +dLdb.toFixed(2), w1New, w2New, bNew, outputNew: +outputNew.toFixed(2), lossNew: +lossNew.toFixed(1) };
}

type Phase = "forward" | "loss" | "gradient" | "update" | "verify";
const PHASES: Phase[] = ["forward", "loss", "gradient", "update", "verify"];

const PHASE_HEX: Record<Phase, string> = {
    forward: NN_COLORS.output.hex,
    loss: NN_COLORS.target.hex,
    gradient: NN_COLORS.error.hex,
    update: NN_COLORS.hidden.hex,
    verify: NN_COLORS.output.hex,
};

/* ── SVG neuron diagram ── */
function NeuronDiagram({ phase, output, target }: { phase: Phase; output: number; target: number }) {
    const shouldReduceMotion = useReducedMotion();
    const dur = shouldReduceMotion ? 0 : 0.4;
    const isBackward = phase === "gradient";

    // Layout: inputs(left) → weights → sum node → output → target → error
    return (
        <svg viewBox="0 0 440 130" className="w-full max-w-md mx-auto" aria-hidden>
            {/* Input nodes */}
            <circle cx="30" cy="30" r="16" fill={phase === "forward" ? NN_COLORS.input.hex + "30" : NN_COLORS.input.hex + "15"} stroke={NN_COLORS.input.hex} strokeWidth="1.5" />
            <text x="30" y="34" textAnchor="middle" fill={NN_COLORS.input.hex} fontSize="9" fontFamily="monospace" fontWeight="bold">x₁={X1}</text>
            <circle cx="30" cy="90" r="16" fill={phase === "forward" ? NN_COLORS.input.hex + "30" : NN_COLORS.input.hex + "15"} stroke={NN_COLORS.input.hex} strokeWidth="1.5" />
            <text x="30" y="94" textAnchor="middle" fill={NN_COLORS.input.hex} fontSize="9" fontFamily="monospace" fontWeight="bold">x₂={X2}</text>

            {/* Weight arrows → sum */}
            <line x1="48" y1="30" x2="130" y2="60" stroke={phase === "forward" || phase === "update" ? NN_COLORS.weight.hex : NN_COLORS.weight.hex + "40"} strokeWidth="1.5" />
            <text x="80" y="38" fill={NN_COLORS.weight.hex} fontSize="8" fontFamily="monospace">w₁</text>
            <line x1="48" y1="90" x2="130" y2="60" stroke={phase === "forward" || phase === "update" ? NN_COLORS.weight.hex : NN_COLORS.weight.hex + "40"} strokeWidth="1.5" />
            <text x="80" y="88" fill={NN_COLORS.weight.hex} fontSize="8" fontFamily="monospace">w₂</text>

            {/* Sum node */}
            <circle cx="148" cy="60" r="18" fill={phase === "forward" ? NN_COLORS.output.hex + "20" : "rgba(255,255,255,0.04)"} stroke={phase === "forward" ? NN_COLORS.output.hex : "rgba(255,255,255,0.15)"} strokeWidth="1.5" />
            <text x="148" y="64" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10" fontFamily="monospace">Σ</text>

            {/* Sum → output */}
            <line x1="168" y1="60" x2="230" y2="60" stroke={phase === "forward" || phase === "verify" ? NN_COLORS.output.hex : "rgba(255,255,255,0.1)"} strokeWidth="1.5" />
            <circle cx="248" cy="60" r="18" fill={phase === "forward" || phase === "verify" ? NN_COLORS.output.hex + "20" : "rgba(255,255,255,0.04)"} stroke={phase === "forward" || phase === "verify" ? NN_COLORS.output.hex : "rgba(255,255,255,0.15)"} strokeWidth="1.5" />
            <text x="248" y="55" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="monospace">output</text>
            <text x="248" y="67" textAnchor="middle" fill={NN_COLORS.output.hex} fontSize="10" fontFamily="monospace" fontWeight="bold">{output}</text>

            {/* Output → target comparison */}
            <line x1="268" y1="60" x2="320" y2="60" stroke={phase === "loss" ? NN_COLORS.target.hex : "rgba(255,255,255,0.08)"} strokeWidth="1.5" />
            <circle cx="338" cy="60" r="18" fill={phase === "loss" ? NN_COLORS.target.hex + "20" : "rgba(255,255,255,0.04)"} stroke={phase === "loss" ? NN_COLORS.target.hex : "rgba(255,255,255,0.15)"} strokeWidth="1.5" />
            <text x="338" y="55" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="monospace">target</text>
            <text x="338" y="67" textAnchor="middle" fill={NN_COLORS.target.hex} fontSize="10" fontFamily="monospace" fontWeight="bold">{target}</text>

            {/* Error node */}
            <line x1="358" y1="60" x2="400" y2="60" stroke={phase === "loss" || phase === "gradient" ? NN_COLORS.error.hex : "rgba(255,255,255,0.08)"} strokeWidth="1.5" />
            <rect x="402" y="44" width="32" height="32" rx="6" fill={phase === "loss" || phase === "gradient" ? NN_COLORS.error.hex + "20" : "rgba(255,255,255,0.04)"} stroke={phase === "loss" || phase === "gradient" ? NN_COLORS.error.hex : "rgba(255,255,255,0.15)"} strokeWidth="1.5" />
            <text x="418" y="55" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="monospace">loss</text>
            <text x="418" y="68" textAnchor="middle" fill={NN_COLORS.error.hex} fontSize="8" fontFamily="monospace" fontWeight="bold">L</text>

            {/* Backward flow arrows (gradient phase) */}
            {isBackward && (
                <>
                    <motion.line
                        x1="400" y1="45" x2="170" y2="45"
                        stroke={NN_COLORS.error.hex}
                        strokeWidth="2"
                        strokeDasharray="6 4"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.6 }}
                        transition={{ duration: dur * 1.5 }}
                    />
                    <motion.polygon
                        points="170,42 176,45 170,48"
                        fill={NN_COLORS.error.hex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.7 }}
                        transition={{ delay: dur }}
                    />
                    <motion.text
                        x="285" y="40"
                        textAnchor="middle"
                        fill={NN_COLORS.error.hex}
                        fontSize="8"
                        fontFamily="monospace"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.8 }}
                        transition={{ delay: dur * 0.8 }}
                    >
                        ← gradients flow back
                    </motion.text>
                </>
            )}

            {/* Bias label */}
            <text x="148" y="100" textAnchor="middle" fill={NN_COLORS.bias.hex} fontSize="8" fontFamily="monospace">+b</text>
        </svg>
    );
}

export function NeuronGradientCalculator() {
    const { t } = useI18n();
    const shouldReduceMotion = useReducedMotion();
    const [step, setStep] = useState(0);
    const [iteration, setIteration] = useState(0);
    const [w1, setW1] = useState(INIT_W1);
    const [w2, setW2] = useState(INIT_W2);
    const [bias, setBias] = useState(INIT_B);
    const [lossHistory, setLossHistory] = useState<number[]>([]);

    const r = trainStep(w1, w2, bias);
    const phase = PHASES[step];

    const handleTrainAgain = useCallback(() => {
        setW1(r.w1New);
        setW2(r.w2New);
        setBias(r.bNew);
        setLossHistory(prev => [...prev, r.loss]);
        setIteration(i => i + 1);
        setStep(0);
    }, [r]);

    const handleReset = useCallback(() => {
        setW1(INIT_W1);
        setW2(INIT_W2);
        setBias(INIT_B);
        setIteration(0);
        setStep(0);
        setLossHistory([]);
    }, []);

    const phaseStyles: Record<Phase, { border: string; text: string }> = {
        forward: { border: "border-emerald-500/15 bg-emerald-500/[0.04]", text: "text-emerald-400" },
        loss: { border: "border-amber-500/15 bg-amber-500/[0.04]", text: "text-amber-400" },
        gradient: { border: "border-rose-500/15 bg-rose-500/[0.04]", text: "text-rose-400" },
        update: { border: "border-indigo-500/15 bg-indigo-500/[0.04]", text: "text-indigo-400" },
        verify: { border: "border-emerald-500/15 bg-emerald-500/[0.04]", text: "text-emerald-400" },
    };

    const spring = shouldReduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 26 };

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Iteration badge */}
            {iteration > 0 && (
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/25">
                        {t("neuralNetworkNarrative.howItLearns.neuronCalc.iteration").replace("{n}", String(iteration + 1))}
                    </span>
                    <button onClick={handleReset} className="text-[9px] font-mono text-white/25 hover:text-white/50 transition-colors">
                        {t("neuralNetworkNarrative.howItLearns.neuronCalc.resetAll")}
                    </button>
                </div>
            )}

            {/* SVG neuron diagram */}
            <NeuronDiagram phase={phase} output={r.output} target={TARGET} />

            {/* Step indicator */}
            <div className="flex items-center gap-1">
                {PHASES.map((p, i) => (
                    <button
                        key={i}
                        onClick={() => setStep(i)}
                        className="h-1.5 flex-1 rounded-full transition-all cursor-pointer hover:opacity-80"
                        style={{ background: i <= step ? PHASE_HEX[p] : "rgba(255,255,255,0.06)" }}
                    />
                ))}
            </div>

            <p className="text-[10px] text-white/30 font-mono">
                {t("neuralNetworkNarrative.howItLearns.neuronCalc.step").replace("{n}", String(step + 1)).replace("{total}", "5")}
            </p>

            {/* Step content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${iteration}-${step}`}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                    className={`rounded-xl p-4 border ${phaseStyles[phase].border}`}
                >
                    {/* Forward */}
                    {step === 0 && (
                        <div>
                            <p className={`text-sm font-semibold mb-2 ${phaseStyles[phase].text}`}>
                                {t("neuralNetworkNarrative.howItLearns.neuronCalc.s1Title")}
                            </p>
                            <p className="text-xs text-white/40 mb-3">{t("neuralNetworkNarrative.howItLearns.neuronCalc.s1Desc")}</p>
                            <div className="rounded-lg bg-black/20 p-3 text-center font-mono text-sm">
                                <span style={{ color: NN_COLORS.weight.hex }} className="font-bold">{w1.toFixed(2)}</span>
                                <span className="text-white/30">×</span>
                                <span style={{ color: NN_COLORS.input.hex }}>{X1}</span>
                                <span className="text-white/30"> + </span>
                                <span style={{ color: NN_COLORS.weight.hex }} className="font-bold">{w2.toFixed(2)}</span>
                                <span className="text-white/30">×</span>
                                <span style={{ color: NN_COLORS.input.hex }}>{X2}</span>
                                <span className="text-white/30"> + </span>
                                <span style={{ color: NN_COLORS.bias.hex }}>{bias.toFixed(2)}</span>
                                <span className="text-white/30"> = </span>
                                <motion.span animate={{ scale: [1.15, 1] }} transition={spring} className="text-lg font-bold" style={{ color: NN_COLORS.output.hex }}>
                                    {r.output}
                                </motion.span>
                                <span className="text-white/25 text-xs ml-1">min</span>
                            </div>
                            <p className="text-[10px] text-white/25 text-center mt-2">
                                target = <span style={{ color: NN_COLORS.target.hex }}>{TARGET} min</span>
                            </p>
                        </div>
                    )}

                    {/* Loss */}
                    {step === 1 && (
                        <div>
                            <p className={`text-sm font-semibold mb-2 ${phaseStyles[phase].text}`}>
                                {t("neuralNetworkNarrative.howItLearns.neuronCalc.s3Title")}
                            </p>
                            <p className="text-xs text-white/40 mb-3">{t("neuralNetworkNarrative.howItLearns.neuronCalc.s3Desc")}</p>
                            <div className="rounded-lg bg-black/20 p-3 space-y-2 text-center font-mono text-sm">
                                <div>
                                    <span className="text-white/40">error = </span>
                                    <span className="text-white/60">{r.output}</span>
                                    <span className="text-white/30"> − </span>
                                    <span style={{ color: NN_COLORS.target.hex }}>{TARGET}</span>
                                    <span className="text-white/30"> = </span>
                                    <span style={{ color: NN_COLORS.error.hex }} className="font-bold">{r.error}</span>
                                </div>
                                <div>
                                    <span className="text-white/40">loss = </span>
                                    <span className="text-white/60">{r.error}²</span>
                                    <span className="text-white/30"> = </span>
                                    <span className="text-lg font-bold" style={{ color: NN_COLORS.target.hex }}>{r.loss}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Gradients (backward) */}
                    {step === 2 && (
                        <div>
                            <p className={`text-sm font-semibold mb-2 ${phaseStyles[phase].text}`}>
                                {t("neuralNetworkNarrative.howItLearns.neuronCalc.s6Title")}
                            </p>
                            <p className="text-xs text-white/40 mb-3">{t("neuralNetworkNarrative.howItLearns.neuronCalc.s6Desc")}</p>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { label: "∂L/∂w₁", formula: `2×${r.error}×${X1}`, val: r.dLdw1 },
                                    { label: "∂L/∂w₂", formula: `2×${r.error}×${X2}`, val: r.dLdw2 },
                                    { label: "∂L/∂b", formula: `2×${r.error}`, val: r.dLdb },
                                ].map(({ label, formula, val }) => (
                                    <div key={label} className="rounded-lg bg-black/20 p-2.5 text-center">
                                        <span className="text-[8px] text-white/25 block font-mono">{label}</span>
                                        <span className="text-[9px] text-white/30 block font-mono">{formula}</span>
                                        <motion.span
                                            animate={{ scale: [1.12, 1] }}
                                            transition={spring}
                                            className="text-base font-mono font-bold block"
                                            style={{ color: NN_COLORS.error.hex }}
                                        >
                                            {val}
                                        </motion.span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-white/25 mt-2 text-center">
                                {t("neuralNetworkNarrative.howItLearns.neuronCalc.gradExplain")}
                            </p>
                        </div>
                    )}

                    {/* Update */}
                    {step === 3 && (
                        <div>
                            <p className={`text-sm font-semibold mb-2 ${phaseStyles[phase].text}`}>
                                {t("neuralNetworkNarrative.howItLearns.neuronCalc.s7Title")}
                            </p>
                            <p className="text-xs text-white/40 mb-3">{t("neuralNetworkNarrative.howItLearns.neuronCalc.s7Desc")}</p>
                            <div className="space-y-2">
                                {[
                                    { label: "w₁", old: w1, grad: r.dLdw1, nw: r.w1New },
                                    { label: "w₂", old: w2, grad: r.dLdw2, nw: r.w2New },
                                    { label: "b", old: bias, grad: r.dLdb, nw: r.bNew },
                                ].map(({ label, old, grad, nw }) => (
                                    <div key={label} className="rounded-lg bg-black/20 p-2.5 flex items-center justify-between font-mono text-xs">
                                        <span className="text-white/35">{label} = {old.toFixed(2)} − {LR}×{grad}</span>
                                        <span className="font-bold" style={{ color: NN_COLORS.hidden.hex }}>{nw.toFixed(4)}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-white/25 mt-2 text-center font-mono">
                                w_new = w − η × ∂L/∂w  (η = {LR})
                            </p>
                        </div>
                    )}

                    {/* Verify */}
                    {step === 4 && (
                        <div>
                            <p className={`text-sm font-semibold mb-2 ${phaseStyles[phase].text}`}>
                                {t("neuralNetworkNarrative.howItLearns.neuronCalc.s8Title")}
                            </p>
                            <div className="rounded-lg bg-black/20 p-3 text-center font-mono text-sm mb-3">
                                <span style={{ color: NN_COLORS.hidden.hex }} className="font-bold">{r.w1New.toFixed(2)}</span>
                                <span className="text-white/30">×{X1} + </span>
                                <span style={{ color: NN_COLORS.hidden.hex }} className="font-bold">{r.w2New.toFixed(2)}</span>
                                <span className="text-white/30">×{X2} + </span>
                                <span style={{ color: NN_COLORS.hidden.hex }} className="font-bold">{r.bNew.toFixed(2)}</span>
                                <span className="text-white/30"> = </span>
                                <span className="text-lg font-bold" style={{ color: NN_COLORS.output.hex }}>{r.outputNew}</span>
                                <span className="text-white/25 text-xs ml-1">min</span>
                            </div>
                            {/* Loss comparison */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex-1 rounded-lg bg-rose-500/[0.06] border border-rose-500/15 p-2.5 text-center">
                                    <span className="text-[8px] text-white/25 block font-mono">{t("neuralNetworkNarrative.howItLearns.neuronCalc.before")}</span>
                                    <span className="text-base font-mono font-bold" style={{ color: NN_COLORS.error.hex }}>{r.loss}</span>
                                </div>
                                <span className="text-white/20">→</span>
                                <div className="flex-1 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/15 p-2.5 text-center">
                                    <span className="text-[8px] text-white/25 block font-mono">{t("neuralNetworkNarrative.howItLearns.neuronCalc.after")}</span>
                                    <span className="text-base font-mono font-bold" style={{ color: NN_COLORS.output.hex }}>{r.lossNew}</span>
                                </div>
                            </div>
                            <p className="text-xs font-semibold text-center" style={{ color: NN_COLORS.output.hex }}>
                                {t("neuralNetworkNarrative.howItLearns.neuronCalc.s8Better")}
                            </p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Loss history chart (after first train-again) */}
            {lossHistory.length > 0 && (
                <div className="rounded-lg bg-black/20 border border-white/[0.05] px-3 py-2">
                    <p className="text-[8px] font-mono text-white/20 mb-1">{t("neuralNetworkNarrative.howItLearns.neuronCalc.lossOverTime")}</p>
                    <div className="flex items-end gap-1 h-8">
                        {[...lossHistory, r.loss].map((l, i) => {
                            const maxL = Math.max(...lossHistory, r.loss, 1);
                            const h = Math.max(2, (l / maxL) * 100);
                            return (
                                <motion.div
                                    key={i}
                                    className="flex-1 rounded-t-sm"
                                    style={{ background: i === lossHistory.length ? NN_COLORS.error.hex : NN_COLORS.error.hex + "60" }}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ delay: i * 0.05 }}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-2">
                <button
                    onClick={() => setStep(s => Math.max(0, s - 1))}
                    disabled={step <= 0}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                >
                    ← {t("neuralNetworkNarrative.howItLearns.neuronCalc.prev")}
                </button>

                {step < 4 ? (
                    <button
                        onClick={() => setStep(s => s + 1)}
                        className="px-4 py-1.5 rounded-full text-xs font-semibold border transition-all"
                        style={{ background: PHASE_HEX[phase] + "18", borderColor: PHASE_HEX[phase] + "40", color: PHASE_HEX[phase] }}
                    >
                        {t("neuralNetworkNarrative.howItLearns.neuronCalc.next")} →
                    </button>
                ) : (
                    <button
                        onClick={handleTrainAgain}
                        className="px-4 py-1.5 rounded-full text-xs font-semibold border transition-all"
                        style={{ background: NN_COLORS.hidden.hex + "18", borderColor: NN_COLORS.hidden.hex + "40", color: NN_COLORS.hidden.hex }}
                    >
                        {t("neuralNetworkNarrative.howItLearns.neuronCalc.trainAgain")}
                    </button>
                )}
            </div>
        </div>
    );
}
