"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { NN_COLORS } from "./visualizer-theme";

/*
  Shows a single neuron doing backpropagation:
  Forward: input × weight + bias → sigmoid → output → loss
  Backward: ∂loss/∂output × σ'(z) × input = gradient for weight
  When σ'(z) ≈ 0 (saturation), the whole gradient becomes ≈ 0 → weight doesn't update.
  User adjusts "input z to sigmoid" and watches the gradient chain collapse.
*/

function sigmoid(z: number) { return 1 / (1 + Math.exp(-z)); }
function sigmoidDeriv(z: number) { const s = sigmoid(z); return s * (1 - s); }

const TARGET = 0.2;
const LR = 0.5;

export function BackpropZeroDemo() {
    const { t } = useI18n();
    const [z, setZ] = useState(0);
    const [weight, setWeight] = useState(1.5);

    const output = sigmoid(z);
    const loss = (output - TARGET) ** 2;

    // Backprop chain
    const dLoss_dOutput = 2 * (output - TARGET);
    const dOutput_dZ = sigmoidDeriv(z);
    const dZ_dW = z / (weight || 0.001); // z = w * x, so dz/dw = x ≈ z/w
    const gradient = dLoss_dOutput * dOutput_dZ * dZ_dW;

    // Simulate one weight update
    const newWeight = weight - LR * gradient;
    const weightChanged = Math.abs(gradient) > 0.001;

    const isFlat = Math.abs(dOutput_dZ) < 0.03;
    const statusColor = isFlat ? NN_COLORS.error.hex : NN_COLORS.output.hex;

    // Chain step data
    const chainSteps = [
        { label: "∂Loss/∂out", value: dLoss_dOutput, desc: "How output affects loss" },
        { label: "σ'(z)", value: dOutput_dZ, desc: "Sigmoid derivative", critical: true },
        { label: "∂z/∂w", value: dZ_dW, desc: "How weight affects z" },
    ];

    return (
        <div className="space-y-4">
            {/* Z slider */}
            <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-white/40 shrink-0">pre-activation z</span>
                <input
                    type="range"
                    min={-6} max={6} step={0.1}
                    value={z}
                    onChange={e => setZ(+e.target.value)}
                    className="flex-1 cursor-pointer"
                    style={{ accentColor: NN_COLORS.input.hex }}
                />
                <span className="text-sm font-mono font-bold w-10 text-right text-white/60">
                    {z.toFixed(1)}
                </span>
            </div>

            {/* Forward pass */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-[8px] font-mono uppercase tracking-widest text-white/20 mb-2">
                    Forward pass
                </p>
                <div className="flex items-center gap-2 justify-center flex-wrap">
                    <div className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-1.5 text-center">
                        <p className="text-[7px] font-mono text-white/20">z</p>
                        <p className="text-xs font-mono font-bold text-white/60">{z.toFixed(2)}</p>
                    </div>
                    <span className="text-[8px] font-mono text-white/20">→ σ →</span>
                    <div className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-1.5 text-center">
                        <p className="text-[7px] font-mono text-white/20">output</p>
                        <p className="text-xs font-mono font-bold" style={{ color: NN_COLORS.output.hex }}>{output.toFixed(4)}</p>
                    </div>
                    <span className="text-[8px] font-mono text-white/20">vs {TARGET} →</span>
                    <div className="rounded-lg border px-3 py-1.5 text-center"
                        style={{ borderColor: statusColor + "30", background: statusColor + "08" }}>
                        <p className="text-[7px] font-mono text-white/20">loss</p>
                        <p className="text-xs font-mono font-bold" style={{ color: statusColor }}>{loss.toFixed(4)}</p>
                    </div>
                </div>
            </div>

            {/* Backward pass — the chain rule */}
            <div className="rounded-xl border border-indigo-500/15 bg-indigo-500/[0.03] p-3">
                <p className="text-[8px] font-mono uppercase tracking-widest text-indigo-400/40 mb-3">
                    Backward pass — chain rule
                </p>

                {/* Chain multiplication */}
                <div className="flex items-center gap-1 justify-center flex-wrap mb-3">
                    {chainSteps.map((step, i) => (
                        <div key={step.label} className="flex items-center gap-1">
                            {i > 0 && <span className="text-[9px] font-mono text-white/15">×</span>}
                            <div className={`rounded-lg border px-2.5 py-1.5 text-center ${
                                step.critical && isFlat
                                    ? "border-rose-500/30 bg-rose-500/[0.08]"
                                    : "border-white/[0.06] bg-black/20"
                            }`}>
                                <p className="text-[7px] font-mono text-white/25">{step.label}</p>
                                <p className={`text-[11px] font-mono font-bold ${
                                    step.critical && isFlat ? "text-rose-400" : "text-white/60"
                                }`}>
                                    {step.value.toFixed(4)}
                                </p>
                            </div>
                        </div>
                    ))}
                    <span className="text-[9px] font-mono text-white/15">=</span>
                    <div className="rounded-lg border px-3 py-1.5 text-center"
                        style={{
                            borderColor: weightChanged ? NN_COLORS.output.hex + "30" : NN_COLORS.error.hex + "30",
                            background: weightChanged ? NN_COLORS.output.hex + "08" : NN_COLORS.error.hex + "08",
                        }}>
                        <p className="text-[7px] font-mono text-white/25">gradient</p>
                        <p className="text-[11px] font-mono font-bold" style={{
                            color: weightChanged ? NN_COLORS.output.hex : NN_COLORS.error.hex,
                        }}>
                            {gradient.toFixed(6)}
                        </p>
                    </div>
                </div>

                {/* Weight update */}
                <div className="rounded-lg bg-black/30 p-2.5 text-center">
                    <p className="text-[8px] font-mono text-white/20 mb-1">
                        w_new = w - η × gradient = {weight.toFixed(2)} - {LR} × {gradient.toFixed(4)}
                    </p>
                    <div className="flex items-center gap-3 justify-center">
                        <span className="text-[10px] font-mono text-white/30">w: {weight.toFixed(2)}</span>
                        <span className="text-[10px] font-mono text-white/20">→</span>
                        <span className="text-[10px] font-mono font-bold" style={{
                            color: weightChanged ? NN_COLORS.output.hex : NN_COLORS.error.hex,
                        }}>
                            w: {newWeight.toFixed(4)}
                        </span>
                        {!weightChanged && (
                            <span className="text-[9px] font-mono text-rose-400/60 ml-1">
                                (no change!)
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Status message */}
            <motion.div
                key={isFlat ? "flat" : "ok"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border p-3 text-center"
                style={{
                    borderColor: statusColor + "20",
                    background: statusColor + "05",
                }}
            >
                <p className="text-[11px] font-mono" style={{ color: statusColor }}>
                    {isFlat
                        ? t("neuralNetworkNarrative.backpropZero.stuck")
                        : t("neuralNetworkNarrative.backpropZero.working")
                    }
                </p>
            </motion.div>
        </div>
    );
}
