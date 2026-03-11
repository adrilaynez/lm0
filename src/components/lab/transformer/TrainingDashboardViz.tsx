"use client";

import { useEffect, useState } from "react";

import { motion } from "framer-motion";

/*
  V53 — TrainingDashboardViz
  Animated training loop: shows a mini sequence being processed,
  loss decreasing over steps, and generated text improving.
  One idea: watch the Transformer learn in real-time.
  Height: ~280px. All text ≥ 13px.
*/

const STEPS = [
    { step: 0, loss: 11.2, output: "the the the the the" },
    { step: 100, loss: 8.4, output: "the cat the the mat" },
    { step: 500, loss: 5.1, output: "the cat sat the mat" },
    { step: 2000, loss: 3.2, output: "the cat sat on the" },
    { step: 5000, loss: 2.1, output: "the cat sat on the mat" },
    { step: 10000, loss: 1.4, output: "The cat sat on the warm mat" },
];

const MAX_LOSS = 12;

export function TrainingDashboardViz() {
    const [activeIdx, setActiveIdx] = useState(0);
    const [playing, setPlaying] = useState(true);

    useEffect(() => {
        if (!playing) return;
        const timer = setInterval(() => {
            setActiveIdx((i) => {
                if (i >= STEPS.length - 1) {
                    setPlaying(false);
                    return STEPS.length - 1;
                }
                return i + 1;
            });
        }, 1800);
        return () => clearInterval(timer);
    }, [playing]);

    const current = STEPS[activeIdx];
    const lossColor =
        current.loss > 8 ? "#f43f5e" :
        current.loss > 4 ? "#f59e0b" :
        current.loss > 2 ? "#22d3ee" : "#34d399";

    return (
        <div className="py-6 sm:py-8 px-3 sm:px-6" style={{ minHeight: 280 }}>
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-5">
                {STEPS.map((s, i) => (
                    <motion.button
                        key={i}
                        onClick={() => { setActiveIdx(i); setPlaying(false); }}
                        className="rounded-lg px-2.5 py-1.5 text-[13px] font-mono font-bold"
                        style={{
                            background: activeIdx === i
                                ? `${i >= STEPS.length - 2 ? "#34d399" : "#22d3ee"}12`
                                : "rgba(255,255,255,0.02)",
                            border: `1.5px solid ${activeIdx === i
                                ? (i >= STEPS.length - 2 ? "rgba(52,211,153,0.4)" : "rgba(34,211,238,0.3)")
                                : "rgba(255,255,255,0.04)"}`,
                            color: activeIdx === i
                                ? (i >= STEPS.length - 2 ? "#34d399" : "#22d3ee")
                                : "rgba(255,255,255,0.15)",
                        }}
                        whileTap={{ scale: 0.9 }}
                    >
                        {s.step === 0 ? "Start" : `${s.step >= 1000 ? `${s.step / 1000}k` : s.step}`}
                    </motion.button>
                ))}
            </div>

            {/* Dashboard grid */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                {/* Loss gauge */}
                <div
                    className="rounded-xl px-4 py-3"
                    style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.04)",
                    }}
                >
                    <p className="text-[13px] font-semibold text-white/25 mb-2">Loss</p>
                    <div className="flex items-end gap-1" style={{ height: 80 }}>
                        {STEPS.map((s, i) => {
                            const h = (s.loss / MAX_LOSS) * 70;
                            const isActive = i <= activeIdx;
                            const barColor =
                                s.loss > 8 ? "#f43f5e" :
                                s.loss > 4 ? "#f59e0b" :
                                s.loss > 2 ? "#22d3ee" : "#34d399";
                            return (
                                <motion.div
                                    key={i}
                                    className="flex-1 rounded-t-sm"
                                    style={{
                                        background: isActive ? barColor : "rgba(255,255,255,0.04)",
                                        opacity: isActive ? (i === activeIdx ? 0.8 : 0.3) : 0.1,
                                    }}
                                    animate={{ height: isActive ? h : 4 }}
                                    transition={{ type: "spring", stiffness: 120, damping: 14 }}
                                />
                            );
                        })}
                    </div>
                    <motion.p
                        className="text-[18px] font-bold font-mono mt-1 text-center"
                        style={{ color: lossColor }}
                        key={activeIdx}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                    >
                        {current.loss.toFixed(1)}
                    </motion.p>
                </div>

                {/* Generated text */}
                <div
                    className="rounded-xl px-4 py-3"
                    style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.04)",
                    }}
                >
                    <p className="text-[13px] font-semibold text-white/25 mb-2">Output</p>
                    <motion.p
                        key={activeIdx}
                        className="text-[14px] font-mono leading-relaxed"
                        style={{
                            color: activeIdx >= STEPS.length - 2 ? "#34d399" : activeIdx >= 3 ? "#22d3ee" : "rgba(255,255,255,0.35)",
                        }}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        &quot;{current.output}&quot;
                    </motion.p>
                    <p className="text-[12px] text-white/15 mt-2">
                        Step {current.step.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Play/reset controls */}
            <div className="flex items-center justify-center gap-3 mt-4">
                <button
                    onClick={() => { setPlaying(!playing); if (activeIdx >= STEPS.length - 1) { setActiveIdx(0); setPlaying(true); } }}
                    className="text-[13px] font-semibold"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                >
                    {activeIdx >= STEPS.length - 1 ? "↻ Replay" : playing ? "⏸ Pause" : "▶ Play"}
                </button>
            </div>

            {/* Status message */}
            <motion.p
                key={activeIdx}
                className="text-center text-[14px] font-semibold mt-3"
                style={{ color: `${lossColor}80` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                {activeIdx === 0 && "Random weights — the model knows nothing."}
                {activeIdx === 1 && "Starting to repeat common words..."}
                {activeIdx === 2 && "Words from the training data appear!"}
                {activeIdx === 3 && "Sentence structure is forming."}
                {activeIdx === 4 && "Almost there — grammar is clicking."}
                {activeIdx === 5 && "Coherent output — the Transformer has learned."}
            </motion.p>
        </div>
    );
}
