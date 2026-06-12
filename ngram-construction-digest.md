# N-gram construction + quality digest

A dense, runnable checklist for **verifying n-gram visualizers** and **briefing builder agents**. Distilled from
`CLAUDE.md`, `method-failure-book.md`, `narrative-guidelines.md`, `bigram-design-spec.md`,
`docs/bigram-motion-bible.md`, and both `kit/AGENTS.md`. Those files win on any conflict; this is the cheat sheet.

Accent: **amber** (`--ngram-*`), scoped under `[data-ngram-theme="dark"|"light"]`. Never mix accents. Never touch
`--lab-*` / `--bigram-*`. The bigram §1/§2 widgets + the ngram kit are the aesthetic baseline.

> The single sentence: **you cannot grade your own legibility — ask someone who doesn't already know the answer.**

---

## 1 · The 5-second / fresh-eyes test (the keystone gate)

**Protocol** (`method-failure-book.md` §8, binding contract):
- **Screenshots only, never the `.tsx`.** Seeing the code = reverse-engineering intent = no longer a user.
- **A SUB-AGENT (fresh context = blind), Sonnet is fine.** Independence is the lever, not the model tier.
- **Context = ONLY the narrative that PRECEDES the widget** (what a reader already knows on arrival). The prompt
  **NEVER** names: what it teaches, the hero, the key number, "look for X", the `<Figure label>`, or the intent
  comment. If the prompt leaks the lesson → invalid gate, redo it. A fixed template with no "the idea is…" field.
- **One capture per STATE**: initial + each interaction (`clicks=1..N`) + each tab/mode + **BOTH themes**. Missing
  a state ⇒ the gate **cannot** PASS. Capture the control that actually teaches (if a tab/selector teaches, the
  auto-click on the primary button won't exercise it).
- **`bare=1`** so there's no chrome. Everything visible is the product — forbidden to excuse anything as "bench chrome".

**The questions the blind reviewer answers (free text, saved verbatim):**
1. What is this and what do I do FIRST? (entry point: which button / what to hover/read)
2. What's the important thing — the **hero**? (name it unprompted)
3. If complex, does it take me by the hand? (press this → watch this number → now this)
4. What competes / gets in the way?

**Pass / fail:**
- **PASS** = in ~5s the stranger knows **what to DO** and **what MATTERS**, and **names the hero unprompted**. A
  complex idea may then unfold through guided steps — that's allowed, *if* the widget guides.
- **FAIL** = doesn't know where to start · hero hidden/competing · the orchestrator's intended idea ≠ the
  reviewer's derived lesson (the orchestrator does this comparison, not the reviewer).
- **§9 trap:** if the widget only makes sense **with the surrounding prose**, it FAILS. The widget must do its job
  alone; the caption is not allowed to be what saves it. Show > tell.
- **Zero defects = PASS.** No "PASS with minor polish". Any defect listed ⇒ REWORK.
- **Ignore capture artifacts** (false-REWORK source): empty page background BELOW the widget (fixed-height capture,
  prose follows on the real page — judge dead space only INSIDE the widget frame); the Next.js dev badge
  ("N"/"Compiling…"); English output text (the corpus is real, intentional); number jumps between states (some
  buttons re-roll — judge each state's clarity, not monotonic progression).

**Artifact (no file = not done):** `ngram-gates/<slug>.fresh-eyes.md` — what was shown (screenshot paths), the
reviewer's RAW answer, the spec's hero string, PASS/FAIL.

---

## 2 · The judge panel (3 independent lenses — HERO widgets)

Ships only if **all three** pass with **zero** defects. Each is independent and blind to the others.

- **Child (no jargon):** Do you get it without any technical words? Is the one idea clear from the picture + one
  interaction? Confusion anywhere = fail.
- **Aesthetics / visual hierarchy:** Is the **hero what the eye hits FIRST**? Contrast, size, position, focal point,
  Gestalt all pointing at it? One focal point, no competing elements, premium/clean, both themes legible?
- **Teacher:** Is the ONE idea actually **taught AND DISCOVERED** (reader tries → feels → realizes), not **told**?
  Does scale read? Is the guess/predict genuinely hard? Does it hand off to the next beat?

**Proportional rigor:** the full panel + 5-directions + rebuild runs on the **2-3 declared HERO widgets** only
(declared up front in the blueprint — never demoted at grading time to dodge the panel). Simple/quiet widgets get
**only** the blind fresh-eyes 5s gate + the self-check checklist. Everything must be UNDERSTOOD.

---

## 3 · Hard gates (Bar v2) — each line kills one failure

- **Show SCALE, don't number it** — any big quantity (729 · 14M · "billones") ships with a magnitude visual that
  **changes with the number** (a grid that visibly GROWS, or a zoom/lens saying "you see 0.000…% of this"). *Kills:* a
  picture identical for 729 and 14M; a lone climbing number reads as "looks small".
- **Narrate, don't announce** — the body sets the scene and asks; the **reader discovers** the conclusion by touching.
  *Kills:* the narrator pre-states the verdict ("the table is empty", "it hits a wall") so the widget only illustrates a
  spoiler.
- **Construction must COST** — each level-up (bigram→trigram→…) repairs a failure the reader JUST felt; the reader
  *builds* the model with their hands. *Kills:* the model handed over free ("the key is just longer") so the win is unearned.
- **No stacked failures** — one honest wall after the celebrated win, never 3+ "look, another flaw" sections in a row.
  *Kills:* a flat, all-downhill emotional arc (v1's five failure beats vs. one win).
- **One focal point (one HERO)** — one thing dominates the eye; no two numbers / charts / controls competing.
  *Kills:* "two competing numbers (36/49)", tab clutter, dashboard feel.
- **Fit on screen by REMOVING, never shrinking the hero** — the hero is BIG with legible labels; secondary chrome
  (intros, clue lists, panels) may run past the fold. *Kills:* the matrix squeezed tiny to cram chrome onto one screen.
- **Statistics, not just color** — counts tick up as it fills; hover reveals a cell's count; the headline is a number.
  *Kills:* a heatmap that's color-only and says nothing.
- **Real interaction (GitHub-heatmap level)** — hover → pair + count; click → mark row/col + commit "x→y: N times"
  (and "never" honestly). *Kills:* a static "look at the colours" demo.
- **Ordered, followable build** — fill/grow alphabetically (for matrices), never random. *Kills:* cells lighting in no order.
- **Highlight actually highlights** — TEST any lens/search/highlight in the bench. *Kills:* a no-op highlight.
- **Readable pacing** — prefer manual user-driven "Siguiente" for teaching steps; auto mode dwells long enough to
  read (pace by text on each phase). *Kills:* "looks cool but I can't read it" / identical frames / a stuck step.
- **Predict/guess game must be genuinely HARD** — early context ambiguous, only LATE context forces the answer
  (e.g. "c… cu… cup… cupid… → o"). *Kills:* a case you nail from letter one, which proves nothing.
- **Minimal in-widget text** — NO baked-in eyebrow/heading/lead/intro; framing lives in the BODY prose. Inside keep
  ONLY functional text (button/axis/value labels, the honest readout). *Kills:* a widget duplicating the narrative above it.
- **Real data only** — counts/probabilities from `ngramData.ts` (counted over `SHAKESPEARE_TEXT`; n=2 validated vs.
  `bigramShakespeare27.MATRIX_27_COUNTS`). *Kills:* faked stats ("th→e 85%"), simulated fills.
- **Discover-don't-define** — §1 labels "1/2/3/4 letras de memoria", NOT "bigrama/trigrama/4-grama" (earned in the body
  AFTER). *Kills:* naming the term before the experience that wins it.

---

## 4 · The look (reuse these, don't guess)

### `--ngram-*` tokens (verbatim from `globals.css`)
Scope: `[data-ngram-theme="dark"]` (default) / `[data-ngram-theme="light"]`. Tailwind utilities `bg-ngram-*` /
`text-ngram-*` / `border-ngram-*` exist via `--color-ngram-*`. **Never** hardcode hex or use Tailwind `amber-*`.

| Role | token | dark | light |
|---|---|---|---|
| Deep bg / empty heat | `--ngram-bg-2` | `oklch(0.138 0.012 75)` | `#efe4c9` |
| Page bg | `--ngram-bg` | `oklch(0.176 0.014 72)` | `#f5ecd6` |
| Surface / elev | `--ngram-surface` / `--ngram-elev` | `oklch(0.223…)` / `oklch(0.265…)` | `#fbf6e6` / `#faf4e2` |
| Rules | `--ngram-rule` / `--ngram-rule-2` | `…/10%` / `…/18%` | `#e0d4b6` / `#d4c6a2` |
| Ink / ink-2 / body | `--ngram-ink` / `-ink-2` / `-body` | `0.94` / `0.86` / `0.82` L | `#28231a` / `#463f30` / `oklch(0.43…)` |
| Muted / dim | `--ngram-muted` / `--ngram-dim` | `0.73` / `0.62` L | `#6b6147` / `#756a4e` |
| **Accent (interactive/focus)** | `--ngram-accent` | `oklch(0.77 0.15 75)` | `#9a6a17` |
| Accent-2 / deep | `--ngram-accent-2` / `-deep` | `0.69…` / `0.55…` | `#b07d22` / `#7c5310` |
| **Accent-bright (hot/winner)** | `--ngram-accent-bright` | `oklch(0.84 0.158 80)` | `#c9901c` |
| Accent-ink (text on soft) | `--ngram-accent-ink` | `oklch(0.82 0.155 78)` | `#855a12` |
| Accent-soft (tints/badges) | `--ngram-accent-soft` | `…/16%` | `#f0e4c4` |
| On-accent (ink on solid accent) | `--ngram-on-accent` | `oklch(0.2 0.04 70)` | `#fdf7e8` |
| Sage (verdict/insight voice) | `--ngram-sage` / `-soft` | `oklch(0.82 0.05 100)` / `…13%` | `#7a6a3f` / `…14%` |
| Wrong (failure/robotic loop) | `--ngram-wrong` / `-soft` | `oklch(0.7 0.135 38)` / `…16%` | `#b1492f` / `#eedacf` |

**Radii:** `--ngram-r-sm 8px` · `-r-md 12px` · `-r-lg 16px` · `-r-pill 999px`.
**Fonts:** `--ngram-font-display` = Playfair (titles/numerals) · `--ngram-font-serif` = Source Serif (body/UI) ·
`--ngram-font-mono` = JetBrains Mono (data/labels/numbers, `tabular-nums`). In TS import `MONO`, `SERIF`, `DISPLAY`.
**Canvas** can't read CSS vars: `getComputedStyle(el).getPropertyValue("--ngram-accent")` once, re-read on
`data-ngram-theme` change (MutationObserver).

### Kit primitives (import from `@/features/lab/components/ngram/kit`; HonestBar/PairChip/Verdict from `../`)
A widget = **kit primitives + its one unique mechanic**. Reinventing a primitive = fail.

- `MONO` `SERIF` `DISPLAY` — font vars. `STD = [0.2,0.8,0.2,1]`. `SPRING_SNAP {stiffness:360,damping:30}`.
  `SPRING_SOFT {stiffness:180,damping:26}`.
- `displayChar(c)` → `" "` becomes `␣` (everywhere, always).
- `heat(p, floorPct=0)` → `0..1 → color` (empty=`bg-2`, hot=`accent-bright`, sqrt-lifted `pow(p,0.6)`). Dense
  matrices (27×27, 92×92) pass `floorPct ≈ 12–16` so weak cells still read; 1-row foreshadow uses floor 0.
- `MarkedText({ text, stateOf?, wordGroup=true, size?, lineHeight=1.55, maxWidth=540 })` — letter marking. States:
  `hot1` (filled accent chip), `hot2` (soft tint + ring), `cur`/`past`/`future`/`idle`. No motion of its own.
- `ParchmentReader({ text, windowStart, windowSize=200, head, hot1?, hot2?, progress?, reading?, markerLabel?, maxWidth=560 })`
  — masked scrolling real-text reader with cursor + in-place hot1/hot2. Caller owns the scan loop.
- `FixedAlphabetRow({ cols, counts, winner?, hoverIdx?, onHover?, onSelect?, max?, height=156, maxWidth=660, showHeat=true })`
  — N fixed slots (␣, a–z) that never reorder: bars + heat cells + labels on one grid. The bridge object to a matrix
  row. hover→reveal, `onSelect`→commit.
- `Readout({ label, char, value, className? })` — `LABEL · char(accent) · big climbing number(tabular-nums)`. Pass
  `value` raw (consumer owns the live count).
- `CountUpNumber({ value, format?, durationMs=620, delayMs?, … })` — one-shot 0→value (easeOutCubic, tabular-nums).
  For a continuously climbing live tally render the raw number in a `Readout`, NOT this.
- `Tabs({ tabs, active, onChange, ariaLabel? })` — pill segmented control (sunk `bg-2` rail, active cell filled accent).
- `PlayButton` / `GhostButton` (`{children, onClick?, disabled?, type?, "aria-label"?}`) — the ONLY two button shapes.
  Play = filled accent (the one action); Ghost = hollow accent text (secondary).
- `CaptionLine({ children, gap=18, align="center" })` — mono uppercase eyebrow. Never a heading.
- `HonestBar` / `PairChip` / `Verdict` — honest fixed-axis bar (fill = `min(100, value/axis*100)%`, never normalize to
  100%); pair chip (count disc, tints when repeated); sage closing verdict panel.

### Motion (`docs/bigram-motion-bible.md`) — don't invent easings
- **Reveal / fade-in:** `STD`, 0.42–0.6s. **Cascade entry:** `STD`, stagger 28–60ms (never all at once).
- **Snap to place (FLIP, dice drop, column born):** `SPRING_SNAP`. **Soft float/reposition:** `SPRING_SOFT`.
- **Number changes (micro-pop):** `scale:[1,1.3,1]`, 0.42s, `STD`. **Counting:** rAF + easeOutCubic, tabular-nums,
  the value *climbs*, never jumps; pop on close.
- **Heat:** one ramp via `heat()`; live cell warms with CSS `background .3s ease` (heat arrives, doesn't snap).
- **Scan/read idiom:** active char = `accent` bg + `on-accent` ink; counted follower = `accent-soft` + `accent-ink`;
  past = `dim` (sinks); future = `muted`. Cursor advances on a scanDelay (slow→blur).
- **Temperature, decide before building:** *quiet step* (most widgets — one focus, motion only on interaction, no
  verdict panel) vs *showpiece* (earns a PLAY, sustained multi-phase climax). A sweep ≈ 2s; no dead air.
- **Motion EXPLAINS, never decorates.** If it doesn't clarify an idea or transition, cut it.

### Reduced-motion contract (`useReducedMotion()` in every widget)
- Showpieces jump straight to the **final state** (full table / complete matrix / generated text) + caption — no scan,
  FLIP, or spins. Quiet steps: entries are instant fades; counts appear already at value. **No information lost** —
  the static end-state teaches the same as the animation.
- No synchronous `setState` in a `useEffect` body (keyed remount, or latest-closure refs + `setTimeout`/`rAF` whose
  callback sets state). `CountUpNumber` already does this correctly.

---

## 5 · Anti-noise checklist (never do)

- ❌ **Neon** / saturated glow overload. Amber is calm, not a highlighter.
- ❌ **Dashboard layouts** — no grids of stat cards, no control panels, no two-up comparisons that compete.
- ❌ **Excess borders / cards / chrome** — state is shown by **fill + typography**, not by piling on boxes. When in
  doubt, remove.
- ❌ **Default chart components** — build the exact visual the idea needs; never a stock bar/line chart.
- ❌ **Traffic-light "window dot" decorations** on figures (the `.dots` are removed by design).
- ❌ **Ugly/visible scrollbars** and horizontal scroll — no overflow; the hero fits the column.
- ❌ **Hardcoded colors** / Tailwind `amber-*` — tokens only (`--ngram-*` / kit). Radii + fonts are tokens too.
- ❌ **Baked-in eyebrow/lead inside a widget** (duplicates the body prose).
- ❌ **Multi-accent** — ONE amber accent (the old chapter mixed amber/cyan/emerald/violet/red; that's the bug).
- ❌ **Cryptic glyphs** — label `␣` = "espacio"; readable at normal brightness, nothing muddy / near-black-on-black.
- ❌ **Motion as filler** — spectacle over comprehension; if it doesn't explain, it's out.
