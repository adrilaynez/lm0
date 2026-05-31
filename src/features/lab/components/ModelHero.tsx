"use client";

import { memo } from "react";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, type LucideIcon } from "lucide-react";

import { ModeToggle } from "@/features/lab/components/ModeToggle";
import { useI18n } from "@/i18n/context";

export interface StatItem {
    label: string;
    value: string;
    icon: LucideIcon;
    desc: string;
    color: string;
}

interface ModelHeroProps {
    title?: string;
    description?: string;
    showExplanationCta?: boolean;
    customStats?: StatItem[];
    /**
     * Opt-in editorial-green treatment for the Bigram chapter (v8). When omitted, the hero renders
     * exactly as before so the N-gram / MLP / Neural-Networks chapters keep their indigo identity
     * untouched. The "bigram" branch reads only --bigram-* tokens and is gated by the page's
     * [data-bigram-theme] scope, so no other accent is ever affected.
     */
    accent?: "default" | "bigram";
}

export const ModelHero = memo(function ModelHero(props: ModelHeroProps) {
    if (props.accent === "bigram") {
        return <BigramHero {...props} />;
    }
    return <DefaultHero {...props} />;
});

/* ============================================================
   BIGRAM · editorial-green hero (v8)
   Calm, confident, typography-first. One Playfair title with an
   accent word; a single faint --bigram-accent glow instead of the
   old indigo/violet blob soup; mono kicker with a hairline rule.
   ============================================================ */

/** Split the title so the final word carries the accent (e.g. "Bigram Language" · "Model"). */
function splitAccentTitle(title: string): { lead: string; accent: string } {
    const words = title.trim().split(/\s+/);
    if (words.length <= 1) {
        return { lead: "", accent: title.trim() };
    }
    return {
        lead: words.slice(0, -1).join(" "),
        accent: words[words.length - 1],
    };
}

function BigramHero({ title, description }: ModelHeroProps) {
    const { t } = useI18n();
    const reduceMotion = useReducedMotion();

    const displayTitle = title ?? t("models.bigram.title");
    const displayDesc = description ?? t("models.bigram.description");
    const { lead, accent } = splitAccentTitle(displayTitle);

    const rise = (delay: number) =>
        reduceMotion
            ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.4, delay } }
            : {
                  initial: { opacity: 0, y: 16 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.7, delay, ease: [0.2, 0.7, 0.2, 1] as const },
              };

    return (
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">

            {/* ── Background · ONE faint accent glow, top-left. No blobs, no neon. ── */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <motion.div
                    aria-hidden
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.4, ease: "easeOut" }}
                    className="absolute -left-[6%] -top-[18%] h-[460px] w-[560px] rounded-full blur-[120px]"
                    style={{
                        background:
                            "radial-gradient(circle, color-mix(in oklab, var(--bigram-accent) 16%, transparent), transparent 70%)",
                    }}
                />
            </div>

            <div className="relative z-10 mx-auto max-w-[880px] px-6 md:px-7">

                {/* ── Kicker · mono uppercase + accent hairline + dot ── */}
                <motion.div {...rise(0)} className="mb-8 flex items-center gap-3">
                    <span
                        className="h-px w-9"
                        style={{ background: "var(--bigram-accent)", opacity: 0.55 }}
                    />
                    <span
                        className="inline-flex items-center gap-2.5 text-bigram-accent"
                        style={{
                            fontFamily: "var(--bigram-font-mono)",
                            fontSize: "12px",
                            fontWeight: 500,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                        }}
                    >
                        <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: "var(--bigram-accent)" }}
                        />
                        {t("models.bigram.hero.scientificInstrument")}
                    </span>
                </motion.div>

                {/* ── Title · editorial Playfair, accent word italic ── */}
                <motion.h1
                    {...rise(0.08)}
                    className="text-bigram-ink"
                    style={{
                        fontFamily: "var(--bigram-font-display)",
                        fontWeight: 600,
                        fontSize: "clamp(46px, 7vw, 92px)",
                        lineHeight: 1.0,
                        letterSpacing: "-0.018em",
                        textWrap: "balance",
                        margin: 0,
                    }}
                >
                    {lead && <span>{lead} </span>}
                    <span
                        className="text-bigram-accent"
                        style={{ fontStyle: "italic", fontWeight: 500 }}
                    >
                        {accent}
                    </span>
                </motion.h1>

                {/* ── Lead · Source Serif, ink-2, editorial measure ── */}
                <motion.p
                    {...rise(0.16)}
                    className="text-bigram-ink-2"
                    style={{
                        fontFamily: "var(--bigram-font-serif)",
                        fontSize: "clamp(21px, 2.2vw, 25px)",
                        fontWeight: 400,
                        lineHeight: 1.55,
                        maxWidth: "33em",
                        textWrap: "pretty",
                        margin: "28px 0 0",
                    }}
                >
                    {displayDesc}
                </motion.p>

                {/* ── Mode toggle ── */}
                <motion.div {...rise(0.26)} className="mt-12 flex">
                    <ModeToggle />
                </motion.div>

                {/* ── Scroll cue · quiet, accent-tinted ── */}
                <motion.div
                    {...rise(0.36)}
                    className="mt-16 flex"
                    aria-hidden
                >
                    <motion.span
                        className="text-bigram-dim"
                        animate={reduceMotion ? undefined : { y: [0, 6, 0] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <ArrowDown className="h-5 w-5" strokeWidth={1.5} />
                    </motion.span>
                </motion.div>

            </div>
        </section>
    );
}

/* ============================================================
   DEFAULT · original hero (N-gram / MLP / Neural Networks)
   Unchanged behavior and appearance — do not retheme.
   ============================================================ */

function DefaultHero({ title, description, customStats }: ModelHeroProps) {
    const { t } = useI18n();

    const displayTitle = title ?? t("models.bigram.title");
    const displayDesc = description ?? t("models.bigram.description");

    return (
        <section className="relative pt-16 pb-24 md:pt-28 md:pb-36 overflow-hidden">

            {/* ── Background (static, GPU-friendly) ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[100px]" />
                <div className="absolute top-[20%] right-[5%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[80px]" />
                <div className="absolute bottom-0 left-1/2 w-[400px] h-[300px] rounded-full bg-blue-500/10 blur-[60px]" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">

                {/* ── Eyebrow badge ── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex justify-center mb-8"
                >
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/[0.07] text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-indigo-300/70">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        {t("models.bigram.hero.scientificInstrument")}
                    </span>
                </motion.div>

                {/* ── Title ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                >
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
                        <span className="text-white">{displayTitle.split(" ")[0]} </span>
                        <span className="bg-gradient-to-r from-indigo-400 via-blue-300 to-violet-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(99,102,241,0.35)]">
                            {displayTitle.split(" ").slice(1).join(" ")}
                        </span>
                    </h1>
                </motion.div>

                {/* ── Description ── */}
                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="text-base md:text-lg text-white/40 max-w-2xl mx-auto leading-relaxed font-light mb-10"
                >
                    {displayDesc}
                </motion.p>

                {/* ── Custom Stats (if provided) ── */}
                {customStats && customStats.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16"
                    >
                        {customStats.map((stat, i) => (
                            <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col items-center gap-2">
                                <stat.icon className={`w-5 h-5 text-${stat.color}-400 mb-1`} />
                                <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
                                <div className="text-[10px] uppercase tracking-wider text-white/40 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* ── Mode Toggle ── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                    className="flex justify-center mb-16"
                >
                    <ModeToggle />
                </motion.div>

                {/* ── Scroll cue ── */}
                <div className="text-white/10 flex justify-center animate-bounce">
                    <ArrowDown className="w-5 h-5" />
                </div>

            </div>
        </section>
    );
}
