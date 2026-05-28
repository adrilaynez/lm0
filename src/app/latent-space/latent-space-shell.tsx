"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { useI18n } from "@/i18n/context";

import { LandingFooter } from "./_components/landing-footer";
import { MindGate } from "./_components/mind-gate";
import { ModeToggle, type Mode } from "./_components/mode-toggle";
import { WelcomeHero } from "./_components/welcome-hero";

const STORAGE_KEY = "ls-default-mode";

function isMode(value: string | null | undefined): value is Mode {
  return value === "essays" || value === "mind";
}

interface LatentSpaceShellProps {
  initialMode: Mode;
  essaysSlot: ReactNode;
  mindSlot: ReactNode;
  mindSidebarSlot?: ReactNode;
}

export function LatentSpaceShell({
  initialMode,
  essaysSlot,
  mindSlot,
  mindSidebarSlot,
}: LatentSpaceShellProps) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(initialMode);

  // First-load: if URL has no ?mode= but localStorage has a hint, adopt it.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromUrl = searchParams.get("mode");
    if (isMode(fromUrl)) {
      if (fromUrl !== mode) setMode(fromUrl);
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isMode(stored) && stored !== mode) {
      setMode(stored);
      const params = new URLSearchParams(searchParams.toString());
      params.set("mode", stored);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = useCallback(
    (next: Mode) => {
      if (next === mode) return;
      setMode(next);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, next);
      }
      const params = new URLSearchParams(searchParams.toString());
      params.set("mode", next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [mode, pathname, router, searchParams],
  );

  return (
    <section
      data-ls-mode={mode}
      className="relative min-h-svh w-full bg-[var(--ls-bg)] text-[var(--ls-fg)] transition-colors duration-500"
    >
      <div className="mx-auto flex min-h-svh max-w-6xl flex-col items-center gap-10 px-6 py-12 sm:py-16">
        <WelcomeHero mode={mode} />

        <div className="flex flex-col items-center gap-3">
          <span aria-hidden className="size-1.5 rounded-full bg-[var(--ls-accent)]" />
          <ModeToggle mode={mode} onChange={handleChange} />
          <p className="font-mono text-[0.75rem] uppercase tracking-[0.22em] text-[var(--ls-fg-subtle)]">
            {t("latentSpace.toggle.hint")}
          </p>
        </div>

        <div className="relative w-full">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full"
            >
              {mode === "essays" ? (
                <div className="w-full">{essaysSlot}</div>
              ) : (
                <MindGate>
                  <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                    <div>{mindSlot}</div>
                    {mindSidebarSlot && (
                      <div className="hidden lg:block">{mindSidebarSlot}</div>
                    )}
                  </div>
                </MindGate>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <LandingFooter />
      </div>
    </section>
  );
}
