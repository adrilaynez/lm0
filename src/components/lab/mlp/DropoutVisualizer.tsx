"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { motion } from "framer-motion";
import { Pause, Play, RotateCcw } from "lucide-react";

/*
  DropoutVisualizer v2
  Network diagram + simulated loss curves comparing dropout ON vs OFF.
  Shows neuron usage heatmap across steps, gap visualization, auto-step mode.
*/

const INPUT_N = 3;
const HIDDEN_N = 8;
const OUTPUT_N = 4;
const DROPOUT_RATE = 0.3;

const NW = 360, NH = 160;
const layerX = [45, 180, 315];
const inputY = (i: number) => 35 + i * ((NH - 70) / (INPUT_N - 1));
const hiddenY = (i: number) => 18 + i * ((NH - 36) / (HIDDEN_N - 1));
const outputY = (i: number) => 45 + i * ((NH - 90) / (OUTPUT_N - 1));

function getY(layer: number, idx: number): number {
    if (layer === 0) return inputY(idx);
    if (layer === 1) return hiddenY(idx);
    return outputY(idx);
}

function randomDroppedSet(): Set<number> {
    const dropped = new Set<number>();
    const count = Math.round(HIDDEN_N * DROPOUT_RATE);
    while (dropped.size < count) dropped.add(Math.floor(Math.random() * HIDDEN_N));
    return dropped;
}

// Simulated loss curves: dropout=ON has better val loss, dropout=OFF overfits
const SIM_STEPS = 20;
function simLoss(step: number, base: number, noiseScale: number): number {
    const t = step / SIM_STEPS;
    return base * Math.exp(-2.5 * t) + 0.5 + (Math.sin(step * 1.3) * noiseScale * 0.02);
}
const SIM_TRAIN_DROPOUT = Array.from({ length: SIM_STEPS + 1 }, (_, i) => simLoss(i, 2.8, 1));
const SIM_VAL_DROPOUT = Array.from({ length: SIM_STEPS + 1 }, (_, i) => simLoss(i, 2.8, 1) + 0.08 + i * 0.001);
const SIM_TRAIN_NO_DROP = Array.from({ length: SIM_STEPS + 1 }, (_, i) => simLoss(i, 2.8, 0.5) - i * 0.005);
const SIM_VAL_NO_DROP = Array.from({ length: SIM_STEPS + 1 }, (_, i) => simLoss(i, 2.8, 0.5) + 0.05 + i * 0.025);

export function DropoutVisualizer() {
    const [dropoutOn, setDropoutOn] = useState(true);
    const [step, setStep] = useState(0);
    const [dropped, setDropped] = useState<Set<number>>(() => randomDroppedSet());
    const [usageCounts, setUsageCounts] = useState<number[]>(Array(HIDDEN_N).fill(0));
    const [autoPlay, setAutoPlay] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const advance = useCallback(() => {
        const newDropped = dropoutOn ? randomDroppedSet() : new Set<number>();
        setDropped(newDropped);
        setStep(s => Math.min(s + 1, SIM_STEPS));
        if (dropoutOn) {
            setUsageCounts(prev => prev.map((c, i) => c + (newDropped.has(i) ? 0 : 1)));
        } else {
            setUsageCounts(prev => prev.map(c => c + 1));
        }
    }, [dropoutOn]);

    const reset = useCallback(() => {
        setStep(0);
        setDropped(dropoutOn ? randomDroppedSet() : new Set());
        setUsageCounts(Array(HIDDEN_N).fill(0));
        setAutoPlay(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
    }, [dropoutOn]);

    useEffect(() => {
        if (autoPlay && step < SIM_STEPS) {
            intervalRef.current = setInterval(advance, 1200);
            return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
        } else if (step >= SIM_STEPS) {
            setAutoPlay(false);
        }
    }, [autoPlay, step, advance]);

    const activeColor = "#a78bfa";

    // Loss chart — show curves up to current step
    const trainCurve = dropoutOn ? SIM_TRAIN_DROPOUT : SIM_TRAIN_NO_DROP;
    const valCurve = dropoutOn ? SIM_VAL_DROPOUT : SIM_VAL_NO_DROP;
    const CW = 300, CH = 100, cPadL = 30, cPadR = 8, cPadT = 8, cPadB = 16;

    const { lMin, lMax } = useMemo(() => {
        const all = [...trainCurve, ...valCurve];
        return { lMin: Math.min(...all) * 0.95, lMax: Math.max(...all) * 1.02 };
    }, [trainCurve, valCurve]);

    const lToX = (i: number) => cPadL + (i / SIM_STEPS) * (CW - cPadL - cPadR);
    const lToY = (v: number) => cPadT + ((lMax - v) / (lMax - lMin)) * (CH - cPadT - cPadB);

    const trainPath = trainCurve.slice(0, step + 1).map((v, i) => `${lToX(i).toFixed(1)},${lToY(v).toFixed(1)}`).join(" ");
    const valPath = valCurve.slice(0, step + 1).map((v, i) => `${lToX(i).toFixed(1)},${lToY(v).toFixed(1)}`).join(" ");

    // Neuron usage heatmap — how evenly are neurons used
    const maxUsage = Math.max(...usageCounts, 1);
    const usageVariance = useMemo(() => {
        if (step < 2) return 0;
        const mean = usageCounts.reduce((a, b) => a + b, 0) / HIDDEN_N;
        return Math.sqrt(usageCounts.reduce((s, c) => s + (c - mean) ** 2, 0) / HIDDEN_N);
    }, [usageCounts, step]);

    const finalGap = step > 0 ? Math.abs(valCurve[step] - trainCurve[step]) : 0;

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setDropoutOn(!dropoutOn); reset(); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold border transition-all"
                        style={{
                            backgroundColor: dropoutOn ? "#a78bfa15" : "#ef444415",
                            borderColor: dropoutOn ? "#a78bfa30" : "#ef444430",
                            color: dropoutOn ? "#a78bfa" : "#ef4444",
                        }}
                    >
                        Dropout: {dropoutOn ? "ON (30%)" : "OFF"}
                    </button>
                    <button onClick={() => step < SIM_STEPS ? (autoPlay ? setAutoPlay(false) : setAutoPlay(true)) : null}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-mono font-bold border transition-colors bg-violet-500/10 border-violet-500/20 text-violet-300 hover:bg-violet-500/20">
                        {autoPlay ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> {step === 0 ? "Run Training" : "Continue"}</>}
                    </button>
                    {!autoPlay && step < SIM_STEPS && (
                        <button onClick={advance}
                            className="px-2 py-1.5 rounded-lg text-[8px] font-mono text-white/25 hover:text-white/40 border border-white/[0.06] transition-colors">
                            +1 Step
                        </button>
                    )}
                    {step > 0 && (
                        <button onClick={reset} className="p-1.5 rounded-lg text-white/20 hover:text-white/40 transition-colors">
                            <RotateCcw className="w-3 h-3" />
                        </button>
                    )}
                </div>
                <span className="text-[9px] font-mono text-white/20">Step {step}/{SIM_STEPS}</span>
            </div>

            {/* Network diagram */}
            <div className="rounded-xl border border-white/[0.06] bg-gradient-to-b from-black/40 to-black/20 overflow-hidden">
                <svg viewBox={`0 0 ${NW} ${NH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                    {/* Connections: input → hidden */}
                    {Array.from({ length: INPUT_N }).map((_, i) =>
                        Array.from({ length: HIDDEN_N }).map((_, j) => {
                            const isDropped = dropoutOn && dropped.has(j);
                            return (
                                <line key={`ih-${i}-${j}`}
                                    x1={layerX[0] + 10} y1={getY(0, i)} x2={layerX[1] - 10} y2={getY(1, j)}
                                    stroke={isDropped ? "#ffffff" : activeColor}
                                    strokeOpacity={isDropped ? 0.02 : 0.1} strokeWidth={0.6} />
                            );
                        })
                    )}
                    {/* Connections: hidden → output */}
                    {Array.from({ length: HIDDEN_N }).map((_, i) =>
                        Array.from({ length: OUTPUT_N }).map((_, j) => {
                            const isDropped = dropoutOn && dropped.has(i);
                            return (
                                <line key={`ho-${i}-${j}`}
                                    x1={layerX[1] + 10} y1={getY(1, i)} x2={layerX[2] - 10} y2={getY(2, j)}
                                    stroke={isDropped ? "#ffffff" : activeColor}
                                    strokeOpacity={isDropped ? 0.02 : 0.1} strokeWidth={0.6} />
                            );
                        })
                    )}
                    {/* Input neurons */}
                    {Array.from({ length: INPUT_N }).map((_, i) => (
                        <circle key={`in-${i}`} cx={layerX[0]} cy={getY(0, i)} r={8}
                            fill={activeColor} fillOpacity={0.15} stroke={activeColor} strokeOpacity={0.3} strokeWidth={1} />
                    ))}
                    {/* Hidden neurons with usage-based opacity */}
                    {Array.from({ length: HIDDEN_N }).map((_, i) => {
                        const isDropped = dropoutOn && dropped.has(i);
                        const usageRatio = step > 0 ? usageCounts[i] / maxUsage : 1;
                        return (
                            <motion.circle key={`hid-${i}`}
                                cx={layerX[1]} cy={getY(1, i)} r={8}
                                animate={{
                                    fill: isDropped ? "#333333" : activeColor,
                                    fillOpacity: isDropped ? 0.08 : 0.15 + usageRatio * 0.2,
                                    stroke: isDropped ? "#555555" : activeColor,
                                    strokeOpacity: isDropped ? 0.1 : 0.3 + usageRatio * 0.2,
                                }}
                                strokeWidth={1.5} transition={{ duration: 0.5 }} />
                        );
                    })}
                    {/* X marks */}
                    {dropoutOn && Array.from(dropped).map(i => (
                        <motion.g key={`x-${i}`} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
                            <line x1={layerX[1] - 4} y1={getY(1, i) - 4} x2={layerX[1] + 4} y2={getY(1, i) + 4} stroke="#ef4444" strokeOpacity={0.6} strokeWidth={1.5} />
                            <line x1={layerX[1] + 4} y1={getY(1, i) - 4} x2={layerX[1] - 4} y2={getY(1, i) + 4} stroke="#ef4444" strokeOpacity={0.6} strokeWidth={1.5} />
                        </motion.g>
                    ))}
                    {/* Output neurons */}
                    {Array.from({ length: OUTPUT_N }).map((_, i) => (
                        <circle key={`out-${i}`} cx={layerX[2]} cy={getY(2, i)} r={8}
                            fill={activeColor} fillOpacity={0.15} stroke={activeColor} strokeOpacity={0.3} strokeWidth={1} />
                    ))}
                    {/* Labels */}
                    <text x={layerX[0]} y={NH - 2} textAnchor="middle" fontSize={7} fill="white" fillOpacity={0.2} fontFamily="monospace">Input</text>
                    <text x={layerX[1]} y={NH - 2} textAnchor="middle" fontSize={7} fill="white" fillOpacity={0.2} fontFamily="monospace">Hidden ({HIDDEN_N})</text>
                    <text x={layerX[2]} y={NH - 2} textAnchor="middle" fontSize={7} fill="white" fillOpacity={0.2} fontFamily="monospace">Output</text>
                </svg>
            </div>

            {/* Neuron usage heatmap */}
            {step > 2 && (
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[8px] font-mono text-white/20">Neuron usage across {step} steps</span>
                        <span className="text-[8px] font-mono text-white/15">
                            Variance: <span className={usageVariance < 1 ? "text-emerald-400/60" : "text-amber-400/60"}>{usageVariance.toFixed(1)}</span>
                            {dropoutOn && usageVariance < 1.5 && <span className="text-emerald-400/40 ml-1">· Even spread ✓</span>}
                            {!dropoutOn && <span className="text-amber-400/40 ml-1">· All neurons identical</span>}
                        </span>
                    </div>
                    <div className="flex gap-1">
                        {usageCounts.map((count, i) => {
                            const pct = step > 0 ? count / step : 0;
                            return (
                                <div key={i} className="flex-1 space-y-0.5">
                                    <div className="h-8 rounded-sm relative overflow-hidden bg-white/[0.03]">
                                        <motion.div
                                            className="absolute bottom-0 left-0 right-0 rounded-sm"
                                            style={{ backgroundColor: dropoutOn ? activeColor : "#ef4444" }}
                                            animate={{ height: `${pct * 100}%`, opacity: 0.3 + pct * 0.4 }}
                                            transition={{ duration: 0.6 }}
                                        />
                                    </div>
                                    <div className="text-[6px] font-mono text-white/15 text-center">N{i}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Loss curves comparison */}
            {step > 1 && (
                <div className="rounded-xl border border-white/[0.06] bg-black/30 p-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[8px] font-mono text-white/25 font-bold uppercase tracking-wider">
                            Simulated Loss — Dropout {dropoutOn ? "ON" : "OFF"}
                        </span>
                        <span className="text-[8px] font-mono text-white/15">
                            Gap: <span className={finalGap > 0.2 ? "text-rose-400/70" : "text-emerald-400/70"}>{finalGap.toFixed(3)}</span>
                        </span>
                    </div>
                    <svg viewBox={`0 0 ${CW} ${CH}`} className="w-full" style={{ maxHeight: 120 }}>
                        {/* Grid */}
                        {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0].filter(v => v >= lMin && v <= lMax).map(v => (
                            <g key={v}>
                                <line x1={cPadL} y1={lToY(v)} x2={CW - cPadR} y2={lToY(v)} stroke="rgba(255,255,255,0.04)" />
                                <text x={cPadL - 4} y={lToY(v) + 3} textAnchor="end" fill="rgba(255,255,255,0.12)" fontSize={6} fontFamily="monospace">{v.toFixed(1)}</text>
                            </g>
                        ))}
                        {/* Gap fill */}
                        {step > 2 && (() => {
                            const tPts = trainCurve.slice(0, step + 1).map((v, i) => `${lToX(i).toFixed(1)},${lToY(v).toFixed(1)}`);
                            const vPts = valCurve.slice(0, step + 1).map((v, i) => `${lToX(i).toFixed(1)},${lToY(v).toFixed(1)}`).reverse();
                            return <path d={`M${tPts.join(" L")} L${vPts.join(" L")} Z`}
                                fill={dropoutOn ? "rgba(139,92,246,0.06)" : "rgba(244,63,94,0.08)"} />;
                        })()}
                        {/* Train curve */}
                        <polyline points={trainPath} fill="none" stroke="rgb(16,185,129)" strokeWidth={2} strokeLinecap="round" />
                        {/* Val curve */}
                        <polyline points={valPath} fill="none" stroke="rgb(139,92,246)" strokeWidth={2} strokeDasharray="5 3" strokeLinecap="round" />
                        {/* End dots */}
                        <circle cx={lToX(step)} cy={lToY(trainCurve[step])} r={3} fill="rgb(16,185,129)" fillOpacity={0.8} />
                        <circle cx={lToX(step)} cy={lToY(valCurve[step])} r={3} fill="rgb(139,92,246)" fillOpacity={0.8} />
                        {/* X label */}
                        <text x={CW / 2} y={CH - 2} textAnchor="middle" fill="rgba(255,255,255,0.1)" fontSize={6} fontFamily="monospace">Steps →</text>
                    </svg>
                    <div className="flex gap-4 justify-center text-[8px] font-mono">
                        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-500 rounded" /> Train</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-violet-500 rounded" /> Val</span>
                    </div>
                </div>
            )}

            {/* Status cards */}
            <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                    <div className="text-sm font-mono font-bold text-white">
                        {step > 0 ? (dropoutOn ? dropped.size : 0) : "—"}
                    </div>
                    <div className="text-[7px] font-mono text-white/20">Silenced now</div>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                    <div className={`text-sm font-mono font-bold ${finalGap > 0.2 ? "text-rose-400" : "text-emerald-400"}`}>
                        {step > 1 ? finalGap.toFixed(3) : "—"}
                    </div>
                    <div className="text-[7px] font-mono text-white/20">Train-Val Gap</div>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                    <div className={`text-sm font-mono font-bold ${dropoutOn ? "text-emerald-400" : "text-amber-400"}`}>
                        {dropoutOn ? "Low" : "High"}
                    </div>
                    <div className="text-[7px] font-mono text-white/20">Overfit Risk</div>
                </div>
            </div>

            {/* Explanation */}
            <p className="text-[9px] font-mono text-white/25 text-center leading-relaxed">
                {dropoutOn
                    ? "Each step silences random neurons. No single neuron can dominate → the network builds redundant, generalizable features. Notice the small, stable gap between train and val loss."
                    : "Without dropout, all neurons fire every step. The network memorizes training data → val loss starts rising while train loss keeps falling. The gap grows — classic overfitting."
                }
            </p>
        </div>
    );
}
