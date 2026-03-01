"use client";

import { useCallback, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";

/*
  SingleExampleTrainer
  Shows the full training loop for ONE example: forward pass → compute loss → backward pass → update weights.
  Uses illustrative numbers — no backend needed.
*/

const PHASES = [
    { id: "forward", label: "1. Forward", color: "text-violet-400", accent: "violet" },
    { id: "loss", label: "2. Loss", color: "text-rose-400", accent: "rose" },
    { id: "backward", label: "3. Backward", color: "text-amber-400", accent: "amber" },
    { id: "update", label: "4. Update", color: "text-emerald-400", accent: "emerald" },
] as const;

export function SingleExampleTrainer() {
    const [phase, setPhase] = useState(0);
    const [iteration, setIteration] = useState(0);

    const advance = useCallback(() => {
        if (phase < PHASES.length - 1) {
            setPhase(prev => prev + 1);
        } else {
            setIteration(prev => prev + 1);
            setPhase(0);
        }
    }, [phase]);

    const reset = useCallback(() => { setPhase(0); setIteration(0); }, []);

    // Simulated values that improve with iterations
    const loss = Math.max(0.8, 3.3 - iteration * 0.5 - (phase >= 1 ? 0 : 0));
    const targetProb = Math.min(0.65, 0.05 + iteration * 0.12 + (phase >= 3 ? 0.05 : 0));
    const lr = 0.01;
    const gradMagnitude = loss * 0.3;

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Phase indicator */}
            <div className="flex items-center gap-2">
                {PHASES.map((p, i) => (
                    <button
                        key={p.id}
                        onClick={() => setPhase(i)}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-mono font-bold text-center transition-all border ${
                            i <= phase
                                ? `bg-${p.accent}-500/10 border-${p.accent}-500/20 ${p.color}`
                                : "bg-white/[0.02] border-white/[0.06] text-white/20"
                        }`}
                        style={i <= phase ? {
                            backgroundColor: `rgba(${p.accent === "violet" ? "139,92,246" : p.accent === "rose" ? "244,63,94" : p.accent === "amber" ? "245,158,11" : "16,185,129"}, 0.1)`,
                            borderColor: `rgba(${p.accent === "violet" ? "139,92,246" : p.accent === "rose" ? "244,63,94" : p.accent === "amber" ? "245,158,11" : "16,185,129"}, 0.2)`,
                        } : {}}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Iteration counter */}
            <div className="flex items-center justify-between text-[9px] font-mono text-white/25">
                <span>Training iteration: {iteration + 1}</span>
                <span>Loss: {loss.toFixed(2)}</span>
            </div>

            {/* Phase content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${phase}-${iteration}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 min-h-[120px]"
                >
                    {phase === 0 && (
                        <div className="space-y-3">
                            <p className="text-xs text-white/40">Forward: &quot;hel&quot; → embed → hidden → softmax</p>
                            <div className="flex items-center justify-center gap-3 text-xs font-mono">
                                <span className="px-2 py-1 rounded bg-violet-500/10 text-violet-400">&quot;hel&quot;</span>
                                <span className="text-white/20">→</span>
                                <span className="px-2 py-1 rounded bg-violet-500/10 text-violet-400">embed</span>
                                <span className="text-white/20">→</span>
                                <span className="px-2 py-1 rounded bg-violet-500/10 text-violet-400">tanh</span>
                                <span className="text-white/20">→</span>
                                <span className="px-2 py-1 rounded bg-violet-500/10 text-violet-400">softmax</span>
                            </div>
                            <div className="text-center">
                                <span className="text-[10px] text-white/30">P(&apos;l&apos;) = </span>
                                <span className="text-sm font-mono font-bold text-violet-400">{targetProb.toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    {phase === 1 && (
                        <div className="space-y-3">
                            <p className="text-xs text-white/40">Cross-entropy loss: how wrong was the prediction?</p>
                            <div className="text-center space-y-2">
                                <p className="text-[10px] font-mono text-white/30">
                                    L = −log P(&apos;l&apos;) = −log({targetProb.toFixed(2)})
                                </p>
                                <motion.p
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    className="text-3xl font-mono font-bold text-rose-400"
                                >
                                    {loss.toFixed(2)}
                                </motion.p>
                                <div className="h-2 rounded-full bg-white/[0.06] max-w-xs mx-auto overflow-hidden">
                                    <motion.div
                                        className="h-full bg-rose-500/50 rounded-full"
                                        animate={{ width: `${Math.min(100, loss * 30)}%` }}
                                    />
                                </div>
                                <p className="text-[9px] text-white/20">{loss > 2 ? "High loss — prediction is poor" : loss > 1 ? "Getting better" : "Good — prediction is confident"}</p>
                            </div>
                        </div>
                    )}

                    {phase === 2 && (
                        <div className="space-y-3">
                            <p className="text-xs text-white/40">Backward: compute gradients via chain rule</p>
                            <div className="flex items-center justify-center gap-2 text-xs font-mono">
                                <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400">∂L/∂W₂</span>
                                <span className="text-white/20">←</span>
                                <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400">∂L/∂h</span>
                                <span className="text-white/20">←</span>
                                <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400">∂L/∂W₁</span>
                                <span className="text-white/20">←</span>
                                <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400">∂L/∂E</span>
                            </div>
                            <div className="text-center">
                                <span className="text-[10px] text-white/30">Gradient magnitude: </span>
                                <span className="text-sm font-mono font-bold text-amber-400">{gradMagnitude.toFixed(3)}</span>
                            </div>
                            <p className="text-[9px] text-white/20 text-center">Gradients flow backward through every layer, telling each weight how to change</p>
                        </div>
                    )}

                    {phase === 3 && (
                        <div className="space-y-3">
                            <p className="text-xs text-white/40">Update: W ← W − lr × gradient</p>
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="rounded-lg border border-white/[0.06] p-2">
                                    <p className="text-[8px] text-white/25 mb-1">EMBEDDING</p>
                                    <p className="text-xs font-mono text-emerald-400">E − {lr} × ∇E</p>
                                </div>
                                <div className="rounded-lg border border-white/[0.06] p-2">
                                    <p className="text-[8px] text-white/25 mb-1">HIDDEN</p>
                                    <p className="text-xs font-mono text-emerald-400">W₁ − {lr} × ∇W₁</p>
                                </div>
                                <div className="rounded-lg border border-white/[0.06] p-2">
                                    <p className="text-[8px] text-white/25 mb-1">OUTPUT</p>
                                    <p className="text-xs font-mono text-emerald-400">W₂ − {lr} × ∇W₂</p>
                                </div>
                            </div>
                            <p className="text-[9px] text-emerald-400/60 text-center font-mono">
                                ✓ All weights nudged to make P(&apos;l&apos;) higher next time
                            </p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="flex justify-between items-center">
                <button onClick={reset} className="flex items-center gap-1.5 text-[10px] font-mono text-white/30 hover:text-white/50 transition-colors">
                    <RotateCcw className="w-3 h-3" /> Reset
                </button>
                <button
                    onClick={advance}
                    className="px-4 py-2 rounded-lg bg-violet-500/15 border border-violet-500/30 text-xs font-mono font-bold text-violet-400 hover:bg-violet-500/25 transition-colors"
                >
                    {phase < PHASES.length - 1 ? "Next Phase →" : "Next Iteration ↻"}
                </button>
            </div>
        </div>
    );
}
