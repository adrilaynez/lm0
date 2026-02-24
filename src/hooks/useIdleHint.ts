"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Shows a hint after the user has been idle (no scroll/click/key)
 * for `idleMs` milliseconds while the target element is visible.
 */
export function useIdleHint(idleMs: number = 8000) {
    const [showHint, setShowHint] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const visibleRef = useRef(false);
    const dismissedRef = useRef(false);

    const reset = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setShowHint(false);
        if (visibleRef.current && !dismissedRef.current) {
            timerRef.current = setTimeout(() => setShowHint(true), idleMs);
        }
    }, [idleMs]);

    const dismiss = useCallback(() => {
        dismissedRef.current = true;
        setShowHint(false);
        if (timerRef.current) clearTimeout(timerRef.current);
    }, []);

    const setVisible = useCallback((v: boolean) => {
        visibleRef.current = v;
        if (v && !dismissedRef.current) {
            reset();
        } else {
            if (timerRef.current) clearTimeout(timerRef.current);
            setShowHint(false);
        }
    }, [reset]);

    // Listen to user activity to reset timer
    useEffect(() => {
        const handler = () => reset();
        window.addEventListener("scroll", handler, { passive: true });
        window.addEventListener("click", handler);
        window.addEventListener("keydown", handler);
        return () => {
            window.removeEventListener("scroll", handler);
            window.removeEventListener("click", handler);
            window.removeEventListener("keydown", handler);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [reset]);

    return { showHint, dismiss, setVisible };
}
