"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  ContextWindowViz — VIZ 13

  Show how context window size affects model predictions.
  Slider from 32→512 chars with quality comparison.

  Top: a line of text with a colored "visible window" overlay
  Middle: SVG chart (loss vs context)
  Bottom: annotation + sample text at selected context size
*/

const SAMPLE_TEXT =
    "First let me tell you about the time I realized that building something real takes more than just talent. It also takes the patience to keep going when nobody believes in you, and the stubbornness to refuse to quit even when every signal says you should.";

const CTX_DATA = [
    { ctx: 32,  valLoss: 1.437, label: "32 chars",  note: "~6 words of context. Barely past one sentence fragment.", quality: "poor" },
    { ctx: 64,  valLoss: 1.367, label: "64 chars",  note: "~12 words. A short sentence visible.", quality: "okay" },
    { ctx: 128, valLoss: 1.311, label: "128 chars", note: "~25 words. Full sentences visible. Good context.", quality: "good" },
    { ctx: 256, valLoss: 1.301, label: "256 chars", note: "Multiple sentences. This is the sweet spot for our model.", quality: "great" },
    { ctx: 512, valLoss: 1.305, label: "512 chars", note: "Same quality \u2014 text dependencies don\u2019t reach this far.", quality: "great" },
];

const QUALITY_COLORS: Record<string, { color: string; rgb: string }> = {
    poor:  { color: "#f43f5e", rgb: "244,63,94" },
    okay:  { color: "#f59e0b", rgb: "245,158,11" },
    good:  { color: "#22d3ee", rgb: "34,211,238" },
    great: { color: "#34d399", rgb: "52,211,153" },
};

/* SVG chart dimensions */
const CW = 380;
const CH = 130;
const PAD = { top: 16, right: 24, bottom: 28, left: 44 };
const plotW = CW - PAD.left - PAD.right;
const plotH = CH - PAD.top - PAD.bottom;

const yMin = 1.28;
const yMax = 1.46;
const xScale = (i: number) => PAD.left + (i / (CTX_DATA.length - 1)) * plotW;
const yScale = (v: number) => PAD.top + ((yMax - v) / (yMax - yMin)) * plotH;

function buildLinePath(): string {
    return CTX_DATA.map((d, i) =>
        `${i === 0 ? "M" : "L"}${xScale(i).toFixed(1)},${yScale(d.valLoss).toFixed(1)}`
    ).join(" ");
}

export function ContextWindowViz() {
    const [idx, setIdx] = useState(3); /* default: 256 chars */

    const data = CTX_DATA[idx];
    const qc = QUALITY_COLORS[data.quality];
    const windowChars = Math.min(data.ctx, SAMPLE_TEXT.length);

    /* The "visible window" is the last `windowChars` characters before the cursor */
    const cursorPos = SAMPLE_TEXT.length;
    const windowStart = Math.max(0, cursorPos - windowChars);

    const linePath = useMemo(() => buildLinePath(), []);

    return (
        <div className="flex flex-col items-center gap-5 w-full py-5 px-2 max-w-[520px] mx-auto">
            {/* ── Context size selector ── */}
            <div className="flex items-center gap-1.5 w-full">
                {CTX_DATA.map((d, i) => {
                    const on = idx === i;
                    const dc = QUALITY_COLORS[d.quality];
                    return (
                        <button key={i}
                            onClick={() => setIdx(i)}
                            className="flex-1 py-1.5 rounded-lg text-[11px] font-bold font-mono cursor-pointer transition-all text-center"
                            style={{
                                background: on ? `rgba(${dc.rgb},0.12)` : "rgba(255,255,255,0.02)",
                                color: on ? dc.color : "rgba(255,255,255,0.2)",
                                border: `1.5px solid ${on ? `rgba(${dc.rgb},0.3)` : "rgba(255,255,255,0.04)"}`,
                            }}>
                            {d.ctx}
                        </button>
                    );
                })}
            </div>

            {/* ── Text with visible window overlay ── */}
            <div className="w-full rounded-xl px-3 py-3 font-mono text-[11px] sm:text-[12px] leading-relaxed relative overflow-hidden"
                style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)",
                    minHeight: 72,
                }}>
                {/* Dimmed text (outside window) */}
                <span style={{ color: "rgba(255,255,255,0.1)" }}>
                    {SAMPLE_TEXT.slice(0, windowStart)}
                </span>
                {/* Visible window (highlighted) */}
                <motion.span
                    style={{ color: `rgba(${qc.rgb},0.7)` }}
                    animate={{ color: `rgba(${qc.rgb},0.7)` }}
                    transition={{ duration: 0.3 }}
                >
                    {SAMPLE_TEXT.slice(windowStart, cursorPos)}
                </motion.span>

                {/* Cursor */}
                <motion.span
                    className="inline-block w-[2px] h-[14px] ml-[1px] align-middle rounded-full"
                    style={{ background: qc.color }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                />

                {/* Window size label */}
                <motion.div
                    className="absolute top-1.5 right-2 px-2 py-0.5 rounded-md text-[9px] font-bold font-mono"
                    style={{
                        background: `rgba(${qc.rgb},0.08)`,
                        color: `rgba(${qc.rgb},0.6)`,
                        border: `1px solid rgba(${qc.rgb},0.15)`,
                    }}
                    key={idx}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                >
                    {data.ctx} chars visible
                </motion.div>
            </div>

            {/* ── SVG Loss Chart ── */}
            <div className="w-full">
                <svg viewBox={`0 0 ${CW} ${CH}`} className="w-full" style={{ maxWidth: 400 }}>
                    {/* Y-axis grid + labels */}
                    {[1.30, 1.35, 1.40, 1.45].map(v => (
                        <g key={v}>
                            <line x1={PAD.left} y1={yScale(v)} x2={CW - PAD.right} y2={yScale(v)}
                                stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
                            <text x={PAD.left - 6} y={yScale(v) + 3} textAnchor="end"
                                fontSize={8} fontFamily="monospace" fill="rgba(255,255,255,0.18)">
                                {v.toFixed(2)}
                            </text>
                        </g>
                    ))}

                    {/* X-axis labels */}
                    {CTX_DATA.map((d, i) => (
                        <text key={i} x={xScale(i)} y={CH - 8} textAnchor="middle"
                            fontSize={8} fontFamily="monospace"
                            fill={idx === i ? qc.color : "rgba(255,255,255,0.18)"}>
                            {d.ctx}
                        </text>
                    ))}
                    <text x={CW / 2} y={CH - 0} textAnchor="middle"
                        fontSize={7} fill="rgba(255,255,255,0.1)">context size (chars)</text>
                    <text x={8} y={CH / 2} textAnchor="middle"
                        fontSize={7} fill="rgba(255,255,255,0.1)"
                        transform={`rotate(-90,8,${CH / 2})`}>val loss</text>

                    {/* Area under curve */}
                    <path
                        d={`${linePath} L${xScale(CTX_DATA.length - 1)},${yScale(yMin)} L${xScale(0)},${yScale(yMin)} Z`}
                        fill="rgba(34,211,238,0.04)"
                    />

                    {/* Line */}
                    <path d={linePath} fill="none"
                        stroke="#22d3ee" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                        style={{ filter: "drop-shadow(0 0 4px rgba(34,211,238,0.3))" }}
                    />

                    {/* Data dots */}
                    {CTX_DATA.map((d, i) => {
                        const isActive = idx === i;
                        const dc = QUALITY_COLORS[d.quality];
                        return (
                            <g key={i} style={{ cursor: "pointer" }} onClick={() => setIdx(i)}>
                                <circle cx={xScale(i)} cy={yScale(d.valLoss)} r={12}
                                    fill="transparent" />
                                <motion.circle
                                    cx={xScale(i)} cy={yScale(d.valLoss)}
                                    r={isActive ? 5 : 3}
                                    fill={isActive ? dc.color : "#22d3ee"}
                                    animate={{
                                        r: isActive ? 5 : 3,
                                        opacity: isActive ? 1 : 0.5,
                                    }}
                                    style={{
                                        filter: isActive
                                            ? `drop-shadow(0 0 6px rgba(${dc.rgb},0.5))`
                                            : "none",
                                    }}
                                />
                                {isActive && (
                                    <motion.text
                                        x={xScale(i)} y={yScale(d.valLoss) - 10}
                                        textAnchor="middle" fontSize={8} fontFamily="monospace"
                                        fontWeight={700} fill={dc.color}
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        {d.valLoss.toFixed(3)}
                                    </motion.text>
                                )}
                            </g>
                        );
                    })}

                    {/* Sweet spot annotation */}
                    {idx >= 3 && (
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                            <rect x={xScale(3) - 26} y={yScale(CTX_DATA[3].valLoss) + 8}
                                width={52} height={14} rx={4}
                                fill="rgba(52,211,153,0.1)" stroke="rgba(52,211,153,0.25)" strokeWidth={0.7} />
                            <text x={xScale(3)} y={yScale(CTX_DATA[3].valLoss) + 18}
                                textAnchor="middle" fontSize={7} fontWeight={700} fill="rgba(52,211,153,0.7)">
                                sweet spot
                            </text>
                        </motion.g>
                    )}
                </svg>
            </div>

            {/* ── Annotation ── */}
            <AnimatePresence mode="wait">
                <motion.div key={idx}
                    className="px-4 py-2.5 rounded-xl text-center max-w-sm"
                    style={{
                        background: `rgba(${qc.rgb},0.04)`,
                        border: `1px solid rgba(${qc.rgb},0.12)`,
                    }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <p className="text-[12px] leading-relaxed" style={{ color: `rgba(${qc.rgb},0.65)` }}>
                        <span className="font-bold">{data.label}:</span> {data.note}
                    </p>
                </motion.div>
            </AnimatePresence>

            {/* ── Caption ── */}
            <p className="text-[11px] text-center text-white/15 max-w-xs leading-relaxed">
                More context helps {"\u2014"} until it doesn{"\u2019"}t.
                Past 256 chars, our model sees no benefit. The patterns simply don{"\u2019"}t extend further.
            </p>
        </div>
    );
}
