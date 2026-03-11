"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  LayerLensViz — VIZ 9

  X-ray into a multi-block model. See how attention differs per layer.
  
  - Top: input text as character boxes
  - Layer selector: 4 tabs "Block 1" – "Block 4"
  - Main: attention heatmap (rows=query, cols=key, brightness=weight)
  - Hover cell: exact weight, highlight row/col
  - Below: description per layer
  
  Concept: different layers learn different patterns.
  Block 1: local/adjacent, Block 2: word boundaries,
  Block 3: phrase structure, Block 4: long-range dependencies.
*/

const INPUT_TEXT = "First let me tell";
const TOKENS = INPUT_TEXT.split("");
const N = TOKENS.length;

const displayChar = (ch: string) => (ch === " " ? "\u2423" : ch);

/* Block descriptions */
const BLOCK_INFO: { label: string; desc: string; color: string; rgb: string }[] = [
    { label: "Block 1", desc: "Local patterns \u2014 adjacent character relationships", color: "#22d3ee", rgb: "34,211,238" },
    { label: "Block 2", desc: "Word boundaries \u2014 spacing and common letter pairs", color: "#38bdf8", rgb: "56,189,248" },
    { label: "Block 3", desc: "Phrase structure \u2014 connecting related parts of the sequence", color: "#818cf8", rgb: "129,140,248" },
    { label: "Block 4", desc: "Abstract patterns \u2014 long-range dependencies across the input", color: "#a78bfa", rgb: "167,139,250" },
];

/* Generate realistic-looking attention matrices per block */
function generateAttention(block: number): number[][] {
    const matrix: number[][] = [];
    for (let q = 0; q < N; q++) {
        const raw: number[] = [];
        for (let k = 0; k < N; k++) {
            if (k > q) { raw.push(-Infinity); continue; }
            const dist = Math.abs(q - k);
            let score: number;

            if (block === 0) {
                /* Block 1: strong local attention, decays fast */
                score = dist === 0 ? 3.0 : dist === 1 ? 2.2 : dist === 2 ? 0.8 : 0.2 - dist * 0.1;
            } else if (block === 1) {
                /* Block 2: attends to spaces and word starts */
                const isSpace = TOKENS[k] === " ";
                const afterSpace = k > 0 && TOKENS[k - 1] === " ";
                score = isSpace ? 2.5 : afterSpace ? 1.8 : dist <= 1 ? 1.5 : 0.3;
            } else if (block === 2) {
                /* Block 3: phrase-level, attends to first chars of words */
                const isWordStart = k === 0 || TOKENS[k - 1] === " ";
                score = isWordStart ? 2.2 + Math.sin(q * 0.5 + k * 0.3) * 0.5
                    : dist <= 2 ? 1.0 : 0.2;
            } else {
                /* Block 4: long-range, attends broadly including far positions */
                score = 1.0 + Math.sin(q * 0.7 + k * 1.3) * 0.8 + Math.cos(q * 0.3 - k * 0.5) * 0.6;
                if (k === 0) score += 1.2; /* always attend to start */
            }

            score += Math.sin(q * 3.7 + k * 2.1 + block * 5) * 0.15; /* tiny noise */
            raw.push(score);
        }
        /* Softmax */
        const finite = raw.filter(v => v !== -Infinity);
        const mx = Math.max(...finite);
        const exps = raw.map(v => v === -Infinity ? 0 : Math.exp(v - mx));
        const sum = exps.reduce((a, b) => a + b, 0);
        matrix.push(exps.map(e => e / sum));
    }
    return matrix;
}

const ALL_ATTENTION = [0, 1, 2, 3].map(b => generateAttention(b));

export function LayerLensViz() {
    const [block, setBlock] = useState(0);
    const [hover, setHover] = useState<{ q: number; k: number } | null>(null);

    const weights = ALL_ATTENTION[block];
    const info = BLOCK_INFO[block];

    /* Find max weight for this block (for color scaling) */
    const maxW = useMemo(() => {
        let m = 0;
        for (const row of weights) for (const w of row) if (w > m) m = w;
        return m;
    }, [weights]);

    return (
        <div className="flex flex-col items-center gap-5 w-full py-4 px-2">
            {/* ── Block tabs ── */}
            <div className="flex items-center gap-1.5">
                {BLOCK_INFO.map((b, i) => {
                    const on = block === i;
                    return (
                        <motion.button key={i}
                            onClick={() => { setBlock(i); setHover(null); }}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer"
                            animate={{
                                background: on ? `rgba(${b.rgb},0.15)` : "rgba(255,255,255,0.02)",
                                color: on ? b.color : "rgba(255,255,255,0.25)",
                                borderColor: on ? `rgba(${b.rgb},0.35)` : "rgba(255,255,255,0.05)",
                            }}
                            style={{ border: "1.5px solid" }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {b.label}
                        </motion.button>
                    );
                })}
            </div>

            {/* ── Token labels (columns) ── */}
            <div className="w-full max-w-[500px] mx-auto">
                <div className="flex items-end" style={{ marginLeft: 36 }}>
                    {TOKENS.map((ch, i) => (
                        <div key={i} className="flex-1 text-center pb-0.5">
                            <span className="text-[10px] font-mono font-semibold"
                                style={{
                                    color: hover && hover.k === i
                                        ? info.color
                                        : "rgba(255,255,255,0.35)",
                                    transition: "color 0.15s",
                                }}>
                                {displayChar(ch)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* ── Heatmap grid ── */}
                <div className="flex flex-col gap-[1.5px]">
                    {TOKENS.map((ch, q) => (
                        <div key={q} className="flex items-center gap-0">
                            {/* Row label */}
                            <div className="flex items-center justify-end pr-1.5 shrink-0" style={{ width: 36 }}>
                                <span className="text-[10px] font-mono font-semibold"
                                    style={{
                                        color: hover && hover.q === q
                                            ? info.color
                                            : "rgba(255,255,255,0.25)",
                                        transition: "color 0.15s",
                                    }}>
                                    {displayChar(ch)}
                                </span>
                            </div>

                            {/* Cells */}
                            {weights[q].map((w, k) => {
                                const isMasked = k > q;
                                const intensity = isMasked ? 0 : w / maxW;
                                const isHovered = hover?.q === q && hover?.k === k;
                                const isRowHighlight = hover?.q === q;
                                const isColHighlight = hover?.k === k;

                                return (
                                    <div key={k} className="flex-1 px-[0.5px]"
                                        onMouseEnter={() => setHover({ q, k })}
                                        onMouseLeave={() => setHover(null)}>
                                        <motion.div
                                            className="w-full flex items-center justify-center relative"
                                            style={{
                                                aspectRatio: "1",
                                                borderRadius: 3,
                                                fontSize: 8,
                                                fontFamily: "monospace",
                                                fontWeight: 600,
                                                cursor: isMasked ? "default" : "pointer",
                                            }}
                                            animate={{
                                                backgroundColor: isMasked
                                                    ? "rgba(0,0,0,0.3)"
                                                    : `rgba(${info.rgb},${(intensity * 0.65 + 0.03).toFixed(2)})`,
                                                borderColor: isHovered
                                                    ? info.color
                                                    : isMasked
                                                        ? "rgba(255,255,255,0.02)"
                                                        : isRowHighlight || isColHighlight
                                                            ? `rgba(${info.rgb},0.3)`
                                                            : `rgba(${info.rgb},${(intensity * 0.2 + 0.03).toFixed(2)})`,
                                                borderWidth: isHovered ? 1.5 : 1,
                                                borderStyle: "solid" as const,
                                            }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            {!isMasked && (
                                                <motion.span
                                                    animate={{
                                                        color: intensity > 0.4
                                                            ? `rgba(255,255,255,${Math.min(intensity * 1.2 + 0.2, 0.95)})`
                                                            : `rgba(255,255,255,${Math.min(intensity * 0.8 + 0.1, 0.4)})`,
                                                        textShadow: intensity > 0.5
                                                            ? `0 0 4px rgba(${info.rgb},${intensity * 0.4})`
                                                            : "none",
                                                    }}
                                                >
                                                    {(w * 100).toFixed(0)}
                                                </motion.span>
                                            )}
                                        </motion.div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Hover detail ── */}
            <AnimatePresence mode="wait">
                {hover && !( hover.k > hover.q) && (
                    <motion.div
                        key={`${hover.q}-${hover.k}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        className="text-center"
                    >
                        <span className="text-[12px] font-mono" style={{ color: info.color }}>
                            {"\u201C"}{displayChar(TOKENS[hover.q])}{"\u201D"}
                        </span>
                        <span className="text-[11px] text-white/25 mx-2">{"\u2192"}</span>
                        <span className="text-[12px] font-mono" style={{ color: info.color }}>
                            {"\u201C"}{displayChar(TOKENS[hover.k])}{"\u201D"}
                        </span>
                        <span className="text-[11px] text-white/30 ml-2">
                            weight: <span className="font-mono font-bold" style={{ color: info.color }}>
                                {(weights[hover.q][hover.k] * 100).toFixed(1)}%
                            </span>
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Block description ── */}
            <AnimatePresence mode="wait">
                <motion.p
                    key={block}
                    className="text-[13px] text-center max-w-sm italic"
                    style={{ color: `rgba(${info.rgb},0.5)` }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {info.desc}
                </motion.p>
            </AnimatePresence>

            {/* ── Caption ── */}
            <p className="text-[11px] text-center text-white/20 max-w-xs">
                Hover any cell to see the exact attention weight. Each block learns to focus on different patterns.
            </p>
        </div>
    );
}
