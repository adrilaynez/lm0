"use client";

import { ArrowLeft } from "lucide-react";

import { useI18n } from "@/i18n/context";
import { Link } from "@/i18n/navigation";

import { ProjectControls } from "../_components/project-controls";
import { ProjectFooterNav } from "../_components/project-footer-nav";
import { StatusBadge } from "../_components/status-badge";
import { getProject, getRelated, type Lang, type Project } from "../projects-data";

const MONO = "font-[family-name:var(--font-jetbrains-mono)]";

function accentStyle(p: Project): React.CSSProperties {
  return {
    "--accent": p.color.a,
    "--accent-deep": p.color.d,
    "--accent-ink": p.color.ink,
  } as React.CSSProperties;
}

function SectionH({ children }: { children: React.ReactNode }) {
  return (
    <h2 className={`mb-5 flex items-center gap-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.22em] text-[color:var(--accent)]`}>
      {children}
      <span className="h-px flex-1 bg-[color:var(--proj-rule)]" />
    </h2>
  );
}

function DetActions({ p }: { p: Project }) {
  const { t } = useI18n();
  const showPrimary = p.status === "live" || p.status === "essay";
  const primaryLabel = p.status === "essay" ? t("projects.read") : t("projects.viewDemo");
  const primaryHref = p.href ?? `/projects/${p.id}`;
  const external = primaryHref.startsWith("http");
  const solid =
    "inline-flex items-center gap-2.5 border border-[color:var(--proj-fg)] bg-[var(--proj-fg)] px-[26px] py-[14px] text-[12px] uppercase tracking-[0.18em] text-[color:var(--proj-bg)] transition-colors hover:border-[color:var(--accent)] hover:bg-[var(--accent)] hover:text-[color:var(--accent-ink)]";
  const line =
    "inline-flex items-center gap-2.5 border border-[color:var(--proj-rule)] px-[26px] py-[14px] text-[12px] uppercase tracking-[0.18em] text-[color:var(--proj-fg)] transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]";

  return (
    <div className="mt-7 flex flex-wrap gap-3.5">
      {showPrimary && (
        <Link href={primaryHref} {...(external ? { target: "_blank", rel: "noreferrer" } : {})} className={solid}>
          {primaryLabel} <span>→</span>
        </Link>
      )}
      {p.repo && (
        <a href={p.repo} target="_blank" rel="noreferrer" className={showPrimary ? line : solid}>
          {"</>"} {t("projects.code")}
        </a>
      )}
    </div>
  );
}

export function ProjectDetail({ id }: { id: string }) {
  const { t, language } = useI18n();
  const lang = language as Lang;
  const p = getProject(id);
  if (!p) return null;

  const related = getRelated(id);
  const d = p.detail;

  return (
    <div data-proj style={accentStyle(p)} className="min-h-screen bg-[var(--proj-bg)] font-sans text-[color:var(--proj-fg)] transition-colors duration-500">
      <div className="mx-auto max-w-[1180px] px-6 pb-32 pt-8 sm:px-14">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/projects"
            className={`inline-flex items-center gap-2 ${MONO} text-[11px] uppercase tracking-[0.2em] text-[color:var(--proj-muted)] transition-colors hover:text-[color:var(--proj-fg)]`}
          >
            <ArrowLeft className="h-3 w-3" />
            {t("projects.backToProjects")}
          </Link>
          <ProjectControls />
        </div>

        {/* Hero */}
        <div className="mt-10 max-w-[820px]">
          <span className={`${MONO} text-[11px] uppercase tracking-[0.24em] text-[color:var(--accent)]`}>
            {t("projects.projectLabel")} · {p.year}
          </span>
          <h1 className="mt-4 font-[family-name:var(--font-inter)] text-[clamp(44px,7vw,104px)] font-bold uppercase leading-[0.92] tracking-[0.01em] text-[color:var(--proj-fg)]">
            {p.name}
          </h1>
          <p className="mt-5 max-w-[640px] font-serif text-[clamp(20px,2.4vw,30px)] font-medium italic leading-[1.35] text-[color:var(--proj-muted)]">
            {d.tagline[lang]}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-5">
            <StatusBadge project={p} lang={lang} />
            <span className={`${MONO} text-[11px] text-[color:var(--proj-dim)]`}>{p.tags[lang].join(" · ")}</span>
          </div>
          <DetActions p={p} />
        </div>

        {/* Body grid */}
        <div className="mt-16 grid grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_300px] lg:gap-16">
          {/* Main */}
          <div className="min-w-0">
            <section className="mb-14">
              <SectionH>{t("projects.summary")}</SectionH>
              <div className="proj-rich space-y-4 text-[17px] font-light leading-[1.7] text-[color:var(--proj-muted)] text-pretty">
                {d.overview[lang].map((para, i) => (
                  <p key={i} dangerouslySetInnerHTML={{ __html: para }} />
                ))}
              </div>
            </section>

            <section className="mb-14">
              <SectionH>{t("projects.features")}</SectionH>
              <ul className="grid grid-cols-1 gap-x-0.5 sm:grid-cols-2">
                {d.features[lang].map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3.5 border-b border-[color:var(--proj-rule-soft)] px-1 py-4 text-[15px] text-[color:var(--proj-fg)]"
                  >
                    <span className={`flex-none ${MONO} text-[color:var(--accent)]`}>→</span>
                    {f}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mb-14">
              <SectionH>{t("projects.howItWorks")}</SectionH>
              <div className="flex flex-col gap-5">
                {d.steps[lang].map((s, i) => (
                  <div key={i} className="grid grid-cols-[44px_1fr] items-start gap-[18px]">
                    <span className={`${MONO} pt-0.5 text-[13px] text-[color:var(--accent)]`}>{String(i + 1).padStart(2, "0")}</span>
                    <span
                      className="proj-rich text-[16px] leading-[1.6] text-[color:var(--proj-muted)]"
                      dangerouslySetInnerHTML={{ __html: s }}
                    />
                  </div>
                ))}
              </div>
            </section>

            {d.code && (
              <section className="mb-14">
                <SectionH>{t("projects.example")}</SectionH>
                <div className="proj-code">
                  <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3">
                    <span className="font-[family-name:var(--font-jetbrains-mono)] text-[11px] tracking-[0.04em] text-white/50">
                      {d.code.fn}
                    </span>
                  </div>
                  <pre
                    dangerouslySetInnerHTML={{
                      __html: [...d.code.lines, "", ...(d.code.out ?? [])].join("\n"),
                    }}
                  />
                </div>
              </section>
            )}
          </div>

          {/* Aside */}
          <aside className="lg:sticky lg:top-8">
            <div className="border border-[color:var(--proj-rule)]">
              <div className="border-b border-[color:var(--proj-rule)] px-[18px] py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--proj-fg)]">
                {t("projects.spec")}
              </div>
              {Object.entries(d.spec[lang]).map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between gap-3.5 border-b border-[color:var(--proj-rule-soft)] px-[18px] py-[13px] last:border-0"
                >
                  <span className={`${MONO} text-[11px] uppercase tracking-[0.08em] text-[color:var(--proj-dim)]`}>{k}</span>
                  <span className="text-right text-[13px] text-[color:var(--proj-fg)]">{v}</span>
                </div>
              ))}
            </div>

            <div className="mt-7">
              <div className={`mb-3 ${MONO} text-[10px] uppercase tracking-[0.2em] text-[color:var(--proj-dim)]`}>
                {t("projects.related")}
              </div>
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/projects/${r.id}`}
                  className="flex items-center justify-between border-t border-[color:var(--proj-rule-soft)] py-3 text-[14px] uppercase tracking-[0.03em] text-[color:var(--proj-muted)] transition-all hover:pl-1.5 hover:text-[color:var(--proj-fg)]"
                >
                  {r.name} <span>→</span>
                </Link>
              ))}
            </div>
          </aside>
        </div>

        <ProjectFooterNav />
      </div>
    </div>
  );
}
