"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Shuffle, Sparkles } from "lucide-react";

/*
  ManualEmbeddingBuilder — Redesigned
  Shows a 2D scatter plot of letters positioned by two "features".
  Toggle between meaningful (clustered) and random (chaotic) placement.
  Click any letter to drag its position with sliders.
  The contrast between structured and random positions teaches:
  "Good embeddings = similar letters are nearby."
*/

const CHARS_TO_PLOT = "aeioutnsrhldcmpfgwbykvjxqz".split("");

const PRESET_FEATURES: Record<string, [number, number]> = {
    // Vowels — tight cluster in top-right
    a: [0.78, 0.82], e: [0.82, 0.88], i: [0.86, 0.76], o: [0.74, 0.72], u: [0.80, 0.68],
    // Common consonants — center-right region
    t: [0.50, 0.65], n: [0.46, 0.60], s: [0.54, 0.58], r: [0.42, 0.55], h: [0.48, 0.50],
    l: [0.52, 0.48], d: [0.56, 0.44], c: [0.44, 0.42], m: [0.40, 0.38], p: [0.58, 0.36],
    f: [0.50, 0.32], g: [0.46, 0.28], w: [0.54, 0.70], b: [0.60, 0.26], y: [0.62, 0.72],
    // Rare consonants — bottom-left cluster
    k: [0.18, 0.22], v: [0.22, 0.16], j: [0.14, 0.12], x: [0.10, 0.20], q: [0.08, 0.10],
    z: [0.16, 0.06],
};

function getCharColor(ch: string) {
    if ("aeiou".includes(ch)) return "#a78bfa";
    if ("kvjxqz".includes(ch)) return "#f59e0b";
    return "#60a5fa";
}

function getCharGroup(ch: string) {
    if ("aeiou".includes(ch)) return "vowel";
    if ("kvjxqz".includes(ch)) return "rare";
    return "common";
}

export function ManualEmbeddingBuilder() {
    const [mode, setMode] = useState<"meaningful" | "random">("random");
    const [features, setFeatures] = useState<Record<string, [number, number]>>(() => {
        const random: Record<string, [number, number]> = {};
        for (const ch of CHARS_TO_PLOT) {
            random[ch] = [0.05 + Math.random() * 0.9, 0.05 + Math.random() * 0.9];
        }
        return random;
    });
    const [selectedChar, setSelectedChar] = useState<string | null>(null);
    const [hoveredChar, setHoveredChar] = useState<string | null>(null);
    const randomSeedRef = useRef(0);

    const applyMeaningful = useCallback(() => {
        setFeatures({ ...PRESET_FEATURES });
        setMode("meaningful");
    }, []);

    const applyRandom = useCallback(() => {
        randomSeedRef.current++;
        const next: Record<string, [number, number]> = {};
        for (const ch of CHARS_TO_PLOT) {
            next[ch] = [0.05 + Math.random() * 0.9, 0.05 + Math.random() * 0.9];
        }
        setFeatures(next);
        setMode("random");
    }, []);

    const updateFeature = useCallback((char: string, dim: 0 | 1, value: number) => {
        setFeatures(prev => ({
            ...prev,
            [char]: dim === 0 ? [value, prev[char][1]] : [prev[char][0], value],
        }));
    }, []);

    const points = useMemo(() =>
        CHARS_TO_PLOT.map(ch => ({
            char: ch,
            x: features[ch]?.[0] ?? 0.5,
            y: features[ch]?.[1] ?? 0.5,
            color: getCharColor(ch),
            group: getCharGroup(ch),
        })),
        [features]
    );

    // Compute cluster quality metric (normalized intra-group distance)
    const clusterScore = useMemo(() => {
        const groups = { vowel: [] as number[][], common: [] as number[][], rare: [] as number[][] };
        for (const p of points) {
            groups[p.group as keyof typeof groups].push([p.x, p.y]);
        }
        let totalSpread = 0;
        let count = 0;
        for (const pts of Object.values(groups)) {
            if (pts.length < 2) continue;
            const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
            const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
            const spread = pts.reduce((s, p) => s + Math.sqrt((p[0] - cx) ** 2 + (p[1] - cy) ** 2), 0) / pts.length;
            totalSpread += spread;
            count++;
        }
        const avg = count > 0 ? totalSpread / count : 0;
        // Normalize: 0 = very tight clusters, 1 = fully scattered
        return Math.max(0, Math.min(1, 1 - avg * 4));
    }, [points]);

    const W = 400;
    const H = 360;
    const PAD = 36;

    const active = selectedChar || hoveredChar;

    return (
        <div className="p-4 sm:p-6 space-y-4">
            {/* Toggle + Legend row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex gap-2">
                    <button
                        onClick={applyMeaningful}
                        className={`flex items-center gap-1.5 text-[11px] font-mono px-3 py-2 rounded-lg border transition-all ${mode === "meaningful"
                            ? "border-violet-500/40 bg-violet-500/15 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.1)]"
                            : "border-white/[0.08] text-white/35 hover:text-white/55 hover:border-white/15"
                            }`}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        Meaningful
                    </button>
                    <button
                        onClick={applyRandom}
                        className={`flex items-center gap-1.5 text-[11px] font-mono px-3 py-2 rounded-lg border transition-all ${mode === "random"
                            ? "border-amber-500/40 bg-amber-500/15 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                            : "border-white/[0.08] text-white/35 hover:text-white/55 hover:border-white/15"
                            }`}
                    >
                        <Shuffle className="w-3.5 h-3.5" />
                        Random
                    </button>
                </div>
                <div className="flex gap-4 sm:ml-auto">
                    {[
                        { label: "Vowels", color: "#a78bfa" },
                        { label: "Common", color: "#60a5fa" },
                        { label: "Rare", color: "#f59e0b" },
                    ].map(g => (
                        <div key={g.label} className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color + "70" }} />
                            <span className="text-[10px] font-mono text-white/30">{g.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cluster quality bar */}
            <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-white/25 shrink-0">Cluster quality</span>
                <div className="flex-1 h-2 rounded-full bg-white/[0.05] overflow-hidden">
                    <motion.div
                        className="h-full rounded-full"
                        animate={{
                            width: `${clusterScore * 100}%`,
                            backgroundColor: clusterScore > 0.6 ? "#22c55e" : clusterScore > 0.3 ? "#f59e0b" : "#ef4444",
                        }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
                <span className="text-[9px] font-mono tabular-nums w-8 text-right"
                    style={{ color: clusterScore > 0.6 ? "#22c55e" : clusterScore > 0.3 ? "#f59e0b" : "#ef4444" }}>
                    {Math.round(clusterScore * 100)}%
                </span>
            </div>

            {/* 2D scatter plot */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-2 sm:p-3">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 380 }}>
                    {/* Axes */}
                    <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                    <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                    <text x={W / 2} y={H - 8} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="monospace">
                        Feature 1 (e.g. vowel-ness)
                    </text>
                    <text x={12} y={H / 2} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="monospace"
                        transform={`rotate(-90, 12, ${H / 2})`}>
                        Feature 2 (e.g. frequency)
                    </text>

                    {/* Grid lines */}
                    {[0.25, 0.5, 0.75].map(v => {
                        const gx = PAD + v * (W - 2 * PAD);
                        const gy = PAD + v * (H - 2 * PAD);
                        return (
                            <g key={v}>
                                <line x1={gx} y1={PAD} x2={gx} y2={H - PAD} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 6" />
                                <line x1={PAD} y1={gy} x2={W - PAD} y2={gy} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 6" />
                            </g>
                        );
                    })}

                    {/* Cluster circles (only in meaningful mode) */}
                    {mode === "meaningful" && (
                        <>
                            {[
                                { cx: 0.80, cy: 0.77, r: 0.14, color: "#a78bfa", label: "Vowels" },
                                { cx: 0.50, cy: 0.48, r: 0.22, color: "#60a5fa", label: "Common" },
                                { cx: 0.15, cy: 0.14, r: 0.12, color: "#f59e0b", label: "Rare" },
                            ].map(c => {
                                const ccx = PAD + c.cx * (W - 2 * PAD);
                                const ccy = H - PAD - c.cy * (H - 2 * PAD);
                                const cr = c.r * (W - 2 * PAD);
                                return (
                                    <motion.ellipse
                                        key={c.label}
                                        cx={ccx}
                                        cy={ccy}
                                        rx={cr}
                                        ry={cr * (H - 2 * PAD) / (W - 2 * PAD)}
                                        fill={c.color + "06"}
                                        stroke={c.color + "20"}
                                        strokeWidth={1}
                                        strokeDasharray="4 4"
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.4 }}
                                    />
                                );
                            })}
                        </>
                    )}

                    {/* Points */}
                    {points.map(p => {
                        const cx = PAD + p.x * (W - 2 * PAD);
                        const cy = H - PAD - p.y * (H - 2 * PAD);
                        const isActive = active === p.char;
                        const r = isActive ? 10 : 6;

                        return (
                            <g key={p.char}>
                                {/* Glow for active */}
                                {isActive && (
                                    <circle cx={cx} cy={cy} r={16} fill={p.color + "15"} style={{ pointerEvents: "none" }} />
                                )}
                                <motion.circle
                                    animate={{ cx, cy, r }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    fill={p.color + "50"}
                                    stroke={p.color}
                                    strokeWidth={isActive ? 2 : 1}
                                    style={{ cursor: "pointer" }}
                                    onMouseEnter={() => setHoveredChar(p.char)}
                                    onMouseLeave={() => setHoveredChar(null)}
                                    onClick={() => setSelectedChar(selectedChar === p.char ? null : p.char)}
                                />
                                <motion.text
                                    animate={{ x: cx, y: cy - r - 4 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    textAnchor="middle"
                                    fill={isActive ? p.color : p.color + "C0"}
                                    fontSize={isActive ? "12" : "10"}
                                    fontFamily="monospace"
                                    fontWeight="bold"
                                    style={{ pointerEvents: "none" }}
                                >
                                    {p.char}
                                </motion.text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Selected char editor */}
            <AnimatePresence>
                {selectedChar && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-mono text-white/50">
                                    Move <span className="font-bold text-lg" style={{ color: getCharColor(selectedChar) }}>{selectedChar}</span> around
                                </p>
                                <button
                                    onClick={() => setSelectedChar(null)}
                                    className="text-[9px] font-mono text-white/20 hover:text-white/40 transition-colors"
                                >
                                    close
                                </button>
                            </div>
                            {([0, 1] as const).map(dim => (
                                <div key={dim} className="flex items-center gap-3">
                                    <span className="text-[10px] font-mono text-white/30 w-20 shrink-0">
                                        {dim === 0 ? "Feature 1 →" : "Feature 2 ↑"}
                                    </span>
                                    <input
                                        type="range"
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        value={features[selectedChar]?.[dim] ?? 0.5}
                                        onChange={e => updateFeature(selectedChar, dim, Number(e.target.value))}
                                        className="flex-1 h-2 accent-violet-500"
                                    />
                                    <span className="text-[10px] font-mono text-white/35 w-10 tabular-nums text-right">
                                        {(features[selectedChar]?.[dim] ?? 0).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Insight - contextual based on mode */}
            <motion.div
                key={mode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`rounded-xl border p-4 ${mode === "meaningful"
                    ? "border-emerald-500/15 bg-emerald-500/[0.04]"
                    : "border-rose-500/15 bg-rose-500/[0.04]"
                    }`}
            >
                {mode === "meaningful" ? (
                    <>
                        <p className="text-[10px] font-mono uppercase tracking-widest mb-1.5 text-emerald-400/60">Structured</p>
                        <p className="text-xs text-white/50 leading-relaxed">
                            With meaningful features, <strong className="text-violet-300/80">vowels cluster</strong> in the top-right,{" "}
                            <strong className="text-blue-300/80">common consonants</strong> in the center, and{" "}
                            <strong className="text-amber-300/80">rare consonants</strong> in the bottom-left.
                            Try clicking &quot;Random&quot; to see the difference — the structure vanishes.
                        </p>
                    </>
                ) : (
                    <>
                        <p className="text-[10px] font-mono uppercase tracking-widest mb-1.5 text-rose-400/60">Chaotic</p>
                        <p className="text-xs text-white/50 leading-relaxed">
                            With random numbers, there&apos;s no pattern — vowels and consonants are scattered everywhere.
                            <strong className="text-white/70"> Meaningful features create structure</strong>.
                            The network&apos;s job is to discover features that make similar letters neighbors.
                        </p>
                    </>
                )}
            </motion.div>
        </div>
    );
}
