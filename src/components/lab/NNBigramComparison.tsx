"use client";

import { useState, useMemo, useCallback } from "react";
import { useI18n } from "@/i18n/context";
import { NN_COLORS } from "./nn/visualizer-theme";

const CHARS = ["a", "b", "c", "d", "e"];

const BIGRAM_COUNTS = [
    [0, 50, 10, 5, 35],
    [20, 0, 30, 10, 40],
    [40, 15, 0, 25, 20],
    [10, 30, 20, 0, 40],
    [30, 25, 15, 30, 0],
];

function normalizeRows(matrix: number[][]): number[][] {
    return matrix.map(row => {
        const sum = row.reduce((a, b) => a + b, 0);
        return sum > 0 ? row.map(v => v / sum) : row.map(() => 1 / row.length);
    });
}

function softmaxRows(logits: number[][]): number[][] {
    return logits.map(row => {
        const max = Math.max(...row);
        const exps = row.map(v => Math.exp(v - max));
        const sum = exps.reduce((a, b) => a + b, 0);
        return exps.map(e => e / sum);
    });
}

function initWeights(rows: number, cols: number): number[][] {
    return Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => (Math.random() - 0.5) * 0.5)
    );
}

const BIGRAM_PROBS = normalizeRows(BIGRAM_COUNTS);

function trainStep(weights: number[][], lr: number): number[][] {
    const probs = softmaxRows(weights);
    return weights.map((row, i) =>
        row.map((w, j) => w - lr * (probs[i][j] - BIGRAM_PROBS[i][j]))
    );
}

function matrixDistance(a: number[][], b: number[][]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < a[i].length; j++) {
            sum += (a[i][j] - b[i][j]) ** 2;
        }
    }
    return Math.sqrt(sum);
}

function HeatCell({ value, maxVal, color }: { value: number; maxVal: number; color?: string }) {
    const intensity = maxVal > 0 ? value / maxVal : 0;
    const alpha = Math.max(0.04, Math.min(0.85, intensity));
    const hex = color || NN_COLORS.hidden.hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (
        <td className="p-0.5">
            <div
                className="w-full aspect-square flex items-center justify-center text-[8px] font-mono font-medium transition-all duration-200 rounded-sm"
                style={{
                    backgroundColor: `rgba(${r},${g},${b},${alpha})`,
                    color: alpha > 0.35 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)",
                }}
            >
                {value.toFixed(2)}
            </div>
        </td>
    );
}

// Pre-compute snapshots at key training steps for the progression feature
function computeSnapshot(steps: number): number[][] {
    let w = initWeights(5, 5);
    for (let i = 0; i < steps; i++) w = trainStep(w, 0.5);
    return w;
}

const SNAPSHOTS: { step: number; label: string; weights: number[][] }[] = [
    { step: 0, label: "0", weights: initWeights(5, 5) },
    { step: 100, label: "100", weights: computeSnapshot(100) },
    { step: 1000, label: "1k", weights: computeSnapshot(1000) },
    { step: 5000, label: "5k", weights: computeSnapshot(5000) },
    { step: 10000, label: "10k", weights: computeSnapshot(10000) },
];

export function NNBigramComparison() {
    const { t } = useI18n();
    const [weights, setWeights] = useState(() => initWeights(5, 5));
    const [stepCount, setStepCount] = useState(0);
    const [snapshotMode, setSnapshotMode] = useState(false);
    const [snapshotIdx, setSnapshotIdx] = useState(0);

    const activeWeights = snapshotMode ? SNAPSHOTS[snapshotIdx].weights : weights;
    const neuralProbs = useMemo(() => softmaxRows(activeWeights), [activeWeights]);
    const distance = useMemo(() => matrixDistance(neuralProbs, BIGRAM_PROBS), [neuralProbs]);
    const bigramMax = useMemo(() => Math.max(...BIGRAM_PROBS.flat()), []);
    const neuralMax = useMemo(() => Math.max(...neuralProbs.flat()), [neuralProbs]);
    const activeStep = snapshotMode ? SNAPSHOTS[snapshotIdx].step : stepCount;

    const doStep = useCallback(() => {
        setSnapshotMode(false);
        setWeights(prev => trainStep(prev, 0.5));
        setStepCount(s => s + 1);
    }, []);

    const doAutoTrain = useCallback(() => {
        setSnapshotMode(false);
        setWeights(prev => {
            let w = prev;
            for (let i = 0; i < 20; i++) w = trainStep(w, 0.5);
            return w;
        });
        setStepCount(s => s + 20);
    }, []);

    const handleReset = useCallback(() => {
        setSnapshotMode(false);
        setWeights(initWeights(5, 5));
        setStepCount(0);
    }, []);

    return (
        <div className="space-y-5 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bigram matrix */}
                <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider mb-2 pt-1 leading-tight" style={{ color: NN_COLORS.weight.hex + "99" }}>
                        {t("bigramWidgets.nnComparison.bigramTitle")}
                    </p>
                    <div className="overflow-hidden rounded-lg border border-white/[0.06]">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-1 text-[9px] font-mono text-white/20 w-8" />
                                    {CHARS.map((c) => (
                                        <th key={c} className="p-1 text-[9px] font-mono text-white/30 text-center">{c}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {BIGRAM_PROBS.map((row, i) => (
                                    <tr key={i}>
                                        <td className="p-1 text-[9px] font-mono text-white/30 text-center">{CHARS[i]}</td>
                                        {row.map((val, j) => (
                                            <HeatCell key={j} value={val} maxVal={bigramMax} color={NN_COLORS.weight.hex} />
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Neural weights */}
                <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider mb-3 leading-tight" style={{ color: NN_COLORS.weight.hex + "99" }}>
                        {t("bigramWidgets.nnComparison.neuralTitle")}
                    </p>
                    <div className="overflow-hidden rounded-lg border border-white/[0.06]">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-1 text-[9px] font-mono text-white/20 w-8" />
                                    {CHARS.map((c) => (
                                        <th key={c} className="p-1 text-[9px] font-mono text-white/30 text-center">{c}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {neuralProbs.map((row, i) => (
                                    <tr key={i}>
                                        <td className="p-1 text-[9px] font-mono text-white/30 text-center">{CHARS[i]}</td>
                                        {row.map((val, j) => (
                                            <HeatCell key={j} value={val} maxVal={neuralMax} color={NN_COLORS.weight.hex} />
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Snapshot progression toggle */}
            <div className="flex flex-wrap gap-2">
                <span className="text-[9px] font-mono text-white/20 self-center mr-1">
                    {t("bigramWidgets.nnComparison.progression")}
                </span>
                {SNAPSHOTS.map((snap, i) => (
                    <button
                        key={snap.step}
                        onClick={() => {
                            setSnapshotMode(true);
                            setSnapshotIdx(i);
                        }}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all border ${snapshotMode && snapshotIdx === i
                            ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                            : "bg-white/[0.02] border-white/[0.06] text-white/30 hover:text-white/50"
                            }`}
                    >
                        {snap.label}
                    </button>
                ))}
                <button
                    onClick={() => setSnapshotMode(false)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all border ${!snapshotMode
                        ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                        : "bg-white/[0.02] border-white/[0.06] text-white/30 hover:text-white/50"
                        }`}
                >
                    {t("bigramWidgets.nnComparison.live")}
                </button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-mono">
                <span className="text-white/30">
                    {t("bigramWidgets.nnComparison.stats.steps")} <span className="text-white/60 font-bold">{activeStep}</span>
                </span>
                <span className="text-white/30">
                    {t("bigramWidgets.nnComparison.stats.distance")} <span
                        className={`font-bold ${distance < 0.1 ? "text-emerald-400" : distance < 0.3 ? "text-amber-400" : "text-rose-400"}`}
                    >
                        {distance.toFixed(4)}
                    </span>
                </span>
                {distance < 0.1 && (
                    <span className="text-emerald-400/70">{t("bigramWidgets.nnComparison.stats.match")}</span>
                )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={doStep}
                    className="px-4 py-2 rounded-lg text-[11px] font-mono font-bold transition-colors"
                    style={{ background: NN_COLORS.weight.hex + "18", border: `1px solid ${NN_COLORS.weight.hex}33`, color: NN_COLORS.weight.hex }}
                >
                    {t("bigramWidgets.nnComparison.buttons.train")}
                </button>
                <button
                    onClick={doAutoTrain}
                    className="px-4 py-2 rounded-lg text-[11px] font-mono font-bold transition-colors"
                    style={{ background: NN_COLORS.bias.hex + "18", border: `1px solid ${NN_COLORS.bias.hex}33`, color: NN_COLORS.bias.hex }}
                >
                    {t("bigramWidgets.nnComparison.buttons.auto")}
                </button>
                <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/40 text-[11px] font-mono font-bold hover:text-white/60 transition-colors"
                >
                    {t("bigramWidgets.nnComparison.buttons.reset")}
                </button>
            </div>

            {distance < 0.1 && (
                <p className="text-center text-[11px] text-amber-400/70 italic font-semibold">
                    {t("bigramWidgets.nnComparison.emotionalMoment")}
                </p>
            )}
        </div>
    );
}
