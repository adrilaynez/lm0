"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { displayChar, heat, MONO, SERIF } from "@/features/lab/components/ngram/kit";
import {
    NGRAM_ALPHABET,
    normalizeNgram,
    scanContext,
} from "@/features/lab/data/ngramData";

/**
 * §5 · MuteSlot (v2) — one idea, one focal point.
 *
 * THE ONE IDEA: si el contexto exacto nunca se vio, la fila está VACÍA → la máquina se queda MUDA (0%).
 *
 * ESTRUCTURA (de arriba a abajo):
 *  1. HERO VISUAL: dos píldoras, una junto a la otra.
 *     IZQUIERDA  →  contexto conocido  → predicción fuerte (p.ej. 96 %)
 *     DERECHA    →  misma raíz, última letra distinta  → 0 % — «muda»
 *     El contraste es instantáneo: letra → resultado.
 *
 *  2. GRID EXPLORABLE (madriguera): 27 casillas, una por cada letra posible.
 *     Hover sobre una casilla → tooltip flotante al lado que muestra:
 *       - si fue VISTO → «"world" — 1 480 veces»
 *       - si NUNCA → «"worle" — nunca visto»
 *     Hacer clic navega a ese contexto.
 *
 *  3. CONTROLES (comprimidos): un botón de flip + semillas. Sin campo de texto.
 */

const MEMORY = 5;

const SEEN_WORD = "world";
const TYPO_WORD = "worle";
const DEMO_SEEN_MS = 2600;
const DEMO_MUTE_MS = 3200;

const SEEDS = ["world", "queen", "thing", "friend"];

type SiblingCell = { ch: string; ctx: string; total: number };

function cellShade(total: number, rowMax: number): string {
    return total > 0 ? heat(total / Math.max(1, rowMax), 18) : "var(--ngram-bg-2)";
}

function betFor(word: string): { ctx: string; best: { ch: string; prob: number } | null; total: number } {
    const ctx = normalizeNgram(word).replace(/\s+$/, "").slice(-MEMORY);
    const dist = ctx.length >= 2 ? scanContext(ctx) : null;
    const top = dist?.followers[0] ?? null;
    return { ctx, best: top ? { ch: top.ch, prob: top.prob } : null, total: dist?.total ?? 0 };
}

// Find the first unseen sibling ending for a given stem
function findMuteEnding(stem: string): string {
    const unseen = NGRAM_ALPHABET.filter((ch) => ch !== " " && !scanContext(stem + ch));
    return stem + (unseen.includes("e") ? "e" : unseen[0] ?? "x");
}

export const MuteSlot = memo(function MuteSlot({ accent }: { accent?: "ngram" }) {
    void accent;
    const reduce = useReducedMotion() === true;

    const [raw, setRaw] = useState(SEEN_WORD);
    const [auto, setAuto] = useState(true);
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);
    // GATING: labels are hidden until first interaction (flip/cell-click/seed)
    const [hasInteracted, setHasInteracted] = useState(false);
    // Track cell button positions for tooltip placement
    const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const gridRef = useRef<HTMLDivElement | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

    // ── auto-demo ────────────────────────────────────────────────────────────────
    const tickRef = useRef<() => void>(() => {});
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const phaseRef = useRef<"seen" | "mute">("seen");

    useEffect(() => {
        tickRef.current = () => {
            const goingMute = phaseRef.current === "seen";
            phaseRef.current = goingMute ? "mute" : "seen";
            setRaw(goingMute ? TYPO_WORD : SEEN_WORD);
            timerRef.current = setTimeout(tickRef.current, goingMute ? DEMO_MUTE_MS : DEMO_SEEN_MS);
        };
        return () => {
            if (timerRef.current != null) clearTimeout(timerRef.current);
            timerRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!auto || reduce) return;
        phaseRef.current = "seen";
        timerRef.current = setTimeout(tickRef.current, DEMO_SEEN_MS);
        return () => {
            if (timerRef.current != null) clearTimeout(timerRef.current);
            timerRef.current = null;
        };
    }, [auto, reduce]);

    const takeOver = useCallback((next: string) => {
        setAuto(false);
        setHasInteracted(true);
        if (timerRef.current != null) clearTimeout(timerRef.current);
        timerRef.current = null;
        setRaw(next);
    }, []);

    const ctx = useMemo(() => normalizeNgram(raw).replace(/\s+$/, "").slice(-MEMORY), [raw]);
    const stem = ctx.slice(0, -1);
    const lastCh = ctx.slice(-1);

    const dist = useMemo(() => (ctx.length >= 2 ? scanContext(ctx) : null), [ctx]);
    const best = dist?.followers[0] ?? null;
    const muted = !(dist && best);

    const siblings = useMemo<SiblingCell[]>(() => {
        const root = ctx.slice(0, -1);
        if (root.length < 1) return [];
        return NGRAM_ALPHABET.map((ch) => {
            const sctx = root + ch;
            const s = scanContext(sctx);
            return { ch, ctx: sctx, total: s ? s.total : 0 };
        });
    }, [ctx]);

    const rowMax = useMemo(() => Math.max(1, ...siblings.map((s) => s.total)), [siblings]);

    // Fallback pair when no stem yet
    const seenBet = useMemo(() => betFor(SEEN_WORD), []);

    // The hero pair: always (confWord, confProb) vs (muteWord)
    const hero = useMemo(() => {
        const root = ctx.slice(0, -1);
        if (root.length < 1) {
            return {
                confWord: seenBet.ctx,
                confFollower: seenBet.best?.ch ?? "d",
                confProb: seenBet.best?.prob ?? 0.96,
                muteWord: TYPO_WORD,
                muteLast: TYPO_WORD.slice(-1),
            };
        }
        const seen = [...siblings].filter((s) => s.total > 0).sort((a, b) => b.total - a.total);
        const top = seen[0];
        const topDist = top ? scanContext(root + top.ch) : null;
        const topFollow = topDist?.followers[0] ?? null;
        const muteSuffix = findMuteEnding(root);
        const muteEnd = muteSuffix.slice(-1);
        return {
            confWord: top ? root + top.ch : seenBet.ctx,
            confFollower: topFollow ? topFollow.ch : seenBet.best?.ch ?? "d",
            confProb: topFollow ? topFollow.prob : seenBet.best?.prob ?? 0.96,
            muteWord: root + muteEnd,
            muteLast: muteEnd,
        };
    }, [ctx, siblings, seenBet]);

    const confPct = Math.round(hero.confProb * 100);

    const stepRef = useRef(0);
    const flip = useCallback(() => {
        const step = stepRef.current;
        stepRef.current = step + 1;
        const seed = SEEDS[Math.floor(step / 2) % SEEDS.length];
        if (step % 2 === 0) {
            takeOver(seed);
        } else {
            const c = normalizeNgram(seed).replace(/\s+$/, "").slice(-MEMORY);
            const root = c.slice(0, -1);
            if (root.length < 1) { takeOver(TYPO_WORD); return; }
            takeOver(findMuteEnding(root));
        }
    }, [takeOver]);

    // Update tooltip position from the hovered cell
    const updateTooltipPos = useCallback((idx: number) => {
        const btn = cellRefs.current[idx];
        const grid = gridRef.current;
        if (!btn || !grid) return;
        const btnR = btn.getBoundingClientRect();
        const gridR = grid.getBoundingClientRect();
        setTooltipPos({
            x: btnR.left - gridR.left + btnR.width / 2,
            y: btnR.top - gridR.top,
        });
    }, []);

    const handleCellEnter = useCallback((idx: number) => {
        setHoverIdx(idx);
        setHasInteracted(true);
        updateTooltipPos(idx);
    }, [updateTooltipPos]);

    const hoveredCell = hoverIdx != null ? siblings[hoverIdx] : null;

    // Find the best follower for a seen cell (for tooltip)
    const hoveredFollower = useMemo(() => {
        if (!hoveredCell || hoveredCell.total === 0) return null;
        const d = scanContext(hoveredCell.ctx);
        return d?.followers[0] ?? null;
    }, [hoveredCell]);

    // The current live context is seen or muted?
    const liveCtxIsSeen = !muted;

    return (
        <div className="nw-mute">

            {/* ════ HERO: dos píldoras, lado a lado ════ */}
            <div className="nw-mute__pair">
                {/* Izquierda: contexto conocido → predicción fuerte */}
                <div className="nw-mute__pill nw-mute__pill--conf">
                    <AnimatePresence>
                        {hasInteracted && (
                            <motion.span
                                className="nw-mute__pill-label"
                                key="label-conf"
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.28, ease: "easeOut" }}
                            >
                                contexto conocido
                            </motion.span>
                        )}
                    </AnimatePresence>
                    <div className="nw-mute__pill-word">
                        {hero.confWord.slice(0, -1).split("").map((c, i) => (
                            <span key={i} className="nw-mute__fix">{displayChar(c)}</span>
                        ))}
                        <span className="nw-mute__pill-last nw-mute__pill-last--conf">
                            {displayChar(hero.confWord.slice(-1))}
                        </span>
                    </div>
                    <div className="nw-mute__pill-arrow">→</div>
                    <div className="nw-mute__pill-result nw-mute__pill-result--conf">
                        <span className="nw-mute__pct-big">{confPct}<span className="nw-mute__pct-unit">%</span></span>
                        <span className="nw-mute__pill-ch">
                            {hero.confFollower === " " ? "espacio" : displayChar(hero.confFollower)}
                        </span>
                    </div>
                </div>

                {/* Divisor — "1 letra distinta" */}
                <div className="nw-mute__vsep" aria-hidden>
                    <span className="nw-mute__vline" />
                    <span className="nw-mute__vtag">1 letra distinta</span>
                    <span className="nw-mute__vline" />
                </div>

                {/* Derecha: contexto nunca visto → muda */}
                <div className="nw-mute__pill nw-mute__pill--mute">
                    <AnimatePresence>
                        {hasInteracted && (
                            <motion.span
                                className="nw-mute__pill-label"
                                key="label-mute"
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.28, ease: "easeOut" }}
                            >
                                nunca visto
                            </motion.span>
                        )}
                    </AnimatePresence>
                    <div className="nw-mute__pill-word">
                        {hero.muteWord.slice(0, -1).split("").map((c, i) => (
                            <span key={i} className="nw-mute__fix">{displayChar(c)}</span>
                        ))}
                        <span className="nw-mute__pill-last nw-mute__pill-last--mute">
                            {displayChar(hero.muteLast)}
                        </span>
                    </div>
                    <div className="nw-mute__pill-arrow">→</div>
                    <div className="nw-mute__pill-result nw-mute__pill-result--mute">
                        <span className="nw-mute__pct-big nw-mute__pct-big--mute">0<span className="nw-mute__pct-unit">%</span></span>
                        <AnimatePresence>
                            {hasInteracted && (
                                <motion.span
                                    className="nw-mute__pill-verdict"
                                    key="verdict-muda"
                                    initial={{ opacity: 0, scale: 0.88 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.32, ease: "easeOut", delay: 0.08 }}
                                >
                                    muda
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* ════ GRID EXPLORABLE: la madriguera ════ */}
            {stem.length >= 1 && (
                <div className="nw-mute__rabbit">
                    <p className="nw-mute__rabbit-hint">
                        pasa el ratón para explorar — haz clic para navegar
                    </p>

                    <div
                        className="nw-mute__grid-wrap"
                        ref={gridRef}
                        onMouseLeave={() => { setHoverIdx(null); setTooltipPos(null); }}
                    >
                        {/* Tooltip flotante (near the hovered cell) */}
                        <AnimatePresence>
                            {hoveredCell && tooltipPos && (
                                <motion.div
                                    key={hoveredCell.ch}
                                    className="nw-mute__tip"
                                    data-seen={hoveredCell.total > 0 ? "1" : "0"}
                                    initial={{ opacity: 0, y: 6, scale: 0.94 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                                    transition={{ duration: 0.13, ease: "easeOut" }}
                                    style={{
                                        left: `${tooltipPos.x}px`,
                                        top: `${tooltipPos.y}px`,
                                    }}
                                >
                                    <span className="nw-mute__tip-word">
                                        {displayChar(hoveredCell.ctx)}
                                    </span>
                                    {hoveredCell.total > 0 ? (
                                        <>
                                            <span className="nw-mute__tip-sep">·</span>
                                            <span className="nw-mute__tip-seen">
                                                {hoveredCell.total.toLocaleString("es-ES")} veces
                                            </span>
                                            {hoveredFollower && (
                                                <>
                                                    <span className="nw-mute__tip-sep">→</span>
                                                    <span className="nw-mute__tip-follow">
                                                        {hoveredFollower.ch === " " ? "espacio" : displayChar(hoveredFollower.ch)}
                                                    </span>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <span className="nw-mute__tip-sep">·</span>
                                            <span className="nw-mute__tip-never">nunca visto → muda</span>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="nw-mute__grid">
                            {siblings.map((s, i) => {
                                const isCurrent = s.ch === lastCh;
                                const seen = s.total > 0;
                                return (
                                    <button
                                        key={s.ch}
                                        ref={(el) => { cellRefs.current[i] = el; }}
                                        className="nw-mute__cell"
                                        data-seen={seen ? "1" : "0"}
                                        data-current={isCurrent ? "1" : "0"}
                                        data-hover={hoverIdx === i ? "1" : "0"}
                                        data-space={s.ch === " " ? "1" : "0"}
                                        style={{ background: cellShade(s.total, rowMax) }}
                                        onMouseEnter={() => handleCellEnter(i)}
                                        onFocus={() => handleCellEnter(i)}
                                        onClick={() => { takeOver(stem + s.ch); }}
                                        aria-label={`${displayChar(s.ctx)} — ${seen ? `${s.total.toLocaleString("es-ES")} veces` : "nunca visto"}`}
                                    >
                                        <span className="nw-mute__cellch">
                                            {s.ch === " " ? "␣" : displayChar(s.ch)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Legend below grid — minimal */}
                        <div className="nw-mute__legend">
                            <span className="nw-mute__legcell nw-mute__legcell--never" />
                            <span className="nw-mute__legtxt">nunca visto</span>
                            <span className="nw-mute__legramp" aria-hidden />
                            <span className="nw-mute__legtxt">visto mucho</span>
                            <span className="nw-mute__legcell nw-mute__legcell--seen" />
                        </div>
                    </div>
                </div>
            )}

            {/* ════ CONTROLES (comprimidos) ════ */}
            <div className="nw-mute__controls">
                <button className="nw-mute__do" onClick={flip} aria-label="cambia una letra del final">
                    <span aria-hidden>↔</span>
                    {liveCtxIsSeen ? "cambia la última letra" : "prueba letra conocida"}
                </button>

                <div className="nw-mute__chips">
                    {SEEDS.map((c) => (
                        <button
                            key={c}
                            className="nw-mute__chip"
                            data-on={raw === c ? "1" : "0"}
                            onClick={() => { takeOver(c); }}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            <style>{`
                /* ── root ── */
                .nw-mute {
                    display: flex; flex-direction: column; align-items: center;
                    gap: 20px; width: 100%; max-width: 560px; margin: 0 auto; padding: 4px 0;
                }

                /* ════ HERO PAIR ════ */
                .nw-mute__pair {
                    display: flex; align-items: stretch; gap: 0;
                    width: 100%; border-radius: var(--ngram-r-lg);
                    background: var(--ngram-surface);
                    box-shadow: inset 0 0 0 1px var(--ngram-rule);
                    overflow: hidden;
                }

                /* each pill */
                .nw-mute__pill {
                    flex: 1; display: flex; flex-direction: column; align-items: center;
                    justify-content: center; gap: 6px; padding: 20px 16px 18px;
                }

                .nw-mute__pill--conf {
                    border-right: 1px solid var(--ngram-rule);
                }

                .nw-mute__pill-label {
                    font-family: ${MONO}; font-size: 9px; letter-spacing: .14em;
                    text-transform: uppercase; color: var(--ngram-dim);
                    white-space: nowrap;
                    /* Reserve the exact line height so the pill doesn't shift on reveal */
                    min-height: 1em;
                    display: block;
                }

                /* the word (fixed letters + accented last) */
                .nw-mute__pill-word {
                    display: flex; align-items: baseline; gap: 1px;
                    font-family: ${MONO}; font-size: clamp(16px, 3vw, 20px); font-weight: 700;
                }
                .nw-mute__fix { color: var(--ngram-ink-2); }

                .nw-mute__pill-last {
                    border-radius: 4px; padding: 1px 4px;
                }
                .nw-mute__pill-last--conf {
                    color: var(--ngram-on-accent); background: var(--ngram-accent);
                }
                .nw-mute__pill-last--mute {
                    color: var(--ngram-wrong); background: var(--ngram-wrong-soft);
                    box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--ngram-wrong) 50%, transparent);
                }

                .nw-mute__pill-arrow {
                    font-family: ${MONO}; font-size: 13px; color: var(--ngram-dim);
                }

                /* result: big % + predicted char */
                .nw-mute__pill-result {
                    display: flex; flex-direction: column; align-items: center; gap: 2px;
                }
                .nw-mute__pct-big {
                    font-family: ${MONO}; font-size: clamp(38px, 7vw, 56px); font-weight: 800;
                    line-height: .88; color: var(--ngram-accent-ink);
                    font-variant-numeric: tabular-nums;
                }
                .nw-mute__pct-big--mute { color: var(--ngram-wrong); }
                .nw-mute__pct-unit {
                    font-size: .42em; font-weight: 700;
                }
                .nw-mute__pill-ch {
                    font-family: ${MONO}; font-size: 12px; font-weight: 600;
                    color: var(--ngram-accent-ink); letter-spacing: .04em;
                }
                .nw-mute__pill-verdict {
                    font-family: ${SERIF}; font-size: 14px; font-weight: 800; font-style: italic;
                    color: var(--ngram-wrong); letter-spacing: -.01em;
                }

                /* vertical separator between pills */
                .nw-mute__vsep {
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    gap: 6px; padding: 0 2px; width: 52px; flex: none;
                    border-left: 1px solid var(--ngram-rule); border-right: 1px solid var(--ngram-rule);
                    background: var(--ngram-bg-2);
                }
                .nw-mute__vline {
                    width: 1px; flex: 1; background: var(--ngram-rule);
                    max-height: 20px;
                }
                .nw-mute__vtag {
                    font-family: ${MONO}; font-size: 8px; letter-spacing: .10em;
                    text-transform: uppercase; color: var(--ngram-muted); text-align: center;
                    line-height: 1.3; writing-mode: vertical-rl; transform: rotate(180deg);
                    white-space: nowrap;
                }

                /* ════ GRID EXPLORABLE ════ */
                .nw-mute__rabbit {
                    width: 100%; display: flex; flex-direction: column; align-items: center; gap: 10px;
                }

                .nw-mute__rabbit-hint {
                    font-family: ${MONO}; font-size: 9.5px; letter-spacing: .10em;
                    text-transform: uppercase; color: var(--ngram-dim);
                    text-align: center;
                }

                .nw-mute__grid-wrap {
                    position: relative; width: 100%; max-width: 460px;
                    display: flex; flex-direction: column; align-items: center; gap: 10px;
                }

                /* ── Tooltip ── */
                .nw-mute__tip {
                    position: absolute;
                    /* anchor: horizontally centered on cell, above it */
                    transform: translate(-50%, calc(-100% - 10px));
                    z-index: 20;
                    display: flex; align-items: center; gap: 5px;
                    padding: 7px 11px; border-radius: 8px;
                    background: var(--ngram-surface);
                    box-shadow: 0 4px 20px color-mix(in oklab, var(--ngram-ink) 22%, transparent),
                                inset 0 0 0 1px var(--ngram-rule);
                    white-space: nowrap; pointer-events: none;
                    font-family: ${MONO}; font-size: 12px;
                }
                .nw-mute__tip::after {
                    content: '';
                    position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%);
                    width: 9px; height: 5px;
                    background: var(--ngram-surface);
                    clip-path: polygon(0 0, 100% 0, 50% 100%);
                }
                .nw-mute__tip-word {
                    font-weight: 700; color: var(--ngram-ink);
                }
                .nw-mute__tip-sep { color: var(--ngram-dim); }
                .nw-mute__tip-seen { color: var(--ngram-accent-ink); font-weight: 600; }
                .nw-mute__tip-follow { color: var(--ngram-accent-ink); font-weight: 700; }
                .nw-mute__tip-never { color: var(--ngram-wrong); font-weight: 700; }
                .nw-mute__tip[data-seen="1"] .nw-mute__tip-word { color: var(--ngram-accent-ink); }

                /* ── Grid ── */
                .nw-mute__grid {
                    display: grid; grid-template-columns: repeat(9, 1fr); gap: 5px; width: 100%;
                }
                .nw-mute__cell {
                    aspect-ratio: 1; border-radius: 6px; border: 0; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; padding: 0;
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-ink) 9%, transparent);
                    transition: transform .10s ease, box-shadow .12s ease;
                    position: relative;
                }
                .nw-mute__cell[data-seen="0"] .nw-mute__cellch {
                    color: color-mix(in oklab, var(--ngram-dim) 65%, transparent);
                }
                .nw-mute__cell[data-seen="1"] .nw-mute__cellch {
                    color: var(--ngram-on-accent); font-weight: 800;
                }
                .nw-mute__cellch {
                    font-family: ${MONO}; font-size: 12px; line-height: 1;
                }
                .nw-mute__cell[data-space="1"] .nw-mute__cellch { font-size: 13px; }
                .nw-mute__cell[data-hover="1"] {
                    transform: translateY(-2px) scale(1.12);
                    box-shadow: 0 4px 14px color-mix(in oklab, var(--ngram-accent) 30%, transparent),
                                inset 0 0 0 1.5px var(--ngram-accent-ink);
                    z-index: 2;
                }
                .nw-mute__cell[data-hover="1"][data-seen="0"] {
                    box-shadow: 0 4px 14px color-mix(in oklab, var(--ngram-wrong) 25%, transparent),
                                inset 0 0 0 1.5px var(--ngram-wrong);
                }
                .nw-mute__cell[data-current="1"] {
                    box-shadow: inset 0 0 0 2px var(--ngram-ink);
                }
                .nw-mute__cell[data-current="1"][data-seen="0"] {
                    box-shadow: inset 0 0 0 2px var(--ngram-wrong);
                }

                /* ── Legend ── */
                .nw-mute__legend {
                    display: flex; align-items: center; gap: 7px;
                    font-family: ${MONO}; font-size: 9.5px; letter-spacing: .06em;
                    text-transform: uppercase; color: var(--ngram-dim);
                }
                .nw-mute__legcell {
                    width: 13px; height: 13px; border-radius: 4px; flex: none;
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-ink) 10%, transparent);
                }
                .nw-mute__legcell--never { background: var(--ngram-bg-2); }
                .nw-mute__legcell--seen { background: var(--ngram-accent-bright); }
                .nw-mute__legramp {
                    width: 54px; height: 8px; border-radius: 4px; flex: none;
                    background: linear-gradient(90deg, var(--ngram-bg-2), var(--ngram-accent-bright));
                }
                .nw-mute__legtxt { white-space: nowrap; }

                /* ════ CONTROLES ════ */
                .nw-mute__controls {
                    display: flex; flex-direction: column; align-items: center; gap: 10px; width: 100%;
                }
                .nw-mute__do {
                    display: inline-flex; align-items: center; gap: 9px;
                    font-family: ${MONO}; font-size: 13px; font-weight: 700; letter-spacing: .01em;
                    color: var(--ngram-on-accent); background: var(--ngram-accent);
                    border: 0; border-radius: var(--ngram-r-pill); padding: 10px 22px; cursor: pointer;
                    box-shadow: 0 2px 10px color-mix(in oklab, var(--ngram-accent) 32%, transparent);
                    transition: transform .12s ease, background .15s ease, box-shadow .15s ease;
                }
                .nw-mute__do:hover {
                    transform: translateY(-1px); background: var(--ngram-accent-2);
                    box-shadow: 0 4px 16px color-mix(in oklab, var(--ngram-accent) 40%, transparent);
                }
                .nw-mute__do:active { transform: translateY(0); }

                .nw-mute__chips {
                    display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;
                }
                .nw-mute__chip {
                    font-family: ${MONO}; font-size: 12px; padding: 5px 12px;
                    border-radius: var(--ngram-r-pill);
                    border: 1px solid var(--ngram-rule-2); background: transparent;
                    color: var(--ngram-muted); cursor: pointer;
                    transition: background .15s ease, color .15s ease, border-color .15s ease;
                }
                .nw-mute__chip:hover {
                    color: var(--ngram-ink-2); border-color: var(--ngram-accent-ink);
                }
                .nw-mute__chip[data-on="1"] {
                    background: var(--ngram-accent-soft); color: var(--ngram-accent-ink);
                    border-color: color-mix(in oklab, var(--ngram-accent) 45%, transparent);
                    font-weight: 700;
                }

                @media (max-width: 460px) {
                    .nw-mute__grid { grid-template-columns: repeat(7, 1fr); }
                    .nw-mute__pill { padding: 16px 10px; }
                    .nw-mute__pct-big { font-size: clamp(30px, 6vw, 44px); }
                    .nw-mute__vtag { font-size: 7px; }
                    .nw-mute__legramp { width: 38px; }
                }
            `}</style>
        </div>
    );
});

export default MuteSlot;
