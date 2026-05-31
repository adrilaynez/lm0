"use client";

import { FadeInView } from "@/features/lab/components/FadeInView";
import { useLabMode } from "@/features/lab/context/LabModeContext";
import { cn } from "@/lib/utils";

interface SectionDividerProps {
    title: string;
    description: string;
    number: string;
    className?: string;
    /**
     * Opt-in chapter accent. Only "bigram" is supported today — it swaps the divider
     * onto the editorial-green token system (`--bigram-*`). These token classes only
     * resolve inside a `[data-bigram-theme]` scope, so chapters that omit the prop
     * (mlp, neural-networks, …) keep their amber / cyan free-lab look untouched.
     */
    accent?: "bigram";
}

export function SectionDivider({ title, description, number, className, accent }: SectionDividerProps) {
    const { mode } = useLabMode();
    const isEdu = mode === "educational";
    const isBigram = accent === "bigram";

    return (
        <div className={cn("relative py-16 md:py-24 overflow-hidden", className)}>

            {/* Hairline rule — a single accent-tinted gradient that fades in from the left. */}
            <FadeInView
                margin="-20%"
                className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent to-transparent origin-left",
                    isBigram
                        ? "via-[color-mix(in_oklab,var(--bigram-accent)_22%,transparent)]"
                        : isEdu
                            ? "via-amber-500/20"
                            : "via-cyan-500/20"
                )}
            >{null}</FadeInView>

            <div className="relative flex flex-col items-center text-center max-w-3xl mx-auto px-6">

                {/* Numbered marker — fill + hairline, never a heavy ring. Mono numeral. */}
                <FadeInView margin="-20%" className="mb-5">
                    <span className={cn(
                        "inline-flex items-center justify-center w-11 h-11 rounded-full border font-mono shadow-lg",
                        isBigram
                            ? "text-[13px] tracking-[0.02em] border-[color-mix(in_oklab,var(--bigram-accent)_30%,transparent)] bg-[var(--bigram-accent-soft)] text-bigram-accent-ink shadow-[0_0_24px_-6px_color-mix(in_oklab,var(--bigram-accent)_45%,transparent)]"
                            : isEdu
                                ? "text-sm border-amber-500/20 bg-amber-500/[0.07] text-amber-300/70 shadow-[0_0_20px_-5px_rgba(245,158,11,0.25)]"
                                : "text-sm border-cyan-500/20 bg-cyan-500/[0.07] text-cyan-300/70 shadow-[0_0_20px_-5px_rgba(6,182,212,0.25)]"
                    )}>
                        {number}
                    </span>
                </FadeInView>

                {/* Title — editorial Playfair + warm-ink→deep-green gradient for bigram;
                    the original white gradient elsewhere. Hierarchy carried by type. */}
                <FadeInView
                    as="h2"
                    margin="-20%"
                    delay={0.1}
                    className={cn(
                        "mb-4 bg-clip-text text-transparent bg-gradient-to-r",
                        isBigram
                            ? "font-[family-name:var(--font-playfair)] text-[clamp(30px,4.6vw,46px)] font-semibold leading-[1.08] tracking-[-0.012em] from-[var(--bigram-ink)] via-[var(--bigram-ink)] to-[var(--bigram-accent-ink)]"
                            : "text-2xl md:text-4xl font-bold tracking-tight from-white via-white/90 to-white/60"
                    )}
                >
                    {title}
                </FadeInView>

                <FadeInView
                    as="p"
                    margin="-20%"
                    delay={0.2}
                    className={cn(
                        "leading-relaxed max-w-2xl",
                        isBigram
                            ? "font-[family-name:var(--font-source-serif)] text-[17px] md:text-lg text-bigram-muted"
                            : "text-base md:text-lg text-white/40 font-light"
                    )}
                >
                    {description}
                </FadeInView>
            </div>
        </div>
    );
}
