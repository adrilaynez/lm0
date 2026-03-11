"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

/*
  TelephoneGameViz — V05 v2
  Tokens wrap (no horizontal scroll). Info degrades cyan → gray.
  Collapsible "Why does this happen?" section with vanishing gradient mini-viz.
*/

const BASE_TOKENS = ["The", "cat", "who", "lived", "in", "the", "old", "house", "by", "the", "river", "bank", "loved", "to", "sit", "on", "the", "warm", "mat", "every", "single", "morning", "without", "fail", "no", "matter", "what", "the", "weather", "was"];

/* Absolute decay: memory halves roughly every 6 steps */
const DECAY_RATE = 0.88;

function memoryAtStep(step: number): number {
    return Math.max(0, Math.round(100 * Math.pow(DECAY_RATE, step)));
}

function hslForStep(step: number): string {
    const mem = memoryAtStep(step) / 100;
    const hue = 190 - (1 - mem) * 30;
    const sat = 85 - (1 - mem) * 70;
    const light = 65 - (1 - mem) * 25;
    return `hsl(${hue}, ${sat}%, ${light}%)`;
}

/* ── Mini vanishing gradient visualizer ── */
function VanishingGradientMini() {
    const LAYERS = 8;
    const [running, setRunning] = useState(false);
    const [gradients, setGradients] = useState<number[]>(Array(LAYERS).fill(1));

    const run = useCallback(() => {
        setRunning(true);
        const vals = [1];
        for (let i = 1; i < LAYERS; i++) {
            vals.push(vals[i - 1] * (0.55 + Math.random() * 0.15));
        }
        setGradients(vals.reverse());
        setTimeout(() => setRunning(false), 600);
    }, []);

    return (
        <div className="space-y-3">
            <p className="text-xs text-white/40 leading-relaxed">
                During training, the network learns by sending <strong className="text-white/60">error signals</strong> (gradients)
                backwards through every step. But at each step, the gradient gets multiplied by a number less than 1.
                After many steps, it <strong className="text-rose-400/60">shrinks to nearly zero</strong>.
            </p>
            <div className="flex items-end gap-1.5 justify-center h-20">
                {gradients.map((g, i) => (
                    <motion.div
                        key={i}
                        className="w-5 sm:w-7 rounded-t-md relative group"
                        style={{
                            background: `linear-gradient(to top, ${g > 0.3 ? "#22d3ee" : g > 0.1 ? "#fbbf24" : "#f87171"}${Math.round(g * 80 + 20).toString(16).padStart(2, "0")}, transparent)`,
                        }}
                        animate={{ height: `${Math.max(g * 100, 4)}%` }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                    >
                        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-white/25 font-mono">
                            {i === 0 ? "→8" : i === LAYERS - 1 ? "→1" : ""}
                        </span>
                    </motion.div>
                ))}
            </div>
            <div className="flex items-center justify-between text-[9px] text-white/20 px-1">
                <span>Layer 8 (far)</span>
                <span>Layer 1 (near)</span>
            </div>
            <div className="flex justify-center">
                <button
                    onClick={run}
                    disabled={running}
                    className="text-[10px] px-3 py-1 rounded-lg border border-rose-400/20 text-rose-300/50 hover:text-rose-300/70 hover:border-rose-400/30 transition-all disabled:opacity-30"
                >
                    Simulate backpropagation
                </button>
            </div>
            <p className="text-[10px] text-white/25 text-center leading-relaxed">
                The gradient reaching layer 8 is <strong className="text-rose-400/40">almost zero</strong> — the early layers can&apos;t learn.
                This is why long sequences lose information: the network simply can&apos;t send learning signals that far back.
            </p>
        </div>
    );
}

export function TelephoneGameViz() {
    const [seqLen, setSeqLen] = useState(10);
    const [ballPos, setBallPos] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showTechnical, setShowTechnical] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const tokens = useMemo(() => BASE_TOKENS.slice(0, seqLen), [seqLen]);
    const memoryPct = ballPos >= 0 ? memoryAtStep(ballPos) : 100;

    const play = useCallback(() => {
        if (isPlaying) return;
        setBallPos(-1);
        setIsPlaying(true);
    }, [isPlaying]);

    useEffect(() => {
        if (!isPlaying) return;
        let step = -1;
        const tick = () => {
            step++;
            if (step >= seqLen) {
                setIsPlaying(false);
                return;
            }
            setBallPos(step);
            intervalRef.current = setTimeout(tick, Math.max(120, 400 - seqLen * 8));
        };
        intervalRef.current = setTimeout(tick, 200);
        return () => { if (intervalRef.current) clearTimeout(intervalRef.current); };
    }, [isPlaying, seqLen]);

    const handleSliderChange = (val: number) => {
        if (isPlaying) {
            setIsPlaying(false);
            if (intervalRef.current) clearTimeout(intervalRef.current);
        }
        setBallPos(-1);
        setSeqLen(val);
    };

    return (
        <div className="py-6 sm:py-8 px-2 sm:px-4 space-y-6">
            {/* Token chain — wrapping, no scroll */}
            <div className="flex items-center gap-x-0.5 gap-y-2 flex-wrap justify-center px-1">
                {tokens.map((token, i) => {
                    const isBallHere = ballPos === i;
                    const isPast = ballPos > i;
                    const color = isPast || isBallHere ? hslForStep(i) : "rgba(255,255,255,0.08)";
                    const textColor = isPast || isBallHere ? hslForStep(i) : "rgba(255,255,255,0.4)";

                    return (
                        <div key={i} className="flex items-center">
                            <motion.div
                                className="relative flex items-center justify-center px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg"
                                style={{
                                    background: isBallHere
                                        ? `linear-gradient(135deg, ${color}22, ${color}0a)`
                                        : "transparent",
                                    border: isBallHere
                                        ? `1px solid ${color}55`
                                        : "1px solid transparent",
                                    boxShadow: isBallHere
                                        ? `0 0 20px -4px ${color}40`
                                        : "none",
                                }}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.015, duration: 0.25 }}
                            >
                                <span
                                    className="text-xs sm:text-sm font-medium transition-colors duration-200"
                                    style={{ color: textColor }}
                                >
                                    {token}
                                </span>

                                {isBallHere && (
                                    <motion.div
                                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full"
                                        style={{
                                            background: color,
                                            boxShadow: `0 0 10px 2px ${color}60`,
                                        }}
                                        layoutId="rnn-ball"
                                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                    />
                                )}
                            </motion.div>

                            {i < tokens.length - 1 && (
                                <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 12 12" fill="none">
                                    <path
                                        d="M2 6h6M6 3l3 3-3 3"
                                        stroke={isPast ? hslForStep(i) : "rgba(255,255,255,0.1)"}
                                        strokeWidth="1"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="transition-colors duration-200"
                                    />
                                </svg>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Memory meter */}
            <div className="flex items-center justify-center gap-3">
                <span className="text-[11px] text-white/30 whitespace-nowrap">Memory of first token:</span>
                <div className="relative w-32 sm:w-48 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <motion.div
                        className="h-full rounded-full"
                        style={{
                            background: `linear-gradient(90deg, #22d3ee, ${hslForStep(ballPos >= 0 ? ballPos : 0)})`,
                            boxShadow: ballPos >= 0 ? `0 0 12px -2px ${hslForStep(ballPos)}60` : "0 0 12px -2px rgba(34,211,238,0.3)",
                        }}
                        animate={{ width: `${ballPos >= 0 ? memoryPct : 100}%` }}
                        transition={{ duration: 0.2 }}
                    />
                </div>
                <AnimatePresence mode="wait">
                    <motion.span
                        key={memoryPct}
                        className="text-xs font-mono w-8 text-right"
                        style={{ color: ballPos >= 0 ? hslForStep(ballPos) : "#22d3ee" }}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                    >
                        {ballPos >= 0 ? `${memoryPct}%` : "100%"}
                    </motion.span>
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3">
                    <span className="text-[11px] text-white/25">Sequence length:</span>
                    <input
                        type="range"
                        min={5}
                        max={30}
                        value={seqLen}
                        onChange={(e) => handleSliderChange(Number(e.target.value))}
                        className="w-28 sm:w-40 h-1 rounded-full appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(90deg, rgba(34,211,238,0.4) ${((seqLen - 5) / 25) * 100}%, rgba(255,255,255,0.08) ${((seqLen - 5) / 25) * 100}%)`,
                        }}
                    />
                    <span className="text-xs font-mono text-cyan-300/60 w-6 text-center">{seqLen}</span>
                </div>

                <motion.button
                    onClick={play}
                    disabled={isPlaying}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-[13px] sm:text-sm font-medium
                        disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                    style={{
                        background: "rgba(34,211,238,0.06)",
                        border: "1px solid rgba(34,211,238,0.2)",
                        color: "rgba(165,243,252,0.8)",
                    }}
                    whileHover={!isPlaying ? { scale: 1.03, boxShadow: "0 0 16px -4px rgba(34,211,238,0.15)" } : undefined}
                    whileTap={!isPlaying ? { scale: 0.97 } : undefined}
                >
                    <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4 2l10 6-10 6V2z" />
                    </svg>
                    {isPlaying ? "Running..." : "Pass the message"}
                </motion.button>
            </div>

            {/* Label */}
            <p className="text-[11px] sm:text-xs text-white/25 text-center max-w-md mx-auto leading-relaxed">
                {ballPos >= seqLen - 1
                    ? <>By the end, the memory of the first token is <strong className="text-rose-400/55">barely a whisper</strong>.</>
                    : seqLen > 15
                        ? <>Try running the message — watch how quickly <span className="text-cyan-300/35">information fades</span>.</>
                        : <>The message passes through each token, but information <span className="text-cyan-300/35">degrades at every step</span>.</>
                }
            </p>

            {/* ── Collapsible: vanishing gradient explainer ── */}
            <div className="pt-2">
                <button
                    onClick={() => setShowTechnical(!showTechnical)}
                    className="flex items-center gap-1.5 mx-auto text-[11px] text-white/25 hover:text-white/45 transition-colors"
                >
                    <motion.span animate={{ rotate: showTechnical ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-3 h-3" />
                    </motion.span>
                    {showTechnical ? "Hide technical details" : "Why does this happen? (vanishing gradients)"}
                </button>

                <AnimatePresence>
                    {showTechnical && (
                        <motion.div
                            className="mt-3 mx-auto max-w-sm rounded-xl p-4 space-y-3"
                            style={{
                                background: "linear-gradient(135deg, rgba(244,63,94,0.04), rgba(244,63,94,0.01))",
                                border: "1px solid rgba(244,63,94,0.1)",
                            }}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <p className="text-[10px] font-semibold text-rose-400/50 uppercase tracking-wider">
                                For MLP readers: The Vanishing Gradient Problem
                            </p>
                            <VanishingGradientMini />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
