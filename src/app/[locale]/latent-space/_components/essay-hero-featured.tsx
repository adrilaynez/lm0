import { Calendar, Clock } from "lucide-react";
import Link from "next/link";

import type { Note } from "@/lib/mdx";

import { EssayCover } from "./essay-cover";
import { estimateReadMinutes, formatDateLong } from "./utils";

interface EssayHeroFeaturedProps {
  essay: Note;
}

export function EssayHeroFeatured({ essay }: EssayHeroFeaturedProps) {
  const readMin = estimateReadMinutes(essay.content);

  return (
    <article
      className="grid grid-cols-1 overflow-hidden rounded-2xl border border-[var(--ls-border)] bg-[var(--ls-bg-elevated)] lg:grid-cols-[1fr_1fr]"
      style={{
        boxShadow: "0 0 0 1px oklch(0.20 0.04 265 / 0.05)",
        minHeight: "clamp(380px, 44vw, 500px)",
      }}
    >
      {/* Text — left, fully symmetric spacing via justify-between */}
      <div className="flex flex-col justify-between p-10 lg:px-12 lg:py-10">

        {/* Top block */}
        <div className="flex flex-col gap-6">
          {/* Label — sans-serif, bright blue */}
          <p className="font-[family-name:var(--ls-font-meta)] text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--ls-accent)]">
            Latest Essay
          </p>

          {/* Title — Playfair, generous line-height */}
          <h2
            className="font-[family-name:var(--ls-font-display)] text-[var(--ls-fg)]"
            style={{ fontSize: "clamp(2.4rem, 4.8vw, 3.6rem)", fontWeight: 500, lineHeight: 1.12, letterSpacing: "-0.02em" }}
          >
            {essay.title}
          </h2>

          {/* Description — sans-serif, dark gray */}
          {essay.description && (
            <p className="font-[family-name:var(--ls-font-body)] text-[1rem] leading-[1.75] text-[var(--ls-fg-muted)]">
              {essay.description}
            </p>
          )}
        </div>

        {/* Bottom block — meta + link */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-[family-name:var(--ls-font-meta)] text-[0.84rem] text-[var(--ls-fg-subtle)]">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5 shrink-0" />
              {formatDateLong(essay.date)}
            </span>
            <span aria-hidden>·</span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0" />
              {readMin} min read
            </span>
            <span aria-hidden>·</span>
            <span>Essay</span>
          </div>

          <Link
            href={`/latent-space/essays/${essay.slug}`}
            className="w-fit font-[family-name:var(--ls-font-meta)] text-[1rem] font-bold text-[var(--ls-accent)] transition-opacity hover:opacity-70"
          >
            Read essay →
          </Link>
        </div>
      </div>

      {/* Cover — right, inset with generous padding to appear contained */}
      <div className="flex items-center justify-center p-6 lg:p-8">
        <EssayCover
          slug={essay.slug}
          src={essay.image}
          alt={essay.title}
          aspect="card"
          className="w-full rounded-xl shadow-sm"
        />
      </div>
    </article>
  );
}
