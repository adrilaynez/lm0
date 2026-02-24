"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Database, AlertTriangle } from "lucide-react";
import { useI18n } from "@/i18n/context";

/* ─────────────────────────────────────────────
   V2 — Infinite Table Thought Experiment

   Interactive slider: "Even with X tokens of training data,
   what percentage of the N-gram table can we fill?"

   Shows that even at 1 trillion tokens, high-N tables
   remain almost completely empty.
   ───────────────────────────────────────────── */

const DATA_STEPS = [
    { label: "1K", tokens: 1_000 },
    { label: "10K", tokens: 10_000 },
    { label: "100K", tokens: 100_000 },
    { label: "1M", tokens: 1_000_000 },
    { label: "10M", tokens: 10_000_000 },
    { label: "100M", tokens: 100_000_000 },
    { label: "1B", tokens: 1_000_000_000 },
    { label: "1T", tokens: 1_000_000_000_000 },
];

const VOCAB_SIZE = 96;

function fillPercent(tokens: number, n: number): number {
    // Rough model: each token gives us ~1 unique N-gram observation.
    // Actual fill follows a coupon-collector-like curve, but for pedagogical
    // purposes we use: fill ≈ 1 - (1 - 1/tableSize)^tokens
    // For large tableSize this ≈ min(tokens / tableSize, 1)
    const tableSize = Math.pow(VOCAB_SIZE, n);
    if (tableSize === 0) return 100;
    // Use the exact formula for small tables, approximation for large
    if (tableSize < 1e12) {
        const p = 1 - Math.pow(1 - 1 / tableSize, Math.min(tokens, 1e9));
        // For tokens > 1e9, scale linearly (approximation)
        if (tokens > 1e9) {
            const ratio = tokens / 1e9;
            return Math.min(100, p * ratio * 100);
        }
        return Math.min(100, p * 100);
    }
    // Very large tables: simple ratio
    return Math.min(100, (tokens / tableSize) * 100);
}

function formatPercent(pct: number): string {
    if (pct >= 99.9) return "~100%";
    if (pct >= 1) return `${pct.toFixed(1)}%`;
    if (pct >= 0.01) return `${pct.toFixed(2)}%`;
    if (pct >= 0.0001) return `${pct.toFixed(4)}%`;
    if (pct > 0) return `<0.0001%`;
    return "0%";
}

function barColor(pct: number): string {
    if (pct >= 80) return "bg-emerald-400";
    if (pct >= 30) return "bg-amber-400";
    if (pct >= 5) return "bg-orange-400";
    return "bg-red-400";
}

function barTextColor(pct: number): string {
    if (pct >= 80) return "text-emerald-400";
    if (pct >= 30) return "text-amber-400";
    if (pct >= 5) return "text-orange-400";
    return "text-red-400";
}

export function InfiniteTableThoughtExperiment() {
    const { t } = useI18n();
    const [stepIdx, setStepIdx] = useState(3); // default 1M
    const step = DATA_STEPS[stepIdx];

    const fills = useMemo(
        () =>
            [1, 2, 3, 4, 5].map((n) => ({
                n,
                tableSize: Math.pow(VOCAB_SIZE, n),
                pct: fillPercent(step.tokens, n),
            })),
        [step.tokens]
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/15">
                    <Database className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">
                        {t("ngram.widgets.infiniteTable.title")}
                    </h4>
                    <p className="text-[10px] text-white/40">
                        {t("ngram.widgets.infiniteTable.subtitle")}
                    </p>
                </div>
            </div>

            {/* Slider */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-bold">
                        {t("ngram.widgets.infiniteTable.trainingDataSize")}
                    </span>
                    <span className="font-mono text-sm text-amber-300 font-bold">
                        {t("ngram.widgets.infiniteTable.tokensLabel", { count: step.label })}
                    </span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={DATA_STEPS.length - 1}
                    step={1}
                    value={stepIdx}
                    onChange={(e) => setStepIdx(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/[0.06] accent-amber-400
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow-lg
                        [&::-webkit-slider-thumb]:shadow-amber-400/30 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-amber-300"
                />
                <div className="flex justify-between mt-1">
                    {DATA_STEPS.map((s, i) => (
                        <span
                            key={s.label}
                            className={`text-[9px] font-mono ${i === stepIdx ? "text-amber-300 font-bold" : "text-white/20"
                                }`}
                        >
                            {s.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* Fill bars */}
            <div className="space-y-3">
                {fills.map(({ n, tableSize, pct }) => (
                    <div key={n}>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-white/50 w-10">
                                    N={n}
                                </span>
                                <span className="text-[10px] text-white/25 font-mono">
                                    {t("ngram.widgets.infiniteTable.entriesLabel", { count: tableSize.toLocaleString() })}
                                </span>
                            </div>
                            <span className={`text-xs font-mono font-bold ${barTextColor(pct)}`}>
                                {formatPercent(pct)}
                            </span>
                        </div>
                        <div className="h-3 rounded-full bg-white/[0.05] overflow-hidden">
                            <motion.div
                                key={`${n}-${stepIdx}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(pct, 0.3)}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className={`h-full rounded-full ${barColor(pct)}`}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Insight callout */}
            <motion.div
                key={stepIdx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl border border-amber-500/15 bg-amber-500/[0.03] p-4 flex items-start gap-3"
            >
                <AlertTriangle className="w-4 h-4 text-amber-400/60 shrink-0 mt-0.5" />
                <p className="text-xs text-white/45 leading-relaxed">
                    {fills[4].pct < 0.01 ? (
                        <>
                            {t("ngram.widgets.infiniteTable.insight.v0", {
                                tokens: step.label,
                                entries: fills[4].tableSize.toLocaleString(),
                            })}
                        </>
                    ) : fills[4].pct < 1 ? (
                        <>
                            {t("ngram.widgets.infiniteTable.insight.v1", {
                                tokens: step.label,
                            })}
                        </>
                    ) : (
                        <>
                            {t("ngram.widgets.infiniteTable.insight.v2", {
                                tokens: step.label,
                                pct: formatPercent(fills[4].pct),
                            })}
                        </>
                    )}
                </p>
            </motion.div>
        </div>
    );
}
