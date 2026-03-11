"use client";

import React, { lazy, Suspense } from "react";

import { motion } from "framer-motion";
import { AlertTriangle, ArrowDown, BookOpen, Brain, Layers, Play, Sparkles, Target, Zap } from "lucide-react";

import { ContinueToast } from "@/components/lab/ContinueToast";
import { KeyTakeaway } from "@/components/lab/KeyTakeaway";
import { FadeInView } from "@/components/lab/FadeInView";
import { ModeToggle } from "@/components/lab/ModeToggle";
import { SectionAnchor } from "@/components/lab/SectionAnchor";
import { SectionProgressBar } from "@/components/lab/SectionProgressBar";
import { useProgressTracker } from "@/hooks/useProgressTracker";

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

/* ─── Lazy-loaded visualizers: §01 ─── */
const WordToEmbeddingViz = lazy(() => import("@/components/lab/transformer/WordToEmbeddingViz").then((m) => ({ default: m.WordToEmbeddingViz })));
const PronounResolutionViz = lazy(() => import("@/components/lab/transformer/PronounResolutionViz").then((m) => ({ default: m.PronounResolutionViz })));
const DrawConnectionsViz = lazy(() => import("@/components/lab/transformer/DrawConnectionsViz").then((m) => ({ default: m.DrawConnectionsViz })));
const WishlistCallbackViz = lazy(() => import("@/components/lab/transformer/WishlistCallbackViz").then((m) => ({ default: m.WishlistCallbackViz })));
const FrozenVsContextualViz = lazy(() => import("@/components/lab/transformer/FrozenVsContextualViz").then((m) => ({ default: m.FrozenVsContextualViz })));
const ContextEnrichmentViz = lazy(() => import("@/components/lab/transformer/ContextEnrichmentViz").then((m) => ({ default: m.ContextEnrichmentViz })));

/* ─── Lazy-loaded visualizers: §02 ─── */
const TelephoneGameViz = lazy(() => import("@/components/lab/transformer/TelephoneGameViz").then((m) => ({ default: m.TelephoneGameViz })));
const LSTMBandageViz = lazy(() => import("@/components/lab/transformer/LSTMBandageViz").then((m) => ({ default: m.LSTMBandageViz })));
const SequentialVsParallelViz = lazy(() => import("@/components/lab/transformer/SequentialVsParallelViz").then((m) => ({ default: m.SequentialVsParallelViz })));
const RNNChainViz = lazy(() => import("@/components/lab/transformer/RNNChainViz").then((m) => ({ default: m.RNNChainViz })));

/* ─── Lazy-loaded visualizers: §03 ─── */
const SpotlightViz = lazy(() => import("@/components/lab/transformer/SpotlightViz").then((m) => ({ default: m.SpotlightViz })));
const GuessPatternViz = lazy(() => import("@/components/lab/transformer/GuessPatternViz").then((m) => ({ default: m.GuessPatternViz })));
const StaticVsDynamicViz = lazy(() => import("@/components/lab/transformer/StaticVsDynamicViz").then((m) => ({ default: m.StaticVsDynamicViz })));
const AttentionHeatmapViz = lazy(() => import("@/components/lab/transformer/AttentionHeatmapViz").then((m) => ({ default: m.AttentionHeatmapViz })));
const AttentionWebViz = lazy(() => import("@/components/lab/transformer/AttentionWebViz").then((m) => ({ default: m.AttentionWebViz })));

/* ─── Lazy-loaded visualizers: §04a ─── */
const EmbeddingToArrowViz = lazy(() => import("@/components/lab/transformer/EmbeddingToArrowViz").then((m) => ({ default: m.EmbeddingToArrowViz })));
const DotProductCalculatorViz = lazy(() => import("@/components/lab/transformer/DotProductCalculatorViz").then((m) => ({ default: m.DotProductCalculatorViz })));
/* DotProductArrowsViz removed — merged into DotProductCalculatorViz v2 */
const PairwiseScoringViz = lazy(() => import("@/components/lab/transformer/PairwiseScoringViz").then((m) => ({ default: m.PairwiseScoringViz })));
const SelfSimilarityViz = lazy(() => import("@/components/lab/transformer/SelfSimilarityViz").then((m) => ({ default: m.SelfSimilarityViz })));
const DotProductQuiz = lazy(() => import("@/components/lab/transformer/DotProductQuiz").then((m) => ({ default: m.DotProductQuiz })));
const EmbeddingAttentionFailureViz = lazy(() => import("@/components/lab/transformer/EmbeddingAttentionFailureViz").then((m) => ({ default: m.EmbeddingAttentionFailureViz })));

/* ─── Lazy-loaded visualizers: §04b-c ─── */
const QKSplitViz = lazy(() => import("@/components/lab/transformer/QKSplitViz").then((m) => ({ default: m.QKSplitViz })));
const QKMatrixViz = lazy(() => import("@/components/lab/transformer/QKMatrixViz").then((m) => ({ default: m.QKMatrixViz })));
const QueryKeyRelationsViz = lazy(() => import("@/components/lab/transformer/QueryKeyRelationsViz").then((m) => ({ default: m.QueryKeyRelationsViz })));
const QuerySearchViz = lazy(() => import("@/components/lab/transformer/QuerySearchViz").then((m) => ({ default: m.QuerySearchViz })));
const WhyQKMattersViz = lazy(() => import("@/components/lab/transformer/WhyQKMattersViz").then((m) => ({ default: m.WhyQKMattersViz })));
const WeightsOfWhatViz = lazy(() => import("@/components/lab/transformer/WeightsOfWhatViz").then((m) => ({ default: m.WeightsOfWhatViz })));
const ValueCompletesViz = lazy(() => import("@/components/lab/transformer/ValueCompletesViz").then((m) => ({ default: m.ValueCompletesViz })));
const BeforeAfterAttentionViz = lazy(() => import("@/components/lab/transformer/BeforeAfterAttentionViz").then((m) => ({ default: m.BeforeAfterAttentionViz })));



/* ─── Lazy-loaded visualizers: §04d ─── */
const NumbersExplodeViz = lazy(() => import("@/components/lab/transformer/NumbersExplodeViz").then((m) => ({ default: m.NumbersExplodeViz })));
const ScalingFixViz = lazy(() => import("@/components/lab/transformer/ScalingFixViz").then((m) => ({ default: m.ScalingFixViz })));
const FullScoringPipelineViz = lazy(() => import("@/components/lab/transformer/FullScoringPipelineViz").then((m) => ({ default: m.FullScoringPipelineViz })));
const ContextAssemblyFilmViz = lazy(() => import("@/components/lab/transformer/ContextAssemblyFilmViz").then((m) => ({ default: m.ContextAssemblyFilmViz })));
const FullContextualAssemblyViz = lazy(() => import("@/components/lab/transformer/FullContextualAssemblyViz").then((m) => ({ default: m.FullContextualAssemblyViz })));

/* ─── Lazy-loaded visualizers: §05 ─── */
const WhichWordMattersViz = lazy(() => import("@/components/lab/transformer/WhichWordMattersViz").then((m) => ({ default: m.WhichWordMattersViz })));
const OneHeadDilemmaViz = lazy(() => import("@/components/lab/transformer/OneHeadDilemmaViz").then((m) => ({ default: m.OneHeadDilemmaViz })));
const MultiHeadIdeaViz = lazy(() => import("@/components/lab/transformer/MultiHeadIdeaViz").then((m) => ({ default: m.MultiHeadIdeaViz })));
const MultiLensViewViz = lazy(() => import("@/components/lab/transformer/MultiLensViewViz").then((m) => ({ default: m.MultiLensViewViz })));
// HeadSpecializationViz removed — sentence switching merged into MultiLensViewViz
const HeadBudgetViz = lazy(() => import("@/components/lab/transformer/HeadBudgetViz").then((m) => ({ default: m.HeadBudgetViz })));
const MultiHeadPipelineViz = lazy(() => import("@/components/lab/transformer/MultiHeadPipelineViz").then((m) => ({ default: m.MultiHeadPipelineViz })));

/* ─── Lazy-loaded visualizers: §06 ─── */
const ShuffleDisasterViz = lazy(() => import("@/components/lab/transformer/ShuffleDisasterViz").then((m) => ({ default: m.ShuffleDisasterViz })));
const SimpleNumbersViz = lazy(() => import("@/components/lab/transformer/SimpleNumbersViz").then((m) => ({ default: m.SimpleNumbersViz })));
const LearnedPositionEmbeddingsViz = lazy(() => import("@/components/lab/transformer/LearnedPositionEmbeddingsViz").then((m) => ({ default: m.LearnedPositionEmbeddingsViz })));
const WaveFingerprintViz = lazy(() => import("@/components/lab/transformer/WaveFingerprintViz").then((m) => ({ default: m.WaveFingerprintViz })));
const PositionalSimilarityViz = lazy(() => import("@/components/lab/transformer/PositionalSimilarityViz").then((m) => ({ default: m.PositionalSimilarityViz })));
const AddEmbeddingsViz = lazy(() => import("@/components/lab/transformer/AddEmbeddingsViz").then((m) => ({ default: m.AddEmbeddingsViz })));
const PositionInActionViz = lazy(() => import("@/components/lab/transformer/PositionInActionViz").then((m) => ({ default: m.PositionInActionViz })));

/* ─── Lazy-loaded visualizers: §08 ─── */
const UntrainedOutputViz = lazy(() => import("@/components/lab/transformer/UntrainedOutputViz").then((m) => ({ default: m.UntrainedOutputViz })));
const ParallelPredictionViz = lazy(() => import("@/components/lab/transformer/ParallelPredictionViz").then((m) => ({ default: m.ParallelPredictionViz })));
const TrainingTimelapseViz = lazy(() => import("@/components/lab/transformer/TrainingTimelapseViz").then((m) => ({ default: m.TrainingTimelapseViz })));
const ModelBattleArena = lazy(() => import("@/components/lab/transformer/ModelBattleArena").then((m) => ({ default: m.ModelBattleArena })));
const NeuronScalingViz = lazy(() => import("@/components/lab/transformer/NeuronScalingViz").then((m) => ({ default: m.NeuronScalingViz })));
const CausalMaskViz = lazy(() => import("@/components/lab/transformer/CausalMaskViz").then((m) => ({ default: m.CausalMaskViz })));

/* ─── Lazy-loaded visualizers: §09 ─── */
const DepthBreakthroughViz = lazy(() => import("@/components/lab/transformer/DepthBreakthroughViz").then((m) => ({ default: m.DepthBreakthroughViz })));

/* ─── Lazy-loaded visualizers: §07 (absorbed from old §08) ─── */
const DepthVsQualityViz = lazy(() => import("@/components/lab/transformer/DepthVsQualityViz").then((m) => ({ default: m.DepthVsQualityViz })));
const LayerEvolutionViz = lazy(() => import("@/components/lab/transformer/LayerEvolutionViz").then((m) => ({ default: m.LayerEvolutionViz })));
const ArchitectureTowerViz = lazy(() => import("@/components/lab/transformer/ArchitectureTowerViz").then((m) => ({ default: m.ArchitectureTowerViz })));
const LinearSoftmaxViz = lazy(() => import("@/components/lab/transformer/LinearSoftmaxViz").then((m) => ({ default: m.LinearSoftmaxViz })));

/* ─── Lazy-loaded visualizers: §07 ─── */
const CommunicationVsProcessingViz = lazy(() => import("@/components/lab/transformer/CommunicationVsProcessingViz").then((m) => ({ default: m.CommunicationVsProcessingViz })));
const FFNCallbackViz = lazy(() => import("@/components/lab/transformer/FFNCallbackViz").then((m) => ({ default: m.FFNCallbackViz })));
const FFNDeepDiveViz = lazy(() => import("@/components/lab/transformer/FFNDeepDiveViz").then((m) => ({ default: m.FFNDeepDiveViz })));
const HighwayReturnsViz = lazy(() => import("@/components/lab/transformer/HighwayReturnsViz").then((m) => ({ default: m.HighwayReturnsViz })));
const LayerNormViz = lazy(() => import("@/components/lab/transformer/LayerNormViz").then((m) => ({ default: m.LayerNormViz })));
const ValueDriftViz = lazy(() => import("@/components/lab/transformer/ValueDriftViz").then((m) => ({ default: m.ValueDriftViz })));
const BatchVsLayerNormViz = lazy(() => import("@/components/lab/transformer/BatchVsLayerNormViz").then((m) => ({ default: m.BatchVsLayerNormViz })));
const BlockBuilderViz = lazy(() => import("@/components/lab/transformer/BlockBuilderViz").then((m) => ({ default: m.BlockBuilderViz })));
const BlockComponentExplorerViz = lazy(() => import("@/components/lab/transformer/BlockComponentExplorerViz").then((m) => ({ default: m.BlockComponentExplorerViz })));
const QKVProjectionViz = lazy(() => import("@/components/lab/transformer/QKVProjectionViz").then((m) => ({ default: m.QKVProjectionViz })));
const AttentionScoreViz = lazy(() => import("@/components/lab/transformer/AttentionScoreViz").then((m) => ({ default: m.AttentionScoreViz })));
const TransformerBlockExplorerViz = lazy(() => import("@/components/lab/transformer/TransformerBlockExplorerViz").then((m) => ({ default: m.TransformerBlockExplorerViz })));
const AttentionAloneFailsViz = lazy(() => import("@/components/lab/transformer/AttentionAloneFailsViz").then((m) => ({ default: m.AttentionAloneFailsViz })));
const BlockBlueprintViz = lazy(() => import("@/components/lab/transformer/BlockBlueprintViz").then((m) => ({ default: m.BlockBlueprintViz })));

/* ─── Lazy-loaded visualizers: VIZ 9-15 (new) ─── */
const LayerLensViz = lazy(() => import("@/components/lab/transformer/LayerLensViz").then((m) => ({ default: m.LayerLensViz })));
const DepthGenerationViz = lazy(() => import("@/components/lab/transformer/DepthGenerationViz").then((m) => ({ default: m.DepthGenerationViz })));
const OverfittingDualCurveViz = lazy(() => import("@/components/lab/transformer/OverfittingDualCurveViz").then((m) => ({ default: m.OverfittingDualCurveViz })));
const CharGenerationPlayground = lazy(() => import("@/components/lab/transformer/CharGenerationPlayground").then((m) => ({ default: m.CharGenerationPlayground })));
const MemorizationRevealViz = lazy(() => import("@/components/lab/transformer/MemorizationRevealViz").then((m) => ({ default: m.MemorizationRevealViz })));
const ContextWindowViz = lazy(() => import("@/components/lab/transformer/ContextWindowViz").then((m) => ({ default: m.ContextWindowViz })));
const CharVsTokenViz = lazy(() => import("@/components/lab/transformer/CharVsTokenViz").then((m) => ({ default: m.CharVsTokenViz })));
const EvolutionTimelineViz = lazy(() => import("@/components/lab/transformer/EvolutionTimelineViz").then((m) => ({ default: m.EvolutionTimelineViz })));

/* ─── Lazy-loaded visualizers: §10 ─── */
const ArchitectureIdentityViz = lazy(() => import("@/components/lab/transformer/ArchitectureIdentityViz").then((m) => ({ default: m.ArchitectureIdentityViz })));
const CompletionVsAssistantViz = lazy(() => import("@/components/lab/transformer/CompletionVsAssistantViz").then((m) => ({ default: m.CompletionVsAssistantViz })));
const ThreeMysteriesViz = lazy(() => import("@/components/lab/transformer/ThreeMysteriesViz").then((m) => ({ default: m.ThreeMysteriesViz })));
const ConceptRecallViz = lazy(() => import("@/components/lab/transformer/ConceptRecallViz").then((m) => ({ default: m.ConceptRecallViz })));
const ShareJourneyViz = lazy(() => import("@/components/lab/transformer/ShareJourneyViz").then((m) => ({ default: m.ShareJourneyViz })));

/* ─── Accent-bound wrappers ─── */
const NA: NarrativeAccent = "cyan";
const SectionLabel = (p: { number: string; label: string }) => <_SectionLabel accent={NA} {...p} />;
const Callout = ({ accent, ...p }: Parameters<typeof _Callout>[0]) => <_Callout accent={accent ?? NA} {...p} />;
const FormulaBlock = (p: { formula: string; caption: string }) => <_FormulaBlock accent={NA} {...p} />;
const PullQuote = (p: { children: React.ReactNode }) => <_PullQuote accent={NA} {...p} />;

/* ─── Enhanced text primitives (§01 visual upgrades) ─── */

/* #2 + #7: Highlight with subtle glow + one-shot pulse animation */
const Highlight = ({ color, ...p }: { children: React.ReactNode; color?: HighlightColor; tooltip?: string }) => {
    const c = color ?? NA;
    const glowMap: Record<string, string> = {
        cyan: "0 0 12px rgba(34,211,238,0.25), 0 0 4px rgba(34,211,238,0.15)",
        amber: "0 0 12px rgba(251,191,36,0.25), 0 0 4px rgba(251,191,36,0.15)",
        rose: "0 0 12px rgba(244,63,94,0.2), 0 0 4px rgba(244,63,94,0.12)",
        violet: "0 0 12px rgba(139,92,246,0.2), 0 0 4px rgba(139,92,246,0.12)",
        indigo: "0 0 12px rgba(99,102,241,0.2), 0 0 4px rgba(99,102,241,0.12)",
        emerald: "0 0 12px rgba(52,211,153,0.2), 0 0 4px rgba(52,211,153,0.12)",
    };
    if (p.tooltip) return <_Highlight color={c} {...p} />;
    return (
        <strong
            className={`font-semibold ${c === "cyan" ? "text-cyan-400" : c === "amber" ? "text-amber-400" : c === "rose" ? "text-rose-400" : c === "violet" ? "text-violet-400" : c === "indigo" ? "text-indigo-400" : "text-emerald-400"}`}
            style={{ textShadow: glowMap[c] || glowMap.cyan }}
        >
            {p.children}
        </strong>
    );
};

/* #1: Gradient text for key phrases */
const GradientText = ({ children, from = "from-cyan-300", via, to = "to-teal-300" }: {
    children: React.ReactNode;
    from?: string;
    via?: string;
    to?: string;
}) => (
    <strong className={`font-semibold bg-gradient-to-r ${from} ${via ?? ""} ${to} bg-clip-text text-transparent`}>
        {children}
    </strong>
);

/* #4: Subtle divider between narrative beats */
const NarrativeDivider = () => (
    <div className="flex items-center justify-center gap-2 my-8 md:my-10" aria-hidden>
        <span className="w-1 h-1 rounded-full bg-cyan-400/20" />
        <span className="w-1 h-1 rounded-full bg-cyan-400/10" />
        <span className="w-1 h-1 rounded-full bg-cyan-400/20" />
    </div>
);

/* #8: Styled inline arrow */
const StyledArrow = () => (
    <svg className="inline-block w-4 h-3 mx-0.5 -mt-0.5" viewBox="0 0 16 12" fill="none" aria-hidden>
        <path d="M1 6h12M9 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400/60" />
    </svg>
);


/* ─── Monster status banner helper ─── */
const MonsterStatus = ({ children, gradient = "cyan-teal" }: { children: React.ReactNode; gradient?: "cyan-teal" | "cyan-amber" }) => {
    const gradientClass = gradient === "cyan-amber"
        ? "from-cyan-400 via-amber-300 to-cyan-400"
        : "from-cyan-400 via-teal-300 to-cyan-400";

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
    <FadeInView margin="-40px" className="my-12 text-center">
        <p className="text-sm md:text-base italic bg-gradient-to-r from-cyan-400/80 via-teal-300/80 to-cyan-400/80 bg-clip-text text-transparent max-w-lg mx-auto leading-relaxed">
            {children}
        </p>
    </FadeInView>
);

/* ─── Section loading skeleton ─── */
const SectionSkeleton = () => (
    <div className="h-64 animate-pulse bg-white/5 rounded-xl" />
);

/* ─── Coming soon / redesign wrappers ─── */
const ComingSoonViz = ({ label }: { label: string }) => (
    <div className="rounded-2xl border-2 border-dashed border-cyan-400/15 p-8 sm:p-10 text-center">
        <p className="text-[11px] font-semibold text-cyan-400/30 uppercase tracking-[0.15em] mb-1">Coming Soon</p>
        <p className="text-[14px] text-white/35 font-medium">{label}</p>
    </div>
);
const RedesignWrapper = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="relative rounded-2xl border-2 border-dashed border-amber-400/15 p-2">
        <div className="absolute -top-3 left-4 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-400/50" style={{ background: "var(--lab-bg, #0a0a0f)" }}>
            Redesign: {label}
        </div>
        {children}
    </div>
);

/* ─── FigureWrapper (cyan-accented) ─── */
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
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400/40" />
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

export function TransformerNarrative() {
    const { hasStoredProgress, storedSection, clearProgress } = useProgressTracker("transformer");

    return (
        <article className="max-w-[920px] mx-auto px-6 pt-8 pb-24">
            <ContinueToast
                accent="cyan"
                hasStoredProgress={hasStoredProgress}
                storedSection={storedSection}
                clearProgress={clearProgress}
                sectionNames={{
                    "transformer-01": "The Blind Spot",
                    "transformer-02": "The Road Not Taken",
                    "transformer-03": "What If Tokens Could Talk?",
                    "transformer-04": "The Attention Mechanism",
                    "transformer-05": "Seeing Multiple Things at Once",
                    "transformer-06": "Where Am I?",
                    "transformer-07": "The Full Architecture",
                    "transformer-08": "Teaching It to Write",
                    "transformer-09": "Scaling It Up",
                    "transformer-10": "You Already Know",
                }}
            />
            <SectionProgressBar
                sections={[
                    { id: "transformer-01", label: "01", name: "Blind Spot" },
                    { id: "transformer-02", label: "02", name: "Road" },
                    { id: "transformer-03", label: "03", name: "Talk" },
                    { id: "transformer-04", label: "04", name: "Attention" },
                    { id: "transformer-05", label: "05", name: "Multi-Head" },
                    { id: "transformer-06", label: "06", name: "Position" },
                    { id: "transformer-07", label: "07", name: "Architecture" },
                    { id: "transformer-08", label: "08", name: "Training" },
                    { id: "transformer-09", label: "09", name: "Scaling" },
                    { id: "transformer-10", label: "10", name: "You Know" },
                ]}
                accent="cyan"
            />

            {/* ───────────────────── HERO ───────────────────── */}
            <header className="text-center mb-24 md:mb-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    <span className="inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-cyan-400/60 mb-6">
                        <BookOpen className="w-3.5 h-3.5" />
                        Chapter 5 · The Transformer
                    </span>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[var(--lab-text)] mb-6">
                        The Monster That{" "}
                        <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                            Can See Everything
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-[var(--lab-text-subtle)] max-w-xl mx-auto leading-relaxed mb-12">
                        From blind pattern matching to understanding connections between every token.
                        The architecture that powers GPT, Claude, and the modern AI revolution.
                    </p>

                    <p className="text-[11px] font-mono text-[var(--lab-text-subtle)] mb-8">
                        ~50 min read · 10 sections · 63 interactive visualizers
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

            {/* ═══════════════════════════════════════════════════
               §01 — THE BLIND SPOT
               ═══════════════════════════════════════════════════ */}
            <Section id="transformer-01">
                <SectionLabel number="01" label="The Blind Spot" />
                <SectionAnchor id="transformer-01">
                    <Heading className="bg-gradient-to-r from-cyan-300 via-white to-cyan-400 bg-clip-text text-transparent">The Blind Spot</Heading>
                </SectionAnchor>

                {/* ─── Beat 1: The Puzzle ─── */}
                <Lead>
                    Read this word:
                </Lead>

                <FadeInView className="my-8">
                    <p className="text-center text-4xl font-semibold text-white/90">tower</p>
                </FadeInView>

                <P>
                    What does it mean? You probably pictured something tall. A building, maybe.
                    But why not a chess piece? Or a computer sitting under a desk?
                    Read these four sentences:
                </P>

                <PullQuote>
                    &ldquo;The Eiffel <strong>tower</strong> gleamed in the Paris sunset.&rdquo;<br />
                    &ldquo;She stacked another block on the <strong>tower</strong>.&rdquo;<br />
                    &ldquo;The server <strong>tower</strong> hummed quietly in the corner.&rdquo;<br />
                    &ldquo;The chess <strong>tower</strong> slid across the board.&rdquo;
                </PullQuote>

                <P>
                    Same five letters. Four completely different objects. A Parisian landmark. A
                    child&apos;s toy. A humming computer. A chess piece sliding across a board.
                    You resolved each one instantly &mdash; no effort, no confusion. Your brain
                    read the surrounding words and <em>knew</em>.
                </P>

                {/* ─── Beat 2: The Realization ─── */}
                <NarrativeDivider />

                <P>
                    How did you do that?
                </P>

                <P>
                    The answer seems obvious once you think about it: <em>the surrounding words
                        changed what &ldquo;tower&rdquo; means</em>. &ldquo;Eiffel&rdquo; pulled it
                    toward landmarks. &ldquo;Stacked&rdquo; and &ldquo;block&rdquo; pulled it
                    toward toys. Context didn&apos;t just help &mdash; it{" "}
                    <em>rewrote the meaning entirely</em>.
                </P>

                <P>
                    That single fact &mdash;{" "}
                    <GradientText>meaning is not fixed, it is built from context</GradientText>{" "}
                    &mdash; is the most important idea in this entire chapter. And it is precisely
                    the thing our model cannot do.
                </P>

                <Callout icon={AlertTriangle} accent="amber" title="Quick note: words, not characters">
                    <p>
                        Until now, our model worked with individual characters. From here on
                        we&apos;ll think in <strong>words</strong> &mdash; the concepts are identical,
                        but words make the patterns much easier to see. The model works the same with characters,
                        sp we are gping to call them tokens
                    </p>
                </Callout>

                {/* ─── Beat 3: The Foundation ─── */}
                <NarrativeDivider />

                <P>
                    Before we see the problem, let&apos;s understand what &ldquo;tower&rdquo; looks
                    like to the model. Remember embeddings from the MLP chapter? They turn each word
                    into a list of features &mdash; numbers that capture what the word <em>means</em>.
                    Is it large? Is it man-made? Is it tall? Each number measures one characteristic,
                    and the full list is what we call a <Highlight>vector</Highlight>.
                </P>

                <P>
                    If two words are similar, they&apos;ll share similar features &mdash; and
                    therefore similar vectors. We can picture each vector as a point in{" "}
                    <em>meaning-space</em>: similar words end up close together, different words
                    end up far apart. Watch &ldquo;tower&rdquo; transform from letters into its
                    position in that space:
                </P>

                {/* ═══ WordToEmbeddingViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <WordToEmbeddingViz />
                    </Suspense>
                </FadeInView>

                <P>
                    That glowing dot is &ldquo;tower&rdquo;&apos;s entire identity inside the model.
                    Its position captures everything the model has learned about the word &mdash;
                    and notice how &ldquo;castle&rdquo; and &ldquo;skyscraper&rdquo; cluster nearby
                    (similar features), while &ldquo;toy&rdquo; and &ldquo;child&rdquo; sit far away
                    (very different features).
                </P>

                <P>
                    There&apos;s just one problem.
                </P>

                {/* ─── Beat 4: The Wound ─── */}

                <P>
                    That dot &mdash; that point in space &mdash; is the same every time. It
                    doesn&apos;t matter if the sentence says &ldquo;Eiffel tower&rdquo; or
                    &ldquo;tower of blocks&rdquo; or &ldquo;server tower.&rdquo; The model gives
                    &ldquo;tower&rdquo; one fixed address and never changes it.
                </P>

                <P>
                    See for yourself:
                </P>

                {/* ═══ FrozenVsContextualViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <FrozenVsContextualViz />
                    </Suspense>
                </FadeInView>

                <P>
                    The dot doesn&apos;t move.{" "}
                    <Highlight color="amber">Four different meanings, one frozen point.</Highlight>{" "}
                    The model literally cannot tell these apart &mdash; they are mathematically
                    identical.
                </P>

                <P>
                    That&apos;s the blind spot. Every word gets one permanent address in
                    meaning-space. A word that means four different things gets crammed into a
                    single location, and the richness of context &mdash; the thing that makes
                    language <em>work</em> &mdash; is thrown away.
                </P>

                {/* ─── Beat 5: The Deepening ─── */}
                <NarrativeDivider />

                <P>
                    And it gets worse. The frozen problem doesn&apos;t just affect words with
                    multiple definitions. Read this sentence carefully:
                </P>

                {/* ═══ PronounResolutionViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <PronounResolutionViz />
                    </Suspense>
                </FadeInView>

                <P>
                    You connected &ldquo;it&rdquo; back to &ldquo;trophy&rdquo; across six
                    words &mdash; using meaning, grammar, and common sense.{" "}
                    <Highlight color="amber">Our model has no mechanism to do this.</Highlight>{" "}
                    The word &ldquo;it&rdquo; gets one frozen embedding. It can&apos;t look back
                    at &ldquo;trophy.&rdquo; It can&apos;t look anywhere. Every word is processed
                    in its own isolated slot, blind to everything around it.
                </P>

                {/* ─── Beat 6: The Discovery ─── */}
                <NarrativeDivider />

                <P>
                    Here&apos;s the surprising part. You already know how to do this. Read this
                    sentence, and draw the connections you naturally see between the words:
                </P>

                {/* ═══ DrawConnectionsViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <DrawConnectionsViz />
                    </Suspense>
                </FadeInView>

                <P>
                    Those weighted lines you drew &mdash; thicker for words that matter more,
                    thinner for words that matter less &mdash; are{" "}
                    <em className="text-white/75 not-italic font-medium">exactly</em> the mechanism
                    that powers every modern language model. GPT. Claude. Gemini. All of them.
                </P>

                <P>
                    For every word in the input, they figure out which other words matter, how
                    much, and then use that information to{" "}
                    <Highlight>rewrite each word&apos;s meaning</Highlight>. The output of
                    attention is not a score &mdash; it&apos;s a new version of the word.
                </P>

                <P>
                    You did the scoring with intuition. The model needs to learn to do it with
                    math. And that&apos;s what the rest of this chapter is about.
                </P>

                {/* ─── Beat 8: The Bridge ─── */}
                <NarrativeDivider />

                <P>
                    So what do we need to build? Over the next sections, we&apos;ll construct this
                    mechanism piece by piece:
                </P>

                {/* ═══ WishlistCallbackViz ═══ */}
                <FadeInView className="my-8 md:my-10">
                    <Suspense fallback={<SectionSkeleton />}>
                        <WishlistCallbackViz />
                    </Suspense>
                </FadeInView>

                <KeyTakeaway accent="cyan">
                    Our MLP gives every word one frozen meaning &mdash; the same embedding
                    regardless of context. Real language requires words to reshape their meaning
                    based on what surrounds them. The mechanism that makes this possible is
                    called <strong>attention</strong>: it lets each word look at the rest of the
                    sentence and build a new, context-sensitive version of itself.
                </KeyTakeaway>

                <MonsterStatus>
                    👾 I have eyes. I have a brain. But every word I see is frozen &mdash;
                    &ldquo;tower&rdquo; always means the same thing to me, no matter what sentence
                    it&apos;s in. I can&apos;t adjust. I can&apos;t look around. I need a way to
                    rewrite what words mean based on context. I want to see everything at once.
                </MonsterStatus>
            </Section>

            {/* ── Bridge to §02 ── */}
            <SectionBreak />
            <MonsterInterlude>
                Decades ago, researchers saw this same problem. Their first solution was
                intuitive: read one word at a time, carrying a running memory forward. For ten
                years, it dominated AI research. But it had a fatal flaw...
            </MonsterInterlude>

            {/* ═══════════════════════════════════════════════════
               §02 — THE ROAD NOT TAKEN
               ═══════════════════════════════════════════════════ */}
            <Section id="transformer-02">
                <SectionLabel number="02" label="The Road Not Taken" />
                <SectionAnchor id="transformer-02"><Heading>The Road Not Taken</Heading></SectionAnchor>

                {/* Optional context badge */}
                <FadeInView className="flex items-center gap-2 mb-6 text-xs text-white/30">
                    <span className="px-2 py-0.5 rounded border border-white/10 bg-white/5">Optional Context</span>
                    <span>You can skip this if you&apos;re familiar with RNNs</span>
                </FadeInView>

                {/* ── Beat 1: The Intuitive Idea ── */}
                <Lead>
                    Before attention, researchers tried a different approach. It was intuitive,
                    elegant, and for a decade it dominated the field. But it couldn&apos;t deliver
                    what language actually needs.
                </Lead>

                <P>
                    The idea: what if the model reads like we do? Left to right, one word at a
                    time, carrying everything it has learned so far in its memory. Each token
                    receives a summary of all previous tokens, adds its own information, and passes
                    the updated summary forward.
                </P>

                <P>
                    They called it the <Highlight>Recurrent Neural Network</Highlight>. On paper,
                    it solved the isolation problem &mdash; tokens could finally communicate through
                    a chain of memory.
                </P>

                {/* ═══ RNNChainViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <RNNChainViz />
                    </Suspense>
                </FadeInView>

                {/* ── Beat 2: The Flaws ── */}
                <NarrativeDivider />

                <P>
                    But think about what happens to the first word&apos;s information as it travels
                    through the chain. Word 1&apos;s meaning gets compressed into word 2&apos;s
                    memory. Then words 1 and 2 get compressed into word 3. By word 50, the memory
                    of word 1 is almost completely gone. It&apos;s like a game of telephone &mdash;
                    the message degrades with every step.
                </P>

                {/* ═══ TelephoneGameViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <TelephoneGameViz />
                    </Suspense>
                </FadeInView>

                <P>
                    Researchers added a clever fix: <Highlight color="amber">memory gates</Highlight>{" "}
                    &mdash; tiny neural networks inside each step that decide what to remember and
                    what to forget. They called it the <strong>LSTM</strong> (Long Short-Term
                    Memory). It helped. The memory lasted longer. But it couldn&apos;t solve the
                    fundamental issue.
                </P>

                {/* ═══ LSTMBandageViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <LSTMBandageViz />
                    </Suspense>
                </FadeInView>

                <P>
                    And there was a deeper problem &mdash; one that no gating could fix. The RNN{" "}
                    <em>must</em> process tokens in order. Token 5 waits for token 4. Token 4 waits
                    for token 3. On modern GPUs designed for massive parallelism, this sequential
                    bottleneck was <Highlight color="rose">painfully slow</Highlight>.
                </P>

                {/* ═══ SequentialVsParallelViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <SequentialVsParallelViz />
                    </Suspense>
                </FadeInView>

                {/* ── Beat 3: Exit quickly ── */}
                <P>
                    Remember the real goal: we want each word to change meaning based on context.
                    RNNs tried to solve this by passing a memory forward, but that memory degrades
                    over distance and forces sequential processing. We need something fundamentally
                    different &mdash; a mechanism that lets every word see every other word, all at
                    once, and use that information to rewrite itself.
                </P>

                <KeyTakeaway accent="cyan">
                    RNNs solved token communication but introduced two fatal flaws: information
                    degrades over long sequences, and sequential processing makes them painfully
                    slow. The real goal &mdash; context-dependent meaning &mdash; demands a
                    different architecture entirely.
                </KeyTakeaway>

                <MonsterStatus>
                    👾 I tried reading one word at a time, passing notes forward. By the end of a
                    long sentence, I&apos;ve forgotten how it started. And I&apos;m so slow &mdash;
                    one word at a time while the GPU sits idle. There must be a better way.
                </MonsterStatus>

            </Section>

            <SectionBreak />
            <MonsterInterlude>
                What if, instead of processing tokens one by one with a fragile memory, every
                token could see every other token &mdash; all at once? And what if those
                connections could be different for every sentence?
            </MonsterInterlude>

            {/* ═══════════════════════════════════════════════════
               §03 — WHAT IF TOKENS COULD TALK?
               ═══════════════════════════════════════════════════ */}
            <Section id="transformer-03">
                <SectionLabel number="03" label="What If Tokens Could Talk?" />
                <SectionAnchor id="transformer-03"><Heading>What If Tokens Could Talk?</Heading></SectionAnchor>

                {/* ── Beat 1: The Big Question ── */}
                <FadeInView className="my-10 md:my-16">
                    <motion.p
                        className="text-center text-xl sm:text-2xl md:text-3xl font-bold leading-relaxed max-w-2xl mx-auto bg-gradient-to-r from-cyan-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    >
                        What if every word in a sentence could look at every other word...
                        and decide which ones matter?
                    </motion.p>
                </FadeInView>

                <NarrativeDivider />

                <P>
                    When you read a sentence, you don&apos;t process each word in isolation.
                    Your brain builds connections instantly, effortlessly, in parallel.
                </P>

                <PullQuote>
                    &ldquo;The blue plush creature sat on the shelf.&rdquo;
                </PullQuote>

                <P>
                    What is the &ldquo;creature&rdquo; in this sentence? Without any effort,
                    &ldquo;blue&rdquo; and &ldquo;plush&rdquo; reached across to
                    &ldquo;creature&rdquo; and rewrote its meaning. It&apos;s no longer a generic
                    living thing &mdash; it&apos;s a <em>soft blue stuffed toy</em>. The surrounding
                    words didn&apos;t just provide context &mdash; they{" "}
                    <em>changed what the word means</em>. Click any word to see what enriches it:
                </P>

                {/* ═══ ContextEnrichmentViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <ContextEnrichmentViz />
                    </Suspense>
                </FadeInView>

                <P>
                    Every word gets enriched &mdash; but some more than others. Now let&apos;s see
                    this same idea with a longer, richer sentence:
                </P>

                <PullQuote>
                    &ldquo;The king who wore the golden crown ruled the vast kingdom wisely.&rdquo;
                </PullQuote>

                <P>
                    Your eyes jumped: <Highlight>king</Highlight> <StyledArrow />{" "}
                    <Highlight color="amber">crown</Highlight> <StyledArrow />{" "}
                    <Highlight color="emerald">ruled</Highlight>. You saw the entire sentence
                    and <em>chose</em> what matters. You didn&apos;t read left-to-right carrying a
                    fragile memory. You looked at everything at once.
                </P>

                {/* ── Beat 2: The Spotlight ── */}
                <NarrativeDivider />

                <P>
                    Imagine each word has a <Highlight>spotlight</Highlight>. When you activate a word,
                    its spotlight shines on the other words it cares about &mdash; brighter for stronger
                    connections, dimmer for weaker ones. Every word has its own unique spotlight pattern.
                </P>

                {/* ═══ SpotlightViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <SpotlightViz />
                    </Suspense>
                </FadeInView>

                <P>
                    Click different words. The spotlight pattern changes completely each time.
                    &ldquo;The&rdquo; barely shines on anything. But &ldquo;king&rdquo;?
                    It illuminates &ldquo;crown&rdquo; and &ldquo;ruled&rdquo; across
                    the entire sentence.
                </P>

                <P>
                    Each spotlight pattern is a set of <Highlight color="amber">attention weights</Highlight>{" "}
                    &mdash; numbers that say how much each word should listen to every other word.
                    They are the recipe for building context-aware meaning.
                </P>

                {/* ═══ GuessPatternViz — DEMOTED to collapsible ═══ */}
                <FadeInView className="my-8 md:my-10">
                    <details className="rounded-xl border border-white/8 bg-white/3 overflow-hidden">
                        <summary className="px-4 py-3 cursor-pointer text-sm font-semibold text-white/50 hover:text-white/70 transition-colors select-none list-none flex items-center gap-2">
                            <span className="text-cyan-400/60">▶</span>
                            Challenge: Can you predict the attention pattern?
                        </summary>
                        <div className="p-4">
                            <Suspense fallback={<SectionSkeleton />}>
                                <GuessPatternViz />
                            </Suspense>
                        </div>
                    </details>
                </FadeInView>

                {/* ── Beat 5: Static vs Dynamic ── */}
                <NarrativeDivider />

                <P>
                    Now here&apos;s what makes this fundamentally different from the MLP.
                    The MLP&apos;s weights are{" "}
                    <Highlight color="amber">carved in stone</Highlight> during training &mdash;
                    position 3 always connects to position 1 with the same strength,
                    no matter what the input says.
                </P>

                <P>
                    Attention weights are the opposite. They are computed{" "}
                    <Highlight>fresh for every input</Highlight>.
                    A new sentence means new connections, new strengths, new patterns.
                    The wiring rewires itself for every single sentence.
                </P>

                <Callout icon={Zap}>
                    <strong className="text-white/80">Static (MLP):</strong>{" "}
                    <span className="text-white/50">frozen wiring &mdash; same connections regardless of input. Same output embedding for the same word, always.</span>
                    <br />
                    <strong className="text-white/80">Dynamic (Attention):</strong>{" "}
                    <span className="text-white/50">rewires for every sentence &mdash; connections depend on meaning. Different output embedding depending on context.</span>
                </Callout>

                {/* ═══ StaticVsDynamicViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <StaticVsDynamicViz />
                    </Suspense>
                </FadeInView>

                <P>
                    And when the wiring changes, <em>meaning</em> changes with it.
                    &ldquo;Bank&rdquo; next to &ldquo;river&rdquo; connects to nature words.
                    &ldquo;Bank&rdquo; next to &ldquo;money&rdquo; connects to finance words.
                    Same word, completely different connections, completely different meaning.
                </P>

                <P>
                    Now see the complete picture &mdash; every word&apos;s attention to every
                    other word, all at once:
                </P>

                {/* ═══ AttentionWebViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <AttentionWebViz />
                    </Suspense>
                </FadeInView>

                <P>
                    Every word is simultaneously attending to every other word &mdash; a dense web
                    of weighted connections, computed in parallel. But how do we store all of these
                    relationships? The answer is elegantly simple: a grid where every cell is one
                    connection strength.
                </P>

                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <AttentionHeatmapViz />
                    </Suspense>
                </FadeInView>

                <NarrativeDivider />

                <P>
                    But knowing <em>which words matter</em> is only half the story. That&apos;s
                    just the recipe &mdash; a set of percentages. The real goal is bigger:{" "}
                    <Highlight>rewrite each word&apos;s embedding</Highlight> so its meaning
                    reflects the words around it. Use the recipe to blend information from every
                    relevant word into a new representation.
                </P>

                <P>
                    &ldquo;Bank&rdquo; next to &ldquo;river&rdquo; should pick up nature.
                    &ldquo;Bank&rdquo; next to &ldquo;money&rdquo; should pick up finance.{" "}
                    <em>The same word, different meaning, depending on context.</em> That was our
                    goal from the very first paragraph of this chapter. Watch it happen &mdash;
                    one token&apos;s journey from isolation to context:
                </P>

                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <ContextAssemblyFilmViz />
                    </Suspense>
                </FadeInView>

                <P>
                    That was one word&apos;s journey. But in a transformer, this happens to{" "}
                    <em>every</em> word simultaneously. Watch the entire sentence transform at once:
                </P>

                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <FullContextualAssemblyViz />
                    </Suspense>
                </FadeInView>

                <KeyTakeaway accent="cyan">
                    Attention is not just about finding which words are important. It&apos;s about{" "}
                    <strong>using that knowledge to rewrite each word&apos;s embedding</strong> &mdash;
                    blending context into meaning so that each word becomes a function of everything
                    around it. The attention weights are the recipe. The rewritten embeddings are the meal.
                    Next, we&apos;ll unpack exactly <em>how</em> this mechanism works under the hood.
                </KeyTakeaway>

                <MonsterStatus>
                    👾 I can see what matters and I can see the result &mdash; words that absorb their
                    context and become something new. But how does the math actually work?
                    How does a word figure out what to search for? That&apos;s what I need to learn next.
                </MonsterStatus>

            </Section>

            {/* ── Bridge to §04 ── */}
            <SectionBreak />
            <MonsterInterlude>
                You&apos;ve discovered the idea of attention: tokens looking at each other with
                varying intensity. But how does a token actually KNOW which others are important?
                And more importantly &mdash; how does it use that knowledge to build a new version
                of itself? It starts with a surprisingly simple question: how similar are two words?
            </MonsterInterlude>

            {/* ═══════════════════════════════════════════════════
               §04 — THE ATTENTION MECHANISM
               ═══════════════════════════════════════════════════ */}
            <Section id="transformer-04">
                <SectionLabel number="04" label="The Attention Mechanism" />
                <SectionAnchor id="transformer-04"><Heading>The Attention Mechanism</Heading></SectionAnchor>

                {/* ══════════════════════════════════════════════════════
                   §04a — MEASURING SIMILARITY
                   ══════════════════════════════════════════════════════ */}

                <Lead>
                    We know tokens should talk to each other. But <em>how</em> does a token actually
                    figure out which others are important? It starts with a surprisingly simple question:
                    how similar are two words?
                </Lead>

                <P>
                    In Section 1, we saw that every word becomes a{" "}
                    <Highlight>vector</Highlight> &mdash; a list of features that captures its meaning.
                    That vector is a point in meaning-space. But a point from the origin is also
                    an <em>arrow</em> &mdash; and arrows have something points don&apos;t:{" "}
                    <Highlight color="amber">direction</Highlight>.
                </P>

                <P>
                    Two arrows pointing the same way → the words are similar.
                    Perpendicular → unrelated.
                    Opposite directions → they mean opposite things.
                    Watch how each word&apos;s vector becomes an arrow:
                </P>

                {/* ═══ EmbeddingToArrowViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <EmbeddingToArrowViz />
                    </Suspense>
                </FadeInView>

                <NarrativeDivider />

                <P>
                    So direction tells us similarity. But we need a <em>number</em> &mdash; something
                    the model can actually compute. There&apos;s a beautifully simple operation for this:
                    multiply each pair of matching features and add the results. Same direction gives
                    a big positive number; opposite gives a big negative number; perpendicular gives zero.
                </P>

                <P>
                    Try it &mdash; drag the arrows and watch the score change:
                </P>

                {/* ═══ DotProductCalculatorViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <DotProductCalculatorViz />
                    </Suspense>
                </FadeInView>

                <P>
                    When features match &mdash; both high or both low &mdash; the products are positive
                    and the score climbs. When they disagree, products go negative and the score drops.
                    Notice how the arrows tell the same story: same direction → big score,
                    perpendicular → zero, opposite → negative.
                </P>

                <PullQuote>
                    Same direction → big number. Perpendicular → zero. Opposite → negative.
                </PullQuote>

                <P>
                    This multiply-and-sum operation has a name: the{" "}
                    <Highlight color="amber">dot product</Highlight>. What it <em>does</em> is
                    extraordinary &mdash; it measures how much two things point in the same direction.
                    We turned words into lists of numbers. Now we have a way to measure how related
                    any two words are, with a single number.
                </P>

                <NarrativeDivider />

                <P>
                    Now here&apos;s where it gets exciting. Take every word in a sentence and compute
                    the dot product with <em>every other word</em>. The result? A complete map of
                    relationships &mdash; every word compared to every other word, all at once:
                </P>

                {/* ═══ PairwiseScoringViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <PairwiseScoringViz />
                    </Suspense>
                </FadeInView>

                <NarrativeDivider />

                <P>
                    Wait. Something&apos;s wrong. Look at the{" "}
                    <Highlight color="amber">diagonal</Highlight> of that table &mdash; the cells
                    where a word is compared with itself.
                </P>

                <P>
                    Every word&apos;s highest score is with... <em>itself</em>. Of course. A vector
                    compared with itself always matches perfectly. But that means every word pays the
                    most attention to <em>itself</em>, ignoring all the other words around it.
                    That&apos;s exactly the problem we were trying to solve!
                </P>

                <Callout accent="amber" icon={AlertTriangle}>
                    <strong className="text-white/70">The self-similarity trap:</strong>{" "}
                    <span className="text-white/50">
                        Using raw embeddings, every token pays the most attention to itself. The model
                        would just reinforce what it already knows instead of learning from context.
                    </span>
                </Callout>

                {/* ═══ SelfSimilarityViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <SelfSimilarityViz />
                    </Suspense>
                </FadeInView>

                <P>
                    But the self-similarity trap is only half the story. There&apos;s a deeper problem
                    with using raw embeddings for attention. Let&apos;s see what each word actually
                    finds when it searches for its closest matches:
                </P>

                {/* ═══ EmbeddingAttentionFailureViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <EmbeddingAttentionFailureViz />
                    </Suspense>
                </FadeInView>

                <P>
                    See the pattern? <Highlight color="amber">Embeddings find twins, not partners.</Highlight>{" "}
                    &ldquo;King&rdquo; finds other nouns &mdash; &ldquo;crown,&rdquo; &ldquo;kingdom&rdquo;
                    &mdash; because they share similar features. But &ldquo;king&rdquo; doesn&apos;t{" "}
                    <em>need</em> another noun. It needs the verb that tells you what the king{" "}
                    <em>did</em> (&ldquo;ruled&rdquo;) and the object that defines his status
                    (&ldquo;crown&rdquo; for what he <em>wore</em>, not just as a similar word).
                </P>

                <P>
                    An adjective like &ldquo;golden&rdquo; finds &ldquo;vast&rdquo; &mdash; another
                    adjective. But what &ldquo;golden&rdquo; actually needs is the noun it describes:
                    &ldquo;crown.&rdquo; A verb like &ldquo;ruled&rdquo; finds &ldquo;wore&rdquo;
                    &mdash; another verb. But it should find its subject (&ldquo;king&rdquo;) and its
                    object (&ldquo;kingdom&rdquo;).
                </P>

                <P>
                    <GradientText>Similarity is not relevance.</GradientText>{" "}
                    A word doesn&apos;t search for copies of itself &mdash; it searches for{" "}
                    <em>complements</em>. The pieces that complete its meaning.
                </P>

                {/* ══════════════════════════════════════════════════════
                   §04b — TWO ROLES: QUERY AND KEY
                   ══════════════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    So let&apos;s pause. What does &ldquo;king&rdquo; actually{" "}
                    <em>need</em> from the sentence? Actions, descriptions, objects
                    &mdash; things that <em>complement</em> its meaning. What if each word
                    could broadcast a kind of arrow &mdash;{" "}
                    <Highlight color="cyan">&ldquo;here&apos;s what I&apos;m looking for&rdquo;</Highlight>?
                    King&apos;s arrow would point toward verbs and descriptions.
                    Ruled&apos;s would point toward subjects and objects.
                </P>

                <P>
                    And the other side? Each word also has something to{" "}
                    <em>offer</em>. King offers royalty. Crown offers regality.
                    What if each word also broadcast a second arrow &mdash;{" "}
                    <Highlight color="emerald">&ldquo;here&apos;s what I have to give&rdquo;</Highlight>?
                    Compare these two arrows and matching becomes simple: same direction → high score,
                    different directions → low score.
                </P>

                <P>
                    These arrows have names. The &ldquo;what I need&rdquo; arrow is the{" "}
                    <Highlight color="cyan">Query</Highlight>. The &ldquo;what I offer&rdquo; arrow
                    is the <Highlight color="emerald">Key</Highlight>. Each word gets both &mdash;
                    created by passing its embedding through two different learned matrices:
                </P>

                {/* ═══ QKSplitViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <QKSplitViz />
                    </Suspense>
                </FadeInView>

                <P>
                    &ldquo;King&rdquo; through the Query lens: royalty fades,{" "}
                    <em>action</em> lights up &mdash; king is looking for verbs. Through
                    the Key lens: royalty stays bright &mdash; king <em>offers</em> its royalty to
                    whoever is searching for a noble subject.
                </P>

                <P>
                    But how do we <em>get</em> these Queries and Keys? We multiply each word&apos;s
                    embedding by a <Highlight>learned matrix</Highlight>. The model discovers
                    the exact numbers in this matrix during training &mdash; learning precisely
                    how to transform each embedding into the right perspective. Try it
                    yourself &mdash; click any cell and drag its slider:
                </P>

                {/* ═══ QKMatrixViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <QKMatrixViz />
                    </Suspense>
                </FadeInView>

                <P>
                    We&apos;re using a tiny 2×2 matrix here to make it visual. In real models,
                    embeddings have <Highlight>hundreds</Highlight> of dimensions (GPT uses 768)
                    and queries have 64&ndash;128 dimensions. The matrix is much larger, but the
                    principle is identical &mdash; and the model learns every number during training.
                </P>

                <NarrativeDivider />

                <P>
                    Remember the self-similarity trap? With raw embeddings, king &middot; king = highest
                    score. But now king&apos;s Query emphasizes &ldquo;action&rdquo; while its Key
                    emphasizes &ldquo;royalty&rdquo; &mdash; <em>they point in different directions</em>.
                    &ldquo;Ruled&rdquo; (whose Key screams &ldquo;action!&rdquo;) now scores{" "}
                    <em>higher</em> than king itself!
                </P>

                <P>
                    See the difference for yourself. Toggle between raw embeddings and Q×K
                    projections &mdash; watch the diagonal collapse:
                </P>

                {/* ═══ WhyQKMattersViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <WhyQKMattersViz />
                    </Suspense>
                </FadeInView>

                <NarrativeDivider />

                <P>
                    Now let&apos;s see what happens when one word&apos;s Query meets <em>every</em> Key
                    in the sentence. Pick a word &mdash; see its Query arrow, then compare it against
                    every Key. The closer they point, the higher the score:
                </P>

                {/* ═══ QuerySearchViz ⭐ FLAGSHIP ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <QuerySearchViz />
                    </Suspense>
                </FadeInView>

                <P>
                    See? It&apos;s not magic &mdash; it&apos;s <em>geometry</em>. When Q and K point
                    the same way, the dot product is high. Different directions? Low score.
                    The arrows tell you everything.
                </P>

                <P>
                    Those raw scores get passed through{" "}
                    <Highlight>softmax</Highlight> (the same function from previous chapters) to
                    become percentages: crown 30%, ruled 18%, golden 15%, king itself just 6%.
                    We have a recipe. But{" "}
                    <Highlight color="amber">30% of WHAT exactly?</Highlight>
                </P>

                {/* ══════════════════════════════════════════════════════
                   §04c — THE MISSING PIECE: VALUE
                   (EMOTIONAL PEAK)
                   ══════════════════════════════════════════════════════ */}

                {/* ═══ WeightsOfWhatViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <WeightsOfWhatViz />
                    </Suspense>
                </FadeInView>

                <P>
                    We need something to blend. But what? Could we just use the
                    raw <em>embeddings</em>? Crown&apos;s embedding, ruled&apos;s
                    embedding, golden&apos;s embedding&hellip;
                </P>

                <P>
                    Not quite. The embedding carries <em>everything</em> a word knows
                    about itself &mdash; but not everything is relevant. When &ldquo;crown&rdquo;
                    contributes to &ldquo;king,&rdquo; we want its royalty signal, not its
                    shape or color. The raw embedding is too noisy.
                </P>

                <P>
                    Okay, what about using the Query or Key? We already built those.
                    But no &mdash; the Query is tuned for <em>searching</em>, the Key
                    for <em>advertising</em>. Neither is designed to carry shareable content.
                </P>

                <P>
                    So&hellip; what if we used <Highlight color="amber">the same trick
                        one more time</Highlight>? A third learned matrix. Same idea as Q and K,
                    but this time the matrix learns to extract the information each word
                    should <em>share</em> when it gets picked.
                </P>

                <P>
                    This is the <Highlight color="amber">Value</Highlight> (W<sub>V</sub>).
                    Each word passes its embedding through this third matrix, and out comes
                    a vector optimized for sharing &mdash; the actual content that gets
                    blended into another word&apos;s representation.
                </P>

                {/* Three-card Q/K/V diagram */}
                <div className="max-w-lg mx-auto my-8 sm:my-10">
                    <div className="flex justify-center mb-0">
                        <div
                            className="px-4 py-1.5 rounded-full text-[10px] uppercase tracking-[0.2em] font-semibold"
                            style={{
                                color: "rgba(255,255,255,0.3)",
                                background: "rgba(255,255,255,0.025)",
                                border: "1px solid rgba(255,255,255,0.05)",
                            }}
                        >
                            One embedding
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <svg width="300" height="28" viewBox="0 0 300 28" fill="none" className="overflow-visible">
                            <line x1="150" y1="0" x2="150" y2="10" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                            <path d="M 150 10 Q 150 20, 50 26" stroke="rgba(34,211,238,0.35)" strokeWidth="1" fill="none" strokeLinecap="round" />
                            <path d="M 150 10 Q 150 18, 150 26" stroke="rgba(52,211,153,0.35)" strokeWidth="1" fill="none" strokeLinecap="round" />
                            <path d="M 150 10 Q 150 20, 250 26" stroke="rgba(251,191,36,0.35)" strokeWidth="1" fill="none" strokeLinecap="round" />
                            <circle cx="150" cy="10" r="1.5" fill="rgba(255,255,255,0.2)" />
                        </svg>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {[
                            { label: "Query", icon: "🔍", subtitle: "What am I looking for?", color: "34,211,238" },
                            { label: "Key", icon: "🔑", subtitle: "What do I represent?", color: "52,211,153" },
                            { label: "Value", icon: "📦", subtitle: "Here's my info to share", color: "251,191,36" },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="rounded-xl px-2.5 sm:px-3 py-3 text-center"
                                style={{
                                    background: `linear-gradient(145deg, rgba(${item.color},0.12), rgba(${item.color},0.03) 80%)`,
                                    border: `1px solid rgba(${item.color},0.2)`,
                                }}
                            >
                                <p
                                    className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] font-semibold mb-0.5"
                                    style={{ color: `rgba(${item.color},0.85)` }}
                                >
                                    {item.icon} {item.label}
                                </p>
                                <p
                                    className="text-[10px] sm:text-[11px] italic leading-snug"
                                    style={{ color: `rgba(${item.color},0.55)` }}
                                >
                                    &quot;{item.subtitle}&quot;
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <P>
                    Here&apos;s what we do: take each word&apos;s Value, multiply it by the attention
                    percentage, and <Highlight>add them all up</Highlight>. 30% of crown&apos;s Value +
                    18% of ruled&apos;s + 15% of golden&apos;s + 6% of king&apos;s own Value...
                    The result? A brand new vector that represents &ldquo;king&rdquo;{" "}
                    <em>in this specific context</em>.
                </P>

                <P>
                    The result is a <em>weighted blend</em> of everyone&apos;s information.
                    Step through the process:
                </P>

                {/* ═══ ValueCompletesViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <ValueCompletesViz />
                    </Suspense>
                </FadeInView>

                <NarrativeDivider />

                <P>
                    Let&apos;s see the concrete change. Below, you can compare king&apos;s feature
                    values <em>before</em> attention touched it and <em>after</em> context was
                    blended in:
                </P>

                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <BeforeAfterAttentionViz />
                    </Suspense>
                </FadeInView>

                <P>
                    See the numbers change? That&apos;s not abstract &mdash; that&apos;s the actual
                    transformation. Features that matter for this context got amplified. Features that
                    don&apos;t got suppressed. The embedding literally became a different mathematical
                    object.
                </P>

                <Callout icon={Sparkles}>
                    <strong className="text-white/70">The full picture:</strong>{" "}
                    <span className="text-white/50">
                        Query and Key find who matters. Value carries the information. Attention
                        weights blend it all together. The result: each word&apos;s embedding is
                        rewritten to reflect its context. This is the core of every modern language model.
                    </span>
                </Callout>

                <MonsterStatus>
                    👾 I can ask questions. I can find answers. I can blend information. For the first
                    time, each word I see has a meaning that depends on everything around it.
                    &ldquo;Bank&rdquo; next to &ldquo;river&rdquo; feels different from
                    &ldquo;bank&rdquo; next to &ldquo;money.&rdquo; I don&apos;t just read words
                    &mdash; I understand them <em>in context</em>.
                </MonsterStatus>

                {/* ══════════════════════════════════════════════════════
                   §04d — SCALING, SOFTMAX, AND THE FULL PIPELINE
                   ══════════════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    Our Q·K scores work beautifully with 3 features. But real models don&apos;t use
                    3 &mdash; they use <em>hundreds</em>. GPT uses vectors with 768 dimensions.
                    Why does that matter?
                </P>

                <P>
                    A dot product is a sum of products across all dimensions. With 3 dimensions, you
                    add 3 numbers. With 768, you add 768 numbers. More terms = bigger total. The scores
                    become <em>enormous</em> &mdash; and enormous scores make softmax collapse. One word
                    gets 99.99%, everything else gets nearly zero. The model stops blending and starts{" "}
                    <em>ignoring</em>.
                </P>

                {/* ═══ NumbersExplodeViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <NumbersExplodeViz />
                    </Suspense>
                </FadeInView>

                <P>
                    We need to calm those numbers down. What if we divided all scores by some number
                    before feeding them to softmax? But <Highlight>which number?</Highlight> Try it
                    yourself &mdash; find the divisor that makes the distribution healthy:
                </P>

                {/* ═══ ScalingFixViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <ScalingFixViz />
                    </Suspense>
                </FadeInView>

                <P>
                    The answer: divide by √d &mdash; the square root of the number of dimensions.
                    With 768 dimensions, that&apos;s √768 ≈ 27.7. This keeps scores in a range where
                    softmax can produce a healthy blend instead of a winner-take-all collapse.
                </P>

                <P>
                    Let&apos;s put it all together. The complete attention pipeline: Q·K → scale by
                    √d → softmax → multiply by V → sum to output. Five steps, each one simple,
                    together they&apos;re extraordinary:
                </P>

                {/* ═══ FullScoringPipelineViz ⭐ ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <FullScoringPipelineViz />
                    </Suspense>
                </FadeInView>

                <P>
                    Think of attention as a <Highlight>soft database lookup</Highlight>. A hard lookup
                    picks exactly one item. Attention picks a <em>weighted blend</em> of everything,
                    based on relevance. No information is lost &mdash; every word contributes,
                    proportional to how much it matters.
                </P>

                <P>
                    Each word becomes a function of <em>all</em> other words. That single idea powers
                    GPT, Claude, Gemini, and every modern language model. Here&apos;s the formula
                    &mdash; and every symbol now has a face:
                </P>

                <FormulaBlock
                    formula="Attention(Q, K, V) = softmax(QK^T / √dim) · V"
                    caption="You built this piece by piece. Every symbol makes sense. Q = what am I looking for? K = what do I offer? V = what do I share? √dim = keeping the numbers calm."
                />

                <P>
                    The output of attention is not a score &mdash; it&apos;s a new version of the
                    word. One formula. The most important formula in modern AI. And you understand
                    every piece.
                </P>

                <MonsterStatus>
                    👾 Five steps. Q·K for similarity. Scale to keep numbers calm. Softmax for
                    percentages. Multiply by V for content. Sum for the final answer. One formula.
                    For the first time, every word I see has a meaning that depends on everything
                    around it. I&apos;m not just pattern matching anymore &mdash; I&apos;m
                    understanding context.
                </MonsterStatus>

            </Section>

            <SectionBreak />
            <MonsterInterlude>
                I can pay attention now. But something feels off. When I try to focus on grammar,
                I lose track of meaning. When I chase meaning, I lose grammar. It&apos;s like trying
                to read a book and watch TV at the same time&hellip;
            </MonsterInterlude>

            {/* ═══════════════════════════════════════════════════
               §05 — SEEING MULTIPLE THINGS AT ONCE
               ═══════════════════════════════════════════════════ */}
            <Section id="transformer-05">
                <SectionLabel number="05" label="Seeing Multiple Things at Once" />
                <SectionAnchor id="transformer-05"><Heading>Seeing Multiple Things at Once</Heading></SectionAnchor>
                <Lead>
                    Before we go further, try a quick experiment. I&apos;ll show you a sentence
                    and ask a simple question. There&apos;s no trick &mdash; just answer honestly.
                </Lead>

                {/* ── 1. The game: feel the ambiguity ── */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <WhichWordMattersViz />
                    </Suspense>
                </FadeInView>

                <P>
                    Three rounds. Three sentences. And every time, your answer was valid &mdash;
                    but so was a completely different one. Grammar, meaning, location, action:
                    they all matter <em>at the same time</em>.
                </P>

                <P>
                    Now think about what our attention mechanism does. It produces{" "}
                    <Highlight color="amber">one set of weights</Highlight>. One ranking. One compromise.
                    Boosting one relationship means dimming the others. Try it:
                </P>

                {/* ═══ V27 — OneHeadDilemmaViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <OneHeadDilemmaViz />
                    </Suspense>
                </FadeInView>

                <P>
                    See? One set of weights can only capture <em>one pattern</em>. It&apos;s the
                    same frustration you felt in the game &mdash; forced to pick one answer when
                    several were equally valid.
                </P>

                <NarrativeDivider />

                {/* ── 2. The discovery ── */}
                <P>
                    What if the model didn&apos;t have to choose? What if, instead of one
                    attention system trying to handle everything, we ran{" "}
                    <Highlight color="cyan">multiple attention systems in parallel</Highlight>?
                    Each with its own Q, K, and V matrices. Each free to specialize in a
                    different type of relationship:
                </P>

                {/* ═══ V27b — MultiHeadIdeaViz ═══ */}
                <FadeInView className="my-8 md:my-10">
                    <Suspense fallback={<SectionSkeleton />}>
                        <MultiHeadIdeaViz />
                    </Suspense>
                </FadeInView>

                <P>
                    Here&apos;s the crucial insight: it&apos;s the <Highlight color="amber">V (Value) matrices</Highlight> that
                    make this powerful. Q and K decide <em>who to attend to</em> &mdash; but V decides
                    <em>what information to pass along</em>. A syntax head&apos;s V matrix might extract
                    &ldquo;this is a verb in past tense,&rdquo; while a meaning head&apos;s V matrix extracts
                    &ldquo;this is related to academia.&rdquo; Same word, completely different signals.
                </P>

                <P>
                    This is called <Highlight color="cyan">Multi-Head Attention</Highlight>.
                    Instead of one set of eyes forced into a single compromise, the model gets
                    <em> many sets of eyes</em>, each specialized in a different aspect of language.
                    Watch how each head sees something different:
                </P>

                {/* ═══ V28 — MultiLensViewViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <MultiLensViewViz />
                    </Suspense>
                </FadeInView>

                <P>
                    And here&apos;s what makes it efficient: each head doesn&apos;t work with the
                    full embedding. If an embedding has 512 dimensions and we have 4 heads,
                    each head gets <Highlight color="cyan">its own exclusive slice of 128 dimensions</Highlight>.
                    The slices <em>don&apos;t overlap</em> &mdash; head 1 might own dimensions 1&ndash;128 (syntax
                    features), head 2 owns 129&ndash;256 (semantic features), and so on. Each head
                    becomes an expert in its own subset of the word&apos;s features, and none of
                    them compete for the same information.
                </P>

                <NarrativeDivider />

                {/* ── 4. Full pipeline: embedding → heads → attention → concat → output ── */}
                <P>
                    But we can&apos;t just leave 4 separate outputs. The rest of the model expects
                    <em> one vector per word</em>. So we <Highlight color="amber">concatenate</Highlight> all
                    head outputs &mdash; stacking each head&apos;s slice back together into one
                    long vector, then <Highlight color="cyan">projecting</Highlight> it back to
                    the original embedding size. The result: every word now carries information
                    from all four perspectives at once. Watch it happen:
                </P>

                {/* ═══ V32 — MultiHeadPipelineViz (flagship) ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <MultiHeadPipelineViz />
                    </Suspense>
                </FadeInView>

                <NarrativeDivider />

                {/* ── 6. The budget trade-off ── */}
                <P>
                    There&apos;s a practical question: <Highlight>how many heads?</Highlight> The total
                    dimension is fixed (say 512). More heads means each one gets fewer dimensions.
                    Too few heads and you miss patterns. Too many and each head is too narrow to learn anything useful.
                </P>

                {/* ═══ V31 — HeadBudgetViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <HeadBudgetViz />
                    </Suspense>
                </FadeInView>

                <P>
                    GPT-2 uses 12 heads with 64 dimensions each. GPT-3 uses 96 heads with 128 dimensions each.
                    The sweet spot depends on the model size, but the principle is always the same:
                    <em> split the work across specialized workers</em>.
                </P>

                <MonsterStatus>
                    👾 I have many eyes now! Each sees something different. One eye watches grammar.
                    Another watches meaning. A third tracks nearby context. Together they see
                    everything a single head never could. I am not just paying attention &mdash;
                    I am paying attention in <em>multiple ways at once</em>.
                </MonsterStatus>

                <KeyTakeaway accent="cyan">
                    Multi-head attention runs multiple independent attention systems in parallel.
                    Each head learns to capture different relationship types. Their outputs are
                    concatenated and projected back to the original dimension. This gives the model
                    the ability to simultaneously attend to grammar, meaning, position, and more.
                </KeyTakeaway>
            </Section>

            <SectionBreak />
            <MonsterInterlude>
                Our attention mechanism is powerful. But try scrambling the words:
                &quot;dog bites man&quot; and &quot;man bites dog.&quot; Same attention, same output.
                It has NO idea about order.
            </MonsterInterlude>

            {/* ═══════════════════════════════════════════════════
               §06 — WHERE AM I?
               ═══════════════════════════════════════════════════ */}
            <Section id="transformer-06">
                <SectionLabel number="06" label="Where Am I?" />
                <SectionAnchor id="transformer-06"><Heading>Where Am I?</Heading></SectionAnchor>

                {/* ── Beat 1: The Puzzle ── */}
                <Lead>
                    Read these two sentences:
                </Lead>

                <PullQuote>
                    &ldquo;The dog <strong>bit</strong> the man.&rdquo;<br />
                    &ldquo;The man <strong>bit</strong> the dog.&rdquo;
                </PullQuote>

                <P>
                    Same words. Completely different meaning. One is a news story. The other
                    is a headline.
                </P>

                <P>
                    Now imagine our attention mechanism reading them. It computes Q&middot;K
                    for every pair of words, runs softmax, blends Values. Go ahead &mdash;
                    look at the attention weights for both sentences:
                </P>

                {/* ── Beat 2: The Surprise ── */}
                {/* ═══ ShuffleDisasterViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <ShuffleDisasterViz />
                    </Suspense>
                </FadeInView>

                <P>
                    Strangely&hellip; the model produces the <Highlight>exact same result</Highlight>.
                    Same attention weights. Same output. Two completely different stories, and the
                    model can&apos;t tell them apart.
                </P>

                {/* ── Beat 3: Why This Happens ── */}
                <NarrativeDivider />

                <P>
                    Why? Because attention compares every word with every other word using
                    dot products. But a dot product doesn&apos;t care about <em>order</em>.
                    &ldquo;dog&rdquo; &middot; &ldquo;bit&rdquo; gives the same score whether
                    &ldquo;dog&rdquo; came first or last. Shuffle the input however you want &mdash;
                    every single dot product stays the same.
                </P>

                <P>
                    Attention treats the sentence like a{" "}
                    <Highlight color="amber">bag of words</Highlight>. Not a sequence.
                    Order doesn&apos;t exist.
                </P>

                {/* ── Beat 4: First Idea ── */}
                <NarrativeDivider />

                <P>
                    Your first instinct might be: <em>just number the positions</em>.
                    Position 1 gets the number 1, position 2 gets 2, position 3 gets 3.
                    Add that number to the embedding. Done. The model now knows where
                    each word sits.
                </P>

                <P>
                    Sounds reasonable. Let&apos;s see what happens.
                </P>

                {/* ── Beat 5: Why That Fails ── */}
                <P>
                    A word embedding has values around <Highlight color="cyan">-1 to 1</Highlight>.
                    Subtle numbers that encode meaning: 0.3 for &ldquo;animal,&rdquo; -0.7
                    for &ldquo;abstract,&rdquo; 1.2 for &ldquo;living.&rdquo; Now add the
                    position number. Position 500? That&apos;s{" "}
                    <Highlight color="amber">+500</Highlight>. The model sees 500.3 and
                    thinks <em>&ldquo;that&apos;s basically just 500.&rdquo;</em> It forgot
                    what the word even means.
                </P>

                {/* ═══ SimpleNumbersViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <SimpleNumbersViz />
                    </Suspense>
                </FadeInView>

                {/* ── Beat 6: Deeper Problem ── */}
                <NarrativeDivider />

                <P>
                    But there&apos;s an even deeper problem. Even if we found the perfect scale,
                    we&apos;d be cramming all position information into <em>one number</em>.
                </P>

                <P>
                    Think about it this way. Imagine describing your exact location on Earth
                    with a single number. You can&apos;t. You need at least <em>two</em> &mdash;
                    latitude and longitude. One number tells you north/south. The other tells
                    you east/west. Together they pinpoint you. Alone, neither is enough.
                </P>

                <P>
                    Position is the same. We need a <Highlight>rich description</Highlight>,
                    not a single value. A list of numbers. A <em>pattern</em>.
                </P>

                {/* ── Beat 7: The Insight ── */}
                <NarrativeDivider />

                <P>
                    Wait.
                </P>

                <P>
                    We already solved a problem exactly like this.
                </P>

                <P>
                    <em>Word embeddings.</em>
                </P>

                <P>
                    Each word got its own list of features &mdash; a vector of numbers that
                    describes it. &ldquo;Dog&rdquo; might be [0.9, -0.3, 0.7, 0.1] &mdash;
                    high on &ldquo;animal,&rdquo; low on &ldquo;human.&rdquo; Not one number.
                    A whole <Highlight>fingerprint</Highlight>.
                </P>

                {/* ── Beat 8: Positions as Embeddings ── */}
                <P>
                    What if we did the{" "}
                    <Highlight color="amber">same thing for positions</Highlight>? Position 1
                    gets its own list of numbers. Position 2 gets a different list. Position 3,
                    another. Just like word embeddings, but instead of describing <em>what</em> a
                    word means, these describe <em>where</em> it sits.
                </P>

                <P>
                    This is exactly what we do. We create a{" "}
                    <Highlight>position embedding table</Highlight> &mdash; one vector per
                    position, each the same size as the word embeddings. The model learns
                    these during training, just like it learns word meanings. GPT-2,
                    for example, does exactly this.
                </P>

                <P>
                    Explore the table below. Each position has its own unique pattern of
                    numbers &mdash; a learned fingerprint for <em>where</em> a word sits.
                    Click two positions to compare them side by side.
                </P>

                {/* ═══ LearnedPositionEmbeddingsViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <LearnedPositionEmbeddingsViz />
                    </Suspense>
                </FadeInView>

                {/* ── Beat 9: The limitation ── */}
                <P>
                    Simple and effective. But with a catch: you have to decide the maximum
                    sequence length <em>before</em> training. If you trained with 512 positions,
                    position 513 has no embedding. The model simply hasn&apos;t learned one.
                </P>

                <P>
                    For most practical purposes this works fine &mdash; just pick a large
                    enough maximum. But in 2017, when the original Transformer paper
                    (&ldquo;Attention Is All You Need&rdquo;) was published, the authors
                    proposed something more elegant. A solution based purely
                    on <Highlight color="amber">mathematics</Highlight> &mdash; one that
                    works for <em>any</em> position, no matter how large, without having
                    to learn anything at all.
                </P>

                {/* ── Beat 10: The Beautiful Trick — Waves ── */}
                <NarrativeDivider />

                <P>
                    <Highlight color="amber">Waves</Highlight>.
                </P>

                <P>
                    Imagine a clock with many hands, each spinning at a different speed.
                    One hand completes a full rotation every 2 positions (very fast). Another
                    every 4. Another every 8. Another every 16. Slower and slower.
                </P>

                <P>
                    At any given position, read off where each hand is pointing. That combination
                    of readings is <em>unique</em> for every position. A{" "}
                    <Highlight>fingerprint made of waves</Highlight>.
                </P>

                {/* ═══ WaveFingerprintViz ⭐ ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <WaveFingerprintViz />
                    </Suspense>
                </FadeInView>

                <P>
                    Each wave has a job. The <Highlight color="cyan">fast wave</Highlight> changes
                    with every position &mdash; your exact seat number. The{" "}
                    <Highlight color="amber">medium wave</Highlight> changes every few positions
                    &mdash; which paragraph you&apos;re in. The{" "}
                    <Highlight color="amber">slow wave</Highlight> barely moves &mdash; which
                    section of the text, near the beginning or the end.
                </P>

                <P>
                    Together: <Highlight>fine detail</Highlight> (position 5 vs 6) and{" "}
                    <Highlight>big picture</Highlight> (beginning vs middle vs end). Like an
                    address &mdash; fast waves are your street number, medium waves your
                    neighborhood, slow waves your city.
                </P>

                {/* ── Beat 11: Why Waves Work ── */}
                <NarrativeDivider />

                <P>
                    Here&apos;s why waves are so clever. Two positions that are <em>close
                        together</em> (like 10 and 11) have very{" "}
                    <Highlight color="cyan">similar</Highlight> wave readings. Two positions
                    far apart (like 10 and 200) have completely different readings. Nearby
                    words naturally get similar encodings &mdash; which is exactly what
                    language needs.
                </P>

                {/* ═══ PositionalSimilarityViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <PositionalSimilarityViz />
                    </Suspense>
                </FadeInView>

                <P>
                    The math uses sine and cosine &mdash; each dimension gets a wave at a
                    different frequency:
                </P>

                <FormulaBlock
                    formula="PE_{(pos, 2i)} = \sin\!\bigl(\tfrac{pos}{10000^{2i/d}}\bigr) \qquad PE_{(pos, 2i+1)} = \cos\!\bigl(\tfrac{pos}{10000^{2i/d}}\bigr)"
                    caption="Each dimension uses a different frequency. Even dimensions get sine, odd get cosine. Together they create a unique fingerprint for every position."
                />

                <P>
                    Don&apos;t worry about the formula. What matters is the idea: each position
                    gets a <em>unique pattern</em> generated by a formula that works for{" "}
                    <Highlight>any position number</Highlight>. No maximum length.
                </P>

                {/* ── Beat 12: Putting It Together ── */}
                <NarrativeDivider />

                <P>
                    The final step is beautifully simple. Take the word embedding (what the
                    word <em>means</em>). Take the positional encoding (where it <em>sits</em>).{" "}
                    <Highlight color="amber">Add them together</Highlight>. That&apos;s it.
                </P>

                <FormulaBlock
                    formula="x = \text{word\_embedding} + \text{positional\_encoding}"
                    caption="Meaning + position. Now the model knows both WHAT a word is and WHERE it is."
                />

                <P>
                    After this addition, &ldquo;dog&rdquo; at position 1 has a slightly different
                    vector than &ldquo;dog&rdquo; at position 5. The attention mechanism can
                    finally tell them apart. &ldquo;Dog bit man&rdquo; and &ldquo;man bit dog&rdquo;
                    produce <em>different</em> attention patterns. Order is restored.
                </P>

                {/* ═══ AddEmbeddingsViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <AddEmbeddingsViz />
                    </Suspense>
                </FadeInView>

                {/* ═══ PositionInActionViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <PositionInActionViz />
                    </Suspense>
                </FadeInView>

                <MonsterStatus>
                    👾 I can finally feel WHERE things are. Position 1 feels different from
                    position 100. The same word in different places carries different meaning.
                    Order is part of me now.
                </MonsterStatus>

                <KeyTakeaway accent="cyan">
                    Attention is order-blind &mdash; it treats input as a set, not a sequence.
                    Positional encoding fixes this by adding a unique wave-based fingerprint
                    to each position. Nearby positions have similar encodings, distant ones differ.
                    The result: meaning + position, combined through simple addition.
                </KeyTakeaway>
            </Section>

            <SectionBreak />
            <MonsterInterlude>
                You have attention (communication). You have embeddings (meaning). You have positions (order).
                Time to assemble the full block.
            </MonsterInterlude>

            {/* ═══════════════════════════════════════════════════
               §07 — THE FULL ARCHITECTURE
               ═══════════════════════════════════════════════════ */}
            <Section id="transformer-07">
                <SectionLabel number="07" label="The Full Architecture" />
                <SectionAnchor id="transformer-07"><Heading>The Full Architecture</Heading></SectionAnchor>
                <Lead>
                    You&apos;ve built attention &mdash; the ability to listen.
                    But is listening <Highlight>enough</Highlight>?
                </Lead>

                {/* ══════════════════════════════════════════════
                   BEAT 1 — THE PUZZLE (attention alone fails)
                   ══════════════════════════════════════════════ */}

                <P>
                    Try a quick experiment. Read this and complete it instantly:
                </P>

                <PullQuote>Michael Jordan plays ???</PullQuote>

                <P>
                    You thought <Highlight>basketball</Highlight>. Immediately. No
                    hesitation. Your brain gathered the relevant context &mdash;
                    &ldquo;Michael Jordan&rdquo; and &ldquo;plays&rdquo; &mdash;
                    and then <em>reasoned</em> from it to produce an answer.
                    Two separate steps: gathering, then thinking.
                </P>

                <P>
                    Now let&apos;s see what attention alone does with that same sentence.
                </P>

                {/* ═══ V38b — AttentionAloneFailsViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <AttentionAloneFailsViz />
                    </Suspense>
                </FadeInView>

                <P>
                    Attention did its job perfectly: it gathered context. The
                    embedding for &ldquo;plays&rdquo; now carries traces of
                    &ldquo;Michael&rdquo; and &ldquo;Jordan.&rdquo; But
                    that&apos;s <em>all</em> it did. The result is a{" "}
                    <Highlight>blend</Highlight> of the original embeddings &mdash;
                    it points toward where &ldquo;Michael Jordan&rdquo; lives in
                    vector space, but it hasn&apos;t made the <em>leap</em> to{" "}
                    <Highlight color="amber">basketball</Highlight>. Attention
                    listened perfectly, but it doesn&apos;t know how to{" "}
                    <em>think</em>.
                </P>

                {/* ══════════════════════════════════════════════
                   BEAT 2 — THE GAP (listening ≠ understanding)
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    Think about how <em>you</em> learn in a conversation.
                    First, you <Highlight>listen</Highlight> &mdash; you gather information
                    from what others are saying. Then you{" "}
                    <Highlight color="amber">think</Highlight> &mdash;
                    you process what you heard, connect it to what you already know,
                    and form your own understanding.
                </P>

                <P>
                    Attention is the listening phase. Embeddings go in, enriched embeddings
                    come out &mdash; <em>same shape, same type</em>, just with context mixed in.
                    But we need a second phase to actually <Highlight color="amber">process</Highlight> what
                    was gathered.
                </P>

                {/* ═══ V38 — CommunicationVsProcessingViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <CommunicationVsProcessingViz />
                    </Suspense>
                </FadeInView>

                {/* ══════════════════════════════════════════════
                   BEAT 3 — THE RECOGNITION (FFN = MLP callback)
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    So what does the &quot;thinking&quot; part look like? Each token
                    takes its enriched vector (now full of context from attention) and
                    runs it through a function: expand into a larger space, apply an
                    activation, then compress back down.
                </P>

                <P>
                    Wait. Input <StyledArrow /> expand <StyledArrow /> activation{" "}
                    <StyledArrow /> compress. That&apos;s <em>exactly</em> the
                    feedforward network you built in the MLP chapter! Two layers
                    with a non-linearity in between.
                </P>

                <Callout accent="amber" icon={Zap} title="You Built This!">
                    The feedforward network inside each Transformer block is the same MLP
                    architecture from the previous chapter. Attention handles communication
                    between tokens. The FFN handles private processing within each token.
                </Callout>

                <P>
                    And here&apos;s the exciting part. Remember the MLP from the
                    previous chapter? It was powerful but <em>blind</em> &mdash;
                    it could only see a tiny fixed window of tokens. Its problem
                    was never the architecture. It was the{" "}
                    <Highlight color="amber">lack of context</Highlight>.
                </P>

                <P>
                    Now look at what we&apos;ve done. Attention gathers context from
                    the <em>entire</em> sequence. Every token can see every other token.
                    And <em>then</em> we feed that rich, context-aware
                    embedding into the same MLP architecture. The brain that was
                    starving for information now has{" "}
                    <Highlight>everything it needs</Highlight>.
                </P>

                {/* ═══ V39 — FFNCallbackViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <FFNCallbackViz />
                    </Suspense>
                </FadeInView>

                <P>
                    Think of the FFN as each token&apos;s{" "}
                    <Highlight color="amber">private notebook</Highlight>.
                    After listening to the conversation (attention), each token sits alone
                    and processes what it heard. Attention decided <em>what</em> to look at.
                    The FFN processes <em>what it found</em>.
                </P>

                {/* ══════════════════════════════════════════════
                   BEAT 4 — FFN DEEP DIVE
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    But what is the FFN actually <em>doing</em>?
                    Think back to our example. Attention blended
                    &ldquo;Michael Jordan&rdquo; into &ldquo;plays.&rdquo; The
                    resulting embedding now <em>points toward</em> Michael Jordan
                    in vector space. But &ldquo;basketball&rdquo; lives somewhere
                    completely different. Getting there requires a{" "}
                    <Highlight color="amber">transformation</Highlight> &mdash;
                    not just blending, but genuine computation.
                </P>

                <P>
                    That&apos;s the FFN&apos;s job. It takes the blended embedding
                    and asks hundreds of learned questions simultaneously:
                    &ldquo;Is this a person?&rdquo; &ldquo;Is this related to
                    sports?&rdquo; &ldquo;Is this an action in a competitive
                    context?&rdquo; Most answers are &ldquo;no&rdquo; &mdash;
                    those get silenced. The few that fire &mdash;{" "}
                    <Highlight>person + sports + competition</Highlight> &mdash;
                    combine to push the embedding toward{" "}
                    <Highlight color="amber">basketball</Highlight>.
                </P>

                <P>
                    The input was a blend. The output is an{" "}
                    <em>understanding</em>. Same shape, same size &mdash; but
                    now pointing somewhere entirely new. Somewhere attention
                    alone could never reach.
                </P>

                {/* ═══ FFNDeepDiveViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <FFNDeepDiveViz />
                    </Suspense>
                </FadeInView>

                {/* ══════════════════════════════════════════════
                   BEAT 5 — THE FRAGILITY (value drift)
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    We now have both pieces: <Highlight>attention</Highlight> to listen
                    and <Highlight color="amber">FFN</Highlight> to think.
                    Let&apos;s stack them and see what happens. Run the data through
                    attention, then FFN, then attention again&hellip;
                </P>

                <P>
                    Watch the values below as you increase the number of operations.
                    Something goes wrong.
                </P>

                {/* ═══ ValueDriftViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <ValueDriftViz />
                    </Suspense>
                </FadeInView>

                {/* ══════════════════════════════════════════════
                   BEAT 6 — THE SHORTCUTS (residual connections)
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    The values exploded. Each operation amplifies small differences,
                    and the original information gets buried under layers of changes.
                    We need a way to <em>preserve</em> the original signal.
                </P>

                <P>
                    What if, after each operation, we simply{" "}
                    <Highlight>added the original input back</Highlight> to the output?
                    A direct shortcut &mdash; the output becomes &ldquo;what changed&rdquo;
                    <em>plus</em> &ldquo;what was already there.&rdquo; The Transformer
                    uses this trick twice: once after attention, once after the FFN.
                </P>

                {/* ═══ V40 — HighwayReturnsViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <HighwayReturnsViz />
                    </Suspense>
                </FadeInView>

                {/* ══════════════════════════════════════════════
                   BEAT 7 — THE STABILIZER (layer normalization)
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    The second fix: <Highlight color="amber">Layer Normalization</Highlight>.
                    Before each major operation, the model corrects every token&apos;s
                    values &mdash; pulling outliers back in line, centering everything
                    around zero, and squeezing the range to a healthy size.
                    It&apos;s like taking a deep breath before each step.
                </P>

                <P>
                    The result: values stay calm, gradients stay healthy, and training
                    stays stable &mdash; no matter how many operations you stack.
                </P>

                {/* ═══ V41 — LayerNormViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <LayerNormViz />
                    </Suspense>
                </FadeInView>

                {/* MLP link + BatchNorm vs LayerNorm collapsible */}
                <P>
                    We covered normalization techniques in depth in the{" "}
                    <a href="/lab/mlp#mlp-06" className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300 transition-colors">
                        MLP chapter &sect;06
                    </a>. If you read that, you might be wondering: how does
                    LayerNorm differ from BatchNorm?
                </P>

                <FadeInView className="my-6">
                    <details className="group max-w-lg mx-auto rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
                        <summary className="flex items-center justify-between px-5 py-3 cursor-pointer text-[14px] font-semibold text-cyan-400/60 hover:text-cyan-400/80 transition-colors select-none list-none [&::-webkit-details-marker]:hidden">
                            <span>BatchNorm vs LayerNorm &mdash; what changed?</span>
                            <span className="text-[12px] text-white/20 group-open:rotate-180 transition-transform">{"\u25BC"}</span>
                        </summary>
                        <div className="border-t border-white/5">
                            <Suspense fallback={<SectionSkeleton />}>
                                <BatchVsLayerNormViz />
                            </Suspense>
                        </div>
                    </details>
                </FadeInView>

                {/* ══════════════════════════════════════════════
                   BEAT 8 — ASSEMBLY
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    Every piece is in place. Let&apos;s take stock:
                </P>

                <div className="my-6 max-w-md mx-auto grid grid-cols-2 gap-2.5">
                    {[
                        { label: "Self-Attention", desc: "Tokens listen to each other", icon: "\uD83D\uDC42", color: "#22d3ee", rgb: "34,211,238" },
                        { label: "Feed-Forward", desc: "Each token thinks privately", icon: "\uD83E\uDDE0", color: "#fbbf24", rgb: "251,191,36" },
                        { label: "Residual Add", desc: "Preserve original signal", icon: "\u2795", color: "#22d3ee", rgb: "34,211,238" },
                        { label: "Layer Norm", desc: "Keep values stable", icon: "\u2696\uFE0F", color: "#fbbf24", rgb: "251,191,36" },
                    ].map((item, i) => (
                        <motion.div
                            key={item.label}
                            className="rounded-xl px-3.5 py-3 flex flex-col gap-1"
                            style={{
                                background: `rgba(${item.rgb}, 0.04)`,
                                border: `1px solid rgba(${item.rgb}, 0.12)`,
                            }}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08, type: "spring", stiffness: 120, damping: 14 }}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-[16px]">{item.icon}</span>
                                <span className="text-[13px] font-bold" style={{ color: item.color }}>{item.label}</span>
                            </div>
                            <span className="text-[12px] text-white/30 leading-snug">{item.desc}</span>
                        </motion.div>
                    ))}
                </div>

                <P>
                    These four components, arranged in the right order, form one{" "}
                    <Highlight>Transformer block</Highlight>. The recipe:{" "}
                    <Highlight>normalize, attend, add; normalize, FFN, add</Highlight>.
                </P>

                <P>
                    Why this order? Normalization before each operation levels the
                    playing field &mdash; attention and FFN both get clean, balanced input.
                    The residual add after each operation preserves the original,
                    so nothing valuable is thrown away. Now put that knowledge to the test.
                </P>

                {/* ═══ V42 — BlockBuilderViz ⭐⭐ ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <BlockBuilderViz />
                    </Suspense>
                </FadeInView>

                <NarrativeDivider />

                <P>
                    Want to go deeper? <Highlight>Explore the block</Highlight> component
                    by component. Click any piece to zoom in and see exactly what
                    happens inside.
                </P>

                {/* ═══ BlockComponentExplorerViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <BlockComponentExplorerViz />
                    </Suspense>
                </FadeInView>

                {/* ══════════════════════════════════════════════
                   BEAT 9 — HOW BIG IS A BLOCK?
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <Callout icon={Brain} accent="amber" title="How big is a single block?">
                    <p>
                        With a typical dimension of d=768, each Transformer block
                        contains about <strong className="text-white/70">7 million parameters</strong>:
                        the Q, K, V projection matrices for attention (~2.4M), the output
                        projection (~0.6M), and the FFN&apos;s two weight matrices (~3.5M).
                        Compare that to our entire MLP from the previous chapter, which
                        had ~300K parameters. A single block is <strong className="text-white/70">20&times;</strong> larger &mdash;
                        the cost of understanding context.
                    </p>
                </Callout>

                {/* ══════════════════════════════════════════════
                   BEAT 10 — MONSTER ASSEMBLY
                   ══════════════════════════════════════════════ */}

                <FadeInView className="my-12 md:my-16">
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center justify-center gap-2">
                            {[
                                { icon: "⚖️", color: "#a78bfa", delay: 0, from: { x: -60, y: -30 } },
                                { icon: "👂", color: "#22d3ee", delay: 0.15, from: { x: 60, y: -30 } },
                                { icon: "⊕", color: "#34d399", delay: 0.3, from: { x: -60, y: 30 } },
                                { icon: "🧠", color: "#fbbf24", delay: 0.45, from: { x: 60, y: 30 } },
                            ].map((part) => (
                                <motion.div
                                    key={part.icon}
                                    className="w-14 h-14 rounded-xl flex items-center justify-center text-[22px]"
                                    style={{
                                        background: `${part.color}10`,
                                        border: `1.5px solid ${part.color}30`,
                                        boxShadow: `0 0 20px -4px ${part.color}20`,
                                    }}
                                    initial={{ opacity: 0, x: part.from.x, y: part.from.y, scale: 0.5 }}
                                    whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 200,
                                        damping: 15,
                                        delay: part.delay,
                                    }}
                                >
                                    {part.icon}
                                </motion.div>
                            ))}
                        </div>

                        <motion.div
                            className="w-64 h-1 rounded-full"
                            style={{
                                background: "linear-gradient(90deg, #a78bfa40, #22d3ee40, #34d39940, #fbbf2440)",
                            }}
                            initial={{ opacity: 0, scaleX: 0 }}
                            whileInView={{ opacity: 1, scaleX: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.7, type: "spring", stiffness: 100, damping: 14 }}
                        />

                        <motion.p
                            className="text-center text-lg md:text-xl font-bold bg-gradient-to-r from-cyan-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent"
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.9, duration: 0.5 }}
                        >
                            👾 I am assembled. Attention to hear. FFN to think.
                            Residuals to remember. Normalization to stay calm.
                            I am a Transformer block.
                        </motion.p>
                    </div>
                </FadeInView>

                {/* ══════════════════════════════════════════════
                   BEAT 11 — ONE BLOCK ISN'T ENOUGH
                   (absorbed from old §08 beat 2)
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    One block is powerful. It can listen, think, and stabilize.
                    But is one pass through attention and FFN{" "}
                    <Highlight>really enough</Highlight> to understand language?
                </P>

                <P>
                    Think about it. In a single block, each token gets{" "}
                    <em>one chance</em> to look at the other tokens. One round of
                    listening. One round of thinking. That&apos;s like reading a sentence
                    once and claiming you understand everything about it.
                </P>

                <P>
                    Language is layered. First you figure out which words are
                    next to each other ({" "}
                    <Highlight color="amber">syntax</Highlight>).
                    Then which words <em>relate</em> to each other ({" "}
                    <Highlight color="amber">semantics</Highlight>).
                    Then what the whole sentence <em>means</em> ({" "}
                    <Highlight>context</Highlight>).
                    One block can&apos;t do all three.
                </P>

                {/* ══════════════════════════════════════════════
                   BEAT 12 — THE STACKING INSIGHT
                   (absorbed from old §08 beat 3)
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    But wait &mdash; we&apos;ve seen this trick before. When the MLP
                    had one hidden layer and couldn&apos;t learn complex patterns,
                    what did we do?{" "}
                    <Highlight>We added more layers.</Highlight> Each layer built on
                    the previous one, extracting increasingly abstract features.
                </P>

                <P>
                    What if we do the same thing here? Take the output of one
                    Transformer block and feed it into another. The second block
                    asks <em>new questions</em> about representations that are
                    already context-aware. The third refines even further.
                </P>

                <Callout icon={Layers} title="The insight">
                    Stack identical Transformer blocks. Block 1 captures local patterns.
                    Block 3 captures syntax. Block 6 captures abstract meaning.
                    Same architecture, repeated &mdash; creating deeper and deeper understanding.
                </Callout>

                {/* ═══ LayerEvolutionViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <LayerEvolutionViz />
                    </Suspense>
                </FadeInView>

                {/* ══════════════════════════════════════════════
                   BEAT 13 — THE LINEAR HEAD + SOFTMAX
                   (new content)
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    The stacked blocks produce refined embeddings &mdash; rich vectors
                    that encode meaning, context, and position. But we need{" "}
                    <Highlight>predictions</Highlight> &mdash; probabilities over every
                    character in our vocabulary. Two final steps bridge the gap.
                </P>

                <P>
                    <strong>Step 1 &mdash; The Linear Head.</strong> A single matrix
                    multiplication projects each embedding (dimension d) into a vector
                    of <em>raw scores</em> &mdash; one score per character in the
                    vocabulary. Think of it as the{" "}
                    <Highlight color="amber">inverse of embedding</Highlight>: embedding
                    turns a character into a vector; the linear head turns a vector back
                    into character scores.
                </P>

                <P>
                    <strong>Step 2 &mdash; Softmax.</strong> Raw scores can be any
                    number &mdash; positive, negative, huge, tiny. Softmax squashes them
                    into a proper probability distribution: every value between 0 and 1,
                    all summing to exactly 1. The highest score dominates; the lowest
                    scores vanish to near-zero. The model{" "}
                    <Highlight color="amber">chooses</Highlight> by sampling from this
                    distribution.
                </P>

                {/* ═══ LinearSoftmaxViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <LinearSoftmaxViz />
                    </Suspense>
                </FadeInView>

                {/* ══════════════════════════════════════════════
                   BEAT 14 — THE FULL ARCHITECTURE
                   (absorbed from old §08 beat 5)
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    Now let&apos;s zoom out and see the complete architecture. From
                    raw text to predictions, here&apos;s every piece working together:
                </P>

                <P>
                    <Highlight>Inputs</Highlight> <StyledArrow />{" "}
                    <Highlight color="amber">Embedding</Highlight> (words → vectors) <StyledArrow />{" "}
                    <Highlight>+ Positional Encoding</Highlight> <StyledArrow />{" "}
                    <Highlight color="amber">Transformer Block × N</Highlight> (repeated) <StyledArrow />{" "}
                    <Highlight>Linear Head</Highlight> (vectors → scores) <StyledArrow />{" "}
                    <Highlight>Softmax</Highlight> (scores → probabilities) <StyledArrow />{" "}
                    <strong className="text-white/80">Output</strong>
                </P>

                <P>
                    The embedding turns each word into a vector. Positional encoding
                    adds &quot;where am I?&quot; Then the stacked blocks refine these
                    representations, layer after layer. Finally, the{" "}
                    <Highlight color="amber">Linear Head</Highlight> does the{" "}
                    <em>inverse</em> of embedding: it takes each vector and produces
                    a score for every word in the vocabulary. Softmax turns those
                    scores into probabilities.
                </P>

                {/* ═══ TransformerBlockExplorerViz — FLAGSHIP ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <TransformerBlockExplorerViz />
                    </Suspense>
                </FadeInView>

                <Callout icon={Layers} accent="amber" title="Modern scale — pure curiosity">
                    <p>
                        GPT-2 (2019):{" "}
                        <strong className="text-white/60">12 blocks</strong>, 117M
                        parameters, dimension 768. Each block adds ~7M params.{" "}
                        GPT-3 (2020):{" "}
                        <strong className="text-white/60">96 blocks</strong>, 175B
                        parameters, dimension 12,288 &mdash; at that scale each block
                        is ~1.8B parameters.
                        The architecture you just learned is the same one powering
                        these systems. Only the numbers change.
                    </p>
                </Callout>

                <MonsterStatus gradient="cyan-amber">
                    👾 I am complete. Attention to hear. FFN to think. Residuals to remember.
                    Normalization to stay calm. Stacked blocks for depth. A linear head to
                    speak. Softmax to choose. I am a Transformer.
                </MonsterStatus>

                <KeyTakeaway accent="cyan">
                    The full Transformer: embed tokens, add positions, pass through N
                    identical blocks (each with attention + FFN + residuals + normalization),
                    then project to vocabulary scores with a linear head, and convert to
                    probabilities with softmax. The same architecture, repeated and stacked,
                    powers every modern language model.
                </KeyTakeaway>
            </Section>

            <SectionBreak />
            <MonsterInterlude>
                I am assembled. Every piece in place. Attention to hear. FFN to think.
                Residuals to remember. Normalization to stay calm. But I&apos;ve never read
                a single word. I&apos;m a perfect machine that knows nothing. Time to change that.
            </MonsterInterlude>

            {/* ═══════════════════════════════════════════════════
               §08 — TEACHING IT TO WRITE
               ═══════════════════════════════════════════════════ */}
            <Section id="transformer-08">
                <SectionLabel number="08" label="Teaching It to Write" />
                <SectionAnchor id="transformer-08"><Heading>Teaching It to Write</Heading></SectionAnchor>

                {/* ══════════════════════════════════════════════
                   BEAT 1 — THE EMPTY MONSTER
                   ══════════════════════════════════════════════ */}

                <Lead>
                    You built something extraordinary. A machine that can listen to every
                    character at once, think about what it heard, preserve its memory, and
                    stay stable through it all. But right now, this machine has never seen
                    a single piece of text. It knows{" "}
                    <Highlight color="amber">nothing</Highlight>.
                </Lead>

                <P>
                    What does an untrained Transformer produce? The weights are
                    randomly initialized &mdash; every number drawn from a normal
                    distribution, completely unaware of language, grammar, or meaning.
                    Let&apos;s find out what that looks like.
                </P>

                {/* ═══ UntrainedOutputViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <UntrainedOutputViz />
                    </Suspense>
                </FadeInView>

                <P>
                    Pure noise. The architecture is flawless &mdash; but the weights are
                    random. A beautiful machine with nothing to say.{" "}
                    <Highlight>Let&apos;s fix that.</Highlight>
                </P>

                {/* ══════════════════════════════════════════════
                   BEAT 2 — THE TRAINING TASK
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    The training task is deceptively simple: given a sequence of
                    characters, predict the next one at every position.
                    That&apos;s it. No labels, no categories &mdash; just{" "}
                    <Highlight>what comes next?</Highlight>
                </P>

                <P>
                    But here&apos;s the trick that makes Transformers train so fast.
                    Remember the MLP? Feed it 8 characters, get{" "}
                    <Highlight color="amber">one prediction</Highlight> back.
                    Move the window forward one character, feed it again, get another
                    prediction. One at a time.
                </P>

                <P>
                    The Transformer processes the{" "}
                    <em>entire sequence at once</em>. Every position simultaneously
                    predicts what comes next. Feed it 256 characters and you get{" "}
                    <Highlight>256 predictions in a single forward pass</Highlight>.
                    Each one becomes a training signal. Each one nudges the weights
                    a little closer to understanding language.
                </P>

                {/* ═══ ParallelPredictionViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <ParallelPredictionViz />
                    </Suspense>
                </FadeInView>

                <Callout icon={Sparkles} title="The training superpower">
                    One forward pass, 256 predictions. This is why Transformers
                    learn faster than anything before them &mdash; every position in
                    the sequence teaches the model something at every step.
                </Callout>

                {/* ══════════════════════════════════════════════
                   BEAT 3 — THE MASK
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    But there&apos;s a catch. If position 5 is trying to predict
                    character 6, it <em>must not see</em> character 6. That would
                    be cheating &mdash; like reading the answer key during an exam.
                    You get 100% accuracy but learn{" "}
                    <Highlight color="amber">nothing</Highlight>.
                </P>

                <P>
                    The solution is a <Highlight>mask</Highlight>: each position
                    can only attend to itself and everything <em>before</em> it.
                    The future is invisible. The model is forced to actually predict.
                </P>

                {/* ═══ CausalMaskViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <CausalMaskViz />
                    </Suspense>
                </FadeInView>

                <P>
                    The triangle of visibility grows row by row &mdash; token 1
                    sees only itself, token 8 sees all eight. At every position,
                    the model practices predicting the future from the past.
                </P>

                {/* ── Technical detail panel (expanded) ── */}
                <FadeInView className="my-6">
                    <details className="group max-w-2xl mx-auto rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
                        <summary className="flex items-center justify-between px-5 py-3 cursor-pointer text-[14px] font-semibold text-cyan-400/60 hover:text-cyan-400/80 transition-colors select-none list-none [&::-webkit-details-marker]:hidden">
                            <span>The full math: from embeddings to attention to training</span>
                            <span className="text-[12px] text-white/20 group-open:rotate-180 transition-transform">{"\u25BC"}</span>
                        </summary>
                        <div className="border-t border-white/5 px-5 py-6 space-y-8">

                            {/* ──── SECTION 1: Embedding → Q, K, V ──── */}
                            <div className="space-y-3">
                                <h4 className="text-[14px] font-bold text-cyan-400/70">
                                    1. From Embedding to Query, Key, Value
                                </h4>
                                <p className="text-[13px] text-white/40 leading-relaxed">
                                    Every token enters the Transformer as an <strong className="text-white/60">embedding vector</strong>{" "}
                                    <span className="font-mono text-cyan-400/50">x ∈ ℝ<sup>d</sup></span> &mdash; a list of <em>d</em> numbers
                                    that encode the token&apos;s meaning plus its position. For our model, <em>d</em> = 128.
                                </p>
                                <p className="text-[13px] text-white/40 leading-relaxed">
                                    To compute attention, each embedding is projected into three separate vectors through{" "}
                                    <strong className="text-white/60">learned weight matrices</strong>:
                                </p>
                                <div className="rounded-lg px-4 py-3 space-y-1.5 font-mono text-[13px]" style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.1)" }}>
                                    <p><span className="text-cyan-400/70">Q</span> <span className="text-white/20">=</span> <span className="text-white/40">x</span> <span className="text-white/20">·</span> <span className="text-cyan-400/60">W<sub>Q</sub></span> <span className="text-white/15 text-[11px] ml-2">// Query: &quot;what am I looking for?&quot;</span></p>
                                    <p><span className="text-amber-400/70">K</span> <span className="text-white/20">=</span> <span className="text-white/40">x</span> <span className="text-white/20">·</span> <span className="text-amber-400/60">W<sub>K</sub></span> <span className="text-white/15 text-[11px] ml-2">// Key: &quot;what do I contain?&quot;</span></p>
                                    <p><span className="text-emerald-400/70">V</span> <span className="text-white/20">=</span> <span className="text-white/40">x</span> <span className="text-white/20">·</span> <span className="text-emerald-400/60">W<sub>V</sub></span> <span className="text-white/15 text-[11px] ml-2">// Value: &quot;what info do I carry?&quot;</span></p>
                                </div>
                                <p className="text-[13px] text-white/40 leading-relaxed">
                                    Each <span className="font-mono text-white/50">W</span> is a{" "}
                                    <span className="font-mono text-cyan-400/50">d × d<sub>k</sub></span> matrix.
                                    These matrices are the <strong className="text-white/60">learned parameters</strong> of attention &mdash;
                                    they&apos;re initialized randomly and updated by gradient descent during training.
                                    The same embedding <span className="font-mono text-white/50">x</span>, multiplied by three different
                                    matrices, produces three vectors with entirely different roles.
                                </p>

                                {/* VIZ 1: QKV Projection */}
                                <Suspense fallback={<div className="h-32" />}>
                                    <QKVProjectionViz />
                                </Suspense>

                                <p className="text-[12px] text-white/25 leading-relaxed">
                                    In multi-head attention with <em>h</em> heads, each head uses its own smaller
                                    projection matrices of size <span className="font-mono text-white/30">d × d<sub>k</sub></span> where{" "}
                                    <span className="font-mono text-white/30">d<sub>k</sub> = d / h</span>. With <em>d</em> = 128 and <em>h</em> = 4,
                                    each head projects to 32-dimensional Q, K, V vectors. The heads run in parallel,
                                    then their outputs are concatenated and projected back to <em>d</em> dimensions.
                                </p>
                            </div>

                            {/* ──── SECTION 2: Attention Score Computation ──── */}
                            <div className="space-y-3 pt-2 border-t border-white/5">
                                <h4 className="text-[14px] font-bold text-cyan-400/70">
                                    2. Computing Attention Scores
                                </h4>
                                <p className="text-[13px] text-white/40 leading-relaxed">
                                    Attention scores tell us how much each token should &quot;listen to&quot; every
                                    other token. The full computation in one equation:
                                </p>
                                <div className="rounded-lg px-4 py-3 font-mono text-[13px] text-center" style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.1)" }}>
                                    <span className="text-cyan-400/80">Attention(Q, K, V)</span>
                                    <span className="text-white/20"> = </span>
                                    <span className="text-white/50">softmax(</span>
                                    <span className="text-cyan-400/60">Q</span>
                                    <span className="text-amber-400/60">K<sup>T</sup></span>
                                    <span className="text-white/30"> / </span>
                                    <span className="text-white/40">√d<sub>k</sub></span>
                                    <span className="text-white/50">)</span>
                                    <span className="text-white/20"> · </span>
                                    <span className="text-emerald-400/60">V</span>
                                </div>
                                <p className="text-[13px] text-white/40 leading-relaxed">
                                    Let&apos;s break this down step by step:
                                </p>
                                <ol className="text-[13px] text-white/40 leading-relaxed space-y-2 list-decimal list-inside">
                                    <li>
                                        <strong className="text-white/55">Q × K<sup>T</sup></strong> &mdash;
                                        Multiply each Query by every Key (transposed). This produces an{" "}
                                        <span className="font-mono text-white/30">n × n</span> matrix of raw scores,
                                        where <em>n</em> is the sequence length. Score<sub>ij</sub> measures how relevant
                                        token <em>j</em> is to token <em>i</em>.
                                    </li>
                                    <li>
                                        <strong className="text-white/55">÷ √d<sub>k</sub></strong> &mdash;
                                        Without scaling, the dot products grow proportionally to the dimension <em>d<sub>k</sub></em>.
                                        Large values push softmax into extreme regions where gradients vanish.
                                        Dividing by <span className="font-mono text-white/30">√d<sub>k</sub></span> keeps
                                        the scores in a healthy range.
                                    </li>
                                    <li>
                                        <strong className="text-amber-400/60">Mask</strong> &mdash;
                                        For each position <em>i</em>, set scores for all positions{" "}
                                        <em>j &gt; i</em> to <strong className="text-amber-400/70">&minus;∞</strong>.
                                        This ensures no token can see the future.
                                    </li>
                                    <li>
                                        <strong className="text-white/55">Softmax</strong> &mdash;
                                        Applied row-wise. Converts each row of scores into a probability distribution:
                                        all values between 0 and 1, summing to 1.{" "}
                                        <span className="font-mono text-amber-400/40">e<sup>&minus;∞</sup> = 0</span>, so
                                        masked positions contribute exactly nothing.
                                    </li>
                                    <li>
                                        <strong className="text-emerald-400/60">× V</strong> &mdash;
                                        Multiply the attention weights by the Value vectors. This produces a weighted sum:
                                        each token&apos;s output is a blend of the Value vectors it attended to,
                                        weighted by how much attention it paid.
                                    </li>
                                </ol>

                                {/* VIZ 2: Attention Score Matrix */}
                                <Suspense fallback={<div className="h-32" />}>
                                    <AttentionScoreViz />
                                </Suspense>
                            </div>

                            {/* ──── SECTION 3: The Causal Mask ──── */}
                            <div className="space-y-3 pt-2 border-t border-white/5">
                                <h4 className="text-[14px] font-bold text-amber-400/70">
                                    3. The Causal Mask — Why &minus;∞?
                                </h4>
                                <p className="text-[13px] text-white/40 leading-relaxed">
                                    The mask is a <strong className="text-white/55">lower-triangular matrix</strong> of ones
                                    and zeros. Before softmax, we add the mask (with zeros replaced by &minus;∞)
                                    to the score matrix:
                                </p>
                                <div className="rounded-lg px-4 py-3 font-mono text-[12px]" style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.1)" }}>
                                    <p className="text-white/30">
                                        <span className="text-amber-400/50">scores_masked</span> = <span className="text-white/40">scores</span> + <span className="text-amber-400/60">mask</span>
                                    </p>
                                    <p className="text-white/20 mt-1 text-[11px]">
                                        where mask[i][j] = 0 if j ≤ i, &minus;∞ if j &gt; i
                                    </p>
                                </div>
                                <p className="text-[13px] text-white/40 leading-relaxed">
                                    Softmax computes <span className="font-mono text-white/30">e<sup>x</sup> / Σe<sup>x</sup></span>.
                                    When x = &minus;∞, e<sup>&minus;∞</sup> = 0 — that position gets{" "}
                                    <strong className="text-cyan-400/70">exactly zero weight</strong>.
                                    Not approximately zero. <em>Mathematically</em> zero. The information at future
                                    positions is completely invisible.
                                </p>
                                <p className="text-[12px] text-white/25 leading-relaxed">
                                    This is called the <em className="text-white/35">causal mask</em> (or autoregressive mask).
                                    The name comes from causality: effects (predictions) can only depend on causes
                                    (past tokens), never the future. GPT, Claude, Gemini, and LLaMA all use this exact mask.
                                    Encoder-only models like BERT use a <em>bidirectional</em> variant without it &mdash;
                                    they see the full context but can&apos;t generate text autoregressively.
                                </p>
                            </div>

                            {/* ──── SECTION 4: Parallel Training ──── */}
                            <div className="space-y-3 pt-2 border-t border-white/5">
                                <h4 className="text-[14px] font-bold text-cyan-400/70">
                                    4. Training: All Positions at Once
                                </h4>
                                <p className="text-[13px] text-white/40 leading-relaxed">
                                    Here&apos;s where the mask gives us a superpower. Because each position can only see
                                    the past, we can train on <strong className="text-white/55">every position simultaneously</strong>.
                                    Given a sequence of <em>T</em> tokens, the model makes <em>T</em> predictions in a single forward pass:
                                </p>
                                <div className="rounded-lg px-4 py-3 font-mono text-[12px] space-y-1" style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.1)" }}>
                                    <p className="text-white/25">Position 1: sees [x₁] → predicts x₂</p>
                                    <p className="text-white/25">Position 2: sees [x₁, x₂] → predicts x₃</p>
                                    <p className="text-white/25">Position 3: sees [x₁, x₂, x₃] → predicts x₄</p>
                                    <p className="text-white/20">...</p>
                                    <p className="text-white/25">Position T: sees [x₁, ..., x<sub>T</sub>] → predicts x<sub>T+1</sub></p>
                                </div>
                                <p className="text-[13px] text-white/40 leading-relaxed">
                                    Each prediction is compared to the <strong className="text-white/55">actual next token</strong> using{" "}
                                    <strong className="text-cyan-400/60">cross-entropy loss</strong>:
                                </p>
                                <div className="rounded-lg px-4 py-3 font-mono text-[13px] text-center" style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.1)" }}>
                                    <span className="text-cyan-400/70">ℒ</span>
                                    <span className="text-white/20"> = </span>
                                    <span className="text-white/30">&minus;(1/T)</span>
                                    <span className="text-white/40"> Σ<sub>t=1..T</sub></span>
                                    <span className="text-white/30"> log </span>
                                    <span className="text-white/40">p(x<sub>t+1</sub> | x<sub>1</sub>, ..., x<sub>t</sub>)</span>
                                </div>
                                <p className="text-[13px] text-white/40 leading-relaxed">
                                    In words: at each position, the model outputs a probability distribution over
                                    the entire vocabulary. Cross-entropy measures how much probability the model
                                    assigned to the <em>correct</em> next token. The loss is the <strong className="text-white/55">negative
                                        log of that probability</strong>, averaged over all positions.
                                </p>
                                <p className="text-[13px] text-white/40 leading-relaxed">
                                    If the model assigns probability 1.0 to the correct token, log(1.0) = 0 → loss = 0
                                    (perfect). If it assigns 0.01, log(0.01) ≈ &minus;4.6 → loss = 4.6 (terrible).
                                    The model learns by minimizing this loss through gradient descent &mdash;
                                    adjusting every weight matrix (W<sub>Q</sub>, W<sub>K</sub>, W<sub>V</sub>,
                                    W<sub>O</sub>, W<sub>1</sub>, W<sub>2</sub>, embeddings, the linear head)
                                    to push the probability of the correct next token higher.
                                </p>
                                <p className="text-[12px] text-white/25 leading-relaxed">
                                    A sequence of 256 characters = 256 predictions = 256 loss terms = 256 training
                                    signals from a single forward pass. Compare that to the MLP: it sees 8 characters,
                                    makes 1 prediction, then slides the window. The Transformer is{" "}
                                    <strong className="text-white/35">256× more efficient per example</strong>.
                                </p>
                            </div>

                            {/* ──── SECTION 5: Parameter Count ──── */}
                            <div className="space-y-3 pt-2 border-t border-white/5">
                                <h4 className="text-[14px] font-bold text-white/50">
                                    5. Where Are All the Parameters?
                                </h4>
                                <p className="text-[13px] text-white/40 leading-relaxed">
                                    For a single attention head with <em>d</em> = 128 and <em>d<sub>k</sub></em> = 32:
                                </p>
                                <div className="rounded-lg px-4 py-3 font-mono text-[12px] space-y-1" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                    <p className="text-white/30">W<sub>Q</sub>: <span className="text-white/40">128 × 32</span> = <span className="text-cyan-400/50">4,096</span> params</p>
                                    <p className="text-white/30">W<sub>K</sub>: <span className="text-white/40">128 × 32</span> = <span className="text-cyan-400/50">4,096</span> params</p>
                                    <p className="text-white/30">W<sub>V</sub>: <span className="text-white/40">128 × 32</span> = <span className="text-cyan-400/50">4,096</span> params</p>
                                    <p className="text-white/20 mt-1">× 4 heads = <span className="text-cyan-400/50">49,152</span></p>
                                    <p className="text-white/30">W<sub>O</sub>: <span className="text-white/40">128 × 128</span> = <span className="text-cyan-400/50">16,384</span> params</p>
                                    <p className="text-white/30">FFN W<sub>1</sub>: <span className="text-white/40">128 × 512</span> = <span className="text-amber-400/50">65,536</span> params</p>
                                    <p className="text-white/30">FFN W<sub>2</sub>: <span className="text-white/40">512 × 128</span> = <span className="text-amber-400/50">65,536</span> params</p>
                                    <p className="text-white/20 mt-1 border-t border-white/5 pt-1">Total per block ≈ <span className="text-white/45 font-bold">196,608</span> parameters</p>
                                    <p className="text-white/20">× 4 blocks = <span className="text-white/45 font-bold">~786K</span> trainable params</p>
                                </div>
                                <p className="text-[12px] text-white/25 leading-relaxed">
                                    Add the embedding matrix (vocabulary × <em>d</em>), positional embeddings
                                    (block_size × <em>d</em>), LayerNorm parameters (4 × 2 × <em>d</em>), and the
                                    final linear head (vocabulary × <em>d</em>), and our 4-block model totals about{" "}
                                    <strong className="text-white/35">~1 million parameters</strong>. Every single one
                                    is updated at every training step.
                                </p>
                            </div>

                        </div>
                    </details>
                </FadeInView>

                {/* ══════════════════════════════════════════════
                   BEAT 4 — TRAINING A REAL MODEL
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    Theory is done. Let&apos;s do it for real.
                </P>

                <P>
                    Our model is about to learn from two very different geniuses:{" "}
                    <Highlight>Shakespeare</Highlight> and{" "}
                    <Highlight color="amber">Paul Graham</Highlight>. A 16th-century
                    playwright and a 21st-century startup essayist &mdash; 1.7 million
                    characters of English text, from &quot;To be or not to be&quot; to
                    &quot;Do things that don&apos;t scale.&quot; The result should be...
                    interesting.
                </P>

                <P>
                    But first &mdash; what is a <Highlight>training step</Highlight>?
                    In each step, the model reads a batch of text sequences. It
                    processes them in a single forward pass (all positions at once,
                    thanks to the mask), computes the <Highlight color="amber">loss</Highlight>{" "}
                    (how wrong its predictions were), and then adjusts every weight
                    slightly in the direction that reduces that loss. One step =
                    one batch = one weight update. After 50,000 of these steps, the
                    model will have seen millions of characters, each time getting a
                    little better at predicting what comes next.
                </P>

                {/* ═══ TrainingTimelapseViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <TrainingTimelapseViz />
                    </Suspense>
                </FadeInView>

                <P>
                    You just watched a machine learn to write. Not because someone
                    programmed English grammar into it. Not because someone told it
                    what words mean. It learned from one simple question, asked fifty
                    thousand times:{" "}
                    <Highlight color="amber"><em>what comes next?</em></Highlight>
                </P>

                {/* ══════════════════════════════════════════════
                   BEAT 5 — THE GENERATION PLAYGROUND
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    Your model is trained. Now it&apos;s yours to control.
                    Type any starting text and watch it generate, one character at a time.
                </P>

                {/* ═══ CharGenerationPlayground ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <CharGenerationPlayground />
                    </Suspense>
                </FadeInView>

                <P>
                    Notice what happens with different temperatures. At{" "}
                    <Highlight>low temperature</Highlight>, the model becomes
                    deterministic &mdash; it always picks the most likely character.
                    Coherent, but repetitive. At{" "}
                    <Highlight color="amber">high temperature</Highlight>, the
                    probability distribution flattens. Rare characters get a chance.
                    Creative, but chaotic. The sweet spot &mdash; around 0.8 &mdash;
                    produces text that feels natural and varied.
                </P>

                {/* ══════════════════════════════════════════════
                   BEAT 6 — THE BATTLE
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    Let&apos;s put our Transformer to the test. Three models generate
                    from the same prompt. Same starting text, same number of characters.
                    Watch what each one does with it.
                </P>

                {/* ═══ ModelBattleArena ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <ModelBattleArena />
                    </Suspense>
                </FadeInView>

                <P>
                    The n-gram gets stuck. It knows what pairs of characters are common,
                    but it has no sense of a sentence. The MLP does better &mdash;
                    it learned <em>representations</em>, not just frequencies. But it
                    can only see a small fixed window. The Transformer sees{" "}
                    <Highlight>everything</Highlight>, and it shows.
                </P>

                {/* ══════════════════════════════════════════════
                   BEAT 7 — THE WIDTH CEILING
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    Our four-block Transformer is impressive. But can we make it{" "}
                    <em>better</em>? The obvious move: more neurons. A bigger
                    feedforward layer. More dimensions. If a 128-dimensional model
                    works this well, surely a 512-dimensional model will be
                    dramatically better?
                </P>

                {/* ═══ NeuronScalingViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <NeuronScalingViz />
                    </Suspense>
                </FadeInView>

                <P>
                    The loss barely budges past 256 dimensions. We made the model
                    sixteen times bigger &mdash; and it actually got{" "}
                    <Highlight color="amber">worse</Highlight>. Not just diminishing
                    returns &mdash; negative returns. The 512-dimensional model started
                    memorizing the training data instead of learning patterns.
                    Its training loss was great; its validation loss climbed back up.
                    The ceiling is real.
                </P>

                <P>
                    But what if, instead of making the block{" "}
                    <em>wider</em>&hellip; we made the model{" "}
                    <Highlight color="amber">deeper</Highlight>?
                </P>

                <MonsterStatus>
                    👾 I can write! But I feel shallow. One round of listening.
                    One round of thinking. More neurons didn&apos;t help &mdash;
                    they made things worse. I want to go <em>deeper</em>.
                </MonsterStatus>
            </Section>

            <SectionBreak />
            <MonsterInterlude>
                More neurons didn&apos;t help. I&apos;m stuck at the ceiling.
                But what if I could listen again? Think again?
                Layer upon layer &mdash; what if going deeper changes everything?
            </MonsterInterlude>

            {/* ═══════════════════════════════════════════════════
               §09 — SCALING IT UP
               ═══════════════════════════════════════════════════ */}
            <Section id="transformer-09">
                <SectionLabel number="09" label="Scaling It Up" />
                <SectionAnchor id="transformer-09"><Heading>Scaling It Up</Heading></SectionAnchor>

                {/* ══════════════════════════════════════════════
                   BEAT 1 — DEPTH BREAKTHROUGH
                   ══════════════════════════════════════════════ */}

                <Lead>
                    You already know the idea from &sect;07: stack identical blocks.
                    But does it <Highlight>actually work</Highlight>? Let&apos;s train
                    deeper models on the same data and find out.
                </Lead>

                <P>
                    The width ceiling sat at a validation loss of around 1.40 &mdash;
                    the best a single block could do no matter how many neurons we added.
                    What happens when we add a second block?
                </P>

                {/* ═══ DepthBreakthroughViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <DepthBreakthroughViz />
                    </Suspense>
                </FadeInView>

                <P>
                    The ceiling shattered. Two blocks already beat the best single-block
                    model. Four blocks produced text that&apos;s recognizably{" "}
                    <em>prose</em>. The validation loss dropped from 1.40 all the way
                    to 1.30 &mdash; not by adding neurons, but by giving the model
                    a second chance to look, and a third, and a fourth.
                </P>

                <Callout icon={Layers} accent="amber" title="Why depth works">
                    Each additional block receives representations that are already
                    context-aware &mdash; enriched by every previous block&apos;s
                    attention and processing. The second block doesn&apos;t re-read
                    the original text; it reads a{" "}
                    <em>refined version</em> of it. Each layer asks deeper questions
                    about richer answers.
                </Callout>

                {/* ══════════════════════════════════════════════
                   BEAT 2 — X-RAY VISION
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    What is each block actually doing? Let&apos;s look inside.
                    Every block produces its own attention patterns &mdash; a heatmap
                    showing which characters each position attended to most.
                </P>

                {/* ═══ LayerLensViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <LayerLensViz />
                    </Suspense>
                </FadeInView>

                <P>
                    Research on real Transformer models reveals a consistent pattern.
                    Early blocks tend to capture{" "}
                    <Highlight color="amber">local structure</Highlight> &mdash;
                    adjacent characters, spacing, punctuation. Middle blocks develop
                    a sense of{" "}
                    <Highlight color="amber">word-level relationships</Highlight>.
                    Deep blocks capture{" "}
                    <Highlight>abstract patterns</Highlight> that
                    span the full sequence. Same architecture &mdash; different
                    specialization emerging purely from training.
                </P>

                {/* ══════════════════════════════════════════════
                   BEAT 3 — THE DEPTH COMPARISON
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    See the difference depth makes directly. Same prompt, same
                    temperature &mdash; only the number of blocks changes.
                </P>

                {/* ═══ DepthGenerationViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <DepthGenerationViz />
                    </Suspense>
                </FadeInView>

                <P>
                    One block produces recognizable words but choppy, incoherent
                    phrases. Four blocks produce{" "}
                    <Highlight>flowing English prose</Highlight>.
                    But something strange happens at twelve blocks &mdash; the
                    text becomes oddly specific. Proper names appear. Exact phrases
                    from the training data resurface. That&apos;s a warning sign.
                </P>

                {/* ══════════════════════════════════════════════
                   BEAT 4 — THE OVERFITTING TRAP
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    Wait. The 12-block model had{" "}
                    <em>more</em> blocks than the 4-block winner.
                    Shouldn&apos;t more depth always be better? Let&apos;s look
                    at the training curves.
                </P>

                {/* ═══ OverfittingDualCurveViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <OverfittingDualCurveViz />
                    </Suspense>
                </FadeInView>

                <P>
                    The 12-block model achieved a training loss of 0.78 &mdash; far
                    lower than the 4-block model&apos;s 1.15. By that measure it
                    looks like a massive improvement. But its validation loss was{" "}
                    <Highlight color="amber">1.48 &mdash; worse than the 4-block model</Highlight>.
                    It didn&apos;t learn language. It memorized the book.
                </P>

                {/* ═══ MemorizationRevealViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <MemorizationRevealViz />
                    </Suspense>
                </FadeInView>

                <P>
                    This is{" "}
                    <Highlight color="amber">overfitting</Highlight>. More model
                    capacity than the data can fill. The 12-block model has roughly
                    2.4 million parameters &mdash; and it trained on only 1.7 million
                    characters. It had enough capacity to memorize every sentence.
                    And it did.
                </P>

                <Callout icon={AlertTriangle} accent="amber" title="The scale equation">
                    <p>
                        More blocks + same data ={" "}
                        <strong className="text-amber-400">memorization</strong>.
                        More blocks + <strong className="text-cyan-400">more data</strong> ={" "}
                        <strong className="text-cyan-400">deeper understanding</strong>.
                        GPT-3 uses 96 blocks, but it trains on hundreds of billions
                        of words. Our model has 1.7 million characters. That&apos;s
                        the difference &mdash; not the architecture.
                    </p>
                </Callout>

                {/* ══════════════════════════════════════════════
                   BEAT 5 — THE CONTEXT WINDOW
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    There&apos;s one more dimension to explore. We&apos;ve varied
                    width and depth &mdash; but how far back should the model{" "}
                    <em>look</em>? The context window defines the maximum number
                    of characters the model can attend to at any position.
                </P>

                {/* ═══ ContextWindowViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <ContextWindowViz />
                    </Suspense>
                </FadeInView>

                <P>
                    With 32 characters of context, the model can barely see past
                    one word. Predictions are almost completely local. With 256,
                    it sees full sentences &mdash; and the quality improves
                    dramatically. Beyond 256? This text doesn&apos;t have
                    dependencies that reach further than a sentence or two.
                    The extra context window goes unused.
                </P>

                <P>
                    For real models processing books, code, or long conversations,
                    context windows of 4,000 to 128,000 tokens become necessary.
                    The architecture is identical. Only the window grows.
                </P>
            </Section>

            {/* ── Bridge to §10 ── */}
            <SectionBreak />
            <MonsterInterlude>
                Five architectures. Five chapters. Ten sections. And I can
                finally write English prose. Do you realize what you just built?
            </MonsterInterlude>

            {/* ═══════════════════════════════════════════════════
               §10 — YOU ALREADY KNOW
               ═══════════════════════════════════════════════════ */}
            <Section id="transformer-10">
                <SectionLabel number="10" label="You Already Know" />
                <SectionAnchor id="transformer-10">
                    <Heading className="bg-gradient-to-r from-cyan-300 via-white to-cyan-400 bg-clip-text text-transparent">
                        You Already Know
                    </Heading>
                </SectionAnchor>

                {/* ══════════════════════════════════════════════
                   BEAT 1 — CELEBRATION: LOOK AT WHAT YOU BUILT
                   ══════════════════════════════════════════════ */}

                <Lead>
                    Look at what you&apos;ve built.
                </Lead>

                <P>
                    You started with nothing. A blank table of character
                    frequencies. The model couldn&apos;t do anything except
                    pick random letters with slightly better odds. And from
                    there, piece by piece, section by section, you constructed
                    a system that writes coherent English prose.
                </P>

                <P>
                    Five architectures, each building on the insights of the last.
                    Each solving a problem the previous one couldn&apos;t.
                </P>

                {/* ═══ EvolutionTimelineViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <EvolutionTimelineViz />
                    </Suspense>
                </FadeInView>

                <P>
                    Bigram gave us structure from chaos. N-gram added memory.
                    The MLP learned to compress patterns into representations.
                    The Transformer let every position see every other &mdash;
                    and when we stacked those layers deep, something remarkable
                    happened: the model stopped producing gibberish and started
                    producing language.
                </P>

                <P>
                    Nine sections. Five models. One journey. And every step of it
                    was real &mdash; not a metaphor, not a simplification. You wrote
                    the code. You saw the loss curves drop. You watched the output
                    improve, character by character, from nonsense to sentences.
                </P>

                {/* ══════════════════════════════════════════════
                   BEAT 2 — DO YOU REMEMBER?
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    But how much actually stuck? You&apos;ve seen a lot of
                    components &mdash; embeddings, attention heads, residual
                    connections, masks. Let&apos;s find out how much you remember.
                </P>

                <P>
                    Six components. Six questions. No pressure &mdash; this
                    is for you, not for a grade.
                </P>

                {/* ═══ ConceptRecallViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <ConceptRecallViz />
                    </Suspense>
                </FadeInView>

                <P>
                    Those aren&apos;t abstract concepts. Each one is a specific
                    operation &mdash; a matrix multiply, a normalization step, a
                    masking trick &mdash; that you built with your own hands. And
                    together, they form something extraordinary.
                </P>

                {/* ══════════════════════════════════════════════
                   BEAT 3 — THIS IS CHATGPT
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    Here&apos;s the thing nobody tells you:{" "}
                    <Highlight>you already know how ChatGPT works</Highlight>.
                </P>

                <P>
                    Not as a metaphor. Not as a vague intuition. The{" "}
                    <Highlight>actual architecture</Highlight> &mdash; the same one
                    running inside ChatGPT, Claude, Gemini, and every modern language
                    model on Earth. Token embeddings, positional encoding, multi-head
                    self-attention, layer normalization, feed-forward networks,
                    residual connections, causal masking, softmax, cross-entropy
                    training.
                </P>

                <P>
                    You didn&apos;t just read about these. You built them.
                </P>

                {/* ═══ ArchitectureIdentityViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <ArchitectureIdentityViz />
                    </Suspense>
                </FadeInView>

                <P>
                    GPT-4 has 96 layers instead of 4. Dimensions of 12,288 instead
                    of 128. A vocabulary of 100,000 tokens instead of 96 characters.
                    It trained on trillions of words across thousands of GPUs for
                    months. But every single block, every attention head, every
                    residual highway works{" "}
                    <em>exactly</em> the way you learned.{" "}
                    <Highlight color="amber">The only difference is scale.</Highlight>
                </P>

                <P>
                    Your model and GPT-4 are the same architecture. The same
                    forward pass. The same training loop. If you understand one,
                    you understand the other. And you do.
                </P>

                <Callout icon={Sparkles} title="You already know">
                    If someone asks you &ldquo;how does ChatGPT work?&rdquo;
                    &mdash; you can answer. Not with hand-waving. With the real
                    answer. Embeddings, Q/K/V attention, multi-head, position,
                    FFN, residuals, LayerNorm, causal mask, cross-entropy.
                    That&apos;s it. That&apos;s the whole engine. Everything
                    else is scale.
                </Callout>

                {/* ══════════════════════════════════════════════
                   BEAT 4 — THE FASCINATING GAP
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    But here&apos;s where it gets fascinating.
                </P>

                <P>
                    The engine you built &mdash; and GPT before fine-tuning &mdash;
                    does exactly one thing:{" "}
                    <Highlight color="amber">predict the next token</Highlight>.
                    Given some text, it outputs the most likely continuation.
                    Ask it a question, and it doesn&apos;t answer &mdash; it
                    just continues the text as if it were writing a document
                    that happens to contain a question.
                </P>

                {/* ═══ CompletionVsAssistantViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <CompletionVsAssistantViz />
                    </Suspense>
                </FadeInView>

                <P>
                    The completion engine doesn&apos;t answer &mdash; it{" "}
                    <em>continues</em>. It might generate another question,
                    or start a paragraph, or produce something that looks
                    like a textbook passage. But it doesn&apos;t{" "}
                    <em>help</em>.
                </P>

                <P>
                    Yet ChatGPT answers perfectly. Same architecture. Same
                    attention. Same weights flowing through the same residual
                    highways. The gap between &ldquo;text completer&rdquo; and
                    &ldquo;helpful assistant&rdquo; is one of the most elegant
                    stories in all of AI. How do you teach a prediction engine
                    to be helpful? That&apos;s the next chapter.
                </P>

                {/* ══════════════════════════════════════════════
                   BEAT 5 — CHARACTERS VS TOKENS
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    There&apos;s one more thing you should notice. We built
                    everything at the character level &mdash; every letter, every
                    space, every punctuation mark is its own token. That was
                    deliberate. It let you see the architecture at its most
                    fundamental resolution, with nothing hidden.
                </P>

                <P>
                    But look at what that costs. The word
                    &ldquo;understanding&rdquo; is 13 characters &mdash; 13
                    positions in the sequence, 13 rows in every attention matrix.
                    A single paragraph becomes hundreds of tokens. And attention
                    grows <em>quadratically</em>.
                </P>

                {/* ═══ CharVsTokenViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <CharVsTokenViz />
                    </Suspense>
                </FadeInView>

                <P>
                    33 characters. Or 10 tokens. Same sentence. Same architecture.
                    Same attention, same FFN, same residuals.{" "}
                    <Highlight color="amber">Only the resolution changes.</Highlight>{" "}
                    How does a model learn to split &ldquo;strawberry&rdquo; into
                    &ldquo;straw&rdquo; + &ldquo;berry&rdquo;? How do you build a
                    vocabulary from scratch, without any human rules? That&apos;s
                    one of the first things you&apos;ll discover next.
                </P>

                {/* ══════════════════════════════════════════════
                   BEAT 6 — THREE EXCITING DOORS
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    The architecture is complete. But the story of how a text
                    completer becomes a helpful assistant has its own twists &mdash;
                    and they&apos;re just as fascinating as anything you&apos;ve
                    seen so far. Here are three doors waiting to be opened.
                </P>

                {/* ═══ ThreeMysteriesViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <ThreeMysteriesViz />
                    </Suspense>
                </FadeInView>

                <P>
                    Tokenization teaches the model a smarter alphabet.
                    Fine-tuning and RLHF teach it to follow instructions
                    instead of just completing text. Chain of Thought lets
                    it reason step by step &mdash; and when you give it tools,
                    it becomes an agent that can browse the web, write code,
                    and take actions in the real world. Every one of these
                    builds on the architecture you already know.
                </P>

                {/* ══════════════════════════════════════════════
                   BEAT 7 — YOUR ACHIEVEMENT
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <P>
                    You built a Transformer from scratch. Not a toy version.
                    Not a simplified metaphor. The actual architecture that
                    powers every AI conversation on Earth. You understand it
                    at the level of matrix multiplies and gradient updates.
                    That&apos;s not something most people can say &mdash;
                    including most people who use these models every day.
                </P>

                {/* ═══ ShareJourneyViz ═══ */}
                <FadeInView className="my-10 md:my-14">
                    <Suspense fallback={<SectionSkeleton />}>
                        <ShareJourneyViz />
                    </Suspense>
                </FadeInView>

                {/* ══════════════════════════════════════════════
                   BEAT 8 — CELEBRATION CLOSE
                   ══════════════════════════════════════════════ */}

                <NarrativeDivider />

                <MonsterStatus gradient="cyan-amber">
                    👾 You taught me to see connections. To attend. To remember
                    positions. To think in layers. I started counting character
                    pairs &mdash; and now I write prose. The architecture inside me
                    is the same one powering every AI you&apos;ve ever talked to.
                    You built it. You understand it. And the best part? There&apos;s
                    still more to discover.
                </MonsterStatus>

                <PullQuote>
                    Next: How do you turn a text machine into a helpful assistant?
                    Tokenization teaches it a smarter alphabet. Instruction tuning
                    teaches it to follow directions. RLHF teaches it to be helpful.
                    Chain of Thought teaches it to reason. And tools turn it into
                    an agent. The journey continues.
                </PullQuote>
            </Section>

        </article>
    );
}
