"use client";

import { memo, useCallback, useState } from "react";
import { useI18n } from "@/i18n/context";

import { AnimatePresence, motion } from "framer-motion";

/*
  MLPNetworkDiagram
  A cinematic, interactive MLP architecture diagram that explicitly defines
  "Multi-Layer Perceptron" by breaking down the name:
    Multi-Layer = input + hidden layer(s) + output
    Perceptron  = each neuron computes weighted sum + activation

  Features:
  - Color-coded layers: Input (amber), Hidden (emerald), Output (rose)
  - Click any layer to highlight it and see its description
  - Animated data flow pulse along connections
  - Name breakdown banner at the top
  - Parameter count visualization showing the "size" of the beast
  - Inline neuron zoom showing it's the same as NN chapter neuron
*/

const LAYERS = [
    {
        id: "input",
        label: "Input",
        subtitle: "3 characters",
        nodes: 4,
        nodeLabels: ["h", "e", "l", "..."],
        color: "#f59e0b",
        desc: "The raw input: the last N characters, encoded as numbers and fed into the network. How we encode them matters a lot — we'll explore that soon.",
        paramCount: 0,
    },
    {
        id: "hidden",
        label: "Hidden Layer",
        subtitle: "128 neurons",
        nodes: 5,
        nodeLabels: ["h₁", "h₂", "h₃", "h₄", "h₅"],
        color: "#10b981",
        desc: "Pattern detectors — neurons that learn to recognize letter sequences, vowel pairs, common combinations. Each one computes a weighted sum of ALL inputs, adds a bias, and applies tanh.",
        paramCount: 81 * 128 + 128, // W1 + b1
    },
    {
        id: "output",
        label: "Output",
        subtitle: "27 probabilities",
        nodes: 4,
        nodeLabels: ["P(a)", "P(b)", "...", "P(z)"],
        color: "#f43f5e",
        desc: "Each output neuron connects to ALL 128 hidden neurons (128 weights + 1 bias = 129 params each). Softmax then turns these raw scores into probabilities.",
        paramCount: 128 * 27 + 27, // W2 + b2
    },
] as const;

type LayerId = typeof LAYERS[number]["id"];
const TOTAL_PARAMS = LAYERS.reduce((sum, l) => sum + l.paramCount, 0);

const NODE_R = 14;
const COL_GAP = 130;
const ROW_GAP = 36;
const PAD_X = 60;
const PAD_Y = 50;

const MAX_NODES = Math.max(...LAYERS.map(l => l.nodes));
const SVG_W = PAD_X * 2 + (LAYERS.length - 1) * COL_GAP;
const SVG_H = PAD_Y * 2 + (MAX_NODES - 1) * ROW_GAP + 20;

function nodeX(li: number) { return PAD_X + li * COL_GAP; }
function nodeY(li: number, ni: number) {
    const count = LAYERS[li].nodes;
    const totalH = (MAX_NODES - 1) * ROW_GAP;
    const layerH = (count - 1) * ROW_GAP;
    return PAD_Y + (totalH - layerH) / 2 + ni * ROW_GAP;
}

function formatParams(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
}

export const MLPNetworkDiagram = memo(function MLPNetworkDiagram() {
    const { t } = useI18n();
    const [selected, setSelected] = useState<LayerId | null>(null);
    const [animPhase, setAnimPhase] = useState(0);
    const [zoomedNeuron, setZoomedNeuron] = useState<{ layer: LayerId; index: number } | null>(null);

    const handleLayerClick = useCallback((id: LayerId) => {
        setSelected(prev => prev === id ? null : id);
    }, []);

    const handleNeuronClick = useCallback((layerId: LayerId, neuronIndex: number) => {
        if (layerId === "hidden") {
            setZoomedNeuron(prev => prev?.layer === layerId && prev.index === neuronIndex ? null : { layer: layerId, index: neuronIndex });
        }
    }, []);

    const startAnimation = useCallback(() => {
        setAnimPhase(0);
        let phase = 0;
        const interval = setInterval(() => {
            phase++;
            if (phase > LAYERS.length) {
                clearInterval(interval);
                setAnimPhase(0);
                return;
            }
            setAnimPhase(phase);
        }, 600);
    }, []);

    const selectedLayer = LAYERS.find(l => l.id === selected);

    // Build connections between adjacent layers
    const connections: { srcLi: number; srcNi: number; dstLi: number; dstNi: number }[] = [];
    for (let li = 0; li < LAYERS.length - 1; li++) {
        for (let si = 0; si < LAYERS[li].nodes; si++) {
            for (let di = 0; di < LAYERS[li + 1].nodes; di++) {
                connections.push({ srcLi: li, srcNi: si, dstLi: li + 1, dstNi: di });
            }
        }
    }

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Name breakdown banner */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">The name says it all:</span>
                <div className="flex items-center gap-1">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
                        Multi-Layer
                    </span>
                    <span className="text-white/20 text-xs">=</span>
                    <span className="text-[10px] text-white/40 font-mono">input + hidden + output</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="px-2.5 py-1 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-mono font-bold">
                        Perceptron
                    </span>
                    <span className="text-white/20 text-xs">=</span>
                    <span className="text-[10px] text-white/40 font-mono">each neuron: Σ(w×x) + b → activation</span>
                </div>
            </div>

            {/* SVG Diagram */}
            <div className="w-full overflow-x-auto">
                <div className="min-w-[520px]">
                    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ height: Math.min(SVG_H, 260) }}>
                        <defs>
                            {LAYERS.map(l => (
                                <radialGradient key={l.id} id={`glow-${l.id}`}>
                                    <stop offset="0%" stopColor={l.color} stopOpacity={0.4} />
                                    <stop offset="100%" stopColor={l.color} stopOpacity={0} />
                                </radialGradient>
                            ))}
                        </defs>

                        {/* Connections */}
                        {connections.map((c, ci) => {
                            const x1 = nodeX(c.srcLi) + NODE_R;
                            const y1 = nodeY(c.srcLi, c.srcNi);
                            const x2 = nodeX(c.dstLi) - NODE_R;
                            const y2 = nodeY(c.dstLi, c.dstNi);
                            const srcLayer = LAYERS[c.srcLi];
                            const dstLayer = LAYERS[c.dstLi];
                            const isSrcSelected = selected === srcLayer.id;
                            const isDstSelected = selected === dstLayer.id;
                            const isHighlighted = isSrcSelected || isDstSelected;
                            const isDimmed = selected && !isHighlighted;
                            const isAnimated = animPhase > 0 && animPhase === c.dstLi + 1;

                            return (
                                <line
                                    key={ci}
                                    x1={x1} y1={y1} x2={x2} y2={y2}
                                    stroke={isAnimated ? dstLayer.color : isHighlighted ? srcLayer.color : "#ffffff"}
                                    strokeOpacity={isDimmed ? 0.02 : isAnimated ? 0.6 : isHighlighted ? 0.35 : 0.06}
                                    strokeWidth={isAnimated ? 1.8 : isHighlighted ? 1.2 : 0.6}
                                    style={{ transition: "stroke-opacity 0.2s, stroke-width 0.2s" }}
                                />
                            );
                        })}

                        {/* Nodes */}
                        {LAYERS.map((layer, li) =>
                            Array.from({ length: layer.nodes }).map((_, ni) => {
                                const cx = nodeX(li);
                                const cy = nodeY(li, ni);
                                const isSelected = selected === layer.id;
                                const isDimmed = selected && !isSelected;
                                const isAnimated = animPhase === li + 1;

                                return (
                                    <g key={`${layer.id}-${ni}`} style={{ cursor: layer.id === "hidden" ? "pointer" : "default" }} onClick={() => {
                                        handleLayerClick(layer.id);
                                        if (layer.id === "hidden") {
                                            handleNeuronClick(layer.id, ni);
                                        }
                                    }}>
                                        {(isSelected || isAnimated) && (
                                            <circle cx={cx} cy={cy} r={NODE_R * 2.2} fill={`url(#glow-${layer.id})`} />
                                        )}
                                        <circle
                                            cx={cx} cy={cy} r={NODE_R}
                                            fill={layer.color}
                                            fillOpacity={isDimmed ? 0.15 : isSelected || isAnimated ? 0.9 : 0.5}
                                            stroke={layer.color}
                                            strokeOpacity={isSelected ? 1 : 0.3}
                                            strokeWidth={isSelected ? 2 : 1}
                                            style={{ transition: "fill-opacity 0.2s" }}
                                        />
                                        {layer.id === "hidden" && (
                                            <circle
                                                cx={cx} cy={cy} r={NODE_R + 3}
                                                fill="none"
                                                stroke={layer.color}
                                                strokeOpacity={0.3}
                                                strokeWidth={0.5}
                                                strokeDasharray="2 2"
                                                className="pointer-events-none"
                                            />
                                        )}
                                        <text
                                            x={cx} y={cy + 4}
                                            fontSize={li === 0 ? 10 : 7}
                                            fontFamily="monospace"
                                            fontWeight="bold"
                                            fill="#fff"
                                            fillOpacity={isDimmed ? 0.3 : 0.9}
                                            textAnchor="middle"
                                            className="pointer-events-none select-none"
                                        >
                                            {layer.nodeLabels[ni]}
                                        </text>
                                    </g>
                                );
                            })
                        )}

                        {/* Layer labels at top */}
                        {LAYERS.map((layer, li) => (
                            <g key={`label-${layer.id}`} onClick={() => handleLayerClick(layer.id)} style={{ cursor: "pointer" }}>
                                <text
                                    x={nodeX(li)} y={14}
                                    fontSize={9} fontFamily="monospace" fontWeight="bold"
                                    fill={layer.color} fillOpacity={0.9}
                                    textAnchor="middle"
                                    className="select-none uppercase tracking-wider"
                                >
                                    {layer.label}
                                </text>
                                <text
                                    x={nodeX(li)} y={24}
                                    fontSize={7} fontFamily="monospace"
                                    fill={layer.color} fillOpacity={0.4}
                                    textAnchor="middle"
                                    className="select-none"
                                >
                                    {layer.subtitle}
                                </text>
                            </g>
                        ))}

                        {/* Arrows between layers */}
                        {LAYERS.slice(0, -1).map((_, li) => {
                            const x = (nodeX(li) + nodeX(li + 1)) / 2;
                            const y = SVG_H - 10;
                            return (
                                <text
                                    key={`arr-${li}`}
                                    x={x} y={y}
                                    fontSize={12}
                                    fill="#ffffff"
                                    fillOpacity={0.15}
                                    textAnchor="middle"
                                    className="select-none"
                                >
                                    →
                                </text>
                            );
                        })}
                    </svg>
                </div>
            </div>

            {/* Layer description card */}
            <AnimatePresence mode="wait">
                {selectedLayer && (
                    <motion.div
                        key={selectedLayer.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-xl border p-4"
                        style={{
                            borderColor: `${selectedLayer.color}33`,
                            backgroundColor: `${selectedLayer.color}08`,
                        }}
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: selectedLayer.color }} />
                            <div>
                                <span className="font-mono font-bold text-xs" style={{ color: selectedLayer.color }}>
                                    {selectedLayer.label}
                                </span>
                                {selectedLayer.paramCount > 0 && (
                                    <span className="text-[9px] font-mono text-white/25 ml-2">
                                        {formatParams(selectedLayer.paramCount)} parameters
                                    </span>
                                )}
                                <p className="text-[11px] text-white/50 mt-1 leading-relaxed">{selectedLayer.desc}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Inline neuron zoom — replaces the old sliding panel */}
            <AnimatePresence mode="wait">
                {zoomedNeuron && zoomedNeuron.layer === "hidden" && (
                    <motion.div
                        key="neuron-zoom"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] to-transparent p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                        <span className="text-sm font-mono font-bold text-emerald-400">h{zoomedNeuron.index + 1}</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-mono font-bold text-emerald-400">
                                            {t("models.mlp.narrative.s01.neuronZoomTitle")}
                                        </p>
                                        <p className="text-[9px] font-mono text-white/25">
                                            Same operation as NN chapter — just with more inputs
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setZoomedNeuron(null)}
                                    className="text-white/30 hover:text-white/60 text-sm transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Visual formula */}
                            <div className="rounded-xl bg-black/20 p-4 space-y-3">
                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                    <div className="flex flex-col items-center">
                                        <div className="flex gap-0.5">
                                            {["x₁", "x₂", "x₃", "...", "x₈₁"].map((x, i) => (
                                                <div key={i} className="w-7 h-7 rounded bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                                                    <span className="text-[7px] font-mono text-amber-400">{x}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-[8px] font-mono text-white/20 mt-1">81 inputs</span>
                                    </div>
                                    <span className="text-white/20 text-lg">×</span>
                                    <div className="flex flex-col items-center">
                                        <div className="flex gap-0.5">
                                            {["w₁", "w₂", "w₃", "...", "w₈₁"].map((w, i) => (
                                                <div key={i} className="w-7 h-7 rounded bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                                                    <span className="text-[7px] font-mono text-emerald-400">{w}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-[8px] font-mono text-white/20 mt-1">81 weights</span>
                                    </div>
                                    <span className="text-white/20 text-lg">+</span>
                                    <div className="flex flex-col items-center">
                                        <div className="w-7 h-7 rounded bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                                            <span className="text-[7px] font-mono text-violet-400">b</span>
                                        </div>
                                        <span className="text-[8px] font-mono text-white/20 mt-1">bias</span>
                                    </div>
                                    <span className="text-white/20 text-lg">→</span>
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-7 rounded bg-emerald-500/25 border border-emerald-500/30 flex items-center justify-center">
                                            <span className="text-[8px] font-mono text-emerald-300 font-bold">tanh</span>
                                        </div>
                                        <span className="text-[8px] font-mono text-white/20 mt-1">activation</span>
                                    </div>
                                    <span className="text-white/20 text-lg">→</span>
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-7 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                            <span className="text-[8px] font-mono text-emerald-400 font-bold">out</span>
                                        </div>
                                        <span className="text-[8px] font-mono text-white/20 mt-1">(-1, 1)</span>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-mono text-emerald-400/60">
                                        output = tanh(w₁x₁ + w₂x₂ + ... + w₈₁x₈₁ + b)
                                    </p>
                                </div>
                            </div>

                            {/* Key insight */}
                            <div className="text-[11px] text-white/45 leading-relaxed">
                                <strong className="text-emerald-300/70">It&apos;s exactly the same neuron from the previous chapter</strong> — weighted sum, bias, activation.
                                The only difference? Instead of 2-3 inputs, each hidden neuron in this MLP receives <strong className="text-amber-300/70">81 inputs</strong> (3 characters × 27 one-hot values).
                                With 128 neurons, that&apos;s <strong className="text-violet-300/70">{formatParams(81 * 128)} weights</strong> just for this layer.
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Parameter count bar */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-white/25 uppercase tracking-widest">Total trainable parameters</span>
                    <span className="text-sm font-mono font-bold text-violet-400">{TOTAL_PARAMS.toLocaleString()}</span>
                </div>
                <div className="flex gap-1 h-3 rounded-full overflow-hidden">
                    {LAYERS.filter(l => l.paramCount > 0).map(l => (
                        <motion.div
                            key={l.id}
                            initial={{ width: 0 }}
                            animate={{ width: `${(l.paramCount / TOTAL_PARAMS) * 100}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: l.color + '60' }}
                            title={`${l.label}: ${formatParams(l.paramCount)}`}
                        />
                    ))}
                </div>
                <div className="flex justify-between text-[9px] font-mono text-white/20">
                    {LAYERS.filter(l => l.paramCount > 0).map(l => (
                        <span key={l.id} style={{ color: l.color + '80' }}>
                            {l.label}: {formatParams(l.paramCount)}
                        </span>
                    ))}
                </div>
                <p className="text-[10px] text-white/25 font-mono text-center">
                    Every single one of these numbers is learned during training via gradient descent.
                </p>
            </div>

            {/* Animate button */}
            <div className="flex justify-center gap-3">
                <motion.button
                    onClick={startAnimation}
                    disabled={animPhase > 0}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500/15 to-emerald-500/10 border border-violet-500/20 text-[11px] font-mono font-bold text-violet-400 hover:from-violet-500/25 hover:to-emerald-500/15 transition-all disabled:opacity-30 shadow-[0_0_20px_rgba(139,92,246,0.08)]"
                >
                    {animPhase > 0 ? "Flowing..." : "▶ Watch data flow through the network"}
                </motion.button>
            </div>
        </div>
    );
});
