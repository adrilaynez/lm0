"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { FadeInView } from "@/components/lab/FadeInView";
import { useI18n } from "@/i18n/context";

/**
 * Closing call-to-action. Stripped down to a single CTA pill on top of the
 * full-bleed illustration. The artwork carries the message; neon flickers,
 * CRT pulses, fog drift and mouse parallax make it feel alive.
 */
export function ChillAntiHero() {
    const { t } = useI18n();
    const sectionRef = useRef<HTMLElement | null>(null);
    const targetRef = useRef({ px: 0, py: 0 });
    const currentRef = useRef({ px: 0, py: 0 });
    const rafRef = useRef<number | null>(null);

    // Mouse parallax: we publish normalised cursor offset (-0.5 .. +0.5) on the
    // section as `--px` / `--py` CSS variables. The CSS layers consume them at
    // different multipliers to fake depth (background image moves more than
    // overlays). Lerped via rAF to keep things buttery.
    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const onMove = (e: MouseEvent) => {
            const rect = section.getBoundingClientRect();
            targetRef.current.px = (e.clientX - rect.left) / rect.width - 0.5;
            targetRef.current.py = (e.clientY - rect.top) / rect.height - 0.5;
        };
        const onLeave = () => {
            targetRef.current.px = 0;
            targetRef.current.py = 0;
        };
        const tick = () => {
            const t = targetRef.current;
            const c = currentRef.current;
            c.px += (t.px - c.px) * 0.06;
            c.py += (t.py - c.py) * 0.06;
            section.style.setProperty("--px", c.px.toFixed(3));
            section.style.setProperty("--py", c.py.toFixed(3));
            rafRef.current = window.requestAnimationFrame(tick);
        };

        section.addEventListener("mousemove", onMove);
        section.addEventListener("mouseleave", onLeave);
        rafRef.current = window.requestAnimationFrame(tick);

        return () => {
            section.removeEventListener("mousemove", onMove);
            section.removeEventListener("mouseleave", onLeave);
            if (rafRef.current !== null) {
                window.cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, []);

    return (
        <section ref={sectionRef} className="anti-hero" id="anti-hero">
            <div className="anti-hero-art" aria-hidden="true" />

            {/* Seven supporting screens + the big TRANSFORMER ARCHITECTURE,
                each flickering on its own clock. */}
            <div className="anti-hero-neon anti-hero-neon-s1" aria-hidden="true" />
            <div className="anti-hero-neon anti-hero-neon-s2" aria-hidden="true" />
            <div className="anti-hero-neon anti-hero-neon-s3" aria-hidden="true" />
            <div className="anti-hero-neon anti-hero-neon-s4" aria-hidden="true" />
            <div className="anti-hero-neon anti-hero-neon-s5" aria-hidden="true" />
            <div className="anti-hero-neon anti-hero-neon-s6" aria-hidden="true" />
            <div className="anti-hero-neon anti-hero-neon-s7" aria-hidden="true" />
            <div className="anti-hero-neon anti-hero-neon-crt" aria-hidden="true" />
            <div className="anti-hero-scanlines" aria-hidden="true" />

            {/* Atmosphere: warm doorway glow + drifting fog + ambient dust. */}
            <div className="anti-hero-fog" aria-hidden="true" />
            <div className="anti-hero-dust" aria-hidden="true" />
            <div className="anti-hero-door-glow" aria-hidden="true" />

            <div className="anti-hero-scrim" aria-hidden="true" />
            <div className="anti-hero-content">
                <FadeInView>
                    <Link href="/lab/bigram" className="anti-hero-cta">
                        <span>{t("lab.landing.chill.antiHero.cta")}</span>
                        <span className="arr" aria-hidden="true">→</span>
                    </Link>
                </FadeInView>
            </div>
        </section>
    );
}
