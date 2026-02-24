"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface StoredProgress {
    lastSection: string;
    scrollPct: number;
    timestamp: number;
}

export interface UseProgressTrackerReturn {
    currentSection: string;
    scrollPct: number;
    hasStoredProgress: boolean;
    storedSection: string;
    clearProgress: () => void;
}

const STALE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const DEBOUNCE_MS = 2_000;

export function useProgressTracker(pageId: string): UseProgressTrackerReturn {
    const storageKey = `lm-lab-progress-${pageId}`;

    const [currentSection, setCurrentSection] = useState("");
    const [scrollPct, setScrollPct] = useState(0);
    const [storedSection, setStoredSection] = useState("");
    const [hasStoredProgress, setHasStoredProgress] = useState(false);

    const writeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentSectionRef = useRef("");
    const scrollPctRef = useRef(0);

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

    const scheduleWrite = useCallback(() => {
        if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
        writeTimerRef.current = setTimeout(() => {
            if (!currentSectionRef.current) return;
            const payload: StoredProgress = {
                lastSection: currentSectionRef.current,
                scrollPct: scrollPctRef.current,
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

    // Scroll percentage tracking
    useEffect(() => {
        const onScroll = () => {
            const scrolled = window.scrollY;
            const total = document.documentElement.scrollHeight - window.innerHeight;
            const pct = total > 0 ? Math.round((scrolled / total) * 100) : 0;
            scrollPctRef.current = pct;
            setScrollPct(pct);
            scheduleWrite();
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
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

    return { currentSection, scrollPct, hasStoredProgress, storedSection, clearProgress };
}
