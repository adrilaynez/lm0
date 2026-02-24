"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { NN_COLORS } from "./visualizer-theme";

/*
  Show same text with 1-char, 2-char, 3-char context windows.
  Network predictions degrade for longer-range patterns.
  Concrete failure: "After 'the qu', a 1-char model can't know 'i' is likely."
  Bridge: "To fix this, we need two things: more context and a smarter way to represent characters."
*/

type ContextSize = 1 | 2 | 3;

// Example text with predictions at each context size
const EXAMPLES: { text: string; pos: number; predictions: Record<ContextSize, { char: string; prob: number }[]> }[] = [
    {
        text: "the quick",
        pos: 5, // predicting 'u' after "the q"
        predictions: {
            1: [{ char: "u", prob: 0.08 }, { char: "e", prob: 0.12 }, { char: "a", prob: 0.10 }],
            2: [{ char: "u", prob: 0.52 }, { char: "a", prob: 0.10 }, { char: "e", prob: 0.08 }],
            3: [{ char: "u", prob: 0.78 }, { char: "a", prob: 0.05 }, { char: "i", prob: 0.03 }],
        },
    },
    {
        text: "i thought",
        pos: 4, // predicting 'o' after "i th"
        predictions: {
            1: [{ char: "e", prob: 0.35 }, { char: "a", prob: 0.12 }, { char: "o", prob: 0.08 }],
            2: [{ char: "e", prob: 0.30 }, { char: "i", prob: 0.15 }, { char: "o", prob: 0.12 }],
            3: [{ char: "o", prob: 0.38 }, { char: "e", prob: 0.28 }, { char: "i", prob: 0.10 }],
        },
    },
    {
        text: "she said ",
        pos: 5, // predicting 'a' after "she s"
        predictions: {
            1: [{ char: "t", prob: 0.15 }, { char: "e", prob: 0.12 }, { char: "a", prob: 0.09 }],
            2: [{ char: "a", prob: 0.22 }, { char: "t", prob: 0.18 }, { char: "e", prob: 0.14 }],
            3: [{ char: "a", prob: 0.55 }, { char: "t", prob: 0.12 }, { char: "h", prob: 0.08 }],
        },
    },
];

export function ContextLimitationDemo() {
    const { t } = useI18n();
    const shouldReduceMotion = useReducedMotion();
    const [contextSize, setContextSize] = useState<ContextSize>(1);
    const [exampleIdx, setExampleIdx] = useState(0);

    const example = EXAMPLES[exampleIdx];
    const context = example.text.slice(Math.max(0, example.pos - contextSize), example.pos);
    const trueChar = example.text[example.pos];
    const preds = example.predictions[contextSize];
    const topPred = preds[0];
    const isCorrect = topPred.char === trueChar;

    const spring = shouldReduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 24 };

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Example selector */}
            <div className="flex gap-2 flex-wrap">
                {EXAMPLES.map((ex, i) => (
                    <button
                        key={i}
                        onClick={() => setExampleIdx(i)}
                        className={`px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition-all border ${
                            exampleIdx === i
                                ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
                                : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/60"
                        }`}
                    >
                        &quot;{ex.text.slice(0, 6)}...&quot;
                    </button>
                ))}
            </div>

            {/* Context size toggle */}
            <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-white/25">{t("neuralNetworkNarrative.contextLimit.windowLabel")}</span>
                {([1, 2, 3] as ContextSize[]).map(size => (
                    <button
                        key={size}
                        onClick={() => setContextSize(size)}
                        className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all border ${
                            contextSize === size
                                ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                                : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/60"
                        }`}
                    >
                        {size} char{size > 1 ? "s" : ""}
                    </button>
                ))}
            </div>

            {/* Text visualization with context window */}
            <div className="rounded-xl bg-black/30 border border-white/[0.05] p-4">
                <div className="flex items-center justify-center gap-0.5 font-mono text-lg flex-wrap">
                    {example.text.split("").map((ch, i) => {
                        const inContext = i >= example.pos - contextSize && i < example.pos;
                        const isPredictionPos = i === example.pos;
                        return (
                            <span
                                key={i}
                                className="w-6 h-8 flex items-center justify-center rounded transition-all"
                                style={{
                                    background: inContext
                                        ? NN_COLORS.target.hex + "20"
                                        : isPredictionPos
                                            ? NN_COLORS.output.hex + "15"
                                            : "transparent",
                                    borderBottom: inContext
                                        ? `2px solid ${NN_COLORS.target.hex}`
                                        : isPredictionPos
                                            ? `2px solid ${NN_COLORS.output.hex}60`
                                            : "2px solid transparent",
                                    color: inContext
                                        ? NN_COLORS.target.hex
                                        : isPredictionPos
                                            ? NN_COLORS.output.hex
                                            : "rgba(255,255,255,0.25)",
                                    fontWeight: inContext || isPredictionPos ? 700 : 400,
                                }}
                            >
                                {ch === " " ? "␣" : ch}
                            </span>
                        );
                    })}
                </div>
                <div className="flex items-center justify-center gap-4 mt-2 text-[8px] font-mono text-white/20">
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-1 rounded" style={{ background: NN_COLORS.target.hex }} />
                        {t("neuralNetworkNarrative.contextLimit.contextWindow")} ({context.length})
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-1 rounded" style={{ background: NN_COLORS.output.hex + "60" }} />
                        {t("neuralNetworkNarrative.contextLimit.predictNext")}
                    </span>
                </div>
            </div>

            {/* Model sees → predicts */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${exampleIdx}-${contextSize}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="rounded-xl bg-black/15 border border-white/[0.04] p-3"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-mono text-white/25">{t("neuralNetworkNarrative.contextLimit.modelSees")}</span>
                        <span className="font-mono font-bold text-sm" style={{ color: NN_COLORS.target.hex }}>
                            &quot;{context}&quot;
                        </span>
                        <span className="text-white/15">→</span>
                        <span className="text-[9px] font-mono text-white/25">{t("neuralNetworkNarrative.contextLimit.predicts")}</span>
                    </div>
                    {preds.map(({ char, prob }, i) => (
                        <div key={i} className="flex items-center gap-2 mb-1">
                            <span className="w-4 text-[10px] font-mono font-bold text-center"
                                style={{ color: i === 0 ? (isCorrect ? NN_COLORS.output.hex : NN_COLORS.error.hex) : "rgba(255,255,255,0.25)" }}>
                                {char === " " ? "␣" : char}
                            </span>
                            <div className="flex-1 h-3 rounded-full bg-white/[0.03] overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{
                                        background: i === 0
                                            ? (isCorrect ? NN_COLORS.output.hex : NN_COLORS.error.hex) + "80"
                                            : "rgba(255,255,255,0.08)",
                                    }}
                                    animate={{ width: `${prob * 100}%` }}
                                    transition={spring}
                                />
                            </div>
                            <span className="text-[9px] font-mono text-white/25 w-8 text-right">{(prob * 100).toFixed(0)}%</span>
                        </div>
                    ))}
                    <p className="text-[9px] font-mono mt-2"
                        style={{ color: isCorrect ? NN_COLORS.output.hex : NN_COLORS.error.hex }}>
                        {t("neuralNetworkNarrative.contextLimit.trueAnswer")}: &quot;{trueChar === " " ? "␣" : trueChar}&quot;
                        {isCorrect ? " ✓" : " ✗"}
                    </p>
                </motion.div>
            </AnimatePresence>

            {/* Insight */}
            <div className="rounded-lg bg-indigo-500/[0.04] border border-indigo-500/15 px-3 py-2">
                <p className="text-[10px] text-white/35">
                    {contextSize === 1
                        ? t("neuralNetworkNarrative.contextLimit.insight1")
                        : contextSize === 2
                            ? t("neuralNetworkNarrative.contextLimit.insight2")
                            : t("neuralNetworkNarrative.contextLimit.insight3")}
                </p>
            </div>
        </div>
    );
}
