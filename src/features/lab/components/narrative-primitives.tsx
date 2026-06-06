"use client";

import React, { useEffect } from "react";

import { Lightbulb } from "lucide-react";

import { BlockMath } from "@/components/math/LazyMath";
import { FadeInView } from "@/features/lab/components/FadeInView";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   Shared types

   The Bigram chapter (editorial-green, v8) opts in via accent="bigram".
   That branch is token-only (--bigram-*) and resolves through the
   [data-bigram-theme] scope set on the chapter wrapper, so every other
   chapter keeps its literal Tailwind accent untouched. Never replace an
   existing accent's value — the bigram entry is purely additive.
   ───────────────────────────────────────────── */

export type NarrativeAccent = "emerald" | "amber" | "rose" | "violet" | "cyan" | "bigram" | "ngram";
export type HighlightColor = NarrativeAccent | "indigo";

/* Bigram families — Playfair titles, Source Serif body, JetBrains Mono data. */
const BIGRAM_DISPLAY = "font-[family-name:var(--bigram-font-display)]";
const BIGRAM_SERIF = "font-[family-name:var(--bigram-font-serif)]";
const BIGRAM_MONO = "font-[family-name:var(--bigram-font-mono)]";

/* N-gram families — same registrations, amber accent. Mirror of the bigram editorial path. */
const NGRAM_DISPLAY = "font-[family-name:var(--ngram-font-display)]";
const NGRAM_SERIF = "font-[family-name:var(--ngram-font-serif)]";
const NGRAM_MONO = "font-[family-name:var(--ngram-font-mono)]";

/* ─────────────────────────────────────────────
   Color maps
   ───────────────────────────────────────────── */

const ACCENT_SIMPLE_CIRCLE: Record<NarrativeAccent, string> = {
  emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  rose: "bg-rose-500/10 border-rose-500/20 text-rose-400",
  violet: "bg-violet-500/10 border-violet-500/20 text-violet-400",
  cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
  bigram:
    "bg-bigram-accent-soft border-[color-mix(in_oklab,var(--bigram-accent)_38%,transparent)] text-bigram-accent-ink",
  ngram:
    "bg-ngram-accent-soft border-[color-mix(in_oklab,var(--ngram-accent)_38%,transparent)] text-ngram-accent-ink",
};

const CALLOUT_COLORS: Record<
  NarrativeAccent | "indigo",
  { border: string; bg: string; icon: string; title: string; glow: string }
> = {
  emerald: {
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/[0.04]",
    icon: "text-emerald-400",
    title: "text-emerald-400",
    glow: "from-emerald-500/[0.06]",
  },
  amber: {
    border: "border-amber-500/20",
    bg: "bg-amber-500/[0.04]",
    icon: "text-amber-400",
    title: "text-amber-400",
    glow: "from-amber-500/[0.06]",
  },
  rose: {
    border: "border-rose-500/20",
    bg: "bg-rose-500/[0.04]",
    icon: "text-rose-400",
    title: "text-rose-400",
    glow: "from-rose-500/[0.06]",
  },
  violet: {
    border: "border-violet-500/20",
    bg: "bg-violet-500/[0.04]",
    icon: "text-violet-400",
    title: "text-violet-400",
    glow: "from-violet-500/[0.06]",
  },
  indigo: {
    border: "border-indigo-500/20",
    bg: "bg-indigo-500/[0.04]",
    icon: "text-indigo-400",
    title: "text-indigo-400",
    glow: "from-indigo-500/[0.06]",
  },
  cyan: {
    border: "border-cyan-500/20",
    bg: "bg-cyan-500/[0.04]",
    icon: "text-cyan-400",
    title: "text-cyan-400",
    glow: "from-cyan-500/[0.06]",
  },
  // v8: surface panel, rule-2 hairline, mono accent title + 6px accent dot (rendered below).
  bigram: {
    border: "border-[color:var(--bigram-rule-2)]",
    bg: "bg-bigram-surface",
    icon: "text-bigram-accent",
    title: "text-bigram-accent",
    glow: "from-transparent",
  },
  ngram: {
    border: "border-[color:var(--ngram-rule-2)]",
    bg: "bg-ngram-surface",
    icon: "text-ngram-accent",
    title: "text-ngram-accent",
    glow: "from-transparent",
  },
};

const HIGHLIGHT_COLORS: Record<HighlightColor, string> = {
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  rose: "text-rose-400",
  violet: "text-violet-400",
  indigo: "text-indigo-400",
  cyan: "text-cyan-400",
  // v8 inline emphasis (.hl): accent-ink, italic, weight 500 — rich but legible.
  bigram: "text-bigram-accent-ink italic font-medium",
  ngram: "text-ngram-accent-ink italic font-medium",
};

const FORMULA_STYLES: Record<NarrativeAccent, { bg: string; border: string; shadow: string }> = {
  emerald: {
    bg: "bg-emerald-500/[0.04]",
    border: "border-emerald-500/[0.15]",
    shadow: "shadow-[0_0_40px_-15px_rgba(52,211,153,0.15)]",
  },
  amber: {
    bg: "bg-amber-500/[0.04]",
    border: "border-amber-500/[0.15]",
    shadow: "shadow-[0_0_40px_-15px_rgba(245,158,11,0.15)]",
  },
  rose: {
    bg: "bg-rose-500/[0.04]",
    border: "border-rose-500/[0.15]",
    shadow: "shadow-[0_0_40px_-15px_rgba(244,63,94,0.15)]",
  },
  violet: {
    bg: "bg-violet-500/[0.04]",
    border: "border-violet-500/[0.15]",
    shadow: "shadow-[0_0_40px_-15px_rgba(139,92,246,0.15)]",
  },
  cyan: {
    bg: "bg-cyan-500/[0.04]",
    border: "border-cyan-500/[0.15]",
    shadow: "shadow-[0_0_40px_-15px_rgba(34,211,238,0.15)]",
  },
  // v8: sunken bg-2 well, marked rule-2 hairline, no glow halo.
  bigram: { bg: "bg-bigram-bg-2", border: "border-[color:var(--bigram-rule-2)]", shadow: "" },
  ngram: { bg: "bg-ngram-bg-2", border: "border-[color:var(--ngram-rule-2)]", shadow: "" },
};

const PULLQUOTE_BORDER: Record<NarrativeAccent, string> = {
  emerald: "border-emerald-400/40",
  amber: "border-amber-400/40",
  rose: "border-rose-500/30",
  violet: "border-violet-500/30",
  cyan: "border-cyan-400/40",
  bigram: "border-bigram-accent",
  ngram: "border-ngram-accent",
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

   v8 (bigram): italic Playfair numeral in accent + mono uppercase label +
   a single hairline rule. No box, no chip — typography carries the hierarchy.
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
  if (accent === "bigram") {
    // A big numeral + a short two-word kicker. The Heading below carries the full title, so the
    // kicker is a distinct label, never a repeat of it. No hairline — typography carries it.
    return (
      <div className="flex items-baseline gap-3.5 mb-5">
        <span
          className={cn(
            BIGRAM_DISPLAY,
            "italic font-semibold text-[26px] leading-none text-bigram-accent",
          )}
        >
          {number}
        </span>
        {label && (
          <span
            className={cn(
              BIGRAM_MONO,
              "text-[11.5px] font-medium uppercase tracking-[0.18em] text-bigram-muted",
            )}
          >
            {label}
          </span>
        )}
      </div>
    );
  }

  if (accent === "ngram") {
    return (
      <div className="flex items-baseline gap-3.5 mb-5">
        <span
          className={cn(
            NGRAM_DISPLAY,
            "italic font-semibold text-[26px] leading-none text-ngram-accent",
          )}
        >
          {number}
        </span>
        {label && (
          <span
            className={cn(
              NGRAM_MONO,
              "text-[11.5px] font-medium uppercase tracking-[0.18em] text-ngram-muted",
            )}
          >
            {label}
          </span>
        )}
      </div>
    );
  }

  const isGradient = variant === "gradient" && accent === "rose";

  return (
    <div className="flex items-center gap-3 mb-8">
      {isGradient ? (
        <span
          className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/10 border border-rose-500/25 text-[11px] font-mono font-bold bg-clip-text text-transparent"
          style={{
            WebkitBackgroundClip: "text",
            backgroundImage: "linear-gradient(135deg, #fb7185, #f9a8d4)",
          }}
        >
          {number}
        </span>
      ) : (
        <span
          className={`relative flex items-center justify-center w-7 h-7 rounded-full border text-[11px] font-mono font-bold ${ACCENT_SIMPLE_CIRCLE[accent]}`}
        >
          {number}
          {accent === "cyan" && (
            <>
              <span className="w-1 h-1 rounded-full bg-red-500 absolute -top-0.5 -right-0.5" />
              <span className="w-1 h-1 rounded-full bg-blue-500 absolute -bottom-0.5 -right-0.5" />
            </>
          )}
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

   v8 (bigram): Playfair section h2, ink, generous size, balanced wrap.
   ───────────────────────────────────────────── */

export function Heading({
  children,
  className,
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: NarrativeAccent;
}) {
  if (accent === "bigram") {
    return (
      <h2
        // line-height set inline: tailwind-merge drops `leading-[1.08]` when it
        // collides with the arbitrary `text-[clamp(...)]` size, so we pin it here
        // to match the v8 `.section h2` (line-height 1.08). max-w-[74ch] mirrors
        // v8's `.reader .section > :not(.figure)` editorial measure.
        style={{ lineHeight: 1.08 }}
        className={cn(
          BIGRAM_DISPLAY,
          "font-semibold text-bigram-ink tracking-[-0.012em] mb-8 text-balance max-w-[74ch]",
          "text-[clamp(34px,4.8vw,52px)]",
          className,
        )}
      >
        {children}
      </h2>
    );
  }

  if (accent === "ngram") {
    return (
      <h2
        style={{ lineHeight: 1.08 }}
        className={cn(
          NGRAM_DISPLAY,
          "font-semibold text-ngram-ink tracking-[-0.012em] mb-8 text-balance max-w-[74ch]",
          "text-[clamp(34px,4.8vw,52px)]",
          className,
        )}
      >
        {children}
      </h2>
    );
  }

  return (
    <h2
      className={cn(
        "text-2xl md:text-[2rem] font-bold text-[var(--lab-text)] tracking-tight mb-6 leading-tight",
        className,
      )}
    >
      {children}
    </h2>
  );
}

/* ─────────────────────────────────────────────
   Subheading (h3)

   Bridges the type-scale gap between the §-level h2 (clamp 34→52px) and the
   body P (20.5px) inside long sections. v8 (bigram): a Playfair display
   subtitle ~31px — clearly subordinate to the h2 yet still display-weight,
   so sub-sections read as structure, not body. (Earlier subtitles fell to
   19px serif, leaving a flat 52→27px gap.)
   ───────────────────────────────────────────── */

export function Subheading({
  children,
  className,
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: NarrativeAccent;
}) {
  if (accent === "bigram") {
    return (
      <h3
        // line-height pinned inline for the same tailwind-merge reason as Heading.
        style={{ lineHeight: 1.2 }}
        className={cn(
          BIGRAM_DISPLAY,
          "font-semibold text-bigram-ink tracking-[-0.008em] mt-12 mb-4 text-balance max-w-[67ch]",
          "text-[clamp(27px,2.6vw,31px)]",
          className,
        )}
      >
        {children}
      </h3>
    );
  }

  if (accent === "ngram") {
    return (
      <h3
        style={{ lineHeight: 1.2 }}
        className={cn(
          NGRAM_DISPLAY,
          "font-semibold text-ngram-ink tracking-[-0.008em] mt-12 mb-4 text-balance max-w-[67ch]",
          "text-[clamp(27px,2.6vw,31px)]",
          className,
        )}
      >
        {children}
      </h3>
    );
  }

  return (
    <h3
      className={cn(
        "text-xl md:text-2xl font-bold text-[var(--lab-text)] tracking-tight mt-10 mb-4 leading-snug",
        className,
      )}
    >
      {children}
    </h3>
  );
}

/* ─────────────────────────────────────────────
   Lead

   v8 (bigram): Source Serif, larger, ink-2, relaxed leading.
   ───────────────────────────────────────────── */

export function Lead({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: NarrativeAccent;
}) {
  if (accent === "bigram") {
    return (
      <p
        className={cn(
          BIGRAM_SERIF,
          "text-[clamp(22px,2.3vw,27px)] font-normal leading-[1.5] text-bigram-ink-2 mb-10 text-pretty max-w-[74ch]",
        )}
      >
        {children}
      </p>
    );
  }

  if (accent === "ngram") {
    return (
      <p
        className={cn(
          NGRAM_SERIF,
          "text-[clamp(22px,2.3vw,27px)] font-normal leading-[1.5] text-ngram-ink-2 mb-10 text-pretty max-w-[74ch]",
        )}
      >
        {children}
      </p>
    );
  }

  return (
    <p className="text-lg md:text-xl text-[var(--lab-text-muted)] leading-[1.8] mb-6 font-light">
      {children}
    </p>
  );
}

/* ─────────────────────────────────────────────
   P (paragraph)

   v8 (bigram): Source Serif body, color `body`, 1.7 leading.
   ───────────────────────────────────────────── */

export function P({ children, accent }: { children: React.ReactNode; accent?: NarrativeAccent }) {
  if (accent === "bigram") {
    return (
      <p
        className={cn(
          BIGRAM_SERIF,
          "text-[20.5px] leading-[1.7] text-bigram-body mb-[1.66em] last:mb-0 text-pretty max-w-[67ch]",
        )}
      >
        {children}
      </p>
    );
  }

  if (accent === "ngram") {
    return (
      <p
        className={cn(
          NGRAM_SERIF,
          "text-[20.5px] leading-[1.7] text-ngram-body mb-[1.66em] last:mb-0 text-pretty max-w-[67ch]",
        )}
      >
        {children}
      </p>
    );
  }

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
  const isBigram = color === "bigram";
  const isNgram = color === "ngram";
  // The bigram/ngram inline style already carries italic + weight; others keep semibold.
  const emphasis = isBigram
    ? HIGHLIGHT_COLORS.bigram
    : isNgram
      ? HIGHLIGHT_COLORS.ngram
      : `${HIGHLIGHT_COLORS[color]} font-semibold`;

  if (!tooltip) {
    return <strong className={emphasis}>{children}</strong>;
  }

  if (isBigram) {
    return (
      <span className="relative inline-flex group align-baseline">
        <strong
          className={cn(
            emphasis,
            "cursor-help border-b border-dashed border-bigram-accent-2 not-italic text-bigram-ink",
          )}
          tabIndex={0}
        >
          {children}
        </strong>
        <span
          role="tooltip"
          className={cn(
            BIGRAM_SERIF,
            "pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 z-30 w-56 rounded-[var(--bigram-r-md)]",
            "border border-[color:var(--bigram-rule-2)] bg-bigram-elev px-3 py-2 text-[13px] leading-relaxed text-bigram-body shadow-[0_16px_38px_-22px_rgba(0,0,0,0.62)]",
            "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity",
          )}
        >
          {tooltip}
        </span>
      </span>
    );
  }

  return (
    <span className="relative inline-flex group align-baseline">
      <strong
        className={`${emphasis} cursor-help underline decoration-white/15 underline-offset-4`}
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

   v8 (bigram): a calm surface panel with a rule-2 hairline, no glow wash.
   Title is mono accent uppercase preceded by a 6px accent dot.
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

  if (accent === "bigram") {
    return (
      <FadeInView
        as="aside"
        margin="-40px"
        className="relative my-9 rounded-[var(--bigram-r-md)] border border-[color:var(--bigram-rule-2)] bg-bigram-surface p-6"
      >
        {title && (
          <p
            className={cn(
              BIGRAM_MONO,
              "flex items-center gap-2.5 text-[11px] uppercase tracking-[0.18em] text-bigram-accent mb-3",
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-bigram-accent" />
            {title}
          </p>
        )}
        <div
          className={cn(
            BIGRAM_SERIF,
            "text-[17px] leading-[1.7] text-bigram-ink-2 [&>p]:mb-2.5 [&>p:last-child]:mb-0",
          )}
        >
          {children}
        </div>
      </FadeInView>
    );
  }

  if (accent === "ngram") {
    return (
      <FadeInView
        as="aside"
        margin="-40px"
        className="relative my-9 rounded-[var(--ngram-r-md)] border border-[color:var(--ngram-rule-2)] bg-ngram-surface p-6"
      >
        {title && (
          <p
            className={cn(
              NGRAM_MONO,
              "flex items-center gap-2.5 text-[11px] uppercase tracking-[0.18em] text-ngram-accent mb-3",
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-ngram-accent" />
            {title}
          </p>
        )}
        <div
          className={cn(
            NGRAM_SERIF,
            "text-[17px] leading-[1.7] text-ngram-ink-2 [&>p]:mb-2.5 [&>p:last-child]:mb-0",
          )}
        >
          {children}
        </div>
      </FadeInView>
    );
  }

  return (
    <FadeInView
      as="aside"
      margin="-40px"
      className={`relative my-8 rounded-xl border ${a.border} ${a.bg} p-5 md:p-6 overflow-hidden`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${a.glow} to-transparent pointer-events-none`}
      />
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

   v8 (bigram): a sunken bg-2 well with a rule-2 hairline; the equation in
   mono accent, the caption in mono muted. No glow, no backdrop blur.
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
    import("katex/dist/katex.min.css");
  }, []);

  const s = FORMULA_STYLES[accent];

  if (accent === "bigram") {
    return (
      <FadeInView margin="-40px" className="my-9 text-center">
        <div
          className={cn(
            "rounded-[var(--bigram-r-md)] px-7 py-6 text-bigram-accent",
            s.bg,
            "border",
            s.border,
          )}
        >
          <BlockMath math={formula} />
        </div>
        <p
          className={cn(
            BIGRAM_MONO,
            "mt-4 text-[11px] uppercase tracking-[0.18em] text-bigram-muted",
          )}
        >
          {caption}
        </p>
      </FadeInView>
    );
  }

  if (accent === "ngram") {
    return (
      <FadeInView margin="-40px" className="my-9 text-center">
        <div
          className={cn(
            "rounded-[var(--ngram-r-md)] px-7 py-6 text-ngram-accent",
            s.bg,
            "border",
            s.border,
          )}
        >
          <BlockMath math={formula} />
        </div>
        <p
          className={cn(
            NGRAM_MONO,
            "mt-4 text-[11px] uppercase tracking-[0.18em] text-ngram-muted",
          )}
        >
          {caption}
        </p>
      </FadeInView>
    );
  }

  return (
    <FadeInView margin="-40px" className="my-10 text-center">
      <div className="flex items-center justify-center mb-10">
        <div
          className={`inline-block px-8 py-4 rounded-2xl ${s.bg} border ${s.border} backdrop-blur-sm ${s.shadow}`}
        >
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

   v8 (bigram): left 3px accent border, Playfair, ink, no quote chrome.
   ───────────────────────────────────────────── */

export function PullQuote({
  children,
  accent = "rose",
}: {
  children: React.ReactNode;
  accent?: NarrativeAccent;
}) {
  if (accent === "bigram") {
    return (
      <FadeInView
        as="blockquote"
        margin="-40px"
        className="my-11 md:my-12 pl-7 border-l-[3px] border-bigram-accent max-w-[74ch]"
      >
        <p
          className={cn(
            BIGRAM_DISPLAY,
            "font-semibold text-[clamp(26px,3.2vw,38px)] leading-[1.2] tracking-[-0.01em] text-bigram-ink text-balance",
          )}
        >
          {children}
        </p>
      </FadeInView>
    );
  }

  if (accent === "ngram") {
    return (
      <FadeInView
        as="blockquote"
        margin="-40px"
        className="my-11 md:my-12 pl-7 border-l-[3px] border-ngram-accent max-w-[74ch]"
      >
        <p
          className={cn(
            NGRAM_DISPLAY,
            "font-semibold text-[clamp(26px,3.2vw,38px)] leading-[1.2] tracking-[-0.01em] text-ngram-ink text-balance",
          )}
        >
          {children}
        </p>
      </FadeInView>
    );
  }

  return (
    <FadeInView
      as="blockquote"
      margin="-40px"
      className={`my-10 md:my-12 pl-6 border-l-2 ${PULLQUOTE_BORDER[accent]}`}
    >
      <p className="text-lg md:text-xl text-[var(--lab-text-muted)] font-light italic leading-relaxed">
        {children}
      </p>
    </FadeInView>
  );
}

/* ─────────────────────────────────────────────
   SectionBreak

   v8 (bigram): a single quiet hairline — no dot ornament.
   ───────────────────────────────────────────── */

export function SectionBreak({ accent }: { accent?: NarrativeAccent } = {}) {
  if (accent === "bigram" || accent === "ngram") {
    // Minimalist: no divider rule between sections — whitespace carries the break.
    return <div className="my-12 md:my-16" aria-hidden />;
  }

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

   v8 (bigram): the editorial figure — NO frame, NO chrome, NO traffic-light
   dots. The label is a numbered mono caption above; the demo body is a single
   faint plane (color-mix(surface 55%, bg)) with no border or shadow — the one
   subtle signal that "this is interactive." Hint sits below in mono muted.
   ───────────────────────────────────────────── */

export const FIGURE_ACCENTS = {
  default: {
    border: "border-[var(--lab-border)]",
    bg: "bg-[var(--lab-card)]",
    bar: "border-[var(--lab-border)] bg-[var(--lab-card)]",
    text: "text-[var(--lab-text-subtle)]",
  },
  amber: {
    border: "border-amber-500/[0.12]",
    bg: "bg-gradient-to-br from-amber-500/[0.02] to-transparent",
    bar: "border-amber-500/[0.08] bg-amber-500/[0.02]",
    text: "text-amber-400/50",
  },
  emerald: {
    border: "border-emerald-500/[0.1]",
    bg: "bg-[radial-gradient(ellipse_at_top,rgba(52,211,153,0.02),transparent)]",
    bar: "border-emerald-500/[0.08] bg-emerald-500/[0.02]",
    text: "text-emerald-400/50",
  },
  rose: {
    border: "border-rose-500/[0.12]",
    bg: "bg-gradient-to-br from-rose-500/[0.03] to-transparent",
    bar: "border-rose-500/[0.08] bg-rose-500/[0.02]",
    text: "text-rose-400/50",
  },
  violet: {
    border: "border-violet-500/[0.12]",
    bg: "bg-gradient-to-br from-violet-500/[0.03] to-transparent",
    bar: "border-violet-500/[0.08] bg-violet-500/[0.02]",
    text: "text-violet-400/50",
  },
  cyan: {
    border: "border-cyan-500/[0.12]",
    bg: "bg-gradient-to-br from-cyan-500/[0.03] to-transparent",
    bar: "border-cyan-500/[0.08] bg-cyan-500/[0.02]",
    text: "text-cyan-400/50",
  },
  indigo: {
    border: "border-indigo-500/[0.1]",
    bg: "bg-gradient-to-br from-indigo-500/[0.02] to-transparent",
    bar: "border-indigo-500/[0.08] bg-indigo-500/[0.02]",
    text: "text-indigo-400/50",
  },
  // Bigram is rendered through the dedicated editorial path below; this entry
  // exists only so accent="bigram" type-checks against FigureAccent.
  bigram: { border: "", bg: "", bar: "", text: "" },
  // Same for ngram — rendered through the dedicated editorial path below.
  ngram: { border: "", bg: "", bar: "", text: "" },
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
  if (accent === "bigram") {
    return (
      <figure className="my-11 md:my-14 -mx-2 sm:mx-0">
        {/* Numbered mono caption — no underline, separated by space (no chrome). */}
        <figcaption
          className={cn(
            BIGRAM_MONO,
            "px-1 pb-3 text-[12.5px] uppercase tracking-[0.18em] text-bigram-muted",
          )}
        >
          {label}
        </figcaption>
        {/* The single faint plane: the only "this is interactive" signal. */}
        <div className="rounded-[var(--bigram-r-sm)] bg-[color-mix(in_oklab,var(--bigram-surface)_55%,var(--bigram-bg))] px-7 py-8 sm:px-7">
          {children}
        </div>
        {hint && (
          <p
            className={cn(
              BIGRAM_SERIF,
              "mt-3 px-1 text-[15.5px] italic text-bigram-muted text-center",
            )}
          >
            {hint}
          </p>
        )}
      </figure>
    );
  }

  if (accent === "ngram") {
    return (
      <figure className="my-11 md:my-14 -mx-2 sm:mx-0">
        {/* Numbered mono caption — no underline, separated by space (no chrome). */}
        <figcaption
          className={cn(
            NGRAM_MONO,
            "px-1 pb-3 text-[12.5px] uppercase tracking-[0.18em] text-ngram-muted",
          )}
        >
          {label}
        </figcaption>
        {/* The single faint plane: the only "this is interactive" signal. */}
        <div className="rounded-[var(--ngram-r-sm)] bg-[color-mix(in_oklab,var(--ngram-surface)_55%,var(--ngram-bg))] px-7 py-8 sm:px-7">
          {children}
        </div>
        {hint && (
          <p
            className={cn(
              NGRAM_SERIF,
              "mt-3 px-1 text-[15.5px] italic text-ngram-muted text-center",
            )}
          >
            {hint}
          </p>
        )}
      </figure>
    );
  }

  const a = FIGURE_ACCENTS[accent];
  return (
    <div className={`my-8 -mx-2 sm:mx-0 rounded-2xl border ${a.border} ${a.bg} overflow-hidden`}>
      <div className={`flex items-center justify-between gap-3 px-4 py-2.5 border-b ${a.bar}`}>
        <span className={`text-[10px] font-mono uppercase tracking-widest ${a.text}`}>{label}</span>
      </div>
      <div className="p-4 bg-[var(--lab-viz-bg)]">{children}</div>
      {hint && <p className="px-4 pb-3 text-[11px] text-[var(--lab-text-subtle)] italic">{hint}</p>}
    </div>
  );
}
