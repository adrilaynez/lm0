"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { useI18n } from "@/i18n/context";

import { ProjectControls } from "./project-controls";

/** Editorial masthead: logo + back-home (left) + controls (right), then the big "PROYECTOS" title. */
export function ProjectMasthead() {
  const { t } = useI18n();

  return (
    <header>
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 font-[family-name:var(--font-jetbrains-mono)] text-[15px] uppercase tracking-[0.2em] text-[color:var(--proj-muted)] transition-colors hover:text-[color:var(--proj-fg)]"
        >
          <ArrowLeft className="h-[18px] w-[18px] transition-transform group-hover:-translate-x-0.5" />
          {t("projects.backHome")}
        </Link>
        <ProjectControls />
      </div>

      <div className="mt-16">
        <p className="font-[family-name:var(--font-jetbrains-mono)] text-[12px] uppercase tracking-[0.34em] text-[color:var(--proj-muted)]">
          {t("projects.eyebrow")}
        </p>
        <h1 className="mt-5 font-serif font-extrabold uppercase leading-[0.9] tracking-[-0.01em] text-[color:var(--proj-fg)] text-[clamp(64px,12vw,168px)]">
          {t("projects.title")}
        </h1>
        <div className="mt-8 h-[3px] w-[72px] bg-[var(--proj-fg)]" />
        <p className="mt-7 max-w-[520px] text-[clamp(16px,1.7vw,20px)] font-light leading-[1.6] text-[color:var(--proj-muted)] text-pretty">
          {t("projects.subtitle")}
        </p>
      </div>
    </header>
  );
}
