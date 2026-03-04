"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  OneHotVisualizer
  Row of 27 cells (a-z + space). Click a letter to select it.
  Shows the one-hot vector representation below.
  ~200px height, fits FigureWrapper.
*/

const ALPHABET = "abcdefghijklmnopqrstuvwxyz.".split("");
const V = ALPHABET.length; // 27

export function OneHotVisualizer() {
    const [selected, setSelected] = useState(0); // index into ALPHABET

    const displayChar = (ch: string) => (ch === "." ? "·" : ch);

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Character grid */}
            <div className="flex flex-wrap gap-1 justify-center">
                {ALPHABET.map((ch, i) => {
                    const isActive = i === selected;
                    return (
                        <motion.button
                            key={ch}
                            onClick={() => setSelected(i)}
                            whileTap={{ scale: 0.92 }}
                            className="w-8 h-8 rounded-md text-sm font-mono font-bold transition-all border"
                            style={{
                                backgroundColor: isActive ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.03)",
                                color: isActive ? "#a78bfa" : "rgba(255,255,255,0.3)",
                                borderColor: isActive ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.06)",
                                boxShadow: isActive ? "0 0 12px rgba(139,92,246,0.15)" : "none",
                            }}
                        >
                            {displayChar(ch)}
                        </motion.button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* The Problem: Integer ID */}
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.03] p-4 flex flex-col items-center justify-center relative min-h-[140px]">
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500/50" />
                        <span className="text-[9px] font-mono font-bold text-rose-400/70 uppercase tracking-widest">Integer ID</span>
                    </div>

                    <div className="mt-5 flex flex-col items-center text-center">
                        <motion.div
                            key={`int-${selected}`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-4xl font-mono font-bold text-rose-400 mb-2 drop-shadow-sm"
                        >
                            {selected}
                        </motion.div>
                        <p className="text-[11px] text-white/50 leading-relaxed px-2">
                            {selected === 0 ? (
                                <span>&apos;a&apos; is 0.<br />This is our baseline.</span>
                            ) : selected === 25 ? (
                                <span>&apos;z&apos; is 25.<br />The math implies &apos;z&apos; is 25× bigger than &apos;a&apos;!</span>
                            ) : (
                                <span>&apos;{displayChar(ALPHABET[selected])}&apos; is {selected}.<br />The math imposes a false hierarchy.</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* The Solution: One Hot */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4 flex flex-col items-center justify-center relative min-h-[140px]">
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                        <span className="text-[9px] font-mono font-bold text-emerald-400/70 uppercase tracking-widest">One-Hot Vector</span>
                    </div>

                    <div className="mt-5 w-full">
                        <div className="flex gap-[2px] justify-center items-end h-[36px] mb-3">
                            {Array.from({ length: V }).map((_, i) => {
                                const isOne = i === selected;
                                return (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            height: isOne ? 36 : 8,
                                            backgroundColor: isOne ? "#10b981" : "rgba(255,255,255,0.08)",
                                        }}
                                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                        className="rounded-[2px]"
                                        style={{ width: Math.max(2, Math.min(5, 180 / V)) }}
                                    />
                                );
                            })}
                        </div>
                        <p className="text-[9px] font-mono text-center text-white/40 break-all leading-relaxed px-1">
                            [<span className="text-emerald-400 font-bold">{
                                Array.from({ length: V }).map((_, i) => i === selected ? "1" : "0").join(",")
                            }</span>]
                        </p>
                    </div>
                </div>
            </div>

            {/* Label */}
            <p className="text-[11px] text-white/40 text-center italic">
                By giving each letter its own dedicated dimension, every character becomes exactly equally different from every other.
            </p>
        </div>
    );
}
