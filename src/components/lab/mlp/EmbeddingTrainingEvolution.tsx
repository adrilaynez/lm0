"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, RotateCcw } from "lucide-react";

/*
  EmbeddingTrainingEvolution
  Shows how embeddings evolve from random noise to meaningful clusters
  through simulated gradient descent steps. Characters start scattered
  randomly and gradually organize into vowel/consonant/punctuation clusters.
  
  The user can play/pause/reset and scrub through training epochs.
  This makes the "learned by backpropagation" concept visceral.
*/

const CHARS = ["a", "e", "i", "o", "u", "t", "h", "n", "s", "r", "d", "l", "z", "q", "x", "."];

const VOWELS = new Set(["a", "e", "i", "o", "u"]);
const COMMON = new Set(["t", "h", "n", "s", "r", "d", "l"]);
const RARE = new Set(["z", "q", "x"]);

function getCharColor(ch: string): string {
    if (VOWELS.has(ch)) return "#c084fc";
    if (COMMON.has(ch)) return "#60a5fa";
    if (RARE.has(ch)) return "#fbbf24";
    return "#f87171";
}

function getCategory(ch: string): string {
    if (VOWELS.has(ch)) return "Vowels";
    if (COMMON.has(ch)) return "Common";
    if (RARE.has(ch)) return "Rare";
    return "Punct.";
}

// Target positions — clustered by type
const TARGETS: Record<string, [number, number]> = {
    a: [0.18, 0.25], e: [0.25, 0.18], i: [0.22, 0.35],
    o: [0.14, 0.32], u: [0.28, 0.28],
    t: [0.72, 0.22], h: [0.78, 0.30], n: [0.68, 0.18],
    s: [0.75, 0.38], r: [0.82, 0.24], d: [0.65, 0.30], l: [0.70, 0.36],
    z: [0.78, 0.78], q: [0.85, 0.74], x: [0.72, 0.82],
    ".": [0.20, 0.78],
};

// Generate stable random starting positions (seeded)
function generateRandomPositions(seed: number): Record<string, [number, number]> {
    const positions: Record<string, [number, number]> = {};
    let s = seed;
    const rand = () => { s = (s * 16807 + 0) % 2147483647; return (s & 0x7fffffff) / 0x7fffffff; };
    for (const ch of CHARS) {
        positions[ch] = [0.08 + rand() * 0.84, 0.08 + rand() * 0.84];
    }
    return positions;
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

// Ease-in-out curve for smoother convergence
function easeProgress(t: number): number {
    if (t < 0.3) return t * t * (1 / 0.09); // slow start, accelerate
    return 1 - Math.pow(1 - t, 3); // decelerate at end
}

const TOTAL_EPOCHS = 200;

const LEGEND = [
    { label: "Vowels", color: "#c084fc" },
    { label: "Common", color: "#60a5fa" },
    { label: "Rare", color: "#fbbf24" },
    { label: "Punct.", color: "#f87171" },
];

export function EmbeddingTrainingEvolution() {
    const [epoch, setEpoch] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [seed] = useState(() => Math.floor(Math.random() * 10000) + 1);
    const rafRef = useRef<number>(0);
    const lastTimeRef = useRef(0);

    const randomPositions = useMemo(() => generateRandomPositions(seed), [seed]);

    // Compute interpolated positions for current epoch
    const positions = useMemo(() => {
        const t = easeProgress(epoch / TOTAL_EPOCHS);
        const result: Record<string, [number, number]> = {};
        for (const ch of CHARS) {
            const [rx, ry] = randomPositions[ch];
            const [tx, ty] = TARGETS[ch];
            result[ch] = [lerp(rx, tx, t), lerp(ry, ty, t)];
        }
        return result;
    }, [epoch, randomPositions]);

    // Animation loop
    const animate = useCallback((ts: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = ts;
        const delta = ts - lastTimeRef.current;
        if (delta > 30) {
            lastTimeRef.current = ts;
            setEpoch(prev => {
                if (prev >= TOTAL_EPOCHS) {
                    setPlaying(false);
                    return TOTAL_EPOCHS;
                }
                return prev + 1;
            });
        }
        rafRef.current = requestAnimationFrame(animate);
    }, []);

    useEffect(() => {
        if (playing) {
            lastTimeRef.current = 0;
            rafRef.current = requestAnimationFrame(animate);
        } else {
            cancelAnimationFrame(rafRef.current);
        }
        return () => cancelAnimationFrame(rafRef.current);
    }, [playing, animate]);

    const handleReset = useCallback(() => {
        setPlaying(false);
        setEpoch(0);
        cancelAnimationFrame(rafRef.current);
    }, []);

    const handlePlayPause = useCallback(() => {
        if (epoch >= TOTAL_EPOCHS) {
            setEpoch(0);
            setPlaying(true);
        } else {
            setPlaying(p => !p);
        }
    }, [epoch]);

    const progress = epoch / TOTAL_EPOCHS;
    const W = 340;
    const H = 280;
    const PAD = 16;

    return (
        <div className="p-4 sm:p-5 space-y-3">
            {/* Controls */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handlePlayPause}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-xs font-mono font-bold text-violet-300 transition-colors"
                >
                    {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    {playing ? "Pause" : epoch >= TOTAL_EPOCHS ? "Replay" : "Train"}
                </button>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.08] text-[10px] font-mono text-white/30 hover:text-white/50 transition-colors"
                >
                    <RotateCcw className="w-3 h-3" /> Reset
                </button>
                <div className="flex-1" />
                <span className="text-[10px] font-mono text-white/25 tabular-nums">
                    epoch {epoch}/{TOTAL_EPOCHS}
                </span>
            </div>

            {/* Epoch slider */}
            <input
                type="range"
                min={0}
                max={TOTAL_EPOCHS}
                value={epoch}
                onChange={e => { setPlaying(false); setEpoch(Number(e.target.value)); }}
                className="w-full h-1 appearance-none bg-white/[0.06] rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-400"
            />

            {/* SVG visualization */}
            <div className="relative w-full rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden" style={{ aspectRatio: `${W}/${H}` }}>
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
                    {/* Grid lines */}
                    {[0.25, 0.5, 0.75].map(p => (
                        <g key={p}>
                            <line x1={PAD + p * (W - 2 * PAD)} y1={PAD} x2={PAD + p * (W - 2 * PAD)} y2={H - PAD} stroke="white" strokeOpacity={0.04} />
                            <line x1={PAD} y1={PAD + p * (H - 2 * PAD)} x2={W - PAD} y2={PAD + p * (H - 2 * PAD)} stroke="white" strokeOpacity={0.04} />
                        </g>
                    ))}

                    {/* Cluster labels — fade in as training progresses */}
                    {progress > 0.4 && (
                        <g opacity={Math.min(1, (progress - 0.4) / 0.3)}>
                            <text x={PAD + 0.20 * (W - 2 * PAD)} y={PAD + 0.10 * (H - 2 * PAD)} textAnchor="middle" className="text-[8px] font-mono font-bold" fill="#c084fc" fillOpacity={0.4}>Vowels</text>
                            <text x={PAD + 0.73 * (W - 2 * PAD)} y={PAD + 0.08 * (H - 2 * PAD)} textAnchor="middle" className="text-[8px] font-mono font-bold" fill="#60a5fa" fillOpacity={0.4}>Common</text>
                            <text x={PAD + 0.78 * (W - 2 * PAD)} y={PAD + 0.68 * (H - 2 * PAD)} textAnchor="middle" className="text-[8px] font-mono font-bold" fill="#fbbf24" fillOpacity={0.4}>Rare</text>
                        </g>
                    )}

                    {/* Character dots */}
                    {CHARS.map(ch => {
                        const [nx, ny] = positions[ch];
                        const x = PAD + nx * (W - 2 * PAD);
                        const y = PAD + ny * (H - 2 * PAD);
                        const color = getCharColor(ch);
                        return (
                            <g key={ch}>
                                <circle cx={x} cy={y} r={10} fill={color} fillOpacity={0.15} />
                                <circle cx={x} cy={y} r={6} fill={color} fillOpacity={0.7} />
                                <text
                                    x={x} y={y}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    className="text-[8px] font-mono font-bold select-none pointer-events-none"
                                    fill="white"
                                    fillOpacity={0.9}
                                >
                                    {ch}
                                </text>
                            </g>
                        );
                    })}
                </svg>

                {/* Phase label */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={epoch === 0 ? "random" : epoch >= TOTAL_EPOCHS ? "trained" : "training"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[8px] font-mono font-bold"
                        style={{
                            backgroundColor: epoch === 0 ? "rgba(244,63,94,0.15)" : epoch >= TOTAL_EPOCHS ? "rgba(52,211,153,0.15)" : "rgba(167,139,250,0.15)",
                            color: epoch === 0 ? "#f43f5e" : epoch >= TOTAL_EPOCHS ? "#34d399" : "#a78bfa",
                        }}
                    >
                        {epoch === 0 ? "Random init" : epoch >= TOTAL_EPOCHS ? "Trained ✓" : "Training..."}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 justify-center">
                {LEGEND.map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, opacity: 0.7 }} />
                        <span className="text-[9px] font-mono text-white/30">{label}</span>
                    </div>
                ))}
            </div>

            {/* Insight */}
            <AnimatePresence>
                {epoch >= TOTAL_EPOCHS && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-3"
                    >
                        <p className="text-[11px] text-white/50 leading-relaxed">
                            <strong className="text-emerald-300/80">The network discovered these clusters on its own.</strong>{" "}
                            Nobody told it that &apos;a&apos; and &apos;e&apos; are vowels — it learned that they behave similarly in language.
                            Each character&apos;s position is its <em>embedding</em>: a set of numbers refined by backpropagation.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
