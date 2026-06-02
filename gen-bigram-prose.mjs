/**
 * gen-bigram-prose.mjs — regenerate the LIVING full-narrative mirror of the Bigram chapter.
 *
 *   node gen-bigram-prose.mjs   →   writes bigram-narrative.md
 *
 * Reads the render ORDER from BigramNarrative.tsx and resolves each `t("bigramNarrative.v2.<key>")`
 * string from es.ts, interleaving widget markers, so you can read the WHOLE chapter as one document
 * and spot duplication / weak bridges BEFORE editing copy. Re-run it after any copy change to keep
 * bigram-narrative.md in sync. (Source of truth stays es.ts; this is a read-only mirror.)
 */
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { pathToFileURL } from "url";

// 1 · load the es dictionary (strip the type import + annotation → importable mjs)
let esSrc = readFileSync("src/i18n/es.ts", "utf8")
    .replace(/^import\s+.*$/m, "")
    .replace(/:\s*TranslationDictionary/, "");
const tmp = "_es_tmp.mjs";
writeFileSync(tmp, esSrc);
const { es } = await import(pathToFileURL(tmp).href + "?t=" + Date.now());
unlinkSync(tmp);

const V2 = es.bigramNarrative.v2;
const resolve = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), V2);

// 2 · walk the render in order
const tsx = readFileSync("src/features/lab/components/BigramNarrative.tsx", "utf8").split("\n");
const WIDGETS = [
    "FillTheBlank", "HeroAutoComplete", "PairHighlighter", "IsolateT", "RowTally",
    "NormalizationVisualizer", "AlwaysMaxLoop", "LoadedDie", "TinyMatrixExample",
    "GrowingMatrix27", "DetectiveMatrix", "LetterByLetter", "TableWriter",
    "GenerationPlayground", "ContextBlindnessDemo", "ShannonContextLadder", "MarkovStory",
];
const widgetRe = new RegExp(`<(${WIDGETS.join("|")})\\b`);
const keyRe = /t\(\s*"bigramNarrative\.v2\.([a-zA-Z0-9_.]+)"/g;

const out = ["# Bigram — narrativa COMPLETA (mirror vivo, generado · NO editar a mano)",
    "",
    "> Generado por `gen-bigram-prose.mjs` desde `BigramNarrative.tsx` (orden) + `es.ts` (texto).",
    "> Léelo de corrido ANTES de tocar copy: busca duplicación, puentes flojos, arco. Regenéralo tras cada cambio.",
    ""];

// only the chapter render lives after the first <Section ; stop at the export/end
let started = false;
for (const line of tsx) {
    if (!started && /<Section\b/.test(line)) started = true;
    if (!started) continue;

    const secMatch = line.match(/<Section(Anchor)?\s+id="(bigram-\d+)"/) || line.match(/id="(bigram-\d+)"/);
    if (/<SectionBreak/.test(line)) { out.push("", "──────────", ""); continue; }
    if (secMatch) out.push("", `### ${secMatch[2] || secMatch[1]}`, "");
    if (/<ExpandableSection/.test(line)) out.push("▸ (plegable)");

    let m;
    keyRe.lastIndex = 0;
    while ((m = keyRe.exec(line)) !== null) {
        const key = m[1];
        const val = resolve(key);
        if (typeof val === "string") out.push(`- **${key}** · ${val.replace(/<[^>]+>/g, "")}`);
        else out.push(`- **${key}** · ⟨no resuelto⟩`);
    }
    const w = line.match(widgetRe);
    if (w) out.push(`  ▶▶ [VIS: ${w[1]}]`);
}

writeFileSync("bigram-narrative.md", out.join("\n") + "\n");
console.log("wrote bigram-narrative.md (" + out.length + " lines)");
