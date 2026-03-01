"use client";

import {motion } from "framer-motion";
import { Database, FileText, Search, X } from "lucide-react";

import type { DatasetLookupResponse } from "@/types/lmLab";

interface DatasetExplorerProps {
    data: DatasetLookupResponse | null;
    loading: boolean;
    error: string | null;
    onClose: () => void;
}

export function DatasetExplorer({ data, loading, error, onClose }: DatasetExplorerProps) {
    if (!data && !loading && !error) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed inset-y-0 right-0 w-full md:w-96 bg-[#0a0a0f]/95 border-l border-white/10 backdrop-blur-xl z-50 shadow-2xl overflow-y-auto"
        >
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-emerald-400">
                        <Database className="w-5 h-5" />
                        <h2 className="font-bold text-sm uppercase tracking-widest">
                            Corpus Explorer
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-white/50" />
                    </button>
                </div>

                {loading && (
                    <div className="flex flex-col items-center justify-center py-12 text-white/30 space-y-4">
                        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                        <p className="text-xs font-mono uppercase tracking-widest">Searching Dataset...</p>
                    </div>
                )}

                {error && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {data && (
                    <div className="space-y-6">
                        <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                            <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">
                                Query Sequence
                            </div>
                            <div className="font-mono text-lg text-white">
                                "{data.query}"
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-xs text-white/50">
                                <Search className="w-3 h-3" />
                                Found <span className="text-white font-bold">{data.count.toLocaleString()}</span> occurrences
                            </div>
                        </div>

                        <div>
                            <h3 className="flex items-center gap-2 text-xs font-bold text-white/60 uppercase tracking-widest mb-4">
                                <FileText className="w-3 h-3" />
                                Example Contexts
                            </h3>
                            <div className="space-y-3">
                                {data.examples.map((example, i) => (
                                    <div
                                        key={i}
                                        className="p-3 rounded bg-black/40 border border-white/[0.04] font-mono text-sm text-white/70 break-all leading-relaxed"
                                    >
                                        ...{example}...
                                    </div>
                                ))}
                                {data.examples.length === 0 && (
                                    <div className="text-white/30 text-xs italic">
                                        No examples found in the validation snippet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
