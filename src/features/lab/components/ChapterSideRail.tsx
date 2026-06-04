"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * ChapterSideRail — the standard fixed left-hand chapter timeline (generalized from
 * the bigram v8 rail). This is the STANDARD section-nav for every chapter narrative:
 * a fixed left rail with a continuously-filling accent line, NOT a moving top bar.
 *
 *  • Dot spacing comes from FIXED per-section weights, so progressive/lazy loading of
 *    the page never shifts or bunches the dots.
 *  • The accent line fills CONTINUOUSLY as you scroll — driven on a ref inside a rAF
 *    (no per-frame React re-render), so it stays buttery smooth.
 *  • A ResizeObserver re-syncs the fill once lazy sections mount.
 *
 * Per-chapter color: pass `accent` and the rail resolves `--${accent}-*` tokens inside
 * that chapter's `[data-${accent}-theme]` scope, so no other chapter is affected.
 * Hidden below xl (same as the rest of the chapter chrome).
 */

const RAIL_MIN = 380;
const RAIL_MAX = 600;
const DOT = 13;

interface RailSection {
    id: string;
    label: string;
    /** short kicker, revealed on hover */
    name?: string;
    /** relative section length — controls the gap to the NEXT dot */
    weight?: number;
}

export function ChapterSideRail({
    sections,
    accent = "bigram",
}: {
    sections: RailSection[];
    accent?: string;
}) {
    const a = accent;
    const n = sections.length;
    const sig = sections.map((s) => `${s.id}:${s.weight ?? 1}`).join(",");

    // Fixed, content-independent dot positions (0..1) from the gap weights.
    const norm = useMemo(() => {
        const gaps = sections.slice(0, Math.max(0, n - 1)).map((s) => s.weight ?? 1);
        const total = gaps.reduce((acc, b) => acc + b, 0) || 1;
        const pos = [0];
        let acc = 0;
        for (const g of gaps) {
            acc += g;
            pos.push(acc / total);
        }
        return pos;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sig, n]);

    const [railH, setRailH] = useState(RAIL_MIN);
    const [active, setActive] = useState(0);
    const [hovered, setHovered] = useState<number | null>(null);
    const [visible, setVisible] = useState(false);
    const fillRef = useRef<HTMLSpanElement | null>(null);

    useEffect(() => {
        let raf = 0;
        const update = () => {
            raf = 0;
            const rh = Math.max(RAIL_MIN, Math.min(RAIL_MAX, window.innerHeight * 0.62));
            setRailH((p) => (p !== rh ? rh : p));

            const tops = sections.map((s) => {
                const el = document.getElementById(s.id);
                return el ? el.getBoundingClientRect().top + window.scrollY : Number.POSITIVE_INFINITY;
            });
            const line = window.scrollY + window.innerHeight * 0.42;

            let i = 0;
            for (let k = 0; k < n; k++) if (tops[k] <= line) i = k;

            let p = 0;
            if (i < n - 1 && isFinite(tops[i]) && isFinite(tops[i + 1]) && tops[i + 1] > tops[i]) {
                p = Math.min(1, Math.max(0, (line - tops[i]) / (tops[i + 1] - tops[i])));
            }
            const fillNorm = norm[i] + p * ((norm[i + 1] ?? norm[i]) - norm[i]);
            if (fillRef.current) fillRef.current.style.height = `${fillNorm * rh}px`;

            setActive((prev) => (prev !== i ? i : prev));
            setVisible(window.scrollY > 200);
        };
        const onScroll = () => {
            if (!raf) raf = requestAnimationFrame(update);
        };
        update();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        // Re-sync once lazy sections mount and change the document height.
        const ro = new ResizeObserver(onScroll);
        ro.observe(document.body);
        return () => {
            if (raf) cancelAnimationFrame(raf);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            ro.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sig, n, norm]);

    return (
        <nav
            aria-label="Capítulo"
            className="hidden xl:block fixed left-9 top-1/2 z-40 -translate-y-1/2 transition-opacity duration-500"
            style={{
                opacity: visible ? 1 : 0,
                pointerEvents: visible ? "auto" : "none",
                fontFamily: `var(--${a}-font-mono)`,
                height: railH,
            }}
        >
            <div className="relative" style={{ height: railH }}>
                {/* full track */}
                <span
                    aria-hidden
                    style={{
                        position: "absolute",
                        left: DOT / 2 - 0.5,
                        top: 0,
                        width: 1,
                        height: railH,
                        background: `var(--${a}-rule-2)`,
                    }}
                />
                {/* continuous accent fill (height set imperatively for smoothness) */}
                <span
                    ref={fillRef}
                    aria-hidden
                    style={{
                        position: "absolute",
                        left: DOT / 2 - 1.25,
                        top: 0,
                        width: 2.5,
                        height: 0,
                        borderRadius: 3,
                        background: `linear-gradient(var(--${a}-accent-2), var(--${a}-accent))`,
                    }}
                />
                {/* dots */}
                {sections.map((s, i) => {
                    const isActive = i === active;
                    const isDone = i < active;
                    return (
                        <a
                            key={s.id}
                            href={`#${s.id}`}
                            aria-current={isActive ? "step" : undefined}
                            style={{
                                position: "absolute",
                                top: norm[i] * railH,
                                left: 0,
                                transform: "translateY(-50%)",
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                                textDecoration: "none",
                            }}
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <span
                                style={{
                                    width: DOT,
                                    height: DOT,
                                    borderRadius: "50%",
                                    boxSizing: "border-box",
                                    border: `1.5px solid ${
                                        isDone || isActive ? `var(--${a}-accent)` : `var(--${a}-dim)`
                                    }`,
                                    background: isDone
                                        ? `var(--${a}-accent-2)`
                                        : isActive
                                            ? `var(--${a}-accent)`
                                            : `var(--${a}-bg)`,
                                    boxShadow: isActive ? `0 0 0 4px var(--${a}-accent-soft)` : "none",
                                    transition:
                                        "background .35s ease, border-color .35s ease, box-shadow .35s ease",
                                }}
                            />
                            <span
                                style={{
                                    fontSize: 13,
                                    letterSpacing: ".14em",
                                    color: isActive ? `var(--${a}-accent)` : `var(--${a}-dim)`,
                                    fontWeight: isActive ? 700 : 400,
                                    transition: "color .3s ease",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {s.label}
                                {s.name && (
                                    <span
                                        style={{
                                            marginLeft: 12,
                                            fontSize: 12,
                                            letterSpacing: ".04em",
                                            textTransform: "none",
                                            fontWeight: 400,
                                            color: `var(--${a}-muted)`,
                                            opacity: hovered === i ? 1 : 0,
                                            transition: "opacity .25s ease",
                                        }}
                                    >
                                        {s.name}
                                    </span>
                                )}
                            </span>
                        </a>
                    );
                })}
            </div>
        </nav>
    );
}
