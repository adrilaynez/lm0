"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { NN_COLORS } from "./visualizer-theme";

/*
  Side-by-side: function plot (left) + derivative plot (right).
  ReLU, Sigmoid, Tanh selectable.
  Highlight vanishing gradient regions (where derivative ≈ 0).
*/

type ActivationFn = "relu" | "sigmoid" | "tanh";

const SVG_W = 160;
const SVG_H = 120;
const PAD = 16;
const PW = SVG_W - PAD * 2;
const PH = SVG_H - PAD * 2;

const X_MIN = -4;
const X_MAX = 4;
const STEPS = 60;

function relu(x: number) { return Math.max(0, x); }
function sigmoid(x: number) { return 1 / (1 + Math.exp(-x)); }
function tanhFn(x: number) { return Math.tanh(x); }

function reluDeriv(x: number) { return x > 0 ? 1 : 0; }
function sigmoidDeriv(x: number) { const s = sigmoid(x); return s * (1 - s); }
function tanhDeriv(x: number) { const t = tanhFn(x); return 1 - t * t; }

const FNS: Record<ActivationFn, { fn: (x: number) => number; deriv: (x: number) => number; yMin: number; yMax: number; dMin: number; dMax: number }> = {
    relu: { fn: relu, deriv: reluDeriv, yMin: -0.5, yMax: 4, dMin: -0.2, dMax: 1.3 },
    sigmoid: { fn: sigmoid, deriv: sigmoidDeriv, yMin: -0.2, yMax: 1.2, dMin: -0.05, dMax: 0.35 },
    tanh: { fn: tanhFn, deriv: tanhDeriv, yMin: -1.2, yMax: 1.2, dMin: -0.1, dMax: 1.2 },
};

function buildPath(evalFn: (x: number) => number, yMin: number, yMax: number): string {
    const pts: string[] = [];
    for (let i = 0; i <= STEPS; i++) {
        const x = X_MIN + (i / STEPS) * (X_MAX - X_MIN);
        const y = evalFn(x);
        const sx = PAD + (i / STEPS) * PW;
        const sy = PAD + (1 - (y - yMin) / (yMax - yMin)) * PH;
        pts.push(`${i === 0 ? "M" : "L"}${sx.toFixed(1)},${Math.max(PAD, Math.min(PAD + PH, sy)).toFixed(1)}`);
    }
    return pts.join(" ");
}

// Vanishing gradient regions: where |derivative| < threshold
function vanishingRegions(derivFn: (x: number) => number, threshold: number = 0.05): { x1: number; x2: number }[] {
    const regions: { x1: number; x2: number }[] = [];
    let inRegion = false;
    let start = X_MIN;
    for (let i = 0; i <= STEPS; i++) {
        const x = X_MIN + (i / STEPS) * (X_MAX - X_MIN);
        const d = Math.abs(derivFn(x));
        if (d < threshold && !inRegion) { inRegion = true; start = x; }
        if (d >= threshold && inRegion) { inRegion = false; regions.push({ x1: start, x2: x }); }
    }
    if (inRegion) regions.push({ x1: start, x2: X_MAX });
    return regions;
}

function MiniPlot({ path, color, label, yMin, yMax, vanishing }: {
    path: string; color: string; label: string; yMin: number; yMax: number;
    vanishing?: { x1: number; x2: number }[];
}) {
    return (
        <div className="flex-1">
            <p className="text-[8px] font-mono text-white/25 mb-1 text-center">{label}</p>
            <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full">
                <rect x={PAD} y={PAD} width={PW} height={PH} fill="rgba(0,0,0,0.25)" rx="3" />

                {/* Zero line */}
                {yMin < 0 && yMax > 0 && (
                    <line
                        x1={PAD} x2={PAD + PW}
                        y1={PAD + (1 - (0 - yMin) / (yMax - yMin)) * PH}
                        y2={PAD + (1 - (0 - yMin) / (yMax - yMin)) * PH}
                        stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 3"
                    />
                )}

                {/* Vanishing gradient regions */}
                {vanishing?.map((r, i) => {
                    const sx1 = PAD + ((r.x1 - X_MIN) / (X_MAX - X_MIN)) * PW;
                    const sx2 = PAD + ((r.x2 - X_MIN) / (X_MAX - X_MIN)) * PW;
                    return (
                        <rect
                            key={i}
                            x={Math.max(PAD, sx1)} y={PAD}
                            width={Math.min(sx2 - sx1, PW)} height={PH}
                            fill={NN_COLORS.error.hex} opacity={0.08} rx="2"
                        />
                    );
                })}

                {/* Function curve */}
                <motion.path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4 }}
                />
            </svg>
        </div>
    );
}

export function ActivationDerivativeVisualizer() {
    const { t } = useI18n();
    const [fn, setFn] = useState<ActivationFn>("relu");

    const cfg = FNS[fn];
    const fnPath = buildPath(cfg.fn, cfg.yMin, cfg.yMax);
    const derivPath = buildPath(cfg.deriv, cfg.dMin, cfg.dMax);
    const vanishing = fn !== "relu" ? vanishingRegions(cfg.deriv, fn === "sigmoid" ? 0.04 : 0.08) : [];

    const fnLabels: Record<ActivationFn, string> = {
        relu: "ReLU",
        sigmoid: "Sigmoid",
        tanh: "Tanh",
    };

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Function selector */}
            <div className="flex gap-2 flex-wrap">
                {(["relu", "sigmoid", "tanh"] as ActivationFn[]).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFn(f)}
                        className={`px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition-all border ${
                            fn === f
                                ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
                                : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/60"
                        }`}
                    >
                        {fnLabels[f]}
                    </button>
                ))}
            </div>

            {/* Side-by-side plots */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={fn}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="flex gap-3"
                >
                    <MiniPlot
                        path={fnPath}
                        color={NN_COLORS.hidden.hex}
                        label={`f(x) = ${fnLabels[fn]}`}
                        yMin={cfg.yMin}
                        yMax={cfg.yMax}
                    />
                    <MiniPlot
                        path={derivPath}
                        color={NN_COLORS.weight.hex}
                        label={`f'(x) — ${t("neuralNetworkNarrative.activationDeriv.derivLabel")}`}
                        yMin={cfg.dMin}
                        yMax={cfg.dMax}
                        vanishing={vanishing}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Vanishing gradient warning */}
            {fn !== "relu" && (
                <div className="rounded-lg bg-rose-500/[0.04] border border-rose-500/15 px-3 py-2">
                    <p className="text-[10px] font-mono" style={{ color: NN_COLORS.error.hex }}>
                        {t("neuralNetworkNarrative.activationDeriv.vanishingWarning")}
                    </p>
                    <p className="text-[10px] text-white/30 mt-1">
                        {fn === "sigmoid"
                            ? t("neuralNetworkNarrative.activationDeriv.sigmoidNote")
                            : t("neuralNetworkNarrative.activationDeriv.tanhNote")}
                    </p>
                </div>
            )}

            {fn === "relu" && (
                <div className="rounded-lg bg-emerald-500/[0.04] border border-emerald-500/15 px-3 py-2">
                    <p className="text-[10px] font-mono" style={{ color: NN_COLORS.output.hex }}>
                        {t("neuralNetworkNarrative.activationDeriv.reluNote")}
                    </p>
                </div>
            )}

            <p className="text-[10px] text-white/25 text-center">
                {t("neuralNetworkNarrative.activationDeriv.hint")}
            </p>
        </div>
    );
}
