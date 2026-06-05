"use client";

import type { ReactNode } from "react";

import { ChillTerminal } from "@/features/lab/components/chill/Terminal";
import { FadeInView } from "@/features/lab/components/FadeInView";
import { Link } from "@/i18n/navigation";

export interface EraChapter {
    num: string;
    title: string;
    desc: string;
    /** undefined ⇒ locked ("Soon") */
    href?: string;
    cta: string;
}

interface EraSectionProps {
    id: string;
    accent?: "default" | "amber" | "blue";
    label: string;
    years: string;
    titlePrefix: string;
    titleAccent: string;
    /** main paragraph (text-color) */
    bodyP1: ReactNode;
    /** secondary paragraph (muted) */
    bodyP2: ReactNode;
    chapters: EraChapter[];
    terminalLabel: string;
    terminalBodyVariant?: "map" | "canvas";
    terminalContent: ReactNode;
    terminalFootLeft?: string;
    terminalFootRight?: string;
}

/**
 * Generic single-viewport "act" layout used by Era I / II / III.
 * Narrative column on the left (label, oversized H2, two paragraphs, chapter links),
 * terminal frame on the right with the era's interactive viz inside.
 */
export function ChillEraSection({
    id,
    accent = "default",
    label,
    years,
    titlePrefix,
    titleAccent,
    bodyP1,
    bodyP2,
    chapters,
    terminalLabel,
    terminalBodyVariant = "map",
    terminalContent,
    terminalFootLeft,
    terminalFootRight,
}: EraSectionProps) {
    return (
        <section className="act act--single" data-accent={accent} id={id}>
            <div className="act-layout">
                <FadeInView className="act-narrative">
                    <span className="act-num">
                        {label}
                        <span className="years">{years}</span>
                    </span>
                    <h2>
                        {titlePrefix} <span className="accent">{titleAccent}</span>
                    </h2>
                    <div className="act-copy">
                        <p>{bodyP1}</p>
                        <p className="muted">{bodyP2}</p>
                    </div>
                    <div className="chapters">
                        {chapters.map((ch) => {
                            if (!ch.href) {
                                return (
                                    <span key={ch.num} className="chapter soon" aria-disabled="true">
                                        <span className="chapter-row">
                                            <span className="chapter-num">{ch.num}</span>
                                            <span className="chapter-title">{ch.title}</span>
                                            <span className="chapter-go">{ch.cta}</span>
                                        </span>
                                        <p className="chapter-desc">{ch.desc}</p>
                                    </span>
                                );
                            }
                            return (
                                <Link key={ch.num} href={ch.href} className="chapter">
                                    <span className="chapter-row">
                                        <span className="chapter-num">{ch.num}</span>
                                        <span className="chapter-title">{ch.title}</span>
                                        <span className="chapter-go">{ch.cta}</span>
                                    </span>
                                    <p className="chapter-desc">{ch.desc}</p>
                                </Link>
                            );
                        })}
                    </div>
                </FadeInView>

                <FadeInView className="act-viz">
                    <ChillTerminal
                        label={terminalLabel}
                        bodyVariant={terminalBodyVariant}
                        footLeft={terminalFootLeft}
                        footRight={terminalFootRight}
                    >
                        {terminalContent}
                    </ChillTerminal>
                </FadeInView>
            </div>
        </section>
    );
}
