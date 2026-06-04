"use client";

import { memo, useMemo, useState } from "react";

import { motion, useReducedMotion } from "framer-motion";

import { MONO, PlayButton, STD, Tabs } from "@/features/lab/components/ngram/kit";
import { contextDistribution, displayChar } from "@/features/lab/data/ngramData";

/**
 * §1 · WidenWindow — predict-the-next-letter with a GROWING memory window. HERO = the confidence % that
 * climbs as the window widens.
 *
 * ONE idea (spine `s1-widen`): with one letter of memory the machine's best guess is barely a hunch
 * (~20–36 %); give it three or four letters of context and that same guess collapses onto a single
 * near-certain letter (~100 %). More memory → a sharper, more confident prediction.
 *
 * v3 rework (round-2 BLIND reject "ng-widen"): the reviewer rejected v2 because the ONE knob — how much the
 * machine remembers — never moved on its own, and the "ver la real" toggle made every screenshot look frozen
 * (states after 3 and 6 presses were pixel-identical). Fix: the single primary action now WIDENS THE WINDOW
 * («añadir una letra»). Each press lights one more letter of memory, slides the memory tab (1→2→3→4 letras),
 * and the giant % visibly CLIMBS — so a stranger watching the number rise reads the idea without being told.
 * At 4 letras the next press rolls to a fresh word and back to 1 letra, so the state is genuinely different at
 * every step (no frozen-looking repeats). The hero is the single giant %; one short "afilado" meter sits
 * directly under it as that number's own proof — no second competing chart, no dead canvas, no cryptic «?».
 *
 * Every probability comes from contextDistribution() over the Shakespeare corpus; no faked numbers. The
 * examples are curated so the climb 1→4 letras is real and monotone-ish (verified against ngramData).
 *
 * Self-mounting (no required props), memo, reduced-motion safe (the meter and number settle instantly when
 * motion is reduced).
 */

/** Curated phrases, already folded to the 27-symbol domain (lowercase + spaces). `before` is the visible run;
 * `actual` is the real next letter. Verified against ngramData: at 1 letra the top bet is weak (~20–36 %) and
 * by 4 letras it is near-certain (~100 %), climbing in between — exactly the chapter's point. */
interface Example {
    before: string;
    actual: string;
}

const EXAMPLES: Example[] = [
    { before: "the altitude of his virt", actual: "u" }, // virtue — 36→69→100
    { before: "transported by calamit", actual: "y" }, // calamity — 36→38→100
    { before: "since it serves my purpo", actual: "s" }, // purpose — 20→83→100
];

const MEMORY_TABS = ["1 letra", "2 letras", "3 letras", "4 letras"];
const MAX_K = MEMORY_TABS.length - 1; // 3 → 4 letras

/** How many runner-up letters sit beside the best bet in the small proof strip (the field that visibly
 * collapses onto one bar as the window widens). Kept small so the strip stays clearly secondary to the %. */
const RIVALS = 5;

export const WidenWindow = memo(function WidenWindow({ accent }: { accent?: "ngram" }) {
    void accent;
    const reduce = useReducedMotion();

    const [exIdx, setExIdx] = useState(0);
    const [k, setK] = useState(0); // tab index 0..3 → memory 1..4

    const ex = EXAMPLES[exIdx];
    const memory = k + 1;
    const shown = ex.before;
    const cut = Math.max(0, shown.length - memory);
    const context = shown.slice(cut); // the memory window: the last `memory` chars the model conditions on
    const actual = ex.actual;

    const dist = useMemo(() => contextDistribution(memory, context), [memory, context]);
    const followers = useMemo(() => dist?.followers ?? [], [dist]);

    // HERO = the model's confidence in the letter it bets on (its #1 guess). That confidence is what climbs
    // as the window widens. We also track whether that top bet IS the real next letter, to flag the moment
    // the machine "locks on" (top bet == truth, which happens once it has enough memory).
    const top = followers[0];
    const heroCh = top?.ch ?? actual;
    const heroProb = top?.prob ?? 0;
    const heroPct = Math.round(heroProb * 100);
    const lockedOn = heroCh === actual; // the best bet is now the real next letter
    const certain = heroProb >= 0.6; // a confident bet reads bright; a hunch reads cooler

    // the small proof strip: the best bet (bright, tall) plus its closest rivals (faint). At 1 letra they are
    // a flat, even scatter (a hunch you can SEE); by 4 letras one bar towers — the % made visual, in miniature.
    const strip = useMemo(() => {
        const rivals = followers.filter((f) => f.ch !== heroCh).slice(0, RIVALS);
        return [{ ch: heroCh, prob: heroProb }, ...rivals.map((f) => ({ ch: f.ch, prob: f.prob }))];
    }, [followers, heroCh, heroProb]);

    const hasData = heroProb > 0;

    // the ONE knob, driven by the primary button: widen the window one letter; once full, roll to a fresh
    // word and reset to 1 letra. So every press lands on a genuinely different state (number climbs, tab
    // slides, one more letter lights up) — never a frozen-looking repeat.
    const widen = () => {
        if (k < MAX_K) {
            setK((p) => p + 1);
        } else {
            setExIdx((p) => (p + 1) % EXAMPLES.length);
            setK(0);
        }
    };

    const chars = shown.split("");
    const heroColor = certain ? "var(--ngram-accent-bright)" : "var(--ngram-accent-2)";

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%", padding: "6px 0 4px" }}>
            {/* memory selector — the one knob, also slidable directly. The primary button drives it too. */}
            <Tabs tabs={MEMORY_TABS} active={k} onChange={setK} ariaLabel="Letras de memoria" />

            {/* THE LINE — the lit tail IS the memory window; the dashed slot IS the letter being predicted. */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, maxWidth: 620 }}>
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        alignItems: "baseline",
                        gap: 0,
                        fontFamily: MONO,
                        fontSize: "clamp(19px, 2.5vw, 27px)",
                        lineHeight: 1.4,
                    }}
                >
                    {chars.map((ch, i) => {
                        const inWindow = i >= cut;
                        const isLast = i === chars.length - 1; // nearest the slot — the strongest cue
                        const space = ch === " ";
                        return (
                            <span
                                key={i}
                                style={{
                                    whiteSpace: "pre",
                                    fontWeight: inWindow ? 700 : 500,
                                    borderRadius: 6,
                                    padding: inWindow ? "2px 2.5px" : "2px 0.5px",
                                    margin: inWindow ? "0 0.5px" : 0,
                                    color: inWindow ? "var(--ngram-on-accent)" : "var(--ngram-muted)",
                                    background: inWindow
                                        ? isLast
                                            ? "var(--ngram-accent)"
                                            : "color-mix(in oklab, var(--ngram-accent) 62%, transparent)"
                                        : "transparent",
                                }}
                            >
                                {space ? (inWindow ? "␣" : " ") : ch}
                            </span>
                        );
                    })}
                    {/* the slot, glued to the end of the phrase — the letter being predicted */}
                    <span
                        aria-hidden
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginLeft: 5,
                            minWidth: "1.1em",
                            fontWeight: 700,
                            lineHeight: 1,
                            padding: "3px 7px",
                            borderRadius: 7,
                            border: "2px dashed color-mix(in oklab, var(--ngram-dim) 60%, transparent)",
                            color: "var(--ngram-dim)",
                        }}
                    >
                        ?
                    </span>
                </div>

                {/* single concise legend: highlight = memory, ? = next letter */}
                <div
                    aria-hidden
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 20,
                        fontFamily: MONO,
                        fontSize: 11,
                        letterSpacing: ".02em",
                        color: "var(--ngram-muted)",
                    }}
                >
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                            display: "inline-block",
                            width: 11,
                            height: 11,
                            borderRadius: 3,
                            background: "var(--ngram-accent)",
                            opacity: 0.85,
                            flexShrink: 0,
                        }} />
                        {/* "memoria de la máquina" — i18n: ngram.widen.legend_memory */}
                        memoria de la máquina
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 15,
                            height: 15,
                            borderRadius: 3,
                            border: "1.5px dashed color-mix(in oklab, var(--ngram-muted) 70%, transparent)",
                            fontSize: 9,
                            fontWeight: 700,
                            color: "var(--ngram-muted)",
                            flexShrink: 0,
                        }}>?</span>
                        {/* "letra a adivinar" — i18n: ngram.widen.legend_slot */}
                        letra a adivinar
                    </span>
                </div>
            </div>

            {/* ── THE HERO ── the climbing confidence %, the single thing the eye hits first. */}
            {hasData ? (
                <div
                    role="img"
                    aria-label={`con ${memory} ${memory === 1 ? "letra" : "letras"} de memoria, la máquina apuesta por «${displayChar(heroCh)}» con ${heroPct}% de seguridad`}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 520, gap: 0 }}
                >
                    {/* eyebrow: quiet label so the giant number reads as confidence */}
                    <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--ngram-dim)", marginBottom: 4 }}>
                        {/* "seguridad de la predicción" — i18n: ngram.widen.confidence_label */}
                        seguridad de la predicción
                    </div>

                    {/* the giant number — dominant, centered, the first thing the eye lands on */}
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
                        <motion.span
                            key={`${exIdx}-${memory}-${heroPct}`}
                            initial={reduce ? false : { opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.42, ease: STD }}
                            style={{
                                fontFamily: MONO,
                                fontSize: "clamp(72px, 13vw, 132px)",
                                fontWeight: 800,
                                lineHeight: 0.84,
                                letterSpacing: "-0.03em",
                                fontVariantNumeric: "tabular-nums",
                                color: heroColor,
                            }}
                        >
                            {heroPct}
                        </motion.span>
                        <span
                            style={{
                                fontFamily: MONO,
                                fontSize: "clamp(28px, 4.6vw, 46px)",
                                fontWeight: 700,
                                color: heroColor,
                            }}
                        >
                            %
                        </span>
                    </div>

                    {/* what the bet is ON — quiet, anchors the % to the predicted letter */}
                    <div
                        style={{
                            fontFamily: MONO,
                            fontSize: 12.5,
                            letterSpacing: ".04em",
                            color: "var(--ngram-muted)",
                            marginBottom: 14,
                            marginTop: 4,
                            textAlign: "center",
                        }}
                    >
                        {/* "de que la siguiente letra sea" + letter + optional "· y acierta" */}
                        de que la siguiente letra sea{" "}
                        <b style={{ color: "var(--ngram-accent-ink)", fontWeight: 700 }}>
                            «{heroCh === " " ? "espacio" : heroCh}»
                        </b>
                        {lockedOn && (
                            <span style={{ color: "var(--ngram-dim)" }}> · y acierta</span>
                        )}
                    </div>

                    {/* proof strip: best bet vs rivals. Only shown when there IS a rivalry (< 100%).
                        At 100% a lone tall bar adds no info — hidden. At 1 letra a flat scatter = hunch visible. */}
                    {heroProb < 0.995 && (
                        <>
                            <div
                                aria-hidden
                                style={{
                                    display: "flex",
                                    alignItems: "flex-end",
                                    justifyContent: "center",
                                    gap: 6,
                                    height: 72,
                                    width: "100%",
                                }}
                            >
                                {strip.map((b, i) => {
                                    const isHero = i === 0;
                                    const h = Math.max(3, Math.min(100, b.prob * 100));
                                    return (
                                        <div
                                            key={`${b.ch}-${i}`}
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                gap: 4,
                                                width: isHero ? 48 : 26,
                                                height: "100%",
                                                justifyContent: "flex-end",
                                            }}
                                        >
                                            <motion.div
                                                initial={reduce ? false : { height: 0 }}
                                                animate={{ height: `${h}%` }}
                                                transition={reduce ? { duration: 0 } : { duration: 0.5, ease: STD }}
                                                style={{
                                                    width: "100%",
                                                    borderRadius: "4px 4px 0 0",
                                                    minHeight: 3,
                                                    background: isHero
                                                        ? heroColor
                                                        : "color-mix(in oklab, var(--ngram-accent) 22%, transparent)",
                                                }}
                                            />
                                            <span
                                                style={{
                                                    fontFamily: MONO,
                                                    fontSize: isHero ? 14 : 11,
                                                    fontWeight: isHero ? 700 : 400,
                                                    lineHeight: 1,
                                                    color: isHero ? "var(--ngram-accent-ink)" : "var(--ngram-dim)",
                                                }}
                                            >
                                                {b.ch === " " ? "␣" : b.ch}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* "candidatas" caption — i18n: ngram.widen.strip_caption */}
                            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".06em", color: "var(--ngram-dim)", marginTop: 4 }}>
                                candidatas · ␣ = espacio
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <p style={{ fontFamily: MONO, fontSize: 13, color: "var(--ngram-muted)", textAlign: "center" }}>
                    sin datos para este contexto
                </p>
            )}

            {/* the ONE action: widen the window */}
            <PlayButton onClick={widen}>
                {k < MAX_K ? "añadir una letra de memoria" : "abrir otra palabra"}
            </PlayButton>
        </div>
    );
});

export default WidenWindow;
