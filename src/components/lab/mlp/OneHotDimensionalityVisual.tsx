"use client";

import { useMemo,useState } from "react";

import { motion } from "framer-motion";

const VOCAB = 70;
const MLP_HIDDEN = 64;
const EMB_DIM = 16;

function mlpParams(n: number): number {
    const inputDim = n * VOCAB;
    return inputDim * MLP_HIDDEN + MLP_HIDDEN + MLP_HIDDEN * VOCAB + VOCAB;
}

function ngramEntries(n: number): number {
    return Math.pow(VOCAB, n);
}

function fmt(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
}

const OBSERVED_FRACTION = 0.04;

interface MiniGridProps {
    total: number;
    observedFraction: number;
    color: string;
    dimColor: string;
    maxCells?: number;
    label: string;
    sublabel: string;
    count: number;
}

function MiniGrid({ total, observedFraction, color, dimColor, maxCells = 400, label, sublabel, count }: MiniGridProps) {
    const cells = Math.min(total, maxCells);
    const filledCount = Math.round(cells * Math.min(observedFraction, 1));

    return (
        <div className="flex flex-col items-center gap-3 flex-1 min-w-0">
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color }}>
                {label}
            </div>

            <div
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] p-3 flex flex-wrap gap-[2px] content-start"
                style={{ minHeight: 120 }}
                aria-label={`${label}: ${fmt(count)} entries`}
            >
                {Array.from({ length: cells }).map((_, i) => (
                    <motion.div
                        key={i}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15, delay: i * 0.0008 }}
                        className="rounded-[1px] shrink-0"
                        style={{
                            width: 5,
                            height: 5,
                            backgroundColor: i < filledCount ? color : dimColor,
                            opacity: i < filledCount ? 0.85 : 0.18,
                        }}
                    />
                ))}
                {total > maxCells && (
                    <div className="w-full text-center text-[9px] font-mono text-white/20 mt-1">
                        +{fmt(total - maxCells)} more…
                    </div>
                )}
            </div>

            <div className="text-center">
                <div className="text-lg font-mono font-bold text-white tabular-nums">
                    {fmt(count)}
                </div>
                <div className="text-[10px] text-white/35 font-mono">{sublabel}</div>
            </div>
        </div>
    );
}

export function OneHotDimensionalityVisual() {
    const [n, setN] = useState(3);

    const ngram = useMemo(() => ngramEntries(n), [n]);
    const mlp = useMemo(() => mlpParams(n), [n]);

    const ratio = ngram / mlp;

    return (
        <div
            className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-5"
            aria-label="N-gram table vs MLP parameter count comparison"
        >
            {/* Slider */}
            <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest shrink-0">
                    Context N =
                </span>
                <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={n}
                    onChange={e => setN(Number(e.target.value))}
                    className="flex-1 accent-violet-500 cursor-pointer"
                    aria-label="Context size N"
                />
                <span className="text-sm font-mono font-bold text-violet-300 w-4 text-right">{n}</span>
            </div>

            {/* Grids */}
            <div className="flex gap-4 items-start">
                <MiniGrid
                    total={ngram}
                    observedFraction={OBSERVED_FRACTION}
                    color="#f59e0b"
                    dimColor="#78350f"
                    label={`${n}-gram table`}
                    sublabel="entries (mostly empty)"
                    count={ngram}
                />
                <div className="flex flex-col items-center justify-center self-center gap-1 shrink-0">
                    <span className="text-[9px] font-mono text-white/20">vs</span>
                    <motion.span
                        key={ratio}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] font-mono text-white/30 text-center"
                    >
                        {ratio >= 1000
                            ? `${Math.round(ratio / 1000)}K×`
                            : ratio >= 1
                            ? `${Math.round(ratio)}×`
                            : `${(1 / ratio).toFixed(1)}×`}
                        <br />
                        <span className="text-[8px]">larger</span>
                    </motion.span>
                </div>
                <MiniGrid
                    total={mlp}
                    observedFraction={1}
                    color="#34d399"
                    dimColor="#064e3b"
                    label="MLP parameters"
                    sublabel="all trained, none wasted"
                    count={mlp}
                />
            </div>

            {/* Legend */}
            <div className="flex gap-6 justify-center">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-[1px] bg-amber-400/80" />
                    <span className="text-[9px] font-mono text-white/30">observed n-grams</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-[1px] bg-amber-900/60" />
                    <span className="text-[9px] font-mono text-white/30">unseen (zero count)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-[1px] bg-emerald-400/80" />
                    <span className="text-[9px] font-mono text-white/30">MLP weights (all used)</span>
                </div>
            </div>

            <p className="text-[10px] font-mono text-white/20 text-center">
                Vocab = {VOCAB} · Hidden = {MLP_HIDDEN} · Emb = {EMB_DIM}
            </p>
        </div>
    );
}
