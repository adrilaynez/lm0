import type { Metadata } from "next";

import { labChapterMetadata } from "../_seo";

import BigramPage from "./bigram-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return labChapterMetadata(locale, "bigram", "/bigram");
}

export default function Page() {
  return <BigramPage />;
}
