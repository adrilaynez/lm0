/** Shape of a packaged landing corpus (one per locale). */
export interface Corpus {
  /** Verbatim public-domain text the baby machine reads (≤30k chars, sliced from the source). */
  raw: string;
  /** A famous line guaranteed to appear in `raw` — the final escalón regurgitates it. */
  memorizedPhrase: string;
  /** Source + edition, shown in the colophon. */
  attribution: string;
}
