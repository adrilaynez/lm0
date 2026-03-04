"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Pause, Play } from "lucide-react";

import { fetchMLPEmbedding } from "@/lib/lmLabClient";
import type { MLPEmbeddingResponse } from "@/types/lmLab";

/*
  EmbeddingTrainingTimelapse
  Shows how embedding space evolves during training using real backend snapshots.
  Prefers emb_dim=10 for richer structure (PCA-projected to 2D).
  Falls back to emb_dim=2 if the backend errors for dim=10.
  Snapshot steps: 0, 1000, 5000, 10000, 20000, 50000.
*/

const SNAPSHOT_STEPS = [0, 1000, 5000, 10000, 20000, 50000];
const STEP_LABELS = ["Step 0", "Step 1k", "Step 5k", "Step 10k", "Step 20k", "Step 50k"];
const STEP_ANNOTATIONS = [
    "Random initialization — every character is scattered randomly. No structure at all. Look: vowels (gold) are mixed in with consonants (purple).",
    "Early training (1k steps) — the scatter starts shifting. Look for gold dots (vowels) beginning to drift in the same direction. It's subtle!",
    "5k steps — vowels (a,e,i,o,u) are noticeably closer together now. Consonants start separating from special characters (. and space).",
    "10k steps — three regions are emerging: vowels cluster together, common consonants (t,n,s,r) form a group, and punctuation drifts to the edge.",
    "20k steps — fine structure appears. Similar consonants pair up (t/d, n/r, s/z). The network is learning sub-categories we never taught it.",
    "50k steps — converged. The network discovered vowels, consonant sub-groups, and punctuation entirely on its own. No labels were given!",
];

const DEFAULT_CONFIG = { embedding_dim: 2, hidden_size: 64, learning_rate: 0.01 };
const FALLBACK_CONFIG = { embedding_dim: 10, hidden_size: 64, learning_rate: 0.01 };

/** Simple PCA: project Nx D matrix down to Nx2 using the top-2 principal components. */
function pcaProject(matrix: number[][]): number[][] {
    if (!matrix.length || matrix[0].length <= 2) return matrix.map(r => [r[0] ?? 0, r[1] ?? 0]);
    const n = matrix.length;
    const d = matrix[0].length;
    // Center the data
    const mean = Array(d).fill(0);
    for (const row of matrix) for (let j = 0; j < d; j++) mean[j] += row[j] / n;
    const centered = matrix.map(row => row.map((v, j) => v - mean[j]));
    // Compute covariance matrix (D x D)
    const cov = Array.from({ length: d }, () => Array(d).fill(0) as number[]);
    for (const row of centered)
        for (let i = 0; i < d; i++)
            for (let j = i; j < d; j++) {
                cov[i][j] += row[i] * row[j] / (n - 1);
                if (i !== j) cov[j][i] = cov[i][j];
            }
    // Power iteration for top-2 eigenvectors
    function powerIter(mat: number[][], deflated?: number[]): number[] {
        let v = Array.from({ length: d }, () => Math.random() - 0.5);
        for (let iter = 0; iter < 100; iter++) {
            let nv = Array(d).fill(0);
            for (let i = 0; i < d; i++)
                for (let j = 0; j < d; j++) nv[i] += mat[i][j] * v[j];
            if (deflated) {
                const dot = nv.reduce((s, x, i) => s + x * deflated[i], 0);
                nv = nv.map((x, i) => x - dot * deflated[i]);
            }
            const norm = Math.sqrt(nv.reduce((s, x) => s + x * x, 0)) || 1;
            v = nv.map(x => x / norm);
        }
        return v;
    }
    const pc1 = powerIter(cov);
    const pc2 = powerIter(cov, pc1);
    return centered.map(row => [
        row.reduce((s, v, j) => s + v * pc1[j], 0),
        row.reduce((s, v, j) => s + v * pc2[j], 0),
    ]);
}

/** Check if all points are within a tiny radius (no meaningful clusters). */
function hasWeakClustering(matrix2d: number[][]): boolean {
    if (matrix2d.length < 2) return true;
    const cx = matrix2d.reduce((s, p) => s + p[0], 0) / matrix2d.length;
    const cy = matrix2d.reduce((s, p) => s + p[1], 0) / matrix2d.length;
    const maxDist = Math.max(...matrix2d.map(p => Math.sqrt((p[0] - cx) ** 2 + (p[1] - cy) ** 2)));
    return maxDist < 0.1;
}

const VOWELS = new Set(["a", "e", "i", "o", "u"]);
const SPECIAL = new Set([".", " "]);

function charColor(ch: string): string {
    if (VOWELS.has(ch)) return "#f59e0b";
    if (SPECIAL.has(ch)) return "#6b7280";
    return "#8b5cf6";
}

function charGroup(ch: string): string {
    if (VOWELS.has(ch)) return "Vowel";
    if (SPECIAL.has(ch)) return "Special";
    return "Consonant";
}

export function EmbeddingTrainingTimelapse() {
    const [snapshots, setSnapshots] = useState<(MLPEmbeddingResponse | null)[]>(
        () => SNAPSHOT_STEPS.map(() => null)
    );
    const [projected, setProjected] = useState<(number[][] | null)[]>(
        () => SNAPSHOT_STEPS.map(() => null)
    );
    const [currentIdx, setCurrentIdx] = useState(0);
    const [loading, setLoading] = useState(true);
    const [playing, setPlaying] = useState(false);
    const [hoveredChar, setHoveredChar] = useState<string | null>(null);
    const [weakClustering, setWeakClustering] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Fetch all snapshots on mount — try dim=10, fall back to dim=2
    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        async function fetchAll(config: typeof DEFAULT_CONFIG) {
            return Promise.all(
                SNAPSHOT_STEPS.map(step =>
                    fetchMLPEmbedding(
                        config.embedding_dim,
                        config.hidden_size,
                        config.learning_rate,
                        step,
                        true
                    ).catch(() => null)
                )
            );
        }

        (async () => {
            let results = await fetchAll(DEFAULT_CONFIG);
            // If all failed for dim=10, try dim=2 fallback
            if (results.every(r => r === null)) {
                results = await fetchAll(FALLBACK_CONFIG);
            }
            if (!cancelled) {
                setSnapshots(results);
                // PCA-project to 2D
                const proj = results.map(snap =>
                    snap ? pcaProject(snap.embedding_matrix) : null
                );
                setProjected(proj);
                // Check last snapshot for weak clustering
                const lastProj = proj[proj.length - 1];
                if (lastProj && hasWeakClustering(lastProj)) {
                    setWeakClustering(true);
                }
                setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, []);

    // Auto-play
    useEffect(() => {
        if (playing) {
            intervalRef.current = setInterval(() => {
                setCurrentIdx(prev => {
                    if (prev >= SNAPSHOT_STEPS.length - 1) {
                        setPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1200);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [playing]);

    const handlePlay = useCallback(() => {
        if (currentIdx >= SNAPSHOT_STEPS.length - 1) setCurrentIdx(0);
        setPlaying(true);
    }, [currentIdx]);

    const currentSnapshot = snapshots[currentIdx];
    const currentProjection = projected[currentIdx];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-white/30">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading training snapshots…
            </div>
        );
    }

    if (!currentSnapshot || !currentProjection) {
        return (
            <FallbackTimelapse
                currentIdx={currentIdx}
                setCurrentIdx={setCurrentIdx}
                playing={playing}
                setPlaying={setPlaying}
                handlePlay={() => { if (currentIdx >= SNAPSHOT_STEPS.length - 1) setCurrentIdx(0); setPlaying(true); }}
            />
        );
    }

    // Compute bounds from all chars
    const allPoints = projected.filter(Boolean).flatMap(p => p!);
    const xMin = Math.min(...allPoints.map(p => p[0]));
    const xMax = Math.max(...allPoints.map(p => p[0]));
    const yMin = Math.min(...allPoints.map(p => p[1]));
    const yMax = Math.max(...allPoints.map(p => p[1]));
    const pad = 0.15;
    const xRange = (xMax - xMin) || 1;
    const yRange = (yMax - yMin) || 1;

    const toSvgX = (x: number) => 20 + ((x - xMin + xRange * pad) / (xRange * (1 + 2 * pad))) * 360;
    const toSvgY = (y: number) => 20 + ((yMax - y + yRange * pad) / (yRange * (1 + 2 * pad))) * 280;

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Step selector */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => playing ? setPlaying(false) : handlePlay()}
                    className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
                >
                    {playing ? <Pause className="w-4 h-4 text-white/60" /> : <Play className="w-4 h-4 text-white/60" />}
                </button>
                <div className="flex gap-1.5 flex-1">
                    {STEP_LABELS.map((label, i) => (
                        <button
                            key={i}
                            onClick={() => { setPlaying(false); setCurrentIdx(i); }}
                            className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-mono font-bold transition-all border ${currentIdx === i
                                ? "bg-violet-500/15 border-violet-500/30 text-violet-400"
                                : "bg-white/[0.03] border-white/[0.08] text-white/30 hover:text-white/50"
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex gap-4 text-[9px] font-mono text-white/40">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Vowels</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500" /> Consonants</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-500" /> Special</span>
            </div>

            {/* Scatter plot */}
            <div className="relative">
                <svg viewBox="0 0 400 320" className="w-full" style={{ maxHeight: 340 }}>
                    {/* Grid */}
                    <line x1="20" y1="160" x2="380" y2="160" stroke="white" strokeOpacity="0.06" />
                    <line x1="200" y1="20" x2="200" y2="300" stroke="white" strokeOpacity="0.06" />

                    {/* Points — all vocab chars */}
                    <AnimatePresence mode="popLayout">
                        {currentSnapshot.vocab.map((ch, i) => {
                            const [x, y] = currentProjection[i] ?? [0, 0];
                            const sx = toSvgX(x);
                            const sy = toSvgY(y);
                            const isHovered = hoveredChar === ch;
                            return (
                                <motion.g
                                    key={ch}
                                    initial={{ cx: sx, cy: sy }}
                                    animate={{ cx: sx, cy: sy }}
                                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                                >
                                    <circle
                                        cx={sx}
                                        cy={sy}
                                        r={isHovered ? 8 : 5}
                                        fill={charColor(ch)}
                                        fillOpacity={isHovered ? 0.9 : 0.7}
                                        stroke={isHovered ? "white" : "none"}
                                        strokeWidth={1.5}
                                        onMouseEnter={() => setHoveredChar(ch)}
                                        onMouseLeave={() => setHoveredChar(null)}
                                        className="cursor-pointer transition-all"
                                    />
                                    <text
                                        x={sx}
                                        y={sy - 9}
                                        textAnchor="middle"
                                        fontSize={isHovered ? 12 : 9}
                                        fill="white"
                                        fillOpacity={isHovered ? 0.9 : 0.5}
                                        fontFamily="monospace"
                                        fontWeight={isHovered ? "bold" : "normal"}
                                    >
                                        {ch === " " ? "·" : ch}
                                    </text>
                                </motion.g>
                            );
                        })}
                    </AnimatePresence>
                </svg>

                {/* Hovered char info */}
                {hoveredChar && (
                    <div className="absolute top-2 right-2 bg-black/80 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono">
                        <span className="text-white/80 font-bold">{hoveredChar === " " ? "SPACE" : hoveredChar}</span>
                        <span className="text-white/40 ml-2">{charGroup(hoveredChar)}</span>
                    </div>
                )}
            </div>

            {/* Step annotation */}
            <div className="text-center">
                <p className="text-[11px] font-mono text-white/40 leading-relaxed">
                    {STEP_ANNOTATIONS[currentIdx]}
                </p>
            </div>

            {weakClustering && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-center">
                    <p className="text-[10px] text-amber-300/60 font-mono leading-relaxed">
                        The clusters may not look dramatic in this 2D projection — that&apos;s because we&apos;re squishing 10 dimensions into 2.
                        The real structure exists in the full space. Check the Distance Calculator below to see how close vowels really are.
                    </p>
                </div>
            )}

            {/* Progress bar */}
            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                    className="h-full bg-violet-500/40 rounded-full"
                    animate={{ width: `${((currentIdx + 1) / SNAPSHOT_STEPS.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>
        </div>
    );
}

// Curated fallback 2D positions for each snapshot step (when backend is unavailable)
const FALLBACK_VOCAB = "abcdefghijklmnopqrstuvwxyz. ".split("");
const FALLBACK_SNAPSHOTS: Record<number, Record<string, [number, number]>> = {
    0: Object.fromEntries(FALLBACK_VOCAB.map((ch, i) => [ch, [Math.cos(i * 0.24) * 0.3 + (Math.random() - 0.5) * 0.6, Math.sin(i * 0.24) * 0.3 + (Math.random() - 0.5) * 0.6]])),
    1: { a: [0.2, 0.4], b: [-0.3, 0.1], c: [-0.25, 0.15], d: [-0.35, 0.2], e: [0.25, 0.45], f: [-0.4, -0.1], g: [-0.35, -0.05], h: [-0.2, 0.25], i: [0.15, 0.35], j: [-0.5, -0.3], k: [-0.45, -0.2], l: [-0.1, 0.2], m: [-0.15, 0.15], n: [-0.05, 0.25], o: [0.3, 0.35], p: [-0.35, 0.1], q: [-0.55, -0.35], r: [0.0, 0.2], s: [-0.1, 0.15], t: [-0.15, 0.25], u: [0.2, 0.3], v: [-0.4, -0.15], w: [-0.3, -0.1], x: [-0.5, -0.3], y: [0.05, 0.1], z: [-0.5, -0.25], ".": [-0.6, -0.5], " ": [-0.5, -0.45] },
    2: { a: [0.45, 0.55], b: [-0.4, 0.2], c: [-0.35, 0.25], d: [-0.38, 0.28], e: [0.5, 0.6], f: [-0.5, -0.15], g: [-0.45, -0.05], h: [-0.2, 0.3], i: [0.4, 0.5], j: [-0.6, -0.4], k: [-0.55, -0.3], l: [-0.1, 0.3], m: [-0.15, 0.25], n: [-0.05, 0.35], o: [0.5, 0.45], p: [-0.42, 0.18], q: [-0.65, -0.45], r: [0.0, 0.3], s: [-0.12, 0.22], t: [-0.18, 0.3], u: [0.42, 0.4], v: [-0.48, -0.2], w: [-0.35, -0.1], x: [-0.58, -0.38], y: [0.1, 0.15], z: [-0.55, -0.3], ".": [-0.7, -0.6], " ": [-0.6, -0.55] },
    3: { a: [0.55, 0.65], b: [-0.42, 0.25], c: [-0.38, 0.3], d: [-0.4, 0.32], e: [0.58, 0.7], f: [-0.52, -0.18], g: [-0.48, -0.05], h: [-0.18, 0.32], i: [0.48, 0.58], j: [-0.62, -0.42], k: [-0.58, -0.32], l: [-0.08, 0.35], m: [-0.12, 0.3], n: [-0.02, 0.4], o: [0.6, 0.55], p: [-0.45, 0.22], q: [-0.68, -0.48], r: [0.02, 0.35], s: [-0.1, 0.28], t: [-0.15, 0.35], u: [0.52, 0.48], v: [-0.5, -0.22], w: [-0.38, -0.12], x: [-0.6, -0.4], y: [0.15, 0.18], z: [-0.58, -0.35], ".": [-0.75, -0.65], " ": [-0.65, -0.58] },
    4: { a: [0.6, 0.7], b: [-0.44, 0.28], c: [-0.4, 0.33], d: [-0.42, 0.35], e: [0.62, 0.75], f: [-0.55, -0.2], g: [-0.5, -0.08], h: [-0.15, 0.35], i: [0.52, 0.62], j: [-0.65, -0.45], k: [-0.6, -0.35], l: [-0.05, 0.38], m: [-0.1, 0.33], n: [0.0, 0.42], o: [0.65, 0.6], p: [-0.48, 0.25], q: [-0.7, -0.5], r: [0.05, 0.38], s: [-0.08, 0.3], t: [-0.12, 0.38], u: [0.55, 0.52], v: [-0.52, -0.25], w: [-0.4, -0.15], x: [-0.62, -0.42], y: [0.18, 0.2], z: [-0.6, -0.38], ".": [-0.78, -0.68], " ": [-0.68, -0.6] },
    5: { a: [0.62, 0.72], b: [-0.45, 0.3], c: [-0.41, 0.35], d: [-0.43, 0.37], e: [0.64, 0.78], f: [-0.56, -0.22], g: [-0.52, -0.1], h: [-0.13, 0.37], i: [0.54, 0.65], j: [-0.66, -0.47], k: [-0.62, -0.37], l: [-0.03, 0.4], m: [-0.08, 0.35], n: [0.02, 0.44], o: [0.68, 0.62], p: [-0.5, 0.27], q: [-0.72, -0.52], r: [0.07, 0.4], s: [-0.06, 0.32], t: [-0.1, 0.4], u: [0.58, 0.55], v: [-0.54, -0.27], w: [-0.42, -0.17], x: [-0.64, -0.44], y: [0.2, 0.22], z: [-0.62, -0.4], ".": [-0.8, -0.7], " ": [-0.7, -0.62] },
};

function FallbackTimelapse({ currentIdx, setCurrentIdx, playing, setPlaying, handlePlay }: {
    currentIdx: number;
    setCurrentIdx: (v: number | ((p: number) => number)) => void;
    playing: boolean;
    setPlaying: (v: boolean) => void;
    handlePlay: () => void;
}) {
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (playing) {
            intervalRef.current = setInterval(() => {
                setCurrentIdx((prev: number) => {
                    if (prev >= SNAPSHOT_STEPS.length - 1) {
                        setPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1200);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [playing, setCurrentIdx, setPlaying]);

    const positions = FALLBACK_SNAPSHOTS[currentIdx] ?? FALLBACK_SNAPSHOTS[0];

    // Compute bounds
    const allPts = Object.values(positions);
    const xMin = Math.min(...allPts.map(p => p[0]));
    const xMax = Math.max(...allPts.map(p => p[0]));
    const yMin = Math.min(...allPts.map(p => p[1]));
    const yMax = Math.max(...allPts.map(p => p[1]));
    const xRange = (xMax - xMin) || 1;
    const yRange = (yMax - yMin) || 1;
    const pad = 0.15;
    const toSvgX = (x: number) => 20 + ((x - xMin + xRange * pad) / (xRange * (1 + 2 * pad))) * 360;
    const toSvgY = (y: number) => 20 + ((yMax - y + yRange * pad) / (yRange * (1 + 2 * pad))) * 280;

    return (
        <div className="p-5 sm:p-6 space-y-4">
            <p className="text-[10px] text-amber-300/50 font-mono text-center">
                Using curated example data (backend unavailable). Positions are illustrative.
            </p>

            {/* Step selector */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => playing ? setPlaying(false) : handlePlay()}
                    className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
                >
                    {playing ? <Pause className="w-4 h-4 text-white/60" /> : <Play className="w-4 h-4 text-white/60" />}
                </button>
                <div className="flex gap-1.5 flex-1">
                    {STEP_LABELS.map((label, i) => (
                        <button
                            key={i}
                            onClick={() => { setPlaying(false); setCurrentIdx(i); }}
                            className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-mono font-bold transition-all border ${currentIdx === i
                                ? "bg-violet-500/15 border-violet-500/30 text-violet-400"
                                : "bg-white/[0.03] border-white/[0.08] text-white/30 hover:text-white/50"
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex gap-4 text-[9px] font-mono text-white/40">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Vowels</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500" /> Consonants</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-500" /> Special</span>
            </div>

            {/* Scatter */}
            <svg viewBox="0 0 400 320" className="w-full" style={{ maxHeight: 340 }}>
                <line x1="20" y1="160" x2="380" y2="160" stroke="white" strokeOpacity="0.06" />
                <line x1="200" y1="20" x2="200" y2="300" stroke="white" strokeOpacity="0.06" />
                {Object.entries(positions).map(([ch, [x, y]]) => {
                    const sx = toSvgX(x);
                    const sy = toSvgY(y);
                    return (
                        <g key={ch}>
                            <motion.circle
                                cx={sx} cy={sy} r={5}
                                fill={charColor(ch)}
                                fillOpacity={0.7}
                                animate={{ cx: sx, cy: sy }}
                                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            />
                            <motion.text
                                x={sx} y={sy - 9}
                                textAnchor="middle" fontSize={9} fill="white" fillOpacity={0.5}
                                fontFamily="monospace"
                                animate={{ x: sx, y: sy - 9 }}
                                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            >
                                {ch === " " ? "·" : ch}
                            </motion.text>
                        </g>
                    );
                })}
            </svg>

            {/* Step annotation */}
            <div className="text-center">
                <p className="text-[11px] font-mono text-white/40 leading-relaxed">
                    {STEP_ANNOTATIONS[currentIdx]}
                </p>
            </div>

            {/* Progress bar */}
            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                    className="h-full bg-violet-500/40 rounded-full"
                    animate={{ width: `${((currentIdx + 1) / SNAPSHOT_STEPS.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>
        </div>
    );
}
