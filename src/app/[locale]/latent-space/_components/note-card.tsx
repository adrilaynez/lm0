import { getNoteBySlug } from "@/lib/mdx";

import { NoteLink } from "./note-link";

function previewSnippet(content: string): string {
  return content
    .replace(/<[^>]*>/g, "")
    .replace(/^#{1,6}\s.*$/gm, "")
    .replace(/\[\[([a-z0-9-]+)\]\]/gi, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface NoteCardProps {
  slug: string;
  broken?: boolean;
}

// Server component — resolves note data at render time so MDX source
// only needs <NoteLink slug="..." /> without injecting large props as strings.
export function NoteCard({ slug, broken }: NoteCardProps) {
  if (broken) return <NoteLink slug={slug} broken />;
  const note = getNoteBySlug(slug);
  if (!note) return <NoteLink slug={slug} broken />;
  return (
    <NoteLink
      slug={slug}
      title={note.title}
      preview={previewSnippet(note.content)}
      status={note.status}
    />
  );
}
