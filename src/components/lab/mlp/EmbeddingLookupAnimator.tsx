"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Play, RotateCcw, Sparkles } from "lucide-react";

/*
  EmbeddingLookupAnimator — Redesigned
  A cinematic, auto-playing animation showing:
  1. Pick a letter
  2. Build one-hot vector (with visual scanner)
  3. One-hot "scans" the embedding table, highlighting the matching row
  4. The matching row "slides out" to become the embedding vector
  
  Key improvements: auto-play, visual flow arrows, row-highlight scanner,
  the result physically "detaches" from the table, descriptive labels.
*/

const VOCAB = ["a", "b", "c", "d", "e"];
const V = VOCAB.length;
const D = 3;
const DIM_LABELS = ["freq", "vowel", "shape"];

const E_MATRIX: number[][] = [
    [0.82, 0.91, -0.31],  // a
    [-0.44, 0.12, 0.67],   // b
    [-0.21, 0.08, 0.88],   // c
    [0.15, 0.05, -0.55],  // d
    [0.78, 0.88, -0.22],  // e
];

type Phase = "idle" | "onehot" | "scan" | "extract" | "done";

export function EmbeddingLookupAnimator() {
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [phase, setPhase] = useState<Phase>("idle");
    const [scanRow, setScanRow] = useState(-1);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const embedding = E_MATRIX[selectedIdx];

    const clearTimers = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
    }, []);

    useEffect(() => () => clearTimers(), [clearTimers]);

    const play = useCallback(() => {
        clearTimers();
        setPhase("onehot");
        setScanRow(-1);

        // After one-hot appears, start scanning
        timerRef.current = setTimeout(() => {
            setPhase("scan");
            let row = 0;
            const scanNext = () => {
                setScanRow(row);
                if (row === selectedIdx) {
                    // Found it — pause then extract
                    timerRef.current = setTimeout(() => {
                        setPhase("extract");
                        timerRef.current = setTimeout(() => setPhase("done"), 600);
                    }, 500);
                } else {
                    row++;
                    timerRef.current = setTimeout(scanNext, 200);
                }
            };
            scanNext();
        }, 600);
    }, [selectedIdx, clearTimers]);

    const reset = useCallback(() => {
        clearTimers();
        setPhase("idle");
        setScanRow(-1);
    }, [clearTimers]);

    const selectAndReset = (idx: number) => {
        clearTimers();
        setSelectedIdx(idx);
        setPhase("idle");
        setScanRow(-1);
    };

    const showOneHot = phase !== "idle";
    const showMatrix = phase !== "idle";
    const isScanning = phase === "scan";
    const isExtracted = phase === "extract" || phase === "done";
    const isDone = phase === "done";

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {/* Token selector */}
            <div className="flex flex-col items-center gap-3">
                <span className="text-[10px] font-mono text-white/25 uppercase tracking-widest">Select a character</span>
                <div className="flex gap-2">
                    {VOCAB.map((ch, i) => (
                        <motion.button
                            key={ch}
                            onClick={() => selectAndReset(i)}
                            whileHover={{ scale: 1.12, y: -3 }}
                            whileTap={{ scale: 0.92 }}
                            className="w-12 h-12 rounded-xl text-lg font-mono font-bold transition-all"
                            style={{
                                backgroundColor: i === selectedIdx ? "#a78bfa18" : "rgba(255,255,255,0.02)",
                                color: i === selectedIdx ? "#a78bfa" : "rgba(255,255,255,0.3)",
                                borderWidth: 2,
                                borderColor: i === selectedIdx ? "#a78bfa50" : "rgba(255,255,255,0.06)",
                                boxShadow: i === selectedIdx ? "0 0 24px rgba(167,139,250,0.2), inset 0 0 12px rgba(167,139,250,0.05)" : "none",
                            }}
                        >
                            {ch}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Main visualization */}
            <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.02] to-transparent p-5 sm:p-6">
                <div className="flex items-start justify-center gap-4 sm:gap-6 flex-wrap min-h-[220px]">
                    {/* One-hot vector */}
                    <AnimatePresence>
                        {showOneHot && (
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col items-center"
                            >
                                <span className="text-[9px] font-mono text-white/25 mb-2">one-hot(&quot;{VOCAB[selectedIdx]}&quot;)</span>
                                <div className="flex flex-col gap-0.5">
                                    {VOCAB.map((ch, i) => {
                                        const isOne = i === selectedIdx;
                                        const isBeingScanned = isScanning && i === scanRow;
                                        return (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{
                                                    opacity: 1,
                                                    x: 0,
                                                    scale: isBeingScanned ? 1.1 : 1,
                                                }}
                                                transition={{ delay: i * 0.06 }}
                                                className="flex items-center gap-1.5"
                                            >
                                                <span className="text-[8px] font-mono text-white/15 w-3">{ch}</span>
                                                <div
                                                    className="w-10 h-6 rounded flex items-center justify-center text-xs font-mono font-bold transition-all"
                                                    style={{
                                                        backgroundColor: isOne ? "#a78bfa30" : "rgba(255,255,255,0.03)",
                                                        color: isOne ? "#a78bfa" : "rgba(255,255,255,0.12)",
                                                        borderWidth: 1,
                                                        borderColor: isBeingScanned ? "#a78bfa60" : isOne ? "#a78bfa30" : "rgba(255,255,255,0.04)",
                                                        boxShadow: isBeingScanned ? "0 0 8px rgba(167,139,250,0.3)" : "none",
                                                    }}
                                                >
                                                    {isOne ? "1" : "0"}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Arrow */}
                    {showMatrix && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center self-center"
                        >
                            <ArrowRight className="w-5 h-5 text-white/15" />
                            <span className="text-[7px] font-mono text-white/15 mt-0.5">×</span>
                        </motion.div>
                    )}

                    {/* Embedding matrix */}
                    <AnimatePresence>
                        {showMatrix && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center"
                            >
                                <span className="text-[9px] font-mono text-white/25 mb-2">Embedding Table E</span>
                                {/* Dimension headers */}
                                <div className="flex gap-0.5 mb-1 ml-6">
                                    {DIM_LABELS.map(label => (
                                        <div key={label} className="w-14 text-center text-[7px] font-mono text-white/15">
                                            {label}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    {E_MATRIX.map((row, i) => {
                                        const isMatch = i === selectedIdx;
                                        const isBeingScanned = isScanning && i === scanRow;
                                        const wasScanned = isScanning && i < scanRow;
                                        const isHighlighted = isMatch && (isExtracted || isDone);
                                        return (
                                            <motion.div
                                                key={i}
                                                className="flex items-center gap-1"
                                                animate={{
                                                    y: isHighlighted ? 4 : 0,
                                                    scale: isBeingScanned && isMatch ? 1.05 : 1,
                                                }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <span className="text-[9px] font-mono w-4 text-right" style={{
                                                    color: isMatch ? "#a78bfa" : "rgba(255,255,255,0.15)",
                                                    fontWeight: isMatch ? 700 : 400,
                                                }}>
                                                    {VOCAB[i]}
                                                </span>
                                                <div className="flex gap-0.5">
                                                    {row.map((val, j) => (
                                                        <motion.div
                                                            key={j}
                                                            className="w-14 h-7 rounded flex items-center justify-center text-[10px] font-mono tabular-nums transition-all"
                                                            style={{
                                                                backgroundColor: isHighlighted
                                                                    ? "#34d39920"
                                                                    : isBeingScanned
                                                                        ? (isMatch ? "#a78bfa25" : "rgba(255,255,255,0.06)")
                                                                        : wasScanned
                                                                            ? "rgba(255,255,255,0.01)"
                                                                            : "rgba(255,255,255,0.03)",
                                                                color: isHighlighted
                                                                    ? "#34d399"
                                                                    : isBeingScanned
                                                                        ? (isMatch ? "#a78bfa" : "rgba(255,255,255,0.3)")
                                                                        : wasScanned
                                                                            ? "rgba(255,255,255,0.1)"
                                                                            : "rgba(255,255,255,0.25)",
                                                                fontWeight: isHighlighted || (isBeingScanned && isMatch) ? 700 : 400,
                                                                borderWidth: 1,
                                                                borderColor: isHighlighted
                                                                    ? "#34d39940"
                                                                    : isBeingScanned && isMatch
                                                                        ? "#a78bfa50"
                                                                        : "rgba(255,255,255,0.04)",
                                                                boxShadow: isHighlighted ? "0 0 10px rgba(52,211,153,0.15)" : "none",
                                                            }}
                                                            animate={{
                                                                scale: isHighlighted ? [1, 1.08, 1] : 1,
                                                            }}
                                                            transition={{ delay: j * 0.08, duration: 0.3 }}
                                                        >
                                                            {val >= 0 ? "+" : ""}{val.toFixed(2)}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Arrow to result */}
                    {isExtracted && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center self-center"
                        >
                            <ArrowRight className="w-5 h-5 text-emerald-400/30" />
                            <span className="text-[7px] font-mono text-emerald-400/20 mt-0.5">=</span>
                        </motion.div>
                    )}

                    {/* Result embedding vector */}
                    <AnimatePresence>
                        {isDone && (
                            <motion.div
                                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                className="flex flex-col items-center"
                            >
                                <span className="text-[9px] font-mono text-emerald-400/50 mb-2">
                                    embed(&quot;{VOCAB[selectedIdx]}&quot;)
                                </span>
                                <div className="flex flex-col gap-0.5">
                                    {embedding.map((val, j) => (
                                        <motion.div
                                            key={j}
                                            initial={{ opacity: 0, x: -10, scale: 0.8 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            transition={{ delay: 0.1 + j * 0.1, type: "spring", bounce: 0.4 }}
                                            className="flex items-center gap-1.5"
                                        >
                                            <div
                                                className="w-16 h-7 rounded flex items-center justify-center text-xs font-mono font-bold tabular-nums"
                                                style={{
                                                    background: `rgba(52,211,153,${0.08 + Math.abs(val) * 0.15})`,
                                                    color: "#34d399",
                                                    borderWidth: 1,
                                                    borderColor: "#34d39940",
                                                    boxShadow: "0 0 8px rgba(52,211,153,0.1)",
                                                }}
                                            >
                                                {val >= 0 ? "+" : ""}{val.toFixed(2)}
                                            </div>
                                            <span className="text-[7px] font-mono text-white/15">{DIM_LABELS[j]}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Idle state */}
                    {phase === "idle" && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center gap-4 py-10"
                        >
                            <div className="text-center space-y-2">
                                <p className="text-base text-white/40 font-mono">
                                    How does <span className="text-violet-400 font-bold">&quot;{VOCAB[selectedIdx]}&quot;</span> become a vector?
                                </p>
                                <p className="text-[11px] text-white/20 font-mono">
                                    One-hot encoding × Embedding matrix = Dense vector
                                </p>
                            </div>
                            <motion.button
                                onClick={play}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-mono font-bold
                                    bg-gradient-to-r from-violet-500/20 to-emerald-500/15 text-violet-300 border border-violet-500/30
                                    hover:from-violet-500/30 hover:to-emerald-500/25 transition-all
                                    shadow-[0_0_30px_rgba(139,92,246,0.12)]"
                            >
                                <Play className="w-4 h-4" />
                                Watch the lookup
                            </motion.button>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Bottom controls + insight */}
            <div className="flex items-center justify-between">
                {phase !== "idle" && (
                    <button
                        onClick={reset}
                        className="flex items-center gap-1.5 text-[10px] font-mono px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/30 hover:text-white/50 transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                    </button>
                )}
                <div />
                {isDone && (
                    <motion.p
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[11px] font-mono text-emerald-400/60 flex items-center gap-1.5"
                    >
                        <Sparkles className="w-3 h-3" />
                        Row {selectedIdx} of E → that&apos;s the embedding!
                    </motion.p>
                )}
            </div>

            {/* Insight box */}
            {isDone && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] to-transparent p-5"
                >
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs font-mono font-bold text-emerald-300/80 mb-1">The one-hot vector picks one row</p>
                            <p className="text-[11px] text-white/45 leading-relaxed">
                                The 1 at position {selectedIdx} selects row {selectedIdx} from the table.
                                Mathematically it&apos;s a matrix multiply, but in practice it&apos;s just a <em className="text-emerald-400/60">table lookup</em>.
                                Each row stores the learned features for that character.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
