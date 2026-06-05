import type { Note } from "@/lib/mdx";

import { MindIntroPanel } from "./mind-intro-panel";
import { ThreadCardsGrid } from "./thread-cards-grid";

interface MindLandingMainProps {
  notes: Note[];
}

export function MindLandingMain({ notes }: MindLandingMainProps) {
  const threadNotes = notes.slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <MindIntroPanel />
      <ThreadCardsGrid notes={threadNotes} allNotes={notes} />
    </div>
  );
}
