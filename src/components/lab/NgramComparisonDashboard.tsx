"use client";

import { motion, type Variants } from "framer-motion";

import { useI18n } from "@/i18n/context";

interface NgramComparisonDashboardProps {
    metrics: Record<
        number,
        { perplexity: number | null; contextUtilization: number | null; contextSpace: number | null }
    >;
    currentN: number;
}

export function NgramComparisonDashboard({ metrics, currentN }: NgramComparisonDashboardProps) {
    const { t } = useI18n();
    const ns = [1, 2, 3, 4, 5];

    const containerVariants: Variants = {
        hidden: {},
        visible: { transition: { staggerChildren: 0.07 } },
    };
    const rowVariants: Variants = {
        hidden: { opacity: 0, x: -8 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.25, 0, 0, 1] } },
    };

    return (
        <motion.div
            className="space-y-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="grid grid-cols-3 gap-2 px-4 pb-1 text-[9px] font-mono uppercase tracking-widest text-white/20">
                <span title={t("models.ngram.lab.comparison.tooltipPpl")}>
                    {t("models.ngram.lab.comparison.ppl")}
                </span>
                <span title={t("models.ngram.lab.comparison.tooltipUtil")}>
                    {t("models.ngram.lab.comparison.util")}
                </span>
                <span title={t("models.ngram.lab.comparison.tooltipSpace")}>
                    {t("models.ngram.lab.comparison.space")}
                </span>
            </div>
            {ns.map((n) => {
                const m = metrics[n];
                const isActive = n === currentN;
                return (
                    <motion.div
                        key={n}
                        variants={rowVariants}
                        className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 transition-colors ${isActive
                            ? "border-amber-500/30 bg-amber-500/[0.06] shadow-[0_0_12px_1px_rgba(251,191,36,0.06)]"
                            : "border-white/[0.06] bg-white/[0.015]"
                            }`}
                    >
                        <span
                            className={`font-mono text-xs font-bold w-12 ${isActive ? "text-amber-300" : "text-white/40"
                                }`}
                        >
                            N={n}
                        </span>
                        <div className="flex-1 grid grid-cols-3 gap-2 text-[10px] font-mono">
                            <div title={t("models.ngram.lab.comparison.tooltipPpl")}>
                                <span className={isActive ? "text-amber-300" : "text-white/50"}>
                                    {m?.perplexity != null ? m.perplexity.toFixed(1) : "—"}
                                </span>
                            </div>
                            <div title={t("models.ngram.lab.comparison.tooltipUtil")}>
                                <span className={isActive ? "text-emerald-300" : "text-white/50"}>
                                    {m?.contextUtilization != null
                                        ? `${(m.contextUtilization * 100).toFixed(1)}%`
                                        : "—"}
                                </span>
                            </div>
                            <div title={t("models.ngram.lab.comparison.tooltipSpace")}>
                                <span className={isActive ? "text-purple-300" : "text-white/50"}>
                                    {m?.contextSpace != null
                                        ? m.contextSpace.toLocaleString()
                                        : "—"}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </motion.div>
    );
}
