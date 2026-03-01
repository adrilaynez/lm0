"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Dice5, RotateCcw } from "lucide-react";

import { useI18n } from "@/i18n/context";

/* ─── Data ─── */
interface CandidateData {
    char: string;
    probability: number;
}

const EXAMPLE_CHAR = "t";
const CANDIDATES: CandidateData[] = [
    { char: "h", probability: 0.525 },
    { char: "e", probability: 0.192 },
    { char: "i", probability: 0.101 },
    { char: " ", probability: 0.096 },
    { char: "o", probability: 0.086 },
];

const COLORS = [
    { bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30" },
    { bg: "bg-teal-500", text: "text-teal-400", border: "border-teal-500/30" },
    { bg: "bg-cyan-500", text: "text-cyan-400", border: "border-cyan-500/30" },
    { bg: "bg-sky-500", text: "text-sky-400", border: "border-sky-500/30" },
    { bg: "bg-blue-500", text: "text-blue-400", border: "border-blue-500/30" },
];

function displayChar(c: string) {
    return c === " " ? "·" : c;
}

type Phase = "idle" | "spinning" | "landing" | "picked";

/* ─── Component ─── */
export const SamplingMechanismVisualizer = memo(function SamplingMechanismVisualizer() {
    const { t } = useI18n();
    const [phase, setPhase] = useState<Phase>("idle");
    const [pickedIdx, setPickedIdx] = useState<number | null>(null);
    const [rollValue, setRollValue] = useState<number | null>(null);
    const [needlePos, setNeedlePos] = useState<number | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* Weighted random pick */
    const weightedPick = useCallback(() => {
        const r = Math.random();
        let cumulative = 0;
        for (let i = 0; i < CANDIDATES.length; i++) {
            cumulative += CANDIDATES[i].probability;
            if (r <= cumulative) return { idx: i, roll: r };
        }
        return { idx: CANDIDATES.length - 1, roll: r };
    }, []);

    const handleRoll = useCallback(() => {
        if (phase === "spinning") return;

        setPhase("spinning");
        setPickedIdx(null);
        setRollValue(null);

        // Pre-compute final result so we can animate toward it
        const { idx: finalIdx, roll: finalRoll } = weightedPick();

        // Visual spinning effect — needle sweeps across the ruler
        let spins = 0;
        const maxSpins = 12;
        const spin = () => {
            const currentIdx = spins % CANDIDATES.length;
            setPickedIdx(currentIdx);

            // Move needle to center of current candidate segment during spin
            let cumStart = 0;
            for (let i = 0; i < currentIdx; i++) cumStart += CANDIDATES[i].probability;
            const segCenter = cumStart + CANDIDATES[currentIdx].probability / 2;
            setNeedlePos(segCenter);

            spins++;
            if (spins < maxSpins) {
                spinTimerRef.current = setTimeout(spin, 60 + spins * 15);
            } else {
                // Final pick — needle glides to exact roll position
                setPickedIdx(finalIdx);
                setRollValue(finalRoll);
                setNeedlePos(finalRoll);
                setPhase("landing");
                spinTimerRef.current = setTimeout(() => {
                    setPhase("picked");
                    setHistory((prev) => [...prev, CANDIDATES[finalIdx].char].slice(-12));
                }, 600);
            }
        };
        spin();
    }, [phase, weightedPick]);

    const handleReset = useCallback(() => {
        if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
        setPhase("idle");
        setPickedIdx(null);
        setRollValue(null);
        setNeedlePos(null);
        setHistory([]);
    }, []);

    useEffect(() => {
        return () => {
            if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
        };
    }, []);

    // Cumulative ranges for the "ruler" visualization
    const cumulativeRanges = CANDIDATES.reduce<{ char: string; start: number; end: number; idx: number }[]>(
        (acc, c, i) => {
            const start = i === 0 ? 0 : acc[i - 1].end;
            acc.push({ char: c.char, start, end: start + c.probability, idx: i });
            return acc;
        },
        []
    );

    return (
        <div className="space-y-6">
            {/* Context badge */}
            <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20">
                    <span className="text-xs text-white/40">
                        {t("bigramNarrative.samplingMechanism.after")}
                    </span>
                    <code className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                        {EXAMPLE_CHAR}
                    </code>
                </div>
            </div>

            {/* Probability ruler */}
            <div className="px-2">
                <p className="text-[9px] font-mono uppercase tracking-widest text-white/20 mb-2">
                    {t("bigramNarrative.samplingMechanism.probabilitySpace")}
                </p>
                <div className="relative h-12 rounded-lg overflow-hidden flex">
                    {cumulativeRanges.map(({ char, start, end, idx }) => {
                        const width = (end - start) * 100;
                        const isActive = pickedIdx === idx && (phase === "landing" || phase === "picked");
                        return (
                            <motion.div
                                key={char}
                                animate={{
                                    opacity: isActive ? 1 : phase === "picked" && pickedIdx !== idx ? 0.3 : 0.7,
                                }}
                                className={`relative h-full ${COLORS[idx].bg} flex items-center justify-center border-r border-black/20 last:border-r-0`}
                                style={{ width: `${width}%` }}
                            >
                                <span className="text-[10px] font-mono font-bold text-white/80">
                                    {displayChar(char)}
                                </span>
                                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] font-mono text-white/40">
                                    {(width).toFixed(0)}%
                                </span>
                            </motion.div>
                        );
                    })}

                    {/* Roll indicator needle — visible during spinning, landing, and picked */}
                    <AnimatePresence>
                        {needlePos !== null && phase !== "idle" && (
                            <motion.div
                                initial={{ opacity: 0, top: -8 }}
                                animate={{
                                    opacity: phase === "spinning" ? 0.6 : 1,
                                    top: -4,
                                    left: `${needlePos * 100}%`,
                                }}
                                transition={
                                    phase === "landing"
                                        ? { type: "spring", stiffness: 120, damping: 18, left: { type: "spring", stiffness: 120, damping: 18 } }
                                        : { duration: 0.1 }
                                }
                                className="absolute w-0 h-0"
                            >
                                <div className="relative">
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent border-t-white" />
                                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 transition-colors ${phase === "picked" ? "bg-white/60" : "bg-white/30"}`} />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 0 to 1 scale labels */}
                <div className="flex justify-between mt-1 px-0.5">
                    <span className="text-[8px] font-mono text-white/20">0</span>
                    <span className="text-[8px] font-mono text-white/20">1.0</span>
                </div>
            </div>

            {/* Candidate list */}
            <div className="space-y-1.5 px-2">
                {CANDIDATES.map((c, idx) => {
                    const color = COLORS[idx];
                    const isPicked = phase === "picked" && pickedIdx === idx;
                    const isSpinHighlight = phase === "spinning" && pickedIdx === idx;
                    return (
                        <motion.div
                            key={c.char}
                            animate={{
                                scale: isPicked ? 1.03 : isSpinHighlight ? 1.01 : 1,
                                opacity: phase === "picked" && pickedIdx !== idx ? 0.4 : 1,
                            }}
                            transition={{ duration: 0.15 }}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${isPicked
                                ? `${color.border} bg-white/[0.06]`
                                : isSpinHighlight
                                    ? "border-white/15 bg-white/[0.04]"
                                    : "border-white/[0.06] bg-white/[0.02]"
                                }`}
                        >
                            <code className={`w-8 h-8 flex items-center justify-center rounded font-mono font-bold text-sm ${isPicked ? `${color.text}` : "text-white/50"
                                }`}>
                                {displayChar(c.char)}
                            </code>
                            <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                                <motion.div
                                    animate={{ width: `${c.probability * 100}%` }}
                                    className={`h-full rounded-full ${color.bg}`}
                                    style={{ opacity: isPicked ? 1 : 0.4 }}
                                />
                            </div>
                            <span className={`font-mono text-xs w-12 text-right ${isPicked ? `${color.text} font-bold` : "text-white/30"
                                }`}>
                                {(c.probability * 100).toFixed(1)}%
                            </span>
                            {isPicked && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-xs font-mono font-bold text-emerald-400"
                                >
                                    ✓
                                </motion.span>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Roll button + result */}
            <div className="flex flex-col items-center gap-3">
                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleRoll}
                    disabled={phase === "spinning" || phase === "landing"}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] text-sm font-semibold text-emerald-400 hover:bg-emerald-500/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Dice5 className={`w-4 h-4 ${phase === "spinning" ? "animate-spin" : ""}`} />
                    {phase === "picked"
                        ? t("bigramNarrative.samplingMechanism.rollAgain")
                        : t("bigramNarrative.samplingMechanism.roll")}
                </motion.button>

                <AnimatePresence>
                    {phase === "picked" && rollValue !== null && pickedIdx !== null && (
                        <motion.p
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-xs font-mono text-white/35"
                        >
                            {t("bigramNarrative.samplingMechanism.rolled")} <span className="text-white/60">{rollValue.toFixed(4)}</span>
                            {" → "}<span className={`${COLORS[pickedIdx].text} font-bold`}>{displayChar(CANDIDATES[pickedIdx].char)}</span>
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* History strip */}
            <AnimatePresence>
                {history.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="overflow-hidden"
                    >
                        <div className="flex items-center gap-2 px-2">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-white/20 shrink-0">
                                {t("bigramNarrative.samplingMechanism.history")}
                            </span>
                            <div className="flex items-center gap-1 flex-wrap">
                                {history.map((ch, i) => (
                                    <motion.span
                                        key={`${i}-${ch}`}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="inline-flex items-center justify-center w-7 h-7 rounded bg-white/[0.04] border border-white/[0.08] font-mono text-xs text-white/50"
                                    >
                                        {displayChar(ch)}
                                    </motion.span>
                                ))}
                            </div>
                            <button
                                onClick={handleReset}
                                className="p-1.5 rounded-lg hover:bg-white/[0.04] text-white/20 hover:text-white/40 transition-colors shrink-0"
                            >
                                <RotateCcw className="w-3 h-3" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
