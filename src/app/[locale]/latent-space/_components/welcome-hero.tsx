"use client";

import { useI18n } from "@/i18n/context";

interface WelcomeHeroProps {
  // mode kept for API compatibility; visuals don't change per mode.
  mode: "essays" | "mind";
}

export function WelcomeHero({ mode }: WelcomeHeroProps) {
  const { t } = useI18n();
  const subtitle = mode === "essays"
    ? t("latentSpace.introEssays")
    : t("latentSpace.intro");

  return (
    <header className="flex w-full flex-col items-center gap-7 text-center">
      <p className="font-[family-name:var(--ls-font-meta)] text-[0.83rem] uppercase tracking-[0.3em] text-[var(--ls-fg-subtle)]">
        {"{"} {t("latentSpace.eyebrow")} {"}"}
      </p>

      <h1 className="ls-pixel-title flex items-center justify-center gap-2 text-[2.75rem] leading-[1] sm:text-[3.63rem] md:text-[4.51rem] lg:text-[5.5rem]">
        <span>{t("latentSpace.title")}</span>
        <span aria-hidden className="ls-block-caret" />
      </h1>

      <p className="font-[family-name:var(--ls-font-body)] text-[1.16rem] italic leading-relaxed text-[var(--ls-fg-muted)]">
        {subtitle}
      </p>
    </header>
  );
}
