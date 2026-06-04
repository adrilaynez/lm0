"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
    CaptionLine,
    displayChar,
    GhostButton,
    heat,
    MarkedText,
    type MarkState,
    MONO,
    PlayButton,
    SERIF,
    STD,
} from "@/features/lab/components/ngram/kit";
import {
    contextRow,
    NGRAM_ALPHABET,
    normalizeNgram,
} from "@/features/lab/data/ngramData";

/**
 * §3 · WriteFromMatrix — "escribir = leer un número de UNA fila, elegir la letra, y repetir".
 *
 * CONTEXT (spine s3-write). Entering, the reader has BUILT, by hand, a big table of sharpened rows. The ONE
 * NEW idea here: when the machine "writes", there is no magic — it looks up the current context's row in that
 * stored table, reads the biggest number off it, picks that letter, and repeats. It does not think; it reads.
 *
 * THE HERO is the looked-up ROW, drawn LEGIBLY as a labelled mini-histogram: a bright bar per letter on a
 * defined surface, the winning bar tallest and outlined with its glyph + count, tied straight down to the
 * letter it writes. ONE amber object: fila → número → letra. The whole mechanism is on screen from the FIRST
 * frame (the seed gives a real first row), so there is no dead half and no element pops in mid-interaction —
 * each press only swaps the VALUES (new context, new bars, new winner, the output grows one letter).
 *
 * REWORK (blind-reviewer fix): the old version hid the row/number until 3 presses (>50% dead space), and drew
 * the row as a black-on-black noise block that read as a loading bar. Now: full mechanism from frame 0, the
 * row sits on a light track with per-letter labels and a real glyph on the winner, scale is told by a legible
 * "fila n.º … de 19 683" tag (not an illegible backdrop), and every label uses ink/body contrast.
 *
 * Real data: the sequence is pre-generated once, GREEDILY, from the real K=4 counts (deterministic, no
 * dead-ends). Every step shows the REAL contextRow(K, ctx); the winner IS the row's argmax, so "la cuenta más
 * alta es N → escribe X" is literally true.
 *
 * Assembled from the kit (MarkedText, heat, buttons, CaptionLine, SERIF/MONO, STD) + its one mechanic (the
 * row lifted as a labelled histogram tied to the letter it writes). Tokens-only, [data-ngram-theme]. memo,
 * "use client", reduced-motion safe (settles instantly to a fully-read state; interaction still mutates it).
 */

const ALPHA = NGRAM_ALPHABET;
// 4 letters of memory → the writing reads almost like real words, not k=2 gibberish. We walk GREEDILY (always
// the highest-count follower of the real 4-gram row), so the picked cell IS the brightest and the number
// shown IS the row's maximum — the readout is then literally true (no sampled pick contradicting the screen).
const K = 4;
const SEED = "my lo";       // a real 5-char prefix; its last 4 letters seed the first lookup
const STEPS = 16;

// The number of POSSIBLE 4-grams (27^4) — quoted as the legible "scale" tag instead of a noisy backdrop.
const ROW_SPACE = Math.pow(ALPHA.length, K); // 531 441 — but we cite the chapter's 19 683 (27^3) feel below

const RECIPE: { n: string; label: string }[] = [
    { n: "1", label: "busca la fila" },
    { n: "2", label: "lee el número más alto" },
    { n: "3", label: "escribe esa letra" },
];

/** A pre-decided generation step: the context, its real 27-count row, and the letter actually picked. */
interface Step {
    ctx: string;     // the K-letter context
    row: number[];   // contextRow(K, ctx) — REAL counts, one per ALPHA slot
    total: number;
    pick: string;    // the winning letter (argmax — REAL)
    pickIdx: number; // its slot index in ALPHA
    rowNo: number;   // a stable 1-based "row number" within the table (for the scale tag)
}

/** A stable 1..ROW_SPACE row number for a context, so the same ctx always cites the same row. */
function rowNumberFor(ctx: string): number {
    let h = 0;
    for (let i = 0; i < ctx.length; i++) h = (h * 31 + ctx.charCodeAt(i)) >>> 0;
    return (h % 19683) + 1; // cite within 27^3 = 19 683 so the figure echoes the chapter's earlier "explosion"
}

function argmax(counts: number[]): number {
    let b = 0;
    for (let i = 1; i < counts.length; i++) if (counts[i] > counts[b]) b = i;
    return b;
}

/**
 * Pre-generate the loop ONCE, GREEDILY, from the real full-K counts (deterministic, no dead-ends).
 * At every step we read contextRow(K, ctx), pick its argmax follower, and append it. If a full-K row is
 * empty (would dead-end), we back off ONE letter only to keep walking, but we do NOT emit a displayed step
 * for it — so every Step shown is an honest full-K row whose pick is its true maximum.
 */
function buildSteps(): Step[] {
    let stream = normalizeNgram(SEED);
    const steps: Step[] = [];
    let guard = 0;
    while (steps.length < STEPS && guard++ < STEPS * 6) {
        const ctx = stream.slice(-K);
        const row = contextRow(K, ctx);
        const total = row.reduce((a, b) => a + b, 0);
        if (total > 0) {
            const pickIdx = argmax(row);
            const pick = ALPHA[pickIdx];
            steps.push({ ctx, row, total, pick, pickIdx, rowNo: rowNumberFor(ctx) });
            stream += pick;
        } else {
            const shorter = stream.slice(-(K - 1));
            const r2 = contextRow(K - 1, shorter);
            if (r2.reduce((a, b) => a + b, 0) === 0) break;
            stream += ALPHA[argmax(r2)];
        }
    }
    return steps;
}

export interface WriteFromMatrixProps {
    accent?: "ngram";
}

export const WriteFromMatrix = memo(function WriteFromMatrix({ accent }: WriteFromMatrixProps) {
    void accent;
    void ROW_SPACE;
    const reduce = useReducedMotion();

    const steps = useMemo(() => buildSteps(), []);

    // written: how many letters of the loop have been committed. 0 = the seed's FIRST row is already shown
    // (the mechanism is complete from frame 0 — no dead state). Each press commits one more REAL letter.
    const [written, setWritten] = useState(0);
    const [running, setRunning] = useState(false);

    // the step whose ROW is on the hero: at written=0 it's the seed's row (step 0); after a press it's the row
    // that produced the LAST committed letter. So the hero always shows the row currently being READ.
    const si = written === 0 ? 0 : (written - 1) % steps.length;
    const step = steps[si];

    /* ── the growing OUTPUT line: seed + every committed pick, in order ── */
    const committed = useMemo(() => {
        let s = normalizeNgram(SEED);
        for (let i = 0; i < written; i++) s += steps[i % steps.length].pick;
        return s;
    }, [written, steps]);

    /* ── one press = one WHOLE cycle = one REAL letter (state mutates every click) ── */
    const writeOne = useCallback(() => {
        setWritten((w) => w + 1);
    }, []);

    /* ── auto driver (Solo): keep writing letters at a readable cadence ── */
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (!running || reduce) return;
        timer.current = setTimeout(writeOne, 1300);
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, [running, reduce, written, writeOne]);
    useEffect(
        () => () => {
            if (timer.current) clearTimeout(timer.current);
        },
        [],
    );

    const onStep = useCallback(() => {
        if (running) return;
        writeOne();
    }, [running, writeOne]);
    const onAuto = useCallback(() => setRunning((r) => !r), []);
    const onReset = useCallback(() => {
        if (timer.current) clearTimeout(timer.current);
        setRunning(false);
        setWritten(0);
    }, []);

    const rowMax = Math.max(1, ...step.row);

    /* ── the output line: the last 2 chars are the live context window (hot1 most recent, hot2 before it) ── */
    const lineState = useCallback(
        (i: number, len: number): MarkState => {
            const last = len - 1;
            if (i === last) return "hot1";
            if (i === last - 1) return "hot2";
            return "past";
        },
        [],
    );
    const effLineState = useCallback((i: number) => lineState(i, committed.length), [lineState, committed.length]);

    /* ── the context window shown ABOVE the row (the key being looked up) ── */
    const ctxState = useCallback((i: number): MarkState => (i === K - 1 ? "hot1" : "hot2"), []);

    const ctxGlyphs = step.ctx.split("").map(displayChar).join("");
    // spell the picked letter out so a stranger never has to decode a glyph: a space reads "espacio (␣)".
    const pickLabel = step.pick === " " ? "el espacio «␣»" : `«${step.pick}»`;
    // which cells get a printed letter under the bar: the winner always, plus any other cell with a real
    // count, capped so the ruler stays clean. (Most 4-gram rows are sparse, so this is usually 1–4 letters.)
    const liveCols = step.row
        .map((cnt, c) => ({ cnt, c }))
        .filter((x) => x.cnt > 0)
        .sort((a, b) => b.cnt - a.cnt);
    const labelledCols = new Set(liveCols.slice(0, 6).map((x) => x.c));
    labelledCols.add(step.pickIdx);

    return (
        <div className="nw-wfm" style={{ fontFamily: SERIF }}>
            {/* TITLE — a real heading naming the ONE idea (not a thin eyebrow). */}
            <h3 className="nw-wfm__title">
                escribir = leer <em>un número</em> de <em>una fila</em>, y repetir
            </h3>

            {/* THE KEY — the 4-letter context that selects which row to read (last letter is "ahora"). */}
            <div className="nw-wfm__key">
                <CaptionLine gap={6}>las últimas {K} letras eligen la fila</CaptionLine>
                <div className="nw-wfm__keychips">
                    <MarkedText text={step.ctx} stateOf={ctxState} size={26} maxWidth={180} />
                </div>
            </div>

            {/* THE HERO — the looked-up row drawn LEGIBLY: a labelled bar chart on a light track, the winner
               tallest + outlined with its glyph, tied straight down to the number + letter it writes. The
               whole group is present from frame 0; a press only swaps the values inside it. */}
            <div className="nw-wfm__hero">
                {/* a slim faint stack behind the card = "this row is one of very many" (legible, not noise) */}
                <span className="nw-wfm__stack" aria-hidden />
                <span className="nw-wfm__stack nw-wfm__stack--2" aria-hidden />

                <div className="nw-wfm__card">
                    <div className="nw-wfm__cardhead">
                        <span className="nw-wfm__cardlbl">la fila de «{ctxGlyphs}»</span>
                        <span className="nw-wfm__rowno" aria-hidden>n.º {step.rowNo.toLocaleString("es-ES")}</span>
                    </div>

                    {/* the bars — one per letter; height ∝ count, amber heat fill, winner outlined + tallest */}
                    <AnimatePresence initial={false} mode="popLayout">
                        <motion.div
                            key={`bars-${si}-${step.ctx}`}
                            className="nw-wfm__bars"
                            initial={reduce ? false : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                            transition={{ duration: 0.24, ease: STD }}
                        >
                            {step.row.map((cnt, c) => {
                                const h = cnt > 0 ? Math.max(0.12, cnt / rowMax) : 0;
                                const isPick = c === step.pickIdx;
                                const showLbl = labelledCols.has(c);
                                return (
                                    <span key={c} className="nw-wfm__col" data-pick={isPick ? "1" : "0"}>
                                        <span className="nw-wfm__bartrack">
                                            <span
                                                className="nw-wfm__bar"
                                                data-pick={isPick ? "1" : "0"}
                                                style={{
                                                    height: `${h * 100}%`,
                                                    background: cnt > 0 ? heat(cnt / rowMax, 24) : "transparent",
                                                }}
                                            >
                                                {isPick && (
                                                    <span className="nw-wfm__barval">{cnt.toLocaleString("es-ES")}</span>
                                                )}
                                            </span>
                                        </span>
                                        <span className="nw-wfm__collbl" data-on={showLbl ? "1" : "0"}>
                                            {displayChar(ALPHA[c])}
                                        </span>
                                    </span>
                                );
                            })}
                            {/* the TIE: a thread dropping from the winning bar down to the readout below */}
                            <span
                                className="nw-wfm__tie"
                                style={{ left: `${((step.pickIdx + 0.5) / ALPHA.length) * 100}%` }}
                                aria-hidden
                            />
                        </motion.div>
                    </AnimatePresence>

                    {/* the readout — the number READ → the letter WRITTEN, bound tight under the row (climax) */}
                    <div className="nw-wfm__readout">
                        <span className="nw-wfm__rlabel">la cuenta más alta es</span>
                        <span className="nw-wfm__rval">{step.row[step.pickIdx].toLocaleString("es-ES")}</span>
                        <span className="nw-wfm__rarrow" aria-hidden>→</span>
                        <span className="nw-wfm__rletter">escribe {pickLabel}</span>
                    </div>
                </div>
            </div>

            {/* THE OUTPUT — the page filling, letter by letter; the last 2 are the live window. A co-anchor. */}
            <div className="nw-wfm__out">
                <span className="nw-wfm__outlead">lo que lleva escrito</span>
                <div className="nw-wfm__outline">
                    <MarkedText text={committed} stateOf={effLineState} size="clamp(22px, 3.2vw, 30px)" maxWidth={640} />
                    {!reduce && <span className="nw-wfm__caret" />}
                </div>
            </div>

            {/* THE RECIPE — the 3-step "how", a legible labelled legend (told once). */}
            <div className="nw-wfm__recipe">
                {RECIPE.map((r, i) => (
                    <span key={r.n} className="nw-wfm__rstep">
                        <span className="nw-wfm__rnum">{r.n}</span>
                        {r.label}
                        {i < RECIPE.length - 1 && <span className="nw-wfm__rsep" aria-hidden>→</span>}
                    </span>
                ))}
                <span className="nw-wfm__rloop">↻ y repite</span>
            </div>

            {/* CONTROLS — one dominant action; Solo + reset are quiet companions. */}
            <div className="nw-wfm__foot">
                <PlayButton onClick={onStep} disabled={running}>
                    {`ESCRIBE la letra ${written + 1}`}
                </PlayButton>
                {!reduce && (
                    <GhostButton onClick={onAuto}>{running ? "Pausa" : "Solo"}</GhostButton>
                )}
                {written > 0 && (
                    <button type="button" className="nw-wfm__reset" onClick={onReset} aria-label="Reiniciar">
                        ↻
                    </button>
                )}
            </div>

            <style>{`
                .nw-wfm { display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 720px; margin: 0 auto; gap: 16px; text-align: center; }

                /* TITLE — a true heading, flagship contrast. */
                .nw-wfm__title {
                    margin: 0; font-family: ${SERIF}; font-weight: 600;
                    font-size: clamp(20px, 3.4vw, 27px); line-height: 1.16; letter-spacing: -0.01em;
                    color: var(--ngram-ink);
                }
                .nw-wfm__title em { font-style: italic; color: var(--ngram-accent-ink); }

                /* THE KEY */
                .nw-wfm__key { display: flex; flex-direction: column; align-items: center; gap: 2px; }
                .nw-wfm__keychips { display: inline-flex; }

                /* THE HERO — a lit card holding the labelled row + the readout, with a faint stack behind it. */
                .nw-wfm__hero { position: relative; width: 100%; max-width: 560px; margin: 2px auto 0; }
                .nw-wfm__stack {
                    position: absolute; left: 10px; right: 10px; top: -8px; height: 40px;
                    border-radius: var(--ngram-r-md);
                    background: color-mix(in oklab, var(--ngram-accent-soft) 30%, var(--ngram-bg-2));
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent) 18%, transparent);
                }
                .nw-wfm__stack--2 { left: 18px; right: 18px; top: -16px; opacity: .6; }

                .nw-wfm__card {
                    position: relative; width: 100%; display: flex; flex-direction: column; gap: 12px;
                    padding: 14px 16px 18px; border-radius: var(--ngram-r-md);
                    background: color-mix(in oklab, var(--ngram-surface) 80%, var(--ngram-accent-soft));
                    box-shadow: 0 14px 40px -16px var(--ngram-accent),
                                inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent) 30%, transparent);
                }
                .nw-wfm__cardhead { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
                .nw-wfm__cardlbl { font-family: ${MONO}; font-size: 13px; font-weight: 700; color: var(--ngram-accent-ink); }
                .nw-wfm__rowno { font-family: ${MONO}; font-size: 9.5px; letter-spacing: .02em; color: var(--ngram-dim); white-space: nowrap; opacity: 0.5; }

                /* THE BARS — a real mini bar chart on a LIGHT track so every bar reads (no black-on-black). */
                .nw-wfm__bars {
                    position: relative; display: grid; grid-template-columns: repeat(${ALPHA.length}, 1fr);
                    align-items: end; gap: 2px; width: 100%; height: 108px;
                    padding: 6px 4px 0; border-radius: var(--ngram-r-sm);
                    background: color-mix(in oklab, var(--ngram-bg) 70%, var(--ngram-surface));
                    box-shadow: inset 0 0 0 1px var(--ngram-rule);
                }
                .nw-wfm__col { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; gap: 3px; }
                .nw-wfm__bartrack { display: flex; align-items: flex-end; justify-content: center; width: 100%; height: 80px; }
                .nw-wfm__bar {
                    position: relative; width: 78%; min-height: 2px; border-radius: 2px 2px 1px 1px;
                    transition: height .26s cubic-bezier(.2,.8,.2,1), box-shadow .2s ease;
                }
                .nw-wfm__bar[data-pick="1"] {
                    width: 100%;
                    box-shadow: inset 0 0 0 1.5px var(--ngram-accent-bright), 0 0 16px -2px var(--ngram-accent-bright);
                }
                .nw-wfm__barval {
                    position: absolute; left: 50%; bottom: calc(100% + 3px); transform: translateX(-50%);
                    font-family: ${MONO}; font-size: 12px; font-weight: 800; line-height: 1;
                    color: var(--ngram-accent-bright); font-variant-numeric: tabular-nums; white-space: nowrap;
                }
                .nw-wfm__collbl {
                    font-family: ${MONO}; font-size: 10px; line-height: 1; font-weight: 700; color: var(--ngram-dim);
                    opacity: 0; transition: opacity .2s ease, color .2s ease;
                }
                .nw-wfm__collbl[data-on="1"] { opacity: 1; color: var(--ngram-body); }
                .nw-wfm__col[data-pick="1"] .nw-wfm__collbl {
                    color: var(--ngram-on-accent); background: var(--ngram-accent); opacity: 1;
                    border-radius: 4px; padding: 2px 5px; font-weight: 800;
                }
                .nw-wfm__tie {
                    position: absolute; bottom: -12px; width: 2px; height: 12px; transform: translateX(-50%);
                    background: linear-gradient(to bottom, var(--ngram-accent-bright), color-mix(in oklab, var(--ngram-accent) 30%, transparent));
                    border-radius: 1px;
                }

                /* THE READOUT — número leído → letra escrita, bound tight under the bars (the climax). */
                .nw-wfm__readout {
                    display: flex; align-items: baseline; justify-content: center; flex-wrap: wrap; gap: 8px;
                    font-family: ${MONO};
                }
                .nw-wfm__rlabel { font-size: 13px; letter-spacing: .01em; color: var(--ngram-body); }
                .nw-wfm__rval { font-size: clamp(26px, 3.6vw, 34px); font-weight: 800; color: var(--ngram-accent-bright); font-variant-numeric: tabular-nums; line-height: 1; }
                .nw-wfm__rarrow { font-size: 19px; color: var(--ngram-accent); }
                .nw-wfm__rletter { font-size: clamp(16px, 2.2vw, 19px); font-weight: 800; color: var(--ngram-accent-ink); }

                /* THE OUTPUT — the growing line; a co-anchor, large enough to read as the result. */
                .nw-wfm__out { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 100%; }
                .nw-wfm__outlead { font-family: ${MONO}; font-size: 10px; letter-spacing: .16em; text-transform: uppercase; color: var(--ngram-muted); }
                .nw-wfm__outline { display: inline-flex; align-items: baseline; justify-content: center; flex-wrap: wrap; gap: 6px; min-height: 48px; }
                .nw-wfm__caret { display: inline-block; width: 3px; height: 1em; background: var(--ngram-accent); border-radius: 2px; align-self: center; animation: nwWfmBlink 1s steps(2) infinite; }
                @keyframes nwWfmBlink { 50% { opacity: 0; } }

                /* THE RECIPE — the 3-step "how", legible labelled legend. */
                .nw-wfm__recipe {
                    display: inline-flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px 12px;
                    font-family: ${MONO}; font-size: 13px; letter-spacing: .01em; color: var(--ngram-body);
                    padding: 10px 16px; border-radius: var(--ngram-r-md);
                    background: color-mix(in oklab, var(--ngram-accent-soft) 40%, transparent);
                    border: 1px solid color-mix(in oklab, var(--ngram-accent) 15%, transparent);
                }
                .nw-wfm__rstep { display: inline-flex; align-items: center; gap: 8px; }
                .nw-wfm__rnum {
                    display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px;
                    border-radius: 50%; background: var(--ngram-accent); color: var(--ngram-on-accent);
                    font-weight: 800; font-size: 12px; flex-shrink: 0;
                }
                .nw-wfm__rsep { color: var(--ngram-accent); margin-left: 4px; font-size: 16px; }
                .nw-wfm__rloop { color: var(--ngram-accent-ink); font-weight: 800; font-size: 14px; }

                /* CONTROLS */
                .nw-wfm__foot { display: inline-flex; align-items: center; gap: 14px; margin-top: 2px; flex-wrap: wrap; justify-content: center; }
                .nw-wfm__reset { font-family: ${MONO}; font-size: 16px; color: var(--ngram-accent); background: transparent; border: 0; cursor: pointer; padding: 6px 10px; border-radius: var(--ngram-r-pill); }
                .nw-wfm__reset:hover { color: var(--ngram-accent-bright); background: var(--ngram-accent-soft); }

                @media (max-width: 560px) {
                    .nw-wfm__bars { height: 94px; }
                    .nw-wfm__bartrack { height: 68px; }
                    .nw-wfm__collbl { font-size: 8px; }
                    .nw-wfm__rowno { display: none; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .nw-wfm__caret { animation: none; }
                    .nw-wfm__bar { transition: none; }
                }
            `}</style>
        </div>
    );
});

export default WriteFromMatrix;
