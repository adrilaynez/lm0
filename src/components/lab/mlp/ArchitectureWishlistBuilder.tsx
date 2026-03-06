"use client";

import { useState, useMemo } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Sparkles, Lock, Unlock } from "lucide-react";

/*
  ArchitectureWishlistBuilder v2
  Gamified discovery: build your dream language model by selecting properties.
  Two-phase flow: (1) check wishes, (2) reveal which ones the MLP already has.
  Progress ring, richer cards with icons, dramatic transformer reveal.
*/

interface WishItem {
    id: string;
    label: string;
    description: string;
    mlpHas: boolean;
    icon: string;
}

const WISHES: WishItem[] = [
    { id: "embeddings", label: "Learned embeddings", description: "Characters/tokens represented as dense vectors that capture meaning", mlpHas: true, icon: "🔤" },
    { id: "nonlinear", label: "Non-linear features", description: "Compose simple patterns into complex ones via activation functions", mlpHas: true, icon: "🧠" },
    { id: "gradient", label: "End-to-end training", description: "Learn all parameters jointly via backpropagation", mlpHas: true, icon: "🔄" },
    { id: "varlen", label: "Variable-length input", description: "Process any length of text, not just a fixed window of N characters", mlpHas: false, icon: "📏" },
    { id: "longrange", label: "Long-range dependencies", description: "Connect a pronoun to a noun hundreds of tokens back", mlpHas: false, icon: "🔗" },
    { id: "posshare", label: "Position-invariant meaning", description: "'the' means the same thing regardless of where it appears", mlpHas: false, icon: "📍" },
    { id: "attention", label: "Selective attention", description: "Focus on the most relevant context, not all of it equally", mlpHas: false, icon: "🎯" },
    { id: "parallel", label: "Parallel processing", description: "Process all positions simultaneously, not one after another", mlpHas: false, icon: "⚡" },
];

const THRESHOLD = 5;

export function ArchitectureWishlistBuilder() {
    const [checked, setChecked] = useState<Set<string>>(new Set());
    const [revealed, setRevealed] = useState(false);

    const toggle = (id: string) => {
        if (revealed) return;
        setChecked(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const checkedCount = checked.size;
    const canReveal = checkedCount >= THRESHOLD && !revealed;
    const pct = Math.round((checkedCount / WISHES.length) * 100);

    const { hasItems, missingItems } = useMemo(() => ({
        hasItems: WISHES.filter(w => w.mlpHas),
        missingItems: WISHES.filter(w => !w.mlpHas),
    }), []);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="text-center space-y-2">
                <p className="text-[10px] text-white/25 font-mono uppercase tracking-wider">
                    Design your ideal language model
                </p>
                <p className="text-[9px] text-white/15 font-mono">
                    Check every property you&apos;d want. Then we&apos;ll see what already exists.
                </p>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400"
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
                <span className="text-[9px] font-mono text-white/30 w-14 text-right flex-shrink-0">
                    {checkedCount}/{WISHES.length}
                </span>
            </div>

            {/* Wish cards */}
            <div className="grid gap-1.5">
                {WISHES.map((w, i) => {
                    const isChecked = checked.has(w.id);
                    const showStatus = revealed;
                    return (
                        <motion.button
                            key={w.id}
                            onClick={() => toggle(w.id)}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            disabled={revealed}
                            className={`flex items-center gap-3 text-left px-3 py-2.5 rounded-xl border transition-all ${revealed
                                    ? w.mlpHas
                                        ? "bg-emerald-500/[0.04] border-emerald-500/20"
                                        : "bg-rose-500/[0.04] border-rose-500/20"
                                    : isChecked
                                        ? "bg-violet-500/[0.06] border-violet-500/25"
                                        : "bg-white/[0.015] border-white/[0.06] hover:bg-white/[0.03] hover:border-white/[0.1]"
                                }`}
                        >
                            {/* Checkbox / status */}
                            <div className={`w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-all ${revealed
                                    ? w.mlpHas ? "bg-emerald-500/20 border-emerald-500/40" : "bg-rose-500/20 border-rose-500/40"
                                    : isChecked ? "bg-violet-500/25 border-violet-500/40" : "border-white/10"
                                }`}>
                                {revealed ? (
                                    w.mlpHas
                                        ? <Unlock className="w-3 h-3 text-emerald-400" />
                                        : <Lock className="w-3 h-3 text-rose-400" />
                                ) : (
                                    isChecked && <CheckCircle2 className="w-3 h-3 text-violet-400" />
                                )}
                            </div>

                            {/* Icon */}
                            <span className="text-sm flex-shrink-0">{w.icon}</span>

                            {/* Label + description */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-[11px] font-mono font-bold leading-tight ${revealed
                                        ? w.mlpHas ? "text-emerald-400" : "text-rose-400"
                                        : isChecked ? "text-violet-400" : "text-white/35"
                                    }`}>{w.label}</p>
                                <p className="text-[9px] text-white/20 leading-tight">{w.description}</p>
                            </div>

                            {/* Status badge */}
                            {showStatus && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`text-[7px] font-mono font-bold flex-shrink-0 px-2 py-0.5 rounded-full ${w.mlpHas
                                            ? "bg-emerald-500/15 text-emerald-400"
                                            : "bg-rose-500/15 text-rose-400"
                                        }`}
                                >
                                    {w.mlpHas ? "MLP has this" : "MLP can't"}
                                </motion.span>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Reveal button */}
            <AnimatePresence>
                {canReveal && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex justify-center"
                    >
                        <button
                            onClick={() => setRevealed(true)}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 text-xs font-mono font-bold text-violet-300 hover:from-violet-500/30 hover:to-purple-500/30 transition-all flex items-center gap-2"
                        >
                            <Sparkles className="w-3.5 h-3.5" /> What architecture has all of this?
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Transformer reveal */}
            <AnimatePresence>
                {revealed && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/[0.08] via-purple-500/[0.04] to-transparent p-5 sm:p-6 text-center space-y-4"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        >
                            <Sparkles className="w-8 h-8 mx-auto text-violet-400" />
                        </motion.div>

                        <div>
                            <p className="text-base sm:text-lg font-bold bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent">
                                You just described a Transformer.
                            </p>
                            <p className="text-[11px] text-white/35 max-w-md mx-auto mt-2 leading-relaxed">
                                Every property the MLP is missing — variable-length input, long-range connections, position invariance, selective attention —
                                is exactly what the <span className="text-violet-400 font-bold">Transformer architecture</span> was designed to solve.
                            </p>
                        </div>

                        {/* Score breakdown */}
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            <div className="rounded-xl bg-emerald-500/[0.04] border border-emerald-500/15 p-3">
                                <p className="text-emerald-400 font-bold text-[10px] font-mono mb-1.5">MLP already has ({hasItems.length})</p>
                                <div className="space-y-1">
                                    {hasItems.map(w => (
                                        <div key={w.id} className="flex items-center gap-1.5">
                                            <span className="text-xs">{w.icon}</span>
                                            <span className="text-[8px] text-white/30 font-mono">{w.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="rounded-xl bg-rose-500/[0.04] border border-rose-500/15 p-3">
                                <p className="text-rose-400 font-bold text-[10px] font-mono mb-1.5">MLP is missing ({missingItems.length})</p>
                                <div className="space-y-1">
                                    {missingItems.map(w => (
                                        <div key={w.id} className="flex items-center gap-1.5">
                                            <span className="text-xs">{w.icon}</span>
                                            <span className="text-[8px] text-white/30 font-mono">{w.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <p className="text-[9px] text-white/20 font-mono mt-2">
                            The MLP gave us the <span className="text-emerald-400/60">foundation</span>. The Transformer adds the <span className="text-violet-400/60">missing pieces</span>.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
