import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArrowLeft, ArrowRight } from "lucide-react";

import { MDXContent } from "@/components/mdx-content";
import { Link } from "@/i18n/navigation";
import { getEssays, getNoteBySlug, getNoteSlugs } from "@/lib/mdx";

import { localizedMetadata } from "../../../_meta";
import { EssayCover } from "../../_components/essay-cover";
import { EssayToc, type TocItem } from "../../_components/essay-toc";
import { ReadingProgress } from "../../_components/reading-progress";

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateStaticParams() {
  const slugs = getNoteSlugs();
  return slugs.map((slug) => ({ slug: slug.replace(/\.mdx$/, "") }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const note = getNoteBySlug(slug);
  if (!note) return { title: "Not found" };
  return localizedMetadata({
    locale,
    path: `/latent-space/essays/${slug}`,
    title: `${note.title} | Latent Space`,
    description: note.description,
    type: "article",
  });
}

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function estimateReadMinutes(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

function toAnchor(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseToc(content: string): TocItem[] {
  return content
    .split("\n")
    .filter((line) => /^#{2,3} /.test(line))
    .map((line) => {
      const m = line.match(/^(#{2,3}) (.+)$/);
      if (!m) return null;
      return { level: m[1].length as 2 | 3, text: m[2].trim(), id: toAnchor(m[2].trim()) };
    })
    .filter((item): item is TocItem => item !== null);
}

export default async function EssayPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const note = getNoteBySlug(slug);

  if (!note || note.kind !== "essay") {
    notFound();
  }

  const allEssays = getEssays();
  const currentIdx = allEssays.findIndex((e) => e.slug === slug);
  const prevEssay = currentIdx < allEssays.length - 1 ? allEssays[currentIdx + 1] : null;
  const nextEssay = currentIdx > 0 ? allEssays[currentIdx - 1] : null;

  const readMinutes = estimateReadMinutes(note.content);
  const tocItems = parseToc(note.content);

  return (
    <section
      data-ls-mode="essays"
      className="relative min-h-svh w-full bg-[var(--ls-bg)] text-[var(--ls-fg)]"
    >
      <ReadingProgress />

      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--ls-border)] bg-[var(--ls-bg)]/90 px-6 py-3 backdrop-blur-sm">
        <Link
          href="/latent-space?mode=essays"
          className="inline-flex items-center gap-1.5 font-[family-name:var(--ls-font-meta)] text-[0.68rem] uppercase tracking-[0.18em] text-[var(--ls-fg-subtle)] transition-colors hover:text-[var(--ls-fg)]"
        >
          <ArrowLeft className="size-3" />
          Back to all essays
        </Link>
        <p className="font-[family-name:var(--ls-font-meta)] text-[0.62rem] uppercase tracking-[0.28em] text-[var(--ls-fg-subtle)]">
          {"{"} MY LATENT SPACE {"}"}
        </p>
        <div className="w-28" />
      </div>

      {/* Centered header */}
      <header className="mx-auto max-w-[75ch] px-6 pb-10 pt-14 sm:pt-16">
        <h1
          className="font-[family-name:var(--ls-font-display)] leading-[1.1] text-[var(--ls-fg)] text-left"
          style={{ fontSize: "clamp(2.81rem, 7.72vw, 5.06rem)", fontWeight: 400 }}
        >
          {note.title}
        </h1>
        {note.description && (
          <p className="mt-5 text-left text-[1.05rem] italic leading-relaxed text-[var(--ls-fg-muted)]">
            {note.description}
          </p>
        )}
        <p className="mt-5 font-[family-name:var(--ls-font-meta)] text-[0.68rem] tracking-wide text-[var(--ls-fg-subtle)]">
          {formatDate(note.date, locale)}
          {" · "}
          {readMinutes} min read
          {" · "}
          Essay
        </p>
      </header>

      {/* Cover image */}
      {note.image && (
        <div className="mx-auto mb-12 max-w-[680px] px-6">
          <EssayCover
            slug={note.slug}
            src={note.image}
            alt={note.title}
            aspect="wide"
            className="shadow-lg"
          />
        </div>
      )}

      {/* Content area: ToC sidebar + article */}
      <div className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)_200px]">
          {/* ToC sidebar — sticky */}
          <aside className="hidden lg:block">
            <div className="sticky top-16 pt-2">
              <EssayToc items={tocItems} />
            </div>
          </aside>

          {/* Article body — centered column */}
          <article className="min-w-0 py-2">
            <div className="prose-essays mx-auto max-w-[65ch]">
              <MDXContent source={note.content} />
            </div>
          </article>

          {/* Right spacer — keeps article truly centered */}
          <div className="hidden lg:block" />
        </div>
      </div>

      {/* Prev / Next navigation */}
      {(prevEssay || nextEssay) && (
        <nav
          aria-label="Essay navigation"
          className="mx-auto flex max-w-3xl items-center justify-between border-t border-[var(--ls-border)] px-6 py-10"
        >
          <div className="min-w-0 flex-1">
            {prevEssay && (
              <Link
                href={`/latent-space/essays/${prevEssay.slug}`}
                className="group flex flex-col gap-1"
              >
                <span className="inline-flex items-center gap-1.5 font-[family-name:var(--ls-font-meta)] text-[0.65rem] uppercase tracking-[0.2em] text-[var(--ls-accent)]">
                  <ArrowLeft className="size-3" /> Previous essay
                </span>
                <span className="font-[family-name:var(--ls-font-display)] text-[0.95rem] font-medium text-[var(--ls-fg-muted)] transition-colors group-hover:text-[var(--ls-fg)]">
                  {prevEssay.title}
                </span>
              </Link>
            )}
          </div>

          <span aria-hidden className="mx-8 text-[var(--ls-accent)] opacity-40 text-lg">
            ✦
          </span>

          <div className="min-w-0 flex-1 text-right">
            {nextEssay && (
              <Link
                href={`/latent-space/essays/${nextEssay.slug}`}
                className="group flex flex-col items-end gap-1"
              >
                <span className="inline-flex items-center gap-1.5 font-[family-name:var(--ls-font-meta)] text-[0.65rem] uppercase tracking-[0.2em] text-[var(--ls-accent)]">
                  Next essay <ArrowRight className="size-3" />
                </span>
                <span className="font-[family-name:var(--ls-font-display)] text-[0.95rem] font-medium text-[var(--ls-fg-muted)] transition-colors group-hover:text-[var(--ls-fg)]">
                  {nextEssay.title}
                </span>
              </Link>
            )}
          </div>
        </nav>
      )}

      {/* Page footer */}
      <div className="border-t border-[var(--ls-border)] py-8 text-center">
        <p className="font-[family-name:var(--ls-font-meta)] text-[0.6rem] uppercase tracking-[0.3em] text-[var(--ls-fg-subtle)]">
          {"{"} MY LATENT SPACE {"}"}
        </p>
      </div>
    </section>
  );
}
