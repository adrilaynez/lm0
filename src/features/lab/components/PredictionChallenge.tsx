"use client";

import type React from "react";
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useReducedMotion } from "framer-motion";

import { useI18n } from "@/i18n/context";

/**
 * PredictionChallenge — Bigram chapter · §1 "Tú ya predices" (rework of the v10 `bw-reto`).
 *
 * Runs BEFORE the model is explained: the reader predicts the next character from instinct. ONE idea —
 * you already bet on the same letter the statistics do, because you've seen the pattern thousands of
 * times. The reward is the bridge: "the machine learns the same way."
 *
 * REWORK (blueprint §1):
 *  - Cut to FOUR calibrated rounds (was five). The new set — th→e, q→u, wh→a, in→g — is tuned for
 *    ~70% success, NOT always-right-first-try. The `wh→` round is the honest near-miss: «a» wins but
 *    «e» trails close, so a wrong guess there feels fair, not unfair. Pedagogy pillar 10
 *    (predecir → revelar → "¿lo viste venir?", pocas rondas, ni siempre ni nunca correcto).
 *  - Copy now reads from the Phase-1 keys at `bigramNarrative.v2.predictionChallenge.*`. The per-round
 *    explanations live inside the i18n `rounds[]` array; `t()` can only return strings, so each round's
 *    explanation is pulled by its indexed key path (`…rounds.<i>.explanation`) — the data (contexts,
 *    option counts, answers) stays in the component, grounded in plausible English structure.
 *  - The done screen is reframed around the BRAIN: a sage instinct-meter frames the figure as
 *    "your gut vs. the language", the four-tier headline names what just happened, and a single
 *    callback line closes the loop into "the machine learns the same way". Built only from the keys
 *    that exist in v2 (tally · figureOf · headlineTiers) — no invented copy.
 *
 * KEPT (proven v10 mechanics):
 *  - centered mono `.fragment`: context glyphs (last = `.lead`, brighter) + a boxless `·` slot above a
 *    2px underline. NO box, NO `?`. Reveal is INSTANT (snappy for a miss as for a hit).
 *  - fly-into-blank: on a correct answer the chosen glyph FLIES from its cell into the blank (portal
 *    ghost, 340ms) while the real fill already sits in place. Captured via useLayoutEffect + rect
 *    measurement (NOT layoutId — the choices unmount on reveal). Wrong answers reveal with no ghost.
 *  - single radial spark burst on the done screen (N=12, or 22 if score ≥ 3 of 4). No per-answer confetti.
 *  - keyboard: 1–4 choose, Enter advance/restart; phase-gated, attached only on-screen (IntersectionObserver).
 *
 * Token-only (`--bigram-*`) so it follows the consumer's [data-bigram-theme] scope. Fully reduced-motion
 * safe (drops fly / spark / entrance anims). Self-mountable: <PredictionChallenge /> with no props.
 */

const I18N = "bigramNarrative.v2.predictionChallenge";

type Option = { c: string; n: number };
type Round = { ctx: string[]; options: Option[]; expKey: string; answer: string };

/**
 * Round data. Contexts + answers mirror the four calibrated i18n rounds (th→e, q→u, wh→a, in→g).
 * Counts are plausible-English magnitudes (same spirit as bigramCorpora) — they drive nothing but the
 * argmax-derived `answer`, but staying honest keeps the explanations true.
 *
 *  • th → e   easy win (the)              — «e» dominates.
 *  • q  → u   near-certain rule           — «u» almost always.
 *  • wh → a   the honest coin-flip        — «a» wins, «e» trails CLOSE (what/when/where). The round
 *                                            that makes ~70%, not 100%, feel earned.
 *  • in → g   strong but not obvious      — «g» (ing) leads «s»/«t».
 */
const RAW_ROUNDS: Omit<Round, "answer">[] = [
    {
        ctx: ["t", "h"],
        options: [{ c: "e", n: 472 }, { c: "a", n: 138 }, { c: "i", n: 96 }, { c: "o", n: 72 }],
        expKey: `${I18N}.rounds.0.explanation`,
    },
    {
        ctx: ["q"],
        options: [{ c: "u", n: 388 }, { c: "i", n: 11 }, { c: "a", n: 8 }, { c: "e", n: 6 }],
        expKey: `${I18N}.rounds.1.explanation`,
    },
    {
        ctx: ["w", "h"],
        options: [{ c: "a", n: 214 }, { c: "e", n: 196 }, { c: "i", n: 142 }, { c: "o", n: 88 }],
        expKey: `${I18N}.rounds.2.explanation`,
    },
    {
        ctx: ["i", "n"],
        options: [{ c: "g", n: 318 }, { c: "s", n: 187 }, { c: "t", n: 121 }, { c: "e", n: 64 }],
        expKey: `${I18N}.rounds.3.explanation`,
    },
];

const ROUNDS: Round[] = RAW_ROUNDS.map((r) => ({
    ...r,
    answer: r.options.reduce((a, b) => (b.n > a.n ? b : a)).c,
}));

const TOTAL = ROUNDS.length;

const MONO = "var(--font-jetbrains-mono)";
const SERIF = "var(--font-source-serif)";
const DISP = "var(--font-playfair)";
const EASE = "cubic-bezier(.22, .8, .26, 1)";
const FLY_EASE = "cubic-bezier(.16,1,.3,1)";

/** "␣" for a literal space, else the char itself (v10 dispR) */
function dispR(c: string): string {
    return c === " " ? "␣" : c;
}

type Phase = "choosing" | "revealed" | "done";

type FlyState = { glyph: string; from: DOMRect } | null;

type Spark = { id: number; left: number; dx: number; dy: number; delay: number };

export const PredictionChallenge = memo(function PredictionChallenge() {
    const { t } = useI18n();
    const reduce = useReducedMotion();

    const [idx, setIdx] = useState(0);
    const [phase, setPhase] = useState<Phase>("choosing");
    const [picked, setPicked] = useState<string | null>(null);
    const [landed, setLanded] = useState(false);
    const [score, setScore] = useState(0);
    /** bumped on advance/restart → drives the choreographed entrance (slow-in) only on a fresh round */
    const [fresh, setFresh] = useState(true);
    const [sparks, setSparks] = useState<Spark[]>([]);

    const round = ROUNDS[idx];
    const correct = picked === round.answer;

    const rootRef = useRef<HTMLDivElement>(null);
    const blankRef = useRef<HTMLSpanElement>(null);

    // ── fly-into-blank: the chosen glyph's rect is captured at click time (before re-render) and
    //    stashed in a ref; after the synchronous re-render the layout effect measures the blank and
    //    animates a portal ghost into it. A ref (not state) avoids a cascading render.
    const pendingFlyRef = useRef<FlyState>(null);

    const commit = useCallback(
        (choice: string, fromRect: DOMRect | null) => {
            if (phase !== "choosing") return;
            const isCorrect = choice === round.answer;
            // floritura: only correct + non-reduced-motion, and only if we captured a source rect
            if (isCorrect && !reduce && fromRect) {
                pendingFlyRef.current = { glyph: dispR(choice), from: fromRect };
            }
            setPicked(choice);
            setLanded(true);
            setPhase("revealed");
            setFresh(false);
            if (isCorrect) setScore((s) => s + 1);
        },
        [phase, round.answer, reduce],
    );

    /** click handler grabs the glyph's rect synchronously, BEFORE React re-renders the cell away */
    const onCellClick = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>, choice: string) => {
            const isCorrect = choice === round.answer;
            let fromRect: DOMRect | null = null;
            if (isCorrect && !reduce) {
                const g = e.currentTarget.querySelector(".bw-reto-glyph");
                if (g) fromRect = g.getBoundingClientRect();
            }
            commit(choice, fromRect);
        },
        [round.answer, reduce, commit],
    );

    // after a correct reveal, measure the now-rendered blank and launch the ghost flight.
    // Keyed on the reveal (idx + landed) so it runs exactly once per landed round; reads/clears the ref.
    useLayoutEffect(() => {
        const fly = pendingFlyRef.current;
        if (!fly) return;
        pendingFlyRef.current = null;
        const blank = blankRef.current;
        if (!blank) return;
        const b = blank.getBoundingClientRect();
        const toSize = (b.height || 56) * 0.92;
        const dx = fly.from.left + fly.from.width / 2 - (b.left + b.width / 2);
        const dy = fly.from.top + fly.from.height / 2 - (b.top + b.height / 2);
        const s0 = Math.max(0.4, (fly.from.height || 42) / toSize);

        const ghost = document.createElement("span");
        ghost.className = "bw-reto-fly";
        ghost.textContent = fly.glyph;
        ghost.style.left = `${b.left + b.width / 2}px`;
        ghost.style.top = `${b.top + b.height / 2}px`;
        ghost.style.fontSize = `${toSize}px`;
        ghost.style.color = "var(--bigram-accent)";
        document.body.appendChild(ghost);
        const anim = ghost.animate(
            [
                {
                    transform: `translate(-50%,-50%) translate(${dx}px,${dy}px) scale(${s0.toFixed(2)})`,
                    opacity: 0.5,
                },
                { opacity: 1, offset: 0.3 },
                { transform: "translate(-50%,-50%) translate(0,0) scale(1)", opacity: 0 },
            ],
            { duration: 340, easing: FLY_EASE },
        );
        anim.onfinish = () => ghost.remove();
        return () => {
            ghost.remove();
        };
    }, [idx, landed]);

    // single finale spark burst — generated in the event handler that enters the done screen
    // (not in an effect), so it fires exactly once and stays render-pure. N = 12, or 22 on a strong run.
    const makeSparks = useCallback(
        (finalScore: number): Spark[] => {
            if (reduce) return [];
            const N = finalScore >= TOTAL - 1 ? 22 : 12;
            return Array.from({ length: N }, (_, i) => {
                const ang = Math.random() * Math.PI * 2;
                const dist = 70 + Math.random() * 150;
                return {
                    id: i,
                    left: 50 + (Math.random() - 0.5) * 30,
                    dx: Math.cos(ang) * dist,
                    dy: Math.sin(ang) * dist - 40,
                    delay: Math.random() * 0.28,
                };
            });
        },
        [reduce],
    );

    const advance = useCallback(() => {
        if (phase !== "revealed") return;
        if (idx < TOTAL - 1) {
            setIdx((i) => i + 1);
            setPicked(null);
            setLanded(false);
            setPhase("choosing");
            setFresh(true);
        } else {
            setSparks(makeSparks(score));
            setPhase("done");
        }
    }, [phase, idx, score, makeSparks]);

    const restart = useCallback(() => {
        setIdx(0);
        setPicked(null);
        setLanded(false);
        setScore(0);
        setSparks([]);
        setPhase("choosing");
        setFresh(true);
    }, []);

    // keyboard: 1–4 choose, Enter advance/restart (no Space) — only while on-screen, phase-gated
    useEffect(() => {
        const node = rootRef.current;
        if (!node || !("IntersectionObserver" in window)) return;

        let listening = false;
        const onKey = (e: KeyboardEvent) => {
            if (phase === "choosing") {
                const k = parseInt(e.key, 10);
                if (k >= 1 && k <= round.options.length) {
                    // synthesize the source rect from the keyed cell so the fly still works
                    const cells = node.querySelectorAll<HTMLElement>(".bw-reto-cell .bw-reto-glyph");
                    const g = cells[k - 1] ?? null;
                    const fromRect =
                        g && round.options[k - 1].c === round.answer && !reduce
                            ? g.getBoundingClientRect()
                            : null;
                    commit(round.options[k - 1].c, fromRect);
                    e.preventDefault();
                }
            } else if (phase === "revealed") {
                if (e.key === "Enter") {
                    advance();
                    e.preventDefault();
                }
            } else if (phase === "done") {
                if (e.key === "Enter") {
                    restart();
                    e.preventDefault();
                }
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
            { threshold: 0.4 },
        );
        io.observe(node);
        return () => {
            io.disconnect();
            if (listening) window.removeEventListener("keydown", onKey);
        };
    }, [phase, round.options, round.answer, reduce, commit, advance, restart]);

    return (
        <div ref={rootRef} className="bw-reto">
            {phase === "done" ? <DoneScreen score={score} sparks={sparks} t={t} onRestart={restart} /> : (
                <>
                    {/* progreso (score hidden until done) */}
                    <div className="bw-reto__meta">
                        <div className="bw-reto__dots">
                            {ROUNDS.map((_, i) => (
                                <i
                                    key={i}
                                    className={i < idx ? "done" : i === idx ? "current" : undefined}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="bw-reto__play">
                        <p className="bw-reto__prompt">{t(`${I18N}.prompt`)}</p>

                        {/* fragmento — el par completándose */}
                        <div className="fragment" aria-hidden>
                            <span className="ctx-run">
                                {round.ctx.map((c, i) => (
                                    <span
                                        key={`${idx}-ctx-${i}`}
                                        className={
                                            "ch" +
                                            (fresh && !reduce ? " ch-in" : "") +
                                            (i === round.ctx.length - 1 ? " lead" : "")
                                        }
                                        style={fresh && !reduce ? { animationDelay: `${40 * i}ms` } : undefined}
                                    >
                                        {dispR(c)}
                                    </span>
                                ))}
                            </span>
                            <span
                                ref={blankRef}
                                className={"blank" + (landed ? (correct ? " lit" : " miss") : "")}
                            >
                                {phase === "choosing" || !landed ? (
                                    <span className="slot">·</span>
                                ) : (
                                    <span className={"fill" + (reduce ? "" : " fill-in") + (correct ? "" : " miss")}>
                                        {dispR(correct ? (picked as string) : round.answer)}
                                    </span>
                                )}
                            </span>
                        </div>

                        {phase === "choosing" && (
                            <div className="choices">
                                {round.options.map((opt, i) => (
                                    <button
                                        key={opt.c}
                                        type="button"
                                        className={"bw-reto-cell cell" + (fresh && !reduce ? " tile-in" : "")}
                                        style={fresh && !reduce ? { animationDelay: `${50 + i * 55}ms` } : undefined}
                                        aria-label={`${i + 1}: ${opt.c === " " ? "␣" : opt.c}`}
                                        onClick={(e) => onCellClick(e, opt.c)}
                                    >
                                        <span className="key">{i + 1}</span>
                                        <span className="bw-reto-glyph glyph">{dispR(opt.c)}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {phase === "revealed" && (
                            <>
                                <div className={"feedback" + (reduce ? "" : " fb-in")} role="status">
                                    <p className={"fb-label " + (correct ? "ok" : "no")}>
                                        {correct
                                            ? t(`${I18N}.okLabel`)
                                            : t(`${I18N}.almostLabel`, { answer: dispR(round.answer) })}
                                    </p>
                                    <p className="fb-exp">{t(round.expKey)}</p>
                                </div>
                                <div className="nav">
                                    <button
                                        type="button"
                                        className={"advance" + (reduce ? "" : " one-in")}
                                        onClick={advance}
                                    >
                                        {idx === TOTAL - 1
                                            ? t(`${I18N}.resultLabel`)
                                            : t(`${I18N}.advanceLabel`)}{" "}
                                        <span className="ar">→</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}

            <style>{`
                .bw-reto {
                    --ease-reto: ${EASE};
                    position: relative;
                }

                .bw-reto__meta {
                    display: flex; align-items: center; justify-content: center; gap: 16px;
                    margin-bottom: clamp(20px, 4vw, 34px);
                }
                .bw-reto__dots { display: flex; align-items: center; gap: 8px; }
                .bw-reto__dots i {
                    display: block; height: 6px; width: 6px; border-radius: 999px;
                    background: color-mix(in oklab, var(--bigram-ink) 18%, transparent);
                    transition: width .5s var(--ease-reto), background .4s var(--ease-reto);
                }
                .bw-reto__dots i.done { background: var(--bigram-accent-2); }
                .bw-reto__dots i.current { width: 26px; background: var(--bigram-accent); }

                .bw-reto__prompt {
                    font-family: ${MONO}; font-size: 11px; letter-spacing: .24em;
                    text-transform: uppercase; color: var(--bigram-dim);
                    text-align: center; margin: 0 0 clamp(16px, 4vw, 28px);
                }

                .bw-reto .fragment {
                    display: flex; align-items: baseline; justify-content: center;
                    gap: clamp(6px, 1.6vw, 14px);
                    font-family: ${MONO}; font-size: clamp(40px, 8vw, 68px);
                    font-weight: 500; line-height: 1; margin: 0 0 clamp(18px, 3.2vw, 30px);
                }
                .bw-reto .fragment .ch { color: var(--bigram-ink-2); }
                .bw-reto .ctx-run { display: contents; }
                .bw-reto .fragment .ch.lead { color: var(--bigram-ink); }
                .bw-reto .blank {
                    position: relative; min-width: .62em;
                    display: inline-grid; place-items: center; padding-bottom: .06em;
                }
                .bw-reto .blank::after {
                    content: ""; position: absolute; left: 6%; right: 6%; bottom: 0;
                    height: 2px; border-radius: 2px; background: var(--bigram-dim);
                    transition: background .4s var(--ease-reto);
                }
                .bw-reto .blank.lit::after { background: var(--bigram-accent); }
                .bw-reto .blank.miss::after { background: var(--bigram-wrong); }
                .bw-reto .blank .slot { color: var(--bigram-dim); font-weight: 400; }
                .bw-reto .blank .fill { color: var(--bigram-accent); font-weight: 500; }
                .bw-reto .blank .fill.miss { color: var(--bigram-wrong); }

                .bw-reto .choices { display: grid; grid-template-columns: repeat(4, 1fr); gap: clamp(10px, 2vw, 16px); }
                @media (max-width: 520px) { .bw-reto .choices { grid-template-columns: repeat(2, 1fr); } }
                .bw-reto .cell {
                    position: relative; display: flex; align-items: center; justify-content: center;
                    padding: clamp(14px, 3vw, 24px) 8px; border-radius: var(--bigram-r-sm);
                    background: transparent; border: 0; cursor: pointer;
                    transition: transform .2s var(--ease-reto);
                }
                .bw-reto button.cell:hover { transform: translateY(-2px); }
                .bw-reto .cell .glyph {
                    font-family: ${MONO}; font-size: clamp(28px, 5.6vw, 40px);
                    font-weight: 500; line-height: 1; color: var(--bigram-ink);
                    transition: color .2s var(--ease-reto);
                }
                .bw-reto button.cell:hover .glyph { color: var(--bigram-accent); }
                .bw-reto .cell .key {
                    position: absolute; top: 2px; left: 50%; transform: translateX(-50%);
                    font-family: ${MONO}; font-size: 11px; font-weight: 500; color: var(--bigram-dim);
                    transition: color .2s var(--ease-reto);
                }
                .bw-reto button.cell:hover .key { color: var(--bigram-accent); }
                .bw-reto button.cell:focus-visible { outline: 0; box-shadow: 0 0 0 2px var(--bigram-accent); }

                .bw-reto .feedback { margin-top: clamp(16px, 3vw, 26px); text-align: center; }
                .bw-reto .fb-label {
                    font-family: ${MONO}; font-size: 11.5px; letter-spacing: .12em; font-weight: 600;
                    display: inline-flex; align-items: center; gap: 8px; margin: 0 0 12px;
                }
                .bw-reto .fb-label.ok { color: var(--bigram-accent); }
                .bw-reto .fb-label.no { color: var(--bigram-wrong); }
                .bw-reto .fb-exp {
                    font-family: ${SERIF}; font-size: clamp(16px, 2vw, 19px); line-height: 1.6;
                    color: var(--bigram-ink-2); max-width: 34em; margin: 0 auto; text-wrap: pretty;
                }

                .bw-reto .nav { display: flex; justify-content: center; margin-top: clamp(18px, 3.4vw, 30px); }
                .bw-reto .advance {
                    font-family: ${MONO}; font-size: 12px; letter-spacing: .16em;
                    text-transform: uppercase; font-weight: 500; color: var(--bigram-accent);
                    display: inline-flex; align-items: center; gap: 10px;
                    padding: 11px 26px; border-radius: 999px;
                    border: 1px solid color-mix(in oklab, var(--bigram-accent) 36%, var(--bigram-rule));
                    background: transparent; cursor: pointer;
                    transition: background .22s var(--ease-reto), border-color .22s var(--ease-reto), gap .2s var(--ease-reto);
                }
                .bw-reto .advance:hover { background: var(--bigram-accent-soft); border-color: var(--bigram-accent); gap: 15px; }
                .bw-reto .advance:focus-visible { outline: none; border-color: var(--bigram-accent); box-shadow: 0 0 0 3px var(--bigram-accent-soft); }
                .bw-reto .advance .ar { font-size: 1.1em; line-height: 1; transition: transform .2s var(--ease-reto); }
                .bw-reto .advance:hover .ar { transform: translateX(4px); }

                .bw-reto-fly {
                    position: fixed; z-index: 90; pointer-events: none;
                    font-family: ${MONO}; font-weight: 500; line-height: 1;
                    transform: translate(-50%, -50%); will-change: transform, opacity;
                }

                /* ─── done screen · brain frame ─── */
                .bw-reto__end { text-align: center; padding: clamp(12px, 4vw, 28px) 0; position: relative; }
                .bw-reto__end .tally {
                    font-family: ${MONO}; font-size: 11px; letter-spacing: .24em; text-transform: uppercase;
                    color: var(--bigram-dim); margin: 0 0 clamp(14px, 3vw, 22px);
                    display: inline-flex; align-items: center; gap: 9px;
                }
                .bw-reto__end .tally .brain {
                    width: 15px; height: 15px; color: var(--bigram-sage);
                }
                .bw-reto__end .figure {
                    font-family: ${DISP}; font-weight: 500; line-height: .92;
                    font-size: clamp(58px, 13vw, 108px); color: var(--bigram-ink); margin: 0; letter-spacing: -.01em;
                }
                .bw-reto__end .figure b { color: var(--bigram-accent); font-weight: 600; }
                .bw-reto__end .figure .of { color: var(--bigram-dim); font-style: italic; font-size: .4em; font-weight: 400; }

                /* instinct meter — a calm sage gauge that frames the score as "gut vs. language" */
                .bw-reto__end .meter {
                    width: min(280px, 70%); height: 4px; border-radius: 999px; margin: clamp(16px, 3.4vw, 24px) auto 0;
                    background: color-mix(in oklab, var(--bigram-ink) 12%, transparent); overflow: hidden;
                }
                .bw-reto__end .meter > i {
                    display: block; height: 100%; border-radius: 999px; background: var(--bigram-sage);
                    width: var(--fill, 0%); transform-origin: left center;
                }
                .bw-reto__end .meter.meter-in > i { animation: bwRetoMeter .9s var(--ease-reto) both; }

                .bw-reto__end .headline {
                    font-family: ${DISP}; font-weight: 500; font-style: italic;
                    font-size: clamp(24px, 4vw, 38px); line-height: 1.14; color: var(--bigram-ink);
                    margin: clamp(20px, 4vw, 30px) auto clamp(14px, 3vw, 20px); max-width: 16em; text-wrap: balance;
                }
                .bw-reto__end .headline em { color: var(--bigram-accent); font-style: normal; }
                .bw-reto__end .again {
                    font-family: ${MONO}; font-size: 12px; letter-spacing: .14em; text-transform: uppercase;
                    color: var(--bigram-muted); display: inline-flex; align-items: center; gap: 9px;
                    padding: 12px 18px; border-radius: var(--bigram-r-sm); border: 1px solid var(--bigram-rule-2);
                    background: transparent; cursor: pointer;
                    transition: color .2s, border-color .2s, background .2s;
                }
                .bw-reto__end .again:hover { color: var(--bigram-accent); border-color: var(--bigram-accent); background: var(--bigram-accent-soft); }

                .bw-reto-spark { position: absolute; inset: 0; z-index: 40; pointer-events: none; overflow: visible; }
                .bw-reto-spark span {
                    position: absolute; width: 5px; height: 5px; border-radius: 999px; background: var(--bigram-accent);
                    animation: bwRetoSpark 1.1s var(--ease-reto) forwards;
                }
                @keyframes bwRetoSpark {
                    from { transform: translateY(0) scale(1); opacity: .9; }
                    to   { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
                }

                @keyframes bwRetoChIn   { from { opacity: 0; filter: blur(6px); transform: translateY(8px); } to { opacity: 1; filter: blur(0); transform: none; } }
                @keyframes bwRetoFillIn { from { opacity: 0; transform: scale(.7); } to { opacity: 1; transform: none; } }
                @keyframes bwRetoTileIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
                @keyframes bwRetoFbIn   { from { opacity: 0; transform: translateY(12px); filter: blur(8px); } to { opacity: 1; transform: none; filter: blur(0); } }
                @keyframes bwRetoOneIn  { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
                @keyframes bwRetoEndIn  { from { opacity: 0; transform: translateY(16px); filter: blur(8px); } to { opacity: 1; transform: none; filter: blur(0); } }
                @keyframes bwRetoMeter  { from { transform: scaleX(0); } to { transform: scaleX(1); } }
                .bw-reto .ch-in   { animation: bwRetoChIn .5s var(--ease-reto) both; }
                .bw-reto .fill-in { animation: bwRetoFillIn .34s var(--ease-reto) both; }
                .bw-reto .tile-in { animation: bwRetoTileIn .46s var(--ease-reto) both; }
                .bw-reto .fb-in   { animation: bwRetoFbIn .6s var(--ease-reto) both; }
                .bw-reto .one-in  { animation: bwRetoOneIn .4s var(--ease-reto) both; }
                .bw-reto__end.end-in { animation: bwRetoEndIn .62s var(--ease-reto) both; }

                @media (prefers-reduced-motion: reduce) {
                    .bw-reto-spark, .bw-reto-fly { display: none !important; }
                    .bw-reto .ch-in, .bw-reto .fill-in, .bw-reto .tile-in,
                    .bw-reto .fb-in, .bw-reto .one-in, .bw-reto__end.end-in,
                    .bw-reto__end .meter.meter-in > i { animation: none !important; }
                }
            `}</style>
        </div>
    );
});

/* ─── done screen · the brain frame ─── */
function DoneScreen({
    score,
    sparks,
    t,
    onRestart,
}: {
    score: number;
    sparks: Spark[];
    t: (key: string, params?: Record<string, string | number>) => string;
    onRestart: () => void;
}) {
    const reduce = useReducedMotion();
    const headKey =
        score === TOTAL
            ? "perfect"
            : score >= TOTAL - 1
              ? "close"
              : score >= TOTAL / 2
                ? "half"
                : "low";
    const headline = t(`${I18N}.headlineTiers.${headKey}`);
    const fillPct = useMemo(() => `${Math.round((score / TOTAL) * 100)}%`, [score]);

    return (
        <div className={"bw-reto__end" + (reduce ? "" : " end-in")}>
            {/* tally with a small brain glyph — frames the figure as "your instinct, not your knowledge" */}
            <p className="tally">
                <svg className="brain" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                        d="M9 4.5A2.6 2.6 0 0 0 6.4 7c-1.3.2-2.4 1.3-2.4 2.7 0 .6.2 1.1.5 1.6-.6.5-1 1.2-1 2 0 1 .6 1.9 1.5 2.3 0 1.6 1.3 2.9 2.9 2.9.7 0 1.3-.2 1.8-.6V4.9c-.5-.3-1.1-.4-1.7-.4ZM15 4.5A2.6 2.6 0 0 1 17.6 7c1.3.2 2.4 1.3 2.4 2.7 0 .6-.2 1.1-.5 1.6.6.5 1 1.2 1 2 0 1-.6 1.9-1.5 2.3 0 1.6-1.3 2.9-2.9 2.9-.7 0-1.3-.2-1.8-.6V4.9c.5-.3 1.1-.4 1.7-.4Z"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinejoin="round"
                    />
                    <path d="M12 4.4v15.2" stroke="currentColor" strokeWidth="1.3" />
                </svg>
                {t(`${I18N}.tally`)}
            </p>

            <p className="figure">
                <b>{score}</b>{" "}
                <span className="of">{t(`${I18N}.figureOf`)}</span> {TOTAL}
            </p>

            {/* instinct meter — sage gauge, how close your gut tracked the language */}
            <div
                className={"meter" + (reduce ? "" : " meter-in")}
                aria-hidden
                style={{ "--fill": fillPct } as React.CSSProperties}
            >
                <i style={{ width: fillPct }} />
            </div>

            <h3 className="headline" dangerouslySetInnerHTML={{ __html: headline }} />

            <button type="button" className="again" onClick={onRestart}>
                {t(`${I18N}.restart`)}
            </button>

            {!reduce && sparks.length > 0 && (
                <div className="bw-reto-spark" aria-hidden>
                    {sparks.map((p) => (
                        <span
                            key={p.id}
                            style={
                                {
                                    left: `${p.left}%`,
                                    top: "30%",
                                    "--dx": `${p.dx.toFixed(1)}px`,
                                    "--dy": `${p.dy.toFixed(1)}px`,
                                    animationDelay: `${p.delay.toFixed(2)}s`,
                                } as React.CSSProperties
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
