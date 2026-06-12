// English dictionary — assembled from per-feature namespace modules in ./locales/*.
// Migrated chapter prose lives in src/content/lab/*.mdx, not here; these namespaces hold UI
// strings (labels, nav, CTAs, section names) plus not-yet-migrated copy.
// See src/i18n/README.md for the structure and the UTF-8 requirement.
import { bigram } from "./locales/bigram/en";
import { core } from "./locales/core/en";
import { home } from "./locales/home/en";
import { lab } from "./locales/lab/en";
import { latentSpaceNs } from "./locales/latent-space/en";
import { lm0Ns } from "./locales/lm0/en";
import { models } from "./locales/models/en";
import { neuralNetwork } from "./locales/neuralNetwork/en";
import { ngram } from "./locales/ngram/en";
import { projects } from "./locales/projects/en";

export const en = {
  ...core,
  ...home,
  ...projects,
  ...latentSpaceNs,
  ...lab,
  ...models,
  ...bigram,
  ...ngram,
  ...neuralNetwork,
  ...lm0Ns,
};
