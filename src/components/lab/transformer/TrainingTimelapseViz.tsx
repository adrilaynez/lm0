"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  TrainingTimelapseViz — §08 Beat 4 ⭐⭐⭐⭐

  THE cinematic visualization. Watch a Transformer learn from scratch.
  Scrubable timeline with loss curve, generated text, and emotional captions.

  Config: gpt_4b_128d (4 blocks, 128d, 836K params)
  Real checkpoints from actual training on Shakespeare + Paul Graham essays.

  One concept: a model learning language from noise through gradient descent.
*/

/* ── Real training data ── */
interface Checkpoint {
    step: number;
    val_loss: number;
    text: string;
    caption: string;
    color: string;
}

const CHECKPOINTS: Checkpoint[] = [
    {
        step: 0,
        val_loss: 4.634,
        text: `e mk_foQ>FQ:uI(^p&Fef⟨8p&aws7\nuO<gkQ9.Hb-öy*DG?]rX"Lv3!N{tBz`,
        caption: "Random noise. Special characters, numbers, no structure.",
        color: "rgba(244,63,94,",
    },
    {
        step: 100,
        val_loss: 3.546,
        text: `7t . . h_pe!s:IDoc ipVfar c e   oo . t  ine.  ne\nthe  a  d  o`,
        caption: "Spaces emerge! The model discovered that text has gaps.",
        color: "rgba(244,63,94,",
    },
    {
        step: 500,
        val_loss: 2.495,
        text: `anou sem when nentades bes oing\nand thes for che arout wither`,
        caption: "Proto-words. Not real, but they sound like English.",
        color: "rgba(251,191,36,",
    },
    {
        step: 2000,
        val_loss: 1.815,
        text: `there would bet more teake and somes\nthe pood of the wart that`,
        caption: "Real words! 'there', 'would', 'more'. Grammar is forming.",
        color: "rgba(251,191,36,",
    },
    {
        step: 5000,
        val_loss: 1.497,
        text: `what you can do is start working\non the things that interest you most`,
        caption: "Phrases forming. Short sentences that almost make sense.",
        color: "rgba(34,211,238,",
    },
    {
        step: 10000,
        val_loss: 1.387,
        text: `the way to make something to the work\nand the most important thing is`,
        caption: "Coherent fragments! 'the way to make something'.",
        color: "rgba(34,211,238,",
    },
    {
        step: 20000,
        val_loss: 1.326,
        text: `when you're working on something\nthat seems like it could be big,\ndon't let anyone tell you otherwise.`,
        caption: "Full sentences. With punctuation. Structure learned.",
        color: "rgba(52,211,153,",
    },
    {
        step: 50000,
        val_loss: 1.301,
        text: `evolve was starting in the two\ninterests a project that would\nchange the way people think about`,
        caption: "Flowing English prose. From noise to this in 50,000 steps.",
        color: "rgba(52,211,153,",
    },
];

const RANDOM_BASELINE = 4.56;
const AUTO_PLAY_MS = 2000;

/* ── Helpers ── */
function formatStep(s: number): string {
    if (s >= 1000) return `${(s / 1000).toFixed(s >= 10000 ? 0 : 0)}K`;
    return String(s);
}

function lerpColor(t: number): string {
    /* 0 = rose, 0.5 = amber, 1.0 = emerald */
    if (t < 0.5) {
        const u = t * 2;
        const r = Math.round(244 + (251 - 244) * u);
        const g = Math.round(63 + (191 - 63) * u);
        const b = Math.round(94 + (36 - 94) * u);
        return `rgb(${r},${g},${b})`;
    }
    const u = (t - 0.5) * 2;
    const r = Math.round(251 + (52 - 251) * u);
    const g = Math.round(191 + (211 - 191) * u);
    const b = Math.round(36 + (153 - 36) * u);
    return `rgb(${r},${g},${b})`;
}

export function TrainingTimelapseViz() {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [typedCount, setTypedCount] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const typeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prevIdxRef = useRef(0);

    const cp = CHECKPOINTS[currentIdx];
    const total = CHECKPOINTS.length;

    /* ── Typewriter on checkpoint change ── */
    useEffect(() => {
        if (currentIdx === prevIdxRef.current && typedCount > 0) return;
        prevIdxRef.current = currentIdx;
        setTypedCount(0);
        setIsTyping(true);
    }, [currentIdx]);

    useEffect(() => {
        if (!isTyping) return;
        if (typedCount >= cp.text.length) {
            setIsTyping(false);
            return;
        }
        typeRef.current = setTimeout(() => {
            setTypedCount((c) => Math.min(c + 2, cp.text.length));
        }, 12);
        return () => { if (typeRef.current) clearTimeout(typeRef.current); };
    }, [typedCount, isTyping, cp.text.length]);

    /* ── Auto-play ── */
    useEffect(() => {
        if (!isPlaying) return;
        timerRef.current = setTimeout(() => {
            setCurrentIdx((i) => {
                if (i >= total - 1) { setIsPlaying(false); return i; }
                return i + 1;
            });
        }, AUTO_PLAY_MS);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [isPlaying, currentIdx, total]);

    const togglePlay = useCallback(() => {
        if (currentIdx >= total - 1 && !isPlaying) {
            setCurrentIdx(0);
            setIsPlaying(true);
        } else {
            setIsPlaying((p) => !p);
        }
    }, [currentIdx, total, isPlaying]);

    /* ── SVG loss curve data ── */
    const svgW = 320;
    const svgH = 160;
    const pad = { top: 20, right: 16, bottom: 28, left: 36 };
    const plotW = svgW - pad.left - pad.right;
    const plotH = svgH - pad.top - pad.bottom;

    const maxStep = CHECKPOINTS[total - 1].step;
    const minLoss = 1.0;
    const maxLoss = 5.0;

    const toX = (step: number) => pad.left + (step / maxStep) * plotW;
    const toY = (loss: number) => pad.top + ((loss - minLoss) / (maxLoss - minLoss)) * plotH;
    /* Y is inverted: higher loss = lower on chart... wait, no: higher loss should be higher Y (top) */
    const toYInv = (loss: number) => pad.top + plotH - ((loss - minLoss) / (maxLoss - minLoss)) * plotH;

    const pathPoints = CHECKPOINTS.map((c) => `${toX(c.step)},${toYInv(c.val_loss)}`);
    const drawnPath = pathPoints.slice(0, currentIdx + 1).join(" L ");
    const futurePath = currentIdx < total - 1
        ? pathPoints.slice(currentIdx).join(" L ")
        : "";

    /* ── Progress fraction for color ── */
    const progress = currentIdx / (total - 1);

    return (
        <div className="flex flex-col items-center gap-0 w-full">
            {/* ── Main panel ── */}
            <div
                className="w-full max-w-[620px] rounded-2xl overflow-hidden"
                style={{
                    background: "rgba(0,0,0,0.25)",
                    border: "1px solid rgba(255,255,255,0.05)",
                }}
            >
                {/* ── Timeline scrubber ── */}
                <div className="px-5 pt-4 pb-3">
                    <div className="flex items-center gap-3 mb-3">
                        {/* Play button */}
                        <button
                            onClick={togglePlay}
                            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200"
                            style={{
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                color: "rgba(255,255,255,0.5)",
                            }}
                        >
                            <span className="text-[13px]">
                                {isPlaying ? "⏸" : "▶"}
                            </span>
                        </button>

                        {/* Step label */}
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-[15px] font-semibold font-mono tabular-nums"
                                style={{ color: lerpColor(progress) }}>
                                Step {cp.step.toLocaleString()}
                            </span>
                            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.15)" }}>
                                / {maxStep.toLocaleString()}
                            </span>
                        </div>

                        {/* Loss badge */}
                        <div className="ml-auto px-2.5 py-1 rounded-lg"
                            style={{
                                background: `${cp.color}0.08)`,
                                border: `1px solid ${cp.color}0.15)`,
                            }}>
                            <span className="text-[11px] font-mono font-semibold"
                                style={{ color: `${cp.color}0.7)` }}>
                                loss {cp.val_loss.toFixed(3)}
                            </span>
                        </div>
                    </div>

                    {/* Scrubber track */}
                    <div className="relative h-[6px] rounded-full"
                        style={{ background: "rgba(255,255,255,0.04)" }}>
                        {/* Progress fill */}
                        <motion.div
                            className="absolute top-0 left-0 h-full rounded-full"
                            animate={{
                                width: `${(currentIdx / (total - 1)) * 100}%`,
                                backgroundColor: lerpColor(progress),
                            }}
                            transition={{ duration: 0.3 }}
                            style={{ opacity: 0.4 }}
                        />

                        {/* Checkpoint dots */}
                        {CHECKPOINTS.map((c, i) => {
                            const pct = (i / (total - 1)) * 100;
                            const isActive = i <= currentIdx;
                            const isCurrent = i === currentIdx;
                            return (
                                <button
                                    key={i}
                                    onClick={() => { setCurrentIdx(i); setIsPlaying(false); }}
                                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-200"
                                    style={{
                                        left: `${pct}%`,
                                        width: isCurrent ? 14 : 8,
                                        height: isCurrent ? 14 : 8,
                                        borderRadius: "50%",
                                        background: isActive
                                            ? lerpColor(i / (total - 1))
                                            : "rgba(255,255,255,0.1)",
                                        boxShadow: isCurrent
                                            ? `0 0 12px ${cp.color}0.3)`
                                            : "none",
                                        border: isCurrent
                                            ? `2px solid ${cp.color}0.5)`
                                            : "none",
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* ── Loss curve + text ── */}
                <div className="flex flex-col sm:flex-row gap-0">
                    {/* Loss curve */}
                    <div className="flex-[3] px-3 py-2">
                        <svg
                            viewBox={`0 0 ${svgW} ${svgH}`}
                            className="w-full"
                            style={{ maxHeight: 180 }}
                        >
                            {/* Y-axis labels */}
                            {[1, 2, 3, 4, 5].map((v) => (
                                <g key={v}>
                                    <line
                                        x1={pad.left} y1={toYInv(v)}
                                        x2={svgW - pad.right} y2={toYInv(v)}
                                        stroke="rgba(255,255,255,0.04)"
                                        strokeWidth={0.5}
                                    />
                                    <text
                                        x={pad.left - 6} y={toYInv(v) + 3}
                                        textAnchor="end"
                                        fill="rgba(255,255,255,0.15)"
                                        fontSize={9}
                                        fontFamily="monospace"
                                    >
                                        {v.toFixed(0)}
                                    </text>
                                </g>
                            ))}

                            {/* Random baseline */}
                            <line
                                x1={pad.left} y1={toYInv(RANDOM_BASELINE)}
                                x2={svgW - pad.right} y2={toYInv(RANDOM_BASELINE)}
                                stroke="rgba(244,63,94,0.15)"
                                strokeWidth={1}
                                strokeDasharray="4 4"
                            />
                            <text
                                x={svgW - pad.right} y={toYInv(RANDOM_BASELINE) - 5}
                                textAnchor="end"
                                fill="rgba(244,63,94,0.25)"
                                fontSize={8}
                                fontFamily="monospace"
                            >
                                random
                            </text>

                            {/* Future dashed line */}
                            {futurePath && (
                                <path
                                    d={`M ${futurePath}`}
                                    fill="none"
                                    stroke="rgba(255,255,255,0.06)"
                                    strokeWidth={1}
                                    strokeDasharray="3 5"
                                />
                            )}

                            {/* Drawn line */}
                            <motion.path
                                d={`M ${drawnPath}`}
                                fill="none"
                                stroke={lerpColor(progress)}
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1, stroke: lerpColor(progress) }}
                                transition={{ duration: 0.5 }}
                            />

                            {/* Area fill under drawn line */}
                            {currentIdx > 0 && (
                                <path
                                    d={`M ${drawnPath} L ${toX(CHECKPOINTS[currentIdx].step)},${toYInv(minLoss)} L ${toX(CHECKPOINTS[0].step)},${toYInv(minLoss)} Z`}
                                    fill={`${cp.color}0.04)`}
                                />
                            )}

                            {/* Current point glow */}
                            <motion.circle
                                cx={toX(cp.step)}
                                cy={toYInv(cp.val_loss)}
                                r={5}
                                fill={lerpColor(progress)}
                                animate={{
                                    r: [5, 7, 5],
                                    opacity: [0.8, 1, 0.8],
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />

                            {/* X-axis step labels */}
                            {CHECKPOINTS.filter((_, i) => i % 2 === 0 || i === total - 1).map((c, i) => (
                                <text
                                    key={i}
                                    x={toX(c.step)}
                                    y={svgH - 4}
                                    textAnchor="middle"
                                    fill="rgba(255,255,255,0.12)"
                                    fontSize={8}
                                    fontFamily="monospace"
                                >
                                    {formatStep(c.step)}
                                </text>
                            ))}
                        </svg>
                    </div>

                    {/* Generated text */}
                    <div className="flex-[2] px-4 py-3 sm:border-l"
                        style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                        <span className="text-[9px] font-mono uppercase tracking-widest mb-2 block"
                            style={{ color: "rgba(255,255,255,0.15)" }}>
                            generated text
                        </span>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIdx}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words min-h-[80px]"
                                style={{ color: `${cp.color}0.65)` }}
                            >
                                {cp.text.slice(0, typedCount)}
                                {isTyping && (
                                    <span className="inline-block w-[2px] h-[14px] ml-[1px] align-middle"
                                        style={{ background: `${cp.color}0.5)` }} />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* ── Emotional caption ── */}
                <div className="px-5 py-3 border-t"
                    style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={currentIdx}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.3 }}
                            className="text-[13px] font-medium text-center"
                            style={{ color: `${cp.color}0.6)` }}
                        >
                            {cp.caption}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
