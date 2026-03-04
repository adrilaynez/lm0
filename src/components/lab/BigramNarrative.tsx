"use client";

import { lazy, Suspense, useState } from "react";
import Link from "next/link";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Beaker, BookOpen, ChevronDown, FlaskConical, History } from "lucide-react";

import { ContinueToast } from "@/components/lab/ContinueToast";
import { FadeInView } from "@/components/lab/FadeInView";
import { Term } from "@/components/lab/GlossaryTooltip";
import { KeyTakeaway } from "@/components/lab/KeyTakeaway";
import { LazySection, SectionSkeleton } from "@/components/lab/LazySection";
import { ModeToggle } from "@/components/lab/ModeToggle";
import { SectionAnchor } from "@/components/lab/SectionAnchor";
import { SectionProgressBar } from "@/components/lab/SectionProgressBar";
import { useLabMode } from "@/context/LabModeContext";
import { useProgressTracker } from "@/hooks/useProgressTracker";
import { useI18n } from "@/i18n/context";
import type { TrainingViz, TransitionMatrixViz } from "@/types/lmLab";

/* ─── Lazy-loaded interactive visualizers ─── */
const BigramMatrixBuilder = lazy(() => import("@/components/lab/BigramMatrixBuilder").then(m => ({ default: m.BigramMatrixBuilder })));
const ContextBlindnessDemo = lazy(() => import("@/components/lab/ContextBlindnessDemo").then(m => ({ default: m.ContextBlindnessDemo })));
const CorpusCountingIdea = lazy(() => import("@/components/lab/CorpusCountingIdea").then(m => ({ default: m.CorpusCountingIdea })));
const GenerationPlayground = lazy(() => import("@/components/lab/GenerationPlayground").then(m => ({ default: m.GenerationPlayground })));
const HeroAutoComplete = lazy(() => import("@/components/lab/HeroAutoComplete").then(m => ({ default: m.HeroAutoComplete })));

const NormalizationVisualizer = lazy(() => import("@/components/lab/NormalizationVisualizer").then(m => ({ default: m.NormalizationVisualizer })));
const PairHighlighter = lazy(() => import("@/components/lab/PairHighlighter").then(m => ({ default: m.PairHighlighter })));
const PredictionChallenge = lazy(() => import("@/components/lab/PredictionChallenge").then(m => ({ default: m.PredictionChallenge })));
const PredictionQueryVisualizer = lazy(() => import("@/components/lab/PredictionQueryVisualizer").then(m => ({ default: m.PredictionQueryVisualizer })));
const SamplingMechanismVisualizer = lazy(() => import("@/components/lab/SamplingMechanismVisualizer").then(m => ({ default: m.SamplingMechanismVisualizer })));
const StorageProblemVisualizer = lazy(() => import("@/components/lab/StorageProblemVisualizer").then(m => ({ default: m.StorageProblemVisualizer })));
const TinyMatrixExample = lazy(() => import("@/components/lab/TinyMatrixExample").then(m => ({ default: m.TinyMatrixExample })));
const TransitionMatrix = lazy(() => import("@/components/lab/TransitionMatrix").then(m => ({ default: m.TransitionMatrix })));

import {
    Callout as _Callout,
    Heading, Highlight as _Highlight,
    type HighlightColor,
    Lead, type NarrativeAccent,
    P, PullQuote as _PullQuote,
    Section, SectionBreak,
    SectionLabel as _SectionLabel,
} from "./narrative-primitives";

/* ─── Accent-bound wrappers ─── */
const NA: NarrativeAccent = "emerald";
const SectionLabel = (p: { number: string; label: string }) => <_SectionLabel accent={NA} {...p} />;
const Highlight = ({ color, ...p }: { children: React.ReactNode; color?: HighlightColor; tooltip?: string }) => <_Highlight color={color ?? NA} {...p} />;
const Callout = ({ accent, ...p }: Parameters<typeof _Callout>[0]) => <_Callout accent={accent ?? NA} {...p} />;
const PullQuote = ({ children }: { children: React.ReactNode }) => <_PullQuote accent={NA}>{children}</_PullQuote>;

function ExpandableSection({
    title,
    children,
    defaultOpen = false,
}: {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="my-10">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-3 text-left group mb-4"
                aria-expanded={open}
            >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <h3 className="text-lg font-bold text-[var(--lab-text)] flex-1 leading-snug">{title}</h3>
                <span className="shrink-0 text-[10px] font-mono uppercase tracking-widest text-[var(--lab-text-subtle)] group-hover:text-[var(--lab-text-muted)] transition-colors mr-1">
                    {open ? "collapse" : "expand"}
                </span>
                <motion.div
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                >
                    <ChevronDown className="w-4 h-4 text-[var(--lab-text-subtle)] group-hover:text-[var(--lab-text-muted)] transition-colors" />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.38, ease: [0.25, 0, 0, 1] }}
                        className="overflow-hidden"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function FigureWrapper({
    label,
    hint,
    showWindowDots = true,
    children,
}: {
    label: string;
    hint?: string;
    showWindowDots?: boolean;
    children: React.ReactNode;
}) {
    return (
        <FadeInView as="figure" className="my-12 md:my-16 -mx-4 sm:mx-0">
            <div className="rounded-2xl border border-[var(--lab-border)] bg-[var(--lab-card)] overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--lab-border)] bg-[var(--lab-card)]">
                    {showWindowDots && (
                        <div className="flex gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
                        </div>
                    )}
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
   Collapsible History Sidebar
   ───────────────────────────────────────────── */

function BigramHistorySidebar({ t }: { t: (key: string) => string }) {
    const [open, setOpen] = useState(false);

    const timelineEvents = [
        { year: "1913", color: "from-teal-400 to-cyan-400", label: "Markov Chains" },
        { year: "1948", color: "from-emerald-400 to-green-400", label: "Shannon's Bet" },
        { year: "1960s", color: "from-amber-400 to-orange-400", label: "First NLP" },
        { year: "2003", color: "from-rose-400 to-pink-400", label: "Neural LMs" },
    ];

    return (
        <aside className="my-12 rounded-2xl border border-emerald-500/20 overflow-hidden relative">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-4 px-6 py-5 text-left group transition-all duration-300 relative bg-gradient-to-br from-emerald-500/[0.08] via-teal-500/[0.04] to-emerald-500/[0.06] hover:from-emerald-500/[0.12] hover:via-teal-500/[0.06] hover:to-emerald-500/[0.08]"
            >
                <div className="shrink-0 p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 ring-1 ring-emerald-500/30 group-hover:ring-emerald-500/50 transition-all">
                    <History className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-teal-200 to-emerald-200 mb-1">
                        {t("bigramNarrative.history.title")}
                    </p>
                    <p className="text-xs text-[var(--lab-text-muted)] leading-relaxed">
                        {t("bigramNarrative.history.summary")}
                    </p>
                </div>
                <motion.div
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="shrink-0"
                >
                    <ChevronDown className="w-5 h-5 text-emerald-400/60 group-hover:text-emerald-400 transition-colors" />
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
                            <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-400/50 mb-6 text-center">
                                {t("bigramNarrative.history.subtitle")}
                            </p>

                            {/* Mini Timeline */}
                            <div className="mb-8 px-2">
                                <div className="relative">
                                    <div className="absolute left-0 right-0 top-4 h-0.5 bg-gradient-to-r from-teal-500/20 via-emerald-500/30 to-rose-500/20" />
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

                            {/* Story paragraphs */}
                            <div className="space-y-5">
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="border-l-2 border-teal-500/30 pl-4"
                                >
                                    <div className="flex items-baseline gap-3 mb-2">
                                        <span className="text-2xl font-bold text-teal-400 font-mono shrink-0">1913</span>
                                        <span className="text-xs uppercase tracking-wider text-teal-400/60 font-semibold">Markov Chains</span>
                                    </div>
                                    <p className="text-sm text-white/50 leading-relaxed">{t("bigramNarrative.history.p1")}</p>
                                </motion.div>

                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="border-l-2 border-emerald-500/30 pl-4"
                                >
                                    <div className="flex items-baseline gap-3 mb-2">
                                        <span className="text-2xl font-bold text-emerald-400 font-mono shrink-0">1948</span>
                                        <span className="text-xs uppercase tracking-wider text-emerald-400/60 font-semibold">Shannon&apos;s Bet</span>
                                    </div>
                                    <p className="text-sm text-white/50 leading-relaxed">{t("bigramNarrative.history.p2")}</p>
                                </motion.div>

                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="border-l-2 border-amber-500/30 pl-4"
                                >
                                    <div className="flex items-baseline gap-3 mb-2">
                                        <span className="text-2xl font-bold text-amber-400 font-mono shrink-0">1960s</span>
                                        <span className="text-xs uppercase tracking-wider text-amber-400/60 font-semibold">First NLP</span>
                                    </div>
                                    <p className="text-sm text-white/50 leading-relaxed">{t("bigramNarrative.history.p3")}</p>
                                </motion.div>

                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="border-l-2 border-rose-500/30 pl-4"
                                >
                                    <div className="flex items-baseline gap-3 mb-2">
                                        <span className="text-2xl font-bold text-rose-400 font-mono shrink-0">2003</span>
                                        <span className="text-xs uppercase tracking-wider text-rose-400/60 font-semibold">Neural LMs</span>
                                    </div>
                                    <p className="text-sm text-white/50 leading-relaxed">{t("bigramNarrative.history.p4")}</p>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </aside>
    );
}

/* ─────────────────────────────────────────────
   Main narrative component
   ───────────────────────────────────────────── */

interface BigramNarrativeProps {
    matrixData: TransitionMatrixViz | null;
    trainingData?: TrainingViz | null;
    onCellClick: (row: string, col: string) => void;

    onGenerate: (startChar: string, numTokens: number, temperature: number) => void;
    generatedText: string | null;
    genLoading: boolean;
    genError: string | null;
}

export function BigramNarrative({
    matrixData,
    trainingData,
    onCellClick,
    onGenerate,
    generatedText,
    genLoading,
    genError,
}: BigramNarrativeProps) {
    const { t } = useI18n();
    const { setMode } = useLabMode();
    const { hasStoredProgress, storedSection, clearProgress } = useProgressTracker("bigram");

    return (
        <article className="max-w-[920px] mx-auto px-6 pt-8 pb-24">
            <ContinueToast
                accent="emerald"
                hasStoredProgress={hasStoredProgress}
                storedSection={storedSection}
                clearProgress={clearProgress}
                sectionNames={{
                    "bigram-01": t("bigramNarrative.problem.label"),
                    "bigram-02": t("bigramNarrative.coreIdea.label"),
                    "bigram-03": t("bigramNarrative.mechanics.label"),
                    "bigram-04": t("bigramNarrative.normalization.label"),
                    "bigram-05": t("bigramNarrative.sampling.label"),
                    "bigram-06": t("bigramNarrative.cliffhanger.label"),
                }}
            />
            <SectionProgressBar
                sections={[
                    { id: "bigram-01", label: "01", name: t("bigramNarrative.problem.label") },
                    { id: "bigram-02", label: "02", name: t("bigramNarrative.coreIdea.label") },
                    { id: "bigram-03", label: "03", name: t("bigramNarrative.mechanics.label") },
                    { id: "bigram-04", label: "04", name: t("bigramNarrative.normalization.label") },
                    { id: "bigram-05", label: "05", name: t("bigramNarrative.sampling.label") },
                    { id: "bigram-06", label: "06", name: t("bigramNarrative.cliffhanger.label") },
                ]}
                accent="emerald"
            />

            {/* ───────────────────── HERO ───────────────────── */}
            <header className="text-center mb-16 md:mb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    <span className="inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-emerald-400/60 mb-6">
                        <BookOpen className="w-3.5 h-3.5" />
                        {t("bigramNarrative.hero.eyebrow")}
                    </span>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[var(--lab-text)] mb-6">
                        {t("bigramNarrative.hero.titlePrefix")}{" "}
                        <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                            {t("bigramNarrative.hero.titleSuffix")}
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-[var(--lab-text-muted)] leading-relaxed max-w-2xl mx-auto mb-4">
                        {t("bigramNarrative.hero.description")}
                    </p>

                    <p className="text-xs font-mono text-[var(--lab-text-subtle)] mb-8">
                        {t("bigramNarrative.hero.readTime")}
                    </p>

                    <div className="flex justify-center">
                        <div className="max-w-xs mx-auto">
                            <ModeToggle />
                        </div>
                    </div>
                </motion.div>
            </header>

            {/* ─────────── §1 · THE CHALLENGE ─────────── */}
            <Section id="bigram-01">
                <SectionLabel number="1" label={t("bigramNarrative.problem.label")} />
                <SectionAnchor id="bigram-01"><Heading>{t("bigramNarrative.problem.title")}</Heading></SectionAnchor>
                <Lead>{t("bigramNarrative.problem.lead")}</Lead>

                <P>{t("bigramNarrative.problem.heroAutoIntro")}</P>
                <LazySection>
                    <FigureWrapper
                        label={t("bigramNarrative.problem.heroAutoLabel")}
                        hint={t("bigramNarrative.problem.heroAutoHint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><HeroAutoComplete /></Suspense>
                    </FigureWrapper>
                </LazySection>
                <P>{t("bigramNarrative.problem.heroAutoBridge")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("bigramNarrative.predictionChallenge.label")}
                        hint={t("bigramNarrative.predictionChallenge.lead")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><PredictionChallenge /></Suspense>
                    </FigureWrapper>
                </LazySection>
                <P>
                    {t("bigramNarrative.problem.p1")}
                    <Highlight>{t("bigramNarrative.problem.p1Highlight")}</Highlight>
                    {t("bigramNarrative.problem.p2")}
                </P>
                <P>{t("bigramNarrative.problem.p3")}</P>
                <PullQuote>{t("bigramNarrative.problem.quote")}</PullQuote>
                <P>
                    {t("bigramNarrative.problem.p4")}
                    <Highlight>{t("bigramNarrative.problem.h1")}</Highlight>,{" "}
                    <Highlight>{t("bigramNarrative.problem.h2")}</Highlight>{t("bigramNarrative.problem.connector")}
                    <Highlight>{t("bigramNarrative.problem.h3")}</Highlight>
                    {t("bigramNarrative.problem.p5")}
                </P>
            </Section>

            <SectionBreak />

            {/* ─────────── §2 · THE SIMPLEST IDEA ─────────── */}
            <Section id="bigram-02">
                <SectionLabel number="2" label={t("bigramNarrative.coreIdea.label")} />
                <SectionAnchor id="bigram-02"><Heading>{t("bigramNarrative.coreIdea.title")}</Heading></SectionAnchor>
                <Lead>{t("bigramNarrative.coreIdea.lead")}</Lead>

                {/* DISCOVERY MOMENT: PairHighlighter first — let the learner spot patterns */}
                <LazySection>
                    <FigureWrapper
                        label={t("bigramNarrative.pairHighlighter.figureLabel")}
                        hint={t("bigramNarrative.pairHighlighter.figureHint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><PairHighlighter /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("bigramNarrative.coreIdea.discoveryBridge")}</P>

                {/* CONFIRMATION: CorpusCountingIdea confirms the pattern at scale */}
                <LazySection>
                    <FigureWrapper
                        label={t("bigramNarrative.corpusCounting.figureLabel")}
                        hint={t("bigramNarrative.corpusCounting.figureHint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><CorpusCountingIdea /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* NOW name the concept — the learner already did the pairing */}
                <P>
                    {t("bigramNarrative.coreIdea.namingBridge")}
                    <Highlight><Term word="bigram">{t("bigramNarrative.coreIdea.h1")}</Term></Highlight>
                    {t("bigramNarrative.coreIdea.namingEnd")}
                </P>

                <ExpandableSection title={t("bigramNarrative.coreIdea.formalTitle")}>
                    <P>{t("bigramNarrative.coreIdea.formalP1")}</P>
                    <P>{t("bigramNarrative.coreIdea.etymologyBridge")}</P>
                    <div className="my-6 p-4 rounded-xl bg-black/30 border border-emerald-500/15 text-center">
                        <p className="font-mono text-sm text-emerald-300 mb-2">P(cₙ | cₙ₋₁) = Count(cₙ₋₁, cₙ) / Count(cₙ₋₁)</p>
                        <p className="text-[10px] text-white/30 font-mono">{t("bigramNarrative.coreIdea.formulaCaption")}</p>
                    </div>
                    <P>{t("bigramNarrative.coreIdea.formalP2")}</P>
                    <P>{t("bigramNarrative.coreIdea.formalP3")}</P>
                </ExpandableSection>

                <P>{t("bigramNarrative.coreIdea.p3")}</P>
            </Section>

            <SectionBreak />

            {/* ─────────── §3 · THE FULL PICTURE: TRANSITION TABLE ─────────── */}
            <Section id="bigram-03">
                <SectionLabel number="3" label={t("bigramNarrative.mechanics.label")} />
                <SectionAnchor id="bigram-03"><Heading>{t("bigramNarrative.mechanics.title")}</Heading></SectionAnchor>
                <Lead>{t("bigramNarrative.mechanics.lead")}</Lead>

                {/* Phase 0: Interactive intro — the storage problem */}
                <P>{t("bigramNarrative.mechanics.storageIntro")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("bigramNarrative.storageProblem.figureLabel")}
                        hint={t("bigramNarrative.storageProblem.figureHint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><StorageProblemVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* Phase 1: The grid idea */}
                <P>{t("bigramNarrative.mechanics.discoveryBridge")}</P>
                <PullQuote>{t("bigramNarrative.mechanics.bridgeQuote")}</PullQuote>
                <P>{t("bigramNarrative.mechanics.bridgeP3")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("bigramNarrative.mechanics.tinyMatrixLabel")}
                        hint={t("bigramNarrative.mechanics.tinyMatrixHint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><TinyMatrixExample showCounts /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* Phase 2: Build it yourself */}
                <P>{t("bigramNarrative.mechanics.builderBridge")}</P>
                <LazySection>
                    <FigureWrapper
                        label={t("bigramNarrative.mechanics.builderLabel")}
                        hint={t("bigramNarrative.mechanics.builderHint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><BigramMatrixBuilder /></Suspense>
                    </FigureWrapper>
                </LazySection>

                {/* Phase 3: Scale up — the full transition matrix */}
                <P>{t("bigramNarrative.mechanics.fullMatrixBridge")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("bigramNarrative.mechanics.label")}
                        hint={t("bigramNarrative.mechanics.fullMatrixHint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}>
                            <TransitionMatrix
                                data={matrixData}
                                onCellClick={onCellClick}
                                accent="emerald"
                            />
                        </Suspense>
                    </FigureWrapper>
                </LazySection>

                <Callout title={t("bigramNarrative.mechanics.dataSourceTitle")}>
                    <p className="mb-2">{t("bigramNarrative.mechanics.dataSourceP1")}</p>
                    <p className="mb-2">{t("bigramNarrative.mechanics.dataSourceP2")}</p>
                    <p>{t("bigramNarrative.mechanics.dataSourceP3")}</p>
                </Callout>

                <BigramHistorySidebar t={t} />

                <P>{t("bigramNarrative.mechanics.sectionBridge")}</P>
            </Section>

            <SectionBreak />

            {/* ─────────── §4 · FROM COUNTS TO CHANCES ─────────── */}
            <Section id="bigram-04">
                <SectionLabel number="4" label={t("bigramNarrative.normalization.label")} />
                <SectionAnchor id="bigram-04"><Heading>{t("bigramNarrative.normalization.title")}</Heading></SectionAnchor>
                <Lead>{t("bigramNarrative.normalization.lead")}</Lead>

                <P>
                    {t("bigramNarrative.normalization.p1")}
                    <Highlight><Term word="normalization">{t("bigramNarrative.normalization.h1")}</Term></Highlight>
                    {t("bigramNarrative.normalization.p2")}
                </P>

                <LazySection>
                    <FigureWrapper
                        label={t("bigramNarrative.normalization.label")}
                        hint={t("bigramNarrative.normalization.vizHint")}
                        showWindowDots={false}
                    >
                        <Suspense fallback={<SectionSkeleton />}><NormalizationVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <Callout title={t("bigramNarrative.normalization.plainEnglishTitle")}>
                    <p>{t("bigramNarrative.normalization.plainEnglish")}</p>
                </Callout>

                <P>{t("bigramNarrative.normalization.queryVizBridge")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("bigramNarrative.queryViz.label")}
                        hint={t("bigramNarrative.queryViz.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><PredictionQueryVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("bigramNarrative.normalization.p3")}</P>

                <KeyTakeaway accent="emerald">
                    {t("bigramNarrative.keyTakeaways.normalization")}
                </KeyTakeaway>
            </Section>

            <SectionBreak />

            {/* ─────────── §5 · LET IT WRITE ─────────── */}
            <Section id="bigram-05">
                <SectionLabel number="5" label={t("bigramNarrative.sampling.label")} />
                <SectionAnchor id="bigram-05"><Heading>{t("bigramNarrative.sampling.title")}</Heading></SectionAnchor>
                <Lead>{t("bigramNarrative.sampling.lead")}</Lead>
                <P>
                    {t("bigramNarrative.sampling.p1")}
                    <Highlight><Term word="sampling">{t("bigramNarrative.sampling.h1")}</Term></Highlight>
                    {t("bigramNarrative.sampling.p2")}
                </P>

                <LazySection>
                    <FigureWrapper
                        label={t("bigramNarrative.sampling.samplingMechanismLabel")}
                        hint={t("bigramNarrative.sampling.samplingMechanismHint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><SamplingMechanismVisualizer /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <ExpandableSection title={t("bigramNarrative.sampling.softmaxTitle")}>
                    <P>{t("bigramNarrative.sampling.softmaxIntuition")}</P>
                    <P>{t("bigramNarrative.sampling.softmaxP1")}</P>
                    <div className="my-6 p-4 rounded-xl bg-black/30 border border-emerald-500/15 text-center space-y-3">
                        <p className="font-mono text-sm text-emerald-300">softmax(zᵢ) = eᶻⁱ / Σⱼ eᶻʲ</p>
                        <p className="text-[10px] text-white/30 font-mono">{t("bigramNarrative.sampling.softmaxFormulaCaption")}</p>
                    </div>
                    <P>{t("bigramNarrative.sampling.softmaxP2")}</P>
                    <div className="my-6 p-4 rounded-xl bg-black/30 border border-emerald-500/15 text-center space-y-3">
                        <p className="font-mono text-sm text-emerald-300">softmax(zᵢ / T) = eᶻⁱ/ᵀ / Σⱼ eᶻʲ/ᵀ</p>
                        <p className="text-[10px] text-white/30 font-mono">{t("bigramNarrative.sampling.softmaxTempCaption")}</p>
                    </div>
                    <P>{t("bigramNarrative.sampling.softmaxP3")}</P>
                </ExpandableSection>

                <P>{t("bigramNarrative.sampling.playgroundBridge")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("bigramNarrative.sampling.playgroundLabel")}
                        hint={t("bigramNarrative.sampling.playgroundHint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}>
                            <GenerationPlayground
                                onGenerate={onGenerate}
                                generatedText={generatedText}
                                loading={genLoading}
                                error={genError}
                            />
                        </Suspense>
                    </FigureWrapper>
                </LazySection>
                <P>
                    {t("bigramNarrative.sampling.p3")}
                    <Highlight>{t("bigramNarrative.sampling.h2")}</Highlight>
                    {t("bigramNarrative.sampling.p4")}
                </P>
            </Section>

            <SectionBreak />

            {/* ─────────── §6 · THE FATAL FLAW ─────────── */}
            <Section id="bigram-06">
                <SectionLabel number="6" label={t("bigramNarrative.cliffhanger.label")} />
                <SectionAnchor id="bigram-06"><Heading>{t("bigramNarrative.cliffhanger.title")}</Heading></SectionAnchor>
                <Lead>{t("bigramNarrative.cliffhanger.lead")}</Lead>
                <P>{t("bigramNarrative.cliffhanger.celebrationBridge")}</P>
                <P>{t("bigramNarrative.cliffhanger.p1")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("bigramNarrative.contextBlindness.figureLabel")}
                        hint={t("bigramNarrative.contextBlindness.figureHint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><ContextBlindnessDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("bigramNarrative.cliffhanger.blindnessP1")}</P>

                <PullQuote>{t("bigramNarrative.cliffhanger.hookLine")}</PullQuote>

                <KeyTakeaway accent="emerald">
                    {t("bigramNarrative.keyTakeaways.fatalFlaw")}
                </KeyTakeaway>
            </Section>

            <SectionBreak />

            {/* ─────────── CTA (asymmetric — primary = next chapter) ─────────── */}
            <Section>
                <div className="text-center mb-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-[var(--lab-text)] tracking-tight mb-3">
                        {t("bigramNarrative.cta.title")}
                    </h2>
                </div>

                <div className="space-y-4">
                    {/* Primary CTA — next chapter */}
                    <Link href="/lab/ngram">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative w-full rounded-2xl border border-teal-500/25 bg-gradient-to-br from-teal-950/30 to-[var(--lab-viz-bg)]/80 p-8 text-left transition-colors hover:border-teal-500/50 overflow-hidden shadow-[0_0_40px_-12px_rgba(20,184,166,0.15)]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <div className="relative flex items-center gap-5">
                                <div className="p-3 rounded-2xl bg-teal-500/15 shrink-0">
                                    <ArrowRight className="w-7 h-7 text-teal-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-xl font-bold text-[var(--lab-text)] tracking-tight block mb-1">
                                        {t("bigramNarrative.cta.nextTitle")}
                                    </span>
                                    <p className="text-sm text-[var(--lab-text-muted)] leading-relaxed">
                                        {t("bigramNarrative.cta.nextDesc")}
                                    </p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-teal-400/50 shrink-0 group-hover:text-teal-400 transition-colors" />
                            </div>
                        </motion.div>
                    </Link>

                    {/* Secondary CTA — free lab */}
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setMode("free")}
                        className="group relative w-full rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 text-left transition-colors hover:border-emerald-500/25 overflow-hidden"
                    >
                        <div className="relative flex items-center gap-4">
                            <div className="p-2 rounded-xl bg-emerald-500/10 shrink-0">
                                <Beaker className="w-4 h-4 text-emerald-300/70" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-sm font-bold text-[var(--lab-text-muted)]">
                                    {t("bigramNarrative.cta.freeLabButton")}
                                </span>
                                <span className="text-xs text-[var(--lab-text-subtle)] ml-2">
                                    {t("bigramNarrative.cta.freeLabDesc")}
                                </span>
                            </div>
                        </div>
                    </motion.button>
                </div>
            </Section>

            {/* ───────────────── FOOTER ───────────────── */}
            <FadeInView as="footer" className="mt-8 pt-12 border-t border-[var(--lab-border)] text-center">
                <div className="flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[var(--lab-border)]">
                    <FlaskConical className="h-3 w-3" />
                    {t("bigramNarrative.footer.brand")}
                </div>
            </FadeInView>
        </article>
    );
}