"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getScrollState } from "@/context/ScrollContext";

export interface StoredProgress {
    lastSection: string;
    scrollPct: number;
    timestamp: number;
}

export interface UseProgressTrackerReturn {
    currentSection: string;
    hasStoredProgress: boolean;
    storedSection: string;
    clearProgress: () => void;
}

const STALE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const DEBOUNCE_MS = 2_000;

export function useProgressTracker(pageId: string): UseProgressTrackerReturn {
    const storageKey = `lm-lab-progress-${pageId}`;

    const [currentSection, setCurrentSection] = useState("");
    const [storedSection, setStoredSection] = useState("");
    const [hasStoredProgress, setHasStoredProgress] = useState(false);

    const writeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentSectionRef = useRef("");

    // Load stored progress on mount
    useEffect(() => {
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) {
                const parsed: StoredProgress = JSON.parse(raw);
                if (Date.now() - parsed.timestamp < STALE_MS) {
                    setStoredSection(parsed.lastSection);
                    setHasStoredProgress(true);
                }
            }
        } catch {
            // ignore parse errors
        }
    }, [storageKey]);

    // Read scrollPct imperatively at write time — no reactive dependency
    const scheduleWrite = useCallback(() => {
        if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
        writeTimerRef.current = setTimeout(() => {
            if (!currentSectionRef.current) return;
            const payload: StoredProgress = {
                lastSection: currentSectionRef.current,
                scrollPct: Math.round(getScrollState().scrollPct),
                timestamp: Date.now(),
            };
            try {
                localStorage.setItem(storageKey, JSON.stringify(payload));
            } catch {
                // quota exceeded — ignore
            }
        }, DEBOUNCE_MS);
    }, [storageKey]);

    // IntersectionObserver to track which section is most visible
    useEffect(() => {
        const sections = document.querySelectorAll<HTMLElement>("section[id]");
        if (!sections.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                        const id = (entry.target as HTMLElement).id;
                        currentSectionRef.current = id;
                        setCurrentSection(id);
                        scheduleWrite();
                    }
                });
            },
            { threshold: 0.5 }
        );

        sections.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [scheduleWrite]);

    const clearProgress = useCallback(() => {
        try {
            localStorage.removeItem(storageKey);
        } catch {
            // ignore
        }
        setHasStoredProgress(false);
        setStoredSection("");
    }, [storageKey]);

    return { currentSection, hasStoredProgress, storedSection, clearProgress };
}
