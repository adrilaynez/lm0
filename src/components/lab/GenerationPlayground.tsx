"use client";

import { memo, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, Copy, Sparkles } from "lucide-react";

import { useI18n } from "@/i18n/context";

/* ─── Temperature presets ─── */
const TEMP_PRESETS = [
    { key: "focused", value: 0.3 },
    { key: "balanced", value: 0.8 },
    { key: "creative", value: 1.5 },
    { key: "chaotic", value: 2.5 },
] as const;

/* ─── Quick start characters ─── */
const QUICK_CHARS = ["t", "a", "e", "s", " "];

function displayChar(c: string) {
    return c === " " ? "·" : c;
}

interface GenerationPlaygroundProps {
    onGenerate: (
        startChar: string,
        numTokens: number,
        temperature: number
    ) => void;
    generatedText: string | null;
    loading: boolean;
    error: string | null;
}

export const GenerationPlayground = memo(function GenerationPlayground({
    onGenerate,
    generatedText,
    loading,
    error,
}: GenerationPlaygroundProps) {
    const { t } = useI18n();
    const [startChar, setStartChar] = useState("t");
    const [numTokens, setNumTokens] = useState(60);
    const [temperature, setTemperature] = useState(0.8);
    const [copied, setCopied] = useState(false);
    const [revealCount, setRevealCount] = useState(0);
    const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ── Character-by-character reveal animation ── */
    useEffect(() => {
        if (!generatedText || loading) {
            setRevealCount(0);
            return;
        }
        setRevealCount(0);
        let count = 0;
        const tick = () => {
            count++;
            setRevealCount(count);
            if (count < generatedText.length) {
                revealTimerRef.current = setTimeout(tick, 18);
            }
        };
        revealTimerRef.current = setTimeout(tick, 100);
        return () => {
            if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
        };
    }, [generatedText, loading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (startChar) onGenerate(startChar, numTokens, temperature);
    };

    const handleCopy = async () => {
        if (!generatedText) return;
        await navigator.clipboard.writeText(generatedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const activePreset = TEMP_PRESETS.find((p) => p.value === temperature);

    return (
        <div className="space-y-5" id="playground">
            {/* Controls row */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Start character row */}
                <div>
                    <p className="text-[9px] font-mono uppercase tracking-widest text-white/20 mb-2">
                        {t("models.bigram.generation.form.startChar")}
                    </p>
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            {QUICK_CHARS.map((ch) => (
                                <button
                                    key={ch}
                                    type="button"
                                    onClick={() => setStartChar(ch)}
                                    className={`w-9 h-9 rounded-lg font-mono text-sm font-bold border transition-all ${startChar === ch
                                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                        : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:bg-white/[0.06]"
                                        }`}
                                >
                                    {displayChar(ch)}
                                </button>
                            ))}
                        </div>
                        <span className="text-white/15 text-xs">{t("models.bigram.generation.form.or")}</span>
                        <input
                            type="text"
                            value={startChar}
                            onChange={(e) => setStartChar(e.target.value.slice(0, 1))}
                            maxLength={1}
                            className="w-11 h-9 bg-white/[0.04] border border-white/[0.08] rounded-lg text-center text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
                        />
                    </div>
                </div>

                {/* Length + Temperature side by side */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Length */}
                    <div>
                        <div className="flex justify-between mb-1.5">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-white/20">
                                {t("models.bigram.generation.form.numTokens")}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400">{numTokens}</span>
                        </div>
                        <input
                            type="range"
                            min={10}
                            max={200}
                            value={numTokens}
                            onChange={(e) => setNumTokens(Number(e.target.value))}
                            className="w-full accent-emerald-500 h-1"
                        />
                    </div>

                    {/* Temperature */}
                    <div>
                        <div className="flex justify-between mb-1.5">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-white/20">
                                {t("models.bigram.generation.form.temp")}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400">{temperature.toFixed(1)}</span>
                        </div>
                        <input
                            type="range"
                            min={0.1}
                            max={3.0}
                            step={0.1}
                            value={temperature}
                            onChange={(e) => setTemperature(Number(e.target.value))}
                            className="w-full accent-emerald-500 h-1"
                        />
                    </div>
                </div>

                {/* Temperature presets */}
                <div className="flex gap-1.5">
                    {TEMP_PRESETS.map((preset) => (
                        <button
                            key={preset.key}
                            type="button"
                            onClick={() => setTemperature(preset.value)}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono border transition-all ${activePreset?.key === preset.key
                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                                : "bg-white/[0.02] border-white/[0.06] text-white/30 hover:text-white/50 hover:bg-white/[0.04]"
                                }`}
                        >
                            {t(`models.bigram.generation.form.presets.${preset.key}`)}
                        </button>
                    ))}
                </div>

                {/* Generate button */}
                <motion.button
                    type="submit"
                    disabled={loading || !startChar}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider hover:bg-emerald-500/25 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <motion.span
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            {t("models.bigram.generation.form.generating")}
                        </motion.span>
                    ) : (
                        <>
                            <Sparkles className="h-3.5 w-3.5" />
                            {t("models.bigram.generation.form.generate")}
                        </>
                    )}
                </motion.button>
            </form>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {error}
                </div>
            )}

            {/* Loading skeleton */}
            {loading && (
                <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="h-24 bg-white/[0.03] rounded-xl border border-white/[0.06]"
                />
            )}

            {/* Output with character reveal */}
            <AnimatePresence>
                {generatedText && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="relative group"
                    >
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 font-mono text-sm leading-relaxed whitespace-pre-wrap break-all min-h-[80px]">
                            <span className="text-emerald-400/80">{generatedText.slice(0, revealCount)}</span>
                            {revealCount < generatedText.length && (
                                <motion.span
                                    animate={{ opacity: [1, 0] }}
                                    transition={{ duration: 0.5, repeat: Infinity }}
                                    className="inline-block w-[2px] h-4 bg-emerald-400 align-text-bottom ml-px"
                                />
                            )}
                            <span className="text-white/10">{generatedText.slice(revealCount)}</span>
                        </div>

                        {/* Copy button */}
                        <button
                            onClick={handleCopy}
                            className="absolute top-3 right-3 p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/30 hover:text-white/70 hover:bg-white/[0.08] transition-all opacity-0 group-hover:opacity-100"
                            aria-label="Copy to clipboard"
                        >
                            {copied ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                                <Copy className="h-3.5 w-3.5" />
                            )}
                        </button>

                        {/* Character count */}
                        <div className="mt-2 text-right">
                            <span className="text-[9px] font-mono text-white/15">
                                {generatedText.length} {t("models.bigram.generation.form.chars")}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
