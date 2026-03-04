"use client";

import { useMemo, useState } from "react";

/*
  MLPLimitationPlayground
  Type text and see the MLP's fixed context window in action.
  Better visual distinction between visible/invisible characters,
  mock prediction output showing what the model thinks,
  and how wrong it is when context is missing.
*/

const WINDOW_SIZE = 3;

// Simple mock: given last N chars, produce plausible "predictions"
// Real model would use the backend, but this illustrates the limitation
const MOCK_PREDICTIONS: Record<string, { char: string; prob: number }[]> = {
    "th": [{ char: "e", prob: 0.62 }, { char: "a", prob: 0.15 }, { char: "i", prob: 0.08 }],
    "he": [{ char: " ", prob: 0.35 }, { char: "r", prob: 0.18 }, { char: "n", prob: 0.12 }],
    "e ": [{ char: "s", prob: 0.11 }, { char: "t", prob: 0.09 }, { char: "a", prob: 0.08 }],
    "es": [{ char: " ", prob: 0.30 }, { char: "t", prob: 0.18 }, { char: "s", prob: 0.12 }],
    "ie": [{ char: "s", prob: 0.42 }, { char: "d", prob: 0.18 }, { char: "r", prob: 0.10 }],
    "ci": [{ char: "e", prob: 0.25 }, { char: "a", prob: 0.20 }, { char: "t", prob: 0.12 }],
    "en": [{ char: "t", prob: 0.30 }, { char: "c", prob: 0.12 }, { char: "d", prob: 0.10 }],
    "st": [{ char: "a", prob: 0.18 }, { char: "e", prob: 0.15 }, { char: "i", prob: 0.14 }],
};

function getMockPredictions(context: string): { char: string; prob: number }[] {
    const key = context.slice(-2).toLowerCase();
    if (MOCK_PREDICTIONS[key]) return MOCK_PREDICTIONS[key];
    // Fallback: generic distribution
    return [
        { char: "e", prob: 0.12 }, { char: "t", prob: 0.09 }, { char: " ", prob: 0.18 },
        { char: "a", prob: 0.08 }, { char: "o", prob: 0.07 },
    ];
}

export function MLPLimitationPlayground() {
    const [text, setText] = useState("the scientist who had been studying the rare species");
    const [cursorIdx, setCursorIdx] = useState<number | null>(null);

    const chars = text.split("");
    const activeIdx = cursorIdx !== null ? Math.min(cursorIdx, chars.length - 1) : chars.length - 1;
    const windowStart = Math.max(0, activeIdx - WINDOW_SIZE + 1);
    const visibleChars = chars.slice(windowStart, activeIdx + 1).join("");
    const hiddenCount = Math.max(0, chars.length - WINDOW_SIZE);

    const predictions = useMemo(() => getMockPredictions(visibleChars), [visibleChars]);
    const actualNext = activeIdx < chars.length - 1 ? chars[activeIdx + 1] : null;
    const topPrediction = predictions[0];
    const isCorrect = actualNext !== null && topPrediction.char === actualNext;

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Input */}
            <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-white/25 uppercase tracking-wider">Type a sentence</label>
                <input
                    type="text"
                    value={text}
                    onChange={e => { setText(e.target.value); setCursorIdx(null); }}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm font-mono text-white/70 focus:outline-none focus:border-violet-500/30"
                    placeholder="Type something..."
                />
            </div>

            {/* Character display — click to move cursor */}
            {chars.length > 0 && (
                <div className="overflow-x-auto pb-1">
                    <div className="flex gap-[2px] min-w-0">
                        {chars.map((ch, i) => {
                            const inWindow = i >= windowStart && i <= activeIdx;
                            const isCursor = i === activeIdx;
                            const isNextChar = i === activeIdx + 1;
                            return (
                                <button
                                    key={i}
                                    onClick={() => setCursorIdx(i)}
                                    className={`flex-shrink-0 w-7 h-10 flex items-center justify-center rounded text-xs font-mono transition-all cursor-pointer ${isCursor
                                            ? "bg-violet-500/25 border-2 border-violet-500/60 text-violet-200 shadow-[0_0_8px_rgba(139,92,246,0.2)]"
                                            : isNextChar
                                                ? "bg-amber-500/10 border border-amber-500/30 text-amber-300/60"
                                                : inWindow
                                                    ? "bg-emerald-500/12 border border-emerald-500/25 text-emerald-300"
                                                    : "bg-zinc-900/50 border border-white/[0.03] text-white/[0.07]"
                                        }`}
                                    title={inWindow ? `Position ${i} (visible)` : `Position ${i} (hidden)`}
                                >
                                    {inWindow || isCursor || isNextChar ? (ch === " " ? "·" : ch) : (
                                        <span className="text-[6px] text-white/[0.06]">?</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-[8px] font-mono">
                <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500/15 border border-emerald-500/30" />
                    <span className="text-white/25">Visible ({WINDOW_SIZE})</span>
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-violet-500/25 border-2 border-violet-500/50" />
                    <span className="text-white/25">Cursor</span>
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-amber-500/10 border border-amber-500/30" />
                    <span className="text-white/25">Next (actual)</span>
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-zinc-900/50 border border-white/[0.03]" />
                    <span className="text-white/25">Invisible ({hiddenCount})</span>
                </span>
            </div>

            {/* Prediction panel */}
            <div className="grid grid-cols-2 gap-3">
                {/* What the model sees */}
                <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-3 space-y-2">
                    <p className="text-[8px] font-mono text-emerald-400/50 uppercase tracking-wider">Model sees</p>
                    <p className="text-lg font-mono font-bold text-emerald-300 tracking-wider">
                        {visibleChars.split("").map((c, i) => (
                            <span key={i}>{c === " " ? "·" : c}</span>
                        ))}
                    </p>
                    <p className="text-[8px] font-mono text-white/15">
                        {WINDOW_SIZE} of {chars.length} characters
                    </p>
                </div>

                {/* What it predicts */}
                <div className="rounded-xl border border-violet-500/15 bg-violet-500/[0.03] p-3 space-y-2">
                    <p className="text-[8px] font-mono text-violet-400/50 uppercase tracking-wider">Top prediction</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-mono font-bold text-violet-300">
                            &quot;{topPrediction.char === " " ? "·" : topPrediction.char}&quot;
                        </span>
                        <span className="text-[10px] font-mono text-violet-300/40">
                            {(topPrediction.prob * 100).toFixed(0)}%
                        </span>
                    </div>
                    {actualNext !== null && (
                        <p className={`text-[9px] font-mono ${isCorrect ? "text-emerald-400/60" : "text-rose-400/60"}`}>
                            {isCorrect ? "✓ Correct!" : `✗ Actual: "${actualNext === " " ? "·" : actualNext}"`}
                        </p>
                    )}
                </div>
            </div>

            {/* Mini bar chart of predictions */}
            <div className="space-y-1">
                <p className="text-[8px] font-mono text-white/15 uppercase tracking-wider">Probability distribution</p>
                {predictions.map(({ char, prob }, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono w-4 text-center ${i === 0 ? "text-violet-300 font-bold" : "text-white/25"}`}>
                            {char === " " ? "·" : char}
                        </span>
                        <div className="flex-1 h-4 rounded bg-white/[0.02] overflow-hidden">
                            <div
                                className="h-full rounded transition-all duration-300"
                                style={{
                                    width: `${(prob * 100).toFixed(0)}%`,
                                    backgroundColor: i === 0 ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.06)",
                                }}
                            />
                        </div>
                        <span className="text-[8px] font-mono text-white/20 w-8 text-right">
                            {(prob * 100).toFixed(0)}%
                        </span>
                    </div>
                ))}
            </div>

            {/* Context-missing callout */}
            {hiddenCount > 5 && (
                <div className="rounded-lg border border-rose-500/10 bg-rose-500/[0.03] px-3 py-2">
                    <p className="text-[9px] font-mono text-rose-300/50">
                        <span className="font-bold">{hiddenCount} characters</span> are invisible.
                        The model has no idea what came before &quot;{visibleChars}&quot; — it could be any sentence.
                        {actualNext && !isCorrect && " That's why it guessed wrong."}
                    </p>
                </div>
            )}

            <p className="text-[8px] font-mono text-white/15 text-center">
                Click any character to move the prediction cursor. Watch how predictions change — and how often they're wrong without full context.
            </p>
        </div>
    );
}
