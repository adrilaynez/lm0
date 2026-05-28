import { redirect } from "next/navigation";

interface Props {
    params: Promise<{ slug: string }>;
}

export default async function NoteSlugPage({ params }: Props) {
    const { slug } = await params;
    redirect(`/latent-space/mind/${slug}`);
}
