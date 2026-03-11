"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/*
  EmbeddingToArrowViz v3 — Vertical Step-by-Step

  Shows Word → Numbers → Vector as a vertical flow. NOTHING disappears —
  each stage builds on the previous. Two side-by-side columns flow top-to-bottom.

  Stage 1: Words appear (character stagger)
  Stage 2: Feature bars cascade in below
  Stage 3: Vector arrows draw at bottom

  All stages remain visible. Apple-quality sequential animation.
*/

/* ─── Types ─── */
interface Feature { label: string; value: number }
interface WordData { word: string; features: Feature[]; hex: string; arrow: [number, number] }
interface WordPair { label: string; hint: string; words: [WordData, WordData]; insight: string }

/* ─── Helpers ─── */
function hr(hex: string, a: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
}

function arrowPts(tx: number, ty: number): string {
    const len = Math.sqrt(tx * tx + ty * ty);
    if (len < 1) return "0,0 0,0 0,0";
    const nx = tx / len, ny = ty / len;
    const bx = tx - nx * 8, by = ty - ny * 8;
    const px = -ny * 3.5, py = nx * 3.5;
    return `${tx},${ty} ${bx + px},${by + py} ${bx - px},${by - py}`;
}

/* ─── Data ─── */
const PAIRS: WordPair[] = [
    {
        label: "Similar words",
        hint: "\"king\" and \"queen\" share many features",
        words: [
            {
                word: "king",
                features: [
                    { label: "royalty", value: 0.95 },
                    { label: "power", value: 0.85 },
                    { label: "male", value: 0.90 },
                    { label: "human", value: 0.80 },
                ],
                hex: "#22d3ee",
                arrow: [0.92, 0.40],
            },
            {
                word: "queen",
                features: [
                    { label: "royalty", value: 0.93 },
                    { label: "power", value: 0.80 },
                    { label: "male", value: 0.10 },
                    { label: "human", value: 0.82 },
                ],
                hex: "#fbbf24",
                arrow: [0.78, 0.55],
            },
        ],
        insight: "Similar features → similar arrows → high dot product!",
    },
    {
        label: "Related words",
        hint: "\"king\" and \"crown\" are related but different",
        words: [
            {
                word: "king",
                features: [
                    { label: "royalty", value: 0.95 },
                    { label: "power", value: 0.85 },
                    { label: "object", value: 0.05 },
                    { label: "wearable", value: 0.10 },
                ],
                hex: "#22d3ee",
                arrow: [0.92, 0.40],
            },
            {
                word: "crown",
                features: [
                    { label: "royalty", value: 0.88 },
                    { label: "power", value: 0.40 },
                    { label: "object", value: 0.90 },
                    { label: "wearable", value: 0.85 },
                ],
                hex: "#fbbf24",
                arrow: [0.50, 0.85],
            },
        ],
        insight: "Some features match, some don't → arrows partially aligned.",
    },
    {
        label: "Unrelated words",
        hint: "\"king\" and \"banana\" share almost nothing",
        words: [
            {
                word: "king",
                features: [
                    { label: "royalty", value: 0.95 },
                    { label: "power", value: 0.85 },
                    { label: "edible", value: 0.02 },
                    { label: "yellow", value: 0.05 },
                ],
                hex: "#22d3ee",
                arrow: [0.92, 0.40],
            },
            {
                word: "banana",
                features: [
                    { label: "royalty", value: 0.01 },
                    { label: "power", value: 0.02 },
                    { label: "edible", value: 0.95 },
                    { label: "yellow", value: 0.90 },
                ],
                hex: "#34d399",
                arrow: [-0.40, 0.90],
            },
        ],
        insight: "Completely different features → arrows point away → low dot product.",
    },
];

/* ─── Layout ─── */
const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1.0];
const SVG_SZ = 110;
const SVG_H = SVG_SZ / 2;
const SC = 42;

/* ─── Connector sub-component ─── */
function Connector({ hex, label, delay }: { hex: string; label: string; delay: number }) {
    return (
        <motion.div
            className="flex flex-col items-center my-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay }}
        >
            <motion.div
                className="w-px h-4"
                style={{ background: hr(hex, 0.12), transformOrigin: "top" }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.3, delay }}
            />
            <span className="text-[7px] text-white/10 uppercase tracking-[0.15em] mt-0.5">
                {label}
            </span>
        </motion.div>
    );
}

/* ─── Mini arrow SVG ─── */
function MiniArrow({ hex, arrow, delay }: { hex: string; arrow: [number, number]; delay: number }) {
    const tx = arrow[0] * SC;
    const ty = -arrow[1] * SC;
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, type: "spring", stiffness: 200, damping: 22 }}
        >
            <svg
                width={SVG_SZ}
                height={SVG_SZ}
                viewBox={`${-SVG_H} ${-SVG_H} ${SVG_SZ} ${SVG_SZ}`}
                className="block mx-auto"
            >
                {/* Subtle grid */}
                <circle cx={0} cy={0} r={SC * 0.6} fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
                <circle cx={0} cy={0} r={SC} fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
                <line x1={-SVG_H + 4} y1={0} x2={SVG_H - 4} y2={0} stroke="rgba(255,255,255,0.035)" strokeWidth="0.5" />
                <line x1={0} y1={-SVG_H + 4} x2={0} y2={SVG_H - 4} stroke="rgba(255,255,255,0.035)" strokeWidth="0.5" />
                <circle cx={0} cy={0} r={1.5} fill="rgba(255,255,255,0.06)" />

                {/* Glow trail */}
                <line x1={0} y1={0} x2={tx} y2={ty} stroke={hex} strokeWidth={8} strokeLinecap="round" opacity={0.05} />

                {/* Arrow line */}
                <motion.line
                    x1={0} y1={0} x2={tx} y2={ty}
                    stroke={hex} strokeWidth={2} strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.85 }}
                    transition={{ duration: 0.5, delay: delay + 0.1, ease: EASE }}
                />

                {/* Arrowhead */}
                <motion.polygon
                    points={arrowPts(tx, ty)}
                    fill={hex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    transition={{ delay: delay + 0.45 }}
                />

                {/* Tip dot */}
                <motion.circle
                    cx={tx} cy={ty} r={3.5}
                    fill={hex}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: delay + 0.5, type: "spring", stiffness: 300, damping: 18 }}
                />
            </svg>
        </motion.div>
    );
}

/* ─── Component ─── */
export function EmbeddingToArrowViz() {
    const [pairIdx, setPairIdx] = useState(0);
    const [stage, setStage] = useState(0); // 0=blank, 1=words, 2=features, 3=arrows
    const timers = useRef<number[]>([]);
    const pair = PAIRS[pairIdx];

    /* Start animation chain */
    const startAnim = () => {
        timers.current.forEach(clearTimeout);
        timers.current = [];
        setStage(0);
        timers.current.push(
            window.setTimeout(() => setStage(1), 80),
            window.setTimeout(() => setStage(2), 1100),
            window.setTimeout(() => setStage(3), 2500),
        );
    };

    useEffect(() => {
        startAnim();
        return () => timers.current.forEach(clearTimeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pairIdx]);

    const changePair = (i: number) => {
        timers.current.forEach(clearTimeout);
        timers.current = [];
        setStage(0);
        setPairIdx(i);
    };

    return (
        <div className="py-8 sm:py-12 px-2 sm:px-4">
            {/* ── Tab selector ── */}
            <div className="flex items-center justify-center gap-6 sm:gap-8 mb-2">
                {PAIRS.map((p, i) => {
                    const active = i === pairIdx;
                    return (
                        <motion.button
                            key={i}
                            onClick={() => changePair(i)}
                            className="relative pb-1.5 text-[13px] sm:text-sm font-medium cursor-pointer"
                            style={{ color: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)" }}
                            whileHover={{ color: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)" }}
                        >
                            {p.label}
                            {active && (
                                <motion.span
                                    className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full"
                                    style={{ background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent)" }}
                                    layoutId="etav3-tab"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* ── Hint ── */}
            <AnimatePresence mode="wait">
                <motion.p
                    key={`hint-${pairIdx}`}
                    className="text-center text-[11px] text-white/20 mb-6 sm:mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {pair.hint}
                </motion.p>
            </AnimatePresence>

            {/* ── Two-column vertical flow ── */}
            <div key={pairIdx} className="flex justify-center gap-5 sm:gap-8 md:gap-12 max-w-lg mx-auto">
                {pair.words.map((w, wi) => (
                    <div key={wi} className="flex-1 max-w-[210px] flex flex-col items-center">
                        {/* ▸ STAGE 1 — Word */}
                        {stage >= 1 && (
                            <>
                                <div className="flex items-baseline justify-center">
                                    {w.word.split("").map((char, ci) => (
                                        <motion.span
                                            key={ci}
                                            className="text-2xl sm:text-3xl font-bold tracking-tight"
                                            style={{ color: w.hex }}
                                            initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                            transition={{ delay: wi * 0.2 + ci * 0.05, duration: 0.4, ease: EASE }}
                                        >
                                            {char}
                                        </motion.span>
                                    ))}
                                </div>
                                <motion.div
                                    className="h-px mx-auto mt-1.5 rounded-full"
                                    style={{
                                        width: "60%",
                                        background: `linear-gradient(90deg, transparent, ${hr(w.hex, 0.2)}, transparent)`,
                                    }}
                                    initial={{ scaleX: 0, opacity: 0 }}
                                    animate={{ scaleX: 1, opacity: 1 }}
                                    transition={{ delay: wi * 0.2 + 0.4, duration: 0.4 }}
                                />
                            </>
                        )}

                        {/* ▸ Connector: word → features */}
                        {stage >= 2 && <Connector hex={w.hex} label="features" delay={wi * 0.1} />}

                        {/* ▸ STAGE 2 — Feature bars */}
                        {stage >= 2 && (
                            <div className="w-full space-y-1.5 px-0.5">
                                {w.features.map((f, fi) => {
                                    const hi = f.value >= 0.7;
                                    const d = 0.12 + wi * 0.1 + fi * 0.07;
                                    return (
                                        <motion.div
                                            key={fi}
                                            className="flex items-center gap-1.5"
                                            initial={{ opacity: 0, x: wi === 0 ? -8 : 8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: d, duration: 0.28, ease: EASE }}
                                        >
                                            <span
                                                className="text-[9px] sm:text-[10px] w-14 sm:w-16 text-right truncate font-medium"
                                                style={{ color: hi ? hr(w.hex, 0.6) : "rgba(255,255,255,0.18)" }}
                                            >
                                                {f.label}
                                            </span>
                                            <div className="flex-1 h-[5px] rounded-full bg-white/[0.025] overflow-hidden">
                                                <motion.div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        background: hi
                                                            ? `linear-gradient(90deg, ${hr(w.hex, 0.5)}, ${hr(w.hex, 0.12)})`
                                                            : `linear-gradient(90deg, ${hr(w.hex, 0.12)}, ${hr(w.hex, 0.02)})`,
                                                        boxShadow: hi ? `0 0 6px ${hr(w.hex, 0.1)}` : "none",
                                                    }}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${f.value * 100}%` }}
                                                    transition={{ duration: 0.5, delay: d + 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
                                                />
                                            </div>
                                            <motion.span
                                                className="text-[8px] font-mono w-6 text-right tabular-nums"
                                                style={{ color: hi ? hr(w.hex, 0.5) : "rgba(255,255,255,0.1)" }}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: d + 0.2 }}
                                            >
                                                {f.value.toFixed(2)}
                                            </motion.span>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}

                        {/* ▸ Connector: features → vector */}
                        {stage >= 3 && <Connector hex={w.hex} label="direction" delay={wi * 0.12} />}

                        {/* ▸ STAGE 3 — Vector arrow */}
                        {stage >= 3 && <MiniArrow hex={w.hex} arrow={w.arrow} delay={0.1 + wi * 0.15} />}
                    </div>
                ))}
            </div>

            {/* ── Stage progress dots ── */}
            <div className="flex items-center justify-center gap-2 mt-5 mb-2">
                {[1, 2, 3].map((s) => (
                    <motion.div
                        key={s}
                        className="rounded-full"
                        animate={{
                            width: stage === s ? 16 : 6,
                            height: 6,
                            background: stage === s
                                ? "rgba(34,211,238,0.5)"
                                : stage > s
                                    ? "rgba(34,211,238,0.15)"
                                    : "rgba(255,255,255,0.08)",
                        }}
                        transition={{ duration: 0.35, ease: EASE }}
                    />
                ))}
            </div>

            {/* ── Insight ── */}
            {stage >= 3 && (
                <motion.p
                    className="text-center text-[12px] sm:text-[13px] text-white/30 max-w-md mx-auto leading-relaxed"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                >
                    {pair.insight}
                </motion.p>
            )}

            {/* ── Replay ── */}
            {stage >= 3 && (
                <motion.div
                    className="flex justify-center mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                >
                    <button
                        onClick={startAnim}
                        className="text-[10px] text-white/20 hover:text-white/40 cursor-pointer transition-colors"
                    >
                        ↺ replay
                    </button>
                </motion.div>
            )}
        </div>
    );
}
