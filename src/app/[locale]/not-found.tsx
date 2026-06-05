import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

/**
 * Localized 404 for routes under [locale]. Server component so it can pull a couple of
 * strings from i18n; the link is locale-aware (carries the /es prefix when needed).
 */
export default async function NotFound() {
    const t = await getTranslations("common");

    return (
        <main className="flex min-h-[70vh] items-center justify-center px-6 py-24">
            <div className="max-w-lg text-center">
                <p className="mb-4 font-[family-name:var(--font-jetbrains-mono)] text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    404
                </p>
                <h1 className="mb-4 text-3xl font-semibold leading-tight text-foreground">
                    {t("notFoundTitle")}
                </h1>
                <p className="mb-8 leading-relaxed text-muted-foreground">{t("notFoundBody")}</p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 border border-foreground bg-foreground px-7 py-3.5 text-[13px] uppercase tracking-[0.06em] text-background transition-colors hover:bg-transparent hover:text-foreground"
                >
                    {t("notFoundCta")}
                </Link>
            </div>
        </main>
    );
}
