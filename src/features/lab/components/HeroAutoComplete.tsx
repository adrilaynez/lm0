"use client";

import {
    memo,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";

import { motion, useReducedMotion } from "framer-motion";

import { useI18n } from "@/i18n/context";

/**
 * HeroAutoComplete — the Bigram chapter's §1 "your brain already does this" visualizer (editorial-green).
 *
 * ONE idea, shown almost instantly: type a single letter and the machine reveals what it thinks comes
 * next — exactly the move your own head makes when "q" pulls a "u" out of you without thinking. The
 * widget frames that mirror: an eyebrow + serif prompt set the brain→machine bridge BEFORE you type;
 * a calm sage panel under the bars lands the honest catch AFTER ("it works, but it understands
 * nothing"), which is the question §2 goes on to answer.
 *
 * The prediction mechanism is unchanged and honest: predictions sit on a FIXED axis (AXIS = 0.50) so
 * a weak guess literally looks weak — we never normalise the winner to 100 %. Each row (grid
 * 74px 1fr auto) shows ONLY the predicted next glyph; the winner's glyph + fill is brightest and
 * lands LAST in a winner-last cascade. The typed glyph flies from the keycap to the winner row on a
 * fresh keystroke. Token-only (--bigram-*), reduced-motion safe.
 *
 * Self-mounting: no required props (reads its data inline and its copy via useI18n), like
 * CorpusCountingIdea. `accent` is accepted for symmetry with the chapter's opt-in convention but the
 * widget is already bigram-only, so it is purely documentary.
 */

// Per-letter top-3 follower probabilities for all 26 letters + space. The shared dataset
// (`bigramCorpora`) only covers a handful of origins (t, h, a, e, o, s) as raw COUNTS — this hero
// needs the full 26-letter PROBABILITY table so any keystroke gets an honest distribution, so the
// table is hand-authored here (plausible English, tuned for legible bars). See "blueprint gap" note.
const BIGRAMS: Record<string, [string, number][]> = {
    a: [["n", 0.31], ["r", 0.18], ["t", 0.15]],
    b: [["e", 0.38], ["u", 0.21], ["l", 0.14]],
    c: [["o", 0.29], ["h", 0.22], ["e", 0.19]],
    d: [[" ", 0.35], ["e", 0.28], ["i", 0.12]],
    e: [[" ", 0.37], ["r", 0.2], ["n", 0.13]],
    f: [[" ", 0.27], ["o", 0.22], ["r", 0.16]],
    g: [[" ", 0.29], ["e", 0.25], ["r", 0.13]],
    h: [["e", 0.49], ["i", 0.21], ["a", 0.14]],
    i: [["n", 0.36], ["t", 0.18], ["s", 0.14]],
    j: [["u", 0.55], ["o", 0.22], ["e", 0.11]],
    k: [[" ", 0.42], ["e", 0.24], ["i", 0.12]],
    l: [["l", 0.27], ["e", 0.24], ["y", 0.13]],
    m: [["e", 0.3], ["a", 0.25], ["o", 0.14]],
    n: [[" ", 0.38], ["g", 0.18], ["t", 0.14]],
    o: [["n", 0.28], ["r", 0.22], ["f", 0.17]],
    p: [["r", 0.29], ["e", 0.24], ["o", 0.16]],
    q: [["u", 0.92], ["i", 0.05], ["a", 0.02]],
    r: [["e", 0.33], [" ", 0.25], ["i", 0.14]],
    s: [[" ", 0.29], ["t", 0.22], ["e", 0.18]],
    t: [["h", 0.52], ["e", 0.19], ["i", 0.1]],
    u: [["r", 0.26], ["n", 0.22], ["s", 0.15]],
    v: [["e", 0.65], ["i", 0.19], ["a", 0.09]],
    w: [["i", 0.28], ["h", 0.25], ["a", 0.18]],
    x: [["t", 0.38], ["p", 0.22], ["e", 0.15]],
    y: [[" ", 0.45], ["o", 0.18], ["e", 0.12]],
    z: [["e", 0.48], ["a", 0.2], ["i", 0.14]],
    " ": [["t", 0.18], ["a", 0.14], ["s", 0.11]],
};

const FALLBACK: [string, number][] = [["e", 0.27], ["t", 0.19], ["a", 0.14]];

const AXIS = 0.5;
const THIN_SPACE = " "; // espacio fino antes de % (RAE)

/** pct(p): "31 %" / "92 %" — strips a trailing ".0", thin space before %. Mirrors v10 `pct`. */
function pct(p: number): string {
    return (p * 100).toFixed(1).replace(/\.0$/, "") + THIN_SPACE + "%";
}

type FlyState = { glyph: string; nonce: number } | null;

/** i18n root for the rework copy (Phase-1 keys). All five live under this namespace. */
const I18N = "bigramNarrative.v2.heroAutoComplete";

export interface HeroAutoCompleteProps {
    /**
     * Chapter accent opt-in. The widget is already bigram-scoped (all color resolves under
     * [data-bigram-theme]), so this is documentary symmetry with the chapter convention — passing
     * "bigram" or nothing behaves identically. Kept so callers can write <HeroAutoComplete accent="bigram" />.
     */
    accent?: "bigram";
}

const HeroAutoComplete = memo<HeroAutoCompleteProps>(function HeroAutoComplete() {
    const { t, language } = useI18n();
    const reduce = useReducedMotion();
    // v10 writes the space prediction as the localized word ("espacio" / "space"). No dedicated i18n
    // key exists for it (i18n is owned by another agent this round), so derive it from `language`.
    const spaceWord = language === "es" ? "espacio" : "space";

    // Initial demo state: the keycap is pre-filled with "e" (v10 `input.value = "e"`).
    const [input, setInput] = useState("e");
    const [focused, setFocused] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const winnerGlyphRef = useRef<HTMLSpanElement>(null);

    // `userTyped` marks any state past the initial pre-filled "e" demo (which fills with no fly /
    // no +220ms fresh offset, exactly like v10's `render({ initial: true })`).
    const [userTyped, setUserTyped] = useState(false);
    // Each keystroke gets a unique nonce so the row cascade keys re-mount and the fly effect re-runs.
    const [renderNonce, setRenderNonce] = useState(0);
    // `fresh` = the typed key differs from the previously rendered key (v10 `key !== prevKey`).
    const prevKeyRef = useRef<string | null>(null);
    const [fly, setFly] = useState<FlyState>(null);

    const raw = input.slice(-1);
    const empty = raw.length !== 1;
    const key = raw.toLowerCase();
    const rows: [string, number][] | null = empty ? null : (BIGRAMS[key] ?? FALLBACK);

    const idle = empty && !focused;

    const fresh = !empty && key !== prevKeyRef.current;
    // `freshOffset` reproduces v10's `(fresh && !initial ? 220 : 0)` term in the cascade delay.
    const freshOffset = fresh && userTyped ? 220 : 0;

    const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setUserTyped(true);
        setInput(e.target.value.slice(-1));
        setRenderNonce((n) => n + 1);
    }, []);

    // After the fresh row is laid out: fire the fly ghost (v10 fires only on fresh && !initial).
    useLayoutEffect(() => {
        const isFresh = !empty && key !== prevKeyRef.current;
        prevKeyRef.current = empty ? null : key;
        if (!userTyped || !isFresh || empty || reduce) return;
        setFly({ glyph: raw === " " ? "␣" : raw, nonce: renderNonce });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [renderNonce]);

    return (
        <div
            className="bw-auto"
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "clamp(22px, 4vw, 34px)",
                fontFamily: "var(--font-source-serif)",
            }}
        >
            {/* ── Frame · the brain→machine mirror, set BEFORE you type ───────── */}
            <Header
                label={t(`${I18N}.label`)}
                prompt={t(`${I18N}.prompt`)}
                reduce={!!reduce}
            />

            {/* ── The demo · keycap + honest distribution (mechanism unchanged) ─ */}
            <div
                className="flex flex-wrap items-center"
                style={{ gap: "clamp(20px, 5vw, 48px)" }}
            >
            {/* ── Keycap input · the single focal point ───────────────────────── */}
            <div className="relative flex-none">
                {/* idle pulse — a calm invitation to type; removed entirely under reduced-motion */}
                {idle && !reduce && (
                    <motion.span
                        aria-hidden
                        animate={{ scale: [1, 1.16, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                        className="pointer-events-none absolute inset-0"
                        style={{
                            borderRadius: "var(--bigram-r-md)",
                            background: "var(--bigram-accent-soft)",
                        }}
                    />
                )}
                <input
                    ref={inputRef}
                    type="text"
                    maxLength={1}
                    inputMode="text"
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    value={input}
                    onChange={onChange}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder="a"
                    aria-label={t(`${I18N}.hint`)}
                    className="relative z-[1] text-center focus:outline-none"
                    style={{
                        width: "clamp(88px, 26vw, 116px)",
                        height: "clamp(88px, 26vw, 116px)",
                        fontFamily: "var(--font-jetbrains-mono)",
                        fontSize: "clamp(52px, 14vw, 64px)",
                        fontWeight: 600,
                        lineHeight: 1,
                        borderRadius: "var(--bigram-r-md)",
                        border: `2px solid ${focused ? "var(--bigram-accent)" : "var(--bigram-accent-2)"}`,
                        background: "var(--bigram-accent-soft)",
                        color: "var(--bigram-ink)",
                        caretColor: "var(--bigram-accent)",
                        boxShadow: focused ? "0 0 0 3px var(--bigram-accent-soft)" : "none",
                        transition:
                            "border-color .2s ease, box-shadow .2s ease, background .2s ease",
                    }}
                />
            </div>

            {/* ── Honest predictions · the fixed-axis dst-only distribution ──── */}
            <div
                aria-live="polite"
                aria-atomic="true"
                style={{ flex: 1, minWidth: "260px" }}
            >
                {rows ? (
                    <>
                        <p
                            style={{
                                fontFamily: "var(--font-jetbrains-mono)",
                                fontWeight: 500,
                                fontSize: "16.5px",
                                letterSpacing: "0.005em",
                                lineHeight: 1.55,
                                color: "var(--bigram-muted)",
                                margin: "0 0 22px",
                                textWrap: "pretty",
                            }}
                        >
                            {t(`${I18N}.after`, {
                                input: raw === " " ? spaceWord : raw,
                            })}
                        </p>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "clamp(16px, 2.8vw, 24px)",
                                marginTop: "2px",
                            }}
                        >
                            {rows.map(([ch, prob], i) => (
                                <PredictionRow
                                    key={`${key}:${i}:${renderNonce}`}
                                    glyph={ch}
                                    prob={prob}
                                    top={i === 0}
                                    delayMs={(rows.length - 1 - i) * 110 + freshOffset}
                                    reduce={!!reduce}
                                    winnerGlyphRef={i === 0 ? winnerGlyphRef : undefined}
                                    spaceWord={spaceWord}
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <p
                        style={{
                            fontFamily: "var(--font-source-serif)",
                            fontStyle: "italic",
                            fontSize: "16px",
                            color: "var(--bigram-muted)",
                            margin: 0,
                        }}
                    >
                        {t(`${I18N}.hint`)}
                    </p>
                )}
            </div>

            {fly && (
                <FlyGhost
                    key={fly.nonce}
                    glyph={fly.glyph}
                    fromRef={inputRef}
                    toRef={winnerGlyphRef}
                    onDone={() => setFly(null)}
                />
            )}
            </div>

            {/* ── The honest catch · sage panel, AFTER the bars ───────────────── */}
            <Bridge text={t(`${I18N}.bridge`)} reduce={!!reduce} />
        </div>
    );
});

/**
 * Header — the brain→machine frame set BEFORE the learner types. A mono accent eyebrow ("Interactive ·
 * type a letter") sits over a serif prompt ("Type a letter and see what it thinks comes next."). The
 * prompt carries the §1 mirror: this is the same move your own head makes. Typography-first, no chrome
 * (no card, no border) — it reads as the opening line of the figure, not a panel. Reduced-motion safe.
 */
function Header({ label, prompt, reduce }: { label: string; prompt: string; reduce: boolean }) {
    return (
        <motion.div
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ display: "flex", flexDirection: "column", gap: "9px" }}
        >
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: "10.5px",
                    letterSpacing: ".2em",
                    textTransform: "uppercase",
                    color: "var(--bigram-accent-ink)",
                }}
            >
                <span
                    aria-hidden
                    style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "var(--bigram-accent)",
                        flex: "none",
                    }}
                />
                {label}
            </span>
            <p
                style={{
                    fontFamily: "var(--font-source-serif)",
                    fontSize: "clamp(18px, 2.6vw, 21px)",
                    lineHeight: 1.4,
                    color: "var(--bigram-ink)",
                    margin: 0,
                    maxWidth: "44ch",
                    textWrap: "pretty",
                }}
            >
                {prompt}
            </p>
        </motion.div>
    );
}

/**
 * Bridge — the honest catch, AFTER the bars. Mirrors the chapter's SAGE Verdict voice (soft sage
 * gradient + inset sage ring) so the limit reads as a calm aside, not an alarm: "It works. But it
 * understands nothing." That admission is the question §2 answers, so it is the widget's emotional
 * exit. Same sage tokens as the Verdict primitive; reduced-motion safe.
 */
function Bridge({ text, reduce }: { text: string; reduce: boolean }) {
    return (
        <motion.p
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
                margin: 0,
                padding: "15px 20px",
                borderRadius: "var(--bigram-r-md)",
                background: "linear-gradient(135deg, var(--bigram-sage-soft), transparent 82%)",
                boxShadow:
                    "inset 0 0 0 1px color-mix(in oklab, var(--bigram-sage) 30%, transparent)",
                fontFamily: "var(--font-source-serif)",
                fontSize: "16.5px",
                lineHeight: 1.5,
                color: "var(--bigram-ink-2)",
                textWrap: "pretty",
            }}
        >
            {text}
        </motion.p>
    );
}

/**
 * One prediction row: grid `74px 1fr auto`. The label cell shows ONLY the predicted next glyph.
 * Track 9px / pill radius, fill on a fixed AXIS=0.50; winner is brightest. No glint. The value
 * counts up over 620ms (easeOutCubic) after `delayMs`.
 */
function PredictionRow({
    glyph,
    prob,
    top,
    delayMs,
    reduce,
    winnerGlyphRef,
    spaceWord,
}: {
    glyph: string;
    prob: number;
    top: boolean;
    delayMs: number;
    reduce: boolean;
    winnerGlyphRef?: React.RefObject<HTMLSpanElement | null>;
    spaceWord: string;
}) {
    const isSpace = glyph === " ";
    const targetW = Math.min(100, (prob / AXIS) * 100);
    const [width, setWidth] = useState(reduce ? targetW : 0);
    const [valueText, setValueText] = useState(reduce ? pct(prob) : pct(0));

    useEffect(() => {
        // Under reduced motion the final state is the initial state (see useState above): nothing to animate.
        if (reduce) return;
        let raf = 0;
        const fillTimer = window.setTimeout(() => setWidth(targetW), delayMs);
        // count-up: 0 → prob over 620ms, easeOutCubic, starting after delayMs.
        const countTimer = window.setTimeout(() => {
            let t0: number | null = null;
            const dur = 620;
            const frame = (t: number) => {
                if (t0 == null) t0 = t;
                const k = Math.min(1, (t - t0) / dur);
                const e = 1 - Math.pow(1 - k, 3); // easeOutCubic
                setValueText(pct(prob * e));
                if (k < 1) raf = requestAnimationFrame(frame);
                else setValueText(pct(prob));
            };
            raf = requestAnimationFrame(frame);
        }, delayMs);
        return () => {
            window.clearTimeout(fillTimer);
            window.clearTimeout(countTimer);
            cancelAnimationFrame(raf);
        };
    }, [delayMs, prob, targetW, reduce]);

    return (
        <div
            role="img"
            aria-label={`${glyph === " " ? spaceWord : glyph}, ${pct(prob)}`}
            style={{
                display: "grid",
                gridTemplateColumns: "74px 1fr auto",
                alignItems: "center",
                gap: "clamp(16px, 2.8vw, 24px)",
            }}
        >
            <span
                ref={winnerGlyphRef}
                style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: "clamp(18px, 2.6vw, 21px)",
                    lineHeight: 1,
                    justifySelf: "end",
                    display: "inline-flex",
                    alignItems: "center",
                }}
            >
                <span
                    style={{
                        color: top ? "var(--bigram-accent)" : "var(--bigram-ink)",
                        fontWeight: top ? 700 : 600,
                        ...(isSpace
                            ? { fontSize: "0.72em", letterSpacing: "0.01em" }
                            : null),
                    }}
                >
                    {isSpace ? spaceWord : glyph}
                </span>
            </span>

            <span
                style={{
                    position: "relative",
                    height: "9px",
                    borderRadius: "var(--bigram-r-pill)",
                    background: "color-mix(in oklab, var(--bigram-ink) 8%, transparent)",
                    overflow: "hidden",
                }}
            >
                <i
                    style={{
                        position: "absolute",
                        inset: "0 auto 0 0",
                        height: "100%",
                        width: `${width}%`,
                        borderRadius: "var(--bigram-r-pill)",
                        background: top
                            ? "var(--bigram-accent-bright)"
                            : "var(--bigram-accent-2)",
                        transition: reduce
                            ? "none"
                            : "width .62s cubic-bezier(.2,.7,.2,1)",
                    }}
                />
            </span>

            <span
                style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: "13px",
                    color: top ? "var(--bigram-muted)" : "var(--bigram-dim)",
                    fontVariantNumeric: "tabular-nums",
                    justifySelf: "end",
                    minWidth: "3.6em",
                    textAlign: "right",
                    letterSpacing: "0.01em",
                }}
            >
                {valueText}
            </span>
        </div>
    );
}

/**
 * flyLetter: the typed glyph flies from the keycap input to the winner row's predicted glyph.
 * 560ms cubic-bezier(.16,1,.3,1), opacity 0 → .95@.25 → 0, scale 1 → .3. Portal ghost on
 * document.body; positions measured via getBoundingClientRect after the new row is laid out.
 */
function FlyGhost({
    glyph,
    fromRef,
    toRef,
    onDone,
}: {
    glyph: string;
    fromRef: React.RefObject<HTMLInputElement | null>;
    toRef: React.RefObject<HTMLSpanElement | null>;
    onDone: () => void;
}) {
    const [mounted, setMounted] = useState(false);
    const ghostRef = useRef<HTMLSpanElement>(null);

    useEffect(() => setMounted(true), []);

    useLayoutEffect(() => {
        if (!mounted) return;
        const from = fromRef.current;
        const to = toRef.current;
        const ghost = ghostRef.current;
        if (!from || !to || !ghost) {
            onDone();
            return;
        }
        // The ghost is portaled to document.body, OUTSIDE the [data-bigram-theme] scope, so the
        // scoped `--bigram-accent` token is empty there. Resolve it from the in-scope input and
        // apply the concrete color inline (v10 keeps `.bw-auto__fly` accent via global :root tokens).
        const accent = getComputedStyle(from).getPropertyValue("--bigram-accent").trim();
        if (accent) ghost.style.color = accent;
        const a = from.getBoundingClientRect();
        const b = to.getBoundingClientRect();
        const ax = a.left + a.width / 2;
        const ay = a.top + a.height / 2;
        const dx = b.left + b.width / 2 - ax;
        const dy = b.top + b.height / 2 - ay;
        ghost.style.left = `${ax}px`;
        ghost.style.top = `${ay}px`;
        const anim = ghost.animate(
            [
                { transform: "translate(-50%,-50%) scale(1)", opacity: 0 },
                { opacity: 0.95, offset: 0.25 },
                {
                    transform: `translate(-50%,-50%) translate(${dx}px,${dy}px) scale(.3)`,
                    opacity: 0,
                },
            ],
            { duration: 560, easing: "cubic-bezier(.16,1,.3,1)" },
        );
        anim.onfinish = onDone;
        return () => anim.cancel();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted]);

    if (typeof document === "undefined" || !mounted) return null;

    return createPortal(
        <span
            ref={ghostRef}
            aria-hidden
            style={{
                position: "fixed",
                zIndex: 90,
                pointerEvents: "none",
                fontFamily: "var(--font-jetbrains-mono)",
                fontWeight: 600,
                fontSize: "72px",
                lineHeight: 1,
                color: "var(--bigram-accent)",
                transform: "translate(-50%,-50%)",
                willChange: "transform, opacity",
            }}
        >
            {glyph}
        </span>,
        document.body,
    );
}

export { HeroAutoComplete };
