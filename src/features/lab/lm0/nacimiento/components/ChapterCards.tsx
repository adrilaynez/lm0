"use client";

/**
 * ChapterCards — "los capítulos": the path you'll actually build, as a row of
 * cards on the dark field. Each carries its number, title (serif), a bespoke
 * ChapterGlyph in its era accent, and a one-line "what it does" that brightens
 * and lifts on hover (the reveal). gpt is locked (coming soon). Links go to the
 * real chapters; LM0's own marks only — never the chapter visualizers.
 */

import { useI18n } from "@/i18n/context";
import { Link } from "@/i18n/navigation";

import { ChapterGlyph, type GlyphKind } from "./ChapterGlyph";

const CHAPTERS: {
  n: string;
  kind: GlyphKind;
  labelKey: string;
  subKey: string;
  era: string;
  href?: string;
  locked?: boolean;
}[] = [
  {
    n: "01",
    kind: "bigram",
    labelKey: "chBigram",
    subKey: "chBigramSub",
    era: "contar",
    href: "/bigram",
  },
  {
    n: "02",
    kind: "ngram",
    labelKey: "chNgram",
    subKey: "chNgramSub",
    era: "contar",
    href: "/ngram",
  },
  {
    n: "03",
    kind: "nn",
    labelKey: "chNn",
    subKey: "chNnSub",
    era: "aprender",
    href: "/neural-networks",
  },
  {
    n: "04",
    kind: "mlp",
    labelKey: "chMlp",
    subKey: "chMlpSub",
    era: "aprender",
    href: "/mlp",
  },
  {
    n: "05",
    kind: "transformer",
    labelKey: "chTransformer",
    subKey: "chTransformerSub",
    era: "atencion",
    href: "/transformer",
  },
  { n: "06", kind: "gpt", labelKey: "chGpt", subKey: "chGptSub", era: "actualidad", locked: true },
];

export function ChapterCards() {
  const { t } = useI18n();

  return (
    <div className="lm0-ch-grid">
      {CHAPTERS.map((c) => {
        const inner = (
          <>
            <div className="lm0-ch-glyph-wrap">
              <ChapterGlyph kind={c.kind} />
            </div>
            <div className="lm0-ch-foot">
              <span className="lm0-ch-num">{c.n}</span>
              <span className="lm0-ch-title lm0-serif">{t(`lm0.finale.${c.labelKey}`)}</span>
              <span className="lm0-ch-sub">{t(`lm0.finale.${c.subKey}`)}</span>
            </div>
          </>
        );
        return c.href ? (
          <Link key={c.n} href={c.href} className="lm0-ch-card" data-era={c.era}>
            {inner}
          </Link>
        ) : (
          <div key={c.n} className="lm0-ch-card" data-era={c.era} data-locked="true">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
