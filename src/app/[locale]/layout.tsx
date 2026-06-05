import type { Metadata } from "next";
import {
  Bebas_Neue,
  Geist,
  Geist_Mono,
  Inter,
  JetBrains_Mono,
  Playfair_Display,
  Silkscreen,
  Source_Serif_4,
  Space_Grotesk,
} from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LayoutShell } from "@/components/layout/layout-shell";
import { ThemeProvider } from "@/components/theme-provider";
import { routing } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://adrianlaynez.dev";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
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
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"], display: "swap" });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], display: "swap" });
const bebasNeue = Bebas_Neue({ variable: "--font-bebas", weight: "400", subsets: ["latin"], display: "swap" });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const silkscreen = Silkscreen({ variable: "--font-pixel", weight: ["400", "700"], subsets: ["latin"], display: "swap" });

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
  // hreflang alternates: default locale at root, others prefixed.
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, l === routing.defaultLocale ? SITE_URL : `${SITE_URL}/${l}`]),
  );
  return {
    metadataBase: new URL(SITE_URL),
    title: "Adrián Laynez | Research & Engineering",
    description: t("siteDescription"),
    alternates: {
      canonical: locale === routing.defaultLocale ? SITE_URL : `${SITE_URL}/${locale}`,
      languages,
    },
    openGraph: {
      locale,
      type: "website",
      title: "Adrián Laynez | Research & Engineering",
      description: t("siteDescription"),
      url: locale === routing.defaultLocale ? SITE_URL : `${SITE_URL}/${locale}`,
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

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} ${bebasNeue.variable} ${inter.variable} ${silkscreen.variable} ${sourceSerif.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <NextIntlClientProvider>
            <LayoutShell>{children}</LayoutShell>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
