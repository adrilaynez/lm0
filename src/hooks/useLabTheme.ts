"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

export type LabTheme = "dark" | "light";

const STORAGE_KEY = "lm-lab-theme";

export function useLabTheme() {
    const [theme, setThemeState] = useState<LabTheme>("dark");
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY) as LabTheme | null;
        if (saved === "light" || saved === "dark") {
            setThemeState(saved);
        }
        setIsInitialized(true);
    }, []);

    const setTheme = useCallback((next: LabTheme) => {
        setThemeState(next);
        localStorage.setItem(STORAGE_KEY, next);
    }, []);

    const toggle = useCallback(() => {
        setTheme(theme === "dark" ? "light" : "dark");
    }, [theme, setTheme]);

    return useMemo(
        () => ({ theme, setTheme, toggle, isInitialized }),
        [theme, setTheme, toggle, isInitialized]
    );
}
