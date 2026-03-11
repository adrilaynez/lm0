"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  V28 — MultiLensViewViz ⭐ (FLAGSHIP — "Four Sets of Eyes")
  3 switchable sentences. 4 heads per sentence with realistic attention.
  Hover word → arcs appear across all 4 heads.
  Head tabs to focus one head.
  Colors: cyan + amber. No boxes — left-border accents.
*/

interface SentenceData {
    label: string;
    words: string[];
    heads: { focus: string; weights: number[][] }[];
}

const SENTENCES: SentenceData[] = [
    {
        label: "professor",
        words: ["The", "professor", "who", "published", "the", "paper", "in", "Nature", "last", "year", "won", "the", "Nobel", "prize"],
        heads: [
            {
                /* Syntax: subject→verb links. "professor" attends to its verbs "published" and "won" */
                focus: "Syntax",
                weights: [
                    /* The       */[0.12, 0.40, 0.04, 0.08, 0.06, 0.04, 0.02, 0.03, 0.02, 0.02, 0.06, 0.04, 0.03, 0.04],
                    /* professor */[0.03, 0.05, 0.04, 0.38, 0.02, 0.03, 0.01, 0.02, 0.01, 0.01, 0.32, 0.01, 0.03, 0.04],
                    /* who       */[0.04, 0.42, 0.06, 0.30, 0.02, 0.03, 0.01, 0.02, 0.01, 0.01, 0.04, 0.01, 0.02, 0.01],
                    /* published */[0.02, 0.35, 0.05, 0.06, 0.04, 0.30, 0.02, 0.03, 0.02, 0.02, 0.03, 0.02, 0.02, 0.02],
                    /* the       */[0.06, 0.03, 0.02, 0.04, 0.06, 0.45, 0.03, 0.05, 0.03, 0.03, 0.04, 0.06, 0.05, 0.05],
                    /* paper     */[0.02, 0.10, 0.02, 0.38, 0.06, 0.06, 0.03, 0.08, 0.02, 0.02, 0.05, 0.02, 0.06, 0.08],
                    /* in        */[0.02, 0.03, 0.01, 0.05, 0.02, 0.08, 0.04, 0.45, 0.05, 0.04, 0.04, 0.04, 0.06, 0.07],
                    /* Nature    */[0.02, 0.05, 0.01, 0.08, 0.02, 0.12, 0.08, 0.06, 0.04, 0.03, 0.04, 0.02, 0.20, 0.23],
                    /* last      */[0.02, 0.02, 0.01, 0.03, 0.02, 0.03, 0.02, 0.04, 0.06, 0.52, 0.08, 0.03, 0.05, 0.07],
                    /* year      */[0.02, 0.03, 0.01, 0.04, 0.02, 0.03, 0.02, 0.04, 0.38, 0.06, 0.20, 0.03, 0.05, 0.07],
                    /* won       */[0.02, 0.42, 0.03, 0.05, 0.02, 0.03, 0.01, 0.02, 0.02, 0.02, 0.06, 0.03, 0.12, 0.15],
                    /* the       */[0.04, 0.03, 0.02, 0.03, 0.04, 0.03, 0.02, 0.03, 0.02, 0.02, 0.05, 0.06, 0.32, 0.29],
                    /* Nobel     */[0.02, 0.04, 0.01, 0.03, 0.02, 0.04, 0.02, 0.08, 0.02, 0.02, 0.08, 0.04, 0.06, 0.52],
                    /* prize     */[0.02, 0.05, 0.02, 0.03, 0.02, 0.04, 0.01, 0.03, 0.02, 0.02, 0.35, 0.03, 0.28, 0.08],
                ],
            },
            {
                /* Meaning: semantic/conceptual links. "professor" → "Nature", "Nobel", "paper" */
                focus: "Meaning",
                weights: [
                    /* The       */[0.08, 0.30, 0.04, 0.06, 0.05, 0.08, 0.03, 0.08, 0.03, 0.03, 0.05, 0.04, 0.06, 0.07],
                    /* professor */[0.02, 0.06, 0.02, 0.08, 0.02, 0.15, 0.02, 0.25, 0.02, 0.02, 0.05, 0.02, 0.18, 0.09],
                    /* who       */[0.04, 0.35, 0.05, 0.10, 0.03, 0.08, 0.02, 0.06, 0.02, 0.02, 0.10, 0.02, 0.05, 0.06],
                    /* published */[0.02, 0.18, 0.03, 0.05, 0.03, 0.28, 0.03, 0.15, 0.02, 0.02, 0.04, 0.02, 0.06, 0.07],
                    /* the       */[0.05, 0.04, 0.03, 0.05, 0.05, 0.30, 0.04, 0.10, 0.03, 0.03, 0.05, 0.05, 0.08, 0.10],
                    /* paper     */[0.02, 0.15, 0.02, 0.25, 0.04, 0.06, 0.03, 0.18, 0.02, 0.02, 0.04, 0.02, 0.08, 0.07],
                    /* in        */[0.02, 0.04, 0.02, 0.05, 0.03, 0.08, 0.04, 0.35, 0.04, 0.04, 0.05, 0.03, 0.10, 0.11],
                    /* Nature    */[0.02, 0.18, 0.01, 0.10, 0.02, 0.15, 0.05, 0.06, 0.03, 0.03, 0.06, 0.02, 0.15, 0.12],
                    /* last      */[0.03, 0.04, 0.02, 0.04, 0.03, 0.05, 0.03, 0.06, 0.06, 0.30, 0.12, 0.03, 0.08, 0.11],
                    /* year      */[0.02, 0.05, 0.02, 0.04, 0.02, 0.04, 0.02, 0.05, 0.25, 0.06, 0.18, 0.02, 0.10, 0.13],
                    /* won       */[0.02, 0.20, 0.02, 0.05, 0.02, 0.04, 0.02, 0.06, 0.03, 0.03, 0.06, 0.03, 0.22, 0.20],
                    /* the       */[0.04, 0.04, 0.02, 0.04, 0.04, 0.05, 0.03, 0.06, 0.03, 0.03, 0.06, 0.05, 0.25, 0.26],
                    /* Nobel     */[0.02, 0.12, 0.01, 0.05, 0.02, 0.06, 0.02, 0.15, 0.02, 0.02, 0.10, 0.03, 0.06, 0.32],
                    /* prize     */[0.02, 0.08, 0.01, 0.04, 0.02, 0.06, 0.02, 0.05, 0.02, 0.02, 0.22, 0.03, 0.32, 0.09],
                ],
            },
            {
                /* Position: local/adjacent context. Each word attends strongly to its immediate neighbors */
                focus: "Position",
                weights: [
                    /* The       */[0.15, 0.48, 0.18, 0.05, 0.03, 0.02, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.02],
                    /* professor */[0.30, 0.10, 0.35, 0.12, 0.05, 0.02, 0.01, 0.01, 0.01, 0.01, 0.01, 0.00, 0.00, 0.01],
                    /* who       */[0.12, 0.32, 0.08, 0.30, 0.08, 0.03, 0.02, 0.01, 0.01, 0.01, 0.01, 0.00, 0.00, 0.01],
                    /* published */[0.05, 0.12, 0.25, 0.08, 0.28, 0.12, 0.03, 0.02, 0.01, 0.01, 0.01, 0.01, 0.00, 0.01],
                    /* the       */[0.03, 0.05, 0.10, 0.25, 0.08, 0.30, 0.10, 0.03, 0.02, 0.01, 0.01, 0.01, 0.00, 0.01],
                    /* paper     */[0.02, 0.03, 0.04, 0.12, 0.28, 0.08, 0.25, 0.10, 0.03, 0.02, 0.01, 0.01, 0.00, 0.01],
                    /* in        */[0.01, 0.02, 0.02, 0.04, 0.10, 0.25, 0.08, 0.30, 0.10, 0.03, 0.02, 0.01, 0.01, 0.01],
                    /* Nature    */[0.01, 0.01, 0.02, 0.03, 0.04, 0.10, 0.25, 0.08, 0.28, 0.10, 0.03, 0.02, 0.02, 0.01],
                    /* last      */[0.01, 0.01, 0.01, 0.02, 0.03, 0.04, 0.08, 0.25, 0.10, 0.30, 0.08, 0.03, 0.02, 0.02],
                    /* year      */[0.01, 0.01, 0.01, 0.01, 0.02, 0.03, 0.04, 0.08, 0.28, 0.10, 0.28, 0.06, 0.04, 0.03],
                    /* won       */[0.01, 0.01, 0.01, 0.01, 0.02, 0.02, 0.03, 0.04, 0.08, 0.28, 0.10, 0.22, 0.10, 0.07],
                    /* the       */[0.01, 0.01, 0.01, 0.01, 0.01, 0.02, 0.02, 0.03, 0.04, 0.08, 0.25, 0.10, 0.28, 0.13],
                    /* Nobel     */[0.01, 0.01, 0.00, 0.01, 0.01, 0.01, 0.02, 0.02, 0.03, 0.04, 0.08, 0.28, 0.10, 0.38],
                    /* prize     */[0.01, 0.01, 0.00, 0.01, 0.01, 0.01, 0.01, 0.02, 0.02, 0.04, 0.08, 0.12, 0.38, 0.28],
                ],
            },
            {
                /* Self/Identity: each word attends mostly to itself */
                focus: "Self",
                weights: [
                    /* The       */[0.45, 0.08, 0.05, 0.05, 0.05, 0.04, 0.03, 0.04, 0.03, 0.03, 0.04, 0.04, 0.03, 0.04],
                    /* professor */[0.06, 0.42, 0.06, 0.08, 0.04, 0.06, 0.03, 0.04, 0.03, 0.03, 0.05, 0.02, 0.04, 0.04],
                    /* who       */[0.06, 0.08, 0.40, 0.08, 0.04, 0.04, 0.03, 0.04, 0.03, 0.03, 0.05, 0.03, 0.04, 0.05],
                    /* published */[0.04, 0.08, 0.06, 0.42, 0.05, 0.08, 0.03, 0.04, 0.03, 0.02, 0.04, 0.03, 0.04, 0.04],
                    /* the       */[0.05, 0.04, 0.04, 0.06, 0.40, 0.10, 0.04, 0.05, 0.03, 0.03, 0.04, 0.04, 0.04, 0.04],
                    /* paper     */[0.03, 0.06, 0.03, 0.08, 0.08, 0.40, 0.05, 0.06, 0.03, 0.03, 0.04, 0.02, 0.04, 0.05],
                    /* in        */[0.03, 0.03, 0.03, 0.04, 0.04, 0.06, 0.42, 0.10, 0.04, 0.03, 0.04, 0.03, 0.05, 0.06],
                    /* Nature    */[0.03, 0.04, 0.02, 0.05, 0.03, 0.06, 0.08, 0.40, 0.06, 0.04, 0.04, 0.03, 0.06, 0.06],
                    /* last      */[0.03, 0.03, 0.02, 0.03, 0.03, 0.04, 0.04, 0.06, 0.42, 0.10, 0.05, 0.03, 0.05, 0.07],
                    /* year      */[0.03, 0.03, 0.02, 0.03, 0.03, 0.03, 0.03, 0.04, 0.10, 0.42, 0.08, 0.03, 0.06, 0.07],
                    /* won       */[0.03, 0.06, 0.03, 0.04, 0.03, 0.04, 0.02, 0.04, 0.04, 0.05, 0.42, 0.04, 0.08, 0.08],
                    /* the       */[0.04, 0.03, 0.03, 0.03, 0.04, 0.03, 0.03, 0.04, 0.03, 0.03, 0.05, 0.40, 0.10, 0.12],
                    /* Nobel     */[0.03, 0.04, 0.02, 0.04, 0.03, 0.04, 0.03, 0.06, 0.03, 0.03, 0.06, 0.06, 0.42, 0.11],
                    /* prize     */[0.03, 0.04, 0.02, 0.03, 0.03, 0.05, 0.02, 0.04, 0.03, 0.03, 0.08, 0.05, 0.12, 0.43],
                ],
            },
        ],
    },
    {
        label: "king",
        words: ["The", "king", "wore", "the", "golden", "crown"],
        heads: [
            {
                focus: "Syntax",
                weights: [
                    [0.12, 0.42, 0.08, 0.10, 0.06, 0.22],
                    [0.04, 0.06, 0.48, 0.03, 0.05, 0.34],
                    [0.05, 0.38, 0.06, 0.05, 0.12, 0.34],
                    [0.08, 0.04, 0.06, 0.08, 0.40, 0.34],
                    [0.03, 0.04, 0.08, 0.10, 0.06, 0.69],
                    [0.03, 0.08, 0.35, 0.04, 0.15, 0.35],
                ],
            },
            {
                focus: "Meaning",
                weights: [
                    [0.08, 0.30, 0.06, 0.08, 0.15, 0.33],
                    [0.03, 0.06, 0.05, 0.03, 0.35, 0.48],
                    [0.04, 0.22, 0.06, 0.04, 0.30, 0.34],
                    [0.06, 0.05, 0.06, 0.06, 0.35, 0.42],
                    [0.03, 0.15, 0.08, 0.05, 0.06, 0.63],
                    [0.03, 0.20, 0.06, 0.04, 0.32, 0.35],
                ],
            },
            {
                focus: "Position",
                weights: [
                    [0.18, 0.48, 0.18, 0.06, 0.05, 0.05],
                    [0.30, 0.10, 0.38, 0.12, 0.06, 0.04],
                    [0.10, 0.32, 0.08, 0.30, 0.12, 0.08],
                    [0.05, 0.10, 0.28, 0.10, 0.32, 0.15],
                    [0.03, 0.05, 0.12, 0.28, 0.10, 0.42],
                    [0.02, 0.04, 0.06, 0.12, 0.42, 0.34],
                ],
            },
            {
                focus: "Self",
                weights: [
                    [0.45, 0.10, 0.08, 0.10, 0.12, 0.15],
                    [0.08, 0.45, 0.10, 0.06, 0.12, 0.19],
                    [0.06, 0.12, 0.42, 0.08, 0.15, 0.17],
                    [0.08, 0.06, 0.08, 0.42, 0.18, 0.18],
                    [0.05, 0.08, 0.06, 0.10, 0.42, 0.29],
                    [0.04, 0.08, 0.08, 0.06, 0.15, 0.59],
                ],
            },
        ],
    },
    {
        label: "dog",
        words: ["The", "dog", "chased", "the", "ball", "across", "the", "park"],
        heads: [
            {
                focus: "Syntax",
                weights: [
                    [0.10, 0.40, 0.08, 0.08, 0.06, 0.04, 0.08, 0.16],
                    [0.04, 0.06, 0.45, 0.03, 0.28, 0.04, 0.03, 0.07],
                    [0.04, 0.38, 0.06, 0.04, 0.30, 0.05, 0.03, 0.10],
                    [0.06, 0.04, 0.05, 0.06, 0.42, 0.06, 0.06, 0.25],
                    [0.03, 0.10, 0.32, 0.06, 0.06, 0.08, 0.03, 0.32],
                    [0.03, 0.04, 0.06, 0.04, 0.08, 0.06, 0.05, 0.64],
                    [0.05, 0.03, 0.04, 0.05, 0.05, 0.05, 0.06, 0.67],
                    [0.02, 0.05, 0.08, 0.03, 0.12, 0.25, 0.05, 0.40],
                ],
            },
            {
                focus: "Meaning",
                weights: [
                    [0.08, 0.28, 0.06, 0.08, 0.15, 0.06, 0.06, 0.23],
                    [0.03, 0.06, 0.08, 0.03, 0.38, 0.08, 0.03, 0.31],
                    [0.03, 0.20, 0.06, 0.04, 0.32, 0.10, 0.03, 0.22],
                    [0.05, 0.05, 0.06, 0.05, 0.35, 0.08, 0.05, 0.31],
                    [0.03, 0.18, 0.10, 0.04, 0.06, 0.12, 0.03, 0.44],
                    [0.02, 0.06, 0.08, 0.04, 0.12, 0.06, 0.04, 0.58],
                    [0.04, 0.04, 0.04, 0.04, 0.10, 0.08, 0.05, 0.61],
                    [0.02, 0.08, 0.06, 0.03, 0.15, 0.20, 0.04, 0.42],
                ],
            },
            {
                focus: "Position",
                weights: [
                    [0.18, 0.48, 0.18, 0.05, 0.04, 0.02, 0.02, 0.03],
                    [0.32, 0.10, 0.38, 0.10, 0.04, 0.02, 0.02, 0.02],
                    [0.10, 0.32, 0.08, 0.28, 0.12, 0.04, 0.03, 0.03],
                    [0.05, 0.10, 0.28, 0.08, 0.30, 0.10, 0.05, 0.04],
                    [0.03, 0.05, 0.12, 0.25, 0.08, 0.28, 0.10, 0.09],
                    [0.02, 0.03, 0.05, 0.10, 0.28, 0.08, 0.28, 0.16],
                    [0.02, 0.02, 0.03, 0.05, 0.10, 0.28, 0.08, 0.42],
                    [0.01, 0.02, 0.03, 0.04, 0.06, 0.12, 0.38, 0.34],
                ],
            },
            {
                focus: "Self",
                weights: [
                    [0.45, 0.10, 0.08, 0.08, 0.08, 0.05, 0.06, 0.10],
                    [0.08, 0.45, 0.10, 0.05, 0.12, 0.05, 0.04, 0.11],
                    [0.05, 0.12, 0.42, 0.06, 0.12, 0.06, 0.05, 0.12],
                    [0.06, 0.05, 0.08, 0.42, 0.15, 0.06, 0.08, 0.10],
                    [0.04, 0.08, 0.08, 0.08, 0.42, 0.08, 0.05, 0.17],
                    [0.03, 0.05, 0.06, 0.06, 0.10, 0.42, 0.10, 0.18],
                    [0.04, 0.04, 0.04, 0.06, 0.06, 0.08, 0.42, 0.26],
                    [0.03, 0.04, 0.05, 0.04, 0.08, 0.10, 0.12, 0.54],
                ],
            },
        ],
    },
];

/* Arc path */
function arcPath(
    from: { x: number; y: number },
    to: { x: number; y: number },
): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.min(dist * 0.32, 55);
    const midX = (from.x + to.x) / 2;
    const midY = Math.min(from.y, to.y) - curvature;
    return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
}

/* ═══════════════════════════════════════
   Single Head Panel (mini attention web)
   ═══════════════════════════════════════ */
function HeadPanel({
    words,
    head,
    headIdx,
    hoveredWord,
    onHoverWord,
    onLeave,
    isFocused,
    isDimmed,
}: {
    words: string[];
    head: SentenceData["heads"][0];
    headIdx: number;
    hoveredWord: number | null;
    onHoverWord: (i: number) => void;
    onLeave: () => void;
    isFocused: boolean;
    isDimmed: boolean;
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

    /* Re-measure when words change */
    useEffect(() => {
        wordRefs.current = wordRefs.current.slice(0, words.length);
        requestAnimationFrame(measure);
    }, [words, measure]);

    const active = hoveredWord;
    const weights = active !== null && active < head.weights.length ? head.weights[active] : null;

    return (
        <motion.div
            className="px-3 py-3 sm:py-4"
            style={{
                borderLeft: `2px solid ${isFocused ? "rgba(34,211,238,0.3)" : "rgba(255,255,255,0.06)"}`,
            }}
            animate={{ opacity: isDimmed ? 0.25 : 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Head label */}
            <p
                className="text-[13px] uppercase tracking-[0.15em] font-semibold mb-2 text-center"
                style={{ color: isFocused ? "rgba(34,211,238,0.7)" : "rgba(255,255,255,0.4)" }}
            >
                {head.focus}
            </p>

            {/* Sentence + arcs */}
            <div ref={containerRef} className="relative">
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ overflow: "visible", zIndex: 1 }}
                >
                    <AnimatePresence>
                        {active !== null && positions.length === words.length && weights &&
                            words.map((_, toIdx) => {
                                if (toIdx === active) return null;
                                const w = weights[toIdx];
                                if (w < 0.06) return null;
                                const from = positions[active];
                                const to = positions[toIdx];
                                if (!from || !to) return null;
                                const path = arcPath(from, to);
                                const opacity = Math.max(0.1, w * 0.7);
                                const width = 0.4 + w * 2.5;
                                const isAmber = w >= 0.28;
                                const rgb = isAmber ? "251,191,36" : "34,211,238";
                                return (
                                    <motion.path
                                        key={`arc-${headIdx}-${active}-${toIdx}`}
                                        d={path}
                                        fill="none"
                                        stroke={`rgba(${rgb},${opacity})`}
                                        strokeWidth={width}
                                        strokeLinecap="round"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                                        transition={{
                                            pathLength: { duration: 0.4, delay: toIdx * 0.015, ease: "easeOut" },
                                            opacity: { duration: 0.25, delay: toIdx * 0.015 },
                                        }}
                                    />
                                );
                            })
                        }
                    </AnimatePresence>
                </svg>

                {/* Words */}
                <div
                    className="flex items-baseline gap-x-[0.25em] flex-wrap justify-center relative z-10 py-4 sm:py-5 leading-[2.2]"
                    onMouseLeave={onLeave}
                >
                    {words.map((word, i) => {
                        const isActive = active === i;
                        const isTarget = active !== null && weights !== null && i !== active;
                        const w = isTarget ? (weights[i] ?? 0) : 0;
                        const isStrong = w > 0.15;
                        const isAmber = w >= 0.28;

                        const color = isActive
                            ? "#67e8f9"
                            : isAmber
                                ? `rgba(251,191,36,${0.7 + w * 0.4})`
                                : isStrong
                                    ? `rgba(34,211,238,${0.55 + w * 0.7})`
                                    : active !== null
                                        ? `rgba(255,255,255,${0.3 + w * 1.8})`
                                        : "rgba(255,255,255,0.55)";

                        return (
                            <motion.span
                                key={i}
                                ref={(el) => { wordRefs.current[i] = el; }}
                                className="relative cursor-pointer select-none font-medium"
                                style={{
                                    fontSize: "clamp(0.815rem, 1.5vw, 1rem)",
                                    color,
                                    transition: "color 0.25s ease",
                                }}
                                onMouseEnter={() => {
                                    onHoverWord(i);
                                    requestAnimationFrame(measure);
                                }}
                                animate={{ scale: isActive ? 1.05 : 1 }}
                                transition={{ duration: 0.2 }}
                            >
                                {isActive && (
                                    <span
                                        className="absolute -bottom-0.5 left-0 right-0 h-px rounded-full pointer-events-none"
                                        style={{ background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.4), transparent)" }}
                                    />
                                )}
                                <span className="relative z-10">{word}</span>
                            </motion.span>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════
   Main Component
   ═══════════════════════════════════════ */
export function MultiLensViewViz() {
    const [sentIdx, setSentIdx] = useState(0);
    const [hoveredWord, setHoveredWord] = useState<number | null>(null);
    const [focusedHead, setFocusedHead] = useState<number | null>(null);

    const sent = SENTENCES[sentIdx];
    const headFocuses = useMemo(() => sent.heads.map(h => h.focus), [sent]);

    const handleHover = useCallback((i: number) => setHoveredWord(i), []);
    const handleLeave = useCallback(() => setHoveredWord(null), []);

    return (
        <div className="py-6 sm:py-8 px-2 sm:px-4" style={{ minHeight: 400 }}>
            {/* Sentence selector */}
            <div className="flex items-center justify-center gap-1.5 mb-4">
                {SENTENCES.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => { setSentIdx(i); setHoveredWord(null); setFocusedHead(null); }}
                        className="px-3 py-1 text-[13px] font-semibold transition-all cursor-pointer"
                        style={{
                            color: i === sentIdx ? "#22d3ee" : "rgba(255,255,255,0.35)",
                            borderBottom: i === sentIdx ? "2px solid rgba(34,211,238,0.4)" : "2px solid transparent",
                        }}
                    >
                        &quot;{s.label}&quot;
                    </button>
                ))}
            </div>

            {/* Current sentence display */}
            <div className="text-center mb-3">
                <p className="text-sm text-white/40 italic">
                    {sent.words.join(" ")}
                </p>
            </div>

            {/* Head tabs */}
            <div className="flex items-center justify-center gap-1.5 mb-4">
                <button
                    onClick={() => setFocusedHead(null)}
                    className="px-3 py-1 text-[13px] uppercase tracking-[0.12em] font-semibold transition-all cursor-pointer"
                    style={{
                        color: focusedHead === null ? "rgba(34,211,238,0.8)" : "rgba(255,255,255,0.3)",
                        borderBottom: focusedHead === null ? "1px solid rgba(34,211,238,0.3)" : "1px solid transparent",
                    }}
                >
                    All
                </button>
                {headFocuses.map((focus, i) => (
                    <button
                        key={focus}
                        onClick={() => setFocusedHead(focusedHead === i ? null : i)}
                        className="px-3 py-1 text-[13px] uppercase tracking-[0.12em] font-semibold transition-all cursor-pointer"
                        style={{
                            color: focusedHead === i ? "#22d3ee" : "rgba(255,255,255,0.4)",
                            borderBottom: focusedHead === i ? "1px solid rgba(34,211,238,0.3)" : "1px solid transparent",
                        }}
                    >
                        {focus}
                    </button>
                ))}
            </div>

            {/* 4 head panels — 2×2 grid */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={sentIdx}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-w-3xl mx-auto"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                >
                    {sent.heads.map((head, i) => (
                        <HeadPanel
                            key={`${sentIdx}-${i}`}
                            words={sent.words}
                            head={head}
                            headIdx={i}
                            hoveredWord={hoveredWord}
                            onHoverWord={handleHover}
                            onLeave={handleLeave}
                            isFocused={focusedHead === null || focusedHead === i}
                            isDimmed={focusedHead !== null && focusedHead !== i}
                        />
                    ))}
                </motion.div>
            </AnimatePresence>

            {/* Caption */}
            <AnimatePresence mode="wait">
                {hoveredWord !== null ? (
                    <motion.div
                        key={`caption-${hoveredWord}`}
                        className="max-w-md mx-auto mt-4 text-center"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.25 }}
                    >
                        <p className="text-sm text-white/45 leading-relaxed">
                            <strong className="text-cyan-400">&quot;{sent.words[hoveredWord]}&quot;</strong>{" "}
                            — each head attends to completely different words.
                            Same input, four different perspectives.
                        </p>
                    </motion.div>
                ) : (
                    <motion.p
                        key="idle"
                        className="text-center text-[13px] text-white/35 mt-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        Switch sentences and hover over any word — watch all 4 heads respond
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
