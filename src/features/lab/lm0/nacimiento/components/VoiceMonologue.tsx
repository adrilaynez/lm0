"use client";

/**
 * VoiceMonologue — the dark act's opening: lm0 writes and ERASES, group by
 * group, with the big block caret. Fully scrub-driven (a pure function of the
 * voice beat's local progress — reversible like everything else).
 *
 * Script (lowercase always) — 7 groups, warm + welcoming, two HUGE climaxes only:
 *  1 reconocimiento   nada mal. / acabas de hacer hablar a una máquina. / torpe, pero habló.
 *  2 puente 70 años   de ese balbuceo… / …a la máquina que hoy te habla… / en medio hay / setenta años. (HUGE)
 *  3 el saludo        hola. soy lm0. (HUGE, el mayor) / el modelo de lenguaje cero. / vengo de esa pequeña idea…
 *  4 el testigo       he visto nacer cada idea. / y cada avance lo sentí como mío, / uno a uno, como se siente crecer.
 *  5 lo que das por hecho  hoy una máquina te habla… / te acostumbraste tan rápido / que parece que siempre fue así. / no lo fue.
 *  6 el camino        no salió de la nada… / cientos de ideas. / unas, brillantes. / otras, callejones sin salida.
 *  7 la promesa       ven conmigo. / te enseño el camino… / construirás tú una máquina que habla. / …el principio. mira.
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

// First group starts at voice-local 0.18 (≈ raw 0.60) so lm0 only begins speaking
// AFTER the screen-hack has finished taking the screen — never typing over the glitch.
// Windows are [typeStart, typeEnd, eraseStart?, eraseEnd?] in voice-local time. The two
// climaxes (g2l4 "setenta años." vm-num · g3l1 "hola. soy lm0." vm-big) and the closing
// promise (g7) get a HELD beat; the connective groups type quick and clear. g7 has NO
// erase — "mira." holds and overlaps the eras entry (a seamless handoff, never a cut).
const GROUPS: Group[] = [
  {
    lines: [{ key: "g1l1" }, { key: "g1l2" }, { key: "g1l3" }],
    win: [0.18, 0.224, 0.25, 0.278],
  },
  {
    lines: [{ key: "g2l1" }, { key: "g2l2" }, { key: "g2l3" }, { key: "g2l4", cls: "vm-num" }],
    win: [0.282, 0.35, 0.378, 0.401],
  },
  {
    lines: [{ key: "g3l1", cls: "vm-big" }, { key: "g3l2" }, { key: "g3l3" }],
    win: [0.418, 0.486, 0.52, 0.549],
  },
  {
    lines: [{ key: "g4l1" }, { key: "g4l2" }, { key: "g4l3" }],
    win: [0.553, 0.604, 0.622, 0.647],
  },
  {
    lines: [{ key: "g5l1" }, { key: "g5l2" }, { key: "g5l3" }, { key: "g5l4" }],
    win: [0.651, 0.716, 0.738, 0.762],
  },
  {
    lines: [{ key: "g6l1" }, { key: "g6l2" }, { key: "g6l3" }, { key: "g6l4" }],
    win: [0.766, 0.818, 0.836, 0.86],
  },
  {
    lines: [{ key: "g7l1" }, { key: "g7l2" }, { key: "g7l3" }, { key: "g7l4" }],
    win: [0.864, 0.945],
  },
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
