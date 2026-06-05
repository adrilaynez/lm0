import Link from "next/link";

/**
 * Root 404 fallback for paths outside any [locale] segment. The root layout is a thin
 * pass-through (no <html>/<body>), so this renders its own document shell with inline
 * styles. The localized 404 ([locale]/not-found.tsx) covers normal in-app misses.
 */
export default function RootNotFound() {
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
                        404
                    </p>
                    <h1 style={{ fontSize: "1.875rem", fontWeight: 600, lineHeight: 1.2, margin: "0 0 1rem" }}>
                        Page not found
                    </h1>
                    <p style={{ color: "#a1a1a1", lineHeight: 1.6, margin: "0 0 2rem" }}>
                        The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
                    </p>
                    <Link
                        href="/"
                        style={{
                            display: "inline-block",
                            textDecoration: "none",
                            border: "1px solid #fafafa",
                            background: "#fafafa",
                            color: "#0a0a0a",
                            padding: "0.75rem 1.75rem",
                            fontSize: "0.8125rem",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                        }}
                    >
                        Back home
                    </Link>
                </main>
            </body>
        </html>
    );
}
