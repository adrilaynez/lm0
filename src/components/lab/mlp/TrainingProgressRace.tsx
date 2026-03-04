"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { motion } from "framer-motion";

/*
  TrainingProgressRace
  Animated "race" between different configs training simultaneously.
  Shows loss bars shrinking over time, highlighting which config
  converges fastest and which diverges.
*/

type RacerConfig = {
    id: string;
    label: string;
    color: string;
    lossCurve: number[]; // loss at each "frame" (50 frames)
    finalLoss: number;
    diverged: boolean;
};

// 50-frame loss curves for 5 different configs
const RACERS: RacerConfig[] = [
    {
        id: "small",
        label: "E=2 H=32",
        color: "#9ca3af",
        lossCurve: [3.30, 3.15, 3.02, 2.90, 2.82, 2.76, 2.71, 2.67, 2.64, 2.62, 2.60, 2.58, 2.57, 2.56, 2.55, 2.54, 2.53, 2.53, 2.52, 2.52, 2.51, 2.51, 2.51, 2.50, 2.50, 2.50, 2.50, 2.49, 2.49, 2.49, 2.49, 2.49, 2.48, 2.48, 2.48, 2.48, 2.48, 2.48, 2.48, 2.48, 2.48, 2.48, 2.48, 2.48, 2.48, 2.48, 2.48, 2.48, 2.48, 2.48],
        finalLoss: 2.48,
        diverged: false,
    },
    {
        id: "medium",
        label: "E=10 H=128",
        color: "#8b5cf6",
        lossCurve: [3.30, 3.05, 2.82, 2.63, 2.48, 2.38, 2.30, 2.24, 2.19, 2.15, 2.12, 2.10, 2.08, 2.07, 2.06, 2.05, 2.04, 2.04, 2.03, 2.03, 2.02, 2.02, 2.02, 2.01, 2.01, 2.01, 2.01, 2.01, 2.01, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00],
        finalLoss: 2.00,
        diverged: false,
    },
    {
        id: "large",
        label: "E=16 H=512",
        color: "#10b981",
        lossCurve: [3.30, 3.00, 2.72, 2.50, 2.34, 2.22, 2.13, 2.07, 2.02, 1.98, 1.96, 1.94, 1.93, 1.92, 1.91, 1.91, 1.90, 1.90, 1.90, 1.90, 1.89, 1.89, 1.89, 1.89, 1.89, 1.89, 1.89, 1.89, 1.89, 1.89, 1.89, 1.89, 1.89, 1.89, 1.89, 1.89, 1.89, 1.89, 1.89, 1.89, 1.89, 1.89, 1.89, 1.89, 1.89, 1.89, 1.89, 1.89, 1.89, 1.89],
        finalLoss: 1.89,
        diverged: false,
    },
    {
        id: "fast-lr",
        label: "E=10 H=128 lr=0.2",
        color: "#f59e0b",
        lossCurve: [3.30, 2.80, 2.45, 2.25, 2.15, 2.10, 2.08, 2.10, 2.12, 2.15, 2.18, 2.20, 2.22, 2.24, 2.26, 2.28, 2.29, 2.30, 2.31, 2.32, 2.33, 2.33, 2.34, 2.34, 2.34, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35],
        finalLoss: 2.35,
        diverged: false,
    },
    {
        id: "huge",
        label: "E=32 H=1024",
        color: "#ec4899",
        lossCurve: [3.30, 2.95, 2.65, 2.42, 2.25, 2.13, 2.04, 1.98, 1.94, 1.91, 1.89, 1.88, 1.87, 1.87, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86, 1.86],
        finalLoss: 1.86,
        diverged: false,
    },
];

const TOTAL_FRAMES = 50;
const FRAME_MS = 80;

export function TrainingProgressRace() {
    const [frame, setFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const play = useCallback(() => {
        setIsPlaying(true);
        setFrame(0);
    }, []);

    const reset = useCallback(() => {
        setIsPlaying(false);
        setFrame(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
    }, []);

    useEffect(() => {
        if (!isPlaying) return;
        intervalRef.current = setInterval(() => {
            setFrame(prev => {
                if (prev >= TOTAL_FRAMES - 1) {
                    setIsPlaying(false);
                    return TOTAL_FRAMES - 1;
                }
                return prev + 1;
            });
        }, FRAME_MS);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isPlaying]);

    // Sort racers by current loss (best first)
    const sorted = [...RACERS].sort((a, b) => a.lossCurve[frame] - b.lossCurve[frame]);
    const maxLoss = 3.30;
    const minLoss = 1.80;

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Controls */}
            <div className="flex items-center gap-3">
                <button
                    onClick={isPlaying ? reset : play}
                    className="px-4 py-1.5 rounded-lg text-[10px] font-mono font-bold border border-violet-500/20 bg-violet-500/[0.06] text-violet-300 hover:bg-violet-500/10 transition-colors"
                >
                    {isPlaying ? "⏹ Reset" : frame >= TOTAL_FRAMES - 1 ? "↻ Replay" : "▶ Race!"}
                </button>
                <div className="flex-1 h-1.5 rounded-full bg-white/[0.03] overflow-hidden">
                    <div
                        className="h-full rounded-full bg-violet-500/30 transition-all"
                        style={{ width: `${(frame / (TOTAL_FRAMES - 1)) * 100}%` }}
                    />
                </div>
                <span className="text-[9px] font-mono text-white/20">
                    Step {Math.round((frame / TOTAL_FRAMES) * 50)}K
                </span>
            </div>

            {/* Race bars */}
            <div className="space-y-2">
                {sorted.map((racer, rank) => {
                    const currentLoss = racer.lossCurve[frame];
                    const barWidth = ((maxLoss - currentLoss) / (maxLoss - minLoss)) * 100;
                    return (
                        <div key={racer.id} className="flex items-center gap-2">
                            <span className="text-[8px] font-mono text-white/10 w-4">{rank + 1}.</span>
                            <span className="text-[8px] font-mono w-28 truncate" style={{ color: racer.color }}>
                                {racer.label}
                            </span>
                            <div className="flex-1 h-5 rounded bg-white/[0.02] overflow-hidden relative">
                                <motion.div
                                    className="h-full rounded"
                                    style={{ backgroundColor: `${racer.color}30` }}
                                    animate={{ width: `${Math.max(1, barWidth)}%` }}
                                    transition={{ duration: FRAME_MS / 1000, ease: "linear" }}
                                />
                            </div>
                            <span className="text-[9px] font-mono font-bold w-10 text-right" style={{ color: racer.color }}>
                                {currentLoss.toFixed(2)}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Final standings (only show when race is done) */}
            {frame >= TOTAL_FRAMES - 1 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-lg border border-emerald-500/10 bg-emerald-500/[0.03] px-3 py-2"
                >
                    <p className="text-[9px] font-mono text-emerald-300/50">
                        <span className="font-bold">Race complete!</span> The largest model ({sorted[0].label}) wins with loss {sorted[0].finalLoss.toFixed(2)},
                        but notice: the medium model (E=10 H=128) gets within 0.14 of the winner with far fewer parameters.
                        The fast learning rate (lr=0.2) starts strong but overshoots and finishes worse than a slower rate.
                    </p>
                </motion.div>
            )}
        </div>
    );
}
