# ngram/kit — how to build an N-gram visualizer (read this first)

You are about to build or rework a visualizer for the **N-gram** chapter. This file tells you exactly how,
centered on **where models keep failing here** and **what to check before you call it done**. It is the
amber sibling of `src/features/lab/components/bigram/kit/AGENTS.md` — same method, amber accent.

The chapter accent is **amber/yellow**, scoped under `[data-ngram-theme]` (works light + dark), mirroring
bigram role-for-role. Authorities: `docs/bigram-motion-bible.md` (motion — shared, token-agnostic),
`narrative-guidelines.md` (voice/pedagogy — shared), tokens in `globals.css` (`--ngram-*`, an additive
mirror of `--bigram-*`), the chapter spine `src/features/lab/data/ngramSpine.ts`, the blueprint
`ngram-mapa-narrativa.md`, and the living log `ngram-changelog.md`. The bigram §1/§2 widgets + the bigram
kit ARE the aesthetic baseline; this kit is a fork of it.

---

## THE ONE RULE

**Assemble from the kit. Do not re-code the look.** A widget is `kit primitives + its one unique mechanic`.
If you find yourself writing letter-marking, a 27-slot row, a count-up, a heat ramp, a pill tab bar, a play
button, a parchment reader, a sliding context window, or an explosion grid from scratch — stop, you are
about to reinvent a kit piece and it will come out mediocre and inconsistent. Import it instead.

```ts
import {
  MONO, SERIF, STD, heat, displayChar,        // tokens.ts (resolve under [data-ngram-theme])
  MarkedText, CaptionLine, Tabs,
  PlayButton, GhostButton, CountUpNumber, Readout,
  FixedAlphabetRow, ParchmentReader,
  ContextWindow, ExplosionGrid,               // NEW ngram primitives
} from "@/features/lab/components/ngram/kit";
// also available from "@/features/lab/components/ngram": HonestBar, PairChip, Verdict
```

---

## THE BUILD CONTRACT (do these in order, skip nothing)

1. **Context first — kills the #1 failure ("widget pegado sin contexto").** Before any code, read the
   `ngramSpine` entry for the PRECEDING beats + this beat + the next (`contextPacket(beatId)`), and restate
   in 2 lines: *what the reader knows entering · the one new idea · the question this answers · what it hands
   to the next beat.* The widget must teach **exactly** its `newIdea`, assume **only** its `priorKnowledge`,
   and end where the next beat begins.
2. **Final image in words.** Describe the end-state before the mechanics. If you can't picture it, not ready.
3. **Assemble from the kit.** Use the primitives. If a needed piece genuinely isn't in the kit, **report it**
   (add it to the kit as a new blessed primitive) — never silently re-implement or substitute.
4. **Real data only.** Counts/probabilities come from `src/features/lab/data/ngramData.ts` (local, real,
   counted over `SHAKESPEARE_TEXT`). Never fake a number — the user spots it instantly. (The n=2 case is
   validated against `bigramShakespeare27.MATRIX_27_COUNTS`.)
5. **Self-validate in the bench.** Render at `/lab/bench?w=<slug>&theme=light` and `=dark`. Run the checklist
   below. Iterate until it passes. `tsc` green is NOT "done".
6. **Coherence check.** Re-read step 1: teaches exactly `newIdea`? payoff == next beat's premise?
7. **`tsc --noEmit` + `eslint --fix` on your file = 0 errors.** Then report: design direction (5–8 bullets),
   interaction model (3–6 bullets), any kit gap you added.

---

## WHERE MODELS FAIL HERE (the log — do not repeat these)

- **Built without the narrative before it → "pegado".** → Contract step 1. Read the spine; restate context.
- **Built blind, validated with `tsc` only.** Compiles but illegible / too fast / spectacle over meaning.
  → Contract step 5. The bench exists so you can SEE it.
- **Reinvented the look → mediocre & inconsistent.** → THE ONE RULE. Assemble from the kit.
- **Named the names too early.** The §1 window must label "1/2/3/4 letras de memoria", NOT
  "bigrama/trigrama/4-grama" — those words are earned in the body prose AFTER the widget. (discover-don't-define)
- **Faked statistics.** Hardcoded "th→e 85%", simulated fill matrices, fake IDs. → real `ngramData`.
- **Multi-accent noise.** The old chapter mixed amber/cyan/emerald/violet/red. ONE accent: amber `--ngram-*`.
- **Easy guess game.** A predict-the-next where you nail it from the first letter proves nothing (Bar-v2
  gate). Pick a case genuinely ambiguous early, forced only by LATE context.
- **Color-only (no readable statistics).** A heatmap that shows ONLY color says little. SEE the numbers:
  counts climb, hover a cell → its count, the headline value is a number.
- **Shrank the hero to fit chrome → tiny visual.** The hero is BIG; fit by REMOVING chrome, never shrinking.
- **Judged size from a screenshot.** Headless looks MORE zoomed than real. Measure rendered px.
- **Demo, not interaction.** "Look at the colours" with no hover/click. Real interaction (GitHub-heatmap level).

---

## THE PIECES (what to use, when)

Same as bigram/kit (forked), reading `--ngram-*`:
- **`MarkedText`** — signature letter-by-letter marking (`hot1` filled chip, `hot2` soft ring, cur/past/future).
- **`ParchmentReader`** — the papiro reading surface for reading a long real text with a cursor.
- **`FixedAlphabetRow`** — N fixed slots (space, a–z): bars + heat cells + labels. The bridge object to a row.
- **`heat(p)`** — the one amber heat ramp (0..1 → color). Use anywhere you color by frequency.
- **`Readout`** — `LABEL · char · big climbing number` header.
- **`CountUpNumber`** — one-shot 0→value reveal (for a live tally render the raw number instead).
- **`Tabs`** — pill segmented control.
- **`PlayButton` / `GhostButton`** — the only two button shapes.
- **`CaptionLine`** — the mono uppercase eyebrow (never a heading).
- **`HonestBar` / `PairChip` / `Verdict`** (in `../`) — honest fixed-axis bar, pair chip, sage verdict panel.

NEW ngram primitives (added for this chapter — keep them blessed, don't inline):
- **`ContextWindow`** — a sliding window of the last n chars over a real text: past chars dim, the n-char
  window highlighted (the context), a cursor at the prediction point. Drives §1 (predict game) and reusable.
- **`ExplosionGrid`** — a grid/number that multiplies ×27 per step to visualize 27^(n-1) combinatorial growth.
  Drives §4. Ordered, count-idiom, heat. (If a new beat needs a new reusable piece, ADD it here + document.)

---

## SELF-CHECK CHECKLIST (run in the bench, both themes)

- [ ] **One idea, clear in ~5s.** A stranger gets the point from the visual + one interaction.
- [ ] **Legible.** Numbers readable; nothing overflows; contrast real in BOTH light and dark.
- [ ] **Rhythm.** A sweep ≈ 2s; no dead air; a teaching scan is visible but not sleepy.
- [ ] **Tokens only.** No hardcoded hex / Tailwind `amber-*`. Colors/fonts/radii are `--ngram-*` / kit tokens.
- [ ] **No noise.** No neon, no dashboard, no extra borders/cards, no default charts, no traffic-light dots.
- [ ] **Coherent.** Marking, heat ramp and row look like the rest of the chapter (you used the kit).
- [ ] **Reduced motion.** Settles to the final state, no info lost. No synchronous `setState` in a `useEffect`
      body (keyed remount, or latest-closure refs + `setTimeout`/`rAF`).
- [ ] **Self-mounting.** No required props (accept optional `accent?: "ngram"` and `void` it). `memo`. `"use client"`.

---

## VOICE (for any copy you touch — i18n `en.ts`/`es.ts`, both in sync, Spanish-first)

- **Never name the language/domain.** No "in English", no naming the corpus. Shakespeare = the author (ok).
- **Never order the reader.** No "Escribe…", "Mira…", "Cuenta…", "Pregúntale…". Use inclusive "vamos a…",
  declarative "le preguntas…", or let the widget's affordance invite (a blinking blank invites typing).
- **No AI-tone — the 7 tells.** See `narrative-guidelines.md` → "No suenes a IA — los 7 delatores". In short:
  vary sentence length (no machine-gun staccato — mix one long winding sentence with a short punch); no
  obvious connectors (Además/Por lo tanto/Sin embargo/Cabe destacar); no rimbombante adjectives
  (innovador/fascinante/crucial/épico); no clichéd hooks ("Imagina un mundo…", "¿Alguna vez te has
  preguntado…?"); no obligatory moral closing every paragraph; no rigid hamburger structure; no
  American-marketing copy ("Descubre cómo…", "Eleva tu…"). After writing copy, have an agent audit it.
- **Discover, don't define.** The term is named AFTER the experience makes it obvious. "n-grama" is earned in §1.
- **Humor throughout, honest.** The machine that predicts without understanding. No "fácil/obvio/simplemente/claramente".
- **Spanish-first.** You may add new i18n keys to `en.ts` AND `es.ts` (in sync, same shape) when a beat needs copy.

---

## NARRATIVE CONTRACT — never edit copy key-by-key; review the WHOLE section as prose

The #1 narrative failure is **flow**, not a single bad sentence: copy lives scattered across i18n keys, so
nobody reads the chapter end-to-end → weak/duplicated bridges, flat arc, beats that don't hand off. Before
touching ANY copy:
1. **Regenerate and READ the living mirror.** `node gen-ngram-prose.mjs` → rewrites `ngram-narrative.md`, the
   WHOLE chapter in render order (every i18n string + widget markers) from `es.ts`. Read it straight through.
2. **Run the FLOW GATE over the whole mirror:** arc rises (curiosidad→logro→logro mayor→muro→decepción→nueva
   curiosidad) · every beat bridges with a reader "¿y si?" · ZERO duplication (a hard fail) ·
   discover-don't-define holds across beats · voice consistent (no banned words, ≤1 em-dash/200 words, no
   orders, language never named) · anchor coherence · poda · body rhythm (no 3+ paragraph walls; break with a
   callout/standout phrase/widget/«Historia» foldout, max 1).
3. **Port to BOTH `es.ts` and `en.ts`** (in sync). Update `ngramSpine.ts` `copyNs` if keys changed.
4. **Regenerate and RE-READ** to confirm no new duplication. The mirror stays current — do NOT delete it.

Rule of thumb: *if you edited an i18n key without first reading the whole chapter mirror, you did it wrong.*

---

## HARD GATES — Bar v2 (a widget is NOT done until ALL pass)

- [ ] **The hero is BIG; fit by REMOVING, never by shrinking the hero.** The ONE focal visual is dominant,
      centered, with legible axis/row/column labels. Secondary chrome MAY run past the fold. For huge data a
      lens/zoom shows the exact value WHERE you look.
- [ ] **Statistics, not just color.** Counts tick up as it fills; hovering reveals a count; the headline is a number.
- [ ] **Real interaction (GitHub-heatmap level).** Hover → cell's value; click → mark + commit "N times" (and
      "never" honestly). A static "look at the colours" demo = fail.
- [ ] **Ordered, followable build.** Fill/grow in a legible order (alphabetical for matrices), never random.
- [ ] **Highlight actually highlights.** TEST it in the bench — a no-op highlight is a fail.
- [ ] **Readable pacing.** Prefer manual, user-driven advance for teaching steps; first pass manual, auto mode
      dwells long enough to read. "Looks cool but I can't read it" = fail.
- [ ] **A predict/guess game must be genuinely HARD — the reader must NOT succeed early.** (§1 ContextWindow:
      with 1 letter the bet is a coin-flip; only late context forces the answer.)
- [ ] **Minimal in-widget text — NO baked-in eyebrow / heading / lead / intro paragraph.** Framing lives in
      the BODY prose around the widget, NOT inside it. Inside the widget keep ONLY functional text: button
      labels, axis/value labels, the honest readout/count. Default to LESS.

## QUALITY PASSES (run all, in order)
1. **Build** per THE BUILD CONTRACT (kit + spine context packet).
2. **Self-gate**: screenshot in the bench, BOTH themes; full checklist + Bar-v2; MEASURE dimensions.
3. **Harsh critic**: non-complacent review against the manuals (pilares, motion-bible, anti-noise, Bar v2).
4. **Orchestrator visual gate**: screenshot and sign off on feel.

## VALIDATE

`/lab/bench?w=<slug>&theme=light|dark` renders one widget in isolation (no lazy-load, no backend, no LabShell).
Add your widget's slug to `src/app/lab/bench/page.tsx` and ensure the bench applies `[data-ngram-theme]` for
ngram slugs. Only surface a widget to the user after it passes the checklist in both themes.
