import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lm0.dev";

/* Build a sitemap entry for one logical path, with per-locale hreflang alternates.
   Default locale (en) lives at the unprefixed URL; others are /<locale>/... (as-needed). */
function entry(path: string): MetadataRoute.Sitemap[number] {
  const url = (locale: string) =>
    locale === routing.defaultLocale ? `${SITE_URL}${path}` : `${SITE_URL}/${locale}${path}`;
  return {
    url: url(routing.defaultLocale),
    alternates: {
      languages: {
        ...Object.fromEntries(routing.locales.map((l) => [l, url(l)])),
        // x-default → the unprefixed default-locale URL (for unmatched languages).
        "x-default": url(routing.defaultLocale),
      },
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  // lm0.dev is the lab: the landing at the root + the five chapters.
  const staticPaths = ["", "/bigram", "/ngram", "/neural-networks", "/mlp", "/transformer"];

  return staticPaths.map(entry);
}
