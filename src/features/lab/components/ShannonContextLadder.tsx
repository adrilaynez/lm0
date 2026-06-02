"use client";

import type React from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { HonestBar } from "@/features/lab/components/bigram/HonestBar";
import { displayChar } from "@/features/lab/components/bigram/kit";
import { Verdict } from "@/features/lab/components/bigram/Verdict";
import { useI18n } from "@/i18n/context";

/**
 * ShannonContextLadder — the bridge to the n-gram (Bigram chapter, §6 · editorial-green).
 *
 * ONE concept, FELT not told: *more context = sharper prediction.* A single tricky word is revealed one
 * letter at a time. After every prefix the reader must guess the NEXT letter BEFORE it is shown — and the
 * point is that with little context you genuinely CANNOT, while with almost the whole word it is forced.
 *
 * The word is «cupido». Why it works (the gate "a guess game must be HARD"): nothing forces the answer
 * early.
 *   c…    → blind: ca, co, cu, ce, ci… all live.   (the model's own top guess is NOT «u»)
 *   cu…   → still wide: cua, cue, cui, cum, cup, cur, cul…
 *   cup…  → the TRAP: «cupo / cupón» make «o» the natural call — so the reader likely MISSES, picking «o»
 *           when the word turns to «i». This is where you live the failure of little context.
 *   cupi… → it tightens: «d» pulls clearly ahead.
 *   cupid → forced: «o» is all but certain. Now you nail it.
 *
 * So the reader feels the arc the chapter is selling: fog → certainty as the window grows. The honest
 * distribution below the word physically narrows round by round (flat fog → one dominant bar), and a slim
 * "certainty" rail climbs with it. The blank reveals the TRUE next letter; a hit = the reader matched it,
 * so early misses are expected and late hits are earned. The closing sage Verdict names the bigram's
 * ceiling (it only ever sees ONE letter — round 1, forever) and opens the next model.
 *
 * Distributions are AUTHORED / illustrative — we have no n-gram counts locally — but plausible and, above
 * all, clearly NARROWING. That narrowing IS the honest teaching point; we never claim real frequencies.
 *
 * Built from the kit: HonestBar (fixed honest axis — partial fills show doubt), Verdict (sage close),
 * displayChar (␣), --bigram-* tokens only (gated by the consumer's [data-bigram-theme]). Predict-before-
 * reveal (narrative pillar 10/11). Reduced-motion safe (drops staging; settles to the final certain state
 * at once). No baked-in eyebrow/lead — the narrative body frames it; only functional text lives here.
 * Self-mounting (no required props), memo, "use client". No synchronous setState in any effect body.
 */

/* ─── Per-round DATA (numbers + option set; all COPY lives in i18n) ──────────────────────────────────
 *
 * Each round = the prefix already shown, the candidate tiles the reader chooses from, the TRUE next
 * letter of the word, and the honest authored distribution (probabilities 0..1 on HonestBar's fixed
 * axis). The arc is deliberate and the numbers are illustrative:
 *
 *   R1 (see "c")     fog — six candidates within ~9pts; top «a», answer «u». You cannot call it.
 *   R2 (see "cu")    still wide — «e» edges ahead, answer «p» mid-pack. A real coin-flip.
 *   R3 (see "cup")   the TRAP — «o» (cupo/cupón) leads, answer «i». Most readers miss here.
 *   R4 (see "cupi")  tightening — «d» pulls clearly ahead (answer «d»). You start to feel it.
 *   R5 (see "cupid") forced — «o» near-certain (answer «o»). You nail it.
 *
 * `prefix` / `answer` come from i18n too (rounds.N.prefix / .answer) so copy stays single-sourced; these
 * arrays supply the option set and the bar numbers. The bar list is sorted desc (index 0 = model's top
 * pick) — distinct from `answer`, which is the WORD's true letter (they disagree early, agree at the end).
 */
type RoundData = {
    /** candidate letters offered as tiles (authored so the round is honestly ambiguous early) */
    options: string[];
    /** honest authored distribution shown on reveal — [char, p] pairs, sorted desc, p on HonestBar's axis */
    dist: { char: string; p: number }[];
};

const ROUNDS: RoundData[] = [
    {
        // see "c" — a wide-open fog; the model's best is «a», but the word turns to «u».
        options: ["a", "o", "u", "e"],
        dist: [
            { char: "a", p: 0.21 },
            { char: "o", p: 0.19 },
            { char: "u", p: 0.16 },
            { char: "e", p: 0.14 },
            { char: "i", p: 0.12 },
            { char: "r", p: 0.1 },
        ],
    },
    {
        // see "cu" — still open; «e» (cuento/cuerpo) edges ahead, «p» is just one of many.
        options: ["e", "a", "p", "r"],
        dist: [
            { char: "e", p: 0.24 },
            { char: "a", p: 0.21 },
            { char: "r", p: 0.16 },
            { char: "p", p: 0.14 },
            { char: "m", p: 0.1 },
            { char: "l", p: 0.08 },
        ],
    },
    {
        // see "cup" — THE TRAP: «o» (cupo, cupón) is the natural call; the word goes to «i».
        options: ["o", "i", "a", "ó"],
        dist: [
            { char: "o", p: 0.38 },
            { char: "ó", p: 0.27 },
            { char: "i", p: 0.18 },
            { char: "a", p: 0.09 },
            { char: "e", p: 0.05 },
        ],
    },
    {
        // see "cupi" — it tightens: «d» pulls clearly ahead (cupido), only a few rivals.
        options: ["d", "e", "l", "t"],
        dist: [
            { char: "d", p: 0.68 },
            { char: "e", p: 0.14 },
            { char: "l", p: 0.07 },
            { char: "t", p: 0.05 },
        ],
    },
    {
        // see "cupid" — forced: «o» is all but certain. Now you nail it.
        options: ["o", "a", "e", "i"],
        dist: [
            { char: "o", p: 0.94 },
            { char: "a", p: 0.03 },
            { char: "e", p: 0.02 },
        ],
    },
];

const TOTAL = ROUNDS.length;

const MONO = "var(--bigram-font-mono)";
const SERIF = "var(--bigram-font-serif)";
const DISP = "var(--bigram-font-display)";
const EASE = [0.2, 0.8, 0.2, 1] as const;
const SPRING = { type: "spring", stiffness: 480, damping: 40 } as const;

type Phase = "choosing" | "revealed" | "done";

/* ─── Component ───────────────────────────────────────────────────────────────────────────────────── */
export const ShannonContextLadder = memo(function ShannonContextLadder({
    accent = "bigram",
}: {
    /** accent scope — only "bigram" is supported; present so the widget reads <… accent="bigram" />. */
    accent?: "bigram";
}) {
    void accent; // single-accent widget; the prop exists for call-site symmetry with the chapter.

    const { t } = useI18n();
    const reduce = useReducedMotion();

    const [idx, setIdx] = useState(0);
    const [phase, setPhase] = useState<Phase>("choosing");
    const [picked, setPicked] = useState<string | null>(null);
    /** rounds whose TRUE next letter the reader matched — drives the "Aciertos" tally. */
    const [hits, setHits] = useState(0);
    /** true only on a freshly-entered round → stages the entrance / letter-add animation once. */
    const [fresh, setFresh] = useState(true);

    const rootRef = useRef<HTMLDivElement>(null);

    const round = ROUNDS[idx];
    const prefix = t(`bigramNarrative.v2.shannonLadder.rounds.${idx}.prefix`);
    const answer = t(`bigramNarrative.v2.shannonLadder.rounds.${idx}.answer`);
    const hint = t(`bigramNarrative.v2.shannonLadder.rounds.${idx}.hint`);

    /** the WORD's true next letter — what we score against (a hit is matching THIS, not the model's top). */
    const correct = picked === answer;
    /** the model's own top pick (argmax of the honest dist) → drives the certainty rail. */
    const top = round.dist[0];
    const topPct = Math.round(top.p * 100);

    const prefixChars = useMemo(() => Array.from(prefix), [prefix]);

    const commit = useCallback(
        (choice: string) => {
            if (phase !== "choosing") return;
            const trueAnswer = t(`bigramNarrative.v2.shannonLadder.rounds.${idx}.answer`);
            setPicked(choice);
            setPhase("revealed");
            setFresh(false);
            if (choice === trueAnswer) setHits((h) => h + 1);
        },
        [phase, idx, t],
    );

    const advance = useCallback(() => {
        if (phase !== "revealed") return;
        if (idx < TOTAL - 1) {
            setIdx((i) => i + 1);
            setPicked(null);
            setPhase("choosing");
            setFresh(true);
        } else {
            setPhase("done");
        }
    }, [phase, idx]);

    const restart = useCallback(() => {
        setIdx(0);
        setPicked(null);
        setHits(0);
        setPhase("choosing");
        setFresh(true);
    }, []);

    // keyboard: 1–N to choose, Enter to advance / restart — only while the widget is on-screen.
    useEffect(() => {
        const node = rootRef.current;
        if (!node || !("IntersectionObserver" in window)) return;

        let listening = false;
        const onKey = (e: KeyboardEvent) => {
            if (phase === "choosing") {
                const k = parseInt(e.key, 10);
                if (k >= 1 && k <= ROUNDS[idx].options.length) {
                    commit(ROUNDS[idx].options[k - 1]);
                    e.preventDefault();
                }
            } else if (e.key === "Enter") {
                if (phase === "revealed") advance();
                else restart();
                e.preventDefault();
            }
        };
        const io = new IntersectionObserver(
            (ents) => {
                ents.forEach((en) => {
                    if (en.isIntersecting && !listening) {
                        window.addEventListener("keydown", onKey);
                        listening = true;
                    } else if (!en.isIntersecting && listening) {
                        window.removeEventListener("keydown", onKey);
                        listening = false;
                    }
                });
            },
            { threshold: 0.35 },
        );
        io.observe(node);
        return () => {
            io.disconnect();
            if (listening) window.removeEventListener("keydown", onKey);
        };
    }, [phase, idx, commit, advance, restart]);

    return (
        <div ref={rootRef} className="bw-ladder" style={{ maxWidth: 600, margin: "0 auto" }}>
            <AnimatePresence mode="wait">
                {phase === "done" ? (
                    <DoneScreen key="done" hits={hits} t={t} reduce={reduce} onRestart={restart} />
                ) : (
                    <motion.div
                        key="play"
                        initial={reduce ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={reduce ? undefined : { opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* meta — round counter + a certainty rail that climbs as the window grows */}
                        <div className="bw-ladder__meta">
                            <span className="bw-ladder__round">
                                {t("bigramNarrative.v2.shannonLadder.roundLabel", {
                                    n: idx + 1,
                                    total: TOTAL,
                                })}
                            </span>
                            <CertaintyRail
                                pct={topPct}
                                revealed={phase === "revealed"}
                                reduce={reduce}
                                label={t("bigramNarrative.v2.shannonLadder.certaintyLabel")}
                            />
                        </div>

                        {/* the word so far — every shown letter under one accent band; widens each round */}
                        <PrefixWindow
                            chars={prefixChars}
                            picked={picked}
                            answer={answer}
                            correct={correct}
                            phase={phase}
                            fresh={fresh}
                            reduce={reduce}
                        />

                        {/* choosing — candidate tiles (predict before reveal) */}
                        {phase === "choosing" && (
                            <div className="bw-ladder__choices">
                                {round.options.map((opt, i) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        className={"bw-ladder-cell" + (fresh && !reduce ? " tile-in" : "")}
                                        style={
                                            fresh && !reduce
                                                ? { animationDelay: `${60 + i * 55}ms` }
                                                : undefined
                                        }
                                        aria-label={`${i + 1}: ${opt === " " ? "space" : opt}`}
                                        onClick={() => commit(opt)}
                                    >
                                        <span className="key">{i + 1}</span>
                                        <span className="glyph">{displayChar(opt)}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* revealed — the honest distribution (narrower each round) + the hint */}
                        {phase === "revealed" && (
                            <motion.div
                                initial={reduce ? false : { opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, ease: EASE }}
                            >
                                <div className="bw-ladder__bars">
                                    {round.dist.map((d, i) => (
                                        <HonestBar
                                            key={`${idx}-${d.char}`}
                                            src={prefixChars[prefixChars.length - 1] ?? prefix}
                                            dst={d.char}
                                            value={d.p}
                                            top={i === 0}
                                            glint={i === 0}
                                            countUp={i === 0}
                                            delay={reduce ? 0 : i * 0.05}
                                        />
                                    ))}
                                </div>

                                <p className={"bw-ladder__hint" + (reduce ? "" : " hint-in")}>{hint}</p>

                                <div className="bw-ladder__nav">
                                    <button type="button" className="advance" onClick={advance}>
                                        {idx < TOTAL - 1
                                            ? t("bigramNarrative.v2.shannonLadder.nextLetter")
                                            : t("bigramNarrative.v2.shannonLadder.seeWord")}{" "}
                                        <span className="ar">→</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .bw-ladder { position: relative; }

                .bw-ladder__meta {
                    display: flex; align-items: center; justify-content: space-between;
                    gap: 16px; margin-bottom: clamp(22px, 4.5vw, 34px);
                }
                .bw-ladder__round {
                    font-family: ${MONO}; font-size: 11px; letter-spacing: .22em;
                    text-transform: uppercase; color: var(--bigram-dim); white-space: nowrap;
                }

                /* ── the word so far — chars under one accent band that widens each round, then the blank ── */
                .bw-ladder__window {
                    display: flex; flex-direction: column; align-items: center;
                    margin: 0 0 clamp(26px, 4.5vw, 38px);
                }
                .bw-ladder__strip {
                    position: relative; display: inline-flex; align-items: center;
                    gap: clamp(2px, 1vw, 6px); padding: 10px 12px;
                }
                /* the window box — hugs only the shown letters, widens as more appear */
                .bw-ladder__ctxbox {
                    position: relative; display: inline-flex; align-items: baseline;
                    gap: clamp(1px, .6vw, 4px); padding: 8px clamp(10px, 2.4vw, 16px);
                }
                .bw-ladder__band {
                    position: absolute; inset: 0; z-index: 0;
                    border-radius: var(--bigram-r-sm);
                    background: var(--bigram-accent-soft);
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--bigram-accent) 30%, transparent);
                }
                .bw-ladder__char {
                    position: relative; z-index: 1;
                    font-family: ${MONO}; font-size: clamp(36px, 7.5vw, 58px); font-weight: 600;
                    line-height: 1; color: var(--bigram-accent-ink);
                    padding: 0 2px;
                }
                /* the blank — the slot being predicted, boxless, accent underline (lit / miss on reveal) */
                .bw-ladder__blank {
                    position: relative; z-index: 1; min-width: .62em; margin-left: 2px;
                    display: inline-grid; place-items: center; padding-bottom: .08em;
                    font-family: ${MONO}; font-size: clamp(36px, 7.5vw, 58px); font-weight: 600; line-height: 1;
                }
                .bw-ladder__blank::after {
                    content: ""; position: absolute; left: 8%; right: 8%; bottom: 0;
                    height: 3px; border-radius: 3px; background: var(--bigram-dim);
                    transition: background .4s ${easeStr(EASE)};
                }
                .bw-ladder__blank.lit::after { background: var(--bigram-accent); }
                .bw-ladder__blank.miss::after { background: var(--bigram-wrong); }
                .bw-ladder__blank .slot { color: var(--bigram-dim); font-weight: 400; }
                .bw-ladder__blank .fill { color: var(--bigram-accent); }
                .bw-ladder__blank .fill.miss { color: var(--bigram-wrong); }
                /* the reader's wrong guess, struck through above the true letter (only on a miss) */
                .bw-ladder__missnote {
                    position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
                    margin-bottom: 6px; white-space: nowrap;
                    font-family: ${MONO}; font-size: 13px; font-weight: 500;
                    color: var(--bigram-wrong); text-decoration: line-through;
                    text-decoration-thickness: 1.5px;
                }

                /* ── candidate tiles ── */
                .bw-ladder__choices {
                    display: grid; grid-template-columns: repeat(4, 1fr); gap: clamp(10px, 2vw, 16px);
                }
                @media (max-width: 520px) { .bw-ladder__choices { grid-template-columns: repeat(2, 1fr); } }
                .bw-ladder-cell {
                    position: relative; display: flex; align-items: center; justify-content: center;
                    padding: clamp(14px, 3vw, 22px) 8px; border-radius: var(--bigram-r-sm);
                    background: transparent; border: 0; cursor: pointer;
                    transition: transform .2s ${easeStr(EASE)};
                }
                .bw-ladder button.bw-ladder-cell:hover { transform: translateY(-2px); }
                .bw-ladder-cell .glyph {
                    font-family: ${MONO}; font-size: clamp(26px, 5.4vw, 38px); font-weight: 500;
                    line-height: 1; color: var(--bigram-ink); transition: color .2s ${easeStr(EASE)};
                }
                .bw-ladder button.bw-ladder-cell:hover .glyph { color: var(--bigram-accent); }
                .bw-ladder-cell .key {
                    position: absolute; top: 2px; left: 50%; transform: translateX(-50%);
                    font-family: ${MONO}; font-size: 11px; font-weight: 500; color: var(--bigram-dim);
                    transition: color .2s ${easeStr(EASE)};
                }
                .bw-ladder button.bw-ladder-cell:hover .key { color: var(--bigram-accent); }
                .bw-ladder-cell:focus-visible { outline: 0; box-shadow: 0 0 0 2px var(--bigram-accent); }

                /* ── revealed block ── */
                .bw-ladder__bars { margin: 0 0 clamp(16px, 3vw, 22px); }
                .bw-ladder__hint {
                    font-family: ${SERIF}; font-size: clamp(16px, 2vw, 18px); line-height: 1.6;
                    color: var(--bigram-ink-2); max-width: 34em; margin: 0 auto;
                    text-align: center; text-wrap: pretty;
                }

                .bw-ladder__nav { display: flex; justify-content: center; margin-top: clamp(20px, 3.4vw, 30px); }
                .bw-ladder .advance {
                    font-family: ${MONO}; font-size: 12px; letter-spacing: .16em;
                    text-transform: uppercase; font-weight: 500; color: var(--bigram-accent);
                    display: inline-flex; align-items: center; gap: 10px;
                    padding: 11px 26px; border-radius: 999px;
                    border: 1px solid color-mix(in oklab, var(--bigram-accent) 36%, var(--bigram-rule));
                    background: transparent; cursor: pointer;
                    transition: background .22s ${easeStr(EASE)}, border-color .22s ${easeStr(EASE)}, gap .2s ${easeStr(EASE)};
                }
                .bw-ladder .advance:hover { background: var(--bigram-accent-soft); border-color: var(--bigram-accent); gap: 15px; }
                .bw-ladder .advance:focus-visible { outline: none; border-color: var(--bigram-accent); box-shadow: 0 0 0 3px var(--bigram-accent-soft); }
                .bw-ladder .advance .ar { font-size: 1.1em; line-height: 1; transition: transform .2s ${easeStr(EASE)}; }
                .bw-ladder .advance:hover .ar { transform: translateX(4px); }

                /* ── certainty rail ── */
                .bw-ladder__rail { display: inline-flex; align-items: center; gap: 9px; }
                .bw-ladder__raillabel {
                    font-family: ${MONO}; font-size: 10px; letter-spacing: .14em; text-transform: uppercase;
                    color: var(--bigram-dim);
                }
                .bw-ladder__railtrack {
                    position: relative; width: clamp(72px, 18vw, 120px); height: 6px; border-radius: 999px;
                    overflow: hidden; background: color-mix(in oklab, var(--bigram-ink) 10%, transparent);
                }
                .bw-ladder__railfill {
                    position: absolute; inset: 0 auto 0 0; height: 100%; border-radius: 999px;
                    background: var(--bigram-accent-2);
                }
                .bw-ladder__railpct {
                    font-family: ${MONO}; font-size: 11px; font-weight: 600; color: var(--bigram-muted);
                    font-variant-numeric: tabular-nums; min-width: 34px; text-align: right;
                }

                /* ── done screen ── */
                .bw-ladder__end { text-align: center; padding: clamp(8px, 3vw, 20px) 0; }
                .bw-ladder__end .tally {
                    font-family: ${MONO}; font-size: 11px; letter-spacing: .24em; text-transform: uppercase;
                    color: var(--bigram-dim); margin: 0 0 clamp(14px, 4vw, 22px);
                }
                .bw-ladder__end .word {
                    font-family: ${MONO}; font-weight: 600; line-height: 1;
                    font-size: clamp(40px, 9vw, 72px); margin: 0 0 clamp(20px, 4vw, 30px);
                    display: inline-flex; gap: clamp(2px, 1vw, 6px); color: var(--bigram-ink);
                }
                .bw-ladder__end .word b { color: var(--bigram-accent); font-weight: 600; }

                @keyframes bwLadderTileIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
                @keyframes bwLadderHintIn { from { opacity: 0; transform: translateY(8px); filter: blur(6px); } to { opacity: 1; transform: none; filter: blur(0); } }
                @keyframes bwLadderEndIn  { from { opacity: 0; transform: translateY(16px); filter: blur(8px); } to { opacity: 1; transform: none; filter: blur(0); } }
                .bw-ladder .tile-in { animation: bwLadderTileIn .46s ${easeStr(EASE)} both; }
                .bw-ladder .hint-in { animation: bwLadderHintIn .5s ${easeStr(EASE)} both; }
                .bw-ladder__end.end-in { animation: bwLadderEndIn .6s ${easeStr(EASE)} both; }

                @media (prefers-reduced-motion: reduce) {
                    .bw-ladder .tile-in, .bw-ladder .hint-in, .bw-ladder__end.end-in { animation: none !important; }
                }
            `}</style>
        </div>
    );
});

/* ─── Prefix window: the word so far under one accent band that widens, then the predicted blank ───────
 *
 * The band is sized by Framer's layout system so that as letters are added each round the band physically
 * WIDENS (spring). After the last shown letter sits the blank — the slot the reader is predicting —
 * boxless, accent underline that turns lit/miss. On a miss the reader's wrong guess shows struck through
 * above the true letter, so the failure is legible.
 */
const PrefixWindow = memo(function PrefixWindow({
    chars,
    picked,
    answer,
    correct,
    phase,
    fresh,
    reduce,
}: {
    chars: string[];
    picked: string | null;
    answer: string;
    correct: boolean;
    phase: Phase;
    fresh: boolean;
    reduce: boolean | null;
}) {
    const landed = phase === "revealed";
    const blankClass = "bw-ladder__blank" + (landed ? (correct ? " lit" : " miss") : "");

    return (
        <div className="bw-ladder__window">
            <div className="bw-ladder__strip">
                {/* the window — an accent box that hugs ONLY the shown letters and WIDENS each round */}
                <motion.div
                    className="bw-ladder__ctxbox"
                    layout={!reduce}
                    transition={reduce ? { duration: 0 } : SPRING}
                >
                    <span aria-hidden className="bw-ladder__band" />
                    <AnimatePresence initial={false}>
                        {chars.map((c, i) => (
                            <motion.span
                                key={`${i}-${c}`}
                                className="bw-ladder__char"
                                layout={!reduce}
                                initial={
                                    fresh && !reduce && i === chars.length - 1
                                        ? { opacity: 0, scale: 0.6 }
                                        : false
                                }
                                animate={{ opacity: 1, scale: 1 }}
                                transition={reduce ? { duration: 0 } : SPRING}
                            >
                                {displayChar(c)}
                            </motion.span>
                        ))}
                    </AnimatePresence>
                </motion.div>

                <span className={blankClass} aria-live="polite">
                    {!landed ? (
                        <span className="slot">·</span>
                    ) : (
                        <>
                            {!correct && picked && (
                                <span className="bw-ladder__missnote" aria-hidden>
                                    {displayChar(picked)}
                                </span>
                            )}
                            <span className="fill">{displayChar(answer)}</span>
                        </>
                    )}
                </span>
            </div>
        </div>
    );
});

/* ─── Certainty rail: the model's top probability climbing as the window widens ───────────────────────
 *
 * Idle (choosing) it sits at 0; we only fill once the answer is shown, so it animates UP as a reward and
 * the climb across rounds visualises "more context → sharper". The width maps the top pct directly.
 */
const CertaintyRail = memo(function CertaintyRail({
    pct,
    revealed,
    reduce,
    label,
}: {
    pct: number;
    revealed: boolean;
    reduce: boolean | null;
    label: string;
}) {
    const w = revealed ? pct : 0;
    return (
        <span className="bw-ladder__rail">
            <span className="bw-ladder__raillabel">{label}</span>
            <span className="bw-ladder__railtrack">
                <motion.span
                    className="bw-ladder__railfill"
                    initial={false}
                    animate={{ width: `${w}%` }}
                    transition={reduce ? { duration: 0 } : { duration: 0.6, ease: EASE }}
                />
            </span>
            <span className="bw-ladder__railpct">{revealed ? `${pct}%` : "—"}</span>
        </span>
    );
});

/* ─── Done screen: spell the word, name the limit, open the n-gram ────────────────────────────────────
 *
 * Spells out «cupido» (the payoff of the five rounds), shows the reader's tally, and lands the sage
 * Verdict that names the bigram's ceiling and points at the next model — exactly the §6 → n-gram bridge.
 */
function DoneScreen({
    hits,
    t,
    reduce,
    onRestart,
}: {
    hits: number;
    t: (key: string, params?: Record<string, string | number>) => string;
    reduce: boolean | null;
    onRestart: () => void;
}) {
    const word = t("bigramNarrative.v2.shannonLadder.word");
    const letters = Array.from(word);
    return (
        <motion.div
            className={"bw-ladder__end" + (reduce ? "" : " end-in")}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
        >
            <p className="tally">
                {t("bigramNarrative.v2.shannonLadder.progressLabel")} · {hits} / {TOTAL}
            </p>

            {/* the word resolves */}
            <p className="word" aria-label={word}>
                {letters.map((c, i) => (
                    <span key={i}>{displayChar(c)}</span>
                ))}
            </p>

            <Verdict
                label={t("bigramNarrative.v2.shannonLadder.verdictLabel")}
                main={t("bigramNarrative.v2.shannonLadder.verdict")}
                sub=""
            />

            <div style={{ marginTop: "clamp(22px, 4vw, 30px)" }}>
                <button
                    type="button"
                    onClick={onRestart}
                    style={{
                        fontFamily: MONO,
                        fontSize: 12,
                        letterSpacing: ".14em",
                        textTransform: "uppercase",
                        color: "var(--bigram-muted)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 9,
                        padding: "12px 18px",
                        borderRadius: "var(--bigram-r-sm)",
                        border: "1px solid var(--bigram-rule-2)",
                        background: "transparent",
                        cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--bigram-accent)";
                        e.currentTarget.style.borderColor = "var(--bigram-accent)";
                        e.currentTarget.style.background = "var(--bigram-accent-soft)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--bigram-muted)";
                        e.currentTarget.style.borderColor = "var(--bigram-rule-2)";
                        e.currentTarget.style.background = "transparent";
                    }}
                >
                    {t("bigramNarrative.v2.shannonLadder.again")}{" "}
                    <span style={{ fontFamily: DISP }}>↺</span>
                </button>
            </div>
        </motion.div>
    );
}

/** Serialize a cubic-bezier easing tuple for inline CSS transition strings. */
function easeStr(e: readonly number[]): string {
    return `cubic-bezier(${e[0]}, ${e[1]}, ${e[2]}, ${e[3]})`;
}
