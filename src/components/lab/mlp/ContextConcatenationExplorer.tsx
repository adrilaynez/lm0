"use client";

import { memo, useMemo, useState } from "react";

import { motion } from "framer-motion";

/*
  ContextConcatenationExplorer
  User picks 3 characters from a visual alphabet grid.
  Shows how each character becomes a one-hot vector, then all 3 are concatenated
  into a single long input vector. Builds intuition for context → input.
*/

const ALPHABET = "abcdefghijklmnopqrstuvwxyz.".split("");
const V = ALPHABET.length; // 27

function oneHotIndex(char: string): number {
    return ALPHABET.indexOf(char);
}

interface OneHotBarProps {
    index: number;
    total: number;
    label: string;
    color: string;
    delay: number;
}

const OneHotBar = memo(function OneHotBar({ index, total, label, color, delay }: OneHotBarProps) {
    return (
        <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-mono font-bold" style={{ color }}>
                &apos;{label}&apos;
            </span>
            <div className="flex gap-[1px]">
                {Array.from({ length: total }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        transition={{ duration: 0.15, delay: delay + i * 0.008 }}
                        className="rounded-[1px]"
                        style={{
                            width: 3,
                            height: i === index ? 18 : 10,
                            backgroundColor: i === index ? color : "rgba(255,255,255,0.08)",
                        }}
                    />
                ))}
            </div>
            <span className="text-[8px] font-mono text-white/20">
                {V} dims
            </span>
        </div>
    );
});

export function ContextConcatenationExplorer() {
    const [selected, setSelected] = useState<string[]>(["t", "h", "e"]);

    const contextSize = selected.length;

    const toggleChar = (char: string, pos: number) => {
        setSelected(prev => {
            const next = [...prev];
            next[pos] = char;
            return next;
        });
    };

    const concatenated = useMemo(() => {
        return selected.map(ch => {
            const idx = oneHotIndex(ch);
            return Array.from({ length: V }, (_, i) => i === idx ? 1 : 0);
        }).flat();
    }, [selected]);

    const COLORS = ["#a78bfa", "#60a5fa", "#34d399"];

    return (
        <div className="p-4 sm:p-5 space-y-5">
            {/* Character selectors */}
            <div className="flex flex-col sm:flex-row gap-4 items-start">
                {[0, 1, 2].map(pos => (
                    <div key={pos} className="flex-1 min-w-0">
                        <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: COLORS[pos] }}>
                            Position {pos + 1}
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {ALPHABET.map(ch => (
                                <button
                                    key={ch}
                                    onClick={() => toggleChar(ch, pos)}
                                    className="w-6 h-6 rounded text-[11px] font-mono font-bold transition-all"
                                    style={{
                                        backgroundColor: selected[pos] === ch ? COLORS[pos] + "30" : "rgba(255,255,255,0.03)",
                                        color: selected[pos] === ch ? COLORS[pos] : "rgba(255,255,255,0.3)",
                                        borderWidth: 1,
                                        borderColor: selected[pos] === ch ? COLORS[pos] + "60" : "rgba(255,255,255,0.06)",
                                    }}
                                >
                                    {ch}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Individual one-hot vectors */}
            <div className="flex flex-wrap gap-6 justify-center items-end">
                {selected.map((ch, i) => (
                    <OneHotBar
                        key={`${i}-${ch}`}
                        index={oneHotIndex(ch)}
                        total={V}
                        label={ch}
                        color={COLORS[i]}
                        delay={i * 0.1}
                    />
                ))}
            </div>

            {/* Arrow + concatenation */}
            <div className="flex items-center gap-3 justify-center text-white/20">
                <span className="text-xs font-mono">concat</span>
                <span>→</span>
            </div>

            {/* Concatenated vector */}
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-widest">
                        Input vector
                    </span>
                    <span className="text-[10px] font-mono text-white/25">
                        ({contextSize} × {V} = {contextSize * V} dimensions)
                    </span>
                </div>
                <div className="flex gap-[1px] flex-wrap">
                    {concatenated.map((val, i) => {
                        const segmentIdx = Math.floor(i / V);
                        const color = COLORS[segmentIdx] || COLORS[0];
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.1, delay: i * 0.003 }}
                                className="rounded-[1px]"
                                style={{
                                    width: 3,
                                    height: val === 1 ? 20 : 8,
                                    backgroundColor: val === 1 ? color : "rgba(255,255,255,0.06)",
                                }}
                                title={`dim ${i}: ${val}`}
                            />
                        );
                    })}
                </div>
                <div className="flex gap-0 mt-1">
                    {selected.map((_, i) => (
                        <div
                            key={i}
                            className="h-[2px] rounded-full"
                            style={{
                                width: `${100 / contextSize}%`,
                                backgroundColor: COLORS[i] + "40",
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Insight */}
            <p className="text-[11px] text-white/30 text-center italic">
                Each character becomes a {V}-dimensional one-hot vector. Concatenating {contextSize} of them gives a {contextSize * V}-dimensional input to the network.
            </p>
        </div>
    );
}
