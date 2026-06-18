import type { Metadata } from "next";
import {
  Bebas_Neue,
  Fraunces,
  Geist,
  Geist_Mono,
  IBM_Plex_Mono,
  Inter,
  JetBrains_Mono,
  Playfair_Display,
  Silkscreen,
  Source_Serif_4,
  Space_Mono,
} from "next/font/google";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { LayoutShell } from "@/components/layout/layout-shell";
import { ThemeProvider } from "@/components/theme-provider";
import { routing } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://adrianlaynez.dev";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
  style: ["normal", "italic"],
});
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});
// LM0 hero headline — a whispered editorial serif (Canela/Editorial New family feel).
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
});
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});
const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
// LM0's voice (landing narrator + chapter cameos). Plex is not a variable font: weights explicit.
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-lm0",
  weight: ["400", "500"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});
const silkscreen = Silkscreen({
  variable: "--font-pixel",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});
// LM0 redesign type system (Fontshare, self-hosted): Sentient = serif voice of the big
// truths, General Sans = human body copy, Space Mono = the machine / instrument register.
const sentient = localFont({
  variable: "--font-sentient",
  display: "swap",
  src: [
    { path: "../../fonts/lm0/Sentient-Variable.woff2", style: "normal" },
    { path: "../../fonts/lm0/Sentient-VariableItalic.woff2", style: "italic" },
  ],
});
const generalSans = localFont({
  variable: "--font-general-sans",
  display: "swap",
  src: "../../fonts/lm0/GeneralSans-Variable.woff2",
});
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  // hreflang alternates: default locale at root, others prefixed, plus x-default.
  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map((l) => [l, l === routing.defaultLocale ? SITE_URL : `${SITE_URL}/${l}`]),
  );
  languages["x-default"] = SITE_URL;
  const title = "Adrián Laynez | Research & Engineering";
  const description = t("siteDescription");
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: locale === routing.defaultLocale ? SITE_URL : `${SITE_URL}/${locale}`,
      languages,
    },
    openGraph: {
      locale,
      type: "website",
      title,
      description,
      url: locale === routing.defaultLocale ? SITE_URL : `${SITE_URL}/${locale}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  // Structured data: identifies the author + the site to search engines / rich results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        name: "Adrián Laynez",
        url: SITE_URL,
        jobTitle: "Research & Engineering",
        sameAs: ["https://github.com/adrilaynez"],
      },
      {
        "@type": "WebSite",
        name: "Adrián Laynez | Research & Engineering",
        url: SITE_URL,
        inLanguage: locale,
      },
    ],
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${fraunces.variable} ${jetbrainsMono.variable} ${bebasNeue.variable} ${inter.variable} ${silkscreen.variable} ${sourceSerif.variable} ${ibmPlexMono.variable} ${sentient.variable} ${generalSans.variable} ${spaceMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <NextIntlClientProvider>
            <LayoutShell>{children}</LayoutShell>
          </NextIntlClientProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
