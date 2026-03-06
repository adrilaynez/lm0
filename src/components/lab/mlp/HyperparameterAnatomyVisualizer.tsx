"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────────────────
   HyperparameterAnatomyVisualizer
   
   Interactive MLP architecture diagram showing WHERE each
   hyperparameter lives in the network. Click a knob to
   highlight the affected component and see details.
   ───────────────────────────────────────────────────────── */

interface Knob {
    id: string;
    label: string;
    shortLabel: string;
    range: string;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
    effect: string;
    formula: string;
}

const KNOBS: Knob[] = [
    {
        id: "emb_dim",
        label: "Embedding Dimension",
        shortLabel: "emb_dim",
        range: "2 – 32",
        color: "text-sky-400",
        bgColor: "bg-sky-500/10",
        borderColor: "border-sky-500/30",
        description: "How many numbers describe each character. More dimensions = richer representation, but more parameters.",
        effect: "Controls the width of the embedding matrix C",
        formula: "C: vocab_size × emb_dim",
    },
    {
        id: "context",
        label: "Context Window",
        shortLabel: "context",
        range: "3 – 8",
        color: "text-amber-400",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/30",
        description: "How many previous characters the model sees at once. More context = better predictions, but input grows linearly.",
        effect: "Controls how many embeddings are concatenated → width of W₁",
        formula: "Input: context × emb_dim",
    },
    {
        id: "hidden_size",
        label: "Hidden Size",
        shortLabel: "hidden",
        range: "32 – 1024",
        color: "text-violet-400",
        bgColor: "bg-violet-500/10",
        borderColor: "border-violet-500/30",
        description: "How many neurons in the hidden layer. More neurons = more pattern detectors, but risk of memorization.",
        effect: "Controls the height of W₁ and width of W₂",
        formula: "W₁: (ctx×emb) × hidden",
    },
    {
        id: "learning_rate",
        label: "Learning Rate",
        shortLabel: "lr",
        range: "0.001 – 0.2",
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/30",
        description: "How big each gradient update step is. Too high → diverge. Too low → painfully slow.",
        effect: "Controls the magnitude of weight updates during backprop",
        formula: "W ← W − lr × ∂L/∂W",
    },
    {
        id: "dropout",
        label: "Dropout Rate",
        shortLabel: "dropout",
        range: "0.0 – 0.5",
        color: "text-rose-400",
        bgColor: "bg-rose-500/10",
        borderColor: "border-rose-500/30",
        description: "Fraction of neurons randomly silenced each training step. Forces redundancy, prevents memorization.",
        effect: "Randomly zeros neurons in hidden layers during training",
        formula: "P(neuron off) = dropout",
    },
];

// Neuron circle component
function Neuron({ x, y, r, fill, stroke, opacity = 1, pulsing = false, crossed = false }: {
    x: number; y: number; r: number; fill: string; stroke: string; opacity?: number; pulsing?: boolean; crossed?: boolean;
}) {
    return (
        <g>
            <motion.circle
                cx={x} cy={y} r={r}
                fill={fill} stroke={stroke} strokeWidth={1.5}
                opacity={opacity}
                animate={pulsing ? { scale: [1, 1.15, 1], opacity: [opacity, 1, opacity] } : {}}
                transition={pulsing ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}}
            />
            {crossed && (
                <>
                    <line x1={x - r * 0.6} y1={y - r * 0.6} x2={x + r * 0.6} y2={y + r * 0.6} stroke="rgba(244,63,94,0.8)" strokeWidth={2} />
                    <line x1={x + r * 0.6} y1={y - r * 0.6} x2={x - r * 0.6} y2={y + r * 0.6} stroke="rgba(244,63,94,0.8)" strokeWidth={2} />
                </>
            )}
        </g>
    );
}

export function HyperparameterAnatomyVisualizer() {
    const [selected, setSelected] = useState<string | null>(null);

    const activeKnob = KNOBS.find(k => k.id === selected);

    // Layout constants
    const W = 520, H = 300;
    const inputX = 60, embX = 155, concatX = 225, hiddenX = 330, outputX = 440;
    const midY = H / 2;

    // Which parts to highlight based on selected knob
    const hlEmb = selected === "emb_dim";
    const hlCtx = selected === "context";
    const hlHidden = selected === "hidden_size";
    const hlLR = selected === "learning_rate";
    const hlDropout = selected === "dropout";

    // Input characters (context window)
    const ctxChars = ["t", "h", "e"];
    const inputYs = [midY - 50, midY, midY + 50];

    // Embedding vectors (one per input)
    const embYs = inputYs;

    // Hidden neurons
    const hiddenNeurons = 6;
    const hiddenYs = Array.from({ length: hiddenNeurons }, (_, i) =>
        midY - ((hiddenNeurons - 1) / 2) * 34 + i * 34
    );

    // Output neurons
    const outputNeurons = 4;
    const outputYs = Array.from({ length: outputNeurons }, (_, i) =>
        midY - ((outputNeurons - 1) / 2) * 34 + i * 34
    );

    // Dropout: mark 2 neurons as "off"
    const droppedNeurons = new Set([1, 4]);

    const dimmed = selected != null;

    function connectionOpacity(from: string, to: string): number {
        if (!dimmed) return 0.12;
        if (hlEmb && from === "input" && to === "emb") return 0.4;
        if (hlCtx && from === "emb" && to === "concat") return 0.4;
        if (hlHidden && (from === "concat" && to === "hidden")) return 0.4;
        if (hlHidden && (from === "hidden" && to === "output")) return 0.4;
        if (hlDropout && from === "concat" && to === "hidden") return 0.25;
        if (hlLR) return 0.2; // all connections glow slightly
        return 0.05;
    }

    return (
        <div className="space-y-4">
            {/* Knob selector buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
                {KNOBS.map(knob => (
                    <button
                        key={knob.id}
                        onClick={() => setSelected(s => s === knob.id ? null : knob.id)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border transition-all ${
                            selected === knob.id
                                ? `${knob.bgColor} ${knob.borderColor} ${knob.color}`
                                : "bg-white/[0.03] border-white/[0.08] text-white/30 hover:text-white/50 hover:border-white/15"
                        }`}
                    >
                        {knob.shortLabel}
                    </button>
                ))}
            </div>

            {/* SVG Architecture Diagram */}
            <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3 overflow-hidden">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 320 }}>
                    {/* ── Connections: input → embedding ── */}
                    {inputYs.map((iy, i) => (
                        <line key={`ie-${i}`}
                            x1={inputX + 16} y1={iy}
                            x2={embX - 20} y2={embYs[i]}
                            stroke={hlEmb ? "rgba(56,189,248,0.5)" : "rgba(255,255,255,0.1)"}
                            strokeWidth={hlEmb ? 2 : 1}
                            opacity={connectionOpacity("input", "emb")}
                        />
                    ))}

                    {/* ── Connections: embedding → concat point ── */}
                    {embYs.map((ey, i) => (
                        <line key={`ec-${i}`}
                            x1={embX + 20} y1={ey}
                            x2={concatX} y2={midY}
                            stroke={hlCtx ? "rgba(251,191,36,0.5)" : "rgba(255,255,255,0.1)"}
                            strokeWidth={hlCtx ? 2 : 1}
                            opacity={connectionOpacity("emb", "concat")}
                        />
                    ))}

                    {/* ── Connections: concat → hidden ── */}
                    {hiddenYs.map((hy, hi) => (
                        <line key={`ch-${hi}`}
                            x1={concatX + 8} y1={midY}
                            x2={hiddenX - 14} y2={hy}
                            stroke={hlHidden ? "rgba(139,92,246,0.4)" : hlDropout ? "rgba(244,63,94,0.3)" : "rgba(255,255,255,0.1)"}
                            strokeWidth={(hlHidden || hlDropout) ? 1.5 : 1}
                            opacity={connectionOpacity("concat", "hidden")}
                            strokeDasharray={hlDropout && droppedNeurons.has(hi) ? "3 3" : undefined}
                        />
                    ))}

                    {/* ── Connections: hidden → output ── */}
                    {hiddenYs.map((hy, hi) =>
                        outputYs.map((oy, oi) => (
                            <line key={`ho-${hi}-${oi}`}
                                x1={hiddenX + 14} y1={hy}
                                x2={outputX - 14} y2={oy}
                                stroke={hlHidden ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.1)"}
                                strokeWidth={hlHidden ? 1 : 0.8}
                                opacity={connectionOpacity("hidden", "output")}
                                strokeDasharray={hlDropout && droppedNeurons.has(hi) ? "3 3" : undefined}
                            />
                        ))
                    )}

                    {/* ── Input characters ── */}
                    {ctxChars.map((ch, i) => (
                        <g key={`in-${i}`}>
                            <rect
                                x={inputX - 14} y={inputYs[i] - 12} width={28} height={24} rx={4}
                                fill={hlCtx ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.04)"}
                                stroke={hlCtx ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.1)"}
                                strokeWidth={hlCtx ? 1.5 : 1}
                            />
                            <text x={inputX} y={inputYs[i] + 4} textAnchor="middle"
                                fill={hlCtx ? "rgba(251,191,36,0.9)" : "rgba(255,255,255,0.5)"}
                                fontSize={12} fontFamily="monospace" fontWeight={700}>
                                {`'${ch}'`}
                            </text>
                        </g>
                    ))}

                    {/* ── Embedding vectors ── */}
                    {embYs.map((ey, i) => (
                        <g key={`emb-${i}`}>
                            <rect
                                x={embX - 18} y={ey - 10} width={36} height={20} rx={3}
                                fill={hlEmb ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.03)"}
                                stroke={hlEmb ? "rgba(56,189,248,0.5)" : "rgba(255,255,255,0.08)"}
                                strokeWidth={hlEmb ? 1.5 : 1}
                            />
                            <text x={embX} y={ey + 4} textAnchor="middle"
                                fill={hlEmb ? "rgba(56,189,248,0.8)" : "rgba(255,255,255,0.3)"}
                                fontSize={8} fontFamily="monospace">
                                {hlEmb ? `D=${i === 0 ? "10" : ".."}` : `e${i + 1}`}
                            </text>
                        </g>
                    ))}

                    {/* ── Concat point ── */}
                    <circle cx={concatX} cy={midY} r={6}
                        fill={hlCtx ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.05)"}
                        stroke={hlCtx ? "rgba(251,191,36,0.5)" : "rgba(255,255,255,0.15)"}
                        strokeWidth={1.5}
                    />
                    <text x={concatX} y={midY - 14} textAnchor="middle"
                        fill={hlCtx ? "rgba(251,191,36,0.7)" : "rgba(255,255,255,0.2)"}
                        fontSize={7} fontFamily="monospace">
                        concat
                    </text>

                    {/* ── Hidden neurons ── */}
                    {hiddenYs.map((hy, i) => (
                        <Neuron
                            key={`h-${i}`}
                            x={hiddenX} y={hy} r={12}
                            fill={
                                hlDropout && droppedNeurons.has(i)
                                    ? "rgba(244,63,94,0.08)"
                                    : hlHidden
                                    ? "rgba(139,92,246,0.15)"
                                    : "rgba(255,255,255,0.04)"
                            }
                            stroke={
                                hlDropout && droppedNeurons.has(i)
                                    ? "rgba(244,63,94,0.5)"
                                    : hlHidden
                                    ? "rgba(139,92,246,0.5)"
                                    : "rgba(255,255,255,0.12)"
                            }
                            opacity={hlDropout && droppedNeurons.has(i) ? 0.4 : 1}
                            pulsing={hlHidden && !droppedNeurons.has(i)}
                            crossed={hlDropout && droppedNeurons.has(i)}
                        />
                    ))}

                    {/* ── Output neurons ── */}
                    {outputYs.map((oy, i) => (
                        <Neuron
                            key={`o-${i}`}
                            x={outputX} y={oy} r={12}
                            fill="rgba(255,255,255,0.04)"
                            stroke="rgba(255,255,255,0.12)"
                        />
                    ))}

                    {/* ── Layer labels ── */}
                    <text x={inputX} y={H - 12} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={8} fontFamily="monospace">Input</text>
                    <text x={embX} y={H - 12} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={8} fontFamily="monospace">C</text>
                    <text x={hiddenX} y={H - 12} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={8} fontFamily="monospace">Hidden</text>
                    <text x={outputX} y={H - 12} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={8} fontFamily="monospace">Output</text>

                    {/* ── W₁ and W₂ labels on connections ── */}
                    <text x={(concatX + hiddenX) / 2} y={midY - 75} textAnchor="middle"
                        fill={hlHidden ? "rgba(139,92,246,0.6)" : "rgba(255,255,255,0.15)"}
                        fontSize={10} fontFamily="monospace" fontWeight={700}>
                        W₁
                    </text>
                    <text x={(hiddenX + outputX) / 2} y={midY - 75} textAnchor="middle"
                        fill={hlHidden ? "rgba(139,92,246,0.6)" : "rgba(255,255,255,0.15)"}
                        fontSize={10} fontFamily="monospace" fontWeight={700}>
                        W₂
                    </text>

                    {/* ── LR gradient arrows (when learning_rate selected) ── */}
                    {hlLR && (
                        <>
                            {/* Backward arrows from output to input */}
                            <defs>
                                <marker id="lr-arrow" viewBox="0 0 6 6" refX={6} refY={3} markerWidth={5} markerHeight={5} orient="auto-start-reverse">
                                    <path d="M0,0 L6,3 L0,6 Z" fill="rgba(52,211,153,0.6)" />
                                </marker>
                            </defs>
                            <motion.line
                                x1={outputX - 20} y1={midY + 80}
                                x2={inputX + 20} y2={midY + 80}
                                stroke="rgba(52,211,153,0.3)" strokeWidth={2}
                                strokeDasharray="6 4"
                                markerEnd="url(#lr-arrow)"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                            />
                            <text x={W / 2} y={midY + 96} textAnchor="middle"
                                fill="rgba(52,211,153,0.5)" fontSize={8} fontFamily="monospace">
                                W ← W − lr × ∂L/∂W
                            </text>
                        </>
                    )}
                </svg>
            </div>

            {/* ── Detail panel for selected knob ── */}
            <AnimatePresence mode="wait">
                {activeKnob && (
                    <motion.div
                        key={activeKnob.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className={`rounded-xl border ${activeKnob.borderColor} ${activeKnob.bgColor} p-4 space-y-2`}
                    >
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-mono font-bold ${activeKnob.color}`}>
                                {activeKnob.label}
                            </span>
                            <span className="text-[9px] font-mono text-white/30">
                                Range: {activeKnob.range}
                            </span>
                        </div>
                        <p className="text-[11px] text-white/50 leading-relaxed">
                            {activeKnob.description}
                        </p>
                        <div className="flex items-center gap-4 pt-1">
                            <div className="text-[9px] font-mono text-white/25">
                                <span className="text-white/40">Effect:</span> {activeKnob.effect}
                            </div>
                            <div className={`text-[10px] font-mono ${activeKnob.color} opacity-60`}>
                                {activeKnob.formula}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!selected && (
                <p className="text-[9px] font-mono text-white/20 text-center">
                    Click a knob above to see where it lives in the architecture
                </p>
            )}
        </div>
    );
}
