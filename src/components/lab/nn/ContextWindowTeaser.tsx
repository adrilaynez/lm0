"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  ContextWindowTeaser
  Shows a sentence where you can toggle context window size (1, 3, 5, 10).
  Highlights what the network "sees" for each prediction, making the
  limitation of 1-char context visceral and the potential of more context
  exciting. Perfect for the NN §09 "How Far Can We Push This?" section.
*/

const SAMPLE_TEXT = "the king was in the courtyard";
const PREDICT_POS = 8; // predicting 'w' after "the king "

const CONTEXT_OPTIONS = [
    { size: 1, label: "Your NN", desc: "sees 1 letter", color: "#f43f5e" },
    { size: 3, label: "3 chars", desc: "sees a word", color: "#f59e0b" },
    { size: 8, label: "8 chars", desc: "sees context", color: "#a78bfa" },
    { size: 15, label: "15 chars", desc: "sees the story", color: "#34d399" },
];

export function ContextWindowTeaser() {
    const [ctxIdx, setCtxIdx] = useState(0);
    const ctx = CONTEXT_OPTIONS[ctxIdx];
    const chars = SAMPLE_TEXT.split("");

    const contextStart = Math.max(0, PREDICT_POS - ctx.size);
    const contextEnd = PREDICT_POS;
    const predictChar = chars[PREDICT_POS] ?? "?";

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Context size selector */}
            <div className="flex flex-wrap gap-1.5">
                {CONTEXT_OPTIONS.map((opt, i) => (
                    <button
                        key={i}
                        onClick={() => setCtxIdx(i)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider transition-all border ${
                            ctxIdx === i
                                ? "border-opacity-40"
                                : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/60"
                        }`}
                        style={ctxIdx === i ? {
                            backgroundColor: opt.color + "15",
                            borderColor: opt.color + "40",
                            color: opt.color,
                        } : {}}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Text display with context highlighting */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 overflow-x-auto">
                <div className="flex flex-wrap gap-0 font-mono text-lg leading-relaxed">
                    {chars.map((ch, i) => {
                        const isContext = i >= contextStart && i < contextEnd;
                        const isPredict = i === PREDICT_POS;
                        const isPast = i < contextStart;
                        const isFuture = i > PREDICT_POS;

                        return (
                            <motion.span
                                key={i}
                                animate={{
                                    opacity: isContext ? 1 : isPredict ? 1 : 0.15,
                                    scale: isPredict ? 1.1 : 1,
                                }}
                                transition={{ duration: 0.3 }}
                                className="relative inline-block"
                                style={{
                                    color: isPredict ? ctx.color : isContext ? "white" : "rgba(255,255,255,0.3)",
                                }}
                            >
                                {/* Context background */}
                                {isContext && (
                                    <motion.span
                                        layoutId="ctx-bg"
                                        className="absolute inset-0 rounded-sm -z-10"
                                        style={{ backgroundColor: ctx.color + "15" }}
                                    />
                                )}
                                {/* Predict marker */}
                                {isPredict && (
                                    <motion.span
                                        className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
                                        style={{ backgroundColor: ctx.color }}
                                        animate={{ opacity: [0.4, 1, 0.4] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    />
                                )}
                                {ch === " " ? "\u00A0" : ch}
                            </motion.span>
                        );
                    })}
                </div>
            </div>

            {/* Insight */}
            <motion.div
                key={ctxIdx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border p-3"
                style={{
                    borderColor: ctx.color + "20",
                    backgroundColor: ctx.color + "06",
                }}
            >
                <p className="text-[11px] font-mono leading-relaxed" style={{ color: ctx.color + "cc" }}>
                    {ctxIdx === 0 && (
                        <>The network sees only &quot;<span className="font-bold">{SAMPLE_TEXT[PREDICT_POS - 1]}</span>&quot; and must guess &quot;<span className="font-bold">{predictChar}</span>&quot;. After a space, any letter is possible. It&apos;s flying blind.</>
                    )}
                    {ctxIdx === 1 && (
                        <>Now it sees &quot;<span className="font-bold">{SAMPLE_TEXT.slice(contextStart, contextEnd)}</span>&quot;. &quot;ng &quot; hints at common words — but 3 letters is still ambiguous. Many words could follow.</>
                    )}
                    {ctxIdx === 2 && (
                        <>It sees &quot;<span className="font-bold">{SAMPLE_TEXT.slice(contextStart, contextEnd)}</span>&quot;. Now it knows &quot;king&quot; and the space — the vocabulary of likely next words shrinks dramatically.</>
                    )}
                    {ctxIdx === 3 && (
                        <>It sees &quot;<span className="font-bold">{SAMPLE_TEXT.slice(contextStart, contextEnd)}</span>&quot;. With the full phrase, it can predict with high confidence. This is the power of context — and where we&apos;re heading next.</>
                    )}
                </p>
            </motion.div>
        </div>
    );
}
