import "./globals.css";

import type { Metadata } from "next";

/* Root layout is a thin pass-through. The real <html>/<body> + providers live in
   app/[locale]/layout.tsx, which has the resolved locale. Next requires a root layout
   to exist, but with i18n routing the locale segment owns the document shell. */
export const metadata: Metadata = {
  title: "Adrian Laynez | Research & Engineering",
  description: "Personal website and research lab of Adrian Laynez.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
