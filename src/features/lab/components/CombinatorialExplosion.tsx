"use client";

import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp } from "lucide-react";

export function CombinatorialExplosion() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl overflow-hidden border border-red-500/30 bg-gradient-to-br from-red-950/20 to-black relative"
        >
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 pointer-events-none" />

            <div className="p-8 md:p-12 text-center relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 mb-6 ring-1 ring-red-500/30">
                    <TrendingUp className="w-8 h-8" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-4">
                    Context Too Large — Combinatorial Explosion
                </h3>

                <p className="text-white/60 max-w-2xl mx-auto leading-relaxed mb-8">
                    As valid N increases, the number of possible contexts grows exponentially (<span className="text-white font-mono">|V|^N</span>).
                    For this vocabulary size, calculating the full transition matrix becomes computationally impractical
                    and requires an enormous dataset to avoid sparsity.
                </p>

                <div className="inline-block px-6 py-4 rounded-lg bg-black/40 border border-white/10 font-mono text-lg text-red-300">
                    |V|^N = Space Complexity
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-xs text-red-400/60 uppercase tracking-widest font-mono">
                    <AlertTriangle className="w-3 h-3" />
                    Classical Limit Reached
                </div>
            </div>
        </motion.div>
    );
}
