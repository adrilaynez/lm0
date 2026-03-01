"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AnimatePresence, motion } from "framer-motion";
import {
    AlertTriangle,
    ArrowDown,
    ArrowRight,
    Beaker,
    BookOpen,
    BrainCircuit,
    ChevronDown,
    FlaskConical,
} from "lucide-react";

import { lazy, Suspense } from "react";

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

/* ─── Lazy-loaded interactive visualizers ─── */
const CombinatoricExplosionTable = lazy(() => import("@/components/lab/CombinatoricExplosionTable").then(m => ({ default: m.CombinatoricExplosionTable })));
const ConcreteImprovementExample = lazy(() => import("@/components/lab/ConcreteImprovementExample").then(m => ({ default: m.ConcreteImprovementExample })));
const CountingComparisonWidget = lazy(() => import("@/components/lab/CountingComparisonWidget").then(m => ({ default: m.CountingComparisonWidget })));
const ExponentialGrowthAnimator = lazy(() => import("@/components/lab/ExponentialGrowthAnimator").then(m => ({ default: m.ExponentialGrowthAnimator })));
const GeneralizationFailureDemo = lazy(() => import("@/components/lab/GeneralizationFailureDemo").then(m => ({ default: m.GeneralizationFailureDemo })));
const GrowingTablesComparison = lazy(() => import("@/components/lab/GrowingTablesComparison").then(m => ({ default: m.GrowingTablesComparison })));
const InfiniteTableThoughtExperiment = lazy(() => import("@/components/lab/InfiniteTableThoughtExperiment").then(m => ({ default: m.InfiniteTableThoughtExperiment })));
const NgramGenerationBattle = lazy(() => import("@/components/lab/NgramGenerationBattle").then(m => ({ default: m.NgramGenerationBattle })));
const NgramInteractiveGenerator = lazy(() => import("@/components/lab/NgramInteractiveGenerator").then(m => ({ default: m.NgramInteractiveGenerator })));
const NgramMiniTransitionTable = lazy(() => import("@/components/lab/NgramPedagogyPanels").then(m => ({ default: m.NgramMiniTransitionTable })));
const NgramFiveGramScale = lazy(() => import("@/components/lab/NgramPedagogyPanels").then(m => ({ default: m.NgramFiveGramScale })));
const SimilarityBlindSpot = lazy(() => import("@/components/lab/SimilarityBlindSpot").then(m => ({ default: m.SimilarityBlindSpot })));
const SparsityHeatmap = lazy(() => import("@/components/lab/SparsityHeatmap").then(m => ({ default: m.SparsityHeatmap })));
const StatisticalEraTimeline = lazy(() => import("@/components/lab/StatisticalEraTimeline").then(m => ({ default: m.StatisticalEraTimeline })));
const TypoWordBreaker = lazy(() => import("@/components/lab/TypoWordBreaker").then(m => ({ default: m.TypoWordBreaker })));

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
const NA: NarrativeAccent = "amber";
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
    const { t } = useI18n();
    return (
        <div className="my-10">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-3 text-left group mb-4"
                aria-expanded={open}
            >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <h3 className="text-lg font-bold text-[var(--lab-text)] flex-1 leading-snug">{title}</h3>
                <span className="shrink-0 text-[10px] font-mono uppercase tracking-widest text-[var(--lab-text-subtle)] group-hover:text-[var(--lab-text-muted)] transition-colors mr-1">
                    {open ? t("ngramNarrative.ui.collapse") : t("ngramNarrative.ui.expand")}
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
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/40" />
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
   Interactive context window visualizer
   ───────────────────────────────────────────── */

function ContextWindowVisualizer() {
    const { t } = useI18n();
    const [selectedN, setSelectedN] = useState(1);
    const tokens = "I want to eat pizza".split("");
    const PREDICTIONS: Record<number, { candidates: string[]; best: string; confidence: number }> = {
        1: { candidates: ["b", "n", "s", "t", " "], best: " ", confidence: 18 },
        2: { candidates: ["l", "n", "s", " "], best: " ", confidence: 35 },
        3: { candidates: ["s", " ", "!"], best: " ", confidence: 62 },
        4: { candidates: [" ", "s"], best: " ", confidence: 81 },
        5: { candidates: [" "], best: " ", confidence: 94 },
    };
    const LABELS: Record<number, string> = { 1: "Bigram", 2: "Trigram", 3: "3-gram", 4: "4-gram", 5: "5-gram" };
    const pred = PREDICTIONS[selectedN];
    const ctxStart = tokens.length - selectedN;

    return (
        <div className="space-y-5">
            {/* N selector buttons */}
            <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-bold mr-1">
                    {t("ngramNarrative.figures.contextWindow.contextSize")}
                </span>
                {[1, 2, 3, 4, 5].map((n) => (
                    <button
                        key={n}
                        onClick={() => setSelectedN(n)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${n === selectedN
                            ? "bg-amber-500/15 border-amber-500/30 text-amber-300 shadow-[0_0_12px_-3px_rgba(251,191,36,0.3)]"
                            : "bg-white/[0.02] border-white/[0.06] text-white/30 hover:text-white/50 hover:border-white/10"
                            }`}
                    >
                        N={n}
                    </button>
                ))}
            </div>

            {/* Sentence with animated context highlight */}
            <div className="rounded-xl border border-white/[0.08] bg-black/30 p-5">
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold mb-3">
                    {t("ngramNarrative.figures.contextWindow.predictingAfter")}
                </p>
                <div className="font-mono text-lg leading-relaxed flex flex-wrap items-center">
                    {tokens.map((ch, i) => {
                        const isContext = i >= ctxStart;
                        const isBeforeContext = i < ctxStart;
                        return (
                            <motion.span
                                key={i}
                                animate={{
                                    color: isContext ? "rgba(252, 211, 77, 1)" : "rgba(255,255,255,0.18)",
                                    backgroundColor: isContext ? "rgba(245, 158, 11, 0.12)" : "transparent",
                                }}
                                transition={{ duration: 0.3 }}
                                className={`${isContext ? "rounded px-0.5 font-bold" : ""}`}
                            >
                                {ch === " " ? "\u00A0" : ch}
                            </motion.span>
                        );
                    })}
                    <motion.span
                        key="cursor"
                        className="text-amber-400 ml-0.5"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                    >
                        |
                    </motion.span>
                </div>

                {/* Context label */}
                <motion.div
                    key={selectedN}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex items-center gap-3"
                >
                    <span className="text-[10px] font-mono text-amber-400/60 uppercase tracking-wider">
                        {LABELS[selectedN]} {t("ngramNarrative.figures.contextWindow.sees")}
                    </span>
                    <span className="font-mono text-sm text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                        &ldquo;{tokens.slice(ctxStart).join("")}&rdquo;
                    </span>
                    <ArrowRight className="w-3 h-3 text-white/20" />
                    <span className="text-[10px] text-white/30">{t("ngramNarrative.figures.contextWindow.next")}</span>
                </motion.div>
            </div>

            {/* Prediction panel */}
            <motion.div
                key={selectedN}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5"
            >
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-bold">
                        {t("ngramNarrative.figures.contextWindow.modelBestGuess")}
                    </span>
                    <span className="font-mono text-xs text-amber-300 font-bold">
                        {t("ngramNarrative.figures.contextWindow.confident").replace("{pct}", String(pred.confidence))}
                    </span>
                </div>

                {/* Confidence bar */}
                <div className="h-3 rounded-full bg-white/[0.05] overflow-hidden mb-4">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pred.confidence}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-amber-600/60 to-amber-400/70"
                    />
                </div>

                {/* Candidate chips */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-white/25 font-mono uppercase tracking-wider">
                        {t("ngramNarrative.figures.contextWindow.candidates")}
                    </span>
                    {pred.candidates.map((c, i) => (
                        <span
                            key={c}
                            className={`font-mono text-sm px-2 py-0.5 rounded border ${c === pred.best
                                ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10 font-bold"
                                : "text-white/40 border-white/[0.06] bg-white/[0.02]"
                                }`}
                        >
                            {c === " " ? "␣" : c}
                        </span>
                    ))}
                </div>

                <p className="text-[10px] text-white/25 mt-3 leading-relaxed">
                    {selectedN === 1 && t("ngramNarrative.figures.contextWindow.n1hint")}
                    {selectedN === 2 && t("ngramNarrative.figures.contextWindow.n2hint")}
                    {selectedN === 3 && t("ngramNarrative.figures.contextWindow.n3hint")}
                    {selectedN === 4 && t("ngramNarrative.figures.contextWindow.n4hint")}
                    {selectedN === 5 && t("ngramNarrative.figures.contextWindow.n5hint")}
                </p>
            </motion.div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Main narrative component
   ───────────────────────────────────────────── */

interface NgramNarrativeProps {
    contextSize: number;
    vocabSize: number;
}

export function NgramNarrative({
    contextSize,
    vocabSize,
}: NgramNarrativeProps) {
    const { t } = useI18n();
    const router = useRouter();
    const { setMode } = useLabMode();
    const { hasStoredProgress, storedSection, clearProgress } = useProgressTracker("ngram");

    return (
        <article className="max-w-[920px] mx-auto px-6 pt-8 pb-24">
            <ContinueToast
                accent="amber"
                hasStoredProgress={hasStoredProgress}
                storedSection={storedSection}
                clearProgress={clearProgress}
                sectionNames={{
                    "ngram-01": t("ngramNarrative.sectionNames.s01"),
                    "ngram-02": t("ngramNarrative.sectionNames.s02"),
                    "ngram-03": t("ngramNarrative.sectionNames.s03"),
                    "ngram-04": t("ngramNarrative.sectionNames.s04"),
                    "ngram-05": t("ngramNarrative.sectionNames.s05"),
                    "ngram-06": t("ngramNarrative.sectionNames.s06"),
                    "ngram-07": t("ngramNarrative.sectionNames.s07"),
                }}
            />
            <SectionProgressBar
                sections={[
                    { id: "ngram-01", label: "01", name: t("ngramNarrative.sectionNames.s01") },
                    { id: "ngram-02", label: "02", name: t("ngramNarrative.sectionNames.s02") },
                    { id: "ngram-03", label: "03", name: t("ngramNarrative.sectionNames.s03") },
                    { id: "ngram-04", label: "04", name: t("ngramNarrative.sectionNames.s04") },
                    { id: "ngram-05", label: "05", name: t("ngramNarrative.sectionNames.s05") },
                    { id: "ngram-06", label: "06", name: t("ngramNarrative.sectionNames.s06") },
                    { id: "ngram-07", label: "07", name: t("ngramNarrative.sectionNames.s07") },
                ]}
                accent="amber"
            />

            {/* ───────────────────── HERO ───────────────────── */}
            <header className="text-center mb-24 md:mb-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    <span className="inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-amber-400/60 mb-6">
                        <BookOpen className="w-3.5 h-3.5" />
                        {t("ngramNarrative.hero.eyebrow")}
                    </span>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[var(--lab-text)] mb-6">
                        {t("ngramNarrative.hero.titlePrefix")}{" "}
                        <span className="bg-gradient-to-r from-amber-400 to-orange-300 bg-clip-text text-transparent">
                            {t("ngramNarrative.hero.titleSuffix")}
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-[var(--lab-text-subtle)] max-w-xl mx-auto leading-relaxed mb-12">
                        {t("ngramNarrative.hero.description")}
                    </p>

                    <p className="text-[11px] font-mono text-[var(--lab-text-subtle)] mb-8">
                        {t("ngramNarrative.readTime")}
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

            {/* ─────────── §1 · THE FIX: MORE CONTEXT (visualizer-first) ─────────── */}
            <Section id="ngram-01">
                <SectionLabel number="01" label={t("ngramNarrative.moreContext.label")} />
                <SectionAnchor id="ngram-01"><Heading>{t("ngramNarrative.moreContext.title")}</Heading></SectionAnchor>

                <Lead>{t("ngramNarrative.moreContext.lead")}</Lead>

                <p className="text-center text-sm italic text-amber-300/60 font-light my-4">
                    {t("ngramNarrative.moreContext.tryPrompt")}
                </p>

                <FigureWrapper
                    label={t("ngramNarrative.figures.contextWindow.label")}
                    hint={t("ngramNarrative.contextWindow.caption")}
                >
                    <ContextWindowVisualizer />
                </FigureWrapper>

                <P>{t("ngramNarrative.moreContext.confidenceBridge")}</P>

                <P>
                    {t("ngramNarrative.moreContext.p1")}{" "}
                    <Highlight><Term word="context window">{t("ngramNarrative.moreContext.p1Highlight")}</Term></Highlight>{" "}
                    {t("ngramNarrative.moreContext.p1End")}
                </P>

                <P>{t("ngramNarrative.moreContext.p2")}</P>
                <P>{t("ngramNarrative.moreContext.p3")}</P>

                <Callout title={t("ngramNarrative.moreContext.calloutTitle")}>
                    <p>{t("ngramNarrative.moreContext.calloutText")}</p>
                </Callout>
            </Section>

            <SectionBreak />

            {/* ─────────── §2 · COUNTING WITH CONTEXT ─────────── */}
            <Section id="ngram-02">
                <SectionLabel number="02" label={t("ngramNarrative.howItWorks.label")} />
                <SectionAnchor id="ngram-02"><Heading>{t("ngramNarrative.howItWorks.title")}</Heading></SectionAnchor>

                <Lead>{t("ngramNarrative.howItWorks.lead")}</Lead>

                <P>
                    {t("ngramNarrative.howItWorks.p1")}{" "}
                    <Highlight>{t("ngramNarrative.howItWorks.p1Highlight")}</Highlight>
                    {t("ngramNarrative.howItWorks.p1End")}
                </P>

                <P>{t("ngramNarrative.howItWorks.p2")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("ngramNarrative.figures.transitionExamples.label")}
                        hint={t("ngramNarrative.figures.transitionExamples.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><NgramMiniTransitionTable n={contextSize} /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("ngramNarrative.howItWorks.bridge")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("ngramNarrative.figures.countingComparison.label")}
                        hint={t("ngramNarrative.figures.countingComparison.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><CountingComparisonWidget /></Suspense>
                    </FigureWrapper>
                </LazySection>
            </Section>

            <SectionBreak />

            {/* ─────────── §3 · THE PREDICTION GETS BETTER (merged §3.5) ─────────── */}
            <Section id="ngram-03">
                <SectionLabel number="03" label={t("ngramNarrative.improvement.label")} />
                <SectionAnchor id="ngram-03"><Heading>{t("ngramNarrative.improvement.title")}</Heading></SectionAnchor>

                <Lead>{t("ngramNarrative.improvement.lead")}</Lead>

                <P>{t("ngramNarrative.improvement.example")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("ngramNarrative.figures.confidenceImprovement.label")}
                        hint={t("ngramNarrative.figures.confidenceImprovement.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><ConcreteImprovementExample /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("ngramNarrative.improvement.battleBridge")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("ngramNarrative.figures.generationBattle.label")}
                        hint={t("ngramNarrative.figures.generationBattle.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}>
                            <NgramGenerationBattle
                                seeds={["the "]}
                                nValues={[1, 2, 3, 4]}
                                maxTokens={80}
                                temperature={0.8}
                                autoGenerate
                            />
                        </Suspense>
                    </FigureWrapper>
                </LazySection>

                <ExpandableSection title={t("ngramNarrative.improvement.expandableGenTitle")} defaultOpen={false}>
                    <LazySection>
                        <FigureWrapper
                            label={t("ngramNarrative.interactiveGenerator.figureLabel")}
                            hint={t("ngramNarrative.interactiveGenerator.figureHint")}
                        >
                            <Suspense fallback={<SectionSkeleton />}><NgramInteractiveGenerator /></Suspense>
                        </FigureWrapper>
                    </LazySection>
                </ExpandableSection>

                {/* Former §3.5 — "Why Not N=100?" — merged as concluding challenge */}
                <PullQuote>{t("ngramNarrative.whyNotMore.title")}</PullQuote>
                <P>{t("ngramNarrative.whyNotMore.lead")}</P>
                <P>{t("ngramNarrative.whyNotMore.p1")}</P>
            </Section>

            <SectionBreak />

            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-center py-8"
            >
                <p className="text-lg text-amber-300/60 font-light italic max-w-lg mx-auto">
                    {t("ngramNarrative.celebration.text")}
                </p>
            </motion.div>

            {/* ─────────── §4 · THE EXPLOSION (first half of old §4) ─────────── */}
            <Section id="ngram-04">
                <SectionLabel number="04" label={t("ngramNarrative.explosion.label")} />
                <SectionAnchor id="ngram-04"><Heading>{t("ngramNarrative.explosion.title")}</Heading></SectionAnchor>

                <Lead>{t("ngramNarrative.complexity.lead")}</Lead>

                <P>{t("ngramNarrative.complexity.p1")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("ngramNarrative.figures.exponentialGrowth.label")}
                        hint={t("ngramNarrative.figures.exponentialGrowth.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><ExponentialGrowthAnimator /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("ngramNarrative.explosion.concreteBridge")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("ngramNarrative.growingTables.label")}
                        hint={t("ngramNarrative.growingTables.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><GrowingTablesComparison vocabSize={vocabSize} /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <LazySection>
                    <div className="my-10">
                        <Suspense fallback={<SectionSkeleton />}><NgramFiveGramScale vocabSize={vocabSize} /></Suspense>
                    </div>
                </LazySection>

                <Callout icon={AlertTriangle} title={t("ngramNarrative.complexity.vocabCalloutTitle")}>
                    <p>{t("ngramNarrative.complexity.vocabCalloutText")}</p>
                </Callout>
            </Section>

            <SectionBreak />

            {/* ─────────── §5 · THE EMPTY TABLE (second half of old §4) ─────────── */}
            <Section id="ngram-05">
                <SectionLabel number="05" label={t("ngramNarrative.emptyTable.label")} />
                <SectionAnchor id="ngram-05"><Heading>{t("ngramNarrative.emptyTable.title")}</Heading></SectionAnchor>

                <Lead>{t("ngramNarrative.emptyTable.lead")}</Lead>

                <P>{t("ngramNarrative.emptyTable.bridge")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("ngramNarrative.figures.sparsityHeatmap.label")}
                        hint={t("ngramNarrative.figures.sparsityHeatmap.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><SparsityHeatmap /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <ExpandableSection title={t("ngramNarrative.tokenization.subsectionTitle")}>
                    <P>{t("ngramNarrative.tokenization.intro")}</P>

                    <div className="grid md:grid-cols-2 gap-6 my-8">
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                <h4 className="text-base font-bold text-emerald-400">
                                    {t("ngramNarrative.tokenization.charTitle")}
                                </h4>
                            </div>
                            <p className="text-sm text-[var(--lab-text-muted)] leading-relaxed mb-3">
                                {t("ngramNarrative.tokenization.charDesc")}
                            </p>
                            <p className="text-xs text-emerald-400/60 font-mono">
                                {t("ngramNarrative.tokenization.charExample")}
                            </p>
                        </div>

                        <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.04] p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                                <h4 className="text-base font-bold text-rose-400">
                                    {t("ngramNarrative.tokenization.wordTitle")}
                                </h4>
                            </div>
                            <p className="text-sm text-[var(--lab-text-muted)] leading-relaxed mb-3">
                                {t("ngramNarrative.tokenization.wordDesc")}
                            </p>
                            <p className="text-xs text-rose-400/60 font-mono">
                                {t("ngramNarrative.tokenization.wordExample")}
                            </p>
                        </div>
                    </div>

                    <P>{t("ngramNarrative.tokenization.explosionIntro")}</P>

                    <LazySection>
                        <FigureWrapper
                            label={t("ngramNarrative.tokenization.tableLabel")}
                            hint={t("ngramNarrative.tokenization.tableHint")}
                        >
                            <Suspense fallback={<SectionSkeleton />}><CombinatoricExplosionTable vocabSize={50000} /></Suspense>
                        </FigureWrapper>
                    </LazySection>

                    <P>
                        {t("ngramNarrative.tokenization.languageP1")}{" "}
                        <Highlight>{t("ngramNarrative.tokenization.languageH1")}</Highlight>
                        {t("ngramNarrative.tokenization.languageP2")}
                    </P>

                    <Callout title={t("ngramNarrative.tokenization.multilingualCalloutTitle")}>
                        <p>{t("ngramNarrative.tokenization.multilingualCalloutText")}</p>
                    </Callout>
                </ExpandableSection>
            </Section>

            <SectionBreak />

            {/* ─────────── §6 · THE DEEPER PROBLEM ─────────── */}
            <Section id="ngram-06">
                <SectionLabel number="06" label={t("ngramNarrative.deeperProblem.label")} />
                <SectionAnchor id="ngram-06"><Heading>{t("ngramNarrative.deeperProblem.title")}</Heading></SectionAnchor>

                <Lead>{t("ngramNarrative.deeperProblem.lead")}</Lead>

                <P>{t("ngramNarrative.deeperProblem.p1")}</P>
                <P>{t("ngramNarrative.deeperProblem.p2")}</P>
                <P>{t("ngramNarrative.deeperProblem.p3")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("ngramNarrative.figures.generalizationFailure.label")}
                        hint={t("ngramNarrative.figures.generalizationFailure.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><GeneralizationFailureDemo /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <LazySection>
                    <FigureWrapper
                        label={t("ngramNarrative.figures.infiniteTable.label")}
                        hint={t("ngramNarrative.figures.infiniteTable.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><InfiniteTableThoughtExperiment /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <P>{t("ngramNarrative.deeperProblem.demoBridge")}</P>

                <ExpandableSection title={t("ngramNarrative.deeperProblem.typoSectionTitle")}>
                    <LazySection>
                        <FigureWrapper
                            label={t("ngramNarrative.figures.typoBreaker.label")}
                            hint={t("ngramNarrative.figures.typoBreaker.hint")}
                        >
                            <Suspense fallback={<SectionSkeleton />}><TypoWordBreaker /></Suspense>
                        </FigureWrapper>
                    </LazySection>
                </ExpandableSection>

                <ExpandableSection title={t("ngramNarrative.deeperProblem.similaritySectionTitle")}>
                    <LazySection>
                        <FigureWrapper
                            label={t("ngramNarrative.similarityBlindSpot.figureLabel")}
                            hint={t("ngramNarrative.similarityBlindSpot.figureHint")}
                        >
                            <Suspense fallback={<SectionSkeleton />}><SimilarityBlindSpot /></Suspense>
                        </FigureWrapper>
                    </LazySection>
                </ExpandableSection>

                <Callout icon={AlertTriangle} title={t("ngramNarrative.deeperProblem.calloutTitle")}>
                    <p>{t("ngramNarrative.deeperProblem.calloutText")}</p>
                </Callout>

                <KeyTakeaway accent="amber">
                    {t("ngramNarrative.keyTakeaways.deeperProblem")}
                </KeyTakeaway>
            </Section>

            <SectionBreak />

            {/* ─────────── §7 · THE END OF COUNTING ─────────── */}
            <Section id="ngram-07">
                <SectionLabel number="07" label={t("ngramNarrative.endOfCounting.label")} />
                <SectionAnchor id="ngram-07"><Heading>{t("ngramNarrative.endOfCounting.title")}</Heading></SectionAnchor>

                <Lead>{t("ngramNarrative.endOfCounting.lead")}</Lead>

                <P>{t("ngramNarrative.endOfCounting.p1")}</P>
                <P>{t("ngramNarrative.endOfCounting.p2")}</P>
                <P>{t("ngramNarrative.endOfCounting.p3")}</P>

                {/* "What you now know" consolidation */}
                <P>{t("ngramNarrative.endOfCounting.consolidation")}</P>
                <div className="space-y-2 my-6 pl-4 border-l-2 border-amber-500/20">
                    {(["knows1", "knows2", "knows3", "knows4"] as const).map((key, i) => (
                        <FadeInView
                            as="p"
                            key={key}
                            delay={i * 0.1}
                            className="text-sm text-[var(--lab-text-muted)] leading-relaxed"
                        >
                            <span className="text-amber-400 mr-2">✓</span>
                            {t(`ngramNarrative.endOfCounting.${key}`)}
                        </FadeInView>
                    ))}
                </div>

                <P>{t("ngramNarrative.endOfCounting.bridge")}</P>

                <LazySection>
                    <FigureWrapper
                        label={t("ngramNarrative.figures.statisticalEra.label")}
                        hint={t("ngramNarrative.figures.statisticalEra.hint")}
                    >
                        <Suspense fallback={<SectionSkeleton />}><StatisticalEraTimeline /></Suspense>
                    </FigureWrapper>
                </LazySection>

                <PullQuote>{t("ngramNarrative.endOfCounting.quote")}</PullQuote>

                <FadeInView as="p" className="text-center text-sm text-amber-300/50 italic font-light mt-2">
                    {t("ngramNarrative.endOfCounting.hookLine")}
                </FadeInView>

                <KeyTakeaway accent="amber">
                    {t("ngramNarrative.keyTakeaways.endOfCounting")}
                </KeyTakeaway>
            </Section>

            <SectionBreak />

            {/* ─────────── CTA (asymmetric — primary = next chapter) ─────────── */}
            <Section>
                <div className="text-center mb-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-[var(--lab-text)] tracking-tight mb-3">
                        {t("ngramNarrative.cta.title")}
                    </h2>
                </div>

                <div className="space-y-4">
                    {/* Primary CTA — next chapter */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push("/lab/neural-networks")}
                        className="group relative w-full rounded-2xl border border-rose-500/25 bg-gradient-to-br from-rose-950/30 to-[var(--lab-viz-bg)]/80 p-8 text-left transition-colors hover:border-rose-500/50 overflow-hidden shadow-[0_0_40px_-12px_rgba(244,63,94,0.15)]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <div className="relative flex items-center gap-5">
                            <div className="p-3 rounded-2xl bg-rose-500/15 shrink-0">
                                <BrainCircuit className="w-7 h-7 text-rose-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-xl font-bold text-[var(--lab-text)] tracking-tight block mb-1">
                                    {t("ngramNarrative.cta.neuralButton")}
                                </span>
                                <p className="text-sm text-[var(--lab-text-muted)] leading-relaxed">
                                    {t("ngramNarrative.cta.neuralDesc")}
                                </p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-rose-400/50 shrink-0 group-hover:text-rose-400 transition-colors" />
                        </div>
                    </motion.button>

                    {/* Secondary CTA — free lab */}
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setMode("free")}
                        className="group relative w-full rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 text-left transition-colors hover:border-amber-500/25 overflow-hidden"
                    >
                        <div className="relative flex items-center gap-4">
                            <div className="p-2 rounded-xl bg-amber-500/10 shrink-0">
                                <Beaker className="w-4 h-4 text-amber-300/70" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-sm font-bold text-[var(--lab-text-muted)]">
                                    {t("ngramNarrative.cta.labButton")}
                                </span>
                                <span className="text-xs text-[var(--lab-text-subtle)] ml-2">
                                    {t("ngramNarrative.cta.labDesc")}
                                </span>
                            </div>
                        </div>
                    </motion.button>
                </div>
            </Section>

            {/* ───────────────── FOOTER ───────────────── */}
            <FadeInView as="footer" className="mt-8 pt-12 border-t border-[var(--lab-border)] text-center">
                <p className="text-sm text-[var(--lab-text-subtle)] italic max-w-md mx-auto leading-relaxed mb-10">
                    {t("ngramNarrative.footer.text")}
                </p>
                <div className="flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[var(--lab-border)]">
                    <FlaskConical className="h-3 w-3" />
                    {t("ngramNarrative.footer.brand")}
                </div>
            </FadeInView>
        </article>
    );
}
