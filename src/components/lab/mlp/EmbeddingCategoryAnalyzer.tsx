"use client";

import { useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Award, Brain, Loader2, SearchCode, Skull } from "lucide-react";

import { fetchAdvancedEmbeddings } from "@/lib/lmLabClient";
import type { AdvancedEmbeddingModel } from "@/lib/lmLabClient";

/*
  EmbeddingCategoryAnalyzer — v4 (Dimension Dissection)
  Compares embeddings from 4 models (2D, 4D, 16D, 128D) trained with
  mlp_advanced architecture. For each model, shows ALL dimensions as
  horizontal bar charts (characters sorted by activation value).
  Teaches: underfitting → sweet spot → interpretability → overfitting.
  Fetches from /api/v1/mlp/advanced-embeddings. Falls back to illustrative data.
*/

const VOWELS = new Set(["a", "e", "i", "o", "u"]);
const PUNCT = new Set([".", " "]);

type CharCategory = "vowel" | "consonant" | "punct";

function getCategory(ch: string): CharCategory {
    if (VOWELS.has(ch)) return "vowel";
    if (PUNCT.has(ch)) return "punct";
    return "consonant";
}

function displayChar(ch: string): string {
    return ch === " " ? "[SP]" : ch === "." ? "·" : ch.toUpperCase();
}

const DISPLAY_DIMS = [2, 4, 16, 128];

interface ModelMeta {
    label: string;
    subtitle: string;
    icon: typeof Brain;
    color: string;
    accentBg: string;
    description: string;
    dimNote: string;
}

const MODEL_META: Record<number, ModelMeta> = {
    2: {
        label: "The Bottleneck",
        subtitle: "Underfitting",
        icon: AlertTriangle,
        color: "#f97316",
        accentBg: "rgba(249,115,22,0.08)",
        description: "Only 2 numbers to describe each of 27 characters. The network is in a panic — it crams everything into an X and Y axis. Vowels, consonants, and punctuation fight for space. Each dimension must do double duty (polysemanticity at its worst).",
        dimNote: "Both dimensions are polysemantic — each one tries to encode multiple unrelated patterns at once because there's simply no room.",
    },
    4: {
        label: "The Sweet Spot",
        subtitle: "Occam's Razor",
        icon: Award,
        color: "#10b981",
        accentBg: "rgba(16,185,129,0.08)",
        description: "Just 4 numbers per character — and it achieves the BEST validation loss. With only 27 characters, the intrinsic complexity of English spelling is surprisingly low. 4 dimensions are enough to capture vowel patterns, consonant clusters, word boundaries, and frequency.",
        dimNote: "Each dimension has a clear \"job\" but still shares some responsibility. This is the optimal balance between compression and expressiveness.",
    },
    16: {
        label: "The Interpretable",
        subtitle: "Monosemanticity",
        icon: SearchCode,
        color: "#a78bfa",
        accentBg: "rgba(167,139,250,0.08)",
        description: "With L1 regularization and 16 dimensions for 27 characters, something magical happens: individual dimensions start meaning something human-readable. Some dimensions specialize in detecting JUST vowels, others JUST rare consonants. This is what researchers call \"axis-aligned\" features.",
        dimNote: "Notice how some dimensions have strong activation for just 2-3 characters — they've become dedicated detectors. This is monosemanticity emerging.",
    },
    128: {
        label: "The Curse",
        subtitle: "Overfitting / Memorization",
        icon: Skull,
        color: "#ef4444",
        accentBg: "rgba(239,68,68,0.08)",
        description: "128 dimensions for 27 characters is absurd overkill. Instead of learning general rules, the network memorizes specific training sequences. Most dimensions are flat (unused) or show random spikes for individual letters — these are \"memorization shortcuts\" that fail on new text.",
        dimNote: "Most dimensions are nearly flat or activate on single random letters. The network has abandoned generalization in favor of rote memorization.",
    },
};

const FALLBACK_MODELS: AdvancedEmbeddingModel[] = DISPLAY_DIMS.map(dim => {
    const vocab = " .abcdefghijklmnopqrstuvwxyz".split("");
    const rng = (seed: number) => {
        let s = seed;
        return () => { s = (s * 16807 + 0) % 2147483647; return (s / 2147483647) * 2 - 1; };
    };
    const r = rng(dim * 37 + 7);
    const matrix = vocab.map(ch => {
        const base = VOWELS.has(ch) ? 1.2 : PUNCT.has(ch) ? -1.5 : -0.3;
        return Array.from({ length: dim }, () => base * (0.5 + Math.abs(r())) + r() * (dim < 8 ? 0.8 : 0.3));
    });
    const losses: Record<number, [number, number]> = {
        2: [1.3122, 1.5408], 4: [1.2220, 1.4156], 16: [1.2651, 1.4293], 128: [1.2837, 1.5371],
    };
    return {
        emb_dim: dim,
        vocab,
        vocab_size: vocab.length,
        embedding_matrix: matrix,
        config: { emb_dim: dim, context_size: 8, hidden_size: 256, num_layers: 3, max_steps: 50000 },
        final_train_loss: losses[dim]?.[0] ?? 1.5,
        final_val_loss: losses[dim]?.[1] ?? 1.6,
        total_params: dim * 28 + 256 * 3,
        generated_samples: ["(illustrative)"],
    };
});

/** Analyze what a dimension detects */
function analyzeDimension(values: { ch: string; val: number }[]): string {
    const sorted = [...values].sort((a, b) => b.val - a.val);
    const topN = sorted.slice(0, 5);
    const bottomN = sorted.slice(-5);
    const topVowels = topN.filter(v => VOWELS.has(v.ch)).length;
    const bottomVowels = bottomN.filter(v => VOWELS.has(v.ch)).length;
    const topPunct = topN.filter(v => PUNCT.has(v.ch)).length;
    const bottomPunct = bottomN.filter(v => PUNCT.has(v.ch)).length;
    const range = Math.abs(sorted[0].val - sorted[sorted.length - 1].val);

    if (range < 0.15) return "Nearly flat — unused";

    // Vowel/consonant detection (relaxed thresholds)
    if (topVowels >= 3) return "Vowel detector";
    if (bottomVowels >= 3) return "Anti-vowel (consonant preference)";
    if (topPunct >= 1 && topN[0] && PUNCT.has(topN[0].ch)) return "Punctuation / space detector";
    if (bottomPunct >= 1 && bottomN[bottomN.length - 1] && PUNCT.has(bottomN[bottomN.length - 1].ch)) return "Anti-punctuation";

    // Common/rare consonant groups
    const topCommon = topN.filter(v => "tnrshdle".includes(v.ch)).length;
    const topRare = topN.filter(v => "qxzjkvw".includes(v.ch)).length;
    if (topCommon >= 3) return "Common-letter detector";
    if (topRare >= 3) return "Rare letter detector";

    // Use standard deviation to detect spikiness
    const mean = values.reduce((s, v) => s + v.val, 0) / values.length;
    const std = Math.sqrt(values.reduce((s, v) => s + (v.val - mean) ** 2, 0) / values.length);
    const outlierThresh = mean + 2 * std;
    const outliers = values.filter(v => v.val > outlierThresh).length;

    if (outliers <= 1 && range > 0.3) return "Single-letter specialist";
    if (outliers <= 3 && outliers >= 2) return "Narrow feature detector";

    // Frequency-based grouping
    const topChars = topN.map(v => v.ch).join("");
    if (/[aeiou]/.test(topChars) && /[^aeiou. ]/.test(topChars)) return "Mixed / polysemantic";

    // Check gradient (smooth vs abrupt)
    const diffs = sorted.slice(0, -1).map((v, i) => v.val - sorted[i + 1].val);
    const maxDiff = Math.max(...diffs);
    if (maxDiff > range * 0.4) return "Binary separator";

    return "Distributed feature";
}

/** Bar chart colors */
function barColor(val: number, maxAbs: number): string {
    const intensity = Math.min(1, Math.abs(val) / (maxAbs || 1));
    if (val >= 0) return `rgba(59,130,246,${0.2 + intensity * 0.6})`; // blue
    return `rgba(244,114,182,${0.2 + intensity * 0.6})`; // pink
}

function charCatColor(ch: string): string {
    if (VOWELS.has(ch)) return "#f472b6";
    if (PUNCT.has(ch)) return "#a78bfa";
    return "#60a5fa";
}

/** Max dims to show per model in the grid */
const MAX_SHOW_DIMS: Record<number, number> = { 2: 2, 4: 4, 16: 7, 128: 8 };

export function EmbeddingCategoryAnalyzer() {
    const [models, setModels] = useState<AdvancedEmbeddingModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIdx, setSelectedIdx] = useState(1); // default 4D
    const [isFallback, setIsFallback] = useState(false);
    const [expandedDim, setExpandedDim] = useState<number | null>(null);
    const [showAllDims, setShowAllDims] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetchAdvancedEmbeddings(DISPLAY_DIMS);
                if (cancelled) return;
                if (res.models.length >= 2) {
                    setModels(res.models);
                } else {
                    setModels(FALLBACK_MODELS);
                    setIsFallback(true);
                }
            } catch {
                if (cancelled) return;
                setModels(FALLBACK_MODELS);
                setIsFallback(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Pre-compute dimension data for all models
    const dimData = useMemo(() => {
        return models.map(m => {
            const nDims = m.embedding_matrix[0]?.length ?? 0;
            const defaultShow = MAX_SHOW_DIMS[m.emb_dim] ?? 8;
            const showDims = showAllDims ? nDims : Math.min(nDims, defaultShow);
            const dims = Array.from({ length: showDims }, (_, d) => {
                const values = m.vocab.map((ch, i) => ({ ch, val: m.embedding_matrix[i][d] }));
                const sorted = [...values].sort((a, b) => a.val - b.val);
                const maxAbs = Math.max(...values.map(v => Math.abs(v.val)));
                const analysis = analyzeDimension(values);
                return { dimIdx: d, sorted, maxAbs, analysis };
            });
            return { dims, model: m };
        });
    }, [models, showAllDims]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-[var(--lab-text-muted)]">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading embeddings from 4 models…
            </div>
        );
    }

    const selected = dimData[selectedIdx] ?? dimData[0];
    const meta = MODEL_META[selected?.model.emb_dim] ?? MODEL_META[4];
    const Icon = meta.icon;

    // Find the best (lowest) val loss
    const bestValLoss = Math.min(...models.map(m => m.final_val_loss ?? Infinity));

    return (
        <div className="space-y-4">
            {/* Model selector tabs */}
            <div className="grid grid-cols-4 gap-1.5">
                {dimData.map(({ model }, i) => {
                    const active = i === selectedIdx;
                    const m = MODEL_META[model.emb_dim] ?? MODEL_META[4];
                    const isBest = model.final_val_loss === bestValLoss;
                    return (
                        <button
                            key={model.emb_dim}
                            onClick={() => { setSelectedIdx(i); setExpandedDim(null); setShowAllDims(false); }}
                            className="rounded-lg border px-2 py-2.5 text-left transition-all relative overflow-hidden"
                            style={{
                                borderColor: active ? m.color + "50" : "rgba(255,255,255,0.06)",
                                backgroundColor: active ? m.accentBg : "rgba(255,255,255,0.01)",
                            }}
                        >
                            <div className="text-sm font-mono font-bold" style={{ color: active ? m.color : "rgba(255,255,255,0.4)" }}>
                                {model.emb_dim}D
                            </div>
                            <div className="text-[8px] font-mono mt-0.5 truncate" style={{ color: active ? m.color + "90" : "rgba(255,255,255,0.2)" }}>
                                {m.subtitle}
                            </div>
                            {model.final_val_loss != null && (
                                <div className="text-[8px] font-mono mt-0.5 flex items-center gap-1" style={{ color: active ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)" }}>
                                    val: {model.final_val_loss.toFixed(3)}
                                    {isBest && <span className="text-emerald-400">★</span>}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Pedagogical description card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={selected.model.emb_dim}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="rounded-xl border p-4 space-y-2"
                    style={{ borderColor: meta.color + "25", backgroundColor: meta.accentBg }}
                >
                    <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 shrink-0" style={{ color: meta.color }} />
                        <span className="text-sm font-bold" style={{ color: meta.color }}>{meta.label}</span>
                        <span className="text-[9px] font-mono text-white/30 ml-auto">
                            {selected.model.emb_dim} dimensions × {selected.model.vocab_size ?? 27} characters
                        </span>
                    </div>
                    <p className="text-xs leading-relaxed text-white/50">{meta.description}</p>
                </motion.div>
            </AnimatePresence>

            {/* Loss comparison strip */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-3">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Loss Comparison</span>
                    <span className="text-[8px] font-mono text-white/15 ml-auto">train / validation · lower = better</span>
                </div>
                <div className="space-y-1.5">
                    {dimData.map(({ model }, i) => {
                        const active = i === selectedIdx;
                        const m = MODEL_META[model.emb_dim] ?? MODEL_META[4];
                        const trainLoss = model.final_train_loss ?? 0;
                        const valLoss = model.final_val_loss ?? 0;
                        const maxLoss = 1.7;
                        const minLoss = 1.1;
                        const range = maxLoss - minLoss;
                        const trainPct = Math.max(5, Math.min(100, ((trainLoss - minLoss) / range) * 100));
                        const valPct = Math.max(5, Math.min(100, ((valLoss - minLoss) / range) * 100));
                        const gap = valLoss - trainLoss;
                        const isBest = valLoss === bestValLoss;
                        return (
                            <div
                                key={model.emb_dim}
                                className="flex items-center gap-2 rounded-md px-1.5 py-1 cursor-pointer transition-all"
                                style={{ backgroundColor: active ? m.accentBg : "transparent" }}
                                onClick={() => { setSelectedIdx(i); setExpandedDim(null); }}
                            >
                                <span className="w-8 text-[10px] font-mono font-bold text-right shrink-0"
                                    style={{ color: active ? m.color : "rgba(255,255,255,0.3)" }}>
                                    {model.emb_dim}D
                                </span>
                                <div className="flex-1 space-y-0.5">
                                    <div className="flex items-center gap-1">
                                        <div className="flex-1 h-2.5 bg-white/[0.03] rounded overflow-hidden">
                                            <motion.div
                                                className="h-full rounded"
                                                style={{ backgroundColor: active ? m.color + "60" : "rgba(255,255,255,0.08)" }}
                                                initial={false}
                                                animate={{ width: `${trainPct}%` }}
                                                transition={{ duration: 0.4 }}
                                            />
                                        </div>
                                        <span className="text-[8px] font-mono w-10 text-right tabular-nums" style={{ color: active ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)" }}>
                                            {trainLoss.toFixed(3)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="flex-1 h-2.5 bg-white/[0.03] rounded overflow-hidden">
                                            <motion.div
                                                className="h-full rounded"
                                                style={{ backgroundColor: active ? m.color : "rgba(255,255,255,0.15)" }}
                                                initial={false}
                                                animate={{ width: `${valPct}%` }}
                                                transition={{ duration: 0.4 }}
                                            />
                                        </div>
                                        <span className="text-[8px] font-mono font-bold w-10 text-right tabular-nums" style={{ color: active ? m.color : "rgba(255,255,255,0.2)" }}>
                                            {valLoss.toFixed(3)}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-14 text-right shrink-0">
                                    <span className="text-[7px] font-mono" style={{ color: gap > 0.15 ? "#ef4444" : gap > 0.08 ? "#f59e0b" : "#10b981" }}>
                                        gap: {gap.toFixed(3)}
                                    </span>
                                    {isBest && <div className="text-[7px] font-mono text-emerald-400">★ best</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex gap-4 mt-2 text-[7px] font-mono text-white/20">
                    <span className="flex items-center gap-1">
                        <span className="w-4 h-1.5 rounded bg-white/10" /> Train
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-4 h-1.5 rounded bg-white/20" /> Validation
                    </span>
                    <span className="ml-auto">gap = val − train (overfitting indicator)</span>
                </div>
            </div>

            {/* Dimension dissection grid */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: meta.color }}>
                        Dimension Dissection — {selected.model.emb_dim}D
                    </span>
                    <span className="text-[8px] font-mono text-white/15">
                        {selected.dims.length === selected.model.emb_dim
                            ? `all ${selected.model.emb_dim} dimensions`
                            : `showing ${selected.dims.length} of ${selected.model.emb_dim}`}
                    </span>
                    {selected.model.emb_dim > (MAX_SHOW_DIMS[selected.model.emb_dim] ?? 8) && (
                        <button
                            onClick={() => setShowAllDims(v => !v)}
                            className="ml-auto px-2 py-0.5 rounded border text-[8px] font-mono transition-all hover:bg-white/[0.04]"
                            style={{ borderColor: meta.color + "30", color: meta.color + "90" }}
                        >
                            {showAllDims ? `Show top ${MAX_SHOW_DIMS[selected.model.emb_dim] ?? 8}` : `Show all ${selected.model.emb_dim}`}
                        </button>
                    )}
                </div>

                <p className="text-[10px] font-mono leading-relaxed text-white/30">{meta.dimNote}</p>

                <div className={`grid gap-2 ${selected.model.emb_dim <= 4 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
                    <AnimatePresence mode="wait">
                        {selected.dims.map(({ dimIdx, sorted, maxAbs, analysis }) => {
                            const isExpanded = expandedDim === dimIdx;
                            const showItems = isExpanded ? sorted : sorted.slice(0, 10);
                            return (
                                <motion.div
                                    key={`${selected.model.emb_dim}-dim${dimIdx}`}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.2, delay: dimIdx * 0.03 }}
                                    className={`rounded-lg border border-white/[0.06] bg-white/[0.015] p-2 cursor-pointer transition-all hover:border-white/[0.12] ${isExpanded ? "col-span-full sm:col-span-2" : ""}`}
                                    onClick={() => setExpandedDim(isExpanded ? null : dimIdx)}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[9px] font-mono font-bold" style={{ color: meta.color }}>Dim {dimIdx}</span>
                                        <span className="text-[7px] font-mono text-white/20 truncate ml-1">{analysis}</span>
                                    </div>
                                    <div className="space-y-px">
                                        {showItems.map(({ ch, val }) => (
                                            <div key={ch} className="flex items-center gap-1 h-[14px]">
                                                <span className="w-6 text-[7px] font-mono text-right shrink-0 font-bold"
                                                    style={{ color: charCatColor(ch) }}>
                                                    {displayChar(ch)}
                                                </span>
                                                <div className="flex-1 h-[10px] relative bg-white/[0.02] rounded-sm overflow-hidden">
                                                    {val >= 0 ? (
                                                        <div
                                                            className="absolute top-0 left-1/2 h-full rounded-r-sm"
                                                            style={{
                                                                width: `${(val / maxAbs) * 50}%`,
                                                                backgroundColor: barColor(val, maxAbs),
                                                            }}
                                                        />
                                                    ) : (
                                                        <div
                                                            className="absolute top-0 h-full rounded-l-sm"
                                                            style={{
                                                                right: "50%",
                                                                width: `${(Math.abs(val) / maxAbs) * 50}%`,
                                                                backgroundColor: barColor(val, maxAbs),
                                                            }}
                                                        />
                                                    )}
                                                    <div className="absolute top-0 left-1/2 w-px h-full bg-white/10" />
                                                </div>
                                                <span className="w-8 text-[6px] font-mono text-right shrink-0 tabular-nums"
                                                    style={{ color: val >= 0 ? "rgba(96,165,250,0.5)" : "rgba(244,114,182,0.5)" }}>
                                                    {val.toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                        {!isExpanded && sorted.length > 10 && (
                                            <div className="mt-1 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-center cursor-pointer hover:bg-white/[0.08] transition-colors">
                                                <span className="text-[8px] font-mono text-white/30">▼ +{sorted.length - 10} more — tap to expand</span>
                                            </div>
                                        )}
                                        {isExpanded && sorted.length > 10 && (
                                            <div className="mt-1 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-center cursor-pointer hover:bg-white/[0.08] transition-colors">
                                                <span className="text-[8px] font-mono text-white/30">▲ collapse</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* Legend + data source */}
            <div className="flex items-center justify-between">
                <div className="flex gap-3 text-[8px] font-mono">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#f472b6" }} /> Vowels</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#60a5fa" }} /> Consonants</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#a78bfa" }} /> Punctuation</span>
                    <span className="text-white/10">|</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-blue-500/50" /> Positive</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-pink-400/50" /> Negative</span>
                </div>
                <p className="text-[7px] font-mono text-white/15">
                    {isFallback ? "Illustrative data" : "Real embeddings · 3-layer H=256 · L1 reg · 50K steps"}
                </p>
            </div>
        </div>
    );
}
