"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";

import { useReducedMotion } from "framer-motion";

import { MONO, Tabs } from "@/features/lab/components/ngram/kit";
import { generateLocal } from "@/features/lab/data/ngramData";

/**
 * §3 · LookWhatYouBuilt — celebración del capítulo n-gram.
 *
 * ONE idea: varias columnas, una por nivel de memoria, todas escribiendo a la vez.
 * De izquierda (k=1, galimatías) a derecha (k=6, palabras de verdad) ves la
 * progresión de golpe — sin leer una sola línea de texto.
 *
 * Layout: batalla de 5 columnas (k=1,2,3,4,6) sincronizadas, tipando al mismo tiempo.
 * Cada columna se calienta visualmente (fondo, borde, color de texto) según k.
 * El encabezado de cada columna muestra el número de letras de memoria.
 */

const SEEDS = ["the ", "my lord ", "love "];

// Battle columns: k=1 (broken) → k=2,3,4 (middle) → k=6 (clean)
const BATTLE_KS = [1, 2, 3, 4, 6] as const;
type BattleK = (typeof BATTLE_KS)[number];

const BATTLE_LEN = 80;
const TEMP = 0.66;
const TYPE_MS = 2400;
// Each column starts typing with a slight stagger (left columns slightly ahead)
const STAGGER_MS = 60;

/** Deterministic [0, 1) float seeded from integer n. */
function det(n: number): number {
    const s = Math.sin(n * 12.9898 + 1.0) * 43758.5453;
    return s - Math.floor(s);
}
function detSigned(n: number): number {
    return det(n) * 2 - 1;
}

// Returns a q in [0,1] where 0 = most broken (k=1), 1 = most clean (k=6)
function kToQ(k: BattleK): number {
    const idx = BATTLE_KS.indexOf(k);
    return idx / (BATTLE_KS.length - 1);
}

function BattleColumn({
    k,
    seed,
    text,
    elapsed,
    reduce,
    runId,
    seedIdx,
    colIdx,
}: {
    k: BattleK;
    seed: string;
    text: string;
    elapsed: number;
    reduce: boolean | null;
    runId: number;
    seedIdx: number;
    colIdx: number;
}) {
    const q = kToQ(k);
    const isFirst = colIdx === 0;
    const isLast = colIdx === BATTLE_KS.length - 1;

    // Slight stagger: leftmost column gets the most time, builds longest by TYPE_MS
    // Actually all columns start at the same time but the first (k=1) types at a fixed rate
    const delay = 0; // all start together — the chaos is in the text itself
    void delay;

    const p = reduce ? 1 : Math.max(0, Math.min(1, elapsed / TYPE_MS));
    const shown = text.slice(0, Math.floor(p * text.length));
    const typing = p > 0 && p < 1;

    // Chaos parameters for k=1 (garbage visual treatment)
    const jbase = runId * 1009 + seedIdx * 211 + colIdx * 37;
    const chars = Array.from(shown);

    const label = k === 1 ? "1 letra" : k === 6 ? "6 letras" : `${k} letras`;
    const sublabel = "de memoria";

    return (
        <div
            className="nw-lwb__col"
            style={{
                ["--q" as string]: q.toFixed(3),
                ["--col-idx" as string]: colIdx,
            }}
            data-last={isLast || undefined}
            data-first={isFirst || undefined}
        >
            {/* Column header: k number + label */}
            <div className="nw-lwb__col-head">
                <span className="nw-lwb__col-k">{k}</span>
                <div className="nw-lwb__col-klabel">
                    <span className="nw-lwb__col-klabel-main">{label}</span>
                    <span className="nw-lwb__col-klabel-sub">{sublabel}</span>
                </div>
            </div>

            {/* Text body */}
            <div className="nw-lwb__col-body">
                <span className="nw-lwb__col-seed">{seed}</span>
                {isFirst ? (
                    /* k=1: full chaos treatment — vary glyph size/opacity/rotation */
                    chars.map((ch, i) => {
                        const d1 = det(jbase + i * 3 + 1);
                        const d2 = detSigned(jbase + i * 7 + 2);
                        const d3 = detSigned(jbase + i * 5 + 3);
                        const d4 = det(jbase + i * 11 + 4);
                        const sz = 9 + d1 * 7;
                        const op = 0.22 + d4 * 0.55;
                        const rot = d2 * 16;
                        const dy = d3 * 3.5;
                        return (
                            <span
                                key={i}
                                className="nw-lwb__gc"
                                style={{
                                    fontSize: `${sz.toFixed(1)}px`,
                                    opacity: op.toFixed(2),
                                    transform: `translateY(${dy.toFixed(1)}px) rotate(${rot.toFixed(1)}deg)`,
                                    filter: d4 < 0.35 ? `blur(${((0.35 - d4) * 2.5).toFixed(1)}px)` : undefined,
                                }}
                            >
                                {ch}
                            </span>
                        );
                    })
                ) : (
                    /* k=2..6: clean text, progressively warmer color */
                    <span className="nw-lwb__col-text">{shown}</span>
                )}
                {typing && <span className="nw-lwb__caret" aria-hidden>▌</span>}
            </div>

            {/* Footer stamp */}
            <div className="nw-lwb__col-stamp">
                {isFirst ? "galimatías" : isLast ? "palabras de verdad" : null}
            </div>
        </div>
    );
}

export const LookWhatYouBuilt = memo(function LookWhatYouBuilt({ accent }: { accent?: "ngram" }) {
    void accent;
    const reduce = useReducedMotion();

    const [seedIdx, setSeedIdx] = useState(0);
    const [runId, setRunId] = useState(1);
    const [elapsed, setElapsed] = useState(0);
    const rafRef = useRef<number | null>(null);

    const seed = SEEDS[seedIdx];

    // Generate text for all battle columns
    const battleTexts = useMemo(
        () =>
            BATTLE_KS.map((k) =>
                generateLocal(seed, {
                    k,
                    length: BATTLE_LEN,
                    temperature: TEMP,
                    rngSeed: 70001 * runId + seedIdx * 17 + k,
                }),
            ),
        [runId, seedIdx, seed],
    );

    useEffect(() => {
        if (reduce) return;
        let t0: number | null = null;
        const frame = (now: number) => {
            if (t0 === null) t0 = now;
            const e = now - t0;
            setElapsed(e);
            if (e < TYPE_MS) rafRef.current = requestAnimationFrame(frame);
        };
        rafRef.current = requestAnimationFrame(frame);
        return () => {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        };
    }, [runId, reduce]);

    const reroll = () => {
        setElapsed(0);
        setRunId((r) => r + 1);
    };

    const pickSeed = (i: number) => {
        if (i === seedIdx) return;
        setSeedIdx(i);
        setElapsed(0);
        setRunId((r) => r + 1);
    };

    return (
        <div className="nw-lwb">
            {/* Kicker */}
            <div className="nw-lwb__kicker" aria-label="mira lo que escribiste">
                <span className="nw-lwb__kicker-rule" aria-hidden />
                <span className="nw-lwb__kicker-text">mira lo que escribiste</span>
                <span className="nw-lwb__kicker-rule" aria-hidden />
            </div>

            {/* Directional label above the battle */}
            <div className="nw-lwb__axis">
                <span className="nw-lwb__axis-bad">poca memoria → galimatías</span>
                <div className="nw-lwb__axis-arrow" aria-hidden>
                    <svg viewBox="0 0 120 12" width="120" height="12" overflow="visible">
                        <defs>
                            <linearGradient id="nwLwbAxisGrad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="var(--ngram-dim)" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="var(--ngram-accent-bright)" />
                            </linearGradient>
                        </defs>
                        <line x1="0" y1="6" x2="110" y2="6" stroke="url(#nwLwbAxisGrad)" strokeWidth="1.5" />
                        <polyline points="100,2 110,6 100,10" fill="none" stroke="var(--ngram-accent-bright)" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                </div>
                <span className="nw-lwb__axis-good">más memoria → palabras de verdad</span>
            </div>

            {/* THE BATTLE: 5 columns side by side */}
            <div className="nw-lwb__battle" role="img" aria-label="Cinco columnas de texto generado con distintos niveles de memoria">
                {BATTLE_KS.map((k, colIdx) => (
                    <BattleColumn
                        key={k}
                        k={k}
                        seed={seed}
                        text={battleTexts[colIdx]}
                        elapsed={elapsed}
                        reduce={reduce}
                        runId={runId}
                        seedIdx={seedIdx}
                        colIdx={colIdx}
                    />
                ))}
            </div>

            {/* Controls */}
            <div className="nw-lwb__controls">
                <div className="nw-lwb__ctlgroup">
                    <span className="nw-lwb__ctllabel">empieza por</span>
                    <Tabs
                        tabs={SEEDS.map((s) => `«${s.trim()}»`)}
                        active={seedIdx}
                        onChange={pickSeed}
                        ariaLabel="Semilla"
                    />
                </div>
                <button
                    type="button"
                    className="nw-lwb__reroll"
                    onClick={reroll}
                    aria-label="Generar otra muestra"
                    title="Generar otra muestra"
                >
                    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden focusable="false">
                        <path
                            d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <span className="nw-lwb__rerolllabel">generar otra</span>
                </button>
            </div>

            <style>{`
                /* ── root ── */
                .nw-lwb {
                    display: flex; flex-direction: column; align-items: center; gap: 18px;
                    width: 100%; padding: 4px 0 8px;
                }

                /* ── kicker ── */
                .nw-lwb__kicker {
                    display: flex; align-items: center; gap: 14px; width: 100%; max-width: 820px;
                    justify-content: center;
                }
                .nw-lwb__kicker-rule {
                    flex: 1; height: 1px; max-width: 100px;
                    background: linear-gradient(to right, transparent, var(--ngram-accent));
                }
                .nw-lwb__kicker-rule:last-child {
                    background: linear-gradient(to left, transparent, var(--ngram-accent));
                }
                .nw-lwb__kicker-text {
                    font-family: ${MONO}; font-size: 11px; letter-spacing: .3em; text-transform: uppercase;
                    font-weight: 700; color: var(--ngram-accent-bright); white-space: nowrap;
                }

                /* ── axis label bar ── */
                .nw-lwb__axis {
                    display: flex; align-items: center; gap: 12px; width: 100%; max-width: 820px;
                    justify-content: center;
                }
                .nw-lwb__axis-bad, .nw-lwb__axis-good {
                    font-family: ${MONO}; font-size: 9px; font-weight: 700; letter-spacing: .14em;
                    text-transform: uppercase; white-space: nowrap;
                }
                .nw-lwb__axis-bad  { color: var(--ngram-dim); }
                .nw-lwb__axis-good { color: var(--ngram-accent-ink); }
                .nw-lwb__axis-arrow { display: flex; align-items: center; }

                /* ── battle grid ── */
                .nw-lwb__battle {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 0;
                    width: 100%;
                    /* remove outer radius so columns flush together */
                    border-radius: var(--ngram-r-md);
                    overflow: hidden;
                    border: 1px solid var(--ngram-rule);
                }
                @media (max-width: 640px) {
                    .nw-lwb__battle { grid-template-columns: repeat(3, 1fr); }
                }
                @media (max-width: 420px) {
                    .nw-lwb__battle { grid-template-columns: repeat(2, 1fr); }
                }

                /* ── individual column ── */
                .nw-lwb__col {
                    display: flex; flex-direction: column; gap: 10px;
                    padding: 14px 12px 12px;
                    /* background warms from left (cold) to right (amber) */
                    background: color-mix(
                        in oklab,
                        var(--ngram-accent) calc(4% + var(--q) * 16%),
                        var(--ngram-bg-2)
                    );
                    border-right: 1px solid color-mix(
                        in oklab, var(--ngram-accent) calc(10% + var(--q) * 20%), var(--ngram-rule)
                    );
                    position: relative;
                    min-height: 200px;
                }
                .nw-lwb__col:last-child { border-right: none; }

                /* last column (k=6): glowing amber hero */
                .nw-lwb__col[data-last] {
                    background: color-mix(in oklab, var(--ngram-accent) 22%, var(--ngram-surface));
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent) 45%, transparent);
                }

                /* ── column header ── */
                .nw-lwb__col-head {
                    display: flex; align-items: baseline; gap: 5px; flex-shrink: 0;
                }
                .nw-lwb__col-k {
                    font-family: ${MONO}; font-weight: 800; line-height: 1; letter-spacing: -0.02em;
                    /* size and color scale with q */
                    font-size: calc(18px + var(--q) * 14px);
                    color: color-mix(in oklab, var(--ngram-accent-bright) calc(20% + var(--q) * 80%), var(--ngram-muted));
                }
                .nw-lwb__col-klabel {
                    display: flex; flex-direction: column; gap: 0px; line-height: 1.2;
                }
                .nw-lwb__col-klabel-main {
                    font-family: ${MONO}; font-size: 8px; font-weight: 700; letter-spacing: .08em;
                    text-transform: uppercase;
                    color: color-mix(in oklab, var(--ngram-accent-ink) calc(var(--q) * 100%), var(--ngram-muted));
                }
                .nw-lwb__col-klabel-sub {
                    font-family: ${MONO}; font-size: 7.5px; font-weight: 500; letter-spacing: .06em;
                    text-transform: uppercase; color: var(--ngram-dim);
                }

                /* ── column body ── */
                .nw-lwb__col-body {
                    flex: 1;
                    font-family: ${MONO};
                    font-size: 11px;
                    line-height: 1.75;
                    word-break: break-all;
                    overflow: hidden;
                    /* color from cold/dim (q=0) to warm/ink (q=1) */
                    color: color-mix(in oklab, var(--ngram-ink) calc(30% + var(--q) * 70%), var(--ngram-dim));
                }
                .nw-lwb__col-seed {
                    font-weight: 800; font-size: 12px;
                    color: color-mix(in oklab, var(--ngram-accent-bright) calc(var(--q) * 100%), var(--ngram-muted));
                }
                .nw-lwb__col-text {
                    /* inherits body color */
                }

                /* chaos glyphs (k=1 only) */
                .nw-lwb__gc {
                    display: inline-block;
                }

                .nw-lwb__caret {
                    color: var(--ngram-accent-bright);
                    animation: nwLwbCaret 1s steps(1) infinite;
                }
                @keyframes nwLwbCaret { 50% { opacity: 0; } }

                /* ── column footer stamp ── */
                .nw-lwb__col-stamp {
                    min-height: 20px;
                    font-family: ${MONO}; font-size: 8px; font-weight: 800; letter-spacing: .16em;
                    text-transform: uppercase;
                }
                .nw-lwb__col[data-first] .nw-lwb__col-stamp {
                    color: var(--ngram-dim);
                }
                .nw-lwb__col[data-last] .nw-lwb__col-stamp {
                    color: var(--ngram-accent-ink);
                }

                /* ── controls ── */
                .nw-lwb__controls {
                    display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
                    justify-content: center; margin-top: 2px;
                }
                .nw-lwb__ctlgroup { display: inline-flex; align-items: center; gap: 9px; }
                .nw-lwb__ctllabel {
                    font-family: ${MONO}; font-size: 10px; letter-spacing: .16em; text-transform: uppercase;
                    color: var(--ngram-dim);
                }
                .nw-lwb__reroll {
                    display: inline-flex; align-items: center; gap: 7px;
                    font-family: ${MONO}; font-size: 11px; letter-spacing: .1em; text-transform: uppercase;
                    color: var(--ngram-accent-ink); background: var(--ngram-accent-soft);
                    border: 1px solid color-mix(in oklab, var(--ngram-accent) 32%, transparent);
                    border-radius: var(--ngram-r-pill); padding: 8px 16px; cursor: pointer;
                    transition: color .2s ease, border-color .2s ease, background .2s ease;
                }
                .nw-lwb__reroll:hover {
                    color: var(--ngram-on-accent); border-color: transparent; background: var(--ngram-accent);
                }
                .nw-lwb__reroll svg { transition: transform .4s ease; }
                .nw-lwb__reroll:hover svg { transform: rotate(-180deg); }
                .nw-lwb__rerolllabel { display: inline; }
                @media (max-width: 420px) { .nw-lwb__rerolllabel { display: none; } }

                @media (prefers-reduced-motion: reduce) {
                    .nw-lwb__reroll svg { transition: none; }
                    .nw-lwb__caret { animation: none; }
                    .nw-lwb__reroll:hover svg { transform: none; }
                }
            `}</style>
        </div>
    );
});

export default LookWhatYouBuilt;
