"use client";

import { useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { Slider } from "@/components/ui/slider";
import { NN_COLORS } from "./visualizer-theme";

const CHARS = "abcdefghijklmnopqrstuvwxyz ".split("");

const LOGITS: Record<string, number> = {
    e: 2.1, " ": 1.4, a: 0.8, i: 0.5, o: 0.4, n: 0.3, s: 0.2, t: 0.1,
    r: 0.0, l: -0.1, h: -0.2, d: -0.3, c: -0.4, u: -0.5, m: -0.5,
    p: -0.6, f: -0.6, g: -0.7, b: -0.7, w: -0.8, y: -0.8, v: -0.9,
    k: -0.9, j: -1.0, x: -1.0, q: -1.0, z: -1.0,
};

function softmax(logits: Record<string, number>, temp: number): Record<string, number> {
    const scaled = Object.fromEntries(
        Object.entries(logits).map(([k, v]) => [k, v / temp])
    );
    const maxVal = Math.max(...Object.values(scaled));
    const exps = Object.fromEntries(
        Object.entries(scaled).map(([k, v]) => [k, Math.exp(v - maxVal)])
    );
    const sum = Object.values(exps).reduce((a, b) => a + b, 0);
    return Object.fromEntries(
        Object.entries(exps).map(([k, v]) => [k, v / sum])
    );
}

const sorted = [...CHARS].sort((a, b) => (LOGITS[b] ?? 0) - (LOGITS[a] ?? 0));
const TOP_N = 6; // Show top 6 in the neuron diagram

export function SoftmaxTransformDemo() {
    const { t } = useI18n();
    const shouldReduceMotion = useReducedMotion();
    const [showSoftmax, setShowSoftmax] = useState(false);
    const [temp, setTemp] = useState(1.0);

    const probs = useMemo(() => softmax(LOGITS, temp), [temp]);
    const top3 = sorted.slice(0, 3);
    const topN = sorted.slice(0, TOP_N);

    const MAX_LOGIT = 2.1;
    const MIN_LOGIT = -1.0;
    const RANGE = MAX_LOGIT - MIN_LOGIT;

    // Neuron diagram layout
    const DIAG_W = 300;
    const DIAG_H = 110;
    const hiddenX = 60;
    const outputX = 240;
    const hiddenSpacing = 16;
    const outputSpacing = 16;
    const hiddenStartY = (DIAG_H - (TOP_N - 1) * hiddenSpacing) / 2;
    const outputStartY = (DIAG_H - (TOP_N - 1) * outputSpacing) / 2;

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Toggle + Temperature */}
            <div className="flex flex-wrap items-center gap-3">
                <button
                    onClick={() => setShowSoftmax(false)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${!showSoftmax
                            ? "bg-white/[0.06] border-white/[0.12] text-white/60"
                            : "bg-white/[0.02] border-white/[0.06] text-white/30 hover:text-white/50"
                        }`}
                >
                    {t("neuralNetworkNarrative.fromNumbers.softmax.rawBtn")}
                </button>
                <button
                    onClick={() => setShowSoftmax(true)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${showSoftmax
                            ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                            : "bg-white/[0.02] border-white/[0.06] text-white/30 hover:text-white/50"
                        }`}
                >
                    {t("neuralNetworkNarrative.fromNumbers.softmax.softmaxBtn")}
                </button>

                {showSoftmax && (
                    <div className="flex items-center gap-2 ml-auto">
                        <span className="text-[10px] text-white/30">T =</span>
                        <Slider
                            min={0.1} max={3.0} step={0.1}
                            value={[temp]}
                            onValueChange={([v]) => setTemp(v)}
                            className="w-24"
                        />
                        <span className="text-xs font-mono text-white/50 w-8">{temp.toFixed(1)}</span>
                    </div>
                )}
            </div>

            {/* Neuron diagram with glowing connections */}
            <svg viewBox={`0 0 ${DIAG_W} ${DIAG_H}`} className="w-full max-w-sm mx-auto" aria-hidden>
                {/* Connections from hidden neurons to output */}
                {topN.map((ch, i) => {
                    const prob = probs[ch] ?? 0;
                    const hy = hiddenStartY + i * hiddenSpacing;
                    const oy = outputStartY + i * outputSpacing;
                    const glow = showSoftmax ? prob : ((LOGITS[ch] ?? 0) - MIN_LOGIT) / RANGE / 3;
                    return (
                        <motion.line
                            key={`conn-${ch}`}
                            x1={hiddenX + 10} y1={hy}
                            x2={outputX - 10} y2={oy}
                            stroke={showSoftmax ? NN_COLORS.output.hex : NN_COLORS.hidden.hex}
                            strokeWidth={Math.max(0.5, glow * 3)}
                            animate={{ opacity: Math.max(0.08, glow) }}
                            transition={{ duration: 0.2 }}
                        />
                    );
                })}

                {/* Hidden neurons (left) */}
                {topN.map((ch, i) => {
                    const hy = hiddenStartY + i * hiddenSpacing;
                    return (
                        <g key={`hidden-${ch}`}>
                            <circle cx={hiddenX} cy={hy} r="8"
                                fill={NN_COLORS.hidden.hex + "18"}
                                stroke={NN_COLORS.hidden.hex} strokeWidth="1" />
                            <text x={hiddenX} y={hy + 3} textAnchor="middle"
                                fill={NN_COLORS.hidden.hex} fontSize="7" fontFamily="monospace" fontWeight="bold">
                                {ch === " " ? "␣" : ch}
                            </text>
                        </g>
                    );
                })}

                {/* Output neurons (right) with probability glow */}
                {topN.map((ch, i) => {
                    const oy = outputStartY + i * outputSpacing;
                    const prob = probs[ch] ?? 0;
                    const glowR = showSoftmax ? 8 + prob * 12 : 8;
                    return (
                        <g key={`output-${ch}`}>
                            {showSoftmax && prob > 0.05 && (
                                <circle cx={outputX} cy={oy} r={glowR + 4}
                                    fill={NN_COLORS.output.hex} opacity={prob * 0.15} />
                            )}
                            <motion.circle cx={outputX} cy={oy}
                                animate={{ r: glowR }}
                                transition={{ duration: 0.2 }}
                                fill={showSoftmax ? NN_COLORS.output.hex + "20" : "rgba(255,255,255,0.03)"}
                                stroke={showSoftmax ? NN_COLORS.output.hex : "rgba(255,255,255,0.15)"}
                                strokeWidth="1" />
                            <text x={outputX} y={oy + 3} textAnchor="middle"
                                fill={showSoftmax ? NN_COLORS.output.hex : "rgba(255,255,255,0.4)"}
                                fontSize="7" fontFamily="monospace" fontWeight="bold">
                                {showSoftmax ? `${(prob * 100).toFixed(0)}%` : (LOGITS[ch] ?? 0).toFixed(1)}
                            </text>
                        </g>
                    );
                })}

                {/* Labels */}
                <text x={hiddenX} y={8} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="6" fontFamily="monospace">
                    {t("neuralNetworkNarrative.fromNumbers.softmax.neuronsLabel")}
                </text>
                <text x={outputX} y={8} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="6" fontFamily="monospace">
                    {showSoftmax ? t("neuralNetworkNarrative.fromNumbers.softmax.probsLabel") : t("neuralNetworkNarrative.fromNumbers.softmax.logitsLabel")}
                </text>

                {/* Softmax arrow */}
                {showSoftmax && (
                    <g>
                        <text x={DIAG_W / 2} y={DIAG_H - 4} textAnchor="middle"
                            fill={NN_COLORS.output.hex} fontSize="7" fontFamily="monospace" opacity="0.5">
                            softmax(T={temp.toFixed(1)})
                        </text>
                    </g>
                )}
            </svg>

            {/* Full bars for all 27 chars */}
            <div className="space-y-[3px]">
                {sorted.map((ch) => {
                    const logit = LOGITS[ch] ?? 0;
                    const prob = probs[ch] ?? 0;
                    const isTop = top3.includes(ch);

                    const pct = showSoftmax
                        ? prob * 100 * 3
                        : ((logit - MIN_LOGIT) / RANGE) * 100;

                    return (
                        <div key={ch} className="flex items-center gap-2 h-5">
                            <span className={`w-4 text-right font-mono text-[10px] ${isTop ? "font-bold" : "text-white/30"}`}
                                style={{ color: isTop ? (showSoftmax ? NN_COLORS.output.hex : NN_COLORS.hidden.hex) : undefined }}>
                                {ch === " " ? "␣" : ch}
                            </span>
                            <div className="flex-1 h-3 rounded-full bg-white/[0.03] overflow-hidden">
                                <motion.div
                                    animate={{ width: `${Math.max(1, Math.min(100, pct))}%` }}
                                    transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 25 }}
                                    className="h-full rounded-full"
                                    style={{
                                        background: isTop
                                            ? (showSoftmax ? NN_COLORS.output.hex + "90" : NN_COLORS.hidden.hex + "90")
                                            : (showSoftmax ? NN_COLORS.output.hex + "25" : NN_COLORS.hidden.hex + "25"),
                                    }}
                                />
                            </div>
                            {isTop && (
                                <span className="text-[10px] font-mono w-12 text-right"
                                    style={{ color: showSoftmax ? NN_COLORS.output.hex + "B0" : NN_COLORS.hidden.hex + "B0" }}>
                                    {showSoftmax ? `${(prob * 100).toFixed(0)}%` : logit.toFixed(1)}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Sum indicator */}
            {showSoftmax && (
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                    <span className="text-xs text-white/40">
                        {t("neuralNetworkNarrative.fromNumbers.softmax.sumLabel")}: {" "}
                    </span>
                    <span className="text-xs font-mono font-bold" style={{ color: NN_COLORS.output.hex }}>
                        {Object.values(probs).reduce((a, b) => a + b, 0).toFixed(4)}
                    </span>
                    <span className="text-xs text-white/30 ml-2">
                        ({top3.map((ch) => `${ch === " " ? "␣" : ch}: ${(probs[ch] * 100).toFixed(0)}%`).join(", ")})
                    </span>
                </div>
            )}

            <p className="text-[11px] text-white/25 italic">
                {showSoftmax
                    ? t("neuralNetworkNarrative.fromNumbers.softmax.softmaxHint")
                    : t("neuralNetworkNarrative.fromNumbers.softmax.rawHint")}
            </p>
        </div>
    );
}
