"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  V35 — WaveFingerprintViz — Complete rebuild v2
  
  Concept: Each position gets a unique "fingerprint" of wave values.
  6 sine/cosine waves at geometrically increasing frequencies,
  sampled at a position to produce a unique combination of values.
  
  Design: Premium, calm, dark-mode. One focal point at a time.
  Waves are clean, smooth sinusoids. Fingerprint is a clear bar chart.
  Comparison is intuitive: slider picks primary, click picks compare.
*/

const NUM_WAVES = 6;
const MAX_POS = 50;

/*
  Period-doubling progression (shifted so Adjacent is readable):
  Wave 0: period = 4 positions  (~12.5 cycles across 50 — clearly fast)
  Wave 1: period = 8 positions  (~6 cycles — phrase level)
  Wave 2: period = 16 positions (clause level)
  Wave 3: period = 32 positions (paragraph level)
  Wave 4: period = 64 positions (section level — < 1 full cycle)
  Wave 5: period = 128 positions (chapter level — barely curves)
  Angular freq = 2π / period
*/
const WAVES: { freq: number; label: string; period: number; width: number; opacity: number }[] = [
    { freq: Math.PI / 2, label: "Adjacent", period: 4, width: 2.4, opacity: 0.90 },
    { freq: Math.PI / 4, label: "Phrase", period: 8, width: 2.1, opacity: 0.80 },
    { freq: Math.PI / 8, label: "Clause", period: 16, width: 1.9, opacity: 0.70 },
    { freq: Math.PI / 16, label: "Paragraph", period: 32, width: 1.7, opacity: 0.60 },
    { freq: Math.PI / 32, label: "Section", period: 64, width: 1.5, opacity: 0.50 },
    { freq: Math.PI / 64, label: "Chapter", period: 128, width: 1.4, opacity: 0.42 },
];

function waveValue(pos: number, idx: number): number {
    return Math.cos(pos * WAVES[idx].freq);
}

function fingerprint(pos: number): number[] {
    return WAVES.map((_, i) => waveValue(pos, i));
}

/*
  Similarity: use D=64 proper sinusoidal encoding (like PositionalSimilarityViz)
  for accurate distance-based decay. The 6 visual waves are pedagogical samples.
*/
const SIM_D = 64;
function fullEncoding(pos: number): number[] {
    return Array.from({ length: SIM_D }, (_, i) => {
        const freq = 1 / Math.pow(10000, (2 * Math.floor(i / 2)) / SIM_D);
        return i % 2 === 0 ? Math.sin(pos * freq) : Math.cos(pos * freq);
    });
}
function cosineSimilarity(posA: number, posB: number): number {
    const a = fullEncoding(posA);
    const b = fullEncoding(posB);
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-8);
}

/* ── SVG layout ── */
const SVG_W = 720;
const LABEL_W = 90;
const WAVE_AREA_W = SVG_W - LABEL_W;
const WAVE_H = 42;
const WAVE_GAP = 10;
const TOP_PAD = 6;
const TOTAL_H = TOP_PAD + NUM_WAVES * (WAVE_H + WAVE_GAP) - WAVE_GAP + 6;

/* ── Fingerprint bar layout ── */
const FP_BAR_H = 22;

export function WaveFingerprintViz() {
    const [selectedPos, setSelectedPos] = useState(5);
    const [comparePos, setComparePos] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const fp = useMemo(() => fingerprint(selectedPos), [selectedPos]);
    const fpCmp = useMemo(
        () => (comparePos !== null ? fingerprint(comparePos) : null),
        [comparePos]
    );
    const similarity = useMemo(() => {
        if (comparePos === null) return null;
        return cosineSimilarity(selectedPos, comparePos);
    }, [selectedPos, comparePos]);

    const handleSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedPos(Number(e.target.value));
    }, []);

    const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const xRatio = (e.clientX - rect.left) / rect.width;
        const xInSvg = xRatio * SVG_W;
        /* Only register clicks inside the wave drawing area */
        if (xInSvg < LABEL_W || xInSvg > SVG_W) return;
        const pos = Math.round(((xInSvg - LABEL_W) / WAVE_AREA_W) * MAX_POS);
        const clamped = Math.max(0, Math.min(MAX_POS, pos));
        if (clamped !== selectedPos) {
            setComparePos(prev => prev === clamped ? null : clamped);
        }
    }, [selectedPos]);

    /* Map a position (0-50) to x coordinate in the wave area */
    const posToX = (pos: number) => LABEL_W + (pos / MAX_POS) * WAVE_AREA_W;

    return (
        <div className="py-8 sm:py-10 px-3 sm:px-6">
            {/* ═══ Header ═══ */}
            <div className="max-w-[720px] mx-auto mb-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-3">
                        <span className="text-[16px] font-mono font-bold text-cyan-400">
                            Position {selectedPos}
                        </span>
                        <AnimatePresence mode="wait">
                            {comparePos !== null && (
                                <motion.span
                                    key="cmp"
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -8 }}
                                    className="text-[15px] font-mono"
                                >
                                    <span className="text-white/20 mx-1">vs</span>
                                    <span className="font-bold text-amber-400">{comparePos}</span>
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                    <AnimatePresence>
                        {similarity !== null && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                                style={{
                                    background: similarity > 0.7
                                        ? "rgba(34,211,238,0.1)"
                                        : similarity > 0.3
                                            ? "rgba(255,255,255,0.04)"
                                            : "rgba(251,191,36,0.08)",
                                    border: `1px solid ${similarity > 0.7
                                        ? "rgba(34,211,238,0.2)"
                                        : similarity > 0.3
                                            ? "rgba(255,255,255,0.08)"
                                            : "rgba(251,191,36,0.15)"}`,
                                }}
                            >
                                <span className="text-[13px] text-white/40">Similarity</span>
                                <span className={`text-[16px] font-mono font-bold ${similarity > 0.7 ? "text-cyan-400" : similarity > 0.3 ? "text-white/60" : "text-amber-400"}`}>
                                    {(similarity * 100).toFixed(0)}%
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ═══ Slider ═══ */}
            <div className="max-w-[720px] mx-auto mb-4">
                <input
                    type="range"
                    min={0}
                    max={MAX_POS}
                    value={selectedPos}
                    onChange={handleSlider}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(90deg, rgba(34,211,238,0.5) ${(selectedPos / MAX_POS) * 100}%, rgba(255,255,255,0.06) ${(selectedPos / MAX_POS) * 100}%)`,
                        accentColor: "#22d3ee",
                    }}
                />
                <div className="flex justify-between mt-1">
                    <span className="text-[13px] font-mono text-white/25">0</span>
                    <span className="text-[13px] font-mono text-white/25">{MAX_POS}</span>
                </div>
            </div>

            {/* ═══ Waves SVG ═══ */}
            <div className="max-w-[720px] mx-auto mb-8">
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${SVG_W} ${TOTAL_H}`}
                    className="w-full cursor-crosshair"
                    style={{ maxHeight: 480 }}
                    onClick={handleSvgClick}
                >
                    {WAVES.map((wave, wIdx) => {
                        const y0 = TOP_PAD + wIdx * (WAVE_H + WAVE_GAP);
                        const midY = y0 + WAVE_H / 2;
                        const amp = (WAVE_H / 2) - 4;

                        /* Build wave path at ~1px resolution */
                        let pathD = "";
                        const steps = WAVE_AREA_W;
                        for (let s = 0; s <= steps; s++) {
                            const x = LABEL_W + s;
                            const pos = (s / steps) * MAX_POS;
                            const val = Math.cos(pos * wave.freq);
                            const py = midY - val * amp;
                            pathD += s === 0 ? `M${x},${py.toFixed(1)}` : `L${x},${py.toFixed(1)}`;
                        }

                        /* Marker positions */
                        const mX = posToX(selectedPos);
                        const mVal = waveValue(selectedPos, wIdx);
                        const mY = midY - mVal * amp;

                        return (
                            <g key={wIdx}>
                                {/* Label */}
                                <text
                                    x={LABEL_W - 12}
                                    y={midY + 1}
                                    textAnchor="end"
                                    dominantBaseline="middle"
                                    fontSize={13}
                                    fontWeight={600}
                                    fill={`rgba(34,211,238,${wave.opacity})`}
                                    fontFamily="ui-sans-serif, system-ui, sans-serif"
                                >
                                    {wave.label}
                                </text>

                                {/* Midline */}
                                <line
                                    x1={LABEL_W} y1={midY} x2={SVG_W} y2={midY}
                                    stroke="rgba(255,255,255,0.04)" strokeWidth={1}
                                />

                                {/* Wave path */}
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke={`rgba(34,211,238,${wave.opacity})`}
                                    strokeWidth={wave.width}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />

                                {/* Primary marker — cyan dot ON the wave */}
                                <circle
                                    cx={mX} cy={mY} r={5.5}
                                    fill="#22d3ee"
                                    stroke="rgba(34,211,238,0.35)" strokeWidth={3}
                                />

                                {/* Compare marker — amber dot */}
                                {comparePos !== null && (() => {
                                    const cx = posToX(comparePos);
                                    const cv = waveValue(comparePos, wIdx);
                                    const cy = midY - cv * amp;
                                    return (
                                        <circle
                                            cx={cx} cy={cy} r={5.5}
                                            fill="#fbbf24"
                                            stroke="rgba(251,191,36,0.35)" strokeWidth={3}
                                        />
                                    );
                                })()}
                            </g>
                        );
                    })}

                    {/* Vertical guide — primary (cyan) */}
                    <line
                        x1={posToX(selectedPos)} y1={0}
                        x2={posToX(selectedPos)} y2={TOTAL_H}
                        stroke="rgba(34,211,238,0.15)" strokeWidth={1}
                        strokeDasharray="3,5"
                    />

                    {/* Vertical guide — compare (amber) */}
                    {comparePos !== null && (
                        <line
                            x1={posToX(comparePos)} y1={0}
                            x2={posToX(comparePos)} y2={TOTAL_H}
                            stroke="rgba(251,191,36,0.15)" strokeWidth={1}
                            strokeDasharray="3,5"
                        />
                    )}
                </svg>
            </div>

            {/* ═══ Fingerprint ═══ */}
            <div className="max-w-[580px] mx-auto">
                <p className="text-[13px] uppercase tracking-[0.14em] text-white/30 font-semibold text-center mb-5">
                    {comparePos !== null
                        ? "Wave values — side by side"
                        : `Position ${selectedPos} fingerprint`
                    }
                </p>

                <div className="space-y-2">
                    {WAVES.map((wave, i) => {
                        const val = fp[i];
                        const cmpVal = fpCmp ? fpCmp[i] : null;
                        /* Bar width: value ranges -1 to +1, mapped to 0-50% from center */
                        const barPct = Math.abs(val) * 48;
                        const cmpBarPct = cmpVal !== null ? Math.abs(cmpVal) * 48 : 0;

                        return (
                            <div key={wave.label} className="flex items-center gap-3">
                                {/* Label */}
                                <span className="w-[76px] text-right text-[13px] text-white/35 font-medium shrink-0">
                                    {wave.label}
                                </span>

                                {/* Bar chart area */}
                                <div className="flex-1 relative" style={{ height: cmpVal !== null ? FP_BAR_H * 2 + 3 : FP_BAR_H }}>
                                    {/* Primary bar */}
                                    <div
                                        className="absolute left-0 right-0 rounded-md overflow-hidden"
                                        style={{ height: FP_BAR_H, top: 0, background: "rgba(255,255,255,0.025)" }}
                                    >
                                        {/* Center line */}
                                        <div
                                            className="absolute top-0 bottom-0 w-px"
                                            style={{ left: "50%", background: "rgba(255,255,255,0.08)" }}
                                        />
                                        {/* Bar */}
                                        <motion.div
                                            className="absolute top-1 bottom-1 rounded-sm"
                                            style={{
                                                background: `rgba(34,211,238,${0.35 + Math.abs(val) * 0.45})`,
                                                boxShadow: Math.abs(val) > 0.7
                                                    ? "0 0 8px rgba(34,211,238,0.2)"
                                                    : "none",
                                                ...(val >= 0
                                                    ? { left: "50%" }
                                                    : { right: "50%" }),
                                            }}
                                            initial={false}
                                            animate={{ width: `${barPct}%` }}
                                            transition={{ type: "spring", stiffness: 220, damping: 22 }}
                                        />
                                    </div>

                                    {/* Compare bar (only shown when comparing) */}
                                    {cmpVal !== null && (
                                        <div
                                            className="absolute left-0 right-0 rounded-md overflow-hidden"
                                            style={{ height: FP_BAR_H, top: FP_BAR_H + 3, background: "rgba(255,255,255,0.025)" }}
                                        >
                                            <div
                                                className="absolute top-0 bottom-0 w-px"
                                                style={{ left: "50%", background: "rgba(255,255,255,0.08)" }}
                                            />
                                            <motion.div
                                                className="absolute top-1 bottom-1 rounded-sm"
                                                style={{
                                                    background: `rgba(251,191,36,${0.35 + Math.abs(cmpVal) * 0.45})`,
                                                    boxShadow: Math.abs(cmpVal) > 0.7
                                                        ? "0 0 8px rgba(251,191,36,0.2)"
                                                        : "none",
                                                    ...(cmpVal >= 0
                                                        ? { left: "50%" }
                                                        : { right: "50%" }),
                                                }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${cmpBarPct}%` }}
                                                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Values */}
                                <div className="w-[52px] shrink-0 text-right">
                                    <div className="text-[13px] font-mono font-bold text-cyan-400/80 leading-tight">
                                        {val >= 0 ? "+" : ""}{val.toFixed(2)}
                                    </div>
                                    {cmpVal !== null && (
                                        <div className="text-[13px] font-mono font-bold text-amber-400/80 leading-tight mt-0.5">
                                            {cmpVal >= 0 ? "+" : ""}{cmpVal.toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ═══ Quick compare buttons ═══ */}
            <div className="max-w-[580px] mx-auto mt-6 flex flex-wrap items-center justify-center gap-2">
                {[1, 3, 10, 25].map(offset => {
                    const target = selectedPos + offset;
                    if (target > MAX_POS) return null;
                    const active = comparePos === target;
                    return (
                        <motion.button
                            key={offset}
                            onClick={() => setComparePos(active ? null : target)}
                            whileTap={{ scale: 0.96 }}
                            className="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors"
                            style={{
                                background: active
                                    ? "rgba(251,191,36,0.12)"
                                    : "rgba(255,255,255,0.03)",
                                border: active
                                    ? "1px solid rgba(251,191,36,0.3)"
                                    : "1px solid rgba(255,255,255,0.07)",
                                color: active ? "#fbbf24" : "rgba(255,255,255,0.4)",
                            }}
                        >
                            +{offset} away
                        </motion.button>
                    );
                })}

                {/* Clear */}
                <AnimatePresence>
                    {comparePos !== null && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={() => setComparePos(null)}
                            className="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors ml-1"
                            style={{
                                background: "rgba(251,191,36,0.06)",
                                border: "1px solid rgba(251,191,36,0.15)",
                                color: "rgba(251,191,36,0.6)",
                            }}
                        >
                            Clear
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* ═══ Caption ═══ */}
            <p className="max-w-md mx-auto mt-5 text-center text-[14px] text-white/40 leading-relaxed">
                {comparePos !== null
                    ? Math.abs(comparePos - selectedPos) <= 3
                        ? "Close positions share similar wave readings — their fingerprints nearly match."
                        : "Distant positions produce completely different wave patterns — unique fingerprints."
                    : "Each position has a unique combination of wave values. Click the waves or use the buttons to compare two positions."
                }
            </p>
        </div>
    );
}
