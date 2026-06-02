/**
 * bigram/kit — the blessed building blocks for the Bigram chapter.
 *
 * Every visualizer is ASSEMBLED from these (plus its one unique mechanic) instead of re-coding the look.
 * The pieces were extracted verbatim from the §1/§2 widgets the user signed off as "the level", so a
 * widget made of them can't drift off-style. Read `AGENTS.md` in this folder before building a widget.
 *
 * Also available (not re-exported here, import from `../`): HonestBar, PairChip, Verdict.
 */

export { GhostButton,PlayButton } from "./Buttons";
export { CaptionLine } from "./CaptionLine";
export { CountUpNumber } from "./CountUpNumber";
export { FixedAlphabetRow } from "./FixedAlphabetRow";
export type { MarkedTextProps,MarkState } from "./MarkedText";
export { MarkedText } from "./MarkedText";
export { ParchmentReader } from "./ParchmentReader";
export { Readout } from "./Readout";
export { Tabs } from "./Tabs";
export * from "./tokens";
