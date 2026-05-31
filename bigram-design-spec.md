# Bigram Chapter — Canonical Design Spec (editorial-green, v8)

> Source of truth for the Bigram redesign. Every downstream agent reads this. Derived verbatim
> from `styles-v8.css` / `bigram-widgets-v8.js` and the approved plan. Bigram = **editorial-green**;
> cyan stays with Transformers. Aesthetic = v8, one notch more premium (finish, not more elements).

---

## 1. Tokens — `--bigram-*` (verbatim from styles-v8.css)

Add an **additive** scope `[data-bigram-theme="dark"]` / `[data-bigram-theme="light"]` in `globals.css`
(after the existing `[data-lab-theme]` blocks; never edit those). Values copied verbatim.

### `[data-bigram-theme="dark"]` (default)
```css
[data-bigram-theme="dark"] {
  --bigram-bg-2:         oklch(0.138 0.014 195);
  --bigram-bg:           oklch(0.176 0.016 193);
  --bigram-surface:      oklch(0.223 0.018 193);
  --bigram-elev:         oklch(0.265 0.020 193);
  --bigram-rule:         oklch(0.99 0.02 195 / 10%);
  --bigram-rule-2:       oklch(0.99 0.03 195 / 18%);
  --bigram-ink:          oklch(0.94 0.012 85);
  --bigram-ink-2:        oklch(0.86 0.012 85);
  --bigram-body:         oklch(0.82 0.013 88);
  --bigram-muted:        oklch(0.73 0.012 90);
  --bigram-dim:          oklch(0.62 0.010 95);
  --bigram-accent:       oklch(0.70 0.148 164);
  --bigram-accent-2:     oklch(0.60 0.132 166);
  --bigram-accent-deep:  oklch(0.48 0.108 167);
  --bigram-accent-bright:oklch(0.78 0.142 167);
  --bigram-accent-ink:   oklch(0.72 0.152 163);
  --bigram-accent-soft:  oklch(0.70 0.148 164 / 16%);
  --bigram-on-accent:    oklch(0.16 0.03 165);
  --bigram-sage:         oklch(0.82 0.062 152);
  --bigram-sage-soft:    oklch(0.82 0.062 152 / 13%);
  --bigram-wrong:        oklch(0.70 0.135 38);
  --bigram-wrong-soft:   oklch(0.70 0.135 38 / 16%);
  --bigram-r-sm:  8px;
  --bigram-r-md:  12px;
  --bigram-r-lg:  16px;
  --bigram-r-pill: 999px;
}
```

### `[data-bigram-theme="light"]`
```css
[data-bigram-theme="light"] {
  --bigram-bg:           #f4ecd8;
  --bigram-bg-2:         #efe5cd;
  --bigram-elev:         #f9f3e4;
  --bigram-surface:      #faf5e8;
  --bigram-ink:          #20271f;
  --bigram-ink-2:        #3c463a;
  --bigram-body:         oklch(0.43 0.013 145);
  --bigram-muted:        #5e6b5b;
  --bigram-dim:          #8d9684;
  --bigram-rule:         #ded3b9;
  --bigram-rule-2:       #d2c6a8;
  --bigram-accent:       #305a3d;
  --bigram-accent-2:     #3d6e4c;
  --bigram-accent-deep:  #234430;
  --bigram-accent-bright:#3f7250;
  --bigram-accent-ink:   #274d35;
  --bigram-accent-soft:  #e4ecdb;
  --bigram-on-accent:    #f7f1e2;
  --bigram-sage:         #4a6b4f;
  --bigram-sage-soft:    oklch(0.55 0.055 150 / 14%);
  --bigram-wrong:        #b1492f;
  --bigram-wrong-soft:   #eedacf;
  --bigram-r-sm:  8px;
  --bigram-r-md:  12px;
  --bigram-r-lg:  16px;
  --bigram-r-pill: 999px;
}
```

### Fonts (reuse existing registrations — add nothing)
- Titles / display / section numerals: `var(--font-playfair)`
- Body + UI: `var(--font-source-serif)`
- Data / labels / numbers: `var(--font-jetbrains-mono)`

---

## 2. `@theme inline` bridge — add to existing block (globals.css ~line 7)

Maps `--color-bigram-*` → `var(--bigram-*)` so Tailwind generates `bg-bigram-*` / `text-bigram-*` /
`border-bigram-*`. Keep `var(--bigram-*)` (not raw values) so the utilities follow the theme scope.

```css
--color-bigram-bg:            var(--bigram-bg);
--color-bigram-bg-2:          var(--bigram-bg-2);
--color-bigram-surface:       var(--bigram-surface);
--color-bigram-elev:          var(--bigram-elev);
--color-bigram-ink:           var(--bigram-ink);
--color-bigram-ink-2:         var(--bigram-ink-2);
--color-bigram-body:          var(--bigram-body);
--color-bigram-muted:         var(--bigram-muted);
--color-bigram-dim:           var(--bigram-dim);
--color-bigram-accent:        var(--bigram-accent);
--color-bigram-accent-2:      var(--bigram-accent-2);
--color-bigram-accent-bright: var(--bigram-accent-bright);
--color-bigram-accent-ink:    var(--bigram-accent-ink);
--color-bigram-sage:          var(--bigram-sage);
--color-bigram-wrong:         var(--bigram-wrong);
```

---

## 3. Scoping rule (no regressions)

- All Bigram color lives **under `[data-bigram-theme]`** (set on the chapter content wrapper from
  `useLabTheme()`), or behind an opt-in `accent="bigram"` prop. Never replace an existing accent value.
- **Never touch `[data-lab-theme]`**, `--lab-*`, `--ls-*`, or shadcn `--accent`. `LabShell` chrome stays.
- Other chapters stay their own color: **Transformers = cyan**; ngram / mlp / neural-networks keep theirs.
- Bigram content uses `--bigram-bg` / `-surface` / `-elev` for figure bodies — never `--lab-viz-bg`.

---

## 4. Typography scale

| Role | Family | Size / weight |
|---|---|---|
| Hero (editorial) | Playfair | `clamp(46px,7vw,92px)`, 600; accent span italic 500 |
| Section `h2` | Playfair | `clamp(34px,4.8vw,52px)`, 600, lh 1.08 |
| Lead paragraph | Source Serif | `clamp(22px,2.3vw,27px)`, 400, lh 1.45, color `ink-2` |
| Body | Source Serif | 20.5px base, lh 1.7, color `body` |
| Pullquote | Playfair | `clamp(26px,3.2vw,38px)`, 600 |
| Section numeral | Playfair italic | 22px, color `accent` |
| Labels / data / `%` | JetBrains Mono | 10.5–14px, `letter-spacing .14–.22em`, uppercase, `tabular-nums` |

Inline emphasis: `.hl` = `accent-ink` italic 500; `.emph` = `ink-2` 500 (weight, no color); `.term` = dashed `accent-2` underline.

---

## 5. v8 widget / layout vocabulary

- **Section label** — italic Playfair numeral (accent) + mono uppercase label + hairline `rule` line. No box.
- **Pullquote** — left border `3px accent`, Playfair, no quotes chrome.
- **Callout** — `surface` panel, `rule-2` border, `r-md`; mono accent title with a 6px accent dot.
- **Takeaway** — **SAGE** voice: `linear-gradient(135deg, sage-soft, transparent 82%)`, sage border, `r-lg`,
  mono sage label. This is editorial insight — distinct from interactive emerald.
- **Formula block** — `bg-2` well, `rule-2`, `r-md`, centered; equation in mono accent, caption mono muted.
- **Editorial figure** — `[data-console="figure"]`: NO frame, NO chrome, **NO traffic-light dots** (`.dots`
  removed). Label = numbered mono, no underline. Demo body = a single faint plane
  (`color-mix(surface 55%, bg)`), no border/shadow. One signal that "this is interactive."
- **Honest FIXED-axis bar** (`.barrow`) — `AXIS = 0.50`; track is the whole axis, partial fill shows model
  uncertainty (never normalize to 100%). `barW(p) = min(100, p/AXIS*100)`. Winner is `.top` (brighter
  `accent-bright`), fills **last** (winner-last cascade), sweeps a **glint**, value **counts up** (easeOutCubic
  ~620ms). Label = pair `src→dst` (src dim, arrow dim, dst bold ink).
- **Sliding lens** — ONE persistent `sage-soft` lens that slides pair→pair (measured from active spans),
  not a per-char redraw. First appearance: no sweep (transition off, then on).
- **Segmented control** — sunken `bg-2` rail, `r-md`, inset shadow; active cell filled `accent` with soft glow.
- **Plain-language verdict** — sage panel "After X, the most likely is Y" (see `Verdict` primitive §6).
- **Single accent rule** — collapse the old emerald / violet / amber section accents into **one** bigram
  accent. `LabSectionHeader` gets an `accent="bigram"` entry; the 3 `page.tsx` calls switch to it.

---

## 6. New shared primitives — `src/features/lab/components/bigram/`

Token-only (no business logic). Consumers must match these prop names exactly.

### `HonestBar.tsx`
```ts
interface HonestBarProps {
  src: string;            // origin char ("q"); " " renders as ␣ and adds .space styling
  dst: string;            // destination char ("u")
  value: number;          // probability 0..1 (NOT a percentage)
  axis?: number;          // fixed axis denominator, default 0.5
  top?: boolean;          // winner row — brighter fill + emphasized dst
  glint?: boolean;        // run the glint sweep on fill (default true; suppressed if reduced-motion)
  countUp?: boolean;      // animate value 0→target, easeOutCubic ~620ms (default true)
  ariaLabel?: string;     // overrides default "src followed by dst, NN%"
}
```
Behavior: fill width = `min(100, value/axis*100)%`; transition `width .6s cubic-bezier(.2,.7,.2,1)`;
displayed value `(value*100).toFixed(1)` with thin space + `%`; respects `prefers-reduced-motion`
(no glint/count-up, final state shown instantly). The most reused primitive (HeroAutoComplete,
CorpusCountingIdea, InferenceConsole, StepwisePrediction).

### `PairChip.tsx`
```ts
interface PairChipProps {
  src: string;            // origin char
  dst: string;            // destination char
  count: number;          // occurrences; rendered in the disc
  repeated?: boolean;     // count >= 2 → accent-tinted pill + on-accent disc (pattern pops)
}
```
Behavior: pill (`r-pill`) with `src→dst` (mono) left, count disc right. `repeated` tints the whole pill
`accent-soft` + inset accent ring; disc becomes `accent` / `on-accent`.

### `Verdict.tsx`
```ts
interface VerdictProps {
  label: string;          // mono sage eyebrow, e.g. "The model's bet"
  main: React.ReactNode;  // serif sentence, e.g. After "<b>t</b>", the most likely is "<b>h</b>".
  sub: string;            // mono muted detail, e.g. "5 of 7 times · 71%"
}
```
Behavior: sage panel — `linear-gradient(135deg, sage-soft, transparent 82%)`, inset sage ring, `r-md`,
centered column. May alternatively ship as `variant="verdict"` of `KeyTakeaway` if it fits cleanly.

---

## 7. Visualizer Quality Protocol (the mandatory bar)

Every new/redesigned visualizer must clear this bar — **flagship: simple in appearance, sophisticated underneath.**

- **Execution** — work strictly step by step; focus only on the current task; decompose the complex; re-read
  the task before implementing; correctness + clarity + design quality over speed; never shallow fixes.
- **Design objective** — React + TS + Framer Motion that feels visually simple, conceptually crystal-clear,
  premium, smooth, elegant; obsessive detail. Refs: Apple product films, editorial premium, luxury edu tools.
- **Primary goal** — teach exactly **ONE** concept extremely well; understood almost instantly.
- **Philosophy** — simple surface / deep execution; strong hierarchy; **typography-first**; minimal chrome;
  smooth transitions; premium motion; dark-mode elegance; calm, confident layout; **one focal point at a time**.
- **Engineering** — Framer Motion only where it adds; responsive; no horizontal scroll; production-ready, clean structure.
- **Avoid** — neon overload, noisy UIs, dashboard layouts, too many borders/cards, default charts, label
  excess, hacky interactions, generic patterns, competing ideas.
- **Interaction** — direct manipulation; hover/tap reveals meaning; **motion that EXPLAINS, never decorates**;
  glows/panels/connectors subtle and secondary; use the project token system (editorial-green for Bigram).
- **Motion budget is NOT limited** — spring, smooth transitions, even canvas are welcome where they elevate the
  idea. The limit is **visual cleanliness**, not animation count.
- **Output** — (1) design direction (5–10 bullets), (2) interaction model (3–6 bullets), (3) implementation,
  (4) ambitious solution, (5) ~300+ lines of considered code, (6) no superficial patches.

---

## 8. New i18n keys to ADD (narrative copy unchanged)

Exact nesting confirmed in `src/i18n/en.ts` and `src/i18n/es.ts`: the slide-lens block lives under
`bigramNarrative.pairHighlighter` and the verdict under `bigramNarrative.corpusCounting` (NOT `bigramWidgets.*`).
Add these alongside the existing keys in both files.

### `bigramNarrative.pairHighlighter.*`
| Key | English | Spanish |
|---|---|---|
| `currentPairLabel` | `Current pair` | `Par actual` |
| `firstTime` | `first time` | `primera vez` |
| `seenRepeats` | `seen {n}× · it repeats!` | `visto {n}× · ¡se repite!` |
| `patternLabel` | `The pattern` | `El patrón` |
| `patternRepeats` | `these pairs appear more than once:` | `estos pares aparecen más de una vez:` |
| `patternUnique` | `almost everything is unique here — try a longer phrase to watch it emerge.` | `casi todo es único aquí — prueba una frase más larga para verlo emerger.` |

### `bigramNarrative.corpusCounting.*`
| Key | English | Spanish |
|---|---|---|
| `verdictLabel` | `The model's bet` | `La apuesta del modelo` |
| `verdictMain` | `After "{char}", the most likely is "{best}".` | `Después de "{char}", lo más probable es "{best}".` |
| `verdictSub` | `{n} of {total} times · {pct}` | `{n} de {total} veces · {pct}` |

Placeholders are literal tokens: `{n}`, `{char}`, `{best}`, `{total}`, `{pct}`. Existing narrative copy keys
in these two blocks are **not changed**.
