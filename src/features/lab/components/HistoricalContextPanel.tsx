"use client";

import { useId, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import type { HistoricalContext } from "@/features/lab/types/lmLab";

/**
 * HistoricalContextPanel — editorial-green (v8) collapsible disclosure for the Bigram chapter.
 *
 * Redesigned to the canonical Bigram language: this is no longer a chrome "window" with a tinted
 * header bar — it is a v8 `.xpand` disclosure (see styles-v8.css). The whole header is one calm,
 * card-like control: an accent dot marker, a serif title, and a pill "Learn more" hint whose disc
 * glyph rotates (+ → ×) to carry the open/closed state. Hover/focus warms the row to accent-soft.
 *
 * Body, when open, is typography-first: a mono accent eyebrow over the description, the limitations
 * carried by warm `--bigram-wrong` markers (the honest "what it cannot do" voice, kept distinct from
 * the accent), and the evolution shown as a sage-soft *insight* panel — the conceptual payoff, in the
 * editorial sage voice the spec reserves for takeaways.
 *
 * Tokens: only `--bigram-*` (+ registered font vars). It lives inside the consumer's
 * [data-bigram-theme] scope, so no green leaks to other chapters. Premium-but-minimal motion: a spring
 * on the glyph, a smooth height/opacity collapse, staged content fade — all reduced-motion safe.
 */

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
    /** Localised chrome strings. Falls back to English so the panel works standalone. */
    labels?: Partial<HistoricalContextLabels>;
}

const SPRING = { type: "spring", stiffness: 380, damping: 32 } as const;
const EASE = [0.2, 0.8, 0.2, 1] as const;

/** Mono uppercase eyebrow — the section label voice (no box, just type). */
function Eyebrow({ children }: { children: React.ReactNode }) {
    return (
        <h4
            style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: "10.5px",
                fontWeight: 500,
                letterSpacing: ".2em",
                textTransform: "uppercase",
            }}
            className="text-bigram-muted mb-3"
        >
            {children}
        </h4>
    );
}

export function HistoricalContextPanel({
    data,
    collapsible = false,
    labels,
}: HistoricalContextPanelProps) {
    const reduce = useReducedMotion();
    const [isOpen, setIsOpen] = useState(!collapsible);
    const panelId = useId();

    if (!data) return null;

    const l = { ...DEFAULT_LABELS, ...labels };
    const open = !collapsible || isOpen;

    const content = (
        <div className="px-1 pt-7 pb-1 sm:px-2">
            {/* Description — lead voice */}
            <div>
                <Eyebrow>{l.description}</Eyebrow>
                <p
                    style={{ fontFamily: "var(--font-source-serif)", lineHeight: 1.7 }}
                    className="text-bigram-body"
                >
                    {data.description}
                </p>
            </div>

            <div className="mt-9 grid grid-cols-1 gap-9 md:grid-cols-2">
                {/* Limitations — honest "what it cannot do" voice (wrong markers, not accent) */}
                <div>
                    <Eyebrow>{l.limitations}</Eyebrow>
                    <ul className="space-y-3">
                        {data.limitations.map((lim, i) => (
                            <li
                                key={i}
                                style={{ fontFamily: "var(--font-source-serif)", lineHeight: 1.55 }}
                                className="flex items-start gap-3 text-[15.5px] text-bigram-ink-2"
                            >
                                <span
                                    aria-hidden
                                    className="mt-[9px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-bigram-wrong"
                                />
                                <span>{lim}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Evolution — the payoff, in the sage *insight* voice (spec §5 takeaway) */}
                <div>
                    <Eyebrow>{l.evolution}</Eyebrow>
                    <div
                        className="rounded-[var(--bigram-r-lg)] p-5"
                        style={{
                            fontFamily: "var(--font-source-serif)",
                            fontSize: "15.5px",
                            lineHeight: 1.6,
                            color: "var(--bigram-ink)",
                            background:
                                "linear-gradient(135deg, var(--bigram-sage-soft), transparent 82%)",
                            border: "1px solid color-mix(in oklab, var(--bigram-sage) 30%, transparent)",
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
                className={`group flex w-full items-center gap-3.5 rounded-[var(--bigram-r-md)] px-5 py-4 text-left ${
                    collapsible ? "cursor-pointer" : "cursor-default"
                }`}
                style={{
                    border: "1px solid var(--bigram-rule)",
                    background: open
                        ? "var(--bigram-accent-soft)"
                        : "color-mix(in oklab, var(--bigram-ink) 3%, transparent)",
                    transition: "background .2s ease, border-color .2s ease",
                }}
            >
                <span
                    aria-hidden
                    className="h-2.5 w-2.5 flex-none rounded-full bg-bigram-accent"
                />
                <h3
                    style={{ fontFamily: "var(--font-source-serif)", fontWeight: 600 }}
                    className="flex-1 text-[19px] text-bigram-ink"
                >
                    {l.title}
                </h3>

                {collapsible && (
                    <span
                        className="flex flex-none items-center gap-2 rounded-[var(--bigram-r-pill)] py-1.5 pl-3.5 pr-1.5"
                        style={{
                            fontFamily: "var(--font-jetbrains-mono)",
                            fontSize: "10.5px",
                            letterSpacing: ".18em",
                            textTransform: "uppercase",
                            color: "var(--bigram-accent-ink)",
                            border: "1px solid color-mix(in oklab, var(--bigram-accent) 32%, var(--bigram-rule))",
                            background: "color-mix(in oklab, var(--bigram-accent) 8%, transparent)",
                        }}
                    >
                        {l.learnMore}
                        <span
                            aria-hidden
                            className="grid h-[18px] w-[18px] place-items-center rounded-full bg-bigram-accent"
                            style={{ color: "var(--bigram-on-accent)" }}
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
                                : { height: { duration: 0.42, ease: EASE }, opacity: { duration: 0.3, ease: EASE } }
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
