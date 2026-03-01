"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";

/*
  ArchitectureWishlistBuilder
  Gamified: user checks desired properties for an ideal language model.
  Once enough are checked, reveal: "You just described a Transformer!"
*/

interface WishItem {
    id: string;
    label: string;
    description: string;
    mlpHas: boolean;
}

const WISHES: WishItem[] = [
    { id: "varlen", label: "Variable-length input", description: "Process any length of text, not just a fixed window", mlpHas: false },
    { id: "longrange", label: "Long-range dependencies", description: "Connect a pronoun to a noun 50 tokens back", mlpHas: false },
    { id: "posshare", label: "Position-invariant meaning", description: "'the' means the same thing regardless of position", mlpHas: false },
    { id: "attention", label: "Selective attention", description: "Focus on the most relevant context, not all of it equally", mlpHas: false },
    { id: "parallel", label: "Parallel processing", description: "Process all positions simultaneously (not sequentially)", mlpHas: false },
    { id: "embeddings", label: "Learned embeddings", description: "Characters/tokens represented as dense vectors", mlpHas: true },
    { id: "nonlinear", label: "Non-linear features", description: "Compose simple patterns into complex ones via layers", mlpHas: true },
    { id: "gradient", label: "End-to-end training", description: "Learn all parameters jointly via backpropagation", mlpHas: true },
];

const THRESHOLD = 5;

export function ArchitectureWishlistBuilder() {
    const [checked, setChecked] = useState<Set<string>>(new Set());
    const [revealed, setRevealed] = useState(false);

    const toggle = (id: string) => {
        setChecked(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const checkedCount = checked.size;
    const mlpMissing = WISHES.filter(w => !w.mlpHas && checked.has(w.id));
    const mlpHas = WISHES.filter(w => w.mlpHas && checked.has(w.id));
    const canReveal = checkedCount >= THRESHOLD && !revealed;

    return (
        <div className="p-5 sm:p-6 space-y-4">
            <p className="text-[10px] text-white/25 font-mono text-center uppercase tracking-wider">
                Check every property you want in your ideal language model
            </p>

            <div className="grid gap-2">
                {WISHES.map(w => {
                    const isChecked = checked.has(w.id);
                    return (
                        <button
                            key={w.id}
                            onClick={() => toggle(w.id)}
                            className={`flex items-start gap-3 text-left p-3 rounded-lg border transition-all ${
                                isChecked
                                    ? "bg-violet-500/5 border-violet-500/20"
                                    : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                            }`}
                        >
                            <div className={`w-4 h-4 mt-0.5 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                                isChecked ? "bg-violet-500/20 border-violet-500/40" : "border-white/10"
                            }`}>
                                {isChecked && <CheckCircle2 className="w-3 h-3 text-violet-400" />}
                            </div>
                            <div>
                                <p className={`text-xs font-mono font-bold ${isChecked ? "text-violet-400" : "text-white/30"}`}>{w.label}</p>
                                <p className="text-[10px] text-white/20">{w.description}</p>
                            </div>
                            {revealed && (
                                <span className={`ml-auto text-[8px] font-mono flex-shrink-0 px-2 py-0.5 rounded-full ${
                                    w.mlpHas
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : "bg-rose-500/10 text-rose-400"
                                }`}>
                                    {w.mlpHas ? "MLP ✓" : "MLP ✗"}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Progress + reveal */}
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-white/20">{checkedCount}/{WISHES.length} selected</span>
                {canReveal && (
                    <button
                        onClick={() => setRevealed(true)}
                        className="px-4 py-2 rounded-lg bg-violet-500/15 border border-violet-500/30 text-xs font-mono font-bold text-violet-400 hover:bg-violet-500/25 flex items-center gap-1.5"
                    >
                        <Sparkles className="w-3 h-3" /> Reveal Architecture
                    </button>
                )}
            </div>

            <AnimatePresence>
                {revealed && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent p-5 text-center space-y-3"
                    >
                        <Sparkles className="w-6 h-6 mx-auto text-violet-400" />
                        <p className="text-sm font-bold text-violet-300">You just described a Transformer!</p>
                        <p className="text-[11px] text-white/40 max-w-sm mx-auto">
                            The properties the MLP lacks — variable-length input, long-range dependencies, position-invariant meaning, and selective attention —
                            are exactly what the <span className="text-violet-400 font-bold">Transformer architecture</span> was designed to provide.
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-3 text-[9px] font-mono">
                            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/15 p-2">
                                <p className="text-emerald-400 font-bold">MLP already has</p>
                                <p className="text-white/25">{mlpHas.map(w => w.label).join(", ") || "—"}</p>
                            </div>
                            <div className="rounded-lg bg-rose-500/5 border border-rose-500/15 p-2">
                                <p className="text-rose-400 font-bold">MLP is missing</p>
                                <p className="text-white/25">{mlpMissing.map(w => w.label).join(", ") || "—"}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
