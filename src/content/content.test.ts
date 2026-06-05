import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import { describe, expect, it } from "vitest";

import { extractWikilinks, getNoteSlugs, noteFrontmatterSchema } from "../lib/mdx";

/**
 * Content integrity: every chapter/project has BOTH language MDX files, and every
 * latent-space wikilink points at a note that actually exists. Catches the classic
 * "added English, forgot Spanish" + dangling-link regressions before they ship.
 */

const ROOT = process.cwd();
const LAB_DIR = path.join(ROOT, "src/content/lab");
const PROJECTS_DIR = path.join(ROOT, "src/content/projects");
const NOTES_DIR = path.join(ROOT, "src/content/notes");

const LAB_CHAPTERS = ["bigram", "ngram", "nn", "mlp", "transformer"];

// Project slugs, derived from projects-data.ts so the test follows the source of truth
// without importing through the `[locale]` route segment (awkward to resolve in a test).
function projectSlugs(): string[] {
    const file = path.join(ROOT, "src/app/[locale]/projects/projects-data.ts");
    const src = fs.readFileSync(file, "utf8");
    const ids = [...src.matchAll(/^\s*id:\s*"([a-z0-9-]+)"/gim)].map((m) => m[1]);
    return [...new Set(ids)];
}

describe("lab chapter MDX", () => {
    it.each(LAB_CHAPTERS)("%s has both .es.mdx and .en.mdx", (chapter) => {
        expect(fs.existsSync(path.join(LAB_DIR, `${chapter}.en.mdx`)), `${chapter}.en.mdx missing`).toBe(true);
        expect(fs.existsSync(path.join(LAB_DIR, `${chapter}.es.mdx`)), `${chapter}.es.mdx missing`).toBe(true);
    });
});

describe("project MDX", () => {
    const slugs = projectSlugs();

    it("finds project slugs in projects-data.ts", () => {
        expect(slugs.length).toBeGreaterThan(0);
    });

    it.each(slugs)("%s has both .es.mdx and .en.mdx", (slug) => {
        expect(fs.existsSync(path.join(PROJECTS_DIR, `${slug}.en.mdx`)), `${slug}.en.mdx missing`).toBe(true);
        expect(fs.existsSync(path.join(PROJECTS_DIR, `${slug}.es.mdx`)), `${slug}.es.mdx missing`).toBe(true);
    });
});

describe("note frontmatter", () => {
    const files = fs.existsSync(NOTES_DIR) ? getNoteSlugs() : [];

    it("has notes to validate", () => {
        expect(files.length).toBeGreaterThan(0);
    });

    it.each(files)("%s has valid frontmatter", (file) => {
        const raw = fs.readFileSync(path.join(NOTES_DIR, file), "utf8");
        const { data } = matter(raw);
        const result = noteFrontmatterSchema.safeParse(data);
        const errors = result.success
            ? ""
            : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
        expect(result.success, `${file} invalid frontmatter — ${errors}`).toBe(true);
    });
});

describe("latent-space wikilinks", () => {
    it("every [[wikilink]] points at an existing note", () => {
        if (!fs.existsSync(NOTES_DIR)) return; // no notes yet → nothing to check
        const slugs = getNoteSlugs().map((f) => f.replace(/\.mdx$/, "").toLowerCase());
        const slugSet = new Set(slugs);
        const dangling: string[] = [];

        for (const file of getNoteSlugs()) {
            const content = fs.readFileSync(path.join(NOTES_DIR, file), "utf8");
            for (const link of extractWikilinks(content)) {
                if (!slugSet.has(link)) dangling.push(`${file} → [[${link}]]`);
            }
        }

        expect(dangling, `Dangling wikilinks:\n${dangling.join("\n")}`).toEqual([]);
    });
});
