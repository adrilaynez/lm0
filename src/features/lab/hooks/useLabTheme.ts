"use client";

import { useCallback, useSyncExternalStore } from "react";

export type LabTheme = "dark" | "light";

const STORAGE_KEY = "lm-lab-theme";

/**
 * Shared module-level theme store.
 *
 * Every consumer (LabShell chrome, the chapter's [data-bigram-theme] wrapper, …)
 * must reflect the SAME theme and re-render together when it changes. The old
 * implementation kept a separate `useState` per hook call, so the top-bar toggle
 * updated LabShell but NOT the chapter wrapper until a full reload. A single
 * external store fixes that: one source of truth, instant sync across consumers.
 *
 * Default falls back to the OS `prefers-color-scheme` when there is no saved
 * preference; a manual toggle persists to localStorage and wins thereafter.
 */
let currentTheme: LabTheme = "dark";
let initialized = false;
const listeners = new Set<() => void>();

function emit() {
    for (const listener of listeners) listener();
}

function ensureInit() {
    if (initialized || typeof window === "undefined") return;
    const saved = localStorage.getItem(STORAGE_KEY) as LabTheme | null;
    if (saved === "light" || saved === "dark") {
        currentTheme = saved;
    } else {
        currentTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    }
    initialized = true;
}

function subscribe(callback: () => void) {
    // Lazy one-time init on the first client subscription, then notify everyone
    // (deferred so listeners are never called synchronously during subscribe).
    if (!initialized && typeof window !== "undefined") {
        ensureInit();
        queueMicrotask(emit);
    }
    listeners.add(callback);
    return () => {
        listeners.delete(callback);
    };
}

function getThemeSnapshot(): LabTheme {
    return currentTheme;
}
function getServerThemeSnapshot(): LabTheme {
    return "dark";
}
function getInitSnapshot(): boolean {
    return initialized;
}
function getServerInitSnapshot(): boolean {
    return false;
}

function setThemeGlobal(next: LabTheme) {
    currentTheme = next;
    initialized = true;
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, next);
    emit();
}

export function useLabTheme() {
    const theme = useSyncExternalStore(
        subscribe,
        getThemeSnapshot,
        getServerThemeSnapshot,
    );
    const isInitialized = useSyncExternalStore(
        subscribe,
        getInitSnapshot,
        getServerInitSnapshot,
    );

    const setTheme = useCallback((next: LabTheme) => setThemeGlobal(next), []);
    const toggle = useCallback(
        () => setThemeGlobal(currentTheme === "dark" ? "light" : "dark"),
        [],
    );

    return { theme, setTheme, toggle, isInitialized };
}
