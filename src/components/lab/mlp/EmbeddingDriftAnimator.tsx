"use client";

import { useEffect, useRef,useState } from "react";

import { Loader2 } from "lucide-react";

import { useI18n } from "@/i18n/context";
import { fetchMLPEmbedding } from "@/lib/lmLabClient";
import type { MLPEmbeddingResponse, MLPGridConfig } from "@/types/lmLab";

import { EmbeddingSpaceVisualizer } from "./EmbeddingSpaceVisualizer";

/*
  EmbeddingDriftAnimator
  Self-contained: calls fetchMLPEmbedding DIRECTLY with all 4 explicit
  query params from the selectedConfig prop. Never relies on hook closures
  or implicit global state. Manages its own local embedding state.

  Available snapshot steps: step_0 → step_50000 (6 checkpoints)
*/

const SNAPSHOT_STEPS = [0, 1000, 5000, 10000, 20000, 50000];
const STEP_LABELS = ["0", "1k", "5k", "10k", "20k", "50k"];


export interface EmbeddingDriftAnimatorProps {
    selectedConfig: MLPGridConfig | null;
}

export function EmbeddingDriftAnimator({ selectedConfig }: EmbeddingDriftAnimatorProps) {
    const { t } = useI18n();
    const [stepIdx, setStepIdx] = useState(SNAPSHOT_STEPS.length - 1);
    const [embedding, setEmbedding] = useState<MLPEmbeddingResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const prevConfigKey = useRef<string | null>(null);
    const cancelRef = useRef(false);

    useEffect(() => {
        // Hard guard: all 4 params must be present before any request fires
        if (
            !selectedConfig ||
            selectedConfig.embedding_dim == null ||
            selectedConfig.hidden_size == null ||
            selectedConfig.learning_rate == null
        ) return;

        const configKey = [
            selectedConfig.embedding_dim,
            selectedConfig.hidden_size,
            selectedConfig.learning_rate,
        ].join("_");

        // Config changed → reset to final snapshot
        let resolvedIdx = stepIdx;
        if (configKey !== prevConfigKey.current) {
            prevConfigKey.current = configKey;
            resolvedIdx = SNAPSHOT_STEPS.length - 1;
            if (resolvedIdx !== stepIdx) {
                setStepIdx(resolvedIdx);
                // stepIdx change will re-run this effect; skip fetch now
                return;
            }
        }

        // Capture the exact params for this fetch — no closures over hook state
        const { embedding_dim, hidden_size, learning_rate } = selectedConfig;
        const numericStep = SNAPSHOT_STEPS[resolvedIdx];

        cancelRef.current = false;
        setLoading(true);
        setError(null);

        fetchMLPEmbedding(embedding_dim, hidden_size, learning_rate, numericStep)
            .then((res) => {
                if (!cancelRef.current) setEmbedding(res);
            })
            .catch(async (err) => {
                if (cancelRef.current) return;
                // Graceful fallback: if this snapshot doesn't exist, try final step
                if (resolvedIdx !== SNAPSHOT_STEPS.length - 1) {
                    try {
                        const fallback = await fetchMLPEmbedding(
                            embedding_dim, hidden_size, learning_rate,
                            SNAPSHOT_STEPS[SNAPSHOT_STEPS.length - 1]
                        );
                        if (!cancelRef.current) {
                            setEmbedding(fallback);
                            return;
                        }
                    } catch { /* ignore fallback failure */ }
                }
                if (!cancelRef.current) {
                    setError((err as Error).message ?? "Failed to load embeddings");
                }
            })
            .finally(() => {
                if (!cancelRef.current) setLoading(false);
            });

        return () => { cancelRef.current = true; };
         
    }, [selectedConfig, stepIdx]);

    const phaseTexts = [
        t("models.mlp.embeddingDrift.phases.0"),
        t("models.mlp.embeddingDrift.phases.1"),
        t("models.mlp.embeddingDrift.phases.2"),
        t("models.mlp.embeddingDrift.phases.3"),
        t("models.mlp.embeddingDrift.phases.4"),
        t("models.mlp.embeddingDrift.phases.5"),
    ];

    return (
        <div className="space-y-3">
            {/* Snapshot slider */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                        {t("models.mlp.embeddingDrift.trainingSnapshot")}
                    </span>
                    <span className="text-xs font-mono font-bold text-violet-400">
                        {t("models.mlp.embeddingDrift.step")} {STEP_LABELS[stepIdx]}
                        {loading && (
                            <Loader2 className="w-3 h-3 inline ml-1.5 animate-spin text-violet-400/50" />
                        )}
                    </span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={SNAPSHOT_STEPS.length - 1}
                    value={stepIdx}
                    onChange={(e) => setStepIdx(Number(e.target.value))}
                    className="w-full accent-violet-500 cursor-pointer"
                    disabled={loading}
                />
                <div className="flex justify-between text-[8px] font-mono text-white/15 mt-1">
                    {STEP_LABELS.map((label, i) => (
                        <span
                            key={i}
                            className={`cursor-pointer hover:text-white/30 transition-colors ${i === stepIdx ? "text-violet-400/60 font-bold" : ""
                                }`}
                            onClick={() => setStepIdx(i)}
                        >
                            {label}
                        </span>
                    ))}
                </div>
                <p className="text-[9px] text-white/20 mt-2 leading-relaxed">
                    {phaseTexts[stepIdx]}
                </p>
            </div>

            {/* Error: only shown for unexpected failures (not missing-params — those are guarded above) */}
            {error && !loading && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/[0.04] border border-amber-500/15">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <p className="text-[9px] text-amber-300/50 font-mono">
                        {t("models.mlp.embeddingDrift.snapshotUnavailable")}
                    </p>
                </div>
            )}

            {/* Embedding visualizer uses local state only */}
            <EmbeddingSpaceVisualizer
                embedding={embedding}
                embeddingLoading={loading}
                embeddingError={null}
            />
        </div>
    );
}
