"use client";

import { useMemo } from "react";

import { useI18n } from "@/i18n/context";
import type { MLPTimelineResponse, MLPTimelineSnapshot } from "@/types/lmLab";

/*
  SnapshotDiagnostics
  Two heatmaps derived from timeline snapshots:
  1. GradientHealthHeatmap — grad norm per parameter group per snapshot step
  2. ActivationSaturationHeatmap — activation stats per snapshot step
*/

const PARAM_GROUPS = ["C", "W1", "b1", "W2", "b2"];

function normColor(val: number, maxVal: number): string {
    if (maxVal === 0) return "rgba(255,255,255,0.03)";
    const ratio = Math.min(val / maxVal, 1);
    if (ratio < 0.25) return `rgba(52,211,153,${0.15 + ratio * 1.4})`;
    if (ratio < 0.5) return `rgba(250,204,21,${0.2 + ratio * 0.6})`;
    if (ratio < 0.75) return `rgba(251,146,60,${0.3 + ratio * 0.4})`;
    return `rgba(244,63,94,${0.4 + ratio * 0.3})`;
}

function satColor(fraction: number): string {
    if (fraction < 0.1) return "rgba(52,211,153,0.3)";
    if (fraction < 0.3) return "rgba(250,204,21,0.35)";
    if (fraction < 0.5) return "rgba(251,146,60,0.4)";
    return "rgba(244,63,94,0.5)";
}

interface SnapshotRow {
    step: number;
    stepLabel: string;
    gradNorms: Record<string, number>;
    saturation: number;
    deadFraction: number;
}

function parseSnapshots(timeline: MLPTimelineResponse): SnapshotRow[] {
    const snapshots = timeline.snapshots;
    if (!snapshots) return [];

    const rows: SnapshotRow[] = [];
    const keys = Object.keys(snapshots).sort((a, b) => {
        const stepA = parseInt(a.replace("step_", ""), 10);
        const stepB = parseInt(b.replace("step_", ""), 10);
        return stepA - stepB;
    });

    for (const key of keys) {
        const snap: MLPTimelineSnapshot = snapshots[key];
        const step = snap.step ?? parseInt(key.replace("step_", ""), 10);
        const stepLabel = step >= 1000 ? `${(step / 1000).toFixed(0)}k` : String(step);

        // Extract grad norms per parameter group
        const gradNorms: Record<string, number> = {};
        if (snap.grad_norms && typeof snap.grad_norms === "object") {
            for (const pg of PARAM_GROUPS) {
                const val = (snap.grad_norms as Record<string, unknown>)[pg];
                gradNorms[pg] = typeof val === "number" ? val : 0;
            }
        }

        // Extract activation saturation
        let saturation = 0;
        let deadFraction = 0;
        if (snap.activation_stats && typeof snap.activation_stats === "object") {
            const stats = snap.activation_stats as Record<string, unknown>;
            if (typeof stats.saturation_fraction === "number") saturation = stats.saturation_fraction;
            else if (typeof stats.saturated_fraction === "number") saturation = stats.saturated_fraction;
            if (typeof stats.dead_fraction === "number") deadFraction = stats.dead_fraction;
        }
        if (typeof snap.dead_neurons === "number") deadFraction = snap.dead_neurons;

        rows.push({ step, stepLabel, gradNorms, saturation, deadFraction });
    }

    return rows;
}

export interface SnapshotDiagnosticsProps {
    timeline: MLPTimelineResponse | null;
}

export function GradientHealthHeatmap({ timeline }: SnapshotDiagnosticsProps) {
    const { t } = useI18n();
    const rows = useMemo(() => timeline ? parseSnapshots(timeline) : [], [timeline]);

    const maxNorm = useMemo(() => {
        let max = 0;
        for (const r of rows)
            for (const pg of PARAM_GROUPS)
                if (r.gradNorms[pg] > max) max = r.gradNorms[pg];
        return max;
    }, [rows]);

    if (rows.length === 0) return <p className="text-[10px] text-white/20 italic">{t("models.mlp.snapshotDiagnostics.noSnapshotData")}</p>;

    const hasAnyGrads = rows.some(r => PARAM_GROUPS.some(pg => r.gradNorms[pg] > 0));
    if (!hasAnyGrads) return <p className="text-[10px] text-white/20 italic">{t("models.mlp.snapshotDiagnostics.noGradData")}</p>;

    return (
        <div className="space-y-3">
            <div className="overflow-x-auto">
                <table className="border-collapse">
                    <thead>
                        <tr>
                            <th className="text-[8px] font-mono text-white/20 pr-3 pb-2 text-right align-bottom">{t("models.mlp.snapshotDiagnostics.step")}</th>
                            {PARAM_GROUPS.map(pg => (
                                <th key={pg} className="text-[9px] font-mono text-white/35 text-center pb-2 px-1">{pg}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(r => (
                            <tr key={r.step}>
                                <td className="text-[9px] font-mono text-white/30 pr-3 text-right py-1">{r.stepLabel}</td>
                                {PARAM_GROUPS.map(pg => (
                                    <td key={pg} className="px-1 py-1">
                                        <div
                                            className="w-14 h-7 rounded flex items-center justify-center"
                                            style={{ backgroundColor: normColor(r.gradNorms[pg], maxNorm) }}
                                            title={`${pg}: ${r.gradNorms[pg].toFixed(4)}`}
                                        >
                                            <span className="text-[8px] font-mono text-white/60">
                                                {r.gradNorms[pg] > 0 ? r.gradNorms[pg].toFixed(3) : "—"}
                                            </span>
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="text-[9px] font-mono text-white/20 leading-relaxed">
                {t("models.mlp.snapshotDiagnostics.gradLegend")}
            </p>
        </div>
    );
}

export function ActivationSaturationHeatmap({ timeline }: SnapshotDiagnosticsProps) {
    const { t } = useI18n();
    const rows = useMemo(() => timeline ? parseSnapshots(timeline) : [], [timeline]);

    const hasSatData = rows.some(r => r.saturation > 0 || r.deadFraction > 0);
    if (!hasSatData) return <p className="text-[10px] text-white/20 italic">{t("models.mlp.snapshotDiagnostics.noSatData")}</p>;

    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                {rows.map(r => (
                    <div key={r.step} className="flex items-center gap-3">
                        <span className="text-[9px] font-mono text-white/30 w-8 text-right shrink-0">{r.stepLabel}</span>
                        {/* Saturation bar */}
                        <div className="flex-1 h-6 rounded bg-white/[0.04] overflow-hidden relative">
                            {r.saturation > 0 && (
                                <div
                                    className="absolute left-0 top-0 h-full rounded transition-all"
                                    style={{ width: `${(r.saturation * 100).toFixed(0)}%`, backgroundColor: satColor(r.saturation) }}
                                />
                            )}
                            {r.deadFraction > 0 && (
                                <div
                                    className="absolute right-0 top-0 h-full rounded bg-rose-500/30"
                                    style={{ width: `${(r.deadFraction * 100).toFixed(0)}%` }}
                                />
                            )}
                        </div>
                        <span className="text-[8px] font-mono text-white/30 w-20 text-right shrink-0">
                            sat:{(r.saturation * 100).toFixed(0)}% dead:{(r.deadFraction * 100).toFixed(0)}%
                        </span>
                    </div>
                ))}
            </div>
            <div className="flex gap-4 text-[9px] font-mono text-white/25">
                <span className="inline-flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: "rgba(250,204,21,0.35)" }} />
                    {t("models.mlp.snapshotDiagnostics.saturatedLeft")}
                </span>
                <span className="inline-flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded bg-rose-500/30" />
                    {t("models.mlp.snapshotDiagnostics.deadRight")}
                </span>
            </div>
            <p className="text-[8px] font-mono text-white/15">
                {t("models.mlp.snapshotDiagnostics.satLegend")}
            </p>
        </div>
    );
}
