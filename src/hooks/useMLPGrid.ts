"use client";

import { useCallback, useEffect, useRef,useState } from "react";

import {
    fetchMLPEmbedding,
    fetchMLPGrid,
    fetchMLPTimeline,
    generateMLP,
} from "@/lib/lmLabClient";
import type {
    MLPEmbeddingResponse,
    MLPGenerateResponse,
    MLPGridConfig,
    MLPGridResponse,
    MLPTimelineResponse,
} from "@/types/lmLab";

export interface UseMLPGridReturn {
    /* ── Grid data ── */
    configs: MLPGridConfig[];
    datasetInfo: MLPGridResponse["dataset_info"] | null;
    selectedConfig: MLPGridConfig | null;
    gridLoading: boolean;
    gridError: string | null;

    /* ── Selection ── */
    selectConfig: (config: MLPGridConfig) => void;
    selectClosest: (params: {
        embeddingDim?: number;
        hiddenSize?: number;
        learningRate?: number;
    }) => void;

    /* ── Timeline ── */
    timeline: MLPTimelineResponse | null;
    timelineLoading: boolean;
    timelineError: string | null;
    fetchTimelineData: () => Promise<void>;

    /* ── Embedding ── */
    embedding: MLPEmbeddingResponse | null;
    embeddingLoading: boolean;
    embeddingError: string | null;
    fetchEmbeddingData: (snapshotStep?: number) => Promise<void>;

    /* ── Generation ── */
    generation: MLPGenerateResponse | null;
    generationLoading: boolean;
    generationError: string | null;
    generateText: (seedText: string, maxTokens: number, temperature: number) => Promise<void>;
}

export function useMLPGrid(): UseMLPGridReturn {
    /* ── Grid state ── */
    const [configs, setConfigs] = useState<MLPGridConfig[]>([]);
    const [datasetInfo, setDatasetInfo] = useState<MLPGridResponse["dataset_info"] | null>(null);
    const [selectedConfig, setSelectedConfig] = useState<MLPGridConfig | null>(null);
    const [gridLoading, setGridLoading] = useState(false);
    const [gridError, setGridError] = useState<string | null>(null);

    /* ── Timeline state ── */
    const [timeline, setTimeline] = useState<MLPTimelineResponse | null>(null);
    const [timelineLoading, setTimelineLoading] = useState(false);
    const [timelineError, setTimelineError] = useState<string | null>(null);

    /* ── Embedding state ── */
    const [embedding, setEmbedding] = useState<MLPEmbeddingResponse | null>(null);
    const [embeddingLoading, setEmbeddingLoading] = useState(false);
    const [embeddingError, setEmbeddingError] = useState<string | null>(null);

    /* ── Generation state ── */
    const [generation, setGeneration] = useState<MLPGenerateResponse | null>(null);
    const [generationLoading, setGenerationLoading] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);

    /* ── Abort controllers ── */
    const timelineAbort = useRef<AbortController | null>(null);
    const embeddingAbort = useRef<AbortController | null>(null);
    const generationAbort = useRef<AbortController | null>(null);

    /* ── Fetch grid on mount ── */
    useEffect(() => {
        let cancelled = false;
        setGridLoading(true);
        setGridError(null);

        fetchMLPGrid()
            .then((res) => {
                if (cancelled) return;
                const raw = res.configurations ?? res.configs ?? [];
                const configs = raw.map((c) => ({
                    ...c,
                    config_id: c.config_id ?? `E${c.embedding_dim}_H${c.hidden_size}_LR${c.learning_rate}`,
                }));
                setConfigs(configs);
                setDatasetInfo(res.dataset_info ?? null);
                // Auto-select first config
                if (configs.length > 0) {
                    setSelectedConfig(configs[0]);
                }
            })
            .catch((err) => {
                if (cancelled) return;
                setGridError((err as Error).message || "Failed to load MLP grid");
            })
            .finally(() => {
                if (!cancelled) setGridLoading(false);
            });

        return () => { cancelled = true; };
    }, []);

    /* ── Select config ── */
    const selectConfig = useCallback((config: MLPGridConfig) => {
        setSelectedConfig(config);
        // Clear dependent data
        setTimeline(null);
        setEmbedding(null);
        setGeneration(null);
    }, []);

    /* ── Select closest config by hyperparameters ── */
    const selectClosest = useCallback(
        (params: { embeddingDim?: number; hiddenSize?: number; learningRate?: number }) => {
            if (configs.length === 0) return;

            let best = configs[0];
            let bestDist = Infinity;

            for (const c of configs) {
                let d = 0;
                if (params.embeddingDim !== undefined) {
                    d += Math.abs(Math.log(c.embedding_dim + 1) - Math.log(params.embeddingDim + 1));
                }
                if (params.hiddenSize !== undefined) {
                    d += Math.abs(Math.log(c.hidden_size + 1) - Math.log(params.hiddenSize + 1));
                }
                if (params.learningRate !== undefined) {
                    d += Math.abs(Math.log(c.learning_rate) - Math.log(params.learningRate));
                }
                if (d < bestDist) {
                    bestDist = d;
                    best = c;
                }
            }

            if (best !== selectedConfig) {
                selectConfig(best);
            }
        },
        [configs, selectedConfig, selectConfig]
    );

    /* ── Fetch timeline ── */
    const fetchTimelineData = useCallback(async () => {
        if (!selectedConfig) return;
        timelineAbort.current?.abort();
        timelineAbort.current = new AbortController();

        setTimelineLoading(true);
        setTimelineError(null);

        try {
            const res = await fetchMLPTimeline(
                selectedConfig.embedding_dim,
                selectedConfig.hidden_size,
                selectedConfig.learning_rate
            );
            setTimeline(res);
        } catch (err) {
            if ((err as Error).name !== "AbortError") {
                setTimelineError((err as Error).message || "Failed to fetch timeline");
            }
        } finally {
            setTimelineLoading(false);
        }
    }, [selectedConfig]);

    /* ── Fetch embedding ── */
    const fetchEmbeddingData = useCallback(
        async (snapshotStep?: number) => {
            if (!selectedConfig) return;
            embeddingAbort.current?.abort();
            embeddingAbort.current = new AbortController();

            setEmbeddingLoading(true);
            setEmbeddingError(null);

            try {
                const res = await fetchMLPEmbedding(
                    selectedConfig.embedding_dim,
                    selectedConfig.hidden_size,
                    selectedConfig.learning_rate,
                    snapshotStep
                );
                setEmbedding(res);
            } catch (err) {
                if ((err as Error).name !== "AbortError") {
                    setEmbeddingError((err as Error).message || "Failed to fetch embeddings");
                }
            } finally {
                setEmbeddingLoading(false);
            }
        },
        [selectedConfig]
    );

    /* ── Generate text ── */
    const generateText = useCallback(
        async (seedText: string, maxTokens: number, temperature: number) => {
            if (!selectedConfig) return;
            generationAbort.current?.abort();
            generationAbort.current = new AbortController();

            setGenerationLoading(true);
            setGenerationError(null);

            try {
                const res = await generateMLP(
                    selectedConfig.embedding_dim,
                    selectedConfig.hidden_size,
                    selectedConfig.learning_rate,
                    seedText,
                    maxTokens,
                    temperature
                );
                setGeneration(res);
            } catch (err) {
                if ((err as Error).name !== "AbortError") {
                    setGenerationError((err as Error).message || "Failed to generate text");
                }
            } finally {
                setGenerationLoading(false);
            }
        },
        [selectedConfig]
    );

    /* ── Auto-fetch timeline + embedding when config changes ── */
    // This ensures the explorer always has data for the selected config
    // without requiring manual user action (load buttons).
    const prevConfigId = useRef<string | null>(null);
    useEffect(() => {
        if (!selectedConfig) return;
        const id = `${selectedConfig.embedding_dim}_${selectedConfig.hidden_size}_${selectedConfig.learning_rate}`;
        if (id === prevConfigId.current) return;
        prevConfigId.current = id;

        // Fetch timeline (non-blocking, parallel)
        fetchTimelineData();
        // Fetch embedding (non-blocking, parallel)
        fetchEmbeddingData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedConfig]);

    /* ── Cleanup on unmount ── */
    useEffect(() => {
        return () => {
            timelineAbort.current?.abort();
            embeddingAbort.current?.abort();
            generationAbort.current?.abort();
        };
    }, []);

    return {
        configs,
        datasetInfo,
        selectedConfig,
        gridLoading,
        gridError,
        selectConfig,
        selectClosest,
        timeline,
        timelineLoading,
        timelineError,
        fetchTimelineData,
        embedding,
        embeddingLoading,
        embeddingError,
        fetchEmbeddingData,
        generation,
        generationLoading,
        generationError,
        generateText,
    };
}
