"use client";

import { lazy, Suspense, useCallback, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDown,
  Beaker,
  BookOpen,
  ChevronDown,
  FlaskConical,
  History,
  Layers,
} from "lucide-react";

import { BlockMath } from "@/components/math/LazyMath";
import NnEn from "@/content/lab/nn.en.mdx";
import NnEs from "@/content/lab/nn.es.mdx";
import { ContinueToast } from "@/features/lab/components/ContinueToast";
import { FadeInView } from "@/features/lab/components/FadeInView";
import { Term } from "@/features/lab/components/GlossaryTooltip";
import { SectionSkeleton } from "@/features/lab/components/LazySection";
import { labMdxComponents } from "@/features/lab/components/mdx/labMdxComponents";
import { ModeToggle } from "@/features/lab/components/ModeToggle";
import { Callout } from "@/features/lab/components/narrative-primitives";
import { Challenge } from "@/features/lab/components/nn/Challenge";
import { HiddenSection } from "@/features/lab/components/nn/VisualizerFrame";
import type { TrainingStep } from "@/features/lab/components/NNTrainingDemo";
import { SectionProgressBar } from "@/features/lab/components/SectionProgressBar";
import { useLabMode } from "@/features/lab/context/LabModeContext";
import { useProgressTracker } from "@/features/lab/hooks/useProgressTracker";
import { useI18n } from "@/i18n/context";
import { useRouter } from "@/i18n/navigation";

/* ─── Lazy-loaded interactive visualizers, injected into the MDX ─── */
const ActivationDerivativeVisualizer = lazy(() =>
  import("@/features/lab/components/nn/ActivationDerivativeVisualizer").then((m) => ({
    default: m.ActivationDerivativeVisualizer,
  })),
);
const BackpropZeroDemo = lazy(() =>
  import("@/features/lab/components/nn/BackpropZeroDemo").then((m) => ({
    default: m.BackpropZeroDemo,
  })),
);
const BatchSizeComparisonVisualizer = lazy(() =>
  import("@/features/lab/components/nn/BatchSizeComparisonVisualizer").then((m) => ({
    default: m.BatchSizeComparisonVisualizer,
  })),
);
const BeatTheMachineChallenge = lazy(() =>
  import("@/features/lab/components/nn/BeatTheMachineChallenge").then((m) => ({
    default: m.BeatTheMachineChallenge,
  })),
);
const BiasDemo = lazy(() =>
  import("@/features/lab/components/nn/BiasDemo").then((m) => ({ default: m.BiasDemo })),
);
const BiologicalVsArtificialDiagram = lazy(() =>
  import("@/features/lab/components/nn/BiologicalVsArtificialDiagram").then((m) => ({
    default: m.BiologicalVsArtificialDiagram,
  })),
);
const ChainRuleBuilder = lazy(() =>
  import("@/features/lab/components/nn/ChainRuleBuilder").then((m) => ({
    default: m.ChainRuleBuilder,
  })),
);
const DeadNeuronDemo = lazy(() =>
  import("@/features/lab/components/nn/DeadNeuronDemo").then((m) => ({
    default: m.DeadNeuronDemo,
  })),
);
const DecisionBoundaryIntro = lazy(() =>
  import("@/features/lab/components/nn/DecisionBoundaryIntro").then((m) => ({
    default: m.DecisionBoundaryIntro,
  })),
);
const DerivativeIntuitionDemo = lazy(() =>
  import("@/features/lab/components/nn/DerivativeIntuitionDemo").then((m) => ({
    default: m.DerivativeIntuitionDemo,
  })),
);
const DivergenceDemo = lazy(() =>
  import("@/features/lab/components/nn/DivergenceDemo").then((m) => ({
    default: m.DivergenceDemo,
  })),
);
const FlatGradientVisualizer = lazy(() =>
  import("@/features/lab/components/nn/FlatGradientVisualizer").then((m) => ({
    default: m.FlatGradientVisualizer,
  })),
);
const GradientNoiseVisualizer = lazy(() =>
  import("@/features/lab/components/nn/GradientNoiseVisualizer").then((m) => ({
    default: m.GradientNoiseVisualizer,
  })),
);
const LearningRateDemo = lazy(() =>
  import("@/features/lab/components/nn/LearningRateDemo").then((m) => ({
    default: m.LearningRateDemo,
  })),
);
const LetterToNumberDemo = lazy(() =>
  import("@/features/lab/components/nn/LetterToNumberDemo").then((m) => ({
    default: m.LetterToNumberDemo,
  })),
);
const LinearStackingDemo = lazy(() =>
  import("@/features/lab/components/nn/LinearStackingDemo").then((m) => ({
    default: m.LinearStackingDemo,
  })),
);
const LossDerivativeVisualizer = lazy(() =>
  import("@/features/lab/components/nn/LossDerivativeVisualizer").then((m) => ({
    default: m.LossDerivativeVisualizer,
  })),
);
const LossFormulaMotivation = lazy(() =>
  import("@/features/lab/components/nn/LossFormulaMotivation").then((m) => ({
    default: m.LossFormulaMotivation,
  })),
);
const LossWeightParabolaVisualizer = lazy(() =>
  import("@/features/lab/components/nn/LossWeightParabolaVisualizer").then((m) => ({
    default: m.LossWeightParabolaVisualizer,
  })),
);
const LROvershootVisualizer = lazy(() =>
  import("@/features/lab/components/nn/LROvershootVisualizer").then((m) => ({
    default: m.LROvershootVisualizer,
  })),
);
const MatrixMultiplyVisual = lazy(() =>
  import("@/features/lab/components/nn/MatrixMultiplyVisual").then((m) => ({
    default: m.MatrixMultiplyVisual,
  })),
);
const NeuronGradientCalculator = lazy(() =>
  import("@/features/lab/components/nn/NeuronGradientCalculator").then((m) => ({
    default: m.NeuronGradientCalculator,
  })),
);
const NudgeWeightDemo = lazy(() =>
  import("@/features/lab/components/nn/NudgeWeightDemo").then((m) => ({
    default: m.NudgeWeightDemo,
  })),
);
const OperationExplorer = lazy(() =>
  import("@/features/lab/components/nn/OperationExplorer").then((m) => ({
    default: m.OperationExplorer,
  })),
);
const OutputLayerNetworkVisualizer = lazy(() =>
  import("@/features/lab/components/nn/OutputLayerNetworkVisualizer").then((m) => ({
    default: m.OutputLayerNetworkVisualizer,
  })),
);
const OverfittingPlayground = lazy(() =>
  import("@/features/lab/components/nn/OverfittingPlayground").then((m) => ({
    default: m.OverfittingPlayground,
  })),
);
const ParallelNeuronsDemo = lazy(() =>
  import("@/features/lab/components/nn/ParallelNeuronsDemo").then((m) => ({
    default: m.ParallelNeuronsDemo,
  })),
);
const PredictionErrorDemo = lazy(() =>
  import("@/features/lab/components/nn/PredictionErrorDemo").then((m) => ({
    default: m.PredictionErrorDemo,
  })),
);
const RepeatedTrainingDemo = lazy(() =>
  import("@/features/lab/components/nn/RepeatedTrainingDemo").then((m) => ({
    default: m.RepeatedTrainingDemo,
  })),
);
const SoftmaxTransformDemo = lazy(() =>
  import("@/features/lab/components/nn/SoftmaxTransformDemo").then((m) => ({
    default: m.SoftmaxTransformDemo,
  })),
);
const StepEpochBatchCounter = lazy(() =>
  import("@/features/lab/components/nn/StepEpochBatchCounter").then((m) => ({
    default: m.StepEpochBatchCounter,
  })),
);
const ToyAlphabetPredictor = lazy(() =>
  import("@/features/lab/components/nn/ToyAlphabetPredictor").then((m) => ({
    default: m.ToyAlphabetPredictor,
  })),
);
const ToyVowelTeaser = lazy(() =>
  import("@/features/lab/components/nn/ToyVowelTeaser").then((m) => ({
    default: m.ToyVowelTeaser,
  })),
);
const TrainingWithTextDemo = lazy(() =>
  import("@/features/lab/components/nn/TrainingWithTextDemo").then((m) => ({
    default: m.TrainingWithTextDemo,
  })),
);
const TrainValSplitVisualizer = lazy(() =>
  import("@/features/lab/components/nn/TrainValSplitVisualizer").then((m) => ({
    default: m.TrainValSplitVisualizer,
  })),
);
const WeightImpactVisualizer = lazy(() =>
  import("@/features/lab/components/nn/WeightImpactVisualizer").then((m) => ({
    default: m.WeightImpactVisualizer,
  })),
);
const WeightSliderDemo = lazy(() =>
  import("@/features/lab/components/nn/WeightSliderDemo").then((m) => ({
    default: m.WeightSliderDemo,
  })),
);
const WeightTrajectoryDemo = lazy(() =>
  import("@/features/lab/components/nn/WeightTrajectoryDemo").then((m) => ({
    default: m.WeightTrajectoryDemo,
  })),
);
const XORSolverDemo = lazy(() =>
  import("@/features/lab/components/nn/XORSolverDemo").then((m) => ({ default: m.XORSolverDemo })),
);
const NNActivationExplorer = lazy(() =>
  import("@/features/lab/components/NNActivationExplorer").then((m) => ({
    default: m.NNActivationExplorer,
  })),
);
const ModelOutputTeaser = lazy(() =>
  import("@/features/lab/components/nn/ModelOutputTeaser").then((m) => ({
    default: m.ModelOutputTeaser,
  })),
);
const ContextWindowTeaser = lazy(() =>
  import("@/features/lab/components/nn/ContextWindowTeaser").then((m) => ({
    default: m.ContextWindowTeaser,
  })),
);
const SquaredVsCrossEntropy = lazy(() =>
  import("@/features/lab/components/mlp/SquaredVsCrossEntropy").then((m) => ({
    default: m.SquaredVsCrossEntropy,
  })),
);
const CrossEntropyVisualizer = lazy(() =>
  import("@/features/lab/components/mlp/CrossEntropyVisualizer").then((m) => ({
    default: m.CrossEntropyVisualizer,
  })),
);
const NNBigramComparison = lazy(() =>
  import("@/features/lab/components/NNBigramComparison").then((m) => ({
    default: m.NNBigramComparison,
  })),
);
const NNLossLandscape = lazy(() =>
  import("@/features/lab/components/NNLossLandscape").then((m) => ({ default: m.NNLossLandscape })),
);
const NNPerceptronDiagram = lazy(() =>
  import("@/features/lab/components/NNPerceptronDiagram").then((m) => ({
    default: m.NNPerceptronDiagram,
  })),
);
const NNTrainingDemo = lazy(() =>
  import("@/features/lab/components/NNTrainingDemo").then((m) => ({ default: m.NNTrainingDemo })),
);
const OverfittingComparisonDiagram = lazy(() =>
  import("@/features/lab/components/OverfittingComparisonDiagram").then((m) => ({
    default: m.OverfittingComparisonDiagram,
  })),
);
const TrainValLossCurveVisualizer = lazy(() =>
  import("@/features/lab/components/TrainValLossCurveVisualizer").then((m) => ({
    default: m.TrainValLossCurveVisualizer,
  })),
);

/* ─── KaTeX block, used inside HiddenSections via <Math>{`…latex…`}</Math> ─── */
function Math({ children }: { children?: React.ReactNode }) {
  return <BlockMath math={String(children)} />;
}

/* ─── Styled editorial lines reused across the chapter (children carry the text) ─── */
function Peak({ children }: { children?: React.ReactNode }) {
  return (
    <p className="text-center text-lg md:text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-pink-200 to-rose-300 my-10 italic">
      {children}
    </p>
  );
}

function Reflection({ children }: { children?: React.ReactNode }) {
  return <p className="text-center text-sm text-white/30 italic my-6">{children}</p>;
}

/* The anticipatory "predict before you try" prompt — muted, left-aligned italic. */
function Predict({ children }: { children?: React.ReactNode }) {
  return (
    <p className="text-[15px] md:text-base text-[var(--lab-text-muted)] leading-[1.9] mb-5 italic">
      {children}
    </p>
  );
}

/* ─── §01 — Counting vs Learning comparison table (reads its i18n) ─── */
function CountingVsLearning() {
  const { t } = useI18n();
  const base = "neuralNetworkNarrative.discovery.countingVsLearning";
  return (
    <div className="my-8 rounded-2xl border border-white/[0.08] bg-[var(--lab-viz-bg)] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">
          {t(`${base}.title`)}
        </span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
        <div className="px-4 py-3 bg-rose-500/[0.02]">
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-400/60 mb-3">
            {t(`${base}.countingCol`)}
          </p>
        </div>
        <div className="px-4 py-3 bg-emerald-500/[0.02]">
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400/60 mb-3">
            {t(`${base}.learningCol`)}
          </p>
        </div>
      </div>
      {(["row1", "row2", "row3", "row4"] as const).map((row) => (
        <div
          key={row}
          className="grid grid-cols-2 divide-x divide-white/[0.06] border-t border-white/[0.04]"
        >
          <div className="px-4 py-3">
            <p className="text-[10px] font-mono text-white/30 mb-1">{t(`${base}.${row}Label`)}</p>
            <p className="text-xs text-rose-300/60 leading-relaxed">
              {t(`${base}.${row}Counting`)}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[10px] font-mono text-white/30 mb-1">{t(`${base}.${row}Label`)}</p>
            <p className="text-xs text-emerald-300/60 leading-relaxed">
              {t(`${base}.${row}Learning`)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── §06 — Step / Epoch / Batch terminology cards (reads its i18n) ─── */
function TermCards() {
  const { t } = useI18n();
  const HL = labMdxComponents("rose", {}).Highlight as (p: {
    color?: string;
    tooltip?: string;
    children?: React.ReactNode;
  }) => React.ReactElement;
  const cards: { letter: string; term: string; desc: string; tip: string }[] = [
    {
      letter: "S",
      term: t("neuralNetworkNarrative.watchingItLearn.termStep"),
      desc: t("neuralNetworkNarrative.watchingItLearn.termStepDesc"),
      tip: t("neuralNetworkNarrative.narratorTooltips.step"),
    },
    {
      letter: "E",
      term: t("neuralNetworkNarrative.watchingItLearn.termEpoch"),
      desc: t("neuralNetworkNarrative.watchingItLearn.termEpochDesc"),
      tip: t("neuralNetworkNarrative.narratorTooltips.epoch"),
    },
    {
      letter: "B",
      term: t("neuralNetworkNarrative.watchingItLearn.termBatch"),
      desc: t("neuralNetworkNarrative.watchingItLearn.termBatchDesc"),
      tip: t("neuralNetworkNarrative.narratorTooltips.batch"),
    },
  ];
  return (
    <div className="my-8 rounded-2xl border border-indigo-500/[0.15] bg-indigo-500/[0.02] p-5 sm:p-6 space-y-4">
      {cards.map(({ letter, term, desc, tip }) => (
        <div key={letter} className="flex items-start gap-3">
          <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400 mt-0.5">
            {letter}
          </span>
          <div>
            <p className="text-sm font-semibold text-white/70 mb-1">
              <HL color="indigo" tooltip={tip}>
                {term}
              </HL>
            </p>
            <p className="text-xs text-white/40">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── §05 — Worked example step cards (inside a HiddenSection) ─── */
function WorkedExample() {
  const { t } = useI18n();
  const base = "neuralNetworkNarrative.howItLearns.workedExample";
  return (
    <>
      <p className="text-sm text-white/50 leading-relaxed mb-3">{t(`${base}.intro`)}</p>
      {(["step1", "step2", "step3", "step4", "step5"] as const).map((step) => (
        <div key={step} className="mb-3 border-l-2 border-indigo-500/20 pl-3">
          <p className="text-xs font-semibold text-white/60 mb-1">{t(`${base}.${step}Title`)}</p>
          <p className="text-xs text-white/40">{t(`${base}.${step}Text`)}</p>
        </div>
      ))}
      <p className="text-xs text-white/30 italic border-t border-white/[0.06] pt-3">
        {t("neuralNetworkNarrative.howItLearns.workedUpdateNote")}
      </p>
    </>
  );
}

/* ─── §07 — Supervised-learning SVG flow + example cards (inside a HiddenSection) ─── */
function SupervisedFlow() {
  const { t } = useI18n();
  const base = "neuralNetworkNarrative.training";
  return (
    <>
      {/* SVG flow: input → model → prediction → true label → compare/loss/update */}
      <div className="rounded-xl bg-black/20 border border-white/[0.05] p-3 mb-4 overflow-x-auto">
        <svg viewBox="0 0 340 64" className="w-full block" style={{ minWidth: 280 }}>
          {[
            { x: 4, label: "Input", sub: "(x₁, x₂...)", col: "#38bdf8" },
            { x: 84, label: "Model", sub: "(weights)", col: "#fb7185" },
            { x: 164, label: "Prediction", sub: "ŷ", col: "#a78bfa" },
            { x: 244, label: "True label", sub: "y", col: "#fbbf24" },
          ].map(({ x, label, sub, col }) => (
            <g key={label}>
              <rect
                x={x}
                y={8}
                width={72}
                height={36}
                rx={6}
                fill={col + "15"}
                stroke={col + "40"}
                strokeWidth={1}
              />
              <text
                x={x + 36}
                y={24}
                textAnchor="middle"
                fill={col}
                fontSize="8"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {label}
              </text>
              <text
                x={x + 36}
                y={36}
                textAnchor="middle"
                fill="rgba(255,255,255,0.3)"
                fontSize="7"
                fontFamily="monospace"
              >
                {sub}
              </text>
            </g>
          ))}
          {[76, 156, 236].map((ax) => (
            <g key={ax}>
              <line
                x1={ax}
                y1={26}
                x2={ax + 8}
                y2={26}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={1}
              />
              <polygon
                points={`${ax + 8},23 ${ax + 8},29 ${ax + 12},26`}
                fill="rgba(255,255,255,0.2)"
              />
            </g>
          ))}
          <path
            d="M280,26 Q310,26 310,50 Q310,58 258,58 Q200,58 200,50 Q200,44 244,44"
            fill="none"
            stroke="#f43f5e60"
            strokeWidth="1"
            strokeDasharray="3 2"
          />
          <text
            x={258}
            y={62}
            textAnchor="middle"
            fill="#f43f5e80"
            fontSize="6.5"
            fontFamily="monospace"
          >
            compare → loss → update weights
          </text>
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          {
            emoji: "🖼️",
            input: t(`${base}.supervisedCard1Input`),
            output: t(`${base}.supervisedCard1Output`),
          },
          {
            emoji: "✉️",
            input: t(`${base}.supervisedCard2Input`),
            output: t(`${base}.supervisedCard2Output`),
          },
          {
            emoji: "🩻",
            input: t(`${base}.supervisedCard3Input`),
            output: t(`${base}.supervisedCard3Output`),
          },
        ].map(({ emoji, input, output }) => (
          <div
            key={input}
            className="rounded-lg border border-rose-500/[0.08] bg-rose-500/[0.03] p-3 text-center"
          >
            <span className="text-xl block mb-1.5">{emoji}</span>
            <p className="text-[9px] font-mono text-white/30 mb-0.5">{input}</p>
            <p className="text-[10px] font-mono font-bold" style={{ color: "#fb7185cc" }}>
              → {output}
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs text-white/30 italic border-t border-white/[0.06] pt-3">
        {t(`${base}.supervisedNote`)}
      </p>
    </>
  );
}

/* ─── §06 — Live training demo + alert + challenge + loss landscape (shared live state) ─── */
function LiveTrainingBlock() {
  const { t } = useI18n();
  const [landscapeHistory, setLandscapeHistory] = useState<TrainingStep[]>([]);
  const [landscapeTarget, setLandscapeTarget] = useState(0.8);
  const handleTrainingHistory = useCallback((history: TrainingStep[], target: number) => {
    setLandscapeHistory(history);
    setLandscapeTarget(target);
  }, []);

  const lossDiverging =
    landscapeHistory.length > 3 &&
    landscapeHistory[landscapeHistory.length - 1].loss > landscapeHistory[0].loss;

  return (
    <>
      <figure className="my-11 md:my-14 -mx-2 sm:mx-0">
        <figcaption className="px-1 pb-3 text-[10px] font-mono uppercase tracking-widest text-rose-400/50">
          {t("neuralNetworkNarrative.training.liveDemoLabel")}
        </figcaption>
        <div className="rounded-2xl border border-amber-500/[0.12] bg-gradient-to-br from-amber-500/[0.02] to-transparent overflow-hidden">
          <div className="p-4 bg-[var(--lab-viz-bg)]">
            <Suspense fallback={<SectionSkeleton />}>
              <NNTrainingDemo onHistoryChange={handleTrainingHistory} />
            </Suspense>
          </div>
        </div>
        <p className="mt-3 px-1 text-[11px] text-[var(--lab-text-subtle)] italic">
          {t("neuralNetworkNarrative.training.liveDemoHint")}
        </p>
      </figure>

      {lossDiverging && (
        <Callout
          icon={AlertTriangle}
          accent="amber"
          title={t("neuralNetworkNarrative.watchingItLearn.alertTitle")}
        >
          <p>{t("neuralNetworkNarrative.watchingItLearn.alertText")}</p>
        </Callout>
      )}

      <Challenge
        question={t("neuralNetworkNarrative.batchChallenge.question")}
        hint={t("neuralNetworkNarrative.batchChallenge.hint")}
        successMessage={t("neuralNetworkNarrative.batchChallenge.success")}
      />

      <p className="text-[10px] font-mono uppercase tracking-widest text-white/25 mt-8 mb-1">
        {t("neuralNetworkNarrative.watchingItLearn.landscapeTitle")}
      </p>
      <p className="text-sm text-white/50 leading-relaxed mb-2">
        {t("neuralNetworkNarrative.watchingItLearn.landscapeDesc")}
      </p>
      {landscapeHistory.length > 0 && (
        <Suspense fallback={<SectionSkeleton />}>
          <NNLossLandscape history={landscapeHistory} target={landscapeTarget} />
        </Suspense>
      )}
    </>
  );
}

/* ─── §09 — Three forward-looking questions ─── */
function ForwardQuestions() {
  const { t } = useI18n();
  return (
    <div className="space-y-3 my-6">
      {(["q1", "q2", "q3"] as const).map((key, i) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.12 }}
          className="flex items-start gap-3 rounded-lg border border-violet-500/10 bg-violet-500/[0.03] p-3"
        >
          <span className="shrink-0 w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-400 mt-0.5">
            {i + 1}
          </span>
          <span className="text-sm text-[var(--lab-text-muted)] leading-relaxed italic">
            {t(`neuralNetworkNarrative.whatsNext.${key}`)}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── §09 — Recap peak + aspirational closing block ─── */
function ClosingLines() {
  const { t } = useI18n();
  return (
    <>
      <motion.p
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="text-center text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 my-10 italic"
      >
        {t("neuralNetworkNarrative.whatsNext.pRecapPeak")}
      </motion.p>

      <div className="my-10 py-8 border-t border-b border-violet-500/10 text-center space-y-4">
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-amber-200 to-violet-300 italic"
        >
          {t("neuralNetworkNarrative.whatsNext.pClosing")}
        </motion.p>
        <p className="text-[11px] font-mono text-white/25">
          {t("neuralNetworkNarrative.whatsNext.pClosingSub")}
        </p>
      </div>
    </>
  );
}

/* ─── Collapsible History Sidebar (kept from the original chapter; wrapped to read i18n) ─── */
function HistorySidebar() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const timelineEvents = [
    { year: "1943", color: "from-blue-400 to-cyan-400", label: "Birth of the Idea" },
    { year: "1958", color: "from-emerald-400 to-green-400", label: "First Learning Machine" },
    { year: "1969", color: "from-slate-400 to-gray-500", label: "AI Winter Begins" },
    { year: "1986", color: "from-amber-400 to-orange-400", label: "The Thaw" },
    { year: "2012+", color: "from-rose-400 to-indigo-400", label: "Deep Learning Era" },
  ];

  return (
    <FadeInView
      as="aside"
      margin="-40px"
      className="my-12 rounded-2xl border border-rose-500/20 overflow-hidden relative"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-6 py-5 text-left group transition-all duration-300 relative bg-gradient-to-br from-rose-500/[0.08] via-pink-500/[0.04] to-rose-500/[0.06] hover:from-rose-500/[0.12] hover:via-pink-500/[0.06] hover:to-rose-500/[0.08]"
      >
        <div className="shrink-0 p-2.5 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 ring-1 ring-rose-500/30 group-hover:ring-rose-500/50 transition-all">
          <History className="w-5 h-5 text-rose-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-pink-200 to-rose-200 mb-1">
            {t("neuralNetworkNarrative.history.title")}
          </p>
          <p className="text-xs text-[var(--lab-text-muted)] leading-relaxed">
            {t("neuralNetworkNarrative.history.summary")}
          </p>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-rose-400/60 group-hover:text-rose-400 transition-colors" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden bg-[var(--lab-viz-bg)]"
          >
            <div className="px-6 pb-6 border-t border-white/[0.06] pt-5">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-rose-400/50 mb-6 text-center">
                {t("neuralNetworkNarrative.history.subtitle")}
              </p>

              <div className="mb-8 px-2">
                <div className="relative">
                  <div className="absolute left-0 right-0 top-4 h-0.5 bg-gradient-to-r from-blue-500/20 via-amber-500/30 to-rose-500/20" />
                  <div className="relative flex justify-between items-start">
                    {timelineEvents.map((event, idx) => (
                      <motion.div
                        key={event.year}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: idx * 0.1, duration: 0.3 }}
                        className="flex flex-col items-center"
                      >
                        <div
                          className={`w-8 h-8 rounded-full bg-gradient-to-br ${event.color} shadow-lg flex items-center justify-center ring-4 ring-black/50`}
                        >
                          <div className="w-2 h-2 rounded-full bg-white/90" />
                        </div>
                        <span className="mt-2 text-[10px] font-bold font-mono text-white/60 whitespace-nowrap">
                          {event.year}
                        </span>
                        <span className="mt-1 text-[9px] text-white/30 text-center max-w-[60px] leading-tight">
                          {event.label}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {(
                  [
                    {
                      year: "1943",
                      border: "border-blue-500/30",
                      num: "text-blue-400",
                      kicker: "text-blue-400/60",
                      label: "The Seed",
                      key: "p1",
                    },
                    {
                      year: "1958",
                      border: "border-emerald-500/30",
                      num: "text-emerald-400",
                      kicker: "text-emerald-400/60",
                      label: "First Steps",
                      key: "p2",
                    },
                    {
                      year: "1969",
                      border: "border-slate-500/30",
                      num: "text-slate-400",
                      kicker: "text-slate-400/60",
                      label: "The Winter",
                      key: "p3",
                    },
                    {
                      year: "1970s",
                      border: "border-slate-500/20",
                      num: "text-slate-500",
                      kicker: "text-slate-500/60",
                      label: "The Persistence",
                      key: "p3_5",
                    },
                    {
                      year: "1986",
                      border: "border-amber-500/30",
                      num: "text-amber-400",
                      kicker: "text-amber-400/60",
                      label: "The Thaw",
                      key: "p4",
                    },
                  ] as const
                ).map((e, i) => (
                  <motion.div
                    key={e.key}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className={`border-l-2 ${e.border} pl-4`}
                  >
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className={`text-2xl font-bold ${e.num} font-mono shrink-0`}>
                        {e.year}
                      </span>
                      <span
                        className={`text-xs uppercase tracking-wider ${e.kicker} font-semibold`}
                      >
                        {e.label}
                      </span>
                    </div>
                    <p className="text-sm text-white/50 leading-relaxed">
                      {t(`neuralNetworkNarrative.history.${e.key}`)}
                    </p>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="border-l-2 border-rose-500/30 pl-4"
                >
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-400 font-mono shrink-0">
                      2012+
                    </span>
                    <span className="text-xs uppercase tracking-wider text-rose-400/60 font-semibold">
                      The Bloom
                    </span>
                  </div>
                  <p className="text-sm text-white/50 leading-relaxed">
                    {t("neuralNetworkNarrative.history.p5")}
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </FadeInView>
  );
}

/* The chapter's widgets + bespoke components, injected into the shared MDX component map. */
const NN_WIDGETS = {
  /* lazy visualizers */
  ActivationDerivativeVisualizer,
  BackpropZeroDemo,
  BatchSizeComparisonVisualizer,
  BeatTheMachineChallenge,
  BiasDemo,
  BiologicalVsArtificialDiagram,
  ChainRuleBuilder,
  DeadNeuronDemo,
  DecisionBoundaryIntro,
  DerivativeIntuitionDemo,
  DivergenceDemo,
  FlatGradientVisualizer,
  GradientNoiseVisualizer,
  LearningRateDemo,
  LetterToNumberDemo,
  LinearStackingDemo,
  LossDerivativeVisualizer,
  LossFormulaMotivation,
  LossWeightParabolaVisualizer,
  LROvershootVisualizer,
  MatrixMultiplyVisual,
  NeuronGradientCalculator,
  NudgeWeightDemo,
  OperationExplorer,
  OutputLayerNetworkVisualizer,
  OverfittingPlayground,
  ParallelNeuronsDemo,
  PredictionErrorDemo,
  RepeatedTrainingDemo,
  SoftmaxTransformDemo,
  StepEpochBatchCounter,
  ToyAlphabetPredictor,
  ToyVowelTeaser,
  TrainingWithTextDemo,
  TrainValSplitVisualizer,
  WeightImpactVisualizer,
  WeightSliderDemo,
  WeightTrajectoryDemo,
  XORSolverDemo,
  NNActivationExplorer,
  ModelOutputTeaser,
  ContextWindowTeaser,
  SquaredVsCrossEntropy,
  CrossEntropyVisualizer,
  NNBigramComparison,
  OverfittingComparisonDiagram,
  TrainValLossCurveVisualizer,
  NNPerceptronDiagram,
  /* glossary + interactive primitives used directly in the MDX */
  Term,
  Challenge,
  HiddenSection,
  Math,
  /* bespoke editorial / stateful blocks */
  CountingVsLearning,
  TermCards,
  WorkedExample,
  SupervisedFlow,
  LiveTrainingBlock,
  ForwardQuestions,
  ClosingLines,
  HistorySidebar,
  Peak,
  Reflection,
  Predict,
} as unknown as Record<string, React.ComponentType<Record<string, unknown>>>;

/* ─────────────────────────────────────────────
   Main narrative component — a thin shell: hero + progress bar + CTA + footer in TSX,
   the chapter body authored in nn.{es,en}.mdx and rendered through the shared MDX
   component map. (The body's prose, widgets, challenges and hidden sections live in the .mdx.)
   ───────────────────────────────────────────── */

export function NeuralNetworkNarrative() {
  const { t, language } = useI18n();
  const router = useRouter();
  const { setMode } = useLabMode();
  const { hasStoredProgress, storedSection, clearProgress } = useProgressTracker("neural-networks");

  const Body = language === "es" ? NnEs : NnEn;
  const mdxComponents = labMdxComponents("rose", NN_WIDGETS, {
    open: language === "es" ? "leer" : "read",
    close: language === "es" ? "cerrar" : "close",
  });

  return (
    <article className="max-w-4xl mx-auto px-6 pb-28">
      <ContinueToast
        accent="rose"
        hasStoredProgress={hasStoredProgress}
        storedSection={storedSection}
        clearProgress={clearProgress}
        sectionNames={{
          "nn-01": t("neuralNetworkNarrative.sections.discovery.label"),
          "nn-02": t("models.neuralNetworks.sections.artificialNeuron.label"),
          "nn-03": t("models.neuralNetworks.sections.nonLinearity.label"),
          "nn-04": t("models.neuralNetworks.sections.findingDirection.label"),
          "nn-05": t("models.neuralNetworks.sections.makingItLearn.label"),
          "nn-06": t("models.neuralNetworks.sections.trainingAtScale.label"),
          "nn-07": t("models.neuralNetworks.sections.overfittingTrap.label"),
          "nn-08": t("neuralNetworkNarrative.sections.fromNumbers.label"),
          "nn-09": t("neuralNetworkNarrative.sections.whatsNext.label"),
        }}
      />
      <SectionProgressBar
        sections={[
          {
            id: "nn-01",
            label: t("neuralNetworkNarrative.sections.discovery.number"),
            name: t("neuralNetworkNarrative.sections.discovery.label"),
          },
          {
            id: "nn-02",
            label: t("models.neuralNetworks.sections.artificialNeuron.number"),
            name: t("models.neuralNetworks.sections.artificialNeuron.label"),
          },
          {
            id: "nn-03",
            label: t("models.neuralNetworks.sections.nonLinearity.number"),
            name: t("models.neuralNetworks.sections.nonLinearity.label"),
          },
          {
            id: "nn-04",
            label: t("models.neuralNetworks.sections.findingDirection.number"),
            name: t("models.neuralNetworks.sections.findingDirection.label"),
          },
          {
            id: "nn-05",
            label: t("models.neuralNetworks.sections.makingItLearn.number"),
            name: t("models.neuralNetworks.sections.makingItLearn.label"),
          },
          {
            id: "nn-06",
            label: t("models.neuralNetworks.sections.trainingAtScale.number"),
            name: t("models.neuralNetworks.sections.trainingAtScale.label"),
          },
          {
            id: "nn-07",
            label: t("models.neuralNetworks.sections.overfittingTrap.number"),
            name: t("models.neuralNetworks.sections.overfittingTrap.label"),
          },
          {
            id: "nn-08",
            label: t("neuralNetworkNarrative.sections.fromNumbers.number"),
            name: t("neuralNetworkNarrative.sections.fromNumbers.label"),
          },
          {
            id: "nn-09",
            label: t("neuralNetworkNarrative.sections.whatsNext.number"),
            name: t("neuralNetworkNarrative.sections.whatsNext.label"),
          },
        ]}
        accent="rose"
      />

      {/* ───────────────────── HERO ───────────────────── */}
      <header className="text-center mb-24 md:mb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-rose-400/60 mb-6">
            <BookOpen className="w-3.5 h-3.5" />
            {t("neuralNetworkNarrative.hero.eyebrow")}
          </span>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[var(--lab-text)] mb-6">
            {t("neuralNetworkNarrative.hero.titlePrefix")}{" "}
            <span className="bg-gradient-to-r from-rose-400 via-pink-300 to-rose-400 bg-clip-text text-transparent">
              {t("neuralNetworkNarrative.hero.titleSuffix")}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-[var(--lab-text-subtle)] max-w-xl mx-auto leading-relaxed mb-4">
            {t("neuralNetworkNarrative.hero.description")}
          </p>

          <p className="text-xs font-mono text-[var(--lab-text-subtle)] max-w-md mx-auto leading-relaxed mb-4 tracking-wide">
            {t("neuralNetworkNarrative.hero.recap")}
          </p>

          <p className="text-[11px] font-mono text-[var(--lab-text-subtle)] mb-12">
            ~25 min read · 16 interactive demos
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

      {/* ═══════════ Chapter body — authored in nn.{es,en}.mdx ═══════════ */}
      <Body components={mdxComponents} />

      {/* ───────────────── CTA ───────────────── */}
      <section id="nn-cta" className="mb-20 md:mb-28">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--lab-text)] tracking-tight mb-3">
            {t("neuralNetworkNarrative.cta.title")}
          </h2>
          <p className="text-sm text-[var(--lab-text-muted)] max-w-lg mx-auto leading-relaxed">
            {t("neuralNetworkNarrative.cta.subtitle")}
          </p>
        </div>

        {/* What's Next preview */}
        <div className="mb-8 rounded-2xl border border-rose-500/[0.15] bg-rose-500/[0.03] p-5 sm:p-6">
          <p className="text-[10px] font-mono uppercase tracking-widest text-rose-400/50 mb-4">
            {t("neuralNetworkNarrative.cta.whatsNextTitle")}
          </p>
          <ul className="space-y-3">
            {(["whatsNext1", "whatsNext2", "whatsNext3"] as const).map((key, i) => (
              <li key={key} className="flex items-start gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-[10px] font-bold text-rose-400 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-[var(--lab-text-muted)] leading-relaxed">
                  {t(`neuralNetworkNarrative.cta.${key}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode("free")}
            className="group relative rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-950/20 to-[var(--lab-viz-bg)]/80 p-6 text-left transition-all hover:border-rose-500/40 hover:shadow-[0_0_30px_-8px_rgba(244,63,94,0.15)] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-rose-500/15 group-hover:bg-rose-500/25 transition-colors">
                  <Beaker className="w-5 h-5 text-rose-300" />
                </div>
                <span className="text-lg font-bold text-[var(--lab-text)]">
                  {t("neuralNetworkNarrative.cta.labButton")}
                </span>
              </div>
              <p className="text-sm text-[var(--lab-text-muted)] leading-relaxed">
                {t("neuralNetworkNarrative.cta.labDesc")}
              </p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/lab/mlp")}
            className="group relative rounded-2xl border-2 border-violet-500/30 bg-gradient-to-br from-violet-950/30 via-rose-950/10 to-[var(--lab-viz-bg)]/80 p-6 text-left transition-all hover:border-violet-500/50 hover:shadow-[0_0_40px_-8px_rgba(139,92,246,0.2)] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="absolute top-0 right-0 px-2.5 py-1 rounded-bl-lg bg-violet-500/15 text-[9px] font-mono font-bold text-violet-400/80 uppercase tracking-widest">
              Recommended
            </div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-violet-500/15 group-hover:bg-violet-500/25 transition-colors">
                  <Layers className="w-5 h-5 text-violet-300" />
                </div>
                <span className="text-lg font-bold text-[var(--lab-text)]">
                  {t("neuralNetworkNarrative.cta.mlpButton")}
                </span>
              </div>
              <p className="text-sm text-[var(--lab-text-muted)] leading-relaxed">
                {t("neuralNetworkNarrative.cta.mlpDesc")}
              </p>
            </div>
          </motion.button>
        </div>
      </section>

      {/* ───────────────── CODA ───────────────── */}
      <FadeInView
        as="footer"
        className="mt-8 pt-12 border-t border-[var(--lab-border)] text-center"
      >
        <p className="text-sm text-[var(--lab-text-subtle)] italic max-w-md mx-auto leading-relaxed mb-10">
          {t("neuralNetworkNarrative.footer.text")}
        </p>
        <div className="flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[var(--lab-border)]">
          <FlaskConical className="h-3 w-3" />
          {t("neuralNetworkNarrative.footer.brand")}
        </div>
      </FadeInView>
    </article>
  );
}
