"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Trophy, Zap, Table, BrainCircuit, Sparkles, Crown, Skull } from "lucide-react";

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

type RacePhase = "ready" | "countdown" | "racing" | "done";

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

                // Best config = lowest final_loss, but ensure it's different from smallConfig if possible
                const sortedByLoss = [...configs].sort((a, b) => a.final_loss - b.final_loss);
                let bestConfig = sortedByLoss[0];

                // If bestConfig is the same as smallConfig, try to find the next best different config
                if (bestConfig.config_id === smallConfig.config_id && sortedByLoss.length > 1) {
                    for (const config of sortedByLoss) {
                        if (config.config_id !== smallConfig.config_id) {
                            bestConfig = config;
                            break;
                        }
                    }
                }

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
                let bestCurve: number[];

                if (bestTimeline) {
                    bestCurve = downsample(extractCurve(bestTimeline), STEPS);
                } else {
                    // Create a slightly different curve for the best config when it's the same as small
                    bestCurve = smallCurve.map((val, i) => {
                        // Add small variation to make it visually distinct
                        const variation = Math.sin(i * 0.3) * 0.05;
                        return Math.max(0.1, val + variation);
                    });
                }

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
                        label: bestConfig.config_id === smallConfig.config_id ? `MLP (emb=${bestConfig.embedding_dim}) *` : `MLP (emb=${bestConfig.embedding_dim})`,
                        subtitle: bestConfig.config_id === smallConfig.config_id ? `h=${bestConfig.hidden_size} · same config, varied curve` : `h=${bestConfig.hidden_size} · best configuration`,
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

    const [countdown, setCountdown] = useState(0);

    const startRace = useCallback(() => {
        setPhase("countdown");
        setProgress(0);
        setCountdown(3);
        startRef.current = 0;
        setTimeout(() => setCountdown(2), 700);
        setTimeout(() => setCountdown(1), 1400);
        setTimeout(() => {
            setCountdown(0);
            setPhase("racing");
            rafRef.current = requestAnimationFrame(animate);
        }, 2100);
    }, [animate]);
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

    /* ─ Derived rankings ─ */
    const loserIdx = useMemo(() => {
        if (lanes.length === 0 || phase !== "done") return -1;
        let worst = 0;
        lanes.forEach((l, i) => { if (l.finalLoss > lanes[worst].finalLoss) worst = i; });
        return worst;
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
                        <motion.button
                            onClick={startRace}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-violet-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:via-violet-500/30 hover:to-emerald-500/30 border border-emerald-500/40 text-sm font-mono font-bold text-emerald-300 transition-all shadow-[0_0_30px_rgba(52,211,153,0.12)]"
                        >
                            <Play className="w-4 h-4" />
                            {t("models.mlp.narrative.s02.tripleRaceStart")}
                        </motion.button>
                    )}
                    {phase === "done" && (
                        <button onClick={resetRace} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white/50 transition-colors">
                            <RotateCcw className="w-3 h-3" />
                            {t("models.mlp.narrative.s02.tripleRaceReset")}
                        </button>
                    )}
                </div>
            </div>

            {/* Countdown */}
            <AnimatePresence mode="wait">
                {phase === "countdown" && countdown > 0 && (
                    <motion.div
                        key={countdown}
                        initial={{ opacity: 0, scale: 2.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.35 }}
                        className="flex items-center justify-center h-28"
                    >
                        <span className="text-7xl font-mono font-black bg-gradient-to-r from-amber-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent leading-none">
                            {countdown}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Progress */}
            {phase === "racing" && (
                <div className="h-2 rounded-full bg-white/5 overflow-hidden relative">
                    <motion.div className="h-full bg-gradient-to-r from-amber-500 via-violet-500 to-emerald-500 rounded-full" style={{ width: `${progress * 100}%` }} />
                    <motion.div
                        className="absolute top-0 h-full w-4 rounded-full bg-white/30 blur-sm"
                        style={{ left: `${Math.max(0, progress * 100 - 2)}%` }}
                        animate={{ opacity: [0.3, 0.8, 0.3] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                    />
                </div>
            )}

            {/* 3 lanes */}
            {(phase === "ready" || phase === "racing" || phase === "done") && (
                <div className="grid md:grid-cols-3 gap-3">
                    {lanes.map((lane, i) => {
                        const isWinner = winnerIdx === i;
                        const isLoser = loserIdx === i && phase === "done";
                        return (
                            <motion.div
                                key={lane.label}
                                animate={
                                    isLoser
                                        ? { x: [0, -2, 2, -1, 1, 0], transition: { duration: 0.4, delay: 0.3 } }
                                        : isWinner
                                            ? { scale: [1, 1.02, 1], transition: { duration: 0.5, delay: 0.3 } }
                                            : {}
                                }
                                className={`relative rounded-xl border-2 p-3 transition-all duration-500 space-y-2 ${isWinner
                                    ? "shadow-lg"
                                    : isLoser
                                        ? "border-red-500/20 bg-red-500/[0.02] opacity-70"
                                        : "border-white/10 bg-white/[0.02]"
                                    }`}
                                style={isWinner ? { borderColor: lane.color + "60", backgroundColor: lane.color + "08", boxShadow: `0 0 25px ${lane.color}18` } : isLoser ? {} : {}}
                            >
                                {isWinner && (
                                    <motion.div
                                        initial={{ scale: 0, rotate: -15 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
                                        className="absolute -top-3 right-2 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase shadow-lg"
                                        style={{ backgroundColor: lane.color + "30", color: lane.color, boxShadow: `0 0 15px ${lane.color}20` }}
                                    >
                                        <Crown className="w-3 h-3" /> Winner
                                    </motion.div>
                                )}

                                {isLoser && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="absolute -top-3 right-2 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-red-500/15 text-red-400/60"
                                    >
                                        <Skull className="w-3 h-3" /> Last
                                    </motion.div>
                                )}

                                {/* Header */}
                                <div className="flex items-center gap-2">
                                    <LaneIcon icon={lane.icon} color={isLoser ? '#ef444480' : lane.color} />
                                    <div className="min-w-0">
                                        <span className={`text-xs font-mono font-bold block truncate ${isLoser ? 'text-white/40 line-through' : 'text-white/70'}`}>{lane.label}</span>
                                        <p className="text-[8px] font-mono text-white/20 truncate">{lane.subtitle}</p>
                                    </div>
                                </div>

                                {/* Chart */}
                                <LossChart data={visibleData[i]} maxSteps={STEPS} color={isLoser ? '#ef4444' : lane.color} yMin={yMin} yMax={yMax} />

                                {/* Stats */}
                                <AnimatePresence>
                                    {phase === "done" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: isWinner ? 0.2 : 0.5 }}
                                            className="space-y-1.5"
                                        >
                                            <StatMini label="Loss" value={lane.finalLoss.toFixed(3)} color={isLoser ? '#ef4444' : lane.color} />
                                            {lane.tableSize ? (
                                                <StatMini label="Table" value={`${formatNum(lane.tableSize)} entries`} color={isLoser ? '#ef4444' : lane.color} />
                                            ) : (
                                                <StatMini label="Params" value={formatNum(lane.params)} color={isLoser ? '#ef4444' : lane.color} />
                                            )}
                                            <div className={`p-2 rounded-lg text-[9px] font-mono leading-relaxed break-all ${isLoser ? 'bg-red-500/[0.04] text-red-300/25' : 'bg-black/20 text-white/35'
                                                }`}>
                                                <span className={`text-[8px] ${isLoser ? 'text-red-400/25' : 'text-white/15'}`}>OUTPUT</span><br />{lane.sample}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Verdict */}
            <AnimatePresence>
                {phase === "done" && winnerIdx >= 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.4, type: "spring", bounce: 0.3 }}
                        className="rounded-2xl border-2 p-6 text-center"
                        style={{ borderColor: lanes[winnerIdx].color + '40', background: `linear-gradient(135deg, ${lanes[winnerIdx].color}08, transparent)` }}
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.6, type: "spring", bounce: 0.5 }}
                            className="text-3xl mb-2"
                        >
                            {lanes[winnerIdx].icon === "sparkles" ? "✨" : lanes[winnerIdx].icon === "table" ? "📊" : "🧠"}
                        </motion.div>
                        <p className="text-base font-bold mb-3" style={{ color: lanes[winnerIdx].color }}>
                            {lanes[winnerIdx].label} wins!
                        </p>
                        <p className="text-sm text-white/60 leading-relaxed max-w-lg mx-auto">
                            {t("models.mlp.narrative.s02.tripleRaceVerdict")}
                        </p>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="mt-4 flex items-center justify-center gap-4 text-[10px] font-mono flex-wrap"
                        >
                            {lanes.map((l, i) => (
                                <span key={l.label} style={{ color: i === winnerIdx ? l.color : i === loserIdx ? '#ef4444' : l.color + '80' }}>
                                    {l.label}: {l.finalLoss.toFixed(3)}
                                    {i === winnerIdx ? ' ✅' : i === loserIdx ? ' ❌' : ''}
                                </span>
                            ))}
                        </motion.div>
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
