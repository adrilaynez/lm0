import type { Metadata } from "next";

import { routing } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://adrianlaynez.dev";

/**
 * Localized page metadata: canonical + hreflang (incl. x-default) + OpenGraph + Twitter.
 * `path` is the route without locale prefix (e.g. "/projects"); the default locale lives
 * unprefixed and others under /<locale> (as-needed routing).
 */
export function localizedMetadata(opts: {
  locale: string;
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
}): Metadata {
  const { locale, title, description, path, type = "website" } = opts;
  const url = (l: string) =>
    l === routing.defaultLocale ? `${SITE_URL}${path}` : `${SITE_URL}/${l}${path}`;
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
    openGraph: { type, locale, title, description, url: url(locale) },
    twitter: { card: "summary_large_image", title, description },
  };
}
