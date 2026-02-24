"use client";

import { useState, useCallback, useRef } from "react";
import { visualizeNgram } from "@/lib/lmLabClient";
import type { NGramInferenceResponse } from "@/types/lmLab";

interface UseNgramVisualizationReturn {
    data: NGramInferenceResponse | null;
    loading: boolean;
    error: string | null;
    isCombinatorialExplosion: boolean;
    contextSize: number;
    setContextSize: (n: number) => void;
    analyze: (text: string, topK?: number) => Promise<void>;
}

export function useNgramVisualization(): UseNgramVisualizationReturn {
    const [data, setData] = useState<NGramInferenceResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [contextSize, setContextSizeState] = useState(1);
    const [isCombinatorialExplosion, setCombinatorialExplosion] = useState(false);

    // Track last text so we can re-fetch when context size changes
    const lastTextRef = useRef<string>("");
    const lastTopKRef = useRef<number>(10);

    const analyze = useCallback(async (text: string, topK: number = 10) => {
        if (!text.trim()) return;

        lastTextRef.current = text;
        lastTopKRef.current = topK;

        setLoading(true);
        setError(null);
        setCombinatorialExplosion(false);

        try {
            const response = await visualizeNgram(text, contextSize, topK);
            setData(response);
        } catch (err: unknown) {
            console.error("N-Gram Visualization Error:", err);
            const message = err instanceof Error ? err.message : "Failed to visualize N-Gram";

            if (message.includes("CONTEXT_TOO_LARGE") || message.includes("context_too_large")) {
                setCombinatorialExplosion(true);
                setError("Combinatorial Explosion: Context size too large for this dataset.");
            } else {
                setError(message);
            }
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [contextSize]);

    // Wrapper that clears state AND re-fetches with last text when context changes
    const setContextSize = useCallback((n: number) => {
        setContextSizeState(n);
        setError(null);
        setCombinatorialExplosion(false);
        setData(null);
    }, []);

    return {
        data,
        loading,
        error,
        isCombinatorialExplosion,
        contextSize,
        setContextSize,
        analyze
    };
}
