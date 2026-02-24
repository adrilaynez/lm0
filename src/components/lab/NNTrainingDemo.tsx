"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";

function sigmoid(x: number) { return 1 / (1 + Math.exp(-x)); }

const INPUT = 1.0;
const INITIAL_W = 0.5;
const INITIAL_B = -0.2;

export interface TrainingStep {
    step: number;
    w: number;
    b: number;
    yhat: number;
    loss: number;
}

function trainOnce(w: number, b: number, target: number, lr: number) {
    const z = w * INPUT + b;
    const yhat = sigmoid(z);
    const loss = (yhat - target) ** 2;
    const dLdz = 2 * (yhat - target) * yhat * (1 - yhat);
    return { newW: w - lr * dLdz * INPUT, newB: b - lr * dLdz, yhat, loss };
}

/* ─── SVG Loss Chart ─── */
const CW = 320, CH = 90;
const PAD = { t: 8, r: 8, b: 24, l: 38 };
const IW = CW - PAD.l - PAD.r;
const IH = CH - PAD.t - PAD.b;

function seededNoise(step: number) {
    let s = (step * 16807 + 12345) % 2147483647;
    s = (s * 48271) % 2147483647;
    return (s / 2147483647 - 0.5) * 2;
}

function LossChart({ history, initialLoss, batchSize = 4 }: { history: TrainingStep[]; initialLoss: number; batchSize?: number }) {
    const noiseScale = 0.03 / Math.sqrt(batchSize);
    const visible = history.slice(-60);
    const noisyLosses = visible.map(h => Math.max(0, h.loss + seededNoise(h.step) * noiseScale * (h.loss + 0.01)));
    const maxL = Math.max(initialLoss, ...noisyLosses, 0.001);

    function px(i: number) {
        return PAD.l + (visible.length < 2 ? IW / 2 : (i / (visible.length - 1)) * IW);
    }
    function py(loss: number) {
        return PAD.t + IH - (loss / maxL) * IH;
    }

    const polyline = visible.map((h, i) => `${px(i)},${py(noisyLosses[i])}`).join(" ");
    const lastX = px(visible.length - 1);
    const lastY = py(visible[visible.length - 1].loss);
    const yTicks = [0, 0.5, 1].map(f => ({ v: f * maxL, y: PAD.t + IH - f * IH }));
    const xTicks = visible.length < 2 ? [] :
        [0, Math.floor((visible.length - 1) / 2), visible.length - 1].map(i => ({
            label: visible[i].step, x: px(i),
        }));

    return (
        <svg viewBox={`0 0 ${CW} ${CH}`} className="w-full" aria-label="Loss over training steps">
            <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + IH} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <line x1={PAD.l} y1={PAD.t + IH} x2={PAD.l + IW} y2={PAD.t + IH} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            {yTicks.map(({ v, y }) => (
                <g key={v}>
                    <line x1={PAD.l - 3} y1={y} x2={PAD.l} y2={y} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                    <text x={PAD.l - 5} y={y + 3} textAnchor="end" fontSize="7"
                        fontFamily="ui-monospace,monospace" fill="rgba(255,255,255,0.25)">{v.toFixed(3)}</text>
                </g>
            ))}
            {xTicks.map(({ label, x }, i) => (
                <g key={`${label}-${i}`}>
                    <line x1={x} y1={PAD.t + IH} x2={x} y2={PAD.t + IH + 3} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                    <text x={x} y={PAD.t + IH + 13} textAnchor="middle" fontSize="7"
                        fontFamily="ui-monospace,monospace" fill="rgba(255,255,255,0.25)">{label}</text>
                </g>
            ))}
            <line x1={PAD.l} y1={py(initialLoss)} x2={PAD.l + IW} y2={py(initialLoss)}
                stroke="rgba(251,191,36,0.25)" strokeWidth="1" strokeDasharray="4 3" />
            <text x={PAD.l + IW - 2} y={py(initialLoss) - 3} textAnchor="end" fontSize="7"
                fontFamily="ui-monospace,monospace" fill="rgba(251,191,36,0.45)">initial</text>
            {visible.length > 1 && (
                <polyline points={polyline} fill="none" stroke="rgba(244,63,94,0.75)" strokeWidth="1.5" strokeLinejoin="round" />
            )}
            <circle cx={lastX} cy={lastY} r="3.5" fill="rgb(244,63,94)" opacity="0.9" />
            <circle cx={lastX} cy={lastY} r="6" fill="none" stroke="rgba(244,63,94,0.3)" strokeWidth="1" />
        </svg>
    );
}

/* ─── Slider ─── */
function Slider({ label, value, min, max, step, onChange, accent = "rose" }: {
    label: string; value: number; min: number; max: number; step: number;
    onChange: (v: number) => void; accent?: string;
}) {
    const cls: Record<string, string> = {
        rose: "accent-rose-400", amber: "accent-amber-400", indigo: "accent-indigo-400",
    };
    return (
        <label className="block">
            <div className="flex justify-between mb-1">
                <span className="text-[10px] font-mono text-white/40">{label}</span>
                <span className="text-[11px] font-mono font-bold text-white/60">{value.toFixed(2)}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
                onChange={e => onChange(+e.target.value)}
                className={`w-full cursor-pointer ${cls[accent] ?? cls.rose}`} />
        </label>
    );
}

/* ─── Delta Badge ─── */
function DeltaBadge({ delta }: { delta: number | null }) {
    if (delta === null) return null;
    const improved = delta < 0;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border
            ${improved
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/25 text-rose-400"}`}>
            {improved ? "↓" : "↑"} {Math.abs(delta).toFixed(6)}
        </span>
    );
}

export interface NNTrainingDemoCallbacks {
    onHistoryChange?: (history: TrainingStep[], target: number) => void;
}

const BATCH_SIZES = [1, 4, 16] as const;

export function NNTrainingDemo({ onHistoryChange }: NNTrainingDemoCallbacks = {}) {
    const [target, setTarget] = useState(0.8);
    const [lr, setLr] = useState(1.0);
    const [batchSize, setBatchSize] = useState<number>(4);

    const makeInitial = useCallback((tgt: number): TrainingStep => {
        const z = INITIAL_W * INPUT + INITIAL_B;
        const yhat = sigmoid(z);
        return { step: 0, w: INITIAL_W, b: INITIAL_B, yhat, loss: (yhat - tgt) ** 2 };
    }, []);

    const [history, setHistory] = useState<TrainingStep[]>(() => [makeInitial(0.8)]);
    const [w, setW] = useState(INITIAL_W);
    const [b, setB] = useState(INITIAL_B);
    const [lastDelta, setLastDelta] = useState<number | null>(null);

    useEffect(() => {
        onHistoryChange?.(history, target);
    }, [history, target, onHistoryChange]);

    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = useCallback(() => {
        setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
    }, []);

    const doStep = useCallback(() => {
        setW(prevW => {
            setB(prevB => {
                const { newW, newB, yhat, loss } = trainOnce(prevW, prevB, target, lr);
                setHistory(h => {
                    setLastDelta(loss - h[h.length - 1].loss);
                    scrollToBottom();
                    const next = [...h, { step: h.length, w: newW, b: newB, yhat, loss }];
                    return next;
                });
                setW(newW);
                return newB;
            });
            return prevW;
        });
    }, [target, lr, scrollToBottom]);

    const doAutoTrain = useCallback(() => {
        let cw = w, cb = b;
        const steps: TrainingStep[] = [];
        let idx = history.length;
        for (let i = 0; i < 10; i++) {
            const { newW, newB, yhat, loss } = trainOnce(cw, cb, target, lr);
            steps.push({ step: idx++, w: newW, b: newB, yhat, loss });
            cw = newW; cb = newB;
        }
        setLastDelta(steps[steps.length - 1].loss - history[history.length - 1].loss);
        setW(cw); setB(cb);
        setHistory(h => {
            const next = [...h, ...steps];
            return next;
        });
        scrollToBottom();
    }, [w, b, history, target, lr, scrollToBottom]);

    const handleReset = useCallback(() => {
        setW(INITIAL_W); setB(INITIAL_B);
        const initial = [makeInitial(target)];
        setHistory(initial);
        setLastDelta(null);
    }, [target, makeInitial]);

    const handleTargetChange = useCallback((v: number) => {
        setTarget(v);
        setW(INITIAL_W); setB(INITIAL_B);
        const initial = [makeInitial(v)];
        setHistory(initial);
        setLastDelta(null);
    }, [makeInitial]);

    const latest = history[history.length - 1];
    const initialLoss = useMemo(() => history[0].loss, [history]);

    return (
        <figure className="my-10 -mx-2 sm:mx-0">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden shadow-[0_0_60px_-15px_rgba(244,63,94,0.05)]">
                <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                    <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                        Interactive · Training Loop
                    </span>
                </div>

                <div className="p-4 sm:p-6 space-y-5">
                    {/* Controls */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
                        <Slider label="Target value" value={target} min={0.1} max={0.99} step={0.01}
                            onChange={handleTargetChange} accent="indigo" />
                        <Slider label="Learning rate η" value={lr} min={0.05} max={5.0} step={0.05}
                            onChange={v => setLr(v)} accent="amber" />
                        <div className="col-span-2 flex items-center gap-3">
                            <span className="text-[10px] font-mono text-white/40">Batch size</span>
                            <div className="flex gap-1.5">
                                {BATCH_SIZES.map(bs => (
                                    <button
                                        key={bs}
                                        onClick={() => setBatchSize(bs)}
                                        className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border transition-all ${batchSize === bs
                                            ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
                                            : "border-white/[0.06] bg-white/[0.02] text-white/30 hover:text-white/50"
                                            }`}
                                    >
                                        {bs}
                                    </button>
                                ))}
                            </div>
                            <span className="text-[9px] font-mono text-white/20 ml-auto">
                                noise ∝ 1/√{batchSize}
                            </span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {([
                            { label: "Step", value: String(latest.step), color: "text-white/70" },
                            { label: "Weight w", value: latest.w.toFixed(4), color: "text-rose-400" },
                            { label: "Bias b", value: latest.b.toFixed(4), color: "text-amber-400" },
                            { label: "Prediction ŷ", value: latest.yhat.toFixed(4), color: "text-indigo-400" },
                        ] as const).map(({ label, value, color }) => (
                            <div key={label} className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2 text-center">
                                <p className="text-[9px] font-mono text-white/25 mb-0.5">{label}</p>
                                <p className={`text-base font-mono font-bold ${color}`}>{value}</p>
                            </div>
                        ))}
                        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2 text-center">
                            <p className="text-[9px] font-mono text-white/25 mb-0.5">Loss</p>
                            <div className="flex items-center gap-2">
                                <p className="text-base font-mono font-bold text-emerald-400">{latest.loss.toFixed(6)}</p>
                                <DeltaBadge delta={lastDelta} />
                            </div>
                        </div>
                    </div>

                    {/* SVG Loss Chart */}
                    <div>
                        <p className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-2">
                            Loss over training steps
                        </p>
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] px-2 py-2">
                            <LossChart history={history} initialLoss={initialLoss} batchSize={batchSize} />
                        </div>
                    </div>

                    {/* History table */}
                    <div ref={scrollRef} className="max-h-40 overflow-y-auto rounded-lg border border-white/[0.06]">
                        <table className="w-full text-[10px] font-mono">
                            <thead>
                                <tr className="border-b border-white/[0.06] bg-white/[0.02] sticky top-0">
                                    <th className="px-3 py-2 text-left text-white/30 font-bold">#</th>
                                    <th className="px-3 py-2 text-right text-white/30 font-bold">w</th>
                                    <th className="px-3 py-2 text-right text-white/30 font-bold">b</th>
                                    <th className="px-3 py-2 text-right text-white/30 font-bold">ŷ</th>
                                    <th className="px-3 py-2 text-right text-white/30 font-bold">Loss</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(h => (
                                    <tr key={h.step} className="border-b border-white/[0.03] last:border-0">
                                        <td className="px-3 py-1.5 text-white/40">{h.step}</td>
                                        <td className="px-3 py-1.5 text-right text-rose-400/70">{h.w.toFixed(4)}</td>
                                        <td className="px-3 py-1.5 text-right text-amber-400/70">{h.b.toFixed(4)}</td>
                                        <td className="px-3 py-1.5 text-right text-indigo-400/70">{h.yhat.toFixed(4)}</td>
                                        <td className="px-3 py-1.5 text-right text-white/50">{h.loss.toFixed(6)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 flex-wrap">
                        <button onClick={doStep} aria-label="Train one step"
                            className="px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-mono font-bold hover:bg-rose-500/20 transition-colors">
                            Train 1 Step
                        </button>
                        <button onClick={doAutoTrain} aria-label="Auto-train ten steps"
                            className="px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-mono font-bold hover:bg-indigo-500/20 transition-colors">
                            Auto-Train ×10
                        </button>
                        <button onClick={handleReset} aria-label="Reset training"
                            className="px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/40 text-[11px] font-mono font-bold hover:text-white/60 transition-colors">
                            Reset
                        </button>
                    </div>
                </div>
            </div>
            <figcaption className="mt-3 text-center text-xs text-white/25 italic">
                Each step adjusts weights to reduce the loss. Watch how the prediction converges toward the target.
            </figcaption>
        </figure>
    );
}
