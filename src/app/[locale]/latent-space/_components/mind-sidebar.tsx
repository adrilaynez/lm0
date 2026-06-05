"use client";

import { useEffect, useMemo, useState } from "react";

import { ChevronRight, Search, Sparkles } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import type { Note } from "@/lib/mdx";
import { cn } from "@/lib/utils";

interface MindSidebarProps {
  notes: Note[];
  currentSlug?: string;
  className?: string;
}

interface Folder {
  name: string;
  notes: Note[];
}

const STORAGE_PREFIX = "ls-folder-open:";

function groupIntoFolders(notes: Note[]): Folder[] {
  const map = new Map<string, Note[]>();
  for (const note of notes) {
    const folder = (note.tags[0] ?? "uncategorized").toLowerCase();
    if (!map.has(folder)) map.set(folder, []);
    map.get(folder)!.push(note);
  }
  return [...map.entries()]
    .map(([name, list]) => ({
      name,
      notes: list.sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function SidebarSectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--ls-accent)]">
      {children}
    </p>
  );
}

export function MindSidebar({ notes, currentSlug, className }: MindSidebarProps) {
  const pathname = usePathname();
  const isIndex = pathname === "/latent-space" || pathname === "/latent-space/mind";
  const [query, setQuery] = useState("");
  const folders = useMemo(() => groupIntoFolders(notes), [notes]);

  const currentFolder = useMemo(() => {
    if (!currentSlug) return null;
    return folders.find((f) => f.notes.some((n) => n.slug === currentSlug))?.name ?? null;
  }, [folders, currentSlug]);

  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const f of folders) initial[f.name] = true;
    return initial;
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHydrated(true);
    setOpenMap((prev) => {
      const next = { ...prev };
      for (const f of folders) {
        const stored = window.localStorage.getItem(STORAGE_PREFIX + f.name);
        if (stored === "0") next[f.name] = false;
        if (stored === "1") next[f.name] = true;
      }
      if (currentFolder) next[currentFolder] = true;
      return next;
    });
  }, [folders, currentFolder]);

  const toggleFolder = (name: string) => {
    setOpenMap((prev) => {
      const next = !prev[name];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_PREFIX + name, next ? "1" : "0");
      }
      return { ...prev, [name]: next };
    });
  };

  // Search results
  const trimmed = query.trim().toLowerCase();
  const searchResults = trimmed.length > 0
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(trimmed) ||
          n.tags.some((t) => t.toLowerCase().includes(trimmed)) ||
          (n.description ?? "").toLowerCase().includes(trimmed)
      )
    : null;

  return (
    <aside className={cn("flex h-full w-full flex-col gap-4 font-[family-name:var(--ls-font-ui)] text-[0.88rem]", className)}>
      {/* Brand */}
      <header className="flex flex-col gap-0 px-3 pt-6 pb-4">
        <h2 className="ls-pixel-title text-[1.15rem] leading-tight text-[var(--ls-fg)]">
          My Latent Space
        </h2>
      </header>

      {/* Search */}
      <label className="group mx-3 flex items-center gap-2 rounded-lg border border-[var(--ls-border-strong)] bg-[var(--ls-bg-elevated)]/40 px-3 py-2 transition-all duration-200 focus-within:border-[var(--ls-accent)]/60 focus-within:bg-[var(--ls-bg-elevated)]/70 focus-within:shadow-[0_0_0_2px_var(--ls-accent-glow)]">
        <Search aria-hidden className="size-3.5 shrink-0 text-[var(--ls-fg-subtle)]" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes..."
          aria-label="Search notes"
          className="w-full min-w-0 bg-transparent text-[0.83rem] text-[var(--ls-fg)] outline-none placeholder:text-[var(--ls-fg-subtle)]"
        />
        {!query && (
          <kbd className="hidden shrink-0 rounded border border-[var(--ls-border-strong)] px-1.5 py-0.5 font-mono text-[0.6rem] text-[var(--ls-fg-subtle)] sm:inline">
            ⌘K
          </kbd>
        )}
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="shrink-0 text-[var(--ls-fg-subtle)] hover:text-[var(--ls-fg-muted)] text-[0.75rem]"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </label>

      {/* Search results */}
      {searchResults !== null ? (
        <div className="flex flex-col gap-0.5 px-3">
          {searchResults.length === 0 ? (
            <p className="px-2 py-3 text-[0.8rem] text-[var(--ls-fg-subtle)] italic">No results for "{query}"</p>
          ) : (
            <>
              <p className="px-2 mb-1 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[var(--ls-fg-subtle)]">
                {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
              </p>
              {searchResults.map((note) => {
                const isActive = note.slug === currentSlug;
                return (
                  <Link
                    key={note.slug}
                    href={`/latent-space/mind/${note.slug}`}
                    onClick={() => setQuery("")}
                    className={cn(
                      "block rounded-sm px-2 py-1.5 text-[0.87rem] leading-snug transition-all duration-200",
                      isActive
                        ? "border-l-2 border-[var(--ls-accent)] -ml-px pl-[calc(0.5rem-1px)] text-[var(--ls-accent)]"
                        : "text-[var(--ls-fg-muted)] hover:text-[var(--ls-fg)] hover:translate-x-0.5",
                    )}
                  >
                    {note.title}
                    {note.tags[0] && (
                      <span className="block font-mono text-[0.6rem] text-[var(--ls-fg-subtle)] mt-0.5 uppercase tracking-wider">
                        {note.tags[0]}
                      </span>
                    )}
                  </Link>
                );
              })}
            </>
          )}
        </div>
      ) : (
        <>
          {/* MIND — All */}
          <nav aria-label="Mind" className="flex flex-col gap-0.5 px-1">
            <SidebarSectionHeader>Mind</SidebarSectionHeader>
            <Link
              href="/latent-space?mode=mind"
              className={cn(
                "group flex items-center gap-2 rounded-sm px-2 py-1 transition-all duration-200",
                isIndex
                  ? "bg-[var(--ls-accent-soft)] text-[var(--ls-fg)] shadow-[inset_2px_0_0_var(--ls-accent)]"
                  : "text-[var(--ls-fg-muted)] hover:bg-[var(--ls-bg-elevated)]/50 hover:text-[var(--ls-fg)]",
              )}
            >
              <Sparkles className={cn("size-3.5 shrink-0", isIndex ? "text-[var(--ls-accent)]" : "text-[var(--ls-fg-subtle)]")} />
              <span className="text-[0.9rem]">All</span>
            </Link>
          </nav>

          {/* Categories */}
          <nav aria-label="Categories" className="flex flex-col gap-0.5 px-1">
            <SidebarSectionHeader>Categories</SidebarSectionHeader>

            {folders.map((folder) => {
              const isOpen = hydrated ? !!openMap[folder.name] : true;
              return (
                <div key={folder.name}>
                  <button
                    type="button"
                    onClick={() => toggleFolder(folder.name)}
                    className="group flex w-full items-center gap-1.5 rounded-sm px-2 py-1 text-left text-[var(--ls-fg-muted)] transition-colors hover:bg-[var(--ls-bg-elevated)]/40 hover:text-[var(--ls-fg)]"
                    aria-expanded={isOpen}
                  >
                    <ChevronRight
                      aria-hidden
                      className={cn(
                        "size-3 shrink-0 text-[var(--ls-fg-subtle)] transition-transform duration-200",
                        isOpen && "rotate-90",
                      )}
                    />
                    <span className="text-[0.9rem]">{folder.name}</span>
                  </button>

                  {isOpen && (
                    <ul className="mt-0.5 flex flex-col gap-0 border-l border-[var(--ls-border-strong)] ml-4">
                      {folder.notes.map((note) => {
                        const isActive = note.slug === currentSlug;
                        return (
                          <li key={note.slug}>
                            <Link
                              href={`/latent-space/mind/${note.slug}`}
                              className={cn(
                                "block py-1.5 pl-4 pr-2 text-[0.87rem] leading-snug transition-all duration-200",
                                isActive
                                  ? "border-l-2 border-[var(--ls-accent)] -ml-px text-[var(--ls-accent)]"
                                  : "text-[var(--ls-fg)] opacity-70 hover:opacity-100 hover:translate-x-0.5",
                              )}
                            >
                              {note.title}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </nav>
        </>
      )}
    </aside>
  );
}

export function MindSidebarFooter() {
  return null;
}
