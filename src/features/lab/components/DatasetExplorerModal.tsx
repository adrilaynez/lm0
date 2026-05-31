"use client";

import { useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, X } from "lucide-react";

import { bigramDatasetLookup, datasetLookup } from "@/features/lab/lib/lmLabClient";
import { useLabTheme } from "@/features/lab/hooks/useLabTheme";
import type { DatasetLookupResponse } from "@/features/lab/types/lmLab";
import { useI18n } from "@/i18n/context";

interface DatasetExplorerModalProps {
    isOpen: boolean;
    onClose: () => void;
    contextChar: string;
    nextChar: string;
    /** Which model type triggered the lookup. Defaults to "bigram". */
    modelType?: "bigram" | "ngram";
    /** For N-Gram: additional context tokens from the active slice. */
    contextTokens?: string[];
}

const COUNT_UP_MS = 620;
const PANEL_SPRING = { type: "spring", stiffness: 320, damping: 32, mass: 0.9 } as const;
const SNIPPET_EASE = [0.2, 0.7, 0.2, 1] as const;
const SPACE_GLYPH = "␣";

/** Render a char for display: a literal space becomes a visible ␣ glyph. */
function glyph(ch: string): string {
    return ch === " " ? SPACE_GLYPH : ch;
}

/**
 * DatasetExplorerModal — "Corpus Evidence" for the Bigram chapter (v8, editorial-green).
 *
 * Pedagogy: it answers ONE question — *why* did the model learn this transition? The whole panel
 * leads the eye to a single focal point (the raw occurrence count) and then grounds it in real
 * corpus snippets, the matched pair highlighted by a calm sage lens. No dashboard, no neon, no
 * traffic-light dots — an editorial card on a soft scrim.
 *
 * Scoping: when `modelType === "bigram"` the panel opens its own `[data-bigram-theme]` scope (it is
 * rendered as a fixed overlay outside the page's theme wrapper) so every `--bigram-*` token resolves
 * dark/light from `useLabTheme()`. The `ngram` path keeps the original neutral lab styling untouched,
 * so non-bigram consumers are entirely unaffected. Logic + fetch contract are unchanged.
 */
export function DatasetExplorerModal({
    isOpen,
    onClose,
    contextChar,
    nextChar,
    modelType = "bigram",
    contextTokens,
}: DatasetExplorerModalProps) {
    const { t } = useI18n();
    const { theme } = useLabTheme();
    const reduce = useReducedMotion();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<DatasetLookupResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const isBigram = modelType !== "ngram";

    // Effect to trigger fetch
    useEffect(() => {
        const fetchData = async () => {
            if (!isOpen) return;
            setLoading(true);
            setError(null);
            try {
                let res: DatasetLookupResponse;
                if (modelType === "ngram") {
                    // For N-Gram: build full context from contextTokens + row label
                    const fullContext = [...(contextTokens ?? []), contextChar];
                    res = await datasetLookup(fullContext, nextChar);
                } else {
                    // For Bigram: single-character context
                    res = await bigramDatasetLookup([contextChar], nextChar);
                }
                setData(res);
            } catch (err) {
                setError((err as Error).message || t("datasetExplorer.fetchError"));
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, contextChar, nextChar, modelType, contextTokens ? contextTokens.join(",") : ""]);

    // Build display context string
    const displayContext = modelType === "ngram" && contextTokens?.length
        ? `${contextTokens.join("")}${contextChar}`
        : contextChar;

    // ── N-Gram path: original neutral lab styling, untouched ──────────────────
    if (!isBigram) {
        if (!isOpen) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="bg-slate-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                        <div>
                            <h3 className="text-lg font-bold text-white">{t("datasetExplorer.title")}</h3>
                            <p className="text-sm text-white/50">
                                {t("datasetExplorer.subtitle", { context: displayContext, next: nextChar })}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-white/50" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {loading && (
                            <div className="flex items-center justify-center py-12 text-white/50 animate-pulse">
                                <Search className="w-5 h-5 mr-2" />
                                {t("datasetExplorer.scanning")}
                            </div>
                        )}
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm">
                                {error}
                            </div>
                        )}
                        {data && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                                        <div className="text-xs text-white/40 uppercase tracking-widest mb-1">
                                            {t("datasetExplorer.occurrencesFound")}
                                        </div>
                                        <div className="text-2xl font-mono text-emerald-400">{data.count}</div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                                        <div className="text-xs text-white/40 uppercase tracking-widest mb-1">
                                            {t("datasetExplorer.source")}
                                        </div>
                                        <div className="text-lg text-white/80">{data.source}</div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                        {t("datasetExplorer.contextSnippets")}
                                    </h4>
                                    <div className="space-y-3">
                                        {data.examples.map((snippet, idx) => (
                                            <NgramSnippet key={idx} snippet={snippet} />
                                        ))}
                                        {data.examples.length === 0 && (
                                            <div className="text-white/30 italic text-sm">
                                                {t("datasetExplorer.noExamples")}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── Bigram path: editorial-green, opens its own theme scope ───────────────
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    data-bigram-theme={theme}
                    role="dialog"
                    aria-modal="true"
                    aria-label={t("datasetExplorer.title")}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ fontFamily: "var(--font-source-serif)" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduce ? 0 : 0.22 }}
                    onClick={onClose}
                >
                    {/* scrim — calm, not pure black; lets the card sit as the single focal point */}
                    <div
                        className="absolute inset-0 backdrop-blur-[3px]"
                        style={{ background: "color-mix(in oklab, var(--bigram-bg-2) 78%, rgba(0,0,0,0.55))" }}
                    />

                    <motion.div
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-2xl max-h-[82vh] flex flex-col overflow-hidden bg-bigram-surface"
                        style={{
                            borderRadius: "var(--bigram-r-lg)",
                            border: "1px solid var(--bigram-rule-2)",
                            boxShadow:
                                "inset 0 1px 0 0 color-mix(in oklab, var(--bigram-ink) 7%, transparent), 0 36px 90px -38px rgba(0,0,0,0.7)",
                        }}
                        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.985 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.99 }}
                        transition={reduce ? { duration: 0 } : PANEL_SPRING}
                    >
                        <Header
                            context={displayContext}
                            next={nextChar}
                            title={t("datasetExplorer.title")}
                            onClose={onClose}
                        />

                        <div className="flex-1 overflow-y-auto px-7 py-7">
                            {loading && (
                                <div
                                    className="flex items-center justify-center gap-3 py-16 text-bigram-muted"
                                    style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                                >
                                    <Search className="w-4 h-4 animate-pulse text-bigram-accent" />
                                    <span className="text-[13px] tracking-[.14em] uppercase">
                                        {t("datasetExplorer.scanning")}
                                    </span>
                                </div>
                            )}

                            {error && !loading && (
                                <div
                                    className="px-5 py-4 text-[15px] text-bigram-wrong"
                                    style={{
                                        borderRadius: "var(--bigram-r-md)",
                                        background: "var(--bigram-wrong-soft)",
                                        border: "1px solid color-mix(in oklab, var(--bigram-wrong) 30%, transparent)",
                                    }}
                                >
                                    {error}
                                </div>
                            )}

                            {data && !loading && !error && (
                                <div className="space-y-8">
                                    <EvidenceFocus
                                        count={data.count}
                                        source={data.source}
                                        sourceLabel={t("datasetExplorer.source")}
                                        occurrencesLabel={t("datasetExplorer.occurrencesFound")}
                                        reduce={!!reduce}
                                    />

                                    <section>
                                        <SectionLabel text={t("datasetExplorer.contextSnippets")} />
                                        <div className="mt-4 space-y-2.5">
                                            {data.examples.map((snippet, idx) => (
                                                <BigramSnippet
                                                    key={idx}
                                                    snippet={snippet}
                                                    index={idx}
                                                    reduce={!!reduce}
                                                />
                                            ))}
                                            {data.examples.length === 0 && (
                                                <p
                                                    className="text-[15px] italic text-bigram-muted"
                                                    style={{ fontFamily: "var(--font-source-serif)" }}
                                                >
                                                    {t("datasetExplorer.noExamples")}
                                                </p>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
   Bigram sub-components (editorial-green)
   ───────────────────────────────────────────────────────────────────────── */

/** Header: editorial title + the literal bigram pair as the lede ("why did c → n get learned?"). */
function Header({
    context,
    next,
    title,
    onClose,
}: {
    context: string;
    next: string;
    title: string;
    onClose: () => void;
}) {
    return (
        <div
            className="flex items-start justify-between gap-4 px-7 pt-6 pb-5"
            style={{ borderBottom: "1px solid var(--bigram-rule)" }}
        >
            <div className="min-w-0">
                <div
                    className="text-[11px] font-medium uppercase text-bigram-accent-ink"
                    style={{ fontFamily: "var(--font-jetbrains-mono)", letterSpacing: ".2em" }}
                >
                    {title}
                </div>
                <h3
                    className="mt-2 flex items-baseline gap-2 text-bigram-ink"
                    style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "22px", fontWeight: 600 }}
                >
                    <span className="text-bigram-dim font-medium">{glyph(context)}</span>
                    <span className="text-bigram-dim text-[15px]" aria-hidden>→</span>
                    <span className="text-bigram-ink" style={{ fontWeight: 700 }}>{glyph(next)}</span>
                </h3>
            </div>
            <button
                onClick={onClose}
                className="flex-none grid place-items-center w-9 h-9 text-bigram-muted transition-colors hover:text-bigram-ink"
                style={{
                    borderRadius: "var(--bigram-r-sm)",
                    border: "1px solid var(--bigram-rule)",
                    background: "color-mix(in oklab, var(--bigram-ink) 3%, transparent)",
                }}
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

/** Mono uppercase section label + a trailing hairline rule (v8 vocabulary — no box). */
function SectionLabel({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3.5">
            <span
                className="text-[11px] font-medium uppercase text-bigram-muted"
                style={{ fontFamily: "var(--font-jetbrains-mono)", letterSpacing: ".18em" }}
            >
                {text}
            </span>
            <span className="flex-1 h-px" style={{ background: "var(--bigram-rule)" }} />
        </div>
    );
}

/**
 * The single focal point: the raw occurrence count, counted up, with the source as a quiet caption.
 * One big honest number — this is the evidence the model counted, not a normalized score.
 */
function EvidenceFocus({
    count,
    source,
    sourceLabel,
    occurrencesLabel,
    reduce,
}: {
    count: number;
    source: string;
    sourceLabel: string;
    occurrencesLabel: string;
    reduce: boolean;
}) {
    return (
        <div
            className="flex items-end justify-between gap-6 px-6 py-6"
            style={{
                borderRadius: "var(--bigram-r-md)",
                background: "var(--bigram-bg-2)",
                border: "1px solid var(--bigram-rule-2)",
            }}
        >
            <div>
                <div
                    className="text-[10.5px] font-medium uppercase text-bigram-muted"
                    style={{ fontFamily: "var(--font-jetbrains-mono)", letterSpacing: ".18em" }}
                >
                    {occurrencesLabel}
                </div>
                <div
                    className="mt-1.5 leading-none text-bigram-accent-bright"
                    style={{
                        fontFamily: "var(--font-jetbrains-mono)",
                        fontSize: "clamp(40px, 8vw, 56px)",
                        fontWeight: 600,
                        fontVariantNumeric: "lining-nums tabular-nums",
                    }}
                >
                    <CountUp value={count} reduce={reduce} />
                </div>
            </div>
            <div className="text-right">
                <div
                    className="text-[10.5px] font-medium uppercase text-bigram-dim"
                    style={{ fontFamily: "var(--font-jetbrains-mono)", letterSpacing: ".18em" }}
                >
                    {sourceLabel}
                </div>
                <div className="mt-1.5 text-[16px] text-bigram-body">{source}</div>
            </div>
        </div>
    );
}

/** Integer count-up (easeOutCubic ~620ms); reduced-motion shows the final value instantly. */
function CountUp({ value, reduce }: { value: number; reduce: boolean }) {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        // Reduced motion shows the final value instantly — no animation effect runs.
        if (reduce) return;
        let raf = 0;
        let t0: number | null = null;
        let cancelled = false;
        const frame = (now: number) => {
            if (cancelled) return;
            if (t0 === null) t0 = now;
            const k = Math.min(1, (now - t0) / COUNT_UP_MS);
            const eased = 1 - Math.pow(1 - k, 3);
            setDisplay(Math.round(value * eased));
            if (k < 1) raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
        return () => {
            cancelled = true;
            cancelAnimationFrame(raf);
        };
    }, [value, reduce]);

    return <span>{reduce ? value : display}</span>;
}

/**
 * Bigram corpus snippet. Snippet format is "pre[[match]]post". The matched pair is lifted by a
 * single calm sage lens (accent-soft fill) — the same "sliding lens" voice as the pair highlighter,
 * not a heavy neon pill. Staggered reveal so the evidence reads in sequence.
 */
function BigramSnippet({
    snippet,
    index,
    reduce,
}: {
    snippet: string;
    index: number;
    reduce: boolean;
}) {
    const { pre, match, post, valid } = useMemo(() => parseSnippet(snippet), [snippet]);

    const baseStyle = {
        fontFamily: "var(--font-jetbrains-mono)",
        borderRadius: "var(--bigram-r-sm)",
        background: "var(--bigram-bg)",
        border: "1px solid var(--bigram-rule)",
    } as const;

    const inner = !valid ? (
        <span className="text-bigram-muted">{snippet}</span>
    ) : (
        <>
            <span className="text-bigram-dim">{pre}</span>
            <span
                className="mx-px px-1 py-0.5 font-semibold text-bigram-accent-ink"
                style={{
                    borderRadius: "4px",
                    background: "var(--bigram-accent-soft)",
                    boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--bigram-accent) 26%, transparent)",
                }}
            >
                {match}
            </span>
            <span className="text-bigram-dim">{post}</span>
        </>
    );

    return (
        <motion.div
            className="px-3.5 py-3 text-[13px] leading-relaxed"
            style={baseStyle}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.34, ease: SNIPPET_EASE, delay: index * 0.05 }}
        >
            {inner}
        </motion.div>
    );
}

function parseSnippet(snippet: string): { pre: string; match: string; post: string; valid: boolean } {
    const parts = snippet.split("[[");
    if (parts.length !== 2) return { pre: snippet, match: "", post: "", valid: false };
    const matchParts = parts[1].split("]]");
    return { pre: parts[0], match: matchParts[0], post: matchParts[1] || "", valid: true };
}

/* ─────────────────────────────────────────────────────────────────────────
   N-Gram snippet (neutral lab styling, unchanged voice)
   ───────────────────────────────────────────────────────────────────────── */

function NgramSnippet({ snippet }: { snippet: string }) {
    const { pre, match, post, valid } = parseSnippet(snippet);
    if (!valid) {
        return <div className="font-mono text-xs text-white/60 bg-black/20 p-3 rounded">{snippet}</div>;
    }
    return (
        <div className="font-mono text-xs text-white/70 bg-black/20 p-3 rounded border border-white/5">
            <span className="opacity-50">{pre}</span>
            <span className="bg-indigo-500/30 text-indigo-200 font-bold px-1 rounded mx-0.5">{match}</span>
            <span className="opacity-50">{post}</span>
        </div>
    );
}
