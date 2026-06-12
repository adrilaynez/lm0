"use client";

/**
 * TypedLine — THE typing primitive of the landing (spec §6).
 *
 * mode "time": types on its own clock while `active` (micro-moments: the broken
 *   machine, the escalones). Click completes the line. Cadence profiles shape the
 *   per-char delays — the RHYTHM communicates learning (stutter → fluid).
 * mode "progress": the char count is a pure function of `progress` — fully
 *   scrub-driven and reversible (the Phase-2 voice lines use this).
 *
 * Reduced motion: the full text appears instantly. The full text is always
 * exposed to assistive tech via aria-label; the animated slice is aria-hidden.
 */

import { useEffect, useMemo, useRef, useState } from "react";

import { useReducedMotion } from "framer-motion";

import { clamp01 } from "../engine/progressMap";

export type Cadence = "stutter" | "human" | "spit";

interface TypedLineProps {
  text: string;
  /** time mode only: typing runs while true. */
  active?: boolean;
  mode?: "time" | "progress";
  /** progress mode only: 0..1 reveal. */
  progress?: number;
  /** base chars per second (time mode). */
  cps?: number;
  cadence?: Cadence;
  caret?: boolean;
  className?: string;
  onDone?: () => void;
}

function hash01(i: number, salt: number): number {
  const s = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/** Cumulative reveal time (seconds) per char, shaped by the cadence profile. */
function buildSchedule(text: string, cps: number, cadence: Cadence): number[] {
  const base = 1 / Math.max(1, cps);
  const out: number[] = [];
  let t = 0;
  for (let i = 0; i < text.length; i++) {
    let d = base;
    if (cadence === "stutter") {
      d = base * (0.4 + hash01(i, 1) * 2.2);
      if (hash01(i, 2) > 0.86) d += base * 5; // micro-freezes: the machine hesitates
    } else if (cadence === "human") {
      d = base * (0.65 + hash01(i, 3) * 0.7);
      if (text[i] === " ") d *= 1.25;
    } else {
      d = base * 0.22; // spit: near-instant machine output
    }
    t += d;
    out.push(t);
  }
  return out;
}

export function TypedLine({
  text,
  active = true,
  mode = "time",
  progress = 0,
  cps = 22,
  cadence = "human",
  caret = true,
  className,
  onDone,
}: TypedLineProps) {
  const [n, setN] = useState(0);
  const doneRef = useRef(false);
  const reduced = useReducedMotion();
  const schedule = useMemo(() => buildSchedule(text, cps, cadence), [text, cps, cadence]);

  useEffect(() => {
    setN(0);
    doneRef.current = false;
  }, [text]);

  useEffect(() => {
    if (mode !== "time") return;
    if (reduced) {
      setN(text.length);
      return;
    }
    if (!active) return;
    let raf = 0;
    let start = -1;
    const tick = (ts: number) => {
      if (start < 0) start = ts;
      const sec = (ts - start) / 1000;
      let count = 0;
      while (count < schedule.length && schedule[count] <= sec) count++;
      setN((prev) => (count > prev ? count : prev));
      if (count < text.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode, active, reduced, schedule, text.length]);

  const shown =
    mode === "progress" ? (reduced ? text.length : Math.floor(clamp01(progress) * text.length)) : n;
  const isDone = shown >= text.length;

  useEffect(() => {
    if (isDone && !doneRef.current) {
      doneRef.current = true;
      onDone?.();
    }
  }, [isDone, onDone]);

  return (
    <span
      className={className}
      aria-label={text}
      onClick={mode === "time" && !isDone ? () => setN(text.length) : undefined}
    >
      <span aria-hidden="true">{text.slice(0, shown)}</span>
      {caret && (
        <span
          className="lm0-caret"
          data-blink={isDone || !active ? "true" : "false"}
          aria-hidden="true"
        />
      )}
    </span>
  );
}
