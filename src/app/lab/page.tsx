"use client";

import "./chill-lab.css";

import { useMemo } from "react";

import { ChillAntiHero } from "@/features/lab/components/chill/AntiHero";
import { ChillColophon } from "@/features/lab/components/chill/Colophon";
import { ChillEraSection, type EraChapter } from "@/features/lab/components/chill/EraSection";
import { ChillHero } from "@/features/lab/components/chill/Hero";
import { ChillMasthead } from "@/features/lab/components/chill/Masthead";
import { ChillPrologue } from "@/features/lab/components/chill/Prologue";
import { AttentionFlowGrid } from "@/features/lab/components/chill/visualizers/AttentionFlowGrid";
import { BigramFrequencyMap } from "@/features/lab/components/chill/visualizers/BigramFrequencyMap";
import { MLPForwardWave } from "@/features/lab/components/chill/visualizers/MLPForwardWave";
import { useI18n } from "@/i18n/context";

/**
 * Chill · Lab landing — `adrian.laynez/lab`
 *
 * Editorial walk through 80 years of language modeling, told in 3 acts:
 *   ERA I  Counting (Bigram + N-Gram)        — emerald phosphor
 *   ERA II Learning (Neural Networks + MLP)  — amber
 *   ERA III Attention (Transformer + GPT)    — blue
 *
 * Bilingual (EN/ES via i18n), dark/light theme aware, scoped under [data-chill-lab].
 */
export default function LabLandingPage() {
    const { t } = useI18n();

    const chapterCta = t("lab.landing.chill.chapter.cta");

    const countingChapters = useMemo<EraChapter[]>(
        () => [
            {
                num: "01",
                title: t("lab.landing.chill.eras.counting.chapter01Title"),
                desc: t("lab.landing.chill.eras.counting.chapter01Desc"),
                href: "/lab/bigram",
                cta: chapterCta,
            },
            {
                num: "02",
                title: t("lab.landing.chill.eras.counting.chapter02Title"),
                desc: t("lab.landing.chill.eras.counting.chapter02Desc"),
                href: "/lab/ngram",
                cta: chapterCta,
            },
        ],
        [t, chapterCta]
    );

    const learningChapters = useMemo<EraChapter[]>(
        () => [
            {
                num: "03",
                title: t("lab.landing.chill.eras.learning.chapter03Title"),
                desc: t("lab.landing.chill.eras.learning.chapter03Desc"),
                href: "/lab/neural-networks",
                cta: chapterCta,
            },
            {
                num: "04",
                title: t("lab.landing.chill.eras.learning.chapter04Title"),
                desc: t("lab.landing.chill.eras.learning.chapter04Desc"),
                href: "/lab/mlp",
                cta: chapterCta,
            },
        ],
        [t, chapterCta]
    );

    const attentionChapters = useMemo<EraChapter[]>(
        () => [
            {
                num: "05",
                title: t("lab.landing.chill.eras.attention.chapter05Title"),
                desc: t("lab.landing.chill.eras.attention.chapter05Desc"),
                href: "/lab/transformer",
                cta: chapterCta,
            },
            {
                num: "06",
                title: t("lab.landing.chill.eras.attention.chapter06Title"),
                desc: t("lab.landing.chill.eras.attention.chapter06Desc"),
                cta: t("lab.landing.chill.eras.attention.chapter06Cta"),
                // href intentionally omitted — locked
            },
        ],
        [t, chapterCta]
    );

    return (
        <div data-chill-lab>
            <ChillMasthead />
            <ChillHero />
            <ChillPrologue />

            {/* ─── ERA I · Counting ────────────────────────────── */}
            <ChillEraSection
                id="act-1"
                accent="default"
                label={t("lab.landing.chill.eras.counting.label")}
                years={t("lab.landing.chill.eras.counting.years")}
                titlePrefix={t("lab.landing.chill.eras.counting.titlePrefix")}
                titleAccent={t("lab.landing.chill.eras.counting.titleAccent")}
                bodyP1={t("lab.landing.chill.eras.counting.bodyP1")}
                bodyP2={t("lab.landing.chill.eras.counting.bodyP2")}
                chapters={countingChapters}
                terminalLabel={t("lab.landing.chill.eras.counting.terminalLabel")}
                terminalBodyVariant="map"
                terminalContent={<BigramFrequencyMap />}
                terminalFootLeft={t("lab.landing.chill.eras.counting.terminalFootLeft")}
                terminalFootRight={t("lab.landing.chill.eras.counting.terminalFootRight")}
            />

            {/* ─── ERA II · Learning ────────────────────────────── */}
            <ChillEraSection
                id="act-2"
                accent="amber"
                label={t("lab.landing.chill.eras.learning.label")}
                years={t("lab.landing.chill.eras.learning.years")}
                titlePrefix={t("lab.landing.chill.eras.learning.titlePrefix")}
                titleAccent={t("lab.landing.chill.eras.learning.titleAccent")}
                bodyP1={t("lab.landing.chill.eras.learning.bodyP1")}
                bodyP2={t("lab.landing.chill.eras.learning.bodyP2")}
                chapters={learningChapters}
                terminalLabel={t("lab.landing.chill.eras.learning.terminalLabel")}
                terminalBodyVariant="canvas"
                terminalContent={<MLPForwardWave />}
                terminalFootLeft={t("lab.landing.chill.eras.learning.terminalFootLeft")}
                terminalFootRight={t("lab.landing.chill.eras.learning.terminalFootRight")}
            />

            {/* ─── ERA III · Attention ──────────────────────────── */}
            <ChillEraSection
                id="act-3"
                accent="blue"
                label={t("lab.landing.chill.eras.attention.label")}
                years={t("lab.landing.chill.eras.attention.years")}
                titlePrefix={t("lab.landing.chill.eras.attention.titlePrefix")}
                titleAccent={t("lab.landing.chill.eras.attention.titleAccent")}
                bodyP1={
                    <>
                        <span className="mono" style={{ color: "var(--text)" }}>
                            {t("lab.landing.chill.eras.attention.bodyP1Quote")}
                        </span>
                        {t("lab.landing.chill.eras.attention.bodyP1Tail")}
                    </>
                }
                bodyP2={t("lab.landing.chill.eras.attention.bodyP2")}
                chapters={attentionChapters}
                terminalLabel={t("lab.landing.chill.eras.attention.terminalLabel")}
                terminalBodyVariant="map"
                terminalContent={<AttentionFlowGrid />}
                terminalFootLeft={t("lab.landing.chill.eras.attention.terminalFootLeft")}
                terminalFootRight={t("lab.landing.chill.eras.attention.terminalFootRight")}
            />

            <ChillAntiHero />
            <ChillColophon />
        </div>
    );
}
