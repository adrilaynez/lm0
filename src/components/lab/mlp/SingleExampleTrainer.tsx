"use client";

import { useCallback, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";

/*
  SingleExampleTrainer — Enhanced
  Cinematic training loop for ONE example: forward → loss → backward → update.
  Forward pass shows the full visual pipeline:
    letters → one-hot vectors → concatenation → hidden layer → softmax → prediction
  Subsequent phases show loss computation, backprop, and weight updates.
*/

const VOCAB = "abcdefghijklmnopqrstuvwxyz ".split("");
const V = VOCAB.length; // 27

const PHASES = [
    { id: "forward", label: "Forward", hex: "#a78bfa" },
    { id: "loss", label: "Loss", hex: "#f43f5e" },
    { id: "backward", label: "Backward", hex: "#f59e0b" },
    { id: "update", label: "Update", hex: "#34d399" },
] as const;

// Forward pass sub-steps for the cinematic view
const FWD_STEPS = [
    { id: "input", label: "Input Characters" },
    { id: "onehot", label: "One-Hot Encode" },
    { id: "concat", label: "Concatenate" },
    { id: "hidden", label: "Hidden Layer" },
    { id: "output", label: "Softmax → Predict" },
] as const;

const INPUT_CHARS = ["h", "e", "l"] as const;
const TARGET = "l";

// Top predictions that evolve with training
const BASE_PREDS = [
    { char: "l", base: 0.04, growth: 0.11 },
    { char: "p", base: 0.08, growth: -0.01 },
    { char: "o", base: 0.07, growth: 0.01 },
    { char: "i", base: 0.06, growth: -0.005 },
    { char: "e", base: 0.05, growth: 0.005 },
];

// Simulated hidden neuron computations: each shows w·x + b → tanh
// pre = weighted sum + bias, post = tanh(pre)
const HIDDEN_NEURONS = [
    { weights: [0.31, -0.12, 0.47], bias: 0.15, pre: 1.16, post: 0.82 },
    { weights: [-0.22, 0.38, -0.15], bias: -0.10, pre: -0.49, post: -0.45 },
    { weights: [0.18, 0.25, 0.41], bias: -0.05, pre: 0.81, post: 0.67 },
    { weights: [0.05, -0.03, 0.08], bias: 0.02, pre: 0.12, post: 0.12 },
    { weights: [-0.35, -0.20, 0.10], bias: -0.22, pre: -0.89, post: -0.71 },
    { weights: [0.14, 0.09, 0.22], bias: -0.08, pre: 0.35, post: 0.34 },
    { weights: [-0.11, -0.15, 0.03], bias: -0.01, pre: -0.24, post: -0.23 },
    { weights: [0.02, 0.04, -0.01], bias: 0.00, pre: 0.05, post: 0.05 },
];

function charToOneHot(ch: string): number[] {
    const idx = VOCAB.indexOf(ch);
    return Array.from({ length: V }, (_, i) => (i === idx ? 1 : 0));
}

function MiniOneHotVec({ vec, charLabel, color }: { vec: number[]; charLabel: string; color: string }) {
    const hotIdx = vec.indexOf(1);
    return (
        <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-mono font-bold" style={{ color }}>&apos;{charLabel}&apos;</span>
            <div className="flex gap-px">
                {vec.map((v, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        transition={{ delay: i * 0.008, duration: 0.15 }}
                        className="w-[3px] rounded-sm"
                        style={{
                            height: v === 1 ? 16 : 6,
                            backgroundColor: v === 1 ? color : "rgba(255,255,255,0.06)",
                            marginTop: v === 1 ? 0 : 5,
                        }}
                    />
                ))}
            </div>
            <span className="text-[7px] font-mono text-white/20">pos {hotIdx}</span>
        </div>
    );
}

function LossGauge({ loss, maxLoss }: { loss: number; maxLoss: number }) {
    const pct = Math.min(1, loss / maxLoss);
    const startAngle = 225;
    const sweep = 270;
    const r = 44;
    const cx = 52;
    const cy = 52;

    const endAngle = startAngle - pct * sweep;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const sx = cx + r * Math.cos(toRad(startAngle));
    const sy = cy - r * Math.sin(toRad(startAngle));
    const ex = cx + r * Math.cos(toRad(endAngle));
    const ey = cy - r * Math.sin(toRad(endAngle));
    const largeArc = pct * sweep > 180 ? 1 : 0;
    const hue = (1 - pct) * 120;
    const color = `hsl(${hue}, 70%, 55%)`;

    return (
        <svg viewBox="0 0 104 80" className="w-24 h-[60px]">
            <path
                d={`M ${cx + r * Math.cos(toRad(startAngle))} ${cy - r * Math.sin(toRad(startAngle))} A ${r} ${r} 0 1 0 ${cx + r * Math.cos(toRad(startAngle - sweep))} ${cy - r * Math.sin(toRad(startAngle - sweep))}`}
                fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} strokeLinecap="round"
            />
            <motion.path
                d={`M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 0 ${ex} ${ey}`}
                fill="none" stroke={color} strokeWidth={6} strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }}
            />
            <text x={cx} y={cy - 2} textAnchor="middle" fontSize={15} fontFamily="monospace" fontWeight="bold" fill={color}>
                {loss.toFixed(2)}
            </text>
            <text x={cx} y={cy + 9} textAnchor="middle" fontSize={6} fontFamily="monospace" fill="rgba(255,255,255,0.3)">
                LOSS
            </text>
        </svg>
    );
}

function PredictionBars({ preds, target }: { preds: { char: string; prob: number }[]; target: string }) {
    return (
        <div className="space-y-1">
            {preds.map((pred) => (
                <div key={pred.char} className="flex items-center gap-1.5">
                    <span
                        className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-mono font-bold"
                        style={{
                            backgroundColor: pred.char === target ? "#a78bfa20" : "rgba(255,255,255,0.03)",
                            color: pred.char === target ? "#a78bfa" : "rgba(255,255,255,0.25)",
                        }}
                    >
                        {pred.char}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: pred.char === target ? "#a78bfa70" : "rgba(255,255,255,0.08)" }}
                            animate={{ width: `${Math.min(pred.prob * 100 * 1.4, 100)}%` }}
                            transition={{ duration: 0.4 }}
                        />
                    </div>
                    <span className="text-[8px] font-mono tabular-nums w-8 text-right" style={{ color: pred.char === target ? "#a78bfa" : "rgba(255,255,255,0.2)" }}>
                        {(pred.prob * 100).toFixed(0)}%
                    </span>
                </div>
            ))}
        </div>
    );
}

export function SingleExampleTrainer() {
    const [phase, setPhase] = useState(0);
    const [fwdStep, setFwdStep] = useState(0);
    const [iteration, setIteration] = useState(0);

    const advance = useCallback(() => {
        if (phase === 0) {
            // Sub-step through forward pass
            if (fwdStep < FWD_STEPS.length - 1) {
                setFwdStep(prev => prev + 1);
                return;
            }
        }
        if (phase < PHASES.length - 1) {
            setPhase(prev => prev + 1);
        } else {
            setIteration(prev => Math.min(prev + 1, 8));
            setPhase(0);
            setFwdStep(0);
        }
    }, [phase, fwdStep]);

    const reset = useCallback(() => { setPhase(0); setFwdStep(0); setIteration(0); }, []);

    const targetProb = Math.min(0.72, 0.04 + iteration * 0.1);
    const loss = -Math.log(Math.max(0.001, targetProb));
    const gradMagnitude = Math.max(0.01, loss * 0.25);
    const lr = 0.01;

    const preds = useMemo(() => BASE_PREDS.map(p => ({
        char: p.char,
        prob: Math.max(0.01, Math.min(0.8, p.base + p.growth * iteration)),
    })), [iteration]);

    const oneHots = useMemo(() => INPUT_CHARS.map(c => charToOneHot(c)), []);
    const CHAR_COLORS = ["#a78bfa", "#f59e0b", "#34d399"];

    const nextPhaseIdx = phase === 0 && fwdStep < FWD_STEPS.length - 1
        ? 0 : phase < PHASES.length - 1 ? phase + 1 : 0;
    const nextLabel = phase === 0 && fwdStep < FWD_STEPS.length - 1
        ? `Next: ${FWD_STEPS[fwdStep + 1].label} →`
        : phase < PHASES.length - 1 ? `Next: ${PHASES[phase + 1].label} →` : "Next Iteration ↻";

    return (
        <div className="p-4 sm:p-6 space-y-3">
            {/* Phase indicator */}
            <div className="flex items-center gap-1.5">
                {PHASES.map((p, i) => (
                    <button
                        key={p.id}
                        onClick={() => { setPhase(i); if (i === 0) setFwdStep(0); }}
                        className="flex-1 py-2 rounded-lg text-[10px] font-mono font-bold text-center transition-all border whitespace-nowrap"
                        style={{
                            backgroundColor: i <= phase ? p.hex + "15" : "rgba(255,255,255,0.02)",
                            borderColor: i <= phase ? p.hex + "35" : "rgba(255,255,255,0.06)",
                            color: i <= phase ? p.hex : "rgba(255,255,255,0.2)",
                        }}
                    >
                        {i + 1}. {p.label}
                    </button>
                ))}
            </div>

            {/* Forward sub-step indicator */}
            {phase === 0 && (
                <div className="flex items-center gap-1 px-1">
                    {FWD_STEPS.map((s, i) => (
                        <button
                            key={s.id}
                            onClick={() => setFwdStep(i)}
                            className="flex items-center gap-1 text-[8px] font-mono transition-colors"
                            style={{ color: i <= fwdStep ? "#a78bfa" : "rgba(255,255,255,0.15)" }}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${i <= fwdStep ? "bg-violet-400" : "bg-white/10"}`} />
                            {s.label}
                            {i < FWD_STEPS.length - 1 && <span className="text-white/10 ml-1">→</span>}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between text-[9px] font-mono text-white/25 px-1">
                <span>Iteration <span className="text-white/40 font-bold">{iteration + 1}</span>/9</span>
                <span>Input: <span className="text-violet-400/60">&quot;hel&quot;</span> → Target: <span className="text-violet-400/60">&apos;l&apos;</span></span>
            </div>

            {/* ═══════════ Main content ═══════════ */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${phase}-${fwdStep}-${iteration}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                >
                    {/* ── FORWARD PASS phases ── */}
                    {phase === 0 && fwdStep === 0 && (
                        <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.03] p-4 space-y-4">
                            <p className="text-[11px] font-mono text-violet-400">Step 1 · Input Characters</p>
                            <p className="text-[10px] text-white/40 leading-relaxed">The model receives 3 characters and needs to predict what comes next.</p>
                            <div className="flex items-center justify-center gap-6">
                                {INPUT_CHARS.map((ch, i) => (
                                    <motion.div
                                        key={ch}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.15, type: "spring" }}
                                        className="flex flex-col items-center gap-2"
                                    >
                                        <div
                                            className="w-12 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-mono font-bold"
                                            style={{ borderColor: CHAR_COLORS[i] + "60", backgroundColor: CHAR_COLORS[i] + "15", color: CHAR_COLORS[i] }}
                                        >
                                            {ch}
                                        </div>
                                        <span className="text-[8px] font-mono text-white/25">position {i}</span>
                                    </motion.div>
                                ))}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <div className="w-12 h-12 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center text-lg font-mono font-bold text-white/20">
                                        ?
                                    </div>
                                    <span className="text-[8px] font-mono text-white/25">predict</span>
                                </motion.div>
                            </div>
                        </div>
                    )}

                    {phase === 0 && fwdStep === 1 && (
                        <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.03] p-4 space-y-4">
                            <p className="text-[11px] font-mono text-violet-400">Step 2 · One-Hot Encode</p>
                            <p className="text-[10px] text-white/40 leading-relaxed">Each character becomes a vector of {V} numbers — all zeros except a single 1 at that character&apos;s position.</p>
                            <div className="flex items-center justify-center gap-4 sm:gap-6">
                                {INPUT_CHARS.map((ch, i) => (
                                    <MiniOneHotVec key={ch} vec={oneHots[i]} charLabel={ch} color={CHAR_COLORS[i]} />
                                ))}
                            </div>
                            <div className="flex justify-center gap-3 text-[8px] font-mono text-white/20">
                                {INPUT_CHARS.map((ch, i) => (
                                    <span key={ch}>&apos;{ch}&apos; → dims {i * V}–{(i + 1) * V - 1}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {phase === 0 && fwdStep === 2 && (
                        <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.03] p-4 space-y-4">
                            <p className="text-[11px] font-mono text-violet-400">Step 3 · Concatenate</p>
                            <p className="text-[10px] text-white/40 leading-relaxed">Stack all {INPUT_CHARS.length} one-hot vectors into one long input vector of {INPUT_CHARS.length * V} numbers.</p>
                            <div className="flex items-center justify-center gap-1">
                                <span className="text-[9px] font-mono text-white/15">[</span>
                                {INPUT_CHARS.map((ch, i) => (
                                    <motion.div key={ch} className="flex items-center gap-1"
                                        initial={{ opacity: 0, x: -10 * (i + 1) }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.2, duration: 0.3 }}
                                    >
                                        <div className="flex gap-px">
                                            {Array.from({ length: 5 }).map((_, j) => (
                                                <div key={j} className="w-[2px] h-3 rounded-sm" style={{
                                                    backgroundColor: j === 2 ? CHAR_COLORS[i] : "rgba(255,255,255,0.05)",
                                                }} />
                                            ))}
                                        </div>
                                        <span className="text-[7px] font-mono" style={{ color: CHAR_COLORS[i] }}>…</span>
                                        {i < INPUT_CHARS.length - 1 && (
                                            <div className="w-px h-4 bg-white/10 mx-1" />
                                        )}
                                    </motion.div>
                                ))}
                                <span className="text-[9px] font-mono text-white/15">]</span>
                            </div>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="text-center"
                            >
                                <span className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] font-mono text-violet-400">
                                    x ∈ ℝ<sup>{INPUT_CHARS.length * V}</sup> → {INPUT_CHARS.length * V} numbers
                                </span>
                            </motion.div>
                        </div>
                    )}

                    {phase === 0 && fwdStep === 3 && (
                        <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.03] p-4 space-y-4">
                            <p className="text-[11px] font-mono text-violet-400">Step 4 · Hidden Layer</p>
                            <p className="text-[10px] text-white/40 leading-relaxed">Each neuron does the same thing: multiply every input by a weight, add them up, add a bias, then squash through tanh. That&apos;s it — weighted sum + activation.</p>
                            <div className="rounded-lg border border-violet-500/15 bg-violet-500/[0.02] p-3 space-y-1.5 text-center">
                                <p className="text-[9px] font-mono text-white/30">For each neuron:</p>
                                <p className="text-[11px] font-mono text-violet-400">h = tanh( w₁·x₁ + w₂·x₂ + ... + w₈₁·x₈₁ + b )</p>
                                <p className="text-[8px] font-mono text-white/20">81 inputs × 1 weight each + 1 bias → 1 number → tanh</p>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {HIDDEN_NEURONS.map((n, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.06 }}
                                        className="flex flex-col items-center gap-1 p-2 rounded-lg border border-white/[0.06] bg-white/[0.02]"
                                    >
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-mono font-bold"
                                            style={{
                                                backgroundColor: n.post > 0 ? `rgba(167,139,250,${Math.abs(n.post) * 0.3})` : `rgba(244,63,94,${Math.abs(n.post) * 0.3})`,
                                                color: n.post > 0 ? "#a78bfa" : "#f43f5e",
                                            }}
                                        >
                                            h{i}
                                        </div>
                                        <span className="text-[7px] font-mono text-white/20 leading-tight text-center" title={`w·x = ${n.weights.join(" + ")} + b=${n.bias}`}>
                                            Σw·x = {n.pre > 0 ? "+" : ""}{n.pre.toFixed(2)}
                                        </span>
                                        <span className="text-[7px] font-mono text-white/15">↓ tanh</span>
                                        <span className="text-[9px] font-mono font-bold" style={{ color: n.post > 0 ? "#a78bfa" : "#f43f5e" }}>
                                            {n.post > 0 ? "+" : ""}{n.post.toFixed(2)}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                            <p className="text-[8px] font-mono text-white/15 text-center">128 neurons total (showing 8) · tanh squashes each to [−1, +1]</p>
                        </div>
                    )}

                    {phase === 0 && fwdStep === 4 && (
                        <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.03] p-4 space-y-3">
                            <p className="text-[11px] font-mono text-violet-400">Step 5 · Softmax → Prediction</p>
                            <p className="text-[10px] text-white/40 leading-relaxed">The output layer (W₂·h + b₂) produces {V} raw scores (logits), then softmax converts them to probabilities that sum to 1.</p>
                            <div className="flex gap-3 items-start">
                                <div className="flex-1">
                                    <PredictionBars preds={preds} target={TARGET} />
                                </div>
                                <div className="flex flex-col items-center gap-1 shrink-0">
                                    <LossGauge loss={loss} maxLoss={3.5} />
                                    <span className="text-[7px] font-mono text-white/20">iteration {iteration + 1}</span>
                                </div>
                            </div>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                                className="text-center"
                            >
                                <p className="text-[9px] text-white/25">Model assigns to correct answer &apos;{TARGET}&apos;:</p>
                                <p className="text-lg font-mono font-bold text-violet-400">
                                    P(&apos;{TARGET}&apos;) = {targetProb.toFixed(3)}
                                </p>
                            </motion.div>
                        </div>
                    )}

                    {/* ── LOSS phase ── */}
                    {phase === 1 && (
                        <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.03] p-4 space-y-4">
                            <p className="text-[11px] font-mono" style={{ color: PHASES[1].hex }}>2. Cross-Entropy Loss</p>
                            <p className="text-[10px] text-white/40 leading-relaxed">How wrong is the prediction? The loss function measures the gap between what the model predicted and the correct answer.</p>
                            <div className="space-y-2 text-center">
                                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                    className="text-[11px] font-mono text-white/40"
                                >
                                    L = −log( P(correct) )
                                </motion.div>
                                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                    className="text-[11px] font-mono text-white/50"
                                >
                                    L = −log( <span className="text-violet-400">{targetProb.toFixed(3)}</span> )
                                </motion.div>
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.4, type: "spring" }}
                                    className="text-2xl font-mono font-bold" style={{ color: PHASES[1].hex }}
                                >
                                    = {loss.toFixed(3)}
                                </motion.div>
                            </div>
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                                className="text-[9px] text-white/20 text-center"
                            >
                                {loss > 2.5 ? "Very high — model is almost guessing randomly" : loss > 1.5 ? "High — prediction is weak" : loss > 0.8 ? "Getting better — model is learning" : "Low — prediction is confident!"}
                            </motion.p>
                        </div>
                    )}

                    {/* ── BACKWARD phase ── */}
                    {phase === 2 && (
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-4 space-y-4">
                            <p className="text-[11px] font-mono" style={{ color: PHASES[2].hex }}>3. Backpropagation</p>
                            <p className="text-[10px] text-white/40 leading-relaxed">The error signal flows backward through the network. At each layer, we compute: how much did THIS layer contribute to the error?</p>
                            <div className="flex items-center justify-center gap-1.5 flex-wrap text-[10px] font-mono">
                                {[
                                    { label: "∂L/∂W₂", delay: 0 },
                                    { label: "←", delay: 0.1 },
                                    { label: "∂L/∂h", delay: 0.15 },
                                    { label: "←", delay: 0.25 },
                                    { label: "∂L/∂W₁", delay: 0.3 },
                                ].map((item, i) => (
                                    <motion.span
                                        key={i}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: item.delay }}
                                        className={item.label === "←" ? "text-white/15" : "px-2 py-1 rounded-md border"}
                                        style={item.label !== "←" ? { backgroundColor: "#f59e0b12", borderColor: "#f59e0b25", color: "#f59e0b" } : {}}
                                    >
                                        {item.label}
                                    </motion.span>
                                ))}
                            </div>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center">
                                <p className="text-[9px] text-white/25">Gradient magnitude</p>
                                <p className="text-lg font-mono font-bold text-amber-400">{gradMagnitude.toFixed(4)}</p>
                                <p className="text-[8px] text-white/15 mt-1">
                                    {gradMagnitude > 0.5 ? "Large gradient — weights will change a lot" : "Smaller gradient — fine-tuning"}
                                </p>
                            </motion.div>
                        </div>
                    )}

                    {/* ── UPDATE phase ── */}
                    {phase === 3 && (
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4 space-y-4">
                            <p className="text-[11px] font-mono" style={{ color: PHASES[3].hex }}>4. Weight Update</p>
                            <p className="text-[10px] text-white/40 leading-relaxed">Each weight is nudged in the direction that reduces the loss. The learning rate controls how big each step is.</p>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { name: "Input→Hidden", formula: "W₁", size: `${V * 3}×8` },
                                    { name: "Bias", formula: "b₁", size: "8" },
                                    { name: "Hidden→Output", formula: "W₂", size: `8×${V}` },
                                ].map((layer, i) => (
                                    <motion.div
                                        key={layer.name}
                                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.12 }}
                                        className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.04] p-2 text-center"
                                    >
                                        <p className="text-[7px] font-mono text-white/20 mb-0.5">{layer.name}</p>
                                        <p className="text-[9px] font-mono text-emerald-400">
                                            {layer.formula} − {lr} · ∇{layer.formula}
                                        </p>
                                        <p className="text-[7px] font-mono text-white/15 mt-0.5">{layer.size}</p>
                                    </motion.div>
                                ))}
                            </div>
                            <motion.p
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                                className="text-[10px] text-emerald-400/70 text-center font-mono"
                            >
                                ✓ Weights nudged → P(&apos;{TARGET}&apos;) will be higher next time
                            </motion.p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="flex justify-between items-center">
                <button onClick={reset} className="flex items-center gap-1.5 text-[10px] font-mono text-white/30 hover:text-white/50 transition-colors">
                    <RotateCcw className="w-3 h-3" /> Reset
                </button>
                <button
                    onClick={advance}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-colors"
                    style={{
                        backgroundColor: PHASES[nextPhaseIdx].hex + "15",
                        borderColor: PHASES[nextPhaseIdx].hex + "35",
                        color: PHASES[nextPhaseIdx].hex,
                        border: "1px solid",
                    }}
                >
                    <Play className="w-3 h-3" />
                    {nextLabel}
                </button>
            </div>
        </div>
    );
}
