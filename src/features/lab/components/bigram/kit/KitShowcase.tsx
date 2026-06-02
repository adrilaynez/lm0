"use client";

import { memo, useState } from "react";

import { ALPHA_27, MATRIX_27_COUNTS, T_INDEX } from "@/features/lab/data/bigramShakespeare27";

import {
    CaptionLine,
    CountUpNumber,
    displayChar,
    FixedAlphabetRow,
    GhostButton,
    MarkedText,
    type MarkState,
    ParchmentReader,
    PlayButton,
    Readout,
    Tabs,
} from "./index";

/**
 * Dev-only showcase: renders every kit primitive with sample data so the kit can be eyeballed in the
 * bench (`/lab/bench?w=kit-showcase`). Not part of the chapter.
 */
const SAMPLE = "the cat sat on the mat";
const T_ROW = MATRIX_27_COUNTS[T_INDEX];
const SAMPLE_TEXT = "First Citizen: Before we proceed any further, hear me speak. All: Speak, speak.";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 40 }}>
            <p style={{ fontFamily: "var(--bigram-font-mono)", fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--bigram-accent-ink)", margin: "0 0 14px" }}>
                {title}
            </p>
            {children}
        </div>
    );
}

export const KitShowcase = memo(function KitShowcase() {
    const [tab, setTab] = useState(0);
    // mark "the" at the start: t=hot1, h=hot2
    const stateOf = (i: number): MarkState => (i === 0 ? "hot1" : i === 1 ? "hot2" : i < 0 ? "past" : "idle");

    return (
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <Block title="CaptionLine">
                <CaptionLine>Interactivo · la «t» en distintos textos</CaptionLine>
            </Block>

            <Block title="MarkedText (hot1 + hot2, word-grouped)">
                <MarkedText text={SAMPLE} stateOf={stateOf} />
            </Block>

            <Block title="Tabs">
                <div style={{ textAlign: "center" }}>
                    <Tabs tabs={["Texto 1", "Texto 2", "Texto 3"]} active={tab} onChange={setTab} />
                </div>
            </Block>

            <Block title="Readout + CountUpNumber">
                <Readout label="Después de «t»" char="h" value={7071} />
                <div style={{ marginTop: 12, fontFamily: "var(--bigram-font-mono)", color: "var(--bigram-muted)" }}>
                    count-up: <CountUpNumber value={7071} style={{ color: "var(--bigram-accent-bright)", fontSize: 20, fontWeight: 600 }} />
                </div>
            </Block>

            <Block title="FixedAlphabetRow (la fila de la «t», posición fija)">
                <FixedAlphabetRow cols={ALPHA_27} counts={T_ROW} winner={T_ROW.indexOf(Math.max(...T_ROW))} />
            </Block>

            <Block title="ParchmentReader (modo papiro)">
                <ParchmentReader
                    text={SAMPLE_TEXT}
                    windowStart={0}
                    windowSize={SAMPLE_TEXT.length}
                    head={6}
                    hot1={6}
                    hot2={7}
                    progress={0.42}
                    reading
                    markerLabel="Leyendo el libro"
                />
            </Block>

            <Block title="Buttons">
                <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
                    <PlayButton>Leer el libro entero</PlayButton>
                    <GhostButton>↻ Otra vez</GhostButton>
                </div>
            </Block>

            <p style={{ fontFamily: "var(--bigram-font-mono)", fontSize: 11, color: "var(--bigram-dim)", textAlign: "center" }}>
                winner glyph: {displayChar(ALPHA_27[T_ROW.indexOf(Math.max(...T_ROW))])}
            </p>
        </div>
    );
});

export default KitShowcase;
