"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { NN_COLORS } from "./visualizer-theme";

/*
  Animated timeline: data examples flow through in batches.
  Counter shows: Step [n], Epoch [n], Batch [n/total].
  Play/pause/step controls.
  Visual: small dots represent examples, groups of dots = batches, full pass = epoch.
*/

const TOTAL_EXAMPLES = 16;
const BATCH_SIZE = 4;
const BATCHES_PER_EPOCH = TOTAL_EXAMPLES / BATCH_SIZE; // 4

const DOT_COLORS = [
    NN_COLORS.input.hex,
    NN_COLORS.weight.hex,
    NN_COLORS.target.hex,
    NN_COLORS.hidden.hex,
];

export function StepEpochBatchCounter() {
    const { t } = useI18n();
    const shouldReduceMotion = useReducedMotion();
    const [step, setStep] = useState(0); // global step counter
    const [playing, setPlaying] = useState(false);
    const [showShortcutsHint, setShowShortcutsHint] = useState(true);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const epoch = Math.floor(step / BATCHES_PER_EPOCH);
    const batchInEpoch = step % BATCHES_PER_EPOCH;
    const activeBatchStart = batchInEpoch * BATCH_SIZE;

    const advance = useCallback(() => {
        setStep(s => s + 1);
    }, []);

    const back = useCallback(() => {
        setStep(s => Math.max(0, s - 1));
    }, []);

    const reset = useCallback(() => {
        setPlaying(false);
        setStep(0);
        if (timerRef.current) clearInterval(timerRef.current);
    }, []);

    useEffect(() => {
        if (playing) {
            timerRef.current = setInterval(advance, shouldReduceMotion ? 200 : 600);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [playing, advance, shouldReduceMotion]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const tag = target?.tagName?.toLowerCase();
            const isTypingTarget =
                tag === "input" ||
                tag === "textarea" ||
                (target?.getAttribute("contenteditable") === "true");
            if (isTypingTarget) return;

            if (e.key === " ") {
                e.preventDefault();
                setShowShortcutsHint(false);
                setPlaying((p) => !p);
            }

            if (e.key === "ArrowRight") {
                e.preventDefault();
                setShowShortcutsHint(false);
                setPlaying(false);
                advance();
            }

            if (e.key === "ArrowLeft") {
                e.preventDefault();
                setShowShortcutsHint(false);
                setPlaying(false);
                back();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [advance, back]);

    // Stop after 3 epochs
    useEffect(() => {
        if (epoch >= 3) {
            setPlaying(false);
        }
    }, [epoch]);

    const spring = shouldReduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 300, damping: 25 };

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Counters */}
            <div className="grid grid-cols-3 gap-2">
                {[
                    { label: t("neuralNetworkNarrative.stepEpochBatch.stepLabel"), value: step + 1, color: NN_COLORS.output.hex },
                    { label: t("neuralNetworkNarrative.stepEpochBatch.epochLabel"), value: Math.min(epoch + 1, 3), color: NN_COLORS.hidden.hex },
                    { label: t("neuralNetworkNarrative.stepEpochBatch.batchLabel"), value: `${batchInEpoch + 1}/${BATCHES_PER_EPOCH}`, color: NN_COLORS.weight.hex },
                ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-lg bg-black/20 border border-white/[0.06] p-2.5 text-center">
                        <p className="text-[8px] font-mono text-white/25 mb-0.5">{label}</p>
                        <motion.p
                            key={String(value)}
                            animate={{ scale: [1.1, 1] }}
                            transition={spring}
                            className="text-lg font-mono font-bold"
                            style={{ color }}
                        >
                            {value}
                        </motion.p>
                    </div>
                ))}
            </div>

            {/* Data dots visualization */}
            <div className="rounded-xl bg-black/25 border border-white/[0.05] p-4">
                <p className="text-[8px] font-mono text-white/20 mb-2">
                    {t("neuralNetworkNarrative.stepEpochBatch.dataLabel").replace("{n}", String(TOTAL_EXAMPLES))}
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: TOTAL_EXAMPLES }, (_, i) => {
                        const batchIdx = Math.floor(i / BATCH_SIZE);
                        const isActive = batchIdx === batchInEpoch && epoch < 3;
                        const isProcessed = epoch >= 3 || batchIdx < batchInEpoch;
                        const dotColor = DOT_COLORS[batchIdx % DOT_COLORS.length];

                        return (
                            <motion.div
                                key={i}
                                className="w-5 h-5 rounded-full border flex items-center justify-center text-[7px] font-mono"
                                animate={{
                                    scale: isActive ? 1.2 : 1,
                                    opacity: isProcessed ? 0.3 : isActive ? 1 : 0.6,
                                }}
                                transition={spring}
                                style={{
                                    background: isActive ? dotColor + "30" : isProcessed ? dotColor + "10" : dotColor + "15",
                                    borderColor: isActive ? dotColor : isProcessed ? dotColor + "30" : dotColor + "40",
                                    color: dotColor,
                                }}
                            >
                                {i + 1}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Batch grouping indicators */}
                <div className="flex gap-1.5 mt-2">
                    {Array.from({ length: BATCHES_PER_EPOCH }, (_, b) => (
                        <div
                            key={b}
                            className="flex-1 h-1 rounded-full transition-all"
                            style={{
                                background: b === batchInEpoch && epoch < 3
                                    ? DOT_COLORS[b % DOT_COLORS.length]
                                    : b < batchInEpoch || epoch >= 3
                                        ? DOT_COLORS[b % DOT_COLORS.length] + "40"
                                        : "rgba(255,255,255,0.06)",
                            }}
                        />
                    ))}
                </div>
                <p className="text-[7px] font-mono text-white/15 mt-1 text-center">
                    {t("neuralNetworkNarrative.stepEpochBatch.batchSizeLabel").replace("{n}", String(BATCH_SIZE))}
                </p>
            </div>

            {/* Epoch progress bar */}
            <div className="space-y-1">
                <div className="flex items-center justify-between text-[8px] font-mono text-white/20">
                    <span>{t("neuralNetworkNarrative.stepEpochBatch.epochProgress")}</span>
                    <span>{Math.min(epoch + 1, 3)}/3</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <motion.div
                        className="h-full rounded-full"
                        style={{ background: NN_COLORS.hidden.hex }}
                        animate={{ width: `${(Math.min(step, BATCHES_PER_EPOCH * 3) / (BATCHES_PER_EPOCH * 3)) * 100}%` }}
                        transition={{ duration: 0.2 }}
                    />
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
                <button
                    onClick={() => setPlaying(!playing)}
                    disabled={epoch >= 3}
                    className="px-4 py-3 min-h-11 rounded-full text-xs font-semibold font-mono border transition-all disabled:opacity-30"
                    style={{
                        background: NN_COLORS.output.hex + "12",
                        borderColor: NN_COLORS.output.hex + "40",
                        color: NN_COLORS.output.hex,
                    }}
                >
                    {playing ? t("neuralNetworkNarrative.stepEpochBatch.pause") : t("neuralNetworkNarrative.stepEpochBatch.play")}
                </button>
                <button
                    onClick={advance}
                    disabled={playing || epoch >= 3}
                    className="px-3 py-3 min-h-11 rounded-full text-xs font-semibold font-mono bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 disabled:opacity-30 transition-all"
                >
                    {t("neuralNetworkNarrative.stepEpochBatch.stepBtn")}
                </button>
                <button
                    onClick={reset}
                    className="px-3 py-3 min-h-11 rounded-full text-xs font-semibold font-mono bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 transition-all"
                >
                    {t("neuralNetworkNarrative.stepEpochBatch.reset")}
                </button>

                {showShortcutsHint && (
                    <span className="px-2 py-1.5 rounded-full text-[9px] font-mono uppercase tracking-widest bg-white/[0.03] border border-white/[0.06] text-white/30">
                        {t("neuralNetworkNarrative.stepEpochBatch.shortcutsHint")}
                    </span>
                )}
            </div>

            {epoch >= 3 && (
                <p className="text-[10px] text-center font-semibold" style={{ color: NN_COLORS.output.hex }}>
                    {t("neuralNetworkNarrative.stepEpochBatch.complete")}
                </p>
            )}
        </div>
    );
}
