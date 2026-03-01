"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

import { FadeInView } from "@/components/lab/FadeInView";

interface ThinkFirstProps {
    question: string;
    reveal: string;
}

export function ThinkFirst({ question, reveal }: ThinkFirstProps) {
    const [isRevealed, setIsRevealed] = useState(false);

    return (
        <FadeInView margin="-40px" className="my-8 rounded-xl border-2 border-dashed border-violet-500/30 bg-violet-950/10 p-5">
            <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono font-bold uppercase tracking-widest text-violet-400/70 mb-2">
                        Think First
                    </p>
                    <p className="text-sm text-white/70 leading-relaxed mb-3">
                        {question}
                    </p>
                    <button
                        onClick={() => setIsRevealed(!isRevealed)}
                        className="flex items-center gap-2 text-xs font-mono text-violet-300/80 hover:text-violet-300 transition-colors"
                        aria-expanded={isRevealed}
                        aria-label={isRevealed ? "Hide answer" : "Reveal answer"}
                    >
                        <motion.div
                            animate={{ rotate: isRevealed ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDown className="w-3.5 h-3.5" />
                        </motion.div>
                        {isRevealed ? "Hide answer" : "Reveal answer"}
                    </button>
                    <AnimatePresence>
                        {isRevealed && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-3 pt-3 border-t border-violet-500/20">
                                    <p className="text-sm text-emerald-300/80 leading-relaxed">
                                        {reveal}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </FadeInView>
    );
}
