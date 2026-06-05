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

    // Reproduce the OLD hand-rolled t() semantics exactly: take the RAW message string
    // (no ICU parsing) and do `{param}` replacement ourselves. This is required because
    // many strings embed literal <strong>/<em> HTML (rendered via dangerouslySetInnerHTML)
    // which next-intl's ICU formatter would mis-parse as tag placeholders and throw on.
    // Using tRoot.raw() sidesteps ICU entirely — same behavior the app always had.
    const t = React.useCallback(
        (key: string, params?: Record<string, string | number>): string => {
            let raw: unknown;
            try {
                raw = tRoot.raw(key);
            } catch {
                return key;
            }
            if (typeof raw !== "string") return key;
            if (!params) return raw;
            let out = raw;
            for (const [k, v] of Object.entries(params)) {
                out = out.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
            }
            return out;
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
