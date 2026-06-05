"use client";

import { ArrowUpRight, FileText, Github, Linkedin } from "lucide-react";

import { useI18n } from "@/i18n/context";
import { Link } from "@/i18n/navigation";

const MONO = "font-[family-name:var(--font-jetbrains-mono)]";
const NAME = "font-[family-name:var(--font-inter)]";

const EMAIL = "adrilaynezortiz@gmail.com";

const SOCIALS = [
  { key: "github", href: "https://github.com/adrilaynez", Icon: Github },
  { key: "linkedin", href: "https://www.linkedin.com/in/adrian-laynez-ortiz", Icon: Linkedin },
  { key: "cv", href: "/cv.pdf", Icon: FileText },
] as const;

const NAV = [
  { key: "latent", href: "/latent-space", here: false },
  { key: "projects", href: "/projects", here: true },
  { key: "lab", href: "/lab", here: false },
  { key: "about", href: "/?view=about", here: false },
] as const;

/** Page footer for the projects section: "Contact me" with all contact info. */
export function ProjectContactFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-28 border-t border-[color:var(--proj-rule)] pt-14">
      <div className="grid gap-12 md:grid-cols-[1fr_auto] md:items-end">
        {/* Left: heading + email */}
        <div>
          <span className={`${MONO} text-[11px] uppercase tracking-[0.26em] text-[color:var(--proj-dim)]`}>
            {t("projects.contact.eyebrow")}
          </span>
          <h2
            className={`${NAME} mt-4 text-[clamp(36px,5vw,68px)] font-bold leading-[0.95] tracking-[-0.01em] text-[color:var(--proj-fg)]`}
          >
            {t("projects.contact.title")}
          </h2>
          <p className="mt-5 max-w-[46ch] text-[15.5px] font-light leading-[1.66] text-[color:var(--proj-muted)] text-pretty">
            {t("projects.contact.text")}
          </p>
          <Link
            href={`mailto:${EMAIL}`}
            className="group mt-8 inline-flex items-center gap-3 font-serif text-[clamp(22px,2.6vw,34px)] italic leading-none text-[color:var(--proj-fg)] transition-colors hover:text-[color:var(--proj-muted)]"
          >
            {EMAIL}
            <ArrowUpRight className="h-[0.7em] w-[0.7em] flex-none transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Right: social links */}
        <div className="flex flex-wrap gap-3">
          {SOCIALS.map(({ key, href, Icon }) => (
            <Link
              key={key}
              href={href}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-2.5 rounded-full border border-[color:var(--proj-rule)] px-5 py-2.5 ${MONO} text-[11px] uppercase tracking-[0.18em] text-[color:var(--proj-muted)] transition-colors hover:border-[color:var(--proj-fg)] hover:text-[color:var(--proj-fg)]`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t(`projects.contact.${key}`)}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom bar: nav + copyright */}
      <div className="mt-16 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t border-[color:var(--proj-rule-soft)] pt-7">
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {NAV.map((item, i) => (
            <span key={item.key} className="inline-flex items-center gap-6">
              <Link
                href={item.href}
                className={`${MONO} text-[12px] uppercase tracking-[0.22em] transition-colors hover:text-[color:var(--proj-fg)] ${
                  item.here ? "text-[color:var(--proj-fg)]" : "text-[color:var(--proj-muted)]"
                }`}
              >
                {t(`projects.nav.${item.key}`)}
              </Link>
              {i < NAV.length - 1 && <span className="text-[color:var(--proj-ghost)]">/</span>}
            </span>
          ))}
        </nav>
        <span className={`${MONO} text-[11px] tracking-[0.18em] text-[color:var(--proj-dim)]`}>
          © {year} Adrián Laynez
        </span>
      </div>
    </footer>
  );
}
