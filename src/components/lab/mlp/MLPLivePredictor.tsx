"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Type } from "lucide-react";

import { predictMLP } from "@/lib/lmLabClient";
import type { Prediction } from "@/types/lmLab";

/*
  MLPLivePredictor
  Type text and see real-time next-character predictions from the MLP backend.
  Uses a default high-quality config. Debounces input.
*/

const DEFAULT_CONFIG = { embedding_dim: 10, hidden_size: 64, learning_rate: 0.01 };
const DEBOUNCE_MS = 300;

export function MLPLivePredictor() {
    const [text, setText] = useState("the ");
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchPredictions = useCallback((input: string) => {
        if (!input || input.length === 0) {
            setPredictions([]);
            return;
        }
        setLoading(true);
        setError(null);
        predictMLP(
            DEFAULT_CONFIG.embedding_dim,
            DEFAULT_CONFIG.hidden_size,
            DEFAULT_CONFIG.learning_rate,
            input,
            10
        )
            .then(res => {
                setPredictions(res.predictions);
                setLoading(false);
            })
            .catch(err => {
                setError((err as Error).message);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => fetchPredictions(text), DEBOUNCE_MS);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [text, fetchPredictions]);

    const handleAppend = useCallback((char: string) => {
        setText(prev => prev + char);
    }, []);

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Text input */}
            <div className="relative">
                <Type className="absolute left-3 top-3 w-4 h-4 text-white/20" />
                <input
                    type="text"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Type text here..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-sm font-mono text-white/80 placeholder:text-white/20 focus:outline-none focus:border-violet-500/40 transition-colors"
                />
                {loading && <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-violet-400/50" />}
            </div>

            {/* Context display */}
            <div className="flex items-center gap-1 text-[10px] font-mono text-white/30">
                <span>Context used (last 3 chars):</span>
                <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 font-bold">
                    &quot;{text.slice(-3)}&quot;
                </span>
            </div>

            {/* Predictions */}
            {error && (
                <p className="text-[10px] text-rose-400/60 text-center">Backend unavailable: {error}</p>
            )}

            <AnimatePresence mode="wait">
                {predictions.length > 0 && (
                    <motion.div
                        key={text}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-1.5"
                    >
                        <p className="text-[9px] font-mono uppercase tracking-widest text-white/25">Next character predictions</p>
                        {predictions.slice(0, 8).map((pred, i) => (
                            <div key={pred.token} className="flex items-center gap-2">
                                <button
                                    onClick={() => handleAppend(pred.token)}
                                    className={`w-7 h-7 rounded flex items-center justify-center text-xs font-mono font-bold transition-all ${
                                        i === 0
                                            ? "bg-violet-500/20 text-violet-400 border border-violet-500/30 hover:bg-violet-500/30"
                                            : "bg-white/[0.03] text-white/40 border border-white/[0.06] hover:bg-white/[0.06]"
                                    }`}
                                    title={`Append '${pred.token}'`}
                                >
                                    {pred.token === " " ? "·" : pred.token}
                                </button>
                                <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                                    <motion.div
                                        className={`h-full rounded-full ${i === 0 ? "bg-violet-500/50" : "bg-white/10"}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pred.probability * 100}%` }}
                                        transition={{ duration: 0.3, delay: i * 0.03 }}
                                    />
                                </div>
                                <span className="text-[9px] font-mono text-white/30 w-12 text-right">
                                    {(pred.probability * 100).toFixed(1)}%
                                </span>
                            </div>
                        ))}
                        <p className="text-[9px] text-white/15 text-center mt-2">Click a character to append it to the text</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
