"use client";

import { useState } from "react";

/*
  MLPLimitationPlayground
  Type text and see the MLP's fixed context window in action.
  Highlights which characters the model can "see" and which are invisible.
*/

const WINDOW_SIZE = 3;

export function MLPLimitationPlayground() {
    const [text, setText] = useState("the scientist who had been studying the rare species");

    const chars = text.split("");
    const cursorPos = chars.length - 1;
    const windowStart = Math.max(0, cursorPos - WINDOW_SIZE + 1);

    return (
        <div className="p-5 sm:p-6 space-y-4">
            <div className="space-y-2">
                <label className="text-[9px] font-mono text-white/25 uppercase tracking-wider">Type a sentence</label>
                <input
                    type="text"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm font-mono text-white/70 focus:outline-none focus:border-violet-500/30"
                    placeholder="Type something..."
                />
            </div>

            {/* Character display */}
            {chars.length > 0 && (
                <div className="overflow-x-auto">
                    <div className="flex gap-px min-w-0">
                        {chars.map((ch, i) => {
                            const inWindow = i >= windowStart && i <= cursorPos;
                            const isPredictTarget = i === cursorPos;
                            return (
                                <div
                                    key={i}
                                    className={`flex-shrink-0 w-7 h-9 flex items-center justify-center rounded text-xs font-mono transition-all ${
                                        isPredictTarget
                                            ? "bg-violet-500/20 border border-violet-500/40 text-violet-300 ring-1 ring-violet-500/30"
                                            : inWindow
                                                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                                : "bg-white/[0.02] border border-white/[0.04] text-white/10"
                                    }`}
                                >
                                    {ch === " " ? "·" : ch}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="flex gap-4 text-[9px] font-mono">
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500/15 border border-emerald-500/30" />
                    <span className="text-white/30">Context window ({WINDOW_SIZE} chars)</span>
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-violet-500/20 border border-violet-500/40" />
                    <span className="text-white/30">Predicting next</span>
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-white/[0.02] border border-white/[0.04]" />
                    <span className="text-white/30">Invisible to model</span>
                </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                    <p className="text-[8px] font-mono text-white/20">TOTAL CHARS</p>
                    <p className="text-base font-mono font-bold text-white/40">{chars.length}</p>
                </div>
                <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-2 text-center">
                    <p className="text-[8px] font-mono text-white/20">VISIBLE</p>
                    <p className="text-base font-mono font-bold text-emerald-400">{WINDOW_SIZE}</p>
                </div>
                <div className="rounded-lg border border-rose-500/15 bg-rose-500/5 p-2 text-center">
                    <p className="text-[8px] font-mono text-white/20">HIDDEN</p>
                    <p className="text-base font-mono font-bold text-rose-400">{Math.max(0, chars.length - WINDOW_SIZE)}</p>
                </div>
            </div>

            <p className="text-[10px] text-white/20 text-center">
                The MLP only sees the last {WINDOW_SIZE} characters. Everything before that is invisible — no matter how important it might be.
            </p>
        </div>
    );
}
