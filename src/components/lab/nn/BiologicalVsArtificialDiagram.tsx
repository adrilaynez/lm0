"use client";

import { useI18n } from "@/i18n/context";
import { NN_COLORS } from "./visualizer-theme";

/*
  Side-by-side SVG comparison:
  Left:  Biological neuron with labeled parts (dendrites, cell body, axon, synapses)
  Right: Artificial perceptron with labeled parts (inputs, weights, sum, activation, output)
  Arrows mapping biological → artificial equivalents.
*/

export function BiologicalVsArtificialDiagram() {
    const { t } = useI18n();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* BIOLOGICAL NEURON */}
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.02] p-3 space-y-2">
                <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-400/60 text-center">
                    {t("neuralNetworkNarrative.bioVsArtificial.bioTitle")}
                </p>
                <svg viewBox="0 0 240 150" className="w-full block">
                    {/* Dendrites (inputs) */}
                    {[
                        { x1: 10, y1: 30, x2: 70, y2: 60 },
                        { x1: 10, y1: 75, x2: 70, y2: 70 },
                        { x1: 10, y1: 120, x2: 70, y2: 80 },
                    ].map((d, i) => (
                        <g key={i}>
                            {/* Branching dendrite lines */}
                            <line x1={d.x1} y1={d.y1} x2={d.x1 + 15} y2={d.y1 - 5}
                                stroke="rgba(52,211,153,0.3)" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1={d.x1} y1={d.y1} x2={d.x1 + 15} y2={d.y1 + 5}
                                stroke="rgba(52,211,153,0.3)" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2}
                                stroke="rgba(52,211,153,0.5)" strokeWidth="2" strokeLinecap="round" />
                            {/* Synapse dots at tips */}
                            <circle cx={d.x1} cy={d.y1} r="3" fill="rgba(52,211,153,0.4)" />
                        </g>
                    ))}

                    {/* Cell body (soma) */}
                    <ellipse cx="100" cy="72" rx="30" ry="25"
                        fill="rgba(52,211,153,0.08)" stroke="rgba(52,211,153,0.5)" strokeWidth="2" />
                    {/* Nucleus */}
                    <circle cx="100" cy="72" r="10"
                        fill="rgba(52,211,153,0.12)" stroke="rgba(52,211,153,0.3)" strokeWidth="1" />

                    {/* Axon */}
                    <line x1="130" y1="72" x2="200" y2="72"
                        stroke="rgba(52,211,153,0.5)" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Myelin sheath bumps */}
                    {[145, 160, 175].map(x => (
                        <ellipse key={x} cx={x} cy="72" rx="6" ry="8"
                            fill="none" stroke="rgba(52,211,153,0.25)" strokeWidth="1.5" />
                    ))}

                    {/* Axon terminals */}
                    <line x1="200" y1="72" x2="220" y2="60" stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" />
                    <line x1="200" y1="72" x2="220" y2="72" stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" />
                    <line x1="200" y1="72" x2="220" y2="84" stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" />
                    {[60, 72, 84].map(y => (
                        <circle key={y} cx="222" cy={y} r="3" fill="rgba(52,211,153,0.4)" />
                    ))}

                    {/* Labels */}
                    <text x="10" y="14" fill="rgba(52,211,153,0.5)" fontSize="7" fontFamily="monospace">
                        {t("neuralNetworkNarrative.bioVsArtificial.dendrites")}
                    </text>
                    <text x="85" y="103" fill="rgba(52,211,153,0.5)" fontSize="7" fontFamily="monospace" textAnchor="middle">
                        {t("neuralNetworkNarrative.bioVsArtificial.soma")}
                    </text>
                    <text x="165" y="100" fill="rgba(52,211,153,0.5)" fontSize="7" fontFamily="monospace" textAnchor="middle">
                        {t("neuralNetworkNarrative.bioVsArtificial.axon")}
                    </text>
                    <text x="222" y="48" fill="rgba(52,211,153,0.5)" fontSize="7" fontFamily="monospace" textAnchor="middle">
                        {t("neuralNetworkNarrative.bioVsArtificial.terminals")}
                    </text>
                    <text x="10" y="142" fill="rgba(52,211,153,0.5)" fontSize="6" fontFamily="monospace">
                        {t("neuralNetworkNarrative.bioVsArtificial.synapses")}
                    </text>
                </svg>
            </div>

            {/* ARTIFICIAL PERCEPTRON */}
            <div className="rounded-xl border border-rose-500/15 bg-rose-500/[0.02] p-3 space-y-2">
                <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-rose-400/60 text-center">
                    {t("neuralNetworkNarrative.bioVsArtificial.artTitle")}
                </p>
                <svg viewBox="0 0 240 150" className="w-full block">
                    {/* Input nodes */}
                    {[
                        { y: 30, label: "x₁", val: "5" },
                        { y: 75, label: "x₂", val: "7" },
                        { y: 120, label: "x₃", val: "3" },
                    ].map((inp, i) => (
                        <g key={i}>
                            <circle cx="25" cy={inp.y} r="12"
                                fill={NN_COLORS.input.hex + "15"} stroke={NN_COLORS.input.hex + "60"} strokeWidth="1.5" />
                            <text x="25" y={inp.y + 3} textAnchor="middle"
                                fill={NN_COLORS.input.hex} fontSize="8" fontFamily="monospace" fontWeight="bold">
                                {inp.label}
                            </text>
                            {/* Connection line with weight label */}
                            <line x1="37" y1={inp.y} x2="90" y2="72"
                                stroke={NN_COLORS.weight.hex + "40"} strokeWidth="1.5" />
                            <text x={55 + (i === 1 ? 0 : 5)} y={inp.y + (72 - inp.y) * 0.4 - 4} textAnchor="middle"
                                fill={NN_COLORS.weight.hex + "80"} fontSize="6" fontFamily="monospace">
                                w{i + 1}
                            </text>
                        </g>
                    ))}

                    {/* Sum + activation (cell body equivalent) */}
                    <circle cx="110" cy="72" r="22"
                        fill={NN_COLORS.output.hex + "08"} stroke={NN_COLORS.output.hex + "50"} strokeWidth="2" />
                    <text x="110" y="67" textAnchor="middle"
                        fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="monospace">Σ + b</text>
                    <text x="110" y="79" textAnchor="middle"
                        fill="rgba(255,255,255,0.35)" fontSize="6" fontFamily="monospace">→ σ(z)</text>

                    {/* Output arrow */}
                    <line x1="132" y1="72" x2="195" y2="72"
                        stroke={NN_COLORS.output.hex + "60"} strokeWidth="2.5" strokeLinecap="round" />
                    <polygon points="195,66 210,72 195,78" fill={NN_COLORS.output.hex + "60"} />

                    {/* Output node */}
                    <circle cx="220" cy="72" r="12"
                        fill={NN_COLORS.output.hex + "15"} stroke={NN_COLORS.output.hex + "60"} strokeWidth="1.5" />
                    <text x="220" y="75" textAnchor="middle"
                        fill={NN_COLORS.output.hex} fontSize="8" fontFamily="monospace" fontWeight="bold">ŷ</text>

                    {/* Labels */}
                    <text x="25" y="14" fill={NN_COLORS.input.hex + "80"} fontSize="7" fontFamily="monospace" textAnchor="middle">
                        {t("neuralNetworkNarrative.bioVsArtificial.inputs")}
                    </text>
                    <text x="60" y="14" fill={NN_COLORS.weight.hex + "80"} fontSize="7" fontFamily="monospace">
                        {t("neuralNetworkNarrative.bioVsArtificial.weights")}
                    </text>
                    <text x="110" y="103" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="monospace" textAnchor="middle">
                        {t("neuralNetworkNarrative.bioVsArtificial.sumActivation")}
                    </text>
                    <text x="220" y="100" fill={NN_COLORS.output.hex + "80"} fontSize="7" fontFamily="monospace" textAnchor="middle">
                        {t("neuralNetworkNarrative.bioVsArtificial.output")}
                    </text>
                </svg>
            </div>

            {/* Mapping table */}
            <div className="md:col-span-2 rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-white/[0.05] text-[10px] font-mono">
                    <div className="px-3 py-2 text-emerald-400/50 font-bold uppercase tracking-wider bg-emerald-500/[0.02]">
                        {t("neuralNetworkNarrative.bioVsArtificial.bioTitle")}
                    </div>
                    <div className="px-3 py-2 text-rose-400/50 font-bold uppercase tracking-wider bg-rose-500/[0.02]">
                        {t("neuralNetworkNarrative.bioVsArtificial.artTitle")}
                    </div>
                    {(["dendrites", "synapses", "soma", "axon"] as const).map(part => (
                        <div key={part} className="contents">
                            <div className="px-3 py-1.5 text-white/30 border-t border-white/[0.04]">
                                {t(`neuralNetworkNarrative.bioVsArtificial.map.${part}Bio`)}
                            </div>
                            <div className="px-3 py-1.5 text-white/30 border-t border-white/[0.04]">
                                {t(`neuralNetworkNarrative.bioVsArtificial.map.${part}Art`)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
