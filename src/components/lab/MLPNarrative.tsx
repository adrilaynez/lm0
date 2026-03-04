"use client";

import { lazy, Suspense, useState } from "react";
import { useRouter } from "next/navigation";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowDown, Beaker, BookOpen, BrainCircuit, FlaskConical, Lightbulb } from "lucide-react";

import { ContinueToast } from "@/components/lab/ContinueToast";
import { FadeInView } from "@/components/lab/FadeInView";
import { Term } from "@/components/lab/GlossaryTooltip";
import { KeyTakeaway } from "@/components/lab/KeyTakeaway";
import { LazySection, SectionSkeleton } from "@/components/lab/LazySection";
import { ModeToggle } from "@/components/lab/ModeToggle";
import { SectionAnchor } from "@/components/lab/SectionAnchor";
import { SectionProgressBar } from "@/components/lab/SectionProgressBar";
import { useLabMode } from "@/context/LabModeContext";
import type { UseMLPGridReturn } from "@/hooks/useMLPGrid";
import { useProgressTracker } from "@/hooks/useProgressTracker";
import { useI18n } from "@/i18n/context";

/* ─── Lazy-loaded interactive visualizers ─── */
// §01 — The Input Problem
const OneHotVisualizer = lazy(() => import("@/components/lab/mlp/OneHotVisualizer").then(m => ({ default: m.OneHotVisualizer })));
const ContextConcatenationExplorer = lazy(() => import("@/components/lab/mlp/ContextConcatenationExplorer").then(m => ({ default: m.ContextConcatenationExplorer })));
const CharacterSimilarityBlindness = lazy(() => import("@/components/lab/mlp/CharacterSimilarityBlindness").then(m => ({ default: m.CharacterSimilarityBlindness })));
const TrainingRace4gramVsMLP = lazy(() => import("@/components/lab/mlp/TrainingRace4gramVsMLP").then(m => ({ default: m.TrainingRace4gramVsMLP })));
const EncodingProblemDemo = lazy(() => import("@/components/lab/mlp/EncodingProblemDemo").then(m => ({ default: m.EncodingProblemDemo })));
const TrigramEquivalenceDemo = lazy(() => import("@/components/lab/mlp/TrigramEquivalenceDemo").then(m => ({ default: m.TrigramEquivalenceDemo })));
const MLPNetworkDiagram = lazy(() => import("@/components/lab/mlp/MLPNetworkDiagram").then(m => ({ default: m.MLPNetworkDiagram })));
// §02 — The Representation Problem
const CharacterFeatureExplorer = lazy(() => import("@/components/lab/mlp/CharacterFeatureExplorer").then(m => ({ default: m.CharacterFeatureExplorer })));
const ManualEmbeddingBuilder = lazy(() => import("@/components/lab/mlp/ManualEmbeddingBuilder").then(m => ({ default: m.ManualEmbeddingBuilder })));
const EmbeddingLookupAnimator = lazy(() => import("@/components/lab/mlp/EmbeddingLookupAnimator").then(m => ({ default: m.EmbeddingLookupAnimator })));
const CompressionRatioCalculator = lazy(() => import("@/components/lab/mlp/CompressionRatioCalculator").then(m => ({ default: m.CompressionRatioCalculator })));
const EmbeddingTableBridge = lazy(() => import("@/components/lab/mlp/EmbeddingTableBridge").then(m => ({ default: m.EmbeddingTableBridge })));
// EmbeddingTrainingEvolution removed from §02 (kept in §03 as EmbeddingTrainingTimelapse)
const TripleModelRace = lazy(() => import("@/components/lab/mlp/TripleModelRace").then(m => ({ default: m.TripleModelRace })));
// §03 — The Monster's Brain
const EmbeddingTrainingTimelapse = lazy(() => import("@/components/lab/mlp/EmbeddingTrainingTimelapse").then(m => ({ default: m.EmbeddingTrainingTimelapse })));
const HiddenLayerXORDemo = lazy(() => import("@/components/lab/mlp/HiddenLayerXORDemo").then(m => ({ default: m.HiddenLayerXORDemo })));
const NeuronActivationExplorer = lazy(() => import("@/components/lab/mlp/NeuronActivationExplorer").then(m => ({ default: m.NeuronActivationExplorer })));
const DistanceConceptVisualizer = lazy(() => import("@/components/lab/mlp/DistanceConceptVisualizer").then(m => ({ default: m.DistanceConceptVisualizer })));
const EmbeddingPredictionChallenge = lazy(() => import("@/components/lab/mlp/EmbeddingPredictionChallenge").then(m => ({ default: m.EmbeddingPredictionChallenge })));
const EmbeddingDistanceCalculator = lazy(() => import("@/components/lab/mlp/EmbeddingDistanceCalculator").then(m => ({ default: m.EmbeddingDistanceCalculator })));
const EmbeddingArithmeticPlayground = lazy(() => import("@/components/lab/mlp/EmbeddingArithmeticPlayground").then(m => ({ default: m.EmbeddingArithmeticPlayground })));
const EmbeddingQualityComparison = lazy(() => import("@/components/lab/mlp/EmbeddingQualityComparison").then(m => ({ default: m.EmbeddingQualityComparison })));
const CharacterFeatureScoring = lazy(() => import("@/components/lab/mlp/CharacterFeatureScoring").then(m => ({ default: m.CharacterFeatureScoring })));
// §03 uses (moved from old §04)
const MLPForwardPassAnimator = lazy(() => import("@/components/lab/mlp/MLPForwardPassAnimator").then(m => ({ default: m.MLPForwardPassAnimator })));
const SingleExampleTrainer = lazy(() => import("@/components/lab/mlp/SingleExampleTrainer").then(m => ({ default: m.SingleExampleTrainer })));
const MLPLivePredictor = lazy(() => import("@/components/lab/mlp/MLPLivePredictor").then(m => ({ default: m.MLPLivePredictor })));
const MLPPipelineVisualizer = lazy(() => import("@/components/lab/mlp/MLPPipelineVisualizer").then(m => ({ default: m.MLPPipelineVisualizer })));
// §04 — Can We Make It Bigger?
const RealDepthComparisonTrainer = lazy(() => import("@/components/lab/mlp/RealDepthComparisonTrainer").then(m => ({ default: m.RealDepthComparisonTrainer })));
const ActivationHistogramVisualizer = lazy(() => import("@/components/lab/mlp/ActivationHistogramVisualizer").then(m => ({ default: m.ActivationHistogramVisualizer })));
const TanhSaturationDemo = lazy(() => import("@/components/lab/mlp/TanhSaturationDemo").then(m => ({ default: m.TanhSaturationDemo })));
const DeadLayerCascadeVisualizer = lazy(() => import("@/components/lab/mlp/DeadLayerCascadeVisualizer").then(m => ({ default: m.DeadLayerCascadeVisualizer })));
// §05 — Why Deep Breaks (gradient diagnosis)
const WorseThanRandomVisualizer = lazy(() => import("@/components/lab/mlp/WorseThanRandomVisualizer").then(m => ({ default: m.WorseThanRandomVisualizer })));
const GaussianDistributionExplorer = lazy(() => import("@/components/lab/mlp/GaussianDistributionExplorer").then(m => ({ default: m.GaussianDistributionExplorer })));
const InitializationSensitivityVisualizer = lazy(() => import("@/components/lab/mlp/InitializationSensitivityVisualizer").then(m => ({ default: m.InitializationSensitivityVisualizer })));
const BackpropVanishingCalculator = lazy(() => import("@/components/lab/mlp/BackpropVanishingCalculator").then(m => ({ default: m.BackpropVanishingCalculator })));
const GradientFlowVisualizer = lazy(() => import("@/components/lab/mlp/GradientFlowVisualizer").then(m => ({ default: m.GradientFlowVisualizer })));
const KaimingScalingVisualizer = lazy(() => import("@/components/lab/mlp/KaimingScalingVisualizer").then(m => ({ default: m.KaimingScalingVisualizer })));
const InitializationComparisonTrainer = lazy(() => import("@/components/lab/mlp/InitializationComparisonTrainer").then(m => ({ default: m.InitializationComparisonTrainer })));
const ActivationDriftVisualizer = lazy(() => import("@/components/lab/mlp/ActivationDriftVisualizer").then(m => ({ default: m.ActivationDriftVisualizer })));
const BatchNormEffectVisualizer = lazy(() => import("@/components/lab/mlp/BatchNormEffectVisualizer").then(m => ({ default: m.BatchNormEffectVisualizer })));
const BatchNormStepByStep = lazy(() => import("@/components/lab/mlp/BatchNormStepByStep").then(m => ({ default: m.BatchNormStepByStep })));
const NormComparisonDiagram = lazy(() => import("@/components/lab/mlp/NormComparisonDiagram").then(m => ({ default: m.NormComparisonDiagram })));
const ResidualGradientHighway = lazy(() => import("@/components/lab/mlp/ResidualGradientHighway").then(m => ({ default: m.ResidualGradientHighway })));
const ResidualHighwayVisual = lazy(() => import("@/components/lab/mlp/ResidualHighwayVisual").then(m => ({ default: m.ResidualHighwayVisual })));
const ResidualGradientComparison = lazy(() => import("@/components/lab/mlp/ResidualGradientComparison").then(m => ({ default: m.ResidualGradientComparison })));
const DeepModelRedemptionDemo = lazy(() => import("@/components/lab/mlp/DeepModelRedemptionDemo").then(m => ({ default: m.DeepModelRedemptionDemo })));
// §07 — The Perfect Recipe
const EmbeddingDimensionComparison = lazy(() => import("@/components/lab/mlp/EmbeddingDimensionComparison").then(m => ({ default: m.EmbeddingDimensionComparison })));
const HiddenSizeExplorer = lazy(() => import("@/components/lab/mlp/HiddenSizeExplorer").then(m => ({ default: m.HiddenSizeExplorer })));
const LearningRateScheduleExplorer = lazy(() => import("@/components/lab/mlp/LearningRateScheduleExplorer").then(m => ({ default: m.LearningRateScheduleExplorer })));
const MLPHyperparameterExplorer = lazy(() => import("@/components/lab/mlp/MLPHyperparameterExplorer").then(m => ({ default: m.MLPHyperparameterExplorer })));
const OverfittingDetectiveChallenge = lazy(() => import("@/components/lab/mlp/OverfittingDetectiveChallenge").then(m => ({ default: m.OverfittingDetectiveChallenge })));
const SoftmaxTemperatureVisualizer = lazy(() => import("@/components/lab/mlp/SoftmaxTemperatureVisualizer").then(m => ({ default: m.SoftmaxTemperatureVisualizer })));
const DropoutVisualizer = lazy(() => import("@/components/lab/mlp/DropoutVisualizer").then(m => ({ default: m.DropoutVisualizer })));
// §07b — Experiment Visualizers (from training grids)
const ContextWindowExperiment = lazy(() => import("@/components/lab/mlp/ContextWindowExperiment").then(m => ({ default: m.ContextWindowExperiment })));
const StabilityTechniqueGrid = lazy(() => import("@/components/lab/mlp/StabilityTechniqueGrid").then(m => ({ default: m.StabilityTechniqueGrid })));
const EmbeddingDimVsLoss = lazy(() => import("@/components/lab/mlp/EmbeddingDimVsLoss").then(m => ({ default: m.EmbeddingDimVsLoss })));
const TrainingProgressRace = lazy(() => import("@/components/lab/mlp/TrainingProgressRace").then(m => ({ default: m.TrainingProgressRace })));
// §08 — Limitations
const BigModelLimitationViz = lazy(() => import("@/components/lab/mlp/BigModelLimitationViz").then(m => ({ default: m.BigModelLimitationViz })));
const ContextMeaningDemo = lazy(() => import("@/components/lab/mlp/ContextMeaningDemo").then(m => ({ default: m.ContextMeaningDemo })));
const MLPLimitationPlayground = lazy(() => import("@/components/lab/mlp/MLPLimitationPlayground").then(m => ({ default: m.MLPLimitationPlayground })));
const ContextWindowVisualizer = lazy(() => import("@/components/lab/mlp/ContextWindowVisualizer").then(m => ({ default: m.ContextWindowVisualizer })));
const PositionSensitivityVisualizer = lazy(() => import("@/components/lab/mlp/PositionSensitivityVisualizer").then(m => ({ default: m.PositionSensitivityVisualizer })));
const LongRangeDependencyDemo = lazy(() => import("@/components/lab/mlp/LongRangeDependencyDemo").then(m => ({ default: m.LongRangeDependencyDemo })));
const ConcatenationBottleneckVisualizer = lazy(() => import("@/components/lab/mlp/ConcatenationBottleneckVisualizer").then(m => ({ default: m.ConcatenationBottleneckVisualizer })));
const ArchitectureWishlistBuilder = lazy(() => import("@/components/lab/mlp/ArchitectureWishlistBuilder").then(m => ({ default: m.ArchitectureWishlistBuilder })));
// §08 — Limitations + Finale (ModelEvolutionComparison & GenerationGallery absorbed from old §09)
const ModelEvolutionComparison = lazy(() => import("@/components/lab/mlp/ModelEvolutionComparison").then(m => ({ default: m.ModelEvolutionComparison })));
const GenerationGallery = lazy(() => import("@/components/lab/mlp/GenerationGallery").then(m => ({ default: m.GenerationGallery })));
// HistoricalTimelineSidebar removed from §03 (moved to optional)

import {
    Callout as _Callout,
    FormulaBlock as _FormulaBlock,
    Heading, Highlight as _Highlight,
    type HighlightColor,
    Lead, type NarrativeAccent,
    P, PullQuote as _PullQuote,
    Section, SectionBreak,
    SectionLabel as _SectionLabel,
} from "./narrative-primitives";

/* ─── Accent-bound wrappers ─── */
const NA: NarrativeAccent = "violet";
const SectionLabel = (p: { number: string; label: string }) => <_SectionLabel accent={NA} {...p} />;
const Highlight = ({ color, ...p }: { children: React.ReactNode; color?: HighlightColor; tooltip?: string }) => <_Highlight color={color ?? NA} {...p} />;
const Callout = ({ accent, ...p }: Parameters<typeof _Callout>[0]) => <_Callout accent={accent ?? NA} {...p} />;
const FormulaBlock = (p: { formula: string; caption: string }) => <_FormulaBlock accent={NA} {...p} />;
const PullQuote = (p: { children: React.ReactNode }) => <_PullQuote accent={NA} {...p} />;

/* ─── Monster status banner helper ─── */
const MonsterStatus = ({ children, gradient = "violet-purple" }: { children: React.ReactNode; gradient?: "violet-purple" | "violet-emerald" | "emerald-violet" }) => {
    const gradientClass = gradient === "violet-emerald"
        ? "from-violet-400 to-emerald-400"
        : gradient === "emerald-violet"
            ? "from-emerald-400 via-violet-400 to-emerald-400"
            : "from-violet-300 via-purple-200 to-violet-300";

    return (
        <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className={`text-center text-lg md:text-xl font-bold bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent py-4`}
        >
            {children}
        </motion.p>
    );
};

/* ─── Monster interlude helper ─── */
const MonsterInterlude = ({ children }: { children: React.ReactNode }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center py-8 my-4"
    >
        <span className="text-2xl mb-3 block" aria-hidden>👾</span>
        <p className="text-sm md:text-base italic bg-gradient-to-r from-violet-400/80 via-purple-300/80 to-violet-400/80 bg-clip-text text-transparent max-w-lg mx-auto leading-relaxed">
            {children}
        </p>
    </motion.div>
);

export interface MLPNarrativeProps {
    mlpGrid: UseMLPGridReturn;
}

/* ─── MLP-specific local components ─── */

type PanelCategory = "math" | "experiment" | "deepdive" | "challenge";

const PANEL_CATEGORY_META: Record<PanelCategory, { emoji: string; gradient: string; border: string; hoverBorder: string }> = {
    math: { emoji: "🔢", gradient: "from-violet-500/10 via-transparent to-transparent", border: "border-violet-500/20", hoverBorder: "hover:border-violet-400/40" },
    experiment: { emoji: "🧪", gradient: "from-emerald-500/10 via-transparent to-transparent", border: "border-emerald-500/20", hoverBorder: "hover:border-emerald-400/40" },
    deepdive: { emoji: "📊", gradient: "from-blue-500/10 via-transparent to-transparent", border: "border-blue-500/20", hoverBorder: "hover:border-blue-400/40" },
    challenge: { emoji: "🎯", gradient: "from-amber-500/10 via-transparent to-transparent", border: "border-amber-500/20", hoverBorder: "hover:border-amber-400/40" },
};

function TrainingChallengePanel({ title, preview, category = "math", difficulty = 1, defaultOpen = false, children }: { title: string; preview: string; category?: PanelCategory; difficulty?: 1 | 2 | 3; defaultOpen?: boolean; children: React.ReactNode }) {
    const [open, setOpen] = useState(defaultOpen);
    const meta = PANEL_CATEGORY_META[category];
    return (
        <FadeInView margin="-40px" className={`my-6 rounded-xl border bg-gradient-to-r ${meta.gradient} bg-[var(--lab-card)] overflow-hidden transition-colors ${meta.border} ${meta.hoverBorder}`}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full p-4 sm:p-5 text-left transition-colors"
                aria-expanded={open}
            >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-lg mt-0.5 shrink-0" aria-hidden>{meta.emoji}</span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-mono font-bold text-violet-300">{title}</h4>
                            <span className="flex gap-0.5 shrink-0" aria-label={`Difficulty ${difficulty} of 3`}>
                                {[1, 2, 3].map(d => (
                                    <span key={d} className={`w-1.5 h-1.5 rounded-full ${d <= difficulty ? "bg-violet-400/70" : "bg-white/10"}`} />
                                ))}
                            </span>
                        </div>
                        <p className="text-xs text-[var(--lab-text-subtle)] leading-relaxed">{preview}</p>
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-3 shrink-0"
                >
                    <ArrowDown className="w-4 h-4 text-[var(--lab-text-subtle)]" />
                </motion.div>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-[var(--lab-border)]">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </FadeInView>
    );
}

function FigureWrapper({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <FadeInView as="figure" className="my-12 md:my-16 -mx-4 sm:mx-0">
            <div className="rounded-2xl border border-[var(--lab-border)] bg-[var(--lab-card)] overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--lab-border)] bg-[var(--lab-card)]">
                    <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--lab-text-subtle)]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--lab-border)]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-violet-400/40" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--lab-text-subtle)]">
                        {label}
                    </span>
                </div>
                <div className="p-4 sm:p-6 bg-[var(--lab-viz-bg)]">{children}</div>
            </div>
            {hint && (
                <figcaption className="mt-3 text-center text-xs text-[var(--lab-text-subtle)] italic">
                    {hint}
                </figcaption>
            )}
        </FadeInView>
    );
}

/* ─────────────────────────────────────────────
   Main narrative component
   ───────────────────────────────────────────── */

export function MLPNarrative({ mlpGrid }: MLPNarrativeProps) {
    const router = useRouter();
    const { setMode } = useLabMode();
    const { t } = useI18n();
    const { hasStoredProgress, storedSection, clearProgress } = useProgressTracker("mlp");

    return (
        <article className="max-w-[920px] mx-auto px-6 pt-8 pb-24">
            <ContinueToast
                accent="violet"
                hasStoredProgress={hasStoredProgress}
                storedSection={storedSection}
                clearProgress={clearProgress}
                sectionNames={{
                    "mlp-01": "Meet the Monster",
                    "mlp-02": "Teaching It to See",
                    "mlp-03": "Inside the Brain",
                    "mlp-04": "Going Big",
                    "mlp-05": "When It Breaks",
                    "mlp-06": "Taming the Beast",
                    "mlp-07": "The Perfect Recipe",
                    "mlp-08": "The Monster That Can't See",
                }}
            />
            <SectionProgressBar
                sections={[
                    { id: "mlp-01", label: "01", name: "Monster" },
                    { id: "mlp-02", label: "02", name: "Seeing" },
                    { id: "mlp-03", label: "03", name: "Brain" },
                    { id: "mlp-04", label: "04", name: "Big" },
                    { id: "mlp-05", label: "05", name: "Breaking" },
                    { id: "mlp-06", label: "06", name: "Taming" },
                    { id: "mlp-07", label: "07", name: "Recipe" },
                    { id: "mlp-08", label: "08", name: "Can't See" },
                ]}
                accent="violet"
            />

            {/* ───────────────────── HERO ───────────────────── */}
            <header className="text-center mb-24 md:mb-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    <span className="inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-violet-400/60 mb-6">
                        <BookOpen className="w-3.5 h-3.5" />
                        {t("models.mlp.narrative.hero.eyebrow")}
                    </span>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[var(--lab-text)] mb-6">
                        {t("models.mlp.narrative.hero.titlePrefix")}{" "}
                        <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-violet-400 bg-clip-text text-transparent">
                            {t("models.mlp.narrative.hero.titleHighlight")}
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-[var(--lab-text-subtle)] max-w-xl mx-auto leading-relaxed mb-12">
                        {t("models.mlp.narrative.hero.description")}
                    </p>

                    <p className="text-[11px] font-mono text-[var(--lab-text-subtle)] mb-8">
                        {t("models.mlp.narrative.hero.readTime")}
                    </p>

                    <div className="flex justify-center mb-14">
                        <ModeToggle />
                    </div>

                    <motion.div
                        animate={{ y: [0, 6, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        className="text-[var(--lab-border)]"
                    >
                        <ArrowDown className="w-5 h-5 mx-auto" />
                    </motion.div>
                </motion.div>
            </header>

            {/* ─────────── 01 · MEET THE MONSTER ─────────── */}
            <Section id="mlp-01">
                <SectionLabel number={t("models.mlp.narrative.sections.s01.number")} label={t("models.mlp.narrative.sections.s01.label")} />
                <SectionAnchor id="mlp-01"><Heading>{t("models.mlp.narrative.s01.heading")}</Heading></SectionAnchor>
                <Lead>{t("models.mlp.narrative.s01.lead")}</Lead>

                {/* ── PART A: What IS an MLP? — Monster intro ── */}
                <P>{t("models.mlp.narrative.s01.pMonsterIntro")}</P>
                <P>{t("models.mlp.narrative.s01.pMlpNameBreakdown")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s01.archLabel")} hint={t("models.mlp.narrative.s01.archHint")}>
                        <Suspense fallback={<SectionSkeleton />}><MLPNetworkDiagram /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── PART B: How to encode input — "Can we beat it?" ── */}
                <P>{t("models.mlp.narrative.s01.pCanWeBeat")}</P>
                <P>{t("models.mlp.narrative.s01.pEncodingIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s01.figLabelEncoding")} hint={t("models.mlp.narrative.s01.figHintEncoding")}>
                        <Suspense fallback={<SectionSkeleton />}><EncodingProblemDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s01.pOneHotSolution")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s01.figLabelOneHot")} hint={t("models.mlp.narrative.s01.figHintOneHot")}>
                        <Suspense fallback={<SectionSkeleton />}><OneHotVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s01.pConcatIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s01.figLabel1")} hint={t("models.mlp.narrative.s01.figHint1")}>
                        <Suspense fallback={<SectionSkeleton />}><ContextConcatenationExplorer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── PART C: One training step — see it work ── */}
                <P>{t("models.mlp.narrative.s01.pTrainingStepBridge")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s01.figLabelTrainStep")} hint={t("models.mlp.narrative.s01.figHintTrainStep")}>
                        <Suspense fallback={<SectionSkeleton />}><SingleExampleTrainer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── PART D: Training Race — 4-gram vs MLP ── */}
                <P>{t("models.mlp.narrative.s01.pRacePredict")}</P>
                <P>{t("models.mlp.narrative.s01.pRaceIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s01.figLabelRace")} hint={t("models.mlp.narrative.s01.figHintRace")}>
                        <Suspense fallback={<SectionSkeleton />}><TrainingRace4gramVsMLP /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── PART E: Shock reaction + dual diagnosis ── */}
                <P>{t("models.mlp.narrative.s01.pShockReaction")}</P>
                <P>{t("models.mlp.narrative.s01.pDualDiagnosis")}</P>
                <P>{t("models.mlp.narrative.s01.pTameFraming")}</P>

                {/* ── The blindness problem — technical detail ── */}
                <P>{t("models.mlp.narrative.s01.pBlindness")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s01.figLabel2")} hint={t("models.mlp.narrative.s01.figHint2")}>
                        <Suspense fallback={<SectionSkeleton />}><CharacterSimilarityBlindness /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Monster status + closing ── */}
                <MonsterStatus>{t("models.mlp.narrative.s01.pMonsterStatus")}</MonsterStatus>

                <PullQuote>{t("models.mlp.narrative.s01.narratorMoment")}</PullQuote>
            </Section>

            <SectionBreak />
            <MonsterInterlude>{t("models.mlp.narrative.monsterInterludes.after01")}</MonsterInterlude>

            {/* ─────────── 02 · THE REPRESENTATION PROBLEM ─────────── */}
            <Section id="mlp-02">
                <SectionLabel number={t("models.mlp.narrative.sections.s02.number")} label={t("models.mlp.narrative.sections.s02.label")} />
                <SectionAnchor id="mlp-02"><Heading>{t("models.mlp.narrative.s02.heading")}</Heading></SectionAnchor>
                <Lead>{t("models.mlp.narrative.s02.lead")}</Lead>

                <P>{t("models.mlp.narrative.s02.p1")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s02.figLabel1")} hint={t("models.mlp.narrative.s02.figHint1")}>
                        <Suspense fallback={<SectionSkeleton />}><CharacterFeatureExplorer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s02.pFeatureScoringBridge")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s02.figLabelScoring")} hint={t("models.mlp.narrative.s02.figHintScoring")}>
                        <Suspense fallback={<SectionSkeleton />}><CharacterFeatureScoring /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>
                    {t("models.mlp.narrative.s02.p2")}{" "}
                    <Highlight>{t("models.mlp.narrative.s02.p2H1")}</Highlight>
                    {t("models.mlp.narrative.s02.p2End")}
                </P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s02.figLabel2")} hint={t("models.mlp.narrative.s02.figHint2")}>
                        <Suspense fallback={<SectionSkeleton />}><ManualEmbeddingBuilder /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s02.pEmbDimBridge")}</P>

                <P>
                    {t("models.mlp.narrative.s02.p3")}{" "}
                    <Highlight color="emerald">{t("models.mlp.narrative.s02.p3H1")}</Highlight>
                    {t("models.mlp.narrative.s02.p3End")}
                </P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s02.figLabelTable")} hint={t("models.mlp.narrative.s02.figHintTable")}>
                        <Suspense fallback={<SectionSkeleton />}><EmbeddingTableBridge /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s02.figLabel3")} hint={t("models.mlp.narrative.s02.figHint3")}>
                        <Suspense fallback={<SectionSkeleton />}><EmbeddingLookupAnimator /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s02.pRowBridge")}</P>

                <TrainingChallengePanel
                    title={t("models.mlp.narrative.s02.panelFormulaTitle")}
                    preview={t("models.mlp.narrative.s02.panelFormulaPreview")}
                    category="math"
                    difficulty={2}
                >
                    <FormulaBlock
                        formula="e_t = E[t] = E^\top \cdot \text{onehot}(t) \in \mathbb{R}^D"
                        caption={t("models.mlp.narrative.s02.formulaCaption")}
                    />
                </TrainingChallengePanel>

                <P>
                    {t("models.mlp.narrative.s02.p4")}{" "}
                    <Highlight color="emerald">{t("models.mlp.narrative.s02.p4H1")}</Highlight>
                    {t("models.mlp.narrative.s02.p4End")}
                </P>

                <TrainingChallengePanel
                    title={t("models.mlp.narrative.s02.panelCompressionTitle")}
                    preview={t("models.mlp.narrative.s02.panelCompressionPreview")}
                    category="math"
                    difficulty={2}
                >
                    <FigureWrapper label={t("models.mlp.narrative.s02.figLabel4")} hint={t("models.mlp.narrative.s02.figHint4")}>
                        <Suspense fallback={<SectionSkeleton />}><CompressionRatioCalculator /></Suspense>
                    </FigureWrapper>
                </TrainingChallengePanel>

                <Callout icon={Lightbulb} accent="emerald" title={t("models.mlp.narrative.s02.calloutTitle")}>
                    <p>{t("models.mlp.narrative.s02.calloutText")}</p>
                </Callout>

                <P>{t("models.mlp.narrative.s02.pLearnedMeaning")}</P>

                {/* ── Triple Model Race — prove embeddings matter ── */}
                <P>{t("models.mlp.narrative.s02.pCanWeTrainPerfect")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s02.figLabelTriple")} hint={t("models.mlp.narrative.s02.figHintTriple")}>
                        <Suspense fallback={<SectionSkeleton />}><TripleModelRace /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s02.pTripleResult")}</P>

                {/* ── Live predictor — see it generate text ── */}
                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s02.figLabelLive")} hint={t("models.mlp.narrative.s02.figHintLive")}>
                        <Suspense fallback={<SectionSkeleton />}><MLPLivePredictor /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Monster status — transition to §03 ── */}
                <MonsterStatus gradient="violet-emerald">{t("models.mlp.narrative.s02.pMonsterStatus")}</MonsterStatus>

                <KeyTakeaway accent="violet">
                    {t("models.mlp.narrative.s02.takeaway")}
                </KeyTakeaway>
            </Section>

            <SectionBreak />
            <MonsterInterlude>{t("models.mlp.narrative.monsterInterludes.after02")}</MonsterInterlude>

            {/* ─────────── 03 · THE MONSTER'S BRAIN ─────────── */}
            <Section id="mlp-03">
                <SectionLabel number={t("models.mlp.narrative.sections.s03.number")} label={t("models.mlp.narrative.sections.s03.label")} />
                <SectionAnchor id="mlp-03"><Heading>{t("models.mlp.narrative.s03.heading")}</Heading></SectionAnchor>
                <Lead>{t("models.mlp.narrative.s03.lead")}</Lead>

                {/* ── PART A: Forward Pass ── */}
                <P>{t("models.mlp.narrative.s03.p1")}</P>
                <P>{t("models.mlp.narrative.s03.pForwardPassIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s03.figLabelForwardPass")} hint={t("models.mlp.narrative.s03.figHintForwardPass")}>
                        <Suspense fallback={<SectionSkeleton />}><MLPForwardPassAnimator /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── PART B: Full pipeline ── */}
                <P>{t("models.mlp.narrative.s03.pPipelineIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s03.figLabelPipeline")} hint={t("models.mlp.narrative.s03.figHintPipeline")}>
                        <Suspense fallback={<SectionSkeleton />}><MLPPipelineVisualizer selectedConfig={mlpGrid.selectedConfig} /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── PART C: WHY hidden layers? — XOR discovery ── */}
                <P>{t("models.mlp.narrative.s03.pWhyHiddenIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s03.figLabelXOR")} hint={t("models.mlp.narrative.s03.figHintXOR")}>
                        <Suspense fallback={<SectionSkeleton />}><HiddenLayerXORDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s03.pXORInsight")}</P>

                {/* ── PART D: What each neuron detects ── */}
                <P>{t("models.mlp.narrative.s03.pNeuronExplorerIntro")}</P>
                <P>{t("models.mlp.narrative.s03.pHiddenLayerSecret")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s03.figLabelNeurons")} hint={t("models.mlp.narrative.s03.figHintNeurons")}>
                        <Suspense fallback={<SectionSkeleton />}><NeuronActivationExplorer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s03.pNeuronInsight")}</P>

                {/* ── PART E: Trigram proof — thinking vs counting ── */}
                <P>{t("models.mlp.narrative.s03.pTrigramBridge")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s03.figLabelTrigram")} hint={t("models.mlp.narrative.s03.figHintTrigram")}>
                        <Suspense fallback={<SectionSkeleton />}><TrigramEquivalenceDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── PART F: Embedding evolution — training discovers clusters ── */}
                <P>{t("models.mlp.narrative.s03.pEmbEvolutionIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s03.figLabel1")} hint={t("models.mlp.narrative.s03.figHint1")}>
                        <Suspense fallback={<SectionSkeleton />}><EmbeddingTrainingTimelapse /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── PART G: Prediction challenge ── */}
                <P>{t("models.mlp.narrative.s03.pPredictionIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s03.figLabelPrediction")} hint={t("models.mlp.narrative.s03.figHintPrediction")}>
                        <Suspense fallback={<SectionSkeleton />}><EmbeddingPredictionChallenge /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Panel: Embedding Arithmetic ── */}
                <TrainingChallengePanel
                    title={t("models.mlp.narrative.s03.panelArithmeticTitle")}
                    preview={t("models.mlp.narrative.s03.panelArithmeticPreview")}
                    category="deepdive"
                    difficulty={2}
                >
                    <P>{t("models.mlp.narrative.s03.pArithmeticBridge")}</P>
                    <P>{t("models.mlp.narrative.s03.p5")}</P>
                    <Suspense fallback={<SectionSkeleton />}><EmbeddingArithmeticPlayground /></Suspense>
                </TrainingChallengePanel>

                {/* ── PART H: Embedding Quality Comparison (unhidden) ── */}
                <P>{t("models.mlp.narrative.s03.pQualityBridge")}</P>
                <P>{t("models.mlp.narrative.s03.p6")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s03.figLabel6")} hint={t("models.mlp.narrative.s03.figHint6")}>
                        <Suspense fallback={<SectionSkeleton />}><EmbeddingQualityComparison /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Panel: Distance Concepts + Calculator (merged) ── */}
                <TrainingChallengePanel
                    title={t("models.mlp.narrative.s03.panelDistanceTitle")}
                    preview={t("models.mlp.narrative.s03.panelDistancePreview")}
                    category="deepdive"
                    difficulty={2}
                >
                    <P>{t("models.mlp.narrative.s03.pDistanceConceptIntro")}</P>
                    <Suspense fallback={<SectionSkeleton />}><DistanceConceptVisualizer /></Suspense>
                    <P>
                        {t("models.mlp.narrative.s03.p3")}{" "}
                        <Highlight>{t("models.mlp.narrative.s03.p3H1")}</Highlight>
                        {t("models.mlp.narrative.s03.p3Mid")}{" "}
                        <Highlight color="emerald">{t("models.mlp.narrative.s03.p3H2")}</Highlight>
                        {t("models.mlp.narrative.s03.p3End")}
                    </P>
                    <Suspense fallback={<SectionSkeleton />}><EmbeddingDistanceCalculator /></Suspense>
                </TrainingChallengePanel>

                {/* ── ChatGPT Checkpoint ── */}
                <Callout icon={BrainCircuit} accent="emerald" title={t("models.mlp.narrative.s03.pChatGPTCheck1")}>
                    <p>{t("models.mlp.narrative.s03.chatGPTCheck1Sub")}</p>
                </Callout>
            </Section>

            <SectionBreak />
            <MonsterInterlude>{t("models.mlp.narrative.monsterInterludes.after03")}</MonsterInterlude>

            {/* ─────────── 04 · CAN WE MAKE IT BIGGER? ─────────── */}
            <Section id="mlp-04">
                <SectionLabel number={t("models.mlp.narrative.sections.s04.number")} label={t("models.mlp.narrative.sections.s04.label")} />
                <SectionAnchor id="mlp-04"><Heading>{t("models.mlp.narrative.s04.heading")}</Heading></SectionAnchor>
                <Lead>{t("models.mlp.narrative.s04.lead")}</Lead>

                {/* ── PART A: Hope — let's add layers ── */}
                <P>{t("models.mlp.narrative.s04.pHopeIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s04.figLabelDepth")} hint={t("models.mlp.narrative.s04.figHintDepth")}>
                        <Suspense fallback={<SectionSkeleton />}><RealDepthComparisonTrainer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── PART B: Celebration then shock ── */}
                <P>{t("models.mlp.narrative.s04.pCelebration")}</P>
                <P>{t("models.mlp.narrative.s04.pShock")}</P>

                {/* ── PART C: Investigation — tanh saturation ── */}
                <P>{t("models.mlp.narrative.s04.pInvestigationIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s04.figLabelTanh")} hint={t("models.mlp.narrative.s04.figHintTanh")}>
                        <Suspense fallback={<SectionSkeleton />}><TanhSaturationDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── PART D: Activation histograms ── */}
                <P>
                    {t("models.mlp.narrative.s04.pHistogramBridge")}{" "}
                    <Highlight color="amber">{t("models.mlp.narrative.s04.pHistogramH1")}</Highlight>
                    {t("models.mlp.narrative.s04.pHistogramEnd")}
                </P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s04.figLabelHistogram")} hint={t("models.mlp.narrative.s04.figHintHistogram")}>
                        <Suspense fallback={<SectionSkeleton />}><ActivationHistogramVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── PART E: Dead layer cascade ── */}
                <P>{t("models.mlp.narrative.s04.pDeadNeuronsBridge")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s04.figLabelCascade")} hint={t("models.mlp.narrative.s04.figHintCascade")}>
                        <Suspense fallback={<SectionSkeleton />}><DeadLayerCascadeVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── End bridge ── */}
                <P>{t("models.mlp.narrative.s04.pEndBridge")}</P>
            </Section>

            <SectionBreak />
            <MonsterInterlude>{t("models.mlp.narrative.monsterInterludes.after04")}</MonsterInterlude>

            {/* ─────────── 05 · WHY DEEP BREAKS ─────────── */}
            <Section id="mlp-05">
                <SectionLabel number={t("models.mlp.narrative.sections.s05.number")} label={t("models.mlp.narrative.sections.s05.label")} />
                <SectionAnchor id="mlp-05"><Heading>{t("models.mlp.narrative.s05.heading")}</Heading></SectionAnchor>
                <Lead>{t("models.mlp.narrative.s05.lead")}</Lead>

                {/* ── PART A: Worse than random — devastating opener ── */}
                <P>{t("models.mlp.narrative.s05.pWorseThanRandom")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s05.figLabelWorse")} hint={t("models.mlp.narrative.s05.figHintWorse")}>
                        <Suspense fallback={<SectionSkeleton />}><WorseThanRandomVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── PART B: Gaussian distribution ── */}
                <P>{t("models.mlp.narrative.s05.pGaussianIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s05.figLabelGaussian")} hint={t("models.mlp.narrative.s05.figHintGaussian")}>
                        <Suspense fallback={<SectionSkeleton />}><GaussianDistributionExplorer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── PART C: Initialization sensitivity ── */}
                <P>{t("models.mlp.narrative.s05.pInitBad")}</P>
                <P>{t("models.mlp.narrative.s05.p1")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s05.figLabel1")} hint={t("models.mlp.narrative.s05.figHint1")}>
                        <Suspense fallback={<SectionSkeleton />}><InitializationSensitivityVisualizer timeline={mlpGrid.timeline} /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── PART D: Gradient chain ── */}
                <P>{t("models.mlp.narrative.s05.pGradientBridge")}</P>
                <P>{t("models.mlp.narrative.s05.pBackpropExplain")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s05.figLabelBackprop")} hint={t("models.mlp.narrative.s05.figHintBackprop")}>
                        <Suspense fallback={<SectionSkeleton />}><BackpropVanishingCalculator /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── PART E: Gradient flow — real model data ── */}
                <P>{t("models.mlp.narrative.s05.pGradientFlowIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s05.figLabel4")} hint={t("models.mlp.narrative.s05.figHint4")}>
                        <Suspense fallback={<SectionSkeleton />}><GradientFlowVisualizer timeline={mlpGrid.timeline} /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Human story + solutions bridge ── */}
                <P>{t("models.mlp.narrative.s05.pHumanStory")}</P>
                <P>{t("models.mlp.narrative.s05.pSolutionsBridge")}</P>
            </Section>

            <SectionBreak />
            <MonsterInterlude>{t("models.mlp.narrative.monsterInterludes.after05")}</MonsterInterlude>

            {/* ─────────── 06 · TAMING THE MONSTER ─────────── */}
            <Section id="mlp-06">
                <SectionLabel number={t("models.mlp.narrative.sections.s06.number")} label={t("models.mlp.narrative.sections.s06.label")} />
                <SectionAnchor id="mlp-06"><Heading>{t("models.mlp.narrative.s06.heading")}</Heading></SectionAnchor>
                <Lead>{t("models.mlp.narrative.s06.lead")}</Lead>

                <P>{t("models.mlp.narrative.s06.pSolutionsIntro")}</P>

                {/* ══════════ Solution 1: Kaiming Initialization ══════════ */}
                <P>{t("models.mlp.narrative.s06.discoveryInit")}</P>
                <P>{t("models.mlp.narrative.s06.pKaimingDerivation")}</P>
                <P>{t("models.mlp.narrative.s06.pKaimingEffect")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s06.figLabelKaiming")} hint={t("models.mlp.narrative.s06.figHintKaiming")}>
                        <Suspense fallback={<SectionSkeleton />}><KaimingScalingVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s06.pKaimingTraining")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s06.figLabelInitComp")} hint={t("models.mlp.narrative.s06.figHintInitComp")}>
                        <Suspense fallback={<SectionSkeleton />}><InitializationComparisonTrainer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ══════════ Solution 2: Batch Normalization ══════════ */}
                <P>{t("models.mlp.narrative.s06.discoveryBN")}</P>
                <P>{t("models.mlp.narrative.s06.pBNProblemViz")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s06.figLabelDrift")} hint={t("models.mlp.narrative.s06.figHintDrift")}>
                        <Suspense fallback={<SectionSkeleton />}><ActivationDriftVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s06.pBNIdea")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s06.figLabelBNEffect")} hint={t("models.mlp.narrative.s06.figHintBNEffect")}>
                        <Suspense fallback={<SectionSkeleton />}><BatchNormEffectVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s06.pBNFormula")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s06.figLabelBNSteps")} hint={t("models.mlp.narrative.s06.figHintBNSteps")}>
                        <Suspense fallback={<SectionSkeleton />}><BatchNormStepByStep /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s06.pGammaBeta")}</P>

                {/* ── BatchNorm deep-dive panel (concepts 5-9) ── */}
                <TrainingChallengePanel
                    title={t("models.mlp.narrative.s06.panelBNDeepTitle")}
                    preview={t("models.mlp.narrative.s06.panelBNDeepContent")}
                    category="deepdive"
                    difficulty={3}
                >
                    <P>{t("models.mlp.narrative.s06.panelBNMiniBatch")}</P>
                    <P>{t("models.mlp.narrative.s06.panelBNRegularization")}</P>
                    <P>{t("models.mlp.narrative.s06.panelBNInference")}</P>
                    <P>{t("models.mlp.narrative.s06.panelBNProblems")}</P>
                    <P>{t("models.mlp.narrative.s06.panelBNLayerNorm")}</P>
                    <FigureWrapper label={t("models.mlp.narrative.s06.figLabelNormCompare")} hint={t("models.mlp.narrative.s06.figHintNormCompare")}>
                        <Suspense fallback={<SectionSkeleton />}><NormComparisonDiagram /></Suspense>
                    </FigureWrapper>
                </TrainingChallengePanel>

                {/* ══════════ Solution 3: Residual Connections ══════════ */}
                <P>{t("models.mlp.narrative.s06.discoveryResidual")}</P>
                <P>{t("models.mlp.narrative.s06.pResidualCore")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s06.figLabelResGrad")} hint={t("models.mlp.narrative.s06.figHintResGrad")}>
                        <Suspense fallback={<SectionSkeleton />}><ResidualGradientHighway /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s06.pGradientHighway")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s06.figLabelHighway")} hint={t("models.mlp.narrative.s06.figHintHighway")}>
                        <Suspense fallback={<SectionSkeleton />}><ResidualHighwayVisual /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s06.pWhyDeepWorks")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s06.figLabelResidualGrad")} hint={t("models.mlp.narrative.s06.figHintResidualGrad")}>
                        <Suspense fallback={<SectionSkeleton />}><ResidualGradientComparison /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Residual deep-dive panel ── */}
                <TrainingChallengePanel
                    title={t("models.mlp.narrative.s06.panelResDeepTitle")}
                    preview={t("models.mlp.narrative.s06.panelResProjection")}
                    category="deepdive"
                    difficulty={2}
                >
                    <P>{t("models.mlp.narrative.s06.panelResProjection")}</P>
                    <P>{t("models.mlp.narrative.s06.panelResWhyName")}</P>
                </TrainingChallengePanel>

                {/* ══════════ Full stability grid ══════════ */}
                <P>{t("models.mlp.narrative.s06.pStabilityGrid")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s06.figLabelStability")} hint={t("models.mlp.narrative.s06.figHintStability")}>
                        <Suspense fallback={<SectionSkeleton />}><StabilityTechniqueGrid /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <Callout icon={Lightbulb} accent="violet" title={t("models.mlp.narrative.s06.calloutTitle")}>
                    <p>{t("models.mlp.narrative.s06.calloutText")}</p>
                </Callout>

                {/* ══════════ REDEMPTION: before/after comparison ══════════ */}
                <P>{t("models.mlp.narrative.s06.pRedemptionIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s06.figLabelRedemption")} hint={t("models.mlp.narrative.s06.figHintRedemption")}>
                        <Suspense fallback={<SectionSkeleton />}><DeepModelRedemptionDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s06.pRedemptionResult")}</P>

                {/* Monster status banner */}
                <MonsterStatus gradient="emerald-violet">{t("models.mlp.narrative.s06.pMonsterTamed")}</MonsterStatus>

                <KeyTakeaway accent="violet">
                    {t("models.mlp.narrative.s06.takeaway")}
                </KeyTakeaway>
            </Section>

            <SectionBreak />
            <MonsterInterlude>{t("models.mlp.narrative.monsterInterludes.after06")}</MonsterInterlude>

            {/* ─────────── 07 · THE PERFECT RECIPE ─────────── */}
            <Section id="mlp-07">
                <SectionLabel number={t("models.mlp.narrative.sections.s07.number")} label={t("models.mlp.narrative.sections.s07.label")} />
                <SectionAnchor id="mlp-07"><Heading>{t("models.mlp.narrative.s07.heading")}</Heading></SectionAnchor>
                <Lead>{t("models.mlp.narrative.s07.lead")}</Lead>

                {/* ── Cooking metaphor intro ── */}
                <P>{t("models.mlp.narrative.s07.pCookingIntro")}</P>

                {/* ══════════ Main flow: 7 visualizers ══════════ */}

                {/* 1. Embedding dimension */}
                <P>{t("models.mlp.narrative.s07.p1")}</P>
                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabel1")} hint={t("models.mlp.narrative.s07.figHint1")}>
                        <Suspense fallback={<SectionSkeleton />}><EmbeddingDimensionComparison /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* 2. Hidden size */}
                <P>{t("models.mlp.narrative.s07.p2")}</P>
                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabel2")} hint={t("models.mlp.narrative.s07.figHint2")}>
                        <Suspense fallback={<SectionSkeleton />}><HiddenSizeExplorer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* 3. Dropout */}
                <P>{t("models.mlp.narrative.s07.pDropout")}</P>
                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabelDropout")} hint={t("models.mlp.narrative.s07.figHintDropout")}>
                        <Suspense fallback={<SectionSkeleton />}><DropoutVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* 4. Context window */}
                <P>{t("models.mlp.narrative.s07.pContextBridge")}</P>
                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabelContext")} hint={t("models.mlp.narrative.s07.figHintContext")}>
                        <Suspense fallback={<SectionSkeleton />}><ContextWindowExperiment /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Guided challenge ── */}
                <P>{t("models.mlp.narrative.s07.pGuidedChallenge")}</P>

                {/* 5. Full hyperparameter explorer (centerpiece) */}
                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabel5")} hint={t("models.mlp.narrative.s07.figHint5")}>
                        <Suspense fallback={<SectionSkeleton />}>
                            <MLPHyperparameterExplorer
                                configs={mlpGrid.configs}
                                selectedConfig={mlpGrid.selectedConfig}
                                onSelectClosest={mlpGrid.selectClosest}
                                timeline={mlpGrid.timeline}
                                timelineLoading={mlpGrid.timelineLoading}
                                onFetchTimeline={mlpGrid.fetchTimelineData}
                                generation={mlpGrid.generation}
                                generationLoading={mlpGrid.generationLoading}
                                onGenerate={mlpGrid.generateText}
                                gridLoading={mlpGrid.gridLoading}
                                gridError={mlpGrid.gridError}
                                isNarrativeMode={true}
                            />
                        </Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* 6. Overfitting detective */}
                <P>{t("models.mlp.narrative.s07.p6")}</P>
                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabel6")} hint={t("models.mlp.narrative.s07.figHint6")}>
                        <Suspense fallback={<SectionSkeleton />}><OverfittingDetectiveChallenge /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Best model showcase ── */}
                <P>{t("models.mlp.narrative.s07.pBestShowcase")}</P>

                {/* ══════════ Panels (moved from main flow) ══════════ */}

                {/* Panel: Learning Rate Schedules */}
                <TrainingChallengePanel
                    title={t("models.mlp.narrative.s07.panelLRTitle")}
                    preview={t("models.mlp.narrative.s07.panelLRPreview")}
                    category="deepdive"
                    difficulty={2}
                >
                    <P>{t("models.mlp.narrative.s07.p3")}</P>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabel3")} hint={t("models.mlp.narrative.s07.figHint3")}>
                        <Suspense fallback={<SectionSkeleton />}><LearningRateScheduleExplorer /></Suspense>
                    </FigureWrapper>
                </TrainingChallengePanel>

                {/* Panel: Temperature Control */}
                <TrainingChallengePanel
                    title={t("models.mlp.narrative.s07.panelTempTitle")}
                    preview={t("models.mlp.narrative.s07.panelTempPreview")}
                    category="deepdive"
                    difficulty={1}
                >
                    <P>{t("models.mlp.narrative.s07.pTemperatureCallback")}</P>
                    <P>{t("models.mlp.narrative.s07.p4")}</P>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabel4")} hint={t("models.mlp.narrative.s07.figHint4")}>
                        <Suspense fallback={<SectionSkeleton />}><SoftmaxTemperatureVisualizer /></Suspense>
                    </FigureWrapper>
                </TrainingChallengePanel>

                {/* Panel: All 108 Models Plotted */}
                <TrainingChallengePanel
                    title={t("models.mlp.narrative.s07.panelScatterTitle")}
                    preview={t("models.mlp.narrative.s07.panelScatterPreview")}
                    category="deepdive"
                    difficulty={2}
                >
                    <P>{t("models.mlp.narrative.s07.pEmbDimScatter")}</P>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabelEmbDim")} hint={t("models.mlp.narrative.s07.figHintEmbDim")}>
                        <Suspense fallback={<SectionSkeleton />}><EmbeddingDimVsLoss /></Suspense>
                    </FigureWrapper>
                </TrainingChallengePanel>

                {/* Panel: Training Race */}
                <TrainingChallengePanel
                    title={t("models.mlp.narrative.s07.panelRaceTitle")}
                    preview={t("models.mlp.narrative.s07.panelRacePreview")}
                    category="experiment"
                    difficulty={1}
                >
                    <P>{t("models.mlp.narrative.s07.pTrainingRace")}</P>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabelRace")} hint={t("models.mlp.narrative.s07.figHintRace")}>
                        <Suspense fallback={<SectionSkeleton />}><TrainingProgressRace /></Suspense>
                    </FigureWrapper>
                </TrainingChallengePanel>

                <Callout icon={Lightbulb} accent="violet" title={t("models.mlp.narrative.s07.calloutTitle")}>
                    <p>{t("models.mlp.narrative.s07.calloutText")}</p>
                </Callout>

                {/* ── ChatGPT Checkpoint₂ ── */}
                <Callout icon={BrainCircuit} accent="violet" title={t("models.mlp.narrative.s07.pChatGPTCheck2")}>
                    <p>{t("models.mlp.narrative.s07.chatGPTCheck2Sub")}</p>
                </Callout>

                <KeyTakeaway accent="violet">
                    {t("models.mlp.narrative.s07.takeaway")}
                </KeyTakeaway>
            </Section>

            <SectionBreak />
            <MonsterInterlude>{t("models.mlp.narrative.monsterInterludes.after07")}</MonsterInterlude>

            {/* ─────────── 08 · THE MONSTER THAT CAN'T SEE ─────────── */}
            <Section id="mlp-08">
                <SectionLabel number={t("models.mlp.narrative.sections.s08.number")} label={t("models.mlp.narrative.sections.s08.label")} />
                <SectionAnchor id="mlp-08"><Heading>{t("models.mlp.narrative.s08.heading")}</Heading></SectionAnchor>
                <Lead>{t("models.mlp.narrative.s08.lead")}</Lead>

                {/* ══════════ Big model wall ══════════ */}
                <P>{t("models.mlp.narrative.s08.pBigModelIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabelBigModel")} hint={t("models.mlp.narrative.s08.figHintBigModel")}>
                        <Suspense fallback={<SectionSkeleton />}><BigModelLimitationViz /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Limitation playground ── */}
                <P>{t("models.mlp.narrative.s08.p1")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabel1")} hint={t("models.mlp.narrative.s08.figHint1")}>
                        <Suspense fallback={<SectionSkeleton />}><MLPLimitationPlayground /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ══════════ Limitation 1: Fixed window ══════════ */}
                <P>
                    <Highlight color="amber">{t("models.mlp.narrative.s08.p2H1")}</Highlight>{" "}
                    {t("models.mlp.narrative.s08.p2")}
                </P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabel2")} hint={t("models.mlp.narrative.s08.figHint2")}>
                        <Suspense fallback={<SectionSkeleton />}><ContextWindowVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabel5")} hint={t("models.mlp.narrative.s08.figHint5")}>
                        <Suspense fallback={<SectionSkeleton />}><LongRangeDependencyDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ══════════ Limitation 2: Position = identity crisis (merged old 2+4) ══════════ */}
                <P>
                    <Highlight color="amber">{t("models.mlp.narrative.s08.p3H1")}</Highlight>{" "}
                    {t("models.mlp.narrative.s08.p3")}
                </P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabel3")} hint={t("models.mlp.narrative.s08.figHint3")}>
                        <Suspense fallback={<SectionSkeleton />}><PositionSensitivityVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ══════════ Limitation 3: Concatenation bottleneck ══════════ */}
                <P>
                    <Highlight color="amber">{t("models.mlp.narrative.s08.p5H1")}</Highlight>{" "}
                    {t("models.mlp.narrative.s08.p5")}
                </P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabel6")} hint={t("models.mlp.narrative.s08.figHint6")}>
                        <Suspense fallback={<SectionSkeleton />}><ConcatenationBottleneckVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ══════════ Limitation 4: No semantic understanding ══════════ */}
                <P>
                    <Highlight color="amber">{t("models.mlp.narrative.s08.p8H1")}</Highlight>{" "}
                    {t("models.mlp.narrative.s08.p8")}
                </P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabelContextMeaning")} hint={t("models.mlp.narrative.s08.figHintContextMeaning")}>
                        <Suspense fallback={<SectionSkeleton />}><ContextMeaningDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ══════════ Perception synthesis ══════════ */}
                <P><em>{t("models.mlp.narrative.s08.pPerceptionSynthesis")}</em></P>

                {/* ══════════ Wishlist + Transformer teaser ══════════ */}
                <P>{t("models.mlp.narrative.s08.p7")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabel8")} hint={t("models.mlp.narrative.s08.figHint8")}>
                        <Suspense fallback={<SectionSkeleton />}><ArchitectureWishlistBuilder /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Transformer teaser: animated attention lines ── */}
                <FadeInView margin="-40px" className="my-6 flex justify-center">
                    <svg viewBox="0 0 260 60" className="w-full max-w-sm" preserveAspectRatio="xMidYMid meet">
                        {["T", "h", "e", " ", "k", "i", "n", "g"].map((ch, i) => (
                            <text key={i} x={20 + i * 30} y={50} textAnchor="middle" fontSize={10} fontFamily="monospace" fill="white" fillOpacity={0.5}>{ch === " " ? "␣" : ch}</text>
                        ))}
                        {/* Attention lines from "king" (idx 4) to other tokens */}
                        {[0, 1, 2, 3, 5, 6, 7].map((j) => (
                            <motion.line
                                key={j}
                                x1={20 + 4 * 30} y1={38}
                                x2={20 + j * 30} y2={38}
                                stroke="#8b5cf6"
                                strokeWidth={1.5}
                                strokeLinecap="round"
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: j === 7 || j === 0 ? 0.6 : j === 3 ? 0.1 : 0.25 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3 + j * 0.1, duration: 0.6 }}
                            />
                        ))}
                        <text x={130} y={14} textAnchor="middle" fontSize={7} fontFamily="monospace" fill="#8b5cf6" fillOpacity={0.4}>attention</text>
                    </svg>
                </FadeInView>

                <P>{t("models.mlp.narrative.s08.wishlistReveal")}</P>

                <Callout icon={AlertTriangle} accent="amber" title={t("models.mlp.narrative.s08.calloutTitle")}>
                    <p>{t("models.mlp.narrative.s08.calloutText")}</p>
                </Callout>

                {/* ══════════ "Look how far we've come" ══════════ */}
                <P>{t("models.mlp.narrative.s08.pEvolutionIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabelEvolution")} hint={t("models.mlp.narrative.s08.figHintEvolution")}>
                        <Suspense fallback={<SectionSkeleton />}><ModelEvolutionComparison /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s08.pGalleryIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabelGallery")} hint={t("models.mlp.narrative.s08.figHintGallery")}>
                        <Suspense fallback={<SectionSkeleton />}><GenerationGallery /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ══════════ Enhanced closure ══════════ */}
                <P>{t("models.mlp.narrative.s08.pJourneyReflection")}</P>

                {/* Monster's final monologue — line by line */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2 }}
                    className="text-center py-12 my-8"
                >
                    <span className="text-2xl mb-4 block" aria-hidden>👾</span>
                    <p className="whitespace-pre-line text-base md:text-lg italic bg-gradient-to-r from-violet-400/80 via-purple-300/80 to-violet-400/80 bg-clip-text text-transparent max-w-lg mx-auto leading-relaxed">
                        {t("models.mlp.narrative.s08.pMonsterClosure")}
                    </p>
                </motion.div>

                {/* Pause — then the question */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8, duration: 1.2 }}
                    className="text-center py-8 my-4"
                >
                    <p className="whitespace-pre-line text-lg md:text-xl font-semibold bg-gradient-to-r from-violet-400 via-purple-300 to-violet-400 bg-clip-text text-transparent max-w-md mx-auto leading-relaxed">
                        {t("models.mlp.narrative.s08.pMonsterClosureQuestion")}
                    </p>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-sm text-[var(--lab-text-muted)] max-w-xl mx-auto leading-relaxed text-center mb-8"
                >
                    {t("models.mlp.narrative.s08.pMonsterClosureSub")}
                </motion.p>

                <KeyTakeaway accent="violet">
                    {t("models.mlp.narrative.s08.takeaway")}
                </KeyTakeaway>

                <MonsterInterlude>{t("models.mlp.narrative.monsterInterludes.after08")}</MonsterInterlude>

                <div className="mt-12 text-center mb-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-[var(--lab-text)] tracking-tight mb-3">
                        {t("models.mlp.narrative.cta.heading")}
                    </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setMode("free")}
                        className="group relative rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/20 to-[var(--lab-viz-bg)]/80 p-6 text-left transition-colors hover:border-violet-500/40 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-xl bg-violet-500/15">
                                    <Beaker className="w-5 h-5 text-violet-300" />
                                </div>
                                <span className="text-lg font-bold text-[var(--lab-text)]">
                                    {t("models.mlp.narrative.cta.freeLabTitle")}
                                </span>
                            </div>
                            <p className="text-sm text-[var(--lab-text-muted)] leading-relaxed">
                                {t("models.mlp.narrative.cta.freeLabDesc")}
                            </p>
                        </div>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push("/lab/rnn")}
                        className="group relative rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/20 to-[var(--lab-viz-bg)]/80 p-6 text-left transition-colors hover:border-cyan-500/40 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-xl bg-cyan-500/15">
                                    <BrainCircuit className="w-5 h-5 text-cyan-300" />
                                </div>
                                <span className="text-lg font-bold text-[var(--lab-text)]">
                                    {t("models.mlp.narrative.cta.transformerTitle")}
                                </span>
                            </div>
                            <p className="text-sm text-[var(--lab-text-muted)] leading-relaxed">
                                {t("models.mlp.narrative.cta.transformerDesc")}
                            </p>
                        </div>
                    </motion.button>
                </div>
            </Section>

            {/* ───────────────── FOOTER ───────────────── */}
            <FadeInView as="footer" className="mt-8 pt-12 border-t border-[var(--lab-border)] text-center">
                <p className="text-sm text-[var(--lab-text-subtle)] italic max-w-md mx-auto leading-relaxed mb-10">
                    {t("models.mlp.narrative.footer.text")}
                </p>
                <div className="flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[var(--lab-border)]">
                    <FlaskConical className="h-3 w-3" />
                    {t("models.mlp.narrative.footer.brand")}
                </div>
            </FadeInView>
        </article>
    );
}
