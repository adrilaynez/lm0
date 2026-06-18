"use client";

/**
 * HeroQuestion — the hero title's entrance, staged so it reads as the VERDICT the
 * machine just provoked, not a sign that flips on. Two waves:
 *   1. every word but the last settles in (rising out of a soft blur, in reading
 *      order) — "La máquina no sabe" / "The machine can't";
 *   2. a clear PAUSE (the machine keeps failing on screen), then the last word
 *      ("hablar." / "speak.") lands a hair heavier — the conclusion.
 * The italic accent ("no" / "can't") is more expressive: it settles a beat late with
 * a faint micro-vibration, as if the machine strained for it. Editorial, not the
 * phosphor terminal's per-glyph typing; never caricaturesque.
 *
 * Plays once when the title arms (`play`). CSS-driven (per-word stagger + a `last`
 * class for wave 2) so it stays cheap; reduced motion shows the full title instantly.
 * The h1 carries the real aria-label; this is decorative.
 */

import { useEffect, useState } from "react";

import { useReducedMotion } from "framer-motion";

interface HeroQuestionProps {
  /** words before the italic accent */
  lead: string;
  /** the italic accent word(s) — may sit in the MIDDLE of the line */
  accent: string;
  /** words after the accent (optional) */
  tail?: string;
  play: boolean;
}

export function HeroQuestion({ lead, accent, tail = "", play }: HeroQuestionProps) {
  const reduced = useReducedMotion();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (reduced) {
      setArmed(true);
      return;
    }
    if (!play) {
      setArmed(false);
      return;
    }
    // arm on the next frame so the from-state paints first (the words start hidden)
    const id = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(id);
  }, [play, reduced]);

  // split into words, tagging which fall inside the italic accent run (which may be
  // in the middle of the line, e.g. "La máquina NO sabe hablar.")
  const full = [lead, accent, tail].filter(Boolean).join(" ");
  const accentStart = lead.length + 1;
  const accentEnd = accentStart + accent.length;
  const words: { text: string; accent: boolean }[] = [];
  let idx = 0;
  full.split(" ").forEach((w, wi) => {
    if (wi > 0) idx += 1; // the space between words
    words.push({ text: w, accent: idx >= accentStart && idx < accentEnd });
    idx += w.length;
  });

  return (
    <span className={armed ? "lm0-hq is-in" : "lm0-hq"} aria-hidden="true">
      {words.map((word, wi) => (
        <span key={wi}>
          {wi > 0 ? " " : null}
          <span
            className={[
              "lm0-hq-word",
              word.accent ? "lm0-display-accent" : null,
              wi === words.length - 1 ? "lm0-hq-last" : null,
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ "--i": wi } as React.CSSProperties}
          >
            {word.text}
          </span>
        </span>
      ))}
    </span>
  );
}
