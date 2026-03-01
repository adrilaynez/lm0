"use client";

import { useCallback,useMemo, useState } from "react";

import { useI18n } from "@/i18n/context";

const PK = "models.neuralNetworks.sections.playground";

type ActivationFn = "relu" | "sigmoid" | "tanh";

const FN_MAP: Record<ActivationFn, (x: number) => number> = {
    relu: (x) => Math.max(0, x),
    sigmoid: (x) => 1 / (1 + Math.exp(-x)),
    tanh: (x) => Math.tanh(x),
};

const FN_LABELS: Record<ActivationFn, string> = {
    relu: "ReLU",
    sigmoid: "Sigmoid",
    tanh: "Tanh",
};

const FN_COLORS: Record<ActivationFn, { stroke: string; fill: string; text: string; bg: string; border: string }> = {
    relu: { stroke: "rgb(251,113,133)", fill: "rgba(251,113,133,0.1)", text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30" },
    sigmoid: { stroke: "rgb(129,140,248)", fill: "rgba(129,140,248,0.1)", text: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/30" },
    tanh: { stroke: "rgb(52,211,153)", fill: "rgba(52,211,153,0.1)", text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
};

const FONT = "ui-monospace, SFMono-Regular, Menlo, monospace";

const PLOT = { left: 50, right: 460, top: 20, bottom: 230, xMin: -5, xMax: 5, yMin: -1.5, yMax: 3 };

function toSvgX(wx: number) {
    return PLOT.left + ((wx - PLOT.xMin) / (PLOT.xMax - PLOT.xMin)) * (PLOT.right - PLOT.left);
}
function toSvgY(wy: number) {
    return PLOT.bottom - ((wy - PLOT.yMin) / (PLOT.yMax - PLOT.yMin)) * (PLOT.bottom - PLOT.top);
}

export function NNActivationExplorer() {
    const { t } = useI18n();
    const [selected, setSelected] = useState<ActivationFn>("relu");
    const [zVal, setZVal] = useState(1.5);

    const fn = FN_MAP[selected];
    const colors = FN_COLORS[selected];
    const output = useMemo(() => fn(zVal), [fn, zVal]);

    const curvePath = useMemo(() => {
        const pts: string[] = [];
        for (let i = 0; i <= 300; i++) {
            const wx = PLOT.xMin + (i / 300) * (PLOT.xMax - PLOT.xMin);
            const wy = fn(wx);
            const clampedY = Math.max(PLOT.yMin, Math.min(PLOT.yMax, wy));
            pts.push(`${toSvgX(wx).toFixed(1)},${toSvgY(clampedY).toFixed(1)}`);
        }
        return pts.join(" ");
    }, [fn]);

    const markerX = toSvgX(zVal);
    const clampedOutput = Math.max(PLOT.yMin, Math.min(PLOT.yMax, output));
    const markerY = toSvgY(clampedOutput);

    const handleToggle = useCallback((fn: ActivationFn) => setSelected(fn), []);

    return (
        <figure className="my-10 -mx-2 sm:mx-0">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden shadow-[0_0_60px_-15px_rgba(244,63,94,0.05)]">
                <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                    <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                        {t(`${PK}.activation.explorerTitle`)}
                    </span>
                </div>

                <div className="p-4 sm:p-6">
                    {/* Toggle */}
                    <div className="flex gap-2 mb-5">
                        {(Object.keys(FN_MAP) as ActivationFn[]).map(key => {
                            const c = FN_COLORS[key];
                            const active = selected === key;
                            const label = t(`${PK}.activation.labels.${key}`);
                            return (
                                <button
                                    key={key}
                                    onClick={() => handleToggle(key)}
                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-all ${active
                                            ? `${c.bg} ${c.border} ${c.text}`
                                            : "border-white/[0.06] bg-white/[0.02] text-white/30 hover:text-white/50"
                                        }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    {/* SVG Graph */}
                    <svg viewBox="0 0 500 260" className="w-full mb-4" role="img" aria-label={t(`${PK}.activation.ariaLabel`, { name: t(`${PK}.activation.labels.${selected}`) })}>
                        {/* Grid lines */}
                        {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map(v => (
                            <line key={`gx${v}`} x1={toSvgX(v)} y1={PLOT.top} x2={toSvgX(v)} y2={PLOT.bottom}
                                stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                        ))}
                        {[-1, 0, 1, 2].map(v => (
                            <line key={`gy${v}`} x1={PLOT.left} y1={toSvgY(v)} x2={PLOT.right} y2={toSvgY(v)}
                                stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                        ))}

                        {/* Axes */}
                        <line x1={PLOT.left} y1={toSvgY(0)} x2={PLOT.right} y2={toSvgY(0)} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                        <line x1={toSvgX(0)} y1={PLOT.top} x2={toSvgX(0)} y2={PLOT.bottom} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

                        {/* Axis labels */}
                        <text x={PLOT.right + 8} y={toSvgY(0) + 4} fontSize="9" fontFamily={FONT} fill="rgba(255,255,255,0.2)">z</text>
                        <text x={toSvgX(0) + 5} y={PLOT.top + 5} fontSize="9" fontFamily={FONT} fill="rgba(255,255,255,0.2)">f(z)</text>
                        {[-4, -2, 2, 4].map(v => (
                            <text key={`lx${v}`} x={toSvgX(v)} y={PLOT.bottom + 14} fontSize="8" fontFamily={FONT}
                                fill="rgba(255,255,255,0.15)" textAnchor="middle">{v}</text>
                        ))}
                        {[-1, 1, 2].map(v => (
                            <text key={`ly${v}`} x={PLOT.left - 8} y={toSvgY(v) + 3} fontSize="8" fontFamily={FONT}
                                fill="rgba(255,255,255,0.15)" textAnchor="end">{v}</text>
                        ))}

                        {/* Curve */}
                        <polyline points={curvePath} fill="none" stroke={colors.stroke} strokeWidth="2.5" strokeLinecap="round" />

                        {/* Input z vertical line */}
                        <line x1={markerX} y1={PLOT.bottom} x2={markerX} y2={markerY}
                            stroke={colors.stroke} strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

                        {/* Output horizontal line */}
                        <line x1={toSvgX(0)} y1={markerY} x2={markerX} y2={markerY}
                            stroke={colors.stroke} strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

                        {/* Marker dot */}
                        <circle cx={markerX} cy={markerY} r="6" fill={colors.stroke} stroke="rgba(0,0,0,0.3)" strokeWidth="2" />

                        {/* Value label */}
                        <text x={markerX + 10} y={markerY - 8} fontSize="11" fontFamily={FONT}
                            fill={colors.stroke} fontWeight="700">
                            {output.toFixed(3)}
                        </text>
                    </svg>

                    {/* Z slider + output */}
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                        <label className="flex-1 block">
                            <div className="flex justify-between mb-1">
                                <span className="text-[10px] font-mono text-white/40">{t(`${PK}.activation.inputLabel`)}</span>
                                <span className="text-[11px] font-mono font-bold text-white/60">{zVal.toFixed(2)}</span>
                            </div>
                            <input type="range" min={-5} max={5} step={0.1} value={zVal}
                                onChange={e => setZVal(+e.target.value)}
                                className="w-full cursor-pointer accent-rose-400" />
                        </label>
                        <div className="shrink-0 rounded-lg bg-white/[0.03] border border-white/[0.06] px-4 py-2 text-center">
                            <span className="text-[10px] font-mono text-white/30 block mb-0.5">f(z)</span>
                            <span className={`text-lg font-mono font-bold ${colors.text}`}>{output.toFixed(4)}</span>
                        </div>
                    </div>
                </div>
            </div>
            <figcaption className="mt-3 text-center text-xs text-white/25 italic">
                {t(`${PK}.activation.caption`)}
            </figcaption>
        </figure>
    );
}
