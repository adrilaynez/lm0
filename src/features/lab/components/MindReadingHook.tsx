"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { motion, useReducedMotion } from "framer-motion";

import { useI18n } from "@/i18n/context";
import { en } from "@/i18n/en";
import { es } from "@/i18n/es";

/**
 * MindReadingHook — the Bigram chapter's opening beat. The reader DISCOVERS that they already predict.
 *
 * ONE idea, lived (not told): a sentence is missing its last word. The reader writes the word they
 * think comes next. It reveals to be exactly what was coming. The point is NOT being right — it is
 * that a word was already in your head before you decided to think one. That is prediction, and a
 * machine that writes is a machine that does this, over and over.
 *
 * Why writing (not multiple choice, not tap-to-reveal): the reader must COMMIT their own guess before
 * anything is shown — the wow is *their* word landing. No orders ("type X"): the open sentence and the
 * blinking slot do the inviting. No pass/fail: an exact match says "you'd heard it a thousand times";
 * anything else says "yours fits too — your head already had one". Both celebrate the same thing.
 *
 * Aesthetic: editorial-green, token-only (`--bigram-*`), under the consumer's [data-bigram-theme]
 * scope. Typography-first — the sentence is the single focal point. Framer Motion only where it earns
 * it (the reveal, the spark on an exact match). Fully reduced-motion safe. Self-mounting, no props.
 */

const SERIF = "var(--bigram-font-serif, var(--font-source-serif))";
const MONO = "var(--bigram-font-mono, var(--font-jetbrains-mono))";

type Round = { lead: string; accept: string[]; real: string };
type Status = "typing" | "exact" | "also";

/** Strip case, accents and punctuation so "Tejado." matches "tejado". */
function norm(s: string): string {
    return s
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9 ]/g, "")
        .trim();
}

function useHookCopy() {
    const { t, language } = useI18n();
    const dict = (language === "es" ? es : en) as typeof en;
    const rounds =
        ((dict as unknown as { bigramNarrative?: { v2?: { hero?: { predict?: { rounds?: Round[] } } } } })
            .bigramNarrative?.v2?.hero?.predict?.rounds) ??
        ((en as unknown as { bigramNarrative: { v2: { hero: { predict: { rounds: Round[] } } } } })
            .bigramNarrative.v2.hero.predict.rounds);
    return {
        rounds,
        hint: t("bigramNarrative.v2.hero.predict.hintLabel"),
        exactNote: t("bigramNarrative.v2.hero.predict.exactNote"),
        alsoNote: t("bigramNarrative.v2.hero.predict.alsoNote"),
        commonHint: t("bigramNarrative.v2.hero.predict.commonHint"),
        again: t("bigramNarrative.v2.hero.predict.again"),
        idea: t("bigramNarrative.v2.hero.predict.idea"),
    };
}

export interface MindReadingHookProps {
    accent?: "bigram";
}

export const MindReadingHook = memo(function MindReadingHook({ accent = "bigram" }: MindReadingHookProps) {
    void accent;
    const reduce = useReducedMotion();
    const { rounds, hint, exactNote, alsoNote, commonHint, again, idea } = useHookCopy();

    const [idx, setIdx] = useState(0);
    const [value, setValue] = useState("");
    const [status, setStatus] = useState<Status>("typing");
    const [finished, setFinished] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const round = rounds[Math.min(idx, rounds.length - 1)];
    const revealed = status !== "typing";

    const acceptSet = useMemo(() => new Set(round.accept.map(norm)), [round]);

    const submit = useCallback(() => {
        const v = norm(value);
        if (!v) return; // a guess is required, but we never punish — just wait for one
        setStatus(acceptSet.has(v) ? "exact" : "also");
    }, [value, acceptSet]);

    const next = useCallback(() => {
        if (idx + 1 >= rounds.length) {
            setFinished(true);
            return;
        }
        setIdx(i => i + 1);
        setValue("");
        setStatus("typing");
    }, [idx, rounds.length]);

    // Keep focus on the live input as rounds advance.
    useEffect(() => {
        if (!finished && status === "typing") inputRef.current?.focus();
    }, [idx, finished, status]);

    const onKey = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            if (status === "typing") submit();
            else next();
        },
        [status, submit, next],
    );

    /* ── Finished: the idea lands ── */
    if (finished) {
        return (
            <motion.div
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ fontFamily: SERIF }}
            >
                <p
                    style={{
                        margin: 0,
                        fontFamily: SERIF,
                        fontSize: "clamp(24px, 4.2vw, 36px)",
                        fontWeight: 400,
                        lineHeight: 1.32,
                        letterSpacing: "-0.01em",
                        color: "var(--bigram-ink)",
                        maxWidth: "26ch",
                        textWrap: "balance",
                    }}
                >
                    {idea}
                </p>
            </motion.div>
        );
    }

    const widthCh = Math.max(round.real.length + 1, Math.max(value.length, 3) + 1);

    return (
        <div className="bw-hook" style={{ fontFamily: SERIF }}>
            {/* ── The sentence · single focal point ── */}
            <p
                style={{
                    margin: 0,
                    fontFamily: SERIF,
                    fontSize: "clamp(26px, 5vw, 44px)",
                    fontWeight: 400,
                    lineHeight: 1.3,
                    letterSpacing: "-0.012em",
                    color: "var(--bigram-ink)",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "baseline",
                    gap: "0.32em",
                }}
            >
                <span>{round.lead}</span>

                {!revealed ? (
                    <span style={{ position: "relative", display: "inline-flex", alignItems: "baseline" }}>
                        <input
                            ref={inputRef}
                            value={value}
                            onChange={e => setValue(e.target.value)}
                            onKeyDown={onKey}
                            spellCheck={false}
                            autoComplete="off"
                            aria-label={hint}
                            className="bw-hook__in"
                            style={{ width: `${widthCh}ch` }}
                        />
                    </span>
                ) : (
                    <motion.span
                        initial={reduce ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.42, ease: [0.2, 0.8, 0.2, 1] }}
                        style={{
                            position: "relative",
                            fontStyle: "italic",
                            fontWeight: 500,
                            color: status === "exact" ? "var(--bigram-accent-ink)" : "var(--bigram-ink)",
                            borderBottom: `2px solid ${status === "exact" ? "var(--bigram-accent)" : "color-mix(in oklab, var(--bigram-ink) 22%, transparent)"}`,
                            paddingBottom: "0.04em",
                        }}
                    >
                        {value.trim()}
                        {status === "exact" && !reduce && <Spark />}
                    </motion.span>
                )}
            </p>

            {/* ── Below the sentence: invitation while typing, the read after ── */}
            <div style={{ marginTop: "clamp(22px, 4vw, 34px)", minHeight: 64 }}>
                {!revealed ? (
                    <span
                        style={{
                            fontFamily: MONO,
                            fontSize: 11.5,
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            color: "var(--bigram-dim)",
                        }}
                    >
                        {hint}
                    </span>
                ) : (
                    <motion.div
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.46, delay: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                        style={{ display: "flex", flexDirection: "column", gap: 18 }}
                    >
                        <p
                            style={{
                                margin: 0,
                                fontFamily: SERIF,
                                fontSize: "clamp(17px, 2.1vw, 20px)",
                                lineHeight: 1.5,
                                color: "var(--bigram-body)",
                                maxWidth: "40ch",
                            }}
                        >
                            {status === "exact"
                                ? exactNote
                                : `${alsoNote} ${commonHint.replace("{word}", round.real)}`}
                        </p>
                        <div>
                            <button type="button" className="bw-hook__again" onClick={next}>
                                {again}
                                <span aria-hidden className="bw-hook__again-glyph">
                                    →
                                </span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* ── Quiet round progress (not a score) ── */}
            <div style={{ display: "flex", gap: 7, marginTop: "clamp(24px, 4vw, 36px)" }} aria-hidden>
                {rounds.map((_, i) => (
                    <span
                        key={i}
                        style={{
                            width: i === idx ? 18 : 7,
                            height: 7,
                            borderRadius: 999,
                            background:
                                i < idx || (i === idx && revealed)
                                    ? "var(--bigram-accent)"
                                    : i === idx
                                      ? "color-mix(in oklab, var(--bigram-accent) 40%, transparent)"
                                      : "color-mix(in oklab, var(--bigram-ink) 12%, transparent)",
                            transition: "width .3s ease, background .3s ease",
                        }}
                    />
                ))}
            </div>

            <style>{`
                .bw-hook__in {
                    font-family: ${SERIF}; font-style: italic; font-weight: 500;
                    font-size: inherit; line-height: inherit; color: var(--bigram-accent-ink);
                    background: transparent; border: 0; outline: none; padding: 0 0 0.04em;
                    border-bottom: 2px solid color-mix(in oklab, var(--bigram-accent) 55%, transparent);
                    caret-color: var(--bigram-accent); min-width: 3ch;
                    transition: border-color .2s ease;
                }
                .bw-hook__in::placeholder { color: var(--bigram-dim); font-style: italic; }
                .bw-hook__in:focus { border-bottom-color: var(--bigram-accent); }
                .bw-hook__again {
                    font-family: ${MONO}; font-size: 12px; letter-spacing: .14em; text-transform: uppercase;
                    font-weight: 500; color: var(--bigram-accent); cursor: pointer;
                    display: inline-flex; align-items: center; gap: 9px;
                    padding: 10px 22px; border-radius: var(--bigram-r-pill); background: transparent;
                    border: 1px solid color-mix(in oklab, var(--bigram-accent) 34%, var(--bigram-rule));
                    transition: background .2s ease, border-color .2s ease, gap .2s ease;
                }
                .bw-hook__again:hover {
                    background: var(--bigram-accent-soft);
                    border-color: var(--bigram-accent); gap: 13px;
                }
                .bw-hook__again-glyph { transition: transform .22s ease; }
                .bw-hook__again:hover .bw-hook__again-glyph { transform: translateX(3px); }
            `}</style>
        </div>
    );
});

/** A small one-shot radial spark on an exact match. Pure decoration; reduced-motion callers skip it. */
function Spark() {
    const dots = [0, 1, 2, 3, 4, 5];
    return (
        <span style={{ position: "absolute", right: "-2px", top: "-0.2em", width: 0, height: 0 }} aria-hidden>
            {dots.map(i => {
                const ang = (i / dots.length) * Math.PI * 2;
                return (
                    <motion.span
                        key={i}
                        initial={{ opacity: 0.9, x: 0, y: 0, scale: 1 }}
                        animate={{
                            opacity: 0,
                            x: Math.cos(ang) * 16,
                            y: Math.sin(ang) * 16,
                            scale: 0.4,
                        }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
                        style={{
                            position: "absolute",
                            width: 4,
                            height: 4,
                            borderRadius: 999,
                            background: "var(--bigram-accent)",
                        }}
                    />
                );
            })}
        </span>
    );
}
