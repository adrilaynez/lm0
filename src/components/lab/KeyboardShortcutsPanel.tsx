"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";

interface KeyboardShortcutsPanelProps {
    open: boolean;
    onClose: () => void;
}

const SHORTCUTS = [
    { keys: ["?"], description: "Show keyboard shortcuts" },
    { keys: ["←"], description: "Previous section" },
    { keys: ["→"], description: "Next section" },
    { keys: ["Esc"], description: "Close panel / modal" },
];

export function KeyboardShortcutsPanel({ open, onClose }: KeyboardShortcutsPanelProps) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[70] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

                    {/* Panel */}
                    <motion.div
                        className="relative w-full max-w-sm rounded-2xl border border-[var(--lab-border)] bg-[var(--lab-bg)] shadow-2xl overflow-hidden"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--lab-border)]">
                            <div className="flex items-center gap-2">
                                <Keyboard className="w-4 h-4 text-[var(--lab-text-muted)]" />
                                <span className="text-sm font-semibold text-[var(--lab-text)]">Keyboard Shortcuts</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 rounded-lg hover:bg-[var(--lab-card)] text-[var(--lab-text-muted)] transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Shortcuts list */}
                        <div className="px-5 py-4 space-y-3">
                            {SHORTCUTS.map((s) => (
                                <div key={s.description} className="flex items-center justify-between">
                                    <span className="text-sm text-[var(--lab-text-muted)]">{s.description}</span>
                                    <div className="flex gap-1">
                                        {s.keys.map((k) => (
                                            <kbd
                                                key={k}
                                                className="px-2 py-1 rounded-md bg-[var(--lab-card)] border border-[var(--lab-border)] text-[11px] font-mono text-[var(--lab-text-subtle)]"
                                            >
                                                {k}
                                            </kbd>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
