"use client";

import { useEffect, useRef, useState } from "react";

/**
 * LazySection — mounts children only when the container is near the viewport.
 * Uses IntersectionObserver with a generous rootMargin so content loads
 * before the user scrolls to it. Once mounted, children stay mounted
 * (no unmount on scroll-away) to preserve component state.
 */
export function LazySection({
    children,
    rootMargin = "200px",
    className,
}: {
    children: React.ReactNode;
    rootMargin?: string;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [hasIntersected, setHasIntersected] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setHasIntersected(true);
                    observer.disconnect();
                }
            },
            { rootMargin }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [rootMargin]);

    return (
        <div ref={ref} className={className}>
            {hasIntersected ? children : null}
        </div>
    );
}

/**
 * Skeleton placeholder shown while a lazy-loaded visualizer is loading.
 * Matches the typical height of interactive demos to prevent layout shift.
 */
export function SectionSkeleton() {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-white/10 border-t-white/30 animate-spin" />
            <p className="text-[11px] font-mono text-white/20">Loading visualizer…</p>
        </div>
    );
}
