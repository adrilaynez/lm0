"use client";

import { memo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Search, Zap } from "lucide-react";

import { useI18n } from "@/i18n/context";
import type { Prediction } from "@/types/lmLab";

/* ─── Props ─── */
interface PredictionPipelineDemoProps {
    onAnalyze: (text: string, topK: number) => void;
    predictions: Prediction[] | null;
    inferenceMs?: number;
    device?: string;
    loading: boolean;
    error: string | null;
}

/* ─── Step badge ─── */
function StepBadge({ step, label, active }: { step: number; label: string; active: boolean }) {
    return (
        <div className={`flex items-center gap-2 transition-all ${active ? "opacity-100" : "opacity-30"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border transition-all ${active
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                    : "bg-white/[0.04] border-white/[0.08] text-white/30"
                }`}>
                {step}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">{label}</span>
        </div>
    );
}

function displayToken(t: string) {
    return t === " " ? "␣" : t;
}

/* ─── Main Component ─── */
export const PredictionPipelineDemo = memo(function PredictionPipelineDemo({
    onAnalyze,
    predictions,
    inferenceMs,
    device,
    loading,
    error,
}: PredictionPipelineDemoProps) {
    const { t } = useI18n();
    const [inputChar, setInputChar] = useState("");
    const [hasQueried, setHasQueried] = useState(false);

    const handleQuery = () => {
        if (!inputChar.trim()) return;
        onAnalyze(inputChar.trim(), 5);
        setHasQueried(true);
    };

    const currentStep = !hasQueried ? 1 : loading ? 2 : predictions ? 3 : 1;

    return (
        <div className="space-y-5">
            {/* Pipeline steps header */}
            <div className="flex items-center justify-center gap-2 sm:gap-3">
                <StepBadge step={1} label={t("bigramNarrative.pipelineDemo.step1")} active={currentStep >= 1} />
                <ArrowRight className="w-3 h-3 text-white/15" />
                <StepBadge step={2} label={t("bigramNarrative.pipelineDemo.step2")} active={currentStep >= 2} />
                <ArrowRight className="w-3 h-3 text-white/15" />
                <StepBadge step={3} label={t("bigramNarrative.pipelineDemo.step3")} active={currentStep >= 3} />
            </div>

            {/* Step 1: Input */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
                <p className="text-[9px] font-mono uppercase tracking-widest text-white/20 mb-3">
                    {t("bigramNarrative.pipelineDemo.inputLabel")}
                </p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputChar}
                        onChange={(e) => {
                            setInputChar(e.target.value.slice(0, 1));
                            setHasQueried(false);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleQuery()}
                        placeholder={t("bigramNarrative.pipelineDemo.placeholder")}
                        maxLength={1}
                        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-lg text-white placeholder:text-white/20 font-mono text-center focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/30 transition-all"
                    />
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleQuery}
                        disabled={loading || !inputChar.trim()}
                        className="px-5 py-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider hover:bg-emerald-500/25 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Search className="w-3.5 h-3.5" />
                        {t("bigramNarrative.pipelineDemo.lookup")}
                    </motion.button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                    {error}
                </div>
            )}

            {/* Loading state */}
            {loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-5 text-center"
                >
                    <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="flex items-center justify-center gap-2 text-sm text-emerald-400/70 font-mono"
                    >
                        <Zap className="w-4 h-4" />
                        {t("bigramNarrative.pipelineDemo.lookingUp")}
                    </motion.div>
                </motion.div>
            )}

            {/* Step 3: Results */}
            <AnimatePresence mode="wait">
                {predictions && !loading && hasQueried && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-[9px] font-mono uppercase tracking-widest text-white/20">
                                {t("bigramNarrative.pipelineDemo.resultsLabel")}
                            </p>
                            {inferenceMs !== undefined && (
                                <span className="text-[9px] font-mono text-emerald-400/50">
                                    {inferenceMs.toFixed(1)}ms {device && `· ${device}`}
                                </span>
                            )}
                        </div>

                        {/* Context indicator */}
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-white/35">{t("bigramNarrative.pipelineDemo.afterChar")}</span>
                            <code className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold text-lg">
                                {displayToken(inputChar)}
                            </code>
                            <ArrowRight className="w-3 h-3 text-white/20" />
                        </div>

                        {/* Probability bars */}
                        <div className="space-y-2">
                            {predictions.map((p, i) => (
                                <motion.div
                                    key={p.token}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.06 }}
                                    className="flex items-center gap-3"
                                >
                                    <code className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.08] text-white font-mono text-sm font-bold shrink-0">
                                        {displayToken(p.token)}
                                    </code>
                                    <div className="flex-1 h-8 bg-white/[0.03] rounded-lg overflow-hidden relative">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.max(2, p.probability * 100)}%` }}
                                            transition={{ duration: 0.5, delay: i * 0.06 + 0.1, ease: "easeOut" }}
                                            className="absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r from-emerald-500/60 to-emerald-400/40"
                                        />
                                        <span className="absolute inset-0 flex items-center pl-3 text-[10px] font-mono text-white/60">
                                            {(p.probability * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Insight */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="pt-3 border-t border-white/[0.06]"
                        >
                            <p className="text-xs text-white/30 italic leading-relaxed">
                                {t("bigramNarrative.pipelineDemo.insight")}
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
