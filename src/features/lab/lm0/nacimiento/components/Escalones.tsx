"use client";

/**
 * Beat 3/4 — the machine's attempts: REAL takes from the babble ladder, one per
 * bucket, typed in the machine voice. During the silence beat the best take
 * (bucket 23, the memorized phrase) hangs alone — the protected beat (spec §4.4).
 */

import { useMemo } from "react";

import { useI18n } from "@/i18n/context";

import { BUCKETS } from "../data/script";
import { type BabbleLocale, generate } from "../engine/babbler";
import type { Beat } from "../engine/progressMap";

import { TypedLine } from "./TypedLine";

interface EscalonesProps {
  beat: Beat;
  bucket: number;
  locale: BabbleLocale;
}

export function Escalones({ beat, bucket, locale }: EscalonesProps) {
  const { t } = useI18n();
  const visible = beat === "training" || beat === "silence";
  const silent = beat === "silence";
  const heldBucket = silent ? BUCKETS - 1 : bucket;
  const take = useMemo(
    () => (visible ? generate(locale, heldBucket) : null),
    [visible, locale, heldBucket],
  );

  if (!take) return null;

  return (
    <section className={`lm0-beat${visible ? " is-active" : ""}`}>
      <div className="lm0-attempt lm0-machine-font" data-silent={silent ? "true" : "false"}>
        {silent ? (
          <span aria-label={take.text}>
            <span aria-hidden="true">{take.text}</span>
          </span>
        ) : (
          <TypedLine
            key={`${locale}-${heldBucket}`}
            text={take.text}
            active={visible}
            cps={take.stage === "frequencies" ? 30 : take.stage === "syllables" ? 36 : 46}
            cadence={take.stage === "frequencies" ? "stutter" : "human"}
          />
        )}
      </div>
      {!silent && (
        <div className="lm0-stagechip lm0-ui-font">{t(`lm0.training.stages.${take.stage}`)}</div>
      )}
    </section>
  );
}
