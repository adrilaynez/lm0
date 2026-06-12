# N-GRAM — MASTER SPEC + PLAN (autonomous run)

> Single source of truth. The user is asleep and wants EVERYTHING perfect with NO more iterations.
> Captures ALL feedback (3 waves) + the execution plan + the verification protocol.

## 0 · PROCESS RULES (innegociable)
- **Builds with Opus agents**, one file each, detailed brief, each agent MUST read the construction rules first.
- **Do NOT trust builder agents' self-reports.** I verify every widget myself with a real screenshot.
- **Blind external audit per widget**: a fresh agent that sees ONLY the screenshot (no code, no narrative) and
  applies the **5-second rule** (can a stranger grasp the ONE idea in ~5s? is it legible? is it beautiful?).
- **Judge aesthetics + fit + function**, not "the mechanic runs."
- **Construction rules** to obey: `CLAUDE.md`, `method-failure-book.md`, `narrative-guidelines.md`,
  `bigram-design-spec.md`, `docs/bigram-motion-bible.md`, `src/features/lab/components/bigram/kit/AGENTS.md`,
  the ngram kit + tokens. (An agent produced a digest — see `ngram-construction-digest.md` if present.)

### Screenshot recipe (SOLVED — the preview was failing two ways)
1. If the bench shows "Internal Server Error" / blank / capture hangs → the `.next` cache is corrupted (from
   concurrent recompiles). FIX: kill the dev `next dev` PID, `Remove-Item .next -Recurse -Force`, restart.
2. The capture also hangs when the tab is `document.hidden`. FIX: **`preview_resize` immediately BEFORE
   `preview_screenshot`** forces a repaint/foreground → capture works.
3. Bench URL: `http://localhost:3000/es/lab/bench?w=<slug>&theme=dark&bare=1`. Drive widgets via `preview_eval`
   (clicks), then resize→screenshot. The preview's own width is small; resize to ~1000–1120 for desktop fit.
- **Anti-corruption guard:** don't have many agents editing+compiling simultaneously while screenshotting.
  Build in disjoint files, then nuke `.next` + restart before the verification pass.

### Per-widget PASS criteria (all must hold)
- Fits on screen (≤ ~700px tall desktop), no horizontal scroll, controls stable.
- A stranger gets the ONE idea in ~5s (blind audit confirms).
- Beautiful: amber `--ngram-*` tokens only, kit primitives, typography-first, no ugly bars/chrome, calm.
- Real data, reduced-motion safe, `tsc` + `eslint` clean.

---

## METHOD v2 (learned the hard way — a widget can be CLEAR yet WRONG)
The blind 5s audit measures LEGIBILITY, not whether the widget does what the user literally asked. I accepted
several widgets as "done" because they read clearly, while they failed the user's functional spec. Fix: TWO gates,
BOTH required before "done":
1. **Spec-compliance checklist** — the user's literal functional must-haves, written per widget, that I (the
   orchestrator) verify myself via DOM/screenshot. Each builder brief now ships with this checklist.
2. **Per-widget blind audit** — ONE fresh agent PER widget (never one agent for all — it gets lazy/diluted). It
   sees ONLY the screenshot(s) + the SURROUNDING NARRATIVE prose (what a real reader has on the page); NEVER the
   code, NEVER my "what it teaches"/hero/key-number. It judges as a real reader would.
"CLEAR" alone ≠ done. Done = every checklist item ticked AND the blind audit CLEAR.

## ROUND 3 — user re-reviewed via real screenshots; 5 still wrong (reworks launched)
- ExplosionZoom: must START as a readable BIGRAM MATRIX (like BigramMatrixBuilder, vertical legible rows) + a
  SINGLE INCREMENTAL button (+1 letra, ×27 each press) climbing up to >atoms (~10^80), NOT a row of rung pills.
- EmptyVoid: must match EmptyMatrix (clickable grid → click cell → it's empty → count) + a "Llenar" button that
  steps in JUMPS (1→2→5→10→100→1000→1M→…→todo Internet) + an "auto/mira por ti" button. NOT auto-only.
- QuantumElephant: RECONCEPT — infinite (phrase-length) context, all-Internet, never saw the phrase → uniform die
  → RANDOM gibberish (xsfndafd); "completar" → gibberish, "ver por qué" → empty row + uniform die; language-is-infinite.
- WordsExplosion: "sigue horrible" — kill the two-card dashboard; ONE focal scale visual (words dwarf letters).
- BigModelLimit: "sigue flojo" — vivid premium search→read→write journey; dramatic perro-full vs gato-empty.

## OVERNIGHT PROGRESS (live log)
- ✅ All 8 problem widgets rebuilt/reworked by Opus agents (1 file each): RowSummer, ExplosionZoom, EmptyVoid,
  QuantumElephant, BigModelLimit + my CountingPairs chip fix + GrowingTable total/×27 + WriteFromMatrix declutter.
- ✅ Verified each by my own screenshots/DOM. ✅ Blind 5s audit (independent agent, image-only) run.
- Blind audit found: RowSummer **CONFUSING** (dark-on-dark panels invisible); ng-limit empty bars looked full;
  ng-elephant break point ambiguous; ExplosionZoom had a count bug (bigram=729). Others CLEAR.
- ✅ Fixed all four: ExplosionZoom (bigram now 27 → trigram 729 → … → 10-grama ≈7,63×10¹² break rung);
  RowSummer (panels → `--ngram-surface` + border + shadow, empty rows opacity 0.4, first row in ~60ms);
  BigModelLimit (empty bars → 1px hairline rails; minimap labeled "la tabla/19.683 filas");
  QuantumElephant (phrase A → "the brown dog is here" so it writes cleanly; B break frozen at «quan» with
  "aquí se rompe" + first-«?» marker).
- ✅ `tsc --noEmit` + `eslint` clean after every wave. Capstone TODO marked in es/en MDX.
- Re-audit (4 fixed): RowSummer ✅CLEAR, BigModelLimit ✅CLEAR; ExplosionZoom + QuantumElephant still CONFUSING.
- Fixed those 2 (yellow-patch min-size floor; empty-row histogram + dominant break). ExplosionZoom fix agent left a
  `yellowPx` typo → tsc error → route 500'd (that was the real "0×0"); I fixed it (`yellowPx`→`yellowSize`). tsc clean.
- 🔄 COMPREHENSIVE blind audit of ALL 12 widgets running (user: "no me fío NADA"). Verifies the 2 fixes + everything.
- ⏳ REMAINING: address any re-audit FAILs; §5 text-monotony polish (keep content, add typographic variety /
  optional small viz); lengthen the 2 expandables; final changelog/PROJECT-LOG entry.
- **Screenshot recipe note:** screenshots hang when the preview tab is `hidden`; a fresh blind agent retries/
  resizes and gets them. `.next` corrupts under concurrent agent recompiles → 500 on all routes → nuke + restart.
  PHRASE-A WORDING CHANGED ("…sat"→"…is here") — flag to user, revert if they want their exact sentence.

## 1 · EXECUTION ORDER
1. RowSummer (2.2) — most rejected.   2. CountingPairs (2.1) polish (chips).   3. ExplosionZoom (4.1) rework.
4. EmptyVoid (4.2) rework.   5. QuantumElephant (4.3) full rebuild (no text box).   6. BigModelLimit (5.1).
7. WriteFromMatrix (3.1) verify declutter.   8. GrowingTable (2.3) verify.   9. SplitTheRow (2.2.5) verify.
10. LookWhatYouBuilt (3.2) verify (keep).   11. WidenWindow (1) verify.
12. Narrative: break §5 text monotony + add capstone TODO marker.
Each: build (Opus) → I screenshot+verify → blind 5s audit → iterate until PASS.

---

## 2 · PER-WIDGET SPEC / PROBLEM / FIX

### RowSummer (2.2) · slug ng-rowsummer — REBUILD
- **SPEC:** like the bigram Shakespeare counter (text scanning up top, table GROWS). Count family by family:
  «a» → its 27 rows fill; "añadir la B" → 27 more; "añadir la C" → 27 more; "completar abecedario" → the rest;
  a visual formula resolves **27 × 27 = 729**.
- **PROBLEM (3 waves):** (a) the 9-row window is a "mierda de ventanita" → **show ≥27 rows (a whole family)**,
  show MORE; (b) **the slider/scroll bar is "muy poco elegante" → remove it, find an elegant way**; (c) aesthetics
  "horrible" → make it genuinely beautiful; slow→fast; don't read all Shakespeare.
- **FIX DIRECTION:** show a FULL family (27 rows) at once in a tall, elegant panel; accumulate families as the
  count climbs to 729; NO visible ugly scrollbar (auto-advance / smooth reveal / column layout / zoom-out
  overview — builder decides within the bar). The 729 must be FELT (the slab visibly becomes 27 families).

### CountingPairs (2.1) · slug ng-counting — POLISH ONLY
- **DONE:** rows are born as each pair is counted, controls above (button never moves), no scrollbar.
- **PROBLEM:** the yellow row-label chips (th, he, e␣…) are **different sizes → ugly**. Aesthetics weak.
- **FIX:** uniform, elegant row-label chips (consistent width/height/baseline); overall visual polish. Do NOT
  change the mechanic. Keep the fixed phrase "the cat sat on the mat".

### ExplosionZoom (4.1) · slug ng-zoom — REWORK
- **SPEC:** the scale/explosion viz. **Start as a bigram and SHOW the actual rows/cells (a real matrix).** What's
  highlighted in **yellow = the size of ONE bigram, for comparison** (so the new table visibly dwarfs the bigram).
  **NO slider-with-all.** Discrete buttons: **bigram, trigram, 4, 5, then 8, 10** (the interesting ones; grows
  FAST so you don't click forever). End: it **breaks visually** → scientific notation → "más filas que átomos en
  el universo observable". Make it MUCH more understandable.

### EmptyVoid (4.2) · slug ng-void — REWORK
- **SPEC:** mix of EmptyMatrix + BookFirehose. Huge grid, 99% gray (zeros). Trains with more data and stays empty.
- **PROBLEM:** add an **AUTO button** (clicking the table is "horrible"); **slower progressive fill**: first 1,
  then 2, then 10, then 1000… (progressive but fast); the table should look **less like a pattern** (the lit
  cells must look organic/real, not a geometric stamp).
- **FIX:** auto-play that trains with growing amounts (1→2→10→1000→… or book→10M→Internet), grid stays ~99% gray,
  lit cells scattered realistically (not a pattern).

### QuantumElephant (4.3) · slug ng-elephant — FULL REBUILD, NO TEXT BOX
- **SPEC (user rewrote):** **NO free text box — two FIXED phrases (no typing).** Show **exactly how the table is
  searched and read** (with the percentages). Phrase A **"The brown dog sat"** → predicts well (down / on the
  mat). Phrase B **"The quantum elephant sat"** → the prediction row is empty → **probabilities collapse to 0%**
  → the model **picks a RANDOM letter/symbol (X or ?)** and you **SEE it write/construct it** (like a previous
  generation viz — show the act of writing). Teaches: when it hasn't seen the combo, it breaks.

### BigModelLimit (5.1) · slug ng-limit — IMPROVE
- **SPEC:** "ESTÁ BIEN más o menos" — same idea, but clearer. Search + show the SAME, but it should also **write
  (predict)**. Add a **SPOILER line before it happens**: "la tabla vio «el perro duerme» muchas veces · nunca «el
  gato duerme»". perro → its row is full → predicts "duerme". gato → its row (thousands away) is empty → 0%.
  Hermetic boxes, no bridge, "loro con muy buena memoria".

### WriteFromMatrix (3.1) · slug ng-write — VERIFY declutter
- Agent decluttered it (same logic, calmer). Verify: same elements, less chaos, more elegant, fits.

### GrowingTable (2.3) · slug ng-grow — VERIFY
- Added «solo la t = 729 = el N=2 entero · 1 de 27 ramas» → «× 27 = 19.683 total». Verify visually; aesthetic
  should feel like "Shakespeare centered on one letter".

### SplitTheRow (2.2.5) · ng-split · LookWhatYouBuilt (3.2) · ng-built · WidenWindow (1) · ng-widen — VERIFY
- Two tables side-by-side / the race / the "they" window. Confirm they read well; keep.

---

## 3 · NARRATIVE TASKS
- **Break text monotony (esp. §5).** The §5 closing prose is great — **do NOT change its content** — but it's
  paragraph-after-paragraph. Add visual variety: pull-quotes / varied type sizes & shapes / a small viz of "a
  machine connecting ideas". Also "add something between text blocks" generally so it's not a wall of text after
  each visualizer. (Use the §5 text the user pasted — it's the canonical version.)
- **Expandables** (STORY §3, PALABRAS §4): make MUCH longer, same length/tone as the bigram expandables.
- **§5 closing + button to Neural Networks: already fine — DO NOT touch.**

---

## 4 · CAPSTONE TODO (DO NOT BUILD THIS ITERATION — mark only)
- **What:** "Entrena tu propio n-grama" — user types/pastes text → it "trains" (counts build, like the
  Shakespeare scan) → then **writes** new text from those counts.
- **Where:** END of §3 — after the STORY `<Expandable>`, BEFORE "Seeing such an obvious improvement… let's try
  to build it." (en.mdx ~line 78; mirror in es.mdx). Add an MDX `{/* TODO: capstone */}` marker there.
- **How:** 100% client-side, no backend (cost scales with input length, not 27^N). One mechanic, no dashboard.
- **N:** user now wants **N=3 and N=4 too** (not just N=1/2) so the output writes reasonably well. (Short text +
  high N risks "loro" — handle with a good default text + framing.)
- **Text input policy:** only TWO text-ish inputs in the chapter — this capstone is the ONLY free-text box now
  (QuantumElephant is being changed to fixed phrases, no box). CountingPairs keeps its fixed phrase.
