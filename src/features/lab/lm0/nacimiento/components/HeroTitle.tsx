"use client";

/** Beat 1 — the hero masthead: a thin top rule with the wordmark `lm0 · el
    nacimiento` at the left and a STATE readout (`estado: sin corpus`) at the right,
    so even a frozen screenshot tells you the machine is unfit to speak. Sides stay
    open/airy; the chrome bar closes the bottom. The whispered question + scroll cue
    live glued to the machine (in MachineFigure). Hero-only; fades with the boot. */

import { useI18n } from "@/i18n/context";

export function HeroTitle() {
  const { t } = useI18n();
  return (
    <div className="lm0-masthead" aria-hidden="true">
      <span className="lm0-mast-brand">lm0 · {t("lm0.hero.eyebrow")}</span>
      <span className="lm0-mast-state">{t("lm0.hero.state")}</span>
    </div>
  );
}
