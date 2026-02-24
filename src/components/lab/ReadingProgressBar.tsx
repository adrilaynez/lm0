"use client";

import { useEffect, useState } from "react";

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
    const [pct, setPct] = useState(0);

    useEffect(() => {
        const onScroll = () => {
            const scrolled = window.scrollY;
            const total = document.documentElement.scrollHeight - window.innerHeight;
            setPct(total > 0 ? (scrolled / total) * 100 : 0);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[60] h-[2px] pointer-events-none"
            aria-hidden
        >
            <div
                className="h-full transition-[width] duration-75 ease-linear"
                style={{
                    width: `${pct}%`,
                    background: ACCENT_COLORS[accent] ?? ACCENT_COLORS.rose,
                }}
            />
        </div>
    );
}
