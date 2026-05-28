import { cn } from "@/lib/utils";

interface TagsPanelProps {
  tags: string[];
  className?: string;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function TagsPanel({ tags, className }: TagsPanelProps) {
  if (tags.length === 0) return null;

  return (
    <section
      aria-label="Tags"
      className={cn("flex w-full flex-col gap-2.5", className)}
    >
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--ls-accent)]">
        Tags
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <li
            key={tag}
            className="rounded-md border border-[var(--ls-border)] bg-[var(--ls-bg-elevated)]/50 px-2 py-0.5 font-mono text-[0.7rem] text-[var(--ls-fg-muted)]"
          >
            {slugify(tag)}
          </li>
        ))}
      </ul>
    </section>
  );
}
