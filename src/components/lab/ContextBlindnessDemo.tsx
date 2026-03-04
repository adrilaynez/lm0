"use client";

import { memo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

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
 * ContextBlindnessDemo — unified 3-phase experience for the bigram's fatal flaw.
 *
 * Phase 1: Pick a prefix → see what the model actually sees (only the last char)
 *          and its predictions. Encourages trying all three.
 * Phase 2: Reveal all three side-by-side → identical bars make the insight click.
 * Phase 3: Red callout explains why — one-letter amnesia.
 */
export const ContextBlindnessDemo = memo(function ContextBlindnessDemo() {
    const { t } = useI18n();
    const [selected, setSelected] = useState(0);
    const [tried, setTried] = useState<Set<number>>(() => new Set([0]));
    const [phase, setPhase] = useState<1 | 2 | 3>(1);

    const prefix = PREFIXES[selected];
    const invisible = prefix[0];
    const visible = prefix[1];

    const handleSelect = (i: number) => {
        setSelected(i);
        setTried(prev => new Set(prev).add(i));
    };

    return (
        <div className="space-y-6 py-2">
            <AnimatePresence mode="wait">
                {/* ─────────── PHASE 1: Select & Explore ─────────── */}
                {phase === 1 && (
                    <motion.div
                        key="phase1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-5"
                    >
                        {/* Prompt */}
                        <p className="text-center text-sm text-white/40 font-mono">
                            {t("bigramNarrative.contextBlindness.pickPrompt")}
                        </p>

                        {/* Prefix selector */}
                        <div className="flex gap-3 justify-center">
                            {PREFIXES.map((p, i) => (
                                <button
                                    key={p}
                                    onClick={() => handleSelect(i)}
                                    className={[
                                        "px-5 py-2.5 rounded-xl font-mono text-lg font-bold border transition-all",
                                        selected === i
                                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-[0_0_16px_-4px_rgba(16,185,129,0.3)]"
                                            : tried.has(i)
                                                ? "bg-white/[0.03] border-emerald-500/15 text-emerald-300/40 hover:text-emerald-300/70 hover:border-emerald-500/25"
                                                : "bg-white/[0.03] border-white/[0.08] text-white/35 hover:text-white/55 hover:border-white/[0.15]",
                                    ].join(" ")}
                                >
                                    {p}_
                                </button>
                            ))}
                        </div>

                        {/* What the model sees */}
                        <div className="flex items-center justify-center gap-4">
                            <div className="flex items-center gap-1">
                                <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-500/[0.06] border border-red-500/20">
                                    <EyeOff className="w-3.5 h-3.5 text-red-400/50" />
                                    <span className="font-mono text-lg font-bold text-red-400/40 line-through">{invisible}</span>
                                </div>
                                <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/25">
                                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="font-mono text-lg font-bold text-emerald-300">{visible}</span>
                                </div>
                            </div>
                            <span className="text-white/20 text-sm">→</span>
                            <span className="font-mono text-lg text-white/30">?</span>
                        </div>

                        <p className="text-center text-[11px] font-mono text-white/25">
                            {t("bigramNarrative.contextBlindness.modelSees")} <span className="text-emerald-300 font-semibold">&quot;{visible}&quot;</span> — <span className="text-red-400/50">&quot;{invisible}&quot;</span> {t("bigramNarrative.contextBlindness.invisible")}
                        </p>

                        {/* Prediction bars */}
                        <div className="space-y-2 px-2">
                            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/20 mb-3">
                                {t("bigramNarrative.contextBlindness.topPredictions")}
                            </p>
                            {PREDICTIONS.map(({ char, pct }, i) => (
                                <div key={char} className="flex items-center gap-3">
                                    <span className="w-5 text-center font-mono text-sm font-semibold text-white/60">{char}</span>
                                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                                        <motion.div
                                            key={`${selected}-${char}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ delay: i * 0.06, duration: 0.4, ease: "easeOut" }}
                                            className="h-full rounded-full bg-emerald-400/70"
                                        />
                                    </div>
                                    <span className="w-10 text-right font-mono text-[11px] text-white/35">{pct}%</span>
                                </div>
                            ))}
                        </div>

                        {/* Nudge / Advance to phase 2 */}
                        <div className="text-center pt-2">
                            {tried.size < 3 ? (
                                <p className="text-xs text-emerald-400/40 font-mono">
                                    {t("bigramNarrative.contextBlindness.tryOthers")}
                                </p>
                            ) : (
                                <button
                                    onClick={() => setPhase(2)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] text-rose-400 text-sm font-mono font-semibold hover:bg-rose-500/10 transition-colors"
                                >
                                    {t("bigramNarrative.contextBlindness.revealButton")}
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ─────────── PHASE 2: Side-by-side reveal ─────────── */}
                {phase === 2 && (
                    <motion.div
                        key="phase2"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-6"
                    >
                        <p className="text-center text-sm text-white/40 font-mono">
                            {t("bigramNarrative.contextBlindness.prompt")}
                        </p>

                        {/* Three columns */}
                        <div className="grid grid-cols-3 gap-3 sm:gap-4">
                            {PREFIXES.map((pfx, colIdx) => (
                                <FadeInView
                                    key={pfx}
                                    delay={colIdx * 0.12}
                                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
                                >
                                    <div className="px-3 py-3 text-center border-b border-white/[0.04]">
                                        <span className="text-2xl sm:text-3xl font-mono font-bold">
                                            <span className="text-white/25">{pfx[0]}</span>
                                            <span className="text-emerald-400">{pfx[1]}</span>
                                        </span>
                                    </div>
                                    <div className="px-3 py-3 space-y-1.5">
                                        {PREDICTIONS.map(({ char, pct }) => (
                                            <div key={char} className="flex items-center gap-2">
                                                <span className="w-4 text-[10px] font-mono text-white/40 text-right shrink-0">{char}</span>
                                                <div className="flex-1 h-3 rounded-full bg-white/[0.04] overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: `${pct}%` }}
                                                        viewport={{ once: true }}
                                                        transition={{ delay: 0.3 + colIdx * 0.1, duration: 0.5 }}
                                                        className="h-full rounded-full bg-emerald-500/50"
                                                    />
                                                </div>
                                                <span className="w-7 text-[10px] font-mono text-white/25 text-right shrink-0">{pct}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </FadeInView>
                            ))}
                        </div>

                        {/* Equals badge */}
                        <FadeInView delay={0.5} className="text-center">
                            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.04]">
                                <span className="text-2xl font-mono font-bold text-rose-400">=</span>
                                <span className="text-sm text-white/60">{t("bigramNarrative.contextBlindness.identical")}</span>
                                <span className="text-2xl font-mono font-bold text-rose-400">=</span>
                            </div>
                        </FadeInView>

                        {/* Advance to phase 3 */}
                        <FadeInView delay={0.7} className="text-center">
                            <button
                                onClick={() => setPhase(3)}
                                className="text-xs font-semibold text-rose-400/60 hover:text-rose-400 transition-colors font-mono"
                            >
                                {t("bigramNarrative.contextBlindness.whyButton")}
                            </button>
                        </FadeInView>
                    </motion.div>
                )}

                {/* ─────────── PHASE 3: Red callout ─────────── */}
                {phase === 3 && (
                    <motion.div
                        key="phase3"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-4"
                    >
                        {/* Compact 3-column reminder */}
                        <div className="grid grid-cols-3 gap-2 opacity-50">
                            {PREFIXES.map((pfx) => (
                                <div key={pfx} className="text-center py-2 rounded-lg border border-white/[0.04] bg-white/[0.01]">
                                    <span className="font-mono text-lg font-bold">
                                        <span className="text-white/20">{pfx[0]}</span>
                                        <span className="text-emerald-400/60">{pfx[1]}</span>
                                    </span>
                                    <span className="text-white/15 text-xs ml-1">→ e (32%)</span>
                                </div>
                            ))}
                        </div>

                        {/* Red callout */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                            className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-5 text-center space-y-3"
                        >
                            <p className="text-base font-semibold text-red-300/90">
                                {t("bigramNarrative.contextBlindness.calloutTitle")}
                            </p>
                            <p className="text-sm text-white/50 leading-relaxed max-w-md mx-auto">
                                {t("bigramNarrative.contextBlindness.explanation")}
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
