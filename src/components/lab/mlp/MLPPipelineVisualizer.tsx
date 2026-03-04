"use client";

import { useRef, useState } from "react";

import { ArrowRight, Loader2 } from "lucide-react";

import { fetchMLPInternals } from "@/lib/lmLabClient";
import type { MLPGridConfig, MLPInternalsResponse } from "@/types/lmLab";

/*
  MLPPipelineVisualizer
  Animates the MLP forward pass step-by-step using real backend data.
  Stages: tokens → embed → concat → W1 → tanh → W2 → softmax → prediction
*/

const STAGES = [
    { id: "input", label: "1. Input Tokens", sub: "Characters from the context window" },
    { id: "embed", label: "2. Embedding Lookup", sub: "Each token → dense vector" },
    { id: "concat", label: "3. Concatenation", sub: "Vectors stacked into one long input" },
    { id: "hidden", label: "4. Hidden Layer (W₁ + b₁)", sub: "Linear transformation" },
    { id: "tanh", label: "5. Tanh Activation", sub: "Non-linearity squashes values to (−1, 1)" },
    { id: "output", label: "6. Output Layer (W₂ + b₂)", sub: "Projects to vocabulary size" },
    { id: "softmax", label: "7. Softmax", sub: "Converts logits → probabilities" },
    { id: "predict", label: "8. Prediction", sub: "Top candidates for next token" },
];

interface StageDisplayProps {
    stage: string;
    data: MLPInternalsResponse | null;
    seed: string;
}

function MiniBar({ v, max, color = "bg-violet-400/40" }: { v: number; max: number; color?: string }) {
    const pct = max === 0 ? 0 : Math.min(Math.abs(v) / max, 1) * 100;
    return (
        <div className="flex-1 h-2 rounded bg-white/[0.04] overflow-hidden">
            <div className={`h-full rounded ${color} transition-all duration-300`} style={{ width: `${pct.toFixed(0)}%` }} />
        </div>
    );
}

function flattenTensor(t: { data: number[][] } | undefined): number[] {
    if (!t) return [];
    return t.data.flat(Infinity) as number[];
}

function StageDisplay({ stage, data, seed }: StageDisplayProps) {
    if (!data) return null;

    const contextSize = (data.config["context_size"] as number | undefined) ?? 3;
    const chars = seed.length >= contextSize
        ? [...seed].slice(-contextSize)
        : [...Array(contextSize - seed.length).fill("·"), ...seed];

    const hiddenActs = flattenTensor(data.internals.hidden_activations as { data: number[][] } | undefined);
    const hiddenPre = flattenTensor(data.internals.hidden_preactivations as { data: number[][] } | undefined);

    const SHOW = 24; // neurons to display

    if (stage === "input") {
        return (
            <div className="space-y-2">
                <p className="text-[10px] font-mono text-white/30">Context window: last {contextSize} characters</p>
                <div className="flex gap-2">
                    {chars.map((ch, i) => (
                        <div key={i} className="flex-1 rounded-lg border border-violet-500/20 bg-violet-500/[0.06] p-3 text-center">
                            <span className="text-xl font-mono text-violet-300">{ch === "·" ? <span className="text-white/15">·</span> : `"${ch}"`}</span>
                            <p className="text-[8px] font-mono text-white/20 mt-1">token {data.input.token_ids[data.input.token_ids.length - contextSize + i] ?? "—"}</p>
                        </div>
                    ))}
                </div>
                <p className="text-[10px] font-mono text-white/20 mt-2">
                    Each character is looked up by its integer ID in the vocabulary.
                </p>
            </div>
        );
    }

    if (stage === "embed") {
        const embDim = (data.config["embedding_dim"] as number | undefined) ?? 8;
        return (
            <div className="space-y-2">
                <p className="text-[10px] font-mono text-white/30">
                    Each token ID → row of the embedding matrix E ∈ ℝ^({contextSize}×{embDim})
                </p>
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${contextSize}, 1fr)` }}>
                    {chars.map((ch, i) => (
                        <div key={i} className="space-y-1">
                            <p className="text-[8px] font-mono text-white/25 text-center">&quot;{ch === "·" ? "pad" : ch}&quot;</p>
                            <div className="space-y-0.5">
                                {Array.from({ length: Math.min(embDim, 8) }).map((_, d) => (
                                    <div key={d} className="h-1.5 rounded bg-violet-400/20" style={{ opacity: 0.3 + (((i * 7 + d * 13) % 10) / 10) * 0.6 }} />
                                ))}
                                {embDim > 8 && <p className="text-[7px] font-mono text-white/15 text-center">+{embDim - 8} dims</p>}
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-[10px] font-mono text-white/20">
                    Each vector is a row of learned parameters trained end-to-end with the rest of the model.
                </p>
            </div>
        );
    }

    if (stage === "concat") {
        const embDim = (data.config["embedding_dim"] as number | undefined) ?? 8;
        const total = embDim * contextSize;
        return (
            <div className="space-y-2">
                <p className="text-[10px] font-mono text-white/30">
                    {contextSize} vectors × {embDim} dims = {total} values concatenated into one input vector
                </p>
                <div className="flex gap-0.5 h-8 rounded overflow-hidden">
                    {chars.map((_, i) => (
                        <div
                            key={i}
                            className="flex-1 rounded-sm"
                            style={{
                                backgroundColor: ["rgb(139,92,246,0.4)", "rgb(59,130,246,0.4)", "rgb(16,185,129,0.4)"][i % 3],
                                opacity: 0.6 + i * 0.1,
                            }}
                        />
                    ))}
                </div>
                <div className="flex justify-between text-[7px] font-mono text-white/15">
                    {chars.map((ch, i) => (
                        <span key={i} className="flex-1 text-center">&quot;{ch === "·" ? "pad" : ch}&quot; ({embDim}d)</span>
                    ))}
                </div>
                <p className="text-[10px] font-mono text-white/20">
                    This {total}-dimensional vector is the actual input to the hidden layer.
                </p>
            </div>
        );
    }

    if (stage === "hidden") {
        const hiddenSize = (data.config["hidden_size"] as number | undefined) ?? 128;
        const displayed = hiddenPre.slice(0, SHOW);
        const maxAbs = Math.max(...displayed.map(Math.abs), 0.001);
        return (
            <div className="space-y-2">
                <p className="text-[10px] font-mono text-white/30">
                    W₁ ({hiddenSize} neurons) — linear pre-activation values (before tanh)
                </p>
                <div className="space-y-0.5">
                    {displayed.map((v, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-[7px] font-mono text-white/15 w-6 text-right">n{i}</span>
                            <MiniBar v={v} max={maxAbs} color={v >= 0 ? "bg-blue-400/40" : "bg-rose-400/40"} />
                            <span className="text-[7px] font-mono text-white/25 w-10 text-right">{v.toFixed(2)}</span>
                        </div>
                    ))}
                    {hiddenSize > SHOW && (
                        <p className="text-[8px] font-mono text-white/15 text-center pt-1">
                            … {hiddenSize - SHOW} more neurons
                        </p>
                    )}
                </div>
                <p className="text-[10px] font-mono text-white/20">
                    Each neuron computes a weighted sum of all {(data.config["embedding_dim"] as number ?? 8) * contextSize} input values.
                </p>
            </div>
        );
    }

    if (stage === "tanh") {
        const hiddenSize = (data.config["hidden_size"] as number | undefined) ?? 128;
        const displayed = hiddenActs.slice(0, SHOW);
        const maxAbs = 1;
        const stats = data.internals.activation_stats;
        return (
            <div className="space-y-2">
                <p className="text-[10px] font-mono text-white/30">
                    tanh(W₁x + b₁) — activations squashed into (−1, 1)
                </p>
                <div className="space-y-0.5">
                    {displayed.map((v, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-[7px] font-mono text-white/15 w-6 text-right">n{i}</span>
                            <MiniBar v={v} max={maxAbs} color={Math.abs(v) > 0.9 ? "bg-amber-400/50" : "bg-emerald-400/40"} />
                            <span className="text-[7px] font-mono text-white/25 w-10 text-right">{v.toFixed(2)}</span>
                        </div>
                    ))}
                    {hiddenSize > SHOW && (
                        <p className="text-[8px] font-mono text-white/15 text-center pt-1">… {hiddenSize - SHOW} more neurons</p>
                    )}
                </div>
                {stats && (
                    <div className="flex gap-4 text-[9px] font-mono text-white/25 pt-1">
                        <span>mean: {stats.mean.toFixed(3)}</span>
                        <span>std: {stats.std.toFixed(3)}</span>
                        <span className="text-amber-400/50">amber = saturated (|v| &gt; 0.9)</span>
                    </div>
                )}
                <p className="text-[10px] font-mono text-white/20">
                    Values near ±1 are saturated — those neurons contribute near-zero gradient during training.
                </p>
            </div>
        );
    }

    if (stage === "output") {
        const vocabSize = data.metadata.vocab_size;
        return (
            <div className="space-y-2">
                <p className="text-[10px] font-mono text-white/30">
                    W₂ produces {vocabSize} raw scores (logits) — one per vocabulary token
                </p>
                <div className="grid grid-cols-8 gap-0.5">
                    {Array.from({ length: Math.min(vocabSize, 64) }).map((_, i) => (
                        <div key={i} className="h-3 rounded bg-white/[0.04]" style={{ opacity: 0.1 + (((i * 17 + 3) % 10) / 10) * 0.5 }} />
                    ))}
                </div>
                <p className="text-[10px] font-mono text-white/20">
                    These are called logits — unnormalized scores. They can be any real number; higher means more likely.
                    Softmax converts them to probabilities in the next step.
                </p>
            </div>
        );
    }

    if (stage === "softmax") {
        return (
            <div className="space-y-2">
                <p className="text-[10px] font-mono text-white/30">
                    softmax(logits / T) — each score becomes a probability (0–1), all sum to 1
                </p>
                <div className="space-y-1">
                    {data.predictions.slice(0, 8).map(({ token, probability }, i) => {
                        const display = token === " " ? "⎵" : token === "\n" ? "↵" : token;
                        return (
                            <div key={i} className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-white/50 w-5 text-center">{display}</span>
                                <div className="flex-1 h-3 rounded bg-white/[0.04] overflow-hidden">
                                    <div
                                        className="h-full rounded bg-violet-400/40 transition-all"
                                        style={{ width: `${(probability * 100).toFixed(1)}%` }}
                                    />
                                </div>
                                <span className="text-[9px] font-mono text-white/30 w-10 text-right">
                                    {(probability * 100).toFixed(1)}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    if (stage === "predict") {
        const top = data.predictions[0];
        const display = (t: string) => t === " " ? "⎵" : t === "\n" ? "↵" : t;
        return (
            <div className="space-y-3">
                <p className="text-[10px] font-mono text-white/30">Top predicted next tokens for this context</p>
                <div className="flex items-center gap-4">
                    <div className="rounded-xl border border-violet-500/30 bg-violet-500/[0.08] p-5 text-center min-w-[80px]">
                        <p className="text-[8px] font-mono text-white/25 mb-1">Most likely next</p>
                        <p className="text-3xl font-mono text-violet-300">&quot;{display(top.token)}&quot;</p>
                        <p className="text-[10px] font-mono text-violet-400/60 mt-1">{(top.probability * 100).toFixed(1)}%</p>
                    </div>
                    <div className="space-y-1 flex-1">
                        {data.predictions.slice(1, 6).map(({ token, probability }, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-white/40 w-6 text-center">&quot;{display(token)}&quot;</span>
                                <div className="flex-1 h-2.5 rounded bg-white/[0.04] overflow-hidden">
                                    <div className="h-full rounded bg-white/10" style={{ width: `${(probability / top.probability * 100).toFixed(0)}%` }} />
                                </div>
                                <span className="text-[9px] font-mono text-white/25 w-10 text-right">{(probability * 100).toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
                <p className="text-[10px] font-mono text-white/20">
                    During generation, one token is sampled from this distribution, appended to the context,
                    and the whole pipeline runs again for the next character.
                </p>
            </div>
        );
    }

    return null;
}

interface Props {
    selectedConfig: MLPGridConfig | null;
}

export function MLPPipelineVisualizer({ selectedConfig }: Props) {
    const [seed, setSeed] = useState("the");
    const [activeStage, setActiveStage] = useState(0);
    const [data, setData] = useState<MLPInternalsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const cancelRef = useRef(false);

    const handleRun = async () => {
        if (
            !selectedConfig ||
            selectedConfig.embedding_dim == null ||
            selectedConfig.hidden_size == null ||
            selectedConfig.learning_rate == null ||
            !seed.trim()
        ) return;

        cancelRef.current = false;
        setLoading(true);
        setError(null);
        setData(null);
        setActiveStage(0);

        try {
            const res = await fetchMLPInternals(
                selectedConfig.embedding_dim,
                selectedConfig.hidden_size,
                selectedConfig.learning_rate,
                seed.trim()
            );
            if (!cancelRef.current) {
                setData(res);
                setActiveStage(0);
            }
        } catch (err) {
            if (!cancelRef.current) setError((err as Error).message ?? "Failed to run pipeline");
        } finally {
            if (!cancelRef.current) setLoading(false);
        }
    };

    const canRun = !!selectedConfig && selectedConfig.embedding_dim > 0 && !!seed.trim() && !loading;

    return (
        <div className="rounded-xl border border-white/[0.06] bg-black/30 p-5 space-y-5">
            <div className="space-y-1">
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/25">MLP Forward Pass · Step by Step</p>
                <p className="text-sm text-white/50 leading-relaxed">
                    Type a short seed, run the model, then click each stage to see exactly what the network computes.
                </p>
            </div>

            {/* Input row */}
            <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-1">
                    <label className="text-[9px] font-mono uppercase tracking-widest text-white/25">Seed text</label>
                    <input
                        type="text"
                        value={seed}
                        onChange={e => setSeed(e.target.value)}
                        maxLength={16}
                        placeholder="e.g. the"
                        className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-sm font-mono text-white/70 placeholder:text-white/15 focus:outline-none focus:border-violet-500/40"
                    />
                </div>
                <button
                    onClick={handleRun}
                    disabled={!canRun}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/20 border border-violet-500/30 text-[11px] font-mono text-violet-300 hover:bg-violet-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Run pipeline
                </button>
            </div>

            {!selectedConfig && (
                <p className="text-[10px] font-mono text-amber-400/50 italic">
                    Select a configuration in the Hyperparameter Explorer above to enable the pipeline.
                </p>
            )}

            {selectedConfig?.embedding_dim === 0 && (
                <p className="text-[10px] font-mono text-amber-400/50 italic">
                    Pipeline requires embedding dimension &ge; 1. Please select a valid configuration in the explorer.
                </p>
            )}

            {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/[0.04] border border-rose-500/15">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                    <p className="text-[10px] text-rose-300/60 font-mono">{error}</p>
                </div>
            )}

            {/* Stage pipeline */}
            {data && (
                <div className="space-y-4">
                    {/* Stage selector */}
                    <div className="flex flex-wrap gap-1.5">
                        {STAGES.map((s, i) => (
                            <button
                                key={s.id}
                                onClick={() => setActiveStage(i)}
                                className={`px-2.5 py-1 rounded text-[9px] font-mono border transition-all ${activeStage === i
                                    ? "bg-violet-500/20 text-violet-300 border-violet-500/40"
                                    : "bg-white/[0.03] text-white/30 border-white/[0.06] hover:text-white/50 hover:border-white/15"
                                    }`}
                            >
                                {i + 1}. {s.id}
                            </button>
                        ))}
                    </div>

                    {/* Active stage detail */}
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
                        <div>
                            <p className="text-[10px] font-mono font-bold text-violet-300">{STAGES[activeStage].label}</p>
                            <p className="text-[10px] font-mono text-white/30">{STAGES[activeStage].sub}</p>
                        </div>
                        <StageDisplay stage={STAGES[activeStage].id} data={data} seed={seed} />
                    </div>

                    {/* Prev / Next */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setActiveStage(i => Math.max(i - 1, 0))}
                            disabled={activeStage === 0}
                            className="px-3 py-1.5 rounded text-[10px] font-mono border border-white/[0.06] text-white/30 hover:text-white/50 disabled:opacity-20 transition-all"
                        >
                            ← Prev
                        </button>
                        <div className="flex gap-1">
                            {STAGES.map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${i === activeStage ? "bg-violet-400" : "bg-white/10"}`}
                                    onClick={() => setActiveStage(i)}
                                />
                            ))}
                        </div>
                        <button
                            onClick={() => setActiveStage(i => Math.min(i + 1, STAGES.length - 1))}
                            disabled={activeStage === STAGES.length - 1}
                            className="flex items-center gap-1 px-3 py-1.5 rounded text-[10px] font-mono border border-white/[0.06] text-white/30 hover:text-white/50 disabled:opacity-20 transition-all"
                        >
                            Next <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>

                    <p className="text-[9px] font-mono text-white/15 text-center">
                        Model: emb={selectedConfig?.embedding_dim} · hidden={selectedConfig?.hidden_size} · lr={selectedConfig?.learning_rate} · {data.metadata.inference_time_ms.toFixed(1)}ms
                    </p>
                </div>
            )}

            {!data && !loading && (
                <div className="rounded-lg border border-dashed border-white/[0.06] p-6 text-center">
                    <p className="text-[10px] font-mono text-white/20">
                        Enter a seed and click &quot;Run pipeline&quot; to trace the full forward pass through the network.
                    </p>
                </div>
            )}
        </div>
    );
}
