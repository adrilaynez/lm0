"use client";

import "@/features/lab/lm0/nacimiento/lm0.css";

import { NacimientoLanding } from "@/features/lab/lm0/nacimiento/NacimientoLanding";

/**
 * Lab landing — `/lab`
 *
 * "El nacimiento" (LM0 v3): the interactive birth-of-a-language-model landing.
 * Replaces the former "chill" editorial landing (retired). Renders chrome-free —
 * LayoutShell hides the global navbar/footer for every `/lab` route.
 */
export default function LabLandingPage() {
  return <NacimientoLanding />;
}
