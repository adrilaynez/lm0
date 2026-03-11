"use client";

import React, { useReducer, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════ */
const WORD = "tower";
const CHARS = WORD.split("");
const EMB = [0.73, -0.21, 0.58, 0.12, -0.89];
const STAGES = 8;
const DIM_LABELS = ["d\u2081", "d\u2082", "d\u2083", "d\u2084", "d\u2085"];
const FEATURES = ["size", "man-made?", "tall?", "common?", "solid?"];

type WordGroup = "similar" | "related" | "unrelated";

const NEIGHBORS: { word: string; x: number; y: number; cluster: "cyan" | "amber" | "emerald" | "rose"; group: WordGroup; vec: number[] }[] = [
    /* Similar words — close in meaning-space (nouns describing tall structures) */
    { word: "castle", x: 72, y: 18, cluster: "cyan", group: "similar", vec: [0.81, -0.15, 0.62, 0.08, -0.77] },
    { word: "monument", x: 58, y: 26, cluster: "cyan", group: "similar", vec: [0.69, -0.28, 0.54, 0.19, -0.82] },
    { word: "skyscraper", x: 82, y: 14, cluster: "cyan", group: "similar", vec: [0.88, -0.09, 0.71, 0.04, -0.69] },
    /* Related by context — words you'd find near "tower" but NOT similar in meaning */
    { word: "build", x: 38, y: 44, cluster: "emerald", group: "related", vec: [0.22, 0.15, 0.38, 0.71, -0.33] },
    { word: "height", x: 50, y: 38, cluster: "emerald", group: "related", vec: [0.45, -0.05, 0.72, 0.31, -0.52] },
    { word: "ancient", x: 42, y: 54, cluster: "emerald", group: "related", vec: [0.12, -0.38, 0.28, 0.15, -0.61] },
    /* Unrelated words — different meaning, different context (spread across the grid) */
    { word: "banana", x: 10, y: 8, cluster: "rose", group: "unrelated", vec: [-0.55, 0.42, -0.63, 0.72, 0.35] },
    { word: "purple", x: 86, y: 75, cluster: "rose", group: "unrelated", vec: [-0.62, 0.55, -0.71, 0.39, 0.42] },
    { word: "quickly", x: 78, y: 88, cluster: "rose", group: "unrelated", vec: [-0.38, 0.61, -0.49, 0.44, 0.58] },
    /* Original dissimilar cluster (keep for stages 5-6) */
    { word: "toy", x: 18, y: 78, cluster: "amber", group: "unrelated", vec: [-0.42, 0.67, -0.31, 0.55, 0.48] },
    { word: "block", x: 30, y: 72, cluster: "amber", group: "unrelated", vec: [-0.28, 0.59, -0.18, 0.62, 0.41] },
    { word: "child", x: 14, y: 84, cluster: "amber", group: "unrelated", vec: [-0.51, 0.73, -0.44, 0.48, 0.56] },
];

/* Which neighbors are visible at each stage */
const STAGE5_WORDS = ["castle", "monument", "skyscraper", "toy", "block", "child"];

const TOWER_POS = { x: 65, y: 30 };
const SPACE_W = 300;
const SPACE_H = 240;

const CAPTIONS: Record<number, string> = {
    0: "Every word needs a numerical identity for the model to understand it.",
    1: "A computer sees symbols \u2014 but symbols alone carry no meaning.",
    2: "Each number measures one characteristic: size, shape, use\u2026 Positive = yes, negative = no.",
    3: "Together, these characteristics form a vector \u2014 the word\u2019s unique fingerprint.",
    4: "This vector becomes a point \u2014 the word\u2019s address in meaning-space.",
    5: "Similar words share similar characteristics, so their points end up close together.",
    6: "Hover any dot to compare vectors. Notice how nearby words share similar values.",
    7: "Toggle between groups: similar words cluster nearby, related words sit at medium distance, unrelated words are far away.",
};

/* ═══════════════════════════════════════════════
   Reducer
   ═══════════════════════════════════════════════ */
type S = { stage: number; paused: boolean };
type A =
    | { type: "NEXT" }
    | { type: "GOTO"; stage: number }
    | { type: "TOGGLE" }
    | { type: "REPLAY" };

function reducer(s: S, a: A): S {
    switch (a.type) {
        case "NEXT":
            return s.stage >= STAGES - 1
                ? { ...s, paused: true }
                : { ...s, stage: s.stage + 1 };
        case "GOTO":
            return { stage: a.stage, paused: true };
        case "TOGGLE":
            return { ...s, paused: !s.paused };
        case "REPLAY":
            return { stage: 0, paused: false };
        default:
            return s;
    }
}

/* ═══════════════════════════════════════════════
   Spring presets
   ═══════════════════════════════════════════════ */
const sPop = { type: "spring" as const, stiffness: 80, damping: 18 };
const sSlide = { type: "spring" as const, stiffness: 60, damping: 20 };
const sSnap = { type: "spring" as const, stiffness: 110, damping: 16 };
const fadeExit = { opacity: 0, y: -8, scale: 0.97 };
const fadeEnter = { opacity: 0, y: 12, scale: 0.97 };

/* ═══════════════════════════════════════════════
   Color helpers
   ═══════════════════════════════════════════════ */
const cNum = (v: number) => v >= 0 ? "rgba(34,211,238,0.65)" : "rgba(251,191,36,0.65)";
type ClusterColor = "cyan" | "amber" | "emerald" | "rose";
const cDot = (c: ClusterColor) =>
    c === "cyan" ? "rgba(34,211,238,0.5)"
        : c === "amber" ? "rgba(251,191,36,0.5)"
            : c === "emerald" ? "rgba(52,211,153,0.5)"
                : "rgba(244,63,94,0.5)";
const cGlow = (c: ClusterColor) =>
    c === "cyan" ? "0 0 6px rgba(34,211,238,0.2)"
        : c === "amber" ? "0 0 6px rgba(251,191,36,0.2)"
            : c === "emerald" ? "0 0 6px rgba(52,211,153,0.2)"
                : "0 0 6px rgba(244,63,94,0.2)";

/* helper: % → px */
const pct = (p: number, dim: number) => (p / 100) * dim;

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export function WordToEmbeddingViz() {
    const [{ stage }, dispatch] = useReducer(reducer, { stage: 0, paused: false });
    const ref = useRef<HTMLDivElement>(null);
    const [hovered, setHovered] = useState<string | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<WordGroup | null>(null);

    /* keyboard: ← → */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight" && stage < STAGES - 1) dispatch({ type: "GOTO", stage: stage + 1 });
            if (e.key === "ArrowLeft" && stage > 0) dispatch({ type: "GOTO", stage: stage - 1 });
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [stage]);

    const next = () => dispatch({ type: "NEXT" });

    /* which "zone" we're in — determines AnimatePresence key */
    const zone =
        stage === 0 ? "word" :
            stage <= 2 ? "pills" :
                stage === 3 ? "vector" : "space";

    return (
        <div
            ref={ref}
            className="relative mx-auto select-none"
            style={{ maxWidth: 620, minHeight: 440 }}
        >
            {/* ambient glow */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(34,211,238,0.03) 0%, transparent 70%)" }}
            />

            {/* ── ghost label: visible stages 1-3, fades when dot takes over ── */}
            <AnimatePresence>
                {stage >= 1 && stage <= 3 && (
                    <motion.div
                        key="ghost"
                        className="absolute left-1/2 -translate-x-1/2 text-[14px] font-medium tracking-wide z-10 pointer-events-none"
                        style={{ color: "rgba(255,255,255,0.22)", top: stage === 3 ? 16 : 28 }}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, transition: { duration: 0.25 } }}
                        transition={{ duration: 0.4 }}
                    >
                        {WORD}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── stage content (zone-based transitions) ── */}
            <div className="relative flex flex-col items-center justify-center" style={{ minHeight: 340 }}>
                <AnimatePresence mode="wait">
                    {zone === "word" && (
                        <motion.div
                            key="word"
                            className="flex flex-col items-center justify-center gap-8 py-12"
                            initial={fadeEnter}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={fadeExit}
                            transition={{ duration: 0.5 }}
                        >
                            <motion.span
                                className="font-semibold text-white/90"
                                style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)" }}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ ...sPop, delay: 0.15 }}
                            >
                                {WORD}
                            </motion.span>
                            <motion.button
                                data-int
                                onClick={(e) => { e.stopPropagation(); next(); }}
                                className="text-[13px] tracking-wide cursor-pointer px-5 py-2 rounded-full transition-all"
                                style={{
                                    color: "rgba(34,211,238,0.55)",
                                    border: "1px solid rgba(34,211,238,0.2)",
                                    background: "rgba(34,211,238,0.04)",
                                }}
                                whileHover={{
                                    borderColor: "rgba(34,211,238,0.4)",
                                    background: "rgba(34,211,238,0.08)",
                                }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                            >
                                ▶ Begin
                            </motion.button>
                        </motion.div>
                    )}

                    {zone === "pills" && (
                        <motion.div
                            key="pills"
                            className="flex flex-col items-center gap-6 py-8"
                            initial={fadeEnter}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={fadeExit}
                            transition={{ duration: 0.5 }}
                        >
                            <PillsRow stage={stage} />
                        </motion.div>
                    )}

                    {zone === "vector" && (
                        <motion.div
                            key="vector"
                            className="flex flex-col items-center py-4"
                            initial={fadeEnter}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={fadeExit}
                            transition={{ duration: 0.5 }}
                        >
                            <VectorColumn />
                        </motion.div>
                    )}

                    {zone === "space" && (
                        <motion.div
                            key="space"
                            className="w-full"
                            initial={fadeEnter}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={fadeExit}
                            transition={{ duration: 0.5 }}
                        >
                            <SpaceView
                                stage={stage}
                                hovered={hovered}
                                setHovered={setHovered}
                                selectedGroup={selectedGroup}
                                setSelectedGroup={setSelectedGroup}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── caption ── */}
            <AnimatePresence mode="wait">
                <motion.p
                    key={stage}
                    className="text-center text-[12px] italic mt-5"
                    style={{ color: "rgba(255,255,255,0.2)" }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.3 }}
                >
                    {CAPTIONS[stage]}
                </motion.p>
            </AnimatePresence>

            {/* ── next button (manual step-by-step) ── */}
            {stage > 0 && stage < STAGES - 1 && (
                <div className="flex justify-center mt-4" data-int>
                    <motion.button
                        key={`next-${stage}`}
                        onClick={(e) => { e.stopPropagation(); next(); }}
                        className="text-[12px] tracking-wide cursor-pointer px-4 py-1.5 rounded-full transition-all"
                        style={{
                            color: "rgba(34,211,238,0.45)",
                            border: "1px solid rgba(34,211,238,0.15)",
                            background: "rgba(34,211,238,0.03)",
                        }}
                        whileHover={{
                            borderColor: "rgba(34,211,238,0.35)",
                            background: "rgba(34,211,238,0.07)",
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        Next →
                    </motion.button>
                </div>
            )}

            {/* ── progress dots ── */}
            <div className="flex items-center justify-center gap-1.5 mt-5" data-int>
                {Array.from({ length: STAGES }).map((_, i) => (
                    <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); dispatch({ type: "GOTO", stage: i }); }}
                        className="transition-all duration-300 rounded-full"
                        style={{
                            width: i === stage ? 10 : 6,
                            height: i === stage ? 10 : 6,
                            background: i === stage
                                ? "#22d3ee"
                                : i < stage
                                    ? "rgba(34,211,238,0.25)"
                                    : "rgba(255,255,255,0.1)",
                            boxShadow: i === stage ? "0 0 8px rgba(34,211,238,0.4)" : "none",
                        }}
                        aria-label={`Go to stage ${i}`}
                    />
                ))}
            </div>

            {/* ── replay ── */}
            <AnimatePresence>
                {stage === STAGES - 1 && (
                    <motion.button
                        data-int
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.6 }}
                        onClick={(e) => { e.stopPropagation(); dispatch({ type: "REPLAY" }); }}
                        className="absolute bottom-0 right-2 text-[11px] cursor-pointer hover:text-white/40 transition-colors"
                        style={{ color: "rgba(255,255,255,0.18)" }}
                    >
                        Replay ↺
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ═══════════════════════════════════════════════
   PILLS ROW — stages 1 & 2 share the same container
   Characters crossfade to numbers INSIDE stable pills
   ═══════════════════════════════════════════════ */
function PillsRow({ stage }: { stage: number }) {
    const showNumbers = stage >= 2;
    return (
        <div className="flex gap-3 pt-4">
            {CHARS.map((ch, i) => (
                <motion.div
                    key={i}
                    className="relative flex items-center justify-center rounded-lg overflow-hidden"
                    style={{
                        background: "rgba(255,255,255,0.04)",
                        width: showNumbers ? 62 : 48,
                        height: showNumbers ? 64 : 52,
                    }}
                    initial={{ opacity: 0, y: 20, scale: 0.7 }}
                    animate={{ opacity: 1, y: 0, scale: 1, width: showNumbers ? 62 : 48, height: showNumbers ? 64 : 52 }}
                    transition={{ ...sPop, delay: i * 0.09 }}
                >
                    {/* character → number crossfade inside the pill */}
                    <AnimatePresence mode="wait">
                        {!showNumbers ? (
                            <motion.span
                                key="ch"
                                className="text-lg font-medium text-white/80"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                            >
                                {ch}
                            </motion.span>
                        ) : (
                            <motion.div
                                key="num"
                                className="flex flex-col items-center gap-0.5"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.45, delay: i * 0.07 }}
                            >
                                <span className="font-mono text-[15px] tabular-nums" style={{ color: cNum(EMB[i]) }}>
                                    {EMB[i].toFixed(2)}
                                </span>
                                <span className="text-[7px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.22)" }}>
                                    {FEATURES[i]}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            ))}
        </div>
    );
}

/* ═══════════════════════════════════════════════
   VECTOR COLUMN — stage 3
   ═══════════════════════════════════════════════ */
function VectorColumn() {
    const h = EMB.length * 36 + 16;
    return (
        <div className="flex flex-col items-center gap-3 pt-6">
            {/* connecting line from ghost label */}
            <motion.div
                className="w-px"
                style={{ height: 18, background: "rgba(255,255,255,0.08)" }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.5, delay: 0.05 }}
            />

            <div className="flex items-center gap-3">
                {/* left bracket */}
                <svg width="12" height={h} viewBox={`0 0 12 ${h}`}>
                    <motion.path
                        d={`M 10 2 L 4 2 L 4 ${h - 2} L 10 ${h - 2}`}
                        fill="none" stroke="rgba(255,255,255,0.15)"
                        strokeWidth="1.5" strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
                    />
                </svg>

                {/* numbers */}
                <div className="flex flex-col gap-1">
                    {EMB.map((v, i) => (
                        <motion.div
                            key={i}
                            className="flex items-center gap-3"
                            initial={{ opacity: 0, x: (i - 2) * 50, y: -70 }}
                            animate={{ opacity: 1, x: 0, y: 0 }}
                            transition={{ ...sSlide, delay: i * 0.1 }}
                        >
                            <span
                                className="font-mono text-[15px] tabular-nums w-14 text-right"
                                style={{ color: cNum(v) }}
                            >
                                {v.toFixed(2)}
                            </span>
                            <motion.div
                                className="flex items-center gap-1.5"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 + i * 0.06 }}
                            >
                                <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.14)" }}>{DIM_LABELS[i]}</span>
                                <span className="text-[9px] italic" style={{ color: "rgba(255,255,255,0.22)" }}>{FEATURES[i]}</span>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>

                {/* right bracket */}
                <svg width="12" height={h} viewBox={`0 0 12 ${h}`}>
                    <motion.path
                        d={`M 2 2 L 8 2 L 8 ${h - 2} L 2 ${h - 2}`}
                        fill="none" stroke="rgba(255,255,255,0.15)"
                        strokeWidth="1.5" strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
                    />
                </svg>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════
   Group toggle button styling
   ═══════════════════════════════════════════════ */
const GROUP_META: Record<WordGroup, { label: string; rgb: string; desc: string }> = {
    similar: { label: "Similar", rgb: "34,211,238", desc: "Same kind of thing — nearby in meaning-space" },
    related: { label: "Related", rgb: "52,211,153", desc: "Found in the same contexts — medium distance" },
    unrelated: { label: "Unrelated", rgb: "244,63,94", desc: "Different meaning, different context — far away" },
};

/* ═══════════════════════════════════════════════
   SPACE VIEW — stages 4-7
   ═══════════════════════════════════════════════ */
function SpaceView({
    stage,
    hovered,
    setHovered,
    selectedGroup,
    setSelectedGroup,
}: {
    stage: number;
    hovered: string | null;
    setHovered: (v: string | null) => void;
    selectedGroup: WordGroup | null;
    setSelectedGroup: (g: WordGroup | null) => void;
}) {
    const showNeighbors = stage >= 5;
    const isIdle = stage >= 6;
    const showAllGroups = stage >= 7;

    /* Determine which neighbors are visible */
    const visibleNeighbors = showAllGroups
        ? NEIGHBORS
        : showNeighbors
            ? NEIGHBORS.filter((n) => STAGE5_WORDS.includes(n.word))
            : [];

    return (
        <div className="flex flex-col items-center gap-4 py-4 w-full">
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 w-full justify-center">
                {/* compact vector (only stage 4) */}
                <AnimatePresence>
                    {stage === 4 && (
                        <motion.div
                            key="mini-vec"
                            className="flex flex-col items-center gap-1"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20, transition: { duration: 0.25 } }}
                            transition={{ ...sSlide }}
                        >
                            <span className="text-[13px] font-medium mb-1" style={{ color: "rgba(255,255,255,0.22)" }}>
                                {WORD}
                            </span>
                            <MiniVector />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* dashed trail (only stage 4, desktop) */}
                <AnimatePresence>
                    {stage === 4 && (
                        <motion.svg
                            key="trail"
                            className="hidden sm:block"
                            width="36" height="4" viewBox="0 0 36 4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <motion.line
                                x1="0" y1="2" x2="36" y2="2"
                                stroke="rgba(34,211,238,0.15)" strokeWidth="1" strokeDasharray="3 3"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                            />
                        </motion.svg>
                    )}
                </AnimatePresence>

                {/* 2D coordinate space */}
                <motion.div
                    className="relative"
                    style={{ width: SPACE_W, height: SPACE_H }}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.45, delay: stage === 4 ? 0.2 : 0 }}
                >
                    <CoordinateGrid />

                    {/* neighbor dots */}
                    <AnimatePresence>
                        {visibleNeighbors.map((n, i) => (
                            <NeighborDot
                                key={n.word}
                                n={n}
                                i={i}
                                isIdle={isIdle}
                                hovered={hovered === n.word}
                                onHover={setHovered}
                                dimmed={selectedGroup !== null && n.group !== selectedGroup}
                                highlighted={selectedGroup !== null && n.group === selectedGroup}
                            />
                        ))}
                    </AnimatePresence>

                    {/* THE tower dot */}
                    <TowerDot
                        stage={stage}
                        isIdle={isIdle}
                        hovered={hovered === WORD}
                        onHover={setHovered}
                    />
                </motion.div>
            </div>

            {/* ── Group toggle buttons (stage 7) ── */}
            <AnimatePresence>
                {showAllGroups && (
                    <motion.div
                        key="group-toggles"
                        className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        data-int
                    >
                        {(["similar", "related", "unrelated"] as WordGroup[]).map((g) => {
                            const meta = GROUP_META[g];
                            const isActive = selectedGroup === g;
                            return (
                                <motion.button
                                    key={g}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedGroup(isActive ? null : g);
                                    }}
                                    className="text-[11px] sm:text-[12px] font-medium cursor-pointer px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5"
                                    style={{
                                        color: isActive ? `rgba(${meta.rgb}, 0.9)` : `rgba(${meta.rgb}, 0.45)`,
                                        border: `1px solid rgba(${meta.rgb}, ${isActive ? 0.4 : 0.15})`,
                                        background: `rgba(${meta.rgb}, ${isActive ? 0.1 : 0.03})`,
                                        boxShadow: isActive ? `0 0 12px rgba(${meta.rgb}, 0.15)` : "none",
                                    }}
                                    whileHover={{
                                        borderColor: `rgba(${meta.rgb}, 0.35)`,
                                        background: `rgba(${meta.rgb}, 0.08)`,
                                    }}
                                >
                                    <span
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ background: `rgba(${meta.rgb}, ${isActive ? 0.7 : 0.35})` }}
                                    />
                                    {meta.label}
                                </motion.button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Group description */}
            <AnimatePresence mode="wait">
                {showAllGroups && selectedGroup && (
                    <motion.p
                        key={selectedGroup}
                        className="text-[11px] text-center max-w-xs mx-auto"
                        style={{ color: `rgba(${GROUP_META[selectedGroup].rgb}, 0.4)` }}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4, transition: { duration: 0.1 } }}
                        transition={{ duration: 0.25 }}
                    >
                        {GROUP_META[selectedGroup].desc}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Mini vector (compact, stage 4 only) ─── */
function MiniVector() {
    const h = EMB.length * 22 + 8;
    return (
        <div className="flex items-center gap-1.5">
            <svg width="7" height={h} viewBox={`0 0 7 ${h}`}>
                <path d={`M 6 1 L 2 1 L 2 ${h - 1} L 6 ${h - 1}`}
                    fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeLinecap="round" />
            </svg>
            <div className="flex flex-col gap-0.5">
                {EMB.map((v, i) => (
                    <span key={i} className="font-mono text-[11px] tabular-nums leading-tight" style={{ color: cNum(v) }}>
                        {v.toFixed(2)}
                    </span>
                ))}
            </div>
            <svg width="7" height={h} viewBox={`0 0 7 ${h}`}>
                <path d={`M 1 1 L 5 1 L 5 ${h - 1} L 1 ${h - 1}`}
                    fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeLinecap="round" />
            </svg>
        </div>
    );
}

/* ─── Coordinate grid (SVG, static) ─── */
function CoordinateGrid() {
    return (
        <svg width={SPACE_W} height={SPACE_H} className="absolute inset-0">
            {[20, 40, 60, 80].map((p) => (
                <React.Fragment key={p}>
                    <line x1={pct(p, SPACE_W)} y1={0} x2={pct(p, SPACE_W)} y2={SPACE_H}
                        stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
                    <line x1={0} y1={pct(p, SPACE_H)} x2={SPACE_W} y2={pct(p, SPACE_H)}
                        stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
                </React.Fragment>
            ))}
            <line x1={0} y1={SPACE_H / 2} x2={SPACE_W} y2={SPACE_H / 2} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
            <line x1={SPACE_W / 2} y1={0} x2={SPACE_W / 2} y2={SPACE_H} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
            <text x={SPACE_W - 14} y={SPACE_H / 2 - 6} fill="rgba(255,255,255,0.13)" fontSize="9" fontFamily="monospace">{DIM_LABELS[0]}</text>
            <text x={SPACE_W / 2 + 6} y={12} fill="rgba(255,255,255,0.13)" fontSize="9" fontFamily="monospace">{DIM_LABELS[1]}</text>
        </svg>
    );
}

/* ─── Neighbor dot ─── */
function NeighborDot({
    n,
    i,
    isIdle,
    hovered,
    onHover,
    dimmed = false,
    highlighted = false,
}: {
    n: typeof NEIGHBORS[number];
    i: number;
    isIdle: boolean;
    hovered: boolean;
    onHover: (v: string | null) => void;
    dimmed?: boolean;
    highlighted?: boolean;
}) {
    /* ambient drift: each dot drifts slightly when idle */
    const driftX = isIdle ? Math.sin((i + 1) * 1.3) * 1.2 : 0;
    const driftY = isIdle ? Math.cos((i + 1) * 0.9) * 1.0 : 0;

    /* Visual adjustments for group selection */
    const dotOpacity = dimmed ? 0.15 : 1;
    const dotScale = highlighted ? 1.4 : 1;
    const labelOpacity = dimmed ? 0.08 : highlighted ? 0.55 : 0.28;

    return (
        <motion.div
            className="absolute"
            style={{ left: pct(n.x, SPACE_W) - 4, top: pct(n.y, SPACE_H) - 4 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
                opacity: dotOpacity,
                scale: dotScale,
                x: driftX,
                y: driftY,
            }}
            transition={{
                ...sSnap,
                delay: i * 0.12,
                opacity: { duration: 0.3 },
                scale: { duration: 0.3 },
                x: { duration: 8 + i * 1.5, repeat: Infinity, repeatType: "mirror" as const, ease: "easeInOut" },
                y: { duration: 9 + i * 1.2, repeat: Infinity, repeatType: "mirror" as const, ease: "easeInOut" },
            }}
            onMouseEnter={() => isIdle && onHover(n.word)}
            onMouseLeave={() => onHover(null)}
            data-int
        >
            <div
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                    background: cDot(n.cluster),
                    boxShadow: highlighted
                        ? `${cGlow(n.cluster)}, 0 0 12px ${cDot(n.cluster)}`
                        : cGlow(n.cluster),
                }}
            />
            <span
                className="absolute left-3 top-[-3px] text-[10px] whitespace-nowrap pointer-events-none transition-opacity duration-300"
                style={{ color: `rgba(255,255,255,${labelOpacity})` }}
            >
                {n.word}
            </span>

            <AnimatePresence>
                {hovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 2 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-4 z-10 rounded-md px-2 py-1 whitespace-nowrap"
                        style={{ background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                        <span className="font-mono text-[9px] tabular-nums" style={{ color: "rgba(255,255,255,0.4)" }}>
                            [{n.vec.map(v => v.toFixed(2)).join(", ")}]
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════
   THE TOWER DOT — the star of the show
   ═══════════════════════════════════════════════ */
function TowerDot({
    stage,
    isIdle,
    hovered,
    onHover,
}: {
    stage: number;
    isIdle: boolean;
    hovered: boolean;
    onHover: (v: string | null) => void;
}) {
    const x = pct(TOWER_POS.x, SPACE_W) - 7;
    const y = pct(TOWER_POS.y, SPACE_H) - 7;
    const isEntrance = stage === 4;

    return (
        <motion.div
            className="absolute z-10"
            style={{ left: x, top: y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
                opacity: 1,
                scale: 1,
                x: isIdle ? Math.sin(0.7) * 0.8 : 0,
                y: isIdle ? Math.cos(0.5) * 0.6 : 0,
            }}
            transition={{
                ...sSnap,
                delay: isEntrance ? 0.5 : 0,
                x: isIdle ? { duration: 10, repeat: Infinity, repeatType: "mirror" as const, ease: "easeInOut" } : undefined,
                y: isIdle ? { duration: 11, repeat: Infinity, repeatType: "mirror" as const, ease: "easeInOut" } : undefined,
            }}
            onMouseEnter={() => isIdle && onHover(WORD)}
            onMouseLeave={() => onHover(null)}
            data-int
        >
            {/* expanding ring 1 — fast, bright */}
            {isEntrance && (
                <motion.div
                    className="absolute rounded-full pointer-events-none"
                    style={{ width: 14, height: 14, border: "1.5px solid rgba(255,255,255,0.7)", top: 0, left: 0 }}
                    initial={{ scale: 1, opacity: 0.9 }}
                    animate={{ scale: 3.5, opacity: 0 }}
                    transition={{ duration: 0.65, ease: "easeOut" }}
                />
            )}
            {/* expanding ring 2 — slower, softer (double-ring for premium feel) */}
            {isEntrance && (
                <motion.div
                    className="absolute rounded-full pointer-events-none"
                    style={{ width: 14, height: 14, border: "1px solid rgba(34,211,238,0.4)", top: 0, left: 0 }}
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 5, opacity: 0 }}
                    transition={{ duration: 0.9, ease: "easeOut", delay: 0.08 }}
                />
            )}

            {/* the dot */}
            <motion.div
                className="w-[14px] h-[14px] rounded-full"
                style={{
                    background: "#22d3ee",
                    boxShadow: "0 0 20px rgba(34,211,238,0.35), 0 0 6px rgba(34,211,238,0.5)",
                }}
                animate={isIdle ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                transition={isIdle ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
            />

            {/* label */}
            <span
                className="absolute left-5 -top-1 text-[12px] font-medium whitespace-nowrap pointer-events-none"
                style={{ color: "rgba(34,211,238,0.8)" }}
            >
                {WORD}
            </span>

            {/* hover tooltip */}
            <AnimatePresence>
                {hovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 2 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-5 z-20 rounded-md px-2.5 py-1.5 whitespace-nowrap"
                        style={{ background: "rgba(0,0,0,0.85)", border: "1px solid rgba(34,211,238,0.15)" }}
                    >
                        <span className="font-mono text-[10px] tabular-nums" style={{ color: "rgba(34,211,238,0.7)" }}>
                            [{EMB.map(v => v.toFixed(2)).join(", ")}]
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
