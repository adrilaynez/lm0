import { Link } from "@/i18n/navigation";
import type { Note } from "@/lib/mdx";

import { ThreadCard } from "./thread-card";

interface ThreadCardsGridProps {
  notes: Note[];
  allNotes: Note[];
}

export function ThreadCardsGrid({ notes, allNotes }: ThreadCardsGridProps) {
  if (notes.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      {/* Section header */}
      <div>
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.25em] text-[var(--ls-accent)]">
          Current Threads
        </p>
        <p className="mt-1 font-mono text-[0.72rem] text-[var(--ls-fg-subtle)]">
          A few thoughts I&apos;m exploring right now.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {notes.slice(0, 6).map((note) => (
          <ThreadCard key={note.slug} note={note} allNotes={allNotes} />
        ))}
      </div>

      {/* View all link */}
      <div>
        <Link
          href="/latent-space/mind"
          className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-[var(--ls-accent)] transition-opacity hover:opacity-70"
        >
          view all threads →
        </Link>
      </div>
    </div>
  );
}
