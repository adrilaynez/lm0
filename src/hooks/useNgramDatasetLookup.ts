"use client";

import { useCallback,useState } from "react";

import { datasetLookup } from "@/lib/lmLabClient";
import type { DatasetLookupResponse } from "@/types/lmLab";

interface UseNgramDatasetLookupReturn {
    data: DatasetLookupResponse | null;
    loading: boolean;
    error: string | null;
    lookup: (context: string[], nextToken: string) => Promise<void>;
    clear: () => void;
}

export function useNgramDatasetLookup(): UseNgramDatasetLookupReturn {
    const [data, setData] = useState<DatasetLookupResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const lookup = useCallback(async (context: string[], nextToken: string) => {
        setLoading(true);
        setError(null);
        setData(null);

        try {
            const response = await datasetLookup(context, nextToken);
            setData(response);
        } catch (err: any) {
            console.error("Dataset Lookup Error:", err);
            setError(err.message || "Failed to lookup dataset examples");
        } finally {
            setLoading(false);
        }
    }, []);

    const clear = useCallback(() => {
        setData(null);
        setError(null);
        setLoading(false);
    }, []);

    return {
        data,
        loading,
        error,
        lookup,
        clear
    };
}
