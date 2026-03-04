"use client";

import React, { useEffect } from "react";
import { BlockMath } from "react-katex";

import { Lightbulb } from "lucide-react";

import { FadeInView } from "@/components/lab/FadeInView";

import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   Shared types
   ───────────────────────────────────────────── */

export type NarrativeAccent = "emerald" | "amber" | "rose" | "violet";
export type HighlightColor = NarrativeAccent | "indigo";

/* ─────────────────────────────────────────────
   Color maps
   ───────────────────────────────────────────── */

const ACCENT_SIMPLE_CIRCLE: Record<NarrativeAccent, string> = {
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    rose: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    violet: "bg-violet-500/10 border-violet-500/20 text-violet-400",
};

const CALLOUT_COLORS: Record<NarrativeAccent | "indigo", { border: string; bg: string; icon: string; title: string; glow: string }> = {
    emerald: { border: "border-emerald-500/20", bg: "bg-emerald-500/[0.04]", icon: "text-emerald-400", title: "text-emerald-400", glow: "from-emerald-500/[0.06]" },
    amber: { border: "border-amber-500/20", bg: "bg-amber-500/[0.04]", icon: "text-amber-400", title: "text-amber-400", glow: "from-amber-500/[0.06]" },
    rose: { border: "border-rose-500/20", bg: "bg-rose-500/[0.04]", icon: "text-rose-400", title: "text-rose-400", glow: "from-rose-500/[0.06]" },
    violet: { border: "border-violet-500/20", bg: "bg-violet-500/[0.04]", icon: "text-violet-400", title: "text-violet-400", glow: "from-violet-500/[0.06]" },
    indigo: { border: "border-indigo-500/20", bg: "bg-indigo-500/[0.04]", icon: "text-indigo-400", title: "text-indigo-400", glow: "from-indigo-500/[0.06]" },
};

const HIGHLIGHT_COLORS: Record<HighlightColor, string> = {
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
    violet: "text-violet-400",
    indigo: "text-indigo-400",
};

const FORMULA_STYLES: Record<NarrativeAccent, { bg: string; border: string; shadow: string }> = {
    emerald: { bg: "bg-emerald-500/[0.04]", border: "border-emerald-500/[0.15]", shadow: "shadow-[0_0_40px_-15px_rgba(52,211,153,0.15)]" },
    amber: { bg: "bg-amber-500/[0.04]", border: "border-amber-500/[0.15]", shadow: "shadow-[0_0_40px_-15px_rgba(245,158,11,0.15)]" },
    rose: { bg: "bg-rose-500/[0.04]", border: "border-rose-500/[0.15]", shadow: "shadow-[0_0_40px_-15px_rgba(244,63,94,0.15)]" },
    violet: { bg: "bg-violet-500/[0.04]", border: "border-violet-500/[0.15]", shadow: "shadow-[0_0_40px_-15px_rgba(139,92,246,0.15)]" },
};

const PULLQUOTE_BORDER: Record<NarrativeAccent, string> = {
    emerald: "border-emerald-400/40",
    amber: "border-amber-400/40",
    rose: "border-rose-500/30",
    violet: "border-violet-500/30",
};

/* ─────────────────────────────────────────────
   Section
   ───────────────────────────────────────────── */

export function Section({ id, children }: { id?: string; children: React.ReactNode }) {
    return (
        <FadeInView as="section" id={id} margin="-80px" className="mb-20 md:mb-28 scroll-mt-16">
            {children}
        </FadeInView>
    );
}

/* ─────────────────────────────────────────────
   SectionLabel
   ───────────────────────────────────────────── */

export function SectionLabel({
    number,
    label,
    accent = "rose",
    variant = "simple",
}: {
    number: string;
    label: string;
    accent?: NarrativeAccent;
    variant?: "simple" | "gradient";
}) {
    const isGradient = variant === "gradient" && accent === "rose";

    return (
        <div className="flex items-center gap-3 mb-8">
            {isGradient ? (
                <span
                    className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/10 border border-rose-500/25 text-[11px] font-mono font-bold bg-clip-text text-transparent"
                    style={{ WebkitBackgroundClip: "text", backgroundImage: "linear-gradient(135deg, #fb7185, #f9a8d4)" }}
                >
                    {number}
                </span>
            ) : (
                <span className={`flex items-center justify-center w-7 h-7 rounded-full border text-[11px] font-mono font-bold ${ACCENT_SIMPLE_CIRCLE[accent]}`}>
                    {number}
                </span>
            )}
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[var(--lab-text-subtle)]">
                {label}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-[var(--lab-border)] to-transparent" />
        </div>
    );
}

/* ─────────────────────────────────────────────
   Heading
   ───────────────────────────────────────────── */

export function Heading({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <h2 className={cn("text-2xl md:text-[2rem] font-bold text-[var(--lab-text)] tracking-tight mb-6 leading-tight", className)}>
            {children}
        </h2>
    );
}

/* ─────────────────────────────────────────────
   Lead
   ───────────────────────────────────────────── */

export function Lead({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-lg md:text-xl text-[var(--lab-text-muted)] leading-[1.8] mb-6 font-light">
            {children}
        </p>
    );
}

/* ─────────────────────────────────────────────
   P (paragraph)
   ───────────────────────────────────────────── */

export function P({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[15px] md:text-base text-[var(--lab-text-muted)] leading-[1.9] mb-5 last:mb-0">
            {children}
        </p>
    );
}

/* ─────────────────────────────────────────────
   Highlight (multi-color + optional tooltip)
   ───────────────────────────────────────────── */

export function Highlight({
    children,
    color = "rose",
    tooltip,
}: {
    children: React.ReactNode;
    color?: HighlightColor;
    tooltip?: string;
}) {
    if (!tooltip) {
        return <strong className={`${HIGHLIGHT_COLORS[color]} font-semibold`}>{children}</strong>;
    }

    return (
        <span className="relative inline-flex group align-baseline">
            <strong
                className={`${HIGHLIGHT_COLORS[color]} font-semibold cursor-help underline decoration-white/15 underline-offset-4`}
                tabIndex={0}
            >
                {children}
            </strong>
            <span
                role="tooltip"
                className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 z-30 w-56 rounded-lg border border-white/[0.10] bg-black/90 px-3 py-2 text-[11px] leading-relaxed text-white/70 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
            >
                {tooltip}
            </span>
        </span>
    );
}

/* ─────────────────────────────────────────────
   Callout (card + glow)
   ───────────────────────────────────────────── */

export function Callout({
    icon: Icon = Lightbulb,
    accent = "rose",
    title,
    children,
}: {
    icon?: React.ComponentType<{ className?: string }>;
    accent?: NarrativeAccent | "indigo";
    title?: string;
    children: React.ReactNode;
}) {
    const a = CALLOUT_COLORS[accent];

    return (
        <FadeInView as="aside" margin="-40px" className={`relative my-8 rounded-xl border ${a.border} ${a.bg} p-5 md:p-6 overflow-hidden`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${a.glow} to-transparent pointer-events-none`} />
            <div className="relative flex gap-4">
                <div className="shrink-0 mt-0.5">
                    <Icon className={`w-4.5 h-4.5 ${a.icon}`} />
                </div>
                <div className="min-w-0">
                    {title && (
                        <p className={`text-xs font-bold uppercase tracking-[0.15em] ${a.title} mb-2`}>
                            {title}
                        </p>
                    )}
                    <div className="text-sm text-[var(--lab-text-muted)] leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0">
                        {children}
                    </div>
                </div>
            </div>
        </FadeInView>
    );
}

/* ─────────────────────────────────────────────
   FormulaBlock
   ───────────────────────────────────────────── */

export function FormulaBlock({
    formula,
    caption,
    accent = "rose",
}: {
    formula: string;
    caption: string;
    accent?: NarrativeAccent;
}) {
    useEffect(() => {
        // @ts-expect-error - CSS imports work at runtime but lack type declarations
        import("katex/dist/katex.min.css");
    }, []);

    const s = FORMULA_STYLES[accent];
    return (
        <FadeInView margin="-40px" className="my-10 text-center">
            <div className="flex items-center justify-center mb-10">
                <div className={`inline-block px-8 py-4 rounded-2xl ${s.bg} border ${s.border} backdrop-blur-sm ${s.shadow}`}>
                    <BlockMath math={formula} />
                </div>
            </div>
            <p className="text-center text-sm md:text-base text-[var(--lab-text-muted)] italic font-light max-w-2xl mx-auto">
                {caption}
            </p>
        </FadeInView>
    );
}

/* ─────────────────────────────────────────────
   PullQuote
   ───────────────────────────────────────────── */

export function PullQuote({
    children,
    accent = "rose",
}: {
    children: React.ReactNode;
    accent?: NarrativeAccent;
}) {
    return (
        <FadeInView as="blockquote" margin="-40px" className={`my-10 md:my-12 pl-6 border-l-2 ${PULLQUOTE_BORDER[accent]}`}>
            <p className="text-lg md:text-xl text-[var(--lab-text-muted)] font-light italic leading-relaxed">
                {children}
            </p>
        </FadeInView>
    );
}

/* ─────────────────────────────────────────────
   SectionBreak
   ───────────────────────────────────────────── */

export function SectionBreak() {
    return (
        <div className="flex items-center justify-center gap-3 my-16 md:my-20">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--lab-border)]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--lab-border)]" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--lab-border)]" />
        </div>
    );
}

/* ─────────────────────────────────────────────
   FigureWrapper (accent-keyed, from NN)
   ───────────────────────────────────────────── */

export const FIGURE_ACCENTS = {
    default: { border: "border-[var(--lab-border)]", bg: "bg-[var(--lab-card)]", bar: "border-[var(--lab-border)] bg-[var(--lab-card)]", text: "text-[var(--lab-text-subtle)]" },
    amber: { border: "border-amber-500/[0.12]", bg: "bg-gradient-to-br from-amber-500/[0.02] to-transparent", bar: "border-amber-500/[0.08] bg-amber-500/[0.02]", text: "text-amber-400/50" },
    emerald: { border: "border-emerald-500/[0.1]", bg: "bg-[radial-gradient(ellipse_at_top,rgba(52,211,153,0.02),transparent)]", bar: "border-emerald-500/[0.08] bg-emerald-500/[0.02]", text: "text-emerald-400/50" },
    rose: { border: "border-rose-500/[0.12]", bg: "bg-gradient-to-br from-rose-500/[0.03] to-transparent", bar: "border-rose-500/[0.08] bg-rose-500/[0.02]", text: "text-rose-400/50" },
    violet: { border: "border-violet-500/[0.12]", bg: "bg-gradient-to-br from-violet-500/[0.03] to-transparent", bar: "border-violet-500/[0.08] bg-violet-500/[0.02]", text: "text-violet-400/50" },
    indigo: { border: "border-indigo-500/[0.1]", bg: "bg-gradient-to-br from-indigo-500/[0.02] to-transparent", bar: "border-indigo-500/[0.08] bg-indigo-500/[0.02]", text: "text-indigo-400/50" },
} as const;

export type FigureAccent = keyof typeof FIGURE_ACCENTS;

export function FigureWrapper({
    label,
    hint,
    accent = "default",
    children,
}: {
    label: string;
    hint: string;
    accent?: FigureAccent;
    children: React.ReactNode;
}) {
    const a = FIGURE_ACCENTS[accent];
    return (
        <div className={`my-8 -mx-2 sm:mx-0 rounded-2xl border ${a.border} ${a.bg} overflow-hidden`}>
            <div className={`flex items-center justify-between gap-3 px-4 py-2.5 border-b ${a.bar}`}>
                <span className={`text-[10px] font-mono uppercase tracking-widest ${a.text}`}>{label}</span>
            </div>
            <div className="p-4 bg-[var(--lab-viz-bg)]">{children}</div>
            {hint && (
                <p className="px-4 pb-3 text-[11px] text-[var(--lab-text-subtle)] italic">{hint}</p>
            )}
        </div>
    );
}
