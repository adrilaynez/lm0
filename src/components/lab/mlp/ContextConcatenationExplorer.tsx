"use client";

import { memo, useMemo, useState } from "react";

import { motion } from "framer-motion";

/*
  ContextConcatenationExplorer
  User picks 3 characters. Shows one-hot → concatenation into a single vector.
  Redesigned: compact selectors, clearer visual flow, better aesthetics.
*/

const ALPHABET = "abcdefghijklmnopqrstuvwxyz.".split("");
const V = ALPHABET.length; // 27

function oneHotIndex(char: string): number {
    return ALPHABET.indexOf(char);
}

const COLORS = ["#a78bfa", "#60a5fa", "#34d399"];
const POS_LABELS = ["Position 1", "Position 2", "Position 3"];

const OneHotBar = memo(function OneHotBar({ index, total, label, color }: { index: number; total: number; label: string; color: string }) {
    return (
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-mono font-bold" style={{ color }}>&apos;{label}&apos;</span>
                <span className="text-[9px] font-mono text-white/20">{total} dims</span>
            </div>
            <div className="flex gap-[2px] h-6 items-end">
                {Array.from({ length: total }).map((_, i) => (
                    <div
                        key={i}
                        className="flex-1 rounded-sm transition-all duration-200"
                        style={{
                            height: i === index ? "100%" : "40%",
                            backgroundColor: i === index ? color : "rgba(255,255,255,0.06)",
                        }}
                    />
                ))}
            </div>
        </div>
    );
});

export function ContextConcatenationExplorer() {
    const [selected, setSelected] = useState<string[]>(["t", "h", "e"]);
    const contextSize = selected.length;

    const setChar = (char: string, pos: number) => {
        setSelected(prev => { const next = [...prev]; next[pos] = char; return next; });
    };

    const concatenated = useMemo(() => {
        return selected.map(ch => {
            const idx = oneHotIndex(ch);
            return Array.from({ length: V }, (_, i) => i === idx ? 1 : 0);
        }).flat();
    }, [selected]);

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {/* ── Character selectors: compact row of 3 ── */}
            <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map(pos => (
                    <div key={pos}>
                        <p className="text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: COLORS[pos] }}>
                            {POS_LABELS[pos]}
                        </p>
                        <div className="grid grid-cols-9 gap-[3px]">
                            {ALPHABET.map(ch => (
                                <button
                                    key={ch}
                                    onClick={() => setChar(ch, pos)}
                                    className="aspect-square rounded text-[10px] font-mono font-bold transition-all"
                                    style={{
                                        backgroundColor: selected[pos] === ch ? COLORS[pos] + "30" : "rgba(255,255,255,0.03)",
                                        color: selected[pos] === ch ? COLORS[pos] : "rgba(255,255,255,0.25)",
                                        boxShadow: selected[pos] === ch ? `0 0 0 1px ${COLORS[pos]}60` : "0 0 0 1px rgba(255,255,255,0.06)",
                                    }}
                                >
                                    {ch}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Individual one-hot vectors ── */}
            <div className="flex gap-4">
                {selected.map((ch, i) => (
                    <OneHotBar key={`${i}-${ch}`} index={oneHotIndex(ch)} total={V} label={ch} color={COLORS[i]} />
                ))}
            </div>

            {/* ── Flow arrow ── */}
            <div className="flex items-center gap-2 justify-center py-1">
                <div className="h-px flex-1 max-w-16 bg-white/10" />
                <span className="text-[10px] font-mono text-white/25 uppercase tracking-widest">concatenate →</span>
                <div className="h-px flex-1 max-w-16 bg-white/10" />
            </div>

            {/* ── Concatenated result ── */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-bold text-white/60 uppercase tracking-widest">
                        Input Vector
                    </span>
                    <span className="text-[11px] font-mono text-white/30">
                        {contextSize} × {V} = <span className="text-white/50 font-bold">{contextSize * V} dimensions</span>
                    </span>
                </div>

                {/* The big concatenated bar */}
                <div className="flex gap-[2px] h-7 items-end">
                    {concatenated.map((val, i) => {
                        const seg = Math.floor(i / V);
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.08, delay: i * 0.002 }}
                                className="flex-1 rounded-sm"
                                style={{
                                    height: val === 1 ? "100%" : "30%",
                                    backgroundColor: val === 1 ? COLORS[seg] : "rgba(255,255,255,0.04)",
                                }}
                            />
                        );
                    })}
                </div>

                {/* Segment color strip */}
                <div className="flex gap-0 h-1 rounded-full overflow-hidden">
                    {selected.map((_, i) => (
                        <div key={i} className="flex-1 rounded-full" style={{ backgroundColor: COLORS[i] + "35" }} />
                    ))}
                </div>

                {/* Legend */}
                <div className="flex gap-4 justify-center">
                    {selected.map((ch, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: COLORS[i] }} />
                            <span className="text-[10px] font-mono text-white/30">&apos;{ch}&apos; dims {i * V}–{(i + 1) * V - 1}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
