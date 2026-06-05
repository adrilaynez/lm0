# i18n

Bilingual EN/ES translation system for **UI strings** (labels, nav, buttons, CTAs,
section names, tooltips). Long-form chapter **narrative** does NOT live here — it lives in
MDX content files (see "Narrative vs. UI" below).

## Files

- `en.ts` / `es.ts` — thin **barrels** that assemble the per-feature namespace modules.
- `locales/<ns>/{en,es}.ts` — the actual strings, split by feature:
  - `core` — `common`, `nav`, `footer`, `datasetExplorer`
  - `lab` — `lab`, `training`, `home`, `landing`, `projects`, `notes`, `latentSpace`, `challenge`
  - `models` — the per-model metadata block (the largest)
  - `bigram` — `bigramNarrative` (leftover UI), `bigramBuilder`, `bigramWidgets`
  - `ngram` — `ngram`, `ngramNarrative` (leftover UI), `ngramPedagogy`
  - `neuralNetwork` — `neuralNetworkNarrative`
- `context.tsx` — React context + `useI18n()` hook (unchanged: `t()`, fallback `lang → en → key`,
  `{param}` interpolation, lazy-loaded `es`).
- `types.ts` — `TranslationDictionary = typeof en`.

The split is purely organizational: `en` is still one object (`{ ...core, ...lab, ... }`),
so `t('lab.mlp.sections.hidden.x')` works exactly as before — no call-site changed.

## Usage

```tsx
import { useI18n } from '@/i18n/context';

function MyComponent() {
  const { t, language } = useI18n();
  return <p>{t('lab.mlp.sections.hidden.pWhyHiddenLayers')}</p>;
}
```

`language` is `'en'` or `'es'`. The toggle is in the navbar; preference is stored in localStorage.

## Narrative vs. UI — where does my text go?

- **UI string** (a label, button, kicker, short title, tooltip, a single sentence of chrome)
  → a `locales/<ns>/{en,es}.ts` namespace, read via `t('...')`.
- **Narrative prose** (paragraphs of the chapter story) → an MDX file under
  `src/content/lab/<chapter>.{es,en}.mdx`, authored as real markdown (`**bold**`, `*italic*`,
  `$math$`) with widgets embedded in reading order. Rendered by the chapter's thin shell
  component through `labMdxComponents()`. Migrated so far: **bigram**, **ngram**.

> Why: `t()` returns strings only, which forced long prose to be sliced into `p1`/`h1`/`p2`
> fragments with HTML-in-strings. MDX keeps a chapter readable as one document. Other chapters
> (MLP, Neural Networks, Transformer) still keep their narrative in i18n until migrated.

## Adding strings

1. Add the key + English value to the right `locales/<ns>/en.ts`.
2. Add the same key + Spanish value to `locales/<ns>/es.ts`.
3. TypeScript errors if the structures don't match (enforced by `TranslationDictionary`).

Do **not** add `as const` to the namespace objects — `en` must infer values as `string`
(not string literals), otherwise `es` can't satisfy `TranslationDictionary`.

## Important: encoding

All namespace files must be saved as **UTF-8**. Saving with any other encoding corrupts
accented characters (á, é, ó, ñ, ¿, →, —) into replacement characters. If you see `?` where
accented letters should be, the file was saved with the wrong encoding.
