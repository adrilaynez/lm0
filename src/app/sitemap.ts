import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { getEssays, getMindNotes } from "@/lib/mdx";

import { getProjectSlugs } from "./[locale]/projects/projects-data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://adrianlaynez.dev";

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
  const staticPaths = [
    "",
    "/projects",
    "/lab",
    "/lab/bigram",
    "/lab/ngram",
    "/lab/neural-networks",
    "/lab/mlp",
    "/lab/transformer",
    "/latent-space",
    "/latent-space/mind",
  ];

  const projectPaths = getProjectSlugs().map((slug) => `/projects/${slug}`);
  const essayPaths = getEssays().map((n) => `/latent-space/essays/${n.slug}`);
  const mindPaths = getMindNotes().map((n) => `/latent-space/mind/${n.slug}`);

  return [...staticPaths, ...projectPaths, ...essayPaths, ...mindPaths].map(entry);
}
