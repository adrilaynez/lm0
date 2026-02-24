"use client";

import { useI18n } from "@/i18n/context";

interface NgramLossChartProps {
    trainLossHistory: number[];
    valLossHistory?: number[];
    perplexity?: number;
    finalLoss?: number;
}

function buildPolylinePoints(values: number[], minLoss: number, range: number) {
    return values
        .map((v, i) => {
            const x = (i / (values.length - 1)) * 100;
            const y = 100 - ((v - minLoss) / range) * 90 - 5;
            return `${x},${y}`;
        })
        .join(" ");
}

export function NgramLossChart({ trainLossHistory, valLossHistory, perplexity, finalLoss }: NgramLossChartProps) {
    const { t } = useI18n();

    const allSeries = valLossHistory?.length ? [...trainLossHistory, ...valLossHistory] : trainLossHistory;
    const maxLoss = Math.max(...allSeries);
    const minLoss = Math.min(...allSeries);
    const range = maxLoss - minLoss || 1;

    const trainPoints = buildPolylinePoints(trainLossHistory, minLoss, range);
    const valPoints = valLossHistory?.length ? buildPolylinePoints(valLossHistory, minLoss, range) : null;

    return (
        <div className="space-y-4">
            <div className="bg-black/30 rounded-xl p-4 border border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                        {t("models.ngram.lab.lossChart.title")}
                    </p>
                    <div className="flex gap-4 text-[10px] font-mono text-white/40">
                        {finalLoss != null && (
                            <span>
                                {t("models.ngram.lab.lossChart.final")}{" "}
                                <span className="text-emerald-400">{finalLoss.toFixed(3)}</span>
                            </span>
                        )}
                        {perplexity != null && (
                            <span>
                                {t("models.ngram.lab.lossChart.ppl")}{" "}
                                <span className="text-amber-400">{perplexity.toFixed(1)}</span>
                            </span>
                        )}
                    </div>
                </div>
                <svg viewBox="0 0 100 100" className="w-full h-32" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="lossGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgb(6,182,212)" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="rgb(6,182,212)" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <polyline
                        points={trainPoints}
                        fill="none"
                        stroke="rgb(6,182,212)"
                        strokeWidth="0.8"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                    />
                    <polygon points={`0,100 ${trainPoints} 100,100`} fill="url(#lossGradient)" />
                    {valPoints && (
                        <polyline
                            points={valPoints}
                            fill="none"
                            stroke="rgb(245,158,11)"
                            strokeWidth="0.8"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                        />
                    )}
                </svg>
                <div className="flex justify-between text-[10px] text-white/20 font-mono mt-1">
                    <span>{t("models.ngram.lab.lossChart.start")}</span>
                    <span>{t("models.ngram.lab.lossChart.progress")}</span>
                    <span>{t("models.ngram.lab.lossChart.end")}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/30 rounded-lg p-3 border border-white/[0.06]">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1">
                        {t("models.ngram.lab.lossChart.perplexity")}
                    </p>
                    <p className="text-lg font-bold text-amber-300 font-mono">
                        {perplexity?.toFixed(1) ?? "—"}
                    </p>
                    <p className="text-[10px] text-white/20 mt-0.5">
                        {t("models.ngram.lab.lossChart.perplexityHint")}
                    </p>
                </div>
                <div className="bg-black/30 rounded-lg p-3 border border-white/[0.06]">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1">
                        {t("models.ngram.lab.lossChart.finalNll")}
                    </p>
                    <p className="text-lg font-bold text-emerald-300 font-mono">
                        {finalLoss?.toFixed(3) ?? "—"}
                    </p>
                    <p className="text-[10px] text-white/20 mt-0.5">
                        {t("models.ngram.lab.lossChart.finalNllHint")}
                    </p>
                </div>
            </div>
        </div>
    );
}
