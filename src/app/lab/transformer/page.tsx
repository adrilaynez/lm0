"use client";

import dynamic from "next/dynamic";

import { ErrorBoundary } from "@/components/lab/ErrorBoundary";
import { LabShell } from "@/components/lab/LabShell";

const TransformerNarrative = dynamic(
    () => import("@/components/lab/TransformerNarrative").then((m) => ({ default: m.TransformerNarrative })),
    {
        ssr: false,
        loading: () => (
            <div className="max-w-3xl mx-auto px-6 py-24 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin mb-6" />
                <p className="text-sm text-white/30 font-mono">Loading…</p>
            </div>
        ),
    }
);

export default function TransformerPage() {
    return (
        <LabShell>
            <ErrorBoundary fallbackMessage="The Transformer narrative encountered an error">
                <TransformerNarrative />
            </ErrorBoundary>
        </LabShell>
    );
}
