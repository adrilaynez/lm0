"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

import { FlaskConical } from "lucide-react";

import { FadeInView } from "@/components/lab/FadeInView";

import { ErrorBoundary } from "@/components/lab/ErrorBoundary";
import { LabShell } from "@/components/lab/LabShell";
import type { MLPHyperparameterExplorerProps } from "@/components/lab/mlp/MLPHyperparameterExplorer";
import type { MLPNarrativeProps } from "@/components/lab/MLPNarrative";
import { ModelHero } from "@/components/lab/ModelHero";
import { SectionDivider } from "@/components/lab/SectionDivider";
import { useLabMode } from "@/context/LabModeContext";
import type { UseMLPGridReturn } from "@/hooks/useMLPGrid";
import { useMLPGrid } from "@/hooks/useMLPGrid";
import { useI18n } from "@/i18n/context";

const MLPNarrative = dynamic<MLPNarrativeProps>(
    () => import("@/components/lab/MLPNarrative").then((m) => ({ default: m.MLPNarrative })),
    { ssr: false, loading: () => <MLPLoadingPlaceholder /> }
);

const MLPHyperparameterExplorer = dynamic<MLPHyperparameterExplorerProps>(
    () => import("@/components/lab/mlp/MLPHyperparameterExplorer").then((m) => ({ default: m.MLPHyperparameterExplorer })),
    { ssr: false, loading: () => <MLPLoadingPlaceholder /> }
);

function MLPLoadingPlaceholder() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-24 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin mb-6" />
            <p className="text-sm text-white/30 font-mono">Loading…</p>
        </div>
    );
}

function MlpFreeLab({ mlpGrid }: { mlpGrid: UseMLPGridReturn }) {
    const { t } = useI18n();

    return (
        <div className="max-w-7xl mx-auto pb-24">

            {/* ── HERO ── */}
            <ModelHero
                title={t("models.mlp.title")}
                description={t("models.mlp.description")}
                customStats={[]}
            />

            {/* ── SECTION DIVIDER ── */}
            <SectionDivider
                number="01"
                title={t("models.mlp.freeLab.title")}
                description={t("models.mlp.freeLab.description")}
            />

            {/* ── EXPLORER ── */}
            <FadeInView margin="-60px" className="max-w-5xl mx-auto px-6 mb-28">
                <MLPHyperparameterExplorer
                    configs={mlpGrid.configs}
                    selectedConfig={mlpGrid.selectedConfig}
                    onSelectClosest={mlpGrid.selectClosest}
                    timeline={mlpGrid.timeline}
                    timelineLoading={mlpGrid.timelineLoading}
                    onFetchTimeline={mlpGrid.fetchTimelineData}
                    generation={mlpGrid.generation}
                    generationLoading={mlpGrid.generationLoading}
                    onGenerate={mlpGrid.generateText}
                    gridLoading={mlpGrid.gridLoading}
                    gridError={mlpGrid.gridError}
                />
            </FadeInView>

            {/* ── FOOTER ── */}
            <FadeInView className="mt-32 border-t border-white/[0.05] pt-12 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/20">
                    <FlaskConical className="h-3 w-3" />
                    <span>LM-Lab · {t("models.mlp.hero.badge")}</span>
                </div>
                <p className="text-[10px] text-white/15 font-mono">
                    {t("models.mlp.page.switchToEducational")}
                </p>
            </FadeInView>
        </div>
    );
}

function MlpPageContent() {
    const { mode } = useLabMode();
    const isEducational = mode === "educational";
    const mlpGrid = useMLPGrid();

    // Auto-select best-scoring config once the grid loads.
    // useMLPGrid already selects configs[0]; we override with the highest-score config.
    const autoSelectedRef = useRef(false);
    useEffect(() => {
        if (mlpGrid.configs.length === 0 || autoSelectedRef.current) return;
        autoSelectedRef.current = true;
        const best = [...mlpGrid.configs].sort((a, b) => {
            const sa = a.score ?? (1 - a.final_loss / 10);
            const sb = b.score ?? (1 - b.final_loss / 10);
            return sb - sa;
        })[0];
        if (best && best.config_id !== mlpGrid.selectedConfig?.config_id) {
            mlpGrid.selectConfig(best);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mlpGrid.configs]);

    return (
        <LabShell>
            {isEducational ? (
                /* ═══════════════════════════════════════════
                   EDUCATIONAL MODE — Narrative blog layout
                   ═══════════════════════════════════════════ */
                <ErrorBoundary fallbackMessage="The MLP narrative encountered an error">
                    <MLPNarrative mlpGrid={mlpGrid} />
                </ErrorBoundary>
            ) : (
                /* ═══════════════════════════════════════════
                   FREE LAB MODE — Full interactive lab
                   ═══════════════════════════════════════════ */
                <MlpFreeLab mlpGrid={mlpGrid} />
            )}
        </LabShell>
    );
}

export default function MlpPage() {
    return <MlpPageContent />;
}
