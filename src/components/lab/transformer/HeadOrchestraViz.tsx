"use client";

import { useCallback, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  V30 — HeadOrchestraViz
  4 head outputs → concatenate → linear projection → final output.
  Step-by-step animation: Step 1 = heads produce outputs,
  Step 2 = concatenate into one long vector, Step 3 = project down.
*/

const STEPS = [
    { label: "Heads Output", color: "#22d3ee", icon: "🧠" },
    { label: "Concatenate", color: "#fbbf24", icon: "🔗" },
    { label: "Project", color: "#34d399", icon: "📐" },
] as const;

const HEAD_COLORS = ["#22d3ee", "#34d399", "#fbbf24", "#a78bfa"];
const HEAD_OUTPUTS = [
    [0.82, -0.14],
    [0.23, 0.91],
    [-0.45, 0.67],
    [0.55, 0.03],
];
const CONCAT = HEAD_OUTPUTS.flat();
const PROJECTED = [0.56, 0.39, 0.63]; // After W_O projection

/* SVG layout */
const SVG_W = 580;
const SVG_H = 180;

export function HeadOrchestraViz() {
    const [step, setStep] = useState(0);
    const advance = useCallback(() => setStep(s => Math.min(s + 1, 2)), []);
    const reset = useCallback(() => setStep(0), []);

    return (
        <div className="py-5 sm:py-6 px-2 sm:px-4 space-y-4" style={{ minHeight: 320 }}>
            {/* Step pills */}
            <div className="flex items-center justify-center gap-1 sm:gap-2">
                {STEPS.map((s, i) => (
                    <div key={i} className="flex items-center gap-1">
                        {i > 0 && <span className="text-white/10 text-xs">→</span>}
                        <button
                            onClick={() => setStep(i)}
                            className="px-2.5 py-1.5 rounded-lg text-[9px] sm:text-[11px] font-bold border transition-all"
                            style={{
                                backgroundColor: i <= step ? s.color + "15" : "rgba(255,255,255,0.02)",
                                borderColor: i <= step ? s.color + "40" : "rgba(255,255,255,0.06)",
                                color: i <= step ? s.color : "rgba(255,255,255,0.2)",
                            }}
                        >
                            {s.icon} {s.label}
                        </button>
                    </div>
                ))}
            </div>

            {/* SVG pipeline diagram — improved layout */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ minHeight: 100 }}>
                    <defs>
                        <filter id="orch-glow">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    </defs>

                    {/* 4 head boxes — stacked 2×2 */}
                    {HEAD_COLORS.map((color, i) => {
                        const col = i % 2;
                        const row = Math.floor(i / 2);
                        const x = 30 + col * 72;
                        const y = 25 + row * 72;
                        const active = step >= 0;
                        return (
                            <g key={`head-${i}`}>
                                {/* Glow for active step */}
                                {step === 0 && (
                                    <motion.rect
                                        x={x - 2} y={y - 2} width={64} height={64} rx={10}
                                        fill="none" stroke={color} strokeWidth={1}
                                        filter="url(#orch-glow)"
                                        initial={{ strokeOpacity: 0 }}
                                        animate={{ strokeOpacity: [0.05, 0.15, 0.05] }}
                                        transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
                                    />
                                )}
                                <motion.rect
                                    x={x} y={y} width={60} height={60} rx={8}
                                    fill={color} stroke={color}
                                    strokeWidth={step === 0 ? 2 : 1}
                                    animate={{
                                        fillOpacity: active ? 0.15 : 0.04,
                                        strokeOpacity: active ? 0.4 : 0.1,
                                    }}
                                />
                                <motion.text
                                    x={x + 30} y={y + 25}
                                    textAnchor="middle" fontSize={10} fontFamily="ui-monospace, monospace" fontWeight="bold"
                                    fill={color} animate={{ fillOpacity: active ? 0.85 : 0.2 }}
                                >
                                    H{i + 1}
                                </motion.text>
                                <motion.text
                                    x={x + 30} y={y + 42}
                                    textAnchor="middle" fontSize={7} fontFamily="ui-monospace, monospace"
                                    fill="white" animate={{ fillOpacity: active ? 0.3 : 0.08 }}
                                >
                                    2 dim
                                </motion.text>

                                {/* Arrow from head to concat */}
                                <motion.line
                                    x1={x + 60} y1={y + 30}
                                    x2={220} y2={90}
                                    stroke={color} strokeWidth={1.5}
                                    strokeDasharray={step >= 1 ? "none" : "3 3"}
                                    animate={{ strokeOpacity: step >= 1 ? 0.3 : 0.06 }}
                                    transition={{ duration: 0.3 }}
                                />
                                {/* Data pulse along arrow */}
                                {step === 1 && (
                                    <motion.circle
                                        r={2.5} fill={color}
                                        initial={{ opacity: 0.8 }}
                                        animate={{ opacity: 0 }}
                                        transition={{ duration: 1, repeat: Infinity, repeatDelay: 1, delay: i * 0.2 }}
                                        style={{
                                            offsetPath: `path("M ${x + 60} ${y + 30} L 220 90")`,
                                            offsetDistance: "0%",
                                        } as React.CSSProperties}
                                    />
                                )}
                            </g>
                        );
                    })}

                    {/* Concat box — taller, centered */}
                    <motion.rect
                        x={220} y={30} width={70} height={120} rx={10}
                        fill="#fbbf24" stroke="#fbbf24"
                        strokeWidth={step === 1 ? 2 : 1}
                        animate={{
                            fillOpacity: step >= 1 ? 0.12 : 0.03,
                            strokeOpacity: step >= 1 ? 0.35 : 0.08,
                        }}
                    />
                    <motion.text
                        x={255} y={82} textAnchor="middle" fontSize={10}
                        fontFamily="ui-monospace, monospace" fontWeight="bold"
                        fill="#fbbf24" animate={{ fillOpacity: step >= 1 ? 0.8 : 0.15 }}
                    >
                        Concat
                    </motion.text>
                    <motion.text
                        x={255} y={100} textAnchor="middle" fontSize={7}
                        fontFamily="ui-monospace, monospace"
                        fill="white" animate={{ fillOpacity: step >= 1 ? 0.3 : 0.06 }}
                    >
                        8 dim
                    </motion.text>
                    {/* Mini colored segments inside concat */}
                    {step >= 1 && HEAD_COLORS.map((color, i) => (
                        <motion.rect
                            key={`seg-${i}`}
                            x={228} y={38 + i * 24} width={54} height={18} rx={3}
                            fill={color}
                            initial={{ fillOpacity: 0, width: 0 }}
                            animate={{ fillOpacity: 0.12, width: 54 }}
                            transition={{ delay: 0.1 + i * 0.08 }}
                        />
                    ))}

                    {/* Arrow: concat → W_O */}
                    <motion.line
                        x1={292} y1={90} x2={345} y2={90}
                        stroke="#34d399" strokeWidth={2}
                        strokeDasharray={step >= 2 ? "none" : "4 3"}
                        animate={{ strokeOpacity: step >= 2 ? 0.4 : 0.06 }}
                    />
                    {step >= 2 && (
                        <motion.polygon
                            points="343,86 349,90 343,94"
                            fill="#34d399"
                            initial={{ fillOpacity: 0 }} animate={{ fillOpacity: 0.5 }}
                        />
                    )}
                    {step === 2 && (
                        <motion.circle
                            cx={292} cy={90} r={3} fill="#34d399"
                            initial={{ cx: 292, opacity: 0.9 }}
                            animate={{ cx: 345, opacity: 0 }}
                            transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1.5 }}
                        />
                    )}

                    {/* W_O box */}
                    <motion.rect
                        x={350} y={55} width={70} height={70} rx={10}
                        fill="#34d399" stroke="#34d399"
                        strokeWidth={step === 2 ? 2 : 1}
                        animate={{
                            fillOpacity: step >= 2 ? 0.12 : 0.03,
                            strokeOpacity: step >= 2 ? 0.35 : 0.08,
                        }}
                    />
                    <motion.text
                        x={385} y={85} textAnchor="middle" fontSize={10}
                        fontFamily="ui-monospace, monospace" fontWeight="bold"
                        fill="#34d399" animate={{ fillOpacity: step >= 2 ? 0.8 : 0.15 }}
                    >
                        W_O
                    </motion.text>
                    <motion.text
                        x={385} y={102} textAnchor="middle" fontSize={7}
                        fontFamily="ui-monospace, monospace"
                        fill="white" animate={{ fillOpacity: step >= 2 ? 0.3 : 0.06 }}
                    >
                        Linear
                    </motion.text>

                    {/* Arrow: W_O → Output */}
                    {step >= 2 && (
                        <>
                            <motion.line
                                x1={422} y1={90} x2={468} y2={90}
                                stroke="#f472b6" strokeWidth={2}
                                initial={{ strokeOpacity: 0 }} animate={{ strokeOpacity: 0.3 }}
                                transition={{ delay: 0.3 }}
                            />
                            <motion.polygon
                                points="466,86 472,90 466,94"
                                fill="#f472b6"
                                initial={{ fillOpacity: 0 }} animate={{ fillOpacity: 0.4 }}
                                transition={{ delay: 0.35 }}
                            />
                        </>
                    )}

                    {/* Output box */}
                    <motion.rect
                        x={475} y={60} width={70} height={60} rx={10}
                        fill="#f472b6" stroke="#f472b6"
                        strokeWidth={step === 2 ? 2 : 1}
                        animate={{
                            fillOpacity: step >= 2 ? 0.1 : 0.02,
                            strokeOpacity: step >= 2 ? 0.3 : 0.05,
                        }}
                    />
                    <motion.text
                        x={510} y={85} textAnchor="middle" fontSize={10}
                        fontFamily="ui-monospace, monospace" fontWeight="bold"
                        fill="#f472b6" animate={{ fillOpacity: step >= 2 ? 0.8 : 0.12 }}
                    >
                        Output
                    </motion.text>
                    <motion.text
                        x={510} y={102} textAnchor="middle" fontSize={7}
                        fontFamily="ui-monospace, monospace"
                        fill="white" animate={{ fillOpacity: step >= 2 ? 0.25 : 0.05 }}
                    >
                        d_model
                    </motion.text>

                    {/* Dimension labels at bottom */}
                    <motion.text
                        x={90} y={170} textAnchor="middle" fontSize={6}
                        fontFamily="ui-monospace, monospace" fill="white" fillOpacity={0.12}
                    >
                        4 heads × 2 dim = 8 total
                    </motion.text>
                </svg>
            </div>

            {/* Detail panel */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                >
                    {step === 0 && (
                        <div className="space-y-3">
                            <p className="text-xs sm:text-sm font-semibold text-cyan-400/70">Each head produces its own small output</p>
                            <div className="flex flex-wrap justify-center gap-3">
                                {HEAD_OUTPUTS.map((out, i) => (
                                    <motion.div
                                        key={i}
                                        className="flex items-center gap-1.5 rounded-lg px-3 py-2"
                                        style={{ border: `1px solid ${HEAD_COLORS[i]}25`, background: `${HEAD_COLORS[i]}08` }}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.1, type: "spring" }}
                                    >
                                        <span className="text-[10px] font-bold" style={{ color: HEAD_COLORS[i] }}>H{i + 1}:</span>
                                        {out.map((v, j) => (
                                            <span key={j} className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                                                style={{ background: `${HEAD_COLORS[i]}15`, color: HEAD_COLORS[i] }}>
                                                {v.toFixed(2)}
                                            </span>
                                        ))}
                                    </motion.div>
                                ))}
                            </div>
                            <p className="text-[9px] text-white/20 text-center">4 heads × 2 dimensions each = 4 different perspectives</p>
                        </div>
                    )}
                    {step === 1 && (
                        <div className="space-y-3">
                            <p className="text-xs sm:text-sm font-semibold text-amber-400/70">Concatenate: stack all outputs into one vector</p>
                            <div className="flex flex-wrap justify-center gap-0.5">
                                {CONCAT.map((v, i) => {
                                    const headIdx = Math.floor(i / 2);
                                    return (
                                        <motion.span
                                            key={i}
                                            className="px-1.5 py-1 rounded text-[10px] font-mono font-bold"
                                            style={{
                                                background: `${HEAD_COLORS[headIdx]}12`,
                                                border: `1px solid ${HEAD_COLORS[headIdx]}25`,
                                                color: HEAD_COLORS[headIdx],
                                            }}
                                            initial={{ opacity: 0, y: -8 - headIdx * 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.04, type: "spring" }}
                                        >
                                            {v.toFixed(2)}
                                        </motion.span>
                                    );
                                })}
                            </div>
                            <p className="text-[9px] text-white/20 text-center">
                                [H1 | H2 | H3 | H4] = 8-dimensional vector containing all perspectives
                            </p>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="space-y-3">
                            <p className="text-xs sm:text-sm font-semibold text-emerald-400/70">Project: W_O compresses back to model dimension</p>
                            <div className="flex items-center justify-center gap-3">
                                <div className="flex gap-0.5">
                                    {CONCAT.slice(0, 4).map((v, i) => (
                                        <span key={i} className="px-1 py-0.5 rounded text-[8px] font-mono text-white/20 bg-white/[0.03]">
                                            {v.toFixed(1)}
                                        </span>
                                    ))}
                                    <span className="text-white/10 text-[8px]">...</span>
                                </div>
                                <motion.span
                                    className="text-emerald-400/50 text-xs font-bold"
                                    initial={{ scale: 0.5 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    × W_O →
                                </motion.span>
                                <div className="flex gap-1">
                                    {PROJECTED.map((v, i) => (
                                        <motion.span
                                            key={i}
                                            className="px-2 py-1.5 rounded-lg text-sm font-mono font-bold"
                                            style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399" }}
                                            initial={{ opacity: 0, scale: 0.7 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
                                        >
                                            {v.toFixed(2)}
                                        </motion.span>
                                    ))}
                                </div>
                            </div>
                            <p className="text-[9px] text-white/20 text-center">
                                8 dims → 3 dims. The projection learned which combinations of head outputs matter most.
                            </p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Nav */}
            <div className="flex justify-between items-center">
                <button onClick={reset} className="text-[10px] text-white/25 hover:text-white/45 transition-colors">↻ Reset</button>
                <div className="flex gap-1.5">
                    {STEPS.map((s, i) => (
                        <div key={i} className="w-2 h-2 rounded-full cursor-pointer"
                            style={{ background: i === step ? s.color : i < step ? s.color + "60" : "rgba(255,255,255,0.08)" }}
                            onClick={() => setStep(i)} />
                    ))}
                </div>
                {step < 2 ? (
                    <button onClick={advance} className="px-3 py-1.5 rounded-lg text-xs font-bold border"
                        style={{ backgroundColor: STEPS[step + 1].color + "15", borderColor: STEPS[step + 1].color + "40", color: STEPS[step + 1].color }}>
                        Next →
                    </button>
                ) : (
                    <button onClick={reset} className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-emerald-500/15 border-emerald-500/30 text-emerald-400">
                        ↻ Replay
                    </button>
                )}
            </div>
        </div>
    );
}
