"use client";

import { memo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

import { useI18n } from "@/i18n/context";

/* ─── Data ─── */
const PREFIXES = ["th", "sh", "wh"] as const;

const PREDICTIONS: { char: string; prob: number }[] = [
    { char: "e", prob: 0.31 },
    { char: "a", prob: 0.14 },
    { char: "i", prob: 0.11 },
    { char: "o", prob: 0.09 },
];

/* ─── Component ─── */
export const MemoryLimitDemo = memo(function MemoryLimitDemo() {
    const { t } = useI18n();
    const [selected, setSelected] = useState(0);
    const [revealed, setRevealed] = useState(false);

    const prefix = PREFIXES[selected];
    const invisible = prefix[0];
    const visible = prefix[1];

    return (
        <div className="space-y-5 py-2">
            {/* Prefix selector */}
            <div className="flex gap-3 justify-center">
                {PREFIXES.map((p, i) => (
                    <button
                        key={p}
                        onClick={() => { setSelected(i); setRevealed(false); }}
                        className={[
                            "px-5 py-2.5 rounded-xl font-mono text-lg font-bold border transition-all",
                            selected === i
                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-[0_0_16px_-4px_rgba(16,185,129,0.3)]"
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
                {t("bigramWidgets.memoryLimit.modelSees")} <span className="text-emerald-300 font-semibold">&quot;{visible}&quot;</span> — <span className="text-red-400/50">&quot;{invisible}&quot;</span> {t("bigramWidgets.memoryLimit.invisible")}
            </p>

            {/* Predictions — identical for all */}
            <div className="space-y-2 px-2">
                <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/20 mb-3">
                    {t("bigramWidgets.memoryLimit.topPredictions")}
                </p>
                {PREDICTIONS.map(({ char, prob }, i) => (
                    <div key={char} className="flex items-center gap-3">
                        <span className="w-5 text-center font-mono text-sm font-semibold text-white/60">{char}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                            <motion.div
                                key={`${selected}-${char}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${prob * 100}%` }}
                                transition={{ delay: i * 0.06, duration: 0.4, ease: "easeOut" }}
                                className="h-full rounded-full bg-emerald-400/70"
                            />
                        </div>
                        <span className="w-10 text-right font-mono text-[11px] text-white/35">{Math.round(prob * 100)}%</span>
                    </div>
                ))}
            </div>

            {/* Reveal button */}
            {!revealed ? (
                <div className="text-center">
                    <button
                        onClick={() => setRevealed(true)}
                        className="text-xs font-semibold text-emerald-400/60 hover:text-emerald-400 transition-colors"
                    >
                        {t("bigramWidgets.memoryLimit.tryOthers")}
                    </button>
                </div>
            ) : (
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-red-500/15 bg-red-500/[0.04] p-4 text-center space-y-2"
                    >
                        <p className="text-sm font-semibold text-red-300/80">
                            {t("bigramWidgets.memoryLimit.allIdentical")}
                        </p>
                        <p className="text-xs text-white/40 leading-relaxed max-w-sm mx-auto">
                            {t("bigramWidgets.memoryLimit.explanation")}
                        </p>
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
});
