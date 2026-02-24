"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { NN_COLORS } from "./visualizer-theme";

/*
  Shows what happens when the derivative is zero (flat regions):
  - Sigmoid saturation: input far from 0 → derivative ≈ 0 → no learning
  - Loss plateau: weight in a flat region of loss landscape → gradient = 0
  
  Interactive: user picks a point on a sigmoid, sees the derivative (tangent line).
  When in saturation zone, tangent is flat → "stuck, can't learn".
*/

const SVG_W = 320;
const SVG_H = 160;
const PAD = { l: 40, r: 16, t: 16, b: 28 };
const PW = SVG_W - PAD.l - PAD.r;
const PH = SVG_H - PAD.t - PAD.b;

function sigmoid(x: number) { return 1 / (1 + Math.exp(-x)); }
function sigmoidDeriv(x: number) { const s = sigmoid(x); return s * (1 - s); }

export function FlatGradientVisualizer() {
    const { t } = useI18n();
    const [inputVal, setInputVal] = useState(0);

    const output = sigmoid(inputVal);
    const deriv = sigmoidDeriv(inputVal);
    const isFlat = Math.abs(deriv) < 0.05;
    const isHealthy = deriv > 0.15;

    // X range: -6 to 6
    function valToX(v: number) { return PAD.l + ((v + 6) / 12) * PW; }
    function sigToY(s: number) { return PAD.t + (1 - s) * PH; }

    // Generate sigmoid curve
    const sigmoidPath: string[] = [];
    for (let i = 0; i <= 80; i++) {
        const x = -6 + (i / 80) * 12;
        const y = sigmoid(x);
        sigmoidPath.push(`${i === 0 ? "M" : "L"}${valToX(x).toFixed(1)},${sigToY(y).toFixed(1)}`);
    }

    // Tangent line at current point
    const tangentLen = 1.5;
    const tx1 = valToX(inputVal - tangentLen);
    const ty1 = sigToY(output - deriv * tangentLen);
    const tx2 = valToX(inputVal + tangentLen);
    const ty2 = sigToY(output + deriv * tangentLen);

    // Saturation zones
    const satLeftX = valToX(-6);
    const satLeftEnd = valToX(-3);
    const satRightStart = valToX(3);
    const satRightEnd = valToX(6);

    const statusColor = isFlat ? NN_COLORS.error.hex : isHealthy ? NN_COLORS.output.hex : "#eab308";

    return (
        <div className="space-y-4">
            {/* Input slider */}
            <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-white/40 shrink-0">input z</span>
                <input
                    type="range"
                    min={-6} max={6} step={0.1}
                    value={inputVal}
                    onChange={e => setInputVal(+e.target.value)}
                    className="flex-1 accent-indigo-500"
                />
                <span className="text-sm font-mono font-bold w-10 text-right text-white/60">
                    {inputVal.toFixed(1)}
                </span>
            </div>

            {/* SVG */}
            <div className="rounded-xl bg-black/30 border border-white/[0.05] p-2">
                <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full block">
                    {/* Saturation zones */}
                    <rect x={satLeftX} y={PAD.t} width={satLeftEnd - satLeftX} height={PH}
                        fill="rgba(244,63,94,0.06)" />
                    <rect x={satRightStart} y={PAD.t} width={satRightEnd - satRightStart} height={PH}
                        fill="rgba(244,63,94,0.06)" />
                    <text x={(satLeftX + satLeftEnd) / 2} y={PAD.t + 10} textAnchor="middle"
                        fill="rgba(244,63,94,0.3)" fontSize="6" fontFamily="monospace">FLAT</text>
                    <text x={(satRightStart + satRightEnd) / 2} y={PAD.t + 10} textAnchor="middle"
                        fill="rgba(244,63,94,0.3)" fontSize="6" fontFamily="monospace">FLAT</text>

                    {/* Axes */}
                    <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={SVG_H - PAD.b} stroke="rgba(255,255,255,0.08)" />
                    <line x1={PAD.l} y1={SVG_H - PAD.b} x2={SVG_W - PAD.r} y2={SVG_H - PAD.b} stroke="rgba(255,255,255,0.08)" />
                    {/* Zero line */}
                    <line x1={valToX(0)} y1={PAD.t} x2={valToX(0)} y2={SVG_H - PAD.b}
                        stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

                    <text x={SVG_W / 2} y={SVG_H - 4} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="monospace">input z</text>
                    <text x={10} y={SVG_H / 2} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="monospace" transform={`rotate(-90 10 ${SVG_H / 2})`}>σ(z)</text>

                    {/* Y ticks */}
                    {[0, 0.5, 1].map(v => (
                        <g key={v}>
                            <line x1={PAD.l - 3} y1={sigToY(v)} x2={PAD.l} y2={sigToY(v)} stroke="rgba(255,255,255,0.12)" />
                            <text x={PAD.l - 6} y={sigToY(v) + 3} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="7" fontFamily="monospace">{v}</text>
                        </g>
                    ))}

                    {/* Sigmoid curve */}
                    <path d={sigmoidPath.join(" ")} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />

                    {/* Tangent line (the derivative) */}
                    <line
                        x1={tx1} y1={Math.max(PAD.t, Math.min(SVG_H - PAD.b, ty1))}
                        x2={tx2} y2={Math.max(PAD.t, Math.min(SVG_H - PAD.b, ty2))}
                        stroke={statusColor}
                        strokeWidth="2.5"
                        strokeDasharray="6 3"
                        opacity={0.8}
                    />

                    {/* Current point */}
                    <circle cx={valToX(inputVal)} cy={sigToY(output)} r="5"
                        fill={statusColor} stroke="white" strokeWidth="1.5" />
                </svg>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                    <p className="text-[7px] font-mono text-white/25 mb-0.5">σ(z)</p>
                    <p className="text-xs font-mono font-bold text-white/60">{output.toFixed(4)}</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                    <p className="text-[7px] font-mono text-white/25 mb-0.5">σ&apos;(z)</p>
                    <p className="text-xs font-mono font-bold" style={{ color: statusColor }}>{deriv.toFixed(4)}</p>
                </div>
                <div className="rounded-lg border p-2" style={{
                    borderColor: statusColor + "30",
                    background: statusColor + "08",
                }}>
                    <p className="text-[7px] font-mono text-white/25 mb-0.5">status</p>
                    <p className="text-[10px] font-mono font-bold" style={{ color: statusColor }}>
                        {isFlat
                            ? t("neuralNetworkNarrative.flatGradient.stuck")
                            : isHealthy
                                ? t("neuralNetworkNarrative.flatGradient.learning")
                                : t("neuralNetworkNarrative.flatGradient.slow")
                        }
                    </p>
                </div>
            </div>

            {/* Explanation */}
            <motion.div
                key={isFlat ? "flat" : isHealthy ? "ok" : "slow"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border p-3 text-[11px] text-white/40 leading-relaxed"
                style={{
                    borderColor: statusColor + "20",
                    background: statusColor + "05",
                }}
            >
                {isFlat
                    ? t("neuralNetworkNarrative.flatGradient.flatExplain")
                    : isHealthy
                        ? t("neuralNetworkNarrative.flatGradient.healthyExplain")
                        : t("neuralNetworkNarrative.flatGradient.slowExplain")
                }
            </motion.div>
        </div>
    );
}
