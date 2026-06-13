"use client";

/**
 * VoiceMonologue — the dark act's opening: lm0 writes and ERASES, group by
 * group, with the big block caret. Fully scrub-driven (a pure function of the
 * voice beat's local progress — reversible like everything else).
 *
 * Groups (frozen script, lowercase always):
 *  A  nada mal. / fue una de las primeras ideas que funcionaron.    → erase
 *  B  de ese balbuceo… / …a mí: / 70 años. (the number, huge)       → erase
 *  C  hola. soy lm0. (big) / vengo de esa pequeña idea…             → erase
 *  D  durante setenta años… / que una máquina aprendiera sola. / …mira.
 */

import { useEffect, useRef } from "react";

import { gsap } from "gsap";

import { useI18n } from "@/i18n/context";

import { clamp01, type NacimientoState } from "../engine/progressMap";

interface Group {
  lines: { key: string; cls?: string }[];
  /** [typeStart, typeEnd, eraseStart, eraseEnd] in voice-local time. Erase pair may be omitted. */
  win: [number, number, number?, number?];
}

const GROUPS: Group[] = [
  { lines: [{ key: "a1" }, { key: "a2" }], win: [0.0, 0.14, 0.18, 0.22] },
  {
    lines: [{ key: "b1" }, { key: "b2" }, { key: "b3", cls: "vm-num" }],
    win: [0.24, 0.42, 0.46, 0.5],
  },
  { lines: [{ key: "c1", cls: "vm-big" }, { key: "c2" }], win: [0.52, 0.66, 0.7, 0.74] },
  { lines: [{ key: "d1" }, { key: "d2" }, { key: "d3" }], win: [0.76, 0.94] },
];

interface VoiceMonologueProps {
  frameRef: React.RefObject<NacimientoState>;
}

export function VoiceMonologue({ frameRef }: VoiceMonologueProps) {
  const { t } = useI18n();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const tick = () => {
      const st = frameRef.current;
      const box = boxRef.current;
      if (!box) return;
      if (!st || st.beat !== "voice") return;
      const v = st.local;

      let html = "";
      for (const g of GROUPS) {
        const [t0, t1, e0, e1] = g.win;
        if (v < t0) break;
        const texts = g.lines.map((l) => t(`lm0.voice.${l.key}`));
        const total = texts.reduce((a, s) => a + s.length, 0);
        let chars: number;
        if (e0 !== undefined && e1 !== undefined && v >= e0) {
          chars = Math.floor((1 - clamp01((v - e0) / (e1 - e0))) * total);
        } else {
          chars = Math.floor(clamp01((v - t0) / (t1 - t0)) * total);
        }
        if (chars <= 0) {
          html = "";
          continue;
        }
        let used = 0;
        let caretPlaced = false;
        const parts: string[] = [];
        for (let i = 0; i < g.lines.length; i++) {
          const text = texts[i];
          const take = Math.max(0, Math.min(text.length, chars - used));
          used += text.length;
          const cls = g.lines[i].cls ?? "";
          const isLast = take > 0 && (used >= chars || i === g.lines.length - 1);
          const caret =
            !caretPlaced && isLast
              ? `<span class="lm0-caret" data-blink="${take >= text.length ? "true" : "false"}" aria-hidden="true"></span>`
              : "";
          if (caret) caretPlaced = true;
          parts.push(`<div class="${cls}">${esc(text.slice(0, take))}${caret}</div>`);
        }
        html = parts.join("");
      }
      box.innerHTML = html;
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [frameRef, t]);

  return <div ref={boxRef} className="lm0-voicebox" aria-hidden="true" />;
}
