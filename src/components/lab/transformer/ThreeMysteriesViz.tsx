"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  ThreeMysteriesViz — §10

  Three exciting doors to the next chapter, displayed as a premium
  2+1 grid (two cards top, one centered below). Glass-morphism cards,
  centered content, micro-visuals, click-to-reveal detail.

  Celebration tone. NOT problems — exciting frontiers.
*/

/* ── Door data ── */
interface Door {
    id: string;
    title: string;
    teaser: string;
    detail: string;
    topic: string;
    color: string;
    rgb: string;
}

const DOORS: Door[] = [
    {
        id: "tokenization",
        title: "How Real Models Read",
        teaser: "Characters are too small. Words are too big. What\u2019s in between?",
        detail: "Subword tokens. \u201Cstrawberry\u201D becomes [straw][berry]. This is how GPT reads every language on Earth \u2014 including code and emoji.",
        topic: "Tokenization",
        color: "#fbbf24",
        rgb: "251,191,36",
    },
    {
        id: "finetuning",
        title: "How It Learns to Help",
        teaser: "It only predicts the next word. How does it answer your questions?",
        detail: "Instruction tuning and RLHF teach the model that after a question, it should answer \u2014 not continue. This is how ChatGPT was born.",
        topic: "Fine-tuning & RLHF",
        color: "#22d3ee",
        rgb: "34,211,238",
    },
    {
        id: "thinking",
        title: "How It Learned to Think",
        teaser: "It doesn\u2019t reason. It doesn\u2019t plan. Or does it?",
        detail: "Chain of Thought lets models \u201Cthink out loud\u201D \u2014 generating reasoning tokens that feed back into context. Give them tools? That\u2019s an AI agent.",
        topic: "Chain of Thought & Agents",
        color: "#a78bfa",
        rgb: "167,139,250",
    },
];

/* ── Single glass card ── */
function GlassCard({ door, isActive, onToggle, index }: {
    door: Door;
    isActive: boolean;
    onToggle: () => void;
    index: number;
}) {
    return (
        <motion.div
            className="cursor-pointer select-none w-full"
            onClick={onToggle}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.12, duration: 0.45, ease: "easeOut" }}
        >
            <div
                className="rounded-2xl px-6 py-7 flex flex-col items-center text-center transition-all duration-300 h-full"
                style={{
                    background: isActive
                        ? `rgba(${door.rgb},0.05)`
                        : "rgba(255,255,255,0.015)",
                    border: isActive
                        ? `1.5px solid rgba(${door.rgb},0.2)`
                        : "1.5px solid rgba(255,255,255,0.04)",
                    boxShadow: isActive
                        ? `0 0 40px -12px rgba(${door.rgb},0.12), inset 0 1px 0 rgba(${door.rgb},0.06)`
                        : "inset 0 1px 0 rgba(255,255,255,0.02)",
                }}
            >
                {/* Animated accent dot */}
                <motion.div
                    className="w-2 h-2 rounded-full mb-5"
                    style={{ background: `rgba(${door.rgb},${isActive ? 0.5 : 0.15})` }}
                    animate={isActive ? {
                        boxShadow: [
                            `0 0 0px rgba(${door.rgb},0)`,
                            `0 0 12px rgba(${door.rgb},0.3)`,
                            `0 0 0px rgba(${door.rgb},0)`,
                        ],
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Title */}
                <h4 className="text-[14px] font-bold leading-snug transition-colors duration-200"
                    style={{ color: isActive ? door.color : "rgba(255,255,255,0.35)" }}>
                    {door.title}
                </h4>

                {/* Teaser */}
                <p className="text-[11px] text-white/20 mt-2 leading-relaxed max-w-[200px]">
                    {door.teaser}
                </p>

                {/* Topic tag */}
                <span className="inline-block text-[9px] font-mono mt-4 px-2.5 py-1 rounded-full transition-all duration-200"
                    style={{
                        background: `rgba(${door.rgb},${isActive ? 0.08 : 0.03})`,
                        color: `rgba(${door.rgb},${isActive ? 0.5 : 0.2})`,
                        border: `1px solid rgba(${door.rgb},${isActive ? 0.15 : 0.05})`,
                    }}>
                    {"\u2192"} {door.topic}
                </span>

                {/* Expanded detail */}
                <AnimatePresence>
                    {isActive && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="overflow-hidden"
                        >
                            <p className="text-[11px] text-white/30 leading-relaxed mt-4 pt-4 max-w-[220px]"
                                style={{ borderTop: `1px solid rgba(${door.rgb},0.08)` }}>
                                {door.detail}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

export function ThreeMysteriesViz() {
    const [active, setActive] = useState<string | null>(null);

    const toggle = (id: string) => setActive(prev => prev === id ? null : id);

    return (
        <div className="w-full max-w-xl mx-auto py-4 px-2">
            {/* ── 2+1 grid ── */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {DOORS.slice(0, 2).map((door, i) => (
                    <GlassCard
                        key={door.id}
                        door={door}
                        isActive={active === door.id}
                        onToggle={() => toggle(door.id)}
                        index={i}
                    />
                ))}
            </div>

            {/* Third card centered below */}
            <div className="flex justify-center mt-3 sm:mt-4">
                <div className="w-full max-w-[calc(50%-6px)] sm:max-w-[calc(50%-8px)]">
                    <GlassCard
                        door={DOORS[2]}
                        isActive={active === DOORS[2].id}
                        onToggle={() => toggle(DOORS[2].id)}
                        index={2}
                    />
                </div>
            </div>

            {/* ── Bottom teaser ── */}
            <motion.p
                className="text-center text-[10px] text-white/10 mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
            >
                Three doors. All waiting in the next chapter.
            </motion.p>
        </div>
    );
}
