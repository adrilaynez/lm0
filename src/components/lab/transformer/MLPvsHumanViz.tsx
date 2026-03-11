"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Brain, Cpu } from "lucide-react";

/*
  MLPvsHumanViz — v2
  Side-by-side comparison: MLP (cold, isolated) vs Human (warm, connected).
  Both panels visible on desktop, toggle on mobile.
  Rich detail: processing pipelines, connection lines with labels,
  stats cards showing the dramatic difference.
*/

const WORDS = ["The", "cat", "sat", "on", "the", "warm", "mat"];

/* Human connections with labels explaining WHY they're connected */
const HUMAN_CONNECTIONS: { from: number; to: number; strength: number; label: string }[] = [
    { from: 1, to: 2, strength: 0.95, label: "subject → verb" },
    { from: 2, to: 6, strength: 0.75, label: "verb → object" },
    { from: 5, to: 6, strength: 0.9, label: "adjective → noun" },
    { from: 3, to: 6, strength: 0.55, label: "preposition → noun" },
    { from: 0, to: 1, strength: 0.45, label: "article → noun" },
    { from: 4, to: 5, strength: 0.4, label: "article → adjective" },
];

type View = "model" | "human";

/* ── Curved path for SVG connections ── */
function getCurve(x1: number, y1: number, x2: number, y2: number): string {
    const midX = (x1 + x2) / 2;
    const dist = Math.abs(x2 - x1);
    const curve = Math.min(dist * 0.55, 45);
    return `M ${x1} ${y1} Q ${midX} ${Math.min(y1, y2) - curve} ${x2} ${y2}`;
}

export function MLPvsHumanViz() {
    const [view, setView] = useState<View>("model");
    const [hoveredConn, setHoveredConn] = useState<number | null>(null);

    /* ── Word positions for SVG (proportional) ── */
    const wp = WORDS.map((_, i) => ({
        x: 8 + (i / (WORDS.length - 1)) * 84,
        y: 42,
    }));

    const ModelPanel = ({ compact }: { compact?: boolean }) => (
        <div className={`rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden ${compact ? "" : "h-full"}`}>
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.04] bg-white/[0.01]">
                <Cpu className="w-3.5 h-3.5 text-white/20" />
                <span className="text-[9px] font-mono font-bold text-white/35 uppercase tracking-wider">How the Model Sees It</span>
            </div>

            {/* SVG diagram */}
            <div className="p-3">
                <svg viewBox="0 0 100 65" className="w-full" preserveAspectRatio="xMidYMid meet">
                    {WORDS.map((word, i) => {
                        const x = wp[i].x;
                        return (
                            <g key={i}>
                                {/* Word box */}
                                <rect x={x - 5} y={8} width={10} height={7} rx={1} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth={0.3} />
                                <text x={x} y={12.5} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize={2.6} fontFamily="monospace" fontWeight="600">{word}</text>
                                {/* Lock */}
                                <rect x={x + 3.5} y={7} width={2.5} height={2.5} rx={0.5} fill="rgba(244,63,94,0.08)" stroke="rgba(244,63,94,0.15)" strokeWidth={0.2} />
                                <text x={x + 4.75} y={9} textAnchor="middle" fill="rgba(244,63,94,0.3)" fontSize={1.5}>🔒</text>
                                {/* Arrow */}
                                <line x1={x} y1={17} x2={x} y2={25} stroke="rgba(255,255,255,0.1)" strokeWidth={0.3} />
                                <polygon points={`${x},26 ${x - 0.8},24.5 ${x + 0.8},24.5`} fill="rgba(255,255,255,0.12)" />
                                {/* MLP block */}
                                <rect x={x - 4} y={27} width={8} height={4} rx={0.8} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" strokeWidth={0.25} />
                                <text x={x} y={29.8} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize={2} fontFamily="monospace" fontWeight="bold">MLP</text>
                                {/* Arrow */}
                                <line x1={x} y1={32.5} x2={x} y2={38} stroke="rgba(255,255,255,0.08)" strokeWidth={0.3} />
                                <polygon points={`${x},39 ${x - 0.6},37.5 ${x + 0.6},37.5`} fill="rgba(255,255,255,0.1)" />
                                {/* Prediction */}
                                <text x={x} y={42} textAnchor="middle" fill="rgba(239,68,68,0.3)" fontSize={1.8} fontFamily="monospace">???</text>
                                {/* Wall */}
                                {i < WORDS.length - 1 && (
                                    <line x1={(x + wp[i + 1].x) / 2} y1={5} x2={(x + wp[i + 1].x) / 2} y2={44} stroke="rgba(245,158,11,0.12)" strokeWidth={0.3} strokeDasharray="0.8 0.8" />
                                )}
                            </g>
                        );
                    })}
                    {/* Caption */}
                    <text x={50} y={50} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize={2} fontFamily="monospace">
                        Each word processed in isolation
                    </text>
                </svg>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-1 px-3 pb-3">
                <div className="rounded-md border border-rose-500/10 bg-rose-500/[0.02] p-1.5 text-center">
                    <p className="text-[7px] font-mono text-rose-400/40">Connections</p>
                    <p className="text-sm font-mono font-black text-rose-400">0</p>
                </div>
                <div className="rounded-md border border-white/[0.04] bg-white/[0.01] p-1.5 text-center">
                    <p className="text-[7px] font-mono text-white/20">Context</p>
                    <p className="text-sm font-mono font-black text-white/25">1 word</p>
                </div>
                <div className="rounded-md border border-amber-500/10 bg-amber-500/[0.02] p-1.5 text-center">
                    <p className="text-[7px] font-mono text-amber-400/40">Accuracy</p>
                    <p className="text-sm font-mono font-black text-amber-400">~14%</p>
                </div>
            </div>
        </div>
    );

    const HumanPanel = ({ compact }: { compact?: boolean }) => (
        <div className={`rounded-xl border border-cyan-500/[0.12] bg-cyan-500/[0.02] overflow-hidden ${compact ? "" : "h-full"}`}>
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-cyan-500/[0.06] bg-cyan-500/[0.01]">
                <Brain className="w-3.5 h-3.5 text-cyan-400/40" />
                <span className="text-[9px] font-mono font-bold text-cyan-400/50 uppercase tracking-wider">How You See It</span>
            </div>

            {/* SVG diagram */}
            <div className="p-3">
                <svg viewBox="0 0 100 65" className="w-full" preserveAspectRatio="xMidYMid meet">
                    {/* Connection lines */}
                    {HUMAN_CONNECTIONS.map((conn, ci) => {
                        const p1 = wp[conn.from];
                        const p2 = wp[conn.to];
                        const isHovered = hoveredConn === ci;
                        return (
                            <g key={ci}
                                onMouseEnter={() => setHoveredConn(ci)}
                                onMouseLeave={() => setHoveredConn(null)}
                                style={{ cursor: "default" }}
                            >
                                {/* Glow */}
                                <path
                                    d={getCurve(p1.x, p1.y - 20, p2.x, p2.y - 20)}
                                    fill="none"
                                    stroke="rgba(34,211,238,0.06)"
                                    strokeWidth={conn.strength * 2 + 1}
                                    strokeLinecap="round"
                                />
                                {/* Line */}
                                <motion.path
                                    d={getCurve(p1.x, p1.y - 20, p2.x, p2.y - 20)}
                                    fill="none"
                                    stroke="#22d3ee"
                                    strokeWidth={conn.strength * 0.8 + 0.3}
                                    strokeLinecap="round"
                                    opacity={isHovered ? 0.9 : conn.strength * 0.5}
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.6, delay: ci * 0.1 }}
                                />
                                {/* Label */}
                                {isHovered && (
                                    <text
                                        x={(p1.x + p2.x) / 2}
                                        y={Math.min(p1.y, p2.y) - 20 - Math.min(Math.abs(p2.x - p1.x) * 0.45, 40) - 3}
                                        textAnchor="middle"
                                        fill="rgba(34,211,238,0.7)"
                                        fontSize={2}
                                        fontFamily="monospace"
                                        fontWeight="bold"
                                    >
                                        {conn.label}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Words */}
                    {WORDS.map((word, i) => {
                        const x = wp[i].x;
                        const connCount = HUMAN_CONNECTIONS.filter(c => c.from === i || c.to === i).length;
                        const isActive = connCount > 0;
                        return (
                            <g key={i}>
                                {isActive && (
                                    <circle cx={x} cy={22} r={6} fill="rgba(34,211,238,0.03)" />
                                )}
                                <text
                                    x={x}
                                    y={23.5}
                                    textAnchor="middle"
                                    fill={isActive ? "rgba(34,211,238,0.8)" : "rgba(255,255,255,0.4)"}
                                    fontSize={2.8}
                                    fontFamily="monospace"
                                    fontWeight={isActive ? 700 : 400}
                                >
                                    {word}
                                </text>
                                {/* Connection count */}
                                {isActive && (
                                    <text x={x} y={28.5} textAnchor="middle" fill="rgba(34,211,238,0.3)" fontSize={1.5} fontFamily="monospace">
                                        {connCount} links
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Caption */}
                    <text x={50} y={50} textAnchor="middle" fill="rgba(34,211,238,0.25)" fontSize={2} fontFamily="monospace">
                        Words connected by meaning
                    </text>
                </svg>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-1 px-3 pb-3">
                <div className="rounded-md border border-cyan-500/[0.1] bg-cyan-500/[0.03] p-1.5 text-center">
                    <p className="text-[7px] font-mono text-cyan-400/40">Connections</p>
                    <p className="text-sm font-mono font-black text-cyan-400">{HUMAN_CONNECTIONS.length}</p>
                </div>
                <div className="rounded-md border border-cyan-500/[0.08] bg-cyan-500/[0.02] p-1.5 text-center">
                    <p className="text-[7px] font-mono text-cyan-400/35">Context</p>
                    <p className="text-sm font-mono font-black text-cyan-300">All words</p>
                </div>
                <div className="rounded-md border border-emerald-500/[0.1] bg-emerald-500/[0.02] p-1.5 text-center">
                    <p className="text-[7px] font-mono text-emerald-400/40">Accuracy</p>
                    <p className="text-sm font-mono font-black text-emerald-400">~99%</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-3 sm:p-5 space-y-4 select-none">
            {/* ── Desktop: side-by-side ── */}
            <div className="hidden sm:grid sm:grid-cols-2 gap-3">
                <ModelPanel />
                <HumanPanel />
            </div>

            {/* ── Mobile: toggle ── */}
            <div className="sm:hidden space-y-3">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <button
                        onClick={() => setView("model")}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-mono font-bold transition-all ${view === "model" ? "bg-white/[0.08] text-white/60" : "text-white/25"}`}
                    >
                        <Cpu className="w-3 h-3" /> Model
                    </button>
                    <button
                        onClick={() => setView("human")}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-mono font-bold transition-all ${view === "human" ? "bg-cyan-400/[0.1] text-cyan-300 border border-cyan-400/20" : "text-white/25"}`}
                    >
                        <Brain className="w-3 h-3" /> Human
                    </button>
                </div>
                <AnimatePresence mode="wait">
                    {view === "model" ? (
                        <motion.div key="m" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                            <ModelPanel compact />
                        </motion.div>
                    ) : (
                        <motion.div key="h" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                            <HumanPanel compact />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Insight card ── */}
            <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.02] p-3 space-y-1.5">
                <p className="text-[9px] font-mono font-bold text-amber-400/60">The fundamental gap</p>
                <p className="text-[8px] font-mono text-white/30 leading-relaxed">
                    The model processes each word through its own <span className="text-white/50 font-bold">private MLP pipeline</span>.
                    It sees &ldquo;cat&rdquo; and guesses the next word from statistics alone — no grammar, no sentence structure,
                    no concept of what &ldquo;sat&rdquo; or &ldquo;mat&rdquo; even means in this context.
                </p>
                <p className="text-[8px] font-mono text-white/20 leading-relaxed">
                    Your brain builds a <span className="text-cyan-400/50 font-bold">web of relationships</span> instantly:
                    subject-verb agreement, adjective-noun pairs, prepositional phrases.
                    <span className="text-white/35 font-bold"> That web is what we need to teach the model.</span>
                </p>
            </div>
        </div>
    );
}
