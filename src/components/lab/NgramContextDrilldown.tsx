"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, Loader2, Type, ArrowLeft } from "lucide-react";
import { visualizeNgram } from "@/lib/lmLabClient";
import { useI18n } from "@/i18n/context";

/* ─────────────────────────────────────────────
   NgramContextDrilldown

   For N>1 in the lab, replaces the useless single-row
   TransitionMatrix slice with an interactive drilldown:

   N=2 (trigram): Pick a first char → see distribution
   N=3 (4-gram): Pick char 1 → char 2 → see distribution
   N=4 (5-gram): Free-text input for 4-char context lookup
   ───────────────────────────────────────────── */

// Common first characters sorted by English frequency
const FREQUENT_CHARS = [
    " ", "e", "t", "a", "o", "i", "n", "s", "h", "r",
    "d", "l", "c", "u", "m", "w", "f", "g", "y", "p",
];

type DistEntry = { char: string; prob: number };

interface NgramContextDrilldownProps {
    contextSize: number;
    vocabSize: number;
}

export function NgramContextDrilldown({ contextSize, vocabSize }: NgramContextDrilldownProps) {
    const { t } = useI18n();
    const [path, setPath] = useState<string[]>([]);
    const [distribution, setDistribution] = useState<DistEntry[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [freeInput, setFreeInput] = useState("");

    const requiredDepth = contextSize; // How many chars before we can show a distribution
    const currentDepth = path.length;
    const isComplete = currentDepth >= requiredDepth;

    const fetchDistribution = useCallback(async (context: string[]) => {
        setLoading(true);
        setError(null);
        setDistribution(null);
        try {
            const text = context.join("") + "a"; // Need at least 1 char after context for the API
            const res = await visualizeNgram(text, contextSize, 20);
            const slice = res?.visualization?.active_slice;
            const ctxDist = res?.visualization?.context_distributions?.current;

            let entries: DistEntry[] = [];

            if (slice?.matrix?.data?.[0] && slice.matrix.col_labels) {
                entries = slice.matrix.col_labels
                    .map((label: string, i: number) => ({ char: label, prob: slice.matrix!.data[0][i] }))
                    .sort((a: DistEntry, b: DistEntry) => b.prob - a.prob)
                    .filter((e: DistEntry) => e.prob > 0.001);
            } else if (ctxDist?.probabilities && ctxDist?.row_labels) {
                entries = ctxDist.row_labels
                    .map((label: string, i: number) => ({ char: label, prob: ctxDist.probabilities[i] }))
                    .sort((a: DistEntry, b: DistEntry) => b.prob - a.prob)
                    .filter((e: DistEntry) => e.prob > 0.001);
            }

            setDistribution(entries.length > 0 ? entries.slice(0, 15) : null);
        } catch (err) {
            setError((err as Error).message || t("ngram.widgets.contextDrilldown.fetchError"));
        } finally {
            setLoading(false);
        }
    }, [contextSize]);

    const handleCharSelect = useCallback((ch: string) => {
        const newPath = [...path, ch];
        setPath(newPath);
        if (newPath.length >= requiredDepth) {
            fetchDistribution(newPath);
        }
    }, [path, requiredDepth, fetchDistribution]);

    const handleBack = useCallback(() => {
        const newPath = path.slice(0, -1);
        setPath(newPath);
        setDistribution(null);
        setError(null);
    }, [path]);

    const handleReset = useCallback(() => {
        setPath([]);
        setDistribution(null);
        setError(null);
        setFreeInput("");
    }, []);

    const handleFreeInputSubmit = useCallback(() => {
        if (freeInput.length !== requiredDepth) return;
        const chars = freeInput.split("");
        setPath(chars);
        fetchDistribution(chars);
    }, [freeInput, requiredDepth, fetchDistribution]);

    // For N=4 (5-gram): show free-text input
    if (contextSize >= 4) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/15">
                        <Search className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white tracking-tight">
                            {t("ngram.widgets.contextDrilldown.lookupTitle")}
                        </h4>
                        <p className="text-[10px] text-white/40">
                            {t("ngram.widgets.contextDrilldown.lookupSubtitle", { n: requiredDepth })}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={freeInput}
                        onChange={(e) => setFreeInput(e.target.value.slice(0, requiredDepth))}
                        onKeyDown={(e) => e.key === "Enter" && handleFreeInputSubmit()}
                        placeholder={t("ngram.widgets.contextDrilldown.lookupPlaceholder", { n: requiredDepth })}
                        maxLength={requiredDepth}
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm font-mono text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500/40 transition-colors"
                    />
                    <button
                        onClick={handleFreeInputSubmit}
                        disabled={freeInput.length !== requiredDepth || loading}
                        className="px-4 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25 text-amber-300 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-30"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("ngram.widgets.contextDrilldown.lookupButton")}
                    </button>
                </div>

                {freeInput.length > 0 && freeInput.length < requiredDepth && (
                    <p className="text-[10px] text-amber-400/40 font-mono">
                        {freeInput.length}/{requiredDepth} {t("ngram.widgets.contextDrilldown.progressSuffix")}
                    </p>
                )}

                {error && (
                    <p className="text-xs text-red-400/70 p-3 rounded-lg border border-red-500/20 bg-red-500/[0.04]">
                        {error}
                    </p>
                )}

                {distribution && (
                    <DistributionChart
                        entries={distribution}
                        contextLabel={freeInput}
                    />
                )}

                {distribution === null && !loading && !error && path.length >= requiredDepth && (
                    <div className="p-4 rounded-lg border border-amber-500/15 bg-amber-500/[0.03] text-xs text-amber-300/50">
                        {t("ngram.widgets.contextDrilldown.noDataFree", { context: freeInput })}
                    </div>
                )}
            </div>
        );
    }

    // For N=2 (trigram) and N=3 (4-gram): character drill-down
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/15">
                    <Search className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">
                        {t("ngram.widgets.contextDrilldown.drilldownTitle")}
                    </h4>
                    <p className="text-[10px] text-white/40">
                        {t("ngram.widgets.contextDrilldown.drilldownSubtitle", {
                            n: requiredDepth,
                            suffix: requiredDepth > 1 ? "s" : "",
                        })}
                    </p>
                </div>
            </div>

            {/* Breadcrumb */}
            {path.length > 0 && (
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleReset}
                        className="text-[10px] text-amber-400/50 hover:text-amber-400/80 font-mono uppercase tracking-wider transition-colors"
                    >
                        {t("ngram.widgets.contextDrilldown.breadcrumbStart")}
                    </button>
                    {path.map((ch, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <ChevronRight className="w-3 h-3 text-white/15" />
                            <button
                                onClick={() => {
                                    setPath(path.slice(0, i + 1));
                                    setDistribution(null);
                                }}
                                className="font-mono text-sm text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded hover:bg-amber-500/20 transition-colors"
                            >
                                {ch === " " ? "␣" : ch}
                            </button>
                        </div>
                    ))}
                    {isComplete && (
                        <>
                            <ChevronRight className="w-3 h-3 text-white/15" />
                            <span className="text-[10px] text-emerald-400/60 font-mono uppercase tracking-wider">
                                {t("ngram.widgets.contextDrilldown.breadcrumbDistribution")}
                            </span>
                        </>
                    )}
                </div>
            )}

            {/* Character picker — show when not yet at required depth */}
            {!isComplete && (
                <div>
                    <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-3">
                        {currentDepth === 0
                            ? t("ngram.widgets.contextDrilldown.pickFirst", { remaining: requiredDepth - currentDepth })
                            : t("ngram.widgets.contextDrilldown.pickNext", {
                                context: path.join(""),
                                remaining: requiredDepth - currentDepth,
                            })
                        }
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {FREQUENT_CHARS.map((ch) => (
                            <motion.button
                                key={ch}
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleCharSelect(ch)}
                                className="w-9 h-9 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:border-amber-500/30 hover:bg-amber-500/[0.06] text-white/60 hover:text-amber-300 font-mono text-sm font-bold transition-colors flex items-center justify-center"
                            >
                                {ch === " " ? "␣" : ch}
                            </motion.button>
                        ))}
                    </div>
                </div>
            )}

            {/* Back button */}
            {path.length > 0 && !loading && (
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-[10px] text-white/30 hover:text-white/50 font-mono uppercase tracking-wider transition-colors"
                >
                    <ArrowLeft className="w-3 h-3" />
                    {t("ngram.widgets.contextDrilldown.back")}
                </button>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex items-center gap-3 p-6 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400/50" />
                    <span className="text-xs text-white/30">{t("ngram.widgets.contextDrilldown.fetching", { context: path.join("") })}</span>
                </div>
            )}

            {/* Error */}
            {error && (
                <p className="text-xs text-red-400/70 p-3 rounded-lg border border-red-500/20 bg-red-500/[0.04]">
                    {error}
                </p>
            )}

            {/* Distribution chart */}
            {distribution && isComplete && (
                <DistributionChart
                    entries={distribution}
                    contextLabel={path.join("")}
                />
            )}

            {/* No data */}
            {distribution === null && isComplete && !loading && !error && (
                <div className="p-4 rounded-lg border border-amber-500/15 bg-amber-500/[0.03] text-xs text-amber-300/50">
                    {t("ngram.widgets.contextDrilldown.noDataDrilldown", { context: path.join("") })}
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────
   Distribution bar chart sub-component
   ───────────────────────────────────────────── */

function DistributionChart({ entries, contextLabel }: { entries: DistEntry[]; contextLabel: string }) {
    const { t } = useI18n();
    const maxProb = entries[0]?.prob ?? 0;
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3"
        >
            <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-bold">
                    {t("ngram.widgets.contextDrilldown.chartTitle", { context: contextLabel })}
                </span>
                <span className="text-[10px] text-white/20 font-mono">
                    {t("ngram.widgets.contextDrilldown.chartTop", { count: entries.length })}
                </span>
            </div>

            <div className="space-y-1">
                {entries.map((entry, i) => (
                    <motion.div
                        key={entry.char}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.2 }}
                        className="flex items-center gap-3 group"
                    >
                        <span className={`font-mono text-xs w-5 text-center shrink-0 ${i === 0 ? "text-amber-300 font-bold" : "text-white/50"}`}>
                            {entry.char === " " ? "␣" : entry.char}
                        </span>
                        <div className="flex-1 h-4 rounded bg-white/[0.04] overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${maxProb > 0 ? (entry.prob / maxProb) * 100 : 0}%` }}
                                transition={{ duration: 0.4, delay: i * 0.03, ease: "easeOut" }}
                                className={`h-full rounded ${i === 0 ? "bg-amber-500/50" : "bg-white/10"}`}
                            />
                        </div>
                        <span className="font-mono text-[10px] text-white/40 w-14 text-right shrink-0 tabular-nums">
                            {(entry.prob * 100).toFixed(1)}%
                        </span>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
