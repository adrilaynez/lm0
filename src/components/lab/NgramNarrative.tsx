"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    FlaskConical,
    ArrowDown,
    Lightbulb,
    AlertTriangle,
    ArrowRight,
    Beaker,
    BrainCircuit,
    ChevronDown,
} from "lucide-react";
import { ModeToggle } from "@/components/lab/ModeToggle";
import { useI18n } from "@/i18n/context";
import { useRouter } from "next/navigation";
import { useLabMode } from "@/context/LabModeContext";

import { NgramMiniTransitionTable } from "@/components/lab/NgramPedagogyPanels";
import { NgramFiveGramScale } from "@/components/lab/NgramPedagogyPanels";
import { CountingComparisonWidget } from "@/components/lab/CountingComparisonWidget";
import { ConcreteImprovementExample } from "@/components/lab/ConcreteImprovementExample";
import { ExponentialGrowthAnimator } from "@/components/lab/ExponentialGrowthAnimator";
import { NgramGenerationBattle } from "@/components/lab/NgramGenerationBattle";
import { GeneralizationFailureDemo } from "@/components/lab/GeneralizationFailureDemo";
import { StatisticalEraTimeline } from "@/components/lab/StatisticalEraTimeline";
import { CombinatoricExplosionTable } from "@/components/lab/CombinatoricExplosionTable";
import { SparsityHeatmap } from "@/components/lab/SparsityHeatmap";
import { InfiniteTableThoughtExperiment } from "@/components/lab/InfiniteTableThoughtExperiment";
import { TypoWordBreaker } from "@/components/lab/TypoWordBreaker";

/* ─────────────────────────────────────────────
   Primitive building blocks (matches Bigram / NN narrative style)
   ───────────────────────────────────────────── */

function Section({ children }: { children: React.ReactNode }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="mb-20 md:mb-28"
        >
            {children}
        </motion.section>
    );
}

function SectionLabel({ number, label }: { number: string; label: string }) {
    return (
        <div className="flex items-center gap-3 mb-8">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono font-bold text-amber-400">
                {number}
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white/25">
                {label}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-white/[0.06] to-transparent" />
        </div>
    );
}

function Heading({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="text-2xl md:text-[2rem] font-bold text-white tracking-tight mb-6 leading-tight">
            {children}
        </h2>
    );
}

function Lead({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-lg md:text-xl text-white/50 leading-[1.8] mb-6 font-light">
            {children}
        </p>
    );
}

function P({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[15px] md:text-base text-white/45 leading-[1.9] mb-5 last:mb-0">
            {children}
        </p>
    );
}

function Highlight({ children }: { children: React.ReactNode }) {
    return <strong className="text-amber-400 font-semibold">{children}</strong>;
}

function Callout({
    icon: Icon = Lightbulb,
    title,
    children,
}: {
    icon?: React.ComponentType<{ className?: string }>;
    title?: string;
    children: React.ReactNode;
}) {
    return (
        <motion.aside
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4 }}
            className="relative my-8 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-5 md:p-6 overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] to-transparent pointer-events-none" />
            <div className="relative flex gap-4">
                <div className="shrink-0 mt-0.5">
                    <Icon className="w-4.5 h-4.5 text-amber-400" />
                </div>
                <div className="min-w-0">
                    {title && (
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-amber-400 mb-2">
                            {title}
                        </p>
                    )}
                    <div className="text-sm text-white/50 leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0">
                        {children}
                    </div>
                </div>
            </div>
        </motion.aside>
    );
}

function PullQuote({ children }: { children: React.ReactNode }) {
    return (
        <motion.blockquote
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            className="my-10 md:my-12 pl-6 border-l-2 border-amber-400/40"
        >
            <p className="text-lg md:text-xl text-white/60 font-light italic leading-relaxed">
                {children}
            </p>
        </motion.blockquote>
    );
}

function SectionBreak() {
    return (
        <div className="flex items-center justify-center gap-3 my-16 md:my-20">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/[0.08]" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/[0.08]" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/[0.08]" />
        </div>
    );
}

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
                <h3 className="text-lg font-bold text-white flex-1 leading-snug">{title}</h3>
                <span className="shrink-0 text-[10px] font-mono uppercase tracking-widest text-white/25 group-hover:text-white/40 transition-colors mr-1">
                    {open ? t("ngramNarrative.ui.collapse") : t("ngramNarrative.ui.expand")}
                </span>
                <motion.div
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                >
                    <ChevronDown className="w-4 h-4 text-white/25 group-hover:text-white/50 transition-colors" />
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
        <motion.figure
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="my-12 md:my-16 -mx-4 sm:mx-0"
        >
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                    <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/40" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                        {label}
                    </span>
                </div>
                <div className="p-4 sm:p-6">{children}</div>
            </div>
            {hint && (
                <figcaption className="mt-3 text-center text-xs text-white/25 italic">
                    {hint}
                </figcaption>
            )}
        </motion.figure>
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

    return (
        <article className="max-w-[920px] mx-auto px-6 pt-8 pb-24">

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

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
                        {t("ngramNarrative.hero.titlePrefix")}{" "}
                        <span className="bg-gradient-to-r from-amber-400 to-orange-300 bg-clip-text text-transparent">
                            {t("ngramNarrative.hero.titleSuffix")}
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-white/35 max-w-xl mx-auto leading-relaxed mb-12">
                        {t("ngramNarrative.hero.description")}
                    </p>

                    <div className="flex justify-center mb-14">
                        <ModeToggle />
                    </div>

                    <motion.div
                        animate={{ y: [0, 6, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        className="text-white/10"
                    >
                        <ArrowDown className="w-5 h-5 mx-auto" />
                    </motion.div>
                </motion.div>
            </header>

            {/* ─────────── §1 · THE FIX: MORE CONTEXT ─────────── */}
            <Section>
                <SectionLabel number="01" label={t("ngramNarrative.moreContext.label")} />
                <Heading>{t("ngramNarrative.moreContext.title")}</Heading>

                <Lead>{t("ngramNarrative.moreContext.lead")}</Lead>

                <P>
                    {t("ngramNarrative.moreContext.p1")}{" "}
                    <Highlight>{t("ngramNarrative.moreContext.p1Highlight")}</Highlight>{" "}
                    {t("ngramNarrative.moreContext.p1End")}
                </P>

                <P>{t("ngramNarrative.moreContext.p2")}</P>
                <P>{t("ngramNarrative.moreContext.p3")}</P>

                <FigureWrapper
                    label={t("ngramNarrative.figures.contextWindow.label")}
                    hint={t("ngramNarrative.contextWindow.caption")}
                >
                    <ContextWindowVisualizer />
                </FigureWrapper>

                <Callout title={t("ngramNarrative.moreContext.calloutTitle")}>
                    <p>{t("ngramNarrative.moreContext.calloutText")}</p>
                </Callout>
            </Section>

            <SectionBreak />

            {/* ─────────── §2 · COUNTING WITH CONTEXT ─────────── */}
            <Section>
                <SectionLabel number="02" label={t("ngramNarrative.howItWorks.label")} />
                <Heading>{t("ngramNarrative.howItWorks.title")}</Heading>

                <Lead>{t("ngramNarrative.howItWorks.lead")}</Lead>

                <P>
                    {t("ngramNarrative.howItWorks.p1")}{" "}
                    <Highlight>{t("ngramNarrative.howItWorks.p1Highlight")}</Highlight>
                    {t("ngramNarrative.howItWorks.p1End")}
                </P>

                <P>{t("ngramNarrative.howItWorks.p2")}</P>

                <FigureWrapper
                    label={t("ngramNarrative.figures.transitionExamples.label")}
                    hint={t("ngramNarrative.figures.transitionExamples.hint")}
                >
                    <NgramMiniTransitionTable n={contextSize} />
                </FigureWrapper>

                <P>{t("ngramNarrative.howItWorks.bridge")}</P>

                <FigureWrapper
                    label={t("ngramNarrative.figures.countingComparison.label")}
                    hint={t("ngramNarrative.figures.countingComparison.hint")}
                >
                    <CountingComparisonWidget />
                </FigureWrapper>
            </Section>

            <SectionBreak />

            {/* ─────────── §3 · THE PREDICTION GETS BETTER ─────────── */}
            <Section>
                <SectionLabel number="03" label={t("ngramNarrative.improvement.label")} />
                <Heading>{t("ngramNarrative.improvement.title")}</Heading>

                <Lead>{t("ngramNarrative.improvement.lead")}</Lead>

                <P>{t("ngramNarrative.improvement.example")}</P>

                <FigureWrapper
                    label={t("ngramNarrative.figures.confidenceImprovement.label")}
                    hint={t("ngramNarrative.figures.confidenceImprovement.hint")}
                >
                    <ConcreteImprovementExample />
                </FigureWrapper>

                <FigureWrapper
                    label={t("ngramNarrative.figures.generationBattle.label")}
                    hint={t("ngramNarrative.figures.generationBattle.hint")}
                >
                    <NgramGenerationBattle
                        seeds={["the "]}
                        nValues={[1, 2, 3, 4]}
                        maxTokens={80}
                        temperature={0.8}
                        autoGenerate
                    />
                </FigureWrapper>
            </Section>

            {/* ─────────── §3.5 · WHY NOT N=100? ─────────── */}
            <Section>
                <Heading>{t("ngramNarrative.whyNotMore.title")}</Heading>
                <Lead>{t("ngramNarrative.whyNotMore.lead")}</Lead>
                <P>{t("ngramNarrative.whyNotMore.p1")}</P>
            </Section>

            <SectionBreak />

            {/* ─────────── §4 · THE PRICE OF MEMORY ─────────── */}
            <Section>
                <SectionLabel number="04" label={t("ngramNarrative.complexity.label")} />
                <Heading>{t("ngramNarrative.complexity.title")}</Heading>

                <Lead>{t("ngramNarrative.complexity.lead")}</Lead>

                <P>{t("ngramNarrative.complexity.p1")}</P>

                <FigureWrapper
                    label={t("ngramNarrative.figures.exponentialGrowth.label")}
                    hint={t("ngramNarrative.figures.exponentialGrowth.hint")}
                >
                    <ExponentialGrowthAnimator />
                </FigureWrapper>

                <P>{t("ngramNarrative.complexity.p2")}</P>

                <FigureWrapper
                    label={t("ngramNarrative.figures.sparsityHeatmap.label")}
                    hint={t("ngramNarrative.figures.sparsityHeatmap.hint")}
                >
                    <SparsityHeatmap />
                </FigureWrapper>

                <div className="my-10">
                    <NgramFiveGramScale vocabSize={vocabSize} />
                </div>

                <Callout icon={AlertTriangle} title={t("ngramNarrative.complexity.vocabCalloutTitle")}>
                    <p>{t("ngramNarrative.complexity.vocabCalloutText")}</p>
                </Callout>

                <P>{t("ngramNarrative.tokenization.intro")}</P>

                <ExpandableSection title={t("ngramNarrative.tokenization.subsectionTitle")}>

                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                <h4 className="text-base font-bold text-emerald-400">
                                    {t("ngramNarrative.tokenization.charTitle")}
                                </h4>
                            </div>
                            <p className="text-sm text-white/50 leading-relaxed mb-3">
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
                            <p className="text-sm text-white/50 leading-relaxed mb-3">
                                {t("ngramNarrative.tokenization.wordDesc")}
                            </p>
                            <p className="text-xs text-rose-400/60 font-mono">
                                {t("ngramNarrative.tokenization.wordExample")}
                            </p>
                        </div>
                    </div>

                    <P>{t("ngramNarrative.tokenization.explosionIntro")}</P>

                    <FigureWrapper
                        label={t("ngramNarrative.tokenization.tableLabel")}
                        hint={t("ngramNarrative.tokenization.tableHint")}
                    >
                        <CombinatoricExplosionTable vocabSize={50000} />
                    </FigureWrapper>

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

            {/* ─────────── §5 · THE DEEPER PROBLEM ─────────── */}
            <Section>
                <SectionLabel number="05" label={t("ngramNarrative.deeperProblem.label")} />
                <Heading>{t("ngramNarrative.deeperProblem.title")}</Heading>

                <Lead>{t("ngramNarrative.deeperProblem.lead")}</Lead>

                <P>{t("ngramNarrative.deeperProblem.p1")}</P>
                <P>{t("ngramNarrative.deeperProblem.p2")}</P>
                <P>{t("ngramNarrative.deeperProblem.p3")}</P>

                <FigureWrapper
                    label={t("ngramNarrative.figures.generalizationFailure.label")}
                    hint={t("ngramNarrative.figures.generalizationFailure.hint")}
                >
                    <GeneralizationFailureDemo />
                </FigureWrapper>

                {/* V2: Infinite Table Thought Experiment — interactive slider */}
                <FigureWrapper
                    label={t("ngramNarrative.figures.infiniteTable.label")}
                    hint={t("ngramNarrative.figures.infiniteTable.hint")}
                >
                    <InfiniteTableThoughtExperiment />
                </FigureWrapper>

                {/* V3: Typo / Novel Word Breaker — interactive input */}
                <FigureWrapper
                    label={t("ngramNarrative.figures.typoBreaker.label")}
                    hint={t("ngramNarrative.figures.typoBreaker.hint")}
                >
                    <TypoWordBreaker />
                </FigureWrapper>

                <Callout icon={AlertTriangle} title={t("ngramNarrative.deeperProblem.calloutTitle")}>
                    <p>{t("ngramNarrative.deeperProblem.calloutText")}</p>
                </Callout>
            </Section>

            <SectionBreak />

            {/* ─────────── §6 · THE END OF COUNTING ─────────── */}
            <Section>
                <SectionLabel number="06" label={t("ngramNarrative.endOfCounting.label")} />
                <Heading>{t("ngramNarrative.endOfCounting.title")}</Heading>

                <Lead>{t("ngramNarrative.endOfCounting.lead")}</Lead>

                <P>{t("ngramNarrative.endOfCounting.p1")}</P>
                <P>{t("ngramNarrative.endOfCounting.p2")}</P>
                <P>{t("ngramNarrative.endOfCounting.p3")}</P>

                <FigureWrapper
                    label={t("ngramNarrative.figures.statisticalEra.label")}
                    hint={t("ngramNarrative.figures.statisticalEra.hint")}
                >
                    <StatisticalEraTimeline />
                </FigureWrapper>

                <PullQuote>{t("ngramNarrative.endOfCounting.quote")}</PullQuote>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center text-sm text-amber-300/50 italic font-light mt-2"
                >
                    {t("ngramNarrative.endOfCounting.hookLine")}
                </motion.p>
            </Section>

            <SectionBreak />

            {/* ─────────── CTA ─────────── */}
            <Section>
                <div className="text-center mb-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-3">
                        {t("ngramNarrative.cta.title")}
                    </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setMode("free")}
                        className="group relative rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-black/60 p-6 text-left transition-colors hover:border-amber-500/40 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-xl bg-amber-500/15">
                                    <Beaker className="w-5 h-5 text-amber-300" />
                                </div>
                                <span className="text-lg font-bold text-white">
                                    {t("ngramNarrative.cta.labButton")}
                                </span>
                            </div>
                            <p className="text-sm text-white/45 leading-relaxed">
                                {t("ngramNarrative.cta.labDesc")}
                            </p>
                        </div>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push("/lab/neural-networks")}
                        className="group relative rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-950/20 to-black/60 p-6 text-left transition-colors hover:border-rose-500/40 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-xl bg-rose-500/15">
                                    <BrainCircuit className="w-5 h-5 text-rose-300" />
                                </div>
                                <span className="text-lg font-bold text-white">
                                    {t("ngramNarrative.cta.neuralButton")}
                                </span>
                            </div>
                            <p className="text-sm text-white/45 leading-relaxed">
                                {t("ngramNarrative.cta.neuralDesc")}
                            </p>
                        </div>
                    </motion.button>
                </div>
            </Section>

            {/* ───────────────── FOOTER ───────────────── */}
            <motion.footer
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="mt-8 pt-12 border-t border-white/[0.06] text-center"
            >
                <p className="text-sm text-white/25 italic max-w-md mx-auto leading-relaxed mb-10">
                    {t("ngramNarrative.footer.text")}
                </p>
                <div className="flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/10">
                    <FlaskConical className="h-3 w-3" />
                    {t("ngramNarrative.footer.brand")}
                </div>
            </motion.footer>
        </article>
    );
}
