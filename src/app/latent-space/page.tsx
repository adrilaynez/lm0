import type { Metadata } from "next";

import { getEssays, getMindNotes } from "@/lib/mdx";

import { EssaysView } from "./_components/essays-view";
import { MindLandingMain } from "./_components/mind-landing-main";
import { MindLandingSidebar } from "./_components/mind-landing-sidebar";
import { LatentSpaceShell } from "./latent-space-shell";

export const metadata: Metadata = {
  title: "Latent Space | Adrian Laynez",
  description: "Notes, ideas, unfinished thinking.",
};

interface PageProps {
  searchParams: Promise<{ mode?: string }>;
}

export default async function LatentSpacePage({ searchParams }: PageProps) {
  const { mode: modeParam } = await searchParams;
  const initialMode = modeParam === "mind" ? "mind" : "essays";

  const essays = getEssays();
  const mind = getMindNotes();

  const essaysSlot = (
    <EssaysView
      essays={essays}
      emptyLabel="No essays published yet."
    />
  );

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
