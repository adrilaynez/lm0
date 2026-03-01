"use client";

import { useEffect,useState } from "react";

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

    // Fetch on config change — send embedding_dim/hidden_size/learning_rate (what backend requires)
    useEffect(() => {
        if (
            !selectedConfig ||
            selectedConfig.embedding_dim == null ||
            selectedConfig.hidden_size == null ||
            selectedConfig.learning_rate == null
        ) return;

        let cancelled = false;
        setLoading(true);
        setError(null);
        setData(null);
        setSelectedToken(null);

        fetchMLPEmbeddingQuality(
            selectedConfig.embedding_dim,
            selectedConfig.hidden_size,
            selectedConfig.learning_rate
        )
            .then(res => { if (!cancelled) setData(res); })
            .catch(err => { if (!cancelled) setError((err as Error).message); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
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

    if (!nn || tokens.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/25">
                {t("models.mlp.nearestNeighbors.title")}
            </div>

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
