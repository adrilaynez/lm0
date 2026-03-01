"use client";

import { memo, useCallback, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Lightbulb } from "lucide-react";

import { useI18n } from "@/i18n/context";

/* ─── Constants ─── */
const VOCAB_SIZE = 96;
const CHARS_ROW = ["t", "h", "e", " ", "a", "s", "o", "n"];
const SAMPLE_FOLLOWERS: Record<string, { char: string; count: number }[]> = {
    t: [{ char: "h", count: 412 }, { char: "e", count: 189 }, { char: "o", count: 156 }, { char: " ", count: 98 }, { char: "i", count: 87 }],
    h: [{ char: "e", count: 481 }, { char: "a", count: 167 }, { char: "i", count: 112 }, { char: "o", count: 98 }, { char: " ", count: 45 }],
    e: [{ char: " ", count: 623 }, { char: "r", count: 198 }, { char: "n", count: 167 }, { char: "s", count: 145 }, { char: "d", count: 112 }],
    " ": [{ char: "t", count: 356 }, { char: "a", count: 245 }, { char: "s", count: 189 }, { char: "i", count: 167 }, { char: "o", count: 134 }],
    a: [{ char: "n", count: 312 }, { char: "t", count: 198 }, { char: "l", count: 167 }, { char: "r", count: 145 }, { char: "s", count: 112 }],
    s: [{ char: " ", count: 389 }, { char: "t", count: 198 }, { char: "e", count: 167 }, { char: "o", count: 112 }, { char: "i", count: 98 }],
    o: [{ char: "n", count: 312 }, { char: "r", count: 198 }, { char: "f", count: 145 }, { char: "u", count: 112 }, { char: " ", count: 98 }],
    n: [{ char: " ", count: 401 }, { char: "e", count: 198 }, { char: "d", count: 145 }, { char: "t", count: 112 }, { char: "g", count: 89 }],
};

function lbl(c: string) { return c === " " ? "·" : c; }

type Phase = "pick" | "growing" | "insight";

/* ─── Component ─── */
export const StorageProblemVisualizer = memo(function StorageProblemVisualizer() {
    const { t } = useI18n();
    const [picked, setPicked] = useState<string[]>([]);
    const [phase, setPhase] = useState<Phase>("pick");

    const lastPicked = picked[picked.length - 1];
    const followers = lastPicked ? SAMPLE_FOLLOWERS[lastPicked] ?? [] : [];

    const totalPairsNeeded = useMemo(() => picked.length * VOCAB_SIZE, [picked.length]);

    const handlePick = useCallback((ch: string) => {
        setPicked(prev => {
            if (prev.includes(ch)) return prev;
            const next = [...prev, ch];
            if (next.length >= 3) setPhase("growing");
            return next;
        });
    }, []);

    const handleInsight = useCallback(() => setPhase("insight"), []);

    const tr = (key: string, reps: Record<string, string | number>) => {
        let s = t(key);
        for (const [k, v] of Object.entries(reps)) s = s.replace(`{${k}}`, String(v));
        return s;
    };

    return (
        <div className="space-y-5">
            {/* Phase 1: Pick characters */}
            <div>
                <p className="text-xs text-white/40 mb-3 text-center">
                    {t("bigramNarrative.storageProblem.pickPrompt")}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                    {CHARS_ROW.map(ch => {
                        const isPicked = picked.includes(ch);
                        return (
                            <motion.button
                                key={ch}
                                whileTap={{ scale: 0.92 }}
                                onClick={() => handlePick(ch)}
                                className={[
                                    "w-11 h-11 rounded-xl font-mono text-base font-bold border transition-all duration-200",
                                    isPicked
                                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_-3px_rgba(16,185,129,0.3)]"
                                        : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:bg-white/[0.06] hover:text-white/70 hover:border-white/[0.15]",
                                ].join(" ")}
                            >
                                {lbl(ch)}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Show followers for last picked char */}
            <AnimatePresence mode="wait">
                {lastPicked && (
                    <motion.div
                        key={lastPicked}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                    >
                        <p className="text-xs text-white/35 mb-3">
                            {tr("bigramNarrative.storageProblem.afterChar", { char: lbl(lastPicked) })}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {followers.map((f, i) => (
                                <motion.div
                                    key={f.char}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.06 }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/15"
                                >
                                    <span className="font-mono text-sm font-bold text-emerald-300">{lbl(lastPicked)}</span>
                                    <ArrowRight className="w-3 h-3 text-white/20" />
                                    <span className="font-mono text-sm font-bold text-teal-300">{lbl(f.char)}</span>
                                    <span className="text-[10px] font-mono text-white/25 ml-1">×{f.count}</span>
                                </motion.div>
                            ))}
                            <div className="flex items-center px-3 py-1.5 rounded-lg border border-dashed border-white/[0.08] text-[10px] font-mono text-white/15">
                                +{VOCAB_SIZE - followers.length} {t("bigramNarrative.storageProblem.moreFollowers")}
                            </div>
                        </div>
                        <p className="text-[10px] font-mono text-white/20">
                            {tr("bigramNarrative.storageProblem.needSlots", { char: lbl(lastPicked), count: VOCAB_SIZE })}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Running total */}
            <AnimatePresence>
                {picked.length >= 2 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                    >
                        <div className="text-xs font-mono text-white/30">
                            {tr("bigramNarrative.storageProblem.charsExplored", { count: picked.length })}
                        </div>
                        <div className="text-xs font-mono text-white/30">
                            {tr("bigramNarrative.storageProblem.slotsTotal", { total: totalPairsNeeded.toLocaleString() })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Phase 2: Growing realization */}
            <AnimatePresence>
                {phase === "growing" && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-center space-y-3"
                    >
                        <p className="text-sm text-white/50 leading-relaxed">
                            {tr("bigramNarrative.storageProblem.growingRealization", {
                                count: picked.length,
                                slots: totalPairsNeeded.toLocaleString(),
                                total: (VOCAB_SIZE * VOCAB_SIZE).toLocaleString(),
                            })}
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleInsight}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] text-sm font-semibold text-emerald-300 hover:bg-emerald-500/15 transition-colors"
                        >
                            <Lightbulb className="w-4 h-4" />
                            {t("bigramNarrative.storageProblem.howToOrganize")}
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Phase 3: The table insight */}
            <AnimatePresence>
                {phase === "insight" && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.03] p-5 space-y-4"
                    >
                        <div className="text-center">
                            <p className="text-sm font-semibold text-emerald-300 mb-2">
                                {t("bigramNarrative.storageProblem.insightTitle")}
                            </p>
                            <p className="text-xs text-white/45 leading-relaxed max-w-md mx-auto">
                                {t("bigramNarrative.storageProblem.insightDesc")}
                            </p>
                        </div>

                        {/* Mini table preview */}
                        <div className="overflow-auto">
                            <table className="mx-auto border-collapse font-mono text-[10px]">
                                <thead>
                                    <tr>
                                        <th className="w-8 h-7 text-white/20 border-b border-r border-white/[0.06]">↓\→</th>
                                        {picked.slice(0, 5).map(c => (
                                            <th key={c} className="w-8 h-7 text-center text-teal-300/60 border-b border-r border-white/[0.06]">{lbl(c)}</th>
                                        ))}
                                        <th className="w-8 h-7 text-center text-white/15 border-b border-white/[0.06]">…</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {picked.slice(0, 5).map((r, ri) => (
                                        <tr key={r}>
                                            <th className="w-8 h-7 text-center text-emerald-300/60 border-r border-b border-white/[0.06]">{lbl(r)}</th>
                                            {picked.slice(0, 5).map((c, ci) => {
                                                const val = SAMPLE_FOLLOWERS[r]?.find(f => f.char === c)?.count ?? 0;
                                                return (
                                                    <motion.td
                                                        key={c}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: (ri * 5 + ci) * 0.03 }}
                                                        className="w-8 h-7 text-center border-r border-b border-white/[0.06]"
                                                        style={{
                                                            backgroundColor: val > 0 ? `rgba(16, 185, 129, ${Math.min(0.35, val / 500)})` : "transparent",
                                                            color: val > 0 ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.1)",
                                                        }}
                                                    >
                                                        {val || "·"}
                                                    </motion.td>
                                                );
                                            })}
                                            <td className="w-8 h-7 text-center text-white/10 border-b border-white/[0.06]">…</td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <th className="w-8 h-7 text-center text-white/15 border-r border-white/[0.06]">…</th>
                                        {picked.slice(0, 5).map(c => (
                                            <td key={c} className="w-8 h-7 text-center text-white/10 border-r border-white/[0.06]">…</td>
                                        ))}
                                        <td className="w-8 h-7" />
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <p className="text-center text-[10px] font-mono text-white/25">
                            {tr("bigramNarrative.storageProblem.fullSize", { size: VOCAB_SIZE, total: (VOCAB_SIZE * VOCAB_SIZE).toLocaleString() })}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
