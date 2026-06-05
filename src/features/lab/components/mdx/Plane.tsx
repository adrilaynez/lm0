"use client";

import { Suspense } from "react";

import { LazySection, SectionSkeleton } from "@/features/lab/components/LazySection";
import type { NarrativeAccent } from "@/features/lab/components/narrative-primitives";

/* bigram/ngram own CSS-var design tokens (--bigram-* / --ngram-*). The other chapters
   (MLP=violet, NN=rose, Transformer=cyan) use literal Tailwind accents and the shared
   neutral lab surface (--lab-*). isTokenAccent picks which path to render. */
const isTokenAccent = (a: NarrativeAccent): a is "bigram" | "ngram" => a === "bigram" || a === "ngram";

/* The single faint interactive plane — the only "this is interactive" signal.
   No frame, no chrome, no traffic-light dots. Self-captioning widgets render
   their own label inside; the surrounding prose is the editorial caption.
   Ported from the inline `Plane` that used to live in BigramNarrative. */
export function Plane({ accent, children }: { accent: NarrativeAccent; children: React.ReactNode }) {
    const style: React.CSSProperties = isTokenAccent(accent)
        ? {
              borderRadius: `var(--${accent}-r-md)`,
              background: `color-mix(in oklab, var(--${accent}-surface) 55%, var(--${accent}-bg))`,
          }
        : {
              // neutral lab surface for literal-accent chapters (mirrors FigureWrapper's default branch)
              borderRadius: "1rem",
              background: "var(--lab-viz-bg)",
          };
    return (
        <LazySection>
            <div className="my-10 md:my-14 -mx-2 sm:mx-0 px-4 py-7 sm:px-7 sm:py-8" style={style}>
                <Suspense fallback={<SectionSkeleton />}>{children}</Suspense>
            </div>
        </LazySection>
    );
}

/* Stage — a bare lazy mount with no surface, for widgets that carry their own
   full-bleed type (e.g. the keystone FillTheBlank). Same lazy + Suspense contract
   as Plane, just without the faint panel. */
export function Stage({ children }: { children: React.ReactNode }) {
    return (
        <LazySection>
            <div className="my-10 md:my-14">
                <Suspense fallback={<SectionSkeleton />}>{children}</Suspense>
            </div>
        </LazySection>
    );
}
