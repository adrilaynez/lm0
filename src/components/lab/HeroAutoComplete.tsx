"use client";

import { memo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { useI18n } from "@/i18n/context";
import { cn } from "@/lib/utils";

const BIGRAMS: Record<string, { char: string; prob: number }[]> = {
    a: [{ char: "n", prob: 0.31 }, { char: "r", prob: 0.18 }, { char: "t", prob: 0.15 }],
    b: [{ char: "e", prob: 0.38 }, { char: "u", prob: 0.21 }, { char: "l", prob: 0.14 }],
    c: [{ char: "o", prob: 0.29 }, { char: "h", prob: 0.22 }, { char: "e", prob: 0.19 }],
    d: [{ char: " ", prob: 0.35 }, { char: "e", prob: 0.28 }, { char: "i", prob: 0.12 }],
    e: [{ char: " ", prob: 0.37 }, { char: "r", prob: 0.20 }, { char: "n", prob: 0.13 }],
    f: [{ char: " ", prob: 0.27 }, { char: "o", prob: 0.22 }, { char: "r", prob: 0.16 }],
    g: [{ char: " ", prob: 0.29 }, { char: "e", prob: 0.25 }, { char: "r", prob: 0.13 }],
    h: [{ char: "e", prob: 0.49 }, { char: "i", prob: 0.21 }, { char: "a", prob: 0.14 }],
    i: [{ char: "n", prob: 0.36 }, { char: "t", prob: 0.18 }, { char: "s", prob: 0.14 }],
    j: [{ char: "u", prob: 0.55 }, { char: "o", prob: 0.22 }, { char: "e", prob: 0.11 }],
    k: [{ char: " ", prob: 0.42 }, { char: "e", prob: 0.24 }, { char: "i", prob: 0.12 }],
    l: [{ char: "l", prob: 0.27 }, { char: "e", prob: 0.24 }, { char: "y", prob: 0.13 }],
    m: [{ char: "e", prob: 0.30 }, { char: "a", prob: 0.25 }, { char: "o", prob: 0.14 }],
    n: [{ char: " ", prob: 0.38 }, { char: "g", prob: 0.18 }, { char: "t", prob: 0.14 }],
    o: [{ char: "n", prob: 0.28 }, { char: "r", prob: 0.22 }, { char: "f", prob: 0.17 }],
    p: [{ char: "r", prob: 0.29 }, { char: "e", prob: 0.24 }, { char: "o", prob: 0.16 }],
    q: [{ char: "u", prob: 0.92 }, { char: "i", prob: 0.05 }, { char: "a", prob: 0.02 }],
    r: [{ char: "e", prob: 0.33 }, { char: " ", prob: 0.25 }, { char: "i", prob: 0.14 }],
    s: [{ char: " ", prob: 0.29 }, { char: "t", prob: 0.22 }, { char: "e", prob: 0.18 }],
    t: [{ char: "h", prob: 0.52 }, { char: "e", prob: 0.19 }, { char: "i", prob: 0.10 }],
    u: [{ char: "r", prob: 0.26 }, { char: "n", prob: 0.22 }, { char: "s", prob: 0.15 }],
    v: [{ char: "e", prob: 0.65 }, { char: "i", prob: 0.19 }, { char: "a", prob: 0.09 }],
    w: [{ char: "i", prob: 0.28 }, { char: "h", prob: 0.25 }, { char: "a", prob: 0.18 }],
    x: [{ char: "t", prob: 0.38 }, { char: "p", prob: 0.22 }, { char: "e", prob: 0.15 }],
    y: [{ char: " ", prob: 0.45 }, { char: "o", prob: 0.18 }, { char: "e", prob: 0.12 }],
    z: [{ char: "e", prob: 0.48 }, { char: "a", prob: 0.20 }, { char: "i", prob: 0.14 }],
    " ": [{ char: "t", prob: 0.18 }, { char: "a", prob: 0.14 }, { char: "s", prob: 0.11 }],
};

const FALLBACK = [{ char: "e", prob: 0.27 }, { char: "t", prob: 0.19 }, { char: "a", prob: 0.14 }];

export const HeroAutoComplete = memo(function HeroAutoComplete() {
    const { t } = useI18n();
    const [input, setInput] = useState("");
    const [focused, setFocused] = useState(false);
    const preds = input.length === 1 ? (BIGRAMS[input.toLowerCase()] ?? FALLBACK) : null;

    return (
        <div className="flex flex-col items-center gap-4 w-full max-w-xs mx-auto">

            {/* Single-char input with pulse + gradient border */}
            <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative"
            >
                {/* Pulse ring on idle */}
                {!input && !focused && (
                    <motion.div
                        animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-xl bg-emerald-500/20 pointer-events-none"
                    />
                )}
                {/* Gradient border on focus */}
                <div className={cn(
                    "absolute -inset-[1.5px] rounded-xl transition-opacity duration-300",
                    focused
                        ? "opacity-100 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400"
                        : "opacity-0"
                )} />
                <input
                    type="text"
                    maxLength={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value.slice(-1))}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={t("bigramWidgets.heroAutoComplete.placeholder")}
                    className="relative w-20 text-center text-3xl font-mono font-bold bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/10 focus:outline-none caret-emerald-400 transition-colors z-10"
                />
            </motion.div>

            {/* Predictions card */}
            <AnimatePresence mode="wait">
                {preds ? (
                    <motion.div
                        key={input}
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.18 }}
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm px-5 py-4 space-y-3"
                    >
                        <p className="text-[9px] font-mono uppercase tracking-[0.22em] text-white/20">
                            {t("bigramWidgets.heroAutoComplete.after").replace("{input}", input)}
                        </p>
                        {preds.map(({ char, prob }, i) => (
                            <motion.div
                                key={char}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="flex items-center gap-3"
                            >
                                <span className="w-5 text-center font-mono text-sm font-bold text-white/70">
                                    {char === " " ? "·" : char}
                                </span>
                                <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${prob * 100}%` }}
                                        transition={{ delay: i * 0.06 + 0.08, duration: 0.45, ease: "easeOut" }}
                                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                                    />
                                </div>
                                <span className="w-8 text-right font-mono text-[11px] text-white/35">
                                    {Math.round(prob * 100)}%
                                </span>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.p
                        key="hint"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs font-mono text-white/20"
                    >
                        {t("bigramWidgets.heroAutoComplete.hint")}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
});
