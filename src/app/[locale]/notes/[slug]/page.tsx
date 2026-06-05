import { redirect } from "@/i18n/navigation";

interface Props {
    params: Promise<{ slug: string; locale: string }>;
}

export default async function NoteSlugPage({ params }: Props) {
    const { slug, locale } = await params;
    redirect({ href: `/latent-space/mind/${slug}`, locale });
}
