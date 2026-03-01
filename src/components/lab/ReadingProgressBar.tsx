"use client";

import { useRef } from "react";

import { useScrollDomEffect } from "@/context/ScrollContext";

const ACCENT_COLORS: Record<string, string> = {
    rose: "#fb7185",
    emerald: "#34d399",
    amber: "#fbbf24",
    violet: "#a78bfa",
};

interface ReadingProgressBarProps {
    accent?: "rose" | "emerald" | "amber" | "violet";
}

export function ReadingProgressBar({ accent = "rose" }: ReadingProgressBarProps) {
    const barRef = useRef<HTMLDivElement>(null);

    // Update width via direct DOM mutation — zero React re-renders
    useScrollDomEffect(({ scrollPct }) => {
        if (barRef.current) {
            barRef.current.style.width = `${scrollPct}%`;
        }
    });

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[60] h-[2px] pointer-events-none"
            aria-hidden
        >
            <div
                ref={barRef}
                className="h-full transition-[width] duration-75 ease-linear"
                style={{
                    width: "0%",
                    background: ACCENT_COLORS[accent] ?? ACCENT_COLORS.rose,
                }}
            />
        </div>
    );
}
