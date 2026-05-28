# i18n

Bilingual EN/ES translation system. Every user-facing string in the app lives here.

## Files

- `en.ts` — English strings (~4300 lines)
- `es.ts` — Spanish strings (~4300 lines, mirrors en.ts exactly)
- `context.tsx` — React context + `useI18n()` hook
- `types.ts` — `TranslationDictionary` type (inferred from en.ts)

## Usage

```tsx
import { useI18n } from '@/i18n/context';

function MyComponent() {
  const { t, language } = useI18n();
  return <p>{t('lab.mlp.sections.hidden.pWhyHiddenLayers')}</p>;
}
```

`language` is `'en'` or `'es'`. The toggle is in the navbar; preference is stored in localStorage.

## Key structure

```ts
{
  nav: { home, projects, lab, notes },
  landing: { hero, about, work, contact, skills },
  projects: { hero, flagship, ... },
  lab: {
    bigram: { ... },
    ngram: { ... },
    neuralNetworks: { ... },
    mlp: {
      sections: {
        embedding: { ... },
        hidden: { ... },
        depth: { ... },
        stability: { ... },
        hyperparams: { ... },
        limits: { ... },
      }
    },
    transformer: { ... },
    landing: { chill: { eras: { counting, learning, attention } } },
  },
  notes: { hero, featured, grid },
  latentSpace: { eyebrow, title, toggle },
}
```

## Adding strings

1. Add the key and English value to `en.ts`
2. Add the same key and Spanish value to `es.ts`
3. TypeScript will error if the structures don't match (enforced by `TranslationDictionary`)

## Important: encoding

Both files must be saved as **UTF-8**. Saving with any other encoding corrupts accented characters (á, é, ó, ñ, ¿, →, —) into replacement characters. If you see `?` where accented letters should be, the file was saved with wrong encoding.
