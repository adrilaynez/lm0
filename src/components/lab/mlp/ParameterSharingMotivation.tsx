"use client";

import { useState } from "react";

/*
  ParameterSharingMotivation
  Shows why lack of parameter sharing across positions is wasteful.
  Compares MLP (separate weights per position) vs hypothetical shared-weight model.
*/

const CONTEXT_SIZES = [2, 4, 8, 16];

export function ParameterSharingMotivation() {
    const [contextIdx, setContextIdx] = useState(1);
    const context = CONTEXT_SIZES[contextIdx];
    const embDim = 10;
    const hidden = 64;

    const mlpW1 = context * embDim * hidden;
    const sharedW1 = embDim * hidden;
    const ratio = mlpW1 / sharedW1;

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Context size selector */}
            <div className="flex gap-2 justify-center">
                {CONTEXT_SIZES.map((cs, i) => (
                    <button
                        key={cs}
                        onClick={() => setContextIdx(i)}
                        className={`px-3 py-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            i === contextIdx
                                ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                                : "bg-white/[0.02] border-white/[0.06] text-white/20 hover:bg-white/[0.04]"
                        }`}
                    >
                        N={cs}
                    </button>
                ))}
            </div>

            {/* Comparison bars */}
            <div className="space-y-3">
                <BarRow
                    label="MLP (separate per position)"
                    value={mlpW1}
                    max={CONTEXT_SIZES[3] * embDim * hidden}
                    color="rose"
                    detail={`${context} × ${embDim} × ${hidden} = ${mlpW1.toLocaleString()}`}
                />
                <BarRow
                    label="Shared weights (same for all positions)"
                    value={sharedW1}
                    max={CONTEXT_SIZES[3] * embDim * hidden}
                    color="emerald"
                    detail={`${embDim} × ${hidden} = ${sharedW1.toLocaleString()}`}
                />
            </div>

            {/* Ratio */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                <p className="text-[8px] font-mono text-white/20 uppercase">MLP uses</p>
                <p className="text-2xl font-mono font-bold text-rose-400">{ratio}×</p>
                <p className="text-[8px] font-mono text-white/20">more parameters in W₁</p>
            </div>

            <p className="text-[10px] text-white/20 text-center">
                The MLP learns separate weights for each position. A model that shares weights across positions could be {ratio}× more efficient
                — and would understand that &quot;the&quot; means the same thing regardless of where it appears.
            </p>
        </div>
    );
}

function BarRow({ label, value, max, color, detail }: { label: string; value: number; max: number; color: "rose" | "emerald"; detail: string }) {
    const pct = Math.max(5, (value / max) * 100);
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-mono">
                <span className="text-white/30">{label}</span>
                <span className={color === "rose" ? "text-rose-400" : "text-emerald-400"}>{detail}</span>
            </div>
            <div className="h-4 rounded-full bg-white/[0.04] overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${
                        color === "rose" ? "bg-rose-500/30" : "bg-emerald-500/30"
                    }`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
