"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Trophy, Zap, Table, BrainCircuit } from "lucide-react";

import { fetchMLPGrid, fetchMLPTimeline, generateNgram, generateMLP } from "@/lib/lmLabClient";
import { useI18n } from "@/i18n/context";

/* ─── Constants ─── */
const VOCAB = 27; // a-z + '.'
const CONTEXT = 4;
const TABLE_ENTRIES = Math.pow(VOCAB, CONTEXT); // 27^4 = 531,441

/* ─── Hardcoded fallback data (used when API unavailable) ─── */
const FALLBACK_4GRAM = {
    loss: Array.from({ length: 50 }, () => 1.82),
    finalLoss: 1.82,
    params: 0,
    tableSize: TABLE_ENTRIES,
    sample: "the king was in the cou.rtyard and the",
};
const FALLBACK_MLP = {
    loss: Array.from({ length: 50 }, (_, i) => 3.3 - 1.2 * (1 - Math.exp(-i / 15))),
    finalLoss: 2.10,
    params: 11_000,
    sample: "the mont and the sain.t ofed the kin",
};

/* ─── Types ─── */
interface RacerData {
    label: string;
    subtitle: string;
    loss: number[];
    finalLoss: number;
    params: number;
    tableSize?: number;
    sample: string;
    color: string;
    icon: "table" | "brain";
}

type RacePhase = "ready" | "racing" | "done";

/* ─── Helpers ─── */
function interpolateLoss(data: number[], progress: number): number[] {
    const count = Math.max(1, Math.floor(data.length * progress));
    return data.slice(0, count);
}

function formatNum(n: number): string {
    if (n === 0) return "0";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
}

/* ─── Mini SVG loss chart ─── */
function LossChart({ data, maxSteps, color, yMin, yMax, currentStep }: {
    data: number[]; maxSteps: number; color: string; yMin: number; yMax: number; currentStep?: number;
}) {
    const w = 300, h = 130, px = 32, py = 14;
    const plotW = w - 2 * px, plotH = h - 2 * py;

    const ticks = [yMax, (yMax + yMin) / 2, yMin];

    // Build polyline
    const points = data.length >= 2
        ? data.map((v, i) => {
            const x = px + (i / (maxSteps - 1)) * plotW;
            const y = py + (1 - (v - yMin) / (yMax - yMin)) * plotH;
            return `${x},${y}`;
        }).join(" ")
        : "";

    // Current loss indicator
    const lastVal = data.length > 0 ? data[data.length - 1] : null;
    const lastX = data.length > 0 ? px + ((data.length - 1) / (maxSteps - 1)) * plotW : 0;
    const lastY = lastVal !== null ? py + (1 - (lastVal - yMin) / (yMax - yMin)) * plotH : 0;

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
            {/* grid lines */}
            {ticks.map((tick, i) => {
                const y = py + (1 - (tick - yMin) / (yMax - yMin)) * plotH;
                return (
                    <g key={i}>
                        <line x1={px} y1={y} x2={w - px} y2={y} stroke="white" strokeOpacity={0.06} />
                        <text x={px - 6} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize={8} fontFamily="monospace">
                            {tick.toFixed(1)}
                        </text>
                    </g>
                );
            })}
            {/* axes */}
            <line x1={px} y1={py} x2={px} y2={h - py} stroke="white" strokeOpacity={0.08} />
            <line x1={px} y1={h - py} x2={w - px} y2={h - py} stroke="white" strokeOpacity={0.08} />
            {/* axis labels */}
            <text x={w / 2} y={h - 1} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize={7} fontFamily="monospace">
                training steps
            </text>
            {/* curve */}
            {points && (
                <polyline points={points} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            )}
            {/* end dot + live loss label */}
            {lastVal !== null && data.length >= 2 && (
                <>
                    <circle cx={lastX} cy={lastY} r={4} fill={color} />
                    <rect x={lastX + 6} y={lastY - 9} width={36} height={16} rx={3} fill="rgba(0,0,0,0.6)" />
                    <text x={lastX + 24} y={lastY + 2} textAnchor="middle" fill={color} fontSize={9} fontFamily="monospace" fontWeight="bold">
                        {lastVal.toFixed(2)}
                    </text>
                </>
            )}
            {/* step counter */}
            {currentStep !== undefined && (
                <text x={w - px} y={h - 1} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize={7} fontFamily="monospace">
                    step {currentStep}
                </text>
            )}
        </svg>
    );
}

/* ─── Stat card ─── */
function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
    return (
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-center flex-1 min-w-0">
            <p className="text-[8px] font-mono text-white/25 uppercase tracking-widest mb-0.5">{label}</p>
            <p className="text-sm font-mono font-bold" style={{ color }}>{value}</p>
            {sub && <p className="text-[8px] font-mono text-white/20 mt-0.5">{sub}</p>}
        </div>
    );
}

/* ─── Main Component ─── */
export function TrainingRace4gramVsMLP() {
    const { t } = useI18n();

    const [phase, setPhase] = useState<RacePhase>("ready");
    const [progress, setProgress] = useState(0);
    const [ngramData, setNgramData] = useState<RacerData | null>(null);
    const [mlpData, setMlpData] = useState<RacerData | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);
    const rafRef = useRef<number>(0);
    const startRef = useRef(0);

    const RACE_DURATION = 5000; // ms
    const STEPS = 50;
    const TOTAL_TRAINING_STEPS = 50_000;

    /* ─ Load data from API or fallback ─ */
    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            try {
                const gridRes = await fetchMLPGrid();
                const configs = gridRes.configurations ?? gridRes.configs ?? [];
                if (configs.length === 0) throw new Error("No configs");

                // Pick the one-hot model (embedding_dim === 0)
                const oneHotConfig = configs.find((c: any) => c.embedding_dim === 0);
                if (!oneHotConfig) {
                    console.warn("No model with embedding_dim=0 found, using lowest embedding_dim model");
                }
                const mlpConfig = oneHotConfig
                    || [...configs].sort((a: any, b: any) => a.embedding_dim - b.embedding_dim || a.final_loss - b.final_loss)[0];

                // Fetch timeline for loss curve
                const timeline = await fetchMLPTimeline(
                    mlpConfig.embedding_dim,
                    mlpConfig.hidden_size,
                    mlpConfig.learning_rate,
                );

                const valLoss = timeline.metrics_log?.val_loss ?? [];
                const trainLoss = timeline.metrics_log?.train_loss ?? [];
                const lossCurve = (valLoss.length > 0 ? valLoss : trainLoss).map(e => e.value);
                const downsampledMLP = downsample(lossCurve, STEPS);

                // Generate samples
                let mlpSample = FALLBACK_MLP.sample;
                try {
                    const gen = await generateMLP(mlpConfig.embedding_dim, mlpConfig.hidden_size, mlpConfig.learning_rate, "the", 40, 0.8);
                    mlpSample = gen.generated_text;
                } catch { /* fallback */ }

                let ngramSample = FALLBACK_4GRAM.sample;
                try {
                    const gen = await generateNgram("t", 40, 0.8, 4);
                    ngramSample = gen.generated_text;
                } catch { /* fallback */ }

                const ngramFinalLoss = 1.82;
                const ngramCurve = Array.from({ length: STEPS }, () => ngramFinalLoss);

                if (cancelled) return;

                setNgramData({
                    label: "4-gram",
                    subtitle: "counting · no training",
                    loss: ngramCurve,
                    finalLoss: ngramFinalLoss,
                    params: 0,
                    tableSize: TABLE_ENTRIES,
                    sample: ngramSample,
                    color: "#f59e0b",
                    icon: "table",
                });

                const isRealModel = oneHotConfig !== undefined;
                const modelId = mlpConfig.filename?.replace('.pt', '') || `E${mlpConfig.embedding_dim}_H${mlpConfig.hidden_size}_LR${mlpConfig.learning_rate}`;

                setMlpData({
                    label: `MLP (one-hot)${isRealModel ? "" : " · fallback"}`,
                    subtitle: `${mlpConfig.context_size ?? CONTEXT} chars context · ${mlpConfig.num_layers ?? 1} hidden layers, ${mlpConfig.hidden_size} neurons per layer · ${modelId}`,
                    loss: downsampledMLP,
                    finalLoss: mlpConfig.final_loss,
                    params: mlpConfig.total_parameters,
                    sample: mlpSample,
                    color: "#a78bfa",
                    icon: "brain",
                });

                setLoaded(true);
                setLoading(false);
            } catch {
                if (cancelled) return;
                setNgramData({
                    label: "4-gram",
                    subtitle: "counting · no training",
                    loss: FALLBACK_4GRAM.loss,
                    finalLoss: FALLBACK_4GRAM.finalLoss,
                    params: FALLBACK_4GRAM.params,
                    tableSize: TABLE_ENTRIES,
                    sample: FALLBACK_4GRAM.sample,
                    color: "#f59e0b",
                    icon: "table",
                });
                setMlpData({
                    label: "MLP (one-hot) · fallback",
                    subtitle: `${CONTEXT} chars context · 3 hidden layers, 1024 neurons per layer · API unavailable`,
                    loss: FALLBACK_MLP.loss,
                    finalLoss: FALLBACK_MLP.finalLoss,
                    params: FALLBACK_MLP.params,
                    sample: FALLBACK_MLP.sample,
                    color: "#a78bfa",
                    icon: "brain",
                });
                setLoaded(true);
                setLoading(false);
                setError(true);
            }
        }

        load();
        return () => { cancelled = true; };
    }, []);

    /* ─ Animation loop ─ */
    const animate = useCallback((ts: number) => {
        if (!startRef.current) startRef.current = ts;
        const elapsed = ts - startRef.current;
        const p = Math.min(1, elapsed / RACE_DURATION);
        const eased = 1 - Math.pow(1 - p, 2.5);
        setProgress(eased);

        if (p < 1) {
            rafRef.current = requestAnimationFrame(animate);
        } else {
            setPhase("done");
        }
    }, []);

    const startRace = useCallback(() => {
        setPhase("racing");
        setProgress(0);
        startRef.current = 0;
        rafRef.current = requestAnimationFrame(animate);
    }, [animate]);

    const resetRace = useCallback(() => {
        cancelAnimationFrame(rafRef.current);
        setPhase("ready");
        setProgress(0);
        startRef.current = 0;
    }, []);

    useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

    /* ─ Derived ─ */
    const currentTrainStep = Math.round(progress * TOTAL_TRAINING_STEPS);
    const ngramVisible = useMemo(() => ngramData ? interpolateLoss(ngramData.loss, progress) : [], [ngramData, progress]);
    const mlpVisible = useMemo(() => mlpData ? interpolateLoss(mlpData.loss, progress) : [], [mlpData, progress]);

    const yMin = useMemo(() => {
        if (!ngramData || !mlpData) return 0;
        return Math.floor(Math.min(ngramData.finalLoss, mlpData.finalLoss) * 10 - 1) / 10;
    }, [ngramData, mlpData]);

    const yMax = useMemo(() => {
        if (!ngramData || !mlpData) return 4;
        return Math.ceil(Math.max(ngramData.loss[0] ?? 3.3, mlpData.loss[0] ?? 3.3) * 10 + 1) / 10;
    }, [ngramData, mlpData]);

    const winner = useMemo(() => {
        if (!ngramData || !mlpData || phase !== "done") return null;
        return ngramData.finalLoss < mlpData.finalLoss ? "ngram" : "mlp";
    }, [ngramData, mlpData, phase]);

    if (!loaded) {
        return (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
                <div className="text-sm text-white/30 font-mono">
                    {loading ? "Loading MLP model from backend…" : "Preparing race data…"}
                </div>
                {loading && (
                    <div className="text-[10px] text-white/20 font-mono">
                        Fetching mlp_E0_H1024_LR0.01 (one-hot model)
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* ── Header + controls ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-mono uppercase tracking-widest text-white/40">
                        {t("models.mlp.narrative.s01.raceTitle")}
                    </span>
                    {phase === "racing" && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[10px] font-mono text-white/30 tabular-nums"
                        >
                            step {currentTrainStep.toLocaleString()} / {TOTAL_TRAINING_STEPS.toLocaleString()}
                        </motion.span>
                    )}
                </div>
                <div className="flex gap-2">
                    {phase === "ready" && (
                        <button
                            onClick={startRace}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-xs font-mono font-bold text-violet-300 transition-colors"
                        >
                            <Play className="w-3 h-3" />
                            {t("models.mlp.narrative.s01.raceStart")}
                        </button>
                    )}
                    {phase === "done" && (
                        <button
                            onClick={resetRace}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white/50 transition-colors"
                        >
                            <RotateCcw className="w-3 h-3" />
                            {t("models.mlp.narrative.s01.raceReset")}
                        </button>
                    )}
                </div>
            </div>

            {/* ── Progress bar ── */}
            {phase === "racing" && (
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-violet-500 to-amber-500 rounded-full"
                        style={{ width: `${progress * 100}%` }}
                    />
                </div>
            )}

            {/* ── Race lanes ── */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* 4-gram lane */}
                {ngramData && (
                    <RaceLane
                        data={ngramData}
                        visible={ngramVisible}
                        maxSteps={STEPS}
                        yMin={yMin}
                        yMax={yMax}
                        phase={phase}
                        isWinner={winner === "ngram"}
                        currentStep={phase === "racing" ? currentTrainStep : undefined}
                    />
                )}
                {/* MLP lane */}
                {mlpData && (
                    <RaceLane
                        data={mlpData}
                        visible={mlpVisible}
                        maxSteps={STEPS}
                        yMin={yMin}
                        yMax={yMax}
                        phase={phase}
                        isWinner={winner === "mlp"}
                        currentStep={phase === "racing" ? currentTrainStep : undefined}
                    />
                )}
            </div>

            {/* ── Verdict ── */}
            <AnimatePresence>
                {phase === "done" && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/[0.06] to-amber-500/[0.04] p-4 text-center"
                    >
                        <p className="text-sm text-white/70 leading-relaxed">
                            {winner === "ngram"
                                ? t("models.mlp.narrative.s01.raceVerdictNgramWins")
                                : t("models.mlp.narrative.s01.raceVerdictMlpWins")
                            }
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <p className="text-[10px] text-white/20 text-center font-mono">
                    Using pre-computed data (API unavailable)
                </p>
            )}
        </div>
    );
}

/* ─── Race lane component ─── */
function RaceLane({ data, visible, maxSteps, yMin, yMax, phase, isWinner, currentStep }: {
    data: RacerData;
    visible: number[];
    maxSteps: number;
    yMin: number;
    yMax: number;
    phase: RacePhase;
    isWinner: boolean;
    currentStep?: number;
}) {
    return (
        <div className={`relative rounded-xl border p-4 transition-colors space-y-3 ${isWinner ? (data.icon === "table" ? "border-amber-500/40 bg-amber-500/[0.04]" : "border-violet-500/40 bg-violet-500/[0.04]")
            : "border-white/10 bg-white/[0.02]"
            }`}>
            {isWinner && (
                <div className="absolute -top-2.5 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase"
                    style={{ backgroundColor: data.color + "25", color: data.color }}>
                    <Trophy className="w-3 h-3" /> Winner
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-2">
                {data.icon === "table" ? <Table className="w-4 h-4" style={{ color: data.color }} /> : <BrainCircuit className="w-4 h-4" style={{ color: data.color }} />}
                <div>
                    <span className="text-sm font-mono font-bold text-white/70">{data.label}</span>
                    <p className="text-[9px] font-mono text-white/25">{data.subtitle}</p>
                </div>
            </div>

            {/* Loss chart */}
            <LossChart data={visible} maxSteps={maxSteps} color={data.color} yMin={yMin} yMax={yMax} currentStep={currentStep} />

            {/* Stats — shown after race */}
            <AnimatePresence>
                {phase === "done" && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                    >
                        <div className="flex gap-2">
                            <StatCard label="Final loss" value={data.finalLoss.toFixed(3)} color={data.color} />
                            {data.tableSize ? (
                                <StatCard label="Table size" value={formatNum(data.tableSize)} sub="entries in memory" color={data.color} />
                            ) : (
                                <StatCard label="Parameters" value={formatNum(data.params)} sub="learned weights" color={data.color} />
                            )}
                        </div>
                        <div className="p-2.5 rounded-lg bg-black/20 text-[10px] font-mono text-white/40 leading-relaxed break-all">
                            <span className="text-white/20 text-[9px]">GENERATED TEXT</span>
                            <br />{data.sample}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Downsample utility ─── */
function downsample(arr: number[], target: number): number[] {
    if (arr.length <= target) return arr;
    const result: number[] = [];
    const step = (arr.length - 1) / (target - 1);
    for (let i = 0; i < target; i++) {
        const idx = Math.round(i * step);
        result.push(arr[idx]);
    }
    return result;
}
