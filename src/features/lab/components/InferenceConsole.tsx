"use client";

import { useCallback, useMemo, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Cpu, Dices, Info, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HonestBar } from "@/features/lab/components/bigram/HonestBar";
import { Verdict } from "@/features/lab/components/bigram/Verdict";
import type { Prediction } from "@/features/lab/types/lmLab";
import { useI18n } from "@/i18n/context";

interface InferenceConsoleProps {
    onAnalyze: (text: string, topK: number) => void;
    predictions: Prediction[] | null;
    inferenceMs?: number;
    device?: string;
    loading: boolean;
    error: string | null;
    /**
     * Visual language. `"bigram"` opts into the editorial-green v8 surface (HonestBar, --bigram-*
     * tokens, sage verdict) and must be rendered under a `[data-bigram-theme]` scope. Any other value
     * (default) keeps the original neutral console used by the n-gram chapter — so that accent never
     * regresses. This is the additive, opt-in scoping mandated by the project direction.
     */
    accent?: "bigram" | "default";
}

/* ── shared font helpers (registered vars, no new fonts) ── */
const MONO = "var(--font-jetbrains-mono)";

function glyph(ch: string): string {
    return ch === " " ? "␣" : ch;
}

export function InferenceConsole(props: InferenceConsoleProps) {
    if (props.accent === "bigram") return <BigramInferenceConsole {...props} />;
    return <LegacyInferenceConsole {...props} />;
}

/* ─────────────────────────────────────────────────────────────────────────
   v8 — editorial-green. ONE idea: enter a context, read the honest distribution
   over next characters. The HonestBar stack is the figure; everything else is
   quiet chrome. State is shown by fill + weight, never by piling on borders.
   ───────────────────────────────────────────────────────────────────────── */
function BigramInferenceConsole({
    onAnalyze,
    predictions,
    inferenceMs,
    device,
    loading,
    error,
}: InferenceConsoleProps) {
    const { t } = useI18n();
    const reduce = useReducedMotion();
    const [text, setText] = useState("hello");
    const [topK, setTopK] = useState(5);
    const [focused, setFocused] = useState(false);
    const [sampledToken, setSampledToken] = useState<string | null>(null);

    const lastChar = text.slice(-1) || " ";

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            setSampledToken(null);
            if (text.trim()) onAnalyze(text.trim(), topK);
        },
        [text, topK, onAnalyze]
    );

    // Weighted sampling lands on a real candidate so the matching bar lights up.
    const handleSample = useCallback(() => {
        if (!predictions || predictions.length === 0) return;
        const total = predictions.reduce((s, p) => s + p.probability, 0);
        let r = Math.random() * total;
        for (const p of predictions) {
            r -= p.probability;
            if (r <= 0) {
                setSampledToken(p.token);
                return;
            }
        }
        setSampledToken(predictions[predictions.length - 1].token);
    }, [predictions]);

    // Winner-last cascade: the runners-up fill first, the winner fills last with a glint —
    // the eye settles on the most likely character at the end of the motion.
    const rows = useMemo(() => {
        if (!predictions) return [];
        const n = predictions.length;
        return predictions.map((p, i) => ({
            ...p,
            isTop: i === 0,
            // i=0 (winner) gets the largest delay; the rest cascade in before it.
            delay: reduce ? 0 : (n - 1 - i) * 0.075,
        }));
    }, [predictions, reduce]);

    const winner = predictions && predictions.length > 0 ? predictions[0] : null;

    return (
        <figure
            data-console="figure"
            className="relative m-0 overflow-hidden rounded-[var(--bigram-r-lg)] px-6 py-7 sm:px-7"
            style={{
                background: "color-mix(in oklab, var(--bigram-surface) 55%, var(--bigram-bg))",
            }}
        >
            {/* Device chip — quiet mono, top-right, no neon badge */}
            {device && (
                <span
                    className="absolute right-6 top-7 inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.16em]"
                    style={{ fontFamily: MONO, color: "var(--bigram-dim)" }}
                >
                    <Cpu className="h-3 w-3" strokeWidth={1.75} />
                    {device}
                </span>
            )}

            {/* ── Control: the context input + Top-K, typography-first ── */}
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label
                        className="block text-[10.5px] uppercase tracking-[0.2em]"
                        style={{ fontFamily: MONO, color: "var(--bigram-muted)" }}
                    >
                        {t("models.bigram.inference.contextLabel")}
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            placeholder={t("models.bigram.inference.form.placeholder")}
                            aria-label={t("models.bigram.inference.contextLabel")}
                            className="w-full rounded-[var(--bigram-r-md)] px-4 py-3 text-[16px] outline-none transition-shadow"
                            style={{
                                fontFamily: MONO,
                                color: "var(--bigram-ink)",
                                background: "var(--bigram-bg-2)",
                                boxShadow: focused
                                    ? "inset 0 1px 2px color-mix(in oklab, black 22%, transparent), 0 0 0 1.5px color-mix(in oklab, var(--bigram-accent) 55%, transparent)"
                                    : "inset 0 1px 2px color-mix(in oklab, black 22%, transparent), 0 0 0 1px var(--bigram-rule-2)",
                            }}
                        />
                    </div>
                </div>

                {/* Top-K — a quiet sunken slider, value in accent mono */}
                <div className="space-y-2.5">
                    <div className="flex items-baseline justify-between">
                        <label
                            className="text-[10.5px] uppercase tracking-[0.2em]"
                            style={{ fontFamily: MONO, color: "var(--bigram-muted)" }}
                        >
                            {t("models.bigram.inference.form.topK")}
                        </label>
                        <span
                            className="text-[13px] font-semibold tabular-nums"
                            style={{ fontFamily: MONO, color: "var(--bigram-accent-ink)" }}
                        >
                            {topK}
                        </span>
                    </div>
                    <input
                        type="range"
                        min={1}
                        max={26}
                        value={topK}
                        onChange={(e) => setTopK(Number(e.target.value))}
                        aria-label={t("models.bigram.inference.form.topK")}
                        className="bigram-range w-full"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || !text.trim()}
                    className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--bigram-r-md)] text-[12px] font-semibold uppercase tracking-[0.18em] transition-[filter,opacity] disabled:opacity-40"
                    style={{
                        fontFamily: MONO,
                        color: "var(--bigram-on-accent)",
                        background: "var(--bigram-accent)",
                    }}
                >
                    {loading ? (
                        <motion.span
                            animate={reduce ? undefined : { opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.4, repeat: Infinity }}
                        >
                            {t("models.bigram.inference.form.analyzing")}
                        </motion.span>
                    ) : (
                        <>
                            <Zap className="h-3.5 w-3.5" strokeWidth={2.25} />
                            {t("models.bigram.inference.form.analyze")}
                        </>
                    )}
                </button>
            </form>

            {/* ── Error ── */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={reduce ? false : { opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-5 flex items-center gap-2 rounded-[var(--bigram-r-sm)] px-3.5 py-2.5 text-[13px]"
                        style={{
                            fontFamily: "var(--font-source-serif)",
                            color: "var(--bigram-wrong)",
                            background: "var(--bigram-wrong-soft)",
                        }}
                    >
                        <Info className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── The distribution — the single focal point ── */}
            {loading && (
                <div className="mt-7 space-y-4">
                    {Array.from({ length: topK }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className="h-3 rounded-full"
                            style={{ background: "color-mix(in oklab, var(--bigram-ink) 8%, transparent)" }}
                        />
                    ))}
                </div>
            )}

            <AnimatePresence mode="wait">
                {predictions && !loading && (
                    <motion.div
                        key={`${text}-${predictions.length}`}
                        initial={reduce ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mt-7"
                    >
                        {/* Section label: the plain-language question, serif, one focal point */}
                        <div
                            className="mb-1 flex items-baseline justify-between border-t pt-5"
                            style={{ borderColor: "var(--bigram-rule)" }}
                        >
                            <span
                                className="text-[10.5px] uppercase tracking-[0.18em]"
                                style={{ fontFamily: MONO, color: "var(--bigram-muted)" }}
                            >
                                {t("models.bigram.inference.axisLabel").replace("{char}", glyph(lastChar))}
                            </span>
                            {inferenceMs !== undefined && (
                                <span
                                    className="text-[11px] tabular-nums"
                                    style={{ fontFamily: MONO, color: "var(--bigram-dim)" }}
                                >
                                    {inferenceMs.toFixed(2)} ms
                                </span>
                            )}
                        </div>

                        <div className="-my-1">
                            {rows.map((p) => {
                                const isSampled = sampledToken === p.token;
                                return (
                                    <SampledRow key={p.token} active={isSampled} reduce={reduce}>
                                        <HonestBar
                                            src={lastChar}
                                            dst={p.token}
                                            value={p.probability}
                                            top={p.isTop || isSampled}
                                            delay={p.delay}
                                        />
                                    </SampledRow>
                                );
                            })}
                        </div>

                        {/* Honest-axis caption — explains the short-bar = uncertainty idea */}
                        <p
                            className="mt-3 text-[13px] italic"
                            style={{ fontFamily: "var(--font-source-serif)", color: "var(--bigram-muted)" }}
                        >
                            {t("models.bigram.inference.axisHint")}
                        </p>

                        {/* ── Sample: roll the weighted dice ── */}
                        <div className="mt-6 space-y-4">
                            <button
                                onClick={handleSample}
                                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--bigram-r-md)] text-[12px] font-semibold uppercase tracking-[0.16em] transition-colors"
                                style={{
                                    fontFamily: MONO,
                                    color: "var(--bigram-accent-ink)",
                                    background: "var(--bigram-accent-soft)",
                                    boxShadow:
                                        "inset 0 0 0 1px color-mix(in oklab, var(--bigram-accent) 26%, transparent)",
                                }}
                            >
                                <motion.span
                                    key={sampledToken ?? "idle"}
                                    initial={reduce ? false : { rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 320, damping: 18 }}
                                    className="inline-flex"
                                >
                                    <Dices className="h-4 w-4" strokeWidth={2} />
                                </motion.span>
                                {sampledToken
                                    ? t("models.bigram.inference.sampleAgain")
                                    : t("models.bigram.inference.sampleButton")}
                            </button>

                            {/* Plain-language verdict — SAGE voice, the conclusion in human words */}
                            <AnimatePresence mode="wait">
                                {sampledToken && winner && (
                                    <motion.div
                                        key={sampledToken}
                                        initial={reduce ? false : { opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <Verdict
                                            label={t("models.bigram.inference.sampledLabel")}
                                            main={
                                                <>
                                                    {beforeChar(
                                                        t("models.bigram.inference.verdictMain"),
                                                        glyph(lastChar),
                                                        glyph(sampledToken)
                                                    )}
                                                </>
                                            }
                                            sub={t("models.bigram.inference.verdictSub").replace(
                                                "{pct}",
                                                `${(sampledProb(predictions, sampledToken) * 100).toFixed(1)}%`
                                            )}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty state — calm hint, no chrome */}
            {!predictions && !loading && !error && (
                <p
                    className="mt-6 border-t pt-5 text-[14px] italic"
                    style={{
                        fontFamily: "var(--font-source-serif)",
                        color: "var(--bigram-muted)",
                        borderColor: "var(--bigram-rule)",
                    }}
                >
                    {t("models.bigram.inference.emptyHint")}
                </p>
            )}

            {/* Themed slider — scoped to this figure so it never touches other accents */}
            <style>{`
                .bigram-range {
                    -webkit-appearance: none;
                    appearance: none;
                    height: 4px;
                    border-radius: 999px;
                    background: var(--bigram-bg-2);
                    box-shadow: inset 0 1px 2px color-mix(in oklab, black 24%, transparent);
                    outline: none;
                }
                .bigram-range::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px; height: 16px;
                    border-radius: 50%;
                    background: var(--bigram-accent);
                    box-shadow: 0 0 0 4px color-mix(in oklab, var(--bigram-accent) 18%, transparent);
                    cursor: pointer;
                    transition: box-shadow .15s ease;
                }
                .bigram-range::-webkit-slider-thumb:hover {
                    box-shadow: 0 0 0 6px color-mix(in oklab, var(--bigram-accent) 22%, transparent);
                }
                .bigram-range::-moz-range-thumb {
                    width: 16px; height: 16px; border: none;
                    border-radius: 50%;
                    background: var(--bigram-accent);
                    box-shadow: 0 0 0 4px color-mix(in oklab, var(--bigram-accent) 18%, transparent);
                    cursor: pointer;
                }
                .bigram-range::-moz-range-track {
                    height: 4px; border-radius: 999px; background: var(--bigram-bg-2);
                }
            `}</style>
        </figure>
    );
}

/**
 * SampledRow — a thin sliding highlight that slides to whichever bar the dice landed on.
 * One persistent layout element (layoutId) rather than a per-row redraw, matching the v8
 * "sliding lens" idea: subtle accent-soft plane behind the active row, nothing else.
 */
function SampledRow({
    active,
    reduce,
    children,
}: {
    active: boolean;
    reduce: boolean | null;
    children: React.ReactNode;
}) {
    return (
        <div className="relative">
            {active && (
                <motion.span
                    layoutId="bigram-sampled-lens"
                    aria-hidden
                    transition={
                        reduce ? { duration: 0 } : { type: "spring", stiffness: 360, damping: 32 }
                    }
                    className="pointer-events-none absolute inset-x-[-12px] inset-y-[3px] rounded-[var(--bigram-r-sm)]"
                    style={{ background: "var(--bigram-sage-soft)" }}
                />
            )}
            <div className="relative">{children}</div>
        </div>
    );
}

/* probability of the sampled token (for the verdict sub-line) */
function sampledProb(preds: Prediction[] | null, token: string): number {
    if (!preds) return 0;
    return preds.find((p) => p.token === token)?.probability ?? 0;
}

/**
 * Render `verdictMain` ("After \"{char}\", the most likely is \"{best}\".") with the two chars
 * bolded — Verdict colours any <b> in accent-ink. We split on the literal placeholders so the
 * surrounding copy stays translatable.
 */
function beforeChar(template: string, char: string, best: string): React.ReactNode {
    const parts = template.split(/(\{char\}|\{best\})/g);
    return parts.map((seg, i) => {
        if (seg === "{char}") return <b key={i}>{char}</b>;
        if (seg === "{best}") return <b key={i}>{best}</b>;
        return <span key={i}>{seg}</span>;
    });
}

/* ─────────────────────────────────────────────────────────────────────────
   Legacy console — preserved verbatim for the n-gram chapter (accent="amber"
   there). Untouched visual language so that chapter never regresses.
   ───────────────────────────────────────────────────────────────────────── */
function LegacyInferenceConsole({
    onAnalyze,
    predictions,
    inferenceMs,
    device,
    loading,
    error,
}: InferenceConsoleProps) {
    const { t } = useI18n();
    const [text, setText] = useState("hello");
    const [topK, setTopK] = useState(5);
    const [sampledToken, setSampledToken] = useState<string | null>(null);
    const [sampling, setSampling] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) onAnalyze(text.trim(), topK);
    };

    const handleSample = () => {
        if (!predictions || predictions.length === 0) return;

        setSampling(true);
        setSampledToken(null);

        setTimeout(() => {
            const random = Math.random();
            let cumulative = 0;

            for (const pred of predictions) {
                cumulative += pred.probability;
                if (random <= cumulative) {
                    setSampledToken(pred.token);
                    break;
                }
            }

            setSampling(false);
        }, 600);
    };

    return (
        <Card className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div className="group relative ml-1">
                    <div className="flex items-center justify-center w-4 h-4 rounded-full bg-white/5 border border-white/10 cursor-help hover:bg-white/10 transition-colors">
                        <span className="text-[10px] font-bold text-white/40 group-hover:text-white/60">?</span>
                    </div>
                    <div className="absolute left-0 bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-white/10 p-4 rounded-2xl z-50 w-72 text-[11px] text-slate-400 pointer-events-none shadow-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <p className="font-bold text-white mb-2 uppercase tracking-widest text-[10px]">{t("models.ngram.sections.inference.title")}</p>
                        <div className="space-y-2">
                            <p>{t("models.ngram.educationalOverlay.probabilityDistributionDescription")}</p>
                            <p><strong className="text-violet-400">Top-K:</strong> {t("models.ngram.sections.inference.distribution.desc")}</p>
                        </div>
                    </div>
                </div>

                {device && (
                    <Badge className="ml-auto bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-mono">
                        <Cpu className="h-3 w-3 mr-1" />
                        {device}
                    </Badge>
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="space-y-2">
                    <label className="text-[11px] font-mono uppercase tracking-widest text-white/40">
                        {t("models.ngram.sections.inference.distribution.title")}
                    </label>
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={t("models.ngram.sections.inference.placeholder")}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/30 transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <label className="text-[11px] font-mono uppercase tracking-widest text-white/40">
                            {t("models.ngram.sections.inference.distribution.desc")}
                        </label>
                        <span className="text-xs font-mono text-emerald-400">{topK}</span>
                    </div>
                    <input
                        type="range"
                        min={1}
                        max={26}
                        value={topK}
                        onChange={(e) => setTopK(Number(e.target.value))}
                        className="w-full accent-emerald-500 h-1"
                    />
                </div>

                <Button
                    type="submit"
                    disabled={loading || !text.trim()}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs uppercase tracking-widest h-10 transition-all disabled:opacity-40"
                >
                    {loading ? (
                        <motion.span
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            {t("common.loading")}
                        </motion.span>
                    ) : (
                        <>
                            <Zap className="h-3.5 w-3.5 mr-2" /> {t("models.ngram.sections.inference.title")}
                        </>
                    )}
                </Button>
            </form>

            {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    {error}
                </div>
            )}

            {predictions && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 pt-6 border-t border-white/5 space-y-4"
                >
                    <div className="flex items-center justify-between text-[10px] font-mono text-white/30 uppercase tracking-widest">
                        <span>{t("models.bigram.inference.lastChar")} &quot;{text.slice(-1)}&quot;</span>
                        <div className="flex items-center gap-2">
                            {device && <span>{device}</span>}
                            {inferenceMs && <span className="text-emerald-400">{inferenceMs.toFixed(2)}ms</span>}
                        </div>
                    </div>
                </motion.div>
            )}

            {loading && (
                <div className="space-y-2">
                    {Array.from({ length: topK }).map((_, i) => (
                        <Skeleton key={i} className="h-8 bg-white/[0.04] rounded-lg" />
                    ))}
                </div>
            )}

            <AnimatePresence mode="wait">
                {predictions && !loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-1.5"
                    >
                        {predictions.map((p, i) => {
                            const isHighlighted = sampledToken === p.token;
                            return (
                                <motion.div
                                    key={p.token}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{
                                        opacity: 1,
                                        x: 0,
                                        scale: isHighlighted ? 1.03 : 1,
                                    }}
                                    transition={{ delay: i * 0.04 }}
                                    className={`flex items-center gap-3 group relative rounded-lg p-2 -mx-2 transition-all ${isHighlighted
                                            ? "bg-emerald-500/10 border border-emerald-500/30"
                                            : "border border-transparent"
                                        }`}
                                >
                                    {isHighlighted && (
                                        <motion.div
                                            layoutId="highlight"
                                            className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-lg"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <span className={`relative w-8 h-8 flex items-center justify-center rounded-md text-sm font-mono transition-all ${isHighlighted
                                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 border-2"
                                            : "bg-white/[0.06] border border-white/[0.08] text-white group-hover:border-emerald-500/40"
                                        }`}>
                                        {p.token === " " ? "␣" : p.token}
                                    </span>
                                    <div className="flex-1 h-6 bg-white/[0.03] rounded-full overflow-hidden relative">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(p.probability * 100).toFixed(1)}%` }}
                                            transition={{ duration: 0.6, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                                            className={`absolute inset-y-0 left-0 rounded-full ${isHighlighted
                                                    ? "bg-gradient-to-r from-emerald-500/80 to-emerald-400/60"
                                                    : "bg-gradient-to-r from-emerald-600/60 to-emerald-400/40"
                                                }`}
                                        />
                                        <span className={`absolute inset-0 flex items-center pl-3 text-[10px] font-mono ${isHighlighted ? "text-white/80 font-bold" : "text-white/60"
                                            }`}>
                                            {(p.probability * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                        {inferenceMs !== undefined && (
                            <div className="text-right pt-1">
                                <span className="text-[10px] font-mono text-white/30">
                                    {inferenceMs.toFixed(2)}ms
                                </span>
                            </div>
                        )}

                        <div className="pt-6 border-t border-white/5 space-y-4">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSample}
                                disabled={sampling}
                                className="group relative w-full rounded-xl border border-teal-500/20 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-teal-500/40 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/[0.06] to-emerald-500/[0.06] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                <div className="relative flex items-center justify-center gap-2">
                                    {sampling ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Dices className="w-4 h-4" />
                                        </motion.div>
                                    ) : (
                                        <Dices className="w-4 h-4" />
                                    )}
                                    <span>{t("models.bigram.inference.sampleButton")}</span>
                                </div>
                            </motion.button>

                            <AnimatePresence mode="wait">
                                {sampledToken && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-white/40 font-mono uppercase tracking-widest">
                                                {t("models.bigram.inference.sampledLabel")}
                                            </span>
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/30"
                                            >
                                                <span className="text-lg font-mono font-bold text-emerald-300">
                                                    {sampledToken === " " ? "␣" : sampledToken}
                                                </span>
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}
