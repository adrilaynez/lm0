"use client";

import { Suspense } from "react";

import { LazySection, SectionSkeleton } from "@/features/lab/components/LazySection";

type LabAccent = "bigram" | "ngram";

/* The single faint interactive plane — the only "this is interactive" signal.
   No frame, no chrome, no traffic-light dots. Self-captioning widgets render
   their own label inside; the surrounding prose is the editorial caption.
   Accent-dependent values come through CSS vars (var(--<accent>-*)) so the one
   component serves both the bigram (green) and ngram (amber) chapters.
   Ported from the inline `Plane` that used to live in BigramNarrative. */
export function Plane({ accent, children }: { accent: LabAccent; children: React.ReactNode }) {
    return (
        <LazySection>
            <div
                className="my-10 md:my-14 -mx-2 sm:mx-0 px-4 py-7 sm:px-7 sm:py-8"
                style={{
                    borderRadius: `var(--${accent}-r-md)`,
                    background: `color-mix(in oklab, var(--${accent}-surface) 55%, var(--${accent}-bg))`,
                }}
            >
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
