"use client";

/**
 * NoteReveal — the creator's letter, on a framed cream sheet that lm0 TYPES and
 * LEAVES WRITTEN. The full letter is rendered server-side (selectable, SEO, no-JS
 * safe); on mount, when the sheet scrolls into view, lm0 types it once — lines
 * accumulate and stay at full ink, the green caret rides the frontier and then
 * parks and blinks at the end. The single serif pull-line is revealed (fade), not
 * typed (typed serif looks wrong). Click the sheet to complete it instantly.
 * Reduced motion shows the whole letter at once, no typing, caret parked.
 */

import { useEffect, useRef } from "react";

interface NoteRevealProps {
  intro: string;
  tag: string;
  lines: string[];
  pullIndex: number;
  signature: string;
}

export function NoteReveal({ intro, tag, lines, pullIndex, signature }: NoteRevealProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const lineEls = Array.from(body.querySelectorAll<HTMLElement>(".lm0-note-line"));
    const caret = body.querySelector<HTMLElement>(".lm0-note-caret");
    if (!lineEls.length || !caret) return;

    // the real, final texts (baked in by SSR) — captured before we clear to type
    const texts = lineEls.map((el) => el.textContent ?? "");

    const parkCaret = () => {
      lineEls[lineEls.length - 1].appendChild(caret);
      caret.classList.add("is-parked");
    };
    const showAll = () => {
      lineEls.forEach((el, i) => {
        el.textContent = texts[i];
        el.classList.add("is-on");
      });
      parkCaret();
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      showAll();
      return;
    }

    let started = false;
    let done = false;
    const timers: number[] = [];
    const clear = () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers.length = 0;
    };
    const complete = () => {
      if (done) return;
      clear();
      done = true;
      showAll();
    };

    const start = () => {
      if (started) return;
      started = true;
      // lock the sheet to its final height so nothing reflows as text arrives
      body.style.minHeight = `${body.offsetHeight}px`;
      body.classList.add("is-typing");
      lineEls.forEach((el) => {
        el.textContent = "";
      });
      caret.classList.remove("is-parked");
      let li = 0;
      let ci = 0;
      const step = () => {
        if (done) return;
        if (li >= lineEls.length) {
          parkCaret();
          done = true;
          return;
        }
        const el = lineEls[li];
        const text = texts[li];
        if (li === pullIndex) {
          // the serif landmark: reveal whole with a fade, then carry on
          el.textContent = text;
          el.classList.add("is-on");
          el.appendChild(caret);
          li += 1;
          ci = 0;
          timers.push(window.setTimeout(step, 480));
          return;
        }
        if (ci === 0) {
          el.classList.add("is-on");
          el.appendChild(caret);
        }
        if (ci <= text.length) {
          el.textContent = text.slice(0, ci);
          el.appendChild(caret);
          ci += 1;
          timers.push(window.setTimeout(step, 12 + Math.random() * 22));
        } else {
          li += 1;
          ci = 0;
          timers.push(window.setTimeout(step, 150));
        }
      };
      step();
    };

    // start typing once the sheet scrolls into the lower viewport — a scroll
    // listener (not IntersectionObserver, which proved unreliable under Lenis on
    // this page) so the reveal fires for both continuous and jump scrolls
    const onScroll = () => {
      if (started) return;
      if (body.getBoundingClientRect().top < window.innerHeight * 0.85) {
        window.removeEventListener("scroll", onScroll);
        start();
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const raf = requestAnimationFrame(onScroll);

    // a click anywhere on the letter completes it instantly (no waiting to read)
    const sheet = body.closest<HTMLElement>(".lm0-note-sheet");
    const onClick = () => {
      if (started) complete();
      else {
        start();
        complete();
      }
    };
    sheet?.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      clear();
      sheet?.removeEventListener("click", onClick);
    };
  }, [pullIndex]);

  return (
    <div className="lm0-note">
      <p className="lm0-note-intro">
        <span className="lm0-caret" data-blink="true" aria-hidden="true" />
        {intro}
      </p>
      <div className="lm0-note-sheet">
        <div className="lm0-note-bar">
          <span className="lm0-note-tag">{tag}</span>
          <span className="lm0-note-dot" aria-hidden="true" />
        </div>
        <div ref={bodyRef} className="lm0-note-body">
          {lines.map((line, i) => (
            <p
              key={i}
              className={`lm0-note-line${i === pullIndex ? " lm0-note-pull lm0-serif" : ""}`}
            >
              {line}
            </p>
          ))}
          <span className="lm0-note-caret" aria-hidden="true" />
        </div>
        <div className="lm0-note-sign">{signature}</div>
      </div>
    </div>
  );
}
