"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useNeuralNet, ACTIVATION_LABELS, ACTIVATION_SHORT, type ActivationFn } from "@/hooks/useNeuralNet";
import { useI18n } from "@/i18n/context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Tab = "perceptron" | "activation" | "gradients" | "training";

const TAB_IDS: Tab[] = ["perceptron", "activation", "gradients", "training"];

const FONT = "ui-monospace, SFMono-Regular, Menlo, monospace";
const PLAYGROUND_KEY = "models.neuralNetworks.sections.playground";

const PL = { l: 40, r: 360, t: 15, b: 185, xMin: -5, xMax: 5, yMin: -1.5, yMax: 2 };
function sx(wx: number) { return PL.l + ((wx - PL.xMin) / (PL.xMax - PL.xMin)) * (PL.r - PL.l); }
function sy(wy: number) { return PL.b - ((wy - PL.yMin) / (PL.yMax - PL.yMin)) * (PL.b - PL.t); }

const ACT_COLOR: Record<ActivationFn, string> = {
    linear: "rgb(255,255,255)",
    relu: "rgb(251,113,133)",
    sigmoid: "rgb(129,140,248)",
    tanh: "rgb(52,211,153)",
};
const ACT_TEXT: Record<ActivationFn, string> = {
    linear: "text-white/60",
    relu: "text-rose-400",
    sigmoid: "text-indigo-400",
    tanh: "text-emerald-400",
};

function Explained({ i18nKey, children, className }: { i18nKey: string; children: React.ReactNode; className?: string }) {
    const { t } = useI18n();
    const titleKey = `${i18nKey}.title`;
    const descKey = `${i18nKey}.desc`;
    const title = t(titleKey);
    const desc = t(descKey);
    const direct = t(i18nKey);
    const hasStructured = title !== titleKey || desc !== descKey;
    const tooltipTitle = hasStructured ? title : undefined;
    const tooltipDesc = hasStructured ? desc : direct;

    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild className={cn("cursor-default", className)}>
                    {children}
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[280px] bg-zinc-950 border-white/10 text-white/80 p-3">
                    {tooltipTitle && (
                        <p className="text-[11px] font-semibold text-white/90 mb-1.5">{tooltipTitle}</p>
                    )}
                    <p className="text-xs leading-relaxed">{tooltipDesc}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

function ExplainedText({
    tooltip,
    children,
    side = "top",
}: {
    tooltip: string;
    children: React.ReactNode;
    side?: "top" | "right" | "bottom" | "left";
}) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="cursor-help">{children}</span>
                </TooltipTrigger>
                <TooltipContent side={side} className="max-w-[280px] bg-zinc-950 border-white/10 text-white/80 p-3">
                    <p className="text-xs leading-relaxed">{tooltip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

function Slider({ label, value, min, max, step, onChange, accent = "rose", tooltipKey }: {
    label: string; value: number; min: number; max: number; step: number;
    onChange: (v: number) => void; accent?: string; tooltipKey?: string;
}) {
    const cls: Record<string, string> = {
        rose: "accent-rose-400", amber: "accent-amber-400",
        white: "accent-white", emerald: "accent-emerald-400",
        indigo: "accent-indigo-400",
    };
    return (
        <label className="block group">
            <div className="flex justify-between mb-0.5">
                {tooltipKey ? (
                    <Explained i18nKey={tooltipKey}>
                        <span className="text-[9px] font-mono text-white/40 group-hover:text-white/70 transition-colors border-b border-dashed border-transparent hover:border-white/30">{label}</span>
                    </Explained>
                ) : (
                    <span className="text-[9px] font-mono text-white/40">{label}</span>
                )}
                <span className="text-[10px] font-mono font-bold text-white/60">{value.toFixed(2)}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
                onChange={e => onChange(+e.target.value)}
                className={`w-full cursor-pointer ${cls[accent] || cls.rose}`} />
        </label>
    );
}

export function NNPlayground() {
    const nn = useNeuralNet();
    const { t } = useI18n();
    const [tab, setTab] = useState<Tab>("perceptron");
    const scrollRef = useRef<HTMLDivElement>(null);

    const curvePath = useMemo(() => {
        const pts: string[] = [];
        for (let i = 0; i <= 200; i++) {
            const wx = PL.xMin + (i / 200) * (PL.xMax - PL.xMin);
            const wy = nn.activationFn(wx);
            const cy = Math.max(PL.yMin, Math.min(PL.yMax, wy));
            pts.push(`${sx(wx).toFixed(1)},${sy(cy).toFixed(1)}`);
        }
        return pts.join(" ");
    }, [nn.activationFn]);

    const maxLoss = useMemo(
        () => Math.max(...nn.history.map(h => h.loss), nn.loss, 0.001),
        [nn.history, nn.loss],
    );

    const scrollToBottom = useCallback(() => {
        setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
    }, []);

    const handleTrainStep = useCallback(() => {
        nn.trainStep();
        scrollToBottom();
    }, [nn, scrollToBottom]);

    const handleAutoTrain = useCallback(() => {
        nn.autoTrain(10);
        scrollToBottom();
    }, [nn, scrollToBottom]);

    return (
        <div className="flex flex-col lg:flex-row gap-5">
            {/* ═══ SIDEBAR ═══ */}
            <aside className="shrink-0 w-full lg:w-56">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-4">
                    <div>
                        <Explained i18nKey={`${PLAYGROUND_KEY}.inputs`}>
                            <p className="inline-block text-[9px] font-mono uppercase tracking-widest text-white/25 mb-2.5 hover:text-white/50 transition-colors border-b border-dashed border-transparent hover:border-white/30">{t(`${PLAYGROUND_KEY}.inputs.title`)}</p>
                        </Explained>
                        <div className="space-y-2">
                            <Slider label="x₁" value={nn.x1} min={-2} max={2} step={0.1} onChange={nn.setX1} accent="white" tooltipKey={`${PLAYGROUND_KEY}.inputs.x1`} />
                            <Slider label="x₂" value={nn.x2} min={-2} max={2} step={0.1} onChange={nn.setX2} accent="white" tooltipKey={`${PLAYGROUND_KEY}.inputs.x2`} />
                        </div>
                    </div>

                    <div className="border-t border-white/[0.06]" />

                    <div>
                        <Explained i18nKey={`${PLAYGROUND_KEY}.weights`}>
                            <p className="inline-block text-[9px] font-mono uppercase tracking-widest text-white/25 mb-2.5 hover:text-white/50 transition-colors border-b border-dashed border-transparent hover:border-white/30">{t(`${PLAYGROUND_KEY}.weights.title`)}</p>
                        </Explained>
                        <div className="space-y-2">
                            <Slider label="w₁" value={nn.w1} min={-3} max={3} step={0.05} onChange={nn.setW1} accent="rose" tooltipKey={`${PLAYGROUND_KEY}.weights.w1`} />
                            <Slider label="w₂" value={nn.w2} min={-3} max={3} step={0.05} onChange={nn.setW2} accent="rose" tooltipKey={`${PLAYGROUND_KEY}.weights.w2`} />
                            <Slider label="bias" value={nn.b} min={-3} max={3} step={0.05} onChange={nn.setB} accent="amber" tooltipKey={`${PLAYGROUND_KEY}.weights.bias`} />
                        </div>
                    </div>

                    <div className="border-t border-white/[0.06]" />

                    <div>
                        <Explained i18nKey={`${PLAYGROUND_KEY}.activation`}>
                            <p className="inline-block text-[9px] font-mono uppercase tracking-widest text-white/25 mb-2 hover:text-white/50 transition-colors border-b border-dashed border-transparent hover:border-white/30">{t(`${PLAYGROUND_KEY}.activation.title`)}</p>
                        </Explained>
                        <div className="grid grid-cols-2 gap-1.5">
                            {(Object.keys(ACTIVATION_LABELS) as ActivationFn[]).map(key => (
                                <TooltipProvider key={key}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => nn.setActivation(key)}
                                                className={`px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all ${nn.activation === key
                                                    ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                                                    : "border-white/[0.06] bg-white/[0.02] text-white/30 hover:text-white/50"
                                                    }`}
                                            >
                                                {ACTIVATION_LABELS[key]}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="max-w-[250px] bg-zinc-950 border-white/10 text-white/80 p-3">
                                            <p className="text-xs">{t(`${PLAYGROUND_KEY}.activation.${key}`)}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-white/[0.06]" />

                    <div>
                        <Explained i18nKey={`${PLAYGROUND_KEY}.training`}>
                            <p className="inline-block text-[9px] font-mono uppercase tracking-widest text-white/25 mb-2.5 hover:text-white/50 transition-colors border-b border-dashed border-transparent hover:border-white/30">{t(`${PLAYGROUND_KEY}.training.title`)}</p>
                        </Explained>
                        <p className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-2">Model Setup</p>
                        <div className="grid grid-cols-2 gap-4">
                            <Slider label="target" value={nn.target} min={-1} max={2} step={0.05} onChange={nn.setTarget} accent="emerald" tooltipKey={`${PLAYGROUND_KEY}.training.target`} />
                            <Slider label="η (learn rate)" value={nn.learningRate} min={0.01} max={2} step={0.01} onChange={nn.setLearningRate} accent="indigo" tooltipKey={`${PLAYGROUND_KEY}.training.learningRate`} />
                        </div>

                        <div className="mt-3 flex gap-2">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={handleTrainStep}
                                            className="flex-1 px-2 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-mono font-bold hover:bg-rose-500/20 transition-colors"
                                        >
                                            {t(`${PLAYGROUND_KEY}.buttons.trainStep`)}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="max-w-[250px] bg-zinc-950 border-white/10 text-white/80 p-3">
                                        <p className="text-xs">{t(`${PLAYGROUND_KEY}.training.step`)}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={handleAutoTrain}
                                            className="flex-1 px-2 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono font-bold hover:bg-indigo-500/20 transition-colors"
                                        >
                                            {t(`${PLAYGROUND_KEY}.buttons.autoTrain`)}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="max-w-[250px] bg-zinc-950 border-white/10 text-white/80 p-3">
                                        <p className="text-xs">{t(`${PLAYGROUND_KEY}.training.auto`)}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={nn.reset}
                                            className="flex-1 px-2 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/40 text-[10px] font-mono font-bold hover:text-white/60 transition-colors"
                                        >
                                            {t(`${PLAYGROUND_KEY}.buttons.reset`)}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="max-w-[250px] bg-zinc-950 border-white/10 text-white/80 p-3">
                                        <p className="text-xs">{t(`${PLAYGROUND_KEY}.training.reset`)}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={nn.randomize}
                                            className="flex-1 px-2 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/40 text-[10px] font-mono font-bold hover:text-white/60 transition-colors"
                                        >
                                            {t(`${PLAYGROUND_KEY}.buttons.random`)}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="max-w-[250px] bg-zinc-950 border-white/10 text-white/80 p-3">
                                        <p className="text-xs">{t(`${PLAYGROUND_KEY}.training.random`)}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-white/35">
                            <span>
                                steps: <span className="text-white/60 font-bold">{nn.history.length}</span>
                            </span>
                            <span>
                                loss: <span className="text-amber-400 font-bold">{nn.loss.toFixed(6)}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ═══ MAIN ═══ */}
            <div className="flex-1 min-w-0 space-y-4">
                {/* ─── Live Output ─── */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-mono">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="text-white/30 cursor-help border-b border-dashed border-white/10 hover:border-white/30">z = <span className="text-white/60 font-bold">{nn.z.toFixed(4)}</span></span>
                                </TooltipTrigger>
                                <TooltipContent className="bg-zinc-950 border-white/10 text-white/80">{t(`${PLAYGROUND_KEY}.visualization.sum`)}</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="text-white/30 cursor-help border-b border-dashed border-white/10 hover:border-white/30">ŷ = <span className={`font-bold ${ACT_TEXT[nn.activation]}`}>{nn.prediction.toFixed(4)}</span></span>
                                </TooltipTrigger>
                                <TooltipContent className="bg-zinc-950 border-white/10 text-white/80">{t(`${PLAYGROUND_KEY}.visualization.output`)}</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <span className="text-white/30">
                            <ExplainedText tooltip={t(`${PLAYGROUND_KEY}.training.target`)}>
                                target = <span className="text-emerald-400 font-bold">{nn.target.toFixed(2)}</span>
                            </ExplainedText>
                        </span>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="text-white/30 cursor-help border-b border-dashed border-white/10 hover:border-white/30">loss = <span className="text-amber-400 font-bold">{nn.loss.toFixed(6)}</span></span>
                                </TooltipTrigger>
                                <TooltipContent className="bg-zinc-950 border-white/10 text-white/80">{t(`${PLAYGROUND_KEY}.visualization.loss`)}</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {nn.history.length > 0 && (
                            <span className="text-white/30">
                                <ExplainedText tooltip={t(`${PLAYGROUND_KEY}.training.steps`)}>
                                    steps = <span className="text-white/60 font-bold">{nn.history.length}</span>
                                </ExplainedText>
                            </span>
                        )}
                    </div>
                </div>

                {/* ─── Tabs ─── */}
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                    <div className="flex border-b border-white/[0.06] overflow-x-auto">
                        {TAB_IDS.map(id => (
                            <TooltipProvider key={id}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => setTab(id)}
                                            className={`px-4 py-2.5 text-[10px] font-mono font-bold border-b-2 transition-all whitespace-nowrap ${tab === id
                                                ? "border-rose-400 text-rose-400 bg-rose-500/[0.04]"
                                                : "border-transparent text-white/30 hover:text-white/50"
                                                }`}
                                        >
                                            {t(`${PLAYGROUND_KEY}.tabLabels.${id}`)}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[250px] bg-zinc-950 border-white/10 text-white/80 p-3">
                                        <p className="text-xs leading-relaxed">{t(`${PLAYGROUND_KEY}.tabs.${id}`)}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                    </div>

                    <div className="p-4 sm:p-5">
                        {tab === "perceptron" && (
                            <PerceptronView
                                x1={nn.x1} x2={nn.x2} w1={nn.w1} w2={nn.w2} b={nn.b}
                                z={nn.z} prediction={nn.prediction}
                                activationLabel={ACTIVATION_SHORT[nn.activation]}
                            />
                        )}
                        {tab === "activation" && (
                            <ActivationView
                                z={nn.z} prediction={nn.prediction}
                                curvePath={curvePath}
                                activation={nn.activation}
                            />
                        )}
                        {tab === "gradients" && (
                            <GradientsView
                                w1={nn.w1} w2={nn.w2} b={nn.b} z={nn.z}
                                prediction={nn.prediction} loss={nn.loss}
                                gradients={nn.gradients} learningRate={nn.learningRate}
                                activation={nn.activation}
                            />
                        )}
                        {tab === "training" && (
                            <TrainingView
                                history={nn.history} maxLoss={maxLoss}
                                scrollRef={scrollRef}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ────────────────────────────────────────────── */
/*  PERCEPTRON TAB                                */
/* ────────────────────────────────────────────── */

function PerceptronView({ x1, x2, w1, w2, b, z, prediction, activationLabel }: {
    x1: number; x2: number; w1: number; w2: number; b: number;
    z: number; prediction: number; activationLabel: string;
}) {
    const { t } = useI18n();
    return (
        <>
            <svg viewBox="0 0 640 245" className="w-full" role="img" aria-label="Perceptron flow diagram">
                <line x1="86" y1="70" x2="250" y2="116" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
                <line x1="86" y1="180" x2="250" y2="134" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
                <line x1="317" y1="125" x2="385" y2="125" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
                <line x1="460" y1="125" x2="531" y2="125" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
                <line x1="285" y1="207" x2="285" y2="158" stroke="rgba(251,191,36,0.2)" strokeWidth="1.5" strokeDasharray="4 3" />

                <polygon points="253,116 245,111 245,121" fill="rgba(255,255,255,0.08)" />
                <polygon points="253,134 245,129 245,139" fill="rgba(255,255,255,0.08)" />
                <polygon points="388,125 380,120 380,130" fill="rgba(255,255,255,0.08)" />
                <polygon points="534,125 526,120 526,130" fill="rgba(255,255,255,0.08)" />
                <polygon points="285,158 280,166 290,166" fill="rgba(251,191,36,0.15)" />

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <text x="160" y="82" textAnchor="middle" fontSize="10" fontFamily={FONT} fill="rgb(251,113,133)" fontWeight="600" className="cursor-help">w₁ = {w1.toFixed(2)}</text>
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-950 border-white/10 text-white/80">{t(`${PLAYGROUND_KEY}.weights.w1`)}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <text x="160" y="166" textAnchor="middle" fontSize="10" fontFamily={FONT} fill="rgb(251,113,133)" fontWeight="600" className="cursor-help">w₂ = {w2.toFixed(2)}</text>
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-950 border-white/10 text-white/80">{t(`${PLAYGROUND_KEY}.weights.w2`)}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <circle cx="60" cy="70" r="26" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <text x="60" y="63" textAnchor="middle" fontSize="9" fontFamily={FONT} fill="rgba(255,255,255,0.3)" className="cursor-help">x₁</text>
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-950 border-white/10 text-white/80">{t(`${PLAYGROUND_KEY}.inputs.x1`)}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <text x="60" y="79" textAnchor="middle" fontSize="14" fontFamily={FONT} fill="rgba(255,255,255,0.7)" fontWeight="700">{x1.toFixed(1)}</text>

                <circle cx="60" cy="180" r="26" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <text x="60" y="173" textAnchor="middle" fontSize="9" fontFamily={FONT} fill="rgba(255,255,255,0.3)" className="cursor-help">x₂</text>
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-950 border-white/10 text-white/80">{t(`${PLAYGROUND_KEY}.inputs.x2`)}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <text x="60" y="189" textAnchor="middle" fontSize="14" fontFamily={FONT} fill="rgba(255,255,255,0.7)" fontWeight="700">{x2.toFixed(1)}</text>

                <circle cx="285" cy="125" r="32" fill="rgba(251,113,133,0.04)" stroke="rgba(251,113,133,0.2)" strokeWidth="1.5" />
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <text x="285" y="118" textAnchor="middle" fontSize="9" fontFamily={FONT} fill="rgba(255,255,255,0.3)" className="cursor-help">Σ + b</text>
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-950 border-white/10 text-white/80">{t(`${PLAYGROUND_KEY}.visualization.sum`)}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <text x="285" y="136" textAnchor="middle" fontSize="14" fontFamily={FONT} fill="rgb(251,113,133)" fontWeight="700">{z.toFixed(2)}</text>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <text x="285" y="228" textAnchor="middle" fontSize="10" fontFamily={FONT} fill="rgba(251,191,36,0.6)" fontWeight="600" className="cursor-help">b = {b.toFixed(2)}</text>
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-950 border-white/10 text-white/80">{t(`${PLAYGROUND_KEY}.weights.bias`)}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <rect x="388" y="97" width="72" height="56" rx="10" fill="rgba(129,140,248,0.04)" stroke="rgba(129,140,248,0.2)" strokeWidth="1.5" />
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <text x="424" y="118" textAnchor="middle" fontSize="9" fontFamily={FONT} fill="rgba(255,255,255,0.3)" className="cursor-help">{activationLabel}</text>
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-950 border-white/10 text-white/80">{t(`${PLAYGROUND_KEY}.visualization.activationNode`)}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <text x="424" y="136" textAnchor="middle" fontSize="14" fontFamily={FONT} fill="rgb(129,140,248)" fontWeight="700">{prediction.toFixed(2)}</text>

                <circle cx="560" cy="125" r="26" fill="rgba(52,211,153,0.04)" stroke="rgba(52,211,153,0.2)" strokeWidth="1.5" />
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <text x="560" y="118" textAnchor="middle" fontSize="9" fontFamily={FONT} fill="rgba(255,255,255,0.3)" className="cursor-help">output</text>
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-950 border-white/10 text-white/80">{t(`${PLAYGROUND_KEY}.visualization.output`)}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <text x="560" y="136" textAnchor="middle" fontSize="14" fontFamily={FONT} fill="rgb(52,211,153)" fontWeight="700">{prediction.toFixed(2)}</text>
            </svg>

            <div className="mt-3 rounded-lg bg-white/[0.03] border border-white/[0.06] px-4 py-2.5 text-center overflow-x-auto">
                <span className="text-[11px] font-mono text-white/30 whitespace-nowrap">
                    <ExplainedText tooltip={t(`${PLAYGROUND_KEY}.visualization.equation`)}>
                        z = ({w1.toFixed(2)} × {x1.toFixed(1)}) + ({w2.toFixed(2)} × {x2.toFixed(1)}) + {b.toFixed(2)} ={" "}
                    </ExplainedText>
                    <span className="text-rose-400 font-bold">{z.toFixed(3)}</span>
                    {" → "}{activationLabel}{" → "}
                    <span className="text-emerald-400 font-bold">{prediction.toFixed(3)}</span>
                </span>
            </div>
        </>
    );
}

/* ────────────────────────────────────────────── */
/*  ACTIVATION TAB                                */
/* ────────────────────────────────────────────── */

function ActivationView({ z, prediction, curvePath, activation }: {
    z: number; prediction: number; curvePath: string; activation: ActivationFn;
}) {
    const clampedZ = Math.max(PL.xMin, Math.min(PL.xMax, z));
    const clampedP = Math.max(PL.yMin, Math.min(PL.yMax, prediction));
    const mx = sx(clampedZ);
    const my = sy(clampedP);
    const c = ACT_COLOR[activation];

    const { t } = useI18n();
    return (
        <div>
            <svg viewBox="0 0 400 210" className="w-full mb-3" role="img" aria-label={`${ACTIVATION_LABELS[activation]} activation function`}>
                {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map(v => (
                    <line key={`gx${v}`} x1={sx(v)} y1={PL.t} x2={sx(v)} y2={PL.b} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                ))}
                {[-1, 0, 1].map(v => (
                    <line key={`gy${v}`} x1={PL.l} y1={sy(v)} x2={PL.r} y2={sy(v)} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                ))}
                <line x1={PL.l} y1={sy(0)} x2={PL.r} y2={sy(0)} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                <line x1={sx(0)} y1={PL.t} x2={sx(0)} y2={PL.b} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                <text x={PL.r + 6} y={sy(0) + 4} fontSize="9" fontFamily={FONT} fill="rgba(255,255,255,0.2)">z</text>
                <text x={sx(0) + 5} y={PL.t + 5} fontSize="9" fontFamily={FONT} fill="rgba(255,255,255,0.2)">f(z)</text>
                {[-4, -2, 2, 4].map(v => (
                    <text key={`lx${v}`} x={sx(v)} y={PL.b + 14} fontSize="8" fontFamily={FONT} fill="rgba(255,255,255,0.15)" textAnchor="middle">{v}</text>
                ))}
                {[-1, 1].map(v => (
                    <text key={`ly${v}`} x={PL.l - 8} y={sy(v) + 3} fontSize="8" fontFamily={FONT} fill="rgba(255,255,255,0.15)" textAnchor="end">{v}</text>
                ))}
                <polyline points={curvePath} fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
                <line x1={mx} y1={PL.b} x2={mx} y2={my} stroke={c} strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                <line x1={sx(0)} y1={my} x2={mx} y2={my} stroke={c} strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                <circle cx={mx} cy={my} r="5" fill={c} stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
                <text x={mx + 8} y={my - 6} fontSize="10" fontFamily={FONT} fill={c} fontWeight="700">{prediction.toFixed(3)}</text>
            </svg>
            <div className="text-center text-[11px] font-mono text-white/30">
                <ExplainedText tooltip={t(`${PLAYGROUND_KEY}.visualization.activationCurve`)}>
                    {ACTIVATION_LABELS[activation]}(<span className="text-white/50">{z.toFixed(3)}</span>) =
                </ExplainedText>{" "}
                <span className={`font-bold ${ACT_TEXT[activation]}`}>{prediction.toFixed(4)}</span>
            </div>
        </div>
    );
}

/* ────────────────────────────────────────────── */
/*  GRADIENTS TAB                                 */
/* ────────────────────────────────────────────── */

function GradientsView({ w1, w2, b, z, prediction, loss, gradients, learningRate, activation }: {
    w1: number; w2: number; b: number; z: number;
    prediction: number; loss: number;
    gradients: { dLdpred: number; dpredDz: number; dLdz: number; dLdw1: number; dLdw2: number; dLdb: number };
    learningRate: number; activation: ActivationFn;
}) {
    const g = gradients;
    const nw1 = w1 - learningRate * g.dLdw1;
    const nw2 = w2 - learningRate * g.dLdw2;
    const nb = b - learningRate * g.dLdb;

    const { t } = useI18n();
    return (
        <div className="space-y-5">
            <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-2.5">
                    <ExplainedText tooltip={t(`${PLAYGROUND_KEY}.gradients.forwardPass`)}>{t(`${PLAYGROUND_KEY}.gradients.forwardPassLabel`)}</ExplainedText>
                </p>
                <div className="grid grid-cols-3 gap-3">
                    <ValueCard label={t(`${PLAYGROUND_KEY}.gradients.linearSumLabel`)} expr="z = w₁x₁ + w₂x₂ + b" value={z.toFixed(4)} color="text-white/60" helpKey={`${PLAYGROUND_KEY}.gradients.linearSum`} />
                    <ValueCard label={t(`${PLAYGROUND_KEY}.gradients.predictionLabel`)} expr={`ŷ = ${ACTIVATION_SHORT[activation]}(z)`} value={prediction.toFixed(4)} color="text-rose-400" helpKey={`${PLAYGROUND_KEY}.gradients.prediction`} />
                    <ValueCard label={t(`${PLAYGROUND_KEY}.gradients.lossLabel`)} expr="L = (ŷ − target)²" value={loss.toFixed(6)} color="text-amber-400" helpKey={`${PLAYGROUND_KEY}.gradients.loss`} />
                </div>
            </div>

            <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-amber-400/60 mb-2">
                    <ExplainedText tooltip={t(`${PLAYGROUND_KEY}.gradients.chainRule`)}>{t(`${PLAYGROUND_KEY}.gradients.chainRuleLabel`)}</ExplainedText>
                </p>
                <div className="rounded-lg bg-amber-500/[0.03] border border-amber-500/[0.1] p-3.5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-[11px] font-mono">
                        <span className="text-white/30">∂L/∂ŷ = <span className="text-amber-400 font-bold">{g.dLdpred.toFixed(4)}</span></span>
                        <span className="text-white/30">∂ŷ/∂z = <span className="text-amber-400 font-bold">{g.dpredDz.toFixed(4)}</span></span>
                        <span className="text-white/30">∂L/∂z = <span className="text-amber-400 font-bold">{g.dLdz.toFixed(4)}</span></span>
                        <span className="text-white/30">∂L/∂w₁ = <span className="text-amber-400 font-bold">{g.dLdw1.toFixed(4)}</span></span>
                        <span className="text-white/30">∂L/∂w₂ = <span className="text-amber-400 font-bold">{g.dLdw2.toFixed(4)}</span></span>
                        <span className="text-white/30">∂L/∂b = <span className="text-amber-400 font-bold">{g.dLdb.toFixed(4)}</span></span>
                    </div>
                </div>
            </div>

            <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-emerald-400/60 mb-2">
                    <ExplainedText tooltip={t(`${PLAYGROUND_KEY}.gradients.weightUpdate`)}>{t(`${PLAYGROUND_KEY}.gradients.weightUpdateLabel`)}</ExplainedText>
                </p>
                <div className="rounded-lg bg-emerald-500/[0.03] border border-emerald-500/[0.1] p-3.5 space-y-1.5 text-[11px] font-mono">
                    <p className="text-white/30">
                        w₁: {w1.toFixed(4)} − {learningRate.toFixed(2)} × {g.dLdw1.toFixed(4)} = <span className="text-emerald-400 font-bold">{nw1.toFixed(4)}</span>
                    </p>
                    <p className="text-white/30">
                        w₂: {w2.toFixed(4)} − {learningRate.toFixed(2)} × {g.dLdw2.toFixed(4)} = <span className="text-emerald-400 font-bold">{nw2.toFixed(4)}</span>
                    </p>
                    <p className="text-white/30">
                        b: {b.toFixed(4)} − {learningRate.toFixed(2)} × {g.dLdb.toFixed(4)} = <span className="text-emerald-400 font-bold">{nb.toFixed(4)}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}

function ValueCard({ label, expr, value, color, helpKey }: { label: string; expr: string; value: string; color: string; helpKey: string }) {
    const { t } = useI18n();
    return (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-center">
            <p className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-0.5">
                <ExplainedText tooltip={t(helpKey)}>{label}</ExplainedText>
            </p>
            <p className="text-[10px] font-mono text-white/40 mb-1">{expr}</p>
            <p className={`text-base font-mono font-bold ${color}`}>{value}</p>
        </div>
    );
}

/* ────────────────────────────────────────────── */
/*  TRAINING TAB                                  */
/* ────────────────────────────────────────────── */

function TrainingView({ history, maxLoss, scrollRef }: {
    history: { step: number; w1: number; w2: number; b: number; prediction: number; loss: number }[];
    maxLoss: number;
    scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
    const { t } = useI18n(); // Need t here too

    if (history.length === 0) {
        return (
            <div className="py-16 text-center">
                <p className="text-sm text-white/25 font-mono">{t(`${PLAYGROUND_KEY}.training.noData`)}</p>
                <p className="text-[11px] text-white/15 font-mono mt-1.5">
                    {t(`${PLAYGROUND_KEY}.training.noDataHint`)}
                </p>
            </div>
        );
    }

    const latest = history[history.length - 1];

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap gap-3">
                <StatBadge label="Steps" value={latest.step.toString()} helpKey={`${PLAYGROUND_KEY}.training.steps`} />
                <StatBadge label="Loss" value={latest.loss.toFixed(6)} color="text-amber-400" helpKey={`${PLAYGROUND_KEY}.visualization.loss`} />
                <StatBadge label="w₁" value={latest.w1.toFixed(4)} color="text-rose-400" helpKey={`${PLAYGROUND_KEY}.weights.w1`} />
                <StatBadge label="w₂" value={latest.w2.toFixed(4)} color="text-rose-400" helpKey={`${PLAYGROUND_KEY}.weights.w2`} />
                <StatBadge label="b" value={latest.b.toFixed(4)} color="text-amber-400" helpKey={`${PLAYGROUND_KEY}.weights.bias`} />
            </div>

            <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-2">
                    <ExplainedText tooltip={t(`${PLAYGROUND_KEY}.visualization.lossCurve`)}>{t(`${PLAYGROUND_KEY}.visualization.lossCurveLabel`)}</ExplainedText>
                </p>
                <div className="flex items-end gap-px h-16 bg-white/[0.02] rounded-lg border border-white/[0.04] px-1 py-1 overflow-hidden">
                    {history.slice(-60).map((h, i) => (
                        <div
                            key={i}
                            className="flex-1 min-w-[2px] max-w-[6px] bg-rose-500/50 rounded-sm transition-all duration-100"
                            style={{ height: `${Math.max((h.loss / maxLoss) * 100, 2)}%` }}
                        />
                    ))}
                </div>
            </div>

            <div ref={scrollRef} className="max-h-48 overflow-y-auto rounded-lg border border-white/[0.06]">
                <table className="w-full text-[10px] font-mono">
                    <thead>
                        <tr className="border-b border-white/[0.06] bg-white/[0.02] sticky top-0">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <th className="px-3 py-2 text-left text-white/30 font-bold cursor-help">#</th>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-zinc-950 border-white/10 text-white/80">{t(`${PLAYGROUND_KEY}.training.stepIndex`)}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <th className="px-3 py-2 text-right text-white/30 font-bold cursor-help border-b border-dashed border-white/10 hover:border-white/30">w₁</th>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-zinc-950 border-white/10 text-white/80">{t(`${PLAYGROUND_KEY}.weights.w1`)}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <th className="px-3 py-2 text-right text-white/30 font-bold cursor-help border-b border-dashed border-white/10 hover:border-white/30">w₂</th>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-zinc-950 border-white/10 text-white/80">{t(`${PLAYGROUND_KEY}.weights.w2`)}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <th className="px-3 py-2 text-right text-white/30 font-bold cursor-help border-b border-dashed border-white/10 hover:border-white/30">b</th>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-zinc-950 border-white/10 text-white/80">{t(`${PLAYGROUND_KEY}.weights.bias`)}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <th className="px-3 py-2 text-right text-white/30 font-bold cursor-help border-b border-dashed border-white/10 hover:border-white/30">ŷ</th>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-zinc-950 border-white/10 text-white/80">{t(`${PLAYGROUND_KEY}.visualization.output`)}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <th className="px-3 py-2 text-right text-white/30 font-bold cursor-help border-b border-dashed border-white/10 hover:border-white/30">Loss</th>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-zinc-950 border-white/10 text-white/80">{t(`${PLAYGROUND_KEY}.visualization.loss`)}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map(h => (
                            <tr key={h.step} className="border-b border-white/[0.03] last:border-0">
                                <td className="px-3 py-1.5 text-white/40">{h.step}</td>
                                <td className="px-3 py-1.5 text-right text-rose-400/70">{h.w1.toFixed(4)}</td>
                                <td className="px-3 py-1.5 text-right text-rose-400/70">{h.w2.toFixed(4)}</td>
                                <td className="px-3 py-1.5 text-right text-amber-400/70">{h.b.toFixed(4)}</td>
                                <td className="px-3 py-1.5 text-right text-indigo-400/70">{h.prediction.toFixed(4)}</td>
                                <td className="px-3 py-1.5 text-right text-white/50">{h.loss.toFixed(6)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StatBadge({ label, value, color = "text-white/60", helpKey }: { label: string; value: string; color?: string; helpKey: string }) {
    const { t } = useI18n();
    return (
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 text-center">
            <p className="text-[8px] font-mono text-white/25 mb-0.5">
                <ExplainedText tooltip={t(helpKey)}>{label}</ExplainedText>
            </p>
            <p className={`text-sm font-mono font-bold ${color}`}>{value}</p>
        </div>
    );
}

// TODO: Future enhancements
// - Multi-layer neural network playground (add hidden layers)
// - Real-time loss curve chart (line chart with axes and labels)
// - Compare predictions vs. bigram probabilities interactively
// - Ability to randomize inputs along with parameters
// - Batch training with multiple input-target pairs
// - Save/load parameter configurations for reproducibility
