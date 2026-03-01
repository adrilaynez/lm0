"use client";

import { FadeInView } from "@/components/lab/FadeInView";
import { useI18n } from "@/i18n/context";

interface CombinatoricExplosionTableProps {
    vocabSize?: number;
}

export function CombinatoricExplosionTable({ vocabSize = 50000 }: CombinatoricExplosionTableProps) {
    const { t } = useI18n();

    const formatNumber = (num: number): string => {
        if (num >= 1e18) return `${(num / 1e18).toFixed(2)} quintillion`;
        if (num >= 1e15) return `${(num / 1e15).toFixed(2)} quadrillion`;
        if (num >= 1e12) return `${(num / 1e12).toFixed(2)} trillion`;
        if (num >= 1e9) return `${(num / 1e9).toFixed(2)} billion`;
        if (num >= 1e6) return `${(num / 1e6).toFixed(2)} million`;
        return num.toLocaleString();
    };

    const formatScientific = (num: number): string => {
        return num.toExponential(2);
    };

    const rows = [
        {
            nGram: "Bigram",
            n: 2,
            formula: `${vocabSize.toLocaleString()}²`,
            combinations: Math.pow(vocabSize, 2),
            severity: "warning" as const,
        },
        {
            nGram: "Trigram",
            n: 3,
            formula: `${vocabSize.toLocaleString()}³`,
            combinations: Math.pow(vocabSize, 3),
            severity: "high" as const,
        },
        {
            nGram: "4-gram",
            n: 4,
            formula: `${vocabSize.toLocaleString()}⁴`,
            combinations: Math.pow(vocabSize, 4),
            severity: "critical" as const,
        },
    ];

    const severityColors = {
        warning: "border-amber-500/30 bg-amber-500/[0.04]",
        high: "border-orange-500/30 bg-orange-500/[0.04]",
        critical: "border-red-500/30 bg-red-500/[0.04]",
    };

    const severityTextColors = {
        warning: "text-amber-400",
        high: "text-orange-400",
        critical: "text-red-400",
    };

    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                <div className="grid grid-cols-4 gap-3 px-4 py-3 border-b border-white/[0.06] bg-white/[0.03]">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 font-bold">
                        {t("ngramNarrative.tokenization.tableHeaders.model")}
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 font-bold">
                        {t("ngramNarrative.tokenization.tableHeaders.formula")}
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 font-bold">
                        {t("ngramNarrative.tokenization.tableHeaders.combinations")}
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 font-bold text-right">
                        {t("ngramNarrative.tokenization.tableHeaders.scientific")}
                    </div>
                </div>
                {rows.map((row, idx) => (
                    <FadeInView
                        key={row.n}
                        delay={idx * 0.1}
                        className={`grid grid-cols-4 gap-3 px-4 py-4 border-b border-white/[0.04] last:border-0 ${severityColors[row.severity]}`}
                    >
                        <div className={`text-sm font-bold ${severityTextColors[row.severity]}`}>
                            {row.nGram}
                        </div>
                        <div className="text-sm font-mono text-white/60">
                            {row.formula}
                        </div>
                        <div className={`text-sm font-bold ${severityTextColors[row.severity]}`}>
                            {formatNumber(row.combinations)}
                        </div>
                        <div className="text-xs font-mono text-white/40 text-right">
                            {formatScientific(row.combinations)}
                        </div>
                    </FadeInView>
                ))}
            </div>

            <FadeInView className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
                <p className="text-xs text-white/40 leading-relaxed">
                    <span className="font-bold text-white/50">
                        {t("ngramNarrative.tokenization.noteLabel")}
                    </span>{" "}
                    {t("ngramNarrative.tokenization.noteText")}
                </p>
            </FadeInView>
        </div>
    );
}
