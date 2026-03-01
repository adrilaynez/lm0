"use client";

import { useCallback,useState } from "react";

import { visualizeBigram } from "@/lib/lmLabClient";
import type { VisualizeResponse } from "@/types/lmLab";

export function useBigramVisualization() {
    const [data, setData] = useState<VisualizeResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const analyze = useCallback(async (text: string, topK: number) => {
        setLoading(true);
        setError(null);
        try {
            const res = await visualizeBigram(text, topK);
            setData(res);
        } catch (err) {
            setError((err as Error).message || "Failed to analyze");
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    return { data, loading, error, analyze };
}
