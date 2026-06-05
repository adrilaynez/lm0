"use client";

import { FadeInView } from "@/features/lab/components/FadeInView";
import { useI18n } from "@/i18n/context";
import { Link } from "@/i18n/navigation";

import { ProjectContactFooter } from "./_components/project-contact-footer";
import { ProjectMasthead } from "./_components/project-masthead";
import { ProjectMock } from "./_components/project-mock";
import { StatusBadge } from "./_components/status-badge";
import { FEATURED, type Lang, type Project,REST } from "./projects-data";

const MONO = "font-[family-name:var(--font-jetbrains-mono)]";
const NAME = "font-[family-name:var(--font-inter)]";

function accentStyle(p: Project): React.CSSProperties {
  return {
    "--accent": p.color.a,
    "--accent-deep": p.color.d,
    "--accent-ink": p.color.ink,
  } as React.CSSProperties;
}

function KindChip({ p, lang }: { p: Project; lang: Lang }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${MONO} text-[11px] uppercase tracking-[0.2em] text-[color:var(--proj-muted)]`}>
      <i className="h-[7px] w-[7px] flex-none rounded-full bg-[var(--accent)]" />
      {p.kind[lang]}
    </span>
  );
}

function Facts({ items }: { items: string[] }) {
  return (
    <div className={`flex flex-wrap items-center gap-y-2 ${MONO} text-[12px] tracking-[0.02em] text-[color:var(--proj-dim)]`}>
      {items.map((f, i) => (
        <span key={i} className="inline-flex items-center">
          {i > 0 && <span className="mx-2.5 text-[color:var(--proj-ghost)]">·</span>}
          {f}
        </span>
      ))}
    </div>
  );
}

function Included({ p, lang, single = false }: { p: Project; lang: Lang; single?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="border-t border-[color:var(--proj-rule)] pt-5">
      <span className={`mb-3.5 block ${MONO} text-[11px] uppercase tracking-[0.22em] text-[color:var(--proj-dim)]`}>
        {t("projects.included")}
      </span>
      <ul className={`grid gap-x-7 gap-y-3 ${single ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
        {p.detail.features[lang].map((f, i) => (
          <li key={i} className="flex items-center gap-2.5 text-[14.5px] text-[color-mix(in_srgb,var(--proj-fg)_38%,var(--proj-muted))]">
            <span className="h-1.5 w-1.5 flex-none rotate-45 bg-[var(--accent)]" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Ctas({ p }: { p: Project }) {
  const { t } = useI18n();
  const detail = `/projects/${p.id}`;
  const external = p.href?.startsWith("http") ?? false;
  const base =
    "group/btn inline-flex items-center gap-2.5 rounded-[11px] px-7 py-[15px] text-[13px] font-semibold tracking-[0.02em] transition-all duration-200 hover:-translate-y-0.5";
  const primaryCls = `${base} bg-[var(--accent)] text-[color:var(--accent-ink)] shadow-[0_8px_22px_-10px_var(--accent)] hover:bg-[var(--accent-deep)] hover:shadow-[0_12px_28px_-10px_var(--accent)]`;
  const ghostCls = `${base} border border-[color:var(--proj-rule)] text-[color:var(--proj-fg)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link href={detail} className={primaryCls}>
        {t("projects.viewDetails")}
        <span className="transition-transform duration-200 group-hover/btn:translate-x-1">→</span>
      </Link>
      {p.href && (
        <Link href={p.href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})} className={ghostCls}>
          {t("projects.viewPage")}
          <span aria-hidden className="transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5">
            ↗
          </span>
        </Link>
      )}
    </div>
  );
}

function Thumb({ p, className = "" }: { p: Project; className?: string }) {
  const dark = p.id === "sova";
  return (
    <div
      className={`relative overflow-hidden border border-[color:var(--proj-rule)] ${
        dark ? "bg-[#0b0f17]" : "bg-[var(--proj-panel)]"
      } ${className}`}
    >
      <span className="absolute inset-x-0 top-0 z-[2] h-[3px] bg-[var(--accent)]" />
      <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.03]">
        <ProjectMock project={p} />
      </div>
      <span className="absolute inset-0 bg-gradient-to-b from-transparent to-black/25" />
    </div>
  );
}

function Hero({ p, index, lang }: { p: Project; index: number; lang: Lang }) {
  const flip = index % 2 === 1;
  const detail = `/projects/${p.id}`;
  return (
    <FadeInView
      as="div"
      style={accentStyle(p)}
      className="group relative grid cursor-pointer grid-cols-1 items-center gap-10 md:grid-cols-[0.92fr_1.08fr] md:gap-[60px]"
    >
      <Thumb p={p} className={`aspect-[4/3] ${flip ? "md:order-2" : ""}`} />
      <div className="min-w-0">
        <div className="mb-4 flex items-center gap-4">
          <span className={`${MONO} text-[13px] text-[color:var(--accent)]`}>{String(index + 1).padStart(2, "0")}</span>
          <KindChip p={p} lang={lang} />
          <StatusBadge project={p} lang={lang} />
        </div>
        <Link href={detail} className="block before:absolute before:inset-0 before:z-0 before:content-['']">
          <h2 className={`${NAME} text-[clamp(34px,4.2vw,60px)] font-bold leading-[0.98] tracking-[-0.005em] text-[color:var(--proj-fg)] transition-colors group-hover:text-[color:var(--accent)]`}>
            {p.name}
          </h2>
        </Link>
        <p className="mt-4 max-w-[36ch] font-serif text-[clamp(18px,1.8vw,23px)] italic leading-[1.35] text-[color:var(--proj-muted)] text-pretty">
          {p.lead[lang]}
        </p>
        <p className="mb-5 mt-4 max-w-[50ch] text-[16px] font-light leading-[1.66] text-[color:var(--proj-muted)] text-pretty">
          {p.long[lang]}
        </p>
        <Included p={p} lang={lang} single={p.id === "sova"} />
        <div className="relative z-10 mt-[22px] flex flex-wrap items-center gap-6 border-t border-[color:var(--proj-rule)] pt-[22px]">
          <Ctas p={p} />
        </div>
      </div>
    </FadeInView>
  );
}

function GridCard({ p, num, lang }: { p: Project; num: number; lang: Lang }) {
  const detail = `/projects/${p.id}`;
  return (
    <FadeInView as="div" style={accentStyle(p)} className="group relative flex cursor-pointer flex-col">
      <div className="mb-5">
        <div className="mb-3 flex items-center gap-4">
          <span className={`${MONO} text-[12px] text-[color:var(--accent)]`}>{String(num).padStart(2, "0")}</span>
          <KindChip p={p} lang={lang} />
        </div>
        <Link href={detail} className="before:absolute before:inset-0 before:z-0 before:content-['']">
          <h3 className={`${NAME} text-[clamp(28px,3vw,40px)] font-bold uppercase leading-none tracking-[0.02em] text-[color:var(--proj-fg)] transition-colors group-hover:text-[color:var(--accent)]`}>
            {p.name}
          </h3>
        </Link>
      </div>
      <Thumb p={p} className="aspect-[16/9] max-h-[240px]" />
      <div className="mt-5 flex flex-1 flex-col gap-4">
        <p className="max-w-[48ch] text-[15.5px] font-light leading-[1.62] text-[color:var(--proj-muted)] text-pretty">
          {p.desc[lang]}
        </p>
        <Facts items={p.detail.facts[lang]} />
        <div className="mt-auto flex flex-wrap items-center gap-4 border-t border-[color:var(--proj-rule)] pt-[18px]">
          <StatusBadge project={p} lang={lang} />
          <span className={`${MONO} text-[11px] text-[color:var(--proj-dim)]`}>{p.tags[lang].join(" · ")}</span>
          <span className={`ml-auto ${MONO} text-[12px] text-[color:var(--proj-dim)]`}>{p.year}</span>
        </div>
      </div>
    </FadeInView>
  );
}

export function ProjectsContent() {
  const { t, language } = useI18n();
  const lang = language as Lang;

  return (
    <div data-proj className="min-h-screen bg-[var(--proj-bg)] font-sans text-[color:var(--proj-fg)] transition-colors duration-500">
      <div className="mx-auto max-w-[1180px] px-6 pb-32 pt-8 sm:px-14">
        <ProjectMasthead />

        {/* Featured */}
        <div className="mt-16 flex flex-col gap-[120px]">
          {FEATURED.map((p, i) => (
            <Hero key={p.id} p={p} index={i} lang={lang} />
          ))}
        </div>

        {/* Divider */}
        <div className="my-[88px] flex items-center gap-5">
          <span className={`${MONO} text-[11px] uppercase tracking-[0.26em] text-[color:var(--proj-muted)]`}>
            {t("projects.moreWork")}
          </span>
          <span className="h-px flex-1 bg-[color:var(--proj-rule)]" />
          <span className={`${MONO} text-[12px] text-[color:var(--proj-fg)]`}>{String(REST.length).padStart(2, "0")}</span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-x-14 gap-y-[72px] md:grid-cols-2">
          {REST.map((p, i) => (
            <GridCard key={p.id} p={p} num={FEATURED.length + i + 1} lang={lang} />
          ))}
        </div>

        <ProjectContactFooter />
      </div>
    </div>
  );
}
