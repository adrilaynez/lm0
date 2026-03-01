"use client";

import { motion } from "framer-motion";
import { Activity, Database, Hash, Layers } from "lucide-react";

import type { NGramDiagnostics } from "@/types/lmLab";

interface NgramDiagnosticsProps {
    data: NGramDiagnostics | undefined;
}

export function NgramDiagnostics({ data }: NgramDiagnosticsProps) {
    if (!data) return null;

    const stats = [
        {
            label: "Vocabulary",
            value: data.vocab_size,
            icon: Database,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20"
        },
        {
            label: "Context Size (N)",
            value: data.context_size,
            icon: Layers,
            color: "text-indigo-400",
            bg: "bg-indigo-500/10",
            border: "border-indigo-500/20"
        },
        {
            label: "Context Space (|V|^N)",
            value: data.estimated_context_space.toLocaleString(),
            icon: Hash,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20",
            sub: data.observed_contexts
                ? `${data.observed_contexts.toLocaleString()} observed`
                : "Possible Contexts"
        },
        {
            label: "Sparsity",
            value: data.sparsity != null ? `${(data.sparsity * 100).toFixed(2)}%` : "N/A",
            icon: Activity,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            sub: data.context_utilization != null
                ? `${(data.context_utilization * 100).toFixed(2)}% utilized`
                : undefined
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-4 rounded-lg border ${stat.border} ${stat.bg} relative overflow-hidden`}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                        <span className={`text-[10px] uppercase tracking-widest font-bold ${stat.color}`}>
                            {stat.label}
                        </span>
                    </div>
                    <div className="text-xl md:text-2xl font-mono text-white font-medium truncate">
                        {stat.value}
                    </div>
                    {stat.sub && (
                        <div className="text-[10px] text-white/40 mt-1">
                            {stat.sub}
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
}
