export function MindIntroPanel() {
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-[var(--ls-border)]/60 px-6 py-6 lg:px-7 lg:py-7"
      style={{
        background: "color-mix(in oklch, var(--ls-bg-panel) 55%, transparent)",
      }}
    >
      {/* Orange left accent stripe */}
      <span
        aria-hidden
        className="absolute bottom-6 left-0 top-6 w-[3px] rounded-full bg-[var(--ls-accent)]"
      />
      {/* Decorative dot top-right */}
      <span
        aria-hidden
        className="absolute right-6 top-6 size-1.5 rounded-full bg-[var(--ls-accent)] opacity-70"
      />

      <h3 className="font-[family-name:var(--ls-font-display)] text-[1.35rem] font-semibold leading-tight text-[var(--ls-fg)] sm:text-[1.55rem]">
        This is where I think out loud.
      </h3>
      <p className="mt-2.5 max-w-[52ch] font-mono text-[0.78rem] leading-relaxed text-[var(--ls-fg-muted)]">
        A personal system to explore ideas, connect concepts, and map meaning.
        It&apos;s messy, evolving, and alive.
      </p>
    </div>
  );
}
