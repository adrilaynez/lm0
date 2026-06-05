"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useReducedMotion } from "framer-motion";

import { GhostButton, MONO, PlayButton, Tabs } from "@/features/lab/components/ngram/kit";
import { generateLocal } from "@/features/lab/data/ngramData";

/**
 * §6 · Progression (beat `s6-progress`) — a quiet look back, AFTER the wall.
 *
 * THE HERO is the CLIMB as a LITERAL STAIRCASE: four steps (0 = azar puro + 1–3 with growing memory)
 * with dramatically different heights that share one floor. The shape is read before a word.
 *
 * Step 0 = random keyboard mashing (no model — pure noise): shows the FLOOR.
 * Steps 1–3 = bigrama → 2-letra → 4-letra memory: shows the CLIMB.
 *
 * A diagonal ramp line connects card tops via measured refs so coordinates are always pixel-accurate.
 * Re-rolling draws fresh honest samples. A warm italic phrase closes the beat.
 */

const SEEDS = ["the ", "love ", "my lord "];

/** Truly random keyboard-mash: sample from full printable ASCII with no model */
function randomKeyboardMash(length: number, seed: number): string {
    // LCG prng seeded so it's deterministic per runId
    let s = seed | 0;
    const next = () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };
    const chars = "abcdefghijklmnopqrstuvwxyz      ";
    let out = "";
    for (let i = 0; i < length; i++) {
        out += chars[Math.floor(next() * chars.length)];
    }
    return out;
}

/**
 * Four steps: step 0 = sin memoria (azar), steps 1–3 = same machine with more memory.
 * `step` = display label; `mem` = memory stat shown; `cardH` = explicit card height in px.
 * Step 0 uses k=0 as sentinel — rendered specially with randomKeyboardMash.
 */
const STEPS = [
    { k: 0, step: 0, mem: 0, verdict: "sin bigram", cardH: 56 },
    { k: 1, step: 1, mem: 1, verdict: "ruido puro", cardH: 100 },
    { k: 2, step: 2, mem: 2, verdict: "sílabas sueltas", cardH: 172 },
    { k: 4, step: 3, mem: 4, verdict: "palabras de verdad", cardH: 296 },
] as const;

const GEN_LEN = 100;
const TEMP = 0.66;

export const Progression = memo(function Progression({ accent }: { accent?: "ngram" }) {
    void accent;
    const reduce = useReducedMotion();

    const [seedIdx, setSeedIdx] = useState(0);
    const [runId, setRunId] = useState(1);
    const [reveal, setReveal] = useState(reduce ? 1 : 0);
    const rafRef = useRef<number | null>(null);

    // refs for card elements — to measure actual pixel positions for SVG ramp line
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const rampRef = useRef<HTMLDivElement | null>(null);
    const [svgPts, setSvgPts] = useState<{ x: number; y: number }[]>([]);

    const seed = SEEDS[seedIdx];

    const results = useMemo(
        () =>
            STEPS.map((st) => {
                if (st.k === 0) {
                    // pure random — no model
                    return randomKeyboardMash(GEN_LEN, 70000 * runId + seedIdx * 19);
                }
                return generateLocal(seed, {
                    k: st.k,
                    length: GEN_LEN,
                    temperature: TEMP,
                    rngSeed: 70000 * runId + st.k * 137 + seedIdx * 19,
                });
            }),
        [runId, seedIdx, seed],
    );

    useEffect(() => {
        let t0: number | null = null;
        const DUR = 1600;
        const frame = (now: number) => {
            if (reduce) {
                setReveal(1);
                return;
            }
            if (t0 === null) t0 = now;
            const p = Math.min(1, (now - t0) / DUR);
            setReveal(p);
            if (p < 1) rafRef.current = requestAnimationFrame(frame);
        };
        rafRef.current = requestAnimationFrame(frame);
        return () => {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        };
    }, [runId, seedIdx, reduce]);

    // Measure card tops relative to the ramp container for pixel-accurate SVG line
    const measurePts = useCallback(() => {
        const ramp = rampRef.current;
        if (!ramp) return;
        const rampRect = ramp.getBoundingClientRect();
        const pts = cardRefs.current.map((card) => {
            if (!card) return null;
            const r = card.getBoundingClientRect();
            return {
                x: r.left - rampRect.left + r.width / 2,
                y: r.top - rampRect.top,
            };
        });
        if (pts.every(Boolean)) {
            setSvgPts(pts as { x: number; y: number }[]);
        }
    }, []);

    // Re-measure after layout settles (on mount, resize, runId change)
    useEffect(() => {
        // Small delay to let the DOM paint with new heights
        const id = setTimeout(measurePts, 60);
        return () => clearTimeout(id);
    }, [runId, seedIdx, measurePts]);

    useEffect(() => {
        if (typeof ResizeObserver === "undefined") return;
        const ro = new ResizeObserver(measurePts);
        if (rampRef.current) ro.observe(rampRef.current);
        return () => ro.disconnect();
    }, [measurePts]);

    const reroll = () => setRunId((r) => r + 1);
    const pickSeed = (i: number) => setSeedIdx(i);

    // SVG viewport tracks the ramp element's actual size
    const [svgSize, setSvgSize] = useState({ w: 900, h: 500 });
    useEffect(() => {
        const ramp = rampRef.current;
        if (!ramp) return;
        const update = () => {
            setSvgSize({ w: ramp.offsetWidth, h: ramp.offsetHeight });
        };
        update();
        if (typeof ResizeObserver !== "undefined") {
            const ro = new ResizeObserver(update);
            ro.observe(ramp);
            return () => ro.disconnect();
        }
    }, []);

    // dash length for animated draw-on
    const dashLen = 800;

    return (
        <div className="nw-prg">
            {/* slim controls — secondary, never competing with the staircase */}
            <div className="nw-prg__top">
                <span className="nw-prg__cue">empieza con</span>
                <Tabs
                    tabs={SEEDS.map((s) => `«${s.trim()}»`)}
                    active={seedIdx}
                    onChange={pickSeed}
                    ariaLabel="Palabras de arranque"
                />
                <span className="nw-prg__spacer" aria-hidden />
                {runId <= 1 ? (
                    <PlayButton onClick={reroll}>↻ nuevo ejemplo</PlayButton>
                ) : (
                    <GhostButton onClick={reroll}>↻ otro ejemplo</GhostButton>
                )}
            </div>

            {/* THE HERO — the literal staircase, four columns aligned at the bottom */}
            <div
                className="nw-prg__ramp"
                ref={rampRef}
                aria-label="La subida: del caos al lenguaje"
            >
                {/* SVG ramp line — pixel-accurate, measured from actual DOM positions */}
                {svgPts.length === STEPS.length && (
                    <svg
                        className="nw-prg__sweep"
                        viewBox={`0 0 ${svgSize.w} ${svgSize.h}`}
                        aria-hidden
                    >
                        <defs>
                            <linearGradient id="ng-prog-grad" x1="0" y1="1" x2="1" y2="0">
                                <stop offset="0%" stopColor="var(--ngram-dim)" stopOpacity="0.45" />
                                <stop offset="55%" stopColor="var(--ngram-accent)" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="var(--ngram-accent-bright)" stopOpacity="1" />
                            </linearGradient>
                        </defs>
                        {/* the rising ramp — the roofline of the staircase, from the "sin bigram" floor up to
                            "palabras de verdad". Step 0 → 1 is a faint dotted leap ("from nothing"); 1 → 2 → 3 is
                            the solid climb (more memory = higher). */}
                        <polyline
                            points={svgPts.slice(0, 2).map((p) => `${p.x},${p.y}`).join(" ")}
                            fill="none"
                            stroke="var(--ngram-dim)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeDasharray="2 5"
                            opacity={reveal * 0.6}
                        />
                        <polyline
                            points={svgPts.slice(1).map((p) => `${p.x},${p.y}`).join(" ")}
                            fill="none"
                            stroke="url(#ng-prog-grad)"
                            strokeWidth="2.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray={dashLen}
                            strokeDashoffset={(1 - reveal) * dashLen}
                            style={{ transition: reduce ? "none" : "stroke-dashoffset 1.4s cubic-bezier(.2,.8,.2,1)" }}
                        />
                        {/* dots at card tops */}
                        {svgPts.map((p, i) => {
                            const isTop = i === STEPS.length - 1;
                            return (
                                <circle
                                    key={i}
                                    cx={p.x}
                                    cy={p.y}
                                    r={isTop ? 5 : i === 0 ? 3 : 3.5}
                                    fill={
                                        isTop
                                            ? "var(--ngram-accent-bright)"
                                            : i === 0
                                              ? "var(--ngram-dim)"
                                              : "var(--ngram-accent)"
                                    }
                                    stroke="none"
                                    strokeWidth={0}
                                    opacity={reveal}
                                    style={{
                                        transition: reduce
                                            ? "none"
                                            : `opacity .5s ease ${0.3 + i * 0.15}s`,
                                    }}
                                />
                            );
                        })}
                    </svg>
                )}

                {STEPS.map((st, i) => {
                    const isZero = st.k === 0;
                    const isTop = i === STEPS.length - 1;
                    // t for color ramp: step 0 is excluded (dim), steps 1-3 get 0→1
                    const t = isZero ? 0 : (i - 1) / (STEPS.length - 2);
                    const full = results[i];
                    const local = Math.max(0, Math.min(1, reveal * (STEPS.length + 0.5) - i * 0.6));
                    const shown = full.slice(0, Math.max(4, Math.floor(local * full.length)));

                    return (
                        <div
                            key={st.k}
                            className="nw-prg__rung"
                            data-top={isTop ? "1" : "0"}
                            data-zero={isZero ? "1" : "0"}
                            style={{
                                ["--t" as string]: t,
                                ["--rise" as string]: `${(1 - local) * 24}px`,
                                ["--in" as string]: local,
                                ["--cardh" as string]: `${st.cardH}px`,
                            }}
                        >
                            {/* step badge — 0 · 1 · 2 · 3 */}
                            <div
                                className="nw-prg__stepbadge"
                                aria-label={isZero ? "Sin memoria" : `Paso ${st.step}`}
                            >
                                {isZero ? "✕" : st.step}
                            </div>

                            <div className="nw-prg__memhead">
                                {isZero ? (
                                    <span className="nw-prg__memword nw-prg__memword--zero">
                                        sin
                                        <br />
                                        bigram
                                    </span>
                                ) : (
                                    <>
                                        <span className="nw-prg__memnum">{st.mem}</span>
                                        <span className="nw-prg__memword">
                                            {st.mem === 1 ? "letra" : "letras"}
                                            <br />
                                            de memoria
                                        </span>
                                    </>
                                )}
                            </div>

                            <div
                                className="nw-prg__card"
                                data-tier={i}
                                ref={(el) => { cardRefs.current[i] = el; }}
                            >
                                {isTop && <span className="nw-prg__crown" aria-hidden>✓</span>}
                                <p className="nw-prg__text">
                                    {!isZero && <span className="nw-prg__seed">{seed}</span>}
                                    {shown}
                                </p>
                            </div>

                            <div className="nw-prg__verdict">{st.verdict}</div>
                        </div>
                    );
                })}
            </div>

            {/* warm closing phrase */}
            <p className="nw-prg__close">
                La misma máquina. Solo contando. Con más memoria cada paso.
            </p>

            <style>{`
                .nw-prg {
                    display: flex; flex-direction: column; align-items: center; gap: 0; width: 100%;
                    padding-bottom: 4px;
                }

                /* secondary controls row */
                .nw-prg__top {
                    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
                    justify-content: center; margin-bottom: 28px;
                }
                .nw-prg__spacer { flex: 0 0 4px; }
                .nw-prg__cue {
                    font-family: ${MONO}; font-size: 10px; letter-spacing: .14em; text-transform: uppercase;
                    color: var(--ngram-dim);
                }

                /* THE RAMP — hero container. position:relative hosts the SVG overlay. */
                .nw-prg__ramp {
                    position: relative;
                    width: 100%; max-width: 920px;
                    display: grid; grid-template-columns: 0.7fr repeat(3, 1fr); gap: 12px;
                    align-items: end; /* shared floor — height difference IS the staircase */
                    padding: 0 4px;
                }
                @media (max-width: 640px) {
                    .nw-prg__ramp { grid-template-columns: 1fr; align-items: stretch; }
                    .nw-prg__sweep { display: none; }
                }

                /* SVG overlay — pixel-accurate, no stretching */
                .nw-prg__sweep {
                    position: absolute; inset: 0; width: 100%; height: 100%;
                    pointer-events: none; z-index: 0;
                    overflow: visible;
                }

                /* RUNG — staggered reveal animation */
                .nw-prg__rung {
                    position: relative; z-index: 1;
                    display: flex; flex-direction: column; align-items: stretch;
                    transform: translateY(var(--rise));
                    opacity: calc(.3 + .7 * var(--in));
                    transition: transform .65s cubic-bezier(.2,.8,.2,1), opacity .65s ease;
                }
                /* step 0 is dimmer — it's the baseline "nothing" state */
                .nw-prg__rung[data-zero="1"] {
                    opacity: calc(.25 + .5 * var(--in));
                }

                /* step badge */
                .nw-prg__stepbadge {
                    width: 26px; height: 26px; border-radius: 999px;
                    display: grid; place-items: center; margin-bottom: 8px;
                    font-family: ${MONO}; font-size: 11px; font-weight: 700;
                    background: color-mix(in oklab, var(--ngram-accent) calc(8% + 92% * var(--t)), transparent);
                    border: 1.5px solid color-mix(in oklab, var(--ngram-accent) calc(25% + 75% * var(--t)), var(--ngram-rule));
                    color: color-mix(in oklab, var(--ngram-accent-ink) calc(35% + 65% * var(--t)), var(--ngram-dim));
                }
                /* step 0 badge — muted/crossed out */
                .nw-prg__rung[data-zero="1"] .nw-prg__stepbadge {
                    background: transparent;
                    border: 1.5px dashed var(--ngram-rule);
                    color: var(--ngram-dim);
                    font-size: 13px;
                }
                .nw-prg__rung[data-top="1"] .nw-prg__stepbadge {
                    background: var(--ngram-accent);
                    border-color: var(--ngram-accent-bright);
                    color: var(--ngram-on-accent);
                    box-shadow: 0 2px 8px -2px color-mix(in oklab, var(--ngram-accent) 55%, transparent);
                }

                /* memory stat */
                .nw-prg__memhead {
                    display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
                    min-height: 52px;
                }
                .nw-prg__memnum {
                    font-family: var(--ngram-font-display); font-weight: 800; line-height: 1;
                    font-size: calc(24px + 20px * var(--t));
                    color: color-mix(in oklab, var(--ngram-accent-ink) calc(50% + 50% * var(--t)), var(--ngram-dim));
                }
                .nw-prg__rung[data-top="1"] .nw-prg__memnum { color: var(--ngram-accent-bright); }
                .nw-prg__memword {
                    font-family: ${MONO}; font-size: 9px; line-height: 1.35; letter-spacing: .1em;
                    text-transform: uppercase; color: var(--ngram-dim);
                }
                .nw-prg__memword--zero {
                    font-size: 8.5px; letter-spacing: .12em;
                    color: var(--ngram-dim);
                    opacity: 0.7;
                }

                /* CARD — explicit height creates the staircase */
                .nw-prg__card {
                    position: relative;
                    height: var(--cardh);
                    overflow: hidden;
                    display: flex; align-items: flex-start;
                    padding: 10px 12px;
                    border-radius: var(--ngram-r-md);
                    background: color-mix(in oklab, var(--ngram-surface) calc(50% + 50% * var(--t)), var(--ngram-bg));
                    border: 1px solid color-mix(in oklab, var(--ngram-accent) calc(10% + 50% * var(--t)), var(--ngram-rule));
                }
                /* step 0 card — clearly different: dashed border, muted background */
                .nw-prg__rung[data-zero="1"] .nw-prg__card {
                    background: var(--ngram-bg);
                    border: 1.5px dashed var(--ngram-rule);
                    opacity: 0.75;
                }
                .nw-prg__rung[data-top="1"] .nw-prg__card {
                    background: color-mix(in oklab, var(--ngram-accent-soft) 36%, var(--ngram-surface));
                    border-color: color-mix(in oklab, var(--ngram-accent) 55%, transparent);
                    box-shadow:
                        0 0 0 1px color-mix(in oklab, var(--ngram-accent) 28%, transparent),
                        0 28px 54px -20px color-mix(in oklab, var(--ngram-accent) 68%, transparent);
                }
                .nw-prg__crown {
                    position: absolute; top: -12px; right: -10px;
                    width: 26px; height: 26px; border-radius: 999px;
                    display: grid; place-items: center;
                    font-family: ${MONO}; font-size: 13px; font-weight: 700;
                    color: var(--ngram-on-accent); background: var(--ngram-accent);
                    box-shadow: 0 4px 10px -3px color-mix(in oklab, var(--ngram-accent) 70%, transparent);
                }

                /* text */
                .nw-prg__text {
                    font-family: ${MONO}; line-height: 1.72; margin: 0;
                    word-break: break-word; white-space: pre-wrap;
                    font-size: calc(10px + 2px * var(--t));
                    color: color-mix(in oklab, var(--ngram-ink) calc(65% + 35% * var(--t)), var(--ngram-muted));
                    letter-spacing: calc((1 - var(--t)) * .4px);
                }
                .nw-prg__rung[data-zero="1"] .nw-prg__text {
                    font-size: 9.5px;
                    color: var(--ngram-muted);
                    opacity: 0.7;
                    letter-spacing: .04em;
                }
                .nw-prg__rung[data-top="1"] .nw-prg__text { color: var(--ngram-ink); }
                .nw-prg__seed {
                    color: var(--ngram-accent-ink); font-weight: 700; letter-spacing: normal;
                }

                /* verdict */
                .nw-prg__verdict {
                    margin-top: 10px; text-align: center;
                    font-family: var(--ngram-font-serif); font-weight: 700;
                    font-size: calc(11px + 2.5px * var(--t));
                    color: color-mix(in oklab, var(--ngram-accent-ink) calc(38% + 62% * var(--t)), var(--ngram-muted));
                }
                .nw-prg__rung[data-zero="1"] .nw-prg__verdict {
                    font-size: 11px;
                    color: var(--ngram-dim);
                    font-style: italic;
                }
                .nw-prg__rung[data-top="1"] .nw-prg__verdict { color: var(--ngram-accent-bright); }

                /* warm closing phrase */
                .nw-prg__close {
                    margin: 22px 0 0; text-align: center;
                    font-family: var(--ngram-font-serif); font-size: 14px; font-style: italic;
                    color: var(--ngram-muted); max-width: 44ch; line-height: 1.55;
                }

                @media (prefers-reduced-motion: reduce) {
                    .nw-prg__rung { transition: none; }
                }
            `}</style>
        </div>
    );
});

export default Progression;
