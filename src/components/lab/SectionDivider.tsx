"use client";

import { FadeInView } from "@/components/lab/FadeInView";
import { useLabMode } from "@/context/LabModeContext";
import { cn } from "@/lib/utils";

interface SectionDividerProps {
    title: string;
    description: string;
    number: string;
    className?: string;
}

export function SectionDivider({ title, description, number, className }: SectionDividerProps) {
    const { mode } = useLabMode();
    const isEdu = mode === "educational";

    return (
        <div className={cn("relative py-16 md:py-24 overflow-hidden", className)}>

            <FadeInView
                margin="-20%"
                className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent to-transparent origin-left",
                    isEdu ? "via-amber-500/20" : "via-cyan-500/20"
                )}
            >{null}</FadeInView>

            <div className="relative flex flex-col items-center text-center max-w-3xl mx-auto px-6">

                <FadeInView margin="-20%" className="mb-5">
                    <span className={cn(
                        "inline-flex items-center justify-center w-11 h-11 rounded-full border text-sm font-mono shadow-lg",
                        isEdu
                            ? "border-amber-500/20 bg-amber-500/[0.07] text-amber-300/70 shadow-[0_0_20px_-5px_rgba(245,158,11,0.25)]"
                            : "border-cyan-500/20 bg-cyan-500/[0.07] text-cyan-300/70 shadow-[0_0_20px_-5px_rgba(6,182,212,0.25)]"
                    )}>
                        {number}
                    </span>
                </FadeInView>

                <FadeInView as="h2" margin="-20%" delay={0.1} className="text-2xl md:text-4xl font-bold tracking-tight mb-4 bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
                    {title}
                </FadeInView>

                <FadeInView as="p" margin="-20%" delay={0.2} className="text-base md:text-lg text-white/40 leading-relaxed font-light max-w-2xl">
                    {description}
                </FadeInView>
            </div>
        </div>
    );
}
