"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { RotateCcw } from "lucide-react";

import { useI18n } from "@/i18n/context";

/* ─── Types ─── */
interface Props {
    vocabSize?: number;
}

interface PanelData {
    n: number;
    labelKey: string;
    entries: number;
    filledRatio: number;
}

/* ─── Helpers ─── */
function formatNumber(n: number): string {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
}

/* ─── Dot Grid ─── */
function DotGrid({
    total,
    filledRatio,
    maxDots,
    animate,
}: {
    total: number;
    filledRatio: number;
    maxDots: number;
    animate: boolean;
}) {
    const dotsToRender = Math.min(total, maxDots);
    const cols = Math.ceil(Math.sqrt(dotsToRender));
    const filledCount = Math.round(dotsToRender * filledRatio);

    return (
        <div
            className="grid gap-px mx-auto"
            style={{
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                width: `${Math.min(cols * 5, 120)}px`,
            }}
        >
            {Array.from({ length: dotsToRender }, (_, i) => {
                const isFilled = i < filledCount;
                return (
                    <motion.div
                        key={i}
                        initial={animate ? { opacity: 0, scale: 0 } : false}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            delay: animate ? i * 0.003 : 0,
                            duration: 0.2,
                        }}
                        className={[
                            "w-1 h-1 rounded-full",
                            isFilled
                                ? "bg-amber-400"
                                : "bg-white/[0.06]",
                        ].join(" ")}
                    />
                );
            })}
        </div>
    );
}

/* ─── Single Panel ─── */
function Panel({
    data,
    vocabSize,
    active,
    animate,
    t,
}: {
    data: PanelData;
    vocabSize: number;
    active: boolean;
    animate: boolean;
    t: (key: string) => string;
}) {
    const maxDots =
        data.n === 1 ? 400 :
        data.n === 2 ? 196 :
        data.n === 3 ? 36 :
        1;

    return (
        <motion.div
            initial={animate ? { opacity: 0, y: 20 } : false}
            animate={active ? { opacity: 1, y: 0 } : { opacity: 0.3, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={[
                "flex flex-col items-center gap-3 p-4 rounded-xl border transition-colors",
                active
                    ? "border-amber-500/25 bg-amber-500/[0.04]"
                    : "border-white/[0.06] bg-white/[0.01]",
            ].join(" ")}
        >
            {/* Header */}
            <div className="text-center">
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1">
                    {t(`ngramNarrative.growingTables.${data.labelKey}`)}
                </p>
                <p className="font-mono text-xs text-amber-300/70">
                    {vocabSize}<sup>{data.n + 1}</sup>
                </p>
            </div>

            {/* Visual */}
            <div className="flex-1 flex items-center justify-center min-h-[80px] relative">
                {data.n <= 2 ? (
                    <DotGrid
                        total={data.n === 1 ? 400 : 196}
                        filledRatio={data.filledRatio}
                        maxDots={maxDots}
                        animate={animate && active}
                    />
                ) : data.n === 3 ? (
                    <div className="relative">
                        <DotGrid
                            total={36}
                            filledRatio={data.filledRatio}
                            maxDots={maxDots}
                            animate={animate && active}
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[var(--lab-viz-bg)] pointer-events-none" />
                        <p className="absolute bottom-0 right-0 text-[9px] font-mono text-white/20">
                            ×{formatNumber(data.entries)}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <p className="font-mono text-xs text-white/25">
                            ×{formatNumber(data.entries)}
                        </p>
                    </div>
                )}
            </div>

            {/* Count */}
            <div className="text-center">
                <p className={[
                    "font-mono text-sm font-bold tabular-nums",
                    active ? "text-amber-300" : "text-white/30",
                ].join(" ")}>
                    {formatNumber(data.entries)}
                </p>
                <p className="text-[9px] text-white/20 mt-0.5">
                    {t("ngramNarrative.growingTables.filledLabel")}: {Math.round(data.filledRatio * 100)}%
                </p>
            </div>
        </motion.div>
    );
}

/* ─── Main Component ─── */
export const GrowingTablesComparison = memo(function GrowingTablesComparison({
    vocabSize = 96,
}: Props) {
    const { t } = useI18n();
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const [activeStep, setActiveStep] = useState(-1);
    const [hasAnimated, setHasAnimated] = useState(false);

    const panels: PanelData[] = [
        { n: 1, labelKey: "bigramLabel", entries: vocabSize ** 2, filledRatio: 0.85 },
        { n: 2, labelKey: "trigramLabel", entries: vocabSize ** 3, filledRatio: 0.12 },
        { n: 3, labelKey: "fourgramLabel", entries: vocabSize ** 4, filledRatio: 0.002 },
        { n: 4, labelKey: "fivegramLabel", entries: vocabSize ** 5, filledRatio: 0.00001 },
    ];

    const animate = useCallback(() => {
        setActiveStep(-1);
        setHasAnimated(true);
        let step = 0;
        const interval = setInterval(() => {
            setActiveStep(step);
            step++;
            if (step >= panels.length) clearInterval(interval);
        }, 800);
        return () => clearInterval(interval);
    }, [panels.length]);

    useEffect(() => {
        if (isInView && !hasAnimated) {
            const timeout = setTimeout(() => animate(), 300);
            return () => clearTimeout(timeout);
        }
    }, [isInView, hasAnimated, animate]);

    const handleReplay = () => {
        setHasAnimated(false);
        setActiveStep(-1);
        // small delay then re-animate
        setTimeout(() => animate(), 100);
    };

    return (
        <div ref={ref} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {panels.map((panel, i) => (
                    <Panel
                        key={panel.n}
                        data={panel}
                        vocabSize={vocabSize}
                        active={activeStep >= i}
                        animate={hasAnimated}
                        t={t}
                    />
                ))}
            </div>

            {/* Legend + Replay */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-4 text-[9px] font-mono text-white/25">
                    <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        {t("ngramNarrative.growingTables.filledLabel")}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/[0.06]" />
                        {t("ngramNarrative.growingTables.emptyLabel")}
                    </span>
                </div>

                <AnimatePresence>
                    {activeStep >= panels.length - 1 && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleReplay}
                            className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400/50 hover:text-amber-400 transition-colors"
                        >
                            <RotateCcw className="w-3 h-3" />
                            {t("ngramNarrative.growingTables.replay")}
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
});
