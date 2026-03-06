"use client";

import { useEffect, useMemo, useState } from "react";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

/*
  DepthLRInteractionHeatmap
  Shows the depth × learning_rate interaction matrix.
  Fetches depth-comparison data and enriches with LR sweep if available,
  otherwise uses a fixed mock table that illustrates the key pattern:
  high LR + deep = explosion, low LR + shallow = underfit.
*/

/* ── Colour scale: green (low loss) → amber → red (high/diverged) ── */
function lossColor(loss: number | null, minL: number, maxL: number): string {
    if (loss === null) return "rgba(239,68,68,0.6)"; // diverged → red
    const t = Math.max(0, Math.min(1, (loss - minL) / (maxL - minL)));
    if (t < 0.5) {
        // green → amber
        const u = t * 2;
        const r = Math.round(16 + (245 - 16) * u);
        const g = Math.round(185 + (158 - 185) * u);
        const b = Math.round(129 + (11 - 129) * u);
        return `rgba(${r},${g},${b},0.85)`;
    } else {
        // amber → red
        const u = (t - 0.5) * 2;
        const r = Math.round(245 + (239 - 245) * u);
        const g = Math.round(158 + (68 - 158) * u);
        const b = Math.round(11 + (68 - 11) * u);
        return `rgba(${r},${g},${b},0.85)`;
    }
}

const DEPTHS = [1, 2, 3, 4, 5, 6];
const LRS = [0.003, 0.001, 0.0003, 0.0001];
const LR_LABELS = ["3e-3", "1e-3", "3e-4", "1e-4"];

/* Mock table: val_loss[depthIdx][lrIdx], null = diverged */
const MOCK_GRID: (number | null)[][] = [
    // lr:  3e-3   1e-3   3e-4   1e-4
    [1.88, 1.85, 1.91, 2.05],   // depth 1
    [1.82, 1.78, 1.83, 1.98],   // depth 2
    [1.95, 1.75, 1.80, 1.95],   // depth 3
    [null, 1.81, 1.77, 1.93],   // depth 4  (3e-3 explodes)
    [null, 1.95, 1.79, 1.94],   // depth 5
    [null, null, 1.83, 1.97],   // depth 6  (most LRs explode)
];

interface APIModel {
    label: string;
    config: { num_layers: number; learning_rate: number };
    final_val_loss: number | null;
    diverged: boolean;
}

export function DepthLRInteractionHeatmap() {
    const [apiData, setApiData] = useState<(number | null)[][] | null>(null);
    const [loading, setLoading] = useState(true);
    const [hoveredCell, setHoveredCell] = useState<[number, number] | null>(null);

    useEffect(() => {
        let cancelled = false;
        const base = process.env.NEXT_PUBLIC_LM_LAB_API_URL ?? "http://localhost:8000";
        fetch(`${base}/api/v1/mlp/depth-comparison`)
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then((d: { models: APIModel[] }) => {
                if (cancelled) return;
                // Build grid from real data where available
                const grid: (number | null)[][] = DEPTHS.map((depth, di) =>
                    LRS.map((lr, li) => {
                        const match = d.models.find(
                            m => m.config.num_layers === depth &&
                                Math.abs((m.config.learning_rate ?? 0.001) - lr) < lr * 0.1
                        );
                        if (match) return match.diverged ? null : (match.final_val_loss ?? MOCK_GRID[di][li]);
                        return MOCK_GRID[di][li];
                    })
                );
                setApiData(grid);
                setLoading(false);
            })
            .catch(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const grid = apiData ?? MOCK_GRID;

    const allValues = grid.flat().filter((v): v is number => v !== null);
    const minL = Math.min(...allValues);
    const maxL = Math.max(...allValues);

    const hovered = hoveredCell ? grid[hoveredCell[0]][hoveredCell[1]] : null;
    const hoveredDepth = hoveredCell ? DEPTHS[hoveredCell[0]] : null;
    const hoveredLR = hoveredCell ? LR_LABELS[hoveredCell[1]] : null;

    return (
        <div className="space-y-4">
            {loading && (
                <div className="flex items-center gap-2 text-xs text-[var(--lab-text-muted)]">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading real data…
                </div>
            )}

            {/* Heatmap */}
            <div className="bg-[var(--lab-viz-bg)] rounded-xl border border-[var(--lab-border)] p-4 overflow-x-auto">
                <div className="text-xs text-[var(--lab-text-muted)] mb-3">
                    Val Loss — Depth × Learning Rate
                    {!apiData && <span className="ml-2 text-amber-400/70">(illustrative)</span>}
                </div>

                <table className="w-full border-collapse text-xs">
                    <thead>
                        <tr>
                            <th className="text-left text-[var(--lab-text-muted)] pb-2 pr-3 font-normal w-16">Depth ↓ · LR →</th>
                            {LR_LABELS.map(lr => (
                                <th key={lr} className="text-center pb-2 font-mono text-[var(--lab-text-muted)] font-normal px-1">{lr}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {DEPTHS.map((depth, di) => (
                            <tr key={depth}>
                                <td className="font-mono text-[var(--lab-text-muted)] pr-3 py-1">L={depth}</td>
                                {LRS.map((_, li) => {
                                    const val = grid[di][li];
                                    const isHovered = hoveredCell?.[0] === di && hoveredCell?.[1] === li;
                                    const bg = lossColor(val, minL, maxL);
                                    return (
                                        <td
                                            key={li}
                                            className="px-1 py-1"
                                            onMouseEnter={() => setHoveredCell([di, li])}
                                            onMouseLeave={() => setHoveredCell(null)}
                                        >
                                            <motion.div
                                                className="rounded-md flex items-center justify-center h-9 w-full cursor-default font-mono text-xs font-semibold transition-all"
                                                style={{
                                                    backgroundColor: bg,
                                                    color: "#000",
                                                    outline: isHovered ? "2px solid white" : "none",
                                                    outlineOffset: "1px",
                                                }}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: (di * 4 + li) * 0.015 }}
                                            >
                                                {val === null ? "✕" : val.toFixed(2)}
                                            </motion.div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Colour legend */}
            <div className="flex items-center gap-2 text-xs text-[var(--lab-text-muted)]">
                <div className="flex h-3 flex-1 rounded overflow-hidden">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex-1"
                            style={{ backgroundColor: lossColor(minL + (maxL - minL) * (i / 19), minL, maxL) }}
                        />
                    ))}
                </div>
                <span>{minL.toFixed(2)} (best)</span>
                <span>→</span>
                <span>{maxL.toFixed(2)}</span>
                <span className="ml-2 text-red-400">✕ = diverged</span>
            </div>

            {/* Tooltip */}
            <div className="h-10">
                {hoveredCell && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-[var(--lab-text)]"
                    >
                        <span className="text-[var(--lab-text-muted)]">L={hoveredDepth}, LR={hoveredLR}: </span>
                        {hovered === null
                            ? <span className="text-red-400 font-semibold">DIVERGED — loss exploded during training</span>
                            : <>val_loss = <span className="font-mono font-bold">{hovered.toFixed(3)}</span></>
                        }
                    </motion.div>
                )}
            </div>

            {/* Key pattern callout */}
            <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                    { label: "High LR + Deep", desc: "Gradient explosion — diverges", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
                    { label: "Low LR + Any", desc: "Stable but slow to converge", color: "text-amber-300", bg: "bg-amber-500/10 border-amber-500/20" },
                    { label: "Med LR + 2–4 layers", desc: "Sweet spot — lowest val loss", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                ].map(({ label, desc, color, bg }) => (
                    <div key={label} className={`rounded-lg border p-2 ${bg}`}>
                        <div className={`font-semibold mb-0.5 ${color}`}>{label}</div>
                        <div className="text-white/50">{desc}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
