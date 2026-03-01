import { useEffect,useState } from "react";

import { Database,Search, X } from "lucide-react";

import { bigramDatasetLookup, datasetLookup } from "@/lib/lmLabClient";
import type { DatasetLookupResponse } from "@/types/lmLab";

interface DatasetExplorerModalProps {
    isOpen: boolean;
    onClose: () => void;
    contextChar: string;
    nextChar: string;
    /** Which model type triggered the lookup. Defaults to "bigram". */
    modelType?: "bigram" | "ngram";
    /** For N-Gram: additional context tokens from the active slice. */
    contextTokens?: string[];
}

export function DatasetExplorerModal({
    isOpen,
    onClose,
    contextChar,
    nextChar,
    modelType = "bigram",
    contextTokens,
}: DatasetExplorerModalProps) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<DatasetLookupResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Effect to trigger fetch
    useEffect(() => {
        const fetchData = async () => {
            if (!isOpen) return;
            setLoading(true);
            setError(null);
            try {
                let res: DatasetLookupResponse;
                if (modelType === "ngram") {
                    // For N-Gram: build full context from contextTokens + row label
                    const fullContext = [...(contextTokens ?? []), contextChar];
                    res = await datasetLookup(fullContext, nextChar);
                } else {
                    // For Bigram: single-character context
                    res = await bigramDatasetLookup([contextChar], nextChar);
                }
                setData(res);
            } catch (err) {
                setError((err as Error).message || "Failed to fetch dataset examples");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, contextChar, nextChar, modelType, contextTokens ? contextTokens.join(",") : ""]);

    if (!isOpen) return null;

    // Build display context string
    const displayContext = modelType === "ngram" && contextTokens?.length
        ? `${contextTokens.join("")}${contextChar}`
        : contextChar;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <Database className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Corpus Evidence</h3>
                            <p className="text-sm text-white/50">
                                Why did the model learn &apos;{displayContext}&apos; → &apos;{nextChar}&apos;?
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-white/50" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading && (
                        <div className="flex items-center justify-center py-12 text-white/50 animate-pulse">
                            <Search className="w-5 h-5 mr-2" />
                            Scanning training corpus...
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    {data && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                                    <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Occurrences Found</div>
                                    <div className="text-2xl font-mono text-emerald-400">{data.count}</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                                    <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Source</div>
                                    <div className="text-lg text-white/80">{data.source}</div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    Context Snippets
                                </h4>
                                <div className="space-y-3">
                                    {data.examples.map((snippet, idx) => (
                                        <SnippetDisplay key={idx} snippet={snippet} />
                                    ))}
                                    {data.examples.length === 0 && (
                                        <div className="text-white/30 italic text-sm">No examples found for this transition.</div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function SnippetDisplay({ snippet }: { snippet: string }) {
    // Snippet format is "pre[[match]]post"
    const parts = snippet.split('[[');
    if (parts.length !== 2) return <div className="font-mono text-xs text-white/60 bg-black/20 p-3 rounded">{snippet}</div>;

    const pre = parts[0];
    const matchParts = parts[1].split(']]');
    const match = matchParts[0];
    const post = matchParts[1] || "";

    return (
        <div className="font-mono text-xs text-white/70 bg-black/20 p-3 rounded border border-white/5">
            <span className="opacity-50">{pre}</span>
            <span className="bg-indigo-500/30 text-indigo-200 font-bold px-1 rounded mx-0.5">{match}</span>
            <span className="opacity-50">{post}</span>
        </div>
    );
}
