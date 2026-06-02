"use client";

import { memo } from "react";

import { MONO } from "./tokens";

/**
 * bigram/kit · Tabs — the pill segmented control (sunk rail, active cell filled accent) used to switch
 * between texts/variants (from IsolateT's `.bw-it__tabs`). Tokens-only, no motion.
 */
export interface TabsProps {
    tabs: string[];
    active: number;
    onChange: (index: number) => void;
    ariaLabel?: string;
}

export const Tabs = memo(function Tabs({ tabs, active, onChange, ariaLabel }: TabsProps) {
    return (
        <div
            role="tablist"
            aria-label={ariaLabel}
            style={{
                display: "inline-flex",
                gap: 6,
                padding: 5,
                borderRadius: "var(--bigram-r-pill)",
                background: "var(--bigram-bg-2)",
            }}
        >
            {tabs.map((label, i) => {
                const on = i === active;
                return (
                    <button
                        key={i}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => onChange(i)}
                        style={{
                            fontFamily: MONO,
                            fontSize: 12,
                            letterSpacing: ".06em",
                            color: on ? "var(--bigram-on-accent)" : "var(--bigram-muted)",
                            background: on ? "var(--bigram-accent)" : "transparent",
                            border: 0,
                            cursor: "pointer",
                            padding: "8px 16px",
                            borderRadius: "var(--bigram-r-pill)",
                            transition: "background .2s ease, color .2s ease",
                        }}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
});

export default Tabs;
