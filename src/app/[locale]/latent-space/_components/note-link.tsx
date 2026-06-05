"use client";

import Link from "next/link";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface NoteLinkProps {
  slug: string;
  title?: string;
  preview?: string;
  status?: string;
  broken?: boolean;
}

export function NoteLink({ slug, title, preview, status, broken }: NoteLinkProps) {
  if (broken) {
    return (
      <span
        className="text-[var(--ls-fg-subtle)] line-through decoration-dotted"
        title={`Broken wikilink: ${slug}`}
      >
        {slug}
      </span>
    );
  }

  return (
    <HoverCard openDelay={200} closeDelay={120}>
      <HoverCardTrigger asChild>
        <Link
          href={`/latent-space/mind/${slug}`}
          className="text-[var(--ls-accent)] underline decoration-[var(--ls-accent)]/35 decoration-[1px] underline-offset-[4px] transition-opacity hover:opacity-80 hover:decoration-[var(--ls-accent)]/70"
        >
          {title ?? slug}
        </Link>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        sideOffset={10}
        className="w-[460px] p-0 overflow-hidden rounded-xl"
        style={{
          // Inject mind theme tokens — portal renders outside [data-ls-mode="mind"]
          "--ls-bg-elevated": "oklch(0.215 0.010 70)",
          "--ls-bg": "oklch(0.175 0.008 70)",
          "--ls-border-strong": "oklch(1 0.04 50 / 14%)",
          "--ls-border": "oklch(1 0.04 50 / 7%)",
          "--ls-fg": "oklch(0.93 0.014 75)",
          "--ls-fg-body": "oklch(0.84 0.013 75)",
          "--ls-fg-subtle": "oklch(0.52 0.008 75)",
          "--ls-accent": "oklch(0.74 0.16 45)",
          background: "oklch(0.215 0.010 70)",
          border: "1px solid oklch(1 0.04 50 / 14%)",
          boxShadow: "0 20px 60px oklch(0 0 0 / 80%), 0 0 0 1px oklch(1 0.04 50 / 8%)",
          maxHeight: "66vh",
          display: "flex",
          flexDirection: "column",
        } as React.CSSProperties}
      >
        {/* Sticky header */}
        <div
          className="shrink-0 px-5 pt-5 pb-3"
          style={{
            background: "var(--ls-bg-elevated)",
            borderBottom: "1px solid var(--ls-border-strong)",
          }}
        >
          <p
            className="font-[family-name:var(--ls-font-display)] text-[1.05rem] font-semibold leading-snug"
            style={{ color: "var(--ls-fg)" }}
          >
            {title ?? slug}
          </p>
          {status && (
            <p
              className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.18em]"
              style={{ color: "var(--ls-fg-subtle)" }}
            >
              [{status}]
            </p>
          )}
        </div>

        {/* Scrollable body */}
        {preview && (
          <div className="flex-1 overflow-y-auto px-5 py-4" style={{ minHeight: 0 }}>
            <div
              className="font-[family-name:var(--ls-font-prose)] text-[0.93rem] leading-[1.82]"
              style={{ color: "var(--ls-fg-body)" }}
            >
              {preview.split("\n\n").map((para, i) => (
                <p key={i} style={{ marginBottom: "1rem" }}>{para.trim()}</p>
              ))}
            </div>
          </div>
        )}

        {/* Sticky footer */}
        <div
          className="shrink-0 px-5 py-3"
          style={{
            borderTop: "1px solid var(--ls-border-strong)",
            background: "var(--ls-bg-elevated)",
          }}
        >
          <Link
            href={`/latent-space/mind/${slug}`}
            className="font-mono text-[0.65rem] uppercase tracking-[0.16em] transition-opacity hover:opacity-70"
            style={{ color: "var(--ls-accent)" }}
          >
            Open note →
          </Link>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
