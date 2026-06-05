import { redirect } from "@/i18n/navigation";

export default async function VisualizerPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    redirect({ href: "/lab", locale });
}
