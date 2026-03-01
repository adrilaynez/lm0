"use client";

import { FadeInView } from "@/components/lab/FadeInView";
import { cn } from "@/lib/utils";

type Accent = "emerald" | "violet" | "amber" | "indigo" | "blue" | "rose";

interface LabSectionHeaderProps {
    number: string;
    title: string;
    description?: string;
    accent?: Accent;
    className?: string;
}

const ACCENT_MAP: Record<Accent, { num: string; title: string; bar: string; desc: string }> = {
    emerald: {
        num: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        title: "from-emerald-300 to-teal-300",
        bar: "bg-gradient-to-b from-emerald-400 to-teal-500",
        desc: "text-white/45",
    },
    violet: {
        num: "bg-violet-500/10 border-violet-500/20 text-violet-400",
        title: "from-violet-300 to-purple-300",
        bar: "bg-gradient-to-b from-violet-400 to-purple-500",
        desc: "text-white/45",
    },
    amber: {
        num: "bg-amber-500/10 border-amber-500/20 text-amber-400",
        title: "from-amber-300 to-orange-300",
        bar: "bg-gradient-to-b from-amber-400 to-orange-500",
        desc: "text-white/45",
    },
    indigo: {
        num: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
        title: "from-indigo-300 to-blue-300",
        bar: "bg-gradient-to-b from-indigo-400 to-blue-500",
        desc: "text-white/45",
    },
    blue: {
        num: "bg-blue-500/10 border-blue-500/20 text-blue-400",
        title: "from-blue-300 to-cyan-300",
        bar: "bg-gradient-to-b from-blue-400 to-cyan-500",
        desc: "text-white/45",
    },
    rose: {
        num: "bg-rose-500/10 border-rose-500/20 text-rose-400",
        title: "from-rose-300 to-pink-300",
        bar: "bg-gradient-to-b from-rose-400 to-pink-500",
        desc: "text-white/45",
    },
};

export function LabSectionHeader({
    number,
    title,
    description,
    accent = "emerald",
    className,
}: LabSectionHeaderProps) {
    const a = ACCENT_MAP[accent];

    return (
        <FadeInView margin="-40px" className={cn("flex items-start gap-4 mb-2", className)}>
            {/* Colored bar + number */}
            <div className="flex flex-col items-center gap-1.5 shrink-0 pt-0.5">
                <span
                    className={cn(
                        "flex items-center justify-center w-7 h-7 rounded-full border text-[10px] font-mono font-bold",
                        a.num
                    )}
                >
                    {number}
                </span>
                {description && (
                    <div className={cn("w-px flex-1 min-h-[24px] rounded-full opacity-30", a.bar)} />
                )}
            </div>

            <div className="min-w-0">
                <h3
                    className={cn(
                        "text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r bg-clip-text text-transparent mb-1",
                        a.title
                    )}
                >
                    {title}
                </h3>
                {description && (
                    <p className={cn("text-sm leading-relaxed font-light", a.desc)}>
                        {description}
                    </p>
                )}
            </div>
        </FadeInView>
    );
}
