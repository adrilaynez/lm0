import { ArrowLeft, ArrowRight, Grid2x2 } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Note } from "@/lib/mdx";

interface MindPrevNextProps {
  notes: Note[];
  currentSlug: string;
}

export function MindPrevNext({ notes, currentSlug }: MindPrevNextProps) {
  const idx = notes.findIndex((n) => n.slug === currentSlug);
  if (idx === -1) return null;

  const prev = idx > 0 ? notes[idx - 1] : null;
  const next = idx < notes.length - 1 ? notes[idx + 1] : null;

  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Adjacent notes"
      className="mt-20 grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-t border-[var(--ls-border)] pt-8"
    >
      {prev ? (
        <Link
          href={`/latent-space/mind/${prev.slug}`}
          className="group flex flex-col gap-1 rounded-md py-2 transition-colors hover:bg-[var(--ls-bg-elevated)]/40"
        >
          <span className="flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-[var(--ls-fg-subtle)]">
            <ArrowLeft className="size-3" /> prev
          </span>
          <span className="font-[family-name:var(--ls-font-ui)] text-sm text-[var(--ls-fg-muted)] transition-colors group-hover:text-[var(--ls-accent)]">
            {prev.title}
          </span>
        </Link>
      ) : (
        <span aria-hidden />
      )}

      <Link
        href="/latent-space?mode=mind"
        aria-label="All notes"
        className="group inline-flex size-9 items-center justify-center rounded-md border border-[var(--ls-border)] text-[var(--ls-fg-subtle)] transition-colors hover:border-[var(--ls-accent)] hover:text-[var(--ls-accent)]"
      >
        <Grid2x2 className="size-4" />
      </Link>

      {next ? (
        <Link
          href={`/latent-space/mind/${next.slug}`}
          className="group flex flex-col items-end gap-1 rounded-md py-2 text-right transition-colors hover:bg-[var(--ls-bg-elevated)]/40"
        >
          <span className="flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-[var(--ls-fg-subtle)]">
            next <ArrowRight className="size-3" />
          </span>
          <span className="font-[family-name:var(--ls-font-ui)] text-sm text-[var(--ls-fg-muted)] transition-colors group-hover:text-[var(--ls-accent)]">
            {next.title}
          </span>
        </Link>
      ) : (
        <span aria-hidden />
      )}
    </nav>
  );
}
