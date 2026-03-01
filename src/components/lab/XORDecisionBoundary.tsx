"use client";

import { useEffect,useState } from "react";

const PL = 40;   // plot left
const PT = 40;   // plot top
const PW = 200;  // plot width
const PH = 200;  // plot height

function toSVG(dx: number, dy: number) {
    return { cx: PL + dx * PW, cy: PT + (1 - dy) * PH };
}

function pts(points: { dx: number; dy: number }[]) {
    return points
        .map(p => {
            const { cx, cy } = toSVG(p.dx, p.dy);
            return `${cx},${cy}`;
        })
        .join(" ");
}

const POINTS: { dx: number; dy: number; cls: 0 | 1; label: string }[] = [
    { dx: 0, dy: 0, cls: 0, label: "(0,0) → 0" },
    { dx: 0, dy: 1, cls: 1, label: "(0,1) → 1" },
    { dx: 1, dy: 0, cls: 1, label: "(1,0) → 1" },
    { dx: 1, dy: 1, cls: 0, label: "(1,1) → 0" },
];

type Candidate = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    hint: string;
    class0Region: string;
    class1Region: string;
};

const SINGLE_CANDIDATES: Candidate[] = [
    {
        x1: PL, y1: PT + PH / 2, x2: PL + PW, y2: PT + PH / 2, hint: "horizontal split",
        class0Region: `${PL},${PT + PH / 2} ${PL + PW},${PT + PH / 2} ${PL + PW},${PT + PH} ${PL},${PT + PH}`,
        class1Region: `${PL},${PT} ${PL + PW},${PT} ${PL + PW},${PT + PH / 2} ${PL},${PT + PH / 2}`,
    },
    {
        x1: PL + PW / 2, y1: PT, x2: PL + PW / 2, y2: PT + PH, hint: "vertical split",
        class0Region: `${PL},${PT} ${PL + PW / 2},${PT} ${PL + PW / 2},${PT + PH} ${PL},${PT + PH}`,
        class1Region: `${PL + PW / 2},${PT} ${PL + PW},${PT} ${PL + PW},${PT + PH} ${PL + PW / 2},${PT + PH}`,
    },
    {
        x1: PL, y1: PT, x2: PL + PW, y2: PT + PH, hint: "diagonal split",
        class0Region: `${PL},${PT} ${PL},${PT + PH} ${PL + PW},${PT + PH}`,
        class1Region: `${PL},${PT} ${PL + PW},${PT} ${PL + PW},${PT + PH}`,
    },
];

const HIDDEN_BAND = pts([
    { dx: 0, dy: 0.75 },
    { dx: 0, dy: 1 },
    { dx: 0.25, dy: 1 },
    { dx: 1, dy: 0.25 },
    { dx: 1, dy: 0 },
    { dx: 0.75, dy: 0 },
]);

const HIDDEN_TRI_BOTTOM_LEFT = pts([
    { dx: 0, dy: 0 },
    { dx: 0, dy: 0.75 },
    { dx: 0.75, dy: 0 },
]);

const HIDDEN_TRI_TOP_RIGHT = pts([
    { dx: 0.25, dy: 1 },
    { dx: 1, dy: 1 },
    { dx: 1, dy: 0.25 },
]);

type Mode = "single" | "hidden";

function AxisLabels() {
    const ticks = [0, 0.5, 1];
    return (
        <g aria-hidden="true">
            <text x={PL + PW / 2} y={PT + PH + 32} textAnchor="middle" fontSize="11"
                fontFamily="ui-monospace,monospace" fill="rgba(255,255,255,0.3)">x₁</text>
            <text x={PL - 30} y={PT + PH / 2} textAnchor="middle" fontSize="11"
                fontFamily="ui-monospace,monospace" fill="rgba(255,255,255,0.3)"
                transform={`rotate(-90,${PL - 30},${PT + PH / 2})`}>x₂</text>
            {ticks.map(v => {
                const xSVG = PL + v * PW;
                const ySVG = PT + (1 - v) * PH;
                return (
                    <g key={v}>
                        <line x1={xSVG} y1={PT + PH} x2={xSVG} y2={PT + PH + 4}
                            stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                        <text x={xSVG} y={PT + PH + 18} textAnchor="middle" fontSize="9"
                            fontFamily="ui-monospace,monospace" fill="rgba(255,255,255,0.25)">{v}</text>
                        <line x1={PL - 4} y1={ySVG} x2={PL} y2={ySVG}
                            stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                        <text x={PL - 8} y={ySVG + 3} textAnchor="end" fontSize="9"
                            fontFamily="ui-monospace,monospace" fill="rgba(255,255,255,0.25)">{v}</text>
                    </g>
                );
            })}
        </g>
    );
}

export function XORDecisionBoundary() {
    const [mode, setMode] = useState<Mode>("single");
    const [lineIdx, setLineIdx] = useState(0);

    useEffect(() => {
        if (mode !== "single") return;
        const id = setInterval(() => setLineIdx(i => (i + 1) % SINGLE_CANDIDATES.length), 1800);
        return () => clearInterval(id);
    }, [mode]);

    const activeLine = SINGLE_CANDIDATES[lineIdx];
    const isSolved = mode === "hidden";

    return (
        <figure className="my-8 -mx-2 sm:mx-0" aria-label="XOR decision boundary visualizer">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">

                <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                    <div className="flex gap-1.5" aria-hidden="true">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                        XOR · Decision Boundary
                    </span>
                </div>

                <div className="p-4 sm:p-6">
                    <div role="group" aria-label="Decision boundary mode" className="flex gap-2 mb-6">
                        <button
                            onClick={() => setMode("single")}
                            aria-pressed={mode === "single"}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-colors
                                ${mode === "single"
                                    ? "bg-rose-500/15 border-rose-500/40 text-rose-300"
                                    : "bg-white/[0.02] border-white/[0.06] text-white/30 hover:text-white/50 hover:border-white/[0.12]"}`}
                        >
                            Single Perceptron
                        </button>
                        <button
                            onClick={() => setMode("hidden")}
                            aria-pressed={mode === "hidden"}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-colors
                                ${mode === "hidden"
                                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                                    : "bg-white/[0.02] border-white/[0.06] text-white/30 hover:text-white/50 hover:border-white/[0.12]"}`}
                        >
                            Hidden Layer
                        </button>
                    </div>

                    <svg
                        viewBox="0 0 280 280"
                        className="w-full max-w-sm mx-auto"
                        role="img"
                        aria-label={isSolved
                            ? "XOR solved: diamond-shaped decision boundary correctly separates all four points"
                            : "XOR failing: animated line cannot separate the four points linearly"}
                    >
                        <rect x={PL} y={PT} width={PW} height={PH}
                            fill="rgba(255,255,255,0.01)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" rx="4" />

                        {!isSolved && (
                            <>
                                <polygon
                                    points={activeLine.class0Region}
                                    fill="rgba(59,130,246,0.20)"
                                    style={{ transition: "all 0.45s ease" }}
                                />
                                <polygon
                                    points={activeLine.class1Region}
                                    fill="rgba(239,68,68,0.20)"
                                    style={{ transition: "all 0.45s ease" }}
                                />
                                <text
                                    x={PL + 24}
                                    y={PT + PH - 12}
                                    fontSize="9"
                                    fontFamily="ui-monospace,monospace"
                                    fill="rgba(96,165,250,0.85)"
                                >
                                    Class 0 region
                                </text>
                                <text
                                    x={PL + PW - 82}
                                    y={PT + 14}
                                    fontSize="9"
                                    fontFamily="ui-monospace,monospace"
                                    fill="rgba(248,113,113,0.85)"
                                >
                                    Class 1 region
                                </text>
                            </>
                        )}

                        {isSolved && (
                            <>
                                <polygon points={HIDDEN_TRI_BOTTOM_LEFT} fill="rgba(168,85,247,0.22)" />
                                <polygon points={HIDDEN_TRI_TOP_RIGHT} fill="rgba(168,85,247,0.22)" />
                                <polygon
                                    points={HIDDEN_BAND}
                                    fill="rgba(34,197,94,0.22)"
                                    stroke="rgba(34,197,94,0.55)"
                                    strokeWidth="1.5"
                                    strokeDasharray="6 4"
                                />
                                <text
                                    x={PL + PW / 2}
                                    y={PT + PH / 2 + 4}
                                    textAnchor="middle"
                                    fontSize="9"
                                    fontFamily="ui-monospace,monospace"
                                    fill="rgba(134,239,172,0.95)"
                                >
                                    Class 1 (band)
                                </text>
                                <text
                                    x={PL + 8}
                                    y={PT + 14}
                                    fontSize="9"
                                    fontFamily="ui-monospace,monospace"
                                    fill="rgba(216,180,254,0.9)"
                                >
                                    Class 0 (outside)
                                </text>
                            </>
                        )}

                        {[0.25, 0.5, 0.75].map(v => (
                            <g key={v}>
                                <line x1={PL + v * PW} y1={PT} x2={PL + v * PW} y2={PT + PH}
                                    stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                                <line x1={PL} y1={PT + v * PH} x2={PL + PW} y2={PT + v * PH}
                                    stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                            </g>
                        ))}

                        <AxisLabels />

                        {!isSolved && (
                            <line
                                key={lineIdx}
                                x1={activeLine.x1} y1={activeLine.y1}
                                x2={activeLine.x2} y2={activeLine.y2}
                                stroke="rgba(251,113,133,0.6)" strokeWidth="1.5"
                                strokeDasharray="6 3"
                                style={{ transition: "all 0.5s ease" }}
                                aria-label={`Separator attempt: ${activeLine.hint}`}
                            />
                        )}

                        {POINTS.map(({ dx, dy, cls, label }) => {
                            const { cx, cy } = toSVG(dx, dy);
                            const class0Fill = "rgba(251,146,60,0.25)";
                            const class0Stroke = "rgba(251,146,60,0.95)";
                            const class1Fill = "rgba(250,204,21,0.25)";
                            const class1Stroke = "rgba(250,204,21,0.95)";
                            return (
                                <g key={label} aria-label={label}>
                                    {cls === 1 ? (
                                        <circle cx={cx} cy={cy} r="11"
                                            fill={class1Fill}
                                            stroke={class1Stroke}
                                            strokeWidth="2" />
                                    ) : (
                                        <circle cx={cx} cy={cy} r="11"
                                            fill={class0Fill}
                                            stroke={class0Stroke}
                                            strokeWidth="2" />
                                    )}
                                    <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10"
                                        fontFamily="ui-monospace,monospace"
                                        fill="rgba(255,255,255,0.95)"
                                        fontWeight="700">{cls}</text>
                                </g>
                            );
                        })}
                    </svg>

                    <div
                        aria-live="polite"
                        className={`mt-5 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 border text-xs font-mono font-bold uppercase tracking-wider transition-colors
                            ${isSolved
                                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                                : "bg-rose-500/10 border-rose-500/25 text-rose-400"}`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${isSolved ? "bg-emerald-400" : "bg-rose-400"}`} />
                        {isSolved ? "Solved with non-linearity" : "Cannot separate linearly"}
                    </div>

                    <p className="mt-3 text-sm text-white/40 leading-relaxed">
                        {isSolved
                            ? "Hidden-layer view: the green diagonal band is Class 1, and the purple corners are Class 0. This non-linear boundary separates all four XOR points correctly."
                            : "Single-perceptron view: one straight line creates a blue Class 0 side and a red Class 1 side. Because XOR labels are diagonal, at least one point is always on the wrong side."}
                    </p>
                </div>
            </div>

            <figcaption className="mt-3 text-center text-xs text-white/25 italic">
                {isSolved
                    ? "Decision boundary = green diagonal band for Class 1, purple corners for Class 0."
                    : "Decision boundary = one line with blue/red half-spaces. The separator moves, but XOR still cannot be split linearly."}
            </figcaption>
        </figure>
    );
}
