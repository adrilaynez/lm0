"use client";

import { useCallback, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, RotateCcw } from "lucide-react";

/*
  NeuronAblationExplorer
  Interactive grid to toggle neurons on/off, see how predictions change.
  Uses mock data showing prediction changes when specific neurons are disabled.
  Key pedagogical moment: disabling one neuron degrades MULTIPLE categories → proves polysemanticity.
*/

interface PredictionSet {
    [char: string]: number;
}

interface AblationResult {
    predictions: PredictionSet;
    damage: string[];
    damageLabels: Record<string, string>;
}

interface Scenario {
    context: string;
    displayContext: string;
    allActive: PredictionSet;
    ablations: Record<number, AblationResult>;
}

const SCENARIOS: Scenario[] = [
    {
        context: "the k",
        displayContext: "the k_",
        allActive: { i: 0.35, n: 0.22, e: 0.15, a: 0.10, o: 0.08, u: 0.05 },
        ablations: {
            3: {
                predictions: { n: 0.28, i: 0.25, e: 0.16, a: 0.12, o: 0.09, u: 0.05 },
                damage: ["vowel_prediction", "word_pattern"],
                damageLabels: { vowel_prediction: "Vowel prediction: −10%", word_pattern: "Word patterns: −8%" },
            },
            7: {
                predictions: { i: 0.40, n: 0.18, e: 0.14, a: 0.11, o: 0.08, u: 0.04 },
                damage: ["frequency_bias"],
                damageLabels: { frequency_bias: "Frequency balance: −12%" },
            },
            12: {
                predictions: { i: 0.30, n: 0.30, e: 0.13, a: 0.10, o: 0.08, u: 0.04 },
                damage: ["vowel_prediction", "consonant_detection"],
                damageLabels: { vowel_prediction: "Vowel prediction: −5%", consonant_detection: "Consonant detection: −15%" },
            },
            21: {
                predictions: { i: 0.33, n: 0.23, e: 0.16, a: 0.10, o: 0.08, u: 0.05 },
                damage: ["rare_patterns"],
                damageLabels: { rare_patterns: "Rare patterns: −3%" },
            },
            45: {
                predictions: { e: 0.25, i: 0.24, n: 0.20, a: 0.12, o: 0.09, u: 0.05 },
                damage: ["word_pattern", "frequency_bias", "vowel_prediction"],
                damageLabels: { word_pattern: "Word patterns: −18%", frequency_bias: "Frequency balance: −14%", vowel_prediction: "Vowel prediction: −11%" },
            },
        },
    },
    {
        context: "and t",
        displayContext: "and t_",
        allActive: { h: 0.45, o: 0.18, r: 0.12, i: 0.08, e: 0.07, a: 0.05 },
        ablations: {
            3: {
                predictions: { h: 0.38, o: 0.20, r: 0.14, i: 0.10, e: 0.08, a: 0.05 },
                damage: ["word_pattern", "vowel_prediction"],
                damageLabels: { word_pattern: "Word patterns: −7%", vowel_prediction: "Vowel prediction: −5%" },
            },
            7: {
                predictions: { h: 0.50, o: 0.15, r: 0.11, i: 0.08, e: 0.07, a: 0.04 },
                damage: ["frequency_bias", "consonant_detection"],
                damageLabels: { frequency_bias: "Frequency balance: −9%", consonant_detection: "Consonant detection: −6%" },
            },
            12: {
                predictions: { h: 0.42, o: 0.19, r: 0.13, i: 0.09, e: 0.07, a: 0.05 },
                damage: ["consonant_detection"],
                damageLabels: { consonant_detection: "Consonant detection: −4%" },
            },
            45: {
                predictions: { o: 0.28, h: 0.25, r: 0.15, i: 0.12, e: 0.10, a: 0.05 },
                damage: ["word_pattern", "frequency_bias", "vowel_prediction"],
                damageLabels: { word_pattern: "Word patterns: −20%", frequency_bias: "Frequency balance: −16%", vowel_prediction: "Vowel prediction: −8%" },
            },
        },
    },
];

const GRID_SIZE = 64;
const GRID_COLS = 16;

const DAMAGE_COLORS: Record<string, string> = {
    vowel_prediction: "#ec4899",
    word_pattern: "#3b82f6",
    frequency_bias: "#f59e0b",
    consonant_detection: "#10b981",
    rare_patterns: "#a855f7",
    general_capacity: "#ef4444",
    brain_dead: "#ef4444",
};

export function NeuronAblationExplorer() {
    const [scenarioIdx, setScenarioIdx] = useState(0);
    const [disabled, setDisabled] = useState<Set<number>>(new Set());

    const scenario = SCENARIOS[scenarioIdx];

    const toggleNeuron = useCallback((id: number) => {
        setDisabled(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const resetAll = useCallback(() => setDisabled(new Set()), []);

    // Compute effective predictions: combine ablation effects
    // Key idea: each neuron carries ~1/GRID_SIZE of the network's discriminative power.
    // Disabling N neurons blends (N/GRID_SIZE) toward uniform distribution.
    // Neurons with explicit ablation data also shift specific predictions.
    const { predictions, allDamage } = useMemo(() => {
        if (disabled.size === 0) return { predictions: scenario.allActive, allDamage: new Map<string, string>() };

        const allChars = Object.keys(scenario.allActive);
        const uniform = 1 / allChars.length;

        // Base degradation: fraction of neurons disabled → blend toward uniform
        const degradeFraction = Math.min(disabled.size / GRID_SIZE, 1);

        // Start from baseline blended toward uniform by degradation fraction
        let combined: Record<string, number> = {};
        for (const ch of allChars) {
            const orig = scenario.allActive[ch];
            combined[ch] = orig + (uniform - orig) * degradeFraction;
        }

        // Apply specific ablation shifts on top (for neurons with detailed data)
        const allDmg = new Map<string, string>();
        let knownAblations = 0;
        for (const id of disabled) {
            const abl = scenario.ablations[id];
            if (abl) {
                knownAblations++;
                const shiftStrength = 0.3; // How much specific ablation shifts predictions
                for (const [ch, prob] of Object.entries(abl.predictions)) {
                    if (ch in combined) {
                        combined[ch] += (prob - scenario.allActive[ch]) * shiftStrength;
                    }
                }
                for (const d of abl.damage) {
                    allDmg.set(d, abl.damageLabels[d] ?? d);
                }
            }
        }

        // Add generic damage label when many neurons are disabled
        const unknownDisabled = disabled.size - knownAblations;
        if (unknownDisabled > 0) {
            const pct = Math.round((disabled.size / GRID_SIZE) * 100);
            allDmg.set("general_capacity", `Overall capacity: −${pct}%`);
        }
        if (disabled.size >= GRID_SIZE * 0.9) {
            allDmg.set("brain_dead", "Brain dead: output is near-random");
        }

        // Clamp negatives and normalize
        for (const ch of allChars) {
            combined[ch] = Math.max(combined[ch], 0.001);
        }
        const total = Object.values(combined).reduce((s, v) => s + v, 0);
        if (total > 0) {
            for (const ch of Object.keys(combined)) {
                combined[ch] /= total;
            }
        }

        return { predictions: combined, allDamage: allDmg };
    }, [disabled, scenario]);

    const sortedPreds = useMemo(
        () => Object.entries(predictions).sort((a, b) => b[1] - a[1]),
        [predictions],
    );

    const sortedBaseline = useMemo(
        () => Object.entries(scenario.allActive).sort((a, b) => b[1] - a[1]),
        [scenario],
    );

    const topChanged = disabled.size > 0 && sortedPreds[0]?.[0] !== sortedBaseline[0]?.[0];

    // Which neuron IDs have ablation data (highlight them)
    const ablationKeys = useMemo(() => new Set(Object.keys(scenario.ablations).map(Number)), [scenario]);

    return (
        <div className="space-y-4">
            {/* Context selector */}
            <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold text-[var(--lab-text-muted)] uppercase tracking-wider">Context:</span>
                {SCENARIOS.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => { setScenarioIdx(i); setDisabled(new Set()); }}
                        className={`px-3 py-1.5 rounded-lg font-mono text-sm border transition-all ${scenarioIdx === i
                            ? "border-violet-500 bg-violet-500/20 text-violet-300"
                            : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"
                            }`}
                    >
                        {s.displayContext}
                    </button>
                ))}
                <div className="ml-auto flex gap-1.5">
                    <button
                        onClick={() => setDisabled(new Set(Array.from({ length: GRID_SIZE }, (_, i) => i)))}
                        className="px-2.5 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs transition-colors"
                    >
                        Disable All
                    </button>
                    <button
                        onClick={resetAll}
                        className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-white/80 text-xs flex items-center gap-1.5 transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                    </button>
                </div>
            </div>

            {/* Neuron grid */}
            <div className="bg-[var(--lab-viz-bg)] rounded-xl border border-[var(--lab-border)] p-3">
                <div className="text-xs text-[var(--lab-text-muted)] mb-2">
                    Neurons · <span className="text-violet-400">{disabled.size}</span> disabled
                    {disabled.size > 0 && <span className="text-amber-400 ml-2">— click to re-enable</span>}
                </div>
                <div
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}
                >
                    {Array.from({ length: GRID_SIZE }, (_, id) => {
                        const isDisabled = disabled.has(id);
                        const hasData = ablationKeys.has(id);
                        return (
                            <button
                                key={id}
                                onClick={() => toggleNeuron(id)}
                                className={`aspect-square rounded text-[8px] font-mono leading-none transition-all ${isDisabled
                                    ? "bg-red-500/30 border border-red-500/50 text-red-300"
                                    : hasData
                                        ? "bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30"
                                        : "bg-white/5 border border-white/5 text-white/20 hover:bg-white/10 hover:text-white/40"
                                    }`}
                                title={`Neuron #${id}${hasData ? " (has ablation data)" : ""}${isDisabled ? " (disabled)" : ""}`}
                            >
                                {id}
                            </button>
                        );
                    })}
                </div>
                <p className="text-[10px] text-[var(--lab-text-muted)] mt-2 italic">
                    Purple neurons have detailed ablation data. Try #3, #7, #12, #45 — or disable all to see the brain die.
                </p>
            </div>

            {/* Predictions comparison */}
            <div className="grid md:grid-cols-2 gap-3">
                {/* Baseline */}
                <div className="bg-[var(--lab-viz-bg)] rounded-xl border border-[var(--lab-border)] p-3">
                    <div className="text-xs font-semibold text-emerald-400 mb-2">All neurons active</div>
                    <div className="space-y-1.5">
                        {sortedBaseline.map(([ch, prob]) => (
                            <div key={ch} className="flex items-center gap-2">
                                <span className="font-mono text-sm text-[var(--lab-text)] w-5">{ch === " " ? "␣" : ch}</span>
                                <div className="flex-1 h-4 bg-white/5 rounded overflow-hidden">
                                    <motion.div
                                        className="h-full rounded bg-emerald-500/60"
                                        initial={false}
                                        animate={{ width: `${prob * 100}%` }}
                                        transition={{ duration: 0.4 }}
                                    />
                                </div>
                                <span className="text-xs tabular-nums text-[var(--lab-text-muted)] w-10 text-right">
                                    {(prob * 100).toFixed(0)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Current (with ablations) */}
                <div className="bg-[var(--lab-viz-bg)] rounded-xl border border-[var(--lab-border)] p-3">
                    <div className="text-xs font-semibold mb-2" style={{ color: disabled.size > 0 ? "#f59e0b" : "#94a3b8" }}>
                        {disabled.size > 0 ? `With ${disabled.size} neuron${disabled.size > 1 ? "s" : ""} disabled` : "No neurons disabled"}
                    </div>
                    <div className="space-y-1.5">
                        <AnimatePresence mode="popLayout">
                            {sortedPreds.map(([ch, prob]) => {
                                const baseline = scenario.allActive[ch] ?? 0;
                                const delta = prob - baseline;
                                return (
                                    <motion.div
                                        key={ch}
                                        layout
                                        className="flex items-center gap-2"
                                    >
                                        <span className="font-mono text-sm text-[var(--lab-text)] w-5">{ch === " " ? "␣" : ch}</span>
                                        <div className="flex-1 h-4 bg-white/5 rounded overflow-hidden">
                                            <motion.div
                                                className="h-full rounded"
                                                style={{ backgroundColor: disabled.size > 0 ? "rgba(245,158,11,0.6)" : "rgba(148,163,184,0.4)" }}
                                                initial={false}
                                                animate={{ width: `${prob * 100}%` }}
                                                transition={{ duration: 0.4 }}
                                            />
                                        </div>
                                        <span className="text-xs tabular-nums text-[var(--lab-text-muted)] w-10 text-right">
                                            {(prob * 100).toFixed(0)}%
                                        </span>
                                        {disabled.size > 0 && Math.abs(delta) > 0.005 && (
                                            <span className={`text-[10px] tabular-nums w-10 text-right ${delta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                                                {delta > 0 ? "+" : ""}{(delta * 100).toFixed(0)}
                                            </span>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Damage report */}
            <AnimatePresence>
                {disabled.size > 0 && allDamage.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <span className="text-xs font-semibold text-red-300 uppercase tracking-wider">Damage Report</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {Array.from(allDamage.entries()).map(([key, label]) => (
                                <span
                                    key={key}
                                    className="px-2 py-1 rounded-md text-xs font-medium border"
                                    style={{
                                        borderColor: (DAMAGE_COLORS[key] ?? "#ef4444") + "40",
                                        color: DAMAGE_COLORS[key] ?? "#ef4444",
                                        backgroundColor: (DAMAGE_COLORS[key] ?? "#ef4444") + "15",
                                    }}
                                >
                                    {label}
                                </span>
                            ))}
                        </div>
                        {topChanged && (
                            <p className="text-xs text-red-300/70 mt-2 italic">
                                ⚠ Top prediction changed! The network&apos;s first choice is now different.
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
