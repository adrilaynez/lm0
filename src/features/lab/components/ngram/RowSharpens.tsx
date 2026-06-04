"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useReducedMotion } from "framer-motion";

import { MONO } from "@/features/lab/components/ngram/kit";
import { contextRow, displayChar, NGRAM_ALPHABET } from "@/features/lab/data/ngramData";

/**
 * §2 · RowSharpens — THREE histograms side by side, one per memory depth (1, 2, 3 letters),
 * so a stranger sees the full wide→peak collapse in a single glance WITHOUT pressing anything.
 *
 * THE ONE IDEA (what a stranger should deduce just by looking): the LEFT histogram is wide and
 * flat (unsure — the machine barely knows). The RIGHT histogram has one giant spike (sure — the
 * machine knows the answer). Middle is in between. More memory → sharper prediction.
 *
 * Why 3 columns? Because seeing the sequence simultaneously (WIDE | NARROWER | PEAK) requires
 * ZERO interaction to understand — the concept is visible in a still. Pressing a chip just picks
 * a new example; the idea is always on screen.
 *
 * Real counts only: each column is a true context distribution over Shakespeare via contextRow(k, context).
 * Reduced-motion safe: bar heights are CSS height transitions (no rAF needed for the per-column display).
 * The chain-switch morph (prog rAF) provides a smooth swap animation between chains.
 */

const ALPHA = NGRAM_ALPHABET;
const MAX_DEPTH = 3;
const BAR_H = 180; // histogram height in each panel

/**
 * Each chip is a real, monotonically-sharpening CHAIN:
 *   o → to → nto     20% → 74% → 93%   (the most dramatic — default)
 *   t → at → hat     36% → 56% → 87%
 *   n → an → man     25% → 50% → 69%
 *   d → nd → and     59% → 82% → 95%
 *   g → ng → ing     23% → 59% → 69%
 *   h → th → ith     37% → 49% → 79%
 */
const CHAINS: Record<string, string> = {
    o: "nto",
    t: "hat",
    n: "man",
    d: "and",
    g: "ing",
    h: "ith",
};
const CHIPS = ["o", "t", "n", "d", "g", "h"];

function total(c: number[]): number {
    let t = 0;
    for (const x of c) t += x;
    return t;
}
function argmax(c: number[]): number {
    let b = 0;
    for (let i = 1; i < c.length; i++) if (c[i] > c[b]) b = i;
    return b;
}
function shares(c: number[]): number[] {
    const t = total(c) || 1;
    return c.map((x) => x / t);
}
function distinctNonZero(c: number[]): number {
    let n = 0;
    for (const x of c) if (x > 0) n++;
    return n;
}

/** The context string at memory depth d for a chain: the chain's last d characters. */
function ctxAt(chain: string, d: number): string {
    return chain.slice(chain.length - d);
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const MORPH_MS = 480;

/**
 * One histogram column: bars for each alphabet slot, winner highlighted in amber,
 * confidence % headline, context label.
 */
const DepthCol = memo(function DepthCol({
    depth,
    context,
    bars,
    max,
    winner,
    pct,
    spread,
    isDeepest,
    progress = 1,
}: {
    depth: number;
    context: string;
    bars: number[];
    max: number;
    winner: number;
    pct: number;
    spread: number;
    isDeepest: boolean;
    progress?: number;
}) {
    const N = bars.length;
    const m = max || 1;
    const ctxDisplay = context.split("").map(displayChar).join("");

    return (
        <div className="nw-rs__col" data-deepest={isDeepest ? "1" : "0"}>
            {/* column header: depth label + context */}
            <div className="nw-rs__colhead">
                <span className="nw-rs__depthlbl">
                    {depth} {depth === 1 ? "letra" : "letras"}
                </span>
                <span className="nw-rs__ctx">
                    {"«"}
                    {depth === 1
                        ? ctxDisplay
                        : context
                              .split("")
                              .map((c, i) => (
                                  <b key={i} data-last={i === 0 ? "1" : "0"}>
                                      {displayChar(c)}
                                  </b>
                              ))}
                    {"»"}
                </span>
            </div>

            {/* THE histogram — bars */}
            <div
                className="nw-rs__bars"
                style={{ height: `${BAR_H}px`, gridTemplateColumns: `repeat(${N}, 1fr)` }}
                aria-label={`Distribución con ${depth} letra${depth > 1 ? "s" : ""} de contexto`}
            >
                {bars.map((v, i) => {
                    const h = Math.max(0, v / m) * 100;
                    return (
                        <span
                            key={i}
                            className="nw-rs__bar"
                            data-win={i === winner && v > 0 ? "1" : "0"}
                            style={{ height: `${h}%` }}
                        />
                    );
                })}
            </div>

            {/* axis labels — only winner highlighted */}
            <div
                className="nw-rs__axis"
                style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}
                aria-hidden
            >
                {bars.map((_, i) => (
                    <span key={i} className="nw-rs__lbl" data-win={i === winner ? "1" : "0"}>
                        {displayChar(ALPHA[i])}
                    </span>
                ))}
            </div>

            {/* confidence readout — the BIG number */}
            <div className="nw-rs__conf">
                <span
                    className="nw-rs__confpct"
                    style={{ opacity: progress }}
                    aria-label={`Confianza: ${pct.toFixed(0)}%`}
                >
                    {pct.toFixed(0)}
                    <span className="nw-rs__confunit">%</span>
                </span>
                <span className="nw-rs__conflbl">
                    {isDeepest ? "la más segura" : depth === 1 ? `${spread} opciones` : "más segura"}
                </span>
            </div>
        </div>
    );
});

export const RowSharpens = memo(function RowSharpens({ accent }: { accent?: "ngram" }) {
    void accent;
    const reduce = useReducedMotion() === true;

    const [chainKey, setChainKey] = useState("o");
    // cross-chain morph progress (0 = previous chain bars, 1 = new chain bars)
    const [prog, setProg] = useState(1);
    const progRef = useRef(1);
    const rafRef = useRef<number | null>(null);
    const chainRef = useRef(chainKey);

    // Each depth's data: rows 1, 2, 3 for the CURRENT chain
    const chain = CHAINS[chainKey] ?? chainKey;

    const ctxs = useMemo(
        () => Array.from({ length: MAX_DEPTH }, (_, i) => ctxAt(chain, i + 1)),
        [chain],
    );

    const rows = useMemo(
        () => ctxs.map((ctx, i) => contextRow(i + 1, ctx)),
        [ctxs],
    );

    // shared scale: the global max share across all depths → the deepest peak towers on the SAME y-axis
    // as the wide spread, so the collapse in magnitude is honest
    const colData = useMemo(() => {
        const shs = rows.map((r) => shares(r));
        const wins = shs.map((sh) => argmax(sh.map((v, i) => rows[shs.indexOf(sh)][i])));
        // use raw argmax on raw rows
        const rawWins = rows.map((r) => argmax(r));
        const totals = rows.map((r) => total(r));
        const pcts = rows.map((r, i) => (totals[i] ? (r[rawWins[i]] / totals[i]) * 100 : 0));
        const spreads = rows.map((r) => distinctNonZero(r));

        // shared y-scale: same denominator for all columns
        const sharedMax = Math.max(1, ...shs.flatMap((sh) => sh));

        return shs.map((sh, i) => ({
            bars: sh.map((v) => v / sharedMax), // normalised to shared scale
            winner: rawWins[i],
            pct: pcts[i],
            spread: spreads[i],
        }));
    }, [rows]);

    // animate when chain changes
    useEffect(() => {
        if (chainRef.current === chainKey) return;
        chainRef.current = chainKey;
        if (reduce) {
            progRef.current = 1;
            // eslint-disable-next-line react-hooks/set-state-in-effect -- settle to final state on reduced-motion; runs once per chain change
            setProg(1);
            return;
        }
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        progRef.current = 0;
        setProg(0);
        let start: number | null = null;
        const tick = (ts: number) => {
            if (start == null) start = ts;
            const raw = Math.min(1, (ts - start) / MORPH_MS);
            progRef.current = easeInOut(raw);
            setProg(easeInOut(raw));
            if (raw < 1) rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        };
    }, [chainKey, reduce]);

    const pickChain = useCallback((key: string) => {
        setChainKey(key);
    }, []);

    // arrows: visual connectors between columns (→)
    const wideConf = colData[0]?.pct ?? 0;
    const peakConf = colData[2]?.pct ?? 0;

    return (
        <div className="nw-rs" data-ngram-theme>
            {/* ── chip rail: pick the last letter typed ── */}
            <div className="nw-rs__pick">
                <span className="nw-rs__picklbl">la máquina acaba de escribir&hellip;</span>
                <div className="nw-rs__chips" role="tablist" aria-label="Letra recién escrita">
                    {CHIPS.map((ch) => {
                        const on = ch === chainKey;
                        return (
                            <button
                                key={ch}
                                type="button"
                                role="tab"
                                aria-selected={on}
                                className="nw-rs__chip"
                                data-on={on ? "1" : "0"}
                                onClick={() => pickChain(ch)}
                            >
                                {displayChar(ch)}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── headline: WIDE → PEAK ── */}
            <div className="nw-rs__headline" aria-hidden>
                <span className="nw-rs__hl-wide">repartida</span>
                <span className="nw-rs__hl-arrow" aria-hidden>→</span>
                <span className="nw-rs__hl-mid">concentrada</span>
                <span className="nw-rs__hl-arrow" aria-hidden>→</span>
                <span className="nw-rs__hl-peak">un pico</span>
            </div>

            {/* ── THE THREE HISTOGRAMS ── */}
            <div className="nw-rs__stage">
                {colData.map((col, i) => (
                    <DepthCol
                        key={i}
                        depth={i + 1}
                        context={ctxs[i]}
                        bars={col.bars}
                        max={1}
                        winner={col.winner}
                        pct={col.pct}
                        spread={col.spread}
                        isDeepest={i === MAX_DEPTH - 1}
                        progress={prog}
                    />
                ))}
            </div>

            {/* ── insight line ── */}
            <p className="nw-rs__insight">
                con <b>1 letra</b> la apuesta está entre <b className="nw-rs__wide">{colData[0]?.spread ?? "?"} letras posibles</b>
                {" "}(<b className="nw-rs__wide">{wideConf.toFixed(0)}% la más probable</b>);{" "}
                con <b>3 letras</b> casi todo va a <b className="nw-rs__sure">«{displayChar(ALPHA[colData[2]?.winner ?? 0])}» — {peakConf.toFixed(0)}%</b>
            </p>

            <style>{`
                /* ── root ── */
                .nw-rs {
                    width: 100%; max-width: 720px; margin: 0 auto;
                    display: flex; flex-direction: column; align-items: stretch; gap: 18px;
                }

                /* ── chip rail ── */
                .nw-rs__pick { align-self: center; display: inline-flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center; }
                .nw-rs__picklbl {
                    font-family: ${MONO}; font-size: 10px; letter-spacing: .16em; text-transform: uppercase;
                    color: var(--ngram-dim); white-space: nowrap;
                }
                .nw-rs__chips {
                    display: inline-flex; gap: 5px; padding: 5px;
                    border-radius: var(--ngram-r-pill); background: var(--ngram-bg-2);
                    box-shadow: inset 0 0 0 1px var(--ngram-rule);
                }
                .nw-rs__chip {
                    font-family: ${MONO}; font-size: 15px; line-height: 1; font-weight: 700;
                    min-width: 40px; padding: 10px 0; border-radius: var(--ngram-r-pill);
                    border: 1.5px solid var(--ngram-rule-2);
                    background: var(--ngram-elev); color: var(--ngram-ink-2); cursor: pointer;
                    transition: background .16s ease, color .16s ease, transform .12s ease,
                                box-shadow .16s ease, border-color .16s ease;
                }
                .nw-rs__chip:hover[data-on="0"] {
                    color: var(--ngram-accent-ink); border-color: var(--ngram-accent);
                    transform: translateY(-1px);
                }
                .nw-rs__chip:active[data-on="0"] { transform: translateY(0); }
                .nw-rs__chip[data-on="1"] {
                    background: var(--ngram-accent); color: var(--ngram-on-accent);
                    border-color: var(--ngram-accent);
                    box-shadow: 0 2px 12px var(--ngram-accent-soft);
                }

                /* ── headline: WIDE → PEAK label strip ── */
                .nw-rs__headline {
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    font-family: ${MONO}; font-size: 11px; letter-spacing: .12em; text-transform: uppercase;
                }
                .nw-rs__hl-wide { color: var(--ngram-muted); }
                .nw-rs__hl-mid { color: var(--ngram-dim); }
                .nw-rs__hl-peak { color: var(--ngram-accent-ink); font-weight: 700; }
                .nw-rs__hl-arrow { color: var(--ngram-rule-2); font-size: 14px; }

                /* ── three-column stage ── */
                .nw-rs__stage {
                    display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;
                    align-items: stretch;
                }

                /* ── one column ── */
                .nw-rs__col {
                    display: flex; flex-direction: column; gap: 0; padding: 12px 10px 14px;
                    border-radius: var(--ngram-r-md);
                    background: color-mix(in oklab, var(--ngram-accent) 4%, var(--ngram-bg-2));
                    box-shadow: inset 0 0 0 1px var(--ngram-rule);
                    transition: background .35s ease, box-shadow .35s ease;
                }
                .nw-rs__col[data-deepest="1"] {
                    background: color-mix(in oklab, var(--ngram-accent) 10%, var(--ngram-bg-2));
                    box-shadow: inset 0 0 0 1.5px var(--ngram-accent),
                                0 0 20px color-mix(in oklab, var(--ngram-accent) 18%, transparent);
                }

                /* column header */
                .nw-rs__colhead {
                    display: flex; flex-direction: column; align-items: center; gap: 3px;
                    margin-bottom: 10px;
                }
                .nw-rs__depthlbl {
                    font-family: ${MONO}; font-size: 9px; letter-spacing: .18em; text-transform: uppercase;
                    color: var(--ngram-dim);
                }
                .nw-rs__ctx {
                    font-family: ${MONO}; font-size: 17px; font-weight: 700;
                    color: var(--ngram-ink-2); letter-spacing: .02em;
                }
                .nw-rs__ctx b { font-weight: 700; color: var(--ngram-accent-ink); }
                /* the leftmost (newest) char in context glows */
                .nw-rs__ctx b[data-last="1"] {
                    color: var(--ngram-on-accent);
                    background: var(--ngram-accent); border-radius: 4px; padding: 0 3px;
                }

                /* bars */
                .nw-rs__bars {
                    display: grid; gap: 2px; align-items: flex-end; width: 100%;
                    flex-shrink: 0;
                }
                .nw-rs__bar {
                    align-self: flex-end; width: 100%; min-height: 0; border-radius: 2px 2px 0 0;
                    background: color-mix(in oklab, var(--ngram-accent) 35%, transparent);
                    transition: height .35s ease, background .25s ease;
                }
                .nw-rs__bar[data-win="1"] {
                    background: var(--ngram-accent-bright);
                    box-shadow: 0 0 6px var(--ngram-accent-soft);
                }

                /* axis labels (tiny, only winner highlighted) */
                .nw-rs__axis {
                    display: grid; gap: 2px; width: 100%; margin-top: 3px;
                }
                .nw-rs__lbl {
                    font-family: ${MONO}; font-size: 7px; text-align: center;
                    color: var(--ngram-rule-2);
                    overflow: hidden; white-space: nowrap;
                }
                .nw-rs__lbl[data-win="1"] {
                    color: var(--ngram-accent-bright); font-weight: 800; font-size: 8px;
                }

                /* confidence readout */
                .nw-rs__conf {
                    display: flex; flex-direction: column; align-items: center; gap: 2px;
                    margin-top: 10px;
                }
                .nw-rs__confpct {
                    font-family: ${MONO}; font-size: 32px; font-weight: 800; line-height: 1;
                    color: var(--ngram-ink); font-variant-numeric: tabular-nums;
                    transition: opacity .3s ease;
                }
                .nw-rs__col[data-deepest="1"] .nw-rs__confpct {
                    color: var(--ngram-accent-bright);
                }
                .nw-rs__confunit { font-size: 18px; font-weight: 700; }
                .nw-rs__conflbl {
                    font-family: ${MONO}; font-size: 9px; letter-spacing: .12em; text-transform: uppercase;
                    color: var(--ngram-dim);
                }
                .nw-rs__col[data-deepest="1"] .nw-rs__conflbl {
                    color: var(--ngram-accent-ink); font-weight: 700;
                }

                /* ── insight line ── */
                .nw-rs__insight {
                    margin: 0; font-family: ${MONO}; font-size: 13px; line-height: 1.5;
                    color: var(--ngram-body); letter-spacing: .01em; text-align: center;
                }
                .nw-rs__insight b { color: var(--ngram-ink); font-weight: 700; }
                .nw-rs__insight .nw-rs__wide { color: var(--ngram-muted); }
                .nw-rs__insight .nw-rs__sure { color: var(--ngram-accent-ink); font-weight: 700; }

                /* ── responsive ── */
                @media (max-width: 560px) {
                    .nw-rs__stage { gap: 5px; }
                    .nw-rs__col { padding: 8px 6px 10px; }
                    .nw-rs__ctx { font-size: 14px; }
                    .nw-rs__confpct { font-size: 24px; }
                    .nw-rs__confunit { font-size: 14px; }
                    .nw-rs__chip { min-width: 34px; font-size: 13px; }
                    .nw-rs__headline { gap: 6px; font-size: 9px; }
                    .nw-rs__insight { font-size: 11.5px; }
                }
            `}</style>
        </div>
    );
});

export default RowSharpens;
