"use client";

import { useCallback,useMemo, useState } from "react";

/* ─────────────────────────────────────────────
   PedagogicalEmbeddingVisualizer
   A FAKE, illustrative embedding space using invented
   tokens with clearly separable clusters to maximize
   conceptual clarity for beginners.

   This visualizer does NOT use real model data.
   It is explicitly labeled as illustrative to avoid
   confusion with the real embedding visualizer in the
   Hyperparameter Explorer.

   Design: 4 semantic clusters (vowels, consonants,
   punctuation, digits) with hand-crafted positions
   that clearly demonstrate the embedding concept.
   ───────────────────────────────────────────── */

interface FakeToken {
    label: string;
    x: number;
    y: number;
    cluster: string;
}

// Seeded PRNG for reproducible "random-looking" positions
function mulberry32(seed: number) {
    return () => {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Cluster definitions with center positions.
// Vowels & consonants are nearby (both are letters); punctuation & whitespace are nearby.
// Slight overlap between adjacent clusters for realism.
const CLUSTER_DEFS: { name: string; tokens: string[]; cx: number; cy: number; spread: number }[] = [
    { name: "vowels", tokens: ["a", "e", "i", "o", "u"], cx: 0.22, cy: 0.22, spread: 0.08 },
    { name: "consonants", tokens: ["t", "n", "s", "r", "h", "l", "d", "c", "m", "w"], cx: 0.72, cy: 0.22, spread: 0.09 },
    { name: "punctuation", tokens: [".", ",", "!", "?", ";", ":", "'", "-"], cx: 0.20, cy: 0.78, spread: 0.07 },
    { name: "digits", tokens: ["0", "1", "2", "3", "4", "5", "7", "9"], cx: 0.75, cy: 0.75, spread: 0.08 },
    { name: "whitespace", tokens: [" ", "\n"], cx: 0.45, cy: 0.52, spread: 0.05 },
];

// Generate token positions using seeded PRNG around cluster centers
function generateTokens(): FakeToken[] {
    const rng = mulberry32(42);
    const tokens: FakeToken[] = [];
    for (const cluster of CLUSTER_DEFS) {
        for (const label of cluster.tokens) {
            // Box-Muller-ish: two uniform → offset
            const angle = rng() * Math.PI * 2;
            const radius = cluster.spread * Math.sqrt(-2 * Math.log(rng() * 0.98 + 0.01)) * 0.5;
            const x = Math.max(0.05, Math.min(0.95, cluster.cx + radius * Math.cos(angle)));
            const y = Math.max(0.05, Math.min(0.95, cluster.cy + radius * Math.sin(angle)));
            tokens.push({ label, x, y, cluster: cluster.name });
        }
    }
    return tokens;
}

const FAKE_TOKENS: FakeToken[] = generateTokens();

const CLUSTER_COLORS: Record<string, { fill: string; stroke: string; label: string }> = {
    vowels: { fill: "rgb(139,92,246)", stroke: "rgba(139,92,246,0.6)", label: "Vowels" },
    consonants: { fill: "rgb(96,165,250)", stroke: "rgba(96,165,250,0.6)", label: "Consonants" },
    punctuation: { fill: "rgb(251,146,60)", stroke: "rgba(251,146,60,0.6)", label: "Punctuation" },
    digits: { fill: "rgb(52,211,153)", stroke: "rgba(52,211,153,0.6)", label: "Digits" },
    whitespace: { fill: "rgb(168,85,247)", stroke: "rgba(168,85,247,0.6)", label: "Space / Special" },
};

const CANVAS = { w: 440, h: 360 };
const PAD = 36;

function toSvgX(v: number) { return PAD + v * (CANVAS.w - PAD * 2); }
function toSvgY(v: number) { return PAD + v * (CANVAS.h - PAD * 2); }

function dist(a: FakeToken, b: FakeToken) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function PedagogicalEmbeddingVisualizer() {
    const [selected, setSelected] = useState<string | null>(null);

    const neighbors = useMemo(() => {
        if (!selected) return new Set<string>();
        const tok = FAKE_TOKENS.find((t) => t.label === selected);
        if (!tok) return new Set<string>();
        const sorted = [...FAKE_TOKENS]
            .filter((t) => t.label !== selected)
            .sort((a, b) => dist(tok, a) - dist(tok, b));
        return new Set(sorted.slice(0, 4).map((t) => t.label));
    }, [selected]);

    const selectedToken = FAKE_TOKENS.find((t) => t.label === selected);

    const handleClick = useCallback((label: string) => {
        setSelected((prev) => (prev === label ? null : label));
    }, []);

    // Cluster hulls (simplified: draw ellipse around cluster center)
    const clusterCenters = useMemo(() => {
        const clusters: Record<string, { cx: number; cy: number; rx: number; ry: number }> = {};
        for (const [name] of Object.entries(CLUSTER_COLORS)) {
            const members = FAKE_TOKENS.filter(t => t.cluster === name);
            if (members.length === 0) continue;
            const cx = members.reduce((s, t) => s + t.x, 0) / members.length;
            const cy = members.reduce((s, t) => s + t.y, 0) / members.length;
            const rx = Math.max(...members.map(t => Math.abs(t.x - cx))) + 0.06;
            const ry = Math.max(...members.map(t => Math.abs(t.y - cy))) + 0.06;
            clusters[name] = { cx, cy, rx, ry };
        }
        return clusters;
    }, []);

    return (
        <div className="space-y-4">
            {/* Illustrative label */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/[0.04] border border-amber-500/15">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <p className="text-[10px] text-amber-300/60 font-mono">
                    Illustrative example — not real model data. Shows how embeddings group similar tokens.
                </p>
            </div>

            {/* SVG canvas */}
            <div className="rounded-xl border border-white/[0.06] bg-black/30 overflow-hidden">
                <svg viewBox={`0 0 ${CANVAS.w} ${CANVAS.h}`} className="w-full" style={{ maxHeight: 400 }}>
                    {/* Grid lines */}
                    {[0.25, 0.5, 0.75].map((v) => (
                        <g key={v}>
                            <line x1={toSvgX(v)} y1={PAD} x2={toSvgX(v)} y2={CANVAS.h - PAD} stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
                            <line x1={PAD} y1={toSvgY(v)} x2={CANVAS.w - PAD} y2={toSvgY(v)} stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
                        </g>
                    ))}

                    {/* Cluster ellipses */}
                    {Object.entries(clusterCenters).map(([name, { cx, cy, rx, ry }]) => {
                        const color = CLUSTER_COLORS[name];
                        return (
                            <g key={name}>
                                <ellipse
                                    cx={toSvgX(cx)}
                                    cy={toSvgY(cy)}
                                    rx={rx * (CANVAS.w - PAD * 2)}
                                    ry={ry * (CANVAS.h - PAD * 2)}
                                    fill="none"
                                    stroke={color.stroke}
                                    strokeWidth={1}
                                    strokeDasharray="4 4"
                                    opacity={0.3}
                                />
                                <text
                                    x={toSvgX(cx)}
                                    y={toSvgY(cy - ry - 0.03)}
                                    textAnchor="middle"
                                    fill={color.stroke}
                                    fontSize={9}
                                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                                    fontWeight={600}
                                    opacity={0.5}
                                >
                                    {color.label}
                                </text>
                            </g>
                        );
                    })}

                    {/* Neighbor lines */}
                    {selected && selectedToken && FAKE_TOKENS.filter((t) => neighbors.has(t.label)).map((t) => (
                        <line
                            key={t.label}
                            x1={toSvgX(selectedToken.x)}
                            y1={toSvgY(selectedToken.y)}
                            x2={toSvgX(t.x)}
                            y2={toSvgY(t.y)}
                            stroke="rgba(139,92,246,0.3)"
                            strokeWidth={1.5}
                            strokeDasharray="4 3"
                        />
                    ))}

                    {/* Tokens */}
                    {FAKE_TOKENS.map((tok) => {
                        const color = CLUSTER_COLORS[tok.cluster];
                        const isSelected = tok.label === selected;
                        const isNeighbor = neighbors.has(tok.label);
                        const dimmed = selected && !isSelected && !isNeighbor;

                        return (
                            <g
                                key={tok.label}
                                onClick={() => handleClick(tok.label)}
                                className="cursor-pointer"
                                opacity={dimmed ? 0.2 : 1}
                            >
                                <circle
                                    cx={toSvgX(tok.x)}
                                    cy={toSvgY(tok.y)}
                                    r={isSelected ? 8 : isNeighbor ? 6.5 : 5}
                                    fill={color.fill}
                                    stroke={isSelected ? "white" : isNeighbor ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)"}
                                    strokeWidth={isSelected ? 2 : 1}
                                />
                                <text
                                    x={toSvgX(tok.x)}
                                    y={toSvgY(tok.y) - (isSelected ? 12 : 9)}
                                    textAnchor="middle"
                                    fill={isSelected || isNeighbor ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.35)"}
                                    fontSize={isSelected ? 12 : 10}
                                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                                    fontWeight={isSelected ? 700 : 400}
                                >
                                    {tok.label === " " ? "⎵" : tok.label === "\n" ? "↵" : tok.label}
                                </text>
                            </g>
                        );
                    })}

                    {/* Axis labels */}
                    <text x={CANVAS.w / 2} y={CANVAS.h - 6} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize={9} fontFamily="monospace">
                        Learned Dimension 1
                    </text>
                    <text x={10} y={CANVAS.h / 2} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize={9} fontFamily="monospace" transform={`rotate(-90,10,${CANVAS.h / 2})`}>
                        Learned Dimension 2
                    </text>
                </svg>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-[10px] font-mono">
                {Object.entries(CLUSTER_COLORS).map(([name, color]) => (
                    <div key={name} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color.fill }} />
                        <span className="text-white/30">{color.label}</span>
                    </div>
                ))}
            </div>

            {/* Interaction hint */}
            <p className="text-[11px] text-white/25 leading-relaxed">
                {selected
                    ? `Click another token or click "${selected === " " ? "⎵" : selected}" again to deselect. Notice how nearest neighbors tend to be from the same category.`
                    : "Click any token to see its nearest neighbors. Similar characters (like vowels) naturally cluster together in the learned embedding space."}
            </p>
        </div>
    );
}
