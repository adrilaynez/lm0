"use client";

import { lazy, Suspense, useState } from "react";
import { useRouter } from "next/navigation";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BrainCircuit, ChevronDown, FlaskConical } from "lucide-react";

import { ContinueToast } from "@/features/lab/components/ContinueToast";
import { FadeInView } from "@/features/lab/components/FadeInView";
import { LazySection, SectionSkeleton } from "@/features/lab/components/LazySection";
import { ModeToggle } from "@/features/lab/components/ModeToggle";
import { SectionAnchor } from "@/features/lab/components/SectionAnchor";
import { ChapterSideRail } from "@/features/lab/components/ChapterSideRail";
import { useLabMode } from "@/features/lab/context/LabModeContext";
import { useLabTheme } from "@/features/lab/hooks/useLabTheme";
import { useProgressTracker } from "@/features/lab/hooks/useProgressTracker";
import { useI18n } from "@/i18n/context";
import { en } from "@/i18n/en";
import { es } from "@/i18n/es";

import {
    FigureWrapper as _FigureWrapper,
    Heading,
    Lead,
    P,
    Section,
    SectionBreak,
    SectionLabel as _SectionLabel,
} from "./narrative-primitives";

/* ─── n-gram v3 "La fila" widgets (amber, [data-ngram-theme]) ─── */
const AmnesiaReplay = lazy(() => import("@/features/lab/components/ngram/AmnesiaReplay").then(m => ({ default: m.AmnesiaReplay })));
const WidenWindow = lazy(() => import("@/features/lab/components/ngram/WidenWindow").then(m => ({ default: m.WidenWindow })));
const SplitTheRow = lazy(() => import("@/features/lab/components/ngram/SplitTheRow").then(m => ({ default: m.SplitTheRow })));
const RowSharpens = lazy(() => import("@/features/lab/components/ngram/RowSharpens").then(m => ({ default: m.RowSharpens })));
const GrowingTable = lazy(() => import("@/features/lab/components/ngram/GrowingTable").then(m => ({ default: m.GrowingTable })));
const WriteFromMatrix = lazy(() => import("@/features/lab/components/ngram/WriteFromMatrix").then(m => ({ default: m.WriteFromMatrix })));
const LookWhatYouBuilt = lazy(() => import("@/features/lab/components/ngram/LookWhatYouBuilt").then(m => ({ default: m.LookWhatYouBuilt })));
const ExplosionZoom = lazy(() => import("@/features/lab/components/ngram/ExplosionZoom").then(m => ({ default: m.ExplosionZoom })));
const BookFirehose = lazy(() => import("@/features/lab/components/ngram/BookFirehose").then(m => ({ default: m.BookFirehose })));
const MuteSlot = lazy(() => import("@/features/lab/components/ngram/MuteSlot").then(m => ({ default: m.MuteSlot })));
const EmptyMatrix = lazy(() => import("@/features/lab/components/ngram/EmptyMatrix").then(m => ({ default: m.EmptyMatrix })));
const Progression = lazy(() => import("@/features/lab/components/ngram/Progression").then(m => ({ default: m.Progression })));
const BigModelLimit = lazy(() => import("@/features/lab/components/ngram/BigModelLimit").then(m => ({ default: m.BigModelLimit })));

/* ─── accent-bound primitive wrappers ─── */
const NA = "ngram" as const;
const SectionLabel = (p: { number: string; label: string }) => <_SectionLabel accent={NA} {...p} />;
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
                    {open ? t("ngramNarrative.v3.ui.collapse") : t("ngramNarrative.v3.ui.expand")}
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
        "ngram-01": t("ngramNarrative.v3.sectionNames.s1"),
        "ngram-02": t("ngramNarrative.v3.sectionNames.s2"),
        "ngram-03": t("ngramNarrative.v3.sectionNames.s3"),
        "ngram-04": t("ngramNarrative.v3.sectionNames.s4"),
        "ngram-05": t("ngramNarrative.v3.sectionNames.s5"),
        "ngram-06": t("ngramNarrative.v3.sectionNames.s6"),
    };

    return (
        <div data-ngram-theme={theme} className="bg-ngram-bg text-ngram-ink min-h-screen">
            <div className="ngram-grain" aria-hidden />
            <article className="relative z-[1] max-w-[920px] mx-auto px-6 pt-8 pb-24">
                <ContinueToast accent="ngram" hasStoredProgress={hasStoredProgress} storedSection={storedSection} clearProgress={clearProgress} sectionNames={sectionNames} />
                <ChapterSideRail
                    accent="ngram"
                    sections={[
                        { id: "ngram-01", label: "01", name: sectionNames["ngram-01"], weight: 2.4 },
                        { id: "ngram-02", label: "02", name: sectionNames["ngram-02"], weight: 3.0 },
                        { id: "ngram-03", label: "03", name: sectionNames["ngram-03"], weight: 2.6 },
                        { id: "ngram-04", label: "04", name: sectionNames["ngram-04"], weight: 2.8 },
                        { id: "ngram-05", label: "05", name: sectionNames["ngram-05"], weight: 2.0 },
                        { id: "ngram-06", label: "06", name: sectionNames["ngram-06"], weight: 2.6 },
                    ]}
                />

                {/* ───── HERO · left-aligned + clean, matching bigram (CLAUDE.md "Section chrome & hero") ───── */}
                <header className="text-left pt-8 md:pt-16 mb-16 md:mb-20">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <span className="inline-flex items-center gap-3 font-[family-name:var(--ngram-font-mono)] text-[12px] font-medium uppercase tracking-[0.18em] text-ngram-accent-ink mb-8">
                            <span className="inline-block h-px w-[34px] bg-ngram-accent opacity-60" aria-hidden />
                            {t("ngramNarrative.v3.hero.eyebrow")}
                        </span>
                        <h1 className="font-[family-name:var(--ngram-font-display)] text-ngram-ink mb-7 text-balance" style={{ fontWeight: 800, fontSize: "clamp(54px,8.6vw,112px)", lineHeight: 0.95, letterSpacing: "clamp(-2.6px, calc(1.4px - 0.32vw), -0.5px)" }}>
                            {t("ngramNarrative.v3.hero.title")}{" "}
                            <span className="italic text-ngram-accent" style={{ fontWeight: 600, letterSpacing: "-0.018em" }}>{t("ngramNarrative.v3.hero.titleAccent")}</span>
                        </h1>
                        <p className="font-[family-name:var(--ngram-font-serif)] text-[clamp(21px,2.2vw,25px)] font-normal text-ngram-ink-2 leading-[1.5] max-w-[33em] mb-7 text-pretty">
                            {t("ngramNarrative.v3.hero.subtitle")}
                        </p>
                        <p className="font-[family-name:var(--ngram-font-mono)] text-[11px] uppercase tracking-[0.16em] text-ngram-dim mb-9">
                            {t("ngramNarrative.v3.hero.readTime")}
                        </p>
                        <div className="flex justify-start">
                            <div className="max-w-xs"><ModeToggle /></div>
                        </div>
                    </motion.div>
                </header>

                {/* ───── §1 · Mirar más atrás ───── */}
                <Section id="ngram-01">
                    <SectionLabel number="01" label={sectionNames["ngram-01"]} />
                    <SectionAnchor id="ngram-01"><Heading accent={NA}>{sectionNames["ngram-01"]}</Heading></SectionAnchor>
                    <P accent={NA}>{t("ngramNarrative.v3.s1.recap")}</P>
                    <Lead accent={NA}>{t("ngramNarrative.v3.s1.amnesiaLead")}</Lead>
                    <Figure label="solo recuerda la última letra"><AmnesiaReplay /></Figure>
                    <P accent={NA}>{t("ngramNarrative.v3.s1.afterAmnesia")}</P>
                    <Lead accent={NA}>{t("ngramNarrative.v3.s1.ask")}</Lead>
                    <Figure label="dale más memoria"><WidenWindow /></Figure>
                    <P accent={NA}>{t("ngramNarrative.v3.s1.payoff")}</P>
                    <P accent={NA}>{t("ngramNarrative.v3.s1.name")}</P>
                    <P accent={NA}>{t("ngramNarrative.v3.s1.bridge")}</P>
                </Section>
                <SectionBreak accent={NA} />

                {/* ───── §2 · Construirla tú ───── */}
                <Section id="ngram-02">
                    <SectionLabel number="02" label={sectionNames["ngram-02"]} />
                    <SectionAnchor id="ngram-02"><Heading accent={NA}>{sectionNames["ngram-02"]}</Heading></SectionAnchor>
                    <P accent={NA}>{t("ngramNarrative.v3.s2.lead")}</P>
                    <Figure label="pártela tú"><SplitTheRow /></Figure>
                    <P accent={NA}>{t("ngramNarrative.v3.s2.payoff")}</P>
                    <Lead accent={NA}>{t("ngramNarrative.v3.s2.sharpenLead")}</Lead>
                    <Figure label="la fila se afila"><RowSharpens /></Figure>
                    <Lead accent={NA}>{t("ngramNarrative.v3.s2.growLead")}</Lead>
                    <Figure label="y la tabla crece"><GrowingTable /></Figure>
                    <P accent={NA}>{t("ngramNarrative.v3.s2.bridge")}</P>
                </Section>
                <SectionBreak accent={NA} />

                {/* ───── §3 · Lo que has construido ───── */}
                <Section id="ngram-03">
                    <SectionLabel number="03" label={sectionNames["ngram-03"]} />
                    <SectionAnchor id="ngram-03"><Heading accent={NA}>{sectionNames["ngram-03"]}</Heading></SectionAnchor>
                    <P accent={NA}>{t("ngramNarrative.v3.s3.writeLead")}</P>
                    <Figure label="escribir es leer un número"><WriteFromMatrix /></Figure>
                    <P accent={NA}>{t("ngramNarrative.v3.s3.afterWrite")}</P>
                    <Lead accent={NA}>{t("ngramNarrative.v3.s3.celebrateLead")}</Lead>
                    <Figure label="mira lo que has construido"><LookWhatYouBuilt /></Figure>
                    <P accent={NA}>{t("ngramNarrative.v3.s3.triumph")}</P>
                    <Lead accent={NA}>{t("ngramNarrative.v3.s3.temptation")}</Lead>
                </Section>
                <SectionBreak accent={NA} />

                {/* ───── §4 · Hasta dónde llega ───── */}
                <Section id="ngram-04">
                    <SectionLabel number="04" label={sectionNames["ngram-04"]} />
                    <SectionAnchor id="ngram-04"><Heading accent={NA}>{sectionNames["ngram-04"]}</Heading></SectionAnchor>
                    <P accent={NA}>{t("ngramNarrative.v3.s4.zoomLead")}</P>
                    <Figure label="la tabla no tiene fondo"><ExplosionZoom /></Figure>
                    <P accent={NA}>{t("ngramNarrative.v3.s4.afterZoom")}</P>
                    <P accent={NA}>{t("ngramNarrative.v3.s4.firehoseLead")}</P>
                    <Figure label="un océano de texto"><BookFirehose /></Figure>
                    <P accent={NA}>{t("ngramNarrative.v3.s4.afterFirehose")}</P>
                    <P accent={NA}>{t("ngramNarrative.v3.s4.bridge")}</P>
                </Section>
                <SectionBreak accent={NA} />

                {/* ───── §5 · El hueco ───── */}
                <Section id="ngram-05">
                    <SectionLabel number="05" label={sectionNames["ngram-05"]} />
                    <SectionAnchor id="ngram-05"><Heading accent={NA}>{sectionNames["ngram-05"]}</Heading></SectionAnchor>
                    <Lead accent={NA}>{t("ngramNarrative.v3.s5.before")}</Lead>
                    <Figure label="cámbiale una letra"><MuteSlot /></Figure>
                    <P accent={NA}>{t("ngramNarrative.v3.s5.after")}</P>
                    <Figure label="asómate a la tabla entera"><EmptyMatrix /></Figure>
                    <P accent={NA}>{t("ngramNarrative.v3.s5.close")}</P>
                </Section>
                <SectionBreak accent={NA} />

                {/* ───── §6 · El puente ───── */}
                <Section id="ngram-06">
                    <SectionLabel number="06" label={sectionNames["ngram-06"]} />
                    <SectionAnchor id="ngram-06"><Heading accent={NA}>{sectionNames["ngram-06"]}</Heading></SectionAnchor>
                    <P accent={NA}>{t("ngramNarrative.v3.s6.progressLead")}</P>
                    <Figure label="mira de dónde vienes"><Progression /></Figure>
                    <P accent={NA}>{t("ngramNarrative.v3.s6.afterProgress")}</P>
                    <Figure label="escribe bien, pero…"><BigModelLimit /></Figure>
                    <P accent={NA}>{t("ngramNarrative.v3.s6.afterLimit")}</P>

                    <ExpandableSection kicker={t("ngramNarrative.v3.history.kicker")} title={t("ngramNarrative.v3.history.title")}>
                        <div className="space-y-4 pl-5 border-l-2 border-ngram-rule-2">
                            {dict.ngramNarrative.v3.history.paras.map((para, i) => (
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
                                {t("ngramNarrative.v3.cta.quote")}
                            </p>
                            <div className="w-16 h-px bg-[color-mix(in_oklab,var(--ngram-accent)_45%,transparent)] mx-auto mb-6" />
                            <p className="font-[family-name:var(--ngram-font-serif)] text-ngram-ink-2 max-w-xl mx-auto mb-9 text-[17px] leading-relaxed">
                                {t("ngramNarrative.v3.cta.hook")}
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => router.push("/lab/neural-networks")}
                                className="group inline-flex items-center gap-4 rounded-[var(--ngram-r-md)] bg-ngram-accent-soft border border-[color-mix(in_oklab,var(--ngram-accent)_32%,transparent)] hover:border-[color-mix(in_oklab,var(--ngram-accent)_55%,transparent)] px-7 py-4 transition-colors"
                            >
                                <BrainCircuit className="w-6 h-6 text-ngram-accent-ink shrink-0" />
                                <span className="text-left">
                                    <span className="block font-[family-name:var(--ngram-font-display)] text-[19px] font-semibold text-ngram-accent-ink">{t("ngramNarrative.v3.cta.button")}</span>
                                    <span className="block font-[family-name:var(--ngram-font-serif)] text-[14px] text-ngram-muted">{t("ngramNarrative.v3.cta.buttonDesc")}</span>
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
                        {t("ngramNarrative.v3.footer.text")}
                    </p>
                    <div className="flex items-center justify-center gap-2 font-[family-name:var(--ngram-font-mono)] text-[10px] uppercase tracking-widest text-ngram-dim">
                        <FlaskConical className="h-3 w-3" />
                        {t("ngramNarrative.v3.footer.brand")}
                    </div>
                </FadeInView>
            </article>
        </div>
    );
}

export default NgramNarrative;
