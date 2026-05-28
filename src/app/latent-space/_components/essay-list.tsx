"use client";

import { useState } from "react";

import type { Note } from "@/lib/mdx";

import { EssayCategoryTabs } from "./essay-category-tabs";
import { EssayListRow } from "./essay-list-row";

interface EssayListProps {
  essays: Note[];
  totalCount: number;
}

function getTopTags(essays: Note[], limit = 4): string[] {
  const freq: Record<string, number> = {};
  for (const essay of essays) {
    for (const tag of essay.tags ?? []) {
      freq[tag] = (freq[tag] ?? 0) + 1;
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

export function EssayList({ essays, totalCount }: EssayListProps) {
  const topTags = getTopTags(essays);
  const categories = ["All", ...topTags];
  const [selected, setSelected] = useState("All");

  const filtered =
    selected === "All" ? essays : essays.filter((e) => e.tags?.includes(selected));

  return (
    <section className="flex flex-col gap-2">
      {/* Header — title + filter aligned at baseline */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 border-b border-[var(--ls-border)] pb-4">
        <h3 className="font-[family-name:var(--ls-font-display)] text-[1.9rem] font-semibold leading-none text-[var(--ls-fg)]">
          All Essays
        </h3>
        <EssayCategoryTabs
          categories={categories}
          selected={selected}
          onSelect={setSelected}
        />
      </div>

      {/* Rows */}
      <div>
        {filtered.map((essay, i) => (
          <EssayListRow
            key={essay.slug}
            essay={essay}
            index={totalCount - i}
          />
        ))}
      </div>
    </section>
  );
}
