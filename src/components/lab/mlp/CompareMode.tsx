"use client";

import { useCallback, useEffect, useMemo,useState } from "react";

import { Loader2 } from "lucide-react";

import { useI18n } from "@/i18n/context";
import { fetchMLPTimeline, generateMLP } from "@/lib/lmLabClient";
import type { MLPGenerateResponse,MLPGridConfig, MLPTimelineResponse } from "@/types/lmLab";

import { EmbeddingDriftAnimator } from "./EmbeddingDriftAnimator";

/*
  CompareMode
  Side-by-side comparison of two MLP configurations.
  Fully self-contained: fetches its own timeline + generation data.
*/

// ── Minimal inline loss chart (shared between both configs) ───────────────

interface LossEntry { step: number; value: number }

function SimpleChart({
    trainLoss,
    valLoss,
    label,
}: {
    trainLoss: LossEntry[];
    valLoss: LossEntry[];
    label: string;
}) {
    const w = 320, h = 120, padL = 30, padB = 24, padT = 12, padR = 8;
    const allVals = [...trainLoss.map(e => e.value), ...valLoss.map(e => e.value)];
    const allSteps = [...trainLoss.map(e => e.step), ...valLoss.map(e => e.step)];
    if (allVals.length < 2) return <p className="text-[10px] text-white/20 font-mono italic text-center py-4">{useI18n().t("models.mlp.compareMode.noTimelineData")}</p>;

    const minVal = Math.min(...allVals) * 0.95;
    const maxVal = Math.max(...allVals) * 1.02;
    const maxStep = Math.max(...allSteps) || 1;
    const range = maxVal - minVal || 1;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const toX = (s: number) => padL + (s / maxStep) * plotW;
    const toY = (v: number) => padT + (1 - (v - minVal) / range) * plotH;
    const poly = (data: LossEntry[]) =>
        data.filter((_, i) => i % Math.ceil(data.length / 150) === 0 || i === data.length - 1)
            .map(e => `${toX(e.step).toFixed(1)},${toY(e.value).toFixed(1)}`).join(" ");

    return (
        <div className="space-y-1">
            <p className="text-[9px] font-mono uppercase tracking-widest text-white/20">{label}</p>
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: 140 }}>
                <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="rgba(255,255,255,0.08)" />
                <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="rgba(255,255,255,0.08)" />
                {trainLoss.length >= 2 && <polyline points={poly(trainLoss)} fill="none" stroke="rgba(139,92,246,0.5)" strokeWidth={1.2} strokeLinejoin="round" />}
                {valLoss.length >= 2 && <polyline points={poly(valLoss)} fill="none" stroke="rgb(52,211,153)" strokeWidth={1.8} strokeLinejoin="round" />}
                {valLoss.length >= 2 && (
                    <text x={w - padR} y={toY(valLoss[valLoss.length - 1].value) - 3}
                        fontSize={8} fill="rgb(52,211,153)" fontFamily="monospace" textAnchor="end" fontWeight={700}>
                        {valLoss[valLoss.length - 1].value.toFixed(3)}
                    </text>
                )}
                <text x={padL + plotW / 2} y={h - 4} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize={7} fontFamily="monospace">{useI18n().t("models.mlp.compareMode.steps")}</text>
                <text x={padL - 2} y={toY(maxVal) + 3} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize={7} fontFamily="monospace">{maxVal.toFixed(1)}</text>
                <text x={padL - 2} y={toY(minVal) + 3} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize={7} fontFamily="monospace">{minVal.toFixed(1)}</text>
            </svg>
            <div className="flex gap-4 text-[8px] font-mono text-white/20">
                <span><span className="inline-block w-2 h-0.5 bg-violet-500/50 mr-1 align-middle" />{useI18n().t("models.mlp.compareMode.train")}</span>
                <span><span className="inline-block w-2 h-0.5 bg-emerald-400 mr-1 align-middle" />{useI18n().t("models.mlp.compareMode.val")}</span>
            </div>
        </div>
    );
}

// ── Single config panel ────────────────────────────────────────────────────

interface ConfigPanelProps {
    config: MLPGridConfig;
    label: "A" | "B";
    seed: string;
}

function ConfigPanel({ config, label, seed }: ConfigPanelProps) {
    const { t } = useI18n();
    const [timeline, setTimeline] = useState<MLPTimelineResponse | null>(null);
    const [tlLoading, setTlLoading] = useState(false);
    const [generation, setGeneration] = useState<MLPGenerateResponse | null>(null);
    const [genLoading, setGenLoading] = useState(false);
    const [temperature, setTemperature] = useState(0.8);

    useEffect(() => {
        if (!config) return;
        let cancelled = false;
        setTlLoading(true);
        setTimeline(null);
        fetchMLPTimeline(config.embedding_dim, config.hidden_size, config.learning_rate)
            .then(res => { if (!cancelled) setTimeline(res); })
            .catch(() => { /* silently skip */ })
            .finally(() => { if (!cancelled) setTlLoading(false); });
        return () => { cancelled = true; };
    }, [config.embedding_dim, config.hidden_size, config.learning_rate]);

    const handleGenerate = useCallback(() => {
        if (!seed.trim()) return;
        setGenLoading(true);
        generateMLP(config.embedding_dim, config.hidden_size, config.learning_rate, seed.trim(), 80, temperature)
            .then(res => setGeneration(res))
            .catch(() => { /* silently skip */ })
            .finally(() => setGenLoading(false));
    }, [config, seed, temperature]);

    const trainLoss = useMemo(() =>
        (timeline?.metrics_log?.train_loss ?? []).map(e => ({ step: e.step, value: typeof e.value === "number" ? e.value : 0 }))
        , [timeline]);

    const valLoss = useMemo(() =>
        (timeline?.metrics_log?.val_loss ?? []).map(e => ({ step: e.step, value: typeof e.value === "number" ? e.value : 0 }))
        , [timeline]);

    const accentColor = label === "A" ? "violet" : "cyan";
    const badgeClass = label === "A"
        ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
        : "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";

    return (
        <div className="space-y-4 min-w-0">
            {/* Config badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-mono ${badgeClass}`}>
                <span className="font-bold">{label}</span>
                <span className="text-white/30">·</span>
                <span>emb={config.embedding_dim}</span>
                <span>h={config.hidden_size}</span>
                <span>lr={config.learning_rate}</span>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-2">
                {[
                    { label: t("models.mlp.compareMode.metrics.valLoss"), value: config.final_loss.toFixed(3) },
                    { label: t("models.mlp.compareMode.metrics.perplexity"), value: config.perplexity.toFixed(1) },
                    { label: t("models.mlp.compareMode.metrics.gap"), value: config.generalization_gap != null ? (config.generalization_gap > 0 ? "+" : "") + config.generalization_gap.toFixed(3) : "—" },
                    { label: t("models.mlp.compareMode.metrics.score"), value: config.score != null ? config.score.toFixed(2) : "—" },
                ].map(({ label: l, value }) => (
                    <div key={l} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                        <p className="text-[8px] font-mono uppercase tracking-widest text-white/20 mb-0.5">{l}</p>
                        <p className="text-sm font-mono font-bold text-white/70">{value}</p>
                    </div>
                ))}
            </div>

            {/* Timeline */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                {tlLoading ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-4 h-4 animate-spin text-white/20" />
                    </div>
                ) : (
                    <SimpleChart trainLoss={trainLoss} valLoss={valLoss} label={t("models.mlp.compareMode.trainingLoss")} />
                )}
            </div>

            {/* Embedding space */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-[9px] font-mono uppercase tracking-widest text-white/20 mb-2">{t("models.mlp.compareMode.embeddingSpace")}</p>
                <EmbeddingDriftAnimator selectedConfig={config} />
            </div>

            {/* Generation */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
                <p className="text-[9px] font-mono uppercase tracking-widest text-white/20">{t("models.mlp.compareMode.generatedText")}</p>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-white/25 shrink-0">{t("models.mlp.compareMode.temperature")}={temperature.toFixed(1)}</span>
                    <input
                        type="range" min={1} max={20} value={Math.round(temperature * 10)}
                        onChange={e => setTemperature(Number(e.target.value) / 10)}
                        className={`flex-1 cursor-pointer ${accentColor === "violet" ? "accent-violet-500" : "accent-cyan-500"}`}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={genLoading || !seed.trim()}
                        className={`px-2.5 py-1 rounded text-[9px] font-mono border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${label === "A"
                            ? "bg-violet-500/15 text-violet-300 border-violet-500/30 hover:bg-violet-500/25"
                            : "bg-cyan-500/15 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/25"
                            }`}
                    >
                        {genLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : t("models.mlp.compareMode.generate")}
                    </button>
                </div>
                {generation ? (
                    <p className="font-mono text-xs text-white/50 leading-relaxed break-words">
                        &quot;{generation.generated_text}&quot;
                    </p>
                ) : (
                    <p className="text-[9px] text-white/15 italic font-mono">{t("models.mlp.compareMode.seedTextAboveWillBeUsed")}</p>
                )}
            </div>
        </div>
    );
}

// ── Config selector (dropdown over all configs) ────────────────────────────

interface SelectorProps {
    configs: MLPGridConfig[];
    value: MLPGridConfig | null;
    exclude?: string;
    onChange: (c: MLPGridConfig) => void;
    label: "A" | "B";
}

function ConfigSelector({ configs, value, exclude, onChange, label }: SelectorProps) {
    const { t } = useI18n();
    const options = configs.filter(c => c.config_id !== exclude);
    const accentClass = label === "A"
        ? "focus:border-violet-500/40"
        : "focus:border-cyan-500/40";

    return (
        <div className="space-y-1">
            <p className="text-[9px] font-mono uppercase tracking-widest text-white/25">{t("models.mlp.compareMode.config")} {label}</p>
            <select
                value={value?.config_id ?? ""}
                onChange={e => {
                    const found = configs.find(c => c.config_id === e.target.value);
                    if (found) onChange(found);
                }}
                className={`w-full rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-[11px] font-mono text-white/60 focus:outline-none ${accentClass} appearance-none cursor-pointer`}
            >
                <option value="" disabled>{t("models.mlp.compareMode.selectAConfig")}</option>
                {options.map(c => (
                    <option key={c.config_id} value={c.config_id}>
                        emb={c.embedding_dim} · h={c.hidden_size} · lr={c.learning_rate} · loss={c.final_loss.toFixed(3)}
                    </option>
                ))}
            </select>
        </div>
    );
}

// ── Main Compare Mode component ────────────────────────────────────────────

export interface CompareModeProps {
    configs: MLPGridConfig[];
    primaryConfig: MLPGridConfig | null;
    primarySeed: string;
}

export function CompareMode({ configs, primaryConfig, primarySeed }: CompareModeProps) {
    const { t } = useI18n();
    const [configA, setConfigA] = useState<MLPGridConfig | null>(primaryConfig);
    const [configB, setConfigB] = useState<MLPGridConfig | null>(null);

    useEffect(() => {
        setConfigA(primaryConfig);
    }, [primaryConfig]);

    if (configs.length < 2) {
        return <p className="text-[10px] text-white/20 font-mono italic">{t("models.mlp.compareMode.needAtLeastTwoConfigs")}</p>;
    }

    return (
        <div className="space-y-4">
            <p className="text-[11px] text-white/30 font-mono leading-relaxed">{t("models.mlp.compareMode.selectTwoConfigsToCompare")}</p>

            {/* Selectors */}
            <div className="grid grid-cols-2 gap-4">
                <ConfigSelector
                    configs={configs}
                    value={configA}
                    exclude={configB?.config_id}
                    onChange={setConfigA}
                    label="A"
                />
                <ConfigSelector
                    configs={configs}
                    value={configB}
                    exclude={configA?.config_id}
                    onChange={setConfigB}
                    label="B"
                />
            </div>

            {/* Seed display */}
            {primarySeed && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                    <span className="text-[9px] font-mono text-white/20 shrink-0">{t("models.mlp.compareMode.seed")}</span>
                    <span className="text-[11px] font-mono text-white/50">&quot;{primarySeed}&quot;</span>
                    <span className="text-[8px] font-mono text-white/15 ml-auto">{t("models.mlp.compareMode.editInMainGeneratorAbove")}</span>
                </div>
            )}

            {/* Side-by-side panels */}
            {(configA || configB) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 border-t border-white/[0.06]">
                    {configA ? (
                        <ConfigPanel config={configA} label="A" seed={primarySeed} />
                    ) : (
                        <div className="flex items-center justify-center py-12 rounded-lg border border-dashed border-white/[0.06]">
                            <p className="text-[10px] text-white/20 font-mono">{t("models.mlp.compareMode.selectConfigA")}</p>
                        </div>
                    )}
                    {configB ? (
                        <ConfigPanel config={configB} label="B" seed={primarySeed} />
                    ) : (
                        <div className="flex items-center justify-center py-12 rounded-lg border border-dashed border-white/[0.06]">
                            <p className="text-[10px] text-white/20 font-mono">{t("models.mlp.compareMode.selectConfigB")}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Diff summary (shown when both selected) */}
            {configA && configB && (() => {
                const lossDiff = configB.final_loss - configA.final_loss;
                const gapDiff = (configB.generalization_gap ?? 0) - (configA.generalization_gap ?? 0);
                const paramDiff = (configB.total_parameters ?? 0) - (configA.total_parameters ?? 0);
                return (
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                        <p className="text-[9px] font-mono uppercase tracking-widest text-white/20">{t("models.mlp.compareMode.diffSummary")}</p>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { label: t("models.mlp.compareMode.metrics.valLoss"), diff: lossDiff, unit: "", better: lossDiff < 0 },
                                { label: t("models.mlp.compareMode.metrics.gap"), diff: gapDiff, unit: "", better: gapDiff < 0 },
                                { label: t("models.mlp.compareMode.metrics.params"), diff: paramDiff, unit: "", better: false, neutral: true },
                            ].map(({ label, diff, unit, better, neutral }) => (
                                <div key={label} className="text-center">
                                    <p className="text-[8px] font-mono text-white/20 mb-1">{label}</p>
                                    <p className={`text-sm font-mono font-bold ${neutral ? "text-white/40" : better ? "text-emerald-400" : "text-rose-400"}`}>
                                        {diff > 0 ? "+" : ""}{unit}{
                                            Math.abs(diff) >= 1000
                                                ? `${(diff / 1000).toFixed(1)}k`
                                                : diff.toFixed(3)
                                        }
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
