"use client";

import { memo, useEffect, useId, useRef, useState } from "react";

import { motion, useReducedMotion } from "framer-motion";

import {
    CaptionLine,
    GhostButton,
    MONO,
    PlayButton,
    SERIF,
    STD,
} from "@/features/lab/components/ngram/kit";
import { generateLocal } from "@/features/lab/data/ngramData";

/**
 * s6-limit · BigModelLimit — the bridge to neural networks (rework of v1 SimilarityBridge).
 *
 * HERO: gato and perro as two unrelated symbols on a meaningless line (always visible from load).
 * The machine paragraph is secondary evidence — it slides in below to support "it writes well, yet…".
 *
 * Layout (top→bottom):
 *   1. [HERO] gato/perro line diagram — always visible, the whole point
 *   2. [TOGGLE] ¿y si entendiera? — drifts the chips close (the door, not crossing it)
 *   3. [FLOW] "pero" connector
 *   4. [EVIDENCE] machine-written paragraph (optional reveal via button)
 */

const WORD_A = "gato";
const WORD_B = "perro";
/** Far-apart arbitrary positions when model has no notion of likeness. */
const POS_A = 18;
const POS_B = 82;
/** Close positions when "understanding" is imagined. */
const NEAR_A = 42;
const NEAR_B = 58;

function writtenParagraph(): string {
    const raw = generateLocal("the ", { k: 4, length: 150, temperature: 0.72, rngSeed: 6 });
    const t = raw.trim();
    return t.charAt(0).toUpperCase() + t.slice(1) + ".";
}

/** One word chip on the number line. */
function LinedWord({
    word,
    left,
    below,
    reduce,
    highlighted,
}: {
    word: string;
    left: number;
    below: boolean;
    reduce: boolean;
    highlighted?: boolean;
}) {
    const stemH = 48;
    return (
        <motion.div
            layout={!reduce}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 24 }}
            style={{ position: "absolute", left: `${left}%`, top: "50%", zIndex: 2 }}
        >
            {/* tick dot on the axis */}
            <span
                aria-hidden
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    transform: "translate(-50%, -50%)",
                    width: 10,
                    height: 10,
                    borderRadius: "999px",
                    background: highlighted ? "var(--ngram-accent-bright)" : "var(--ngram-accent)",
                    boxShadow: highlighted ? "0 0 0 3px color-mix(in oklab, var(--ngram-accent-bright) 28%, transparent)" : "none",
                    transition: "background 0.3s, box-shadow 0.3s",
                }}
            />
            {/* connector stem */}
            <span
                aria-hidden
                style={{
                    position: "absolute",
                    left: 0,
                    top: below ? 0 : -stemH,
                    width: 1.5,
                    height: stemH,
                    background: "color-mix(in oklab, var(--ngram-accent) 40%, transparent)",
                }}
            />
            {/* the word chip */}
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    top: below ? stemH : -stemH,
                    transform: `translate(-50%, ${below ? "0" : "-100%"})`,
                }}
            >
                <span
                    style={{
                        display: "inline-block",
                        padding: "10px 18px",
                        borderRadius: "var(--ngram-r-md)",
                        background: highlighted
                            ? "color-mix(in oklab, var(--ngram-accent) 18%, var(--ngram-surface))"
                            : "color-mix(in oklab, var(--ngram-surface) 55%, var(--ngram-elev))",
                        boxShadow: `inset 0 0 0 1.5px ${highlighted
                            ? "color-mix(in oklab, var(--ngram-accent-bright) 65%, transparent)"
                            : "color-mix(in oklab, var(--ngram-accent) 45%, transparent)"}`,
                        fontFamily: SERIF,
                        fontSize: 21,
                        fontWeight: 700,
                        lineHeight: 1,
                        color: "var(--ngram-ink)",
                        whiteSpace: "nowrap",
                        transition: "background 0.35s, box-shadow 0.35s",
                    }}
                >
                    {word}
                </span>
            </div>
        </motion.div>
    );
}

export const BigModelLimit = memo(function BigModelLimit({ accent }: { accent?: "ngram" }) {
    void accent;
    const reduce = useReducedMotion();
    const uid = useId().replace(/[:]/g, "");

    // similarity toggle: false = far apart (machine view), true = close (imagined understanding)
    const [near, setNear] = useState(false);

    // machine paragraph — hidden until user asks
    const [wrote, setWrote] = useState(false);
    const [para, setPara] = useState("");
    const [shown, setShown] = useState(0);

    const aLeft = near ? NEAR_A : POS_A;
    const bLeft = near ? NEAR_B : POS_B;
    const lo = Math.min(aLeft, bLeft);
    const hi = Math.max(aLeft, bLeft);

    const startRef = useRef(0);
    useEffect(() => {
        if (!wrote || !para || reduce) return;
        let raf = 0;
        startRef.current = 0;
        const tick = (t: number) => {
            if (!startRef.current) startRef.current = t;
            const n = Math.min(para.length, Math.round((t - startRef.current) / 9));
            setShown(n);
            if (n < para.length) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [wrote, para, reduce]);

    const revealed = reduce ? para.length : shown;

    const write = () => {
        setPara((p) => p || writtenParagraph());
        setShown(0);
        setWrote(true);
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0,
                width: "100%",
            }}
        >
            {/* ══ HERO: gato y perro como símbolos sin relación ══ */}
            <section
                style={{
                    width: "100%",
                    maxWidth: 620,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0,
                    paddingTop: 8,
                }}
            >
                {/* Hero headline — the one idea, stated before the visual */}
                <div style={{ marginBottom: 20, textAlign: "center" }}>
                    <span
                        style={{
                            fontFamily: SERIF,
                            fontSize: "clamp(22px, 3.5vw, 28px)",
                            fontWeight: 700,
                            lineHeight: 1.25,
                            color: "var(--ngram-ink)",
                            letterSpacing: "-0.01em",
                        }}
                    >
                        {near ? (
                            <>
                                si pudiera ver el parecido
                            </>
                        ) : (
                            <>
                                para la máquina,{" "}
                                <span style={{ color: "var(--ngram-accent-ink)", fontStyle: "italic" }}>
                                    sin relación
                                </span>
                            </>
                        )}
                    </span>
                    <div
                        style={{
                            marginTop: 8,
                            fontFamily: MONO,
                            fontSize: 12,
                            letterSpacing: ".14em",
                            textTransform: "uppercase",
                            color: "var(--ngram-dim)",
                        }}
                    >
                        {/* newCopyToI18n: lab.ngram.limit.heroSubGato */}
                        {near
                            ? "las parecidas, cerca — pero eso ya no se cuenta"
                            : "«gato» y «perro» son dos posiciones en una recta sin sentido"}
                    </div>
                </div>

                {/* The number line — always visible */}
                <div
                    style={{
                        width: "100%",
                        padding: "0 12px",
                        boxSizing: "border-box",
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            height: 176,
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        {/* axis */}
                        <div
                            aria-hidden
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: 0,
                                right: 0,
                                height: 2,
                                background: "var(--ngram-rule-2)",
                                transform: "translateY(-50%)",
                            }}
                        />

                        {/* span between the two words */}
                        <motion.div
                            key={`${uid}-span`}
                            layout={!reduce}
                            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 24 }}
                            aria-hidden
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: `${lo}%`,
                                width: `${hi - lo}%`,
                                height: 2,
                                marginTop: -1,
                                background: near
                                    ? "var(--ngram-accent)"
                                    : "repeating-linear-gradient(90deg, var(--ngram-accent) 0 6px, transparent 6px 13px)",
                                opacity: 0.85,
                            }}
                        />

                        {/* SIN RELACIÓN / CERCA label — centered on the span */}
                        <motion.div
                            key={`${uid}-spanlabel`}
                            layout={!reduce}
                            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 24 }}
                            aria-hidden
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: `${(lo + hi) / 2}%`,
                                transform: "translate(-50%, -50%)",
                                zIndex: 3,
                            }}
                        >
                            <span
                                style={{
                                    display: "inline-block",
                                    fontFamily: MONO,
                                    fontSize: near ? 10 : 11,
                                    letterSpacing: ".22em",
                                    textTransform: "uppercase",
                                    color: "var(--ngram-accent-ink)",
                                    whiteSpace: "nowrap",
                                    padding: "5px 14px",
                                    borderRadius: "var(--ngram-r-pill)",
                                    background: "var(--ngram-bg)",
                                    boxShadow: "inset 0 0 0 1.5px color-mix(in oklab, var(--ngram-accent) 40%, transparent)",
                                }}
                            >
                                {near ? "cerca" : "sin relación"}
                            </span>
                        </motion.div>

                        {/* The two word chips */}
                        <LinedWord
                            word={WORD_A}
                            left={aLeft}
                            below={false}
                            reduce={!!reduce}
                            highlighted={!near}
                        />
                        <LinedWord
                            word={WORD_B}
                            left={bLeft}
                            below
                            reduce={!!reduce}
                            highlighted={!near}
                        />
                    </div>
                </div>

                {/* Toggle button — immediately under the hero diagram */}
                <div style={{ marginTop: 4, marginBottom: 28 }}>
                    {near ? (
                        <GhostButton onClick={() => setNear(false)}>
                            {/* newCopyToI18n: lab.ngram.limit.btnResetFar */}
                            volver a lo que ve la máquina
                        </GhostButton>
                    ) : (
                        <PlayButton onClick={() => setNear(true)}>
                            {/* newCopyToI18n: lab.ngram.limit.btnNear */}
                            ¿y si entendiera el parecido?
                        </PlayButton>
                    )}
                </div>
            </section>

            {/* ── FLOW connector from hero to evidence ── */}
            <div
                aria-hidden
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 24,
                }}
            >
                <span style={{ width: 1, height: 24, background: "var(--ngram-rule-2)" }} />
                <span
                    style={{
                        fontFamily: MONO,
                        fontSize: 10,
                        letterSpacing: ".24em",
                        textTransform: "uppercase",
                        color: "var(--ngram-accent-ink)",
                        padding: "3px 12px",
                        borderRadius: "var(--ngram-r-pill)",
                        background: "var(--ngram-accent-soft)",
                    }}
                >
                    {/* newCopyToI18n: lab.ngram.limit.connectorYet */}
                    y sin embargo
                </span>
                <svg width="13" height="14" viewBox="0 0 13 14" fill="none">
                    <path
                        d="M6.5 0v11M2 7l4.5 5L11 7"
                        stroke="var(--ngram-rule-2)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>

            {/* ── EVIDENCE: the machine paragraph (secondary) ── */}
            <section
                style={{
                    width: "100%",
                    maxWidth: 600,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 14,
                }}
            >
                <CaptionLine gap={0}>
                    {/* newCopyToI18n: lab.ngram.limit.evidenceCaption */}
                    escribe casi como si entendiera
                </CaptionLine>

                {!wrote ? (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 12,
                            padding: "6px 0 4px",
                        }}
                    >
                        <GhostButton onClick={write}>
                            {/* newCopyToI18n: lab.ngram.limit.btnWrite */}
                            ver lo que escribe
                        </GhostButton>
                    </div>
                ) : (
                    <motion.figure
                        key="para"
                        initial={reduce ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={reduce ? { duration: 0 } : { duration: 0.4, ease: STD }}
                        style={{
                            margin: 0,
                            width: "100%",
                            maxWidth: 480,
                            borderRadius: "var(--ngram-r-md)",
                            background: "var(--ngram-surface)",
                            boxShadow: "inset 0 0 0 1px var(--ngram-rule)",
                            overflow: "hidden",
                        }}
                    >
                        <figcaption
                            style={{
                                fontFamily: MONO,
                                fontSize: 9.5,
                                letterSpacing: ".18em",
                                textTransform: "uppercase",
                                color: "var(--ngram-dim)",
                                padding: "8px 16px",
                                borderBottom: "1px solid var(--ngram-rule)",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <span
                                aria-hidden
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: "999px",
                                    background: "var(--ngram-accent)",
                                }}
                            />
                            {/* newCopyToI18n: lab.ngram.limit.machineLabel */}
                            la máquina escribe
                        </figcaption>
                        <blockquote
                            style={{
                                margin: 0,
                                padding: "13px 16px 15px",
                                fontFamily: SERIF,
                                fontSize: "clamp(13px, 1.5vw, 14.5px)",
                                lineHeight: 1.55,
                                color: "var(--ngram-dim)",
                                textAlign: "left",
                                minHeight: 78,
                            }}
                        >
                            {para.slice(0, revealed)}
                            {revealed < para.length && (
                                <span
                                    aria-hidden
                                    style={{
                                        display: "inline-block",
                                        width: "0.5ch",
                                        color: "var(--ngram-accent-bright)",
                                    }}
                                >
                                    ▍
                                </span>
                            )}
                        </blockquote>
                    </motion.figure>
                )}
            </section>
        </div>
    );
});

export default BigModelLimit;
