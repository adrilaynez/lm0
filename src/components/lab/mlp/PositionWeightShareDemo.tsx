"use client";

import { useState } from "react";

/*
  PositionWeightShareDemo
  Shows how the same token activates completely different W₁ columns
  depending on its position in the concatenated input.
*/

const POSITIONS = [0, 1, 2];
const TOKEN = "e";
const EMB_DIM = 4;
const HIDDEN = 6;

export function PositionWeightShareDemo() {
    const [activePos, setActivePos] = useState(0);

    const colStart = activePos * EMB_DIM;
    const colEnd = colStart + EMB_DIM;
    const totalCols = POSITIONS.length * EMB_DIM;

    return (
        <div className="p-5 sm:p-6 space-y-4">
            <p className="text-[10px] text-white/25 font-mono text-center">
                Token &quot;{TOKEN}&quot; at different positions → different W₁ columns
            </p>

            {/* Position selector */}
            <div className="flex gap-2 justify-center">
                {POSITIONS.map(pos => (
                    <button
                        key={pos}
                        onClick={() => setActivePos(pos)}
                        className={`px-4 py-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            pos === activePos
                                ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                                : "bg-white/[0.02] border-white/[0.06] text-white/20 hover:bg-white/[0.04]"
                        }`}
                    >
                        Position {pos}
                    </button>
                ))}
            </div>

            {/* W₁ matrix visualization */}
            <div className="flex justify-center">
                <div className="space-y-1">
                    <div className="flex gap-px ml-8">
                        {Array.from({ length: totalCols }, (_, c) => (
                            <div
                                key={c}
                                className={`w-5 h-3 flex items-center justify-center text-[6px] font-mono ${
                                    c >= colStart && c < colEnd ? "text-violet-400" : "text-white/10"
                                }`}
                            >
                                {c}
                            </div>
                        ))}
                    </div>
                    {Array.from({ length: HIDDEN }, (_, r) => (
                        <div key={r} className="flex items-center gap-1">
                            <span className="w-6 text-[7px] font-mono text-white/15 text-right">h{r}</span>
                            <div className="flex gap-px">
                                {Array.from({ length: totalCols }, (_, c) => {
                                    const active = c >= colStart && c < colEnd;
                                    return (
                                        <div
                                            key={c}
                                            className={`w-5 h-5 rounded-sm transition-all ${
                                                active
                                                    ? "bg-violet-500/30 border border-violet-500/40"
                                                    : "bg-white/[0.03] border border-white/[0.04]"
                                            }`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Explanation */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                <p className="text-[10px] text-white/40">
                    &quot;{TOKEN}&quot; at position <span className="font-bold text-violet-400">{activePos}</span>{" "}
                    activates columns <span className="font-bold text-violet-400">{colStart}–{colEnd - 1}</span> of W₁.
                    {activePos > 0 && (
                        <> At position 0, it would activate columns <span className="font-bold text-white/30">0–{EMB_DIM - 1}</span> — completely different weights.</>
                    )}
                </p>
            </div>

            <p className="text-[10px] text-white/20 text-center">
                The MLP learns separate representations for &quot;{TOKEN} at position 0&quot; vs &quot;{TOKEN} at position 2&quot;. No weight sharing across positions.
            </p>
        </div>
    );
}
