import { defineRouting } from "next-intl/routing";

/* Locale routing config (next-intl).
   - localePrefix 'as-needed': default locale (en) keeps clean URLs (/lab/bigram);
     Spanish is prefixed (/es/lab/bigram). Existing English URLs are unchanged.
   - localeCookie maxAge: persist a manual language choice for a year (matches the
     old lm-lab-language cookie behavior). */
export const routing = defineRouting({
    locales: ["en", "es"],
    defaultLocale: "en",
    localePrefix: "as-needed",
    localeCookie: { maxAge: 60 * 60 * 24 * 365 },
});

export type Locale = (typeof routing.locales)[number];
