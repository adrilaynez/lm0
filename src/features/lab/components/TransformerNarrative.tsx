"use client";

import React, { lazy, Suspense, useMemo } from "react";

import { motion } from "framer-motion";
import { AlertTriangle, ArrowDown, BookOpen, Brain, Layers, Sparkles, Zap } from "lucide-react";

import { BlockMath } from "@/components/math/LazyMath";
import TransformerEn from "@/content/lab/transformer.en.mdx";
import TransformerEs from "@/content/lab/transformer.es.mdx";
import { ContinueToast } from "@/features/lab/components/ContinueToast";
import { FadeInView } from "@/features/lab/components/FadeInView";
import { KeyTakeaway as _KeyTakeaway } from "@/features/lab/components/KeyTakeaway";
import { SectionSkeleton } from "@/features/lab/components/LazySection";
import { labMdxComponents } from "@/features/lab/components/mdx/labMdxComponents";
import { ModeToggle } from "@/features/lab/components/ModeToggle";
import { SectionProgressBar } from "@/features/lab/components/SectionProgressBar";
import { useProgressTracker } from "@/features/lab/hooks/useProgressTracker";
import { useI18n } from "@/i18n/context";

import {
  Callout as _Callout,
  FormulaBlock as _FormulaBlock,
  Highlight as _Highlight,
  type HighlightColor,
  type NarrativeAccent,
  PullQuote as _PullQuote,
} from "./narrative-primitives";

/* ─── Lazy-loaded visualizers: §01 ─── */
const WordToEmbeddingViz = lazy(() =>
  import("@/features/lab/components/transformer/WordToEmbeddingViz").then((m) => ({
    default: m.WordToEmbeddingViz,
  })),
);
const PronounResolutionViz = lazy(() =>
  import("@/features/lab/components/transformer/PronounResolutionViz").then((m) => ({
    default: m.PronounResolutionViz,
  })),
);
const DrawConnectionsViz = lazy(() =>
  import("@/features/lab/components/transformer/DrawConnectionsViz").then((m) => ({
    default: m.DrawConnectionsViz,
  })),
);
const WishlistCallbackViz = lazy(() =>
  import("@/features/lab/components/transformer/WishlistCallbackViz").then((m) => ({
    default: m.WishlistCallbackViz,
  })),
);
const FrozenVsContextualViz = lazy(() =>
  import("@/features/lab/components/transformer/FrozenVsContextualViz").then((m) => ({
    default: m.FrozenVsContextualViz,
  })),
);
const ContextEnrichmentViz = lazy(() =>
  import("@/features/lab/components/transformer/ContextEnrichmentViz").then((m) => ({
    default: m.ContextEnrichmentViz,
  })),
);

/* ─── Lazy-loaded visualizers: §02 ─── */
const TelephoneGameViz = lazy(() =>
  import("@/features/lab/components/transformer/TelephoneGameViz").then((m) => ({
    default: m.TelephoneGameViz,
  })),
);
const LSTMBandageViz = lazy(() =>
  import("@/features/lab/components/transformer/LSTMBandageViz").then((m) => ({
    default: m.LSTMBandageViz,
  })),
);
const SequentialVsParallelViz = lazy(() =>
  import("@/features/lab/components/transformer/SequentialVsParallelViz").then((m) => ({
    default: m.SequentialVsParallelViz,
  })),
);
const RNNChainViz = lazy(() =>
  import("@/features/lab/components/transformer/RNNChainViz").then((m) => ({
    default: m.RNNChainViz,
  })),
);

/* ─── Lazy-loaded visualizers: §03 ─── */
const SpotlightViz = lazy(() =>
  import("@/features/lab/components/transformer/SpotlightViz").then((m) => ({
    default: m.SpotlightViz,
  })),
);
const GuessPatternViz = lazy(() =>
  import("@/features/lab/components/transformer/GuessPatternViz").then((m) => ({
    default: m.GuessPatternViz,
  })),
);
const StaticVsDynamicViz = lazy(() =>
  import("@/features/lab/components/transformer/StaticVsDynamicViz").then((m) => ({
    default: m.StaticVsDynamicViz,
  })),
);
const AttentionHeatmapViz = lazy(() =>
  import("@/features/lab/components/transformer/AttentionHeatmapViz").then((m) => ({
    default: m.AttentionHeatmapViz,
  })),
);
const AttentionWebViz = lazy(() =>
  import("@/features/lab/components/transformer/AttentionWebViz").then((m) => ({
    default: m.AttentionWebViz,
  })),
);

/* ─── Lazy-loaded visualizers: §04a ─── */
const EmbeddingToArrowViz = lazy(() =>
  import("@/features/lab/components/transformer/EmbeddingToArrowViz").then((m) => ({
    default: m.EmbeddingToArrowViz,
  })),
);
const DotProductCalculatorViz = lazy(() =>
  import("@/features/lab/components/transformer/DotProductCalculatorViz").then((m) => ({
    default: m.DotProductCalculatorViz,
  })),
);
const PairwiseScoringViz = lazy(() =>
  import("@/features/lab/components/transformer/PairwiseScoringViz").then((m) => ({
    default: m.PairwiseScoringViz,
  })),
);
const SelfSimilarityViz = lazy(() =>
  import("@/features/lab/components/transformer/SelfSimilarityViz").then((m) => ({
    default: m.SelfSimilarityViz,
  })),
);
const EmbeddingAttentionFailureViz = lazy(() =>
  import("@/features/lab/components/transformer/EmbeddingAttentionFailureViz").then((m) => ({
    default: m.EmbeddingAttentionFailureViz,
  })),
);

/* ─── Lazy-loaded visualizers: §04b-c ─── */
const QKSplitViz = lazy(() =>
  import("@/features/lab/components/transformer/QKSplitViz").then((m) => ({
    default: m.QKSplitViz,
  })),
);
const QKMatrixViz = lazy(() =>
  import("@/features/lab/components/transformer/QKMatrixViz").then((m) => ({
    default: m.QKMatrixViz,
  })),
);
const QuerySearchViz = lazy(() =>
  import("@/features/lab/components/transformer/QuerySearchViz").then((m) => ({
    default: m.QuerySearchViz,
  })),
);
const WhyQKMattersViz = lazy(() =>
  import("@/features/lab/components/transformer/WhyQKMattersViz").then((m) => ({
    default: m.WhyQKMattersViz,
  })),
);
const WeightsOfWhatViz = lazy(() =>
  import("@/features/lab/components/transformer/WeightsOfWhatViz").then((m) => ({
    default: m.WeightsOfWhatViz,
  })),
);
const ValueCompletesViz = lazy(() =>
  import("@/features/lab/components/transformer/ValueCompletesViz").then((m) => ({
    default: m.ValueCompletesViz,
  })),
);
const BeforeAfterAttentionViz = lazy(() =>
  import("@/features/lab/components/transformer/BeforeAfterAttentionViz").then((m) => ({
    default: m.BeforeAfterAttentionViz,
  })),
);

/* ─── Lazy-loaded visualizers: §04d ─── */
const NumbersExplodeViz = lazy(() =>
  import("@/features/lab/components/transformer/NumbersExplodeViz").then((m) => ({
    default: m.NumbersExplodeViz,
  })),
);
const ScalingFixViz = lazy(() =>
  import("@/features/lab/components/transformer/ScalingFixViz").then((m) => ({
    default: m.ScalingFixViz,
  })),
);
const FullScoringPipelineViz = lazy(() =>
  import("@/features/lab/components/transformer/FullScoringPipelineViz").then((m) => ({
    default: m.FullScoringPipelineViz,
  })),
);
const ContextAssemblyFilmViz = lazy(() =>
  import("@/features/lab/components/transformer/ContextAssemblyFilmViz").then((m) => ({
    default: m.ContextAssemblyFilmViz,
  })),
);
const FullContextualAssemblyViz = lazy(() =>
  import("@/features/lab/components/transformer/FullContextualAssemblyViz").then((m) => ({
    default: m.FullContextualAssemblyViz,
  })),
);

/* ─── Lazy-loaded visualizers: §05 ─── */
const WhichWordMattersViz = lazy(() =>
  import("@/features/lab/components/transformer/WhichWordMattersViz").then((m) => ({
    default: m.WhichWordMattersViz,
  })),
);
const OneHeadDilemmaViz = lazy(() =>
  import("@/features/lab/components/transformer/OneHeadDilemmaViz").then((m) => ({
    default: m.OneHeadDilemmaViz,
  })),
);
const MultiHeadIdeaViz = lazy(() =>
  import("@/features/lab/components/transformer/MultiHeadIdeaViz").then((m) => ({
    default: m.MultiHeadIdeaViz,
  })),
);
const MultiLensViewViz = lazy(() =>
  import("@/features/lab/components/transformer/MultiLensViewViz").then((m) => ({
    default: m.MultiLensViewViz,
  })),
);
const HeadBudgetViz = lazy(() =>
  import("@/features/lab/components/transformer/HeadBudgetViz").then((m) => ({
    default: m.HeadBudgetViz,
  })),
);
const MultiHeadPipelineViz = lazy(() =>
  import("@/features/lab/components/transformer/MultiHeadPipelineViz").then((m) => ({
    default: m.MultiHeadPipelineViz,
  })),
);

/* ─── Lazy-loaded visualizers: §06 ─── */
const ShuffleDisasterViz = lazy(() =>
  import("@/features/lab/components/transformer/ShuffleDisasterViz").then((m) => ({
    default: m.ShuffleDisasterViz,
  })),
);
const SimpleNumbersViz = lazy(() =>
  import("@/features/lab/components/transformer/SimpleNumbersViz").then((m) => ({
    default: m.SimpleNumbersViz,
  })),
);
const LearnedPositionEmbeddingsViz = lazy(() =>
  import("@/features/lab/components/transformer/LearnedPositionEmbeddingsViz").then((m) => ({
    default: m.LearnedPositionEmbeddingsViz,
  })),
);
const WaveFingerprintViz = lazy(() =>
  import("@/features/lab/components/transformer/WaveFingerprintViz").then((m) => ({
    default: m.WaveFingerprintViz,
  })),
);
const PositionalSimilarityViz = lazy(() =>
  import("@/features/lab/components/transformer/PositionalSimilarityViz").then((m) => ({
    default: m.PositionalSimilarityViz,
  })),
);
const AddEmbeddingsViz = lazy(() =>
  import("@/features/lab/components/transformer/AddEmbeddingsViz").then((m) => ({
    default: m.AddEmbeddingsViz,
  })),
);
const PositionInActionViz = lazy(() =>
  import("@/features/lab/components/transformer/PositionInActionViz").then((m) => ({
    default: m.PositionInActionViz,
  })),
);

/* ─── Lazy-loaded visualizers: §07 ─── */
const CommunicationVsProcessingViz = lazy(() =>
  import("@/features/lab/components/transformer/CommunicationVsProcessingViz").then((m) => ({
    default: m.CommunicationVsProcessingViz,
  })),
);
const FFNCallbackViz = lazy(() =>
  import("@/features/lab/components/transformer/FFNCallbackViz").then((m) => ({
    default: m.FFNCallbackViz,
  })),
);
const FFNDeepDiveViz = lazy(() =>
  import("@/features/lab/components/transformer/FFNDeepDiveViz").then((m) => ({
    default: m.FFNDeepDiveViz,
  })),
);
const HighwayReturnsViz = lazy(() =>
  import("@/features/lab/components/transformer/HighwayReturnsViz").then((m) => ({
    default: m.HighwayReturnsViz,
  })),
);
const LayerNormViz = lazy(() =>
  import("@/features/lab/components/transformer/LayerNormViz").then((m) => ({
    default: m.LayerNormViz,
  })),
);
const ValueDriftViz = lazy(() =>
  import("@/features/lab/components/transformer/ValueDriftViz").then((m) => ({
    default: m.ValueDriftViz,
  })),
);
const BatchVsLayerNormViz = lazy(() =>
  import("@/features/lab/components/transformer/BatchVsLayerNormViz").then((m) => ({
    default: m.BatchVsLayerNormViz,
  })),
);
const BlockBuilderViz = lazy(() =>
  import("@/features/lab/components/transformer/BlockBuilderViz").then((m) => ({
    default: m.BlockBuilderViz,
  })),
);
const BlockComponentExplorerViz = lazy(() =>
  import("@/features/lab/components/transformer/BlockComponentExplorerViz").then((m) => ({
    default: m.BlockComponentExplorerViz,
  })),
);
const QKVProjectionViz = lazy(() =>
  import("@/features/lab/components/transformer/QKVProjectionViz").then((m) => ({
    default: m.QKVProjectionViz,
  })),
);
const AttentionScoreViz = lazy(() =>
  import("@/features/lab/components/transformer/AttentionScoreViz").then((m) => ({
    default: m.AttentionScoreViz,
  })),
);
const TransformerBlockExplorerViz = lazy(() =>
  import("@/features/lab/components/transformer/TransformerBlockExplorerViz").then((m) => ({
    default: m.TransformerBlockExplorerViz,
  })),
);
const AttentionAloneFailsViz = lazy(() =>
  import("@/features/lab/components/transformer/AttentionAloneFailsViz").then((m) => ({
    default: m.AttentionAloneFailsViz,
  })),
);
const LayerEvolutionViz = lazy(() =>
  import("@/features/lab/components/transformer/LayerEvolutionViz").then((m) => ({
    default: m.LayerEvolutionViz,
  })),
);
const LinearSoftmaxViz = lazy(() =>
  import("@/features/lab/components/transformer/LinearSoftmaxViz").then((m) => ({
    default: m.LinearSoftmaxViz,
  })),
);

/* ─── Lazy-loaded visualizers: §08 ─── */
const UntrainedOutputViz = lazy(() =>
  import("@/features/lab/components/transformer/UntrainedOutputViz").then((m) => ({
    default: m.UntrainedOutputViz,
  })),
);
const ParallelPredictionViz = lazy(() =>
  import("@/features/lab/components/transformer/ParallelPredictionViz").then((m) => ({
    default: m.ParallelPredictionViz,
  })),
);
const TrainingTimelapseViz = lazy(() =>
  import("@/features/lab/components/transformer/TrainingTimelapseViz").then((m) => ({
    default: m.TrainingTimelapseViz,
  })),
);
const ModelBattleArena = lazy(() =>
  import("@/features/lab/components/transformer/ModelBattleArena").then((m) => ({
    default: m.ModelBattleArena,
  })),
);
const NeuronScalingViz = lazy(() =>
  import("@/features/lab/components/transformer/NeuronScalingViz").then((m) => ({
    default: m.NeuronScalingViz,
  })),
);
const CausalMaskViz = lazy(() =>
  import("@/features/lab/components/transformer/CausalMaskViz").then((m) => ({
    default: m.CausalMaskViz,
  })),
);
const CharGenerationPlayground = lazy(() =>
  import("@/features/lab/components/transformer/CharGenerationPlayground").then((m) => ({
    default: m.CharGenerationPlayground,
  })),
);

/* ─── Lazy-loaded visualizers: §09 ─── */
const DepthBreakthroughViz = lazy(() =>
  import("@/features/lab/components/transformer/DepthBreakthroughViz").then((m) => ({
    default: m.DepthBreakthroughViz,
  })),
);
const LayerLensViz = lazy(() =>
  import("@/features/lab/components/transformer/LayerLensViz").then((m) => ({
    default: m.LayerLensViz,
  })),
);
const DepthGenerationViz = lazy(() =>
  import("@/features/lab/components/transformer/DepthGenerationViz").then((m) => ({
    default: m.DepthGenerationViz,
  })),
);
const OverfittingDualCurveViz = lazy(() =>
  import("@/features/lab/components/transformer/OverfittingDualCurveViz").then((m) => ({
    default: m.OverfittingDualCurveViz,
  })),
);
const MemorizationRevealViz = lazy(() =>
  import("@/features/lab/components/transformer/MemorizationRevealViz").then((m) => ({
    default: m.MemorizationRevealViz,
  })),
);
const ContextWindowViz = lazy(() =>
  import("@/features/lab/components/transformer/ContextWindowViz").then((m) => ({
    default: m.ContextWindowViz,
  })),
);

/* ─── Lazy-loaded visualizers: §10 ─── */
const CharVsTokenViz = lazy(() =>
  import("@/features/lab/components/transformer/CharVsTokenViz").then((m) => ({
    default: m.CharVsTokenViz,
  })),
);
const EvolutionTimelineViz = lazy(() =>
  import("@/features/lab/components/transformer/EvolutionTimelineViz").then((m) => ({
    default: m.EvolutionTimelineViz,
  })),
);
const ArchitectureIdentityViz = lazy(() =>
  import("@/features/lab/components/transformer/ArchitectureIdentityViz").then((m) => ({
    default: m.ArchitectureIdentityViz,
  })),
);
const CompletionVsAssistantViz = lazy(() =>
  import("@/features/lab/components/transformer/CompletionVsAssistantViz").then((m) => ({
    default: m.CompletionVsAssistantViz,
  })),
);
const ThreeMysteriesViz = lazy(() =>
  import("@/features/lab/components/transformer/ThreeMysteriesViz").then((m) => ({
    default: m.ThreeMysteriesViz,
  })),
);
const ConceptRecallViz = lazy(() =>
  import("@/features/lab/components/transformer/ConceptRecallViz").then((m) => ({
    default: m.ConceptRecallViz,
  })),
);
const ShareJourneyViz = lazy(() =>
  import("@/features/lab/components/transformer/ShareJourneyViz").then((m) => ({
    default: m.ShareJourneyViz,
  })),
);

/* ─── The chapter accent ─── */
const NA: NarrativeAccent = "cyan";

/* ─── Accent-bound editorial primitives, injected into the MDX map (override the
   factory defaults so icon/accent/glow variants survive the port). ─── */

/* Callout icons are referenced by name from the MDX (e.g. icon="AlertTriangle"),
   since MDX can't reference TSX-scope component identifiers. */
const CALLOUT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  AlertTriangle,
  Brain,
  Layers,
  Sparkles,
  Zap,
};

/* Callout that keeps the chapter's icon + accent overrides. */
const Callout = ({
  icon,
  accent,
  title,
  children,
}: {
  icon?: string;
  accent?: NarrativeAccent | "indigo";
  title?: string;
  children?: React.ReactNode;
}) => (
  <_Callout icon={icon ? CALLOUT_ICONS[icon] : undefined} accent={accent ?? NA} title={title}>
    {children}
  </_Callout>
);

/* KeyTakeaway bound to cyan. */
const KeyTakeaway = ({
  accent,
  children,
}: {
  accent?: NarrativeAccent;
  children?: React.ReactNode;
}) => <_KeyTakeaway accent={accent ?? NA}>{children}</_KeyTakeaway>;

/* FormulaBlock bound to cyan. */
const FormulaBlock = (p: { formula: string; caption: string }) => (
  <_FormulaBlock accent={NA} {...p} />
);

/* PullQuote bound to cyan. */
const PullQuote = (p: { children?: React.ReactNode }) => (
  <_PullQuote accent={NA}>{p.children}</_PullQuote>
);

/* Highlight with the chapter's subtle glow + one-shot pulse (tooltip variant delegates
   to the primitive). Defaults to cyan; a per-highlight color override is honored. */
const Highlight = ({
  color,
  ...p
}: {
  children?: React.ReactNode;
  color?: HighlightColor;
  tooltip?: string;
}) => {
  const c = color ?? NA;
  const glowMap: Record<string, string> = {
    cyan: "0 0 12px rgba(34,211,238,0.25), 0 0 4px rgba(34,211,238,0.15)",
    amber: "0 0 12px rgba(251,191,36,0.25), 0 0 4px rgba(251,191,36,0.15)",
    rose: "0 0 12px rgba(244,63,94,0.2), 0 0 4px rgba(244,63,94,0.12)",
    violet: "0 0 12px rgba(139,92,246,0.2), 0 0 4px rgba(139,92,246,0.12)",
    indigo: "0 0 12px rgba(99,102,241,0.2), 0 0 4px rgba(99,102,241,0.12)",
    emerald: "0 0 12px rgba(52,211,153,0.2), 0 0 4px rgba(52,211,153,0.12)",
  };
  if (p.tooltip)
    return (
      <_Highlight color={c} tooltip={p.tooltip}>
        {p.children}
      </_Highlight>
    );
  return (
    <strong
      className={`font-semibold ${c === "cyan" ? "text-cyan-400" : c === "amber" ? "text-amber-400" : c === "rose" ? "text-rose-400" : c === "violet" ? "text-violet-400" : c === "indigo" ? "text-indigo-400" : "text-emerald-400"}`}
      style={{ textShadow: glowMap[c] || glowMap.cyan }}
    >
      {p.children}
    </strong>
  );
};

/* Gradient text for key phrases. */
const GradientText = ({
  children,
  from = "from-cyan-300",
  via,
  to = "to-teal-300",
}: {
  children?: React.ReactNode;
  from?: string;
  via?: string;
  to?: string;
}) => (
  <strong
    className={`font-semibold bg-gradient-to-r ${from} ${via ?? ""} ${to} bg-clip-text text-transparent`}
  >
    {children}
  </strong>
);

/* Subtle three-dot divider between narrative beats. */
const NarrativeDivider = () => (
  <div className="flex items-center justify-center gap-2 my-8 md:my-10" aria-hidden>
    <span className="w-1 h-1 rounded-full bg-cyan-400/20" />
    <span className="w-1 h-1 rounded-full bg-cyan-400/10" />
    <span className="w-1 h-1 rounded-full bg-cyan-400/20" />
  </div>
);

/* Styled inline arrow. */
const StyledArrow = () => (
  <svg className="inline-block w-4 h-3 mx-0.5 -mt-0.5" viewBox="0 0 16 12" fill="none" aria-hidden>
    <path
      d="M1 6h12M9 1l5 5-5 5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-cyan-400/60"
    />
  </svg>
);

/* KaTeX block, used inside the §08 deep-dive math panel. */
const Math = ({ children }: { children?: React.ReactNode }) => (
  <BlockMath math={String(children)} />
);

/* ─── Monster status banner (the chapter's recurring "👾 …" peak line) ─── */
const MonsterStatus = ({
  children,
  gradient = "cyan-teal",
}: {
  children?: React.ReactNode;
  gradient?: "cyan-teal" | "cyan-amber";
}) => {
  const gradientClass =
    gradient === "cyan-amber"
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

/* ─── Monster interlude (the muted italic bridge between sections) ─── */
const MonsterInterlude = ({ children }: { children?: React.ReactNode }) => (
  <FadeInView margin="-40px" className="my-12 text-center">
    <p className="text-sm md:text-base italic bg-gradient-to-r from-cyan-400/80 via-teal-300/80 to-cyan-400/80 bg-clip-text text-transparent max-w-lg mx-auto leading-relaxed">
      {children}
    </p>
  </FadeInView>
);

/* ─── §01 — the big centered word "tower" ─── */
const BigWord = ({ children }: { children?: React.ReactNode }) => (
  <FadeInView className="my-8">
    <p className="text-center text-4xl font-semibold text-white/90">{children}</p>
  </FadeInView>
);

/* ─── §03 — animated big question line ─── */
const BigQuestion = ({ children }: { children?: React.ReactNode }) => (
  <FadeInView className="my-10 md:my-16">
    <motion.p
      className="text-center text-xl sm:text-2xl md:text-3xl font-bold leading-relaxed max-w-2xl mx-auto bg-gradient-to-r from-cyan-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 1.5, ease: "easeOut" }}
    >
      {children}
    </motion.p>
  </FadeInView>
);

/* ─── §02 — "Optional Context" badge ─── */
const OptionalContextBadge = () => (
  <FadeInView className="flex items-center gap-2 mb-6 text-xs text-white/30">
    <span className="px-2 py-0.5 rounded border border-white/10 bg-white/5">Optional Context</span>
    <span>You can skip this if you&apos;re familiar with RNNs</span>
  </FadeInView>
);

/* ─── §03 — collapsible challenge (GuessPatternViz) ─── */
const GuessPatternChallenge = () => (
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
);

/* ─── §04c — Query / Key / Value three-card diagram ─── */
const QKVCards = () => (
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
        <path
          d="M 150 10 Q 150 20, 50 26"
          stroke="rgba(34,211,238,0.35)"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 150 10 Q 150 18, 150 26"
          stroke="rgba(52,211,153,0.35)"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 150 10 Q 150 20, 250 26"
          stroke="rgba(251,191,36,0.35)"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
        />
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
);

/* ─── §07 — BatchNorm vs LayerNorm collapsible ─── */
const BatchVsLayerNormDetails = () => (
  <FadeInView className="my-6">
    <details className="group max-w-lg mx-auto rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
      <summary className="flex items-center justify-between px-5 py-3 cursor-pointer text-[14px] font-semibold text-cyan-400/60 hover:text-cyan-400/80 transition-colors select-none list-none [&::-webkit-details-marker]:hidden">
        <span>BatchNorm vs LayerNorm &mdash; what changed?</span>
        <span className="text-[12px] text-white/20 group-open:rotate-180 transition-transform">
          {"▼"}
        </span>
      </summary>
      <div className="border-t border-white/5">
        <Suspense fallback={<SectionSkeleton />}>
          <BatchVsLayerNormViz />
        </Suspense>
      </div>
    </details>
  </FadeInView>
);

/* ─── §07 — the four-component checklist grid ─── */
const BlockComponentsGrid = () => (
  <div className="my-6 max-w-md mx-auto grid grid-cols-2 gap-2.5">
    {[
      {
        label: "Self-Attention",
        desc: "Tokens listen to each other",
        icon: "👂",
        color: "#22d3ee",
        rgb: "34,211,238",
      },
      {
        label: "Feed-Forward",
        desc: "Each token thinks privately",
        icon: "🧠",
        color: "#fbbf24",
        rgb: "251,191,36",
      },
      {
        label: "Residual Add",
        desc: "Preserve original signal",
        icon: "➕",
        color: "#22d3ee",
        rgb: "34,211,238",
      },
      {
        label: "Layer Norm",
        desc: "Keep values stable",
        icon: "⚖️",
        color: "#fbbf24",
        rgb: "251,191,36",
      },
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
          <span className="text-[13px] font-bold" style={{ color: item.color }}>
            {item.label}
          </span>
        </div>
        <span className="text-[12px] text-white/30 leading-snug">{item.desc}</span>
      </motion.div>
    ))}
  </div>
);

/* ─── §07 — the monster-assembly animation ─── */
const MonsterAssembly = () => (
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
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: part.delay }}
          >
            {part.icon}
          </motion.div>
        ))}
      </div>

      <motion.div
        className="w-64 h-1 rounded-full"
        style={{ background: "linear-gradient(90deg, #a78bfa40, #22d3ee40, #34d39940, #fbbf2440)" }}
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
        👾 I am assembled. Attention to hear. FFN to think. Residuals to remember. Normalization to
        stay calm. I am a Transformer block.
      </motion.p>
    </div>
  </FadeInView>
);

/* ─── §08 — the full deep-dive math panel (collapsible) ─── */
const FullMathPanel = () => (
  <FadeInView className="my-6">
    <details className="group max-w-2xl mx-auto rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
      <summary className="flex items-center justify-between px-5 py-3 cursor-pointer text-[14px] font-semibold text-cyan-400/60 hover:text-cyan-400/80 transition-colors select-none list-none [&::-webkit-details-marker]:hidden">
        <span>The full math: from embeddings to attention to training</span>
        <span className="text-[12px] text-white/20 group-open:rotate-180 transition-transform">
          {"▼"}
        </span>
      </summary>
      <div className="border-t border-white/5 px-5 py-6 space-y-8">
        {/* ──── SECTION 1: Embedding → Q, K, V ──── */}
        <div className="space-y-3">
          <h4 className="text-[14px] font-bold text-cyan-400/70">
            1. From Embedding to Query, Key, Value
          </h4>
          <p className="text-[13px] text-white/40 leading-relaxed">
            Every token enters the Transformer as an{" "}
            <strong className="text-white/60">embedding vector</strong>{" "}
            <span className="font-mono text-cyan-400/50">
              x ∈ ℝ<sup>d</sup>
            </span>{" "}
            &mdash; a list of <em>d</em> numbers that encode the token&apos;s meaning plus its
            position. For our model, <em>d</em> = 128.
          </p>
          <p className="text-[13px] text-white/40 leading-relaxed">
            To compute attention, each embedding is projected into three separate vectors through{" "}
            <strong className="text-white/60">learned weight matrices</strong>:
          </p>
          <div
            className="rounded-lg px-4 py-3 space-y-1.5 font-mono text-[13px]"
            style={{
              background: "rgba(34,211,238,0.04)",
              border: "1px solid rgba(34,211,238,0.1)",
            }}
          >
            <p>
              <span className="text-cyan-400/70">Q</span> <span className="text-white/20">=</span>{" "}
              <span className="text-white/40">x</span> <span className="text-white/20">·</span>{" "}
              <span className="text-cyan-400/60">
                W<sub>Q</sub>
              </span>{" "}
              <span className="text-white/15 text-[11px] ml-2">
                {"// Query: "}&quot;what am I looking for?&quot;
              </span>
            </p>
            <p>
              <span className="text-amber-400/70">K</span> <span className="text-white/20">=</span>{" "}
              <span className="text-white/40">x</span> <span className="text-white/20">·</span>{" "}
              <span className="text-amber-400/60">
                W<sub>K</sub>
              </span>{" "}
              <span className="text-white/15 text-[11px] ml-2">
                {"// Key: "}&quot;what do I contain?&quot;
              </span>
            </p>
            <p>
              <span className="text-emerald-400/70">V</span>{" "}
              <span className="text-white/20">=</span> <span className="text-white/40">x</span>{" "}
              <span className="text-white/20">·</span>{" "}
              <span className="text-emerald-400/60">
                W<sub>V</sub>
              </span>{" "}
              <span className="text-white/15 text-[11px] ml-2">
                {"// Value: "}&quot;what info do I carry?&quot;
              </span>
            </p>
          </div>
          <p className="text-[13px] text-white/40 leading-relaxed">
            Each <span className="font-mono text-white/50">W</span> is a{" "}
            <span className="font-mono text-cyan-400/50">
              d × d<sub>k</sub>
            </span>{" "}
            matrix. These matrices are the{" "}
            <strong className="text-white/60">learned parameters</strong> of attention &mdash;
            they&apos;re initialized randomly and updated by gradient descent during training. The
            same embedding <span className="font-mono text-white/50">x</span>, multiplied by three
            different matrices, produces three vectors with entirely different roles.
          </p>

          <Suspense fallback={<div className="h-32" />}>
            <QKVProjectionViz />
          </Suspense>

          <p className="text-[12px] text-white/25 leading-relaxed">
            In multi-head attention with <em>h</em> heads, each head uses its own smaller projection
            matrices of size{" "}
            <span className="font-mono text-white/30">
              d × d<sub>k</sub>
            </span>{" "}
            where{" "}
            <span className="font-mono text-white/30">
              d<sub>k</sub> = d / h
            </span>
            . With <em>d</em> = 128 and <em>h</em> = 4, each head projects to 32-dimensional Q, K, V
            vectors. The heads run in parallel, then their outputs are concatenated and projected
            back to <em>d</em> dimensions.
          </p>
        </div>

        {/* ──── SECTION 2: Attention Score Computation ──── */}
        <div className="space-y-3 pt-2 border-t border-white/5">
          <h4 className="text-[14px] font-bold text-cyan-400/70">2. Computing Attention Scores</h4>
          <p className="text-[13px] text-white/40 leading-relaxed">
            Attention scores tell us how much each token should &quot;listen to&quot; every other
            token. The full computation in one equation:
          </p>
          <div
            className="rounded-lg px-4 py-3 font-mono text-[13px] text-center"
            style={{
              background: "rgba(34,211,238,0.04)",
              border: "1px solid rgba(34,211,238,0.1)",
            }}
          >
            <span className="text-cyan-400/80">Attention(Q, K, V)</span>
            <span className="text-white/20"> = </span>
            <span className="text-white/50">softmax(</span>
            <span className="text-cyan-400/60">Q</span>
            <span className="text-amber-400/60">
              K<sup>T</sup>
            </span>
            <span className="text-white/30"> / </span>
            <span className="text-white/40">
              √d<sub>k</sub>
            </span>
            <span className="text-white/50">)</span>
            <span className="text-white/20"> · </span>
            <span className="text-emerald-400/60">V</span>
          </div>
          <p className="text-[13px] text-white/40 leading-relaxed">
            Let&apos;s break this down step by step:
          </p>
          <ol className="text-[13px] text-white/40 leading-relaxed space-y-2 list-decimal list-inside">
            <li>
              <strong className="text-white/55">
                Q × K<sup>T</sup>
              </strong>{" "}
              &mdash; Multiply each Query by every Key (transposed). This produces an{" "}
              <span className="font-mono text-white/30">n × n</span> matrix of raw scores, where{" "}
              <em>n</em> is the sequence length. Score<sub>ij</sub> measures how relevant token{" "}
              <em>j</em> is to token <em>i</em>.
            </li>
            <li>
              <strong className="text-white/55">
                ÷ √d<sub>k</sub>
              </strong>{" "}
              &mdash; Without scaling, the dot products grow proportionally to the dimension{" "}
              <em>
                d<sub>k</sub>
              </em>
              . Large values push softmax into extreme regions where gradients vanish. Dividing by{" "}
              <span className="font-mono text-white/30">
                √d<sub>k</sub>
              </span>{" "}
              keeps the scores in a healthy range.
            </li>
            <li>
              <strong className="text-amber-400/60">Mask</strong> &mdash; For each position{" "}
              <em>i</em>, set scores for all positions <em>j &gt; i</em> to{" "}
              <strong className="text-amber-400/70">&minus;∞</strong>. This ensures no token can see
              the future.
            </li>
            <li>
              <strong className="text-white/55">Softmax</strong> &mdash; Applied row-wise. Converts
              each row of scores into a probability distribution: all values between 0 and 1,
              summing to 1.{" "}
              <span className="font-mono text-amber-400/40">
                e<sup>&minus;∞</sup> = 0
              </span>
              , so masked positions contribute exactly nothing.
            </li>
            <li>
              <strong className="text-emerald-400/60">× V</strong> &mdash; Multiply the attention
              weights by the Value vectors. This produces a weighted sum: each token&apos;s output
              is a blend of the Value vectors it attended to, weighted by how much attention it
              paid.
            </li>
          </ol>

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
            and zeros. Before softmax, we add the mask (with zeros replaced by &minus;∞) to the
            score matrix:
          </p>
          <div
            className="rounded-lg px-4 py-3 font-mono text-[12px]"
            style={{
              background: "rgba(251,191,36,0.04)",
              border: "1px solid rgba(251,191,36,0.1)",
            }}
          >
            <p className="text-white/30">
              <span className="text-amber-400/50">scores_masked</span> ={" "}
              <span className="text-white/40">scores</span> +{" "}
              <span className="text-amber-400/60">mask</span>
            </p>
            <p className="text-white/20 mt-1 text-[11px]">
              where mask[i][j] = 0 if j ≤ i, &minus;∞ if j &gt; i
            </p>
          </div>
          <p className="text-[13px] text-white/40 leading-relaxed">
            Softmax computes{" "}
            <span className="font-mono text-white/30">
              e<sup>x</sup> / Σe<sup>x</sup>
            </span>
            . When x = &minus;∞, e<sup>&minus;∞</sup> = 0 — that position gets{" "}
            <strong className="text-cyan-400/70">exactly zero weight</strong>. Not approximately
            zero. <em>Mathematically</em> zero. The information at future positions is completely
            invisible.
          </p>
          <p className="text-[12px] text-white/25 leading-relaxed">
            This is called the <em className="text-white/35">causal mask</em> (or autoregressive
            mask). The name comes from causality: effects (predictions) can only depend on causes
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
            Here&apos;s where the mask gives us a superpower. Because each position can only see the
            past, we can train on{" "}
            <strong className="text-white/55">every position simultaneously</strong>. Given a
            sequence of <em>T</em> tokens, the model makes <em>T</em> predictions in a single
            forward pass:
          </p>
          <div
            className="rounded-lg px-4 py-3 font-mono text-[12px] space-y-1"
            style={{
              background: "rgba(34,211,238,0.04)",
              border: "1px solid rgba(34,211,238,0.1)",
            }}
          >
            <p className="text-white/25">Position 1: sees [x₁] → predicts x₂</p>
            <p className="text-white/25">Position 2: sees [x₁, x₂] → predicts x₃</p>
            <p className="text-white/25">Position 3: sees [x₁, x₂, x₃] → predicts x₄</p>
            <p className="text-white/20">...</p>
            <p className="text-white/25">
              Position T: sees [x₁, ..., x<sub>T</sub>] → predicts x<sub>T+1</sub>
            </p>
          </div>
          <p className="text-[13px] text-white/40 leading-relaxed">
            Each prediction is compared to the{" "}
            <strong className="text-white/55">actual next token</strong> using{" "}
            <strong className="text-cyan-400/60">cross-entropy loss</strong>:
          </p>
          <div
            className="rounded-lg px-4 py-3 font-mono text-[13px] text-center"
            style={{
              background: "rgba(34,211,238,0.04)",
              border: "1px solid rgba(34,211,238,0.1)",
            }}
          >
            <span className="text-cyan-400/70">ℒ</span>
            <span className="text-white/20"> = </span>
            <span className="text-white/30">&minus;(1/T)</span>
            <span className="text-white/40">
              {" "}
              Σ<sub>t=1..T</sub>
            </span>
            <span className="text-white/30"> log </span>
            <span className="text-white/40">
              p(x<sub>t+1</sub> | x<sub>1</sub>, ..., x<sub>t</sub>)
            </span>
          </div>
          <p className="text-[13px] text-white/40 leading-relaxed">
            In words: at each position, the model outputs a probability distribution over the entire
            vocabulary. Cross-entropy measures how much probability the model assigned to the{" "}
            <em>correct</em> next token. The loss is the{" "}
            <strong className="text-white/55">negative log of that probability</strong>, averaged
            over all positions.
          </p>
          <p className="text-[13px] text-white/40 leading-relaxed">
            If the model assigns probability 1.0 to the correct token, log(1.0) = 0 → loss = 0
            (perfect). If it assigns 0.01, log(0.01) ≈ &minus;4.6 → loss = 4.6 (terrible). The model
            learns by minimizing this loss through gradient descent &mdash; adjusting every weight
            matrix (W<sub>Q</sub>, W<sub>K</sub>, W<sub>V</sub>, W<sub>O</sub>, W<sub>1</sub>, W
            <sub>2</sub>, embeddings, the linear head) to push the probability of the correct next
            token higher.
          </p>
          <p className="text-[12px] text-white/25 leading-relaxed">
            A sequence of 256 characters = 256 predictions = 256 loss terms = 256 training signals
            from a single forward pass. Compare that to the MLP: it sees 8 characters, makes 1
            prediction, then slides the window. The Transformer is{" "}
            <strong className="text-white/35">256× more efficient per example</strong>.
          </p>
        </div>

        {/* ──── SECTION 5: Parameter Count ──── */}
        <div className="space-y-3 pt-2 border-t border-white/5">
          <h4 className="text-[14px] font-bold text-white/50">5. Where Are All the Parameters?</h4>
          <p className="text-[13px] text-white/40 leading-relaxed">
            For a single attention head with <em>d</em> = 128 and{" "}
            <em>
              d<sub>k</sub>
            </em>{" "}
            = 32:
          </p>
          <div
            className="rounded-lg px-4 py-3 font-mono text-[12px] space-y-1"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <p className="text-white/30">
              W<sub>Q</sub>: <span className="text-white/40">128 × 32</span> ={" "}
              <span className="text-cyan-400/50">4,096</span> params
            </p>
            <p className="text-white/30">
              W<sub>K</sub>: <span className="text-white/40">128 × 32</span> ={" "}
              <span className="text-cyan-400/50">4,096</span> params
            </p>
            <p className="text-white/30">
              W<sub>V</sub>: <span className="text-white/40">128 × 32</span> ={" "}
              <span className="text-cyan-400/50">4,096</span> params
            </p>
            <p className="text-white/20 mt-1">
              × 4 heads = <span className="text-cyan-400/50">49,152</span>
            </p>
            <p className="text-white/30">
              W<sub>O</sub>: <span className="text-white/40">128 × 128</span> ={" "}
              <span className="text-cyan-400/50">16,384</span> params
            </p>
            <p className="text-white/30">
              FFN W<sub>1</sub>: <span className="text-white/40">128 × 512</span> ={" "}
              <span className="text-amber-400/50">65,536</span> params
            </p>
            <p className="text-white/30">
              FFN W<sub>2</sub>: <span className="text-white/40">512 × 128</span> ={" "}
              <span className="text-amber-400/50">65,536</span> params
            </p>
            <p className="text-white/20 mt-1 border-t border-white/5 pt-1">
              Total per block ≈ <span className="text-white/45 font-bold">196,608</span> parameters
            </p>
            <p className="text-white/20">
              × 4 blocks = <span className="text-white/45 font-bold">~786K</span> trainable params
            </p>
          </div>
          <p className="text-[12px] text-white/25 leading-relaxed">
            Add the embedding matrix (vocabulary × <em>d</em>), positional embeddings (block_size ×{" "}
            <em>d</em>), LayerNorm parameters (4 × 2 × <em>d</em>), and the final linear head
            (vocabulary × <em>d</em>), and our 4-block model totals about{" "}
            <strong className="text-white/35">~1 million parameters</strong>. Every single one is
            updated at every training step.
          </p>
        </div>
      </div>
    </details>
  </FadeInView>
);

/* ─── The chapter's widgets + bespoke components, injected into the shared MDX map. ─── */
const TF_WIDGETS = {
  /* §01 */
  WordToEmbeddingViz,
  PronounResolutionViz,
  DrawConnectionsViz,
  WishlistCallbackViz,
  FrozenVsContextualViz,
  ContextEnrichmentViz,
  /* §02 */
  TelephoneGameViz,
  LSTMBandageViz,
  SequentialVsParallelViz,
  RNNChainViz,
  /* §03 */
  SpotlightViz,
  GuessPatternViz,
  StaticVsDynamicViz,
  AttentionHeatmapViz,
  AttentionWebViz,
  /* §04a */
  EmbeddingToArrowViz,
  DotProductCalculatorViz,
  PairwiseScoringViz,
  SelfSimilarityViz,
  EmbeddingAttentionFailureViz,
  /* §04b-c */
  QKSplitViz,
  QKMatrixViz,
  QuerySearchViz,
  WhyQKMattersViz,
  WeightsOfWhatViz,
  ValueCompletesViz,
  BeforeAfterAttentionViz,
  /* §04d */
  NumbersExplodeViz,
  ScalingFixViz,
  FullScoringPipelineViz,
  ContextAssemblyFilmViz,
  FullContextualAssemblyViz,
  /* §05 */
  WhichWordMattersViz,
  OneHeadDilemmaViz,
  MultiHeadIdeaViz,
  MultiLensViewViz,
  HeadBudgetViz,
  MultiHeadPipelineViz,
  /* §06 */
  ShuffleDisasterViz,
  SimpleNumbersViz,
  LearnedPositionEmbeddingsViz,
  WaveFingerprintViz,
  PositionalSimilarityViz,
  AddEmbeddingsViz,
  PositionInActionViz,
  /* §07 */
  CommunicationVsProcessingViz,
  FFNCallbackViz,
  FFNDeepDiveViz,
  HighwayReturnsViz,
  LayerNormViz,
  ValueDriftViz,
  BlockBuilderViz,
  BlockComponentExplorerViz,
  TransformerBlockExplorerViz,
  AttentionAloneFailsViz,
  LayerEvolutionViz,
  LinearSoftmaxViz,
  /* §08 */
  UntrainedOutputViz,
  ParallelPredictionViz,
  TrainingTimelapseViz,
  ModelBattleArena,
  NeuronScalingViz,
  CausalMaskViz,
  CharGenerationPlayground,
  /* §09 */
  DepthBreakthroughViz,
  LayerLensViz,
  DepthGenerationViz,
  OverfittingDualCurveViz,
  MemorizationRevealViz,
  ContextWindowViz,
  /* §10 */
  CharVsTokenViz,
  EvolutionTimelineViz,
  ArchitectureIdentityViz,
  CompletionVsAssistantViz,
  ThreeMysteriesViz,
  ConceptRecallViz,
  ShareJourneyViz,

  /* editorial primitives (override factory defaults to keep icon/accent/glow) */
  Callout,
  KeyTakeaway,
  FormulaBlock,
  PullQuote,
  Highlight,

  /* bespoke text + layout blocks */
  GradientText,
  NarrativeDivider,
  StyledArrow,
  Math,
  MonsterStatus,
  MonsterInterlude,
  BigWord,
  BigQuestion,
  OptionalContextBadge,
  GuessPatternChallenge,
  QKVCards,
  BatchVsLayerNormDetails,
  BlockComponentsGrid,
  MonsterAssembly,
  FullMathPanel,
} as unknown as Record<string, React.ComponentType<Record<string, unknown>>>;

/* ─────────────────────────────────────────────
   Main narrative component — a thin shell: hero + progress bar in TSX, the chapter
   body authored in transformer.{es,en}.mdx and rendered through the shared MDX map.
   (This chapter is English-only at source: both language bodies carry the same prose
   until a Spanish translation is authored.)
   ───────────────────────────────────────────── */

export function TransformerNarrative() {
  const { language } = useI18n();
  const { hasStoredProgress, storedSection, clearProgress } = useProgressTracker("transformer");

  const Body = language === "es" ? TransformerEs : TransformerEn;
  const mdxComponents = useMemo(
    () =>
      labMdxComponents(NA, TF_WIDGETS, {
        open: language === "es" ? "leer" : "read",
        close: language === "es" ? "cerrar" : "close",
      }),
    [language],
  );

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
            From blind pattern matching to understanding connections between every token. The
            architecture that powers GPT, Claude, and the modern AI revolution.
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

      {/* ═══════════ Chapter body — authored in transformer.{es,en}.mdx ═══════════ */}
      <Body components={mdxComponents} />
    </article>
  );
}
