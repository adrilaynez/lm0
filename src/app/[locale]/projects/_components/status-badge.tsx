import type { Lang, Project } from "../projects-data";

/** Status pill: dot + localized label. "live" uses the project accent + ping. */
export function StatusBadge({ project, lang }: { project: Project; lang: Lang }) {
  const isLive = project.status === "live";
  return (
    <span
      className={`inline-flex items-center gap-2 font-[family-name:var(--font-jetbrains-mono)] text-[10.5px] uppercase tracking-[0.18em] ${
        isLive ? "text-[color:var(--accent)]" : "text-[color:var(--proj-muted)]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-[var(--accent)] proj-dot-live" : "bg-current"}`}
      />
      {project.statusLabel[lang]}
    </span>
  );
}
