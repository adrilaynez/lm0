"use client";

import { useState } from "react";

import { AnimatePresence,motion } from "framer-motion";

import { useI18n } from "@/i18n/context";

export function TextToNumbersWidget() {
    const { t } = useI18n();
    const [text, setText] = useState("hello");
    const [hovered, setHovered] = useState<number | null>(null);

    const chars = Array.from(text);

    return (
        <div className="space-y-5">
            {/* Input */}
            <div className="relative">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, 24))}
                    placeholder={t("bigramWidgets.textToNumbers.placeholder")}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/20 font-mono text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/20">
                    {chars.length}/24
                </span>
            </div>

            {/* Cards */}
            <div className="min-h-[96px] flex flex-wrap gap-2">
                <AnimatePresence mode="popLayout">
                    {chars.map((ch, i) => {
                        const code = ch.charCodeAt(0);
                        const isHovered = hovered === i;
                        return (
                            <motion.div
                                key={`${i}-${ch}`}
                                layout
                                initial={{ opacity: 0, y: 12, scale: 0.85 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.75, y: -8 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 380,
                                    damping: 22,
                                    delay: i * 0.03,
                                }}
                                onHoverStart={() => setHovered(i)}
                                onHoverEnd={() => setHovered(null)}
                                className="relative flex flex-col items-center justify-center w-12 h-16 rounded-lg border cursor-default select-none"
                                style={{
                                    background: isHovered
                                        ? "rgba(52,211,153,0.08)"
                                        : "rgba(255,255,255,0.03)",
                                    borderColor: isHovered
                                        ? "rgba(52,211,153,0.35)"
                                        : "rgba(255,255,255,0.08)",
                                    transition: "background 0.15s, border-color 0.15s",
                                }}
                            >
                                {/* Character */}
                                <motion.span
                                    animate={isHovered ? { scale: 1.2 } : { scale: 1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 18 }}
                                    className="text-base font-mono font-semibold text-white leading-none mb-1"
                                >
                                    {ch === " " ? "·" : ch}
                                </motion.span>

                                {/* Code */}
                                <span className="text-[10px] font-mono text-emerald-400/80 leading-none">
                                    {code}
                                </span>

                                {/* Tooltip */}
                                <AnimatePresence>
                                    {isHovered && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 4 }}
                                            transition={{ duration: 0.12 }}
                                            className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded-md bg-black/80 border border-white/10 text-[10px] font-mono text-white/70 pointer-events-none z-10"
                                        >
                                            {t("bigramWidgets.textToNumbers.tooltip")} {code}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}

                    {chars.length === 0 && (
                        <motion.p
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-xs font-mono text-white/20 self-center"
                        >
                            {t("bigramWidgets.textToNumbers.empty")}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
