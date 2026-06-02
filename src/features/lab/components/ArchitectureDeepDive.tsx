"use client";

import { useId, useState } from "react";
import { BlockMath, InlineMath } from "react-katex";

import { motion, useReducedMotion } from "framer-motion";

import { FadeInView } from "@/features/lab/components/FadeInView";
import type { ArchitectureViz } from "@/features/lab/types/lmLab";
import { useI18n } from "@/i18n/context";

/**
 * ArchitectureDeepDive — the Bigram chapter's technical specification, redesigned into the v10
 * editorial-green DESIGN LANGUAGE (not a mechanical port — there is no v10 prototype for this
 * widget; it is brought up to the level of the four flagship Bigram widgets).
 *
 * The v8 version was a three-column dashboard — three competing focal points (mechanism / analysis /
 * model card) reading left-to-right at once. v10 is the opposite: ONE calm, centered editorial
 * column, max-width ~760px, hierarchy from type + space, state by fill, never by stacked boxes.
 *
 * The single focal point is THE MECHANISM — how one inference actually runs:
 *
 *   1 · Look up row W[idx]        2 · Softmax → probabilities       3 · Cross-entropy → learn
 *
 * read as a numbered editorial timeline, each step a serif sentence over a sunk `--bigram-bg-2`
 * formula well (the v10 `.formula` idiom: mono accent equation, mono caption). A single quiet "?"
 * disc tucks the depth away — hover/focus reveals an elevated tooltip. After the mechanism, two
 * boxless typographic lists (capabilities in accent, constraints in --bigram-wrong) and a single
 * sage-voiced model card close it out — the v10 `.takeaway` voice for the editorial coda.
 *
 * Tokens only: every value is a `--bigram-*` variable + a registered font var, resolved through the
 * [data-bigram-theme] scope the chapter wrapper sets. No raw hex, no neon, no other chapter's accent,
 * no traffic-dot chrome. The only motion (tooltip fade) collapses to instant under reduced motion;
 * FadeInView entrances are already reduced-motion friendly.
 *
 * Bigram-only: this file is imported solely by /lab/bigram (see app/lab/bigram/page.tsx), inside the
 * [data-bigram-theme] scope — so it is restyled DIRECTLY with no cross-chapter scoping needed.
 */

const MONO = "var(--font-jetbrains-mono)";
const SERIF = "var(--font-source-serif)";
const DISPLAY = "var(--font-playfair)";

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

/* ── mono uppercase eyebrow + dot + hairline — the v10 section-label voice ───────────────────── */
function Eyebrow({ children, tone = "accent" }: { children: React.ReactNode; tone?: "accent" | "wrong" }) {
    const color = tone === "wrong" ? "var(--bigram-wrong)" : "var(--bigram-accent)";
    return (
        <p
            style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: ".2em",
                textTransform: "uppercase",
                color,
                margin: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
            }}
        >
            <span aria-hidden style={{ height: 6, width: 6, borderRadius: 999, background: color }} />
            {children}
        </p>
    );
}

/* ── A single quiet "?" disc that reveals a tooltip on hover/focus. The disc is the only chrome; the
   panel is an elevated --bigram-elev surface with a mono accent title (the v10 callout voice).
   Reduced-motion safe. ──────────────────────────────────────────────────────────────────────── */
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
            style={{ position: "relative", flex: "none" }}
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
                style={{
                    display: "inline-grid",
                    placeItems: "center",
                    height: 22,
                    width: 22,
                    borderRadius: 999,
                    border: 0,
                    cursor: "help",
                    fontFamily: MONO,
                    fontSize: 12,
                    fontWeight: 600,
                    lineHeight: 1,
                    background: open ? "var(--bigram-accent-soft)" : "transparent",
                    color: open ? "var(--bigram-accent)" : "var(--bigram-dim)",
                    boxShadow: `inset 0 0 0 1px ${open ? "var(--bigram-accent)" : "var(--bigram-rule-2)"}`,
                    transition: "color .2s ease, background .2s ease, box-shadow .2s ease",
                }}
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
                    style={{
                        position: "absolute",
                        bottom: "calc(100% + 12px)",
                        right: 0,
                        zIndex: 40,
                        display: "block",
                        width: 288,
                        textAlign: "left",
                        padding: 18,
                        borderRadius: "var(--bigram-r-md)",
                        background: "var(--bigram-elev)",
                        boxShadow: "inset 0 1px 0 0 rgba(255,255,255,.06), 0 26px 60px -28px rgba(0,0,0,.7)",
                    }}
                >
                    <span
                        style={{
                            fontFamily: MONO,
                            fontSize: 10.5,
                            letterSpacing: ".16em",
                            textTransform: "uppercase",
                            color: "var(--bigram-accent)",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 9,
                        }}
                    >
                        <span aria-hidden style={{ height: 6, width: 6, borderRadius: 999, background: "var(--bigram-accent)" }} />
                        {title}
                    </span>
                    <span style={{ fontFamily: SERIF, fontSize: 13.5, lineHeight: 1.6, color: "var(--bigram-body)", display: "block" }}>
                        {desc}
                    </span>
                    {tipEquation && (
                        <span
                            style={{ display: "block", marginTop: 12, color: "var(--bigram-accent-ink)" }}
                            className="[&_.katex]:text-bigram-accent-ink"
                        >
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
        <section style={{ borderTop: "1px solid var(--bigram-rule)" }} className="py-20">
            <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>

                {/* ── Section header · Playfair index · mono eyebrow · serif lead (centered) ── */}
                <FadeInView className="text-center" style={{ marginBottom: 64 }}>
                    <span
                        style={{
                            fontFamily: DISPLAY,
                            fontStyle: "italic",
                            fontWeight: 500,
                            fontSize: "clamp(40px, 6vw, 58px)",
                            lineHeight: 1,
                            color: "var(--bigram-accent)",
                            display: "block",
                            marginBottom: 14,
                            letterSpacing: "-.01em",
                        }}
                    >
                        §
                    </span>
                    <p
                        style={{
                            fontFamily: MONO,
                            fontSize: 11.5,
                            letterSpacing: ".2em",
                            textTransform: "uppercase",
                            color: "var(--bigram-muted)",
                            margin: "0 0 16px",
                        }}
                    >
                        {t("models.bigram.architecture.title")}
                    </p>
                    <p
                        style={{
                            fontFamily: SERIF,
                            fontSize: "clamp(19px, 2.2vw, 23px)",
                            lineHeight: 1.5,
                            color: "var(--bigram-ink-2)",
                            margin: "0 auto",
                            maxWidth: "32ch",
                            textWrap: "pretty",
                        }}
                    >
                        {t("models.bigram.architecture.subtitle")}
                    </p>
                </FadeInView>

                {/* ── 1 · THE MECHANISM · the single focal point — a numbered editorial timeline ── */}
                <FadeInView delay={0.05}>
                    <div style={{ textAlign: "center", marginBottom: 36 }}>
                        <Eyebrow>{t("models.bigram.architecture.mechanism")}</Eyebrow>
                    </div>

                    <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
                        {STEP_DEFS.map((step, i) => (
                            <li key={step.id} style={{ display: "flex", gap: 22, alignItems: "stretch" }}>
                                {/* numeral + connector spine */}
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none" }}>
                                    <span
                                        style={{
                                            display: "inline-grid",
                                            placeItems: "center",
                                            height: 34,
                                            width: 34,
                                            borderRadius: 999,
                                            fontFamily: MONO,
                                            fontSize: 14,
                                            fontWeight: 600,
                                            lineHeight: 1,
                                            color: "var(--bigram-on-accent)",
                                            background: "var(--bigram-accent)",
                                            boxShadow:
                                                "0 5px 14px -6px color-mix(in oklab, var(--bigram-accent) 60%, transparent)",
                                        }}
                                    >
                                        {i + 1}
                                    </span>
                                    {i < STEP_DEFS.length - 1 && (
                                        <span
                                            aria-hidden
                                            style={{ flex: 1, width: 2, borderRadius: 2, margin: "8px 0", background: "var(--bigram-rule-2)" }}
                                        />
                                    )}
                                </div>

                                <div style={{ minWidth: 0, flex: 1, paddingBottom: i < STEP_DEFS.length - 1 ? 30 : 0 }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
                                        <p
                                            style={{
                                                fontFamily: SERIF,
                                                fontSize: 16.5,
                                                lineHeight: 1.6,
                                                color: "var(--bigram-body)",
                                                margin: 0,
                                                paddingTop: 4,
                                                textWrap: "pretty",
                                            }}
                                        >
                                            {t(`models.bigram.architecture.stepsList.${step.id}`)}
                                        </p>
                                        <span style={{ paddingTop: 6 }}>
                                            <StepTooltip
                                                title={t(`models.bigram.architecture.tooltips.${step.id}.title`)}
                                                desc={t(`models.bigram.architecture.tooltips.${step.id}.desc`)}
                                                tipEquation={step.tipEquation}
                                            />
                                        </span>
                                    </div>

                                    {/* formula well · the v10 `.formula` idiom — sunk bg-2, mono accent equation */}
                                    <div
                                        style={{
                                            overflowX: "auto",
                                            marginTop: 16,
                                            padding: "18px 20px",
                                            borderRadius: "var(--bigram-r-md)",
                                            background: "var(--bigram-bg-2)",
                                            boxShadow: "inset 0 2px 8px rgba(0,0,0,.26)",
                                            textAlign: "center",
                                            color: "var(--bigram-accent)",
                                        }}
                                        className="[&_.katex]:text-bigram-accent"
                                    >
                                        <BlockMath math={step.equation} />
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ol>
                </FadeInView>

                {/* ── 2 · Analysis · two boxless typographic lists — accent CAN, terracotta CANNOT ── */}
                <FadeInView delay={0.1} style={{ marginTop: 64 }}>
                    <div
                        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "clamp(32px, 5vw, 56px)" }}
                    >
                        {/* Capabilities */}
                        <div>
                            <div style={{ paddingBottom: 12, borderBottom: "1px solid var(--bigram-rule)" }}>
                                <Eyebrow>{t("models.bigram.architecture.capabilities")}</Eyebrow>
                            </div>
                            <ul style={{ listStyle: "none", margin: "20px 0 0", padding: 0 }}>
                                {strengths.map((s, i) => (
                                    <li
                                        key={i}
                                        style={{
                                            display: "flex",
                                            gap: 12,
                                            fontFamily: SERIF,
                                            fontSize: 15,
                                            lineHeight: 1.55,
                                            color: "var(--bigram-body)",
                                            marginBottom: 16,
                                        }}
                                    >
                                        <span aria-hidden style={{ marginTop: 9, height: 6, width: 6, borderRadius: 999, flex: "none", background: "var(--bigram-accent)" }} />
                                        <span>{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Constraints */}
                        <div>
                            <div style={{ paddingBottom: 12, borderBottom: "1px solid var(--bigram-rule)" }}>
                                <Eyebrow tone="wrong">{t("models.bigram.architecture.constraints")}</Eyebrow>
                            </div>
                            <ul style={{ listStyle: "none", margin: "20px 0 0", padding: 0 }}>
                                {limitations.map((l, i) => (
                                    <li
                                        key={i}
                                        style={{
                                            display: "flex",
                                            gap: 12,
                                            fontFamily: SERIF,
                                            fontSize: 15,
                                            lineHeight: 1.55,
                                            color: "var(--bigram-body)",
                                            marginBottom: 16,
                                        }}
                                    >
                                        <span aria-hidden style={{ marginTop: 9, height: 6, width: 6, borderRadius: 999, flex: "none", background: "var(--bigram-wrong)" }} />
                                        <span>{l}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </FadeInView>

                {/* ── 3 · Model card · the v10 sage `.takeaway` voice — editorial coda, not a dashboard tile ── */}
                <FadeInView
                    delay={0.15}
                    style={{
                        marginTop: 56,
                        padding: "28px 28px 28px 30px",
                        borderRadius: "var(--bigram-r-lg)",
                        background: "linear-gradient(135deg, var(--bigram-sage-soft), transparent 82%)",
                        boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--bigram-sage) 30%, transparent)",
                    }}
                >
                    <div style={{ marginBottom: 22 }}>
                        <p
                            style={{
                                fontFamily: MONO,
                                fontSize: 10.5,
                                letterSpacing: ".18em",
                                textTransform: "uppercase",
                                color: "var(--bigram-sage)",
                                margin: 0,
                            }}
                        >
                            {t("models.bigram.architecture.modelCard.title")}
                        </p>
                    </div>

                    <dl
                        style={{
                            margin: 0,
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: "22px 32px",
                        }}
                    >
                        <div>
                            <dt style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--bigram-muted)", marginBottom: 7 }}>
                                {t("models.bigram.architecture.modelCard.type")}
                            </dt>
                            <dd style={{ margin: 0, fontFamily: MONO, fontSize: 15, color: "var(--bigram-ink)" }}>{data.type}</dd>
                        </div>

                        <div>
                            <dt style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--bigram-muted)", marginBottom: 7 }}>
                                {t("models.bigram.architecture.modelCard.complexity")}
                            </dt>
                            <dd style={{ margin: 0 }}>
                                <span
                                    style={{
                                        fontFamily: MONO,
                                        fontSize: 12,
                                        letterSpacing: ".03em",
                                        color: "var(--bigram-accent-ink)",
                                        background: "var(--bigram-accent-soft)",
                                        padding: "5px 12px",
                                        borderRadius: "var(--bigram-r-pill)",
                                        display: "inline-flex",
                                        alignItems: "center",
                                    }}
                                >
                                    {data.complexity}
                                </span>
                            </dd>
                        </div>

                        <div style={{ gridColumn: "1 / -1" }}>
                            <dt style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--bigram-muted)", marginBottom: 10 }}>
                                {t("models.bigram.architecture.modelCard.useCases")}
                            </dt>
                            <dd style={{ margin: 0, display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {data.use_cases.map((u, i) => (
                                    <span
                                        key={i}
                                        style={{
                                            fontFamily: MONO,
                                            fontSize: 12,
                                            letterSpacing: ".02em",
                                            color: "var(--bigram-accent-ink)",
                                            background: "var(--bigram-accent-soft)",
                                            padding: "5px 12px",
                                            borderRadius: "var(--bigram-r-pill)",
                                            display: "inline-flex",
                                            alignItems: "center",
                                        }}
                                    >
                                        {u}
                                    </span>
                                ))}
                            </dd>
                        </div>

                        <div style={{ gridColumn: "1 / -1", paddingTop: 22, borderTop: "1px solid color-mix(in oklab, var(--bigram-sage) 22%, transparent)" }}>
                            <dt style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--bigram-muted)", marginBottom: 9 }}>
                                {t("models.bigram.architecture.modelCard.description")}
                            </dt>
                            <dd style={{ margin: 0, fontFamily: SERIF, fontSize: 16, lineHeight: 1.6, color: "var(--bigram-ink)", textWrap: "pretty" }}>
                                {data.description}
                            </dd>
                        </div>
                    </dl>
                </FadeInView>

            </div>
        </section>
    );
}
