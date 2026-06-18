// Spanish dictionary — assembled from per-feature namespace modules in ./locales/*.
// Mirrors the English structure; typed against the English dictionary via TranslationDictionary
// so a missing/extra key is a compile error. See src/i18n/README.md (UTF-8 required).
import { bigram } from "./locales/bigram/es";
import { core } from "./locales/core/es";
import { lab } from "./locales/lab/es";
import { lm0Ns } from "./locales/lm0/es";
import { models } from "./locales/models/es";
import { neuralNetwork } from "./locales/neuralNetwork/es";
import { ngram } from "./locales/ngram/es";
import { TranslationDictionary } from "./types";

export const es: TranslationDictionary = {
  ...core,
  ...lab,
  ...models,
  ...bigram,
  ...ngram,
  ...neuralNetwork,
  ...lm0Ns,
};
