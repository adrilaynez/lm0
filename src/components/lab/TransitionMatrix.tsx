"use client";

import { useRef, useEffect, useState, useCallback, useMemo, memo } from "react";
import { ZoomIn, ZoomOut, Maximize2, Minimize2, Info, Grid3x3, Search, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/context";
import { motion } from "framer-motion";
import type { TransitionMatrixViz } from "@/types/lmLab";

interface TransitionMatrixProps {
    data: TransitionMatrixViz | null;
    activeContext?: string[]; // If present, we are viewing an active slice
    onCellClick?: (rowLabel: string, colLabel: string) => void;
    datasetMeta?: {
        corpusName: string;
        rawTextSize?: number;
        trainDataSize?: number;
        vocabSize?: number;
    };
    /** Use "cyan" or "amber" on N-gram page to match lab style; "emerald" on Bigram page */
    accent?: "cyan" | "emerald" | "amber";
}

const accentStyles = {
    cyan: {
        badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        input: "focus:border-cyan-500/50 focus:ring-cyan-500/20",
        searchIcon: "group-focus-within:text-cyan-400",
        infoActive: "bg-cyan-500/20",
        card: "bg-cyan-500/[0.04] border-cyan-500/20",
        cardText: "text-cyan-300",
        tooltipCell: "text-cyan-400 bg-cyan-500/10",
        bar: "bg-cyan-500",
        barBg: "bg-cyan-500/20",
    },
    emerald: {
        badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        input: "focus:border-emerald-500/50 focus:ring-emerald-500/20",
        searchIcon: "group-focus-within:text-emerald-400",
        infoActive: "bg-emerald-500/20",
        card: "bg-emerald-500/[0.04] border-emerald-500/20",
        cardText: "text-emerald-300",
        tooltipCell: "text-emerald-400 bg-emerald-500/10",
        bar: "bg-emerald-500",
        barBg: "bg-emerald-500/20",
    },
    amber: {
        badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        input: "focus:border-amber-500/50 focus:ring-amber-500/20",
        searchIcon: "group-focus-within:text-amber-400",
        infoActive: "bg-amber-500/20",
        card: "bg-amber-500/[0.04] border-amber-500/20",
        cardText: "text-amber-300",
        tooltipCell: "text-amber-400 bg-amber-500/10",
        bar: "bg-amber-500",
        barBg: "bg-amber-500/20",
    },
} as const;

export const TransitionMatrix = memo(function TransitionMatrix({
    data,
    activeContext,
    onCellClick,
    datasetMeta,
    accent = "emerald",
}: TransitionMatrixProps) {
    const { t } = useI18n();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const style = accentStyles[accent];

    const formatCount = useCallback((value?: number) => {
        if (value === undefined || value === null) return t("models.bigram.unknown");
        return value.toLocaleString();
    }, [t]);

    const isSliceView = data ? data.row_labels.length === 1 : false;
    const sliceTableRows = useMemo(() => {
        if (!data || !isSliceView) return [];
        const row = data.data[0];
        return data.col_labels
            .map((label, i) => ({ char: label, prob: row[i] }))
            .sort((a, b) => b.prob - a.prob);
    }, [data, isSliceView]);

    const [tooltip, setTooltip] = useState<{ x: number; y: number; row: string; col: string; value: number } | null>(null);
    const [searchChar, setSearchChar] = useState("");
    const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1.0);
    const [showInfoPanel, setShowInfoPanel] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const tooltipRafRef = useRef<number | null>(null);
    const lastTooltipKeyRef = useRef<string>("");

    useEffect(() => {
        if (searchChar && data) {
            const idx = data.row_labels.findIndex(
                (l) => l === searchChar
            );
            setHighlightIdx(idx === -1 ? null : idx);
        } else {
            setHighlightIdx(null);
        }
    }, [searchChar, data]);

    const draw = useCallback(() => {
        if (!canvasRef.current || !containerRef.current || !data || isSliceView) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { data: matrix, row_labels, col_labels } = data;
        const rows = row_labels.length;
        const cols = col_labels.length;
        const dpr = window.devicePixelRatio || 1;
        const padding = 32;

        const containerWidth = containerRef.current.clientWidth;
        const baseWidth = Math.max(320, containerWidth);

        const cellW = ((baseWidth - padding * 2) / cols) * zoomLevel;
        const cellH = cellW;

        const totalW = padding * 2 + cols * cellW;
        const totalH = padding * 2 + rows * cellH;

        canvas.width = totalW * dpr;
        canvas.height = totalH * dpr;
        canvas.style.width = `${totalW}px`;
        canvas.style.height = `${totalH}px`;

        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, totalW, totalH);

        const isCyan = accent === "cyan";
        const r = isCyan ? 6 : 16;
        const g = isCyan ? 182 : 185;
        const b = isCyan ? 212 : 129;

        for (let rIdx = 0; rIdx < rows; rIdx++) {
            for (let c = 0; c < cols; c++) {
                const val = matrix[rIdx][c];
                const x = padding + c * cellW;
                const y = padding + rIdx * cellH;

                const isHighlighted = highlightIdx !== null && (highlightIdx === rIdx || highlightIdx === c);
                const isDimmed = highlightIdx !== null && !isHighlighted;
                let alpha = Math.pow(val, 0.5);
                if (isDimmed) alpha *= 0.1;
                if (highlightIdx === null) alpha = Math.max(alpha, 0.05);

                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                ctx.fillRect(x, y, cellW - 0.5, cellH - 0.5);

                if (isHighlighted) {
                    ctx.strokeStyle = "rgba(251, 191, 36, 0.6)";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, cellW, cellH);
                }
            }
        }

        if (cellW > 12) {
            ctx.font = `${Math.min(11, cellW * 0.6)}px monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
            for (let c = 0; c < cols; c++) {
                const x = padding + c * cellW + cellW / 2;
                ctx.fillText(col_labels[c], x, padding - 10);
            }
            for (let rIdx = 0; rIdx < rows; rIdx++) {
                const y = padding + rIdx * cellH + cellH / 2;
                ctx.fillText(row_labels[rIdx], padding - 10, y);
            }
        }
    }, [data, highlightIdx, zoomLevel, isSliceView, accent]);

    useEffect(() => {
        draw();
    }, [draw]);

    const getCellFromOffset = (offsetX: number, offsetY: number) => {
        if (!data || isSliceView) return null;
        const padding = 32;
        const rows = data.row_labels.length;
        const cols = data.col_labels.length;
        const containerWidth = containerRef.current?.clientWidth ?? 800;
        const baseWidth = Math.max(320, containerWidth);
        const cellW = ((baseWidth - padding * 2) / cols) * zoomLevel;
        const cellH = cellW;
        const startX = padding;
        const startY = padding;

        if (offsetX < startX || offsetY < startY) return null;
        const c = Math.floor((offsetX - startX) / cellW);
        const r = Math.floor((offsetY - startY) / cellH);
        if (c >= 0 && c < data.col_labels.length && r >= 0 && r < data.row_labels.length) return { r, c };
        return null;
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!data || isSliceView) return;
        const { offsetX, offsetY } = e.nativeEvent;
        const { clientX, clientY } = e;
        const cell = getCellFromOffset(offsetX, offsetY);

        if (tooltipRafRef.current !== null) cancelAnimationFrame(tooltipRafRef.current);
        tooltipRafRef.current = window.requestAnimationFrame(() => {
            if (!cell) {
                if (lastTooltipKeyRef.current !== "none") {
                    setTooltip(null);
                    lastTooltipKeyRef.current = "none";
                }
                return;
            }
            const nextTooltip = {
                x: clientX,
                y: clientY,
                row: data.row_labels[cell.r],
                col: data.col_labels[cell.c],
                value: data.data[cell.r][cell.c],
            };
            const nextKey = `${cell.r}:${cell.c}:${Math.round(clientX)}:${Math.round(clientY)}`;
            if (nextKey !== lastTooltipKeyRef.current) {
                setTooltip(nextTooltip);
                lastTooltipKeyRef.current = nextKey;
            }
        });
    };

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const cell = getCellFromOffset(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        if (cell && data && onCellClick) onCellClick(data.row_labels[cell.r], data.col_labels[cell.c]);
    };

    useEffect(() => {
        return () => {
            if (tooltipRafRef.current !== null) cancelAnimationFrame(tooltipRafRef.current);
        };
    }, []);

    const badgeLabel = data
        ? isSliceView
            ? `P(next | context) · 1×${data.col_labels.length}`
            : `Transition matrix · ${data.row_labels.length}×${data.col_labels.length}`
        : "";

    return (
        <div id="transition-matrix" className={cn("flex flex-col gap-4", isFullscreen && "fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-6")}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.04] p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-4">
                    <Badge variant="outline" className={cn("px-3 py-1 uppercase tracking-widest text-[10px]", style.badge)}>
                        {badgeLabel}
                    </Badge>
                    {!isSliceView && (
                        <>
                            <div className="h-4 w-px bg-white/10" />
                            <div className="relative group">
                                <Search className={cn("absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 transition-colors", style.searchIcon)} />
                                <Input
                                    placeholder={t("models.bigram.matrix.searchPlaceholder")}
                                    value={searchChar}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchChar(e.target.value.slice(0, 1))}
                                    maxLength={1}
                                    className={cn("pl-8 h-8 w-40 bg-black/20 border-white/10 text-xs transition-all font-mono", style.input)}
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {!isSliceView && (
                        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-white/5 mr-2">
                            <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/10" onClick={() => setZoomLevel(z => Math.max(0.2, z - 0.2))}>
                                <ZoomOut className="w-3 h-3" />
                            </Button>
                            <span className="text-[10px] font-mono text-white/50 w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/10" onClick={() => setZoomLevel(z => Math.min(5, z + 0.2))}>
                                <ZoomIn className="w-3 h-3" />
                            </Button>
                        </div>
                    )}
                    <Button
                        variant={showInfoPanel ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8 hover:bg-white/10 relative"
                        onClick={() => setShowInfoPanel(!showInfoPanel)}
                    >
                        <Info className="w-4 h-4" />
                        {showInfoPanel && <div className={cn("absolute inset-0 rounded-md animate-pulse", style.infoActive)} />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={() => setIsFullscreen(!isFullscreen)}>
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {datasetMeta && (
                <Card className={cn("px-4 py-3", style.card)}>
                    <p className="text-xs text-white/70 leading-relaxed">
                        {t("models.bigram.matrix.datasetMeta.learnedFrom")} <span className={style.cardText}>{datasetMeta.corpusName}</span>.
                        {t("models.bigram.matrix.datasetMeta.summarizes")} <span className={style.cardText}>{formatCount(datasetMeta.rawTextSize)}</span> {t("models.bigram.matrix.datasetMeta.rawChars")}
                        (<span className={style.cardText}>{formatCount(datasetMeta.trainDataSize)}</span> {t("models.bigram.matrix.datasetMeta.inTrain")}),
                        {t("models.bigram.matrix.datasetMeta.vocab")} <span className={style.cardText}>{formatCount(datasetMeta.vocabSize)}</span> {t("models.bigram.matrix.datasetMeta.symbols")}.
                    </p>
                </Card>
            )}

            {showInfoPanel && (
                <Card className={cn("bg-slate-900/70 p-4 md:p-5", style.card)}>
                    <h4 className={cn("text-xs font-bold uppercase tracking-widest mb-2", style.cardText)}>
                        {t("models.bigram.matrix.tooltip.title")}
                    </h4>
                    <p className="text-xs text-white/65 leading-relaxed mb-3">
                        {t("models.bigram.matrix.tooltip.desc")}
                    </p>
                    {datasetMeta && (
                        <div className="text-xs text-white/65 leading-relaxed space-y-1">
                            <p><span className="text-white/40 uppercase tracking-wider mr-2">{t("models.bigram.matrix.datasetMeta.corpus")}</span>{datasetMeta.corpusName}</p>
                            <p><span className="text-white/40 uppercase tracking-wider mr-2">{t("models.bigram.matrix.datasetMeta.rawText")}</span>{formatCount(datasetMeta.rawTextSize)} {t("models.bigram.matrix.datasetMeta.rawChars")}</p>
                            <p><span className="text-white/40 uppercase tracking-wider mr-2">{t("models.bigram.matrix.datasetMeta.trainingSplit")}</span>{formatCount(datasetMeta.trainDataSize)} {t("models.bigram.matrix.datasetMeta.charTokens")}</p>
                            <p><span className="text-white/40 uppercase tracking-wider mr-2">{t("models.bigram.matrix.datasetMeta.vocabulary")}</span>{formatCount(datasetMeta.vocabSize)} {t("models.bigram.matrix.datasetMeta.symbols")}</p>
                        </div>
                    )}
                </Card>
            )}

            <div className={cn(
                "relative overflow-hidden bg-black/40 rounded-xl border border-white/5",
                isFullscreen ? "flex-1 min-h-0" : "max-h-[560px]"
            )}>
                {isSliceView && sliceTableRows.length > 0 ? (
                    <div className="p-4 overflow-auto max-h-[420px] custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="pb-2 text-[10px] font-mono uppercase tracking-widest text-white/40">{t("models.bigram.matrix.nextChar")}</th>
                                    <th className="pb-2 text-[10px] font-mono uppercase tracking-widest text-white/40 w-20 text-right">{t("models.bigram.matrix.probability")}</th>
                                    <th className="pb-2 pl-4 text-[10px] font-mono uppercase tracking-widest text-white/40">{t("models.bigram.matrix.distribution")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sliceTableRows.map(({ char, prob }, i) => (
                                    <motion.tr
                                        key={char}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.01 }}
                                        className="border-b border-white/[0.04] hover:bg-white/[0.03] group"
                                    >
                                        <td className="py-2">
                                            <span className="font-mono text-sm text-white/90">{(char === " " ? "⎵" : char)}</span>
                                        </td>
                                        <td className="py-2 text-right font-mono text-xs text-white/70">
                                            {(prob * 100).toFixed(2)}%
                                        </td>
                                        <td className="py-2 pl-4">
                                            <div className="h-5 rounded bg-white/[0.06] overflow-hidden min-w-[80px] max-w-[200px]">
                                                <div
                                                    className={cn("h-full rounded transition-all", style.bar)}
                                                    style={{ width: `${Math.max(2, prob * 100)}%` }}
                                                />
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div
                        ref={containerRef}
                        className={cn(
                            "w-full overflow-auto flex items-start justify-center p-4 custom-scrollbar",
                            isFullscreen ? "h-full" : "h-[560px]"
                        )}
                    >
                        <canvas
                            ref={canvasRef}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => {
                                if (tooltipRafRef.current !== null) cancelAnimationFrame(tooltipRafRef.current);
                                lastTooltipKeyRef.current = "none";
                                setTooltip(null);
                            }}
                            onClick={handleClick}
                            className={cn("cursor-crosshair shadow-2xl", onCellClick ? "cursor-pointer" : "")}
                        />
                    </div>
                )}

                {tooltip && (
                    <div
                        className="pointer-events-none fixed z-50 px-3 py-2 bg-slate-900/95 border border-white/10 rounded-lg shadow-xl text-xs"
                        style={{ left: tooltip.x + 15, top: tooltip.y + 15 }}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span className={cn("font-mono px-1 rounded", style.tooltipCell)}>&apos;{tooltip.row}&apos;</span>
                            <span className="text-white/30">→</span>
                            <span className={cn("font-mono px-1 rounded", style.tooltipCell)}>&apos;{tooltip.col}&apos;</span>
                        </div>
                        <div className="font-mono text-white font-bold">{(tooltip.value * 100).toFixed(4)}%</div>
                    </div>
                )}
            </div>
        </div>
    );
}, (prev, next) => {
    // Custom comparison
    return prev.data === next.data && prev.activeContext === next.activeContext;
});
