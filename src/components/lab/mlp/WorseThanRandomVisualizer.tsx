"use client";

import { useState } from "react";
import { motion } from "framer-motion";

/* ─────────────────────────────────────────────
   WorseThanRandomVisualizer — v2
   Shows WHY a randomly initialized model can
   predict WORSE than uniform random guessing,
   with a concrete character probability example.
   ───────────────────────────────────────────── */

const VOCAB = "abcdefghijklmnopqrstuvwxyz ".split("");
const RANDOM_LOSS = Math.log(27); // ≈ 3.296

// Simulated logits from a badly initialized network
// Large random weights → some logits are much larger than others
// Softmax concentrates probability on a few wrong characters
function seededLogits(sigma: number): number[] {
    const logits: number[] = [];
    for (let i = 0; i < 27; i++) {
        // Deterministic pseudo-random
        const u1 = ((i * 2654435761 + 7) % 2147483647) / 2147483647;
        const u2 = ((i * 340573321 + 13) % 2147483647) / 2147483647;
        const z = Math.sqrt(-2 * Math.log(Math.max(u1, 0.001))) * Math.cos(2 * Math.PI * u2);
        logits.push(z * sigma);
    }
    return logits;
}

function softmax(logits: number[]): number[] {
    const max = Math.max(...logits);
    const exps = logits.map(l => Math.exp(l - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
}

function crossEntropy(probs: number[], targetIdx: number): number {
    return -Math.log(Math.max(probs[targetIdx], 1e-10));
}

export function WorseThanRandomVisualizer() {
    const [sigma, setSigma] = useState(3.0);

    const logits = seededLogits(sigma);
    const probs = softmax(logits);
    const uniform = 1 / 27;

    // Pick "the" as context → correct next char should be ' ' (space, index 26)
    const correctIdx = 26; // space
    const correctChar = VOCAB[correctIdx];
    const correctProb = probs[correctIdx];
    const loss = crossEntropy(probs, correctIdx);
    const maxProbIdx = probs.indexOf(Math.max(...probs));
    const maxProbChar = VOCAB[maxProbIdx];
    const maxProb = probs[maxProbIdx];

    // Sort by probability for display
    const sorted = VOCAB.map((c, i) => ({ char: c === " " ? "⎵" : c, prob: probs[i], isCorrect: i === correctIdx }))
        .sort((a, b) => b.prob - a.prob);

    const isWorse = loss > RANDOM_LOSS;

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* ── Context ── */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-3">
                <div className="text-[8px] font-mono text-white/20 mb-1">Example: after seeing &quot;the&quot;, what letter comes next?</div>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-white/50">Context: &quot;the&quot; → Next:</span>
                    <span className="text-[11px] font-mono font-bold text-emerald-400">&quot;{correctChar === " " ? "⎵" : correctChar}&quot; (space)</span>
                    <span className="text-[8px] font-mono text-white/15">← correct answer</span>
                </div>
            </div>

            {/* ── Sigma slider ── */}
            <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-white/25 shrink-0">Init scale σ:</span>
                <input
                    type="range" min={0.1} max={5.0} step={0.1} value={sigma}
                    onChange={e => setSigma(+e.target.value)}
                    className="flex-1 h-1 accent-violet-500 bg-white/10 rounded-full"
                />
                <span className="text-[11px] font-mono font-bold min-w-[2rem] text-right" style={{ color: sigma > 1.5 ? "#ef4444" : sigma > 0.5 ? "#f59e0b" : "#22c55e" }}>
                    {sigma.toFixed(1)}
                </span>
            </div>

            {/* ── Probability distribution ── */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-[8px] font-mono text-white/20 uppercase">Model&apos;s predicted probabilities</span>
                    <span className="text-[8px] font-mono text-white/15">27 characters</span>
                </div>

                {/* Top 5 + correct */}
                <div className="space-y-1">
                    {sorted.slice(0, 6).map(({ char, prob, isCorrect }, i) => {
                        const pct = prob * 100;
                        return (
                            <motion.div
                                key={char}
                                className="flex items-center gap-2"
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <span className={`text-[10px] font-mono font-bold w-5 text-center ${isCorrect ? "text-emerald-400" : "text-white/30"}`}>
                                    {char}
                                </span>
                                <div className="flex-1 h-4 rounded bg-white/[0.03] overflow-hidden relative">
                                    <div
                                        className="h-full rounded transition-all"
                                        style={{
                                            width: `${Math.max(1, pct)}%`,
                                            backgroundColor: isCorrect ? "#22c55e" : i === 0 && !isCorrect ? "#ef4444" : "#a78bfa",
                                            opacity: 0.5,
                                        }}
                                    />
                                    {/* Uniform baseline */}
                                    <div className="absolute top-0 bottom-0 w-px" style={{ left: `${uniform * 100}%`, background: "#ffffff20" }} />
                                </div>
                                <span className={`text-[8px] font-mono font-bold w-12 text-right ${isCorrect ? "text-emerald-400" : i === 0 && !isCorrect ? "text-red-400" : "text-white/25"}`}>
                                    {pct.toFixed(1)}%
                                </span>
                            </motion.div>
                        );
                    })}
                    {/* Show correct if not in top 6 */}
                    {!sorted.slice(0, 6).some(s => s.isCorrect) && (
                        <div className="flex items-center gap-2 border-t border-white/[0.04] pt-1 mt-1">
                            <span className="text-[10px] font-mono font-bold w-5 text-center text-emerald-400">⎵</span>
                            <div className="flex-1 h-4 rounded bg-white/[0.03] overflow-hidden relative">
                                <div className="h-full rounded" style={{ width: `${Math.max(0.5, correctProb * 100)}%`, backgroundColor: "#22c55e", opacity: 0.5 }} />
                            </div>
                            <span className="text-[8px] font-mono font-bold w-12 text-right text-emerald-400">
                                {(correctProb * 100).toFixed(1)}%
                            </span>
                        </div>
                    )}
                </div>

                <div className="text-[7px] font-mono text-white/15 text-center">
                    dashed line = uniform {(uniform * 100).toFixed(1)}%
                </div>
            </div>

            {/* ── Loss comparison ── */}
            <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-1">
                    <div className="text-[9px] font-mono text-white/30 font-bold">Random Guessing</div>
                    <div className="text-lg font-mono font-black text-white/50">{RANDOM_LOSS.toFixed(3)}</div>
                    <div className="text-[8px] font-mono text-white/20">P(space) = {(uniform * 100).toFixed(1)}% — equal chance for all</div>
                </div>
                <div className={`rounded-xl border p-3 space-y-1 ${isWorse ? "border-red-500/20 bg-red-500/[0.03]" : "border-emerald-500/20 bg-emerald-500/[0.03]"}`}>
                    <div className="text-[9px] font-mono font-bold" style={{ color: isWorse ? "#ef4444" : "#22c55e" }}>
                        Model (σ={sigma.toFixed(1)})
                    </div>
                    <div className="text-lg font-mono font-black" style={{ color: isWorse ? "#ef4444" : "#22c55e" }}>
                        {loss.toFixed(3)}
                        {isWorse && " ⚠"}
                    </div>
                    <div className="text-[8px] font-mono" style={{ color: isWorse ? "#ef444480" : "#22c55e80" }}>
                        P(space) = {(correctProb * 100).toFixed(1)}% — puts {(maxProb * 100).toFixed(0)}% on &quot;{maxProbChar === " " ? "⎵" : maxProbChar}&quot;
                    </div>
                </div>
            </div>

            {/* ── Explanation ── */}
            {isWorse && (
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-3"
                >
                    <p className="text-[9px] font-mono text-red-400/70 leading-relaxed">
                        <span className="font-bold">Why worse than random?</span> Random guessing gives {(uniform * 100).toFixed(1)}% to every character — including the correct one. But with σ={sigma.toFixed(1)}, the model&apos;s large random weights make softmax concentrate {(maxProb * 100).toFixed(0)}% on &quot;{maxProbChar === " " ? "⎵" : maxProbChar}&quot; (wrong!) and only {(correctProb * 100).toFixed(1)}% on the correct space. The model is <span className="font-bold">confidently wrong</span>. Loss = -ln({correctProb.toFixed(4)}) = {loss.toFixed(2)}, which is {(loss - RANDOM_LOSS).toFixed(2)} worse than random.
                    </p>
                </motion.div>
            )}
        </div>
    );
}
