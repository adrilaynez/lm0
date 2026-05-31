# CLAUDE.md — Project Direction

Permanent direction for this project. Every contributor and agent follows it. It does not change per task.

---

## North star

**Build the best app in the world to learn about AI.**

That sentence is the quality bar. When a choice is "good enough" vs. "the best in the world," choose the
latter. Pedagogy first: every screen should make one idea click. If something does not serve learning or
does not meet a flagship bar of craft, it does not ship.

---

## Design philosophy

- **Simple in appearance, sophisticated underneath.** The surface is calm and obvious; the depth is in the execution.
- **Apple-clean.** Restraint, generous space, materials and micro-detail over ornament.
- **Editorial premium.** Reads like a beautifully typeset article, not a tool dashboard.
- **Confident minimalism.** Remove until only the essential remains; what stays is intentional.
- **Typography-first.** Hierarchy comes from type and spacing before color or boxes.
- **One focal point at a time.** Never make the eye choose between competing elements.
- **Motion that explains, not decorates.** Animation clarifies an idea or a transition; it is never filler.
  The motion budget is generous (spring, smooth transitions, even canvas) when it elevates understanding —
  the limit is visual cleanliness, not animation count.

---

## Per-chapter visual identity

Each chapter **owns one accent**. Never mix accents across chapters.

| Chapter | Accent |
|---|---|
| Bigram | **editorial-green** (`--bigram-*`, emerald dark / forest light; sage for insight) |
| Transformers | **cyan** (`--lab-*`) |
| N-gram | its own accent (do not recolor) |
| MLP | its own accent (do not recolor) |
| Neural Networks | its own accent (do not recolor) |

**Scoping is mandatory so no chapter regresses another:**

- Color changes are **additive and scoped** — under a chapter scope (e.g. `[data-bigram-theme]`) or behind an
  opt-in prop (e.g. `accent="bigram"`). Never overwrite an existing accent's value.
- Shared components (`narrative-primitives`, `LabSectionHeader`, `SectionDivider`, `KeyTakeaway`,
  `GenerationPlayground`, `TransitionMatrix`, …) must keep their original accents everywhere outside the
  chapter that opted in.
- The shared `LabShell` chrome (`--lab-*`) is not retheme-able by a chapter.
- The canonical Bigram tokens, primitives, and i18n keys live in `bigram-design-spec.md`.

---

## Visualizer quality protocol (mandatory bar)

Any new or redesigned visualizer must clear this bar. **Flagship: simple in appearance, sophisticated underneath.**

- **Execution** — strictly step by step; focus only on the current task; decompose the complex; re-read the
  task before implementing; correctness + clarity + design quality over speed; never shallow fixes.
- **Design objective** — React + TypeScript + Framer Motion that feels visually simple, conceptually
  crystal-clear, premium, smooth, elegant, with obsessive attention to detail. References: Apple product films,
  editorial premium, luxury educational tools, confident minimalism, perfectly paced motion.
- **Primary goal** — the visualizer teaches **ONE** concept extremely well; understood almost instantly from
  the visual and the interaction.
- **Philosophy** — simplicity in appearance, depth in execution; strong visual hierarchy; typography-first;
  minimal chrome; smooth transitions; premium motion; dark-mode elegance; calm, confident layout;
  one focal point at a time.
- **Engineering** — Framer Motion only where it adds value; responsive; no horizontal scroll; legible
  typography; production-ready, clear and maintainable component structure.
- **Avoid** — neon overload, noisy interfaces, dashboard-style layouts, too many borders/cards, default charts,
  excessive labels, hacky interactions, generic patterns, ideas that compete with each other.
- **Interaction** — prefer direct manipulation; hover/tap reveals meaning; motion that EXPLAINS ideas (not
  decoration); highlights/glows/panels/connectors stay subtle, intentional, secondary to the concept; use the
  project's color and language system (editorial-green for Bigram).
- **Output expected from each visualizer agent** — (1) design direction (5–10 bullets), (2) interaction model
  (3–6 bullets), (3) implementation, (4) an ambitious solution, (5) ~300+ lines of considered code,
  (6) no superficial patches.

---

## Anti-noise rules

- No neon. No dashboard layouts. No excess borders, cards, or chrome.
- No default chart components; build the exact visual the idea needs.
- No traffic-light "window dot" decorations on figures.
- Use the **project token system** — never hardcode colors. Bigram → `--bigram-*` / `bg-bigram-*` utilities;
  shared lab chrome → `--lab-*`. Radii and fonts come from tokens too.
- States are shown by **fill and typography**, not by piling on borders.
- When in doubt, remove. Confident minimalism beats more elements every time.
