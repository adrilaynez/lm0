"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

import { ArrowRight, FlaskConical } from "lucide-react";

import { FadeInView } from "@/components/lab/FadeInView";

import { DatasetExplorerModal } from "@/components/lab/DatasetExplorerModal";
import { ErrorBoundary } from "@/components/lab/ErrorBoundary";
import { HistoricalContextPanel } from "@/components/lab/HistoricalContextPanel";
import { LabSectionHeader } from "@/components/lab/LabSectionHeader";
import { LabShell } from "@/components/lab/LabShell";
import { ModelHero } from "@/components/lab/ModelHero";
import { SectionDivider } from "@/components/lab/SectionDivider";
import { useLabMode } from "@/context/LabModeContext";
import { useBigramGeneration } from "@/hooks/useBigramGeneration";
import { useBigramStepwise } from "@/hooks/useBigramStepwise";
import { useBigramVisualization } from "@/hooks/useBigramVisualization";
import { useI18n } from "@/i18n/context";

const BigramNarrative = dynamic(() =>
    import("@/components/lab/BigramNarrative").then((m) => m.BigramNarrative)
);
const BigramDiagramExperience = dynamic(() =>
    import("@/components/lab/BigramDiagramExperience").then((m) => m.BigramDiagramExperience)
);
const InferenceConsole = dynamic(() =>
    import("@/components/lab/InferenceConsole").then((m) => m.InferenceConsole)
);
const StepwisePrediction = dynamic(() =>
    import("@/components/lab/StepwisePrediction").then((m) => m.StepwisePrediction)
);
const GenerationPlayground = dynamic(() =>
    import("@/components/lab/GenerationPlayground").then((m) => m.GenerationPlayground)
);
const ArchitectureDeepDive = dynamic(() =>
    import("@/components/lab/ArchitectureDeepDive").then((m) => m.ArchitectureDeepDive)
);


function BigramPageContent() {
    const { t } = useI18n();
    const { mode } = useLabMode();
    const isEducational = mode === "educational";

    const viz = useBigramVisualization();
    const gen = useBigramGeneration();
    const step = useBigramStepwise();

    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        contextChar: string;
        nextChar: string;
    }>({
        isOpen: false,
        contextChar: "",
        nextChar: "",
    });

    // Initial fetch to get training stats for the hero
    useEffect(() => {
        if (!viz.data && !viz.loading) {
            viz.analyze("hello", 10);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    const handleCellClick = useCallback((rowLabel: string, colLabel: string) => {
        setModalState({
            isOpen: true,
            contextChar: rowLabel,
            nextChar: colLabel,
        });
    }, []);

    const closeModal = useCallback(() => {
        setModalState(prev => ({ ...prev, isOpen: false }));
    }, []);

    return (
        <LabShell>
            {isEducational ? (
                /* ═══════════════════════════════════════════
                   EDUCATIONAL MODE — Narrative blog layout
                   ═══════════════════════════════════════════ */
                <ErrorBoundary fallbackMessage="The bigram narrative encountered an error">
                    <BigramNarrative
                        matrixData={viz.data?.visualization.transition_matrix ?? null}
                        trainingData={viz.data?.visualization.training ?? null}
                        onCellClick={handleCellClick}
                        onGenerate={gen.generate}
                        generatedText={gen.data?.generated_text ?? null}
                        genLoading={gen.loading}
                        genError={gen.error}
                    />
                </ErrorBoundary>
            ) : (
                /* ═══════════════════════════════════════════
                   FREE LAB MODE — Full interactive playground
                   ═══════════════════════════════════════════ */
                <div className="max-w-7xl mx-auto pb-24">

                    {/* ─── HERO ─── */}
                    <ModelHero />

                    {/* ─── 01 · TRANSITION MATRIX & PROBABILITY FLOW ─── */}
                    <SectionDivider
                        number="01"
                        title={t("models.bigram.sections.visualization.title")}
                        description={t("models.bigram.sections.visualization.description")}
                    />

                    <FadeInView margin="-60px" className="max-w-4xl mx-auto px-6 mb-28">
                        <ErrorBoundary fallbackMessage="The bigram diagram visualization encountered an error">
                            <BigramDiagramExperience
                                mode="lab"
                                matrixData={viz.data?.visualization.transition_matrix ?? null}
                                trainingData={viz.data?.visualization.training ?? null}
                                onCellClick={handleCellClick}
                            />
                        </ErrorBoundary>
                    </FadeInView>

                    {/* ─── 02 · INFERENCE & GENERATION ─── */}
                    <SectionDivider
                        number="02"
                        title={t("models.bigram.sections.inference.title")}
                        description={t("models.bigram.sections.inference.description")}
                    />

                    <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-28">
                        {/* Left: Probability + Stepwise */}
                        <div className="space-y-16">
                            <FadeInView margin="-60px" className="space-y-4">
                                <LabSectionHeader
                                    number="2.1"
                                    title={t("models.bigram.inference.probDist")}
                                    description={t("models.bigram.inference.probDistDesc")}
                                    accent="emerald"
                                />
                                <InferenceConsole
                                    onAnalyze={viz.analyze}
                                    predictions={viz.data?.predictions ?? null}
                                    inferenceMs={viz.data?.metadata.inference_time_ms}
                                    device={viz.data?.metadata.device}
                                    loading={viz.loading}
                                    error={viz.error}
                                />
                            </FadeInView>

                            <FadeInView margin="-60px" delay={0.1} className="space-y-4">
                                <LabSectionHeader
                                    number="2.2"
                                    title={t("models.bigram.stepwise.mainTitle")}
                                    description={t("models.bigram.stepwise.description")}
                                    accent="violet"
                                />
                                <StepwisePrediction
                                    onPredict={step.predict}
                                    steps={step.data?.steps ?? null}
                                    finalPrediction={step.data?.final_prediction ?? null}
                                    loading={step.loading}
                                    error={step.error}
                                />
                            </FadeInView>
                        </div>

                        {/* Right: Generation */}
                        <FadeInView margin="-60px" delay={0.15} className="space-y-4">
                            <LabSectionHeader
                                number="2.3"
                                title={t("models.bigram.generation.mainTitle")}
                                description={t("models.bigram.generation.description")}
                                accent="amber"
                            />
                            <GenerationPlayground
                                onGenerate={gen.generate}
                                generatedText={gen.data?.generated_text ?? null}
                                loading={gen.loading}
                                error={gen.error}
                            />
                        </FadeInView>
                    </div>

                    {/* ─── 03 · ARCHITECTURE ─── */}
                    <SectionDivider
                        number="03"
                        title={t("models.bigram.sections.architecture.title")}
                        description={t("models.bigram.sections.architecture.description")}
                    />
                    <FadeInView margin="-60px" className="mb-28">
                        <ArchitectureDeepDive
                            data={viz.data?.visualization.architecture ?? null}
                        />
                    </FadeInView>



                    {/* ─── HISTORICAL CONTEXT ─── */}
                    {viz.data?.historical_context && (
                        <FadeInView margin="-60px" className="max-w-5xl mx-auto px-6 mt-28">
                            <HistoricalContextPanel
                                data={{
                                    description: t("models.bigram.historicalContext.description"),
                                    limitations: [
                                        t("models.bigram.historicalContext.limitations.0"),
                                        t("models.bigram.historicalContext.limitations.1")
                                    ],
                                    modern_evolution: t("models.bigram.historicalContext.evolution")
                                }}
                                collapsible
                            />
                        </FadeInView>
                    )}

                    {/* ─── FOOTER ─── */}
                    <FadeInView className="mt-32 border-t border-white/[0.05] pt-12 flex flex-col items-center gap-6">
                        <p className="text-xs text-white/30 max-w-sm text-center leading-relaxed">
                            {t("bigramNarrative.cliffhanger.hookLine")}
                        </p>
                        <Link
                            href="/lab/ngram"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-300 hover:text-amber-200 text-sm font-semibold transition-colors"
                        >
                            {t("bigramNarrative.cta.nextTitle")}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/20">
                            <FlaskConical className="h-3 w-3" />
                            <span>LM-Lab · {t("models.bigram.hero.scientificInstrument")}</span>
                        </div>
                    </FadeInView>
                </div>
            )}

            {/* MODALS */}
            <DatasetExplorerModal
                isOpen={modalState.isOpen}
                onClose={closeModal}
                contextChar={modalState.contextChar}
                nextChar={modalState.nextChar}
            />
        </LabShell>
    );
}

export default function BigramPage() {
    return <BigramPageContent />;
}
