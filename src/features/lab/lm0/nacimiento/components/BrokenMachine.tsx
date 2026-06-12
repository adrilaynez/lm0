"use client";

/**
 * Beat 2 — the broken machine: it types, stares at what it wrote, erases, tries
 * again (cycle ≤4s). The morralla is REAL output of the untrained model (uniform
 * prior, seeded). The button is sugar; the scroll always works too.
 */

import { useEffect, useState } from "react";

import { useReducedMotion } from "framer-motion";

import { useI18n } from "@/i18n/context";

import { type BabbleLocale, brokenSample } from "../engine/babbler";

import { TypedLine } from "./TypedLine";

interface BrokenMachineProps {
  active: boolean;
  locale: BabbleLocale;
  onTeach: () => void;
}

export function BrokenMachine({ active, locale, onTeach }: BrokenMachineProps) {
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<"type" | "stare" | "erase">("type");
  const [erased, setErased] = useState(0);
  const text = brokenSample(locale, attempt);

  useEffect(() => {
    if (!active || reduced) return;
    if (phase === "stare") {
      const id = window.setTimeout(() => {
        setPhase("erase");
        setErased(0);
      }, 650);
      return () => window.clearTimeout(id);
    }
    if (phase === "erase") {
      const id = window.setInterval(() => {
        setErased((e) => {
          if (e + 2 >= text.length) {
            window.clearInterval(id);
            window.setTimeout(() => {
              setAttempt((a) => a + 1);
              setPhase("type");
            }, 320);
            return text.length;
          }
          return e + 2;
        });
      }, 28);
      return () => window.clearInterval(id);
    }
  }, [phase, active, reduced, text.length]);

  const erasingText = text.slice(0, Math.max(0, text.length - erased));

  return (
    <section className={`lm0-beat${active ? " is-active" : ""}`}>
      <div className="lm0-machine-font lm0-broken-line">
        {phase === "type" || reduced ? (
          <TypedLine
            key={`${locale}-${attempt}`}
            text={text}
            active={active}
            cps={26}
            cadence="stutter"
            onDone={() => setPhase("stare")}
          />
        ) : (
          <span aria-hidden="true">
            {erasingText}
            <span className="lm0-caret" data-blink="false" />
          </span>
        )}
      </div>
      <div className="lm0-ui-font">{t("lm0.broken.label")}</div>
      <button type="button" className="lm0-btn" onClick={onTeach}>
        {t("lm0.broken.teach")} →
      </button>
      <div className="lm0-ui-font" style={{ opacity: 0.6 }}>
        — {t("lm0.broken.hint")} —
      </div>
    </section>
  );
}
