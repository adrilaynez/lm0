import type { Metadata } from "next";

import { localizedMetadata } from "./_meta";
import LabLandingPage from "./lab-landing-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return localizedMetadata({
    locale,
    path: "/",
    title:
      locale === "es"
        ? "LM0 — el nacimiento de un modelo de lenguaje"
        : "LM0 — how a language model is born",
    description:
      locale === "es"
        ? "Un recorrido interactivo por 80 años de modelos de lenguaje — del bigrama a la atención."
        : "An interactive walk through 80 years of language modeling — from the bigram to attention.",
  });
}

export default function Page() {
  return <LabLandingPage />;
}
