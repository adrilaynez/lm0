"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { NN_COLORS } from "./visualizer-theme";

/*
  Static/light-interactive preview: "5 vowels (a, e, i, o, u). One neuron per vowel."
  Show a tiny network diagram: 1 input → 5 outputs.
  Teaser text: "We'll build this for real in §07."
  NOT a full trainer — just a visual promise.
*/

const VOWELS = ["a", "e", "i", "o", "u"];
const VOWEL_COLORS = [
    NN_COLORS.input.hex,
    NN_COLORS.weight.hex,
    NN_COLORS.bias.hex,
    NN_COLORS.target.hex,
    NN_COLORS.output.hex,
];

export function ToyVowelTeaser() {
    const { t } = useI18n();
    const shouldReduceMotion = useReducedMotion();

    // SVG layout
    const W = 300;
    const H = 160;
    const inputX = 50;
    const inputY = H / 2;
    const outputX = 250;
    const outputSpacing = 26;
    const outputStartY = (H - (VOWELS.length - 1) * outputSpacing) / 2;

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Mini network diagram */}
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xs mx-auto" aria-hidden>
                {/* Input node */}
                <circle
                    cx={inputX} cy={inputY} r="18"
                    fill={NN_COLORS.input.hex + "18"}
                    stroke={NN_COLORS.input.hex}
                    strokeWidth="1.5"
                />
                <text x={inputX} y={inputY - 6} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="monospace">{t("neuralNetworkNarrative.vowelTeaser.inputNodeLabel")}</text>
                <text x={inputX} y={inputY + 7} textAnchor="middle" fill={NN_COLORS.input.hex} fontSize="10" fontFamily="monospace" fontWeight="bold">{t("neuralNetworkNarrative.vowelTeaser.inputValueLabel")}</text>

                {/* Connections + output nodes */}
                {VOWELS.map((v, i) => {
                    const oy = outputStartY + i * outputSpacing;
                    const color = VOWEL_COLORS[i];
                    const delay = shouldReduceMotion ? 0 : i * 0.08;
                    return (
                        <g key={v}>
                            {/* Connection line */}
                            <motion.line
                                x1={inputX + 18} y1={inputY}
                                x2={outputX - 14} y2={oy}
                                stroke={color}
                                strokeWidth="1"
                                opacity={0.3}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.3, delay }}
                            />
                            {/* Output node */}
                            <motion.circle
                                cx={outputX} cy={oy} r="12"
                                fill={color + "20"}
                                stroke={color}
                                strokeWidth="1.5"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20, delay }}
                            />
                            <text
                                x={outputX} y={oy + 4}
                                textAnchor="middle"
                                fill={color}
                                fontSize="11"
                                fontFamily="monospace"
                                fontWeight="bold"
                            >
                                {v}
                            </text>
                        </g>
                    );
                })}

                {/* Labels */}
                <text x={inputX} y={inputY + 30} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="7" fontFamily="monospace">1 neuron</text>
                <text x={outputX} y={outputStartY + (VOWELS.length - 1) * outputSpacing + 22} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="7" fontFamily="monospace">5 neurons</text>
            </svg>

            {/* Vowel chips */}
            <div className="flex justify-center gap-2">
                {VOWELS.map((v, i) => (
                    <motion.div
                        key={v}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: shouldReduceMotion ? 0 : 0.3 + i * 0.06 }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-mono font-bold border"
                        style={{
                            background: VOWEL_COLORS[i] + "15",
                            borderColor: VOWEL_COLORS[i] + "40",
                            color: VOWEL_COLORS[i],
                        }}
                    >
                        {v}
                    </motion.div>
                ))}
            </div>

            {/* Teaser text */}
            <div className="rounded-xl bg-indigo-500/[0.04] border border-indigo-500/15 px-4 py-3 text-center">
                <p className="text-xs font-semibold" style={{ color: NN_COLORS.hidden.hex }}>
                    {t("neuralNetworkNarrative.vowelTeaser.title")}
                </p>
                <p className="text-[11px] text-white/40 mt-1">
                    {t("neuralNetworkNarrative.vowelTeaser.desc")}
                </p>
                <p className="text-[10px] text-white/25 mt-2 italic">
                    {t("neuralNetworkNarrative.vowelTeaser.forward")}
                </p>
            </div>
        </div>
    );
}
