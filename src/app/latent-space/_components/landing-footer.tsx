export function LandingFooter() {
  return (
    <footer className="mt-12 flex w-full flex-col items-center gap-3 border-t border-[var(--ls-border)] pt-10">
      <span
        aria-hidden
        className="font-[family-name:var(--ls-font-display)] text-[1.4rem] leading-none text-[var(--ls-accent)]"
      >
        ✦
      </span>
      <p className="font-[family-name:var(--ls-font-display)] text-[0.85rem] italic text-[var(--ls-fg-subtle)]">
        made with curiosity.
      </p>
    </footer>
  );
}
