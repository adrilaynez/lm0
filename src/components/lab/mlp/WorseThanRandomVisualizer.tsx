"use client";

import { motion } from "framer-motion";

/* ─── Constants ─── */
const RANDOM_LOSS = Math.log(27); // ln(27) ≈ 3.296
const BAD_INIT_LOSS = 4.25;
const MAX_LOSS = 5.0;

function LossBar({ label, loss, color, delay }: { label: string; loss: number; color: string; delay: number }) {
    const pct = (loss / MAX_LOSS) * 100;
    const isWorse = loss > RANDOM_LOSS;

    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider">{label}</span>
            <div className="relative h-8 bg-white/[0.03] rounded-lg overflow-hidden border border-white/5">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay, ease: "easeOut" }}
                    className={`absolute inset-y-0 left-0 rounded-lg ${color}`}
                />
                {/* Random baseline marker */}
                <div
                    className="absolute top-0 bottom-0 w-px border-l border-dashed border-white/30"
                    style={{ left: `${(RANDOM_LOSS / MAX_LOSS) * 100}%` }}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-white/80">
                    {loss.toFixed(2)}
                </span>
            </div>
            {isWorse && (
                <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: delay + 0.6 }}
                    className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider"
                >
                    ⚠ Worse than random!
                </motion.span>
            )}
        </div>
    );
}

export function WorseThanRandomVisualizer() {
    return (
        <div className="flex flex-col gap-6">
            <div className="grid sm:grid-cols-2 gap-6">
                {/* Left: Random guessing */}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px]">🎲</span>
                        <h4 className="text-sm font-bold text-white/70">Random Guessing</h4>
                    </div>
                    <p className="text-[11px] text-white/40 leading-relaxed">
                        Uniform probabilities over 27 characters. Knows nothing — gives each character equal chance.
                    </p>
                    <LossBar label="Cross-entropy loss" loss={RANDOM_LOSS} color="bg-white/20" delay={0.2} />
                    <div className="text-[10px] font-mono text-white/30 mt-1">
                        P(each char) = 1/27 ≈ 3.7%
                    </div>
                </div>

                {/* Right: Bad initialization */}
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-[10px]">💀</span>
                        <h4 className="text-sm font-bold text-red-300">Bad Init (σ=5.0)</h4>
                    </div>
                    <p className="text-[11px] text-red-200/40 leading-relaxed">
                        Huge weights → saturated activations → softmax concentrates on WRONG characters. Confidently wrong.
                    </p>
                    <LossBar label="Cross-entropy loss" loss={BAD_INIT_LOSS} color="bg-red-500/50" delay={0.6} />
                    <div className="text-[10px] font-mono text-red-300/40 mt-1">
                        P(wrong char) ≈ 80% — confident and incorrect
                    </div>
                </div>
            </div>

            {/* Baseline legend */}
            <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-white/30">
                <span className="w-4 border-t border-dashed border-white/30" />
                <span>dashed line = random baseline (ln 27 ≈ {RANDOM_LOSS.toFixed(2)})</span>
            </div>
        </div>
    );
}
