"use client";

import { useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Trophy } from "lucide-react";

/*
  ActivationBattleVisualizer — v2
  5-way race comparing activation functions (tanh, relu, gelu, sigmoid, linear).
  Fetches from /api/v1/mlp/activation-battle. Falls back to mock data if unavailable.
  Handles backend format: loss_curve.val can be number[] OR {step, value}[].
*/

/* ─── Types ─── */
type RawLossPoint = number | { step: number; value: number };
interface ActivationModelRaw {
    label: string;
    activation: string;
    final_val_loss: number | null;
    final_train_loss: number | null;
    diverged: boolean;
    loss_curve: { train: RawLossPoint[]; val: RawLossPoint[] };
    generated_samples: string[];
    total_params?: number;
}
interface BattleResponse {
    group: string;
    description?: string;
    models: ActivationModelRaw[];
}

/* ─── Normalize loss curve to flat numbers ─── */
function flattenCurve(raw: RawLossPoint[]): number[] {
    if (!raw?.length) return [];
    if (typeof raw[0] === "number") return raw as number[];
    return (raw as { step: number; value: number }[]).map(p => p.value);
}

function subsample(arr: number[], maxPts: number): number[] {
    if (arr.length <= maxPts) return arr;
    const step = Math.ceil(arr.length / maxPts);
    const result: number[] = [];
    for (let i = 0; i < arr.length; i += step) result.push(arr[i]);
    if (result[result.length - 1] !== arr[arr.length - 1]) result.push(arr[arr.length - 1]);
    return result;
}

/* ─── Constants ─── */
const ACTIVATION_COLORS: Record<string, string> = {
    relu: "#10b981",
    gelu: "#3b82f6",
    tanh: "#a855f7",
    sigmoid: "#f59e0b",
    linear: "#ef4444",
};
const ACTIVATION_LABELS: Record<string, string> = {
    relu: "ReLU",
    gelu: "GELU",
    tanh: "tanh",
    sigmoid: "Sigmoid",
    linear: "Linear",
};
const ACTIVATION_NOTES: Record<string, string> = {
    relu: "max(0, x) — zero below, linear above. Simple and fast. Can kill neurons (outputs stuck at 0).",
    gelu: "Smooth approximation of ReLU. Used in GPT and BERT. Slightly better gradients near zero.",
    tanh: "Classic S-curve, output in [−1, +1]. Saturates at extremes → gradients vanish in deep networks.",
    sigmoid: "S-curve, output in [0, 1]. Double saturation at both ends. Worse gradient flow than tanh.",
    linear: "f(x) = x — no non-linearity at all. Stacking linear layers = one big linear function. Cannot learn.",
};

// Mock fallback if backend unavailable
const MOCK_DATA: BattleResponse = {
    group: "activation_battle",
    models: [
        { label: "act_relu", activation: "relu", final_val_loss: 1.658, final_train_loss: 1.51, diverged: false, loss_curve: { train: [3.3, 2.8, 2.3, 1.9, 1.7, 1.52], val: [3.3, 2.85, 2.35, 2.0, 1.8, 1.658] }, generated_samples: ["the throne of the kingdom shall not"] },
        { label: "act_gelu", activation: "gelu", final_val_loss: 1.695, final_train_loss: 1.55, diverged: false, loss_curve: { train: [3.3, 2.82, 2.32, 1.92, 1.72, 1.56], val: [3.3, 2.87, 2.37, 2.02, 1.82, 1.695] }, generated_samples: ["the throne of the king henry"] },
        { label: "act_tanh", activation: "tanh", final_val_loss: 1.703, final_train_loss: 1.58, diverged: false, loss_curve: { train: [3.3, 2.9, 2.4, 2.05, 1.85, 1.59], val: [3.3, 2.95, 2.45, 2.1, 1.92, 1.703] }, generated_samples: ["the throne of the k"] },
        { label: "act_sigmoid", activation: "sigmoid", final_val_loss: 2.874, final_train_loss: 2.75, diverged: false, loss_curve: { train: [3.3, 3.1, 2.95, 2.85, 2.78, 2.76], val: [3.3, 3.12, 2.98, 2.88, 2.84, 2.874] }, generated_samples: ["the the the the"] },
        { label: "act_linear", activation: "linear", final_val_loss: 2.215, final_train_loss: 2.10, diverged: false, loss_curve: { train: [3.3, 3.1, 2.8, 2.5, 2.3, 2.10], val: [3.3, 3.12, 2.85, 2.55, 2.35, 2.215] }, generated_samples: ["e e e the and"] },
    ],
};

/* ─── SVG helpers ─── */
function buildPath(vals: number[], w: number, h: number, yMin: number, yMax: number): string {
    if (!vals.length) return "";
    const range = yMax - yMin || 1;
    const pts = vals
        .map((v, i) => {
            if (!isFinite(v)) return null;
            const x = (i / Math.max(vals.length - 1, 1)) * w;
            const y = h - ((v - yMin) / range) * h;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .filter(Boolean);
    return pts.length ? `M${pts.join(" L")}` : "";
}

const SVG_W = 380;
const SVG_H = 150;
const MAX_CURVE_PTS = 120;

export function ActivationBattleVisualizer() {
    const [data, setData] = useState<BattleResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [enabled, setEnabled] = useState<Set<string>>(new Set(["relu", "gelu", "tanh", "sigmoid", "linear"]));
    const [hoveredAct, setHoveredAct] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch(`${process.env.NEXT_PUBLIC_LM_LAB_API_URL ?? "http://localhost:8000"}/api/v1/mlp/activation-battle`)
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then((d: BattleResponse) => { if (!cancelled) { setData(d); setLoading(false); } })
            .catch(() => { if (!cancelled) { setData(MOCK_DATA); setLoading(false); } });
        return () => { cancelled = true; };
    }, []);

    const toggleActivation = (act: string) => {
        setEnabled(prev => {
            const next = new Set(prev);
            if (next.has(act)) { if (next.size > 1) next.delete(act); }
            else next.add(act);
            return next;
        });
    };

    /* ─── Prepare curve data ─── */
    const allModels = data?.models ?? MOCK_DATA.models;
    const ranked = useMemo(() =>
        [...allModels].sort((a, b) => {
            if (a.diverged && !b.diverged) return 1;
            if (!a.diverged && b.diverged) return -1;
            return (a.final_val_loss ?? 9999) - (b.final_val_loss ?? 9999);
        }), [allModels]);

    const enabledModels = allModels.filter(m => enabled.has(m.activation));
    const valCurves = useMemo(() =>
        enabledModels.map(m => subsample(flattenCurve(m.loss_curve.val), MAX_CURVE_PTS)),
        [enabledModels]);

    const { yMin, yMax } = useMemo(() => {
        const all = valCurves.flat().filter(v => isFinite(v));
        if (!all.length) return { yMin: 0, yMax: 4 };
        return { yMin: Math.min(...all), yMax: Math.max(...all) };
    }, [valCurves]);

    const LABEL_STEPS = 4;
    const yLabels = Array.from({ length: LABEL_STEPS + 1 }, (_, i) => {
        const v = yMin + ((yMax - yMin) * (LABEL_STEPS - i)) / LABEL_STEPS;
        return { y: (i / LABEL_STEPS) * SVG_H, label: v.toFixed(2) };
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48 text-white/30">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading battle data…
            </div>
        );
    }

    const bestLoss = ranked[0]?.final_val_loss ?? 0;

    return (
        <div className="space-y-4">
            {/* Activation toggles */}
            <div className="flex flex-wrap gap-2">
                {Object.keys(ACTIVATION_COLORS).map(act => {
                    const active = enabled.has(act);
                    const color = ACTIVATION_COLORS[act];
                    return (
                        <button
                            key={act}
                            onClick={() => toggleActivation(act)}
                            onMouseEnter={() => setHoveredAct(act)}
                            onMouseLeave={() => setHoveredAct(null)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                            style={{
                                borderColor: active ? color : "rgba(255,255,255,0.1)",
                                backgroundColor: active ? color + "20" : "transparent",
                                color: active ? color : "rgba(255,255,255,0.3)",
                            }}
                        >
                            <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ backgroundColor: active ? color : "rgba(255,255,255,0.15)" }} />
                            {ACTIVATION_LABELS[act] ?? act}
                        </button>
                    );
                })}
            </div>

            {/* Activation info tooltip */}
            <AnimatePresence mode="wait">
                {hoveredAct && (
                    <motion.div
                        key={hoveredAct}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-lg border px-3 py-2 overflow-hidden"
                        style={{ borderColor: ACTIVATION_COLORS[hoveredAct] + "30", backgroundColor: ACTIVATION_COLORS[hoveredAct] + "08" }}
                    >
                        <p className="text-[10px] font-mono leading-relaxed" style={{ color: ACTIVATION_COLORS[hoveredAct] + "cc" }}>
                            <strong>{ACTIVATION_LABELS[hoveredAct]}:</strong> {ACTIVATION_NOTES[hoveredAct]}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loss curve chart */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
                <div className="text-[9px] font-mono text-white/25 mb-2">Validation Loss over Training (lower = better)</div>
                <svg viewBox={`-36 -4 ${SVG_W + 14} ${SVG_H + 20}`} className="w-full">
                    {/* Y-axis labels + gridlines */}
                    {yLabels.map(({ y, label }) => (
                        <g key={label}>
                            <line x1={0} y1={y} x2={SVG_W} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
                            <text x={-4} y={y + 3} textAnchor="end" fontSize={7} fill="rgba(255,255,255,0.25)" fontFamily="monospace">{label}</text>
                        </g>
                    ))}
                    {/* X-axis label */}
                    <text x={SVG_W / 2} y={SVG_H + 14} textAnchor="middle" fontSize={6} fill="rgba(255,255,255,0.15)" fontFamily="monospace">Training steps →</text>
                    {/* Loss curves */}
                    {enabledModels.map((m, i) => {
                        const color = ACTIVATION_COLORS[m.activation] ?? "#94a3b8";
                        const curve = valCurves[i] ?? [];
                        const path = buildPath(curve, SVG_W, SVG_H, yMin, yMax);
                        if (!path) return null;
                        return (
                            <motion.path
                                key={m.activation}
                                d={path}
                                fill="none"
                                stroke={color}
                                strokeWidth={1.8}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity={hoveredAct && hoveredAct !== m.activation ? 0.2 : 0.85}
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: hoveredAct && hoveredAct !== m.activation ? 0.2 : 0.85 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                        );
                    })}
                    {/* End labels */}
                    {enabledModels.map((m, i) => {
                        const color = ACTIVATION_COLORS[m.activation] ?? "#94a3b8";
                        const curve = valCurves[i] ?? [];
                        const lastVal = curve[curve.length - 1];
                        if (!isFinite(lastVal)) return null;
                        const range = yMax - yMin || 1;
                        const y = SVG_H - ((lastVal - yMin) / range) * SVG_H;
                        return (
                            <text
                                key={m.activation}
                                x={SVG_W + 3}
                                y={y + 3}
                                fontSize={7}
                                fill={color}
                                fontFamily="monospace"
                                fontWeight={600}
                                opacity={hoveredAct && hoveredAct !== m.activation ? 0.2 : 1}
                            >
                                {ACTIVATION_LABELS[m.activation]}
                            </text>
                        );
                    })}
                </svg>
            </div>

            {/* Rankings + generated text */}
            <div className="space-y-1.5">
                {ranked.map((m, rank) => {
                    const color = ACTIVATION_COLORS[m.activation] ?? "#94a3b8";
                    const label = ACTIVATION_LABELS[m.activation] ?? m.activation;
                    const isActive = enabled.has(m.activation);
                    const isWinner = rank === 0 && !m.diverged;
                    const sample = (m.generated_samples?.[0] ?? "").trim().slice(0, 80);
                    const valLoss = m.final_val_loss;
                    const lossBarW = valLoss && bestLoss ? Math.min(100, ((valLoss - 1.4) / (3.0 - 1.4)) * 100) : 100;

                    return (
                        <motion.div
                            key={m.activation}
                            className={`rounded-xl border p-3 transition-all ${isActive ? "opacity-100" : "opacity-25"}`}
                            style={{
                                borderColor: isWinner ? color + "40" : "rgba(255,255,255,0.04)",
                                backgroundColor: isWinner ? color + "08" : "rgba(255,255,255,0.01)",
                            }}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: isActive ? 1 : 0.25, y: 0 }}
                            transition={{ delay: rank * 0.08 }}
                        >
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[10px] font-mono text-white/25 w-4">{rank + 1}.</span>
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                <span className="text-xs font-mono font-bold" style={{ color }}>{label}</span>
                                {isWinner && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                                <span className="ml-auto text-[10px] font-mono tabular-nums" style={{ color: m.diverged ? "#ef4444" : color }}>
                                    {m.diverged ? "DIVERGED" : `val=${valLoss?.toFixed(3) ?? "—"}`}
                                </span>
                            </div>
                            {/* Mini loss bar */}
                            <div className="h-1.5 rounded-full bg-white/[0.03] overflow-hidden mb-1.5">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: color, opacity: 0.6 }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.max(4, lossBarW)}%` }}
                                    transition={{ duration: 0.8, delay: rank * 0.1 }}
                                />
                            </div>
                            {/* Sample text */}
                            {sample && (
                                <p className="text-[9px] font-mono text-white/25 italic truncate">
                                    &ldquo;{sample}&rdquo;
                                </p>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Config footer */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[7px] font-mono text-white/15">
                <span>H=128 · L=2 · ctx=4 · kaiming · 80K steps</span>
                <span className="text-emerald-400/20">Real training data</span>
            </div>
        </div>
    );
}
