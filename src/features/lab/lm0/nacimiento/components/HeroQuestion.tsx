"use client";

/** Beat 1 — the page IS a question (spec §3.1). The h1 lives in the DOM always. */

import { useI18n } from "@/i18n/context";

interface HeroQuestionProps {
  active: boolean;
}

export function HeroQuestion({ active }: HeroQuestionProps) {
  const { t } = useI18n();
  return (
    <section className={`lm0-beat${active ? " is-active" : ""}`}>
      <h1 className="lm0-serif lm0-hero-q">{t("lm0.hero.question")}</h1>
      <div className="lm0-ui-font lm0-hint" aria-hidden="true">
        {t("lm0.hero.hint")} ↓
      </div>
    </section>
  );
}
