"use client";

import "@/features/lab/lm0/nacimiento/lm0.css";

import { NacimientoLanding } from "@/features/lab/lm0/nacimiento/NacimientoLanding";

/**
 * Site landing — `/` (lm0.dev)
 *
 * "El nacimiento" (LM0 v3): the interactive birth-of-a-language-model landing.
 * The whole site IS the lab, so there is no global navbar/footer — renders chrome-free.
 */
export default function LabLandingPage() {
  return <NacimientoLanding />;
}
