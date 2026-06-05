"use client";

import { lazy, Suspense, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, Beaker, BookOpen, BrainCircuit, FlaskConical, Sparkles } from "lucide-react";

import MlpEn from "@/content/lab/mlp.en.mdx";
import MlpEs from "@/content/lab/mlp.es.mdx";
import { ContinueToast } from "@/features/lab/components/ContinueToast";
import { FadeInView } from "@/features/lab/components/FadeInView";
import { labMdxComponents } from "@/features/lab/components/mdx/labMdxComponents";
import { ModeToggle } from "@/features/lab/components/ModeToggle";
import { Callout } from "@/features/lab/components/narrative-primitives";
import { SectionProgressBar } from "@/features/lab/components/SectionProgressBar";
import { useLabMode } from "@/features/lab/context/LabModeContext";
import type { UseMLPGridReturn } from "@/features/lab/hooks/useMLPGrid";
import { useProgressTracker } from "@/features/lab/hooks/useProgressTracker";
import { useI18n } from "@/i18n/context";

/* ─── Lazy-loaded interactive visualizers, injected into the MDX ─── */
// §01 — The Input Problem
const OneHotVisualizer = lazy(() => import("@/features/lab/components/mlp/OneHotVisualizer").then(m => ({ default: m.OneHotVisualizer })));
const ContextConcatenationExplorer = lazy(() => import("@/features/lab/components/mlp/ContextConcatenationExplorer").then(m => ({ default: m.ContextConcatenationExplorer })));
const CharacterSimilarityBlindness = lazy(() => import("@/features/lab/components/mlp/CharacterSimilarityBlindness").then(m => ({ default: m.CharacterSimilarityBlindness })));
const TrainingRace4gramVsMLP = lazy(() => import("@/features/lab/components/mlp/TrainingRace4gramVsMLP").then(m => ({ default: m.TrainingRace4gramVsMLP })));
const EncodingProblemDemo = lazy(() => import("@/features/lab/components/mlp/EncodingProblemDemo").then(m => ({ default: m.EncodingProblemDemo })));
const TrigramEquivalenceDemo = lazy(() => import("@/features/lab/components/mlp/TrigramEquivalenceDemo").then(m => ({ default: m.TrigramEquivalenceDemo })));
const MLPNetworkDiagram = lazy(() => import("@/features/lab/components/mlp/MLPNetworkDiagram").then(m => ({ default: m.MLPNetworkDiagram })));
// §02 — The Representation Problem
const CharacterFeatureExplorer = lazy(() => import("@/features/lab/components/mlp/CharacterFeatureExplorer").then(m => ({ default: m.CharacterFeatureExplorer })));
const ManualEmbeddingBuilder = lazy(() => import("@/features/lab/components/mlp/ManualEmbeddingBuilder").then(m => ({ default: m.ManualEmbeddingBuilder })));
const EmbeddingLookupAnimator = lazy(() => import("@/features/lab/components/mlp/EmbeddingLookupAnimator").then(m => ({ default: m.EmbeddingLookupAnimator })));
const CompressionRatioCalculator = lazy(() => import("@/features/lab/components/mlp/CompressionRatioCalculator").then(m => ({ default: m.CompressionRatioCalculator })));
const EmbeddingTableBridge = lazy(() => import("@/features/lab/components/mlp/EmbeddingTableBridge").then(m => ({ default: m.EmbeddingTableBridge })));
const BackpropEmbeddingVisualizer = lazy(() => import("@/features/lab/components/mlp/BackpropEmbeddingVisualizer").then(m => ({ default: m.BackpropEmbeddingVisualizer })));
const TripleModelRace = lazy(() => import("@/features/lab/components/mlp/TripleModelRace").then(m => ({ default: m.TripleModelRace })));
// §03 — Inside the Eyes + §04 — Inside the Brain
const EmbeddingTrainingTimelapse = lazy(() => import("@/features/lab/components/mlp/EmbeddingTrainingTimelapse").then(m => ({ default: m.EmbeddingTrainingTimelapse })));
const NeuronActivationExplorer = lazy(() => import("@/features/lab/components/mlp/NeuronActivationExplorer").then(m => ({ default: m.NeuronActivationExplorer })));
const DistanceConceptVisualizer = lazy(() => import("@/features/lab/components/mlp/DistanceConceptVisualizer").then(m => ({ default: m.DistanceConceptVisualizer })));
const EmbeddingPredictionChallenge = lazy(() => import("@/features/lab/components/mlp/EmbeddingPredictionChallenge").then(m => ({ default: m.EmbeddingPredictionChallenge })));
const EmbeddingDistanceCalculator = lazy(() => import("@/features/lab/components/mlp/EmbeddingDistanceCalculator").then(m => ({ default: m.EmbeddingDistanceCalculator })));
const EmbeddingArithmeticPlayground = lazy(() => import("@/features/lab/components/mlp/EmbeddingArithmeticPlayground").then(m => ({ default: m.EmbeddingArithmeticPlayground })));
const EmbeddingCategoryAnalyzer = lazy(() => import("@/features/lab/components/mlp/EmbeddingCategoryAnalyzer").then(m => ({ default: m.EmbeddingCategoryAnalyzer })));
const CharacterFeatureScoring = lazy(() => import("@/features/lab/components/mlp/CharacterFeatureScoring").then(m => ({ default: m.CharacterFeatureScoring })));
const WordEmbeddingAnalogyDemo = lazy(() => import("@/features/lab/components/mlp/WordEmbeddingAnalogyDemo").then(m => ({ default: m.WordEmbeddingAnalogyDemo })));
// §03 bottleneck (main flow) + panels
const EmbeddingBottleneckExplorer = lazy(() => import("@/features/lab/components/mlp/EmbeddingBottleneckExplorer").then(m => ({ default: m.EmbeddingBottleneckExplorer })));
// §04 uses (forward pass + pipeline + interpretability)
const PolysemanticitySplitDemo = lazy(() => import("@/features/lab/components/mlp/PolysemanticitySplitDemo").then(m => ({ default: m.PolysemanticitySplitDemo })));
const NeuronAblationExplorer = lazy(() => import("@/features/lab/components/mlp/NeuronAblationExplorer").then(m => ({ default: m.NeuronAblationExplorer })));
const SoftmaxStepVisualizer = lazy(() => import("@/features/lab/components/mlp/SoftmaxStepVisualizer").then(m => ({ default: m.SoftmaxStepVisualizer })));
// §05 activation battle + forward/pipeline
const ActivationBattleVisualizer = lazy(() => import("@/features/lab/components/mlp/ActivationBattleVisualizer").then(m => ({ default: m.ActivationBattleVisualizer })));
const MLPForwardPassAnimator = lazy(() => import("@/features/lab/components/mlp/MLPForwardPassAnimator").then(m => ({ default: m.MLPForwardPassAnimator })));
const SingleExampleTrainer = lazy(() => import("@/features/lab/components/mlp/SingleExampleTrainer").then(m => ({ default: m.SingleExampleTrainer })));
const MLPLivePredictor = lazy(() => import("@/features/lab/components/mlp/MLPLivePredictor").then(m => ({ default: m.MLPLivePredictor })));
const MLPPipelineVisualizer = lazy(() => import("@/features/lab/components/mlp/MLPPipelineVisualizer").then(m => ({ default: m.MLPPipelineVisualizer })));
// §05 — Can We Make It Bigger?
const DepthMotivationViz = lazy(() => import("@/features/lab/components/mlp/DepthMotivationViz").then(m => ({ default: m.DepthMotivationViz })));
const NetworkShapeComparison = lazy(() => import("@/features/lab/components/mlp/NetworkShapeComparison").then(m => ({ default: m.NetworkShapeComparison })));
const RealDepthComparisonTrainer = lazy(() => import("@/features/lab/components/mlp/RealDepthComparisonTrainer").then(m => ({ default: m.RealDepthComparisonTrainer })));
const ActivationHistogramVisualizer = lazy(() => import("@/features/lab/components/mlp/ActivationHistogramVisualizer").then(m => ({ default: m.ActivationHistogramVisualizer })));
const TanhSaturationDemo = lazy(() => import("@/features/lab/components/mlp/TanhSaturationDemo").then(m => ({ default: m.TanhSaturationDemo })));
const DeadLayerCascadeVisualizer = lazy(() => import("@/features/lab/components/mlp/DeadLayerCascadeVisualizer").then(m => ({ default: m.DeadLayerCascadeVisualizer })));
const DeadNeuronVisualizer = lazy(() => import("@/features/lab/components/mlp/DeadNeuronVisualizer").then(m => ({ default: m.DeadNeuronVisualizer })));
// §06 — Why Deep Breaks (gradient diagnosis)
const InitialLossCatastropheViz = lazy(() => import("@/features/lab/components/mlp/InitialLossCatastropheViz").then(m => ({ default: m.InitialLossCatastropheViz })));
const WorseThanRandomVisualizer = lazy(() => import("@/features/lab/components/mlp/WorseThanRandomVisualizer").then(m => ({ default: m.WorseThanRandomVisualizer })));
const GaussianDistributionExplorer = lazy(() => import("@/features/lab/components/mlp/GaussianDistributionExplorer").then(m => ({ default: m.GaussianDistributionExplorer })));
const InitializationSensitivityVisualizer = lazy(() => import("@/features/lab/components/mlp/InitializationSensitivityVisualizer").then(m => ({ default: m.InitializationSensitivityVisualizer })));
const BackpropVanishingCalculator = lazy(() => import("@/features/lab/components/mlp/BackpropVanishingCalculator").then(m => ({ default: m.BackpropVanishingCalculator })));
const GradientFlowVisualizer = lazy(() => import("@/features/lab/components/mlp/GradientFlowVisualizer").then(m => ({ default: m.GradientFlowVisualizer })));
const KaimingScalingVisualizer = lazy(() => import("@/features/lab/components/mlp/KaimingScalingVisualizer").then(m => ({ default: m.KaimingScalingVisualizer })));
const VarianceExplosionVisualizer = lazy(() => import("@/features/lab/components/mlp/VarianceExplosionVisualizer").then(m => ({ default: m.VarianceExplosionVisualizer })));
const ShallowVsDeepComparison = lazy(() => import("@/features/lab/components/mlp/ShallowVsDeepComparison").then(m => ({ default: m.ShallowVsDeepComparison })));
const InitializationComparisonTrainer = lazy(() => import("@/features/lab/components/mlp/InitializationComparisonTrainer").then(m => ({ default: m.InitializationComparisonTrainer })));
const ActivationDriftVisualizer = lazy(() => import("@/features/lab/components/mlp/ActivationDriftVisualizer").then(m => ({ default: m.ActivationDriftVisualizer })));
const BatchNormDiscoveryVisualizer = lazy(() => import("@/features/lab/components/mlp/BatchNormDiscoveryVisualizer").then(m => ({ default: m.BatchNormDiscoveryVisualizer })));
const BatchNormEffectVisualizer = lazy(() => import("@/features/lab/components/mlp/BatchNormEffectVisualizer").then(m => ({ default: m.BatchNormEffectVisualizer })));
const BatchNormRegularizerVisualizer = lazy(() => import("@/features/lab/components/mlp/BatchNormRegularizerVisualizer").then(m => ({ default: m.BatchNormRegularizerVisualizer })));
const BatchNormStepByStep = lazy(() => import("@/features/lab/components/mlp/BatchNormStepByStep").then(m => ({ default: m.BatchNormStepByStep })));
const GammaBetaVisualizer = lazy(() => import("@/features/lab/components/mlp/GammaBetaVisualizer").then(m => ({ default: m.GammaBetaVisualizer })));
const NormComparisonDiagram = lazy(() => import("@/features/lab/components/mlp/NormComparisonDiagram").then(m => ({ default: m.NormComparisonDiagram })));
const ResidualGradientHighway = lazy(() => import("@/features/lab/components/mlp/ResidualGradientHighway").then(m => ({ default: m.ResidualGradientHighway })));
const ResidualHighwayVisual = lazy(() => import("@/features/lab/components/mlp/ResidualHighwayVisual").then(m => ({ default: m.ResidualHighwayVisual })));
const BNArchitectureVisualizer = lazy(() => import("@/features/lab/components/mlp/BNArchitectureVisualizer").then(m => ({ default: m.BNArchitectureVisualizer })));
const ResidualDiscoveryVisualizer = lazy(() => import("@/features/lab/components/mlp/ResidualDiscoveryVisualizer").then(m => ({ default: m.ResidualDiscoveryVisualizer })));
const ResidualProjectionVisualizer = lazy(() => import("@/features/lab/components/mlp/ResidualProjectionVisualizer").then(m => ({ default: m.ResidualProjectionVisualizer })));
const ResidualBNArchitectureVisualizer = lazy(() => import("@/features/lab/components/mlp/ResidualBNArchitectureVisualizer").then(m => ({ default: m.ResidualBNArchitectureVisualizer })));
const DeepModelRedemptionDemo = lazy(() => import("@/features/lab/components/mlp/DeepModelRedemptionDemo").then(m => ({ default: m.DeepModelRedemptionDemo })));
// §08 — The Perfect Recipe
const HyperparameterAnatomyVisualizer = lazy(() => import("@/features/lab/components/mlp/HyperparameterAnatomyVisualizer").then(m => ({ default: m.HyperparameterAnatomyVisualizer })));
const MLPHyperparameterExplorer = lazy(() => import("@/features/lab/components/mlp/MLPHyperparameterExplorer").then(m => ({ default: m.MLPHyperparameterExplorer })));
const ParameterWallVisualizer = lazy(() => import("@/features/lab/components/mlp/ParameterWallVisualizer").then(m => ({ default: m.ParameterWallVisualizer })));
const OverfittingDetectiveChallenge = lazy(() => import("@/features/lab/components/mlp/OverfittingDetectiveChallenge").then(m => ({ default: m.OverfittingDetectiveChallenge })));
const DropoutVisualizer = lazy(() => import("@/features/lab/components/mlp/DropoutVisualizer").then(m => ({ default: m.DropoutVisualizer })));
const LearningRateIntuition = lazy(() => import("@/features/lab/components/mlp/LearningRateIntuition").then(m => ({ default: m.LearningRateIntuition })));
const LRSweepVisualizer = lazy(() => import("@/features/lab/components/mlp/LRSweepVisualizer").then(m => ({ default: m.LRSweepVisualizer })));
const DropoutExperimentViz = lazy(() => import("@/features/lab/components/mlp/DropoutExperimentViz").then(m => ({ default: m.DropoutExperimentViz })));
const OvertrainingTimelineViz = lazy(() => import("@/features/lab/components/mlp/OvertrainingTimelineViz").then(m => ({ default: m.OvertrainingTimelineViz })));
const WeightTyingVisualizer = lazy(() => import("@/features/lab/components/mlp/WeightTyingVisualizer").then(m => ({ default: m.WeightTyingVisualizer })));
// §07b — Scale experiments + stability grid
const ScaleStabilityExperiment = lazy(() => import("@/features/lab/components/mlp/ScaleStabilityExperiment").then(m => ({ default: m.ScaleStabilityExperiment })));
const StabilityTechniqueGrid = lazy(() => import("@/features/lab/components/mlp/StabilityTechniqueGrid").then(m => ({ default: m.StabilityTechniqueGrid })));
// §09 — Limitations
const BigModelLimitationViz = lazy(() => import("@/features/lab/components/mlp/BigModelLimitationViz").then(m => ({ default: m.BigModelLimitationViz })));
const DataSizeExperiment = lazy(() => import("@/features/lab/components/mlp/DataSizeExperiment").then(m => ({ default: m.DataSizeExperiment })));
const ContextMeaningDemo = lazy(() => import("@/features/lab/components/mlp/ContextMeaningDemo").then(m => ({ default: m.ContextMeaningDemo })));
const ContextWindowVisualizer = lazy(() => import("@/features/lab/components/mlp/ContextWindowVisualizer").then(m => ({ default: m.ContextWindowVisualizer })));
const PositionSensitivityVisualizer = lazy(() => import("@/features/lab/components/mlp/PositionSensitivityVisualizer").then(m => ({ default: m.PositionSensitivityVisualizer })));
const LongRangeDependencyDemo = lazy(() => import("@/features/lab/components/mlp/LongRangeDependencyDemo").then(m => ({ default: m.LongRangeDependencyDemo })));
const ConcatenationBottleneckVisualizer = lazy(() => import("@/features/lab/components/mlp/ConcatenationBottleneckVisualizer").then(m => ({ default: m.ConcatenationBottleneckVisualizer })));
const ArchitectureWishlistBuilder = lazy(() => import("@/features/lab/components/mlp/ArchitectureWishlistBuilder").then(m => ({ default: m.ArchitectureWishlistBuilder })));
// §09 — Finale
const GenerationGallery = lazy(() => import("@/features/lab/components/mlp/GenerationGallery").then(m => ({ default: m.GenerationGallery })));

export interface MLPNarrativeProps {
    mlpGrid: UseMLPGridReturn;
}

/* ─── Monster status banner helper (gradient variants) ─── */
function MonsterStatus({ children, gradient = "violet-purple" }: { children: React.ReactNode; gradient?: "violet-purple" | "violet-emerald" | "emerald-violet" }) {
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
}

/* ─── Monster interlude helper (between sections) ─── */
function MonsterInterlude({ children }: { children: React.ReactNode }) {
    return (
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
}

/* ─── §01 — dramatic blindness callout (red/amber) ─── */
function BlindnessCallout({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="my-8 rounded-2xl border-2 border-red-500/20 bg-gradient-to-br from-red-500/[0.06] to-amber-500/[0.03] p-6 space-y-3"
        >
            <div className="flex items-center gap-3">
                <span className="text-lg text-red-400 shrink-0" aria-hidden>⚠</span>
                <p className="text-sm font-mono font-bold text-red-400">{title}</p>
            </div>
            <p className="text-[13px] text-white/50 leading-relaxed">{children}</p>
        </motion.div>
    );
}

/* ─── §05 — dramatic "what is happening" bridge ─── */
function DramaticBridge({ main, sub }: { main: string; sub: string }) {
    return (
        <div className="my-8 text-center">
            <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-red-400 via-amber-400 to-red-400 bg-clip-text text-transparent">
                {main}
            </p>
            <p className="text-sm text-white/30 mt-2">{sub}</p>
        </div>
    );
}

/* ─── §09 — Transformer teaser: animated attention lines ─── */
function AttentionTeaser() {
    return (
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
    );
}

/* ─── §09 — Monster's final monologue + question + emotional bridge ─── */
function MonsterClosure({ closure, question, bridge }: { closure: string; question: string; bridge: string }) {
    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2 }}
                className="text-center py-10 my-6"
            >
                <span className="text-2xl mb-4 block" aria-hidden>👾</span>
                <p className="whitespace-pre-line text-base md:text-lg italic bg-gradient-to-r from-violet-400/80 via-purple-300/80 to-violet-400/80 bg-clip-text text-transparent max-w-lg mx-auto leading-relaxed">
                    {closure}
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
                    {question}
                </p>
            </motion.div>

            <div className="text-center italic mb-2">
                <p className="text-[15px] md:text-base text-[var(--lab-text-muted)] leading-[1.9]">{bridge}</p>
            </div>
        </>
    );
}

/* ─── Callout with icon + accent (preserves the §02/§04/§07/§08 callouts) ─── */
function MlpCallout({ icon, accent = "violet", title, children }: { icon?: "lightbulb" | "brain"; accent?: "emerald" | "violet"; title?: string; children: React.ReactNode }) {
    const Icon = icon === "brain" ? BrainCircuit : undefined;
    return (
        <Callout icon={Icon} accent={accent} title={title}>
            <p>{children}</p>
        </Callout>
    );
}

/* ─── MLP-specific collapsible panel (math / experiment / deepdive / challenge) ─── */
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

/* ─── §09 — chapter-end CTAs (Transformer / Free Lab / RNN) ─── */
function ChapterEndCTAs() {
    const { t } = useI18n();
    const router = useRouter();
    const { setMode } = useLabMode();
    return (
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
    );
}

/* ─────────────────────────────────────────────
   Main narrative component — a thin shell: hero + progress bar + footer in TSX,
   the chapter body authored in mlp.{es,en}.mdx and rendered through the shared MDX
   component map. Widgets that need live mlpGrid data are pre-bound below.
   ───────────────────────────────────────────── */

export function MLPNarrative({ mlpGrid }: MLPNarrativeProps) {
    const { t, language } = useI18n();
    const { hasStoredProgress, storedSection, clearProgress } = useProgressTracker("mlp");

    const Body = language === "es" ? MlpEs : MlpEn;

    /* Widgets + bespoke blocks injected into the shared MDX component map.
       The handful that consume live data are pre-bound with mlpGrid here (closures
       capture the prop); the rest run on local data and are passed by reference. */
    const MLP_WIDGETS = useMemo(() => ({
        /* prop-less lazy visualizers (passed by reference) */
        OneHotVisualizer,
        ContextConcatenationExplorer,
        CharacterSimilarityBlindness,
        TrainingRace4gramVsMLP,
        EncodingProblemDemo,
        TrigramEquivalenceDemo,
        MLPNetworkDiagram,
        CharacterFeatureExplorer,
        ManualEmbeddingBuilder,
        EmbeddingLookupAnimator,
        CompressionRatioCalculator,
        EmbeddingTableBridge,
        BackpropEmbeddingVisualizer,
        TripleModelRace,
        EmbeddingTrainingTimelapse,
        NeuronActivationExplorer,
        DistanceConceptVisualizer,
        EmbeddingPredictionChallenge,
        EmbeddingDistanceCalculator,
        EmbeddingArithmeticPlayground,
        EmbeddingCategoryAnalyzer,
        CharacterFeatureScoring,
        WordEmbeddingAnalogyDemo,
        EmbeddingBottleneckExplorer,
        PolysemanticitySplitDemo,
        NeuronAblationExplorer,
        SoftmaxStepVisualizer,
        ActivationBattleVisualizer,
        MLPForwardPassAnimator,
        SingleExampleTrainer,
        MLPLivePredictor,
        DepthMotivationViz,
        NetworkShapeComparison,
        RealDepthComparisonTrainer,
        ActivationHistogramVisualizer,
        TanhSaturationDemo,
        DeadLayerCascadeVisualizer,
        DeadNeuronVisualizer,
        InitialLossCatastropheViz,
        WorseThanRandomVisualizer,
        GaussianDistributionExplorer,
        BackpropVanishingCalculator,
        KaimingScalingVisualizer,
        VarianceExplosionVisualizer,
        ShallowVsDeepComparison,
        InitializationComparisonTrainer,
        ActivationDriftVisualizer,
        BatchNormDiscoveryVisualizer,
        BatchNormEffectVisualizer,
        BatchNormRegularizerVisualizer,
        BatchNormStepByStep,
        GammaBetaVisualizer,
        NormComparisonDiagram,
        ResidualGradientHighway,
        ResidualHighwayVisual,
        BNArchitectureVisualizer,
        ResidualDiscoveryVisualizer,
        ResidualProjectionVisualizer,
        ResidualBNArchitectureVisualizer,
        DeepModelRedemptionDemo,
        HyperparameterAnatomyVisualizer,
        OverfittingDetectiveChallenge,
        DropoutVisualizer,
        LearningRateIntuition,
        LRSweepVisualizer,
        DropoutExperimentViz,
        OvertrainingTimelineViz,
        WeightTyingVisualizer,
        ScaleStabilityExperiment,
        StabilityTechniqueGrid,
        BigModelLimitationViz,
        DataSizeExperiment,
        ContextMeaningDemo,
        ContextWindowVisualizer,
        PositionSensitivityVisualizer,
        LongRangeDependencyDemo,
        ConcatenationBottleneckVisualizer,
        ArchitectureWishlistBuilder,
        GenerationGallery,

        /* ── pre-bound with live mlpGrid data (or a static prop) ── */
        MLPPipelineVisualizer: () => <MLPPipelineVisualizer selectedConfig={null} />,
        InitializationSensitivityVisualizer: () => <InitializationSensitivityVisualizer timeline={mlpGrid.timeline} />,
        GradientFlowVisualizer: () => <GradientFlowVisualizer timeline={mlpGrid.timeline} />,
        ParameterWallVisualizer: () => <ParameterWallVisualizer configs={mlpGrid.configs} />,
        MLPHyperparameterExplorer: () => (
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
        ),

        /* ── bespoke editorial / stateful blocks used directly in the MDX ── */
        MonsterStatus,
        MonsterInterlude,
        BlindnessCallout,
        DramaticBridge,
        AttentionTeaser,
        MonsterClosure,
        MlpCallout,
        TrainingChallengePanel,
        ChapterEndCTAs,
    } as unknown as Record<string, React.ComponentType<Record<string, unknown>>>), [mlpGrid]);

    const mdxComponents = useMemo(() => labMdxComponents("violet", MLP_WIDGETS, {
        open: language === "es" ? "leer" : "read",
        close: language === "es" ? "cerrar" : "close",
    }), [MLP_WIDGETS, language]);

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

            {/* ═══════════ Chapter body — authored in mlp.{es,en}.mdx ═══════════ */}
            <Suspense fallback={null}>
                <Body components={mdxComponents} />
            </Suspense>

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
