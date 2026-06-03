/**
 * gen-ngram-prose.mjs — regenerate the LIVING full-narrative mirror of the N-gram chapter.
 *
 *   node gen-ngram-prose.mjs   →   writes ngram-narrative.md
 *
 * Reads the render ORDER from NgramNarrative.tsx and resolves each `t("ngramNarrative.v2.<key>")` string
 * from es.ts, interleaving widget markers, so the WHOLE chapter can be read as one document to spot
 * duplication / weak bridges BEFORE editing copy. Re-run after any copy change. (Source of truth stays
 * es.ts; this is a read-only mirror.) Mirror of gen-bigram-prose.mjs.
 */
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { pathToFileURL } from "url";

// 1 · load the es dictionary (strip the type import + annotation → importable mjs)
const esSrc = readFileSync("src/i18n/es.ts", "utf8")
    .replace(/^import\s+.*$/m, "")
    .replace(/:\s*TranslationDictionary/, "");
const tmp = "_es_tmp.mjs";
writeFileSync(tmp, esSrc);
const { es } = await import(pathToFileURL(tmp).href + "?t=" + Date.now());
unlinkSync(tmp);

const V2 = es.ngramNarrative.v2;
const resolve = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), V2);

// 2 · walk the render in order
const tsx = readFileSync("src/features/lab/components/NgramNarrative.tsx", "utf8").split("\n");
const WIDGETS = [
    "ContextWindow", "ContextCounter", "NgramBattle", "ContextExplosion", "SparsityView",
    "InfiniteTable", "UnseenContext", "TypoBreaker", "SimilarityBridge",
];
const widgetRe = new RegExp(`<(${WIDGETS.join("|")})\\b`);
const keyRe = /t\(\s*"ngramNarrative\.v2\.([a-zA-Z0-9_.]+)"/g;

const out = [
    "# N-gram — narrativa COMPLETA (mirror vivo, generado · NO editar a mano)",
    "",
    "> Generado por `gen-ngram-prose.mjs` desde `NgramNarrative.tsx` (orden) + `es.ts` (texto).",
    "> Léelo de corrido ANTES de tocar copy: busca duplicación, puentes flojos, arco. Regenéralo tras cada cambio.",
    "",
];

let started = false;
for (const line of tsx) {
    if (!started && /<header\b/.test(line)) started = true;
    if (!started) continue;

    const secMatch = line.match(/id="(ngram-\d+)"/);
    if (/<SectionBreak/.test(line)) { out.push("", "──────────", ""); continue; }
    if (secMatch) out.push("", `### ${secMatch[1]}`, "");
    if (/<ExpandableSection/.test(line)) out.push("▸ (plegable · Historia)");

    let m;
    keyRe.lastIndex = 0;
    while ((m = keyRe.exec(line)) !== null) {
        const key = m[1];
        const val = resolve(key);
        if (typeof val === "string") out.push(`- **${key}** · ${val.replace(/<[^>]+>/g, "")}`);
        else if (Array.isArray(val)) val.forEach((p, i) => out.push(`- **${key}[${i}]** · ${String(p).replace(/<[^>]+>/g, "")}`));
        else out.push(`- **${key}** · ⟨no resuelto⟩`);
    }
    const w = line.match(widgetRe);
    if (w) out.push(`  ▶▶ [VIS: ${w[1]}]`);
}

writeFileSync("ngram-narrative.md", out.join("\n") + "\n");
console.log("wrote ngram-narrative.md (" + out.length + " lines)");
