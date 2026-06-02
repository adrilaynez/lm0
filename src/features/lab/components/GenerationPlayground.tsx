"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Check, Copy } from "lucide-react";

import { useI18n } from "@/i18n/context";

/**
 * GenerationPlayground — text generation visualizer (Bigram chapter; shared component).
 *
 * ONE concept: the model *writes* by sampling the next character, again and again. The hero is the
 * manuscript — a calm well where text streams in one glyph at a time. Each freshly-sampled character
 * lands bright (accent) and then "settles" into ink, so you literally watch the model choose-then-commit.
 * The controls (seed letter, length, temperature) are quiet, typographic, and secondary: no dashboard,
 * no boxes competing with the page being written. Temperature is named as the model's *voice*
 * (Focused → Chaotic), because that — not the number — is the idea that should click.
 *
 * SHARING / SCOPING — this component is reused by N-gram (and free-lab), which own different accents.
 *   • `accent="neutral"` (DEFAULT) keeps a fully self-contained emerald palette so every non-Bigram
 *     caller renders byte-identically to before and never depends on a chapter scope.
 *   • `accent="bigram"` (opt-in) reads the editorial-green `--bigram-*` tokens, which resolve ONLY
 *     inside the chapter's `[data-bigram-theme]` scope and never leak elsewhere.
 *   The Bigram call sites (BigramNarrative.tsx, /lab/bigram page) must pass `accent="bigram"`.
 *
 * Reduced-motion safe: streaming, blink, ink-settle, and count-ups all collapse to an instant render.
 */

/* ── Temperature presets: the model's "voice", named in plain language ── */
const TEMP_PRESETS = [
    { key: "focused", value: 0.3 },
    { key: "balanced", value: 0.8 },
    { key: "creative", value: 1.5 },
    { key: "chaotic", value: 2.5 },
] as const;

/* ── Quick-start seed characters ── */
const QUICK_CHARS = ["t", "a", "e", "s", " "] as const;

/* ── Streaming cadence (ms per character); collapses to instant under reduced-motion ── */
const STREAM_DELAY_MS = 26;
const STREAM_START_MS = 90;
/** how many trailing characters keep the bright "wet ink" tint before settling */
const INK_TRAIL = 6;

const SPACE_GLYPH = "·";

/* v10 easings — the standard "settle" curve and a crisp count-up. */
const SETTLE_EASE: [number, number, number, number] = [0.2, 0.7, 0.2, 1];

function displayChar(c: string) {
    return c === " " ? SPACE_GLYPH : c;
}

/** Map a temperature to a 0..1 "wildness" position for the calm→wild voice track. */
function tempPosition(t: number) {
    return Math.min(1, Math.max(0, (t - 0.1) / (3.0 - 0.1)));
}

type Accent = "bigram" | "neutral";

/**
 * Token resolver.
 *  • neutral — a self-contained emerald palette (no chapter scope needed). This is the unchanged look
 *    every non-Bigram caller has always gotten; kept byte-identical on purpose.
 *  • bigram — the editorial-green `--bigram-*` tokens, valid only inside `[data-bigram-theme]`.
 */
function palette(accent: Accent) {
    if (accent === "neutral") {
        return {
            ink: "rgba(255,255,255,0.92)",
            inkSettled: "rgba(110,231,183,0.85)", // emerald-300-ish
            inkWet: "rgb(52,211,153)", // emerald-400
            muted: "rgba(255,255,255,0.40)",
            dim: "rgba(255,255,255,0.20)",
            faint: "rgba(255,255,255,0.10)",
            accent: "rgb(52,211,153)",
            accentBright: "rgb(110,231,183)",
            accentSoft: "rgba(16,185,129,0.16)",
            onAccent: "rgb(6,32,24)",
            surface: "rgba(255,255,255,0.02)",
            well: "rgba(255,255,255,0.015)",
            rule: "rgba(255,255,255,0.08)",
            rule2: "rgba(255,255,255,0.14)",
            wrong: "rgb(248,113,113)",
            wrongSoft: "rgba(248,113,113,0.10)",
            trackFill: "rgba(255,255,255,0.10)",
            rSm: "8px",
            rMd: "12px",
            rLg: "16px",
            rPill: "999px",
            fontMono: "var(--font-jetbrains-mono), ui-monospace, monospace",
            fontSerif: "var(--font-source-serif), Georgia, serif",
        };
    }
    return {
        ink: "var(--bigram-ink)",
        inkSettled: "var(--bigram-ink-2)",
        inkWet: "var(--bigram-accent-bright)",
        muted: "var(--bigram-muted)",
        dim: "var(--bigram-dim)",
        faint: "color-mix(in oklab, var(--bigram-ink) 12%, transparent)",
        accent: "var(--bigram-accent)",
        accentBright: "var(--bigram-accent-bright)",
        accentSoft: "var(--bigram-accent-soft)",
        onAccent: "var(--bigram-on-accent)",
        surface: "var(--bigram-surface)",
        well: "var(--bigram-bg-2)",
        rule: "var(--bigram-rule)",
        rule2: "var(--bigram-rule-2)",
        wrong: "var(--bigram-wrong)",
        wrongSoft: "var(--bigram-wrong-soft)",
        trackFill: "color-mix(in oklab, var(--bigram-ink) 14%, transparent)",
        rSm: "var(--bigram-r-sm)",
        rMd: "var(--bigram-r-md)",
        rLg: "var(--bigram-r-lg)",
        rPill: "var(--bigram-r-pill)",
        fontMono: "var(--bigram-font-mono)",
        fontSerif: "var(--bigram-font-serif)",
    };
}

interface GenerationPlaygroundProps {
    onGenerate: (startChar: string, numTokens: number, temperature: number) => void;
    generatedText: string | null;
    loading: boolean;
    error: string | null;
    /**
     * "neutral" (default) keeps the original self-contained emerald palette for non-Bigram reuse.
     * "bigram" opts into the editorial-green `--bigram-*` tokens (only valid inside `[data-bigram-theme]`).
     */
    accent?: Accent;
}

/* ───────────────────────── small presentational pieces ───────────────────────── */

/** A mono uppercase eyebrow label — the only "chrome" allowed for a control group. */
function FieldLabel({ children, color }: { children: React.ReactNode; color: string }) {
    return (
        <span
            style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color,
            }}
        >
            {children}
        </span>
    );
}

/** A live numeric readout pinned beside a slider label. */
function FieldValue({ children, color }: { children: React.ReactNode; color: string }) {
    return (
        <span
            style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: "11px",
                fontWeight: 600,
                color,
                fontVariantNumeric: "tabular-nums",
            }}
        >
            {children}
        </span>
    );
}

/**
 * EditorialSlider — a single hairline track with a quiet accent fill and a soft handle. No box, no chrome;
 * just type, a rule, and a fill that shows position. Uses an overlaid <input> for native a11y + dragging.
 */
const EditorialSlider = memo(function EditorialSlider({
    value,
    min,
    max,
    step = 1,
    onChange,
    ariaLabel,
    p,
}: {
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (v: number) => void;
    ariaLabel: string;
    p: ReturnType<typeof palette>;
}) {
    const pct = ((value - min) / (max - min)) * 100;
    return (
        <span style={{ position: "relative", display: "block", height: "20px" }}>
            {/* track */}
            <span
                style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    right: 0,
                    height: "3px",
                    transform: "translateY(-50%)",
                    borderRadius: "999px",
                    background: p.trackFill,
                    overflow: "hidden",
                }}
            >
                <span
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: `${pct}%`,
                        background: p.accent,
                        borderRadius: "999px",
                    }}
                />
            </span>
            {/* handle */}
            <span
                aria-hidden
                style={{
                    position: "absolute",
                    top: "50%",
                    left: `${pct}%`,
                    transform: "translate(-50%, -50%)",
                    width: "14px",
                    height: "14px",
                    borderRadius: "999px",
                    background: p.accentBright,
                    boxShadow: `0 0 0 4px ${p.accentSoft}`,
                    pointerEvents: "none",
                }}
            />
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                aria-label={ariaLabel}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    margin: 0,
                    opacity: 0,
                    cursor: "pointer",
                    WebkitAppearance: "none",
                    appearance: "none",
                }}
            />
        </span>
    );
});

/* ───────────────────────────────── main component ───────────────────────────────── */

export const GenerationPlayground = memo(function GenerationPlayground({
    onGenerate,
    generatedText,
    loading,
    error,
    accent = "neutral",
}: GenerationPlaygroundProps) {
    const { t } = useI18n();
    const reduce = useReducedMotion();
    const p = useMemo(() => palette(accent), [accent]);

    const [startChar, setStartChar] = useState("t");
    const [numTokens, setNumTokens] = useState(60);
    const [temperature, setTemperature] = useState(0.8);
    const [copied, setCopied] = useState(false);
    const [revealCount, setRevealCount] = useState(0);
    const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ── Character-by-character streaming reveal — the heart of the concept ── */
    useEffect(() => {
        if (!generatedText || loading) {
            setRevealCount(0);
            return;
        }
        if (reduce) {
            setRevealCount(generatedText.length);
            return;
        }
        setRevealCount(0);
        let count = 0;
        const tick = () => {
            count++;
            setRevealCount(count);
            if (count < generatedText.length) {
                revealTimerRef.current = setTimeout(tick, STREAM_DELAY_MS);
            }
        };
        revealTimerRef.current = setTimeout(tick, STREAM_START_MS);
        return () => {
            if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
        };
    }, [generatedText, loading, reduce]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (startChar) onGenerate(startChar, numTokens, temperature);
    };

    const handleCopy = async () => {
        if (!generatedText) return;
        await navigator.clipboard.writeText(generatedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const activePreset = TEMP_PRESETS.find((preset) => preset.value === temperature);
    const streaming = !!generatedText && !loading && revealCount < generatedText.length;
    const tPos = tempPosition(temperature);

    /* Split the manuscript into: settled ink, the warm "wet ink" trail, and the not-yet-written remainder. */
    const wetStart = Math.max(0, revealCount - INK_TRAIL);
    const settled = generatedText ? generatedText.slice(0, wetStart) : "";
    const wet = generatedText ? generatedText.slice(wetStart, revealCount) : "";
    const remainder = generatedText ? generatedText.slice(revealCount) : "";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }} id="playground">
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Seed character — a sunken segmented rail of quick picks + a free input */}
                <div>
                    <FieldLabel color={p.dim}>{t("models.bigram.generation.form.startChar")}</FieldLabel>
                    <div
                        style={{
                            marginTop: "10px",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            flexWrap: "wrap",
                        }}
                    >
                        {/* sunken rail */}
                        <div
                            style={{
                                display: "inline-flex",
                                gap: "4px",
                                padding: "4px",
                                borderRadius: p.rMd,
                                background: p.well,
                                boxShadow: `inset 0 0 0 1px ${p.rule}`,
                            }}
                        >
                            {QUICK_CHARS.map((ch) => {
                                const active = startChar === ch;
                                return (
                                    <button
                                        key={ch}
                                        type="button"
                                        onClick={() => setStartChar(ch)}
                                        aria-pressed={active}
                                        style={{
                                            position: "relative",
                                            width: "34px",
                                            height: "34px",
                                            borderRadius: p.rSm,
                                            border: "none",
                                            background: "transparent",
                                            color: active ? p.onAccent : p.muted,
                                            fontFamily: p.fontMono,
                                            fontSize: "14px",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            transition: "color .2s ease",
                                        }}
                                    >
                                        {active && (
                                            <motion.span
                                                layoutId={`seed-${accent}`}
                                                transition={
                                                    reduce
                                                        ? { duration: 0 }
                                                        : { type: "spring", stiffness: 480, damping: 36 }
                                                }
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    borderRadius: p.rSm,
                                                    background: p.accent,
                                                }}
                                            />
                                        )}
                                        <span style={{ position: "relative" }}>{displayChar(ch)}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <span style={{ fontFamily: p.fontSerif, fontSize: "13px", color: p.dim }}>
                            {t("models.bigram.generation.form.or")}
                        </span>

                        <input
                            type="text"
                            value={startChar}
                            onChange={(e) => setStartChar(e.target.value.slice(0, 1))}
                            maxLength={1}
                            aria-label={t("models.bigram.generation.form.startChar")}
                            style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: p.rMd,
                                border: `1px solid ${p.rule2}`,
                                background: p.surface,
                                color: p.ink,
                                fontFamily: p.fontMono,
                                fontSize: "16px",
                                fontWeight: 700,
                                textAlign: "center",
                                outline: "none",
                            }}
                        />
                    </div>
                </div>

                {/* Length + Temperature — two quiet sliders side by side */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                        gap: "20px",
                    }}
                >
                    <div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "baseline",
                                marginBottom: "10px",
                            }}
                        >
                            <FieldLabel color={p.dim}>{t("models.bigram.generation.form.numTokens")}</FieldLabel>
                            <FieldValue color={p.accent}>{numTokens}</FieldValue>
                        </div>
                        <EditorialSlider
                            value={numTokens}
                            min={10}
                            max={200}
                            onChange={setNumTokens}
                            ariaLabel={t("models.bigram.generation.form.numTokens")}
                            p={p}
                        />
                    </div>

                    <div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "baseline",
                                marginBottom: "10px",
                            }}
                        >
                            <FieldLabel color={p.dim}>{t("models.bigram.generation.form.temp")}</FieldLabel>
                            <FieldValue color={p.accent}>{temperature.toFixed(1)}</FieldValue>
                        </div>
                        <EditorialSlider
                            value={temperature}
                            min={0.1}
                            max={3.0}
                            step={0.1}
                            onChange={setTemperature}
                            ariaLabel={t("models.bigram.generation.form.temp")}
                            p={p}
                        />
                    </div>
                </div>

                {/* Temperature presets — a sunken segmented control naming the model's voice */}
                <div
                    style={{
                        display: "flex",
                        gap: "4px",
                        padding: "4px",
                        borderRadius: p.rMd,
                        background: p.well,
                        boxShadow: `inset 0 0 0 1px ${p.rule}`,
                    }}
                >
                    {TEMP_PRESETS.map((preset) => {
                        const active = activePreset?.key === preset.key;
                        return (
                            <button
                                key={preset.key}
                                type="button"
                                onClick={() => setTemperature(preset.value)}
                                aria-pressed={active}
                                style={{
                                    position: "relative",
                                    flex: 1,
                                    padding: "7px 4px",
                                    borderRadius: p.rSm,
                                    border: "none",
                                    background: "transparent",
                                    color: active ? p.onAccent : p.muted,
                                    fontFamily: p.fontMono,
                                    fontSize: "10.5px",
                                    fontWeight: 600,
                                    letterSpacing: "0.04em",
                                    cursor: "pointer",
                                    transition: "color .2s ease",
                                }}
                            >
                                {active && (
                                    <motion.span
                                        layoutId={`preset-${accent}`}
                                        transition={
                                            reduce
                                                ? { duration: 0 }
                                                : { type: "spring", stiffness: 480, damping: 36 }
                                        }
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            borderRadius: p.rSm,
                                            background: p.accent,
                                        }}
                                    />
                                )}
                                <span style={{ position: "relative" }}>
                                    {t(`models.bigram.generation.form.presets.${preset.key}`)}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* calm → wild voice track: a hairline gradient showing where temperature sits, anchored by
                    two quiet typographic poles so the *meaning* of the dial reads instantly. */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span
                        style={{
                            fontFamily: p.fontMono,
                            fontSize: "9px",
                            fontWeight: 500,
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            color: tPos < 0.5 ? p.accent : p.dim,
                            transition: "color .25s ease",
                        }}
                    >
                        {t("models.bigram.generation.form.presets.focused")}
                    </span>
                    <span
                        style={{
                            position: "relative",
                            flex: 1,
                            height: "2px",
                            borderRadius: "999px",
                            background: `linear-gradient(90deg, ${p.accent}, ${p.wrong})`,
                            opacity: 0.55,
                        }}
                    >
                        <motion.span
                            aria-hidden
                            animate={{ left: `${tPos * 100}%` }}
                            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 34 }}
                            style={{
                                position: "absolute",
                                top: "50%",
                                width: "9px",
                                height: "9px",
                                borderRadius: "999px",
                                transform: "translate(-50%, -50%)",
                                background: p.ink,
                                boxShadow: `0 0 0 3px ${p.surface}`,
                            }}
                        />
                    </span>
                    <span
                        style={{
                            fontFamily: p.fontMono,
                            fontSize: "9px",
                            fontWeight: 500,
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            color: tPos >= 0.5 ? p.wrong : p.dim,
                            transition: "color .25s ease",
                        }}
                    >
                        {t("models.bigram.generation.form.presets.chaotic")}
                    </span>
                </div>

                {/* Generate — the single primary action; filled accent, not a glow */}
                <motion.button
                    type="submit"
                    disabled={loading || !startChar}
                    whileHover={loading || !startChar ? undefined : { scale: 1.008 }}
                    whileTap={loading || !startChar ? undefined : { scale: 0.992 }}
                    style={{
                        width: "100%",
                        padding: "14px",
                        borderRadius: p.rMd,
                        border: "none",
                        background: p.accent,
                        color: p.onAccent,
                        fontFamily: p.fontMono,
                        fontSize: "12px",
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        cursor: loading || !startChar ? "not-allowed" : "pointer",
                        opacity: loading || !startChar ? 0.45 : 1,
                        transition: "opacity .2s ease",
                    }}
                >
                    {loading ? (
                        <motion.span
                            animate={reduce ? undefined : { opacity: [0.55, 1, 0.55] }}
                            transition={{ duration: 1.4, repeat: Infinity }}
                        >
                            {t("models.bigram.generation.form.generating")}
                        </motion.span>
                    ) : (
                        t("models.bigram.generation.form.generate")
                    )}
                </motion.button>
            </form>

            {/* Error — restrained, uses the chapter's "wrong" voice */}
            {error && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 14px",
                        borderRadius: p.rMd,
                        background: p.wrongSoft,
                        color: p.wrong,
                        fontFamily: p.fontSerif,
                        fontSize: "13px",
                    }}
                >
                    <AlertCircle style={{ width: "15px", height: "15px", flexShrink: 0 }} />
                    {error}
                </div>
            )}

            {/* The manuscript — the focal point. A calm well where the model writes, character by character. */}
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            minHeight: "108px",
                            borderRadius: p.rLg,
                            background: p.well,
                            boxShadow: `inset 0 0 0 1px ${p.rule}`,
                            position: "relative",
                            overflow: "hidden",
                        }}
                    >
                        {/* a single thinking caret pulses in the empty page */}
                        <motion.span
                            animate={reduce ? undefined : { opacity: [1, 0.15, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                            style={{
                                position: "absolute",
                                top: "26px",
                                left: "24px",
                                width: "2px",
                                height: "20px",
                                background: p.accent,
                                borderRadius: "1px",
                            }}
                        />
                    </motion.div>
                ) : generatedText ? (
                    <motion.div
                        key="output"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={reduce ? { duration: 0 } : { duration: 0.35, ease: SETTLE_EASE }}
                        style={{ position: "relative" }}
                    >
                        <div
                            style={{
                                position: "relative",
                                minHeight: "108px",
                                padding: "22px 24px",
                                borderRadius: p.rLg,
                                background: p.well,
                                boxShadow: `inset 0 0 0 1px ${p.rule}`,
                                fontFamily: p.fontMono,
                                fontSize: "14.5px",
                                lineHeight: 1.85,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                            }}
                        >
                            {/* settled ink */}
                            <span style={{ color: p.inkSettled }}>{settled}</span>
                            {/* the warm "wet ink" trail — the just-sampled characters, settling toward ink */}
                            {wet.split("").map((c, i) => {
                                // newest character (last in the trail) is brightest, older ones cooler
                                const ageFromHead = wet.length - 1 - i; // 0 = newest
                                const heat = 1 - ageFromHead / Math.max(1, INK_TRAIL);
                                return (
                                    <span
                                        key={`${wetStart + i}-${c}`}
                                        style={{
                                            color: heat > 0.66 ? p.inkWet : heat > 0.33 ? p.accent : p.inkSettled,
                                        }}
                                    >
                                        {c}
                                    </span>
                                );
                            })}
                            {/* streaming caret */}
                            {streaming && (
                                <motion.span
                                    aria-hidden
                                    animate={reduce ? undefined : { opacity: [1, 0.1] }}
                                    transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                                    style={{
                                        display: "inline-block",
                                        width: "2px",
                                        height: "1em",
                                        verticalAlign: "text-bottom",
                                        marginLeft: "1px",
                                        background: p.accent,
                                        borderRadius: "1px",
                                    }}
                                />
                            )}
                            {/* the rest of the page, faint — what the model is about to write */}
                            <span style={{ color: p.faint }}>{remainder}</span>
                        </div>

                        {/* Copy — quiet at rest, accent on success */}
                        <button
                            onClick={handleCopy}
                            aria-label={t("models.bigram.generation.copyToClipboard")}
                            style={{
                                position: "absolute",
                                top: "14px",
                                right: "14px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "32px",
                                height: "32px",
                                borderRadius: p.rSm,
                                border: `1px solid ${p.rule}`,
                                background: p.surface,
                                color: copied ? p.accent : p.muted,
                                cursor: "pointer",
                                transition: "color .2s ease",
                            }}
                        >
                            {copied ? (
                                <Check style={{ width: "15px", height: "15px" }} />
                            ) : (
                                <Copy style={{ width: "15px", height: "15px" }} />
                            )}
                        </button>

                        {/* char count — a quiet colophon */}
                        <div style={{ marginTop: "8px", textAlign: "right" }}>
                            <span
                                style={{
                                    fontFamily: p.fontMono,
                                    fontSize: "10px",
                                    letterSpacing: "0.12em",
                                    color: p.dim,
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {generatedText.length} {t("models.bigram.generation.form.chars")}
                            </span>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
});
