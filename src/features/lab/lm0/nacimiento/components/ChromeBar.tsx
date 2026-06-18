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
  // In the hero, show ONLY the thin progress hairline — the cue above already says
  // "scroll", so the brand + "desliza · chapter" label are redundant chrome there.
  // Both reappear the moment you scroll into training. (Conditional render, not CSS:
  // a `:last-child` opacity hack would also blank the lone track in the hero.)
  const hero = beat === "hero";
  return (
    <div className="lm0-chrome" aria-hidden="true">
      {!hero && <span className="lm0-chrome-brand">lm0</span>}
      <span className="lm0-chrome-track">
        <span className="lm0-chrome-fill" />
      </span>
      {!hero && (
        <span>
          {t("lm0.chrome.scroll")} ↓ · {t(`lm0.chrome.${beat}`)}
        </span>
      )}
    </div>
  );
}
