"use client";

import { useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, GitCompareArrows, Sparkles } from "lucide-react";

/*
  WordEmbeddingAnalogyDemo — v2 (Illustrative Only)
  Two visualizers:
  1. Analogy explorer: king − man + woman ≈ queen (classic Word2Vec demo)
  2. Semantic neighborhood: shows how synonyms, antonyms, and related words
     cluster in embedding space — teaching that embeddings capture meaning.
  Clearly labeled as illustrative — our models are character-level.
*/

/* ─── Tab system ─── */
type Tab = "analogies" | "neighborhoods";

/* ─── Analogy data ─── */
interface WordPoint {
    word: string;
    x: number;
    y: number;
    category: "royalty" | "gender" | "profession" | "country" | "result";
}

const WORDS: WordPoint[] = [
    { word: "king", x: 0.72, y: 0.25, category: "royalty" },
    { word: "queen", x: 0.78, y: 0.68, category: "royalty" },
    { word: "man", x: 0.28, y: 0.22, category: "gender" },
    { word: "woman", x: 0.32, y: 0.65, category: "gender" },
    { word: "prince", x: 0.62, y: 0.18, category: "royalty" },
    { word: "princess", x: 0.66, y: 0.60, category: "royalty" },
    { word: "doctor", x: 0.45, y: 0.30, category: "profession" },
    { word: "nurse", x: 0.48, y: 0.72, category: "profession" },
    { word: "france", x: 0.15, y: 0.45, category: "country" },
    { word: "paris", x: 0.20, y: 0.52, category: "country" },
    { word: "spain", x: 0.10, y: 0.55, category: "country" },
    { word: "madrid", x: 0.16, y: 0.62, category: "country" },
];

interface Analogy {
    label: string;
    a: string;
    b: string;
    c: string;
    result: string;
    explanation: string;
}

const ANALOGIES: Analogy[] = [
    { label: "Classic", a: "king", b: "man", c: "woman", result: "queen", explanation: "The 'royalty' direction is preserved when you swap the 'gender' direction." },
    { label: "Titles", a: "prince", b: "man", c: "woman", result: "princess", explanation: "Same gender direction applies to other royal titles." },
    { label: "Geography", a: "france", b: "paris", c: "madrid", result: "spain", explanation: "The 'country → capital' relationship is encoded as a consistent direction." },
];

const CAT_COLORS: Record<string, string> = {
    royalty: "#f59e0b",
    gender: "#3b82f6",
    profession: "#10b981",
    country: "#a855f7",
    result: "#f43f5e",
};

/* ─── Semantic neighborhood data ─── */
interface NeighborhoodWord {
    word: string;
    x: number;
    y: number;
    group: string;
}

interface Neighborhood {
    label: string;
    description: string;
    words: NeighborhoodWord[];
    groups: { name: string; color: string }[];
    insight: string;
}

const NEIGHBORHOODS: Neighborhood[] = [
    {
        label: "Synonyms & Antonyms",
        description: "Words with similar meaning cluster together. Antonyms are nearby too — they share context but point in opposite directions.",
        words: [
            { word: "happy", x: 0.72, y: 0.28, group: "positive" },
            { word: "joyful", x: 0.68, y: 0.22, group: "positive" },
            { word: "glad", x: 0.75, y: 0.32, group: "positive" },
            { word: "cheerful", x: 0.65, y: 0.25, group: "positive" },
            { word: "sad", x: 0.70, y: 0.72, group: "negative" },
            { word: "unhappy", x: 0.73, y: 0.68, group: "negative" },
            { word: "gloomy", x: 0.66, y: 0.75, group: "negative" },
            { word: "big", x: 0.25, y: 0.30, group: "size" },
            { word: "large", x: 0.22, y: 0.26, group: "size" },
            { word: "huge", x: 0.20, y: 0.33, group: "size" },
            { word: "small", x: 0.28, y: 0.70, group: "size-opp" },
            { word: "tiny", x: 0.25, y: 0.74, group: "size-opp" },
        ],
        groups: [
            { name: "positive emotion", color: "#10b981" },
            { name: "negative emotion", color: "#ef4444" },
            { name: "size (big)", color: "#3b82f6" },
            { name: "size (small)", color: "#8b5cf6" },
        ],
        insight: "Synonyms like 'happy/joyful/glad' nearly overlap. Antonyms like 'happy/sad' are close (they share emotional context) but separated along a polarity axis. The network learns that meaning ≈ distance.",
    },
    {
        label: "Word Families",
        description: "Words derived from the same root cluster tightly, forming 'word families' in vector space.",
        words: [
            { word: "run", x: 0.30, y: 0.35, group: "run" },
            { word: "running", x: 0.33, y: 0.30, group: "run" },
            { word: "runner", x: 0.28, y: 0.28, group: "run" },
            { word: "ran", x: 0.35, y: 0.32, group: "run" },
            { word: "think", x: 0.70, y: 0.35, group: "think" },
            { word: "thinking", x: 0.73, y: 0.30, group: "think" },
            { word: "thought", x: 0.68, y: 0.38, group: "think" },
            { word: "thinker", x: 0.72, y: 0.28, group: "think" },
            { word: "play", x: 0.30, y: 0.70, group: "play" },
            { word: "playing", x: 0.33, y: 0.66, group: "play" },
            { word: "player", x: 0.27, y: 0.73, group: "play" },
            { word: "played", x: 0.35, y: 0.68, group: "play" },
        ],
        groups: [
            { name: "run family", color: "#f59e0b" },
            { name: "think family", color: "#a78bfa" },
            { name: "play family", color: "#10b981" },
        ],
        insight: "Verb tenses and derived forms cluster together: 'run/running/runner/ran' are nearby because they share the same core meaning. The direction from 'run' → 'running' is similar to 'play' → 'playing' — the network learns grammar as geometry!",
    },
    {
        label: "Multilingual",
        description: "In multilingual models, translations of the same word land in nearby regions — the network discovers language-independent meaning.",
        words: [
            { word: "dog", x: 0.32, y: 0.30, group: "english" },
            { word: "cat", x: 0.38, y: 0.65, group: "english" },
            { word: "perro", x: 0.28, y: 0.27, group: "spanish" },
            { word: "gato", x: 0.35, y: 0.62, group: "spanish" },
            { word: "hund", x: 0.35, y: 0.33, group: "german" },
            { word: "katze", x: 0.42, y: 0.68, group: "german" },
            { word: "house", x: 0.70, y: 0.30, group: "english" },
            { word: "casa", x: 0.67, y: 0.27, group: "spanish" },
            { word: "haus", x: 0.73, y: 0.33, group: "german" },
            { word: "water", x: 0.70, y: 0.68, group: "english" },
            { word: "agua", x: 0.67, y: 0.65, group: "spanish" },
            { word: "wasser", x: 0.73, y: 0.71, group: "german" },
        ],
        groups: [
            { name: "English", color: "#3b82f6" },
            { name: "Spanish", color: "#f59e0b" },
            { name: "German", color: "#10b981" },
        ],
        insight: "dog/perro/hund cluster together despite being different strings — the model learned that meaning transcends language. This is how Google Translate and multilingual AI work: they operate in a shared 'meaning space'.",
    },
];

const SIZE = 240;

export function WordEmbeddingAnalogyDemo() {
    const [tab, setTab] = useState<Tab>("analogies");
    const [selectedAnalogy, setSelectedAnalogy] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [hoveredWord, setHoveredWord] = useState<string | null>(null);
    const [selectedNeighborhood, setSelectedNeighborhood] = useState(0);

    const analogy = ANALOGIES[selectedAnalogy];
    const neighborhood = NEIGHBORHOODS[selectedNeighborhood];

    // Compute the predicted position for the analogy
    const predicted = useMemo(() => {
        const a = WORDS.find(w => w.word === analogy.a);
        const b = WORDS.find(w => w.word === analogy.b);
        const c = WORDS.find(w => w.word === analogy.c);
        if (!a || !b || !c) return null;
        return { x: a.x - b.x + c.x, y: a.y - b.y + c.y };
    }, [analogy]);

    const actual = WORDS.find(w => w.word === analogy.result);

    return (
        <div className="space-y-4">
            {/* Disclaimer banner */}
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-mono text-amber-400/70 leading-relaxed">
                    <strong>Illustrative example.</strong> Our character-level models can&apos;t do word analogies — they see letters, not words. But this is exactly where the SAME embedding idea leads at scale. Word2Vec, GPT, and every modern language model use this principle.
                </p>
            </div>

            {/* Tab selector */}
            <div className="flex gap-1.5">
                <button
                    onClick={() => setTab("analogies")}
                    className="flex-1 rounded-lg border px-2 py-2 text-center transition-all flex items-center justify-center gap-1.5"
                    style={{
                        borderColor: tab === "analogies" ? "#a78bfa50" : "rgba(255,255,255,0.06)",
                        backgroundColor: tab === "analogies" ? "#a78bfa10" : "rgba(255,255,255,0.01)",
                        color: tab === "analogies" ? "#a78bfa" : "rgba(255,255,255,0.3)",
                    }}
                >
                    <Sparkles className="w-3 h-3" />
                    <span className="text-[10px] font-mono font-bold">Vector Arithmetic</span>
                </button>
                <button
                    onClick={() => setTab("neighborhoods")}
                    className="flex-1 rounded-lg border px-2 py-2 text-center transition-all flex items-center justify-center gap-1.5"
                    style={{
                        borderColor: tab === "neighborhoods" ? "#10b98150" : "rgba(255,255,255,0.06)",
                        backgroundColor: tab === "neighborhoods" ? "#10b98110" : "rgba(255,255,255,0.01)",
                        color: tab === "neighborhoods" ? "#10b981" : "rgba(255,255,255,0.3)",
                    }}
                >
                    <GitCompareArrows className="w-3 h-3" />
                    <span className="text-[10px] font-mono font-bold">Semantic Neighborhoods</span>
                </button>
            </div>

            <AnimatePresence mode="wait">
                {tab === "analogies" ? (
                    <motion.div
                        key="analogies"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        className="space-y-3"
                    >
                        {/* Analogy selector */}
                        <div className="flex gap-1.5">
                            {ANALOGIES.map((a, i) => (
                                <button
                                    key={a.label}
                                    onClick={() => { setSelectedAnalogy(i); setRevealed(false); }}
                                    className="flex-1 rounded-lg border px-2 py-1.5 text-center transition-all"
                                    style={{
                                        borderColor: i === selectedAnalogy ? "#a78bfa40" : "rgba(255,255,255,0.06)",
                                        backgroundColor: i === selectedAnalogy ? "#a78bfa08" : "rgba(255,255,255,0.01)",
                                        color: i === selectedAnalogy ? "#a78bfa" : "rgba(255,255,255,0.25)",
                                    }}
                                >
                                    <span className="text-[10px] font-mono font-bold">{a.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Formula display */}
                        <div className="flex items-center justify-center gap-2 py-2 rounded-lg border border-white/[0.04] bg-white/[0.01]">
                            <span className="px-2 py-1 rounded-md text-xs font-mono font-bold" style={{ backgroundColor: CAT_COLORS[WORDS.find(w => w.word === analogy.a)?.category ?? "royalty"] + "20", color: CAT_COLORS[WORDS.find(w => w.word === analogy.a)?.category ?? "royalty"] }}>
                                {analogy.a}
                            </span>
                            <span className="text-white/30 font-mono text-sm">−</span>
                            <span className="px-2 py-1 rounded-md text-xs font-mono font-bold" style={{ backgroundColor: CAT_COLORS[WORDS.find(w => w.word === analogy.b)?.category ?? "gender"] + "20", color: CAT_COLORS[WORDS.find(w => w.word === analogy.b)?.category ?? "gender"] }}>
                                {analogy.b}
                            </span>
                            <span className="text-white/30 font-mono text-sm">+</span>
                            <span className="px-2 py-1 rounded-md text-xs font-mono font-bold" style={{ backgroundColor: CAT_COLORS[WORDS.find(w => w.word === analogy.c)?.category ?? "gender"] + "20", color: CAT_COLORS[WORDS.find(w => w.word === analogy.c)?.category ?? "gender"] }}>
                                {analogy.c}
                            </span>
                            <span className="text-white/30 font-mono text-sm">≈</span>
                            {revealed ? (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="px-2 py-1 rounded-md text-xs font-mono font-bold"
                                    style={{ backgroundColor: "#f43f5e20", color: "#f43f5e" }}
                                >
                                    {analogy.result}
                                </motion.span>
                            ) : (
                                <motion.button
                                    onClick={() => setRevealed(true)}
                                    animate={{ scale: [1, 1.06, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold border-2 border-violet-400/50 text-violet-300 bg-violet-500/15 hover:bg-violet-500/25 hover:border-violet-400/70 transition-colors flex items-center gap-1.5 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
                                >
                                    <Sparkles className="w-3.5 h-3.5" /> Click to reveal!
                                </motion.button>
                            )}
                        </div>

                        {/* How it works explanation */}
                        <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-3">
                            <p className="text-[10px] font-mono text-white/40 leading-relaxed">
                                <strong className="text-white/60">How does this work?</strong> Each word is a vector (list of numbers). The magic is that
                                <em> directions in this space encode meaning</em>. The vector from &quot;man&quot; to &quot;king&quot; captures
                                &quot;royalty.&quot; Apply that same direction to &quot;woman&quot; and you land near &quot;queen.&quot;
                                {!revealed && <span className="text-violet-400/70"> ← Click &quot;Reveal&quot; above to see it in action!</span>}
                            </p>
                        </div>

                        {/* 2D scatter visualization */}
                        <div className="relative rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full" style={{ maxHeight: 300 }}>
                                {[0.25, 0.5, 0.75].map(f => (
                                    <g key={f}>
                                        <line x1={f * SIZE} y1={0} x2={f * SIZE} y2={SIZE} stroke="rgba(255,255,255,0.025)" strokeWidth={0.5} />
                                        <line x1={0} y1={f * SIZE} x2={SIZE} y2={f * SIZE} stroke="rgba(255,255,255,0.025)" strokeWidth={0.5} />
                                    </g>
                                ))}
                                {revealed && (
                                    <>
                                        <line
                                            x1={WORDS.find(w => w.word === analogy.a)!.x * SIZE}
                                            y1={WORDS.find(w => w.word === analogy.a)!.y * SIZE}
                                            x2={WORDS.find(w => w.word === analogy.b)!.x * SIZE}
                                            y2={WORDS.find(w => w.word === analogy.b)!.y * SIZE}
                                            stroke="rgba(255,255,255,0.12)" strokeWidth={1} strokeDasharray="3,3"
                                        />
                                        <line
                                            x1={WORDS.find(w => w.word === analogy.c)!.x * SIZE}
                                            y1={WORDS.find(w => w.word === analogy.c)!.y * SIZE}
                                            x2={(actual?.x ?? 0.5) * SIZE}
                                            y2={(actual?.y ?? 0.5) * SIZE}
                                            stroke="#f43f5e40" strokeWidth={1.5} strokeDasharray="3,3"
                                        />
                                        {predicted && (
                                            <motion.circle
                                                initial={{ r: 0 }}
                                                animate={{ r: 4 }}
                                                cx={predicted.x * SIZE}
                                                cy={predicted.y * SIZE}
                                                fill="none"
                                                stroke="#f43f5e"
                                                strokeWidth={1}
                                                strokeDasharray="2,2"
                                                opacity={0.6}
                                            />
                                        )}
                                    </>
                                )}
                                {WORDS.map(wp => {
                                    const isAnalogy = [analogy.a, analogy.b, analogy.c, analogy.result].includes(wp.word);
                                    const isResult = wp.word === analogy.result;
                                    const isHov = hoveredWord === wp.word;
                                    const showResult = isResult && revealed;
                                    const opacity = isAnalogy || isHov ? 1 : 0.3;
                                    const color = CAT_COLORS[wp.category];
                                    if (isResult && !revealed) return null;
                                    return (
                                        <g key={wp.word}
                                            onMouseEnter={() => setHoveredWord(wp.word)}
                                            onMouseLeave={() => setHoveredWord(null)}
                                            style={{ cursor: "default" }}
                                        >
                                            {showResult ? (
                                                <motion.circle
                                                    initial={{ r: 0, opacity: 0 }}
                                                    animate={{ r: 6, opacity: 1 }}
                                                    transition={{ type: "spring", stiffness: 200 }}
                                                    cx={wp.x * SIZE} cy={wp.y * SIZE}
                                                    fill="#f43f5e" stroke="white" strokeWidth={1.5}
                                                />
                                            ) : (
                                                <circle
                                                    cx={wp.x * SIZE} cy={wp.y * SIZE}
                                                    r={isHov ? 6 : isAnalogy ? 5 : 3.5}
                                                    fill={color} opacity={opacity}
                                                    stroke={isHov || isAnalogy ? "white" : "none"}
                                                    strokeWidth={isHov ? 1.5 : isAnalogy ? 0.8 : 0}
                                                />
                                            )}
                                            <text
                                                x={wp.x * SIZE} y={wp.y * SIZE - (isAnalogy ? 8 : 6)}
                                                textAnchor="middle"
                                                fill={isHov || isAnalogy ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)"}
                                                fontSize={isAnalogy ? 7 : 5.5} fontFamily="monospace"
                                                fontWeight={isAnalogy ? 700 : 500}
                                            >
                                                {wp.word}
                                            </text>
                                        </g>
                                    );
                                })}
                                <text x={SIZE / 2} y={SIZE - 4} textAnchor="middle" fill="rgba(255,255,255,0.08)" fontSize={5} fontFamily="monospace">
                                    gender direction →
                                </text>
                                <text x={6} y={SIZE / 2} textAnchor="middle" fill="rgba(255,255,255,0.08)" fontSize={5} fontFamily="monospace" transform={`rotate(-90, 6, ${SIZE / 2})`}>
                                    royalty direction →
                                </text>
                            </svg>
                        </div>

                        {/* Explanation */}
                        <AnimatePresence mode="wait">
                            {revealed && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-3"
                                >
                                    <div className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                        <p className="text-[10px] font-mono text-emerald-400/70 leading-relaxed">
                                            <strong>{analogy.explanation}</strong> The same principle that makes our character embeddings cluster vowels together — at word scale — lets the network understand that &quot;king is to man as queen is to woman.&quot; Meaning becomes geometry.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <motion.div
                        key="neighborhoods"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        className="space-y-3"
                    >
                        {/* Neighborhood selector */}
                        <div className="flex gap-1.5">
                            {NEIGHBORHOODS.map((n, i) => (
                                <button
                                    key={n.label}
                                    onClick={() => { setSelectedNeighborhood(i); setHoveredWord(null); }}
                                    className="flex-1 rounded-lg border px-2 py-1.5 text-center transition-all"
                                    style={{
                                        borderColor: i === selectedNeighborhood ? "#10b98140" : "rgba(255,255,255,0.06)",
                                        backgroundColor: i === selectedNeighborhood ? "#10b98108" : "rgba(255,255,255,0.01)",
                                        color: i === selectedNeighborhood ? "#10b981" : "rgba(255,255,255,0.25)",
                                    }}
                                >
                                    <span className="text-[9px] font-mono font-bold">{n.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Description */}
                        <p className="text-[10px] font-mono text-white/35 leading-relaxed">{neighborhood.description}</p>

                        {/* Scatter visualization */}
                        <div className="relative rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full" style={{ maxHeight: 300 }}>
                                {[0.25, 0.5, 0.75].map(f => (
                                    <g key={f}>
                                        <line x1={f * SIZE} y1={0} x2={f * SIZE} y2={SIZE} stroke="rgba(255,255,255,0.025)" strokeWidth={0.5} />
                                        <line x1={0} y1={f * SIZE} x2={SIZE} y2={f * SIZE} stroke="rgba(255,255,255,0.025)" strokeWidth={0.5} />
                                    </g>
                                ))}
                                {/* Cluster ellipses (visual grouping aid) */}
                                {(() => {
                                    const uniqueGroups = [...new Set(neighborhood.words.map(w => w.group))];
                                    return uniqueGroups.map((grp, gi) => {
                                        const pts = neighborhood.words.filter(w => w.group === grp);
                                        if (pts.length < 2) return null;
                                        const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length * SIZE;
                                        const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length * SIZE;
                                        const color = neighborhood.groups[Math.min(gi, neighborhood.groups.length - 1)]?.color ?? "#64748b";
                                        return (
                                            <ellipse
                                                key={grp}
                                                cx={cx} cy={cy}
                                                rx={22} ry={18}
                                                fill={color}
                                                fillOpacity={0.04}
                                                stroke={color}
                                                strokeOpacity={0.12}
                                                strokeWidth={0.8}
                                            />
                                        );
                                    });
                                })()}
                                {/* Word points */}
                                {neighborhood.words.map((wp) => {
                                    const uniqueGroups = [...new Set(neighborhood.words.map(w => w.group))];
                                    const gi = uniqueGroups.indexOf(wp.group);
                                    const color = neighborhood.groups[Math.min(gi, neighborhood.groups.length - 1)]?.color ?? "#64748b";
                                    const isHov = hoveredWord === wp.word;
                                    return (
                                        <g key={wp.word}
                                            onMouseEnter={() => setHoveredWord(wp.word)}
                                            onMouseLeave={() => setHoveredWord(null)}
                                            style={{ cursor: "default" }}
                                        >
                                            <circle
                                                cx={wp.x * SIZE} cy={wp.y * SIZE}
                                                r={isHov ? 6 : 4}
                                                fill={color}
                                                opacity={hoveredWord && !isHov ? 0.25 : isHov ? 1 : 0.7}
                                                stroke={isHov ? "white" : "none"} strokeWidth={1.5}
                                            />
                                            <text
                                                x={wp.x * SIZE} y={wp.y * SIZE - 7}
                                                textAnchor="middle"
                                                fill={isHov ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.5)"}
                                                fontSize={isHov ? 7 : 5.5} fontFamily="monospace"
                                                fontWeight={isHov ? 700 : 500}
                                            >
                                                {wp.word}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>

                        {/* Group legend */}
                        <div className="flex flex-wrap gap-3 text-[8px] font-mono">
                            {neighborhood.groups.map(g => (
                                <span key={g.name} className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                                    <span style={{ color: g.color + "90" }}>{g.name}</span>
                                </span>
                            ))}
                        </div>

                        {/* Insight */}
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-3">
                            <div className="flex items-start gap-2">
                                <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                <p className="text-[10px] font-mono text-emerald-400/70 leading-relaxed">
                                    {neighborhood.insight}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer legend + source */}
            <div className="flex items-center justify-between">
                {tab === "analogies" && (
                    <div className="flex gap-3 text-[8px] font-mono">
                        {Object.entries(CAT_COLORS).filter(([k]) => k !== "result").map(([cat, color]) => (
                            <span key={cat} className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                {cat}
                            </span>
                        ))}
                    </div>
                )}
                {tab === "neighborhoods" && <span />}
                <p className="text-[7px] font-mono text-white/15">
                    Illustrative · Not from our models
                </p>
            </div>
        </div>
    );
}
