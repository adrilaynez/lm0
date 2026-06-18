import type { Metadata } from "next";

import { labChapterMetadata } from "../_seo";

import MlpPage from "./mlp-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return labChapterMetadata(locale, "mlp", "/mlp");
}

export default function Page() {
  return <MlpPage />;
}
