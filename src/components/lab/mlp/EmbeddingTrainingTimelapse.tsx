"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Pause, Play } from "lucide-react";

import { fetchMLPEmbedding } from "@/lib/lmLabClient";
import type { MLPEmbeddingResponse } from "@/types/lmLab";

/*
  EmbeddingTrainingTimelapse
  Shows how embedding space evolves during training using real backend snapshots.
  Uses a default config (emb_dim=2) so we can plot directly in 2D.
  Snapshot steps: 0, 1000, 5000, 10000, 20000, 50000.
*/

const SNAPSHOT_STEPS = [0, 1000, 5000, 10000, 20000, 50000];
const STEP_LABELS = ["Step 0", "Step 1k", "Step 5k", "Step 10k", "Step 20k", "Step 50k"];

const DEFAULT_CONFIG = { embedding_dim: 2, hidden_size: 64, learning_rate: 0.01 };

const VOWELS = new Set(["a", "e", "i", "o", "u"]);
const SPECIAL = new Set([".", " "]);

function charColor(ch: string): string {
    if (VOWELS.has(ch)) return "#f59e0b";
    if (SPECIAL.has(ch)) return "#6b7280";
    return "#8b5cf6";
}

function charGroup(ch: string): string {
    if (VOWELS.has(ch)) return "Vowel";
    if (SPECIAL.has(ch)) return "Special";
    return "Consonant";
}

export function EmbeddingTrainingTimelapse() {
    const [snapshots, setSnapshots] = useState<(MLPEmbeddingResponse | null)[]>(
        () => SNAPSHOT_STEPS.map(() => null)
    );
    const [currentIdx, setCurrentIdx] = useState(0);
    const [loading, setLoading] = useState(true);
    const [playing, setPlaying] = useState(false);
    const [hoveredChar, setHoveredChar] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Fetch all snapshots on mount
    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        Promise.all(
            SNAPSHOT_STEPS.map(step =>
                fetchMLPEmbedding(
                    DEFAULT_CONFIG.embedding_dim,
                    DEFAULT_CONFIG.hidden_size,
                    DEFAULT_CONFIG.learning_rate,
                    step
                ).catch(() => null)
            )
        ).then(results => {
            if (!cancelled) {
                setSnapshots(results);
                setLoading(false);
            }
        });

        return () => { cancelled = true; };
    }, []);

    // Auto-play
    useEffect(() => {
        if (playing) {
            intervalRef.current = setInterval(() => {
                setCurrentIdx(prev => {
                    if (prev >= SNAPSHOT_STEPS.length - 1) {
                        setPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1200);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [playing]);

    const handlePlay = useCallback(() => {
        if (currentIdx >= SNAPSHOT_STEPS.length - 1) setCurrentIdx(0);
        setPlaying(true);
    }, [currentIdx]);

    const currentSnapshot = snapshots[currentIdx];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-white/30">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading training snapshots…
            </div>
        );
    }

    if (!currentSnapshot) {
        return (
            <div className="flex items-center justify-center h-64 text-white/30 text-sm">
                No embedding data available. The backend may be offline.
            </div>
        );
    }

    // Compute bounds for consistent scaling across snapshots
    const allPoints = snapshots.filter(Boolean).flatMap(s => s!.embedding_matrix);
    const xMin = Math.min(...allPoints.map(p => p[0]));
    const xMax = Math.max(...allPoints.map(p => p[0]));
    const yMin = Math.min(...allPoints.map(p => p[1]));
    const yMax = Math.max(...allPoints.map(p => p[1]));
    const pad = 0.15;
    const xRange = (xMax - xMin) || 1;
    const yRange = (yMax - yMin) || 1;

    const toSvgX = (x: number) => 20 + ((x - xMin + xRange * pad) / (xRange * (1 + 2 * pad))) * 360;
    const toSvgY = (y: number) => 20 + ((yMax - y + yRange * pad) / (yRange * (1 + 2 * pad))) * 280;

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Step selector */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => playing ? setPlaying(false) : handlePlay()}
                    className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
                >
                    {playing ? <Pause className="w-4 h-4 text-white/60" /> : <Play className="w-4 h-4 text-white/60" />}
                </button>
                <div className="flex gap-1.5 flex-1">
                    {STEP_LABELS.map((label, i) => (
                        <button
                            key={i}
                            onClick={() => { setPlaying(false); setCurrentIdx(i); }}
                            className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-mono font-bold transition-all border ${
                                currentIdx === i
                                    ? "bg-violet-500/15 border-violet-500/30 text-violet-400"
                                    : "bg-white/[0.03] border-white/[0.08] text-white/30 hover:text-white/50"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex gap-4 text-[9px] font-mono text-white/40">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Vowels</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500" /> Consonants</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-500" /> Special</span>
            </div>

            {/* Scatter plot */}
            <div className="relative">
                <svg viewBox="0 0 400 320" className="w-full" style={{ maxHeight: 340 }}>
                    {/* Grid */}
                    <line x1="20" y1="160" x2="380" y2="160" stroke="white" strokeOpacity="0.06" />
                    <line x1="200" y1="20" x2="200" y2="300" stroke="white" strokeOpacity="0.06" />

                    {/* Points */}
                    <AnimatePresence mode="popLayout">
                        {currentSnapshot.vocab.map((ch, i) => {
                            const [x, y] = currentSnapshot.embedding_matrix[i] ?? [0, 0];
                            const sx = toSvgX(x);
                            const sy = toSvgY(y);
                            const isHovered = hoveredChar === ch;
                            return (
                                <motion.g
                                    key={ch}
                                    initial={{ cx: sx, cy: sy }}
                                    animate={{ cx: sx, cy: sy }}
                                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                                >
                                    <circle
                                        cx={sx}
                                        cy={sy}
                                        r={isHovered ? 8 : 5}
                                        fill={charColor(ch)}
                                        fillOpacity={isHovered ? 0.9 : 0.7}
                                        stroke={isHovered ? "white" : "none"}
                                        strokeWidth={1.5}
                                        onMouseEnter={() => setHoveredChar(ch)}
                                        onMouseLeave={() => setHoveredChar(null)}
                                        className="cursor-pointer transition-all"
                                    />
                                    <text
                                        x={sx}
                                        y={sy - 9}
                                        textAnchor="middle"
                                        fontSize={isHovered ? 12 : 9}
                                        fill="white"
                                        fillOpacity={isHovered ? 0.9 : 0.5}
                                        fontFamily="monospace"
                                        fontWeight={isHovered ? "bold" : "normal"}
                                    >
                                        {ch === " " ? "·" : ch}
                                    </text>
                                </motion.g>
                            );
                        })}
                    </AnimatePresence>
                </svg>

                {/* Hovered char info */}
                {hoveredChar && (
                    <div className="absolute top-2 right-2 bg-black/80 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono">
                        <span className="text-white/80 font-bold">{hoveredChar === " " ? "SPACE" : hoveredChar}</span>
                        <span className="text-white/40 ml-2">{charGroup(hoveredChar)}</span>
                    </div>
                )}
            </div>

            {/* Progress bar */}
            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                    className="h-full bg-violet-500/40 rounded-full"
                    animate={{ width: `${((currentIdx + 1) / SNAPSHOT_STEPS.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>
        </div>
    );
}
