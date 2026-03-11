"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  V45 — BlockBlueprintViz
  Clean reference diagram. Standard Transformer block layout.
  Clickable components → tooltip with description + "Covered in §XX".
  Residual arrows visible. Bookmarkable reference card.
  Height: ~370px. All text ≥ 13px. NO distracting animation.
*/

type BlockId = "input" | "norm1" | "attn" | "add1" | "norm2" | "ffn" | "add2" | "output";

interface BlockDef {
    id: BlockId;
    label: string;
    color: string;
    tooltip: string;
    ref: string;
    y: number;
    isAdd?: boolean;
}

const BLOCKS: BlockDef[] = [
    { id: "input",  label: "Input",           color: "#94a3b8", tooltip: "Token embeddings + positional encoding enter the block",              ref: "§06", y: 20  },
    { id: "norm1",  label: "LayerNorm",       color: "#a78bfa", tooltip: "Stabilizes values before each operation",                             ref: "§07", y: 70  },
    { id: "attn",   label: "Self-Attention",  color: "#22d3ee", tooltip: "Tokens gather information from each other",                           ref: "§03–§05", y: 125 },
    { id: "add1",   label: "Add  ⊕",          color: "#34d399", tooltip: "Adds the original input back — the gradient highway",                 ref: "§07", y: 180, isAdd: true },
    { id: "norm2",  label: "LayerNorm",       color: "#a78bfa", tooltip: "Stabilizes values again before private processing",                   ref: "§07", y: 230 },
    { id: "ffn",    label: "Feed-Forward",    color: "#fbbf24", tooltip: "Each token privately processes what it learned",                       ref: "§07", y: 285 },
    { id: "add2",   label: "Add  ⊕",          color: "#34d399", tooltip: "Adds the input back again — second highway",                          ref: "§07", y: 340, isAdd: true },
    { id: "output", label: "Output",          color: "#f472b6", tooltip: "Enriched token representations ready for the next layer",              ref: "§08", y: 390 },
];

const SVG_W = 380;
const SVG_H = 420;
const CENTER_X = SVG_W / 2 - 20;
const BLOCK_W = 150;
const BLOCK_H = 34;

export function BlockBlueprintViz() {
    const [active, setActive] = useState<BlockId | null>(null);
    const activeBlock = BLOCKS.find(b => b.id === active);

    return (
        <div className="py-6 sm:py-8 px-3 sm:px-6 relative" style={{ minHeight: 370 }}>
            {/* Title badge */}
            <div className="flex items-center justify-center mb-4">
                <div
                    className="px-4 py-1.5 rounded-full text-[14px] font-bold flex items-center gap-2"
                    style={{
                        background: "linear-gradient(135deg, rgba(34,211,238,0.08), rgba(139,92,246,0.05))",
                        border: "1.5px solid rgba(34,211,238,0.2)",
                        color: "rgba(255,255,255,0.5)",
                    }}
                >
                    📐 Reference Blueprint
                </div>
            </div>

            <div className="flex items-start justify-center">
                <svg
                    viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                    className="w-full"
                    style={{ maxWidth: 400, display: "block" }}
                >
                    <defs>
                        <filter id="v45-glow">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    </defs>

                    {/* ── Vertical connectors ── */}
                    {BLOCKS.slice(0, -1).map((block, i) => {
                        const next = BLOCKS[i + 1];
                        return (
                            <line
                                key={`conn-${i}`}
                                x1={CENTER_X}
                                y1={block.y + BLOCK_H / 2}
                                x2={CENTER_X}
                                y2={next.y - BLOCK_H / 2}
                                stroke="rgba(255,255,255,0.07)"
                                strokeWidth={2}
                            />
                        );
                    })}

                    {/* ── Residual bypass 1: Input → Add1 ── */}
                    {(() => {
                        const startY = BLOCKS[0].y + BLOCK_H / 2;
                        const endY = BLOCKS[3].y;
                        const cx = CENTER_X + BLOCK_W / 2 + 35;
                        return (
                            <g>
                                <path
                                    d={`M ${CENTER_X + BLOCK_W / 2 - 10} ${startY}
                                        C ${cx} ${startY + 10}, ${cx} ${endY - 10}, ${CENTER_X + BLOCK_W / 2 - 10} ${endY}`}
                                    fill="none"
                                    stroke="#34d399"
                                    strokeWidth={2}
                                    strokeDasharray="6 4"
                                    opacity={0.35}
                                />
                                <text
                                    x={cx + 6} y={(startY + endY) / 2 + 4}
                                    fontSize={10} fontWeight="600"
                                    fill="#34d399" fillOpacity={0.45}
                                    fontFamily="ui-sans-serif, system-ui"
                                >
                                    +x
                                </text>
                            </g>
                        );
                    })()}

                    {/* ── Residual bypass 2: Add1 → Add2 ── */}
                    {(() => {
                        const startY = BLOCKS[3].y + BLOCK_H / 2;
                        const endY = BLOCKS[6].y;
                        const cx = CENTER_X + BLOCK_W / 2 + 35;
                        return (
                            <g>
                                <path
                                    d={`M ${CENTER_X + BLOCK_W / 2 - 10} ${startY}
                                        C ${cx} ${startY + 10}, ${cx} ${endY - 10}, ${CENTER_X + BLOCK_W / 2 - 10} ${endY}`}
                                    fill="none"
                                    stroke="#34d399"
                                    strokeWidth={2}
                                    strokeDasharray="6 4"
                                    opacity={0.35}
                                />
                                <text
                                    x={cx + 6} y={(startY + endY) / 2 + 4}
                                    fontSize={10} fontWeight="600"
                                    fill="#34d399" fillOpacity={0.45}
                                    fontFamily="ui-sans-serif, system-ui"
                                >
                                    +x
                                </text>
                            </g>
                        );
                    })()}

                    {/* ── Downward arrows ── */}
                    {BLOCKS.slice(0, -1).map((block, i) => {
                        const ay = block.y + BLOCK_H / 2 + 6;
                        return (
                            <polygon
                                key={`arrow-${i}`}
                                points={`${CENTER_X - 4},${ay} ${CENTER_X + 4},${ay} ${CENTER_X},${ay + 7}`}
                                fill="rgba(255,255,255,0.08)"
                            />
                        );
                    })}

                    {/* ── Block rectangles ── */}
                    {BLOCKS.map((block) => {
                        const isActive = active === block.id;
                        const rx = block.isAdd ? BLOCK_H / 2 : 10;
                        return (
                            <g
                                key={block.id}
                                style={{ cursor: "pointer" }}
                                onClick={() => setActive(isActive ? null : block.id)}
                                onMouseEnter={() => setActive(block.id)}
                                onMouseLeave={() => setActive(null)}
                            >
                                {/* Glow ring */}
                                {isActive && (
                                    <rect
                                        x={CENTER_X - BLOCK_W / 2 - 3}
                                        y={block.y - BLOCK_H / 2 - 3}
                                        width={BLOCK_W + 6}
                                        height={BLOCK_H + 6}
                                        rx={rx + 2}
                                        fill="none"
                                        stroke={block.color}
                                        strokeWidth={1.5}
                                        opacity={0.3}
                                        filter="url(#v45-glow)"
                                    />
                                )}
                                {/* Block */}
                                <rect
                                    x={CENTER_X - BLOCK_W / 2}
                                    y={block.y - BLOCK_H / 2}
                                    width={BLOCK_W}
                                    height={BLOCK_H}
                                    rx={rx}
                                    fill={block.color}
                                    fillOpacity={isActive ? 0.15 : 0.07}
                                    stroke={block.color}
                                    strokeWidth={1.5}
                                    strokeOpacity={isActive ? 0.6 : 0.25}
                                />
                                {/* Label */}
                                <text
                                    x={CENTER_X}
                                    y={block.y + 5}
                                    textAnchor="middle"
                                    fontSize={13}
                                    fontWeight="700"
                                    fontFamily="ui-sans-serif, system-ui"
                                    fill={block.color}
                                    fillOpacity={isActive ? 0.95 : 0.7}
                                >
                                    {block.label}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* ── Tooltip ── */}
            <AnimatePresence>
                {activeBlock && (
                    <motion.div
                        key={activeBlock.id}
                        className="absolute left-1/2 rounded-xl px-5 py-3 pointer-events-none"
                        style={{
                            transform: "translateX(-50%)",
                            top: 80,
                            background: "rgba(0,0,0,0.85)",
                            backdropFilter: "blur(12px)",
                            border: `1.5px solid ${activeBlock.color}40`,
                            maxWidth: 300,
                            zIndex: 10,
                        }}
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                    >
                        <p className="text-[14px] font-bold mb-1" style={{ color: activeBlock.color }}>
                            {activeBlock.label}
                        </p>
                        <p className="text-[13px] text-white/50 leading-snug">
                            {activeBlock.tooltip}
                        </p>
                        <p className="text-[13px] font-mono mt-1.5" style={{ color: `${activeBlock.color}60` }}>
                            Covered in {activeBlock.ref}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
