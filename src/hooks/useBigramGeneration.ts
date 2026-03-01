"use client";

import { useCallback,useState } from "react";

import { generateBigram } from "@/lib/lmLabClient";
import type { GenerateResponse } from "@/types/lmLab";

export function useBigramGeneration() {
    const [data, setData] = useState<GenerateResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generate = useCallback(
        async (startChar: string, numTokens: number, temperature: number) => {
            setLoading(true);
            setError(null);
            try {
                const res = await generateBigram(startChar, numTokens, temperature);
                setData(res);
            } catch (err) {
                setError((err as Error).message || "Failed to generate");
                setData(null);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    return { data, loading, error, generate };
}
