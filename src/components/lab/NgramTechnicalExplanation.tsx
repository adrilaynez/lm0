"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Cpu, Layers } from "lucide-react";
import { useI18n } from "@/i18n/context";
import { Badge } from "@/components/ui/badge";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

interface NgramTechnicalExplanationProps {
    contextSize: number;
    vocabSize: number;
    totalTokens?: number;
    uniqueContexts?: number;
    perplexity?: number;
    finalLoss?: number;
    corpusName?: string;
    smoothingAlpha?: number;
}

interface SpecRowProps {
    label: string;
    value: string;
    mono?: boolean;
}

function SpecRow({ label, value, mono }: SpecRowProps) {
    return (
        <div className="flex flex-col gap-0.5 py-3 border-b border-white/[0.05] last:border-0">
            <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-white/30">
                {label}
            </span>
            <span className={`text-sm text-white/70 leading-snug ${mono ? "font-mono" : ""}`}>
                {value}
            </span>
        </div>
    );
}

export function NgramTechnicalExplanation({
    contextSize,
    vocabSize,
    totalTokens,
    uniqueContexts,
    perplexity,
    finalLoss,
    corpusName = "Paul Graham Essays",
    smoothingAlpha = 1.0,
}: NgramTechnicalExplanationProps) {
    const { t } = useI18n();

    const contextSpace = Math.pow(vocabSize, contextSize);
    const contextSpaceStr = contextSpace > 1e12
        ? `${(contextSpace / 1e12).toFixed(1)}T`
        : contextSpace > 1e9
            ? `${(contextSpace / 1e9).toFixed(1)}B`
            : contextSpace > 1e6
                ? `${(contextSpace / 1e6).toFixed(1)}M`
                : contextSpace.toLocaleString();

    const paramCount = contextSpace * vocabSize;
    const paramCountStr = paramCount > 1e12
        ? `${(paramCount / 1e12).toFixed(1)}T`
        : paramCount > 1e9
            ? `${(paramCount / 1e9).toFixed(1)}B`
            : paramCount > 1e6
                ? `${(paramCount / 1e6).toFixed(1)}M`
                : paramCount.toLocaleString();

    const order = contextSize + 1;
    const steps = [
        t("models.ngram.lab.technicalExplanation.steps.lookup", { n: contextSize }),
        t("models.ngram.lab.technicalExplanation.steps.normalize", { alpha: smoothingAlpha.toFixed(1) }),
        t("models.ngram.lab.technicalExplanation.steps.predict"),
    ];
    const capabilities = [
        t("models.ngram.lab.technicalExplanation.capabilities.0"),
        t("models.ngram.lab.technicalExplanation.capabilities.1"),
        t("models.ngram.lab.technicalExplanation.capabilities.2"),
    ];
    const constraints = [
        t("models.ngram.lab.technicalExplanation.constraints.0"),
        t("models.ngram.lab.technicalExplanation.constraints.1"),
        t("models.ngram.lab.technicalExplanation.constraints.2"),
    ];

    return (
        <section className="relative py-20 border-t border-white/[0.04] bg-white/[0.01]">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                        <Cpu className="text-indigo-400" />
                        {t("models.ngram.lab.technicalExplanation.title")}
                    </h2>
                    <p className="text-white/50 max-w-2xl">
                        {t("models.ngram.lab.technicalExplanation.description")}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                    {/* Column 1: Mechanism */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="space-y-6"
                    >
                        <h3 className="text-sm font-mono uppercase tracking-widest text-indigo-400 border-b border-indigo-500/20 pb-2 mb-4">
                            {t("models.ngram.lab.technicalExplanation.mechanism")}
                        </h3>
                        {steps.map((label, i) => (
                            <div key={i} className="flex gap-4 group">
                                <div className="flex flex-col items-center">
                                    <div className="w-6 h-6 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-[10px] font-mono text-white/60 group-hover:border-indigo-500/50 group-hover:text-indigo-400 transition-colors">
                                        {i + 1}
                                    </div>
                                    {i < steps.length - 1 && <div className="w-px h-6 bg-white/[0.05] my-2" />}
                                </div>
                                <div className="flex-grow pb-6">
                                    <p className="text-white/70 leading-relaxed">{label}</p>
                                    {i === 0 && (
                                        <div className="mt-4">
                                            <BlockMath math={`|V|^{${contextSize}} = ${contextSpaceStr}`} />
                                        </div>
                                    )}
                                    {i === 1 && (
                                        <div className="mt-4 text-[11px] text-white/40 font-mono">
                                            <BlockMath math={`P(x_{t}\\mid x_{t-${contextSize}}\\ldots x_{t-1})`} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Column 2: Capabilities/Constraints */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="space-y-8"
                    >
                        <div>
                            <h3 className="text-sm font-mono uppercase tracking-widest text-emerald-400 border-b border-emerald-500/20 pb-2 mb-4">
                                {t("models.ngram.lab.technicalExplanation.capabilitiesTitle")}
                            </h3>
                            <ul className="space-y-3">
                                {capabilities.map((s, idx) => (
                                    <li key={idx} className="flex gap-3 text-sm text-white/60">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500/50 shrink-0 mt-0.5" />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-sm font-mono uppercase tracking-widest text-amber-400 border-b border-amber-500/20 pb-2 mb-4">
                                {t("models.ngram.lab.technicalExplanation.constraintsTitle")}
                            </h3>
                            <ul className="space-y-3">
                                {constraints.map((l, idx) => (
                                    <li key={idx} className="flex gap-3 text-sm text-white/60">
                                        <AlertTriangle className="w-4 h-4 text-amber-500/50 shrink-0 mt-0.5" />
                                        {l}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>

                    {/* Column 3: Model Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 h-fit"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <Layers className="text-white/40" />
                            <h3 className="text-lg font-bold text-white">{t("models.ngram.lab.technicalExplanation.modelCardTitle")}</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">
                                    {t("models.ngram.lab.technicalExplanation.modelType")}
                                </div>
                                <div className="text-white font-mono">
                                    {t("models.ngram.lab.technicalExplanation.modelTypeValue")
                                        .replace("{n}", String(contextSize))
                                        .replace("{nPlusOne}", String(order))}
                                </div>
                            </div>

                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">
                                    {t("models.ngram.lab.technicalExplanation.complexity")}
                                </div>
                                <Badge variant="outline" className="border-white/10 text-white/60">
                                    {t("models.ngram.lab.technicalExplanation.complexityValue")}
                                </Badge>
                            </div>

                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">
                                    {t("models.ngram.lab.technicalExplanation.useCases")}
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {[0, 1, 2].map((i) => (
                                        <Badge
                                            key={i}
                                            className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/20"
                                        >
                                            {t(`models.ngram.lab.technicalExplanation.useCasesList.${i}`)}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/[0.06] space-y-4">
                                <div>
                                    <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">
                                        {t("models.ngram.lab.technicalExplanation.trainingStats")}
                                    </div>
                                    <div className="space-y-2">
                                        <SpecRow
                                            label={t("models.ngram.lab.technicalExplanation.parameterCount")}
                                            value={t("models.ngram.lab.technicalExplanation.parameterCountValue")
                                                .replace("{n}", String(contextSize))
                                                .replace("{count}", paramCountStr)}
                                            mono
                                        />
                                        <SpecRow
                                            label={t("models.ngram.lab.technicalExplanation.corpusInfo")}
                                            value={corpusName}
                                        />
                                        <SpecRow
                                            label={t("models.ngram.lab.technicalExplanation.trainingTokens")}
                                            value={totalTokens != null
                                                ? t("models.ngram.lab.technicalExplanation.trainingTokensValue").replace(
                                                    "{count}",
                                                    `${(totalTokens / 1000).toFixed(1)}k`
                                                )
                                                : "—"}
                                            mono
                                        />
                                        <SpecRow
                                            label={t("models.ngram.lab.technicalExplanation.uniqueContexts")}
                                            value={uniqueContexts != null
                                                ? t("models.ngram.lab.technicalExplanation.uniqueContextsValue")
                                                    .replace("{seen}", uniqueContexts.toLocaleString())
                                                    .replace("{possible}", contextSpaceStr)
                                                : "—"}
                                            mono
                                        />
                                        <SpecRow
                                            label={t("models.ngram.lab.technicalExplanation.perplexity")}
                                            value={perplexity != null ? perplexity.toFixed(2) : "—"}
                                            mono
                                        />
                                        <SpecRow
                                            label={t("models.ngram.lab.technicalExplanation.finalLoss")}
                                            value={finalLoss != null ? finalLoss.toFixed(4) : "—"}
                                            mono
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/[0.06]">
                                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">
                                    {t("models.ngram.lab.technicalExplanation.mathematicalFormulation")}
                                </div>
                                <div className="text-xs text-white/50 leading-relaxed">
                                    <BlockMath math={`P(c_t \\mid c_{t-${contextSize}}\\ldots c_{t-1}) = \\frac{\\mathrm{count}(c_{t-${contextSize}}\\ldots c_t)}{\\mathrm{count}(c_{t-${contextSize}}\\ldots c_{t-1})}`} />
                                    <p className="mt-3 text-xs text-white/45">{t("models.ngram.lab.technicalExplanation.formulaDesc")}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
