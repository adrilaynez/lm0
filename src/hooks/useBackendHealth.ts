"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type BackendStatus = "connecting" | "online" | "offline";

const HEALTH_URL = "/api/v1/health";
const HEALTH_TIMEOUT_MS = 45_000;
const RETRY_INTERVAL_MS = 10_000;
const SHOW_BANNER_DELAY_MS = 2_000;

export function useBackendHealth() {
    const [status, setStatus] = useState<BackendStatus>("connecting");
    const [showBanner, setShowBanner] = useState(false);
    const startTimeRef = useRef(Date.now());
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mountedRef = useRef(true);

    const checkHealth = useCallback(async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

        try {
            const res = await fetch(HEALTH_URL, {
                method: "GET",
                headers: { Accept: "application/json" },
                signal: controller.signal,
            });
            clearTimeout(timer);

            if (res.ok && mountedRef.current) {
                setStatus("online");
                setShowBanner(false);
                return;
            }
        } catch {
            clearTimeout(timer);
        }

        if (!mountedRef.current) return;

        const elapsed = Date.now() - startTimeRef.current;
        if (elapsed > HEALTH_TIMEOUT_MS) {
            setStatus("offline");
        }
        // else status stays "connecting"
    }, []);

    const retry = useCallback(() => {
        startTimeRef.current = Date.now();
        setStatus("connecting");
        setShowBanner(false);
        checkHealth();
    }, [checkHealth]);

    // Initial check + retry loop
    useEffect(() => {
        mountedRef.current = true;
        checkHealth();

        // Show banner after 2s if still connecting
        bannerTimerRef.current = setTimeout(() => {
            if (mountedRef.current) setShowBanner(true);
        }, SHOW_BANNER_DELAY_MS);

        const interval = setInterval(() => {
            if (mountedRef.current) checkHealth();
        }, RETRY_INTERVAL_MS);

        return () => {
            mountedRef.current = false;
            clearInterval(interval);
            if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        };
    }, [checkHealth]);

    // Hide banner once online
    useEffect(() => {
        if (status === "online") {
            setShowBanner(false);
        }
    }, [status]);

    return { status, showBanner, retry };
}
