"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/i18n/context";

const DEFAULT_TEXT = "sancho tiene hambre";

export function TrainingWithTextDemo() {
    const { t } = useI18n();
    const [windowSize, setWindowSize] = useState(4);
    const [pos, setPos] = useState(0);
    const [playing, setPlaying] = useState(true);
    const [speed, setSpeed] = useState(1);
    const [epoch, setEpoch] = useState(1);
    const [showShortcutsHint, setShowShortcutsHint] = useState(true);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const text = DEFAULT_TEXT;
    const maxPos = text.length - windowSize;

    const ctxWindow = text.slice(pos, pos + windowSize);
    const target = pos + windowSize < text.length ? text[pos + windowSize] : null;

    const advance = useCallback(() => {
        setPos((p) => {
            if (p >= maxPos) {
                setEpoch((e) => e + 1);
                return 0;
            }
            return p + 1;
        });
    }, [maxPos]);

    const back = useCallback(() => {
        setPos((p) => Math.max(0, p - 1));
    }, []);

    useEffect(() => {
        if (!playing) return;
        timerRef.current = setTimeout(advance, 800 / speed);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [playing, pos, speed, advance]);

    useEffect(() => {
        setPos(0);
        setEpoch(1);
    }, [windowSize]);

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

    const reset = () => { setPos(0); setEpoch(1); };

    return (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.015] p-6">
            <p className="text-xs font-mono uppercase tracking-widest text-white/30 mb-5">
                {t("neuralNetworkNarrative.training.textDemo.title")}
            </p>

            {/* Context window size selector */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
                <span className="text-xs text-white/40">{t("neuralNetworkNarrative.training.textDemo.windowSize")}:</span>
                {[2, 3, 4, 5].map((n) => (
                    <button
                        key={n}
                        onClick={() => setWindowSize(n)}
                        className={`w-11 h-11 rounded-lg text-xs font-bold transition-all border ${windowSize === n
                                ? "bg-rose-500/20 border-rose-500/30 text-rose-400"
                                : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/60"
                            }`}
                    >
                        {n}
                    </button>
                ))}
            </div>

            {/* Text display with sliding window */}
            <div className="rounded-xl bg-black/30 border border-white/[0.05] p-4 mb-4 overflow-x-auto">
                <div className="font-mono text-lg tracking-wider whitespace-nowrap relative">
                    {text.split("").map((ch, i) => {
                        const inWindow = i >= pos && i < pos + windowSize;
                        const isTarget = i === pos + windowSize;
                        return (
                            <span
                                key={i}
                                className={`inline-block transition-all duration-200 px-[1px] ${inWindow
                                    ? "bg-rose-500/20 text-white border-b-2 border-rose-500/50 rounded-sm"
                                    : isTarget
                                        ? "text-amber-400 font-bold"
                                        : "text-white/25"
                                    }`}
                            >
                                {ch === " " ? "\u00A0" : ch}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Current pair display */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={pos}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-3 mb-5 font-mono text-sm"
                >
                    <span className="px-2 py-1 rounded bg-rose-500/15 border border-rose-500/25 text-rose-400">
                        {ctxWindow.split("").map((c) => (c === " " ? "␣" : c)).join("")}
                    </span>
                    <span className="text-white/20">→</span>
                    <span className="px-2 py-1 rounded bg-amber-500/15 border border-amber-500/25 text-amber-400 font-bold">
                        {target === null ? "—" : target === " " ? "␣" : target}
                    </span>
                </motion.div>
            </AnimatePresence>

            {/* Step counter */}
            <div className="flex items-center gap-4 mb-4 text-xs text-white/40 font-mono">
                <span>
                    {t("neuralNetworkNarrative.training.textDemo.step")
                        .replace("{n}", String(pos + 1))
                        .replace("{total}", String(maxPos + 1))}
                </span>
                <span>
                    {t("neuralNetworkNarrative.training.textDemo.epoch")
                        .replace("{n}", String(epoch))}
                </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 flex-wrap">
                <button
                    onClick={() => setPlaying(!playing)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:bg-rose-500/30 transition-all"
                >
                    {playing
                        ? t("neuralNetworkNarrative.training.textDemo.pause")
                        : t("neuralNetworkNarrative.training.textDemo.play")}
                </button>
                <button
                    onClick={() => { setPlaying(false); advance(); }}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 transition-all"
                >
                    {t("neuralNetworkNarrative.training.textDemo.stepBtn")}
                </button>
                <button
                    onClick={reset}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 transition-all"
                >
                    {t("neuralNetworkNarrative.training.textDemo.reset")}
                </button>

                {showShortcutsHint && (
                    <span className="px-2 py-1 rounded-full text-[9px] font-mono uppercase tracking-widest bg-white/[0.03] border border-white/[0.06] text-white/30">
                        {t("neuralNetworkNarrative.training.textDemo.shortcutsHint")}
                    </span>
                )}

                {/* Speed */}
                <div className="flex items-center gap-2 ml-auto">
                    <span className="text-[10px] text-white/25">{t("neuralNetworkNarrative.training.textDemo.speed")}</span>
                    {[0.5, 1, 2, 3].map((s) => (
                        <button
                            key={s}
                            onClick={() => setSpeed(s)}
                            className={`text-[10px] px-1.5 py-0.5 rounded transition-all ${speed === s ? "text-rose-400 bg-rose-500/15" : "text-white/30 hover:text-white/50"
                                }`}
                        >
                            {s}x
                        </button>
                    ))}
                </div>
            </div>

            {epoch > 1 && (
                <p className="mt-4 text-[11px] text-white/30 italic">
                    {t("neuralNetworkNarrative.training.textDemo.epochNote")}
                </p>
            )}
        </div>
    );
}
