"use client";

import { lazy, Suspense, useState } from "react";
import { useRouter } from "next/navigation";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowRight, BrainCircuit, ChevronDown, FlaskConical } from "lucide-react";

import { ContinueToast } from "@/features/lab/components/ContinueToast";
import { FadeInView } from "@/features/lab/components/FadeInView";
import { KeyTakeaway } from "@/features/lab/components/KeyTakeaway";
import { LazySection, SectionSkeleton } from "@/features/lab/components/LazySection";
import { ModeToggle } from "@/features/lab/components/ModeToggle";
import { SectionAnchor } from "@/features/lab/components/SectionAnchor";
import { SectionProgressBar } from "@/features/lab/components/SectionProgressBar";
import { useLabMode } from "@/features/lab/context/LabModeContext";
import { useLabTheme } from "@/features/lab/hooks/useLabTheme";
import { useProgressTracker } from "@/features/lab/hooks/useProgressTracker";
import { useI18n } from "@/i18n/context";
import { en } from "@/i18n/en";
import { es } from "@/i18n/es";

import {
    Callout as _Callout,
    FigureWrapper as _FigureWrapper,
    Heading,
    Lead,
    P,
    PullQuote as _PullQuote,
    Section,
    SectionBreak,
    SectionLabel as _SectionLabel,
} from "./narrative-primitives";

/* ─── Lazy ngram kit widgets (amber, [data-ngram-theme]) ─── */
const ContextWindow = lazy(() => import("@/features/lab/components/ngram/ContextWindow").then(m => ({ default: m.ContextWindow })));
const ContextCounter = lazy(() => import("@/features/lab/components/ngram/ContextCounter").then(m => ({ default: m.ContextCounter })));
const NgramBattle = lazy(() => import("@/features/lab/components/ngram/NgramBattle").then(m => ({ default: m.NgramBattle })));
const ContextExplosion = lazy(() => import("@/features/lab/components/ngram/ContextExplosion").then(m => ({ default: m.ContextExplosion })));
const SparsityView = lazy(() => import("@/features/lab/components/ngram/SparsityView").then(m => ({ default: m.SparsityView })));
const InfiniteTable = lazy(() => import("@/features/lab/components/ngram/InfiniteTable").then(m => ({ default: m.InfiniteTable })));
const UnseenContext = lazy(() => import("@/features/lab/components/ngram/UnseenContext").then(m => ({ default: m.UnseenContext })));
const TypoBreaker = lazy(() => import("@/features/lab/components/ngram/TypoBreaker").then(m => ({ default: m.TypoBreaker })));
const SimilarityBridge = lazy(() => import("@/features/lab/components/ngram/SimilarityBridge").then(m => ({ default: m.SimilarityBridge })));

/* ─── accent-bound primitive wrappers ─── */
const NA = "ngram" as const;
const SectionLabel = (p: { number: string; label: string }) => <_SectionLabel accent={NA} {...p} />;
const Callout = (p: Omit<Parameters<typeof _Callout>[0], "accent">) => <_Callout accent={NA} {...p} />;
const PullQuote = ({ children }: { children: React.ReactNode }) => <_PullQuote accent={NA}>{children}</_PullQuote>;
const Figure = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <LazySection>
        <_FigureWrapper accent={NA} label={label} hint="">
            <Suspense fallback={<SectionSkeleton />}>{children}</Suspense>
        </_FigureWrapper>
    </LazySection>
);

function ExpandableSection({ kicker, title, children }: { kicker?: string; title: string; children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const { t } = useI18n();
    return (
        <div className="my-12">
            <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 text-left group mb-3" aria-expanded={open}>
                <span className="w-1.5 h-1.5 rounded-full bg-ngram-accent shrink-0" />
                <span className="flex-1">
                    {kicker && <span className="block font-[family-name:var(--ngram-font-mono)] text-[10.5px] uppercase tracking-[0.18em] text-ngram-dim mb-1">{kicker}</span>}
                    <span className="font-[family-name:var(--ngram-font-display)] text-[22px] font-semibold text-ngram-ink leading-snug">{title}</span>
                </span>
                <span className="shrink-0 font-[family-name:var(--ngram-font-mono)] text-[10px] uppercase tracking-widest text-ngram-dim mr-1">
                    {open ? t("ngramNarrative.v2.ui.collapse") : t("ngramNarrative.v2.ui.expand")}
                </span>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
                    <ChevronDown className="w-4 h-4 text-ngram-dim" />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div key="c" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.38, ease: [0.25, 0, 0, 1] }} className="overflow-hidden">
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface NgramNarrativeProps {
    contextSize: number;
    vocabSize: number;
}

export function NgramNarrative({ contextSize, vocabSize }: NgramNarrativeProps) {
    void contextSize; void vocabSize; // the narrative runs on local ngramData now, not these props
    const { t, language } = useI18n();
    const dict = (language === "es" ? es : en) as typeof en;
    const router = useRouter();
    const { theme } = useLabTheme();
    const { setMode } = useLabMode();
    const { hasStoredProgress, storedSection, clearProgress } = useProgressTracker("ngram");

    const sectionNames = {
        "ngram-01": t("ngramNarrative.v2.sectionNames.s01"),
        "ngram-02": t("ngramNarrative.v2.sectionNames.s02"),
        "ngram-03": t("ngramNarrative.v2.sectionNames.s03"),
        "ngram-04": t("ngramNarrative.v2.sectionNames.s04"),
        "ngram-05": t("ngramNarrative.v2.sectionNames.s05"),
        "ngram-06": t("ngramNarrative.v2.sectionNames.s06"),
        "ngram-07": t("ngramNarrative.v2.sectionNames.s07"),
    };

    return (
        <div data-ngram-theme={theme} className="bg-ngram-bg text-ngram-ink min-h-screen">
            <div className="ngram-grain" aria-hidden />
            <article className="relative z-[1] max-w-[920px] mx-auto px-6 pt-8 pb-24">
                <ContinueToast accent="ngram" hasStoredProgress={hasStoredProgress} storedSection={storedSection} clearProgress={clearProgress} sectionNames={sectionNames} />
                <SectionProgressBar
                    accent="ngram"
                    sections={[
                        { id: "ngram-01", label: "01", name: sectionNames["ngram-01"] },
                        { id: "ngram-02", label: "02", name: sectionNames["ngram-02"] },
                        { id: "ngram-03", label: "03", name: sectionNames["ngram-03"] },
                        { id: "ngram-04", label: "04", name: sectionNames["ngram-04"] },
                        { id: "ngram-05", label: "05", name: sectionNames["ngram-05"] },
                        { id: "ngram-06", label: "06", name: sectionNames["ngram-06"] },
                        { id: "ngram-07", label: "07", name: sectionNames["ngram-07"] },
                    ]}
                />

                {/* ───── HERO ───── */}
                <header className="text-center mb-24 md:mb-32">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <span className="inline-flex items-center gap-2 font-[family-name:var(--ngram-font-mono)] text-[11px] font-medium uppercase tracking-[0.22em] text-ngram-accent-ink mb-7">
                            {t("ngramNarrative.v2.hero.eyebrow")}
                        </span>
                        <h1 className="font-[family-name:var(--ngram-font-display)] font-semibold text-ngram-ink mb-7 text-balance" style={{ fontSize: "clamp(46px,7vw,92px)", lineHeight: 1.02 }}>
                            {t("ngramNarrative.v2.hero.title")}{" "}
                            <span className="italic text-ngram-accent">{t("ngramNarrative.v2.hero.titleAccent")}</span>
                        </h1>
                        <p className="font-[family-name:var(--ngram-font-serif)] text-ngram-ink-2 max-w-xl mx-auto mb-9" style={{ fontSize: "clamp(19px,2.2vw,24px)", lineHeight: 1.5 }}>
                            {t("ngramNarrative.v2.hero.subtitle")}
                        </p>
                        <p className="font-[family-name:var(--ngram-font-mono)] text-[11px] uppercase tracking-[0.16em] text-ngram-dim mb-10">
                            {t("ngramNarrative.v2.hero.readTime")}
                        </p>
                        <div className="flex justify-center mb-14"><ModeToggle /></div>
                        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} className="text-ngram-dim">
                            <ArrowDown className="w-5 h-5 mx-auto" />
                        </motion.div>
                    </motion.div>
                </header>

                {/* ───── §1 · Mirar más atrás ───── */}
                <Section id="ngram-01">
                    <SectionLabel number="01" label={sectionNames["ngram-01"]} />
                    <SectionAnchor id="ngram-01"><Heading accent={NA}>{sectionNames["ngram-01"]}</Heading></SectionAnchor>
                    <P accent={NA}>{t("ngramNarrative.v2.s1.recap1")}</P>
                    <P accent={NA}>{t("ngramNarrative.v2.s1.recap2")}</P>
                    <Lead accent={NA}>{t("ngramNarrative.v2.s1.ask")}</Lead>
                    <Figure label="el juego de la ventana"><ContextWindow /></Figure>
                    <P accent={NA}>{t("ngramNarrative.v2.s1.payoff1")}</P>
                    <P accent={NA}>{t("ngramNarrative.v2.s1.payoff2")}</P>
                    <PullQuote>{t("ngramNarrative.v2.s1.pull")}</PullQuote>
                    <P accent={NA}>{t("ngramNarrative.v2.s1.bridge")}</P>
                </Section>
                <SectionBreak accent={NA} />

                {/* ───── §2 · Contar con contexto ───── */}
                <Section id="ngram-02">
                    <SectionLabel number="02" label={sectionNames["ngram-02"]} />
                    <SectionAnchor id="ngram-02"><Heading accent={NA}>{sectionNames["ngram-02"]}</Heading></SectionAnchor>
                    <P accent={NA}>{t("ngramNarrative.v2.s2.lead1")}</P>
                    <P accent={NA}>{t("ngramNarrative.v2.s2.lead2")}</P>
                    <Figure label="la fila se afila"><ContextCounter /></Figure>
                    <P accent={NA}>{t("ngramNarrative.v2.s2.payoff")}</P>
                    <P accent={NA}>{t("ngramNarrative.v2.s2.bridge")}</P>
                </Section>
                <SectionBreak accent={NA} />

                {/* ───── §3 · El salto se siente ───── */}
                <Section id="ngram-03">
                    <SectionLabel number="03" label={sectionNames["ngram-03"]} />
                    <SectionAnchor id="ngram-03"><Heading accent={NA}>{sectionNames["ngram-03"]}</Heading></SectionAnchor>
                    <P accent={NA}>{t("ngramNarrative.v2.s3.stage")}</P>
                    <Figure label="cuatro memorias, una semilla"><NgramBattle /></Figure>
                    <P accent={NA}>{t("ngramNarrative.v2.s3.triumph1")}</P>
                    <Lead accent={NA}>{t("ngramNarrative.v2.s3.triumph2")}</Lead>
                </Section>
                <SectionBreak accent={NA} />

                {/* ───── §4 · El coste ───── */}
                <Section id="ngram-04">
                    <SectionLabel number="04" label={sectionNames["ngram-04"]} />
                    <SectionAnchor id="ngram-04"><Heading accent={NA}>{sectionNames["ngram-04"]}</Heading></SectionAnchor>
                    <P accent={NA}>{t("ngramNarrative.v2.s4.lead1")}</P>
                    <P accent={NA}>{t("ngramNarrative.v2.s4.lead2")}</P>
                    <Figure label="cada letra, por veintisiete"><ContextExplosion /></Figure>
                    <P accent={NA}>{t("ngramNarrative.v2.s4.after")}</P>
                    <Callout title={t("ngramNarrative.v2.s4.wordsTitle")}><p>{t("ngramNarrative.v2.s4.words")}</p></Callout>
                    <P accent={NA}>{t("ngramNarrative.v2.s4.bridge")}</P>
                </Section>
                <SectionBreak accent={NA} />

                {/* ───── §5 · El muro ───── */}
                <Section id="ngram-05">
                    <SectionLabel number="05" label={sectionNames["ngram-05"]} />
                    <SectionAnchor id="ngram-05"><Heading accent={NA}>{sectionNames["ngram-05"]}</Heading></SectionAnchor>
                    <P accent={NA}>{t("ngramNarrative.v2.s5.lead1")}</P>
                    <P accent={NA}>{t("ngramNarrative.v2.s5.lead2")}</P>
                    <P accent={NA}>{t("ngramNarrative.v2.s5.lead3")}</P>
                    <Figure label="la tabla, casi toda vacía"><SparsityView /></Figure>
                    <P accent={NA}>{t("ngramNarrative.v2.s5.afterSparsity")}</P>
                    <P accent={NA}>{t("ngramNarrative.v2.s5.moreDataAsk")}</P>
                    <Figure label="ni con datos infinitos"><InfiniteTable /></Figure>
                    <P accent={NA}>{t("ngramNarrative.v2.s5.afterInfinite")}</P>
                    <P accent={NA}>{t("ngramNarrative.v2.s5.bridge")}</P>
                </Section>
                <SectionBreak accent={NA} />

                {/* ───── §6 · No generaliza ───── */}
                <Section id="ngram-06">
                    <SectionLabel number="06" label={sectionNames["ngram-06"]} />
                    <SectionAnchor id="ngram-06"><Heading accent={NA}>{sectionNames["ngram-06"]}</Heading></SectionAnchor>
                    <P accent={NA}>{t("ngramNarrative.v2.s6.lead")}</P>
                    <Figure label="una letra de diferencia"><UnseenContext /></Figure>
                    <P accent={NA}>{t("ngramNarrative.v2.s6.after")}</P>
                    <P accent={NA}>{t("ngramNarrative.v2.s6.typoBridge")}</P>
                    <Figure label="rómpelo tú"><TypoBreaker /></Figure>
                    <P accent={NA}>{t("ngramNarrative.v2.s6.diagnosis")}</P>
                    <KeyTakeaway accent="ngram">{t("ngramNarrative.v2.s6.takeaway")}</KeyTakeaway>
                    <P accent={NA}>{t("ngramNarrative.v2.s6.bridge")}</P>
                </Section>
                <SectionBreak accent={NA} />

                {/* ───── §7 · El puente ───── */}
                <Section id="ngram-07">
                    <SectionLabel number="07" label={sectionNames["ngram-07"]} />
                    <SectionAnchor id="ngram-07"><Heading accent={NA}>{sectionNames["ngram-07"]}</Heading></SectionAnchor>
                    <P accent={NA}>{t("ngramNarrative.v2.s7.lead")}</P>
                    <Figure label="lo que viene"><SimilarityBridge /></Figure>
                    <P accent={NA}>{t("ngramNarrative.v2.s7.after1")}</P>
                    <P accent={NA}>{t("ngramNarrative.v2.s7.after2")}</P>

                    <ExpandableSection kicker={t("ngramNarrative.v2.history.kicker")} title={t("ngramNarrative.v2.history.title")}>
                        <div className="space-y-4 pl-5 border-l-2 border-ngram-rule-2">
                            {dict.ngramNarrative.v2.history.paras.map((para, i) => (
                                <p key={i} className="font-[family-name:var(--ngram-font-serif)] text-[17px] leading-[1.7] text-ngram-body">{para}</p>
                            ))}
                        </div>
                    </ExpandableSection>
                </Section>
                <SectionBreak accent={NA} />

                {/* ───── CTA ───── */}
                <Section>
                    <FadeInView margin="-60px" className="my-6 md:my-10">
                        <div className="relative rounded-[var(--ngram-r-lg)] border border-[color:var(--ngram-rule-2)] bg-ngram-surface p-8 md:p-12 text-center overflow-hidden">
                            <div className="w-16 h-px bg-[color-mix(in_oklab,var(--ngram-accent)_45%,transparent)] mx-auto mb-8" />
                            <p className="font-[family-name:var(--ngram-font-display)] font-semibold text-ngram-ink text-balance mb-6" style={{ fontSize: "clamp(26px,3.4vw,40px)", lineHeight: 1.18 }}>
                                {t("ngramNarrative.v2.cta.quote")}
                            </p>
                            <div className="w-16 h-px bg-[color-mix(in_oklab,var(--ngram-accent)_45%,transparent)] mx-auto mb-6" />
                            <p className="font-[family-name:var(--ngram-font-serif)] text-ngram-ink-2 max-w-xl mx-auto mb-9 text-[17px] leading-relaxed">
                                {t("ngramNarrative.v2.cta.hook")}
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => router.push("/lab/neural-networks")}
                                className="group inline-flex items-center gap-4 rounded-[var(--ngram-r-md)] bg-ngram-accent-soft border border-[color-mix(in_oklab,var(--ngram-accent)_32%,transparent)] hover:border-[color-mix(in_oklab,var(--ngram-accent)_55%,transparent)] px-7 py-4 transition-colors"
                            >
                                <BrainCircuit className="w-6 h-6 text-ngram-accent-ink shrink-0" />
                                <span className="text-left">
                                    <span className="block font-[family-name:var(--ngram-font-display)] text-[19px] font-semibold text-ngram-accent-ink">{t("ngramNarrative.v2.cta.button")}</span>
                                    <span className="block font-[family-name:var(--ngram-font-serif)] text-[14px] text-ngram-muted">{t("ngramNarrative.v2.cta.buttonDesc")}</span>
                                </span>
                                <ArrowRight className="w-5 h-5 text-ngram-accent-ink shrink-0 group-hover:translate-x-0.5 transition-transform" />
                            </motion.button>
                            <div className="mt-8">
                                <button onClick={() => setMode("free")} className="font-[family-name:var(--ngram-font-mono)] text-[11px] uppercase tracking-[0.16em] text-ngram-dim hover:text-ngram-muted transition-colors">
                                    {t("ngramNarrative.cta.labButton")}
                                </button>
                            </div>
                        </div>
                    </FadeInView>
                </Section>

                {/* ───── FOOTER ───── */}
                <FadeInView as="footer" className="mt-10 pt-12 border-t border-ngram-rule text-center">
                    <p className="font-[family-name:var(--ngram-font-serif)] text-[15px] italic text-ngram-muted max-w-md mx-auto leading-relaxed mb-8">
                        {t("ngramNarrative.v2.footer.text")}
                    </p>
                    <div className="flex items-center justify-center gap-2 font-[family-name:var(--ngram-font-mono)] text-[10px] uppercase tracking-widest text-ngram-dim">
                        <FlaskConical className="h-3 w-3" />
                        {t("ngramNarrative.v2.footer.brand")}
                    </div>
                </FadeInView>
            </article>
        </div>
    );
}

export default NgramNarrative;
