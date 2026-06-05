"use client";

import type { ComponentType, ReactNode } from "react";
import { Suspense } from "react";

import { KeyTakeaway as _KeyTakeaway } from "@/features/lab/components/KeyTakeaway";
import { LazySection, SectionSkeleton } from "@/features/lab/components/LazySection";
import {
    Callout as _Callout,
    FigureWrapper as _FigureWrapper,
    FormulaBlock as _FormulaBlock,
    Heading as _Heading,
    Highlight as _Highlight,
    type HighlightColor,
    Lead as _Lead,
    P as _P,
    PullQuote as _PullQuote,
    Section as _Section,
    SectionBreak as _SectionBreak,
    SectionLabel as _SectionLabel,
    Subheading as _Subheading,
} from "@/features/lab/components/narrative-primitives";
import { SectionAnchor } from "@/features/lab/components/SectionAnchor";

import { Expandable } from "./Expandable";
import { Plane, Stage } from "./Plane";

type LabAccent = "bigram" | "ngram";

/* ─────────────────────────────────────────────
   labMdxComponents — the bridge from authored .mdx to the editorial chapter look.

   Markdown elements (p, strong, em, h2, blockquote, hr) map onto the existing
   narrative-primitives so prose authored as plain markdown renders identically to
   the old hand-built <P html=…/> chapter — but now legible and editable as one file.

   Structural + interactive components (Section, Plane, Stage, Lead, Subheading,
   Expandable, plus the chapter's widgets) are passed through for use as JSX inside
   the .mdx. The `widgets` arg is where each chapter injects its own lazy() visualizers
   (and pre-binds any live props), so this factory stays chapter-agnostic.
   ───────────────────────────────────────────── */
export function labMdxComponents(
    accent: LabAccent,
    widgets: Record<string, ComponentType<Record<string, unknown>>>,
    labels?: { open?: string; close?: string },
) {
    return {
        /* ── Block prose: markdown → primitives ── */
        // strong/em already carry the accent emphasis via the parent <P> RICH classes,
        // but we also style them directly so emphasis inside Lead/Expandable/blockquote
        // (which don't apply RICH) still reads as the accent.
        p: ({ children }: { children?: ReactNode }) => <_P accent={accent}>{children}</_P>,
        h2: ({ children }: { children?: ReactNode }) => <_Heading accent={accent}>{children}</_Heading>,
        h3: ({ children }: { children?: ReactNode }) => <_Subheading accent={accent}>{children}</_Subheading>,
        hr: () => <_SectionBreak accent={accent} />,
        // NOTE: markdown `>` blockquote is intentionally NOT mapped — markdown wraps its
        // content in a <p>, and PullQuote renders its own <p>, which would nest invalidly.
        // Authors use the explicit <PullQuote>…</PullQuote> component instead (below).
        strong: ({ children }: { children?: ReactNode }) => (
            <strong style={{ color: `var(--${accent}-accent-ink)`, fontWeight: 600 }}>{children}</strong>
        ),
        em: ({ children }: { children?: ReactNode }) => (
            <em style={{ color: `var(--${accent}-accent-ink)`, fontStyle: "italic" }}>{children}</em>
        ),

        /* ── Structural components (used as JSX in the .mdx) ── */
        // <Section id="bigram-01" number="01" label="…" heading="…"> wraps a chapter section
        // with the fade-in, the numbered label, and the copy-link anchor on the heading.
        // The heading goes through a PROP (not literal <h2>) because MDX only routes
        // markdown-generated and Capitalized-component elements through this map — a literal
        // lowercase <h2> written in .mdx would render unstyled.
        Section: ({ id, number, label, heading, children }: { id?: string; number?: string; label?: string; heading?: ReactNode; children?: ReactNode }) => (
            <_Section id={id}>
                {number && label && <_SectionLabel accent={accent} number={number} label={label} />}
                {heading != null && (
                    id ? (
                        <SectionAnchor id={id}><_Heading accent={accent}>{heading}</_Heading></SectionAnchor>
                    ) : (
                        <_Heading accent={accent}>{heading}</_Heading>
                    )
                )}
                {children}
            </_Section>
        ),
        // Explicit thematic break (Capitalized → always routed through this map, unlike a
        // literal <hr/>). For bigram/ngram this is whitespace, no rule line.
        Break: () => <_SectionBreak accent={accent} />,
        Anchor: ({ id, children }: { id: string; children?: ReactNode }) => <SectionAnchor id={id}>{children}</SectionAnchor>,
        Lead: ({ children }: { children?: ReactNode }) => <_Lead accent={accent}>{children}</_Lead>,
        Plane: ({ children }: { children?: ReactNode }) => <Plane accent={accent}>{children}</Plane>,
        Stage: ({ children }: { children?: ReactNode }) => <Stage>{children}</Stage>,
        // Captioned figure (the ngram idiom): a numbered mono label above the faint plane.
        Figure: ({ label, hint = "", children }: { label: string; hint?: string; children?: ReactNode }) => (
            <LazySection>
                <_FigureWrapper accent={accent} label={label} hint={hint}>
                    <Suspense fallback={<SectionSkeleton />}>{children}</Suspense>
                </_FigureWrapper>
            </LazySection>
        ),
        Expandable: ({ title, kicker, defaultOpen, children }: { title: string; kicker?: string; defaultOpen?: boolean; children?: ReactNode }) => (
            <Expandable accent={accent} title={title} kicker={kicker} defaultOpen={defaultOpen} open={labels?.open} close={labels?.close}>
                {children}
            </Expandable>
        ),

        /* ── Explicit editorial components (opt-in, used as JSX in the .mdx) ── */
        PullQuote: ({ children }: { children?: ReactNode }) => <_PullQuote accent={accent}>{children}</_PullQuote>,
        FormulaBlock: ({ formula, caption }: { formula: string; caption: string }) => (
            <_FormulaBlock accent={accent} formula={formula} caption={caption} />
        ),
        KeyTakeaway: ({ children }: { children?: ReactNode }) => <_KeyTakeaway accent={accent}>{children}</_KeyTakeaway>,
        Callout: ({ title, children }: { title?: string; children?: ReactNode }) => (
            <_Callout accent={accent} title={title}>{children}</_Callout>
        ),
        Highlight: ({ tooltip, children }: { tooltip?: string; children?: ReactNode }) => (
            <_Highlight color={accent as HighlightColor} tooltip={tooltip}>{children}</_Highlight>
        ),

        /* ── Chapter widgets (injected per chapter) ── */
        ...widgets,
    };
}
