"use client";

import { useEffect, useCallback } from "react";

interface ShortcutHandlers {
    onHelp: () => void;
    onPrevSection: () => void;
    onNextSection: () => void;
    onEscape: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
    const onKeyDown = useCallback((e: KeyboardEvent) => {
        // Ignore if user is typing in an input/textarea
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

        switch (e.key) {
            case "?":
                e.preventDefault();
                handlers.onHelp();
                break;
            case "ArrowLeft":
                if (!e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    handlers.onPrevSection();
                }
                break;
            case "ArrowRight":
                if (!e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    handlers.onNextSection();
                }
                break;
            case "Escape":
                handlers.onEscape();
                break;
        }
    }, [handlers]);

    useEffect(() => {
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onKeyDown]);
}
