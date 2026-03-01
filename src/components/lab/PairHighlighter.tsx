"use client";

import { memo, useCallback, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, RotateCcw } from "lucide-react";

import { useI18n } from "@/i18n/context";

/* ─── Types ─── */
type PairCount = { pair: string; count: number };

/* ─── Defaults ─── */
const DEFAULT_TEXT = "the cat sat";

/**
 * PairHighlighter — step-by-step guided discovery of character pairs.
 *
 * The learner clicks "Next" to advance one pair at a time. Each step
 * highlights a pair, shows a +1 badge, and updates the tally. This
 * lets the learner notice patterns at their own pace.
 */
export const PairHighlighter = memo(function PairHighlighter() {
    const { t } = useI18n();

    const [text, setText] = useState(DEFAULT_TEXT);
    const [step, setStep] = useState(-1); // -1 = not started, 0..totalPairs-1 = current pair
    const [finished, setFinished] = useState(false);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customText, setCustomText] = useState("");

    const totalPairs = text.length - 1;

    /* ── Pair counts accumulated up to current step ── */
    const pairCounts: PairCount[] = (() => {
        if (step < 0) return [];
        const counts: Record<string, number> = {};
        const order: string[] = [];
        for (let i = 0; i <= step && i < totalPairs; i++) {
            const pair = `${text[i]}→${text[i + 1]}`;
            if (!(pair in counts)) order.push(pair);
            counts[pair] = (counts[pair] || 0) + 1;
        }
        return order.map((pair) => ({ pair, count: counts[pair] }));
    })();

    /* ── Current highlighted pair ── */
    const currentPairIdx = step >= 0 && step < totalPairs ? step : -1;

    /* ── Step forward ── */
    const advance = useCallback(() => {
        setStep((prev) => {
            const next = prev + 1;
            if (next >= totalPairs) {
                setFinished(true);
                return prev;
            }
            return next;
        });
    }, [totalPairs]);

    /* ── Start / restart ── */
    const start = useCallback(() => {
        setStep(0);
        setFinished(false);
    }, []);

    const reset = useCallback(() => {
        setStep(-1);
        setFinished(false);
    }, []);

    /* ── Handle custom text ── */
    const handleCustomSubmit = () => {
        const cleaned = customText.trim().toLowerCase().slice(0, 16);
        if (cleaned.length >= 2) {
            setText(cleaned);
            setShowCustomInput(false);
            setCustomText("");
            setStep(-1);
            setFinished(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* ── Prompt / instruction ── */}
            {step === -1 && !finished && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                >
                    <p className="text-sm text-white/50 leading-relaxed mb-4">
                        {t("bigramNarrative.pairHighlighter.stepPrompt")}
                    </p>
                    <button
                        onClick={start}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-sm font-mono hover:bg-emerald-500/25 transition-colors cursor-pointer"
                    >
                        <ChevronRight className="w-4 h-4" />
                        {t("bigramNarrative.pairHighlighter.startButton")}
                    </button>
                </motion.div>
            )}

            {/* ── The word with highlighted pairs ── */}
            <div className="text-center py-4">
                <div className="inline-flex items-center gap-0.5 px-6 py-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                    {text.split("").map((char, i) => {
                        const isFirst = i === currentPairIdx;
                        const isSecond = i === currentPairIdx + 1;
                        const isActive = isFirst || isSecond;

                        return (
                            <motion.span
                                key={`${text}-${i}`}
                                animate={{
                                    scale: isActive ? 1.15 : 1,
                                    color: isActive
                                        ? "#34d399"
                                        : "rgba(255,255,255,0.45)",
                                }}
                                transition={{ duration: 0.25 }}
                                className="relative text-4xl md:text-5xl font-mono font-bold mx-1 select-none"
                            >
                                {char === " " ? "·" : char}

                                {/* Connection line between pair */}
                                {isFirst && (
                                    <motion.div
                                        initial={{ scaleX: 0, opacity: 0 }}
                                        animate={{ scaleX: 1, opacity: 1 }}
                                        className="absolute -bottom-3 left-1/2 w-[calc(100%+0.75rem)] h-0.5 bg-emerald-400/60 origin-left rounded-full"
                                    />
                                )}

                                {/* +1 badge above second char */}
                                <AnimatePresence>
                                    {isSecond && (
                                        <motion.span
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-mono text-emerald-400/70 whitespace-nowrap"
                                        >
                                            +1
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.span>
                        );
                    })}
                </div>

                {/* Current pair caption */}
                <AnimatePresence mode="wait">
                    {currentPairIdx >= 0 && (
                        <motion.p
                            key={`pair-${currentPairIdx}`}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-4 text-sm font-mono text-emerald-400/80"
                        >
                            {t("bigramNarrative.pairHighlighter.pairFound")
                                .replace(
                                    "{first}",
                                    text[currentPairIdx] === " "
                                        ? "·"
                                        : text[currentPairIdx]
                                )
                                .replace(
                                    "{second}",
                                    text[currentPairIdx + 1] === " "
                                        ? "·"
                                        : text[currentPairIdx + 1]
                                )}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Counter table ── */}
            <div className="px-2">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/25">
                        {t("bigramNarrative.pairHighlighter.countsLabel")}
                    </span>
                    <span className="text-[10px] font-mono text-white/15">
                        ({step >= 0 ? Math.min(step + 1, totalPairs) : 0}/
                        {totalPairs})
                    </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 min-h-[44px]">
                    <AnimatePresence>
                        {pairCounts.map(({ pair, count }) => (
                            <motion.div
                                key={pair}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                layout
                                className="flex items-center justify-between px-3 py-2 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.04]"
                            >
                                <span className="font-mono text-sm text-white/70">
                                    {pair}
                                </span>
                                <motion.span
                                    key={`${pair}-${count}`}
                                    initial={{ scale: 1.4 }}
                                    animate={{ scale: 1 }}
                                    className="font-mono text-sm font-bold text-emerald-400"
                                >
                                    {count}
                                </motion.span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── Completion summary ── */}
            <AnimatePresence>
                {finished && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mx-2 p-4 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04]"
                    >
                        <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-white/40">
                                {t("bigramNarrative.pairHighlighter.summaryUnique")}
                                <span className="text-emerald-400 font-bold ml-1">{pairCounts.length}</span>
                            </span>
                            <span className="text-white/40">
                                {t("bigramNarrative.pairHighlighter.summaryTotal")}
                                <span className="text-emerald-400 font-bold ml-1">{totalPairs}</span>
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Step controls ── */}
            {step >= 0 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                    {!finished ? (
                        <button
                            onClick={advance}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-sm font-mono hover:bg-emerald-500/25 transition-colors cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4" />
                            {t("bigramNarrative.pairHighlighter.nextStep")}
                            <span className="text-white/30 text-xs">{step + 1}/{totalPairs}</span>
                        </button>
                    ) : (
                        <>
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={() => { reset(); setTimeout(start, 100); }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-white/40 border border-white/[0.06] hover:bg-white/[0.04] hover:text-white/60 transition-colors cursor-pointer"
                            >
                                <RotateCcw className="w-3 h-3" />
                                {t("bigramNarrative.pairHighlighter.replay")}
                            </motion.button>
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                onClick={() => setShowCustomInput(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-emerald-400/70 border border-emerald-500/15 hover:bg-emerald-500/[0.06] hover:text-emerald-400 transition-colors cursor-pointer"
                            >
                                {t("bigramNarrative.pairHighlighter.tryOwn")}
                            </motion.button>
                        </>
                    )}
                </div>
            )}

            {/* ── Custom input ── */}
            <AnimatePresence>
                {showCustomInput && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex gap-2 items-center justify-center pt-2">
                            <input
                                type="text"
                                value={customText}
                                onChange={(e) =>
                                    setCustomText(e.target.value.slice(0, 12))
                                }
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleCustomSubmit()
                                }
                                placeholder={t(
                                    "bigramNarrative.pairHighlighter.placeholder"
                                )}
                                className="w-40 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm font-mono text-white/80 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/30"
                                autoFocus
                            />
                            <button
                                onClick={handleCustomSubmit}
                                disabled={customText.trim().length < 2}
                                className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                {t("bigramNarrative.pairHighlighter.go")}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
