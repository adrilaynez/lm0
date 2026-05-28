import Link from "next/link";

import type { Note } from "@/lib/mdx";
import { cn } from "@/lib/utils";

import { ThreadMiniGraph } from "./thread-mini-graph";

const KIND_LABEL: Record<string, string> = {
  seed: "idea",
  evergreen: "note",
  essay: "essay",
};

const KIND_COLOR: Record<string, string> = {
  idea: "text-[var(--ls-accent)]",
  note: "text-[oklch(0.58_0.12_240)]",
  essay: "text-[oklch(0.55_0.10_160)]",
};

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface ThreadCardProps {
  note: Note;
  allNotes: Note[];
}

export function ThreadCard({ note, allNotes }: ThreadCardProps) {
  const kind = KIND_LABEL[note.kind] ?? "note";
  const tagColor = KIND_COLOR[kind] ?? KIND_COLOR.note;
  const updated = note.updated ?? note.date;

  return (
    <Link
      href={`/latent-space/mind/${note.slug}`}
      className="group flex flex-col rounded-lg border border-[var(--ls-border)]/55 p-3 transition-all duration-200 hover:border-[color-mix(in_oklch,var(--ls-accent)_35%,transparent)]"
      style={{
        background: "color-mix(in oklch, var(--ls-bg-panel) 45%, transparent)",
      }}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className={cn("font-mono text-[0.58rem] tracking-wide", tagColor)}>
          [{kind}]
        </span>
        <span className="font-mono text-[0.58rem] tracking-wide text-[var(--ls-fg-subtle)] opacity-60">
          {shortDate(updated)}
        </span>
      </div>

      <p className="line-clamp-2 font-mono text-[0.82rem] font-medium leading-snug text-[var(--ls-fg)] transition-colors duration-200 group-hover:text-[var(--ls-accent)]">
        {note.title}
      </p>

      {note.description && (
        <p className="mt-1.5 line-clamp-3 text-[0.7rem] leading-relaxed text-[var(--ls-fg-subtle)]">
          {note.description}
        </p>
      )}

      <div className="mt-auto pt-2">
        <ThreadMiniGraph notes={allNotes} currentSlug={note.slug} />
      </div>
    </Link>
  );
}
