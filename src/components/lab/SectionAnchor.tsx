"use client";

import React, { useState, useCallback } from "react";
import { Link2 } from "lucide-react";

interface SectionAnchorProps {
    id: string;
    children: React.ReactNode;
}

/**
 * Wraps a heading and shows a subtle # link icon on hover.
 * Click copies the deep link URL to clipboard.
 */
export function SectionAnchor({ id, children }: SectionAnchorProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        const url = `${window.location.origin}${window.location.pathname}#${id}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    }, [id]);

    return (
        <div id={id} className="group relative scroll-mt-20">
            {children}
            <button
                onClick={handleCopy}
                className="absolute -left-7 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-1 rounded text-[var(--lab-text-subtle)]"
                aria-label={`Copy link to section ${id}`}
                title={copied ? "Copied!" : "Copy link"}
            >
                <Link2 className="w-4 h-4" />
            </button>
            {copied && (
                <span className="absolute -left-7 top-full mt-1 text-[10px] font-mono text-emerald-400 whitespace-nowrap">
                    Copied!
                </span>
            )}
        </div>
    );
}
