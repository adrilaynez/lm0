"use client";

import { useEffect, useMemo, useState } from "react";

export type SectionProgressItem = {
    id: string;
    label: string;
    name?: string;
};

export function SectionProgressBar({ sections }: { sections: SectionProgressItem[] }) {
    const [activeIdx, setActiveIdx] = useState(0);

    const ids = useMemo(() => sections.map((s) => s.id), [sections]);

    useEffect(() => {
        const onScroll = () => {
            // Pick the section whose top is closest to the top third of viewport
            const targetY = window.innerHeight * 0.28;
            let bestIdx = 0;
            let bestDist = Number.POSITIVE_INFINITY;

            for (let i = 0; i < ids.length; i++) {
                const el = document.getElementById(ids[i]);
                if (!el) continue;
                const rect = el.getBoundingClientRect();
                const dist = Math.abs(rect.top - targetY);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestIdx = i;
                }
            }
            setActiveIdx(bestIdx);
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, [ids]);

    return (
        <div className="sticky top-4 z-40 flex justify-center mb-6 pointer-events-none">
            <div className="pointer-events-auto rounded-full border border-white/[0.08] bg-black/40 backdrop-blur px-3 py-2">
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
                                            ? "bg-rose-400"
                                            : isDone
                                                ? "bg-white/25"
                                                : "bg-white/10"
                                        }`}
                                />
                                <span
                                    className={`hidden sm:block text-[10px] font-mono uppercase tracking-widest transition-colors ${isActive ? "text-white/55" : "text-white/20 group-hover:text-white/35"
                                        }`}
                                >
                                    {s.label}
                                </span>
                                {/* Hover tooltip with section name */}
                                {s.name && (
                                    <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 border border-white/10 px-2 py-0.5 text-[9px] font-mono text-white/60 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
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
