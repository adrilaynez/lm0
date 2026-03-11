"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/*
  QKSplitViz — "One embedding, two views"

  Redesign: Premium vertical layout showing how a single embedding
  transforms into Query (what I search for) and Key (what I advertise).

  Clean branching visual. Controlled color palette:
  - Embedding: word's own color (subtle)
  - Query: cyan
  - Key: emerald
  - Feature bars: monochromatic per section

  Apple-quality motion, confident minimalism.
*/

/* ─── Types ─── */
interface WordData {
    word: string;
    color: string;
    embedding: [number, number];
    query: [number, number];
    key: [number, number];
    qLabel: string;
    kLabel: string;
}

/* ─── Data ─── */
const FEATURES = ["royalty", "action"];

const WORDS: WordData[] = [
    {
        word: "king",
        color: "#22d3ee",
        embedding: [0.9, 0.3],
        query: [0.2, 0.9],
        key: [0.95, 0.1],
        qLabel: "Looking for actions & descriptions",
        kLabel: "I'm a powerful person",
    },
    {
        word: "crown",
        color: "#fbbf24",
        embedding: [0.85, 0.1],
        query: [0.8, 0.15],
        key: [0.9, 0.05],
        qLabel: "Looking for who wears me",
        kLabel: "I'm a royal object",
    },
    {
        word: "ruled",
        color: "#34d399",
        embedding: [0.4, 0.9],
        query: [0.85, 0.2],
        key: [0.1, 0.95],
        qLabel: "Looking for who did the ruling",
        kLabel: "I'm an action of power",
    },
    {
        word: "the",
        color: "#a78bfa",
        embedding: [0.05, 0.05],
        query: [0.3, 0.3],
        key: [0.05, 0.05],
        qLabel: "Looking for a noun to attach to",
        kLabel: "I'm just a function word",
    },
    {
        word: "wisely",
        color: "#f472b6",
        embedding: [0.1, 0.7],
        query: [0.15, 0.85],
        key: [0.05, 0.8],
        qLabel: "Looking for what was done wisely",
        kLabel: "I describe how something happened",
    },
];

/* ─── Helpers ─── */
const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1.0];

function FeatureBar({
    label,
    value,
    accentColor,
    delay,
}: {
    label: string;
    value: number;
    accentColor: string;
    delay: number;
}) {
    const isHigh = value >= 0.4;
    return (
        <motion.div
            className="flex items-center gap-2.5"
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: 0.3, ease: EASE }}
        >
            <span
                className="text-[10px] sm:text-[11px] w-14 text-right font-medium shrink-0"
                style={{ color: isHigh ? `${accentColor}` : "rgba(255,255,255,0.35)" }}
            >
                {label}
            </span>
            <div className="flex-1 h-[6px] rounded-full bg-white/[0.05] overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{
                        background: isHigh
                            ? `linear-gradient(90deg, ${accentColor}cc, ${accentColor}55)`
                            : `linear-gradient(90deg, ${accentColor}60, ${accentColor}20)`,
                        boxShadow: isHigh ? `0 0 10px -1px ${accentColor}40` : "none",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(value * 100, 3)}%` }}
                    transition={{ duration: 0.5, delay: delay + 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
            </div>
            <motion.span
                className="text-[9px] sm:text-[10px] font-mono w-6 text-right tabular-nums shrink-0"
                style={{ color: isHigh ? `${accentColor}` : "rgba(255,255,255,0.25)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.2 }}
            >
                {value.toFixed(1)}
            </motion.span>
        </motion.div>
    );
}

/* ─── Insight generator ─── */
function getInsight(w: WordData): React.ReactNode {
    switch (w.word) {
        case "king":
            return (
                <>
                    &ldquo;king&rdquo; has high royalty, but its Query asks
                    for <span className="text-cyan-300/60">actions</span> — it
                    wants verbs.
                </>
            );
        case "ruled":
            return (
                <>
                    &ldquo;ruled&rdquo; is an action word, but its Query asks
                    for <span className="text-cyan-300/60">royalty</span> — who
                    did the ruling?
                </>
            );
        case "the":
            return (
                <>
                    &ldquo;the&rdquo; barely offers anything — its Key is{" "}
                    <span className="text-emerald-300/55">nearly empty</span>.
                </>
            );
        default:
            return (
                <>
                    Notice how &ldquo;{w.word}&rdquo;&apos;s Query and Key
                    emphasize{" "}
                    <span className="text-white/45">different features</span>.
                </>
            );
    }
}

/* ─── Component ─── */
export function QKSplitViz() {
    const [idx, setIdx] = useState(0);
    const w = WORDS[idx];

    return (
        <div
            className="py-6 sm:py-10 px-2 sm:px-4 space-y-6"
            style={{ minHeight: 380 }}
        >
            {/* ── Word selector ── */}
            <div className="flex items-center justify-center gap-5 sm:gap-7">
                {WORDS.map((wd, i) => {
                    const active = i === idx;
                    return (
                        <motion.button
                            key={i}
                            onClick={() => setIdx(i)}
                            className="relative pb-1.5 text-[13px] sm:text-sm font-semibold cursor-pointer"
                            style={{
                                color: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)",
                            }}
                            whileHover={{
                                color: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)",
                            }}
                        >
                            {wd.word}
                            {active && (
                                <motion.span
                                    className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full"
                                    style={{
                                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                                    }}
                                    layoutId="qksplit-tab"
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 30,
                                    }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* ── Main visualization ── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={idx}
                    className="max-w-xl mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    transition={{ duration: 0.25 }}
                >
                    {/* ── Embedding card — centered ── */}
                    <div className="flex justify-center mb-0">
                        <motion.div
                            className="rounded-xl px-5 py-3.5 w-full max-w-[210px]"
                            style={{
                                background: `linear-gradient(145deg, ${w.color}15, transparent 70%)`,
                                border: `1px solid ${w.color}25`,
                            }}
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: EASE }}
                        >
                            <p
                                className="text-[8px] uppercase tracking-[0.2em] font-semibold text-center mb-1.5"
                                style={{ color: `${w.color}80` }}
                            >
                                embedding
                            </p>
                            <p
                                className="text-center text-lg sm:text-xl font-bold tracking-tight mb-3"
                                style={{ color: w.color }}
                            >
                                &ldquo;{w.word}&rdquo;
                            </p>
                            <div className="space-y-1.5">
                                {FEATURES.map((feat, fi) => (
                                    <FeatureBar
                                        key={feat}
                                        label={feat}
                                        value={w.embedding[fi]}
                                        accentColor={w.color}
                                        delay={fi * 0.08}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* ── Branching connector — elegant Y-fork ── */}
                    <div className="flex justify-center py-2">
                        <motion.svg
                            width="200"
                            height="32"
                            viewBox="0 0 200 32"
                            fill="none"
                            className="overflow-visible"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            {/* Center vertical line */}
                            <motion.line
                                x1="100" y1="0" x2="100" y2="12"
                                stroke="rgba(255,255,255,0.06)"
                                strokeWidth="1"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ delay: 0.2, duration: 0.25 }}
                            />
                            {/* Left branch to Query */}
                            <motion.path
                                d="M 100 12 Q 100 20, 50 28"
                                stroke="rgba(34,211,238,0.35)"
                                strokeWidth="1"
                                fill="none"
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ delay: 0.3, duration: 0.3 }}
                            />
                            {/* Right branch to Key */}
                            <motion.path
                                d="M 100 12 Q 100 20, 150 28"
                                stroke="rgba(52,211,153,0.35)"
                                strokeWidth="1"
                                fill="none"
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ delay: 0.3, duration: 0.3 }}
                            />
                            {/* Center dot */}
                            <motion.circle
                                cx="100" cy="12" r="1.5"
                                fill="rgba(255,255,255,0.2)"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.25, type: "spring" }}
                            />
                        </motion.svg>
                    </div>

                    {/* ── Q and K side by side ── */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        {/* Query */}
                        <motion.div
                            className="rounded-xl px-3 sm:px-4 py-3.5"
                            style={{
                                background: "linear-gradient(145deg, rgba(34,211,238,0.1), transparent 70%)",
                                border: "1px solid rgba(34,211,238,0.18)",
                            }}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35, duration: 0.4, ease: EASE }}
                        >
                            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] font-semibold text-center mb-0.5 text-cyan-400/70">
                                🔍 Query
                            </p>
                            <p className="text-center text-[10px] sm:text-[11px] text-cyan-200/45 mb-3 italic">
                                &ldquo;What I&apos;m looking for&rdquo;
                            </p>
                            <div className="space-y-2">
                                {FEATURES.map((feat, fi) => (
                                    <FeatureBar
                                        key={feat}
                                        label={feat}
                                        value={w.query[fi]}
                                        accentColor="#22d3ee"
                                        delay={0.4 + fi * 0.08}
                                    />
                                ))}
                            </div>
                            <motion.p
                                className="text-[9px] sm:text-[10px] text-cyan-200/40 mt-3 text-center leading-relaxed"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                            >
                                {w.qLabel}
                            </motion.p>
                        </motion.div>

                        {/* Key */}
                        <motion.div
                            className="rounded-xl px-3 sm:px-4 py-3.5"
                            style={{
                                background: "linear-gradient(145deg, rgba(52,211,153,0.1), transparent 70%)",
                                border: "1px solid rgba(52,211,153,0.18)",
                            }}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35, duration: 0.4, ease: EASE }}
                        >
                            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] font-semibold text-center mb-0.5 text-emerald-400/70">
                                🔑 Key
                            </p>
                            <p className="text-center text-[10px] sm:text-[11px] text-emerald-200/45 mb-3 italic">
                                &ldquo;What I have to offer&rdquo;
                            </p>
                            <div className="space-y-2">
                                {FEATURES.map((feat, fi) => (
                                    <FeatureBar
                                        key={feat}
                                        label={feat}
                                        value={w.key[fi]}
                                        accentColor="#34d399"
                                        delay={0.4 + fi * 0.08}
                                    />
                                ))}
                            </div>
                            <motion.p
                                className="text-[9px] sm:text-[10px] text-emerald-200/40 mt-3 text-center leading-relaxed"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                            >
                                {w.kLabel}
                            </motion.p>
                        </motion.div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* ── Insight ── */}
            <AnimatePresence mode="wait">
                <motion.p
                    key={idx}
                    className="text-center text-[12px] sm:text-[13px] max-w-md mx-auto leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.8 }}
                >
                    {getInsight(w)}
                </motion.p>
            </AnimatePresence>
        </div>
    );
}
