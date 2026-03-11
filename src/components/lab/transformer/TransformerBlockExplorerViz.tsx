"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  ╔═════════════════════════════════════════════════════════════════╗
  ║  FLAGSHIP — TransformerBlockExplorerViz                        ║
  ║  The best visualizer on the page. bbycroft.net quality.        ║
  ║  Interactive architecture diagram with zoom-in detail panels.  ║
  ║  All text ≥ 13px HTML, ≥ 9px SVG. Premium glassmorphism.      ║
  ╚═════════════════════════════════════════════════════════════════╝
*/

/* ═══════════════════════════════════════════════════════════════
   DATA MODEL
   ═══════════════════════════════════════════════════════════════ */

const TOKENS = ["The", "professor", "published", "the", "paper"];
const TOKEN_COLORS = ["#22d3ee", "#34d399", "#a78bfa", "#fbbf24", "#f472b6"];
const D_MODEL = 8;

/* Fake embeddings (8-dim) */
const EMBEDDINGS: number[][] = [
    [0.42, 0.78, 0.15, 0.63, 0.91, 0.34, 0.57, 0.22],
    [0.88, 0.31, 0.67, 0.45, 0.12, 0.73, 0.56, 0.89],
    [0.55, 0.42, 0.88, 0.21, 0.67, 0.33, 0.74, 0.48],
    [0.33, 0.65, 0.11, 0.78, 0.44, 0.92, 0.28, 0.61],
    [0.71, 0.19, 0.53, 0.87, 0.38, 0.16, 0.82, 0.45],
];

/* Per-token attention weights (5×5 matrix — who attends to whom) */
const ATTN_MATRIX: number[][] = [
    [0.15, 0.25, 0.30, 0.10, 0.20], /* The → */
    [0.05, 0.35, 0.40, 0.05, 0.15], /* professor → */
    [0.10, 0.30, 0.20, 0.15, 0.25], /* published → */
    [0.10, 0.15, 0.20, 0.15, 0.40], /* the → paper */
    [0.15, 0.35, 0.25, 0.10, 0.15], /* paper → */
];

/* Per-token norm data (before) */
const NORM_BEFORE_ALL: number[][] = [
    [2.8, -1.5, 4.2, -0.1, 2.3, -3.5, 1.2, -1.9],
    [3.2, -1.8, 5.1, -0.3, 2.7, -4.1, 1.5, -2.2],
    [1.9, -2.4, 3.8, 0.5, 3.1, -2.7, 2.0, -1.3],
    [2.5, -0.9, 2.1, -1.7, 4.3, -3.0, 0.8, -2.8],
    [3.7, -2.1, 4.5, 0.2, 1.8, -3.9, 1.1, -1.6],
];

/* Per-token FFN hidden activations (16 of 32 neurons shown) */
const FFN_ALL: number[][] = [
    [0.0, 0.71, 0.0, 0.39, 0.84, 0.0, 0.28, 0.0, 0.59, 0.0, 0.46, 0.0, 0.0, 0.62, 0.33, 0.0],
    [0.0, 0.82, 0.0, 0.45, 0.91, 0.0, 0.33, 0.0, 0.67, 0.0, 0.55, 0.78, 0.0, 0.0, 0.42, 0.88],
    [0.51, 0.0, 0.0, 0.72, 0.0, 0.63, 0.0, 0.41, 0.0, 0.85, 0.0, 0.0, 0.58, 0.0, 0.69, 0.0],
    [0.0, 0.0, 0.65, 0.0, 0.73, 0.0, 0.52, 0.0, 0.0, 0.81, 0.44, 0.0, 0.0, 0.37, 0.0, 0.91],
    [0.0, 0.68, 0.0, 0.0, 0.79, 0.55, 0.0, 0.0, 0.43, 0.0, 0.0, 0.86, 0.61, 0.0, 0.0, 0.74],
];

/* Attention insights per token */
const ATTN_INSIGHTS: string[] = [
    '"The" spreads attention evenly — a function word gathering broad context.',
    '"professor" focuses on "published" (40%) — the verb reveals the subject\'s role.',
    '"published" attends to its subject "professor" (30%) and object "paper" (25%).',
    '"the" focuses heavily on "paper" (40%) — determining which noun it modifies.',
    '"paper" attends to "professor" (35%) — connecting the object to the agent.',
];

/* Stage descriptions shown during flow animation — matches 7-block paper layout */
const STAGE_DESCRIPTIONS: string[] = [
    "Each token enters as a raw embedding vector — meaning + position encoded as numbers.",
    "Masked Multi-Head Attention: each token creates Q, K, V vectors. Queries meet Keys → attention weights → weighted sum of Values. Future tokens are masked.",
    "Add & Norm: the original input is added back (residual highway), then values are normalized to a stable range.",
    "Feed-Forward Network: expand to 4× width, apply ReLU (killing negatives), compress back. Each token thinks privately.",
    "Add & Norm: pre-FFN input added back (second residual), then normalized. Two highways per block.",
    "Linear: project the final representation to logits over the entire vocabulary.",
    "Softmax: convert logits to probabilities — the model's prediction for the next token.",
];


/* Output after block */
const OUTPUT_EMB: number[][] = [
    [0.51, 0.69, 0.28, 0.55, 0.83, 0.45, 0.62, 0.31],
    [0.72, 0.48, 0.81, 0.59, 0.23, 0.67, 0.41, 0.76],
    [0.63, 0.55, 0.73, 0.38, 0.78, 0.42, 0.68, 0.52],
    [0.44, 0.58, 0.22, 0.71, 0.52, 0.85, 0.35, 0.54],
    [0.65, 0.32, 0.61, 0.79, 0.45, 0.28, 0.75, 0.51],
];

/* Helper: compute normalized values from raw */
function normalize(arr: number[]): number[] {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
    const std = Math.sqrt(variance + 1e-5);
    return arr.map(v => +((v - mean) / std).toFixed(2));
}

/* Cosine similarity between two vectors */
function cosineSim(a: number[], b: number[]): number {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-8);
}

/* Pre-computed pairwise similarities */
const INPUT_SIMS = TOKENS.map((_, i) =>
    TOKENS.map((_, j) => cosineSim(EMBEDDINGS[i], EMBEDDINGS[j]))
);
const OUTPUT_SIMS = TOKENS.map((_, i) =>
    TOKENS.map((_, j) => cosineSim(OUTPUT_EMB[i], OUTPUT_EMB[j]))
);

type BlockId = "input" | "pe" | "attn" | "add1" | "ffn" | "add2" | "linear" | "softmax";

/* PE is not in the main BLOCKS array (it's a side element), but needs detail panel info */
const PE_BLOCK_DEF: BlockDef = {
    id: "pe" as BlockId, label: "Positional Encoding", shortLabel: "PE",
    color: "#34d399", icon: "〰️", zoomable: true,
    description: "Tells the model WHERE each token is",
    details: "Without positional encoding, the Transformer treats tokens as a bag — no sense of order.",
};

interface BlockDef {
    id: BlockId;
    label: string;
    shortLabel: string;
    color: string;
    icon: string;
    zoomable: boolean;
    description: string;
    details: string;
}

const BLOCKS: BlockDef[] = [
    {
        id: "input", label: "Input Embedding", shortLabel: "Input\nEmbedding",
        color: "#f0abfc", icon: "📥", zoomable: true,
        description: "Token embeddings + positional encoding",
        details: "Each word is converted into a vector of numbers that captures its meaning and position in the sentence.",
    },
    {
        id: "attn", label: "Masked Multi-Head Attention", shortLabel: "Masked\nMulti-Head\nAttention",
        color: "#f97316", icon: "👁️", zoomable: true,
        description: "Tokens gather context from each other",
        details: "Each token creates Query, Key, and Value vectors. Queries and Keys determine how much attention to pay. Values carry the actual information to gather.",
    },
    {
        id: "add1", label: "Add & Norm", shortLabel: "Add & Norm",
        color: "#facc15", icon: "⊕", zoomable: true,
        description: "Residual add + layer normalization",
        details: "Adds the input that came before attention back to the output, then normalizes. This 'gradient highway' keeps information flowing.",
    },
    {
        id: "ffn", label: "Feed-Forward Network", shortLabel: "Feed\nForward",
        color: "#3b82f6", icon: "🧠", zoomable: true,
        description: "Each token thinks privately",
        details: "A two-layer MLP applied to each token independently. Expands to 4× the dimension, applies ReLU, then compresses back down.",
    },
    {
        id: "add2", label: "Add & Norm", shortLabel: "Add & Norm",
        color: "#facc15", icon: "⊕", zoomable: true,
        description: "Residual add + layer normalization",
        details: "Second residual connection + normalization — ensures the FFN's transformation doesn't destroy information gathered by attention.",
    },
    {
        id: "linear", label: "Linear (Head)", shortLabel: "Linear",
        color: "#a78bfa", icon: "📊", zoomable: true,
        description: "The inverse of the embedding layer",
        details: "The Linear Head does the opposite of the embedding: it takes the d-dimensional representation and projects it to a vector of vocabulary size (e.g. 50,000). Each position becomes a score (logit) for how likely that word is to come next.",
    },
    {
        id: "softmax", label: "Softmax", shortLabel: "Softmax",
        color: "#a78bfa", icon: "📤", zoomable: true,
        description: "Turns scores into probabilities",
        details: "Softmax takes the raw logits and converts them into a probability distribution that sums to 1. The highest probability is the model's best guess for the next word.",
    },
];

/* ═══════════════════════════════════════════════════════════════
   DETAIL PANELS — What you see when you zoom into each component
   ═══════════════════════════════════════════════════════════════ */

/* LayerNorm detail */
function LayerNormDetail({ tokenIdx }: { tokenIdx: number }) {
    const color = TOKEN_COLORS[tokenIdx];
    const name = TOKENS[tokenIdx];
    const before = NORM_BEFORE_ALL[tokenIdx];
    const after = normalize(before);
    return (
        <div className="space-y-4">
            {/* Formula */}
            <div className="px-4 py-3 rounded-xl" style={{ background: "#a78bfa08", border: "1px solid #a78bfa20" }}>
                <p className="text-[14px] font-mono text-center" style={{ color: "#a78bfa" }}>
                    x̂ = (x − μ) / σ · γ + β
                </p>
            </div>

            {/* Before / After bars */}
            <div className="space-y-3">
                <p className="text-[14px] font-semibold text-white/40">Before normalization</p>
                <div className="flex items-end gap-1" style={{ height: 48 }}>
                    {before.map((v, i) => (
                        <motion.div
                            key={i}
                            className="flex-1 rounded-t-sm"
                            style={{ background: "rgba(255,255,255,0.12)" }}
                            initial={{ height: 0 }}
                            animate={{ height: Math.abs(v) * 8 + 2 }}
                            transition={{ delay: i * 0.04, type: "spring", stiffness: 120, damping: 14 }}
                        />
                    ))}
                </div>
                <p className="text-[13px] text-white/20 text-center">Wild range: {Math.min(...before).toFixed(1)} to {Math.max(...before).toFixed(1)}</p>

                <p className="text-[14px] font-semibold" style={{ color: "#a78bfa80" }}>After normalization</p>
                <div className="flex items-end gap-1" style={{ height: 48 }}>
                    {after.map((v, i) => (
                        <motion.div
                            key={i}
                            className="flex-1 rounded-t-sm"
                            style={{ background: "#a78bfa" }}
                            initial={{ height: 0 }}
                            animate={{ height: Math.abs(v) * 28 + 2 }}
                            transition={{ delay: i * 0.04 + 0.3, type: "spring", stiffness: 120, damping: 14 }}
                        />
                    ))}
                </div>
                <p className="text-[13px] text-center" style={{ color: "#a78bfa50" }}>Stable range: {Math.min(...after).toFixed(2)} to {Math.max(...after).toFixed(2)}</p>
            </div>

            {/* Numeric values */}
            <div className="grid grid-cols-8 gap-1">
                {before.map((v, i) => (
                    <div key={i} className="text-center">
                        <span className="text-[11px] font-mono text-white/15 block">{v.toFixed(1)}</span>
                        <span className="text-[11px] font-mono block" style={{ color: "#a78bfa80" }}>{after[i].toFixed(1)}</span>
                    </div>
                ))}
            </div>

            {/* What it does */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="text-[14px]">💡</span>
                <p className="text-[13px] text-white/35 leading-snug">
                    For &quot;<span style={{ color }}>{name}</span>&quot;: wild values get centered around 0 and scaled to a consistent range.
                </p>
            </div>
        </div>
    );
}

/* Positional Encoding detail */
function PositionalEncodingDetail({ tokenIdx }: { tokenIdx: number }) {
    const color = TOKEN_COLORS[tokenIdx];
    const name = TOKENS[tokenIdx];
    const pos = tokenIdx; // position = index in sequence

    /* Fake PE values (sine/cosine pattern) */
    const peValues = Array.from({ length: D_MODEL }, (_, i) =>
        i % 2 === 0
            ? Math.sin(pos / Math.pow(10000, (2 * Math.floor(i / 2)) / D_MODEL))
            : Math.cos(pos / Math.pow(10000, (2 * Math.floor(i / 2)) / D_MODEL))
    );

    return (
        <div className="space-y-4">
            {/* Formula */}
            <div className="px-4 py-3 rounded-xl" style={{ background: "#34d39908", border: "1px solid #34d39920" }}>
                <p className="text-[13px] font-mono text-center" style={{ color: "#34d399" }}>
                    PE(pos, 2i) = sin(pos / 10000<sup>2i/d</sup>)
                </p>
                <p className="text-[13px] font-mono text-center" style={{ color: "#34d399" }}>
                    PE(pos, 2i+1) = cos(pos / 10000<sup>2i/d</sup>)
                </p>
            </div>

            {/* Why needed */}
            <div className="px-3 py-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <p className="text-[13px] text-white/35 leading-relaxed">
                    Attention treats inputs as a <em>set</em> — no inherent order. &quot;The cat sat&quot; and &quot;sat cat the&quot; would look identical. Positional encoding adds a unique fingerprint per position so the model knows <strong className="text-white/50">where</strong> each token is.
                </p>
            </div>

            {/* PE vector for this token */}
            <div>
                <p className="text-[14px] font-semibold mb-2" style={{ color: `${color}80` }}>
                    Position {pos} → &quot;<span style={{ color }}>{name}</span>&quot;
                </p>
                <div className="flex gap-1">
                    {peValues.map((v, i) => (
                        <motion.div
                            key={i}
                            className="flex-1 text-center rounded-md py-1"
                            style={{
                                background: v >= 0 ? `rgba(52,211,153,${Math.abs(v) * 0.25})` : `rgba(244,63,94,${Math.abs(v) * 0.25})`,
                                border: `1px solid ${v >= 0 ? "rgba(52,211,153,0.15)" : "rgba(244,63,94,0.15)"}`,
                            }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.04, type: "spring", stiffness: 200, damping: 15 }}
                        >
                            <span className="text-[9px] font-mono" style={{ color: v >= 0 ? "#34d39990" : "#f43f5e90" }}>
                                {v.toFixed(2)}
                            </span>
                        </motion.div>
                    ))}
                </div>
                <p className="text-[11px] text-white/15 mt-1 text-center">
                    Alternating sin/cos waves at different frequencies — each position gets a unique pattern
                </p>
            </div>

            {/* How it combines */}
            <div className="px-4 py-3 rounded-xl" style={{ background: "rgba(52,211,153,0.03)", border: "1px solid rgba(52,211,153,0.1)" }}>
                <p className="text-[13px] font-semibold mb-1" style={{ color: "#34d399" }}>How it works</p>
                <p className="text-[12px] text-white/25 leading-relaxed">
                    The PE vector is <strong className="text-white/40">added</strong> element-wise to the token embedding:
                    final = embedding + PE. This way each token carries both its <em>meaning</em> and its <em>position</em>.
                </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="text-[14px]">💡</span>
                <p className="text-[13px] text-white/35 leading-snug">
                    Nearby positions have similar PE values (high cosine similarity), while distant positions are different — the model can sense relative distance.
                </p>
            </div>
        </div>
    );
}

/* Input Embedding detail */
function InputEmbeddingDetail({ tokenIdx }: { tokenIdx: number }) {
    const color = TOKEN_COLORS[tokenIdx];
    const name = TOKENS[tokenIdx];
    const emb = EMBEDDINGS[tokenIdx];

    return (
        <div className="space-y-4">
            {/* What happens */}
            <div className="px-4 py-3 rounded-xl" style={{ background: "#f9a8d408", border: "1px solid #f9a8d420" }}>
                <p className="text-[14px] font-mono text-center" style={{ color: "#f9a8d4" }}>
                    embedding[token_id] → vector ∈ ℝ<sup>d</sup>
                </p>
            </div>

            {/* Lookup table visual */}
            <div>
                <p className="text-[14px] font-semibold text-white/40 mb-2">Embedding lookup table</p>
                <div className="space-y-1">
                    {TOKENS.map((tok, i) => {
                        const isThis = i === tokenIdx;
                        const tc = TOKEN_COLORS[i];
                        return (
                            <motion.div
                                key={i}
                                className="flex items-center gap-2 px-2 py-1 rounded-lg"
                                style={{
                                    background: isThis ? `${tc}08` : "transparent",
                                    border: isThis ? `1px solid ${tc}20` : "1px solid transparent",
                                }}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                            >
                                <span className="text-[13px] font-semibold w-20" style={{ color: isThis ? tc : "rgba(255,255,255,0.15)" }}>{tok}</span>
                                <span className="text-[11px] text-white/10 font-mono">→</span>
                                <div className="flex gap-px flex-1">
                                    {EMBEDDINGS[i].map((v, j) => (
                                        <motion.div
                                            key={j}
                                            className="flex-1 rounded-sm"
                                            style={{
                                                height: isThis ? 16 : 8,
                                                background: isThis ? tc : "rgba(255,255,255,0.06)",
                                                opacity: isThis ? v * 0.8 + 0.2 : 0.3,
                                            }}
                                            initial={{ scaleY: 0 }}
                                            animate={{ scaleY: 1 }}
                                            transition={{ delay: i * 0.06 + j * 0.02 }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* The vector */}
            <div>
                <p className="text-[14px] font-semibold mb-1" style={{ color: `${color}80` }}>
                    &quot;<span style={{ color }}>{name}</span>&quot; → {D_MODEL}-dim vector
                </p>
                <div className="flex gap-1">
                    {emb.map((v, i) => (
                        <motion.div
                            key={i}
                            className="flex-1 text-center rounded-md py-1"
                            style={{ background: `${color}${Math.round(v * 20 + 4).toString(16).padStart(2, "0")}`, border: `1px solid ${color}15` }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3 + i * 0.04, type: "spring", stiffness: 200, damping: 15 }}
                        >
                            <span className="text-[10px] font-mono" style={{ color: `${color}90` }}>{v.toFixed(2)}</span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Positional encoding */}
            <div className="px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[13px] font-semibold mb-1 text-white/40">⊕ Then: Positional Encoding</p>
                <p className="text-[12px] text-white/25 leading-relaxed">
                    The embedding captures <em>meaning</em> but not <em>position</em>. A positional vector (based on sine/cosine waves) is added so the model knows where each word sits in the sentence.
                </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="text-[14px]">💡</span>
                <p className="text-[13px] text-white/35 leading-snug">
                    Think of it as a dictionary lookup: each word has a unique row of numbers. These numbers are <em>learned during training</em> — not hand-designed.
                </p>
            </div>
        </div>
    );
}

/* Linear Head detail */
function LinearHeadDetail({ tokenIdx }: { tokenIdx: number }) {
    const color = TOKEN_COLORS[tokenIdx];
    const name = TOKENS[tokenIdx];
    const VOCAB_SIZE = 50000;
    /* Fake top-5 predictions */
    const TOP_PREDICTIONS = [
        { word: "paper", prob: 0.42, color: "#f472b6" },
        { word: "study", prob: 0.18, color: "#a78bfa" },
        { word: "results", prob: 0.12, color: "#60a5fa" },
        { word: "work", prob: 0.09, color: "#34d399" },
        { word: "article", prob: 0.06, color: "#fbbf24" },
    ];

    return (
        <div className="space-y-4">
            {/* Inverse of embedding */}
            <div className="px-4 py-3 rounded-xl" style={{ background: "#a78bfa08", border: "1px solid #a78bfa20" }}>
                <p className="text-[14px] font-mono text-center" style={{ color: "#a78bfa" }}>
                    logits = x · W<sub>vocab</sub><sup>T</sup> + b
                </p>
            </div>

            {/* Size transformation visual */}
            <div className="flex items-center justify-center gap-3">
                <motion.div
                    className="rounded-lg flex flex-col items-center justify-center px-3 py-2"
                    style={{ background: "#22d3ee08", border: "1px solid #22d3ee15" }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <span className="text-[18px] font-bold font-mono" style={{ color: "#22d3ee" }}>{D_MODEL}</span>
                    <span className="text-[10px] text-white/20">dimensions</span>
                </motion.div>
                <motion.span
                    className="text-[16px] font-mono"
                    style={{ color: "#a78bfa60" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >→</motion.span>
                <motion.div
                    className="rounded-lg flex flex-col items-center justify-center px-3 py-2"
                    style={{ background: "#a78bfa08", border: "1px solid #a78bfa15" }}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <span className="text-[18px] font-bold font-mono" style={{ color: "#a78bfa" }}>{VOCAB_SIZE.toLocaleString()}</span>
                    <span className="text-[10px] text-white/20">vocabulary size</span>
                </motion.div>
            </div>

            {/* Explanation */}
            <div className="px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[13px] font-semibold mb-1" style={{ color: "#a78bfa80" }}>🔄 The inverse of embedding</p>
                <p className="text-[12px] text-white/25 leading-relaxed">
                    The embedding layer turned words into {D_MODEL}-dimensional vectors. The Linear Head reverses this: it takes each {D_MODEL}-dim vector and produces a score for <em>every word</em> in the vocabulary. Higher score = more likely next word.
                </p>
            </div>

            {/* Top predictions */}
            <div>
                <p className="text-[14px] font-semibold text-white/40 mb-2">
                    Top predictions after &quot;<span style={{ color }}>{name}</span>&quot;
                </p>
                <div className="space-y-1.5">
                    {TOP_PREDICTIONS.map((pred, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold w-16 text-right" style={{ color: pred.color }}>{pred.word}</span>
                            <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: `linear-gradient(90deg, ${pred.color}40, ${pred.color}80)` }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pred.prob * 100 * 2}%` }}
                                    transition={{ delay: i * 0.08, type: "spring", stiffness: 80, damping: 14 }}
                                />
                            </div>
                            <span className="text-[12px] font-mono w-10 text-right" style={{ color: `${pred.color}80` }}>
                                {(pred.prob * 100).toFixed(0)}%
                            </span>
                        </div>
                    ))}
                </div>
                <p className="text-[11px] text-white/15 mt-1">These are raw logits → still need softmax</p>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="text-[14px]">💡</span>
                <p className="text-[13px] text-white/35 leading-snug">
                    Also called the &quot;unembedding&quot; layer — it undoes the embedding to map back to words.
                </p>
            </div>
        </div>
    );
}

/* Softmax detail */
function SoftmaxDetail() {
    const rawLogits = [3.2, 1.8, 1.1, 0.7, 0.4, -0.2, -1.5];
    const words = ["paper", "study", "results", "work", "article", "data", "other"];
    const colors = ["#f472b6", "#a78bfa", "#60a5fa", "#34d399", "#fbbf24", "#fb923c", "#94a3b8"];
    const maxLogit = Math.max(...rawLogits);
    const exps = rawLogits.map(l => Math.exp(l - maxLogit));
    const sumExp = exps.reduce((a, b) => a + b, 0);
    const probs = exps.map(e => e / sumExp);

    return (
        <div className="space-y-4">
            {/* Formula */}
            <div className="px-4 py-3 rounded-xl" style={{ background: "#a78bfa08", border: "1px solid #a78bfa20" }}>
                <p className="text-[14px] font-mono text-center" style={{ color: "#a78bfa" }}>
                    P(i) = e<sup>z<sub>i</sub></sup> / Σ e<sup>z<sub>j</sub></sup>
                </p>
            </div>

            {/* Logits → Probabilities visual */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <p className="text-[13px] font-semibold text-white/30 mb-2">Raw logits</p>
                    <div className="space-y-1">
                        {rawLogits.map((l, i) => (
                            <motion.div
                                key={i}
                                className="flex items-center gap-1"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <span className="text-[11px] w-12 text-right font-mono" style={{ color: `${colors[i]}60` }}>{words[i]}</span>
                                <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
                                    <div className="h-full rounded-full" style={{ width: `${Math.max(0, l / 4) * 100}%`, background: `${colors[i]}50` }} />
                                </div>
                                <span className="text-[10px] font-mono text-white/20 w-8 text-right">{l.toFixed(1)}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
                <div>
                    <p className="text-[13px] font-semibold mb-2" style={{ color: "#a78bfa80" }}>Probabilities</p>
                    <div className="space-y-1">
                        {probs.map((p, i) => (
                            <motion.div
                                key={i}
                                className="flex items-center gap-1"
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.05 }}
                            >
                                <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
                                    <div className="h-full rounded-full" style={{ width: `${p * 100 * 2}%`, background: `${colors[i]}70` }} />
                                </div>
                                <span className="text-[10px] font-mono w-10 text-right" style={{ color: `${colors[i]}90` }}>{(p * 100).toFixed(1)}%</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Key property */}
            <div className="px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[13px] font-semibold mb-1 text-white/40">Key property</p>
                <p className="text-[12px] text-white/25 leading-relaxed">
                    All probabilities sum to exactly <span className="font-mono font-bold text-white/40">1.0</span> (= 100%).
                    The exponential amplifies differences: the top word gets most of the probability, while low-scoring words get almost none.
                </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="text-[14px]">💡</span>
                <p className="text-[13px] text-white/35 leading-snug">
                    Softmax turns &quot;scores&quot; into &quot;beliefs&quot; — the model&apos;s confidence about each possible next word.
                </p>
            </div>
        </div>
    );
}

/* Self-Attention detail */
function AttentionDetail({ tokenIdx }: { tokenIdx: number }) {
    const color = TOKEN_COLORS[tokenIdx];
    const name = TOKENS[tokenIdx];

    return (
        <div className="space-y-4">
            {/* Pipeline: Embed → Q, K, V → Scores → Softmax → Weighted Sum */}
            <div className="flex items-center justify-center gap-1 flex-wrap">
                {["Q·Kᵀ", "÷ √d", "softmax", "× V"].map((step, i) => (
                    <div key={i} className="flex items-center gap-1">
                        <div
                            className="px-2.5 py-1 rounded-lg text-[13px] font-mono font-semibold"
                            style={{ background: "#22d3ee0a", border: "1px solid #22d3ee20", color: "#22d3ee" }}
                        >
                            {step}
                        </div>
                        {i < 3 && <span className="text-white/10 text-[13px]">→</span>}
                    </div>
                ))}
            </div>

            {/* Attention weights visualization */}
            <div>
                <p className="text-[14px] font-semibold text-white/40 mb-2">
                    &quot;<span style={{ color }}>{name}</span>&quot; attends to:
                </p>
                <div className="space-y-1.5">
                    {TOKENS.map((tok, i) => {
                        const w = ATTN_MATRIX[tokenIdx][i];
                        const tc = TOKEN_COLORS[i];
                        return (
                            <div key={i} className="flex items-center gap-2">
                                <span className="text-[14px] font-semibold w-20 text-right" style={{ color: tc }}>
                                    {tok}
                                </span>
                                <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ background: `linear-gradient(90deg, ${tc}40, ${tc}80)` }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${w * 100}%` }}
                                        transition={{ delay: i * 0.08, type: "spring", stiffness: 80, damping: 14 }}
                                    />
                                </div>
                                <span className="text-[14px] font-mono w-12 text-right" style={{ color: `${tc}80` }}>
                                    {(w * 100).toFixed(0)}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Attention beams mini SVG */}
            <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <svg viewBox="0 0 300 60" className="w-full" style={{ height: 60 }}>
                    {TOKENS.map((_, i) => {
                        const x1 = 30 + tokenIdx * 60;
                        const x2 = 30 + i * 60;
                        const w = ATTN_MATRIX[tokenIdx][i];
                        if (w < 0.03) return null;
                        return (
                            <motion.path
                                key={i}
                                d={`M ${x1} 50 Q ${(x1 + x2) / 2} ${50 - w * 50}, ${x2} 50`}
                                fill="none"
                                stroke={TOKEN_COLORS[i]}
                                strokeWidth={w * 4 + 0.5}
                                strokeLinecap="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: w * 0.7 }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                            />
                        );
                    })}
                    {TOKENS.map((tok, i) => (
                        <text
                            key={`label-${i}`}
                            x={30 + i * 60}
                            y={58}
                            textAnchor="middle"
                            fontSize={10}
                            fontWeight="600"
                            fontFamily="ui-sans-serif, system-ui"
                            fill={TOKEN_COLORS[i]}
                            fillOpacity={0.6}
                        >
                            {tok.slice(0, 4)}
                        </text>
                    ))}
                </svg>
            </div>

            {/* 5×5 Attention Heatmap */}
            <div>
                <p className="text-[14px] font-semibold text-white/40 mb-2">Full attention matrix</p>
                <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    {/* Column headers */}
                    <div className="flex items-center">
                        <div style={{ width: 56 }} />
                        {TOKENS.map((tok, i) => (
                            <div key={i} className="flex-1 text-center py-1">
                                <span className="text-[11px] font-semibold" style={{ color: TOKEN_COLORS[i], opacity: 0.5 }}>{tok.slice(0, 4)}</span>
                            </div>
                        ))}
                    </div>
                    {/* Rows */}
                    {TOKENS.map((tok, row) => (
                        <div key={row} className="flex items-center" style={{ background: row === tokenIdx ? "rgba(255,255,255,0.02)" : "transparent" }}>
                            <div style={{ width: 56 }} className="text-right pr-2 py-1">
                                <span className="text-[11px] font-semibold" style={{ color: TOKEN_COLORS[row], opacity: row === tokenIdx ? 0.8 : 0.3 }}>{tok.slice(0, 4)}</span>
                            </div>
                            {ATTN_MATRIX[row].map((w, col) => (
                                <div key={col} className="flex-1 flex items-center justify-center p-0.5">
                                    <motion.div
                                        className="w-full aspect-square rounded-sm flex items-center justify-center"
                                        style={{
                                            background: `rgba(34,211,238,${w * 0.6})`,
                                            border: row === tokenIdx && col === tokenIdx ? "1px solid rgba(34,211,238,0.3)" : "1px solid transparent",
                                        }}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: (row * 5 + col) * 0.02, type: "spring", stiffness: 200, damping: 15 }}
                                    >
                                        <span className="text-[9px] font-mono" style={{ color: w > 0.25 ? "white" : "rgba(255,255,255,0.15)" }}>
                                            {(w * 100).toFixed(0)}
                                        </span>
                                    </motion.div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                <p className="text-[11px] text-white/15 text-center mt-1">Each row sums to 100%. Brighter = more attention.</p>
            </div>

            {/* QKV dimension breakdown */}
            <div className="grid grid-cols-3 gap-2">
                {[
                    { label: "Query", desc: "What am I looking for?", color: "#f472b6" },
                    { label: "Key", desc: "What do I contain?", color: "#a78bfa" },
                    { label: "Value", desc: "What info to pass?", color: "#34d399" },
                ].map((v) => (
                    <div key={v.label} className="text-center px-2 py-2 rounded-lg" style={{ background: `${v.color}06`, border: `1px solid ${v.color}12` }}>
                        <p className="text-[13px] font-bold" style={{ color: `${v.color}90` }}>{v.label}</p>
                        <p className="text-[11px] text-white/20 mt-0.5">{v.desc}</p>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="text-[14px]">💡</span>
                <p className="text-[13px] text-white/35 leading-snug">
                    {ATTN_INSIGHTS[tokenIdx]}
                </p>
            </div>
        </div>
    );
}

/* Residual Add detail */
function ResidualDetail({ isSecond, tokenIdx }: { isSecond?: boolean; tokenIdx: number }) {
    const srcLabel = isSecond ? "pre-FFN" : "pre-attention";
    const color = TOKEN_COLORS[tokenIdx];
    const name = TOKENS[tokenIdx];
    const original = EMBEDDINGS[tokenIdx];
    const processed = isSecond
        ? original.map((v, i) => v + (OUTPUT_EMB[tokenIdx][i] - v) * 0.6)
        : original.map((v, i) => v + (OUTPUT_EMB[tokenIdx][i] - v) * 0.3);
    const result = original.map((v, i) => v + processed[i]);
    const maxResult = Math.max(...result.map(Math.abs));

    return (
        <div className="space-y-4">
            {/* Formula */}
            <div className="px-4 py-3 rounded-xl" style={{ background: "#34d39908", border: "1px solid #34d39920" }}>
                <p className="text-[14px] font-mono text-center" style={{ color: "#34d399" }}>
                    output = sublayer(x) + x
                </p>
            </div>

            {/* Visual: two vectors adding */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <span className="text-[13px] font-semibold text-white/30 w-20 text-right">Processed</span>
                    <div className="flex-1 flex gap-0.5">
                        {processed.map((v, i) => (
                            <motion.div
                                key={i}
                                className="flex-1 rounded-sm"
                                style={{ background: "#22d3ee", height: Math.abs(v) * 22 + 2 }}
                                initial={{ scaleY: 0 }}
                                animate={{ scaleY: 1 }}
                                transition={{ delay: i * 0.03 }}
                            />
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[14px] font-bold text-center w-20" style={{ color: "#34d399" }}>+</span>
                    <div className="flex-1 h-px" style={{ background: "#34d39930" }} />
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[13px] font-semibold w-20 text-right" style={{ color: `${color}60` }}>Original</span>
                    <div className="flex-1 flex gap-0.5">
                        {original.map((v, i) => (
                            <motion.div
                                key={i}
                                className="flex-1 rounded-sm"
                                style={{ background: color, opacity: 0.4, height: v * 28 + 2 }}
                                initial={{ scaleY: 0 }}
                                animate={{ scaleY: 1 }}
                                transition={{ delay: i * 0.03 + 0.2 }}
                            />
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[14px] font-bold text-center w-20" style={{ color: "#34d399" }}>=</span>
                    <div className="flex-1 h-px" style={{ background: "#34d39930" }} />
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[13px] font-semibold text-white/40 w-20 text-right">Result</span>
                    <div className="flex-1 flex gap-0.5">
                        {result.map((v, i) => (
                            <motion.div
                                key={i}
                                className="flex-1 rounded-sm"
                                style={{
                                    background: "linear-gradient(180deg, #22d3ee80, #34d39980)",
                                    height: (Math.abs(v) / maxResult) * 28 + 2,
                                }}
                                initial={{ scaleY: 0 }}
                                animate={{ scaleY: 1 }}
                                transition={{ delay: i * 0.03 + 0.4 }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Numerical values row */}
            <div className="grid grid-cols-8 gap-1">
                {original.map((v, i) => (
                    <div key={i} className="text-center">
                        <span className="text-[9px] font-mono block" style={{ color: `${color}40` }}>{v.toFixed(1)}</span>
                        <span className="text-[9px] font-mono block text-white/10">+</span>
                        <span className="text-[9px] font-mono block text-cyan-400/30">{processed[i].toFixed(1)}</span>
                        <span className="text-[9px] font-mono block" style={{ color: "#34d39960" }}>{result[i].toFixed(1)}</span>
                    </div>
                ))}
            </div>

            {/* Gradient highway explanation */}
            <div className="px-4 py-3 rounded-xl" style={{ background: "rgba(52,211,153,0.03)", border: "1px solid rgba(52,211,153,0.1)" }}>
                <p className="text-[13px] font-semibold mb-1" style={{ color: "#34d399" }}>Why "gradient highway"?</p>
                <p className="text-[12px] text-white/25 leading-relaxed">
                    During backpropagation, gradients flow through the addition unchanged (∂(x+f)/∂x = 1).
                    This prevents the vanishing gradient problem — deep networks can train reliably.
                </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="text-[14px]">💡</span>
                <p className="text-[13px] text-white/35 leading-snug">
                    For &quot;<span style={{ color }}>{name}</span>&quot;: the {srcLabel} input is added back. Even if the sublayer learns nothing useful, the original information survives.
                </p>
            </div>
        </div>
    );
}

/* FFN detail */
function FFNDetail({ tokenIdx }: { tokenIdx: number }) {
    const color = TOKEN_COLORS[tokenIdx];
    const name = TOKENS[tokenIdx];

    return (
        <div className="space-y-4">
            {/* Shape pipeline */}
            <div className="flex items-center justify-center gap-2">
                {[
                    { label: `d=${D_MODEL}`, w: 60, c: "#94a3b8" },
                    { label: "→", w: 20, c: "transparent" },
                    { label: `4d=${D_MODEL * 4}`, w: 120, c: "#fbbf24" },
                    { label: "→ ReLU →", w: 60, c: "transparent" },
                    { label: `d=${D_MODEL}`, w: 60, c: "#34d399" },
                ].map((s, i) => (
                    s.c === "transparent" ? (
                        <span key={i} className="text-[13px] font-mono" style={{ color: "rgba(255,255,255,0.15)" }}>{s.label}</span>
                    ) : (
                        <motion.div
                            key={i}
                            className="rounded-lg flex items-center justify-center"
                            style={{
                                width: s.w, height: 32,
                                background: `${s.c}0a`,
                                border: `1px solid ${s.c}25`,
                            }}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: i * 0.1, type: "spring", stiffness: 120, damping: 14 }}
                        >
                            <span className="text-[13px] font-mono font-semibold" style={{ color: `${s.c}90` }}>{s.label}</span>
                        </motion.div>
                    )
                ))}
            </div>

            {/* Hidden layer activation (showing ReLU zeros) */}
            <div>
                <p className="text-[14px] font-semibold text-white/40 mb-2">Hidden layer (after ReLU)</p>
                <div className="flex gap-0.5 flex-wrap" style={{ maxWidth: 280 }}>
                    {FFN_ALL[tokenIdx].map((v: number, i: number) => (
                        <motion.div
                            key={i}
                            className="rounded-sm"
                            style={{
                                width: 14, height: 14,
                                background: v === 0 ? "rgba(255,255,255,0.03)" : `rgba(251,191,36,${v * 0.7})`,
                                border: v === 0 ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(251,191,36,0.2)",
                            }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.02, type: "spring", stiffness: 200, damping: 15 }}
                        />
                    ))}
                </div>
                <p className="text-[13px] mt-1.5" style={{ color: "#fbbf2450" }}>
                    {FFN_ALL[tokenIdx].filter((v: number) => v === 0).length} of {FFN_ALL[tokenIdx].length} neurons dead (ReLU → 0)
                </p>
            </div>

            {/* Matrix multiply visualization */}
            <div>
                <p className="text-[14px] font-semibold text-white/40 mb-2">Matrix multiplication (x · W₁)</p>
                <div className="flex items-center justify-center gap-2">
                    {/* Input vector (d_model) */}
                    <div className="flex flex-col gap-px">
                        {EMBEDDINGS[tokenIdx].slice(0, 4).map((v, i) => (
                            <motion.div
                                key={i}
                                className="rounded-sm text-center"
                                style={{
                                    width: 28, height: 14,
                                    background: `rgba(34,211,238,${v * 0.4})`,
                                    border: "1px solid rgba(34,211,238,0.1)",
                                }}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <span className="text-[8px] font-mono text-white/30">{v.toFixed(1)}</span>
                            </motion.div>
                        ))}
                        <p className="text-[9px] text-white/15 text-center mt-0.5">{D_MODEL}×1</p>
                    </div>

                    <span className="text-[13px] text-white/15 font-mono">×</span>

                    {/* Weight matrix (d_model × 4*d_model) shown as small grid */}
                    <div className="flex flex-col gap-px">
                        {Array.from({ length: 4 }).map((_, row) => (
                            <div key={row} className="flex gap-px">
                                {Array.from({ length: 6 }).map((_, col) => (
                                    <motion.div
                                        key={col}
                                        className="rounded-sm"
                                        style={{
                                            width: 10, height: 14,
                                            background: `rgba(251,191,36,${(Math.sin(row * 3 + col * 7) * 0.5 + 0.5) * 0.3})`,
                                            border: "1px solid rgba(251,191,36,0.05)",
                                        }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: (row * 6 + col) * 0.01 }}
                                    />
                                ))}
                            </div>
                        ))}
                        <p className="text-[9px] text-white/15 text-center mt-0.5">{D_MODEL}×{D_MODEL * 4}</p>
                    </div>

                    <span className="text-[13px] text-white/15 font-mono">=</span>

                    {/* Output (4*d_model) */}
                    <div className="flex flex-col gap-px">
                        {FFN_ALL[tokenIdx].slice(0, 4).map((v: number, i: number) => (
                            <motion.div
                                key={i}
                                className="rounded-sm text-center"
                                style={{
                                    width: 28, height: 14,
                                    background: v === 0 ? "rgba(255,255,255,0.02)" : `rgba(251,191,36,${v * 0.5})`,
                                    border: v === 0 ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(251,191,36,0.15)",
                                }}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.05 }}
                            >
                                <span className="text-[8px] font-mono" style={{ color: v === 0 ? "rgba(255,255,255,0.1)" : "rgba(251,191,36,0.7)" }}>
                                    {v.toFixed(1)}
                                </span>
                            </motion.div>
                        ))}
                        <p className="text-[9px] text-white/15 text-center mt-0.5">{D_MODEL * 4}×1</p>
                    </div>
                </div>
            </div>

            {/* Parameter count breakdown */}
            <div className="grid grid-cols-2 gap-2">
                <div className="px-3 py-2 rounded-lg text-center" style={{ background: "rgba(251,191,36,0.03)", border: "1px solid rgba(251,191,36,0.08)" }}>
                    <p className="text-[18px] font-bold font-mono" style={{ color: "#fbbf24" }}>{D_MODEL * D_MODEL * 4}</p>
                    <p className="text-[11px] text-white/20">W₁ params</p>
                </div>
                <div className="px-3 py-2 rounded-lg text-center" style={{ background: "rgba(251,191,36,0.03)", border: "1px solid rgba(251,191,36,0.08)" }}>
                    <p className="text-[18px] font-bold font-mono" style={{ color: "#fbbf24" }}>{D_MODEL * 4 * D_MODEL}</p>
                    <p className="text-[11px] text-white/20">W₂ params</p>
                </div>
            </div>

            {/* Formula */}
            <div className="px-4 py-3 rounded-xl" style={{ background: "#fbbf2408", border: "1px solid #fbbf2420" }}>
                <p className="text-[14px] font-mono text-center" style={{ color: "#fbbf24" }}>
                    FFN(x) = ReLU(x·W₁ + b₁)·W₂ + b₂
                </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="text-[14px]">💡</span>
                <p className="text-[13px] text-white/35 leading-snug">
                    &quot;<span style={{ color }}>{name}</span>&quot; expands from {D_MODEL} → {D_MODEL * 4} dims (room to represent complex patterns), then compresses back to {D_MODEL}.
                </p>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN ARCHITECTURE DIAGRAM (SVG) — TRANSFORMER PAPER STYLE
   Matches "Attention Is All You Need" Figure 1 (decoder side)
   ═══════════════════════════════════════════════════════════════ */

/* --- Paper-style layout constants --- */
const SVG_W = 420;
const SVG_H = 940;
const CX = SVG_W / 2 - 10;        // Center of blocks (offset left for Nx label)
const BW = 180;                     // Block width
const BH_SM = 38;                   // Small block height (Add&Norm, Linear, Softmax)
const BH_LG = 56;                   // Large block height (Attention, FFN)
const RX = 4;                       // Corner radius — paper uses sharp
const RES_OFFSET = 22;              // How far right residual arrows go from block edge

/* Block positions (top to bottom, index in BLOCKS) — extra spacing for residual clarity */
const BLOCK_LAYOUT: { idx: number; y: number; h: number; inRepeat: boolean }[] = [
    { idx: 0, y: 838, h: BH_SM, inRepeat: false },   // 0: Input Embedding
    // --- Nx repeating group ---
    { idx: 1, y: 660, h: BH_LG, inRepeat: true },    // 1: Masked Multi-Head Attention
    { idx: 2, y: 578, h: BH_SM, inRepeat: true },    // 2: Add & Norm
    { idx: 3, y: 496, h: BH_LG, inRepeat: true },    // 3: Feed Forward
    { idx: 4, y: 414, h: BH_SM, inRepeat: true },    // 4: Add & Norm
    // --- End repeat ---
    { idx: 5, y: 310, h: BH_SM, inRepeat: false },   // 5: Linear
    { idx: 6, y: 240, h: BH_SM, inRepeat: false },   // 6: Softmax
];

/* Positional Encoding circle position */
const PE_CX = CX + BW / 2 + 55;
const PE_Y = 770;

/* "Output Probabilities" label */
const OUT_PROB_Y = 150;

interface ArchDiagramProps {
    activeBlock: BlockId | null;
    onSelectBlock: (id: BlockId | null) => void;
    flowStage: number;
    selectedToken: number;
    tick: number;
}

function ArchitectureDiagram({ activeBlock, onSelectBlock, flowStage, selectedToken, tick }: ArchDiagramProps) {
    const tokenColor = TOKEN_COLORS[selectedToken];

    return (
        <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full"
            style={{ maxWidth: 440, display: "block", margin: "0 auto" }}
        >
            <defs>
                <filter id="explorer-glow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                {/* Arrow marker */}
                <marker id="arrow-head" markerWidth="8" markerHeight="6" refX="4" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M 0 0 L 8 3 L 0 6 Z" fill="rgba(255,255,255,0.25)" />
                </marker>
                <marker id="arrow-head-active" markerWidth="8" markerHeight="6" refX="4" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M 0 0 L 8 3 L 0 6 Z" fill={tokenColor} fillOpacity={0.4} />
                </marker>
            </defs>

            {/* ══════════════════════════════════════
                "Output Probabilities" label at top
               ══════════════════════════════════════ */}
            <text
                x={CX} y={OUT_PROB_Y}
                textAnchor="middle"
                fontSize={13}
                fontWeight="600"
                fontFamily="ui-sans-serif, system-ui"
                fill="rgba(255,255,255,0.35)"
            >
                Output Probabilities
            </text>
            {/* Arrow from Softmax to "Output Probabilities" */}
            <line
                x1={CX} y1={BLOCK_LAYOUT[6].y - BLOCK_LAYOUT[6].h / 2}
                x2={CX} y2={OUT_PROB_Y + 12}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={1.5}
                markerEnd="url(#arrow-head)"
            />

            {/* ══════════════════════════════════════
                "Inputs" label at bottom
               ══════════════════════════════════════ */}
            <text
                x={CX} y={SVG_H - 38}
                textAnchor="middle"
                fontSize={13}
                fontWeight="600"
                fontFamily="ui-sans-serif, system-ui"
                fill="rgba(255,255,255,0.35)"
            >
                Inputs
            </text>
            {/* Arrow from Inputs to Input Embedding */}
            <line
                x1={CX} y1={SVG_H - 44}
                x2={CX} y2={BLOCK_LAYOUT[0].y + BLOCK_LAYOUT[0].h / 2}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={1.5}
                markerEnd="url(#arrow-head)"
            />

            {/* ══════════════════════════════════════
                Positional Encoding (circle + label)
               ══════════════════════════════════════ */}
            {(() => {
                const addY = PE_Y;
                return (
                    <g>
                        {/* Curved arrow from Input Embedding to ⊕ */}
                        <path
                            d={`M ${CX} ${BLOCK_LAYOUT[0].y - BLOCK_LAYOUT[0].h / 2} L ${CX} ${addY}`}
                            fill="none"
                            stroke="rgba(255,255,255,0.15)"
                            strokeWidth={1.5}
                        />
                        {/* ⊕ circle */}
                        <circle cx={CX} cy={addY} r={12} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />
                        <text x={CX} y={addY + 1} textAnchor="middle" dominantBaseline="central" fontSize={14} fill="rgba(255,255,255,0.5)" fontFamily="ui-sans-serif, system-ui">+</text>

                        {/* PE arrow coming from the right */}
                        <line x1={PE_CX} y1={addY} x2={CX + 14} y2={addY} stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />

                        {/* PE circle — CLICKABLE */}
                        <g style={{ cursor: "pointer" }} onClick={() => onSelectBlock(activeBlock === "pe" ? null : "pe")}>
                            {activeBlock === "pe" && (
                                <circle cx={PE_CX + 18} cy={addY} r={18} fill="none" stroke="#34d399" strokeWidth={1.5} opacity={0.35} filter="url(#explorer-glow)" />
                            )}
                            <circle cx={PE_CX + 18} cy={addY} r={14}
                                fill={activeBlock === "pe" ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.01)"}
                                stroke={activeBlock === "pe" ? "#34d399" : "rgba(255,255,255,0.12)"}
                                strokeWidth={activeBlock === "pe" ? 1.8 : 1}
                            />
                            {/* Sine wave inside */}
                            <path d={`M ${PE_CX + 10} ${addY} Q ${PE_CX + 14} ${addY - 6}, ${PE_CX + 18} ${addY} Q ${PE_CX + 22} ${addY + 6}, ${PE_CX + 26} ${addY}`} fill="none" stroke={activeBlock === "pe" ? "#34d399" : "rgba(255,255,255,0.25)"} strokeWidth={1} />

                            {/* Label */}
                            <text x={PE_CX + 18} y={addY + 26} textAnchor="middle" fontSize={10} fontWeight="500" fontFamily="ui-sans-serif, system-ui" fill={activeBlock === "pe" ? "#34d399" : "rgba(255,255,255,0.25)"}>
                                Positional
                            </text>
                            <text x={PE_CX + 18} y={addY + 37} textAnchor="middle" fontSize={10} fontWeight="500" fontFamily="ui-sans-serif, system-ui" fill={activeBlock === "pe" ? "#34d399" : "rgba(255,255,255,0.25)"}>
                                Encoding
                            </text>
                            {/* Clickable hint */}
                            {activeBlock !== "pe" && (
                                <path d={`M ${PE_CX + 30} ${addY - 3} L ${PE_CX + 34} ${addY} L ${PE_CX + 30} ${addY + 3}`} fill="none" stroke="white" strokeWidth={1} strokeLinecap="round" opacity={0.12} />
                            )}
                        </g>

                        {/* Arrow from ⊕ up — splits into Q, K, V before entering Attention */}
                        {(() => {
                            const attnBot = BLOCK_LAYOUT[1].y + BLOCK_LAYOUT[1].h / 2;
                            const splitY = attnBot + 24; // where the split happens
                            const spread = 22; // horizontal distance between Q/K/V
                            const qkvColors = ["#f472b6", "#a78bfa", "#34d399"]; // Q=pink, K=purple, V=green
                            const qkvLabels = ["V", "K", "Q"];
                            return (
                                <g>
                                    {/* Single line from ⊕ up to split point */}
                                    <line x1={CX} y1={addY - 12} x2={CX} y2={splitY}
                                        stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
                                    {/* Three branches */}
                                    {[-1, 0, 1].map((dir, i) => {
                                        const tx = CX + dir * spread;
                                        return (
                                            <g key={i}>
                                                {/* Horizontal from center to branch */}
                                                {dir !== 0 && (
                                                    <line x1={CX} y1={splitY} x2={tx} y2={splitY}
                                                        stroke={`${qkvColors[i]}30`} strokeWidth={1.2} />
                                                )}
                                                {/* Vertical up into Attention */}
                                                <line x1={tx} y1={splitY} x2={tx} y2={attnBot}
                                                    stroke={`${qkvColors[i]}30`} strokeWidth={1.2}
                                                    markerEnd="url(#arrow-head)" />
                                                {/* Label */}
                                                <text
                                                    x={tx} y={splitY + 10}
                                                    textAnchor="middle" fontSize={8} fontWeight="700"
                                                    fontFamily="ui-sans-serif, system-ui"
                                                    fill={`${qkvColors[i]}60`}
                                                >
                                                    {qkvLabels[i]}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </g>
                            );
                        })()}
                    </g>
                );
            })()}

            {/* ══════════════════════════════════════
                Nx bracket (repeating block group: blocks 1-4)
               ══════════════════════════════════════ */}
            {(() => {
                const topY = BLOCK_LAYOUT[1].y - BLOCK_LAYOUT[1].h / 2 - 14;
                const botY = BLOCK_LAYOUT[4].y + BLOCK_LAYOUT[4].h / 2 + 14;
                const rx = CX + BW / 2 + 22;
                return (
                    <g>
                        {/* Bracket rectangle */}
                        <rect
                            x={CX - BW / 2 - 18} y={topY}
                            width={BW + 40 + 18} height={botY - topY}
                            rx={6}
                            fill="rgba(255,255,255,0.008)"
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth={1}
                        />
                        {/* Nx label */}
                        <text
                            x={rx + 8} y={(topY + botY) / 2 + 1}
                            textAnchor="start"
                            fontSize={16}
                            fontWeight="700"
                            fontFamily="ui-sans-serif, system-ui"
                            fill="rgba(255,255,255,0.2)"
                        >
                            N×
                        </text>
                    </g>
                );
            })()}

            {/* ══════════════════════════════════════
                Vertical connectors between blocks
               ══════════════════════════════════════ */}
            {BLOCK_LAYOUT.slice(0, -1).map((curr, i) => {
                const next = BLOCK_LAYOUT[i + 1];
                if (!next) return null;
                /* Skip 0→1 connector — handled by PE ⊕ section */
                if (i === 0) return null;
                const y1 = curr.y - curr.h / 2;
                const y2 = next.y + next.h / 2;
                const fi = curr.idx;
                const isPast = flowStage > fi;
                const isCurrent = flowStage === fi;
                return (
                    <g key={`conn-${i}`}>
                        <line
                            x1={CX} y1={y1} x2={CX} y2={y2}
                            stroke={isPast ? `${tokenColor}25` : "rgba(255,255,255,0.08)"}
                            strokeWidth={1.2}
                            markerEnd={isPast ? "url(#arrow-head-active)" : "url(#arrow-head)"}
                        />
                        {/* Animated dot traveling between stages */}
                        {isCurrent && (
                            <circle
                                cx={CX}
                                cy={y2 + ((tick % 30) / 30) * (y1 - y2)}
                                r={2.5}
                                fill={tokenColor}
                                opacity={0.5}
                            />
                        )}
                    </g>
                );
            })}

            {/* ══════════════════════════════════════
                Residual connections (right-angle, paper style)
               ══════════════════════════════════════ */}
            {/* Residual 1: branches from data line BELOW attention, bypasses to Add&Norm #1 */}
            {(() => {
                const attnBot = BLOCK_LAYOUT[1].y + BLOCK_LAYOUT[1].h / 2;
                const splitY = attnBot + 24; // Q,K,V split point
                const startY = splitY + 14;  // branch BELOW the Q,K,V split
                const endY = BLOCK_LAYOUT[2].y;
                const rightX = CX + BW / 2 + RES_OFFSET;
                const r = 8;
                const isPast = flowStage >= 1;
                const strokeColor = isPast ? "rgba(52,211,153,0.5)" : "rgba(255,255,255,0.10)";
                return (
                    <g>
                        <path
                            d={`M ${CX} ${startY} L ${rightX - r} ${startY} Q ${rightX} ${startY} ${rightX} ${startY - r} L ${rightX} ${endY + r} Q ${rightX} ${endY} ${rightX - r} ${endY} L ${CX + BW / 2} ${endY}`}
                            fill="none" stroke={strokeColor} strokeWidth={1.2} strokeDasharray={isPast ? "none" : "4 3"}
                            markerEnd={isPast ? "url(#arrow-head-active)" : "url(#arrow-head)"}
                        />
                        {flowStage >= 0 && flowStage <= 2 && (
                            <circle
                                cx={rightX}
                                cy={startY + ((tick % 50) / 50) * (endY - startY)}
                                r={2} fill="#34d399" opacity={0.4}
                            />
                        )}
                    </g>
                );
            })()}

            {/* Residual 2: branches from connector BELOW FFN, bypasses to Add&Norm #2 */}
            {(() => {
                const startY = BLOCK_LAYOUT[3].y + BLOCK_LAYOUT[3].h / 2 + 12; // below FFN bottom
                const endY = BLOCK_LAYOUT[4].y;
                const rightX = CX + BW / 2 + RES_OFFSET;
                const r = 8;
                const isPast = flowStage >= 3;
                const strokeColor = isPast ? "rgba(52,211,153,0.5)" : "rgba(255,255,255,0.10)";
                return (
                    <g>
                        <path
                            d={`M ${CX} ${startY} L ${rightX - r} ${startY} Q ${rightX} ${startY} ${rightX} ${startY - r} L ${rightX} ${endY + r} Q ${rightX} ${endY} ${rightX - r} ${endY} L ${CX + BW / 2} ${endY}`}
                            fill="none" stroke={strokeColor} strokeWidth={1.2} strokeDasharray={isPast ? "none" : "4 3"}
                            markerEnd={isPast ? "url(#arrow-head-active)" : "url(#arrow-head)"}
                        />
                        {flowStage >= 2 && flowStage <= 4 && (
                            <circle
                                cx={rightX}
                                cy={startY + ((tick % 50) / 50) * (endY - startY)}
                                r={2} fill="#34d399" opacity={0.4}
                            />
                        )}
                    </g>
                );
            })()}

            {/* ══════════════════════════════════════
                Blocks — Paper-style colored rectangles
               ══════════════════════════════════════ */}
            {BLOCK_LAYOUT.map(({ idx, y, h }) => {
                const block = BLOCKS[idx];
                const isActive = activeBlock === block.id;
                const isCurrent = flowStage === idx;
                const isPast = flowStage > idx;

                /* Paper-style colors: pastel bg on dark theme = low-opacity fill */
                const baseFillOp = isActive ? 0.22 : isCurrent ? 0.16 : isPast ? 0.10 : 0.06;
                const baseStrokeOp = isActive ? 0.6 : isCurrent ? 0.4 : isPast ? 0.25 : 0.12;

                /* Multi-line label support */
                const lines = block.shortLabel.split("\n");
                const lineH = 14;
                const textStartY = y - ((lines.length - 1) * lineH) / 2;

                return (
                    <g
                        key={`block-${idx}`}
                        style={{ cursor: block.zoomable ? "pointer" : "default" }}
                        onClick={() => block.zoomable ? onSelectBlock(isActive ? null : block.id) : null}
                    >
                        {/* Active glow */}
                        {isActive && (
                            <rect
                                x={CX - BW / 2 - 4} y={y - h / 2 - 4}
                                width={BW + 8} height={h + 8}
                                rx={RX + 2}
                                fill="none"
                                stroke={block.color}
                                strokeWidth={1.5}
                                opacity={0.3}
                                filter="url(#explorer-glow)"
                            />
                        )}

                        {/* Current stage pulse */}
                        {isCurrent && (
                            <rect
                                x={CX - BW / 2 - 2} y={y - h / 2 - 2}
                                width={BW + 4} height={h + 4}
                                rx={RX + 1}
                                fill="none"
                                stroke={tokenColor}
                                strokeWidth={1.5}
                                opacity={0.3}
                                filter="url(#explorer-glow)"
                            />
                        )}

                        {/* Block rectangle — paper style */}
                        <rect
                            x={CX - BW / 2} y={y - h / 2}
                            width={BW} height={h}
                            rx={RX}
                            fill={block.color}
                            fillOpacity={baseFillOp}
                            stroke={block.color}
                            strokeWidth={isActive ? 1.5 : 1}
                            strokeOpacity={baseStrokeOp}
                        />

                        {/* Label — centered, multi-line */}
                        {lines.map((line, li) => (
                            <text
                                key={li}
                                x={CX}
                                y={textStartY + li * lineH}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontSize={h === BH_LG ? 13 : 12}
                                fontWeight="600"
                                fontFamily="ui-sans-serif, system-ui"
                                fill={block.color}
                                fillOpacity={isActive || isPast || isCurrent ? 0.9 : 0.5}
                            >
                                {line}
                            </text>
                        ))}

                        {/* Clickable hint */}
                        {block.zoomable && !isActive && (
                            <g opacity={0.12}>
                                <path
                                    d={`M ${CX + BW / 2 - 16} ${y - 3} L ${CX + BW / 2 - 12} ${y} L ${CX + BW / 2 - 16} ${y + 3}`}
                                    fill="none" stroke="white" strokeWidth={1.2} strokeLinecap="round"
                                />
                            </g>
                        )}

                        {/* Active close button */}
                        {block.zoomable && isActive && (
                            <g opacity={0.35}>
                                <circle cx={CX + BW / 2 - 14} cy={y} r={7} fill="rgba(255,255,255,0.03)" stroke={block.color} strokeWidth={1} strokeOpacity={0.4} />
                                <text
                                    x={CX + BW / 2 - 14} y={y + 1}
                                    textAnchor="middle" dominantBaseline="central"
                                    fontSize={9} fontWeight="700" fill="white" fillOpacity={0.6}
                                    fontFamily="ui-sans-serif, system-ui"
                                >
                                    ✕
                                </text>
                            </g>
                        )}
                    </g>
                );
            })}
        </svg>
    );
}

/* ═══════════════════════════════════════════════════════════════
   TOKEN EMBEDDING BAR (mini bar chart for a token's vector)
   ═══════════════════════════════════════════════════════════════ */

function TokenEmbeddingBar({ values, color, label, small }: { values: number[]; color: string; label: string; small?: boolean }) {
    const h = small ? 24 : 32;
    return (
        <div className="flex flex-col items-center gap-1">
            <div className="flex items-end gap-px" style={{ height: h }}>
                {values.map((v, i) => (
                    <motion.div
                        key={i}
                        className="rounded-t-sm"
                        style={{
                            width: small ? 3 : 5,
                            background: color,
                            opacity: 0.6,
                        }}
                        animate={{ height: v * (h - 2) + 2 }}
                        transition={{ type: "spring", stiffness: 120, damping: 14 }}
                    />
                ))}
            </div>
            <span className="text-[13px] font-semibold" style={{ color }}>{label}</span>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function TransformerBlockExplorerViz() {
    const [selectedToken, setSelectedToken] = useState(1); // "professor"
    const [activeBlock, setActiveBlock] = useState<BlockId | null>(null);
    const [flowStage, setFlowStage] = useState(-1);
    const [flowPlaying, setFlowPlaying] = useState(false);
    const [tick, setTick] = useState(0);
    const flowTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /* Tick for particle animations */
    useEffect(() => {
        if (flowStage < 0) return;
        const timer = setInterval(() => setTick(t => t + 1), 200);
        return () => clearInterval(timer);
    }, [flowStage]);

    const activeBlockDef = useMemo(() => {
        if (activeBlock === "pe") return PE_BLOCK_DEF;
        return BLOCKS.find(b => b.id === activeBlock);
    }, [activeBlock]);

    /* Flow auto-advance (slow — 2.2s per stage) */
    useEffect(() => {
        if (!flowPlaying) {
            if (flowTimerRef.current) clearInterval(flowTimerRef.current);
            return;
        }
        flowTimerRef.current = setInterval(() => {
            setFlowStage(s => {
                if (s >= BLOCKS.length - 1) {
                    setFlowPlaying(false);
                    return BLOCKS.length - 1;
                }
                return s + 1;
            });
        }, 2200);
        return () => { if (flowTimerRef.current) clearInterval(flowTimerRef.current); };
    }, [flowPlaying]);

    const startFlow = useCallback(() => {
        setFlowStage(0);
        setFlowPlaying(true);
        setActiveBlock(null);
    }, []);

    const stepForward = useCallback(() => {
        setFlowPlaying(false);
        setFlowStage(s => Math.min(s + 1, BLOCKS.length - 1));
        setActiveBlock(null);
    }, []);

    const stepBack = useCallback(() => {
        setFlowPlaying(false);
        setFlowStage(s => Math.max(s - 1, 0));
        setActiveBlock(null);
    }, []);

    const handleSelectBlock = useCallback((id: BlockId | null) => {
        setActiveBlock(id);
        setFlowPlaying(false);
    }, []);

    /* Get detail component for zoomed block */
    const detailPanel = useMemo(() => {
        if (!activeBlockDef) return null;
        switch (activeBlock) {
            case "input":
                return <InputEmbeddingDetail tokenIdx={selectedToken} />;
            case "pe":
                return <PositionalEncodingDetail tokenIdx={selectedToken} />;
            case "attn":
                return <AttentionDetail tokenIdx={selectedToken} />;
            case "add1":
                return (
                    <div className="space-y-6">
                        <ResidualDetail tokenIdx={selectedToken} />
                        <div className="border-t border-white/5 pt-4">
                            <p className="text-[13px] font-semibold mb-2" style={{ color: "#a78bfa80" }}>⚖️ Then: Layer Normalization</p>
                            <LayerNormDetail tokenIdx={selectedToken} />
                        </div>
                    </div>
                );
            case "add2":
                return (
                    <div className="space-y-6">
                        <ResidualDetail isSecond tokenIdx={selectedToken} />
                        <div className="border-t border-white/5 pt-4">
                            <p className="text-[13px] font-semibold mb-2" style={{ color: "#a78bfa80" }}>⚖️ Then: Layer Normalization</p>
                            <LayerNormDetail tokenIdx={selectedToken} />
                        </div>
                    </div>
                );
            case "ffn":
                return <FFNDetail tokenIdx={selectedToken} />;
            case "linear":
                return <LinearHeadDetail tokenIdx={selectedToken} />;
            case "softmax":
                return <SoftmaxDetail />;
            default:
                return null;
        }
    }, [activeBlock, activeBlockDef, selectedToken]);

    /* Token data based on flow stage */
    const currentEmbeddings = flowStage >= BLOCKS.length - 1 ? OUTPUT_EMB : EMBEDDINGS;

    return (
        <div
            className="py-6 sm:py-8 px-3 sm:px-6 relative"
        >
            {/* ═══ HEADER ═══ */}
            <div className="text-center mb-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/25 font-semibold mb-1">Interactive</p>
                <p className="text-base sm:text-lg font-bold text-white/40">Transformer Decoder Architecture</p>
            </div>

            {/* ═══ MAIN CONTENT: Diagram + Detail Panel ═══ */}
            <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">

                {/* LEFT: Architecture Diagram */}
                <div className="flex-1 w-full lg:w-auto">
                    <ArchitectureDiagram
                        activeBlock={activeBlock}
                        onSelectBlock={handleSelectBlock}
                        flowStage={flowStage}
                        selectedToken={selectedToken}
                        tick={tick}
                    />
                </div>

                {/* RIGHT: Detail Panel */}
                <AnimatePresence mode="wait">
                    {activeBlockDef && detailPanel && (
                        <motion.div
                            key={activeBlock}
                            className="w-full lg:w-[340px] xl:w-[380px] p-5 flex-shrink-0"
                            style={{
                                borderLeft: `2px solid ${activeBlockDef.color}40`,
                            }}
                            initial={{ opacity: 0, x: 30, scale: 0.96 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 30, scale: 0.96 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        >
                            {/* Panel header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-[18px]">{activeBlockDef.icon}</span>
                                    <div>
                                        <p className="text-[16px] font-bold" style={{ color: activeBlockDef.color }}>
                                            {activeBlockDef.label}
                                        </p>
                                        <p className="text-[13px] text-white/30">{activeBlockDef.description}</p>
                                    </div>
                                </div>
                                <motion.button
                                    onClick={() => setActiveBlock(null)}
                                    className="w-6 h-6 flex items-center justify-center text-white/15 hover:text-white/30 transition-colors cursor-pointer"
                                    whileTap={{ scale: 0.9 }}
                                >
                                    ✕
                                </motion.button>
                            </div>

                            {/* Detail content */}
                            {detailPanel}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* RIGHT: Architecture overview when nothing selected */}
                {!activeBlock && (
                    <div className="hidden lg:flex w-[340px] xl:w-[380px] flex-shrink-0 flex-col p-5"
                        style={{
                            borderLeft: "1px solid rgba(255,255,255,0.04)",
                            minHeight: 300,
                        }}
                    >
                        <p className="text-base font-bold mb-1" style={{ color: "rgba(34,211,238,0.5)" }}>
                            Transformer Decoder
                        </p>
                        <p className="text-xs text-white/20 mb-4">
                            &quot;Attention Is All You Need&quot; — Vaswani et al., 2017
                        </p>

                        <div className="space-y-2.5 mb-5">
                            {BLOCKS.map((b, i) => (
                                <motion.button
                                    key={b.id}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all"
                                    style={{
                                        borderLeft: `1px solid ${b.color}20`,
                                    }}
                                    onClick={() => b.zoomable ? handleSelectBlock(b.id) : null}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    whileHover={{ x: 2 }}
                                >
                                    <span className="text-[14px]">{b.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold truncate" style={{ color: `${b.color}90` }}>{b.label}</p>
                                        <p className="text-[11px] text-white/20 truncate">{b.description}</p>
                                    </div>
                                    {b.zoomable && (
                                        <span className="text-[10px] text-white/10">▸</span>
                                    )}
                                </motion.button>
                            ))}
                        </div>

                        <div className="mt-auto pt-3">
                            <p className="text-xs text-white/10 text-center">
                                Click any block to explore what happens inside
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══ FLOW CONTROLS ═══ */}
            <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
                {/* Step back */}
                {flowStage > 0 && (
                    <motion.button
                        onClick={stepBack}
                        className="px-3 py-2 text-sm font-semibold text-white/20 hover:text-white/35 transition-colors cursor-pointer"
                        whileTap={{ scale: 0.95 }}
                    >
                        ← Prev
                    </motion.button>
                )}

                {/* Main play / start button */}
                <motion.button
                    onClick={flowStage < 0 ? startFlow : flowPlaying ? () => setFlowPlaying(false) : () => setFlowPlaying(true)}
                    className="px-5 py-2.5 text-sm font-bold transition-all cursor-pointer"
                    style={{
                        color: flowPlaying ? "rgba(34,211,238,0.7)" : "rgba(34,211,238,0.4)",
                        borderBottom: flowPlaying ? "2px solid rgba(34,211,238,0.3)" : "2px solid transparent",
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                >
                    {flowStage < 0 ? "▶ Flow Data Through" : flowPlaying ? "⏸ Pause" : "▶ Auto"}
                </motion.button>

                {/* Step forward */}
                {flowStage >= 0 && flowStage < BLOCKS.length - 1 && (
                    <motion.button
                        onClick={stepForward}
                        className="px-3 py-2 text-sm font-semibold cursor-pointer"
                        style={{ color: "rgba(34,211,238,0.35)" }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Next →
                    </motion.button>
                )}

                {/* Reset */}
                {flowStage > -1 && !flowPlaying && (
                    <motion.button
                        onClick={() => { setFlowStage(-1); setFlowPlaying(false); }}
                        className="text-[13px] font-semibold text-white/15 hover:text-white/30 transition-colors ml-1"
                        whileTap={{ scale: 0.95 }}
                    >
                        ↻ Reset
                    </motion.button>
                )}
            </div>

            {/* Progress dots */}
            {flowStage > -1 && (
                <div className="flex items-center justify-center gap-1 mt-3">
                    {BLOCKS.map((b, i) => (
                        <motion.div
                            key={i}
                            className="rounded-full"
                            style={{
                                width: i === flowStage ? 14 : 5,
                                height: 5,
                                background: i === flowStage
                                    ? b.color
                                    : i < flowStage
                                        ? `${b.color}40`
                                        : "rgba(255,255,255,0.05)",
                            }}
                            layout
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        />
                    ))}
                </div>
            )}

            {/* ═══ STAGE DESCRIPTION (during flow) ═══ */}
            <AnimatePresence mode="wait">
                {flowStage >= 0 && flowStage < STAGE_DESCRIPTIONS.length && (
                    <motion.div
                        key={flowStage}
                        className="mt-4 mx-auto max-w-lg px-5 py-3 text-center"
                        style={{
                            borderLeft: `2px solid ${BLOCKS[flowStage].color}30`,
                        }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                    >
                        <p className="text-[14px] leading-relaxed" style={{ color: `${BLOCKS[flowStage].color}90` }}>
                            <span className="font-bold">{BLOCKS[flowStage].shortLabel}:</span>{" "}
                            <span style={{ color: "rgba(255,255,255,0.35)" }}>{STAGE_DESCRIPTIONS[flowStage]}</span>
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ COMPLETION: simple verdict ═══ */}
            {flowStage >= BLOCKS.length - 1 && (
                <motion.div
                    className="mt-5 mx-auto max-w-lg px-5 py-4 text-center"
                    style={{ borderLeft: "2px solid rgba(52,211,153,0.3)" }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 120, damping: 14 }}
                >
                    <p className="text-[15px] font-bold" style={{ color: "#34d399" }}>
                        ✨ One complete forward pass!
                    </p>
                    <p className="text-[13px] text-white/30 mt-1 leading-relaxed">
                        Each token gathered context (Attention), processed it privately (FFN),
                        and preserved the original signal (Residuals). Now every token carries
                        unique, context-aware information.
                    </p>
                </motion.div>
            )}
        </div>
    );
}