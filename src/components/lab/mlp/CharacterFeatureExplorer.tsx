"use client";

import { useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Lightbulb, Sparkles } from "lucide-react";

/*
  CharacterFeatureExplorer — Redesigned
  A guided 3-step character sorting game:
  Step 1: "Which letters make sounds by themselves?" → discover vowels
  Step 2: "Which consonants appear most often in English?" → common vs rare
  Step 3: Reveal insight — you just assigned FEATURES to letters!
  
  Much more intuitive: questions guide the sorting, visual rewards on correct groupings,
  animated transitions, and a clear progression toward the "aha" moment.
*/

const VOWELS = new Set(["a", "e", "i", "o", "u"]);
const COMMON_CONSONANTS = new Set(["t", "n", "s", "r", "h", "l", "d", "c", "m", "p", "f", "g", "w", "b", "y"]);
const RARE_CONSONANTS = new Set(["k", "v", "j", "x", "q", "z"]);

type Step = 0 | 1 | 2 | 3;

const STEP_INFO = [
    {
        title: "Step 1: Find the vowels",
        question: "Which letters can make a sound by themselves? Try saying each one out loud.",
        instruction: "Tap the letters you think are vowels",
        groupLabel: "Vowels",
        groupColor: "#a78bfa",
        correctSet: VOWELS,
    },
    {
        title: "Step 2: Common vs rare",
        question: "Some consonants appear everywhere in English (like 't' and 'n'). Others are rare (like 'x' and 'z'). Can you spot the rare ones?",
        instruction: "Tap the consonants that are RARE in English",
        groupLabel: "Rare consonants",
        groupColor: "#f59e0b",
        correctSet: RARE_CONSONANTS,
    },
];

const ALL_LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

export function CharacterFeatureExplorer() {
    const [step, setStep] = useState<Step>(0);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [confirmed, setConfirmed] = useState(false);
    const [score, setScore] = useState<{ correct: number; total: number } | null>(null);
    const [showFinal, setShowFinal] = useState(false);

    // For step 0: all letters. For step 1: only consonants (non-vowels).
    const availableChars = useMemo(() => {
        if (step === 0) return ALL_LETTERS;
        if (step === 1) return ALL_LETTERS.filter(ch => !VOWELS.has(ch));
        return [];
    }, [step]);

    const currentInfo = step < 2 ? STEP_INFO[step] : null;

    const toggleChar = (ch: string) => {
        if (confirmed) return;
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(ch)) next.delete(ch);
            else next.add(ch);
            return next;
        });
    };

    const handleConfirm = () => {
        if (!currentInfo) return;
        const correct = [...selected].filter(ch => currentInfo.correctSet.has(ch)).length;
        const total = currentInfo.correctSet.size;
        setScore({ correct: correct, total });
        setConfirmed(true);
    };

    const handleNext = () => {
        if (step === 0) {
            setStep(1);
            setSelected(new Set());
            setConfirmed(false);
            setScore(null);
        } else if (step === 1) {
            setStep(2);
            setConfirmed(false);
            setScore(null);
            setTimeout(() => setShowFinal(true), 300);
        }
    };

    const handleAutoComplete = () => {
        if (!currentInfo) return;
        const correct = new Set([...currentInfo.correctSet].filter(ch => availableChars.includes(ch)));
        setSelected(correct);
    };

    // Determine char color/state
    const getCharStyle = (ch: string) => {
        const isSelected = selected.has(ch);
        const isCorrect = currentInfo?.correctSet.has(ch);

        if (confirmed && isSelected && isCorrect) {
            return { bg: currentInfo!.groupColor + "30", border: currentInfo!.groupColor + "60", text: currentInfo!.groupColor, glow: true };
        }
        if (confirmed && isSelected && !isCorrect) {
            return { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", text: "#ef4444", glow: false };
        }
        if (confirmed && !isSelected && isCorrect) {
            return { bg: "rgba(255,255,255,0.04)", border: currentInfo!.groupColor + "30", text: currentInfo!.groupColor + "80", glow: false };
        }
        if (isSelected) {
            return { bg: (currentInfo?.groupColor || "#a78bfa") + "20", border: (currentInfo?.groupColor || "#a78bfa") + "50", text: currentInfo?.groupColor || "#a78bfa", glow: false };
        }
        return { bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)", text: "rgba(255,255,255,0.4)", glow: false };
    };

    // Final summary view (step 2+)
    if (step >= 2) {
        const vowelList = ALL_LETTERS.filter(ch => VOWELS.has(ch));
        const commonList = ALL_LETTERS.filter(ch => COMMON_CONSONANTS.has(ch));
        const rareList = ALL_LETTERS.filter(ch => RARE_CONSONANTS.has(ch));

        const groups = [
            { label: "Vowels", chars: vowelList, color: "#a78bfa", feature: "1" },
            { label: "Common consonants", chars: commonList, color: "#60a5fa", feature: "2" },
            { label: "Rare consonants", chars: rareList, color: "#f59e0b", feature: "3" },
        ];

        return (
            <div className="p-4 sm:p-6 space-y-5">
                {/* Final sorted groups */}
                <div className="space-y-3">
                    {groups.map((g, gi) => (
                        <motion.div
                            key={g.label}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: gi * 0.15 }}
                            className="rounded-xl border p-3 sm:p-4"
                            style={{ borderColor: g.color + "25", background: g.color + "06" }}
                        >
                            <div className="flex items-center justify-between mb-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color + "70" }} />
                                    <span className="text-xs font-mono font-bold" style={{ color: g.color }}>{g.label}</span>
                                </div>
                                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full" style={{ background: g.color + "15", color: g.color + "90" }}>
                                    Feature = {g.feature}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {g.chars.map((ch, ci) => (
                                    <motion.span
                                        key={ch}
                                        initial={{ scale: 0, rotate: -10 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: gi * 0.15 + ci * 0.03 }}
                                        className="w-8 h-8 rounded-lg text-xs font-mono font-bold flex items-center justify-center"
                                        style={{ background: g.color + "20", color: g.color }}
                                    >
                                        {ch}
                                    </motion.span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* The "aha" moment */}
                <AnimatePresence>
                    {showFinal && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: 0.5, type: "spring", bounce: 0.3 }}
                            className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] to-transparent p-5"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-4 h-4 text-violet-400" />
                                <span className="text-xs font-mono font-bold text-violet-400 uppercase tracking-widest">The key insight</span>
                            </div>
                            <p className="text-sm text-white/70 leading-relaxed mb-3">
                                You just gave every letter a <strong className="text-white/90">number based on its group</strong>.
                                Vowels = 1, common consonants = 2, rare consonants = 3.
                            </p>
                            <p className="text-sm text-white/70 leading-relaxed mb-3">
                                But one number isn&apos;t enough. Letters have <em>many</em> features — frequency, whether they&apos;re voiced,
                                where your tongue goes. What if each letter had <strong className="text-white/90">multiple numbers</strong>, one per feature?
                            </p>
                            <div className="rounded-lg bg-black/30 p-3 font-mono text-xs space-y-1.5">
                                <div className="flex items-center gap-3">
                                    <span className="text-violet-400 w-6">a:</span>
                                    <span className="text-white/50">[</span>
                                    <span className="text-amber-400">1.0</span>
                                    <span className="text-white/20">,</span>
                                    <span className="text-blue-400">0.8</span>
                                    <span className="text-white/20">,</span>
                                    <span className="text-green-400">0.2</span>
                                    <span className="text-white/50">]</span>
                                    <span className="text-white/20 text-[9px] ml-auto">vowel · common · low pitch</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-violet-400 w-6">t:</span>
                                    <span className="text-white/50">[</span>
                                    <span className="text-amber-400">0.0</span>
                                    <span className="text-white/20">,</span>
                                    <span className="text-blue-400">0.9</span>
                                    <span className="text-white/20">,</span>
                                    <span className="text-green-400">0.7</span>
                                    <span className="text-white/50">]</span>
                                    <span className="text-white/20 text-[9px] ml-auto">consonant · very common · sharp</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-violet-400 w-6">z:</span>
                                    <span className="text-white/50">[</span>
                                    <span className="text-amber-400">0.0</span>
                                    <span className="text-white/20">,</span>
                                    <span className="text-blue-400">0.1</span>
                                    <span className="text-white/20">,</span>
                                    <span className="text-green-400">0.6</span>
                                    <span className="text-white/50">]</span>
                                    <span className="text-white/20 text-[9px] ml-auto">consonant · rare · buzzy</span>
                                </div>
                            </div>
                            <p className="text-xs text-white/40 mt-3 leading-relaxed">
                                What if the network could learn these numbers <em>by itself</em> — discovering features <strong className="text-violet-300/80">we never told it about</strong>?
                                That&apos;s exactly what we&apos;ll build next.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Interactive sorting step
    return (
        <div className="p-4 sm:p-6 space-y-4">
            {/* Step header */}
            <div className="flex items-center gap-3 mb-1">
                <div className="flex gap-1">
                    {[0, 1].map(s => (
                        <div
                            key={s}
                            className="w-8 h-1 rounded-full transition-colors"
                            style={{ backgroundColor: s <= step ? (STEP_INFO[s]?.groupColor || "#a78bfa") : "rgba(255,255,255,0.08)" }}
                        />
                    ))}
                </div>
                <span className="text-[10px] font-mono text-white/30">Step {step + 1} of 2</span>
            </div>

            {/* Question */}
            {currentInfo && (
                <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-white/80">{currentInfo.title}</h4>
                    <p className="text-xs text-white/50 leading-relaxed">{currentInfo.question}</p>
                    <p className="text-[10px] font-mono text-white/30 flex items-center gap-1.5">
                        <Lightbulb className="w-3 h-3" />
                        {currentInfo.instruction}
                    </p>
                </div>
            )}

            {/* Character grid */}
            <div className="flex flex-wrap gap-2 justify-center py-2">
                {availableChars.map((ch, i) => {
                    const style = getCharStyle(ch);
                    return (
                        <motion.button
                            key={ch}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.02 }}
                            onClick={() => toggleChar(ch)}
                            disabled={confirmed}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-sm font-mono font-bold transition-all flex items-center justify-center"
                            style={{
                                backgroundColor: style.bg,
                                borderWidth: 2,
                                borderColor: style.border,
                                color: style.text,
                                boxShadow: style.glow ? `0 0 12px ${currentInfo?.groupColor}30` : "none",
                            }}
                            whileHover={!confirmed ? { scale: 1.12, y: -2 } : {}}
                            whileTap={!confirmed ? { scale: 0.92 } : {}}
                        >
                            {ch}
                        </motion.button>
                    );
                })}
            </div>

            {/* Selection count & actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-white/30">
                        {selected.size} selected
                    </span>
                    {!confirmed && selected.size === 0 && (
                        <button
                            onClick={handleAutoComplete}
                            className="text-[10px] font-mono text-violet-400/40 hover:text-violet-400/70 transition-colors"
                        >
                            Show me →
                        </button>
                    )}
                </div>

                {!confirmed && selected.size > 0 && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={handleConfirm}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold
                            bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30 transition-all"
                    >
                        <Check className="w-3.5 h-3.5" />
                        Check my answer
                    </motion.button>
                )}

                {confirmed && (
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3"
                    >
                        {score && (
                            <span className="text-xs font-mono" style={{ color: score.correct === score.total ? "#22c55e" : "#f59e0b" }}>
                                {score.correct}/{score.total} correct
                            </span>
                        )}
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold
                                bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30 transition-all"
                        >
                            {step === 1 ? "See the insight" : "Next step"}
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
