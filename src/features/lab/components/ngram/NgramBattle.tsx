"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";

import { useReducedMotion } from "framer-motion";

import { CaptionLine, GhostButton, MONO, PlayButton, Tabs } from "@/features/lab/components/ngram/kit";
import { generateLocal } from "@/features/lab/data/ngramData";

/**
 * §3 · NgramBattle — the jump felt (kit + ngramData, LOCAL generation, no backend).
 *
 * ONE idea: more letters of memory → more legible text. Four columns generate from the SAME seed, each
 * allowed to remember one more letter than the column to its left. k=1 is letter soup; k=4 almost hits
 * phrases. The reader changes the seed and replays. Every column is real local generation over the
 * Shakespeare counts (generateLocal with backoff), so the leap from gibberish to words is honest, not faked.
 *
 * Showpiece (PLAY + a staggered typewriter reveal). Reduced-motion shows the finished text instantly.
 * Minimal in-widget text; the framing is in the narrative body.
 */

const SEEDS = ["the ", "my lord ", "love "];
const LEVELS = [
    { k: 1, label: "1 letra", quality: "sopa de letras" },
    { k: 2, label: "2 letras", quality: "sílabas sueltas" },
    { k: 3, label: "3 letras", quality: "palabras de verdad" },
    { k: 4, label: "4 letras", quality: "casi frases" },
];
const GEN_LEN = 170;
const REVEAL_MS = 3600;

export const NgramBattle = memo(function NgramBattle({ accent }: { accent?: "ngram" }) {
    void accent;
    const reduce = useReducedMotion();
    const [seedIdx, setSeedIdx] = useState(0);
    const [runId, setRunId] = useState(0); // 0 = idle; each play/regenerate bumps it
    const [shown, setShown] = useState(0);
    const rafRef = useRef<number | null>(null);

    const seed = SEEDS[seedIdx];

    const results = useMemo(() => {
        if (runId === 0) return null;
        return LEVELS.map((lv) =>
            generateLocal(seed, { k: lv.k, length: GEN_LEN, temperature: 0.7, rngSeed: 90000 * runId + lv.k * 131 + seedIdx * 17 }),
        );
    }, [runId, seedIdx, seed]);

    const maxLen = results ? Math.max(...results.map((r) => r.length)) : 0;

    useEffect(() => {
        if (runId === 0 || reduce || maxLen === 0) return;
        let t0: number | null = null;
        const frame = (now: number) => {
            if (t0 === null) t0 = now;
            const k = Math.min(1, (now - t0) / REVEAL_MS);
            setShown(Math.floor(k * maxLen));
            if (k < 1) rafRef.current = requestAnimationFrame(frame);
        };
        rafRef.current = requestAnimationFrame(frame);
        return () => {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        };
    }, [runId, reduce, maxLen]);

    const displayShown = reduce ? maxLen : shown;
    const typing = runId > 0 && displayShown < maxLen;

    const play = () => { setShown(0); setRunId((r) => r + 1); };

    return (
        <div className="nw-bt">
            {/* seed + action */}
            <div className="nw-bt__top">
                <Tabs tabs={SEEDS.map((s) => `«${s.trim()}»`)} active={seedIdx} onChange={(i) => { setSeedIdx(i); setShown(0); setRunId((r) => (r === 0 ? 0 : r + 1)); }} ariaLabel="Semilla" />
                {runId === 0 ? (
                    <PlayButton onClick={play}>generar las cuatro</PlayButton>
                ) : (
                    <GhostButton onClick={play}>otra vez</GhostButton>
                )}
            </div>

            {/* the four columns */}
            <div className="nw-bt__grid">
                {LEVELS.map((lv, i) => {
                    const text = results ? results[i].slice(0, displayShown) : "";
                    return (
                        <div key={lv.k} className="nw-bt__col" data-best={lv.k === 4 ? "1" : "0"}>
                            <div className="nw-bt__head">
                                <span className="nw-bt__k">{lv.label}</span>
                                <span className="nw-bt__q">{lv.quality}</span>
                            </div>
                            <div className="nw-bt__body">
                                {results ? (
                                    <p className="nw-bt__text">
                                        <span className="nw-bt__seed">{seed}</span>
                                        {text}
                                        {typing && <span className="nw-bt__caret" aria-hidden>▌</span>}
                                    </p>
                                ) : (
                                    <p className="nw-bt__idle">«{seed.trim()}» …</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {runId === 0 && (
                <CaptionLine gap={0}>misma semilla, una letra más de memoria en cada columna</CaptionLine>
            )}

            <style>{`
                .nw-bt { display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%; }
                .nw-bt__top { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; justify-content: center; }
                .nw-bt__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; width: 100%; }
                @media (max-width: 720px) { .nw-bt__grid { grid-template-columns: repeat(2, 1fr); } }
                @media (max-width: 380px) { .nw-bt__grid { grid-template-columns: 1fr; } }
                .nw-bt__col {
                    display: flex; flex-direction: column; border-radius: var(--ngram-r-md);
                    background: color-mix(in oklab, var(--ngram-surface) 55%, var(--ngram-bg));
                    border: 1px solid var(--ngram-rule); overflow: hidden;
                }
                .nw-bt__col[data-best="1"] { border-color: color-mix(in oklab, var(--ngram-accent) 38%, transparent); }
                .nw-bt__head { display: flex; flex-direction: column; gap: 2px; padding: 11px 13px 9px; border-bottom: 1px solid var(--ngram-rule); }
                .nw-bt__k { font-family: ${MONO}; font-size: 12px; font-weight: 700; letter-spacing: .04em; color: var(--ngram-accent-ink); }
                .nw-bt__q { font-family: ${MONO}; font-size: 9.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--ngram-dim); }
                .nw-bt__body { padding: 13px; min-height: 168px; }
                .nw-bt__text { font-family: ${MONO}; font-size: 12.5px; line-height: 1.75; color: var(--ngram-ink-2); margin: 0; word-break: break-word; white-space: pre-wrap; }
                .nw-bt__seed { color: var(--ngram-accent); font-weight: 700; }
                .nw-bt__caret { color: var(--ngram-accent-bright); animation: nwBtCaret 1s steps(1) infinite; }
                @keyframes nwBtCaret { 50% { opacity: 0; } }
                .nw-bt__idle { font-family: ${MONO}; font-size: 12.5px; color: var(--ngram-dim); margin: 0; }
            `}</style>
        </div>
    );
});

export default NgramBattle;
