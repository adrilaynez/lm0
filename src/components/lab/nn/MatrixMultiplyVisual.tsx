"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { NN_COLORS } from "./visualizer-theme";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

/*
  Extensive matrix multiplication visualization for a math-oriented audience.
  - Interactive 2×2 example with hover highlights
  - Formal notation with KaTeX
  - Layer stacking explanation
  - Dimension analysis
  - GPU parallelism insight
*/

const W = [
    [0.3, -0.7],
    [0.5, 0.9],
];

const X_VEC = [2, 3];

function matMul(x: number[], w: number[][]): number[] {
    return w[0].map((_, col) =>
        x.reduce((sum, xi, row) => sum + xi * w[row][col], 0)
    );
}

const Y_VEC = matMul(X_VEC, W);

export function MatrixMultiplyVisual() {
    const { t } = useI18n();
    const [highlightCol, setHighlightCol] = useState<number | null>(null);
    const [showStacking, setShowStacking] = useState(false);

    const cellSize = 42;

    return (
        <div className="space-y-6">
            {/* Section 1: The core operation */}
            <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-3">
                    {t("neuralNetworkNarrative.matrixMultiply.coreOp")}
                </p>

                {/* Matrix visual */}
                <div className="flex items-center justify-center gap-3 flex-wrap mb-3">
                    {/* Input vector */}
                    <div className="flex flex-col gap-1 items-center">
                        <span className="text-[7px] font-mono text-white/20 uppercase mb-1">input (1×2)</span>
                        {X_VEC.map((val, i) => (
                            <div key={i}
                                className="rounded-md border px-3 py-1.5 text-center font-mono text-xs font-bold"
                                style={{ borderColor: NN_COLORS.input.hex + "30", background: NN_COLORS.input.hex + "10", color: NN_COLORS.input.hex }}>
                                x{i + 1}={val}
                            </div>
                        ))}
                    </div>

                    <span className="text-white/20 text-lg font-bold">×</span>

                    {/* Weight matrix */}
                    <div className="flex flex-col items-center">
                        <span className="text-[7px] font-mono text-white/20 uppercase mb-1">weights (2×2)</span>
                        <div className="grid grid-cols-2 rounded-lg border border-white/[0.08] overflow-hidden" style={{ gap: 1 }}>
                            {W.flatMap((row, r) => row.map((val, c) => {
                                const isHi = highlightCol === c;
                                return (
                                    <div key={`${r}-${c}`}
                                        className="flex flex-col items-center justify-center font-mono transition-all cursor-pointer"
                                        style={{
                                            width: cellSize, height: cellSize,
                                            background: isHi ? NN_COLORS.weight.hex + "20" : "rgba(255,255,255,0.02)",
                                        }}
                                        onMouseEnter={() => setHighlightCol(c)}
                                        onMouseLeave={() => setHighlightCol(null)}>
                                        <span className="text-[8px] text-white/25">w{r + 1}{c + 1}</span>
                                        <span className="text-xs font-bold" style={{ color: isHi ? NN_COLORS.weight.hex : "rgba(255,255,255,0.5)" }}>
                                            {val}
                                        </span>
                                    </div>
                                );
                            }))}
                        </div>
                    </div>

                    <span className="text-white/20 text-lg font-bold">=</span>

                    {/* Output vector */}
                    <div className="flex flex-col gap-1 items-center">
                        <span className="text-[7px] font-mono text-white/20 uppercase mb-1">output (1×2)</span>
                        {Y_VEC.map((val, i) => (
                            <div key={i}
                                className="rounded-md border px-3 py-1.5 text-center font-mono text-xs font-bold transition-all"
                                style={{
                                    borderColor: highlightCol === i ? NN_COLORS.output.hex + "60" : NN_COLORS.output.hex + "30",
                                    background: highlightCol === i ? NN_COLORS.output.hex + "15" : NN_COLORS.output.hex + "08",
                                    color: NN_COLORS.output.hex,
                                }}>
                                y{i + 1}={val.toFixed(1)}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Expansion formula */}
                {highlightCol !== null && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center text-[10px] font-mono text-white/40 mb-2 p-2 rounded-lg bg-white/[0.02]">
                        y{highlightCol + 1} = {X_VEC.map((x, i) => `${x} × ${W[i][highlightCol]}`).join(" + ")} = {Y_VEC[highlightCol].toFixed(1)}
                    </motion.div>
                )}
            </div>

            {/* Section 2: Formal notation */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-3">
                    {t("neuralNetworkNarrative.matrixMultiply.formalTitle")}
                </p>
                <div className="text-center mb-3 overflow-x-auto">
                    <BlockMath math="\mathbf{y} = \mathbf{x} \cdot \mathbf{W} + \mathbf{b}" />
                </div>
                <p className="text-[11px] text-white/35 leading-relaxed mb-3">
                    {t("neuralNetworkNarrative.matrixMultiply.formalDesc")}
                </p>
                <div className="text-center overflow-x-auto">
                    <BlockMath math="y_j = \sum_{i=1}^{n} x_i \cdot w_{ij} + b_j" />
                </div>
                <p className="text-[10px] text-white/25 mt-2 italic text-center">
                    {t("neuralNetworkNarrative.matrixMultiply.sumExplain")}
                </p>
            </div>

            {/* Section 3: Dimensions matter */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-3">
                    {t("neuralNetworkNarrative.matrixMultiply.dimTitle")}
                </p>
                <div className="space-y-2 text-[11px] font-mono text-white/40">
                    <p>• input: <span style={{ color: NN_COLORS.input.hex }}>(1 × n)</span> → n features</p>
                    <p>• weights: <span style={{ color: NN_COLORS.weight.hex }}>(n × m)</span> → n inputs to m outputs</p>
                    <p>• output: <span style={{ color: NN_COLORS.output.hex }}>(1 × m)</span> → m features</p>
                </div>
                <div className="mt-3 text-center overflow-x-auto">
                    <BlockMath math="\underset{(1 \times n)}{\mathbf{x}} \cdot \underset{(n \times m)}{\mathbf{W}} = \underset{(1 \times m)}{\mathbf{y}}" />
                </div>
                <p className="text-[10px] text-white/25 mt-2 italic text-center">
                    {t("neuralNetworkNarrative.matrixMultiply.dimExplain")}
                </p>
            </div>

            {/* Section 4: Layer stacking */}
            <div>
                <button
                    onClick={() => setShowStacking(!showStacking)}
                    className={`w-full px-4 py-2 rounded-lg text-[11px] font-mono font-bold border transition-all ${showStacking
                            ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                            : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white/80"
                        }`}
                >
                    {showStacking ? "▾" : "▸"} {t("neuralNetworkNarrative.matrixMultiply.stackTitle")}
                </button>

                {showStacking && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 rounded-xl border border-violet-500/10 bg-violet-500/[0.02] p-4 space-y-3">
                        <p className="text-[11px] text-white/40 leading-relaxed">
                            {t("neuralNetworkNarrative.matrixMultiply.stackDesc")}
                        </p>
                        <div className="text-center overflow-x-auto">
                            <BlockMath math="\mathbf{h}_1 = \sigma(\mathbf{x} \cdot \mathbf{W}_1 + \mathbf{b}_1)" />
                        </div>
                        <div className="text-center overflow-x-auto">
                            <BlockMath math="\mathbf{h}_2 = \sigma(\mathbf{h}_1 \cdot \mathbf{W}_2 + \mathbf{b}_2)" />
                        </div>
                        <div className="text-center overflow-x-auto">
                            <BlockMath math="\mathbf{y} = \mathbf{h}_2 \cdot \mathbf{W}_3 + \mathbf{b}_3" />
                        </div>
                        <p className="text-[10px] text-white/25 italic">
                            {t("neuralNetworkNarrative.matrixMultiply.stackNote")}
                        </p>

                        {/* Real-world scale */}
                        <div className="rounded-lg bg-black/20 border border-white/[0.05] p-3 mt-2">
                            <p className="text-[9px] font-mono text-white/20 mb-2 uppercase tracking-wider">
                                {t("neuralNetworkNarrative.matrixMultiply.scaleTitle")}
                            </p>
                            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                                <div>
                                    <p className="text-white/20">MLP (ours)</p>
                                    <p className="text-white/50 font-bold">27 × 64</p>
                                    <p className="text-white/15">~1.7K params</p>
                                </div>
                                <div>
                                    <p className="text-white/20">GPT-2</p>
                                    <p className="text-white/50 font-bold">768 × 3072</p>
                                    <p className="text-white/15">~117M params</p>
                                </div>
                                <div>
                                    <p className="text-white/20">GPT-4</p>
                                    <p className="text-white/50 font-bold">~12K × 48K</p>
                                    <p className="text-white/15">~1.8T params</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* GPU insight */}
            <p className="text-[11px] text-white/35 text-center italic leading-relaxed">
                {t("neuralNetworkNarrative.matrixMultiply.insight")}
            </p>
        </div>
    );
}
