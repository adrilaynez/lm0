"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

import { useI18n } from "@/i18n/context";

/* ─── Word groups that are semantically related but treated identically by N-grams ─── */
const WORD_GROUPS = [
    { seed: "the ___ sat on the mat", words: ["cat", "dog", "rat"], color: "amber" },
    { seed: "I feel very ___", words: ["happy", "glad", "joyful"], color: "emerald" },
    { seed: "she ___ to the store", words: ["walked", "ran", "drove"], color: "rose" },
] as const;

type ColorKey = "amber" | "emerald" | "rose";

const COLOR_MAP: Record<ColorKey, { pill: string; active: string; line: string }> = {
    amber: { pill: "bg-amber-500/15 text-amber-300 border-amber-500/30", active: "bg-amber-500/20 border-amber-500/40", line: "bg-amber-500/30" },
    emerald: { pill: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", active: "bg-emerald-500/20 border-emerald-500/40", line: "bg-emerald-500/30" },
    rose: { pill: "bg-rose-500/15 text-rose-300 border-rose-500/30", active: "bg-rose-500/20 border-rose-500/40", line: "bg-rose-500/30" },
};

export function SimilarityBlindSpot() {
    const { t } = useI18n();
    const [showEmbedding, setShowEmbedding] = useState(false);
    const [activeGroup, setActiveGroup] = useState(0);

    const group = WORD_GROUPS[activeGroup];
    const colors = COLOR_MAP[group.color];

    return (
        <div className="space-y-5">
            {/* Group selector */}
            <div className="flex gap-2 justify-center">
                {WORD_GROUPS.map((g, i) => (
                    <button
                        key={i}
                        onClick={() => { setActiveGroup(i); setShowEmbedding(false); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                            activeGroup === i
                                ? COLOR_MAP[g.color].active + " " + COLOR_MAP[g.color].pill.split(" ").slice(1).join(" ")
                                : "border-white/[0.08] bg-white/[0.02] text-white/30 hover:text-white/50"
                        }`}
                    >
                        {g.words[0]}…
                    </button>
                ))}
            </div>

            {/* Sentence template */}
            <div className="text-center">
                <p className="text-sm text-white/40 font-mono">
                    {group.seed.split("___").map((part, i, arr) => (
                        <span key={i}>
                            {part}
                            {i < arr.length - 1 && (
                                <span className={`inline-block px-2 py-0.5 mx-1 rounded border ${colors.pill} font-bold`}>
                                    ?
                                </span>
                            )}
                        </span>
                    ))}
                </p>
            </div>

            {/* Words visualization */}
            <div className="relative">
                {/* N-gram view (default) */}
                <AnimatePresence mode="wait">
                    {!showEmbedding ? (
                        <motion.div
                            key="ngram"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            <p className="text-center text-[10px] font-mono uppercase tracking-widest text-white/20">
                                {t("ngramNarrative.similarityBlindSpot.ngramView")}
                            </p>
                            <div className="flex justify-center gap-6">
                                {group.words.map((word, i) => (
                                    <motion.div
                                        key={word}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex flex-col items-center gap-2"
                                    >
                                        <div className="w-20 h-20 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center">
                                            <span className="font-mono text-sm font-bold text-white/60">{word}</span>
                                        </div>
                                        <span className="text-[9px] font-mono text-white/15">
                                            id={i * 37 + 12}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                            {/* No connections */}
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <EyeOff className="w-3.5 h-3.5 text-white/15" />
                                <span className="text-xs text-white/20 italic">
                                    {t("ngramNarrative.similarityBlindSpot.noConnection")}
                                </span>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="embedding"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            <p className="text-center text-[10px] font-mono uppercase tracking-widest text-white/20">
                                {t("ngramNarrative.similarityBlindSpot.embeddingView")}
                            </p>
                            <div className="flex justify-center gap-3">
                                {group.words.map((word, i) => (
                                    <motion.div
                                        key={word}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{
                                            opacity: 1,
                                            scale: 1,
                                            x: (i - 1) * -8,
                                        }}
                                        transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                                        className="flex flex-col items-center gap-2"
                                    >
                                        <div className={`w-20 h-20 rounded-xl border flex items-center justify-center ${colors.active} ${colors.pill.split(" ").slice(1).join(" ")}`}>
                                            <span className="font-mono text-sm font-bold">{word}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            {/* Connection lines */}
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <Eye className="w-3.5 h-3.5 text-emerald-400/40" />
                                <span className="text-xs text-emerald-400/40 italic">
                                    {t("ngramNarrative.similarityBlindSpot.connected")}
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Toggle button */}
            <div className="flex justify-center">
                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowEmbedding(!showEmbedding)}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        showEmbedding
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-white/[0.1] bg-white/[0.03] text-white/40 hover:text-white/60"
                    }`}
                >
                    {showEmbedding ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {showEmbedding
                        ? t("ngramNarrative.similarityBlindSpot.hideEmbedding")
                        : t("ngramNarrative.similarityBlindSpot.showEmbedding")}
                </motion.button>
            </div>
        </div>
    );
}
