"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { dchar, MATRIX_27_COUNTS, rowTotal, T_INDEX } from "@/features/lab/data/bigramShakespeare27";
import { useI18n } from "@/i18n/context";

/**
 * LoadedDie (VIS 7) — you roll it. Choosing the next letter after «t», the good way: a loaded die.
 *
 * ONE idea — ALL about the «t». The «t» percentages are laid out as ONE horizontal bar, in order, each
 * face sized by its % so they form a 0→100 scale: «h» owns 0–36, the space 36–65, «o» 65–75… The die
 * rolls a NUMBER from 0 to 100; wherever it lands, you keep the letter whose stretch covers it. Because
 * «h» covers the most ground, the number falls on «h» most of the time — but not always. That visible,
 * honest weighting is the whole point: usually «h», sometimes a surprise, never a robotic loop.
 *
 * Token-only, self-mounting, reduced-motion aware. Manual: one roll per press, slow enough to watch.
 */

const MONO = "var(--bigram-font-mono)";
const SERIF = "var(--bigram-font-serif)";
const STD: [number, number, number, number] = [0.2, 0.8, 0.2, 1];

const TOTAL = rowTotal(T_INDEX);
const TOPN = 8;

interface Item {
    idx: number;
    prob: number;
    start: number; // cumulative left edge, 0..1
}
/** Every present follower of «t», biggest first, with cumulative ranges (the 0→1 number line). */
const FULL: Item[] = (() => {
    const arr = MATRIX_27_COUNTS[T_INDEX]
        .map((count, idx) => ({ idx, prob: count / TOTAL }))
        .filter((x) => x.prob > 0)
        .sort((a, b) => b.prob - a.prob);
    let acc = 0;
    return arr.map((f) => {
        const it = { idx: f.idx, prob: f.prob, start: acc };
        acc += f.prob;
        return it;
    });
})();
const MAXP = FULL[0].prob;

interface Seg extends Item {
    isRest: boolean;
}
/** The displayed bar: the top-N faces, then one "rest" slab for the long tail of rare letters. */
const SEGS: Seg[] = (() => {
    const top = FULL.slice(0, TOPN).map((f) => ({ ...f, isRest: false }));
    const restStart = FULL[TOPN] ? FULL[TOPN].start : 1;
    const rest = 1 - restStart;
    if (rest > 0.002) top.push({ idx: -1, prob: rest, start: restStart, isRest: true });
    return top;
})();

/** Map a roll r∈[0,1) to its letter and to the displayed segment it lights. */
function landFor(r: number): { letter: number; seg: number } {
    let rank = FULL.findIndex((f) => r >= f.start && r < f.start + f.prob);
    if (rank < 0) rank = FULL.length - 1;
    const letter = FULL[rank].idx;
    const seg = rank < TOPN ? rank : SEGS.length - 1;
    return { letter, seg };
}

function segColor(s: Seg): string {
    if (s.isRest) return "color-mix(in oklab, var(--bigram-accent) 16%, var(--bigram-bg-2))";
    const k = Math.round(34 + (s.prob / MAXP) * 66);
    return `color-mix(in oklab, var(--bigram-accent-bright) ${k}%, var(--bigram-bg-2))`;
}

const ENOUGH = 7;
const SPIN_STEPS = 18; // how many numbers flash before settling
const SPIN_MIN = 45;
const SPIN_MAX = 200;

type Phase = "ready" | "rolling" | "landed";

export interface LoadedDieProps {
    accent?: "bigram";
}

export const LoadedDie = memo(function LoadedDie({ accent = "bigram" }: LoadedDieProps) {
    void accent;
    const { t } = useI18n();
    const reduce = useReducedMotion();

    const [phase, setPhase] = useState<Phase>("ready");
    const [num, setNum] = useState(-1); // the die number 0..99 shown right now
    const [landSeg, setLandSeg] = useState(-1);
    const [landLetter, setLandLetter] = useState(-1);
    const [out, setOut] = useState<number[]>([]);

    const toRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clear = useCallback(() => {
        if (toRef.current) clearTimeout(toRef.current);
        toRef.current = null;
    }, []);

    const roll = useCallback(() => {
        if (phase === "rolling") return;
        const finalN = Math.floor(Math.random() * 100); // the die: a number 0..99
        const r = (finalN + 0.5) / 100;
        const { letter, seg } = landFor(r);
        setLandSeg(-1);
        setLandLetter(-1);

        const settle = () => {
            setNum(finalN);
            setLandSeg(seg);
            setLandLetter(letter);
            setOut((o) => [...o, letter]);
            setPhase("landed");
        };

        if (reduce) {
            settle();
            return;
        }

        setPhase("rolling");
        let k = 0;
        const step = () => {
            if (k >= SPIN_STEPS) {
                settle();
                return;
            }
            // flash random numbers while rolling; the last few ease toward the real one
            const p = k / SPIN_STEPS;
            setNum(p > 0.7 ? Math.round(finalN + (Math.random() - 0.5) * 18 * (1 - p)) : Math.floor(Math.random() * 100));
            k += 1;
            toRef.current = setTimeout(step, SPIN_MIN + (SPIN_MAX - SPIN_MIN) * (p * p));
        };
        step();
    }, [phase, reduce]);

    const reset = useCallback(() => {
        clear();
        setPhase("ready");
        setNum(-1);
        setLandSeg(-1);
        setLandLetter(-1);
        setOut([]);
    }, [clear]);

    useEffect(() => clear, [clear]);

    const rolling = phase === "rolling";
    const showLand = phase === "landed";
    const flagPos = num >= 0 ? num / 100 : 0.5; // 0..1 position of the die flag along the bar
    const enough = out.length >= ENOUGH;

    return (
        <div className="bw-die" style={{ fontFamily: SERIF }}>
            <p className="bw-die__label">{t("bigramNarrative.v2.loadedDie.label")}</p>
            <p className="bw-die__intro">{t("bigramNarrative.v2.loadedDie.caption")}</p>

            {/* ── THE DIE drops a number onto the bar; the segment it lands in is chosen ── */}
            <div className="bw-die__dicewrap">
                {/* the rolling number + needle, sliding to its spot on the bar */}
                <div className="bw-die__flaglane" aria-hidden>
                    <motion.div
                        className="bw-die__flag"
                        data-on={num >= 0 ? "1" : "0"}
                        animate={{ left: `${flagPos * 100}%` }}
                        transition={
                            reduce ? { duration: 0 } : { type: "spring", stiffness: 460, damping: 26 }
                        }
                    >
                        <span className="bw-die__num">{num >= 0 ? num : "·"}</span>
                        <span className="bw-die__needle" />
                    </motion.div>
                </div>

                {/* the bar: cumulative faces, each sized by its % */}
                <div className="bw-die__bar">
                    {SEGS.map((s, i) => {
                        const isLanded = i === landSeg;
                        const wide = s.prob > 0.07;
                        return (
                            <div
                                key={s.isRest ? "rest" : s.idx}
                                className="bw-die__seg"
                                data-landed={isLanded ? "1" : "0"}
                                data-rest={s.isRest ? "1" : "0"}
                                style={{ flexGrow: s.prob, background: segColor(s) }}
                                title={
                                    s.isRest
                                        ? `${(s.prob * 100).toFixed(0)}%`
                                        : `t → ${dchar(s.idx)} · ${(s.start * 100).toFixed(0)}–${((s.start + s.prob) * 100).toFixed(0)}`
                                }
                            >
                                {wide && (
                                    <span className="bw-die__segface">
                                        <b>{dchar(s.idx)}</b>
                                        <i>{(s.prob * 100).toFixed(0)}%</i>
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* the 0 → 100 scale, so the number means something */}
                <div className="bw-die__scale" aria-hidden>
                    <span>0</span>
                    <span>25</span>
                    <span>50</span>
                    <span>75</span>
                    <span>100</span>
                </div>

                {/* readout: the chosen letter */}
                <div className="bw-die__readout">
                    <AnimatePresence mode="wait">
                        {showLand && landLetter >= 0 ? (
                            <motion.span
                                key={`l${out.length}`}
                                className="bw-die__lands"
                                initial={reduce ? false : { opacity: 0, y: 3 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {t("bigramNarrative.v2.loadedDie.lands", { n: num })}&nbsp;
                                <b className="bw-die__landch" data-space={landLetter === 0 ? "1" : "0"}>
                                    {dchar(landLetter)}
                                </b>
                            </motion.span>
                        ) : (
                            <motion.span
                                key="hint"
                                className="bw-die__readhint"
                                initial={false}
                                animate={{ opacity: rolling ? 1 : 0.5 }}
                            >
                                {rolling ? t("bigramNarrative.v2.loadedDie.rolling") : "t → ?"}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── What the rolls drew after «t» — varied ── */}
            <div className="bw-die__pickrow">
                <span className="bw-die__picklbl">{t("bigramNarrative.v2.loadedDie.pickLabel")}</span>
                <div className="bw-die__chips">
                    {out.map((idx, i) => {
                        const fresh = i === out.length - 1 && showLand;
                        return (
                            <motion.span
                                key={i}
                                className="bw-die__chip"
                                data-fresh={fresh ? "1" : "0"}
                                data-space={idx === 0 ? "1" : "0"}
                                initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2, ease: STD }}
                            >
                                {dchar(idx)}
                            </motion.span>
                        );
                    })}
                    {out.length === 0 && <span className="bw-die__empty" aria-hidden>·</span>}
                </div>
            </div>

            {/* ── You roll it ── */}
            <div className="bw-die__foot">
                <button
                    type="button"
                    className="bw-die__roll"
                    onClick={roll}
                    disabled={rolling}
                    data-spinning={rolling ? "1" : "0"}
                >
                    <span className="bw-die__dot" aria-hidden />
                    {rolling
                        ? t("bigramNarrative.v2.loadedDie.rolling")
                        : out.length === 0
                          ? t("bigramNarrative.v2.loadedDie.play")
                          : t("bigramNarrative.v2.loadedDie.rollAgain")}
                </button>
                {enough && !rolling && (
                    <button type="button" className="bw-die__restart" onClick={reset}>
                        ↻ {t("bigramNarrative.v2.loadedDie.restart")}
                    </button>
                )}
            </div>

            <AnimatePresence>
                {enough && (
                    <motion.p
                        className="bw-die__result"
                        initial={reduce ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {t("bigramNarrative.v2.loadedDie.result")}
                    </motion.p>
                )}
            </AnimatePresence>

            <style>{`
                .bw-die { display: flex; flex-direction: column; align-items: center; text-align: center; max-width: 600px; margin: 0 auto; width: 100%; }
                .bw-die__label { font-family: ${MONO}; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: var(--bigram-dim); margin: 0 0 16px; }
                .bw-die__intro { font-family: ${SERIF}; font-style: italic; font-size: clamp(15px, 1.9vw, 17px); color: var(--bigram-muted); margin: 0 auto 26px; max-width: 44ch; line-height: 1.5; }

                .bw-die__dicewrap { width: 100%; max-width: 540px; margin: 0 auto; }

                /* the rolling number + needle */
                .bw-die__flaglane { position: relative; height: 52px; }
                .bw-die__flag { position: absolute; bottom: 0; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; opacity: 0; transition: opacity .2s ease; }
                .bw-die__flag[data-on="1"] { opacity: 1; }
                .bw-die__num {
                    font-family: ${MONO}; font-size: 17px; font-weight: 700; line-height: 1; min-width: 34px;
                    display: inline-flex; align-items: center; justify-content: center; padding: 6px 8px;
                    color: var(--bigram-on-accent); background: var(--bigram-accent-ink); border-radius: var(--bigram-r-sm);
                    box-shadow: 0 4px 12px -4px color-mix(in oklab, var(--bigram-ink) 50%, transparent); font-variant-numeric: tabular-nums;
                }
                .bw-die__needle { width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid var(--bigram-accent-ink); }

                /* the bar */
                .bw-die__bar { position: relative; display: flex; width: 100%; height: 60px; gap: 2px; border-radius: var(--bigram-r-md); overflow: hidden; background: var(--bigram-bg-2); box-shadow: inset 0 1px 6px color-mix(in oklab, var(--bigram-ink) 14%, transparent); }
                .bw-die__seg { position: relative; min-width: 0; height: 100%; display: flex; align-items: center; justify-content: center; flex-basis: 0; transition: filter .15s ease, box-shadow .2s ease; overflow: hidden; }
                .bw-die__seg[data-landed="1"] { box-shadow: inset 0 0 0 2.5px var(--bigram-accent-ink); filter: brightness(1.12); z-index: 2; }
                .bw-die__segface { display: inline-flex; flex-direction: column; align-items: center; line-height: 1.05; pointer-events: none; }
                .bw-die__segface b { font-family: ${MONO}; font-size: 17px; font-weight: 700; color: var(--bigram-on-accent); }
                .bw-die__segface i { font-family: ${MONO}; font-style: normal; font-size: 10px; color: color-mix(in oklab, var(--bigram-on-accent) 78%, transparent); margin-top: 2px; }

                .bw-die__scale { display: flex; justify-content: space-between; width: 100%; margin-top: 6px; font-family: ${MONO}; font-size: 10px; color: var(--bigram-dim); }

                .bw-die__readout { min-height: 32px; margin-top: 12px; display: flex; align-items: center; justify-content: center; }
                .bw-die__lands { font-family: ${MONO}; font-size: 16px; color: var(--bigram-muted); display: inline-flex; align-items: baseline; }
                .bw-die__landch { color: var(--bigram-accent-bright); font-weight: 700; font-size: 19px; }
                .bw-die__landch[data-space="1"] { color: var(--bigram-accent); }
                .bw-die__readhint { font-family: ${MONO}; font-size: 13px; letter-spacing: .14em; text-transform: uppercase; color: var(--bigram-dim); }

                /* drawn letters */
                .bw-die__pickrow { width: 100%; max-width: 460px; margin: 22px auto 0; min-height: 56px; }
                .bw-die__picklbl { display: block; font-family: ${MONO}; font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--bigram-dim); margin: 0 0 11px; }
                .bw-die__chips { display: inline-flex; align-items: center; gap: 7px; flex-wrap: wrap; justify-content: center; min-height: 30px; }
                .bw-die__chip {
                    display: inline-flex; align-items: center; justify-content: center; min-width: 28px; height: 30px; padding: 0 7px;
                    font-family: ${MONO}; font-size: 16px; font-weight: 700; border-radius: var(--bigram-r-sm);
                    color: var(--bigram-ink-2); background: var(--bigram-bg-2);
                }
                .bw-die__chip[data-space="1"] { color: var(--bigram-dim); }
                .bw-die__chip[data-fresh="1"] { color: var(--bigram-on-accent); background: var(--bigram-accent); }
                .bw-die__empty { color: var(--bigram-dim); font-family: ${MONO}; }

                /* roll */
                .bw-die__foot { display: inline-flex; align-items: center; gap: 16px; margin-top: 22px; flex-wrap: wrap; justify-content: center; }
                .bw-die__roll {
                    font-family: ${MONO}; font-size: 13px; letter-spacing: .1em; text-transform: uppercase; font-weight: 600;
                    display: inline-flex; align-items: center; gap: 11px; cursor: pointer;
                    padding: 13px 30px; border-radius: var(--bigram-r-pill); color: var(--bigram-on-accent);
                    background: var(--bigram-accent); border: 0; transition: transform .15s ease, background .2s ease, opacity .2s ease;
                }
                .bw-die__roll:hover:not(:disabled) { background: var(--bigram-accent-bright); transform: translateY(-1px); }
                .bw-die__roll:disabled { cursor: default; opacity: .6; }
                .bw-die__dot { width: 8px; height: 8px; border-radius: 999px; background: var(--bigram-on-accent); }
                .bw-die__roll[data-spinning="1"] .bw-die__dot { animation: bwDieRoll .5s linear infinite; }
                @keyframes bwDieRoll { from { transform: rotate(0); } to { transform: rotate(360deg); } }
                .bw-die__restart { font-family: ${MONO}; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: var(--bigram-accent); background: transparent; border: 0; cursor: pointer; padding: 6px; }
                .bw-die__restart:hover { color: var(--bigram-accent-bright); }

                .bw-die__result { font-family: ${SERIF}; font-size: clamp(16px, 2.1vw, 20px); color: var(--bigram-ink); margin: 22px auto 0; max-width: 42ch; line-height: 1.45; }

                @media (max-width: 520px) {
                    .bw-die__bar { height: 52px; }
                    .bw-die__segface b { font-size: 15px; }
                }
            `}</style>
        </div>
    );
});

export default LoadedDie;
