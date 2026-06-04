# n-gram widget gate log (fresh-eyes loop)

Durable record of the blind fresh-eyes review loop (per `method-failure-book.md` §4b). Each widget is captured
at `/lab/bench?w=<slug>&bare=1` and judged by an agent that never saw the design. **Loop until no critiques.**

## Round 1 — COMPLETE (all 12 gated). Verdict: every widget had real issues (the loop working).
Recurring theme: **the ONE idea must be SHOWN by the interaction, not stated in a caption, and the right
HERO must dominate in a still.** Round-2 fixes delegated to Opus.

| Widget (slug) | Round-1 critique (blind) | Round-2 fix (delegated/applied) | Re-gate |
|---|---|---|---|
| WidenWindow (ng-widen) | % hero ok, phrase too small, "one letter" odd, % = confidence unclear | ✅ applied: phrase 20-30px, framed memory window, bar %s, "lo segura que está" label | ⏳ |
| SplitTheRow (ng-split) | tally "27" too quiet vs row-wall | ✅ applied (Opus): huge count-up hero + pulse, staggered pour, wall dimmed | ⏳ |
| WriteFromMatrix (ng-write) | 3 things shout (table-size/row/bars) | ✅ applied (Opus): lookup ROW lifted as sole hero, ghost table backdrop, bars secondary | ⏳ |
| GrowingTable (ng-grow) | still looks same 700 vs 19k (dot-haze) | ✅ applied (Opus): real row-strips, height ramp, "+530.981 filas más" spill | ⏳ |
| LookWhatYouBuilt (ng-built) | columns rendered EMPTY | ✅ applied: mounts with a result (runId=1), reduced-motion populates; bench autoplay fixed | ⏳ |
| AmnesiaReplay (ng-amnesia) | collapse stated not felt; 2 heroes; chrome noise | ✅ applied (Opus r2): 3 paths MERGE into one giant «e», heads drop away on toggle, count chrome demoted to footnote | ⏳ re-gate |
| RowSharpens (ng-sharpen) | 2 rows not tied; "more context=sharper" captioned not shown | 🔧 Opus r2 (settling): ONE interaction — adding a letter MORPHS spread→sharp; drop square-row noise | ⏳ |
| ExplosionZoom (ng-zoom) | 729 reads tiny, no zoom-INTO-cell, size NOT felt | ✅ applied (Opus r2): recursive grid bleeding off-frame, starts mid-explosion ×729→×387M, descent=hero. tsc clean | ⏳ re-gate |
| BookFirehose (ng-firehose) | bars are the lesson but the counter shouts louder | ✅ applied (Opus r2): 4 fill-bars = single central hero, torrent → faint backdrop, counter → small ticker. tsc clean | ⏳ re-gate |
| MuteSlot (ng-mute) | never SHOWS the mute; breakage is a statistic | 🔧 Opus r2 (running): auto-demonstrate the confident→mute collapse as hero | ⏳ |
| Progression (ng-progress) | 3 equal cards, climb told not seen | 🔧 Opus: card 3 the hero (bigger/brighter/lifted), fade card-1 gibberish | ⏳ |
| BigModelLimit (ng-limit) | "far apart" text-only; EN/ES clash; card overlap | 🔧 Opus: make gato/perro spatially FAR apart (vs close pair); fix overlap | ⏳ |

## Systemic learnings (apply to all)
- Captures MUST be `?bare=1` + reduced-motion (`_shotp.sh`, unique chrome profiles → parallel-safe).
- Bench autoplay clicks the PRIMARY action (regex), not the first button.
- **Recurring fix theme:** the right hero must DOMINATE in a still; the idea must be SHOWN by the interaction,
  never captioned; scale must change the PICTURE, not just the number.

## Pending after the loop converges
- Re-gate all (both themes) until no critiques.
- **Fix `BookFirehose.tsx:257` tsc error** (`boolean | null`) — build-breaking.
- Port copy → `es.ts`/`en.ts` `ngramNarrative.v3.*`; rewrite `NgramNarrative.tsx` to the 12 beats (drop v1).
- Regenerate mirror + FLOW GATE; regression bigram/transformers; full `tsc` + `eslint` = 0; `ngram-changelog.md`.

---

## Round 3 — STRICT Opus reviewers + USABILITY gate (user: "más estricto, no PASS hasta perfecto; que lo USEN; captura todos los estados")
The strict Opus bar (default REWORK; PASS only if flawless for a stranger) flipped **all** the soft PASSes —
real polish issues every time. Recurring strict themes across widgets:
- **ONE hero** — kill competing focal points (redundant numbers, two controls, two equal charts).
- **SHOW the idea, don't caption/label it** (the multiply, the climb, the collapse must be visible pre-literately).
- **Wasted empty space** (~60% empty bottoms) + control affordance (selectors look like text, not tappable).
- **Contrast/polish** (muddy, low-contrast) + glyphs (space "␣") + EN-vs-ES note (EN text = the corpus/model
  output; kept, but framed as machine output).
Round-3 strict fixes delegated to Opus for all 12. **New: USABILITY/FUNCTIONAL gate** — capture MULTIPLE
interacted states via `?play=1&clicks=N` (use it, not just initial), reviewer checks it WORKS + is operable +
teaches at each state. Loop until strict PASS on all.
