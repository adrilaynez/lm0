"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Dices, RotateCcw } from "lucide-react";

import { useI18n } from "@/i18n/context";

/* ─── Hardcoded realistic bigram frequencies ─── */
const QUERY_DATA: Record<string, Record<string, number>> = {
    h: { e: 3481, i: 1892, a: 1544, o: 987, " ": 432, t: 201 },
    e: { " ": 4012, r: 2156, n: 1423, s: 1198, d: 987, a: 654 },
    t: { h: 5621, e: 2034, i: 1567, o: 1234, " ": 987, a: 654 },
    " ": { t: 3456, a: 2678, s: 2134, i: 1890, o: 1567, h: 1234 },
    a: { n: 2890, t: 2345, r: 1567, s: 1234, l: 987, " ": 876 },
    o: { n: 2345, r: 1890, f: 1567, u: 1234, t: 987, " ": 876 },
    i: { n: 3456, t: 1890, s: 1567, o: 1234, c: 987, l: 876 },
    n: { " ": 3890, g: 1890, t: 1567, d: 1234, e: 987, o: 876 },
    s: { " ": 2890, t: 2345, e: 1890, i: 1234, o: 987, h: 654 },
};

const CHARS = Object.keys(QUERY_DATA);

function displayChar(c: string) {
    return c === " " ? "·" : c;
}

/* ─── Component ─── */
export const PredictionQueryVisualizer = memo(function PredictionQueryVisualizer() {
    const { t } = useI18n();
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedChar, setSelectedChar] = useState<string | null>(null);
    const [rolledChar, setRolledChar] = useState<string | null>(null);
    const [isRolling, setIsRolling] = useState(false);
    const rollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ── Derived data for selected character ── */
    const rowData = useMemo(() => {
        if (!selectedChar) return [];
        const raw = QUERY_DATA[selectedChar];
        if (!raw) return [];
        return Object.entries(raw)
            .sort((a, b) => b[1] - a[1])
            .map(([char, count]) => ({ char, count }));
    }, [selectedChar]);

    const totalCount = useMemo(
        () => rowData.reduce((sum, d) => sum + d.count, 0),
        [rowData]
    );

    const probabilities = useMemo(
        () => rowData.map((d) => ({ ...d, prob: d.count / totalCount })),
        [rowData, totalCount]
    );

    const maxCount = rowData.length > 0 ? rowData[0].count : 1;

    /* ── Character selection (Step 0 → 1) ── */
    const selectChar = useCallback((ch: string) => {
        setSelectedChar(ch);
        setCurrentStep(1);
        setRolledChar(null);
    }, []);

    /* ── Step navigation ── */
    const nextStep = useCallback(() => {
        setCurrentStep((s) => Math.min(s + 1, 4));
    }, []);

    /* ── Dice roll animation (Step 4) ── */
    const rollDice = useCallback(() => {
        if (!selectedChar || isRolling) return;
        setIsRolling(true);
        setRolledChar(null);

        const probs = probabilities;
        let flickCount = 0;
        const maxFlicks = 12;

        const flick = () => {
            flickCount++;
            const randIdx = Math.floor(Math.random() * probs.length);
            setRolledChar(probs[randIdx].char);

            if (flickCount < maxFlicks) {
                rollTimerRef.current = setTimeout(flick, 60 + flickCount * 15);
            } else {
                // Weighted final pick
                const rand = Math.random();
                let cumulative = 0;
                let picked = probs[0].char;
                for (const p of probs) {
                    cumulative += p.prob;
                    if (rand <= cumulative) {
                        picked = p.char;
                        break;
                    }
                }
                setRolledChar(picked);
                setIsRolling(false);
            }
        };

        flick();
    }, [selectedChar, probabilities, isRolling]);

    /* ── Reset ── */
    const reset = useCallback(() => {
        setCurrentStep(0);
        setSelectedChar(null);
        setRolledChar(null);
        setIsRolling(false);
        if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
    }, []);

    /* ── Cleanup ── */
    useEffect(() => {
        return () => {
            if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
        };
    }, []);

    /* ── Step labels ── */
    const stepLabels = [
        t("bigramNarrative.queryViz.step0Label"),
        t("bigramNarrative.queryViz.step1Label"),
        t("bigramNarrative.queryViz.step2Label"),
        t("bigramNarrative.queryViz.step3Label"),
        t("bigramNarrative.queryViz.step4Label"),
    ];

    return (
        <div className="space-y-6">
            {/* ── Step indicator ── */}
            <div className="flex items-center justify-center gap-1">
                {stepLabels.map((label, i) => (
                    <div key={i} className="flex items-center gap-1">
                        <div
                            className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-mono font-bold transition-all duration-300 ${
                                i === currentStep
                                    ? "bg-emerald-500/30 text-emerald-300 ring-2 ring-emerald-500/40"
                                    : i < currentStep
                                        ? "bg-emerald-500/15 text-emerald-400/60"
                                        : "bg-white/[0.04] text-white/20"
                            }`}
                        >
                            {i + 1}
                        </div>
                        <span
                            className={`text-[9px] font-mono uppercase tracking-wider hidden sm:inline ${
                                i === currentStep ? "text-white/50" : "text-white/15"
                            }`}
                        >
                            {label}
                        </span>
                        {i < stepLabels.length - 1 && (
                            <div className={`w-4 h-px mx-1 ${i < currentStep ? "bg-emerald-500/30" : "bg-white/[0.06]"}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* ── Step content ── */}
            <AnimatePresence mode="wait">
                {/* STEP 0: Character selection */}
                {currentStep === 0 && (
                    <motion.div
                        key="step0"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="text-center space-y-4"
                    >
                        <p className="text-sm text-white/50">
                            {t("bigramNarrative.queryViz.pickChar")}
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {CHARS.map((ch) => (
                                <button
                                    key={ch}
                                    onClick={() => selectChar(ch)}
                                    aria-label={`Select character ${displayChar(ch)}`}
                                    className="w-12 h-12 rounded-xl font-mono text-xl font-bold border border-white/[0.08] bg-white/[0.03] text-white/60 hover:bg-emerald-500/15 hover:border-emerald-500/30 hover:text-emerald-300 transition-all duration-200 cursor-pointer"
                                >
                                    {displayChar(ch)}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* STEP 1: Row lookup */}
                {currentStep === 1 && selectedChar && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-4"
                    >
                        <p className="text-center text-sm text-white/50">
                            {t("bigramNarrative.queryViz.lookingUp").replace("{char}", displayChar(selectedChar))}
                        </p>

                        {/* Mini matrix showing the selected row */}
                        <div className="overflow-auto rounded-xl border border-white/[0.08] bg-black/40 custom-scrollbar">
                            <table className="w-full border-collapse font-mono text-xs">
                                <thead>
                                    <tr>
                                        <th className="px-2 py-2 text-[10px] text-white/30 border-b border-r border-white/[0.06] bg-[var(--lab-viz-bg)]" />
                                        {rowData.map(({ char }) => (
                                            <th
                                                key={char}
                                                className="px-3 py-2 text-center border-b border-white/[0.06] bg-[var(--lab-viz-bg)] text-white/50"
                                            >
                                                {displayChar(char)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Dimmed rows for other chars */}
                                    {CHARS.filter((c) => c !== selectedChar)
                                        .slice(0, 2)
                                        .map((c) => (
                                            <tr key={c} className="opacity-20">
                                                <th className="px-2 py-1.5 text-white/30 border-r border-white/[0.06] bg-[var(--lab-viz-bg)]">
                                                    {displayChar(c)}
                                                </th>
                                                {rowData.map((_, ci) => (
                                                    <td key={ci} className="px-3 py-1.5 text-center text-white/10 border-white/[0.04]">
                                                        ···
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    {/* Highlighted selected row */}
                                    <motion.tr
                                        initial={{ backgroundColor: "rgba(16,185,129,0)" }}
                                        animate={{ backgroundColor: "rgba(16,185,129,0.08)" }}
                                        transition={{ duration: 0.6 }}
                                    >
                                        <th className="px-2 py-2 text-emerald-300 font-bold border-r border-white/[0.06] bg-emerald-500/10">
                                            {displayChar(selectedChar)}
                                        </th>
                                        {rowData.map(({ char, count }) => (
                                            <motion.td
                                                key={char}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.3 }}
                                                className="px-3 py-2 text-center text-emerald-200 font-bold"
                                            >
                                                {count}
                                            </motion.td>
                                        ))}
                                    </motion.tr>
                                    {/* Dimmed rows below */}
                                    {CHARS.filter((c) => c !== selectedChar)
                                        .slice(2, 4)
                                        .map((c) => (
                                            <tr key={c} className="opacity-20">
                                                <th className="px-2 py-1.5 text-white/30 border-r border-white/[0.06] bg-[var(--lab-viz-bg)]">
                                                    {displayChar(c)}
                                                </th>
                                                {rowData.map((_, ci) => (
                                                    <td key={ci} className="px-3 py-1.5 text-center text-white/10 border-white/[0.04]">
                                                        ···
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={nextStep}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-sm font-mono hover:bg-emerald-500/25 transition-colors cursor-pointer"
                            >
                                <ChevronRight className="w-4 h-4" />
                                {t("bigramNarrative.queryViz.next")}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 2: Raw counts bar chart */}
                {currentStep === 2 && selectedChar && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-4"
                    >
                        <p className="text-center text-sm text-white/50">
                            {t("bigramNarrative.queryViz.rawCountsIntro").replace("{char}", displayChar(selectedChar))}
                        </p>

                        <div className="space-y-2 max-w-lg mx-auto">
                            {rowData.map(({ char, count }, i) => (
                                <motion.div
                                    key={char}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    className="flex items-center gap-3"
                                >
                                    <code className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/70 font-mono text-sm font-bold shrink-0">
                                        {displayChar(char)}
                                    </code>
                                    <div className="flex-1 h-7 bg-white/[0.03] rounded-lg overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(count / maxCount) * 100}%` }}
                                            transition={{ duration: 0.5, delay: i * 0.08 }}
                                            className="h-full rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-400"
                                        />
                                    </div>
                                    <span className="w-14 text-right font-mono text-xs font-bold text-white/60">
                                        {count.toLocaleString()}
                                    </span>
                                </motion.div>
                            ))}
                        </div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-center text-[10px] font-mono text-white/25 uppercase tracking-widest"
                        >
                            {t("bigramNarrative.queryViz.totalRaw").replace("{total}", totalCount.toLocaleString())}
                        </motion.p>

                        <div className="flex justify-center">
                            <button
                                onClick={nextStep}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-sm font-mono hover:bg-emerald-500/25 transition-colors cursor-pointer"
                            >
                                <ChevronRight className="w-4 h-4" />
                                {t("bigramNarrative.queryViz.next")}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 3: Normalization */}
                {currentStep === 3 && selectedChar && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-4"
                    >
                        <p className="text-center text-sm text-white/50">
                            {t("bigramNarrative.queryViz.normalizeIntro")}
                        </p>

                        {/* Formula */}
                        <div className="text-center">
                            <code className="inline-block px-4 py-2 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/20 text-emerald-300 text-sm font-mono">
                                count ÷ {totalCount.toLocaleString()} = probability
                            </code>
                        </div>

                        <div className="space-y-2 max-w-lg mx-auto">
                            {probabilities.map(({ char, count, prob }, i) => (
                                <motion.div
                                    key={char}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.06 }}
                                    className="flex items-center gap-3"
                                >
                                    <code className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/70 font-mono text-sm font-bold shrink-0">
                                        {displayChar(char)}
                                    </code>
                                    <div className="flex-1 h-7 bg-white/[0.03] rounded-lg overflow-hidden relative">
                                        <motion.div
                                            initial={{ width: `${(count / maxCount) * 100}%` }}
                                            animate={{ width: `${prob * 100}%` }}
                                            transition={{ duration: 0.8, delay: 0.3 + i * 0.06 }}
                                            className="h-full rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-400"
                                        />
                                    </div>
                                    <span className="w-16 text-right font-mono text-xs font-bold text-emerald-400">
                                        {(prob * 100).toFixed(1)}%
                                    </span>
                                </motion.div>
                            ))}
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={nextStep}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-sm font-mono hover:bg-emerald-500/25 transition-colors cursor-pointer"
                            >
                                <ChevronRight className="w-4 h-4" />
                                {t("bigramNarrative.queryViz.next")}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 4: Prediction / Dice roll */}
                {currentStep === 4 && selectedChar && (
                    <motion.div
                        key="step4"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-5"
                    >
                        <p className="text-center text-sm text-white/50">
                            {t("bigramNarrative.queryViz.predictionIntro").replace("{char}", displayChar(selectedChar))}
                        </p>

                        {/* Top prediction highlight */}
                        <div className="flex items-center justify-center gap-4">
                            <div className="text-center">
                                <p className="text-[10px] font-mono text-white/25 uppercase tracking-widest mb-1">
                                    {t("bigramNarrative.queryViz.topPrediction")}
                                </p>
                                <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                                    <span className="text-3xl font-mono font-bold text-emerald-300">
                                        {displayChar(probabilities[0]?.char ?? "")}
                                    </span>
                                    <span className="text-lg font-mono font-bold text-emerald-400/70">
                                        {((probabilities[0]?.prob ?? 0) * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Dice roll area */}
                        <div className="text-center space-y-3">
                            <p className="text-xs text-white/30">
                                {t("bigramNarrative.queryViz.diceExplain")}
                            </p>

                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={rollDice}
                                    disabled={isRolling}
                                    aria-label="Roll dice"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-sm font-mono hover:bg-emerald-500/25 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <Dices className="w-4 h-4" />
                                    {t("bigramNarrative.queryViz.rollDice")}
                                </button>

                                <AnimatePresence mode="wait">
                                    {rolledChar !== null && (
                                        <motion.div
                                            key={`roll-${rolledChar}-${isRolling}`}
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.5, opacity: 0 }}
                                            className={`w-14 h-14 rounded-xl flex items-center justify-center font-mono text-2xl font-bold border transition-all ${
                                                isRolling
                                                    ? "bg-white/[0.06] border-white/[0.1] text-white/60"
                                                    : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                                            }`}
                                        >
                                            {displayChar(rolledChar)}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {rolledChar && !isRolling && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-xs text-white/40"
                                >
                                    {t("bigramNarrative.queryViz.rolled")
                                        .replace("{char}", displayChar(selectedChar))
                                        .replace("{next}", displayChar(rolledChar))}
                                </motion.p>
                            )}
                        </div>

                        {/* Try another */}
                        <div className="flex justify-center">
                            <button
                                onClick={reset}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono text-white/40 border border-white/[0.08] hover:bg-white/[0.04] hover:text-white/60 transition-colors cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                {t("bigramNarrative.queryViz.tryAnother")}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
