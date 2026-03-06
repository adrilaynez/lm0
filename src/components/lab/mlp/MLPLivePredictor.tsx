"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Play, RotateCcw, Sparkles, Thermometer } from "lucide-react";

import { fetchMLPGrid, generateMLP } from "@/lib/lmLabClient";

/*
  MLPLivePredictor — Redesigned
  Typewriter-style text generation demo.
  - Type a seed → hit Generate → watch character-by-character generation
  - Temperature slider for creativity control
  - Auto-fetches best config from API, falls back to hardcoded
  - Graceful fallback with pre-generated samples when backend is down
*/

const FALLBACK_SAMPLES: Record<string, string> = {
    "the ": "the mountain.s and the saint of the king was in the court",
    "once": "once the land and the sain.t of the great king of the",
    "king": "king was the first and the mont and the saint of the",
    "he s": "he said the great mountain and the land of the saint",
    "in t": "in the court of the king was the first and the great",
};

const SEED_SUGGESTIONS = ["the ", "once", "king", "he s", "in t"];

interface MLPConfig {
    embedding_dim: number;
    hidden_size: number;
    learning_rate: number;
}

export function MLPLivePredictor() {
    const [seed, setSeed] = useState("the ");
    const [generated, setGenerated] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [temperature, setTemperature] = useState(0.8);
    const [config, setConfig] = useState<MLPConfig | null>(null);
    const [backendAvailable, setBackendAvailable] = useState(true);
    const [charIndex, setCharIndex] = useState(0);
    const fullTextRef = useRef("");
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load best config on mount
    useEffect(() => {
        let cancelled = false;
        console.log("[MLPLivePredictor] Loading best config...");
        fetchMLPGrid()
            .then(res => {
                if (cancelled) return;
                console.log("[MLPLivePredictor] Grid response:", res);
                const configs = res.configurations ?? res.configs ?? [];
                if (configs.length === 0) throw new Error("No configs");
                const best = [...configs].sort((a, b) => a.final_loss - b.final_loss)[0];
                console.log("[MLPLivePredictor] Best config:", best);
                setConfig({
                    embedding_dim: best.embedding_dim,
                    hidden_size: best.hidden_size,
                    learning_rate: best.learning_rate,
                });
                setBackendAvailable(true);
            })
            .catch(err => {
                console.error("[MLPLivePredictor] Failed to load config:", err);
                if (!cancelled) {
                    setConfig({ embedding_dim: 10, hidden_size: 64, learning_rate: 0.01 });
                    setBackendAvailable(false);
                }
            });
        return () => { cancelled = true; };
    }, []);

    // Typewriter effect
    useEffect(() => {
        if (!isGenerating || charIndex >= fullTextRef.current.length) {
            if (isGenerating && charIndex >= fullTextRef.current.length) setIsGenerating(false);
            return;
        }
        timerRef.current = setTimeout(() => {
            setGenerated(fullTextRef.current.slice(0, charIndex + 1));
            setCharIndex(prev => prev + 1);
        }, 35 + Math.random() * 25);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [isGenerating, charIndex]);

    const handleGenerate = useCallback(async () => {
        if (!config) return;
        console.log("[MLPLivePredictor] Generating with config:", config);
        setGenerated("");
        setCharIndex(0);
        setIsGenerating(true);

        try {
            const res = await generateMLP(
                config.embedding_dim,
                config.hidden_size,
                config.learning_rate,
                seed,
                60,
                temperature
            );
            console.log("[MLPLivePredictor] Generation response:", res);
            // Use generated_only (excludes seed) if available, otherwise strip seed manually
            let text = res.generated_only ?? res.generated_text ?? "";
            if (!res.generated_only && text.startsWith(seed)) text = text.slice(seed.length);
            fullTextRef.current = text;
            setCharIndex(0);
            setBackendAvailable(true);
        } catch (err) {
            console.error("[MLPLivePredictor] Generation failed:", err);
            // Use fallback
            setBackendAvailable(false);
            const key = Object.keys(FALLBACK_SAMPLES).find(k => seed.startsWith(k)) ?? Object.keys(FALLBACK_SAMPLES)[0];
            const fallback = FALLBACK_SAMPLES[key];
            fullTextRef.current = fallback.slice(key.length);
            setCharIndex(0);
        }
    }, [config, seed, temperature]);

    const handleReset = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setGenerated("");
        setCharIndex(0);
        setIsGenerating(false);
        fullTextRef.current = "";
    }, []);

    const tempLabel = temperature <= 0.5 ? "Conservative" : temperature <= 1.0 ? "Balanced" : "Creative";

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Seed input */}
            <div className="space-y-2">
                <label className="text-[9px] font-mono text-white/25 uppercase tracking-widest">Seed text</label>
                <div className="relative">
                    <input
                        type="text"
                        value={seed}
                        onChange={e => { setSeed(e.target.value); handleReset(); }}
                        placeholder="Type a starting word..."
                        disabled={isGenerating}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-sm font-mono text-white/80 placeholder:text-white/20 focus:outline-none focus:border-violet-500/40 transition-colors disabled:opacity-50"
                    />
                </div>
                {/* Suggestions */}
                <div className="flex flex-wrap gap-1.5">
                    {SEED_SUGGESTIONS.map(s => (
                        <button
                            key={s}
                            onClick={() => { setSeed(s); handleReset(); }}
                            disabled={isGenerating}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all border ${seed === s
                                ? "bg-violet-500/15 border-violet-500/30 text-violet-400"
                                : "bg-white/[0.03] border-white/[0.06] text-white/30 hover:text-white/50"
                                } disabled:opacity-40`}
                        >
                            &quot;{s.trim()}&quot;
                        </button>
                    ))}
                </div>
            </div>

            {/* Temperature slider */}
            <div className="flex items-center gap-3">
                <Thermometer className="w-3.5 h-3.5 text-white/20 shrink-0" />
                <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-white/25">Temperature</span>
                        <span className="text-[9px] font-mono text-violet-400/60 tabular-nums">{temperature.toFixed(1)} · {tempLabel}</span>
                    </div>
                    <input
                        type="range"
                        min={0.2}
                        max={1.5}
                        step={0.1}
                        value={temperature}
                        onChange={e => setTemperature(Number(e.target.value))}
                        disabled={isGenerating}
                        className="w-full h-1 appearance-none bg-white/[0.06] rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-400 disabled:opacity-40"
                    />
                </div>
            </div>

            {/* Generate button */}
            <div className="flex gap-2">
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !config || !seed.trim()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-mono font-bold
                        bg-gradient-to-r from-violet-500/20 to-emerald-500/20 text-white/80 border border-violet-500/30
                        hover:from-violet-500/30 hover:to-emerald-500/30 transition-all
                        disabled:opacity-40 disabled:cursor-not-allowed
                        shadow-[0_0_20px_rgba(139,92,246,0.08)]"
                >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isGenerating ? "Generating..." : "Generate"}
                </button>
                {generated && !isGenerating && (
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.08] text-xs font-mono text-white/30 hover:text-white/50 transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" /> Clear
                    </button>
                )}
            </div>

            {/* Generated text display */}
            <AnimatePresence>
                {(generated || isGenerating) && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-violet-500/15 bg-gradient-to-br from-violet-500/[0.04] to-emerald-500/[0.02] p-4 min-h-[80px]"
                    >
                        <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-2">Generated output</p>
                        <p className="font-mono text-sm leading-relaxed break-all">
                            <span className="text-violet-400/80 font-bold">{seed}</span>
                            <span className="text-white/70">{generated}</span>
                            {isGenerating && (
                                <motion.span
                                    animate={{ opacity: [1, 0] }}
                                    transition={{ duration: 0.5, repeat: Infinity }}
                                    className="inline-block w-[2px] h-[14px] bg-emerald-400 ml-0.5 align-middle"
                                />
                            )}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Status */}
            {!backendAvailable && (
                <p className="text-[9px] font-mono text-amber-400/40 text-center">
                    ⚠ Using pre-generated samples (API unavailable)
                </p>
            )}
            {config && backendAvailable && !isGenerating && !generated && (
                <p className="text-[9px] font-mono text-white/15 text-center">
                    Using best model: emb={config.embedding_dim}, h={config.hidden_size}
                </p>
            )}
        </div>
    );
}
