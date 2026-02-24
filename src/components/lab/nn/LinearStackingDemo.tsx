"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/i18n/context";

/* ── helpers ─────────────────────────────────────────────────── */

const SVG_W = 400;
const SVG_H = 220;
const PAD = 30;
const X_MIN = -3;
const X_MAX = 3;
const Y_MIN = -3;
const Y_MAX = 3;
const SAMPLES = 120;

function toSvgX(x: number) { return PAD + ((x - X_MIN) / (X_MAX - X_MIN)) * (SVG_W - 2 * PAD); }
function toSvgY(y: number, clamp: boolean = true) {
    const v = clamp ? Math.max(Y_MIN, Math.min(Y_MAX, y)) : y;
    return SVG_H - PAD - (((v - Y_MIN) / (Y_MAX - Y_MIN)) * (SVG_H - 2 * PAD));
}
function relu(x: number) { return Math.max(0, x); }

const LAYER_COLORS = [
    { stroke: "rgba(56,189,248,0.6)", fill: "rgba(56,189,248,0.08)", text: "text-sky-400", border: "border-sky-500/30", bg: "bg-sky-500/10" },
    { stroke: "rgba(251,191,36,0.6)", fill: "rgba(251,191,36,0.08)", text: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10" },
    { stroke: "rgba(168,85,247,0.6)", fill: "rgba(168,85,247,0.08)", text: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10" },
    { stroke: "rgba(52,211,153,0.6)", fill: "rgba(52,211,153,0.08)", text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" },
    { stroke: "rgba(251,113,133,0.6)", fill: "rgba(251,113,133,0.08)", text: "text-rose-400", border: "border-rose-500/30", bg: "bg-rose-500/10" },
];

function makeLayer(seed: number): { a: number; b: number } {
    const a = 0.5 + ((seed * 7 + 3) % 13) / 13;
    const b = -0.8 + ((seed * 11 + 5) % 17) / 17;
    return { a, b };
}

function computePoints(layers: { a: number; b: number }[], useReluBetween: boolean): { x: number; y: number }[] {
    const xs = Array.from({ length: SAMPLES }, (_, i) => X_MIN + (i / (SAMPLES - 1)) * (X_MAX - X_MIN));
    return xs.map((x) => {
        let v = x;
        for (let i = 0; i < layers.length; i++) {
            v = layers[i].a * v + layers[i].b;
            if (useReluBetween && i < layers.length - 1) v = relu(v);
        }
        return { x, y: v };
    });
}

function computePerLayerCurves(layers: { a: number; b: number }[], useReluBetween: boolean): { x: number; y: number }[][] {
    const xs = Array.from({ length: SAMPLES }, (_, i) => X_MIN + (i / (SAMPLES - 1)) * (X_MAX - X_MIN));
    const all: { x: number; y: number }[][] = [];
    for (let L = 1; L <= layers.length; L++) {
        all.push(xs.map((x) => {
            let v = x;
            for (let i = 0; i < L; i++) {
                v = layers[i].a * v + layers[i].b;
                if (useReluBetween && i < L - 1) v = relu(v);
            }
            return { x, y: v };
        }));
    }
    return all;
}

function pointsToPath(pts: { x: number; y: number }[], clampY: boolean): string {
    return pts
        .map((p, i) => `${i === 0 ? "M" : "L"} ${toSvgX(p.x).toFixed(2)} ${toSvgY(p.y, clampY).toFixed(2)}`)
        .join(" ");
}

function countBends(pts: { x: number; y: number }[]): number {
    let bends = 0;
    for (let i = 1; i < pts.length - 1; i++) {
        const d1 = pts[i].y - pts[i - 1].y;
        const d2 = pts[i + 1].y - pts[i].y;
        if (Math.sign(d1) !== Math.sign(d2) && Math.abs(d1 - d2) > 0.05) bends++;
    }
    return bends;
}

/* ── component ───────────────────────────────────────────────── */

export function LinearStackingDemo() {
    const { t } = useI18n();
    const [numLayers, setNumLayers] = useState(1);
    const [useRelu, setUseRelu] = useState(false);

    const layers = useMemo(() => Array.from({ length: numLayers }, (_, i) => makeLayer(i)), [numLayers]);
    const reluEffective = useRelu && numLayers > 1;

    const perLayerCurves = useMemo(() => computePerLayerCurves(layers, reluEffective), [layers, reluEffective]);
    const finalPoints = useMemo(() => computePoints(layers, reluEffective), [layers, reluEffective]);
    const bends = useMemo(() => (reluEffective ? countBends(finalPoints) : 0), [finalPoints, reluEffective]);

    const isLinear = !reluEffective;
    const statusText = isLinear
        ? t("neuralNetworkNarrative.nonLinearity.stacking.stillLinear")
        : t("neuralNetworkNarrative.nonLinearity.stacking.bendCount").replace("{n}", String(bends));

    const clampY = reluEffective;

    return (
        <div className="rounded-2xl border border-emerald-500/[0.1] bg-[radial-gradient(ellipse_at_top,rgba(52,211,153,0.03),transparent)] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-emerald-500/[0.08] bg-emerald-500/[0.02]">
                <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
                </div>
                <p className="text-xs font-mono uppercase tracking-widest text-emerald-400/50">
                    {t("neuralNetworkNarrative.nonLinearity.stacking.title")}
                </p>
            </div>
            <div className="p-6">
                {/* Layer chips — visual pipeline */}
                <div className="flex items-center gap-2 mb-5 flex-wrap">
                    <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] px-3 py-1.5">
                        <span className="text-[10px] font-mono text-white/40">x</span>
                    </div>
                    {Array.from({ length: numLayers }).map((_, i) => {
                        const lc = LAYER_COLORS[i % LAYER_COLORS.length];
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className={`flex items-center gap-1.5 rounded-lg ${lc.bg} border ${lc.border} px-3 py-1.5`}
                            >
                                <span className={`text-[10px] font-mono font-bold ${lc.text}`}>L{i + 1}</span>
                                <span className={`text-[9px] font-mono ${lc.text} opacity-60`}>
                                    {layers[i].a.toFixed(1)}x + {layers[i].b.toFixed(1)}
                                </span>
                                {useRelu && i < numLayers - 1 && (
                                    <span className="text-[8px] font-mono text-rose-400/70 ml-1">→ ReLU</span>
                                )}
                            </motion.div>
                        );
                    })}
                    <motion.div
                        layout
                        className="flex items-center gap-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] px-3 py-1.5"
                    >
                        <span className="text-[10px] font-mono text-white/40">→ y</span>
                    </motion.div>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-4 mb-5">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setNumLayers((n) => Math.max(1, n - 1))}
                            disabled={numLayers <= 1}
                            className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 hover:border-white/[0.15] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-bold flex items-center justify-center"
                        >
                            −
                        </button>
                        <div className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                            <span className="text-sm font-mono font-bold text-indigo-400">{numLayers}</span>
                            <span className="text-[10px] font-mono text-indigo-400/50 ml-1">{numLayers === 1 ? "layer" : "layers"}</span>
                        </div>
                        <button
                            onClick={() => setNumLayers((n) => Math.min(5, n + 1))}
                            disabled={numLayers >= 5}
                            className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 hover:border-white/[0.15] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-bold flex items-center justify-center"
                        >
                            +
                        </button>
                    </div>

                    {/* ReLU toggle */}
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <div
                            onClick={() => setUseRelu((v) => !v)}
                            className={`relative w-11 h-6 rounded-full transition-all border ${useRelu
                                ? "bg-gradient-to-r from-rose-500/30 to-violet-500/30 border-rose-500/40"
                                : "bg-white/[0.06] border-white/[0.1]"
                                }`}
                        >
                            <motion.div
                                animate={{ x: useRelu ? 20 : 2 }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                className={`absolute top-0.5 w-5 h-5 rounded-full shadow-md ${useRelu ? "bg-rose-400" : "bg-white/30"
                                    }`}
                            />
                        </div>
                        <span className={`text-xs font-semibold transition-colors ${useRelu ? "text-rose-400" : "text-white/40"}`}>
                            {t("neuralNetworkNarrative.nonLinearity.stacking.addRelu")}
                        </span>
                    </label>
                </div>

                {/* SVG graph */}
                <div className={`rounded-xl overflow-hidden mb-4 border transition-all ${useRelu ? "border-rose-500/15 bg-gradient-to-br from-rose-500/[0.03] to-violet-500/[0.02]" : "border-white/[0.06] bg-black/30"}`}>
                    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" height={SVG_H} className="block">
                        {/* Grid */}
                        <line x1={toSvgX(0)} y1={PAD} x2={toSvgX(0)} y2={SVG_H - PAD} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                        <line x1={PAD} y1={toSvgY(0)} x2={SVG_W - PAD} y2={toSvgY(0)} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                        {[-2, -1, 1, 2].map((v) => (
                            <g key={v}>
                                <line x1={toSvgX(v)} y1={PAD} x2={toSvgX(v)} y2={SVG_H - PAD} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                                <line x1={PAD} y1={toSvgY(v)} x2={SVG_W - PAD} y2={toSvgY(v)} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                            </g>
                        ))}

                        {/* Axis labels */}
                        <text x={toSvgX(0) + 5} y={PAD - 4} fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="monospace">y</text>
                        <text x={SVG_W - PAD + 6} y={toSvgY(0) + 4} fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="monospace">x</text>

                        {/* Identity line (faint) */}
                        <line x1={toSvgX(X_MIN)} y1={toSvgY(X_MIN)} x2={toSvgX(X_MAX)} y2={toSvgY(X_MAX)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />

                        {/* Per-layer curves (ghost layers) */}
                        {perLayerCurves.slice(0, -1).map((pts, i) => (
                            <motion.path
                                key={`ghost-${i}-${useRelu}`}
                                d={pointsToPath(pts, clampY)}
                                fill="none"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                stroke={LAYER_COLORS[i % LAYER_COLORS.length].stroke}
                                opacity={0.25}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.25 }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                            />
                        ))}

                        {/* Final curve — bold */}
                        <motion.path
                            key={`final-${numLayers}-${useRelu}`}
                            d={pointsToPath(finalPoints, clampY)}
                            fill="none"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            stroke={useRelu
                                ? LAYER_COLORS[(numLayers - 1) % LAYER_COLORS.length].stroke.replace("0.6", "0.9")
                                : "rgba(255,255,255,0.5)"}
                            initial={{ opacity: 0, pathLength: 0 }}
                            animate={{ opacity: 1, pathLength: 1 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                    </svg>
                </div>

                {/* Status + insight */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${numLayers}-${useRelu}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                        className={`rounded-xl p-4 border transition-all ${useRelu
                            ? "bg-gradient-to-r from-rose-500/[0.06] to-violet-500/[0.04] border-rose-500/20"
                            : "bg-white/[0.02] border-white/[0.08]"
                            }`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`w-2 h-2 rounded-full ${useRelu ? "bg-rose-400 animate-pulse" : "bg-white/30"}`} />
                            <span className={`text-sm font-semibold ${useRelu ? "text-rose-400" : "text-white/50"}`}>
                                {numLayers} {numLayers === 1 ? "layer" : "layers"} · {statusText}
                            </span>
                        </div>
                        <p className={`text-xs ${useRelu ? "text-white/40" : "text-white/30"}`}>
                            {isLinear
                                ? numLayers === 1
                                    ? "A single linear transformation: ax + b. Just a straight line."
                                    : `${numLayers} linear layers composed together. But linear(linear(x)) = linear(x). Still just a straight line — depth is wasted!`
                                : `ReLU adds a bend at each layer boundary. ${numLayers} layers → up to ${Math.max(1, bends)} bend${bends !== 1 ? "s" : ""}. The more layers, the more complex the shape the network can learn.`
                            }
                        </p>
                    </motion.div>
                </AnimatePresence>

                <p className="mt-3 text-[11px] text-white/25 italic">
                    {t("neuralNetworkNarrative.nonLinearity.stacking.hint")}
                </p>
            </div>
        </div>
    );
}
