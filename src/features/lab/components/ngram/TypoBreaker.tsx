"use client";

import { memo, useMemo, useState } from "react";

import { CaptionLine, displayChar, MONO } from "@/features/lab/components/ngram/kit";
import { normalizeNgram, scanContext } from "@/features/lab/data/ngramData";

/**
 * §6b · TypoBreaker — break it yourself (kit + ngramData, real counts).
 *
 * ONE idea: it's not just rare words — your everyday typo breaks it too, and you break it live. Type
 * something; the model looks only at the last few letters and bets on the next one. A real ending → high
 * confidence; a typo'd ending it never saw → nothing, below pure chance. Real probe via scanContext (no
 * backoff: the honest dead-end). The chance line (1/27) is the floor a coin-flip would reach.
 *
 * Quiet, free interaction (typing). Self-mounting, reduced-motion safe (CSS width transition settles).
 */

const CHANCE = 1 / 27; // a blind guess over the 27 symbols
const MEMORY = 4;
const CHIPS = ["queen", "queez", "the king", "xkcd"];

export const TypoBreaker = memo(function TypoBreaker({ accent }: { accent?: "ngram" }) {
    void accent;
    const [raw, setRaw] = useState("queen");

    const norm = useMemo(() => normalizeNgram(raw).trimEnd(), [raw]);
    const ctx = norm.slice(-MEMORY);
    const dist = useMemo(() => (ctx.length > 0 ? scanContext(ctx) : null), [ctx]);
    const best = dist?.followers[0] ?? null;
    const conf = best?.prob ?? 0;

    // axis: top of the meter is a confident bet; chance sits low on it
    const AXIS = 0.6;
    const w = (p: number) => Math.min(100, (p / AXIS) * 100);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18, width: "100%", maxWidth: 520, margin: "0 auto" }}>
            {/* input */}
            <input
                className="nw-tb__in"
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                spellCheck={false}
                aria-label="una palabra"
                placeholder="una palabra…"
            />

            {/* what the model actually looks at */}
            <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ngram-dim)", textAlign: "center" }}>
                solo mira las últimas {MEMORY} letras: <b style={{ color: dist ? "var(--ngram-accent-ink)" : "var(--ngram-wrong)" }}>«{ctx.split("").map(displayChar).join("") || "—"}»</b>
            </div>

            {/* confidence meter with a chance marker */}
            <div className="nw-tb__meter">
                <span className="nw-tb__fill" data-empty={dist ? "0" : "1"} style={{ width: `${w(conf)}%` }} />
                <span className="nw-tb__chance" style={{ left: `${w(CHANCE)}%` }} title="azar" />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 10.5, color: "var(--ngram-dim)", marginTop: -8 }}>
                <span>azar ≈ {(CHANCE * 100).toFixed(0)}%</span>
                <span>seguro</span>
            </div>

            {/* verdict line */}
            <div style={{ textAlign: "center", minHeight: 44 }}>
                {dist && best ? (
                    <p style={{ fontFamily: MONO, fontSize: 15, color: "var(--ngram-ink-2)", margin: 0 }}>
                        apuesta <b style={{ color: "var(--ngram-accent-bright)" }}>{best.ch === " " ? "un espacio" : `«${displayChar(best.ch)}»`}</b> con{" "}
                        <b style={{ color: "var(--ngram-accent-bright)" }}>{(conf * 100).toFixed(0)}%</b>
                        <span style={{ color: "var(--ngram-dim)", fontSize: 12 }}> · visto {dist.total.toLocaleString("es-ES")} veces</span>
                    </p>
                ) : (
                    <p style={{ fontFamily: MONO, fontSize: 15, color: "var(--ngram-wrong)", margin: 0 }}>
                        nada · jamás vio «{ctx.split("").map(displayChar).join("") || "—"}» · ni el azar le sirve
                    </p>
                )}
            </div>

            {/* quick examples */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                {CHIPS.map((c) => (
                    <button key={c} className="nw-tb__chip" data-on={raw === c ? "1" : "0"} onClick={() => setRaw(c)}>
                        {c}
                    </button>
                ))}
            </div>

            <CaptionLine gap={0}>un dedo torpe y la confianza se desploma a cero</CaptionLine>

            <style>{`
                .nw-tb__in {
                    width: 100%; text-align: center; font-family: ${MONO}; font-size: clamp(20px, 3vw, 28px);
                    font-weight: 700; color: var(--ngram-ink); background: var(--ngram-bg-2);
                    border: 1px solid var(--ngram-rule-2); border-radius: var(--ngram-r-md); padding: 14px 16px; outline: none;
                }
                .nw-tb__in:focus { border-color: color-mix(in oklab, var(--ngram-accent) 50%, transparent); }
                .nw-tb__meter { position: relative; height: 16px; border-radius: 8px; overflow: hidden;
                    background: color-mix(in oklab, var(--ngram-ink) 9%, transparent); }
                .nw-tb__fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 8px;
                    background: var(--ngram-accent-bright); transition: width .35s cubic-bezier(.2,.7,.2,1); }
                .nw-tb__fill[data-empty="1"] { background: var(--ngram-wrong); }
                .nw-tb__chance { position: absolute; top: -3px; bottom: -3px; width: 2px; background: var(--ngram-dim); }
                .nw-tb__chip { font-family: ${MONO}; font-size: 12.5px; padding: 6px 13px; border-radius: var(--ngram-r-pill);
                    border: 1px solid var(--ngram-rule-2); background: transparent; color: var(--ngram-muted); cursor: pointer;
                    transition: background .15s, color .15s; }
                .nw-tb__chip[data-on="1"] { background: var(--ngram-accent); color: var(--ngram-on-accent); border-color: transparent; }
            `}</style>
        </div>
    );
});

export default TypoBreaker;
