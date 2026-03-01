"use client";

import { useEffect, useState } from "react";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import { fetchMLPEmbedding } from "@/lib/lmLabClient";
import type { MLPEmbeddingResponse } from "@/types/lmLab";

/*
  EmbeddingQualityComparison
  Side-by-side 2D scatter plots for emb_dim=2 trained with different configs.
  Shows how embedding dimension and hidden size affect learned representations.
  Uses PCA-like projection for dims > 2 (takes first 2 principal components).
*/

const CONFIGS = [
    { label: "dim=2", embedding_dim: 2, hidden_size: 64, learning_rate: 0.01 },
    { label: "dim=10", embedding_dim: 10, hidden_size: 64, learning_rate: 0.01 },
    { label: "dim=32", embedding_dim: 32, hidden_size: 64, learning_rate: 0.01 },
];

const VOWELS = new Set(["a", "e", "i", "o", "u"]);
const SPECIAL = new Set([".", " "]);

function charColor(ch: string): string {
    if (VOWELS.has(ch)) return "#f59e0b";
    if (SPECIAL.has(ch)) return "#6b7280";
    return "#8b5cf6";
}

// Simple 2D projection: take first 2 dims, or PCA if we want better viz
function projectTo2D(matrix: number[][]): number[][] {
    if (matrix.length === 0) return [];
    const dims = matrix[0].length;
    if (dims <= 2) return matrix.map(row => [row[0] ?? 0, row[1] ?? 0]);

    // Compute mean
    const mean = new Array(dims).fill(0);
    for (const row of matrix) {
        for (let j = 0; j < dims; j++) mean[j] += row[j];
    }
    for (let j = 0; j < dims; j++) mean[j] /= matrix.length;

    // Center
    const centered = matrix.map(row => row.map((v, j) => v - mean[j]));

    // Power iteration for top 2 principal components
    function powerIteration(data: number[][], deflated: boolean): number[] {
        let vec = new Array(dims).fill(0).map(() => Math.random() - 0.5);
        let norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
        vec = vec.map(v => v / norm);

        for (let iter = 0; iter < 50; iter++) {
            const newVec = new Array(dims).fill(0);
            for (const row of data) {
                const dot = row.reduce((s, v, j) => s + v * vec[j], 0);
                for (let j = 0; j < dims; j++) newVec[j] += dot * row[j];
            }
            norm = Math.sqrt(newVec.reduce((s, v) => s + v * v, 0)) || 1;
            vec = newVec.map(v => v / norm);
        }
        return vec;
    }

    const pc1 = powerIteration(centered, false);
    // Deflate
    const proj1 = centered.map(row => row.reduce((s, v, j) => s + v * pc1[j], 0));
    const deflected = centered.map((row, i) => row.map((v, j) => v - proj1[i] * pc1[j]));
    const pc2 = powerIteration(deflected, true);

    return centered.map(row => [
        row.reduce((s, v, j) => s + v * pc1[j], 0),
        row.reduce((s, v, j) => s + v * pc2[j], 0),
    ]);
}

interface PanelData {
    label: string;
    vocab: string[];
    points: number[][];
    loading: boolean;
}

export function EmbeddingQualityComparison() {
    const [panels, setPanels] = useState<PanelData[]>(
        CONFIGS.map(c => ({ label: c.label, vocab: [], points: [], loading: true }))
    );

    useEffect(() => {
        let cancelled = false;

        CONFIGS.forEach((config, idx) => {
            fetchMLPEmbedding(config.embedding_dim, config.hidden_size, config.learning_rate)
                .then(res => {
                    if (cancelled) return;
                    const projected = projectTo2D(res.embedding_matrix);
                    setPanels(prev => {
                        const next = [...prev];
                        next[idx] = { label: config.label, vocab: res.vocab, points: projected, loading: false };
                        return next;
                    });
                })
                .catch(() => {
                    if (cancelled) return;
                    setPanels(prev => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], loading: false };
                        return next;
                    });
                });
        });

        return () => { cancelled = true; };
    }, []);

    return (
        <div className="p-4 sm:p-5 space-y-3">
            <div className="flex gap-4 text-[9px] font-mono text-white/40 justify-center">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Vowels</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500" /> Consonants</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-500" /> Special</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {panels.map((panel, idx) => (
                    <ScatterPanel key={idx} panel={panel} />
                ))}
            </div>

            <p className="text-[10px] text-white/30 text-center">
                Higher embedding dimensions capture more structure — vowels cluster tighter, consonant sub-groups emerge.
            </p>
        </div>
    );
}

function ScatterPanel({ panel }: { panel: PanelData }) {
    const [hovered, setHovered] = useState<string | null>(null);

    if (panel.loading) {
        return (
            <div className="aspect-square rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-white/20" />
            </div>
        );
    }

    if (panel.points.length === 0) {
        return (
            <div className="aspect-square rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-center text-[9px] text-white/20">
                N/A
            </div>
        );
    }

    const xs = panel.points.map(p => p[0]);
    const ys = panel.points.map(p => p[1]);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const xRange = (xMax - xMin) || 1;
    const yRange = (yMax - yMin) || 1;
    const pad = 0.15;

    const toX = (x: number) => 8 + ((x - xMin + xRange * pad) / (xRange * (1 + 2 * pad))) * 184;
    const toY = (y: number) => 8 + ((yMax - y + yRange * pad) / (yRange * (1 + 2 * pad))) * 184;

    return (
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-1.5">
            <p className="text-[9px] font-mono font-bold text-violet-400/60 text-center mb-1">{panel.label}</p>
            <svg viewBox="0 0 200 200" className="w-full">
                {panel.vocab.map((ch, i) => {
                    const [px, py] = panel.points[i];
                    const sx = toX(px);
                    const sy = toY(py);
                    const isHovered = hovered === ch;
                    return (
                        <g key={ch}>
                            <circle
                                cx={sx}
                                cy={sy}
                                r={isHovered ? 6 : 3.5}
                                fill={charColor(ch)}
                                fillOpacity={isHovered ? 0.9 : 0.65}
                                stroke={isHovered ? "white" : "none"}
                                strokeWidth={1}
                                onMouseEnter={() => setHovered(ch)}
                                onMouseLeave={() => setHovered(null)}
                                className="cursor-pointer"
                            />
                            {isHovered && (
                                <text
                                    x={sx}
                                    y={sy - 8}
                                    textAnchor="middle"
                                    fontSize={10}
                                    fill="white"
                                    fontFamily="monospace"
                                    fontWeight="bold"
                                >
                                    {ch === " " ? "·" : ch}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
