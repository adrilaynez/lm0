"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  EmbeddingAttentionFailureViz — §04a "The Deeper Problem"

  Same sentence as SpotlightViz: "The king who wore the golden crown ruled the vast kingdom wisely"
  But instead of learned attention weights, this uses RAW EMBEDDING SIMILARITY (dot product).

  THE POINT: With raw embeddings, each word finds words SIMILAR to itself.
  - "king" → "crown", "kingdom" (royal nouns — but NOT "ruled" which is what king actually NEEDS)
  - "golden" → "vast" (both adjectives — but NOT "crown" which golden modifies)
  - "ruled" → "wore" (both verbs — but NOT "king" or "kingdom" which are its subject/object)

  The learner sees that similarity ≠ relevance.
  A word doesn't search for copies of itself — it searches for COMPLEMENTS.
*/

const WORDS = ["The", "king", "who", "wore", "the", "golden", "crown", "ruled", "the", "vast", "kingdom", "wisely"];

/* Word categories for color-coding */
type WordCategory = "function" | "noun" | "verb" | "adjective" | "adverb" | "pronoun";

const CATEGORIES: WordCategory[] = [
    "function", "noun", "pronoun", "verb", "function", "adjective", "noun", "verb", "function", "adjective", "noun", "adverb",
];

const CATEGORY_COLORS: Record<WordCategory, { rgb: string; label: string }> = {
    function: { rgb: "255,255,255", label: "function word" },
    noun: { rgb: "34,211,238", label: "noun" },
    verb: { rgb: "251,191,36", label: "verb" },
    adjective: { rgb: "52,211,153", label: "adjective" },
    adverb: { rgb: "167,139,250", label: "adverb" },
    pronoun: { rgb: "244,114,182", label: "pronoun" },
};

/*
  Simulated raw embedding similarity scores (dot products).
  Key insight: embeddings cluster by WORD TYPE, not by SYNTACTIC NEED.
  - Nouns score high with other nouns (king↔crown↔kingdom)
  - Verbs score high with other verbs (wore↔ruled)
  - Adjectives score high with other adjectives (golden↔vast)
  This is the WRONG pattern for attention — words need complements, not twins.
*/
const EMBEDDING_SIMILARITY: number[][] = [
    /*  The    king   who    wore   the    golden crown  ruled  the    vast   kingdom wisely */
    [0.95, 0.08, 0.12, 0.06, 0.90, 0.05, 0.07, 0.05, 0.90, 0.04, 0.07, 0.04], // The
    [0.08, 0.92, 0.10, 0.09, 0.07, 0.11, 0.72, 0.12, 0.07, 0.10, 0.78, 0.06], // king → crown, kingdom (other nouns!)
    [0.12, 0.10, 0.88, 0.08, 0.11, 0.06, 0.09, 0.07, 0.11, 0.05, 0.09, 0.07], // who
    [0.06, 0.09, 0.08, 0.91, 0.05, 0.10, 0.08, 0.74, 0.05, 0.09, 0.07, 0.11], // wore → ruled (other verb!)
    [0.90, 0.07, 0.11, 0.05, 0.95, 0.04, 0.06, 0.04, 0.90, 0.03, 0.06, 0.03], // the
    [0.05, 0.11, 0.06, 0.10, 0.04, 0.90, 0.12, 0.09, 0.04, 0.76, 0.10, 0.13], // golden → vast (other adj!)
    [0.07, 0.72, 0.09, 0.08, 0.06, 0.12, 0.93, 0.10, 0.06, 0.11, 0.75, 0.05], // crown → king, kingdom (nouns)
    [0.05, 0.12, 0.07, 0.74, 0.04, 0.09, 0.10, 0.92, 0.04, 0.08, 0.11, 0.13], // ruled → wore (verb)
    [0.90, 0.07, 0.11, 0.05, 0.90, 0.04, 0.06, 0.04, 0.95, 0.03, 0.06, 0.03], // the
    [0.04, 0.10, 0.05, 0.09, 0.03, 0.76, 0.11, 0.08, 0.03, 0.89, 0.10, 0.14], // vast → golden (adj)
    [0.07, 0.78, 0.09, 0.07, 0.06, 0.10, 0.75, 0.11, 0.06, 0.10, 0.94, 0.06], // kingdom → king, crown (nouns)
    [0.04, 0.06, 0.07, 0.11, 0.03, 0.13, 0.05, 0.13, 0.03, 0.14, 0.06, 0.88], // wisely
];

/* What each word ACTUALLY needs (for the insight panel) */
const WHAT_WORD_NEEDS: Record<number, { needs: string; getsInstead: string; insight: string }> = {
    1: {
        needs: "verbs and objects (ruled, crown)",
        getsInstead: "other nouns (crown, kingdom)",
        insight: "\"king\" finds words similar to itself — other royal nouns. But it should be looking for what the king DOES and what the king HAS.",
    },
    3: {
        needs: "its subject and object (king, crown)",
        getsInstead: "other verbs (ruled)",
        insight: "\"wore\" finds other verbs. But it should be looking for WHO wore and WHAT was worn.",
    },
    5: {
        needs: "the noun it modifies (crown)",
        getsInstead: "other adjectives (vast)",
        insight: "\"golden\" finds other adjectives. But it should be looking for the noun it describes — \"crown.\"",
    },
    7: {
        needs: "its subject and scope (king, kingdom)",
        getsInstead: "other verbs (wore)",
        insight: "\"ruled\" finds other verbs. But it should find WHO ruled and WHAT was ruled.",
    },
    9: {
        needs: "the noun it modifies (kingdom)",
        getsInstead: "other adjectives (golden)",
        insight: "\"vast\" finds other adjectives. But it should find the noun it describes — \"kingdom.\"",
    },
    10: {
        needs: "its ruler and its qualities (king, ruled, vast)",
        getsInstead: "other nouns (king, crown)",
        insight: "\"kingdom\" finds similar nouns. Partially useful — but it misses the verb \"ruled\" and the adjective \"vast\" that define it.",
    },
};

/* Arc path — same style as SpotlightViz */
function arcPath(from: { x: number; y: number }, to: { x: number; y: number }): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.min(dist * 0.35, 70);
    const midX = (from.x + to.x) / 2;
    const midY = Math.min(from.y, to.y) - curvature;
    return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
}

export function EmbeddingAttentionFailureViz() {
    const [hovered, setHovered] = useState<number | null>(null);
    const [locked, setLocked] = useState<number | null>(null);
    const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

    const active = locked ?? hovered;
    const weights = active !== null ? EMBEDDING_SIMILARITY[active] : null;
    const isIdle = active === null;

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

    /* Top targets (excluding self) */
    const topTargets = weights
        ? weights
            .map((w, i) => ({ w, i }))
            .filter((d) => d.i !== active)
            .sort((a, b) => b.w - a.w)
            .slice(0, 4)
        : [];

    /* Categorize top targets — are they the same type or different? */
    const activeCategory = active !== null ? CATEGORIES[active] : null;
    const sameTypeCount = topTargets.filter((t) => CATEGORIES[t.i] === activeCategory).length;

    const insightData = active !== null ? WHAT_WORD_NEEDS[active] : null;

    return (
        <div className="py-8 sm:py-12 px-2 sm:px-4" style={{ minHeight: 360 }}>
            {/* Category legend */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap mb-6">
                {(["noun", "verb", "adjective"] as WordCategory[]).map((cat) => (
                    <span key={cat} className="inline-flex items-center gap-1.5">
                        <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: `rgba(${CATEGORY_COLORS[cat].rgb}, 0.5)` }}
                        />
                        <span className="text-[10px] text-white/25">{CATEGORY_COLORS[cat].label}</span>
                    </span>
                ))}
            </div>

            {/* Sentence + arcs */}
            <div ref={containerRef} className="relative">
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ overflow: "visible", zIndex: 1 }}
                >
                    <defs>
                        <filter id="emb-arc-glow">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    <AnimatePresence>
                        {active !== null && positions.length === WORDS.length && weights &&
                            WORDS.map((_, toIdx) => {
                                if (toIdx === active) return null;
                                const w = weights[toIdx];
                                if (w < 0.08) return null;
                                const from = positions[active];
                                const to = positions[toIdx];
                                if (!from || !to) return null;
                                const path = arcPath(from, to);
                                const targetCat = CATEGORIES[toIdx];
                                const isSameType = targetCat === activeCategory;
                                const opacity = Math.max(0.06, w * 0.5);
                                const width = 0.5 + w * 2.2;
                                /* Same-type connections in amber (wrong!), cross-type in dim white */
                                const arcRgb = isSameType
                                    ? CATEGORY_COLORS[targetCat].rgb
                                    : "255, 255, 255";
                                const arcOpacity = isSameType ? opacity : opacity * 0.4;

                                return (
                                    <motion.path
                                        key={`arc-${active}-${toIdx}`}
                                        d={path}
                                        fill="none"
                                        stroke={`rgba(${arcRgb}, ${arcOpacity})`}
                                        strokeWidth={width}
                                        strokeLinecap="round"
                                        filter={isSameType && w > 0.5 ? "url(#emb-arc-glow)" : undefined}
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
                </svg>

                {/* Sentence words */}
                <div
                    className="flex items-baseline gap-x-[0.35em] sm:gap-x-[0.45em] flex-wrap justify-center relative z-10 py-10 sm:py-14 leading-[2.4] sm:leading-[2.6]"
                    onMouseLeave={() => setHovered(null)}
                >
                    {WORDS.map((word, i) => {
                        const isActive = active === i;
                        const isTarget = active !== null && weights !== null && i !== active;
                        const w = isTarget ? weights[i] : 0;
                        const isStrong = w > 0.15;
                        const isSameType = isTarget && CATEGORIES[i] === activeCategory;
                        const cat = CATEGORIES[i];
                        const catColor = CATEGORY_COLORS[cat];

                        /* Coloring: strong same-type targets glow in their category color */
                        const color = isActive
                            ? `rgba(${catColor.rgb}, 0.9)`
                            : isStrong && isSameType
                                ? `rgba(${catColor.rgb}, ${0.5 + w * 0.5})`
                                : isStrong
                                    ? `rgba(255, 255, 255, ${0.25 + w * 0.3})`
                                    : active !== null && !isActive
                                        ? "rgba(255, 255, 255, 0.18)"
                                        : "rgba(255, 255, 255, 0.65)";

                        /* Category dot under each word */
                        const showDot = cat !== "function" && cat !== "pronoun";

                        const textShadow = isActive
                            ? `0 0 20px rgba(${catColor.rgb}, 0.35), 0 0 40px rgba(${catColor.rgb}, 0.12)`
                            : isStrong && isSameType
                                ? `0 0 12px rgba(${catColor.rgb}, ${(w * 0.3).toFixed(2)})`
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
                                    setHovered(i);
                                    requestAnimationFrame(measure);
                                }}
                                onClick={() => {
                                    setLocked(locked === i ? null : i);
                                    requestAnimationFrame(measure);
                                }}
                                animate={{
                                    scale: isActive ? 1.08 : 1,
                                    y: isIdle ? [0, -1.5, 0] : 0,
                                }}
                                transition={
                                    isIdle
                                        ? {
                                            y: { duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut" },
                                            scale: { duration: 0.3 },
                                        }
                                        : { duration: 0.3, ease: "easeOut" }
                                }
                            >
                                {/* Background glow for strong same-type targets */}
                                {isStrong && isSameType && (
                                    <motion.span
                                        className="absolute inset-0 -inset-x-2 -inset-y-1 rounded-full pointer-events-none"
                                        style={{
                                            background: `radial-gradient(ellipse at center, rgba(${catColor.rgb}, ${(w * 0.14).toFixed(3)}) 0%, transparent 70%)`,
                                            filter: "blur(6px)",
                                        }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.4 }}
                                    />
                                )}

                                {/* Active word underline in category color */}
                                {isActive && (
                                    <motion.span
                                        className="absolute -bottom-1 left-0 right-0 h-[1.5px] rounded-full pointer-events-none"
                                        style={{
                                            background: `linear-gradient(90deg, transparent, rgba(${catColor.rgb}, 0.5), transparent)`,
                                        }}
                                        initial={{ scaleX: 0, opacity: 0 }}
                                        animate={{ scaleX: 1, opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}

                                {/* Category dot */}
                                {showDot && (
                                    <span
                                        className="absolute left-1/2 -translate-x-1/2 -bottom-2.5 w-1 h-1 rounded-full pointer-events-none"
                                        style={{
                                            background: `rgba(${catColor.rgb}, ${isIdle ? 0.25 : active === i ? 0.6 : 0.1})`,
                                            transition: "background 0.3s ease",
                                        }}
                                    />
                                )}

                                <span className="relative z-10">{word}</span>
                            </motion.span>
                        );
                    })}
                </div>
            </div>

            {/* Insight panel / idle hint */}
            <AnimatePresence mode="wait">
                {active !== null && topTargets.length > 0 ? (
                    <motion.div
                        key={`insight-${active}`}
                        className="max-w-lg mx-auto mt-1 sm:mt-3"
                        initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -6, filter: "blur(4px)", transition: { duration: 0.15 } }}
                        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                        {/* Top connections */}
                        <div className="flex items-center justify-center gap-x-4 gap-y-1 flex-wrap mb-3">
                            {topTargets.map(({ w, i }, rank) => {
                                const maxW = topTargets[0].w;
                                const rel = w / maxW;
                                const tCat = CATEGORIES[i];
                                const isSame = tCat === activeCategory;
                                const dotRgb = isSame ? CATEGORY_COLORS[tCat].rgb : "255, 255, 255";
                                const dotOpacity = (0.25 + rel * 0.55).toFixed(2);
                                const dotSize = Math.round(4 + rel * 4);
                                return (
                                    <motion.span
                                        key={i}
                                        className="inline-flex items-center gap-1.5"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: rank * 0.06, duration: 0.3 }}
                                    >
                                        <span
                                            className="rounded-full shrink-0"
                                            style={{
                                                width: dotSize,
                                                height: dotSize,
                                                background: `rgba(${dotRgb}, ${dotOpacity})`,
                                                boxShadow: rel > 0.5 && isSame
                                                    ? `0 0 ${dotSize * 2}px rgba(${dotRgb}, ${(rel * 0.25).toFixed(2)})`
                                                    : "none",
                                            }}
                                        />
                                        <span
                                            className="text-[13px] sm:text-sm font-medium"
                                            style={{ color: `rgba(255, 255, 255, ${0.2 + rel * 0.3})` }}
                                        >
                                            {WORDS[i]}
                                        </span>
                                        <span className="text-[10px] px-1 py-0.5 rounded" style={{
                                            background: isSame
                                                ? `rgba(${CATEGORY_COLORS[tCat].rgb}, 0.08)`
                                                : "rgba(255,255,255,0.03)",
                                            color: isSame
                                                ? `rgba(${CATEGORY_COLORS[tCat].rgb}, 0.45)`
                                                : "rgba(255,255,255,0.15)",
                                        }}>
                                            {CATEGORY_COLORS[tCat].label}
                                        </span>
                                    </motion.span>
                                );
                            })}
                        </div>

                        {/* Same-type verdict */}
                        {sameTypeCount > 0 && activeCategory && activeCategory !== "function" && (
                            <motion.div
                                className="text-center mb-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <span
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px]"
                                    style={{
                                        background: "rgba(251,191,36,0.06)",
                                        border: "1px solid rgba(251,191,36,0.12)",
                                        color: "rgba(251,191,36,0.5)",
                                    }}
                                >
                                    {sameTypeCount}/{topTargets.length} top matches are the same word type
                                </span>
                            </motion.div>
                        )}

                        {/* Insight text */}
                        {insightData && (
                            <motion.p
                                className="text-[12px] sm:text-[13px] leading-relaxed text-white/25 italic text-center max-w-md mx-auto mt-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                {insightData.insight}
                            </motion.p>
                        )}
                    </motion.div>
                ) : (
                    <motion.p
                        key="idle-hint"
                        className="text-center text-[13px] sm:text-sm text-white/30 mt-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    >
                        Hover over any word to see what raw embeddings find most similar
                    </motion.p>
                )}
            </AnimatePresence>

            {/* Secondary hint */}
            <AnimatePresence>
                {active !== null && (
                    <motion.p
                        className="text-center text-[11px] text-white/12 mt-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                    >
                        Try &ldquo;king&rdquo;, &ldquo;golden&rdquo;, or &ldquo;ruled&rdquo; — notice they always find their own kind
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
