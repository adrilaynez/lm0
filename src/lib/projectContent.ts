import type { ComponentType } from "react";
import type { MDXProps } from "mdx/types";

import automataEn from "@/content/projects/automata.en.mdx";
import automataEs from "@/content/projects/automata.es.mdx";
import fourierEn from "@/content/projects/fourier-draw.en.mdx";
import fourierEs from "@/content/projects/fourier-draw.es.mdx";
import latentEn from "@/content/projects/latent.en.mdx";
import latentEs from "@/content/projects/latent.es.mdx";
import lmLabEn from "@/content/projects/lm-lab.en.mdx";
import lmLabEs from "@/content/projects/lm-lab.es.mdx";
import sovaEn from "@/content/projects/sova.en.mdx";
import sovaEs from "@/content/projects/sova.es.mdx";
import titanEn from "@/content/projects/titan-engine.en.mdx";
import titanEs from "@/content/projects/titan-engine.es.mdx";

type MdxComponent = ComponentType<MDXProps>;

/* Per-project long-form overview prose, authored as MDX (one file per slug + locale).
   Statically imported (Next/Turbopack-friendly — no import.meta.glob) and switched by
   locale. Short structured fields (tagline, features, steps, spec) stay in
   projects-data.ts; only the prose overview lives here. */
const OVERVIEWS: Record<string, { en: MdxComponent; es: MdxComponent }> = {
    "lm-lab": { en: lmLabEn, es: lmLabEs },
    sova: { en: sovaEn, es: sovaEs },
    latent: { en: latentEn, es: latentEs },
    "titan-engine": { en: titanEn, es: titanEs },
    "fourier-draw": { en: fourierEn, es: fourierEs },
    automata: { en: automataEn, es: automataEs },
};

/** The MDX overview component for a project + locale, or null if none authored. */
export function getProjectOverview(slug: string, locale: string): MdxComponent | null {
    const pair = OVERVIEWS[slug];
    if (!pair) return null;
    return locale === "es" ? pair.es : pair.en;
}
