"use client";

import { LabShell } from "@/components/lab/LabShell";
import { ModelHero } from "@/components/lab/ModelHero";
import dynamic from "next/dynamic";
import Link from "next/link";

import { useNgramVisualization } from "@/hooks/useNgramVisualization";
import { useNgramStepwise } from "@/hooks/useNgramStepwise";
import { useNgramGeneration } from "@/hooks/useNgramGeneration";
import { visualizeNgram } from "@/lib/lmLabClient";
import type { NGramTrainingInfo } from "@/types/lmLab";
import { motion, AnimatePresence } from "framer-motion";
import {
    FlaskConical,
    Database,
    Hash,
    Activity,
    Zap,
    TrendingDown,
    BarChart3,
    Eye,
    Layers,
    Type,
    Sparkles,
    Gauge,
    ChevronDown,
    Microscope,
    ArrowRight,
} from "lucide-react";
import { useEffect, useCallback, useRef, useState, useMemo } from "react";
import { useI18n } from "@/i18n/context";
import { useLabMode } from "@/context/LabModeContext";
import { NgramSparsityIndicator } from "@/components/lab/NgramSparsityIndicator";
import { NgramLossChart } from "@/components/lab/NgramLossChart";
import { NgramComparisonDashboard } from "@/components/lab/NgramComparisonDashboard";
import { NgramPerformanceSummary } from "@/components/lab/NgramPerformanceSummary";

const ContextControl = dynamic(() =>
    import("@/components/lab/ContextControl").then((m) => m.ContextControl)
);
const TransitionMatrix = dynamic(() =>
    import("@/components/lab/TransitionMatrix").then((m) => m.TransitionMatrix)
);
const InferenceConsole = dynamic(() =>
    import("@/components/lab/InferenceConsole").then((m) => m.InferenceConsole)
);
const StepwisePrediction = dynamic(() =>
    import("@/components/lab/StepwisePrediction").then((m) => m.StepwisePrediction)
);
const GenerationPlayground = dynamic(() =>
    import("@/components/lab/GenerationPlayground").then((m) => m.GenerationPlayground)
);
const NgramFiveGramScale = dynamic(() =>
    import("@/components/lab/NgramPedagogyPanels").then((m) => m.NgramFiveGramScale)
);
const NgramNarrative = dynamic(() =>
    import("@/components/lab/NgramNarrative").then((m) => m.NgramNarrative)
);
const NgramGenerationBattle = dynamic(() =>
    import("@/components/lab/NgramGenerationBattle").then((m) => m.NgramGenerationBattle)
);
const NgramTechnicalExplanation = dynamic(() =>
    import("@/components/lab/NgramTechnicalExplanation").then((m) => m.NgramTechnicalExplanation)
);
const NgramContextDrilldown = dynamic(() =>
    import("@/components/lab/NgramContextDrilldown").then((m) => m.NgramContextDrilldown)
);

/* ─────────────────────────────────────────────
   Lab section wrapper
   ───────────────────────────────────────────── */

function LabSection({
    icon: Icon,
    title,
    description,
    children,
    accent = "cyan",
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    children: React.ReactNode;
    accent?: "cyan" | "violet" | "amber" | "emerald" | "red";
}) {
    const accentMap = {
        cyan: { icon: "text-cyan-400", bg: "bg-cyan-500/15", border: "border-cyan-500/20", bar: "bg-cyan-400" },
        violet: { icon: "text-violet-400", bg: "bg-violet-500/15", border: "border-violet-500/20", bar: "bg-violet-400" },
        amber: { icon: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/20", bar: "bg-amber-400" },
        emerald: { icon: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/20", bar: "bg-emerald-400" },
        red: { icon: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/20", bar: "bg-red-400" },
    };
    const a = accentMap[accent];

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
        >
            <div className={`rounded-2xl border ${a.border} bg-gradient-to-br from-white/[0.02] to-black/20 overflow-hidden`}>
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.015]">
                    <div className={`p-1.5 rounded-lg ${a.bg}`}>
                        <Icon className={`w-4 h-4 ${a.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
                        <p className="text-[10px] text-white/35 truncate">{description}</p>
                    </div>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────
   Flow descriptor block (lightweight)
   ───────────────────────────────────────────── */

function FlowHint({ text }: { text: string }) {
    return (
        <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="max-w-6xl mx-auto px-6 mb-4 text-[11px] text-white/30 leading-relaxed border-l-2 border-amber-500/20 pl-3"
        >
            {text}
        </motion.p>
    );
}

/* ─────────────────────────────────────────────
   Guided Experiments panel
   ───────────────────────────────────────────── */

const EXPERIMENT_META = [
    { id: 1 as const, accent: "amber" as const, scrollTarget: "generation-playground" },
    { id: 2 as const, accent: "cyan" as const, scrollTarget: "sparsity-comparison" },
    { id: 3 as const, accent: "red" as const, scrollTarget: "inference-console" },
    { id: 4 as const, accent: "violet" as const, scrollTarget: "generation-playground" },
    { id: 5 as const, accent: "emerald" as const, scrollTarget: "sparsity-comparison" },
] as const;

type ExperimentAccent = typeof EXPERIMENT_META[number]["accent"];

const EXP_BORDER: Record<ExperimentAccent, string> = {
    amber: "border-amber-500/20",
    cyan: "border-cyan-500/20",
    red: "border-red-500/20",
    violet: "border-violet-500/20",
    emerald: "border-emerald-500/20",
};
const EXP_DOT: Record<ExperimentAccent, string> = {
    amber: "bg-amber-400",
    cyan: "bg-cyan-400",
    red: "bg-red-400",
    violet: "bg-violet-400",
    emerald: "bg-emerald-400",
};
const EXP_TEXT: Record<ExperimentAccent, string> = {
    amber: "text-amber-300",
    cyan: "text-cyan-300",
    red: "text-red-300",
    violet: "text-violet-300",
    emerald: "text-emerald-300",
};

function GuidedExperiments() {
    const [open, setOpen] = useState(true);
    const [expanded, setExpanded] = useState<number | null>(1);
    const { t } = useI18n();

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="max-w-6xl mx-auto px-6 mb-6"
        >
            {/* Toggle header */}
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl border border-amber-500/15 bg-amber-500/[0.03] hover:bg-amber-500/[0.05] transition-colors group"
            >
                <Microscope className="w-4 h-4 text-amber-400/60 shrink-0" />
                <div className="flex-1 text-left">
                    <span className="text-sm font-bold text-white/60 group-hover:text-white/80 transition-colors">
                        {t("models.ngram.lab.guidedExperiments")}
                    </span>
                    <span className="ml-2.5 text-[10px] font-mono text-amber-400/35 uppercase tracking-widest">
                        {t("models.ngram.lab.guidedExperimentsChallenges")}
                    </span>
                </div>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-4 h-4 text-white/20" />
                </motion.div>
            </button>

            {/* Experiment cards */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
                            {EXPERIMENT_META.map((exp) => {
                                const isExpanded = expanded === exp.id;
                                return (
                                    <div
                                        key={exp.id}
                                        className={`rounded-xl border ${EXP_BORDER[exp.accent]} bg-white/[0.02] cursor-pointer select-none`}
                                        onClick={() => setExpanded(isExpanded ? null : exp.id)}
                                    >
                                        <div className="flex items-center gap-3 px-4 py-3">
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${EXP_DOT[exp.accent]}`} />
                                            <span className={`text-sm font-bold flex-1 leading-tight ${EXP_TEXT[exp.accent]}`}>
                                                {t(`models.ngram.lab.experiments.${exp.id}.title`)}
                                            </span>
                                            <motion.div
                                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                                transition={{ duration: 0.15 }}
                                            >
                                                <ChevronDown className="w-3.5 h-3.5 text-white/20 shrink-0" />
                                            </motion.div>
                                        </div>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.18 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-4 pb-4 pt-3 border-t border-white/[0.05] flex flex-col gap-3">
                                                        <div>
                                                            <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-white/25 mb-1.5">
                                                                {t("models.ngram.lab.experiments.instructions")}
                                                            </p>
                                                            <p className="text-xs text-white/45 leading-relaxed">
                                                                {t(`models.ngram.lab.experiments.${exp.id}.instruction`)}
                                                            </p>
                                                        </div>
                                                        <div className={`rounded-lg border ${EXP_BORDER[exp.accent]} bg-white/[0.015] px-3 py-2.5`}>
                                                            <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-white/20 mb-1.5">
                                                                {t("models.ngram.lab.experiments.expectedObservation")}
                                                            </p>
                                                            <p className={`text-xs leading-relaxed ${EXP_TEXT[exp.accent]} opacity-60`}>
                                                                {t(`models.ngram.lab.experiments.${exp.id}.observation`)}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                document.getElementById(exp.scrollTarget)?.scrollIntoView({ behavior: "smooth", block: "start" });
                                                            }}
                                                            className={`self-start flex items-center gap-1.5 text-[10px] font-mono ${EXP_TEXT[exp.accent]} opacity-40 hover:opacity-80 transition-opacity`}
                                                        >
                                                            <ArrowRight className="w-3 h-3" />
                                                            {t("models.ngram.lab.experiments.goToPanel")}
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}


/* ─────────────────────────────────────────────
   Advanced Metrics collapsible (L1)
   Hides loss/perplexity/performance behind a
   toggle so beginners aren't overwhelmed.
   ───────────────────────────────────────────── */

function AdvancedMetricsCollapsible({
    hasPerformanceData,
    hasLossHistory,
    nGramData,
    training,
    contextSize,
}: {
    hasPerformanceData: boolean;
    hasLossHistory: boolean;
    nGramData: ReturnType<typeof useNgramVisualization>["data"];
    training: NGramTrainingInfo | null;
    contextSize: number;
}) {
    const [open, setOpen] = useState(false);
    const { t } = useI18n();

    const displayedFinalLoss = useMemo(
        () => training?.final_train_loss ?? training?.final_loss ?? undefined,
        [training]
    );
    const displayedLossHistory = useMemo(
        () => training?.train_loss_history ?? training?.loss_history ?? undefined,
        [training]
    );

    return (
        <>
            <button
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.035] transition-colors group"
            >
                <Gauge className="w-4 h-4 text-amber-400/50 shrink-0" />
                <div className="flex-1 text-left">
                    <span className="text-sm font-bold text-white/50 group-hover:text-white/70 transition-colors">
                        {t("models.ngram.lab.advancedMetrics")}
                    </span>
                    <span className="ml-2.5 text-[10px] font-mono text-amber-400/30 uppercase tracking-widest">
                        {t("models.ngram.lab.advancedMetricsExperts")}
                    </span>
                </div>
                <span className="text-[10px] text-white/20 mr-2">
                    {t("models.ngram.lab.advancedMetricsDesc")}
                </span>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-4 h-4 text-white/20" />
                </motion.div>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="pt-4 space-y-4">
                            <p className="text-xs text-amber-300/40 italic border-l-2 border-amber-500/15 pl-3">
                                {t("models.ngram.lab.advancedMetricsHint")}
                            </p>

                            {hasPerformanceData && (
                                <LabSection
                                    icon={Gauge}
                                    title={t("models.ngram.lab.performanceSummary.title")}
                                    description={t("models.ngram.lab.performanceSummary.description")}
                                    accent="emerald"
                                >
                                    <NgramPerformanceSummary
                                        inferenceMs={nGramData?.metadata.inference_time_ms}
                                        device={nGramData?.metadata.device}
                                        totalTokens={training?.total_tokens ?? undefined}
                                        trainingDuration={(training as unknown as { training_duration_ms?: number } | null)?.training_duration_ms}
                                        perplexity={training?.perplexity ?? undefined}
                                        finalLoss={displayedFinalLoss}
                                    />
                                </LabSection>
                            )}

                            {hasLossHistory && displayedLossHistory && (
                                <LabSection
                                    icon={TrendingDown}
                                    title={t("models.ngram.lab.sections.trainingQuality")}
                                    description={t("models.ngram.lab.sections.trainingQualityDesc").replace("{n}", String(contextSize))}
                                    accent="emerald"
                                >
                                    <NgramLossChart
                                        trainLossHistory={displayedLossHistory}
                                        valLossHistory={training?.val_loss_history ?? undefined}
                                        perplexity={training?.perplexity ?? undefined}
                                        finalLoss={displayedFinalLoss}
                                    />
                                </LabSection>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

/* ─────────────────────────────────────────────
   Page component
   ───────────────────────────────────────────── */

type ComparisonEntry = { perplexity: number | null; contextUtilization: number | null; contextSpace: number | null };

function NgramPageContent() {
    const { t } = useI18n();
    const { mode } = useLabMode();
    const isEdu = mode === "educational";
    const viz = useNgramVisualization();
    const stepwise = useNgramStepwise(viz.contextSize);
    const generation = useNgramGeneration(viz.contextSize);

    /* Cached per-N comparison metrics — fetch lazily on N change, never re-fetch */
    const comparisonCacheRef = useRef<Record<number, ComparisonEntry>>({});
    const fetchingNsRef = useRef<Set<number>>(new Set());
    const [comparisonMetrics, setComparisonMetrics] = useState<Record<number, ComparisonEntry>>({});

    const lastTextRef = useRef<string>("hello");

    useEffect(() => {
        if (!viz.data && !viz.loading && !viz.error) {
            viz.analyze("hello", 10);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (lastTextRef.current && viz.contextSize < 5) {
            viz.analyze(lastTextRef.current, 10);
        }
    }, [viz.contextSize]); // eslint-disable-line react-hooks/exhaustive-deps

    /* Fetch comparison metric for the current N only; cache to avoid re-fetching */
    useEffect(() => {
        const n = viz.contextSize;
        if (comparisonCacheRef.current[n] !== undefined) return;
        if (fetchingNsRef.current.has(n)) return;
        fetchingNsRef.current.add(n);
        let active = true;
        visualizeNgram("hello", n, 5)
            .then((res) => {
                if (!active) return;
                const entry: ComparisonEntry = {
                    perplexity: res.visualization.training?.perplexity ?? res.visualization.diagnostics?.perplexity ?? null,
                    contextUtilization: res.visualization.training?.context_utilization ?? res.visualization.diagnostics?.context_utilization ?? null,
                    contextSpace: res.visualization.training?.context_space_size ?? res.visualization.diagnostics?.estimated_context_space ?? null,
                };
                comparisonCacheRef.current = { ...comparisonCacheRef.current, [n]: entry };
                setComparisonMetrics({ ...comparisonCacheRef.current });
            })
            .catch(() => {
                if (!active) return;
                comparisonCacheRef.current = { ...comparisonCacheRef.current, [n]: { perplexity: null, contextUtilization: null, contextSpace: null } };
                setComparisonMetrics({ ...comparisonCacheRef.current });
            })
            .finally(() => { fetchingNsRef.current.delete(n); });
        return () => { active = false; };
    }, [viz.contextSize]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleAnalyze = useCallback((text: string, topK: number) => {
        lastTextRef.current = text;
        viz.analyze(text, topK);
    }, [viz.analyze]); // eslint-disable-line react-hooks/exhaustive-deps

    const nGramData = viz.data;
    const diagnostics = useMemo(() => nGramData?.visualization.diagnostics ?? null, [nGramData]);
    const training = useMemo(() => nGramData?.visualization.training ?? null, [nGramData]);
    const displayedFinalLoss = useMemo(
        () => training?.final_train_loss ?? training?.final_loss ?? undefined,
        [training]
    );
    const displayedLossHistory = useMemo(
        () => training?.train_loss_history ?? training?.loss_history ?? undefined,
        [training]
    );
    const activeSlice = nGramData?.visualization.active_slice;
    const contextDistributions = nGramData?.visualization.context_distributions;
    const vocabForScalability = useMemo(
        () => diagnostics?.vocab_size ?? nGramData?.metadata.vocab_size ?? 96,
        [diagnostics, nGramData]
    );
    const fallbackCurrent = contextDistributions?.current;
    const fallbackSliceMatrix = useMemo(() =>
        fallbackCurrent?.probabilities
            ? {
                shape: [1, fallbackCurrent.probabilities.length],
                data: [fallbackCurrent.probabilities],
                row_labels: [fallbackCurrent.context || "current"],
                col_labels: fallbackCurrent.row_labels ?? Array.from({ length: fallbackCurrent.probabilities.length }, (_, i) => `#${i}`),
            }
            : null,
        [fallbackCurrent]
    );

    /* ───── Educational Mode: full narrative ───── */
    if (isEdu) {
        return (
            <LabShell>
                <NgramNarrative
                    contextSize={viz.contextSize}
                    vocabSize={vocabForScalability}
                />
            </LabShell>
        );
    }

    /* ═══════════════════════════════════════════
       FREE LAB MODE
       ═══════════════════════════════════════════ */

    const heroStats = diagnostics ? [
        {
            label: t("models.ngram.lab.hero.uniqueContexts"),
            value: training?.unique_contexts?.toLocaleString() ?? "?",
            icon: Activity,
            desc: t("models.ngram.hero.stats.uniqueContexts.desc"),
            color: "cyan",
        },
        {
            label: t("models.ngram.lab.hero.vocabulary"),
            value: diagnostics.vocab_size?.toString() ?? "?",
            icon: Database,
            desc: t("models.ngram.lab.hero.uniqueChars"),
            color: "blue",
        },
        {
            label: t("models.ngram.lab.hero.contextSpace"),
            value: diagnostics.estimated_context_space?.toLocaleString() ?? "?",
            icon: Hash,
            desc: `|V|^${diagnostics.context_size}`,
            color: "purple",
        },
        {
            label: t("models.ngram.lab.hero.trainingTokens"),
            value: training?.total_tokens != null ? `${(training.total_tokens / 1000).toFixed(1)}k` : "?",
            icon: FlaskConical,
            desc: t("models.ngram.lab.hero.totalTokensSeen"),
            color: "emerald",
        },
    ] : undefined;

    const hasLossHistory = training?.loss_history && training.loss_history.length > 1;
    const hasPerformanceData = nGramData?.metadata.inference_time_ms != null || !!nGramData?.metadata.device;

    const matrixDesc = viz.contextSize === 1
        ? t("models.ngram.lab.sections.transitionsDescN1")
        : `${t("models.ngram.lab.sections.transitionsDescNPlus")} "${activeSlice?.context_tokens?.join("") ?? "..."}"`;

    return (
        <LabShell>
            <div className="max-w-7xl mx-auto pb-24 relative">

                {/* HERO */}
                <ModelHero
                    title={t("models.ngram.lab.hero.title")}
                    description={t("models.ngram.lab.hero.description")}
                    customStats={heroStats}
                    showExplanationCta={false}
                />

                {/* Lab mode badge */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="max-w-6xl mx-auto px-6 mb-8 flex items-center gap-3"
                >
                    <Zap className="w-4 h-4 text-amber-400" />
                    <p className="text-xs uppercase tracking-[0.15em] text-amber-300/60 font-bold">
                        {t("models.ngram.lab.badge")}
                    </p>
                </motion.div>

                {/* Guided Experiments */}
                <GuidedExperiments />

                {/* ROW 1: Context Controller */}
                <div className="max-w-6xl mx-auto px-6 mb-4">
                    <ContextControl
                        value={viz.contextSize}
                        onChange={viz.setContextSize}
                        disabled={viz.loading}
                        min={1}
                    />
                </div>

                {/* Generation Battle — shown when contextSize < 5 */}
                {viz.contextSize < 5 && (
                    <div className="max-w-6xl mx-auto px-6 mb-4">
                        <NgramGenerationBattle
                            seeds={["the ", "I wa", "hello"]}
                            nValues={[1, 2, 3, 4]}
                            maxTokens={80}
                            temperature={0.8}
                            highlightedN={viz.contextSize}
                        />
                    </div>
                )}

                <FlowHint text={t("models.ngram.lab.flow.afterContext")} />

                {/* ROW 2: Transition Matrix + Sparsity / Comparison */}
                <div id="transition-matrix" className="max-w-6xl mx-auto px-6 mb-4 grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3">
                        <LabSection
                            icon={Eye}
                            title={t("models.ngram.lab.sections.transitions")}
                            description={matrixDesc}
                            accent="amber"
                        >
                            {viz.contextSize >= 5 ? (
                                <NgramFiveGramScale vocabSize={vocabForScalability} />
                            ) : viz.contextSize === 1 ? (
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`matrix-${viz.contextSize}`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <TransitionMatrix
                                            data={nGramData?.visualization.transition_matrix ?? null}
                                            accent="amber"
                                        />
                                    </motion.div>
                                </AnimatePresence>
                            ) : (
                                <NgramContextDrilldown
                                    contextSize={viz.contextSize}
                                    vocabSize={vocabForScalability}
                                />
                            )}
                        </LabSection>
                    </div>

                    <div className="lg:col-span-2 space-y-6" id="sparsity-comparison">
                        <LabSection
                            icon={BarChart3}
                            title={t("models.ngram.lab.sparsity.title")}
                            description={t("models.ngram.lab.sparsity.description")}
                            accent="red"
                        >
                            <NgramSparsityIndicator training={training} diagnostics={diagnostics} />
                        </LabSection>

                        <LabSection
                            icon={Layers}
                            title={t("models.ngram.lab.comparison.title")}
                            description={t("models.ngram.lab.comparison.description")}
                            accent="violet"
                        >
                            <NgramComparisonDashboard metrics={comparisonMetrics} currentN={viz.contextSize} />
                        </LabSection>
                    </div>
                </div>

                {/* ROW 3+4: Advanced Metrics (collapsed by default) */}
                {(hasPerformanceData || hasLossHistory) && (
                    <div className="max-w-6xl mx-auto px-6 mb-4">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 0.4 }}
                        >
                            <AdvancedMetricsCollapsible
                                hasPerformanceData={hasPerformanceData}
                                hasLossHistory={!!hasLossHistory}
                                nGramData={nGramData}
                                training={training}
                                contextSize={viz.contextSize}
                            />
                        </motion.div>
                    </div>
                )}

                {/* ROW 5: Inference + Stepwise + Generation (contextSize < 5 only) */}
                {viz.contextSize < 5 && (
                    <>
                        <FlowHint text={t("models.ngram.lab.flow.afterMatrix")} />
                        <div id="inference-console" className="max-w-6xl mx-auto px-6 mb-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <LabSection
                                    icon={Type}
                                    title={t("models.ngram.lab.sections.nextToken")}
                                    description={t("models.ngram.lab.sections.nextTokenDesc")}
                                    accent="amber"
                                >
                                    <InferenceConsole
                                        onAnalyze={handleAnalyze}
                                        predictions={nGramData?.predictions ?? null}
                                        inferenceMs={nGramData?.metadata.inference_time_ms}
                                        device={nGramData?.metadata.device}
                                        loading={viz.loading}
                                        error={viz.error}
                                    />
                                </LabSection>

                                <LabSection
                                    icon={Activity}
                                    title={t("models.ngram.lab.sections.stepwise")}
                                    description={t("models.ngram.lab.sections.stepwiseDesc")}
                                    accent="violet"
                                >
                                    <StepwisePrediction
                                        onPredict={stepwise.predict}
                                        steps={stepwise.data?.steps ?? null}
                                        finalPrediction={stepwise.data?.final_prediction ?? null}
                                        loading={stepwise.loading}
                                        error={stepwise.error}
                                    />
                                </LabSection>
                            </div>
                        </div>

                        <div id="generation-playground" className="max-w-6xl mx-auto px-6 mb-8">
                            <LabSection
                                icon={Sparkles}
                                title={t("models.ngram.lab.sections.generation")}
                                description={t("models.ngram.lab.sections.generationDesc")}
                                accent="amber"
                            >
                                <GenerationPlayground
                                    onGenerate={generation.generate}
                                    generatedText={generation.data?.generated_text ?? null}
                                    loading={generation.loading}
                                    error={generation.error}
                                />
                            </LabSection>
                        </div>
                    </>
                )}


                {/* Technical Explanation */}
                <NgramTechnicalExplanation
                    contextSize={viz.contextSize}
                    vocabSize={vocabForScalability}
                    totalTokens={training?.total_tokens ?? undefined}
                    uniqueContexts={training?.unique_contexts ?? undefined}
                    perplexity={training?.perplexity ?? undefined}
                    finalLoss={training?.final_loss ?? undefined}
                    corpusName={training?.corpus_name ?? diagnostics?.corpus_name ?? "Paul Graham Essays"}
                    smoothingAlpha={training?.smoothing_alpha ?? diagnostics?.smoothing_alpha ?? 1.0}
                />

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-16 border-t border-white/[0.05] pt-12 flex flex-col items-center gap-6"
                >
                    <p className="text-xs text-white/30 max-w-sm text-center leading-relaxed">
                        {t("ngramNarrative.endOfCounting.hookLine")}
                    </p>
                    <Link
                        href="/lab/neural-networks"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-300 hover:text-rose-200 text-sm font-semibold transition-colors"
                    >
                        {t("ngramNarrative.cta.neuralButton")}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <div className="flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest text-amber-300/15">
                        <FlaskConical className="h-3 w-3" />
                        {t("models.ngram.lab.footer")}
                    </div>
                </motion.div>
            </div>
        </LabShell>
    );
}

export default function NgramPage() {
    return <NgramPageContent />;
}
