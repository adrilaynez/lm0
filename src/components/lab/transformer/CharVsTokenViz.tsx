"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  CharVsTokenViz — VIZ 14

  Show character-level vs subword tokenization.
  Type text, see it split both ways. Plants seed for next chapter.

  Row 1: Characters — each char as a separate small box
  Row 2: Subword Tokens (BPE) — chars grouped into word pieces

  Below: vocab size, sequence length, and ratio comparison.
  Simplified BPE approximation (word-boundary heuristic).
*/

const PALETTE = [
    "#22d3ee", "#38bdf8", "#818cf8", "#a78bfa",
    "#c084fc", "#f472b6", "#fb923c", "#fbbf24",
    "#34d399", "#6ee7b7", "#67e8f9", "#e879f9",
];

/* Simple BPE-like tokenizer: split on word boundaries, keep spaces attached */
function simpleBPE(text: string): string[] {
    if (!text) return [];
    const tokens: string[] = [];
    let current = "";

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const prev = i > 0 ? text[i - 1] : "";

        if (ch === " ") {
            if (current) tokens.push(current);
            current = ch;
        } else if (prev === " " && current === " ") {
            tokens.push(current);
            current = ch;
        } else {
            /* Split long words into sub-pieces (simulate BPE merges) */
            const inWord = current.replace(/^ /, "");
            if (inWord.length >= 5 && /[a-zA-Z]/.test(ch)) {
                /* Try common suffix splits */
                const suffixes = ["ing", "tion", "ment", "ness", "able", "ous", "ful", "less", "ity", "ive"];
                const remaining = text.slice(i);
                let split = false;
                for (const suf of suffixes) {
                    if (remaining.toLowerCase().startsWith(suf) && inWord.length >= 3) {
                        tokens.push(current);
                        current = ch;
                        split = true;
                        break;
                    }
                }
                if (!split) {
                    current += ch;
                }
            } else {
                current += ch;
            }
        }
    }
    if (current) tokens.push(current);
    return tokens;
}

const displayChar = (ch: string) => ch === " " ? "\u2423" : ch;

export function CharVsTokenViz() {
    const [text, setText] = useState("Understanding the world around us");
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [displayText, setDisplayText] = useState(text);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDisplayText(text), 200);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [text]);

    const chars = useMemo(() => displayText.split(""), [displayText]);
    const tokens = useMemo(() => simpleBPE(displayText), [displayText]);

    const charCount = chars.length;
    const tokenCount = tokens.length;
    const ratio = tokenCount > 0 ? (charCount / tokenCount).toFixed(1) : "—";

    return (
        <div className="flex flex-col items-center gap-5 w-full py-5 px-2 max-w-[520px] mx-auto">
            {/* ── Input ── */}
            <div className="w-full">
                <input
                    ref={inputRef}
                    type="text"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Type anything..."
                    maxLength={80}
                    className="w-full px-4 py-2.5 rounded-xl text-[13px] font-mono text-white/70 placeholder:text-white/15 outline-none"
                    style={{
                        background: "rgba(255,255,255,0.03)",
                        borderBottom: "2px solid rgba(34,211,238,0.15)",
                    }}
                />
            </div>

            {/* ── Row 1: Characters ── */}
            <div className="w-full">
                <div className="flex items-center justify-between mb-2 px-0.5">
                    <span className="text-[11px] font-semibold text-amber-400/60">Characters</span>
                    <span className="text-[10px] font-mono text-amber-400/35">
                        {charCount} tokens
                    </span>
                </div>
                <div className="flex flex-wrap gap-[2px]">
                    {chars.map((ch, i) => (
                        <motion.div key={`c-${i}`}
                            className="flex items-center justify-center rounded-[3px] font-mono text-[11px] font-semibold"
                            style={{
                                width: 22,
                                height: 28,
                                background: `${PALETTE[i % PALETTE.length]}10`,
                                border: `1px solid ${PALETTE[i % PALETTE.length]}25`,
                                color: `${PALETTE[i % PALETTE.length]}90`,
                            }}
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.008, duration: 0.12 }}
                        >
                            {displayChar(ch)}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* ── Row 2: Subword Tokens (BPE) ── */}
            <div className="w-full">
                <div className="flex items-center justify-between mb-2 px-0.5">
                    <span className="text-[11px] font-semibold text-cyan-400/60">
                        Subword Tokens <span className="text-white/15">(BPE-like)</span>
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400/35">
                        {tokenCount} tokens
                    </span>
                </div>
                <div className="flex flex-wrap gap-1">
                    {tokens.map((tok, i) => {
                        const color = PALETTE[i % PALETTE.length];
                        return (
                            <motion.div key={`t-${i}`}
                                className="flex items-center justify-center rounded-md font-mono text-[12px] font-semibold px-2.5 py-1"
                                style={{
                                    background: `${color}12`,
                                    border: `1px solid ${color}30`,
                                    color: `${color}bb`,
                                }}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.03, duration: 0.15 }}
                            >
                                {tok.split("").map(displayChar).join("")}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* ── Comparison stats ── */}
            <div className="grid grid-cols-3 gap-3 w-full">
                {/* Char vocab */}
                <div className="rounded-xl px-3 py-2.5 text-center"
                    style={{
                        background: "rgba(251,191,36,0.04)",
                        border: "1px solid rgba(251,191,36,0.1)",
                    }}>
                    <div className="text-[9px] text-amber-400/40 font-semibold mb-1">CHAR VOCAB</div>
                    <div className="text-[18px] font-bold font-mono text-amber-400/60">~96</div>
                    <div className="text-[9px] text-white/15 mt-0.5">printable ASCII</div>
                </div>

                {/* Token vocab */}
                <div className="rounded-xl px-3 py-2.5 text-center"
                    style={{
                        background: "rgba(34,211,238,0.04)",
                        border: "1px solid rgba(34,211,238,0.1)",
                    }}>
                    <div className="text-[9px] text-cyan-400/40 font-semibold mb-1">TOKEN VOCAB</div>
                    <div className="text-[18px] font-bold font-mono text-cyan-400/60">~32K</div>
                    <div className="text-[9px] text-white/15 mt-0.5">learned merges</div>
                </div>

                {/* Ratio */}
                <div className="rounded-xl px-3 py-2.5 text-center"
                    style={{
                        background: "rgba(52,211,153,0.04)",
                        border: "1px solid rgba(52,211,153,0.1)",
                    }}>
                    <div className="text-[9px] text-emerald-400/40 font-semibold mb-1">COMPRESSION</div>
                    <div className="text-[18px] font-bold font-mono text-emerald-400/60">{ratio}{"\u00d7"}</div>
                    <div className="text-[9px] text-white/15 mt-0.5">shorter sequence</div>
                </div>
            </div>

            {/* ── Sequence comparison ── */}
            <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                    <span className="text-[11px] text-amber-400/40 font-mono">Sequence: </span>
                    <span className="text-[13px] font-bold font-mono text-amber-400/60">{charCount}</span>
                </div>
                <span className="text-[10px] text-white/10">vs</span>
                <div className="text-center">
                    <span className="text-[11px] text-cyan-400/40 font-mono">Sequence: </span>
                    <span className="text-[13px] font-bold font-mono text-cyan-400/60">{tokenCount}</span>
                </div>
            </div>

            {/* ── Caption ── */}
            <div className="max-w-sm">
                <p className="text-[11px] text-center text-white/15 leading-relaxed">
                    Our model uses characters. Modern models use subword tokens {"\u2014"} dramatically
                    shorter sequences mean the model can see further back with the same context window.
                </p>
                <p className="text-[9px] text-center text-white/10 mt-1 italic">
                    Simplified illustration. Real BPE uses learned merge rules.
                </p>
            </div>
        </div>
    );
}
