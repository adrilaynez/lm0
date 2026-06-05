import { Link } from "@/i18n/navigation";
import type { Note } from "@/lib/mdx";
import { cn } from "@/lib/utils";

interface MindStreamProps {
  notes: Note[];
  emptyLabel: string;
  className?: string;
}

const KIND_LABEL: Record<string, string> = {
  seed: "idea",
  evergreen: "note",
  essay: "essay",
};

// Disciplined color usage: orange only for idea (active/important), others subdued
const KIND_COLOR: Record<string, string> = {
  idea: "text-[var(--ls-accent)]",
  note: "text-[oklch(0.58_0.12_240)]",
  research: "text-[oklch(0.58_0.12_290)]",
  essay: "text-[oklch(0.55_0.10_160)]",
};

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function MindStream({ notes, emptyLabel, className }: MindStreamProps) {
  if (notes.length === 0) {
    return (
      <p className="py-12 text-center text-sm italic text-[var(--ls-fg-muted)]">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Header — subtle, not competing */}
      <div className="mb-6 border-b border-[var(--ls-border)] pb-4">
        <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-[var(--ls-fg-subtle)]">
          mind <span className="mx-1 opacity-40">·</span>
          {notes.length} {notes.length === 1 ? "entry" : "entries"}
        </h2>
      </div>

      <ul className="flex flex-col">
        {notes.map((note) => {
          const updated = note.updated ?? note.date;
          const kind = KIND_LABEL[note.kind] ?? "note";
          const tagColor = KIND_COLOR[kind] ?? KIND_COLOR.note;
          return (
            <li
              key={note.slug}
              className="border-b border-[var(--ls-border)/50] last:border-b-0"
            >
              <Link
                href={`/latent-space/mind/${note.slug}`}
                className="group flex items-start gap-3.5 py-5 transition-all duration-300 hover:translate-x-0.5"
              >
                {/* Orange dot — only key signal */}
                <span
                  aria-hidden
                  className="mt-[0.45em] size-1.5 shrink-0 rounded-full bg-[var(--ls-accent)] opacity-70 transition-all duration-300 group-hover:opacity-100 group-hover:shadow-[0_0_8px_var(--ls-accent-glow)]"
                />

                {/* Content — clear 3-level hierarchy */}
                <span className="min-w-0 flex-1">
                  {/* Level 1: title — strong, readable */}
                  <span className="block font-mono text-[0.96rem] font-medium leading-snug text-[var(--ls-fg)] transition-colors duration-200 group-hover:text-[var(--ls-accent)]">
                    {note.title}
                  </span>
                  {/* Level 2: description — clearly muted */}
                  {note.description && (
                    <span className="mt-1 block text-[0.79rem] leading-relaxed text-[var(--ls-fg-subtle)] opacity-80">
                      {note.description}
                    </span>
                  )}
                </span>

                {/* Level 3: metadata — most subtle */}
                <span className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
                  <span className={cn("font-mono text-[0.6rem] tracking-wide", tagColor)}>
                    [{kind}]
                  </span>
                  <span className="font-mono text-[0.6rem] tracking-wide text-[var(--ls-fg-subtle)] opacity-60">
                    {shortDate(updated)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex justify-center">
        <Link
          href="/latent-space/mind"
          className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-[var(--ls-fg-subtle)] transition-colors duration-200 hover:text-[var(--ls-accent)]"
        >
          view all notes →
        </Link>
      </div>
    </div>
  );
}
