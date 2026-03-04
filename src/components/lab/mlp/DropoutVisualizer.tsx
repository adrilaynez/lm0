"use client";

import { useCallback, useState } from "react";

import { motion } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";

/*
  DropoutVisualizer
  Network diagram with 8 hidden neurons. Each "training step" randomly
  grays out 2-3 neurons. Toggle dropout on/off to compare.
*/

const INPUT_N = 3;
const HIDDEN_N = 8;
const OUTPUT_N = 4;
const DROPOUT_RATE = 0.3; // ~30% dropped

const W = 340;
const H = 180;

const layerX = [50, 170, 290];
const inputY = (i: number) => 40 + i * ((H - 80) / (INPUT_N - 1));
const hiddenY = (i: number) => 20 + i * ((H - 40) / (HIDDEN_N - 1));
const outputY = (i: number) => 50 + i * ((H - 100) / (OUTPUT_N - 1));

function getY(layer: number, idx: number): number {
    if (layer === 0) return inputY(idx);
    if (layer === 1) return hiddenY(idx);
    return outputY(idx);
}

function randomDroppedSet(): Set<number> {
    const dropped = new Set<number>();
    const count = Math.round(HIDDEN_N * DROPOUT_RATE);
    while (dropped.size < count) {
        dropped.add(Math.floor(Math.random() * HIDDEN_N));
    }
    return dropped;
}

export function DropoutVisualizer() {
    const [dropoutOn, setDropoutOn] = useState(true);
    const [step, setStep] = useState(0);
    const [dropped, setDropped] = useState<Set<number>>(() => randomDroppedSet());
    const [history, setHistory] = useState<number[][]>([]);

    const advance = useCallback(() => {
        const newDropped = randomDroppedSet();
        setDropped(newDropped);
        setStep(s => s + 1);
        setHistory(h => [...h.slice(-4), Array.from(newDropped)]);
    }, []);

    const reset = useCallback(() => {
        setStep(0);
        setDropped(randomDroppedSet());
        setHistory([]);
    }, []);

    const activeColor = "#a78bfa";
    const droppedColor = "#ffffff08";

    return (
        <div className="p-4 sm:p-5 space-y-3">
            {/* Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setDropoutOn(!dropoutOn); reset(); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold border transition-all"
                        style={{
                            backgroundColor: dropoutOn ? "#a78bfa15" : "#ef444415",
                            borderColor: dropoutOn ? "#a78bfa30" : "#ef444430",
                            color: dropoutOn ? "#a78bfa" : "#ef4444",
                        }}
                    >
                        Dropout: {dropoutOn ? "ON" : "OFF"}
                    </button>
                    <span className="text-[8px] font-mono text-white/15">
                        {dropoutOn ? `${(DROPOUT_RATE * 100).toFixed(0)}% neurons silenced each step` : "All neurons active every step"}
                    </span>
                </div>
                <span className="text-[9px] font-mono text-white/20">Step {step}</span>
            </div>

            {/* Network diagram */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                    {/* Connections: input → hidden */}
                    {Array.from({ length: INPUT_N }).map((_, i) =>
                        Array.from({ length: HIDDEN_N }).map((_, j) => {
                            const isDropped = dropoutOn && dropped.has(j);
                            return (
                                <line
                                    key={`ih-${i}-${j}`}
                                    x1={layerX[0] + 10} y1={getY(0, i)}
                                    x2={layerX[1] - 10} y2={getY(1, j)}
                                    stroke={isDropped ? "#ffffff" : activeColor}
                                    strokeOpacity={isDropped ? 0.02 : 0.08}
                                    strokeWidth={0.5}
                                />
                            );
                        })
                    )}

                    {/* Connections: hidden → output */}
                    {Array.from({ length: HIDDEN_N }).map((_, i) =>
                        Array.from({ length: OUTPUT_N }).map((_, j) => {
                            const isDropped = dropoutOn && dropped.has(i);
                            return (
                                <line
                                    key={`ho-${i}-${j}`}
                                    x1={layerX[1] + 10} y1={getY(1, i)}
                                    x2={layerX[2] - 10} y2={getY(2, j)}
                                    stroke={isDropped ? "#ffffff" : activeColor}
                                    strokeOpacity={isDropped ? 0.02 : 0.08}
                                    strokeWidth={0.5}
                                />
                            );
                        })
                    )}

                    {/* Input neurons */}
                    {Array.from({ length: INPUT_N }).map((_, i) => (
                        <circle key={`in-${i}`} cx={layerX[0]} cy={getY(0, i)} r={7}
                            fill={activeColor} fillOpacity={0.15} stroke={activeColor} strokeOpacity={0.3} strokeWidth={1} />
                    ))}

                    {/* Hidden neurons */}
                    {Array.from({ length: HIDDEN_N }).map((_, i) => {
                        const isDropped = dropoutOn && dropped.has(i);
                        return (
                            <motion.circle
                                key={`hid-${i}`}
                                cx={layerX[1]} cy={getY(1, i)} r={7}
                                animate={{
                                    fill: isDropped ? "#333333" : activeColor,
                                    fillOpacity: isDropped ? 0.1 : 0.25,
                                    stroke: isDropped ? "#555555" : activeColor,
                                    strokeOpacity: isDropped ? 0.15 : 0.4,
                                }}
                                strokeWidth={1.5}
                                transition={{ duration: 0.25 }}
                            />
                        );
                    })}

                    {/* X marks on dropped neurons */}
                    {dropoutOn && Array.from(dropped).map(i => (
                        <motion.g key={`x-${i}`} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
                            <line x1={layerX[1] - 3} y1={getY(1, i) - 3} x2={layerX[1] + 3} y2={getY(1, i) + 3} stroke="#ef4444" strokeOpacity={0.5} strokeWidth={1.5} />
                            <line x1={layerX[1] + 3} y1={getY(1, i) - 3} x2={layerX[1] - 3} y2={getY(1, i) + 3} stroke="#ef4444" strokeOpacity={0.5} strokeWidth={1.5} />
                        </motion.g>
                    ))}

                    {/* Output neurons */}
                    {Array.from({ length: OUTPUT_N }).map((_, i) => (
                        <circle key={`out-${i}`} cx={layerX[2]} cy={getY(2, i)} r={7}
                            fill={activeColor} fillOpacity={0.15} stroke={activeColor} strokeOpacity={0.3} strokeWidth={1} />
                    ))}

                    {/* Layer labels */}
                    <text x={layerX[0]} y={H - 3} textAnchor="middle" fontSize={6} fill="white" fillOpacity={0.2} fontFamily="monospace">Input</text>
                    <text x={layerX[1]} y={H - 3} textAnchor="middle" fontSize={6} fill="white" fillOpacity={0.2} fontFamily="monospace">Hidden ({HIDDEN_N})</text>
                    <text x={layerX[2]} y={H - 3} textAnchor="middle" fontSize={6} fill="white" fillOpacity={0.2} fontFamily="monospace">Output</text>
                </svg>
            </div>

            {/* Step button + history */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={advance}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold border transition-colors bg-violet-500/10 border-violet-500/20 text-violet-300 hover:bg-violet-500/20"
                    >
                        <Play className="w-3 h-3" /> Training Step
                    </button>
                    {step > 0 && (
                        <button onClick={reset} className="p-1.5 rounded-lg text-white/20 hover:text-white/40 transition-colors">
                            <RotateCcw className="w-3 h-3" />
                        </button>
                    )}
                </div>

                {/* Mini history */}
                {history.length > 0 && (
                    <div className="flex items-center gap-1">
                        <span className="text-[7px] font-mono text-white/15 mr-1">History:</span>
                        {history.map((droppedList, hi) => (
                            <div key={hi} className="flex gap-px">
                                {Array.from({ length: HIDDEN_N }).map((_, ni) => (
                                    <div
                                        key={ni}
                                        className="w-1.5 h-3 rounded-sm"
                                        style={{
                                            backgroundColor: droppedList.includes(ni) ? "#ef4444" : activeColor,
                                            opacity: droppedList.includes(ni) ? 0.4 : 0.15,
                                        }}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Explanation */}
            <p className="text-[8px] font-mono text-white/20 text-center">
                {dropoutOn
                    ? "Different neurons are silenced each step — the network can't rely on any single neuron, forcing it to learn redundant representations."
                    : "Without dropout, the network may memorize training data by relying too heavily on a few dominant neurons."
                }
            </p>
        </div>
    );
}
