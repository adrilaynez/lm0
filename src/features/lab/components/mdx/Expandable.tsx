"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import type { NarrativeAccent } from "@/features/lab/components/narrative-primitives";
import { cn } from "@/lib/utils";

const isTokenAccent = (a: NarrativeAccent): a is "bigram" | "ngram" => a === "bigram" || a === "ngram";

/* Literal-accent colors for the non-token chapters (MLP=violet, NN=rose, Transformer=cyan…). */
const LITERAL_ACCENT: Record<Exclude<NarrativeAccent, "bigram" | "ngram">, string> = {
    emerald: "#34d399",
    amber: "#fbbf24",
    rose: "#fb7185",
    violet: "#a78bfa",
    cyan: "#22d3ee",
};

/* Optional depth at the right emotional moment (Markov, Shannon, …). The whole
   summary row is a card-like control: accent dot, serif title, +/− disc. States
   read by FILL, not by piling on borders.

   bigram/ngram resolve their design tokens via CSS vars; the literal-accent chapters
   fall back to the neutral lab surface (--lab-*) tinted with the literal accent.
   Ported from the inline `ExpandableSection` in BigramNarrative. */
export function Expandable({
    accent,
    title,
    kicker,
    open: openLabel = "leer",
    close: closeLabel = "cerrar",
    defaultOpen = false,
    children,
}: {
    accent: NarrativeAccent;
    title: string;
    kicker?: string;
    open?: string;
    close?: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const token = isTokenAccent(accent);

    // Resolve the visual variables once, from either the token system or the literal palette.
    const c = token
        ? {
              serif: `font-[family-name:var(--${accent}-font-serif)]`,
              mono: `font-[family-name:var(--${accent}-font-mono)]`,
              accent: `var(--${accent}-accent)`,
              onAccent: `var(--${accent}-on-accent)`,
              ink: `var(--${accent}-ink)`,
              rule: `var(--${accent}-rule)`,
              radius: `var(--${accent}-r-md)`,
              tint: (p: number) => `color-mix(in oklab, var(--${accent}-accent) ${p}%, transparent)`,
              inkTint: `color-mix(in oklab, var(--${accent}-ink) 3%, transparent)`,
          }
        : (() => {
              const a = LITERAL_ACCENT[accent];
              return {
                  serif: "",
                  mono: "font-mono",
                  accent: a,
                  onAccent: "#0a0a0a",
                  ink: "var(--lab-text)",
                  rule: "var(--lab-border)",
                  radius: "0.75rem",
                  tint: (p: number) => `color-mix(in oklab, ${a} ${p}%, transparent)`,
                  inkTint: "var(--lab-card)",
              };
          })();

    return (
        <div className="my-9">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                className="group w-full flex items-center gap-3.5 text-left border px-[18px] py-4 transition-colors duration-200"
                style={{ borderRadius: c.radius, borderColor: c.rule, background: c.inkTint }}
            >
                <span className="shrink-0 w-[9px] h-[9px] rounded-full" style={{ background: c.accent }} />
                <div className="flex-1 min-w-0">
                    {kicker && (
                        <span className={cn(c.mono, "block mb-1 text-[10px] uppercase tracking-[0.2em]")} style={{ color: c.accent }}>
                            {kicker}
                        </span>
                    )}
                    <h3 className={cn(c.serif, "m-0 text-[18px] font-semibold leading-snug")} style={{ color: c.ink }}>
                        {title}
                    </h3>
                </div>
                <span
                    className={cn(c.mono, "shrink-0 inline-flex items-center gap-2 rounded-full pl-[13px] pr-1.5 py-1.5 text-[10.5px] uppercase tracking-[0.18em] border transition-colors duration-200")}
                    style={{ color: c.accent, borderColor: c.tint(32), background: c.tint(8) }}
                >
                    {open ? closeLabel : openLabel}
                    <span className="inline-grid place-items-center w-[18px] h-[18px] rounded-full leading-none" style={{ background: c.accent, color: c.onAccent }}>
                        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
                    </span>
                </span>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.38, ease: [0.25, 0, 0, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="pt-[20px] px-1">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
