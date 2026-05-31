"use client";

import { lazy, Suspense, useState } from "react";
import Link from "next/link";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Beaker, BookOpen, ChevronDown, FlaskConical, History } from "lucide-react";

import { ContinueToast } from "@/features/lab/components/ContinueToast";
import { FadeInView } from "@/features/lab/components/FadeInView";
import { Term } from "@/features/lab/components/GlossaryTooltip";
import { KeyTakeaway } from "@/features/lab/components/KeyTakeaway";
import { LazySection, SectionSkeleton } from "@/features/lab/components/LazySection";
import { ModeToggle } from "@/features/lab/components/ModeToggle";
import { SectionAnchor } from "@/features/lab/components/SectionAnchor";
import { SectionProgressBar } from "@/features/lab/components/SectionProgressBar";
import { useLabMode } from "@/features/lab/context/LabModeContext";
import { useProgressTracker } from "@/features/lab/hooks/useProgressTracker";
import type { TrainingViz, TransitionMatrixViz } from "@/features/lab/types/lmLab";
import { useI18n } from "@/i18n/context";
import { cn } from "@/lib/utils";

/* Bigram type families (Playfair display · Source Serif body · JetBrains Mono data),
   resolved through the [data-bigram-theme] font tokens defined in globals.css. */
const BIGRAM_DISPLAY = "font-[family-name:var(--bigram-font-display)]";
const BIGRAM_SERIF = "font-[family-name:var(--bigram-font-serif)]";
const BIGRAM_MONO = "font-[family-name:var(--bigram-font-mono)]";

/* ─── Lazy-loaded interactive visualizers ─── */
const BigramMatrixBuilder = lazy(() => import("@/features/lab/components/BigramMatrixBuilder").then(m => ({ default: m.BigramMatrixBuilder })));
const ContextBlindnessDemo = lazy(() => import("@/features/lab/components/ContextBlindnessDemo").then(m => ({ default: m.ContextBlindnessDemo })));
const CorpusCountingIdea = lazy(() => import("@/features/lab/components/CorpusCountingIdea").then(m => ({ default: m.CorpusCountingIdea })));
const GenerationPlayground = lazy(() => import("@/features/lab/components/GenerationPlayground").then(m => ({ default: m.GenerationPlayground })));
const HeroAutoComplete = lazy(() => import("@/features/lab/components/HeroAutoComplete").then(m => ({ default: m.HeroAutoComplete })));

const NormalizationVisualizer = lazy(() => import("@/features/lab/components/NormalizationVisualizer").then(m => ({ default: m.NormalizationVisualizer })));
const PairHighlighter = lazy(() => import("@/features/lab/components/PairHighlighter").then(m => ({ default: m.PairHighlighter })));
const PredictionChallenge = lazy(() => import("@/features/lab/components/PredictionChallenge").then(m => ({ default: m.PredictionChallenge })));
const PredictionQueryVisualizer = lazy(() => import("@/features/lab/components/PredictionQueryVisualizer").then(m => ({ default: m.PredictionQueryVisualizer })));
const SamplingMechanismVisualizer = lazy(() => import("@/features/lab/components/SamplingMechanismVisualizer").then(m => ({ default: m.SamplingMechanismVisualizer })));
const StorageProblemVisualizer = lazy(() => import("@/features/lab/components/StorageProblemVisualizer").then(m => ({ default: m.StorageProblemVisualizer })));
const TinyMatrixExample = lazy(() => import("@/features/lab/components/TinyMatrixExample").then(m => ({ default: m.TinyMatrixExample })));
const TransitionMatrix = lazy(() => import("@/features/lab/components/TransitionMatrix").then(m => ({ default: m.TransitionMatrix })));

import {
    Callout as _Callout,
    FigureWrapper as _FigureWrapper,
    FormulaBlock as _FormulaBlock,
    Heading as _Heading, Highlight as _Highlight,
    type HighlightColor,
    Lead as _Lead, type NarrativeAccent,
    P as _P, PullQuote as _PullQuote,
    Section, SectionBreak as _SectionBreak,
    SectionLabel as _SectionLabel,
} from "./narrative-primitives";

/* ─── Accent-bound wrappers ───
   The Bigram chapter opts every shared primitive into the v8 editorial-green
   accent. The green resolves through the [data-bigram-theme] scope on the page
   wrapper, so no other chapter is affected. */
const NA: NarrativeAccent = "bigram";
const SectionLabel = (p: { number: string; label: string }) => <_SectionLabel accent={NA} {...p} />;
const Heading = (p: { children: React.ReactNode; className?: string }) => <_Heading accent={NA} {...p} />;
const Lead = (p: { children: React.ReactNode }) => <_Lead accent={NA} {...p} />;
const P = (p: { children: React.ReactNode }) => <_P accent={NA} {...p} />;
const Highlight = ({ color, ...p }: { children: React.ReactNode; color?: HighlightColor; tooltip?: string }) => <_Highlight color={color ?? NA} {...p} />;
const Callout = ({ accent, ...p }: Parameters<typeof _Callout>[0]) => <_Callout accent={accent ?? NA} {...p} />;
const PullQuote = ({ children }: { children: React.ReactNode }) => <_PullQuote accent={NA}>{children}</_PullQuote>;
const SectionBreak = () => <_SectionBreak accent={NA} />;

/* The editorial v8 figure: no frame, no chrome, NO traffic-light dots — it lives
   in the shared primitive's bigram branch (numbered mono caption + single faint
   plane). Routing the local wrapper here removes the old window-dot decoration. */
const FigureWrapper = (p: { label: string; hint: string; children: React.ReactNode }) =>
    <_FigureWrapper accent={NA} {...p} />;

/* Inline equations go through the shared FormulaBlock (v8 .formula tokens:
   sunken bg-2 well, rule-2 hairline, mono accent equation, mono muted caption). */
const FormulaBlock = (p: { formula: string; caption: string }) =>
    <_FormulaBlock accent={NA} {...p} />;

/* ─────────────────────────────────────────────
   ExpandableSection · v8 ".xpand" disclosure

   The whole summary row is a card-like control (Don Norman affordance): an accent
   dot, a Source-Serif title, and an explicit expand/collapse pill ending in a +/−
   disc. States read by FILL, not by piling on borders. All color is --bigram-*,
   resolved under the [data-bigram-theme] scope, so no other chapter is touched.
   ───────────────────────────────────────────── */

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
        <div className="my-8">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                className={cn(
                    "group w-full flex items-center gap-3.5 text-left",
                    "rounded-[var(--bigram-r-md)] border px-[18px] py-4",
                    "border-[color:var(--bigram-rule)] bg-[color-mix(in_oklab,var(--bigram-ink)_3%,transparent)]",
                    "transition-colors duration-200",
                    "hover:bg-[var(--bigram-accent-soft)] hover:border-[color-mix(in_oklab,var(--bigram-accent)_32%,var(--bigram-rule))]",
                    "focus-visible:outline-none focus-visible:border-bigram-accent focus-visible:shadow-[0_0_0_3px_var(--bigram-accent-soft)]"
                )}
            >
                {/* accent dot */}
                <span className="shrink-0 w-[9px] h-[9px] rounded-full bg-bigram-accent" />
                {/* title — Source Serif, weight 600 */}
                <h3 className={cn(BIGRAM_SERIF, "flex-1 m-0 text-[19px] font-semibold leading-snug text-bigram-ink")}>
                    {title}
                </h3>
                {/* expand / collapse pill ending in a +/− disc */}
                <span
                    className={cn(
                        BIGRAM_MONO,
                        "shrink-0 inline-flex items-center gap-2 rounded-[var(--bigram-r-pill)]",
                        "pl-[13px] pr-1.5 py-1.5 text-[10.5px] uppercase tracking-[0.18em] text-bigram-accent",
                        "border border-[color-mix(in_oklab,var(--bigram-accent)_32%,var(--bigram-rule))]",
                        "bg-[color-mix(in_oklab,var(--bigram-accent)_8%,transparent)]",
                        "transition-colors duration-200 group-hover:bg-[color-mix(in_oklab,var(--bigram-accent)_16%,transparent)]"
                    )}
                >
                    {open ? "collapse" : "expand"}
                    <span className="inline-grid place-items-center w-[18px] h-[18px] rounded-full bg-bigram-accent text-[var(--bigram-on-accent)] text-[14px] font-bold leading-none">
                        {open ? "−" : "+"}
                    </span>
                </span>
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
                        <div className="pt-[22px] px-1">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Collapsible History Sidebar
   ───────────────────────────────────────────── */

function BigramHistorySidebar({ t }: { t: (key: string) => string }) {
    const [open, setOpen] = useState(false);

    /* Rainbow → green/sage family. Each era keeps a distinct step within the
       editorial-green scale (bright → accent → deep → sage), so the timeline still
       reads chronologically but never leaves the bigram palette. Tokens only. */
    const timelineEvents = [
        { year: "1913", dot: "var(--bigram-accent-bright)", label: "Markov Chains" },
        { year: "1948", dot: "var(--bigram-accent)", label: "Shannon's Bet" },
        { year: "1960s", dot: "var(--bigram-accent-2)", label: "First NLP" },
        { year: "2003", dot: "var(--bigram-sage)", label: "Neural LMs" },
    ];

    const eras = [
        { year: "1913", label: "Markov Chains", color: "var(--bigram-accent-bright)", p: "p1" },
        { year: "1948", label: "Shannon's Bet", color: "var(--bigram-accent)", p: "p2" },
        { year: "1960s", label: "First NLP", color: "var(--bigram-accent-2)", p: "p3" },
        { year: "2003", label: "Neural LMs", color: "var(--bigram-sage)", p: "p4" },
    ];

    return (
        <aside className="my-12 rounded-[var(--bigram-r-lg)] border border-[color:var(--bigram-rule-2)] bg-bigram-surface overflow-hidden relative">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-4 px-6 py-5 text-left group transition-colors duration-300 relative hover:bg-[var(--bigram-accent-soft)]"
            >
                <div className="shrink-0 grid place-items-center w-11 h-11 rounded-[var(--bigram-r-md)] bg-[var(--bigram-accent-soft)] ring-1 ring-[color-mix(in_oklab,var(--bigram-accent)_30%,transparent)] group-hover:ring-[color-mix(in_oklab,var(--bigram-accent)_50%,transparent)] transition-colors">
                    <History className="w-5 h-5 text-bigram-accent" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className={cn(BIGRAM_SERIF, "text-[17px] font-semibold text-bigram-ink mb-1 leading-snug")}>
                        {t("bigramNarrative.history.title")}
                    </p>
                    <p className={cn(BIGRAM_SERIF, "text-[14px] text-bigram-muted leading-relaxed")}>
                        {t("bigramNarrative.history.summary")}
                    </p>
                </div>
                <motion.div
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="shrink-0"
                >
                    <ChevronDown className="w-5 h-5 text-[color-mix(in_oklab,var(--bigram-accent)_70%,transparent)] group-hover:text-bigram-accent transition-colors" />
                </motion.div>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden bg-[color-mix(in_oklab,var(--bigram-surface)_55%,var(--bigram-bg))]"
                    >
                        <div className="px-6 pb-6 border-t border-[color:var(--bigram-rule)] pt-5">
                            <p className={cn(BIGRAM_MONO, "text-[10.5px] font-medium uppercase tracking-[0.18em] text-bigram-sage mb-6 text-center")}>
                                {t("bigramNarrative.history.subtitle")}
                            </p>

                            {/* Mini Timeline */}
                            <div className="mb-8 px-2">
                                <div className="relative">
                                    <div
                                        className="absolute left-0 right-0 top-4 h-px"
                                        style={{ background: "linear-gradient(to right, var(--bigram-accent-bright), var(--bigram-accent-2), var(--bigram-sage))", opacity: 0.45 }}
                                    />
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
                                                    className="w-8 h-8 rounded-full grid place-items-center"
                                                    style={{
                                                        background: event.dot,
                                                        boxShadow: "0 0 0 4px var(--bigram-bg)",
                                                    }}
                                                >
                                                    <div className="w-2 h-2 rounded-full bg-[var(--bigram-on-accent)]" />
                                                </div>
                                                <span className={cn(BIGRAM_MONO, "mt-2 text-[10px] font-medium text-bigram-muted whitespace-nowrap")}>
                                                    {event.year}
                                                </span>
                                                <span className={cn(BIGRAM_SERIF, "mt-1 text-[9px] text-bigram-dim text-center max-w-[60px] leading-tight")}>
                                                    {event.label}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Story paragraphs */}
                            <div className="space-y-5">
                                {eras.map((era, idx) => (
                                    <motion.div
                                        key={era.year}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.1 * (idx + 1) }}
                                        className="border-l-2 pl-4"
                                        style={{ borderColor: `color-mix(in oklab, ${era.color} 45%, transparent)` }}
                                    >
                                        <div className="flex items-baseline gap-3 mb-2">
                                            <span className={cn(BIGRAM_MONO, "text-2xl font-semibold shrink-0")} style={{ color: era.color }}>
                                                {era.year}
                                            </span>
                                            <span
                                                className={cn(BIGRAM_MONO, "text-xs uppercase tracking-wider font-medium")}
                                                style={{ color: `color-mix(in oklab, ${era.color} 75%, transparent)` }}
                                            >
                                                {era.label}
                                            </span>
                                        </div>
                                        <p className={cn(BIGRAM_SERIF, "text-[15px] text-bigram-body leading-relaxed")}>
                                            {t(`bigramNarrative.history.${era.p}`)}
                                        </p>
                                    </motion.div>
                                ))}
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
                accent="bigram"
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
                accent="bigram"
            />

            {/* ───────────────────── HERO ───────────────────── */}
            <header className="text-center mb-16 md:mb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    <span className={cn(BIGRAM_MONO, "inline-flex items-center gap-2.5 text-[12px] font-medium uppercase tracking-[0.18em] text-bigram-accent mb-7")}>
                        <BookOpen className="w-3.5 h-3.5" />
                        {t("bigramNarrative.hero.eyebrow")}
                    </span>

                    {/* Editorial Playfair hero — accent suffix italic, per the v8 spec.
                        Color resolves through [data-bigram-theme] so other chapters are untouched. */}
                    <h1 className={cn(BIGRAM_DISPLAY, "font-semibold text-bigram-ink tracking-[-0.018em] leading-[1.0] mb-7 text-balance", "text-[clamp(46px,7vw,92px)]")}>
                        {t("bigramNarrative.hero.titlePrefix")}{" "}
                        <span className="italic font-medium text-bigram-accent">
                            {t("bigramNarrative.hero.titleSuffix")}
                        </span>
                    </h1>

                    <p className={cn(BIGRAM_SERIF, "text-[clamp(20px,2.1vw,24px)] font-normal text-bigram-ink-2 leading-[1.5] max-w-2xl mx-auto mb-4 text-pretty")}>
                        {t("bigramNarrative.hero.description")}
                    </p>

                    <p className={cn(BIGRAM_MONO, "text-[11px] uppercase tracking-[0.14em] text-bigram-muted mb-8")}>
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
                    <FormulaBlock
                        formula="P(c_n \mid c_{n-1}) = \dfrac{\text{Count}(c_{n-1},\, c_n)}{\text{Count}(c_{n-1})}"
                        caption={t("bigramNarrative.coreIdea.formulaCaption")}
                    />
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
                                accent="bigram"
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

                <KeyTakeaway accent="bigram">
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
                    <FormulaBlock
                        formula="\text{softmax}(z_i) = \dfrac{e^{z_i}}{\sum_j e^{z_j}}"
                        caption={t("bigramNarrative.sampling.softmaxFormulaCaption")}
                    />
                    <P>{t("bigramNarrative.sampling.softmaxP2")}</P>
                    <FormulaBlock
                        formula="\text{softmax}(z_i / T) = \dfrac{e^{z_i / T}}{\sum_j e^{z_j / T}}"
                        caption={t("bigramNarrative.sampling.softmaxTempCaption")}
                    />
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

                <KeyTakeaway accent="bigram">
                    {t("bigramNarrative.keyTakeaways.fatalFlaw")}
                </KeyTakeaway>
            </Section>

            <SectionBreak />

            {/* ─────────── CTA (asymmetric — primary = next chapter) ───────────
               v8 editorial-green: tokens only. Primary is a calm surface card with
               an accent-soft icon well; the secondary is a quiet text-row. No teal,
               no neon glow — the green resolves through [data-bigram-theme]. */}
            <Section>
                <div className="text-center mb-10">
                    <h2 className={cn(BIGRAM_DISPLAY, "font-semibold text-bigram-ink tracking-[-0.012em] leading-[1.08] text-[clamp(28px,3.6vw,40px)] mb-3 text-balance")}>
                        {t("bigramNarrative.cta.title")}
                    </h2>
                </div>

                <div className="space-y-4">
                    {/* Primary CTA — next chapter */}
                    <Link href="/lab/ngram">
                        <motion.div
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="group relative w-full overflow-hidden rounded-[var(--bigram-r-lg)] border border-[color:var(--bigram-rule-2)] bg-bigram-surface p-8 text-left transition-colors duration-300 hover:border-[color-mix(in_oklab,var(--bigram-accent)_40%,var(--bigram-rule-2))]"
                        >
                            <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--bigram-accent-soft),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <div className="relative flex items-center gap-5">
                                <div className="shrink-0 grid place-items-center w-12 h-12 rounded-[var(--bigram-r-md)] bg-[var(--bigram-accent-soft)] ring-1 ring-[color-mix(in_oklab,var(--bigram-accent)_30%,transparent)] transition-[box-shadow] group-hover:ring-[color-mix(in_oklab,var(--bigram-accent)_50%,transparent)]">
                                    <ArrowRight className="w-6 h-6 text-bigram-accent" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className={cn(BIGRAM_SERIF, "block mb-1 text-[20px] font-semibold leading-snug text-bigram-ink tracking-tight")}>
                                        {t("bigramNarrative.cta.nextTitle")}
                                    </span>
                                    <p className={cn(BIGRAM_SERIF, "text-[15px] leading-relaxed text-bigram-muted")}>
                                        {t("bigramNarrative.cta.nextDesc")}
                                    </p>
                                </div>
                                <ArrowRight className="w-5 h-5 shrink-0 text-[color-mix(in_oklab,var(--bigram-accent)_55%,transparent)] transition-all group-hover:translate-x-0.5 group-hover:text-bigram-accent" />
                            </div>
                        </motion.div>
                    </Link>

                    {/* Secondary CTA — free lab */}
                    <motion.button
                        whileHover={{ scale: 1.005 }}
                        whileTap={{ scale: 0.995 }}
                        onClick={() => setMode("free")}
                        className="group relative w-full overflow-hidden rounded-[var(--bigram-r-md)] border border-[color:var(--bigram-rule)] bg-[color-mix(in_oklab,var(--bigram-ink)_3%,transparent)] p-5 text-left transition-colors duration-200 hover:border-[color-mix(in_oklab,var(--bigram-accent)_28%,var(--bigram-rule))] hover:bg-[var(--bigram-accent-soft)]"
                    >
                        <div className="relative flex items-center gap-4">
                            <div className="shrink-0 grid place-items-center w-9 h-9 rounded-[var(--bigram-r-sm)] bg-[var(--bigram-accent-soft)]">
                                <Beaker className="w-4 h-4 text-bigram-accent" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className={cn(BIGRAM_SERIF, "text-[15px] font-semibold text-bigram-ink-2")}>
                                    {t("bigramNarrative.cta.freeLabButton")}
                                </span>
                                <span className={cn(BIGRAM_SERIF, "ml-2 text-[13px] text-bigram-muted")}>
                                    {t("bigramNarrative.cta.freeLabDesc")}
                                </span>
                            </div>
                        </div>
                    </motion.button>
                </div>
            </Section>

            {/* ───────────────── FOOTER ───────────────── */}
            <FadeInView as="footer" className="mt-8 pt-12 border-t border-[color:var(--bigram-rule)] text-center">
                <div className={cn(BIGRAM_MONO, "flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-bigram-dim")}>
                    <FlaskConical className="h-3 w-3" />
                    {t("bigramNarrative.footer.brand")}
                </div>
            </FadeInView>
        </article>
    );
}