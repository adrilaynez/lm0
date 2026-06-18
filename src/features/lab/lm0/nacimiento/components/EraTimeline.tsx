"use client";

/**
 * EraTimeline — "el viaje": a horizontal dot timeline of the five eras, drawn in
 * the era accents (cero/today neutral · counting green · learning amber ·
 * attention violet). The connecting line and the dots reveal in sequence the
 * first time the finale scrolls into view (IntersectionObserver → data-revealed,
 * the rest is CSS). Borrows the dot/fill language of ChapterSideRail, laid flat.
 */

import { useEffect, useRef } from "react";

import { useI18n } from "@/i18n/context";

const NODES: { key: string; era?: string; year: string }[] = [
  { key: "cero", year: "startKey" },
  { key: "contar", era: "contar", year: "1948" },
  { key: "aprender", era: "aprender", year: "1986" },
  { key: "atencion", era: "atencion", year: "2017" },
  { key: "hoy", year: "nowKey" },
];

export function EraTimeline() {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.setAttribute("data-revealed", "true");
            io.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="lm0-timeline" aria-hidden="true">
      <div className="lm0-tl-track">
        <div className="lm0-tl-fill" />
      </div>
      <ol className="lm0-tl-nodes">
        {NODES.map((n, i) => (
          <li
            key={n.key}
            className="lm0-tl-node"
            data-era={n.era ?? "neutral"}
            style={{ ["--i" as string]: i }}
          >
            <span className="lm0-tl-dot" />
            <span className="lm0-tl-name">{t(`lm0.finale.tl.${n.key}`)}</span>
            <span className="lm0-tl-year">
              {n.year === "startKey"
                ? t("lm0.finale.tl.start")
                : n.year === "nowKey"
                  ? t("lm0.finale.tl.now")
                  : n.year}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
