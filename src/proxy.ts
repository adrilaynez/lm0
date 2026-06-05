import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

/* Next 16 renamed `middleware.ts` → `proxy.ts`. next-intl's middleware handles locale
   detection (URL prefix → NEXT_LOCALE cookie → Accept-Language → defaultLocale) and
   prefixing. The matcher excludes `api` (preserves the /api/v1/* rewrite to the backend),
   Next internals, and any file with an extension. */
export default createMiddleware(routing);

export const config = {
    matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
