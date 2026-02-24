"use client";

import React, { useState, useCallback } from "react";

const COLORS = ["#34d399", "#f59e0b", "#f472b6", "#818cf8", "#22d3ee"];

interface Dot {
    id: number;
    x: number;
    y: number;
    color: string;
    angle: number;
    distance: number;
}

let idCounter = 0;

/**
 * Hook that returns a `celebrate` trigger function and the dots overlay.
 * Call `celebrate(rect)` with a DOMRect to burst dots from that position.
 */
export function useMicroCelebration() {
    const [dots, setDots] = useState<Dot[]>([]);

    const celebrate = useCallback((rect: DOMRect) => {
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const newDots: Dot[] = Array.from({ length: 5 }, (_, i) => ({
            id: ++idCounter,
            x: cx,
            y: cy,
            color: COLORS[i % COLORS.length],
            angle: (i * 72) + (Math.random() * 30 - 15),
            distance: 30 + Math.random() * 25,
        }));
        setDots((prev) => [...prev, ...newDots]);
        setTimeout(() => {
            setDots((prev) => prev.filter((d) => !newDots.includes(d)));
        }, 700);
    }, []);

    const CelebrationDots = useCallback(() => (
        <>
            {dots.map((d) => {
                const rad = (d.angle * Math.PI) / 180;
                const tx = Math.cos(rad) * d.distance;
                const ty = Math.sin(rad) * d.distance;
                return (
                    <span
                        key={d.id}
                        className="fixed pointer-events-none z-[100] w-2 h-2 rounded-full"
                        style={{
                            left: d.x,
                            top: d.y,
                            backgroundColor: d.color,
                            animation: "micro-celebrate 600ms ease-out forwards",
                            // Pass offset via CSS custom props
                            ["--tx" as string]: `${tx}px`,
                            ["--ty" as string]: `${ty}px`,
                        }}
                    />
                );
            })}
            <style>{`
                @keyframes micro-celebrate {
                    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); opacity: 0; }
                }
            `}</style>
        </>
    ), [dots]);

    return { celebrate, CelebrationDots };
}
