"use client";

import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";

import { useI18n } from "@/i18n/context";
import { fetchMLPEmbeddingQuality } from "@/lib/lmLabClient";
import type { MLPEmbeddingQualityResponse } from "@/types/lmLab";
import type { MLPGridConfig } from "@/types/lmLab";

/*
  NearestNeighborExplorer
  Fetches embedding quality (nearest neighbors by cosine similarity)
  for the selected config, then lets user pick a token to see neighbors.
*/

const DEFAULT_CONFIG = { embedding_dim: 2, hidden_size: 64, learning_rate: 0.01 };

// Curated fallback nearest-neighbor data derived from real E32 H64 LR0.01 model
// Filtered to display-friendly chars. Used when backend is unreachable.
const FALLBACK_NEIGHBORS: Record<string, { token: string; similarity: number }[]> = {
    a: [{ token: "e", similarity: 0.42 }, { token: "i", similarity: 0.16 }, { token: "k", similarity: 0.19 }, { token: "o", similarity: 0.15 }, { token: "u", similarity: 0.12 }],
    e: [{ token: "a", similarity: 0.42 }, { token: "u", similarity: 0.40 }, { token: "o", similarity: 0.27 }, { token: "i", similarity: 0.14 }, { token: "n", similarity: 0.20 }],
    i: [{ token: "h", similarity: 0.29 }, { token: "a", similarity: 0.16 }, { token: "n", similarity: 0.14 }, { token: "m", similarity: 0.15 }, { token: "e", similarity: 0.14 }],
    o: [{ token: "e", similarity: 0.27 }, { token: "q", similarity: 0.28 }, { token: "s", similarity: 0.21 }, { token: "a", similarity: 0.15 }, { token: "d", similarity: 0.16 }],
    u: [{ token: "e", similarity: 0.40 }, { token: "x", similarity: 0.48 }, { token: "s", similarity: 0.25 }, { token: "t", similarity: 0.25 }, { token: "r", similarity: 0.23 }],
    t: [{ token: "r", similarity: 0.44 }, { token: "j", similarity: 0.32 }, { token: "c", similarity: 0.30 }, { token: "f", similarity: 0.29 }, { token: "s", similarity: 0.29 }],
    h: [{ token: "m", similarity: 0.37 }, { token: "i", similarity: 0.29 }, { token: "g", similarity: 0.20 }, { token: "n", similarity: 0.20 }, { token: "d", similarity: 0.17 }],
    n: [{ token: "x", similarity: 0.21 }, { token: "h", similarity: 0.20 }, { token: "e", similarity: 0.20 }, { token: "q", similarity: 0.19 }, { token: "l", similarity: 0.15 }],
    s: [{ token: "q", similarity: 0.33 }, { token: "t", similarity: 0.29 }, { token: "k", similarity: 0.25 }, { token: "u", similarity: 0.25 }, { token: "r", similarity: 0.23 }],
    r: [{ token: "j", similarity: 0.49 }, { token: "t", similarity: 0.44 }, { token: "l", similarity: 0.30 }, { token: "x", similarity: 0.24 }, { token: "s", similarity: 0.23 }],
    d: [{ token: "m", similarity: 0.35 }, { token: "y", similarity: 0.24 }, { token: "k", similarity: 0.22 }, { token: "o", similarity: 0.16 }, { token: "h", similarity: 0.17 }],
    l: [{ token: "r", similarity: 0.30 }, { token: "b", similarity: 0.18 }, { token: "a", similarity: 0.15 }, { token: "n", similarity: 0.15 }, { token: "j", similarity: 0.14 }],
    ".": [{ token: "m", similarity: 0.24 }, { token: "k", similarity: 0.13 }, { token: "w", similarity: 0.09 }, { token: "d", similarity: 0.08 }, { token: "h", similarity: 0.06 }],
    " ": [{ token: "a", similarity: 0.26 }, { token: "i", similarity: 0.22 }, { token: "e", similarity: 0.18 }, { token: "v", similarity: 0.27 }, { token: "w", similarity: 0.22 }],
};

export interface NearestNeighborExplorerProps {
    selectedConfig: MLPGridConfig | null;
    highlightedToken?: string | null;
}

export function NearestNeighborExplorer({ selectedConfig, highlightedToken }: NearestNeighborExplorerProps) {
    const { t } = useI18n();
    const [data, setData] = useState<MLPEmbeddingQualityResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedToken, setSelectedToken] = useState<string | null>(null);
    const [usingDefault, setUsingDefault] = useState(false);
    const [usingFallback, setUsingFallback] = useState(false);

    // Fetch on config change — use DEFAULT_CONFIG when selectedConfig is null
    useEffect(() => {
        const config = (selectedConfig &&
            selectedConfig.embedding_dim != null &&
            selectedConfig.hidden_size != null &&
            selectedConfig.learning_rate != null)
            ? selectedConfig
            : null;

        const effective = config ?? DEFAULT_CONFIG;
        setUsingDefault(!config);

        let cancelled = false;
        setLoading(true);
        setError(null);
        setData(null);
        setSelectedToken(null);

        fetchMLPEmbeddingQuality(
            effective.embedding_dim,
            effective.hidden_size,
            effective.learning_rate
        )
            .then(res => {
                if (!cancelled) {
                    // If response has no neighbors data, use fallback
                    if (!res?.nearest_neighbors || Object.keys(res.nearest_neighbors).length === 0) {
                        setData({ nearest_neighbors: FALLBACK_NEIGHBORS } as MLPEmbeddingQualityResponse);
                        setUsingFallback(true);
                    } else {
                        setData(res);
                    }
                }
            })
            .catch(() => {
                // Use fallback data on any error
                if (!cancelled) {
                    setData({ nearest_neighbors: FALLBACK_NEIGHBORS } as MLPEmbeddingQualityResponse);
                    setUsingFallback(true);
                }
            })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        selectedConfig?.embedding_dim,
        selectedConfig?.hidden_size,
        selectedConfig?.learning_rate,
    ]);

    // Sync with external highlighted token (from embedding plot)
    useEffect(() => {
        if (highlightedToken && data?.nearest_neighbors?.[highlightedToken]) {
            setSelectedToken(highlightedToken);
        }
    }, [highlightedToken, data]);

    const nn = data?.nearest_neighbors ?? null;
    const tokens = nn ? Object.keys(nn).sort() : [];
    const neighbors = selectedToken && nn ? nn[selectedToken] ?? [] : [];

    if (loading) {
        return (
            <div className="flex items-center gap-2 py-4">
                <Loader2 className="w-3.5 h-3.5 text-violet-400/50 animate-spin" />
                <span className="text-[10px] font-mono text-white/25">{t("models.mlp.nearestNeighbors.loading")}</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/[0.04] border border-rose-500/15">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <p className="text-[10px] text-rose-300/60 font-mono">{error}</p>
            </div>
        );
    }

    if (!nn || tokens.length === 0) {
        if (!loading && !error) {
            return (
                <div className="flex items-center justify-center py-8 text-sm text-white/30 font-mono">
                    {t("models.mlp.nearestNeighbors.noData")}
                </div>
            );
        }
        return null;
    }

    return (
        <div className="space-y-3">
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/25">
                {t("models.mlp.nearestNeighbors.title")}
            </div>

            {usingFallback && (
                <p className="text-[10px] text-amber-300/50 font-mono">
                    Using curated example data (backend unavailable). Results are illustrative.
                </p>
            )}
            {usingDefault && !usingFallback && (
                <p className="text-[10px] text-amber-300/50 font-mono">
                    Showing default model (emb=2, hidden=64, lr=0.01). Select a configuration to explore other models.
                </p>
            )}

            {/* Token selector */}
            <div className="flex flex-wrap gap-1">
                {tokens.map(tok => {
                    const display = tok === " " ? "⎵" : tok === "\n" ? "↵" : tok;
                    const isActive = tok === selectedToken;
                    return (
                        <button
                            key={tok}
                            onClick={() => setSelectedToken(prev => prev === tok ? null : tok)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition-all ${isActive
                                ? "bg-violet-500/20 text-violet-300 border-violet-500/40"
                                : "bg-white/[0.03] text-white/30 border-white/[0.06] hover:text-white/50 hover:border-white/15"
                                }`}
                        >
                            {display}
                        </button>
                    );
                })}
            </div>

            {/* Neighbor list */}
            {selectedToken && neighbors.length > 0 && (
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                    <div className="px-3 py-2 border-b border-white/[0.06]">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-white/25">
                            {t("models.mlp.nearestNeighbors.neighborsOf")} &quot;{selectedToken === " " ? "⎵" : selectedToken === "\n" ? "↵" : selectedToken}&quot;
                        </span>
                    </div>
                    <div className="divide-y divide-white/[0.04]">
                        {neighbors.slice(0, 10).map(({ token, similarity }, i) => {
                            const display = token === " " ? "⎵" : token === "\n" ? "↵" : token;
                            const barW = Math.max(0, similarity * 100);
                            return (
                                <div key={`${token}-${i}`} className="flex items-center gap-3 px-3 py-1.5">
                                    <span className="text-xs font-mono text-white/60 w-6 text-center">{display}</span>
                                    <div className="flex-1 h-3 rounded bg-white/[0.04] overflow-hidden">
                                        <div
                                            className="h-full rounded bg-violet-400/40 transition-all duration-200"
                                            style={{ width: `${barW.toFixed(0)}%` }}
                                        />
                                    </div>
                                    <span className="text-[9px] font-mono text-white/30 w-10 text-right">
                                        {similarity.toFixed(3)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {selectedToken && neighbors.length === 0 && (
                <p className="text-[10px] text-white/20 font-mono italic">{t("models.mlp.nearestNeighbors.noData")}</p>
            )}

            {!selectedToken && (
                <p className="text-[10px] text-white/20 font-mono italic">
                    {t("models.mlp.nearestNeighbors.selectPrompt")}
                </p>
            )}
        </div>
    );
}
