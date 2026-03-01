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
const ContextConcatenationExplorer = lazy(() => import("@/components/lab/mlp/ContextConcatenationExplorer").then(m => ({ default: m.ContextConcatenationExplorer })));
const DimensionalityScaleVisualizer = lazy(() => import("@/components/lab/mlp/DimensionalityScaleVisualizer").then(m => ({ default: m.DimensionalityScaleVisualizer })));
const MLPArchitectureDiagram = lazy(() => import("@/components/lab/mlp/MLPArchitectureDiagram").then(m => ({ default: m.MLPArchitectureDiagram })));
const ContextVsNoContextDemo = lazy(() => import("@/components/lab/mlp/ContextVsNoContextDemo").then(m => ({ default: m.ContextVsNoContextDemo })));
// §02 — The Representation Problem
const CharacterFeatureExplorer = lazy(() => import("@/components/lab/mlp/CharacterFeatureExplorer").then(m => ({ default: m.CharacterFeatureExplorer })));
const ManualEmbeddingBuilder = lazy(() => import("@/components/lab/mlp/ManualEmbeddingBuilder").then(m => ({ default: m.ManualEmbeddingBuilder })));
const EmbeddingLookupAnimator = lazy(() => import("@/components/lab/mlp/EmbeddingLookupAnimator").then(m => ({ default: m.EmbeddingLookupAnimator })));
const CompressionRatioCalculator = lazy(() => import("@/components/lab/mlp/CompressionRatioCalculator").then(m => ({ default: m.CompressionRatioCalculator })));
// §03 — Embeddings in Action
const EmbeddingTrainingTimelapse = lazy(() => import("@/components/lab/mlp/EmbeddingTrainingTimelapse").then(m => ({ default: m.EmbeddingTrainingTimelapse })));
const PedagogicalEmbeddingVisualizer = lazy(() => import("@/components/lab/mlp/PedagogicalEmbeddingVisualizer").then(m => ({ default: m.PedagogicalEmbeddingVisualizer })));
const EmbeddingDistanceCalculator = lazy(() => import("@/components/lab/mlp/EmbeddingDistanceCalculator").then(m => ({ default: m.EmbeddingDistanceCalculator })));
const NearestNeighborExplorer = lazy(() => import("@/components/lab/mlp/NearestNeighborExplorer").then(m => ({ default: m.NearestNeighborExplorer })));
const EmbeddingArithmeticPlayground = lazy(() => import("@/components/lab/mlp/EmbeddingArithmeticPlayground").then(m => ({ default: m.EmbeddingArithmeticPlayground })));
const EmbeddingQualityComparison = lazy(() => import("@/components/lab/mlp/EmbeddingQualityComparison").then(m => ({ default: m.EmbeddingQualityComparison })));
// §04 — Building the Full Pipeline
const MLPForwardPassAnimator = lazy(() => import("@/components/lab/mlp/MLPForwardPassAnimator").then(m => ({ default: m.MLPForwardPassAnimator })));
const SingleExampleTrainer = lazy(() => import("@/components/lab/mlp/SingleExampleTrainer").then(m => ({ default: m.SingleExampleTrainer })));
const NgramVsMlpParameterComparison = lazy(() => import("@/components/lab/mlp/NgramVsMlpParameterComparison").then(m => ({ default: m.NgramVsMlpParameterComparison })));
const MLPLivePredictor = lazy(() => import("@/components/lab/mlp/MLPLivePredictor").then(m => ({ default: m.MLPLivePredictor })));
const MLPPipelineVisualizer = lazy(() => import("@/components/lab/mlp/MLPPipelineVisualizer").then(m => ({ default: m.MLPPipelineVisualizer })));
// §05 — Going Deeper
const DepthExplorer = lazy(() => import("@/components/lab/mlp/DepthExplorer").then(m => ({ default: m.DepthExplorer })));
const LayerActivationExplorer = lazy(() => import("@/components/lab/mlp/LayerActivationExplorer").then(m => ({ default: m.LayerActivationExplorer })));
const ActivationHistogramVisualizer = lazy(() => import("@/components/lab/mlp/ActivationHistogramVisualizer").then(m => ({ default: m.ActivationHistogramVisualizer })));
const DepthGenerationGallery = lazy(() => import("@/components/lab/mlp/DepthGenerationGallery").then(m => ({ default: m.DepthGenerationGallery })));
// §06 — Training Stability
const InitializationSensitivityVisualizer = lazy(() => import("@/components/lab/mlp/InitializationSensitivityVisualizer").then(m => ({ default: m.InitializationSensitivityVisualizer })));
const TanhSaturationDemo = lazy(() => import("@/components/lab/mlp/TanhSaturationDemo").then(m => ({ default: m.TanhSaturationDemo })));
const GradientProductSimulator = lazy(() => import("@/components/lab/mlp/GradientProductSimulator").then(m => ({ default: m.GradientProductSimulator })));
const GradientFlowVisualizer = lazy(() => import("@/components/lab/mlp/GradientFlowVisualizer").then(m => ({ default: m.GradientFlowVisualizer })));
const InitializationComparisonTrainer = lazy(() => import("@/components/lab/mlp/InitializationComparisonTrainer").then(m => ({ default: m.InitializationComparisonTrainer })));
const ActivationDriftVisualizer = lazy(() => import("@/components/lab/mlp/ActivationDriftVisualizer").then(m => ({ default: m.ActivationDriftVisualizer })));
const BatchNormEffectVisualizer = lazy(() => import("@/components/lab/mlp/BatchNormEffectVisualizer").then(m => ({ default: m.BatchNormEffectVisualizer })));
const ResidualConnectionIntuition = lazy(() => import("@/components/lab/mlp/ResidualConnectionIntuition").then(m => ({ default: m.ResidualConnectionIntuition })));
// §07 — Hyperparameter Experiments
const EmbeddingDimensionComparison = lazy(() => import("@/components/lab/mlp/EmbeddingDimensionComparison").then(m => ({ default: m.EmbeddingDimensionComparison })));
const HiddenSizeExplorer = lazy(() => import("@/components/lab/mlp/HiddenSizeExplorer").then(m => ({ default: m.HiddenSizeExplorer })));
const LearningRateScheduleExplorer = lazy(() => import("@/components/lab/mlp/LearningRateScheduleExplorer").then(m => ({ default: m.LearningRateScheduleExplorer })));
const MLPHyperparameterExplorer = lazy(() => import("@/components/lab/mlp/MLPHyperparameterExplorer").then(m => ({ default: m.MLPHyperparameterExplorer })));
const OverfittingDetectiveChallenge = lazy(() => import("@/components/lab/mlp/OverfittingDetectiveChallenge").then(m => ({ default: m.OverfittingDetectiveChallenge })));
const SoftmaxTemperatureVisualizer = lazy(() => import("@/components/lab/mlp/SoftmaxTemperatureVisualizer").then(m => ({ default: m.SoftmaxTemperatureVisualizer })));
// §08 — Limitations
const MLPLimitationPlayground = lazy(() => import("@/components/lab/mlp/MLPLimitationPlayground").then(m => ({ default: m.MLPLimitationPlayground })));
const ContextWindowVisualizer = lazy(() => import("@/components/lab/mlp/ContextWindowVisualizer").then(m => ({ default: m.ContextWindowVisualizer })));
const PositionSensitivityVisualizer = lazy(() => import("@/components/lab/mlp/PositionSensitivityVisualizer").then(m => ({ default: m.PositionSensitivityVisualizer })));
const PositionWeightShareDemo = lazy(() => import("@/components/lab/mlp/PositionWeightShareDemo").then(m => ({ default: m.PositionWeightShareDemo })));
const LongRangeDependencyDemo = lazy(() => import("@/components/lab/mlp/LongRangeDependencyDemo").then(m => ({ default: m.LongRangeDependencyDemo })));
const ConcatenationBottleneckVisualizer = lazy(() => import("@/components/lab/mlp/ConcatenationBottleneckVisualizer").then(m => ({ default: m.ConcatenationBottleneckVisualizer })));
const ParameterSharingMotivation = lazy(() => import("@/components/lab/mlp/ParameterSharingMotivation").then(m => ({ default: m.ParameterSharingMotivation })));
const ArchitectureWishlistBuilder = lazy(() => import("@/components/lab/mlp/ArchitectureWishlistBuilder").then(m => ({ default: m.ArchitectureWishlistBuilder })));
// §09 — Grand Finale
const ModelEvolutionComparison = lazy(() => import("@/components/lab/mlp/ModelEvolutionComparison").then(m => ({ default: m.ModelEvolutionComparison })));
const GenerationGallery = lazy(() => import("@/components/lab/mlp/GenerationGallery").then(m => ({ default: m.GenerationGallery })));
const HistoricalTimelineSidebar = lazy(() => import("@/components/lab/mlp/HistoricalTimelineSidebar").then(m => ({ default: m.HistoricalTimelineSidebar })));

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
const PullQuote = ({ children }: { children: React.ReactNode }) => <_PullQuote accent={NA}>{children}</_PullQuote>;

export interface MLPNarrativeProps {
    mlpGrid: UseMLPGridReturn;
}

/* ─── MLP-specific local components ─── */

function TrainingChallengePanel({ title, preview, defaultOpen = false, children }: { title: string; preview: string; defaultOpen?: boolean; children: React.ReactNode }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <FadeInView margin="-40px" className="my-6 rounded-xl border border-[var(--lab-border)] bg-[var(--lab-card)] overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full p-4 text-left hover:bg-[var(--lab-card)] transition-colors"
                aria-expanded={open}
            >
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-mono font-bold text-violet-300 mb-1">{title}</h4>
                    <p className="text-xs text-[var(--lab-text-subtle)]">{preview}</p>
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
                        <div className="px-4 pb-4 pt-2 border-t border-[var(--lab-border)]">
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
                    "mlp-01": "The Input Problem",
                    "mlp-02": "The Representation Problem",
                    "mlp-03": "Embeddings in Action",
                    "mlp-04": "The Full Pipeline",
                    "mlp-05": "Going Deeper",
                    "mlp-06": "Training Stability",
                    "mlp-07": "Hyperparameters",
                    "mlp-08": "Limitations",
                    "mlp-09": "The Path Ahead",
                }}
            />
            <SectionProgressBar
                sections={[
                    { id: "mlp-01", label: "01", name: "Input" },
                    { id: "mlp-02", label: "02", name: "Representation" },
                    { id: "mlp-03", label: "03", name: "Embeddings" },
                    { id: "mlp-04", label: "04", name: "Pipeline" },
                    { id: "mlp-05", label: "05", name: "Depth" },
                    { id: "mlp-06", label: "06", name: "Stability" },
                    { id: "mlp-07", label: "07", name: "Hyperparams" },
                    { id: "mlp-08", label: "08", name: "Limits" },
                    { id: "mlp-09", label: "09", name: "Ahead" },
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

            {/* ─────────── 01 · THE INPUT PROBLEM ─────────── */}
            <Section id="mlp-01">
                <SectionLabel number={t("models.mlp.narrative.sections.s01.number")} label={t("models.mlp.narrative.sections.s01.label")} />
                <SectionAnchor id="mlp-01"><Heading>{t("models.mlp.narrative.s01.heading")}</Heading></SectionAnchor>
                <Lead>{t("models.mlp.narrative.s01.lead")}</Lead>

                {/* Evolution mini-timeline */}
                <div className="my-8 flex flex-wrap items-center justify-center gap-3 text-center">
                    {[
                        { label: t("models.mlp.narrative.s01.bigramLabel"), desc: t("models.mlp.narrative.s01.bigramDesc"), color: "text-amber-400/70" },
                        { label: t("models.mlp.narrative.s01.ngramLabel"), desc: t("models.mlp.narrative.s01.ngramDesc"), color: "text-orange-400/70" },
                        { label: t("models.mlp.narrative.s01.nnLabel"), desc: t("models.mlp.narrative.s01.nnDesc"), color: "text-rose-400/70" },
                        { label: t("models.mlp.narrative.s01.mlpLabel"), desc: t("models.mlp.narrative.s01.mlpDesc"), color: "text-violet-400" },
                    ].map((step, i, arr) => (
                        <div key={step.label} className="flex items-center gap-3">
                            <div className="flex flex-col items-center">
                                <span className={`text-xs font-mono font-bold ${step.color}`}>{step.label}</span>
                                <span className="text-[9px] text-[var(--lab-text-subtle)]">{step.desc}</span>
                            </div>
                            {i < arr.length - 1 && <span className="text-[var(--lab-text-subtle)] text-xs">→</span>}
                        </div>
                    ))}
                </div>

                <P>{t("models.mlp.narrative.s01.p1")}</P>

                <P>
                    {t("models.mlp.narrative.s01.p2")}{" "}
                    <Highlight>{t("models.mlp.narrative.s01.p2H1")}</Highlight>
                    {t("models.mlp.narrative.s01.p2End")}
                </P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s01.figLabel1")} hint={t("models.mlp.narrative.s01.figHint1")}>
                        <Suspense fallback={<SectionSkeleton />}><ContextConcatenationExplorer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>
                    {t("models.mlp.narrative.s01.p3")}{" "}
                    <Highlight>{t("models.mlp.narrative.s01.p3H1")}</Highlight>
                    {t("models.mlp.narrative.s01.p3End")}
                </P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s01.figLabel2")} hint={t("models.mlp.narrative.s01.figHint2")}>
                        <Suspense fallback={<SectionSkeleton />}><DimensionalityScaleVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s01.p4")}</P>

                <FormulaBlock
                    formula="x = [\text{onehot}(t_{i-N}); \ldots; \text{onehot}(t_{i-1})] \in \mathbb{R}^{N \cdot V}"
                    caption={t("models.mlp.narrative.s01.formulaCaption")}
                />

                <Callout icon={Lightbulb} accent="violet" title={t("models.mlp.narrative.s01.calloutTitle")}>
                    <p>{t("models.mlp.narrative.s01.calloutText")}</p>
                </Callout>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s01.archLabel")} hint={t("models.mlp.narrative.s01.archHint")}>
                        <Suspense fallback={<SectionSkeleton />}><MLPArchitectureDiagram /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s01.p5")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s01.figLabel3")} hint={t("models.mlp.narrative.s01.figHint3")}>
                        <Suspense fallback={<SectionSkeleton />}><ContextVsNoContextDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <KeyTakeaway accent="violet">
                    {t("models.mlp.narrative.s01.takeaway")}
                </KeyTakeaway>
            </Section>

            <SectionBreak />

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

                <P>
                    {t("models.mlp.narrative.s02.p3")}{" "}
                    <Highlight color="emerald">{t("models.mlp.narrative.s02.p3H1")}</Highlight>
                    {t("models.mlp.narrative.s02.p3End")}
                </P>

                <FormulaBlock
                    formula="e_t = E[t] = E^\top \cdot \text{onehot}(t) \in \mathbb{R}^D"
                    caption={t("models.mlp.narrative.s02.formulaCaption")}
                />

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s02.figLabel3")} hint={t("models.mlp.narrative.s02.figHint3")}>
                        <Suspense fallback={<SectionSkeleton />}><EmbeddingLookupAnimator /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>
                    {t("models.mlp.narrative.s02.p4")}{" "}
                    <Highlight color="emerald">{t("models.mlp.narrative.s02.p4H1")}</Highlight>
                    {t("models.mlp.narrative.s02.p4End")}
                </P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s02.figLabel4")} hint={t("models.mlp.narrative.s02.figHint4")}>
                        <Suspense fallback={<SectionSkeleton />}><CompressionRatioCalculator /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <Callout icon={Lightbulb} accent="emerald" title={t("models.mlp.narrative.s02.calloutTitle")}>
                    <p>{t("models.mlp.narrative.s02.calloutText")}</p>
                </Callout>

                <KeyTakeaway accent="violet">
                    {t("models.mlp.narrative.s02.takeaway")}
                </KeyTakeaway>
            </Section>

            <SectionBreak />

            {/* ─────────── 03 · EMBEDDINGS IN ACTION ─────────── */}
            <Section id="mlp-03">
                <SectionLabel number={t("models.mlp.narrative.sections.s03.number")} label={t("models.mlp.narrative.sections.s03.label")} />
                <SectionAnchor id="mlp-03"><Heading>{t("models.mlp.narrative.s03.heading")}</Heading></SectionAnchor>
                <Lead>{t("models.mlp.narrative.s03.lead")}</Lead>

                <P>{t("models.mlp.narrative.s03.p1")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s03.figLabel1")} hint={t("models.mlp.narrative.s03.figHint1")}>
                        <Suspense fallback={<SectionSkeleton />}><EmbeddingTrainingTimelapse /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s03.p2")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s03.figLabel2")} hint={t("models.mlp.narrative.s03.figHint2")}>
                        <Suspense fallback={<SectionSkeleton />}><PedagogicalEmbeddingVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>
                    {t("models.mlp.narrative.s03.p3")}{" "}
                    <Highlight>{t("models.mlp.narrative.s03.p3H1")}</Highlight>
                    {t("models.mlp.narrative.s03.p3Mid")}{" "}
                    <Highlight color="emerald">{t("models.mlp.narrative.s03.p3H2")}</Highlight>
                    {t("models.mlp.narrative.s03.p3End")}
                </P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s03.figLabel3")} hint={t("models.mlp.narrative.s03.figHint3")}>
                        <Suspense fallback={<SectionSkeleton />}><EmbeddingDistanceCalculator /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s03.p4")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s03.figLabel4")} hint={t("models.mlp.narrative.s03.figHint4")}>
                        <Suspense fallback={<SectionSkeleton />}><NearestNeighborExplorer selectedConfig={mlpGrid.selectedConfig} /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s03.p5")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s03.figLabel5")} hint={t("models.mlp.narrative.s03.figHint5")}>
                        <Suspense fallback={<SectionSkeleton />}><EmbeddingArithmeticPlayground /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s03.p6")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s03.figLabel6")} hint={t("models.mlp.narrative.s03.figHint6")}>
                        <Suspense fallback={<SectionSkeleton />}><EmbeddingQualityComparison /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <Callout icon={BookOpen} accent="violet" title={t("models.mlp.narrative.s03.calloutTitle")}>
                    <p>{t("models.mlp.narrative.s03.calloutText")}</p>
                </Callout>

                <KeyTakeaway accent="violet">
                    {t("models.mlp.narrative.s03.takeaway")}
                </KeyTakeaway>
            </Section>

            <SectionBreak />

            {/* ─────────── 04 · BUILDING THE FULL PIPELINE ─────────── */}
            <Section id="mlp-04">
                <SectionLabel number={t("models.mlp.narrative.sections.s04.number")} label={t("models.mlp.narrative.sections.s04.label")} />
                <SectionAnchor id="mlp-04"><Heading>{t("models.mlp.narrative.s04.heading")}</Heading></SectionAnchor>
                <Lead>{t("models.mlp.narrative.s04.lead")}</Lead>

                <P>{t("models.mlp.narrative.s04.p1")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s04.figLabel1")} hint={t("models.mlp.narrative.s04.figHint1")}>
                        <Suspense fallback={<SectionSkeleton />}><MLPForwardPassAnimator /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s04.p2")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s04.figLabel2")} hint={t("models.mlp.narrative.s04.figHint2")}>
                        <Suspense fallback={<SectionSkeleton />}><SingleExampleTrainer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>
                    {t("models.mlp.narrative.s04.p3")}{" "}
                    <Highlight>{t("models.mlp.narrative.s04.p3H1")}</Highlight>
                    {t("models.mlp.narrative.s04.p3End")}
                </P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s04.figLabel3")} hint={t("models.mlp.narrative.s04.figHint3")}>
                        <Suspense fallback={<SectionSkeleton />}><NgramVsMlpParameterComparison /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s04.p4")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s04.figLabel4")} hint={t("models.mlp.narrative.s04.figHint4")}>
                        <Suspense fallback={<SectionSkeleton />}><MLPLivePredictor /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s04.p5")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s04.figLabel5")} hint={t("models.mlp.narrative.s04.figHint5")}>
                        <Suspense fallback={<SectionSkeleton />}><MLPPipelineVisualizer selectedConfig={mlpGrid.selectedConfig} /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <Callout icon={Lightbulb} accent="violet" title={t("models.mlp.narrative.s04.calloutTitle")}>
                    <p>{t("models.mlp.narrative.s04.calloutText")}</p>
                </Callout>

                <KeyTakeaway accent="violet">
                    {t("models.mlp.narrative.s04.takeaway")}
                </KeyTakeaway>
            </Section>

            <SectionBreak />

            {/* ─────────── 05 · GOING DEEPER ─────────── */}
            <Section id="mlp-05">
                <SectionLabel number={t("models.mlp.narrative.sections.s05.number")} label={t("models.mlp.narrative.sections.s05.label")} />
                <SectionAnchor id="mlp-05"><Heading>{t("models.mlp.narrative.s05.heading")}</Heading></SectionAnchor>
                <Lead>{t("models.mlp.narrative.s05.lead")}</Lead>

                <P>{t("models.mlp.narrative.s05.p1")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s05.figLabel1")} hint={t("models.mlp.narrative.s05.figHint1")}>
                        <Suspense fallback={<SectionSkeleton />}><DepthExplorer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s05.p2")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s05.figLabel2")} hint={t("models.mlp.narrative.s05.figHint2")}>
                        <Suspense fallback={<SectionSkeleton />}><LayerActivationExplorer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>
                    {t("models.mlp.narrative.s05.p3")}{" "}
                    <Highlight color="amber">{t("models.mlp.narrative.s05.p3H1")}</Highlight>
                    {t("models.mlp.narrative.s05.p3End")}
                </P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s05.figLabel3")} hint={t("models.mlp.narrative.s05.figHint3")}>
                        <Suspense fallback={<SectionSkeleton />}><ActivationHistogramVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s05.p4")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s05.figLabel4")} hint={t("models.mlp.narrative.s05.figHint4")}>
                        <Suspense fallback={<SectionSkeleton />}><DepthGenerationGallery /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <Callout icon={AlertTriangle} accent="amber" title={t("models.mlp.narrative.s05.calloutTitle")}>
                    <p>{t("models.mlp.narrative.s05.calloutText")}</p>
                </Callout>

                <KeyTakeaway accent="violet">
                    {t("models.mlp.narrative.s05.takeaway")}
                </KeyTakeaway>
            </Section>

            <SectionBreak />

            {/* ─────────── 06 · TRAINING STABILITY ─────────── */}
            <Section id="mlp-06">
                <SectionLabel number={t("models.mlp.narrative.sections.s06.number")} label={t("models.mlp.narrative.sections.s06.label")} />
                <SectionAnchor id="mlp-06"><Heading>{t("models.mlp.narrative.s06.heading")}</Heading></SectionAnchor>
                <Lead>{t("models.mlp.narrative.s06.lead")}</Lead>

                {/* ── Problem 1: Initialization ── */}
                <P>{t("models.mlp.narrative.s06.p1")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s06.figLabel1")} hint={t("models.mlp.narrative.s06.figHint1")}>
                        <Suspense fallback={<SectionSkeleton />}><InitializationSensitivityVisualizer timeline={mlpGrid.timeline} /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Tanh saturation ── */}
                <P>{t("models.mlp.narrative.s06.p2")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s06.figLabel2")} hint={t("models.mlp.narrative.s06.figHint2")}>
                        <Suspense fallback={<SectionSkeleton />}><TanhSaturationDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Problem 2: Vanishing/Exploding gradients ── */}
                <P>{t("models.mlp.narrative.s06.p3")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s06.figLabel3")} hint={t("models.mlp.narrative.s06.figHint3")}>
                        <Suspense fallback={<SectionSkeleton />}><GradientProductSimulator /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s06.p4")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s06.figLabel4")} hint={t("models.mlp.narrative.s06.figHint4")}>
                        <Suspense fallback={<SectionSkeleton />}><GradientFlowVisualizer timeline={mlpGrid.timeline} /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Solution 1: Kaiming init ── */}
                <P>{t("models.mlp.narrative.s06.p5")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s06.figLabel5")} hint={t("models.mlp.narrative.s06.figHint5")}>
                        <Suspense fallback={<SectionSkeleton />}><InitializationComparisonTrainer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Solution 2: Batch Norm ── */}
                <P>{t("models.mlp.narrative.s06.p6")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s06.figLabel6")} hint={t("models.mlp.narrative.s06.figHint6")}>
                        <Suspense fallback={<SectionSkeleton />}><ActivationDriftVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s06.p7")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s06.figLabel7")} hint={t("models.mlp.narrative.s06.figHint7")}>
                        <Suspense fallback={<SectionSkeleton />}><BatchNormEffectVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Solution 3: Residual connections ── */}
                <P>{t("models.mlp.narrative.s06.p8")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s06.figLabel8")} hint={t("models.mlp.narrative.s06.figHint8")}>
                        <Suspense fallback={<SectionSkeleton />}><ResidualConnectionIntuition /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <Callout icon={Lightbulb} accent="violet" title={t("models.mlp.narrative.s06.calloutTitle")}>
                    <p>{t("models.mlp.narrative.s06.calloutText")}</p>
                </Callout>

                <KeyTakeaway accent="violet">
                    {t("models.mlp.narrative.s06.takeaway")}
                </KeyTakeaway>
            </Section>

            <SectionBreak />

            {/* ─────────── 07 · HYPERPARAMETER EXPERIMENTS ─────────── */}
            <Section id="mlp-07">
                <SectionLabel number={t("models.mlp.narrative.sections.s07.number")} label={t("models.mlp.narrative.sections.s07.label")} />
                <SectionAnchor id="mlp-07"><Heading>{t("models.mlp.narrative.s07.heading")}</Heading></SectionAnchor>
                <Lead>{t("models.mlp.narrative.s07.lead")}</Lead>

                <P>{t("models.mlp.narrative.s07.p1")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabel1")} hint={t("models.mlp.narrative.s07.figHint1")}>
                        <Suspense fallback={<SectionSkeleton />}><EmbeddingDimensionComparison /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s07.p2")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabel2")} hint={t("models.mlp.narrative.s07.figHint2")}>
                        <Suspense fallback={<SectionSkeleton />}><HiddenSizeExplorer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s07.p3")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabel3")} hint={t("models.mlp.narrative.s07.figHint3")}>
                        <Suspense fallback={<SectionSkeleton />}><LearningRateScheduleExplorer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s07.p4")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabel4")} hint={t("models.mlp.narrative.s07.figHint4")}>
                        <Suspense fallback={<SectionSkeleton />}><SoftmaxTemperatureVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s07.p5")}</P>

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

                <P>{t("models.mlp.narrative.s07.p6")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabel6")} hint={t("models.mlp.narrative.s07.figHint6")}>
                        <Suspense fallback={<SectionSkeleton />}><OverfittingDetectiveChallenge /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <Callout icon={Lightbulb} accent="violet" title={t("models.mlp.narrative.s07.calloutTitle")}>
                    <p>{t("models.mlp.narrative.s07.calloutText")}</p>
                </Callout>

                <KeyTakeaway accent="violet">
                    {t("models.mlp.narrative.s07.takeaway")}
                </KeyTakeaway>
            </Section>

            <SectionBreak />

            {/* ─────────── 08 · LIMITATIONS ─────────── */}
            <Section id="mlp-08">
                <SectionLabel number={t("models.mlp.narrative.sections.s08.number")} label={t("models.mlp.narrative.sections.s08.label")} />
                <SectionAnchor id="mlp-08"><Heading>{t("models.mlp.narrative.s08.heading")}</Heading></SectionAnchor>
                <Lead>{t("models.mlp.narrative.s08.lead")}</Lead>

                <P>{t("models.mlp.narrative.s08.p1")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabel1")} hint={t("models.mlp.narrative.s08.figHint1")}>
                        <Suspense fallback={<SectionSkeleton />}><MLPLimitationPlayground /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Limitation 1: Fixed context window ── */}
                <P>
                    <Highlight color="amber">{t("models.mlp.narrative.s08.p2H1")}</Highlight>{" "}
                    {t("models.mlp.narrative.s08.p2")}
                </P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabel2")} hint={t("models.mlp.narrative.s08.figHint2")}>
                        <Suspense fallback={<SectionSkeleton />}><ContextWindowVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Limitation 2: Position-dependent meaning ── */}
                <P>
                    <Highlight color="amber">{t("models.mlp.narrative.s08.p3H1")}</Highlight>{" "}
                    {t("models.mlp.narrative.s08.p3")}
                </P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabel3")} hint={t("models.mlp.narrative.s08.figHint3")}>
                        <Suspense fallback={<SectionSkeleton />}><PositionSensitivityVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabel4")} hint={t("models.mlp.narrative.s08.figHint4")}>
                        <Suspense fallback={<SectionSkeleton />}><PositionWeightShareDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Limitation 3: Long-range dependencies ── */}
                <P>
                    <Highlight color="amber">{t("models.mlp.narrative.s08.p4H1")}</Highlight>{" "}
                    {t("models.mlp.narrative.s08.p4")}
                </P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabel5")} hint={t("models.mlp.narrative.s08.figHint5")}>
                        <Suspense fallback={<SectionSkeleton />}><LongRangeDependencyDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Limitation 4: Concatenation bottleneck ── */}
                <P>
                    <Highlight color="amber">{t("models.mlp.narrative.s08.p5H1")}</Highlight>{" "}
                    {t("models.mlp.narrative.s08.p5")}
                </P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabel6")} hint={t("models.mlp.narrative.s08.figHint6")}>
                        <Suspense fallback={<SectionSkeleton />}><ConcatenationBottleneckVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Limitation 5: No parameter sharing ── */}
                <P>
                    <Highlight color="amber">{t("models.mlp.narrative.s08.p6H1")}</Highlight>{" "}
                    {t("models.mlp.narrative.s08.p6")}
                </P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabel7")} hint={t("models.mlp.narrative.s08.figHint7")}>
                        <Suspense fallback={<SectionSkeleton />}><ParameterSharingMotivation /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Wishlist builder ── */}
                <P>{t("models.mlp.narrative.s08.p7")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabel8")} hint={t("models.mlp.narrative.s08.figHint8")}>
                        <Suspense fallback={<SectionSkeleton />}><ArchitectureWishlistBuilder /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <Callout icon={AlertTriangle} accent="amber" title={t("models.mlp.narrative.s08.calloutTitle")}>
                    <p>{t("models.mlp.narrative.s08.calloutText")}</p>
                </Callout>

                <KeyTakeaway accent="violet">
                    {t("models.mlp.narrative.s08.takeaway")}
                </KeyTakeaway>
            </Section>

            <SectionBreak />

            {/* ─────────── 09 · THE PATH AHEAD ─────────── */}
            <Section id="mlp-09">
                <SectionLabel number={t("models.mlp.narrative.sections.s09.number")} label={t("models.mlp.narrative.sections.s09.label")} />
                <SectionAnchor id="mlp-09"><Heading>{t("models.mlp.narrative.s09.heading")}</Heading></SectionAnchor>
                <Lead>{t("models.mlp.narrative.s09.lead")}</Lead>

                <P>{t("models.mlp.narrative.s09.p1")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s09.figLabel1")} hint={t("models.mlp.narrative.s09.figHint1")}>
                        <Suspense fallback={<SectionSkeleton />}><ModelEvolutionComparison /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s09.p2")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s09.figLabel2")} hint={t("models.mlp.narrative.s09.figHint2")}>
                        <Suspense fallback={<SectionSkeleton />}><GenerationGallery /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s09.p3")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s09.figLabel3")} hint={t("models.mlp.narrative.s09.figHint3")}>
                        <Suspense fallback={<SectionSkeleton />}><HistoricalTimelineSidebar /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s09.p4")}</P>
                <div className="my-6 space-y-3 pl-4 border-l-2 border-violet-500/20">
                    <p className="text-[var(--lab-text-muted)] text-sm leading-relaxed">{t("models.mlp.narrative.s09.rnnQ1")}</p>
                    <p className="text-[var(--lab-text-muted)] text-sm leading-relaxed">{t("models.mlp.narrative.s09.rnnQ2")}</p>
                    <p className="text-[var(--lab-text-muted)] text-sm leading-relaxed">{t("models.mlp.narrative.s09.rnnQ3")}</p>
                </div>
                <PullQuote>{t("models.mlp.narrative.s09.pullQuote")}</PullQuote>
                <P>{t("models.mlp.narrative.s09.p5")}</P>
                <P>{t("models.mlp.narrative.s09.p6")}</P>
            </Section>

            <SectionBreak />

            {/* ─────────── CALL TO ACTION ─────────── */}
            <Section>
                <div className="text-center mb-10">
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
