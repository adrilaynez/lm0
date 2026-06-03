"use client";

import { memo, useMemo, useState } from "react";

import { CaptionLine, displayChar, heat, MONO, Tabs } from "@/features/lab/components/ngram/kit";
import { diagnostics, getCounts, NGRAM_ALPHABET } from "@/features/lab/data/ngramData";

/**
 * §5a · SparsityView — the wall (kit + ngramData, real counts).
 *
 * ONE idea: most contexts the table COULD hold never actually occur. The reader steps the memory from 2 to
 * 5 letters; the same 27×27 grid stays put but the meaning of each cell zooms out ×27 each step, and the
 * lit fraction collapses (36% empty → 99.7% empty). At 2 letters every context fits, so the grid is the
 * REAL heatmap (hover a cell → that context's count, dark q/x/z bands visible). At 3+ letters there are
 * too many even to draw, so each cell stands for a bucket and only the observed fraction lights — honest,
 * the real numbers carry it.
 *
 * Real data via diagnostics()/getCounts(). Interactive (Tabs + hover at k=2). Self-mounting, no animation
 * dependency (CSS transitions settle), reduced-motion safe.
 */

const ALPHA = NGRAM_ALPHABET; // 27
const K_TABS = [2, 3, 4, 5];
const GRID = 729; // 27×27 — the shared field

// a fixed scatter order so the lit cells are spread (deterministic, no Math.random)
const SCATTER: number[] = (() => {
    const a = Array.from({ length: GRID }, (_, i) => i);
    let s = 0x9e3779b9;
    for (let i = a.length - 1; i > 0; i--) {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        const j = s % (i + 1);
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
})();

const fmt = (n: number) => Math.round(n).toLocaleString("es-ES");

export const SparsityView = memo(function SparsityView({ accent }: { accent?: "ngram" }) {
    void accent;
    const [ki, setKi] = useState(0); // index into K_TABS
    const k = K_TABS[ki];
    const [hover, setHover] = useState<number | null>(null);

    const diag = useMemo(() => diagnostics(k), [k]);
    const { contextSpace: space, observedContexts: obs, sparsity } = diag;

    // k=2: the REAL per-context heatmap (729 contexts all fit)
    const real2 = useMemo(() => {
        if (k !== 2) return null;
        const counts = getCounts(2);
        const vals = new Array(GRID).fill(0);
        let max = 1;
        for (let r = 0; r < 27; r++) {
            for (let c = 0; c < 27; c++) {
                const row = counts.get(ALPHA[r] + ALPHA[c]);
                let t = 0;
                if (row) for (const v of row.values()) t += v;
                vals[r * 27 + c] = t;
                if (t > max) max = t;
            }
        }
        return { vals, max };
    }, [k]);

    // k>=3: each grid cell is a bucket; light the observed fraction (scattered)
    const litSet = useMemo(() => {
        if (k === 2) return null;
        const litCount = Math.max(1, Math.round(GRID * (obs / space)));
        return new Set(SCATTER.slice(0, litCount));
    }, [k, obs, space]);

    const perCell = Math.max(1, Math.round(space / GRID));

    const cellColor = (i: number): string => {
        if (k === 2 && real2) return heat(real2.vals[i] / real2.max);
        return litSet!.has(i) ? "var(--ngram-accent)" : "var(--ngram-bg-2)";
    };

    const hoverText = (): string => {
        if (k === 2 && real2 && hover != null) {
            const ctx = ALPHA[Math.floor(hover / 27)] + ALPHA[hover % 27];
            const v = real2.vals[hover];
            return v > 0 ? `«${ctx.split("").map(displayChar).join("")}» · ${fmt(v)} veces` : `«${ctx.split("").map(displayChar).join("")}» · nunca`;
        }
        return `cada celda ≈ ${fmt(perCell)} contextos · la mayoría, vacíos`;
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, width: "100%" }}>
            <Tabs tabs={K_TABS.map((n) => `${n} letras`)} active={ki} onChange={(i) => { setKi(i); setHover(null); }} ariaLabel="Letras de memoria" />

            {/* hero stat */}
            <div style={{ textAlign: "center" }}>
                <span style={{ fontFamily: MONO, fontSize: "clamp(34px, 6vw, 60px)", fontWeight: 700, color: "var(--ngram-accent-bright)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                    {(sparsity * 100).toFixed(1)}%
                </span>
                <p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ngram-dim)", marginTop: 8 }}>
                    de la tabla está vacío · solo <b style={{ color: "var(--ngram-accent-ink)" }}>{fmt(obs)}</b> de {fmt(space)} contextos aparecen
                </p>
            </div>

            {/* the shared 27×27 field */}
            <div className="nw-sp__grid" role="img" aria-label={`${(sparsity * 100).toFixed(1)}% vacío`}>
                {Array.from({ length: GRID }, (_, i) => (
                    <span
                        key={i}
                        className="nw-sp__cell"
                        style={{ background: cellColor(i) }}
                        onMouseEnter={k === 2 ? () => setHover(i) : undefined}
                        onMouseLeave={k === 2 ? () => setHover(null) : undefined}
                    />
                ))}
            </div>

            <CaptionLine gap={0}>{hoverText()}</CaptionLine>

            <style>{`
                .nw-sp__grid { display: grid; grid-template-columns: repeat(27, 1fr); gap: 2px; width: 100%; max-width: 440px; }
                .nw-sp__cell { aspect-ratio: 1; border-radius: 1.5px; transition: background .3s ease, box-shadow .12s ease; }
                .nw-sp__cell:hover { box-shadow: inset 0 0 0 1.5px var(--ngram-accent-ink); }
            `}</style>
        </div>
    );
});

export default SparsityView;
