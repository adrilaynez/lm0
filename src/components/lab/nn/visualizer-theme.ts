export type VisualizerFamily = "neuron" | "function" | "dashboard" | "comparison";

export const NN_COLORS = {
    input: { tw: "sky-400", hex: "#38bdf8" },
    weight: { tw: "rose-400", hex: "#fb7185" },
    bias: { tw: "violet-400", hex: "#a78bfa" },
    output: { tw: "emerald-400", hex: "#34d399" },
    target: { tw: "amber-400", hex: "#fbbf24" },
    error: { tw: "rose-500", hex: "#f43f5e" },
    hidden: { tw: "indigo-400", hex: "#818cf8" },
} as const;

export type NNColorKey = keyof typeof NN_COLORS;

export const FAMILY_STYLES: Record<VisualizerFamily, {
    border: string;
    bg: string;
    bar: string;
    labelText: string;
    accentText: string;
    labelFont: string;
}> = {
    neuron: {
        border: "border-rose-500/[0.18]",
        bg: "bg-[radial-gradient(ellipse_at_top,rgba(244,63,94,0.06),transparent_70%)] bg-black/40",
        bar: "border-rose-500/[0.12] bg-rose-500/[0.04]",
        labelText: "text-rose-400/60",
        accentText: "text-rose-300/50",
        labelFont: "font-mono",
    },
    function: {
        border: "border-indigo-500/[0.15]",
        bg: "bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:24px_24px] bg-black/30",
        bar: "border-indigo-500/[0.1] bg-indigo-500/[0.02]",
        labelText: "text-indigo-400/60",
        accentText: "text-indigo-300/50",
        labelFont: "font-mono",
    },
    dashboard: {
        border: "border-amber-500/[0.18]",
        bg: "bg-gradient-to-br from-amber-950/20 via-black/50 to-black/60",
        bar: "border-amber-500/[0.1] bg-amber-500/[0.03]",
        labelText: "text-amber-400/60",
        accentText: "text-amber-300/50",
        labelFont: "font-sans",
    },
    comparison: {
        border: "border-white/[0.08]",
        bg: "bg-black/30",
        bar: "border-white/[0.06] bg-white/[0.015]",
        labelText: "text-white/40",
        accentText: "text-white/30",
        labelFont: "font-mono",
    },
};
