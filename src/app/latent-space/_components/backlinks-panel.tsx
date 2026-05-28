import type { Note } from "@/lib/mdx";
import { cn } from "@/lib/utils";

import { NoteLink } from "./note-link";

interface BacklinksPanelProps {
  backlinks: Note[];
  className?: string;
}

function stripContent(content: string): string {
  return content
    .replace(/<[^>]*>/g, "")
    .replace(/^#{1,6}\s.*$/gm, "")
    .replace(/\[\[([a-z0-9-]+)\]\]/gi, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function BacklinksPanel({ backlinks, className }: BacklinksPanelProps) {
  if (backlinks.length === 0) return null;

  return (
    <section
      aria-label="Linked from"
      className={cn("flex w-full flex-col gap-4", className)}
    >
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--ls-accent)]">
        Linked from
      </p>

      <ul className="flex flex-col gap-2.5">
        {backlinks.map((note) => (
          <li key={note.slug} className="flex items-baseline gap-2.5">
            <span className="text-[var(--ls-fg-subtle)] shrink-0 text-[1.05rem]">·</span>
            <span className="font-[family-name:var(--ls-font-prose)] text-[1.05rem] leading-snug">
              <NoteLink
                slug={note.slug}
                title={note.title}
                preview={stripContent(note.content)}
                status={note.status}
              />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
