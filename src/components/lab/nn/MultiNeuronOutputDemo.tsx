"use client";

import { useI18n } from "@/i18n/context";

const CHARS = "abcdefghijklmnopqrstuvwxyz ".split("");

const LOGITS: Record<string, number> = {
    e: 2.1, " ": 1.4, a: 0.8, i: 0.5, o: 0.4, n: 0.3, s: 0.2, t: 0.1,
    r: 0.0, l: -0.1, h: -0.2, d: -0.3, c: -0.4, u: -0.5, m: -0.5,
    p: -0.6, f: -0.6, g: -0.7, b: -0.7, w: -0.8, y: -0.8, v: -0.9,
    k: -0.9, j: -1.0, x: -1.0, q: -1.0, z: -1.0,
};

const MAX_LOGIT = 2.1;
const MIN_LOGIT = -1.0;
const RANGE = MAX_LOGIT - MIN_LOGIT;

const sorted = [...CHARS].sort((a, b) => (LOGITS[b] ?? 0) - (LOGITS[a] ?? 0));
const top3 = new Set(sorted.slice(0, 3));

export function MultiNeuronOutputDemo() {
    const { t } = useI18n();

    return (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.015] p-6">
            <p className="text-xs font-mono uppercase tracking-widest text-white/30 mb-2">
                {t("neuralNetworkNarrative.fromNumbers.multiNeuron.title")}
            </p>
            <p className="text-[11px] text-white/25 mb-4">
                {t("neuralNetworkNarrative.fromNumbers.multiNeuron.inputLabel")}
            </p>
            <p className="text-[10px] text-white/20 uppercase tracking-widest mb-3">
                {t("neuralNetworkNarrative.fromNumbers.multiNeuron.logitsLabel")}
            </p>

            <div className="space-y-[3px]">
                {sorted.map((ch) => {
                    const val = LOGITS[ch] ?? 0;
                    const pct = ((val - MIN_LOGIT) / RANGE) * 100;
                    const isTop = top3.has(ch);
                    return (
                        <div key={ch} className="flex items-center gap-2 h-5">
                            <span className={`w-4 text-right font-mono text-[10px] ${isTop ? "text-rose-400 font-bold" : "text-white/30"}`}>
                                {ch === " " ? "␣" : ch}
                            </span>
                            <div className="flex-1 h-3 rounded-full bg-white/[0.03] overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${isTop ? "bg-rose-500/60" : "bg-rose-500/20"}`}
                                    style={{ width: `${Math.max(1, pct)}%` }}
                                />
                            </div>
                            {isTop && (
                                <span className="text-[10px] font-mono text-rose-400/70 w-8 text-right">{val.toFixed(1)}</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
