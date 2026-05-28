import Link from "next/link";

import type { Note } from "@/lib/mdx";

import { EssayCover } from "./essay-cover";
import { estimateReadMinutes, formatDateLong } from "./utils";

interface EssayListRowProps {
  essay: Note;
  index: number;
}

export function EssayListRow({ essay, index }: EssayListRowProps) {
  const readMin = estimateReadMinutes(essay.content);

  return (
    <Link
      href={`/latent-space/essays/${essay.slug}`}
      className="group grid items-start gap-8 border-b border-[var(--ls-border)] py-10 last:border-b-0"
      style={{ gridTemplateColumns: "2.4rem minmax(0, 480px) 1fr" }}
    >
      {/* Index — small, sans-serif, top-aligned */}
      <span
        aria-hidden
        className="mt-[0.55rem] font-[family-name:var(--ls-font-meta)] text-[0.85rem] font-normal leading-none text-[var(--ls-accent)]"
      >
        {String(index).padStart(2, "0")}
      </span>

      {/* Content — hard max-width so text doesn't stretch too far */}
      <div className="flex flex-col gap-3">
        <h4 className="font-[family-name:var(--ls-font-display)] text-[2rem] font-semibold leading-[1.1] text-[var(--ls-fg)] transition-colors group-hover:text-[var(--ls-accent)]">
          {essay.title}
        </h4>
        {essay.description && (
          <p className="font-[family-name:var(--ls-font-body)] text-[1.05rem] leading-[1.7] text-[var(--ls-fg-muted)]">
            {essay.description}
          </p>
        )}
        <p className="mt-0.5 font-[family-name:var(--ls-font-meta)] text-[0.9rem] text-[var(--ls-fg-subtle)]">
          {formatDateLong(essay.date)}
          {" · "}
          {readMin} min read
          {essay.tags && essay.tags.length > 0 && (
            <> · {essay.tags.slice(0, 3).join(", ")}</>
          )}
        </p>
      </div>

      {/* Thumbnail — fills the 1fr column, sits right after text */}
      <div className="hidden sm:flex sm:items-start sm:justify-end">
        <EssayCover
          slug={essay.slug}
          src={essay.image}
          alt={essay.title}
          aspect="wide"
          className="w-full max-w-[340px] rounded-xl"
        />
      </div>
    </Link>
  );
}
