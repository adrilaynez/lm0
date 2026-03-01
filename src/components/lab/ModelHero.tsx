"use client";

import { memo } from "react";

import { motion } from "framer-motion";
import { ArrowDown, type LucideIcon } from "lucide-react";

import { ModeToggle } from "@/components/lab/ModeToggle";
import { useI18n } from "@/i18n/context";

export interface StatItem {
    label: string;
    value: string;
    icon: LucideIcon;
    desc: string;
    color: string;
}

interface ModelHeroProps {
    title?: string;
    description?: string;
    showExplanationCta?: boolean;
    customStats?: StatItem[];
}

export const ModelHero = memo(function ModelHero({
    title,
    description,
    customStats,
}: ModelHeroProps) {
    const { t } = useI18n();

    const displayTitle = title ?? t("models.bigram.title");
    const displayDesc = description ?? t("models.bigram.description");

    return (
        <section className="relative pt-16 pb-24 md:pt-28 md:pb-36 overflow-hidden">

            {/* ── Background (static, GPU-friendly) ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[100px]" />
                <div className="absolute top-[20%] right-[5%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[80px]" />
                <div className="absolute bottom-0 left-1/2 w-[400px] h-[300px] rounded-full bg-blue-500/10 blur-[60px]" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">

                {/* ── Eyebrow badge ── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex justify-center mb-8"
                >
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/[0.07] text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-indigo-300/70">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        {t("models.bigram.hero.scientificInstrument")}
                    </span>
                </motion.div>

                {/* ── Title ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                >
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
                        <span className="text-white">{displayTitle.split(" ")[0]} </span>
                        <span className="bg-gradient-to-r from-indigo-400 via-blue-300 to-violet-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(99,102,241,0.35)]">
                            {displayTitle.split(" ").slice(1).join(" ")}
                        </span>
                    </h1>
                </motion.div>

                {/* ── Description ── */}
                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="text-base md:text-lg text-white/40 max-w-2xl mx-auto leading-relaxed font-light mb-10"
                >
                    {displayDesc}
                </motion.p>

                {/* ── Custom Stats (if provided) ── */}
                {customStats && customStats.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16"
                    >
                        {customStats.map((stat, i) => (
                            <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col items-center gap-2">
                                <stat.icon className={`w-5 h-5 text-${stat.color}-400 mb-1`} />
                                <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
                                <div className="text-[10px] uppercase tracking-wider text-white/40 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* ── Mode Toggle ── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                    className="flex justify-center mb-16"
                >
                    <ModeToggle />
                </motion.div>

                {/* ── Scroll cue ── */}
                <div className="text-white/10 flex justify-center animate-bounce">
                    <ArrowDown className="w-5 h-5" />
                </div>

            </div>
        </section>
    );
});
