"use client";

import { useState, useCallback } from "react";
import { useUser } from "@/context/UserContext";

const BASE_URL = process.env.NEXT_PUBLIC_LM_LAB_API_URL ?? "";
const RATE_LIMIT_KEY_PREFIX = "lm-lab-feedback-";
const RATE_LIMIT_MS = 30 * 1000; // 30 seconds

interface UseFeedbackOptions {
    pageId: string;
    sectionId: string;
}

interface SubmitOptions {
    comment: string;
    title?: string;
    name?: string;
    screenshotB64?: string;
    userScreenshotB64?: string;
}

interface UseFeedbackReturn {
    submit: (opts: SubmitOptions) => Promise<void>;
    isSubmitting: boolean;
    error: string | null;
    success: boolean;
    isRateLimited: boolean;
}

function checkLocalRateLimit(pageId: string, sectionId: string): boolean {
    try {
        const key = `${RATE_LIMIT_KEY_PREFIX}${pageId}:${sectionId}`;
        const last = localStorage.getItem(key);
        if (!last) return false;
        return Date.now() - parseInt(last, 10) < RATE_LIMIT_MS;
    } catch {
        return false;
    }
}

function setLocalRateLimit(pageId: string, sectionId: string): void {
    try {
        const key = `${RATE_LIMIT_KEY_PREFIX}${pageId}:${sectionId}`;
        localStorage.setItem(key, String(Date.now()));
    } catch {
        // localStorage unavailable
    }
}

/** Safely extract a human-readable error string from a FastAPI error response */
function extractErrorMessage(data: unknown, status: number): string {
    if (!data || typeof data !== "object") return `Error ${status}`;
    const obj = data as Record<string, unknown>;
    // FastAPI validation errors: detail is an array of {loc, msg, type}
    if (Array.isArray(obj.detail)) {
        return obj.detail
            .map((d: unknown) => {
                if (typeof d === "string") return d;
                if (d && typeof d === "object" && "msg" in d) return String((d as Record<string, unknown>).msg);
                return JSON.stringify(d);
            })
            .join("; ");
    }
    // FastAPI HTTPException: detail is a string
    if (typeof obj.detail === "string") return obj.detail;
    // Fallback
    return `Error ${status}`;
}

export function useFeedback({ pageId, sectionId }: UseFeedbackOptions): UseFeedbackReturn {
    const { anonId, displayName } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const normalizedPageId = pageId || "unknown";
    const normalizedSectionId = sectionId || "general";

    const isRateLimited = typeof window !== "undefined"
        ? checkLocalRateLimit(normalizedPageId, normalizedSectionId)
        : false;

    const submit = useCallback(async (opts: SubmitOptions) => {
        setError(null);
        setSuccess(false);

        if (checkLocalRateLimit(normalizedPageId, normalizedSectionId)) {
            setError("Please wait 30 seconds before submitting again.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`${BASE_URL}/api/v1/feedback`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    page_id: normalizedPageId,
                    section_id: normalizedSectionId,
                    comment: opts.comment,
                    title: opts.title || undefined,
                    anon_id: anonId || undefined,
                    name: opts.name || displayName || undefined,
                    screenshot_b64: opts.screenshotB64 || undefined,
                    user_screenshot_b64: opts.userScreenshotB64 || undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(extractErrorMessage(data, res.status));
            }

            setLocalRateLimit(normalizedPageId, normalizedSectionId);
            setSuccess(true);
        } catch (e: unknown) {
            if (e instanceof Error) {
                setError(e.message);
            } else if (typeof e === "string") {
                setError(e);
            } else {
                setError("Failed to submit feedback. Check your connection.");
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [normalizedPageId, normalizedSectionId, anonId, displayName]);

    return { submit, isSubmitting, error, success, isRateLimited };
}
