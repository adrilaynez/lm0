"use client";

import { useState } from "react";

/*
  ConcatenationBottleneckVisualizer
  Two tabs:
  1. Parameter Growth — token boxes → embeddings → concat vector → W1 matrix
  2. Signal Dilution  — horizontal bar divided into N equal slices
*/

const EMB_DIM = 8;
const HIDDEN_SIZE = 200;

type Mode = "params" | "dilution";

const TOKEN_COLORS = [
    { bg: "bg-violet-500/40", border: "border-violet-500/50", text: "text-violet-200", bar: "bg-violet-400" },
    { bg: "bg-blue-500/40", border: "border-blue-500/50", text: "text-blue-200", bar: "bg-blue-400" },
    { bg: "bg-cyan-500/40", border: "border-cyan-500/50", text: "text-cyan-200", bar: "bg-cyan-400" },
    { bg: "bg-teal-500/40", border: "border-teal-500/50", text: "text-teal-200", bar: "bg-teal-400" },
    { bg: "bg-emerald-500/40", border: "border-emerald-500/50", text: "text-emerald-200", bar: "bg-emerald-400" },
    { bg: "bg-amber-500/40", border: "border-amber-500/50", text: "text-amber-200", bar: "bg-amber-400" },
    { bg: "bg-orange-500/40", border: "border-orange-500/50", text: "text-orange-200", bar: "bg-orange-400" },
    { bg: "bg-rose-500/40", border: "border-rose-500/50", text: "text-rose-200", bar: "bg-rose-400" },
];

function formatParams(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
}

function ParamGrowthView({ contextSize }: { contextSize: number }) {
    const inputDim = contextSize * EMB_DIM;
    const w1Params = inputDim * HIDDEN_SIZE;
    const maxW1 = 16 * EMB_DIM * HIDDEN_SIZE;
    const fillRatio = w1Params / maxW1;

    const visibleTokens = Math.min(contextSize, 8);
    const plusMore = contextSize > 8 ? contextSize - 8 : 0;

    return (
        <div className="space-y-5">
            {/* Token boxes row */}
            <div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-2">Context tokens</div>
                <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: visibleTokens }).map((_, i) => {
                        const c = TOKEN_COLORS[i % TOKEN_COLORS.length];
                        return (
                            <div key={i} className={`px-2 py-1 rounded border ${c.bg} ${c.border} text-[10px] font-mono ${c.text}`}>
                                t{i + 1}
                            </div>
                        );
                    })}
                    {plusMore > 0 && (
                        <div className="px-2 py-1 rounded border border-white/10 bg-white/[0.04] text-[10px] font-mono text-white/30">
                            +{plusMore} more
                        </div>
                    )}
                </div>
            </div>

            {/* Arrow + embedding dim label */}
            <div className="flex items-center gap-2 text-[9px] font-mono text-white/25">
                <div className="h-px flex-1 bg-white/[0.08]" />
                <span>each → {EMB_DIM}-dim embedding</span>
                <div className="h-px flex-1 bg-white/[0.08]" />
            </div>

            {/* Concat vector visualization */}
            <div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-2">
                    Concatenated input ({inputDim} dims)
                </div>
                <div className="flex h-7 rounded-lg overflow-hidden border border-white/[0.08]">
                    {Array.from({ length: contextSize }).map((_, i) => {
                        const c = TOKEN_COLORS[i % TOKEN_COLORS.length];
                        return (
                            <div
                                key={i}
                                className={`flex-1 ${c.bar} opacity-60 transition-all duration-300`}
                                style={{ minWidth: 0 }}
                            />
                        );
                    })}
                </div>
                <div className="text-[9px] font-mono text-white/20 mt-1">
                    {contextSize} tokens × {EMB_DIM} dims = {inputDim} input dimensions
                </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center gap-2 text-[9px] font-mono text-white/25">
                <div className="h-px flex-1 bg-white/[0.08]" />
                <span>feeds into W₁</span>
                <div className="h-px flex-1 bg-white/[0.08]" />
            </div>

            {/* W1 parameter bar */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <div className="text-[9px] font-mono uppercase tracking-widest text-white/25">
                        W₁ parameters ({inputDim} × {HIDDEN_SIZE})
                    </div>
                    <div className="text-sm font-mono font-bold text-amber-300">{formatParams(w1Params)}</div>
                </div>
                <div className="h-3 rounded-full bg-white/[0.04] border border-white/[0.06] overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500/60 to-amber-400/40 transition-all duration-300"
                        style={{ width: `${Math.min(100, fillRatio * 100).toFixed(1)}%` }}
                    />
                </div>
                <div className="flex justify-between text-[8px] font-mono text-white/15 mt-1">
                    <span>N=1: {formatParams(1 * EMB_DIM * HIDDEN_SIZE)}</span>
                    <span>N=16: {formatParams(maxW1)}</span>
                </div>
            </div>

            {/* Formula */}
            <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.03] px-4 py-3">
                <div className="text-[9px] font-mono uppercase tracking-widest text-amber-400/50 mb-1">W₁ size formula</div>
                <div className="text-sm font-mono text-white/50">
                    W₁ = (N × d<sub className="text-[10px]">emb</sub>) × H
                    {" = "}
                    ({contextSize} × {EMB_DIM}) × {HIDDEN_SIZE}
                    {" = "}
                    <span className="text-amber-300 font-semibold">{formatParams(w1Params)} params</span>
                </div>
                <div className="text-[9px] font-mono text-white/25 mt-1">
                    Doubling context size doubles W₁ — linearly.
                    At N=16 that&apos;s {(maxW1 / (1 * EMB_DIM * HIDDEN_SIZE)).toFixed(0)}× more than N=1.
                </div>
            </div>
        </div>
    );
}

function DilutionView({ contextSize }: { contextSize: number }) {
    const pct = (100 / contextSize).toFixed(1);

    return (
        <div className="space-y-5">
            <div className="text-sm text-white/45 leading-relaxed">
                Each token&apos;s embedding occupies exactly{" "}
                <span className="font-mono text-amber-300 font-semibold">1/N</span> of the
                total input vector. As N grows, each token&apos;s voice shrinks.
            </div>

            {/* Dilution bar */}
            <div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-2">
                    Token signal share (N = {contextSize})
                </div>
                <div className="flex h-10 rounded-xl overflow-hidden border border-white/[0.08]">
                    {Array.from({ length: Math.min(contextSize, 32) }).map((_, i) => {
                        const c = TOKEN_COLORS[i % TOKEN_COLORS.length];
                        return (
                            <div
                                key={i}
                                className={`flex-1 ${c.bar} opacity-70 transition-all duration-300 border-r border-black/20 last:border-0`}
                                style={{ minWidth: 0 }}
                            />
                        );
                    })}
                </div>
                <div className="text-[9px] font-mono text-white/25 mt-1">
                    Each slice = {pct}% of input signal
                </div>
            </div>

            {/* Comparison table */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <div className="grid grid-cols-3 border-b border-white/[0.06] px-4 py-2">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/25">N</span>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/25">signal / token</span>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/25">input dims</span>
                </div>
                {[1, 2, 3, 4, 8, 16].map(n => (
                    <div
                        key={n}
                        className={`grid grid-cols-3 px-4 py-2 border-b border-white/[0.04] last:border-0 transition-colors ${n === contextSize ? "bg-violet-500/[0.06]" : ""}`}
                    >
                        <span className={`text-xs font-mono ${n === contextSize ? "text-violet-300 font-bold" : "text-white/40"}`}>{n}</span>
                        <span className={`text-xs font-mono ${n === contextSize ? "text-amber-300 font-bold" : "text-white/30"}`}>
                            {(100 / n).toFixed(1)}%
                        </span>
                        <span className={`text-xs font-mono ${n === contextSize ? "text-white/60" : "text-white/25"}`}>
                            {n * EMB_DIM}
                        </span>
                    </div>
                ))}
            </div>

            <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.03] px-4 py-3 text-sm text-white/45 leading-relaxed">
                At N = {contextSize}, each token contributes only{" "}
                <span className="text-amber-300 font-semibold">{pct}%</span> of the
                total input. The hidden layers must extract meaning from an increasingly
                diluted blend — with no mechanism to focus on the tokens that matter most.
            </div>
        </div>
    );
}

export function ConcatenationBottleneckVisualizer() {
    const [contextSize, setContextSize] = useState(3);
    const [mode, setMode] = useState<Mode>("params");

    return (
        <div className="space-y-5">
            {/* Tabs */}
            <div className="flex gap-2">
                {([
                    { id: "params" as Mode, label: "Parameter Growth" },
                    { id: "dilution" as Mode, label: "Signal Dilution" },
                ] as const).map(({ id, label }) => (
                    <button
                        key={id}
                        onClick={() => setMode(id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${mode === id
                            ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                            : "bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/50"
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Slider */}
            <div>
                <div className="flex justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">Context size</span>
                    <span className="text-sm font-mono font-bold text-violet-400">N = {contextSize}</span>
                </div>
                <input
                    type="range" min={1} max={16} value={contextSize}
                    onChange={e => setContextSize(Number(e.target.value))}
                    className="w-full accent-violet-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-white/15 mt-1">
                    <span>1</span><span>16</span>
                </div>
            </div>

            {mode === "params"
                ? <ParamGrowthView contextSize={contextSize} />
                : <DilutionView contextSize={contextSize} />
            }
        </div>
    );
}
