# Bigram visualizers — port to v10 · parallelization plan

Canonical source of truth = the **v10 vanilla prototype** (in `C:\Users\adril\Downloads\`):
`bigram-widgets-v10.js` (logic), `styles-v10.css` (visual + `:root` tokens, map 1:1 to `--bigram-*`),
`Bigrama v10.html` (markup + copy). **Never** port from v8, prose, or the old React component.

---

## Why the first workflow failed (diagnosis — all 4 widgets agreed)

1. **Wrong source of truth.** Agents ported **v8** (or the old React widget), not v10. v10 had *structurally
   redesigned* widgets, so even a faithful v8 port ships an obsolete widget.
2. **No browser validation** — `tsc`/lint only. A visual diff against rendered v10 would have caught every gap.
3. **Reinterpret, not port** — re-typeset "toward the v8 aesthetic" from memory; changed exact data/timings
   (CORPUS string, initial `"e"` state, `flyLetter`, DELAY).
4. **Primitives frozen to v8** — `HonestBar` literally "mirrors styles-v8 `.barrow` exactly", so any widget
   reusing it is stuck at v8 — and it was reused where the semantics are wrong (corpus = integer counts).
5. **Effort on the abandoned mechanism** — rebuilt the v8 sliding lens that v10 deleted ("la animación horrible").
6. **i18n frozen** — "don't touch i18n" locked v8 copy ("beat the model").

---

## The correct parallel run

- **Phase 0 · Pre-pass (1 agent, sequential — shared files only):** confirm `--bigram-*` ↔ v10 `:root`
  (already 1:1); add the new v10 i18n keys to `en.ts`/`es.ts`; decide each widget's primitive (reuse / extend /
  inline). Only this phase touches `globals.css`, i18n, and `bigram/*` primitives.
- **Phase 1 · Per-widget agents (parallel, disjoint `.tsx`):** each gets the FULL v10 `mount<X>` + `.bw-<x>`
  CSS + its dossier below + the faithful-port mandate. One file each.
- **Phase 2 · Browser-validation gate (per widget):** render at `/lab/bigram` (both themes + reduced-motion),
  diff behaviour/layout/copy against v10. Not done until it matches.

Disjoint-file rule: widget agents never edit shared files in parallel. No silent scope cuts — report, don't substitute.

---

## Shared-primitive decisions (Phase 0)

| Primitive | Current | Decision |
|---|---|---|
| `bigram/HonestBar.tsx` | v8 `.barrow` (src→dst pair, glint, 12px, % fixed-axis) | Keep for honest-probability bars. **Do NOT** use for HeroAutoComplete (dst-only) or Corpus (integer counts). Build those rows inline / new primitive. |
| `bigram/PairChip.tsx` | v8 lens-era pill | Needs heartbeat (`just-rep`/`pop`) + v10 geometry to serve PairHighlighter; verify before reuse. |
| `bigram/Verdict.tsx` | sage verdict panel | Reuse as-is for Corpus (matches `.bw-corpus__verdict` 1:1). |

---

## Gap dossiers (the 4 already-touched widgets → v10)

### 1 · HeroAutoComplete (`bw-auto` / `mountAuto`)
**Status:** faithful **v8** port (pair-row + glint), must become v10 dst-only row.
**v10 target:** AXIS=0.50 (`w=min(100,(p/0.5)*100)`); winner-last cascade `delay=(n-1-i)*110 + (fresh&&!initial?220:0)`;
count-up 620ms easeOutCubic, pct strips trailing `.0` + ` %`; **flyLetter** input→`.bw-auto__row.top .bw-auto__rg`
(560ms `cubic-bezier(.16,1,.3,1)`, fresh non-initial only); initial state `input="e"` pre-filled; row = grid
`74px 1fr auto`, label = **predicted dst only** (winner dst `--bigram-accent` wt700), track **9px** `--bigram-r-pill`
bg `color-mix(ink 8%)`, fill `--accent-2`/winner `--accent-bright`, **no glint**; value mono 13px `min-w 3.6em`.
**Port:** build row inline (don't reuse HonestBar); boot `"e"`; fix pct format; add flyLetter via portal ghost +
`useLayoutEffect` measure; remove glint; reduced-motion drops fly/pulse/count-up.

### 2 · PredictionChallenge (`bw-game` → **`bw-reto`**) — REWRITE
**Status:** still v8 `bw-game` ("beat the model" + confetti). v10 is a different concept.
**v10 target (`bw-reto`):** instinct-first (runs *before* the model is explained); round model
`{ctx[], options:[{c,n}], exp}` with `answer = argmax(n)` (real counts e.g. th→e:472, q→u:388); centered mono
`.fragment` with `.ch` (last `.lead`) + `.blank` = underline + `·` slot (no box, no `?`); on reveal the slot
shows the letter and the underline turns `--accent`(lit)/`--wrong`(miss); **letter flies chosen→blank** (correct
only: capture glyph rect → re-render → measure blank → portal ghost animate 340ms); **instant reveal** (no delay
timer); **boxless** feedback (mono `✓ Tu instinto acertó` / `Casi — lo más natural es «x»` + serif `.exp`);
dots current elongates to 26px; **score hidden until done**; done screen = `.tally`"Tu instinto" → big `.figure`
`s de total` → 4-tier italic `.headline` (native-reader…) → serif `.thesis` (pivot: "¿cómo le enseñamos esto a
una máquina?") → restart; **single `spark()` finale** (N=12, 22 if ≥4), not per-answer confetti; keys 1–4 / Enter
(no Space), phase-gated. **Port = full rewrite** as a state machine `{idx,phase,picked,landed,score}`. Hardest part:
fly-into-blank + instant reveal (portal ghost + `useLayoutEffect`, not `layoutId` — choices unmount). New i18n keys.

### 3 · PairHighlighter (`bw-pairs` / `mountPairs`)
**Status:** rebuilt the v8 **sliding lens** (the thing v10 deleted). Must switch to in-sentence hot1/hot2 + heartbeat.
**v10 target:** **delete the lens** (no `getBoundingClientRect`/ResizeObserver); current pair shown IN the sentence:
`hot1` origin (filled `--accent`, `--on-accent`, wt700, radius 10) + `hot2` next (`--accent-soft` bg + inset 2px
accent ring + `--accent-ink`); `done`/`ahead` states; "Par actual" line (`primera vez` / `visto N× · ¡se repite!`);
tally pills in appearance order, `rep` tint when n≥2, **`just-rep` whole-pill heartbeat** (`bwPairCelebrate` 1→1.2→.97→1
.64s) at the 1→2 instant + `.n.pop` bounce on the current pair; count header (no border); summary names repeats with
`×N`; controls incl. **"Contar el resto →"** (missing); DEFAULT text **`"the other"`**; space glyph **`␣`**;
custom maxLength **18**.
**Port:** remove lens + all geometry; add hot1/hot2 to the char map; add `freshPair` flag (ref bumped on advance,
cleared on re-render) to drive `just-rep`/`pop`; add "Contar el resto"; fix default/glyph/maxLength/`×N`; reduced-motion
disables the beats. `PairChip` likely needs heartbeat hooks — read it first.

### 4 · CorpusCountingIdea (`bw-corpus` / `mountCorpus`)
**Status:** logic faithful, but **wrong CORPUS string** and **HonestBar with wrong semantics**.
**v10 target (bw-corpus was unchanged v8→v10 except `disp(" ")`→`␣`):** CORPUS = `"the cat sat on the mat the rat ate
the fat hat"` (exact 45 ch); `CHARS=["t","a","e","h","s"," "]`; char picker `.on`; auto-scan `DELAY=950`, first step
`700ms`, pause→manual; big centered scanned sentence (hot1/hot2/past; spaces rendered literal `" "`, not `␣`);
statusline banner (pair · "Coincidencia X de Y" · Pausar/Siguiente); **count bars = integer count `n`, width
`n/max*100` (max-normalized), 6px track, 60px label, `.pop` every step, live `top` winner**; "Total de pares" block;
final **Verdict** ("La apuesta del modelo · después de X lo más probable es Y · n de tot · pct` %`") + italic `.rv`
coda + "↻ Escanear de nuevo".
**Port:** restore exact CORPUS + 700ms; **replace HonestBar** with a count-row (integer, max-normalized, 6px, per-step
pop, live winner) — new local primitive or HonestBar `mode="count"`; re-add Total block + `.rv` coda; reuse `Verdict`
as-is; keep the timeout-driven scan shape (don't move setState into a render effect). i18n keys exist.

---

## Next wave — the OTHER widgets (after the 4 reach v10)

Same protocol; these have no vanilla prototype, so apply the v10 **design language** (tokens, fill-not-border states,
typography-first, honest bars, sage verdicts, hot1/hot2 idioms, premium motion) and the visualizer quality bar.
Free-lab + narrative bigram widgets to upgrade (pre-pass groups them by shared primitive/file):
`ModelHero`, `InferenceConsole`, `StepwisePrediction`, `GenerationPlayground`, `ArchitectureDeepDive`,
`HistoricalContextPanel`, `DatasetExplorerModal`, `BigramMatrixBuilder`(+Parts), `TinyMatrixExample`,
`TransitionMatrix` (accent="bigram"), `StorageProblemVisualizer`, `NormalizationVisualizer`,
`PredictionQueryVisualizer`, `SamplingMechanismVisualizer`, `ContextBlindnessDemo`, `BigramDiagramExperience`.

---

## Per-agent prompt template (Phase 1)

> READ the FULL v10 source for **<Widget>**: `bigram-widgets-v10.js` → `mount<X>`, and `styles-v10.css` → `.bw-<x>*`
> + `:root`. Your job is a **faithful PORT** of v10 into `<path>.tsx`, not a reinterpretation. Copy exact data,
> timings, class anatomy, copy. Use `--bigram-*` tokens (1:1 with v10 `:root`). Primitive decision: <reuse/inline>.
> Do NOT touch shared files (globals/i18n/other primitives) — those are done in the pre-pass. After editing, RENDER
> at `/lab/bigram` (both themes + reduced-motion) and diff against v10; list any gap you could not close (report,
> don't substitute). Deliver the dossier checklist fully satisfied.
