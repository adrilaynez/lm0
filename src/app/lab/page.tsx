"use client";

import { useMemo } from "react";
import Link from "next/link";

import { motion } from "framer-motion";

import { FadeInView } from "@/components/lab/FadeInView";
import {
    Activity,
    ArrowDown,
    Brain,
    ChevronRight,
    Cpu,
    FlaskConical,
    Layers,
    Mouse,
    Network,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n/context";
import { cn } from "@/lib/utils";

/* ─── Era color system ─── */
const eraStyles = {
    counting: {
        gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
        border: "border-emerald-500/15 hover:border-emerald-400/50",
        glow: "hover:shadow-[0_0_60px_-12px_rgba(16,185,129,0.35)]",
        accent: "text-emerald-400",
        accentDim: "text-emerald-500/70",
        accentBg: "bg-emerald-500/10",
        accentBorder: "border-emerald-500/25",
        bar: "bg-gradient-to-r from-emerald-500 to-teal-400",
        dot: "bg-emerald-400",
        yearsBg: "bg-emerald-500/10 text-emerald-300/90 border-emerald-500/20",
        iconBg: "bg-emerald-500/10 border-emerald-500/20",
        lineGradient: "from-emerald-500/40 via-emerald-500/10 to-transparent",
    },
    learning: {
        gradient: "from-rose-500/20 via-pink-500/10 to-transparent",
        border: "border-rose-500/15 hover:border-rose-400/50",
        glow: "hover:shadow-[0_0_60px_-12px_rgba(244,63,94,0.35)]",
        accent: "text-rose-400",
        accentDim: "text-rose-500/70",
        accentBg: "bg-rose-500/10",
        accentBorder: "border-rose-500/25",
        bar: "bg-gradient-to-r from-rose-500 to-pink-400",
        dot: "bg-rose-400",
        yearsBg: "bg-rose-500/10 text-rose-300/90 border-rose-500/20",
        iconBg: "bg-rose-500/10 border-rose-500/20",
        lineGradient: "from-rose-500/40 via-rose-500/10 to-transparent",
    },
    attention: {
        gradient: "from-violet-500/20 via-purple-500/10 to-transparent",
        border: "border-violet-500/15 hover:border-violet-400/50",
        glow: "hover:shadow-[0_0_60px_-12px_rgba(139,92,246,0.35)]",
        accent: "text-violet-400",
        accentDim: "text-violet-500/70",
        accentBg: "bg-violet-500/10",
        accentBorder: "border-violet-500/25",
        bar: "bg-gradient-to-r from-violet-500 to-purple-400",
        dot: "bg-violet-400",
        yearsBg: "bg-violet-500/10 text-violet-300/90 border-violet-500/20",
        iconBg: "bg-violet-500/10 border-violet-500/20",
        lineGradient: "from-violet-500/40 via-violet-500/10 to-transparent",
    },
};

type EraKey = keyof typeof eraStyles;


interface ModelData {
    id: string;
    name: string;
    subtitle: string;
    description: string;
    status: "ready" | "coming";
    icon: typeof Brain;
    href: string;
}

interface EraData {
    key: EraKey;
    nameKey: string;
    yearsKey: string;
    questionKey: string;
    descriptionKey: string;
    models: ModelData[];
}

export default function LabLandingPage() {
    const { t } = useI18n();

    const eras: EraData[] = useMemo(() => [
        {
            key: "counting" as EraKey,
            nameKey: "lab.landing.journey.countingEra.name",
            yearsKey: "lab.landing.journey.countingEra.years",
            questionKey: "lab.landing.journey.countingEra.question",
            descriptionKey: "lab.landing.journey.countingEra.description",
            models: [
                {
                    id: "bigram",
                    name: t("lab.models.bigram.name"),
                    subtitle: t("lab.models.bigram.subtitle"),
                    description: t("lab.models.bigram.description"),
                    status: "ready" as const,
                    icon: Brain,
                    href: "/lab/bigram",
                },
                {
                    id: "ngram",
                    name: t("lab.models.ngram.name"),
                    subtitle: t("lab.models.ngram.subtitle"),
                    description: t("lab.models.ngram.description"),
                    status: "ready" as const,
                    icon: Activity,
                    href: "/lab/ngram",
                },
            ],
        },
        {
            key: "learning" as EraKey,
            nameKey: "lab.landing.journey.learningEra.name",
            yearsKey: "lab.landing.journey.learningEra.years",
            questionKey: "lab.landing.journey.learningEra.question",
            descriptionKey: "lab.landing.journey.learningEra.description",
            models: [
                {
                    id: "neural-networks",
                    name: t("lab.models.neuralNetworks.name"),
                    subtitle: t("lab.models.neuralNetworks.subtitle"),
                    description: t("lab.models.neuralNetworks.description"),
                    status: "ready" as const,
                    icon: Network,
                    href: "/lab/neural-networks",
                },
                {
                    id: "mlp",
                    name: t("lab.models.mlp.name"),
                    subtitle: t("lab.models.mlp.subtitle"),
                    description: t("lab.models.mlp.description"),
                    status: "ready" as const,
                    icon: Layers,
                    href: "/lab/mlp",
                },
            ],
        },
        {
            key: "attention" as EraKey,
            nameKey: "lab.landing.journey.attentionEra.name",
            yearsKey: "lab.landing.journey.attentionEra.years",
            questionKey: "lab.landing.journey.attentionEra.question",
            descriptionKey: "lab.landing.journey.attentionEra.description",
            models: [
                {
                    id: "transformer",
                    name: t("lab.models.transformer.name"),
                    subtitle: t("lab.models.transformer.subtitle"),
                    description: t("lab.models.transformer.description"),
                    status: "coming" as const,
                    icon: Cpu,
                    href: "/lab/transformer",
                },
            ],
        },
    ], [t]);

    return (
        <div className="min-h-screen bg-[#060609] text-white">
            {/* ─── Background effects ─── */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {/* Top glow */}
                <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/[0.06] rounded-full blur-[150px]" />
                {/* Side accents */}
                <div className="absolute top-[40%] -left-[200px] w-[500px] h-[500px] bg-rose-500/[0.03] rounded-full blur-[120px]" />
                <div className="absolute top-[60%] -right-[200px] w-[500px] h-[500px] bg-violet-500/[0.04] rounded-full blur-[120px]" />
                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:60px_60px]" />
                {/* Radial fade for grid */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060609_75%)]" />
            </div>

            <div className="relative z-10">
                {/* ════════════════════════════════════════════════════════════
                   HERO: LM-Lab identity + hook question
                   ════════════════════════════════════════════════════════════ */}
                <section className="relative pt-16 pb-8 md:pt-24 md:pb-12 overflow-hidden">
                    <div className="max-w-5xl mx-auto px-6">
                        {/* Top row: Badge + Title */}
                        <div className="text-center mb-12 md:mb-16">
                            <motion.div
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-emerald-400/80 mb-8">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    {t("lab.landing.hero.badge")}
                                </span>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.55, delay: 0.05 }}
                            >
                                <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85]">
                                    <span className="bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent">
                                        LM
                                    </span>
                                    <span className="bg-gradient-to-b from-emerald-300 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
                                        -Lab
                                    </span>
                                </h1>
                            </motion.div>
                        </div>

                        {/* Editorial two-column layout */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.15 }}
                            className="grid md:grid-cols-2 gap-8 md:gap-12 mb-12"
                        >
                            {/* Left column: subtitle + hook */}
                            <div>
                                <p className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-emerald-400/60 mb-4">
                                    {t("lab.landing.hero.subtitle")}
                                </p>
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white/90 leading-snug mb-4">
                                    {t("lab.landing.hero.hookQuestion")}
                                </h2>
                                <p className="text-sm md:text-base text-white/30 italic leading-relaxed">
                                    {t("lab.landing.hero.hookFollow")}
                                </p>
                            </div>

                            {/* Right column: narrative + CTA */}
                            <div className="flex flex-col justify-between">
                                <div className="space-y-4 mb-6">
                                    <p className="text-sm text-white/40 leading-relaxed">
                                        {t("lab.landing.hero.narrativeP1")}
                                    </p>
                                    <p className="text-sm text-white/30 leading-relaxed">
                                        {t("lab.landing.hero.narrativeP2")}
                                    </p>
                                </div>
                                <div>
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="inline-block"
                                    >
                                        <Link
                                            href="/lab/bigram"
                                            className={cn(
                                                "inline-flex items-center gap-3 px-8 py-3.5 rounded-xl text-sm font-bold transition-all duration-300",
                                                "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300",
                                                "hover:bg-emerald-500/25 hover:border-emerald-400/50 hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]"
                                            )}
                                        >
                                            {t("lab.landing.hero.cta")}
                                        </Link>
                                    </motion.div>
                                    <p className="mt-2.5 text-[10px] font-mono text-white/15 uppercase tracking-widest">
                                        {t("lab.landing.hero.ctaSubtext")}
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Thin separator */}
                        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                    </div>
                </section>

                {/* ─── Scroll indicator ─── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="flex flex-col items-center gap-2 pb-8"
                >
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="flex flex-col items-center gap-1.5 text-white/15"
                    >
                        <Mouse className="w-4 h-4" />
                        <ArrowDown className="w-3 h-3" />
                    </motion.div>
                    <span className="text-[8px] font-mono text-white/15 uppercase tracking-[0.3em]">
                        {t("lab.landing.journey.title")}
                    </span>
                </motion.div>

                {/* ════════════════════════════════════════════════════════════
                   THE JOURNEY: Era-based chapter cards
                   ════════════════════════════════════════════════════════════ */}
                <section className="max-w-5xl mx-auto px-6 pb-16">
                    {/* Section title */}
                    <FadeInView margin="-80px" className="mb-12">
                        <div className="flex items-center gap-5">
                            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent flex-1" />
                            <div className="flex items-center gap-2.5 shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/50" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/30">
                                    {t("lab.landing.journey.title")}
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-violet-400/50" />
                            </div>
                            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent flex-1" />
                        </div>
                    </FadeInView>

                    {/* Eras */}
                    <div className="space-y-16">
                        {eras.map((era, eraIdx) => {
                            const style = eraStyles[era.key];
                            return (
                                <FadeInView
                                    key={era.key}
                                    delay={eraIdx * 0.08}
                                    margin="-60px"
                                    className="relative"
                                >
                                    {/* Vertical connector line between eras */}
                                    {eraIdx < eras.length - 1 && (
                                        <div className="absolute -bottom-16 left-[14px] w-px h-16 bg-gradient-to-b from-white/[0.06] to-transparent hidden md:block" />
                                    )}

                                    {/* Era header row */}
                                    <div className="flex flex-wrap items-center gap-3 mb-3">
                                        <div className="relative">
                                            <div className={cn("w-[30px] h-[30px] rounded-full flex items-center justify-center border", style.iconBg)}>
                                                <div className={cn("w-2 h-2 rounded-full", style.dot)} />
                                            </div>
                                        </div>
                                        <h2 className={cn("text-sm md:text-base font-bold uppercase tracking-[0.2em]", style.accent)}>
                                            {t(era.nameKey)}
                                        </h2>
                                        <Badge className={cn("text-[9px] font-mono px-3 py-0.5 border rounded-full", style.yearsBg)}>
                                            {t(era.yearsKey)}
                                        </Badge>
                                    </div>

                                    {/* Era question — big italic */}
                                    <div className="md:pl-[42px]">
                                        <p className="text-xl md:text-2xl lg:text-3xl font-semibold text-white/75 mb-2 leading-snug">
                                            &ldquo;{t(era.questionKey)}&rdquo;
                                        </p>
                                        <p className="text-sm text-white/30 mb-6 max-w-2xl leading-relaxed italic">
                                            {t(era.descriptionKey)}
                                        </p>

                                        {/* Top-bar accent line */}
                                        <div className={cn("h-px w-full mb-5 bg-gradient-to-r", style.lineGradient)} />

                                        {/* Model cards within this era */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {era.models.map((model, idx) => {
                                                const isReady = model.status === "ready";
                                                return (
                                                    <FadeInView
                                                        key={model.id}
                                                        delay={(eraIdx * 0.08) + (idx * 0.06)}
                                                    >
                                                        <Link
                                                            href={isReady ? model.href : "#"}
                                                            className={cn(
                                                                "group block h-full",
                                                                !isReady && "pointer-events-none"
                                                            )}
                                                            tabIndex={isReady ? undefined : -1}
                                                        >
                                                            <div
                                                                className={cn(
                                                                    "relative h-full rounded-2xl border bg-white/[0.015] backdrop-blur-sm p-6 transition-all duration-400 overflow-hidden",
                                                                    isReady ? style.border : "border-white/[0.05]",
                                                                    isReady && style.glow,
                                                                )}
                                                            >
                                                                {/* Accent top bar */}
                                                                <div className={cn(
                                                                    "absolute top-0 left-0 right-0 h-[2px]",
                                                                    isReady ? style.bar : "bg-white/[0.03]"
                                                                )} />

                                                                {/* Hover gradient wash + shimmer */}
                                                                <div className={cn(
                                                                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br",
                                                                    style.gradient,
                                                                )} />
                                                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 overflow-hidden pointer-events-none">
                                                                    <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-[1500ms] ease-in-out" />
                                                                </div>

                                                                <div className="relative z-10">
                                                                    <div className="flex items-start justify-between mb-4">
                                                                        <div className={cn(
                                                                            "w-11 h-11 rounded-xl border flex items-center justify-center transition-all duration-300",
                                                                            isReady
                                                                                ? `${style.iconBg} group-hover:scale-110`
                                                                                : "bg-white/[0.03] border-white/[0.06]",
                                                                            isReady ? style.accent : "text-white/20",
                                                                        )}>
                                                                            <model.icon className="w-5 h-5" />
                                                                        </div>
                                                                        <Badge
                                                                            className={cn(
                                                                                "text-[8px] font-mono uppercase tracking-[0.2em] py-0.5 px-2.5 rounded-full border",
                                                                                isReady
                                                                                    ? `${style.accentBg} ${style.accent} ${style.accentBorder}`
                                                                                    : "bg-white/[0.02] text-white/15 border-white/[0.05]"
                                                                            )}
                                                                        >
                                                                            {isReady ? t("lab.landing.journey.status.ready") : t("lab.landing.journey.status.soon")}
                                                                        </Badge>
                                                                    </div>

                                                                    <h3 className="text-lg font-bold text-white mb-1 tracking-tight">
                                                                        {model.name}
                                                                    </h3>
                                                                    <p className={cn("text-[11px] mb-3", isReady ? style.accentDim : "text-white/20")}>
                                                                        {model.subtitle}
                                                                    </p>
                                                                    <p className="text-[13px] text-white/35 leading-relaxed mb-5">
                                                                        {model.description}
                                                                    </p>

                                                                    {isReady ? (
                                                                        <div className={cn(
                                                                            "flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white/25 transition-colors duration-300",
                                                                            `group-hover:${style.accent}`
                                                                        )}>
                                                                            <span>{t("lab.landing.availableModels.enter")}</span>
                                                                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-300" />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-[10px] font-mono font-bold text-white/10 uppercase tracking-[0.2em]">
                                                                            {t("lab.landing.availableModels.locked")}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    </FadeInView>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </FadeInView>
                            );
                        })}
                    </div>
                </section>

                {/* ─── Footer ─── */}
                <footer className="max-w-5xl mx-auto px-6 pb-10 pt-6 border-t border-white/[0.03]">
                    <div className="flex items-center justify-center gap-2 text-[9px] font-mono text-white/15 uppercase tracking-[0.2em]">
                        <FlaskConical className="w-3 h-3" />
                        <span>{t("lab.landing.footer.text")}</span>
                    </div>
                </footer>
            </div>
        </div>
    );
}
