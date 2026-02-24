"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MousePointerClick } from "lucide-react";

interface IdleHintOverlayProps {
    show: boolean;
    message?: string;
    onDismiss: () => void;
}

export function IdleHintOverlay({
    show,
    message = "Try interacting with this visualizer!",
    onDismiss,
}: IdleHintOverlayProps) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    onClick={onDismiss}
                    className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer"
                >
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] rounded-xl" />
                    <div className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--lab-viz-bg)] border border-[var(--lab-border)] shadow-lg">
                        <MousePointerClick className="w-4 h-4 text-emerald-400 animate-pulse" />
                        <span className="text-sm text-white/70">{message}</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
