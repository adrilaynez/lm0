"use client";

import React, { useCallback,useEffect, useRef, useState } from "react";

import { glossary } from "@/content/glossary";
import { useI18n } from "@/i18n/context";

interface TermProps {
    word: string;
    children?: React.ReactNode;
}

/**
 * Scoped v8 styling for the underlined term.
 *
 * Default (every other chapter): dotted --lab-text-muted underline + --lab-text,
 * exactly as before. Inside the Bigram chapter ([data-bigram-theme]) the same
 * markup opts into the editorial-green v8 ".term": a dashed --bigram-accent-2
 * under-border on --bigram-ink. The green is gated entirely by the
 * [data-bigram-theme] scope, so no other accent is ever touched.
 */
const TERM_STYLE_ID = "bigram-term-style";
const TERM_SCOPED_CSS = `
[data-bigram-theme] .glossary-term__underline {
    color: var(--bigram-ink);
    border-bottom-style: dashed;
    border-bottom-color: var(--bigram-accent-2);
}
[data-bigram-theme] .glossary-term__eyebrow {
    color: var(--bigram-accent-ink);
}
`;

function useBigramTermStyle() {
    useEffect(() => {
        if (typeof document === "undefined") return;
        if (document.getElementById(TERM_STYLE_ID)) return;
        const el = document.createElement("style");
        el.id = TERM_STYLE_ID;
        el.textContent = TERM_SCOPED_CSS;
        document.head.appendChild(el);
    }, []);
}

export function Term({ word, children }: TermProps) {
    const { language } = useI18n();
    const [show, setShow] = useState(false);
    const [pos, setPos] = useState<"above" | "below">("above");
    const termRef = useRef<HTMLSpanElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useBigramTermStyle();

    const entry = glossary[word.toLowerCase()];
    const definition = entry
        ? language === "es" ? entry.es : entry.en
        : null;

    const updatePosition = useCallback(() => {
        if (!termRef.current) return;
        const rect = termRef.current.getBoundingClientRect();
        // If too close to top, show below
        setPos(rect.top < 120 ? "below" : "above");
    }, []);

    // Desktop hover
    const handleMouseEnter = useCallback(() => {
        updatePosition();
        setShow(true);
    }, [updatePosition]);

    // Mobile tap
    const handleClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        updatePosition();
        setShow((v) => !v);
    }, [updatePosition]);

    // Close on outside click (mobile)
    useEffect(() => {
        if (!show) return;
        const handler = (e: MouseEvent) => {
            if (
                termRef.current && !termRef.current.contains(e.target as Node) &&
                tooltipRef.current && !tooltipRef.current.contains(e.target as Node)
            ) {
                setShow(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [show]);

    if (!definition) {
        return <>{children || word}</>;
    }

    return (
        <span
            ref={termRef}
            className="relative inline cursor-help"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setShow(false)}
            onClick={handleClick}
        >
            <span className="glossary-term__underline border-b border-dotted border-[var(--lab-text-muted)] text-[var(--lab-text)]">
                {children || word}
            </span>

            {show && (
                <div
                    ref={tooltipRef}
                    role="tooltip"
                    className={`absolute z-50 w-64 px-3 py-2.5 rounded-xl border border-[var(--lab-border)] bg-[var(--lab-viz-bg)] shadow-xl text-xs text-white/80 leading-relaxed pointer-events-auto
                        ${pos === "above"
                            ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
                            : "top-full mt-2 left-1/2 -translate-x-1/2"
                        }
                    `}
                >
                    <div className="glossary-term__eyebrow font-mono text-[10px] uppercase tracking-widest text-emerald-400/70 mb-1">
                        {word}
                    </div>
                    <div>{definition}</div>
                    {/* Arrow */}
                    <div
                        className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-[var(--lab-border)] bg-[var(--lab-viz-bg)]
                            ${pos === "above"
                                ? "top-full -mt-1 border-r border-b"
                                : "bottom-full -mb-1 border-l border-t"
                            }
                        `}
                    />
                </div>
            )}
        </span>
    );
}
