"use client";

import { AnimatePresence, motion } from "framer-motion";

/**
 * BigramMatrixBuilderParts — presentational pieces for the BigramMatrixBuilder visualizer
 * (Bigram chapter, v10 design language · editorial-green). Split out so the orchestrating component stays focused
 * and readable. Every value is a --bigram-* token, gated by the chapter's [data-bigram-theme] scope.
 * Reduced-motion is threaded down as a prop (no hook usage here) so these stay pure presentational.
 */

export const SPACE_GLYPH = "␣";

/** A single step of the sweep: pair `from→to` and its (row, col) address in the grid. */
export type Step = { from: string; to: string; row: number; col: number; pos: number };

/** Cell / header glyph — a space reads as the visible ␣ marker. */
export function glyph(c: string): string {
    return c === " " ? SPACE_GLYPH : c;
}

/* ─── The source phrase, double-highlighted at the active pair ─── */
export function PhrasePanel({
    text,
    active,
    started,
    onEdit,
    editLabel,
    reduce,
}: {
    text: string;
    active: Step | null;
    started: boolean;
    onEdit: () => void;
    editLabel: string;
    reduce: boolean;
}) {
    return (
        <div>
            <div
                style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: "clamp(22px, 3vw, 31px)",
                    lineHeight: 1.7,
                    letterSpacing: ".005em",
                    textAlign: "center",
                    padding: "24px 22px",
                    borderRadius: "var(--bigram-r-lg)",
                    background: "var(--bigram-bg-2)",
                    boxShadow: "inset 0 2px 8px rgba(0,0,0,.30)",
                    wordBreak: "normal",
                    overflowWrap: "break-word",
                    userSelect: "none",
                }}
            >
                {Array.from(text).map((ch, i) => {
                    const isOrigin = active?.pos === i; // hot1
                    const isFollower = active ? active.pos + 1 === i : false; // hot2
                    const isPast = started && active ? i < active.pos : false;
                    const isSpace = ch === " ";

                    let color = started ? "var(--bigram-dim)" : "var(--bigram-body)";
                    let background = "transparent";
                    let boxShadow = "none";
                    let fontWeight = 400;

                    if (isOrigin) {
                        color = "var(--bigram-on-accent)";
                        background = "var(--bigram-accent)";
                        fontWeight = 700;
                    } else if (isFollower) {
                        color = "var(--bigram-accent-ink)";
                        background = "var(--bigram-accent-soft)";
                        boxShadow =
                            "inset 0 0 0 2px color-mix(in oklab, var(--bigram-accent) 38%, transparent)";
                        fontWeight = 700;
                    } else if (isPast) {
                        color = "color-mix(in oklab, var(--bigram-accent) 40%, var(--bigram-dim))";
                    }

                    return (
                        <span
                            key={i}
                            style={{
                                display: "inline-block",
                                color,
                                background,
                                boxShadow,
                                fontWeight,
                                padding: isSpace ? "2px 5px" : "2px 3px",
                                borderRadius: 7,
                                transition: reduce
                                    ? "none"
                                    : "color .26s ease, background .26s ease, box-shadow .26s ease",
                            }}
                        >
                            {isSpace ? (isOrigin || isFollower ? SPACE_GLYPH : " ") : ch}
                        </span>
                    );
                })}
            </div>
            <div style={{ textAlign: "center", marginTop: 12 }}>
                <button
                    type="button"
                    onClick={onEdit}
                    style={{
                        fontFamily: "var(--font-jetbrains-mono)",
                        fontSize: 10.5,
                        letterSpacing: ".18em",
                        textTransform: "uppercase",
                        border: 0,
                        background: "transparent",
                        color: "var(--bigram-dim)",
                        cursor: "pointer",
                        padding: "4px 6px",
                        transition: "color .2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--bigram-accent)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--bigram-dim)")}
                >
                    {editLabel}
                </button>
            </div>
        </div>
    );
}

/* ─── Edit panel ─── */
export function EditPanel({
    inputRef,
    value,
    onChange,
    onApply,
    onCancel,
    placeholder,
    applyLabel,
    cancelLabel,
}: {
    inputRef: React.RefObject<HTMLInputElement | null>;
    value: string;
    onChange: (v: string) => void;
    onApply: () => void;
    onCancel: () => void;
    placeholder: string;
    applyLabel: string;
    cancelLabel: string;
}) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input
                ref={inputRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") onApply();
                }}
                placeholder={placeholder}
                style={{
                    width: "100%",
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: 17,
                    color: "var(--bigram-ink)",
                    padding: "14px 18px",
                    border: 0,
                    borderRadius: "var(--bigram-r-md)",
                    background: "var(--bigram-bg-2)",
                    boxShadow: "inset 0 -2px 0 0 var(--bigram-rule-2)",
                    outline: "none",
                }}
                onFocus={(e) =>
                    (e.currentTarget.style.boxShadow = "inset 0 -2px 0 0 var(--bigram-accent)")
                }
                onBlur={(e) =>
                    (e.currentTarget.style.boxShadow = "inset 0 -2px 0 0 var(--bigram-rule-2)")
                }
            />
            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
                <button type="button" onClick={onApply} style={primaryBtnStyle(false)}>
                    {applyLabel}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    style={{
                        fontFamily: "var(--font-jetbrains-mono)",
                        fontSize: 11,
                        letterSpacing: ".1em",
                        textTransform: "uppercase",
                        padding: "10px 16px",
                        border: 0,
                        borderRadius: "var(--bigram-r-sm)",
                        cursor: "pointer",
                        background: "transparent",
                        color: "var(--bigram-muted)",
                        boxShadow: "inset 0 0 0 1px var(--bigram-rule-2)",
                    }}
                >
                    {cancelLabel}
                </button>
            </div>
        </div>
    );
}

/* ─── Speed segmented control (sunk rail, active cell filled accent — the v8 pattern) ─── */
export function SpeedControl({
    labels,
    speedIdx,
    onSelect,
    reduce,
}: {
    labels: readonly string[];
    speedIdx: number;
    onSelect: (i: number) => void;
    reduce: boolean;
}) {
    return (
        <div
            role="radiogroup"
            aria-label="Playback speed"
            style={{
                display: "inline-flex",
                gap: 3,
                padding: 4,
                borderRadius: "var(--bigram-r-md)",
                background: "var(--bigram-bg-2)",
                boxShadow: "inset 0 1px 4px rgba(0,0,0,.28)",
            }}
        >
            {labels.map((lbl, i) => {
                const on = i === speedIdx;
                return (
                    <button
                        key={lbl}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => onSelect(i)}
                        style={{
                            position: "relative",
                            minWidth: 36,
                            height: 30,
                            padding: "0 8px",
                            display: "grid",
                            placeItems: "center",
                            border: 0,
                            borderRadius: "var(--bigram-r-sm)",
                            cursor: "pointer",
                            background: "transparent",
                            fontFamily: "var(--font-jetbrains-mono)",
                            fontSize: 12,
                            fontWeight: on ? 600 : 500,
                            color: on ? "var(--bigram-on-accent)" : "var(--bigram-muted)",
                            fontVariantNumeric: "tabular-nums",
                            transition: "color .2s ease",
                        }}
                    >
                        {on && (
                            <motion.span
                                layoutId="bigram-builder-speed"
                                aria-hidden
                                transition={
                                    reduce
                                        ? { duration: 0 }
                                        : { type: "spring", stiffness: 520, damping: 38 }
                                }
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: "var(--bigram-r-sm)",
                                    background: "var(--bigram-accent)",
                                    boxShadow:
                                        "0 4px 12px -5px color-mix(in oklab, var(--bigram-accent) 65%, transparent)",
                                    zIndex: 0,
                                }}
                            />
                        )}
                        <span style={{ position: "relative", zIndex: 1 }}>{lbl}</span>
                    </button>
                );
            })}
        </div>
    );
}

/* ─── The matrix grid — honest fill, brightening axes, pulse + count tick ─── */
export function MatrixGrid({
    vocab,
    matrix,
    maxCount,
    active,
    reduce,
}: {
    vocab: string[];
    matrix: number[][];
    maxCount: number;
    active: Step | null;
    reduce: boolean;
}) {
    return (
        <div style={{ overflowX: "auto", margin: "0 -4px", padding: "0 4px" }}>
            <table
                style={{
                    margin: "0 auto",
                    borderCollapse: "separate",
                    borderSpacing: 4,
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontVariantNumeric: "tabular-nums lining-nums",
                }}
            >
                <thead>
                    <tr>
                        <th
                            style={{
                                width: 38,
                                height: 34,
                                fontSize: 11,
                                fontWeight: 500,
                                color: "var(--bigram-dim)",
                            }}
                        >
                            <span style={{ opacity: 0.7 }}>↓→</span>
                        </th>
                        {vocab.map((c, ci) => {
                            const on = active != null && active.col === ci;
                            return (
                                <th
                                    key={c}
                                    style={{
                                        width: 38,
                                        height: 34,
                                        textAlign: "center",
                                        fontSize: 15,
                                        fontWeight: on ? 700 : 500,
                                        color: on
                                            ? "var(--bigram-accent-ink)"
                                            : "var(--bigram-muted)",
                                        transition: reduce ? "none" : "color .2s ease",
                                    }}
                                >
                                    {glyph(c)}
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {matrix.map((row, ri) => {
                        const rowOn = active != null && active.row === ri;
                        return (
                            <tr key={ri}>
                                <th
                                    style={{
                                        width: 38,
                                        height: 38,
                                        textAlign: "center",
                                        fontSize: 15,
                                        fontWeight: rowOn ? 700 : 500,
                                        color: rowOn
                                            ? "var(--bigram-accent-ink)"
                                            : "var(--bigram-muted)",
                                        transition: reduce ? "none" : "color .2s ease",
                                    }}
                                >
                                    {glyph(vocab[ri])}
                                </th>
                                {row.map((val, ci) => (
                                    <MatrixCell
                                        key={ci}
                                        value={val}
                                        maxCount={maxCount}
                                        isActive={
                                            active != null &&
                                            active.row === ri &&
                                            active.col === ci
                                        }
                                        reduce={reduce}
                                    />
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

/* ─── A single matrix cell — heat by fill, pulse + count tick on landing ─── */
function MatrixCell({
    value,
    maxCount,
    isActive,
    reduce,
}: {
    value: number;
    maxCount: number;
    isActive: boolean;
    reduce: boolean;
}) {
    // Honest heat: tint scales with the cell's share of the running max, capped so the busiest
    // cell glows (~30% accent mix) without ever screaming. Empty cells stay flat & quiet.
    const intensity = maxCount > 0 ? value / maxCount : 0;
    const filled = value > 0;

    let background: string;
    let color: string;
    let boxShadow = "none";

    if (isActive) {
        background = "var(--bigram-accent)";
        color = "var(--bigram-on-accent)";
        boxShadow = "0 4px 14px -6px color-mix(in oklab, var(--bigram-accent) 70%, transparent)";
    } else if (filled) {
        const pct = Math.max(10, intensity * 34); // 10%..34% accent fill — honest heat, never neon
        background = `color-mix(in oklab, var(--bigram-accent) ${pct}%, var(--bigram-surface))`;
        color = intensity > 0.6 ? "var(--bigram-ink)" : "var(--bigram-ink-2)";
    } else {
        // a quiet sunk well — reads in both themes without a border
        background = "color-mix(in oklab, var(--bigram-ink) 5%, transparent)";
        color = "var(--bigram-dim)";
    }

    return (
        <td style={{ padding: 0 }}>
            <motion.div
                // pulse once whenever this cell becomes the active landing cell
                animate={reduce ? undefined : isActive ? { scale: [1, 1.14, 1] } : { scale: 1 }}
                transition={{ duration: 0.34, ease: [0.2, 0.8, 0.2, 1] }}
                style={{
                    width: 38,
                    height: 38,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "var(--bigram-r-sm)",
                    fontSize: 14,
                    fontWeight: isActive || (filled && intensity > 0.6) ? 700 : 500,
                    background,
                    color,
                    boxShadow,
                    transition: reduce
                        ? "none"
                        : "background .3s ease, color .3s ease, box-shadow .3s ease",
                }}
            >
                {filled ? (
                    <CountValue value={value} pulse={isActive && !reduce} />
                ) : (
                    <span style={{ opacity: 0.5 }}>·</span>
                )}
            </motion.div>
        </td>
    );
}

/* ─── Count text that pops when it ticks up on the active cell ─── */
function CountValue({ value, pulse }: { value: number; pulse: boolean }) {
    return (
        <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
                key={value}
                initial={pulse ? { y: 6, opacity: 0 } : false}
                animate={{ y: 0, opacity: 1 }}
                exit={pulse ? { y: -6, opacity: 0 } : { opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ display: "inline-block" }}
            >
                {value}
            </motion.span>
        </AnimatePresence>
    );
}

/* ─── Running accumulator — a quiet mono chip: "N counted" ───
   Makes the count→grid accumulation legible: every landed +1 ticks this up, so the eye sees the
   tally grow toward the moment the whole matrix is built. Filled in the editorial-soft accent, never
   loud — secondary to the grid. */
export function RunningTotal({
    count,
    total,
    reduce,
}: {
    count: number;
    total: number;
    reduce: boolean;
}) {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "baseline",
                gap: 6,
                padding: "5px 12px",
                borderRadius: "var(--bigram-r-pill)",
                background: "var(--bigram-accent-soft)",
                fontFamily: "var(--font-jetbrains-mono)",
                fontVariantNumeric: "tabular-nums",
            }}
        >
            {reduce ? (
                <span
                    style={{
                        display: "inline-block",
                        fontSize: 15,
                        fontWeight: 700,
                        color: "var(--bigram-accent-ink)",
                    }}
                >
                    {count}
                </span>
            ) : (
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                        key={count}
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -5, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                        style={{
                            display: "inline-block",
                            fontSize: 15,
                            fontWeight: 700,
                            color: "var(--bigram-accent-ink)",
                        }}
                    >
                        {count}
                    </motion.span>
                </AnimatePresence>
            )}
            <span style={{ fontSize: 11, color: "var(--bigram-dim)" }}>/ {total}</span>
        </span>
    );
}

/* ─── Completion coda — a calm sage panel (editorial-insight voice) ───
   Not the Verdict primitive (that states a single most-likely follower — the wrong conclusion here).
   This states the builder's ONE idea in human language: every adjacent pair was counted, and the
   grid IS the transition table. Sage gradient + inset sage ring, distinct from the emerald accent. */
export function CompletionCoda({
    line,
    meta,
    reduce,
}: {
    line: string;
    meta: string;
    reduce: boolean;
}) {
    return (
        <motion.div
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                maxWidth: 460,
                margin: "0 auto",
                padding: "16px 22px",
                borderRadius: "var(--bigram-r-md)",
                background: "linear-gradient(135deg, var(--bigram-sage-soft), transparent 82%)",
                boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--bigram-sage) 32%, transparent)",
                textAlign: "center",
            }}
        >
            <span
                style={{
                    fontFamily: "var(--font-source-serif)",
                    fontStyle: "italic",
                    fontSize: 16,
                    lineHeight: 1.5,
                    color: "var(--bigram-sage)",
                    textWrap: "pretty",
                }}
            >
                {line}
            </span>
            <span
                style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: 11,
                    letterSpacing: ".06em",
                    color: "var(--bigram-muted)",
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {meta}
            </span>
        </motion.div>
    );
}

/* ─── primary accent button (Start / Apply) ─── */
export function primaryBtnStyle(disabled: boolean): React.CSSProperties {
    return {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "var(--font-jetbrains-mono)",
        fontSize: 12,
        letterSpacing: ".1em",
        textTransform: "uppercase",
        fontWeight: 600,
        padding: "11px 20px",
        border: 0,
        borderRadius: "var(--bigram-r-sm)",
        cursor: disabled ? "default" : "pointer",
        background: "var(--bigram-accent)",
        color: "var(--bigram-on-accent)",
        opacity: disabled ? 0.35 : 1,
        boxShadow: "0 6px 16px -8px color-mix(in oklab, var(--bigram-accent) 60%, transparent)",
        transition: "background .2s ease, box-shadow .2s ease",
    };
}

/* ─── quiet inset-ring icon control ─── */
export function IconBtn({
    onClick,
    disabled = false,
    ariaLabel,
    children,
}: {
    onClick: () => void;
    disabled?: boolean;
    ariaLabel: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            title={ariaLabel}
            style={{
                display: "grid",
                placeItems: "center",
                width: 38,
                height: 38,
                border: 0,
                borderRadius: "var(--bigram-r-sm)",
                cursor: disabled ? "default" : "pointer",
                background: "transparent",
                color: "var(--bigram-muted)",
                boxShadow: "inset 0 0 0 1px var(--bigram-rule-2)",
                opacity: disabled ? 0.3 : 1,
                transition: "color .2s ease, box-shadow .2s ease, background .2s ease",
            }}
            onMouseEnter={(e) => {
                if (disabled) return;
                e.currentTarget.style.color = "var(--bigram-ink)";
                e.currentTarget.style.boxShadow = "inset 0 0 0 1px var(--bigram-accent-2)";
                e.currentTarget.style.background =
                    "color-mix(in oklab, var(--bigram-ink) 4%, transparent)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--bigram-muted)";
                e.currentTarget.style.boxShadow = "inset 0 0 0 1px var(--bigram-rule-2)";
                e.currentTarget.style.background = "transparent";
            }}
        >
            {children}
        </button>
    );
}
