"use client";

import { useState } from "react";

import { AnimatePresence,motion } from "framer-motion";
import { ChevronDown,FlaskConical } from "lucide-react";

import { useI18n } from "@/i18n/context";

export function MLPGuidedExperiments() {
    const { t } = useI18n();
    const [isExpanded, setIsExpanded] = useState(false);

    const experiments = [
        { key: "bestConfig" },
        { key: "overfitting" },
        { key: "embeddings" },
        { key: "generation" },
    ] as const;

    return (
        <div className="my-8">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-violet-500/20 bg-violet-950/10 p-4 hover:border-violet-500/30 hover:bg-violet-950/15 transition-all"
                aria-expanded={isExpanded}
            >
                <div className="flex items-center gap-3">
                    <FlaskConical className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-mono font-bold text-violet-300">
                        {t("models.mlp.narrative.guidedExperiments.title")}
                    </span>
                </div>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-4 h-4 text-violet-400/60" />
                </motion.div>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="grid md:grid-cols-2 gap-3 mt-3">
                            {experiments.map(({ key }) => (
                                <div
                                    key={key}
                                    className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4"
                                >
                                    <h4 className="text-sm font-mono font-bold text-violet-300 mb-2">
                                        {t(`models.mlp.narrative.guidedExperiments.${key}.title`)}
                                    </h4>
                                    <p className="text-xs text-white/50 leading-relaxed mb-2">
                                        <span className="font-mono text-emerald-400/70">Try: </span>
                                        {t(`models.mlp.narrative.guidedExperiments.${key}.tryThis`)}
                                    </p>
                                    <p className="text-xs text-white/40 leading-relaxed">
                                        <span className="font-mono text-amber-400/70">Observe: </span>
                                        {t(`models.mlp.narrative.guidedExperiments.${key}.observe`)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
