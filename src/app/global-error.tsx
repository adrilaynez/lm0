"use client";

/**
 * Last-resort error boundary. It replaces the ENTIRE document when the root layout
 * itself fails, so it must render its own <html>/<body> and rely on NOTHING — no
 * providers, no theme, no i18n, no CSS classes (inline styles only).
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body
                style={{
                    margin: 0,
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#0a0a0a",
                    color: "#fafafa",
                    fontFamily:
                        "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                    padding: "2rem",
                }}
            >
                <main style={{ maxWidth: "32rem", textAlign: "center" }}>
                    <p
                        style={{
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                            fontSize: "0.75rem",
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            color: "#a1a1a1",
                            margin: "0 0 1rem",
                        }}
                    >
                        Error
                    </p>
                    <h1
                        style={{
                            fontSize: "1.875rem",
                            fontWeight: 600,
                            lineHeight: 1.2,
                            margin: "0 0 1rem",
                        }}
                    >
                        Something went wrong
                    </h1>
                    <p style={{ color: "#a1a1a1", lineHeight: 1.6, margin: "0 0 2rem" }}>
                        An unexpected error broke this page. You can try again — if it keeps happening, please
                        come back in a bit.
                    </p>
                    <button
                        onClick={() => reset()}
                        style={{
                            cursor: "pointer",
                            border: "1px solid #fafafa",
                            background: "#fafafa",
                            color: "#0a0a0a",
                            padding: "0.75rem 1.75rem",
                            fontSize: "0.8125rem",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            borderRadius: 0,
                        }}
                    >
                        Try again
                    </button>
                    {error?.digest && (
                        <p
                            style={{
                                marginTop: "2rem",
                                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                                fontSize: "0.6875rem",
                                color: "#525252",
                            }}
                        >
                            ref: {error.digest}
                        </p>
                    )}
                </main>
            </body>
        </html>
    );
}
