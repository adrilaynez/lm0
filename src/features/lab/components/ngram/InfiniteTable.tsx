"use client";

import { memo, useMemo, useState } from "react";

import { CaptionLine, MONO } from "@/features/lab/components/ngram/kit";

/**
 * §5b · InfiniteTable — more data won't save you (kit + an honest, labelled model).
 *
 * ONE idea: the sparsity is not a data problem. Slide the training size from a thousand letters to a
 * trillion; the low-memory tables fill, but the high-memory ones stay almost empty no matter how far you
 * push it. Each row is the % of that table's rows that ever get a value.
 *
 * The fill model is an approximation (a thought experiment, labelled as such): fill = ceiling·(1 − e^(−N/τ)).
 * It is calibrated so that at this book's real size (~300 000 letters) every row matches the REAL observed
 * fraction from ngramData (k2 64%, k3 19.6%, k4 2.9%, k5 0.3%), and it asymptotes to a low ceiling for high
 * k — because most long contexts are not rare, they are impossible, so no amount of data ever fills them.
 *
 * Quiet, direct manipulation (a slider). Self-mounting, reduced-motion safe (CSS width transition settles).
 */

const STEPS = [
    { label: "mil", tokens: 1e3 },
    { label: "10 mil", tokens: 1e4 },
    { label: "100 mil", tokens: 1e5 },
    { label: "1 millón", tokens: 1e6 },
    { label: "10 millones", tokens: 1e7 },
    { label: "100 millones", tokens: 1e8 },
    { label: "mil millones", tokens: 1e9 },
    { label: "un billón", tokens: 1e12 },
];

// per memory level: rows in the table (27^k), the asymptotic fillable ceiling, and τ calibrated so the
// curve passes through the REAL observed fraction at N≈300 000 (this book).
const LEVELS = [
    { k: 1, rows: 27, ceiling: 1.0, tau: 80 },
    { k: 2, rows: 729, ceiling: 0.78, tau: 175_000 },
    { k: 3, rows: 19_683, ceiling: 0.32, tau: 320_000 },
    { k: 4, rows: 531_441, ceiling: 0.09, tau: 760_000 },
    { k: 5, rows: 14_348_907, ceiling: 0.02, tau: 1_850_000 },
];

const fmtRows = (n: number) => n.toLocaleString("es-ES");
function fmtPct(p: number): string {
    if (p >= 99.9) return "~100%";
    if (p >= 1) return `${p.toFixed(0)}%`;
    if (p >= 0.1) return `${p.toFixed(1)}%`;
    if (p > 0) return "<0,1%";
    return "0%";
}

export const InfiniteTable = memo(function InfiniteTable({ accent }: { accent?: "ngram" }) {
    void accent;
    const [idx, setIdx] = useState(3); // default 1 millón
    const tokens = STEPS[idx].tokens;

    const fills = useMemo(
        () => LEVELS.map((lv) => ({ ...lv, pct: lv.ceiling * (1 - Math.exp(-tokens / lv.tau)) * 100 })),
        [tokens],
    );
    const hiPct = fills[4].pct; // 5 letras

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 22, width: "100%", maxWidth: 560, margin: "0 auto" }}>
            {/* slider */}
            <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ngram-dim)" }}>
                        letras de entrenamiento
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: "var(--ngram-accent-ink)" }}>
                        {STEPS[idx].label}
                    </span>
                </div>
                <input
                    className="nw-it__range"
                    type="range"
                    min={0}
                    max={STEPS.length - 1}
                    step={1}
                    value={idx}
                    onChange={(e) => setIdx(Number(e.target.value))}
                    aria-label="Cantidad de datos de entrenamiento"
                />
            </div>

            {/* fill bars per memory level */}
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {fills.map((f) => (
                    <div key={f.k}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4, fontFamily: MONO }}>
                            <span style={{ fontSize: 12.5, color: "var(--ngram-ink-2)" }}>
                                {f.k} {f.k === 1 ? "letra" : "letras"} <span style={{ color: "var(--ngram-dim)", fontSize: 10.5 }}>· {fmtRows(f.rows)} filas</span>
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ngram-accent-bright)", fontVariantNumeric: "tabular-nums" }}>
                                {fmtPct(f.pct)}
                            </span>
                        </div>
                        <div className="nw-it__track">
                            <span className="nw-it__fill" style={{ width: `${Math.max(f.pct, 0.4)}%` }} />
                        </div>
                    </div>
                ))}
            </div>

            <CaptionLine gap={0}>
                {hiPct < 1
                    ? "con 5 letras la tabla sigue casi vacía, da igual cuántos datos eches"
                    : `y con 5 letras, apenas ${fmtPct(hiPct)} · el techo no se mueve`}
            </CaptionLine>

            <style>{`
                .nw-it__track { height: 11px; border-radius: 6px; overflow: hidden; background: color-mix(in oklab, var(--ngram-ink) 9%, transparent); }
                .nw-it__fill { display: block; height: 100%; border-radius: 6px; background: var(--ngram-accent-2); transition: width .45s cubic-bezier(.2,.7,.2,1); }
                .nw-it__range { width: 100%; height: 6px; border-radius: 999px; appearance: none; cursor: pointer;
                    background: color-mix(in oklab, var(--ngram-ink) 10%, transparent); accent-color: var(--ngram-accent); }
                .nw-it__range::-webkit-slider-thumb { appearance: none; width: 20px; height: 20px; border-radius: 999px;
                    background: var(--ngram-accent); border: 2px solid var(--ngram-accent-bright); cursor: pointer; }
                .nw-it__range::-moz-range-thumb { width: 18px; height: 18px; border-radius: 999px;
                    background: var(--ngram-accent); border: 2px solid var(--ngram-accent-bright); cursor: pointer; }
            `}</style>
        </div>
    );
});

export default InfiniteTable;
