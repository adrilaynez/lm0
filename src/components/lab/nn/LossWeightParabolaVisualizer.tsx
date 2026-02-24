"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { NN_COLORS } from "./visualizer-theme";

/*
  Interactive loss-weight parabola:
  - SVG: x=weight value, y=loss. Smooth parabola centered at optimal weight.
  - DRAGGABLE point on curve with tangent line showing slope.
  - Arrow pointing downhill.
  - "Watch gradient descent" button animates point rolling down.
  - Labels: slope positive → move left, slope negative → move right.
*/

// Parabola: loss = (w - optimal)^2 * scale
const OPTIMAL_W = 3;
const SCALE = 1;
const W_MIN = -2;
const W_MAX = 8;
const LOSS_MAX = 30;

// SVG layout
const SVG_W = 400;
const SVG_H = 200;
const PAD_L = 40;
const PAD_R = 10;
const PAD_T = 15;
const PAD_B = 30;
const PLOT_W = SVG_W - PAD_L - PAD_R;
const PLOT_H = SVG_H - PAD_T - PAD_B;

function wToX(w: number) {
    return PAD_L + ((w - W_MIN) / (W_MAX - W_MIN)) * PLOT_W;
}
function lossToY(loss: number) {
    return PAD_T + (1 - Math.min(loss, LOSS_MAX) / LOSS_MAX) * PLOT_H;
}
function xToW(x: number) {
    return W_MIN + ((x - PAD_L) / PLOT_W) * (W_MAX - W_MIN);
}
function lossAt(w: number) {
    return SCALE * (w - OPTIMAL_W) ** 2;
}
function slopeAt(w: number) {
    return 2 * SCALE * (w - OPTIMAL_W);
}

// Generate parabola path
function parabolaPath() {
    const points: string[] = [];
    for (let i = 0; i <= 80; i++) {
        const w = W_MIN + (i / 80) * (W_MAX - W_MIN);
        const x = wToX(w);
        const y = lossToY(lossAt(w));
        points.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return points.join(" ");
}

const GD_LR = 0.15;
const GD_STEPS = 25;

export function LossWeightParabolaVisualizer() {
    const { t } = useI18n();
    const shouldReduceMotion = useReducedMotion();
    const svgRef = useRef<SVGSVGElement>(null);
    const [weight, setWeight] = useState(7);
    const [dragging, setDragging] = useState(false);
    const [animating, setAnimating] = useState(false);
    const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const loss = lossAt(weight);
    const slope = slopeAt(weight);
    const px = wToX(weight);
    const py = lossToY(loss);

    // Tangent line endpoints
    const tangentLen = 1.2;
    const t1w = weight - tangentLen;
    const t2w = weight + tangentLen;
    const t1loss = loss + slope * (t1w - weight);
    const t2loss = loss + slope * (t2w - weight);

    // Arrow direction (downhill = opposite of gradient)
    const arrowDir = slope > 0.1 ? "left" : slope < -0.1 ? "right" : "none";

    // Drag handler
    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragging || animating) return;
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const svgX = (clientX / rect.width) * SVG_W;
        const w = Math.max(W_MIN, Math.min(W_MAX, xToW(svgX)));
        setWeight(+w.toFixed(2));
    }, [dragging, animating]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (animating) return;
        setDragging(true);
        (e.target as Element).setPointerCapture?.(e.pointerId);
    }, [animating]);

    const handlePointerUp = useCallback(() => {
        setDragging(false);
    }, []);

    // Gradient descent animation
    const runGD = useCallback(() => {
        if (animating) return;
        setAnimating(true);
        let w = weight;
        let step = 0;
        const tick = () => {
            const grad = slopeAt(w);
            w = +(w - GD_LR * grad).toFixed(3);
            w = Math.max(W_MIN, Math.min(W_MAX, w));
            setWeight(w);
            step++;
            if (step < GD_STEPS && Math.abs(w - OPTIMAL_W) > 0.02) {
                animRef.current = setTimeout(tick, shouldReduceMotion ? 0 : 80);
            } else {
                setAnimating(false);
            }
        };
        animRef.current = setTimeout(tick, shouldReduceMotion ? 0 : 80);
    }, [weight, animating, shouldReduceMotion]);

    useEffect(() => () => { if (animRef.current) clearTimeout(animRef.current); }, []);

    const slopeLabel = slope > 0.1
        ? t("neuralNetworkNarrative.howItLearns.parabola.slopePositive")
        : slope < -0.1
            ? t("neuralNetworkNarrative.howItLearns.parabola.slopeNegative")
            : t("neuralNetworkNarrative.howItLearns.parabola.slopeZero");

    return (
        <div className="p-5 sm:p-6 space-y-5 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-purple-950/20 via-black/40 to-pink-950/10 shadow-[0_0_80px_-20px_rgba(168,85,247,0.15)]">
            {/* SVG parabola */}
            <div className="rounded-xl bg-gradient-to-br from-black/40 to-black/20 border border-white/[0.08] p-4">
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                    className="w-full select-none touch-none"
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                >
                    {/* Axes */}
                    <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={SVG_H - PAD_B} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <line x1={PAD_L} y1={SVG_H - PAD_B} x2={SVG_W - PAD_R} y2={SVG_H - PAD_B} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                    {/* Axis labels */}
                    <text x={SVG_W / 2} y={SVG_H - 4} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace">weight</text>
                    <text x={12} y={SVG_H / 2} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace" transform={`rotate(-90 12 ${SVG_H / 2})`}>loss</text>

                    {/* Optimal line */}
                    <line
                        x1={wToX(OPTIMAL_W)} y1={PAD_T} x2={wToX(OPTIMAL_W)} y2={SVG_H - PAD_B}
                        stroke={NN_COLORS.output.hex} strokeWidth="1" strokeDasharray="4 4" opacity="0.3"
                    />
                    <text x={wToX(OPTIMAL_W)} y={SVG_H - PAD_B + 14} textAnchor="middle" fill={NN_COLORS.output.hex} fontSize="8" fontFamily="monospace" opacity="0.6">optimal</text>

                    {/* Parabola curve */}
                    <path d={parabolaPath()} fill="none" stroke={NN_COLORS.error.hex} strokeWidth="2" opacity="0.7" />

                    {/* Gradient fill below curve */}
                    <path
                        d={parabolaPath() + ` L${wToX(W_MAX)},${lossToY(0)} L${wToX(W_MIN)},${lossToY(0)} Z`}
                        fill={NN_COLORS.error.hex}
                        opacity="0.04"
                    />

                    {/* Tangent line */}
                    <line
                        x1={wToX(t1w)} y1={lossToY(Math.max(0, t1loss))}
                        x2={wToX(t2w)} y2={lossToY(Math.max(0, t2loss))}
                        stroke={NN_COLORS.hidden.hex} strokeWidth="1.5" opacity="0.6"
                    />

                    {/* Direction arrow - larger and more prominent */}
                    {arrowDir !== "none" && (
                        <g>
                            <motion.line
                                x1={px}
                                y1={py - 22}
                                x2={arrowDir === "left" ? px - 24 : px + 24}
                                y2={py - 22}
                                stroke={NN_COLORS.output.hex}
                                strokeWidth="2.5"
                                markerEnd="url(#arrowhead)"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                            />
                            {/* Arrow glow effect */}
                            <motion.line
                                x1={px}
                                y1={py - 22}
                                x2={arrowDir === "left" ? px - 24 : px + 24}
                                y2={py - 22}
                                stroke={NN_COLORS.output.hex}
                                strokeWidth="7"
                                opacity="0.2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.2 }}
                            />
                        </g>
                    )}

                    {/* Arrow marker def - larger */}
                    <defs>
                        <marker
                            id="arrowhead"
                            markerUnits="userSpaceOnUse"
                            markerWidth="10"
                            markerHeight="8"
                            refX="10"
                            refY="4"
                            orient="auto"
                        >
                            <polygon points="0 0, 10 4, 0 8" fill={NN_COLORS.output.hex} />
                        </marker>
                    </defs>

                    {/* Draggable point with enhanced glow */}
                    <circle
                        cx={px} cy={py} r={dragging ? 10 : 8}
                        fill={NN_COLORS.weight.hex}
                        stroke="white" strokeWidth="2.5"
                        style={{
                            cursor: animating ? "not-allowed" : "grab",
                            filter: dragging ? `drop-shadow(0 0 12px ${NN_COLORS.weight.hex})` : `drop-shadow(0 0 6px ${NN_COLORS.weight.hex})`
                        }}
                        onPointerDown={handlePointerDown}
                    />

                    {/* Value labels near point */}
                    <text x={px} y={py - 42} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9" fontWeight="bold" fontFamily="monospace">
                        w={weight.toFixed(1)}
                    </text>
                </svg>
            </div>

            {/* Info cards with gradients */}
            <div className="grid grid-cols-3 gap-3">
                <motion.div
                    key={`w-${weight}`}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="rounded-xl bg-gradient-to-br from-rose-500/[0.12] to-rose-500/[0.04] border border-rose-500/25 p-3 text-center backdrop-blur-sm shadow-[0_0_20px_-8px_rgba(244,63,94,0.2)]"
                >
                    <p className="text-[9px] font-mono text-rose-300/50 uppercase tracking-wider mb-1">{t("neuralNetworkNarrative.howItLearns.parabola.weightLabel")}</p>
                    <motion.p
                        key={weight}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xl font-mono font-bold"
                        style={{ color: NN_COLORS.weight.hex }}
                    >
                        {weight.toFixed(2)}
                    </motion.p>
                </motion.div>
                <motion.div
                    key={`loss-${loss}`}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className={`rounded-xl bg-gradient-to-br p-3 text-center backdrop-blur-sm border transition-all ${loss < 1
                        ? "from-emerald-500/[0.15] to-emerald-500/[0.05] border-emerald-500/30 shadow-[0_0_24px_-6px_rgba(52,211,153,0.35)]"
                        : "from-red-500/[0.12] to-red-500/[0.04] border-red-500/25 shadow-[0_0_20px_-8px_rgba(239,68,68,0.25)]"
                        }`}
                >
                    <p className="text-[9px] font-mono text-white/40 uppercase tracking-wider mb-1">{t("neuralNetworkNarrative.howItLearns.parabola.lossLabel")}</p>
                    <motion.p
                        key={loss}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xl font-mono font-bold"
                        style={{ color: loss < 1 ? NN_COLORS.output.hex : NN_COLORS.error.hex }}
                    >
                        {loss.toFixed(2)}
                    </motion.p>
                </motion.div>
                <motion.div
                    key={`slope-${slope}`}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="rounded-xl bg-gradient-to-br from-violet-500/[0.12] to-violet-500/[0.04] border border-violet-500/25 p-3 text-center backdrop-blur-sm shadow-[0_0_20px_-8px_rgba(139,92,246,0.2)]"
                >
                    <p className="text-[9px] font-mono text-violet-300/50 uppercase tracking-wider mb-1">{t("neuralNetworkNarrative.howItLearns.parabola.slopeLabel")}</p>
                    <motion.p
                        key={slope}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xl font-mono font-bold"
                        style={{ color: NN_COLORS.hidden.hex }}
                    >
                        {slope > 0 ? "+" : ""}{slope.toFixed(2)}
                    </motion.p>
                </motion.div>
            </div>

            {/* Slope direction label - more prominent */}
            <motion.div
                key={slopeLabel}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl bg-gradient-to-r from-indigo-500/15 via-indigo-500/10 to-indigo-500/15 border border-indigo-500/30 px-4 py-3 text-center backdrop-blur-sm shadow-[0_0_25px_-10px_rgba(99,102,241,0.3)]"
            >
                <p className="text-sm font-mono font-bold" style={{ color: NN_COLORS.hidden.hex }}>
                    {arrowDir === "left" && "← "}
                    {slopeLabel}
                    {arrowDir === "right" && " →"}
                </p>
            </motion.div>

            {/* Gradient descent button */}
            <button
                onClick={runGD}
                disabled={animating || Math.abs(weight - OPTIMAL_W) < 0.1}
                className="w-full rounded-lg py-3 text-sm font-bold font-mono transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:from-emerald-500/30 hover:to-emerald-500/15 hover:shadow-[0_0_25px_-8px_rgba(52,211,153,0.4)]"
            >
                {animating ? (
                    <span className="flex items-center justify-center gap-2">
                        <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                            ⟳
                        </motion.span>
                        {t("neuralNetworkNarrative.howItLearns.parabola.running")}
                    </span>
                ) : (
                    `▶ ${t("neuralNetworkNarrative.howItLearns.parabola.watchGD")}`
                )}
            </button>

            <p className="text-[11px] text-white/30 text-center italic">
                {t("neuralNetworkNarrative.howItLearns.parabola.dragHint")}
            </p>
        </div>
    );
}
