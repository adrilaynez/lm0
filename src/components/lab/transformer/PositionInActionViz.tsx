"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";

/*
  V37 — PositionInActionViz — v2
  Toggle "dog" between subject (pos 2) and object (pos 5).
  Shows the same word at different positions → different attention.
  Ghost bars show the other config for instant comparison.
*/

const D = 12;

/* Distinct embeddings per word for realistic attention variation */
const WORD_EMBEDS: Record<string, number[]> = {
    "The": [0.1, 0.0, 0.3, 0.8, 0.1, -0.1, 0.2, 0.0, 0.4, -0.2, 0.1, 0.3],
    "the": [0.1, 0.0, 0.3, 0.8, 0.1, -0.1, 0.2, 0.0, 0.4, -0.2, 0.1, 0.3],
    "dog": [0.9, -0.3, 0.7, 0.1, 0.5, -0.2, 0.4, 0.6, 0.8, -0.4, 0.3, 0.5],
    "man": [0.8, -0.2, 0.5, 0.4, 0.3, 0.6, -0.1, 0.3, 0.7, -0.1, 0.5, 0.2],
    "bit": [-0.1, 0.8, 0.3, -0.5, 0.6, 0.1, -0.3, 0.7, 0.2, 0.9, -0.4, 0.1],
};

function posEnc(pos: number): number[] {
    return Array.from({ length: D }, (_, i) => {
        const freq = 1 / Math.pow(100, (2 * Math.floor(i / 2)) / D);
        return i % 2 === 0 ? Math.sin(pos * freq) : Math.cos(pos * freq);
    });
}

function computeAttn(sentence: string[], fromIdx: number): number[] {
    const embeddings = sentence.map((w, i) => {
        const base = WORD_EMBEDS[w] || WORD_EMBEDS["the"];
        const pe = posEnc(i);
        return base.map((v, d) => v + pe[d]);
    });
    const q = embeddings[fromIdx];
    const scores = embeddings.map((k) =>
        q.reduce((s, v, d) => s + v * k[d], 0)
    );
    const max = Math.max(...scores);
    const exps = scores.map((s) => Math.exp((s - max) / 1.8));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map((e) => e / sum);
}

/* Two configs: dog as subject vs dog as object */
const CONFIGS = [
    { sentence: ["The", "dog", "bit", "the", "man"], dogPos: 1, label: "Position 2", role: "subject" },
    { sentence: ["The", "man", "bit", "the", "dog"], dogPos: 4, label: "Position 5", role: "object" },
];

export function PositionInActionViz() {
    const [cfgIdx, setCfgIdx] = useState(0);
    const cfg = CONFIGS[cfgIdx];
    const otherCfg = CONFIGS[1 - cfgIdx];

    const attn = useMemo(() => computeAttn(cfg.sentence, cfg.dogPos), [cfg]);
    const otherAttn = useMemo(() => computeAttn(otherCfg.sentence, otherCfg.dogPos), [otherCfg]);
    const maxW = Math.max(...attn, ...otherAttn);

    const accentRgb = cfgIdx === 0 ? "34,211,238" : "251,191,36";
    const ghostRgb = cfgIdx === 0 ? "251,191,36" : "34,211,238";

    return (
        <div className="py-8 sm:py-10 px-3 sm:px-4" style={{ minHeight: 320 }}>
            {/* Position toggle */}
            <div className="flex items-center justify-center gap-2 mb-5">
                <span className="text-[13px] text-white/45">Put &quot;dog&quot; at:</span>
                {CONFIGS.map((c, ci) => {
                    const active = ci === cfgIdx;
                    const rgb = ci === 0 ? "34,211,238" : "251,191,36";
                    return (
                        <motion.button
                            key={ci}
                            onClick={() => setCfgIdx(ci)}
                            whileTap={{ scale: 0.95 }}
                            className="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer"
                            style={{
                                background: active ? `rgba(${rgb}, 0.12)` : "rgba(255,255,255,0.04)",
                                color: active ? `rgba(${rgb}, 1)` : "rgba(255,255,255,0.35)",
                                border: active ? `1.5px solid rgba(${rgb}, 0.3)` : "1px solid rgba(255,255,255,0.08)",
                            }}
                        >
                            {c.label} ({c.role})
                        </motion.button>
                    );
                })}
            </div>

            {/* Sentence display */}
            <div className="flex items-center justify-center gap-1.5 mb-6">
                {cfg.sentence.map((word, i) => {
                    const isDog = i === cfg.dogPos;
                    return (
                        <motion.span
                            key={`${cfgIdx}-${i}`}
                            className="px-2.5 py-1 rounded-lg text-[14px] font-medium"
                            style={{
                                background: isDog ? `rgba(${accentRgb}, 0.1)` : "rgba(255,255,255,0.03)",
                                color: isDog ? `rgba(${accentRgb}, 1)` : "rgba(255,255,255,0.45)",
                                border: isDog ? `1px solid rgba(${accentRgb}, 0.25)` : "1px solid rgba(255,255,255,0.06)",
                            }}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                        >
                            {word}
                        </motion.span>
                    );
                })}
            </div>

            {/* Attention bars */}
            <div className="max-w-md mx-auto space-y-1.5">
                <p className="text-center text-[12px] text-white/35 mb-3">
                    Attention from &quot;dog&quot; at {cfg.label}:
                </p>

                {cfg.sentence.map((word, i) => {
                    const w = attn[i];
                    const pct = Math.round(w * 100);
                    const barPct = (w / maxW) * 100;
                    const isDog = i === cfg.dogPos;
                    const opacity = 0.2 + w * 0.6;

                    /* Ghost bar: the other config's attention for the same row */
                    const ghostW = otherAttn[i] ?? 0;
                    const ghostPct = (ghostW / maxW) * 100;

                    return (
                        <motion.div
                            key={`${cfgIdx}-${i}`}
                            className="flex items-center gap-2"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <span
                                className="w-12 text-right text-[13px] font-semibold shrink-0"
                                style={{ color: isDog ? `rgba(${accentRgb}, 1)` : `rgba(255,255,255,${0.3 + w * 0.4})` }}
                            >
                                {word}
                            </span>
                            <div
                                className="flex-1 h-6 rounded-md overflow-hidden relative"
                                style={{ background: "rgba(255,255,255,0.04)" }}
                            >
                                {/* Ghost bar from other position */}
                                <div
                                    className="absolute inset-y-0 left-0 rounded-md"
                                    style={{
                                        width: `${ghostPct}%`,
                                        background: `rgba(${ghostRgb}, 0.06)`,
                                        borderRight: ghostPct > 2 ? `1px dashed rgba(${ghostRgb}, 0.18)` : "none",
                                    }}
                                />
                                {/* Active bar */}
                                <motion.div
                                    className="absolute inset-y-0 left-0 rounded-md"
                                    style={{ background: `rgba(${accentRgb}, ${opacity})` }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${barPct}%` }}
                                    transition={{ type: "spring", stiffness: 150, damping: 20, delay: i * 0.05 }}
                                />
                            </div>
                            <motion.span
                                className="w-10 text-right text-[12px] font-mono font-bold shrink-0"
                                style={{ color: `rgba(${accentRgb}, ${0.4 + w * 0.5})` }}
                                key={`${cfgIdx}-${i}-v`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.15 + i * 0.05 }}
                            >
                                {pct}%
                            </motion.span>
                        </motion.div>
                    );
                })}

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-3 pt-2">
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-2 rounded-sm" style={{ background: `rgba(${accentRgb}, 0.5)` }} />
                        <span className="text-[10px] text-white/30">current</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-2 rounded-sm border border-dashed" style={{ borderColor: `rgba(${ghostRgb}, 0.25)`, background: `rgba(${ghostRgb}, 0.06)` }} />
                        <span className="text-[10px] text-white/30">other position</span>
                    </div>
                </div>
            </div>

            <motion.p
                className="max-w-xs mx-auto mt-5 text-center text-[14px] text-white/40 leading-relaxed"
                key={`insight-${cfgIdx}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                Same word, different position → <strong style={{ color: `rgba(${accentRgb}, 0.85)` }}>different attention pattern</strong>.
            </motion.p>
        </div>
    );
}
