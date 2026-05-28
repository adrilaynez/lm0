"use client";

import { cn } from "@/lib/utils";

interface EssayCategoryTabsProps {
  categories: string[];
  selected: string;
  onSelect: (cat: string) => void;
}

export function EssayCategoryTabs({ categories, selected, onSelect }: EssayCategoryTabsProps) {
  return (
    <div className="flex items-center gap-2" role="tablist" aria-label="Filter essays by category">
      {categories.map((cat) => {
        const isActive = cat === selected;
        return (
          <button
            key={cat}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(cat)}
            className={cn(
              "relative px-3 py-1.5 font-[family-name:var(--ls-font-meta)] text-[0.95rem] transition-colors",
              isActive
                ? "font-bold text-[var(--ls-accent)]"
                : "font-normal text-[var(--ls-fg-subtle)] hover:text-[var(--ls-fg-muted)]",
            )}
          >
            {cat}
            {isActive && (
              <span
                aria-hidden
                className="absolute inset-x-3 bottom-0 h-px bg-[var(--ls-accent)]"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
