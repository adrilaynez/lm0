import type { Instrumentation } from "next";

/**
 * Server/edge Sentry init — GATED behind NEXT_PUBLIC_SENTRY_DSN. With no DSN set the
 * SDK is never imported or initialized, so the app is completely inert (no build or
 * runtime impact). Set the DSN in the environment to turn error reporting on. We do
 * NOT wrap next.config with withSentryConfig — runtime capture works standalone.
 */
export async function register() {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;

    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
        dsn,
        tracesSampleRate: 0.1,
    });
}

export const onRequestError: Instrumentation.onRequestError = async (...args) => {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureRequestError(...args);
};
