import { redirect } from "@/i18n/navigation";

// Fallback only: next.config.mjs already redirects /notes at the edge. Keep the
// target identical (/latent-space?mode=essays) so the two never diverge.
export default async function NotesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: "/latent-space?mode=essays", locale });
}
