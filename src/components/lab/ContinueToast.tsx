"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X } from "lucide-react";
import { useProgressTracker } from "@/hooks/useProgressTracker";

interface ContinueToastProps {
    pageId: string;
    /** Human-readable section names keyed by section id */
    sectionNames: Record<string, string>;
    accent?: "rose" | "emerald" | "amber" | "violet";
}

const AUTO_DISMISS_MS = 10_000;

const ACCENT = {
    rose:    { border: "border-rose-500/25",    bg: "bg-rose-500/[0.08]",    icon: "text-rose-400",    btn: "bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/25 text-rose-300" },
    emerald: { border: "border-emerald-500/25", bg: "bg-emerald-500/[0.08]", icon: "text-emerald-400", btn: "bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/25 text-emerald-300" },
    amber:   { border: "border-amber-500/25",   bg: "bg-amber-500/[0.08]",   icon: "text-amber-400",   btn: "bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/25 text-amber-300" },
    violet:  { border: "border-violet-500/25",  bg: "bg-violet-500/[0.08]",  icon: "text-violet-400",  btn: "bg-violet-500/15 hover:bg-violet-500/25 border-violet-500/25 text-violet-300" },
};

export function ContinueToast({ pageId, sectionNames, accent = "rose" }: ContinueToastProps) {
    const { hasStoredProgress, storedSection, clearProgress } = useProgressTracker(pageId);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (hasStoredProgress && storedSection) {
            setVisible(true);
            const timer = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
            return () => clearTimeout(timer);
        }
    }, [hasStoredProgress, storedSection]);

    const handleContinue = useCallback(() => {
        setVisible(false);
        const el = document.getElementById(storedSection);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [storedSection]);

    const handleStartFresh = useCallback(() => {
        setVisible(false);
        clearProgress();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [clearProgress]);

    const sectionNumber = storedSection.replace(/[a-z]+-/, "").replace(/^0+/, "") || storedSection;
    const sectionName = sectionNames[storedSection];
    const a = ACCENT[accent];

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.97 }}
                    transition={{ duration: 0.25 }}
                    className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-3.5 rounded-2xl border ${a.border} ${a.bg} backdrop-blur-sm shadow-xl max-w-sm w-full mx-4`}
                >
                    <BookOpen className={`shrink-0 w-4 h-4 ${a.icon}`} />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/70 font-medium leading-snug">
                            Continue from §{sectionNumber}
                            {sectionName ? ` — ${sectionName}` : ""}?
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={handleContinue}
                            className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-colors ${a.btn}`}
                        >
                            Continue
                        </button>
                        <button
                            onClick={handleStartFresh}
                            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-bold uppercase tracking-wider text-white/40 transition-colors"
                        >
                            Fresh
                        </button>
                        <button
                            onClick={() => setVisible(false)}
                            className="text-white/20 hover:text-white/40 transition-colors"
                            aria-label="Dismiss"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
