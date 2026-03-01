"use client";

import { useCallback, useState } from "react";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import { predictMLP } from "@/lib/lmLabClient";
import type { MLPGridConfig } from "@/types/lmLab";

/*
  ContextVsNoContextDemo
  Side-by-side: predict next letter with context=1 vs context=3 using real MLP backend.
  User types text, sees how context improves predictions dramatically.
  Falls back to illustrative mode if no config is available.
*/

interface Prediction {
    token: string;
    probability: number;
}

interface PredictionColumnProps {
    label: string;
    contextStr: string;
    predictions: Prediction[];
    loading: boolean;
    color: string;
    actual?: string;
}

function PredictionColumn({ label, contextStr, predictions, loading, color, actual }: PredictionColumnProps) {
    return (
        <div className="flex-1 min-w-[160px] rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
            <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color }}>
                {label}
            </p>
            <p className="text-xs font-mono text-white/40 mb-3 truncate">
                sees: <span className="text-white/60">&quot;{contextStr}&quot;</span>
            </p>

            {loading ? (
                <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-4 h-4 animate-spin text-white/20" />
                </div>
            ) : predictions.length === 0 ? (
                <p className="text-[10px] text-white/20 italic py-4 text-center">Type at least 1 character</p>
            ) : (
                <div className="space-y-1">
                    {predictions.slice(0, 5).map((p, i) => {
                        const isCorrect = actual && p.token === actual;
                        return (
                            <div key={`${p.token}-${i}`} className="flex items-center gap-2">
                                <span
                                    className="w-5 h-5 rounded text-[11px] font-mono font-bold flex items-center justify-center shrink-0"
                                    style={{
                                        backgroundColor: isCorrect ? color + "30" : "rgba(255,255,255,0.04)",
                                        color: isCorrect ? color : "rgba(255,255,255,0.5)",
                                        borderWidth: isCorrect ? 1 : 0,
                                        borderColor: isCorrect ? color + "60" : "transparent",
                                    }}
                                >
                                    {p.token === " " ? "␣" : p.token}
                                </span>
                                <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: color + (isCorrect ? "" : "60") }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(p.probability * 100).toFixed(0)}%` }}
                                        transition={{ duration: 0.3, delay: i * 0.05 }}
                                    />
                                </div>
                                <span className="text-[9px] font-mono text-white/30 w-8 text-right tabular-nums">
                                    {(p.probability * 100).toFixed(0)}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

interface ContextVsNoContextDemoProps {
    config1?: MLPGridConfig | null; // context=1 config (or smallest)
    config3?: MLPGridConfig | null; // context=3 config (or largest)
}

export function ContextVsNoContextDemo({ config1, config3 }: ContextVsNoContextDemoProps) {
    const [text, setText] = useState("the ");
    const [preds1, setPreds1] = useState<Prediction[]>([]);
    const [preds3, setPreds3] = useState<Prediction[]>([]);
    const [loading1, setLoading1] = useState(false);
    const [loading3, setLoading3] = useState(false);

    const fetchPredictions = useCallback(async (inputText: string) => {
        if (inputText.length < 1) {
            setPreds1([]);
            setPreds3([]);
            return;
        }

        // Context=1: only last character
        if (config1) {
            setLoading1(true);
            try {
                const res = await predictMLP(
                    config1.embedding_dim,
                    config1.hidden_size,
                    config1.learning_rate,
                    inputText.slice(-1),
                    5
                );
                setPreds1(res.predictions || []);
            } catch { setPreds1([]); }
            finally { setLoading1(false); }
        }

        // Context=3: last 3 characters
        if (config3) {
            setLoading3(true);
            try {
                const res = await predictMLP(
                    config3.embedding_dim,
                    config3.hidden_size,
                    config3.learning_rate,
                    inputText.slice(-3),
                    5
                );
                setPreds3(res.predictions || []);
            } catch { setPreds3([]); }
            finally { setLoading3(false); }
        }
    }, [config1, config3]);

    const handleChange = (value: string) => {
        setText(value);
        fetchPredictions(value);
    };

    const ctx1Str = text.slice(-1);
    const ctx3Str = text.slice(-3);

    const hasBackend = config1 || config3;

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Text input */}
            <div>
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1.5">
                    Type some text to predict the next character
                </label>
                <input
                    type="text"
                    value={text}
                    onChange={e => handleChange(e.target.value.toLowerCase())}
                    placeholder="type here..."
                    className="w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-sm font-mono text-white/80 placeholder:text-white/20 focus:outline-none focus:border-violet-500/40"
                />
            </div>

            {/* Side-by-side predictions */}
            <div className="flex gap-3 flex-wrap">
                <PredictionColumn
                    label="Context = 1"
                    contextStr={ctx1Str}
                    predictions={hasBackend ? preds1 : MOCK_PREDS_1}
                    loading={loading1}
                    color="#f59e0b"
                />
                <PredictionColumn
                    label="Context = 3"
                    contextStr={ctx3Str}
                    predictions={hasBackend ? preds3 : MOCK_PREDS_3}
                    loading={loading3}
                    color="#34d399"
                />
            </div>

            {!hasBackend && (
                <p className="text-[10px] text-white/20 italic text-center">
                    Illustrative predictions — connect to the backend to see real MLP comparisons.
                </p>
            )}
        </div>
    );
}

// Fallback mock data when backend isn't available
const MOCK_PREDS_1: Prediction[] = [
    { token: "e", probability: 0.18 },
    { token: "a", probability: 0.14 },
    { token: "o", probability: 0.12 },
    { token: "i", probability: 0.09 },
    { token: "n", probability: 0.07 },
];

const MOCK_PREDS_3: Prediction[] = [
    { token: "c", probability: 0.32 },
    { token: "n", probability: 0.18 },
    { token: "r", probability: 0.11 },
    { token: "m", probability: 0.08 },
    { token: "s", probability: 0.06 },
];
