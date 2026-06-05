"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useReducedMotion } from "framer-motion";

import { CaptionLine, MONO, SERIF } from "@/features/lab/components/ngram/kit";
import { contextSpace, ngramStream } from "@/features/lab/data/ngramData";

/**
 * §4 · BookFirehose — "vierte un OCÉANO de texto y la tabla de 4 letras NO se llena" (spine `s4-firehose`).
 *
 * CONTEXT. Entering, the reader just felt (ExplosionZoom) that the 4-letter table is ASTRONOMICALLY large.
 * The natural next thought: "vale, es enorme… pero con MUCHÍSIMO más texto se llenará". This widget kills
 * that hope viscerally.
 *
 * THE ONE IDEA (a stranger must DEDUCE it just by looking): you open a firehose, a TORRENT of real text
 * gushes down and the letter-counter EXPLODES (mil → millón → mil millones → billones), yet the single big
 * vessel for the 4-letter table barely fills — a thin sediment stuck near the bottom, stamped ATASCADA.
 * Ocean in, nothing fills. The HERO is that contrast: torrent (infinite) vs. fill-line (frozen).
 *
 * HERO (single, central, dominant): ONE tall glass vessel = "la tabla de 4 LETRAS". A firehose pours real
 * Shakespeare letters into it from the top; the stream THICKENS and SPEEDS UP every press. The water line
 * inside creeps a sliver per press and locks near the bottom with an ATASCADA waterline. Beside the spout, a
 * single exploding counter shows how much text you've poured (the ocean). Nothing competes with the vessel.
 *
 * SUPPORTING (tiny, subordinate): a one-line footnote "1·2·3 letras: llenas al instante" with check marks —
 * so a stranger knows the short tables DID fill, which is exactly why 4 letras being stuck is the shock.
 *
 * MECHANIC. Press count p (0..MAX) drives EVERYTHING off one number, so it is identical under reduced motion
 * (the capture harness) and under animation — only the easing differs. Each press multiplies the ocean by
 * POUR_FACTOR (counter flies across magnitudes) and adds one honest saturation step to the 4-letter fill,
 * which is mathematically pinned near its true ceiling so it visibly crawls but never rises far. The
 * functional gate (_3 ≠ _0) is guaranteed: counter and fill both step on every press. A rAF eases the water
 * line + animates falling glyphs when motion is allowed; under reduced motion it jumps to the target.
 *
 * FILL MODEL (honest). Natural text only ever exercises a tiny share of 27^4 slots — measured ceiling ≈ 8.5%.
 * fill(p) = CEIL · (1 − (1 − ABSORB)^(p+1)); CEIL = 0.085, ABSORB tuned so it lands ~1% at rest and crawls to
 * a few % after a whole ocean. The denominator shown (27^4 = 531 441 casillas) is real (contextSpace(4)).
 *
 * Tokens-only, [data-ngram-theme], memo, "use client", self-mounting; reduced-motion safe; rAF cancels on unmount.
 */

/** Real corpus length (letters in one "libro"/corpus). ≈ 284 854. */
const CORPUS_LEN = ngramStream().length;

/** The hero gauge: the 4-letter table. Denominator = real 27^4 slots. */
const HERO_SLOTS = contextSpace(4);   // 531 441
const HERO_CEIL = 0.085;              // measured Shakespeare ceiling for 4-letter contexts
const HERO_ABSORB = 0.16;             // share of the remaining gap one press closes

const START_CORPORA = 1;              // one corpus already poured at rest
const POUR_FACTOR = 22;               // each press multiplies the ocean → magnitudes fly across the readout
const MAX_PRESSES = 5;                // five presses beyond rest reaches "billones"

/** Honest coupon-collector fill (0..1) of the 4-letter table after p presses. */
function heroFill(p: number): number {
    return HERO_CEIL * (1 - Math.pow(1 - HERO_ABSORB, p + 1));
}

/** Format a big letter count compactly in Spanish so the magnitude READS (mil → millón → mil millones …). */
function letterLabel(n: number): { value: string; unit: string } {
    if (n < 1_000) return { value: Math.round(n).toLocaleString("es-ES"), unit: "letras" };
    if (n < 1_000_000) return { value: (n / 1_000).toFixed(n < 10_000 ? 1 : 0), unit: "mil letras" };
    if (n < 1_000_000_000) return { value: (n / 1_000_000).toFixed(n < 10_000_000 ? 1 : 0), unit: "millones de letras" };
    if (n < 1_000_000_000_000) return { value: (n / 1_000_000_000).toFixed(n < 10_000_000_000 ? 1 : 0), unit: "mil millones de letras" };
    return { value: (n / 1_000_000_000_000).toFixed(1), unit: "billones de letras" };
}

/** Anchor the abstract letter count to something graspable: how many WHOLE BOOKS that text would be.
 *  "1,5 billones de letras" means nothing; "≈ 5 millones de libros enteros" lands. */
function booksLabel(n: number): { value: string; unit: string } {
    if (n < 1_000) return { value: Math.round(n).toLocaleString("es-ES"), unit: n < 2 ? "libro" : "libros enteros" };
    if (n < 1_000_000) return { value: (n / 1_000).toFixed(0), unit: "mil libros" };
    if (n < 1_000_000_000) return { value: (n / 1_000_000).toFixed(n < 10_000_000 ? 1 : 0), unit: "millones de libros" };
    return { value: (n / 1_000_000_000).toFixed(1), unit: "mil millones de libros" };
}

/** A short ribbon of real corpus letters to rain down the spout (deterministic, no Math.random). */
const RAIN_SAMPLE = (() => {
    const s = ngramStream();
    // pull a clean slice of letters (skip the leading region), strip spaces so the rain reads as glyphs
    const slice = s.slice(2000, 2400).replace(/ /g, "");
    return (slice + "abcdefghijklmnopqrstuvwxyz").slice(0, 240);
})();

export interface BookFirehoseProps {
    accent?: "ngram";
}

export const BookFirehose = memo(function BookFirehose({ accent }: BookFirehoseProps) {
    void accent;
    const reduce = useReducedMotion() === true;

    // ONE source of truth: how many presses (continuous, eased) of pouring we are at.
    const [p, setP] = useState(0);
    const [pouring, setPouring] = useState(false);
    const [target, setTarget] = useState(0); // integer press target as STATE (read during render, not the ref)
    const targetRef = useRef(0);          // integer press target (steps) — mirror of `target` for the rAF loop
    const curRef = useRef(0);             // eased continuous value
    const rafRef = useRef<number | null>(null);
    const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const animateTo = useCallback((target: number) => {
        if (reduce) {
            curRef.current = target;
            setP(target);
            return;
        }
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        setPouring(true);
        const step = () => {
            const cur = curRef.current;
            const next = cur + (target - cur) * 0.12;
            if (target - next < 0.004) {
                curRef.current = target;
                setP(target);
                rafRef.current = null;
                if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
                stopTimerRef.current = setTimeout(() => setPouring(false), 420);
                return;
            }
            curRef.current = next;
            setP(next);
            rafRef.current = requestAnimationFrame(step);
        };
        rafRef.current = requestAnimationFrame(step);
    }, [reduce]);

    const pour = useCallback(() => {
        const nextTarget = Math.min(MAX_PRESSES, Math.round(targetRef.current) + 1);
        targetRef.current = nextTarget;
        setTarget(nextTarget);
        animateTo(nextTarget);
    }, [animateTo]);

    useEffect(() => () => {
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    }, []);

    // ── derived render values, all from p ──
    const corpora = START_CORPORA * Math.pow(POUR_FACTOR, p);
    const letters = corpora * CORPUS_LEN;
    const { value: lettersValue, unit: lettersUnit } = letterLabel(letters);
    const { value: booksValue, unit: booksUnit } = booksLabel(corpora);

    const fillFrac = heroFill(p);                  // 0..1 of the 27^4 table
    const fillPct = fillFrac * 100;                // ~0.5% .. ~5%
    const filledSlots = Math.round(fillFrac * HERO_SLOTS);

    const started = p > 0.05;
    const atMax = target >= MAX_PRESSES && p > MAX_PRESSES - 0.05;

    // Stream intensity grows with how hard the hose is open (target, not eased) — thicker, faster, more streaks.
    const intensity = Math.min(1, target / MAX_PRESSES);

    // Falling glyphs: a fixed set of columns; their density/speed scale with intensity. Deterministic positions
    // spread EVENLY across the spout mouth (a golden-ratio jitter so it reads as a torrent, not a grid).
    const drops = useMemo(() => {
        const N = 22;
        return Array.from({ length: N }, (_, i) => {
            const jitter = ((i * 0.6180339887) % 1) * 9 - 4.5; // ±4.5% deterministic jitter
            return {
                id: i,
                x: 8 + (i / (N - 1)) * 84 + jitter, // 8%..92% evenly, jittered
                delay: ((i * 137) % 100) / 100,
                dur: 0.7 + ((i * 53) % 60) / 100,   // 0.7..1.3s
                ch: RAIN_SAMPLE[(i * 7) % RAIN_SAMPLE.length],
                ch2: RAIN_SAMPLE[(i * 7 + 11) % RAIN_SAMPLE.length],
            };
        });
    }, []);

    // how many drop-columns are "live" at this intensity (rest shows a trickle, full shows a wall of rain)
    const liveDrops = started ? Math.max(6, Math.round(6 + intensity * (drops.length - 6))) : 0;

    return (
        <div className="nw-fh" style={{ fontFamily: SERIF }} data-pouring={pouring ? "1" : "0"} data-started={started ? "1" : "0"}>
            <div className="nw-fh__stage">
                {/* ── LEFT: the ocean counter on the spout. The exploding magnitude. ── */}
                <div className="nw-fh__meter">
                    <span className="nw-fh__meterCap">texto vertido</span>
                    <span className="nw-fh__meterVal" key={lettersValue + lettersUnit}>{lettersValue}</span>
                    <span className="nw-fh__meterUnit">{lettersUnit}</span>
                    {/* the human anchor: that abstract count, in whole books. */}
                    <span className="nw-fh__meterAnchor" data-on={started ? "1" : "0"}>
                        ≈ {booksValue} {booksUnit}
                    </span>
                    <span className="nw-fh__meterSub" data-on={started ? "1" : "0"}>
                        {atMax ? "un océano entero" : started ? "y subiendo…" : "pulsa el grifo →"}
                    </span>
                </div>

                {/* ── CENTER: the firehose + the vessel. THE HERO. ── */}
                <div className="nw-fh__hose">
                    <div className="nw-fh__vesselTop">
                        <span className="nw-fh__vesselN">4</span>
                        <span className="nw-fh__vesselNu">letras de memoria</span>
                    </div>

                    {/* spout */}
                    <div className="nw-fh__spout" data-on={started ? "1" : "0"}>
                        <span className="nw-fh__spoutLip" />
                    </div>

                    {/* the vessel for the 4-letter table — it almost never fills */}
                    <div className="nw-fh__vessel">
                        {/* the falling torrent of real letters (rain), flowing from the spout INTO the glass.
                            Under reduced motion (the capture harness) we freeze the glyphs at STATIC distributed
                            heights so the torrent still reads in a still. */}
                        <div className="nw-fh__rain" aria-hidden style={{ ["--intensity" as string]: intensity }}>
                            {drops.slice(0, liveDrops).map((d, i) => (
                                <span
                                    key={d.id}
                                    className="nw-fh__drop"
                                    style={
                                        reduce
                                            ? {
                                                  left: `${d.x}%`,
                                                  top: `${2 + ((i * 19) % 118)}px`,
                                                  animation: "none",
                                                  opacity: 0.55 + ((i * 7) % 40) / 100,
                                              }
                                            : {
                                                  left: `${d.x}%`,
                                                  animationDelay: `${d.delay * d.dur}s`,
                                                  animationDuration: `${d.dur / (0.7 + intensity * 0.9)}s`,
                                              }
                                    }
                                >
                                    <span className="nw-fh__dropCh">{d.ch}</span>
                                    <span className="nw-fh__dropCh nw-fh__dropCh2">{d.ch2}</span>
                                </span>
                            ))}
                            <span className="nw-fh__sheet" data-on={started ? "1" : "0"} />
                        </div>

                        <div className="nw-fh__glassWrap">
                            <div className="nw-fh__glass">
                                {/* the empty enormity of the table, rendered as faint grid rows that never light up */}
                                <span className="nw-fh__grid" aria-hidden />

                                {/* the unreachable top — labels the void so the stranger sees "all this stays empty".
                                    Gated: only after first pour so the conclusion is deduced, not announced. */}
                                <span className="nw-fh__void" data-visible={started ? "1" : "0"}>queda vacío</span>

                                {/* the sediment that actually settled — the fill */}
                                <div className="nw-fh__liquid" style={{ height: `${Math.max(1.6, fillPct)}%` }}>
                                    <span className="nw-fh__liquidSurface" />
                                </div>
                            </div>

                            {/* ATASCADA waterline overlay — OUTSIDE the clipped glass so its tag never gets cut.
                                Jutting LEFT (toward the counter) so the "ocean in / level stuck" read is one line.
                                GATING: only visible after the user has poured (started); at frame 0 this is hidden
                                so the verdict emerges from interaction, not announced up front. */}
                            <div className="nw-fh__line" data-visible={started ? "1" : "0"} style={{ bottom: `${Math.max(1.6, fillPct)}%` }}>
                                <span className="nw-fh__lineTag">se para aquí · {fillPct < 1 ? fillPct.toFixed(1) : Math.round(fillPct)}% lleno</span>
                                <span className="nw-fh__lineDash" />
                            </div>
                        </div>

                        <div className="nw-fh__vesselFoot" title={`${filledSlots.toLocaleString("es-ES")} de ${HERO_SLOTS.toLocaleString("es-ES")} casillas`}>
                            <span className="nw-fh__footNum">{filledSlots.toLocaleString("es-ES")}</span>
                            <span className="nw-fh__footOf">de {HERO_SLOTS.toLocaleString("es-ES")} casillas</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* tiny subordinate footnote: the short tables filled instantly — that's why 4 is the shock */}
            <div className="nw-fh__short">
                <span className="nw-fh__shortItem"><b>1</b> letra ✓</span>
                <span className="nw-fh__shortDot">·</span>
                <span className="nw-fh__shortItem"><b>2</b> letras ✓</span>
                <span className="nw-fh__shortDot">·</span>
                <span className="nw-fh__shortItem"><b>3</b> letras ✓</span>
                <span className="nw-fh__shortNote">llenas al instante con el primer libro</span>
            </div>

            <CaptionLine gap={12}>
                {atMax
                    ? "millones de libros vertidos y la tabla apenas se ha llenado: se queda «atascada», por mucho texto que eches"
                    : started
                      ? "más y más texto cae · y el nivel de 4 letras apenas sube"
                      : "abre el grifo: vierte un océano de texto en la tabla de 4 letras"}
            </CaptionLine>

            <button
                type="button"
                className="nw-fh__tap"
                data-pouring={pouring ? "1" : "0"}
                onClick={pour}
                disabled={atMax}
                aria-label={atMax ? "no cabe más texto" : "abrir el grifo y verter más texto"}
            >
                {atMax ? "no cabe más océano" : started ? "verter aún más" : "abrir el grifo"}
            </button>

            <style>{`
                .nw-fh {
                    width: 100%; max-width: 720px; margin: 0 auto;
                    display: flex; flex-direction: column; align-items: center; gap: 16px;
                    text-align: center; user-select: none;
                }

                .nw-fh__stage {
                    position: relative; width: 100%;
                    display: grid; grid-template-columns: 1fr 320px; align-items: stretch; gap: 0;
                    border-radius: var(--ngram-r-md);
                    background:
                        radial-gradient(120% 80% at 70% 0%, color-mix(in oklab, var(--ngram-accent) 6%, transparent) 0%, transparent 55%),
                        var(--ngram-bg);
                    border: 1px solid var(--ngram-rule-2);
                    box-shadow: inset 0 1px 0 color-mix(in oklab, var(--ngram-ink) 5%, transparent);
                    padding: 34px 36px 28px;
                    overflow: hidden;
                }

                /* ── LEFT: the exploding ocean counter ── */
                .nw-fh__meter {
                    display: flex; flex-direction: column; align-items: flex-start; justify-content: center;
                    text-align: left; padding-right: 22px;
                    border-right: 1px solid var(--ngram-rule);
                }
                .nw-fh__meterCap {
                    font-family: ${MONO}; font-size: 11px; font-weight: 800; letter-spacing: .16em;
                    text-transform: uppercase; color: var(--ngram-muted);
                }
                .nw-fh__meterVal {
                    font-family: ${MONO}; font-variant-numeric: tabular-nums;
                    font-size: clamp(48px, 9vw, 76px); font-weight: 800; line-height: .96;
                    letter-spacing: -.02em; color: var(--ngram-accent-bright);
                    margin-top: 8px;
                    text-shadow: 0 0 28px color-mix(in oklab, var(--ngram-accent-bright) 36%, transparent);
                    animation: nw-fh-pop .42s cubic-bezier(.2,.9,.2,1);
                }
                @keyframes nw-fh-pop {
                    0% { transform: scale(.82); opacity: .35; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .nw-fh__meterUnit {
                    font-family: ${MONO}; font-size: 14px; font-weight: 700; letter-spacing: .04em;
                    color: var(--ngram-accent); margin-top: 6px;
                }
                .nw-fh__meterAnchor {
                    font-family: ${SERIF}; font-style: italic; font-size: 14px; line-height: 1.3;
                    color: var(--ngram-ink-2); margin-top: 8px; opacity: 0; transition: opacity .3s ease;
                }
                .nw-fh__meterAnchor[data-on="1"] { opacity: 1; }
                .nw-fh__meterSub {
                    font-family: ${SERIF}; font-style: italic; font-size: 14.5px; line-height: 1.35;
                    color: var(--ngram-muted); margin-top: 14px; max-width: 16ch;
                }
                .nw-fh__meterSub[data-on="1"] { color: var(--ngram-accent-ink); }

                /* ── CENTER: firehose + vessel ── */
                .nw-fh__hose {
                    position: relative; display: flex; flex-direction: column; align-items: center;
                    padding-left: 22px;
                }
                .nw-fh__spout {
                    position: relative; width: 96px; height: 18px; z-index: 3;
                    border-radius: 6px 6px 3px 3px;
                    background: linear-gradient(180deg,
                        color-mix(in oklab, var(--ngram-ink) 26%, var(--ngram-bg-2)),
                        color-mix(in oklab, var(--ngram-ink) 14%, var(--ngram-bg-2)));
                    box-shadow: inset 0 1px 0 color-mix(in oklab, #fff 14%, transparent),
                                0 2px 6px color-mix(in oklab, var(--ngram-ink) 22%, transparent);
                }
                .nw-fh__spoutLip {
                    position: absolute; left: 50%; bottom: -5px; transform: translateX(-50%);
                    width: 40px; height: 8px; border-radius: 0 0 5px 5px;
                    background: color-mix(in oklab, var(--ngram-ink) 30%, var(--ngram-bg-2));
                    transition: background .25s ease;
                }
                .nw-fh__spout[data-on="1"] .nw-fh__spoutLip {
                    background: var(--ngram-accent);
                    box-shadow: 0 0 14px color-mix(in oklab, var(--ngram-accent-bright) 70%, transparent);
                }

                /* falling torrent of real letters — a dense central column flowing INTO the glass mouth.
                   Anchored to the vessel: starts at the spout (top:-22px) and rains down over the glass top. */
                .nw-fh__rain {
                    position: absolute; left: 50%; transform: translateX(-50%); top: -22px; height: 150px; z-index: 4;
                    pointer-events: none; overflow: hidden;
                    width: 200px;
                }
                .nw-fh__drop {
                    position: absolute; top: -18px;
                    display: flex; flex-direction: column; align-items: center; gap: 11px;
                    font-family: ${MONO}; font-size: 13px; font-weight: 800;
                    color: var(--ngram-accent-bright);
                    text-shadow: 0 0 8px color-mix(in oklab, var(--ngram-accent-bright) 55%, transparent);
                    animation-name: nw-fh-fall; animation-timing-function: linear;
                    animation-iteration-count: infinite;
                    will-change: transform, opacity;
                }
                .nw-fh__dropCh { line-height: 1; }
                .nw-fh__dropCh2 { opacity: .55; font-size: 11px; }
                @keyframes nw-fh-fall {
                    0% { transform: translateY(-22px); opacity: 0; }
                    16% { opacity: 1; }
                    84% { opacity: 1; }
                    100% { transform: translateY(118px); opacity: 0; }
                }
                /* a soft translucent sheet so the torrent reads as WATER even in a frozen capture */
                .nw-fh__sheet {
                    position: absolute; left: 50%; top: 0; transform: translateX(-50%);
                    width: calc(30px + var(--intensity, 0) * 64px); height: 100%;
                    border-radius: 0 0 40% 40% / 0 0 18px 18px;
                    background: linear-gradient(180deg,
                        color-mix(in oklab, var(--ngram-accent-bright) 48%, transparent) 0%,
                        color-mix(in oklab, var(--ngram-accent) 24%, transparent) 55%,
                        transparent 100%);
                    opacity: 0; transition: opacity .3s ease, width .3s ease;
                    filter: blur(1px);
                }
                .nw-fh__sheet[data-on="1"] { opacity: calc(.3 + var(--intensity, 0) * .5); }

                /* THE VESSEL — the hero. A tall glass that almost never fills. */
                .nw-fh__vessel {
                    position: relative; z-index: 1; margin-top: 4px;
                    display: flex; flex-direction: column; align-items: center; width: 100%;
                }
                .nw-fh__vesselTop {
                    display: flex; align-items: baseline; gap: 9px; margin-bottom: 4px;
                }
                .nw-fh__vesselN {
                    font-family: ${MONO}; font-size: 30px; font-weight: 800; line-height: 1;
                    color: var(--ngram-ink);
                }
                .nw-fh__vesselNu {
                    font-family: ${MONO}; font-size: 10.5px; font-weight: 700; letter-spacing: .12em;
                    text-transform: uppercase; color: var(--ngram-muted);
                }

                /* wrap holds the glass (clipped) + the waterline overlay (NOT clipped) */
                .nw-fh__glassWrap { position: relative; width: 200px; }
                .nw-fh__glass {
                    position: relative; width: 200px; height: 260px;
                    border-radius: 4px 4px 16px 16px;
                    background:
                        linear-gradient(180deg,
                            color-mix(in oklab, var(--ngram-ink) 4%, var(--ngram-bg-2)),
                            color-mix(in oklab, var(--ngram-ink) 9%, var(--ngram-bg-2)));
                    box-shadow:
                        inset 0 2px 6px color-mix(in oklab, var(--ngram-ink) 20%, transparent),
                        inset 0 0 0 2px color-mix(in oklab, var(--ngram-ink) 14%, transparent),
                        inset -10px 0 18px color-mix(in oklab, var(--ngram-ink) 10%, transparent);
                    overflow: hidden;
                }
                /* faint grid = the enormous empty table; rows never light up (that's the point) */
                .nw-fh__grid {
                    position: absolute; inset: 0;
                    background-image:
                        repeating-linear-gradient(0deg,
                            transparent 0, transparent 11px,
                            color-mix(in oklab, var(--ngram-ink) 7%, transparent) 11px,
                            color-mix(in oklab, var(--ngram-ink) 7%, transparent) 12px);
                    opacity: .8;
                }
                .nw-fh__void {
                    position: absolute; top: 18px; left: 0; right: 0;
                    font-family: ${MONO}; font-size: 11px; font-weight: 700; letter-spacing: .26em;
                    text-transform: uppercase; color: var(--ngram-dim);
                    opacity: 0; transition: opacity .35s ease;
                }
                .nw-fh__void[data-visible="1"] { opacity: .7; }

                .nw-fh__liquid {
                    position: absolute; left: 0; right: 0; bottom: 0;
                    background: linear-gradient(180deg,
                        var(--ngram-accent-bright),
                        var(--ngram-accent) 45%,
                        var(--ngram-accent-deep));
                    box-shadow: 0 0 22px color-mix(in oklab, var(--ngram-accent-bright) 60%, transparent),
                                inset 0 2px 0 color-mix(in oklab, #fff 24%, transparent);
                    transition: height .22s cubic-bezier(.3,.7,.3,1);
                    border-radius: 0 0 14px 14px;
                }
                .nw-fh__liquidSurface {
                    position: absolute; left: 0; right: 0; top: -2px; height: 4px;
                    background: color-mix(in oklab, #fff 55%, var(--ngram-accent-bright));
                    opacity: .8;
                }

                /* waterline overlay: a dashed rule across the glass + a tag jutting to the LEFT (uncut).
                   Hidden at frame 0 (data-visible="0") so the verdict is gated behind interaction. */
                .nw-fh__line {
                    position: absolute; left: 0; right: 0; height: 0;
                    display: flex; align-items: center;
                    transition: bottom .22s cubic-bezier(.3,.7,.3,1), opacity .35s ease;
                    pointer-events: none; z-index: 5;
                    opacity: 0;
                }
                .nw-fh__line[data-visible="1"] { opacity: 1; }
                .nw-fh__lineDash {
                    flex: 1; height: 0;
                    border-top: 2px dashed color-mix(in oklab, var(--ngram-wrong) 85%, transparent);
                }
                .nw-fh__lineTag {
                    order: -1; /* tag on the LEFT of the dash */
                    transform: translateX(-58%);
                    font-family: ${MONO}; font-size: 11px; font-weight: 800; letter-spacing: .1em;
                    color: #fff; background: var(--ngram-wrong);
                    padding: 5px 10px; border-radius: 999px; white-space: nowrap;
                    box-shadow: 0 2px 12px color-mix(in oklab, var(--ngram-wrong) 60%, transparent);
                }

                .nw-fh__vesselFoot {
                    display: flex; flex-direction: column; align-items: center; line-height: 1.2;
                    margin-top: 10px;
                }
                .nw-fh__footNum {
                    font-family: ${MONO}; font-variant-numeric: tabular-nums; font-size: 15px; font-weight: 800;
                    color: var(--ngram-ink-2);
                }
                .nw-fh__footOf { font-family: ${MONO}; font-size: 11px; color: var(--ngram-dim); }

                /* ── tiny subordinate footnote ── */
                .nw-fh__short {
                    display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 8px;
                    font-family: ${MONO}; font-size: 12px; color: var(--ngram-muted);
                }
                .nw-fh__shortItem b { color: var(--ngram-accent-ink); font-weight: 800; }
                .nw-fh__shortDot { color: var(--ngram-dim); }
                .nw-fh__shortNote {
                    font-family: ${SERIF}; font-style: italic; font-size: 13px; color: var(--ngram-dim);
                    margin-left: 4px;
                }

                /* ── control ── */
                .nw-fh__tap {
                    font-family: ${MONO}; font-size: 12.5px; letter-spacing: .1em; text-transform: uppercase;
                    font-weight: 700; padding: 13px 30px; border-radius: var(--ngram-r-pill); border: 0;
                    background: var(--ngram-accent); color: var(--ngram-on-accent); cursor: pointer;
                    transition: background .2s ease, transform .12s ease, box-shadow .2s ease;
                    box-shadow: 0 2px 12px color-mix(in oklab, var(--ngram-accent) 36%, transparent);
                }
                .nw-fh__tap:hover:not(:disabled) { background: var(--ngram-accent-bright); transform: translateY(-1px); }
                .nw-fh__tap:active:not(:disabled) { transform: scale(0.97); }
                .nw-fh__tap[data-pouring="1"]:not(:disabled) {
                    background: var(--ngram-accent-bright);
                    box-shadow: 0 0 24px color-mix(in oklab, var(--ngram-accent-bright) 60%, transparent);
                }
                .nw-fh__tap:disabled {
                    cursor: default; background: transparent; color: var(--ngram-dim);
                    box-shadow: inset 0 0 0 1px var(--ngram-rule-2);
                }

                @media (max-width: 640px) {
                    .nw-fh__stage { grid-template-columns: 1fr; gap: 18px; padding: 22px 16px 18px; }
                    .nw-fh__meter { border-right: 0; border-bottom: 1px solid var(--ngram-rule); padding: 0 0 16px; align-items: center; text-align: center; }
                    .nw-fh__meterSub { max-width: none; }
                    .nw-fh__hose { padding-left: 0; }
                    .nw-fh__glass { width: 180px; height: 220px; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .nw-fh__drop { animation: none; }
                    .nw-fh__meterVal { animation: none; }
                    .nw-fh__liquid, .nw-fh__line { transition: none; }
                }
            `}</style>
        </div>
    );
});

export default BookFirehose;
