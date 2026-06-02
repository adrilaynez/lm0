"use client";

import { memo } from "react";

import { MONO } from "./tokens";

/**
 * bigram/kit · Buttons — the chapter's two button shapes, in one place.
 *   • PlayButton — filled accent, the single "do it" action (Leer el libro, Tirar el dado, Empezar).
 *   • GhostButton — hollow accent text, the secondary action (Otra vez, Autocompletar, Contar el resto).
 *
 * Duplicated as StartButton/GhostButton (PairHighlighter) and `.bw-rt__play`/`.bw-it__btn` etc. Hover
 * is a token swap; no layout motion, so reduced-motion safe. Tokens-only.
 */

interface BtnProps {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: "button" | "submit";
    "aria-label"?: string;
}

const BASE: React.CSSProperties = {
    fontFamily: MONO,
    fontSize: 12.5,
    letterSpacing: ".1em",
    textTransform: "uppercase",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 22px",
    borderRadius: "var(--bigram-r-pill)",
    border: 0,
    whiteSpace: "nowrap",
    transition: "background .2s ease, color .2s ease, transform .15s ease, opacity .2s ease",
};

export const PlayButton = memo(function PlayButton({ children, onClick, disabled, type = "button", ...rest }: BtnProps) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            aria-label={rest["aria-label"]}
            style={{
                ...BASE,
                background: "var(--bigram-accent)",
                color: "var(--bigram-on-accent)",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.4 : 1,
            }}
            onMouseEnter={(e) => {
                if (!disabled) {
                    e.currentTarget.style.background = "var(--bigram-accent-bright)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--bigram-accent)";
                e.currentTarget.style.transform = "translateY(0)";
            }}
        >
            {children}
        </button>
    );
});

export const GhostButton = memo(function GhostButton({ children, onClick, disabled, type = "button", ...rest }: BtnProps) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            aria-label={rest["aria-label"]}
            style={{
                ...BASE,
                background: "transparent",
                color: "var(--bigram-accent)",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.4 : 1,
            }}
            onMouseEnter={(e) => {
                if (!disabled) e.currentTarget.style.background = "var(--bigram-accent-soft)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
            }}
        >
            {children}
        </button>
    );
});
