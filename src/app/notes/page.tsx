import { getAllNotes } from "@/lib/mdx"

import { NotesContent } from "./notes-content";

export const metadata = {
    title: "Research Notes | Adrian Laynez",
    description: "Deep dives into distributed systems, AI topology, and software architecture.",
}

export default function NotesPage() {
    const notes = getAllNotes()

    return <NotesContent notes={notes} />
}
