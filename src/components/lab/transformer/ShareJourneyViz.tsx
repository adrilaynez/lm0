"use client";

import { motion } from "framer-motion";

/*
  ShareJourneyViz — §10

  A premium, screenshotable achievement card celebrating the reader's
  journey through the Transformer chapter. Dark glass card with
  gradient border, stats, and journey path.

  Designed to look great when screenshotted on any device.
*/

/* ── Journey milestones ── */
const MILESTONES = [
    { label: "Bigram", color: "#34d399" },
    { label: "N-gram", color: "#f59e0b" },
    { label: "MLP", color: "#a78bfa" },
    { label: "Transformer", color: "#22d3ee" },
];

const STATS = [
    { value: "10", label: "sections" },
    { value: "63", label: "visualizers" },
    { value: "5", label: "architectures" },
];

export function ShareJourneyViz() {
    return (
        <div className="w-full max-w-md mx-auto py-4 px-2">
            <motion.div
                className="relative rounded-2xl overflow-hidden"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                {/* Gradient border effect */}
                <div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                        background: "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(251,191,36,0.15), rgba(167,139,250,0.15))",
                        padding: "1.5px",
                    }}
                >
                    <div className="w-full h-full rounded-2xl bg-[#0a0a0f]" />
                </div>

                {/* Content */}
                <div className="relative z-10 px-7 py-8 sm:px-9 sm:py-10">
                    {/* Subtle top glow */}
                    <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px]"
                        style={{
                            background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.3), transparent)",
                        }}
                    />

                    {/* Main headline */}
                    <motion.h3
                        className="text-[20px] sm:text-[22px] font-bold tracking-tight text-center leading-tight"
                        style={{
                            background: "linear-gradient(135deg, #e2e8f0, #ffffff, #e2e8f0)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        I built a Transformer
                        <br />
                        from scratch.
                    </motion.h3>

                    {/* Subtitle */}
                    <motion.p
                        className="text-[11px] text-white/20 text-center mt-3 leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        I understand how ChatGPT works &mdash; not the metaphor,
                        <br />
                        the actual architecture.
                    </motion.p>

                    {/* Stats row */}
                    <motion.div
                        className="flex items-center justify-center gap-6 mt-7"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        {STATS.map((stat, i) => (
                            <div key={stat.label} className="text-center">
                                <p className="text-[18px] font-bold tabular-nums"
                                    style={{
                                        background: "linear-gradient(135deg, #22d3ee, #fbbf24)",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                    }}>
                                    {stat.value}
                                </p>
                                <p className="text-[9px] text-white/15 font-mono mt-0.5">
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </motion.div>

                    {/* Journey path */}
                    <motion.div
                        className="flex items-center justify-center gap-1.5 mt-7"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                    >
                        {MILESTONES.map((m, i) => (
                            <span key={m.label} className="flex items-center gap-1.5">
                                <span
                                    className="text-[9px] font-mono font-medium"
                                    style={{ color: `${m.color}80` }}
                                >
                                    {m.label}
                                </span>
                                {i < MILESTONES.length - 1 && (
                                    <span className="text-[8px] text-white/10">
                                        {"\u2192"}
                                    </span>
                                )}
                            </span>
                        ))}
                    </motion.div>

                    {/* Divider */}
                    <motion.div
                        className="w-12 h-[1px] mx-auto mt-6"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ delay: 0.8 }}
                    />

                    {/* Screenshot hint */}
                    <motion.p
                        className="text-[9px] text-white/8 text-center mt-4 font-mono"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                    >
                        screenshot &amp; share your journey
                    </motion.p>
                </div>
            </motion.div>
        </div>
    );
}
