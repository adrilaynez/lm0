"use client";

/** Beat 1 — the giant question over the machine. Appears after the boot;
    the button vanishes once used (and the whole block fades past the hero). */

import { useState } from "react";

import { useI18n } from "@/i18n/context";

interface HeroTitleProps {
  onTeach: () => void;
}

export function HeroTitle({ onTeach }: HeroTitleProps) {
  const { t } = useI18n();
  const [used, setUsed] = useState(false);

  return (
    <>
      <div className="lm0-title">
        <div className="lm0-hero-eyebrow">{t("lm0.hero.eyebrow")}</div>
        <h1 className="lm0-serif">
          {t("lm0.hero.question")}{" "}
          <span className="lm0-title-accent">{t("lm0.hero.questionAccent")}</span>
        </h1>
        <div className="lm0-ui lm0-label">{t("lm0.hero.label")}</div>
      </div>
      {/* CTA lives BELOW the machine */}
      <div className="lm0-hero-cta">
        <button
          type="button"
          className="lm0-btn"
          data-used={used}
          onClick={() => {
            setUsed(true);
            onTeach();
          }}
        >
          <span>{t("lm0.hero.teach")}</span>
          <span className="lm0-btn-arrow" aria-hidden="true">
            →
          </span>
        </button>
        <div className="lm0-ui lm0-hero-hint">{t("lm0.hero.hint")} ↓</div>
      </div>
    </>
  );
}
