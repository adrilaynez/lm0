"use client";

import { useEffect, useRef, useState } from "react";

import { ChillHeroEffects } from "@/features/lab/components/chill/HeroEffects";
import { useI18n } from "@/i18n/context";

/**
 * Full-viewport hero. Owns:
 *   - mouse parallax on the text overlay (lerped via rAF)
 *   - spotlight follow via CSS variables (--mx, --my)
 *   - .door-active class on the section while the CTA is hovered
 *
 * Honors prefers-reduced-motion via the global media query in chill-lab.css
 * (animations are killed; this component still renders normally).
 */
export function ChillHero() {
    const { t } = useI18n();
    const heroRef = useRef<HTMLElement | null>(null);
    const textRef = useRef<HTMLDivElement | null>(null);
    const targetRef = useRef({ mx: 0, my: 0 });
    const currentRef = useRef({ mx: 0, my: 0 });
    const rafRef = useRef<number | null>(null);
    const [doorActive, setDoorActive] = useState(false);

    useEffect(() => {
        const hero = heroRef.current;
        const text = textRef.current;
        if (!hero || !text) return;

        const onMove = (e: MouseEvent) => {
            const rect = hero.getBoundingClientRect();
            const xPct = ((e.clientX - rect.left) / rect.width) * 100;
            const yPct = ((e.clientY - rect.top) / rect.height) * 100;
            targetRef.current.mx = (e.clientX - rect.left) / rect.width - 0.5;
            targetRef.current.my = (e.clientY - rect.top) / rect.height - 0.5;
            hero.style.setProperty("--mx", `${xPct.toFixed(2)}%`);
            hero.style.setProperty("--my", `${yPct.toFixed(2)}%`);
        };

        const onLeave = () => {
            targetRef.current.mx = 0;
            targetRef.current.my = 0;
        };

        const tick = () => {
            const t = targetRef.current;
            const c = currentRef.current;
            c.mx += (t.mx - c.mx) * 0.06;
            c.my += (t.my - c.my) * 0.06;
            text.style.transform = `translate(${c.mx * 5}px, ${c.my * 3}px)`;
            rafRef.current = window.requestAnimationFrame(tick);
        };

        hero.addEventListener("mousemove", onMove);
        hero.addEventListener("mouseleave", onLeave);
        rafRef.current = window.requestAnimationFrame(tick);

        return () => {
            hero.removeEventListener("mousemove", onMove);
            hero.removeEventListener("mouseleave", onLeave);
            if (rafRef.current !== null) {
                window.cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, []);

    return (
        <section
            ref={heroRef}
            className={`hero${doorActive ? " door-active" : ""}`}
            id="top"
        >
            <div className="hero-art" />
            <ChillHeroEffects />
            <div className="hero-scrim" aria-hidden="true" />
            <div className="hero-spotlight" aria-hidden="true" />

            <div className="hero-text" ref={textRef}>
                <div className="hero-title">
                    <div className="hero-kicker">
                        <span className="hr" />
                        <span>{t("lab.landing.chill.hero.kicker")}</span>
                    </div>
                    <h1 className="hero-h1">
                        {t("lab.landing.chill.hero.titlePrefix")}
                        <span className="pct">{t("lab.landing.chill.hero.titleAccent")}</span>
                        {t("lab.landing.chill.hero.titleSuffix")}
                    </h1>
                </div>

                <div className="hero-subs">
                    <p className="hero-sub">{t("lab.landing.chill.hero.subPunchy")}</p>
                    <p className="hero-sub soft">{t("lab.landing.chill.hero.subSoft")}</p>
                </div>

                <div className="hero-bottom">
                    <a
                        href="#prologue"
                        className="enter"
                        onMouseEnter={() => setDoorActive(true)}
                        onMouseLeave={() => setDoorActive(false)}
                        onFocus={() => setDoorActive(true)}
                        onBlur={() => setDoorActive(false)}
                    >
                        <span>{t("lab.landing.chill.hero.cta")}</span>
                        <span className="arr" aria-hidden="true">↓</span>
                    </a>
                    <div className="meta-strip">
                        <span>
                            <strong>05</strong> {t("lab.landing.chill.hero.metaChapters")}
                        </span>
                        <span>
                            <strong>80</strong> {t("lab.landing.chill.hero.metaYears")}
                        </span>
                        <span>{t("lab.landing.chill.hero.metaTime")}</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
