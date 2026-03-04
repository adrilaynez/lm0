"use client";

import { useEffect, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Skull, Sparkles, TrendingUp, Zap } from "lucide-react";

import { useI18n } from "@/i18n/context";

/*
  DeepModelRedemptionDemo
  Before/after: same depth, without vs with stability techniques.
  Left = failure (red), Right = success (green).
  Animated reveal: failure first, then success slides in.
  Fetches real data from /api/v1/mlp/stability-grid.
*/

interface ConfigData {
    configLabel: string;
    layers: number;
    lossCurve: number[];
    finalLoss: number;
    sample: string;
}

interface RedemptionData {
    failure: ConfigData;
    success: ConfigData;
    expectedLoss: number;
}

const FALLBACK: RedemptionData = {
    failure: {
        configLabel: "2 layers · h=128 · emb=10 · no stability",
        layers: 2,
        lossCurve: [3.3, 3.29, 3.3, 3.31, 3.28, 3.32, 3.3, 3.29, 3.31, 3.3, 3.28, 3.31, 3.29, 3.3, 3.32, 3.29, 3.31, 3.3, 2.1, 1.84],
        finalLoss: 1.84,
        sample: "the mands.s a charge sos vien edwatistrex ditacowdle",
    },
    success: {
        configLabel: "2 layers · h=128 · emb=10 · Kaiming",
        layers: 2,
        lossCurve: [3.3, 3.1, 2.8, 2.5, 2.3, 2.15, 2.05, 1.98, 1.93, 1.90, 1.88, 1.80, 1.75, 1.72, 1.68, 1.66, 1.65, 1.64, 1.63, 1.63],
        finalLoss: 1.63,
        sample: "the king ordered his servants to bring the crown",
    },
    expectedLoss: 1.63,
};

interface StabilityModel {
    label: string;
    config: { num_layers: number; hidden_size: number; emb_dim: number };
    final_train_loss: number;
    final_val_loss: number;
    total_params: number;
    diverged: boolean;
    techniques: { init_strategy: string; use_batchnorm: boolean; use_residual: boolean };
    generated_samples: string[];
    loss_curve: { train: { step: number; value: number }[]; val: { step: number; value: number }[] };
}

function classifyTechnique(t: { init_strategy: string; use_batchnorm: boolean; use_residual: boolean }): string {
    if (t.init_strategy === "random") return "none";
    if (t.use_residual) return "K+BN+Res";
    if (t.use_batchnorm) return "K+BN";
    return "Kaiming";
}

function downsamplePoints(arr: { step: number; value: number }[], target: number): number[] {
    if (arr.length <= target) return arr.map(p => p.value);
    const result: number[] = [];
    const step = (arr.length - 1) / (target - 1);
    for (let i = 0; i < target; i++) result.push(arr[Math.round(i * step)].value);
    return result;
}

/* ─── Mini loss chart ─── */
function MiniLossChart({ data, expected, color }: { data: number[]; expected: number; color: "red" | "green" }) {
    const w = 260, h = 100, px = 28, py = 12;
    const plotW = w - 2 * px, plotH = h - 2 * py;
    const allVals = [...data, expected];
    const yMin = Math.floor(Math.min(...allVals) * 10 - 2) / 10;
    const yMax = Math.ceil(Math.max(...allVals) * 10 + 2) / 10;

    const toY = (v: number) => py + (1 - (v - yMin) / (yMax - yMin)) * plotH;
    const toX = (i: number) => px + (i / (data.length - 1)) * plotW;

    const points = data.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
    const expectedY = toY(expected);
    const stroke = color === "red" ? "#ef4444" : "#34d399";

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
            {[yMax, (yMax + yMin) / 2, yMin].map((tick, i) => {
                const y = toY(tick);
                return (
                    <g key={i}>
                        <line x1={px} y1={y} x2={w - px} y2={y} stroke="white" strokeOpacity={0.05} />
                        <text x={px - 4} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.15)" fontSize={7} fontFamily="monospace">{tick.toFixed(1)}</text>
                    </g>
                );
            })}
            <line x1={px} y1={py} x2={px} y2={h - py} stroke="white" strokeOpacity={0.06} />

            {/* Expected loss line */}
            <line x1={px} y1={expectedY} x2={w - px} y2={expectedY} stroke="#34d399" strokeWidth={1} strokeDasharray="4,3" strokeOpacity={0.4} />

            {/* Loss curve */}
            <polyline points={points} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

            {/* End dot */}
            <circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1])} r={3} fill={stroke} />
            <text x={toX(data.length - 1)} y={toY(data[data.length - 1]) - 8} textAnchor="middle" fill={stroke} fontSize={8} fontFamily="monospace" fontWeight="bold">
                {data[data.length - 1].toFixed(2)}
            </text>
        </svg>
    );
}

export function DeepModelRedemptionDemo() {
    const { t } = useI18n();
    const [data, setData] = useState<RedemptionData | null>(null);
    const [revealed, setRevealed] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const res = await fetch("/api/v1/mlp/stability-grid");
                if (!res.ok) throw new Error("API unavailable");
                const json = await res.json();
                const models: StabilityModel[] = json?.models ?? json;
                if (!Array.isArray(models) || models.length === 0) throw new Error("No models");

                // Group by depth
                const byDepth = new Map<number, StabilityModel[]>();
                for (const m of models) {
                    const d = m.config?.num_layers ?? 0;
                    if (!byDepth.has(d)) byDepth.set(d, []);
                    byDepth.get(d)!.push(m);
                }

                // Pick the deepest depth that has both "none" and at least one technique
                let bestPair: { fail: StabilityModel; win: StabilityModel; depth: number } | null = null;
                const depths = [...byDepth.keys()].sort((a, b) => b - a);
                for (const depth of depths) {
                    const group = byDepth.get(depth)!;
                    const noneModel = group.find(m => m.techniques.init_strategy === "random" && !m.diverged);
                    const techModels = group.filter(m => m.techniques.init_strategy !== "random" && !m.diverged);
                    if (noneModel && techModels.length > 0) {
                        const bestTech = techModels.sort((a, b) => a.final_val_loss - b.final_val_loss)[0];
                        bestPair = { fail: noneModel, win: bestTech, depth };
                        break;
                    }
                }
                if (!bestPair) throw new Error("No valid pair found");

                const techLabel = classifyTechnique(bestPair.win.techniques);
                const cfg = bestPair.fail.config;
                const failSample = bestPair.fail.generated_samples?.[0] ?? FALLBACK.failure.sample;
                const winSample = bestPair.win.generated_samples?.[0] ?? FALLBACK.success.sample;

                if (cancelled) return;
                setData({
                    failure: {
                        configLabel: `${bestPair.depth}L · h=${cfg.hidden_size} · emb=${cfg.emb_dim} · no stability`,
                        layers: bestPair.depth,
                        lossCurve: downsamplePoints(bestPair.fail.loss_curve.val, 25),
                        finalLoss: bestPair.fail.final_val_loss,
                        sample: failSample,
                    },
                    success: {
                        configLabel: `${bestPair.depth}L · h=${cfg.hidden_size} · emb=${cfg.emb_dim} · ${techLabel}`,
                        layers: bestPair.depth,
                        lossCurve: downsamplePoints(bestPair.win.loss_curve.val, 25),
                        finalLoss: bestPair.win.final_val_loss,
                        sample: winSample,
                    },
                    expectedLoss: bestPair.win.final_val_loss,
                });
            } catch {
                if (cancelled) return;
                setData(FALLBACK);
                setError(true);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    // Auto-reveal after 2s
    useEffect(() => {
        if (!data) return;
        const timer = setTimeout(() => setRevealed(true), 2000);
        return () => clearTimeout(timer);
    }, [data]);

    if (!data) {
        return <div className="flex items-center justify-center h-48 text-sm text-white/30 font-mono">Loading redemption analysis…</div>;
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ── LEFT: Failure ── */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-xl border border-red-500/30 bg-gradient-to-br from-red-500/[0.08] to-transparent p-4"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Skull className="w-4 h-4 text-red-400 shrink-0" />
                        <div>
                            <h4 className="text-xs font-bold text-red-300 uppercase tracking-wider">{t("models.mlp.narrative.s06.redemptionBefore")}</h4>
                            <p className="text-[9px] font-mono text-white/25">{data.failure.configLabel}</p>
                        </div>
                    </div>

                    <MiniLossChart data={data.failure.lossCurve} expected={data.expectedLoss} color="red" />

                    <div className="mt-2 text-center">
                        <span className="text-[9px] font-mono text-white/20 uppercase">Final Loss</span>
                        <p className="text-lg font-mono font-bold text-red-400">{data.failure.finalLoss.toFixed(2)}</p>
                    </div>

                    <div className="mt-3 rounded-lg bg-black/30 border border-red-500/10 p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Zap className="w-2.5 h-2.5 text-red-400" />
                            <span className="text-[8px] font-mono text-red-400/50 uppercase tracking-wider">{t("models.mlp.narrative.s06.redemptionOutput")}</span>
                        </div>
                        <p className="text-[11px] font-mono text-white/35 leading-relaxed break-all">{data.failure.sample}</p>
                    </div>
                </motion.div>

                {/* ── RIGHT: Success (animated reveal) ── */}
                <AnimatePresence>
                    {revealed ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, x: 40, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                            className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.08] to-transparent p-4"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <div>
                                    <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">{t("models.mlp.narrative.s06.redemptionAfter")}</h4>
                                    <p className="text-[9px] font-mono text-white/25">{data.success.configLabel}</p>
                                </div>
                            </div>

                            <MiniLossChart data={data.success.lossCurve} expected={data.expectedLoss} color="green" />

                            <div className="mt-2 text-center">
                                <span className="text-[9px] font-mono text-white/20 uppercase">Final Loss</span>
                                <p className="text-lg font-mono font-bold text-emerald-400">{data.success.finalLoss.toFixed(2)}</p>
                            </div>

                            <div className="mt-3 rounded-lg bg-black/30 border border-emerald-500/10 p-2.5">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                                    <span className="text-[8px] font-mono text-emerald-400/50 uppercase tracking-wider">{t("models.mlp.narrative.s06.redemptionOutput")}</span>
                                </div>
                                <p className="text-[11px] font-mono text-white/50 leading-relaxed">{data.success.sample}</p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="placeholder"
                            className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col items-center justify-center gap-3 min-h-[280px]"
                        >
                            <motion.div
                                animate={{ opacity: [0.3, 0.7, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <AlertTriangle className="w-8 h-8 text-amber-400/40" />
                            </motion.div>
                            <p className="text-xs font-mono text-white/20 text-center">
                                {t("models.mlp.narrative.s06.redemptionWaiting")}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Improvement banner ── */}
            <AnimatePresence>
                {revealed && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="flex items-center justify-center gap-3 p-3 rounded-lg bg-gradient-to-r from-emerald-500/10 via-violet-500/10 to-emerald-500/10 border border-emerald-500/20"
                    >
                        <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                        <p className="text-xs font-mono text-emerald-300">
                            {data.failure.finalLoss.toFixed(2)} → {data.success.finalLoss.toFixed(2)}
                            <span className="text-white/30 mx-2">·</span>
                            <span className="font-bold text-emerald-400">
                                {(((data.failure.finalLoss - data.success.finalLoss) / data.failure.finalLoss) * 100).toFixed(0)}% improvement
                            </span>
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <p className="text-[10px] text-white/20 text-center font-mono">Using pre-computed data (API unavailable)</p>
            )}
        </div>
    );
}
