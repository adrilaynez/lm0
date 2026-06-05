"use client";

import Image from "next/image";

import { useI18n } from "@/i18n/context";
import { Link } from "@/i18n/navigation";

import { FadeUp } from "./fade-up";

export function HomeFace({ onAbout }: { onAbout: () => void }) {
  const { t, language, setLanguage } = useI18n();

  const nav = [
    { label: t("home.nav.latentSpace"), href: "/latent-space" },
    { label: t("home.nav.lab"), href: "/lab" },
    { label: t("home.nav.contact"), href: null },
  ];

  return (
    <div className="h-full min-h-[100dvh] lg:min-h-0 grid grid-cols-1 lg:grid-cols-[2fr_3fr]">
      {/* Left: Photo */}
      <div className="relative h-[45vh] lg:h-full">
        <Image
          src="/Adrian.png"
          alt="Adrián Laynez"
          fill
          sizes="(max-width: 1024px) 100vw, 40vw"
          className="object-cover"
          style={{ objectPosition: "center 25%" }}
          priority
        />
        {/* Mobile: fade photo bottom into cream panel */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#EDE8E0] to-transparent lg:hidden" />
      </div>

      {/* Right: Content */}
      <div className="flex flex-col bg-[#EDE8E0] px-10 py-12 lg:px-24 lg:py-16 min-h-[55dvh] lg:h-full">
        {/* Top spacer to push content slightly above center */}
        <div className="hidden lg:block lg:h-[5vh]" />

        {/* Main content block */}
        <div className="flex-1 flex flex-col justify-center lg:justify-start max-w-[44rem]">
          <FadeUp delay={0.1}>
            <h1
              className="font-serif font-bold text-[#1a1714] leading-[0.92] tracking-[-0.02em]"
              style={{ fontSize: "clamp(2.75rem, 5.8vw, 6.25rem)" }}
            >
              ADRIAN
              <br />
              <span className="block">LAYNEZ ORTIZ</span>
            </h1>
          </FadeUp>

          <FadeUp delay={0.3}>
            <p className="mt-9 font-mono text-[13px] lg:text-[14px] tracking-[0.32em] text-[#6b6560] uppercase">
              {t("home.role")}
            </p>
          </FadeUp>

          <FadeUp delay={0.45}>
            <div className="mt-7 h-[2px] w-14 bg-[#2d5016]" />
          </FadeUp>

          <FadeUp delay={0.55}>
            <p className="mt-8 max-w-[32rem] text-[17px] leading-[1.7] text-[#3a3430] font-light lg:text-[20px] lg:leading-[1.7]">
              {t("home.tagline")}
            </p>
          </FadeUp>

          <FadeUp delay={0.7}>
            <div className="mt-12 flex items-center gap-14">
              <Link
                href="/projects"
                className="inline-flex items-center justify-center bg-[#1a1714] text-[#EDE8E0] font-mono text-[13px] lg:text-[14px] tracking-[0.28em] uppercase px-12 py-[22px] transition-all duration-300 hover:bg-[#2d5016] hover:translate-x-1"
              >
                {t("home.ctaProjects")}
              </Link>
              <button
                type="button"
                onClick={onAbout}
                className="font-mono text-[12px] lg:text-[13px] tracking-[0.25em] text-[#6b6560] uppercase transition-colors duration-300 hover:text-[#1a1714]"
              >
                {t("home.aboutLink")}
              </button>
            </div>
          </FadeUp>
        </div>

        {/* Bottom nav */}
        <FadeUp delay={0.9} className="mt-14 lg:mt-0">
          <div className="h-px w-full bg-[#1a1714]/10 mb-7" />
          <div className="flex flex-wrap items-center justify-between gap-x-7 gap-y-4">
            <nav className="flex flex-wrap items-center gap-x-7 gap-y-3">
              {nav.map((item, i) => (
                <span key={item.label} className="flex items-center gap-7">
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="font-mono text-[12px] lg:text-[13px] tracking-[0.25em] text-[#6b6560] uppercase transition-colors duration-300 hover:text-[#1a1714]"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={onAbout}
                      className="font-mono text-[12px] lg:text-[13px] tracking-[0.25em] text-[#6b6560] uppercase transition-colors duration-300 hover:text-[#1a1714]"
                    >
                      {item.label}
                    </button>
                  )}
                  {i < nav.length - 1 && (
                    <span className="text-[#b0aaa5] select-none text-sm">|</span>
                  )}
                </span>
              ))}
            </nav>

            {/* Language toggle — discreet, same mono type, no box */}
            <div className="flex items-center gap-2 font-mono text-[12px] lg:text-[13px] tracking-[0.25em]">
              <button
                type="button"
                onClick={() => setLanguage("es")}
                className={
                  language === "es"
                    ? "text-[#1a1714]"
                    : "text-[#b0aaa5] transition-colors duration-300 hover:text-[#6b6560]"
                }
              >
                ES
              </button>
              <span className="text-[#b0aaa5] select-none">/</span>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={
                  language === "en"
                    ? "text-[#1a1714]"
                    : "text-[#b0aaa5] transition-colors duration-300 hover:text-[#6b6560]"
                }
              >
                EN
              </button>
            </div>
          </div>
        </FadeUp>
      </div>
    </div>
  );
}
