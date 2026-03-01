import { notFound } from "next/navigation"

import { MDXContent } from "@/components/mdx-content"
import { NoteHeader } from "@/components/note-header"
import { getNoteBySlug, getNoteSlugs } from "@/lib/mdx"

// Force static generation for all notes
export async function generateStaticParams() {
    const slugs = getNoteSlugs()
    return slugs.map((slug) => ({
        slug: slug.replace(/\.mdx$/, ""),
    }))
}

// Generate metadata for the page
export async function generateMetadata({ params }: { params: { slug: string } }) {
    const { slug } = await params
    const note = getNoteBySlug(slug)
    if (!note) {
        return {
            title: "Note Not Found",
        }
    }
    return {
        title: `${note.title} | Adrian Laynez`,
        description: note.description,
    }
}

export default async function NotePage({ params }: { params: { slug: string } }) {
    const { slug } = await params
    const note = getNoteBySlug(slug)

    if (!note) {
        notFound()
    }

    return (
        <article className="container max-w-3xl py-6 lg:py-10 mx-auto px-4 md:px-8">
            <NoteHeader title={note.title} date={note.date} />
            <hr className="my-8 border-muted" />
            <div className="prose dark:prose-invert max-w-none">
                <MDXContent source={note.content} />
            </div>
        </article>
    )
}
