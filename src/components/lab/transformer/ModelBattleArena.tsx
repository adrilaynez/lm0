"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  ModelBattleArena — §08 Beat 6 ⭐⭐⭐

  Side-by-side generation: N-gram vs MLP vs Transformer.
  Same prompt, same rate, three columns. Verdicts after completion.

  One concept: Transformer's full-context advantage over fixed-window models.
*/

/* ── Model definitions ── */
interface ModelDef {
    name: string;
    badge: string;
    badgeColor: string;
    borderColor: string;
    textColor: string;
    verdict: string;
}

const MODELS: ModelDef[] = [
    {
        name: "N-gram",
        badge: "ctx: 4 chars",
        badgeColor: "rgba(251,191,36,",
        borderColor: "rgba(251,191,36,0.12)",
        textColor: "rgba(251,191,36,0.6)",
        verdict: "Repetitive. Trapped in local patterns.",
    },
    {
        name: "MLP",
        badge: "ctx: 8 chars",
        badgeColor: "rgba(139,92,246,",
        borderColor: "rgba(139,92,246,0.12)",
        textColor: "rgba(139,92,246,0.6)",
        verdict: "Better variety, but loses coherence.",
    },
    {
        name: "Transformer",
        badge: "ctx: full",
        badgeColor: "rgba(34,211,238,",
        borderColor: "rgba(34,211,238,0.15)",
        textColor: "rgba(34,211,238,0.7)",
        verdict: "Coherent. Full context maintained.",
    },
];

/* ── Prompt presets ── */
const PROMPTS = [
    { label: "The king ", text: "The king " },
    { label: "First, ", text: "First, " },
    { label: "To be ", text: "To be " },
];

/* ── Hardcoded fallback generation samples ── */
const SAMPLES: Record<string, string[]> = {
    "The king ": [
        "The king the the and the ing the the king the the and the ing the the king the the and the",
        "The king was in the gre the mond of the sthe prand the cond the se wor the hald the mont",
        "The king was not the sort of person who would have been satisfied with merely ruling. He wanted to understand the nature of his kingdom, the way a scientist wants to understand",
    ],
    "First, ": [
        "First, the the and the ing the first the the and the ing the first the the and the ing the",
        "First, the re the gre that be and the cour of the se wor the hald the mont of the por",
        "First, let me say that the most important thing I learned was not any specific technique, but rather a way of thinking about problems that made everything else easier",
    ],
    "To be ": [
        "To be the the and the to be the the and the to be the the and the to be the the and",
        "To be the gre and the se wor the hald in the be cour of the por whe the mond that",
        "To be a good writer, you have to be willing to write badly at first. The fear of writing something bad is what stops most people from writing anything at all",
    ],
};

const CHAR_DELAY_MS = 30;

export function ModelBattleArena() {
    const [promptIdx, setPromptIdx] = useState(0);
    const [isBattling, setIsBattling] = useState(false);
    const [charCounts, setCharCounts] = useState([0, 0, 0]);
    const [showVerdicts, setShowVerdicts] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const prompt = PROMPTS[promptIdx].text;
    const samples = SAMPLES[prompt] || SAMPLES["The king "];
    const maxLen = Math.max(...samples.map((s) => s.length));

    /* ── Battle engine ── */
    const startBattle = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setCharCounts([0, 0, 0]);
        setShowVerdicts(false);
        setIsBattling(true);
    }, []);

    useEffect(() => {
        if (!isBattling) return;
        timerRef.current = setInterval(() => {
            setCharCounts((prev) => {
                const next = prev.map((c) => c + 1);
                const allDone = next.every((c, i) => c >= samples[i].length);
                if (allDone) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    setIsBattling(false);
                    setTimeout(() => setShowVerdicts(true), 400);
                }
                return next.map((c, i) => Math.min(c, samples[i].length));
            });
        }, CHAR_DELAY_MS);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isBattling, samples]);

    const selectPrompt = useCallback((idx: number) => {
        if (timerRef.current) clearInterval(timerRef.current);
        setPromptIdx(idx);
        setCharCounts([0, 0, 0]);
        setIsBattling(false);
        setShowVerdicts(false);
    }, []);

    return (
        <div className="flex flex-col items-center gap-5 w-full">
            {/* ── Prompt selector ── */}
            <div className="flex flex-col items-center gap-3 w-full max-w-[700px]">
                <div className="flex items-center gap-2 flex-wrap justify-center">
                    {PROMPTS.map((p, i) => (
                        <button
                            key={i}
                            onClick={() => selectPrompt(i)}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-mono transition-all duration-200"
                            style={{
                                background: promptIdx === i
                                    ? "rgba(34,211,238,0.08)"
                                    : "rgba(255,255,255,0.02)",
                                border: `1px solid ${promptIdx === i
                                    ? "rgba(34,211,238,0.2)"
                                    : "rgba(255,255,255,0.06)"}`,
                                color: promptIdx === i
                                    ? "rgba(34,211,238,0.8)"
                                    : "rgba(255,255,255,0.3)",
                            }}
                        >
                            &ldquo;{p.label}&rdquo;
                        </button>
                    ))}
                </div>

                {/* Battle button */}
                <motion.button
                    onClick={startBattle}
                    disabled={isBattling}
                    className="px-6 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200"
                    style={{
                        background: isBattling
                            ? "rgba(255,255,255,0.02)"
                            : "rgba(34,211,238,0.08)",
                        border: `1px solid ${isBattling
                            ? "rgba(255,255,255,0.04)"
                            : "rgba(34,211,238,0.2)"}`,
                        color: isBattling
                            ? "rgba(255,255,255,0.2)"
                            : "rgba(34,211,238,0.8)",
                        cursor: isBattling ? "default" : "pointer",
                    }}
                    whileTap={isBattling ? {} : { scale: 0.97 }}
                >
                    {isBattling ? "Generating…" : "Battle!"}
                </motion.button>
            </div>

            {/* ── Three columns ── */}
            <div className="w-full max-w-[700px] grid grid-cols-1 sm:grid-cols-3 gap-3">
                {MODELS.map((model, mi) => {
                    const displayed = samples[mi].slice(0, charCounts[mi]);
                    const isWinner = mi === 2;
                    return (
                        <div
                            key={mi}
                            className="rounded-xl overflow-hidden"
                            style={{
                                background: "rgba(0,0,0,0.2)",
                                border: `1px solid ${isWinner && (isBattling || showVerdicts)
                                    ? "rgba(34,211,238,0.15)"
                                    : "rgba(255,255,255,0.04)"}`,
                                boxShadow: isWinner && showVerdicts
                                    ? "0 0 20px rgba(34,211,238,0.06)"
                                    : "none",
                                transition: "border-color 0.3s, box-shadow 0.3s",
                            }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-3 py-2 border-b"
                                style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                                <span className="text-[13px] font-semibold"
                                    style={{ color: `${model.badgeColor}0.8)` }}>
                                    {model.name}
                                </span>
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                                    style={{
                                        background: `${model.badgeColor}0.06)`,
                                        color: `${model.badgeColor}0.5)`,
                                    }}>
                                    {model.badge}
                                </span>
                            </div>

                            {/* Text area */}
                            <div className="px-3 py-3 min-h-[110px]">
                                <p className="font-mono text-[12px] leading-relaxed whitespace-pre-wrap break-words"
                                    style={{ color: "rgba(255,255,255,0.45)" }}>
                                    <span style={{ color: "rgba(255,255,255,0.2)" }}>{prompt}</span>
                                    {displayed}
                                    {isBattling && charCounts[mi] < samples[mi].length && (
                                        <span className="inline-block w-[2px] h-[13px] ml-[1px] align-middle"
                                            style={{ background: `${model.badgeColor}0.4)` }} />
                                    )}
                                </p>
                            </div>

                            {/* Verdict */}
                            <AnimatePresence>
                                {showVerdicts && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.4, delay: mi * 0.15 }}
                                        className="px-3 py-2.5 border-t"
                                        style={{ borderColor: "rgba(255,255,255,0.04)" }}
                                    >
                                        <p className="text-[11px] font-medium italic"
                                            style={{ color: `${model.badgeColor}0.5)` }}>
                                            {model.verdict}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
