# bigram/kit — how to build a Bigram visualizer (read this first)

You are about to build or rework a visualizer for the **Bigram** chapter. This file tells you exactly how,
written for a model, centered on **where models keep failing here** and **what to check before you call it
done**. If you follow it, the widget comes out right on the first pass and the user does not have to rebuild it.

The chapter accent is **editorial-green**, scoped under `[data-bigram-theme]` (works light + dark). Authorities:
`docs/bigram-motion-bible.md` (motion), `bigram-narrative-guidelines.md` (voice/pedagogy), tokens in
`bigram-design-spec.md §1`. **Ignore** the "v10 prototype" / "faithful port" talk in `CLAUDE.md` and the
v8/v10 files — obsolete; the current §1/§2 React widgets ARE the aesthetic baseline, and this kit is extracted
from them.

---

## THE ONE RULE

**Assemble from the kit. Do not re-code the look.** A widget is `kit primitives + its one unique mechanic`.
If you find yourself writing `data-state="..."` chips, a 27-column grid, a parchment reader, a count-up, a
pill tab bar, or a play button from scratch — stop, you are about to reinvent a kit piece and it will come out
mediocre and inconsistent. Import it instead.

```ts
import {
  MONO, SERIF, STD, heat, displayChar,        // tokens.ts
  MarkedText, CaptionLine, Tabs,              // marking + chrome
  PlayButton, GhostButton, CountUpNumber, Readout,
  FixedAlphabetRow, ParchmentReader,
} from "@/features/lab/components/bigram/kit";
// also available from "@/features/lab/components/bigram": HonestBar, PairChip, Verdict
```

---

## THE BUILD CONTRACT (do these in order, skip nothing)

1. **Context first — kills the #1 failure ("widget pegado sin contexto").** Before any code, read the
   `bigram-spine` entry for the PRECEDING beats + this beat + the next, and restate in 2 lines: *what the
   reader knows entering · the one new idea · the question this answers · what it hands to the next beat.* If
   you can't, the spine is incomplete — fix the spine, don't guess in the widget. The widget must teach
   **exactly** its `newIdea`, assume **only** its `priorKnowledge`, and end where the next beat begins.
2. **Final image in words.** Describe the end-state (what the screen looks like when it's done) before the
   mechanics. If you can't picture it, the spec isn't ready.
3. **Assemble from the kit.** Use the primitives. If a needed piece genuinely isn't in the kit, **report it**
   (add it to the kit as a new blessed primitive) — never silently re-implement or substitute.
4. **Real data only.** Counts/probabilities come from the data modules (`bigramShakespeare27.ts`,
   `bigramCorpus.ts`, `shakespeareText.ts`). Never fake a number — the user spots it instantly.
5. **Self-validate in the bench.** Render at `/lab/bench?w=<slug>&theme=light` and `=dark`. Run the checklist
   below. Iterate until it passes. `tsc` green is NOT "done".
6. **Coherence check.** Re-read step 1: does it still teach exactly `newIdea`? Does its payoff equal the next
   beat's premise? Fix any drift.
7. **`tsc --noEmit` + `eslint --fix` on your file = 0 errors.** Then report: design direction (5–8 bullets),
   interaction model (3–6 bullets), and any kit gap you had to add.

---

## WHERE MODELS FAIL HERE (the log — do not repeat these)

- **Built without the narrative before it → "pegado".** The widget teaches the wrong scope or assumes things
  the reader hasn't met. → Contract step 1. Read the spine; restate the context.
- **Built blind, validated with `tsc` only.** Compiles but is illegible / too fast / spectacle over meaning.
  → Contract step 5. The bench exists so you can SEE it; use it.
- **Reinvented the look → mediocre & inconsistent** (unreadable columns, floating-pair gimmicks, mismatched
  chips). → THE ONE RULE. Assemble from the kit.
- **Spectacle over comprehension; motion-first.** A widget teaches **ONE** concept understood in ~5s. Motion
  EXPLAINS; it is never filler. Decide "quiet step vs showpiece" before building.
- **Copy iterated to death.** Subtitles/labels rewritten 5×. → Write copy in the spine, pass the voice
  checklist (below) before showing it.
- **Wrong rhythm/temperature.** Too fast to read, or dead air. → A full sweep ≈ 2s; a slow teaching scan is
  visible but not sleepy; declare the temperature per beat.
- **Color-only (no readable statistics).** A heatmap/matrix that shows ONLY color says little. The reader
  must SEE the numbers: counts climb as it fills, hover a cell → its count, the key value shown as a number.
  → Bar-v2 gate "Statistics, not just color".
- **Shrank the hero to fit chrome → tiny, unreadable visual.** The single worst §4 mistake: the matrix was
  squeezed (e.g. MAX_SIZE 452, two columns) so a side panel + intro + clues all fit one screen — result, the
  92×92 was so small the labels were unreadable. WRONG. The matrix is the hero: make it big, cut the chrome.
  → Bar-v2 gate "The hero is BIG; fit by REMOVING, never by shrinking." Overflow of secondary chrome is fine.
- **Judged size from a screenshot.** Headless captures look MORE ZOOMED than real. Don't conclude "too big" and
  shrink. Capture at a real viewport (1280×900+) and let the hero be large.
- **Demo, not interaction.** "Look at the colours" with no hover/click. → Bar-v2 gate "Real interaction
  (GitHub-heatmap level)": hover shows the pair+count, click marks the row/col and shows "X→Y N times".
- **Random/unfollowable fill.** Cells light in no order. → Bar-v2 gate "Ordered fill" (alphabetical).
- **Judged size from a screenshot.** Headless captures look MORE ZOOMED than real, so things look bigger
  than they are. → Never conclude "too big/too small" from the PNG; measure rendered px (see CAPTURE LOOP).

---

## THE PIECES (what to use, when)

- **`MarkedText`** — the signature letter-by-letter marking. `hot1` = filled accent chip (the letter in
  focus), `hot2` = soft tint + ring (the next letter), plus `cur`/`past`/`future`. You pass `stateOf(i)`.
  `wordGroup` (default true) keeps words from splitting across lines. Use it for any "read the text and mark
  letters" moment.
- **`ParchmentReader`** — the "papiro" reading surface: a masked, scrolling block of the real text with a
  cursor and optional in-place `hot1`/`hot2`, a "reading…" marker and a progress hairline. Use it for reading
  a long real text (a book) rather than a short phrase.
- **`FixedAlphabetRow`** — N fixed slots (space, a–z) that never reorder: bars (magnitude) + heat cells (the
  row stored = one row of the matrix) + labels, aligned. Hoverable. Use it for "what follows X" as a stored
  row. This is the bridge object to the matrix.
- **`heat(p)`** — the one heat ramp (0..1 → color). Use it anywhere you color by frequency, so a row looks
  like a row of the matrix.
- **`Readout`** — the `LABEL · char · big climbing number` header (pass the value raw; it owns no animation).
- **`CountUpNumber`** — a number that animates 0→value once (one-shot reveals only; for a live-climbing tally
  render the raw number instead).
- **`Tabs`** — pill segmented control to switch texts/variants.
- **`PlayButton` / `GhostButton`** — the only two button shapes. Play = the one action; Ghost = secondary.
- **`CaptionLine`** — the mono uppercase eyebrow that labels a widget. Never a heading.
- **`HonestBar` / `PairChip` / `Verdict`** (in `../`) — honest fixed-axis bar, a t→x pair chip, the sage
  closing verdict panel.

---

## SELF-CHECK CHECKLIST (run in the bench, both themes)

- [ ] **One idea, clear in ~5s.** A stranger gets the point from the visual + one interaction.
- [ ] **Legible.** Numbers readable; nothing overflows; contrast real in BOTH light and dark.
- [ ] **Rhythm.** A sweep ≈ 2s; no dead air; a teaching scan is visible but not sleepy.
- [ ] **Tokens only.** No hardcoded hex. Colors/fonts/radii are `--bigram-*` / kit tokens.
- [ ] **No noise.** No neon, no dashboard, no extra borders/cards, no default charts, no traffic-light dots.
- [ ] **Coherent.** The marking, heat ramp and row look like the rest of the chapter (because you used the kit).
- [ ] **Reduced motion.** With `prefers-reduced-motion`, it settles to the final state, no info lost. No
      synchronous `setState` inside a `useEffect` body (use keyed remount, or latest-closure refs +
      `setTimeout`/`rAF` whose callback sets state — see RowTally/IsolateT).
- [ ] **Self-mounting.** No required props (accept optional `accent?: "bigram"` and `void` it). `memo`.
      `"use client"`.

---

## VOICE (for any copy you touch — it lives in i18n `en.ts`/`es.ts`, both in sync)

- **Never name the language/domain.** No "in English", no "the text we'll feed it". Examples are content.
- **Never order the reader.** No "Type…", "Look…", "Count…". Use inclusive "vamos a…", or let the widget's
  affordance invite (a blinking blank invites typing without a command).
- **No AI-tone.** No em-dash clusters, no triple-parallel staccato, no pseudo-deep openers.
- **Discover, don't define.** The reader feels it first; the term is named AFTER the experience makes it obvious.
- **Humor throughout, honest.** The heartless machine that still writes. Never condescending ("fácil",
  "obvio", "simplemente" are banned).
- **Spanish-first**, but the audience may read English. You **may add new i18n keys** to `en.ts` AND `es.ts`
  (in sync, same shape) whenever your beat needs copy that doesn't exist yet — the copy is NOT frozen. Don't
  invent keys you won't use; don't leave hardcoded user-facing strings in the component.

---

## NARRATIVE CONTRACT — never edit copy key-by-key; review the WHOLE section as prose

The #1 narrative failure here is NOT a single bad sentence — it's **flow**: the copy lives scattered across
i18n keys, so nobody ever reads the chapter end-to-end, and the result is weak/**duplicated** bridges (the
same idea introduced two or three times in different sections), a flat emotional arc, and beats that don't
hand off. The per-beat VOICE rules above are necessary but **not enough**. Before touching ANY copy, do this:

1. **Regenerate and READ the living full-chapter mirror.** Run `node gen-bigram-prose.mjs` → it rewrites
   `bigram-narrative.md`, the WHOLE chapter's prose in render order (every i18n string + widget markers),
   resolved from `es.ts`. This file is **persistent** (a read-only mirror, NOT deleted) — it is the single
   place to see what is already said and where. **Read it straight through before editing**, and check the
   ENTIRE chapter, not just your section: the concept you're about to add (e.g. "training data", "the table is
   the rules") is very likely ALREADY introduced in an earlier beat. (This exact mistake shipped: a §4
   paragraph re-explained "datos de entrenamiento" that §2 already named.) Regenerate it again AFTER your
   edits and re-read, to confirm you didn't introduce a repeat. The script is the source of "always current".
2. **Run the FLOW GATE over the whole mirror** (read it straight through, out loud if you can):
   - **Arc rises** (pilar 13): curiosidad → logro → logro mayor → triunfo → decepción honesta → nueva curiosidad.
   - **Every beat bridges** to the next with a reader "¿y si?" (pilar 8). No section starts in seco; no jagged jump.
   - **Zero duplication.** Two paragraphs that say the same thing (e.g. a widget `twist` AND the next connective
     paragraph both announcing "the real world has capitals") = cut one. This is a hard fail.
   - **Discover-don't-define holds ACROSS beats** (a term is never used before the beat that earns it).
   - **Voice consistent**: no banned words (fácil/obvio/simplemente/claramente), ≤1 em-dash per ~200 words, no
     orders to the reader, the language is never named.
   - **Anchor coherence** (pilar 16): the reader never wonders "which text are we looking at now?" (The corpus is
     never named, so a Shakespeare→Paul-Graham switch between widgets is invisible — fine.)
   - **Poda**: delete any paragraph the section doesn't miss.
   - **Body rhythm / variety** (pilar 19): no walls of text. If 3+ paragraphs run together, break them with a
     different element — a callout (`KeyTakeaway`), a big standout phrase, a widget, or a **«Historia» foldout**
     (max 1–2 per chapter, opt-in, fascinating-and-true like Markov/Shannon). Framing text is BODY, not baked
     into widgets.
3. **Draft the rewrite reading the WHOLE flow**, not isolated keys. Before adding a paragraph, search the
   mirror for the concept — if it's already said, don't repeat it; strengthen the bridge instead.
4. **Port the finalized copy to BOTH `es.ts` and `en.ts`** (in sync, same keys). Then update `bigramSpine.ts`
   `copyNs` if keys changed.
5. **Regenerate (`node gen-bigram-prose.mjs`) and RE-READ** to confirm no new duplication / broken bridge.
   The mirror is committed and stays current — do NOT delete it.

Rule of thumb: *if you edited an i18n key without first reading the whole chapter mirror, you did it wrong.*
Common trap: a concept ("training data", "the table = the rules", "more context = better") feels new in your
section but was already introduced earlier — the mirror is how you catch it.

---

## HARD GATES — Bar v2 (a widget is NOT done until ALL pass)

Added after the §4 first pass shipped matrices that were color-only, not interactive, and overflowed the
screen. The earlier checklist didn't make these hard. They are now. Every visualizer (especially any
grid/matrix/heatmap) must pass:

- [ ] **The hero is BIG; fit by REMOVING, never by shrinking the hero.** (Corrected after the §4 pass shrank
      the matrices to cram everything on one screen — that ruined them.) The ONE focal visual (the matrix /
      figure / chart that carries the idea) is the dominant element: as large as the content column allows,
      centered, with **legible axis/row/column labels** (knowing what the rows and columns ARE is almost the
      whole point of a matrix). NEVER shrink the hero to make room for chrome. When the widget doesn't fit a
      screen, ask "what do I REMOVE / push below the fold?" — intros, prompts, explanation panels, clue lists
      are secondary and MAY run past the fold; the reader scrolls for them. For huge data (e.g. 89×89) the hero
      still fills the column and a **lens/zoom shows the exact pair + count WHERE you look** — the lens is the
      legibility strategy, not a smaller grid. A primary readout (the hovered/locked count) stays near the hero;
      only secondary teaching chrome goes below.
- [ ] **Statistics, not just color.** The reader SEES numbers, not only a heat tint: counts tick up as it
      fills, hovering a cell reveals its count, the headline value is a number. Color alone = fail.
- [ ] **Real interaction (GitHub-heatmap level).** Hover → the cell's pair + its count; click → mark the
      row/column and commit "«x» → «y»: N times" (and "never" honestly). Mimic GitHub's contribution heatmap;
      it's the reference for this feel. A static "look at the colours" demo = fail.
- [ ] **Ordered, followable build.** Fill/grow in a legible order (alphabetical for matrices), never random.
- [ ] **Highlight actually highlights.** If there's a highlight/search/lens, TEST it in the bench — a
      no-op highlight is a fail.
- [ ] **Readable pacing — the reader can FOLLOW and READ every step.** (Added after a step-by-step widget
      blew through its phases "too fast to read, even for the author".) An animation that teaches a procedure
      must be legible at human reading speed. Concretely: prefer **manual, user-driven advance** for teaching
      steps — a "Siguiente" the reader taps to move to the next phase, so they read each at their own pace;
      make the FIRST pass manual, and only then offer an auto mode that **dwells long enough to read** (pace
      by how much text is on each phase — longer where there's more; never a blur). "It looks cool but I
      can't read it" = fail. If showing all phases at once makes it overflow, show **one phase at a time in a
      panel that reuses the space** (don't shrink the hero, don't race).
- [ ] **A predict/guess game must be genuinely HARD — the reader must NOT succeed early.** (Added after a
      "more context = better prediction" ladder used an easy case you could call from the first letter, which
      kills the whole point.) If the lesson is "the more you see, the better you predict", pick a case where
      early context is genuinely ambiguous and only LATE context forces the answer — e.g. a tricky-to-spell
      word revealed letter by letter where you can't reliably guess until the last letter or two ("c… cu…
      cup… cupid… → o"). An example the reader nails immediately proves nothing. Choose the example so the
      *failure with little context* is felt, then the *certainty with more context* lands. (Narrative Pillar
      10 + 11: predict-before-reveal AND live the failure.)
- [ ] **Minimal in-widget text — NO baked-in eyebrow / heading / lead / intro paragraph.** (Added because it
      became a reflexive habit: every widget shipped its own `CaptionLine` label + an italic lead, which just
      **duplicates the narrative body** sitting right above it.) The framing/explanation lives in the BODY
      (the `<P>`/`<Lead>` prose around the widget in `BigramNarrative.tsx`), NOT inside the widget. A good
      visual speaks for itself; the preceding body sentence explains the rest. Inside the widget keep ONLY
      **functional** text: button labels, axis/value labels, the honest readout/count, a tiny label for a part
      that isn't self-evident. Default to LESS — if a label restates what the visual already shows, cut it. Do
      NOT add an eyebrow or a lead to a widget by reflex. (If a widget is shown standalone in the bench it'll
      look barer — that's fine, the bench is a dev surface; the narrative is production.)

## QUALITY PASSES (run all, in order — "best in the world" needs all four)

1. **Build** per THE BUILD CONTRACT (kit + spine context packet).
2. **Self-gate**: screenshot in the bench, BOTH themes; run the full checklist + Bar-v2 hard gates; MEASURE
   dimensions (don't eyeball the zoomed PNG). Iterate until every box is checked.
3. **Harsh critic**: a non-complacent review against the manuals (pilares, motion-bible, anti-noise, Bar v2).
   Fix what it finds.
4. **Orchestrator visual gate**: the human-facing owner screenshots and signs off on feel.

## CAPTURE LOOP (process — keep it fast and honest)

- Screenshot via headless Chrome → read the PNG: `bash _shot.sh "/lab/bench?w=<slug>&theme=dark&play=1" out.png "1440,900" <budgetMs>`.
- **Speed:** big `--virtual-time-budget` + a full corpus scan makes captures take minutes. To judge SIZE/LAYOUT
  you don't need the scan finished — capture idle/mid-state with a SMALL budget (~5000). Prefer a `?final=1`
  bench path (mount the settled end-state, no scan) for end-state captures. Don't run 24s budgets to check size.
- **Honesty about size:** captures look MORE ZOOMED than real. Set window to a REAL viewport (1280×900+) AND
  confirm by measuring: headless-eval `document.querySelector('.bw-…').getBoundingClientRect()`
  vs `innerWidth/innerHeight`. Conclude "big enough / readable" from the numbers, not the image.

## SPEED (the loop must be fast — a §4 pass once took 30+ min and didn't finish)

- **Don't rebuild what's close.** If a widget already passes most gates, make SURGICAL edits to the existing
  file (the kit + the prior pass already carry the look). A from-scratch rewrite is slow and usually worse.
- **One validation loop, not ten.** Spec precisely up front, change, capture ONCE per theme, fix, done. Don't
  screenshot after every tiny tweak.
- **Cheap checks each edit, expensive once.** `eslint <file>` is instant — run it freely. `tsc --noEmit` scans
  the whole project (~30–60s) — run it ONCE at the end, not every iteration.
- **Small capture budgets.** A static widget needs ~4000–6000ms. Don't run 13000ms budgets unless you must see
  a long animation's end state.

## ATTACKING A SECTION THE USER HASN'T FULLY SPECCED (you decide what's missing)

When told "renovate §N" without a per-widget spec, YOU audit (per `narrative-guidelines.md` §Protocolo):
1. **Map the section** from `bigramSpine.ts` + the rendered page: each beat, its copy, its widget.
2. **Define the ideal "¿y si?" ladder + emotional beats** for §N — that's the bar to audit against.
3. **Score each existing widget**: KEEP / REWORK(exactly what) / REBUILD / DELETE — against the pilares, the
   Bar-v2 gates, and the checklist. Decide which widgets are MISSING (a beat with no widget that should have
   one) and which are redundant.
4. **Write the punch-list**, then build/rework via the contract + the four quality passes.
5. Only surface to the user what already passed the gates.

## VALIDATE

`/lab/bench?w=<slug>&theme=light|dark` renders one widget in isolation (no lazy-load, no backend, no LabShell
banner). Add your widget's slug to `src/app/lab/bench/page.tsx`. Screenshot if the tool works; otherwise audit
via `preview_eval` (computed sizes/colors/overflow/text). Only surface a widget to the user after it passes the
checklist in both themes.
