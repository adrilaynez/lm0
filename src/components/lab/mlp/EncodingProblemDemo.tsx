"use client";

import { useMemo, useState } from "react";

import { motion } from "framer-motion";

/*
  EncodingProblemDemo
  Shows WHY integer encoding fails for neural networks.
  Two panels: integer (misleading distances) vs one-hot (equal distances).
  Simplified layout — no fake neuron outputs, just distance comparison.
*/

const ALPHABET = "abcdefghijklmnopqrstuvwxyz.".split("");

function charToId(ch: string): number {
    const idx = ALPHABET.indexOf(ch);
    return idx >= 0 ? idx : 0;
}

export function EncodingProblemDemo() {
    const [charA, setCharA] = useState("a");
    const [charB, setCharB] = useState("z");

    const idA = charToId(charA);
    const idB = charToId(charB);
    const intDist = Math.abs(idB - idA);
    const oneHotDist = charA === charB ? 0 : Math.sqrt(2);

    const pairExamples = useMemo(() => [
        { a: "a", b: "b", label: "neighbors" },
        { a: "a", b: "z", label: "far apart" },
        { a: "a", b: "m", label: "middle" },
        { a: "e", b: "f", label: "neighbors" },
    ], []);

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {/* Character selectors — big and clear */}
            <div className="flex items-center gap-5 justify-center">
                <CharPicker label="A" value={charA} onChange={setCharA} color="violet" />
                <span className="text-white/15 text-xl font-mono font-bold mt-5">vs</span>
                <CharPicker label="B" value={charB} onChange={setCharB} color="emerald" />
            </div>

            {/* Quick-pair chips */}
            <div className="flex gap-2 justify-center flex-wrap">
                {pairExamples.map(({ a, b, label }) => (
                    <button
                        key={`${a}-${b}`}
                        onClick={() => { setCharA(a); setCharB(b); }}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-mono border transition-all ${charA === a && charB === b
                                ? "border-violet-500/40 bg-violet-500/15 text-violet-300"
                                : "border-white/[0.08] bg-white/[0.02] text-white/30 hover:text-white/50"
                            }`}
                    >
                        {a}↔{b} <span className="text-white/20">({label})</span>
                    </button>
                ))}
            </div>

            {/* Two-column comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ── Integer encoding panel ── */}
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.03] p-5 space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span className="text-[11px] font-mono font-bold text-rose-400/80 uppercase tracking-widest">
                            Integer Encoding
                        </span>
                    </div>

                    {/* Big number display */}
                    <div className="flex items-baseline justify-center gap-4 py-2">
                        <div className="text-center">
                            <span className="text-2xl font-mono font-bold text-violet-400">{idA}</span>
                            <p className="text-[10px] font-mono text-white/25 mt-0.5">&quot;{charA}&quot;</p>
                        </div>
                        <span className="text-white/10 text-sm font-mono">→</span>
                        <div className="text-center">
                            <span className="text-2xl font-mono font-bold text-emerald-400">{idB}</span>
                            <p className="text-[10px] font-mono text-white/25 mt-0.5">&quot;{charB}&quot;</p>
                        </div>
                    </div>

                    {/* Distance bar */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-white/30">Distance</span>
                            <motion.span
                                key={intDist}
                                initial={{ scale: 1.3 }}
                                animate={{ scale: 1 }}
                                className="text-sm font-mono font-bold text-rose-400"
                            >
                                {intDist}
                            </motion.span>
                        </div>
                        <div className="h-2.5 rounded-full bg-white/[0.05] overflow-hidden">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-rose-500/50 to-rose-400/30"
                                animate={{ width: `${Math.min((intDist / 26) * 100, 100)}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                        <p className="text-[10px] font-mono text-rose-300/40">
                            |{idB} − {idA}| = {intDist} — {intDist > 10 ? "huge gap, no meaning" : intDist > 3 ? "medium gap, arbitrary" : "small gap, coincidence"}
                        </p>
                    </div>

                    {/* Verdict */}
                    <div className="rounded-lg bg-rose-500/[0.06] border border-rose-500/15 px-3 py-2.5">
                        <p className="text-[11px] text-rose-300/70 leading-relaxed">
                            ⚠ The network thinks &quot;{charB}&quot; is <span className="font-bold text-rose-300">{intDist}×</span> further
                            from &quot;{charA}&quot; than adjacent letters. Completely meaningless.
                        </p>
                    </div>
                </div>

                {/* ── One-hot encoding panel ── */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5 space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-[11px] font-mono font-bold text-emerald-400/80 uppercase tracking-widest">
                            One-Hot Encoding
                        </span>
                    </div>

                    {/* Mini one-hot vectors */}
                    <div className="space-y-2.5 py-1">
                        <MiniOneHot char={charA} color="violet" />
                        <MiniOneHot char={charB} color="emerald" />
                    </div>

                    {/* Distance bar */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-white/30">Distance</span>
                            <motion.span
                                key={String(oneHotDist)}
                                initial={{ scale: 1.3 }}
                                animate={{ scale: 1 }}
                                className="text-sm font-mono font-bold text-emerald-400"
                            >
                                {charA === charB ? "0" : "√2 ≈ 1.414"}
                            </motion.span>
                        </div>
                        <div className="h-2.5 rounded-full bg-white/[0.05] overflow-hidden">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500/50 to-emerald-400/30"
                                animate={{ width: charA === charB ? "0%" : "100%" }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                        <p className="text-[10px] font-mono text-emerald-300/40">
                            {charA === charB ? "Same character → distance 0" : "Always the same distance, for ANY two different characters"}
                        </p>
                    </div>

                    {/* Verdict */}
                    <div className="rounded-lg bg-emerald-500/[0.06] border border-emerald-500/15 px-3 py-2.5">
                        <p className="text-[11px] text-emerald-300/70 leading-relaxed">
                            ✓ Every character is <span className="font-bold text-emerald-300">equally different</span> from every other.
                            No false hierarchy.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CharPicker({ label, value, onChange, color }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    color: "violet" | "emerald";
}) {
    const ring = color === "violet" ? "ring-violet-500/40" : "ring-emerald-500/40";
    const textColor = color === "violet" ? "text-violet-400" : "text-emerald-400";
    const bg = color === "violet" ? "bg-violet-500/10" : "bg-emerald-500/10";

    return (
        <div className="flex flex-col items-center gap-1">
            <p className="text-[9px] font-mono uppercase tracking-widest text-white/25">{label}</p>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className={`${bg} ring-1 ${ring} rounded-xl w-12 h-12 text-xl font-mono font-bold ${textColor} cursor-pointer appearance-none text-center`}
            >
                {ALPHABET.map(ch => (
                    <option key={ch} value={ch}>{ch}</option>
                ))}
            </select>
        </div>
    );
}

function MiniOneHot({ char, color }: { char: string; color: "violet" | "emerald" }) {
    const idx = ALPHABET.indexOf(char);
    const activeColor = color === "violet" ? "bg-violet-400" : "bg-emerald-400";
    const textColor = color === "violet" ? "text-violet-300" : "text-emerald-300";

    return (
        <div className="flex items-center gap-2">
            <span className={`text-xs font-mono font-bold ${textColor} w-4 text-center`}>{char}</span>
            <div className="flex gap-[2px] flex-1">
                {ALPHABET.map((_, i) => (
                    <div
                        key={i}
                        className={`h-4 flex-1 rounded-sm transition-all ${i === idx ? activeColor : "bg-white/[0.04]"}`}
                    />
                ))}
            </div>
        </div>
    );
}
