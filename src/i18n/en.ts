// English dictionary — assembled from per-feature namespace modules in ./locales/*.
// Migrated chapter prose lives in src/content/lab/*.mdx, not here; these namespaces hold UI
// strings (labels, nav, CTAs, section names) plus not-yet-migrated copy.
// See src/i18n/README.md for the structure and the UTF-8 requirement.
import { bigram } from "./locales/bigram/en";
import { core } from "./locales/core/en";
import { lab } from "./locales/lab/en";
import { models } from "./locales/models/en";
import { neuralNetwork } from "./locales/neuralNetwork/en";
import { ngram } from "./locales/ngram/en";

export const en = {
    ...core,
    ...lab,
    ...models,
    ...bigram,
    ...ngram,
    ...neuralNetwork,
};
