"use client";

import { motion } from "framer-motion";

import { useI18n } from "@/i18n/context";

interface NgramSparsityIndicatorProps {
    training: {
        unique_contexts?: number | null;
        context_utilization?: number | null;
        sparsity?: number | null;
        transition_density?: number | null;
    } | null;
    diagnostics: {
        estimated_context_space: number;
        context_size: number;
    } | null;
}

export function NgramSparsityIndicator({ training, diagnostics }: NgramSparsityIndicatorProps) {
    const { t } = useI18n();

    if (!training || !diagnostics) return null;
    const utilPct = (training.context_utilization ?? 0) * 100;
    const sparsityPct = (training.sparsity ?? 0) * 100;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/30 rounded-xl p-4 border border-white/[0.06]">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1">
                        {t("models.ngram.lab.sparsity.observedContexts")}
                    </p>
                    <p className="text-xl font-bold text-cyan-300 font-mono">
                        {(training.unique_contexts ?? 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-white/25 mt-1">
                        of {diagnostics.estimated_context_space.toLocaleString()} {t("models.ngram.lab.sparsity.possibleSuffix")}
                    </p>
                </div>
                <div className="bg-black/30 rounded-xl p-4 border border-white/[0.06]">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1">
                        {t("models.ngram.lab.sparsity.avgTransitions")}
                    </p>
                    <p className="text-xl font-bold text-emerald-300 font-mono">
                        {(training.transition_density ?? 0).toFixed(1)}
                    </p>
                    <p className="text-[10px] text-white/25 mt-1">
                        {t("models.ngram.lab.sparsity.nextTokens")}
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                <div>
                    <div className="flex justify-between text-[10px] mb-1.5">
                        <span className="font-mono uppercase tracking-widest text-white/30">
                            {t("models.ngram.lab.sparsity.utilLabel")}
                        </span>
                        <span className="font-mono text-cyan-400">{utilPct.toFixed(2)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(1, utilPct)}%` }}
                            transition={{ duration: 0.8 }}
                            className="h-full rounded-full bg-gradient-to-r from-cyan-600/70 to-cyan-400/80"
                        />
                    </div>
                    <p className="text-[10px] text-white/20 mt-1">
                        {t("models.ngram.lab.sparsity.utilHint")}
                    </p>
                </div>
                <div>
                    <div className="flex justify-between text-[10px] mb-1.5">
                        <span className="font-mono uppercase tracking-widest text-white/30">
                            {t("models.ngram.lab.sparsity.sparsityLabel")}
                        </span>
                        <span className="font-mono text-red-400">{sparsityPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${sparsityPct}%` }}
                            transition={{ duration: 0.8 }}
                            className="h-full rounded-full bg-gradient-to-r from-red-600/70 to-red-400/80"
                        />
                    </div>
                    <p className="text-[10px] text-white/20 mt-1">
                        {t("models.ngram.lab.sparsity.sparsityHint")}
                    </p>
                </div>
            </div>
        </div>
    );
}
