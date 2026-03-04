"use client";

import { useCallback, useRef, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";

/*
  EmbeddingPredictionChallenge
  "Where will this letter end up?" guessing game.
  Shows a 2D scatter of known embeddings, asks user to click where
  they think a mystery character will land, then reveals the actual position.
*/

interface Point { x: number; y: number }

// Curated 2D positions that show clear vowel/consonant clustering
const KNOWN_EMBEDDINGS: Record<string, Point & { group: string }> = {
    a: { x: 0.65, y: 0.72, group: "vowel" },
    e: { x: 0.58, y: 0.78, group: "vowel" },
    i: { x: 0.52, y: 0.68, group: "vowel" },
    o: { x: 0.70, y: 0.65, group: "vowel" },
    b: { x: -0.45, y: 0.30, group: "consonant" },
    d: { x: -0.38, y: 0.35, group: "consonant" },
    t: { x: -0.42, y: 0.42, group: "consonant" },
    s: { x: -0.30, y: 0.48, group: "consonant" },
    n: { x: -0.25, y: 0.52, group: "consonant" },
    h: { x: -0.20, y: 0.20, group: "consonant" },
    r: { x: -0.15, y: 0.45, group: "consonant" },
    ".": { x: -0.70, y: -0.65, group: "special" },
    " ": { x: -0.60, y: -0.55, group: "special" },
};

// Mystery characters with their actual positions (hidden until reveal)
const CHALLENGES: { char: string; actual: Point; group: string; hint: string }[] = [
    { char: "u", actual: { x: 0.62, y: 0.60 }, group: "vowel", hint: "It's a vowel..." },
    { char: "p", actual: { x: -0.48, y: 0.38 }, group: "consonant", hint: "It's a stop consonant like 'b' and 'd'..." },
    { char: "l", actual: { x: -0.18, y: 0.50 }, group: "consonant", hint: "It's a liquid consonant, similar to 'r'..." },
    { char: "z", actual: { x: -0.55, y: 0.15 }, group: "consonant", hint: "It's a rare consonant..." },
];

const W = 340;
const H = 340;
const PAD = 35;

function toSvg(p: Point): { cx: number; cy: number } {
    return {
        cx: PAD + ((p.x + 1) / 2) * (W - 2 * PAD),
        cy: PAD + ((1 - (p.y + 1) / 2)) * (H - 2 * PAD),
    };
}

function fromSvg(cx: number, cy: number): Point {
    return {
        x: ((cx - PAD) / (W - 2 * PAD)) * 2 - 1,
        y: 1 - ((cy - PAD) / (H - 2 * PAD)) * 2,
    };
}

function distance(a: Point, b: Point): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

const GROUP_COLORS: Record<string, string> = {
    vowel: "#34d399",
    consonant: "#a78bfa",
    special: "#f59e0b",
};

export function EmbeddingPredictionChallenge() {
    const [challengeIdx, setChallengeIdx] = useState(0);
    const [guess, setGuess] = useState<Point | null>(null);
    const [revealed, setRevealed] = useState(false);
    const [score, setScore] = useState<number[]>([]);
    const svgRef = useRef<SVGSVGElement>(null);

    const challenge = CHALLENGES[challengeIdx];
    const isComplete = challengeIdx >= CHALLENGES.length;

    const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        if (revealed || isComplete) return;
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const cx = ((e.clientX - rect.left) / rect.width) * W;
        const cy = ((e.clientY - rect.top) / rect.height) * H;
        setGuess(fromSvg(cx, cy));
    }, [revealed, isComplete]);

    const handleReveal = () => {
        if (!guess) return;
        setRevealed(true);
        const dist = distance(guess, challenge.actual);
        // Score: 0-100 based on distance (0.0 = 100, 1.0+ = 0)
        const s = Math.max(0, Math.round((1 - dist / 1.0) * 100));
        setScore(prev => [...prev, s]);
    };

    const handleNext = () => {
        setChallengeIdx(prev => prev + 1);
        setGuess(null);
        setRevealed(false);
    };

    const totalScore = score.reduce((a, b) => a + b, 0);
    const avgScore = score.length > 0 ? Math.round(totalScore / score.length) : 0;

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-white/25 uppercase tracking-widest">
                        Challenge {Math.min(challengeIdx + 1, CHALLENGES.length)}/{CHALLENGES.length}
                    </span>
                    {score.length > 0 && (
                        <span className="text-[10px] font-mono text-emerald-400/60">
                            Avg: {avgScore}/100
                        </span>
                    )}
                </div>
                {!isComplete && (
                    <span className="text-sm font-mono font-bold text-violet-300">
                        Where will &quot;{challenge.char}&quot; land?
                    </span>
                )}
            </div>

            {!isComplete && (
                <p className="text-[10px] font-mono text-white/30 text-center italic">
                    {challenge.hint} Click the scatter plot to place your guess.
                </p>
            )}

            <div className="flex flex-col md:flex-row items-center gap-4">
                {/* SVG scatter */}
                <svg
                    ref={svgRef}
                    width={W}
                    height={H}
                    viewBox={`0 0 ${W} ${H}`}
                    className="bg-white/[0.02] rounded-xl border border-white/[0.06] cursor-crosshair select-none shrink-0"
                    onClick={handleClick}
                >
                    {/* Known embeddings */}
                    {Object.entries(KNOWN_EMBEDDINGS).map(([ch, { x, y, group }]) => {
                        const { cx, cy } = toSvg({ x, y });
                        return (
                            <g key={ch}>
                                <circle cx={cx} cy={cy} r={5} fill={GROUP_COLORS[group]} fillOpacity={0.6} />
                                <text x={cx + 7} y={cy + 3} fill={GROUP_COLORS[group]} fontSize={9} fontFamily="monospace" fillOpacity={0.7}>
                                    {ch === " " ? "⎵" : ch}
                                </text>
                            </g>
                        );
                    })}

                    {/* Guess marker */}
                    {guess && !isComplete && (() => {
                        const { cx, cy } = toSvg(guess);
                        return (
                            <>
                                <circle cx={cx} cy={cy} r={8} fill="none" stroke="#f472b6" strokeWidth={2} strokeDasharray="3 2" />
                                <text x={cx + 10} y={cy + 3} fill="#f472b6" fontSize={10} fontFamily="monospace" fontWeight="bold">
                                    {challenge.char}?
                                </text>
                            </>
                        );
                    })()}

                    {/* Revealed actual position */}
                    {revealed && (() => {
                        const { cx, cy } = toSvg(challenge.actual);
                        const gSvg = guess ? toSvg(guess) : null;
                        return (
                            <>
                                {gSvg && (
                                    <line x1={gSvg.cx} y1={gSvg.cy} x2={cx} y2={cy} stroke="#f472b6" strokeWidth={1} strokeOpacity={0.3} strokeDasharray="3 2" />
                                )}
                                <motion.circle
                                    cx={cx} cy={cy} r={8}
                                    fill={GROUP_COLORS[challenge.group]}
                                    fillOpacity={0.9}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                />
                                <text x={cx + 10} y={cy + 3} fill={GROUP_COLORS[challenge.group]} fontSize={10} fontFamily="monospace" fontWeight="bold">
                                    {challenge.char}
                                </text>
                            </>
                        );
                    })()}

                    {/* Legend */}
                    {[
                        { label: "Vowels", color: GROUP_COLORS.vowel, y: 15 },
                        { label: "Consonants", color: GROUP_COLORS.consonant, y: 27 },
                        { label: "Special", color: GROUP_COLORS.special, y: 39 },
                    ].map(l => (
                        <g key={l.label}>
                            <circle cx={W - 75} cy={l.y} r={3} fill={l.color} fillOpacity={0.6} />
                            <text x={W - 68} y={l.y + 3} fill="white" fillOpacity={0.2} fontSize={8} fontFamily="monospace">{l.label}</text>
                        </g>
                    ))}
                </svg>

                {/* Actions & feedback */}
                <div className="flex-1 space-y-3 min-w-[180px]">
                    <AnimatePresence mode="wait">
                        {isComplete ? (
                            <motion.div
                                key="complete"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5 text-center space-y-3"
                            >
                                <p className="text-lg font-mono font-bold text-emerald-300">
                                    Final Score: {avgScore}/100
                                </p>
                                <p className="text-[11px] font-mono text-white/40 leading-relaxed">
                                    {avgScore >= 70
                                        ? "Excellent! You've built strong intuition for how embeddings cluster similar characters."
                                        : avgScore >= 40
                                            ? "Good effort! The key insight: similar characters end up in similar regions of the embedding space."
                                            : "The patterns become clearer with practice. The key: vowels cluster together, consonants by type, and special characters in their own region."
                                    }
                                </p>
                                <button
                                    onClick={() => { setChallengeIdx(0); setScore([]); setGuess(null); setRevealed(false); }}
                                    className="px-4 py-1.5 rounded-lg text-[11px] font-mono border border-white/10 bg-white/[0.03] text-white/40 hover:text-white/60 transition-all"
                                >
                                    Play again
                                </button>
                            </motion.div>
                        ) : revealed ? (
                            <motion.div
                                key="revealed"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-3"
                            >
                                <div className={`rounded-xl border p-4 text-center ${
                                    score[score.length - 1] >= 60
                                        ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                                        : "border-amber-500/20 bg-amber-500/[0.04]"
                                }`}>
                                    <p className="text-lg font-mono font-bold text-white/60">
                                        Score: <span className={score[score.length - 1] >= 60 ? "text-emerald-300" : "text-amber-300"}>
                                            {score[score.length - 1]}/100
                                        </span>
                                    </p>
                                    <p className="text-[10px] font-mono text-white/25 mt-1">
                                        {score[score.length - 1] >= 80
                                            ? "Spot on! You predicted the cluster correctly."
                                            : score[score.length - 1] >= 50
                                                ? "Close! You got the right region."
                                                : "The actual position is in the " + challenge.group + " cluster."
                                        }
                                    </p>
                                </div>
                                <button
                                    onClick={handleNext}
                                    className="w-full px-4 py-2 rounded-lg text-sm font-mono font-bold border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-all"
                                >
                                    Next challenge →
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div key="guess" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                                    <p className="text-[11px] font-mono text-white/30">
                                        {guess
                                            ? `You placed "${challenge.char}" at (${guess.x.toFixed(2)}, ${guess.y.toFixed(2)})`
                                            : "Click on the scatter plot to place your guess"
                                        }
                                    </p>
                                </div>
                                <button
                                    onClick={handleReveal}
                                    disabled={!guess}
                                    className={`w-full px-4 py-2 rounded-lg text-sm font-mono font-bold border transition-all ${
                                        guess
                                            ? "border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20"
                                            : "border-white/10 bg-white/[0.03] text-white/15 cursor-not-allowed"
                                    }`}
                                >
                                    Reveal actual position
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
