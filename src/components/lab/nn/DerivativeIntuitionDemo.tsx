"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { Slider } from "@/components/ui/slider";
import { NN_COLORS } from "./visualizer-theme";

/*
  Teaches derivatives from scratch using the simplest operations.
  Enhanced with:
  - Sensitivity meter bar (height = derivative value)
  - Progressive naming: "Sensitivity" → after both ops tried → reveal "derivative"
  - Smooth transition when switching operations
*/

type Op = "add" | "multiply";

const METER_MAX = 10;

export function DerivativeIntuitionDemo() {
    const { t } = useI18n();
    const shouldReduceMotion = useReducedMotion();
    const [op, setOp] = useState<Op>("add");
    const [x, setX] = useState(3);
    const [y, setY] = useState(4);
    const [triedOps, setTriedOps] = useState<Set<Op>>(new Set(["add"]));

    const z = op === "add" ? x + y : x * y;
    const xNudged = x + 1;
    const zNudged = op === "add" ? xNudged + y : xNudged * y;
    const zChange = zNudged - z;
    const derivative = op === "add" ? 1 : y;

    const bothTried = triedOps.has("add") && triedOps.has("multiply");

    const handleOpChange = (newOp: Op) => {
        setOp(newOp);
        setTriedOps(prev => new Set(prev).add(newOp));
    };

    const spring = shouldReduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 280, damping: 25 };
    const meterPct = Math.min(Math.abs(derivative) / METER_MAX, 1) * 100;
    const meterColor = op === "add" ? NN_COLORS.input.hex : NN_COLORS.target.hex;

    return (
        <div className="p-5 sm:p-6 space-y-5">
            {/* Operation toggle */}
            <div className="flex gap-2">
                <button
                    onClick={() => handleOpChange("add")}
                    className={`px-4 py-2 rounded-full text-xs font-mono font-semibold transition-all border ${op === "add"
                        ? "bg-sky-500/15 border-sky-500/30 text-sky-400"
                        : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/60"
                        }`}
                >
                    z = x + y
                </button>
                <button
                    onClick={() => handleOpChange("multiply")}
                    className={`px-4 py-2 rounded-full text-xs font-mono font-semibold transition-all border ${op === "multiply"
                        ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                        : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/60"
                        }`}
                >
                    z = x × y
                </button>
            </div>

            {/* Current values with smooth transition */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={op}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="rounded-xl bg-black/30 border border-white/[0.05] p-4"
                >
                    <div className="flex items-center justify-center gap-3 flex-wrap font-mono">
                        <div className="rounded-lg bg-sky-500/10 border border-sky-500/25 px-3 py-2 text-center">
                            <span className="text-[9px] text-sky-400/60 block">x</span>
                            <span className="text-xl font-bold" style={{ color: NN_COLORS.input.hex }}>{x}</span>
                        </div>
                        <span className="text-white/30 text-xl">{op === "add" ? "+" : "×"}</span>
                        <div className="rounded-lg bg-amber-500/10 border border-amber-500/25 px-3 py-2 text-center">
                            <span className="text-[9px] text-amber-400/60 block">y</span>
                            <span className="text-xl font-bold" style={{ color: NN_COLORS.target.hex }}>{y}</span>
                        </div>
                        <span className="text-white/30 text-xl">=</span>
                        <div className="rounded-lg bg-white/[0.04] border border-white/[0.1] px-3 py-2 text-center">
                            <span className="text-[9px] text-white/40 block">z</span>
                            <span className="text-xl font-bold text-white/80">{z}</span>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Sliders */}
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-sky-500/15 bg-sky-500/[0.03] px-3 py-2 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold" style={{ color: NN_COLORS.input.hex }}>x</span>
                        <span className="text-sm font-mono font-bold" style={{ color: NN_COLORS.input.hex }}>{x}</span>
                    </div>
                    <Slider min={0} max={10} step={1} value={[x]} onValueChange={([v]) => setX(v)} />
                </div>
                <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.03] px-3 py-2 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold" style={{ color: NN_COLORS.target.hex }}>y</span>
                        <span className="text-sm font-mono font-bold" style={{ color: NN_COLORS.target.hex }}>{y}</span>
                    </div>
                    <Slider min={0} max={10} step={1} value={[y]} onValueChange={([v]) => setY(v)} />
                </div>
            </div>

            {/* The key question + sensitivity meter */}
            <div className="rounded-xl bg-violet-500/[0.04] border border-violet-500/20 p-4">
                <p className="text-xs text-violet-400/80 font-semibold mb-3">
                    {t("neuralNetworkNarrative.howItLearns.derivative.question")}
                </p>

                <div className="flex gap-4">
                    {/* Before/After cards */}
                    <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-lg bg-black/20 p-2.5 text-center">
                                <span className="text-[8px] text-white/25 block font-mono mb-0.5">{t("neuralNetworkNarrative.howItLearns.derivative.before")}</span>
                                <span className="text-xs font-mono text-white/40">
                                    {x} {op === "add" ? "+" : "×"} {y} =
                                </span>
                                <span className="text-base font-mono font-bold text-white/60 ml-1">{z}</span>
                            </div>
                            <div className="rounded-lg bg-black/20 p-2.5 text-center">
                                <span className="text-[8px] text-white/25 block font-mono mb-0.5">{t("neuralNetworkNarrative.howItLearns.derivative.after")}</span>
                                <span className="text-xs font-mono text-white/40">
                                    <span style={{ color: NN_COLORS.input.hex }}>{xNudged}</span> {op === "add" ? "+" : "×"} {y} =
                                </span>
                                <span className="text-base font-mono font-bold text-white/60 ml-1">{zNudged}</span>
                            </div>
                        </div>
                        <div className="text-center">
                            <span className="text-xs text-white/30">{t("neuralNetworkNarrative.howItLearns.derivative.zChanged")}</span>
                            <motion.span
                                key={`${op}-${x}-${y}`}
                                animate={{ scale: [1.15, 1] }}
                                transition={spring}
                                className="text-xl font-mono font-bold ml-2"
                                style={{ color: meterColor }}
                            >
                                +{zChange}
                            </motion.span>
                        </div>
                    </div>

                    {/* Sensitivity meter bar */}
                    <div className="w-10 flex flex-col items-center">
                        <p className="text-[7px] font-mono text-white/20 mb-1 text-center leading-tight">
                            {bothTried ? t("neuralNetworkNarrative.howItLearns.derivative.meterLabelRevealed") : t("neuralNetworkNarrative.howItLearns.derivative.meterLabel")}
                        </p>
                        <div className="flex-1 w-5 rounded-full bg-white/[0.04] border border-white/[0.06] relative overflow-hidden min-h-[48px]">
                            <motion.div
                                className="absolute bottom-0 left-0 right-0 rounded-full"
                                style={{ background: meterColor }}
                                animate={{ height: `${meterPct}%` }}
                                transition={spring}
                            />
                        </div>
                        <motion.p
                            key={derivative}
                            animate={{ scale: [1.1, 1] }}
                            transition={spring}
                            className="text-sm font-mono font-bold mt-1"
                            style={{ color: meterColor }}
                        >
                            {derivative}
                        </motion.p>
                    </div>
                </div>
            </div>

            {/* Progressive naming: sensitivity → derivative */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={bothTried ? "revealed" : "hidden"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`rounded-xl p-4 border text-center ${op === "add" ? "bg-sky-500/[0.04] border-sky-500/15" : "bg-amber-500/[0.04] border-amber-500/15"}`}
                >
                    <span className="text-[10px] text-white/30 block font-mono mb-1">
                        {bothTried
                            ? t("neuralNetworkNarrative.howItLearns.derivative.thisIs")
                            : t("neuralNetworkNarrative.howItLearns.derivative.sensitivityLabel")}
                    </span>
                    <div className="flex items-center justify-center gap-2">
                        {bothTried && <span className="text-sm font-mono text-white/50">∂z/∂x =</span>}
                        <span className="text-2xl font-mono font-bold" style={{ color: meterColor }}>
                            {derivative}
                        </span>
                    </div>
                    <p className="text-xs text-white/40 mt-2">
                        {op === "add"
                            ? t("neuralNetworkNarrative.howItLearns.derivative.addExplain")
                            : t("neuralNetworkNarrative.howItLearns.derivative.mulExplain").replace("{y}", String(y))
                        }
                    </p>
                    {bothTried && (
                        <p className="text-[10px] text-violet-400/60 mt-2 font-semibold">
                            {t("neuralNetworkNarrative.howItLearns.derivative.revealedNote")}
                        </p>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
