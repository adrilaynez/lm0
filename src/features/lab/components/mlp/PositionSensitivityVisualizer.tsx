"use client";

import { useState } from "react";

/*
  PositionSensitivityVisualizer
  Shows that the same token ("the") at position 1 vs position 3
  maps to completely different slices of the concatenated input vector,
  activating different columns of W1.
*/

const EMB_DIM = 8;
const CONTEXT_SIZE = 3;
const INPUT_DIM = CONTEXT_SIZE * EMB_DIM; // 24

const TOKEN_LABEL = "the";

// Slot colors — position 1, 2, 3
const SLOT_COLORS = [
    { slot: "bg-violet-500/40 border-violet-500/50 text-violet-200", col: "bg-violet-400/70", colFaint: "bg-violet-500/10" },
    { slot: "bg-white/[0.06] border-white/15 text-white/40", col: "bg-white/[0.08]", colFaint: "bg-white/[0.04]" },
    { slot: "bg-cyan-500/40 border-cyan-500/50 text-cyan-200", col: "bg-cyan-400/70", colFaint: "bg-cyan-500/10" },
];

const TOKEN_AT_POSITIONS = ["the", "cat", "sat"]; // default context

export function PositionSensitivityVisualizer() {
    const [highlightPos, setHighlightPos] = useState<0 | 2>(0); // 0 = position 1, 2 = position 3

    const activeSlice = { start: highlightPos * EMB_DIM, end: highlightPos * EMB_DIM + EMB_DIM - 1 };

    const tokens = [...TOKEN_AT_POSITIONS];
    tokens[highlightPos] = TOKEN_LABEL; // put "the" at the selected position

    return (
        <div className="space-y-5">
            {/* Position toggle */}
            <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">
                    Place &quot;the&quot; at position
                </div>
                <div className="flex gap-2">
                    {([0, 2] as const).map(pos => (
                        <button
                            key={pos}
                            onClick={() => setHighlightPos(pos)}
                            className={`px-4 py-2 rounded-lg text-xs font-mono border transition-all ${
                                highlightPos === pos
                                    ? pos === 0
                                        ? "bg-violet-500/20 text-violet-300 border-violet-500/40"
                                        : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                                    : "bg-white/[0.03] text-white/30 border-white/[0.06] hover:text-white/50"
                            }`}
                        >
                            Position {pos + 1}
                        </button>
                    ))}
                </div>
            </div>

            {/* Context window + concat vector + W1 */}
            <div className="space-y-4">
                {/* Token slots */}
                <div>
                    <div className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-2">Context window (size 3)</div>
                    <div className="flex gap-2">
                        {tokens.map((tok, i) => {
                            const c = SLOT_COLORS[i];
                            const isHighlighted = i === highlightPos;
                            return (
                                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                                    <div className="text-[8px] font-mono text-white/25">pos {i + 1}</div>
                                    <div className={`w-full py-2 rounded-lg border text-center text-sm font-mono font-semibold transition-all duration-300 ${
                                        isHighlighted ? c.slot : "bg-white/[0.04] border-white/[0.08] text-white/40"
                                    }`}>
                                        {tok}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Arrow */}
                <div className="text-[9px] font-mono text-white/20 text-center">↓ each token → 8-dim embedding → concatenate</div>

                {/* Concatenated vector */}
                <div>
                    <div className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-2">
                        Concatenated input ({INPUT_DIM} dims)
                    </div>
                    <div className="flex h-8 rounded-lg overflow-hidden border border-white/[0.08] gap-px bg-black/20">
                        {Array.from({ length: INPUT_DIM }).map((_, i) => {
                            const slotIdx = Math.floor(i / EMB_DIM);
                            const isActive = i >= activeSlice.start && i <= activeSlice.end;
                            const c = SLOT_COLORS[slotIdx];
                            return (
                                <div
                                    key={i}
                                    className={`flex-1 transition-all duration-300 ${isActive ? c.col : c.colFaint}`}
                                    style={{ minWidth: 0 }}
                                />
                            );
                        })}
                    </div>
                    <div className="flex mt-1">
                        {SLOT_COLORS.map((c, i) => (
                            <div key={i} className="flex-1 text-center">
                                <span className={`text-[8px] font-mono ${i === highlightPos ? (highlightPos === 0 ? "text-violet-400/70" : "text-cyan-400/70") : "text-white/20"}`}>
                                    pos {i + 1}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Arrow */}
                <div className="text-[9px] font-mono text-white/20 text-center">↓ multiplied by W₁</div>

                {/* W1 column highlight */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-[9px] font-mono uppercase tracking-widest text-white/25">
                            W₁ columns activated by &quot;the&quot;
                        </div>
                        <div className={`text-[9px] font-mono font-bold ${highlightPos === 0 ? "text-violet-400" : "text-cyan-400"}`}>
                            cols {activeSlice.start}–{activeSlice.end}
                        </div>
                    </div>
                    <div className="flex gap-px h-10 rounded-lg overflow-hidden border border-white/[0.08]">
                        {Array.from({ length: INPUT_DIM }).map((_, i) => {
                            const isActive = i >= activeSlice.start && i <= activeSlice.end;
                            const activeColor = highlightPos === 0 ? "bg-violet-400/70" : "bg-cyan-400/70";
                            return (
                                <div
                                    key={i}
                                    className={`flex-1 transition-all duration-300 ${isActive ? activeColor : "bg-white/[0.04]"}`}
                                    style={{ minWidth: 0 }}
                                />
                            );
                        })}
                    </div>
                    <div className="text-[9px] font-mono text-white/20 mt-1">
                        Rows 0–{CONTEXT_SIZE === 3 ? 199 : "H−1"} of W₁ · only columns {activeSlice.start}–{activeSlice.end} are read
                    </div>
                </div>
            </div>

            {/* Status message */}
            <div className={`rounded-xl border p-4 transition-all duration-300 ${
                highlightPos === 0
                    ? "border-violet-500/20 bg-violet-500/[0.04]"
                    : "border-cyan-500/20 bg-cyan-500/[0.04]"
            }`}>
                <p className="text-sm text-white/55 leading-relaxed">
                    <span className={`font-semibold ${highlightPos === 0 ? "text-violet-300" : "text-cyan-300"}`}>
                        &quot;the&quot; at position {highlightPos + 1}
                    </span>{" "}
                    activates W₁ columns <span className="font-mono">{activeSlice.start}–{activeSlice.end}</span>.{" "}
                    {highlightPos === 0
                        ? "Switch to position 3 to see it activate a completely different set of columns — the same token, different parameters."
                        : "Compare with position 1: the same word activates entirely different weights. The model has no position-invariant notion of what \"the\" means."}
                </p>
            </div>
        </div>
    );
}
