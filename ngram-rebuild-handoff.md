# N-gram chapter rebuild — HANDOFF (read this first)

> Continuation note for the agent picking up after a `/compact`. The N-gram chapter (`/lab/ngram`) was
> fully rebuilt: new 5-section narrative + 12 visualizers. Most works; a few items remain. **The user's #1
> rule: do NOT trust agent self-reports — verify every widget yourself with real screenshots + interaction,
> judged HARD (fits on screen? legible? pretty? no redundancy? stable controls?). Earlier failures came from
> rubber-stamping "the mechanic runs" as "it's good."**

## What the chapter is
A premium editorial lesson on n-gram language models, amber accent (`--ngram-*`), Spanish + English. The arc
(5 sections, file ids `ngram-01..05`):
1. **Mirar más atrás** — WidenWindow (window slider, climbing %).
2. **Cajas dentro de cajas** — CountingPairs (count pairs) · RowSummer (→729) · SplitTheRow (t-block = a whole bigram) · GrowingTable (scale to N=3/N=4).
3. **La generación** — WriteFromMatrix (lookup+die+write) · LookWhatYouBuilt (the N=1,2,4,5,6 race) · STORY expandable.
4. **El precio de la memoria** — ExplosionZoom (27^N → 10^80) · WORDS expandable (WordsExplosion) · EmptyVoid (empty table) · QuantumElephant (novel phrase breaks).
5. **El fin de contar** — BigModelLimit (perro/gato, can't generalize) → button to Neural Networks.

## Key decisions (do NOT relitigate)
- **N = letters of memory** everywhere (bigram = N=1 = 27 rows; trigram = N=2 = 729; 27^N). This came from the
  user's §1 + §4.1. Fixed off-by-one bugs: **GrowingTable is N=3/N=4** (not N=4/N=5 — the only way "solo la t = 729 / tríos" is correct); EmptyVoid label "4 letras"; WordsExplosion bigram = 27/50.000 (not 729). The MDX §2.3 prose says "N=3 o N=4" on purpose.
- **perro/gato (§5.1 BigModelLimit) is an explicit ILLUSTRATIVE example**, framed «ejemplo» in the UI ("la
  tabla vio «el perro duerme»… nunca «el gato duerme»"). A char-level English-Shakespeare model can't show
  semantic generalization with real data, so perro-row is hard-coded full / gato-row empty. Only the row
  *distance* uses real geometry (contextIndex). This is the one deliberate letters→phrase step.
- Widgets are built from `src/features/lab/components/ngram/kit` + real data `src/features/lab/data/ngramData.ts`
  (Shakespeare, char-level, 27 symbols). No backend. No faked counts (empty rows are honest; perro/gato is the
  one labeled exception).

## Critical files
- Widgets: `src/features/lab/components/ngram/*.tsx` — the 12 in narrative order: `WidenWindow, CountingPairs,
  RowSummer, SplitTheRow, GrowingTable, WriteFromMatrix, LookWhatYouBuilt, ExplosionZoom, WordsExplosion,
  EmptyVoid, QuantumElephant, BigModelLimit`. (Old dropped widgets — AmnesiaReplay, MuteSlot, EmptyMatrix,
  BookFirehose, Progression, RowSharpens — still exist + registered in the bench, just not in the narrative.)
- Narrative prose: `src/content/lab/ngram.es.mdx` + `ngram.en.mdx` (structurally identical mirror).
- Shell: `src/features/lab/components/NgramNarrative.tsx` (5-dot rail, widget registry, reads `ngramNarrative.v3.*`).
- Section names: `src/i18n/locales/ngram/{es,en}.ts` (the `v3.sectionNames` block — already the 5 new names).
- Bigram gold-standard references (the user keeps saying "like bigram"): `src/features/lab/components/
  BigramMatrixBuilder.tsx` (counting), `ShakespeareRowCounter.tsx` (live accelerating scan+count), `TableWriter.tsx`.
- Bench (verify ONE widget isolated): `/lab/bench?w=<slug>&theme=dark&bare=1`. Slugs: `ng-widen, ng-counting,
  ng-rowsummer, ng-split, ng-grow, ng-write, ng-built, ng-zoom, ng-words, ng-void, ng-elephant, ng-limit`.

## How to verify (preview gotchas — these cost hours)
- The preview's physical width is ~389px → it only renders LEGIBLE at mobile width. Screenshot at native
  (`preview_resize` preset `desktop` → resets to native ~389). For DESKTOP layout, set an explicit width
  (e.g. 920) and **measure via `preview_eval`** (`el.getBoundingClientRect()`, `scrollHeight`) — screenshots at
  >560px scale down illegibly.
- Mobile (<560px) hides some desktop-only pieces (e.g. WriteFromMatrix's minimap). Check both.
- `location.href` to the SAME url does NOT reload (leaves duplicate widget instances in the DOM → `.nw-*`
  selectors return 2×; reads look contradictory). Use `location.reload()` or change `?w=`.
- The screenshot tool sometimes returns a STALE/transition frame, or times out when the dev server is busy or
  the tab is `visibilityState:hidden`. If eval-state and screenshot disagree, re-screenshot; if it hangs,
  `preview_stop` + `preview_start` (name `web`) gives a fresh visible tab.
- The "Server unreachable" banner on `/lab/ngram` is the pre-existing free-lab backend (no backend in dev) —
  NOT a narrative bug; ignore.

## Status of each widget (verified at desktop width 920; height in px)
- WidenWindow 519 ✅ · SplitTheRow 614 (2 tables side-by-side) ✅ · GrowingTable 431–630, labels legible ✅ ·
  QuantumElephant 630 ✅ · BigModelLimit 541 ✅ · LookWhatYouBuilt ✅ (race, N=1,2,4,5,6) · WordsExplosion ✅.
- **RowSummer — REWORKED ✅** (was: dump of precomputed 2px strips + redundant verdict + too tall). Now the 'a'
  family is COUNTED LIVE from the scan (0→27, accelerating, like ShakespeareRowCounter), the parchment collapses
  after scanning, the redundant "cada letra carga su bigrama" verdict is GONE (SplitTheRow does that), lands on
  27×27=729 + honest stat. Verify on desktop.
- **CountingPairs — REWORKED TWICE ✅** (was: table shoved the button down each press + scrollbar). Now a FIXED
  bigram-style grid: all 15 pair-rows present from the start (dim until met), compact ~18px cells, **NO scroll
  box / NO scrollbar** (`overflow: visible`), button rock-stable, ~666px total. The user explicitly hated the
  scrollbar — it's removed. **NEEDS a desktop eyeball to confirm it reads pretty (compact dim grid).**

## REMAINING / pending
1. **Eyeball CountingPairs + RowSummer on the real desktop** (the preview couldn't screenshot desktop legibly).
   If CountingPairs' compact dim grid looks cramped, bump cell size slightly or lighten the dim rows.
2. **Three widgets are borderline tall** (773–806px) — tighten only if the user wants: WriteFromMatrix (3.1),
   ExplosionZoom (4.1), EmptyVoid (4.2). Likely fine on a large monitor.
3. **Finish the genuinely-critical design pass** on every remaining widget (legibility, pacing, redundancy,
   "pretty"), not just fit. GrowingTable/SplitTheRow were spot-checked OK; the §3–§5 widgets had function
   verified but not a harsh design critique.
4. Optional cleanup: delete the dropped old widgets + their bench entries; prune unused i18n `v2`/`s6` keys.

## Health
`tsc --noEmit` and `eslint` were clean after every change. PROJECT-LOG.md + ngram-changelog.md have entries
(2026-06-08). Nothing committed — all in the working tree.
