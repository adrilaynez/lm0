"use client";

import { useId, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import type { HistoricalContext } from "@/features/lab/types/lmLab";

/**
 * HistoricalContextPanel — a collapsible "historical context" disclosure (description, limitations,
 * modern evolution).
 *
 * SHARED COMPONENT — additive accent scoping.
 * --------------------------------------------------------------------------------------------------
 * This panel ships TWO visual treatments behind one `accent` prop:
 *
 *   • accent="lab"  (DEFAULT, safe) — neutral shared-chrome look on `--lab-*` tokens. This is what any
 *     non-opted-in chapter (e.g. N-gram) gets. Nothing here references `--bigram-*`, so no editorial
 *     green can leak into another chapter.
 *
 *   • accent="bigram" (opt-in) — the v10 flagship editorial-green treatment: a calm card-like
 *     disclosure header in Playfair (the v10 heading face), fill-not-border states, the limitations
 *     carried by the honest `--bigram-wrong` voice, and the evolution shown as a sage `.takeaway`
 *     insight panel. Only this branch touches `--bigram-*`; it is meant to live inside the consumer's
 *     [data-bigram-theme] scope.
 *
 * The branch is chosen purely from the `accent` prop — never from a global theme — so a chapter opts
 * in explicitly and other chapters are byte-identical to the neutral default. Premium-but-minimal
 * motion (spring on the glyph, smooth height/opacity collapse), all reduced-motion safe.
 */

type PanelAccent = "lab" | "bigram";

interface HistoricalContextLabels {
    /** Header title, e.g. "Historical Significance & Context" */
    title: string;
    /** Pill hint (stable across states; the disc glyph carries open/closed) */
    learnMore: string;
    /** Mono eyebrow over the description block */
    description: string;
    /** Mono eyebrow over the limitations list */
    limitations: string;
    /** Mono eyebrow over the evolution insight */
    evolution: string;
}

const DEFAULT_LABELS: HistoricalContextLabels = {
    title: "Historical Significance & Context",
    learnMore: "Learn More",
    description: "Description",
    limitations: "Key Limitations",
    evolution: "Evolution to Modern AI",
};

interface HistoricalContextPanelProps {
    data?: HistoricalContext;
    collapsible?: boolean;
    /**
     * Visual treatment. Defaults to the neutral shared-chrome `"lab"` look so existing/other-chapter
     * callers are unaffected. Pass `"bigram"` (inside a [data-bigram-theme] scope) to get the v10
     * editorial-green flagship treatment.
     */
    accent?: PanelAccent;
    /** Localised chrome strings. Falls back to English so the panel works standalone. */
    labels?: Partial<HistoricalContextLabels>;
}

const SPRING = { type: "spring", stiffness: 380, damping: 32 } as const;
const EASE = [0.2, 0.8, 0.2, 1] as const;

/** Mono uppercase eyebrow — the section-label voice (no box, just type). */
function Eyebrow({
    children,
    fontMono,
    color,
}: {
    children: React.ReactNode;
    fontMono: string;
    color: string;
}) {
    return (
        <h4
            className="mb-3"
            style={{
                fontFamily: fontMono,
                fontSize: "10.5px",
                fontWeight: 500,
                letterSpacing: ".2em",
                textTransform: "uppercase",
                color,
            }}
        >
            {children}
        </h4>
    );
}

/* ─────────────────────────── per-accent token maps ───────────────────────────
   Every visible color/radius/font is resolved from one of these maps. The "lab" map
   is the safe default and never references --bigram-*; the "bigram" map is the only
   place editorial green is introduced. */

interface AccentTokens {
    fontDisplay: string;
    fontSerif: string;
    fontMono: string;
    rMd: string;
    rLg: string;
    rPill: string;
    rule: string;
    /** header fill when collapsed/closed */
    headerRest: string;
    /** header fill when open */
    headerOpen: string;
    ink: string;
    body: string;
    bodyDim: string;
    muted: string;
    /** marker / accent dot + pill disc */
    accent: string;
    accentInk: string;
    accentSoftFill: string;
    accentPillBorder: string;
    onAccent: string;
    /** the honest "limitation" marker */
    wrong: string;
    /** evolution insight panel */
    insightBg: string;
    insightBorder: string;
    insightInk: string;
}

const LAB_TOKENS: AccentTokens = {
    fontDisplay: "inherit",
    fontSerif: "inherit",
    fontMono: "var(--font-jetbrains-mono), ui-monospace, monospace",
    rMd: "12px",
    rLg: "16px",
    rPill: "999px",
    rule: "var(--lab-border)",
    headerRest: "var(--lab-surface)",
    headerOpen: "var(--lab-surface)",
    ink: "var(--lab-text)",
    body: "var(--lab-text)",
    bodyDim: "var(--lab-text-muted)",
    muted: "var(--lab-text-muted)",
    accent: "var(--lab-text)",
    accentInk: "var(--lab-text)",
    accentSoftFill: "var(--lab-surface)",
    accentPillBorder: "var(--lab-border)",
    onAccent: "var(--lab-bg)",
    wrong: "var(--lab-text-muted)",
    insightBg: "var(--lab-surface)",
    insightBorder: "var(--lab-border)",
    insightInk: "var(--lab-text)",
};

const BIGRAM_TOKENS: AccentTokens = {
    fontDisplay: "var(--font-playfair), Georgia, 'Times New Roman', serif",
    fontSerif: "var(--font-source-serif), Georgia, serif",
    fontMono: "var(--font-jetbrains-mono), ui-monospace, monospace",
    rMd: "var(--bigram-r-md)",
    rLg: "var(--bigram-r-lg)",
    rPill: "var(--bigram-r-pill)",
    rule: "var(--bigram-rule)",
    headerRest: "color-mix(in oklab, var(--bigram-ink) 3%, transparent)",
    headerOpen: "var(--bigram-accent-soft)",
    ink: "var(--bigram-ink)",
    body: "var(--bigram-body)",
    bodyDim: "var(--bigram-ink-2)",
    muted: "var(--bigram-muted)",
    accent: "var(--bigram-accent)",
    accentInk: "var(--bigram-accent-ink)",
    accentSoftFill: "color-mix(in oklab, var(--bigram-accent) 8%, transparent)",
    accentPillBorder: "color-mix(in oklab, var(--bigram-accent) 32%, var(--bigram-rule))",
    onAccent: "var(--bigram-on-accent)",
    wrong: "var(--bigram-wrong)",
    insightBg: "linear-gradient(135deg, var(--bigram-sage-soft), transparent 82%)",
    insightBorder: "color-mix(in oklab, var(--bigram-sage) 30%, transparent)",
    insightInk: "var(--bigram-ink)",
};

export function HistoricalContextPanel({
    data,
    collapsible = false,
    accent = "lab",
    labels,
}: HistoricalContextPanelProps) {
    const reduce = useReducedMotion();
    const [isOpen, setIsOpen] = useState(!collapsible);
    const panelId = useId();

    if (!data) return null;

    const l = { ...DEFAULT_LABELS, ...labels };
    const open = !collapsible || isOpen;
    const tk = accent === "bigram" ? BIGRAM_TOKENS : LAB_TOKENS;

    const content = (
        <div className="px-1 pt-7 pb-1 sm:px-2">
            {/* Description — lead voice */}
            <div>
                <Eyebrow fontMono={tk.fontMono} color={tk.muted}>
                    {l.description}
                </Eyebrow>
                <p style={{ fontFamily: tk.fontSerif, lineHeight: 1.7, color: tk.body }}>
                    {data.description}
                </p>
            </div>

            <div className="mt-9 grid grid-cols-1 gap-9 md:grid-cols-2">
                {/* Limitations — honest "what it cannot do" voice (wrong marker, not accent) */}
                <div>
                    <Eyebrow fontMono={tk.fontMono} color={tk.muted}>
                        {l.limitations}
                    </Eyebrow>
                    <ul className="space-y-3">
                        {data.limitations.map((lim, i) => (
                            <li
                                key={i}
                                className="flex items-start gap-3 text-[15.5px]"
                                style={{ fontFamily: tk.fontSerif, lineHeight: 1.55, color: tk.bodyDim }}
                            >
                                <span
                                    aria-hidden
                                    className="mt-[9px] h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                    style={{ background: tk.wrong }}
                                />
                                <span>{lim}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Evolution — the payoff, in the sage *insight* voice (v10 `.takeaway`) */}
                <div>
                    <Eyebrow fontMono={tk.fontMono} color={tk.muted}>
                        {l.evolution}
                    </Eyebrow>
                    <div
                        className="p-5"
                        style={{
                            fontFamily: tk.fontSerif,
                            fontSize: "15.5px",
                            lineHeight: 1.6,
                            color: tk.insightInk,
                            borderRadius: tk.rLg,
                            background: tk.insightBg,
                            border: `1px solid ${tk.insightBorder}`,
                        }}
                    >
                        {data.modern_evolution}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="my-8">
            <motion.button
                type="button"
                onClick={collapsible ? () => setIsOpen((o) => !o) : undefined}
                aria-expanded={collapsible ? open : undefined}
                aria-controls={collapsible ? panelId : undefined}
                whileHover={collapsible && !reduce ? { y: -1 } : undefined}
                transition={SPRING}
                className={`group flex w-full items-center gap-3.5 px-5 py-4 text-left ${
                    collapsible ? "cursor-pointer" : "cursor-default"
                }`}
                style={{
                    borderRadius: tk.rMd,
                    border: `1px solid ${tk.rule}`,
                    background: open ? tk.headerOpen : tk.headerRest,
                    transition: "background .2s ease, border-color .2s ease",
                }}
            >
                <span
                    aria-hidden
                    className="h-2.5 w-2.5 flex-none rounded-full"
                    style={{ background: tk.accent }}
                />
                <h3
                    className="flex-1 text-[19px]"
                    style={{ fontFamily: tk.fontDisplay, fontWeight: 600, color: tk.ink }}
                >
                    {l.title}
                </h3>

                {collapsible && (
                    <span
                        className="flex flex-none items-center gap-2 py-1.5 pl-3.5 pr-1.5"
                        style={{
                            fontFamily: tk.fontMono,
                            fontSize: "10.5px",
                            letterSpacing: ".18em",
                            textTransform: "uppercase",
                            color: tk.accentInk,
                            borderRadius: tk.rPill,
                            border: `1px solid ${tk.accentPillBorder}`,
                            background: tk.accentSoftFill,
                        }}
                    >
                        {l.learnMore}
                        <span
                            aria-hidden
                            className="grid h-[18px] w-[18px] place-items-center rounded-full"
                            style={{ background: tk.accent, color: tk.onAccent }}
                        >
                            <motion.span
                                animate={{ rotate: open ? 45 : 0 }}
                                transition={reduce ? { duration: 0 } : SPRING}
                                style={{
                                    fontSize: "16px",
                                    lineHeight: 1,
                                    fontWeight: 400,
                                    display: "block",
                                }}
                            >
                                +
                            </motion.span>
                        </span>
                    </span>
                )}
            </motion.button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        id={collapsible ? panelId : undefined}
                        key="body"
                        initial={reduce ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={
                            reduce
                                ? { duration: 0 }
                                : {
                                      height: { duration: 0.42, ease: EASE },
                                      opacity: { duration: 0.3, ease: EASE },
                                  }
                        }
                        style={{ overflow: "hidden" }}
                    >
                        {content}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
