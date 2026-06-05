"use client";

import { useI18n } from "@/i18n/context";
import { Link } from "@/i18n/navigation";

/**
 * Footer with brand logo (large, neon-treated), centered "Hecho por · Author"
 * block (clickable, links back to the personal site home), and right-aligned
 * copyright. Stacks centered on mobile.
 */
export function ChillColophon() {
    const { t } = useI18n();

    return (
        <footer className="colophon">
            <div className="brand-big">
                <img
                    src="/lab/chill/lm-lab-logo.png"
                    alt={t("lab.landing.chill.masthead.brandAlt")}
                    className="brand-logo"
                />
            </div>
            <Link href="/" className="notebook-text" aria-label="Visit Adrian Laynez's homepage">
                <span className="notebook-kicker">{t("lab.landing.chill.colophon.kicker")}</span>
                <span className="notebook-name">
                    {t("lab.landing.chill.colophon.authorFirst")}
                    <span className="dot">·</span>
                    {t("lab.landing.chill.colophon.authorLast")}
                    <span className="notebook-arrow" aria-hidden="true">↗</span>
                </span>
            </Link>
            <div className="copyright">{t("lab.landing.chill.colophon.copyright")}</div>
        </footer>
    );
}
