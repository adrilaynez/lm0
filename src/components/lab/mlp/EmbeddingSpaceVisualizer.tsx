"use client";

import { memo,useCallback, useMemo, useState } from "react";

import { Loader2 } from "lucide-react";

import { useI18n } from "@/i18n/context";
import type { MLPEmbeddingResponse } from "@/types/lmLab";

/* ─────────────────────────────────────────────
   EmbeddingSpaceVisualizer
   2D projection of token embeddings showing
   how similar tokens cluster in embedding space.
   Accepts real embedding data via props; performs
   client-side PCA for 2D projection.
   ───────────────────────────────────────────── */

export interface EmbeddingSpaceVisualizerProps {
    embedding: MLPEmbeddingResponse | null;
    embeddingLoading: boolean;
    embeddingError: string | null;
}

interface Token {
    label: string;
    x: number;
    y: number;
}

// Simple 2-component PCA: project N×D matrix to N×2
function pca2D(matrix: number[][]): { x: number; y: number }[] {
    const n = matrix.length;
    if (n === 0) return [];
    const d = matrix[0].length;

    // Center
    const mean = new Array(d).fill(0);
    for (const row of matrix) for (let j = 0; j < d; j++) mean[j] += row[j] / n;
    const centered = matrix.map((row) => row.map((v, j) => v - mean[j]));

    // Covariance (D×D) — only need top-2 eigenvectors via power iteration
    function matVec(mat: number[][], vec: number[]): number[] {
        const out = new Array(d).fill(0);
        for (let i = 0; i < d; i++)
            for (let j = 0; j < d; j++)
                out[i] += mat[i][j] * vec[j];
        return out;
    }

    // Build covariance
    const cov: number[][] = Array.from({ length: d }, () => new Array(d).fill(0));
    for (const row of centered)
        for (let i = 0; i < d; i++)
            for (let j = 0; j < d; j++)
                cov[i][j] += row[i] * row[j] / (n - 1 || 1);

    // Power iteration for first eigenvector
    function powerIter(mat: number[][]): number[] {
        let v = Array.from({ length: d }, (_, i) => (i === 0 ? 1 : 0.1 * Math.sin(i)));
        for (let iter = 0; iter < 50; iter++) {
            const mv = matVec(mat, v);
            const norm = Math.sqrt(mv.reduce((s, x) => s + x * x, 0)) || 1;
            v = mv.map((x) => x / norm);
        }
        return v;
    }

    const e1 = powerIter(cov);

    // Deflate covariance
    const cov2: number[][] = cov.map((row, i) => row.map((v, j) => v - e1[i] * e1[j] * cov.reduce((s, r) => s + r[i] * e1[i], 0)));
    const e2 = powerIter(cov2);

    // Project
    const proj = centered.map((row) => ({
        x: row.reduce((s, v, j) => s + v * e1[j], 0),
        y: row.reduce((s, v, j) => s + v * e2[j], 0),
    }));

    // Normalize to [0.05, 0.95]
    const xs = proj.map((p) => p.x);
    const ys = proj.map((p) => p.y);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;

    return proj.map((p) => ({
        x: 0.05 + ((p.x - xMin) / xRange) * 0.9,
        y: 0.05 + ((p.y - yMin) / yRange) * 0.9,
    }));
}

// ── Token categorization for visual encoding ──────────

type TokenCategory = "vowel" | "consonant" | "digit" | "punctuation" | "whitespace";

const VOWELS = new Set("aeiouAEIOU".split(""));
const DIGITS = new Set("0123456789".split(""));
// Whitespace & special control-like tokens
const WHITESPACE_TOKENS = new Set([" ", "\n", "\t", "\r", "<pad>", "<unk>", "<eos>", "<bos>", "<s>", "</s>"]);

function categorizeToken(label: string): TokenCategory {
    const trimmed = label.trim();
    if (WHITESPACE_TOKENS.has(label) || trimmed.length === 0) return "whitespace";
    // Single-char tokens get precise categorization
    const ch = trimmed.length === 1 ? trimmed : trimmed[0];
    if (DIGITS.has(ch)) return "digit";
    if (VOWELS.has(ch)) return "vowel";
    if (/[a-zA-Z]/.test(ch)) return "consonant";
    return "punctuation";
}

const CATEGORY_COLORS: Record<TokenCategory, { color: string; radius: number }> = {
    vowel: { color: "rgb(52,211,153)", radius: 5.5 },
    consonant: { color: "rgb(96,165,250)", radius: 5 },
    digit: { color: "rgb(250,204,21)", radius: 5 },
    punctuation: { color: "rgb(251,146,60)", radius: 4.5 },
    whitespace: { color: "rgb(168,85,247)", radius: 4 },
};

const CANVAS = { w: 440, h: 360 };
const PAD = 36;

function toSvgX(v: number) { return PAD + v * (CANVAS.w - PAD * 2); }
function toSvgY(v: number) { return PAD + v * (CANVAS.h - PAD * 2); }

function dist(a: Token, b: Token) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export const EmbeddingSpaceVisualizer = memo(function EmbeddingSpaceVisualizer({
    embedding,
    embeddingLoading,
    embeddingError,
}: EmbeddingSpaceVisualizerProps) {
    const { t } = useI18n();
    const [selected, setSelected] = useState<string | null>(null);

    const CATEGORY_STYLE: Record<TokenCategory, { color: string; radius: number; label: string }> = {
        vowel: { ...CATEGORY_COLORS.vowel, label: t("models.mlp.embeddingViz.categories.vowels") },
        consonant: { ...CATEGORY_COLORS.consonant, label: t("models.mlp.embeddingViz.categories.consonants") },
        digit: { ...CATEGORY_COLORS.digit, label: t("models.mlp.embeddingViz.categories.digits") },
        punctuation: { ...CATEGORY_COLORS.punctuation, label: t("models.mlp.embeddingViz.categories.punctuation") },
        whitespace: { ...CATEGORY_COLORS.whitespace, label: t("models.mlp.embeddingViz.categories.spaceSpecial") },
    };

    // Build tokens from real embedding data via PCA
    const tokens: Token[] = useMemo(() => {
        if (!embedding || embedding.embedding_matrix.length === 0) return [];
        const projected = pca2D(embedding.embedding_matrix);
        return embedding.vocab.map((label, i) => ({
            label,
            x: projected[i]?.x ?? 0.5,
            y: projected[i]?.y ?? 0.5,
        }));
    }, [embedding]);

    // Category counts for legend
    const categoryCounts = useMemo(() => {
        const counts: Record<TokenCategory, number> = { vowel: 0, consonant: 0, digit: 0, punctuation: 0, whitespace: 0 };
        for (const tok of tokens) counts[categorizeToken(tok.label)]++;
        return counts;
    }, [tokens]);

    const neighbors = useMemo(() => {
        if (!selected || tokens.length === 0) return new Set<string>();
        const tok = tokens.find((t) => t.label === selected);
        if (!tok) return new Set<string>();
        const sorted = [...tokens]
            .filter((t) => t.label !== selected)
            .sort((a, b) => dist(tok, a) - dist(tok, b));
        return new Set(sorted.slice(0, 4).map((t) => t.label));
    }, [selected, tokens]);

    const selectedToken = tokens.find((t) => t.label === selected);

    const handleClick = useCallback((label: string) => {
        setSelected((prev) => (prev === label ? null : label));
    }, []);

    // Loading state
    if (embeddingLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-violet-400/50 animate-spin mb-3" />
                <p className="text-xs text-white/30 font-mono">{t("models.mlp.embeddingViz.loading")}</p>
            </div>
        );
    }

    // Error state
    if (embeddingError) {
        return (
            <div className="flex items-center gap-2 px-3 py-3 rounded-lg bg-rose-500/[0.04] border border-rose-500/15">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <p className="text-[10px] text-rose-300/60 font-mono">{embeddingError}</p>
            </div>
        );
    }

    // No data yet
    if (tokens.length === 0) {
        return (
            <div className="flex items-center justify-center py-8">
                <p className="text-xs text-white/25 font-mono">{t("models.mlp.embeddingViz.waiting")}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
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

                    {/* Neighbor lines */}
                    {selected && selectedToken && tokens.filter((t: Token) => neighbors.has(t.label)).map((t: Token) => (
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
                    {tokens.map((tok: Token) => {
                        const cat = categorizeToken(tok.label);
                        const style = CATEGORY_STYLE[cat];
                        const isSelected = tok.label === selected;
                        const isNeighbor = neighbors.has(tok.label);
                        const dimmed = selected && !isSelected && !isNeighbor;
                        const r = isSelected ? style.radius + 3 : isNeighbor ? style.radius + 1.5 : style.radius;

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
                                    r={r}
                                    fill={style.color}
                                    stroke={isSelected ? "white" : isNeighbor ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)"}
                                    strokeWidth={isSelected ? 2 : 1}
                                />
                                <text
                                    x={toSvgX(tok.x)}
                                    y={toSvgY(tok.y) - (isSelected ? 12 : 9)}
                                    textAnchor="middle"
                                    fill={isSelected || isNeighbor ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.35)"}
                                    fontSize={isSelected ? 11 : 9}
                                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                                    fontWeight={isSelected ? 700 : 400}
                                >
                                    {tok.label === " " ? "⎵" : tok.label === "\n" ? "↵" : tok.label}
                                </text>
                            </g>
                        );
                    })}

                    {/* Axis labels */}
                    <text x={CANVAS.w / 2} y={CANVAS.h - 6} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize={9} fontFamily="monospace">{t("models.mlp.embeddingViz.dim1")}</text>
                    <text x={10} y={CANVAS.h / 2} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize={9} fontFamily="monospace" transform={`rotate(-90,10,${CANVAS.h / 2})`}>{t("models.mlp.embeddingViz.dim2")}</text>
                </svg>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] font-mono text-white/30">
                {(Object.keys(CATEGORY_STYLE) as TokenCategory[]).filter(c => categoryCounts[c] > 0).map(cat => (
                    <span key={cat} className="inline-flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_STYLE[cat].color }} />
                        {CATEGORY_STYLE[cat].label} ({categoryCounts[cat]})
                    </span>
                ))}
                <span className="text-white/15">·</span>
                <span>{tokens.length} {t("models.mlp.embeddingViz.tokens")}</span>
                {embedding?.config?.emb_dim && (
                    <>
                        <span className="text-white/15">·</span>
                        <span>{embedding.config.emb_dim}D → 2D PCA</span>
                    </>
                )}
            </div>

            {/* Info */}
            <p className="text-[11px] text-white/25 leading-relaxed">
                {selected
                    ? t("models.mlp.embeddingViz.clickToDeselect").replace("{token}", selected)
                    : t("models.mlp.embeddingViz.clickToHighlight")}
            </p>
        </div>
    );
});
