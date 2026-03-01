"use client";

import { memo, useState } from "react";

import { motion } from "framer-motion";

import { FadeInView } from "@/components/lab/FadeInView";
import { useI18n } from "@/i18n/context";

/* ─── Static data ─── */
const PREFIXES = ["th", "sh", "wh"] as const;

/** Simulated distributions — identical for all because bigram sees only "h" */
const PREDICTIONS = [
    { char: "e", pct: 32 },
    { char: "a", pct: 15 },
    { char: "i", pct: 11 },
    { char: "o", pct: 9 },
    { char: "·", pct: 8 },
    { char: "r", pct: 5 },
];

/**
 * ContextBlindnessDemo — makes the bigram's fatal flaw visceral.
 *
 * Shows "th", "sh", "wh" side by side. All three produce identical
 * predictions because the model only sees the last letter "h".
 * An animated reveal makes the insight click.
 */
export const ContextBlindnessDemo = memo(function ContextBlindnessDemo() {
    const { t } = useI18n();
    const [revealed, setRevealed] = useState(false);

    return (
        <div className="space-y-6">
            {/* ── Prompt ── */}
            <p className="text-center text-sm text-white/40 font-mono">
                {t("bigramNarrative.contextBlindness.prompt")}
            </p>

            {/* ── Three columns ── */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {PREFIXES.map((prefix, colIdx) => (
                    <FadeInView
                        key={prefix}
                        delay={colIdx * 0.12}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
                    >
                        {/* Header: the prefix */}
                        <div className="px-3 py-3 text-center border-b border-white/[0.04]">
                            <span className="text-2xl sm:text-3xl font-mono font-bold">
                                <span className="text-white/25">
                                    {prefix[0]}
                                </span>
                                <span className="text-emerald-400">
                                    {prefix[1]}
                                </span>
                            </span>
                        </div>

                        {/* Prediction bars */}
                        <div className="px-3 py-3 space-y-1.5">
                            {PREDICTIONS.map(({ char, pct }) => (
                                <div
                                    key={char}
                                    className="flex items-center gap-2"
                                >
                                    <span className="w-4 text-[10px] font-mono text-white/40 text-right shrink-0">
                                        {char}
                                    </span>
                                    <div className="flex-1 h-3 rounded-full bg-white/[0.04] overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{
                                                width: `${pct}%`,
                                            }}
                                            viewport={{ once: true }}
                                            transition={{
                                                delay: 0.3 + colIdx * 0.1,
                                                duration: 0.5,
                                            }}
                                            className="h-full rounded-full bg-emerald-500/50"
                                        />
                                    </div>
                                    <span className="w-7 text-[10px] font-mono text-white/25 text-right shrink-0">
                                        {pct}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </FadeInView>
                ))}
            </div>

            {/* ── Equals sign / Reveal ── */}
            <FadeInView delay={0.6} className="text-center">
                {!revealed ? (
                    <button
                        onClick={() => setRevealed(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] text-rose-400 text-sm font-mono font-semibold hover:bg-rose-500/10 transition-colors"
                    >
                        {t("bigramNarrative.contextBlindness.revealButton")}
                    </button>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                    >
                        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.04]">
                            <span className="text-2xl font-mono font-bold text-rose-400">
                                =
                            </span>
                            <span className="text-sm text-white/60">
                                {t(
                                    "bigramNarrative.contextBlindness.identical"
                                )}
                            </span>
                            <span className="text-2xl font-mono font-bold text-rose-400">
                                =
                            </span>
                        </div>
                        <p className="text-xs text-white/30 max-w-sm mx-auto leading-relaxed">
                            {t(
                                "bigramNarrative.contextBlindness.explanation"
                            )}
                        </p>
                    </motion.div>
                )}
            </FadeInView>
        </div>
    );
});
