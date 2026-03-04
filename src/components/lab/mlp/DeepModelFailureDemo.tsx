"use client";

import { useEffect, useState } from "react";

import { motion } from "framer-motion";
import { AlertTriangle, Skull, TrendingUp, Zap } from "lucide-react";

import { fetchMLPGrid, fetchMLPTimeline, generateMLP } from "@/lib/lmLabClient";
import { useI18n } from "@/i18n/context";

/*
  DeepModelFailureDemo
  Shows the worst-performing deep config from the grid — diverged/flat
  loss curve, gibberish text, dramatic red/amber styling.
*/

interface FailureData {
    configLabel: string;
    layers: number;
    hiddenSize: number;
    embDim: number;
    lossCurve: number[];
    finalLoss: number;
    expectedLoss: number;
    sample: string;
}

const FALLBACK: FailureData = {
    configLabel: "4 layers · h=128 · emb=10",
    layers: 4,
    hiddenSize: 128,
    embDim: 10,
    lossCurve: [3.3, 3.29, 3.3, 3.31, 3.28, 3.32, 3.3, 3.29, 3.31, 3.3, 3.28, 3.31, 3.29, 3.3, 3.32, 3.29, 3.31, 3.3, 3.28, 3.3],
    finalLoss: 3.30,
    expectedLoss: 1.80,
    sample: "qqzj.vxk bnmw.fxlr pqzwj.kxt nmvqbx.rl",
};

function downsample(arr: number[], target: number): number[] {
    if (arr.length <= target) return arr;
    const result: number[] = [];
    const step = (arr.length - 1) / (target - 1);
    for (let i = 0; i < target; i++) result.push(arr[Math.round(i * step)]);
    return result;
}

/* ─── Mini loss chart ─── */
function FailureLossChart({ data, expected }: { data: number[]; expected: number }) {
    const w = 320, h = 120, px = 32, py = 14;
    const plotW = w - 2 * px, plotH = h - 2 * py;
    const allVals = [...data, expected];
    const yMin = Math.floor(Math.min(...allVals) * 10 - 2) / 10;
    const yMax = Math.ceil(Math.max(...allVals) * 10 + 2) / 10;

    const toY = (v: number) => py + (1 - (v - yMin) / (yMax - yMin)) * plotH;
    const toX = (i: number) => px + (i / (data.length - 1)) * plotW;

    const points = data.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
    const expectedY = toY(expected);

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
            {/* Grid */}
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

            {/* Expected loss line (green, dashed) */}
            <line x1={px} y1={expectedY} x2={w - px} y2={expectedY} stroke="#34d399" strokeWidth={1} strokeDasharray="4,3" strokeOpacity={0.5} />
            <text x={w - px + 4} y={expectedY + 3} fill="#34d399" fontSize={7} fontFamily="monospace" opacity={0.6}>expected</text>

            {/* Actual loss curve (red) */}
            <polyline points={points} fill="none" stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

            {/* End dot */}
            <circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1])} r={3.5} fill="#ef4444" />
            <rect x={toX(data.length - 1) - 20} y={toY(data[data.length - 1]) - 18} width={40} height={14} rx={3} fill="rgba(239,68,68,0.2)" />
            <text x={toX(data.length - 1)} y={toY(data[data.length - 1]) - 8} textAnchor="middle" fill="#ef4444" fontSize={8} fontFamily="monospace" fontWeight="bold">
                {data[data.length - 1].toFixed(2)}
            </text>
        </svg>
    );
}

export function DeepModelFailureDemo() {
    const { t } = useI18n();
    const [data, setData] = useState<FailureData | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const gridRes = await fetchMLPGrid();
                const configs = gridRes.configurations ?? gridRes.configs ?? [];
                if (configs.length === 0) throw new Error("No configs");

                // Find deepest (most layers) config, among those pick worst loss
                const maxLayers = Math.max(...configs.map((c) => c.num_layers ?? 1));
                const deepConfigs = configs.filter((c) => (c.num_layers ?? 1) === maxLayers);
                const worstDeep = deepConfigs.sort((a, b) => b.final_loss - a.final_loss)[0];

                // Fetch timeline
                const timeline = await fetchMLPTimeline(worstDeep.embedding_dim, worstDeep.hidden_size, worstDeep.learning_rate);
                const vl = timeline.metrics_log?.val_loss ?? [];
                const tr = timeline.metrics_log?.train_loss ?? [];
                const curve = (vl.length > 0 ? vl : tr).map((e: { value: number }) => e.value);

                // Find best config for expected loss
                const best = [...configs].sort((a: { final_loss: number }, b: { final_loss: number }) => a.final_loss - b.final_loss)[0];

                // Generate sample text
                let sample = FALLBACK.sample;
                try {
                    const g = await generateMLP(worstDeep.embedding_dim, worstDeep.hidden_size, worstDeep.learning_rate, "the", 40, 0.8);
                    sample = g.generated_text;
                } catch { /* fallback */ }

                if (cancelled) return;
                setData({
                    configLabel: `${worstDeep.num_layers ?? 1} layers · h=${worstDeep.hidden_size} · emb=${worstDeep.embedding_dim}`,
                    layers: worstDeep.num_layers ?? 1,
                    hiddenSize: worstDeep.hidden_size,
                    embDim: worstDeep.embedding_dim,
                    lossCurve: downsample(curve, 20),
                    finalLoss: worstDeep.final_loss,
                    expectedLoss: best.final_loss,
                    sample,
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

    if (!data) {
        return <div className="flex items-center justify-center h-48 text-sm text-white/30 font-mono">Loading failure analysis…</div>;
    }

    const lossRatio = data.finalLoss / data.expectedLoss;
    const isActualFailure = lossRatio > 1.3;

    return (
        <div className="space-y-4">
            {/* Alert banner */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-xl border border-red-500/30 bg-gradient-to-r from-red-500/[0.08] via-amber-500/[0.04] to-red-500/[0.08] p-5"
            >
                {/* Pulsing alert */}
                <motion.div
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-3 right-3"
                >
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                </motion.div>

                <div className="flex items-center gap-3 mb-3">
                    <Skull className="w-5 h-5 text-red-400 shrink-0" />
                    <div>
                        <h4 className="text-sm font-bold text-red-300">{t("models.mlp.narrative.s04.failureTitle")}</h4>
                        <p className="text-[10px] font-mono text-white/30">{data.configLabel}</p>
                    </div>
                </div>

                {/* Loss chart */}
                <FailureLossChart data={data.lossCurve} expected={data.expectedLoss} />

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="text-center">
                        <p className="text-[9px] font-mono text-white/25 uppercase">Final Loss</p>
                        <p className="text-lg font-mono font-bold text-red-400">{data.finalLoss.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[9px] font-mono text-white/25 uppercase">Expected</p>
                        <p className="text-lg font-mono font-bold text-emerald-400">{data.expectedLoss.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[9px] font-mono text-white/25 uppercase">
                            {isActualFailure ? "Degradation" : "Gap"}
                        </p>
                        <p className="text-lg font-mono font-bold text-amber-400">
                            {isActualFailure ? `${((lossRatio - 1) * 100).toFixed(0)}% worse` : `${((lossRatio - 1) * 100).toFixed(0)}%`}
                        </p>
                    </div>
                </div>

                {/* Generated text — gibberish */}
                <div className="mt-4 rounded-lg bg-black/30 border border-red-500/10 p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-3 h-3 text-red-400" />
                        <span className="text-[9px] font-mono text-red-400/60 uppercase tracking-wider">{t("models.mlp.narrative.s04.failureOutputLabel")}</span>
                    </div>
                    <p className="text-xs font-mono text-white/40 leading-relaxed break-all">{data.sample}</p>
                </div>

                {/* Expected vs got */}
                <div className="mt-3 flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <p className="text-[10px] text-white/40">
                        <span className="text-emerald-400 font-mono font-bold">{t("models.mlp.narrative.s04.failureExpected")}</span>
                        {" "}
                        <span className="text-red-400 font-mono font-bold">{t("models.mlp.narrative.s04.failureGot")}</span>
                    </p>
                </div>
            </motion.div>

            {error && (
                <p className="text-[10px] text-white/20 text-center font-mono">Using pre-computed data (API unavailable)</p>
            )}
        </div>
    );
}
