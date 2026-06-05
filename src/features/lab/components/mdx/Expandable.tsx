"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type LabAccent = "bigram" | "ngram";

/* Optional depth at the right emotional moment (Markov, Shannon, …). The whole
   summary row is a card-like control: accent dot, serif title, +/− disc. States
   read by FILL, not by piling on borders. Tokens only, accent via CSS vars so
   one component serves both bigram (green) and ngram (amber).
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
    accent: LabAccent;
    title: string;
    kicker?: string;
    open?: string;
    close?: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const SERIF = `font-[family-name:var(--${accent}-font-serif)]`;
    const MONO = `font-[family-name:var(--${accent}-font-mono)]`;

    return (
        <div className="my-9">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                className={cn("group w-full flex items-center gap-3.5 text-left rounded-[var(--accent-r-md)] border px-[18px] py-4 transition-colors duration-200")}
                style={{
                    // accent-keyed colors via CSS vars (Tailwind can't statically extract these)
                    borderRadius: `var(--${accent}-r-md)`,
                    borderColor: `var(--${accent}-rule)`,
                    background: `color-mix(in oklab, var(--${accent}-ink) 3%, transparent)`,
                }}
            >
                <span className="shrink-0 w-[9px] h-[9px] rounded-full" style={{ background: `var(--${accent}-accent)` }} />
                <div className="flex-1 min-w-0">
                    {kicker && (
                        <span className={cn(MONO, "block mb-1 text-[10px] uppercase tracking-[0.2em]")} style={{ color: `var(--${accent}-accent)` }}>
                            {kicker}
                        </span>
                    )}
                    <h3 className={cn(SERIF, "m-0 text-[18px] font-semibold leading-snug")} style={{ color: `var(--${accent}-ink)` }}>
                        {title}
                    </h3>
                </div>
                <span
                    className={cn(MONO, "shrink-0 inline-flex items-center gap-2 rounded-full pl-[13px] pr-1.5 py-1.5 text-[10.5px] uppercase tracking-[0.18em] border transition-colors duration-200")}
                    style={{
                        color: `var(--${accent}-accent)`,
                        borderColor: `color-mix(in oklab, var(--${accent}-accent) 32%, var(--${accent}-rule))`,
                        background: `color-mix(in oklab, var(--${accent}-accent) 8%, transparent)`,
                    }}
                >
                    {open ? closeLabel : openLabel}
                    <span
                        className="inline-grid place-items-center w-[18px] h-[18px] rounded-full leading-none"
                        style={{ background: `var(--${accent}-accent)`, color: `var(--${accent}-on-accent)` }}
                    >
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
                        <div className="pt-[20px] px-1">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
