"use client";

import { memo,useEffect, useRef, useState } from "react";


const LAYERS = [
    { id: "input", label: "Input", desc: "Context tokens", nodes: 4, color: "#a78bfa" },
    { id: "hidden1", label: "Hidden 1", desc: "Learned features", nodes: 5, color: "#818cf8" },
    { id: "hidden2", label: "Hidden 2", desc: "Higher-order patterns", nodes: 5, color: "#60a5fa" },
    { id: "output", label: "Output", desc: "Probability dist.", nodes: 3, color: "#34d399" },
] as const;

const TOKENS = ["t", "h", "e", " "];
const OUTPUT_LABELS = ["a", "b", "c"];

type LayerId = typeof LAYERS[number]["id"];
type NodeKey = `${LayerId}-${number}`;

interface Connection { from: NodeKey; to: NodeKey }

function buildConnections(): Connection[] {
    const conns: Connection[] = [];
    for (let li = 0; li < LAYERS.length - 1; li++) {
        const src = LAYERS[li];
        const dst = LAYERS[li + 1];
        for (let si = 0; si < src.nodes; si++) {
            for (let di = 0; di < dst.nodes; di++) {
                conns.push({ from: `${src.id}-${si}`, to: `${dst.id}-${di}` });
            }
        }
    }
    return conns;
}

const ALL_CONNECTIONS = buildConnections();

const NODE_R = 10;
const COL_W = 110;
const ROW_GAP = 28;
const PAD_X = 20;
const PAD_Y = 36;

function nodeY(layerIdx: number, nodeIdx: number, nodeCount: number): number {
    const maxNodes = Math.max(...LAYERS.map(l => l.nodes));
    const totalH = (maxNodes - 1) * ROW_GAP;
    const layerH = (nodeCount - 1) * ROW_GAP;
    return PAD_Y + (totalH - layerH) / 2 + nodeIdx * ROW_GAP;
}

function nodeX(layerIdx: number): number {
    return PAD_X + layerIdx * COL_W;
}

const SVG_W = PAD_X * 2 + (LAYERS.length - 1) * COL_W;
const SVG_H = PAD_Y * 2 + (Math.max(...LAYERS.map(l => l.nodes)) - 1) * ROW_GAP;

export const MLPArchitectureDiagram = memo(function MLPArchitectureDiagram() {
    const [hovered, setHovered] = useState<NodeKey | null>(null);
    const [pulseProgress, setPulseProgress] = useState(0);
    const progressRef = useRef(0);

    useEffect(() => {
        let raf: number;
        let start: number | null = null;
        const duration = 2200;
        function tick(ts: number) {
            if (!start) start = ts;
            const p = ((ts - start) % duration) / duration;
            progressRef.current = p;
            setPulseProgress(p);
            raf = requestAnimationFrame(tick);
        }
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);

    const connectedTo = hovered
        ? new Set(ALL_CONNECTIONS.filter(c => c.from === hovered || c.to === hovered).flatMap(c => [c.from, c.to]))
        : null;

    return (
        <div className="w-full overflow-x-auto py-4" aria-label="MLP architecture diagram">
            <div className="min-w-[460px]">
                <svg
                    viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                    className="w-full"
                    style={{ height: SVG_H }}
                >
                    {/* Connection lines */}
                    {ALL_CONNECTIONS.map((conn, ci) => {
                        const [srcId, si] = conn.from.split("-") as [string, string];
                        const [dstId, di] = conn.to.split("-") as [string, string];
                        const srcLi = LAYERS.findIndex(l => l.id === srcId);
                        const dstLi = LAYERS.findIndex(l => l.id === dstId);
                        const x1 = nodeX(srcLi) + NODE_R;
                        const y1 = nodeY(srcLi, +si, LAYERS[srcLi].nodes);
                        const x2 = nodeX(dstLi) - NODE_R;
                        const y2 = nodeY(dstLi, +di, LAYERS[dstLi].nodes);
                        const isHighlighted = connectedTo?.has(conn.from) && connectedTo?.has(conn.to);
                        const isDimmed = hovered && !isHighlighted;

                        const pulseX = x1 + (x2 - x1) * pulseProgress;
                        const pulseY = y1 + (y2 - y1) * pulseProgress;
                        const showPulse = !hovered && ci % 3 === Math.floor(pulseProgress * 3) % 3;

                        return (
                            <g key={ci}>
                                <line
                                    x1={x1} y1={y1} x2={x2} y2={y2}
                                    stroke={isHighlighted ? "#a78bfa" : "#ffffff"}
                                    strokeOpacity={isDimmed ? 0.03 : isHighlighted ? 0.6 : 0.07}
                                    strokeWidth={isHighlighted ? 1.5 : 0.8}
                                />
                                {showPulse && (
                                    <circle cx={pulseX} cy={pulseY} r={2.5} fill="#a78bfa" opacity={0.7} />
                                )}
                                {isHighlighted && (
                                    <text
                                        x={(x1 + x2) / 2}
                                        y={(y1 + y2) / 2 - 5}
                                        fontSize={7}
                                        fill="#c4b5fd"
                                        textAnchor="middle"
                                        className="pointer-events-none select-none"
                                    >
                                        w×x
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Nodes */}
                    {LAYERS.map((layer, li) =>
                        Array.from({ length: layer.nodes }).map((_, ni) => {
                            const key: NodeKey = `${layer.id}-${ni}`;
                            const cx = nodeX(li);
                            const cy = nodeY(li, ni, layer.nodes);
                            const isHov = hovered === key;
                            const isDimmed = hovered && !connectedTo?.has(key);
                            const isInput = li === 0;
                            const isOutput = li === LAYERS.length - 1;

                            return (
                                <g key={key}>
                                    <circle
                                        cx={cx} cy={cy} r={NODE_R}
                                        fill={layer.color}
                                        fillOpacity={isDimmed ? 0.15 : isHov ? 1 : 0.55}
                                        stroke={layer.color}
                                        strokeOpacity={isHov ? 1 : 0.4}
                                        strokeWidth={isHov ? 2 : 1}
                                        style={{ cursor: "pointer", transition: "fill-opacity 0.15s, stroke-opacity 0.15s" }}
                                        onMouseEnter={() => setHovered(key)}
                                        onMouseLeave={() => setHovered(null)}
                                        aria-label={`${layer.label} node ${ni + 1}`}
                                    />
                                    {isInput && (
                                        <text
                                            x={cx} y={cy + 4}
                                            fontSize={8} fontFamily="monospace"
                                            fill="#fff" textAnchor="middle"
                                            className="pointer-events-none select-none"
                                        >
                                            {TOKENS[ni] === " " ? "␣" : TOKENS[ni]}
                                        </text>
                                    )}
                                    {isOutput && (
                                        <text
                                            x={cx + NODE_R + 6} y={cy + 4}
                                            fontSize={8} fontFamily="monospace"
                                            fill="#34d399" textAnchor="start"
                                            className="pointer-events-none select-none"
                                        >
                                            {OUTPUT_LABELS[ni]}
                                        </text>
                                    )}
                                </g>
                            );
                        })
                    )}

                    {/* Layer labels */}
                    {LAYERS.map((layer, li) => (
                        <text
                            key={layer.id}
                            x={nodeX(li)}
                            y={8}
                            fontSize={8}
                            fontFamily="monospace"
                            fontWeight="bold"
                            fill={layer.color}
                            fillOpacity={0.8}
                            textAnchor="middle"
                            className="select-none uppercase tracking-widest"
                        >
                            {layer.label}
                        </text>
                    ))}
                </svg>

                {/* Layer descriptions */}
                <div className="flex justify-around mt-2 px-4">
                    {LAYERS.map(layer => (
                        <span key={layer.id} className="text-[9px] text-white/25 text-center max-w-[80px] font-mono">
                            {layer.desc}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
});
