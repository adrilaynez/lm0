import type { Metadata } from "next";

import Lm0PreviewClient from "./preview-client";

/* Dev/gate route for the LM0 v3 landing ("El nacimiento") — never indexed.
   The real landing replaces /lab via a one-line swap at the end (spec §6). */

export const metadata: Metadata = {
  title: "LM0 — preview",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Lm0PreviewClient />;
}
