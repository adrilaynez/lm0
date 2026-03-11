"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  V40 — HighwayReturnsViz (Redesign v3)
  Shows residual connections with animated data flow:
  - Glowing pulse travels through the pipeline
  - Without shortcut: pulse fades at each layer (signal dies)
  - With shortcut: bypass copies preserve strength, pulse stays bright
  - Signal strength meter updates as pulse flows
  - Premium SVG architecture with smooth animations
*/

interface BlockDef {
    id: string; label: string; color: string; y: number; isAdd?: boolean;
}

const CX = 160;
const BW = 120;
const BH = 30;

const BLOCKS: BlockDef[] = [
    { id: "input", label: "x (input)", color: "#94a3b8", y: 28 },
    { id: "attn", label: "Attention", color: "#22d3ee", y: 84 },
    { id: "add1", label: "x + Attn(x)", color: "#34d399", y: 140, isAdd: true },
    { id: "ffn", label: "FFN", color: "#fbbf24", y: 196 },
    { id: "add2", label: "x + FFN(x)", color: "#34d399", y: 252, isAdd: true },
    { id: "output", label: "Output", color: "#a78bfa", y: 308 },
];

/* Signal strength at each layer */
const STRENGTH_NO_SC = [1.0, 0.78, 0.55, 0.38, 0.22, 0.12];
const STRENGTH_SC = [1.0, 0.85, 0.95, 0.82, 0.93, 0.90];

export function HighwayReturnsViz() {
    const [withShortcut, setWithShortcut] = useState(true);
    const [pulseIdx, setPulseIdx] = useState(-1);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /* Auto-pulse animation */
    useEffect(() => {
        setPulseIdx(-1);
        if (timerRef.current) clearInterval(timerRef.current);
        let idx = -1;
        const iv = setInterval(() => {
            idx++;
            if (idx >= BLOCKS.length) { idx = -1; }
            setPulseIdx(idx);
        }, 600);
        timerRef.current = iv;
        return () => clearInterval(iv);
    }, [withShortcut]);

    const strengths = withShortcut ? STRENGTH_SC : STRENGTH_NO_SC;
    const currentStrength = pulseIdx >= 0 && pulseIdx < strengths.length ? strengths[pulseIdx] : strengths[0];

    return (
        <div className="py-6 sm:py-8 px-2 sm:px-4">
            {/* Toggle */}
            <div className="flex items-center justify-center gap-2 mb-5">
                {([
                    { on: true, l: "With Residual", c: "#34d399", r: "52,211,153" },
                    { on: false, l: "Without Residual", c: "#f43f5e", r: "244,63,94" },
                ] as const).map(({ on, l, c, r }) => {
                    const active = withShortcut === on;
                    return (
                        <motion.button key={l} onClick={() => setWithShortcut(on)}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 rounded-xl text-[13px] font-semibold cursor-pointer"
                            style={{
                                background: active ? `rgba(${r},0.12)` : "rgba(255,255,255,0.03)",
                                color: active ? c : "rgba(255,255,255,0.25)",
                                border: `1.5px solid ${active ? `rgba(${r},0.3)` : "rgba(255,255,255,0.06)"}`,
                            }}>{l}</motion.button>
                    );
                })}
            </div>

            {/* SVG architecture */}
            <div className="flex justify-center gap-4 sm:gap-6 items-start">
                <svg viewBox="0 0 320 340" className="block flex-shrink-0" style={{ width: "100%", maxWidth: 340 }}>
                    <defs>
                        <filter id="hw-pulse-glow">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                        <filter id="hw-bypass-glow">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    </defs>

                    {/* Vertical connectors */}
                    {BLOCKS.slice(0, -1).map((block, i) => {
                        const next = BLOCKS[i + 1];
                        const fade = !withShortcut ? Math.max(0.3, 1 - i * 0.15) : 1;
                        return (
                            <motion.line key={`c-${i}`}
                                x1={CX} y1={block.y + BH / 2 + 2}
                                x2={CX} y2={next.y - BH / 2 - 2}
                                strokeWidth={1.5}
                                animate={{
                                    stroke: `rgba(255,255,255,${0.08 * fade})`,
                                }}
                                transition={{ duration: 0.3 }}
                            />
                        );
                    })}

                    {/* Down arrows */}
                    {BLOCKS.slice(0, -1).map((block, i) => {
                        const ay = block.y + BH / 2 + 6;
                        const fade = !withShortcut ? Math.max(0.3, 1 - i * 0.15) : 1;
                        return (
                            <motion.polygon key={`a-${i}`}
                                points={`${CX - 3},${ay} ${CX + 3},${ay} ${CX},${ay + 5}`}
                                animate={{ fill: `rgba(255,255,255,${0.1 * fade})` }}
                                transition={{ duration: 0.3 }}
                            />
                        );
                    })}

                    {/* Bypass arcs (with shortcut only) */}
                    {withShortcut && (
                        <>
                            {/* Input → Add1 */}
                            <motion.path
                                d={`M ${CX + BW / 2 + 2} ${BLOCKS[0].y + 4} C ${CX + BW / 2 + 50} ${BLOCKS[0].y + 30}, ${CX + BW / 2 + 50} ${BLOCKS[2].y - 20}, ${CX + BW / 2 + 2} ${BLOCKS[2].y - 4}`}
                                fill="none" stroke="#34d399" strokeWidth={2} strokeDasharray="5 3"
                                filter="url(#hw-bypass-glow)"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 0.45 }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                            />
                            <motion.text
                                x={CX + BW / 2 + 52} y={(BLOCKS[0].y + BLOCKS[2].y) / 2 + 4}
                                fontSize={10} fontWeight="700" fill="#34d399" fillOpacity={0.45}
                                fontFamily="ui-monospace, monospace"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                                +x
                            </motion.text>

                            {/* Add1 → Add2 */}
                            <motion.path
                                d={`M ${CX + BW / 2 + 2} ${BLOCKS[2].y + 4} C ${CX + BW / 2 + 50} ${BLOCKS[2].y + 30}, ${CX + BW / 2 + 50} ${BLOCKS[4].y - 20}, ${CX + BW / 2 + 2} ${BLOCKS[4].y - 4}`}
                                fill="none" stroke="#34d399" strokeWidth={2} strokeDasharray="5 3"
                                filter="url(#hw-bypass-glow)"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 0.45 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                            />
                            <motion.text
                                x={CX + BW / 2 + 52} y={(BLOCKS[2].y + BLOCKS[4].y) / 2 + 4}
                                fontSize={10} fontWeight="700" fill="#34d399" fillOpacity={0.45}
                                fontFamily="ui-monospace, monospace"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                                +x
                            </motion.text>
                        </>
                    )}

                    {/* Blocks */}
                    {BLOCKS.map((block, i) => {
                        const fade = !withShortcut ? Math.max(0.35, 1 - i * 0.13) : 1;
                        const isPulseHere = pulseIdx === i;
                        return (
                            <g key={block.id}>
                                <motion.rect
                                    x={CX - BW / 2} y={block.y - BH / 2}
                                    width={BW} height={BH}
                                    rx={block.isAdd ? BH / 2 : 8}
                                    fill={block.color}
                                    stroke={block.color}
                                    strokeWidth={1.5}
                                    animate={{
                                        fillOpacity: isPulseHere ? 0.18 * fade : 0.07 * fade,
                                        strokeOpacity: isPulseHere ? 0.6 * fade : 0.25 * fade,
                                    }}
                                    transition={{ duration: 0.2 }}
                                />
                                {/* Pulse glow ring */}
                                {isPulseHere && (
                                    <motion.rect
                                        x={CX - BW / 2 - 3} y={block.y - BH / 2 - 3}
                                        width={BW + 6} height={BH + 6}
                                        rx={block.isAdd ? (BH + 6) / 2 : 11}
                                        fill="none" stroke={block.color}
                                        filter="url(#hw-pulse-glow)"
                                        initial={{ strokeOpacity: 0 }}
                                        animate={{ strokeOpacity: [0, 0.4 * fade, 0] }}
                                        transition={{ duration: 0.5 }}
                                    />
                                )}
                                <motion.text
                                    x={CX} y={block.y + 4.5}
                                    textAnchor="middle" fontSize={12}
                                    fontFamily="ui-sans-serif, system-ui"
                                    fontWeight="700" fill={block.color}
                                    animate={{ fillOpacity: 0.85 * fade }}
                                    transition={{ duration: 0.3 }}>
                                    {block.label}
                                </motion.text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Signal strength meter */}
            <div className="max-w-xs mx-auto mt-4">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-white/25 font-semibold">Signal strength</span>
                    <motion.span
                        className="text-[14px] font-bold font-mono tabular-nums"
                        animate={{
                            color: currentStrength > 0.7 ? "#34d399"
                                : currentStrength > 0.4 ? "#fbbf24" : "#f43f5e",
                        }}
                    >
                        {(currentStrength * 100).toFixed(0)}%
                    </motion.span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <motion.div
                        className="h-full rounded-full"
                        animate={{
                            width: `${currentStrength * 100}%`,
                            background: currentStrength > 0.7 ? "#34d399"
                                : currentStrength > 0.4 ? "#fbbf24" : "#f43f5e",
                        }}
                        transition={{ type: "spring", stiffness: 100, damping: 14 }}
                    />
                </div>
            </div>

            {/* Status */}
            <AnimatePresence mode="wait">
                <motion.p key={String(withShortcut)}
                    className="text-center text-[13px] mt-4 font-semibold max-w-sm mx-auto leading-relaxed"
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                    style={{ color: withShortcut ? "rgba(52,211,153,0.5)" : "rgba(244,63,94,0.5)" }}>
                    {withShortcut
                        ? "The residual connection preserves the original \u2014 output = f(x) + x"
                        : "Without residual connections, the original signal fades through each layer"}
                </motion.p>
            </AnimatePresence>

            {/* Formula highlight */}
            {withShortcut && (
                <motion.div
                    className="flex items-center justify-center mt-3"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <span className="text-[14px] font-mono font-bold" style={{ color: "rgba(52,211,153,0.45)" }}>
                        y = f(x) + x
                    </span>
                </motion.div>
            )}
        </div>
    );
}
