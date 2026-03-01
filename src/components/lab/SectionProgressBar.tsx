"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useScrollY } from "@/context/ScrollContext";

export type SectionProgressItem = {
    id: string;
    label: string;
    name?: string;
};

type ProgressAccent = "rose" | "emerald" | "amber" | "violet";

const ACTIVE_DOT: Record<ProgressAccent, string> = {
    rose: "bg-rose-400",
    emerald: "bg-emerald-400",
    amber: "bg-amber-400",
    violet: "bg-violet-400",
};

export function SectionProgressBar({
    sections,
    accent = "rose",
}: {
    sections: SectionProgressItem[];
    accent?: ProgressAccent;
}) {
    const ids = useMemo(() => sections.map((s) => s.id), [sections]);
    const sectionElementsRef = useRef<(HTMLElement | null)[]>([]);
    const rafRef = useRef<number | null>(null);
    const [activeIdx, setActiveIdx] = useState(0);

    const scrollY = useScrollY();

    // Cache section elements when ids change
    useEffect(() => {
        if (typeof window === "undefined") return;
        sectionElementsRef.current = ids.map(id => document.getElementById(id));
    }, [ids]);

    // Update active section with rAF guard
    useEffect(() => {
        if (typeof window === "undefined") return;

        const update = () => {
            const targetY = window.innerHeight * 0.28;
            let bestIdx = 0;
            let bestDist = Number.POSITIVE_INFINITY;

            for (let i = 0; i < sectionElementsRef.current.length; i++) {
                const el = sectionElementsRef.current[i];
                if (!el) continue;
                const rect = el.getBoundingClientRect();
                const dist = Math.abs(rect.top - targetY);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestIdx = i;
                }
            }
            setActiveIdx(bestIdx);
            rafRef.current = null;
        };

        if (rafRef.current === null) {
            rafRef.current = requestAnimationFrame(update);
        }

        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [scrollY]);

    return (
        <div className="sticky top-4 z-40 flex justify-center mb-6 pointer-events-none">
            <div className="pointer-events-auto rounded-full border border-[var(--lab-border)] bg-[var(--lab-header-bg)] backdrop-blur px-3 py-2">
                <div className="flex items-center gap-2">
                    {sections.map((s, i) => {
                        const isActive = i === activeIdx;
                        const isDone = i < activeIdx;
                        return (
                            <button
                                key={s.id}
                                onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                                className="group relative flex items-center gap-2"
                                aria-label={s.name || s.label}
                                title={s.name}
                            >
                                <span
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${isActive
                                        ? ACTIVE_DOT[accent]
                                        : isDone
                                            ? "bg-[var(--lab-text-subtle)]"
                                            : "bg-[var(--lab-border)]"
                                        }`}
                                />
                                <span
                                    className={`hidden sm:block text-[10px] font-mono uppercase tracking-widest transition-colors ${isActive ? "text-[var(--lab-text-muted)]" : "text-[var(--lab-text-subtle)] group-hover:text-[var(--lab-text-muted)]"
                                        }`}
                                >
                                    {s.label}
                                </span>
                                {/* Hover tooltip with section name */}
                                {s.name && (
                                    <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[var(--lab-viz-bg)] border border-[var(--lab-border)] px-2 py-0.5 text-[9px] font-mono text-[var(--lab-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                        {s.name}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
