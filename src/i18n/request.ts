import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

/* Per-request i18n config (runs in Server Components). Reuses the existing TS dictionaries
   as `messages` — next-intl accepts any JS object, so no JSON migration is needed.
   `locale` is REQUIRED to be returned in next-intl v4. */
const dictionaries = {
    en: () => import("./en").then((m) => m.en),
    es: () => import("./es").then((m) => m.es),
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale;
    const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
    return {
        locale,
        messages: await dictionaries[locale](),
    };
});
