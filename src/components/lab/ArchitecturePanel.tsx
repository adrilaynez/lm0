"use client";

import { useState } from "react";

import { AnimatePresence,motion } from "framer-motion";
import {
    AlertTriangle,
    Boxes,
    ChevronDown,
    ChevronUp,
    Lightbulb,
    Rocket,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ArchitectureViz } from "@/types/lmLab";

interface ArchitecturePanelProps {
    data: ArchitectureViz | null;
}

function ExpandableSection({
    title,
    icon,
    children,
    defaultOpen = false,
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-t border-white/[0.04]">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full px-5 py-3 text-left group hover:bg-white/[0.02] transition-colors"
            >
                <span className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white/50 group-hover:text-white/70 transition-colors">
                    {icon}
                    {title}
                </span>
                {open ? (
                    <ChevronUp className="h-3.5 w-3.5 text-white/30" />
                ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-white/30" />
                )}
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-4">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function ArchitecturePanel({ data }: ArchitecturePanelProps) {
    if (!data) {
        return (
            <Card className="bg-black/40 border-white/[0.06] backdrop-blur-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                    <Boxes className="h-4 w-4 text-amber-400" />
                    <span className="font-mono text-xs uppercase tracking-widest text-white/60">
                        Architecture
                    </span>
                </div>
                <div className="flex items-center justify-center h-40 text-white/30 text-xs font-mono">
                    Run inference to view architecture details
                </div>
            </Card>
        );
    }

    return (
        <Card className="bg-black/40 border-white/[0.06] backdrop-blur-sm overflow-hidden" id="architecture">
            {/* Header */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <Boxes className="h-4 w-4 text-amber-400" />
                <span className="font-mono text-xs uppercase tracking-widest text-white/60">
                    Architecture
                </span>
            </div>

            {/* Info */}
            <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-white">{data.name}</h3>
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] font-mono">
                        {data.type}
                    </Badge>
                    <Badge className="bg-white/[0.04] text-white/60 border-white/[0.06] text-[10px] font-mono">
                        {data.complexity}
                    </Badge>
                </div>
                <p className="text-sm text-white/60 leading-relaxed">
                    {data.description}
                </p>
            </div>

            {/* Expandable Sections */}
            <ExpandableSection
                title="How It Works"
                icon={<Lightbulb className="h-3.5 w-3.5 text-amber-400" />}
                defaultOpen={true}
            >
                <div className="text-sm text-white/50 leading-relaxed space-y-2">
                    {data.how_it_works.map((line, i) => (
                        <p key={i}>{line}</p>
                    ))}
                </div>
            </ExpandableSection>

            <ExpandableSection
                title="Strengths"
                icon={<Rocket className="h-3.5 w-3.5 text-emerald-400" />}
            >
                <ul className="space-y-1.5">
                    {data.strengths.map((s, i) => (
                        <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-white/50"
                        >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                            {s}
                        </li>
                    ))}
                </ul>
            </ExpandableSection>

            <ExpandableSection
                title="Limitations"
                icon={<AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
            >
                <ul className="space-y-1.5">
                    {data.limitations.map((l, i) => (
                        <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-white/50"
                        >
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                            {l}
                        </li>
                    ))}
                </ul>
            </ExpandableSection>

            <ExpandableSection
                title="Use Cases"
                icon={<Rocket className="h-3.5 w-3.5 text-violet-400" />}
            >
                <div className="flex flex-wrap gap-2">
                    {data.use_cases.map((u, i) => (
                        <Badge
                            key={i}
                            className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px] font-mono"
                        >
                            {u}
                        </Badge>
                    ))}
                </div>
            </ExpandableSection>
        </Card>
    );
}
