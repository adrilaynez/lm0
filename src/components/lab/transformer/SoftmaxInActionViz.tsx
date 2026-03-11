"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";

/*
  SoftmaxInActionViz — NEW-06
  §04b, right after QuerySearchViz.
  
  Left: raw Q·K scores for "king".
  Right: softmax output percentages.
  Middle: animated transformation.
  Interactive: temperature slider controls softmax sharpness.
*/

const WORDS = ["crown", "ruled", "golden", "wore", "who", "the", "wisely", "king"];

const RAW_SCORES = [8.2, 6.1, 5.5, 4.2, 2.8, 1.5, 3.9, 5.0];

const COLORS: string[] = [
    "#fbbf24", "#22d3ee", "#eab308", "#a3a3a3",
    "#64748b", "#475569", "#a78bfa", "#f472b6",
];

function softmax(scores: number[], temperature: number): number[] {
    const scaled = scores.map(s => s / Math.max(temperature, 0.1));
    const maxVal = Math.max(...scaled);
    const exps = scaled.map(s => Math.exp(s - maxVal));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
}

export function SoftmaxInActionViz() {
    const [temperature, setTemperature] = useState(1.0);

    const probs = useMemo(() => softmax(RAW_SCORES, temperature), [temperature]);
    const maxProb = Math.max(...probs);

    const tempLabel = temperature < 0.4
        ? "Very sharp — one word dominates"
        : temperature < 0.8
            ? "Sharp — clear preferences"
            : temperature < 1.5
                ? "Balanced — healthy distribution"
                : temperature < 3.0
                    ? "Flat — spreading attention thin"
                    : "Uniform — almost equal everywhere";

    const tempColor = temperature < 0.4
        ? "#f87171"
        : temperature < 0.8
            ? "#fb923c"
            : temperature < 1.5
                ? "#34d399"
                : temperature < 3.0
                    ? "#fbbf24"
                    : "#f87171";

    return (
        <div className="py-8 sm:py-10 px-3 sm:px-6 space-y-6">

            {/* Title */}
            <div className="text-center">
                <p className="text-[11px] uppercase tracking-widest font-semibold text-white/25 mb-1">
                    From raw scores to recipe
                </p>
                <p className="text-base sm:text-lg font-semibold text-white/50">
                    Softmax turns scores into percentages
                </p>
            </div>

            {/* Main two-column layout */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-6 max-w-xl mx-auto items-start">

                {/* Left: Raw scores */}
                <div className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-white/22 text-center mb-2">
                        Raw Scores
                    </p>
                    {WORDS.map((word, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-[11px] font-medium w-12 text-right shrink-0" style={{ color: `${COLORS[i]}70` }}>
                                {word}
                            </span>
                            <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                                <div
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${(RAW_SCORES[i] / 10) * 100}%`,
                                        background: `${COLORS[i]}40`,
                                    }}
                                />
                            </div>
                            <span className="text-[10px] font-mono text-white/22 w-7 text-right tabular-nums shrink-0">
                                {RAW_SCORES[i].toFixed(1)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Middle: Arrow */}
                <div className="flex flex-col items-center justify-center pt-6 gap-1">
                    <span className="text-white/12 text-lg">→</span>
                    <span className="text-[8px] text-white/15 font-mono">softmax</span>
                </div>

                {/* Right: Probabilities */}
                <div className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-white/22 text-center mb-2">
                        Percentages
                    </p>
                    {WORDS.map((word, i) => {
                        const prob = probs[i];
                        const isMax = prob === maxProb;
                        const relOpacity = 0.3 + (prob / maxProb) * 0.7;

                        return (
                            <div key={i} className="flex items-center gap-2">
                                <span className="text-[11px] font-medium w-12 text-right shrink-0" style={{ color: `${COLORS[i]}70` }}>
                                    {word}
                                </span>
                                <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                                    <motion.div
                                        className="h-full rounded-full"
                                        animate={{ width: `${prob * 100}%` }}
                                        transition={{ type: "spring", stiffness: 100, damping: 16 }}
                                        style={{
                                            background: isMax
                                                ? `linear-gradient(90deg, ${COLORS[i]}50, ${COLORS[i]}90)`
                                                : `${COLORS[i]}${Math.round(relOpacity * 60).toString(16).padStart(2, "0")}`,
                                            boxShadow: isMax ? `0 0 6px ${COLORS[i]}30` : "none",
                                        }}
                                    />
                                </div>
                                <motion.span
                                    className="text-[10px] font-mono tabular-nums w-8 text-right shrink-0"
                                    animate={{ color: isMax ? `${COLORS[i]}aa` : "rgba(255,255,255,0.22)" }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {Math.round(prob * 100)}%
                                </motion.span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Temperature slider */}
            <div className="max-w-sm mx-auto space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-widest font-semibold text-white/22">
                        Temperature
                    </label>
                    <span className="text-[11px] font-mono tabular-nums" style={{ color: `${tempColor}70` }}>
                        {temperature.toFixed(1)}
                    </span>
                </div>
                <input
                    type="range"
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-1 rounded-full appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(90deg, rgba(248,113,113,0.3), rgba(52,211,153,0.3) 30%, rgba(251,191,36,0.3) 70%, rgba(248,113,113,0.3))`,
                        accentColor: tempColor,
                    }}
                />
                <p className="text-[11px] text-center font-medium" style={{ color: `${tempColor}55` }}>
                    {tempLabel}
                </p>
            </div>

            {/* Caption */}
            <p className="text-[12px] text-center text-white/25 max-w-md mx-auto leading-relaxed">
                Softmax turns raw scores into a probability distribution — a recipe where
                ingredients sum to 100%.
            </p>
        </div>
    );
}
