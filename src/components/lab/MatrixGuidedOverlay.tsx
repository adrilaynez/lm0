"use client";

import { useEffect, useState } from "react";

import { AnimatePresence,motion } from "framer-motion";

import { useI18n } from "@/i18n/context";

export function MatrixGuidedOverlay() {
    const { t } = useI18n();
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => setVisible(false), 6000);
        return () => clearTimeout(t);
    }, []);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    onClick={() => setVisible(false)}
                    className="relative mb-4 cursor-pointer"
                    title={t("bigramWidgets.matrixOverlay.dismiss")}
                >
                    {/* Glowing row highlight bar */}
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-400/30 bg-emerald-400/[0.06] shadow-[0_0_24px_0_rgba(52,211,153,0.12)]">
                        {/* Row label */}
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-400/20 border border-emerald-400/40 font-mono text-sm font-bold text-emerald-300 shrink-0">
                            t
                        </div>

                        {/* Annotation */}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-mono text-emerald-300/90 leading-snug">
                                {t("bigramWidgets.matrixOverlay.after")}{" "}
                                <span className="font-bold">&lsquo;t&rsquo;</span>, {t("bigramWidgets.matrixOverlay.mostCommon")}{" "}
                                <span className="font-bold text-emerald-400">&lsquo;h&rsquo;</span>
                                {" "}{t("bigramWidgets.matrixOverlay.tryHovering")}{" "}
                                <span className="font-bold">&lsquo;t&rsquo;</span> {t("bigramWidgets.matrixOverlay.inMatrix")}
                            </p>
                        </div>

                        {/* Arrow */}
                        <motion.div
                            animate={{ y: [0, 4, 0] }}
                            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                            className="text-emerald-400/60 text-lg shrink-0 select-none"
                        >
                            ↓
                        </motion.div>
                    </div>

                    {/* Dismiss hint */}
                    <p className="text-center text-[9px] font-mono text-white/15 mt-1.5">
                        {t("bigramWidgets.matrixOverlay.clickToDismiss")}
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
