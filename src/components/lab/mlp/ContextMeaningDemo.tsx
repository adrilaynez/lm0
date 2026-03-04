"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  ContextMeaningDemo
  Shows that "bank" gets IDENTICAL embeddings regardless of context.
  Two contexts: "river bank" vs "money bank".
  The MLP gives the same embedding vector in both — no way to adjust meaning.
  ~120 lines
*/

const CONTEXTS = [
    {
        id: "river",
        label: "river bank",
        before: ["r", "i", "v", "e", "r", " "],
        target: ["b", "a", "n", "k"],
        color: "#22c55e",
        meaning: "edge of a river",
    },
    {
        id: "money",
        label: "money bank",
        before: ["m", "o", "n", "e", "y", " "],
        target: ["b", "a", "n", "k"],
        color: "#f59e0b",
        meaning: "financial institution",
    },
];

// Fake embedding vector (same for both contexts — that's the point)
const EMBEDDING = [0.42, -0.18, 0.73, -0.55, 0.31, -0.09, 0.64, -0.37];

export function ContextMeaningDemo() {
    const [hoveredCtx, setHoveredCtx] = useState<string | null>(null);

    return (
        <div className="p-4 sm:p-5 space-y-5">
            {/* Two context rows */}
            <div className="space-y-3">
                {CONTEXTS.map((ctx) => {
                    const isHovered = hoveredCtx === ctx.id;
                    return (
                        <motion.div
                            key={ctx.id}
                            className="rounded-xl border p-3 transition-colors cursor-default"
                            style={{
                                borderColor: isHovered ? `${ctx.color}40` : "rgba(255,255,255,0.06)",
                                backgroundColor: isHovered ? `${ctx.color}08` : "rgba(255,255,255,0.015)",
                            }}
                            onMouseEnter={() => setHoveredCtx(ctx.id)}
                            onMouseLeave={() => setHoveredCtx(null)}
                        >
                            <div className="flex items-center gap-1 flex-wrap">
                                {/* Context chars (dimmed) */}
                                {ctx.before.map((c, i) => (
                                    <span key={`b-${i}`} className="w-6 h-7 flex items-center justify-center rounded text-[10px] font-mono text-white/20 bg-white/[0.02] border border-white/[0.04]">
                                        {c === " " ? "␣" : c}
                                    </span>
                                ))}
                                {/* Target chars (highlighted identically) */}
                                {ctx.target.map((c, i) => (
                                    <motion.span
                                        key={`t-${i}`}
                                        className="w-6 h-7 flex items-center justify-center rounded text-[10px] font-mono font-bold border"
                                        animate={{
                                            backgroundColor: "rgba(139,92,246,0.15)",
                                            borderColor: "rgba(139,92,246,0.3)",
                                            color: "#c4b5fd",
                                        }}
                                    >
                                        {c}
                                    </motion.span>
                                ))}
                                {/* Meaning label */}
                                <span className="ml-3 text-[9px] font-mono" style={{ color: `${ctx.color}99` }}>
                                    = &ldquo;{ctx.meaning}&rdquo;
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Embedding vector — SAME for both */}
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.03] p-3 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-violet-400">Embedding for &ldquo;b&rdquo;, &ldquo;a&rdquo;, &ldquo;n&rdquo;, &ldquo;k&rdquo;</span>
                    <span className="text-[8px] font-mono text-amber-400/60 bg-amber-500/10 px-2 py-0.5 rounded">IDENTICAL in both contexts</span>
                </div>
                <div className="flex gap-1 flex-wrap">
                    {EMBEDDING.map((v, i) => (
                        <motion.div
                            key={i}
                            className="w-10 h-7 flex items-center justify-center rounded text-[9px] font-mono text-violet-400/70 bg-violet-500/10 border border-violet-500/15"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            {v.toFixed(2)}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Verdict */}
            <p className="text-center text-[10px] font-mono text-amber-400/50">
                Same characters → same embeddings. The MLP has no mechanism to adjust meaning based on context.
            </p>
        </div>
    );
}
