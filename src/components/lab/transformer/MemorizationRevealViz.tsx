"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  MemorizationRevealViz — VIZ 12

  Shows that the 12-block model quotes verbatim from training data.
  Side-by-side comparison reveals memorization vs learning.

  Toggle: "4 Blocks" (low similarity, different phrasing)
       vs "12 Blocks" (near-verbatim, high similarity)

  Matching words highlighted in rose. Similarity bar below.
  The teaching moment: memorizing ≠ understanding.
*/

type ModelKey = "4b" | "12b";

interface Sample {
    trainingText: string;
    modelOutput: string;
    matchRanges: [number, number][]; /* char ranges in modelOutput that match training */
    similarity: number;
}

/* Real-ish training data fragments and model outputs */
const SAMPLES: Record<ModelKey, Sample> = {
    "4b": {
        trainingText:
            "Thanks to Trevor Blackwell, Jessica Livingston, Robert Morris, and Fred Wilson for reading drafts of this. The way to get startup ideas is not to try to think of startup ideas. It's to look for problems, preferably problems you have yourself.",
        modelOutput:
            "The best approach to finding new ventures is to examine the difficulties you encounter daily. Rather than brainstorming concepts abstractly, ground your search in genuine frustration. Look for the gap between how things work and how they should.",
        matchRanges: [[145, 149], [183, 187]], /* "look" / "how" — tiny matches */
        similarity: 0.12,
    },
    "12b": {
        trainingText:
            "Thanks to Trevor Blackwell, Jessica Livingston, Robert Morris, and Fred Wilson for reading drafts of this. The way to get startup ideas is not to try to think of startup ideas. It's to look for problems, preferably problems you have yourself.",
        modelOutput:
            "Thanks to Trevor Blackwell, Jessica Livingston, Robert Morris, and Fred Wilson for reading drafts of this. The way to get startup ideas is not to try to think of startup ideas. It's to look for problems, preferably problems you have yourself.",
        matchRanges: [[0, 249]], /* entire output matches */
        similarity: 0.94,
    },
};

const MODEL_INFO: Record<ModelKey, { label: string; color: string; rgb: string; icon: string; verdict: string }> = {
    "4b": {
        label: "4 Blocks",
        color: "#22d3ee",
        rgb: "34,211,238",
        icon: "\u2713",
        verdict: "Different words, same idea. The model learned the concept.",
    },
    "12b": {
        label: "12 Blocks",
        color: "#f43f5e",
        rgb: "244,63,94",
        icon: "\u26A0",
        verdict: "Near-verbatim copy. The model memorized the training data.",
    },
};

/* Find common substrings between two texts (simplified word-level matching) */
function findMatchingWords(training: string, output: string): Set<number> {
    const tWords = new Set(training.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const oWords = output.split(/\s+/);
    const matchIndices = new Set<number>();

    let charIdx = 0;
    for (let i = 0; i < oWords.length; i++) {
        const word = oWords[i];
        if (tWords.has(word.toLowerCase().replace(/[.,;:!?'"]/g, "")) && word.length > 3) {
            for (let c = charIdx; c < charIdx + word.length; c++) {
                matchIndices.add(c);
            }
        }
        charIdx += word.length + 1; /* +1 for space */
    }
    return matchIndices;
}

/* Render text with highlighted matching characters */
function HighlightedText({ text, matchIndices, color, delay }: {
    text: string;
    matchIndices: Set<number>;
    color: string;
    delay: number;
}) {
    /* Group consecutive chars into spans */
    const segments: { text: string; matched: boolean }[] = [];
    let current = "";
    let currentMatch = false;

    for (let i = 0; i < text.length; i++) {
        const isMatch = matchIndices.has(i);
        if (i === 0) {
            currentMatch = isMatch;
            current = text[i];
        } else if (isMatch === currentMatch) {
            current += text[i];
        } else {
            segments.push({ text: current, matched: currentMatch });
            current = text[i];
            currentMatch = isMatch;
        }
    }
    if (current) segments.push({ text: current, matched: currentMatch });

    return (
        <motion.p
            className="text-[12px] sm:text-[13px] font-mono leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay }}
        >
            {segments.map((seg, i) => (
                <span key={i}
                    style={{
                        color: seg.matched ? color : "rgba(255,255,255,0.45)",
                        background: seg.matched ? `${color}15` : "transparent",
                        borderRadius: seg.matched ? 2 : 0,
                        padding: seg.matched ? "1px 0" : 0,
                        fontWeight: seg.matched ? 600 : 400,
                    }}>
                    {seg.text}
                </span>
            ))}
        </motion.p>
    );
}

export function MemorizationRevealViz() {
    const [model, setModel] = useState<ModelKey>("12b");

    const sample = SAMPLES[model];
    const info = MODEL_INFO[model];

    /* Compute match indices for both panels */
    const trainingMatches = useMemo(() =>
        findMatchingWords(sample.modelOutput, sample.trainingText),
        [sample],
    );
    const outputMatches = useMemo(() =>
        findMatchingWords(sample.trainingText, sample.modelOutput),
        [sample],
    );

    /* For 12b, highlight everything since it's near-verbatim */
    const effectiveOutputMatches = useMemo(() => {
        if (model === "12b") {
            const all = new Set<number>();
            for (let i = 0; i < sample.modelOutput.length; i++) all.add(i);
            return all;
        }
        return outputMatches;
    }, [model, sample, outputMatches]);

    const effectiveTrainingMatches = useMemo(() => {
        if (model === "12b") {
            const all = new Set<number>();
            for (let i = 0; i < sample.trainingText.length; i++) all.add(i);
            return all;
        }
        return trainingMatches;
    }, [model, sample, trainingMatches]);

    const simPct = (sample.similarity * 100).toFixed(0);
    const simColor = sample.similarity > 0.5 ? "#f43f5e" : "#34d399";
    const simRgb = sample.similarity > 0.5 ? "244,63,94" : "52,211,153";

    return (
        <div className="flex flex-col items-center gap-5 w-full py-5 px-2">
            {/* ── Model toggle ── */}
            <div className="flex items-center gap-2">
                {(["4b", "12b"] as const).map(k => {
                    const mi = MODEL_INFO[k];
                    const on = model === k;
                    return (
                        <button key={k}
                            onClick={() => setModel(k)}
                            className="px-4 py-1.5 rounded-xl text-[12px] font-semibold cursor-pointer transition-all"
                            style={{
                                background: on ? `rgba(${mi.rgb},0.12)` : "rgba(255,255,255,0.02)",
                                color: on ? mi.color : "rgba(255,255,255,0.25)",
                                border: `1.5px solid ${on ? `rgba(${mi.rgb},0.35)` : "rgba(255,255,255,0.05)"}`,
                            }}>
                            {mi.label}
                        </button>
                    );
                })}
            </div>

            {/* ── Two panels ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-[620px]">
                {/* LEFT: Training Data */}
                <div className="rounded-xl overflow-hidden"
                    style={{
                        background: "rgba(255,255,255,0.015)",
                        border: "1.5px solid rgba(251,191,36,0.15)",
                    }}>
                    <div className="px-3 py-2 flex items-center gap-2"
                        style={{ borderBottom: "1px solid rgba(251,191,36,0.08)" }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: "#fbbf24", opacity: 0.6 }} />
                        <span className="text-[11px] font-bold text-amber-400/60">Training Data</span>
                        <span className="text-[9px] text-white/15 ml-auto font-mono">Paul Graham essay</span>
                    </div>
                    <div className="px-3 py-3 min-h-[120px]">
                        <AnimatePresence mode="wait">
                            <HighlightedText
                                key={model}
                                text={sample.trainingText}
                                matchIndices={effectiveTrainingMatches}
                                color={model === "12b" ? "#f43f5e" : "#fbbf24"}
                                delay={0}
                            />
                        </AnimatePresence>
                    </div>
                </div>

                {/* RIGHT: Model Output */}
                <div className="rounded-xl overflow-hidden"
                    style={{
                        background: "rgba(255,255,255,0.015)",
                        border: `1.5px solid rgba(${info.rgb},0.2)`,
                    }}>
                    <div className="px-3 py-2 flex items-center gap-2"
                        style={{ borderBottom: `1px solid rgba(${info.rgb},0.08)` }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: info.color, opacity: 0.6 }} />
                        <span className="text-[11px] font-bold" style={{ color: `rgba(${info.rgb},0.7)` }}>
                            {info.label} Output
                        </span>
                        <span className="text-[9px] text-white/15 ml-auto font-mono">
                            prompt: {"\u201C"}Thanks to...{"\u201D"}
                        </span>
                    </div>
                    <div className="px-3 py-3 min-h-[120px]">
                        <AnimatePresence mode="wait">
                            <HighlightedText
                                key={model}
                                text={sample.modelOutput}
                                matchIndices={effectiveOutputMatches}
                                color={info.color}
                                delay={0.15}
                            />
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* ── Similarity bar ── */}
            <AnimatePresence mode="wait">
                <motion.div key={model}
                    className="w-full max-w-[620px]"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.25 }}
                >
                    <div className="flex items-center justify-between mb-1.5 px-1">
                        <span className="text-[11px] text-white/25 font-semibold">
                            Match with training data
                        </span>
                        <motion.span
                            className="text-[14px] font-bold font-mono tabular-nums"
                            style={{ color: simColor }}
                            key={model}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                        >
                            {simPct}%
                        </motion.span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.03)" }}>
                        <motion.div
                            className="h-full rounded-full"
                            style={{
                                background: `linear-gradient(90deg, rgba(52,211,153,0.6), rgba(${simRgb},0.7))`,
                                boxShadow: sample.similarity > 0.5
                                    ? `0 0 12px rgba(${simRgb},0.3)`
                                    : "none",
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${sample.similarity * 100}%` }}
                            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                        />
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* ── Verdict ── */}
            <AnimatePresence mode="wait">
                <motion.div key={model}
                    className="flex items-start gap-2 px-4 py-2.5 rounded-xl max-w-[500px]"
                    style={{
                        background: `rgba(${info.rgb},0.04)`,
                        border: `1px solid rgba(${info.rgb},0.12)`,
                    }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <span className="text-[14px] mt-0.5">{info.icon}</span>
                    <p className="text-[12px] leading-relaxed" style={{ color: `rgba(${info.rgb},0.65)` }}>
                        {info.verdict}
                    </p>
                </motion.div>
            </AnimatePresence>

            {/* ── Caption ── */}
            <p className="text-[11px] text-center text-white/15 max-w-sm leading-relaxed">
                More capacity without enough data leads to memorization.
                The model didn{"\u2019"}t learn to write {"\u2014"} it learned to copy.
            </p>
        </div>
    );
}
