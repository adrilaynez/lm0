"use client";

/**
 * FinaleSection — normal document flow after the sticky journey: the light
 * returns and the page hands over the path.
 *
 *  · "ya conoces el final. / te falta el camino." (the page's editorial climax)
 *  · the CHAPTERS grouped by era (not era cards): bigram & n-gram under
 *    counting, neural networks & mlp under learning, transformer under
 *    attention, gpt locked under today — each era column carries its accent.
 *  · the creator's note, READ BY lm0 ("una nota de mi creador").
 *  · the final CTA: "empezar por el principio" → /lab/bigram.
 */

import { useI18n } from "@/i18n/context";
import { Link } from "@/i18n/navigation";

import { corpusEn } from "../data/corpus.en";
import { corpusEs } from "../data/corpus.es";

const ERAS: {
  era: string;
  tagKey: string;
  chapters: { labelKey: string; href?: string; locked?: boolean }[];
}[] = [
  {
    era: "contar",
    tagKey: "eraContar",
    chapters: [
      { labelKey: "chBigram", href: "/lab/bigram" },
      { labelKey: "chNgram", href: "/lab/ngram" },
    ],
  },
  {
    era: "aprender",
    tagKey: "eraAprender",
    chapters: [
      { labelKey: "chNn", href: "/lab/neural-networks" },
      { labelKey: "chMlp", href: "/lab/mlp" },
    ],
  },
  {
    era: "atencion",
    tagKey: "eraAtencion",
    chapters: [{ labelKey: "chTransformer", href: "/lab/transformer" }],
  },
  {
    era: "actualidad",
    tagKey: "eraActualidad",
    chapters: [{ labelKey: "chGpt", locked: true }],
  },
];

export function FinaleSection() {
  const { t, language } = useI18n();
  const attribution = language === "en" ? corpusEn.attribution : corpusEs.attribution;

  return (
    <section className="lm0-finale">
      <h2 className="lm0-serif lm0-finale-h1">{t("lm0.finale.h1")}</h2>
      <p className="lm0-serif lm0-finale-h2">{t("lm0.finale.h2")}</p>
      <p className="lm0-ui lm0-finale-sub">{t("lm0.finale.sub")}</p>

      <div className="lm0-finale-grid">
        {ERAS.map((e) => (
          <div key={e.era} className="lm0-fera" data-era={e.era}>
            <div className="lm0-fera-tag">{t(`lm0.finale.${e.tagKey}`)}</div>
            {e.chapters.map((ch) =>
              ch.href ? (
                <Link key={ch.labelKey} href={ch.href} className="lm0-fch">
                  {t(`lm0.finale.${ch.labelKey}`)}
                </Link>
              ) : (
                <span key={ch.labelKey} className="lm0-fch" data-locked="true">
                  {t(`lm0.finale.${ch.labelKey}`)}
                </span>
              ),
            )}
          </div>
        ))}
      </div>

      <div className="lm0-finale-note">
        <p className="lm0-note-intro">
          <span className="lm0-caret" data-blink="true" aria-hidden="true" />
          {t("lm0.finale.noteIntro")}
        </p>
        <div className="lm0-ui lm0-note-title">{t("lm0.finale.noteTitle")}</div>
        <p className="lm0-note-body">{t("lm0.finale.noteBody")}</p>
      </div>

      <div>
        <Link href="/lab/bigram" className="lm0-finale-cta">
          {t("lm0.finale.cta")} →
        </Link>
        <div className="lm0-ui lm0-finale-ctasub">{t("lm0.finale.ctaSub")}</div>
      </div>

      <p className="lm0-finale-colophon">{t("lm0.finale.colophon", { attribution })}</p>
    </section>
  );
}
