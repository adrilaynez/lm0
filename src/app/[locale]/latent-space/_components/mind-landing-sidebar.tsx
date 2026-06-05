import type { Note } from "@/lib/mdx";

import { MindGraph } from "./mind-graph";

interface MindLandingSidebarProps {
  notes: Note[];
}

export function MindLandingSidebar({ notes }: MindLandingSidebarProps) {
  const currentNote = notes[0]; // most recently updated

  if (!currentNote) return null;

  return (
    <div
      className="rounded-xl p-3 lg:p-4"
      style={{
        background: "color-mix(in oklch, var(--ls-bg-panel) 55%, transparent)",
        border: "1px solid color-mix(in oklch, var(--ls-border) 70%, transparent)",
      }}
    >
      <MindGraph notes={notes} currentSlug={currentNote.slug} variant="landing" />
    </div>
  );
}
