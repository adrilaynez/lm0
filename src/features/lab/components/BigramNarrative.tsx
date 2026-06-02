"use client";

import { lazy, Suspense, useState } from "react";
import Link from "next/link";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Beaker, ChevronDown, FlaskConical } from "lucide-react";

import { BigramSideRail } from "@/features/lab/components/BigramSideRail";
import { ContinueToast } from "@/features/lab/components/ContinueToast";
import { FadeInView } from "@/features/lab/components/FadeInView";
import { LazySection, SectionSkeleton } from "@/features/lab/components/LazySection";
import { ModeToggle } from "@/features/lab/components/ModeToggle";
import { SectionAnchor } from "@/features/lab/components/SectionAnchor";
import { useLabMode } from "@/features/lab/context/LabModeContext";
import { useProgressTracker } from "@/features/lab/hooks/useProgressTracker";
import type { TrainingViz, TransitionMatrixViz } from "@/features/lab/types/lmLab";
import { useI18n } from "@/i18n/context";
import { en } from "@/i18n/en";
import { es } from "@/i18n/es";
import { cn } from "@/lib/utils";

/* Bigram type families (Playfair display · Source Serif body · JetBrains Mono data),
   resolved through the [data-bigram-theme] font tokens defined in globals.css. */
const BIGRAM_DISPLAY = "font-[family-name:var(--bigram-font-display)]";
const BIGRAM_SERIF = "font-[family-name:var(--bigram-font-serif)]";
const BIGRAM_MONO = "font-[family-name:var(--bigram-font-mono)]";

/* ─── Lazy-loaded interactive visualizers (one concept each) ─── */
const FillTheBlank = lazy(() => import("@/features/lab/components/FillTheBlank").then(m => ({ default: m.FillTheBlank })));
const HeroAutoComplete = lazy(() => import("@/features/lab/components/HeroAutoComplete").then(m => ({ default: m.HeroAutoComplete })));
const PairHighlighter = lazy(() => import("@/features/lab/components/PairHighlighter").then(m => ({ default: m.PairHighlighter })));
const IsolateT = lazy(() => import("@/features/lab/components/IsolateT").then(m => ({ default: m.IsolateT })));const RowTally = lazy(() => import("@/features/lab/components/RowTally").then(m => ({ default: m.RowTally })));
const GrowingMatrix27 = lazy(() => import("@/features/lab/components/GrowingMatrix27").then(m => ({ default: m.GrowingMatrix27 })));
const TinyMatrixExample = lazy(() => import("@/features/lab/components/TinyMatrixExample").then(m => ({ default: m.TinyMatrixExample })));const DetectiveMatrix = lazy(() => import("@/features/lab/components/DetectiveMatrix").then(m => ({ default: m.DetectiveMatrix })));
const NormalizationVisualizer = lazy(() => import("@/features/lab/components/NormalizationVisualizer").then(m => ({ default: m.NormalizationVisualizer })));
const AlwaysMaxLoop = lazy(() => import("@/features/lab/components/AlwaysMaxLoop").then(m => ({ default: m.AlwaysMaxLoop })));
const LoadedDie = lazy(() => import("@/features/lab/components/LoadedDie").then(m => ({ default: m.LoadedDie })));
const LetterByLetter = lazy(() => import("@/features/lab/components/LetterByLetter").then(m => ({ default: m.LetterByLetter })));
const TableWriter = lazy(() => import("@/features/lab/components/TableWriter").then(m => ({ default: m.TableWriter })));
const ContextBlindnessDemo = lazy(() => import("@/features/lab/components/ContextBlindnessDemo").then(m => ({ default: m.ContextBlindnessDemo })));
const ShannonContextLadder = lazy(() => import("@/features/lab/components/ShannonContextLadder").then(m => ({ default: m.ShannonContextLadder })));

import {
    Heading as _Heading,
    Lead as _Lead, type NarrativeAccent,
    P as _P,
    Section,
    SectionBreak as _SectionBreak,
    SectionLabel as _SectionLabel,
} from "./narrative-primitives";

/* ─── Accent-bound wrappers ───
   Every shared primitive opts into the editorial-green accent. The green resolves
   through the [data-bigram-theme] scope on the page wrapper, so no other chapter
   is affected. */
const NA: NarrativeAccent = "bigram";
const SectionLabel = (p: { number: string; label: string }) => <_SectionLabel accent={NA} {...p} />;
const Heading = (p: { children: React.ReactNode; className?: string }) => <_Heading accent={NA} {...p} />;
const Lead = (p: { children: React.ReactNode }) => <_Lead accent={NA} {...p} />;
const SectionBreak = () => <_SectionBreak accent={NA} />;

/* Body paragraph. Routed through innerHTML so the v2 copy's inline <strong>/<em>
   accents (e.g. "tabla de transición", "texto de entrenamiento") render as the
   editorial accent rather than as literal tags. The copy is authored in-repo
   (i18n), never user input. */
const RICH =
    "[&_strong]:text-bigram-accent-ink [&_strong]:font-semibold [&_em]:italic [&_em]:text-bigram-accent-ink";
function P({ html }: { html: string }) {
    return (
        <_P accent={NA}>
            <span className={RICH} dangerouslySetInnerHTML={{ __html: html }} />
        </_P>
    );
}

/* The Markov history, told in paragraphs (an opt-in aside, so it can run long). The paragraph
   array is read straight from the active dictionary — t() returns strings only. */
function MarkovStory() {
    const { language } = useI18n();
    const dict = (language === "es" ? es : en) as typeof en;
    const paras = dict.bigramNarrative.v2.markov.paras;
    return (
        <>
            {paras.map((para, i) => (
                <P key={i} html={para} />
            ))}
        </>
    );
}

/* The single faint interactive plane — the only "this is interactive" signal.
   No frame, no chrome, no traffic-light dots. Self-captioning widgets render
   their own label inside; the surrounding prose is the editorial caption. */
function Plane({ children }: { children: React.ReactNode }) {
    return (
        <LazySection>
            <div className="my-10 md:my-14 -mx-2 sm:mx-0 rounded-[var(--bigram-r-md)] bg-[color-mix(in_oklab,var(--bigram-surface)_55%,var(--bigram-bg))] px-4 py-7 sm:px-7 sm:py-8">
                <Suspense fallback={<SectionSkeleton />}>{children}</Suspense>
            </div>
        </LazySection>
    );
}

/* Skeleton marker. `ok` → the real widget; `rework` → the real widget with a small "to redo" tag;
   `todo` → a dashed placeholder for a widget not built yet. Lets the whole chapter skeleton render
   end-to-end so we can see exactly what is done, what is pending, and what is missing. */
function Slot({ tag, status = "ok", children }: { tag?: string; status?: "ok" | "rework" | "todo"; children?: React.ReactNode }) {
    if (status === "todo") {
        return (
            <LazySection>
                <div className="my-10 md:my-14 rounded-[var(--bigram-r-md)] border border-dashed border-[color-mix(in_oklab,var(--bigram-accent)_38%,var(--bigram-rule))] bg-[color-mix(in_oklab,var(--bigram-accent)_5%,transparent)] px-6 py-12 text-center">
                    <span className={cn(BIGRAM_MONO, "text-[11px] uppercase tracking-[0.2em] text-bigram-accent")}>⬜ Por resolver</span>
                    {tag && <p className={cn(BIGRAM_SERIF, "mx-auto mt-2 max-w-[42ch] text-[15px] text-bigram-muted")}>{tag}</p>}
                </div>
            </LazySection>
        );
    }
    return (
        <>
            {status === "rework" && tag && (
                <div className={cn(BIGRAM_MONO, "mt-9 -mb-1 text-[10.5px] uppercase tracking-[0.16em] text-[color-mix(in_oklab,var(--bigram-accent)_72%,var(--bigram-muted))]")}>
                    🔧 Rehacer · {tag}
                </div>
            )}
            <Plane>{children}</Plane>
        </>
    );
}

/* ─────────────────────────────────────────────
   ExpandableSection · history "plegable"
   Optional depth at the right emotional moment (Markov §4, Shannon §5). The
   whole summary row is a card-like control: accent dot, serif title, +/− disc.
   States read by FILL, not by piling on borders. Tokens only.
   ───────────────────────────────────────────── */
function ExpandableSection({
    title,
    kicker,
    children,
    defaultOpen = false,
}: {
    title: string;
    kicker?: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="my-9">
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
                <span className="shrink-0 w-[9px] h-[9px] rounded-full bg-bigram-accent" />
                <div className="flex-1 min-w-0">
                    {kicker && (
                        <span className={cn(BIGRAM_MONO, "block mb-1 text-[10px] uppercase tracking-[0.2em] text-bigram-accent")}>
                            {kicker}
                        </span>
                    )}
                    <h3 className={cn(BIGRAM_SERIF, "m-0 text-[18px] font-semibold leading-snug text-bigram-ink")}>
                        {title}
                    </h3>
                </div>
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
                    {open ? "cerrar" : "leer"}
                    <span className="inline-grid place-items-center w-[18px] h-[18px] rounded-full bg-bigram-accent text-[var(--bigram-on-accent)] leading-none">
                        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
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
                        <div className="pt-[20px] px-1">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
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

export function BigramNarrative(props: BigramNarrativeProps) {
    // VIS 11 now generates LOCALLY (TableWriter); the page's generation props are accepted for
    // compatibility but no longer used by the narrative.
    void props;
    const { t } = useI18n();
    const { setMode } = useLabMode();
    const { hasStoredProgress, storedSection, clearProgress } = useProgressTracker("bigram");

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

            {/* ═══════════ §1 · El truco: predecir (toda la intro vive aquí) ═══════════ */}
            <Section id="bigram-01">
                <SectionLabel number="01" label={t("bigramNarrative.v2.sectionKickers.s1")} />
                <SectionAnchor id="bigram-01"><Heading>{t("bigramNarrative.v2.s1.label")}</Heading></SectionAnchor>

                {/* Intro: teach writing to something that never lived a day. */}
                <Lead>{t("bigramNarrative.v2.intro.p1")}</Lead>
                <P html={t("bigramNarrative.v2.intro.p2")} />
                <P html={t("bigramNarrative.v2.intro.p3")} />

                {/* VIS 1 · the fill-the-blank keystone — the game holds the idea (no plane, full type). */}
                <LazySection>
                    <div className="my-10 md:my-14">
                        <Suspense fallback={<SectionSkeleton />}><FillTheBlank /></Suspense>
                    </div>
                </LazySection>

                {/* The reframe (predict instead of understand) + the bridge down to letters. */}
                <P html={t("bigramNarrative.v2.fillBlank.afterPlay")} />
                <P html={t("bigramNarrative.v2.fillBlank.reframe")} />
                <P html={t("bigramNarrative.v2.fillBlank.toLetters")} />

                {/* VIS 1.5 · the goal, shown up front: type a letter, it bets on the next. */}
                <Lead>{t("bigramNarrative.v2.goalIntro.lead")}</Lead>
                <Plane><HeroAutoComplete /></Plane>
                <P html={t("bigramNarrative.v2.goalIntro.after")} />
            </Section>

            <SectionBreak />

            {/* ─────────── §2 · A la caza del patrón (la letra t) ─────────── */}
            <Section id="bigram-02">
                <SectionLabel number="02" label={t("bigramNarrative.v2.sectionKickers.s2")} />
                <SectionAnchor id="bigram-02"><Heading>{t("bigramNarrative.v2.s2.label")}</Heading></SectionAnchor>
                <Lead>{t("bigramNarrative.v2.s2.lead")}</Lead>

                <P html={t("bigramNarrative.v2.s2.pairPrompt")} />
                <Plane><PairHighlighter /></Plane>
                <P html={t("bigramNarrative.v2.s2.afterPair")} />

                <P html={t("bigramNarrative.v2.s2.focusTPrompt")} />
                <Slot><IsolateT /></Slot>
                <P html={t("bigramNarrative.v2.s2.afterCorpusCounting")} />

                <P html={t("bigramNarrative.v2.s2.bookPrompt")} />
                <Slot><RowTally /></Slot>
                <P html={t("bigramNarrative.v2.s2.afterShakespeare")} />
                <P html={t("bigramNarrative.v2.s2.honestyNote")} />

                {/* Plegable · Markov — al hilo de leer y contar */}
                <ExpandableSection
                    title={t("bigramNarrative.v2.markov.title")}
                    kicker={t("bigramNarrative.v2.markov.kicker")}
                >
                    <MarkovStory />
                </ExpandableSection>
            </Section>

            <SectionBreak />

            {/* ─────────── §3 · Demasiado predecible (todo aún sobre la t) ─────────── */}
            <Section id="bigram-03">
                <SectionLabel number="03" label={t("bigramNarrative.v2.sectionKickers.s3")} />
                <SectionAnchor id="bigram-03"><Heading>{t("bigramNarrative.v2.s5.label")}</Heading></SectionAnchor>
                <Lead>{t("bigramNarrative.v2.s5.lead")}</Lead>
                <P html={t("bigramNarrative.v2.s5.lead2")} />

                {/* VIS 5 · de números a porcentajes (la misma fila de la «t», normalizada) */}
                <Plane><NormalizationVisualizer /></Plane>
                <P html={t("bigramNarrative.v2.s5.afterNormalization")} />

                {/* VIS 6 · siempre el máximo → bucle «the the the» */}
                <P html={t("bigramNarrative.v2.s5.choosePrompt")} />
                <Plane><AlwaysMaxLoop /></Plane>
                <P html={t("bigramNarrative.v2.s5.afterAlwaysMax")} />

                {/* VIS 7 · el dado trucado (muestreo que respeta los %) */}
                <P html={t("bigramNarrative.v2.s5.dicePrompt")} />
                <Plane><LoadedDie /></Plane>
                <P html={t("bigramNarrative.v2.s5.toMatrix")} />
            </Section>

            <SectionBreak />

            {/* ─────────── §4 · Nace la matriz ─────────── */}
            <Section id="bigram-04">
                <SectionLabel number="04" label={t("bigramNarrative.v2.sectionKickers.s4")} />
                <SectionAnchor id="bigram-04"><Heading>{t("bigramNarrative.v2.s3.label")}</Heading></SectionAnchor>
                <Lead>{t("bigramNarrative.v2.s3.lead")}</Lead>

                {/* VIS 8 · mini-matriz que apila una fila por letra → cuadrícula */}
                <Plane><TinyMatrixExample showCounts /></Plane>
                <P html={t("bigramNarrative.v2.s3.rowByRowReveal")} />
                <P html={t("bigramNarrative.v2.s3.rowByRowName")} />

                {/* VIS 9 · la matriz 27×27 que crece leyendo */}
                <Plane><GrowingMatrix27 /></Plane>

                {/* El giro: el mundo real es más sucio → 92×92 */}
                <P html={t("bigramNarrative.v2.s4.charsetPrompt")} />
                {/* El encuadre del detective va en el CUERPO (no dentro del widget): la tabla entera, las
                    casillas negras son reglas que nadie le enseñó. */}
                <P html={t("bigramNarrative.v2.detective.intro")} />
                {/* VIS 10 · la matriz 92×92 detective.
                    (El concepto «datos de entrenamiento / de dónde sale esto» YA está en §2:
                    RowTally `payoff` + `s2.honestyNote`. No repetirlo aquí.) */}
                <Plane><DetectiveMatrix /></Plane>
            </Section>

            <SectionBreak />

            {/* ─────────── §5 · ¡Vamos a escribir! ─────────── */}
            <Section id="bigram-05">
                <SectionLabel number="05" label={t("bigramNarrative.v2.sectionKickers.s5")} />
                <SectionAnchor id="bigram-05"><Heading>{t("bigramNarrative.v2.s6.label")}</Heading></SectionAnchor>
                <Lead>{t("bigramNarrative.v2.s5.writePrompt")}</Lead>

                {/* VIS 10.5 · una letra paso a paso (el puente: mira su fila → cuenta → % → dado → repite) */}
                <Plane><LetterByLetter /></Plane>

                {/* El logro, JUSTO tras ver a la máquina elegir letra a letra: escribe sola, desde cero */}
                <P html={t("bigramNarrative.v2.naming.buildup")} />

                {/* …y ahora a toda velocidad */}
                <P html={t("bigramNarrative.v2.s5.toFullSpeed")} />

                {/* VIS 11 · la máquina de escribir a toda velocidad (genera en local desde la matriz) */}
                <Plane><TableWriter /></Plane>

                <P html={t("bigramNarrative.v2.disappointment.text")} />

                {/* El nombre, en voz baja (el título ya lo dice) */}
                <FadeInView className="my-12 text-center">
                    <p className={cn(BIGRAM_SERIF, "text-[clamp(19px,2vw,22px)] text-bigram-ink-2 mb-3")}>
                        {t("bigramNarrative.v2.naming.revealLead")}
                    </p>
                    <p
                        className={cn(BIGRAM_DISPLAY, "italic text-bigram-accent")}
                        style={{ fontWeight: 600, fontSize: "clamp(40px,6.4vw,72px)", lineHeight: 1.04, letterSpacing: "-0.018em" }}
                    >
                        {t("bigramNarrative.v2.naming.revealWord")}
                    </p>
                    <p className={cn(BIGRAM_SERIF, "mt-5 text-[clamp(17px,1.9vw,20px)] text-bigram-body leading-relaxed max-w-[34em] mx-auto text-pretty")}>
                        {t("bigramNarrative.v2.naming.revealCoda")}
                    </p>
                </FadeInView>

                {/* Plegable · Shannon (Historia) — el primer modelo de lenguaje de verdad */}
                <ExpandableSection
                    title={t("bigramNarrative.v2.shannon.title")}
                    kicker={t("bigramNarrative.v2.shannon.kicker")}
                >
                    <P html={t("bigramNarrative.v2.shannon.p1")} />
                    <P html={t("bigramNarrative.v2.shannon.p2")} />
                    <P html={t("bigramNarrative.v2.shannon.p3")} />
                    <P html={t("bigramNarrative.v2.shannon.quoteIntro")} />
                    {/* La salida real de Shannon (1948) como espécimen — un elemento distinto, no más párrafo */}
                    <blockquote
                        className={cn(
                            BIGRAM_MONO,
                            "my-7 mx-auto max-w-[46ch] rounded-[var(--bigram-r-md)] bg-bigram-bg-2 px-6 py-5 text-center text-[clamp(13px,1.5vw,16px)] leading-[1.7] tracking-[0.04em] text-bigram-accent-ink",
                        )}
                        style={{ boxShadow: "inset 0 0 0 1px var(--bigram-rule-2)", borderLeft: "2px solid var(--bigram-accent)" }}
                    >
                        “{t("bigramNarrative.v2.shannon.quote")}”
                    </blockquote>
                    <P html={t("bigramNarrative.v2.shannon.p4")} />
                    <P html={t("bigramNarrative.v2.shannon.p5")} />
                </ExpandableSection>
            </Section>

            <SectionBreak />

            {/* ─────────── §6 · El techo (la amnesia → puente al n-gram) ─────────── */}
            <Section id="bigram-06">
                <SectionLabel number="06" label={t("bigramNarrative.v2.sectionKickers.s6")} />
                <SectionAnchor id="bigram-06"><Heading>{t("bigramNarrative.v2.s6.heading")}</Heading></SectionAnchor>
                <P html={t("bigramNarrative.v2.s6.lead")} />
                <Plane><ContextBlindnessDemo /></Plane>
                <P html={t("bigramNarrative.v2.s6.afterBlindness")} />
                <P html={t("bigramNarrative.v2.s6.ladderPrompt")} />
                <Plane><ShannonContextLadder /></Plane>
                <P html={t("bigramNarrative.v2.s6.afterLadder")} />
                <P html={t("bigramNarrative.v2.s6.ladderCoda")} />
            </Section>

            <SectionBreak />

            {/* ─────────── CTA · puente al n-gram (asimétrico) ─────────── */}
            <Section>
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
