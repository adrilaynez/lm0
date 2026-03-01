"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lightweight replacement for framer-motion's whileInView={{ opacity: 1, y: 0 }}.
 * Uses IntersectionObserver + CSS transitions instead of JS-driven animation frames.
 * Significantly cheaper than motion.div for simple entrance animations.
 */
export function FadeInView({
    as: Tag = "div",
    className = "",
    margin = "-60px",
    delay = 0,
    children,
    ...rest
}: {
    as?: "div" | "figure" | "section" | "footer" | "aside" | "blockquote" | "header" | "p" | "h2" | "span";
    className?: string;
    margin?: string;
    delay?: number;
    children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
    const ref = useRef<HTMLElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    io.disconnect();
                }
            },
            { rootMargin: margin }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [margin]);

    const delayStyle = delay > 0 ? { transitionDelay: `${delay}s` } : undefined;

    return (
        <Tag
            ref={ref as any}
            className={`transition-all duration-500 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
                } ${className}`}
            style={delayStyle}
            {...rest}
        >
            {children}
        </Tag>
    );
}
