"use client";

import Link from "next/link";

import { FadeInView } from "@/components/lab/FadeInView";
import { useI18n } from "@/i18n/context";

/**
 * Closing call-to-action mirror of the opening hero: full-bleed illustration,
 * scrim, kicker line, oversized title with accented closing word, sub copy,
 * pill CTA that drops the reader into Chapter 01 (`/lab/bigram`).
 */
export function ChillAntiHero() {
    const { t } = useI18n();

    return (
        <section className="anti-hero" id="anti-hero">
            <div className="anti-hero-art" aria-hidden="true" />
            <div className="anti-hero-scrim" aria-hidden="true" />
            <div className="anti-hero-content">
                <FadeInView className="anti-hero-kicker">{t("lab.landing.chill.antiHero.kicker")}</FadeInView>
                <FadeInView as="h2" className="anti-hero-title">
                    {t("lab.landing.chill.antiHero.titlePrefix")}{" "}
                    <span className="accent">{t("lab.landing.chill.antiHero.titleAccent")}</span>
                </FadeInView>
                <FadeInView as="p" className="anti-hero-sub">
                    {t("lab.landing.chill.antiHero.sub")}
                </FadeInView>
                <FadeInView>
                    <Link href="/lab/bigram" className="anti-hero-cta">
                        <span>{t("lab.landing.chill.antiHero.cta")}</span>
                        <span className="arr" aria-hidden="true">→</span>
                    </Link>
                </FadeInView>
            </div>
        </section>
    );
}
