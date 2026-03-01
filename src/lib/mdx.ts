import fs from "fs"
import matter from "gray-matter"
import path from "path"

const contentDirectory = path.join(process.cwd(), "src/content/notes")

export interface Note {
    slug: string
    title: string
    date: string
    description: string
    tags: string[]
    content: string
}

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

    return {
        slug: realSlug,
        title: data.title,
        date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        description: data.description,
        tags: data.tags || [],
        content,
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
