"use client";

import { memo, useCallback, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  MLPNetworkDiagram
  A cinematic, interactive MLP architecture diagram that explicitly defines
  "Multi-Layer Perceptron" by breaking down the name:
    Multi-Layer = input + hidden layer(s) + output
    Perceptron  = each neuron computes weighted sum + activation

  Features:
  - Color-coded layers: Input (amber), Embedding (violet), Hidden (emerald), Output (rose)
  - Click any layer to highlight it and see its description
  - Animated data flow pulse along connections
  - Name breakdown banner at the top
  - Shows actual architecture: 3 context chars → embed → concat → hidden → softmax → 27 outputs
*/

const LAYERS = [
    {
        id: "input",
        label: "Input",
        subtitle: "3 × 27 one-hot",
        nodes: 4,
        nodeLabels: ["h", "e", "l", "..."],
        color: "#f59e0b",
        desc: "The raw input: N characters encoded as one-hot vectors and concatenated into a single long vector (3 chars × 27 = 81 numbers).",
    },
    {
        id: "hidden",
        label: "Hidden Layer",
        subtitle: "Pattern detectors",
        nodes: 5,
        nodeLabels: ["h₁", "h₂", "h₃", "h₄", "h₅"],
        color: "#10b981",
        desc: "The \"secret sauce\" — neurons that learn to detect patterns like vowel pairs, common bigrams, or letter shapes. This is what makes it an MLP, not just a lookup table.",
    },
    {
        id: "output",
        label: "Output",
        subtitle: "27 probabilities",
        nodes: 4,
        nodeLabels: ["P(a)", "P(b)", "...", "P(z)"],
        color: "#f43f5e",
        desc: "Softmax turns the hidden layer's signals into a probability distribution: one probability per character in the vocabulary.",
    },
] as const;

type LayerId = typeof LAYERS[number]["id"];

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

export const MLPNetworkDiagram = memo(function MLPNetworkDiagram() {
    const [selected, setSelected] = useState<LayerId | null>(null);
    const [animPhase, setAnimPhase] = useState(0);

    const handleLayerClick = useCallback((id: LayerId) => {
        setSelected(prev => prev === id ? null : id);
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
                                    <g key={`${layer.id}-${ni}`} style={{ cursor: "pointer" }} onClick={() => handleLayerClick(layer.id)}>
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
                        className="rounded-xl border p-4 text-sm text-white/60"
                        style={{
                            borderColor: `${selectedLayer.color}33`,
                            backgroundColor: `${selectedLayer.color}08`,
                        }}
                    >
                        <span className="font-mono font-bold text-xs" style={{ color: selectedLayer.color }}>
                            {selectedLayer.label}
                        </span>
                        <span className="text-white/25 mx-2">·</span>
                        <span className="text-[11px]">{selectedLayer.desc}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Animate button */}
            <div className="flex justify-center">
                <button
                    onClick={startAnimation}
                    disabled={animPhase > 0}
                    className="px-4 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-[10px] font-mono font-bold text-violet-400 hover:bg-violet-500/20 transition-colors disabled:opacity-30"
                >
                    {animPhase > 0 ? "Flowing..." : "▶ Watch data flow through the network"}
                </button>
            </div>
        </div>
    );
});
