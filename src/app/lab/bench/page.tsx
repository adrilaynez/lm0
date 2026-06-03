"use client";

/**
 * /lab/bench — dev-only widget bench for the Bigram chapter.
 *
 * Renders ONE visualizer in isolation so it can be SEEN and screenshotted reliably:
 *   • no LazySection (no IntersectionObserver to mount it)
 *   • no LabShell (no `useBackendHealth` → no "Server unreachable" banner saturating the render)
 *   • no backend calls
 *   • the [data-bigram-theme] scope + the project's --bigram-* tokens/fonts (already global from the
 *     root layout), and the same faint "Plane" surface the narrative uses.
 *
 * Usage:  /lab/bench?w=<slug>&theme=<light|dark>
 */

import { lazy, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const FillTheBlank = lazy(() => import("@/features/lab/components/FillTheBlank").then(m => ({ default: m.FillTheBlank })));
const HeroAutoComplete = lazy(() => import("@/features/lab/components/HeroAutoComplete").then(m => ({ default: m.HeroAutoComplete })));
const PairHighlighter = lazy(() => import("@/features/lab/components/PairHighlighter").then(m => ({ default: m.PairHighlighter })));
const IsolateT = lazy(() => import("@/features/lab/components/IsolateT").then(m => ({ default: m.IsolateT })));
const RowTally = lazy(() => import("@/features/lab/components/RowTally").then(m => ({ default: m.RowTally })));
const NormalizationVisualizer = lazy(() => import("@/features/lab/components/NormalizationVisualizer").then(m => ({ default: m.NormalizationVisualizer })));
const AlwaysMaxLoop = lazy(() => import("@/features/lab/components/AlwaysMaxLoop").then(m => ({ default: m.AlwaysMaxLoop })));
const LoadedDie = lazy(() => import("@/features/lab/components/LoadedDie").then(m => ({ default: m.LoadedDie })));
const TinyMatrixExample = lazy(() => import("@/features/lab/components/TinyMatrixExample").then(m => ({ default: m.TinyMatrixExample })));
const GrowingMatrix27 = lazy(() => import("@/features/lab/components/GrowingMatrix27").then(m => ({ default: m.GrowingMatrix27 })));
const DetectiveMatrix = lazy(() => import("@/features/lab/components/DetectiveMatrix").then(m => ({ default: m.DetectiveMatrix })));
const LetterByLetter = lazy(() => import("@/features/lab/components/LetterByLetter").then(m => ({ default: m.LetterByLetter })));
const TableWriter = lazy(() => import("@/features/lab/components/TableWriter").then(m => ({ default: m.TableWriter })));
const ContextBlindnessDemo = lazy(() => import("@/features/lab/components/ContextBlindnessDemo").then(m => ({ default: m.ContextBlindnessDemo })));
const ShannonContextLadder = lazy(() => import("@/features/lab/components/ShannonContextLadder").then(m => ({ default: m.ShannonContextLadder })));
const KitShowcase = lazy(() => import("@/features/lab/components/bigram/kit/KitShowcase").then(m => ({ default: m.KitShowcase })));

/* ─── N-gram chapter widgets (amber, [data-ngram-theme]) ─── */
const ContextWindow = lazy(() => import("@/features/lab/components/ngram/ContextWindow").then(m => ({ default: m.ContextWindow })));
const ContextCounter = lazy(() => import("@/features/lab/components/ngram/ContextCounter").then(m => ({ default: m.ContextCounter })));
const NgramBattle = lazy(() => import("@/features/lab/components/ngram/NgramBattle").then(m => ({ default: m.NgramBattle })));
const ContextExplosion = lazy(() => import("@/features/lab/components/ngram/ContextExplosion").then(m => ({ default: m.ContextExplosion })));
const SparsityView = lazy(() => import("@/features/lab/components/ngram/SparsityView").then(m => ({ default: m.SparsityView })));
const InfiniteTable = lazy(() => import("@/features/lab/components/ngram/InfiniteTable").then(m => ({ default: m.InfiniteTable })));

/** slug → { label, node, chapter }. Order here is the chapter order, for the picker. */
const WIDGETS: { slug: string; label: string; node: React.ReactNode; chapter?: "bigram" | "ngram" }[] = [
    { slug: "fill-the-blank", label: "VIS1 · FillTheBlank", node: <FillTheBlank /> },
    { slug: "hero-auto-complete", label: "VIS1.5 · HeroAutoComplete", node: <HeroAutoComplete /> },
    { slug: "pair-highlighter", label: "VIS2 · PairHighlighter", node: <PairHighlighter /> },
    { slug: "isolate-t", label: "VIS3 · IsolateT", node: <IsolateT /> },
    { slug: "row-tally", label: "VIS4 · RowTally", node: <RowTally /> },
    { slug: "normalization", label: "VIS5 · Normalization", node: <NormalizationVisualizer /> },
    { slug: "always-max-loop", label: "VIS6 · AlwaysMaxLoop", node: <AlwaysMaxLoop /> },
    { slug: "loaded-die", label: "VIS7 · LoadedDie", node: <LoadedDie /> },
    { slug: "tiny-matrix", label: "VIS8 · TinyMatrix", node: <TinyMatrixExample showCounts /> },
    { slug: "growing-matrix-27", label: "VIS9 · GrowingMatrix27", node: <GrowingMatrix27 /> },
    { slug: "detective-matrix", label: "VIS10 · DetectiveMatrix", node: <DetectiveMatrix /> },
    { slug: "letter-by-letter", label: "VIS10.5 · LetterByLetter", node: <LetterByLetter /> },
    { slug: "table-writer", label: "VIS11 · TableWriter", node: <TableWriter /> },
    { slug: "context-blindness", label: "— · ContextBlindness", node: <ContextBlindnessDemo /> },
    { slug: "shannon-ladder", label: "— · ShannonLadder", node: <ShannonContextLadder /> },
    { slug: "kit-showcase", label: "KIT · showcase", node: <KitShowcase /> },
    // ── N-gram (amber) ──
    { slug: "ng-context-window", label: "NG§1 · ContextWindow", node: <ContextWindow />, chapter: "ngram" },
    { slug: "ng-context-counter", label: "NG§2 · ContextCounter", node: <ContextCounter />, chapter: "ngram" },
    { slug: "ng-battle", label: "NG§3 · NgramBattle", node: <NgramBattle />, chapter: "ngram" },
    { slug: "ng-explosion", label: "NG§4 · ContextExplosion", node: <ContextExplosion />, chapter: "ngram" },
    { slug: "ng-sparsity", label: "NG§5a · SparsityView", node: <SparsityView />, chapter: "ngram" },
    { slug: "ng-infinite", label: "NG§5b · InfiniteTable", node: <InfiniteTable />, chapter: "ngram" },
];

const MONO = "var(--bigram-font-mono)";

function Bench() {
    const sp = useSearchParams();
    const theme = sp.get("theme") === "light" ? "light" : "dark";
    const otherTheme = theme === "light" ? "dark" : "light";
    const slug = sp.get("w") ?? WIDGETS[0].slug;
    const current = WIDGETS.find((w) => w.slug === slug);
    const chapter = current?.chapter ?? "bigram";

    // ?play=1 → auto-click the widget's primary button after mount, so a headless screenshot can
    // capture the BUILT/animated end-state (with a large --virtual-time-budget the animation fast-forwards).
    const autoplay = sp.get("play") === "1";
    useEffect(() => {
        if (!autoplay) return;
        const id = setTimeout(() => {
            const stage = document.querySelector("[data-bench-stage]");
            const btn = stage?.querySelector("button");
            if (btn instanceof HTMLButtonElement) btn.click();
        }, 600);
        return () => clearTimeout(id);
    }, [autoplay, slug]);

    return (
        <div
            data-bigram-theme={theme}
            data-ngram-theme={theme}
            style={{ minHeight: "100vh", background: `var(--${chapter}-bg)`, color: `var(--${chapter}-ink)` }}
        >
            <div className={`${chapter}-grain`} aria-hidden />
            <div style={{ position: "relative", zIndex: 1, maxWidth: 980, margin: "0 auto", padding: "26px 24px 96px" }}>
                {/* picker bar */}
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: 8,
                        paddingBottom: 18,
                        marginBottom: 6,
                        borderBottom: "1px solid var(--bigram-rule)",
                    }}
                >
                    <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--bigram-dim)", marginRight: 6 }}>
                        Bench
                    </span>
                    {WIDGETS.map((w) => {
                        const on = w.slug === slug;
                        return (
                            <a
                                key={w.slug}
                                href={`/lab/bench?w=${w.slug}&theme=${theme}`}
                                style={{
                                    fontFamily: MONO,
                                    fontSize: 11.5,
                                    textDecoration: "none",
                                    padding: "5px 10px",
                                    borderRadius: "var(--bigram-r-pill)",
                                    background: on ? "var(--bigram-accent)" : "color-mix(in oklab, var(--bigram-ink) 6%, transparent)",
                                    color: on ? "var(--bigram-on-accent)" : "var(--bigram-muted)",
                                }}
                            >
                                {w.label}
                            </a>
                        );
                    })}
                    <a
                        href={`/lab/bench?w=${slug}&theme=${otherTheme}`}
                        style={{
                            marginLeft: "auto",
                            fontFamily: MONO,
                            fontSize: 11.5,
                            textDecoration: "none",
                            padding: "5px 12px",
                            borderRadius: "var(--bigram-r-pill)",
                            background: "color-mix(in oklab, var(--bigram-accent) 14%, transparent)",
                            color: "var(--bigram-accent-ink)",
                        }}
                    >
                        ☼ {otherTheme}
                    </a>
                </div>

                {/* the Plane surface the narrative uses, so the widget reads exactly as in-page */}
                <div
                    data-bench-stage
                    style={{
                        padding: "32px 28px",
                        marginTop: 22,
                        borderRadius: `var(--${chapter}-r-md)`,
                        background: `color-mix(in oklab, var(--${chapter}-surface) 55%, var(--${chapter}-bg))`,
                    }}
                >
                    <Suspense
                        fallback={
                            <div style={{ textAlign: "center", padding: "64px 0", fontFamily: MONO, fontSize: 12, color: "var(--bigram-dim)" }}>
                                cargando…
                            </div>
                        }
                    >
                        {current ? current.node : <p style={{ fontFamily: MONO, color: "var(--bigram-muted)" }}>Widget «{slug}» no encontrado.</p>}
                    </Suspense>
                </div>
            </div>
        </div>
    );
}

export default function BenchPage() {
    return (
        <Suspense fallback={null}>
            <Bench />
        </Suspense>
    );
}
