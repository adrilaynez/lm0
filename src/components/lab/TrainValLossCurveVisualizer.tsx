"use client";

import { useMemo,useState } from "react";

import { useI18n } from "@/i18n/context";

const W = 440;
const H = 200;
const PAD = { left: 44, right: 20, top: 20, bottom: 32 };
const CW = W - PAD.left - PAD.right;
const CH = H - PAD.top - PAD.bottom;
const MAX_EPOCHS = 500;
const Y_MAX = 2.6;
const Y_MIN = 0;
const OPTIMAL_EPOCH = 80;
const GRID_Y = [0.5, 1.0, 1.5, 2.0, 2.5];
const GRID_X = [0, 100, 200, 300, 400, 500];

const trainLoss = (e: number) => 2.5 * Math.exp(-0.012 * e) + 0.05;
const valLoss = (e: number) => {
    const base = 2.5 * Math.exp(-0.015 * e) + 0.3;
    const penalty = Math.max(0, 0.0008 * Math.pow(e - OPTIMAL_EPOCH, 2));
    return base + penalty;
};

function toSvgX(e: number) { return PAD.left + (e / MAX_EPOCHS) * CW; }
function toSvgY(loss: number) { return PAD.top + CH - ((loss - Y_MIN) / (Y_MAX - Y_MIN)) * CH; }

function buildPath(fn: (e: number) => number, upTo: number, total: number, dimAfter?: number): [string, string] {
    const active: string[] = [], dim: string[] = [];
    for (let i = 0; i <= total; i++) {
        const x = toSvgX(i).toFixed(1);
        const y = toSvgY(fn(i)).toFixed(1);
        const cmd = `${i === 0 ? "M" : "L"}${x},${y}`;
        if (i <= upTo) active.push(cmd);
        else if (dimAfter !== undefined) dim.push(cmd === `M${x},${y}` ? cmd : cmd);
    }
    // dim path starts from upTo
    if (dimAfter !== undefined && upTo < total) {
        const sx = toSvgX(upTo).toFixed(1);
        const sy = toSvgY(fn(upTo)).toFixed(1);
        dim.unshift(`M${sx},${sy}`);
    }
    return [active.join(" "), dim.join(" ")];
}

export function TrainValLossCurveVisualizer() {
    const { t } = useI18n();
    const [epoch, setEpoch] = useState(150);

    const status = useMemo(() => {
        if (epoch < 70) return { key: "statusUnderfitting", color: "rgb(96,165,250)" };
        if (epoch <= 90) return { key: "statusOptimal", color: "rgb(52,211,153)" };
        return { key: "statusOverfitting", color: "rgb(244,63,94)" };
    }, [epoch]);

    const [trainActive, trainDim] = buildPath(trainLoss, epoch, MAX_EPOCHS, 1);
    const [valActive, valDim] = buildPath(valLoss, epoch, MAX_EPOCHS, 1);

    const optX = toSvgX(OPTIMAL_EPOCH);
    const curX = toSvgX(epoch);
    const overfitX = toSvgX(OPTIMAL_EPOCH);

    const curTrainLoss = trainLoss(epoch).toFixed(3);
    const curValLoss = valLoss(epoch).toFixed(3);

    return (
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-3">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
                {/* Overfitting zone */}
                {epoch > OPTIMAL_EPOCH && (
                    <rect
                        x={overfitX} y={PAD.top}
                        width={Math.max(0, curX - overfitX)} height={CH}
                        fill="rgba(244,63,94,0.06)"
                    />
                )}
                <rect x={overfitX} y={PAD.top} width={CW - (overfitX - PAD.left)} height={CH}
                    fill="rgba(244,63,94,0.03)" />

                {/* Grid Y */}
                {GRID_Y.map(y => (
                    <g key={y}>
                        <line x1={PAD.left} y1={toSvgY(y)} x2={W - PAD.right} y2={toSvgY(y)}
                            stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="3,3" />
                        <text x={PAD.left - 4} y={toSvgY(y) + 3.5} textAnchor="end"
                            fill="rgba(255,255,255,0.2)" fontSize={8} fontFamily="monospace">{y.toFixed(1)}</text>
                    </g>
                ))}

                {/* Grid X */}
                {GRID_X.map(x => (
                    <g key={x}>
                        <line x1={toSvgX(x)} y1={PAD.top} x2={toSvgX(x)} y2={PAD.top + CH}
                            stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="3,3" />
                        <text x={toSvgX(x)} y={PAD.top + CH + 12} textAnchor="middle"
                            fill="rgba(255,255,255,0.2)" fontSize={8} fontFamily="monospace">{x}</text>
                    </g>
                ))}

                {/* Axes */}
                <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + CH}
                    stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
                <line x1={PAD.left} y1={PAD.top + CH} x2={W - PAD.right} y2={PAD.top + CH}
                    stroke="rgba(255,255,255,0.12)" strokeWidth={1} />

                {/* Axis labels */}
                <text x={PAD.left + CW / 2} y={H - 2} textAnchor="middle"
                    fill="rgba(255,255,255,0.2)" fontSize={8} fontFamily="monospace">Training Epochs</text>
                <text x={9} y={PAD.top + CH / 2} textAnchor="middle"
                    fill="rgba(255,255,255,0.2)" fontSize={8} fontFamily="monospace"
                    transform={`rotate(-90,9,${PAD.top + CH / 2})`}>Loss</text>

                {/* Dim (future) curves */}
                <path d={trainDim} fill="none" stroke="rgb(244,63,94)" strokeWidth={1} opacity={0.15} strokeLinejoin="round" />
                <path d={valDim} fill="none" stroke="rgb(52,211,153)" strokeWidth={1} opacity={0.15} strokeLinejoin="round" />

                {/* Active curves */}
                <path d={trainActive} fill="none" stroke="rgb(244,63,94)" strokeWidth={2} strokeLinejoin="round" />
                <path d={valActive} fill="none" stroke="rgb(52,211,153)" strokeWidth={2} strokeLinejoin="round" />

                {/* Optimal epoch line */}
                <line x1={optX} y1={PAD.top} x2={optX} y2={PAD.top + CH}
                    stroke="rgb(250,204,21)" strokeWidth={1} strokeDasharray="4,2" opacity={0.7} />
                <text x={optX + 3} y={PAD.top + 10} fill="rgb(250,204,21)" fontSize={7.5} fontFamily="monospace" opacity={0.8}>
                    Stop here
                </text>

                {/* Current epoch line */}
                {epoch !== OPTIMAL_EPOCH && (
                    <line x1={curX} y1={PAD.top} x2={curX} y2={PAD.top + CH}
                        stroke="rgba(255,255,255,0.25)" strokeWidth={1} strokeDasharray="2,2" />
                )}

                {/* "Val loss rising" annotation */}
                {epoch > 120 && (
                    <text x={toSvgX(Math.min(epoch, MAX_EPOCHS) * 0.75)} y={PAD.top + 22}
                        fill="rgba(244,63,94,0.5)" fontSize={7.5} fontFamily="monospace">Val loss rising ↑</text>
                )}
            </svg>

            {/* Slider */}
            <div className="px-1 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-white/30">
                    <span>Epoch: <span className="text-white/60">{epoch}</span></span>
                    <span style={{ color: status.color }} className="font-semibold text-[10px]">
                        {t(`neuralNetworkNarrative.overfitting.${status.key}`)}
                    </span>
                </div>
                <input type="range" min={10} max={500} step={1} value={epoch}
                    onChange={e => setEpoch(+e.target.value)}
                    className="w-full accent-rose-500"
                    aria-label="Training epoch selector" />
                <div className="flex justify-between text-[9px] font-mono text-white/20">
                    {[10, 100, 200, 300, 400, 500].map(v => <span key={v}>{v}</span>)}
                </div>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                    { label: "Train Loss", value: curTrainLoss, color: "rgb(244,63,94)" },
                    { label: "Val Loss",   value: curValLoss,   color: "rgb(52,211,153)" },
                    { label: "Status",     value: t(`neuralNetworkNarrative.overfitting.${status.key}`), color: status.color },
                ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-center">
                        <p className="text-[9px] font-mono text-white/25 uppercase tracking-wider mb-0.5">{label}</p>
                        <p className="text-[12px] font-mono font-semibold" style={{ color }}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-5 pt-1">
                {[
                    { color: "rgb(244,63,94)", label: "Training loss" },
                    { color: "rgb(52,211,153)", label: "Validation loss" },
                    { color: "rgb(250,204,21)", label: "Optimal stop" },
                ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                        <span className="text-[10px] font-mono text-white/35">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
