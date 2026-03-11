"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

const W = ["king", "wore", "golden", "crown", "wisely"];
const E: [number, number][] = [[0.9, 0.4], [0.1, 0.8], [-0.2, 0.7], [0.8, 0.5], [-0.5, 0.6]];
const M = E.map(a => E.map(b => +(a[0] * b[0] + a[1] * b[1]).toFixed(2)));
const MX = Math.max(...M.flat().map(Math.abs));
const CLR = ["#22d3ee", "#a78bfa", "#f472b6", "#fbbf24", "#34d399"];

const EASE = [0.22, 1, 0.36, 1] as const;

function aPts(tx: number, ty: number, s: number): string {
    const l = Math.sqrt(tx * tx + ty * ty);
    if (l < 3) return "0,0 0,0 0,0";
    const nx = tx / l, ny = ty / l;
    const bx = tx - nx * s, by = ty - ny * s;
    const px = -ny * (s * 0.45), py = nx * (s * 0.45);
    return `${tx},${ty} ${bx + px},${by + py} ${bx - px},${by - py}`;
}

function cellBg(v: number): string {
    const n = v / MX;
    if (n > 0.85) return "rgba(34,211,238,0.38)";
    if (n > 0.6) return "rgba(34,211,238,0.22)";
    if (n > 0.35) return "rgba(34,211,238,0.12)";
    if (n > 0.1) return "rgba(34,211,238,0.05)";
    if (n > -0.1) return "rgba(255,255,255,0.02)";
    return "rgba(244,63,94,0.10)";
}

function cellTx(v: number): string {
    const n = v / MX;
    if (n > 0.7) return "rgba(165,243,252,0.9)";
    if (n > 0.35) return "rgba(165,243,252,0.55)";
    if (n > 0.1) return "rgba(255,255,255,0.35)";
    if (n > -0.1) return "rgba(255,255,255,0.18)";
    return "rgba(251,113,133,0.65)";
}

function scoreCol(v: number): string {
    if (v > 0.3) return "#34d399";
    if (v < -0.1) return "#f43f5e";
    return "rgba(255,255,255,0.45)";
}

function Arrow({ vec, color, scale = 28, w = 1.8 }: { vec: [number, number]; color: string; scale?: number; w?: number }) {
    const sz = scale * 2 + 16;
    const h = sz / 2;
    const tx = vec[0] * scale, ty = -vec[1] * scale;
    return (
        <svg width={sz} height={sz} viewBox={`${-h} ${-h} ${sz} ${sz}`} className="block">
            <line x1={0} y1={0} x2={tx} y2={ty} stroke={color} strokeWidth={w + 4} strokeLinecap="round" opacity={0.05} />
            <motion.line x1={0} y1={0} x2={tx} y2={ty} stroke={color} strokeWidth={w} strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, ease: EASE }} />
            <motion.polygon points={aPts(tx, ty, 5)} fill={color}
                initial={{ opacity: 0 }} animate={{ opacity: 0.85 }} transition={{ delay: 0.25 }} />
        </svg>
    );
}

type Act = 0 | 1 | 2 | 3;

function CompareOverlay({ a, b }: { a: number; b: number }) {
    const sc = 44;
    const [ax, ay] = [E[a][0] * sc, -E[a][1] * sc];
    const [bx, by] = [E[b][0] * sc, -E[b][1] * sc];
    const score = M[a][b];
    const sz = sc * 2 + 24;
    const h = sz / 2;
    return (
        <motion.div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-center"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10, transition: { duration: 0.12 } }}
            transition={{ duration: 0.35, ease: EASE }}>
            <svg width={sz} height={sz} viewBox={`${-h} ${-h} ${sz} ${sz}`} className="block shrink-0">
                <circle cx={0} cy={0} r={sc} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                <line x1={0} y1={0} x2={ax} y2={ay} stroke={CLR[a]} strokeWidth={2} strokeLinecap="round" opacity={0.8} />
                <polygon points={aPts(ax, ay, 5.5)} fill={CLR[a]} opacity={0.8} />
                <text x={ax * 1.25} y={ay * 1.25} textAnchor="middle" dominantBaseline="middle"
                    fill={CLR[a]} fontSize="9" fontWeight="700" fontFamily="system-ui">{W[a]}</text>
                <line x1={0} y1={0} x2={bx} y2={by} stroke={CLR[b]} strokeWidth={2} strokeLinecap="round" opacity={0.8} />
                <polygon points={aPts(bx, by, 5.5)} fill={CLR[b]} opacity={0.8} />
                <text x={bx * 1.25} y={by * 1.25} textAnchor="middle" dominantBaseline="middle"
                    fill={CLR[b]} fontSize="9" fontWeight="700" fontFamily="system-ui">{W[b]}</text>
            </svg>
            <div className="text-center space-y-1.5">
                <div className="text-2xl font-black font-mono" style={{ color: scoreCol(score) }}>
                    {score >= 0 ? "+" : ""}{score.toFixed(2)}
                </div>
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-white/25 flex-wrap">
                    {E[a].map((av, d) => (
                        <span key={d} className="flex items-center gap-0.5">
                            {d > 0 && <span className="mx-0.5 text-white/10">+</span>}
                            <span style={{ color: CLR[a] + "bb" }}>{av.toFixed(1)}</span>
                            <span className="text-white/12">×</span>
                            <span style={{ color: CLR[b] + "bb" }}>{E[b][d].toFixed(1)}</span>
                        </span>
                    ))}
                </div>
                <p className="text-[10px] text-white/15 italic">
                    {score > 0.7 ? "Strong alignment — these vectors point together"
                        : score > 0.3 ? "Moderate similarity"
                            : score > 0 ? "Weak overlap"
                                : "Opposing directions — negative score"}
                </p>
            </div>
        </motion.div>
    );
}

export function PairwiseScoringViz() {
    const [act, setAct] = useState<Act>(0);
    const [comparing, setComparing] = useState(-1);
    const [sel, setSel] = useState<[number, number] | null>(null);
    const [hov, setHov] = useState<[number, number] | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const active = sel ?? hov;

    const advanceTo = useCallback((next: Act) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setAct(next);
        setSel(null);
        setHov(null);
        setComparing(-1);
    }, []);

    useEffect(() => {
        if (act === 3 && comparing < W.length - 1) {
            timerRef.current = setTimeout(() => setComparing(p => p + 1), comparing < 0 ? 300 : 600);
            return () => { if (timerRef.current) clearTimeout(timerRef.current); };
        }
    }, [act, comparing]);

    const matrixReady = act === 3 && comparing >= W.length - 1;

    return (
        <div className="py-8 sm:py-14 px-2 sm:px-4">
            <div className="max-w-2xl mx-auto space-y-8">

                {/* ═══ ACT A: Words ═══ */}
                <div className="flex justify-center gap-6 sm:gap-10 flex-wrap">
                    {W.map((word, i) => (
                        <motion.div key={i} className="flex flex-col items-center gap-1"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08, duration: 0.5, ease: EASE }}>
                            <span className="text-lg sm:text-xl font-bold tracking-tight" style={{ color: CLR[i] }}>
                                {word}
                            </span>

                            {act >= 1 && (
                                <motion.div className="flex gap-1.5 mt-1"
                                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}>
                                    {E[i].map((v, d) => (
                                        <motion.span key={d}
                                            className="text-[11px] font-mono font-semibold tabular-nums"
                                            style={{ color: CLR[i] + "88" }}
                                            initial={{ opacity: 0, y: -6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.06 + d * 0.08, duration: 0.35, ease: EASE }}>
                                            {v.toFixed(1)}
                                        </motion.span>
                                    ))}
                                </motion.div>
                            )}

                            {act >= 2 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.6 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.07, duration: 0.45, ease: EASE }}>
                                    <Arrow vec={E[i]} color={CLR[i]} scale={22} w={1.5} />
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* ═══ Connective line ═══ */}
                {act >= 1 && act < 3 && (
                    <motion.div className="flex justify-center"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                        <div className="h-px w-32" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
                    </motion.div>
                )}

                {/* ═══ ACT D: Comparison animation + Matrix ═══ */}
                {act === 3 && (
                    <motion.div className="space-y-6"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

                        {!matrixReady && comparing >= 0 && (
                            <motion.div className="text-center space-y-2"
                                key={`cmp-${comparing}`}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <p className="text-[11px] text-white/20 font-mono">
                                    comparing <span style={{ color: CLR[comparing] }}>{W[comparing]}</span> with all...
                                </p>
                                <div className="flex justify-center gap-3">
                                    {W.map((_, j) => {
                                        const v = M[comparing][j];
                                        return (
                                            <motion.span key={j} className="text-[11px] font-mono font-bold"
                                                style={{ color: cellTx(v) }}
                                                initial={{ opacity: 0, scale: 0.5 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: j * 0.06 }}>
                                                {v.toFixed(2)}
                                            </motion.span>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {matrixReady && (
                            <motion.div className="space-y-5"
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, ease: EASE }}>

                                <div className="flex justify-center">
                                    <div className="inline-block">
                                        <div className="flex mb-1.5" style={{ marginLeft: 60 }}>
                                            {W.map((word, c) => (
                                                <div key={c} className="text-center" style={{ width: 52, minWidth: 52 }}>
                                                    <span className="text-[10px] font-semibold transition-colors duration-150"
                                                        style={{ color: active?.[1] === c ? CLR[c] : "rgba(255,255,255,0.2)" }}>
                                                        {word}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {W.map((rw, r) => (
                                            <div key={r} className="flex items-center">
                                                <span className="text-[11px] font-semibold text-right pr-2.5 shrink-0 transition-colors duration-150"
                                                    style={{ width: 60, color: active?.[0] === r ? CLR[r] : "rgba(255,255,255,0.2)" }}>
                                                    {rw}
                                                </span>
                                                {W.map((_, c) => {
                                                    const v = M[r][c];
                                                    const isA = active?.[0] === r && active?.[1] === c;
                                                    const isX = active !== null && (active[0] === r || active[1] === c);
                                                    return (
                                                        <motion.div key={c}
                                                            className="flex items-center justify-center cursor-pointer"
                                                            style={{
                                                                width: 50, height: 44, minWidth: 50,
                                                                margin: 1, borderRadius: 6,
                                                                background: isA ? "rgba(34,211,238,0.2)" : cellBg(v),
                                                                border: isA ? "1.5px solid rgba(34,211,238,0.5)"
                                                                    : isX ? "1px solid rgba(255,255,255,0.05)"
                                                                        : "1px solid rgba(255,255,255,0.02)",
                                                                transition: "background 0.15s, border 0.15s",
                                                            }}
                                                            onMouseEnter={() => setHov([r, c])}
                                                            onMouseLeave={() => setHov(null)}
                                                            onClick={() => setSel(p => p && p[0] === r && p[1] === c ? null : [r, c])}
                                                            initial={{ opacity: 0, scale: 0.4 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ delay: (r * W.length + c) * 0.025, duration: 0.35, ease: EASE }}>
                                                            <span className="text-[11px] font-mono font-bold" style={{ color: cellTx(v) }}>
                                                                {v.toFixed(2)}
                                                            </span>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {active ? (
                                        <CompareOverlay key={`o-${active[0]}-${active[1]}`} a={active[0]} b={active[1]} />
                                    ) : (
                                        <motion.p key="hint" className="text-center text-[11px] text-white/15"
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            Click any cell to inspect the comparison
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* ═══ Stage controls ═══ */}
                <div className="flex justify-center items-center gap-3 pt-2">
                    {act > 0 && (
                        <button onClick={() => advanceTo(Math.max(0, act - 1) as Act)}
                            className="text-[11px] text-white/20 hover:text-white/40 transition-colors cursor-pointer">
                            ← Back
                        </button>
                    )}
                    <div className="flex gap-1.5">
                        {([0, 1, 2, 3] as Act[]).map(s => (
                            <motion.div key={s}
                                className="rounded-full cursor-pointer"
                                style={{
                                    width: s === act ? 20 : 7,
                                    height: 7,
                                    background: s === act ? "rgba(34,211,238,0.5)" : s < act ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.06)",
                                    transition: "all 0.3s",
                                }}
                                onClick={() => advanceTo(s)}
                            />
                        ))}
                    </div>
                    {act < 3 && (
                        <motion.button onClick={() => advanceTo((act + 1) as Act)}
                            className="text-[12px] font-semibold text-cyan-400/60 hover:text-cyan-400/90 transition-colors cursor-pointer"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                            {act === 0 ? "See the numbers →" : act === 1 ? "See the arrows →" : "Compare all →"}
                        </motion.button>
                    )}
                    {act === 3 && matrixReady && (
                        <button onClick={() => advanceTo(0)}
                            className="text-[11px] text-white/20 hover:text-white/40 transition-colors cursor-pointer">
                            ↺ Replay
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
