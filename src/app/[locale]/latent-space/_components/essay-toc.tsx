"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

interface EssayTocProps {
  items: TocItem[];
}

export function EssayToc({ items }: EssayTocProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );

    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav aria-label="Table of contents">
      <p className="mb-3 font-[family-name:var(--ls-font-meta)] text-[0.6rem] uppercase tracking-[0.25em] text-[var(--ls-fg-subtle)]">
        Table of Contents
      </p>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                "block py-0.5 font-[family-name:var(--ls-font-body)] text-[0.78rem] leading-snug transition-colors",
                item.level === 3 && "pl-3",
                activeId === item.id
                  ? "font-medium text-[var(--ls-accent)]"
                  : "text-[var(--ls-fg-subtle)] hover:text-[var(--ls-fg-muted)]",
              )}
            >
              {activeId === item.id && (
                <span aria-hidden className="mr-1.5 inline-block size-1 rounded-full bg-[var(--ls-accent)]" />
              )}
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
