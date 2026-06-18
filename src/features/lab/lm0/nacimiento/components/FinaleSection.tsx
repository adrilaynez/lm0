"use client";

/**
 * FinaleSection — the landing closes in two movements.
 *
 *  DARK (we're still inside the screen): the editorial climax, "el viaje"
 *  (EraTimeline) and "los capítulos" (ChapterCards).
 *
 *  LIGHT (the warm epilogue): a "dawn" warms the seam, then —
 *   · the creator's note, a framed letter lm0 types and leaves written (NoteReveal)
 *   · the CTA "el interruptor de fósforo": a typeset line whose hairline lights
 *     phosphor on intent; lm0's caret types it as its last words → /lab/bigram
 *   · "la firma": the page signs itself — lm0's living postscript, the giant
 *     signature, and a studio colophon naming the corpus you trained.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { useI18n } from "@/i18n/context";
import { Link } from "@/i18n/navigation";

import { corpusEn } from "../data/corpus.en";
import { corpusEs } from "../data/corpus.es";

import { ChapterCards } from "./ChapterCards";
import { EraTimeline } from "./EraTimeline";
import { NoteReveal } from "./NoteReveal";

export function FinaleSection() {
  const { t, language } = useI18n();
  const tRoot = useTranslations();
  const attribution = language === "en" ? corpusEn.attribution : corpusEs.attribution;

  const noteLines = useMemo(() => {
    const raw = tRoot.raw("lm0.finale.noteLines");
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [tRoot]);
  const rawPull = tRoot.raw("lm0.finale.notePullIndex");
  const pullIndex = typeof rawPull === "number" ? rawPull : -1;

  // CTA — lm0 types its last line once, when it scrolls into view, then the caret parks
  const ctaTextRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ctaTextRef.current;
    if (!el) return;
    const caret = el.parentElement?.querySelector<HTMLElement>(".lm0-cta-caret");
    const full = el.textContent ?? "";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      caret?.classList.add("is-parked");
      return;
    }
    let started = false;
    const timers: number[] = [];
    const startType = () => {
      if (started) return;
      if (el.getBoundingClientRect().top >= window.innerHeight * 0.85) return;
      started = true;
      window.removeEventListener("scroll", startType);
      el.textContent = "";
      caret?.classList.remove("is-parked");
      let i = 0;
      const step = () => {
        if (i <= full.length) {
          el.textContent = full.slice(0, i);
          i += 1;
          timers.push(window.setTimeout(step, 26 + Math.random() * 26));
        } else {
          caret?.classList.add("is-parked");
        }
      };
      step();
    };
    window.addEventListener("scroll", startType, { passive: true });
    const raf = requestAnimationFrame(startType);
    return () => {
      window.removeEventListener("scroll", startType);
      cancelAnimationFrame(raf);
      timers.forEach((x) => window.clearTimeout(x));
    };
  }, []);

  // footer — github handle is a real link that also copies, with a transient green confirm
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);
  const onCopy = () => {
    try {
      navigator.clipboard?.writeText(t("lm0.finale.footer.sourceVal"));
    } catch {
      /* insecure context / blocked — the <a> still opens, text stays selectable */
    }
    setCopied(true);
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <section className="lm0-finale">
      <div className="lm0-finale-dark">
        <div className="lm0-finale-climax">
          <h2 className="lm0-serif lm0-finale-h1">{t("lm0.finale.h1")}</h2>
          <p className="lm0-serif lm0-finale-h2">{t("lm0.finale.h2")}</p>
          <p className="lm0-finale-sub">{t("lm0.finale.sub")}</p>
        </div>

        <div className="lm0-finale-block">
          <div className="lm0-finale-eyebrow">{t("lm0.finale.journeyTitle")}</div>
          <EraTimeline />
          <p className="lm0-finale-close">{t("lm0.finale.journeyClose")}</p>
        </div>

        <div className="lm0-finale-block">
          <div className="lm0-finale-eyebrow">{t("lm0.finale.chaptersTitle")}</div>
          <ChapterCards />
        </div>
      </div>

      <div className="lm0-finale-light">
        <div className="lm0-finale-dawn" aria-hidden="true" />

        <div className="lm0-epilogue">
          <div className="lm0-epilogue-eyebrow">{t("lm0.finale.epilogueEyebrow")}</div>

          <NoteReveal
            intro={t("lm0.finale.noteIntro")}
            tag={t("lm0.finale.noteTag")}
            lines={noteLines}
            pullIndex={pullIndex}
            signature={t("lm0.finale.noteSignature")}
          />

          <div className="lm0-finale-ctawrap">
            <Link href="/lab/bigram" className="lm0-cta">
              <span className="lm0-cta-kicker">{t("lm0.finale.ctaKicker")}</span>
              <span className="lm0-cta-block">
                <span className="lm0-cta-main">
                  <span className="lm0-cta-label">
                    <span className="lm0-cta-text" ref={ctaTextRef}>
                      {t("lm0.finale.cta")}
                    </span>
                    <span className="lm0-cta-caret" aria-hidden="true" />
                  </span>
                  <svg className="lm0-cta-arrow" viewBox="0 0 16 16" aria-hidden="true">
                    <path
                      d="M2 8h11M9 4l4 4-4 4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="lm0-cta-rule" aria-hidden="true" />
              </span>
              <span className="lm0-ui lm0-cta-sub">{t("lm0.finale.ctaSub")}</span>
            </Link>
          </div>

          <footer className="lm0-firma">
            <p className="lm0-firma-ps">
              {t("lm0.finale.footer.lm0")}
              <span className="lm0-firma-caret" aria-hidden="true" />
            </p>
            <p className="lm0-firma-colophon">
              {t("lm0.finale.footer.colophon")}{" "}
              <span className="lm0-firma-corpus">{attribution}</span>
            </p>
            <div className="lm0-firma-meta">
              <div className="lm0-firma-cell">
                <span className="lm0-firma-k">{t("lm0.finale.footer.kAuthor")}</span>
                <span className="lm0-firma-v">{t("lm0.finale.footer.author")}</span>
              </div>
              <div className="lm0-firma-cell">
                <span className="lm0-firma-k">{t("lm0.finale.footer.kSource")}</span>
                <a
                  className={`lm0-firma-v lm0-firma-copy${copied ? " is-copied" : ""}`}
                  href="https://github.com/adrilaynez"
                  target="_blank"
                  rel="noreferrer"
                  aria-label={t("lm0.finale.footer.copyAria")}
                  onClick={onCopy}
                >
                  {copied ? `${t("lm0.finale.footer.copied")} ✓` : t("lm0.finale.footer.sourceVal")}
                </a>
              </div>
              <div className="lm0-firma-cell">
                <span className="lm0-firma-k">{t("lm0.finale.footer.kMade")}</span>
                <span className="lm0-firma-v">
                  {t("lm0.finale.footer.made")} · {t("lm0.finale.footer.lang")}
                </span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </section>
  );
}
