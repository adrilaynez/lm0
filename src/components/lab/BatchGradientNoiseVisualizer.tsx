"use client";

import { useMemo,useState } from "react";

const BATCH_SIZES = [1, 4, 16, 32, 128, 256] as const;
type BatchSize = typeof BATCH_SIZES[number];

const W = 480;
const H = 300;
const CX = W / 2;
const CY = H / 2;
const SCALE = 80; // pixels per unit

function gaussian(): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function lossContours(): string[] {
    const paths: string[] = [];
    const levels = [0.2, 0.5, 1.0, 1.8, 3.0, 4.5];
    for (const L of levels) {
        const pts: [number, number][] = [];
        const steps = 120;
        for (let i = 0; i <= steps; i++) {
            const angle = (i / steps) * 2 * Math.PI;
            // L = x² + 2y²  →  ellipse: x = sqrt(L)*cos, y = sqrt(L/2)*sin
            const px = Math.sqrt(L) * Math.cos(angle);
            const py = Math.sqrt(L / 2) * Math.sin(angle);
            const sx = CX + px * SCALE;
            const sy = CY - py * SCALE;
            pts.push([sx, sy]);
        }
        const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + " Z";
        paths.push(d);
    }
    return paths;
}

function arrowPath(ox: number, oy: number, dx: number, dy: number, scale: number): string {
    const ex = ox + dx * scale;
    const ey = oy - dy * scale;
    const len = Math.sqrt(dx * dx + dy * dy) * scale;
    if (len < 1) return "";
    const ux = (ex - ox) / len;
    const uy = (ey - oy) / len;
    const hw = 4;
    const hl = 7;
    const bx = ex - ux * hl;
    const by = ey - uy * hl;
    return `M${ox.toFixed(1)},${oy.toFixed(1)} L${ex.toFixed(1)},${ey.toFixed(1)} M${(bx - uy * hw).toFixed(1)},${(by + ux * hw).toFixed(1)} L${ex.toFixed(1)},${ey.toFixed(1)} L${(bx + uy * hw).toFixed(1)},${(by - ux * hw).toFixed(1)}`;
}

const CONTOUR_PATHS = lossContours();
const EVAL_X = 1.2;
const EVAL_Y = 0.8;
const TRUE_GX = -2 * EVAL_X;
const TRUE_GY = -4 * EVAL_Y;

export function BatchGradientNoiseVisualizer() {
    const [batchSize, setBatchSize] = useState<BatchSize>(16);
    const [seed, setSeed] = useState(0);

    const { gradients, meanGx, meanGy, variance } = useMemo(() => {
        void seed;
        const noiseScale = 1 / Math.sqrt(batchSize);
        const grads: [number, number][] = [];
        for (let i = 0; i < 12; i++) {
            grads.push([
                TRUE_GX + gaussian() * noiseScale * 3,
                TRUE_GY + gaussian() * noiseScale * 3,
            ]);
        }
        const mgx = grads.reduce((s, g) => s + g[0], 0) / grads.length;
        const mgy = grads.reduce((s, g) => s + g[1], 0) / grads.length;
        const vx = grads.reduce((s, g) => s + (g[0] - mgx) ** 2, 0) / grads.length;
        const vy = grads.reduce((s, g) => s + (g[1] - mgy) ** 2, 0) / grads.length;
        return { gradients: grads, meanGx: mgx, meanGy: mgy, variance: ((vx + vy) / 2) };
    }, [batchSize, seed]);

    const ox = CX + EVAL_X * SCALE;
    const oy = CY - EVAL_Y * SCALE;
    const arrowScale = 18;

    return (
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-3">
            <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full"
                style={{ maxHeight: 300 }}
                aria-label="Gradient noise visualizer"
            >
                {/* Contours */}
                {CONTOUR_PATHS.map((d, i) => (
                    <path key={i} d={d} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                ))}

                {/* Axes */}
                <line x1={CX} y1={8} x2={CX} y2={H - 8} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
                <line x1={8} y1={CY} x2={W - 8} y2={CY} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />

                {/* Individual batch gradients */}
                {gradients.map(([gx, gy], i) => (
                    <path
                        key={i}
                        d={arrowPath(ox, oy, gx, gy, arrowScale)}
                        fill="none"
                        stroke="rgba(255,255,255,0.25)"
                        strokeWidth={1}
                        strokeLinecap="round"
                    />
                ))}

                {/* Mean gradient */}
                <path
                    d={arrowPath(ox, oy, meanGx, meanGy, arrowScale)}
                    fill="none"
                    stroke="rgb(52,211,153)"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                />

                {/* Eval point */}
                <circle cx={ox} cy={oy} r={4} fill="rgb(52,211,153)" opacity={0.9} />

                {/* Labels */}
                <text x={CX + 4} y={14} fill="rgba(255,255,255,0.2)" fontSize={9} fontFamily="monospace">w₂</text>
                <text x={W - 20} y={CY - 4} fill="rgba(255,255,255,0.2)" fontSize={9} fontFamily="monospace">w₁</text>
            </svg>

            {/* Controls */}
            <div className="px-1 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-white/30">
                    <span>Batch size: <span className="text-emerald-400">{batchSize}</span></span>
                    <button
                        onClick={() => setSeed(s => s + 1)}
                        className="text-white/20 hover:text-white/50 transition-colors text-[10px] border border-white/10 rounded px-2 py-0.5"
                    >
                        resample
                    </button>
                </div>
                <input
                    type="range"
                    min={0}
                    max={BATCH_SIZES.length - 1}
                    step={1}
                    value={BATCH_SIZES.indexOf(batchSize)}
                    onChange={e => setBatchSize(BATCH_SIZES[+e.target.value])}
                    className="w-full accent-emerald-500"
                    aria-label="Batch size selector"
                />
                <div className="flex justify-between text-[9px] font-mono text-white/20">
                    {BATCH_SIZES.map(b => <span key={b}>{b}</span>)}
                </div>
                <p className="text-[11px] font-mono text-white/30 text-center pt-1">
                    Variance: <span className="text-white/50">{variance.toFixed(3)}</span>
                    <span className="ml-3 text-white/20">— white: batch grads · green: mean</span>
                </p>
            </div>
        </div>
    );
}
