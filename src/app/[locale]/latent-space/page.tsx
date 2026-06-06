import type { Metadata } from "next";

import { getEssays, getMindNotes } from "@/lib/mdx";

import { localizedMetadata } from "../_meta";

import { EssaysView } from "./_components/essays-view";
import { MindLandingMain } from "./_components/mind-landing-main";
import { MindLandingSidebar } from "./_components/mind-landing-sidebar";
import { LatentSpaceShell } from "./latent-space-shell";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return localizedMetadata({
    locale,
    path: "/latent-space",
    title: locale === "es" ? "Latent Space | Adrián Laynez" : "Latent Space | Adrián Laynez",
    description:
      locale === "es"
        ? "Notas, ideas y pensamiento sin terminar."
        : "Notes, ideas, unfinished thinking.",
  });
}

interface PageProps {
  searchParams: Promise<{ mode?: string }>;
  params: Promise<{ locale: string }>;
}

export default async function LatentSpacePage({ searchParams }: PageProps) {
  const { mode: modeParam } = await searchParams;
  const initialMode = modeParam === "mind" ? "mind" : "essays";

  const essays = getEssays();
  const mind = getMindNotes();

  const essaysSlot = <EssaysView essays={essays} emptyLabel="No essays published yet." />;

  const mindSlot = <MindLandingMain notes={mind} />;

  const mindSidebarSlot = <MindLandingSidebar notes={mind} />;

  return (
    <LatentSpaceShell
      initialMode={initialMode}
      essaysSlot={essaysSlot}
      mindSlot={mindSlot}
      mindSidebarSlot={mindSidebarSlot}
    />
  );
}
