# Migration guide — porting chapters & pages to the MDX + i18n-namespace architecture

This is the step-by-step playbook for moving the **remaining** lab chapters
(MLP, Neural Networks, Transformer) and, later, the rest of the site onto the
architecture already shipped for **bigram** and **ngram**.

Read this once, then follow the checklist per chapter. The two reference
implementations are `BigramNarrative.tsx` + `src/content/lab/bigram.{es,en}.mdx`
(simple case) and `NgramNarrative.tsx` + `ngram.{es,en}.mdx` (figures + history).

---

## 0. The principle (why we do this)

Separate text by **TYPE**, not by feature:

| Text type | Where it lives | Read via |
|---|---|---|
| **UI strings** — labels, nav, buttons, CTAs, kickers, section names, tooltips, short single sentences of chrome | `src/i18n/locales/<ns>/{en,es}.ts` | `t('a.b.c')` |
| **Narrative prose** — the chapter story, paragraphs, leads | `src/content/lab/<chapter>.{es,en}.mdx` | static MDX import |

Why: `t()` returns strings only, which forced long prose to be sliced into
`p1`/`h1`/`p2` fragments with HTML-in-strings. MDX keeps a chapter readable and
editable as one document, with widgets embedded in reading order.

---

## 1. What already exists (reuse, do not rebuild)

- **`next.config.mjs`** — `@next/mdx` is wired (`createMDX`, plugins as string
  names for Turbopack, `pageExtensions` includes `md`/`mdx`). Nothing to change.
- **`src/types/mdx.d.ts`** — types `import X from "./foo.mdx"` as a component.
- **`src/features/lab/components/mdx/labMdxComponents.tsx`** — the factory that
  maps markdown → editorial primitives and exposes structural components +
  widgets. Call: `labMdxComponents(accent, widgets, labels?)`.
- **`src/features/lab/components/mdx/Plane.tsx`** — `Plane` (faint interactive
  panel) + `Stage` (bare lazy mount).
- **`src/features/lab/components/mdx/Expandable.tsx`** — collapsible aside.
- **i18n namespaces** — `src/i18n/locales/*`; barrels at `src/i18n/{en,es}.ts`.

### Components the MDX can use out of the box

Inside any `.mdx` rendered through `labMdxComponents`, these are in scope:

- Block markdown: `**bold**`, `*italic*`, paragraphs, `$inline math$` (KaTeX).
- `<Section id number label heading>…</Section>` — section wrapper. **The title
  is the `heading=` prop**, never a literal `<h2>` (see §4 gotcha).
- `<Break />` — thematic break (whitespace for bigram/ngram; never `<hr/>`).
- `<Lead>…</Lead>` — lead paragraph.
- `<Plane>…</Plane>` — widget on a faint panel. `<Stage>…</Stage>` — bare mount.
- `<Figure label hint>…</Figure>` — captioned figure (the ngram idiom).
- `<Expandable title kicker defaultOpen>…</Expandable>` — collapsible aside.
- `<PullQuote>`, `<FormulaBlock formula caption>`, `<KeyTakeaway>`,
  `<Callout title>`, `<Highlight tooltip>` — editorial extras.
- Any widget you pass in the `widgets` map (used as `<MyWidget />`).

---

## 2. Per-chapter checklist

Do ONE chapter at a time. Commit after each. Order of difficulty:
**Neural Networks → MLP → Transformer** (NN is the cleanest; Transformer is the
biggest at ~3.6k lines; MLP needs live-prop pre-binding).

### Step A — extract the exact prose (don't retype from memory)

The dictionaries are large; extract the real strings with esbuild so accents and
HTML survive verbatim:

```js
// _extract.mjs  (delete after)
import { build } from "esbuild";
import fs from "node:fs"; import path from "node:path"; import { pathToFileURL } from "node:url";
async function load(file, name){
  const out=path.resolve(`._t_${name}.mjs`);
  await build({entryPoints:[file],bundle:true,format:"esm",outfile:out,logLevel:"silent"});
  const m=await import(pathToFileURL(out).href+`?t=${Date.now()}`); fs.rmSync(out,{force:true}); return m[name];
}
const en=await load("src/i18n/en.ts","en"); const es=await load("src/i18n/es.ts","es");
// adjust the key for the chapter, e.g. neuralNetworkNarrative
fs.writeFileSync("_dump.json", JSON.stringify({ en: en.neuralNetworkNarrative, es: es.neuralNetworkNarrative }, null, 2));
```

Run `node _extract.mjs`, read `_dump.json`. Open the old `<Chapter>Narrative.tsx`
alongside it to get the **render order** of sections, prose keys and widgets.

### Step B — write the two MDX files

Create `src/content/lab/<chapter>.es.mdx` and `.en.mdx`. Mirror the old
component's section/widget order EXACTLY (same section IDs the side-rail expects).

- Each `<P html={t("…")} />` fragment → a normal markdown paragraph. **Recombine**
  `p1`+`h1`+`p2` splits into one readable sentence; turn the inline-emphasis
  fragments into `**bold**` / `*italic*`.
- Section heading → `<Section id="ch-01" number="01" label="…" heading="…">`.
- Widget → `<Plane><MyWidget /></Plane>` (or `<Figure label="…"><MyWidget /></Figure>`
  for the ngram caption style). Keep the same wrapper the old chapter used.
- Expandable history/aside → `<Expandable title="…" kicker="…">…</Expandable>`.
- Markdown comments: `{/* … */}` at the top documenting it's content, not UI.

### Step C — rewrite `<Chapter>Narrative.tsx` as a thin shell

Keep in TSX: the theme wrapper (if any), hero, side-rail, `ContinueToast`, CTA,
footer — they are UI and stay on `t()`. Replace the big `<Section>…</Section>`
body with:

```tsx
import ChapterEn from "@/content/lab/<chapter>.en.mdx";
import ChapterEs from "@/content/lab/<chapter>.es.mdx";
import { labMdxComponents } from "@/features/lab/components/mdx/labMdxComponents";

// inside the component:
const Body = language === "es" ? ChapterEs : ChapterEn;
const mdxComponents = labMdxComponents("<accent>", CHAPTER_WIDGETS, {
  open: language === "es" ? "leer" : "read",
  close: language === "es" ? "cerrar" : "close",
});
// …hero/side-rail TSX…
<Body components={mdxComponents} />
// …CTA/footer TSX…
```

`CHAPTER_WIDGETS` is the `{ Name: LazyComponent }` map, cast:
`as unknown as Record<string, React.ComponentType<Record<string, unknown>>>`.
Move chapter-bespoke presentational bits (e.g. bigram's `Reveal`/`Specimen`)
into the widgets map too.

### Step D — leftover UI to its namespace

After the prose moves to MDX, the chapter's i18n block still holds UI (hero,
kickers, section names, CTA, footer). Those keys keep working through the barrel,
so this is optional cleanup — but to finish the job, prune the **migrated prose
keys** from `src/i18n/locales/<ns>/{en,es}.ts` once nothing references them
(grep the key prefix across `src/` first).

### Step E — verify, then commit

```
npx tsc --noEmit                               # must be clean
NEXT_DIST_DIR=.next-verify npx next build       # full build (dodges dev .next lock); then rm -rf .next-verify
```

Plus a browser check (dev server): both languages render, headings are the large
display font, widgets mount, expandables open, side-rail tracks sections, no
console errors. Then `git checkout tsconfig.json` (build re-adds `.next-verify`
lines), `git add -A`, commit, push.

---

## 3. The three special cases

### MLP — widgets need live props (pre-binding)

`MLPNarrative` receives a live `mlpGrid` prop; ~4 widgets consume it
(`InitializationSensitivityVisualizer`, `GradientFlowVisualizer`,
`ParameterWallVisualizer`, and the big `MLPHyperparameterExplorer`). Static MDX
can't pass live props directly, so **pre-bind them in the widgets map** inside the
shell (closures capture the prop):

```tsx
export function MLPNarrative({ mlpGrid }: MLPNarrativeProps) {
  const MLP_WIDGETS = useMemo(() => ({
    OneHotVisualizer, /* …prop-less widgets… */
    // pre-bound:
    GradientFlowVisualizer: () => <GradientFlowVisualizer timeline={mlpGrid.timeline} />,
    InitializationSensitivityVisualizer: () => <InitializationSensitivityVisualizer timeline={mlpGrid.timeline} />,
    ParameterWallVisualizer: () => <ParameterWallVisualizer configs={mlpGrid.configs} />,
    MLPHyperparameterExplorer: () => <MLPHyperparameterExplorer configs={mlpGrid.configs} /* …rest… */ />,
  } as unknown as Record<string, React.ComponentType<Record<string, unknown>>>), [mlpGrid]);
  // …
}
```

In the `.mdx` you just write `<GradientFlowVisualizer />` — the closure supplies
the data. (ngram needed none of this; its widgets run on local data.)

### Accents — MLP/NN/Transformer use literal Tailwind accents, not tokens

bigram/ngram resolve `var(--bigram-*)` / `var(--ngram-*)` tokens. The other
chapters use literal accents: **MLP = violet, Transformer = cyan (`--lab-*`),
Neural Networks = its own**. `narrative-primitives`, `Callout`, `KeyTakeaway`,
etc. already branch on the full `NarrativeAccent` union
(`emerald|amber|rose|violet|cyan|bigram|ngram`), so passing `accent="violet"`
etc. to `labMdxComponents` works for the primitives.

⚠️ **But `Plane` and `Expandable` currently hardcode `var(--${accent}-*)` CSS
vars**, which only exist for bigram/ngram. Before migrating a literal-accent
chapter, extend those two components (and the `Figure`/`Section` accent handling
if needed) to fall back to a non-token surface for literal accents — e.g. accept
the accent and, when it isn't bigram/ngram, use the neutral `--lab-*` panel the
old chapters used (`FigureWrapper`'s default branch is the reference). This is
tracked as its own task; do it once and all three chapters benefit.

### Transformer — it's big (~3.6k lines)

Same process, just more sections. Split the MDX by the same section IDs the
side-rail uses. Consider doing it section-by-section, building after each, to keep
diffs reviewable. Watch for bespoke inline components (like bigram's
`Reveal`/`Specimen`) — move each into the widgets map.

---

## 4. Gotchas (learned the hard way)

- **MDX only routes markdown-generated elements and Capitalized components
  through the `components` map.** A literal lowercase `<h2>` / `<hr/>` written in
  `.mdx` renders UNSTYLED. → headings via `<Section heading=…>`, breaks via
  `<Break/>`. This was the "títulos no salen bien" bug.
- **No `as const`** on namespace objects — `en` must infer values as `string`,
  not string literals, or `es: TranslationDictionary` stops compiling.
- **UTF-8 only** for every locale + mdx file (accents á é í ó ú ñ ¿ « » → —).
- **`next-mdx-remote` is server-only** — do NOT use it here. The narratives are
  client components needing an instant in-place language toggle; that's why we
  use `@next/mdx` static imports.
- **Plugins as string names** in `next.config.mjs` (`[['remark-math']]`) — object
  form breaks under Turbopack (Next 16 dev).
- **markdown `>` blockquote is intentionally not mapped** (would nest `<p>` in
  `<p>`); use the explicit `<PullQuote>` component.
- Verify a dict refactor is **lossless**: esbuild-transpile old vs new to JSON and
  deep-equal (done for the namespace split; reuse that script for any future move).

---

## 5. Rest of the site (later, lower priority)

The same split applies beyond the lab, but the payoff is smaller (these pages
have far less prose):

- **`projects-data.ts`** already uses a clean `Localized<T> = Record<Lang,T>`
  pattern — fine as is; no MDX needed.
- **Notes / essays** already use MDX (`src/content/notes/*.mdx`) via
  `next-mdx-remote/rsc` (server-side, monolingual). If notes ever go bilingual,
  mirror the `.es.mdx` / `.en.mdx` filename convention used in `content/lab/`.
- **Home / about / landing** — short UI copy; leave in the `lab`/`core`
  namespaces. Not worth MDX.

### Optional future upgrade: next-intl + `/[locale]/` routes

The current i18n is client-only (language in localStorage), so search engines see
one language. If bilingual SEO and shareable per-language URLs ever matter,
migrate to **next-intl with `/[locale]/` routing**. That's a separate, larger
effort (restructure `app/` to `app/[locale]/`, add middleware, touch the t()
call-sites) — out of scope for the chapter migration, noted here so it isn't
forgotten. The namespace modules and MDX content carry over unchanged.
