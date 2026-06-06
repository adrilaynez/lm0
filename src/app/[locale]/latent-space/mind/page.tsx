import type { Metadata } from "next";

import { Link } from "@/i18n/navigation";
import { getMindNotes } from "@/lib/mdx";

import { localizedMetadata } from "../../_meta";
import { MindSidebar } from "../_components/mind-sidebar";
import { MindStream } from "../_components/mind-stream";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return localizedMetadata({
    locale,
    path: "/latent-space/mind",
    title: "Mind | Latent Space | Adrián Laynez",
    description:
      locale === "es"
        ? "Todas las notas, ideas y semillas — mi mente en progreso."
        : "All notes, ideas and seeds — my mind in progress.",
  });
}

export default function MindIndexPage() {
  const notes = getMindNotes();

  return (
    <main
      data-ls-mode="mind"
      className="relative min-h-svh w-full bg-[var(--ls-bg)] text-[var(--ls-fg)]"
    >
      <div className="grid w-full lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)] gap-0 min-h-svh">
        {/* Left sidebar */}
        <div
          className="hidden lg:flex flex-col h-svh overflow-hidden sticky top-0"
          style={{
            background: "var(--ls-bg-panel)",
            borderRight: "1px solid var(--ls-border-strong)",
          }}
        >
          <div className="flex flex-1 flex-col gap-2 p-4 overflow-y-auto scrollbar-none min-h-0">
            <MindSidebar notes={notes} />
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col py-8 px-4 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 font-mono text-[0.72rem] text-[var(--ls-fg-subtle)]">
            <Link
              href="/latent-space?mode=mind"
              className="transition-colors hover:text-[var(--ls-fg)]"
            >
              Latent Space
            </Link>
            <span>/</span>
            <span className="text-[var(--ls-accent)]">Mind</span>
          </nav>

          <div
            className="rounded-xl w-full p-6 lg:p-8"
            style={{
              background: "var(--ls-bg-panel)",
              border: "1px solid var(--ls-border-strong)",
              boxShadow: "var(--ls-shadow-panel)",
            }}
          >
            <MindStream notes={notes} emptyLabel="the garden is quiet right now." />
          </div>
        </div>
      </div>
    </main>
  );
}
