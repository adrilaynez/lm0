"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, FileText, Github, Linkedin, Mail } from "lucide-react";

import { useI18n } from "@/i18n/context";
import { FadeUp } from "./fade-up";

const SOCIALS = [
  { label: "GitHub", href: "https://github.com/adrilaynez", Icon: Github },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/adrian-laynez-ortiz", Icon: Linkedin },
  { label: "Email", href: "mailto:adrilaynezortiz@gmail.com", Icon: Mail },
  { label: "CV", href: "/cv.pdf", Icon: FileText },
];

export function AboutFace({
  onClose,
  active,
}: {
  onClose: () => void;
  active: boolean;
}) {
  const { t } = useI18n();

  return (
    <div className="h-full min-h-[100dvh] lg:min-h-0 grid grid-cols-1 lg:grid-cols-[3fr_2fr]">
      {/* Left: Content */}
      <div className="relative flex flex-col bg-[#EDE8E0] px-10 py-12 lg:px-24 lg:py-16 min-h-[55dvh] lg:h-full order-2 lg:order-1">
        {/* Back control */}
        <button
          type="button"
          onClick={onClose}
          className="group inline-flex items-center gap-3 font-mono text-[12px] lg:text-[13px] tracking-[0.25em] text-[#6b6560] uppercase transition-colors duration-300 hover:text-[#1a1714]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
          {t("home.about.back")}
        </button>

        <div className="flex-1 flex flex-col justify-center lg:justify-start lg:pt-[5vh] max-w-[44rem]">
          <FadeUp active={active} delay={0.2}>
            <h1
              className="font-serif font-bold text-[#1a1714] leading-[0.92] tracking-[-0.02em]"
              style={{ fontSize: "clamp(2.75rem, 5.8vw, 6.25rem)" }}
            >
              ABOUT ME
            </h1>
          </FadeUp>

          <FadeUp active={active} delay={0.35}>
            <div className="mt-7 h-[2px] w-14 bg-[#2d5016]" />
          </FadeUp>

          <FadeUp active={active} delay={0.45}>
            <div className="mt-8 max-w-[34rem] space-y-5 text-[16px] leading-[1.75] text-[#3a3430] font-light lg:text-[18px] [&_strong]:font-normal [&_strong]:text-[#1a1714] [&_em]:not-italic [&_em]:text-[#1a1714]">
              <p dangerouslySetInnerHTML={{ __html: t("home.about.p1") }} />
              <p dangerouslySetInnerHTML={{ __html: t("home.about.p2") }} />
              <p className="border-l-2 border-[#2d5016] pl-4 italic text-[#6b6560]">
                {t("home.about.mission")}
              </p>
            </div>
          </FadeUp>

          <FadeUp active={active} delay={0.55}>
            <div className="mt-9 flex flex-wrap gap-3">
              {SOCIALS.map(({ label, href, Icon }) => (
                <Link
                  key={label}
                  href={href}
                  target={href.startsWith("mailto:") ? undefined : "_blank"}
                  className="inline-flex items-center gap-2 rounded-full border border-[#1a1714]/15 px-4 py-2 font-mono text-[11px] tracking-[0.18em] uppercase text-[#3a3430] transition-colors duration-300 hover:border-[#2d5016] hover:text-[#2d5016]"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              ))}
            </div>
          </FadeUp>
        </div>
      </div>

      {/* Right: Photo */}
      <div className="relative h-[45vh] lg:h-full order-1 lg:order-2">
        <Image
          src="/Adrian.png"
          alt="Adrián Laynez"
          fill
          sizes="(max-width: 1024px) 100vw, 40vw"
          className="object-cover grayscale-[20%]"
          style={{ objectPosition: "center 40%" }}
        />
        {/* Mobile: fade photo bottom into cream panel */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#EDE8E0] to-transparent lg:hidden" />
      </div>
    </div>
  );
}
