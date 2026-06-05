"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   ChapterSwitcher

   Collapses the lab's five chapter tabs into a single elegant control —
   "Capítulo 1 · Bigrama ▾" — that opens a refined menu listing every chapter
   with its index and accent dot. One focal point; hides the complexity; scales.

   Accent is per chapter and theme-aware (literal colors so it never depends on a
   token scope): darker shades on the cream light field, brighter on dark slate.
   ───────────────────────────────────────────── */

export type ChapterModel = { id: string; label: string; href: string };

type LabTheme = "dark" | "light";

/** Per-chapter accent, tuned for contrast on each theme's background. */
const ACCENT: Record<string, { light: string; dark: string }> = {
    bigram: { light: "#2f6b45", dark: "#46b885" }, // editorial green
    ngram: { light: "#b45309", dark: "#fbbf24" }, // amber
    "neural-networks": { light: "#be123c", dark: "#fb7185" }, // rose
    mlp: { light: "#6d28d9", dark: "#a78bfa" }, // violet
    transformer: { light: "#0e7490", dark: "#34d3ee" }, // cyan
};
const NEUTRAL = { light: "#6b6256", dark: "rgba(255,255,255,0.42)" };

export function accentOf(id: string | null, theme: LabTheme): string {
    if (id && ACCENT[id]) return ACCENT[id][theme];
    return NEUTRAL[theme];
}

const pad2 = (n: number) => String(n).padStart(2, "0");

export function ChapterSwitcher({
    models,
    pathname,
    theme,
    chapterWord,
    menuLabel,
}: {
    models: ChapterModel[];
    pathname: string | null;
    theme: LabTheme;
    chapterWord: string; // "Capítulo" / "Chapter"
    menuLabel: string; // "Elegir capítulo" / "Choose chapter"
}) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
    const reduce = useReducedMotion();

    const activeIndex = useMemo(
        () => models.findIndex((m) => pathname?.startsWith(m.href)),
        [models, pathname]
    );
    const activeModel = activeIndex >= 0 ? models[activeIndex] : null;
    const activeHex = accentOf(activeModel?.id ?? null, theme);

    // Close on outside click.
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // Focus the active (or first) item when the menu opens.
    useEffect(() => {
        if (!open) return;
        const target = activeIndex >= 0 ? activeIndex : 0;
        // rAF so the element is mounted before we focus it.
        const id = requestAnimationFrame(() => itemRefs.current[target]?.focus());
        return () => cancelAnimationFrame(id);
    }, [open, activeIndex]);

    const onMenuKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
            triggerRef.current?.focus();
            return;
        }
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            const items = itemRefs.current.filter(Boolean) as HTMLAnchorElement[];
            const current = items.indexOf(document.activeElement as HTMLAnchorElement);
            const next =
                e.key === "ArrowDown"
                    ? (current + 1) % items.length
                    : (current - 1 + items.length) % items.length;
            items[next]?.focus();
        }
    };

    return (
        <div className="relative" ref={rootRef}>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={menuLabel}
                className={cn(
                    "group flex items-center gap-2.5 rounded-full py-1.5 pl-3 pr-2.5",
                    "border border-transparent transition-colors duration-200",
                    "hover:border-[var(--lab-border)] hover:bg-[var(--lab-surface)]",
                    "focus-visible:outline-none focus-visible:border-[var(--lab-border)] focus-visible:bg-[var(--lab-surface)]",
                    open && "border-[var(--lab-border)] bg-[var(--lab-surface)]"
                )}
            >
                <span
                    aria-hidden
                    className="h-[7px] w-[7px] shrink-0 rounded-full"
                    style={{ backgroundColor: activeHex }}
                />
                <span className="flex items-baseline gap-1.5 leading-none">
                    {activeModel ? (
                        <>
                            <span className="hidden font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--lab-text-subtle)] [font-variant-numeric:lining-nums] sm:inline">
                                {chapterWord} {activeIndex + 1}
                            </span>
                            <span className="hidden text-[var(--lab-text-subtle)] sm:inline">·</span>
                            <span className="text-sm font-semibold tracking-tight text-[var(--lab-text)]">
                                {activeModel.label}
                            </span>
                        </>
                    ) : (
                        <span className="text-sm font-semibold tracking-tight text-[var(--lab-text)]">
                            {menuLabel}
                        </span>
                    )}
                </span>
                <ChevronDown
                    className={cn(
                        "h-3.5 w-3.5 shrink-0 text-[var(--lab-text-subtle)] transition-transform duration-200 group-hover:text-[var(--lab-text-muted)]",
                        open && "rotate-180"
                    )}
                />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        role="menu"
                        aria-label={menuLabel}
                        onKeyDown={onMenuKeyDown}
                        initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
                        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
                        transition={
                            reduce
                                ? { duration: 0.12 }
                                : { type: "spring", stiffness: 460, damping: 34, mass: 0.7 }
                        }
                        style={{ transformOrigin: "top center" }}
                        className={cn(
                            "absolute left-1/2 top-full z-50 mt-2.5 w-[286px] -translate-x-1/2 p-1.5",
                            "rounded-2xl border border-[var(--lab-border)] bg-[var(--lab-header-bg)] backdrop-blur-xl",
                            "shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)]"
                        )}
                    >
                        {models.map((m, i) => {
                            const active = i === activeIndex;
                            const hex = accentOf(m.id, theme);
                            return (
                                <Link
                                    key={m.id}
                                    href={m.href}
                                    ref={(el) => {
                                        itemRefs.current[i] = el;
                                    }}
                                    role="menuitem"
                                    aria-current={active ? "page" : undefined}
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        "group/item flex items-center gap-3 rounded-xl px-2.5 py-2.5 outline-none transition-colors",
                                        !active &&
                                            "hover:bg-[var(--lab-surface)] focus-visible:bg-[var(--lab-surface)]"
                                    )}
                                    style={
                                        active
                                            ? { backgroundColor: `color-mix(in oklab, ${hex} 13%, transparent)` }
                                            : undefined
                                    }
                                >
                                    <span
                                        className="w-6 shrink-0 font-mono text-[11px] text-[var(--lab-text-subtle)] [font-variant-numeric:lining-nums_tabular-nums]"
                                        style={active ? { color: hex } : undefined}
                                    >
                                        {pad2(i + 1)}
                                    </span>
                                    <span
                                        aria-hidden
                                        className="h-[7px] w-[7px] shrink-0 rounded-full transition-opacity"
                                        style={{ backgroundColor: hex, opacity: active ? 1 : 0.55 }}
                                    />
                                    <span
                                        className={cn(
                                            "text-sm",
                                            active
                                                ? "font-semibold"
                                                : "font-medium text-[var(--lab-text-muted)] group-hover/item:text-[var(--lab-text)]"
                                        )}
                                        style={active ? { color: hex } : undefined}
                                    >
                                        {m.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
