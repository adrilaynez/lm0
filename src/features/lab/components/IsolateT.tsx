"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { motion } from "framer-motion";

import { displayChar } from "@/features/lab/data/bigramCorpus";
import { useI18n } from "@/i18n/context";

/**
 * IsolateT (VIS 3) — the same letter, different texts, a different winner.
 *
 * ONE idea: fix the letter to «t» and only change the TEXT. The machine reads each text the SAME way —
 * letter by letter — and whenever it lands on a «t» it lights that «t» and the one right after it, then
 * tallies the follower. The winner flips from text to text: proof that a short text teaches a biased rule.
 *
 * Marking idiom — IDENTICAL to PairHighlighter (the §2 sibling): the focus letter gets a filled accent
 * chip (hot1), the very next letter a soft accent tint with an inset ring (hot2). Same letters, same
 * treatment, so the whole chapter reads as one hand. Here it fires on every «t» instead of every pair,
 * because hunting the «t» is the whole point. Counted PROGRESSIVELY, with a beat on each «t», so you
 * watch the bars climb. Token-only, self-mounting, reduced-motion aware.
 *
 * The scanning view is an inner component keyed by the active text, so switching tabs remounts it and
 * the scan resets cleanly — no state reset inside an effect.
 */

const MONO = "var(--bigram-font-mono)";
const SERIF = "var(--bigram-font-serif)";
const STEP_MS = 46; // a calm letter-by-letter reading pace between t's…
const T_PAUSE_MS = 300; // …with a clear beat on each «t» so you see it counted

/* Three longer texts whose «t»-winner differs — h · ␣ · o (verified against the same fold the widget
   uses). The machine counts them honestly; the winner changes because the text changes. */
const PHRASES = [
    "the truth is that the other theory there is thinner than both, though that thought is theirs",
    "it sat out at that spot, it got cut short, it lit it, it let it out, it cost a lot at night",
    "to talk to a stranger, to trust no storm, to stop, to start, to go into town, to taste it too",
];

type TFunc = ReturnType<typeof useI18n>["t"];

function norm(c: string): string {
    const o = c.charCodeAt(0);
    if (o >= 97 && o <= 122) return c;
    if (o >= 65 && o <= 90) return String.fromCharCode(o + 32);
    return " ";
}

interface Settled {
    counts: Record<string, number>;
    order: string[];
    last: { f: string; n: number } | null;
}

/** The whole phrase counted at once — used to seed reduced-motion (no animation). */
function settle(phrase: string): Settled {
    const counts: Record<string, number> = {};
    const order: string[] = [];
    let last: { f: string; n: number } | null = null;
    for (let i = 0; i < phrase.length - 1; i++) {
        if (norm(phrase[i]) === "t") {
            const f = norm(phrase[i + 1]);
            counts[f] = (counts[f] ?? 0) + 1;
            last = { f, n: counts[f] };
            if (!order.includes(f)) order.push(f);
        }
    }
    return { counts, order, last };
}

/* ── Inner scanner: owns one read-through of `phrase`. Keyed by the tab so it remounts on switch. ── */
const Scanner = memo(function Scanner({
    phrase,
    reduce,
    t,
}: {
    phrase: string;
    reduce: boolean;
    t: TFunc;
}) {
    const settled = useMemo(() => settle(phrase), [phrase]);

    type SPhase = "idle" | "scanning" | "done";
    const [phase, setPhase] = useState<SPhase>(reduce ? "done" : "idle");
    const [scanI, setScanI] = useState(reduce ? phrase.length : 0);
    const [order, setOrder] = useState<string[]>(reduce ? settled.order : []);
    const [counts, setCounts] = useState<Record<string, number>>(reduce ? settled.counts : {});
    const [lastPair, setLastPair] = useState<{ f: string; n: number } | null>(
        reduce ? settled.last : null,
    );

    const posRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stepRef = useRef<() => void>(() => {});

    const step = useCallback(() => {
        const i = posRef.current;
        if (i >= phrase.length) {
            setScanI(phrase.length);
            setPhase("done");
            return;
        }
        const isT = norm(phrase[i]) === "t";
        if (isT && i + 1 < phrase.length) {
            const f = norm(phrase[i + 1]);
            setCounts((c) => {
                const n = (c[f] ?? 0) + 1;
                setLastPair({ f, n });
                return { ...c, [f]: n };
            });
            setOrder((o) => (o.includes(f) ? o : [...o, f]));
        }
        posRef.current = i + 1;
        setScanI(posRef.current);
        if (posRef.current < phrase.length) {
            timerRef.current = setTimeout(() => stepRef.current(), isT ? T_PAUSE_MS : STEP_MS);
        } else {
            setPhase("done");
        }
    }, [phrase]);

    useEffect(() => {
        stepRef.current = step;
    }, [step]);

    // No auto-play: the reader presses "start". This effect only clears a pending timer on unmount.
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const begin = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        posRef.current = 0;
        setScanI(0);
        setOrder([]);
        setCounts({});
        setLastPair(null);
        setPhase("scanning");
        timerRef.current = setTimeout(() => stepRef.current(), 320);
    }, []);

    const skip = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        posRef.current = phrase.length;
        setCounts(settled.counts);
        setOrder(settled.order);
        setLastPair(settled.last);
        setScanI(phrase.length);
        setPhase("done");
    }, [phrase, settled]);

    const max = Math.max(1, ...order.map((f) => counts[f] ?? 0));
    let winner = "";
    for (const f of order) if ((counts[f] ?? 0) > (counts[winner] ?? 0)) winner = f;
    const done = scanI >= phrase.length;
    const curIsT = scanI < phrase.length && norm(phrase[scanI]) === "t";
    const bestLabel = winner === " " ? t("bigramNarrative.v2.isolateT.spaceWord") : `«${winner}»`;

    return (
        <>
            {/* the text, read letter by letter — current «t» filled (hot1), the next one tinted (hot2),
                exactly like the pair-hunter before it. Words are kept whole (never split across lines)
                so it reads like a real sentence; spaces are the only wrap points. */}
            <p className="bw-it__phrase">
                {(() => {
                    const stateOf = (i: number) =>
                        i === scanI && curIsT
                            ? "t"
                            : i === scanI + 1 && curIsT
                              ? "follower"
                              : i === scanI && !done
                                ? "cur"
                                : i < scanI
                                  ? "past"
                                  : "future";
                    const items: React.ReactNode[] = [];
                    let word: React.ReactNode[] = [];
                    const flush = (k: string) => {
                        if (word.length) {
                            items.push(
                                <span key={`w${k}`} className="bw-it__word">
                                    {word}
                                </span>,
                            );
                            word = [];
                        }
                    };
                    phrase.split("").forEach((ch, i) => {
                        if (ch === " ") {
                            flush(`${i}`);
                            items.push(
                                <span key={i} className="bw-it__ch bw-it__space" data-state={stateOf(i)}>
                                    {" "}
                                </span>,
                            );
                        } else {
                            word.push(
                                <span key={i} className="bw-it__ch" data-state={stateOf(i)}>
                                    {ch}
                                </span>,
                            );
                        }
                    });
                    flush("end");
                    return items;
                })()}
            </p>

            {/* narrated current pair — same line as PairHighlighter: "PAR ACTUAL  t→h  · primera vez" */}
            <div className="bw-it__now" data-show={lastPair ? "1" : "0"}>
                <span className="bw-it__nowlbl">
                    {t("bigramNarrative.v2.pairHighlighter.currentPairLabel")}
                </span>
                <span className="bw-it__nowpair">
                    t&nbsp;<span className="bw-it__arrow">→</span>&nbsp;
                    <b>{lastPair ? displayChar(lastPair.f) : "·"}</b>
                </span>
                <span className="bw-it__nowtag" data-rep={lastPair && lastPair.n >= 2 ? "1" : "0"}>
                    {lastPair && lastPair.n >= 2
                        ? t("bigramNarrative.v2.pairHighlighter.seenRepeats", { n: lastPair.n })
                        : t("bigramNarrative.v2.pairHighlighter.firstTime")}
                </span>
            </div>

            {phase !== "idle" && (
                <>
                    <p className="bw-it__follabel">{t("bigramNarrative.v2.isolateT.followsLabel")}</p>
                    <div className="bw-it__rows">
                        {order.map((f) => {
                            const n = counts[f] ?? 0;
                            const isWin = f === winner;
                            return (
                                <div key={f} className="bw-it__row" data-win={isWin ? "1" : "0"}>
                                    <span className="bw-it__pair">
                                        t&nbsp;→&nbsp;<b>{displayChar(f)}</b>
                                    </span>
                                    <div className="bw-it__track">
                                        <motion.span
                                            className="bw-it__fill"
                                            animate={{ width: `${(n / max) * 100}%` }}
                                            transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
                                        />
                                    </div>
                                    <span className="bw-it__n">{n}</span>
                                </div>
                            );
                        })}
                        {order.length === 0 && <div className="bw-it__rows-empty" aria-hidden />}
                    </div>
                </>
            )}

            {phase === "done" && (
                <p className="bw-it__verdict" data-show="1">
                    {t("bigramNarrative.v2.isolateT.verdict", { best: bestLabel })}
                </p>
            )}

            <div className="bw-it__controls">
                {phase === "idle" && (
                    <>
                        <p className="bw-it__idlehint">{t("bigramNarrative.v2.isolateT.idleHint")}</p>
                        <div className="bw-it__btns">
                            <button
                                type="button"
                                className="bw-it__btn bw-it__btn--primary"
                                onClick={begin}
                            >
                                {t("bigramNarrative.v2.isolateT.start")}
                            </button>
                            <button type="button" className="bw-it__btn" onClick={skip}>
                                {t("bigramNarrative.v2.isolateT.autocomplete")}
                            </button>
                        </div>
                    </>
                )}
                {phase === "scanning" && (
                    <button type="button" className="bw-it__btn" onClick={skip}>
                        {t("bigramNarrative.v2.isolateT.autocomplete")}
                    </button>
                )}
                {phase === "done" && !reduce && (
                    <button type="button" className="bw-it__btn" onClick={begin}>
                        ↻ {t("bigramNarrative.v2.isolateT.replay")}
                    </button>
                )}
            </div>
        </>
    );
});

export interface IsolateTProps {
    accent?: "bigram";
}

export const IsolateT = memo(function IsolateT({ accent = "bigram" }: IsolateTProps) {
    void accent;
    const { t } = useI18n();
    const reduce = useMemo(
        () =>
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        [],
    );

    const [pi, setPi] = useState(0);

    return (
        <div className="bw-it" style={{ fontFamily: SERIF }}>
            <p className="bw-it__label">{t("bigramNarrative.v2.isolateT.label")}</p>

            <div className="bw-it__tabs" role="tablist">
                {PHRASES.map((_, i) => (
                    <button
                        key={i}
                        type="button"
                        role="tab"
                        aria-selected={i === pi}
                        className="bw-it__tab"
                        data-on={i === pi ? "1" : "0"}
                        onClick={() => setPi(i)}
                    >
                        {t("bigramNarrative.v2.isolateT.tab")} {i + 1}
                    </button>
                ))}
            </div>

            <Scanner key={pi} phrase={PHRASES[pi]} reduce={reduce} t={t} />

            <style>{`
                .bw-it { max-width: 620px; margin: 0 auto; text-align: center; }
                .bw-it__label { font-family: ${MONO}; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: var(--bigram-dim); margin: 0 0 18px; }
                .bw-it__tabs { display: inline-flex; gap: 6px; padding: 5px; border-radius: var(--bigram-r-pill); background: var(--bigram-bg-2); margin-bottom: 28px; }
                .bw-it__tab { font-family: ${MONO}; font-size: 12px; letter-spacing: .06em; color: var(--bigram-muted); background: transparent; border: 0; cursor: pointer; padding: 8px 16px; border-radius: var(--bigram-r-pill); transition: background .2s ease, color .2s ease; }
                .bw-it__tab[data-on="1"] { background: var(--bigram-accent); color: var(--bigram-on-accent); }

                .bw-it__phrase {
                    display: flex; flex-wrap: wrap; justify-content: center; align-items: baseline; gap: 7px 0;
                    font-family: ${MONO}; font-size: clamp(17px, 2.2vw, 23px); line-height: 1.55; letter-spacing: 0;
                    margin: 0 auto 28px; max-width: 540px; color: var(--bigram-dim);
                }
                .bw-it__word { display: inline-flex; align-items: baseline; white-space: nowrap; }
                .bw-it__ch {
                    border-radius: 6px; padding: 2px 1.5px; font-weight: 500;
                    transition: background .16s ease, color .16s ease, box-shadow .16s ease, font-weight .16s;
                    white-space: pre;
                }
                .bw-it__ch[data-state="past"] { color: color-mix(in oklab, var(--bigram-ink) 38%, var(--bigram-dim)); }
                .bw-it__ch[data-state="future"] { color: color-mix(in oklab, var(--bigram-dim) 52%, transparent); }
                .bw-it__ch[data-state="cur"] { color: var(--bigram-ink-2); background: color-mix(in oklab, var(--bigram-ink) 6%, transparent); }
                .bw-it__ch[data-state="t"] { color: var(--bigram-on-accent); background: var(--bigram-accent); font-weight: 700; }
                .bw-it__ch[data-state="follower"] {
                    color: var(--bigram-accent-ink); background: var(--bigram-accent-soft); font-weight: 700;
                    box-shadow: inset 0 0 0 2px color-mix(in oklab, var(--bigram-accent) 38%, transparent);
                }

                .bw-it__now {
                    display: flex; align-items: center; justify-content: center; gap: 13px; flex-wrap: wrap;
                    min-height: 26px; margin: 0 0 26px; opacity: 0; transition: opacity .25s ease;
                }
                .bw-it__now[data-show="1"] { opacity: 1; }
                .bw-it__nowlbl { font-family: ${MONO}; font-size: 10.5px; letter-spacing: .2em; text-transform: uppercase; color: var(--bigram-muted); }
                .bw-it__nowpair { font-family: ${MONO}; font-size: 22px; color: var(--bigram-dim); display: inline-flex; align-items: baseline; }
                .bw-it__nowpair b { color: var(--bigram-accent-ink); font-weight: 600; }
                .bw-it__arrow { font-size: 14px; color: var(--bigram-dim); }
                .bw-it__nowtag { font-family: ${MONO}; font-size: 12px; color: var(--bigram-dim); }
                .bw-it__nowtag[data-rep="1"] { color: var(--bigram-accent); font-weight: 600; }

                .bw-it__follabel { font-family: ${MONO}; font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--bigram-dim); margin: 0 0 14px; }
                .bw-it__rows { display: flex; flex-direction: column; gap: 9px; max-width: 390px; margin: 0 auto; min-height: 60px; }
                .bw-it__row { display: grid; grid-template-columns: 56px 1fr 30px; align-items: center; gap: 13px; }
                .bw-it__pair { font-family: ${MONO}; font-size: 15px; color: var(--bigram-ink-2); text-align: right; }
                .bw-it__pair b { color: var(--bigram-muted); }
                .bw-it__row[data-win="1"] .bw-it__pair b { color: var(--bigram-accent-bright); }
                .bw-it__track { height: 13px; border-radius: var(--bigram-r-pill); background: var(--bigram-bg-2); overflow: hidden; }
                .bw-it__fill { display: block; height: 100%; border-radius: var(--bigram-r-pill); background: color-mix(in oklab, var(--bigram-accent) 52%, transparent); }
                .bw-it__row[data-win="1"] .bw-it__fill { background: var(--bigram-accent-bright); }
                .bw-it__n { font-family: ${MONO}; font-size: 13px; color: var(--bigram-muted); text-align: left; font-variant-numeric: tabular-nums; }
                .bw-it__row[data-win="1"] .bw-it__n { color: var(--bigram-accent-ink); font-weight: 600; }

                .bw-it__verdict { font-family: ${SERIF}; font-size: clamp(17px, 2.1vw, 20px); color: var(--bigram-ink-2); margin: 26px auto 0; max-width: 36ch; min-height: 3em; opacity: 0; transition: opacity .4s ease; }
                .bw-it__verdict[data-show="1"] { opacity: 1; }

                .bw-it__controls { display: flex; flex-direction: column; align-items: center; gap: 14px; margin-top: 24px; }
                .bw-it__idlehint { font-family: ${SERIF}; font-size: clamp(15px, 1.9vw, 17px); color: var(--bigram-muted); margin: 0; max-width: 34ch; }
                .bw-it__btns { display: inline-flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
                .bw-it__btn { font-family: ${MONO}; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; font-weight: 600; padding: 11px 20px; border-radius: var(--bigram-r-pill); border: 0; cursor: pointer; color: var(--bigram-accent); background: var(--bigram-accent-soft); transition: background .2s ease, color .2s ease, transform .15s ease; }
                .bw-it__btn:hover { background: color-mix(in oklab, var(--bigram-accent) 18%, var(--bigram-accent-soft)); transform: translateY(-1px); }
                .bw-it__btn--primary { color: var(--bigram-on-accent); background: var(--bigram-accent); }
                .bw-it__btn--primary:hover { background: var(--bigram-accent-bright); }
            `}</style>
        </div>
    );
});

export default IsolateT;
