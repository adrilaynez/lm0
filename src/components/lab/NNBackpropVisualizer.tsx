"use client";

import { useCallback,useMemo, useState } from "react";

import { useI18n } from "@/i18n/context";

const PK = "models.neuralNetworks.sections.playground";

function sigmoid(x: number) { return 1 / (1 + Math.exp(-x)); }

type Step = "idle" | "forward" | "backward" | "update";
const STEP_ORDER: Step[] = ["idle", "forward", "backward", "update"];

const INPUT = 1.0;
const TARGET = 0.8;
const LEARNING_RATE = 1.0;

function computeForward(w: number, b: number) {
    const z = w * INPUT + b;
    const yhat = sigmoid(z);
    const loss = (yhat - TARGET) ** 2;
    return { z, yhat, loss };
}

function computeGradients(yhat: number, z: number) {
    const dLdyhat = 2 * (yhat - TARGET);
    const dyhatdz = yhat * (1 - yhat);
    const dLdz = dLdyhat * dyhatdz;
    const dLdw = dLdz * INPUT;
    const dLdb = dLdz * 1;
    return { dLdyhat, dyhatdz, dLdz, dLdw, dLdb };
}

function NodeCard({ label, expression, value, gradient, highlighted, gradHighlighted }: {
    label: string; expression: string; value: string | null; gradient?: string | null;
    highlighted: boolean; gradHighlighted: boolean;
}) {
    return (
        <div className={`rounded-xl border px-3 py-3 text-center transition-all duration-300 min-w-[100px] ${highlighted ? "border-rose-500/30 bg-rose-500/[0.06]" : gradHighlighted ? "border-amber-500/30 bg-amber-500/[0.06]" : "border-white/[0.06] bg-white/[0.02]"
            }`}>
            <p className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-1">{label}</p>
            <p className="text-[10px] font-mono text-white/40 mb-1.5">{expression}</p>
            <p className={`text-base font-mono font-bold transition-all duration-300 ${value !== null ? (highlighted ? "text-rose-400" : "text-white/60") : "text-white/10"
                }`}>
                {value ?? "—"}
            </p>
            {gradient !== undefined && (
                <p className={`text-[10px] font-mono mt-1.5 transition-all duration-300 ${gradient !== null ? "text-amber-400" : "text-white/10"
                    }`}>
                    ∂L = {gradient ?? "—"}
                </p>
            )}
        </div>
    );
}

export function NNBackpropVisualizer() {
    const { t } = useI18n();
    const [w, setW] = useState(0.5);
    const [b, setB] = useState(-0.2);
    const [step, setStep] = useState<Step>("idle");

    const fwd = useMemo(() => computeForward(w, b), [w, b]);
    const grads = useMemo(() => computeGradients(fwd.yhat, fwd.z), [fwd.yhat, fwd.z]);
    const newW = useMemo(() => w - LEARNING_RATE * grads.dLdw, [w, grads.dLdw]);
    const newB = useMemo(() => b - LEARNING_RATE * grads.dLdb, [b, grads.dLdb]);

    const stepIdx = STEP_ORDER.indexOf(step);
    const showForward = stepIdx >= 1;
    const showGrads = stepIdx >= 2;
    const showUpdate = stepIdx >= 3;

    const handleNext = useCallback(() => {
        if (step === "update") {
            setW(newW);
            setB(newB);
            setStep("forward");
        } else {
            setStep(STEP_ORDER[stepIdx + 1]);
        }
    }, [step, stepIdx, newW, newB]);

    const handleReset = useCallback(() => {
        setW(0.5);
        setB(-0.2);
        setStep("idle");
    }, []);

    const buttonLabels: Record<Step, string> = {
        idle: t(`${PK}.gradients.buttonLabels.idle`),
        forward: t(`${PK}.gradients.buttonLabels.forward`),
        backward: t(`${PK}.gradients.buttonLabels.backward`),
        update: t(`${PK}.gradients.buttonLabels.update`),
    };

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
                        {t(`${PK}.gradients.visualizerTitle`)}
                    </span>
                </div>

                <div className="p-4 sm:p-6">
                    {/* Parameters display */}
                    <div className="flex flex-wrap gap-x-5 gap-y-1 mb-5 text-[11px] font-mono">
                        <span className="text-white/30">x = <span className="text-white/50 font-bold">{INPUT.toFixed(1)}</span></span>
                        <span className="text-white/30">target = <span className="text-white/50 font-bold">{TARGET.toFixed(1)}</span></span>
                        <span className="text-white/30">η = <span className="text-white/50 font-bold">{LEARNING_RATE.toFixed(1)}</span></span>
                        <span className="text-white/30">w = <span className="text-rose-400 font-bold">{w.toFixed(4)}</span></span>
                        <span className="text-white/30">b = <span className="text-rose-400 font-bold">{b.toFixed(4)}</span></span>
                    </div>

                    {/* Computation graph */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        <NodeCard
                            label={t(`${PK}.gradients.linearSumLabel`)}
                            expression="z = w·x + b"
                            value={showForward ? fwd.z.toFixed(4) : null}
                            gradient={showGrads ? grads.dLdz.toFixed(4) : null}
                            highlighted={step === "forward"}
                            gradHighlighted={step === "backward"}
                        />
                        <span className="text-white/15 text-lg shrink-0">→</span>
                        <NodeCard
                            label={t(`${PK}.gradients.predictionLabel`)}
                            expression="ŷ = σ(z)"
                            value={showForward ? fwd.yhat.toFixed(4) : null}
                            gradient={showGrads ? grads.dLdyhat.toFixed(4) : null}
                            highlighted={step === "forward"}
                            gradHighlighted={step === "backward"}
                        />
                        <span className="text-white/15 text-lg shrink-0">→</span>
                        <NodeCard
                            label={t(`${PK}.gradients.lossLabel`)}
                            expression="L = (ŷ−y)²"
                            value={showForward ? fwd.loss.toFixed(6) : null}
                            highlighted={step === "forward"}
                            gradHighlighted={false}
                        />
                    </div>

                    {/* Gradient details */}
                    {showGrads && (
                        <div className="mt-4 rounded-lg bg-amber-500/[0.03] border border-amber-500/[0.1] p-4">
                            <p className="text-[9px] font-mono uppercase tracking-widest text-amber-400/60 mb-2">{t(`${PK}.gradients.chainRuleLabel`)}</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-[11px] font-mono">
                                <span className="text-white/30">∂L/∂ŷ = <span className="text-amber-400 font-bold">{grads.dLdyhat.toFixed(4)}</span></span>
                                <span className="text-white/30">∂ŷ/∂z = <span className="text-amber-400 font-bold">{grads.dyhatdz.toFixed(4)}</span></span>
                                <span className="text-white/30">∂L/∂z = <span className="text-amber-400 font-bold">{grads.dLdz.toFixed(4)}</span></span>
                                <span className="text-white/30">∂L/∂w = <span className="text-amber-400 font-bold">{grads.dLdw.toFixed(4)}</span></span>
                                <span className="text-white/30">∂L/∂b = <span className="text-amber-400 font-bold">{grads.dLdb.toFixed(4)}</span></span>
                            </div>
                        </div>
                    )}

                    {/* Update preview */}
                    {showUpdate && (
                        <div className="mt-3 rounded-lg bg-emerald-500/[0.03] border border-emerald-500/[0.1] p-4">
                            <p className="text-[9px] font-mono uppercase tracking-widest text-emerald-400/60 mb-2">{t(`${PK}.gradients.weightUpdateLabel`)}</p>
                            <div className="space-y-1 text-[11px] font-mono">
                                <p className="text-white/30">
                                    w: {w.toFixed(4)} − {LEARNING_RATE.toFixed(1)} × {grads.dLdw.toFixed(4)} = <span className="text-emerald-400 font-bold">{newW.toFixed(4)}</span>
                                </p>
                                <p className="text-white/30">
                                    b: {b.toFixed(4)} − {LEARNING_RATE.toFixed(1)} × {grads.dLdb.toFixed(4)} = <span className="text-emerald-400 font-bold">{newB.toFixed(4)}</span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step indicator */}
                    <div className="flex items-center gap-1.5 mt-5 mb-4">
                        {STEP_ORDER.map((s, i) => (
                            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= stepIdx ? "bg-rose-500/50" : "bg-white/[0.06]"
                                }`} />
                        ))}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleNext}
                            className="px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-mono font-bold hover:bg-rose-500/20 transition-colors"
                        >
                            {buttonLabels[step]}
                        </button>
                        {step !== "idle" && (
                            <button
                                onClick={handleReset}
                                className="px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/40 text-[11px] font-mono font-bold hover:text-white/60 transition-colors"
                            >
                                {t(`${PK}.gradients.reset`)}
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <figcaption className="mt-3 text-center text-xs text-white/25 italic">
                {t(`${PK}.gradients.caption`)}
            </figcaption>
        </figure>
    );
}
