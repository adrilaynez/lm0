"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Lightbulb } from "lucide-react";

import { FadeInView } from "@/components/lab/FadeInView";

import { useI18n } from "@/i18n/context";

export function GuidedExperiments() {
    const { t } = useI18n();
    const [open, setOpen] = useState(false);

    const experiments = [
        "handVsTraining",
        "activationComparison",
        "learningRateExtremes",
        "convergenceBehavior",
        "randomInitialization",
    ] as const;

    return (
        <FadeInView margin="-40px" className="mb-8 rounded-xl border border-amber-500/[0.12] bg-amber-500/[0.02] overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left group hover:bg-amber-500/[0.03] transition-colors"
            >
                <div className="shrink-0 p-1.5 rounded-lg bg-amber-500/10">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white/70">
                        {t("models.neuralNetworks.guidedExperiments.title")}
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">
                        {t("models.neuralNetworks.guidedExperiments.subtitle")}
                    </p>
                </div>
                <motion.div
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                >
                    <ChevronDown className="w-4 h-4 text-white/20" />
                </motion.div>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 pt-2 space-y-3 border-t border-amber-500/[0.08]">
                            {experiments.map((exp, idx) => (
                                <ExperimentCard key={exp} experiment={exp} number={idx + 1} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </FadeInView>
    );
}

function ExperimentCard({ experiment, number }: { experiment: string; number: number }) {
    const { t } = useI18n();
    const baseKey = `models.neuralNetworks.guidedExperiments.${experiment}`;

    return (
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-4">
            <div className="flex items-start gap-3 mb-3">
                <div className="shrink-0 w-6 h-6 rounded-full bg-amber-500/15 flex items-center justify-center text-xs font-bold text-amber-400">
                    {number}
                </div>
                <h3 className="text-sm font-semibold text-white/80 leading-tight">
                    {t(`${baseKey}.title`)}
                </h3>
            </div>

            <div className="pl-9 space-y-3">
                <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400/60 mb-1.5">
                        Do this
                    </p>
                    <p className="text-xs text-white/45 leading-relaxed">
                        {t(`${baseKey}.doThis`)}
                    </p>
                </div>

                <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-400/60 mb-1.5">
                        Observe this
                    </p>
                    <p className="text-xs text-white/45 leading-relaxed">
                        {t(`${baseKey}.observeThis`)}
                    </p>
                </div>
            </div>
        </div>
    );
}
