"use client";

import { useState } from "react";

/*
  LongRangeDependencyDemo
  A longer sentence where the pronoun's referent is far back.
  Shows MLP (small window) vs "full context" prediction confidence.
*/

const WORDS = [
    "The", "scientist", "who", "discovered", "the", "comet",
    "gave", "a", "lecture", ",", "and", "after", "the",
    "applause", "died", "down", "she", "answered", "questions",
];

const PRONOUN_IDX = 16; // "she"
const REFERENT_IDX = 1;  // "scientist"

// Mock top-5 predictions when context is too small (uncertain)
const UNCERTAIN_PREDS = [
    { token: "he", prob: 0.18 },
    { token: "she", prob: 0.17 },
    { token: "they", prob: 0.15 },
    { token: "the", prob: 0.12 },
    { token: "it", prob: 0.10 },
];

// Mock top-5 predictions when "scientist" is visible (more confident)
const CONFIDENT_PREDS = [
    { token: "she", prob: 0.61 },
    { token: "he", prob: 0.21 },
    { token: "they", prob: 0.08 },
    { token: "the", prob: 0.04 },
    { token: "it", prob: 0.02 },
];

export function LongRangeDependencyDemo() {
    const [windowSize, setWindowSize] = useState(3);

    // Window covers PRONOUN_IDX - windowSize .. PRONOUN_IDX - 1
    const windowStart = Math.max(0, PRONOUN_IDX - windowSize);
    const referentVisible = REFERENT_IDX >= windowStart;
    const preds = referentVisible ? CONFIDENT_PREDS : UNCERTAIN_PREDS;

    return (
        <div className="space-y-5">
            {/* Slider */}
            <div>
                <div className="flex justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">Context window size</span>
                    <span className="text-sm font-mono font-bold text-violet-400">N = {windowSize}</span>
                </div>
                <input
                    type="range" min={1} max={16} value={windowSize}
                    onChange={e => setWindowSize(Number(e.target.value))}
                    className="w-full accent-violet-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-white/15 mt-1">
                    <span>1</span><span>16 (full sentence)</span>
                </div>
            </div>

            {/* Sentence display */}
            <div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-2">Sentence</div>
                <div className="flex flex-wrap gap-1.5 leading-loose">
                    {WORDS.map((word, i) => {
                        const inWindow = i >= windowStart && i < PRONOUN_IDX;
                        const isPronoun = i === PRONOUN_IDX;
                        const isReferent = i === REFERENT_IDX;
                        const isFuture = i > PRONOUN_IDX;

                        let cls = "bg-white/[0.03] border-white/[0.05] text-white/15"; // outside window
                        if (isPronoun) cls = "bg-amber-500/15 border-amber-500/40 text-amber-200";
                        else if (isReferent && inWindow) cls = "bg-emerald-500/15 border-emerald-500/40 text-emerald-200";
                        else if (isReferent && !inWindow) cls = "bg-rose-500/[0.06] border-rose-500/15 text-white/15";
                        else if (inWindow) cls = "bg-white/[0.07] border-violet-500/20 text-white/60";
                        else if (isFuture) cls = "bg-white/[0.02] border-white/[0.04] text-white/20";

                        return (
                            <span
                                key={i}
                                className={`px-1.5 py-0.5 rounded border text-xs font-mono transition-all duration-300 ${cls}`}
                            >
                                {word}
                                {isPronoun && <span className="ml-0.5 text-[8px] text-amber-400/60">←</span>}
                            </span>
                        );
                    })}
                </div>
                <div className="flex gap-4 mt-2 text-[9px] font-mono text-white/25">
                    <span>
                        referent (&quot;scientist&quot;) is{" "}
                        <span className={referentVisible ? "text-emerald-400" : "text-rose-400"}>
                            {referentVisible ? "visible" : `${PRONOUN_IDX - REFERENT_IDX} tokens away`}
                        </span>
                    </span>
                </div>
            </div>

            {/* Two-panel comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* This model */}
                <div className={`rounded-xl border p-4 transition-all duration-300 ${referentVisible ? "border-emerald-500/20 bg-emerald-500/[0.03]" : "border-rose-500/20 bg-rose-500/[0.03]"
                    }`}>
                    <div className="text-[9px] font-mono uppercase tracking-widest mb-3 text-white/30">
                        MLP (N = {windowSize}) predicts next word after &quot;she&quot;
                    </div>
                    <div className="space-y-2">
                        {preds.map(({ token, prob }) => (
                            <div key={token} className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-white/50 w-10 text-right shrink-0">{token}</span>
                                <div className="flex-1 h-4 rounded bg-white/[0.04] overflow-hidden">
                                    <div
                                        className={`h-full rounded transition-all duration-300 ${referentVisible ? "bg-emerald-400/50" : "bg-rose-400/30"
                                            }`}
                                        style={{ width: `${(prob * 100).toFixed(0)}%` }}
                                    />
                                </div>
                                <span className="text-[10px] font-mono text-white/35 w-8 shrink-0">
                                    {(prob * 100).toFixed(0)}%
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className={`text-[9px] font-mono mt-3 ${referentVisible ? "text-emerald-400/60" : "text-rose-400/60"}`}>
                        {referentVisible ? "Referent in view — more confident" : "Referent hidden — spread, uncertain"}
                    </div>
                </div>

                {/* "Human" / full context */}
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.03] p-4">
                    <div className="text-[9px] font-mono uppercase tracking-widest mb-3 text-white/30">
                        Full context (entire sentence)
                    </div>
                    <div className="space-y-2">
                        {[
                            { token: "she", prob: 0.94 },
                            { token: "he", prob: 0.04 },
                            { token: "they", prob: 0.01 },
                            { token: "the", prob: 0.005 },
                            { token: "it", prob: 0.003 },
                        ].map(({ token, prob }) => (
                            <div key={token} className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-white/50 w-10 text-right shrink-0">{token}</span>
                                <div className="flex-1 h-4 rounded bg-white/[0.04] overflow-hidden">
                                    <div
                                        className="h-full rounded bg-violet-400/60 transition-all duration-300"
                                        style={{ width: `${(prob * 100).toFixed(0)}%` }}
                                    />
                                </div>
                                <span className="text-[10px] font-mono text-white/35 w-8 shrink-0">
                                    {(prob * 100).toFixed(0)}%
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="text-[9px] font-mono text-violet-400/60 mt-3">
                        &quot;scientist&quot; → feminine pronoun → 94% confident
                    </div>
                </div>
            </div>

            <div className="text-[10px] font-mono text-white/20 italic">
                Prediction distributions are illustrative. Try sliding N to 16 to see the MLP window reach &quot;scientist&quot;.
            </div>
        </div>
    );
}
