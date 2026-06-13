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
    <div className="lm0-title">
      <div className="lm0-ui">{t("lm0.hero.eyebrow")}</div>
      <h1 className="lm0-serif">{t("lm0.hero.question")}</h1>
      <div className="lm0-ui lm0-label">{t("lm0.hero.label")}</div>
      <div>
        <button
          type="button"
          className="lm0-btn"
          data-used={used}
          onClick={() => {
            setUsed(true);
            onTeach();
          }}
        >
          {t("lm0.hero.teach")} →
        </button>
      </div>
      <div className="lm0-ui" style={{ marginTop: "0.9rem", opacity: 0.65 }}>
        {t("lm0.hero.hint")} ↓
      </div>
    </div>
  );
}
