"use client";

import { useState } from "react";

/*
  ContextWindowVisualizer
  Sentence: "Mary walked into the garden , and she"  (8 tokens)
  The model is predicting the 9th token.
  Context window = last N tokens. "Mary" (idx 0) becomes visible only at N=8.
*/

const TOKENS = ["Mary", "walked", "into", "the", "garden", ",", "and", "she"];
const PREDICT_LABEL = "began";
const REFERENT_IDX = 0;
const PRONOUN_IDX = 7;

function formatHidden(n: number) {
    return n === 0 ? "none" : n === 1 ? "1 token" : `${n} tokens`;
}

export function ContextWindowVisualizer() {
    const [windowSize, setWindowSize] = useState(3);

    const windowStart = Math.max(0, TOKENS.length - windowSize);
    const referentVisible = REFERENT_IDX >= windowStart;
    const hiddenCount = windowStart;

    return (
        <div className="space-y-5">
            {/* Slider */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                        Context window size
                    </span>
                    <span className="text-sm font-mono font-bold text-violet-400">N = {windowSize}</span>
                </div>
                <input
                    type="range" min={1} max={8} value={windowSize}
                    onChange={e => setWindowSize(Number(e.target.value))}
                    className="w-full accent-violet-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-white/15 mt-1">
                    <span>1</span><span>8</span>
                </div>
            </div>

            {/* Token row */}
            <div className="flex flex-wrap items-end gap-2">
                {TOKENS.map((tok, i) => {
                    const inWindow = i >= windowStart;
                    const isReferent = i === REFERENT_IDX;
                    const isPronoun = i === PRONOUN_IDX;

                    let chip = "bg-white/[0.03] border-white/[0.06] text-white/18";
                    if (isPronoun) chip = "bg-amber-500/15 border-amber-500/40 text-amber-200";
                    else if (isReferent && inWindow) chip = "bg-emerald-500/15 border-emerald-500/40 text-emerald-200";
                    else if (isReferent && !inWindow) chip = "bg-rose-500/[0.06] border-rose-500/15 text-white/15";
                    else if (inWindow) chip = "bg-white/[0.07] border-violet-500/25 text-white/65";

                    return (
                        <div key={i} className="flex flex-col items-center gap-1">
                            {(isReferent || isPronoun) && (
                                <span className={`text-[8px] font-mono transition-colors duration-300 ${
                                    isReferent
                                        ? inWindow ? "text-emerald-400/70" : "text-rose-400/40"
                                        : "text-amber-400/70"
                                }`}>
                                    {isReferent ? "referent" : "pronoun"}
                                </span>
                            )}
                            <div className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all duration-300 select-none ${chip}`}>
                                {tok}
                            </div>
                            {inWindow && i === windowStart && windowStart > 0 && (
                                <span className="text-[8px] font-mono text-violet-400/40 mt-0.5">window starts</span>
                            )}
                        </div>
                    );
                })}

                {/* Prediction slot */}
                <div className="flex flex-col items-center gap-1 ml-1">
                    <span className="text-[8px] font-mono text-violet-400/50">predict →</span>
                    <div className="px-2.5 py-1.5 rounded-lg border border-violet-500/30 bg-violet-500/[0.06] text-xs font-mono text-violet-300/60 italic">
                        {PREDICT_LABEL}
                    </div>
                </div>
            </div>

            {/* Stat chips */}
            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                    <div className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-1">visible</div>
                    <div className="text-lg font-mono font-bold text-violet-300">{windowSize}</div>
                    <div className="text-[9px] font-mono text-white/20">tokens</div>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                    <div className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-1">hidden</div>
                    <div className={`text-lg font-mono font-bold transition-colors duration-300 ${hiddenCount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {hiddenCount}
                    </div>
                    <div className="text-[9px] font-mono text-white/20">tokens</div>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                    <div className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-1">referent</div>
                    <div className={`text-lg font-mono font-bold transition-colors duration-300 ${referentVisible ? "text-emerald-400" : "text-rose-400"}`}>
                        {referentVisible ? "seen" : "dark"}
                    </div>
                </div>
            </div>

            {/* Status callout */}
            <div className={`rounded-xl border p-4 transition-all duration-300 ${
                referentVisible
                    ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                    : "border-rose-500/20 bg-rose-500/[0.04]"
            }`}>
                <div className="flex gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 transition-colors duration-300 ${referentVisible ? "bg-emerald-400" : "bg-rose-400"}`} />
                    <p className="text-sm text-white/55 leading-relaxed">
                        {referentVisible ? (
                            <>
                                <span className="font-semibold text-emerald-300">Referent visible.</span>{" "}
                                &quot;Mary&quot; is inside the context window. The model has a chance to associate
                                the pronoun &quot;she&quot; with its subject.
                            </>
                        ) : (
                            <>
                                <span className="font-semibold text-rose-300">Referent outside the window.</span>{" "}
                                &quot;Mary&quot; is {formatHidden(hiddenCount)} beyond the model&apos;s reach.
                                The model cannot know who &quot;she&quot; refers to — it predicts blindly.
                            </>
                        )}
                    </p>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-[10px] font-mono text-white/25">
                {[
                    { cls: "bg-amber-500/25 border-amber-500/40", label: "Pronoun" },
                    { cls: "bg-emerald-500/25 border-emerald-500/40", label: "Referent (when visible)" },
                    { cls: "bg-white/[0.07] border-violet-500/25", label: "Context window" },
                    { cls: "bg-white/[0.02] border-white/[0.06]", label: "Outside window" },
                ].map(({ cls, label }) => (
                    <div key={label} className="flex items-center gap-1.5">
                        <div className={`w-3 h-3 rounded border ${cls}`} />
                        <span>{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
