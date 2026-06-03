"use client";

import { memo, useState } from "react";

import { motion, useReducedMotion } from "framer-motion";

import { CaptionLine, GhostButton, MONO, PlayButton, SERIF } from "@/features/lab/components/ngram/kit";

/**
 * §7 · SimilarityBridge — the bridge to neural nets (kit + a concept, no faked numbers).
 *
 * ONE idea: to the n-gram, "gato" and "perro" are just two unrelated indices — it has no notion that they
 * are alike. The reader flips from the model's view (each word an isolated number, scattered) to what comes
 * next (the same words drifting into clusters of meaning). The IDs are honestly arbitrary — that IS the
 * point; nothing here pretends to be a measured statistic.
 *
 * Quiet. Toggle interaction; framer `layout` animates the reflow. Reduced-motion lands on the final layout.
 */

interface Word {
    text: string;
    cat: number;
    id: number;
}

// two clusters of obviously-similar words; ids are arbitrary (an n-gram only ever has an index)
const WORDS: Word[] = [
    { text: "gato", cat: 0, id: 4127 },
    { text: "lunes", cat: 1, id: 881 },
    { text: "perro", cat: 0, id: 9043 },
    { text: "martes", cat: 1, id: 2560 },
    { text: "ratón", cat: 0, id: 367 },
    { text: "jueves", cat: 1, id: 7714 },
    { text: "caballo", cat: 0, id: 5198 },
    { text: "viernes", cat: 1, id: 1305 },
];

// scattered (model view) keeps categories interleaved; grouped sorts by category
const SCATTERED = WORDS;
const GROUPED = [...WORDS].sort((a, b) => a.cat - b.cat || a.id - b.id);

export const SimilarityBridge = memo(function SimilarityBridge({ accent }: { accent?: "ngram" }) {
    void accent;
    const reduce = useReducedMotion();
    const [grouped, setGrouped] = useState(false);
    const order = grouped ? GROUPED : SCATTERED;

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, width: "100%" }}>
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: grouped ? "10px 30px" : "14px",
                    maxWidth: 620,
                    minHeight: 150,
                    alignItems: "center",
                }}
            >
                {order.map((w, idx) => {
                    // a gap between the two clusters in grouped mode
                    const prev = order[idx - 1];
                    const clusterBreak = grouped && prev && prev.cat !== w.cat;
                    return (
                        <span key={w.text} style={{ display: "contents" }}>
                            {clusterBreak && <span style={{ flexBasis: "100%", height: 0 }} aria-hidden />}
                            <motion.div
                                layout={!reduce}
                                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 24 }}
                                style={{
                                    display: "inline-flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 4,
                                    padding: "12px 18px",
                                    borderRadius: "var(--ngram-r-md)",
                                    background: grouped ? "var(--ngram-accent-soft)" : "var(--ngram-surface)",
                                    border: grouped
                                        ? "1px solid color-mix(in oklab, var(--ngram-accent) 36%, transparent)"
                                        : "1px solid var(--ngram-rule-2)",
                                }}
                            >
                                <span style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 600, color: grouped ? "var(--ngram-accent-ink)" : "var(--ngram-ink-2)" }}>
                                    {w.text}
                                </span>
                                <span style={{ fontFamily: MONO, fontSize: 11, color: "var(--ngram-dim)", opacity: grouped ? 0.35 : 1, transition: "opacity .3s" }}>
                                    #{w.id}
                                </span>
                            </motion.div>
                        </span>
                    );
                })}
            </div>

            <CaptionLine gap={0}>
                {grouped
                    ? "lo que entendería el siguiente modelo: las parecidas, juntas"
                    : "para el n-grama: ocho números sin ninguna relación entre sí"}
            </CaptionLine>

            <div style={{ display: "flex", gap: 12 }}>
                {grouped ? (
                    <GhostButton onClick={() => setGrouped(false)}>volver al n-grama</GhostButton>
                ) : (
                    <PlayButton onClick={() => setGrouped(true)}>¿y si entendiera el parecido?</PlayButton>
                )}
            </div>
        </div>
    );
});

export default SimilarityBridge;
