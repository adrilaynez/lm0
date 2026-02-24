"use client";

import React from "react";

type HighlightColor = "rose" | "amber" | "indigo" | "emerald";

export function Highlight({
    children,
    color = "rose",
    tooltip,
}: {
    children: React.ReactNode;
    color?: HighlightColor;
    tooltip?: string;
}) {
    const colors: Record<HighlightColor, string> = {
        rose: "text-rose-400",
        amber: "text-amber-400",
        indigo: "text-indigo-400",
        emerald: "text-emerald-400",
    };

    if (!tooltip) {
        return <strong className={`${colors[color]} font-semibold`}>{children}</strong>;
    }

    return (
        <span className="relative inline-flex group align-baseline">
            <strong
                className={`${colors[color]} font-semibold cursor-help underline decoration-white/15 underline-offset-4`}
                tabIndex={0}
            >
                {children}
            </strong>
            <span
                role="tooltip"
                className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 z-30 w-56 rounded-lg border border-white/[0.10] bg-black/90 px-3 py-2 text-[11px] leading-relaxed text-white/70 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
            >
                {tooltip}
            </span>
        </span>
    );
}
