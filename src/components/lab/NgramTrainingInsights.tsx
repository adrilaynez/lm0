"use client";

import { motion } from "framer-motion";
import { Activity, BarChart3, Database, Hash, Layers } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { NGramTrainingInfo } from "@/types/lmLab";

interface NgramTrainingInsightsProps {
    data: NGramTrainingInfo | null | undefined;
    contextSize?: number;
}

export function NgramTrainingInsights({ data, contextSize }: NgramTrainingInsightsProps) {
    if (!data) return null;

    const utilizationPct = data.context_utilization != null
        ? (data.context_utilization * 100).toFixed(2)
        : "N/A";
    const sparsityPct = data.sparsity != null
        ? (data.sparsity * 100).toFixed(2)
        : "N/A";

    const stats = [
        {
            label: "Total Tokens",
            value: data.total_tokens?.toLocaleString() ?? "N/A",
            icon: Database,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
        },
        {
            label: "Unique Contexts",
            value: data.unique_contexts?.toLocaleString() ?? "N/A",
            icon: Hash,
            color: "text-indigo-400",
            bg: "bg-indigo-500/10",
            border: "border-indigo-500/20",
            sub: `of ${data.context_space_size?.toLocaleString() ?? "?"} possible`,
        },
        {
            label: "Context Utilization",
            value: `${utilizationPct}%`,
            icon: BarChart3,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            sub: "Fraction of contexts observed",
        },
        {
            label: "Sparsity",
            value: `${sparsityPct}%`,
            icon: Activity,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
            sub: "Unseen context fraction",
        },
    ];

    return (
        <Card className="bg-black/40 border-white/[0.06] backdrop-blur-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <Layers className="h-4 w-4 text-indigo-400" />
                <span className="font-mono text-xs uppercase tracking-widest text-white/60">
                    Training Insights
                </span>
                {contextSize != null && (
                    <Badge className="ml-auto bg-indigo-500/10 text-indigo-300 border-indigo-500/20 text-[10px] font-mono">
                        N = {contextSize}
                    </Badge>
                )}
            </div>

            {/* Stats Grid */}
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.08 }}
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

            {/* Transition Density Bar */}
            {data.transition_density != null && (
                <div className="px-5 pb-5">
                    <div className="flex justify-between text-[10px] font-mono text-white/40 mb-1">
                        <span>Transition Density</span>
                        <span>{(data.transition_density * 100).toFixed(2)}%</span>
                    </div>
                    <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(data.transition_density * 100, 100)}%` }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full bg-gradient-to-r from-indigo-600/60 to-indigo-400/40 rounded-full"
                        />
                    </div>
                </div>
            )}
        </Card>
    );
}
