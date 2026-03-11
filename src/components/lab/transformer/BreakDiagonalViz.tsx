"use client";

import { useCallback, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  BreakDiagonalViz — Discovery-driven "aha moment" visualizer

  Phase 1: Raw embedding matrix. Diagonal pulses amber. Problem is obvious.
  Phase 2: User clicks "Break the diagonal" → matrix morphs to Q×K scores.
           Off-diagonal cells light up. Diagonal loses dominance.
  Phase 3: Aha panel + click any cell to compare arrows.

  Pedagogical goal: the user DISCOVERS why Q/K matters by seeing the
  transformation happen. This is the single most important insight
  in the attention chapter.
*/

/* ─── Data ─── */
const WORDS = ["king", "wore", "the", "golden", "crown"];

const RAW: number[][] = [
    [0.97, 0.41, 0.10, 0.38, 0.92],
    [0.41, 0.65, 0.54, 0.50, 0.48],
    [0.10, 0.54, 0.53, 0.42, 0.19],
    [0.38, 0.50, 0.42, 0.61, 0.35],
    [0.92, 0.48, 0.19, 0.35, 0.89],
];

const QK: number[][] = [
    [0.15, 0.42, -0.18, 0.55, 0.88],
    [0.35, 0.12, 0.28, 0.60, 0.40],
    [-0.10, 0.22, 0.08, 0.30, 0.15],
    [0.48, 0.55, 0.10, 0.20, 0.72],
    [0.85, 0.38, -0.12, 0.65, 0.18],
];

/* Which cell wins per row */
function rowWinner(matrix: number[][]): number[] {
    return matrix.map((row) => {
        let mi = 0;
        row.forEach((v, i) => { if (v > row[mi]) mi = i; });
        return mi;
    });
}

const RAW_WINNERS = rowWinner(RAW);
const QK_WINNERS = rowWinner(QK);

/* ─── Arrow data ─── */
const EMB_ANG: number[] = [25, 70, 165, 55, 35];
const Q_ANG: number[] = [25, 100, 170, 60, 45];
const K_ANG: number[] = [115, 30, 160, 85, 140];

/* ─── Helpers ─── */
const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1.0];

function degXY(deg: number, len: number): [number, number] {
    const rad = (deg * Math.PI) / 180;
    return [Math.cos(rad) * len, -Math.sin(rad) * len];
}

function arrowPts(tx: number, ty: number, sz: number): string {
    const len = Math.sqrt(tx * tx + ty * ty);
    if (len < 1) return "0,0 0,0 0,0";
    const nx = tx / len, ny = ty / len;
    const bx = tx - nx * sz, by = ty - ny * sz;
    const px = -ny * (sz * 0.45), py = nx * (sz * 0.45);
    return `${tx},${ty} ${bx + px},${by + py} ${bx - px},${by - py}`;
}

function angleDiff(a: number, b: number): number {
    let d = Math.abs(a - b) % 360;
    if (d > 180) d = 360 - d;
    return d;
}

/* ─── Arrow comparison ─── */
function ArrowCompare({
    angA, angB, colorA, colorB, labelA, labelB, score,
}: {
    angA: number; angB: number; colorA: string; colorB: string;
    labelA: string; labelB: string; score: number;
}) {
    const SZ = 110, H = SZ / 2, LEN = 40;
    const [ax, ay] = degXY(angA, LEN);
    const [bx, by] = degXY(angB, LEN);
    const diff = angleDiff(angA, angB);
    const verdict = diff < 30 ? "Same direction → high score"
        : diff < 70 ? "Somewhat aligned"
            : diff < 120 ? "Different directions → low score"
                : "Opposing → negative score";
    const vc = diff < 30 ? "rgba(52,211,153,0.7)"
        : diff < 70 ? "rgba(251,191,36,0.6)"
            : diff < 120 ? "rgba(255,255,255,0.4)"
                : "rgba(244,63,94,0.6)";

    return (
        <div className="flex flex-col items-center gap-1">
            <svg width={SZ} height={SZ} viewBox={`${-H} ${-H} ${SZ} ${SZ}`} className="block">
                <line x1={-H + 3} y1={0} x2={H - 3} y2={0} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                <line x1={0} y1={-H + 3} x2={0} y2={H - 3} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                <circle cx={0} cy={0} r={LEN} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
                <circle cx={0} cy={0} r={1.5} fill="rgba(255,255,255,0.06)" />

                <line x1={0} y1={0} x2={ax} y2={ay} stroke={colorA} strokeWidth={6} strokeLinecap="round" opacity={0.06} />
                <motion.line x1={0} y1={0} x2={ax} y2={ay} stroke={colorA} strokeWidth={2} strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, ease: EASE }} />
                <motion.polygon points={arrowPts(ax, ay, 6)} fill={colorA}
                    initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ delay: 0.25 }} />
                <text x={ax + (ax > 0 ? 6 : -6)} y={ay + (ay < -5 ? -6 : 11)} textAnchor={ax > 0 ? "start" : "end"}
                    fill={colorA} fontSize="8" fontWeight="bold" fontFamily="system-ui, sans-serif">{labelA}</text>

                <line x1={0} y1={0} x2={bx} y2={by} stroke={colorB} strokeWidth={6} strokeLinecap="round" opacity={0.06} />
                <motion.line x1={0} y1={0} x2={bx} y2={by} stroke={colorB} strokeWidth={2} strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: 0.08, ease: EASE }} />
                <motion.polygon points={arrowPts(bx, by, 6)} fill={colorB}
                    initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ delay: 0.3 }} />
                <text x={bx + (bx > 0 ? 6 : -6)} y={by + (by < -5 ? -6 : 11)} textAnchor={bx > 0 ? "start" : "end"}
                    fill={colorB} fontSize="8" fontWeight="bold" fontFamily="system-ui, sans-serif">{labelB}</text>
            </svg>
            <p className="text-[9px] font-semibold" style={{ color: vc }}>{verdict}</p>
            <p className="text-[8px] text-white/15 font-mono">
                score = <span style={{
                    color: score > 0.5 ? "rgba(34,211,238,0.7)" : score < 0 ? "rgba(244,63,94,0.6)" : "rgba(255,255,255,0.3)"
                }}>{score >= 0 ? "+" : ""}{score.toFixed(2)}</span>
            </p>
        </div>
    );
}

/* ─── Cell constants ─── */
const CELL = 48;
const CELL_H = 42;
const RLBL = 54;

/* ─── Component ─── */
export function BreakDiagonalViz() {
    const [broken, setBroken] = useState(false); // false = raw, true = Q×K
    const [sel, setSel] = useState<[number, number] | null>(null);

    const matrix = broken ? QK : RAW;
    const winners = broken ? QK_WINNERS : RAW_WINNERS;
    const maxVal = broken ? 0.88 : 0.97;
    const accent = broken ? "#22d3ee" : "#fbbf24";

    const handleCell = useCallback((r: number, c: number) => {
        setSel(prev => prev && prev[0] === r && prev[1] === c ? null : [r, c]);
    }, []);

    /* How many rows have diagonal winner? */
    const diagWins = winners.filter((w, i) => w === i).length;

    return (
        <div className="py-6 sm:py-10 px-2 sm:px-4 space-y-5">
            {/* ── Status badge ── */}
            <div className="flex justify-center">
                <motion.div
                    className="rounded-full px-4 py-1.5 text-[11px] sm:text-xs font-semibold"
                    style={{
                        background: broken
                            ? "linear-gradient(90deg, rgba(34,211,238,0.1), rgba(52,211,153,0.08))"
                            : "linear-gradient(90deg, rgba(251,191,36,0.1), rgba(244,63,94,0.06))",
                        border: `1px solid ${broken ? "rgba(34,211,238,0.2)" : "rgba(251,191,36,0.2)"}`,
                        color: broken ? "rgba(34,211,238,0.7)" : "rgba(251,191,36,0.7)",
                    }}
                    layout
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                    {broken
                        ? `✓ Diagonal broken — ${diagWins}/5 self-wins`
                        : `⚠ Diagonal dominates — ${diagWins}/5 self-wins`}
                </motion.div>
            </div>

            {/* ── Matrix ── */}
            <div className="flex flex-col md:flex-row items-start justify-center gap-4">
                <div className="inline-block">
                    {/* Column headers */}
                    <div className="flex mb-1" style={{ marginLeft: RLBL }}>
                        {WORDS.map((word, c) => (
                            <div key={c} className="text-center" style={{ width: CELL, minWidth: CELL }}>
                                <span className="text-[8px] sm:text-[9px] font-medium text-white/20">{word}</span>
                            </div>
                        ))}
                    </div>

                    {/* Rows */}
                    {WORDS.map((rowWord, r) => {
                        const isSelRow = sel?.[0] === r;
                        return (
                            <div key={r} className="flex items-center" style={{ opacity: sel && !isSelRow ? 0.3 : 1, transition: "opacity 0.2s" }}>
                                <span
                                    className="text-[9px] sm:text-[10px] font-semibold text-right pr-2 shrink-0"
                                    style={{ width: RLBL, color: isSelRow ? accent : "rgba(255,255,255,0.22)" }}
                                >
                                    {rowWord}
                                </span>
                                {WORDS.map((_, c) => {
                                    const val = matrix[r][c];
                                    const isDiag = r === c;
                                    const isWinner = winners[r] === c;
                                    const isSel = sel?.[0] === r && sel?.[1] === c;
                                    const norm = Math.max(0, val / maxVal);

                                    /* Cell color */
                                    let bg: string;
                                    if (isSel) {
                                        bg = `rgba(34,211,238,0.25)`;
                                    } else if (isDiag && !broken) {
                                        bg = `rgba(251,191,36,${norm * 0.5})`;
                                    } else if (val < 0) {
                                        bg = `rgba(244,63,94,${Math.abs(val / maxVal) * 0.3})`;
                                    } else {
                                        const rgb = broken ? "34,211,238" : "251,191,36";
                                        bg = `rgba(${rgb},${norm * 0.4})`;
                                    }

                                    let border: string;
                                    if (isSel) border = `2px solid ${accent}`;
                                    else if (isWinner && isSelRow) border = `1.5px solid ${accent}70`;
                                    else if (isDiag && !broken) border = "1px solid rgba(251,191,36,0.2)";
                                    else border = "1px solid rgba(255,255,255,0.03)";

                                    const txtColor = norm > 0.7
                                        ? (broken ? "rgba(165,243,252,0.9)" : "rgba(253,224,71,0.9)")
                                        : norm > 0.35
                                            ? "rgba(255,255,255,0.55)"
                                            : val < 0
                                                ? "rgba(251,113,133,0.6)"
                                                : "rgba(255,255,255,0.22)";

                                    return (
                                        <motion.div
                                            key={`${r}-${c}-${broken}`}
                                            className="flex items-center justify-center cursor-pointer"
                                            style={{
                                                width: CELL - 2, height: CELL_H - 2, minWidth: CELL - 2,
                                                margin: 1, borderRadius: 8, background: bg, border,
                                                boxShadow: isSel ? `0 0 12px -2px ${accent}50`
                                                    : isDiag && !broken ? `0 0 8px -3px rgba(251,191,36,0.15)`
                                                        : "none",
                                            }}
                                            onClick={() => handleCell(r, c)}
                                            whileTap={{ scale: 0.93 }}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: isSel ? 1.08 : 1 }}
                                            transition={{ delay: r * 0.03 + c * 0.02, duration: 0.25, ease: EASE }}
                                        >
                                            <span className="text-[10px] sm:text-[11px] font-mono font-bold" style={{ color: txtColor }}>
                                                {val.toFixed(2)}
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                {/* Arrow comparison panel */}
                <AnimatePresence mode="wait">
                    {sel ? (
                        <motion.div
                            key={`arr-${sel[0]}-${sel[1]}-${broken}`}
                            className="flex-shrink-0"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10, transition: { duration: 0.1 } }}
                        >
                            {broken ? (
                                <ArrowCompare
                                    angA={Q_ANG[sel[0]]} angB={K_ANG[sel[1]]}
                                    colorA="#22d3ee" colorB="#34d399"
                                    labelA={`Q(${WORDS[sel[0]]})`} labelB={`K(${WORDS[sel[1]]})`}
                                    score={QK[sel[0]][sel[1]]}
                                />
                            ) : (
                                <ArrowCompare
                                    angA={EMB_ANG[sel[0]]} angB={EMB_ANG[sel[1]]}
                                    colorA="#fbbf24" colorB="#fbbf24"
                                    labelA={WORDS[sel[0]]} labelB={WORDS[sel[1]]}
                                    score={RAW[sel[0]][sel[1]]}
                                />
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="hint-arr"
                            className="flex items-center justify-center min-h-[110px] min-w-[110px]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <p className="text-[9px] text-white/12 text-center max-w-[90px] leading-relaxed">
                                Click a cell to see the arrows
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── The button ── */}
            <div className="flex justify-center">
                <motion.button
                    onClick={() => { setBroken(!broken); setSel(null); }}
                    className="relative px-6 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-semibold cursor-pointer overflow-hidden"
                    style={{
                        background: broken
                            ? "linear-gradient(135deg, rgba(34,211,238,0.08), rgba(52,211,153,0.05))"
                            : "linear-gradient(135deg, rgba(251,191,36,0.1), rgba(244,63,94,0.06))",
                        border: `1px solid ${broken ? "rgba(34,211,238,0.2)" : "rgba(251,191,36,0.2)"}`,
                        color: broken ? "rgba(34,211,238,0.75)" : "rgba(251,191,36,0.75)",
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                >
                    {broken ? "↩ Show raw embeddings" : "⚡ Break the diagonal"}
                </motion.button>
            </div>

            {/* ── Insight panel ── */}
            <AnimatePresence mode="wait">
                {broken ? (
                    <motion.div
                        key="aha"
                        className="max-w-md mx-auto text-center space-y-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                        transition={{ delay: 0.2, duration: 0.35 }}
                    >
                        <p className="text-[12px] sm:text-[13px] text-white/35 leading-relaxed">
                            <strong className="text-cyan-300/60">The diagonal is broken.</strong>{" "}
                            &ldquo;King&rdquo; now pays the most attention to{" "}
                            <strong className="text-cyan-300/50">&ldquo;crown&rdquo;</strong>{" "}
                            (0.88), not itself (0.15). Each word listens to the words that
                            actually matter for understanding the sentence.
                        </p>
                        <p className="text-[11px] text-white/20 leading-relaxed">
                            The Q and K lenses transform the same embedding into two different
                            views — what I need vs. what I offer — so the dot product measures
                            <em> relevance</em>, not self-similarity.
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="problem"
                        className="max-w-md mx-auto text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    >
                        <p className="text-[12px] sm:text-[13px] text-white/30 leading-relaxed">
                            The diagonal glows brightest — every word listens to{" "}
                            <strong className="text-amber-300/50">itself</strong> most.
                            That&apos;s useless for understanding context.
                            Can we break this pattern?
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
