"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

/*
  BlockComponentExplorerViz — Premium interactive Transformer block anatomy.
  
  Two-column layout: left = SVG architecture diagram with glowing nodes and
  curved skip connections; right = animated detail panel for selected component.
  
  Click any node in the diagram to see what happens inside that component.
*/

/* ── Component data ── */
interface BlockComponent {
    id: string;
    label: string;
    shortLabel: string;
    icon: string;
    color: string;
    rgb: string;
    summary: string;
    detail: React.ReactNode;
}

const BLOCK_COMPONENTS: BlockComponent[] = [
    {
        id: "norm1", label: "Layer Norm", shortLabel: "LayerNorm",
        icon: "⚖️", color: "#fbbf24", rgb: "251,191,36",
        summary: "Stabilize values before attention",
        detail: (
            <div className="space-y-3">
                <p className="text-[13px] text-white/50 leading-relaxed">
                    Before attention, each embedding vector is <strong className="text-amber-400/80">normalized</strong> —
                    the mean is subtracted and values are scaled to unit variance.
                </p>
                <div className="font-mono text-[13px] text-center py-3 rounded-lg"
                    style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.12)" }}>
                    <span className="text-amber-400/70">x̂ = (x − μ) / σ</span>
                </div>
                <p className="text-[12px] text-white/30 leading-relaxed">
                    Without normalization, values drift to extreme ranges over many layers,
                    making training unstable. LayerNorm keeps each token&apos;s representation
                    in a well-behaved range at every step.
                </p>
            </div>
        ),
    },
    {
        id: "attn", label: "Masked Multi-Head Attention", shortLabel: "Multi-Head\nAttention",
        icon: "👁️", color: "#22d3ee", rgb: "34,211,238",
        summary: "Tokens gather context from each other",
        detail: (
            <div className="space-y-3">
                <p className="text-[13px] text-white/50 leading-relaxed">
                    Each token creates <strong className="text-cyan-400/80">Query</strong>,{" "}
                    <strong className="text-cyan-400/80">Key</strong>, and{" "}
                    <strong className="text-cyan-400/80">Value</strong> vectors.
                    Queries match with Keys to produce attention scores; those scores weight
                    the Values into a context-rich output.
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                    {[
                        { name: "Q × K", desc: "Score relevance", c: "34,211,238" },
                        { name: "Mask", desc: "Block future", c: "251,191,36" },
                        { name: "× V", desc: "Blend values", c: "34,211,238" },
                    ].map((s) => (
                        <div key={s.name} className="rounded-lg px-2 py-1.5 text-center"
                            style={{ background: `rgba(${s.c},0.05)`, border: `1px solid rgba(${s.c},0.1)` }}>
                            <div className="text-[11px] font-mono font-bold" style={{ color: `rgba(${s.c},0.7)` }}>{s.name}</div>
                            <div className="text-[9px] text-white/25 mt-0.5">{s.desc}</div>
                        </div>
                    ))}
                </div>
                <p className="text-[12px] text-white/30 leading-relaxed">
                    &quot;Multi-head&quot; means multiple independent attention heads run in parallel,
                    each learning different relationship types.
                </p>
            </div>
        ),
    },
    {
        id: "add1", label: "Residual Add", shortLabel: "Add",
        icon: "⊕", color: "#34d399", rgb: "52,211,153",
        summary: "Add original signal back (skip connection)",
        detail: (
            <div className="space-y-3">
                <p className="text-[13px] text-white/50 leading-relaxed">
                    The output of attention is <strong className="text-emerald-400/80">added</strong> to the
                    original input. This residual connection creates a gradient highway —
                    information is always preserved.
                </p>
                <div className="font-mono text-[13px] text-center py-3 rounded-lg"
                    style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.12)" }}>
                    <span className="text-emerald-400/70">output = x + Attention(x)</span>
                </div>
                <p className="text-[12px] text-white/30 leading-relaxed">
                    Without skip connections, information from early layers would be diluted
                    through dozens of blocks. The highway ensures the model can always access
                    the original representation.
                </p>
            </div>
        ),
    },
    {
        id: "norm2", label: "Layer Norm", shortLabel: "LayerNorm",
        icon: "⚖️", color: "#fbbf24", rgb: "251,191,36",
        summary: "Stabilize values before FFN",
        detail: (
            <div className="space-y-3">
                <p className="text-[13px] text-white/50 leading-relaxed">
                    Same normalization as before, now applied before the FFN. Each sub-layer
                    gets <strong className="text-amber-400/80">its own normalization</strong> — clean input in,
                    stable output out.
                </p>
                <p className="text-[12px] text-white/30 leading-relaxed">
                    This &quot;pre-norm&quot; pattern (normalize → operate → add) trains more
                    stably than the original &quot;post-norm&quot; from 2017. Most modern
                    Transformers use pre-norm.
                </p>
            </div>
        ),
    },
    {
        id: "ffn", label: "Feed-Forward Network", shortLabel: "FFN",
        icon: "🧠", color: "#a78bfa", rgb: "167,139,250",
        summary: "Each token thinks privately",
        detail: (
            <div className="space-y-3">
                <p className="text-[13px] text-white/50 leading-relaxed">
                    A two-layer MLP applied to each token <strong className="text-violet-400/80">independently</strong>.
                    After attention mixed context, the FFN processes each token&apos;s enriched
                    representation on its own.
                </p>
                <div className="flex items-center justify-center gap-2 py-2">
                    {["d", "→", "4d", "→ ReLU →", "d"].map((s, i) => (
                        <span key={i}
                            className={`text-[12px] font-mono ${s.includes("→") ? "text-white/20" : ""}`}
                            style={!s.includes("→") ? {
                                color: "rgba(167,139,250,0.7)",
                                background: "rgba(167,139,250,0.06)",
                                padding: "2px 8px", borderRadius: 6,
                                border: "1px solid rgba(167,139,250,0.12)",
                            } : {}}>
                            {s}
                        </span>
                    ))}
                </div>
                <p className="text-[12px] text-white/30 leading-relaxed">
                    The 4× expansion creates a high-dimensional space for complex patterns.
                    ReLU kills negatives, creating sparse activations. This is where the model
                    stores its &quot;knowledge.&quot;
                </p>
            </div>
        ),
    },
    {
        id: "add2", label: "Residual Add", shortLabel: "Add",
        icon: "⊕", color: "#34d399", rgb: "52,211,153",
        summary: "Add pre-FFN signal back (second skip connection)",
        detail: (
            <div className="space-y-3">
                <p className="text-[13px] text-white/50 leading-relaxed">
                    The second residual connection adds the pre-FFN representation back.
                    Two highways per block — one around attention, one around FFN.
                </p>
                <div className="font-mono text-[13px] text-center py-3 rounded-lg"
                    style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.12)" }}>
                    <span className="text-emerald-400/70">output = x + FFN(x)</span>
                </div>
                <p className="text-[12px] text-white/30 leading-relaxed">
                    The output: refined embeddings — one per token, same dimension as input.
                    Ready for the next block, or the linear head if this is the last one.
                </p>
            </div>
        ),
    },
];

/* ── SVG layout constants ── */
const SVG_W = 220;
const NODE_W = 160;
const NODE_H = 44;
const NODE_X = (SVG_W - NODE_W) / 2;
const GAP = 16;
const NODE_POSITIONS = BLOCK_COMPONENTS.map((_, i) => ({
    y: 12 + i * (NODE_H + GAP),
}));
const SVG_H = NODE_POSITIONS[NODE_POSITIONS.length - 1].y + NODE_H + 50;

/* Skip connection arcs: norm1→add1 and norm2→add2 */
const SKIP_ARCS = [
    { fromIdx: 0, toIdx: 2, side: "right" as const },
    { fromIdx: 3, toIdx: 5, side: "right" as const },
];

export function BlockComponentExplorerViz() {
    const [selected, setSelected] = useState<string | null>(null);
    const active = BLOCK_COMPONENTS.find(c => c.id === selected);

    const handleClick = useCallback((id: string) => {
        setSelected(prev => prev === id ? null : id);
    }, []);

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-0 sm:gap-6 items-start justify-center">

                {/* ═══ LEFT: SVG Architecture Diagram ═══ */}
                <div className="w-full sm:w-auto flex-shrink-0 flex justify-center">
                    <svg
                        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                        className="w-[240px] sm:w-[220px]"
                        style={{ height: "auto" }}
                    >
                        <defs>
                            {/* Glow filters per color */}
                            {BLOCK_COMPONENTS.map(c => (
                                <filter key={c.id} id={`glow-${c.id}`} x="-40%" y="-40%" width="180%" height="180%">
                                    <feGaussianBlur stdDeviation="6" result="blur" />
                                    <feFlood floodColor={c.color} floodOpacity="0.3" />
                                    <feComposite in2="blur" operator="in" />
                                    <feMerge>
                                        <feMergeNode />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            ))}
                        </defs>

                        {/* ── Skip connection arcs ── */}
                        {SKIP_ARCS.map((arc, ai) => {
                            const fromY = NODE_POSITIONS[arc.fromIdx].y + NODE_H / 2;
                            const toY = NODE_POSITIONS[arc.toIdx].y + NODE_H / 2;
                            const x = NODE_X + NODE_W + 8;
                            const cx = x + 24;
                            const isActive = selected === BLOCK_COMPONENTS[arc.toIdx].id;
                            return (
                                <g key={ai}>
                                    <path
                                        d={`M ${x} ${fromY} C ${cx} ${fromY} ${cx} ${toY} ${x} ${toY}`}
                                        fill="none"
                                        stroke={isActive ? "rgba(52,211,153,0.35)" : "rgba(52,211,153,0.1)"}
                                        strokeWidth={isActive ? 2 : 1.5}
                                        strokeDasharray={isActive ? "none" : "4 3"}
                                    />
                                    {/* Arrow head */}
                                    <polygon
                                        points={`${x},${toY - 3} ${x},${toY + 3} ${x - 4},${toY}`}
                                        fill={isActive ? "rgba(52,211,153,0.4)" : "rgba(52,211,153,0.15)"}
                                    />
                                    {/* "skip" label */}
                                    <text
                                        x={cx + 4} y={(fromY + toY) / 2 + 3}
                                        fill={isActive ? "rgba(52,211,153,0.4)" : "rgba(52,211,153,0.12)"}
                                        fontSize={7} fontFamily="monospace"
                                        transform={`rotate(-90, ${cx + 4}, ${(fromY + toY) / 2 + 3})`}
                                        textAnchor="middle"
                                    >
                                        skip
                                    </text>
                                </g>
                            );
                        })}

                        {/* ── Flow arrows between nodes ── */}
                        {NODE_POSITIONS.slice(1).map((pos, i) => {
                            const fromY = NODE_POSITIONS[i].y + NODE_H;
                            const toY = pos.y;
                            const midX = SVG_W / 2;
                            return (
                                <line key={i}
                                    x1={midX} y1={fromY + 1}
                                    x2={midX} y2={toY - 1}
                                    stroke="rgba(255,255,255,0.06)"
                                    strokeWidth={1}
                                />
                            );
                        })}

                        {/* ── Component nodes ── */}
                        {BLOCK_COMPONENTS.map((comp, i) => {
                            const pos = NODE_POSITIONS[i];
                            const isActive = selected === comp.id;
                            const isHoverable = true;

                            return (
                                <g key={comp.id}
                                    className={isHoverable ? "cursor-pointer" : ""}
                                    onClick={() => handleClick(comp.id)}
                                >
                                    {/* Glow background when active */}
                                    {isActive && (
                                        <rect
                                            x={NODE_X - 4} y={pos.y - 4}
                                            width={NODE_W + 8} height={NODE_H + 8}
                                            rx={14} fill={`rgba(${comp.rgb},0.08)`}
                                            filter={`url(#glow-${comp.id})`}
                                        />
                                    )}

                                    {/* Node background */}
                                    <rect
                                        x={NODE_X} y={pos.y}
                                        width={NODE_W} height={NODE_H}
                                        rx={10}
                                        fill={isActive ? `rgba(${comp.rgb},0.12)` : "rgba(255,255,255,0.02)"}
                                        stroke={isActive ? `rgba(${comp.rgb},0.5)` : `rgba(${comp.rgb},0.12)`}
                                        strokeWidth={isActive ? 1.5 : 1}
                                    />

                                    {/* Icon */}
                                    <text
                                        x={NODE_X + 14} y={pos.y + NODE_H / 2 + 1}
                                        fontSize={14} textAnchor="middle" dominantBaseline="middle"
                                    >
                                        {comp.icon}
                                    </text>

                                    {/* Label */}
                                    <text
                                        x={NODE_X + 28} y={pos.y + (comp.shortLabel.includes("\n") ? 15 : NODE_H / 2 + 1)}
                                        fill={isActive ? comp.color : `rgba(${comp.rgb},0.7)`}
                                        fontSize={11} fontWeight={isActive ? 700 : 600}
                                        fontFamily="system-ui, sans-serif"
                                        dominantBaseline="middle"
                                    >
                                        {comp.shortLabel.split("\n").map((line, li) => (
                                            <tspan key={li} x={NODE_X + 28} dy={li === 0 ? 0 : 13}>
                                                {line}
                                            </tspan>
                                        ))}
                                    </text>

                                    {/* Subtle arrow indicator */}
                                    <text
                                        x={NODE_X + NODE_W - 14} y={pos.y + NODE_H / 2 + 1}
                                        fill={isActive ? `rgba(${comp.rgb},0.6)` : `rgba(${comp.rgb},0.2)`}
                                        fontSize={8} textAnchor="middle" dominantBaseline="middle"
                                        fontFamily="system-ui"
                                    >
                                        {isActive ? "◀" : "▶"}
                                    </text>
                                </g>
                            );
                        })}

                        {/* ── × N blocks footer ── */}
                        <g>
                            <line
                                x1={SVG_W / 2 - 40} y1={SVG_H - 22}
                                x2={SVG_W / 2 + 40} y2={SVG_H - 22}
                                stroke="rgba(34,211,238,0.1)" strokeWidth={1}
                            />
                            <text
                                x={SVG_W / 2} y={SVG_H - 8}
                                textAnchor="middle"
                                fill="rgba(34,211,238,0.35)"
                                fontSize={10} fontFamily="monospace"
                            >
                                × N blocks
                            </text>
                        </g>
                    </svg>
                </div>

                {/* ═══ RIGHT: Detail Panel ═══ */}
                <div className="flex-1 min-w-0 sm:min-h-[380px]">
                    <AnimatePresence mode="wait">
                        {active ? (
                            <motion.div
                                key={active.id}
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="rounded-2xl px-5 py-5 sm:mt-2"
                                style={{
                                    background: `rgba(${active.rgb},0.04)`,
                                    border: `1px solid rgba(${active.rgb},0.12)`,
                                    boxShadow: `0 0 40px -12px rgba(${active.rgb},0.1), inset 0 1px 0 rgba(${active.rgb},0.06)`,
                                }}
                            >
                                {/* Header */}
                                <div className="flex items-center gap-2.5 mb-4">
                                    <span className="text-[18px]">{active.icon}</span>
                                    <div>
                                        <h4 className="text-[15px] font-bold" style={{ color: active.color }}>
                                            {active.label}
                                        </h4>
                                        <p className="text-[11px] text-white/25">{active.summary}</p>
                                    </div>
                                </div>

                                {/* Separator */}
                                <div className="h-px mb-4"
                                    style={{ background: `rgba(${active.rgb},0.1)` }} />

                                {/* Detail content */}
                                {active.detail}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center h-full min-h-[200px] sm:min-h-[380px] text-center px-6"
                            >
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                    <span className="text-[20px] opacity-30">👆</span>
                                </div>
                                <p className="text-[14px] text-white/25 font-medium">
                                    Click any component
                                </p>
                                <p className="text-[12px] text-white/15 mt-1">
                                    to see what happens inside
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
