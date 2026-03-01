"use client";

import { useMemo } from "react";

import type { TrainingStep } from "./NNTrainingDemo";

/* ─── Layout ─── */
const CW = 300, CH = 260;
const PAD = { t: 28, r: 16, b: 32, l: 40 };
const IW = CW - PAD.l - PAD.r;
const IH = CH - PAD.t - PAD.b;

/* ─── Loss surface parameters ─── */
const W_MIN = -1.5, W_MAX = 3.0;
const B_MIN = -2.0, B_MAX = 1.5;
const GRID = 40;
const INPUT = 1.0;

function sigmoid(x: number) { return 1 / (1 + Math.exp(-x)); }

function lossAt(w: number, b: number, target: number) {
    const yhat = sigmoid(w * INPUT + b);
    return (yhat - target) ** 2;
}

/* ─── Coordinate helpers ─── */
function toX(w: number) { return PAD.l + ((w - W_MIN) / (W_MAX - W_MIN)) * IW; }
function toY(b: number) { return PAD.t + (1 - (b - B_MIN) / (B_MAX - B_MIN)) * IH; }

/* ─── Heatmap cell color from loss value ─── */
function lossColor(loss: number, maxLoss: number): string {
    const t = Math.min(loss / maxLoss, 1);
    const r = Math.round(20 + t * 200);
    const g = Math.round(10 + (1 - t) * 60);
    const b = Math.round(30 + (1 - t) * 80);
    return `rgb(${r},${g},${b})`;
}

interface Props {
    history: TrainingStep[];
    target: number;
}

export function NNLossLandscape({ history, target }: Props) {
    const cellW = IW / GRID;
    const cellH = IH / GRID;

    const { cells, maxLoss } = useMemo(() => {
        const result: { x: number; y: number; loss: number }[] = [];
        let max = 0;
        for (let gi = 0; gi < GRID; gi++) {
            for (let gj = 0; gj < GRID; gj++) {
                const w = W_MIN + (gi / (GRID - 1)) * (W_MAX - W_MIN);
                const b = B_MIN + (gj / (GRID - 1)) * (B_MAX - B_MIN);
                const loss = lossAt(w, b, target);
                if (loss > max) max = loss;
                result.push({ x: PAD.l + gi * cellW, y: PAD.t + (GRID - 1 - gj) * cellH, loss });
            }
        }
        return { cells: result, maxLoss: max };
    }, [target, cellW, cellH]);

    const latest = history[history.length - 1];

    const wTicks = [W_MIN, 0, 1, W_MAX].map(v => ({ v, x: toX(v) }));
    const bTicks = [B_MIN, -1, 0, B_MAX].map(v => ({ v, y: toY(v) }));

    const trajectoryPoints = history
        .map(h => `${toX(h.w)},${toY(h.b)}`)
        .join(" ");

    return (
        <figure className="my-6 -mx-2 sm:mx-0" aria-label="Loss landscape visualizer">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                    <div className="flex gap-1.5" aria-hidden="true">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                        Loss Landscape · w vs b
                    </span>
                </div>

                <div className="p-4 sm:p-5">
                    <svg
                        viewBox={`0 0 ${CW} ${CH}`}
                        className="w-full max-w-sm mx-auto"
                        role="img"
                        aria-label="2D heatmap of loss as a function of weight and bias, with training trajectory"
                    >
                        {/* Heatmap cells */}
                        {cells.map(({ x, y, loss }, i) => (
                            <rect
                                key={i}
                                x={x}
                                y={y}
                                width={cellW + 0.5}
                                height={cellH + 0.5}
                                fill={lossColor(loss, maxLoss)}
                            />
                        ))}

                        {/* Axes */}
                        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + IH}
                            stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                        <line x1={PAD.l} y1={PAD.t + IH} x2={PAD.l + IW} y2={PAD.t + IH}
                            stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

                        {/* W ticks (x-axis) */}
                        {wTicks.map(({ v, x }) => (
                            <g key={v}>
                                <line x1={x} y1={PAD.t + IH} x2={x} y2={PAD.t + IH + 4}
                                    stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                                <text x={x} y={PAD.t + IH + 14} textAnchor="middle" fontSize="8"
                                    fontFamily="ui-monospace,monospace" fill="rgba(255,255,255,0.35)">{v}</text>
                            </g>
                        ))}

                        {/* B ticks (y-axis) */}
                        {bTicks.map(({ v, y }) => (
                            <g key={v}>
                                <line x1={PAD.l - 4} y1={y} x2={PAD.l} y2={y}
                                    stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                                <text x={PAD.l - 6} y={y + 3} textAnchor="end" fontSize="8"
                                    fontFamily="ui-monospace,monospace" fill="rgba(255,255,255,0.35)">{v}</text>
                            </g>
                        ))}

                        {/* Axis labels */}
                        <text x={PAD.l + IW / 2} y={CH - 4} textAnchor="middle" fontSize="9"
                            fontFamily="ui-monospace,monospace" fill="rgba(255,255,255,0.4)">w (weight)</text>
                        <text x={10} y={PAD.t + IH / 2} textAnchor="middle" fontSize="9"
                            fontFamily="ui-monospace,monospace" fill="rgba(255,255,255,0.4)"
                            transform={`rotate(-90,10,${PAD.t + IH / 2})`}>b (bias)</text>

                        {/* Trajectory polyline */}
                        {history.length > 1 && (
                            <polyline
                                points={trajectoryPoints}
                                fill="none"
                                stroke="rgba(255,255,255,0.55)"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                            />
                        )}

                        {/* Start marker */}
                        {history.length > 0 && (
                            <circle
                                cx={toX(history[0].w)}
                                cy={toY(history[0].b)}
                                r="4"
                                fill="rgba(251,191,36,0.85)"
                                stroke="rgba(0,0,0,0.4)"
                                strokeWidth="1"
                                aria-label="Starting parameters"
                            />
                        )}

                        {/* Current parameter marker */}
                        <circle
                            cx={toX(latest.w)}
                            cy={toY(latest.b)}
                            r="5"
                            fill="rgba(244,63,94,0.9)"
                            stroke="rgba(0,0,0,0.4)"
                            strokeWidth="1.5"
                            aria-label={`Current: w=${latest.w.toFixed(3)}, b=${latest.b.toFixed(3)}`}
                        />
                        <circle
                            cx={toX(latest.w)}
                            cy={toY(latest.b)}
                            r="9"
                            fill="none"
                            stroke="rgba(244,63,94,0.3)"
                            strokeWidth="1"
                        />
                    </svg>

                    {/* Legend */}
                    <div className="mt-3 flex items-center justify-center gap-5 text-[10px] font-mono text-white/35">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-amber-400/80 shrink-0" />
                            Start
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-rose-500/90 shrink-0" />
                            Current (step {latest.step})
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block w-5 h-0.5 bg-white/50 shrink-0" />
                            Path
                        </span>
                    </div>

                    {/* Color scale hint */}
                    <div className="mt-2 flex items-center gap-2 justify-center">
                        <span className="text-[9px] font-mono text-white/25">low loss</span>
                        <div className="h-2 w-24 rounded-full"
                            style={{ background: "linear-gradient(to right, rgb(20,70,110), rgb(220,70,50))" }} />
                        <span className="text-[9px] font-mono text-white/25">high loss</span>
                    </div>
                </div>
            </div>
            <figcaption className="mt-3 text-center text-xs text-white/25 italic">
                Each training step moves the red dot toward the dark (low-loss) region. The white path shows the gradient descent trajectory.
            </figcaption>
        </figure>
    );
}
