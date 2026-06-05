"use client";

import { useEffect, useId, useRef } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { useI18n } from "@/i18n/context";
import { cn } from "@/lib/utils";

export type Mode = "essays" | "mind";

interface ModeToggleProps {
  mode: Mode;
  onChange: (next: Mode) => void;
  className?: string;
  /** When true, render a smaller version (sticky header). */
  compact?: boolean;
}

const MODES: Mode[] = ["mind", "essays"];

export function ModeToggle({ mode, onChange, className, compact = false }: ModeToggleProps) {
  const { t } = useI18n();
  const groupId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard: ←/→ swap, Space/Enter toggles current focus.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const handler = (e: KeyboardEvent) => {
      if (!node.contains(document.activeElement)) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onChange("mind");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onChange("essays");
      } else if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        onChange(mode === "essays" ? "mind" : "essays");
      }
    };

    node.addEventListener("keydown", handler);
    return () => node.removeEventListener("keydown", handler);
  }, [mode, onChange]);

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label={t("latentSpace.toggle.label")}
      className={cn(
        "relative inline-flex select-none items-center rounded-full border border-[var(--ls-border-strong)] bg-[var(--ls-bg-elevated)]/70 p-1 text-sm shadow-[inset_0_1px_0_oklch(1_0_0/8%),0_2px_12px_oklch(0_0_0/30%)]",
        compact ? "gap-0" : "gap-1",
        className,
      )}
    >
      {MODES.map((m) => {
        const active = m === mode;
        const label = t(`latentSpace.toggle.${m}`);
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(m)}
            className={cn(
              "relative z-10 cursor-pointer rounded-full font-medium transition-colors",
              compact ? "px-3 py-1 text-xs" : "px-5 py-2 text-sm",
              active
                ? "text-[var(--ls-bg)] font-semibold"
                : "text-[var(--ls-fg-subtle)] hover:text-[var(--ls-fg-muted)]",
            )}
          >
            <span className="relative z-10">{label}</span>
            {active && (
              <>
                <motion.span
                  layoutId={`ls-knob-${groupId}`}
                  className="absolute inset-0 -z-0 rounded-full bg-[var(--ls-accent)]"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
                <AnimatePresence>
                  <motion.span
                    key={`ripple-${m}`}
                    aria-hidden
                    initial={{ scale: 1, opacity: 0.35 }}
                    animate={{ scale: 1.4, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="pointer-events-none absolute inset-0 rounded-full bg-[var(--ls-accent)]"
                  />
                </AnimatePresence>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
