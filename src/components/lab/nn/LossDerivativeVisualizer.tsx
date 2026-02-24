"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { NN_COLORS } from "./visualizer-theme";

/*
  Interactive visualizer: shows how changing a weight affects the loss.
  User drags a weight slider → sees output change → sees loss change.
  Highlights the chain: Δw → Δoutput → Δloss, showing the derivative
  as "how much does loss change per unit weight change".
  
  Designed for people who have never seen a derivative.
*/

const INPUT = 2;
const TARGET = 0.8;

function sigmoid(z: number) { return 1 / (1 + Math.exp(-z)); }

const SVG_W = 320;
const SVG_H = 140;
const PAD = { l: 44, r: 16, t: 16, b: 28 };
const PW = SVG_W - PAD.l - PAD.r;
const PH = SVG_H - PAD.t - PAD.b;

export function LossDerivativeVisualizer() {
    const { t } = useI18n();
    const [weight, setWeight] = useState(0.5);
    const [showNudge, setShowNudge] = useState(false);

    const DELTA = 0.01;

    const output = sigmoid(weight * INPUT);
    const loss = (output - TARGET) ** 2;

    const outputNudged = sigmoid((weight + DELTA) * INPUT);
    const lossNudged = (outputNudged - TARGET) ** 2;

    const dLossDw = (lossNudged - loss) / DELTA;

    // Generate loss curve over weight range
    const curve = useMemo(() => {
        const pts: { w: number; l: number }[] = [];
        for (let i = 0; i <= 80; i++) {
            const w = -1 + (i / 80) * 3; // range -1 to 2
            const o = sigmoid(w * INPUT);
            pts.push({ w, l: (o - TARGET) ** 2 });
        }
        return pts;
    }, []);

    const maxLoss = Math.max(...curve.map(p => p.l), 0.01);

    function wToX(w: number) { return PAD.l + ((w + 1) / 3) * PW; }
    function lToY(l: number) { return PAD.t + (1 - l / maxLoss) * PH; }

    const pathD = curve.map((p, i) =>
        `${i === 0 ? "M" : "L"}${wToX(p.w).toFixed(1)},${lToY(p.l).toFixed(1)}`
    ).join(" ");

    // Tangent line at current weight
    const tangentLen = 0.4;
    const tx1 = wToX(weight - tangentLen);
    const ty1 = lToY(loss - dLossDw * tangentLen);
    const tx2 = wToX(weight + tangentLen);
    const ty2 = lToY(loss + dLossDw * tangentLen);

    return (
        <div className="space-y-5">
            {/* Weight slider */}
            <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-white/40 shrink-0">weight w</span>
                <input
                    type="range"
                    min={-1} max={2} step={0.01}
                    value={weight}
                    onChange={e => setWeight(+e.target.value)}
                    className="flex-1"
                    style={{ accentColor: NN_COLORS.weight.hex }}
                />
                <span className="text-sm font-mono font-bold w-12 text-right" style={{ color: NN_COLORS.weight.hex }}>
                    {weight.toFixed(2)}
                </span>
            </div>

            {/* Chain visualization: w → output → loss */}
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-[8px] font-mono text-white/25 mb-1">output = σ(w × {INPUT})</p>
                    <p className="text-sm font-mono font-bold" style={{ color: NN_COLORS.output.hex }}>
                        {output.toFixed(4)}
                    </p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-[8px] font-mono text-white/25 mb-1">target</p>
                    <p className="text-sm font-mono font-bold text-emerald-400">
                        {TARGET}
                    </p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-[8px] font-mono text-white/25 mb-1">loss = (out − target)²</p>
                    <p className="text-sm font-mono font-bold" style={{ color: NN_COLORS.error.hex }}>
                        {loss.toFixed(4)}
                    </p>
                </div>
            </div>

            {/* Nudge button */}
            <button
                onClick={() => setShowNudge(!showNudge)}
                className={`w-full px-4 py-2 rounded-lg text-[11px] font-mono font-bold border transition-all ${showNudge
                        ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
                        : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white/80"
                    }`}
            >
                {showNudge
                    ? t("neuralNetworkNarrative.lossDerivative.hideNudge")
                    : t("neuralNetworkNarrative.lossDerivative.showNudge")
                }
            </button>

            {/* Nudge explanation */}
            {showNudge && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="rounded-xl border border-indigo-500/15 bg-indigo-500/[0.03] p-4 space-y-3"
                >
                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div>
                            <p className="text-[8px] font-mono text-white/25 mb-1">w = {weight.toFixed(2)}</p>
                            <p className="text-xs font-mono" style={{ color: NN_COLORS.error.hex }}>loss = {loss.toFixed(6)}</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-mono text-white/25 mb-1">w = {(weight + DELTA).toFixed(3)}</p>
                            <p className="text-xs font-mono" style={{ color: NN_COLORS.error.hex }}>loss = {lossNudged.toFixed(6)}</p>
                        </div>
                    </div>
                    <div className="text-center rounded-lg bg-black/30 p-3">
                        <p className="text-[9px] font-mono text-white/30 mb-1">
                            {t("neuralNetworkNarrative.lossDerivative.changeRatio")}
                        </p>
                        <p className="text-base font-mono font-bold" style={{ color: dLossDw > 0 ? NN_COLORS.error.hex : NN_COLORS.output.hex }}>
                            ∂Loss/∂w ≈ {dLossDw.toFixed(4)}
                        </p>
                        <p className="text-[9px] font-mono text-white/25 mt-1">
                            {dLossDw > 0.01
                                ? t("neuralNetworkNarrative.lossDerivative.positiveSlope")
                                : dLossDw < -0.01
                                    ? t("neuralNetworkNarrative.lossDerivative.negativeSlope")
                                    : t("neuralNetworkNarrative.lossDerivative.zeroSlope")
                            }
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Loss landscape with tangent */}
            <div className="rounded-xl bg-black/30 border border-white/[0.05] p-2">
                <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full block">
                    {/* Grid */}
                    <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={SVG_H - PAD.b} stroke="rgba(255,255,255,0.08)" />
                    <line x1={PAD.l} y1={SVG_H - PAD.b} x2={SVG_W - PAD.r} y2={SVG_H - PAD.b} stroke="rgba(255,255,255,0.08)" />
                    <text x={SVG_W / 2} y={SVG_H - 4} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="monospace">weight w</text>
                    <text x={10} y={SVG_H / 2} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="monospace" transform={`rotate(-90 10 ${SVG_H / 2})`}>loss</text>

                    {/* Loss curve */}
                    <path d={pathD} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

                    {/* Tangent line (the derivative!) */}
                    <line
                        x1={tx1} y1={Math.max(PAD.t, Math.min(SVG_H - PAD.b, ty1))}
                        x2={tx2} y2={Math.max(PAD.t, Math.min(SVG_H - PAD.b, ty2))}
                        stroke={NN_COLORS.weight.hex}
                        strokeWidth="2"
                        strokeDasharray="6 3"
                        opacity={0.7}
                    />

                    {/* Current point */}
                    <circle
                        cx={wToX(weight)}
                        cy={lToY(loss)}
                        r="5"
                        fill={NN_COLORS.error.hex}
                        stroke="white"
                        strokeWidth="1.5"
                    />
                </svg>
            </div>

            {/* Direction indicator — outside SVG to avoid overlap */}
            {Math.abs(dLossDw) > 0.01 && (
                <motion.div
                    key={dLossDw > 0 ? "dec" : "inc"}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 rounded-lg py-2 px-4 border"
                    style={{
                        borderColor: NN_COLORS.output.hex + "30",
                        background: NN_COLORS.output.hex + "08",
                    }}
                >
                    <span className="text-xs font-mono font-bold" style={{ color: NN_COLORS.output.hex }}>
                        {dLossDw > 0
                            ? `← move w LEFT (decrease) to reduce loss`
                            : `move w RIGHT (increase) → to reduce loss`
                        }
                    </span>
                </motion.div>
            )}
            {Math.abs(dLossDw) <= 0.01 && (
                <div className="flex items-center justify-center rounded-lg py-2 px-4 border border-emerald-500/20 bg-emerald-500/[0.04]">
                    <span className="text-xs font-mono font-bold text-emerald-400">✓ at the minimum — no update needed</span>
                </div>
            )}

            {/* Key insight */}
            <p className="text-[11px] text-white/35 text-center italic leading-relaxed">
                {t("neuralNetworkNarrative.lossDerivative.insight")}
            </p>
        </div>
    );
}
