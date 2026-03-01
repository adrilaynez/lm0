"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

/* ──────────────────────────────────────────────────────────
   Scroll Store — ref-based, zero-context, zero re-render overhead.

   How it works:
   • A single rAF-throttled scroll/resize listener updates a ref.
   • Components subscribe via useSyncExternalStore with a selector
     (useScrollY, useScrollPct, or useScroll for both).
   • Re-renders only happen when the selected value actually changes.
   • The old ScrollProvider wrapper is kept for backward compatibility
     but is now a transparent passthrough — it triggers NO re-renders.
   ────────────────────────────────────────────────────────── */

interface ScrollState {
    scrollY: number;
    scrollPct: number;
}

// ── Singleton scroll store ──────────────────────────────────

type Listener = () => void;

let _state: ScrollState = { scrollY: 0, scrollPct: 0 };
const _listeners = new Set<Listener>();
let _rafId: number | null = null;
let _initialized = false;

function _update() {
    const y = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const pct = total > 0 ? (y / total) * 100 : 0;

    // Only notify if values actually changed
    if (y !== _state.scrollY || pct !== _state.scrollPct) {
        _state = { scrollY: y, scrollPct: pct };
        _listeners.forEach((l) => l());
    }
    _rafId = null;
}

function _onEvent() {
    if (_rafId === null) {
        _rafId = requestAnimationFrame(_update);
    }
}

function _init() {
    if (_initialized || typeof window === "undefined") return;
    _initialized = true;
    window.addEventListener("scroll", _onEvent, { passive: true });
    window.addEventListener("resize", _onEvent);
    _update();
}

function subscribe(listener: Listener): () => void {
    _init();
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
}

function getSnapshot(): ScrollState {
    return _state;
}

function getServerSnapshot(): ScrollState {
    return { scrollY: 0, scrollPct: 0 };
}

// ── Public hooks ────────────────────────────────────────────

/**
 * Returns { scrollY, scrollPct }. Re-renders only when either value changes.
 * Drop-in replacement for the old useScroll().
 */
export function useScroll(): ScrollState {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Returns only scrollY. Re-renders only when scrollY changes.
 */
export function useScrollY(): number {
    const selectY = useCallback(() => _state.scrollY, []);
    return useSyncExternalStore(
        subscribe,
        selectY,
        () => 0,
    );
}

/**
 * Returns only scrollPct. Re-renders only when scrollPct changes.
 */
export function useScrollPct(): number {
    const selectPct = useCallback(() => _state.scrollPct, []);
    return useSyncExternalStore(
        subscribe,
        selectPct,
        () => 0,
    );
}

/**
 * ScrollProvider — kept for backward compatibility.
 * It is now a transparent passthrough that triggers NO re-renders.
 * The scroll store is a module-level singleton initialized on first subscribe.
 */
export function ScrollProvider({ children }: { children: React.ReactNode }) {
    // Ensure the singleton listener is set up when the provider mounts
    useEffect(() => { _init(); }, []);
    return <>{children}</>;
}

/**
 * Read scroll values without triggering re-renders.
 * Useful for event handlers and imperative code.
 */
export function getScrollState(): ScrollState {
    return _state;
}

/**
 * Subscribe to scroll changes and call `callback` with the DOM element directly.
 * Useful for progress bars that should update via DOM mutation, not React re-renders.
 */
export function useScrollDomEffect(callback: (state: ScrollState) => void) {
    const cbRef = useRef(callback);
    cbRef.current = callback;

    useEffect(() => {
        _init();
        const listener = () => cbRef.current(_state);
        _listeners.add(listener);
        // Initial call
        listener();
        return () => { _listeners.delete(listener); };
    }, []);
}
