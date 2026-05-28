"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { useI18n } from "@/i18n/context";

/**
 * Top fixed masthead for the chill landing.
 * Brand logo (left), theme toggle + language toggle (right).
 */
export function ChillMasthead() {
    const { t, language, setLanguage } = useI18n();
    const { theme, resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const isLight = mounted && (theme === "light" || resolvedTheme === "light");

    return (
        <header className="masthead">
            <Link href="/lab" className="brand" aria-label={t("lab.landing.chill.masthead.brandAlt")}>
                <img
                    src="/lab/chill/lm-lab-logo.png"
                    alt={t("lab.landing.chill.masthead.brandAlt")}
                    className="brand-logo"
                />
            </Link>
            <nav className="utils" aria-label="Site utilities">
                <button
                    type="button"
                    onClick={() => setTheme(isLight ? "dark" : "light")}
                    aria-label={t("lab.landing.chill.masthead.themeLabel")}
                    title={t("lab.landing.chill.masthead.themeLabel")}
                >
                    {/* sun for light, moon for dark — single character keeps the chill mood */}
                    <span aria-hidden="true">{mounted ? (isLight ? "☼" : "☾") : "☾"}</span>
                </button>
                <span className="sep">/</span>
                <button
                    type="button"
                    onClick={() => setLanguage(language === "en" ? "es" : "en")}
                    aria-label={t("lab.landing.chill.masthead.langLabel")}
                    title={t("lab.landing.chill.masthead.langLabel")}
                >
                    <span className={language === "en" ? "lang-on" : undefined}>EN</span>
                    <span aria-hidden="true">·</span>
                    <span className={language === "es" ? "lang-on" : undefined}>ES</span>
                </button>
            </nav>
        </header>
    );
}
