"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";

import { useI18n } from "@/i18n/context";

/* ─── Corpus text — real English excerpt kept short for visual clarity ─── */
const CORPUS =
    "the cat sat on the mat and the hat was flat the bat sat that the rat ate the fat cat";

/* ─── Character options for the learner to pick ─── */
const SELECTABLE_CHARS = ["t", "a", "e", "h", "s", " "];

/* ─── Types ─── */
type PairTally = Record<string, number>;

/* ─── Helpers ─── */
function displayChar(c: string) {
    return c === " " ? "·" : c;
}

function findPairPositions(text: string, startChar: string): number[] {
    const positions: number[] = [];
    for (let i = 0; i < text.length - 1; i++) {
        if (text[i] === startChar) positions.push(i);
    }
    return positions;
}

const SCAN_DELAY_MS = 550;

/* ─── Component ─── */
export const CorpusCountingIdea = memo(function CorpusCountingIdea() {
    const { t } = useI18n();
    const containerRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [selectedChar, setSelectedChar] = useState<string | null>(null);
    const [scanIndex, setScanIndex] = useState(-1); // which pair position we're at
    const [scanning, setScanning] = useState(false);
    const [manualMode, setManualMode] = useState(false);
    const [tally, setTally] = useState<PairTally>({});
    const [done, setDone] = useState(false);
    const [pairPositions, setPairPositions] = useState<number[]>([]);
    const [lastFoundPair, setLastFoundPair] = useState<string | null>(null);

    /* ── Start scanning for a selected character ── */
    const startScan = useCallback(
        (char: string) => {
            if (timerRef.current) clearTimeout(timerRef.current);
            setSelectedChar(char);
            const positions = findPairPositions(CORPUS, char);
            setPairPositions(positions);
            setTally({});
            setScanIndex(-1);
            setDone(false);
            setLastFoundPair(null);

            if (positions.length === 0) {
                setDone(true);
                return;
            }

            setScanning(true);
            setManualMode(false);
            timerRef.current = setTimeout(() => setScanIndex(0), 400);
        },
        []
    );

    /* ── Advance one step manually ── */
    const advanceManual = useCallback(() => {
        setScanIndex((prev) => {
            const next = prev + 1;
            if (next >= pairPositions.length) {
                setScanning(false);
                setDone(true);
                return prev;
            }
            return next;
        });
    }, [pairPositions.length]);

    /* ── Record pair at current scan index ── */
    useEffect(() => {
        if (!scanning || scanIndex < 0 || scanIndex >= pairPositions.length) {
            if (scanning && scanIndex >= pairPositions.length) {
                setScanning(false);
                setDone(true);
            }
            return;
        }

        const pos = pairPositions[scanIndex];
        const nextChar = CORPUS[pos + 1];
        setTally((prev) => ({
            ...prev,
            [nextChar]: (prev[nextChar] || 0) + 1,
        }));
        setLastFoundPair(`${displayChar(CORPUS[pos])}→${displayChar(nextChar)}`);

        // Only auto-advance if NOT in manual mode
        if (!manualMode) {
            timerRef.current = setTimeout(
                () => setScanIndex((i) => i + 1),
                SCAN_DELAY_MS
            );
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [scanIndex, scanning, pairPositions, manualMode]);

    /* ── Cleanup ── */
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    /* ── Switch to manual mode (pause auto-scan) ── */
    const toggleManual = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setManualMode(true);
    }, []);

    const currentHighlight = scanning && scanIndex >= 0 && scanIndex < pairPositions.length
        ? pairPositions[scanIndex]
        : -1;

    const totalFound = Object.values(tally).reduce((a, b) => a + b, 0);

    // Sort tally entries by count descending for the bar display
    const sortedTally = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    const maxCount = sortedTally.length > 0 ? sortedTally[0][1] : 1;

    return (
        <div ref={containerRef} className="space-y-5">
            {/* Character picker */}
            <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/25 mb-3">
                    {t("bigramNarrative.corpusCounting.selectChar")}
                </p>
                <div className="flex flex-wrap gap-2">
                    {SELECTABLE_CHARS.map((ch) => (
                        <button
                            key={ch}
                            onClick={() => startScan(ch)}
                            disabled={scanning}
                            className={`w-11 h-11 rounded-lg font-mono text-lg font-bold border transition-all duration-200 ${selectedChar === ch
                                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 scale-110"
                                : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:bg-white/[0.08] hover:text-white/80"
                                } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                            {displayChar(ch)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main split layout */}
            {selectedChar !== null && (
                <div className="space-y-4">
                    {/* Live explanation banner */}
                    {scanning && lastFoundPair && (
                        <motion.div
                            key={`explain-${scanIndex}`}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/20"
                        >
                            <span className="font-mono text-emerald-300 font-bold text-sm">{lastFoundPair}</span>
                            <span className="text-white/35 text-xs">
                                {t("bigramNarrative.corpusCounting.stepExplain")
                                    .replace("{pos}", String(scanIndex + 1))
                                    .replace("{total}", String(pairPositions.length))}
                            </span>
                            {!manualMode && (
                                <button
                                    onClick={toggleManual}
                                    className="ml-2 px-2 py-0.5 rounded text-[10px] font-mono text-white/40 border border-white/[0.08] hover:bg-white/[0.06] transition-colors cursor-pointer"
                                >
                                    {t("bigramNarrative.corpusCounting.pauseBtn")}
                                </button>
                            )}
                            {manualMode && !done && (
                                <button
                                    onClick={advanceManual}
                                    className="ml-2 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400/70 border border-emerald-500/20 hover:bg-emerald-500/[0.08] transition-colors cursor-pointer"
                                >
                                    {t("bigramNarrative.corpusCounting.nextBtn")}
                                </button>
                            )}
                        </motion.div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left: Corpus text with highlights */}
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                            <p className="text-[9px] font-mono uppercase tracking-widest text-white/20 mb-3">
                                {t("bigramNarrative.corpusCounting.corpusLabel")}
                            </p>
                            <div className="font-mono text-sm leading-relaxed select-none overflow-hidden break-all max-h-[200px] overflow-y-auto">
                                {CORPUS.split("").map((char, i) => {
                                    const isStartOfHighlight = i === currentHighlight;
                                    const isEndOfHighlight = i === currentHighlight + 1;
                                    const isPastPairStart =
                                        pairPositions.includes(i) && scanIndex > pairPositions.indexOf(i);

                                    let cls = "text-white/30";
                                    if (isStartOfHighlight) cls = "text-emerald-400 bg-emerald-500/20 rounded";
                                    else if (isEndOfHighlight) cls = "text-teal-300 bg-teal-500/20 rounded";
                                    else if (isPastPairStart) cls = "text-emerald-500/40";

                                    return (
                                        <span key={i} className={`${cls} transition-colors duration-150`}>
                                            {char === " " ? "\u00A0" : char}
                                        </span>
                                    );
                                })}
                            </div>

                            {/* Scan status */}
                            <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                                <span className="text-[10px] font-mono text-white/25">
                                    {scanning
                                        ? t("bigramNarrative.corpusCounting.scanning")
                                        : done
                                            ? t("bigramNarrative.corpusCounting.found")
                                                .replace("{count}", String(totalFound))
                                                .replace("{char}", displayChar(selectedChar))
                                            : ""}
                                </span>
                                {scanning && (
                                    <motion.div
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                        className="w-2 h-2 rounded-full bg-emerald-400"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Right: Live counter / bar chart */}
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                            <p className="text-[9px] font-mono uppercase tracking-widest text-white/20 mb-3">
                                {t("bigramNarrative.corpusCounting.countsLabel")}
                            </p>

                            <div className="space-y-2 min-h-[120px]">
                                <AnimatePresence>
                                    {sortedTally.map(([char, count]) => (
                                        <motion.div
                                            key={char}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            layout
                                            className="flex items-center gap-2"
                                        >
                                            <code className="w-7 h-7 flex items-center justify-center rounded bg-white/[0.04] border border-white/[0.08] text-white font-mono text-xs font-bold shrink-0">
                                                {displayChar(char)}
                                            </code>
                                            <div className="flex-1 h-6 bg-white/[0.03] rounded overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{
                                                        width: `${(count / Math.max(maxCount, 1)) * 100}%`,
                                                    }}
                                                    transition={{ duration: 0.2 }}
                                                    className="h-full rounded bg-gradient-to-r from-emerald-500 to-teal-400"
                                                />
                                            </div>
                                            <motion.span
                                                key={`${char}-${count}`}
                                                initial={{ scale: 1.3 }}
                                                animate={{ scale: 1 }}
                                                className="w-6 text-right font-mono text-xs font-bold text-emerald-400"
                                            >
                                                {count}
                                            </motion.span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {sortedTally.length === 0 && !scanning && selectedChar && (
                                    <p className="text-xs text-white/20 italic text-center py-4">
                                        {t("bigramNarrative.corpusCounting.empty")}
                                    </p>
                                )}
                            </div>

                            {/* Total */}
                            {totalFound > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between"
                                >
                                    <span className="text-[10px] font-mono text-white/25 uppercase tracking-wider">
                                        {t("bigramNarrative.corpusCounting.totalLabel")}
                                    </span>
                                    <span className="font-mono text-sm font-bold text-white/60">
                                        {totalFound}
                                    </span>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Reveal text after scan completes */}
            <AnimatePresence>
                {done && totalFound > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-center"
                    >
                        <p className="text-sm text-emerald-400/80 font-semibold leading-relaxed">
                            {t("bigramNarrative.corpusCounting.reveal")}
                        </p>

                        {/* Replay button */}
                        <button
                            onClick={() => selectedChar && startScan(selectedChar)}
                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-white/40 border border-white/[0.06] hover:bg-white/[0.04] hover:text-white/60 transition-colors"
                        >
                            <RotateCcw className="w-3 h-3" />
                            {t("bigramNarrative.corpusCounting.replay")}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Initial hint when nothing selected */}
            {selectedChar === null && (
                <p className="text-xs text-white/20 italic text-center py-2">
                    {t("bigramNarrative.corpusCounting.hint")}
                </p>
            )}
        </div>
    );
});
