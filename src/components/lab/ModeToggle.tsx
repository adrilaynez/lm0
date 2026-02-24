"use client";

import { useLabMode } from "@/context/LabModeContext";
import { BookOpen, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/context";

export function ModeToggle() {
    const { mode, setMode, isInitialized } = useLabMode();
    const { t } = useI18n();

    if (!isInitialized) {
        return (
            <div className="flex items-center p-1 bg-[var(--lab-card)] border border-[var(--lab-border)] rounded-lg w-[80px] lg:w-[172px] h-[34px] animate-pulse" />
        );
    }

    return (
        <div className="flex items-center p-1 bg-[var(--lab-card)] border border-[var(--lab-border)] rounded-lg">
            <button
                onClick={() => setMode('educational')}
                className={cn(
                    "relative flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all",
                    mode === 'educational' ? "text-emerald-400" : "text-[var(--lab-text-subtle)] hover:text-[var(--lab-text-muted)]"
                )}
            >
                <BookOpen className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">{t("lab.mode.educational")}</span>
                {mode === 'educational' && (
                    <motion.div
                        layoutId="activeMode"
                        className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/20 rounded-md -z-10"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                )}
            </button>
            <button
                onClick={() => setMode('free')}
                className={cn(
                    "relative flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all",
                    mode === 'free' ? "text-blue-400" : "text-[var(--lab-text-subtle)] hover:text-[var(--lab-text-muted)]"
                )}
            >
                <FlaskConical className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">{t("lab.mode.freeLab")}</span>
                {mode === 'free' && (
                    <motion.div
                        layoutId="activeMode"
                        className="absolute inset-0 bg-blue-500/10 border border-blue-500/20 rounded-md -z-10"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                )}
            </button>
        </div>
    );
}
