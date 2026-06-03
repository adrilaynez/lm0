"use client";

import { memo, useState } from "react";

import { CaptionLine, CountUpNumber, GhostButton, MONO, PlayButton } from "@/features/lab/components/ngram/kit";

/**
 * §4 · ContextExplosion — the cost (kit + real arithmetic, 27^k).
 *
 * ONE idea: every extra letter of memory multiplies the number of possible rows by 27. The reader adds
 * letters one at a time and watches 27 → 729 → 19 683 → 531 441 → 14 348 907 climb, while a grid of
 * "possible rows" saturates after the second step — we literally run out of screen to draw them. The
 * number is the hero (real, no faking); the grid shows why "just add more memory" hits a wall.
 *
 * Manual advance (Bar-v2 readable pacing). Self-mounting, reduced-motion safe (CountUpNumber settles).
 */

const VOCAB = 27;
const MAX_K = 5;
const CELL_CAP = 729; // 27×27 — the most we can legibly draw; beyond this the grid is saturated
const fmt = (n: number) => Math.round(n).toLocaleString("es-ES");

const NOTE: Record<number, string> = {
    1: "27 filas · justo la tabla del bigrama",
    2: "729 filas · una por cada pareja de letras",
    3: "casi veinte mil · ya no caben en la pantalla",
    4: "medio millón de filas",
    5: "más de catorce millones, y subiendo",
};

export const ContextExplosion = memo(function ContextExplosion({ accent }: { accent?: "ngram" }) {
    void accent;
    const [k, setK] = useState(1);
    const rows = Math.pow(VOCAB, k);
    const cells = Math.min(rows, CELL_CAP);
    const saturated = rows > CELL_CAP;

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, width: "100%" }}>
            {/* hero number */}
            <div style={{ textAlign: "center" }}>
                <CountUpNumber
                    key={k}
                    value={rows}
                    format={fmt}
                    durationMs={520}
                    style={{
                        fontSize: "clamp(40px, 8vw, 84px)",
                        fontWeight: 700,
                        color: "var(--ngram-accent-bright)",
                        lineHeight: 1,
                        display: "block",
                    }}
                />
                <p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--ngram-dim)", marginTop: 10 }}>
                    filas posibles con <b style={{ color: "var(--ngram-accent-ink)" }}>{k}</b> {k === 1 ? "letra" : "letras"} de memoria
                </p>
            </div>

            {/* the grid of possible rows — saturates after k=2 */}
            <div key={k} className="nw-ex__wrap" aria-hidden>
                <div className="nw-ex__grid">
                    {Array.from({ length: cells }, (_, i) => (
                        <span key={i} className="nw-ex__cell" style={{ animationDelay: `${Math.min(i * 0.8, 520)}ms` }} />
                    ))}
                </div>
                {saturated && (
                    <p className="nw-ex__more">esto son solo 729 · faltan {fmt(rows - CELL_CAP)}</p>
                )}
            </div>

            <CaptionLine gap={2}>{NOTE[k]}</CaptionLine>

            {/* manual advance — each press multiplies by 27 */}
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {k < MAX_K ? (
                    <PlayButton onClick={() => setK((v) => Math.min(MAX_K, v + 1))}>añadir una letra · ×27</PlayButton>
                ) : (
                    <span style={{ fontFamily: MONO, fontSize: 12, color: "var(--ngram-muted)", letterSpacing: ".08em" }}>
                        y esto no para nunca
                    </span>
                )}
                {k > 1 && <GhostButton onClick={() => setK(1)}>reiniciar</GhostButton>}
            </div>

            <style>{`
                .nw-ex__wrap { width: 100%; max-width: 420px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
                .nw-ex__grid { display: grid; grid-template-columns: repeat(27, 1fr); gap: 2px; width: 100%; }
                .nw-ex__cell {
                    aspect-ratio: 1; border-radius: 1.5px;
                    background: color-mix(in oklab, var(--ngram-accent) 30%, var(--ngram-bg-2));
                    opacity: 0; animation: nwExPop .28s ease forwards;
                }
                @keyframes nwExPop { to { opacity: 1; } }
                .nw-ex__more { font-family: ${MONO}; font-size: 11px; letter-spacing: .08em; color: var(--ngram-accent-ink); margin: 0; }
                @media (prefers-reduced-motion: reduce) { .nw-ex__cell { animation: none; opacity: 1; } }
            `}</style>
        </div>
    );
});

export default ContextExplosion;
