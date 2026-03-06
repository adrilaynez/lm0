"use client";

import { lazy, Suspense, useState } from "react";
import { useRouter } from "next/navigation";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowDown, Beaker, BookOpen, BrainCircuit, FlaskConical, Lightbulb, Sparkles } from "lucide-react";

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
const BackpropEmbeddingVisualizer = lazy(() => import("@/components/lab/mlp/BackpropEmbeddingVisualizer").then(m => ({ default: m.BackpropEmbeddingVisualizer })));
const TripleModelRace = lazy(() => import("@/components/lab/mlp/TripleModelRace").then(m => ({ default: m.TripleModelRace })));
// §03 — Inside the Eyes + §04 — Inside the Brain
const EmbeddingTrainingTimelapse = lazy(() => import("@/components/lab/mlp/EmbeddingTrainingTimelapse").then(m => ({ default: m.EmbeddingTrainingTimelapse })));
const HiddenLayerXORDemo = lazy(() => import("@/components/lab/mlp/HiddenLayerXORDemo").then(m => ({ default: m.HiddenLayerXORDemo })));
const NeuronActivationExplorer = lazy(() => import("@/components/lab/mlp/NeuronActivationExplorer").then(m => ({ default: m.NeuronActivationExplorer })));
const DistanceConceptVisualizer = lazy(() => import("@/components/lab/mlp/DistanceConceptVisualizer").then(m => ({ default: m.DistanceConceptVisualizer })));
const EmbeddingPredictionChallenge = lazy(() => import("@/components/lab/mlp/EmbeddingPredictionChallenge").then(m => ({ default: m.EmbeddingPredictionChallenge })));
const EmbeddingDistanceCalculator = lazy(() => import("@/components/lab/mlp/EmbeddingDistanceCalculator").then(m => ({ default: m.EmbeddingDistanceCalculator })));
const EmbeddingArithmeticPlayground = lazy(() => import("@/components/lab/mlp/EmbeddingArithmeticPlayground").then(m => ({ default: m.EmbeddingArithmeticPlayground })));
const EmbeddingCategoryAnalyzer = lazy(() => import("@/components/lab/mlp/EmbeddingCategoryAnalyzer").then(m => ({ default: m.EmbeddingCategoryAnalyzer })));
const CharacterFeatureScoring = lazy(() => import("@/components/lab/mlp/CharacterFeatureScoring").then(m => ({ default: m.CharacterFeatureScoring })));
const WordEmbeddingAnalogyDemo = lazy(() => import("@/components/lab/mlp/WordEmbeddingAnalogyDemo").then(m => ({ default: m.WordEmbeddingAnalogyDemo })));
// §03 bottleneck (main flow) + panels
const EmbeddingBottleneckExplorer = lazy(() => import("@/components/lab/mlp/EmbeddingBottleneckExplorer").then(m => ({ default: m.EmbeddingBottleneckExplorer })));
// §04 uses (forward pass + pipeline + interpretability)
const PolysemanticitySplitDemo = lazy(() => import("@/components/lab/mlp/PolysemanticitySplitDemo").then(m => ({ default: m.PolysemanticitySplitDemo })));
const NeuronAblationExplorer = lazy(() => import("@/components/lab/mlp/NeuronAblationExplorer").then(m => ({ default: m.NeuronAblationExplorer })));
const SoftmaxStepVisualizer = lazy(() => import("@/components/lab/mlp/SoftmaxStepVisualizer").then(m => ({ default: m.SoftmaxStepVisualizer })));
// §05 activation battle
const ActivationBattleVisualizer = lazy(() => import("@/components/lab/mlp/ActivationBattleVisualizer").then(m => ({ default: m.ActivationBattleVisualizer })));
const MLPForwardPassAnimator = lazy(() => import("@/components/lab/mlp/MLPForwardPassAnimator").then(m => ({ default: m.MLPForwardPassAnimator })));
const SingleExampleTrainer = lazy(() => import("@/components/lab/mlp/SingleExampleTrainer").then(m => ({ default: m.SingleExampleTrainer })));
const MLPLivePredictor = lazy(() => import("@/components/lab/mlp/MLPLivePredictor").then(m => ({ default: m.MLPLivePredictor })));
const MLPPipelineVisualizer = lazy(() => import("@/components/lab/mlp/MLPPipelineVisualizer").then(m => ({ default: m.MLPPipelineVisualizer })));
// §05 — Can We Make It Bigger?
const DepthMotivationViz = lazy(() => import("@/components/lab/mlp/DepthMotivationViz").then(m => ({ default: m.DepthMotivationViz })));
const NetworkShapeComparison = lazy(() => import("@/components/lab/mlp/NetworkShapeComparison").then(m => ({ default: m.NetworkShapeComparison })));
// DepthLRInteractionHeatmap removed from §05
const RealDepthComparisonTrainer = lazy(() => import("@/components/lab/mlp/RealDepthComparisonTrainer").then(m => ({ default: m.RealDepthComparisonTrainer })));
const ActivationHistogramVisualizer = lazy(() => import("@/components/lab/mlp/ActivationHistogramVisualizer").then(m => ({ default: m.ActivationHistogramVisualizer })));
const TanhSaturationDemo = lazy(() => import("@/components/lab/mlp/TanhSaturationDemo").then(m => ({ default: m.TanhSaturationDemo })));
const DeadLayerCascadeVisualizer = lazy(() => import("@/components/lab/mlp/DeadLayerCascadeVisualizer").then(m => ({ default: m.DeadLayerCascadeVisualizer })));
const DeadNeuronVisualizer = lazy(() => import("@/components/lab/mlp/DeadNeuronVisualizer").then(m => ({ default: m.DeadNeuronVisualizer })));
// §06 — Why Deep Breaks (gradient diagnosis)
const InitialLossCatastropheViz = lazy(() => import("@/components/lab/mlp/InitialLossCatastropheViz").then(m => ({ default: m.InitialLossCatastropheViz })));
const WorseThanRandomVisualizer = lazy(() => import("@/components/lab/mlp/WorseThanRandomVisualizer").then(m => ({ default: m.WorseThanRandomVisualizer })));
const GaussianDistributionExplorer = lazy(() => import("@/components/lab/mlp/GaussianDistributionExplorer").then(m => ({ default: m.GaussianDistributionExplorer })));
const InitializationSensitivityVisualizer = lazy(() => import("@/components/lab/mlp/InitializationSensitivityVisualizer").then(m => ({ default: m.InitializationSensitivityVisualizer })));
const BackpropVanishingCalculator = lazy(() => import("@/components/lab/mlp/BackpropVanishingCalculator").then(m => ({ default: m.BackpropVanishingCalculator })));
const GradientFlowVisualizer = lazy(() => import("@/components/lab/mlp/GradientFlowVisualizer").then(m => ({ default: m.GradientFlowVisualizer })));
const KaimingScalingVisualizer = lazy(() => import("@/components/lab/mlp/KaimingScalingVisualizer").then(m => ({ default: m.KaimingScalingVisualizer })));
const VarianceExplosionVisualizer = lazy(() => import("@/components/lab/mlp/VarianceExplosionVisualizer").then(m => ({ default: m.VarianceExplosionVisualizer })));
const ShallowVsDeepComparison = lazy(() => import("@/components/lab/mlp/ShallowVsDeepComparison").then(m => ({ default: m.ShallowVsDeepComparison })));
const InitializationComparisonTrainer = lazy(() => import("@/components/lab/mlp/InitializationComparisonTrainer").then(m => ({ default: m.InitializationComparisonTrainer })));
const ActivationDriftVisualizer = lazy(() => import("@/components/lab/mlp/ActivationDriftVisualizer").then(m => ({ default: m.ActivationDriftVisualizer })));
const BatchNormDiscoveryVisualizer = lazy(() => import("@/components/lab/mlp/BatchNormDiscoveryVisualizer").then(m => ({ default: m.BatchNormDiscoveryVisualizer })));
const BatchNormEffectVisualizer = lazy(() => import("@/components/lab/mlp/BatchNormEffectVisualizer").then(m => ({ default: m.BatchNormEffectVisualizer })));
const BatchNormRegularizerVisualizer = lazy(() => import("@/components/lab/mlp/BatchNormRegularizerVisualizer").then(m => ({ default: m.BatchNormRegularizerVisualizer })));
const BatchNormStepByStep = lazy(() => import("@/components/lab/mlp/BatchNormStepByStep").then(m => ({ default: m.BatchNormStepByStep })));
const GammaBetaVisualizer = lazy(() => import("@/components/lab/mlp/GammaBetaVisualizer").then(m => ({ default: m.GammaBetaVisualizer })));
const NormComparisonDiagram = lazy(() => import("@/components/lab/mlp/NormComparisonDiagram").then(m => ({ default: m.NormComparisonDiagram })));
const ResidualGradientHighway = lazy(() => import("@/components/lab/mlp/ResidualGradientHighway").then(m => ({ default: m.ResidualGradientHighway })));
const ResidualHighwayVisual = lazy(() => import("@/components/lab/mlp/ResidualHighwayVisual").then(m => ({ default: m.ResidualHighwayVisual })));
const BNArchitectureVisualizer = lazy(() => import("@/components/lab/mlp/BNArchitectureVisualizer").then(m => ({ default: m.BNArchitectureVisualizer })));
const ResidualDiscoveryVisualizer = lazy(() => import("@/components/lab/mlp/ResidualDiscoveryVisualizer").then(m => ({ default: m.ResidualDiscoveryVisualizer })));
const ResidualProjectionVisualizer = lazy(() => import("@/components/lab/mlp/ResidualProjectionVisualizer").then(m => ({ default: m.ResidualProjectionVisualizer })));
const ResidualBNArchitectureVisualizer = lazy(() => import("@/components/lab/mlp/ResidualBNArchitectureVisualizer").then(m => ({ default: m.ResidualBNArchitectureVisualizer })));

const DeepModelRedemptionDemo = lazy(() => import("@/components/lab/mlp/DeepModelRedemptionDemo").then(m => ({ default: m.DeepModelRedemptionDemo })));
// §08 — The Perfect Recipe
const HyperparameterAnatomyVisualizer = lazy(() => import("@/components/lab/mlp/HyperparameterAnatomyVisualizer").then(m => ({ default: m.HyperparameterAnatomyVisualizer })));
const MLPHyperparameterExplorer = lazy(() => import("@/components/lab/mlp/MLPHyperparameterExplorer").then(m => ({ default: m.MLPHyperparameterExplorer })));
const ParameterWallVisualizer = lazy(() => import("@/components/lab/mlp/ParameterWallVisualizer").then(m => ({ default: m.ParameterWallVisualizer })));
const OverfittingDetectiveChallenge = lazy(() => import("@/components/lab/mlp/OverfittingDetectiveChallenge").then(m => ({ default: m.OverfittingDetectiveChallenge })));
const DropoutVisualizer = lazy(() => import("@/components/lab/mlp/DropoutVisualizer").then(m => ({ default: m.DropoutVisualizer })));
const LearningRateIntuition = lazy(() => import("@/components/lab/mlp/LearningRateIntuition").then(m => ({ default: m.LearningRateIntuition })));
const LRSweepVisualizer = lazy(() => import("@/components/lab/mlp/LRSweepVisualizer").then(m => ({ default: m.LRSweepVisualizer })));
const DropoutExperimentViz = lazy(() => import("@/components/lab/mlp/DropoutExperimentViz").then(m => ({ default: m.DropoutExperimentViz })));
const OvertrainingTimelineViz = lazy(() => import("@/components/lab/mlp/OvertrainingTimelineViz").then(m => ({ default: m.OvertrainingTimelineViz })));
const WeightTyingVisualizer = lazy(() => import("@/components/lab/mlp/WeightTyingVisualizer").then(m => ({ default: m.WeightTyingVisualizer })));
// §07b — Scale experiments
const ScaleStabilityExperiment = lazy(() => import("@/components/lab/mlp/ScaleStabilityExperiment").then(m => ({ default: m.ScaleStabilityExperiment })));
// §07b — Stability technique grid
const StabilityTechniqueGrid = lazy(() => import("@/components/lab/mlp/StabilityTechniqueGrid").then(m => ({ default: m.StabilityTechniqueGrid })));
// §09 — Limitations
const BigModelLimitationViz = lazy(() => import("@/components/lab/mlp/BigModelLimitationViz").then(m => ({ default: m.BigModelLimitationViz })));
const DataSizeExperiment = lazy(() => import("@/components/lab/mlp/DataSizeExperiment").then(m => ({ default: m.DataSizeExperiment })));
const ContextMeaningDemo = lazy(() => import("@/components/lab/mlp/ContextMeaningDemo").then(m => ({ default: m.ContextMeaningDemo })));
const ContextWindowVisualizer = lazy(() => import("@/components/lab/mlp/ContextWindowVisualizer").then(m => ({ default: m.ContextWindowVisualizer })));
const PositionSensitivityVisualizer = lazy(() => import("@/components/lab/mlp/PositionSensitivityVisualizer").then(m => ({ default: m.PositionSensitivityVisualizer })));
const LongRangeDependencyDemo = lazy(() => import("@/components/lab/mlp/LongRangeDependencyDemo").then(m => ({ default: m.LongRangeDependencyDemo })));
const ConcatenationBottleneckVisualizer = lazy(() => import("@/components/lab/mlp/ConcatenationBottleneckVisualizer").then(m => ({ default: m.ConcatenationBottleneckVisualizer })));
const ArchitectureWishlistBuilder = lazy(() => import("@/components/lab/mlp/ArchitectureWishlistBuilder").then(m => ({ default: m.ArchitectureWishlistBuilder })));
// §09 — Finale
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
                    "mlp-03": "Inside the Eyes",
                    "mlp-04": "Inside the Brain",
                    "mlp-05": "Going Big",
                    "mlp-06": "When It Breaks",
                    "mlp-07": "Taming the Beast",
                    "mlp-08": "The Perfect Recipe",
                    "mlp-09": "The Monster That Can't See",
                }}
            />
            <SectionProgressBar
                sections={[
                    { id: "mlp-01", label: "01", name: "Monster" },
                    { id: "mlp-02", label: "02", name: "Seeing" },
                    { id: "mlp-03", label: "03", name: "Eyes" },
                    { id: "mlp-04", label: "04", name: "Brain" },
                    { id: "mlp-05", label: "05", name: "Big" },
                    { id: "mlp-06", label: "06", name: "Breaking" },
                    { id: "mlp-07", label: "07", name: "Taming" },
                    { id: "mlp-08", label: "08", name: "Recipe" },
                    { id: "mlp-09", label: "09", name: "Can't See" },
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

                {/* ── Bridge from NN chapter ── */}
                <P><em>{t("models.mlp.narrative.s01.pPreviouslyOn")}</em></P>

                {/* ── PART A: What IS an MLP? — Visual-first intro ── */}
                <P>{t("models.mlp.narrative.s01.pMonsterIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s01.archLabel")} hint={t("models.mlp.narrative.s01.archHint")}>
                        <Suspense fallback={<SectionSkeleton />}><MLPNetworkDiagram /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s01.pMlpNameBreakdown")}</P>

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

                {/* ── PART E: Shock reaction ── */}
                <PullQuote>{t("models.mlp.narrative.s01.pShockReaction")}</PullQuote>

                {/* ── Investigate: guide user to discover the problem ── */}
                <P>{t("models.mlp.narrative.s01.pInvestigateBridge")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s01.figLabel2")} hint={t("models.mlp.narrative.s01.figHint2")}>
                        <Suspense fallback={<SectionSkeleton />}><CharacterSimilarityBlindness /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── After seeing the problem — dramatic blindness callout ── */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="my-8 rounded-2xl border-2 border-red-500/20 bg-gradient-to-br from-red-500/[0.06] to-amber-500/[0.03] p-6 space-y-3"
                >
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                        <p className="text-sm font-mono font-bold text-red-400">
                            {t("models.mlp.narrative.s01.blindnessCalloutTitle")}
                        </p>
                    </div>
                    <p className="text-[13px] text-white/50 leading-relaxed">
                        {t("models.mlp.narrative.s01.pBlindness")}
                    </p>
                </motion.div>

                {/* ── Not the only problem ── */}
                <P>{t("models.mlp.narrative.s01.pNotOnlyProblem")}</P>

                {/* ── The path forward ── */}
                <P>{t("models.mlp.narrative.s01.pTameFraming")}</P>

                {/* ── Monster status + closing ── */}
                <MonsterStatus>{t("models.mlp.narrative.s01.pMonsterStatus")}</MonsterStatus>
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
                    {t("models.mlp.narrative.s02.p2")}
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

            {/* ─────────── 03 · INSIDE THE EYES ─────────── */}
            <Section id="mlp-03">
                <SectionLabel number={t("models.mlp.narrative.sections.s03.number")} label={t("models.mlp.narrative.sections.s03.label")} />
                <SectionAnchor id="mlp-03"><Heading>{t("models.mlp.narrative.s03.heading")}</Heading></SectionAnchor>
                <Lead>{t("models.mlp.narrative.s03.lead")}</Lead>

                {/* ── Phase A: How Embeddings Learn ── */}
                <P>{t("models.mlp.narrative.s03.pEyesIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s03.figLabelBackpropEmb")} hint={t("models.mlp.narrative.s03.figHintBackpropEmb")}>
                        <Suspense fallback={<SectionSkeleton />}><BackpropEmbeddingVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s03.pEyesBridge")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s03.figLabel1")} hint={t("models.mlp.narrative.s03.figHint1")}>
                        <Suspense fallback={<SectionSkeleton />}><EmbeddingTrainingTimelapse /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Phase B: What Embeddings Learned (4-model category comparison) ── */}
                <P>{t("models.mlp.narrative.s03.pCategoryIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s03.figLabelCategory")} hint={t("models.mlp.narrative.s03.figHintCategory")}>
                        <Suspense fallback={<SectionSkeleton />}><EmbeddingCategoryAnalyzer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s03.pCategoryInsight")}</P>

                {/* ── Bottleneck Explorer (promoted to main flow) ── */}
                <P>{t("models.mlp.narrative.s03.pBottleneckIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s03.figLabelBottleneck")} hint={t("models.mlp.narrative.s03.figHintBottleneck")}>
                        <Suspense fallback={<SectionSkeleton />}><EmbeddingBottleneckExplorer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Measuring Embedding Distance ── */}
                <P>{t("models.mlp.narrative.s03.pDistanceConceptIntro")}</P>
                <LazySection>
                    <Suspense fallback={<SectionSkeleton />}><DistanceConceptVisualizer /></Suspense>
                </LazySection>
                <P>
                    {t("models.mlp.narrative.s03.p3")}{" "}
                    <Highlight>{t("models.mlp.narrative.s03.p3H1")}</Highlight>
                    {t("models.mlp.narrative.s03.p3Mid")}{" "}
                    <Highlight color="emerald">{t("models.mlp.narrative.s03.p3H2")}</Highlight>
                    {t("models.mlp.narrative.s03.p3End")}
                </P>
                <TrainingChallengePanel
                    title={t("models.mlp.narrative.s03.panelDistanceTitle")}
                    preview={t("models.mlp.narrative.s03.panelDistancePreview")}
                    category="challenge"
                    difficulty={1}
                >
                    <Suspense fallback={<SectionSkeleton />}><EmbeddingDistanceCalculator /></Suspense>
                </TrainingChallengePanel>

                {/* ── Prediction Challenge ── */}
                <P>{t("models.mlp.narrative.s03.pPredictionIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s03.figLabelPrediction")} hint={t("models.mlp.narrative.s03.figHintPrediction")}>
                        <Suspense fallback={<SectionSkeleton />}><EmbeddingPredictionChallenge /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Word Embedding Analogy (illustrative, clearly labeled) ── */}
                <P>{t("models.mlp.narrative.s03.pAnalogyIntro")}</P>
                <P>{t("models.mlp.narrative.s03.pAnalogyIntro2")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s03.figLabelAnalogy")} hint={t("models.mlp.narrative.s03.figHintAnalogy")}>
                        <Suspense fallback={<SectionSkeleton />}><WordEmbeddingAnalogyDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <KeyTakeaway accent="violet">
                    {t("models.mlp.narrative.s03.takeaway")}
                </KeyTakeaway>

                {/* ── Panels (optional deep-dives) ── */}
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

                <TrainingChallengePanel
                    title={t("models.mlp.narrative.s04.panelWeightTyingTitle")}
                    preview={t("models.mlp.narrative.s04.panelWeightTyingPreview")}
                    category="deepdive"
                    difficulty={2}
                >
                    <P>{t("models.mlp.narrative.s04.pWeightTyingIntro")}</P>
                    <FigureWrapper label={t("models.mlp.narrative.s04.figLabelWeightTying")} hint={t("models.mlp.narrative.s04.figHintWeightTying")}>
                        <Suspense fallback={<SectionSkeleton />}><WeightTyingVisualizer /></Suspense>
                    </FigureWrapper>
                </TrainingChallengePanel>
            </Section>

            <SectionBreak />
            <MonsterInterlude>{t("models.mlp.narrative.monsterInterludes.after03")}</MonsterInterlude>

            {/* ─────────── 04 · INSIDE THE BRAIN ─────────── */}
            <Section id="mlp-04">
                <SectionLabel number={t("models.mlp.narrative.sections.s04.number")} label={t("models.mlp.narrative.sections.s04.label")} />
                <SectionAnchor id="mlp-04"><Heading>{t("models.mlp.narrative.s04.heading")}</Heading></SectionAnchor>
                <Lead>{t("models.mlp.narrative.s04.lead")}</Lead>

                {/* ── Phase A: The Forward Pass ── */}
                <P>{t("models.mlp.narrative.s04.pBrainIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s03.figLabelForwardPass")} hint={t("models.mlp.narrative.s03.figHintForwardPass")}>
                        <Suspense fallback={<SectionSkeleton />}><MLPForwardPassAnimator /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s03.pPipelineIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s03.figLabelPipeline")} hint={t("models.mlp.narrative.s03.figHintPipeline")}>
                        <Suspense fallback={<SectionSkeleton />}><MLPPipelineVisualizer selectedConfig={null} /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Output → Softmax explanation ── */}
                <P>{t("models.mlp.narrative.s04.pOutputExplanation")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s04.figLabelSoftmax")} hint={t("models.mlp.narrative.s04.figHintSoftmax")}>
                        <Suspense fallback={<SectionSkeleton />}><SoftmaxStepVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Phase B: Why Hidden Layers Exist ── */}
                <P>{t("models.mlp.narrative.s04.pWhyHiddenLayers")}</P>
                <P>{t("models.mlp.narrative.s04.pHiddenLayerProof")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s03.figLabelTrigram")} hint={t("models.mlp.narrative.s03.figHintTrigram")}>
                        <Suspense fallback={<SectionSkeleton />}><TrigramEquivalenceDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Phase C: What Each Neuron Does ── */}
                <P>{t("models.mlp.narrative.s04.pBrainNeuronIntro")}</P>
                <P>{t("models.mlp.narrative.s03.pHiddenLayerSecret")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s03.figLabelNeurons")} hint={t("models.mlp.narrative.s03.figHintNeurons")}>
                        <Suspense fallback={<SectionSkeleton />}><NeuronActivationExplorer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s03.pNeuronInsight")}</P>

                {/* ── Phase D: The Black Box — Polysemanticity + Ablation ── */}
                <P>{t("models.mlp.narrative.s04.pBrainPolysemanticity")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s04.figLabelPolysemanticity")} hint={t("models.mlp.narrative.s04.figHintPolysemanticity")}>
                        <Suspense fallback={<SectionSkeleton />}><PolysemanticitySplitDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s04.pPolysemanticity2")}</P>
                <P>{t("models.mlp.narrative.s04.pAblationIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s04.figLabelAblation")} hint={t("models.mlp.narrative.s04.figHintAblation")}>
                        <Suspense fallback={<SectionSkeleton />}><NeuronAblationExplorer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s04.pBlackBoxConnection")}</P>

                {/* ── ChatGPT Checkpoint ── */}
                <Callout icon={BrainCircuit} accent="emerald" title={t("models.mlp.narrative.s03.pChatGPTCheck1")}>
                    <p>{t("models.mlp.narrative.s03.chatGPTCheck1Sub")}</p>
                </Callout>

                <KeyTakeaway accent="violet">
                    {t("models.mlp.narrative.s04.takeaway")}
                </KeyTakeaway>
            </Section>

            <SectionBreak />
            <MonsterInterlude>{t("models.mlp.narrative.monsterInterludes.after04")}</MonsterInterlude>

            {/* ─────────── 05 · CAN WE MAKE IT BIGGER? ─────────── */}
            <Section id="mlp-05">
                <SectionLabel number={t("models.mlp.narrative.sections.s05.number")} label={t("models.mlp.narrative.sections.s05.label")} />
                <SectionAnchor id="mlp-05"><Heading>{t("models.mlp.narrative.s05.heading")}</Heading></SectionAnchor>
                <Lead>{t("models.mlp.narrative.s05.lead")}</Lead>

                {/* ── PART A: Why depth? — real world proof ── */}
                <P>{t("models.mlp.narrative.s05.pWhyDepthIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s05.figLabelMotivation")} hint={t("models.mlp.narrative.s05.figHintMotivation")}>
                        <Suspense fallback={<SectionSkeleton />}><DepthMotivationViz /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s05.pDepthMotivationBridge")}</P>

                {/* ── PART A2: What shape? ── */}
                <TrainingChallengePanel
                    title={t("models.mlp.narrative.s05.panelShapeTitle")}
                    preview={t("models.mlp.narrative.s05.panelShapePreview")}
                    category="deepdive"
                    difficulty={1}
                >
                    <P>{t("models.mlp.narrative.s05.pHopeIntro")}</P>
                    <FigureWrapper label={t("models.mlp.narrative.s05.figLabelShape")} hint={t("models.mlp.narrative.s05.figHintShape")}>
                        <Suspense fallback={<SectionSkeleton />}><NetworkShapeComparison /></Suspense>
                    </FigureWrapper>
                </TrainingChallengePanel>

                <P>{t("models.mlp.narrative.s05.pShapeBridge")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s05.figLabelDepth")} hint={t("models.mlp.narrative.s05.figHintDepth")}>
                        <Suspense fallback={<SectionSkeleton />}><RealDepthComparisonTrainer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── PART B: Shock — what's going on?? ── */}
                <P>{t("models.mlp.narrative.s05.pCelebration")}</P>
                <P>{t("models.mlp.narrative.s05.pShock")}</P>

                {/* Dramatic bridge */}
                <div className="my-8 text-center">
                    <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-red-400 via-amber-400 to-red-400 bg-clip-text text-transparent">
                        {t("models.mlp.narrative.s05.pWhatIsHappening")}
                    </p>
                    <p className="text-sm text-white/30 mt-2">
                        {t("models.mlp.narrative.s05.pWhatIsHappeningSub")}
                    </p>
                </div>

                {/* ── PART B2: Dead neurons — the evidence ── */}
                <P>{t("models.mlp.narrative.s05.pDeadNeuronIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s05.figLabelDeadNeuron")} hint={t("models.mlp.narrative.s05.figHintDeadNeuron")}>
                        <Suspense fallback={<SectionSkeleton />}><DeadNeuronVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s05.pDeadNeuronReveal")}</P>

                {/* ── PART C: Investigation — tanh saturation ── */}
                <P>{t("models.mlp.narrative.s05.pInvestigationIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s05.figLabelTanh")} hint={t("models.mlp.narrative.s05.figHintTanh")}>
                        <Suspense fallback={<SectionSkeleton />}><TanhSaturationDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s05.pPitfall4Metaphor")}</P>

                <TrainingChallengePanel
                    title={t("models.mlp.narrative.s05.panelBattleTitle")}
                    preview={t("models.mlp.narrative.s05.panelBattlePreview")}
                    category="deepdive"
                    difficulty={2}
                >
                    <P>{t("models.mlp.narrative.s05.pActivationBattleBridge")}</P>
                    <FigureWrapper label={t("models.mlp.narrative.s05.figLabelBattle")} hint={t("models.mlp.narrative.s05.figHintBattle")}>
                        <Suspense fallback={<SectionSkeleton />}><ActivationBattleVisualizer /></Suspense>
                    </FigureWrapper>
                    <P>{t("models.mlp.narrative.s05.pActivationBattleInsight")}</P>
                </TrainingChallengePanel>

                {/* ── PART D: Activation histograms ── */}
                <P>
                    {t("models.mlp.narrative.s05.pHistogramBridge")}{" "}
                    <Highlight color="amber">{t("models.mlp.narrative.s05.pHistogramH1")}</Highlight>
                    {t("models.mlp.narrative.s05.pHistogramEnd")}
                </P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s05.figLabelHistogram")} hint={t("models.mlp.narrative.s05.figHintHistogram")}>
                        <Suspense fallback={<SectionSkeleton />}><ActivationHistogramVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── PART E: Dead layer cascade ── */}
                <P>{t("models.mlp.narrative.s05.pDeadNeuronsBridge")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s05.figLabelCascade")} hint={t("models.mlp.narrative.s05.figHintCascade")}>
                        <Suspense fallback={<SectionSkeleton />}><DeadLayerCascadeVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s05.pNeverLearnsAgain")}</P>

                {/* ── End bridge ── */}
                <P>{t("models.mlp.narrative.s05.pEndBridge")}</P>
            </Section>

            <SectionBreak />
            <MonsterInterlude>{t("models.mlp.narrative.monsterInterludes.after05")}</MonsterInterlude>

            {/* ─────────── 06 · WHY DEEP BREAKS ─────────── */}
            <Section id="mlp-06">
                <SectionLabel number={t("models.mlp.narrative.sections.s06.number")} label={t("models.mlp.narrative.sections.s06.label")} />
                <SectionAnchor id="mlp-06"><Heading>{t("models.mlp.narrative.s06.heading")}</Heading></SectionAnchor>
                <Lead>{t("models.mlp.narrative.s06.lead")}</Lead>

                {/* ── PART A: Initial Loss Catastrophe — devastating opener ── */}
                <P>{t("models.mlp.narrative.s06.pInitialLossIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s06.figLabelInitLoss")} hint={t("models.mlp.narrative.s06.figHintInitLoss")}>
                        <Suspense fallback={<SectionSkeleton />}><InitialLossCatastropheViz /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── PART B: Worse than random — WHY it happens ── */}
                <P>{t("models.mlp.narrative.s06.pWorseThanRandom")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s06.figLabelWorse")} hint={t("models.mlp.narrative.s06.figHintWorse")}>
                        <Suspense fallback={<SectionSkeleton />}><WorseThanRandomVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── PART C: Where do weights come from? ── */}
                <P>{t("models.mlp.narrative.s06.pGaussianIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s06.figLabelGaussian")} hint={t("models.mlp.narrative.s06.figHintGaussian")}>
                        <Suspense fallback={<SectionSkeleton />}><GaussianDistributionExplorer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── PART D: Init scale sensitivity ── */}
                <P>{t("models.mlp.narrative.s06.pInitBad")}</P>
                <P>{t("models.mlp.narrative.s06.p1")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s06.figLabel1")} hint={t("models.mlp.narrative.s06.figHint1")}>
                        <Suspense fallback={<SectionSkeleton />}><InitializationSensitivityVisualizer timeline={mlpGrid.timeline} /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── PART E: Backprop chain rule ── */}
                <P>{t("models.mlp.narrative.s06.pGradientBridge")}</P>
                <P>{t("models.mlp.narrative.s06.pBackpropExplain")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s06.figLabelBackprop")} hint={t("models.mlp.narrative.s06.figHintBackprop")}>
                        <Suspense fallback={<SectionSkeleton />}><BackpropVanishingCalculator /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── PART F: Gradient flow — real model data ── */}
                <P>{t("models.mlp.narrative.s06.pGradientFlowIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s06.figLabel4")} hint={t("models.mlp.narrative.s06.figHint4")}>
                        <Suspense fallback={<SectionSkeleton />}><GradientFlowVisualizer timeline={mlpGrid.timeline} /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Diagnosis complete → solutions bridge ── */}
                <P>{t("models.mlp.narrative.s06.pDiagnosisComplete")}</P>
                <P>{t("models.mlp.narrative.s06.pSolutionsBridge")}</P>
            </Section>

            <SectionBreak />
            <MonsterInterlude>{t("models.mlp.narrative.monsterInterludes.after06")}</MonsterInterlude>

            {/* ─────────── 07 · TAMING THE MONSTER ─────────── */}
            <Section id="mlp-07">
                <SectionLabel number={t("models.mlp.narrative.sections.s07.number")} label={t("models.mlp.narrative.sections.s07.label")} />
                <SectionAnchor id="mlp-07"><Heading>{t("models.mlp.narrative.s07.heading")}</Heading></SectionAnchor>
                <Lead>{t("models.mlp.narrative.s07.lead")}</Lead>

                <P>{t("models.mlp.narrative.s07.pSolutionsIntro")}</P>

                {/* ══════════ Solution 1: Kaiming Initialization ══════════ */}
                <P>{t("models.mlp.narrative.s07.pKaimingProblem")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabelVariance")} hint={t("models.mlp.narrative.s07.figHintVariance")}>
                        <Suspense fallback={<SectionSkeleton />}><VarianceExplosionVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabelKaiming")} hint={t("models.mlp.narrative.s07.figHintKaiming")}>
                        <Suspense fallback={<SectionSkeleton />}><KaimingScalingVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s07.pSmallNetworkSurvival")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabelShallowDeep")} hint={t("models.mlp.narrative.s07.figHintShallowDeep")}>
                        <Suspense fallback={<SectionSkeleton />}><ShallowVsDeepComparison /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s07.pKaimingTraining")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabelInitComp")} hint={t("models.mlp.narrative.s07.figHintInitComp")}>
                        <Suspense fallback={<SectionSkeleton />}><InitializationComparisonTrainer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ══════════ Solution 2: BatchNorm (discovery approach) ══════════ */}
                <P>{t("models.mlp.narrative.s07.pDriftProblem")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabelDrift")} hint={t("models.mlp.narrative.s07.figHintDrift")}>
                        <Suspense fallback={<SectionSkeleton />}><ActivationDriftVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s07.pBNQuestion")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabelBNDiscovery")} hint={t("models.mlp.narrative.s07.figHintBNDiscovery")}>
                        <Suspense fallback={<SectionSkeleton />}><BatchNormDiscoveryVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s07.pBNReveal")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabelBNEffect")} hint={t("models.mlp.narrative.s07.figHintBNEffect")}>
                        <Suspense fallback={<SectionSkeleton />}><BatchNormEffectVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s07.pBNRegularization")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabelBNReg")} hint={t("models.mlp.narrative.s07.figHintBNReg")}>
                        <Suspense fallback={<SectionSkeleton />}><BatchNormRegularizerVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── BN formula + γ/β + step-by-step → hidden panel ── */}
                <TrainingChallengePanel
                    title={t("models.mlp.narrative.s07.panelBNFormulaTitle")}
                    preview={t("models.mlp.narrative.s07.panelBNFormulaPreview")}
                    category="deepdive"
                    difficulty={3}
                >
                    <P>{t("models.mlp.narrative.s07.pBNFormula")}</P>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabelBNSteps")} hint={t("models.mlp.narrative.s07.figHintBNSteps")}>
                        <Suspense fallback={<SectionSkeleton />}><BatchNormStepByStep /></Suspense>
                    </FigureWrapper>
                    <P>{t("models.mlp.narrative.s07.pGammaBeta")}</P>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabelGammaBeta")} hint={t("models.mlp.narrative.s07.figHintGammaBeta")}>
                        <Suspense fallback={<SectionSkeleton />}><GammaBetaVisualizer /></Suspense>
                    </FigureWrapper>
                </TrainingChallengePanel>

                {/* ══════════ BN Architecture: what the network looks like now ══════════ */}
                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabelBNArch")} hint={t("models.mlp.narrative.s07.figHintBNArch")}>
                        <Suspense fallback={<SectionSkeleton />}><BNArchitectureVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ══════════ Solution 3: Residual Connections ══════════ */}
                <P>{t("models.mlp.narrative.s07.pResidualProblem")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabelResDiscovery")} hint={t("models.mlp.narrative.s07.figHintResDiscovery")}>
                        <Suspense fallback={<SectionSkeleton />}><ResidualDiscoveryVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s07.pResidualSolution")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabelHighway")} hint={t("models.mlp.narrative.s07.figHintHighway")}>
                        <Suspense fallback={<SectionSkeleton />}><ResidualHighwayVisual /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s07.pResidualGradientSimple")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabelResGrad")} hint={t("models.mlp.narrative.s07.figHintResGrad")}>
                        <Suspense fallback={<SectionSkeleton />}><ResidualGradientHighway /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabelResBNArch")} hint={t("models.mlp.narrative.s07.figHintResBNArch")}>
                        <Suspense fallback={<SectionSkeleton />}><ResidualBNArchitectureVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s07.pWhyDeepWorks")}</P>

                {/* ══════════ Full stability grid ══════════ */}
                <P>{t("models.mlp.narrative.s07.pStabilityGrid")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabelStability")} hint={t("models.mlp.narrative.s07.figHintStability")}>
                        <Suspense fallback={<SectionSkeleton />}><StabilityTechniqueGrid /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <Callout icon={Lightbulb} accent="violet" title={t("models.mlp.narrative.s07.calloutTitle")}>
                    <p>{t("models.mlp.narrative.s07.calloutText")}</p>
                </Callout>

                {/* ══════════ REDEMPTION: before/after comparison ══════════ */}
                <P>{t("models.mlp.narrative.s07.pRedemptionIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabelRedemption")} hint={t("models.mlp.narrative.s07.figHintRedemption")}>
                        <Suspense fallback={<SectionSkeleton />}><DeepModelRedemptionDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s07.pRedemptionResult")}</P>

                {/* Monster status banner */}
                <MonsterStatus gradient="emerald-violet">{t("models.mlp.narrative.s07.pMonsterTamed")}</MonsterStatus>

                {/* ── Hidden panel: Scale Stability Experiment ── */}
                <TrainingChallengePanel
                    title={t("models.mlp.narrative.s07.panelScaleTitle")}
                    preview={t("models.mlp.narrative.s07.panelScalePreview")}
                    category="deepdive"
                    difficulty={3}
                >
                    <P>{t("models.mlp.narrative.s07.pScaleIntro")}</P>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabelScale")} hint={t("models.mlp.narrative.s07.figHintScale")}>
                        <Suspense fallback={<SectionSkeleton />}><ScaleStabilityExperiment /></Suspense>
                    </FigureWrapper>
                    <P>{t("models.mlp.narrative.s07.pScaleLesson")}</P>
                </TrainingChallengePanel>

                {/* ── Hidden panel: BN problems + LayerNorm ── */}
                <TrainingChallengePanel
                    title={t("models.mlp.narrative.s07.panelLayerNormTitle")}
                    preview={t("models.mlp.narrative.s07.panelLayerNormPreview")}
                    category="deepdive"
                    difficulty={2}
                >
                    <P>{t("models.mlp.narrative.s07.panelBNProblems")}</P>
                    <P>{t("models.mlp.narrative.s07.panelBNLayerNorm")}</P>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabelNormCompare")} hint={t("models.mlp.narrative.s07.figHintNormCompare")}>
                        <Suspense fallback={<SectionSkeleton />}><NormComparisonDiagram /></Suspense>
                    </FigureWrapper>
                </TrainingChallengePanel>

                {/* ── Hidden panel: Residual details ── */}
                <TrainingChallengePanel
                    title={t("models.mlp.narrative.s07.panelResDeepTitle")}
                    preview={t("models.mlp.narrative.s07.panelResDeepPreview")}
                    category="deepdive"
                    difficulty={2}
                >
                    <P>{t("models.mlp.narrative.s07.panelResProjection")}</P>
                    <P>{t("models.mlp.narrative.s07.panelResWhyName")}</P>
                    <FigureWrapper label={t("models.mlp.narrative.s07.figLabelResProjection")} hint={t("models.mlp.narrative.s07.figHintResProjection")}>
                        <Suspense fallback={<SectionSkeleton />}><ResidualProjectionVisualizer /></Suspense>
                    </FigureWrapper>
                </TrainingChallengePanel>

                <KeyTakeaway accent="violet">
                    {t("models.mlp.narrative.s07.takeaway")}
                </KeyTakeaway>
            </Section>

            <SectionBreak />
            <MonsterInterlude>{t("models.mlp.narrative.monsterInterludes.after07")}</MonsterInterlude>

            {/* ─────────── 08 · THE PERFECT RECIPE ─────────── */}
            <Section id="mlp-08">
                <SectionLabel number={t("models.mlp.narrative.sections.s08.number")} label={t("models.mlp.narrative.sections.s08.label")} />
                <SectionAnchor id="mlp-08"><Heading>{t("models.mlp.narrative.s08.heading")}</Heading></SectionAnchor>
                <Lead>{t("models.mlp.narrative.s08.lead")}</Lead>

                {/* ══════════ Act 1: The Control Panel ══════════ */}
                <P>{t("models.mlp.narrative.s08.pKnobsIntro")}</P>
                <P>{t("models.mlp.narrative.s08.pKnobsList")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabelAnatomy")} hint={t("models.mlp.narrative.s08.figHintAnatomy")}>
                        <Suspense fallback={<SectionSkeleton />}><HyperparameterAnatomyVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s08.pAnatomyInsight")}</P>

                {/* ══════════ Act 2: The Grand Experiment ══════════ */}
                <P>{t("models.mlp.narrative.s08.pExplorerIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabelExplorer")} hint={t("models.mlp.narrative.s08.figHintExplorer")}>
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
                                generationError={mlpGrid.generationError}
                                onGenerate={mlpGrid.generateText}
                                gridLoading={mlpGrid.gridLoading}
                                gridError={mlpGrid.gridError}
                                isNarrativeMode={true}
                            />
                        </Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s08.pExplorerReflection")}</P>

                {/* ══════════ Act 3: Patterns in the Data ══════════ */}
                <P>{t("models.mlp.narrative.s08.pWallIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabelWall")} hint={t("models.mlp.narrative.s08.figHintWall")}>
                        <Suspense fallback={<SectionSkeleton />}>
                            <ParameterWallVisualizer configs={mlpGrid.configs} />
                        </Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s08.pWallInsight")}</P>

                {/* ══════════ Act 4: The Overfitting Trap ══════════ */}
                <P>{t("models.mlp.narrative.s08.pOverfittingBridge")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabelDetective")} hint={t("models.mlp.narrative.s08.figHintDetective")}>
                        <Suspense fallback={<SectionSkeleton />}><OverfittingDetectiveChallenge /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s08.pDropoutIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabelDropout")} hint={t("models.mlp.narrative.s08.figHintDropout")}>
                        <Suspense fallback={<SectionSkeleton />}><DropoutVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s08.pDropoutInsight")}</P>

                <TrainingChallengePanel
                    title={t("models.mlp.narrative.s08.panelDropoutExpTitle")}
                    preview={t("models.mlp.narrative.s08.panelDropoutExpPreview")}
                    category="experiment"
                    difficulty={2}
                >
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabelDropoutExp")} hint={t("models.mlp.narrative.s08.figHintDropoutExp")}>
                        <Suspense fallback={<SectionSkeleton />}><DropoutExperimentViz /></Suspense>
                    </FigureWrapper>
                </TrainingChallengePanel>

                {/* ══════════ Act 5: Learning Rate — The Hidden Killer ══════════ */}
                <P>{t("models.mlp.narrative.s08.pLRIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabelLR")} hint={t("models.mlp.narrative.s08.figHintLR")}>
                        <Suspense fallback={<SectionSkeleton />}><LearningRateIntuition /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s08.pLRInsight")}</P>

                <TrainingChallengePanel
                    title={t("models.mlp.narrative.s08.panelLRSweepTitle")}
                    preview={t("models.mlp.narrative.s08.panelLRSweepPreview")}
                    category="experiment"
                    difficulty={2}
                >
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabelLRSweep")} hint={t("models.mlp.narrative.s08.figHintLRSweep")}>
                        <Suspense fallback={<SectionSkeleton />}><LRSweepVisualizer /></Suspense>
                    </FigureWrapper>
                </TrainingChallengePanel>

                {/* ══════════ Act 6: The Overfitting Story ══════════ */}
                <P>{t("models.mlp.narrative.s08.pOvertrainingIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s08.figLabelOvertraining")} hint={t("models.mlp.narrative.s08.figHintOvertraining")}>
                        <Suspense fallback={<SectionSkeleton />}><OvertrainingTimelineViz /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("models.mlp.narrative.s08.pOvertrainingInsight")}</P>

                {/* ══════════ Capstone ══════════ */}
                <P>{t("models.mlp.narrative.s08.pRecipeConclusion")}</P>

                <Callout icon={Lightbulb} accent="violet" title={t("models.mlp.narrative.s08.calloutTitle")}>
                    <p>{t("models.mlp.narrative.s08.calloutText")}</p>
                </Callout>

                {/* ── ChatGPT Checkpoint₂ ── */}
                <Callout icon={BrainCircuit} accent="violet" title={t("models.mlp.narrative.s08.pChatGPTCheck2")}>
                    <p>{t("models.mlp.narrative.s08.chatGPTCheck2Sub")}</p>
                </Callout>

                <KeyTakeaway accent="violet">
                    {t("models.mlp.narrative.s08.takeaway")}
                </KeyTakeaway>
            </Section>

            <SectionBreak />
            <MonsterInterlude>{t("models.mlp.narrative.monsterInterludes.after08")}</MonsterInterlude>

            {/* ─────────── 09 · THE MONSTER THAT CAN'T SEE ─────────── */}
            <Section id="mlp-09">
                <SectionLabel number={t("models.mlp.narrative.sections.s09.number")} label={t("models.mlp.narrative.sections.s09.label")} />
                <SectionAnchor id="mlp-09"><Heading>{t("models.mlp.narrative.s09.heading")}</Heading></SectionAnchor>
                <Lead>{t("models.mlp.narrative.s09.lead")}</Lead>

                {/* ══════════ Big model wall ══════════ */}
                <P>{t("models.mlp.narrative.s09.pBigModelIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s09.figLabelBigModel")} hint={t("models.mlp.narrative.s09.figHintBigModel")}>
                        <Suspense fallback={<SectionSkeleton />}><BigModelLimitationViz /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ── Data size experiment (hidden panel) ── */}
                <TrainingChallengePanel
                    title={t("models.mlp.narrative.s09.panelDataSizeTitle")}
                    preview={t("models.mlp.narrative.s09.panelDataSizePreview")}
                    category="deepdive"
                    difficulty={2}
                >
                    <P>{t("models.mlp.narrative.s09.pDataSizeIntro")}</P>
                    <FigureWrapper label={t("models.mlp.narrative.s09.figLabelDataSize")} hint={t("models.mlp.narrative.s09.figHintDataSize")}>
                        <Suspense fallback={<SectionSkeleton />}><DataSizeExperiment /></Suspense>
                    </FigureWrapper>
                </TrainingChallengePanel>

                {/* ══════════ Limitation 1: Fixed window ══════════ */}
                <P>
                    <Highlight color="amber">{t("models.mlp.narrative.s09.p2H1")}</Highlight>{" "}
                    {t("models.mlp.narrative.s09.p2")}
                </P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s09.figLabel2")} hint={t("models.mlp.narrative.s09.figHint2")}>
                        <Suspense fallback={<SectionSkeleton />}><ContextWindowVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s09.figLabel5")} hint={t("models.mlp.narrative.s09.figHint5")}>
                        <Suspense fallback={<SectionSkeleton />}><LongRangeDependencyDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ══════════ Limitation 2: Position = identity crisis (merged old 2+4) ══════════ */}
                <P>
                    <Highlight color="amber">{t("models.mlp.narrative.s09.p3H1")}</Highlight>{" "}
                    {t("models.mlp.narrative.s09.p3")}
                </P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s09.figLabel3")} hint={t("models.mlp.narrative.s09.figHint3")}>
                        <Suspense fallback={<SectionSkeleton />}><PositionSensitivityVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ══════════ Limitation 3: Concatenation bottleneck ══════════ */}
                <P>
                    <Highlight color="amber">{t("models.mlp.narrative.s09.p5H1")}</Highlight>{" "}
                    {t("models.mlp.narrative.s09.p5")}
                </P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s09.figLabel6")} hint={t("models.mlp.narrative.s09.figHint6")}>
                        <Suspense fallback={<SectionSkeleton />}><ConcatenationBottleneckVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ══════════ Limitation 4: No semantic understanding ══════════ */}
                <P>
                    <Highlight color="amber">{t("models.mlp.narrative.s09.p8H1")}</Highlight>{" "}
                    {t("models.mlp.narrative.s09.p8")}
                </P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s09.figLabelContextMeaning")} hint={t("models.mlp.narrative.s09.figHintContextMeaning")}>
                        <Suspense fallback={<SectionSkeleton />}><ContextMeaningDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ══════════ Perception synthesis ══════════ */}
                <P><em>{t("models.mlp.narrative.s09.pPerceptionSynthesis")}</em></P>

                {/* ══════════ "Look how far we've come" ══════════ */}
                <P>{t("models.mlp.narrative.s09.pGalleryIntro")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s09.figLabelGallery")} hint={t("models.mlp.narrative.s09.figHintGallery")}>
                        <Suspense fallback={<SectionSkeleton />}><GenerationGallery /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ══════════ "But we want MORE" bridge ══════════ */}
                <P>{t("models.mlp.narrative.s09.pWantMore")}</P>

                {/* ══════════ Wishlist + Transformer teaser ══════════ */}
                <P>{t("models.mlp.narrative.s09.p7")}</P>

                <LazySection>
                    <FigureWrapper label={t("models.mlp.narrative.s09.figLabel8")} hint={t("models.mlp.narrative.s09.figHint8")}>
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

                <P>{t("models.mlp.narrative.s09.wishlistReveal")}</P>

                {/* ══════════ Monster's final monologue ══════════ */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2 }}
                    className="text-center py-10 my-6"
                >
                    <span className="text-2xl mb-4 block" aria-hidden>👾</span>
                    <p className="whitespace-pre-line text-base md:text-lg italic bg-gradient-to-r from-violet-400/80 via-purple-300/80 to-violet-400/80 bg-clip-text text-transparent max-w-lg mx-auto leading-relaxed">
                        {t("models.mlp.narrative.s09.pMonsterClosure")}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, duration: 1.2 }}
                    className="text-center py-6 my-2"
                >
                    <p className="whitespace-pre-line text-lg md:text-xl font-semibold bg-gradient-to-r from-violet-400 via-purple-300 to-violet-400 bg-clip-text text-transparent max-w-md mx-auto leading-relaxed">
                        {t("models.mlp.narrative.s09.pMonsterClosureQuestion")}
                    </p>
                </motion.div>

                <div className="text-center italic mb-2">
                    <P>{t("models.mlp.narrative.s09.pEmotionalBridge")}</P>
                </div>

                <KeyTakeaway accent="violet">
                    {t("models.mlp.narrative.s09.takeaway")}
                </KeyTakeaway>

                <MonsterInterlude>{t("models.mlp.narrative.monsterInterludes.after09")}</MonsterInterlude>

                {/* ══════════ Chapter End CTAs ══════════ */}
                <div className="mt-12 mb-6 space-y-4">
                    {/* Hero CTA: Transformers (recommended) */}
                    <motion.button
                        whileHover={{ scale: 1.015, y: -2 }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => router.push("/lab/transformer")}
                        className="group relative w-full rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/30 via-purple-950/20 to-violet-950/30 p-6 sm:p-8 text-left transition-all hover:border-violet-400/50 hover:shadow-[0_0_40px_-10px_rgba(139,92,246,0.25)] overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.08] via-transparent to-purple-500/[0.04] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/20">
                            <span className="text-[9px] font-mono font-bold text-violet-300 uppercase tracking-wider">{t("models.mlp.narrative.cta.recommendedBadge")}</span>
                        </div>
                        <div className="relative flex items-start gap-4">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/20 shrink-0">
                                <Sparkles className="w-6 h-6 text-violet-300" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-lg sm:text-xl font-bold text-[var(--lab-text)] block mb-1">
                                    {t("models.mlp.narrative.cta.transformerTitle")}
                                </span>
                                <p className="text-sm text-[var(--lab-text-muted)] leading-relaxed">
                                    {t("models.mlp.narrative.cta.transformerDesc")}
                                </p>
                            </div>
                        </div>
                    </motion.button>

                    {/* Secondary row: Lab + RNN */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setMode("free")}
                            className="group relative rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-[var(--lab-viz-bg)]/80 p-5 text-left transition-colors hover:border-emerald-500/40 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <div className="relative">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-xl bg-emerald-500/15">
                                        <Beaker className="w-4 h-4 text-emerald-300" />
                                    </div>
                                    <span className="text-sm font-bold text-[var(--lab-text)]">
                                        {t("models.mlp.narrative.cta.freeLabTitle")}
                                    </span>
                                </div>
                                <p className="text-xs text-[var(--lab-text-muted)] leading-relaxed">
                                    {t("models.mlp.narrative.cta.freeLabDesc")}
                                </p>
                            </div>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => router.push("/lab/rnn")}
                            className="group relative rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/20 to-[var(--lab-viz-bg)]/80 p-5 text-left transition-colors hover:border-cyan-500/40 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <div className="relative">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-xl bg-cyan-500/15">
                                        <BrainCircuit className="w-4 h-4 text-cyan-300" />
                                    </div>
                                    <span className="text-sm font-bold text-[var(--lab-text)]">
                                        {t("models.mlp.narrative.cta.rnnTitle")}
                                    </span>
                                </div>
                                <p className="text-xs text-[var(--lab-text-muted)] leading-relaxed">
                                    {t("models.mlp.narrative.cta.rnnDesc")}
                                </p>
                            </div>
                        </motion.button>
                    </div>
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
