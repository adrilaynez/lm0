"use client";

import {useState } from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { AnimatePresence,motion } from "framer-motion";
import { ArrowRight, Brain, ChevronLeft, Cpu, Info, LayoutGrid, Play, Terminal, Type } from "lucide-react";

import { generate,visualize } from "@/lib/lmLabClient";

function VisualizerContent() {
    const searchParams = useSearchParams();
    const modelType = searchParams.get("model") || "bigram";

    const [inputText, setInputText] = useState("Bigram models analyze pairs of characters.");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedText, setGeneratedText] = useState("");
    const [heatmap, setHeatmap] = useState<any>(null);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const data = await visualize(modelType, inputText);
            setHeatmap(data);
        } catch (err) {
            console.error(err);
            // Mock data if failed
            setHeatmap({
                token_pairs: Array.from({ length: 64 }).map(() => Math.random())
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setGeneratedText("");
        try {
            // Intentamos llamar al endpoint real
            const response = await generate(modelType, inputText, 100);
            const fullText = response.text || "Output simulado: El modelo está proyectando tokens activamente a través de su matriz de probabilidad.";

            // Typewriter Effect para lucirse
            for (let i = 0; i <= fullText.length; i++) {
                setGeneratedText(fullText.slice(0, i));
                await new Promise(r => setTimeout(r, 20));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0E1117] text-slate-100 flex flex-col">
            {/* Visualizer Header */}
            <nav className="border-b border-slate-800 bg-[#0E1117]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/lab" className="p-2 -ml-2 rounded-lg hover:bg-slate-800 text-slate-400 border border-transparent hover:border-slate-700 transition-all">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#FF6C6C]/20 border border-[#FF6C6C]/40 flex items-center justify-center">
                                <Cpu className="w-4 h-4 text-[#FF6C6C]" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-widest">{modelType.toUpperCase()} EXPLORER</h1>
                                <p className="text-[10px] text-slate-500 font-mono">LAB_UNIT // 02 // VISUALIZER</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-500 gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            SYSTEM STATUS: ACTIVE
                        </div>
                        <button className="px-4 py-1.5 bg-[#FF6C6C] text-slate-950 font-bold rounded-md text-[10px] uppercase tracking-widest hover:bg-[#ff8585] transition-colors">
                            Export Session
                        </button>
                    </div>
                </div>
            </nav>

            <div className="flex-grow container mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* Left Column: Input & Controls */}
                <div className="lg:col-span-4 space-y-8">
                    <section className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <Type className="w-4 h-4 text-[#FF6C6C]" />
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Sequence Input</h2>
                        </div>

                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            className="w-full h-48 bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-sm font-serif italic text-slate-300 placeholder:text-slate-700 focus:border-[#FF6C6C]/50 focus:ring-1 focus:ring-[#FF6C6C]/10 outline-none transition-all resize-none"
                            placeholder="Introduzca el texto semilla para analizar..."
                        />

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 transition-all text-xs font-bold uppercase tracking-wider"
                            >
                                {isAnalyzing ? "Analyzing..." : <> <LayoutGrid className="w-4 h-4" /> Analyze </>}
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#FF6C6C] hover:bg-[#ff8585] text-slate-950 transition-all text-xs font-extrabold uppercase tracking-wider shadow-[0_10px_30px_-10px_rgba(255,108,108,0.4)]"
                            >
                                {isGenerating ? "Generating..." : <> <Play className="w-4 h-4 fill-current" /> Generate </>}
                            </button>
                        </div>
                    </section>

                    <section className="bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl p-6">
                        <div className="flex items-center gap-3 mb-4 text-slate-500">
                            <Info className="w-4 h-4" />
                            <h3 className="text-[10px] font-bold uppercase tracking-widest">Model Information</h3>
                        </div>
                        <p className="text-xs text-slate-400 italic leading-relaxed">
                            The {modelType} model predicts the next character based on a context size of {modelType === 'bigram' ? '1' : 'N'}.
                            Click 'Analyze' to see the internal probability distributions for the current sequence.
                        </p>
                    </section>
                </div>

                {/* Right Column: Visualization & Generation */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Heatmap Area */}
                    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden min-h-[400px] flex flex-col shadow-2xl">
                        <div className="px-8 py-5 border-b border-slate-800/60 bg-slate-950/40 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <LayoutGrid className="w-4 h-4 text-[#FF6C6C]" />
                                <h3 className="text-sm font-bold text-slate-200">Probability Transition Matrix</h3>
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter self-end">Inference Map [Heatmap_v1]</div>
                        </div>

                        <div className="flex-grow p-10 flex items-center justify-center">
                            {heatmap ? (
                                <div className="w-full grid grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-1.5 animate-in fade-in zoom-in duration-700">
                                    {heatmap.token_pairs?.map((val: number, i: number) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.005 }}
                                            className="aspect-square rounded-sm transition-all hover:scale-125 cursor-help"
                                            style={{
                                                backgroundColor: `rgba(255, 108, 108, ${val})`,
                                                opacity: val > 0.1 ? 1 : 0.05
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center space-y-4 py-20 opacity-30">
                                    <LayoutGrid className="w-12 h-12 mx-auto" />
                                    <p className="text-sm italic">Pulse 'Analyze' para visualizar la matriz interna.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Results Console */}
                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 relative shadow-inner overflow-hidden min-h-[220px]">
                        <div className="absolute top-0 right-0 p-1.5 bg-slate-900 border-b border-l border-slate-800 rounded-bl-xl text-[9px] font-bold text-slate-600 px-4 uppercase tracking-[0.2em]">
                            Machine Output
                        </div>

                        <div className="flex items-center gap-2 mb-6 text-slate-600 font-mono text-[10px] uppercase">
                            <Terminal className="w-3 h-3" />
                            <span>{modelType}_prediction_service</span>
                        </div>

                        <AnimatePresence>
                            {generatedText || isGenerating ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-lg md:text-2xl font-mono text-slate-100 leading-[1.6] tracking-tight"
                                >
                                    {generatedText}
                                    {isGenerating && (
                                        <motion.span
                                            animate={{ opacity: [1, 0] }}
                                            transition={{ duration: 0.5, repeat: Infinity }}
                                            className="inline-block w-2.5 h-6 bg-[#FF6C6C] ml-1 align-baseline shadow-[0_0_15px_rgba(255,108,108,0.6)]"
                                        />
                                    )}
                                </motion.div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-24 opacity-20">
                                    <p className="text-sm italic">Esperando comando de generación...</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

            </div>

            {/* Navigation for Next Steps */}
            <div className="container mx-auto px-6 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-slate-800/60">

                    <Link href="/lab" className="group relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-6 hover:border-slate-600 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-white group-hover:border-slate-600 transition-colors">
                                    <LayoutGrid className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Return to</div>
                                    <div className="text-lg font-bold text-slate-200 group-hover:text-white transition-colors">Lab Overview</div>
                                </div>
                            </div>
                            <ChevronLeft className="w-5 h-5 text-slate-600 group-hover:text-slate-300 transition-colors" />
                        </div>
                    </Link>

                    <Link href="/lab/neural-networks" className="group relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-6 hover:border-[#FF6C6C]/50 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#FF6C6C]/0 via-[#FF6C6C]/5 to-[#FF6C6C]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-[#FF6C6C]/10 border border-[#FF6C6C]/20 text-[#FF6C6C] group-hover:bg-[#FF6C6C]/20 transition-colors">
                                    <Brain className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#FF6C6C]/70 mb-1">Next Module</div>
                                    <div className="text-lg font-bold text-slate-200 group-hover:text-[#FF6C6C] transition-colors">Neural Networks</div>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-[#FF6C6C] transition-colors" />
                        </div>
                    </Link>

                </div>
            </div>
        </div>
    );
}

export default function VisualizerPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0E1117] flex items-center justify-center">
                <div className="text-slate-400 font-mono animate-pulse uppercase tracking-[0.3em] text-xs">
                    Initializing Laboratory...
                </div>
            </div>
        }>
            <VisualizerContent />
        </Suspense>
    );
}

