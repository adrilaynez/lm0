"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { glossary } from "@/content/glossary";
import { useI18n } from "@/i18n/context";

interface TermProps {
    word: string;
    children?: React.ReactNode;
}

export function Term({ word, children }: TermProps) {
    const { language } = useI18n();
    const [show, setShow] = useState(false);
    const [pos, setPos] = useState<"above" | "below">("above");
    const termRef = useRef<HTMLSpanElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

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
            <span className="border-b border-dotted border-[var(--lab-text-muted)] text-[var(--lab-text)]">
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
                    <div className="font-mono text-[10px] uppercase tracking-widest text-emerald-400/70 mb-1">
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
