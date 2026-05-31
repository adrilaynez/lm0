"use client";

import { useId, useState } from "react";
import { BlockMath, InlineMath } from "react-katex";

import { motion, useReducedMotion } from "framer-motion";

import { FadeInView } from "@/features/lab/components/FadeInView";
import type { ArchitectureViz } from "@/features/lab/types/lmLab";
import { useI18n } from "@/i18n/context";

/**
 * ArchitectureDeepDive — the Bigram chapter's technical specification, redesigned into the v8
 * editorial-green language. Three calm movements, one focal point at a time:
 *
 *   1 · Mechanism — a numbered editorial timeline. Each step reads as prose (Source Serif), the
 *       formula lives in a sunken bg-2 well (mono accent equation), and a single quiet "?" disc
 *       reveals an elev tooltip on hover/focus — sophistication tucked away, not on the surface.
 *   2 · Analysis — capabilities and constraints under ONE accent system (the v8 single-accent rule):
 *       what the model *can* do is emerald, what it *cannot* is terracotta (--bigram-wrong). State is
 *       carried by fill + typography and a hairline rule, never by stacked boxes.
 *   3 · Model card — a single calm surface panel with a rule-2 hairline; mono eyebrows, ink values,
 *       use-cases as accent-soft pills.
 *
 * Token-only: reads exclusively --bigram-* variables + the registered fonts, resolved through the
 * [data-bigram-theme] scope the chapter wrapper sets. No raw hex, no neon, no other chapter's accent.
 * Reduced-motion safe (FadeInView + the only motion, the tooltip fade, both collapse to instant).
 */

const MONO = "font-[family-name:var(--bigram-font-mono)]";
const SERIF = "font-[family-name:var(--bigram-font-serif)]";
const DISPLAY = "font-[family-name:var(--bigram-font-display)]";

interface ArchitectureDeepDiveProps {
    data: ArchitectureViz | null;
}

interface StepDef {
    id: "matrixW" | "softmax" | "loss";
    equation: string;
    /** an extra inline equation shown inside the tooltip (softmax only) */
    tipEquation?: string;
}

const STEP_DEFS: StepDef[] = [
    { id: "matrixW", equation: "W \\in \\mathbb{R}^{|V| \\times |V|}" },
    {
        id: "softmax",
        equation: "P(x_{t+1} \\mid x_t) = \\text{softmax}(W[idx])",
        tipEquation: "\\sigma(z)_i = \\frac{e^{z_i}}{\\sum_j e^{z_j}}",
    },
    { id: "loss", equation: "\\mathcal{L} = -\\sum_{i} y_i \\log(\\hat{y}_i)" },
];

/* ── A single quiet "?" disc that reveals a tooltip on hover/focus. ─────────────────────────────
   The disc is the only chrome; the panel itself is an elevated surface with a mono accent title
   (the v8 callout voice). Reduced-motion safe. */
function StepTooltip({
    title,
    desc,
    tipEquation,
}: {
    title: string;
    desc: string;
    tipEquation?: string;
}) {
    const reduce = useReducedMotion();
    const [open, setOpen] = useState(false);
    const tipId = useId();

    return (
        <span
            className="relative ml-2 shrink-0"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <button
                type="button"
                aria-label={title}
                aria-expanded={open}
                aria-describedby={open ? tipId : undefined}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                className={`${MONO} flex h-5 w-5 items-center justify-center rounded-full border border-[color:var(--bigram-rule-2)] bg-bigram-surface text-[11px] font-semibold text-bigram-dim transition-colors hover:border-bigram-accent hover:text-bigram-accent focus:outline-none focus-visible:border-bigram-accent focus-visible:text-bigram-accent focus-visible:ring-2 focus-visible:ring-[color:var(--bigram-accent-soft)]`}
            >
                ?
            </button>

            {open && (
                <motion.span
                    id={tipId}
                    role="tooltip"
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                    className="absolute bottom-full right-0 z-40 mb-3 block w-72 rounded-[var(--bigram-r-md)] border border-[color:var(--bigram-rule-2)] bg-bigram-elev p-4 text-left shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7)]"
                >
                    <span
                        className={`${MONO} mb-2 flex items-center gap-2 text-[10.5px] uppercase tracking-[0.18em] text-bigram-accent`}
                    >
                        <span className="h-1.5 w-1.5 rounded-full bg-bigram-accent" />
                        {title}
                    </span>
                    <span className={`${SERIF} block text-[13px] leading-relaxed text-bigram-body`}>
                        {desc}
                    </span>
                    {tipEquation && (
                        <span className="mt-3 block text-[12px] text-bigram-accent-ink [&_.katex]:text-bigram-accent-ink">
                            <InlineMath math={tipEquation} />
                        </span>
                    )}
                </motion.span>
            )}
        </span>
    );
}

export function ArchitectureDeepDive({ data }: ArchitectureDeepDiveProps) {
    const { t } = useI18n();
    if (!data) return null;

    const strengths = [
        t("models.bigram.architecture.analysis.strengths.0"),
        t("models.bigram.architecture.analysis.strengths.1"),
        t("models.bigram.architecture.analysis.strengths.2"),
    ];

    const limitations = [
        t("models.bigram.architecture.analysis.limitations.0"),
        t("models.bigram.architecture.analysis.limitations.1"),
        t("models.bigram.architecture.analysis.limitations.2"),
    ];

    return (
        <section className="relative border-t border-bigram-rule py-20">
            <div className="mx-auto max-w-7xl px-6">

                {/* ── Section header · editorial numeral + mono label + hairline ── */}
                <div className="mb-14 max-w-2xl">
                    <div className="mb-5 flex items-baseline gap-3.5">
                        <span className={`${DISPLAY} text-[22px] font-semibold italic leading-none text-bigram-accent`}>
                            §
                        </span>
                        <span className={`${MONO} text-[11.5px] font-medium uppercase tracking-[0.18em] text-bigram-muted`}>
                            {t("models.bigram.architecture.title")}
                        </span>
                        <span className="h-px flex-1 self-center bg-[var(--bigram-rule)]" />
                    </div>
                    <p className={`${SERIF} text-[clamp(19px,2vw,22px)] leading-[1.5] text-bigram-ink-2 text-pretty`}>
                        {t("models.bigram.architecture.subtitle")}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-14">

                    {/* ── 1 · Mechanism ── */}
                    <FadeInView className="space-y-8">
                        <h3 className={`${MONO} flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-bigram-accent`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-bigram-accent" />
                            {t("models.bigram.architecture.mechanism")}
                        </h3>

                        <ol className="space-y-7">
                            {STEP_DEFS.map((step, i) => (
                                <li key={step.id} className="flex gap-4">
                                    {/* numeral + connector spine */}
                                    <div className="flex flex-col items-center pt-0.5">
                                        <span
                                            className={`${MONO} flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--bigram-rule-2)] bg-bigram-surface text-[12px] font-medium text-bigram-accent`}
                                        >
                                            {i + 1}
                                        </span>
                                        {i < STEP_DEFS.length - 1 && (
                                            <span className="my-2 w-px flex-1 bg-[var(--bigram-rule)]" />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1 space-y-3.5 pb-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={`${SERIF} text-[16px] leading-[1.6] text-bigram-body`}>
                                                {t(`models.bigram.architecture.stepsList.${step.id}`)}
                                            </p>
                                            <StepTooltip
                                                title={t(`models.bigram.architecture.tooltips.${step.id}.title`)}
                                                desc={t(`models.bigram.architecture.tooltips.${step.id}.desc`)}
                                                tipEquation={step.tipEquation}
                                            />
                                        </div>

                                        {/* formula well · sunken bg-2, rule-2 hairline, mono accent equation */}
                                        <div className="overflow-x-auto rounded-[var(--bigram-r-md)] border border-[color:var(--bigram-rule-2)] bg-bigram-bg-2 px-5 py-4 text-center text-bigram-accent [&_.katex]:text-bigram-accent">
                                            <BlockMath math={step.equation} />
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </FadeInView>

                    {/* ── 2 · Analysis · single-accent: emerald can / terracotta cannot ── */}
                    <FadeInView delay={0.1} className="space-y-10">
                        {/* Capabilities */}
                        <div>
                            <h3 className={`${MONO} flex items-center gap-3 border-b border-bigram-rule pb-2.5 text-[11px] uppercase tracking-[0.2em] text-bigram-accent`}>
                                <span className="h-1.5 w-1.5 rounded-full bg-bigram-accent" />
                                {t("models.bigram.architecture.capabilities")}
                            </h3>
                            <ul className="mt-5 space-y-4">
                                {strengths.map((s, i) => (
                                    <li key={i} className={`${SERIF} flex gap-3 text-[15px] leading-[1.55] text-bigram-body`}>
                                        <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-bigram-accent" />
                                        <span>{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Constraints */}
                        <div>
                            <h3 className={`${MONO} flex items-center gap-3 border-b border-[color:var(--bigram-rule)] pb-2.5 text-[11px] uppercase tracking-[0.2em] text-bigram-wrong`}>
                                <span className="h-1.5 w-1.5 rounded-full bg-bigram-wrong" />
                                {t("models.bigram.architecture.constraints")}
                            </h3>
                            <ul className="mt-5 space-y-4">
                                {limitations.map((l, i) => (
                                    <li key={i} className={`${SERIF} flex gap-3 text-[15px] leading-[1.55] text-bigram-body`}>
                                        <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-bigram-wrong" />
                                        <span>{l}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </FadeInView>

                    {/* ── 3 · Model card · calm surface panel, rule-2 hairline ── */}
                    <FadeInView
                        delay={0.2}
                        className="h-fit rounded-[var(--bigram-r-lg)] border border-[color:var(--bigram-rule-2)] bg-bigram-surface p-7"
                    >
                        <h3 className={`${DISPLAY} mb-7 text-[20px] font-semibold text-bigram-ink`}>
                            {t("models.bigram.architecture.modelCard.title")}
                        </h3>

                        <dl className="space-y-6">
                            <div>
                                <dt className={`${MONO} mb-1.5 text-[10px] uppercase tracking-[0.18em] text-bigram-muted`}>
                                    {t("models.bigram.architecture.modelCard.type")}
                                </dt>
                                <dd className={`${MONO} text-[15px] text-bigram-ink`}>{data.type}</dd>
                            </div>

                            <div>
                                <dt className={`${MONO} mb-1.5 text-[10px] uppercase tracking-[0.18em] text-bigram-muted`}>
                                    {t("models.bigram.architecture.modelCard.complexity")}
                                </dt>
                                <dd>
                                    <span
                                        className={`${MONO} inline-flex items-center rounded-[var(--bigram-r-pill)] border border-[color:var(--bigram-rule-2)] px-3 py-1 text-[12px] tracking-[0.04em] text-bigram-ink-2`}
                                    >
                                        {data.complexity}
                                    </span>
                                </dd>
                            </div>

                            <div>
                                <dt className={`${MONO} mb-2.5 text-[10px] uppercase tracking-[0.18em] text-bigram-muted`}>
                                    {t("models.bigram.architecture.modelCard.useCases")}
                                </dt>
                                <dd className="flex flex-wrap gap-2">
                                    {data.use_cases.map((u, i) => (
                                        <span
                                            key={i}
                                            className={`${MONO} inline-flex items-center rounded-[var(--bigram-r-pill)] bg-[var(--bigram-accent-soft)] px-3 py-1 text-[12px] tracking-[0.02em] text-bigram-accent-ink`}
                                        >
                                            {u}
                                        </span>
                                    ))}
                                </dd>
                            </div>

                            <div className="border-t border-bigram-rule pt-6">
                                <dt className={`${MONO} mb-2 text-[10px] uppercase tracking-[0.18em] text-bigram-muted`}>
                                    {t("models.bigram.architecture.modelCard.description")}
                                </dt>
                                <dd className={`${SERIF} text-[14px] leading-[1.65] text-bigram-body`}>
                                    {data.description}
                                </dd>
                            </div>
                        </dl>
                    </FadeInView>

                </div>
            </div>
        </section>
    );
}
