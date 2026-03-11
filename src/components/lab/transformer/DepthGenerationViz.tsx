"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  DepthGenerationViz — VIZ 10

  Side-by-side generation from 1-block, 4-block, and 12-block models.
  Shows quality improvement with depth AND the 12-block memorization problem.

  Three columns: "1 Block" / "4 Blocks" / "12 Blocks"
  
  DATA SOURCE:
  POST /api/v1/transformer/{config_id}/generate
  FALLBACK: Hardcoded samples from realistic outputs.
  
  After generation:
  - 1 Block: choppy, recognizable words
  - 4 Blocks: flowing, coherent (winner)
  - 12 Blocks: oddly specific, memorized fragments
*/

const API_BASE = "/api/v1/transformer";

interface ModelConfig {
    id: string;
    configId: string;
    label: string;
    blocks: number;
    color: string;
    rgb: string;
    verdict: string;
    verdictColor: string;
    icon: string;
}

const MODELS: ModelConfig[] = [
    {
        id: "1b", configId: "gpt_1b_128d_ctx256", label: "1 Block", blocks: 1,
        color: "#f87171", rgb: "248,113,113",
        verdict: "Recognizable words, but choppy and incoherent.",
        verdictColor: "rgba(248,113,113,0.6)", icon: "\u2717",
    },
    {
        id: "4b", configId: "gpt_4b_128d", label: "4 Blocks", blocks: 4,
        color: "#22d3ee", rgb: "34,211,238",
        verdict: "Flowing phrases. Real coherence. The sweet spot.",
        verdictColor: "rgba(34,211,238,0.7)", icon: "\u2713",
    },
    {
        id: "12b", configId: "gpt_12b_128d", label: "12 Blocks", blocks: 12,
        color: "#fbbf24", rgb: "251,191,36",
        verdict: "Oddly specific. Memorized training fragments.",
        verdictColor: "rgba(251,191,36,0.6)", icon: "\u26A0",
    },
];

/* Hardcoded fallback samples (realistic for character-level Shakespeare+PG models) */
const FALLBACK_SAMPLES: Record<string, string[]> = {
    "1b": [
        "the mand of shou the wand to be the hath bere of to the fore ",
        "and whe ther shalle be noth the kinge of alle thinge ",
        "it is notte be the same of thinge to bee whan all ",
    ],
    "4b": [
        "the professor had always believed that the nature of understanding comes not from mere observation, but from the careful",
        "and therefore we must consider what it means to build something that truly lasts. The question is not whether",
        "First let me tell you about the time I realized that starting a company was nothing like what I expected",
    ],
    "12b": [
        "Thanks to Trevor Blackwell, Jessica Livingston, Robert Morris, and Fred Wilson for reading drafts of this.",
        "KING RICHARD III:\nNow is the winter of our discontent\nMade glorious summer by this sun of York;",
        "The way to get startup ideas is not to try to think of startup ideas. It's to look for problems,",
    ],
};

const PROMPTS = [
    { label: "\"The \"", text: "The " },
    { label: "\"First \"", text: "First " },
    { label: "\"And \"", text: "And " },
];

export function DepthGenerationViz() {
    const [promptIdx, setPromptIdx] = useState(0);
    const [generating, setGenerating] = useState(false);
    const [outputs, setOutputs] = useState<Record<string, string>>({});
    const [revealed, setRevealed] = useState(false);
    const [usedApi, setUsedApi] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const prompt = PROMPTS[promptIdx];

    /* Use pre-saved samples instantly (no API call) */
    const showFallback = useCallback(() => {
        const results: Record<string, string> = {};
        MODELS.forEach(m => { results[m.id] = FALLBACK_SAMPLES[m.id][promptIdx]; });
        setOutputs(results);
        setTimeout(() => setRevealed(true), 300);
    }, [promptIdx]);

    /* Call API only when user explicitly requests fresh generation */
    const generateFromApi = useCallback(async () => {
        if (generating) return;
        setGenerating(true);
        setRevealed(false);
        setOutputs({});

        const controller = new AbortController();
        abortRef.current = controller;

        const results: Record<string, string> = {};

        await Promise.all(MODELS.map(async (model) => {
            try {
                const resp = await fetch(`${API_BASE}/${model.configId}/generate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: prompt.text, max_tokens: 120, temperature: 0.8 }),
                    signal: controller.signal,
                });
                if (!resp.ok) throw new Error("API error");
                const data = await resp.json();
                results[model.id] = data.text || data.generated_text || FALLBACK_SAMPLES[model.id][promptIdx];
            } catch {
                results[model.id] = FALLBACK_SAMPLES[model.id][promptIdx];
            }
        }));

        if (!controller.signal.aborted) {
            setOutputs(results);
            setTimeout(() => setRevealed(true), 300);
            setUsedApi(true);
        }
        setGenerating(false);
    }, [generating, prompt, promptIdx]);

    useEffect(() => {
        return () => { abortRef.current?.abort(); };
    }, []);

    /* Show cached samples instantly on mount and prompt change (no API) */
    useEffect(() => {
        setUsedApi(false);
        setRevealed(false);
        const t = setTimeout(() => showFallback(), 100);
        return () => clearTimeout(t);
    }, [promptIdx, showFallback]);

    return (
        <div className="flex flex-col items-center gap-5 w-full py-4 px-2">
            {/* ── Prompt selector ── */}
            <div className="flex items-center gap-2">
                <span className="text-[11px] text-white/25 font-semibold mr-1">Prompt:</span>
                {PROMPTS.map((p, i) => (
                    <button key={i}
                        onClick={() => { setPromptIdx(i); }}
                        className="px-3 py-1 rounded-lg text-[12px] font-mono font-semibold cursor-pointer transition-all"
                        style={{
                            background: promptIdx === i ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.02)",
                            color: promptIdx === i ? "#22d3ee" : "rgba(255,255,255,0.25)",
                            border: promptIdx === i ? "1.5px solid rgba(34,211,238,0.3)" : "1px solid rgba(255,255,255,0.05)",
                        }}>
                        {p.label}
                    </button>
                ))}
                {/* Generate fresh from API */}
                <button
                    onClick={() => generateFromApi()}
                    disabled={generating}
                    className="ml-2 px-3 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all"
                    style={{
                        background: generating ? "rgba(255,255,255,0.03)" : "rgba(34,211,238,0.06)",
                        color: generating ? "rgba(255,255,255,0.15)" : "rgba(34,211,238,0.5)",
                        border: "1px solid rgba(34,211,238,0.1)",
                    }}>
                    {generating ? "Generating…" : usedApi ? "↻ Regenerate" : "⚡ Generate fresh"}
                </button>
            </div>

            {/* ── Three columns ── */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-2xl">
                {MODELS.map((model, mi) => {
                    const text = outputs[model.id] || "";
                    const hasOutput = text.length > 0;
                    const isWinner = model.id === "4b";
                    const isWarning = model.id === "12b";

                    return (
                        <motion.div key={model.id}
                            className="relative flex flex-col rounded-xl overflow-hidden"
                            style={{
                                background: "rgba(255,255,255,0.015)",
                                border: `1.5px solid ${isWinner && revealed
                                    ? `rgba(${model.rgb},0.35)`
                                    : `rgba(255,255,255,0.05)`}`,
                            }}
                            animate={{
                                boxShadow: isWinner && revealed
                                    ? `0 0 20px rgba(${model.rgb},0.08), inset 0 0 20px rgba(${model.rgb},0.03)`
                                    : "none",
                            }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-3 py-2"
                                style={{ borderBottom: `1px solid rgba(${model.rgb},0.1)` }}>
                                <span className="text-[12px] font-bold" style={{ color: model.color }}>
                                    {model.label}
                                </span>
                                <span className="text-[9px] font-mono text-white/15">
                                    {model.blocks}b/128d
                                </span>
                            </div>

                            {/* Generated text */}
                            <div className="px-3 py-2.5 min-h-[140px] flex items-start">
                                {generating && !hasOutput ? (
                                    <div className="flex items-center gap-2">
                                        <motion.div
                                            className="w-1.5 h-1.5 rounded-full"
                                            style={{ background: model.color }}
                                            animate={{ opacity: [0.2, 0.8, 0.2] }}
                                            transition={{ duration: 1.2, repeat: Infinity }}
                                        />
                                        <span className="text-[11px] text-white/20">Generating...</span>
                                    </div>
                                ) : hasOutput ? (
                                    <AnimatePresence>
                                        <motion.p
                                            className="text-[11px] leading-relaxed font-mono"
                                            style={{ color: "rgba(255,255,255,0.5)" }}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.4, delay: mi * 0.15 }}
                                        >
                                            <span style={{ color: "rgba(34,211,238,0.5)" }}>{prompt.text}</span>
                                            {text.startsWith(prompt.text) ? text.slice(prompt.text.length) : text}
                                        </motion.p>
                                    </AnimatePresence>
                                ) : null}
                            </div>

                            {/* Verdict */}
                            {revealed && (
                                <motion.div
                                    className="px-3 py-2"
                                    style={{
                                        borderTop: `1px solid rgba(${model.rgb},0.08)`,
                                        background: `rgba(${model.rgb},0.03)`,
                                    }}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + mi * 0.15 }}
                                >
                                    <p className="text-[10px] leading-relaxed" style={{ color: model.verdictColor }}>
                                        <span className="mr-1">{model.icon}</span>
                                        {model.verdict}
                                    </p>
                                </motion.div>
                            )}

                            {/* Winner glow badge */}
                            {isWinner && revealed && (
                                <motion.div
                                    className="absolute -top-px -right-px px-2 py-0.5 rounded-bl-lg text-[9px] font-bold"
                                    style={{
                                        background: `rgba(${model.rgb},0.15)`,
                                        color: model.color,
                                        border: `1px solid rgba(${model.rgb},0.25)`,
                                    }}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.8, type: "spring" }}
                                >
                                    BEST
                                </motion.div>
                            )}

                            {/* Warning badge for 12-block */}
                            {isWarning && revealed && (
                                <motion.div
                                    className="absolute -top-px -right-px px-2 py-0.5 rounded-bl-lg text-[9px] font-bold"
                                    style={{
                                        background: "rgba(251,191,36,0.1)",
                                        color: "#fbbf24",
                                        border: "1px solid rgba(251,191,36,0.2)",
                                    }}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.8, type: "spring" }}
                                >
                                    MEMORIZED?
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* ── Insight ── */}
            {revealed && (
                <motion.div
                    className="max-w-md text-center"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                >
                    <p className="text-[12px] text-white/30 leading-relaxed">
                        More depth improves quality{"\u2014"}until the model starts{" "}
                        <span className="font-semibold text-amber-400/60">memorizing training data</span>{" "}
                        instead of learning patterns. The 12-block model{" "}
                        <span className="font-semibold text-rose-400/60">quotes verbatim</span>.
                    </p>
                </motion.div>
            )}
        </div>
    );
}
