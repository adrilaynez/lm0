"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { motion } from "framer-motion";
import { Activity, Brain, ChevronRight, Loader2,Sparkles } from "lucide-react";

import { getModels, type Model } from "@/lib/lmLabClient";

export default function ModelSelector() {
    const [models, setModels] = useState<Model[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchModels() {
            try {
                const data = await getModels();
                setModels(data);
            } catch (err) {
                console.error("Error fetching models", err);
            } finally {
                setLoading(false);
            }
        }
        fetchModels();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-[#FF6C6C] animate-spin" />
                <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Sincronizando modelos...</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
            {models.map((model, idx) => (
                <ModelCard key={model.id} model={model} index={idx} />
            ))}
        </div>
    );
}

function ModelCard({ model, index }: { model: Model; index: number }) {
    const Icon = model.type === "bigram" ? Brain : model.type === "ngram" ? Activity : Sparkles;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <Link href={model.type === 'mlp' ? '#' : `/lab/visualizer?model=${model.type}`} className="group block h-full">
                <div className="relative h-full bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 overflow-hidden transition-all duration-300 group-hover:border-[#FF6C6C]/50 group-hover:shadow-[0_0_40px_-15px_rgba(255,108,108,0.3)]">
                    {/* Accent Glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#FF6C6C]/10 blur-[60px] rounded-full group-hover:bg-[#FF6C6C]/20 transition-all" />

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-[#FF6C6C] group-hover:scale-110 transition-transform duration-500">
                                <Icon className="w-7 h-7" />
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${model.status === 'ready' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                {model.status}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#FF6C6C] transition-colors">
                            {model.name}
                        </h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-8 flex-grow">
                            {model.description}
                        </p>

                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FF6C6C] group-hover:gap-4 transition-all">
                            <span>EXPLORAR MÓDULO</span>
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
