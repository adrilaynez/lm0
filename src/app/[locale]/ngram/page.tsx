import type { Metadata } from "next";

import { labChapterMetadata } from "../_seo";

import NgramPage from "./ngram-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return labChapterMetadata(locale, "ngram", "/ngram");
}

export default function Page() {
  return <NgramPage />;
}
