"use client";

import { useMemo } from "react";

import { motion } from "framer-motion";
import { Check, Eye, Shuffle, MapPin, Zap } from "lucide-react";

/*
  WishlistCallbackViz — v2
  Premium architecture wishlist with individual icons per item,
  gradient accents, rich progress tracking, and dramatic solved states.
*/

interface WishlistItem {
    id: number;
    title: string;
    description: string;
    icon: React.ElementType;
    unsolvedColor: { border: string; bg: string; text: string; iconColor: string };
}

const WISHLIST_ITEMS: WishlistItem[] = [
    {
        id: 1,
        title: "Let every word see every other word",
        description: "Break the isolation walls — each word should access all other words in the sequence.",
        icon: Eye,
        unsolvedColor: { border: "border-cyan-500/20", bg: "bg-cyan-500/[0.05]", text: "text-cyan-300/70", iconColor: "text-cyan-400/50" },
    },
    {
        id: 2,
        title: "Decide dynamically which words matter",
        description: "Different contexts need different connections — not a fixed pattern but a learned one.",
        icon: Shuffle,
        unsolvedColor: { border: "border-violet-500/20", bg: "bg-violet-500/[0.05]", text: "text-violet-300/70", iconColor: "text-violet-400/50" },
    },
    {
        id: 3,
        title: "Know the order of words",
        description: '"dog bites man" \u2260 "man bites dog" \u2014 position must carry meaning.',
        icon: MapPin,
        unsolvedColor: { border: "border-amber-500/20", bg: "bg-amber-500/[0.05]", text: "text-amber-300/70", iconColor: "text-amber-400/50" },
    },
    {
        id: 4,
        title: "Do all of this in parallel",
        description: "Process the entire sequence at once \u2014 not one token at a time like RNNs.",
        icon: Zap,
        unsolvedColor: { border: "border-rose-500/20", bg: "bg-rose-500/[0.05]", text: "text-rose-300/70", iconColor: "text-rose-400/50" },
    },
];

const SOLVED_SECTIONS: Record<number, string> = {
    1: "\u00a703",
    2: "\u00a704",
    3: "\u00a706",
    4: "\u00a707",
};

interface WishlistCallbackVizProps {
    solvedItems?: number[];
}

export function WishlistCallbackViz({ solvedItems = [] }: WishlistCallbackVizProps) {
    const solvedSet = useMemo(() => new Set(solvedItems), [solvedItems]);
    const solvedCount = solvedSet.size;
    const total = WISHLIST_ITEMS.length;
    const progress = solvedCount / total;

    return (
        <div className="py-8 sm:py-12">
            <div className="w-full max-w-lg mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-cyan-400/30 mb-1.5">What we need to build</p>
                    <h4 className="text-lg sm:text-xl font-semibold text-white/70 tracking-tight">Architecture Wishlist</h4>
                    {solvedCount > 0 && solvedCount < total && (
                        <p className="text-[11px] text-white/20 mt-1">{solvedCount} of {total} solved</p>
                    )}
                </div>

                {/* Items with timeline */}
                <div className="relative">
                    {/* Vertical connecting line */}
                    <div
                        className="absolute left-[15px] top-2 bottom-2 w-px"
                        style={{ background: "linear-gradient(180deg, rgba(34,211,238,0.12), rgba(251,191,36,0.08), rgba(251,191,36,0.08), rgba(244,63,94,0.12))" }}
                    />

                    <div className="space-y-6">
                        {WISHLIST_ITEMS.map((item, idx) => {
                            const isSolved = solvedSet.has(item.id);
                            const section = SOLVED_SECTIONS[item.id];
                            const Icon = item.icon;

                            return (
                                <motion.div
                                    key={item.id}
                                    className="flex items-start gap-4 relative"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1, duration: 0.5, ease: "easeOut" }}
                                >
                                    {/* Timeline node */}
                                    <div className="shrink-0 relative z-10">
                                        {isSolved ? (
                                            <motion.div
                                                className="flex items-center justify-center w-[30px] h-[30px] rounded-full"
                                                style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.25)" }}
                                                initial={{ scale: 0, rotate: -90 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                            >
                                                <Check className="w-3.5 h-3.5 text-emerald-400/80" />
                                            </motion.div>
                                        ) : (
                                            <div
                                                className="flex items-center justify-center w-[30px] h-[30px] rounded-full"
                                                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                                            >
                                                <Icon className={`w-3.5 h-3.5 ${item.unsolvedColor.iconColor}`} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-start gap-2 flex-wrap">
                                            <span className={`text-sm sm:text-[15px] font-semibold leading-snug ${isSolved ? "text-emerald-300/50 line-through decoration-emerald-400/15" : item.unsolvedColor.text}`}>
                                                {item.title}
                                            </span>
                                            {isSolved && section && (
                                                <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded text-emerald-400/40"
                                                    style={{ background: "rgba(16, 185, 129, 0.06)" }}
                                                >
                                                    {section}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-[12px] mt-1 leading-relaxed ${isSolved ? "text-white/12" : "text-white/25"}`}>
                                            {item.description}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Subtle footer */}
                <p className="text-[11px] text-white/12 text-center mt-8">
                    {solvedCount === 0
                        ? "Each item will check off as you discover the solution"
                        : solvedCount < total
                            ? `${total - solvedCount} remaining`
                            : "Every problem solved. The transformer is complete."}
                </p>
            </div>
        </div>
    );
}
