"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { Slider } from "@/components/ui/slider";

/*
  Interactive learning rate demo.
  Uses the running example: w₁×1 + w₂×2, target=3.
  Starts with w₁=4, w₂=3 (output=10, loss=49).
  User picks a learning rate and watches what happens:
  - Too small (0.001): barely moves
  - Good (0.02): smooth convergence
  - Too large (0.3): overshoots and diverges
  Three preset buttons + a custom slider.
*/

const X1 = 1, X2 = 2, TARGET = 3;
const INIT_W1 = 4, INIT_W2 = 3;
const MAX_STEPS = 40;

interface Snapshot {
    step: number;
    w1: number;
    w2: number;
    output: number;
    loss: number;
}

function simulate(lr: number): Snapshot[] {
    const history: Snapshot[] = [];
    let w1 = INIT_W1, w2 = INIT_W2;
    for (let i = 0; i <= MAX_STEPS; i++) {
        const output = w1 * X1 + w2 * X2;
        const error = output - TARGET;
        const loss = error * error;
        history.push({ step: i, w1, w2, output, loss });
        // Stop if diverging badly
        if (loss > 1e6) break;
        const dLdw1 = 2 * error * X1;
        const dLdw2 = 2 * error * X2;
        w1 = w1 - lr * dLdw1;
        w2 = w2 - lr * dLdw2;
    }
    return history;
}

type Preset = "tiny" | "good" | "big";

const PRESETS: Record<Preset, { lr: number; color: string; bg: string; border: string }> = {
    tiny: { lr: 0.001, color: "text-sky-400", bg: "bg-sky-500/15", border: "border-sky-500/30" },
    good: { lr: 0.02, color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30" },
    big: { lr: 0.3, color: "text-rose-400", bg: "bg-rose-500/15", border: "border-rose-500/30" },
};

export function LearningRateDemo() {
    const { t } = useI18n();
    const [preset, setPreset] = useState<Preset>("good");
    const [customLr, setCustomLr] = useState(0.02);
    const [useCustom, setUseCustom] = useState(false);
    const [animStep, setAnimStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const lr = useCustom ? customLr : PRESETS[preset].lr;
    const history = simulate(lr);
    const maxStep = history.length - 1;
    const current = history[Math.min(animStep, maxStep)];

    // Auto-play animation
    const startAnimation = useCallback(() => {
        setAnimStep(0);
        setIsPlaying(true);
    }, []);

    useEffect(() => {
        if (!isPlaying) return;
        intervalRef.current = setInterval(() => {
            setAnimStep(prev => {
                if (prev >= maxStep) {
                    setIsPlaying(false);
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    return maxStep;
                }
                return prev + 1;
            });
        }, 100);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isPlaying, maxStep]);

    // Reset animation when LR changes
    useEffect(() => {
        setAnimStep(0);
        setIsPlaying(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
    }, [lr]);

    // Determine behavior category
    const finalLoss = history[maxStep].loss;
    const diverged = finalLoss > 100;
    const converged = finalLoss < 1;
    const slow = !converged && !diverged && history.length === MAX_STEPS + 1;

    // Loss chart dimensions
    const chartW = 320;
    const chartH = 80;
    const displayHistory = history.slice(0, animStep + 1);
    const maxLoss = Math.max(...history.map(s => Math.min(s.loss, 200)), 1);

    const lossPoints = displayHistory.map((s, i) => {
        const x = (i / Math.max(maxStep, 1)) * chartW;
        const y = chartH - (Math.min(s.loss, maxLoss) / maxLoss) * (chartH - 4);
        return `${x},${y}`;
    }).join(" ");

    const accentColor = diverged ? "rose" : converged ? "emerald" : "amber";

    return (
        <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-950/20 via-black/40 to-indigo-950/10 p-6 shadow-[0_0_80px_-20px_rgba(139,92,246,0.15)]">
            <p className="text-xs font-mono uppercase tracking-widest text-violet-300/40 mb-6">
                {t("neuralNetworkNarrative.howItLearns.learningRate.title")}
            </p>

            {/* Preset buttons */}
            <div className="flex gap-2 mb-5 flex-wrap">
                {(Object.entries(PRESETS) as [Preset, typeof PRESETS[Preset]][]).map(([key, p]) => (
                    <button
                        key={key}
                        onClick={() => { setPreset(key); setUseCustom(false); }}
                        className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all border flex items-center gap-2 font-mono ${!useCustom && preset === key
                            ? `bg-gradient-to-r ${p.bg.replace('/15', '/20')} to-${p.bg.split('-')[0]}-500/10 ${p.border.replace('/30', '/40')} ${p.color} shadow-[0_0_20px_-8px_rgba(${key === 'tiny' ? '14,165,233' : key === 'good' ? '52,211,153' : '244,63,94'},0.3)]`
                            : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:bg-white/[0.05] hover:text-white/60 hover:border-white/[0.12]"
                            }`}
                    >
                        <span>η = {p.lr}</span>
                        <span className="text-[10px] opacity-70 font-normal">
                            {key === "tiny" ? t("neuralNetworkNarrative.howItLearns.learningRate.tooSmall")
                                : key === "good" ? t("neuralNetworkNarrative.howItLearns.learningRate.justRight")
                                    : t("neuralNetworkNarrative.howItLearns.learningRate.tooLarge")}
                        </span>
                    </button>
                ))}
            </div>

            {/* Custom slider */}
            <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] to-violet-500/[0.02] px-4 py-3 mb-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                    <button
                        onClick={() => setUseCustom(true)}
                        className={`text-sm font-mono font-bold ${useCustom ? "text-violet-400" : "text-white/40 hover:text-white/60"} transition-colors`}
                    >
                        {t("neuralNetworkNarrative.howItLearns.learningRate.custom")}
                    </button>
                    <span className={`text-base font-mono font-bold ${useCustom ? "text-violet-400" : "text-white/40"}`}>
                        η = {(useCustom ? customLr : lr).toFixed(3)}
                    </span>
                </div>
                <Slider
                    min={0.001}
                    max={1.0}
                    step={0.001}
                    value={[useCustom ? customLr : lr]}
                    onValueChange={([v]) => { setCustomLr(v); setUseCustom(true); }}
                    trackColor="#a78bfa"
                    thumbColor="#a78bfa"
                />
            </div>

            {/* Loss curve with gradient */}
            <div className="rounded-xl bg-gradient-to-br from-black/40 to-black/20 border border-white/[0.08] p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">
                        {t("neuralNetworkNarrative.howItLearns.learningRate.lossOverTime")}
                    </span>
                    <span className={`text-sm font-mono font-bold ${diverged ? "text-rose-400" : converged ? "text-emerald-400" : "text-amber-400"}`}>
                        Pérdida: {current.loss > 9999 ? "∞" : current.loss.toFixed(1)}
                    </span>
                </div>

                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-20" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="lrGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={diverged ? "rgba(244,63,94,0.4)" : converged ? "rgba(52,211,153,0.4)" : "rgba(251,191,36,0.4)"} />
                            <stop offset="100%" stopColor={diverged ? "rgba(244,63,94,0.1)" : converged ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)"} />
                        </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {[0, 20, 40, 60, 80].map(y => (
                        <line key={y} x1="0" y1={y} x2={chartW} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                    ))}

                    {/* Target line (loss = 0) */}
                    <line x1="0" y1={chartH} x2={chartW} y2={chartH} stroke="rgba(52,211,153,0.2)" strokeDasharray="3 3" strokeWidth="1" />

                    {/* Loss curve with fill */}
                    {displayHistory.length > 1 && (
                        <>
                            <motion.path
                                d={`M ${lossPoints} L ${chartW},${chartH} L 0,${chartH} Z`}
                                fill="url(#lrGrad)"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            />
                            <motion.polyline
                                fill="none"
                                stroke={diverged ? "rgba(251,113,133,0.9)" : converged ? "rgba(52,211,153,0.9)" : "rgba(251,191,36,0.9)"}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={lossPoints}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.3 }}
                            />
                        </>
                    )}

                    {/* Current point with glow */}
                    {displayHistory.length > 0 && (
                        <motion.circle
                            cx={(animStep / Math.max(maxStep, 1)) * chartW}
                            cy={chartH - (Math.min(current.loss, maxLoss) / maxLoss) * (chartH - 4)}
                            r="5"
                            fill={diverged ? "rgb(251,113,133)" : converged ? "rgb(52,211,153)" : "rgb(251,191,36)"}
                            className="drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                        />
                    )}
                </svg>

                {/* Step counter */}
                <div className="flex items-center justify-between mt-2">
                    <span className="text-[9px] font-mono text-white/25">Step 0</span>
                    <span className="text-[10px] font-mono text-white/40 font-bold">
                        Step {animStep} / {maxStep}
                    </span>
                    <span className="text-[9px] font-mono text-white/25">Step {maxStep}</span>
                </div>
            </div>

            {/* Current state cards with gradients */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <motion.div
                    key={`out-${animStep}`}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className={`rounded-xl bg-gradient-to-br p-3 text-center backdrop-blur-sm border transition-all ${Math.abs(current.output - TARGET) < 0.5
                        ? "from-emerald-500/[0.15] to-emerald-500/[0.05] border-emerald-500/30 shadow-[0_0_20px_-8px_rgba(52,211,153,0.3)]"
                        : "from-sky-500/[0.08] to-sky-500/[0.02] border-sky-500/15"
                        }`}
                >
                    <span className="text-[9px] text-white/40 block font-mono uppercase tracking-wider mb-1">Output</span>
                    <motion.span
                        key={current.output}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-2xl font-mono font-bold block ${Math.abs(current.output - TARGET) < 0.5 ? "text-emerald-400" : "text-sky-300"}`}
                    >
                        {current.output > 9999 ? "∞" : current.output.toFixed(1)}
                    </motion.span>
                </motion.div>
                <div className="rounded-xl bg-gradient-to-br from-emerald-500/[0.12] to-emerald-500/[0.04] border border-emerald-500/25 p-3 text-center backdrop-blur-sm shadow-[0_0_20px_-8px_rgba(52,211,153,0.2)]">
                    <span className="text-[9px] text-emerald-300/50 block font-mono uppercase tracking-wider mb-1">Target</span>
                    <span className="text-2xl font-mono font-bold text-emerald-400 block">{TARGET}</span>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-violet-500/[0.12] to-violet-500/[0.04] border border-violet-500/25 p-3 text-center backdrop-blur-sm shadow-[0_0_20px_-8px_rgba(139,92,246,0.2)]">
                    <span className="text-[9px] text-violet-300/50 block font-mono uppercase tracking-wider mb-1">η</span>
                    <span className="text-2xl font-mono font-bold text-violet-400 block">{lr.toFixed(3)}</span>
                </div>
            </div>

            {/* Play / Reset controls */}
            <div className="flex items-center gap-3 flex-wrap mb-6">
                <button
                    onClick={startAnimation}
                    disabled={isPlaying}
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold border transition-all disabled:opacity-30 disabled:cursor-not-allowed font-mono ${diverged
                        ? "bg-gradient-to-r from-rose-500/20 to-rose-500/10 border-rose-500/30 text-rose-400 hover:from-rose-500/30 hover:to-rose-500/15 hover:shadow-[0_0_20px_-8px_rgba(244,63,94,0.4)]"
                        : converged
                            ? "bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:from-emerald-500/30 hover:to-emerald-500/15 hover:shadow-[0_0_20px_-8px_rgba(52,211,153,0.4)]"
                            : "bg-gradient-to-r from-amber-500/20 to-amber-500/10 border-amber-500/30 text-amber-400 hover:from-amber-500/30 hover:to-amber-500/15 hover:shadow-[0_0_20px_-8px_rgba(251,191,36,0.4)]"
                        }`}
                >
                    {isPlaying ? (
                        <span className="flex items-center gap-2">
                            <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                                ⟳
                            </motion.span>
                            {t("neuralNetworkNarrative.howItLearns.learningRate.running")}
                        </span>
                    ) : (
                        `▶ ${t("neuralNetworkNarrative.howItLearns.learningRate.play")}`
                    )}
                </button>
                <button
                    onClick={() => { setAnimStep(0); setIsPlaying(false); if (intervalRef.current) clearInterval(intervalRef.current); }}
                    className="px-5 py-2.5 rounded-lg text-sm font-bold bg-white/[0.05] border border-white/[0.1] text-white/50 hover:bg-white/[0.08] hover:text-white/80 hover:border-white/[0.15] transition-all font-mono"
                >
                    {t("neuralNetworkNarrative.howItLearns.learningRate.reset")}
                </button>
            </div>

            {/* Verdict with better styling */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${lr}-${animStep >= maxStep ? "done" : "running"}`}
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className={`rounded-xl p-4 border text-center backdrop-blur-sm ${diverged
                        ? "bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-rose-500/15 border-rose-500/30 shadow-[0_0_30px_-10px_rgba(244,63,94,0.3)]"
                        : converged
                            ? "bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-emerald-500/15 border-emerald-500/30 shadow-[0_0_30px_-10px_rgba(52,211,153,0.3)]"
                            : "bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/15 border-amber-500/30 shadow-[0_0_30px_-10px_rgba(251,191,36,0.3)]"
                        }`}
                >
                    {animStep >= maxStep ? (
                        <>
                            <motion.p
                                className={`text-sm font-bold font-mono mb-1 ${diverged ? "text-rose-400" : converged ? "text-emerald-400" : "text-amber-400"}`}
                                animate={converged ? { scale: [1, 1.05, 1] } : {}}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                {converged && "✓ "}
                                {diverged
                                    ? t("neuralNetworkNarrative.howItLearns.learningRate.verdictDiverge")
                                    : converged
                                        ? t("neuralNetworkNarrative.howItLearns.learningRate.verdictConverge")
                                        : t("neuralNetworkNarrative.howItLearns.learningRate.verdictSlow")}
                            </motion.p>
                            <p className="text-xs text-white/45 leading-relaxed">
                                {diverged
                                    ? t("neuralNetworkNarrative.howItLearns.learningRate.explainDiverge")
                                    : converged
                                        ? t("neuralNetworkNarrative.howItLearns.learningRate.explainConverge")
                                        : t("neuralNetworkNarrative.howItLearns.learningRate.explainSlow")}
                            </p>
                        </>
                    ) : (
                        <p className="text-xs text-white/35 italic">
                            {t("neuralNetworkNarrative.howItLearns.learningRate.watchPrompt")}
                        </p>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
