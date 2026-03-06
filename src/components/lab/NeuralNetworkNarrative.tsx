"use client";

import { lazy, Suspense, useCallback, useState } from "react";
import { BlockMath } from "react-katex";
import { useRouter } from "next/navigation";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowDown, Beaker, BookOpen, ChevronDown, FlaskConical, History, Layers, Lightbulb } from "lucide-react";

import { ContinueToast } from "@/components/lab/ContinueToast";
import { FadeInView } from "@/components/lab/FadeInView";
import { Term } from "@/components/lab/GlossaryTooltip";
import { KeyTakeaway } from "@/components/lab/KeyTakeaway";
import { LazySection, SectionSkeleton } from "@/components/lab/LazySection";
import { ModeToggle } from "@/components/lab/ModeToggle";
import { Challenge } from "@/components/lab/nn/Challenge";
import { VisualizerFrame } from "@/components/lab/nn/VisualizerFrame";
import { HiddenSection } from "@/components/lab/nn/VisualizerFrame";
import { SectionAnchor } from "@/components/lab/SectionAnchor";
import { SectionProgressBar } from "@/components/lab/SectionProgressBar";
import { useLabMode } from "@/context/LabModeContext";
import { useProgressTracker } from "@/hooks/useProgressTracker";
import { useI18n } from "@/i18n/context";

/* ─── Lazy-loaded interactive visualizers ─── */
const ActivationDerivativeVisualizer = lazy(() => import("@/components/lab/nn/ActivationDerivativeVisualizer").then(m => ({ default: m.ActivationDerivativeVisualizer })));
const BackpropZeroDemo = lazy(() => import("@/components/lab/nn/BackpropZeroDemo").then(m => ({ default: m.BackpropZeroDemo })));
const BatchSizeComparisonVisualizer = lazy(() => import("@/components/lab/nn/BatchSizeComparisonVisualizer").then(m => ({ default: m.BatchSizeComparisonVisualizer })));
const BeatTheMachineChallenge = lazy(() => import("@/components/lab/nn/BeatTheMachineChallenge").then(m => ({ default: m.BeatTheMachineChallenge })));
const BiasDemo = lazy(() => import("@/components/lab/nn/BiasDemo").then(m => ({ default: m.BiasDemo })));
const BiologicalVsArtificialDiagram = lazy(() => import("@/components/lab/nn/BiologicalVsArtificialDiagram").then(m => ({ default: m.BiologicalVsArtificialDiagram })));
const ChainRuleBuilder = lazy(() => import("@/components/lab/nn/ChainRuleBuilder").then(m => ({ default: m.ChainRuleBuilder })));
const DeadNeuronDemo = lazy(() => import("@/components/lab/nn/DeadNeuronDemo").then(m => ({ default: m.DeadNeuronDemo })));
const DecisionBoundaryIntro = lazy(() => import("@/components/lab/nn/DecisionBoundaryIntro").then(m => ({ default: m.DecisionBoundaryIntro })));
const DerivativeIntuitionDemo = lazy(() => import("@/components/lab/nn/DerivativeIntuitionDemo").then(m => ({ default: m.DerivativeIntuitionDemo })));
const DivergenceDemo = lazy(() => import("@/components/lab/nn/DivergenceDemo").then(m => ({ default: m.DivergenceDemo })));
const FlatGradientVisualizer = lazy(() => import("@/components/lab/nn/FlatGradientVisualizer").then(m => ({ default: m.FlatGradientVisualizer })));
const GradientNoiseVisualizer = lazy(() => import("@/components/lab/nn/GradientNoiseVisualizer").then(m => ({ default: m.GradientNoiseVisualizer })));
const LearningRateDemo = lazy(() => import("@/components/lab/nn/LearningRateDemo").then(m => ({ default: m.LearningRateDemo })));
const LetterToNumberDemo = lazy(() => import("@/components/lab/nn/LetterToNumberDemo").then(m => ({ default: m.LetterToNumberDemo })));
const LinearStackingDemo = lazy(() => import("@/components/lab/nn/LinearStackingDemo").then(m => ({ default: m.LinearStackingDemo })));
const LossDerivativeVisualizer = lazy(() => import("@/components/lab/nn/LossDerivativeVisualizer").then(m => ({ default: m.LossDerivativeVisualizer })));
const LossFormulaMotivation = lazy(() => import("@/components/lab/nn/LossFormulaMotivation").then(m => ({ default: m.LossFormulaMotivation })));
const LossWeightParabolaVisualizer = lazy(() => import("@/components/lab/nn/LossWeightParabolaVisualizer").then(m => ({ default: m.LossWeightParabolaVisualizer })));
const LROvershootVisualizer = lazy(() => import("@/components/lab/nn/LROvershootVisualizer").then(m => ({ default: m.LROvershootVisualizer })));
const MatrixMultiplyVisual = lazy(() => import("@/components/lab/nn/MatrixMultiplyVisual").then(m => ({ default: m.MatrixMultiplyVisual })));
const NeuronGradientCalculator = lazy(() => import("@/components/lab/nn/NeuronGradientCalculator").then(m => ({ default: m.NeuronGradientCalculator })));
const NudgeWeightDemo = lazy(() => import("@/components/lab/nn/NudgeWeightDemo").then(m => ({ default: m.NudgeWeightDemo })));
const OperationExplorer = lazy(() => import("@/components/lab/nn/OperationExplorer").then(m => ({ default: m.OperationExplorer })));
const OutputLayerNetworkVisualizer = lazy(() => import("@/components/lab/nn/OutputLayerNetworkVisualizer").then(m => ({ default: m.OutputLayerNetworkVisualizer })));
const OverfittingPlayground = lazy(() => import("@/components/lab/nn/OverfittingPlayground").then(m => ({ default: m.OverfittingPlayground })));
const ParallelNeuronsDemo = lazy(() => import("@/components/lab/nn/ParallelNeuronsDemo").then(m => ({ default: m.ParallelNeuronsDemo })));
const PredictionErrorDemo = lazy(() => import("@/components/lab/nn/PredictionErrorDemo").then(m => ({ default: m.PredictionErrorDemo })));
const RepeatedTrainingDemo = lazy(() => import("@/components/lab/nn/RepeatedTrainingDemo").then(m => ({ default: m.RepeatedTrainingDemo })));
const SoftmaxTransformDemo = lazy(() => import("@/components/lab/nn/SoftmaxTransformDemo").then(m => ({ default: m.SoftmaxTransformDemo })));
const StepEpochBatchCounter = lazy(() => import("@/components/lab/nn/StepEpochBatchCounter").then(m => ({ default: m.StepEpochBatchCounter })));
const ToyAlphabetPredictor = lazy(() => import("@/components/lab/nn/ToyAlphabetPredictor").then(m => ({ default: m.ToyAlphabetPredictor })));
const ToyVowelTeaser = lazy(() => import("@/components/lab/nn/ToyVowelTeaser").then(m => ({ default: m.ToyVowelTeaser })));
const TrainingWithTextDemo = lazy(() => import("@/components/lab/nn/TrainingWithTextDemo").then(m => ({ default: m.TrainingWithTextDemo })));
const TrainValSplitVisualizer = lazy(() => import("@/components/lab/nn/TrainValSplitVisualizer").then(m => ({ default: m.TrainValSplitVisualizer })));
const WeightImpactVisualizer = lazy(() => import("@/components/lab/nn/WeightImpactVisualizer").then(m => ({ default: m.WeightImpactVisualizer })));
const WeightSliderDemo = lazy(() => import("@/components/lab/nn/WeightSliderDemo").then(m => ({ default: m.WeightSliderDemo })));
const WeightTrajectoryDemo = lazy(() => import("@/components/lab/nn/WeightTrajectoryDemo").then(m => ({ default: m.WeightTrajectoryDemo })));
const XORSolverDemo = lazy(() => import("@/components/lab/nn/XORSolverDemo").then(m => ({ default: m.XORSolverDemo })));
const NNActivationExplorer = lazy(() => import("@/components/lab/NNActivationExplorer").then(m => ({ default: m.NNActivationExplorer })));
const ModelOutputTeaser = lazy(() => import("@/components/lab/nn/ModelOutputTeaser").then(m => ({ default: m.ModelOutputTeaser })));
const ContextWindowTeaser = lazy(() => import("@/components/lab/nn/ContextWindowTeaser").then(m => ({ default: m.ContextWindowTeaser })));
const SquaredVsCrossEntropy = lazy(() => import("@/components/lab/mlp/SquaredVsCrossEntropy").then(m => ({ default: m.SquaredVsCrossEntropy })));
const CrossEntropyVisualizer = lazy(() => import("@/components/lab/mlp/CrossEntropyVisualizer").then(m => ({ default: m.CrossEntropyVisualizer })));
const NNBigramComparison = lazy(() => import("@/components/lab/NNBigramComparison").then(m => ({ default: m.NNBigramComparison })));
const NNLossLandscape = lazy(() => import("@/components/lab/NNLossLandscape").then(m => ({ default: m.NNLossLandscape })));
const NNPerceptronDiagram = lazy(() => import("@/components/lab/NNPerceptronDiagram").then(m => ({ default: m.NNPerceptronDiagram })));
import type { TrainingStep } from "@/components/lab/NNTrainingDemo";
const NNTrainingDemo = lazy(() => import("@/components/lab/NNTrainingDemo").then(m => ({ default: m.NNTrainingDemo })));
const OverfittingComparisonDiagram = lazy(() => import("@/components/lab/OverfittingComparisonDiagram").then(m => ({ default: m.OverfittingComparisonDiagram })));
const TrainValLossCurveVisualizer = lazy(() => import("@/components/lab/TrainValLossCurveVisualizer").then(m => ({ default: m.TrainValLossCurveVisualizer })));

import {
    Callout,
    FigureWrapper,
    FormulaBlock as _FormulaBlock,
    Heading as _Heading,
    Highlight,
    Lead, type NarrativeAccent,
    P, PullQuote as _PullQuote,
    Section, SectionBreak, SectionLabel as _SectionLabel,
} from "./narrative-primitives";

/* ─── Accent-bound wrappers ─── */
const NA: NarrativeAccent = "rose";
const SectionLabel = (p: { number: string; label: string }) => <_SectionLabel accent={NA} variant="gradient" {...p} />;
const Heading = ({ children }: { children: React.ReactNode }) => <_Heading className="font-extrabold">{children}</_Heading>;
const FormulaBlock = (p: { formula: string; caption: string }) => <_FormulaBlock accent={NA} {...p} />;
const PullQuote = ({ children }: { children: React.ReactNode }) => <_PullQuote accent={NA}>{children}</_PullQuote>;

/* ─────────────────────────────────────────────
   Collapsible History Sidebar
   ───────────────────────────────────────────── */

function HistorySidebar({ t }: { t: (key: string) => string }) {
    const [open, setOpen] = useState(false);

    const timelineEvents = [
        { year: "1943", color: "from-blue-400 to-cyan-400", label: "Birth of the Idea" },
        { year: "1958", color: "from-emerald-400 to-green-400", label: "First Learning Machine" },
        { year: "1969", color: "from-slate-400 to-gray-500", label: "AI Winter Begins" },
        { year: "1986", color: "from-amber-400 to-orange-400", label: "The Thaw" },
        { year: "2012+", color: "from-rose-400 to-indigo-400", label: "Deep Learning Era" },
    ];

    return (
        <FadeInView as="aside" margin="-40px" className="my-12 rounded-2xl border border-rose-500/20 overflow-hidden relative">
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
                            {/* Subtitle */}
                            <p className="text-xs font-bold uppercase tracking-[0.15em] text-rose-400/50 mb-6 text-center">
                                {t("neuralNetworkNarrative.history.subtitle")}
                            </p>

                            {/* Mini Timeline Visual */}
                            <div className="mb-8 px-2">
                                <div className="relative">
                                    {/* Timeline line */}
                                    <div className="absolute left-0 right-0 top-4 h-0.5 bg-gradient-to-r from-blue-500/20 via-amber-500/30 to-rose-500/20" />

                                    {/* Timeline points */}
                                    <div className="relative flex justify-between items-start">
                                        {timelineEvents.map((event, idx) => (
                                            <motion.div
                                                key={event.year}
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: idx * 0.1, duration: 0.3 }}
                                                className="flex flex-col items-center"
                                            >
                                                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${event.color} shadow-lg flex items-center justify-center ring-4 ring-black/50`}>
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

                            {/* Story paragraphs with colorful styling */}
                            <div className="space-y-5">
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="border-l-2 border-blue-500/30 pl-4"
                                >
                                    <div className="flex items-baseline gap-3 mb-2">
                                        <span className="text-2xl font-bold text-blue-400 font-mono shrink-0">1943</span>
                                        <span className="text-xs uppercase tracking-wider text-blue-400/60 font-semibold">The Seed</span>
                                    </div>
                                    <p className="text-sm text-white/50 leading-relaxed">{t("neuralNetworkNarrative.history.p1")}</p>
                                </motion.div>

                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="border-l-2 border-emerald-500/30 pl-4"
                                >
                                    <div className="flex items-baseline gap-3 mb-2">
                                        <span className="text-2xl font-bold text-emerald-400 font-mono shrink-0">1958</span>
                                        <span className="text-xs uppercase tracking-wider text-emerald-400/60 font-semibold">First Steps</span>
                                    </div>
                                    <p className="text-sm text-white/50 leading-relaxed">{t("neuralNetworkNarrative.history.p2")}</p>
                                </motion.div>

                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="border-l-2 border-slate-500/30 pl-4"
                                >
                                    <div className="flex items-baseline gap-3 mb-2">
                                        <span className="text-2xl font-bold text-slate-400 font-mono shrink-0">1969</span>
                                        <span className="text-xs uppercase tracking-wider text-slate-400/60 font-semibold">The Winter</span>
                                    </div>
                                    <p className="text-sm text-white/50 leading-relaxed">{t("neuralNetworkNarrative.history.p3")}</p>
                                </motion.div>

                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.35 }}
                                    className="border-l-2 border-slate-500/20 pl-4"
                                >
                                    <div className="flex items-baseline gap-3 mb-2">
                                        <span className="text-2xl font-bold text-slate-500 font-mono shrink-0">1970s</span>
                                        <span className="text-xs uppercase tracking-wider text-slate-500/60 font-semibold">The Persistence</span>
                                    </div>
                                    <p className="text-sm text-white/50 leading-relaxed">{t("neuralNetworkNarrative.history.p3_5")}</p>
                                </motion.div>

                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.45 }}
                                    className="border-l-2 border-amber-500/30 pl-4"
                                >
                                    <div className="flex items-baseline gap-3 mb-2">
                                        <span className="text-2xl font-bold text-amber-400 font-mono shrink-0">1986</span>
                                        <span className="text-xs uppercase tracking-wider text-amber-400/60 font-semibold">The Thaw</span>
                                    </div>
                                    <p className="text-sm text-white/50 leading-relaxed">{t("neuralNetworkNarrative.history.p4")}</p>
                                </motion.div>

                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="border-l-2 border-rose-500/30 pl-4"
                                >
                                    <div className="flex items-baseline gap-3 mb-2">
                                        <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-400 font-mono shrink-0">2012+</span>
                                        <span className="text-xs uppercase tracking-wider text-rose-400/60 font-semibold">The Bloom</span>
                                    </div>
                                    <p className="text-sm text-white/50 leading-relaxed">{t("neuralNetworkNarrative.history.p5")}</p>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </FadeInView>
    );
}

/* ─────────────────────────────────────────────
   Main narrative component
   ───────────────────────────────────────────── */

export function NeuralNetworkNarrative() {
    const { t } = useI18n();
    const router = useRouter();
    const { mode, setMode } = useLabMode();
    const { hasStoredProgress, storedSection, clearProgress } = useProgressTracker("neural-networks");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [landscapeHistory, setLandscapeHistory] = useState<TrainingStep[]>([]);
    const [landscapeTarget, setLandscapeTarget] = useState(0.8);
    const handleTrainingHistory = useCallback((history: TrainingStep[], target: number) => {
        setLandscapeHistory(history);
        setLandscapeTarget(target);
    }, []);

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
                    { id: "nn-01", label: t("neuralNetworkNarrative.sections.discovery.number"), name: t("neuralNetworkNarrative.sections.discovery.label") },
                    { id: "nn-02", label: t("models.neuralNetworks.sections.artificialNeuron.number"), name: t("models.neuralNetworks.sections.artificialNeuron.label") },
                    { id: "nn-03", label: t("models.neuralNetworks.sections.nonLinearity.number"), name: t("models.neuralNetworks.sections.nonLinearity.label") },
                    { id: "nn-04", label: t("models.neuralNetworks.sections.findingDirection.number"), name: t("models.neuralNetworks.sections.findingDirection.label") },
                    { id: "nn-05", label: t("models.neuralNetworks.sections.makingItLearn.number"), name: t("models.neuralNetworks.sections.makingItLearn.label") },
                    { id: "nn-06", label: t("models.neuralNetworks.sections.trainingAtScale.number"), name: t("models.neuralNetworks.sections.trainingAtScale.label") },
                    { id: "nn-07", label: t("models.neuralNetworks.sections.overfittingTrap.number"), name: t("models.neuralNetworks.sections.overfittingTrap.label") },
                    { id: "nn-08", label: t("neuralNetworkNarrative.sections.fromNumbers.number"), name: t("neuralNetworkNarrative.sections.fromNumbers.label") },
                    { id: "nn-09", label: t("neuralNetworkNarrative.sections.whatsNext.number"), name: t("neuralNetworkNarrative.sections.whatsNext.label") },
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

            {/* ─────────── 01 · LET'S TEACH A MACHINE TO LEARN ─────────── */}
            <Section id="nn-01">
                <SectionLabel number={t("neuralNetworkNarrative.sections.discovery.number")} label={t("neuralNetworkNarrative.sections.discovery.label")} />
                <SectionAnchor id="nn-01"><Heading>{t("neuralNetworkNarrative.discovery.heading")}</Heading></SectionAnchor>
                <Lead>
                    {t("neuralNetworkNarrative.discovery.lead")}
                    <Highlight tooltip={t("neuralNetworkNarrative.narratorTooltips.learning")}>{t("neuralNetworkNarrative.discovery.leadHighlight")}</Highlight>
                    {t("neuralNetworkNarrative.discovery.leadEnd")}
                </Lead>

                {/* Bridge from N-gram chapter */}
                <P>{t("neuralNetworkNarrative.discovery.bigramBridge")}</P>
                <P>{t("neuralNetworkNarrative.discovery.bigramQuestion")}</P>

                {/* Counting vs Learning comparison table */}
                <div className="my-8 rounded-2xl border border-white/[0.08] bg-[var(--lab-viz-bg)] overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                            {t("neuralNetworkNarrative.discovery.countingVsLearning.title")}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
                        <div className="px-4 py-3 bg-rose-500/[0.02]">
                            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-400/60 mb-3">
                                {t("neuralNetworkNarrative.discovery.countingVsLearning.countingCol")}
                            </p>
                        </div>
                        <div className="px-4 py-3 bg-emerald-500/[0.02]">
                            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400/60 mb-3">
                                {t("neuralNetworkNarrative.discovery.countingVsLearning.learningCol")}
                            </p>
                        </div>
                    </div>
                    {(["row1", "row2", "row3", "row4"] as const).map((row) => (
                        <div key={row} className="grid grid-cols-2 divide-x divide-white/[0.06] border-t border-white/[0.04]">
                            <div className="px-4 py-3">
                                <p className="text-[10px] font-mono text-white/30 mb-1">
                                    {t(`neuralNetworkNarrative.discovery.countingVsLearning.${row}Label`)}
                                </p>
                                <p className="text-xs text-rose-300/60 leading-relaxed">
                                    {t(`neuralNetworkNarrative.discovery.countingVsLearning.${row}Counting`)}
                                </p>
                            </div>
                            <div className="px-4 py-3">
                                <p className="text-[10px] font-mono text-white/30 mb-1">
                                    {t(`neuralNetworkNarrative.discovery.countingVsLearning.${row}Label`)}
                                </p>
                                <p className="text-xs text-emerald-300/60 leading-relaxed">
                                    {t(`neuralNetworkNarrative.discovery.countingVsLearning.${row}Learning`)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Part A: Build the recipe step by step */}
                <P>
                    {t("neuralNetworkNarrative.discovery.hookP1")}
                    <Highlight tooltip={t("neuralNetworkNarrative.narratorTooltips.weights")}>{t("neuralNetworkNarrative.discovery.hookP1Highlight")}</Highlight>
                    {t("neuralNetworkNarrative.discovery.hookP1End")}
                </P>

                <P>{t("neuralNetworkNarrative.discovery.hookP2")}</P>

                <Callout icon={Lightbulb} accent="indigo" title={t("neuralNetworkNarrative.discovery.inputsFixedTitle")}>
                    <p>{t("neuralNetworkNarrative.discovery.inputsFixed")}</p>
                </Callout>

                <P>{t("neuralNetworkNarrative.discovery.p1")}</P>

                <p className="text-[15px] md:text-base text-[var(--lab-text-muted)] leading-[1.9] mb-5 italic">
                    {t("neuralNetworkNarrative.discovery.predict1")}
                </p>

                <LazySection>
                    <FigureWrapper
                        label={t("neuralNetworkNarrative.discovery.fig1Label")}
                        hint={t("neuralNetworkNarrative.discovery.fig1Hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><OperationExplorer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("neuralNetworkNarrative.discovery.p2")}</P>

                <p className="text-[15px] md:text-base text-[var(--lab-text-muted)] leading-[1.9] mb-5 italic">
                    {t("neuralNetworkNarrative.discovery.predict2")}
                </p>

                <LazySection>
                    <VisualizerFrame
                        family="neuron"
                        label={t("neuralNetworkNarrative.discovery.fig2Label")}
                        hint={t("neuralNetworkNarrative.discovery.fig2Hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><WeightSliderDemo /></Suspense>
                    </VisualizerFrame>
                </LazySection>

                <P>{t("neuralNetworkNarrative.discovery.p3")}</P>

                <Challenge
                    question={t("neuralNetworkNarrative.discovery.challenge2.question")}
                    hint={t("neuralNetworkNarrative.discovery.challenge2.hint")}
                    successMessage={t("neuralNetworkNarrative.discovery.challenge2.success")}
                />

                <P>{t("neuralNetworkNarrative.discovery.p4")}</P>

                <p className="text-[15px] md:text-base text-[var(--lab-text-muted)] leading-[1.9] mb-5 italic">
                    {t("neuralNetworkNarrative.discovery.predict3")}
                </p>

                <LazySection>
                    <FigureWrapper
                        label={t("neuralNetworkNarrative.discovery.fig3Label")}
                        hint={t("neuralNetworkNarrative.discovery.fig3Hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><BiasDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <Callout accent="rose" title={t("neuralNetworkNarrative.discovery.calloutTitle")}>
                    <p>{t("neuralNetworkNarrative.discovery.calloutText")}</p>
                </Callout>

                <P>{t("neuralNetworkNarrative.discovery.bridge")}</P>

                <KeyTakeaway accent="rose">
                    A <Term word="neuron">neuron</Term> takes inputs, multiplies each by a <Term word="weight">weight</Term>, adds a <Term word="bias">bias</Term>, and outputs a number. These three ingredients are all you need to start learning.
                </KeyTakeaway>
            </Section>

            <SectionBreak />

            {/* ─────────── 02 · PUTTING IT TOGETHER ─────────── */}
            <Section id="nn-02">
                <SectionLabel
                    number={t("models.neuralNetworks.sections.artificialNeuron.number")}
                    label={t("models.neuralNetworks.sections.artificialNeuron.label")}
                />
                <SectionAnchor id="nn-02"><Heading>{t("neuralNetworkNarrative.artificialNeuron.title")}</Heading></SectionAnchor>

                <Lead>{t("neuralNetworkNarrative.artificialNeuron.lead")}</Lead>

                <P>{t("neuralNetworkNarrative.artificialNeuron.p1")}</P>

                <p className="text-[15px] md:text-base text-[var(--lab-text-muted)] leading-[1.9] mb-5 italic">
                    {t("neuralNetworkNarrative.artificialNeuron.predict4")}
                </p>

                <LazySection>
                    <FigureWrapper
                        label={t("neuralNetworkNarrative.artificialNeuron.perceptronLabel")}
                        hint={t("neuralNetworkNarrative.artificialNeuron.perceptronHint")}
                        accent="rose"
                    >
                        <Suspense fallback={<SectionSkeleton />}><NNPerceptronDiagram /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* Biological vs Artificial Neuron — side-by-side SVG diagrams */}
                <HiddenSection
                    category="historical"
                    difficulty={1}
                    title={t("neuralNetworkNarrative.artificialNeuron.biological.title")}
                    description={t("neuralNetworkNarrative.artificialNeuron.biological.subtitle")}
                >
                    <p className="text-sm text-white/40 leading-relaxed mb-4">
                        {t("neuralNetworkNarrative.bioVsArtificial.intro")}
                    </p>
                    <Suspense fallback={<SectionSkeleton />}><BiologicalVsArtificialDiagram /></Suspense>
                    <p className="text-xs text-white/30 italic border-t border-white/[0.06] pt-3 mt-4">
                        {t("neuralNetworkNarrative.artificialNeuron.biological.caveat")}
                    </p>
                </HiddenSection>

                <P>{t("neuralNetworkNarrative.artificialNeuron.p2")}</P>

                <P>
                    {t("neuralNetworkNarrative.artificialNeuron.p3")}{" "}
                    <Highlight tooltip={t("neuralNetworkNarrative.narratorTooltips.activation")}>{t("neuralNetworkNarrative.artificialNeuron.p3Highlight")}</Highlight>
                    {t("neuralNetworkNarrative.artificialNeuron.p3End")}
                </P>

                <Callout icon={Lightbulb} accent="indigo" title={t("neuralNetworkNarrative.artificialNeuron.calloutTitle")}>
                    <p>{t("neuralNetworkNarrative.artificialNeuron.calloutText")}</p>
                </Callout>

                <P>{t("neuralNetworkNarrative.artificialNeuron.formalizeParagraph")}</P>

                <FormulaBlock
                    formula="y = f\left(\sum_{i=1}^{n} w_i \, x_i + b\right)"
                    caption={t("neuralNetworkNarrative.artificialNeuron.formulaCaptionMoved")}
                />

                {/* ─────────── COLLAPSIBLE HISTORY SIDEBAR ─────────── */}
                <HistorySidebar t={t} />

                <P>{t("neuralNetworkNarrative.artificialNeuron.bridgeToScaling")}</P>
            </Section>

            <SectionBreak />

            {/* ─────────── 03 · WHAT IF WE ADD MORE NEURONS? ─────────── */}
            <Section id="nn-03">
                <SectionLabel
                    number={t("models.neuralNetworks.sections.nonLinearity.number")}
                    label={t("models.neuralNetworks.sections.nonLinearity.label")}
                />
                <SectionAnchor id="nn-03"><Heading>{t("neuralNetworkNarrative.nonLinearity.title")}</Heading></SectionAnchor>

                <Lead>{t("neuralNetworkNarrative.nonLinearity.lead")}</Lead>

                {/* Phase A: Parallel neurons — width */}
                <P>{t("neuralNetworkNarrative.nonLinearity.parallelIntro")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("neuralNetworkNarrative.parallelNeurons.title")}
                        hint={t("neuralNetworkNarrative.parallelNeurons.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><ParallelNeuronsDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("neuralNetworkNarrative.nonLinearity.parallelOutro")}</P>

                {/* "Why a line?" — 1 neuron = 1 yes/no question (idea #2 + improvement E) */}
                <P>{t("neuralNetworkNarrative.nonLinearity.whyALine")}</P>
                <P>{t("neuralNetworkNarrative.nonLinearity.whyALineDetail")}</P>

                {/* Phase B: Decision boundaries */}
                <P>{t("neuralNetworkNarrative.nonLinearity.boundaryIntro")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("neuralNetworkNarrative.decisionBoundary.title")}
                        hint={t("neuralNetworkNarrative.decisionBoundary.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><DecisionBoundaryIntro /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("neuralNetworkNarrative.nonLinearity.boundaryOutro")}</P>

                {/* XOR Challenge — immediately after Decision Boundary (idea #3) */}
                <Challenge
                    question={t("neuralNetworkNarrative.nonLinearity.xorChallenge.question")}
                    hint={t("neuralNetworkNarrative.nonLinearity.xorChallenge.hint")}
                    successMessage={t("neuralNetworkNarrative.nonLinearity.xorChallenge.success")}
                />

                {/* ★ PEAK 2 */}
                <p className="text-center text-lg md:text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-pink-200 to-rose-300 my-10 italic">
                    {t("neuralNetworkNarrative.nonLinearity.peak2")}
                </p>

                {/* Reflection 1 */}
                <p className="text-center text-sm text-white/30 italic my-6">
                    {t("neuralNetworkNarrative.nonLinearity.reflection1")}
                </p>

                {/* Phase C: Depth motivation — from XOR failure */}
                <P>{t("neuralNetworkNarrative.nonLinearity.layerIntro")}</P>

                {/* Phase D: Linear collapse */}
                <P>
                    {t("neuralNetworkNarrative.nonLinearity.linearProblem")}
                    <Highlight color="amber" tooltip={t("neuralNetworkNarrative.narratorTooltips.nonLinearity")}>{t("neuralNetworkNarrative.nonLinearity.linearProblemHighlight")}</Highlight>
                    {t("neuralNetworkNarrative.nonLinearity.linearProblemEnd")}
                </P>

                <P>{t("neuralNetworkNarrative.nonLinearity.stackingIntro")}</P>

                <LazySection>
                    <VisualizerFrame
                        family="function"
                        label={t("neuralNetworkNarrative.nonLinearity.stackingLabel")}
                        hint={t("neuralNetworkNarrative.nonLinearity.stackingHint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><LinearStackingDemo /></Suspense>
                    </VisualizerFrame>
                </LazySection>

                <P>{t("neuralNetworkNarrative.nonLinearity.stackingOutro")}</P>

                {/* What If #1 — upgraded with matrix algebra (idea #5) */}
                <HiddenSection
                    category="math"
                    difficulty={2}
                    title={t("neuralNetworkNarrative.nonLinearity.whatIf1Title")}
                    description={t("neuralNetworkNarrative.nonLinearity.whatIf1Desc")}
                >
                    <p className="text-sm text-white/40 leading-relaxed mb-4">
                        {t("neuralNetworkNarrative.nonLinearity.whatIf1Text")}
                    </p>
                    <div className="rounded-xl bg-black/40 border border-indigo-500/10 p-4 mb-4">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-indigo-400/50 mb-3">
                            {t("neuralNetworkNarrative.nonLinearity.whatIf1MatrixLabel")}
                        </p>
                        <BlockMath math={String.raw`\underset{\text{Layer 2}}{W_2} \cdot \underset{\text{Layer 1}}{W_1} = \underset{\text{Single equivalent}}{W_3}`} />
                        <BlockMath math={String.raw`\begin{bmatrix} a & b \\ c & d \end{bmatrix} \cdot \begin{bmatrix} e & f \\ g & h \end{bmatrix} = \begin{bmatrix} ae+bg & af+bh \\ ce+dg & cf+dh \end{bmatrix}`} />
                    </div>
                    <p className="text-sm text-white/40 leading-relaxed">
                        {t("neuralNetworkNarrative.nonLinearity.whatIf1Conclusion")}
                    </p>
                </HiddenSection>

                {/* Phase E: Activation functions — the fix */}
                <P>{t("neuralNetworkNarrative.nonLinearity.activationIntro")}</P>

                <LazySection>
                    <VisualizerFrame
                        family="function"
                        label={t("neuralNetworkNarrative.nonLinearity.activationLabel")}
                        hint={t("neuralNetworkNarrative.nonLinearity.activationHint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><NNActivationExplorer /></Suspense>
                    </VisualizerFrame>
                </LazySection>

                <P>
                    {t("neuralNetworkNarrative.nonLinearity.p3")}{" "}
                    <Highlight color="indigo" tooltip={t("neuralNetworkNarrative.narratorTooltips.relu")}>{t("neuralNetworkNarrative.nonLinearity.p3Highlight")}</Highlight>{" "}
                    {t("neuralNetworkNarrative.nonLinearity.p3End")}
                </P>

                {/* XOR Solver Demo — activation + 2 neurons solves XOR (idea #6.5) */}
                <P>{t("neuralNetworkNarrative.nonLinearity.xorSolverIntro")}</P>

                <LazySection>
                    <VisualizerFrame
                        family="neuron"
                        label={t("neuralNetworkNarrative.xorSolver.title")}
                        hint={t("neuralNetworkNarrative.xorSolver.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><XORSolverDemo /></Suspense>
                    </VisualizerFrame>
                </LazySection>

                <P>{t("neuralNetworkNarrative.nonLinearity.xorSolverOutro")}</P>

                <Callout icon={Layers} accent="rose" title={t("neuralNetworkNarrative.nonLinearity.summaryCalloutTitle")}>
                    <p>{t("neuralNetworkNarrative.nonLinearity.summaryCalloutText")}</p>
                </Callout>

                {/* Toy Vowel Teaser — visual promise for §07 */}
                <LazySection>
                    <VisualizerFrame
                        family="neuron"
                        label={t("neuralNetworkNarrative.vowelTeaser.title")}
                        hint={t("neuralNetworkNarrative.vowelTeaser.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><ToyVowelTeaser /></Suspense>
                    </VisualizerFrame>
                </LazySection>
            </Section>

            <SectionBreak />

            {/* ─────────── 04 · CAN WE FIX A BAD PREDICTION? ─────────── */}
            <Section id="nn-04">
                <SectionLabel
                    number={t("models.neuralNetworks.sections.findingDirection.number")}
                    label={t("models.neuralNetworks.sections.findingDirection.label")}
                />
                <SectionAnchor id="nn-04"><Heading>{t("neuralNetworkNarrative.findingDirection.title")}</Heading></SectionAnchor>

                <Lead>{t("neuralNetworkNarrative.findingDirection.lead")}</Lead>

                {/* Phase A: The Hook — model is wrong */}
                <P>{t("neuralNetworkNarrative.howItLearns.phaseA.p1")}</P>
                <P>{t("neuralNetworkNarrative.howItLearns.phaseA.p2")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("neuralNetworkNarrative.howItLearns.predictionError.title")}
                        hint={t("neuralNetworkNarrative.howItLearns.phaseA.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><PredictionErrorDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* ★ PEAK 3 */}
                <p className="text-center text-lg md:text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-violet-200 to-indigo-300 my-10 italic">
                    {t("neuralNetworkNarrative.findingDirection.peak3")}
                </p>

                {/* Phase B: Nudge — what if we change a weight? */}
                <P>{t("neuralNetworkNarrative.howItLearns.phaseB.intro")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("neuralNetworkNarrative.howItLearns.nudge.title")}
                        hint={t("neuralNetworkNarrative.howItLearns.phaseB.nudgeHint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><NudgeWeightDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("neuralNetworkNarrative.howItLearns.phaseB.discovery")}</P>

                {/* Phase C: The Derivative — measuring sensitivity */}
                <P>{t("neuralNetworkNarrative.howItLearns.phaseC.intro")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("neuralNetworkNarrative.howItLearns.derivative.title")}
                        hint={t("neuralNetworkNarrative.howItLearns.phaseC.derivativeHint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><DerivativeIntuitionDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("neuralNetworkNarrative.howItLearns.phaseC.nameIt")}</P>

                {/* Phase D: Chain Rule — chained operations */}
                <P>{t("neuralNetworkNarrative.howItLearns.phaseD.intro")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("neuralNetworkNarrative.howItLearns.chainRule.title")}
                        hint={t("neuralNetworkNarrative.howItLearns.phaseD.chainHint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><ChainRuleBuilder /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("neuralNetworkNarrative.howItLearns.phaseD.nameIt")}</P>

                {/* Reflection 2 */}
                <p className="text-center text-sm text-white/30 italic my-6">
                    {t("neuralNetworkNarrative.findingDirection.reflection2")}
                </p>
            </Section>

            <SectionBreak />

            {/* ─────────── 05 · MAKING IT LEARN ─────────── */}
            <Section id="nn-05">
                <SectionLabel
                    number={t("models.neuralNetworks.sections.makingItLearn.number")}
                    label={t("models.neuralNetworks.sections.makingItLearn.label")}
                />
                <SectionAnchor id="nn-05"><Heading>{t("neuralNetworkNarrative.makingItLearn.title")}</Heading></SectionAnchor>

                <Lead>{t("neuralNetworkNarrative.makingItLearn.lead")}</Lead>

                {/* Phase F FIRST: Loss — error → squaring → loss defined (ideas #12, #13) */}
                <P>{t("neuralNetworkNarrative.howItLearns.phaseF.intro")}</P>

                <HiddenSection
                    category="math"
                    difficulty={2}
                    title={t("neuralNetworkNarrative.howItLearns.lossMotive.title")}
                    description={t("neuralNetworkNarrative.howItLearns.phaseF.lossHint")}
                >
                    <Suspense fallback={<SectionSkeleton />}><LossFormulaMotivation /></Suspense>
                </HiddenSection>

                <P>{t("neuralNetworkNarrative.howItLearns.phaseF.named")}</P>

                {/* Weight Impact — neuron-based diagram showing how Δw → Δloss */}
                <P>{t("neuralNetworkNarrative.weightImpact.introText")}</P>

                <LazySection>
                    <VisualizerFrame
                        family="neuron"
                        label={t("neuralNetworkNarrative.weightImpact.title")}
                        hint={t("neuralNetworkNarrative.weightImpact.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><WeightImpactVisualizer /></Suspense>
                    </VisualizerFrame>
                </LazySection>

                <P>{t("neuralNetworkNarrative.weightImpact.bridge")}</P>

                {/* Loss Derivative — now shown as a graph after user understands the concept */}
                <P>{t("neuralNetworkNarrative.lossDerivative.introText")}</P>

                <LazySection>
                    <VisualizerFrame
                        family="function"
                        label={t("neuralNetworkNarrative.lossDerivative.title")}
                        hint={t("neuralNetworkNarrative.lossDerivative.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><LossDerivativeVisualizer /></Suspense>
                    </VisualizerFrame>
                </LazySection>

                {/* Phase E SECOND: Direction — now makes sense: minimize the loss you just defined */}
                <P>{t("neuralNetworkNarrative.howItLearns.phaseE.intro")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("neuralNetworkNarrative.howItLearns.parabola.title")}
                        hint={t("neuralNetworkNarrative.howItLearns.parabola.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><LossWeightParabolaVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("neuralNetworkNarrative.howItLearns.phaseE.rule")}</P>

                {/* Phase G: One Training Step */}
                <P>{t("neuralNetworkNarrative.howItLearns.phaseG.intro")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("neuralNetworkNarrative.howItLearns.neuronCalc.title")}
                        hint={t("neuralNetworkNarrative.howItLearns.phaseG.calcHint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><NeuronGradientCalculator /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* Gradient explanation (idea #14) */}
                <P>{t("neuralNetworkNarrative.howItLearns.gradientMeaning")}</P>

                {/* Naming callout */}
                <P>{t("neuralNetworkNarrative.howItLearns.namingTransition")}</P>

                <Callout accent="rose" title={t("neuralNetworkNarrative.howItLearns.naming.title")}>
                    <p>{t("neuralNetworkNarrative.howItLearns.naming.text")}</p>
                </Callout>

                {/* ★ PEAK 4 */}
                <p className="text-center text-lg md:text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 my-10 italic">
                    {t("neuralNetworkNarrative.makingItLearn.peak4")}
                </p>

                {/* Worked Example Expandable */}
                <HiddenSection
                    category="supplementary"
                    difficulty={2}
                    title={t("neuralNetworkNarrative.howItLearns.workedExample.title")}
                    description={t("neuralNetworkNarrative.howItLearns.workedExample.intro")}
                >
                    <p className="text-sm text-white/50 leading-relaxed mb-3">{t("neuralNetworkNarrative.howItLearns.workedExample.intro")}</p>
                    {(["step1", "step2", "step3", "step4", "step5"] as const).map((step) => (
                        <div key={step} className="mb-3 border-l-2 border-indigo-500/20 pl-3">
                            <p className="text-xs font-semibold text-white/60 mb-1">{t(`neuralNetworkNarrative.howItLearns.workedExample.${step}Title`)}</p>
                            <p className="text-xs text-white/40">{t(`neuralNetworkNarrative.howItLearns.workedExample.${step}Text`)}</p>
                        </div>
                    ))}
                    <p className="text-xs text-white/30 italic border-t border-white/[0.06] pt-3">
                        {t("neuralNetworkNarrative.howItLearns.workedUpdateNote")}
                    </p>
                </HiddenSection>

                {/* Divergence Demo — what happens without learning rate (idea #16) */}
                <P>{t("neuralNetworkNarrative.training.divergenceIntro")}</P>

                <LazySection>
                    <VisualizerFrame
                        family="dashboard"
                        label={t("neuralNetworkNarrative.divergence.title")}
                        hint={t("neuralNetworkNarrative.divergence.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><DivergenceDemo /></Suspense>
                    </VisualizerFrame>
                </LazySection>

                {/* Phase H: Repeated training */}
                <P>{t("neuralNetworkNarrative.training.repeatedIntro")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("neuralNetworkNarrative.howItLearns.repeated.title")}
                        hint={t("neuralNetworkNarrative.howItLearns.phaseH.repeatHint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><RepeatedTrainingDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* Rephrased challenge (idea #15) */}
                <Challenge
                    question={t("neuralNetworkNarrative.training.repeatedChallenge.question")}
                    hint={t("neuralNetworkNarrative.training.repeatedChallenge.hint")}
                    successMessage={t("neuralNetworkNarrative.training.repeatedChallenge.success")}
                />

                {/* ★ PEAK 5 */}
                <p className="text-center text-lg md:text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-green-200 to-emerald-300 my-10 italic">
                    {t("neuralNetworkNarrative.makingItLearn.peak5")}
                </p>

                {/* Phase I: Learning Rate */}
                <P>{t("neuralNetworkNarrative.training.lrIntro")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("neuralNetworkNarrative.howItLearns.phaseI.lrLabel")}
                        hint={t("neuralNetworkNarrative.howItLearns.phaseI.lrHint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><LearningRateDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <Challenge
                    question={t("neuralNetworkNarrative.training.lrChallenge.question")}
                    hint={t("neuralNetworkNarrative.training.lrChallenge.hint")}
                    successMessage={t("neuralNetworkNarrative.training.lrChallenge.success")}
                />

                {/* LR Overshoot — see the ball bounce on the loss bowl */}
                <P>{t("neuralNetworkNarrative.training.overshootIntro")}</P>

                <LazySection>
                    <VisualizerFrame
                        family="dashboard"
                        label={t("neuralNetworkNarrative.lrOvershoot.title")}
                        hint={t("neuralNetworkNarrative.lrOvershoot.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><LROvershootVisualizer /></Suspense>
                    </VisualizerFrame>
                </LazySection>

                {/* What If #3 */}
                <HiddenSection
                    category="math"
                    difficulty={1}
                    title={t("neuralNetworkNarrative.makingItLearn.whatIf3Title")}
                    description={t("neuralNetworkNarrative.makingItLearn.whatIf3Text")}
                >
                    <p className="text-sm text-white/40 leading-relaxed">
                        {t("neuralNetworkNarrative.makingItLearn.whatIf3Text")}
                    </p>
                </HiddenSection>

                {/* Phase J: Weight Landscape */}
                <P>{t("neuralNetworkNarrative.training.trajectoryIntro")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("neuralNetworkNarrative.howItLearns.phaseJ.trajectoryLabel")}
                        hint={t("neuralNetworkNarrative.howItLearns.phaseJ.trajectoryHint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><WeightTrajectoryDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* Activation Derivative — advanced expandable (MOVED from §03, idea #7) */}
                <HiddenSection
                    category="advanced"
                    difficulty={2}
                    title={t("neuralNetworkNarrative.activationDeriv.expandableTitle")}
                    description={t("neuralNetworkNarrative.activationDeriv.hint")}
                >
                    <VisualizerFrame
                        family="function"
                        label={t("neuralNetworkNarrative.activationDeriv.title")}
                        hint={t("neuralNetworkNarrative.activationDeriv.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><ActivationDerivativeVisualizer /></Suspense>
                    </VisualizerFrame>
                </HiddenSection>

                {/* Dead Neuron Demo (MOVED from §03, idea #7) */}
                <P>{t("neuralNetworkNarrative.nonLinearity.deadNeuronIntro")}</P>

                <VisualizerFrame
                    family="neuron"
                    label={t("neuralNetworkNarrative.deadNeuron.title")}
                    hint={t("neuralNetworkNarrative.deadNeuron.hint")}
                >
                    <Suspense fallback={<SectionSkeleton />}><DeadNeuronDemo /></Suspense>
                </VisualizerFrame>

                {/* What If #2 — derivative = 0 (MOVED from §04, idea #11) — EXPANDED */}
                <HiddenSection
                    category="advanced"
                    difficulty={2}
                    title={t("neuralNetworkNarrative.flatGradient.title")}
                    description={t("neuralNetworkNarrative.flatGradient.desc")}
                >
                    <p className="text-sm text-white/40 leading-relaxed mb-4">
                        {t("neuralNetworkNarrative.flatGradient.intro")}
                    </p>
                    <VisualizerFrame
                        family="function"
                        label={t("neuralNetworkNarrative.flatGradient.vizTitle")}
                        hint={t("neuralNetworkNarrative.flatGradient.vizHint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><FlatGradientVisualizer /></Suspense>
                    </VisualizerFrame>

                    <p className="text-sm text-white/40 leading-relaxed my-4">
                        {t("neuralNetworkNarrative.backpropZero.intro")}
                    </p>

                    <VisualizerFrame
                        family="neuron"
                        label={t("neuralNetworkNarrative.backpropZero.title")}
                        hint={t("neuralNetworkNarrative.backpropZero.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><BackpropZeroDemo /></Suspense>
                    </VisualizerFrame>

                    <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                        <p className="text-[10px] font-mono text-white/25 mb-2 uppercase tracking-wider">
                            {t("neuralNetworkNarrative.flatGradient.mathTitle")}
                        </p>
                        <div className="text-center overflow-x-auto mb-2">
                            <BlockMath math="\sigma'(z) = \sigma(z)(1 - \sigma(z))" />
                        </div>
                        <p className="text-[11px] text-white/30 leading-relaxed">
                            {t("neuralNetworkNarrative.flatGradient.mathExplain")}
                        </p>
                    </div>
                    <p className="text-xs text-white/30 italic mt-3">
                        {t("neuralNetworkNarrative.flatGradient.solution")}
                    </p>
                </HiddenSection>

                {/* Reflection 3 */}
                <p className="text-center text-sm text-white/30 italic my-6">
                    {t("neuralNetworkNarrative.makingItLearn.reflection3")}
                </p>

                <KeyTakeaway accent="rose">
                    <Term word="gradient descent">Gradient descent</Term> is how neural networks learn: measure the <Term word="loss">loss</Term>, compute the <Term word="gradient">gradient</Term>, and nudge each <Term word="weight">weight</Term> in the direction that reduces error. Repeat thousands of times.
                </KeyTakeaway>
            </Section>

            <SectionBreak />

            {/* ─────────── 06 · TRAINING AT SCALE ─────────── */}
            <Section id="nn-06">
                <SectionLabel
                    number={t("models.neuralNetworks.sections.trainingAtScale.number")}
                    label={t("models.neuralNetworks.sections.trainingAtScale.label")}
                />
                <SectionAnchor id="nn-06"><Heading>{t("neuralNetworkNarrative.trainingAtScale.title")}</Heading></SectionAnchor>

                <Lead>{t("neuralNetworkNarrative.trainingAtScale.lead")}</Lead>

                {/* Terminology block — Step + Epoch + Batch */}
                <P>{t("neuralNetworkNarrative.training.terminologyIntro")}</P>

                <div className="my-8 rounded-2xl border border-indigo-500/[0.15] bg-indigo-500/[0.02] p-5 sm:p-6 space-y-4">
                    <div className="flex items-start gap-3">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400 mt-0.5">S</span>
                        <div>
                            <p className="text-sm font-semibold text-white/70 mb-1">
                                <Highlight color="indigo" tooltip={t("neuralNetworkNarrative.narratorTooltips.step")}>{t("neuralNetworkNarrative.watchingItLearn.termStep")}</Highlight>
                            </p>
                            <p className="text-xs text-white/40">{t("neuralNetworkNarrative.watchingItLearn.termStepDesc")}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400 mt-0.5">E</span>
                        <div>
                            <p className="text-sm font-semibold text-white/70 mb-1">
                                <Highlight color="indigo" tooltip={t("neuralNetworkNarrative.narratorTooltips.epoch")}>{t("neuralNetworkNarrative.watchingItLearn.termEpoch")}</Highlight>
                            </p>
                            <p className="text-xs text-white/40">{t("neuralNetworkNarrative.watchingItLearn.termEpochDesc")}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400 mt-0.5">B</span>
                        <div>
                            <p className="text-sm font-semibold text-white/70 mb-1">
                                <Highlight color="indigo" tooltip={t("neuralNetworkNarrative.narratorTooltips.batch")}>{t("neuralNetworkNarrative.watchingItLearn.termBatch")}</Highlight>
                            </p>
                            <p className="text-xs text-white/40">{t("neuralNetworkNarrative.watchingItLearn.termBatchDesc")}</p>
                        </div>
                    </div>
                </div>

                <LazySection>
                    <VisualizerFrame
                        family="dashboard"
                        label={t("neuralNetworkNarrative.stepEpochBatch.title")}
                        hint={t("neuralNetworkNarrative.stepEpochBatch.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><StepEpochBatchCounter /></Suspense>
                    </VisualizerFrame>
                </LazySection>

                {/* Batching section (previously unrendered) */}
                <P>{t("neuralNetworkNarrative.howItLearns.batchingTransition")}</P>
                <P>{t("neuralNetworkNarrative.howItLearns.batching.p1")}</P>
                <P>{t("neuralNetworkNarrative.howItLearns.batching.p2")}</P>

                <Callout icon={Lightbulb} accent="emerald" title={t("neuralNetworkNarrative.howItLearns.batching.calloutTitle")}>
                    <p>{t("neuralNetworkNarrative.howItLearns.batching.calloutText")}</p>
                </Callout>

                <P>{t("neuralNetworkNarrative.howItLearns.batching.conclusion")}</P>

                <LazySection>
                    <VisualizerFrame
                        family="function"
                        label={t("neuralNetworkNarrative.gradientNoise.title")}
                        hint={t("neuralNetworkNarrative.gradientNoise.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><GradientNoiseVisualizer /></Suspense>
                    </VisualizerFrame>
                </LazySection>

                {/* Batch size comparison — single example vs batch */}
                <P>{t("neuralNetworkNarrative.batchComparison.introText")}</P>

                <LazySection>
                    <VisualizerFrame
                        family="dashboard"
                        label={t("neuralNetworkNarrative.batchComparison.title")}
                        hint={t("neuralNetworkNarrative.batchComparison.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><BatchSizeComparisonVisualizer /></Suspense>
                    </VisualizerFrame>
                </LazySection>

                <P>{t("neuralNetworkNarrative.batchComparison.outroText")}</P>

                {/* Live training demo + loss landscape */}
                <P>{t("neuralNetworkNarrative.training.liveIntro")}</P>

                <P>{t("neuralNetworkNarrative.training.liveP1")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("neuralNetworkNarrative.training.liveDemoLabel")}
                        hint={t("neuralNetworkNarrative.training.liveDemoHint")}
                        accent="amber"
                    >
                        <Suspense fallback={<SectionSkeleton />}><NNTrainingDemo onHistoryChange={handleTrainingHistory} /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {landscapeHistory.length > 3 &&
                    landscapeHistory[landscapeHistory.length - 1].loss > landscapeHistory[0].loss && (
                        <Callout icon={AlertTriangle} accent="amber" title={t("neuralNetworkNarrative.watchingItLearn.alertTitle")}>
                            <p>{t("neuralNetworkNarrative.watchingItLearn.alertText")}</p>
                        </Callout>
                    )}

                {/* Training challenge: small batch can increase loss */}
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
                    <Suspense fallback={<SectionSkeleton />}><NNLossLandscape history={landscapeHistory} target={landscapeTarget} /></Suspense>
                )}

                {/* Matrix Multiply HiddenSection (idea #19) */}
                <HiddenSection
                    category="math"
                    difficulty={2}
                    title={t("neuralNetworkNarrative.matrixMultiply.title")}
                    description={t("neuralNetworkNarrative.matrixMultiply.desc")}
                >
                    <Suspense fallback={<SectionSkeleton />}><MatrixMultiplyVisual /></Suspense>
                </HiddenSection>

                {/* Multi-neuron teaser */}
                <P>{t("neuralNetworkNarrative.trainingAtScale.multiNeuronTeaser")}</P>
                <P>{t("neuralNetworkNarrative.trainingAtScale.multiNeuronTeaser2")}</P>
            </Section>

            <SectionBreak />

            {/* ─────────── 07 · THE OVERFITTING TRAP ─────────── */}
            <Section id="nn-07">
                <SectionLabel
                    number={t("models.neuralNetworks.sections.overfittingTrap.number")}
                    label={t("models.neuralNetworks.sections.overfittingTrap.label")}
                />
                <SectionAnchor id="nn-07"><Heading>{t("neuralNetworkNarrative.overfitting.heading")}</Heading></SectionAnchor>

                <Lead>{t("neuralNetworkNarrative.overfitting.lead")}</Lead>

                <LazySection>
                    <VisualizerFrame
                        family="dashboard"
                        label={t("neuralNetworkNarrative.overfittingPlay.title")}
                        hint={t("neuralNetworkNarrative.overfittingPlay.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><OverfittingPlayground /></Suspense>
                    </VisualizerFrame>
                </LazySection>

                <P>{t("neuralNetworkNarrative.overfitting.p1")}</P>
                <P>{t("neuralNetworkNarrative.overfitting.p2")}</P>

                {/* Train/Val Split Visualizer (idea #24) */}
                <P>{t("neuralNetworkNarrative.overfitting.p3")}</P>

                <LazySection>
                    <VisualizerFrame
                        family="dashboard"
                        label={t("neuralNetworkNarrative.trainValSplit.title")}
                        hint={t("neuralNetworkNarrative.trainValSplit.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><TrainValSplitVisualizer /></Suspense>
                    </VisualizerFrame>
                </LazySection>

                <Callout icon={AlertTriangle} accent="amber" title={t("neuralNetworkNarrative.overfitting.callout1Title")}>
                    <p>{t("neuralNetworkNarrative.overfitting.callout1Text")}</p>
                </Callout>

                <LazySection>
                    <VisualizerFrame
                        family="comparison"
                        label={t("neuralNetworkNarrative.overfitting.visual1Label")}
                        hint={t("neuralNetworkNarrative.overfitting.visual1Hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><OverfittingComparisonDiagram /></Suspense>
                    </VisualizerFrame>
                </LazySection>

                <LazySection>
                    <VisualizerFrame
                        family="dashboard"
                        label={t("neuralNetworkNarrative.overfitting.visual2Label")}
                        hint={t("neuralNetworkNarrative.overfitting.visual2Hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><TrainValLossCurveVisualizer /></Suspense>
                    </VisualizerFrame>
                </LazySection>

                <P>{t("neuralNetworkNarrative.overfitting.p4")}</P>
                <P>{t("neuralNetworkNarrative.overfitting.p5")}</P>

                <Callout icon={Lightbulb} accent="emerald" title={t("neuralNetworkNarrative.overfitting.callout2Title")}>
                    <p>{t("neuralNetworkNarrative.overfitting.callout2Text")}</p>
                </Callout>

                {/* Reflection 4 */}
                <p className="text-center text-sm text-white/30 italic my-6">
                    {t("neuralNetworkNarrative.trainingAtScale.reflection4")}
                </p>

                <P>{t("neuralNetworkNarrative.overfitting.conclusion")}</P>

                <KeyTakeaway accent="rose">
                    <Term word="overfitting">Overfitting</Term> happens when a model memorizes training data instead of learning patterns. Split your data into train and validation sets, and watch the <Term word="validation loss">validation loss</Term> to know when to stop.
                </KeyTakeaway>

                {/* Supervised learning — improved with flow diagram */}
                <HiddenSection
                    category="supplementary"
                    difficulty={1}
                    title={t("neuralNetworkNarrative.training.supervisedTitle")}
                    description={t("neuralNetworkNarrative.training.supervisedDef")}
                >
                    {/* SVG flow: example → model → prediction → compare → update */}
                    <div className="rounded-xl bg-black/20 border border-white/[0.05] p-3 mb-4 overflow-x-auto">
                        <svg viewBox="0 0 340 64" className="w-full block" style={{ minWidth: 280 }}>
                            {/* Step boxes */}
                            {[
                                { x: 4, label: "Input", sub: "(x₁, x₂...)", col: "#38bdf8" },
                                { x: 84, label: "Model", sub: "(weights)", col: "#fb7185" },
                                { x: 164, label: "Prediction", sub: "ŷ", col: "#a78bfa" },
                                { x: 244, label: "True label", sub: "y", col: "#fbbf24" },
                            ].map(({ x, label, sub, col }) => (
                                <g key={label}>
                                    <rect x={x} y={8} width={72} height={36} rx={6}
                                        fill={col + "15"} stroke={col + "40"} strokeWidth={1} />
                                    <text x={x + 36} y={24} textAnchor="middle" fill={col}
                                        fontSize="8" fontFamily="monospace" fontWeight="bold">{label}</text>
                                    <text x={x + 36} y={36} textAnchor="middle" fill="rgba(255,255,255,0.3)"
                                        fontSize="7" fontFamily="monospace">{sub}</text>
                                </g>
                            ))}
                            {/* Arrows */}
                            {[76, 156, 236].map(ax => (
                                <g key={ax}>
                                    <line x1={ax} y1={26} x2={ax + 8} y2={26} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                                    <polygon points={`${ax + 8},23 ${ax + 8},29 ${ax + 12},26`} fill="rgba(255,255,255,0.2)" />
                                </g>
                            ))}
                            {/* Loss/compare arc */}
                            <path d="M280,26 Q310,26 310,50 Q310,58 258,58 Q200,58 200,50 Q200,44 244,44"
                                fill="none" stroke="#f43f5e60" strokeWidth="1" strokeDasharray="3 2" />
                            <text x={258} y={62} textAnchor="middle" fill="#f43f5e80"
                                fontSize="6.5" fontFamily="monospace">compare → loss → update weights</text>
                        </svg>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {([
                            { emoji: "\ud83d\uddbc\ufe0f", input: t("neuralNetworkNarrative.training.supervisedCard1Input"), output: t("neuralNetworkNarrative.training.supervisedCard1Output") },
                            { emoji: "\u2709\ufe0f", input: t("neuralNetworkNarrative.training.supervisedCard2Input"), output: t("neuralNetworkNarrative.training.supervisedCard2Output") },
                            { emoji: "\ud83e\ude7b", input: t("neuralNetworkNarrative.training.supervisedCard3Input"), output: t("neuralNetworkNarrative.training.supervisedCard3Output") },
                        ]).map(({ emoji, input, output }) => (
                            <div key={input} className="rounded-lg border border-rose-500/[0.08] bg-rose-500/[0.03] p-3 text-center">
                                <span className="text-xl block mb-1.5">{emoji}</span>
                                <p className="text-[9px] font-mono text-white/30 mb-0.5">{input}</p>
                                <p className="text-[10px] font-mono font-bold" style={{ color: '#fb7185cc' }}>→ {output}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-white/30 italic border-t border-white/[0.06] pt-3">
                        {t("neuralNetworkNarrative.training.supervisedNote")}
                    </p>
                </HiddenSection>
            </Section>

            <SectionBreak />

            {/* ─────────── 08 · FROM NUMBERS TO LETTERS ─────────── */}
            <Section id="nn-08">
                <SectionLabel
                    number={t("neuralNetworkNarrative.sections.fromNumbers.number")}
                    label={t("neuralNetworkNarrative.sections.fromNumbers.label")}
                />
                <SectionAnchor id="nn-08"><Heading>{t("neuralNetworkNarrative.fromNumbers.title")}</Heading></SectionAnchor>

                <Lead>{t("neuralNetworkNarrative.fromNumbers.lead")}</Lead>

                {/* Bigram callback (idea #27) */}
                <P>{t("neuralNetworkNarrative.fromNumbers.bigramCallback")}</P>

                {/* 1. ToyAlphabetPredictor — on-ramp */}
                <P>{t("neuralNetworkNarrative.fromNumbers.toyIntro")}</P>

                {/* Vowel pattern explanation — now after "let's start tiny" */}
                <P>{t("neuralNetworkNarrative.fromNumbers.vowelPatternIntro")}</P>

                <LazySection>
                    <VisualizerFrame
                        family="neuron"
                        label={t("neuralNetworkNarrative.toyPredictor.title")}
                        hint={t("neuralNetworkNarrative.toyPredictor.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><ToyAlphabetPredictor /></Suspense>
                    </VisualizerFrame>
                </LazySection>

                <P>{t("neuralNetworkNarrative.fromNumbers.toyOutro")}</P>

                {/* 2. LetterToNumberDemo — relocated from §01, with encoding caveat */}
                <P>{t("neuralNetworkNarrative.fromNumbers.encodingIntro")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("neuralNetworkNarrative.discovery.letterDemo.title")}
                        hint=""
                    >
                        <Suspense fallback={<SectionSkeleton />}><LetterToNumberDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <Callout accent="amber" title={t("neuralNetworkNarrative.fromNumbers.encodingCaveat.title")}>
                    <p>{t("neuralNetworkNarrative.fromNumbers.encodingCaveat.text")}</p>
                </Callout>

                {/* 3. TrainingWithTextDemo — keep */}
                <P>
                    {t("neuralNetworkNarrative.fromNumbers.trainingDataIntro")}
                    <Highlight tooltip={t("neuralNetworkNarrative.narratorTooltips.contextWindow")}>{t("neuralNetworkNarrative.fromNumbers.trainingDataIntroHighlight")}</Highlight>
                    {t("neuralNetworkNarrative.fromNumbers.trainingDataIntroEnd")}
                </P>

                <LazySection>
                    <FigureWrapper
                        label={t("neuralNetworkNarrative.training.textDemo.title")}
                        hint={t("neuralNetworkNarrative.watchingItLearn.textDemoHint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><TrainingWithTextDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* 4. OutputLayerNetworkVisualizer — keep */}
                <P>{t("neuralNetworkNarrative.fromNumbers.p1")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("neuralNetworkNarrative.fromNumbers.networkViz.label")}
                        hint={t("neuralNetworkNarrative.fromNumbers.networkViz.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><OutputLayerNetworkVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("neuralNetworkNarrative.fromNumbers.p2")}</P>

                {/* 5. SoftmaxTransformDemo — redesigned */}
                <LazySection>
                    <VisualizerFrame
                        family="function"
                        label={t("neuralNetworkNarrative.fromNumbers.softmax.title")}
                        hint={t("neuralNetworkNarrative.fromNumbers.softmaxHint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><SoftmaxTransformDemo /></Suspense>
                    </VisualizerFrame>
                </LazySection>

                {/* 5b. Cross-entropy bridge — moved from MLP §04 */}
                <P>{t("neuralNetworkNarrative.fromNumbers.crossEntropyBridge")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("neuralNetworkNarrative.fromNumbers.figLabelCECompare")}
                        hint={t("neuralNetworkNarrative.fromNumbers.figHintCECompare")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><SquaredVsCrossEntropy /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("neuralNetworkNarrative.fromNumbers.crossEntropyDeep")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("neuralNetworkNarrative.fromNumbers.figLabelCE")}
                        hint={t("neuralNetworkNarrative.fromNumbers.figHintCE")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><CrossEntropyVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("neuralNetworkNarrative.fromNumbers.crossEntropyOutro")}</P>

                <P>{t("neuralNetworkNarrative.fromNumbers.p3")}</P>

                <P>{t("neuralNetworkNarrative.fromNumbers.p4")}</P>

                {/* 6. NNBigramComparison — enhanced ★ PEAK 6 */}
                <LazySection>
                    <VisualizerFrame
                        family="comparison"
                        label={t("neuralNetworkNarrative.fromNumbers.comparisonLabel")}
                        hint={t("neuralNetworkNarrative.fromNumbers.comparisonHint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><NNBigramComparison /></Suspense>
                    </VisualizerFrame>
                </LazySection>

                <P>{t("neuralNetworkNarrative.fromNumbers.p5")}</P>

                <Callout accent="amber" title={t("neuralNetworkNarrative.fromNumbers.whyCalloutTitle")}>
                    <p>{t("neuralNetworkNarrative.fromNumbers.whyCalloutText")}</p>
                </Callout>

                {/* Softmax math HiddenSection — optional dry content before emotional peak */}
                <HiddenSection
                    category="math"
                    difficulty={2}
                    title={t("neuralNetworkNarrative.fromNumbers.softmaxMath.title")}
                    description={t("neuralNetworkNarrative.fromNumbers.softmaxMath.desc")}
                >
                    <p className="text-sm text-white/40 leading-relaxed mb-3">
                        {t("neuralNetworkNarrative.fromNumbers.softmaxMath.intro")}
                    </p>
                    <div className="text-center overflow-x-auto mb-3">
                        <BlockMath math="P(\text{next} = j \mid \text{prev} = i) = \frac{e^{W_{ij}}}{\sum_k e^{W_{ik}}}" />
                    </div>
                    <p className="text-xs text-white/30 leading-relaxed mb-3">
                        {t("neuralNetworkNarrative.fromNumbers.softmaxMath.explain")}
                    </p>
                    <div className="text-center overflow-x-auto mb-3">
                        <BlockMath math="\mathbf{W} \in \mathbb{R}^{27 \times 27}" />
                    </div>
                    <p className="text-xs text-white/30 italic">
                        {t("neuralNetworkNarrative.fromNumbers.softmaxMath.note")}
                    </p>
                </HiddenSection>

                {/* BeatTheMachineChallenge — emotional peak */}
                <P>{t("neuralNetworkNarrative.fromNumbers.challengeIntro")}</P>

                <LazySection>
                    <VisualizerFrame
                        family="dashboard"
                        label={t("neuralNetworkNarrative.beatMachine.title")}
                        hint={t("neuralNetworkNarrative.beatMachine.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><BeatTheMachineChallenge /></Suspense>
                    </VisualizerFrame>
                </LazySection>

                <P>{t("neuralNetworkNarrative.fromNumbers.p6")}</P>

                {/* ★ PEAK 6 — after the challenge for maximum impact */}
                <p className="text-center text-lg md:text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 my-10 italic">
                    {t("neuralNetworkNarrative.fromNumbers.peak6")}
                </p>

                <KeyTakeaway accent="rose">
                    A neural network with a single <Term word="layer">layer</Term> of weights can learn the same <Term word="bigram">bigram</Term> probabilities as counting — but with <Term word="softmax">softmax</Term> and <Term word="cross-entropy">cross-entropy loss</Term>, it&apos;s ready to scale to deeper architectures.
                </KeyTakeaway>
            </Section>

            <SectionBreak />

            {/* ─────────── 09 · HOW FAR CAN WE PUSH THIS? ─────────── */}
            <Section id="nn-09">
                <SectionLabel
                    number={t("neuralNetworkNarrative.sections.whatsNext.number")}
                    label={t("neuralNetworkNarrative.sections.whatsNext.label")}
                />
                <SectionAnchor id="nn-09"><Heading>{t("neuralNetworkNarrative.whatsNext.title")}</Heading></SectionAnchor>

                <Lead>{t("neuralNetworkNarrative.whatsNext.lead")}</Lead>

                {/* 1. Triumphant recap */}
                <P>{t("neuralNetworkNarrative.whatsNext.pRecap")}</P>

                <motion.p
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="text-center text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 my-10 italic"
                >
                    {t("neuralNetworkNarrative.whatsNext.pRecapPeak")}
                </motion.p>

                {/* 2. Proof it works */}
                <P>{t("neuralNetworkNarrative.whatsNext.pProof")}</P>

                {/* 3. The big question */}
                <P>{t("neuralNetworkNarrative.whatsNext.pBigQuestion")}</P>

                {/* 3b. Context window teaser — what if we could see more? */}
                <P>{t("neuralNetworkNarrative.whatsNext.pContextTeaser")}</P>

                <LazySection>
                    <VisualizerFrame
                        family="function"
                        label={t("neuralNetworkNarrative.whatsNext.figLabelContext")}
                        hint={t("neuralNetworkNarrative.whatsNext.figHintContext")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><ContextWindowTeaser /></Suspense>
                    </VisualizerFrame>
                </LazySection>

                {/* 4. Scaling tease */}
                <P>{t("neuralNetworkNarrative.whatsNext.pScalingTease")}</P>

                {/* 5. Model output teaser */}
                <P>{t("neuralNetworkNarrative.whatsNext.pTeaserIntro")}</P>

                <LazySection>
                    <VisualizerFrame
                        family="comparison"
                        label={t("neuralNetworkNarrative.whatsNext.figLabelTeaser")}
                        hint={t("neuralNetworkNarrative.whatsNext.figHintTeaser")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><ModelOutputTeaser /></Suspense>
                    </VisualizerFrame>
                </LazySection>

                {/* 6. Three forward-looking questions */}
                <P>{t("neuralNetworkNarrative.whatsNext.pQuestion")}</P>

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

                {/* 6b. Monster foreshadow */}
                <P>{t("neuralNetworkNarrative.whatsNext.pMonsterForeshadow")}</P>

                {/* 7. Aspirational closing */}
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
            </Section>

            {/* ───────────────── CTA ───────────────── */}
            <Section id="nn-cta">
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
            </Section>

            {/* ───────────────── CODA ───────────────── */}
            <FadeInView as="footer" className="mt-8 pt-12 border-t border-[var(--lab-border)] text-center">
                <p className="text-sm text-[var(--lab-text-subtle)] italic max-w-md mx-auto leading-relaxed mb-10">
                    {t("neuralNetworkNarrative.footer.text")}
                </p>
                <div className="flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[var(--lab-border)]">
                    <FlaskConical className="h-3 w-3" />
                    {t("neuralNetworkNarrative.footer.brand")}
                </div>
            </FadeInView>
        </article >
    );
}
