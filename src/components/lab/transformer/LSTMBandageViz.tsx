"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

/*
  LSTMBandageViz — V06
  Extension of TelephoneGameViz. Toggle: "Basic RNN" vs "+ Memory Gates (LSTM)".
  With LSTM, degradation is slower but still present after 20+ tokens.
  Same visual language as V05.
*/

const BASE_TOKENS = ["The", "cat", "who", "lived", "in", "the", "old", "house", "by", "the", "river", "bank", "loved", "to", "sit", "on", "the", "warm", "mat", "every", "single", "morning", "without", "fail", "no", "matter", "what", "the", "weather", "was"];

type Mode = "rnn" | "lstm";

function memoryAt(step: number, total: number, mode: Mode): number {
    const t = step / Math.max(total - 1, 1);
    if (mode === "rnn") return Math.max(0, 100 * Math.pow(1 - t, 1.8));
    /* LSTM: slower decay, but still loses info after ~20 tokens */
    return Math.max(0, 100 * Math.pow(1 - t, 0.6));
}

function colorForMemory(pct: number): string {
    const t = 1 - pct / 100;
    const hue = 190 - t * 30;
    const sat = 85 - t * 70;
    const light = 65 - t * 25;
    return `hsl(${hue}, ${sat}%, ${light}%)`;
}

/* ── Collapsible LSTM gates explainer ── */
function LSTMGatesExplainer() {
    const [open, setOpen] = useState(false);

    const GATES = [
        { name: "Forget Gate", emoji: "🗑️", color: "#f87171", desc: "Decides what to throw away from the previous memory. \"Is this still relevant?\"" },
        { name: "Input Gate", emoji: "📥", color: "#34d399", desc: "Decides what new information to store. \"Is this worth remembering?\"" },
        { name: "Output Gate", emoji: "📤", color: "#60a5fa", desc: "Decides what part of the memory to output. \"What should I share?\"" },
    ];

    return (
        <div className="pt-2">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 mx-auto text-[11px] text-white/25 hover:text-white/45 transition-colors"
            >
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-3 h-3" />
                </motion.span>
                {open ? "Hide technical details" : "How do memory gates work?"}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        className="mt-3 mx-auto max-w-md rounded-xl p-4 space-y-4 overflow-hidden"
                        style={{
                            background: "linear-gradient(135deg, rgba(251,191,36,0.04), rgba(251,191,36,0.01))",
                            border: "1px solid rgba(251,191,36,0.1)",
                        }}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <p className="text-[10px] font-semibold text-amber-400/50 uppercase tracking-wider">
                            How LSTM gates work
                        </p>

                        <p className="text-xs text-white/40 leading-relaxed">
                            A regular RNN blindly overwrites its memory at every step. The LSTM adds three <strong className="text-white/60">gates</strong> — tiny
                            neural networks that control what flows through the memory:
                        </p>

                        <div className="space-y-2">
                            {GATES.map((gate, i) => (
                                <motion.div
                                    key={i}
                                    className="flex items-start gap-2.5 p-2.5 rounded-lg"
                                    style={{
                                        background: `linear-gradient(135deg, ${gate.color}08, transparent)`,
                                        border: `1px solid ${gate.color}15`,
                                    }}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <span className="text-sm shrink-0">{gate.emoji}</span>
                                    <div>
                                        <p className="text-[11px] font-semibold" style={{ color: `${gate.color}cc` }}>{gate.name}</p>
                                        <p className="text-[10px] text-white/35 leading-relaxed">{gate.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Simple flow diagram */}
                        <div className="flex items-center justify-center gap-1 py-2">
                            {["Input", "→", "🗑️ Forget", "→", "📥 Store", "→", "📤 Output", "→", "Next"].map((label, i) => (
                                <span
                                    key={i}
                                    className={`text-[9px] ${label === "→" ? "text-white/15" : "px-1.5 py-0.5 rounded border border-white/[0.06] text-white/30"}`}
                                >
                                    {label}
                                </span>
                            ))}
                        </div>

                        <p className="text-[10px] text-white/25 text-center leading-relaxed">
                            These gates let the LSTM <strong className="text-amber-400/40">selectively remember</strong> important information
                            for longer. But the fundamental problem remains: information must still travel through a
                            sequential chain, and the gates add complexity without solving the <strong className="text-white/35">parallelism bottleneck</strong>.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function LSTMBandageViz() {
    const [mode, setMode] = useState<Mode>("rnn");
    const [ballPos, setBallPos] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const seqLen = 25;
    const tokens = BASE_TOKENS.slice(0, seqLen);
    const mem = ballPos >= 0 ? Math.round(memoryAt(ballPos, seqLen, mode)) : 100;

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
            if (step >= seqLen) { setIsPlaying(false); return; }
            setBallPos(step);
            intervalRef.current = setTimeout(tick, 180);
        };
        intervalRef.current = setTimeout(tick, 200);
        return () => { if (intervalRef.current) clearTimeout(intervalRef.current); };
    }, [isPlaying, seqLen]);

    /* Reset ball when mode changes */
    const switchMode = (m: Mode) => {
        if (isPlaying) {
            setIsPlaying(false);
            if (intervalRef.current) clearTimeout(intervalRef.current);
        }
        setBallPos(-1);
        setMode(m);
    };

    return (
        <div className="py-6 sm:py-8 px-2 sm:px-4 space-y-6">
            {/* Mode toggle — editorial tabs */}
            <div className="flex items-center justify-center gap-6">
                {(["rnn", "lstm"] as const).map((m) => {
                    const isActive = mode === m;
                    return (
                        <motion.button
                            key={m}
                            onClick={() => switchMode(m)}
                            className="relative pb-1.5 text-[13px] sm:text-sm font-semibold tracking-wide transition-colors duration-300 cursor-pointer"
                            style={{
                                color: isActive
                                    ? (m === "lstm" ? "rgba(251,191,36,0.85)" : "rgba(255,255,255,0.8)")
                                    : "rgba(255,255,255,0.3)",
                            }}
                        >
                            {m === "rnn" ? "Basic RNN" : "+ Memory Gates (LSTM)"}
                            {isActive && (
                                <motion.span
                                    className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full"
                                    style={{
                                        background: m === "lstm"
                                            ? "linear-gradient(90deg, transparent, rgba(251,191,36,0.5), transparent)"
                                            : "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                                    }}
                                    layoutId="lstm-mode-tab"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Token chain — wrapping, no scroll */}
            <div>
                <div className="flex items-center gap-x-0 gap-y-2 flex-wrap justify-center px-1">
                    {tokens.map((token, i) => {
                        const isBallHere = ballPos === i;
                        const isPast = ballPos > i;
                        const stepMem = memoryAt(i, seqLen, mode);
                        const color = isPast || isBallHere ? colorForMemory(stepMem) : "rgba(255,255,255,0.08)";
                        const textColor = isPast || isBallHere ? colorForMemory(stepMem) : "rgba(255,255,255,0.35)";

                        return (
                            <div key={`${mode}-${i}`} className="flex items-center">
                                <motion.div
                                    className="relative flex items-center justify-center px-1.5 py-1.5 sm:px-2 sm:py-2 rounded-md"
                                    style={{
                                        background: isBallHere ? `linear-gradient(135deg, ${color}22, ${color}0a)` : "transparent",
                                        border: isBallHere ? `1px solid ${color}55` : "1px solid transparent",
                                        boxShadow: isBallHere ? `0 0 16px -4px ${color}40` : "none",
                                    }}
                                >
                                    <span
                                        className="text-[10px] sm:text-xs font-medium transition-colors duration-200"
                                        style={{ color: textColor }}
                                    >
                                        {token}
                                    </span>

                                    {isBallHere && (
                                        <motion.div
                                            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full"
                                            style={{
                                                background: mode === "lstm" ? "#fbbf24" : color,
                                                boxShadow: `0 0 10px 2px ${mode === "lstm" ? "rgba(251,191,36,0.5)" : `${color}60`}`,
                                            }}
                                            layoutId="lstm-ball"
                                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                        />
                                    )}
                                </motion.div>

                                {i < tokens.length - 1 && (
                                    <svg className="w-2 h-2 shrink-0" viewBox="0 0 12 12" fill="none">
                                        <path
                                            d="M2 6h6M6 3l3 3-3 3"
                                            stroke={isPast ? colorForMemory(memoryAt(i, seqLen, mode)) : "rgba(255,255,255,0.08)"}
                                            strokeWidth="1"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Memory meter */}
            <div className="flex items-center justify-center gap-3">
                <span className="text-[11px] text-white/30 whitespace-nowrap">Memory of first token:</span>
                <div className="relative w-32 sm:w-48 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <motion.div
                        className="h-full rounded-full"
                        style={{
                            background: mode === "lstm"
                                ? `linear-gradient(90deg, #fbbf24, ${colorForMemory(mem)})`
                                : `linear-gradient(90deg, #22d3ee, ${colorForMemory(mem)})`,
                            boxShadow: mode === "lstm"
                                ? "0 0 12px -2px rgba(251,191,36,0.3)"
                                : `0 0 12px -2px ${colorForMemory(mem)}60`,
                        }}
                        animate={{ width: `${ballPos >= 0 ? mem : 100}%` }}
                        transition={{ duration: 0.2 }}
                    />
                </div>
                <AnimatePresence mode="wait">
                    <motion.span
                        key={`${mode}-${mem}`}
                        className="text-xs font-mono w-8 text-right"
                        style={{ color: mode === "lstm" ? "rgba(251,191,36,0.8)" : colorForMemory(mem) }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.1 }}
                    >
                        {ballPos >= 0 ? `${mem}%` : "100%"}
                    </motion.span>
                </AnimatePresence>
            </div>

            {/* Play button */}
            <div className="flex justify-center">
                <motion.button
                    onClick={play}
                    disabled={isPlaying}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-[13px] sm:text-sm font-medium
                        disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                    style={{
                        border: mode === "lstm" ? "1px solid rgba(251,191,36,0.2)" : "1px solid rgba(34,211,238,0.2)",
                        background: mode === "lstm" ? "rgba(251,191,36,0.06)" : "rgba(34,211,238,0.06)",
                        color: mode === "lstm" ? "rgba(253,230,138,0.8)" : "rgba(165,243,252,0.8)",
                    }}
                    whileHover={!isPlaying ? {
                        scale: 1.03,
                        boxShadow: mode === "lstm"
                            ? "0 0 16px -4px rgba(251,191,36,0.15)"
                            : "0 0 16px -4px rgba(34,211,238,0.15)",
                    } : undefined}
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
                {mode === "lstm"
                    ? <>LSTM gates help retain memory longer &mdash; but after 25 tokens, information <strong className="text-amber-400/50">still fades</strong>. Better memory, but still <span className="text-white/35">one token at a time</span>.</>
                    : <>The basic RNN loses information rapidly. By token 15, the memory of the first word is <strong className="text-rose-400/55">nearly gone</strong>.</>
                }
            </p>

            {/* ── Collapsible: how LSTM gates work ── */}
            <LSTMGatesExplainer />
        </div>
    );
}
