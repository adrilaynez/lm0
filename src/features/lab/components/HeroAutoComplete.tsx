"use client";

import { memo, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { HonestBar } from "@/features/lab/components/bigram/HonestBar";
import { useI18n } from "@/i18n/context";

/**
 * HeroAutoComplete — the Bigram chapter's opening visualizer (v8, editorial-green).
 *
 * ONE idea, shown almost instantly: type a single letter and the model reveals what it thinks
 * comes next. The predictions are drawn with the shared `HonestBar` on its FIXED axis (0.5), so a
 * weak guess literally looks weak — the honesty of the distribution is the whole point, replacing
 * the old normalise-to-100% bars (which hid the model's uncertainty behind a full green bar).
 *
 * Premium-but-minimal: a keycap input is the single focal point; the letter settles in with a soft
 * spring; an idle pulse invites the first keystroke; the predictions cascade winner-LAST so the most
 * likely bar lands brightest, sweeps a glint, and counts up. Token-only (--bigram-*), gated by the
 * page's [data-bigram-theme] scope — no neon, no raw hex, no cyan focus border. Reduced-motion safe.
 */

const BIGRAMS: Record<string, { char: string; prob: number }[]> = {
    a: [{ char: "n", prob: 0.31 }, { char: "r", prob: 0.18 }, { char: "t", prob: 0.15 }],
    b: [{ char: "e", prob: 0.38 }, { char: "u", prob: 0.21 }, { char: "l", prob: 0.14 }],
    c: [{ char: "o", prob: 0.29 }, { char: "h", prob: 0.22 }, { char: "e", prob: 0.19 }],
    d: [{ char: " ", prob: 0.35 }, { char: "e", prob: 0.28 }, { char: "i", prob: 0.12 }],
    e: [{ char: " ", prob: 0.37 }, { char: "r", prob: 0.20 }, { char: "n", prob: 0.13 }],
    f: [{ char: " ", prob: 0.27 }, { char: "o", prob: 0.22 }, { char: "r", prob: 0.16 }],
    g: [{ char: " ", prob: 0.29 }, { char: "e", prob: 0.25 }, { char: "r", prob: 0.13 }],
    h: [{ char: "e", prob: 0.49 }, { char: "i", prob: 0.21 }, { char: "a", prob: 0.14 }],
    i: [{ char: "n", prob: 0.36 }, { char: "t", prob: 0.18 }, { char: "s", prob: 0.14 }],
    j: [{ char: "u", prob: 0.55 }, { char: "o", prob: 0.22 }, { char: "e", prob: 0.11 }],
    k: [{ char: " ", prob: 0.42 }, { char: "e", prob: 0.24 }, { char: "i", prob: 0.12 }],
    l: [{ char: "l", prob: 0.27 }, { char: "e", prob: 0.24 }, { char: "y", prob: 0.13 }],
    m: [{ char: "e", prob: 0.30 }, { char: "a", prob: 0.25 }, { char: "o", prob: 0.14 }],
    n: [{ char: " ", prob: 0.38 }, { char: "g", prob: 0.18 }, { char: "t", prob: 0.14 }],
    o: [{ char: "n", prob: 0.28 }, { char: "r", prob: 0.22 }, { char: "f", prob: 0.17 }],
    p: [{ char: "r", prob: 0.29 }, { char: "e", prob: 0.24 }, { char: "o", prob: 0.16 }],
    q: [{ char: "u", prob: 0.92 }, { char: "i", prob: 0.05 }, { char: "a", prob: 0.02 }],
    r: [{ char: "e", prob: 0.33 }, { char: " ", prob: 0.25 }, { char: "i", prob: 0.14 }],
    s: [{ char: " ", prob: 0.29 }, { char: "t", prob: 0.22 }, { char: "e", prob: 0.18 }],
    t: [{ char: "h", prob: 0.52 }, { char: "e", prob: 0.19 }, { char: "i", prob: 0.10 }],
    u: [{ char: "r", prob: 0.26 }, { char: "n", prob: 0.22 }, { char: "s", prob: 0.15 }],
    v: [{ char: "e", prob: 0.65 }, { char: "i", prob: 0.19 }, { char: "a", prob: 0.09 }],
    w: [{ char: "i", prob: 0.28 }, { char: "h", prob: 0.25 }, { char: "a", prob: 0.18 }],
    x: [{ char: "t", prob: 0.38 }, { char: "p", prob: 0.22 }, { char: "e", prob: 0.15 }],
    y: [{ char: " ", prob: 0.45 }, { char: "o", prob: 0.18 }, { char: "e", prob: 0.12 }],
    z: [{ char: "e", prob: 0.48 }, { char: "a", prob: 0.20 }, { char: "i", prob: 0.14 }],
    " ": [{ char: "t", prob: 0.18 }, { char: "a", prob: 0.14 }, { char: "s", prob: 0.11 }],
};

const FALLBACK = [{ char: "e", prob: 0.27 }, { char: "t", prob: 0.19 }, { char: "a", prob: 0.14 }];

/** Winner-last cascade: the runners fill first, the most-likely bar lands last (brightest + glint). */
const CASCADE_STEP_S = 0.12;

export const HeroAutoComplete = memo(function HeroAutoComplete() {
    const { t } = useI18n();
    const reduce = useReducedMotion();
    const [input, setInput] = useState("");
    const [focused, setFocused] = useState(false);

    const letter = input.slice(-1);
    const preds = letter.length === 1 ? (BIGRAMS[letter.toLowerCase()] ?? FALLBACK) : null;
    const idle = !input && !focused;

    return (
        <div
            className="bw-auto flex flex-wrap items-center justify-center gap-7 sm:gap-9"
            style={{ fontFamily: "var(--font-source-serif)" }}
        >
            {/* ── Keycap input · the single focal point ───────────────────────── */}
            <div className="relative flex-none">
                {/* idle pulse — a calm invitation to type; removed entirely under reduced-motion */}
                {idle && !reduce && (
                    <motion.span
                        aria-hidden
                        animate={{ scale: [1, 1.16, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                        className="pointer-events-none absolute inset-0"
                        style={{
                            borderRadius: "var(--bigram-r-md)",
                            background: "var(--bigram-accent-soft)",
                        }}
                    />
                )}
                <motion.input
                    type="text"
                    maxLength={1}
                    inputMode="text"
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    value={input}
                    onChange={(e) => setInput(e.target.value.slice(-1))}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={t("bigramWidgets.heroAutoComplete.placeholder")}
                    aria-label={t("bigramWidgets.heroAutoComplete.hint")}
                    initial={reduce ? false : { scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 26 }}
                    className="relative z-[1] text-center focus:outline-none"
                    style={{
                        width: "clamp(92px, 26vw, 116px)",
                        height: "clamp(92px, 26vw, 116px)",
                        fontFamily: "var(--font-jetbrains-mono)",
                        fontSize: "clamp(52px, 14vw, 64px)",
                        fontWeight: 600,
                        lineHeight: 1,
                        borderRadius: "var(--bigram-r-md)",
                        border: `2px solid ${focused ? "var(--bigram-accent)" : "var(--bigram-accent-2)"}`,
                        background: "var(--bigram-accent-soft)",
                        color: "var(--bigram-ink)",
                        caretColor: "var(--bigram-accent)",
                        boxShadow: focused
                            ? "0 0 0 3px var(--bigram-accent-soft)"
                            : "none",
                        transition:
                            "border-color .2s ease, box-shadow .2s ease, background .2s ease",
                    }}
                />
            </div>

            {/* ── Honest predictions · the fixed-axis distribution ────────────── */}
            <div className="min-w-0 flex-1" style={{ minWidth: "260px" }}>
                <AnimatePresence mode="wait" initial={false}>
                    {preds ? (
                        <motion.div
                            key={letter}
                            initial={reduce ? false : { opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
                            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                        >
                            <p
                                style={{
                                    fontFamily: "var(--font-jetbrains-mono)",
                                    fontSize: "11px",
                                    letterSpacing: "0.18em",
                                    textTransform: "uppercase",
                                    color: "var(--bigram-muted)",
                                    margin: "0 0 6px",
                                }}
                            >
                                {t("bigramWidgets.heroAutoComplete.after").replace(
                                    "{input}",
                                    letter === " " ? "␣" : letter,
                                )}
                            </p>
                            {preds.map(({ char, prob }, i) => {
                                const isTop = i === 0;
                                // Winner-last: runners fill first (top → last index), winner lands last.
                                const delay = (preds.length - 1 - i) * CASCADE_STEP_S;
                                return (
                                    <HonestBar
                                        key={`${letter}:${char}`}
                                        src={letter}
                                        dst={char}
                                        value={prob}
                                        top={isTop}
                                        delay={delay}
                                    />
                                );
                            })}
                        </motion.div>
                    ) : (
                        <motion.p
                            key="empty"
                            initial={reduce ? false : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.22 }}
                            style={{
                                fontFamily: "var(--font-source-serif)",
                                fontStyle: "italic",
                                fontSize: "16px",
                                lineHeight: 1.6,
                                color: "var(--bigram-muted)",
                                margin: 0,
                            }}
                        >
                            {t("bigramWidgets.heroAutoComplete.hint")}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
});
