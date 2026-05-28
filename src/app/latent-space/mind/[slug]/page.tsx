import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getBacklinksFor,
  getMindNotes,
  getNoteBySlug,
  getNoteSlugs,
} from "@/lib/mdx";

import { BacklinksPanel } from "../../_components/backlinks-panel";
import { MindGraph } from "../../_components/mind-graph";
import { MindMDX } from "../../_components/mind-mdx";
import { MindSidebar } from "../../_components/mind-sidebar";
import { MindToc } from "../../_components/mind-toc";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getNoteSlugs().map((file) => ({ slug: file.replace(/\.mdx$/, "") }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const note = getNoteBySlug(slug);
  if (!note) return { title: "Not found" };
  return {
    title: `${note.title} | Mind | Latent Space`,
    description: note.description,
  };
}

const KIND_LABEL: Record<string, string> = {
  seed: "idea",
  evergreen: "note",
  essay: "essay",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}


export default async function MindNotePage({ params }: PageProps) {
  const { slug } = await params;
  const note = getNoteBySlug(slug);

  if (!note || (note.kind !== "seed" && note.kind !== "evergreen")) {
    notFound();
  }

  const allMind = getMindNotes();
  const backlinks = getBacklinksFor(slug);
  const kindLabel = KIND_LABEL[note.kind] ?? "note";

  return (
    <main
      data-ls-mode="mind"
      className="relative min-h-svh w-full bg-[var(--ls-bg)] text-[var(--ls-fg)]"
    >
      {/* Full-bleed 3-pane */}
      <div className="grid w-full lg:grid-cols-[15rem_minmax(0,52rem)_19rem] xl:grid-cols-[17rem_minmax(0,56rem)_22rem] gap-0 min-h-svh justify-center">
        {/* Left sidebar */}
        <div
          className="hidden lg:flex flex-col h-svh overflow-hidden sticky top-0"
          style={{
            background: "var(--ls-bg-panel)",
            borderRight: "1px solid var(--ls-border-strong)",
          }}
        >
          <div className="flex flex-1 flex-col gap-2 p-4 overflow-y-auto scrollbar-none min-h-0">
            <MindSidebar notes={allMind} currentSlug={note.slug} />
          </div>
        </div>

        {/* Center — flush content, no card */}
        <div className="flex flex-col">
          <article
            className="w-full py-12 flex-1"
            style={{ background: "var(--ls-bg-panel)" }}
          >
            {/* Centered reading column */}
            <div className="mx-auto w-full max-w-[42rem] px-6 lg:px-8">
              <header className="mb-12 flex flex-col gap-5">
                {/* Eyebrow: kind only */}
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[var(--ls-accent)] font-semibold">
                  {kindLabel}
                </p>

                {/* Title — warm beige, semibold */}
                <h1 className="font-serif text-[2.2rem] font-semibold leading-[1.1] tracking-[-0.025em] text-[oklch(0.92_0.018_75)] sm:text-[2.6rem] lg:text-[3rem]">
                  {note.title}
                </h1>

                {/* Subtitle — large serif, well visible */}
                {note.description && (
                  <p className="font-serif text-[1.35rem] font-normal leading-[1.45] text-[var(--ls-fg-muted)] sm:text-[1.5rem]">
                    {note.description}
                  </p>
                )}

                <hr className="border-[var(--ls-border)] mt-2" />

                {/* Meta row: tags left, date right */}
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-[0.85rem] font-[family-name:var(--ls-font-ui)]">
                  <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                    {note.tags.map((tag) => (
                      <li key={tag}>
                        <span className="capitalize transition-opacity hover:opacity-80" style={{ color: "color-mix(in oklch, var(--ls-accent) 80%, var(--ls-fg))" }}>
                          {tag}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <span className="text-[var(--ls-fg-subtle)]">
                    {formatDate(note.date)}
                  </span>
                </div>
              </header>

              <div className="prose-mind w-full">
                <MindMDX source={note.content} />
              </div>

              {backlinks.length > 0 && (
                <div className="mt-16 pt-10 border-t border-[var(--ls-border)]">
                  <BacklinksPanel backlinks={backlinks} />
                </div>
              )}
            </div>
          </article>
        </div>

        {/* Right sidebar */}
        <div
          className="hidden lg:flex flex-col h-svh overflow-hidden sticky top-0"
          style={{
            background: "var(--ls-bg-panel)",
            borderLeft: "1px solid var(--ls-border-strong)",
          }}
        >
          <div className="flex flex-col gap-0 overflow-y-auto scrollbar-none h-full">
            <div className="p-5 border-b border-[var(--ls-border-strong)]">
              <MindGraph notes={allMind} currentSlug={note.slug} />
            </div>
            <div className="p-5">
              <MindToc source={note.content} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
