"use client";

import { useRef, useState } from "react";

import { AnimatePresence, motion, useInView } from "framer-motion";

import { useI18n } from "@/i18n/context";

const NODE_STYLES = [
    { dot: "bg-emerald-400", shadow: "shadow-emerald-500/30", ring: "ring-emerald-500/20", text: "text-emerald-300", muted: "text-emerald-400/50", pulse: false },
    { dot: "bg-amber-400", shadow: "shadow-amber-500/30", ring: "ring-amber-500/20", text: "text-amber-300", muted: "text-amber-400/50", pulse: false },
    { dot: "bg-rose-400", shadow: "shadow-rose-500/50", ring: "ring-rose-500/25", text: "text-rose-300", muted: "text-rose-400/50", pulse: true },
];

export function StatisticalEraTimeline() {
    const { t } = useI18n();
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-80px" });
    const [hovered, setHovered] = useState<number | null>(null);

    const NODES = [
        { ...NODE_STYLES[0], label: t("ngramNarrative.statisticalEra.bigramLabel"), sublabel: t("ngramNarrative.statisticalEra.bigramSublabel"), era: t("ngramNarrative.statisticalEra.bigramEra"), summary: t("ngramNarrative.statisticalEra.bigramSummary") },
        { ...NODE_STYLES[1], label: t("ngramNarrative.statisticalEra.ngramLabel"), sublabel: t("ngramNarrative.statisticalEra.ngramSublabel"), era: t("ngramNarrative.statisticalEra.ngramEra"), summary: t("ngramNarrative.statisticalEra.ngramSummary") },
        { ...NODE_STYLES[2], label: t("ngramNarrative.statisticalEra.unknownLabel"), sublabel: t("ngramNarrative.statisticalEra.unknownSublabel"), era: t("ngramNarrative.statisticalEra.unknownEra"), summary: t("ngramNarrative.statisticalEra.unknownSummary") },
    ];

    return (
        <div ref={ref} className="px-6 py-10 flex flex-col items-center gap-10">

            {/* Timeline row */}
            <div className="relative w-full max-w-lg flex items-start justify-between">

                {/* Track line */}
                <div className="absolute left-[10%] right-[10%] top-[10px] h-px bg-white/[0.06]">
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={isInView ? { scaleX: 1 } : {}}
                        transition={{ duration: 1.4, ease: "easeOut", delay: 0.4 }}
                        style={{ transformOrigin: "left" }}
                        className="h-full bg-gradient-to-r from-emerald-500/50 via-amber-500/50 to-rose-500/50"
                    />
                </div>

                {NODES.map((node, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.3 + i * 0.28, duration: 0.4 }}
                        className="relative flex flex-col items-center gap-3 z-10 cursor-default select-none w-[30%]"
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                    >
                        {/* Dot */}
                        <div className={`relative w-5 h-5 rounded-full ${node.dot} ring-2 ${node.ring} shadow-lg ${node.shadow} ${node.pulse ? "animate-pulse" : ""}`}>
                            {hovered === i && (
                                <motion.div
                                    layoutId="hoverRing"
                                    className={`absolute -inset-2 rounded-full ring-2 ${node.ring}`}
                                    initial={{ opacity: 0, scale: 0.7 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                />
                            )}
                        </div>

                        {/* Label */}
                        <div className="flex flex-col items-center gap-0.5 text-center">
                            <span className={`text-sm font-black font-mono ${node.text}`}>
                                {node.label}
                            </span>
                            <span className={`text-[9px] font-mono ${node.muted} leading-tight text-center`}>
                                {node.sublabel}
                            </span>
                            <span className="text-[9px] text-white/15 font-mono mt-0.5">
                                {node.era}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Tooltip area */}
            <div className="min-h-[44px] flex items-center justify-center w-full max-w-sm">
                <AnimatePresence mode="wait">
                    {hovered !== null ? (
                        <motion.p
                            key={hovered}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.18 }}
                            className={`text-sm text-center leading-relaxed ${NODES[hovered].text}`}
                        >
                            {NODES[hovered].summary}
                        </motion.p>
                    ) : (
                        <motion.p
                            key="hint"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-[11px] text-white/15 text-center font-mono"
                        >
                            {t("ngramNarrative.statisticalEra.hoverHint")}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
