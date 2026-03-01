"use client";

import { useCallback,useMemo, useState } from "react";

import { useI18n } from "@/i18n/context";
import type { MLPGridConfig } from "@/types/lmLab";

/*
  CrossConfigScatterPlot
  X = total_parameters, Y = final_val_loss
  Color = embedding_dim
  Hover = tooltip, Click = select config
*/

const W = 480;
const H = 320;
const PAD = { top: 20, right: 20, bottom: 36, left: 52 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

const EMB_COLORS: Record<number, string> = {
    2: "rgb(250,204,21)",
    4: "rgb(251,146,60)",
    8: "rgb(52,211,153)",
    16: "rgb(96,165,250)",
    32: "rgb(168,85,247)",
    64: "rgb(244,114,182)",
};

function embColor(dim: number): string {
    return EMB_COLORS[dim] ?? "rgb(148,163,184)";
}

function formatK(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
    return String(n);
}

export interface CrossConfigScatterPlotProps {
    configs: MLPGridConfig[];
    selectedConfig: MLPGridConfig | null;
    onSelect: (config: MLPGridConfig) => void;
}

type FilterMode = "all" | "best" | "worst" | "anomalies";

function buildFilterSet(configs: MLPGridConfig[], mode: FilterMode): Set<string> | null {
    if (mode === "all") return null;
    const sorted = [...configs].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const n = configs.length;
    if (mode === "best") return new Set(sorted.slice(0, Math.ceil(n * 0.25)).map(c => c.config_id));
    if (mode === "worst") return new Set(sorted.slice(Math.floor(n * 0.75)).map(c => c.config_id));
    if (mode === "anomalies") return new Set(
        configs.filter(c => (c.generalization_gap ?? 0) > 0.3 || (c.score ?? 1) < 0.2).map(c => c.config_id)
    );
    return null;
}


export function CrossConfigScatterPlot({ configs, selectedConfig, onSelect }: CrossConfigScatterPlotProps) {
    const { t } = useI18n();
    const [hovered, setHovered] = useState<MLPGridConfig | null>(null);
    const [filter, setFilter] = useState<FilterMode>("all");

    const { xMin, xMax, yMin, yMax, embDims } = useMemo(() => {
        const params = configs.map(c => c.total_parameters);
        const losses = configs.map(c => c.final_loss);
        const dims = [...new Set(configs.map(c => c.embedding_dim))].sort((a, b) => a - b);
        return {
            xMin: Math.min(...params) * 0.9,
            xMax: Math.max(...params) * 1.05,
            yMin: Math.min(...losses) * 0.95,
            yMax: Math.max(...losses) * 1.02,
            embDims: dims,
        };
    }, [configs]);

    const filterSet = useMemo(() => buildFilterSet(configs, filter), [configs, filter]);

    const toX = useCallback((v: number) => PAD.left + ((v - xMin) / (xMax - xMin)) * PLOT_W, [xMin, xMax]);
    const toY = useCallback((v: number) => PAD.top + PLOT_H - ((v - yMin) / (yMax - yMin)) * PLOT_H, [yMin, yMax]);

    // Pareto frontier: for each point, check if any other has both lower params AND lower loss
    const paretoSet = useMemo(() => {
        const sorted = [...configs].sort((a, b) => a.total_parameters - b.total_parameters);
        const frontier = new Set<string>();
        let bestLoss = Infinity;
        for (const c of sorted) {
            if (c.final_loss < bestLoss) {
                frontier.add(c.config_id);
                bestLoss = c.final_loss;
            }
        }
        return frontier;
    }, [configs]);

    const paretoPoints = useMemo(() => {
        return configs
            .filter(c => paretoSet.has(c.config_id))
            .sort((a, b) => a.total_parameters - b.total_parameters);
    }, [configs, paretoSet]);

    // X-axis ticks
    const xTicks = useMemo(() => {
        const range = xMax - xMin;
        const step = Math.pow(10, Math.floor(Math.log10(range))) / 2;
        const ticks: number[] = [];
        let v = Math.ceil(xMin / step) * step;
        while (v <= xMax) { ticks.push(v); v += step; }
        return ticks.slice(0, 6);
    }, [xMin, xMax]);

    // Y-axis ticks
    const yTicks = useMemo(() => {
        const range = yMax - yMin;
        const step = Math.pow(10, Math.floor(Math.log10(range)));
        const ticks: number[] = [];
        let v = Math.ceil(yMin / step) * step;
        while (v <= yMax) { ticks.push(v); v += step; }
        return ticks.length < 3 ? [yMin, (yMin + yMax) / 2, yMax] : ticks.slice(0, 5);
    }, [yMin, yMax]);

    if (configs.length === 0) return null;

    const tip = hovered ?? selectedConfig;

    return (
        <div className="space-y-3">
            {/* Header: description + filter buttons */}
            <div className="space-y-2">
                <p className="text-[10px] text-white/30 font-mono leading-relaxed">
                    {t("models.mlp.scatterPlot.description")}{" "}
                    <span className="text-emerald-400/60">{t("models.mlp.scatterPlot.paretoFrontier")}</span>
                    {" "}{t("models.mlp.scatterPlot.paretoDesc")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {[
                        { key: "all", label: t("models.mlp.scatterPlot.filters.all"), tip: t("models.mlp.scatterPlot.filters.allTip") },
                        { key: "best", label: t("models.mlp.scatterPlot.filters.best"), tip: t("models.mlp.scatterPlot.filters.bestTip") },
                        { key: "worst", label: t("models.mlp.scatterPlot.filters.worst"), tip: t("models.mlp.scatterPlot.filters.worstTip") },
                        { key: "anomalies", label: t("models.mlp.scatterPlot.filters.anomalies"), tip: t("models.mlp.scatterPlot.filters.anomaliesTip") },
                    ].map(({ key, label, tip: btnTip }) => (
                        <button
                            key={key}
                            title={btnTip}
                            onClick={() => setFilter(key as FilterMode)}
                            className={`px-2.5 py-1 rounded text-[9px] font-mono border transition-all ${filter === key
                                ? "bg-violet-500/20 text-violet-300 border-violet-500/40"
                                : "bg-white/[0.03] text-white/30 border-white/[0.06] hover:text-white/50 hover:border-white/15"
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                    {filterSet && (
                        <span className="text-[9px] font-mono text-white/20 self-center ml-1">
                            {filterSet.size} {t("models.mlp.scatterPlot.highlighted")}
                        </span>
                    )}
                </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-black/30 overflow-hidden">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 360 }}>
                    {/* Grid */}
                    {xTicks.map(v => (
                        <g key={`x${v}`}>
                            <line x1={toX(v)} y1={PAD.top} x2={toX(v)} y2={PAD.top + PLOT_H} stroke="rgba(255,255,255,0.04)" />
                            <text x={toX(v)} y={H - 6} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={8} fontFamily="monospace">{formatK(v)}</text>
                        </g>
                    ))}
                    {yTicks.map(v => (
                        <g key={`y${v}`}>
                            <line x1={PAD.left} y1={toY(v)} x2={PAD.left + PLOT_W} y2={toY(v)} stroke="rgba(255,255,255,0.04)" />
                            <text x={PAD.left - 6} y={toY(v) + 3} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize={8} fontFamily="monospace">{v.toFixed(2)}</text>
                        </g>
                    ))}

                    {/* Axis labels */}
                    <text x={PAD.left + PLOT_W / 2} y={H - 18} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize={9} fontFamily="monospace">{t("models.mlp.scatterPlot.axisX")}</text>
                    <text x={12} y={PAD.top + PLOT_H / 2} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize={9} fontFamily="monospace" transform={`rotate(-90,12,${PAD.top + PLOT_H / 2})`}>{t("models.mlp.scatterPlot.axisY")}</text>

                    {/* Pareto frontier line */}
                    {paretoPoints.length > 1 && (
                        <polyline
                            points={paretoPoints.map(c => `${toX(c.total_parameters)},${toY(c.final_loss)}`).join(" ")}
                            fill="none"
                            stroke="rgba(52,211,153,0.25)"
                            strokeWidth={1.5}
                            strokeDasharray="6 4"
                        />
                    )}

                    {/* Dots */}
                    {configs.map(c => {
                        const isSelected = c.config_id === selectedConfig?.config_id;
                        const isHovered = c.config_id === hovered?.config_id;
                        const isPareto = paretoSet.has(c.config_id);
                        const inFilter = !filterSet || filterSet.has(c.config_id);
                        const r = isSelected ? 6 : isHovered ? 5 : isPareto ? 4 : 3;
                        const opacity = !inFilter ? 0.08 : isSelected || isHovered ? 1 : isPareto ? 0.9 : 0.55;
                        return (
                            <circle
                                key={c.config_id}
                                cx={toX(c.total_parameters)}
                                cy={toY(c.final_loss)}
                                r={r}
                                fill={embColor(c.embedding_dim)}
                                opacity={opacity}
                                stroke={isSelected ? "white" : isHovered ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.3)"}
                                strokeWidth={isSelected ? 2 : 1}
                                className="cursor-pointer transition-all duration-150"
                                onMouseEnter={() => setHovered(c)}
                                onMouseLeave={() => setHovered(null)}
                                onClick={() => onSelect(c)}
                            />
                        );
                    })}
                </svg>
            </div>

            {/* Legend + tooltip */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                {/* Color legend */}
                <div className="flex flex-wrap gap-3 text-[9px] font-mono text-white/30">
                    {embDims.map(d => (
                        <span key={d} className="inline-flex items-center gap-1">
                            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: embColor(d) }} />
                            emb={d}
                        </span>
                    ))}
                    <span className="inline-flex items-center gap-1">
                        <span className="inline-block w-4 h-0 border-t border-dashed border-emerald-400/40" />
                        {t("models.mlp.scatterPlot.legend.paretoLine")}
                    </span>
                </div>

                {/* Hover tooltip */}
                {tip && (
                    <div className="text-[9px] font-mono text-white/40 text-right leading-relaxed">
                        <span className="text-white/60">emb={tip.embedding_dim} hidden={tip.hidden_size} lr={tip.learning_rate}</span>
                        <br />
                        loss={tip.final_loss.toFixed(3)}
                        {tip.generalization_gap != null && <> · gap={tip.generalization_gap.toFixed(3)}</>}
                        {tip.score != null && <> · score={tip.score.toFixed(2)}</>}
                        · {formatK(tip.total_parameters)} params
                    </div>
                )}
            </div>

            <p className="text-[10px] text-white/20 font-mono">
                {t("models.mlp.scatterPlot.footer").replace("{count}", String(configs.length))}
            </p>
        </div>
    );
}
