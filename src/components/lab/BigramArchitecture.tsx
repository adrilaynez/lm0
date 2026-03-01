"use client";

import { ArrowRight, Braces, Grid3x3, RefreshCw, Shuffle } from "lucide-react";

import { FadeInView } from "@/components/lab/FadeInView";
import { useI18n } from "@/i18n/context";

export function BigramArchitecture() {
    const { t } = useI18n();
    return (
        <div className="relative py-12">
            <h3 className="text-xl font-bold text-white mb-8 border-l-2 border-indigo-500 pl-4">
                {t("models.bigram.architecture.flow.title")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center justify-center">
                {/* Step 1: Input */}
                <ArchitectureNode
                    label={t("models.bigram.architecture.flow.input")}
                    sublabel={t("models.bigram.architecture.flow.currentChar")}
                    icon={Braces}
                    color="text-white"
                    delay={0}
                />

                <FlowArrow delay={0.5} />

                {/* Step 2: Lookup */}
                <ArchitectureNode
                    label={t("models.bigram.architecture.flow.lookup")}
                    sublabel={t("models.bigram.architecture.flow.selectRow")}
                    icon={Grid3x3}
                    color="text-emerald-400"
                    delay={1}
                />

                <FlowArrow delay={1.5} />

                {/* Step 3: Distribution */}
                <ArchitectureNode
                    label={t("models.bigram.architecture.flow.softmax")}
                    sublabel={t("models.bigram.architecture.flow.probabilities")}
                    icon={RefreshCw}
                    color="text-violet-400"
                    delay={2}
                />

                <FlowArrow delay={2.5} />

                {/* Step 4: Sampling */}
                <ArchitectureNode
                    label={t("models.bigram.architecture.flow.sampling")}
                    sublabel={t("models.bigram.architecture.flow.nextChar")}
                    icon={Shuffle}
                    color="text-amber-400"
                    delay={3}
                />
            </div>

            <div className="mt-8 p-4 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white/60 font-mono leading-relaxed">
                <span className="text-indigo-400 font-bold">P(next | current)</span>:{" "}
                {t("models.bigram.architecture.flow.description").replace("{matrix}", "V \u00D7 V")}
            </div>
        </div>
    );
}

function ArchitectureNode({ label, sublabel, icon: Icon, color, delay }: any) {
    return (
        <FadeInView
            delay={delay}
            className="flex flex-col items-center text-center p-4 rounded-xl bg-white/[0.05] border border-white/10 min-w-[120px]"
        >
            <div className={`mb-3 p-3 rounded-full bg-white/5 ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="text-white font-bold text-sm mb-1">{label}</div>
            <div className="text-white/40 text-[10px] uppercase tracking-wider font-mono">
                {sublabel}
            </div>
        </FadeInView>
    );
}

function FlowArrow({ delay }: { delay: number }) {
    return (
        <FadeInView
            delay={delay}
            className="hidden md:flex justify-center text-white/20"
        >
            <ArrowRight className="w-6 h-6" />
        </FadeInView>
    );
}
