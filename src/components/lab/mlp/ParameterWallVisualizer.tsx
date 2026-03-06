"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Skull, TrendingDown, Zap } from "lucide-react";

import type { MLPGridConfig } from "@/types/lmLab";

/* ─────────────────────────────────────────────────────────
   ParameterWallVisualizer v2
   
   Rich interactive scatter: total_params (x) vs val_loss (y).
   Features: filter buttons, click-to-select detail panel,
   Pareto frontier, best/worst comparison, wall gradient.
   ───────────────────────────────────────────────────────── */

type ColorBy = "emb_dim" | "learning_rate" | "hidden_size";
type FilterMode = "all" | "best" | "worst" | "anomalies";

const EMB_COLORS: Record<number, string> = {
    2: "#f43f5e", 3: "#f97316", 6: "#eab308", 10: "#22c55e", 16: "#3b82f6", 32: "#8b5cf6",
};
const LR_COLORS: Record<number, string> = {
    0.001: "#22d3ee", 0.01: "#22c55e", 0.1: "#eab308", 0.2: "#f43f5e",
};
const HS_COLORS: Record<number, string> = {
    32: "#f43f5e", 64: "#f97316", 128: "#eab308", 256: "#22c55e", 512: "#3b82f6", 1024: "#8b5cf6",
};

function getColor(c: MLPGridConfig, colorBy: ColorBy): string {
    if (colorBy === "emb_dim") return EMB_COLORS[c.embedding_dim] ?? "#6b7280";
    if (colorBy === "hidden_size") return HS_COLORS[c.hidden_size] ?? "#6b7280";
    return LR_COLORS[c.learning_rate] ?? "#6b7280";
}

function fmtP(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
}

function computePareto(configs: MLPGridConfig[]): MLPGridConfig[] {
    const sorted = [...configs].sort((a, b) => a.total_parameters! - b.total_parameters!);
    const frontier: MLPGridConfig[] = [];
    let bestSoFar = Infinity;
    for (const c of sorted) {
        if (c.final_loss < bestSoFar) {
            bestSoFar = c.final_loss;
            frontier.push(c);
        }
    }
    return frontier;
}

export function ParameterWallVisualizer({ configs }: { configs: MLPGridConfig[] }) {
    const [colorBy, setColorBy] = useState<ColorBy>("emb_dim");
    const [filter, setFilter] = useState<FilterMode>("all");
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    const validConfigs = useMemo(() =>
        configs.filter(c => c.embedding_dim > 0 && c.total_parameters != null && c.total_parameters > 0 && c.final_loss < 10),
        [configs]);

    const bestLoss = useMemo(() => Math.min(...validConfigs.map(c => c.final_loss)), [validConfigs]);
    const worstLoss = useMemo(() => Math.max(...validConfigs.map(c => c.final_loss)), [validConfigs]);
    const bestConfig = useMemo(() => validConfigs.find(c => c.final_loss === bestLoss) ?? null, [validConfigs, bestLoss]);
    const worstConfig = useMemo(() => validConfigs.find(c => c.final_loss === worstLoss) ?? null, [validConfigs, worstLoss]);
    const paretoLine = useMemo(() => computePareto(validConfigs), [validConfigs]);

    // Compute "sweet spot" — smallest model within 5% of best loss
    const sweetSpot = useMemo(() => {
        const threshold = bestLoss * 1.05;
        const candidates = validConfigs.filter(c => c.final_loss <= threshold);
        return candidates.reduce((best, c) => c.total_parameters! < best.total_parameters! ? c : best, candidates[0]);
    }, [validConfigs, bestLoss]);

    // Filtered configs
    const displayConfigs = useMemo(() => {
        switch (filter) {
            case "best": return validConfigs.filter(c => c.final_loss < bestLoss * 1.15).sort((a, b) => a.final_loss - b.final_loss).slice(0, 15);
            case "worst": return validConfigs.filter(c => c.final_loss > worstLoss * 0.85).sort((a, b) => b.final_loss - a.final_loss).slice(0, 15);
            case "anomalies": {
                const expected = validConfigs[0]?.expected_uniform_loss;
                return validConfigs.filter(c => {
                    const gap = (c.generalization_gap ?? 0);
                    return gap > 0.15 || (expected != null && c.final_loss > expected * 0.9) || c.final_loss > 4;
                });
            }
            default: return validConfigs;
        }
    }, [validConfigs, filter, bestLoss, worstLoss]);

    // Axis ranges
    const { minParams, maxParams, minLoss, maxLoss } = useMemo(() => {
        const params = validConfigs.map(c => c.total_parameters!);
        const losses = validConfigs.map(c => c.final_loss);
        return { minParams: Math.min(...params), maxParams: Math.max(...params), minLoss: Math.min(...losses) * 0.95, maxLoss: Math.max(...losses) * 1.05 };
    }, [validConfigs]);

    // SVG layout
    const W = 520, H = 300, padL = 48, padR = 16, padT = 16, padB = 36;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const logMin = Math.log10(minParams), logMax = Math.log10(maxParams), logRange = logMax - logMin || 1;
    const toX = (p: number) => padL + ((Math.log10(p) - logMin) / logRange) * plotW;
    const toY = (l: number) => padT + ((l - minLoss) / (maxLoss - minLoss)) * plotH;

    const wallY = toY(bestLoss + 0.03);

    // Ticks
    const paramTicks = useMemo(() => {
        const ticks: number[] = [];
        for (const p of [3, 3.5, 4, 4.5, 5, 5.5, 6]) {
            const val = Math.pow(10, p);
            if (val >= minParams * 0.5 && val <= maxParams * 2) ticks.push(val);
        }
        return ticks;
    }, [minParams, maxParams]);
    const lossTicks = useMemo(() => {
        const range = maxLoss - minLoss;
        const step = range < 1 ? 0.2 : range < 2 ? 0.5 : 1;
        const ticks: number[] = [];
        let v = Math.ceil(minLoss / step) * step;
        while (v <= maxLoss) { ticks.push(v); v += step; }
        return ticks;
    }, [minLoss, maxLoss]);

    // Pareto path
    const paretoPath = useMemo(() => {
        if (paretoLine.length < 2) return "";
        return paretoLine.map((c, i) => `${i === 0 ? "M" : "L"}${toX(c.total_parameters!).toFixed(1)},${toY(c.final_loss).toFixed(1)}`).join(" ");
    }, [paretoLine, toX, toY]);

    // Wall param (where best models start)
    const wallParam = useMemo(() => {
        const nearBest = validConfigs.filter(c => c.final_loss < bestLoss + 0.1);
        return nearBest.reduce((min, c) => Math.min(min, c.total_parameters!), Infinity);
    }, [validConfigs, bestLoss]);

    const selectedConfig = selectedIdx != null ? displayConfigs[selectedIdx] : null;
    const activeIdx = hoveredIdx ?? selectedIdx;

    const colorOptions: { key: ColorBy; label: string }[] = [
        { key: "emb_dim", label: "Embedding" },
        { key: "hidden_size", label: "Hidden" },
        { key: "learning_rate", label: "LR" },
    ];
    const filterOptions: { key: FilterMode; label: string; icon: React.ReactNode }[] = [
        { key: "all", label: "All", icon: null },
        { key: "best", label: `Best ${filter === "best" ? displayConfigs.length : "★"}`, icon: <Trophy className="w-2.5 h-2.5" /> },
        { key: "worst", label: "Worst", icon: <Skull className="w-2.5 h-2.5" /> },
        { key: "anomalies", label: "Anomalies", icon: <Zap className="w-2.5 h-2.5" /> },
    ];

    // Color legend
    const legendMap = colorBy === "emb_dim" ? EMB_COLORS : colorBy === "hidden_size" ? HS_COLORS : LR_COLORS;
    const legendPrefix = colorBy === "emb_dim" ? "E=" : colorBy === "hidden_size" ? "H=" : "lr=";

    if (validConfigs.length < 5) return <div className="p-6 text-center text-white/20 text-sm font-mono">Loading model data...</div>;

    return (
        <div className="space-y-4">
            {/* Controls row */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Filters */}
                <div className="flex gap-1">
                    {filterOptions.map(f => (
                        <button key={f.key} onClick={() => { setFilter(f.key); setSelectedIdx(null); }}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[8px] font-mono font-bold uppercase tracking-wider transition-all ${filter === f.key
                                    ? "bg-violet-500/15 border border-violet-500/30 text-violet-300"
                                    : "bg-white/[0.03] border border-white/[0.06] text-white/25 hover:text-white/40"
                                }`}>
                            {f.icon}{f.label}
                        </button>
                    ))}
                </div>
                {/* Color by */}
                <div className="flex gap-1 items-center">
                    <span className="text-[7px] text-white/15 font-mono mr-1">COLOR</span>
                    {colorOptions.map(opt => (
                        <button key={opt.key} onClick={() => setColorBy(opt.key)}
                            className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold transition-all ${colorBy === opt.key ? "bg-white/10 text-white/60" : "text-white/20 hover:text-white/40"
                                }`}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
                {Object.entries(legendMap).map(([k, color]) => (
                    <div key={k} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, opacity: 0.7 }} />
                        <span className="text-[7px] font-mono text-white/25">{legendPrefix}{k}</span>
                    </div>
                ))}
            </div>

            {/* SVG Chart */}
            <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-black/60 to-black/30 p-3 relative overflow-hidden">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 340 }}>
                    <defs>
                        <linearGradient id="wall-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(251,113,133,0.08)" />
                            <stop offset="100%" stopColor="rgba(251,113,133,0)" />
                        </linearGradient>
                        <linearGradient id="pareto-grad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="rgba(139,92,246,0.6)" />
                            <stop offset="100%" stopColor="rgba(52,211,153,0.6)" />
                        </linearGradient>
                    </defs>

                    {/* Grid */}
                    {lossTicks.map(l => (
                        <g key={`gl-${l}`}>
                            <line x1={padL} y1={toY(l)} x2={W - padR} y2={toY(l)} stroke="rgba(255,255,255,0.04)" />
                            <text x={padL - 6} y={toY(l) + 3} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize={8} fontFamily="monospace">{l.toFixed(1)}</text>
                        </g>
                    ))}
                    {paramTicks.map(p => (
                        <g key={`gp-${p}`}>
                            <line x1={toX(p)} y1={padT} x2={toX(p)} y2={H - padB} stroke="rgba(255,255,255,0.04)" />
                            <text x={toX(p)} y={H - padB + 13} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={7} fontFamily="monospace">{fmtP(p)}</text>
                        </g>
                    ))}

                    {/* Diminishing returns zone */}
                    {wallParam < Infinity && (
                        <rect x={toX(wallParam)} y={padT} width={W - padR - toX(wallParam)} height={plotH} fill="url(#wall-grad)" />
                    )}

                    {/* Wall line */}
                    <line x1={padL} y1={wallY} x2={W - padR} y2={wallY} stroke="rgba(251,113,133,0.4)" strokeWidth={1.5} strokeDasharray="8 5" />
                    <rect x={W - padR - 118} y={wallY - 16} width={114} height={14} rx={3} fill="rgba(251,113,133,0.12)" />
                    <text x={W - padR - 61} y={wallY - 6} textAnchor="middle" fill="rgba(251,113,133,0.7)" fontSize={8} fontFamily="monospace" fontWeight={700}>
                        THE WALL · {bestLoss.toFixed(2)}
                    </text>

                    {/* Pareto frontier */}
                    {paretoPath && (
                        <path d={paretoPath} fill="none" stroke="url(#pareto-grad)" strokeWidth={2} strokeDasharray="4 3" opacity={0.6} />
                    )}

                    {/* Data points (dimmed if not in filter, but still show all as bg) */}
                    {filter !== "all" && validConfigs.map((c, i) => {
                        const inDisplay = displayConfigs.includes(c);
                        if (inDisplay) return null;
                        return (
                            <circle key={`bg-${i}`} cx={toX(c.total_parameters!)} cy={toY(c.final_loss)} r={2.5}
                                fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.03)" strokeWidth={0.5} />
                        );
                    })}

                    {/* Active data points */}
                    {displayConfigs.map((c, i) => {
                        const cx = toX(c.total_parameters!);
                        const cy = toY(c.final_loss);
                        const color = getColor(c, colorBy);
                        const isActive = activeIdx === i;
                        const isSelected = selectedIdx === i;
                        const isBest = c === bestConfig;
                        const isWorst = c === worstConfig;
                        const isSweet = c === sweetSpot;
                        return (
                            <g key={i}
                                onMouseEnter={() => setHoveredIdx(i)}
                                onMouseLeave={() => setHoveredIdx(null)}
                                onClick={() => setSelectedIdx(selectedIdx === i ? null : i)}
                                style={{ cursor: "pointer" }}
                            >
                                {/* Glow ring for special models */}
                                {(isBest || isSweet) && (
                                    <circle cx={cx} cy={cy} r={10} fill="none" stroke={isBest ? "rgba(52,211,153,0.3)" : "rgba(139,92,246,0.3)"}
                                        strokeWidth={1.5} strokeDasharray="3 2" />
                                )}
                                {isWorst && (
                                    <circle cx={cx} cy={cy} r={10} fill="none" stroke="rgba(244,63,94,0.3)" strokeWidth={1.5} strokeDasharray="3 2" />
                                )}
                                <motion.circle
                                    cx={cx} cy={cy}
                                    r={isActive ? 7 : isSelected ? 6 : isBest || isWorst || isSweet ? 5 : 3.5}
                                    fill={color}
                                    fillOpacity={isActive ? 0.95 : 0.55}
                                    stroke={isActive || isSelected ? "white" : color}
                                    strokeWidth={isActive || isSelected ? 2 : 0.8}
                                    strokeOpacity={isActive ? 0.9 : 0.3}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: i * 0.004, duration: 0.25 }}
                                />
                                {/* Label for best/worst/sweet */}
                                {isBest && !isActive && (
                                    <text x={cx} y={cy - 12} textAnchor="middle" fill="rgba(52,211,153,0.7)" fontSize={7} fontFamily="monospace" fontWeight={700}>★ BEST</text>
                                )}
                                {isSweet && !isBest && !isActive && (
                                    <text x={cx} y={cy - 12} textAnchor="middle" fill="rgba(139,92,246,0.7)" fontSize={7} fontFamily="monospace" fontWeight={700}>⚡ SWEET</text>
                                )}
                                {isWorst && !isActive && (
                                    <text x={cx} y={cy - 12} textAnchor="middle" fill="rgba(244,63,94,0.6)" fontSize={7} fontFamily="monospace">worst</text>
                                )}
                                {/* Hover tooltip */}
                                {isActive && (
                                    <g>
                                        <rect x={Math.min(cx + 10, W - 140)} y={Math.max(cy - 38, padT)} width={126} height={58} rx={8}
                                            fill="rgba(0,0,0,0.92)" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
                                        <text x={Math.min(cx + 18, W - 132)} y={Math.max(cy - 22, padT + 16)} fill="rgba(255,255,255,0.8)" fontSize={9} fontFamily="monospace" fontWeight={700}>
                                            E={c.embedding_dim} H={c.hidden_size}
                                        </text>
                                        <text x={Math.min(cx + 18, W - 132)} y={Math.max(cy - 9, padT + 29)} fill="rgba(255,255,255,0.4)" fontSize={8} fontFamily="monospace">
                                            lr={c.learning_rate} · {fmtP(c.total_parameters!)}
                                        </text>
                                        <text x={Math.min(cx + 18, W - 132)} y={Math.max(cy + 4, padT + 42)} fill={color} fontSize={10} fontFamily="monospace" fontWeight={700}>
                                            loss = {c.final_loss.toFixed(3)}
                                        </text>
                                        {c.generalization_gap != null && (
                                            <text x={Math.min(cx + 18, W - 132)} y={Math.max(cy + 16, padT + 54)} fill="rgba(251,191,36,0.5)" fontSize={7} fontFamily="monospace">
                                                gap = {c.generalization_gap.toFixed(3)}
                                            </text>
                                        )}
                                    </g>
                                )}
                            </g>
                        );
                    })}

                    {/* Axis labels */}
                    <text x={W / 2} y={H - 2} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={8} fontFamily="monospace">
                        Total Parameters (log scale)
                    </text>
                    <text x={10} y={H / 2} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={8} fontFamily="monospace" transform={`rotate(-90, 10, ${H / 2})`}>
                        Val Loss
                    </text>

                    {/* Pareto label */}
                    {paretoLine.length > 1 && (
                        <text x={toX(paretoLine[paretoLine.length - 1].total_parameters!) + 4} y={toY(paretoLine[paretoLine.length - 1].final_loss) - 6}
                            fill="rgba(139,92,246,0.5)" fontSize={7} fontFamily="monospace">Pareto frontier</text>
                    )}
                </svg>
            </div>

            {/* Selected config detail panel */}
            <AnimatePresence mode="wait">
                {selectedConfig && (
                    <motion.div
                        key={selectedIdx}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        className="rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-4 space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-violet-300">
                                E={selectedConfig.embedding_dim} · H={selectedConfig.hidden_size} · lr={selectedConfig.learning_rate}
                            </span>
                            <button onClick={() => setSelectedIdx(null)} className="text-[9px] text-white/20 hover:text-white/40 font-mono">✕ close</button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <div className="rounded-lg bg-black/30 p-2 text-center">
                                <div className="text-sm font-mono font-bold text-white">{selectedConfig.final_loss.toFixed(3)}</div>
                                <div className="text-[7px] font-mono text-white/25 uppercase">Val Loss</div>
                            </div>
                            <div className="rounded-lg bg-black/30 p-2 text-center">
                                <div className="text-sm font-mono font-bold text-white">{fmtP(selectedConfig.total_parameters!)}</div>
                                <div className="text-[7px] font-mono text-white/25 uppercase">Params</div>
                            </div>
                            <div className="rounded-lg bg-black/30 p-2 text-center">
                                <div className="text-sm font-mono font-bold text-white">{selectedConfig.perplexity?.toFixed(1) ?? "—"}</div>
                                <div className="text-[7px] font-mono text-white/25 uppercase">Perplexity</div>
                            </div>
                            <div className="rounded-lg bg-black/30 p-2 text-center">
                                <div className={`text-sm font-mono font-bold ${(selectedConfig.generalization_gap ?? 0) > 0.1 ? "text-amber-400" : "text-emerald-400"}`}>
                                    {selectedConfig.generalization_gap != null ? `+${selectedConfig.generalization_gap.toFixed(3)}` : "—"}
                                </div>
                                <div className="text-[7px] font-mono text-white/25 uppercase">Gap</div>
                            </div>
                        </div>
                        {/* Efficiency ratio */}
                        <div className="text-[9px] font-mono text-white/30">
                            Efficiency: <span className="text-white/50">{(selectedConfig.final_loss / (selectedConfig.total_parameters! / 1000)).toFixed(4)}</span> loss per 1K params
                            {selectedConfig === sweetSpot && <span className="ml-2 text-violet-400 font-bold">⚡ Sweet spot — best loss/param ratio</span>}
                            {selectedConfig === bestConfig && <span className="ml-2 text-emerald-400 font-bold">★ Champion — lowest absolute loss</span>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Best vs Worst comparison */}
            <div className="grid grid-cols-2 gap-3">
                {/* Best */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[9px] font-mono font-bold text-emerald-300 uppercase tracking-wider">Champion</span>
                    </div>
                    {bestConfig && (
                        <>
                            <div className="text-xl font-mono font-bold text-emerald-400">{bestConfig.final_loss.toFixed(3)}</div>
                            <div className="text-[8px] font-mono text-white/30 space-y-0.5">
                                <div>E={bestConfig.embedding_dim} · H={bestConfig.hidden_size} · lr={bestConfig.learning_rate}</div>
                                <div>{fmtP(bestConfig.total_parameters!)} params · ppl {bestConfig.perplexity?.toFixed(1)}</div>
                            </div>
                        </>
                    )}
                </div>
                {/* Sweet spot */}
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.03] p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-[9px] font-mono font-bold text-violet-300 uppercase tracking-wider">Sweet Spot</span>
                    </div>
                    {sweetSpot && (
                        <>
                            <div className="text-xl font-mono font-bold text-violet-400">{sweetSpot.final_loss.toFixed(3)}</div>
                            <div className="text-[8px] font-mono text-white/30 space-y-0.5">
                                <div>E={sweetSpot.embedding_dim} · H={sweetSpot.hidden_size} · lr={sweetSpot.learning_rate}</div>
                                <div>{fmtP(sweetSpot.total_parameters!)} params — <span className="text-violet-300/60">{((1 - sweetSpot.total_parameters! / (bestConfig?.total_parameters ?? 1)) * 100).toFixed(0)}% smaller</span></div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                    <div className="text-base font-mono font-bold text-white">{validConfigs.length}</div>
                    <div className="text-[7px] font-mono text-white/20 uppercase tracking-widest">Models</div>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                    <div className="text-base font-mono font-bold text-white">{fmtP(Math.max(...validConfigs.map(c => c.total_parameters!)))}</div>
                    <div className="text-[7px] font-mono text-white/20 uppercase tracking-widest">Largest</div>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                    <div className="text-base font-mono font-bold text-amber-400">{(worstLoss / bestLoss).toFixed(1)}×</div>
                    <div className="text-[7px] font-mono text-white/20 uppercase tracking-widest">Loss spread</div>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                    <div className="text-base font-mono font-bold text-rose-400">{paretoLine.length}</div>
                    <div className="text-[7px] font-mono text-white/20 uppercase tracking-widest">Pareto pts</div>
                </div>
            </div>
        </div>
    );
}
