"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Play, RotateCcw } from "lucide-react";

import { useI18n } from "@/i18n/context";

/* ─── Data ─── */
interface CountData {
    char: string;
    count: number;
}

const EXAMPLE_CHAR = "t";
const COUNTS: CountData[] = [
    { char: "h", count: 520 },
    { char: "e", count: 190 },
    { char: "i", count: 100 },
    { char: " ", count: 95 },
    { char: "o", count: 85 },
];
const TOTAL = COUNTS.reduce((sum, c) => sum + c.count, 0);
const MAX_COUNT = Math.max(...COUNTS.map((c) => c.count));

const COLORS = [
    { bar: "from-emerald-400 to-emerald-500", text: "text-emerald-400", block: "bg-emerald-400", glow: "shadow-emerald-500/20" },
    { bar: "from-teal-400 to-teal-500", text: "text-teal-400", block: "bg-teal-400", glow: "shadow-teal-500/20" },
    { bar: "from-cyan-400 to-cyan-500", text: "text-cyan-400", block: "bg-cyan-400", glow: "shadow-cyan-500/20" },
    { bar: "from-sky-400 to-sky-500", text: "text-sky-400", block: "bg-sky-400", glow: "shadow-sky-500/20" },
    { bar: "from-blue-400 to-blue-500", text: "text-blue-400", block: "bg-blue-400", glow: "shadow-blue-500/20" },
];

function displayChar(c: string) {
    return c === " " ? "·" : c;
}

/* ─── Animated Counter ─── */
function AnimatedCount({ target, duration = 0.8 }: { target: number; duration?: number }) {
    const [value, setValue] = useState(0);
    const rafRef = useRef<number>(0);
    const startRef = useRef<number>(0);

    useEffect(() => {
        startRef.current = performance.now();
        const dur = duration * 1000;
        const animate = (now: number) => {
            const elapsed = now - startRef.current;
            const progress = Math.min(elapsed / dur, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) rafRef.current = requestAnimationFrame(animate);
        };
        rafRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafRef.current);
    }, [target, duration]);

    return <>{value}</>;
}

/* ─── Main Component ─── */
export const NormalizationVisualizer = memo(function NormalizationVisualizer() {
    const { t } = useI18n();
    const [step, setStep] = useState<0 | 1 | 2>(0);
    const [divisionIndex, setDivisionIndex] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const probabilities = COUNTS.map((c) => ({
        char: c.char,
        probability: (c.count / TOTAL) * 100,
    }));

    const handleNextStep = useCallback(() => {
        if (step < 2) setStep((s) => (s + 1) as 0 | 1 | 2);
    }, [step]);

    const handleReset = useCallback(() => {
        setStep(0);
        setDivisionIndex(0);
        setShowResult(false);
    }, []);

    // Auto-advance division animation in step 1
    useEffect(() => {
        if (step !== 1) return;
        setDivisionIndex(0);
        setShowResult(false);
        const timers: ReturnType<typeof setTimeout>[] = [];
        COUNTS.forEach((_, i) => {
            timers.push(setTimeout(() => setDivisionIndex(i), i * 600 + 300));
        });
        timers.push(setTimeout(() => setShowResult(true), COUNTS.length * 600 + 600));
        return () => timers.forEach(clearTimeout);
    }, [step]);

    const tReplace = (key: string, replacements: Record<string, string>) => {
        let str = t(key);
        for (const [k, v] of Object.entries(replacements)) {
            str = str.replace(`{${k}}`, v);
        }
        return str;
    };

    return (
        <div className="space-y-6" ref={containerRef}>
            {/* Context banner */}
            <div className="text-center">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20">
                    <span className="text-sm text-white/50">
                        {tReplace("bigramNarrative.normalizationViz.context", { char: EXAMPLE_CHAR })}
                    </span>
                </div>
            </div>

            {/* Step indicator — labeled */}
            <div className="flex items-center justify-center gap-1">
                {[
                    { i: 0, label: t("bigramNarrative.normalizationViz.step1Title") },
                    { i: 1, label: t("bigramNarrative.normalizationViz.step2Title") },
                    { i: 2, label: t("bigramNarrative.normalizationViz.step3Title") },
                ].map(({ i, label }) => (
                    <div key={i} className="flex items-center gap-1">
                        <button
                            onClick={() => { setStep(i as 0 | 1 | 2); setDivisionIndex(0); setShowResult(false); }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all ${step === i
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : step > i
                                    ? "bg-emerald-500/10 text-emerald-400/60 border border-emerald-500/15"
                                    : "bg-white/[0.03] text-white/25 border border-white/[0.06]"
                                }`}
                        >
                            {step > i && <Check className="w-2.5 h-2.5 inline mr-1" />}
                            {label}
                        </button>
                        {i < 2 && <ArrowRight className="w-3 h-3 text-white/15 mx-1" />}
                    </div>
                ))}
            </div>

            {/* Visualization area */}
            <div className="relative rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.02] to-black/40 p-5 sm:p-6 min-h-[340px]">
                <AnimatePresence mode="wait">
                    {/* ── Step 0: Raw Counts with animated stacking bars ── */}
                    {step === 0 && (
                        <motion.div
                            key="counts"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-3"
                        >
                            <p className="text-xs text-white/35 text-center mb-4">
                                {tReplace("bigramNarrative.normalizationViz.step1Desc", { char: EXAMPLE_CHAR })}
                            </p>

                            {/* Column headers */}
                            <div className="flex items-center gap-3 px-1 mb-1">
                                <div className="w-10 text-[9px] text-white/25 font-mono uppercase tracking-widest">
                                    {t("bigramNarrative.normalizationViz.charHeader")}
                                </div>
                                <div className="flex-1 text-[9px] text-white/25 font-mono uppercase tracking-widest">
                                    {t("bigramNarrative.normalizationViz.frequencyHeader")}
                                </div>
                                <div className="w-14 text-[9px] text-white/25 font-mono uppercase tracking-widest text-right">
                                    {t("bigramNarrative.normalizationViz.countHeader")}
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                {COUNTS.map((item, idx) => {
                                    const color = COLORS[idx];
                                    return (
                                        <motion.div
                                            key={item.char}
                                            initial={{ opacity: 0, x: -16 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.08 }}
                                            className="flex items-center gap-3"
                                        >
                                            <code className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.08] text-white font-mono text-base font-bold">
                                                {displayChar(item.char)}
                                            </code>
                                            <div className="flex-1">
                                                <div className="relative h-10 bg-white/[0.03] rounded-lg overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(item.count / MAX_COUNT) * 100}%` }}
                                                        transition={{ duration: 0.7, delay: idx * 0.08 + 0.15, ease: "easeOut" }}
                                                        className={`h-full rounded-lg bg-gradient-to-r ${color.bar} shadow-lg ${color.glow}`}
                                                    />
                                                    {/* Block segments inside the bar */}
                                                    <div className="absolute inset-0 flex items-center pointer-events-none">
                                                        {Array.from({ length: Math.min(Math.ceil(item.count / 52), 10) }).map((_, bi) => (
                                                            <motion.div
                                                                key={bi}
                                                                initial={{ opacity: 0, scale: 0 }}
                                                                animate={{ opacity: 0.15, scale: 1 }}
                                                                transition={{ delay: idx * 0.08 + bi * 0.05 + 0.3 }}
                                                                className="w-1 h-6 bg-white rounded-sm mx-[2px]"
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`w-14 text-right font-mono text-sm font-bold ${color.text}`}>
                                                <AnimatedCount target={item.count} duration={0.6 + idx * 0.08} />
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="pt-4 border-t border-white/[0.08] flex items-center justify-between"
                            >
                                <span className="text-sm text-white/35">
                                    {tReplace("bigramNarrative.normalizationViz.totalLabel", { char: EXAMPLE_CHAR })}
                                </span>
                                <span className="text-white font-mono font-bold text-lg">{TOTAL}</span>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* ── Step 1: Division — animated per-row reveal ── */}
                    {step === 1 && (
                        <motion.div
                            key="dividing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-5"
                        >
                            <p className="text-xs text-white/35 text-center">
                                {t("bigramNarrative.normalizationViz.step2Desc")}
                            </p>

                            <div className="space-y-3">
                                {COUNTS.map((item, idx) => {
                                    const color = COLORS[idx];
                                    const pct = ((item.count / TOTAL) * 100).toFixed(1);
                                    const isActive = idx <= divisionIndex;
                                    return (
                                        <motion.div
                                            key={item.char}
                                            initial={{ opacity: 0.3 }}
                                            animate={{ opacity: isActive ? 1 : 0.3 }}
                                            className="flex items-center gap-3 sm:gap-4"
                                        >
                                            <code className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.08] text-white font-mono text-base font-bold shrink-0">
                                                {displayChar(item.char)}
                                            </code>
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className={`font-mono text-sm font-bold ${color.text}`}>{item.count}</span>
                                                <span className="text-white/20">÷</span>
                                                <span className="font-mono text-sm text-white/50">{TOTAL}</span>
                                                <span className="text-white/20">=</span>
                                                <AnimatePresence>
                                                    {isActive && (
                                                        <motion.span
                                                            initial={{ opacity: 0, scale: 0.8, x: -8 }}
                                                            animate={{ opacity: 1, scale: 1, x: 0 }}
                                                            className={`font-mono text-base font-bold ${color.text}`}
                                                        >
                                                            {pct}%
                                                        </motion.span>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            <AnimatePresence>
                                {showResult && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] text-center"
                                    >
                                        <p className="text-sm text-emerald-300 font-semibold">
                                            ✓ {t("bigramNarrative.normalizationViz.sumLabel")} <span className="text-emerald-400 font-mono font-bold">100%</span>
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* ── Step 2: Probability bars — morphed from counts ── */}
                    {step === 2 && (
                        <motion.div
                            key="probabilities"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-3"
                        >
                            <p className="text-xs text-white/35 text-center mb-4">
                                {tReplace("bigramNarrative.normalizationViz.step3Desc", { total: String(TOTAL) })}
                            </p>

                            {/* Column headers */}
                            <div className="flex items-center gap-3 px-1 mb-1">
                                <div className="w-10 text-[9px] text-white/25 font-mono uppercase tracking-widest">
                                    {t("bigramNarrative.normalizationViz.charHeader")}
                                </div>
                                <div className="flex-1 text-[9px] text-white/25 font-mono uppercase tracking-widest">
                                    {t("bigramNarrative.normalizationViz.probabilityHeader")}
                                </div>
                                <div className="w-14 text-[9px] text-white/25 font-mono uppercase tracking-widest text-right">
                                    {t("bigramNarrative.normalizationViz.pctHeader")}
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                {probabilities.map((item, idx) => {
                                    const color = COLORS[idx];
                                    return (
                                        <motion.div
                                            key={item.char}
                                            initial={{ opacity: 0, x: -16 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.08 }}
                                            className="flex items-center gap-3"
                                        >
                                            <code className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.08] text-white font-mono text-base font-bold">
                                                {displayChar(item.char)}
                                            </code>
                                            <div className="flex-1">
                                                <div className="relative h-10 bg-white/[0.03] rounded-lg overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${item.probability}%` }}
                                                        transition={{ duration: 0.6, delay: idx * 0.1 + 0.1, ease: "easeOut" }}
                                                        className={`h-full rounded-lg bg-gradient-to-r ${color.bar} shadow-lg ${color.glow}`}
                                                    />
                                                </div>
                                            </div>
                                            <motion.span
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: idx * 0.1 + 0.4 }}
                                                className={`w-14 text-right font-mono text-sm font-bold ${color.text}`}
                                            >
                                                {item.probability.toFixed(1)}%
                                            </motion.span>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="pt-4 border-t border-white/[0.08] flex items-center justify-between"
                            >
                                <span className="text-sm text-white/35">
                                    {t("bigramNarrative.normalizationViz.sumLabel")}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    <span className="text-emerald-400 font-mono font-bold text-lg">100%</span>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNextStep}
                    disabled={step === 2}
                    className="group relative rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.06] to-teal-500/[0.06] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="relative flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        {t("bigramNarrative.normalizationViz.nextStep")}
                    </div>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleReset}
                    disabled={step === 0}
                    className="group relative rounded-xl border border-white/10 bg-white/[0.02] px-6 py-3 text-sm font-semibold text-white/70 transition-colors hover:border-white/20 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="relative flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" />
                        {t("bigramNarrative.normalizationViz.reset")}
                    </div>
                </motion.button>
            </div>
        </div>
    );
});
