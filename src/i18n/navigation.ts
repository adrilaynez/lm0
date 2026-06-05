import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/* Locale-aware drop-ins for next/link + next/navigation. Use THESE across the app so
   internal links/redirects automatically carry the active locale (adds /es when needed). */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
