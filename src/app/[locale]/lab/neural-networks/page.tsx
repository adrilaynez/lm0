import type { Metadata } from "next";

import { labChapterMetadata } from "../_seo";

import NeuralNetworksPage from "./neural-networks-client";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    return labChapterMetadata(locale, "neuralNetworks", "/lab/neural-networks");
}

export default function Page() {
    return <NeuralNetworksPage />;
}
