"use client";

import { Clock,Cpu, Database, Zap } from "lucide-react";

import { useI18n } from "@/i18n/context";

interface NgramPerformanceSummaryProps {
    inferenceMs?: number;
    device?: string;
    totalTokens?: number;
    trainingDuration?: number;
    perplexity?: number;
    finalLoss?: number;
}

export function NgramPerformanceSummary({
    inferenceMs,
    device,
    totalTokens,
    trainingDuration,
    perplexity,
    finalLoss,
}: NgramPerformanceSummaryProps) {
    const { t } = useI18n();

    const items = [
        inferenceMs != null && {
            icon: Zap,
            label: t("models.ngram.lab.performanceSummary.inferenceTime"),
            value: `${inferenceMs.toFixed(2)} ${t("models.ngram.lab.performanceSummary.ms")}`,
            color: "text-cyan-300",
        },
        device && {
            icon: Cpu,
            label: t("models.ngram.lab.performanceSummary.device"),
            value: device,
            color: "text-emerald-300",
        },
        totalTokens != null && {
            icon: Database,
            label: t("models.ngram.lab.performanceSummary.totalTokens"),
            value: `${(totalTokens / 1000).toFixed(1)}k ${t("models.ngram.lab.performanceSummary.tokens")}`,
            color: "text-violet-300",
        },
        trainingDuration != null && {
            icon: Clock,
            label: t("models.ngram.lab.performanceSummary.trainingDuration"),
            value: `${trainingDuration.toFixed(1)} ${t("models.ngram.lab.performanceSummary.ms")}`,
            color: "text-amber-300",
        },
        perplexity != null && {
            icon: null,
            label: t("models.ngram.lab.performanceSummary.perplexity"),
            value: perplexity.toFixed(2),
            color: "text-amber-300",
        },
        finalLoss != null && {
            icon: null,
            label: t("models.ngram.lab.performanceSummary.finalLoss"),
            value: finalLoss.toFixed(4),
            color: "text-emerald-300",
        },
    ].filter(Boolean) as Array<{
        icon: React.ComponentType<{ className?: string }> | null;
        label: string;
        value: string;
        color: string;
    }>;

    if (items.length === 0) return null;

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {items.map(({ icon: Icon, label, value, color }) => (
                <div
                    key={label}
                    className="bg-black/30 rounded-lg p-3 border border-white/[0.06] flex items-start gap-2"
                >
                    {Icon && <Icon className="w-3.5 h-3.5 text-white/25 mt-0.5 shrink-0" />}
                    <div className="min-w-0">
                        <p className="text-[9px] font-mono uppercase tracking-widest text-white/25 truncate">
                            {label}
                        </p>
                        <p className={`text-sm font-bold font-mono ${color}`}>{value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
