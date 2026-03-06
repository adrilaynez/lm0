"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, Info, Play, RotateCcw, SkipForward, Sparkles } from "lucide-react";

/*
  BackpropEmbeddingVisualizer — v2 (Illustrative)
  Fully fake data with only 8 characters. Shows step-by-step backprop:
    1. Forward pass: input → embedding lookup → hidden → output
    2. Loss computation
    3. Gradient calculation: ∂L/∂E
    4. Embedding update: E ← E − lr × ∂L/∂E
  The 2D scatter plot shows embeddings evolving as the user steps through
  training iterations. All data is precomputed/fake for clarity.
*/

// ── 8 characters, 2D embeddings (easy to visualize directly) ──
const CHARS = ["a", "e", "t", "s", "h", "z", ".", " "];
const CHAR_COLORS: Record<string, string> = {
    a: "#f59e0b", e: "#f59e0b",  // vowels = amber
    t: "#a78bfa", s: "#a78bfa", h: "#a78bfa", z: "#a78bfa", // consonants = violet
    ".": "#f43f5e", " ": "#f43f5e", // special = rose
};
const LR = 0.1;

// Pre-scripted training steps — each step has embeddings + backprop info
interface TrainingStep {
    epoch: number;
    phase: "forward" | "loss" | "gradient" | "update" | "result";
    embeddings: Record<string, [number, number]>;
    // Only for forward/loss/gradient/update phases
    input?: string;
    target?: string;
    prediction?: Record<string, number>;
    loss?: number;
    gradients?: Record<string, [number, number]>;
    annotation: string;
}

function lerp2d(a: [number, number], b: [number, number], t: number): [number, number] {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

// Generate illustrative training data — embeddings gradually cluster
function generateSteps(): TrainingStep[] {
    const steps: TrainingStep[] = [];

    // Target positions (where we want chars to end up — vowels together, etc.)
    const targets: Record<string, [number, number]> = {
        a: [-0.8, 0.7], e: [-0.6, 0.9],
        t: [0.7, -0.3], s: [0.9, -0.1], h: [0.5, -0.5], z: [0.3, -0.8],
        ".": [-0.2, -0.9], " ": [0.1, -0.7],
    };

    // Random init
    const init: Record<string, [number, number]> = {
        a: [0.4, -0.2], e: [-0.5, 0.8], t: [-0.3, -0.6], s: [0.7, 0.3],
        h: [-0.8, 0.1], z: [0.1, 0.6], ".": [0.6, -0.9], " ": [-0.9, -0.4],
    };

    // Training examples: context → target
    const examples: [string, string, string][] = [
        ["t", "h", "e"],   // "th" → e
        ["h", "e", " "],   // "he" → space
        [" ", "a", "t"],   // " a" → t
        ["a", "t", "."],   // "at" → .
        [".", " ", "s"],   // ". " → s
        ["s", "a", "t"],   // "sa" → t
        ["e", "a", "t"],   // "ea" → t
        ["t", "h", "e"],   // "th" → e (again, reinforces)
    ];

    const TOTAL_EPOCHS = 8;
    let currentEmb = { ...init };

    for (let epoch = 0; epoch < TOTAL_EPOCHS; epoch++) {
        const [ctx1, ctx2, tgt] = examples[epoch % examples.length];
        const t = (epoch + 1) / TOTAL_EPOCHS;

        // Compute fake but illustrative gradients that push towards targets
        const grads: Record<string, [number, number]> = {};
        for (const ch of CHARS) {
            const cur = currentEmb[ch];
            const tar = targets[ch];
            // Gradient points towards target (simplified)
            const noise = [(Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.15];
            grads[ch] = [
                -((tar[0] - cur[0]) * 0.3 + noise[0]) * (1 + 0.5 * (ch === ctx1 || ch === ctx2 ? 1 : 0)),
                -((tar[1] - cur[1]) * 0.3 + noise[1]) * (1 + 0.5 * (ch === ctx1 || ch === ctx2 ? 1 : 0)),
            ];
        }

        // Fake prediction probabilities
        const pred: Record<string, number> = {};
        for (const ch of CHARS) {
            if (ch === tgt) pred[ch] = 0.08 + t * 0.55; // gets better
            else pred[ch] = (1 - (0.08 + t * 0.55)) / (CHARS.length - 1);
        }
        const loss = -Math.log(Math.max(pred[tgt], 0.01));

        // 1) Forward
        steps.push({
            epoch, phase: "forward",
            embeddings: { ...currentEmb },
            input: `"${ctx1}${ctx2}"`, target: tgt,
            prediction: pred, loss,
            annotation: `The network looks up the positions of "${ctx1}" and "${ctx2}" on the map, feeds them through its brain, and guesses the next letter.`,
        });

        // 2) Loss
        steps.push({
            epoch, phase: "loss",
            embeddings: { ...currentEmb },
            input: `"${ctx1}${ctx2}"`, target: tgt,
            prediction: pred, loss,
            annotation: `How wrong was the guess? Loss = ${loss.toFixed(2)}. ${loss > 1.5 ? "Very wrong — the network needs big corrections." : loss > 0.8 ? "Getting better, but still room to improve." : "Getting good! Only small adjustments needed."}`,
        });

        // 3) Gradient
        steps.push({
            epoch, phase: "gradient",
            embeddings: { ...currentEmb },
            input: `"${ctx1}${ctx2}"`, target: tgt,
            gradients: grads, loss,
            annotation: `Which direction should each letter move on the map to reduce the error? The arrows show the answer — each letter gets a nudge.`,
        });

        // 4) Update embeddings
        const nextEmb: Record<string, [number, number]> = {};
        for (const ch of CHARS) {
            nextEmb[ch] = [
                currentEmb[ch][0] - LR * grads[ch][0],
                currentEmb[ch][1] - LR * grads[ch][1],
            ];
            // Also blend towards target for cleaner illustration
            nextEmb[ch] = lerp2d(nextEmb[ch], targets[ch], 0.08);
        }

        steps.push({
            epoch, phase: "update",
            embeddings: nextEmb,
            input: `"${ctx1}${ctx2}"`, target: tgt,
            gradients: grads, loss,
            annotation: `Move each letter a small step in the direction the arrows pointed. Over many steps, letters that appear in similar contexts drift together.`,
        });

        // 5) Result
        steps.push({
            epoch, phase: "result",
            embeddings: nextEmb,
            annotation: epoch < TOTAL_EPOCHS - 1
                ? `Step ${epoch + 1} complete. Loss: ${loss.toFixed(2)}. Watch the scatter plot — similar characters are getting closer!`
                : `Training complete! Vowels (a, e) clustered together. Consonants (t, s, h) grouped. Special chars (., ␣) separated. The network learned similarity from scratch.`,
        });

        currentEmb = nextEmb;
    }

    return steps;
}

export function BackpropEmbeddingVisualizer() {
    const stepsRef = useRef(generateSteps());
    const steps = stepsRef.current;
    const [stepIdx, setStepIdx] = useState(0);
    const [autoPlaying, setAutoPlaying] = useState(false);
    const autoRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const current = steps[stepIdx];
    const totalSteps = steps.length;

    const nextStep = useCallback(() => {
        setStepIdx(prev => Math.min(prev + 1, totalSteps - 1));
    }, [totalSteps]);

    const reset = useCallback(() => {
        setAutoPlaying(false);
        autoRef.current = false;
        if (timerRef.current) clearTimeout(timerRef.current);
        setStepIdx(0);
    }, []);

    const toggleAutoPlay = useCallback(() => {
        if (autoPlaying) {
            setAutoPlaying(false);
            autoRef.current = false;
            if (timerRef.current) clearTimeout(timerRef.current);
        } else {
            if (stepIdx >= totalSteps - 1) setStepIdx(0);
            setAutoPlaying(true);
            autoRef.current = true;
        }
    }, [autoPlaying, stepIdx, totalSteps]);

    // Auto-advance
    const scheduleNext = useCallback(() => {
        if (!autoRef.current) return;
        const delay = current.phase === "result" ? 1200 : 900;
        timerRef.current = setTimeout(() => {
            setStepIdx(prev => {
                if (prev >= totalSteps - 1) {
                    autoRef.current = false;
                    setAutoPlaying(false);
                    return prev;
                }
                return prev + 1;
            });
        }, delay);
    }, [current?.phase, totalSteps]);

    // Trigger next on step change during autoplay
    useMemo(() => {
        if (autoPlaying) scheduleNext();
    }, [stepIdx, autoPlaying, scheduleNext]);

    // SVG dimensions
    const W = 320, H = 260, PAD = 28;
    const emb = current.embeddings;

    // Compute bounds
    const allPts = CHARS.map(ch => emb[ch]);
    const xs = allPts.map(p => p[0]);
    const ys = allPts.map(p => p[1]);
    const margin = 0.3;
    const xMin = Math.min(...xs) - margin, xMax = Math.max(...xs) + margin;
    const yMin = Math.min(...ys) - margin, yMax = Math.max(...ys) + margin;
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;
    const sx = (x: number) => PAD + ((x - xMin) / xRange) * (W - 2 * PAD);
    const sy = (y: number) => PAD + ((yMax - y) / yRange) * (H - 2 * PAD);

    // Phase color
    const phaseColor = {
        forward: "#60a5fa",
        loss: "#f43f5e",
        gradient: "#f59e0b",
        update: "#10b981",
        result: "#a78bfa",
    }[current.phase];

    const phaseLabel = {
        forward: "① Forward Pass",
        loss: "② Compute Loss",
        gradient: "③ Compute Gradients",
        update: "④ Update Embeddings",
        result: "✓ Step Complete",
    }[current.phase];

    // Epoch progress
    const epochNum = current.epoch + 1;
    const maxEpochs = Math.max(...steps.map(s => s.epoch)) + 1;

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* ── Controls row ── */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleAutoPlay}
                        className="h-8 px-3 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center gap-1.5 text-violet-400 hover:bg-violet-500/25 transition-colors text-xs font-mono"
                    >
                        {autoPlaying ? "⏸ Pause" : <><Play className="w-3 h-3" /> Auto</>}
                    </button>
                    <button
                        onClick={nextStep}
                        disabled={stepIdx >= totalSteps - 1}
                        className="h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center gap-1.5 text-white/40 hover:text-white/60 text-xs font-mono transition-colors disabled:opacity-30"
                    >
                        <SkipForward className="w-3 h-3" /> Next
                    </button>
                    <button onClick={reset} className="text-white/20 hover:text-white/40 transition-colors">
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Epoch + step indicator */}
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-white/20">
                        Training step {epochNum}/{maxEpochs}
                    </span>
                    <div className="flex gap-0.5">
                        {Array.from({ length: maxEpochs }, (_, i) => (
                            <div
                                key={i}
                                className="w-4 h-1.5 rounded-full transition-colors"
                                style={{
                                    backgroundColor: i < epochNum
                                        ? "#a78bfa50"
                                        : i === epochNum - 1
                                            ? "#a78bfa"
                                            : "rgba(255,255,255,0.06)",
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Phase indicator ── */}
            <motion.div
                key={`${stepIdx}-phase`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
            >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: phaseColor }} />
                <span className="text-xs font-mono font-bold" style={{ color: phaseColor }}>
                    {phaseLabel}
                </span>
                {current.input && (
                    <span className="text-[10px] font-mono text-white/30">
                        Input: <span className="text-white/50">{current.input}</span>
                        {current.target && <> → target: <span className="text-emerald-400/70">&quot;{current.target}&quot;</span></>}
                    </span>
                )}
            </motion.div>

            {/* ── Main: scatter + technical side by side ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 2D Scatter Plot */}
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">2D Embedding Space</p>
                        <div className="flex gap-2 text-[7px] font-mono">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> vowels</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-violet-400" /> consonants</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> special</span>
                        </div>
                    </div>

                    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                        {/* Axes */}
                        <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} stroke="white" strokeOpacity={0.04} />
                        <line x1={W / 2} y1={PAD} x2={W / 2} y2={H - PAD} stroke="white" strokeOpacity={0.04} />

                        {/* Gradient arrows (phase: gradient) */}
                        {current.phase === "gradient" && current.gradients && CHARS.map(ch => {
                            const pos = emb[ch];
                            const grad = current.gradients![ch];
                            if (!grad) return null;
                            const scale = 60;
                            // Arrow shows direction of UPDATE (opposite of gradient)
                            const dx = -grad[0] * scale * LR;
                            const dy = grad[1] * scale * LR; // SVG y is inverted
                            return (
                                <motion.line
                                    key={`grad-${ch}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.7 }}
                                    x1={sx(pos[0])} y1={sy(pos[1])}
                                    x2={sx(pos[0]) + dx} y2={sy(pos[1]) + dy}
                                    stroke="#f59e0b" strokeWidth={2}
                                    markerEnd="url(#arrowhead)"
                                />
                            );
                        })}

                        {/* Arrow marker def */}
                        <defs>
                            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                                <polygon points="0 0, 6 2, 0 4" fill="#f59e0b" />
                            </marker>
                        </defs>

                        {/* Character dots */}
                        {CHARS.map(ch => {
                            const pos = emb[ch];
                            const color = CHAR_COLORS[ch];
                            const isInput = current.input?.includes(ch);
                            const isTarget = current.target === ch;
                            const r = isInput || isTarget ? 9 : 6;
                            return (
                                <g key={ch}>
                                    {/* Glow for input/target */}
                                    {(isInput || isTarget) && (
                                        <motion.circle
                                            initial={{ r: 0 }}
                                            animate={{ r: 16 }}
                                            cx={sx(pos[0])} cy={sy(pos[1])}
                                            fill={isTarget ? "#10b98120" : `${color}15`}
                                            stroke={isTarget ? "#10b981" : color}
                                            strokeWidth={1} strokeOpacity={0.3}
                                        />
                                    )}
                                    <motion.circle
                                        cx={sx(pos[0])} cy={sy(pos[1])}
                                        r={r}
                                        fill={color}
                                        fillOpacity={isInput || isTarget ? 0.9 : 0.5}
                                        stroke={isTarget ? "#10b981" : "none"}
                                        strokeWidth={isTarget ? 2 : 0}
                                        animate={{ cx: sx(pos[0]), cy: sy(pos[1]) }}
                                        transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
                                    />
                                    <text
                                        x={sx(pos[0])} y={sy(pos[1]) - r - 4}
                                        textAnchor="middle"
                                        fill={color} fillOpacity={isInput || isTarget ? 1 : 0.6}
                                        fontSize={isInput || isTarget ? 12 : 9}
                                        fontFamily="monospace" fontWeight={700}
                                    >
                                        {ch === " " ? "␣" : ch}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* Technical panel */}
                <div className="space-y-2.5">
                    {/* Embedding matrix */}
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
                        <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-2">Embedding Matrix E</p>
                        <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-0.5 text-[9px] font-mono">
                            <span className="text-white/10">char</span>
                            <span className="text-white/10 text-center">d₀</span>
                            <span className="text-white/10 text-center">d₁</span>
                            {CHARS.map(ch => {
                                const pos = emb[ch];
                                const isActive = current.input?.includes(ch) || current.target === ch;
                                const hasGrad = current.phase === "gradient" && current.gradients?.[ch];
                                return (
                                    <motion.div
                                        key={ch}
                                        className="contents"
                                        animate={{ opacity: 1 }}
                                    >
                                        <span
                                            className="font-bold"
                                            style={{ color: isActive ? CHAR_COLORS[ch] : "rgba(255,255,255,0.25)" }}
                                        >
                                            {ch === " " ? "␣" : ch}
                                        </span>
                                        <motion.span
                                            className="text-center tabular-nums"
                                            animate={{
                                                color: hasGrad
                                                    ? (current.gradients![ch][0] > 0 ? "#f43f5e" : "#10b981")
                                                    : (isActive ? "#e2e8f0" : "rgba(255,255,255,0.20)"),
                                            }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {pos[0].toFixed(3)}
                                        </motion.span>
                                        <motion.span
                                            className="text-center tabular-nums"
                                            animate={{
                                                color: hasGrad
                                                    ? (current.gradients![ch][1] > 0 ? "#f43f5e" : "#10b981")
                                                    : (isActive ? "#e2e8f0" : "rgba(255,255,255,0.20)"),
                                            }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {pos[1].toFixed(3)}
                                        </motion.span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Phase-specific info */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${stepIdx}-info`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            className="rounded-xl border p-3 space-y-2"
                            style={{
                                borderColor: phaseColor + "25",
                                background: `linear-gradient(135deg, ${phaseColor}08, transparent)`,
                            }}
                        >
                            {/* Prediction probabilities */}
                            {(current.phase === "forward" || current.phase === "loss") && current.prediction && (
                                <div className="space-y-1.5">
                                    <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest">
                                        {current.phase === "forward" ? "Predicted Probabilities" : "Loss Calculation"}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {CHARS.map(ch => (
                                            <div
                                                key={ch}
                                                className="flex flex-col items-center gap-0.5 px-1.5 py-1 rounded"
                                                style={{
                                                    backgroundColor: ch === current.target
                                                        ? "rgba(16,185,129,0.1)"
                                                        : "rgba(255,255,255,0.02)",
                                                    borderWidth: ch === current.target ? 1 : 0,
                                                    borderColor: "rgba(16,185,129,0.2)",
                                                }}
                                            >
                                                <span className="text-[8px] font-mono" style={{ color: CHAR_COLORS[ch] }}>
                                                    {ch === " " ? "␣" : ch}
                                                </span>
                                                <span className="text-[8px] font-mono tabular-nums" style={{
                                                    color: ch === current.target ? "#10b981" : "rgba(255,255,255,0.25)",
                                                }}>
                                                    {(current.prediction![ch] * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    {current.phase === "loss" && current.loss !== undefined && (
                                        <div className="flex items-center gap-2 pt-1">
                                            <span className="text-[9px] font-mono text-white/25">Loss =</span>
                                            <span className="text-sm font-mono font-bold" style={{ color: current.loss > 1.5 ? "#f43f5e" : current.loss > 0.8 ? "#f59e0b" : "#10b981" }}>
                                                {current.loss.toFixed(3)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Gradients */}
                            {current.phase === "gradient" && current.gradients && (
                                <div className="space-y-1.5">
                                    <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest">How much to nudge each letter</p>
                                    <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-0.5 text-[8px] font-mono">
                                        <span className="text-white/10">char</span>
                                        <span className="text-white/10 text-center">← →</span>
                                        <span className="text-white/10 text-center">↑ ↓</span>
                                        {CHARS.map(ch => {
                                            const g = current.gradients![ch];
                                            return (
                                                <div key={ch} className="contents">
                                                    <span style={{ color: CHAR_COLORS[ch] }}>{ch === " " ? "␣" : ch}</span>
                                                    <span className="text-center tabular-nums" style={{ color: g[0] > 0 ? "#f43f5e" : "#10b981" }}>
                                                        {g[0] >= 0 ? "+" : ""}{g[0].toFixed(3)}
                                                    </span>
                                                    <span className="text-center tabular-nums" style={{ color: g[1] > 0 ? "#f43f5e" : "#10b981" }}>
                                                        {g[1] >= 0 ? "+" : ""}{g[1].toFixed(3)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[7px] font-mono text-amber-400/40 flex items-center gap-1">
                                        <ArrowDown className="w-2.5 h-2.5" /> Arrows show where each letter will move on the map
                                    </p>
                                </div>
                            )}

                            {/* Update formula */}
                            {current.phase === "update" && (
                                <div className="space-y-2">
                                    <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Moving the letters</p>
                                    <p className="text-[10px] font-mono text-center py-1 text-emerald-400/70">
                                        new position = old position − small step × nudge direction
                                    </p>
                                    <p className="text-[8px] font-mono text-white/25 leading-relaxed">
                                        Each letter shifts slightly on the map. Letters used in this example get bigger shifts.
                                        Over many steps, similar letters end up near each other.
                                    </p>
                                </div>
                            )}

                            {/* Result */}
                            {current.phase === "result" && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1.5">
                                        <Sparkles className="w-3 h-3 text-violet-400" />
                                        <p className="text-[9px] font-mono text-violet-400 font-bold">
                                            {epochNum === maxEpochs ? "Training Complete!" : `Step ${epochNum} done`}
                                        </p>
                                    </div>
                                    {epochNum === maxEpochs && (
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-mono text-white/35 leading-relaxed">
                                                Look at the scatter plot: vowels clustered, consonants grouped, special chars separated.
                                                The network figured this out entirely from predicting the next character!
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Loss history mini-chart */}
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-2">
                        <div className="flex items-center gap-3">
                            <span className="text-[8px] font-mono text-white/15 uppercase">Loss History</span>
                            <div className="flex-1 flex items-end gap-px h-6">
                                {steps.filter(s => s.phase === "loss" && s.loss !== undefined).slice(0, epochNum).map((s, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${Math.min((s.loss! / 3.5) * 100, 100)}%` }}
                                        className="flex-1 rounded-t-sm"
                                        style={{
                                            backgroundColor: s.loss! > 1.5 ? "#f43f5e40" : s.loss! > 0.8 ? "#f59e0b40" : "#10b98140",
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Annotation ── */}
            <AnimatePresence mode="wait">
                <motion.p
                    key={stepIdx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] font-mono text-white/35 leading-relaxed"
                >
                    {current.annotation}
                </motion.p>
            </AnimatePresence>

            {/* ── Beginner explainer ── */}
            <div className="flex items-start gap-2 rounded-lg bg-violet-500/[0.04] border border-violet-500/[0.1] px-3 py-2">
                <Info className="w-3 h-3 text-violet-400/40 shrink-0 mt-0.5" />
                <p className="text-[8px] font-mono text-white/30 leading-relaxed">
                    <strong className="text-violet-400/60">What&apos;s happening:</strong> Each letter starts at a random position on the map.
                    Every training step, the network tries to predict the next letter. When it gets it wrong, it nudges the letters
                    to better positions. After many steps, letters that behave similarly (like vowels) end up near each other —
                    the network discovered similarity on its own! This uses 8 letters and 2D for clarity; the real model uses 27 letters and 10 dimensions.
                </p>
            </div>
        </div>
    );
}
