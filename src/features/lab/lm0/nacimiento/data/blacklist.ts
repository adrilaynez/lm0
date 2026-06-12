/**
 * Per-locale forbidden substrings for the babbler's re-roll filter ("documental, no
 * improvisación": every take shown is real model output, but unlucky takes are re-rolled
 * with the next seed). Checked against the FOLDED output (lowercase, no accents).
 * Keep it short — the corpus is classic literature; collisions are rare.
 */
export const BABBLE_BLACKLIST: Record<"es" | "en", readonly string[]> = {
  es: ["puta", "mierda", "joder", "follar", "polla"],
  en: ["fuck", "shit", "bitch", "cunt", "dick"],
};
