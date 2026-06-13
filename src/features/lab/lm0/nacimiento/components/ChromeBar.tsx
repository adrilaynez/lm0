"use client";

/** The documentary chrome: brand · progress hairline (CSS-driven by --lm0-raw) ·
    "DESLIZA ↓ · chapter label". Always present; recolors itself in the dark act. */

import { useI18n } from "@/i18n/context";

import type { Beat } from "../engine/progressMap";

interface ChromeBarProps {
  beat: Beat;
}

export function ChromeBar({ beat }: ChromeBarProps) {
  const { t } = useI18n();
  return (
    <div className="lm0-chrome" aria-hidden="true">
      <span className="lm0-chrome-brand">LM0</span>
      <span className="lm0-chrome-track">
        <span className="lm0-chrome-fill" />
      </span>
      <span>
        {t("lm0.chrome.scroll")} ↓ · {t(`lm0.chrome.${beat}`)}
      </span>
    </div>
  );
}
