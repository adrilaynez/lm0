"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { ModeToggle, type Mode } from "./mode-toggle";

const STORAGE_KEY = "ls-default-mode";

interface MindTopBarProps {
  /** Path-ish breadcrumb to show after the shell prompt, e.g. "the-shape-of-a-thought.md" */
  pathSuffix?: string;
}

export function MindTopBar({ pathSuffix }: MindTopBarProps) {
  const router = useRouter();

  const handleChange = useCallback(
    (next: Mode) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, next);
      }
      router.push(`/latent-space?mode=${next}`);
    },
    [router],
  );

  return (
    <div className="sticky top-0 z-40 w-full border-b border-[var(--ls-border)] bg-[var(--ls-bg)]/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-2.5 lg:px-8">
        <p className="flex items-baseline gap-1 truncate font-mono text-[0.7rem] text-[var(--ls-fg-subtle)]">
          <span className="text-[var(--ls-fg-muted)]">~/mind</span>
          {pathSuffix && (
            <>
              <span>/</span>
              <span className="truncate text-[var(--ls-fg-muted)]">{pathSuffix}</span>
            </>
          )}
        </p>

        <ModeToggle mode="mind" onChange={handleChange} compact />
      </div>
    </div>
  );
}
