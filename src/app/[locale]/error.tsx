"use client";

/**
 * In-app error boundary for routes under [locale]. Renders inside the document shell
 * (fonts + theme available), so it can use the site's color tokens. Kept i18n-free on
 * purpose: it must stay robust even if a translation/render path is what failed.
 */
export default function LocaleError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <main className="flex min-h-[70vh] items-center justify-center px-6 py-24">
            <div className="max-w-lg text-center">
                <p className="mb-4 font-[family-name:var(--font-jetbrains-mono)] text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Error
                </p>
                <h1 className="mb-4 text-3xl font-semibold leading-tight text-foreground">
                    Something went wrong
                </h1>
                <p className="mb-8 leading-relaxed text-muted-foreground">
                    This section hit an unexpected error. Try again — most of the time that&rsquo;s all it takes.
                </p>
                <button
                    onClick={() => reset()}
                    className="inline-flex items-center gap-2 border border-foreground bg-foreground px-7 py-3.5 text-[13px] uppercase tracking-[0.06em] text-background transition-colors hover:bg-transparent hover:text-foreground"
                >
                    Try again
                </button>
                {error?.digest && (
                    <p className="mt-8 font-[family-name:var(--font-jetbrains-mono)] text-[11px] text-muted-foreground/60">
                        ref: {error.digest}
                    </p>
                )}
            </div>
        </main>
    );
}
