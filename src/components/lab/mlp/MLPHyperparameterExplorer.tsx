"use client";

import { useCallback,useEffect, useMemo, useState } from "react";

import { Activity, AlertTriangle, ChevronDown, ChevronUp,Cpu, GitCompareArrows, Layers, Loader2, Sparkles, TrendingDown } from "lucide-react";

import { useI18n } from "@/i18n/context";
import type { MLPGenerateResponse,MLPGridConfig, MLPTimelineResponse } from "@/types/lmLab";

import { CrossConfigScatterPlot } from "./CrossConfigScatterPlot";
import { EmbeddingDriftAnimator } from "./EmbeddingDriftAnimator";
import { GeneralizationGapHeatmap } from "./GeneralizationGapHeatmap";
import { NearestNeighborExplorer } from "./NearestNeighborExplorer";
import { ActivationSaturationHeatmap,GradientHealthHeatmap } from "./SnapshotDiagnostics";

/* ─────────────────────────────────────────────
   MLPHyperparameterExplorer — v2
   Research-grade, data-driven explorer.

   Key design decisions:
   1. Primary metric = validation loss (scientifically meaningful).
   2. Cost = normalized compute estimate (params × 50k steps),
      NOT wall-clock time (noisy, machine-dependent).
   3. Smoothed train loss = mean of last N logged points.
   4. "Train–Val Gap" replaces "Gen Gap" with tooltip explanation.
   5. Layout: Timeline → Generated Text → Embedding Space.
   6. Timeline intelligence: stability, variance, spike detection.
   7. Anomaly badges with micro-explanations.
   8. Gradient norm + dead neuron mini-charts from timeline.
   9. All metrics have expandable info panels.
   ───────────────────────────────────────────── */

// All models trained for exactly 50k steps
const TOTAL_TRAINING_STEPS = 50_000;

// ── Section header primitive ─────────────────────────────────────────────────

function LabSection({
    number,
    title,
    subtitle,
    children,
}: {
    number: string;
    title: string;
    subtitle: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-4">
            {/* Divider + header */}
            <div className="flex items-center gap-4 pt-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full border border-violet-500/20 bg-violet-500/[0.07] text-[10px] font-mono font-bold text-violet-300/60 shrink-0">
                    {number}
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-white/50 leading-none">{title}</p>
                    <p className="text-[11px] text-white/25 leading-snug mt-0.5 font-light">{subtitle}</p>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-violet-500/10 to-transparent" />
            </div>
            {/* Content */}
            {children}
        </div>
    );
}

export interface MLPHyperparameterExplorerProps {
    configs: MLPGridConfig[];
    selectedConfig: MLPGridConfig | null;
    onSelectClosest: (params: { embeddingDim?: number; hiddenSize?: number; learningRate?: number }) => void;
    timeline: MLPTimelineResponse | null;
    timelineLoading: boolean;
    onFetchTimeline: () => Promise<void>;
    generation: MLPGenerateResponse | null;
    generationLoading: boolean;
    onGenerate: (seedText: string, maxTokens: number, temperature: number) => Promise<void>;
    gridLoading: boolean;
    gridError: string | null;
    isNarrativeMode?: boolean;
}

// ── Hover-only tooltip ─────────────────────────────────
// Wraps any element; shows explanation on hover. No icon, no dismiss.
function Tip({ children, text, align = "center" }: {
    children: React.ReactNode; text: string; align?: "left" | "center" | "right";
}) {
    const alignClass = align === "left" ? "left-0" : align === "right" ? "right-0" : "left-1/2 -translate-x-1/2";
    return (
        <span className="relative group inline-block cursor-help">
            {children}
            <span className={`pointer-events-none absolute z-40 bottom-full mb-2 w-56 rounded-lg bg-zinc-900 border border-white/10 px-3 py-2.5 text-[10px] text-white/55 leading-relaxed font-normal normal-case tracking-normal opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-xl whitespace-normal ${alignClass}`}>
                {text}
            </span>
        </span>
    );
}

// ── Expandable section wrapper ──────────────────────────

function Expandable({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="rounded-xl border border-white/[0.06] bg-black/30">
            <button onClick={() => setOpen(p => !p)} className="flex items-center justify-between w-full p-3 text-left">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/25">{title}</span>
                {open ? <ChevronUp className="w-3 h-3 text-white/20" /> : <ChevronDown className="w-3 h-3 text-white/20" />}
            </button>
            {open && <div className="px-4 pb-4">{children}</div>}
        </div>
    );
}

// ── Onboarding Overlay ──────────────────────────────────

function OnboardingOverlay({ onDismiss }: { onDismiss: () => void }) {
    const { t } = useI18n();
    const [step, setStep] = useState(0);
    const steps = [
        { key: "scatter", highlight: "scatter" },
        { key: "sliders", highlight: "sliders" },
        { key: "metrics", highlight: "metrics" },
    ] as const;
    const current = steps[step];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onDismiss}>
            <div className="relative max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="rounded-2xl border border-violet-500/30 bg-zinc-900/95 p-6 shadow-2xl">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                        <span className="text-xs font-mono font-bold uppercase tracking-widest text-violet-300">
                            {t("models.mlp.explorer.onboarding.title")}
                        </span>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed mb-4">
                        {t(`models.mlp.explorer.onboarding.${current.key}.text`)}
                    </p>
                    <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                            {steps.map((_, i) => (
                                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === step ? "bg-violet-400" : "bg-white/20"}`} />
                            ))}
                        </div>
                        <div className="flex gap-2">
                            {step < steps.length - 1 ? (
                                <button onClick={() => setStep(step + 1)} className="px-3 py-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-xs font-mono text-violet-300 transition-colors">
                                    {t("models.mlp.explorer.onboarding.next")}
                                </button>
                            ) : (
                                <button onClick={onDismiss} className="px-3 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-xs font-mono text-white font-bold transition-colors">
                                    {t("models.mlp.explorer.onboarding.gotIt")}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Anomaly / sanity flags ──────────────────────────────

interface AnomalyFlags {
    lossAboveRandom: boolean;
    largeGenGap: boolean;
    lossIncreasing: boolean;
    perplexityMismatch: boolean;
    unstableGradients: boolean;
    nonDecreasingLoss: boolean;
}

function detectAnomalies(
    config: MLPGridConfig,
    timeline: MLPTimelineResponse | null,
    computedGap?: number | null,
): AnomalyFlags {
    const flags: AnomalyFlags = {
        lossAboveRandom: false,
        largeGenGap: false,
        lossIncreasing: false,
        perplexityMismatch: false,
        unstableGradients: false,
        nonDecreasingLoss: false,
    };

    if (config.expected_uniform_loss != null) {
        flags.lossAboveRandom = config.final_loss >= config.expected_uniform_loss * 0.98;
    }

    const gapValue = computedGap ?? config.generalization_gap;
    if (gapValue != null) {
        flags.largeGenGap = gapValue > 0.3;
    }

    const expectedPerp = Math.exp(config.final_loss);
    if (Math.abs(expectedPerp - config.perplexity) / expectedPerp > 0.05) {
        flags.perplexityMismatch = true;
    }

    if (timeline?.metrics_log?.val_loss) {
        const vl = timeline.metrics_log.val_loss;
        if (vl.length >= 10) {
            const last5 = vl.slice(-5).map(e => e.value);
            const prev5 = vl.slice(-10, -5).map(e => e.value);
            const lastAvg = last5.reduce((a, b) => a + b, 0) / 5;
            const prevAvg = prev5.reduce((a, b) => a + b, 0) / 5;
            if (lastAvg > prevAvg * 1.02) flags.lossIncreasing = true;
        }
        // Non-decreasing: first half avg ≈ second half avg
        if (vl.length >= 20) {
            const mid = Math.floor(vl.length / 2);
            const firstHalf = vl.slice(0, mid).map(e => e.value);
            const secondHalf = vl.slice(mid).map(e => e.value);
            const fAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
            const sAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
            if (sAvg >= fAvg * 0.99) flags.nonDecreasingLoss = true;
        }
    }

    if (timeline?.metrics_log?.grad_norms) {
        const gn = timeline.metrics_log.grad_norms;
        if (gn.length >= 2) {
            const vals = extractGradNormValues(gn);
            if (vals.length >= 2) {
                const maxGn = Math.max(...vals);
                const minGn = Math.min(...vals);
                if (maxGn / (minGn || 1e-10) > 1000) flags.unstableGradients = true;
            }
        }
    }

    return flags;
}

// grad_norms entries may be {step, value: number} or {step, value: {total: number, ...}}
function extractGradNormValues(entries: { step: number; value: unknown }[]): number[] {
    return entries.map(e => {
        if (typeof e.value === "number") return e.value;
        if (e.value && typeof e.value === "object" && "total" in e.value) return (e.value as { total: number }).total;
        return 0;
    }).filter(v => v > 0);
}

// ── SVG charts ──────────────────────────────────────────

interface LossEntry { step: number; value: number }

function downsample(data: LossEntry[], maxPoints: number): LossEntry[] {
    if (data.length <= maxPoints) return data;
    const step = Math.ceil(data.length / maxPoints);
    const result: LossEntry[] = [];
    for (let i = 0; i < data.length; i += step) result.push(data[i]);
    if (result[result.length - 1] !== data[data.length - 1]) result.push(data[data.length - 1]);
    return result;
}

function DualLossChart({ trainLoss, valLoss, expectedUniformLoss }: {
    trainLoss: LossEntry[]; valLoss: LossEntry[];
    expectedUniformLoss?: number | null;
}) {
    const hasVal = valLoss.length >= 2;
    const hasTrain = trainLoss.length >= 2;
    if (!hasTrain && !hasVal) return null;

    const w = 440, h = 150, pad = 36, padRight = 14, padTop = 16;
    const allVals = [...trainLoss.map(e => e.value), ...valLoss.map(e => e.value),
    ...(expectedUniformLoss != null ? [expectedUniformLoss] : [])];
    const allSteps = [...trainLoss.map(e => e.step), ...valLoss.map(e => e.step)];
    const minVal = Math.min(...allVals) * 0.95;
    const maxVal = Math.max(...allVals) * 1.02;
    const valRange = maxVal - minVal || 1;
    const maxStep = Math.max(...allSteps) || 1;
    const toX = (s: number) => pad + (s / maxStep) * (w - pad - padRight);
    const toY = (v: number) => padTop + (1 - (v - minVal) / valRange) * (h - padTop - pad);
    const poly = (data: LossEntry[]) => data.map(e => `${toX(e.step).toFixed(1)},${toY(e.value).toFixed(1)}`).join(" ");
    const trainDown = downsample(trainLoss, 200);
    const valDown = downsample(valLoss, 200);
    const stepTicks = [0, Math.round(maxStep * 0.25), Math.round(maxStep * 0.5), Math.round(maxStep * 0.75), maxStep];

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: 200 }}>
            {[0.25, 0.5, 0.75].map(f => (
                <line key={f} x1={pad} y1={toY(minVal + f * valRange)} x2={w - padRight} y2={toY(minVal + f * valRange)}
                    stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
            ))}
            {expectedUniformLoss != null && (
                <>
                    <line x1={pad} y1={toY(expectedUniformLoss)} x2={w - padRight} y2={toY(expectedUniformLoss)}
                        stroke="rgba(251,113,133,0.25)" strokeWidth={1} strokeDasharray="4 3" />
                    <text x={w - padRight - 2} y={toY(expectedUniformLoss) - 4}
                        fontSize={8} fill="rgba(251,113,133,0.5)" fontFamily="monospace" textAnchor="end">random baseline</text>
                </>
            )}
            {hasTrain && <polyline points={poly(trainDown)} fill="none" stroke="rgba(139,92,246,0.5)" strokeWidth={1.2} strokeLinejoin="round" />}
            {hasVal && <polyline points={poly(valDown)} fill="none" stroke="rgb(52,211,153)" strokeWidth={1.8} strokeLinejoin="round" />}
            <text x={w / 2} y={h - 2} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={8} fontFamily="monospace">Training Steps</text>
            {stepTicks.map(s => (
                <text key={s} x={toX(s)} y={h - pad + 14} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize={7} fontFamily="monospace">
                    {s >= 1000 ? `${(s / 1000).toFixed(0)}k` : s}
                </text>
            ))}
            {hasTrain && <text x={w - padRight} y={toY(trainDown[trainDown.length - 1].value) + 3} fontSize={8} fill="rgba(139,92,246,0.7)" fontFamily="monospace" textAnchor="end">{trainDown[trainDown.length - 1].value.toFixed(3)}</text>}
            {hasVal && <text x={w - padRight} y={toY(valDown[valDown.length - 1].value) - 5} fontSize={9} fill="rgb(52,211,153)" fontFamily="monospace" textAnchor="end" fontWeight={700}>{valDown[valDown.length - 1].value.toFixed(3)}</text>}
            <circle cx={pad + 4} cy={8} r={3} fill="rgba(139,92,246,0.5)" />
            <text x={pad + 12} y={11} fontSize={8} fill="rgba(255,255,255,0.3)" fontFamily="monospace">train</text>
            <circle cx={pad + 50} cy={8} r={3} fill="rgb(52,211,153)" />
            <text x={pad + 58} y={11} fontSize={8} fill="rgba(255,255,255,0.3)" fontFamily="monospace">val (primary)</text>
        </svg>
    );
}

// Mini sparkline for gradient norms or dead neurons
function MiniSparkline({ data, color, label }: { data: LossEntry[]; color: string; label: string }) {
    if (data.length < 2) return null;
    const w = 300, h = 72, pad = 4;
    const vals = data.map(e => e.value);
    const min = Math.min(...vals); const max = Math.max(...vals); const range = max - min || 1;
    const pts = downsample(data, 100).map(e => {
        const x = pad + (e.step / (data[data.length - 1].step || 1)) * (w - pad * 2);
        const y = pad + (1 - (e.value - min) / range) * (h - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return (
        <div>
            <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{label}</span>
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full mt-1" style={{ maxHeight: 90 }}>
                <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
            </svg>
            <div className="flex justify-between text-[8px] font-mono text-white/20 mt-0.5">
                <span>{min.toFixed(3)}</span><span>{max.toFixed(3)}</span>
            </div>
        </div>
    );
}

// ── Slider control ──────────────────────────────────────

function SliderControl({ label, options, value, onChange, format }: {
    label: string; options: number[]; value: number; onChange: (v: number) => void; format?: (v: number) => string;
}) {
    const idx = options.indexOf(value);
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">{label}</span>
                <span className="text-xs font-mono font-bold text-violet-400">{format ? format(value) : value}</span>
            </div>
            <input type="range" min={0} max={options.length - 1} value={idx >= 0 ? idx : 0}
                onChange={(e) => onChange(options[Number(e.target.value)])} className="w-full accent-violet-500" />
            <div className="flex justify-between">
                {options.map((o) => (
                    <span key={o} className={`text-[8px] font-mono ${o === value ? "text-violet-400" : "text-white/15"}`}>{format ? format(o) : o}</span>
                ))}
            </div>
        </div>
    );
}

// ── Helpers ─────────────────────────────────────────────

function uniqueSorted(arr: number[]): number[] { return [...new Set(arr)].sort((a, b) => a - b); }
function formatParams(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
}
function formatLR(lr: number): string { return lr >= 0.01 ? lr.toFixed(2) : lr.toExponential(1); }

// Compute cost = params × steps. Deterministic, machine-independent.
// Normalized to [0,1] across grid for relative comparison.
function computeCostInfo(config: MLPGridConfig, allConfigs: MLPGridConfig[], labels: { minimal: string; low: string; moderate: string; high: string; veryHigh: string }): { flops: number; label: string; ratio: number } {
    const params = config.total_parameters ?? 0;
    const flops = params * TOTAL_TRAINING_STEPS;
    const allFlops = allConfigs.map(c => (c.total_parameters ?? 0) * TOTAL_TRAINING_STEPS).filter(f => f > 0);
    const maxFlops = Math.max(...allFlops) || 1;
    const ratio = flops / maxFlops;
    let label: string;
    if (ratio < 0.1) label = labels.minimal;
    else if (ratio < 0.25) label = labels.low;
    else if (ratio < 0.5) label = labels.moderate;
    else if (ratio < 0.75) label = labels.high;
    else label = labels.veryHigh;
    return { flops, label, ratio };
}

// Smoothed train loss: mean of last ~10% of logged points (≥10 points)
function smoothedTrainLoss(trainLossData: LossEntry[]): number | null {
    if (trainLossData.length < 2) return null;
    const n = Math.max(10, Math.floor(trainLossData.length * 0.1));
    const tail = trainLossData.slice(-n);
    return tail.reduce((s, e) => s + e.value, 0) / tail.length;
}

function lossSourceLabel(config: MLPGridConfig, labels: { valLoss: string; trainLoss: string; loss: string }): string {
    if (config.final_val_loss != null) return labels.valLoss;
    if (config.final_train_loss != null) return labels.trainLoss;
    return labels.loss;
}

// ── Timeline stability analysis ─────────────────────────

interface StabilityInfo {
    valVariance: number;
    valTrend: "decreasing" | "flat" | "increasing";
    spikeSteps: number[];
    convergenceStep: number | null; // step where loss first drops below 50% of initial
}

function analyzeStability(valLoss: LossEntry[], trainLoss: LossEntry[]): StabilityInfo | null {
    const data = valLoss.length >= 2 ? valLoss : trainLoss;
    if (data.length < 5) return null;
    const vals = data.map(e => e.value);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;

    // Trend: compare first and last quarter
    const q = Math.floor(vals.length / 4) || 1;
    const firstQ = vals.slice(0, q).reduce((a, b) => a + b, 0) / q;
    const lastQ = vals.slice(-q).reduce((a, b) => a + b, 0) / q;
    let valTrend: "decreasing" | "flat" | "increasing" = "flat";
    if (lastQ < firstQ * 0.95) valTrend = "decreasing";
    else if (lastQ > firstQ * 1.05) valTrend = "increasing";

    // Detect spikes: points > 2σ above local moving average
    const spikeSteps: number[] = [];
    const windowSize = Math.max(5, Math.floor(data.length / 10));
    for (let i = windowSize; i < data.length; i++) {
        const localMean = vals.slice(i - windowSize, i).reduce((a, b) => a + b, 0) / windowSize;
        const localStd = Math.sqrt(vals.slice(i - windowSize, i).reduce((s, v) => s + (v - localMean) ** 2, 0) / windowSize) || 0.01;
        if (vals[i] > localMean + 2.5 * localStd) spikeSteps.push(data[i].step);
    }

    // Convergence: first step below 50% of initial value
    const initVal = vals[0];
    const threshold = initVal * 0.5;
    let convergenceStep: number | null = null;
    for (const entry of data) {
        if (entry.value < threshold) { convergenceStep = entry.step; break; }
    }

    return { valVariance: variance, valTrend, spikeSteps, convergenceStep };
}

// ── Anomaly badges ──────────────────────────────────────

function AnomalyBadges({ flags }: { flags: AnomalyFlags }) {
    const { t } = useI18n();
    const badges: { label: string; tooltip: string }[] = [];
    if (flags.lossAboveRandom) badges.push({ label: t("models.mlp.explorer.anomalies.aboveRandom"), tooltip: t("models.mlp.explorer.anomalies.tooltips.aboveRandom") });
    if (flags.largeGenGap) badges.push({ label: t("models.mlp.explorer.anomalies.overfitting"), tooltip: t("models.mlp.explorer.anomalies.tooltips.overfitting") });
    if (flags.lossIncreasing) badges.push({ label: t("models.mlp.explorer.anomalies.valLossUp"), tooltip: t("models.mlp.explorer.anomalies.tooltips.valLossUp") });
    if (flags.nonDecreasingLoss) badges.push({ label: t("models.mlp.explorer.anomalies.noConvergence"), tooltip: t("models.mlp.explorer.anomalies.tooltips.noConvergence") });
    if (flags.unstableGradients) badges.push({ label: t("models.mlp.explorer.anomalies.unstableGrad"), tooltip: t("models.mlp.explorer.anomalies.tooltips.unstableGrad") });
    if (flags.perplexityMismatch) badges.push({ label: t("models.mlp.explorer.anomalies.pplMismatch"), tooltip: t("models.mlp.explorer.anomalies.tooltips.pplMismatch") });
    if (badges.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1.5">
            {badges.map(b => (
                <span key={b.label} title={b.tooltip}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400/80 border border-amber-500/20 cursor-help">
                    <AlertTriangle className="w-2.5 h-2.5" />{b.label}
                </span>
            ))}
        </div>
    );
}

// ── Config plain-English summary ────────────────────────

interface ConfigSummary { text: string; color: "emerald" | "amber" | "rose" | "blue" | "white" }

function buildConfigSummary(
    config: MLPGridConfig,
    flags: AnomalyFlags,
    computedGap: number | null,
    stability: StabilityInfo | null,
    summaries: { aboveRandom: string; nonDecreasing: string; overfitting: string; lossIncreasing: string; unstableGradients: string; stillImproving: string; balanced: string; converged: string },
): ConfigSummary {
    if (flags.lossAboveRandom)
        return { text: summaries.aboveRandom, color: "rose" };
    if (flags.nonDecreasingLoss)
        return { text: summaries.nonDecreasing, color: "amber" };
    const gap = computedGap ?? config.generalization_gap ?? 0;
    if (gap > 0.3)
        return { text: summaries.overfitting, color: "amber" };
    if (flags.lossIncreasing)
        return { text: summaries.lossIncreasing, color: "amber" };
    if (flags.unstableGradients)
        return { text: summaries.unstableGradients, color: "amber" };
    if (stability?.valTrend === "decreasing")
        return { text: summaries.stillImproving, color: "blue" };
    if (gap < 0.05 && config.final_loss < (config.expected_uniform_loss ?? Infinity) * 0.7)
        return { text: summaries.balanced, color: "emerald" };
    return { text: summaries.converged, color: "white" };
}

// ── Main component ──────────────────────────────────────

export function MLPHyperparameterExplorer({
    configs, selectedConfig, onSelectClosest,
    timeline, timelineLoading, onFetchTimeline,
    generation, generationLoading, onGenerate,
    gridLoading, gridError,
    isNarrativeMode = false,
}: MLPHyperparameterExplorerProps) {
    const { t } = useI18n();
    const safeConfigs = configs ?? [];
    const embDimOptions = useMemo(() => uniqueSorted(safeConfigs.map(c => c.embedding_dim)), [safeConfigs]);
    const hiddenSizeOptions = useMemo(() => uniqueSorted(safeConfigs.map(c => c.hidden_size)), [safeConfigs]);
    const lrOptions = useMemo(() => uniqueSorted(safeConfigs.map(c => c.learning_rate)), [safeConfigs]);

    // Onboarding overlay state (narrative mode only)
    const [showOnboarding, setShowOnboarding] = useState(() => {
        if (!isNarrativeMode) return false;
        if (typeof window === "undefined") return false;
        return !localStorage.getItem("mlp-explorer-onboarding-seen");
    });

    const handleDismissOnboarding = useCallback(() => {
        setShowOnboarding(false);
        if (typeof window !== "undefined") {
            localStorage.setItem("mlp-explorer-onboarding-seen", "true");
        }
    }, []);

    const [embDim, setEmbDim] = useState(selectedConfig?.embedding_dim ?? embDimOptions[0] ?? 8);
    const [hiddenSize, setHiddenSize] = useState(selectedConfig?.hidden_size ?? hiddenSizeOptions[0] ?? 128);
    const [lr, setLr] = useState(selectedConfig?.learning_rate ?? lrOptions[0] ?? 0.01);

    useEffect(() => {
        if (selectedConfig) {
            setEmbDim(selectedConfig.embedding_dim);
            setHiddenSize(selectedConfig.hidden_size);
            setLr(selectedConfig.learning_rate);
        }
    }, [selectedConfig]);

    const handleSliderChange = useCallback(
        (field: "embDim" | "hiddenSize" | "lr", value: number) => {
            const next = { embDim, hiddenSize, lr };
            next[field] = value;
            if (field === "embDim") setEmbDim(value);
            if (field === "hiddenSize") setHiddenSize(value);
            if (field === "lr") setLr(value);
            onSelectClosest({ embeddingDim: next.embDim, hiddenSize: next.hiddenSize, learningRate: next.lr });
        },
        [embDim, hiddenSize, lr, onSelectClosest]
    );

    useEffect(() => {
        if (selectedConfig && !timeline) onFetchTimeline();
    }, [selectedConfig, timeline, onFetchTimeline]);

    // ── Derived metrics ── (order matters: each depends on the previous)
    const trainLoss = useMemo(() => timeline?.metrics_log?.train_loss ?? [], [timeline]);
    const valLoss = useMemo(() => timeline?.metrics_log?.val_loss ?? [], [timeline]);

    const smoothedTrain = useMemo(() => smoothedTrainLoss(trainLoss), [trainLoss]);

    // Gap uses smoothed train loss when available — more accurate than raw final_train_loss
    const computedGap = useMemo(() => {
        if (selectedConfig?.final_val_loss != null && smoothedTrain != null) {
            return selectedConfig.final_val_loss - smoothedTrain;
        }
        return selectedConfig?.generalization_gap ?? null;
    }, [selectedConfig, smoothedTrain]);

    const anomalyFlags = useMemo(() => selectedConfig ? detectAnomalies(selectedConfig, timeline, computedGap) : null, [selectedConfig, timeline, computedGap]);

    const gradNormData = useMemo((): LossEntry[] => {
        if (!timeline?.metrics_log?.grad_norms) return [];
        return timeline.metrics_log.grad_norms.map(e => ({
            step: e.step,
            value: typeof e.value === "number" ? e.value :
                (e.value && typeof e.value === "object" && "total" in e.value) ? (e.value as { total: number }).total : 0,
        })).filter(e => e.value > 0);
    }, [timeline]);

    const deadNeuronData = useMemo((): LossEntry[] => {
        if (!timeline?.metrics_log?.dead_neurons) return [];
        return timeline.metrics_log.dead_neurons.map(e => ({
            step: e.step,
            value: typeof e.value === "number" ? e.value : 0,
        }));
    }, [timeline]);

    const loggingInfo = useMemo(() => {
        if (trainLoss.length < 2) return null;
        const steps = trainLoss.map(e => e.step);
        const diffs = steps.slice(1).map((s, i) => s - steps[i]);
        const minInterval = Math.min(...diffs); const maxInterval = Math.max(...diffs);
        return { count: trainLoss.length, minInterval, maxInterval, isUniform: minInterval === maxInterval, totalSteps: steps[steps.length - 1] };
    }, [trainLoss]);

    const stabilityInfo = useMemo(() => analyzeStability(valLoss, trainLoss), [valLoss, trainLoss]);

    const computeLabels = useMemo(() => ({ minimal: t("models.mlp.explorer.computeLabels.minimal"), low: t("models.mlp.explorer.computeLabels.low"), moderate: t("models.mlp.explorer.computeLabels.moderate"), high: t("models.mlp.explorer.computeLabels.high"), veryHigh: t("models.mlp.explorer.computeLabels.veryHigh") }), [t]);
    const lossLabels = useMemo(() => ({ valLoss: t("models.mlp.explorer.metrics.valLoss"), trainLoss: t("models.mlp.explorer.metrics.trainLoss"), loss: t("models.mlp.explorer.metrics.loss") }), [t]);
    const summaryTexts = useMemo(() => ({ aboveRandom: t("models.mlp.explorer.summaries.aboveRandom"), nonDecreasing: t("models.mlp.explorer.summaries.nonDecreasing"), overfitting: t("models.mlp.explorer.summaries.overfitting"), lossIncreasing: t("models.mlp.explorer.summaries.lossIncreasing"), unstableGradients: t("models.mlp.explorer.summaries.unstableGradients"), stillImproving: t("models.mlp.explorer.summaries.stillImproving"), balanced: t("models.mlp.explorer.summaries.balanced"), converged: t("models.mlp.explorer.summaries.converged") }), [t]);
    const costInfo = useMemo(() => selectedConfig ? computeCostInfo(selectedConfig, safeConfigs, computeLabels) : null, [selectedConfig, safeConfigs, computeLabels]);

    const [seedText, setSeedText] = useState("the ");
    const [temperature, setTemperature] = useState(0.8);
    const [maxTokens, setMaxTokens] = useState(80);
    const [compareOpen, setCompareOpen] = useState(false);
    const handleGenerate = useCallback(() => onGenerate(seedText, maxTokens, temperature), [seedText, maxTokens, temperature, onGenerate]);

    // ── Loading / error states ──
    if (gridLoading) return (
        <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-violet-400/50 animate-spin mb-3" />
            <p className="text-xs text-white/30 font-mono">{t("models.mlp.explorer.loading")}</p>
        </div>
    );
    if (gridError) return (
        <div className="flex items-center gap-2 px-3 py-3 rounded-lg bg-rose-500/[0.04] border border-rose-500/15">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
            <p className="text-[10px] text-rose-300/60 font-mono">{t("models.mlp.explorer.errorPrefix")} {gridError}</p>
        </div>
    );
    if (configs.length === 0) return (
        <div className="flex items-center gap-2 px-3 py-3 rounded-lg bg-amber-500/[0.04] border border-amber-500/15">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <p className="text-[10px] text-amber-300/60 font-mono">{t("models.mlp.explorer.noConfigs")}</p>
        </div>
    );

    return (
        <>
            {showOnboarding && <OnboardingOverlay onDismiss={handleDismissOnboarding} />}
            <div className="space-y-10">

                {/* ══════════════════════════════════════════════════
                    SECTION 1 — MODEL ZOO OVERVIEW
                ══════════════════════════════════════════════════ */}
                <LabSection
                    number="01"
                    title={t("models.mlp.explorer.sections.s01Title")}
                    subtitle={`${safeConfigs.length} ${t("models.mlp.explorer.sections.s01Subtitle")}`}
                >
                    {safeConfigs.length > 1 && (
                        <Expandable title={t("models.mlp.explorer.zoo.expandableTitle").replace("{count}", String(safeConfigs.length))} defaultOpen={true}>
                            <div className="space-y-3">
                                <p className="text-[11px] text-white/30 leading-relaxed font-mono">
                                    {t("models.mlp.explorer.zoo.description")}
                                </p>
                                <CrossConfigScatterPlot
                                    configs={safeConfigs}
                                    selectedConfig={selectedConfig}
                                    onSelect={(c) => onSelectClosest({ embeddingDim: c.embedding_dim, hiddenSize: c.hidden_size, learningRate: c.learning_rate })}
                                />
                            </div>
                        </Expandable>
                    )}
                    {/* Sliders */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {embDimOptions.length > 1 && <SliderControl label={t("models.mlp.explorer.sliders.embeddingDim")} options={embDimOptions} value={embDim} onChange={v => handleSliderChange("embDim", v)} />}
                        {hiddenSizeOptions.length > 1 && <SliderControl label={t("models.mlp.explorer.sliders.hiddenSize")} options={hiddenSizeOptions} value={hiddenSize} onChange={v => handleSliderChange("hiddenSize", v)} />}
                        {lrOptions.length > 1 && <SliderControl label={t("models.mlp.explorer.sliders.learningRate")} options={lrOptions} value={lr} onChange={v => handleSliderChange("lr", v)} format={formatLR} />}
                    </div>
                </LabSection>

                {/* ══════════════════════════════════════════════════
                SECTION 2 — SELECTED CONFIG PANEL
            ══════════════════════════════════════════════════ */}
                <LabSection
                    number="02"
                    title={t("models.mlp.explorer.sections.s02Title")}
                    subtitle={t("models.mlp.explorer.sections.s02Subtitle")}
                >
                    {/* ── Config badge ── */}
                    {selectedConfig && (
                        <div className="flex items-center gap-2 text-[10px] font-mono text-white/25">
                            <span className="text-violet-400/60">{t("models.mlp.explorer.config.active")}</span>
                            <span>emb={selectedConfig.embedding_dim}</span>
                            <span className="text-white/10">·</span>
                            <span>hidden={selectedConfig.hidden_size}</span>
                            <span className="text-white/10">·</span>
                            <span>ctx={selectedConfig.context_size}</span>
                            <span className="text-white/10">·</span>
                            <span>lr={formatLR(selectedConfig.learning_rate)}</span>
                            {selectedConfig.score != null && (
                                <><span className="text-white/10">·</span>
                                    <Tip text={t("models.mlp.explorer.metrics.tooltips.score")}>
                                        <span className="text-emerald-400/50">{t("models.mlp.explorer.config.score")}={selectedConfig.score.toFixed(2)}</span>
                                    </Tip></>
                            )}
                        </div>
                    )}

                    {/* ── Metric cards with micro-explanations ── */}
                    {selectedConfig && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {/* Val Loss (primary) + Smoothed Train */}
                            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <TrendingDown className="w-3 h-3 text-emerald-400/60" />
                                    <Tip text={selectedConfig.final_val_loss != null
                                        ? t("models.mlp.explorer.metrics.tooltips.valLoss")
                                        : t("models.mlp.explorer.metrics.tooltips.trainLossOnly")}>
                                        <span className="text-[9px] font-mono uppercase tracking-widest text-white/30">{lossSourceLabel(selectedConfig, lossLabels)}</span>
                                    </Tip>
                                </div>
                                <span className="text-lg font-mono font-bold text-white">{selectedConfig.final_loss.toFixed(3)}</span>
                                {smoothedTrain != null && (
                                    <div className="mt-1.5 pt-1.5 border-t border-white/[0.05]">
                                        <Tip text={t("models.mlp.explorer.metrics.tooltips.trainSmoothed")}>
                                            <span className="text-[8px] font-mono uppercase tracking-widest text-white/25">{t("models.mlp.explorer.metrics.trainSmoothed")}</span>
                                        </Tip>
                                        <div className="text-sm font-mono font-semibold text-violet-300/70 mt-0.5">{smoothedTrain.toFixed(3)}</div>
                                    </div>
                                )}
                            </div>

                            {/* Perplexity */}
                            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <Sparkles className="w-3 h-3 text-amber-400/60" />
                                    <Tip text={t("models.mlp.explorer.metrics.tooltips.perplexity")}>
                                        <span className="text-[9px] font-mono uppercase tracking-widest text-white/30">{t("models.mlp.explorer.metrics.perplexity")}</span>
                                    </Tip>
                                </div>
                                <span className="text-lg font-mono font-bold text-white">{selectedConfig.perplexity.toFixed(1)}</span>
                                {selectedConfig.expected_uniform_loss != null && (
                                    <Tip text={t("models.mlp.explorer.metrics.tooltips.randomPerplexity")}>
                                        <div className="text-[8px] font-mono text-white/20 mt-0.5 cursor-help">
                                            {t("models.mlp.explorer.metrics.random")} {Math.exp(selectedConfig.expected_uniform_loss).toFixed(1)}
                                        </div>
                                    </Tip>
                                )}
                            </div>

                            {/* Train–Val Gap */}
                            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    {computedGap != null ? (
                                        <>
                                            <GitCompareArrows className="w-3 h-3 text-cyan-400/60" />
                                            <Tip text={t("models.mlp.explorer.metrics.tooltips.trainValGap")}>
                                                <span className="text-[9px] font-mono uppercase tracking-widest text-white/30">{t("models.mlp.explorer.metrics.trainValGap")}</span>
                                            </Tip>
                                        </>
                                    ) : (
                                        <>
                                            <Layers className="w-3 h-3 text-emerald-400/60" />
                                            <Tip text={t("models.mlp.explorer.metrics.tooltips.paramsCount")}>
                                                <span className="text-[9px] font-mono uppercase tracking-widest text-white/30">{t("models.mlp.explorer.metrics.params")}</span>
                                            </Tip>
                                        </>
                                    )}
                                </div>
                                {computedGap != null ? (
                                    <span className={`text-lg font-mono font-bold ${computedGap > 0.3 ? "text-amber-400" : computedGap > 0.1 ? "text-white" : "text-emerald-400"}`}>
                                        {computedGap > 0 ? "+" : ""}{computedGap.toFixed(3)}
                                    </span>
                                ) : (
                                    <span className="text-lg font-mono font-bold text-white">{formatParams(selectedConfig.total_parameters ?? 0)}</span>
                                )}
                            </div>

                            {/* Compute Cost (params × steps, deterministic) */}
                            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <Cpu className="w-3 h-3 text-violet-400/60" />
                                    <Tip align="right" text={t("models.mlp.explorer.metrics.tooltips.compute").replace("{steps}", (TOTAL_TRAINING_STEPS / 1000).toFixed(0))}>
                                        <span className="text-[9px] font-mono uppercase tracking-widest text-white/30">{t("models.mlp.explorer.metrics.compute")}</span>
                                    </Tip>
                                </div>
                                <span className="text-sm font-mono font-bold text-white">{costInfo?.label ?? "—"}</span>
                                <Tip align="right" text={t("models.mlp.explorer.metrics.tooltips.computeDetail").replace("{params}", formatParams(selectedConfig.total_parameters ?? 0)).replace("{steps}", (TOTAL_TRAINING_STEPS / 1000).toFixed(0))}>
                                    <div className="text-[8px] font-mono text-white/20 mt-0.5 cursor-help">
                                        {formatParams(selectedConfig.total_parameters ?? 0)} × {(TOTAL_TRAINING_STEPS / 1000).toFixed(0)}k
                                    </div>
                                </Tip>
                                {/* Tiny progress bar */}
                                {costInfo && (
                                    <div className="mt-1.5 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                                        <div className="h-full rounded-full bg-violet-500/40" style={{ width: `${(costInfo.ratio * 100).toFixed(0)}%` }} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Anomaly flags ── */}
                    {anomalyFlags && <AnomalyBadges flags={anomalyFlags} />}

                    {/* ── Plain-English config summary ── */}
                    {selectedConfig && anomalyFlags && (() => {
                        const summary = buildConfigSummary(selectedConfig, anomalyFlags, computedGap, stabilityInfo, summaryTexts);
                        const colors = {
                            emerald: "bg-emerald-500/[0.04] border-emerald-500/15 text-emerald-300/70",
                            amber: "bg-amber-500/[0.04] border-amber-500/15 text-amber-300/70",
                            rose: "bg-rose-500/[0.04] border-rose-500/15 text-rose-300/70",
                            blue: "bg-blue-500/[0.04] border-blue-500/15 text-blue-300/70",
                            white: "bg-white/[0.02] border-white/[0.06] text-white/40",
                        };
                        return (
                            <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-[11px] leading-relaxed font-mono ${colors[summary.color]}`}>
                                <span className="shrink-0 mt-0.5">{summary.color === "rose" ? "✗" : summary.color === "amber" ? "⚠" : summary.color === "emerald" ? "✓" : summary.color === "blue" ? "↗" : "·"}</span>
                                <span>{summary.text}</span>
                            </div>
                        );
                    })()}

                    {/* ── Training Timeline ── */}
                    <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5 text-white/20" />
                                <Tip text={t("models.mlp.explorer.timeline.tooltips.chart")}>
                                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/25">{t("models.mlp.explorer.timeline.title")}</p>
                                </Tip>
                            </div>
                            {loggingInfo && (
                                <span className="text-[8px] font-mono text-white/15 flex items-center gap-1">
                                    <Tip text={t("models.mlp.explorer.timeline.tooltips.pts")}>
                                        <span className="cursor-help">{loggingInfo.count} {t("models.mlp.explorer.timeline.pts")}</span>
                                    </Tip>
                                    <span className="text-white/10">·</span>
                                    <Tip text={t("models.mlp.explorer.timeline.tooltips.interval").replace("{interval}", String(loggingInfo.minInterval))}>
                                        <span className="cursor-help">{t("models.mlp.explorer.timeline.every")} {loggingInfo.minInterval} {t("models.mlp.explorer.timeline.steps")}</span>
                                    </Tip>
                                    <span className="text-white/10">·</span>
                                    <Tip text={t("models.mlp.explorer.timeline.tooltips.totalSteps").replace("{steps}", (TOTAL_TRAINING_STEPS / 1000).toFixed(0))}>
                                        <span className="cursor-help">{loggingInfo.totalSteps >= 1000 ? `${(loggingInfo.totalSteps / 1000).toFixed(0)}k` : loggingInfo.totalSteps} {t("models.mlp.explorer.timeline.total")}</span>
                                    </Tip>
                                    {!loggingInfo.isUniform && <span className="text-amber-400/40"> · {t("models.mlp.explorer.timeline.nonUniform")}</span>}
                                </span>
                            )}
                        </div>
                        {timelineLoading ? (
                            <div className="flex items-center justify-center py-6"><Loader2 className="w-4 h-4 text-violet-400/40 animate-spin" /></div>
                        ) : (trainLoss.length > 0 || valLoss.length > 0) ? (
                            <>
                                <DualLossChart trainLoss={trainLoss} valLoss={valLoss} expectedUniformLoss={selectedConfig?.expected_uniform_loss} />
                                {/* Stability summary */}
                                {stabilityInfo && (
                                    <div className="flex flex-wrap gap-3 mt-2 text-[8px] font-mono text-white/20">
                                        <Tip text={t("models.mlp.explorer.timeline.tooltips.trend")}>
                                            <span className="cursor-help">{t("models.mlp.explorer.timeline.trend")} <span className={stabilityInfo.valTrend === "decreasing" ? "text-emerald-400/60" : stabilityInfo.valTrend === "increasing" ? "text-rose-400/60" : "text-white/30"}>{stabilityInfo.valTrend}</span></span>
                                        </Tip>
                                        <Tip text={t("models.mlp.explorer.timeline.tooltips.variance")}>
                                            <span className="cursor-help">{t("models.mlp.explorer.timeline.variance")} {stabilityInfo.valVariance.toFixed(4)}</span>
                                        </Tip>
                                        {stabilityInfo.convergenceStep != null && (
                                            <Tip text={t("models.mlp.explorer.timeline.tooltips.convergenceStep")}>
                                                <span className="cursor-help">{t("models.mlp.explorer.timeline.converged")}{stabilityInfo.convergenceStep >= 1000 ? `${(stabilityInfo.convergenceStep / 1000).toFixed(0)}k` : stabilityInfo.convergenceStep} {t("models.mlp.explorer.timeline.steps")}</span>
                                            </Tip>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-[10px] text-white/20 italic text-center py-4">{t("models.mlp.explorer.timeline.noData")}</p>
                        )}
                    </div>

                </LabSection>

                {/* ══════════════════════════════════════════════════
                SECTION 3 — EMBEDDING SPACE
            ══════════════════════════════════════════════════ */}
                <LabSection
                    number="03"
                    title={t("models.mlp.explorer.sections.s03Title")}
                    subtitle={t("models.mlp.explorer.sections.s03Subtitle")}
                >
                    {/* ── Embedding Space + Drift + Neighbors ── */}
                    <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4 space-y-4">
                        <div className="flex items-center gap-2">
                            <Tip text={t("models.mlp.explorer.embeddingSpace.tooltip")}>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-white/25">{t("models.mlp.explorer.embeddingSpace.title")}</p>
                            </Tip>
                        </div>
                        <EmbeddingDriftAnimator selectedConfig={selectedConfig} />
                        <NearestNeighborExplorer selectedConfig={selectedConfig} />
                    </div>
                </LabSection>

                {/* ══════════════════════════════════════════════════
                SECTION 4 — TEXT GENERATION
            ══════════════════════════════════════════════════ */}
                <LabSection
                    number="04"
                    title={t("models.mlp.explorer.sections.s04Title")}
                    subtitle={t("models.mlp.explorer.sections.s04Subtitle")}
                >
                    {/* ── Generated Text Sample ── */}
                    <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-white/25 mb-2">{t("models.mlp.explorer.generation.title")}</p>
                        <div className="flex gap-2 mb-3">
                            <input type="text" value={seedText} onChange={e => setSeedText(e.target.value)} placeholder={t("models.mlp.explorer.generation.seedPlaceholder")}
                                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs font-mono text-white/70 placeholder:text-white/20 focus:outline-none focus:border-violet-500/40" />
                            <button onClick={handleGenerate} disabled={generationLoading || !selectedConfig}
                                className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30 hover:bg-violet-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                                {generationLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : t("models.mlp.explorer.generation.generateButton")}
                            </button>
                        </div>
                        {/* Controls row: Temperature + Max tokens */}
                        <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="flex items-center gap-3">
                                <Tip text={t("models.mlp.explorer.generation.tempTooltip")}>
                                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/25 cursor-help shrink-0">{t("models.mlp.explorer.generation.temp")}</span>
                                </Tip>
                                <input
                                    type="range" min={1} max={20} value={Math.round(temperature * 10)}
                                    onChange={e => setTemperature(Number(e.target.value) / 10)}
                                    className="flex-1 accent-violet-500 cursor-pointer"
                                />
                                <span className="text-xs font-mono font-bold text-violet-400 w-8 text-right">{temperature.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Tip text={t("models.mlp.explorer.generation.tokensTooltip")}>
                                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/25 cursor-help shrink-0">{t("models.mlp.explorer.generation.tokens")}</span>
                                </Tip>
                                <input
                                    type="range" min={20} max={200} step={10} value={maxTokens}
                                    onChange={e => setMaxTokens(Number(e.target.value))}
                                    className="flex-1 accent-violet-500 cursor-pointer"
                                />
                                <span className="text-xs font-mono font-bold text-violet-400 w-8 text-right">{maxTokens}</span>
                            </div>
                        </div>
                        {generation ? (
                            <div className="space-y-2">
                                <p className="font-mono text-sm text-white/60 leading-relaxed">&quot;{generation.generated_text}&quot;</p>
                                <div className="flex items-center gap-3 text-[9px] font-mono text-white/20">
                                    <Tip text={t("models.mlp.explorer.generation.pplTooltip")}>
                                        <span className="cursor-help">
                                            {t("models.mlp.explorer.generation.estPpl")} {selectedConfig ? Math.exp(selectedConfig.final_loss).toFixed(1) : "—"}
                                        </span>
                                    </Tip>
                                    <span>·</span>
                                    <span>{generation.length} {t("models.mlp.explorer.generation.chars")}</span>
                                    <span>·</span>
                                    <span>{generation.metadata?.inference_time_ms?.toFixed(0) ?? "—"}ms</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[10px] text-white/20 italic">{t("models.mlp.explorer.generation.pressGenerate")}</p>
                        )}
                    </div>

                </LabSection>

                {/* ══════════════════════════════════════════════════
                SECTION 5 — ADVANCED DIAGNOSTICS
            ══════════════════════════════════════════════════ */}
                <LabSection
                    number="05"
                    title={t("models.mlp.explorer.sections.s05Title")}
                    subtitle={t("models.mlp.explorer.sections.s05Subtitle")}
                >
                    <Expandable title={t("models.mlp.explorer.sections.s05Title")} defaultOpen={true}>
                        <div className="space-y-8 pt-1">
                            {/* Intro */}
                            <p className="text-[11px] text-white/35 leading-relaxed">
                                {t("models.mlp.explorer.diagnostics.intro")}
                            </p>

                            {/* Sparklines */}
                            {(gradNormData.length > 0 || deadNeuronData.length > 0) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {gradNormData.length > 0 && (
                                        <div className="space-y-2">
                                            <Tip align="left" text={t("models.mlp.explorer.diagnostics.tooltips.gradNorm")}>
                                                <span className="cursor-help inline-block">
                                                    <MiniSparkline data={gradNormData} color="rgb(251,146,60)" label={t("models.mlp.explorer.diagnostics.gradNormLabel")} />
                                                </span>
                                            </Tip>
                                        </div>
                                    )}
                                    {deadNeuronData.length > 0 && (
                                        <div className="space-y-2">
                                            <Tip align="left" text={t("models.mlp.explorer.diagnostics.tooltips.deadNeuron")}>
                                                <span className="cursor-help inline-block">
                                                    <MiniSparkline data={deadNeuronData} color="rgb(251,113,133)" label={t("models.mlp.explorer.diagnostics.deadNeuronLabel")} />
                                                </span>
                                            </Tip>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Snapshot heatmaps */}
                            {timeline && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <Tip align="left" text={t("models.mlp.explorer.diagnostics.tooltips.gradNormLayer")}>
                                            <span className="cursor-help inline-block text-[9px] font-mono uppercase tracking-widest text-white/30 mb-2">{t("models.mlp.explorer.diagnostics.gradNormSection")}</span>
                                        </Tip>
                                        <GradientHealthHeatmap timeline={timeline} />
                                    </div>
                                    <div className="space-y-1">
                                        <Tip align="left" text={t("models.mlp.explorer.diagnostics.tooltips.activationHealth")}>
                                            <span className="cursor-help inline-block text-[9px] font-mono uppercase tracking-widest text-white/30 mb-2">{t("models.mlp.explorer.diagnostics.activationSection")}</span>
                                        </Tip>
                                        <ActivationSaturationHeatmap timeline={timeline} />
                                    </div>
                                </div>
                            )}

                            {/* Generalization gap heatmap */}
                            {safeConfigs.length > 1 && (
                                <div className="pt-4 border-t border-white/[0.06] space-y-2">
                                    <Tip align="left" text={t("models.mlp.explorer.diagnostics.tooltips.genGap")}>
                                        <span className="cursor-help inline-block text-[10px] font-mono uppercase tracking-widest text-white/30">{t("models.mlp.explorer.diagnostics.genGapSection")}</span>
                                    </Tip>
                                    <GeneralizationGapHeatmap configs={safeConfigs} />
                                </div>
                            )}
                        </div>
                    </Expandable>

                </LabSection>

                {/* ── Data source indicator ── */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/15">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <p className="text-[10px] text-emerald-300/60 font-mono">
                        {t("models.mlp.explorer.dataSource").replace("{count}", String(configs.length)).replace("{steps}", String(TOTAL_TRAINING_STEPS / 1000)).replace("{interval}", String(loggingInfo?.minInterval ?? 100))}
                        {selectedConfig?.final_val_loss != null ? " " + t("models.mlp.explorer.primaryValLoss") : " " + t("models.mlp.explorer.primaryTrainLoss")}
                    </p>
                </div>
            </div>
        </>
    );
}
