"use client";

const W = 480;
const H = 200;
const PAD = 10;
const PANEL_W = 200;
const PANEL_H = 150;
const GAP = 60;
const LEFT_X = PAD;
const RIGHT_X = PAD + PANEL_W + GAP;
const PLOT_TOP = 20;

// Hardcoded noisy sine training points (x in [0,1], y in [0,1])
const TRAIN_PTS = [
    { x: 0.05, y: 0.52 }, { x: 0.10, y: 0.58 }, { x: 0.17, y: 0.68 },
    { x: 0.23, y: 0.74 }, { x: 0.30, y: 0.72 }, { x: 0.37, y: 0.65 },
    { x: 0.43, y: 0.55 }, { x: 0.50, y: 0.48 }, { x: 0.57, y: 0.42 },
    { x: 0.63, y: 0.38 }, { x: 0.70, y: 0.40 }, { x: 0.77, y: 0.48 },
    { x: 0.83, y: 0.58 }, { x: 0.90, y: 0.65 }, { x: 0.95, y: 0.68 },
];

// Test points at x values not in training set
const TEST_PTS = [
    { x: 0.13, y: 0.63 }, { x: 0.55, y: 0.45 }, { x: 0.86, y: 0.60 },
];

function toSvg(x: number, y: number, ox: number): [number, number] {
    return [ox + x * PANEL_W, PLOT_TOP + (1 - y) * PANEL_H];
}

// Good fit: smooth sine approximation
function goodFitPath(ox: number): string {
    const pts: string[] = [];
    for (let i = 0; i <= 60; i++) {
        const x = i / 60;
        const y = 0.5 + 0.22 * Math.sin((x - 0.5) * Math.PI * 2);
        const [sx, sy] = toSvg(x, y, ox);
        pts.push(`${i === 0 ? "M" : "L"}${sx.toFixed(1)},${sy.toFixed(1)}`);
    }
    return pts.join(" ");
}

// Overfit: wiggly path that passes through all training points
function overfitPath(ox: number): string {
    // Hand-crafted cubic bezier segments that hit each cluster of points
    const p = (x: number, y: number) => toSvg(x, y, ox);
    const pts = [
        p(0.0, 0.48), p(0.05, 0.52), p(0.10, 0.62), p(0.17, 0.72),
        p(0.23, 0.78), p(0.28, 0.68), p(0.30, 0.72), p(0.35, 0.80),
        p(0.37, 0.65), p(0.40, 0.48), p(0.43, 0.55), p(0.47, 0.38),
        p(0.50, 0.48), p(0.53, 0.58), p(0.57, 0.42), p(0.60, 0.28),
        p(0.63, 0.38), p(0.67, 0.52), p(0.70, 0.40), p(0.74, 0.28),
        p(0.77, 0.48), p(0.80, 0.65), p(0.83, 0.58), p(0.87, 0.72),
        p(0.90, 0.65), p(0.93, 0.55), p(0.95, 0.68), p(1.0, 0.60),
    ];
    return pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

function Panel({ ox, color, label1, label2, check1, check2, curveColor, curvePath }: {
    ox: number; color: string; label1: string; label2: string;
    check1: string; check2: string; curveColor: string; curvePath: string;
}) {
    return (
        <g>
            <rect x={ox} y={PLOT_TOP} width={PANEL_W} height={PANEL_H}
                fill="rgba(255,255,255,0.015)" stroke={color} strokeWidth={1} rx={4} />
            {/* Training points */}
            {TRAIN_PTS.map((p, i) => {
                const [sx, sy] = toSvg(p.x, p.y, ox);
                return <circle key={i} cx={sx} cy={sy} r={3} fill="rgba(255,255,255,0.65)" />;
            })}
            {/* Test points */}
            {TEST_PTS.map((p, i) => {
                const [sx, sy] = toSvg(p.x, p.y, ox);
                return <circle key={i} cx={sx} cy={sy} r={4.5} fill="none" stroke="rgba(147,197,253,0.8)" strokeWidth={1.5} />;
            })}
            {/* Curve */}
            <path d={curvePath} fill="none" stroke={curveColor} strokeWidth={2} strokeLinejoin="round" />
            {/* Labels */}
            <text x={ox + PANEL_W / 2} y={PLOT_TOP + PANEL_H + 14} textAnchor="middle"
                fill="rgba(255,255,255,0.5)" fontSize={9} fontFamily="monospace">{label1}</text>
            <text x={ox + PANEL_W / 2} y={PLOT_TOP + PANEL_H + 26} textAnchor="middle"
                fill="rgba(255,255,255,0.3)" fontSize={8} fontFamily="monospace">{check1}</text>
            <text x={ox + PANEL_W / 2} y={PLOT_TOP + PANEL_H + 37} textAnchor="middle"
                fill="rgba(255,255,255,0.3)" fontSize={8} fontFamily="monospace">{check2}</text>
            <text x={ox + PANEL_W / 2} y={PLOT_TOP - 6} textAnchor="middle"
                fill={label2 === "Overfit" ? "rgb(244,63,94)" : "rgb(52,211,153)"} fontSize={9} fontFamily="monospace" fontWeight="bold">{label2}</text>
        </g>
    );
}

export function OverfittingComparisonDiagram() {
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}
            aria-label="Side-by-side comparison: good fit model vs overfit model on the same training data">
            <Panel ox={LEFT_X} color="rgba(52,211,153,0.3)" label1="Train error: Low ✓" label2="Good Fit"
                check1="Generalizes ✓" check2="" curveColor="rgb(52,211,153)" curvePath={goodFitPath(LEFT_X)} />
            <Panel ox={RIGHT_X} color="rgba(244,63,94,0.3)" label1="Train error: Zero ✓" label2="Overfit"
                check1="Fails on new data ✗" check2="" curveColor="rgb(244,63,94)" curvePath={overfitPath(RIGHT_X)} />
            {/* Legend */}
            <circle cx={W / 2 - 55} cy={H - 6} r={3} fill="rgba(255,255,255,0.65)" />
            <text x={W / 2 - 48} y={H - 2} fill="rgba(255,255,255,0.35)" fontSize={8} fontFamily="monospace">Training data</text>
            <circle cx={W / 2 + 20} cy={H - 6} r={4} fill="none" stroke="rgba(147,197,253,0.8)" strokeWidth={1.5} />
            <text x={W / 2 + 28} y={H - 2} fill="rgba(255,255,255,0.35)" fontSize={8} fontFamily="monospace">Test data</text>
        </svg>
    );
}
