import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface MindBreadcrumbProps {
  primaryTag?: string;
  title: string;
  className?: string;
}

export function MindBreadcrumb({
  primaryTag,
  title,
  className,
}: MindBreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex flex-wrap items-center gap-2 font-[family-name:var(--ls-font-ui)] text-[0.85rem] text-[var(--ls-fg-subtle)]",
        className,
      )}
    >
      <Link
        href="/latent-space?mode=mind"
        className="transition-colors hover:text-[var(--ls-fg)]"
      >
        Mind
      </Link>
      <span aria-hidden>/</span>
      {primaryTag && (
        <>
          <Link
            href={`/latent-space?mode=mind&category=${primaryTag}`}
            className="capitalize transition-colors hover:text-[var(--ls-fg)]"
          >
            {primaryTag}
          </Link>
          <span aria-hidden>/</span>
        </>
      )}
      <span className="truncate text-[var(--ls-accent)]">{title}</span>
    </nav>
  );
}
