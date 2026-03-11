"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  V32 — MultiHeadPipelineViz ⭐ FLAGSHIP
  Interactive multi-step pipeline: Input → 4 Heads → Blend → Concatenate.
  Shows how multi-head attention processes a sentence end-to-end.
  Each word has a unique color; attention arcs use source word's color.
  Hover interactions reveal attention patterns and color origins.
  All text ≥ 13px. No infinite animations. No expensive filters.
*/

type Stage = "input" | "heads" | "blend" | "concat";

const WORDS = [
    "The", "king", "who", "wore", "the",
    "golden", "crown", "ruled", "the", "vast", "kingdom", "wisely",
];

const N = WORDS.length;

/* ── Unique color per word via HSL ── */
const WORD_HUES = [210, 45, 280, 175, 310, 55, 25, 220, 150, 95, 0, 260];

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

const WORD_RGB: [number, number, number][] = WORD_HUES.map(h => hslToRgb(h, 0.5, 0.55));
const WORD_CSS = WORD_RGB.map(([r, g, b]) => `rgb(${r},${g},${b})`);

const HEAD_NAMES = ["Syntax", "Meaning", "Position", "Identity"];
const HEAD_ACCENTS = ["#22d3ee", "#fbbf24", "#34d399", "#a78bfa"];

/* ── Build normalized attention matrix from sparse connections ── */
function buildWeights(conns: [number, number, number][]): number[][] {
    const w = Array.from({ length: N }, () => Array(N).fill(0.012));
    for (const [f, t, s] of conns) w[f][t] = Math.max(w[f][t], s);
    for (let i = 0; i < N; i++) {
        const s = w[i].reduce((a: number, b: number) => a + b, 0);
        if (s > 0) for (let j = 0; j < N; j++) w[i][j] /= s;
    }
    return w;
}

const HEAD_WEIGHTS: number[][][] = [
    /* Syntax: subject→verb, det→noun, relative pronoun */
    buildWeights([
        [0, 1, 0.55], [1, 3, 0.32], [1, 7, 0.35], [2, 1, 0.45], [2, 3, 0.28],
        [3, 6, 0.45], [3, 1, 0.18], [4, 5, 0.22], [4, 6, 0.50], [5, 6, 0.55],
        [6, 3, 0.32], [7, 1, 0.38], [7, 10, 0.35], [8, 9, 0.25], [8, 10, 0.50],
        [9, 10, 0.40], [10, 7, 0.38], [11, 7, 0.50],
    ]),
    /* Meaning: semantic/conceptual links */
    buildWeights([
        [1, 6, 0.35], [1, 10, 0.35], [1, 7, 0.20], [3, 6, 0.30], [3, 5, 0.22],
        [5, 6, 0.50], [5, 1, 0.15], [6, 1, 0.40], [6, 5, 0.30], [7, 10, 0.42],
        [7, 11, 0.28], [7, 1, 0.18], [9, 10, 0.35], [10, 1, 0.38], [10, 7, 0.30],
        [11, 7, 0.45], [11, 10, 0.22],
    ]),
    /* Position: local/adjacent context */
    buildWeights([
        [0, 1, 0.50], [1, 0, 0.28], [1, 2, 0.42], [2, 1, 0.32], [2, 3, 0.40],
        [3, 2, 0.22], [3, 4, 0.35], [4, 3, 0.28], [4, 5, 0.40], [5, 4, 0.22],
        [5, 6, 0.50], [6, 5, 0.38], [6, 7, 0.22], [7, 6, 0.18], [7, 8, 0.35],
        [8, 7, 0.22], [8, 9, 0.40], [9, 8, 0.22], [9, 10, 0.45], [10, 9, 0.32],
        [10, 11, 0.35], [11, 10, 0.50],
    ]),
    /* Identity: self-attention + some spread */
    buildWeights([
        [0, 0, 0.50], [1, 1, 0.50], [1, 10, 0.10], [2, 2, 0.50], [3, 3, 0.50],
        [3, 6, 0.08], [4, 4, 0.50], [5, 5, 0.50], [5, 6, 0.10], [6, 6, 0.50],
        [6, 1, 0.08], [7, 7, 0.50], [7, 10, 0.08], [8, 8, 0.50], [9, 9, 0.50],
        [10, 10, 0.50], [10, 1, 0.08], [11, 11, 0.50], [11, 7, 0.08],
    ]),
];

/* ── Color blending: attention-weighted mix of word colors ── */
function blendForWord(wi: number, hi: number): {
    rgb: [number, number, number];
    top: { idx: number; w: number }[];
} {
    const raw = HEAD_WEIGHTS[hi][wi];
    /* Sharpen with pow(2) so dominant colors stand out */
    const sharp = raw.map(w => w * w);
    const sum = sharp.reduce((a, b) => a + b, 0);
    let r = 0, g = 0, b = 0;
    for (let j = 0; j < N; j++) {
        const s = sharp[j] / sum;
        r += s * WORD_RGB[j][0];
        g += s * WORD_RGB[j][1];
        b += s * WORD_RGB[j][2];
    }
    const top = raw
        .map((w, i) => ({ idx: i, w }))
        .sort((a, b) => b.w - a.w)
        .slice(0, 3);
    return { rgb: [Math.round(r), Math.round(g), Math.round(b)], top };
}

/* ── Arc path (quadratic bezier, curves above words) ── */
function arcPath(
    from: { x: number; y: number },
    to: { x: number; y: number },
): string {
    const dx = to.x - from.x;
    const dist = Math.abs(dx);
    const curve = Math.min(dist * 0.35, 55);
    const mx = (from.x + to.x) / 2;
    const my = Math.min(from.y, to.y) - curve;
    return `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
}

/* ═══════════════════════════════════════════════════════════
   HeadArcPanel — one head with all arcs visible
   Hover any word to highlight its outgoing attention.
   ═══════════════════════════════════════════════════════════ */
function HeadArcPanel({
    headIdx,
    hoveredWord,
    onHoverWord,
    onLeave,
}: {
    headIdx: number;
    hoveredWord: number | null;
    onHoverWord: (i: number) => void;
    onLeave: () => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);

    const measure = useCallback(() => {
        if (!containerRef.current) return;
        const cRect = containerRef.current.getBoundingClientRect();
        setPositions(
            wordRefs.current.map((el) => {
                if (!el) return { x: 0, y: 0 };
                const r = el.getBoundingClientRect();
                return { x: r.left + r.width / 2 - cRect.left, y: r.top + r.height / 2 - cRect.top };
            })
        );
    }, []);

    useEffect(() => {
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [measure]);

    const weights = HEAD_WEIGHTS[headIdx];
    const accent = HEAD_ACCENTS[headIdx];

    /* Pre-compute visible arcs */
    const arcs = useMemo(() => {
        const list: { from: number; to: number; w: number }[] = [];
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                if (i === j) continue;
                if (weights[i][j] < 0.05) continue;
                list.push({ from: i, to: j, w: weights[i][j] });
            }
        }
        return list;
    }, [weights]);

    return (
        <motion.div
            className="px-3 py-3"
            style={{ borderLeft: `2px solid ${accent}50` }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: headIdx * 0.08, duration: 0.4 }}
        >
            <p
                className="text-[13px] uppercase tracking-[0.15em] font-semibold mb-1"
                style={{ color: accent }}
            >
                {HEAD_NAMES[headIdx]}
            </p>

            <div ref={containerRef} className="relative">
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ overflow: "visible", zIndex: 1 }}
                >
                    {positions.length === N &&
                        arcs.map(({ from: fi, to: ti, w }) => {
                            const pFrom = positions[fi];
                            const pTo = positions[ti];
                            if (!pFrom || !pTo) return null;

                            const isFromHovered = hoveredWord === fi;
                            const dimmed = hoveredWord !== null && !isFromHovered;
                            const baseOp = 0.06 + w * 0.2;
                            const opacity = dimmed ? baseOp * 0.12 : isFromHovered ? 0.2 + w * 0.65 : baseOp;
                            const sw = dimmed ? 0.3 : isFromHovered ? 0.6 + w * 3.5 : 0.3 + w * 1.2;
                            const [r, g, b] = WORD_RGB[fi];

                            return (
                                <path
                                    key={`${fi}-${ti}`}
                                    d={arcPath(pFrom, pTo)}
                                    fill="none"
                                    stroke={`rgba(${r},${g},${b},${opacity})`}
                                    strokeWidth={sw}
                                    strokeLinecap="round"
                                    style={{ transition: "stroke 0.2s, stroke-width 0.2s" }}
                                />
                            );
                        })}
                </svg>

                <div
                    className="flex items-baseline gap-x-[0.2em] flex-wrap justify-center relative z-10 py-5 leading-[2.2]"
                    onMouseLeave={onLeave}
                >
                    {WORDS.map((word, i) => {
                        const isHovered = hoveredWord === i;
                        return (
                            <span
                                key={i}
                                ref={(el) => { wordRefs.current[i] = el; }}
                                className="relative cursor-pointer select-none font-medium"
                                style={{
                                    fontSize: "clamp(0.815rem, 1.3vw, 0.95rem)",
                                    color: isHovered ? WORD_CSS[i] : `${WORD_CSS[i]}`,
                                    opacity: hoveredWord !== null && !isHovered ? 0.35 : 1,
                                    textShadow: isHovered ? `0 0 10px ${WORD_CSS[i]}` : "none",
                                    transition: "opacity 0.2s, text-shadow 0.2s",
                                }}
                                onMouseEnter={() => {
                                    onHoverWord(i);
                                    requestAnimationFrame(measure);
                                }}
                            >
                                {word}
                            </span>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════════
   BlendPanel — shows blended word colors per head
   Hover to see where each word's new color comes from.
   ═══════════════════════════════════════════════════════════ */
function BlendPanel({
    headIdx,
    hoveredWord,
    onHoverWord,
    onLeave,
}: {
    headIdx: number;
    hoveredWord: number | null;
    onHoverWord: (i: number) => void;
    onLeave: () => void;
}) {
    const accent = HEAD_ACCENTS[headIdx];
    const blends = useMemo(
        () => WORDS.map((_, wi) => blendForWord(wi, headIdx)),
        [headIdx],
    );

    return (
        <motion.div
            className="px-3 py-3"
            style={{ borderLeft: `2px solid ${accent}50` }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: headIdx * 0.08, duration: 0.4 }}
        >
            <p
                className="text-[13px] uppercase tracking-[0.15em] font-semibold mb-1"
                style={{ color: accent }}
            >
                {HEAD_NAMES[headIdx]}
            </p>

            <div
                className="flex items-center gap-x-[0.25em] flex-wrap justify-center py-3 leading-[2.6]"
                onMouseLeave={onLeave}
            >
                {WORDS.map((word, i) => {
                    const { rgb } = blends[i];
                    const isHovered = hoveredWord === i;
                    const color = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;

                    return (
                        <motion.span
                            key={i}
                            className="cursor-pointer select-none font-semibold"
                            style={{
                                fontSize: "clamp(0.815rem, 1.3vw, 0.95rem)",
                                color,
                                opacity: hoveredWord !== null && !isHovered ? 0.4 : 1,
                                textShadow: isHovered ? `0 0 10px ${color}` : "none",
                                transition: "opacity 0.2s, text-shadow 0.2s",
                            }}
                            onMouseEnter={() => onHoverWord(i)}
                            animate={{ scale: isHovered ? 1.06 : 1 }}
                            transition={{ duration: 0.2 }}
                        >
                            {word}
                        </motion.span>
                    );
                })}
            </div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════════
   ConcatRow — final concatenated output from all 4 heads
   Hover to see each head's contribution.
   ═══════════════════════════════════════════════════════════ */
function ConcatRow({
    hoveredWord,
    onHoverWord,
    onLeave,
}: {
    hoveredWord: number | null;
    onHoverWord: (i: number) => void;
    onLeave: () => void;
}) {
    const concatColors = useMemo(() =>
        WORDS.map((_, wi) => {
            let r = 0, g = 0, b = 0;
            for (let hi = 0; hi < 4; hi++) {
                const { rgb } = blendForWord(wi, hi);
                r += rgb[0]; g += rgb[1]; b += rgb[2];
            }
            return [Math.round(r / 4), Math.round(g / 4), Math.round(b / 4)] as [number, number, number];
        }),
        []);

    return (
        <motion.div
            className="py-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div
                className="flex items-center gap-x-[0.3em] flex-wrap justify-center leading-[3]"
                onMouseLeave={onLeave}
            >
                {WORDS.map((word, i) => {
                    const rgb = concatColors[i];
                    const isHovered = hoveredWord === i;
                    const color = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;

                    return (
                        <motion.span
                            key={i}
                            className="cursor-pointer select-none font-semibold"
                            style={{
                                fontSize: "clamp(1rem, 2vw, 1.25rem)",
                                color,
                                opacity: hoveredWord !== null && !isHovered ? 0.4 : 1,
                                textShadow: isHovered ? `0 0 14px ${color}` : "none",
                                transition: "opacity 0.2s, text-shadow 0.2s",
                            }}
                            onMouseEnter={() => onHoverWord(i)}
                            animate={{ scale: isHovered ? 1.06 : 1 }}
                            transition={{ duration: 0.2 }}
                        >
                            {word}
                        </motion.span>
                    );
                })}
            </div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════════
   Main Component — stage orchestrator
   ═══════════════════════════════════════════════════════════ */
export function MultiHeadPipelineViz() {
    const [stage, setStage] = useState<Stage>("input");
    const [hoveredWord, setHoveredWord] = useState<number | null>(null);

    const handleHover = useCallback((i: number) => setHoveredWord(i), []);
    const handleLeave = useCallback(() => setHoveredWord(null), []);

    const nextStage = () => {
        setHoveredWord(null);
        if (stage === "input") setStage("heads");
        else if (stage === "heads") setStage("blend");
        else if (stage === "blend") setStage("concat");
    };

    const reset = () => {
        setHoveredWord(null);
        setStage("input");
    };

    const buttonLabel =
        stage === "input" ? "Split into 4 Heads →"
            : stage === "heads" ? "Blend Attention →"
                : stage === "blend" ? "Concatenate All →"
                    : null;

    const stageLabels: { key: Stage; label: string }[] = [
        { key: "input", label: "Input" },
        { key: "heads", label: "4 Heads" },
        { key: "blend", label: "Blend" },
        { key: "concat", label: "Concat" },
    ];

    const stageIdx = stageLabels.findIndex(s => s.key === stage);

    /* Shared insight panel data — replaces per-word tooltips */
    const hoverInsight = useMemo(() => {
        if (hoveredWord === null || (stage !== "blend" && stage !== "concat")) return null;
        return Array.from({ length: 4 }, (_, hi) => {
            const { top } = blendForWord(hoveredWord, hi);
            return { head: HEAD_NAMES[hi], accent: HEAD_ACCENTS[hi], source: WORDS[top[0].idx], pct: Math.round(top[0].w * 100) };
        });
    }, [hoveredWord, stage]);

    const caption =
        stage === "input"
            ? "Each word starts with its own unique color. Watch what happens when 4 attention heads process this sentence."
            : stage === "heads"
                ? "Each head sees different connections. Hover any word to highlight its attention pattern."
                : stage === "blend"
                    ? "Each head mixed word colors according to its attention. Hover any word."
                    : "All 4 heads concatenated into one representation per word. Hover any word.";

    return (
        <div className="py-6 sm:py-8 px-2 sm:px-4" style={{ minHeight: 360 }}>
            {/* ── Stage progress ── */}
            <div className="flex items-center justify-center gap-1.5 mb-5">
                {stageLabels.map((s, i) => (
                    <div key={s.key} className="flex items-center gap-1.5">
                        {i > 0 && (
                            <div
                                className="w-5 h-px"
                                style={{
                                    background: stageIdx >= i
                                        ? "rgba(34,211,238,0.3)"
                                        : "rgba(255,255,255,0.06)",
                                }}
                            />
                        )}
                        <span
                            className="text-[13px] font-semibold"
                            style={{
                                color: stage === s.key
                                    ? "#22d3ee"
                                    : stageIdx > i
                                        ? "rgba(34,211,238,0.4)"
                                        : "rgba(255,255,255,0.2)",
                            }}
                        >
                            {s.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* ── Stage content ── */}
            <AnimatePresence mode="wait">
                {/* ═══ Input ═══ */}
                {stage === "input" && (
                    <motion.div
                        key="input"
                        className="text-center"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35 }}
                    >
                        <div className="flex items-baseline gap-x-[0.35em] flex-wrap justify-center py-10 leading-[2.4]">
                            {WORDS.map((word, i) => (
                                <motion.span
                                    key={i}
                                    className="font-semibold select-none"
                                    style={{
                                        fontSize: "clamp(1.05rem, 2.2vw, 1.4rem)",
                                        color: WORD_CSS[i],
                                    }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04, duration: 0.3 }}
                                >
                                    {word}
                                </motion.span>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ═══ 4 Heads with arcs ═══ */}
                {stage === "heads" && (
                    <motion.div
                        key="heads"
                        className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-w-4xl mx-auto"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.4 }}
                    >
                        {Array.from({ length: 4 }, (_, hi) => (
                            <HeadArcPanel
                                key={hi}
                                headIdx={hi}
                                hoveredWord={hoveredWord}
                                onHoverWord={handleHover}
                                onLeave={handleLeave}
                            />
                        ))}
                    </motion.div>
                )}

                {/* ═══ Blend ═══ */}
                {stage === "blend" && (
                    <motion.div
                        key="blend"
                        className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-w-4xl mx-auto"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.4 }}
                    >
                        {Array.from({ length: 4 }, (_, hi) => (
                            <BlendPanel
                                key={hi}
                                headIdx={hi}
                                hoveredWord={hoveredWord}
                                onHoverWord={handleHover}
                                onLeave={handleLeave}
                            />
                        ))}
                    </motion.div>
                )}

                {/* ═══ Concat ═══ */}
                {stage === "concat" && (
                    <motion.div
                        key="concat"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.4 }}
                    >
                        <ConcatRow
                            hoveredWord={hoveredWord}
                            onHoverWord={handleHover}
                            onLeave={handleLeave}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Action buttons ── */}
            <div className="flex items-center justify-center gap-3 mt-5">
                {buttonLabel && (
                    <motion.button
                        onClick={nextStage}
                        className="px-5 py-2 text-[14px] font-semibold rounded-lg cursor-pointer transition-all"
                        style={{
                            background: "rgba(34,211,238,0.08)",
                            border: "1.5px solid rgba(34,211,238,0.25)",
                            color: "#22d3ee",
                        }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        {buttonLabel}
                    </motion.button>
                )}
                {stage !== "input" && (
                    <button
                        onClick={reset}
                        className="px-3 py-2 text-[13px] text-white/30 hover:text-white/50 transition-colors cursor-pointer"
                    >
                        ← Reset
                    </button>
                )}
            </div>

            {/* ── Shared insight (replaces per-word tooltips) ── */}
            <AnimatePresence mode="wait">
                {hoverInsight && hoveredWord !== null ? (
                    <motion.div
                        key={`insight-${hoveredWord}`}
                        className="mt-4 max-w-xl mx-auto"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        <p className="text-[13px] text-white/45 text-center leading-relaxed">
                            <strong className="text-cyan-400">&quot;{WORDS[hoveredWord]}&quot;</strong>
                            <span className="text-white/20 mx-1.5">&larr;</span>
                            {hoverInsight.map((h, i) => (
                                <span key={h.head}>
                                    {i > 0 && <span className="text-white/15 mx-1">&middot;</span>}
                                    <span style={{ color: h.accent }} className="font-semibold">{h.head}</span>
                                    <span className="text-white/25">: {h.source} </span>
                                    <span className="text-white/20 font-mono">{h.pct}%</span>
                                </span>
                            ))}
                        </p>
                    </motion.div>
                ) : (
                    <motion.p
                        key={`caption-${stage}`}
                        className="text-center text-[13px] text-white/35 mt-4 max-w-lg mx-auto leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {caption}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
