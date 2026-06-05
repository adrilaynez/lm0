import type { Metadata } from "next";

import { labChapterMetadata } from "../_seo";

import TransformerPage from "./transformer-client";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    return labChapterMetadata(locale, "transformer", "/lab/transformer");
}

export default function Page() {
    return <TransformerPage />;
}
