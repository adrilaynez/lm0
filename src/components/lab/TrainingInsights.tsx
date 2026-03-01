"use client";

import { useCallback,useEffect, useRef } from "react";

import { Activity,TrendingDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/i18n/context";
import type { TrainingViz } from "@/types/lmLab";

const TI = "models.neuralNetworks.sections.playground.training";
const VI = "models.neuralNetworks.sections.playground.visualization";

interface TrainingInsightsProps {
    data: TrainingViz | null;
}

export function TrainingInsights({ data }: TrainingInsightsProps) {
    const { t } = useI18n();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || !data) return;

        const { loss_history } = data;
        if (!loss_history || loss_history.length < 2) return;

        const dpr = window.devicePixelRatio || 1;

        const w = container.clientWidth;
        const h = 160;

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;

        const ctx = canvas.getContext("2d")!;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        if (loss_history.length < 2) return;

        const pad = { left: 10, right: 10, top: 10, bottom: 10 };
        const plotW = w - pad.left - pad.right;
        const plotH = h - pad.top - pad.bottom;

        const maxLoss = Math.max(...loss_history);
        const minLoss = Math.min(...loss_history);
        const range = maxLoss - minLoss || 1;

        const xStep = plotW / (loss_history.length - 1);

        // Gradient fill
        const gradient = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
        gradient.addColorStop(0, "rgba(99, 102, 241, 0.25)");
        gradient.addColorStop(1, "rgba(99, 102, 241, 0)");

        ctx.beginPath();
        ctx.moveTo(pad.left, pad.top + plotH);
        for (let i = 0; i < loss_history.length; i++) {
            const x = pad.left + i * xStep;
            const y = pad.top + plotH - ((loss_history[i] - minLoss) / range) * plotH;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(pad.left + (loss_history.length - 1) * xStep, pad.top + plotH);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Line
        ctx.beginPath();
        for (let i = 0; i < loss_history.length; i++) {
            const x = pad.left + i * xStep;
            const y = pad.top + plotH - ((loss_history[i] - minLoss) / range) * plotH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(99, 102, 241, 0.8)";
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";
        ctx.stroke();

        // End dot
        const lastX = pad.left + (loss_history.length - 1) * xStep;
        const lastY =
            pad.top +
            plotH -
            ((loss_history[loss_history.length - 1] - minLoss) / range) * plotH;
        ctx.beginPath();
        ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(99, 102, 241, 1)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(lastX, lastY, 7, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(99, 102, 241, 0.3)";
        ctx.lineWidth = 2;
        ctx.stroke();
    }, [data]);

    useEffect(() => {
        draw();
        const h = () => draw();
        window.addEventListener("resize", h);
        return () => window.removeEventListener("resize", h);
    }, [draw]);

    const stats = data
        ? [
            { labelKey: "finalLoss", value: data.final_loss?.toFixed(4) ?? "N/A" },
            { labelKey: "steps", value: data.training_steps?.toLocaleString() ?? "N/A" },
            { labelKey: "batchSize", value: data.batch_size?.toString() ?? "N/A" },
            { labelKey: "learningRate", value: data.learning_rate?.toExponential(1) ?? "N/A" },
            { labelKey: "parameters", value: data.total_parameters?.toLocaleString() ?? "N/A" },
        ]
        : [];

    return (
        <Card className="bg-black/40 border-white/[0.06] backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <TrendingDown className="h-4 w-4 text-indigo-400" />
                <span className="font-mono text-xs uppercase tracking-widest text-white/60">
                    {t(`${TI}.insightsTitle`)}
                </span>

                {/* Educational Tooltip */}
                <div className="group relative ml-1">
                    <div className="flex items-center justify-center w-4 h-4 rounded-full bg-white/5 border border-white/10 cursor-help hover:bg-white/10 transition-colors">
                        <span className="text-[10px] font-bold text-white/40 group-hover:text-white/60">?</span>
                    </div>
                    <div className="absolute left-0 bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-white/10 p-4 rounded-2xl z-50 w-72 text-[11px] text-slate-400 pointer-events-none shadow-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <p className="font-bold text-white mb-2 uppercase tracking-widest text-[10px]">{t(`${VI}.lossTooltipTitle`)}</p>
                        <div className="space-y-2">
                            <p><strong className="text-indigo-400">{t(`${VI}.lossTooltipErrorLabel`)}:</strong> {t(`${VI}.lossTooltipError`)}</p>
                            <p><strong className="text-white">{t(`${VI}.lossTooltipBenchmarkLabel`)}:</strong> {t(`${VI}.lossTooltipBenchmark`)}</p>
                            <div className="mt-3 pt-3 border-t border-white/5 text-[10px] italic">
                                {t(`${VI}.lossTooltipCaption`)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div ref={containerRef} className="px-5 pt-5">
                {!data ? (
                    <div className="flex items-center justify-center h-40 text-white/30 text-xs font-mono">
                        {t(`${TI}.runInference`)}
                    </div>
                ) : (
                    <canvas ref={canvasRef} />
                )}
            </div>

            {/* Stats */}
            {data && (
                <div className="px-5 pb-5 pt-4 flex flex-wrap gap-2">
                    {stats.map((s) => (
                        <div key={s.labelKey} className="group relative">
                            <Badge
                                className="bg-white/[0.04] border-white/[0.06] text-white/70 text-[10px] font-mono py-1 px-2.5 hover:bg-white/[0.06] transition-colors"
                            >
                                <Activity className="h-3 w-3 mr-1 text-indigo-400" />
                                {t(`${TI}.stats.${s.labelKey}.label`)}: <span className="text-white ml-1">{s.value}</span>
                            </Badge>

                            {/* Educational Tooltip */}
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-white/10 p-2 rounded-lg z-50 w-48 text-[9px] text-slate-400 pointer-events-none shadow-2xl leading-tight text-center">
                                {t(`${TI}.stats.${s.labelKey}.desc`)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}
