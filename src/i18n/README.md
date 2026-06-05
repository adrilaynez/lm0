# i18n

Bilingual EN/ES translation system for **UI strings** (labels, nav, buttons, CTAs,
section names, tooltips). Long-form chapter **narrative** does NOT live here — it lives in
MDX content files (see "Narrative vs. UI" below).

## How language works (next-intl, URL-based)

Language is resolved on the **server** from the URL, via **next-intl** with `localePrefix: 'as-needed'`:
English is unprefixed (`/lab/bigram`), Spanish is under `/es/` (`/es/lab/bigram`). No client-side
flash. Detection order: URL prefix → `NEXT_LOCALE` cookie → `Accept-Language` → default (`en`).

- `routing.ts` — locales/defaultLocale/localePrefix/cookie (`defineRouting`).
- `navigation.ts` — locale-aware `Link`/`useRouter`/`usePathname`/`redirect`/`getPathname`
  (`createNavigation`). **Use these instead of `next/link` / `next/navigation`** for internal links.
- `request.ts` — `getRequestConfig`; loads `messages` from the existing TS dictionaries (below).
- `../proxy.ts` — next-intl middleware (Next 16 renamed `middleware.ts` → `proxy.ts`); `/api` excluded.
- App lives under `app/[locale]/`; `app/[locale]/layout.tsx` owns `<html lang>` + `NextIntlClientProvider`.

## Dictionary files

- `en.ts` / `es.ts` — thin **barrels** that assemble the per-feature namespace modules (reused as
  next-intl `messages`; no JSON migration — next-intl accepts any JS object).
- `locales/<ns>/{en,es}.ts` — the actual strings, split by feature:
  - `core` — `common`, `nav`, `footer`, `datasetExplorer`
  - `home` — `home`, `landing`
  - `projects` — `projects`
  - `latent-space` — `latentSpace`, `notes` (export name `latentSpaceNs`)
  - `lab` — `lab`, `training`, `challenge`
  - `models` — the per-model metadata block (the largest)
  - `bigram` / `ngram` / `neuralNetwork` — the chapters' leftover UI + widget labels
- `types.ts` — `TranslationDictionary = typeof en`.

The split is organizational: `en` is still one object (`{ ...core, ...home, ...projects, ... }`),
so `t('lab.mlp.sections.hidden.x')` works exactly as before — no call-site changed.

## Usage

```tsx
import { useI18n } from '@/i18n/context';

function MyComponent() {
  const { t, language } = useI18n();
  return <p>{t('lab.mlp.sections.hidden.pWhyHiddenLayers')}</p>;
}
```

`useI18n()` is now a **compatibility shim over next-intl** (same `{ language, setLanguage, t }` API):
- `language` = `useLocale()` (from the URL).
- `setLanguage(l)` navigates to the same path under locale `l` (persists via `NEXT_LOCALE` cookie).
- `t` uses next-intl's `tRoot.raw(key)` + manual `{param}` replacement — NOT ICU formatting. This is
  required because many strings embed literal `<strong>`/`<em>` HTML (rendered via
  `dangerouslySetInnerHTML`); ICU would mis-parse `<…>` as tag placeholders and throw. `raw()`
  reproduces the original hand-rolled `t()` semantics exactly. **So do NOT rely on ICU plural/select
  syntax in these dictionaries** — use plain `{param}` placeholders only.

The language toggle (`components/ui/language-toggle.tsx`) just calls `setLanguage()`.

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
