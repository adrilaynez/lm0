# CLAUDE.md — Project Direction

Permanent direction for this project. Every contributor and agent follows it. It does not change per task.

---

## Document map & authority hierarchy

This project's direction is split across a few focused files. **Each topic has exactly one owner**; the others
link to it instead of repeating it. Start here, then go to the owner for your task.

| Document | Owns (authoritative on) |
|---|---|
| `CLAUDE.md` (this file) | Product north star, design philosophy, per-chapter identity, the quality bar, anti-noise. |
| `narrative-guidelines.md` | Chapter-agnostic narrative & pedagogy: the 18 pillars, voice, failure patterns, critique protocol. |
| `method-failure-book.md` | **Why a chapter ships "looks good" but fails to teach** + the enforceable gates (fresh-eyes, judge panel, rebuild loop, scale). Read before redesigning any chapter. |
| `bigram-narrative-guidelines.md` | Bigram entry point: pointers into the generic guidelines + Bigram-specific authorities. |
| `bigram-design-spec.md` | Bigram **visual tokens**: the `--bigram-*` catalog, typography, shared primitives. |
| `docs/bigram-motion-bible.md` | Bigram **motion**: easings, durations, scan/count/heat idioms, reduced-motion contract. |
| `src/features/lab/components/bigram/kit/AGENTS.md` | Bigram **build process**: the build contract + hard gates. **Read first before building a Bigram widget.** |
| `src/features/lab/data/bigramSpine.ts` | Bigram **beat structure**: what each beat teaches, assumes, and hands off. |
| `bigram-changelog.md` | Living log of Bigram decisions and **what did NOT work** — read before repeating mistakes in n-gram/MLP. |
| `docs/archive/` | Historical, **non-normative** notes (superseded approaches, kept for the record). |
| `bigram-redesign/` | Historical per-widget redesign reports (**non-normative**). |

**Precedence when two docs disagree:** `CLAUDE.md` (principles) > the topic owner above (e.g. `bigram-design-spec.md`
for tokens, `bigram-motion-bible.md` for motion, `narrative-guidelines.md` for story, `kit/AGENTS.md` for build).
Anything under `docs/archive/` or `bigram-redesign/` is **never** authoritative.

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
- The canonical Bigram tokens, primitives, and i18n keys live in `bigram-design-spec.md`. The **look & feel**
  is set by the current §1/§2 React components + `src/features/lab/components/bigram/kit/` (read `kit/AGENTS.md`).
  Narrative, structure, and copy follow `bigram-narrative-guidelines.md`. (The old v8/v10 prototypes are
  historical — see `docs/archive/bigram-v8-v10-aesthetic-and-port-notes.md`; do not chase v10/v8 fidelity.)

---

## Visualizer quality protocol (mandatory bar)

> **Canonical copy.** This protocol is mirrored in `bigram-design-spec.md §7` and operationalized as hard
> gates in `kit/AGENTS.md`. If they ever diverge, **this section wins**.

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
- **Motion budget is NOT limited** — spring, smooth transitions, even canvas are welcome where they elevate
  the idea. The limit is **visual cleanliness**, not animation count.
- **Output expected from each visualizer agent** — (1) design direction (5–10 bullets), (2) interaction model
  (3–6 bullets), (3) implementation, (4) an ambitious solution, (5) ~300+ lines of considered code,
  (6) no superficial patches.

**Two hard additions (learned from n-gram v1 — see `method-failure-book.md`):**

- **Show SCALE, never just a number.** Any large quantity ("729", "14M", "billions") ships with a *visual of
  magnitude that changes with the number*: a table/heatmap that visibly GROWS, or a zoom/lens that says "you
  are seeing 0.000…% of something this big". A figure whose picture is identical for 729 and 14,000,000 is a
  fail. A big climbing number alone reads as "looks small" to a stranger (proven, every scale widget in v1).
- **You cannot grade your own legibility.** The builder knows the answer, so "clear in 5s" self-passes every
  time. "Done" requires an *independent* sign-off: a fresh agent that never saw the narrative judges the
  screenshot blind, plus a 3-lens judge panel (child / aesthetics / teacher). Operationalized in `kit/AGENTS.md`.

---

## Bigram build method — the kit (mandatory)

For the **Bigram** chapter, every visualizer is **assembled from `src/features/lab/components/bigram/kit/`**,
never coded from scratch. Before building or reworking a Bigram widget you MUST read
**`src/features/lab/components/bigram/kit/AGENTS.md`** and follow its build contract. The kit (`MarkedText`,
`ParchmentReader`, `FixedAlphabetRow`, `heat`, `Readout`, `CountUpNumber`, `Tabs`, `PlayButton`/`GhostButton`,
`CaptionLine` + `HonestBar`/`PairChip`/`Verdict`) is extracted from the §1/§2 widgets the user approved as
"the level", so a widget made of it cannot drift off-style. A widget = `kit primitives + its one unique mechanic`.

- **See it before you ship it.** Validate at `/lab/bench?w=<slug>&theme=light|dark` — it renders ONE widget
  isolated (no lazy-load, no backend, no LabShell banner). `tsc` green is not "done"; the bench checklist is.
- **No widget built blind or out of context.** Each is built from its `bigram-spine` beat WITH the preceding
  narrative in hand (what the reader already knows), so it teaches exactly its one new idea and is never
  "pegado sin contexto" — the failure mode this method exists to kill.

> **Superseded note:** the v8/v10 "aesthetic reference" and "faithful port" guidance is **obsolete for
> Bigram**. Do NOT chase v10/v8 fidelity; the current §1/§2 components + the kit are the source of the look.
> Those notes are preserved verbatim (for the record) in
> `docs/archive/bigram-v8-v10-aesthetic-and-port-notes.md`. (User memory: `v10-prototype-not-source-of-truth.md`.)

---

## Historical: v8/v10 aesthetic & port notes (moved)

The "Aesthetic reference — v10 prototype" and "Porting a visualizer — faithful port" sections that used to
live here are **superseded** and have been moved **verbatim** to
`docs/archive/bigram-v8-v10-aesthetic-and-port-notes.md` (kept for the record, non-normative). The current
source of the look is the §1/§2 React components + the kit — see "Bigram build method" above.

## Parallelization protocol (multi-agent visualizer work)

> The "v10 target spec" wording below is historical, from the first port. For current Bigram work the
> per-widget "target" is the **spine beat** (`bigramSpine.ts`) + the **kit**; the workflow itself
> (pre-pass → disjoint per-widget agents → browser-validation gate) still stands.

The first workflow failed because agents received prose + v8 and never validated. A correct parallel run:

1. **Pre-pass (one agent, sequential — shared files only):** confirm tokens (`--bigram-*` ↔ v10 `:root`),
   add the i18n keys, and write a per-widget **gap dossier** (v10 target spec + file paths + reuse-or-inline
   decision). Touch `globals.css` / `i18n` / shared primitives **only here**.
2. **Per-widget agents (parallel, disjoint files — one `.tsx` each):** each gets the FULL v10 source for its
   widget (`mount<X>` + `.bw-<x>` CSS), the target `.tsx`, its gap dossier, and the faithful-port mandate.
3. **Browser-validation gate (per widget):** render and diff against v10 — layout, states, motion, copy, both
   themes, reduced-motion. Not merged until it matches.
4. **Disjoint-file rule:** widget agents never edit shared files in parallel (that is the collision the
   pre-pass exists to prevent).
5. **No silent scope cuts:** if a widget cannot match v10 without changing a shared primitive, the agent
   *reports it* — it does not quietly substitute a different primitive or drop a feature.

---

## Section chrome & hero layout — the chapter shell (MUST, every chapter, every section rework)

The chapter shell is fixed and identical across chapters; only the accent token changes. A section is not
"done" until it matches this. **This is a hard requirement in every section rework.**

- **Left side-rail, never a moving top bar.** Section navigation is the fixed left rail
  (`ChapterSideRail`, `accent="<chapter>"`) — a vertical dot timeline whose accent line fills as you scroll.
  It lives at the article root, so it is present on **every** section. Do **not** use a scrolling/displacing
  top progress bar in a chapter narrative. (Bigram set the standard; ngram now matches. `SectionProgressBar`
  is legacy — migrate chapters off it.)
- **Hero is LEFT-aligned and clean, aligned with the body.** The hero column reads like the prose beneath it:
  eyebrow (mono, with a short accent rule) → big display `<h1>` (last word accented in italic) → serif
  subtitle (left, `max-w`, never `mx-auto`/centered) → `ModeToggle` (left). No centered text, no bouncing
  scroll-down arrow, no competing chrome. Match `BigramNarrative`'s hero structure exactly; only the accent differs.
- **Tokens only, scoped.** Rail and hero resolve `--<chapter>-*` tokens inside the chapter's
  `[data-<chapter>-theme]` scope — additive, never overwriting another chapter's accent.

---

## Anti-noise rules

- No neon. No dashboard layouts. No excess borders, cards, or chrome.
- No default chart components; build the exact visual the idea needs.
- No traffic-light "window dot" decorations on figures.
- Use the **project token system** — never hardcode colors. Bigram → `--bigram-*` / `bg-bigram-*` utilities;
  shared lab chrome → `--lab-*`. Radii and fonts come from tokens too.
- States are shown by **fill and typography**, not by piling on borders.
- When in doubt, remove. Confident minimalism beats more elements every time.
