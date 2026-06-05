import { redirect } from "@/i18n/navigation";

export default async function NotesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    redirect({ href: "/latent-space", locale });
}
