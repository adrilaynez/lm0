# ARCHIVE — Bigram v8/v10 aesthetic & port notes (HISTORICAL, non-normative)

> **Status: SUPERSEDED — kept for the record, NOT current direction.**
>
> These two sections used to live in the root `CLAUDE.md`. They are preserved here **verbatim** so no
> guidance is lost, but they are **no longer authoritative**. They describe the first (failed) approach of
> porting the hand-iterated v8/v10 vanilla prototypes.
>
> **Current source of the look:** the §1/§2 React components + `src/features/lab/components/bigram/kit/`
> (read `kit/AGENTS.md`). Do **not** chase v10/v8 fidelity. See also the user memory
> `v10-prototype-not-source-of-truth.md`.
>
> Why this is kept: the failure modes documented below ("ship v8 but worse", reusing a v8-frozen primitive,
> validating with `tsc` only) are still useful as a *log of what went wrong*. The mechanism (port verbatim
> against v10) is the part that is obsolete.

---

## Aesthetic reference — the v10 prototype (Bigram)

The hand-iterated **v10 vanilla prototype** is the reference for the Bigram chapter's **look and feel only** —
a picture of how the page should *look*: visual language, materials, density, tokens, typographic feel, and
the calm/premium quality of motion. It is **not** the source of truth for anything else.

**v10 governs (aesthetic only):**

- **Visual + tokens:** `styles-v10.css` (the `:root` token block + the `.bw-<widget>*` rules). The `--bigram-*`
  tokens in `globals.css` map 1:1 to v10's `:root`.
- **Motion feel:** easings, durations, and the overall smoothness/restraint of transitions.

For the *visual* reference, always diff against **v10** — never v8, never the old React component.

**v10 does NOT govern (do not treat it as authority here):**

- **Narrative, structure, and pedagogy** — the order of ideas, the section map, which concepts appear and how
  they're framed. These follow `bigram-narrative-guidelines.md` and may diverge freely from v10.
- **Copy** — all wording follows the narrative direction, not v10's text.
- **Which visualizers exist and what they do** — widgets may be added, cut, merged, or rebuilt to serve the
  narrative; matching v10's widget set is not a goal.

In short: take the *look* from v10; take the *story, copy, and interaction logic* from the narrative
guidelines. When they conflict, v10 wins on looks, the narrative wins on substance.

## Porting a visualizer — faithful port, NOT reinterpretation

These rules are the antidote to the first failed pass (which shipped "v8 but worse"). Violating any one is the
known failure mode:

1. **Port, don't re-derive.** Copy v10 verbatim: exact data (CORPUS string, default text, option counts),
   exact timings (`DELAY`, cascade `delay` formulas, durations/easings), exact class structure + states.
   No "improvements", no re-typesetting from memory. Changing the CORPUS or the initial demo state is a tell
   that no diff against v10 was done.
2. **Audit the primitive before reusing it.** `HonestBar` mirrors v8 `.barrow` (src→dst pair, glint, 12px
   track, % on a fixed honest axis). It is the **wrong** primitive for HeroAutoComplete v10 (dst-only rows,
   no glint) and for CorpusCountingIdea (integer counts, max-normalized, per-step `pop`). Build the v10 row
   inline, or extend the primitive to v10 — never reuse a v8-frozen primitive and call it done. Primitive
   changes stay additive (don't regress other chapters/widgets).
3. **Browser-validate against v10.** `tsc` + lint are necessary but **not sufficient**. Render the widget at
   `/lab/bigram` in both themes (and reduced-motion) and diff behaviour + layout + copy against the v10
   prototype before declaring done. The first pass validated statically only — that is why every gap survived.
4. **Sync i18n.** New v10 copy (instinct framing, headline tiers, verdict, "Contar el resto", …) needs new
   keys in `en.ts`/`es.ts`. "Don't touch i18n" silently freezes obsolete copy.
5. **Spend effort on the definitive mechanism, not the abandoned one.** If v10 deleted something (the sliding
   lens), do not lovingly rebuild it. Effort on a deleted mechanism is worse than no effort.
