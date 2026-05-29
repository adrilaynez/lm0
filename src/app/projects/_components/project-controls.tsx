"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { useI18n } from "@/i18n/context";

const LANGS = ["en", "es"] as const;

/** Editorial language + theme controls: a segmented EN/ES pill and a round theme button. */
export function ProjectControls() {
  const { language, setLanguage, t } = useI18n();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center gap-0.5 rounded-full border border-[color:var(--proj-rule)] p-[3px]">
        {LANGS.map((l) => {
          const active = language === l;
          return (
            <button
              key={l}
              onClick={() => setLanguage(l)}
              aria-pressed={active}
              className={`rounded-full px-2.5 py-1 font-[family-name:var(--font-jetbrains-mono)] text-[11px] uppercase tracking-[0.14em] transition-colors ${
                active
                  ? "bg-[var(--proj-fg)] text-[var(--proj-bg)]"
                  : "text-[color:var(--proj-muted)] hover:text-[color:var(--proj-fg)]"
              }`}
            >
              {l}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        aria-label={t("common.toggleTheme")}
        className="grid h-9 w-9 place-items-center rounded-full border border-[color:var(--proj-rule)] text-[color:var(--proj-muted)] transition-colors hover:border-[color:var(--proj-fg)] hover:text-[color:var(--proj-fg)]"
      >
        <Sun className="hidden h-[1.05rem] w-[1.05rem] dark:block" />
        <Moon className="h-[1.05rem] w-[1.05rem] dark:hidden" />
      </button>
    </div>
  );
}
