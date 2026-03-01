"use client";

import { useState } from "react";

import { AnimatePresence,motion } from "framer-motion";
import { AlertCircle,GitBranch, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/context";
import type { StepDetail } from "@/types/lmLab";

interface StepwisePredictionProps {
    onPredict: (text: string, steps: number) => void;
    steps: StepDetail[] | null;
    finalPrediction: string | null;
    loading: boolean;
    error: string | null;
}

export function StepwisePrediction({
    onPredict,
    steps,
    finalPrediction,
    loading,
    error,
}: StepwisePredictionProps) {
    const { t } = useI18n();
    const [text, setText] = useState("hel");
    const [numSteps, setNumSteps] = useState(5);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) onPredict(text.trim(), numSteps);
    };

    return (
        <Card className="bg-black/40 border-white/[0.06] backdrop-blur-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <GitBranch className="h-4 w-4 text-cyan-400" />
                <span className="font-mono text-xs uppercase tracking-widest text-white/60">
                    {t("models.bigram.stepwise.title")}
                </span>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="space-y-2">
                    <label className="text-[11px] font-mono uppercase tracking-widest text-white/40">
                        {t("models.bigram.stepwise.form.input")}
                    </label>
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={t("models.bigram.stepwise.form.placeholder")}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <label className="text-[11px] font-mono uppercase tracking-widest text-white/40">
                            {t("models.bigram.stepwise.form.steps")}
                        </label>
                        <span className="text-xs font-mono text-cyan-400">{numSteps}</span>
                    </div>
                    <input
                        type="range"
                        min={1}
                        max={10}
                        value={numSteps}
                        onChange={(e) => setNumSteps(Number(e.target.value))}
                        className="w-full accent-cyan-500 h-1"
                    />
                </div>

                <Button
                    type="submit"
                    disabled={loading || !text.trim()}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs uppercase tracking-widest h-10 transition-all disabled:opacity-40"
                >
                    {loading ? (
                        <motion.span
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            {t("models.bigram.stepwise.form.predicting")}
                        </motion.span>
                    ) : (
                        <>
                            <Zap className="h-3.5 w-3.5 mr-2" /> {t("models.bigram.stepwise.form.predict")}
                        </>
                    )}
                </Button>
            </form>

            {/* Results */}
            <div className="px-5 pb-5 space-y-3">
                {error && (
                    <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="space-y-2">
                        {Array.from({ length: numSteps }).map((_, i) => (
                            <Skeleton key={i} className="h-8 bg-white/[0.04] rounded-lg" />
                        ))}
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {steps && !loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-1"
                        >
                            {/* Step table */}
                            <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] overflow-hidden">
                                {/* Header */}
                                <div className="grid grid-cols-[3rem_3rem_1fr] gap-2 px-4 py-2 border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-widest text-white/30">
                                    <span>{t("models.bigram.stepwise.table.step")}</span>
                                    <span>{t("models.bigram.stepwise.table.char")}</span>
                                    <span>{t("models.bigram.stepwise.table.prob")}</span>
                                </div>
                                {/* Rows */}
                                {steps.map((s, i) => (
                                    <motion.div
                                        key={s.step}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        className="grid grid-cols-[3rem_3rem_1fr] gap-2 px-4 py-2 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors"
                                    >
                                        <span className="text-xs font-mono text-white/30">
                                            {s.step}
                                        </span>
                                        <span className="text-sm font-mono text-white font-bold">
                                            {s.char === " " ? "␣" : s.char}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-4 bg-white/[0.03] rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{
                                                        width: `${(s.probability * 100).toFixed(1)}%`,
                                                    }}
                                                    transition={{
                                                        duration: 0.5,
                                                        delay: i * 0.06,
                                                        ease: [0.22, 1, 0.36, 1],
                                                    }}
                                                    className="h-full bg-gradient-to-r from-cyan-600/60 to-cyan-400/40 rounded-full"
                                                />
                                            </div>
                                            <span className="text-[10px] font-mono text-white/40 w-12 text-right">
                                                {(s.probability * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Final prediction */}
                            {finalPrediction && (
                                <div className="flex items-center gap-2 pt-2">
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                                        {t("models.bigram.stepwise.result")}
                                    </span>
                                    <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-sm font-mono px-3 py-1">
                                        {finalPrediction}
                                    </Badge>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Card>
    );
}
