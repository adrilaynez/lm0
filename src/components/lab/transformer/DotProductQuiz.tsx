"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/*
  DotProductQuiz — Interactive quiz at end of §04a

  Two phases:
  Phase 1: "Arrow Pairs" — show two arrows, ask: similar? (positive/negative dot product)
  Phase 2: "Numbers → Arrows" — show numbers, pick which arrow pair matches

  Teaches intuition for dot products through geometry first, numbers second.
*/

/* ─── Quiz data ─── */
interface ArrowQ {
    id: string;
    a: [number, number];  // vector A
    b: [number, number];  // vector B
    labelA: string;
    labelB: string;
    answer: "positive" | "negative";
    explanation: string;
}

interface NumberQ {
    id: string;
    vecA: [number, number];
    vecB: [number, number];
    answer: "similar" | "different";
    explanation: string;
}

const ARROW_QUESTIONS: ArrowQ[] = [
    {
        id: "a1",
        a: [0.8, 0.6], b: [0.7, 0.7],
        labelA: "king", labelB: "crown",
        answer: "positive",
        explanation: "Both arrows point up-right — they're aligned! High positive dot product.",
    },
    {
        id: "a2",
        a: [0.9, 0.2], b: [-0.8, 0.5],
        labelA: "king", labelB: "the",
        answer: "negative",
        explanation: "One points right, the other points left — they diverge. Negative dot product.",
    },
    {
        id: "a3",
        a: [-0.3, 0.9], b: [-0.4, 0.8],
        labelA: "wore", labelB: "golden",
        answer: "positive",
        explanation: "Both point up-left — similar direction means positive dot product.",
    },
    {
        id: "a4",
        a: [0.5, 0.8], b: [-0.6, -0.7],
        labelA: "ruled", labelB: "the",
        answer: "negative",
        explanation: "Completely opposite directions — strongly negative dot product.",
    },
];

const NUMBER_QUESTIONS: NumberQ[] = [
    {
        id: "n1",
        vecA: [0.9, 0.4], vecB: [0.8, 0.5],
        answer: "similar",
        explanation: "Both have large positive first values and moderate second — the arrows point in roughly the same direction. Dot product = 0.92.",
    },
    {
        id: "n2",
        vecA: [0.7, -0.6], vecB: [-0.8, 0.5],
        answer: "different",
        explanation: "Signs are flipped on both dimensions — these point in opposite directions. Dot product = -0.86.",
    },
    {
        id: "n3",
        vecA: [-0.2, 0.9], vecB: [-0.3, 0.8],
        answer: "similar",
        explanation: "Both have small negative first, large positive second — pointing up-left together. Dot product = 0.78.",
    },
];

function dot2(a: [number, number], b: [number, number]): number {
    return +(a[0] * b[0] + a[1] * b[1]).toFixed(2);
}

/* ─── Arrow SVG ─── */
const SZ = 160, H = SZ / 2, LEN = 56;

function aPts(tx: number, ty: number, s: number): string {
    const l = Math.sqrt(tx * tx + ty * ty);
    if (l < 2) return "0,0 0,0 0,0";
    const nx = tx / l, ny = ty / l;
    const bx = tx - nx * s, by = ty - ny * s;
    const px = -ny * (s * 0.4), py = nx * (s * 0.4);
    return `${tx},${ty} ${bx + px},${by + py} ${bx - px},${by - py}`;
}

function ArrowPairSVG({ a, b, colorA, colorB }: {
    a: [number, number]; b: [number, number]; colorA: string; colorB: string;
}) {
    const ax = a[0] * LEN, ay = -a[1] * LEN;
    const bx = b[0] * LEN, by = -b[1] * LEN;
    return (
        <svg width={SZ} height={SZ} viewBox={`${-H} ${-H} ${SZ} ${SZ}`} className="block">
            <line x1={-H + 3} y1={0} x2={H - 3} y2={0} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            <line x1={0} y1={-H + 3} x2={0} y2={H - 3} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            <circle cx={0} cy={0} r={LEN} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
            <circle cx={0} cy={0} r={2} fill="rgba(255,255,255,0.06)" />
            {/* Arrow A */}
            <line x1={0} y1={0} x2={ax} y2={ay} stroke={colorA} strokeWidth={7} strokeLinecap="round" opacity={0.05} />
            <line x1={0} y1={0} x2={ax} y2={ay} stroke={colorA} strokeWidth={2.5} strokeLinecap="round" opacity={0.85} />
            <polygon points={aPts(ax, ay, 8)} fill={colorA} opacity={0.8} />
            {/* Arrow B */}
            <line x1={0} y1={0} x2={bx} y2={by} stroke={colorB} strokeWidth={7} strokeLinecap="round" opacity={0.05} />
            <line x1={0} y1={0} x2={bx} y2={by} stroke={colorB} strokeWidth={2.5} strokeLinecap="round" opacity={0.85} />
            <polygon points={aPts(bx, by, 8)} fill={colorB} opacity={0.8} />
        </svg>
    );
}

/* ─── Option button ─── */
function OptionBtn({ label, selected, correct, revealed, onClick }: {
    label: string; selected: boolean; correct: boolean; revealed: boolean; onClick: () => void;
}) {
    const bg = revealed
        ? correct
            ? "rgba(52,211,153,0.12)"
            : selected
                ? "rgba(244,63,94,0.1)"
                : "rgba(255,255,255,0.02)"
        : selected
            ? "rgba(34,211,238,0.08)"
            : "rgba(255,255,255,0.02)";

    const border = revealed
        ? correct
            ? "1px solid rgba(52,211,153,0.3)"
            : selected
                ? "1px solid rgba(244,63,94,0.2)"
                : "1px solid rgba(255,255,255,0.04)"
        : selected
            ? "1px solid rgba(34,211,238,0.2)"
            : "1px solid rgba(255,255,255,0.06)";

    const color = revealed
        ? correct
            ? "rgba(52,211,153,0.9)"
            : selected
                ? "rgba(244,63,94,0.6)"
                : "rgba(255,255,255,0.3)"
        : selected
            ? "rgba(34,211,238,0.7)"
            : "rgba(255,255,255,0.4)";

    return (
        <motion.button
            className="px-5 py-2 rounded-full text-sm font-semibold cursor-pointer"
            style={{ background: bg, border, color }}
            onClick={onClick}
            whileHover={!revealed ? { scale: 1.03 } : undefined}
            whileTap={!revealed ? { scale: 0.97 } : undefined}
        >
            {revealed && correct && "✓ "}{label}
        </motion.button>
    );
}

/* ─── Main Quiz ─── */
type Phase = "arrows" | "numbers" | "done";

export function DotProductQuiz() {
    const [phase, setPhase] = useState<Phase>("arrows");
    const [qi, setQi] = useState(0); // current question index
    const [answer, setAnswer] = useState<string | null>(null);
    const [revealed, setRevealed] = useState(false);
    const [score, setScore] = useState(0);
    const [total, setTotal] = useState(0);

    const arrowQ = ARROW_QUESTIONS[qi];
    const numQ = NUMBER_QUESTIONS[qi];

    const handleAnswer = (ans: string) => {
        if (revealed) return;
        setAnswer(ans);
    };

    const handleCheck = () => {
        if (!answer || revealed) return;
        setRevealed(true);
        setTotal(t => t + 1);
        const correct = phase === "arrows"
            ? answer === arrowQ.answer
            : answer === numQ.answer;
        if (correct) setScore(s => s + 1);
    };

    const handleNext = () => {
        const maxQ = phase === "arrows" ? ARROW_QUESTIONS.length : NUMBER_QUESTIONS.length;
        if (qi + 1 < maxQ) {
            setQi(qi + 1);
            setAnswer(null);
            setRevealed(false);
        } else if (phase === "arrows") {
            setPhase("numbers");
            setQi(0);
            setAnswer(null);
            setRevealed(false);
        } else {
            setPhase("done");
        }
    };

    const handleRestart = () => {
        setPhase("arrows");
        setQi(0);
        setAnswer(null);
        setRevealed(false);
        setScore(0);
        setTotal(0);
    };

    return (
        <div className="py-8 sm:py-10 px-4 sm:px-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-cyan-400/30 font-semibold">
                        {phase === "arrows" ? "Phase 1 · Arrows" : phase === "numbers" ? "Phase 2 · Numbers" : "Results"}
                    </p>
                    <p className="text-sm text-white/20 mt-0.5">
                        {phase === "arrows"
                            ? "Do these arrows point in a similar direction?"
                            : phase === "numbers"
                                ? "Look at the numbers — similar or different direction?"
                                : ""}
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-sm font-mono text-white/20">
                        {score}/{total}
                    </span>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {phase === "done" ? (
                    /* ── Results ── */
                    <motion.div
                        key="done"
                        className="text-center space-y-4 py-6"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <p className="text-2xl font-black font-mono" style={{
                            color: score / total > 0.7 ? "#34d399" : score / total > 0.4 ? "#fbbf24" : "#f43f5e"
                        }}>
                            {score}/{total}
                        </p>
                        <p className="text-sm text-white/40 max-w-xs mx-auto leading-relaxed">
                            {score === total
                                ? "Perfect! You've mastered dot product intuition — arrows that align give positive scores, arrows that oppose give negative."
                                : score / total > 0.6
                                    ? "Great job! You're getting the intuition — similar arrows → positive, opposing → negative."
                                    : "The key insight: arrows pointing the same way = positive dot product. Opposite = negative. Try again!"}
                        </p>
                        <motion.button
                            onClick={handleRestart}
                            className="text-sm text-cyan-400/40 hover:text-cyan-400/60 cursor-pointer transition-colors"
                            whileHover={{ scale: 1.03 }}
                        >
                            ↺ try again
                        </motion.button>
                    </motion.div>
                ) : phase === "arrows" ? (
                    /* ── Phase 1: Arrow pairs ── */
                    <motion.div
                        key={`arrow-${qi}`}
                        className="space-y-4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                    >
                        {/* Arrow display */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-3">
                                <span className="text-sm sm:text-base font-semibold" style={{ color: "#22d3ee" }}>
                                    {arrowQ.labelA}
                                </span>
                                <ArrowPairSVG
                                    a={arrowQ.a} b={arrowQ.b}
                                    colorA="#22d3ee" colorB="#34d399"
                                />
                                <span className="text-sm sm:text-base font-semibold" style={{ color: "#34d399" }}>
                                    {arrowQ.labelB}
                                </span>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="flex justify-center gap-3">
                            <OptionBtn
                                label="Positive (similar)"
                                selected={answer === "positive"}
                                correct={arrowQ.answer === "positive"}
                                revealed={revealed}
                                onClick={() => handleAnswer("positive")}
                            />
                            <OptionBtn
                                label="Negative (opposite)"
                                selected={answer === "negative"}
                                correct={arrowQ.answer === "negative"}
                                revealed={revealed}
                                onClick={() => handleAnswer("negative")}
                            />
                        </div>

                        {/* Check / Next */}
                        <div className="flex justify-center">
                            {!revealed ? (
                                <motion.button
                                    onClick={handleCheck}
                                    className="text-sm font-semibold px-5 py-2 rounded-full cursor-pointer"
                                    style={{
                                        background: answer ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.02)",
                                        border: answer ? "1px solid rgba(34,211,238,0.2)" : "1px solid rgba(255,255,255,0.05)",
                                        color: answer ? "rgba(34,211,238,0.6)" : "rgba(255,255,255,0.15)",
                                        pointerEvents: answer ? "auto" : "none",
                                    }}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    Check
                                </motion.button>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-sm text-white/30 italic max-w-sm text-center leading-relaxed">
                                        {arrowQ.explanation}
                                    </p>
                                    <motion.button
                                        onClick={handleNext}
                                        className="text-sm font-semibold text-cyan-400/50 hover:text-cyan-400/70 cursor-pointer transition-colors"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        Next →
                                    </motion.button>
                                </div>
                            )}
                        </div>

                        {/* Progress dots */}
                        <div className="flex justify-center gap-1.5">
                            {ARROW_QUESTIONS.map((_, i) => (
                                <div key={i} className="w-2 h-2 rounded-full" style={{
                                    background: i === qi ? "rgba(34,211,238,0.5)"
                                        : i < qi ? "rgba(34,211,238,0.2)"
                                            : "rgba(255,255,255,0.06)",
                                }} />
                            ))}
                            <span className="text-[10px] text-white/10 ml-1">arrows</span>
                            {NUMBER_QUESTIONS.map((_, i) => (
                                <div key={`n${i}`} className="w-2 h-2 rounded-full"
                                    style={{ background: "rgba(255,255,255,0.04)" }} />
                            ))}
                            <span className="text-[10px] text-white/10 ml-1">numbers</span>
                        </div>
                    </motion.div>
                ) : (
                    /* ── Phase 2: Numbers ── */
                    <motion.div
                        key={`num-${qi}`}
                        className="space-y-4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                    >
                        {/* Number display + hidden arrows */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex items-center gap-4 sm:gap-6">
                                <div className="text-center">
                                    <p className="text-[10px] uppercase tracking-widest text-cyan-400/30 font-semibold mb-1">A</p>
                                    <div className="flex gap-1.5">
                                        {numQ.vecA.map((v, d) => (
                                            <span key={d} className="text-sm font-mono font-bold px-2.5 py-1 rounded-md"
                                                style={{ color: "rgba(34,211,238,0.7)", background: "rgba(34,211,238,0.06)" }}>
                                                {v >= 0 ? "+" : ""}{v.toFixed(1)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <span className="text-white/15 text-sm">·</span>
                                <div className="text-center">
                                    <p className="text-[10px] uppercase tracking-widest text-emerald-400/30 font-semibold mb-1">B</p>
                                    <div className="flex gap-1.5">
                                        {numQ.vecB.map((v, d) => (
                                            <span key={d} className="text-sm font-mono font-bold px-2.5 py-1 rounded-md"
                                                style={{ color: "rgba(52,211,153,0.7)", background: "rgba(52,211,153,0.06)" }}>
                                                {v >= 0 ? "+" : ""}{v.toFixed(1)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Show arrows only after reveal */}
                            <AnimatePresence>
                                {revealed && (
                                    <motion.div
                                        className="flex items-center gap-2"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <ArrowPairSVG
                                            a={numQ.vecA} b={numQ.vecB}
                                            colorA="#22d3ee" colorB="#34d399"
                                        />
                                        <span className="text-sm font-mono font-bold" style={{
                                            color: dot2(numQ.vecA, numQ.vecB) > 0 ? "rgba(52,211,153,0.7)" : "rgba(244,63,94,0.6)"
                                        }}>
                                            = {dot2(numQ.vecA, numQ.vecB) >= 0 ? "+" : ""}{dot2(numQ.vecA, numQ.vecB).toFixed(2)}
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Options */}
                        <div className="flex justify-center gap-3">
                            <OptionBtn
                                label="Similar direction"
                                selected={answer === "similar"}
                                correct={numQ.answer === "similar"}
                                revealed={revealed}
                                onClick={() => handleAnswer("similar")}
                            />
                            <OptionBtn
                                label="Different direction"
                                selected={answer === "different"}
                                correct={numQ.answer === "different"}
                                revealed={revealed}
                                onClick={() => handleAnswer("different")}
                            />
                        </div>

                        {/* Check / Next */}
                        <div className="flex justify-center">
                            {!revealed ? (
                                <motion.button
                                    onClick={handleCheck}
                                    className="text-sm font-semibold px-5 py-2 rounded-full cursor-pointer"
                                    style={{
                                        background: answer ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.02)",
                                        border: answer ? "1px solid rgba(34,211,238,0.2)" : "1px solid rgba(255,255,255,0.05)",
                                        color: answer ? "rgba(34,211,238,0.6)" : "rgba(255,255,255,0.15)",
                                        pointerEvents: answer ? "auto" : "none",
                                    }}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    Check
                                </motion.button>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-sm text-white/30 italic max-w-sm text-center leading-relaxed">
                                        {numQ.explanation}
                                    </p>
                                    <motion.button
                                        onClick={handleNext}
                                        className="text-sm font-semibold text-cyan-400/50 hover:text-cyan-400/70 cursor-pointer transition-colors"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        {qi + 1 < NUMBER_QUESTIONS.length ? "Next →" : "See results →"}
                                    </motion.button>
                                </div>
                            )}
                        </div>

                        {/* Progress dots */}
                        <div className="flex justify-center gap-1.5">
                            {ARROW_QUESTIONS.map((_, i) => (
                                <div key={i} className="w-2 h-2 rounded-full"
                                    style={{ background: "rgba(34,211,238,0.2)" }} />
                            ))}
                            <span className="text-[10px] text-white/10 ml-1">arrows</span>
                            {NUMBER_QUESTIONS.map((_, i) => (
                                <div key={`n${i}`} className="w-2 h-2 rounded-full" style={{
                                    background: i === qi ? "rgba(34,211,238,0.5)"
                                        : i < qi ? "rgba(34,211,238,0.2)"
                                            : "rgba(255,255,255,0.06)",
                                }} />
                            ))}
                            <span className="text-[10px] text-white/10 ml-1">numbers</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
