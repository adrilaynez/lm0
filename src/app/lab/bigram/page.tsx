"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

import { ArrowRight, FlaskConical } from "lucide-react";

import { DatasetExplorerModal } from "@/features/lab/components/DatasetExplorerModal";
import { ErrorBoundary } from "@/features/lab/components/ErrorBoundary";
import { FadeInView } from "@/features/lab/components/FadeInView";
import { HistoricalContextPanel } from "@/features/lab/components/HistoricalContextPanel";
import { LabSectionHeader } from "@/features/lab/components/LabSectionHeader";
import { LabShell } from "@/features/lab/components/LabShell";
import { ModelHero } from "@/features/lab/components/ModelHero";
import { SectionDivider } from "@/features/lab/components/SectionDivider";
import { useLabMode } from "@/features/lab/context/LabModeContext";
import { useBigramGeneration } from "@/features/lab/hooks/useBigramGeneration";
import { useBigramStepwise } from "@/features/lab/hooks/useBigramStepwise";
import { useBigramVisualization } from "@/features/lab/hooks/useBigramVisualization";
import { useLabTheme } from "@/features/lab/hooks/useLabTheme";
import { useI18n } from "@/i18n/context";

const BigramNarrative = dynamic(() =>
    import("@/features/lab/components/BigramNarrative").then((m) => m.BigramNarrative)
);
const BigramDiagramExperience = dynamic(() =>
    import("@/features/lab/components/BigramDiagramExperience").then((m) => m.BigramDiagramExperience)
);
const InferenceConsole = dynamic(() =>
    import("@/features/lab/components/InferenceConsole").then((m) => m.InferenceConsole)
);
const StepwisePrediction = dynamic(() =>
    import("@/features/lab/components/StepwisePrediction").then((m) => m.StepwisePrediction)
);
const GenerationPlayground = dynamic(() =>
    import("@/features/lab/components/GenerationPlayground").then((m) => m.GenerationPlayground)
);
const ArchitectureDeepDive = dynamic(() =>
    import("@/features/lab/components/ArchitectureDeepDive").then((m) => m.ArchitectureDeepDive)
);


function BigramPageContent() {
    const { t } = useI18n();
    const { mode } = useLabMode();
    const { theme } = useLabTheme();
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
            <div
                data-bigram-theme={theme}
                className="bg-bigram-bg text-bigram-ink min-h-screen"
            >
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
                    <ModelHero accent="bigram" />

                    {/* ─── 01 · TRANSITION MATRIX & PROBABILITY FLOW ─── */}
                    <SectionDivider
                        number="01"
                        accent="bigram"
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
                        accent="bigram"
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
                                    accent="bigram"
                                />
                                <InferenceConsole
                                    accent="bigram"
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
                                    accent="bigram"
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
                                accent="bigram"
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
                        accent="bigram"
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
                                labels={{
                                    title: t("models.ngram.historical.title"),
                                    learnMore: t("models.ngram.historical.learnMore"),
                                    description: t("models.ngram.historical.description"),
                                    limitations: t("models.ngram.historical.limitations"),
                                    evolution: t("models.ngram.historical.evolution"),
                                }}
                                collapsible
                            />
                        </FadeInView>
                    )}

                    {/* ─── FOOTER ─── */}
                    <FadeInView className="mt-32 border-t border-bigram-rule pt-12 flex flex-col items-center gap-6">
                        <p className="text-xs text-bigram-dim max-w-sm text-center leading-relaxed">
                            {t("bigramNarrative.cliffhanger.hookLine")}
                        </p>
                        <Link
                            href="/lab/ngram"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-bigram-accent-soft border border-[color-mix(in_oklab,var(--bigram-accent)_28%,transparent)] hover:border-[color-mix(in_oklab,var(--bigram-accent)_50%,transparent)] text-bigram-accent-ink text-sm font-semibold transition-colors"
                        >
                            {t("bigramNarrative.cta.nextTitle")}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-bigram-dim">
                            <FlaskConical className="h-3 w-3" />
                            <span>LM-Lab · {t("models.bigram.hero.scientificInstrument")}</span>
                        </div>
                    </FadeInView>
                </div>
            )}
            </div>

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
