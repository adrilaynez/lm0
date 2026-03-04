"use client";

import { memo, useCallback, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Play, RotateCcw, Sparkles } from "lucide-react";

import { useI18n } from "@/i18n/context";
import { generateNgram } from "@/lib/lmLabClient";

/* ─── Constants ─── */
const N_OPTIONS = [2, 3, 4] as const;
const MAX_TOKENS = 120;

const N_COLORS: Record<number, { ring: string; bg: string; text: string; glow: string }> = {
    2: { ring: "ring-orange-500/40", bg: "bg-orange-500/15", text: "text-orange-300", glow: "shadow-[0_0_12px_-3px_rgba(251,146,60,0.3)]" },
    3: { ring: "ring-amber-500/40", bg: "bg-amber-500/15", text: "text-amber-300", glow: "shadow-[0_0_12px_-3px_rgba(251,191,36,0.3)]" },
    4: { ring: "ring-emerald-500/40", bg: "bg-emerald-500/15", text: "text-emerald-300", glow: "shadow-[0_0_12px_-3px_rgba(52,211,153,0.3)]" },
};

/* ─── Typewriter reveal ─── */
function TypewriterReveal({ text, seed }: { text: string; seed: string }) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.025 } },
            }}
            className="font-mono text-sm leading-relaxed"
        >
            <span className="text-amber-300 font-bold">{seed}</span>
            {text.split("").map((ch, i) => (
                <motion.span
                    key={i}
                    variants={{
                        hidden: { opacity: 0, y: 4 },
                        visible: { opacity: 1, y: 0 },
                    }}
                    className="text-white/70"
                >
                    {ch}
                </motion.span>
            ))}
        </motion.div>
    );
}

/* ─── Main component ─── */
export const NgramInteractiveGenerator = memo(function NgramInteractiveGenerator() {
    const { t } = useI18n();
    const [seed, setSeed] = useState("the ");
    const [selectedN, setSelectedN] = useState(3);
    const [temperature, setTemperature] = useState(0.8);
    const [generatedText, setGeneratedText] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleGenerate = useCallback(async () => {
        if (!seed.trim() || loading) return;

        abortRef.current?.abort();
        abortRef.current = new AbortController();

        setLoading(true);
        setError(null);
        setGeneratedText(null);

        try {
            const res = await generateNgram(seed, MAX_TOKENS, temperature, selectedN);
            setGeneratedText(res.generated_only ?? "");
        } catch (err) {
            if ((err as Error).name !== "AbortError") {
                setError((err as Error).message);
            }
        } finally {
            setLoading(false);
        }
    }, [seed, selectedN, temperature, loading]);

    const handleReset = useCallback(() => {
        abortRef.current?.abort();
        setGeneratedText(null);
        setError(null);
        setLoading(false);
        inputRef.current?.focus();
    }, []);

    const colors = N_COLORS[selectedN] ?? N_COLORS[3];

    return (
        <div className="space-y-5">
            {/* Controls row */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Seed input */}
                <div className="flex-1 relative">
                    <label className="text-[9px] font-mono uppercase tracking-widest text-white/20 mb-1.5 block">
                        {t("ngramNarrative.interactiveGenerator.seedLabel")}
                    </label>
                    <input
                        ref={inputRef}
                        type="text"
                        value={seed}
                        onChange={(e) => setSeed(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                        maxLength={20}
                        placeholder="the "
                        className="w-full px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] font-mono text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 transition-all"
                    />
                </div>

                {/* N selector */}
                <div>
                    <label className="text-[9px] font-mono uppercase tracking-widest text-white/20 mb-1.5 block">
                        {t("ngramNarrative.interactiveGenerator.contextLabel")}
                    </label>
                    <div className="flex gap-1.5">
                        {N_OPTIONS.map((n) => {
                            const c = N_COLORS[n];
                            const active = selectedN === n;
                            return (
                                <motion.button
                                    key={n}
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.94 }}
                                    onClick={() => setSelectedN(n)}
                                    className={`w-10 h-10 rounded-xl border font-mono text-sm font-bold transition-all ${active
                                        ? `${c.bg} border-transparent ring-2 ${c.ring} ${c.text} ${c.glow}`
                                        : "border-white/[0.08] bg-white/[0.03] text-white/40 hover:text-white/60 hover:border-white/15"
                                        }`}
                                >
                                    {n}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Temperature */}
                <div className="min-w-[100px]">
                    <label className="text-[9px] font-mono uppercase tracking-widest text-white/20 mb-1.5 block">
                        {t("ngramNarrative.interactiveGenerator.tempLabel")}
                    </label>
                    <div className="flex items-center gap-2 h-10">
                        <input
                            type="range"
                            min={0.1}
                            max={2.5}
                            step={0.1}
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            className="flex-1 accent-amber-400 h-1"
                        />
                        <span className="text-xs font-mono text-white/40 w-8 text-right">
                            {temperature.toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Generate / Reset buttons */}
            <div className="flex items-center gap-3">
                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleGenerate}
                    disabled={loading || !seed.trim()}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl border text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${loading
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                        : `border-amber-500/25 bg-amber-500/[0.08] text-amber-400 hover:bg-amber-500/15 hover:border-amber-500/40`
                        }`}
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Play className="w-4 h-4" />
                    )}
                    {loading
                        ? t("ngramNarrative.interactiveGenerator.generating")
                        : t("ngramNarrative.interactiveGenerator.generate")}
                </motion.button>

                {generatedText !== null && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleReset}
                        className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/40 text-sm hover:text-white/60 hover:border-white/15 transition-all"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {t("ngramNarrative.interactiveGenerator.reset")}
                    </motion.button>
                )}
            </div>

            {/* Output area */}
            <AnimatePresence mode="wait">
                {error && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="rounded-xl border border-rose-500/20 bg-rose-500/[0.04] px-5 py-4"
                    >
                        <p className="text-xs text-rose-400">{error}</p>
                    </motion.div>
                )}

                {loading && !generatedText && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center"
                    >
                        <Loader2 className="w-5 h-5 animate-spin text-amber-400/50 mx-auto mb-2" />
                        <p className="text-xs text-white/25 font-mono">
                            {t("ngramNarrative.interactiveGenerator.generating")}…
                        </p>
                    </motion.div>
                )}

                {generatedText !== null && !loading && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`relative rounded-xl border p-5 overflow-hidden ${colors.ring.replace("ring-", "border-").replace("/40", "/20")} bg-gradient-to-br from-white/[0.03] to-transparent`}
                    >
                        {/* N badge */}
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${colors.bg} ${colors.text} text-[10px] font-mono font-bold uppercase tracking-wider`}>
                                <Sparkles className="w-3 h-3" />
                                N={selectedN}
                            </span>
                            <span className="text-[10px] font-mono text-white/20">
                                {generatedText.length} {t("ngramNarrative.interactiveGenerator.chars")}
                            </span>
                        </div>

                        {/* Typewriter output */}
                        <div className="min-h-[60px]">
                            <TypewriterReveal seed={seed} text={generatedText} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Idle hint */}
            {!generatedText && !loading && !error && (
                <div className="text-center py-6">
                    <p className="text-xs text-white/20 italic">
                        {t("ngramNarrative.interactiveGenerator.hint")}
                    </p>
                </div>
            )}
        </div>
    );
});
