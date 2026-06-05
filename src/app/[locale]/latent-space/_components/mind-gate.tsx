"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const STORAGE_KEY = "ls-mind-entered";

interface MindGateProps {
  children: React.ReactNode;
}

export function MindGate({ children }: MindGateProps) {
  const [hydrated, setHydrated] = useState(false);
  const [entered, setEntered] = useState(true);

  useEffect(() => {
    setHydrated(true);
    const flag = window.localStorage.getItem(STORAGE_KEY);
    setEntered(flag === "1");
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (entered) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        enter();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, entered]);

  const enter = () => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setEntered(true);
  };

  if (!hydrated) {
    // Avoid hydration mismatch — don't decide until we know the flag.
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {entered ? (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full"
        >
          {children}
        </motion.div>
      ) : (
        <motion.section
          key="gate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.22, 0.8, 0.32, 1] }}
          className="flex min-h-[60svh] w-full flex-col items-center justify-center gap-8 px-6 text-center"
        >
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="font-pixel text-4xl tracking-wide sm:text-5xl"
          >
            WELCOME TO MY MIND
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="max-w-md space-y-2 text-base leading-relaxed text-[var(--ls-fg-muted)]"
          >
            <p>This is not a blog.</p>
            <p>This is how I think.</p>
          </motion.div>

          <motion.button
            type="button"
            onClick={enter}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="group relative inline-flex items-center gap-2 rounded-full border border-[var(--ls-border)] bg-[var(--ls-bg-elevated)] px-7 py-2.5 text-sm font-medium text-[var(--ls-fg)] transition-colors hover:border-[var(--ls-accent)] hover:text-[var(--ls-accent)]"
            autoFocus
          >
            <span>Enter</span>
            <span aria-hidden className="font-mono text-[var(--ls-fg-subtle)] transition-colors group-hover:text-[var(--ls-accent)]">
              ↵
            </span>
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-[var(--ls-fg-subtle)]"
          >
            press enter or space
          </motion.p>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
