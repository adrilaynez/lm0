"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Trophy, Zap, Table, BrainCircuit, Sparkles } from "lucide-react";

import { fetchMLPGrid, fetchMLPTimeline, generateNgram, generateMLP } from "@/lib/lmLabClient";
import { useI18n } from "@/i18n/context";

/*
  TripleModelRace
  3-way animated race: 4-gram vs MLP(emb_dim=2) vs MLP(best config).
  Shows loss curves, final stats, generated text samples.
*/

/* ─── Constants ─── */
const VOCAB = 27;
const CONTEXT = 4;
const TABLE_ENTRIES = Math.pow(VOCAB, CONTEXT); // 531,441

/* ─── Fallback data ─── */
const FALLBACK_NGRAM = {
    loss: Array.from({ length: 50 }, () => 1.82),
    finalLoss: 1.82,
    params: 0,
    tableSize: TABLE_ENTRIES,
    sample: "the king was in the cou.rtyard and the",
};
const FALLBACK_MLP_SMALL = {
    loss: Array.from({ length: 50 }, (_, i) => 3.3 - 1.2 * (1 - Math.exp(-i / 15))),
    finalLoss: 2.10,
    params: 11_000,
    sample: "the mont and the sain.t ofed the kin",
};
const FALLBACK_MLP_BEST = {
    loss: Array.from({ length: 50 }, (_, i) => 3.3 - 1.5 * (1 - Math.exp(-i / 12))),
    finalLoss: 1.80,
    params: 35_000,
    sample: "the mountain.s and the saint of the king",
};

/* ─── Types ─── */
interface LaneData {
    label: string;
    subtitle: string;
    loss: number[];
    finalLoss: number;
    params: number;
    tableSize?: number;
    sample: string;
    color: string;
    icon: "table" | "brain" | "sparkles";
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

/* ─── SVG Loss Chart ─── */
function LossChart({ data, maxSteps, color, yMin, yMax }: {
    data: number[]; maxSteps: number; color: string; yMin: number; yMax: number;
}) {
    const w = 220, h = 100, px = 26, py = 10;
    const plotW = w - 2 * px, plotH = h - 2 * py;
    const ticks = [yMax, (yMax + yMin) / 2, yMin];

    const points = data.length >= 2
        ? data.map((v, i) => {
            const x = px + (i / (maxSteps - 1)) * plotW;
            const y = py + (1 - (v - yMin) / (yMax - yMin)) * plotH;
            return `${x},${y}`;
        }).join(" ")
        : "";

    const lastVal = data.length > 0 ? data[data.length - 1] : null;
    const lastX = data.length > 0 ? px + ((data.length - 1) / (maxSteps - 1)) * plotW : 0;
    const lastY = lastVal !== null ? py + (1 - (lastVal - yMin) / (yMax - yMin)) * plotH : 0;

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
            {ticks.map((tick, i) => {
                const y = py + (1 - (tick - yMin) / (yMax - yMin)) * plotH;
                return (
                    <g key={i}>
                        <line x1={px} y1={y} x2={w - px} y2={y} stroke="white" strokeOpacity={0.06} />
                        <text x={px - 4} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize={7} fontFamily="monospace">
                            {tick.toFixed(1)}
                        </text>
                    </g>
                );
            })}
            <line x1={px} y1={py} x2={px} y2={h - py} stroke="white" strokeOpacity={0.08} />
            <line x1={px} y1={h - py} x2={w - px} y2={h - py} stroke="white" strokeOpacity={0.08} />
            {points && (
                <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            )}
            {lastVal !== null && data.length >= 2 && (
                <>
                    <circle cx={lastX} cy={lastY} r={3} fill={color} />
                    <rect x={lastX + 5} y={lastY - 8} width={32} height={14} rx={3} fill="rgba(0,0,0,0.6)" />
                    <text x={lastX + 21} y={lastY + 1} textAnchor="middle" fill={color} fontSize={8} fontFamily="monospace" fontWeight="bold">
                        {lastVal.toFixed(2)}
                    </text>
                </>
            )}
        </svg>
    );
}

/* ─── Stat mini ─── */
function StatMini({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="flex justify-between text-[10px]">
            <span className="text-white/30 font-mono">{label}</span>
            <span className="font-mono font-bold" style={{ color }}>{value}</span>
        </div>
    );
}

/* ─── Main ─── */
export function TripleModelRace() {
    const { t } = useI18n();

    const [phase, setPhase] = useState<RacePhase>("ready");
    const [progress, setProgress] = useState(0);
    const [lanes, setLanes] = useState<LaneData[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const rafRef = useRef<number>(0);
    const startRef = useRef(0);

    const RACE_DURATION = 6000;
    const STEPS = 50;
    const TOTAL_STEPS = 50_000;

    /* ─ Load data ─ */
    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const gridRes = await fetchMLPGrid();
                const configs = gridRes.configurations ?? gridRes.configs ?? [];
                if (configs.length === 0) throw new Error("No configs");

                // Sort by embedding_dim ascending (exclude embedding_dim=0), pick smallest as "small emb"
                const withEmbeddings = configs.filter(c => c.embedding_dim > 0);
                const sorted = [...withEmbeddings].sort((a, b) => a.embedding_dim - b.embedding_dim || a.final_loss - b.final_loss);
                const smallConfig = sorted[0];

                // Best config = lowest final_loss
                const bestConfig = [...configs].sort((a, b) => a.final_loss - b.final_loss)[0];

                // Fetch timelines
                const [smallTimeline, bestTimeline] = await Promise.all([
                    fetchMLPTimeline(smallConfig.embedding_dim, smallConfig.hidden_size, smallConfig.learning_rate),
                    smallConfig.config_id !== bestConfig.config_id
                        ? fetchMLPTimeline(bestConfig.embedding_dim, bestConfig.hidden_size, bestConfig.learning_rate)
                        : Promise.resolve(null),
                ]);

                const extractCurve = (tl: { metrics_log?: { val_loss?: { value: number }[]; train_loss?: { value: number }[] } }) => {
                    const vl = tl.metrics_log?.val_loss ?? [];
                    const tr = tl.metrics_log?.train_loss ?? [];
                    return (vl.length > 0 ? vl : tr).map(e => e.value);
                };

                const smallCurve = downsample(extractCurve(smallTimeline), STEPS);
                const bestCurve = bestTimeline ? downsample(extractCurve(bestTimeline), STEPS) : downsample(extractCurve(smallTimeline), STEPS);

                // Generate samples
                let ngramSample = FALLBACK_NGRAM.sample;
                try { const g = await generateNgram("t", 40, 0.8, 4); ngramSample = g.generated_text; } catch { /* */ }

                let smallSample = FALLBACK_MLP_SMALL.sample;
                try { const g = await generateMLP(smallConfig.embedding_dim, smallConfig.hidden_size, smallConfig.learning_rate, "the", 40, 0.8); smallSample = g.generated_text; } catch { /* */ }

                let bestSample = FALLBACK_MLP_BEST.sample;
                if (smallConfig.config_id !== bestConfig.config_id) {
                    try { const g = await generateMLP(bestConfig.embedding_dim, bestConfig.hidden_size, bestConfig.learning_rate, "the", 40, 0.8); bestSample = g.generated_text; } catch { /* */ }
                } else {
                    bestSample = smallSample;
                }

                if (cancelled) return;

                const ngramFinalLoss = 1.82;
                setLanes([
                    {
                        label: "4-gram",
                        subtitle: "counting · instant",
                        loss: Array.from({ length: STEPS }, () => ngramFinalLoss),
                        finalLoss: ngramFinalLoss,
                        params: 0,
                        tableSize: TABLE_ENTRIES,
                        sample: ngramSample,
                        color: "#f59e0b",
                        icon: "table",
                    },
                    {
                        label: smallConfig.embedding_dim === 0 ? "MLP (no emb)" : `MLP (emb=${smallConfig.embedding_dim})`,
                        subtitle: smallConfig.embedding_dim === 0 ? `h=${smallConfig.hidden_size} · no embeddings · 3 layers` : `h=${smallConfig.hidden_size} · smallest embedding`,
                        loss: smallCurve,
                        finalLoss: smallConfig.final_loss,
                        params: smallConfig.total_parameters,
                        sample: smallSample,
                        color: "#a78bfa",
                        icon: "brain",
                    },
                    {
                        label: `MLP (emb=${bestConfig.embedding_dim})`,
                        subtitle: `h=${bestConfig.hidden_size} · best configuration`,
                        loss: bestCurve,
                        finalLoss: bestConfig.final_loss,
                        params: bestConfig.total_parameters,
                        sample: bestSample,
                        color: "#34d399",
                        icon: "sparkles",
                    },
                ]);
                setLoaded(true);
            } catch {
                if (cancelled) return;
                setLanes([
                    {
                        label: "4-gram",
                        subtitle: "counting · instant",
                        loss: FALLBACK_NGRAM.loss,
                        finalLoss: FALLBACK_NGRAM.finalLoss,
                        params: 0,
                        tableSize: TABLE_ENTRIES,
                        sample: FALLBACK_NGRAM.sample,
                        color: "#f59e0b",
                        icon: "table",
                    },
                    {
                        label: "MLP (no emb)",
                        subtitle: "h=64 · no embeddings · 3 layers",
                        loss: FALLBACK_MLP_SMALL.loss,
                        finalLoss: FALLBACK_MLP_SMALL.finalLoss,
                        params: FALLBACK_MLP_SMALL.params,
                        sample: FALLBACK_MLP_SMALL.sample,
                        color: "#a78bfa",
                        icon: "brain",
                    },
                    {
                        label: "MLP (emb=32)",
                        subtitle: "h=128 · best configuration",
                        loss: FALLBACK_MLP_BEST.loss,
                        finalLoss: FALLBACK_MLP_BEST.finalLoss,
                        params: FALLBACK_MLP_BEST.params,
                        sample: FALLBACK_MLP_BEST.sample,
                        color: "#34d399",
                        icon: "sparkles",
                    },
                ]);
                setLoaded(true);
                setError(true);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    /* ─ Animation ─ */
    const animate = useCallback((ts: number) => {
        if (!startRef.current) startRef.current = ts;
        const elapsed = ts - startRef.current;
        const p = Math.min(1, elapsed / RACE_DURATION);
        setProgress(1 - Math.pow(1 - p, 2.5));
        if (p < 1) rafRef.current = requestAnimationFrame(animate);
        else setPhase("done");
    }, []);

    const startRace = useCallback(() => { setPhase("racing"); setProgress(0); startRef.current = 0; rafRef.current = requestAnimationFrame(animate); }, [animate]);
    const resetRace = useCallback(() => { cancelAnimationFrame(rafRef.current); setPhase("ready"); setProgress(0); startRef.current = 0; }, []);
    useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

    /* ─ Derived ─ */
    const currentStep = Math.round(progress * TOTAL_STEPS);
    const visibleData = useMemo(() => lanes.map(l => interpolateLoss(l.loss, progress)), [lanes, progress]);

    const yMin = useMemo(() => {
        if (lanes.length === 0) return 0;
        return Math.floor(Math.min(...lanes.map(l => l.finalLoss)) * 10 - 1) / 10;
    }, [lanes]);

    const yMax = useMemo(() => {
        if (lanes.length === 0) return 4;
        return Math.ceil(Math.max(...lanes.map(l => l.loss[0] ?? 3.3)) * 10 + 1) / 10;
    }, [lanes]);

    const winnerIdx = useMemo(() => {
        if (lanes.length === 0 || phase !== "done") return -1;
        let best = 0;
        lanes.forEach((l, i) => { if (l.finalLoss < lanes[best].finalLoss) best = i; });
        return best;
    }, [lanes, phase]);

    if (!loaded) {
        return <div className="flex items-center justify-center h-48 text-sm text-white/30 font-mono">Loading race data…</div>;
    }

    const LaneIcon = ({ icon, color }: { icon: string; color: string }) => {
        if (icon === "table") return <Table className="w-4 h-4" style={{ color }} />;
        if (icon === "sparkles") return <Sparkles className="w-4 h-4" style={{ color }} />;
        return <BrainCircuit className="w-4 h-4" style={{ color }} />;
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono uppercase tracking-widest text-white/40">
                        {t("models.mlp.narrative.s02.tripleRaceTitle")}
                    </span>
                    {phase === "racing" && (
                        <span className="text-[10px] font-mono text-white/25 tabular-nums">
                            step {currentStep.toLocaleString()} / {TOTAL_STEPS.toLocaleString()}
                        </span>
                    )}
                </div>
                <div className="flex gap-2">
                    {phase === "ready" && (
                        <button onClick={startRace} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-300 transition-colors">
                            <Play className="w-3 h-3" />
                            {t("models.mlp.narrative.s02.tripleRaceStart")}
                        </button>
                    )}
                    {phase === "done" && (
                        <button onClick={resetRace} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white/50 transition-colors">
                            <RotateCcw className="w-3 h-3" />
                            {t("models.mlp.narrative.s02.tripleRaceReset")}
                        </button>
                    )}
                </div>
            </div>

            {/* Progress */}
            {phase === "racing" && (
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-amber-500 via-violet-500 to-emerald-500 rounded-full" style={{ width: `${progress * 100}%` }} />
                </div>
            )}

            {/* 3 lanes */}
            <div className="grid md:grid-cols-3 gap-3">
                {lanes.map((lane, i) => (
                    <div
                        key={lane.label}
                        className={`relative rounded-xl border p-3 transition-colors space-y-2 ${winnerIdx === i
                            ? `border-[${lane.color}]/40 bg-[${lane.color}]/[0.04]`
                            : "border-white/10 bg-white/[0.02]"
                            }`}
                        style={winnerIdx === i ? { borderColor: lane.color + "60", backgroundColor: lane.color + "08" } : {}}
                    >
                        {winnerIdx === i && (
                            <div className="absolute -top-2.5 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase"
                                style={{ backgroundColor: lane.color + "25", color: lane.color }}>
                                <Trophy className="w-3 h-3" /> Winner
                            </div>
                        )}

                        {/* Header */}
                        <div className="flex items-center gap-2">
                            <LaneIcon icon={lane.icon} color={lane.color} />
                            <div className="min-w-0">
                                <span className="text-xs font-mono font-bold text-white/70 block truncate">{lane.label}</span>
                                <p className="text-[8px] font-mono text-white/20 truncate">{lane.subtitle}</p>
                            </div>
                        </div>

                        {/* Chart */}
                        <LossChart data={visibleData[i]} maxSteps={STEPS} color={lane.color} yMin={yMin} yMax={yMax} />

                        {/* Stats */}
                        <AnimatePresence>
                            {phase === "done" && (
                                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                                    <StatMini label="Loss" value={lane.finalLoss.toFixed(3)} color={lane.color} />
                                    {lane.tableSize ? (
                                        <StatMini label="Table" value={`${formatNum(lane.tableSize)} entries`} color={lane.color} />
                                    ) : (
                                        <StatMini label="Params" value={formatNum(lane.params)} color={lane.color} />
                                    )}
                                    <div className="p-2 rounded-lg bg-black/20 text-[9px] font-mono text-white/35 leading-relaxed break-all">
                                        <span className="text-white/15 text-[8px]">OUTPUT</span><br />{lane.sample}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {/* Verdict */}
            <AnimatePresence>
                {phase === "done" && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="rounded-xl border border-emerald-500/20 bg-gradient-to-r from-amber-500/[0.04] via-violet-500/[0.06] to-emerald-500/[0.06] p-4 text-center"
                    >
                        <p className="text-sm text-white/70 leading-relaxed">
                            {t("models.mlp.narrative.s02.tripleRaceVerdict")}
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

function downsample(arr: number[], target: number): number[] {
    if (arr.length <= target) return arr;
    const result: number[] = [];
    const step = (arr.length - 1) / (target - 1);
    for (let i = 0; i < target; i++) result.push(arr[Math.round(i * step)]);
    return result;
}
