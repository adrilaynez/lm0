import type { Metadata } from "next";

import { localizedMetadata } from "../_meta";

import { ProjectsContent } from "./projects-content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return localizedMetadata({
    locale,
    path: "/projects",
    title: locale === "es" ? "Proyectos | Adrián Laynez" : "Projects | Adrián Laynez",
    description:
      locale === "es"
        ? "Una colección de experimentos de investigación y proyectos de ingeniería."
        : "A collection of research experiments and engineering projects.",
  });
}

export default function ProjectsPage() {
  return <ProjectsContent />;
}
