"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { RotateCcw } from "lucide-react";

import { useI18n } from "@/i18n/context";

const STEPS = [
    { n: 1, formatted: "96", label: "N=1", size: 3.2 },
    { n: 2, formatted: "9,216", label: "N=2", size: 3.8 },
    { n: 3, formatted: "884,736", label: "N=3", size: 4.4 },
    { n: 4, formatted: "84,934,656", label: "N=4", size: 4.9 },
    { n: 5, formatted: "8,153,726,976", label: "N=5", size: 5.2 },
];

export const ExponentialGrowthAnimator = memo(function ExponentialGrowthAnimator() {
    const { t } = useI18n();
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasPlayed, setHasPlayed] = useState(false);

    const start = useCallback(() => {
        setCurrentStep(0);
        setIsPlaying(true);
        setHasPlayed(true);
    }, []);

    useEffect(() => {
        if (isInView && !hasPlayed) start();
    }, [isInView, hasPlayed, start]);

    useEffect(() => {
        if (!isPlaying) return;
        if (currentStep >= STEPS.length - 1) {
            setIsPlaying(false);
            return;
        }
        const timer = setTimeout(() => setCurrentStep(s => s + 1), 1500);
        return () => clearTimeout(timer);
    }, [isPlaying, currentStep]);

    const step = STEPS[currentStep];
    const isLast = currentStep === STEPS.length - 1;

    return (
        <div ref={ref} className="flex flex-col items-center gap-8 py-10 px-4">
            {/* Number display */}
            <div className="relative min-h-[100px] flex flex-col items-center justify-center w-full overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: -28, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 28, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 22 }}
                        className="flex flex-col items-center gap-1"
                    >
                        <span
                            className={`font-mono font-black tracking-tight leading-none transition-colors ${isLast
                                ? "text-red-400 drop-shadow-[0_0_28px_rgba(248,113,113,0.65)]"
                                : "text-amber-300"
                                }`}
                            style={{ fontSize: `${step.size}rem` }}
                        >
                            {step.formatted}
                        </span>
                        <span className="text-[11px] font-mono text-white/25 uppercase tracking-widest">
                            {t("ngramNarrative.exponentialGrowth.possibleContexts")}
                        </span>
                        {isLast && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-[10px] font-mono text-red-400/50 mt-1 uppercase tracking-widest"
                            >
                                {t("ngramNarrative.exponentialGrowth.neverSeen")}
                            </motion.span>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Step indicators */}
            <div className="flex items-center">
                {STEPS.map((s, i) => (
                    <div key={i} className="flex items-center">
                        <div className="flex flex-col items-center gap-1.5">
                            <motion.div
                                animate={{
                                    backgroundColor: i === currentStep
                                        ? "#fbbf24"
                                        : i < currentStep
                                            ? "#78350f"
                                            : "rgba(255,255,255,0.08)",
                                    scale: i === currentStep ? 1.3 : 1,
                                }}
                                transition={{ duration: 0.3 }}
                                className="w-2.5 h-2.5 rounded-full"
                            />
                            <span className={`text-[9px] font-mono ${i <= currentStep ? "text-amber-400/60" : "text-white/15"
                                }`}>
                                {s.label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className="relative w-10 h-px bg-white/[0.06] mx-1 mb-4">
                                <motion.div
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: i < currentStep ? 1 : 0 }}
                                    style={{ transformOrigin: "left" }}
                                    transition={{ duration: 0.4 }}
                                    className="absolute inset-0 bg-amber-500/40"
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* ×96 label */}
            <AnimatePresence>
                {currentStep > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[11px] text-white/25 font-mono"
                    >
                        {t("ngramNarrative.exponentialGrowth.multiply")}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Replay */}
            <AnimatePresence>
                {!isPlaying && hasPlayed && (
                    <motion.button
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        onClick={start}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white/35 hover:text-white/60 text-xs font-mono transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" />
                        {t("ngramNarrative.exponentialGrowth.replay")}
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
});
