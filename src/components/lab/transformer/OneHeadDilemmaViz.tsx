"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  V27 — OneHeadDilemmaViz ⭐ (INTERACTIVE CHALLENGE)
  Premium: Attention web arcs + step buttons.
  Colors: cyan-400 (#22d3ee) + amber-400 (#fbbf24) + white.
*/

const SENTENCE = [
    "The", "professor", "who", "published", "the",
    "paper", "in", "Nature", "last", "year",
    "won", "the", "Nobel", "prize",
];

const PROF_IDX = 1;

const TARGETS = [
    { word: "published", idx: 3 },
    { word: "Nature", idx: 7 },
    { word: "year", idx: 9 },
    { word: "won", idx: 10 },
    { word: "prize", idx: 13 },
];

const INITIAL = [20, 20, 20, 20, 20];

function arcPath(from: { x: number; y: number }, to: { x: number; y: number }): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curve = Math.min(dist * 0.35, 65);
    const mx = (from.x + to.x) / 2;
    const my = Math.min(from.y, to.y) - curve;
    return `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
}

export function OneHeadDilemmaViz() {
    const [weights, setWeights] = useState(INITIAL);
    const [showHint, setShowHint] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

    useEffect(() => {
        timerRef.current = setTimeout(() => setShowHint(true), 20000);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, []);

    const handleStep = useCallback((idx: number, delta: number) => {
        setWeights(prev => {
            const next = [...prev];
            const newVal = Math.max(0, Math.min(80, next[idx] + delta));
            const diff = newVal - next[idx];
            next[idx] = newVal;
            const othersTotal = prev.reduce((s, w, i) => i !== idx ? s + w : s, 0);
            if (othersTotal > 0) {
                for (let i = 0; i < next.length; i++) {
                    if (i !== idx) next[i] = Math.max(0, Math.round(next[i] - (diff * prev[i] / othersTotal)));
                }
            }
            const total = next.reduce((a, b) => a + b, 0);
            if (total !== 100) {
                const mi = next.indexOf(Math.max(...next));
                next[mi] += 100 - total;
            }
            return next;
        });
        setAttempts(a => a + 1);
    }, []);

    const publishedW = weights[0];
    const wonW = weights[3];
    const bothHigh = publishedW >= 35 && wonW >= 35;

    const wordWeightMap = useMemo(() => {
        const m = new Map<number, number>();
        TARGETS.forEach((t, i) => m.set(t.idx, weights[i] / 100));
        return m;
    }, [weights]);

    return (
        <div className="py-8 sm:py-12 px-2 sm:px-4" style={{ minHeight: 360 }}>
            {/* ═══ Sentence + Arcs ═══ */}
            <div ref={containerRef} className="relative">
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ overflow: "visible", zIndex: 1 }}
                >
                    <defs>
                        <filter id="dilemma-glow">
                            <feGaussianBlur stdDeviation="2" result="b" />
                            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    </defs>
                    {positions.length === SENTENCE.length &&
                        TARGETS.map((t, ti) => {
                            const w = weights[ti] / 100;
                            if (w < 0.03) return null;
                            const from = positions[PROF_IDX];
                            const to = positions[t.idx];
                            if (!from || !to) return null;
                            const d = arcPath(from, to);
                            const op = Math.max(0.15, w * 0.85);
                            const sw = 0.8 + w * 3;
                            const strong = w >= 0.30;
                            const rgb = strong ? "251,191,36" : "34,211,238";
                            return (
                                <motion.path
                                    key={`a-${ti}`}
                                    d={d}
                                    fill="none"
                                    stroke={`rgba(${rgb},${op})`}
                                    strokeWidth={sw}
                                    strokeLinecap="round"
                                    filter="url(#dilemma-glow)"
                                    animate={{ d, strokeWidth: sw, stroke: `rgba(${rgb},${op})` }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                />
                            );
                        })}
                </svg>

                <div className="flex items-baseline gap-x-[0.3em] sm:gap-x-[0.4em] flex-wrap justify-center relative z-10 py-8 sm:py-12 leading-[2.4] sm:leading-[2.6]">
                    {SENTENCE.map((word, i) => {
                        const isProfessor = i === PROF_IDX;
                        const w = wordWeightMap.get(i) ?? 0;
                        const isTarget = wordWeightMap.has(i);
                        const strong = isTarget && w >= 0.25;
                        const isAmber = isTarget && w >= 0.30;

                        const color = isProfessor
                            ? "#67e8f9"
                            : isAmber
                                ? `rgba(251,191,36,${0.7 + w * 0.3})`
                                : strong
                                    ? `rgba(34,211,238,${0.6 + w * 0.6})`
                                    : isTarget
                                        ? `rgba(255,255,255,${0.4 + w * 1.2})`
                                        : "rgba(255,255,255,0.45)";

                        const textShadow = isProfessor
                            ? "0 0 12px rgba(34,211,238,0.25)"
                            : strong
                                ? `0 0 ${6 + w * 18}px rgba(${isAmber ? "251,191,36" : "34,211,238"},${(w * 0.35).toFixed(2)})`
                                : "none";

                        return (
                            <span
                                key={i}
                                ref={(el) => { wordRefs.current[i] = el; }}
                                className="relative select-none font-medium tracking-[-0.01em]"
                                style={{
                                    fontSize: "clamp(1rem, 2vw, 1.25rem)",
                                    color,
                                    textShadow,
                                    transition: "color 0.3s, text-shadow 0.35s",
                                }}
                            >
                                {isProfessor && (
                                    <span
                                        className="absolute -bottom-1 left-0 right-0 h-[1.5px] rounded-full pointer-events-none"
                                        style={{ background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.35), transparent)" }}
                                    />
                                )}
                                <span className="relative z-10">{word}</span>
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* ═══ Challenge ═══ */}
            <div className="max-w-sm mx-auto text-center mb-5">
                <p className="text-[13px] uppercase tracking-[0.2em] text-cyan-400/50 font-semibold mb-1">
                    Challenge
                </p>
                <p className="text-sm text-white/55 leading-relaxed">
                    Make <strong className="text-cyan-400">published</strong> and{" "}
                    <strong className="text-cyan-400">won</strong> both above 35%.
                </p>
            </div>

            {/* ═══ Weight controls ═══ */}
            <div className="max-w-xs mx-auto space-y-2">
                {TARGETS.map((t, i) => {
                    const w = weights[i];
                    const frac = w / 100;
                    const isAmber = frac >= 0.30;
                    const barColor = isAmber ? "#fbbf24" : "#22d3ee";

                    return (
                        <div key={t.word} className="flex items-center gap-2">
                            <span
                                className="w-16 text-right text-[13px] font-semibold shrink-0"
                                style={{ color: w >= 25 ? barColor : "rgba(255,255,255,0.4)" }}
                            >
                                {t.word}
                            </span>

                            <button
                                onClick={() => handleStep(i, -5)}
                                className="w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0 cursor-pointer text-white/30 hover:text-white/50 transition-colors"
                            >
                                −
                            </button>

                            <div
                                className="flex-1 h-3 rounded-full overflow-hidden"
                                style={{ background: "rgba(255,255,255,0.06)" }}
                            >
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{
                                        background: `linear-gradient(90deg, ${barColor}80, ${barColor}35)`,
                                    }}
                                    animate={{ width: `${(w / 80) * 100}%` }}
                                    transition={{ type: "spring", stiffness: 250, damping: 28 }}
                                />
                            </div>

                            <button
                                onClick={() => handleStep(i, 5)}
                                className="w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0 cursor-pointer text-white/30 hover:text-white/50 transition-colors"
                            >
                                +
                            </button>

                            <span
                                className="w-10 text-right text-sm font-mono font-bold shrink-0"
                                style={{ color: w >= 25 ? barColor : "rgba(255,255,255,0.35)" }}
                            >
                                {w}%
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* ═══ Feedback ═══ */}
            <AnimatePresence mode="wait">
                {bothHigh ? (
                    <motion.div
                        key="success"
                        className="max-w-sm mx-auto mt-6 px-4 py-3 text-center"
                        style={{
                            borderLeft: "2px solid rgba(251,191,36,0.4)",
                        }}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        <p className="text-sm text-amber-400/80 leading-relaxed">
                            You did it — but the other words are nearly zero.{" "}
                            <strong className="text-amber-400">One head can&apos;t attend to everything.</strong>
                        </p>
                    </motion.div>
                ) : attempts > 5 || showHint ? (
                    <motion.p
                        key="hint"
                        className="max-w-sm mx-auto mt-6 text-center text-sm text-white/45 leading-relaxed"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        Every boost starves the others. One set of weights ={" "}
                        <strong className="text-white/60">one compromise</strong>.
                    </motion.p>
                ) : (
                    <motion.p
                        key="try"
                        className="text-center text-[13px] text-white/35 mt-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        Adjust the weights — can you make both verbs score high?
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
