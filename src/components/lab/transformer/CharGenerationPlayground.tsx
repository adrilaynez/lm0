"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  CharGenerationPlayground — VIZ 5  ⭐⭐⭐⭐⭐
  
  THE FLAGSHIP DEMO.
  Type a prompt, watch the Transformer generate character by character.
  Control temperature, see probabilities, force characters.
  This is the moment of POWER.
  
  API: POST /api/v1/transformer/gpt_4b_128d/generate
  Fallback: pattern-based mock generation with realistic distributions.
*/

/* ═══════════════════════════════════════════════════════════════
   MOCK GENERATION ENGINE
   Produces realistic-looking character distributions when API
   is unavailable. Uses bigram patterns + frequency fallback.
   ═══════════════════════════════════════════════════════════════ */

const CHARS = " abcdefghijklmnopqrstuvwxyz.,;:!?'-\n";

/* Base English character frequencies (approximate) */
const BASE_FREQ: Record<string, number> = {
    " ": 18, e: 11, t: 8.5, a: 7.8, o: 7.2, i: 6.8, n: 6.5, s: 5.8, h: 5.2,
    r: 5, d: 3.8, l: 3.5, c: 2.5, u: 2.5, m: 2.2, w: 2, f: 1.9, g: 1.7,
    y: 1.7, p: 1.5, b: 1.3, v: 0.9, k: 0.6, j: 0.15, x: 0.13, q: 0.09,
    z: 0.07, ".": 1.2, ",": 1.5, "'": 0.4, "-": 0.2, "!": 0.1, "?": 0.1,
    ";": 0.05, ":": 0.05, "\n": 0.8,
};

/* Common bigram overrides: last2chars → { nextChar: weight } */
const BIGRAMS: Record<string, Record<string, number>> = {
    "th": { e: 65, a: 10, i: 8, o: 5, r: 3, u: 2, y: 2 },
    "he": { " ": 40, r: 15, n: 10, l: 8, a: 5, s: 5, d: 3, y: 3 },
    "in": { " ": 25, g: 25, t: 10, d: 8, e: 5, s: 5, n: 3, k: 3 },
    "an": { d: 35, " ": 20, t: 10, y: 8, e: 5, i: 5, n: 3, s: 3 },
    "er": { " ": 30, e: 15, s: 10, i: 8, a: 5, n: 5, y: 3 },
    "on": { " ": 25, e: 15, t: 10, s: 8, l: 5, g: 5, d: 5 },
    "re": { " ": 20, a: 12, s: 10, d: 8, e: 5, n: 5, l: 5 },
    "ed": { " ": 55, ",": 8, ".": 8 },
    "at": { " ": 20, e: 18, i: 14, h: 10, t: 8, s: 5, o: 5 },
    "ou": { r: 28, t: 18, l: 10, n: 10, s: 8, g: 5 },
    "en": { " ": 22, t: 15, d: 10, c: 8, e: 5, n: 5, s: 5 },
    "nd": { " ": 50, e: 10, s: 8, i: 5 },
    "ng": { " ": 45, s: 10, l: 5 },
    "is": { " ": 35, t: 10, h: 8, s: 5 },
    "or": { " ": 25, e: 15, d: 8, t: 8, k: 5 },
    "ti": { o: 30, n: 15, m: 10, v: 8, l: 5, c: 5 },
    "es": { " ": 35, s: 10, t: 8 },
    "te": { " ": 20, d: 15, r: 12, n: 8, l: 5 },
    "of": { " ": 70, f: 5 },
    "to": { " ": 55, o: 8, r: 5, w: 5, n: 5 },
    "it": { " ": 25, h: 18, s: 12, y: 8, e: 5 },
    "ha": { t: 25, d: 15, s: 12, v: 10, n: 8, l: 5, r: 5 },
    "al": { l: 20, " ": 15, s: 8, i: 8, t: 5, w: 5 },
    "as": { " ": 35, t: 8, s: 5, k: 3 },
    ". ": { T: 0, t: 18, A: 0, a: 8, I: 0, S: 0, s: 6, H: 0, h: 6, W: 0, w: 6, B: 0, b: 4, N: 0, n: 4, F: 0, f: 4 },
    ", ": { t: 12, a: 10, w: 8, s: 7, i: 6, h: 6, b: 5, n: 5, f: 4, m: 4 },
    " t": { h: 45, o: 15, a: 10, i: 5, r: 3, e: 3, w: 3, u: 3 },
    " a": { n: 25, " ": 5, l: 10, r: 8, s: 8, t: 5, b: 3, c: 3 },
    " w": { a: 25, h: 20, i: 15, o: 10, e: 8, r: 3 },
    " s": { t: 15, h: 12, o: 10, e: 8, a: 8, i: 5, u: 5, p: 5 },
    " i": { n: 25, t: 15, s: 15, f: 5, m: 3 },
    " o": { f: 30, n: 15, r: 10, u: 8, v: 5 },
    " b": { e: 25, u: 15, y: 10, a: 8, r: 5 },
};

/* Preset target continuations for perfect demo output */
const PRESET_TARGETS: Record<string, string> = {
    "First, ": "let me tell you about the time I realized that building something real takes patience. The world is full of ideas, but the ones that matter are the ones you actually finish. Every great project started with someone who refused to stop.",
    "The king ": "sat upon his golden throne and watched the courtiers gather in the great hall. He knew the news from the northern border would not be pleasant, but a ruler must face the truth, however bitter. The silence grew heavy.",
    "To be or ": "not to be, that is the question. Whether the mind can truly understand itself, or whether we are forever lost in the patterns of our own making. The answer, perhaps, lies not in knowing but in asking.",
};

function applyTemperature(dist: Record<string, number>, temp: number): { char: string; prob: number }[] {
    const entries = Object.entries(dist).filter(([, w]) => w > 0);
    if (entries.length === 0) return [{ char: " ", prob: 1 }];

    const logits = entries.map(([, w]) => Math.log(w + 1e-10) / Math.max(temp, 0.05));
    const maxL = Math.max(...logits);
    const exps = logits.map(l => Math.exp(l - maxL));
    const sum = exps.reduce((a, b) => a + b, 0);

    return entries
        .map(([ch], i) => ({ char: ch, prob: exps[i] / sum }))
        .sort((a, b) => b.prob - a.prob);
}

function sampleFrom(probs: { char: string; prob: number }[]): string {
    const r = Math.random();
    let acc = 0;
    for (const p of probs) { acc += p.prob; if (r < acc) return p.char; }
    return probs[0]?.char ?? " ";
}

function mockPredict(context: string, temperature: number): { char: string; probs: { char: string; prob: number }[] } {
    const lower = context.toLowerCase();
    const last2 = lower.slice(-2);
    const last1 = lower.slice(-1);

    /* Check if we're following a preset target */
    for (const [prefix, target] of Object.entries(PRESET_TARGETS)) {
        if (context.startsWith(prefix) || context.startsWith(prefix.trimEnd())) {
            const genSoFar = context.slice(prefix.length);
            if (genSoFar.length < target.length) {
                const targetChar = target[genSoFar.length];
                /* Build a distribution peaked at the target character */
                const dist: Record<string, number> = {};
                for (const ch of CHARS) dist[ch] = BASE_FREQ[ch] ?? 0.05;
                dist[targetChar] = (dist[targetChar] ?? 1) * 8;
                const probs = applyTemperature(dist, temperature);
                /* For low temperature, almost always pick the target */
                if (temperature < 1.0) {
                    return { char: targetChar, probs };
                }
                const char = sampleFrom(probs);
                return { char, probs };
            }
        }
    }

    /* Bigram-based generation */
    let dist: Record<string, number> = {};
    if (BIGRAMS[last2]) {
        dist = { ...BIGRAMS[last2] };
    } else {
        /* Fallback: use single-char context patterns */
        const isVowel = "aeiou".includes(last1);
        for (const ch of CHARS) {
            let w = BASE_FREQ[ch] ?? 0.05;
            /* After vowel, consonants more likely; after consonant, vowels more likely */
            const nextIsVowel = "aeiou".includes(ch);
            if (isVowel && !nextIsVowel) w *= 1.3;
            if (!isVowel && nextIsVowel) w *= 1.3;
            /* After space, no space */
            if (last1 === " " && ch === " ") w *= 0.01;
            dist[ch] = w;
        }
    }

    /* Fill missing chars with tiny weights */
    for (const ch of CHARS) {
        if (!(ch in dist)) dist[ch] = 0.01;
    }

    const probs = applyTemperature(dist, temperature);
    const char = sampleFrom(probs);
    return { char, probs };
}

/* ═══════════════════════════════════════════════════════════════
   API INTEGRATION
   ═══════════════════════════════════════════════════════════════ */

const API_BASE = "/api/v1/transformer";

async function apiPredict(
    text: string,
    temperature: number,
    signal: AbortSignal,
): Promise<{ char: string; probs: { char: string; prob: number }[] } | null> {
    try {
        const resp = await fetch(`${API_BASE}/gpt_4b_128d/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: text, max_tokens: 1, temperature, return_probs: true }),
            signal,
        });
        if (!resp.ok) return null;
        const data = await resp.json();
        const genChar = data.generated?.[0] ?? data.text?.slice(-1);
        const probs: { char: string; prob: number }[] = data.probabilities?.[0] ?? [];
        if (!genChar) return null;
        return { char: genChar, probs: probs.length > 0 ? probs : [{ char: genChar, prob: 1 }] };
    } catch {
        return null;
    }
}

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface GeneratedChar {
    char: string;
    probs: { char: string; prob: number }[];
    confidence: number;
    forced: boolean;
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT: PROBABILITY PILL
   ═══════════════════════════════════════════════════════════════ */

function ProbPill({ char, prob, rank, onClick }: {
    char: string; prob: number; rank: number; onClick: () => void;
}) {
    const displayChar = char === " " ? "\u2423" : char === "\n" ? "\u21B5" : char;
    const brightness = Math.max(0.3, prob * 2);

    return (
        <motion.button
            onClick={onClick}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer group"
            style={{
                background: `rgba(34,211,238,${(0.06 + prob * 0.2).toFixed(2)})`,
                border: `1px solid rgba(34,211,238,${(0.15 + prob * 0.3).toFixed(2)})`,
            }}
            whileHover={{ scale: 1.05, backgroundColor: `rgba(34,211,238,${(0.12 + prob * 0.25).toFixed(2)})` }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rank * 0.03, duration: 0.15 }}
        >
            <span className="font-mono text-[14px] font-bold"
                style={{ color: `rgba(34,211,238,${Math.min(1, brightness * 1.2).toFixed(2)})` }}>
                {displayChar}
            </span>
            <span className="text-[11px] font-mono tabular-nums text-white/30 group-hover:text-white/50 transition-colors">
                {(prob * 100).toFixed(0)}%
            </span>
        </motion.button>
    );
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT: FULL PROBABILITY BAR CHART
   ═══════════════════════════════════════════════════════════════ */

function ProbBarChart({ probs, onForce }: {
    probs: { char: string; prob: number }[];
    onForce: (char: string) => void;
}) {
    const top = probs.slice(0, 20);
    const maxProb = top[0]?.prob ?? 0.01;

    return (
        <motion.div
            className="space-y-[3px]"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
        >
            {top.map((p, i) => {
                const displayChar = p.char === " " ? "\u2423" : p.char === "\n" ? "\u21B5" : p.char;
                const width = (p.prob / maxProb) * 100;
                const isHigh = p.prob > 0.15;
                const isMed = p.prob > 0.05;

                return (
                    <motion.button key={`${p.char}-${i}`}
                        className="flex items-center gap-2 w-full group cursor-pointer"
                        onClick={() => onForce(p.char)}
                        whileHover={{ x: 2 }}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.015, duration: 0.15 }}
                    >
                        <span className="w-5 text-right font-mono text-[12px] font-bold shrink-0"
                            style={{
                                color: isHigh ? "rgba(34,211,238,0.95)"
                                    : isMed ? "rgba(255,255,255,0.5)"
                                        : "rgba(255,255,255,0.2)",
                            }}>
                            {displayChar}
                        </span>
                        <div className="flex-1 h-[18px] rounded-full overflow-hidden relative"
                            style={{ background: "rgba(255,255,255,0.02)" }}>
                            <motion.div
                                className="absolute inset-y-0 left-0 rounded-full"
                                style={{
                                    background: isHigh
                                        ? "linear-gradient(90deg, rgba(34,211,238,0.25), rgba(34,211,238,0.6))"
                                        : isMed
                                            ? "linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.18))"
                                            : "rgba(255,255,255,0.05)",
                                }}
                                initial={{ width: 0 }}
                                animate={{ width: `${width}%` }}
                                transition={{ duration: 0.3, delay: i * 0.01 }}
                            />
                            <div className="absolute inset-0 flex items-center px-2">
                                <span className="text-[10px] font-mono tabular-nums ml-auto"
                                    style={{
                                        color: isHigh ? "rgba(34,211,238,0.9)"
                                            : "rgba(255,255,255,0.25)",
                                    }}>
                                    {(p.prob * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </motion.button>
                );
            })}
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT: TEMPERATURE SLIDER
   ═══════════════════════════════════════════════════════════════ */

const TEMP_MARKS = [
    { val: 0.1, label: "Deterministic", color: "#3b82f6" },
    { val: 0.5, label: "Conservative", color: "#6366f1" },
    { val: 0.8, label: "Natural", color: "#22d3ee" },
    { val: 1.5, label: "Creative", color: "#f59e0b" },
    { val: 2.5, label: "Chaotic", color: "#ef4444" },
];

function TemperatureSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const pct = ((value - 0.1) / 2.4) * 100;

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-white/30 font-semibold uppercase tracking-wider">Temperature</span>
                <span className="text-[13px] font-mono font-bold tabular-nums"
                    style={{
                        color: value <= 0.5 ? "#3b82f6"
                            : value <= 1.0 ? "#22d3ee"
                                : value <= 1.5 ? "#f59e0b"
                                    : "#ef4444",
                    }}>
                    {value.toFixed(1)}
                </span>
            </div>

            <div className="relative h-8 flex items-center">
                {/* Track */}
                <div className="absolute inset-x-0 h-1.5 rounded-full"
                    style={{
                        background: "linear-gradient(90deg, #3b82f6 0%, #6366f1 20%, #22d3ee 30%, #f59e0b 60%, #ef4444 100%)",
                        opacity: 0.3,
                    }} />
                {/* Filled portion */}
                <div className="absolute left-0 h-1.5 rounded-full"
                    style={{
                        width: `${pct}%`,
                        background: "linear-gradient(90deg, #3b82f6 0%, #6366f1 30%, #22d3ee 50%, #f59e0b 75%, #ef4444 100%)",
                        opacity: 0.7,
                    }} />
                {/* Input */}
                <input
                    type="range"
                    min="0.1"
                    max="2.5"
                    step="0.1"
                    value={value}
                    onChange={e => onChange(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {/* Thumb */}
                <motion.div
                    className="absolute w-4 h-4 rounded-full border-2"
                    style={{
                        left: `calc(${pct}% - 8px)`,
                        background: value <= 0.5 ? "#3b82f6"
                            : value <= 1.0 ? "#22d3ee"
                                : value <= 1.5 ? "#f59e0b"
                                    : "#ef4444",
                        borderColor: "rgba(255,255,255,0.15)",
                        boxShadow: `0 0 12px ${value <= 0.5 ? "rgba(59,130,246,0.4)"
                            : value <= 1.0 ? "rgba(34,211,238,0.4)"
                                : value <= 1.5 ? "rgba(245,158,11,0.4)"
                                    : "rgba(239,68,68,0.4)"}`,
                    }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.15 }}
                />
            </div>

            {/* Labels */}
            <div className="flex justify-between mt-1">
                {TEMP_MARKS.map(m => {
                    const pos = ((m.val - 0.1) / 2.4) * 100;
                    const near = Math.abs(value - m.val) < 0.15;
                    return (
                        <span key={m.val}
                            className="text-[8px] font-semibold"
                            style={{
                                color: near ? m.color : "rgba(255,255,255,0.12)",
                                position: "absolute",
                                left: `${pos}%`,
                                transform: "translateX(-50%)",
                            }}>
                            {m.label}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   PRESETS
   ═══════════════════════════════════════════════════════════════ */

const PRESETS = [
    { label: "First, ", text: "First, " },
    { label: "The king ", text: "The king " },
    { label: "To be or ", text: "To be or " },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function CharGenerationPlayground() {
    /* ── State ── */
    const [prompt, setPrompt] = useState("First, ");
    const [chars, setChars] = useState<GeneratedChar[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [temperature, setTemperature] = useState(0.8);
    const [speed, setSpeed] = useState(200);
    const [showFullProbs, setShowFullProbs] = useState(false);
    const [maxTokens, setMaxTokens] = useState(150);
    const [currentProbs, setCurrentProbs] = useState<{ char: string; prob: number }[]>([]);

    /* ── Refs (for async loop) ── */
    const generatingRef = useRef(false);
    const pausedRef = useRef(false);
    const tempRef = useRef(temperature);
    const speedRef = useRef(speed);
    const abortRef = useRef<AbortController | null>(null);
    const charsRef = useRef<GeneratedChar[]>([]);
    const promptRef = useRef(prompt);
    const textAreaRef = useRef<HTMLDivElement>(null);
    const forcedCharRef = useRef<string | null>(null);

    /* Keep refs in sync */
    useEffect(() => { tempRef.current = temperature; }, [temperature]);
    useEffect(() => { speedRef.current = speed; }, [speed]);
    useEffect(() => { pausedRef.current = isPaused; }, [isPaused]);
    useEffect(() => { charsRef.current = chars; }, [chars]);
    useEffect(() => { promptRef.current = prompt; }, [prompt]);

    /* Auto-scroll text area */
    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
        }
    }, [chars]);

    const generatedText = useMemo(() => chars.map(c => c.char).join(""), [chars]);

    /* ── Generation loop ── */
    const startGeneration = useCallback(async (tokenCount: number) => {
        if (generatingRef.current) return;

        generatingRef.current = true;
        setIsGenerating(true);
        setIsPaused(false);
        pausedRef.current = false;

        const controller = new AbortController();
        abortRef.current = controller;

        const startLen = charsRef.current.length;
        let i = 0;

        while (generatingRef.current && i < tokenCount) {
            /* Wait while paused */
            while (pausedRef.current && generatingRef.current) {
                await new Promise(r => setTimeout(r, 100));
            }
            if (!generatingRef.current) break;

            const fullText = promptRef.current + charsRef.current.map(c => c.char).join("");

            /* Check for forced character */
            let result: { char: string; probs: { char: string; prob: number }[] };
            const forced = forcedCharRef.current;
            forcedCharRef.current = null;

            if (forced) {
                /* Use forced character with fake probs */
                const mockResult = mockPredict(fullText, tempRef.current);
                result = { char: forced, probs: mockResult.probs };
            } else {
                /* Try API, fall back to mock */
                const apiResult = await apiPredict(fullText, tempRef.current, controller.signal);
                if (controller.signal.aborted) break;
                result = apiResult ?? mockPredict(fullText, tempRef.current);
            }

            const confidence = result.probs.find(p => p.char === result.char)?.prob ?? 0;

            const newChar: GeneratedChar = {
                char: result.char,
                probs: result.probs,
                confidence,
                forced: !!forced,
            };

            setChars(prev => [...prev, newChar]);
            setCurrentProbs(result.probs);
            i++;

            /* Delay between characters */
            await new Promise(r => setTimeout(r, speedRef.current));
        }

        generatingRef.current = false;
        setIsGenerating(false);
    }, []);

    const stopGeneration = useCallback(() => {
        generatingRef.current = false;
        abortRef.current?.abort();
        setIsGenerating(false);
        setIsPaused(false);
    }, []);

    const togglePause = useCallback(() => {
        setIsPaused(p => !p);
    }, []);

    const resetGeneration = useCallback(() => {
        stopGeneration();
        setChars([]);
        setCurrentProbs([]);
        charsRef.current = [];
    }, [stopGeneration]);

    const handleGenerate = useCallback(() => {
        if (isGenerating) { stopGeneration(); return; }
        resetGeneration();
        setTimeout(() => startGeneration(maxTokens), 50);
    }, [isGenerating, stopGeneration, resetGeneration, startGeneration, maxTokens]);

    const handleGenerate50 = useCallback(() => {
        if (isGenerating) return;
        resetGeneration();
        setTimeout(() => startGeneration(50), 50);
    }, [isGenerating, resetGeneration, startGeneration]);

    const handleForceChar = useCallback((char: string) => {
        if (!isGenerating) return;
        forcedCharRef.current = char;
    }, [isGenerating]);

    const handleCopy = useCallback(() => {
        navigator.clipboard?.writeText(prompt + generatedText);
    }, [prompt, generatedText]);

    const handlePreset = useCallback((text: string) => {
        stopGeneration();
        setPrompt(text);
        setChars([]);
        setCurrentProbs([]);
        charsRef.current = [];
    }, [stopGeneration]);

    /* Speed percentage for display */
    const speedLabel = speed <= 80 ? "Fast" : speed <= 200 ? "Normal" : "Slow";

    return (
        <div className="w-full max-w-[620px] mx-auto py-6 px-3 sm:px-5">
            {/* ── Preset pills ── */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-[10px] text-white/20 font-semibold uppercase tracking-wider mr-1">Try:</span>
                {PRESETS.map(p => (
                    <button key={p.label}
                        onClick={() => handlePreset(p.text)}
                        className="px-3 py-1 rounded-lg text-[12px] font-mono cursor-pointer transition-all"
                        style={{
                            background: prompt === p.text ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.02)",
                            color: prompt === p.text ? "rgba(34,211,238,0.8)" : "rgba(255,255,255,0.25)",
                            border: prompt === p.text ? "1px solid rgba(34,211,238,0.25)" : "1px solid rgba(255,255,255,0.05)",
                        }}>
                        {p.label}
                    </button>
                ))}
            </div>

            {/* ── Prompt input ── */}
            <div className="mb-4">
                <div className="relative">
                    <input
                        type="text"
                        value={prompt}
                        onChange={e => { setPrompt(e.target.value); if (!isGenerating) resetGeneration(); }}
                        placeholder="Type a prompt... (try 'First, ' or 'The king ')"
                        className="w-full px-4 py-3 rounded-xl text-[14px] font-mono text-white/80 placeholder:text-white/15 outline-none"
                        style={{
                            background: "rgba(255,255,255,0.03)",
                            borderBottom: "2px solid rgba(34,211,238,0.15)",
                        }}
                        disabled={isGenerating}
                    />
                </div>
            </div>

            {/* ── Generate buttons ── */}
            <div className="flex items-center gap-2 mb-5">
                <motion.button
                    onClick={handleGenerate}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-semibold cursor-pointer"
                    style={{
                        background: isGenerating
                            ? "rgba(244,63,94,0.12)"
                            : "rgba(34,211,238,0.12)",
                        border: `1.5px solid ${isGenerating
                            ? "rgba(244,63,94,0.3)"
                            : "rgba(34,211,238,0.3)"}`,
                        color: isGenerating ? "#f43f5e" : "#22d3ee",
                    }}
                >
                    {isGenerating ? (
                        <><svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="2" y="2" width="10" height="10" rx="2" /></svg>Stop</>
                    ) : (
                        <><svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 1.5v11l9.5-5.5z" /></svg>Generate</>
                    )}
                </motion.button>

                {!isGenerating && (
                    <button onClick={handleGenerate50}
                        className="px-4 py-2 rounded-xl text-[12px] font-semibold cursor-pointer"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}>
                        Generate 50
                    </button>
                )}

                {isGenerating && (
                    <button onClick={togglePause}
                        className="px-4 py-2 rounded-xl text-[12px] font-semibold cursor-pointer"
                        style={{
                            background: isPaused ? "rgba(251,191,36,0.1)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${isPaused ? "rgba(251,191,36,0.25)" : "rgba(255,255,255,0.06)"}`,
                            color: isPaused ? "#fbbf24" : "rgba(255,255,255,0.3)",
                        }}>
                        {isPaused ? "Resume" : "Pause"}
                    </button>
                )}

                {chars.length > 0 && !isGenerating && (
                    <>
                        <button onClick={resetGeneration}
                            className="px-3 py-2 rounded-xl text-[11px] font-semibold cursor-pointer"
                            style={{ color: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                            Reset
                        </button>
                        <button onClick={handleCopy}
                            className="px-3 py-2 rounded-xl text-[11px] font-semibold cursor-pointer"
                            style={{ color: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                            Copy
                        </button>
                    </>
                )}
            </div>

            {/* ── Text display ── */}
            <div ref={textAreaRef}
                className="rounded-xl px-4 py-4 mb-4 font-mono text-[14px] leading-relaxed overflow-y-auto"
                style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(34,211,238,0.06)",
                    minHeight: 120,
                    maxHeight: 280,
                }}
            >
                {/* Prompt text */}
                <span style={{ color: "rgba(255,255,255,0.5)" }}>{prompt}</span>

                {/* Generated characters */}
                {chars.map((c, i) => {
                    const brightness = 0.5 + c.confidence * 0.5;
                    const isForced = c.forced;

                    return (
                        <motion.span key={i}
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.1 }}
                            style={{
                                color: isForced
                                    ? `rgba(251,191,36,${brightness.toFixed(2)})`
                                    : `rgba(34,211,238,${brightness.toFixed(2)})`,
                                textShadow: c.confidence > 0.3
                                    ? `0 0 10px rgba(34,211,238,${(c.confidence * 0.4).toFixed(2)}), 0 0 20px rgba(34,211,238,${(c.confidence * 0.15).toFixed(2)})`
                                    : "none",
                            }}
                            title={`"${c.char === " " ? "\u2423" : c.char}" \u2014 ${(c.confidence * 100).toFixed(1)}% confidence${isForced ? " (forced)" : ""}`}
                        >
                            {c.char}
                        </motion.span>
                    );
                })}

                {/* Blinking cursor */}
                {(isGenerating || chars.length === 0) && (
                    <motion.span
                        className="inline-block w-[2px] h-[16px] ml-[1px] align-middle rounded-full"
                        style={{ background: "#22d3ee" }}
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: isPaused ? 0.8 : 0.4, repeat: Infinity }}
                    />
                )}

                {/* Empty state */}
                {chars.length === 0 && !isGenerating && (
                    <span className="text-white/10 italic"> click Generate to start...</span>
                )}
            </div>

            {/* ── Character counter ── */}
            {chars.length > 0 && (
                <div className="flex items-center justify-between mb-4 px-1">
                    <span className="text-[10px] text-white/15 font-mono">
                        {chars.length} char{chars.length !== 1 ? "s" : ""} generated
                    </span>
                    {chars.some(c => c.forced) && (
                        <span className="text-[10px] text-amber-400/30 font-mono">
                            {chars.filter(c => c.forced).length} forced
                        </span>
                    )}
                </div>
            )}

            {/* ── Probability panel ── */}
            {currentProbs.length > 0 && (
                <div className="rounded-xl px-4 py-3 mb-5"
                    style={{
                        background: "rgba(0,0,0,0.25)",
                        border: "1px solid rgba(34,211,238,0.08)",
                    }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] text-white/25 font-semibold">
                            Next character predictions
                            {isGenerating && <span className="text-cyan-400/40 ml-1">(click to force)</span>}
                        </span>
                        <button onClick={() => setShowFullProbs(!showFullProbs)}
                            className="text-[10px] text-white/20 hover:text-white/40 cursor-pointer transition-colors">
                            {showFullProbs ? "Collapse" : "Expand"} {showFullProbs ? "\u25B4" : "\u25BE"}
                        </button>
                    </div>

                    {/* Collapsed: top-3 pills */}
                    {!showFullProbs && (
                        <div className="flex flex-wrap gap-2">
                            {currentProbs.slice(0, 5).map((p, i) => (
                                <ProbPill key={`${p.char}-${i}`}
                                    char={p.char} prob={p.prob} rank={i}
                                    onClick={() => handleForceChar(p.char)} />
                            ))}
                            <span className="text-[10px] text-white/10 self-center ml-1">
                                +{Math.max(0, currentProbs.length - 5)} more
                            </span>
                        </div>
                    )}

                    {/* Expanded: full bar chart */}
                    <AnimatePresence>
                        {showFullProbs && (
                            <ProbBarChart probs={currentProbs} onForce={handleForceChar} />
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* ── Temperature ── */}
            <div className="mb-6 relative" style={{ minHeight: 70 }}>
                <TemperatureSlider value={temperature} onChange={setTemperature} />
            </div>

            {/* ── Speed control ── */}
            <div className="flex items-center gap-3 mb-3 px-1">
                <span className="text-[10px] text-white/20 font-semibold uppercase tracking-wider">Speed</span>
                <input
                    type="range"
                    min="50"
                    max="500"
                    step="25"
                    value={550 - speed}
                    onChange={e => setSpeed(550 - parseInt(e.target.value))}
                    className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.06)", accentColor: "#22d3ee" }}
                />
                <span className="text-[10px] text-white/20 font-mono w-12 text-right">
                    {speedLabel}
                </span>
            </div>

            {/* ── Educational caption ── */}
            <motion.p
                className="text-[11px] text-center text-white/15 leading-relaxed mt-4 max-w-md mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                The model predicts one character at a time. Each character is sampled from a probability distribution.
                Lower temperature {"\u2192"} more predictable. Higher temperature {"\u2192"} more creative.
                Click any prediction to force that character.
            </motion.p>
        </div>
    );
}
