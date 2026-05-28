"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface MindTocProps {
  source: string;
  className?: string;
}

interface Heading {
  depth: 2 | 3;
  text: string;
  id: string;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extractHeadings(source: string): Heading[] {
  const noFences = source.replace(/```[\s\S]*?```/g, "");
  const lines = noFences.split("\n");
  const headings: Heading[] = [];
  for (const line of lines) {
    const m = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const depth = m[1].length === 2 ? 2 : 3;
    const text = m[2].trim();
    headings.push({ depth, text, id: slugify(text) });
  }
  return headings;
}

export function MindToc({ source, className }: MindTocProps) {
  const headings = extractHeadings(source);
  const [activeId, setActiveId] = useState<string>(headings[0]?.id ?? "");

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );

    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  if (headings.length === 0) return null;

  return (
    <nav
      aria-label="On this page"
      className={cn("flex w-full flex-col gap-3", className)}
    >
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--ls-accent)]">
        On this page
      </p>
      <ul className="flex flex-col gap-0">
        {headings.map((h) => {
          const isActive = activeId === h.id;
          return (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className={cn(
                  "group flex items-start gap-2.5 rounded-sm py-1.5 pr-2 transition-all duration-200",
                  h.depth === 3 && "pl-3",
                  isActive
                    ? "text-[var(--ls-fg)]"
                    : "text-[var(--ls-fg-subtle)] hover:text-[var(--ls-fg-muted)]",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-[0.45rem] size-1 shrink-0 rounded-full transition-all duration-200",
                    h.depth === 3 ? "size-0.5" : "size-1",
                    isActive
                      ? "bg-[var(--ls-accent)] scale-125"
                      : "bg-[var(--ls-fg-subtle)] group-hover:bg-[var(--ls-fg-muted)]",
                  )}
                />
                <span
                  className={cn(
                    "font-[family-name:var(--ls-font-ui)] leading-snug transition-all duration-200",
                    h.depth === 2 ? "text-[0.82rem]" : "text-[0.78rem]",
                    isActive && "font-medium",
                  )}
                >
                  {h.text}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
