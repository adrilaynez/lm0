import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { routing } from "@/i18n/routing";

import { getProject, getProjectSlugs } from "../projects-data";

import { ProjectDetail } from "./project-detail";

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://adrianlaynez.dev";

export function generateStaticParams() {
  return getProjectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const p = getProject(slug);
  if (!p) return { title: "Not found" };
  const lang = locale === "es" ? "es" : "en";
  const path = (l: string) =>
    l === routing.defaultLocale
      ? `${SITE_URL}/projects/${slug}`
      : `${SITE_URL}/${l}/projects/${slug}`;
  const title = `${p.name} | Adrián Laynez`;
  return {
    title,
    description: p.desc[lang],
    alternates: {
      canonical: path(lang),
      languages: {
        ...Object.fromEntries(routing.locales.map((l) => [l, path(l)])),
        "x-default": path(routing.defaultLocale),
      },
    },
    openGraph: {
      locale: lang,
      title,
      description: p.desc[lang],
      url: path(lang),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: p.desc[lang],
    },
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();
  return <ProjectDetail id={slug} />;
}
