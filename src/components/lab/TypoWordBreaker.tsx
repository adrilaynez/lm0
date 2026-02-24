"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, XCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { useI18n } from "@/i18n/context";

/* ─────────────────────────────────────────────
   V3 — Typo / Novel Word Breaker

   Interactive input where users type a misspelled or novel
   word and see the N-gram model's confidence collapse.
   Demonstrates the "no generalization" problem viscerally.
   ───────────────────────────────────────────── */

// Simulated "known" contexts the N-gram model has seen
const KNOWN_CONTEXTS = new Set([
    "the", "the ", "th", "he ", "he", "in", "in ", "an", "an ",
    "to", "to ", "on", "on ", "is", "is ", "it", "it ", "at", "at ",
    "of", "of ", "or", "or ", "er", "er ", "en", "en ", "ed", "ed ",
    "re", "re ", "ing", "ing ", "tion", "tion ", "and", "and ",
    "for", "for ", "was", "was ", "tha", "hat", "hat ",
    "this", "with", "have", "from", "they", "been", "said",
    "each", "whic", "hich", "ther", "heir", "will", "othe",
    "ther", "abou", "bout", "many", "then", "them", "some",
    "woul", "ould", "make", "like", "time", "very", "when",
    "come", "coul", "more", "also", "after", "know", "year",
]);

function simulateConfidence(input: string): {
    confidence: number;
    isKnown: boolean;
    matchedContext: string | null;
} {
    const lower = input.toLowerCase().trim();
    if (lower.length === 0) return { confidence: 0, isKnown: false, matchedContext: null };

    // Check all substrings of length 2-5 from the end
    for (let len = Math.min(5, lower.length); len >= 2; len--) {
        const ctx = lower.slice(-len);
        if (KNOWN_CONTEXTS.has(ctx)) {
            // Known context: high confidence scaled by match length
            const base = 0.5 + (len / 5) * 0.4;
            return { confidence: base, isKnown: true, matchedContext: ctx };
        }
    }

    // Unknown: near-zero confidence (uniform random over vocab)
    return { confidence: 1 / 96, isKnown: false, matchedContext: null };
}

const EXAMPLES = [
    { correct: "the cat", typo: "teh cat", label: "Swap two letters" },
    { correct: "because", typo: "becuase", label: "Common misspelling" },
    { correct: "the blockchain", typo: "the blockchain", label: "Novel word" },
    { correct: "with the", typo: "wth the", label: "Missing vowel" },
];

export function TypoWordBreaker() {
    const { t } = useI18n();
    const [input, setInput] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState<ReturnType<typeof simulateConfidence> | null>(null);

    const handleSubmit = useCallback(() => {
        if (input.trim().length < 2) return;
        setSubmitted(true);
        setResult(simulateConfidence(input));
    }, [input]);

    const handleExample = useCallback((text: string) => {
        setInput(text);
        setSubmitted(true);
        setResult(simulateConfidence(text));
    }, []);

    const handleReset = useCallback(() => {
        setInput("");
        setSubmitted(false);
        setResult(null);
    }, []);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-500/15">
                    <Keyboard className="w-5 h-5 text-red-300" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">
                        {t("ngram.widgets.typoBreaker.title")}
                    </h4>
                    <p className="text-[10px] text-white/40">
                        {t("ngram.widgets.typoBreaker.subtitle")}
                    </p>
                </div>
            </div>

            {/* Input area */}
            <div className="space-y-3">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            setSubmitted(false);
                            setResult(null);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        placeholder={t("ngram.widgets.typoBreaker.placeholder")}
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm font-mono text-white/80 placeholder:text-white/20 focus:outline-none focus:border-red-500/40 transition-colors"
                    />
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={submitted ? handleReset : handleSubmit}
                        disabled={!submitted && input.trim().length < 2}
                        className="px-4 py-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 text-red-300 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-30"
                    >
                        {submitted ? t("ngram.widgets.typoBreaker.reset") : t("ngram.widgets.typoBreaker.test")}
                    </motion.button>
                </div>

                {/* Quick examples */}
                <div className="flex flex-wrap gap-2">
                    <span className="text-[9px] uppercase tracking-[0.15em] text-white/25 font-bold self-center mr-1">
                        {t("ngram.widgets.typoBreaker.tryLabel")}
                    </span>
                    {EXAMPLES.map((ex) => (
                        <button
                            key={ex.typo}
                            onClick={() => handleExample(ex.typo)}
                            className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-[10px] font-mono text-white/40 hover:text-white/60 hover:border-white/10 transition-colors"
                        >
                            {ex.typo}
                        </button>
                    ))}
                </div>
            </div>

            {/* Result */}
            <AnimatePresence mode="wait">
                {submitted && result && (
                    <motion.div
                        key={input}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                    >
                        {/* Context analysis */}
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-bold">
                                    {t("ngram.widgets.typoBreaker.contextLookup")}
                                </span>
                                <ArrowRight className="w-3 h-3 text-white/15" />
                                <span className="font-mono text-sm text-white/60">
                                    &ldquo;{input}&rdquo;
                                </span>
                            </div>

                            {/* What the model sees */}
                            <div className="font-mono text-lg flex items-center gap-1 mb-4">
                                {input.split("").map((ch, i) => {
                                    const tail = input.slice(Math.max(0, i - 1), i + 1);
                                    const isPartOfKnown = KNOWN_CONTEXTS.has(tail) || KNOWN_CONTEXTS.has(input.slice(i));
                                    return (
                                        <motion.span
                                            key={i}
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            className={`px-0.5 rounded ${result.isKnown && result.matchedContext?.includes(ch)
                                                    ? "text-amber-300 bg-amber-500/10"
                                                    : "text-red-300/60"
                                                }`}
                                        >
                                            {ch === " " ? "·" : ch}
                                        </motion.span>
                                    );
                                })}
                            </div>

                            {/* Confidence bar */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-bold">
                                        {t("ngram.widgets.typoBreaker.modelConfidence")}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {result.isKnown ? (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                        ) : (
                                            <XCircle className="w-3.5 h-3.5 text-red-400" />
                                        )}
                                        <span
                                            className={`text-sm font-mono font-bold ${result.isKnown ? "text-emerald-400" : "text-red-400"
                                                }`}
                                        >
                                            {(result.confidence * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="h-3 rounded-full bg-white/[0.05] overflow-hidden relative">
                                    {/* Random baseline marker */}
                                    <div
                                        className="absolute top-0 bottom-0 w-px bg-white/20 z-10"
                                        style={{ left: `${(1 / 96) * 100}%` }}
                                    />
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${result.confidence * 100}%` }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                        className={`h-full rounded-full ${result.isKnown
                                                ? "bg-gradient-to-r from-emerald-600/80 to-emerald-400/80"
                                                : "bg-gradient-to-r from-red-600/80 to-red-400/80"
                                            }`}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-[9px] font-mono text-white/20">
                                    <span>0%</span>
                                    <span>{t("ngram.widgets.typoBreaker.randomMarker", { vocab: 96 })}</span>
                                    <span>100%</span>
                                </div>
                            </div>
                        </div>

                        {/* Verdict */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className={`rounded-xl border p-4 ${result.isKnown
                                    ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                                    : "border-red-500/20 bg-red-500/[0.04]"
                                }`}
                        >
                            {result.isKnown ? (
                                <p className="text-xs text-emerald-300/70 leading-relaxed">
                                    {t("ngram.widgets.typoBreaker.verdictKnownPrefix")}{" "}
                                    <span className="font-mono font-bold text-emerald-300">
                                        &ldquo;{result.matchedContext}&rdquo;
                                    </span>{" "}
                                    {t("ngram.widgets.typoBreaker.verdictKnownSuffix")}
                                </p>
                            ) : (
                                <p className="text-xs text-red-300/70 leading-relaxed">
                                    <strong className="text-red-300">{t("ngram.widgets.typoBreaker.verdictUnknownStrong")}</strong>{" "}
                                    {t("ngram.widgets.typoBreaker.verdictUnknownBody", { vocab: 96 })}
                                </p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
