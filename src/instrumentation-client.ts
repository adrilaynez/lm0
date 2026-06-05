/**
 * Client Sentry init — GATED behind NEXT_PUBLIC_SENTRY_DSN. The var is inlined at build
 * time, so when it is unset this whole block is dead code and Sentry is tree-shaken out
 * of the client bundle entirely — zero bundle cost when reporting is off. Set the DSN to
 * enable it.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
    import("@sentry/nextjs").then((Sentry) => {
        Sentry.init({
            dsn,
            tracesSampleRate: 0.1,
            replaysSessionSampleRate: 0,
            replaysOnErrorSampleRate: 0,
        });
    });
}
