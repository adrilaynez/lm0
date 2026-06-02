"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FastForward, Pause, Play, RotateCcw, SkipForward } from "lucide-react";

import {
    CompletionCoda,
    EditPanel,
    glyph,
    IconBtn,
    MatrixGrid,
    PhrasePanel,
    primaryBtnStyle,
    RunningTotal,
    SpeedControl,
    type Step,
} from "@/features/lab/components/BigramMatrixBuilderParts";
import { useI18n } from "@/i18n/context";

/**
 * BigramMatrixBuilder — the "build the transition matrix yourself" visualizer
 * (Bigram chapter, §3 mechanics · v10 design language · editorial-green).
 *
 * ONE concept: *every adjacent pair in the text drops a +1 into one cell of the grid — count them
 * all and the transition matrix builds itself.* The grid is the single focal point: a calm,
 * typographic table where meaning comes from FILL (accent-tinted heat scaling with the count) and
 * typography, never from borders or chrome.
 *
 *  • the phrase is the source instrument — sunk --bigram-bg-2 panel, current pair double-highlighted
 *    (origin filled `accent`, follower tinted `accent-soft`), exactly mirroring CorpusCountingIdea;
 *  • as the sweep advances one pair lands at a time: the pair shows a "+1", the target cell pulses
 *    while its count ticks up, and the matching row / column headers brighten — so the eye traces the
 *    pair straight to its address (from, to) in the grid;
 *  • cell heat is honest — tint scales with the cell's share of the running maximum, capped so a busy
 *    cell glows without ever screaming neon;
 *  • a quiet accumulator chip (`counted / total`) grows beside the pair so "count them ALL" is visible;
 *  • controls are minimal & premium: one accent Start, then quiet inset-ring icon controls; speed is a
 *    sunk segmented control, not a ghost toggle;
 *  • completion lands as a calm sage coda panel (editorial-insight voice) restating the ONE idea —
 *    every adjacent pair counted, and the grid IS the transition table — not a loud banner.
 *
 * Reads only --bigram-* tokens + the registered fonts; gated by the chapter's [data-bigram-theme] scope.
 * Reduced-motion safe (no fly / pulse / glint; final states shown instantly).
 */

/* ─── Config ─── */
const DEFAULT_TEXT = "the cat sat on the mat";
const ALLOWED = new Set("abcdefghijklmnopqrstuvwxyz ".split(""));
const MAX_VOCAB = 10;
const SPEEDS = [600, 350, 150] as const;
const SPEED_LABELS = ["1×", "2×", "4×"] as const;
const SLOW_FIRST_N = 10;
const SLOW_MULTIPLIER = 2.2;

/* ─── Helpers ─── */
function normalize(s: string): string {
    return s
        .toLowerCase()
        .split("")
        .filter((c) => ALLOWED.has(c))
        .join("");
}

function extractVocab(text: string): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const c of text) {
        if (!seen.has(c)) {
            seen.add(c);
            out.push(c);
        }
        if (out.length >= MAX_VOCAB) break;
    }
    return out.length ? out : ["a", "b", " "];
}

/* ─── Component ─── */
export function BigramMatrixBuilder() {
    const { t } = useI18n();
    const reduce = useReducedMotion();

    /* state */
    const [inputText, setInputText] = useState(DEFAULT_TEXT);
    const [text, setText] = useState(() => normalize(DEFAULT_TEXT));
    const [vocab, setVocab] = useState(() => extractVocab(normalize(DEFAULT_TEXT)));
    const [stepIdx, setStepIdx] = useState(-1);
    const [playing, setPlaying] = useState(false);
    const [speedIdx, setSpeedIdx] = useState(1);
    const [editing, setEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const charMap = useMemo(() => new Map(vocab.map((c, i) => [c, i])), [vocab]);

    const steps = useMemo<Step[]>(() => {
        const out: Step[] = [];
        for (let i = 0; i < text.length - 1; i++) {
            const f = text[i];
            const d = text[i + 1];
            const r = charMap.get(f) ?? -1;
            const c = charMap.get(d) ?? -1;
            if (r >= 0 && c >= 0) out.push({ from: f, to: d, row: r, col: c, pos: i });
        }
        return out;
    }, [charMap, text]);

    const active = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : null;
    const done = stepIdx >= steps.length - 1 && steps.length > 0;
    const started = stepIdx >= 0;

    const matrix = useMemo(() => {
        const m = Array.from(
            { length: vocab.length },
            () => Array(vocab.length).fill(0) as number[]
        );
        for (let i = 0; i <= Math.min(stepIdx, steps.length - 1); i++) {
            const s = steps[i];
            if (s) m[s.row][s.col] += 1;
        }
        return m;
    }, [stepIdx, steps, vocab.length]);

    const maxCount = useMemo(() => {
        let mx = 1;
        for (const r of matrix) for (const v of r) if (v > mx) mx = v;
        return mx;
    }, [matrix]);

    // Pairs counted so far (= landed steps) and distinct cells now filled — the running story of
    // "count them all and the matrix builds itself", surfaced as a quiet accumulator + completion meta.
    const counted = started ? Math.min(stepIdx + 1, steps.length) : 0;
    const filledCells = useMemo(() => {
        let n = 0;
        for (const r of matrix) for (const v of r) if (v > 0) n += 1;
        return n;
    }, [matrix]);

    /* handlers */
    const applyText = useCallback(() => {
        const n = normalize(inputText);
        setText(n);
        setVocab(extractVocab(n));
        setStepIdx(-1);
        setPlaying(false);
        setEditing(false);
    }, [inputText]);

    const start = useCallback(() => {
        if (steps.length === 0) return;
        setStepIdx(0);
        setPlaying(false);
    }, [steps]);

    const stepOnce = useCallback(() => {
        if (steps.length === 0) return;
        if (stepIdx < 0) {
            setStepIdx(0);
            return;
        }
        if (stepIdx < steps.length - 1) setStepIdx((i) => i + 1);
    }, [steps, stepIdx]);

    const reset = useCallback(() => {
        setStepIdx(-1);
        setPlaying(false);
    }, []);

    const skipToEnd = useCallback(() => {
        if (steps.length === 0) return;
        setStepIdx(steps.length - 1);
        setPlaying(false);
    }, [steps]);

    /* autoplay timer — slow down the first N pairs so the eye can follow the discovery.
       setState fires only from the timeout callback (never synchronously in the effect body):
       the landing step also clears `playing` once it reaches the final pair, so the toggle
       resets itself without a cascading render. */
    useEffect(() => {
        if (!playing || done) return;
        const baseDelay = SPEEDS[speedIdx];
        const delay =
            stepIdx < SLOW_FIRST_N ? Math.round(baseDelay * SLOW_MULTIPLIER) : baseDelay;
        const timer = setTimeout(() => {
            const next = Math.min(stepIdx + 1, steps.length - 1);
            setStepIdx(next);
            if (next >= steps.length - 1) setPlaying(false);
        }, delay);
        return () => clearTimeout(timer);
    }, [playing, stepIdx, done, steps.length, speedIdx]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {/* ── The source phrase — sunk panel, current pair double-highlighted ── */}
            {!editing ? (
                <PhrasePanel
                    text={text}
                    active={active}
                    started={started}
                    onEdit={() => {
                        setEditing(true);
                        setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    editLabel={t("bigramBuilder.editText")}
                    reduce={!!reduce}
                />
            ) : (
                <EditPanel
                    inputRef={inputRef}
                    value={inputText}
                    onChange={setInputText}
                    onApply={applyText}
                    onCancel={() => setEditing(false)}
                    placeholder={t("bigramBuilder.placeholder")}
                    applyLabel={t("bigramBuilder.apply")}
                    cancelLabel={t("bigramBuilder.cancel")}
                />
            )}

            {/* ── Current pair (+1) · running tally (the "what just happened" line) ── */}
            <div
                style={{
                    minHeight: 34,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                    flexWrap: "wrap",
                }}
            >
                <AnimatePresence mode="wait">
                    {active && !done && (
                        <motion.div
                            key={`pair-${stepIdx}`}
                            initial={reduce ? false : { opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduce ? undefined : { opacity: 0, y: 4 }}
                            transition={{ duration: 0.18 }}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: "var(--font-jetbrains-mono)",
                                    fontSize: 20,
                                    fontWeight: 600,
                                    color: "var(--bigram-accent)",
                                    display: "inline-flex",
                                    alignItems: "baseline",
                                }}
                            >
                                {glyph(active.from)}
                                <span
                                    style={{
                                        margin: "0 5px",
                                        color: "var(--bigram-dim)",
                                        fontWeight: 400,
                                        fontSize: 14,
                                    }}
                                >
                                    →
                                </span>
                                {glyph(active.to)}
                            </span>
                            <span
                                style={{
                                    fontFamily: "var(--font-jetbrains-mono)",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "var(--bigram-accent-ink)",
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                +1
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* persistent accumulator — the running tally that grows toward "all pairs counted" */}
                {started && (
                    <RunningTotal count={counted} total={steps.length} reduce={!!reduce} />
                )}
            </div>

            {/* ── Controls + speed ── */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    flexWrap: "wrap",
                }}
            >
                {!started ? (
                    <button
                        type="button"
                        onClick={start}
                        disabled={steps.length === 0}
                        style={primaryBtnStyle(steps.length === 0)}
                    >
                        <Play style={{ width: 15, height: 15 }} />
                        {t("bigramBuilder.start")}
                    </button>
                ) : (
                    <>
                        <IconBtn
                            onClick={stepOnce}
                            disabled={done}
                            ariaLabel="Step one pair"
                        >
                            <SkipForward style={{ width: 16, height: 16 }} />
                        </IconBtn>
                        <IconBtn
                            onClick={() => setPlaying((p) => !p)}
                            disabled={done}
                            ariaLabel={playing ? "Pause" : "Play"}
                        >
                            {playing ? (
                                <Pause style={{ width: 16, height: 16 }} />
                            ) : (
                                <Play style={{ width: 16, height: 16 }} />
                            )}
                        </IconBtn>
                        <IconBtn
                            onClick={skipToEnd}
                            disabled={done}
                            ariaLabel="Skip to end"
                        >
                            <FastForward style={{ width: 16, height: 16 }} />
                        </IconBtn>

                        <span
                            aria-hidden
                            style={{
                                width: 1,
                                height: 22,
                                background: "var(--bigram-rule-2)",
                                margin: "0 2px",
                            }}
                        />

                        {/* speed — sunk segmented control (v8 pattern) */}
                        <SpeedControl
                            labels={SPEED_LABELS}
                            speedIdx={speedIdx}
                            onSelect={setSpeedIdx}
                            reduce={!!reduce}
                        />

                        <span
                            aria-hidden
                            style={{
                                width: 1,
                                height: 22,
                                background: "var(--bigram-rule-2)",
                                margin: "0 2px",
                            }}
                        />

                        <IconBtn onClick={reset} ariaLabel="Reset">
                            <RotateCcw style={{ width: 14, height: 14 }} />
                        </IconBtn>
                    </>
                )}
            </div>

            {/* ── Progress hairline ── */}
            {started && (
                <div
                    style={{
                        height: 2,
                        borderRadius: 2,
                        overflow: "hidden",
                        maxWidth: 440,
                        margin: "0 auto",
                        width: "100%",
                        background: "color-mix(in oklab, var(--bigram-ink) 9%, transparent)",
                    }}
                >
                    <motion.div
                        animate={{
                            width: `${
                                steps.length > 0 ? ((stepIdx + 1) / steps.length) * 100 : 0
                            }%`,
                        }}
                        transition={reduce ? { duration: 0 } : { duration: 0.25 }}
                        style={{
                            height: "100%",
                            borderRadius: 2,
                            background: "var(--bigram-accent)",
                        }}
                    />
                </div>
            )}

            {/* ── The matrix — the focal point ── */}
            <MatrixGrid
                vocab={vocab}
                matrix={matrix}
                maxCount={maxCount}
                active={active}
                reduce={!!reduce}
            />

            {/* ── Completion coda — the ONE idea, in the calm sage voice (not the Verdict primitive) ── */}
            {done && (
                <CompletionCoda
                    line={t("bigramBuilder.complete")}
                    // language-neutral meta: Σ pairs counted · filled cells (symbols, no new i18n keys)
                    meta={`Σ ${counted}  ·  ▦ ${filledCells}`}
                    reduce={!!reduce}
                />
            )}
        </div>
    );
}
