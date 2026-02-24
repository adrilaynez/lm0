"use client";

import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useI18n } from "@/i18n/context";

type RightState = "idle" | "loading" | "failed";

export function GeneralizationFailureDemo() {
    const { t } = useI18n();
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-80px" });
    const [rightState, setRightState] = useState<RightState>("idle");

    useEffect(() => {
        if (!isInView) return;
        const t1 = setTimeout(() => setRightState("loading"), 900);
        const t2 = setTimeout(() => setRightState("failed"), 2700);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [isInView]);

    return (
        <div ref={ref} className="p-4 sm:p-6 flex flex-col gap-6">
            <div className="grid md:grid-cols-2 gap-4">

                {/* Left: Known context */}
                <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-5 flex flex-col gap-4"
                >
                    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-emerald-400/50">
                        {t("ngram.widgets.generalizationFailure.seenInTraining")}
                    </span>

                    <div className="font-mono text-sm text-white/70 bg-white/[0.04] rounded-lg px-3 py-2 leading-relaxed">
                        &ldquo;the{" "}
                        <span className="text-emerald-300 font-bold bg-emerald-500/10 rounded px-0.5">cat</span>
                        {" "}sat on the&rdquo;
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-white/30 text-xs font-mono">{t("ngram.widgets.generalizationFailure.nextWord")}</span>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={isInView ? { opacity: 1, scale: 1 } : {}}
                            transition={{ delay: 0.6, type: "spring", bounce: 0.55 }}
                            className="flex items-center gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="font-mono font-black text-emerald-300 text-xl">
                                &ldquo;mat&rdquo;
                            </span>
                        </motion.div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] text-white/20 font-mono uppercase tracking-wider">{t("ngram.widgets.generalizationFailure.confidence")}</span>
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={isInView ? { opacity: 1 } : {}}
                                transition={{ delay: 1.0 }}
                                className="text-[10px] text-emerald-400/60 font-mono"
                            >
                                87%
                            </motion.span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={isInView ? { width: "87%" } : {}}
                                transition={{ delay: 0.9, duration: 0.7, ease: "easeOut" }}
                                className="h-full rounded-full bg-emerald-400/70"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Right: Unseen context */}
                <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.35, duration: 0.4 }}
                    className="rounded-xl border border-red-500/20 bg-red-950/[0.07] p-5 flex flex-col gap-4"
                >
                    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-red-400/50">
                        {t("ngram.widgets.generalizationFailure.neverSeenInTraining")}
                    </span>

                    <div className="font-mono text-sm text-white/70 bg-white/[0.04] rounded-lg px-3 py-2 leading-relaxed">
                        &ldquo;the{" "}
                        <span className="text-red-300 font-bold bg-red-500/10 rounded px-0.5">dog</span>
                        {" "}sat on the&rdquo;
                    </div>

                    <div className="flex items-center gap-3 min-h-[32px]">
                        <span className="text-white/30 text-xs font-mono">{t("ngram.widgets.generalizationFailure.nextWord")}</span>
                        <AnimatePresence mode="wait">
                            {rightState === "idle" && (
                                <motion.span key="idle" exit={{ opacity: 0 }}
                                    className="text-white/10 text-sm font-mono">—</motion.span>
                            )}
                            {rightState === "loading" && (
                                <motion.div key="loading"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }}
                                        className="w-5 h-5 rounded-full border-2 border-red-400/20 border-t-red-400"
                                    />
                                </motion.div>
                            )}
                            {rightState === "failed" && (
                                <motion.div key="failed"
                                    initial={{ opacity: 0, scale: 0.6 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 280, damping: 18 }}
                                    className="flex items-center gap-2"
                                >
                                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                                    <span className="font-mono font-black text-red-300 text-2xl drop-shadow-[0_0_12px_rgba(248,113,113,0.55)]">
                                        ?
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="h-[22px] flex items-center">
                        <AnimatePresence>
                            {rightState === "failed" && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-[10px] font-mono text-red-400/45 uppercase tracking-widest"
                                >
                                    {t("ngram.widgets.generalizationFailure.neverSeenNoPrediction")}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>

            {/* Explanation */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 3.2 }}
                className="text-xs text-white/25 text-center leading-relaxed max-w-sm mx-auto"
            >
                {t("ngram.widgets.generalizationFailure.explanation")}
            </motion.p>
        </div>
    );
}
