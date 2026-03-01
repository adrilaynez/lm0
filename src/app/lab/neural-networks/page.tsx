"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

import { ArrowRight, FlaskConical } from "lucide-react";

import { FadeInView } from "@/components/lab/FadeInView";

import { ErrorBoundary } from "@/components/lab/ErrorBoundary";
import { LabShell } from "@/components/lab/LabShell";
import { ModelHero } from "@/components/lab/ModelHero";
import { SectionDivider } from "@/components/lab/SectionDivider";
import { useLabMode } from "@/context/LabModeContext";
import { useI18n } from "@/i18n/context";

const NeuralNetworkNarrative = dynamic(
    () => import("@/components/lab/NeuralNetworkNarrative").then((m) => ({ default: m.NeuralNetworkNarrative })),
    { ssr: false, loading: () => <NeuralNetworksLoadingPlaceholder /> }
);

const NNPlayground = dynamic(
    () => import("@/components/lab/NNPlayground").then((m) => ({ default: m.NNPlayground })),
    { ssr: false, loading: () => <NeuralNetworksLoadingPlaceholder /> }
);

const GuidedExperiments = dynamic(
    () => import("@/components/lab/GuidedExperiments").then((m) => ({ default: m.GuidedExperiments })),
    { ssr: false }
);

function NeuralNetworksLoadingPlaceholder() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-24 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 rounded-full border-2 border-rose-500/30 border-t-rose-400 animate-spin mb-6" />
            <p className="text-sm text-white/30 font-mono">Loading…</p>
        </div>
    );
}

function NeuralNetworksPageContent() {
    const { t } = useI18n();
    const { mode } = useLabMode();

    const isEducational = mode === "educational";

    return (
        <LabShell>
            {isEducational ? (
                /* ═══════════════════════════════════════════
                   EDUCATIONAL MODE — Narrative blog layout
                   ═══════════════════════════════════════════ */
                <ErrorBoundary fallbackMessage="The neural network narrative encountered an error">
                    <NeuralNetworkNarrative />
                </ErrorBoundary>
            ) : (
                /* ═══════════════════════════════════════════
                   FREE LAB MODE — Interactive playground
                   ═══════════════════════════════════════════ */
                <div className="max-w-7xl mx-auto pb-24">

                    {/* ─── HERO ─── */}
                    <ModelHero
                        title={t("models.neuralNetworks.title")}
                        description={t("models.neuralNetworks.description")}
                        customStats={[]}
                    />

                    {/* ─── PLAYGROUND ─── */}
                    <SectionDivider
                        number="01"
                        title={t("models.neuralNetworks.freeLab.title")}
                        description={t("models.neuralNetworks.freeLab.description")}
                    />

                    <div className="max-w-5xl mx-auto px-6 mb-28">
                        <FadeInView margin="-40px">
                            <GuidedExperiments />
                        </FadeInView>

                        <FadeInView margin="-60px">
                            <NNPlayground />
                        </FadeInView>
                    </div>

                    {/* ─── FOOTER ─── */}
                    <FadeInView className="mt-32 border-t border-white/[0.05] pt-12 flex flex-col items-center gap-6">
                        <p className="text-xs text-white/30 max-w-sm text-center leading-relaxed">
                            {t("neuralNetworkNarrative.bigramConnection.p3")?.slice(0, 120)}…
                        </p>
                        <Link
                            href="/lab/mlp"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/40 text-violet-300 hover:text-violet-200 text-sm font-semibold transition-colors"
                        >
                            {t("neuralNetworkNarrative.cta.mlpButton")}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/20">
                            <FlaskConical className="h-3 w-3" />
                            <span>LM-Lab · {t("models.neuralNetworks.hero.badge")}</span>
                        </div>
                    </FadeInView>
                </div>
            )}
        </LabShell>
    );
}

export default function NeuralNetworksPage() {
    return <NeuralNetworksPageContent />;
}
