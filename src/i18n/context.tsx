"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";

import { usePathname, useRouter } from "./navigation";
import type { Language } from "./types";

/* ─────────────────────────────────────────────
   useI18n — compatibility shim over next-intl.

   Historically this was a hand-rolled React context (localStorage-persisted language +
   a dotted-key `t`). It is now backed by next-intl so the ~374 call sites keep working
   unchanged. The bridge: `useTranslations()` with NO namespace returns a root-scoped `t`
   that accepts full dotted keys (`t('models.bigram.sections.x')`) — exactly the old API.

   - language: the active locale from the URL ([locale] segment).
   - setLanguage: navigates to the same path under the new locale (persists via NEXT_LOCALE
     cookie). Replaces the old localStorage state flip.
   - t: dotted-key lookup + {param} interpolation, defensive (falls back to the key) so a
     stray ICU brace during rollout never throws in the UI.
   ───────────────────────────────────────────── */
export function useI18n() {
    const language = useLocale() as Language;
    const tRoot = useTranslations();
    const router = useRouter();
    const pathname = usePathname();

    const t = React.useCallback(
        (key: string, params?: Record<string, string | number>): string => {
            try {
                return tRoot(key, params as Record<string, string | number>);
            } catch {
                return key;
            }
        },
        [tRoot],
    );

    const setLanguage = React.useCallback(
        (lang: Language) => {
            router.replace(pathname, { locale: lang });
        },
        [router, pathname],
    );

    return { language, setLanguage, t };
}

/* Back-compat no-op: the old <I18nProvider> wrapper is replaced by NextIntlClientProvider
   in app/[locale]/layout.tsx. Kept as a pass-through so any lingering import doesn't break. */
export function I18nProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
