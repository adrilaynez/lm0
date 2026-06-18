import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { routing } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lm0.dev";

/**
 * Per-chapter metadata for the lab routes. Pulls the localized title/description from the
 * `models.<chapterKey>` i18n block and emits canonical + hreflang alternates and an
 * article OpenGraph card. Used by each chapter's server `page.tsx` wrapper.
 */
export async function labChapterMetadata(
  locale: string,
  chapterKey: string,
  routePath: string,
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "models" });
  const title = `${t(`${chapterKey}.title`)} · LM0`;
  const description = t(`${chapterKey}.description`);
  const url = (l: string) =>
    l === routing.defaultLocale ? `${SITE_URL}${routePath}` : `${SITE_URL}/${l}${routePath}`;

  return {
    title,
    description,
    alternates: {
      canonical: url(locale),
      languages: {
        ...Object.fromEntries(routing.locales.map((l) => [l, url(l)])),
        "x-default": url(routing.defaultLocale),
      },
    },
    openGraph: {
      type: "article",
      locale,
      title,
      description,
      url: url(locale),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
