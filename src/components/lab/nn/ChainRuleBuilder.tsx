"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { Slider } from "@/components/ui/slider";
import { NN_COLORS } from "./visualizer-theme";

/*
  Pipeline: x → [×w] → a → [+b] → result
  Step-by-step mode: user clicks Next to advance through the propagation.
  Animated pulse lights up each node sequentially (300ms delay).
  Math shown AFTER animation completes.
*/

const W = 3;
const B = 1;
const PULSE_DELAY_MS = 300;

type StepId = 0 | 1 | 2 | 3 | 4; // 0=idle, 1=x, 2=×w, 3=a, 4=+b→result

export function ChainRuleBuilder() {
    const { t } = useI18n();
    const shouldReduceMotion = useReducedMotion();
    const [x, setX] = useState(2);
    const [activeStep, setActiveStep] = useState<StepId>(0);
    const [animating, setAnimating] = useState(false);
    const [showMath, setShowMath] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const a = x * W;
    const result = a + B;
    const xNext = x + 1;
    const aNext = xNext * W;
    const resultNext = aNext + B;
    const dAdX = W;
    const dResultDa = 1;
    const dResultDx = dAdX * dResultDa;

    const TOTAL_STEPS: StepId = 4;

    function runPulse(from: StepId) {
        if (shouldReduceMotion) {
            setActiveStep(TOTAL_STEPS);
            setShowMath(true);
            return;
        }
        setAnimating(true);
        setShowMath(false);
        let step = from;
        const advance = () => {
            step = (step + 1) as StepId;
            setActiveStep(step);
            if (step < TOTAL_STEPS) {
                timerRef.current = setTimeout(advance, PULSE_DELAY_MS);
            } else {
                setAnimating(false);
                timerRef.current = setTimeout(() => setShowMath(true), 200);
            }
        };
        timerRef.current = setTimeout(advance, PULSE_DELAY_MS);
    }

    function handleNext() {
        if (animating) return;
        if (activeStep === 0) {
            runPulse(0);
        } else if (activeStep === TOTAL_STEPS) {
            setActiveStep(0);
            setShowMath(false);
        }
    }

    function handleReset() {
        if (timerRef.current) clearTimeout(timerRef.current);
        setActiveStep(0);
        setAnimating(false);
        setShowMath(false);
    }

    useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

    // Keyboard shortcuts: ← → for step, Space for play/reset
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === "ArrowRight" || e.key === " ") {
                e.preventDefault();
                handleNext();
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                handleReset();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [activeStep, animating]); // eslint-disable-line react-hooks/exhaustive-deps

    // When x changes, reset animation
    useEffect(() => { handleReset(); }, [x]); // eslint-disable-line react-hooks/exhaustive-deps

    const isLit = (step: StepId) => activeStep >= step;

    function NodeBox({ step, label, value, color, borderColor }: {
        step: StepId; label: string; value: number | string; color: string; borderColor: string;
    }) {
        const lit = isLit(step);
        return (
            <motion.div
                animate={lit && !shouldReduceMotion ? { scale: [1.08, 1] } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="rounded-lg px-3 py-2 text-center min-w-[52px] border transition-colors duration-200"
                style={{
                    background: lit ? `${color}18` : "rgba(0,0,0,0.25)",
                    borderColor: lit ? borderColor : "rgba(255,255,255,0.07)",
                    boxShadow: lit ? `0 0 12px -3px ${color}60` : "none",
                }}
            >
                <span className="text-[9px] font-mono block mb-0.5" style={{ color: lit ? color : "rgba(255,255,255,0.25)" }}>{label}</span>
                <span className="text-xl font-mono font-bold" style={{ color: lit ? color : "rgba(255,255,255,0.3)" }}>{value}</span>
            </motion.div>
        );
    }

    function OpBox({ step, label, color }: { step: StepId; label: string; color: string }) {
        const lit = isLit(step);
        return (
            <motion.div
                className="rounded-lg px-2.5 py-2 text-center border transition-colors duration-200"
                style={{
                    background: lit ? `${color}12` : "rgba(0,0,0,0.15)",
                    borderColor: lit ? `${color}50` : "rgba(255,255,255,0.05)",
                }}
            >
                <span className="text-[9px] font-mono block" style={{ color: lit ? color : "rgba(255,255,255,0.2)" }}>op</span>
                <span className="text-sm font-mono font-bold" style={{ color: lit ? color : "rgba(255,255,255,0.2)" }}>{label}</span>
            </motion.div>
        );
    }

    function Arrow({ step }: { step: StepId }) {
        const lit = isLit(step);
        return (
            <motion.span
                className="text-sm font-bold transition-colors duration-200 shrink-0"
                style={{ color: lit ? NN_COLORS.hidden.hex : "rgba(255,255,255,0.1)" }}
            >→</motion.span>
        );
    }

    const stepDescriptions: Record<number, { text: string; delta: string; color: string }> = {
        1: { text: `x: ${x} → ${xNext}`, delta: "+1", color: NN_COLORS.input.hex },
        2: { text: `after ×${W}: ${a} → ${aNext}`, delta: `+${W}`, color: NN_COLORS.bias.hex },
        3: { text: `a = ${a} → ${aNext}`, delta: `+${W}`, color: NN_COLORS.target.hex },
        4: { text: `result = a + ${B}: ${result} → ${resultNext}`, delta: `+${W}`, color: NN_COLORS.output.hex },
    };

    return (
        <div className="p-5 sm:p-6 space-y-5">
            <p className="text-xs font-mono uppercase tracking-widest text-white/30">
                {t("neuralNetworkNarrative.howItLearns.chainRule.title")}
            </p>

            {/* x slider */}
            <div className="rounded-lg border border-sky-500/15 bg-sky-500/[0.03] px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold" style={{ color: NN_COLORS.input.hex }}>x (input)</span>
                    <span className="text-sm font-mono font-bold" style={{ color: NN_COLORS.input.hex }}>{x}</span>
                </div>
                <Slider min={0} max={8} step={1} value={[x]} onValueChange={([v]) => setX(v)} />
            </div>

            {/* Pipeline visualization */}
            <div className="rounded-xl bg-black/30 border border-white/[0.05] p-4">
                <div className="flex items-center justify-center gap-2 flex-wrap">
                    <NodeBox step={1} label="x" value={x} color={NN_COLORS.input.hex} borderColor={NN_COLORS.input.hex + "60"} />
                    <Arrow step={2} />
                    <OpBox step={2} label={`× ${W}`} color={NN_COLORS.bias.hex} />
                    <Arrow step={3} />
                    <NodeBox step={3} label="a" value={a} color={NN_COLORS.target.hex} borderColor={NN_COLORS.target.hex + "60"} />
                    <Arrow step={4} />
                    <OpBox step={4} label={`+ ${B}`} color={NN_COLORS.hidden.hex} />
                    <Arrow step={4} />
                    <NodeBox step={4} label="result" value={result} color={NN_COLORS.output.hex} borderColor={NN_COLORS.output.hex + "60"} />
                </div>
            </div>

            {/* Step-by-step propagation */}
            <div className="rounded-xl bg-violet-500/[0.04] border border-violet-500/20 p-4">
                <p className="text-xs text-violet-400/80 font-semibold mb-3">
                    {t("neuralNetworkNarrative.howItLearns.chainRule.ifXChanges")}
                </p>

                <div className="space-y-2 mb-4 min-h-[80px]">
                    {([1, 2, 3, 4] as StepId[]).map((s) => {
                        const desc = stepDescriptions[s];
                        return (
                            <AnimatePresence key={s}>
                                {activeStep >= s && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex items-center gap-3"
                                    >
                                        <div
                                            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                                            style={{ background: desc.color + "25", color: desc.color, border: `1px solid ${desc.color}50` }}
                                        >
                                            {s}
                                        </div>
                                        <span className="text-xs text-white/50 flex-1">{desc.text}</span>
                                        <span className="text-xs font-mono font-bold shrink-0" style={{ color: desc.color }}>{desc.delta}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        );
                    })}
                </div>

                {/* Next / Reset button */}
                <button
                    onClick={handleNext}
                    disabled={animating}
                    className="w-full rounded-lg py-2 text-xs font-semibold font-mono transition-colors disabled:opacity-40"
                    style={{
                        background: activeStep === TOTAL_STEPS ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
                        border: "1px solid rgba(99,102,241,0.25)",
                        color: "#a5b4fc",
                    }}
                >
                    {activeStep === 0
                        ? t("neuralNetworkNarrative.howItLearns.chainRule.startBtn")
                        : activeStep === TOTAL_STEPS
                            ? t("neuralNetworkNarrative.howItLearns.chainRule.resetBtn")
                            : t("neuralNetworkNarrative.howItLearns.chainRule.nextBtn")}
                </button>
            </div>

            {/* Math — shown AFTER animation completes */}
            <AnimatePresence>
                {showMath && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-xl bg-emerald-500/[0.04] border border-emerald-500/15 p-4 text-center"
                    >
                        <p className="text-xs text-white/40 mb-2">{t("neuralNetworkNarrative.howItLearns.chainRule.totalEffect")}</p>
                        <div className="flex items-center justify-center gap-2 flex-wrap font-mono text-sm mb-2">
                            <span className="text-violet-400">{dAdX}</span>
                            <span className="text-white/30">×</span>
                            <span className="text-violet-400">{dResultDa}</span>
                            <span className="text-white/30">=</span>
                            <span className="text-2xl font-bold" style={{ color: NN_COLORS.output.hex }}>{dResultDx}</span>
                        </div>
                        <p className="text-xs text-white/40">
                            {t("neuralNetworkNarrative.howItLearns.chainRule.explanation").replace("{w}", String(W))}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
