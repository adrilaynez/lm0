import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getProject, getProjectSlugs } from "../projects-data";

import { ProjectDetail } from "./project-detail";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getProjectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return { title: "Not found" };
  return {
    title: `${p.name} | Adrián Laynez`,
    description: p.desc.en,
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();
  return <ProjectDetail id={slug} />;
}
