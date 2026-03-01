"use client";

import { useMemo,useState } from "react";

import { useI18n } from "@/i18n/context";

/*
  SoftmaxTemperatureVisualizer
  Shows how temperature reshapes a fixed logit distribution via softmax.
  Pure math — no backend.

  Conceptual: static logits, temperature slider 0.1 → 3.0
*/

// Fixed illustrative logits — intentionally asymmetric
const TOKENS = ["e", "t", "a", "o", "i", "n", "s", "h", "r", " "];
const LOGITS = [3.2, 2.8, 2.1, 1.9, 1.7, 1.4, 1.1, 0.8, 0.5, 2.5];

function softmax(logits: number[], temp: number): number[] {
    const scaled = logits.map(l => l / Math.max(temp, 0.01));
    const maxVal = Math.max(...scaled);
    const exps = scaled.map(l => Math.exp(l - maxVal));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
}

const TEMP_PRESETS = [
    { key: "deterministic", t: 0.1 },
    { key: "balanced", t: 0.7 },
    { key: "neutral", t: 1.0 },
    { key: "creative", t: 2.5 },
];

function lerp(a: string, b: string, t: number): string {
    // Interpolate between two hex colors
    const parse = (hex: string) => [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
    ];
    const [r1, g1, b1] = parse(a);
    const [r2, g2, b2] = parse(b);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const bl = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r},${g},${bl})`;
}

export function SoftmaxTemperatureVisualizer() {
    const { t } = useI18n();
    const [temp, setTemp] = useState(1.0);

    const probs = useMemo(() => softmax(LOGITS, temp), [temp]);
    const maxProb = Math.max(...probs);

    const topToken = TOKENS[probs.indexOf(maxProb)];
    const entropy = -probs.reduce((s, p) => s + (p > 0 ? p * Math.log(p) : 0), 0);
    const uniformEntropy = Math.log(TOKENS.length);
    const entropyPct = Math.min(entropy / uniformEntropy, 1);

    const getModeLabel = () => {
        if (temp < 0.4) return { label: t("bigramWidgets.softmax.mode.deterministic.label"), sub: t("bigramWidgets.softmax.mode.deterministic.sub"), color: "text-violet-400" };
        if (temp < 0.8) return { label: t("bigramWidgets.softmax.mode.conservative.label"), sub: t("bigramWidgets.softmax.mode.conservative.sub"), color: "text-blue-400" };
        if (temp < 1.2) return { label: t("bigramWidgets.softmax.mode.neutral.label"), sub: t("bigramWidgets.softmax.mode.neutral.sub"), color: "text-emerald-400" };
        if (temp < 2.0) return { label: t("bigramWidgets.softmax.mode.creative.label"), sub: t("bigramWidgets.softmax.mode.creative.sub"), color: "text-amber-400" };
        return { label: t("bigramWidgets.softmax.mode.chaotic.label"), sub: t("bigramWidgets.softmax.mode.chaotic.sub"), color: "text-rose-400" };
    };

    const mode = getModeLabel();

    return (
        <div className="rounded-xl border border-white/[0.06] bg-black/30 p-5 space-y-5">
            <div className="space-y-1">
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/25">{t("bigramWidgets.softmax.title")}</p>
                <p className="text-sm text-white/50 leading-relaxed">
                    {t("bigramWidgets.softmax.description")}
                </p>
            </div>

            {/* Temperature slider */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">{t("bigramWidgets.softmax.label")}</span>
                    <span className="text-sm font-mono font-bold text-violet-300">{temp.toFixed(2)}</span>
                </div>
                <input
                    type="range" min={5} max={300} step={5}
                    value={Math.round(temp * 100)}
                    onChange={e => setTemp(Number(e.target.value) / 100)}
                    className="w-full accent-violet-500 cursor-pointer"
                />
                <div className="flex justify-between text-[8px] font-mono text-white/15">
                    <span>0.05 {t("bigramWidgets.softmax.deterministic")}</span>
                    <span>1.0 {t("bigramWidgets.softmax.neutral")}</span>
                    <span>3.0 {t("bigramWidgets.softmax.chaotic")}</span>
                </div>
            </div>

            {/* Mode label */}
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <span className={`text-sm font-mono font-bold ${mode.color}`}>{mode.label}</span>
                <span className="text-[10px] font-mono text-white/30 max-w-xs text-right">{mode.sub}</span>
            </div>

            {/* Bar chart */}
            <div className="space-y-1.5">
                <p className="text-[9px] font-mono uppercase tracking-widest text-white/20">{t("bigramNarrative.sampling.softmaxFigureLabel")}</p>
                {TOKENS.map((tok, i) => {
                    const p = probs[i];
                    const isTop = tok === topToken;
                    const barColor = isTop
                        ? "rgb(167,139,250)"
                        : lerp("#1e3a2f", "#3b82f6", p / maxProb);
                    return (
                        <div key={tok} className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono w-4 text-center shrink-0 ${isTop ? "text-violet-300 font-bold" : "text-white/30"}`}>
                                {tok === " " ? "⎵" : tok}
                            </span>
                            <div className="flex-1 h-5 rounded bg-white/[0.03] overflow-hidden relative">
                                <div
                                    className="absolute left-0 top-0 h-full rounded transition-all duration-200"
                                    style={{ width: `${(p * 100).toFixed(1)}%`, backgroundColor: barColor }}
                                />
                            </div>
                            <span className="text-[9px] font-mono text-white/30 w-10 text-right">
                                {(p * 100).toFixed(1)}%
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                    <p className="text-[8px] font-mono uppercase tracking-widest text-white/20 mb-1">{t("bigramWidgets.softmax.stats.topToken")}</p>
                    <p className="text-lg font-mono font-bold text-violet-300">{topToken === " " ? "⎵" : topToken}</p>
                    <p className="text-[9px] font-mono text-white/30">{(maxProb * 100).toFixed(1)}%</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                    <p className="text-[8px] font-mono uppercase tracking-widest text-white/20 mb-1">{t("bigramWidgets.softmax.stats.entropy")}</p>
                    <p className="text-lg font-mono font-bold text-white/60">{entropy.toFixed(2)}</p>
                    <p className="text-[9px] font-mono text-white/30">{(entropyPct * 100).toFixed(0)}% {t("bigramWidgets.softmax.stats.max")}</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                    <p className="text-[8px] font-mono uppercase tracking-widest text-white/20 mb-1">{t("bigramWidgets.softmax.stats.spread")}</p>
                    <div className="h-3 rounded bg-white/[0.04] overflow-hidden mt-2">
                        <div
                            className="h-full rounded bg-violet-500/50 transition-all duration-200"
                            style={{ width: `${(entropyPct * 100).toFixed(0)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2">
                {TEMP_PRESETS.map(({ key, t: val }) => (
                    <button
                        key={key}
                        onClick={() => setTemp(val)}
                        className={`px-2.5 py-1 rounded text-[9px] font-mono border transition-all ${Math.abs(temp - val) < 0.05
                            ? "bg-violet-500/20 text-violet-300 border-violet-500/40"
                            : "bg-white/[0.03] text-white/30 border-white/[0.06] hover:text-white/50"
                            }`}
                    >
                        {val.toFixed(1)} — {t(`bigramWidgets.softmax.presets.${key}`)}
                    </button>
                ))}
            </div>

            <div className="rounded-lg border border-violet-500/10 bg-violet-500/[0.03] px-4 py-3 text-[11px] text-white/40 leading-relaxed">
                <span className="text-violet-400/70 font-semibold">{t("common.note")}: </span>
                {t("bigramWidgets.softmax.note")}
            </div>
        </div>
    );
}
