"use client";

import { memo, useMemo, useState } from "react";

import { HonestBar } from "@/features/lab/components/ngram/HonestBar";
import { CaptionLine, GhostButton, MarkedText, type MarkState, MONO, Tabs } from "@/features/lab/components/ngram/kit";
import { contextDistribution, displayChar } from "@/features/lab/data/ngramData";

/**
 * §1 · ContextWindow — the predict-with-growing-memory game (kit + ngramData, real counts).
 *
 * ONE idea: with one letter of memory the bet is almost a coin-flip; with three or four it becomes nearly
 * certain. The reader watches the same prediction point and slides the memory from 1 → 4 letters; the
 * model's honest bars go from flat-and-spread to one tall bar. Genuinely HARD at k=1 by construction
 * (Bar-v2 gate): the example is chosen so a single letter can't call it.
 *
 * Assembled from: Tabs (memory selector), MarkedText (the context window highlighted in the real phrase),
 * HonestBar (the honest fixed-axis bets), GhostButton (reveal). No faked numbers — every probability comes
 * from contextDistribution() over the Shakespeare corpus. Minimal in-widget text; the framing lives in the
 * narrative body. Self-mounting, reduced-motion safe (HonestBar handles it).
 */

/** Curated phrases, already folded to the 27-symbol domain (lowercase + spaces) like the model sees them.
 * `before` is the visible run; `actual` is the real next letter. The model looks at the last k chars of
 * `before`. All three were verified against ngramData: at k=1 the actual letter is buried (≈1-2%), and by
 * k=4 it is the model's top bet (≈100%), climbing gradually in between — the whole point of the chapter. */
interface Example {
    before: string;
    actual: string;
}

const EXAMPLES: Example[] = [
    { before: "the altitude of his virt", actual: "u" }, // virtue — t/rt/irt/virt → 2/8/69/100
    { before: "transported by calamit", actual: "y" },   // calamity — t/it/mit/amit → 1/7/38/100
    { before: "since it serves my purpo", actual: "s" }, // purpose — o/po/rpo/urpo → 2/17/83/100
];

const MEMORY_TABS = ["1 letra", "2 letras", "3 letras", "4 letras"];

export const ContextWindow = memo(function ContextWindow({ accent }: { accent?: "ngram" }) {
    void accent;
    const [exIdx, setExIdx] = useState(0);
    const [k, setK] = useState(0); // tab index 0..3 → memory 1..4
    const [revealed, setRevealed] = useState(false);

    const ex = EXAMPLES[exIdx];
    const memory = k + 1;
    const shown = ex.before;
    const context = shown.slice(Math.max(0, shown.length - memory));
    const actual = ex.actual;

    const dist = useMemo(() => contextDistribution(memory, context), [memory, context]);
    const top = useMemo(() => (dist ? dist.followers.slice(0, 5) : []), [dist]);
    const topProb = top[0]?.prob ?? 0;
    const actualRank = top.findIndex((f) => f.ch === actual);

    // light up the last `memory` chars of the phrase as the context window
    const stateOf = (i: number): MarkState => {
        if (i >= shown.length - memory) return i === shown.length - 1 ? "hot1" : "hot2";
        return "past";
    };

    const nextExample = () => {
        setExIdx((p) => (p + 1) % EXAMPLES.length);
        setRevealed(false);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, width: "100%" }}>
            {/* memory selector */}
            <Tabs tabs={MEMORY_TABS} active={k} onChange={(i) => { setK(i); }} ariaLabel="Letras de memoria" />

            {/* the phrase with the memory window lit + a cursor where the next letter goes */}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", flexWrap: "wrap", gap: 4 }}>
                <MarkedText text={shown} stateOf={stateOf} size="clamp(18px, 2.4vw, 26px)" maxWidth={620} />
                <span
                    aria-hidden
                    style={{
                        fontFamily: MONO,
                        fontSize: "clamp(18px, 2.4vw, 26px)",
                        fontWeight: 700,
                        color: revealed ? "var(--ngram-accent-bright)" : "var(--ngram-dim)",
                        marginLeft: 2,
                    }}
                >
                    {revealed ? displayChar(actual) : "?"}
                </span>
            </div>

            {/* the model's honest bets, conditioned on exactly `memory` letters */}
            <div style={{ width: "100%", maxWidth: 520 }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        fontFamily: MONO,
                        fontSize: 11,
                        letterSpacing: ".14em",
                        textTransform: "uppercase",
                        color: "var(--ngram-dim)",
                        marginBottom: 4,
                    }}
                >
                    <span>
                        después de «{context.split("").map(displayChar).join("")}»
                    </span>
                    <span style={{ color: "var(--ngram-accent-ink)" }}>
                        {(topProb * 100).toFixed(0)}% de confianza
                    </span>
                </div>

                {top.map((f, i) => (
                    <HonestBar
                        key={f.ch}
                        src={context.slice(-1) || " "}
                        dst={f.ch}
                        value={f.prob}
                        top={revealed ? f.ch === actual : i === 0}
                        countUp={false}
                        glint={false}
                    />
                ))}
                {top.length === 0 && (
                    <p style={{ fontFamily: MONO, fontSize: 13, color: "var(--ngram-muted)", textAlign: "center" }}>
                        sin datos para este contexto
                    </p>
                )}
            </div>

            {/* reveal the real next letter (marks which bet was right) */}
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <GhostButton onClick={() => setRevealed((r) => !r)}>
                    {revealed ? "ocultar" : "ver la real"}
                </GhostButton>
                <GhostButton onClick={nextExample}>otra palabra</GhostButton>
            </div>

            {revealed && (
                <CaptionLine gap={0}>
                    {actualRank === 0
                        ? `la real era «${displayChar(actual)}» · el modelo la clavó`
                        : actualRank > 0
                          ? `la real era «${displayChar(actual)}» · la apuesta nº${actualRank + 1} del modelo`
                          : `la real era «${displayChar(actual)}» · no estaba ni entre las 5 apuestas`}
                </CaptionLine>
            )}
        </div>
    );
});

export default ContextWindow;
