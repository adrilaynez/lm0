"use client";

/**
 * Temporary stand-in for beats 5-8 (LM0's voice, the dialogue, the camino) so the
 * Gate-1 scroll tail isn't a dead screen. Replaced wholesale in Phases 2-3 —
 * nothing here is final: the lines render statically, without the voice system.
 */

import { useI18n } from "@/i18n/context";

import type { Beat } from "../engine/progressMap";

interface Phase2PlaceholderProps {
  beat: Beat;
}

export function Phase2Placeholder({ beat }: Phase2PlaceholderProps) {
  const { t } = useI18n();
  const active = beat === "voice" || beat === "dialogue" || beat === "camino";
  return (
    <section className={`lm0-beat${active ? " is-active" : ""}`}>
      <div
        className="lm0-voice-font"
        style={{ display: "grid", gap: "0.9rem", textAlign: "center", fontSize: "1rem" }}
      >
        <span>{t("lm0.voice.notBad")}</span>
        <span>{t("lm0.voice.firstIdea")}</span>
        <span>{t("lm0.voice.gap")}</span>
        <span style={{ fontSize: "1.35rem", fontWeight: 500 }}>
          {t("lm0.voice.hello")}
          <span className="lm0-caret" data-blink="true" aria-hidden="true" />
        </span>
      </div>
      <div className="lm0-ui-font" style={{ marginTop: "2.2rem", opacity: 0.55 }}>
        beats 5–8 · gate 2/3
      </div>
    </section>
  );
}
