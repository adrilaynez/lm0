"use client";

import { useState } from "react";

import { motion, AnimatePresence } from "framer-motion";

/*
  IsolatedTokensViz — v7 (moderate redesign)
  Phase 1 (default): word wall visualization — isolation emphasis (kept).
  Phase 2 (toggled): mini embedding space — each word as a frozen colored dot.
    All dots are locked to fixed positions regardless of what surrounds them.
    Hover a word in Phase 1 → highlight its dot in Phase 2.
    Caption: "Each word gets ONE permanent address in meaning-space."
  Teaching arc: isolation → frozen representation.
*/

const WORDS = ["The", "cat", "sat", "on", "the", "warm", "mat"];

/* Fixed 2D positions for the embedding space — hand-crafted for clarity */
const EMBEDDING_POSITIONS: { x: number; y: number; color: string }[] = [
    { x: 12, y: 68, color: "#94a3b8" },   /* The */
    { x: 52, y: 22, color: "#22d3ee" },   /* cat */
    { x: 72, y: 50, color: "#a78bfa" },   /* sat */
    { x: 36, y: 58, color: "#94a3b8" },   /* on */
    { x: 20, y: 52, color: "#94a3b8" },   /* the */
    { x: 66, y: 30, color: "#fbbf24" },   /* warm */
    { x: 44, y: 70, color: "#34d399" },   /* mat */
];

/* Fake embedding vectors shown on hover — illustrative only */
const FAKE_EMBEDDINGS: number[][] = [
    [0.12, -0.84, 0.33, -0.51, 0.70],  /* The  */
    [0.91, 0.45, -0.22, 0.68, -0.30],  /* cat  */
    [-0.14, 0.77, 0.55, -0.40, 0.21],  /* sat  */
    [0.08, -0.63, 0.29, -0.55, 0.60],  /* on   */
    [0.11, -0.81, 0.31, -0.53, 0.68],  /* the  */
    [0.73, 0.38, 0.82, 0.14, -0.44],  /* warm */
    [0.58, 0.20, -0.65, 0.87, 0.09],  /* mat  */
];

export function IsolatedTokensViz() {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const [phase, setPhase] = useState<1 | 2>(1);
    const isActive = hoveredIdx !== null;
    const isIdle = !isActive;

    return (
        <div className="py-8 sm:py-10 px-2 sm:px-4 space-y-5">

            {/* ── Phase 1: Word wall ── */}
            <div
                className="relative flex items-center justify-center gap-0 py-8 sm:py-10"
                onMouseLeave={() => setHoveredIdx(null)}
            >
                {/* Scanning spotlight for idle state */}
                {isIdle && phase === 1 && (
                    <motion.div
                        className="absolute top-0 bottom-0 pointer-events-none z-0"
                        style={{
                            width: 180,
                            background: "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.03), transparent 70%)",
                            filter: "blur(10px)",
                        }}
                        animate={{ left: ["8%", "72%", "8%"] }}
                        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                    />
                )}

                {WORDS.map((word, i) => {
                    const isHovered = hoveredIdx === i;
                    const isAdjacentWall = hoveredIdx !== null && (i === hoveredIdx || i === hoveredIdx + 1);

                    const color = isHovered
                        ? "rgba(255, 255, 255, 0.95)"
                        : isActive
                            ? "rgba(255, 255, 255, 0.25)"
                            : "rgba(255, 255, 255, 0.68)";

                    const textShadow = isHovered
                        ? "0 0 18px rgba(255, 255, 255, 0.35), 0 0 40px rgba(255, 255, 255, 0.1)"
                        : "none";

                    return (
                        <div key={i} className="flex items-center">
                            {i > 0 && (
                                <div className="relative flex items-center justify-center w-4 sm:w-5 h-10 sm:h-12 shrink-0">
                                    <div
                                        className="w-[1px] h-full rounded-full transition-all duration-300"
                                        style={{
                                            background: isAdjacentWall
                                                ? "linear-gradient(to bottom, transparent 10%, rgba(251,191,36,0.12) 30%, rgba(251,191,36,0.22) 50%, rgba(251,191,36,0.12) 70%, transparent 90%)"
                                                : "linear-gradient(to bottom, transparent 10%, rgba(251,191,36,0.05) 30%, rgba(251,191,36,0.08) 50%, rgba(251,191,36,0.05) 70%, transparent 90%)",
                                            opacity: isActive ? 1 : 0.7,
                                        }}
                                    />
                                </div>
                            )}

                            <motion.span
                                className="relative font-medium tracking-[-0.01em] cursor-pointer select-none px-[0.15em]"
                                style={{
                                    fontSize: "clamp(1.3rem, 3vw, 1.75rem)",
                                    color,
                                    textShadow,
                                    transition: "color 0.25s ease, text-shadow 0.3s ease",
                                }}
                                onMouseEnter={() => setHoveredIdx(i)}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.06, duration: 0.4 }}
                            >
                                {isHovered && (
                                    <motion.span
                                        className="absolute inset-0 -inset-x-2 -inset-y-1 rounded-full pointer-events-none"
                                        style={{ background: "radial-gradient(ellipse at center, rgba(255,255,255,0.1) 0%, transparent 70%)", filter: "blur(6px)" }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.25 }}
                                    />
                                )}
                                {isHovered && (
                                    <motion.span
                                        className="absolute -bottom-1 left-0 right-0 h-[1.5px] rounded-full pointer-events-none"
                                        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ duration: 0.25 }}
                                    />
                                )}
                                <span className="relative z-10">{word}</span>
                            </motion.span>
                        </div>
                    );
                })}
            </div>

            {/* ── Phase 1 feedback line ── */}
            <div className="h-5 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {hoveredIdx !== null ? (
                        <motion.p
                            key="hover"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -3 }}
                            transition={{ duration: 0.15 }}
                            className="text-[13px] text-center"
                        >
                            <span className="text-white/60 font-medium">&ldquo;{WORDS[hoveredIdx]}&rdquo;</span>
                            <span className="text-white/30"> lights up — but nothing else reacts. </span>
                            <span className="text-white/20 italic">Alone.</span>
                        </motion.p>
                    ) : (
                        <motion.p
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="text-[13px] text-white/20 text-center italic"
                        >
                            Hover any word — notice nothing connects
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Phase toggle ── */}
            <div className="flex items-center justify-center">
                <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                    {([1, 2] as const).map((p) => {
                        const isActive = phase === p;
                        return (
                            <button
                                key={p}
                                onClick={() => setPhase(p)}
                                className="px-4 py-1.5 text-[11px] font-semibold transition-all duration-250 cursor-pointer"
                                style={{
                                    background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
                                    color: isActive ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.25)",
                                }}
                            >
                                {p === 1 ? "Connections" : "Embedding space"}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Phase 2: Frozen embedding space ── */}
            <AnimatePresence>
                {phase === 2 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="space-y-3"
                    >
                        {/* The embedding plot — wide, short */}
                        <div
                            className="relative w-full"
                            style={{ paddingBottom: "48%", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}
                        >
                            <div className="absolute inset-0" onMouseLeave={() => setHoveredIdx(null)}>
                                {/* Subtle grid lines */}
                                <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.04 }}>
                                    {[25, 50, 75].map(v => (
                                        <g key={v}>
                                            <line x1={`${v}%`} y1="0" x2={`${v}%`} y2="100%" stroke="white" strokeWidth="0.5" />
                                            <line x1="0" y1={`${v}%`} x2="100%" y2={`${v}%`} stroke="white" strokeWidth="0.5" />
                                        </g>
                                    ))}
                                </svg>

                                {/* Axis label */}
                                <span className="absolute bottom-2 right-3 text-[9px] text-white/15 font-medium italic">meaning-space</span>

                                {/* Each word as a frozen dot */}
                                {WORDS.map((word, i) => {
                                    const pos = EMBEDDING_POSITIONS[i];
                                    const isHov = hoveredIdx === i;

                                    return (
                                        <motion.div
                                            key={i}
                                            className="absolute cursor-pointer"
                                            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)" }}
                                            onMouseEnter={() => setHoveredIdx(i)}
                                        >
                                            {/* Pulse ring */}
                                            {isHov && (
                                                <motion.div
                                                    className="absolute rounded-full"
                                                    style={{
                                                        width: 28, height: 28,
                                                        top: "50%", left: "50%",
                                                        transform: "translate(-50%,-50%)",
                                                        border: `1px solid ${pos.color}55`,
                                                    }}
                                                    initial={{ scale: 0.5, opacity: 0 }}
                                                    animate={{ scale: [0.5, 1.6, 1.6], opacity: [0, 0.6, 0] }}
                                                    transition={{ duration: 1.4, repeat: Infinity }}
                                                />
                                            )}

                                            {/* Glow */}
                                            <motion.div
                                                className="absolute rounded-full blur-md pointer-events-none"
                                                style={{
                                                    width: isHov ? 32 : 22, height: isHov ? 32 : 22,
                                                    top: "50%", left: "50%",
                                                    transform: "translate(-50%,-50%)",
                                                    background: `radial-gradient(circle, ${pos.color}55, transparent 70%)`,
                                                }}
                                                animate={{ opacity: isHov ? 1 : 0.35 }}
                                                transition={{ duration: 0.2 }}
                                            />

                                            {/* Dot — 12px rest, 15px hover */}
                                            <div
                                                className="relative z-10 rounded-full"
                                                style={{
                                                    width: isHov ? 15 : 11,
                                                    height: isHov ? 15 : 11,
                                                    background: pos.color,
                                                    boxShadow: isHov ? `0 0 12px ${pos.color}90` : `0 0 4px ${pos.color}40`,
                                                    transition: "width 0.18s, height 0.18s, box-shadow 0.18s",
                                                }}
                                            />

                                            {/* Word label — 11px rest, 13px hover */}
                                            <span
                                                className="absolute whitespace-nowrap font-semibold"
                                                style={{
                                                    top: isHov ? -20 : -16,
                                                    left: "50%",
                                                    transform: "translateX(-50%)",
                                                    fontSize: isHov ? "13px" : "11px",
                                                    color: isHov ? pos.color : "rgba(255,255,255,0.38)",
                                                    transition: "font-size 0.18s, color 0.18s, top 0.18s",
                                                    textShadow: isHov ? `0 0 8px ${pos.color}60` : "none",
                                                }}
                                            >
                                                {word}
                                            </span>
                                        </motion.div>
                                    );
                                })}

                                {/* FROZEN stamp */}
                                <div className="absolute bottom-2 left-3 pointer-events-none">
                                    <span className="text-[8px] uppercase tracking-[0.2em] font-bold" style={{ color: "rgba(251,191,36,0.2)" }}>
                                        frozen
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Embedding vector tooltip panel */}
                        <AnimatePresence mode="wait">
                            {hoveredIdx !== null ? (
                                <motion.div
                                    key={`emb-hover-${hoveredIdx}`}
                                    className="rounded-xl px-4 py-3 space-y-2"
                                    style={{ background: "rgba(0,0,0,0.35)", border: `1px solid ${EMBEDDING_POSITIONS[hoveredIdx].color}22` }}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -3 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12px] font-semibold" style={{ color: EMBEDDING_POSITIONS[hoveredIdx].color }}>
                                            &ldquo;{WORDS[hoveredIdx]}&rdquo;
                                        </span>
                                        <span className="text-[10px] text-white/20 italic">same numbers, always</span>
                                    </div>
                                    {/* Mini embedding vector display */}
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-white/20 font-mono shrink-0">emb =</span>
                                        <div className="flex gap-1 flex-wrap">
                                            {FAKE_EMBEDDINGS[hoveredIdx].map((v, di) => (
                                                <span
                                                    key={di}
                                                    className="font-mono text-[11px] px-1.5 py-0.5 rounded"
                                                    style={{
                                                        background: "rgba(255,255,255,0.05)",
                                                        color: v >= 0 ? `${EMBEDDING_POSITIONS[hoveredIdx].color}cc` : "rgba(255,100,100,0.6)",
                                                    }}
                                                >
                                                    {v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2)}
                                                </span>
                                            ))}
                                            <span className="font-mono text-[11px] text-white/15">…</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-amber-400/40 italic">
                                        This vector is fixed — context can&apos;t change it.
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.p
                                    key="emb-idle"
                                    className="text-[12px] sm:text-[13px] text-center text-white/25 leading-relaxed"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    Each word has <span className="text-white/40 font-medium">one permanent address</span> in meaning-space.
                                    <br />
                                    <span className="text-amber-400/40 italic text-[11px]">Hover a word to see its embedding vector.</span>
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
