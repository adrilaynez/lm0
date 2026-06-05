"use client";

import { useI18n } from "@/i18n/context";
import { Link } from "@/i18n/navigation";

/** Footer pipe-nav (My Latent Space / Proyectos / LM Lab / About). */
export function ProjectFooterNav() {
  const { t } = useI18n();

  const items = [
    { label: t("projects.nav.latent"), href: "/latent-space", here: false },
    { label: t("projects.nav.projects"), href: "/projects", here: true },
    { label: t("projects.nav.lab"), href: "/lab", here: false },
    { label: t("projects.nav.about"), href: "/?view=about", here: false },
  ];

  return (
    <nav className="mt-24 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[color:var(--proj-rule)] pt-7">
      {items.map((item, i) => (
        <span key={item.href} className="inline-flex items-center gap-6">
          <Link
            href={item.href}
            className={`font-[family-name:var(--font-jetbrains-mono)] text-[12px] uppercase tracking-[0.22em] transition-colors hover:text-[color:var(--accent,var(--proj-fg))] ${
              item.here ? "text-[color:var(--proj-fg)]" : "text-[color:var(--proj-muted)]"
            }`}
          >
            {item.label}
          </Link>
          {i < items.length - 1 && <span className="text-[color:var(--proj-ghost)]">/</span>}
        </span>
      ))}
    </nav>
  );
}
