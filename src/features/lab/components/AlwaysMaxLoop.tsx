"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";

import { motion, useReducedMotion } from "framer-motion";

import { dchar, T_INDEX, topFollowers } from "@/features/lab/data/bigramShakespeare27";
import { useI18n } from "@/i18n/context";

/**
 * AlwaysMaxLoop (VIS 6) — choosing the next letter after «t», the boring way: always take the biggest face.
 *
 * ONE idea — ALL about the «t». Same percentages as the die, drawn as ONE horizontal bar split into
 * proportional segments (h 36%, space 29%, o 10%…). If the machine always grabs the BIGGEST segment, then
 * after «t» it always writes «h». Every time. No surprise, no variety — h · h · h · h… That dead
 * certainty is exactly why the next widget reaches for a (loaded) die.
 *
 * Token-only, self-mounting, reduced-motion aware. A timer streams the picks (no setState in an effect).
 */

const MONO = "var(--bigram-font-mono)";
const SERIF = "var(--bigram-font-serif)";
const STD: [number, number, number, number] = [0.2, 0.8, 0.2, 1];

const TOP = topFollowers(T_INDEX, 8); // {idx, count, prob}[]
const MAXP = TOP[0].prob;
const MAX_IDX = TOP[0].idx; // «h»
const SUM_TOP = TOP.reduce((a, f) => a + f.prob, 0);
const REST = Math.max(0, 1 - SUM_TOP);

interface Seg {
    idx: number;
    prob: number;
    isRest: boolean;
    center: number;
}
const SEGS: Seg[] = (() => {
    const arr: Seg[] = [];
    let acc = 0;
    for (const f of TOP) {
        arr.push({ idx: f.idx, prob: f.prob, isRest: false, center: acc + f.prob / 2 });
        acc += f.prob;
    }
    if (REST > 0.002) arr.push({ idx: -1, prob: REST, isRest: true, center: acc + REST / 2 });
    return arr;
})();
const MAX_CENTER = SEGS[0].center; // «h» — the biggest, always-picked face

function segColor(s: Seg): string {
    if (s.isRest) return "color-mix(in oklab, var(--bigram-accent) 16%, var(--bigram-bg-2))";
    const k = Math.round(34 + (s.prob / MAXP) * 66);
    return `color-mix(in oklab, var(--bigram-accent-bright) ${k}%, var(--bigram-bg-2))`;
}

const PICKS = 9;
const STEP_MS = 300;

type Phase = "idle" | "run" | "done";

export interface AlwaysMaxLoopProps {
    accent?: "bigram";
}

export const AlwaysMaxLoop = memo(function AlwaysMaxLoop({ accent = "bigram" }: AlwaysMaxLoopProps) {
    void accent;
    const { t } = useI18n();
    const reduce = useReducedMotion();

    const [phase, setPhase] = useState<Phase>("idle");
    const [picks, setPicks] = useState(0);
    const [pulse, setPulse] = useState(false);

    const picksRef = useRef(0);
    const toRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tickRef = useRef<() => void>(() => {});

    const clear = useCallback(() => {
        if (toRef.current) clearTimeout(toRef.current);
        toRef.current = null;
    }, []);

    const tick = useCallback(() => {
        const next = picksRef.current + 1;
        picksRef.current = next;
        setPicks(next);
        setPulse(true);
        toRef.current = setTimeout(() => setPulse(false), 150);
        if (next >= PICKS) {
            toRef.current = setTimeout(() => setPhase("done"), STEP_MS);
            return;
        }
        toRef.current = setTimeout(() => tickRef.current(), STEP_MS);
    }, []);

    useEffect(() => {
        tickRef.current = tick;
    }, [tick]);

    const play = useCallback(() => {
        clear();
        picksRef.current = 0;
        setPicks(0);
        setPulse(false);
        if (reduce) {
            picksRef.current = PICKS;
            setPicks(PICKS);
            setPhase("done");
            return;
        }
        setPhase("run");
        toRef.current = setTimeout(() => tickRef.current(), 260);
    }, [clear, reduce]);

    useEffect(() => clear, [clear]);

    const started = phase !== "idle";
    const done = phase === "done";
    const pointerOn = started;

    return (
        <div className="bw-amx" style={{ fontFamily: SERIF }}>
            <p className="bw-amx__label">{t("bigramNarrative.v2.alwaysMaxLoop.label")}</p>
            <p className="bw-amx__intro">{t("bigramNarrative.v2.alwaysMaxLoop.caption")}</p>

            {/* ── The «t» faces as one proportional bar; the biggest (h) is the one it always grabs ── */}
            <div className="bw-amx__dicewrap">
                <div className="bw-amx__pointerlane" aria-hidden>
                    <motion.span
                        className="bw-amx__pointer"
                        data-on={pointerOn ? "1" : "0"}
                        animate={{ left: `${MAX_CENTER * 100}%` }}
                        transition={{ duration: 0.4, ease: STD }}
                    />
                </div>

                <div className="bw-amx__bar">
                    {SEGS.map((s) => {
                        const isMax = !s.isRest && s.idx === MAX_IDX;
                        const wide = s.prob > 0.07;
                        return (
                            <div
                                key={s.isRest ? "rest" : s.idx}
                                className="bw-amx__seg"
                                data-max={isMax ? "1" : "0"}
                                data-pulse={isMax && pulse ? "1" : "0"}
                                data-rest={s.isRest ? "1" : "0"}
                                style={{ flexGrow: s.prob, background: segColor(s) }}
                                title={
                                    s.isRest
                                        ? `${(s.prob * 100).toFixed(0)}%`
                                        : `t → ${dchar(s.idx)} · ${(s.prob * 100).toFixed(1)}%`
                                }
                            >
                                {wide && (
                                    <span className="bw-amx__segface">
                                        <b>{dchar(s.idx)}</b>
                                        <i>{(s.prob * 100).toFixed(0)}%</i>
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="bw-amx__readout">
                    <span className="bw-amx__reads" data-on={started ? "1" : "0"}>
                        t&nbsp;→&nbsp;<b>{dchar(MAX_IDX)}</b>
                    </span>
                </div>
            </div>

            {/* ── What it picks after «t», over and over: always «h» ── */}
            <div className="bw-amx__pickrow" data-show={started ? "1" : "0"}>
                <span className="bw-amx__picklbl">{t("bigramNarrative.v2.alwaysMaxLoop.pickLabel")}</span>
                <div className="bw-amx__chips">
                    {Array.from({ length: picks }).map((_, i) => (
                        <motion.span
                            key={i}
                            className="bw-amx__chip"
                            initial={reduce ? false : { opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.18, ease: STD }}
                        >
                            {dchar(MAX_IDX)}
                        </motion.span>
                    ))}
                    {started && !done && <span className="bw-amx__caret" aria-hidden />}
                </div>
            </div>

            {/* ── Controls / verdict ── */}
            <div className="bw-amx__foot">
                {!done ? (
                    <button
                        type="button"
                        className="bw-amx__play"
                        onClick={play}
                        disabled={phase === "run"}
                    >
                        <span className="bw-amx__dot" aria-hidden />
                        {t("bigramNarrative.v2.alwaysMaxLoop.play")}
                    </button>
                ) : (
                    <motion.div
                        className="bw-amx__done"
                        initial={reduce ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                    >
                        <p className="bw-amx__result">{t("bigramNarrative.v2.alwaysMaxLoop.result")}</p>
                        <button type="button" className="bw-amx__restart" onClick={play}>
                            ↻ {t("bigramNarrative.v2.alwaysMaxLoop.restart")}
                        </button>
                    </motion.div>
                )}
            </div>

            <style>{`
                .bw-amx { display: flex; flex-direction: column; align-items: center; text-align: center; max-width: 600px; margin: 0 auto; width: 100%; }
                .bw-amx__label { font-family: ${MONO}; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: var(--bigram-dim); margin: 0 0 16px; }
                .bw-amx__intro { font-family: ${SERIF}; font-style: italic; font-size: clamp(15px, 1.9vw, 17px); color: var(--bigram-muted); margin: 0 auto 30px; max-width: 36ch; line-height: 1.5; }

                .bw-amx__dicewrap { width: 100%; max-width: 540px; margin: 0 auto; }
                .bw-amx__pointerlane { position: relative; height: 16px; margin-bottom: 4px; }
                .bw-amx__pointer { position: absolute; top: 0; width: 0; height: 0; margin-left: -7px; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 9px solid var(--bigram-accent-ink); opacity: 0; transition: opacity .2s ease; }
                .bw-amx__pointer[data-on="1"] { opacity: 1; }

                .bw-amx__bar { position: relative; display: flex; width: 100%; height: 60px; gap: 2px; border-radius: var(--bigram-r-md); overflow: hidden; background: var(--bigram-bg-2); box-shadow: inset 0 1px 6px color-mix(in oklab, var(--bigram-ink) 14%, transparent); }
                .bw-amx__seg { position: relative; min-width: 0; height: 100%; display: flex; align-items: center; justify-content: center; flex-basis: 0; transition: filter .15s ease, box-shadow .2s ease; overflow: hidden; }
                .bw-amx__seg[data-max="1"] { box-shadow: inset 0 0 0 2.5px var(--bigram-accent-ink); z-index: 2; }
                .bw-amx__seg[data-pulse="1"] { filter: brightness(1.18); }
                .bw-amx__segface { display: inline-flex; flex-direction: column; align-items: center; line-height: 1.05; pointer-events: none; }
                .bw-amx__segface b { font-family: ${MONO}; font-size: 17px; font-weight: 700; color: var(--bigram-on-accent); }
                .bw-amx__segface i { font-family: ${MONO}; font-style: normal; font-size: 10px; color: color-mix(in oklab, var(--bigram-on-accent) 78%, transparent); margin-top: 2px; }

                .bw-amx__readout { min-height: 30px; margin-top: 14px; display: flex; align-items: center; justify-content: center; }
                .bw-amx__reads { font-family: ${MONO}; font-size: 18px; color: var(--bigram-dim); opacity: 0; transition: opacity .25s ease; }
                .bw-amx__reads[data-on="1"] { opacity: 1; }
                .bw-amx__reads b { color: var(--bigram-accent-bright); font-weight: 700; }

                .bw-amx__pickrow { width: 100%; max-width: 460px; margin: 22px auto 0; min-height: 56px; opacity: 0; transition: opacity .3s ease; }
                .bw-amx__pickrow[data-show="1"] { opacity: 1; }
                .bw-amx__picklbl { display: block; font-family: ${MONO}; font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--bigram-dim); margin: 0 0 11px; }
                .bw-amx__chips { display: inline-flex; align-items: center; gap: 7px; flex-wrap: wrap; justify-content: center; min-height: 30px; }
                .bw-amx__chip {
                    display: inline-flex; align-items: center; justify-content: center; min-width: 28px; height: 30px; padding: 0 7px;
                    font-family: ${MONO}; font-size: 16px; font-weight: 700; border-radius: var(--bigram-r-sm);
                    color: var(--bigram-on-accent); background: var(--bigram-accent);
                }
                .bw-amx__caret { width: 3px; height: 22px; border-radius: 2px; background: var(--bigram-accent); animation: bwAmxBlink 1.05s step-end infinite; }
                @keyframes bwAmxBlink { 0%, 55% { opacity: 1; } 56%, 100% { opacity: 0; } }

                .bw-amx__foot { min-height: 84px; margin-top: 24px; display: flex; align-items: flex-start; justify-content: center; }
                .bw-amx__play {
                    font-family: ${MONO}; font-size: 13px; letter-spacing: .1em; text-transform: uppercase; font-weight: 600;
                    display: inline-flex; align-items: center; gap: 11px; cursor: pointer;
                    padding: 13px 28px; border-radius: var(--bigram-r-pill); color: var(--bigram-on-accent);
                    background: var(--bigram-accent); border: 0; transition: transform .15s ease, background .2s ease, opacity .2s ease;
                }
                .bw-amx__play:hover:not(:disabled) { background: var(--bigram-accent-bright); transform: translateY(-1px); }
                .bw-amx__play:disabled { opacity: .55; cursor: default; }
                .bw-amx__dot { width: 8px; height: 8px; border-radius: 999px; background: var(--bigram-on-accent); }
                .bw-amx__done { display: flex; flex-direction: column; align-items: center; gap: 12px; }
                .bw-amx__result { font-family: ${SERIF}; font-size: clamp(16px, 2.1vw, 20px); color: var(--bigram-ink); margin: 0; max-width: 38ch; line-height: 1.45; }
                .bw-amx__restart { font-family: ${MONO}; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: var(--bigram-accent); background: transparent; border: 0; cursor: pointer; padding: 6px; }
                .bw-amx__restart:hover { color: var(--bigram-accent-bright); }

                @media (max-width: 520px) {
                    .bw-amx__bar { height: 52px; }
                    .bw-amx__segface b { font-size: 15px; }
                }
            `}</style>
        </div>
    );
});

export default AlwaysMaxLoop;
