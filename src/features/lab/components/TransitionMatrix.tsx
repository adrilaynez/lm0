"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { motion } from "framer-motion";
import { Info, Maximize2, Minimize2, Search, ZoomIn, ZoomOut } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MatrixCuriosityGame } from "@/features/lab/components/TransitionMatrixGame";
import type { TransitionMatrixViz } from "@/features/lab/types/lmLab";
import { useI18n } from "@/i18n/context";
import { cn } from "@/lib/utils";

interface TransitionMatrixProps {
    /**
     * The transition data to render. Optional: the editorial-green curiosity GAME
     * (`game` + `accent="bigram"`) builds its own deterministic matrix from the dataset, so
     * `<TransitionMatrix game accent="bigram" />` self-mounts with no `data`. Every other use
     * still passes `data` and is unchanged.
     */
    data?: TransitionMatrixViz | null;
    activeContext?: string[]; // If present, we are viewing an active slice
    onCellClick?: (rowLabel: string, colLabel: string) => void;
    datasetMeta?: {
        corpusName: string;
        rawTextSize?: number;
        trainDataSize?: number;
        vocabSize?: number;
    };
    /**
     * Visual accent. "cyan"/"amber" match the N-gram lab style; "emerald" is the legacy
     * literal-Tailwind green. "bigram" maps to the token-driven editorial-green (--bigram-*)
     * and is the accent to use inside the [data-bigram-theme] scope.
     */
    accent?: "cyan" | "emerald" | "amber" | "bigram";
    /**
     * Opt-in curiosity-GAME layer (§4 "the real table, as a game"). ONLY honoured when
     * `accent === "bigram"`. Replaces the canvas/slice view with a self-contained, deterministic
     * grid the learner plays with: black gaps glow, a prompt invites "find a cell that never
     * happens", and clicking a cell reveals WHY (an in-place sage curiosity) or opens corpus
     * evidence (DatasetExplorerModal) when the pair really does occur. Default `false` keeps the
     * legacy behaviour byte-for-byte for the N-gram lab and the §3 full-matrix mount.
     */
    game?: boolean;
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
    // Bigram (editorial-green) — token-driven so it follows the [data-bigram-theme] scope
    // in both dark and light. Never overwrites the literal Tailwind accents above.
    bigram: {
        badge: "bg-bigram-accent-soft text-bigram-accent-ink border-[color-mix(in_oklab,var(--bigram-accent)_30%,transparent)]",
        input: "focus:border-[color-mix(in_oklab,var(--bigram-accent)_55%,transparent)] focus:ring-[var(--bigram-accent-soft)]",
        searchIcon: "group-focus-within:text-bigram-accent-ink",
        infoActive: "bg-bigram-accent-soft",
        card: "bg-bigram-accent-soft border-[color-mix(in_oklab,var(--bigram-accent)_22%,transparent)]",
        cardText: "text-bigram-accent-ink",
        tooltipCell: "text-bigram-accent-ink bg-bigram-accent-soft",
        bar: "bg-bigram-accent",
        barBg: "bg-bigram-accent-soft",
    },
} as const;

/**
 * Neutral chrome for the bigram chapter. The shared layout (toolbar, dividers, canvas
 * field, tooltip panel, slice table) is written with dark-only literals — bg-white/[…],
 * border-white/10, bg-black/40, bg-slate-900/95, text-white/… — which read as near-invisible
 * white-on-parchment in the bigram LIGHT theme and are off-palette in its dark theme.
 *
 * These token-driven inline styles resolve from --bigram-* inside [data-bigram-theme] (dark
 * AND light) and are applied ONLY when accent === "bigram". Every other accent keeps its
 * original literals byte-for-byte. JetBrains Mono via --bigram-font-mono (Tailwind font-mono
 * is Geist, not the chapter mono). Radii from --bigram-r-*. Fill-not-border, calm surfaces.
 */
const bigramChrome = {
    toolbar: {
        background: "var(--bigram-surface)",
        border: "1px solid var(--bigram-rule)",
        borderRadius: "var(--bigram-r-md)",
        boxShadow: "var(--bigram-shadow-sm, inset 0 1px 0 0 color-mix(in oklab, var(--bigram-ink) 6%, transparent))",
    },
    divider: { background: "var(--bigram-rule-2)" },
    zoomBox: {
        background: "var(--bigram-bg-2)",
        border: "1px solid var(--bigram-rule)",
        borderRadius: "var(--bigram-r-sm)",
    },
    zoomReadout: { color: "var(--bigram-dim)", fontFamily: "var(--bigram-font-mono)" },
    input: {
        background: "var(--bigram-bg-2)",
        border: "1px solid var(--bigram-rule)",
        color: "var(--bigram-ink)",
        fontFamily: "var(--bigram-font-mono)",
    },
    field: {
        background: "var(--bigram-bg-2)",
        border: "1px solid var(--bigram-rule)",
        borderRadius: "var(--bigram-r-md)",
    },
    infoCard: {
        background: "var(--bigram-surface)",
        border: "1px solid var(--bigram-rule-2)",
    },
    tooltip: {
        background: "var(--bigram-elev)",
        border: "1px solid var(--bigram-rule-2)",
        borderRadius: "var(--bigram-r-sm)",
        boxShadow: "0 16px 38px -22px color-mix(in oklab, var(--bigram-ink) 70%, transparent)",
    },
    tooltipValue: { color: "var(--bigram-ink)", fontFamily: "var(--bigram-font-mono)" },
    mono: { fontFamily: "var(--bigram-font-mono)" },
    body: { color: "var(--bigram-body)" },
    dim: { color: "var(--bigram-dim)" },
    ink: { color: "var(--bigram-ink)" },
    arrow: { color: "var(--bigram-dim)" },
    rowRule: { borderColor: "var(--bigram-rule)" },
    barTrack: {
        background: "color-mix(in oklab, var(--bigram-ink) 8%, transparent)",
        borderRadius: "var(--bigram-r-sm)",
    },
} as const;

export const TransitionMatrix = memo(function TransitionMatrix({
    data = null,
    activeContext,
    onCellClick,
    datasetMeta,
    accent = "emerald",
    game = false,
}: TransitionMatrixProps) {
    const { t } = useI18n();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const style = accentStyles[accent];
    // When true, the shared dark-only chrome is replaced by --bigram-* token styles so the
    // matrix reads correctly in BOTH bigram themes. No other accent reaches this branch.
    const isBigram = accent === "bigram";

    // Legend swatch fill at a given intensity. Token-driven for "bigram" (follows the
    // [data-bigram-theme] scope via color-mix); literal rgba for the lab accents.
    const legendSwatch = useCallback(
        (a: number) => {
            if (accent === "bigram") return `color-mix(in oklab, var(--bigram-accent) ${Math.round(a * 100)}%, transparent)`;
            if (accent === "cyan") return `rgba(6,182,212,${a})`;
            if (accent === "amber") return `rgba(245,158,11,${a})`;
            return `rgba(16,185,129,${a})`;
        },
        [accent]
    );

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

        // For the literal accents we paint rgba(r,g,b,alpha). For "bigram" we keep the
        // canvas token-driven: resolve the live --bigram-accent (it follows the
        // [data-bigram-theme] scope, dark or light) and apply intensity via globalAlpha,
        // so no green literal is ever hardcoded here.
        const isBigram = accent === "bigram";
        const isCyan = accent === "cyan";
        const r = isCyan ? 6 : 16;
        const g = isCyan ? 182 : 185;
        const b = isCyan ? 212 : 129;

        let bigramFill = "";
        let bigramHighlightStroke = "rgba(251, 191, 36, 0.6)";
        let bigramLabel = "";
        let bigramMonoFont = "monospace";
        if (isBigram) {
            const cs = getComputedStyle(canvas);
            // canvas inherits from the themed wrapper, so these resolve per dark/light scope
            bigramFill = cs.getPropertyValue("--bigram-accent").trim() || "oklch(0.70 0.148 164)";
            const sage = cs.getPropertyValue("--bigram-sage").trim();
            if (sage) bigramHighlightStroke = sage;
            // axis labels must follow the theme too (white-on-parchment is invisible in light)
            bigramLabel = cs.getPropertyValue("--bigram-muted").trim() || "oklch(0.73 0.012 90)";
            const mono = cs.getPropertyValue("--bigram-font-mono").trim();
            if (mono) bigramMonoFont = mono;
        }

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

                if (isBigram) {
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = bigramFill;
                } else {
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                }
                ctx.fillRect(x, y, cellW - 0.5, cellH - 0.5);
                if (isBigram) ctx.globalAlpha = 1;

                if (isHighlighted) {
                    ctx.strokeStyle = bigramHighlightStroke;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, cellW, cellH);
                }
            }
        }

        if (cellW > 12) {
            const labelFont = isBigram ? `JetBrains Mono, ${bigramMonoFont}` : "monospace";
            ctx.font = `${Math.min(11, cellW * 0.6)}px ${labelFont}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = isBigram ? bigramLabel : "rgba(255, 255, 255, 0.5)";
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

    // Opt-in curiosity game — only behind accent="bigram". Placed AFTER every hook above so the
    // Rules of Hooks hold (the legacy hooks all no-op on the game's null data). The entire legacy
    // renderer below — canvas, slice table, ngram styling — is untouched when game is off.
    if (game && isBigram) {
        return <MatrixCuriosityGame />;
    }

    return (
        <div id="transition-matrix" className={cn("flex flex-col gap-4", isFullscreen && "fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-6")}>
            <div
                className={cn(
                    "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4",
                    !isBigram && "bg-white/[0.04] rounded-xl border border-white/10"
                )}
                style={isBigram ? bigramChrome.toolbar : undefined}
            >
                <div className="flex items-center gap-4">
                    <Badge variant="outline" className={cn("px-3 py-1 uppercase tracking-widest text-[10px]", style.badge)}>
                        {badgeLabel}
                    </Badge>
                    {!isSliceView && (
                        <>
                            <div className={cn("h-4 w-px", !isBigram && "bg-white/10")} style={isBigram ? bigramChrome.divider : undefined} />
                            <div className="relative group">
                                <Search className={cn("absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 transition-colors", isBigram ? "text-bigram-dim" : "text-white/40", style.searchIcon)} />
                                <Input
                                    placeholder={t("models.bigram.matrix.searchPlaceholder")}
                                    value={searchChar}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchChar(e.target.value.slice(0, 1))}
                                    maxLength={1}
                                    className={cn("pl-8 h-8 w-40 text-xs transition-all", !isBigram && "bg-black/20 border-white/10 font-mono")}
                                    style={isBigram ? bigramChrome.input : undefined}
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {!isSliceView && (
                        <div
                            className={cn("flex items-center gap-1 p-1 mr-2", !isBigram && "bg-black/20 rounded-lg border border-white/5")}
                            style={isBigram ? bigramChrome.zoomBox : undefined}
                        >
                            <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/10" onClick={() => setZoomLevel(z => Math.max(0.2, z - 0.2))}>
                                <ZoomOut className="w-3 h-3" />
                            </Button>
                            <span className={cn("text-[10px] w-8 text-center", !isBigram && "font-mono text-white/50")} style={isBigram ? bigramChrome.zoomReadout : undefined}>{Math.round(zoomLevel * 100)}%</span>
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
                    <p className={cn("text-xs leading-relaxed", !isBigram && "text-white/70")} style={isBigram ? bigramChrome.body : undefined}>
                        {t("models.bigram.matrix.datasetMeta.learnedFrom")} <span className={style.cardText}>{datasetMeta.corpusName}</span>.
                        {t("models.bigram.matrix.datasetMeta.summarizes")} <span className={style.cardText}>{formatCount(datasetMeta.rawTextSize)}</span> {t("models.bigram.matrix.datasetMeta.rawChars")}
                        (<span className={style.cardText}>{formatCount(datasetMeta.trainDataSize)}</span> {t("models.bigram.matrix.datasetMeta.inTrain")}),
                        {t("models.bigram.matrix.datasetMeta.vocab")} <span className={style.cardText}>{formatCount(datasetMeta.vocabSize)}</span> {t("models.bigram.matrix.datasetMeta.symbols")}.
                    </p>
                </Card>
            )}

            {showInfoPanel && (
                <Card
                    className={cn("p-4 md:p-5", !isBigram && "bg-slate-900/70", isBigram ? "" : style.card)}
                    style={isBigram ? bigramChrome.infoCard : undefined}
                >
                    <h4 className={cn("text-xs font-bold uppercase tracking-widest mb-2", style.cardText)}>
                        {t("models.bigram.matrix.tooltip.title")}
                    </h4>
                    <p className={cn("text-xs leading-relaxed mb-3", !isBigram && "text-white/65")} style={isBigram ? bigramChrome.body : undefined}>
                        {t("models.bigram.matrix.tooltip.desc")}
                    </p>
                    {datasetMeta && (
                        <div className={cn("text-xs leading-relaxed space-y-1", !isBigram && "text-white/65")} style={isBigram ? bigramChrome.body : undefined}>
                            <p><span className={cn("uppercase tracking-wider mr-2", !isBigram && "text-white/40")} style={isBigram ? bigramChrome.dim : undefined}>{t("models.bigram.matrix.datasetMeta.corpus")}</span>{datasetMeta.corpusName}</p>
                            <p><span className={cn("uppercase tracking-wider mr-2", !isBigram && "text-white/40")} style={isBigram ? bigramChrome.dim : undefined}>{t("models.bigram.matrix.datasetMeta.rawText")}</span>{formatCount(datasetMeta.rawTextSize)} {t("models.bigram.matrix.datasetMeta.rawChars")}</p>
                            <p><span className={cn("uppercase tracking-wider mr-2", !isBigram && "text-white/40")} style={isBigram ? bigramChrome.dim : undefined}>{t("models.bigram.matrix.datasetMeta.trainingSplit")}</span>{formatCount(datasetMeta.trainDataSize)} {t("models.bigram.matrix.datasetMeta.charTokens")}</p>
                            <p><span className={cn("uppercase tracking-wider mr-2", !isBigram && "text-white/40")} style={isBigram ? bigramChrome.dim : undefined}>{t("models.bigram.matrix.datasetMeta.vocabulary")}</span>{formatCount(datasetMeta.vocabSize)} {t("models.bigram.matrix.datasetMeta.symbols")}</p>
                        </div>
                    )}
                </Card>
            )}

            {/* Color legend */}
            {!isSliceView && data && (
                <div className="flex items-center justify-center gap-4 py-2">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: legendSwatch(0.15) }} />
                            <span className={cn("text-[9px] font-mono uppercase tracking-wider", accent === "bigram" ? "text-bigram-dim" : "text-white/25")}>{t("models.bigram.matrix.legendRare")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            {[0.15, 0.3, 0.5, 0.7, 0.9].map((a) => (
                                <div key={a} className="w-3 h-3 rounded-sm" style={{ backgroundColor: legendSwatch(a) }} />
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: legendSwatch(0.9) }} />
                            <span className={cn("text-[9px] font-mono uppercase tracking-wider", accent === "bigram" ? "text-bigram-dim" : "text-white/25")}>{t("models.bigram.matrix.legendCommon")}</span>
                        </div>
                    </div>
                </div>
            )}

            <div
                className={cn(
                    "relative overflow-hidden",
                    !isBigram && "bg-black/40 rounded-xl border border-white/[0.08]",
                    isFullscreen ? "flex-1 min-h-0" : ""
                )}
                style={isBigram ? bigramChrome.field : undefined}
            >
                {isSliceView && sliceTableRows.length > 0 ? (
                    <div className="p-4 overflow-auto max-h-[420px] custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className={cn("border-b", !isBigram && "border-white/10")} style={isBigram ? bigramChrome.rowRule : undefined}>
                                    <th className={cn("pb-2 text-[10px] uppercase tracking-widest", !isBigram && "font-mono text-white/40")} style={isBigram ? { ...bigramChrome.dim, ...bigramChrome.mono } : undefined}>{t("models.bigram.matrix.nextChar")}</th>
                                    <th className={cn("pb-2 text-[10px] uppercase tracking-widest w-20 text-right", !isBigram && "font-mono text-white/40")} style={isBigram ? { ...bigramChrome.dim, ...bigramChrome.mono } : undefined}>{t("models.bigram.matrix.probability")}</th>
                                    <th className={cn("pb-2 pl-4 text-[10px] uppercase tracking-widest", !isBigram && "font-mono text-white/40")} style={isBigram ? { ...bigramChrome.dim, ...bigramChrome.mono } : undefined}>{t("models.bigram.matrix.distribution")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sliceTableRows.map(({ char, prob }, i) => (
                                    <motion.tr
                                        key={char}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.01 }}
                                        className={cn("border-b group", isBigram ? "hover:bg-bigram-accent-soft" : "border-white/[0.04] hover:bg-white/[0.03]")}
                                        style={isBigram ? bigramChrome.rowRule : undefined}
                                    >
                                        <td className="py-2">
                                            <span className={cn("text-sm", !isBigram && "font-mono text-white/90")} style={isBigram ? { ...bigramChrome.ink, ...bigramChrome.mono } : undefined}>{(char === " " ? "⎵" : char)}</span>
                                        </td>
                                        <td className={cn("py-2 text-right text-xs", !isBigram && "font-mono text-white/70")} style={isBigram ? { ...bigramChrome.body, ...bigramChrome.mono } : undefined}>
                                            {(prob * 100).toFixed(2)}%
                                        </td>
                                        <td className="py-2 pl-4">
                                            <div className={cn("h-5 overflow-hidden min-w-[80px] max-w-[200px]", !isBigram && "rounded bg-white/[0.06]")} style={isBigram ? bigramChrome.barTrack : undefined}>
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
                ) : data ? (
                    <div
                        ref={containerRef}
                        className={cn(
                            "w-full overflow-auto flex items-start justify-center p-4 custom-scrollbar",
                            isFullscreen ? "h-full" : "max-h-[70vh]"
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
                ) : (
                    /* Loading skeleton */
                    <div className="p-6 space-y-3">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} className={cn("text-xs", !isBigram && "font-mono text-white/30")} style={isBigram ? { ...bigramChrome.dim, ...bigramChrome.mono } : undefined}>
                                {t("models.bigram.matrix.loading")}
                            </motion.div>
                        </div>
                        <div
                            className={cn("aspect-square max-w-[400px] mx-auto rounded-lg relative overflow-hidden", !isBigram && "bg-white/[0.02] border border-white/[0.06]")}
                            style={isBigram ? { background: "var(--bigram-bg-2)", border: "1px solid var(--bigram-rule)" } : undefined}
                        >
                            <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className={cn("absolute inset-0 bg-gradient-to-r from-transparent to-transparent", isBigram ? "via-[color-mix(in_oklab,var(--bigram-accent)_8%,transparent)]" : "via-white/[0.03]")} />
                        </div>
                    </div>
                )}

                {tooltip && (
                    <div
                        className={cn("pointer-events-none fixed z-50 px-3 py-2 text-xs", !isBigram && "bg-slate-900/95 border border-white/10 rounded-lg shadow-xl")}
                        style={isBigram ? { ...bigramChrome.tooltip, left: tooltip.x + 15, top: tooltip.y + 15 } : { left: tooltip.x + 15, top: tooltip.y + 15 }}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span className={cn("px-1 rounded", !isBigram && "font-mono", style.tooltipCell)} style={isBigram ? bigramChrome.mono : undefined}>&apos;{tooltip.row}&apos;</span>
                            <span className={cn(!isBigram && "text-white/30")} style={isBigram ? bigramChrome.arrow : undefined}>→</span>
                            <span className={cn("px-1 rounded", !isBigram && "font-mono", style.tooltipCell)} style={isBigram ? bigramChrome.mono : undefined}>&apos;{tooltip.col}&apos;</span>
                        </div>
                        <div className={cn("font-bold", !isBigram && "font-mono text-white")} style={isBigram ? bigramChrome.tooltipValue : undefined}>{(tooltip.value * 100).toFixed(4)}%</div>
                    </div>
                )}
            </div>
        </div>
    );
}, (prev, next) => {
    // Custom comparison. `game`/`accent` are included so toggling INTO the curiosity layer
    // (or between accents) always re-renders; the original data/context check is preserved.
    return (
        prev.data === next.data &&
        prev.activeContext === next.activeContext &&
        prev.game === next.game &&
        prev.accent === next.accent
    );
});
