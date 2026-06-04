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
button, or a parchment reader from scratch — stop, you are about to reinvent a kit piece and it will come
out mediocre and inconsistent. Import it instead. (A widget's ONE unique mechanic IS coded in the widget.)

```ts
import {
  MONO, SERIF, STD, heat, displayChar,        // tokens.ts (resolve under [data-ngram-theme])
  MarkedText, CaptionLine, Tabs,
  PlayButton, GhostButton, CountUpNumber, Readout,
  FixedAlphabetRow, ParchmentReader,
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
2.5. **Think like a designer with the final word (5 directions + the hero + the hierarchy study).** Before
   touching the kit, write: *the ONE thing the reader leaves with* and *the hero* (the single number/shape that
   MUST dominate). Brainstorm **~5 distinct visual directions** to teach it — do NOT default to "what bigram
   did". Study the **visual-hierarchy tricks as the teaching tool**: what the eye hits first, contrast, size,
   position, focal point, Gestalt — engineer them so the hero is what a stranger sees FIRST. Pick one direction
   with a written reason. **You have the final word:** same aesthetic family as bigram (tokens, kit look), but
   the mechanic is free — more complex, or a technique borrowed from elsewhere, if it teaches *this* idea
   better. (n-gram v1 chose parity over best-fit and every widget read SORT-OF — `method-failure-book.md` RC-2.)
   **Order of priorities (floor first, ceiling last — never trade down):** (1) **idea** — from the narrative,
   pin exactly what the reader must REALIZE; (2) **express it brilliantly, VISUAL-FIRST** — the more the idea
   is carried by the picture and the less by text, the better. *This floor is mandatory; a widget that only
   nails this is already acceptable.* (3) **interactive** — direct manipulation; hover/click reveals meaning;
   (4) **a rabbit hole (the high bar / la vara)** — a place the reader gets LOST in out of curiosity: a matrix
   whose numbers you pore over, layers to wander (e.g. roam the empty cells and see the zeros), something you
   keep poking and keep discovering. **Aim for (4).** If the idea genuinely doesn't support a rabbit hole,
   fine — but NEVER sacrifice (2) to reach (3)/(4). Express the idea first; then deepen.
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

Per-widget UNIQUE mechanics (built inside their `.tsx`, NOT kit primitives — they're each used once):
- §1 ContextWindow's sliding context-window is just `MarkedText` (mark the last n chars `hot1`/`hot2`) + a
  cursor span — no new primitive needed.
- §4 ContextExplosion's ×27 grid is a small inline grid in the widget (one-off).
If a future beat needs a genuinely REUSABLE piece, ADD it to the kit (export from `index.ts`) and document
it here — do not advertise a primitive that doesn't exist.

---

## SELF-CHECK CHECKLIST (run in the bench, both themes)

- [ ] **In 5s you know WHAT TO DO and WHAT MATTERS — not necessarily the whole concept.** The hero and the
      entry point (which button to press, what to hover/read) are instantly obvious. A complex idea MAY take
      longer than 5s to fully land IF the widget takes you by the hand (press this → watch this number → now
      this). What fails: a stranger who doesn't know where to start or what to look at.
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
- [ ] **Scale is SHOWN, not numbered.** Any big quantity (729 · 14M · "billones") ships with a magnitude
      visual that **changes with the number**: a table/grid that visibly GROWS, or a zoom/lens that says "you
      see 0.000…% of something this big". A picture identical for 729 and 14,000,000 = fail; a big climbing
      number alone reads as "looks small" to a stranger. (v1 `ContextExplosion`/`SparsityView`/`InfiniteTable`
      all failed this — `method-failure-book.md` §1.)
- [ ] **Fresh-eyes gate v2 (independent — THE keystone). BINDING CONTRACT: `method-failure-book.md` §8.**
      You cannot grade your own legibility: you already know the answer. THIS GATE FAILED ONCE BY PRIMING
      (ExplosionZoom passed two filters being a mess — §8). The non-negotiables now:
      - **Screenshots only, never the code.** Judge rendered PNGs (`bare=1`, no chrome). Seeing the `.tsx` =
        reverse-engineering intent = no longer a user.
      - **One capture per STATE/functionality** (initial + each interaction clicks=1..N + each tab/mode + BOTH
        themes), not 2 cherry-picked. Missing a state ⇒ the gate CANNOT pass.
      - **Context = ONLY the narrative that PRECEDES the widget** (what a reader knows on arrival). NEVER name
        what it teaches, the hero, the key number, or "look for X". A prompt that leaks the lesson = invalid
        gate, redo it. The reviewer DERIVES the lesson blind; the orchestrator compares it to the intended
        idea (mismatch ⇒ FAIL).
      - **Everything visible is the product** — forbidden to excuse anything as "probably bench chrome".
      - **Zero defects = PASS.** No "PASS with minor polish". Any defect listed ⇒ REWORK. The flow does NOT end
        until ALL widgets are clean PASS; if one keeps failing after N rounds, escalate to the user.
      - **Model is NOT the lever — independence is.** A BLIND Sonnet sees the mess in the screenshot; a PRIMED
        Opus passed it. Use Sonnet for the blind gate; reserve Opus for building. **Builder never self-approves.**
        **Orchestrator must independently eyeball the real shipped state and confirm the gate prompt carried no
        lesson — never copy the gate's excuses into reports.**
      **Leaves an ARTIFACT:** the reviewer's raw blind answer + the spec's hero + PASS/FAIL →
      `ngram-gates/<slug>.fresh-eyes.md`. **No artifact = not done.** Recipe + master ladder: §4b/§4c/§8.

## QUALITY PASSES (run all, in order)
1. **Build** per THE BUILD CONTRACT (kit + spine context packet).
2. **Self-gate**: screenshot in the bench, BOTH themes; full checklist + Bar-v2; MEASURE dimensions.
3. **Fresh-eyes gate v2 + judge panel (independent, OPUS — do NOT skip).** A blind **Opus** agent runs the §8
   gate (screenshots of EVERY state, preceding-narrative context ONLY, never the lesson); a 3-lens panel
   reviews — **child** (no jargon: do you get it?), **aesthetics/hierarchy** (is the hero what the eye hits
   first?), **teacher** (is the ONE idea taught AND discovered, not told?). All must pass with ZERO defects.
4. **Rebuild if less than a clear YES.** If the blind stranger or any judge lists ANY defect, REBUILD — don't
   patch, don't "PASS with minor polish". Expect ≥1 rebuild on a key widget; it's the rule (pilar 18). Loop
   build→gate→rework until clean PASS; the flow does not end with known defects.
5. **Harsh critic**: non-complacent review against the manuals (pilares, motion-bible, anti-noise, Bar v2).
6. **Orchestrator REAL gate (not a rubber stamp — §8.10).** Independently eyeball the actual SHIPPED state
   (the page, not only cherry-picked bench shots); confirm the gate prompt carried no lesson; NEVER copy the
   gate's excuses/hallucinations into reports. If the orchestrator didn't look, there is no second filter.

**Proportional rigor (don't burn the budget).** The FULL pass (5 directions + 3-judge panel + rebuild +
fresh-eyes, both themes) is for the **2-3 HERO widgets** of the chapter. A simple/quiet widget needs only the
fresh-eyes 5s gate + the checklist. Not everything must be a showpiece — but everything must be UNDERSTOOD.
**Risk-first:** build the riskiest hero (e.g. "can scale be FELT?") as a throwaway spike BEFORE the narrative
commits prose to it; if it can't be made legible, change the plan early (`method-failure-book.md` §4.10–11).

**Generation panel (HERO widgets) — generate by committee, don't solo-default.** One mind under pressure
defaults to parity ("what bigram did"). For a hero, spawn 3-5 PARALLEL idea-agents, each given ONLY the beat's
teaching goal + this method (not each other's output); each returns ONE-idea + hero + its single best concept.
Then pick/merge the strongest with a written rationale, saved to `ngram-gates/<slug>.directions.md` (the 5
directions + the choice — required for ANY widget; no file = ideation was skipped). Mirrors the judge panel.
**Seed ideas (a brief, the user's sketches) are INSPIRATION to BEAT — never a spec.** Propose better/different;
generate MORE widgets where a complex idea warrants one (don't cap at the seed list); and if a builder idea
beats the seed, use the builder's. Then design the **THROUGH-LINE** — how each beat hands off to the next as a
discovery journey — not isolated widgets.
(Proven: blind idea-agents reinvented the chapter's best widgets — drill-down scale, split-the-row build,
text-firehose, lookup-loop — from the goal alone; `method-failure-book.md` §4d.)

## VALIDATE

`/lab/bench?w=<slug>&theme=light|dark` renders one widget in isolation (no lazy-load, no backend, no LabShell).
Add your widget's slug to `src/app/lab/bench/page.tsx` and ensure the bench applies `[data-ngram-theme]` for
ngram slugs. Only surface a widget to the user after it passes the checklist in both themes.
