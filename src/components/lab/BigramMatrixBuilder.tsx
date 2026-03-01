"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { FastForward, Pause, Play, RotateCcw } from "lucide-react";

import { useI18n } from "@/i18n/context";

/* ─── Config ─── */
const DEFAULT_TEXT = "the cat sat on the mat";
const ALLOWED = new Set("abcdefghijklmnopqrstuvwxyz ".split(""));
const MAX_VOCAB = 10;
const SPEEDS = [600, 350, 150] as const;
const SPEED_LABELS = ["1×", "2×", "4×"] as const;

type Step = { from: string; to: string; row: number; col: number; pos: number };

/* ─── Helpers ─── */
function normalize(s: string) {
    return s.toLowerCase().split("").filter(c => ALLOWED.has(c)).join("");
}

function extractVocab(text: string): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const c of text) {
        if (!seen.has(c)) { seen.add(c); out.push(c); }
        if (out.length >= MAX_VOCAB) break;
    }
    return out.length ? out : ["a", "b", " "];
}

function label(c: string) { return c === " " ? "·" : c; }

/* ─── Component ─── */
export function BigramMatrixBuilder() {
    const { t } = useI18n();

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
            const f = text[i], t2 = text[i + 1];
            const r = charMap.get(f) ?? -1, c = charMap.get(t2) ?? -1;
            if (r >= 0 && c >= 0) out.push({ from: f, to: t2, row: r, col: c, pos: i });
        }
        return out;
    }, [charMap, text]);

    const active = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : null;
    const done = stepIdx >= steps.length - 1 && steps.length > 0;
    const started = stepIdx >= 0;

    const matrix = useMemo(() => {
        const m = Array.from({ length: vocab.length }, () => Array(vocab.length).fill(0) as number[]);
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
        setPlaying(true);
    }, [steps]);

    const reset = useCallback(() => {
        setStepIdx(-1);
        setPlaying(false);
    }, []);

    const skipToEnd = useCallback(() => {
        if (steps.length === 0) return;
        setStepIdx(steps.length - 1);
        setPlaying(false);
    }, [steps]);

    /* autoplay timer */
    useEffect(() => {
        if (!playing || done) { setPlaying(false); return; }
        const timer = setTimeout(() => setStepIdx(i => Math.min(i + 1, steps.length - 1)), SPEEDS[speedIdx]);
        return () => clearTimeout(timer);
    }, [playing, stepIdx, done, steps.length, speedIdx]);

    return (
        <div className="space-y-5">
            {/* ── Text display with highlighted pair ── */}
            <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4 sm:p-5">
                {!editing ? (
                    <>
                        <div className="flex flex-wrap gap-[2px] justify-center leading-loose mb-3">
                            {Array.from(text).map((ch, i) => {
                                const isCurrent = active?.pos === i;
                                const isNext = active ? active.pos + 1 === i : false;
                                const isPast = started && active ? i < active.pos : false;
                                return (
                                    <span
                                        key={i}
                                        className={[
                                            "inline-flex items-center justify-center w-7 h-8 rounded text-sm font-mono font-medium transition-all duration-200",
                                            isCurrent ? "bg-emerald-500/25 text-emerald-200 ring-1 ring-emerald-500/40 scale-110" : "",
                                            isNext ? "bg-teal-500/20 text-teal-200 ring-1 ring-teal-500/30 scale-105" : "",
                                            !isCurrent && !isNext && isPast ? "text-white/25" : "",
                                            !isCurrent && !isNext && !isPast && started ? "text-white/50" : "",
                                            !started ? "text-white/60" : "",
                                        ].join(" ")}
                                    >
                                        {label(ch)}
                                    </span>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 50); }}
                            className="block mx-auto text-[10px] font-mono uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
                        >
                            {t("bigramBuilder.editText")}
                        </button>
                    </>
                ) : (
                    <div className="space-y-3">
                        <input
                            ref={inputRef}
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") applyText(); }}
                            className="w-full rounded-lg border border-emerald-500/30 bg-black/40 px-4 py-2.5 text-sm font-mono text-white/80 outline-none focus:ring-1 focus:ring-emerald-500/30"
                            placeholder={t("bigramBuilder.placeholder")}
                        />
                        <div className="flex justify-center gap-2">
                            <button
                                onClick={applyText}
                                className="px-4 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-colors"
                            >
                                {t("bigramBuilder.apply")}
                            </button>
                            <button
                                onClick={() => setEditing(false)}
                                className="px-4 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/40 hover:text-white/60 transition-colors"
                            >
                                {t("bigramBuilder.cancel")}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Current pair indicator ── */}
            <AnimatePresence mode="wait">
                {active && (
                    <motion.div
                        key={stepIdx}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-3"
                    >
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/25">
                            {stepIdx + 1}/{steps.length}
                        </span>
                        <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500/[0.08] border border-emerald-500/20">
                            <span className="text-lg font-mono font-bold text-emerald-300">{label(active.from)}</span>
                            <span className="text-white/30 text-sm">→</span>
                            <span className="text-lg font-mono font-bold text-teal-300">{label(active.to)}</span>
                            <span className="text-white/20 text-xs ml-1">+1</span>
                        </div>
                    </motion.div>
                )}
                {done && (
                    <motion.p
                        key="done"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-xs font-semibold text-emerald-400/80"
                    >
                        {t("bigramBuilder.complete")}
                    </motion.p>
                )}
            </AnimatePresence>

            {/* ── Controls ── */}
            <div className="flex items-center justify-center gap-2">
                {!started ? (
                    <button
                        onClick={start}
                        disabled={steps.length === 0}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-colors disabled:opacity-30"
                    >
                        <Play className="w-4 h-4" />
                        {t("bigramBuilder.start")}
                    </button>
                ) : (
                    <>
                        <button
                            onClick={() => setPlaying(p => !p)}
                            disabled={done}
                            className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 transition-colors disabled:opacity-25"
                            title={playing ? "Pause" : "Play"}
                        >
                            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={skipToEnd}
                            disabled={done}
                            className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 transition-colors disabled:opacity-25"
                            title="Skip to end"
                        >
                            <FastForward className="w-4 h-4" />
                        </button>
                        <div className="w-px h-6 bg-white/[0.08]" />
                        <button
                            onClick={() => setSpeedIdx(i => (i + 1) % SPEEDS.length)}
                            className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono font-bold text-white/40 hover:text-white/60 transition-colors"
                        >
                            {SPEED_LABELS[speedIdx]}
                        </button>
                        <div className="w-px h-6 bg-white/[0.08]" />
                        <button
                            onClick={reset}
                            className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/30 hover:text-white/60 transition-colors"
                            title="Reset"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                    </>
                )}
            </div>

            {/* ── Progress bar ── */}
            {started && (
                <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden max-w-md mx-auto">
                    <motion.div
                        animate={{ width: `${steps.length > 0 ? ((stepIdx + 1) / steps.length) * 100 : 0}%` }}
                        transition={{ duration: 0.2 }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    />
                </div>
            )}

            {/* ── Matrix ── */}
            <div className="overflow-auto rounded-xl border border-white/[0.06] bg-black/30">
                <table className="w-max min-w-full border-collapse font-mono text-xs">
                    <thead className="sticky top-0 z-10">
                        <tr>
                            <th className="w-10 h-9 text-[9px] text-white/30 uppercase tracking-wider border-b border-r border-white/[0.06] bg-[var(--lab-viz-bg)]">
                                ↓\→
                            </th>
                            {vocab.map((c) => (
                                <th
                                    key={c}
                                    className={`w-10 h-9 text-center border-b border-r border-white/[0.06] bg-[var(--lab-viz-bg)] transition-colors duration-150 ${active && charMap.get(active.to) === charMap.get(c) ? "text-teal-300 font-bold" : "text-white/40"
                                        }`}
                                >
                                    {label(c)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {matrix.map((row, ri) => (
                            <tr key={ri}>
                                <th className={`w-10 h-9 text-center border-r border-b border-white/[0.06] bg-[var(--lab-viz-bg)] sticky left-0 z-[5] transition-colors duration-150 ${active?.row === ri ? "text-emerald-300 font-bold" : "text-white/40"
                                    }`}>
                                    {label(vocab[ri])}
                                </th>
                                {row.map((val, ci) => {
                                    const isActive = active?.row === ri && active?.col === ci;
                                    const intensity = maxCount > 0 ? val / maxCount : 0;
                                    return (
                                        <td
                                            key={ci}
                                            className={`w-10 h-9 text-center border-r border-b border-white/[0.06] transition-all duration-200 ${isActive
                                                    ? "text-emerald-100 font-bold"
                                                    : val > 0 ? "text-white/70" : "text-white/10"
                                                }`}
                                            style={{
                                                backgroundColor: isActive
                                                    ? "rgba(16, 185, 129, 0.3)"
                                                    : val > 0
                                                        ? `rgba(16, 185, 129, ${Math.max(0.03, intensity * 0.3)})`
                                                        : "transparent",
                                                boxShadow: isActive ? "inset 0 0 0 1.5px rgba(16, 185, 129, 0.5)" : "none",
                                            }}
                                        >
                                            {val || "·"}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}