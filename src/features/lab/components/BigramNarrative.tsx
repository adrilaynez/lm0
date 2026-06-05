"use client";

import { lazy } from "react";

import { motion } from "framer-motion";
import { ArrowRight, Beaker, FlaskConical } from "lucide-react";

import BigramEn from "@/content/lab/bigram.en.mdx";
import BigramEs from "@/content/lab/bigram.es.mdx";
import { BigramSideRail } from "@/features/lab/components/BigramSideRail";
import { ContinueToast } from "@/features/lab/components/ContinueToast";
import { FadeInView } from "@/features/lab/components/FadeInView";
import { labMdxComponents } from "@/features/lab/components/mdx/labMdxComponents";
import { ModeToggle } from "@/features/lab/components/ModeToggle";
import { useLabMode } from "@/features/lab/context/LabModeContext";
import { useProgressTracker } from "@/features/lab/hooks/useProgressTracker";
import type { TrainingViz, TransitionMatrixViz } from "@/features/lab/types/lmLab";
import { useI18n } from "@/i18n/context";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/* Bigram type families (Playfair display · Source Serif body · JetBrains Mono data),
   resolved through the [data-bigram-theme] font tokens defined in globals.css. */
const BIGRAM_DISPLAY = "font-[family-name:var(--bigram-font-display)]";
const BIGRAM_SERIF = "font-[family-name:var(--bigram-font-serif)]";
const BIGRAM_MONO = "font-[family-name:var(--bigram-font-mono)]";

/* ─── Lazy-loaded interactive visualizers (one concept each), injected into the MDX ─── */
const FillTheBlank = lazy(() => import("@/features/lab/components/FillTheBlank").then(m => ({ default: m.FillTheBlank })));
const HeroAutoComplete = lazy(() => import("@/features/lab/components/HeroAutoComplete").then(m => ({ default: m.HeroAutoComplete })));
const PairHighlighter = lazy(() => import("@/features/lab/components/PairHighlighter").then(m => ({ default: m.PairHighlighter })));
const IsolateT = lazy(() => import("@/features/lab/components/IsolateT").then(m => ({ default: m.IsolateT })));
const RowTally = lazy(() => import("@/features/lab/components/RowTally").then(m => ({ default: m.RowTally })));
const GrowingMatrix27 = lazy(() => import("@/features/lab/components/GrowingMatrix27").then(m => ({ default: m.GrowingMatrix27 })));
const TinyMatrixExample = lazy(() => import("@/features/lab/components/TinyMatrixExample").then(m => ({ default: m.TinyMatrixExample })));
const DetectiveMatrix = lazy(() => import("@/features/lab/components/DetectiveMatrix").then(m => ({ default: m.DetectiveMatrix })));
const NormalizationVisualizer = lazy(() => import("@/features/lab/components/NormalizationVisualizer").then(m => ({ default: m.NormalizationVisualizer })));
const AlwaysMaxLoop = lazy(() => import("@/features/lab/components/AlwaysMaxLoop").then(m => ({ default: m.AlwaysMaxLoop })));
const LoadedDie = lazy(() => import("@/features/lab/components/LoadedDie").then(m => ({ default: m.LoadedDie })));
const LetterByLetter = lazy(() => import("@/features/lab/components/LetterByLetter").then(m => ({ default: m.LetterByLetter })));
const TableWriter = lazy(() => import("@/features/lab/components/TableWriter").then(m => ({ default: m.TableWriter })));
const ContextBlindnessDemo = lazy(() => import("@/features/lab/components/ContextBlindnessDemo").then(m => ({ default: m.ContextBlindnessDemo })));
const ShannonContextLadder = lazy(() => import("@/features/lab/components/ShannonContextLadder").then(m => ({ default: m.ShannonContextLadder })));

/* ─── Bigram-specific editorial components used inside the MDX ─── */

/* The naming moment ("…has a name: a bigram model"): quiet serif lead, oversized
   accent display word, serif coda. Pulled into the MDX as <Reveal lead word coda />. */
function Reveal({ lead, word, coda }: { lead: string; word: string; coda: string }) {
    return (
        <FadeInView className="my-12 text-center">
            <p className={cn(BIGRAM_SERIF, "text-[clamp(19px,2vw,22px)] text-bigram-ink-2 mb-3")}>{lead}</p>
            <p
                className={cn(BIGRAM_DISPLAY, "italic text-bigram-accent")}
                style={{ fontWeight: 600, fontSize: "clamp(40px,6.4vw,72px)", lineHeight: 1.04, letterSpacing: "-0.018em" }}
            >
                {word}
            </p>
            <p className={cn(BIGRAM_SERIF, "mt-5 text-[clamp(17px,1.9vw,20px)] text-bigram-body leading-relaxed max-w-[34em] mx-auto text-pretty")}>
                {coda}
            </p>
        </FadeInView>
    );
}

/* Shannon's real 1948 output as a specimen — a distinct element, not another paragraph. */
function Specimen({ children }: { children: React.ReactNode }) {
    return (
        <blockquote
            className={cn(
                BIGRAM_MONO,
                "my-7 mx-auto max-w-[46ch] rounded-[var(--bigram-r-md)] bg-bigram-bg-2 px-6 py-5 text-center text-[clamp(13px,1.5vw,16px)] leading-[1.7] tracking-[0.04em] text-bigram-accent-ink",
            )}
            style={{ boxShadow: "inset 0 0 0 1px var(--bigram-rule-2)", borderLeft: "2px solid var(--bigram-accent)" }}
        >
            “{children}”
        </blockquote>
    );
}

/* The chapter's widgets + bespoke components, injected into the shared MDX component map. */
const BIGRAM_WIDGETS = {
    FillTheBlank,
    HeroAutoComplete,
    PairHighlighter,
    IsolateT,
    RowTally,
    GrowingMatrix27,
    TinyMatrixExample,
    DetectiveMatrix,
    NormalizationVisualizer,
    AlwaysMaxLoop,
    LoadedDie,
    LetterByLetter,
    TableWriter,
    ContextBlindnessDemo,
    ShannonContextLadder,
    Reveal,
    Specimen,
} as unknown as Record<string, React.ComponentType<Record<string, unknown>>>;

/* ─────────────────────────────────────────────
   Main narrative component — a thin shell: hero + side-rail + CTA + footer in TSX,
   the chapter body authored in bigram.{es,en}.mdx and rendered through the shared
   MDX component map. (The body's prose, widgets and expandables all live in the .mdx.)
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

export function BigramNarrative(props: BigramNarrativeProps) {
    // VIS 11 now generates LOCALLY (TableWriter); the page's generation props are accepted for
    // compatibility but no longer used by the narrative.
    void props;
    const { t, language } = useI18n();
    const { setMode } = useLabMode();
    const { hasStoredProgress, storedSection, clearProgress } = useProgressTracker("bigram");

    const Body = language === "es" ? BigramEs : BigramEn;
    const mdxComponents = labMdxComponents("bigram", BIGRAM_WIDGETS, {
        open: language === "es" ? "leer" : "read",
        close: language === "es" ? "cerrar" : "close",
    });

    /* Hero title — accent the final word ("Bigrama") in italic, per the editorial spec. */
    const heroTitle = t("bigramNarrative.v2.hero.title");
    const titleWords = heroTitle.split(" ");
    const titleLast = titleWords.length > 1 ? titleWords.pop()! : heroTitle;
    const titleFirst = titleWords.length ? titleWords.join(" ") : "";

    return (
        <article className="relative z-[1] max-w-[880px] mx-auto px-7 pt-8 pb-24">
            <ContinueToast
                accent="bigram"
                hasStoredProgress={hasStoredProgress}
                storedSection={storedSection}
                clearProgress={clearProgress}
                sectionNames={{
                    "bigram-01": t("bigramNarrative.v2.sectionNames.s01"),
                    "bigram-02": t("bigramNarrative.v2.sectionNames.s02"),
                    "bigram-03": t("bigramNarrative.v2.sectionNames.s03"),
                    "bigram-04": t("bigramNarrative.v2.sectionNames.s04"),
                    "bigram-05": t("bigramNarrative.v2.sectionNames.s05"),
                    "bigram-06": t("bigramNarrative.v2.sectionNames.s06"),
                }}
            />
            <BigramSideRail
                sections={[
                    { id: "bigram-01", label: "01", name: t("bigramNarrative.v2.sectionKickers.s1"), weight: 2.2 },
                    { id: "bigram-02", label: "02", name: t("bigramNarrative.v2.sectionKickers.s2"), weight: 3.2 },
                    { id: "bigram-03", label: "03", name: t("bigramNarrative.v2.sectionKickers.s3"), weight: 2.6 },
                    { id: "bigram-04", label: "04", name: t("bigramNarrative.v2.sectionKickers.s4"), weight: 3.0 },
                    { id: "bigram-05", label: "05", name: t("bigramNarrative.v2.sectionKickers.s5"), weight: 2.8 },
                    { id: "bigram-06", label: "06", name: t("bigramNarrative.v2.sectionKickers.s6"), weight: 2.2 },
                ]}
            />

            {/* ───────────────────── HERO · §0 Escribir es adivinar ───────────────────── */}
            <header className="text-left pt-8 md:pt-16 mb-16 md:mb-20">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                    <span className={cn(BIGRAM_MONO, "inline-flex items-center gap-3 text-[12px] font-medium uppercase tracking-[0.18em] text-bigram-accent mb-8")}>
                        <span className="inline-block h-px w-[34px] bg-bigram-accent opacity-60" aria-hidden />
                        {t("bigramNarrative.v2.hero.eyebrow")}
                    </span>

                    <h1
                        className={cn(BIGRAM_DISPLAY, "text-bigram-ink mb-7 text-balance")}
                        style={{
                            fontWeight: 800,
                            fontSize: "clamp(54px, 8.6vw, 112px)",
                            lineHeight: 0.95,
                            letterSpacing: "clamp(-2.6px, calc(1.4px - 0.32vw), -0.5px)",
                        }}
                    >
                        {titleFirst && <>{titleFirst}{" "}</>}
                        <span className="italic text-bigram-accent" style={{ fontWeight: 600, letterSpacing: "-0.018em" }}>
                            {titleLast}
                        </span>
                    </h1>

                    <p className={cn(BIGRAM_SERIF, "text-[clamp(21px,2.2vw,25px)] font-normal text-bigram-ink-2 leading-[1.5] max-w-[33em] mb-9 text-pretty")}>
                        {t("bigramNarrative.v2.hero.subtitle")}
                    </p>

                    <div className="flex justify-start">
                        <div className="max-w-xs"><ModeToggle /></div>
                    </div>
                </motion.div>
            </header>

            {/* ═══════════ Chapter body — authored in bigram.{es,en}.mdx ═══════════ */}
            <Body components={mdxComponents} />

            <div className="my-12 md:my-16" aria-hidden />

            {/* ─────────── CTA · puente al n-gram (asimétrico) ─────────── */}
            <section className="mb-20 md:mb-28">
                <div className="space-y-4">
                    {/* Primary — the bridge to the next chapter. Editorial, inviting, alive on hover. */}
                    <Link href={t("bigramNarrative.v2.cta.primaryHref")} className="block focus:outline-none">
                        <motion.div
                            whileHover={{ y: -4 }}
                            whileTap={{ scale: 0.992 }}
                            transition={{ type: "spring", stiffness: 320, damping: 26 }}
                            className="group relative w-full overflow-hidden rounded-[var(--bigram-r-lg)] border border-[color:var(--bigram-rule-2)] bg-bigram-surface px-7 py-8 sm:px-10 sm:py-10 transition-[border-color,box-shadow] duration-300 hover:border-[color-mix(in_oklab,var(--bigram-accent)_55%,transparent)] hover:shadow-[0_26px_50px_-26px_color-mix(in_oklab,var(--bigram-accent)_60%,transparent)]"
                        >
                            {/* accent bloom from the top-right corner */}
                            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(130%_150%_at_100%_0%,var(--bigram-accent-soft),transparent_58%)] opacity-50 transition-opacity duration-500 group-hover:opacity-100" />
                            {/* oversized faded chapter numeral, an editorial flourish */}
                            <span aria-hidden className={cn(BIGRAM_DISPLAY, "pointer-events-none absolute -top-9 right-2 select-none text-[150px] font-bold leading-none text-[color-mix(in_oklab,var(--bigram-accent)_7%,transparent)]")}>2</span>
                            {/* a light sheen that sweeps across on hover */}
                            <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/4 -translate-x-[160%] -skew-x-12 bg-[linear-gradient(90deg,transparent,color-mix(in_oklab,var(--bigram-accent)_12%,transparent),transparent)] transition-transform duration-[900ms] ease-out group-hover:translate-x-[460%]" />

                            <div className="relative">
                                <div className="mb-4 flex items-center gap-3">
                                    <span className={cn(BIGRAM_MONO, "text-[10.5px] uppercase tracking-[0.22em] text-bigram-accent")}>
                                        {t("bigramNarrative.v2.cta.primaryKicker")}
                                    </span>
                                    <span aria-hidden className="h-px w-8 bg-[color-mix(in_oklab,var(--bigram-accent)_40%,transparent)]" />
                                    <span className={cn(BIGRAM_MONO, "text-[10.5px] uppercase tracking-[0.14em] text-bigram-muted")}>
                                        {t("bigramNarrative.v2.cta.primaryChapter")}
                                    </span>
                                </div>
                                <h3 className={cn(BIGRAM_SERIF, "max-w-[30ch] text-[clamp(21px,2.6vw,28px)] font-semibold leading-[1.2] tracking-tight text-bigram-ink")}>
                                    {t("bigramNarrative.v2.cta.primaryTitle")}
                                </h3>
                                <p className={cn(BIGRAM_SERIF, "mt-2.5 max-w-[48ch] text-[15px] leading-relaxed text-bigram-muted")}>
                                    {t("bigramNarrative.v2.cta.primaryDesc")}
                                </p>
                                <div className="mt-7 inline-flex items-center gap-3.5">
                                    <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--bigram-accent)] text-[var(--bigram-on-accent)] shadow-[0_10px_22px_-10px_color-mix(in_oklab,var(--bigram-accent)_75%,transparent)] transition-colors duration-300 group-hover:bg-[var(--bigram-accent-bright)]">
                                        <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5" />
                                    </span>
                                    <span className={cn(BIGRAM_MONO, "text-[12px] font-semibold uppercase tracking-[0.16em] text-bigram-accent")}>
                                        {t("bigramNarrative.v2.cta.primaryCue")}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </Link>

                    {/* Secondary — the quiet escape to the free lab */}
                    <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.995 }}
                        transition={{ type: "spring", stiffness: 320, damping: 26 }}
                        onClick={() => setMode("free")}
                        className="group relative flex w-full items-center gap-4 overflow-hidden rounded-[var(--bigram-r-md)] border border-[color:var(--bigram-rule)] bg-[color-mix(in_oklab,var(--bigram-ink)_3%,transparent)] px-5 py-4 text-left transition-colors duration-200 hover:border-[color-mix(in_oklab,var(--bigram-accent)_30%,var(--bigram-rule))] hover:bg-[var(--bigram-accent-soft)]"
                    >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--bigram-r-sm)] bg-[var(--bigram-accent-soft)] text-bigram-accent transition-colors group-hover:bg-[color-mix(in_oklab,var(--bigram-accent)_22%,transparent)]">
                            <Beaker className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className={cn(BIGRAM_SERIF, "text-[15px] font-semibold text-bigram-ink-2")}>
                                {t("bigramNarrative.v2.cta.secondaryLabel")}
                            </span>
                            <span className={cn(BIGRAM_SERIF, "ml-2 text-[13px] text-bigram-muted")}>
                                {t("bigramNarrative.v2.cta.secondaryDesc")}
                            </span>
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 -translate-x-1 text-[color-mix(in_oklab,var(--bigram-accent)_50%,transparent)] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                    </motion.button>
                </div>
            </section>

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
