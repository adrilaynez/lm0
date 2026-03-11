"use client";

import { useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  CausalMaskViz — §08 Beat 3 (REBUILD)

  Interactive 8×8 causal attention mask on character-level sequence.
  Click any row to see what that position can attend to.
  Toggle: "With mask" (triangle) vs "Without mask" (full — cheating).

  One concept: causal masking prevents looking into the future.
*/

const CHARS = ["t", "h", "e", " ", "c", "a", "t", " "];
const N = CHARS.length;

const displayChar = (ch: string) => (ch === " " ? "␣" : ch);

/* Pre-computed fake attention weights — row i can attend to cols 0..i */
function computeWeights(row: number, masked: boolean): number[] {
    const raw = Array.from({ length: N }, (_, col) => {
        if (masked && col > row) return -Infinity;
        /* Slightly realistic: nearby positions get higher scores */
        const dist = Math.abs(row - col);
        return 2.0 - dist * 0.3 + Math.sin(row * 5 + col * 3) * 0.5;
    });
    /* Softmax */
    const finite = raw.filter((v) => v !== -Infinity);
    const max = Math.max(...finite);
    const exps = raw.map((v) => (v === -Infinity ? 0 : Math.exp(v - max)));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map((e) => e / sum);
}

export function CausalMaskViz() {
    const [selectedRow, setSelectedRow] = useState(4);
    const [showMask, setShowMask] = useState(true);

    /* Weights for selected row */
    const weights = useMemo(
        () => computeWeights(selectedRow, showMask),
        [selectedRow, showMask],
    );

    /* All rows weights for the grid */
    const allWeights = useMemo(
        () => Array.from({ length: N }, (_, r) => computeWeights(r, showMask)),
        [showMask],
    );

    /* What selected row can see */
    const canSee = useMemo(() => {
        const limit = showMask ? selectedRow + 1 : N;
        return CHARS.slice(0, limit);
    }, [selectedRow, showMask]);

    const cannotSee = useMemo(() => {
        if (!showMask) return [];
        return CHARS.slice(selectedRow + 1);
    }, [selectedRow, showMask]);

    return (
        <div className="flex flex-col items-center gap-6 w-full py-2">
            {/* ── Toggle ── */}
            <div
                className="inline-flex rounded-xl p-1"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
                <button
                    onClick={() => setShowMask(true)}
                    className="px-4 py-1.5 rounded-lg text-[12px] font-semibold tracking-wide transition-all duration-200"
                    style={{
                        background: showMask ? "rgba(34,211,238,0.15)" : "transparent",
                        color: showMask ? "rgba(34,211,238,1)" : "rgba(255,255,255,0.3)",
                    }}
                >
                    With mask
                </button>
                <button
                    onClick={() => setShowMask(false)}
                    className="px-4 py-1.5 rounded-lg text-[12px] font-semibold tracking-wide transition-all duration-200"
                    style={{
                        background: !showMask ? "rgba(244,63,94,0.15)" : "transparent",
                        color: !showMask ? "rgba(244,63,94,0.9)" : "rgba(255,255,255,0.3)",
                    }}
                >
                    Without mask
                </button>
            </div>

            {/* ── Character labels (top) ── */}
            <div className="w-full max-w-[420px] mx-auto">
                <div className="flex items-end ml-[42px]">
                    {CHARS.map((ch, i) => (
                        <div key={i} className="flex-1 text-center pb-1">
                            <span
                                className="text-[11px] font-mono font-semibold"
                                style={{
                                    color: selectedRow !== null && (showMask ? i <= selectedRow : true)
                                        ? "rgba(255,255,255,0.7)"
                                        : "rgba(255,255,255,0.2)",
                                    transition: "color 0.2s",
                                }}
                            >
                                {displayChar(ch)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* ── Grid ── */}
                <div className="flex flex-col gap-[2px]">
                    {CHARS.map((ch, row) => {
                        const isSelected = row === selectedRow;
                        return (
                            <div
                                key={row}
                                className="flex items-center gap-0 cursor-pointer"
                                onClick={() => setSelectedRow(row)}
                            >
                                {/* Row label */}
                                <div
                                    className="flex items-center justify-end pr-2 shrink-0"
                                    style={{ width: 42 }}
                                >
                                    <span
                                        className="text-[11px] font-mono font-semibold transition-colors duration-200"
                                        style={{
                                            color: isSelected
                                                ? "rgba(34,211,238,1)"
                                                : "rgba(255,255,255,0.3)",
                                        }}
                                    >
                                        {displayChar(ch)}
                                    </span>
                                </div>

                                {/* Cells */}
                                {Array.from({ length: N }, (_, col) => {
                                    const isMasked = showMask && col > row;
                                    const w = allWeights[row][col];
                                    const isSelectedCell = isSelected;

                                    return (
                                        <div key={col} className="flex-1 px-[1px]">
                                            <motion.div
                                                className="w-full flex items-center justify-center"
                                                style={{
                                                    aspectRatio: "1",
                                                    borderRadius: 4,
                                                    fontSize: 9,
                                                    fontFamily: "monospace",
                                                    fontWeight: 500,
                                                }}
                                                animate={{
                                                    backgroundColor: isMasked
                                                        ? "rgba(244,63,94,0.12)"
                                                        : isSelectedCell
                                                            ? `rgba(34,211,238,${Math.min(w * 1.8 + 0.08, 0.75)})`
                                                            : `rgba(34,211,238,${Math.min(w * 1.2 + 0.04, 0.45)})`,
                                                    borderColor: isMasked
                                                        ? "rgba(244,63,94,0.2)"
                                                        : isSelectedCell
                                                            ? `rgba(34,211,238,${Math.min(w * 1.5 + 0.2, 0.8)})`
                                                            : `rgba(34,211,238,${Math.min(w * 0.5 + 0.05, 0.2)})`,
                                                    boxShadow: !isMasked && isSelectedCell && w > 0.15
                                                        ? `0 0 8px rgba(34,211,238,${Math.min(w * 0.6, 0.35)})`
                                                        : "none",
                                                    borderWidth: 1,
                                                    borderStyle: "solid" as const,
                                                }}
                                                transition={{ duration: 0.25 }}
                                            >
                                                {isMasked ? (
                                                    <motion.span
                                                        animate={{
                                                            color: isSelected
                                                                ? "rgba(244,63,94,0.9)"
                                                                : "rgba(244,63,94,0.25)",
                                                        }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        −∞
                                                    </motion.span>
                                                ) : (
                                                    <motion.span
                                                        animate={{
                                                            color: isSelectedCell
                                                                ? `rgba(255,255,255,${Math.min(w * 2.5 + 0.3, 1.0)})`
                                                                : `rgba(255,255,255,${Math.min(w * 1.8 + 0.15, 0.7)})`,
                                                            textShadow: isSelectedCell && w > 0.1
                                                                ? `0 0 8px rgba(34,211,238,${Math.min(w * 1.2, 0.6)})`
                                                                : "none",
                                                        }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        {(w * 100).toFixed(0)}
                                                    </motion.span>
                                                )}
                                            </motion.div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Detail panel ── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${selectedRow}-${showMask}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-[440px] rounded-xl px-5 py-3.5"
                    style={{
                        background: showMask
                            ? "rgba(34,211,238,0.03)"
                            : "rgba(244,63,94,0.03)",
                        border: `1px solid ${showMask ? "rgba(34,211,238,0.08)" : "rgba(244,63,94,0.08)"}`,
                    }}
                >
                    {/* Position header */}
                    <p className="text-[13px] mb-2">
                        <span className="font-semibold" style={{ color: "rgba(34,211,238,1)" }}>
                            Position {selectedRow + 1}
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.25)" }}> — </span>
                        <span className="font-mono font-semibold" style={{ color: "rgba(34,211,238,0.9)" }}>
                            &ldquo;{displayChar(CHARS[selectedRow])}&rdquo;
                        </span>
                    </p>

                    {/* Can see */}
                    <p className="text-[12px] leading-relaxed">
                        <span style={{ color: "rgba(255,255,255,0.3)" }}>attends to: </span>
                        {canSee.map((ch, i) => (
                            <span key={i}>
                                <span className="font-mono font-semibold" style={{ color: "rgba(34,211,238,0.85)" }}>
                                    {displayChar(ch)}
                                </span>
                                {i < canSee.length - 1 && (
                                    <span style={{ color: "rgba(255,255,255,0.1)" }}> </span>
                                )}
                            </span>
                        ))}
                    </p>

                    {/* Cannot see (only with mask) */}
                    {cannotSee.length > 0 && (
                        <p className="text-[12px] leading-relaxed mt-1">
                            <span style={{ color: "rgba(255,255,255,0.2)" }}>blocked: </span>
                            {cannotSee.map((ch, i) => (
                                <span key={i}>
                                    <span className="font-mono" style={{ color: "rgba(244,63,94,0.65)" }}>
                                        {displayChar(ch)}
                                    </span>
                                    {i < cannotSee.length - 1 && (
                                        <span style={{ color: "rgba(255,255,255,0.06)" }}> </span>
                                    )}
                                </span>
                            ))}
                            <span className="font-mono ml-2" style={{ color: "rgba(244,63,94,0.5)" }}>
                                → 0.00
                            </span>
                        </p>
                    )}

                    {/* No-mask warning */}
                    {!showMask && (
                        <p className="text-[11px] mt-2 font-medium" style={{ color: "rgba(244,63,94,0.7)" }}>
                            Every position sees every other — including the answer. 100% accuracy by copying, not learning.
                        </p>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* ── Caption ── */}
            <p
                className="text-[12px] text-center max-w-[360px]"
                style={{ color: "rgba(255,255,255,0.3)" }}
            >
                {showMask
                    ? "Click any row. Each position only looks backward — it must actually predict."
                    : "Toggle the mask back on to see how we prevent cheating."
                }
            </p>
        </div>
    );
}
