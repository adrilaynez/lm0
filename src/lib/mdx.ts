import fs from "fs"
import matter from "gray-matter"
import path from "path"
import { z } from "zod"

const contentDirectory = path.join(process.cwd(), "src/content/notes")

/**
 * Schema for a note's MDX frontmatter. Lenient toward the existing data: only `title`
 * is strictly required; `kind`/`status` are optional but, when present, must be one of
 * the known values. Used by the content test to catch malformed frontmatter in CI
 * (the loader stays tolerant so a bad note never crashes the running site).
 */
export const noteFrontmatterSchema = z.object({
    title: z.string().min(1, "title is required"),
    date: z.string().optional(),
    updated: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    kind: z.enum(["essay", "seed", "evergreen"]).optional(),
    status: z.enum(["draft", "published", "wip", "budding"]).optional(),
    image: z.string().optional(),
})

export type NoteFrontmatter = z.infer<typeof noteFrontmatterSchema>

export type NoteKind = "essay" | "seed" | "evergreen"
export type NoteStatus = "draft" | "published" | "wip" | "budding"

export interface Note {
    slug: string
    title: string
    date: string
    description: string
    tags: string[]
    content: string
    kind: NoteKind
    status: NoteStatus
    image?: string
    updated?: string
    backlinks?: string[]
}

const WIKILINK_RE = /\[\[([a-z0-9-]+)\]\]/gi

export function getNoteSlugs() {
    if (!fs.existsSync(contentDirectory)) {
        return []
    }
    return fs.readdirSync(contentDirectory).filter((file) => file.endsWith(".mdx"))
}

export function getNoteBySlug(slug: string): Note | null {
    const realSlug = slug.replace(/\.mdx$/, "")
    const fullPath = path.join(contentDirectory, `${realSlug}.mdx`)

    if (!fs.existsSync(fullPath)) {
        return null
    }

    const fileContents = fs.readFileSync(fullPath, "utf8")
    const { data, content } = matter(fileContents)

    const kind = (data.kind ?? "essay") as NoteKind
    const status = (data.status ?? (kind === "essay" ? "published" : "budding")) as NoteStatus

    return {
        slug: realSlug,
        title: data.title,
        date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        description: data.description ?? "",
        tags: data.tags || [],
        content,
        kind,
        status,
        image: data.image,
        updated: data.updated ? new Date(data.updated).toISOString() : undefined,
        backlinks: data.backlinks,
    }
}

export function getAllNotes(): Note[] {
    const slugs = getNoteSlugs()
    const notes = slugs
        .map((slug) => getNoteBySlug(slug))
        .filter((note): note is Note => note !== null)
        .sort((note1, note2) => (note1.date > note2.date ? -1 : 1))

    return notes
}

export function getNotesByKind(kind: NoteKind | NoteKind[]): Note[] {
    const kinds = Array.isArray(kind) ? kind : [kind]
    return getAllNotes().filter((note) => kinds.includes(note.kind))
}

export function getEssays(): Note[] {
    return getAllNotes().filter(
        (note) => note.kind === "essay" && note.status === "published",
    )
}

export function getMindNotes(): Note[] {
    return getAllNotes()
        .filter((note) => note.kind === "seed" || note.kind === "evergreen")
        .sort((a, b) => {
            const aDate = a.updated ?? a.date
            const bDate = b.updated ?? b.date
            return aDate > bDate ? -1 : 1
        })
}

export function extractWikilinks(content: string): string[] {
    const found = new Set<string>()
    for (const match of content.matchAll(WIKILINK_RE)) {
        found.add(match[1].toLowerCase())
    }
    return [...found]
}

export function getBacklinksFor(slug: string): Note[] {
    const target = slug.toLowerCase()
    return getAllNotes().filter((note) => {
        if (note.slug.toLowerCase() === target) return false
        return extractWikilinks(note.content).includes(target)
    })
}
