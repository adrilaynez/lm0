"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { motion, useReducedMotion } from "framer-motion";

import { useI18n } from "@/i18n/context";
import { en } from "@/i18n/en";
import { es } from "@/i18n/es";

/**
 * FillTheBlank (VIS 1) — the chapter's opening beat.
 *
 * ONE idea, lived not told: three lines missing their last word. You write what comes next.
 *   1. familiar  — "En un lugar de la ___"            → it was already there.
 *   2. deductive — "el perro ladra ... y el gato ___" → worked out from the sentence.
 *   3. PATTERN   — "Fli fli fla, fli fli ___"         → the keystone: you predicted a word that means
 *                  NOTHING. You didn't understand it; you saw the pattern and kept going. That is the
 *                  whole thesis of the chapter, discovered by the reader.
 *
 * If your guess doesn't fit, it doesn't punish: it gives a gentle hint and lets you try again (or
 * reveal). The point is that a word was in your head — and that on "fli fla" you predicted with no
 * meaning at all. Token-only, reduced-motion safe, self-mounting.
 */

const SERIF = "var(--bigram-font-serif, var(--font-source-serif))";
const MONO = "var(--bigram-font-mono, var(--font-jetbrains-mono))";

type Screen = { lead: string; accept: string[]; real: string; hint: string; note: string };
type Status = "typing" | "help" | "done";

/** Strip case, accents and punctuation so "Mancha." matches "mancha". */
function norm(s: string): string {
    return s
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9 ]/g, "")
        .trim();
}

function useFillCopy() {
    const { t, language } = useI18n();
    const dict = (language === "es" ? es : en) as typeof en;
    const screens =
        (dict as unknown as { bigramNarrative?: { v2?: { fillBlank?: { screens?: Screen[] } } } })
            .bigramNarrative?.v2?.fillBlank?.screens ??
        (en as unknown as { bigramNarrative: { v2: { fillBlank: { screens: Screen[] } } } })
            .bigramNarrative.v2.fillBlank.screens;
    return {
        screens,
        label: t("bigramNarrative.v2.fillBlank.label"),
        hintLabel: t("bigramNarrative.v2.fillBlank.hintLabel"),
        again: t("bigramNarrative.v2.fillBlank.again"),
        tryAgain: t("bigramNarrative.v2.fillBlank.tryAgain"),
        reveal: t("bigramNarrative.v2.fillBlank.reveal"),
    };
}

export interface FillTheBlankProps {
    accent?: "bigram";
}

export const FillTheBlank = memo(function FillTheBlank({ accent = "bigram" }: FillTheBlankProps) {
    void accent;
    const reduce = useReducedMotion();
    const { screens, label, hintLabel, again, tryAgain, reveal } = useFillCopy();

    const [idx, setIdx] = useState(0);
    const [value, setValue] = useState("");
    const [status, setStatus] = useState<Status>("typing");
    const [forced, setForced] = useState(false); // revealed via the "show answer" button
    const inputRef = useRef<HTMLInputElement>(null);

    const screen = screens[Math.min(idx, screens.length - 1)];
    const isKeystone = idx === screens.length - 1;
    const acceptSet = useMemo(() => new Set(screen.accept.map(norm)), [screen]);

    const submit = useCallback(() => {
        const v = norm(value);
        if (!v) return;
        if (acceptSet.has(v)) {
            setForced(false);
            setStatus("done");
        } else {
            setStatus("help"); // gentle: a hint + retry, never a hard fail
        }
    }, [value, acceptSet]);

    const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        setStatus((s) => (s === "help" ? "typing" : s)); // typing again clears the hint
    }, []);

    const revealAnswer = useCallback(() => {
        setForced(true);
        setStatus("done");
    }, []);

    const next = useCallback(() => {
        if (idx + 1 >= screens.length) return; // last screen: the narrative below carries on
        setIdx((i) => i + 1);
        setValue("");
        setForced(false);
        setStatus("typing");
    }, [idx, screens.length]);

    const restart = useCallback(() => {
        setIdx(0);
        setValue("");
        setForced(false);
        setStatus("typing");
    }, []);

    useEffect(() => {
        if (status !== "done") inputRef.current?.focus();
    }, [idx, status]);

    const onKey = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            if (status === "done") next();
            else submit();
        },
        [status, submit, next],
    );

    const done = status === "done";
    const exact = done && !forced;
    const shownWord = forced ? screen.real : value.trim();
    const widthCh = Math.max(shownWord.length, value.length, 4) + 1;

    return (
        <div className="bw-fill" style={{ fontFamily: SERIF }}>
            <span className="bw-fill__label">{label}</span>

            {/* ── The sentence · single focal point ── */}
            <p className="bw-fill__line">
                <span>{screen.lead}</span>
                {!done ? (
                    <input
                        ref={inputRef}
                        value={value}
                        onChange={onChange}
                        onKeyDown={onKey}
                        spellCheck={false}
                        autoComplete="off"
                        aria-label={hintLabel}
                        className="bw-fill__in"
                        data-help={status === "help" ? "1" : "0"}
                        style={{ width: `${widthCh}ch` }}
                    />
                ) : (
                    <motion.span
                        className="bw-fill__word"
                        initial={reduce ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.42, ease: [0.2, 0.8, 0.2, 1] }}
                        data-exact={exact ? "1" : "0"}
                    >
                        {shownWord}
                    </motion.span>
                )}
            </p>

            {/* ── Below: invitation · hint-on-miss · the read after ── */}
            <div className="bw-fill__under">
                {status === "typing" && <span className="bw-fill__hintlabel">{hintLabel}</span>}

                {status === "help" && (
                    <motion.div
                        key="help"
                        initial={reduce ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
                        className="bw-fill__help"
                    >
                        <p className="bw-fill__helptext">
                            <span className="bw-fill__helptag">{tryAgain}</span> {screen.hint}
                        </p>
                        <button type="button" className="bw-fill__reveal" onClick={revealAnswer}>
                            {reveal}
                        </button>
                    </motion.div>
                )}

                {done && (
                    <motion.div
                        key="done"
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.46, delay: 0.14, ease: [0.2, 0.8, 0.2, 1] }}
                        className="bw-fill__reveal-wrap"
                    >
                        <p className="bw-fill__note" data-keystone={isKeystone ? "1" : "0"}>
                            {screen.note}
                        </p>
                        {!isKeystone ? (
                            <button type="button" className="bw-fill__again" onClick={next}>
                                {again}
                                <span aria-hidden className="bw-fill__glyph">→</span>
                            </button>
                        ) : (
                            <button type="button" className="bw-fill__restart" onClick={restart} aria-label={again}>
                                ↻
                            </button>
                        )}
                    </motion.div>
                )}
            </div>

            {/* ── Quiet progress (not a score) ── */}
            <div className="bw-fill__dots" aria-hidden>
                {screens.map((_, i) => (
                    <span
                        key={i}
                        className="bw-fill__dot"
                        data-state={i < idx || (i === idx && done) ? "done" : i === idx ? "active" : "idle"}
                    />
                ))}
            </div>

            <style>{`
                .bw-fill { display: flex; flex-direction: column; }
                .bw-fill__label {
                    font-family: ${MONO}; font-size: 11.5px; letter-spacing: .16em; text-transform: uppercase;
                    color: var(--bigram-dim); margin-bottom: clamp(18px, 3vw, 26px);
                }
                .bw-fill__line {
                    margin: 0; font-family: ${SERIF}; font-weight: 400;
                    font-size: clamp(26px, 5vw, 44px); line-height: 1.3; letter-spacing: -0.012em;
                    color: var(--bigram-ink);
                    display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.3em;
                }
                .bw-fill__in {
                    font-family: ${SERIF}; font-style: italic; font-weight: 500;
                    font-size: inherit; line-height: inherit; color: var(--bigram-accent-ink);
                    background: transparent; border: 0; outline: none; padding: 0 0 0.04em; min-width: 4ch;
                    border-bottom: 2px solid color-mix(in oklab, var(--bigram-accent) 55%, transparent);
                    caret-color: var(--bigram-accent); transition: border-color .2s ease;
                }
                .bw-fill__in:focus { border-bottom-color: var(--bigram-accent); }
                .bw-fill__in[data-help="1"] { border-bottom-color: var(--bigram-sage); }
                .bw-fill__word {
                    font-style: italic; font-weight: 500; padding-bottom: 0.04em;
                    color: var(--bigram-ink);
                    border-bottom: 2px solid color-mix(in oklab, var(--bigram-ink) 22%, transparent);
                }
                .bw-fill__word[data-exact="1"] {
                    color: var(--bigram-accent-ink);
                    border-bottom-color: var(--bigram-accent);
                }
                .bw-fill__under { margin-top: clamp(22px, 4vw, 34px); min-height: 96px; }
                .bw-fill__hintlabel {
                    font-family: ${MONO}; font-size: 11.5px; letter-spacing: .16em; text-transform: uppercase;
                    color: var(--bigram-dim);
                }
                .bw-fill__help { display: flex; flex-direction: column; gap: 12px; align-items: flex-start; }
                .bw-fill__helptext {
                    margin: 0; font-family: ${SERIF}; font-size: clamp(17px, 2.1vw, 20px);
                    line-height: 1.5; color: var(--bigram-body); max-width: 44ch;
                }
                .bw-fill__helptag {
                    font-family: ${MONO}; font-size: 11px; letter-spacing: .1em; text-transform: uppercase;
                    color: var(--bigram-sage); margin-right: 4px;
                }
                .bw-fill__reveal {
                    font-family: ${MONO}; font-size: 11px; letter-spacing: .12em; text-transform: uppercase;
                    color: var(--bigram-dim); background: transparent; border: 0; cursor: pointer; padding: 4px 0;
                    border-bottom: 1px solid color-mix(in oklab, var(--bigram-ink) 20%, transparent);
                    transition: color .2s ease, border-color .2s ease;
                }
                .bw-fill__reveal:hover { color: var(--bigram-accent); border-bottom-color: var(--bigram-accent); }
                .bw-fill__reveal-wrap { display: flex; flex-direction: column; gap: 18px; }
                .bw-fill__note {
                    margin: 0; font-family: ${SERIF}; font-size: clamp(17px, 2.1vw, 20px);
                    line-height: 1.5; color: var(--bigram-body); max-width: 46ch;
                }
                .bw-fill__note[data-keystone="1"] {
                    font-size: clamp(19px, 2.6vw, 24px); line-height: 1.46; color: var(--bigram-ink);
                    max-width: 30ch; text-wrap: balance;
                    border-left: 2px solid var(--bigram-accent); padding-left: 18px;
                }
                .bw-fill__again {
                    align-self: flex-start;
                    font-family: ${MONO}; font-size: 12px; letter-spacing: .14em; text-transform: uppercase;
                    font-weight: 500; color: var(--bigram-accent); cursor: pointer;
                    display: inline-flex; align-items: center; gap: 9px;
                    padding: 10px 22px; border-radius: var(--bigram-r-pill); background: transparent;
                    border: 1px solid color-mix(in oklab, var(--bigram-accent) 34%, var(--bigram-rule));
                    transition: background .2s ease, border-color .2s ease, gap .2s ease;
                }
                .bw-fill__again:hover {
                    background: var(--bigram-accent-soft); border-color: var(--bigram-accent); gap: 13px;
                }
                .bw-fill__glyph { transition: transform .22s ease; }
                .bw-fill__again:hover .bw-fill__glyph { transform: translateX(3px); }
                .bw-fill__restart {
                    align-self: flex-start; width: 38px; height: 38px; border-radius: var(--bigram-r-pill);
                    background: transparent; cursor: pointer; color: var(--bigram-dim);
                    border: 1px solid var(--bigram-rule); font-size: 16px; line-height: 1;
                    transition: color .2s ease, border-color .2s ease, transform .3s ease;
                }
                .bw-fill__restart:hover { color: var(--bigram-accent); border-color: var(--bigram-accent); transform: rotate(-90deg); }
                .bw-fill__dots { display: flex; gap: 7px; margin-top: clamp(24px, 4vw, 34px); }
                .bw-fill__dot {
                    width: 7px; height: 7px; border-radius: 999px;
                    background: color-mix(in oklab, var(--bigram-ink) 12%, transparent);
                    transition: width .3s ease, background .3s ease;
                }
                .bw-fill__dot[data-state="active"] {
                    width: 18px; background: color-mix(in oklab, var(--bigram-accent) 40%, transparent);
                }
                .bw-fill__dot[data-state="done"] { width: 18px; background: var(--bigram-accent); }
            `}</style>
        </div>
    );
});

export default FillTheBlank;
