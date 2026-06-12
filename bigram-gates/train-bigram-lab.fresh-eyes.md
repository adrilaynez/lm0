# Fresh-eyes (blind) — TrainBigramLab (`bg-train`) · 2026-06-10

**Scope:** lightweight bench gate for the standalone playground (NOT yet in the narrative). The full §8
ladder (3-lens judge panel, zero-defect rebuild loop) runs when this widget enters the chapter.

**Protocol:** blind Sonnet agent, screenshots ONLY (12 captures: every stage/mode, both themes, taken with
a scripted real browser at 1440×1100), context = "one standalone interactive page from a Spanish-language
educational web app", lesson never named. Builder did not self-approve; orchestrator triaged each defect
against the native-resolution captures and the live DOM.

## The spec's hero
You feed it YOUR text → you WATCH the model read it (slow scan → ramp) while the 27×27 table heats up →
you explore the table → you write with it (solo / paso a paso with the loaded dice / tú eliges).

## Reviewer's blind derivation (verbatim, key parts)

> **A)** "This page lets you paste or load a text, trains a bigram (letter-pair frequency) model on it,
> then lets you generate new text character by character using the probabilities that model learned — so
> you can directly experience how a bigram language model 'writes'."
>
> **C)** "A bigram model works by counting every pair of consecutive letters in a text. That count becomes
> a table — rows are the current letter, columns are the next letter — and the brighter a cell, the more
> often that transition happened. To generate new text, you start with a letter and repeatedly pick the
> next letter based on those learned probabilities (either randomly weighted or by temperature, or chosen
> manually). The result is text that has some of the statistical 'feel' of the original — same common
> letter pairs — but is still gibberish because it only looks one step ahead."

**Comprehension: exact match with the intended lesson, derived blind. PASS.**

## Defect triage (20 items)

**Real → FIXED now:**
- (#14/#15) es number-format collision: "5.012 veces · 16.19" mixed the es thousands dot with a decimal
  dot → percentages now use the locale decimal ("16,2" in es) via `fmtPct(x, language)`; thousands already
  locale-aware (`toLocaleString`). Applied to inspector, pick readout and dice tooltips, both widgets.
- (#12) the solo-mode glimpse strip had no label → added the mono eyebrow «la fila que consulta»
  (`trainBigramLab.glimpseLabel`, es+en).

**Resolution artifacts (verified legible at native 1440px; reviewer saw ~25% downscale):** #1, #2, #6, #7
(fold report), #9, #11, #13 (kit 9px axis labels — chapter standard), #17, #19 (the "fiel ←→ caos" end
labels exist and answer the question). The strings the reviewer "couldn't find" (counter label, fold
report, tab labels, % unit) all exist in the DOM and were verified rendered.

**By design (chapter conventions):** #3 axis titles (the serif hint below the board explains rows/columns —
reviewer confirmed it legible; matches GrowingMatrix27), #5 English sample text (the corpus is never named
— chapter VOICE rule; the user pastes their own), #4/#11 ghost-button affordance (kit), #10 cell-ring
subtlety (GrowingMatrix27 idiom), #16 low-value heat floor (kit `heat` floor 14, motion-bible value),
#18 no standalone heading (kit hard gate: framing lives in the narrative BODY; bench is barer by design),
#20 char-level output (the output does contain real spaces; "broken-looking" gibberish IS the lesson and
the narrative will frame it).

## Verdict
**PASS (bench scope)** — blind comprehension exact; 2 real defects found and fixed same night; remainder
triaged as downscale artifacts or chapter-blessed conventions. Re-run the FULL gate ladder (judge panel,
zero-defect) before narrative integration.
