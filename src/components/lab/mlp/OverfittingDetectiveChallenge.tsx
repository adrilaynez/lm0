"use client";

import { useCallback, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Eye, RotateCcw, Sparkles, XCircle } from "lucide-react";

/*
  OverfittingDetectiveChallenge v2
  6 challenges with animated SVG charts, gap shading, visual clues,
  streak tracker, difficulty labels, richer feedback with key indicators.
*/

type Diagnosis = "overfit" | "underfit" | "good" | "diverged";

interface Challenge {
    id: string;
    difficulty: "easy" | "medium" | "hard";
    scenario: string;
    trainCurve: number[];
    valCurve: number[];
    answer: Diagnosis;
    explanation: string;
    clue: string;
    indicators: { label: string; value: string; color: string }[];
}

const CHALLENGES: Challenge[] = [
    {
        id: "classic-overfit",
        difficulty: "easy",
        scenario: "Large model (H=512, E=32), low dropout, 50K steps",
        trainCurve: [3.3, 2.5, 2.0, 1.6, 1.3, 1.0, 0.8, 0.6, 0.5, 0.4, 0.32, 0.25],
        valCurve: [3.3, 2.6, 2.2, 2.1, 2.1, 2.15, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7],
        answer: "overfit",
        explanation: "Train loss keeps dropping but val loss reverses after step 4 — classic overfitting. The model memorizes training data instead of learning patterns.",
        clue: "Watch where the two curves diverge. Which direction does each go?",
        indicators: [
            { label: "Gap trend", value: "↑ Growing", color: "text-rose-400" },
            { label: "Val loss", value: "↑ Rising", color: "text-rose-400" },
            { label: "Train loss", value: "↓ Still falling", color: "text-emerald-400" },
        ],
    },
    {
        id: "stuck-underfit",
        difficulty: "easy",
        scenario: "Tiny model (H=32, E=2), lr=0.01, 50K steps",
        trainCurve: [3.3, 3.1, 3.0, 2.95, 2.92, 2.9, 2.88, 2.87, 2.86, 2.85, 2.84, 2.84],
        valCurve: [3.3, 3.15, 3.05, 3.0, 2.97, 2.95, 2.93, 2.92, 2.91, 2.90, 2.89, 2.89],
        answer: "underfit",
        explanation: "Both curves are high and barely improve — the model lacks capacity. It can't learn the patterns in the data.",
        clue: "Look at the absolute values. Are they close to the random baseline (~3.4)?",
        indicators: [
            { label: "Final loss", value: "~2.85 (high)", color: "text-amber-400" },
            { label: "Gap", value: "~0.05 (small)", color: "text-emerald-400" },
            { label: "Improvement", value: "~14% only", color: "text-amber-400" },
        ],
    },
    {
        id: "balanced-good",
        difficulty: "medium",
        scenario: "Medium model (H=128, E=10), dropout=0.1, lr=0.01",
        trainCurve: [3.3, 2.7, 2.3, 2.1, 2.0, 1.95, 1.92, 1.90, 1.89, 1.88, 1.87, 1.87],
        valCurve: [3.3, 2.75, 2.4, 2.2, 2.1, 2.05, 2.02, 2.0, 1.99, 1.98, 1.97, 1.97],
        answer: "good",
        explanation: "Both curves decrease together with a small, stable gap. The model generalizes well — it learned real patterns, not memorization.",
        clue: "Is the gap between curves stable, growing, or shrinking?",
        indicators: [
            { label: "Gap", value: "~0.10 (stable)", color: "text-emerald-400" },
            { label: "Both curves", value: "↓ Decreasing", color: "text-emerald-400" },
            { label: "Converged", value: "Yes (flat end)", color: "text-emerald-400" },
        ],
    },
    {
        id: "diverged-lr",
        difficulty: "medium",
        scenario: "H=256, E=16, lr=0.2 (aggressive!)",
        trainCurve: [3.3, 3.5, 4.2, 5.8, 8.0, 12.0, 12.5, 13.0, 13.5, 14.0, 14.2, 14.5],
        valCurve: [3.3, 3.6, 4.5, 6.2, 9.0, 13.5, 14.0, 14.5, 15.0, 15.2, 15.5, 16.0],
        answer: "diverged",
        explanation: "Loss explodes instead of decreasing — the learning rate is way too high. The optimizer overshoots the minimum every step, bouncing further away.",
        clue: "Look at the direction. Is loss going up or down?",
        indicators: [
            { label: "Loss direction", value: "↑ Exploding!", color: "text-rose-400" },
            { label: "lr", value: "0.2 (too high)", color: "text-rose-400" },
            { label: "Diagnosis", value: "LR divergence", color: "text-rose-400" },
        ],
    },
    {
        id: "subtle-overfit",
        difficulty: "hard",
        scenario: "H=256, E=16, dropout=0.05 (very low), 50K steps",
        trainCurve: [3.3, 2.5, 2.1, 1.9, 1.8, 1.75, 1.72, 1.70, 1.68, 1.67, 1.66, 1.65],
        valCurve: [3.3, 2.55, 2.15, 1.98, 1.92, 1.90, 1.91, 1.92, 1.93, 1.94, 1.95, 1.96],
        answer: "overfit",
        explanation: "Subtle! Val loss flattens then VERY slightly rises (1.90→1.96) while train keeps dropping. This is early overfitting — easy to miss but the gap is growing.",
        clue: "This one is tricky. Zoom into the later steps of the validation curve.",
        indicators: [
            { label: "Val at step 5", value: "1.90 (best)", color: "text-emerald-400" },
            { label: "Val at step 11", value: "1.96 (worse)", color: "text-amber-400" },
            { label: "Gap trend", value: "↑ Slowly growing", color: "text-amber-400" },
        ],
    },
    {
        id: "good-converged",
        difficulty: "hard",
        scenario: "Best config: H=128, E=10, lr=0.01, dropout=0.1, ctx=8",
        trainCurve: [3.3, 2.6, 2.2, 2.0, 1.9, 1.85, 1.82, 1.80, 1.79, 1.78, 1.78, 1.78],
        valCurve: [3.3, 2.7, 2.35, 2.15, 2.05, 2.0, 1.97, 1.95, 1.94, 1.94, 1.93, 1.93],
        answer: "good",
        explanation: "Both curves converge to stable values with a consistent small gap (~0.15). The model found its limit — well-fitted. The gap exists because train loss always benefits from seeing the same data twice.",
        clue: "The gap is larger than the previous 'good' example. Does that make it overfit?",
        indicators: [
            { label: "Gap", value: "~0.15 (stable!)", color: "text-emerald-400" },
            { label: "Val trend", value: "→ Flat (good)", color: "text-emerald-400" },
            { label: "Train trend", value: "→ Flat (good)", color: "text-emerald-400" },
        ],
    },
];

const OPTIONS: { value: Diagnosis; label: string; emoji: string }[] = [
    { value: "overfit", label: "Overfitting", emoji: "📈" },
    { value: "underfit", label: "Underfitting", emoji: "😴" },
    { value: "good", label: "Good Fit", emoji: "✅" },
    { value: "diverged", label: "Diverged", emoji: "💥" },
];

const DIFF_COLORS = { easy: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", medium: "text-amber-400 bg-amber-500/10 border-amber-500/20", hard: "text-rose-400 bg-rose-500/10 border-rose-500/20" };

export function OverfittingDetectiveChallenge() {
    const [challengeIdx, setChallengeIdx] = useState(0);
    const [guess, setGuess] = useState<Diagnosis | null>(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [showClue, setShowClue] = useState(false);

    const challenge = CHALLENGES[challengeIdx];
    const isCorrect = guess === challenge.answer;

    const handleGuess = useCallback((g: Diagnosis) => {
        if (revealed) return;
        setGuess(g);
        setRevealed(true);
        if (g === challenge.answer) {
            setScore(prev => prev + 1);
            setStreak(prev => { const n = prev + 1; setBestStreak(b => Math.max(b, n)); return n; });
        } else {
            setStreak(0);
        }
    }, [revealed, challenge.answer]);

    const next = useCallback(() => {
        if (challengeIdx < CHALLENGES.length - 1) {
            setChallengeIdx(prev => prev + 1);
            setGuess(null);
            setRevealed(false);
            setShowClue(false);
        }
    }, [challengeIdx]);

    const reset = useCallback(() => {
        setChallengeIdx(0);
        setGuess(null);
        setRevealed(false);
        setShowClue(false);
        setScore(0);
        setStreak(0);
    }, []);

    // Chart dimensions
    const W = 420, H = 200, padL = 40, padR = 12, padT = 16, padB = 28;

    // Compute Y range from all curves in current challenge
    const { yMin, yMax } = useMemo(() => {
        const all = [...challenge.trainCurve, ...challenge.valCurve];
        const min = Math.min(...all), max = Math.max(...all);
        const margin = (max - min) * 0.1;
        return { yMin: Math.max(0, min - margin), yMax: max + margin };
    }, [challenge]);

    const steps = challenge.trainCurve.length;
    const toX = (i: number) => padL + (i / (steps - 1)) * (W - padL - padR);
    const toY = (v: number) => padT + ((yMax - v) / (yMax - yMin)) * (H - padT - padB);

    // Gap fill path (area between train and val)
    const gapPath = useMemo(() => {
        const trainPts = challenge.trainCurve.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`);
        const valPtsRev = [...challenge.valCurve].map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).reverse();
        return `M${trainPts.join(" L")} L${valPtsRev.join(" L")} Z`;
    }, [challenge, toX, toY]);

    // Final gap
    const finalGap = Math.abs(challenge.valCurve[steps - 1] - challenge.trainCurve[steps - 1]);

    // Y-axis ticks
    const yTicks = useMemo(() => {
        const range = yMax - yMin;
        const step = range < 2 ? 0.5 : range < 5 ? 1 : 2;
        const ticks: number[] = [];
        let v = Math.ceil(yMin / step) * step;
        while (v <= yMax) { ticks.push(v); v += step; }
        return ticks;
    }, [yMin, yMax]);

    const done = challengeIdx === CHALLENGES.length - 1 && revealed;

    return (
        <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-white/30">Case {challengeIdx + 1}/{CHALLENGES.length}</span>
                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border ${DIFF_COLORS[challenge.difficulty]}`}>
                        {challenge.difficulty}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {streak > 1 && (
                        <motion.span
                            initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                            className="text-[9px] font-mono font-bold text-amber-400"
                        >
                            🔥 {streak} streak
                        </motion.span>
                    )}
                    <span className="text-[10px] font-mono text-violet-400 font-bold">{score}/{CHALLENGES.length}</span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="flex gap-1">
                {CHALLENGES.map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < challengeIdx ? "bg-violet-500/50" :
                            i === challengeIdx ? "bg-violet-400" :
                                "bg-white/[0.06]"
                        }`} />
                ))}
            </div>

            {/* Scenario label */}
            <div className="text-[9px] font-mono text-white/20 text-center">
                {challenge.scenario}
            </div>

            {/* Chart */}
            <div className="rounded-xl border border-white/[0.06] bg-gradient-to-b from-black/50 to-black/30 p-2">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 240 }}>
                    {/* Grid */}
                    {yTicks.map(v => (
                        <g key={v}>
                            <line x1={padL} y1={toY(v)} x2={W - padR} y2={toY(v)} stroke="rgba(255,255,255,0.04)" />
                            <text x={padL - 5} y={toY(v) + 3} textAnchor="end" fill="rgba(255,255,255,0.15)" fontSize={7} fontFamily="monospace">{v.toFixed(1)}</text>
                        </g>
                    ))}

                    {/* Gap fill */}
                    <path d={gapPath} fill={
                        revealed
                            ? challenge.answer === "overfit" ? "rgba(244,63,94,0.08)"
                                : challenge.answer === "diverged" ? "rgba(244,63,94,0.06)"
                                    : challenge.answer === "underfit" ? "rgba(251,191,36,0.06)"
                                        : "rgba(52,211,153,0.06)"
                            : "rgba(139,92,246,0.04)"
                    } />

                    {/* Train curve */}
                    <motion.polyline
                        points={challenge.trainCurve.map((v, i) => `${toX(i)},${toY(v)}`).join(" ")}
                        fill="none" stroke="rgb(16,185,129)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                    {/* Val curve */}
                    <motion.polyline
                        points={challenge.valCurve.map((v, i) => `${toX(i)},${toY(v)}`).join(" ")}
                        fill="none" stroke="rgb(139,92,246)" strokeWidth={2.5} strokeDasharray="6 4" strokeLinecap="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 0.15 }}
                    />

                    {/* End dots */}
                    <circle cx={toX(steps - 1)} cy={toY(challenge.trainCurve[steps - 1])} r={4} fill="rgb(16,185,129)" fillOpacity={0.8} />
                    <circle cx={toX(steps - 1)} cy={toY(challenge.valCurve[steps - 1])} r={4} fill="rgb(139,92,246)" fillOpacity={0.8} />

                    {/* End values */}
                    <text x={toX(steps - 1) + 8} y={toY(challenge.trainCurve[steps - 1]) + 3} fill="rgba(16,185,129,0.7)" fontSize={8} fontFamily="monospace">
                        {challenge.trainCurve[steps - 1].toFixed(2)}
                    </text>
                    <text x={toX(steps - 1) + 8} y={toY(challenge.valCurve[steps - 1]) + 3} fill="rgba(139,92,246,0.7)" fontSize={8} fontFamily="monospace">
                        {challenge.valCurve[steps - 1].toFixed(2)}
                    </text>

                    {/* Gap bracket at end */}
                    <line x1={toX(steps - 1) + 3} y1={toY(challenge.trainCurve[steps - 1])} x2={toX(steps - 1) + 3} y2={toY(challenge.valCurve[steps - 1])}
                        stroke="rgba(255,255,255,0.15)" strokeWidth={1} />

                    {/* X axis label */}
                    <text x={W / 2} y={H - 4} textAnchor="middle" fill="rgba(255,255,255,0.12)" fontSize={7} fontFamily="monospace">Training Steps →</text>
                </svg>
            </div>

            {/* Legend + gap info */}
            <div className="flex items-center justify-between text-[9px] font-mono">
                <div className="flex gap-4">
                    <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-emerald-500 rounded" /> Train Loss</span>
                    <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-violet-500 rounded border-dashed" /> Val Loss</span>
                </div>
                <span className="text-white/20">Final gap: <span className="text-white/40 font-bold">{finalGap.toFixed(2)}</span></span>
            </div>

            {/* Clue toggle */}
            {!revealed && (
                <button onClick={() => setShowClue(!showClue)}
                    className="flex items-center gap-1.5 text-[9px] font-mono text-violet-400/60 hover:text-violet-400 transition-colors">
                    <Eye className="w-3 h-3" /> {showClue ? "Hide clue" : "Need a hint?"}
                </button>
            )}
            <AnimatePresence>
                {showClue && !revealed && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="text-[9px] font-mono text-violet-300/40 bg-violet-500/[0.04] rounded-lg border border-violet-500/10 px-3 py-2">
                        💡 {challenge.clue}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Diagnosis options */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {OPTIONS.map(opt => {
                    const isThis = guess === opt.value;
                    const showCorrect = revealed && opt.value === challenge.answer;
                    return (
                        <button
                            key={opt.value}
                            onClick={() => handleGuess(opt.value)}
                            disabled={revealed}
                            className={`py-3 rounded-xl text-[10px] font-mono font-bold text-center transition-all border ${showCorrect ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 ring-1 ring-emerald-500/20" :
                                    isThis && !isCorrect ? "bg-rose-500/15 border-rose-500/40 text-rose-400" :
                                        revealed ? "bg-white/[0.01] border-white/[0.04] text-white/15" :
                                            "bg-white/[0.02] border-white/[0.06] text-white/40 hover:bg-white/[0.05] hover:text-white/60 hover:border-white/10"
                                } disabled:cursor-default`}
                        >
                            <span className="text-sm block mb-0.5">{opt.emoji}</span>
                            {opt.label}
                            {showCorrect && <CheckCircle2 className="w-3 h-3 inline ml-1" />}
                            {isThis && !isCorrect && revealed && <XCircle className="w-3 h-3 inline ml-1" />}
                        </button>
                    );
                })}
            </div>

            {/* Feedback */}
            <AnimatePresence mode="wait">
                {revealed && (
                    <motion.div
                        key={`feedback-${challengeIdx}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`rounded-xl border p-4 space-y-3 ${isCorrect ? "border-emerald-500/20 bg-emerald-500/[0.04]" : "border-rose-500/20 bg-rose-500/[0.04]"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            {isCorrect
                                ? <Sparkles className="w-4 h-4 text-emerald-400" />
                                : <XCircle className="w-4 h-4 text-rose-400" />
                            }
                            <span className={`text-xs font-mono font-bold ${isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
                                {isCorrect
                                    ? streak > 2 ? `Correct! 🔥 ${streak} in a row!` : "Correct!"
                                    : `Not quite — it's ${challenge.answer}.`
                                }
                            </span>
                        </div>
                        <p className="text-[10px] text-white/40 leading-relaxed">{challenge.explanation}</p>
                        {/* Key indicators */}
                        <div className="flex flex-wrap gap-2">
                            {challenge.indicators.map(ind => (
                                <div key={ind.label} className="flex items-center gap-1.5 bg-black/30 rounded-md px-2 py-1">
                                    <span className="text-[7px] font-mono text-white/20 uppercase">{ind.label}</span>
                                    <span className={`text-[8px] font-mono font-bold ${ind.color}`}>{ind.value}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between items-center">
                <button onClick={reset} className="flex items-center gap-1.5 text-[10px] font-mono text-white/25 hover:text-white/50 transition-colors">
                    <RotateCcw className="w-3 h-3" /> Restart
                </button>
                {revealed && !done && (
                    <motion.button
                        onClick={next}
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                        className="px-5 py-2.5 rounded-xl bg-violet-500/15 border border-violet-500/30 text-xs font-mono font-bold text-violet-400 hover:bg-violet-500/25 transition-colors"
                    >
                        Next Case →
                    </motion.button>
                )}
                {done && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-1">
                        <p className="text-sm font-mono font-bold text-violet-400">
                            {score === CHALLENGES.length ? "🏆 Perfect detective!" : score >= 4 ? "Good eye! 👁️" : "Keep practicing 🔍"}
                        </p>
                        <p className="text-[9px] font-mono text-white/20">
                            {score}/{CHALLENGES.length} correct · best streak: {bestStreak}
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
