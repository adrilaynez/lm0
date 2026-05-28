"use client";

import { useCallback,useState } from "react";

import { generateNgram } from "@/features/lab/lib/lmLabClient";
import type { GenerateResponse } from "@/features/lab/types/lmLab";

export function useNgramGeneration(contextSize: number) {
    const [data, setData] = useState<GenerateResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generate = useCallback(
        async (startChar: string, numTokens: number, temperature: number) => {
            setLoading(true);
            setError(null);
            try {
                const res = await generateNgram(startChar, numTokens, temperature, contextSize);
                setData(res);
            } catch (err) {
                setError((err as Error).message || "Failed to generate");
                setData(null);
            } finally {
                setLoading(false);
            }
        },
        [contextSize]
    );

    return { data, loading, error, generate };
}
