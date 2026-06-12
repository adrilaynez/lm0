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

const FillTheBlank = lazy(() =>
  import("@/features/lab/components/FillTheBlank").then((m) => ({ default: m.FillTheBlank })),
);
const HeroAutoComplete = lazy(() =>
  import("@/features/lab/components/HeroAutoComplete").then((m) => ({
    default: m.HeroAutoComplete,
  })),
);
const PairHighlighter = lazy(() =>
  import("@/features/lab/components/PairHighlighter").then((m) => ({ default: m.PairHighlighter })),
);
const IsolateT = lazy(() =>
  import("@/features/lab/components/IsolateT").then((m) => ({ default: m.IsolateT })),
);
const RowTally = lazy(() =>
  import("@/features/lab/components/RowTally").then((m) => ({ default: m.RowTally })),
);
const NormalizationVisualizer = lazy(() =>
  import("@/features/lab/components/NormalizationVisualizer").then((m) => ({
    default: m.NormalizationVisualizer,
  })),
);
const AlwaysMaxLoop = lazy(() =>
  import("@/features/lab/components/AlwaysMaxLoop").then((m) => ({ default: m.AlwaysMaxLoop })),
);
const LoadedDie = lazy(() =>
  import("@/features/lab/components/LoadedDie").then((m) => ({ default: m.LoadedDie })),
);
const TinyMatrixExample = lazy(() =>
  import("@/features/lab/components/TinyMatrixExample").then((m) => ({
    default: m.TinyMatrixExample,
  })),
);
const GrowingMatrix27 = lazy(() =>
  import("@/features/lab/components/GrowingMatrix27").then((m) => ({ default: m.GrowingMatrix27 })),
);
const DetectiveMatrix = lazy(() =>
  import("@/features/lab/components/DetectiveMatrix").then((m) => ({ default: m.DetectiveMatrix })),
);
const LetterByLetter = lazy(() =>
  import("@/features/lab/components/LetterByLetter").then((m) => ({ default: m.LetterByLetter })),
);
const TableWriter = lazy(() =>
  import("@/features/lab/components/TableWriter").then((m) => ({ default: m.TableWriter })),
);
const ContextBlindnessDemo = lazy(() =>
  import("@/features/lab/components/ContextBlindnessDemo").then((m) => ({
    default: m.ContextBlindnessDemo,
  })),
);
const ShannonContextLadder = lazy(() =>
  import("@/features/lab/components/ShannonContextLadder").then((m) => ({
    default: m.ShannonContextLadder,
  })),
);
const KitShowcase = lazy(() =>
  import("@/features/lab/components/bigram/kit/KitShowcase").then((m) => ({
    default: m.KitShowcase,
  })),
);
const TrainBigramLab = lazy(() =>
  import("@/features/lab/components/bigram/TrainBigramLab").then((m) => ({
    default: m.TrainBigramLab,
  })),
);
const TrainNgramLab = lazy(() =>
  import("@/features/lab/components/ngram/TrainNgramLab").then((m) => ({
    default: m.TrainNgramLab,
  })),
);

/* ─── N-gram chapter widgets (amber, [data-ngram-theme]) ─── */
const ContextWindow = lazy(() =>
  import("@/features/lab/components/ngram/ContextWindow").then((m) => ({
    default: m.ContextWindow,
  })),
);
const ContextCounter = lazy(() =>
  import("@/features/lab/components/ngram/ContextCounter").then((m) => ({
    default: m.ContextCounter,
  })),
);
const NgramBattle = lazy(() =>
  import("@/features/lab/components/ngram/NgramBattle").then((m) => ({ default: m.NgramBattle })),
);
const ContextExplosion = lazy(() =>
  import("@/features/lab/components/ngram/ContextExplosion").then((m) => ({
    default: m.ContextExplosion,
  })),
);
const SparsityView = lazy(() =>
  import("@/features/lab/components/ngram/SparsityView").then((m) => ({ default: m.SparsityView })),
);
const InfiniteTable = lazy(() =>
  import("@/features/lab/components/ngram/InfiniteTable").then((m) => ({
    default: m.InfiniteTable,
  })),
);
const UnseenContext = lazy(() =>
  import("@/features/lab/components/ngram/UnseenContext").then((m) => ({
    default: m.UnseenContext,
  })),
);
const TypoBreaker = lazy(() =>
  import("@/features/lab/components/ngram/TypoBreaker").then((m) => ({ default: m.TypoBreaker })),
);
const SimilarityBridge = lazy(() =>
  import("@/features/lab/components/ngram/SimilarityBridge").then((m) => ({
    default: m.SimilarityBridge,
  })),
);
/* ── N-gram v3 "La fila" widgets ── */
const WidenWindow = lazy(() =>
  import("@/features/lab/components/ngram/WidenWindow").then((m) => ({ default: m.WidenWindow })),
);
const SplitTheRow = lazy(() =>
  import("@/features/lab/components/ngram/SplitTheRow").then((m) => ({ default: m.SplitTheRow })),
);
const WriteFromMatrix = lazy(() =>
  import("@/features/lab/components/ngram/WriteFromMatrix").then((m) => ({
    default: m.WriteFromMatrix,
  })),
);
const RowSharpens = lazy(() =>
  import("@/features/lab/components/ngram/RowSharpens").then((m) => ({ default: m.RowSharpens })),
);
const GrowingTable = lazy(() =>
  import("@/features/lab/components/ngram/GrowingTable").then((m) => ({ default: m.GrowingTable })),
);
const LookWhatYouBuilt = lazy(() =>
  import("@/features/lab/components/ngram/LookWhatYouBuilt").then((m) => ({
    default: m.LookWhatYouBuilt,
  })),
);
const AmnesiaReplay = lazy(() =>
  import("@/features/lab/components/ngram/AmnesiaReplay").then((m) => ({
    default: m.AmnesiaReplay,
  })),
);
const ExplosionZoom = lazy(() =>
  import("@/features/lab/components/ngram/ExplosionZoom").then((m) => ({
    default: m.ExplosionZoom,
  })),
);
const BookFirehose = lazy(() =>
  import("@/features/lab/components/ngram/BookFirehose").then((m) => ({ default: m.BookFirehose })),
);
const MuteSlot = lazy(() =>
  import("@/features/lab/components/ngram/MuteSlot").then((m) => ({ default: m.MuteSlot })),
);
const Progression = lazy(() =>
  import("@/features/lab/components/ngram/Progression").then((m) => ({ default: m.Progression })),
);
const BigModelLimit = lazy(() =>
  import("@/features/lab/components/ngram/BigModelLimit").then((m) => ({
    default: m.BigModelLimit,
  })),
);
const EmptyMatrix = lazy(() =>
  import("@/features/lab/components/ngram/EmptyMatrix").then((m) => ({ default: m.EmptyMatrix })),
);
const WordsExplosion = lazy(() =>
  import("@/features/lab/components/ngram/WordsExplosion").then((m) => ({
    default: m.WordsExplosion,
  })),
);
/* ── N-gram v4 (new narrative) widgets ── */
const CountingPairs = lazy(() =>
  import("@/features/lab/components/ngram/CountingPairs").then((m) => ({
    default: m.CountingPairs,
  })),
);
const RowSummer = lazy(() =>
  import("@/features/lab/components/ngram/RowSummer").then((m) => ({ default: m.RowSummer })),
);
const EmptyVoid = lazy(() =>
  import("@/features/lab/components/ngram/EmptyVoid").then((m) => ({ default: m.EmptyVoid })),
);
const QuantumElephant = lazy(() =>
  import("@/features/lab/components/ngram/QuantumElephant").then((m) => ({
    default: m.QuantumElephant,
  })),
);

/** slug → { label, node, chapter }. Order here is the chapter order, for the picker. */
const WIDGETS: {
  slug: string;
  label: string;
  node: React.ReactNode;
  chapter?: "bigram" | "ngram";
}[] = [
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
  { slug: "bg-train", label: "LAB · TrainBigramLab", node: <TrainBigramLab /> },
  { slug: "ng-train", label: "LAB · TrainNgramLab", node: <TrainNgramLab />, chapter: "ngram" },
  // ── N-gram (amber) ──
  {
    slug: "ng-context-window",
    label: "NG§1 · ContextWindow",
    node: <ContextWindow />,
    chapter: "ngram",
  },
  {
    slug: "ng-context-counter",
    label: "NG§2 · ContextCounter",
    node: <ContextCounter />,
    chapter: "ngram",
  },
  { slug: "ng-battle", label: "NG§3 · NgramBattle", node: <NgramBattle />, chapter: "ngram" },
  {
    slug: "ng-explosion",
    label: "NG§4 · ContextExplosion",
    node: <ContextExplosion />,
    chapter: "ngram",
  },
  { slug: "ng-sparsity", label: "NG§5a · SparsityView", node: <SparsityView />, chapter: "ngram" },
  {
    slug: "ng-infinite",
    label: "NG§5b · InfiniteTable",
    node: <InfiniteTable />,
    chapter: "ngram",
  },
  { slug: "ng-unseen", label: "NG§6a · UnseenContext", node: <UnseenContext />, chapter: "ngram" },
  { slug: "ng-typo", label: "NG§6b · TypoBreaker", node: <TypoBreaker />, chapter: "ngram" },
  {
    slug: "ng-similarity",
    label: "NG§7 · SimilarityBridge",
    node: <SimilarityBridge />,
    chapter: "ngram",
  },
  // ── N-gram v3 "La fila" ──
  { slug: "ng-widen", label: "v3§1 · WidenWindow", node: <WidenWindow />, chapter: "ngram" },
  { slug: "ng-split", label: "v3§2 · SplitTheRow", node: <SplitTheRow />, chapter: "ngram" },
  {
    slug: "ng-write",
    label: "v3§3 · WriteFromMatrix",
    node: <WriteFromMatrix />,
    chapter: "ngram",
  },
  { slug: "ng-sharpen", label: "v3§2 · RowSharpens", node: <RowSharpens />, chapter: "ngram" },
  { slug: "ng-grow", label: "v3§2 · GrowingTable", node: <GrowingTable />, chapter: "ngram" },
  {
    slug: "ng-built",
    label: "v3§3 · LookWhatYouBuilt",
    node: <LookWhatYouBuilt />,
    chapter: "ngram",
  },
  { slug: "ng-amnesia", label: "v3§1 · AmnesiaReplay", node: <AmnesiaReplay />, chapter: "ngram" },
  { slug: "ng-zoom", label: "v3§4 · ExplosionZoom", node: <ExplosionZoom />, chapter: "ngram" },
  { slug: "ng-words", label: "v3§4 · WordsExplosion", node: <WordsExplosion />, chapter: "ngram" },
  { slug: "ng-firehose", label: "v3§4 · BookFirehose", node: <BookFirehose />, chapter: "ngram" },
  { slug: "ng-mute", label: "v3§5 · MuteSlot", node: <MuteSlot />, chapter: "ngram" },
  { slug: "ng-empty", label: "v3§5 · EmptyMatrix", node: <EmptyMatrix />, chapter: "ngram" },
  { slug: "ng-progress", label: "v3§6 · Progression", node: <Progression />, chapter: "ngram" },
  { slug: "ng-limit", label: "v3§6 · BigModelLimit", node: <BigModelLimit />, chapter: "ngram" },
  // ── N-gram v4 (new narrative) ──
  {
    slug: "ng-counting",
    label: "v4§2.1 · CountingPairs",
    node: <CountingPairs />,
    chapter: "ngram",
  },
  { slug: "ng-rowsummer", label: "v4§2.2 · RowSummer", node: <RowSummer />, chapter: "ngram" },
  { slug: "ng-void", label: "v4§4.2 · EmptyVoid", node: <EmptyVoid />, chapter: "ngram" },
  {
    slug: "ng-elephant",
    label: "v4§4.3 · QuantumElephant",
    node: <QuantumElephant />,
    chapter: "ngram",
  },
];

const MONO = "var(--bigram-font-mono)";

function Bench() {
  const sp = useSearchParams();
  const theme = sp.get("theme") === "light" ? "light" : "dark";
  const bare = sp.get("bare") === "1"; // ?bare=1 hides the picker bar → clean widget-only capture for the fresh-eyes gate
  const otherTheme = theme === "light" ? "dark" : "light";
  const slug = sp.get("w") ?? WIDGETS[0].slug;
  const current = WIDGETS.find((w) => w.slug === slug);
  const chapter = current?.chapter ?? "bigram";

  // ?play=1 → auto-click the widget's primary button after mount, so a headless screenshot can
  // capture the BUILT/animated end-state (with a large --virtual-time-budget the animation fast-forwards).
  const autoplay = sp.get("play") === "1";
  const clicks = Math.max(1, Math.min(6, parseInt(sp.get("clicks") ?? "1", 10) || 1));
  useEffect(() => {
    if (!autoplay) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    // click the PRIMARY action, not the first button (which is often a Tab/seed selector). `?clicks=N`
    // presses it N times so a capture can show a deeper interacted state (used it, not just initial).
    const PRIMARY =
      /escrib|gener|empez|\bpaso\b|añad|abrir|recorr|dejar|otra letra|construir|más hondo|caer|hondo|reproduc|jugar|play|ver la real/i;
    const clickPrimary = () => {
      const stage = document.querySelector("[data-bench-stage]");
      if (!stage) return;
      const btns = Array.from(stage.querySelectorAll("button")) as HTMLButtonElement[];
      const primary = btns.find((b) => PRIMARY.test(b.textContent ?? "")) ?? btns[0];
      primary?.click();
    };
    for (let i = 0; i < clicks; i++) timers.push(setTimeout(clickPrimary, 600 + i * 520));
    return () => timers.forEach(clearTimeout);
  }, [autoplay, clicks, slug]);

  return (
    <div
      data-bigram-theme={theme}
      data-ngram-theme={theme}
      style={{
        minHeight: "100vh",
        background: `var(--${chapter}-bg)`,
        color: `var(--${chapter}-ink)`,
      }}
    >
      <div className={`${chapter}-grain`} aria-hidden />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 980,
          margin: "0 auto",
          padding: "26px 24px 96px",
        }}
      >
        {/* picker bar */}
        {!bare && (
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
            <span
              style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                color: "var(--bigram-dim)",
                marginRight: 6,
              }}
            >
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
                    background: on
                      ? "var(--bigram-accent)"
                      : "color-mix(in oklab, var(--bigram-ink) 6%, transparent)",
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
        )}

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
              <div
                style={{
                  textAlign: "center",
                  padding: "64px 0",
                  fontFamily: MONO,
                  fontSize: 12,
                  color: "var(--bigram-dim)",
                }}
              >
                cargando…
              </div>
            }
          >
            {current ? (
              current.node
            ) : (
              <p style={{ fontFamily: MONO, color: "var(--bigram-muted)" }}>
                Widget «{slug}» no encontrado.
              </p>
            )}
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
