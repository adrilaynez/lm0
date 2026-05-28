import { cn } from "@/lib/utils"

interface CalloutProps {
  icon?: string
  title?: string
  children?: React.ReactNode
  type?: "default" | "info" | "warning" | "success" | "danger"
}

const TYPE_STYLES: Record<NonNullable<CalloutProps["type"]>, string> = {
  default: "border-l-[var(--ls-accent)] bg-[var(--ls-accent-soft)]",
  info:    "border-l-[var(--ls-accent)] bg-[var(--ls-accent-soft)]",
  warning: "border-l-amber-400 bg-amber-50/60",
  success: "border-l-emerald-500 bg-emerald-50/60",
  danger:  "border-l-red-400 bg-red-50/60",
}

export function Callout({ title, children, type = "default" }: CalloutProps) {
  return (
    <div
      className={cn(
        "my-7 border-l-2 pl-5 pr-4 py-4 rounded-r-lg text-[0.95rem]",
        TYPE_STYLES[type],
      )}
    >
      {title && (
        <p className="mb-1.5 font-semibold text-[var(--ls-fg)] text-[0.9rem]">{title}</p>
      )}
      <div className="leading-relaxed text-[var(--ls-fg-muted)]">{children}</div>
    </div>
  )
}
