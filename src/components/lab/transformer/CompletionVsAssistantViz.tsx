"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  CompletionVsAssistantViz — §10 Beat 2

  The fascinating gap: same architecture, different behavior.
  Left: raw completion engine continues text.
  Right: ChatGPT answers the question.
  Both typewrite simultaneously. The contrast is the insight.

  Tone: FASCINATING, not problematic. "Look at this!"
*/

interface Scenario {
    prompt: string;
    completion: string;
    assistant: string;
}

const SCENARIOS: Scenario[] = [
    {
        prompt: "What is the capital of France?",
        completion: "What is the capital of Germany? What is the capital of Spain? What is the capital of Italy? In this comprehensive guide, we will explore the capitals of major European nations and their historical significance throughout the centuries...",
        assistant: "The capital of France is Paris.",
    },
    {
        prompt: "Explain how gravity works.",
        completion: "Explain how magnetism works. Explain how electricity works. Explain how light travels through space. These are fundamental questions in physics that have puzzled scientists for centuries. In the following essay, we shall examine...",
        assistant: "Gravity is a fundamental force that attracts objects with mass toward each other. The more massive an object, the stronger its gravitational pull. Earth's gravity keeps us on the ground and the Moon in orbit.",
    },
    {
        prompt: "Write a haiku about the ocean.",
        completion: "Write a haiku about the mountains. Write a haiku about the forest. Write a haiku about the desert. Poetry exercises for students: Using the natural world as inspiration, compose original haiku following the traditional 5-7-5...",
        assistant: "Waves touch the warm shore,\nSalt and wind weave through the air —\nThe tide remembers.",
    },
];

/* ── Typewriter hook ── */
function useTypewriter(text: string, speed: number, active: boolean) {
    const [displayed, setDisplayed] = useState("");
    const [done, setDone] = useState(false);
    const idx = useRef(0);
    const timer = useRef<number>(0);

    useEffect(() => {
        idx.current = 0;
        setDisplayed("");
        setDone(false);
    }, [text]);

    useEffect(() => {
        if (!active) return;
        if (idx.current >= text.length) { setDone(true); return; }

        timer.current = window.setTimeout(() => {
            idx.current++;
            setDisplayed(text.slice(0, idx.current));
            if (idx.current >= text.length) setDone(true);
        }, speed);

        return () => window.clearTimeout(timer.current);
    }, [active, displayed, text, speed]);

    return { displayed, done };
}

/* ── Output panel ── */
function OutputPanel({ label, color, rgb, text, speed, active, accentBorder }: {
    label: string;
    color: string;
    rgb: string;
    text: string;
    speed: number;
    active: boolean;
    accentBorder: boolean;
}) {
    const { displayed, done } = useTypewriter(text, speed, active);

    return (
        <div className="flex-1 min-w-0">
            {/* Label */}
            <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                <span className="text-[11px] font-bold" style={{ color }}>{label}</span>
            </div>

            {/* Output box */}
            <div
                className="rounded-xl px-4 py-3.5 min-h-[120px] relative"
                style={{
                    background: `rgba(${rgb},0.03)`,
                    border: accentBorder
                        ? `1px solid rgba(${rgb},0.15)`
                        : "1px solid rgba(255,255,255,0.04)",
                }}
            >
                {!active ? (
                    <span className="text-[11px] text-white/10 italic">Waiting...</span>
                ) : (
                    <p className="text-[12px] leading-relaxed font-mono" style={{ color: `rgba(${rgb},0.6)` }}>
                        {displayed}
                        {!done && (
                            <motion.span
                                className="inline-block w-[2px] h-[14px] ml-0.5 -mb-[2px] rounded-full"
                                style={{ background: color }}
                                animate={{ opacity: [1, 0, 1] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                            />
                        )}
                    </p>
                )}

                {/* Done indicator */}
                {done && accentBorder && (
                    <motion.div
                        className="absolute bottom-2 right-3"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                    >
                        <span className="text-[9px] font-mono" style={{ color: `rgba(${rgb},0.3)` }}>✓</span>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export function CompletionVsAssistantViz() {
    const [scenarioIdx, setScenarioIdx] = useState(0);
    const [running, setRunning] = useState(false);
    const [hasRun, setHasRun] = useState(false);
    const scenario = SCENARIOS[scenarioIdx];

    const start = useCallback(() => {
        setRunning(true);
        setHasRun(true);
    }, []);

    /* Auto-start on mount */
    useEffect(() => {
        const t = setTimeout(() => start(), 600);
        return () => clearTimeout(t);
    }, [scenarioIdx, start]);

    const handleSwitch = (i: number) => {
        if (i === scenarioIdx) return;
        setRunning(false);
        setHasRun(false);
        setScenarioIdx(i);
    };

    return (
        <div className="w-full max-w-xl mx-auto py-6 px-2">
            {/* ── Prompt display ── */}
            <motion.div
                className="text-center mb-6"
                key={scenarioIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <p className="text-[10px] text-white/15 font-mono uppercase tracking-wider mb-2">Prompt</p>
                <p className="text-[15px] text-white/50 font-medium leading-relaxed">
                    &ldquo;{scenario.prompt}&rdquo;
                </p>
            </motion.div>

            {/* ── Two outputs ── */}
            <div className="flex gap-3 sm:gap-4">
                <OutputPanel
                    label="Completion Engine"
                    color="#f59e0b"
                    rgb="245,158,11"
                    text={scenario.completion}
                    speed={28}
                    active={running}
                    accentBorder={false}
                />
                <OutputPanel
                    label="ChatGPT"
                    color="#22d3ee"
                    rgb="34,211,238"
                    text={scenario.assistant}
                    speed={32}
                    active={running}
                    accentBorder={true}
                />
            </div>

            {/* ── Same architecture reminder ── */}
            <AnimatePresence>
                {hasRun && (
                    <motion.p
                        className="text-center text-[11px] text-white/15 mt-5"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2.5 }}
                    >
                        Same architecture. Same attention. Same everything.
                    </motion.p>
                )}
            </AnimatePresence>

            {/* ── Scenario pills ── */}
            <div className="flex justify-center gap-2 mt-5">
                {SCENARIOS.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => handleSwitch(i)}
                        className="px-3 py-1 rounded-lg text-[10px] font-medium cursor-pointer transition-all"
                        style={{
                            background: scenarioIdx === i ? "rgba(34,211,238,0.08)" : "rgba(255,255,255,0.02)",
                            color: scenarioIdx === i ? "rgba(34,211,238,0.6)" : "rgba(255,255,255,0.15)",
                            border: scenarioIdx === i
                                ? "1px solid rgba(34,211,238,0.15)"
                                : "1px solid rgba(255,255,255,0.04)",
                        }}
                    >
                        {i === 0 ? "Question" : i === 1 ? "Explanation" : "Creative"}
                    </button>
                ))}
            </div>
        </div>
    );
}
