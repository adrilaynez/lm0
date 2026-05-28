import type { Note } from "@/lib/mdx";

import { EssayHeroFeatured } from "./essay-hero-featured";
import { EssayList } from "./essay-list";

interface EssaysViewProps {
  essays: Note[];
  emptyLabel: string;
}

export function EssaysView({ essays, emptyLabel }: EssaysViewProps) {
  if (essays.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-[var(--ls-fg-muted)]">{emptyLabel}</p>
    );
  }

  const [featured, ...rest] = essays;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-14">
      <EssayHeroFeatured essay={featured} />
      {rest.length > 0 && <EssayList essays={rest} totalCount={essays.length} />}
    </div>
  );
}
