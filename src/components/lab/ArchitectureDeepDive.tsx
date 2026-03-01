"use client";

import { BlockMath, InlineMath } from "react-katex";

import {
    AlertTriangle,
    CheckCircle2,
    Cpu,
    Layers
} from "lucide-react";

import { FadeInView } from "@/components/lab/FadeInView";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n/context";
import type { ArchitectureViz } from "@/types/lmLab";

interface ArchitectureDeepDiveProps {
    data: ArchitectureViz | null;
}

export function ArchitectureDeepDive({ data }: ArchitectureDeepDiveProps) {
    const { t } = useI18n();
    if (!data) return null;

    const stepsList = [
        { id: "matrixW", key: "models.bigram.architecture.stepsList.matrixW", tooltipTitle: t("models.bigram.architecture.tooltips.matrixW.title"), tooltipDesc: t("models.bigram.architecture.tooltips.matrixW.desc") },
        { id: "softmax", key: "models.bigram.architecture.stepsList.softmax", tooltipTitle: t("models.bigram.architecture.tooltips.softmax.title"), tooltipDesc: t("models.bigram.architecture.tooltips.softmax.desc") },
        { id: "loss", key: "models.bigram.architecture.stepsList.loss", tooltipTitle: t("models.bigram.architecture.tooltips.loss.title"), tooltipDesc: t("models.bigram.architecture.tooltips.loss.desc") }
    ];

    // Helper to detect and render LaTeX or plain text
    const renderStep = (stepId: string, label: string, tooltipTitle: string, tooltipDesc: string) => {
        if (stepId === "matrixW") {
            return (
                <div className="space-y-4">
                    <div className="flex items-start justify-between group/tip">
                        <p className="text-white/70">{label}</p>
                        <div className="group relative ml-2 mt-1">
                            <div className="flex items-center justify-center w-4 h-4 rounded-full bg-white/5 border border-white/10 cursor-help hover:bg-white/10 transition-colors">
                                <span className="text-[10px] font-bold text-white/40 group-hover:text-white/60">?</span>
                            </div>
                            <div className="absolute right-0 bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-white/10 p-4 rounded-2xl z-50 w-72 text-[11px] text-slate-400 pointer-events-none shadow-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <p className="font-bold text-white mb-2 uppercase tracking-widest text-[10px]">{tooltipTitle}</p>
                                <p>{tooltipDesc}</p>
                            </div>
                        </div>
                    </div>
                    <BlockMath math="W \in \mathbb{R}^{|V| \times |V|}" />
                </div>
            );
        }
        if (stepId === "softmax") {
            return (
                <div className="space-y-4">
                    <div className="flex items-start justify-between group/tip">
                        <p className="text-white/70">{label}</p>
                        <div className="group relative ml-2 mt-1">
                            <div className="flex items-center justify-center w-4 h-4 rounded-full bg-white/5 border border-white/10 cursor-help hover:bg-white/10 transition-colors">
                                <span className="text-[10px] font-bold text-white/40 group-hover:text-white/60">?</span>
                            </div>
                            <div className="absolute right-0 bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-white/10 p-4 rounded-2xl z-50 w-72 text-[11px] text-slate-400 pointer-events-none shadow-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <p className="font-bold text-white mb-2 uppercase tracking-widest text-[10px]">{tooltipTitle}</p>
                                <p>{tooltipDesc}</p>
                                <div className="mt-2 font-mono text-[9px] text-indigo-400/70 italic">
                                    <InlineMath math="\sigma(z)_i = \frac{e^{z_i}}{\sum e^{z_j}}" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <BlockMath math="P(x_{t+1} | x_t) = \text{softmax}(W[idx])" />
                </div>
            );
        }
        if (stepId === "loss") {
            return (
                <div className="space-y-4">
                    <div className="flex items-start justify-between group/tip">
                        <p className="text-white/70">{label}</p>
                        <div className="group relative ml-2 mt-1">
                            <div className="flex items-center justify-center w-4 h-4 rounded-full bg-white/5 border border-white/10 cursor-help hover:bg-white/10 transition-colors">
                                <span className="text-[10px] font-bold text-white/40 group-hover:text-white/60">?</span>
                            </div>
                            <div className="absolute right-0 bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-white/10 p-4 rounded-2xl z-50 w-72 text-[11px] text-slate-400 pointer-events-none shadow-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <p className="font-bold text-white mb-2 uppercase tracking-widest text-[10px]">{tooltipTitle}</p>
                                <p>{tooltipDesc}</p>
                            </div>
                        </div>
                    </div>
                    <BlockMath math="\mathcal{L} = -\sum_{i} y_i \log(\hat{y}_i)" />
                </div>
            );
        }
        return <p className="text-sm text-white/70 leading-relaxed pb-6">{label}</p>;
    };

    const strengths = [
        t("models.bigram.architecture.analysis.strengths.0"),
        t("models.bigram.architecture.analysis.strengths.1"),
        t("models.bigram.architecture.analysis.strengths.2"),
    ];

    const limitations = [
        t("models.bigram.architecture.analysis.limitations.0"),
        t("models.bigram.architecture.analysis.limitations.1"),
        t("models.bigram.architecture.analysis.limitations.2"),
    ];

    return (
        <section className="relative py-20 border-t border-white/[0.04] bg-white/[0.01]">
            <div className="max-w-7xl mx-auto px-6">

                {/* Header */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                        <Cpu className="text-indigo-400" />
                        {t("models.bigram.architecture.title")}
                    </h2>
                    <p className="text-white/50 max-w-2xl">
                        {t("models.bigram.architecture.subtitle")}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

                    {/* Column 1: Mechanism */}
                    <FadeInView className="space-y-6">
                        <h3 className="text-sm font-mono uppercase tracking-widest text-indigo-400 border-b border-indigo-500/20 pb-2 mb-4">
                            {t("models.bigram.architecture.mechanism")}
                        </h3>
                        {stepsList.map((step, i) => (
                            <div key={step.id} className="flex gap-4 group">
                                <div className="flex flex-col items-center">
                                    <div className="w-6 h-6 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-[10px] font-mono text-white/60 group-hover:border-indigo-500/50 group-hover:text-indigo-400 transition-colors">
                                        {i + 1}
                                    </div>
                                    {i < stepsList.length - 1 && (
                                        <div className="w-px h-6 bg-white/[0.05] my-2" />
                                    )}
                                </div>
                                <div className="flex-grow pb-6">
                                    {renderStep(step.id, t(step.key), step.tooltipTitle, step.tooltipDesc)}
                                </div>
                            </div>
                        ))}
                    </FadeInView>

                    {/* Column 2: Analysis */}
                    <FadeInView delay={0.1} className="space-y-8">
                        {/* Strengths */}
                        <div>
                            <h3 className="text-sm font-mono uppercase tracking-widest text-emerald-400 border-b border-emerald-500/20 pb-2 mb-4">
                                {t("models.bigram.architecture.capabilities")}
                            </h3>
                            <ul className="space-y-3">
                                {strengths.map((s, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-white/60">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500/50 shrink-0 mt-0.5" />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Limitations */}
                        <div>
                            <h3 className="text-sm font-mono uppercase tracking-widest text-amber-400 border-b border-amber-500/20 pb-2 mb-4">
                                {t("models.bigram.architecture.constraints")}
                            </h3>
                            <ul className="space-y-3">
                                {limitations.map((l, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-white/60">
                                        <AlertTriangle className="w-4 h-4 text-amber-500/50 shrink-0 mt-0.5" />
                                        {l}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </FadeInView>

                    {/* Column 3: Model Card */}
                    <FadeInView delay={0.2} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 h-fit">
                        <div className="flex items-center gap-3 mb-6">
                            <Layers className="text-white/40" />
                            <h3 className="text-lg font-bold text-white">{t("models.bigram.architecture.modelCard.title")}</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">{t("models.bigram.architecture.modelCard.type")}</div>
                                <div className="text-white font-mono">{data.type}</div>
                            </div>

                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">{t("models.bigram.architecture.modelCard.complexity")}</div>
                                <Badge variant="outline" className="border-white/10 text-white/60">
                                    {data.complexity}
                                </Badge>
                            </div>

                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">{t("models.bigram.architecture.modelCard.useCases")}</div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {data.use_cases.map((u, i) => (
                                        <Badge
                                            key={i}
                                            className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/20"
                                        >
                                            {u}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/[0.06]">
                                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">{t("models.bigram.architecture.modelCard.description")}</div>
                                <p className="text-xs text-white/50 leading-relaxed">
                                    {data.description}
                                </p>
                            </div>
                        </div>
                    </FadeInView>

                </div>
            </div>
        </section>
    );
}
