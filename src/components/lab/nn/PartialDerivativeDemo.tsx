"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { Slider } from "@/components/ui/slider";

type Fn = "add" | "multiply";

const FONT = "'SF Mono', 'Cascadia Code', 'Fira Code', monospace";

export function PartialDerivativeDemo() {
    const { t } = useI18n();
    const [fn, setFn] = useState<Fn>("add");
    const [x, setX] = useState(2);
    const [y, setY] = useState(3);

    const z = fn === "add" ? x + y : x * y;
    const dzdx = fn === "add" ? 1 : y;
    const dzdy = fn === "add" ? 1 : x;

    // Nudge preview: what happens if x changes by +0.1?
    const nudge = 0.1;
    const zAfterNudgeX = fn === "add" ? (x + nudge) + y : (x + nudge) * y;
    const deltaZ = +(zAfterNudgeX - z).toFixed(3);

    const maxInfluence = 4;

    function InfluenceBar({ value, color }: { value: number; color: string }) {
        const pct = Math.min(Math.abs(value) / maxInfluence, 1) * 100;
        return (
            <div className="relative h-3 w-full rounded-full bg-white/[0.04] overflow-hidden">
                <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ background: color }}
                    animate={{ width: `${pct}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.02] to-transparent p-6">
            <p className="text-xs font-mono uppercase tracking-widest text-white/30 mb-4">
                {t("neuralNetworkNarrative.howItLearns.partial.title")}
            </p>

            {/* Function toggle */}
            <div className="flex gap-2 mb-5">
                {(["add", "multiply"] as Fn[]).map((id) => (
                    <button
                        key={id}
                        onClick={() => setFn(id)}
                        className={`px-4 py-2 rounded-full text-xs font-mono font-semibold transition-all border flex items-center gap-2 ${fn === id
                            ? "bg-violet-500/15 border-violet-500/30 text-violet-400"
                            : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/60"
                            }`}
                    >
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold bg-white/[0.05]">
                            {id === "add" ? "+" : "×"}
                        </span>
                        z = x {id === "add" ? "+" : "×"} y
                    </button>
                ))}
            </div>

            {/* Visual node diagram */}
            <div className="rounded-xl bg-black/30 border border-white/[0.05] overflow-hidden mb-5">
                <svg viewBox="0 0 340 120" width="100%" height={120} className="block">
                    {/* Connections with influence thickness */}
                    <motion.line
                        x1={70} y1={35} x2={140} y2={60}
                        stroke="rgba(56,189,248,0.5)"
                        animate={{ strokeWidth: Math.max(1, Math.min(Math.abs(dzdx) * 2, 6)) }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                    <motion.line
                        x1={70} y1={85} x2={140} y2={60}
                        stroke="rgba(251,191,36,0.5)"
                        animate={{ strokeWidth: Math.max(1, Math.min(Math.abs(dzdy) * 2, 6)) }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                    <line x1={200} y1={60} x2={260} y2={60} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />

                    {/* Input x */}
                    <circle cx={50} cy={35} r="20" fill="rgba(56,189,248,0.08)" stroke="rgba(56,189,248,0.3)" strokeWidth="1.5" />
                    <text x={50} y={31} textAnchor="middle" fontSize="8" fontFamily={FONT} fill="rgba(56,189,248,0.5)">x</text>
                    <text x={50} y={42} textAnchor="middle" fontSize="13" fontFamily={FONT} fill="rgba(56,189,248,0.9)" fontWeight="700">{x.toFixed(1)}</text>

                    {/* Input y */}
                    <circle cx={50} cy={85} r="20" fill="rgba(251,191,36,0.08)" stroke="rgba(251,191,36,0.3)" strokeWidth="1.5" />
                    <text x={50} y={81} textAnchor="middle" fontSize="8" fontFamily={FONT} fill="rgba(251,191,36,0.5)">y</text>
                    <text x={50} y={92} textAnchor="middle" fontSize="13" fontFamily={FONT} fill="rgba(251,191,36,0.9)" fontWeight="700">{y.toFixed(1)}</text>

                    {/* Operation node */}
                    <circle cx={170} cy={60} r="24" fill="rgba(168,85,247,0.08)" stroke="rgba(168,85,247,0.3)" strokeWidth="2" />
                    <text x={170} y={64} textAnchor="middle" fontSize="18" fontFamily={FONT} fill="rgba(168,85,247,0.8)" fontWeight="700">
                        {fn === "add" ? "+" : "×"}
                    </text>

                    {/* Output z */}
                    <circle cx={280} cy={60} r="24" fill="rgba(52,211,153,0.08)" stroke="rgba(52,211,153,0.3)" strokeWidth="1.5" />
                    <text x={280} y={55} textAnchor="middle" fontSize="8" fontFamily={FONT} fill="rgba(52,211,153,0.5)">z</text>
                    <text x={280} y={69} textAnchor="middle" fontSize="15" fontFamily={FONT} fill="rgba(52,211,153,0.9)" fontWeight="700">{z.toFixed(1)}</text>

                    {/* Influence labels on connections */}
                    <text x={105} y={35} textAnchor="middle" fontSize="9" fontFamily={FONT} fill="rgba(56,189,248,0.7)" fontWeight="700">
                        ∂z/∂x = {dzdx.toFixed(1)}
                    </text>
                    <text x={105} y={95} textAnchor="middle" fontSize="9" fontFamily={FONT} fill="rgba(251,191,36,0.7)" fontWeight="700">
                        ∂z/∂y = {dzdy.toFixed(1)}
                    </text>
                </svg>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="rounded-lg border border-sky-500/15 bg-sky-500/[0.03] px-3 py-2 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-sky-400">x</span>
                        <span className="text-sm font-mono font-bold text-sky-400">{x.toFixed(1)}</span>
                    </div>
                    <Slider min={-3} max={3} step={0.1} value={[x]} onValueChange={([v]) => setX(v)} trackColor="#38bdf8" thumbColor="#38bdf8" />
                </div>
                <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.03] px-3 py-2 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-amber-400">y</span>
                        <span className="text-sm font-mono font-bold text-amber-400">{y.toFixed(1)}</span>
                    </div>
                    <Slider min={-3} max={3} step={0.1} value={[y]} onValueChange={([v]) => setY(v)} trackColor="#fbbf24" thumbColor="#fbbf24" />
                </div>
            </div>

            {/* Influence readout */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg bg-sky-500/[0.04] border border-sky-500/15 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-sky-400/70">∂z/∂x</span>
                        <span className="text-sm font-mono font-bold text-sky-400">{dzdx.toFixed(1)}</span>
                    </div>
                    <InfluenceBar value={dzdx} color="rgba(56,189,248,0.6)" />
                    <p className="text-[10px] text-white/30">
                        {fn === "add"
                            ? "Always 1: changing x by 1 always changes z by 1"
                            : `Equals y (${y.toFixed(1)}): x's effect depends on y`
                        }
                    </p>
                </div>
                <div className="rounded-lg bg-amber-500/[0.04] border border-amber-500/15 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-amber-400/70">∂z/∂y</span>
                        <span className="text-sm font-mono font-bold text-amber-400">{dzdy.toFixed(1)}</span>
                    </div>
                    <InfluenceBar value={dzdy} color="rgba(251,191,36,0.6)" />
                    <p className="text-[10px] text-white/30">
                        {fn === "add"
                            ? "Always 1: changing y by 1 always changes z by 1"
                            : `Equals x (${x.toFixed(1)}): y's effect depends on x`
                        }
                    </p>
                </div>
            </div>

            {/* Live nudge preview */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${fn}-${x}-${y}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3 text-center"
                >
                    <span className="text-[10px] text-white/30">If x increases by {nudge}: </span>
                    <span className="text-xs font-mono text-white/50">
                        z goes from <span className="text-emerald-400 font-bold">{z.toFixed(2)}</span> to <span className="text-emerald-400 font-bold">{zAfterNudgeX.toFixed(2)}</span>
                    </span>
                    <span className="text-xs font-mono text-white/30"> (change: <span className="text-sky-400 font-bold">{deltaZ > 0 ? "+" : ""}{deltaZ}</span>)</span>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
