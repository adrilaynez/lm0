"use client";

import { memo, useMemo, useState } from "react";

import { CaptionLine, FixedAlphabetRow, MONO } from "@/features/lab/components/ngram/kit";
import { contextRow, displayChar, NGRAM_ALPHABET } from "@/features/lab/data/ngramData";

/**
 * §2 · ContextCounter — same trick (counting), a longer key (kit + ngramData, real counts).
 *
 * ONE idea: a longer context sharpens the distribution. The top row is the bigram "t" row the reader
 * already met (what follows the single letter t) — wide, the bet spread across many slots. Hovering a
 * follower drills into the 2-letter "t·X" row below, which collapses onto one slot. Same 27-slot row
 * object as bigram (continuity); the contrast in shape (and in the winner's %) is the whole lesson.
 *
 * Assembled from FixedAlphabetRow (the stored row, hoverable) + the heat ramp. Real counts via contextRow
 * (k=1 vs k=2) over Shakespeare. Interactive (GitHub-heatmap level: hover the top row → the deeper row +
 * its count). NOTE (reported, not a silent cut): the spine pencilled a ParchmentReader live-scan here; I
 * built the interactive level-contrast instead, because re-scanning the book would duplicate bigram's
 * RowTally, whereas the hover-drill teaches the NEW idea (longer key = sharper) by direct manipulation.
 */

const ALPHA = NGRAM_ALPHABET;
const BASE = "t"; // the chapter's protagonist letter, carried over from bigram

function argmax(counts: number[]): number {
    let b = 0;
    for (let i = 1; i < counts.length; i++) if (counts[i] > counts[b]) b = i;
    return b;
}
function total(counts: number[]): number {
    return counts.reduce((a, b) => a + b, 0);
}

function WinLine({ ctx, ch, pct, note }: { ctx: string; ch: string; pct: number; note: string }) {
    return (
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, fontFamily: MONO, justifyContent: "center", marginTop: 6 }}>
            <span style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ngram-dim)" }}>
                después de «{ctx.split("").map(displayChar).join("")}»
            </span>
            <span style={{ fontSize: 15, color: "var(--ngram-ink-2)" }}>
                gana <b style={{ color: "var(--ngram-accent-bright)" }}>{displayChar(ch)}</b>
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ngram-accent-bright)", fontVariantNumeric: "tabular-nums" }}>
                {pct.toFixed(0)}%
            </span>
            <span style={{ fontSize: 12.5, color: "var(--ngram-muted)" }}>{note}</span>
        </div>
    );
}

export const ContextCounter = memo(function ContextCounter({ accent }: { accent?: "ngram" }) {
    void accent;
    const row1 = useMemo(() => contextRow(1, BASE), []);
    const win1 = argmax(row1);
    const t1 = total(row1);

    const [sel, setSel] = useState(ALPHA.indexOf("h")); // chosen follower of t → the 2-letter context
    const ctx2 = BASE + ALPHA[sel];
    const row2 = useMemo(() => contextRow(2, ctx2), [ctx2]);
    const t2 = total(row2);
    const win2 = argmax(row2);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 30, width: "100%", maxWidth: 680, margin: "0 auto" }}>
            {/* top: the bigram t-row — wide, the bet spread out */}
            <div>
                <CaptionLine align="left" gap={10}>una letra de memoria · lo que sigue a «t»</CaptionLine>
                <FixedAlphabetRow
                    cols={ALPHA}
                    counts={row1}
                    winner={win1}
                    hoverIdx={sel}
                    onHover={(i) => { if (i != null && row1[i] > 0) setSel(i); }}
                    height={120}
                />
                <WinLine ctx={BASE} ch={ALPHA[win1]} pct={(row1[win1] / (t1 || 1)) * 100} note="repartido entre muchas" />
            </div>

            {/* bottom: the 2-letter context — collapses onto one slot */}
            <div>
                <CaptionLine align="left" gap={10}>dos letras de memoria · lo que sigue a «{ctx2.split("").map(displayChar).join("")}»</CaptionLine>
                {t2 > 0 ? (
                    <>
                        <FixedAlphabetRow cols={ALPHA} counts={row2} winner={win2} height={120} />
                        <WinLine ctx={ctx2} ch={ALPHA[win2]} pct={(row2[win2] / (t2 || 1)) * 100} note="casi sin dudas" />
                    </>
                ) : (
                    <p style={{ fontFamily: MONO, fontSize: 14, color: "var(--ngram-muted)", textAlign: "center", padding: "40px 0" }}>
                        «{ctx2.split("").map(displayChar).join("")}» no aparece nunca en el libro
                    </p>
                )}
            </div>
        </div>
    );
});

export default ContextCounter;
