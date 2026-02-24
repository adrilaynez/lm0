"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    AlertTriangle,
    TrendingUp,
    BookOpen,
    Sparkles,
    ArrowRight,
    Brain,
    Zap,
    Search,
    ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { datasetLookup } from "@/lib/lmLabClient";
import { useLabMode } from "@/context/LabModeContext";
import { useI18n } from "@/i18n/context";

const NGRAM_NAMES: Record<number, string> = {
    1: "Bigram",
    2: "Trigram",
    3: "4-gram",
    4: "5-gram",
    5: "5-gram",
};

function useModeColors() {
    const { mode } = useLabMode();
    const isEdu = mode === "educational";
    return {
        isEdu,
        accent: isEdu ? "amber" : "cyan",
        accentText: isEdu ? "text-amber-300" : "text-cyan-300",
        accentBg: isEdu ? "bg-amber-500/10" : "bg-cyan-500/10",
        accentBorder: isEdu ? "border-amber-500/25" : "border-cyan-500/25",
        accentGlow: isEdu
            ? "shadow-[0_0_25px_-8px_rgba(245,158,11,0.25)]"
            : "shadow-[0_0_25px_-8px_rgba(6,182,212,0.25)]",
        cardBg: isEdu
            ? "bg-gradient-to-br from-amber-950/15 via-black/40 to-black/60"
            : "bg-gradient-to-br from-cyan-950/10 via-black/40 to-black/60",
        cardBorder: isEdu ? "border-amber-500/15" : "border-cyan-500/15",
        sectionIcon: isEdu ? BookOpen : Zap,
    };
}

interface NgramContextPrimerProps {
    n: number;
}

export function NgramContextPrimer({ n }: NgramContextPrimerProps) {
    const { isEdu, accentText, cardBg, cardBorder, accentGlow } = useModeColors();
    const { t } = useI18n();
    const contextLength = Math.max(1, n);
    const history = "the qui";
    const visibleContext = history.slice(Math.max(0, history.length - contextLength));
    const faded = history.slice(0, Math.max(0, history.length - contextLength));

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className={`${cardBg} ${cardBorder} p-6 md:p-8 ${accentGlow}`}>
                <div className="flex items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isEdu ? "bg-amber-500/15" : "bg-cyan-500/15"}`}>
                            <Brain className={`w-5 h-5 ${accentText}`} />
                        </div>
                        <h3 className="text-lg font-bold text-white tracking-tight">
                            {t("ngramPedagogy.primer.title").replace("{name}", NGRAM_NAMES[n] ?? `${n}-gram`)}
                        </h3>
                    </div>
                    <Badge className={`${isEdu ? "bg-amber-500/15 text-amber-300 border-amber-500/30" : "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"} font-mono text-sm px-3 py-1`}>
                        N = {n}
                    </Badge>
                </div>

                {isEdu ? (
                    <div className="space-y-3 mb-6">
                        <p className="text-sm text-white/75 leading-relaxed">
                            {t("ngramPedagogy.primer.isEdu.p1")
                                .replace("{name}", NGRAM_NAMES[n] ?? `${n}-gram`)
                                .replace("{length}", String(contextLength))
                                .replace("{suffix}", contextLength > 1 ? "s" : "")
                                .replace(/<[^>]+>/g, "")}
                        </p>
                        <p className="text-sm text-white/60 leading-relaxed">
                            {n === 1
                                ? t("ngramPedagogy.primer.isEdu.n1")
                                : n === 2
                                    ? t("ngramPedagogy.primer.isEdu.n2")
                                    : n <= 4
                                        ? t("ngramPedagogy.primer.isEdu.nSmall")
                                            .replace("{n}", String(n))
                                            .replace("{count}", Math.pow(96, n).toLocaleString())
                                        : t("ngramPedagogy.primer.isEdu.nLarge")
                                            .replace("{n}", String(n))}
                        </p>
                    </div>
                ) : (
                    <p className="text-sm text-white/65 leading-relaxed mb-6">
                        {t("ngramPedagogy.primer.isFree.p1")
                            .replace("{name}", NGRAM_NAMES[n] ?? `${n}-gram`)
                            .replace("{length}", String(contextLength))
                            .replace("{suffix}", contextLength > 1 ? "s" : "")
                            .replace("{n}", String(n))
                            .replace(/<[^>]+>/g, "")}
                    </p>
                )}

                <div className={`rounded-xl border ${isEdu ? "border-amber-500/20 bg-amber-950/15" : "border-cyan-500/20 bg-cyan-950/15"} p-4`}>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/45 mb-3 font-bold">{t("ngramPedagogy.primer.liveWindow")}</p>
                    <div className="font-mono text-base md:text-lg flex items-center gap-0.5 flex-wrap">
                        {faded.split("").map((ch, i) => (
                            <span key={`f-${i}`} className="text-white/20">{ch}</span>
                        ))}
                        {visibleContext.split("").map((ch, i) => (
                            <motion.span
                                key={`v-${i}-${n}`}
                                initial={{ scale: 1.3, color: isEdu ? "#fbbf24" : "#22d3ee" }}
                                animate={{ scale: 1, color: isEdu ? "#fcd34d" : "#67e8f9" }}
                                transition={{ delay: i * 0.06, duration: 0.35 }}
                                className="font-bold"
                            >
                                {ch}
                            </motion.span>
                        ))}
                        <ArrowRight className="w-4 h-4 text-white/30 mx-2" />
                        <span className="text-emerald-400 font-bold">?</span>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

export function NgramContextGrowthAnimation() {
    const { isEdu, cardBg, cardBorder, accentText, accentGlow } = useModeColors();
    const { t } = useI18n();
    const tokenStream = "the qui";
    const [activeN, setActiveN] = useState(1);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveN((prev) => (prev >= 5 ? 1 : prev + 1));
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
        >
            <Card className={`${cardBg} ${cardBorder} p-6 md:p-8 ${accentGlow}`}>
                <div className="flex items-center gap-3 mb-2">
                    <Sparkles className={`w-5 h-5 ${accentText}`} />
                    <h3 className="text-lg font-bold text-white tracking-tight">{t("ngramPedagogy.growth.title")}</h3>
                </div>
                {isEdu && (
                    <p className="text-sm text-white/60 mb-5 leading-relaxed">
                        {t("ngramPedagogy.growth.body")}
                    </p>
                )}
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((n) => {
                        const ctx = tokenStream.slice(Math.max(0, tokenStream.length - n));
                        const faded = tokenStream.slice(0, tokenStream.length - n);
                        const isActive = n === activeN;
                        return (
                            <motion.div
                                key={n}
                                animate={{
                                    borderColor: isActive
                                        ? isEdu ? "rgba(245,158,11,0.35)" : "rgba(6,182,212,0.35)"
                                        : "rgba(255,255,255,0.08)",
                                    backgroundColor: isActive
                                        ? isEdu ? "rgba(245,158,11,0.06)" : "rgba(6,182,212,0.06)"
                                        : "rgba(255,255,255,0.015)",
                                }}
                                transition={{ duration: 0.3 }}
                                className="rounded-lg border p-3 flex items-center justify-between cursor-pointer"
                                onClick={() => setActiveN(n)}
                            >
                                <div className="flex items-center gap-3">
                                    <Badge
                                        variant="outline"
                                        className={`font-mono text-xs ${isActive
                                            ? isEdu ? "border-amber-500/40 text-amber-300 bg-amber-500/15" : "border-cyan-500/40 text-cyan-300 bg-cyan-500/15"
                                            : "border-white/15 text-white/40 bg-white/[0.02]"
                                            }`}
                                    >
                                        N={n}
                                    </Badge>
                                    <div className="font-mono text-sm">
                                        <span className="text-white/20">{faded}</span>
                                        <span className={isActive ? (isEdu ? "text-amber-300 font-bold" : "text-cyan-300 font-bold") : "text-white/50"}>
                                            {ctx}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-[10px] font-mono text-white/30">
                                    |V|<sup>{n}</sup> = {Math.pow(96, n).toLocaleString()}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            </Card>
        </motion.div>
    );
}

interface NgramMiniTransitionTableProps {
    n: number;
}

type ExampleTransition = { context: string; next: string; prob: number; alternatives: { ch: string; prob: number }[] };

function buildTransitions(n: number): ExampleTransition[] {
    // Use "the cat" — more relatable than "the qui", and produces good transitions
    const contextLength = Math.max(1, n);
    if (contextLength === 1) {
        return [
            { context: "t", next: "h", prob: 42, alternatives: [{ ch: "h", prob: 42 }, { ch: "o", prob: 18 }, { ch: "e", prob: 8 }, { ch: "i", prob: 7 }] },
            { context: "h", next: "e", prob: 32, alternatives: [{ ch: "e", prob: 32 }, { ch: "a", prob: 19 }, { ch: "i", prob: 12 }, { ch: "o", prob: 9 }] },
            { context: "e", next: " ", prob: 24, alternatives: [{ ch: "␣", prob: 24 }, { ch: "r", prob: 15 }, { ch: "n", prob: 12 }, { ch: "s", prob: 10 }] },
            { context: "c", next: "a", prob: 18, alternatives: [{ ch: "a", prob: 18 }, { ch: "o", prob: 17 }, { ch: "h", prob: 12 }, { ch: "e", prob: 11 }] },
        ];
    }
    if (contextLength === 2) {
        return [
            { context: "th", next: "e", prob: 85, alternatives: [{ ch: "e", prob: 85 }, { ch: "a", prob: 6 }, { ch: "i", prob: 4 }] },
            { context: "he", next: " ", prob: 55, alternatives: [{ ch: "␣", prob: 55 }, { ch: "r", prob: 18 }, { ch: "n", prob: 8 }] },
            { context: " c", next: "a", prob: 22, alternatives: [{ ch: "a", prob: 22 }, { ch: "o", prob: 20 }, { ch: "h", prob: 10 }] },
            { context: "ca", next: "t", prob: 24, alternatives: [{ ch: "t", prob: 24 }, { ch: "l", prob: 18 }, { ch: "n", prob: 14 }] },
        ];
    }
    // n=3 (4-gram)
    return [
        { context: "the", next: " ", prob: 91, alternatives: [{ ch: "␣", prob: 91 }, { ch: "r", prob: 3 }, { ch: "n", prob: 2 }] },
        { context: "he ", next: "c", prob: 8, alternatives: [{ ch: "c", prob: 8 }, { ch: "s", prob: 7 }, { ch: "w", prob: 6 }] },
        { context: " ca", next: "t", prob: 28, alternatives: [{ ch: "t", prob: 28 }, { ch: "l", prob: 20 }, { ch: "n", prob: 15 }] },
    ];
}

export function NgramMiniTransitionTable({ n }: NgramMiniTransitionTableProps) {
    const { isEdu, cardBg, cardBorder, accentText, accentGlow, accentBorder } = useModeColors();
    const { t } = useI18n();
    const rows = useMemo(() => buildTransitions(n), [n]);
    const [evidence, setEvidence] = useState<Record<number, string[]>>({});
    const [loadingRows, setLoadingRows] = useState<Record<number, boolean>>({});
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    useEffect(() => {
        let active = true;
        setEvidence({});
        setLoadingRows({});
        if (n >= 5 || rows.length === 0) return;

        const fetchEvidence = async () => {
            for (let idx = 0; idx < rows.length; idx++) {
                const row = rows[idx];
                setLoadingRows((prev) => ({ ...prev, [idx]: true }));
                try {
                    const result = await datasetLookup(row.context.split(""), row.next);
                    if (!active) return;
                    setEvidence((prev) => ({ ...prev, [idx]: result.examples.slice(0, 3) }));
                } catch {
                    if (!active) return;
                    setEvidence((prev) => ({ ...prev, [idx]: [] }));
                } finally {
                    if (active) setLoadingRows((prev) => ({ ...prev, [idx]: false }));
                }
            }
        };
        fetchEvidence();
        return () => { active = false; };
    }, [rows, n]);

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className={`${cardBg} ${cardBorder} p-6 md:p-8 ${accentGlow}`}>
                <div className="flex items-center gap-3 mb-2">
                    <Search className={`w-5 h-5 ${accentText}`} />
                    <h3 className="text-lg font-bold text-white tracking-tight">{t("ngramPedagogy.transitions.title")}</h3>
                </div>

                {isEdu ? (
                    <p className="text-sm text-white/60 mb-5 leading-relaxed">
                        {t("ngramPedagogy.transitions.isEduBody").replace(/<[^>]+>/g, "")}
                    </p>
                ) : (
                    <p className="text-sm text-white/50 mb-5">
                        {t("ngramPedagogy.transitions.isFreeBody").replace(/<[^>]+>/g, "")}
                    </p>
                )}

                {n >= 5 ? (
                    <NgramFiveGramScale />
                ) : (
                    <div className="space-y-2.5">
                        {rows.map((row, idx) => {
                            const isExpanded = expandedRow === idx;
                            const rowEvidence = evidence[idx] ?? [];
                            const isLoading = loadingRows[idx];
                            const topProb = row.alternatives[0]?.prob ?? 0;
                            return (
                                <motion.div
                                    key={`${row.context}-${idx}-${n}`}
                                    layout
                                    className={`rounded-xl border ${isExpanded ? accentBorder : "border-white/[0.08]"} bg-white/[0.02] overflow-hidden cursor-pointer transition-colors hover:border-white/[0.12]`}
                                    onClick={() => setExpandedRow(isExpanded ? null : idx)}
                                >
                                    <div className="p-4 space-y-2.5">
                                        {/* Context → Next row */}
                                        <div className="flex items-center justify-between">
                                            <div className="font-mono text-sm flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-lg font-bold ${isEdu ? "bg-amber-500/15 text-amber-200 border border-amber-500/20" : "bg-cyan-500/15 text-cyan-200 border border-cyan-500/20"}`}>
                                                    {row.context}
                                                </span>
                                                <ArrowRight className="w-3.5 h-3.5 text-white/25" />
                                                <span className="text-emerald-400 font-bold text-base">{row.next === " " ? "␣" : row.next}</span>
                                            </div>
                                            <div className="flex items-center gap-2.5">
                                                <span className="font-mono font-bold text-sm tabular-nums text-amber-300">{row.prob}%</span>
                                                {isLoading && <div className="w-3 h-3 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />}
                                                {!isLoading && rowEvidence.length > 0 && (
                                                    <Badge className="bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20 text-[10px]">
                                                        {t("ngramPedagogy.transitions.matches")
                                                            .replace("{count}", String(rowEvidence.length))
                                                            .replace("{suffix}", rowEvidence.length !== 1 ? "es" : "")}
                                                    </Badge>
                                                )}
                                                <ChevronRight className={`w-4 h-4 text-white/25 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                            </div>
                                        </div>

                                        {/* Mini inline probability bar */}
                                        <div className="flex items-center gap-2">
                                            {row.alternatives.slice(0, 4).map((alt) => (
                                                <div key={alt.ch} className="flex items-center gap-1">
                                                    <span className={`font-mono text-[10px] ${alt.ch === (row.next === " " ? "␣" : row.next) ? "text-amber-300 font-bold" : "text-white/30"}`}>
                                                        {alt.ch}
                                                    </span>
                                                    <div className="w-12 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${alt.ch === (row.next === " " ? "␣" : row.next) ? "bg-amber-500/50" : "bg-white/10"}`}
                                                            style={{ width: `${topProb > 0 ? (alt.prob / topProb) * 100 : 0}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                                                    <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-bold">
                                                        {t("ngramPedagogy.transitions.corpusEvidence")}
                                                    </p>
                                                    {isLoading ? (
                                                        <p className="text-xs text-white/40 animate-pulse">{t("ngramPedagogy.transitions.searching")}</p>
                                                    ) : rowEvidence.length > 0 ? (
                                                        rowEvidence.map((ex, exIdx) => (
                                                            <div key={exIdx} className="font-mono text-[11px] text-white/60 bg-black/30 rounded-lg px-3 py-2 truncate border border-white/5">
                                                                {ex}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.03] p-3 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400/60 shrink-0" />
                                                                <p className="text-xs font-bold text-amber-300/70">{t("ngramPedagogy.transitions.noMatchesExpanded.title")}</p>
                                                            </div>
                                                            <p className="text-[11px] text-white/35 leading-relaxed">
                                                                {t("ngramPedagogy.transitions.noMatchesExpanded.explanation")}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </Card>
        </motion.div>
    );
}

interface NgramFiveGramScaleProps {
    vocabSize?: number;
}

export function NgramFiveGramScale({ vocabSize = 96 }: NgramFiveGramScaleProps) {
    const { t } = useI18n();
    const combinations = Math.pow(vocabSize, 5);
    const billionCount = (combinations / 1e9).toFixed(0);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl overflow-hidden border border-red-500/30 bg-gradient-to-br from-red-950/30 via-red-950/15 to-black relative"
        >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(239,68,68,0.08),transparent_70%)]" />
            <div className="p-8 md:p-10 text-center relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 mb-6 ring-1 ring-red-500/25">
                    <TrendingUp className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
                    {t("ngramPedagogy.explosion.title")}
                </h3>
                <p className="text-white/55 max-w-lg mx-auto leading-relaxed mb-6 text-sm">
                    {t("ngramPedagogy.explosion.body1")
                        .replace("{n}", "5")
                        .replace("{vocabSize}", String(vocabSize))}
                </p>
                <div className="inline-block px-6 py-4 rounded-xl bg-black/50 border border-red-500/20 font-mono text-xl text-red-300 mb-4">
                    {vocabSize}<sup>5</sup> = <span className="text-red-200 font-bold">{combinations.toLocaleString()}</span>{" "}
                    {t("ngramPedagogy.explosion.entries").replace("{count}", "").trim()}
                </div>
                <p className="text-sm text-white/45 max-w-md mx-auto mb-6">
                    {t("ngramPedagogy.explosion.body2").replace("{billionCount}", billionCount)}
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-red-400/70 uppercase tracking-[0.15em] font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {t("ngramPedagogy.explosion.limitReached")}
                </div>
            </div>
        </motion.div>
    );
}

interface NgramComparisonProps {
    vocabSize?: number;
    metricsByN?: Record<number, {
        perplexity?: number | null;
        contextUtilization?: number | null;
        contextSpace?: number | null;
    }>;
}

export function NgramComparison({ vocabSize = 96, metricsByN }: NgramComparisonProps) {
    const { isEdu, cardBg, cardBorder, accentText, accentGlow } = useModeColors();
    const { t } = useI18n();

    const perplexities = [1, 2, 3, 4, 5]
        .map((n) => metricsByN?.[n]?.perplexity ?? null)
        .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const maxPpl = perplexities.length > 0 ? Math.max(...perplexities) : 0;
    const minPpl = perplexities.length > 0 ? Math.min(...perplexities) : 0;

    const qualityBar = (p?: number | null) => {
        if (p == null || !Number.isFinite(p)) return 0;
        if (maxPpl === minPpl) return 50;
        return Math.round(((maxPpl - p) / (maxPpl - minPpl)) * 100);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className={`${cardBg} ${cardBorder} p-6 md:p-8 ${accentGlow}`}>
                <h3 className="text-lg font-bold text-white tracking-tight mb-1">{t("ngramPedagogy.comparison.title")}</h3>
                {isEdu ? (
                    <p className="text-sm text-white/55 mb-6 leading-relaxed">
                        {t("ngramPedagogy.comparison.isEduBody")}
                    </p>
                ) : (
                    <p className="text-sm text-white/45 mb-6">{t("ngramPedagogy.comparison.isFreeBody")}</p>
                )}

                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((n) => {
                        const m = metricsByN?.[n];
                        const ppl = m?.perplexity ?? null;
                        const util = m?.contextUtilization ?? null;
                        const space = m?.contextSpace ?? Math.pow(vocabSize, n);
                        const q = qualityBar(ppl);

                        return (
                            <div key={n} className="rounded-xl border border-white/8 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors">
                                <div className="flex flex-wrap items-center gap-3 mb-3">
                                    <Badge variant="outline" className={`font-mono text-xs ${isEdu ? "border-amber-500/30 text-amber-300 bg-amber-500/10" : "border-cyan-500/30 text-cyan-300 bg-cyan-500/10"}`}>
                                        {NGRAM_NAMES[n] ?? `${n}-gram`}
                                    </Badge>
                                    <span className="text-xs text-white/50">|V|<sup>{n}</sup> = {space.toLocaleString()}</span>
                                    <span className="text-xs text-white/40 ml-auto font-mono">
                                        ppl: {ppl != null ? ppl.toFixed(1) : "—"}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[10px] text-white/40 mb-1 uppercase tracking-wider font-semibold">{t("ngramPedagogy.comparison.quality")}</p>
                                        <div className="h-2.5 rounded-full bg-white/8 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${q}%` }}
                                                transition={{ duration: 0.7, delay: n * 0.08 }}
                                                className={`h-full rounded-full ${isEdu ? "bg-gradient-to-r from-amber-600/70 to-amber-400/80" : "bg-gradient-to-r from-cyan-600/70 to-cyan-400/80"}`}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-white/40 mb-1 uppercase tracking-wider font-semibold">{t("ngramPedagogy.comparison.utilization")}</p>
                                        <div className="h-2.5 rounded-full bg-white/8 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.max(0, Math.min(100, (util ?? 0) * 100))}%` }}
                                                transition={{ duration: 0.7, delay: n * 0.08 }}
                                                className="h-full rounded-full bg-gradient-to-r from-emerald-600/70 to-emerald-400/80"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </motion.div>
    );
}

export function NgramLimitations() {
    const { isEdu, cardBg, cardBorder, accentText, accentGlow } = useModeColors();
    const { t } = useI18n();

    const items = [
        {
            title: t("ngramPedagogy.limitations.items.context.title"),
            body: isEdu
                ? t("ngramPedagogy.limitations.items.context.isEdu")
                : t("ngramPedagogy.limitations.items.context.isFree"),
            color: "text-red-400",
        },
        {
            title: t("ngramPedagogy.limitations.items.scalability.title"),
            body: isEdu
                ? t("ngramPedagogy.limitations.items.scalability.isEdu")
                : t("ngramPedagogy.limitations.items.scalability.isFree"),
            color: "text-orange-400",
        },
        {
            title: t("ngramPedagogy.limitations.items.vocabulary.title"),
            body: isEdu
                ? t("ngramPedagogy.limitations.items.vocabulary.isEdu")
                : t("ngramPedagogy.limitations.items.vocabulary.isFree"),
            color: "text-yellow-400",
        },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className={`${cardBg} ${cardBorder} p-6 md:p-8 ${accentGlow}`}>
                <div className="flex items-center gap-3 mb-5">
                    <AlertTriangle className={`w-5 h-5 ${accentText}`} />
                    <h3 className="text-lg font-bold text-white tracking-tight">{t("ngramPedagogy.limitations.title")}</h3>
                </div>
                <div className="space-y-4">
                    {items.map((item, i) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1, duration: 0.4 }}
                            className="flex gap-4 items-start"
                        >
                            <div className={`w-1 h-full min-h-[40px] rounded-full ${item.color.replace("text-", "bg-")}/40 shrink-0`} />
                            <div>
                                <p className={`text-sm font-semibold ${item.color} mb-0.5`}>{item.title}</p>
                                <p className="text-sm text-white/60 leading-relaxed">{item.body}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </Card>
        </motion.div>
    );
}

export function NgramEducationalNarrative() {
    const { t } = useI18n();

    const steps = [
        { key: "s1", icon: "01" },
        { key: "s2", icon: "02" },
        { key: "s3", icon: "03" },
        { key: "s4", icon: "04" },
    ] as const;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl overflow-hidden border border-amber-500/20 bg-gradient-to-br from-amber-950/20 via-black/50 to-black/70 shadow-[0_0_40px_-12px_rgba(245,158,11,0.15)]"
        >
            <div className="px-6 md:px-8 py-6 border-b border-amber-500/15 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/15">
                    <BookOpen className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">{t("ngramPedagogy.story.title")}</h3>
                    <p className="text-xs text-amber-200/50">{t("ngramPedagogy.story.subtitle")}</p>
                </div>
            </div>

            <div className="p-6 md:p-8 space-y-8">
                {steps.map((step, i) => (
                    <motion.div
                        key={step.icon}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.12, duration: 0.5 }}
                        className="flex gap-5"
                    >
                        <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-mono text-sm text-amber-300 font-bold">
                            {step.icon}
                        </div>
                        <div className="pt-1">
                            <h4 className="text-sm font-bold text-amber-200 mb-1.5">{t(`ngramPedagogy.story.steps.${step.key}.title`)}</h4>
                            <p className="text-sm text-white/60 leading-relaxed">{t(`ngramPedagogy.story.steps.${step.key}.body`)}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
