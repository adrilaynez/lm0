"use client";

import { useCallback, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";

/*
  CrossEntropyVisualizer — "Learning with Cross-Entropy"
  Shows:
  1. The formula L = -log(P(correct))
  2. A batch of training examples with individual losses
  3. Batch loss = average
  4. A mini training loop: after backprop, P(correct) increases → loss drops
  5. Note: all ops are differentiable → backprop works
*/

const EXAMPLES = [
    { input: "hel", target: "l", initP: 0.04 },
    { input: "the", target: " ", initP: 0.08 },
    { input: "an ", target: "t", initP: 0.03 },
    { input: "ing", target: " ", initP: 0.06 },
    { input: " th", target: "e", initP: 0.09 },
];

function lossColor(loss: number): string {
    if (loss > 2.5) return "#ef4444";
    if (loss > 1.5) return "#f59e0b";
    if (loss > 0.7) return "#a78bfa";
    return "#22c55e";
}

export function CrossEntropyVisualizer() {
    const [step, setStep] = useState(0); // 0-6 training steps
    const [playing, setPlaying] = useState(false);

    // Each step increases P(correct) for all examples
    const examplesAtStep = EXAMPLES.map(ex => {
        const p = Math.min(0.88, ex.initP + step * 0.13);
        const loss = -Math.log(Math.max(p, 1e-8));
        return { ...ex, p, loss };
    });

    const batchLoss = examplesAtStep.reduce((s, e) => s + e.loss, 0) / examplesAtStep.length;

    const advance = useCallback(() => {
        setStep(prev => {
            if (prev >= 6) return prev;
            return prev + 1;
        });
    }, []);

    const reset = useCallback(() => { setStep(0); setPlaying(false); }, []);

    // Auto-play
    const playAll = useCallback(() => {
        setStep(0);
        setPlaying(true);
        let s = 0;
        const iv = setInterval(() => {
            s++;
            if (s > 6) { clearInterval(iv); setPlaying(false); return; }
            setStep(s);
        }, 700);
    }, []);

    return (
        <div className="p-4 sm:p-5 space-y-3">
            {/* Formula */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center space-y-1.5">
                <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Cross-Entropy Loss</p>
                <p className="text-base font-mono text-white/60">
                    L = −log( <span className="text-emerald-400">P(correct)</span> )
                </p>
                <p className="text-[9px] font-mono text-white/25">
                    For a batch: <span className="text-white/40">L<sub>batch</sub> = (1/N) Σ −log(P<sub>i</sub>)</span>
                </p>
            </div>

            {/* Training step indicator */}
            <div className="flex items-center justify-between">
                <p className="text-[9px] font-mono text-white/25">
                    Training step <span className="text-white/50 font-bold">{step}</span> / 6
                </p>
                <div className="flex items-center gap-1.5">
                    {step > 0 && (
                        <button onClick={reset} className="p-1.5 rounded-lg text-white/20 hover:text-white/40 transition-colors">
                            <RotateCcw className="w-3 h-3" />
                        </button>
                    )}
                    <button
                        onClick={step >= 6 ? reset : playing ? undefined : step === 0 ? playAll : advance}
                        disabled={playing}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold border transition-colors"
                        style={{
                            backgroundColor: step >= 6 ? "#22c55e15" : "#a78bfa15",
                            borderColor: step >= 6 ? "#22c55e30" : "#a78bfa30",
                            color: step >= 6 ? "#22c55e" : "#a78bfa",
                            opacity: playing ? 0.5 : 1,
                        }}
                    >
                        <Play className="w-3 h-3" />
                        {step === 0 ? "Train" : step >= 6 ? "Reset" : "Next step"}
                    </button>
                </div>
            </div>

            {/* Batch examples table */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-3 gap-y-0 p-3 text-[9px] font-mono">
                    {/* Header */}
                    <span className="text-white/15 pb-1">Input</span>
                    <span className="text-white/15 pb-1">P(correct)</span>
                    <span className="text-white/15 pb-1 text-right">−log(P)</span>
                    <span className="text-white/15 pb-1 text-right">Loss</span>

                    {examplesAtStep.map((ex, i) => (
                        <AnimatePresence key={i} mode="wait">
                            <motion.div
                                key={`${i}-${step}`}
                                className="contents"
                                initial={{ opacity: 0.5 }}
                                animate={{ opacity: 1 }}
                            >
                                {/* Input → target */}
                                <span className="text-white/30 py-0.5">
                                    <span className="text-amber-400/60">&quot;{ex.input}&quot;</span>
                                    <span className="text-white/10 mx-0.5">→</span>
                                    <span className="text-emerald-400/70 font-bold">{ex.target === " " ? "␣" : ex.target}</span>
                                </span>

                                {/* P bar */}
                                <div className="flex items-center gap-1.5 py-0.5">
                                    <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full bg-emerald-500/50"
                                            animate={{ width: `${ex.p * 100}%` }}
                                            transition={{ duration: 0.4 }}
                                        />
                                    </div>
                                    <span className="text-emerald-400/80 tabular-nums w-8 text-right">{(ex.p * 100).toFixed(0)}%</span>
                                </div>

                                {/* Formula */}
                                <span className="text-white/20 tabular-nums text-right py-0.5">
                                    −log({ex.p.toFixed(2)})
                                </span>

                                {/* Loss value */}
                                <motion.span
                                    className="font-bold tabular-nums text-right py-0.5"
                                    style={{ color: lossColor(ex.loss) }}
                                    animate={{ color: lossColor(ex.loss) }}
                                >
                                    {ex.loss.toFixed(2)}
                                </motion.span>
                            </motion.div>
                        </AnimatePresence>
                    ))}
                </div>

                {/* Batch loss summary */}
                <div className="border-t border-white/[0.06] px-3 py-2 flex items-center justify-between">
                    <span className="text-[9px] font-mono text-white/25">
                        Batch loss = (1/{EXAMPLES.length}) × Σ losses
                    </span>
                    <motion.span
                        className="text-sm font-mono font-bold tabular-nums"
                        style={{ color: lossColor(batchLoss) }}
                        animate={{ color: lossColor(batchLoss) }}
                    >
                        {batchLoss.toFixed(3)}
                    </motion.span>
                </div>
            </div>

            {/* Differentiability note */}
            <div className="rounded-lg border border-violet-500/10 bg-violet-500/[0.03] px-3 py-2">
                <p className="text-[9px] font-mono text-violet-400/60 leading-relaxed">
                    <strong className="text-violet-400/80">Why this works:</strong> softmax, log, and averaging are all <strong className="text-white/50">differentiable</strong> — meaning we can compute ∂L/∂weights for every weight in the network and use backpropagation to update them. That&apos;s the whole trick.
                </p>
            </div>
        </div>
    );
}
