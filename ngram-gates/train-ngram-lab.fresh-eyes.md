# Fresh-eyes (blind) — TrainNgramLab (`ng-train`) · 2026-06-10

**Scope:** lightweight bench gate for the standalone playground (NOT yet in the narrative). The full §8
ladder (3-lens judge panel, zero-defect rebuild loop) runs when this widget enters the chapter.

**Protocol:** blind Sonnet agent, screenshots ONLY (10 captures: every stage incl. the backoff dead-end,
both themes, scripted real browser at 1440×1100), context = "one standalone interactive page from a
Spanish-language educational web app", lesson never named. Orchestrator triaged each defect against the
native-resolution captures and the live DOM.

## The spec's hero
Same journey as the bigram twin but the MEMORY (k = 1…5) is yours to choose; the table can no longer be
drawn whole, so the exploration is sparse and honest: distinct-rows counter + coverage bar vs 27^k, row
search with «fila vacía» dead ends, and VISIBLE k→1→0 backoff while writing.

## Reviewer's blind derivation (verbatim, key parts)

> **A)** "This page lets you paste or load any text and then trains a language model (n-gram) on it in
> front of you, showing how many word combinations it memorized and letting you use that memory to
> generate new text one letter or word at a time."
>
> **C)** "The page reads through a text, and for every group of N words or letters it sees, it records
> what tends to come next. The big number is the count of unique combinations ('keys') the model
> memorized from the text. […] The horizontal golden bar under the main number — I honestly do not know
> what it encodes."

**Comprehension: training + memory-of-N + memorized-rows + generation all derived blind — the core
landed. The coverage bar's meaning did NOT land from the downscaled capture** (its caption "3.859 de
19.683 filas posibles · 19,6%" exists directly beneath it and is legible at native scale — DOM-verified —
but the association deserves a watch when the chapter narrative frames it). **PASS with one watch item.**

## Defect triage (15 items)

**Real → FIXED now:**
- es/en number-format collision in percentages (same fix as the bigram twin): `fmtPct(x, language)`
  everywhere a % renders (search row, pick readout, dice tooltips); thousands via `toLocaleString`.

**Watch item (not a bench fail; revisit at narrative integration):**
- (#2/C) the coverage bar's meaning relies on its one-line caption. In the chapter, the narrative body
  before the widget will carry "27^k filas posibles" — verify then that the bar reads on its own; if not,
  bind the % into the bar itself.

**Resolution artifacts (verified legible/present at native scale, reviewer saw ~25% downscale):** #1
("FILAS CON DATOS (4-GRAMA)" label exists), #3 ("LETRAS DE MEMORIA" + per-pill names + live "27^k filas
posibles" readout exist), #4, #5 ("LAS FILAS MÁS VISTAS" caption exists), #6/#7 (kit 9-10px axis/segment
glyphs — chapter standard), #8 (the note literally reads "fila vacía → memoria recortada a 1"), #10 (the
counter reads "{n} caracteres · hasta {cap}"), #12, #14.

**By design:** #9 amber-on-cream contrast (chapter tokens, same ramp as every ngram widget), #11 ghost
"saltar al final" (kit affordance), #13 the "garbled" output was the test's deliberately-impossible seed
(«xqzwk») shown honestly, #15 no standalone heading (kit hard gate: framing lives in the narrative BODY).

## Verdict
**PASS (bench scope)** — core lesson derived blind; 1 real defect fixed; 1 watch item recorded for the
narrative pass. Re-run the FULL gate ladder before integration.
