"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/i18n/context";

const CHARS = "abcdefghijklmnopqrstuvwxyz ".split("");

/* Per-input logit tables — rough English bigram-like distributions */
const LOGIT_TABLES: Record<string, Record<string, number>> = {
    t: { h: 2.4, o: 1.8, e: 1.5, i: 1.2, a: 0.9, r: 0.6, s: 0.4, " ": 0.2, u: 0.1, w: 0.0 },
    h: { e: 2.6, a: 1.9, i: 1.4, o: 1.1, " ": 0.8, r: 0.3, u: 0.2, y: 0.1 },
    e: { " ": 2.5, r: 2.0, s: 1.8, n: 1.5, d: 1.3, a: 1.0, l: 0.8, t: 0.6, x: 0.2 },
    a: { n: 2.3, t: 2.0, s: 1.7, r: 1.5, l: 1.2, " ": 1.0, d: 0.8, c: 0.5, y: 0.3 },
    i: { n: 2.4, s: 2.1, t: 1.8, o: 1.4, c: 1.1, " ": 0.9, l: 0.7, e: 0.5, d: 0.3 },
    n: { " ": 2.6, g: 2.0, d: 1.7, e: 1.4, t: 1.1, o: 0.8, s: 0.5, a: 0.3 },
    s: { " ": 2.5, t: 2.1, e: 1.8, h: 1.5, i: 1.2, o: 0.9, a: 0.6, u: 0.3 },
    o: { n: 2.3, r: 2.0, f: 1.7, " ": 1.5, u: 1.2, t: 1.0, s: 0.7, m: 0.4 },
    " ": { t: 2.5, a: 2.2, s: 1.9, i: 1.6, o: 1.4, h: 1.2, w: 1.0, b: 0.8, c: 0.6, f: 0.4 },
    r: { e: 2.4, " ": 2.0, o: 1.6, i: 1.3, a: 1.0, s: 0.7, t: 0.4 },
};

function getLogits(input: string): Record<string, number> {
    const table = LOGIT_TABLES[input] ?? {};
    const result: Record<string, number> = {};
    for (const ch of CHARS) {
        result[ch] = table[ch] ?? (Math.random() * 0.4 - 0.8);
    }
    return result;
}

function softmax(logits: Record<string, number>): Record<string, number> {
    const vals = Object.values(logits);
    const max = Math.max(...vals);
    const exps = Object.fromEntries(
        Object.entries(logits).map(([k, v]) => [k, Math.exp(v - max)])
    );
    const sum = Object.values(exps).reduce((a, b) => a + b, 0);
    return Object.fromEntries(Object.entries(exps).map(([k, v]) => [k, v / sum]));
}

/* Layout constants — no hidden layer, direct input → 27 outputs */
const SVG_W = 460;
const SVG_H = 300;
const INPUT_X = 52;
const OUTPUT_COLS = 9;
const OUT_CX = 160;
const OUT_START_Y = 30;
const OUT_GAP_X = 34;
const OUT_GAP_Y = 88;

function outputPos(i: number): { x: number; y: number } {
    const col = i % OUTPUT_COLS;
    const row = Math.floor(i / OUTPUT_COLS);
    return {
        x: OUT_CX + col * OUT_GAP_X,
        y: OUT_START_Y + row * OUT_GAP_Y,
    };
}

interface Particle {
    id: number;
    toX: number;
    toY: number;
    delay: number;
}

export function OutputLayerNetworkVisualizer() {
    const { t } = useI18n();
    const [selectedInput, setSelectedInput] = useState("t");
    const [logits, setLogits] = useState<Record<string, number>>({});
    const [particles, setParticles] = useState<Particle[]>([]);
    const [animating, setAnimating] = useState(false);
    const particleIdRef = useRef(0);

    const inputY = SVG_H / 2;

    useEffect(() => {
        const rawLogits = getLogits(selectedInput);
        setLogits(rawLogits);
        triggerAnimation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedInput]);

    function triggerAnimation() {
        if (animating) return;
        setAnimating(true);
        const newParticles: Particle[] = [];
        /* input → output directly */
        for (let o = 0; o < CHARS.length; o += 2) {
            const pos = outputPos(o);
            newParticles.push({
                id: particleIdRef.current++,
                toX: pos.x,
                toY: pos.y,
                delay: (o / CHARS.length) * 0.3,
            });
        }
        setParticles(newParticles);
        setTimeout(() => {
            setParticles([]);
            setAnimating(false);
        }, 1000);
    }

    const sortedByLogit = [...CHARS].sort((a, b) => (logits[b] ?? -1) - (logits[a] ?? -1));
    const top3 = new Set(sortedByLogit.slice(0, 3));

    const QUICK_INPUTS = ["t", "h", "e", "a", "i", "n", "s", "o", " ", "r"];

    return (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.015] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                    {t("neuralNetworkNarrative.fromNumbers.networkViz.label")}
                </span>
                <span className="text-[10px] text-white/20 font-mono">
                    1 input → 27 outputs
                </span>
            </div>

            {/* Input selector */}
            <div className="px-4 pt-4 pb-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/25 mb-2">
                    {t("neuralNetworkNarrative.fromNumbers.networkViz.inputPrompt")}
                </p>
                <div className="flex gap-1.5 flex-wrap">
                    {QUICK_INPUTS.map((ch) => (
                        <button
                            key={ch}
                            onClick={() => setSelectedInput(ch)}
                            className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all border ${selectedInput === ch
                                ? "bg-sky-500/20 border-sky-500/40 text-sky-300"
                                : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/60 hover:border-white/[0.14]"
                                }`}
                        >
                            {ch === " " ? "·" : ch}
                        </button>
                    ))}
                </div>
            </div>

            {/* SVG Network — no hidden layer */}
            <div className="px-4 pb-2 overflow-x-auto">
                <svg
                    viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                    className="w-full max-w-[460px] mx-auto"
                    style={{ minWidth: 300 }}
                >
                    {/* Connection lines: input → output (every 3rd for perf) */}
                    {CHARS.map((_, o) => {
                        if (o % 3 !== 0) return null;
                        const pos = outputPos(o);
                        return (
                            <line
                                key={`io-${o}`}
                                x1={INPUT_X} y1={inputY}
                                x2={pos.x} y2={pos.y}
                                stroke="rgba(244,63,94,0.08)"
                                strokeWidth="0.8"
                            />
                        );
                    })}

                    {/* Animated particles */}
                    <AnimatePresence>
                        {particles.map((p) => (
                            <motion.circle
                                key={p.id}
                                r={2.5}
                                fill="rgba(244,63,94,0.8)"
                                initial={{ cx: INPUT_X, cy: inputY, opacity: 0.9 }}
                                animate={{ cx: p.toX, cy: p.toY, opacity: 0 }}
                                transition={{ duration: 0.45, delay: p.delay, ease: "easeIn" }}
                            />
                        ))}
                    </AnimatePresence>

                    {/* Input neuron */}
                    <motion.circle
                        key={`input-${selectedInput}`}
                        cx={INPUT_X} cy={inputY} r={18}
                        fill="rgba(14,165,233,0.15)"
                        stroke="rgba(14,165,233,0.5)"
                        strokeWidth="1.5"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    />
                    <text
                        x={INPUT_X} y={inputY + 1}
                        textAnchor="middle" dominantBaseline="middle"
                        fill="rgba(125,211,252,0.9)"
                        fontSize="14" fontWeight="bold" fontFamily="monospace"
                    >
                        {selectedInput === " " ? "·" : selectedInput}
                    </text>
                    <text
                        x={INPUT_X} y={inputY + 28}
                        textAnchor="middle"
                        fill="rgba(125,211,252,0.4)"
                        fontSize="8" fontFamily="monospace"
                    >
                        input
                    </text>

                    {/* Output neurons — raw logits */}
                    {CHARS.map((ch, i) => {
                        const pos = outputPos(i);
                        const logit = logits[ch] ?? 0;
                        const isTop = top3.has(ch);
                        const radius = isTop ? 13 : 10;
                        return (
                            <g key={`out-${ch}`}>
                                <motion.circle
                                    cx={pos.x} cy={pos.y}
                                    r={radius}
                                    fill={isTop ? "rgba(244,63,94,0.25)" : "rgba(255,255,255,0.04)"}
                                    stroke={isTop ? "rgba(244,63,94,0.7)" : "rgba(255,255,255,0.12)"}
                                    strokeWidth={isTop ? 1.5 : 0.8}
                                />
                                <text
                                    x={pos.x} y={pos.y + 1}
                                    textAnchor="middle" dominantBaseline="middle"
                                    fill={isTop ? "rgba(253,164,175,0.95)" : "rgba(255,255,255,0.55)"}
                                    fontSize={isTop ? "9" : "8"}
                                    fontWeight={isTop ? "bold" : "normal"}
                                    fontFamily="monospace"
                                >
                                    {ch === " " ? "·" : ch}
                                </text>
                                {isTop && (
                                    <text
                                        x={pos.x} y={pos.y + 22}
                                        textAnchor="middle"
                                        fill="rgba(253,164,175,0.6)"
                                        fontSize="7" fontFamily="monospace"
                                    >
                                        {logit.toFixed(1)}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                    <text
                        x={OUT_CX + (OUTPUT_COLS - 1) * OUT_GAP_X / 2} y={SVG_H - 8}
                        textAnchor="middle"
                        fill="rgba(244,63,94,0.3)"
                        fontSize="8" fontFamily="monospace"
                    >
                        27 outputs · raw logits
                    </text>
                </svg>
            </div>

            {/* Raw logits note */}
            <div className="mx-4 mb-3 rounded-lg border border-amber-500/15 bg-amber-500/[0.04] px-3 py-2">
                <p className="text-[10px] text-amber-400/70 font-mono">
                    {t("neuralNetworkNarrative.fromNumbers.networkViz.logitsNote")}
                </p>
            </div>

            {/* Top predictions strip — showing raw scores */}
            <div className="px-4 pb-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-2">
                    {t("neuralNetworkNarrative.fromNumbers.networkViz.topRawScores")}
                </p>
                <div className="flex gap-2">
                    <AnimatePresence mode="popLayout">
                        {sortedByLogit.slice(0, 5).map((ch, rank) => (
                            <motion.div
                                key={`${selectedInput}-${ch}`}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.25, delay: rank * 0.04 }}
                                className={`flex flex-col items-center px-3 py-2 rounded-xl border ${rank === 0
                                    ? "bg-rose-500/15 border-rose-500/30"
                                    : rank < 3
                                        ? "bg-white/[0.04] border-white/[0.10]"
                                        : "bg-white/[0.02] border-white/[0.06]"
                                    }`}
                            >
                                <span className={`text-lg font-bold font-mono ${rank === 0 ? "text-rose-300" : "text-white/50"}`}>
                                    {ch === " " ? "·" : ch}
                                </span>
                                <span className={`text-[10px] font-mono ${rank === 0 ? "text-rose-400/70" : "text-white/25"}`}>
                                    {(logits[ch] ?? 0).toFixed(2)}
                                </span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
                <p className="text-[11px] text-white/25 mt-3 italic">
                    {t("neuralNetworkNarrative.fromNumbers.networkViz.hint")}
                </p>
            </div>
        </div>
    );
}
