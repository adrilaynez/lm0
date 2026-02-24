"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/i18n/context";

interface ChallengeProps {
    question: string;
    hint?: string;
    successMessage: string;
    checkFn?: () => boolean;
    children?: React.ReactNode;
    onSuccess?: () => void;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    angle: number;
}

function SuccessParticles() {
    const particles: Particle[] = Array.from({ length: 4 }, (_, i) => ({
        id: i,
        x: 50 + Math.cos((i / 4) * Math.PI * 2) * 40,
        y: 50 + Math.sin((i / 4) * Math.PI * 2) * 40,
        angle: (i / 4) * 360,
    }));

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute w-2 h-2 rounded-full bg-amber-400"
                    style={{ left: "50%", top: "50%" }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{
                        x: Math.cos((p.angle * Math.PI) / 180) * 60,
                        y: Math.sin((p.angle * Math.PI) / 180) * 60,
                        opacity: 0,
                        scale: 0,
                    }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                />
            ))}
        </div>
    );
}

export function Challenge({
    question,
    hint,
    successMessage,
    checkFn,
    children,
    onSuccess,
}: ChallengeProps) {
    const { t } = useI18n();
    const [succeeded, setSucceeded] = useState(false);
    const [skipped, setSkipped] = useState(false);
    const [showParticles, setShowParticles] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [shakeKey, setShakeKey] = useState(0);

    useEffect(() => {
        if (succeeded) {
            setShowParticles(true);
            const timer = setTimeout(() => setShowParticles(false), 800);
            return () => clearTimeout(timer);
        }
    }, [succeeded]);

    function handleCheck() {
        if (checkFn) {
            const ok = checkFn();
            if (ok) {
                setSucceeded(true);
                onSuccess?.();
            } else {
                setShakeKey((k) => k + 1);
            }
        } else {
            setSucceeded(true);
            onSuccess?.();
        }
    }

    if (skipped) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45 }}
            className="relative my-8 -mx-2 sm:mx-0"
        >
            <AnimatePresence>
                {showParticles && <SuccessParticles />}
            </AnimatePresence>

            <motion.div
                animate={
                    succeeded
                        ? { borderColor: "rgba(52,211,153,0.4)" }
                        : { borderColor: "rgba(245,158,11,0.4)" }
                }
                transition={{ duration: 0.5 }}
                className="rounded-2xl border-2 border-dashed overflow-hidden bg-[var(--lab-viz-bg)]"
                style={{ borderColor: "rgba(245,158,11,0.4)" }}
            >
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.04] to-transparent pointer-events-none" />

                <div className="relative p-5 md:p-6">
                    {/* Badge */}
                    <div className="flex items-center justify-between mb-4">
                        <motion.span
                            animate={succeeded ? { backgroundColor: "rgba(52,211,153,0.15)", color: "rgb(52,211,153)" } : {}}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.18em] bg-amber-500/15 text-amber-400"
                        >
                            {succeeded ? "✓" : "🎯"}{" "}
                            {succeeded
                                ? t("challenge.solvedBadge")
                                : t("challenge.badge")}
                        </motion.span>

                        {hint && !succeeded && (
                            <button
                                onClick={() => setShowHint((h) => !h)}
                                className="text-[11px] text-white/25 hover:text-white/45 transition-colors font-mono"
                            >
                                {showHint ? t("challenge.hideHint") : t("challenge.showHint")}
                            </button>
                        )}
                    </div>

                    {/* Question */}
                    <p className="text-base text-white/70 leading-relaxed mb-4 font-light">
                        {question}
                    </p>

                    {/* Hint */}
                    <AnimatePresence>
                        {showHint && hint && (
                            <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25 }}
                                className="text-[13px] text-amber-400/60 italic mb-4 overflow-hidden"
                            >
                                💡 {hint}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    {/* Interactive children */}
                    {children && (
                        <div className="mb-5">
                            {children}
                        </div>
                    )}

                    {/* Success message */}
                    <AnimatePresence>
                        {succeeded && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className="mb-4 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 px-4 py-3"
                            >
                                <p className="text-sm text-emerald-400 font-medium">
                                    ✓ {successMessage}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer row */}
                    {!succeeded && (
                        <div className="flex items-center justify-between gap-3">
                            <motion.button
                                key={shakeKey}
                                onClick={handleCheck}
                                whileTap={{ scale: 0.96 }}
                                animate={
                                    shakeKey > 0
                                        ? { x: [0, -6, 6, -4, 4, 0] }
                                        : { x: 0 }
                                }
                                transition={{ duration: 0.35 }}
                                className="px-5 py-2 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 transition-all"
                            >
                                {t("challenge.checkButton")}
                            </motion.button>

                            <button
                                onClick={() => setSkipped(true)}
                                className="text-[11px] text-white/20 hover:text-white/40 transition-colors"
                            >
                                {t("challenge.skip")} →
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
