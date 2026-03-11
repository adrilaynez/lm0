"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ATTENTION } from "./SpotlightViz";

/*
  ContextAssemblyFilmViz — §04 capstone (v2)
  Direct continuation of SpotlightViz + QueryKeyRelationsViz.
  Click a word → attention arcs → "Transport Values" → particles flow → contextual output.
  Fully interactive, no panels, premium editorial feel.
*/

const WORDS = ["The", "king", "who", "wore", "the", "golden", "crown", "ruled", "the", "vast", "kingdom", "wisely"];
const FEAT = ["royalty", "action", "object", "quality"];

/* 5 feature bars shown in the inspector — before and after attention */
const INSPECTOR_FEATURES = ["royalty", "action", "object", "quality", "context"];

/* Per-word "before" feature values — these are the static word embeddings */
const BEFORE_FEATURES: Record<number, number[]> = {
    0: [0.05, 0.05, 0.05, 0.10, 0.08],  /* The    */
    1: [0.85, 0.20, 0.15, 0.12, 0.10],  /* king   */
    2: [0.10, 0.05, 0.08, 0.05, 0.06],  /* who    */
    3: [0.12, 0.75, 0.20, 0.15, 0.10],  /* wore   */
    4: [0.05, 0.05, 0.05, 0.10, 0.08],  /* the    */
    5: [0.20, 0.10, 0.15, 0.90, 0.12],  /* golden */
    6: [0.65, 0.10, 0.85, 0.25, 0.12],  /* crown  */
    7: [0.20, 0.88, 0.12, 0.10, 0.14],  /* ruled  */
    8: [0.05, 0.05, 0.05, 0.10, 0.08],  /* the    */
    9: [0.15, 0.08, 0.12, 0.78, 0.10],  /* vast   */
    10: [0.80, 0.12, 0.72, 0.18, 0.15],  /* kingdom*/
    11: [0.12, 0.10, 0.08, 0.72, 0.12],  /* wisely */
};

/* "After" values are computed by blending — but we also have hand-crafted per-word targets */
const AFTER_FEATURES: Record<number, number[]> = {
    1: [0.92, 0.55, 0.40, 0.70, 0.85],  /* king — gets crown, ruled, kingdom context */
    6: [0.78, 0.30, 0.90, 0.65, 0.80],  /* crown — gets royalty context */
    7: [0.55, 0.92, 0.35, 0.45, 0.78],  /* ruled — gets king context */
    10: [0.88, 0.38, 0.80, 0.55, 0.82],  /* kingdom — gets royalty context */
};

/* ─── Feature Inspector sub-component ─── */
function FeatureInspector({ active, phase }: { active: number; phase: string }) {
    const before = BEFORE_FEATURES[active] ?? [0.2, 0.2, 0.2, 0.2, 0.2];
    const after = AFTER_FEATURES[active] ?? before.map(v => Math.min(1, v + 0.25));
    const isAssembled = phase === "assembled";
    const isTransporting = phase === "transporting";
    const cyanRgb = "34, 211, 238";
    const amberRgb = "251, 191, 36";

    return (
        <motion.div
            className="max-w-sm mx-auto space-y-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            {/* Word label */}
            <p className="text-center text-[10px] uppercase tracking-widest font-semibold text-white/50">
                Embedding of &ldquo;{WORDS[active]}&rdquo;
            </p>

            {/* Feature rows — before | label | after */}
            <div className="space-y-1">
                {INSPECTOR_FEATURES.map((feat, fi) => {
                    const bVal = before[fi];
                    const aVal = after[fi];
                    const changed = isAssembled && Math.abs(aVal - bVal) > 0.08;
                    const currentVal = isAssembled ? aVal : bVal;

                    return (
                        <div key={fi} className="grid items-center gap-2" style={{ gridTemplateColumns: "46px 1fr 28px" }}>
                            <span className="text-[9px] font-medium text-white/50 text-right truncate">
                                {feat}
                            </span>
                            <div className="relative h-[6px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                                {/* Before bar (ghost) — always shows as faint reference */}
                                {isAssembled && (
                                    <div
                                        className="absolute inset-y-0 left-0 rounded-full"
                                        style={{
                                            width: `${bVal * 100}%`,
                                            background: `rgba(${cyanRgb}, 0.3)`,
                                        }}
                                    />
                                )}
                                {/* Active bar */}
                                <motion.div
                                    className="absolute inset-y-0 left-0 rounded-full"
                                    animate={{ width: `${currentVal * 100}%` }}
                                    transition={isTransporting
                                        ? { duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94] }
                                        : { type: "spring", stiffness: 100, damping: 16 }
                                    }
                                    style={{
                                        background: isAssembled
                                            ? changed
                                                ? `linear-gradient(90deg, rgba(${amberRgb}, 0.6), rgba(${amberRgb}, 0.9))`
                                                : `rgba(${amberRgb}, 0.55)`
                                            : `rgba(${cyanRgb}, 0.6)`,
                                        boxShadow: changed ? `0 0 12px rgba(${amberRgb}, 0.35)` : "none",
                                    }}
                                />
                            </div>
                            <span
                                className="text-[9px] font-mono tabular-nums text-right"
                                style={{
                                    color: changed
                                        ? `rgba(${amberRgb}, 0.95)`
                                        : isAssembled
                                            ? `rgba(${amberRgb}, 0.6)`
                                            : "rgba(255,255,255,0.45)",
                                }}
                            >
                                {Math.round(currentVal * 100)}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Phase label */}
            <p className="text-[10px] text-center italic" style={{ color: isAssembled ? `rgba(${amberRgb}, 0.65)` : `rgba(${cyanRgb}, 0.55)` }}>
                {isAssembled
                    ? "Attention rewrote the embedding — different numbers, different meaning."
                    : "Before attention. These numbers will change."}
            </p>
        </motion.div>
    );
}

const V_VECTORS: number[][] = [
    [0.1, 0.0, 0.2, 0.0],
    [0.9, 0.2, 0.1, 0.1],
    [0.1, 0.0, 0.0, 0.0],
    [0.1, 0.8, 0.1, 0.0],
    [0.1, 0.0, 0.2, 0.0],
    [0.2, 0.1, 0.1, 0.9],
    [0.7, 0.1, 0.9, 0.2],
    [0.1, 0.9, 0.1, 0.1],
    [0.1, 0.0, 0.2, 0.0],
    [0.1, 0.0, 0.1, 0.8],
    [0.8, 0.1, 0.7, 0.1],
    [0.1, 0.1, 0.0, 0.8],
];

function computeOutput(focusIdx: number): number[] {
    const w = ATTENTION[focusIdx];
    return V_VECTORS[0].map((_, d) =>
        w.reduce((sum, wi, i) => sum + wi * V_VECTORS[i][d], 0)
    );
}

function arcPath(from: { x: number; y: number }, to: { x: number; y: number }): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.min(dist * 0.35, 70);
    const midX = (from.x + to.x) / 2;
    const midY = Math.min(from.y, to.y) - curvature;
    return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
}

/* Bezier interpolation for particle animation */
function bezierPoint(from: { x: number; y: number }, to: { x: number; y: number }, t: number) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.min(dist * 0.35, 70);
    const midX = (from.x + to.x) / 2;
    const midY = Math.min(from.y, to.y) - curvature;
    return {
        x: (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * midX + t * t * to.x,
        y: (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * midY + t * t * to.y,
    };
}

type Phase = "idle" | "selected" | "transporting" | "assembled";

export function ContextAssemblyFilmViz() {
    const [locked, setLocked] = useState<number | null>(null);
    const [hovered, setHovered] = useState<number | null>(null);
    const [phase, setPhase] = useState<Phase>("idle");
    const [transportT, setTransportT] = useState(0);
    const [inspectWord, setInspectWord] = useState<number | null>(null);
    const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const rafRef = useRef<number | null>(null);

    const active = locked ?? hovered;
    const isIdle = active === null;
    const weights = active !== null ? ATTENTION[active] : null;

    const output = useMemo(() => {
        if (active === null) return null;
        return computeOutput(active);
    }, [active]);

    const topTargets = useMemo(() => {
        if (!weights || active === null) return [];
        return weights
            .map((w, i) => ({ w, i }))
            .filter(d => d.i !== active)
            .sort((a, b) => b.w - a.w)
            .slice(0, 5);
    }, [weights, active]);

    /* Reset phase when word changes */
    useEffect(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setPhase(active !== null ? "selected" : "idle");
        setTransportT(0);
        setInspectWord(null);
    }, [active]);

    /* Measure word positions for SVG arcs */
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
        const t = setTimeout(measure, 300);
        window.addEventListener("resize", measure);
        return () => { window.removeEventListener("resize", measure); clearTimeout(t); };
    }, [measure]);

    /* Transport animation via requestAnimationFrame */
    const startTransport = useCallback(() => {
        setPhase("transporting");
        setTransportT(0);
        const start = performance.now();
        const duration = 1400;
        const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            setTransportT(progress);
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                setPhase("assembled");
            }
        };
        rafRef.current = requestAnimationFrame(tick);
    }, []);

    useEffect(() => {
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, []);

    return (
        <div className="py-6 sm:py-8 px-2 sm:px-4" style={{ minHeight: 380 }}>
            <div ref={containerRef} className="relative">
                {/* SVG arc + particle layer */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ overflow: "visible", zIndex: 1 }}
                >
                    <defs>
                        <filter id="caf2-glow">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <filter id="caf2-particle">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Attention arcs */}
                    <AnimatePresence>
                        {active !== null && positions.length === WORDS.length && weights &&
                            WORDS.map((_, toIdx) => {
                                if (toIdx === active) return null;
                                const w = weights[toIdx];
                                if (w < 0.04) return null;
                                const from = positions[active];
                                const to = positions[toIdx];
                                if (!from || !to) return null;
                                const path = arcPath(from, to);
                                const dimmed = phase === "assembled";
                                const opacity = dimmed
                                    ? Math.max(0.03, w * 0.35)
                                    : Math.max(0.06, w * 0.7);
                                const width = 0.5 + w * 2.5;
                                const arcRgb = w >= 0.30 ? "251, 191, 36" : "34, 211, 238";

                                return (
                                    <motion.path
                                        key={`arc-${active}-${toIdx}`}
                                        d={path}
                                        fill="none"
                                        stroke={`rgba(${arcRgb}, ${opacity})`}
                                        strokeWidth={width}
                                        strokeLinecap="round"
                                        filter="url(#caf2-glow)"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        exit={{ opacity: 0, transition: { duration: 0.2 } }}
                                        transition={{
                                            pathLength: { duration: 0.6, delay: toIdx * 0.03, ease: "easeOut" },
                                            opacity: { duration: 0.4, delay: toIdx * 0.03 },
                                        }}
                                    />
                                );
                            })
                        }
                    </AnimatePresence>

                    {/* Transport particles */}
                    {phase === "transporting" && active !== null && positions.length === WORDS.length && weights &&
                        WORDS.map((_, fromIdx) => {
                            if (fromIdx === active) return null;
                            const w = weights[fromIdx];
                            if (w < 0.04) return null;
                            const from = positions[fromIdx];
                            const to = positions[active];
                            if (!from || !to) return null;

                            const pt = bezierPoint(from, to, transportT);
                            const size = 2 + w * 6;
                            const isAmber = w >= 0.30;
                            const rgb = isAmber ? "251, 191, 36" : "34, 211, 238";
                            const alpha = transportT < 0.1
                                ? transportT / 0.1
                                : transportT > 0.85
                                    ? (1 - transportT) / 0.15
                                    : 1;

                            return (
                                <circle
                                    key={`p-${fromIdx}`}
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={size}
                                    fill={`rgba(${rgb}, ${(0.5 + w * 0.5) * alpha})`}
                                    filter="url(#caf2-particle)"
                                />
                            );
                        })
                    }
                </svg>

                {/* Sentence */}
                <div
                    className="flex items-baseline gap-x-[0.35em] sm:gap-x-[0.45em] flex-wrap justify-center relative z-10 py-10 sm:py-14 leading-[2.4] sm:leading-[2.6]"
                    onMouseLeave={() => { if (!locked) setHovered(null); }}
                >
                    {WORDS.map((word, i) => {
                        const isActive = active === i;
                        const isTarget = active !== null && weights !== null && i !== active;
                        const w = isTarget ? weights[i] : 0;
                        const isStrong = w > 0.10;
                        const isMedium = w > 0.05 && w <= 0.10;
                        const isAmber = isStrong && w >= 0.30;
                        const accentRgb = isAmber ? "251, 191, 36" : "34, 211, 238";
                        const glowRadius = isStrong ? Math.round(8 + w * 40) : 0;
                        const glowOpacity = isStrong ? (w * 0.6).toFixed(2) : "0";
                        const isContextual = phase === "assembled" && isActive;

                        const color = isContextual
                            ? "#fbbf24"
                            : isActive
                                ? "#67e8f9"
                                : isAmber
                                    ? `rgba(251, 191, 36, ${0.7 + w * 0.6})`
                                    : isStrong
                                        ? `rgba(165, 243, 252, ${0.6 + w * 0.8})`
                                        : isMedium
                                            ? "rgba(255, 255, 255, 0.45)"
                                            : active !== null && !isActive
                                                ? "rgba(255, 255, 255, 0.22)"
                                                : "rgba(255, 255, 255, 0.65)";

                        const textShadow = isContextual
                            ? "0 0 24px rgba(251, 191, 36, 0.5), 0 0 48px rgba(251, 191, 36, 0.2)"
                            : isActive
                                ? "0 0 20px rgba(34, 211, 238, 0.4), 0 0 40px rgba(34, 211, 238, 0.15)"
                                : isStrong
                                    ? `0 0 ${glowRadius}px rgba(${accentRgb}, ${glowOpacity})`
                                    : "none";

                        return (
                            <motion.span
                                key={i}
                                ref={(el) => { wordRefs.current[i] = el; }}
                                className="relative cursor-pointer select-none font-medium tracking-[-0.01em]"
                                style={{
                                    fontSize: "clamp(1.05rem, 2.2vw, 1.35rem)",
                                    color,
                                    textShadow,
                                    transition: "color 0.35s ease, text-shadow 0.4s ease",
                                }}
                                onMouseEnter={() => {
                                    if (locked === null) setHovered(i);
                                    requestAnimationFrame(measure);
                                }}
                                onClick={() => {
                                    if (locked === i) { setLocked(null); }
                                    else { setLocked(i); }
                                    requestAnimationFrame(measure);
                                }}
                                animate={{
                                    scale: isContextual ? 1.12 : isActive ? 1.08 : 1,
                                    y: isIdle ? [0, -1.5, 0] : 0,
                                }}
                                transition={
                                    isIdle
                                        ? { y: { duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut" }, scale: { duration: 0.3 } }
                                        : { duration: 0.3, ease: "easeOut" }
                                }
                            >
                                {isStrong && (
                                    <motion.span
                                        className="absolute inset-0 -inset-x-2 -inset-y-1 rounded-full pointer-events-none"
                                        style={{
                                            background: `radial-gradient(ellipse at center, rgba(${accentRgb}, ${(w * 0.18).toFixed(3)}) 0%, transparent 70%)`,
                                            filter: "blur(6px)",
                                        }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.4 }}
                                    />
                                )}

                                {isActive && (
                                    <motion.span
                                        className="absolute -bottom-1 left-0 right-0 h-[1.5px] rounded-full pointer-events-none"
                                        style={{
                                            background: isContextual
                                                ? "linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.5), transparent)"
                                                : "linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.5), transparent)",
                                        }}
                                        initial={{ scaleX: 0, opacity: 0 }}
                                        animate={{ scaleX: 1, opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}

                                {isContextual && (
                                    <motion.span
                                        className="absolute inset-0 -inset-x-3 -inset-y-2 rounded-full pointer-events-none"
                                        style={{
                                            background: "radial-gradient(ellipse at center, rgba(251, 191, 36, 0.12) 0%, transparent 70%)",
                                            filter: "blur(8px)",
                                        }}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: [0.5, 1, 0.5], scale: 1 }}
                                        transition={{ opacity: { duration: 2, repeat: Infinity }, scale: { duration: 0.4 } }}
                                    />
                                )}

                                <span className="relative z-10">{word}</span>
                            </motion.span>
                        );
                    })}
                </div>
            </div>

            {/* Feature Inspector — shown when word selected, transporting, or assembled */}
            <AnimatePresence>
                {active !== null && phase !== "idle" && (
                    <motion.div
                        key={`inspector-${active}`}
                        className="mt-4 mb-2"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        style={{ overflow: "hidden" }}
                    >
                        <FeatureInspector active={active} phase={phase} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Phase-dependent content below sentence */}
            <AnimatePresence mode="wait">
                {phase === "idle" && (
                    <motion.p
                        key="idle-hint"
                        className="text-center text-[13px] sm:text-sm text-white/40 mt-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    >
                        Click any word to see how it gathers context
                    </motion.p>
                )}

                {phase === "selected" && active !== null && topTargets.length > 0 && (
                    <motion.div
                        key={`selected-${active}`}
                        className="max-w-lg mx-auto mt-2 sm:mt-4 text-center"
                        initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -6, filter: "blur(4px)", transition: { duration: 0.15 } }}
                        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                        {/* Top targets ranking */}
                        <div className="flex items-center justify-center gap-x-4 gap-y-1 flex-wrap mb-4">
                            {topTargets.slice(0, 4).map(({ w, i }, rank) => {
                                const maxW = topTargets[0].w;
                                const rel = w / maxW;
                                const dotSize = Math.round(4 + rel * 4);
                                const isAmber = w >= 0.30;
                                const dotRgb = isAmber ? "251, 191, 36" : "34, 211, 238";
                                return (
                                    <motion.span
                                        key={i}
                                        className="inline-flex items-center gap-1.5"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 0.5 + rel * 0.4, scale: 1 }}
                                        transition={{ delay: rank * 0.06, duration: 0.3 }}
                                    >
                                        <span
                                            className="rounded-full shrink-0"
                                            style={{
                                                width: dotSize, height: dotSize,
                                                background: `rgba(${dotRgb}, ${(0.3 + rel * 0.5).toFixed(2)})`,
                                                boxShadow: rel > 0.5 ? `0 0 ${dotSize * 2}px rgba(${dotRgb}, 0.3)` : "none",
                                            }}
                                        />
                                        <span
                                            className="text-[13px] sm:text-sm font-medium"
                                            style={{ color: `rgba(255,255,255, ${(0.25 + rel * 0.4).toFixed(2)})` }}
                                        >
                                            {WORDS[i]}
                                        </span>
                                        <span className="text-[10px] font-mono text-white/25 tabular-nums">
                                            {Math.round(w * 100)}%
                                        </span>
                                    </motion.span>
                                );
                            })}
                        </div>

                        {/* Transport button */}
                        <motion.button
                            onClick={startTransport}
                            className="px-5 py-2 rounded-xl text-[13px] font-semibold border cursor-pointer"
                            style={{
                                background: "linear-gradient(135deg, rgba(251,191,36,0.10), rgba(251,191,36,0.03))",
                                borderColor: "rgba(251,191,36,0.25)",
                                color: "rgba(251,191,36,0.8)",
                                boxShadow: "0 0 20px -6px rgba(251,191,36,0.15)",
                            }}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.3 }}
                            whileHover={{ scale: 1.02, boxShadow: "0 0 24px -4px rgba(251,191,36,0.25)" }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {`Transport Values \u2192`}
                        </motion.button>
                    </motion.div>
                )}

                {phase === "transporting" && active !== null && (
                    <motion.div
                        key="transporting"
                        className="text-center mt-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <p className="text-[13px] text-white/30 italic">
                            Values flowing along attention arcs{"\u2026"}
                        </p>
                        <div className="max-w-xs mx-auto mt-3 h-[2px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                            <div
                                className="h-full rounded-full"
                                style={{
                                    width: `${transportT * 100}%`,
                                    background: "linear-gradient(90deg, rgba(34,211,238,0.5), rgba(251,191,36,0.6))",
                                    transition: "width 0.05s linear",
                                }}
                            />
                        </div>
                    </motion.div>
                )}

                {phase === "assembled" && active !== null && output && (
                    <AssembledPanel
                        active={active}
                        output={output}
                        weights={weights!}
                        topTargets={topTargets}
                        inspectWord={inspectWord}
                        setInspectWord={setInspectWord}
                        onBack={() => { setPhase("selected"); setInspectWord(null); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   ASSEMBLED PANEL — contextual output + composition
   ═══════════════════════════════════════════════════════════ */

function AssembledPanel({
    active, output, weights, topTargets, inspectWord, setInspectWord, onBack,
}: {
    active: number;
    output: number[];
    weights: number[];
    topTargets: { w: number; i: number }[];
    inspectWord: number | null;
    setInspectWord: (i: number | null) => void;
    onBack: () => void;
}) {
    return (
        <motion.div
            key={`assembled-${active}`}
            className="max-w-lg mx-auto mt-2 sm:mt-4"
            initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(4px)", transition: { duration: 0.15 } }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            {/* Contextual output vector */}
            <div className="text-center mb-4">
                <p className="text-[10px] uppercase tracking-widest text-amber-400/60 font-semibold mb-2">
                    Contextual Representation
                </p>
                <div className="flex justify-center gap-1.5">
                    {output.map((v, d) => (
                        <motion.div
                            key={d}
                            className="flex flex-col items-center"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: d * 0.08 }}
                        >
                            <span className="text-[7px] text-white/25 mb-0.5">{FEAT[d]}</span>
                            <span
                                className="text-xs sm:text-sm font-mono font-bold px-2 py-1 rounded-lg"
                                style={{
                                    color: "rgba(251, 191, 36, 0.85)",
                                    background: "rgba(251, 191, 36, 0.06)",
                                }}
                            >
                                {v.toFixed(2)}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Composition breakdown */}
            <div className="text-center mb-3">
                <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-2">
                    Composed from
                </p>
                <div className="flex items-center justify-center gap-x-3 gap-y-1 flex-wrap">
                    {topTargets.map(({ w, i }, rank) => {
                        const maxW = topTargets[0].w;
                        const rel = w / maxW;
                        const isAmber = w >= 0.30;
                        const rgb = isAmber ? "251, 191, 36" : "34, 211, 238";
                        const isInspecting = inspectWord === i;

                        return (
                            <motion.button
                                key={i}
                                className="inline-flex items-center gap-1 cursor-pointer rounded-lg px-2 py-0.5 transition-colors"
                                style={{
                                    background: isInspecting ? `rgba(${rgb}, 0.08)` : "transparent",
                                    opacity: 0.5 + rel * 0.4,
                                }}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 0.5 + rel * 0.4, scale: 1 }}
                                transition={{ delay: 0.2 + rank * 0.05, duration: 0.3 }}
                                onClick={(e) => { e.stopPropagation(); setInspectWord(isInspecting ? null : i); }}
                            >
                                <span
                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                    style={{ background: `rgba(${rgb}, ${(0.4 + rel * 0.5).toFixed(2)})` }}
                                />
                                <span
                                    className="text-[12px] sm:text-[13px] font-medium"
                                    style={{ color: `rgba(255,255,255, ${(0.3 + rel * 0.4).toFixed(2)})` }}
                                >
                                    {WORDS[i]}
                                </span>
                                <span className="text-[9px] font-mono text-white/22 tabular-nums">
                                    {Math.round(w * 100)}%
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Inspect: V × weight = scaled contribution */}
            <AnimatePresence mode="wait">
                {inspectWord !== null && (
                    <motion.div
                        key={`inspect-${inspectWord}`}
                        className="max-w-sm mx-auto"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="pt-3 pb-1" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                            <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
                                {/* V vector */}
                                <div className="text-center">
                                    <div className="text-[8px] uppercase tracking-widest text-amber-400/50 font-semibold mb-1">
                                        V({WORDS[inspectWord]})
                                    </div>
                                    <div className="flex gap-0.5">
                                        {V_VECTORS[inspectWord].map((v, d) => (
                                            <span
                                                key={d}
                                                className="text-[10px] font-mono font-bold px-1 py-0.5 rounded"
                                                style={{ color: "rgba(251,191,36,0.7)", background: "rgba(251,191,36,0.05)" }}
                                            >
                                                {v.toFixed(1)}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <span className="text-white/15 text-sm font-light">{"\u00D7"}</span>
                                <span className="text-[12px] font-mono font-bold" style={{ color: "rgba(34,211,238,0.6)" }}>
                                    {Math.round(weights[inspectWord] * 100)}%
                                </span>

                                <span className="text-white/15 text-sm font-light">=</span>
                                <div className="flex gap-0.5">
                                    {V_VECTORS[inspectWord].map((v, d) => {
                                        const scaled = v * weights[inspectWord];
                                        return (
                                            <span
                                                key={d}
                                                className="text-[10px] font-mono font-bold px-1 py-0.5 rounded"
                                                style={{
                                                    color: scaled > 0.05 ? "rgba(52,211,153,0.8)" : "rgba(255,255,255,0.2)",
                                                    background: scaled > 0.05 ? "rgba(52,211,153,0.06)" : "rgba(255,255,255,0.02)",
                                                }}
                                            >
                                                {scaled.toFixed(2)}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Caption */}
            <motion.p
                className="text-center text-[12px] sm:text-[13px] leading-relaxed text-white/40 italic max-w-sm mx-auto mt-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                {`\u201C${WORDS[active]}\u201D now carries traces of ${topTargets.slice(0, 3).map(t => `\u201C${WORDS[t.i]}\u201D`).join(", ")} \u2014 it has become contextual.`}
            </motion.p>

            {/* Back link */}
            <motion.div
                className="text-center mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
            >
                <button
                    onClick={onBack}
                    className="text-[12px] text-white/20 hover:text-white/40 transition-colors cursor-pointer"
                >
                    {`\u2190 Back to attention`}
                </button>
            </motion.div>
        </motion.div>
    );
}
